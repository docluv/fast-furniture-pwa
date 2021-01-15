( function ( window ) {

    var triggers = {};

    function addCallback( trigger, key, method, state ) {

        if ( !( typeof method === "function" ) ) {
            return;
        }

        triggers[ trigger ] = triggers[ trigger ] || [];

        triggers[ trigger ].push( {
            "key": key,
            "callback": method
        } );

        //go ahead and execute, even without supplied parameters
        if ( state ) {
            method();
        }


    }

    function removeCallback( trigger, key ) {

        if ( triggers[ trigger ] ) {

            //loop over array and remove matching callback name
            var index = triggers[ trigger ].findIndex( function ( item ) {

                return item.key === key;

            } );

            if ( index > -1 ) {
                triggers[ trigger ].splice( index, 1 );
            }

        }

    }

    function removeTrigger( trigger ) {
        delete triggers[ trigger ];
    }

    function fireCallback( trigger, param ) {

        var _i, _len, _ref2;

        if ( !triggers[ trigger ] ) {
            return;
        }

        _ref2 = triggers[ trigger ];

        _len = _ref2.length;

        for ( _i = 0; _i < _len; _i++ ) {

            if ( _ref2[ _i ].callback ) {

                _ref2[ _i ].callback( param );

            }

        }

    }

    window.callbacks = {
        addCallback: addCallback,
        fireCallback: fireCallback,
        removeCallback: removeCallback,
        removeTrigger: removeTrigger
    };

} )( this );