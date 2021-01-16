( function () {

    "use strict";

    window.love2dev = window.love2dev || {};

    var self = window.love2dev.component;

    var username;

    var $confirmMsg = $( ".feedback-message" ),
        $confirmMsgP = $( ".feedback-message p" ),
        $btnConofirmAcct = $( ".btn-confirm-account");

    var $username = $( "[name='Username']" );

    function initialize() {

        // get username from queryString
        var qs = self.queryStringtoJSON();

        if ( qs && qs.username ) {

            username = qs.username;

            $username.value(username);

        }

        bindEvents();

    }

    function bindEvents() {

        $username.on( [love2dev.events.keyup, love2dev.events.blur], toggleEnable );

        $btnConofirmAcct.toggleDisabled(false );

        $btnConofirmAcct.on( love2dev.events.click, handleConfirmation );
        $( ".btn-resend-code" ).on( love2dev.events.click, resendCode );
        $( ".btn-verification-submit" ).on( love2dev.events.click, acknowledgeConfirm );

    }


    function toggleEnable( e ) {

        e.preventDefault();

        $btnConofirmAcct.toggleDisabled(btn.disabled );

        return false;

    }

    function resendCode( e ) {

        e.preventDefault();

        if ( $username[0].checkValidity() ) {

            love2dev.auth.resendConfirmationCode( {
                    "username": $username.value()
                } )
                .then( function ( msg ) {

                    $confirmMsgP.removeClass( "text-danger" );

                    $confirmMsg.addClass( "show" );

                    if ( msg.__type ) { //error

                        $confirmMsgP.text(msg.message);
                        $confirmMsgP.addClass( "text-danger" );

                    } else {

                        $confirmMsgP.text("A new confirmation code has been sent to your e-mail address: " + msg.CodeDeliveryDetails.Destination);

                    }

                } )
                .catch(function(err){

                    $confirmMsgP.text(err.message);
                    $confirmMsgP.addClass( "show" ).addClass( "text-danger" );

                });

        } else {
            //display error response
            console.log( "broken" );
        }

        return false;

    }

    function handleConfirmation( e ) {

        e.preventDefault();

        var $confirmationCode = $( "[name='ConfirmationCode']" );

        if ( $username[0].checkValidity() && $confirmationCode[0].checkValidity() ) {

            love2dev.auth.confirmRegistration( {
                    "username": $username.value(),
                    "confirmationCode": $confirmationCode.value()
                } )
                .then( function ( msg ) {

                    if ( msg.status > 300 ) { //error

                        $confirmMsg.addClass( "show" );
                        $confirmMsgP.text(msg.message);
                        $confirmMsgP.addClass( "text-danger" );

                    } else {

                        showConfirmationPanel();

                    }

                } )
                .catch(function(err){

                    $confirmMsgP.text(err.message);
                    $confirmMsgP.addClass( "show" ).addClass( "text-danger" );

                });

        } else {
            //display error response
            console.log( "broken" );
            $confirmMsg.addClass( "show" );
            $confirmMsgP.text("network connection error, you may be offline");
            $confirmMsgP.addClass( "text-danger" );

        }

        return false;
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