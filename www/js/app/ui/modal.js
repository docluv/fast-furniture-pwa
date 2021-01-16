//questions

( function ( window, document, undefined ) {

    "use strict";

    var $background = document.querySelector( ".modal-bg" );

    function toggleModalBackground() {

        $background.classList.toggle( love2dev.cssClasses.show );

    }

    function toggleModal( modal ) {

        var $modals = document.querySelectorAll( ".modal" ),
            $modal = document.querySelector( modal );
        
        if ( $modals && $modal )
        {

            toggleModalBackground();

            modal = modal.replace( ".", "" );

            for ( var index = 0; index < $modals.length; index++ ) {

                var target = $modals[ index ];

                if ( !target.classList.contains( modal ) ) {
                    target.classList.remove( love2dev.cssClasses.show );
                }

            }

            $modal.classList.toggle( love2dev.cssClasses.show );
            
        }


    }

    window.modal = {
        toggleModalBackground: toggleModalBackground,
        toggleModal: toggleModal
    };

} )( window, document );