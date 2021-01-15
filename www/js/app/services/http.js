/*

love2dev.http

*/


( function ( window ) {

    window.love2dev = window.love2dev || {};

    function getBody( options ) {

        if ( !options.ContentType || options.ContentType.includes( "application/json" ) ) {

            if ( options.body && typeof options.body === "object" ) {
                options.body = JSON.stringify( options.body );
            }

        }

        return options;
    }

    /** @function cacheTTLValue
        options: {
            key: lookup key
            value: value
            ttl: # of seconds till data becomes stale
        }
    */
    function cacheTTLValue( options ) {

        return cacheValue( options )
            .then( function () {

                if ( options.ttl && !Number.isNaN( options.ttl ) ) {

                    var now = new Date().getTime();

                    return localforage.setItem( options.key + "-ttl", now + ( options.ttl * 1000 ) );

                }

                return;

            } );

    }

    function cacheValue( options ) {

        return localforage.setItem( options.key, options.value );

    }

    function getToken() {

        return love2dev.auth.getIdToken()
            .then( function ( token ) {

                if ( token ) {
                    //user/
                    return {
                        //"Groups": groups,
                        "Authorization": "Bearer " + token
                    };

                } else {
                    love2dev.auth.goToLogin();
                }

            } );

    }

    function sendFetch(options, api) {

        let url = options.url;

        delete options.url;
        delete options.authorized;

        return fetch(url, options)
            .then(api.validateResponse);

    }

    window.love2dev.http = {

        baseUrl: "/",

        cacheValue: cacheValue,

        cacheTTLValue: cacheTTLValue,

        deleteCacheValue: function ( key ) {

            return localforage.removeItem( key )
                .then( function () {

                    return localforage.removeItem( key + "-ttl" );

                } );

        },

        checkCachedValue: function ( key ) {

            return localforage.getItem( key );

        },

        checkCachedValueStaleness: function ( key, forceRefresh ) {

            var self = this;

            return onlineStatus.getOnlineState()
                .then(function (state) {

                    if (!state.available) {
                        //return true if offline. We don't want to block the user when we can't refresh the token
                        return localforage.getItem(key);
                    }

                    if(forceRefresh){
                        return Promise.resolve();
                    }

                    return self.checkCachedValue( key + "-ttl" )
                        .then( function ( ttl ) {

                            var d1 = new Date();
                            var d2 = new Date( ttl );

                            if ( !ttl || d1 < d2 ) {

                                return localforage.getItem( key );
                            }

                            return;

                        } );

            });

        },

        cacheAndFetch: function ( options ) {

            var self = this;

            return self.checkCachedValueStaleness( options.key, options.forceRefresh )
                .then( function ( value ) {

                    if ( value ) {

                        return value;

                    }

                    return self.get( options )
                        .then( function ( response ) {

                            if ( response && response.ok ) {

                                return response.json()
                                    .then( function ( value ) {

                                        if ( value ) {

                                            if ( typeof value === "string" ) {

                                                value = JSON.parse( value );

                                            }

                                            return cacheTTLValue( {
                                                    key: options.key,
                                                    value: value,
                                                    ttl: options.ttl
                                                } )
                                                .then( function () {
                                                    return value;
                                                } );

                                        } else {

                                            return value;

                                        }

                                    } );
                                    
                            } else {
                                return response.json();
                            }

                        } );

                } );

        },

        postAndClearCache: function ( options ) {

            return this.post( options )
                .then( function ( response ) {

                    if ( response.ok ) {

                        return response.json()
                            .then( function ( result ) {

                                var item = result.Item || result;

                                if ( options.key ) {

                                    return localforage.removeItem( options.key )
                                        .then( function () {

                                            return item;

                                        } );

                                } else {

                                    return item;

                                }

                            } );

                    }

                } );

        },

        validateResponse: function ( response ) {

            switch ( response.status ) {

                // case 500:

                //     location.replace( "error/" );
                //     break;

                case 401:
                case 403:
                    //no authentication

                    console.log( "no authentication" );

                    return response;

                    break;
                    // ...

                    // case 0: //opaque cross origin request
                    // case 200: //good response
                    // case 201: //object created
                    // case 202: //good but processing is still happening. Poll to update process
                    // case 204: //no record
                    // case 205: //Email Already exist.
                    // case 300: //record exists
                    // case 404: //not found
                    // case 406: //please register yourself
                default:

                    return response;

            }

        },

        setHeaders: function ( ContentType ) {

            var myHeaders = {};

            if ( ContentType ) {
                myHeaders[ "Content-Type" ] = ContentType;
            } else {
                myHeaders[ "Content-Type" ] = "application/json; charset:utf-8";
            }

            if (ContentType && ContentType.toLowerCase() === "multipart/form-data") {
                delete myHeaders["Content-Type"];
            }

            myHeaders.Accept = "application/json, text/plain, */*";

            return myHeaders;
        },

        fetch: function ( options ) {

            var api = this;

            if ( !options.headers ) {

                options.headers = api.setHeaders( options.ContentType );

            }

            options = Object.assign( {}, {
                method: "GET"
                //,mode: 'cors'
            }, options );

            if ( options.authorized ) {

                return getToken()
                    .then( function ( token ) {

                        if ( token ) {

                            options.headers = Object.assign( {}, options.headers, token );
                            
                            return sendFetch(options, api);

                        } else {

                            return new Response(JSON.stringify({
                                "message": "not authenticated"
                            }), {
                                "status": 401,
                                "statusText": "no authentication token available"
                            });

                        }

                    } );

            } else {
               
                return sendFetch(options, api);

            }

        },

        get: function ( options ) {

            options.method = "GET";

            return this.fetch( options );

        },

        patch: function ( options ) {

            options.method = "PATCH";

            options = getBody( options );

            return this.fetch( options );

        },

        post: function ( options ) {

            options.method = "POST";

            options = getBody( options );

            return this.fetch( options );

        },

        put: function ( options ) {

            options.method = "PUT";

            options = getBody( options );

            return this.fetch( options );

        },

        delete: function ( options ) {

            options.method = "DELETE";

            if ( options.id && typeof options.id === "object" ) {
                options.id = ( options.id );
            }
            return this.fetch( options );

        },

        getBody: getBody

    };

} )( this );