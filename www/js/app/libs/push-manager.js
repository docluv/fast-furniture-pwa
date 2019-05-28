( function () {

    "use strict"; //https://love2dev.com/blog/javascript-strict-mode/

    //push key
    var applicationServerPublicKey = "BJlCl5-g8VzsdZIOjTDecoQ75zpCq4vJxyYFW8fp-SgEQqSPAeTPd8a-QGbkQetBGbMG2vM0MwH1vTvDA6ZX_-g";

    var pushMgr = {

        swRegistration: undefined,

        _isSubscribed: false,

        askPermission: function () {

            return new Promise( function ( resolve, reject ) {

                const permissionResult =
                    Notification.requestPermission( function ( result ) {
                        resolve( result );
                    } );

                if ( permissionResult ) {
                    permissionResult.then( resolve, reject );
                }

            } );
            // .then(function (permissionResult) {
            //     if (permissionResult !== 'granted') {
            //         throw new Error('We weren\'t granted permission.');
            //     }
            // });
        },

        updateSubscriptionOnServer: function ( subscription ) {
            // TODO: Send subscription to application server

            console.log( "user subscription state set ", !!subscription );

            console.log( 'Received PushSubscription: ', JSON.stringify( subscription ) );

            return;
        },

        getSubscription: function () {

            return navigator.serviceWorker.getRegistration()
                .then( function ( registration ) {

                    return registration.pushManager.getSubscription();

                } );

        },

        getIsSubscribed: function () {

            var self = this;

            return self.getSubscription()
                .then( function ( subscription ) {

                    self._isSubscribed = ( subscription );

                    return self._isSubscribed;

                } );

        },

        initialisePush: function () {
            // Set the initial subscription value

            var self = this;

            if ( self.swRegistration ) {

                self.getSubscription()
                    .then( function ( subscription ) {

                        if ( !subscription ) {
                            self.subscribeUser();
                        }

                    } );

            }

        },

        urlB64ToUint8Array: function ( base64String ) {
            //assume const support if push is supported ;)
            var padding = '='.repeat( ( 4 - base64String.length % 4 ) % 4 ),
                base64 = ( base64String + padding )
                .replace( /\-/g, '+' )
                .replace( /_/g, '/' ),

                rawData = window.atob( base64 ),
                outputArray = new Uint8Array( rawData.length );

            for ( var i = 0; i < rawData.length; ++i ) {
                outputArray[ i ] = rawData.charCodeAt( i );
            }

            return outputArray;

        },

        unsubscribeUser: function () {

            var self = this;

            self.getSubscription()
                .then( function ( subscription ) {

                    return subscription.unsubscribe();

                } )
                .catch( function ( error ) {
                    console.log( 'Error unsubscribing', error );
                } )
                .then( function () {

                    self.updateSubscriptionOnServer( null );

                    self.isSubscribed = false;

                } );

        },

        subscribeUser: function () {

            var self = this;

            self.getIsSubscribed()
                .then( function ( subscription ) {

                    self.askPermission()
                        .then( function ( permission ) {

                            if ( permission ) {

                                self.swRegistration.pushManager.subscribe( {
                                    userVisibleOnly: true,
                                    applicationServerKey: self.urlB64ToUint8Array( applicationServerPublicKey )
                                } ).then( function ( subscription ) {

                                    console.log( 'User is now subscribed.' );

                                    self.updateSubscriptionOnServer( subscription );

                                    self._isSubscribed = true;

                                } ).catch( function ( err ) {
                                    console.log( 'dang, Failed to subscribe the user: ', err );
                                } );

                            }

                        } );

                } );

        }

    };

    window.pushMgr = pushMgr;

} )();