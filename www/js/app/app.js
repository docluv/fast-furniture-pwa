( function ( window, undefined ) {

    "use strict"; //https://love2dev.com/blog/javascript-strict-mode/

    var deferredPrompt;

    var showgdpr = localStorage.getItem( "gdpr" ),
        showA2HS = localStorage.getItem( "a2hs" );

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

    if ( !showA2HS ) {

        window.addEventListener( "beforeinstallprompt", function ( e ) {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;

            if ( showgdpr ) {

                setTimeout( showAddToHomeScreen, 5000 );

            }

        } );

    }


    // window.addEventListener( 'beforeinstallprompt', function ( e ) {
    //     // Prevent Chrome 67 and earlier from automatically showing the prompt
    //     e.preventDefault();
    //     // Stash the event so it can be triggered later.
    //     deferredPrompt = e;

    //     setTimeout( showAddToHomeScreen, 5000 );

    // } );

    function showAddToHomeScreen() {

        var a2hsBtn = document.querySelector( ".ad2hs-prompt" );

        if ( a2hsBtn ) {

            a2hsBtn.style.display = "flex";

            a2hsBtn.addEventListener( "click", addToHomeScreen );

        }

    }

    function addToHomeScreen() {

        var a2hsBtn = document.querySelector( ".ad2hs-prompt" );

        if ( a2hsBtn ) {

            // hide our user interface that shows our A2HS button
            a2hsBtn.style.display = 'none';

            if ( deferredPrompt ) {
                // Show the prompt
                deferredPrompt.prompt();

                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice
                    .then( function ( choiceResult ) {

                        if ( choiceResult.outcome === 'accepted' ) {
                            console.log( 'User accepted the A2HS prompt' );
                        } else {
                            console.log( 'User dismissed the A2HS prompt' );
                        }

                        deferredPrompt = null;

                    } );

            }

        }

    }

    window.addEventListener( 'appinstalled', function ( evt ) {
        console.log( 'a2hs', 'installed' );
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

                navigator.serviceWorker.getRegistrations()
                    .then( function ( registrations ) {

                        if ( registrations ) {

                            registrations.forEach( function ( registration ) {

                                console.log( "registration: ", registration.scope );

                            }, this );

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

        //install prompt management
        // window.addEventListener( 'beforeinstallprompt', function ( e ) {

        //     console.log( 'beforeinstallprompt Event fired' );
        //     // e.preventDefault();
        //     // return false;

        //     // e.userChoice will return a Promise.
        //     e.userChoice.then( function ( choiceResult ) {

        //         console.log( choiceResult.outcome );

        //         if ( choiceResult.outcome === 'dismissed' ) {

        //             console.log( 'User cancelled home screen install' );

        //         } else {

        //             console.log( 'User added to home screen' );

        //         }

        //     } );

        // } );

        function handleInstalled( ev ) {
            const date = new Date( ev.timeStamp / 1000 );
            console.log( `Yay! Our app got installed at ${date.toTimeString()}.` );
        }

        window.addEventListener( "appinstalled", handleInstalled );
    }

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