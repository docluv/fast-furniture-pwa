//questions

( function ( window, document, undefined ) {
    "use strict";

    var $notification = $( ".notification" ),
        $notificationTitle = $( ".notification-title" ),
        $notificationText = $( ".notification-text" ),
        timer = 0,
        meaning;

    $( ".notification-close" ).on( "click", hide );

    function hide() {
        $notification.removeClass( "show" );

        removeMeaning();

        $notificationTitle.text( "" );
        $notificationText.text( "" );
        clearTimeout( timer );
    }

    function removeMeaning() {

        var classes = $notification[ 0 ].classList;

        classes.forEach(function(value){

            if ( value.indexOf( "notification-" ) > -1 ) {
                $notification[ 0 ].classList.remove( value );
            }

        });

    }

    function show( options ) {
        removeMeaning();
        $notification.addClass( "show" );
        $notificationTitle.text( options.title );
        $notificationText.text( options.message );

        if ( options.meaning ) {
            $notification.addClass( "notification-" + options.meaning );
            meaning = options.meaning;
        }

        if ( options.hideTime ) {
            timer = setTimeout( function () {
                hide();
            }, options.hideTime );
        }

    }

    window.notify = {
        show: show,
        hide: hide
    };
} )( window, document );