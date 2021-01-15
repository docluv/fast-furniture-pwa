( function ( window ) {
    "use strict";

    function saveOnlineState( state ) {

        return localforage.setItem( "online", state );
    }

    function getOnlineState() {

        return localforage.getItem( "online" )
            .then(function (state){

                if(!state){
                    state = {};
                }

                if (undefined === state.online){
                    state.online = true;
                }

                if (undefined === state.serverState) {
                    state.serverState = true;
                }

                state.available = state.online && state.serverState;

                return state;

            });
    }

    window.onlineStatus = {
        getOnlineState: getOnlineState,
        saveOnlineState: saveOnlineState
    };

} )( this );