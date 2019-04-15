( function () {

    "use strict";

    //Constants here

    var self = love2dev.component;

    var config,
        apiURL = "";

    function initialize() {

        loadRelated( {
                domain: domain
            } )
            .then( function ( c ) {

                config = c;

            } )
            .then( function () {

                return bindForm();

            } );

    }

    function loadNeabyStores() {

        var map, i, stores = [],
            key = "Ai2HABTSdPR3baDe6yPjFDNRac3RsbaFMjUb2d-OjlQd8o3vO2DcqRxBpDgRTuUD";

        if ( navigator.geolocation ) {

            navigator.geolocation.getCurrentPosition( function ( position ) {

                map = new Microsoft.Maps.Map( document.getElementById( 'nearbyMap' ), {
                    credentials: key,
                    center: new Microsoft.Maps.Location( position.coords.latitude,
                        position.coords.longitude ),
                    mapTypeId: Microsoft.Maps.MapTypeId.road,
                    showScalebar: false,
                    showDashboard: false,
                    zoom: 12
                } );

                stores = that.movieData.nearbystores( position.coords.latitude,
                    position.coords.longitude );

                //loop thorugh and place 10 random pushpins to represent stores on the map
                for ( i = 0; i < stores.length; i++ ) {
                    AddPushpin.call( that, map, stores[ i ] );
                }

                //add fake store load

            } );

        }

    }

    function AddPushpin( map, store ) {

        var shape,
            pin = new Microsoft.Maps.Pushpin( {
                latitude: store.latitude,
                longitude: store.longitude
            } );

        // Add a handler to the pushpin drag
        Microsoft.Maps.Events.addHandler( pin, 'click', function () {
            goTostoreFromMap( store );
        } );

        map.entities.push( pin );
    }

    function goTostoreFromMap( store ) {
        window.location.hash = "locations/" + store.id + "?latitude=" + store.latitude + "&longtitude=" + store.longitude;
    }


    initialize();

} )();