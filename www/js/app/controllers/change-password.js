( function () {

    "use strict";

    window.love2dev = window.love2dev || {};

    function initialize() {

        bindEvents();

    }

    function bindEvents() {

        $( ".loginform" ).on( love2dev.events.submit, handleLogin, false );

    }

    function handleLogin( e ) {

        e.preventDefault();

        var $username = $( "[name='Username']" ),
            $password = $( "[name='Password']" );

        loginUser( $username.value(), $password.value() );

        return false;
    }

    function handleRejection( reject ) {

        if ( reject.__type ) {

            if ( reject.__type === "UserNotFoundException" ) {

                showError(reject.message);

            } else if ( reject.ChallengeName ) {

                showError(reject.message);

            }

        }

    }

    function showError(message){

        $(".login-form-error").removeClass("d-none");
        $(".error_message").text(message);
    }

    function loginUser( username, password ) {

        return love2dev.auth.loginUser( username, password )
            .then( function ( token ) {

                return love2dev.auth
                    .setUserAttributes( token )
                    .then( function () {
                        return token;
                    } );

            } )
            .then( function ( token ) {

                return love2dev.auth.setCognitoGroups( token[ cognitoGroups ] );

            } )
            .then( function () {

                return love2dev.auth.getUserData( true );

            } )
            .then( function () {

                var root = siteConfig.base || "/";

                location.href = root + "profile/";

            } )
            .catch( handleRejection );

    }

    initialize();

} )();