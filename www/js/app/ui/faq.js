//questions

( function ( window, document, undefined ) {

    "use strict";

    let questions = [],
        callback;

    function initialize( src, cb ) {

        questions = src;
        callback = cb;


        bindEvents();

    }

    function bindEvents() {}

    window.faqSchema = {
        initialize: initialize
    };


} )( window, document );