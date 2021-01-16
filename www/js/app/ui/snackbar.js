( function () {

    "use strict";

    function showSnackbar( msg ) {

        var confirmSnack = $( ".snackbar-confirm" ),
            confirmLabel = $( ".mdc-snackbar__label" );

        if ( confirmSnack ) {

            confirmLabel[ 0 ].innerText = msg;

            confirmSnack.toggleClass( "mdc-snackbar--open" );
            confirmSnack.toggleClass( "fadeIn" );
            confirmSnack.toggleClass( "fadeOut" );

            setTimeout( function () {
                confirmSnack.toggleClass( "fadeOut" );
                confirmSnack.toggleClass( "fadeIn" );
            }, 5000 );

            setTimeout( function () {
                confirmSnack.toggleClass( "mdc-snackbar--open" );
            }, 6000 );

        }

    }

    function bindEvents() {

        //OK button handler
        return;
    }

    function displayErrorMessage( msg ) {}


    love2dev.snackbar = {
        displayErrorMessage: displayErrorMessage,
        showSnackbar: showSnackbar
    };

} )();