/** requires localForage
 * assumes webUSB support
 * usb.meta
 * manage device meta data
 */

( function () {

    "use strict";

    var supported_device_key = "aluvii-supported-devices",
        configured_device_key = "aluvii-configured-devices",
        cardPrinters = "cardPrinters",
        receiptPrinters = "receiptPrinters",
        ticketPrinters = "ticketPrinters";

    /** @function _connectDevice
     * @private */
    function _connectDevice( device ) {

        return device.selectConfiguration( 1 ) // Select configuration #1 for the device.
            .then( function () {

                return device.claimInterface(
                    device.configuration.interfaces[ 0 ].interfaceNumber );

            } );

    }

    /** @function _clearDefaultDevice
     * @private */
    function _clearDefaultDevice( devices ) {

        for ( var index = 0; index < devices.length; index++ ) {

            devices[ index ].device_type_default = false;
        }

        return devices;

    }

    /** @function deleteDevice */
    function deleteDevice( devices, serial, deviceType ) {

        //only mess with the same device class
        var source = devices[ deviceType ];

        for ( var index = 0; index < source.length; index++ ) {

            if ( source[ index ].serialNumber === serial ) {

                source.splice( index, 1 );

            }

        }

        devices[ deviceType ] = source;

        return devices;

    }

    function purgeNonDeviceType( newDevice, devices ) {

        //device type has not been set yet
        if ( !newDevice.device_type ) {
            return devices;
        }

        //purge any reference to this device for the wrong device type
        for ( var key in devices ) {

            if ( newDevice.device_type !== key && devices.hasOwnProperty( key ) ) {

                var _deviceType = devices[ key ];

                for ( var i = 0; i < _deviceType.length; i++ ) {

                    var d = _deviceType[ i ];

                    if ( d.serialNumber === newDevice.serialNumber ) {

                        _deviceType.splice( i, 1 );

                    }

                }

                devices[ key ] = _deviceType;

            }

        }

        return devices;

    }

    /** @function addDevice
     * @private 
     * @param devices
     * @param newDevice
     */
    function addDevice( devices, newDevice ) {

        //flag to make sure new device is added or existing one updated
        var added = false;

        devices = purgeNonDeviceType( newDevice, devices );

        if ( newDevice.device_type ) {

            //only mess with the same device class
            var deviceType = devices[ newDevice.device_type ];

            for ( var index = 0; index < deviceType.length; index++ ) {

                if ( deviceType[ index ].serialNumber === newDevice.serialNumber ) {

                    if ( newDevice.device_type_default ) {

                        deviceType = _clearDefaultDevice( deviceType );

                    }

                    if ( newDevice.configurations && newDevice.configurations.length ) {

                        deviceType[ index ] = usb.meta.normalizeDeviceInfo( newDevice );

                    } else {

                        //updating the device configuration
                        deviceType[ index ] = newDevice;

                    }

                    added = true;

                }

            }

            if ( !added ) {

                deviceType.push( usb.meta.normalizeDeviceInfo( newDevice ) );

            }

            //if this is the only device of this type force it to be the default choice
            if ( deviceType.length === 1 ) {
                deviceType[ 0 ].device_type_default = true;
            }

            devices[ newDevice.device_type ] = deviceType;

        }

        return devices;

    }

    /** @function openDeviceArray
     * @private */
    function openDeviceArray( devices ) {

        var openings = [];

        if ( devices && devices.length > 0 ) {

            for ( var index = 0; index < devices.length; index++ ) {

                openings.push( usb.meta.openDevice( devices[ index ] ) );

            }

            return Promise.all( openings );

        }

        return Promise.resolve();

    }

    //handles UI related USB stuff
    //since this is application specific and UI related it is
    //decoupled from the WebUSB code

    window.usb = window.usb || {};

    window.usb.meta = {

        _configuredDevices: undefined,
        _supportedDevices: undefined,
        _registeredDevices: undefined,

        _receiptPrinter: [],
        _cardPrinter: [],
        _ticketPrinter: [],

        devicesConfigured: false,

        /** @function initialize */
        initialize: function () {

            var self = this;

            return self.loadSupportedDevices()
                .then( function ( devices ) {

                    self._configuredDevices = devices;

                    return self.loadConfiguredDevices();

                } );

        },

        /** @function initRegisterDevices */
        initRegisterDevices: function () {

            return {
                "receiptPrinters": [],
                "ticketPrinters": [],
                "cardPrinters": []
            };

        },

        /** @function loadSupportedDevices
         * load officially supported device list
         * - first from IDB
         * - periodically update in the background from server
         * - if no list is available then get from server
         */
        loadSupportedDevices: function () {

            var self = this;

            return localforage.getItem( supported_device_key )
                .then( function ( value ) {

                    if ( value ) {

                        return value;

                    } else {

                        //fetch support data from server
                        return self.fetchSupportedDevices();

                    }

                } ).catch( function ( err ) {
                    // This code runs if there were any errors
                    console.log( "error retrieving support list: ", err );
                } );

        },

        /** @function fetchSupportedDevices
         * make API to retrieve official list of supported vendor 
         * and product ids from server */
        fetchSupportedDevices: function () {

            return fetch( "api/supported.devices.json" )
                .then( function ( response ) {

                    if ( response.ok ) {

                        var devices = response.json();

                        return localforage.setItem( supported_device_key, devices )
                            .then( function () {

                                return devices;

                            } );

                    }

                } );

        },

        /** @function loadConfiguredDevices
         * get list of locally configured devices from IDB
         * use this list to connect to devices
         * and to queue the user to add devices
         * what devices have been configured for this device??
         * receipt, ticket and card printers
         */
        loadConfiguredDevices: function () {

            var self = this;

            return localforage.getItem( configured_device_key )
                .then( function ( value ) {

                    if ( !value ) {

                        value = self.initRegisterDevices();

                    }

                    self._configuredDevices = value;

                    return value;

                } );

        },

        /** @function setConfiguredDevices
         * @param configuration
         */
        setConfiguredDevices: function ( configuration ) {

            if ( configuration && typeof configuration === "object" ) {

                return localforage.setItem( configured_device_key, configuration );

            }

            return Promise.resolve();

        },

        /** @function addConfiguredDevice */
        addConfiguredDevice: function ( newDevice ) {

            var self = this;

            return self.loadConfiguredDevices()
                .then( function ( devices ) {

                    devices = addDevice( devices, newDevice );

                    return self.setConfiguredDevices( devices );

                } );

        },

        /** @function deleteConfiguredDevice */
        deleteConfiguredDevice: function ( serial, deviceType ) {

            var self = this;

            return self.loadConfiguredDevices()
                .then( function ( devices ) {

                    devices = deleteDevice( devices, serial, deviceType );

                    return self.setConfiguredDevices( devices );

                } );

        },

        /** @function normalizeDeviceInfo
         * structure returned from USB device is too nested.
         * need to sureface key property values to a more accessible structure
         */
        normalizeDeviceInfo: function ( device ) {

            if ( !device.configurations || !device.configurations.length ) {
                return device;
            }

            var config = device.configurations[ 0 ],
                _interface = config.interfaces[ 0 ].alternates[ 0 ],
                endpoints = {
                    in: 0,
                    out: 1
                };

            for ( var i = 0; i < _interface.endpoints.length; i++ ) {

                var endpoint = _interface.endpoints[ i ];

                endpoints[ endpoint.direction ] = endpoint.endpointNumber;

            }

            return {
                usb: true,
                bluetooth: device.bluetooth,
                tcp: device.tcp,
                manufacturerName: device.manufacturerName,
                productId: device.productId,
                productName: device.productName,
                serialNumber: device.serialNumber,
                vendorId: device.vendorId,
                device_type_default: device.device_type_default,
                configurationValue: config.configurationValue,
                interfaceNumber: 0,
                endpoints: endpoints
            };

        },

        /** @function setAvailableDevices */
        setAvailableDevices: function ( devices ) {

            var deviceList = this.initRegisterDevices();

            for ( var index = 0; index < devices.length; index++ ) {

                var device = devices[ index ];

                //                device.device_type = receiptPrinters;

                deviceList.receiptPrinters.push( this.normalizeDeviceInfo( device ) );

            }

            return localforage.setItem( configured_device_key, deviceList )
                .then( function () {

                    return devices;

                } );

        },

        /** @function setDevices
         * @param devices
         *
         * Needs some work, currently only does the receipt printer
         */
        setDevices: function ( devices ) {

            self = this;

            for ( var index = 0; index < devices.length; index++ ) {

                //need to see what type of device this is then map to the right type array
                self._receiptPrinter.push( devices[ index ] );

            }

        },

        /** @function getDeviceConfig
         * @param device
         * @param deviceType
         * @returns Promise
         */
        getDeviceConfig: function ( serial ) {

            return this.loadConfiguredDevices()
                .then( function ( devices ) {

                    //                    var config;

                    //purge any reference to this device for the wrong device type
                    for ( var deviceType in devices ) {

                        if ( devices.hasOwnProperty( deviceType ) ) {

                            for ( var i = 0; i < devices[ deviceType ].length; i++ ) {

                                var dev = devices[ deviceType ][ i ];

                                //try serial number for now
                                if ( dev.serialNumber === serial ) {

                                    return dev;

                                }

                            }

                        }

                    }

                    //                    return config;

                } );

        },

        getDefaultDevice: function ( deviceType ) {

            return this.loadConfiguredDevices()
                .then( function ( devices ) {

                    //purge any reference to this device for the wrong device type
                    var typeDevices = devices[ deviceType ];

                    for ( var i = 0; i < typeDevices.length; i++ ) {

                        var dev = typeDevices[ i ];

                        //try serial number for now
                        if ( dev.device_type_default ) {

                            return dev;

                        }

                    }

                } );

        },

        getFirstOpenDevice: function ( deviceType ) {

            return this.loadConfiguredDevices()
                .then( function ( devices ) {

                    return usb.getDevices()
                        .then( function ( registered ) {

                            //purge any reference to this device for the wrong device type
                            var typeDevices = devices[ deviceType ];

                            for ( var i = 0; i < typeDevices.length; i++ ) {

                                var dev = typeDevices[ i ];

                                for ( var j = 0; j < registered.length; j++ ) {

                                    if ( registered[ j ].serialNumber === dev.serialNumber ) {

                                        return registered[ j ];

                                    }

                                }

                            }

                        } );

                } );

        },

        getReceiptPrinter: function () {

            var self = this;

            return self.getDefaultDevice( receiptPrinters )
                .then( function ( printer ) {

                    if ( printer ) {
                        return printer;
                    }

                    return self.getFirstOpenDevice( receiptPrinters );

                } );

        },

        getTicketPrinter: function () {

            var self = this;

            return self.getDefaultDevice( ticketPrinters )
                .then( function ( printer ) {

                    if ( printer ) {
                        return printer;
                    }

                    return self.getFirstOpenDevice( ticketPrinters );

                } );

        },

        /** @function openDevice
         * Open a single device
         *
         * @param {device} a USB device object, must be retrieved from webUSB API
         */
        openDevice: function ( device ) {

            if ( !device || device.opened ) {
                return Promise.resolve( device );
            }

            var self = this,
                configuration;

            return device.open()
                .then( function () {

                    //get configuration for this device
                    //should have the device configuration & interface references defined in config
                    return self.getDeviceConfig( device.serialNumber )
                        .then( function ( config ) {

                            configuration = config;

                        } );

                } )
                .then( function () {

                    return device.selectConfiguration( configuration.configurationValue );

                } )
                .then( function () {

                    return device.claimInterface( configuration.interfaceNumber );

                } )
                .catch( function ( err ) {

                    console.log( err );
                    return Promise.reject( err );
                } );

        },

        /** @function connectToDevices
         * automatically connect to registered hardware
         * Not sure if this method provides any real value :{
         * @returns Promise
         */
        connectToDevices: function () {

            //concat device type properties
            //should switch to a loop over object properties

            return openDeviceArray( [].concat( self.receiptPrinter,
                self._cardPrinter,
                self._ticketPrinter ) );

        },

        /** @function promptUserToConfigureDevices
         * show some sort of visual queue to the user to add hardware
         */
        promptUserToConfigureDevices: function () {}

    };

} )();