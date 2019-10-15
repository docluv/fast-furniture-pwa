( function ( window, undefined ) {

    "use strict"; //https://love2dev.com/blog/javascript-strict-mode/

    var deferredPrompt;

    var showgdpr = localStorage.getItem( "gdpr" );

    function showGDPR() {

        var gdpr = document.querySelector( ".gdpr" ),
            acceptBtn = document.querySelector( ".gdpr .btn-accept" );

        if ( gdpr && acceptBtn ) {

            gdpr.style.display = "flex";

            acceptBtn.addEventListener( "click", function () {

                localStorage.setItem( "gdpr", true );

                gdpr.style.display = "none";

                showgdpr = false;

                setTimeout( 3000, function () {

                    showAddToHomeScreen();

                } );

            } );

        }

    }

    if ( !showgdpr ) {

        showGDPR();

    }

    addToHomescreen( {
        appID: "com.love2dev.pubcon",
        appName: "Pubcon.love2dev",
        lifespan: 15,
        autostart: true,
        skipFirstVisit: false,
        minSessions: 0,
        displayPace: 0,
        customCriteria: true,
        customPrompt: {
            title: "Install Fast Furniture?",
            cancelMsg: "Cancel",
            installMsg: "Install"
        }
    } );

    if ( 'serviceWorker' in navigator ) {

        navigator.serviceWorker.register( '/sw.js', {
                force: true
            } )
            .then( function ( reg ) {

                // reg.installing; // the installing worker, or undefined
                // reg.waiting; // the waiting worker, or undefined
                // reg.active; // the active worker, or undefined   

                console.log( "Registration was successful" );

                navigator.serviceWorker.getRegistration().then( function ( registration ) {

                    if ( registration ) {
                        console.log( "registration: ", registration.scope );

                        registration.update( {
                            force: true
                        } );
                    }
                } );

                reg.addEventListener( 'updatefound', function () {
                    // A wild service worker has appeared in reg.installing!

                    var newWorker = reg.installing;

                    console.log( "newWorker.state: ", newWorker.state );
                    // "installing" - the install event has fired, but not yet complete
                    // "installed"  - install complete
                    // "activating" - the activate event has fired, but not yet complete
                    // "activated"  - fully active
                    // "redundant"  - discarded. Either failed install, or it's been
                    //                replaced by a newer version

                    newWorker.addEventListener( 'statechange', function () {
                        // newWorker.state has changed

                        console.log( "service worker state change" );
                    } );

                } );

                //push notification feature detection
                if ( "PushManager" in window ) {

                    pushMgr.swRegistration = reg;

                    pushMgr.initialisePush();

                }

            } );

        navigator.serviceWorker.addEventListener( 'controllerchange',
            function () {

                // This fires when the service worker controlling this page
                // changes, eg a new worker has as skipped waiting and become
                // the new active worker.
                console.log( 'serviceWorker.onControllerchange',
                    navigator.serviceWorker.controller.scriptURL );

            } );
    }

    if ( navigator.onLine ) {
        document.body.classList.remove( "offline-grey-scale" );
    } else {
        document.body.classList.add( "offline-grey-scale" );
    }

    window.addEventListener( "online", function ( e ) {
        document.body.classList.remove( "offline-grey-scale" );
    } );

    window.addEventListener( "offline", function ( e ) {
        document.body.classList.add( "offline-grey-scale" );
    } );

    var utils = {

        getParameterByName: function ( name, url ) {
            if ( !url ) {
                url = window.location.href;
            }
            name = name.replace( /[\[\]]/g, "\\$&" );
            var regex = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
                results = regex.exec( url );
            if ( !results ) return null;
            if ( !results[ 2 ] ) return '';
            return decodeURIComponent( results[ 2 ].replace( /\+/g, " " ) );
        }

    };

    window.utils = utils;
    window.pushMgr = pushMgr;

} )( window );