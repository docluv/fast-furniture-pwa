( function () {

    "use strict";

    if ( !window.love2dev ) {
        window.love2dev = {};
    }

    var keyboardBound = "keyboard-bound";

    //get wizard buttons & bind click events
    //next buttons disabled by default
    //validate each panel before moving

    function initialize( options ) {

        if ( options.context ) {

            config.context = options.context;

        }

        config.context = document.querySelector( config.context );

        bindButtons();

        //        bindKeyboard( document.body );

    }

    function hidePanels() {

        var panels = $a( ".form-panel" );

        for ( var index = 0; index < panels.length; index++ ) {

            panels[ index ].removeClass( "show", "d-flex", "active" );
            panels[ index ].addClass( "d-none" );

        }

    }

    function triggerNavigation( evt ) {

        if ( evt.preventDefault ) {

            evt.preventDefault();

        }

        var button = evt.target,
            target = button.getAttribute( "wizard-target" ),
            initialFocus;

        hidePanels();

        target = $( config.context, target );

        if ( target ) {

            target.removeClass( "d-none" );
            target.addClass( "show", "d-flex", "active" );

            initialFocus = $( target, "[wizard-focus]" );

            if ( initialFocus ) {
                initialFocus[ 0 ].focus();
            } else {

                initialFocus = $( target, "input" );

                if ( initialFocus ) {
                    initialFocus[ 0 ].focus();
                }

            }

        }

        return false;

    }

    function bindKeyboard( target ) {

        target.on( "keyup", handleKeyboard );

    }

    function handleKeyboard( evt ) {

        var target = document.querySelector( ".wizard-container .tab-pane:not(.d-none)" ),
            event = new Event( "click" );

        if ( evt.which === 13 ) {

            var nextBtn = target.querySelector( ".btn-wizard-next" );

            if ( nextBtn ) {
                nextBtn.dispatchEvent( event );
            }

        } else if ( evt.which === 8 ) {

            var backBtn = target.querySelector( ".btn-wizard-back" );

            if ( backBtn ) {
                backBtn.dispatchEvent( event );
            }

        }

    }

    function bindButtons() {

        config.buttons = $( config.context, config.btn );

        config.buttons.on( "click", triggerNavigation );

    }

    var config = {
        btn: ".btn-wizard",
        context: "body",
        buttons: []
    };

    window.wizard = {
        initialize: initialize
    };

} )();