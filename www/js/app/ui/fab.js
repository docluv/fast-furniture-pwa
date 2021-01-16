( function () {

    "use strict";

    var fab = {

        config: {
            active: "active",
            horizontal: "horizontal",
            vertical: "vertical",
            clickToggle: "click-to-toggle",
            btnFloating: "ul .btn-floating",
            targetAction: function () {}
        },

        direction: function () {

            return this.target.getAttribute( "fab-direction" ) === this.config.horizontal;

        },

        toggleFABMenu: function () {

            this.target.classList.toggle( this.config.active );

        },

        FABtoToolbar: function () {},

        toolbarToFAB: function () {}

    };

    window.fab = function FAB( options ) {

        if ( !options.target ) {
            return;
        }

        var _this = Object.create( fab ),
            config = Object.assign( {}, options, fab.config );

        _this.target = document.querySelector( options.target );

        _this.config = config;
        _this.targetAction = options.targetAction || _this.config.targetAction;

        _this.children = _this.target.querySelectorAll( _this.config.btnFloating );

        for ( var i = 0; i < _this.children.length; i++ ) {

            _this.children[ i ].addEventListener( "click", function ( e ) {

                _this.targetAction( e );

            } );
        }

        _this.target.addEventListener( "click", function ( e ) {

            e.preventDefault();

            _this.toggleFABMenu();

        } );

        return _this;

    };

} )();