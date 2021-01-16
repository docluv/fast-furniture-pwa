( function () {

    "use strict";

    var defaults = {
            show: "show",
            toggler: ".collapse-toggle",
            configureMark: "collapse-config"
        },
        settings = {};

    function initialize( opts ) {

        settings = Object.assign( {}, defaults, opts );

        var targets = document.querySelectorAll( settings.toggler );

        targets.forEach( configureExpander );

    }

    function configureExpander( target ) {

        var config = target.getAttribute( settings.configureMark );

        if ( !config ) {

            bindExapnder( target );

            target.setAttribute( settings.configureMark, "true" );

        }

    }

    function bindExapnder( target ) {

        var toggleTarget = target.getAttribute( "data-toggle-target" );

        target.addEventListener( "click", function ( e ) {

            e.preventDefault();

            var c = document.querySelector( toggleTarget );

            if ( c ) {

                c.classList.toggle( settings.show );

            }

            target.querySelector( ".fa" ).classList.toggle( "fa-flip-vertical" );

        } );

    }

    window.love2dev = window.love2dev || {};

    window.love2dev.collapse = {
        initialize: initialize
    };

} )();