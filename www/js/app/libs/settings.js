( function () {

    //using localstorage

    var defaultSettings = {
            "pushSubscription": false,
            "productHistory": 25,
            "favorites": 25
        },
        settingsKey = "settings";

    function getSettings() {

        var settings = localStorage.getItem( settingsKey );

        if ( !settings || settings === "" ) {

            return defaultSettings;

        } else {

            return Object.assign( {}, defaultSettings, JSON.parse( settings ) );

        }

    }

    function saveSettings( settings ) {

        settings = Object.assign( {}, defaultSettings, settings );

        localStorage.setItem( settingsKey, JSON.stringify( settings ) );

    }

    function getSetting( key ) {

        var settings = getSettings();

        return settings[ key ];

    }

    function saveSetting( key, value ) {

        var settings = getSettings();

        settings[ key ] = value;

        saveSettings( settings );

    }


    function clearSettings() {

        localStorage.removeItem( settingsKey );

    }


    function deleteSetting( key ) {

        var settings = getSettings();

        delete settings[ key ];

        saveSettings( settings );

    }


    window.settings = {
        getSettings: getSettings,
        saveSettings: saveSettings,
        saveSetting: saveSetting,
        getSetting: getSetting,
        clearSettings: clearSettings,
        deleteSetting: deleteSetting
    };

} )();