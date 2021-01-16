( function ( window, undefined ) {

    "use strict";

    function toggleClass( target ) {

        for ( var index = 0; index < target.length; index++ ) {

            var t = target[ index ].target;

            var scrollConfig = t.getAttribute( "data-scroll" );

            if ( scrollConfig ) {

                scrollConfig = JSON.parse( scrollConfig );

                if ( target[ index ].intersectionRect.y >= scrollConfig.intersectionRect.y &&
                    scrollConfig.toggled !== target[ index ].isIntersecting ) {

                    var classTarget = document.querySelector( scrollConfig.target );

                    if ( classTarget ) {

                        classTarget.classList.toggle( scrollConfig.scroll_class );
                        classTarget.classList.toggle( scrollConfig.init_class );

                        scrollConfig.toggled = target[ index ].isIntersecting;
                        scrollConfig.intersectionRect = target[ index ].intersectionRect;

                        t.setAttribute( "data-scroll", JSON.stringify( scrollConfig ) );

                    }

                }

            }

        }

    }

    window.scrollToggle = {

        init: function () {

            var scrollTargets = document.querySelectorAll( ".scroll-toggle" ),
                config = {
                    rootMargin: "-5%",
                    threshold: 0.9
                },
                scrollObserver = new IntersectionObserver( toggleClass, config ),
                i = 0;

            for ( i = 0; i < scrollTargets.length; i++ ) {

                var target = scrollTargets[ i ];

                scrollObserver.observe( target );

            }

        }

    };

}( window ) );