( function () {

    var cbNotifications = undefined;

    function initializeView() {

        cbNotifications = document.getElementById( "cbNotifications" );

        initializeNotificationState();
        initializeProductHistory();
        initializeFavorites();
        initializeReceiptPrinter();

    }

    function initUSB(){


        var self = this;

        for ( var index = 0; index < deviceButtons.length; index++ ) {
          self.bindDeviceEditButton( deviceButtons[ index ] );
        }

        self.on( self.qsa( ".header-status-bar-item" ), "click", function ( evt ) {

          self.connectToDevice( evt.target );

        } );

        var btnConnect = self.qs( ".btn-connect" ),
          btnPrint = self.qs( ".btn-print" ),
          btnPrintTicket = self.qs( ".btn-print-ticket" ),
          btnDeviceList = self.qs( ".btn-list-devices" );

        self.on( btnConnect, "click", function ( evt ) {

          evt.preventDefault();

          self.openDevice();

        } );

        self.on( btnDeviceList, "click", function ( evt ) {

          evt.preventDefault();

          usb.getDevices()
            .then( function ( devices ) {

              devices.forEach( function ( device ) {

                logDeviceInfo( device );

              } );

              self.listDevices();

            } );

        } );

        self.on( btnPrint, "click", function ( evt ) {

          evt.preventDefault();

          var deviceType = "receiptPrinters";

          //get printer meta info
          usb.meta.getReceiptPrinter()
            .then( function ( receiptPrinter ) {

              if ( receiptPrinter ) {

                return usb.getUSBDevice( receiptPrinter )
                  .then( function ( device ) {

                    if ( device ) {

                      printSomething( device );

                    } else {

                      console.log( "no available receipt printer" );

                    }

                  } );

              }

            } );

        } );

        self.on( btnPrintTicket, "click", function ( evt ) {

          evt.preventDefault();

          self.printTicket();

        } );

        usb.addConnectHandler( function ( device ) {

          console.log( "connected to: " );
          console.log( device );

          //change connected status to green

          usb.meta.getDeviceConfig( device.serialNumber )
            .then( function ( deviceInfo ) {

              if ( deviceInfo ) {

                self.updateConnectedStatus( deviceInfo, true );

                if ( !deviceInfo.usb ) {

                  deviceInfo.usb = true;

                  usb.meta.addConfiguredDevice( deviceInfo )
                    .then( function () {

                      self.listDevices();

                    } );

                }

              } else {

                //display device info edit
                //new device
                return self.renderDeviceInfo( device )
                  .then( function () {

                    device.usb = true;

                    logDeviceInfo( device );

                  } );

              }

            } );

        } );

        usb.addDisconnectHandler( function ( device ) {

          console.log( "disconnected from: " );
          console.log( device );

          var hiddenList = self.qs( ".usb-configuration.hidden" );

          if ( hiddenList ) {

            self.listDevices();

          } else {

            //change connected status to red
            self.updateConnectedStatus( device, false );

          }

        } );

        usb.bindUSBEvents();

        self.listDevices();

    }

    function initializeProductHistory() {

        var initialCount = settings.getSetting( "productHistory" ),
            eleProductHistory = document.querySelector( "[name='noProductHistory']" );

        if ( eleProductHistory ) {

            eleProductHistory.value = parseInt( initialCount, 10 );

            eleProductHistory.addEventListener( "change", updateProductHistory );
            eleProductHistory.addEventListener( "blur", updateProductHistory );

        }

    }

    function updateProductHistory( evt ) {

        settings.saveSetting( "productHistory", evt.target.value );

    }

    function initializeFavorites() {

        var initialCount = settings.getSetting( "favorites" ),
            eleNumFavorites = document.querySelector( "[name='numFavorites']" );

        if ( eleNumFavorites ) {

            eleNumFavorites.value = parseInt( initialCount, 10 );

            eleNumFavorites.addEventListener( "change", updateFavorites );
            eleNumFavorites.addEventListener( "blur", updateFavorites );

        }

    }

    function updateFavorites( evt ) {

        settings.saveSetting( "favorites", evt.target.value );

    }

    function initializeNotificationState() {

        pushMgr.getIsSubscribed()
            .then( function ( isSubscribed ) {

                cbNotifications.checked = isSubscribed;

                cbNotifications.addEventListener( "change", function ( e ) {

                    e.preventDefault();

                    if ( e.target.checked ) {

                        pushMgr.subscribeUser();

                        settings.saveSetting( "pushSubscription", true );

                    } else {

                        pushMgr.unsubscribeUser();
                        settings.saveSetting( "pushSubscription", false );

                    }

                } );

            } );

    }

    function initializeReceiptPrinter() {

        usb.addConnectHandler( function ( device ) {

            console.log( "connected to: " );
            console.log( device );

            //change connected status to green

            usb.meta.getDeviceConfig( device.serialNumber )
                .then( function ( deviceInfo ) {

                    if ( deviceInfo ) {

                        updateConnectedStatus( deviceInfo, true );

                        if ( !deviceInfo.usb ) {

                            deviceInfo.usb = true;

                            usb.meta.addConfiguredDevice( deviceInfo )
                                .then( function () {

                                    self.listDevices();

                                } );

                        }

                    } else {

                        //display device info edit
                        //new device
                        return renderDeviceInfo( device )
                            .then( function () {

                                device.usb = true;

                                logDeviceInfo( device );

                            } );

                    }

                } );

        } );

        usb.addDisconnectHandler( function ( device ) {

            console.log( "disconnected from: " );
            console.log( device );

            var hiddenList = self.qs( ".usb-configuration.hidden" );

            if ( hiddenList ) {

                self.listDevices();

            } else {

                //change connected status to red
                updateConnectedStatus( device, false );

            }

        } );

        usb.bindUSBEvents();
    }

    initializeView();

} )();