( function () {

    "use strict";

    //Constants here

    //    var self = love2dev.component;

    function initialize() {

        configurePaymentRequest();

    }

    function configurePaymentRequest() {

        // Feature detection
        if ( window.PaymentRequest ) {

            var checkoutBtn = document.querySelector( ".btn-checkout" ),
                successPanel = document.querySelector( ".success" ),
                legacyPanel = document.querySelector( ".cart-items" ),
                introPanel = document.querySelector( ".cart-items" );

            checkoutBtn.classList.remove( "d-none" );

            // Payment Request is supported in this browser, so we can proceed to use it

            checkoutBtn.addEventListener( "click", function () {
                // Every click on the checkout button should use a new instance of PaymentRequest 
                // object, because PaymentRequest.show() can be called only once per instance.
                var request = new PaymentRequest( buildSupportedPaymentMethodData(),
                    buildShoppingCartDetails() );

                request.show().then( function ( paymentResponse ) {
                    // Here we would process the payment. For this demo, simulate immediate success:
                    paymentResponse.complete( "success" )
                        .then( function () {
                            // For demo purposes:
                            introPanel.classList.add( "d-none" );
                            successPanel.classList.remove( "d-none" );
                        } );

                } ).catch( function ( error ) {
                    // Handle cancelled or failed payment. For demo purposes:
                    introPanel.classList.add( "d-none" );
                    legacyPanel.classList.remove( "d-none" );

                } );
            } );

        }

    }

    function buildSupportedPaymentMethodData() {
        // Example supported payment methods:
        return [ {
            supportedMethods: 'basic-card',
            data: {
                supportedNetworks: [ 'visa', 'mastercard' ],
                supportedTypes: [ 'debit', 'credit' ]
            }
        } ];
    }

    function buildShoppingCartDetails() {
        // Hardcoded for demo purposes:
        return {
            id: 'order-123',
            displayItems: [ {
                label: 'Example item',
                amount: {
                    currency: 'USD',
                    value: '1.00'
                }
            } ],
            total: {
                label: 'Total',
                amount: {
                    currency: 'USD',
                    value: '1.00'
                }
            }
        };
    }

    function displayDirections() {}

    initialize();

} )();