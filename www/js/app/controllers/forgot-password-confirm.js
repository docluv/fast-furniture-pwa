( function () {

    "use strict";

    window.love2dev = window.love2dev || {};

    var self = window.love2dev.component;

    var username,
        $errorMessage = $( ".error_message" ),
        $errorWrapper = $( ".login-form-error" );

    var $username = $( "[name='Username']" ),
        $password = $( "[name='Password']" ),
        $ConfirmationCode = $( "[name='ConfirmationCode']" );

    function initialize() {

        // get username from queryString
        var qs = self.queryStringtoJSON();

        if ( qs && qs.username ) {

            username = qs.username;

            $username.value(username);

            showConfirmation();

        }

    }

    function showConfirmation() {

        $username.value(username);

        $username.on( [love2dev.events.keyup, love2dev.events.blur], toggleEnable );
        $password.on( [love2dev.events.keyup, love2dev.events.blur], toggleEnable );
        $ConfirmationCode.on( [love2dev.events.keyup, love2dev.events.blur], toggleEnable );

        $( "[name='btn-update-password']" ).on( love2dev.events.click, handleConfirmation );

        $( ".btn-resend-code" ).on( love2dev.events.click, resendCode );

        $( ".btn-verification-submit" ).on( love2dev.events.click, acknowledgeConfirm );

    }

    function toggleEnable( e ) {

        e.preventDefault();

        var $btn = $( "[name='btn-update-password']" );

        $btn.toggleDisabled( !isValid());

        return false;

    }

    function resendCode( e ) {

        e.preventDefault();

        if ( $username[0].checkValidity() ) {

            love2dev.auth.recoverPassword(  $username.value() )
                .then( function ( msg ) {

                    $errorMessage.removeClass( "text-danger" );

                    $errorWrapper.removeClass( love2dev.cssClasses.dNone );

                    if ( msg.__type ) { //error

                        $errorMessage.innerText = msg.message;
                        $errorMessage.addClass( "text-danger" );

                    } else {

                        $errorMessage.text("A new confirmation code has been sent to your e-mail address: " +
                            msg.CodeDeliveryDetails.Destination);

                    }

                } );

        } else {
            //display error response
            console.log( "broken" );
        }

        return false;

    }

    function isValidPassword() {
        
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/.test( $password.value() );

    }

    function isValid(){

        return $username[0].checkValidity() &&
            $ConfirmationCode[0].checkValidity() &&
            $password[0].checkValidity() && isValidPassword();

    }

    function handleConfirmation( e ) {

        e.preventDefault();

        if ( isValid()) {

            love2dev.auth.confirmPassword( {
                    "username": $username.value(),
                    "newPassword": $password.value(),
                    "confirmationCode": $ConfirmationCode.value()
                } )
                .then( function ( response ) {

                    if ( response.__type || response.status > 300 ) {

                        showError( response.message );

                        if(response.__type === "CodeMismatchException"){
                            $ConfirmationCode[0].focus();
                        }

                    } else {

                        showConfirmationPanel();

                    }

                } )
                .catch( function ( err ) {
                    console.log( err );

                    showError( "network connection error, you may be offline" );

                } );

        } else {
            //display error response
            console.log( "broken" );
        }

        return false;
    }

    function showError( message ) {

        $errorWrapper.removeClass( love2dev.cssClasses.dNone );

        $errorMessage.addClass( "text-danger" );

        $errorMessage.html(message);
    }

    function showConfirmationPanel() {

        var $confirmPnl = $( ".confirmation-panel" ),
            $confirmForm = $( ".confirmation-form" );

        $confirmPnl.addClass( love2dev.cssClasses.dFlex ).removeClass( love2dev.cssClasses.dNone );

        $confirmForm.removeClass( love2dev.cssClasses.dFlex ).addClass( love2dev.cssClasses.dNone );

    }

    function acknowledgeConfirm() {
        love2dev.auth.goToLogin();
    }

    initialize();

} )();