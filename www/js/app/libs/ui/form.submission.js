( function ( window, undefined ) {

    "use strict";

    var formSubmission = function ( config ) {

        return new formSubmission.fn.init( config );
    };

    function setObjValue( obj, prop, value ) {

        if ( typeof prop === "string" ) {
            prop = prop.split( "." );
        }

        if ( prop.length > 1 ) {

            var e = prop.shift();

            setObjValue( obj[ e ] =
                Object.prototype.toString.call( obj[ e ] ) === "[object Object]" ?
                obj[ e ] : {},
                prop,
                trim( value ) );

        } else {
            obj[ prop[ 0 ] ] = trim( value );
        }

    }

    function trim( value ) {
        if ( typeof value === "string" ) {
            value = value.trim();
        }

        return value;
    }

    formSubmission.fn = formSubmission.prototype = {

        constructor: formSubmission,

        init: function ( config ) {

            var self = this;

            self.config = Object.assign( {}, self.options, config );

            if ( self.config.src ) {
                self.populate( self.config.src );
            }

            if ( typeof self.config.form === "string" ) {

                self.config.form = document.querySelector( self.config.form );

            }

            self.setupformSubmission();

            return self;
        },

        version: "0.0.1",

        setupformSubmission: function () {

            var self = this;

            if ( typeof self.config.form === "string" ) {

                self.config.form = document.querySelector( self.config.form );

            }

            self.setup = ( self.config.targetURL &&
                self.config.targetURL.length > 0 &&
                self.config.form );

            self.config.form.addEventListener( "submit", function ( e ) {

                e.preventDefault();
                e.stopPropagation();

                var form = event.currentTarget;

                if ( self.config.submitAction ) {

                    self.config.submitAction( form );

                } else {

                    self.submitForm( form );

                }

                form.classList.add( "was-validated" );

                return false;

            } );

        },

        setTargetURL: function ( url ) {

            this.config.targetURL = url;

        },

        populate: function ( obj ) {

            Object.entries( obj )
                .map( ( pair, id ) => {

                    let $ele = document.querySelector( "[name='" + pair[ 0 ] + "']" );

                    if ( $ele && $ele.type !== "file" ) {

                        switch ( $ele.type ) {
                            case "checkbox":

                                $ele.checked = ( pair[ 1 ] === true || pair[ 1 ] === "true" );

                                break;

                            default:

                                $ele.value = pair[ 1 ];
                                break;

                        }

                    }

                } );

        },

        serialize: function ( form ) {

            var self = this,
                i, j, q = {};

            if ( !form ) {

                form = self.config.form;

            }

            if ( typeof form === "string" ) {

                form = document.querySelector( form );

            }

            if ( !form || form.nodeName !== "FORM" ) {

                console.log( "no valid form supplied" );

                return;
            }

            for ( i = 0; i < form.elements.length; i++ ) {

                var element = form.elements[ i ];

                if ( element.name === "" ) {
                    continue;
                }

                switch ( element.nodeName ) {

                    case 'INPUT':
                        switch ( element.type ) {
                            case 'text':
                            case 'hidden':
                            case 'password':
                            case 'button':
                            case 'reset':
                            case 'submit':
                            case 'tel':
                            case 'email':
                            case 'date':
                            case 'datetime':
                            case 'range':
                            case 'number':
                            case 'url':
                            case 'search':
                                setObjValue( q, element.name, element.value );
                                break;
                            case 'checkbox':
                            case 'radio':
                                setObjValue( q, element.name, element.checked );
                                break;
                        }
                        break;
                    case 'file':
                        break;
                    case 'TEXTAREA':
                        setObjValue( q, element.name, element.value );
                        break;
                    case 'SELECT':
                        switch ( element.type ) {
                            case 'select-one':
                                setObjValue( q, element.name, element.value );
                                break;
                            case 'select-multiple':
                                for ( j = element.options.length - 1; j >= 0; j = j - 1 ) {
                                    if ( element.options[ j ].selected ) {
                                        setObjValue( q, element.name, encodeURIComponent( element.options[ j ].value ) );
                                    }
                                }
                                break;
                        }
                        break;

                }
            }

            return q;

        },

        isValid: function ( form ) {

            return form.checkValidity();

        },

        submitForm: function ( form ) {

            var self = this;

            if ( self.isValid( form ) ) {

                love2dev.http.post( {
                        url: self.config.targetURL,
                        body: JSON.stringify( self.serialize() )
                    } )
                    .then( function ( response ) {

                        if ( response.ok ) {

                            console.log( response.text() );

                        }

                    } );

            } else {

                var firstInvalid = form.querySelector( "input:invalid, textarea:invalid" );

                if ( firstInvalid ) {

                    firstInvalid.focus();

                }

            }

        },

        setup: false,

        options: {
            targetURL: "",
            form: "form",
            submit: ".btn-submit"
        }

    };

    // Give the init function the formSubmission prototype for later instantiation
    formSubmission.fn.init.prototype = formSubmission.fn;

    formSubmission.serialize = formSubmission.fn.serialize;
    formSubmission.populate = formSubmission.fn.populate;

    window.formSubmission = formSubmission;
    window.serializeForm = formSubmission.fn.serialize;

}( window ) );