/** 
  Abstract the WebUSB functionality
  usb
*/
( function () {

  var cardPrinters = "cardPrinters",
    receiptPrinters = "receiptPrinters",
    ticketPrinters = "ticketPrinters";

  window.usb = {

    /* webUSB Abstractions */
    getDevices: function () {
      return navigator.usb.getDevices();
    },

    /**
     * @function getDevice
     * @param filter : (optional) an array containing object with properties to filter target devices 
     * Displays USB permsission dialog with a list of connected USB devices
     * returns a reference to the USBDevice object, which can be used to configure the META info
     */
    getDevice: function ( filter ) {

      filter = filter || [];

      //display permission dialog
      return navigator.usb
        .requestDevice( {
          filters: filter
        } )
        .then( function ( device ) {

          return device;

        } );

    },

    getUSBDevice: function ( deviceMeta ) {

      var self = this;

      return self.getDevices()
        .then( function ( devices ) {

          for ( var index = 0; index < devices.length; index++ ) {

            if ( devices[ index ].serialNumber === deviceMeta.serialNumber ) {

              deviceMeta.device = devices[ index ];

              return deviceMeta;

            }

          }

        } );

    },

    //need this method to do more ti justify its existence :(
    openDevice: function ( deviceMeta ) {

      if ( !deviceMeta.device ) {
        return Promise.reject( "no device present" );
      }

      if ( !deviceMeta.device.opened ) {

        return deviceMeta.device.open()
          .then( function () {

            return deviceMeta.device.selectConfiguration( deviceMeta.configurationValue );

          } )
          .then( function () {

            return deviceMeta.device.claimInterface( deviceMeta.interfaceNumber );

          } )
          .catch( function ( err ) {

            return Promise.reject( err );

          } );

      }

      return Promise.resolve();
    },

    closeDevice: function ( device ) {
      if ( device && device.opened ) {
        return device.close();
      }
    },

    /* end webUSB Abstractions */

    /* webUSB event handlers */
    _connectHandlers: [],
    _disconnectHandlers: [],

    addConnectHandler: function ( handler ) {

      this._connectHandlers.push( handler );

    },

    addDisconnectHandler: function ( handler ) {

      this._disconnectHandlers.push( handler );

    },

    bindUSBEvents: function () {

      var self = this;

      navigator.usb.addEventListener( "connect", function ( event ) {
        // Add |event.device| to the UI.
        console.log( "connected to USB device " );
        console.log( event );

        for ( var index = 0; index < self._connectHandlers.length; index++ ) {

          self._connectHandlers[ index ]( event.device );

        }

      } );

      navigator.usb.addEventListener( "disconnect", function ( event ) {
        // Remove |event.device| from the UI.
        console.log( "disconnected from USB device " );
        console.log( event );

        for ( var index = 0; index < self._disconnectHandlers.length; index++ ) {

          self._disconnectHandlers[ index ]( event.device );

        }

      } );

    },

    /* end webUSB event handlers */

    /** @function sendCommand */
    //this should be pushed to a service
    sendCommand: function ( command, device ) {

      usb.meta.openDevice( device )
        .then( function () {

          return usb.meta.getDeviceConfig( device.serialNumber );

        } )
        .then( function ( config ) {

          return device
            .transferOut( config.endpoints.out, command )
            // .then( function ( data ) {

            //   if ( data ) {

            //     console.log( "decoded: ", data.status );
            //   }

            //   return device.transferIn( config.endpoints.in, 64 );

            // } )
            // .then( function ( data ) {

            //   if ( data ) {

            //     var enc = new TextDecoder( "utf-8" );

            //     console.log( "decoded: ", enc.decode( data.data ) );

            //   }

            // } )
            .catch( function ( err ) {

              console.error( err );

              logActivity( err );

            } );

        } );

    },

    /* Receipt Printer Functions */

    /**
     * @function encodeESCPOS
     * @param receipt: a receipt object, must be transformed to an ESC encoded object
     */
    encodeESCPOS: function ( receipt ) {

      if ( !receipt ) {
        return;
      }

      var payload = new EscPosEncoder().initialize();
      var hasCut = false;

      for ( var index = 0; index < receipt.length - 1; index++ ) {

        var line = receipt[ index ];

        //strip the carriage return since that is built into the encoder
        var rets = line.data.match( /\r\n/ );

        //only add the line if there is actual content
        if ( !rets ) {

          payload = payload.align( alignment[ line.alignment ] );

          switch ( line.style ) {
            case 0:
              payload = payload.bold( true );

              break;
            case 1:
              payload = payload.underline( true );

              break;
            case 3:
              //              payload = payload.reverse(true);

              break;
            case 4:
              //            payload = payload.doublehigh(true);

              break;
            case 5:
              payload = payload.italic( true );

              break;
          }

          switch ( line.type ) {
            case 1:
              payload.line( line.data );

              break;
            case 2:
              //barcode
              payload.barcode( line.data, "upca", 180 );

              break;
            case 3:
              //streamed image - need to dynamically load image before creating encoded paypload
              payload.image( line.data, 240, 88, "atkinson" );

              break;

            case 4:
              //stored image
              payload.image( line.data, 240, 88, "atkinson" );

              break;

            case 5:
              //feed
              payload.newline();

              break;

            case 6:
              //Cut
              payload.raw( [ 0x1d, 0x56, 0x42, 0x06 ] );

              hasCut = true;

              break;

            case 7:
              //Placeholders???
              payload.line( line.data );

              break;

            default:
              //assume text
              payload.line( line.data );
              break;
          }
        } else {

          for ( var i = 0; i < rets.length; i++ ) {
            payload.newline();
          }

        }
      }

      if ( !hasCut ) {
        payload.raw( [ 0x1d, 0x56, 0x42, 0x06 ] );
      }

      return Promise.resolve( payload );

    },

    /** @function printReceipt
     *  @param: receipt, ESC POS encoded receipt object
     * Assume the receipt has already been encoded
     */
    printReceipt: function ( receipt, device ) {

      var self = this;

      usb.meta.getDefaultDevice( receiptPrinters )
        .then( function ( receiptPrinter ) {

          if ( receiptPrinter ) {

            return usb.getUSBDevice( receiptPrinter )
              .then( function ( device ) {

                if ( device ) {

                  return self.sendCommand( receipt, device );

                } else {

                  return usb.meta.getFirstOpenDevice( receiptPrinters )
                    .then( function ( device ) {

                      return self.sendCommand( receipt, device );

                    } );

                }

              } );

          }

        } );

    },

    /**
     * @function openCashDrawer
     * @param printer : a Meta device object. Should contain a device property referencing a USBDevice
     * @description creates a kick drawer command and sends it to the printer
     *     If the printer does not have a configured cash drawer then nothing happens
     */
    openCashDrawer: function ( printer ) {

      if ( printer.cash_drawer && printer.cash_drawer_pin ) {

        var self = this,
          encoder = new EscPosEncoder();

        var command = encoder
          .initialize()
          .raw( [ 0x10, 0x14, printer.cash_drawer_pin === 0 ? 0x00 : 0x01, 0x01, 0x02 ] ) //kick drawer
          .encode();

        return self.sendCommand( command, printer.device );

      }

      return Promise.resolve();

    },

    /* End Receipt Printer Functions */

    printPDFTicket: function ( ticket ) {},

    printBitmapTicket: function ( ticket ) {}

  };

} )();