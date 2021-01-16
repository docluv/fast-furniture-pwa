( function () {

    "use strict";

    window.love2dev = window.love2dev || {};

    var cognitoGroups = "cognito:groups",
        cognitoChallenge;

    var $username = $( "[name='Username']" ),
        $password = $( "[name='Password']" ),
        $errMsg = $(".challenge-error_message"),
        $loginSubmit = $( "[name='btn_login']" ),
        $new_password = document.querySelector( "[name='new_password']" ),
        $confirm_new_password = document.querySelector( "[name='confirm_new_assword']" ),
        $newPasswordSubmit = document.querySelector( ".btn-new_password-submit" );

    love2dev.auth.addAuthCallback( function () {

        location.href = siteConfig.base || "/";

    } );

    love2dev.auth.addNoAuthCallback( bindEvents );

    function bindEvents() {

        $( ".loginform" ).on( love2dev.events.submit, handleLogin, false );

        $( ".btn-challenge-change-password" ).on( love2dev.events.click, handleChallengePasswordChange, false );

        $( ".loginform input" ).on( love2dev.events.keyup, validateLoginForm );
        $( ".loginform input" ).on( love2dev.events.blur, validateLoginForm );

        $( ".modal-new-password-challenge input" ).on( love2dev.events.keyup, validatePasswordChallengeForm );
        $( ".modal-new-password-challenge input" ).on( love2dev.events.blur, validatePasswordChallengeForm );

        $( ".btn-new_password-submit" ).on( love2dev.events.click, handleChallengePasswordChange );

        // $( ".btn-cancel" ).on( love2dev.events.click, function ( e ) {

        //     e.preventDefault();

        //     history.back();

        //     return false;

        // } );

    }

    function validateLoginForm( e ) {

        e.preventDefault();

        $loginSubmit.toggleDisabled( !($username[0].checkValidity() && $password[0].checkValidity()) );

        return false;

    }

    function handleLogin( e ) {

        e.preventDefault();

        loginUser( $username.value(), $password.value() );

        return false;
    }

    function handleRejection( reject ) {

        if ( reject.__type ) {

            var $loginFormError = $( ".login-form-error" ),
                $loginFormErrorMessage = $( ".login-form-error .error_message" );

            $loginFormErrorMessage.html( reject.message );

            $loginFormError.addClass( love2dev.cssClasses.dFlex ).removeClass( love2dev.cssClasses.dNone );

        } else if ( reject.ChallengeName ) {

            handleChallenge( reject );

        }

    }

    function loginUser( username, password ) {

        return handleAuthentication(love2dev.auth.loginUser( username, password ));

    }

    function validatePasswordChallengeForm( e ) {

        e.preventDefault();

        if ( $new_password.value !== "" && $confirm_new_password.value !== "" &&
            $new_password.value === $confirm_new_password.value ) {

            $newPasswordSubmit.disabled = false;
            $newPasswordSubmit.setAttribute( "aria-disabled", false );

            $errMsg.text("");
            $errMsg.addClass(love2dev.cssClasses.dNone);

        }else if($new_password.value !== $confirm_new_password.value){

            passwordsDoNotMatch();
        }

        return false;

    }

    function toggleChallengeModal() {

        document.querySelector( ".challenge-background" ).classList.toggle( love2dev.cssClasses.show );
        document.querySelector( ".modal-new-password-challenge" ).classList.toggle( love2dev.cssClasses.show );
        document.querySelector( ".modal-new-password-challenge" ).classList.toggle( love2dev.cssClasses.dNone );

    }

    function handleChallenge( challenge ) {

        cognitoChallenge = challenge;

        switch ( challenge.ChallengeName ) {

            case "NEW_PASSWORD_REQUIRED":

                toggleChallengeModal();

                break;

            default:

                notImplementedHandler( challenge );
                
                break;
        }


        //NEW_PASSWORD_REQUIRED
        //DEVICE_PASSWORD_VERIFIER
        //DEVICE_SRP_AUTH
        //CUSTOM_CHALLENGE
        //PASSWORD_VERIFIER
        //SMS_MFA

    }

    function notImplementedHandler( challenge ) {

        console.log( challenge.ChallengeName + " not implemented yet" );

    }

    function passwordsDoNotMatch(){

        $errMsg.text("Your passwords do not match");
        $errMsg.removeClass(love2dev.cssClasses.dNone);

    }

    function handleChallengePasswordChange( e ) {

        e.preventDefault();

        var requiredValues = {};

        if ( $new_password.value.trim() === $confirm_new_password.value.trim() ) {

            //submit
            return handleAuthentication(love2dev.auth
                .completeNewPasswordChallenge( $new_password.value.trim(), cognitoChallenge, requiredValues ));

        } else {
            //display mismatched password message
            passwordsDoNotMatch();
        }

        return false;

    }

    function handleAuthentication(promise){

        return promise
            .then( function ( token )
            {

                return love2dev.auth.setUserAttributes( token )
                    .then( function () {
                        return token;
                    } )
                    .catch( handleRejection );

            } )
            .then( function ( token ) {

                return love2dev.auth.setCognitoGroups( token[ cognitoGroups ] );

            } )
            .then( function () {

                return love2dev.auth.getUserData( true );

            } )    
            .then( function ( result ) {

                location.href = siteConfig.base || "/";
            } )
            .catch( handleRejection );

    }

} )();