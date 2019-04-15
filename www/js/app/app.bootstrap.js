( function () {

    "use strict"; //https://love2dev.com/blog/javascript-strict-mode/

    window.admin = {};

    var src, script,
        pendingScripts = [],
        firstScript = document.scripts[ 0 ];

    if ( typeof Object.assign != 'function' ) {

        scripts.unshift( "js/libs/polyfil/object.assign.js" );

    }

    if ( typeof Promise === "undefined" || Promise.toString().indexOf( "[native code]" ) === -1 ) {

        scripts.unshift( "js/libs/polyfil/es6-promise.min.js" );

    }

    if ( typeof fetch === "undefined" || fetch.toString().indexOf( "[native code]" ) === -1 ) {

        scripts.unshift( "js/libs/polyfil/fetch.js" );

    }

    if ( typeof IntersectionObserver === "undefined" || IntersectionObserver.toString().indexOf( "[native code]" ) ===
        -1 ) {

        scripts.unshift( "js/libs/polyfil/intersection-observer.js" );

    }

    //push notification feature detection
    if ( "PushManager" in window ) {

        scripts.unshift( "js/app/libs/push-manager.js" );

    }

    window.scriptMgr = {

        // Watch scripts load in IE
        stateChange: function () {
            // Execute as many scripts in order as we can

            var pendingScript;

            while ( pendingScripts[ 0 ] && pendingScripts[ 0 ].readyState == 'loaded' ) {
                pendingScript = pendingScripts.shift();
                // avoid future loading events from this script (eg, if src changes)
                pendingScript.onreadystatechange = null;
                // can't just appendChild, old IE bug if element isn't closed
                firstScript.parentNode.insertBefore( pendingScript, firstScript );
            }

            console.log( "scripts should be loaded now" );

        },

        appendScripts: function ( scripts ) {

            if ( !Array.isArray( scripts ) ) {
                scripts = [ scripts ];
            }

            var self = this;

            // loop through our script urls
            while ( src = scripts.shift() ) {

                if ( 'async' in firstScript ) { // modern browsers

                    script = document.createElement( 'script' );
                    script.src = src;
                    script.async = false;
                    document.body.appendChild( script );

                } else if ( firstScript.readyState ) { // IE<10
                    // create a script and add it to our todo pile
                    script = document.createElement( 'script' );
                    pendingScripts.push( script );
                    // listen for state changes
                    script.onreadystatechange = self.stateChange;
                    // must set src AFTER adding onreadystatechange listener
                    // else we’ll miss the loaded event for cached scripts
                    script.src = src;
                } else { // fall back to defer
                    document.write( '<script src="' + src + '" defer></' + 'script>' );
                }
            }

        }

    };

    if ( document.readyState === "complete" ) {

        scriptMgr.appendScripts( scripts );

    } else {

        document.addEventListener( "readystatechange", function ( event ) {

            if ( event.target.readyState === "complete" ) {

                scriptMgr.appendScripts( scripts );

            }

        } );

    }


    //after the dust settles, register the service worker

} )();