( function () {

    "use strict";

    window.love2dev = window.love2dev || {};

    var self = window.love2dev.component;

    var username = "",
        $username = $( "[name='Username']" ),
        $btn = $( ".btn-forgot-password" );

    function initialize() {

        // get username from queryString
        var qs = self.queryStringtoJSON();

        if ( qs && qs.username ) {

            username = qs.username;
            $username.value(username);
        }

        setupForm();

    }

    function setupForm() {

        $btn.toggleDisabled(username && username !== "");

        $username.on( [love2dev.events.keyup, love2dev.events.blur], toggleEnable );

        $( ".btn-forgot-password" ).on( love2dev.events.click, handleRequest );
    
    }

    function toggleEnable( e ) {

        e.preventDefault();

        $btn.toggleDisabled( e.target.value === "" );

        return false;

    }

    function handleRequest( e ) {

        e.preventDefault();

        if ( $username[0].checkValidity() ) {

            return love2dev.auth.forgotPassword( {username:$username.value()} )
                .then( function ( response ) {

                    var $confirmMsg = $( ".error-message" );

                    $confirmMsg.removeClass( "text-danger" );

                    if ( !response.message ) {

                        var root = siteConfig.base || "/";

                        location.href = root + "login/forgot-password/confirm/?username=" + $username.value();

                    } else {

                        $errorMessage.text(response.message);
                        $confirmMsg.addClass( "text-danger show" );

                    }

                } );

        } else {
            //display error response
            console.log( "invalid form" );
        }

        return false;

    }

    initialize();

} )();