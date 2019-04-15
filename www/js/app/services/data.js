( function () {

    "use strict";

    //Constants here

    //TODO: generate fake theaters

    var stores = [];

    function getRandomPoistion( latitude, longitude ) {

        var r = Math.floor( ( Math.random() * 5500 ) + 1 ) / 100000,
            rl = Math.floor( ( Math.random() * 6500 ) + 1 ) / 100000,
            pm = Math.round( Math.random() ),
            pm1 = Math.round( Math.random() ),
            coords = {};

        if ( pm === 0 ) {
            r = parseFloat( "-" + r );
        }

        if ( pm1 === 0 ) {
            rl = parseFloat( "-" + rl );
        }

        coords.latitude = latitude + r;
        coords.longitude = longitude + rl;

        return coords;
    }


    function nearbystores( options ) {

        var i = 0,
            pos;

        for ( ; i < stores.length; i++ ) {

            pos = that.getRandomPoistion( latitude, longitude );

            stores[ i ].latitude = pos.latitude;
            stores[ i ].longitude = pos.longitude;
        }

        return Promise.resolve( stores );

    }


    window.fastfurniture.stores = {
        nearbyStores: nearbyStores
    };

} )();