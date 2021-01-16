( function () {

    "use strict";

    var defaults = {
        cardSelector: ".accordion .card"
    },
    config = {};

    function init(options){

        config = Object.assign({}, defaults, options);

        bindEvents();

    }

    function bindEvents() {

        $( config.cardSelector).on( love2dev.events.click, handleAccordianExpand );
    }

    function handleAccordianExpand( e ) {

        e.preventDefault();

        var isActive = e.currentTarget.classList.contains("active");

        $( config.cardSelector).removeClass( "active" ).attr("aria-expanded", false);

        if(!isActive){

            e.currentTarget.classList.add( "active" );
            e.currentTarget.setAttribute("aria-expanded", true);

        }

        return false;

    }

    window.accordian = init;

}() );