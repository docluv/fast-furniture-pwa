(function () {

    "use strict";

    var SHOP_CART = "shopping_cart",
        ORDER = "order";

    function addChangeCallback(func) {

        callbacks.addCallback("cart_change", "cart", func);

    }

    function getCart() {

        return localforage.getItem(SHOP_CART);
    }

    function changeQty(assetId, qty) {
        if (qty < 1) {
            return deleteCartItem(assetId);
        }

        return getCart()
            .then(function (cart) {

                if (cart) {

                    var product_index = cart.cart_items.findIndex(p => {

                        return p.assetId === assetId;

                    });

                    //remove from active list
                    cart.cart_items[product_index].qty = qty;
                    cart.cart_items[product_index].total = qty * cart.cart_items[product_index].price;

                    cart.total = 0;

                    for (var index = 0; index < cart.cart_items.length; index++) {

                        cart.total = cart.total + (parseInt(cart.cart_items[index].qty, 10) *
                            parseFloat(cart.cart_items[index].price));

                    }

                    return updateCart(cart)
                        .then(function () {
                            return cart;
                        });

                }

            });

    }

    function updateCart(cart) {

        if (!cart) {
            return localforage.removeItem(SHOP_CART)
                .then(function () {
                    callbacks.fireCallback("cart_change", cart);
                });
        }

        return localforage.setItem(SHOP_CART, cart)
            .then(function () {
                callbacks.fireCallback("cart_change", cart);
            });

    }

    function deleteCartItem(assetId) {

        if (assetId) {

            return getCart()
                .then(function (cart) {

                    if (cart) {

                        var product_index = cart.cart_items.findIndex(p => {

                            return p.assetId === assetId;

                        });

                        //remove from active list
                        cart.cart_items.splice(product_index, 1);

                        cart.total = 0;

                        for (var index = 0; index < cart.cart_items.length; index++) {

                            cart.total = cart.total + (parseInt(cart.cart_items[index].qty, 10) *
                                parseFloat(cart.cart_items[index].price));

                        }

                        return updateCart(cart)
                            .then(function () {
                                return cart;
                            });

                    }

                });

        } else {

            return Promise.reject("missing product Id");

        }

    }

    function addCartItem(product) {

        if (product.assetId) {

            return getCart()
                .then(function (cart) {

                    cart = cart || {
                        "total": 0,
                        "cart_items": []
                    };

                    cart.total = 0;

                    var canAdd = true;
                    var index = 0;

                    /*
                    for ( index = 0; index < cart.cart_items.length; index++ ) {

                        if ( cart.cart_items[ index ].assetId === product.assetId ) {

                            cart.cart_items[ index ].qty += 1;
                            cart.cart_items[ index ].total =
                                cart.cart_items[ index ].qty * cart.cart_items[ index ].price;

                            cart.cart_items[ index ].ngo_share = cart.cart_items[ index ].total * 0.85;
                            cart.cart_items[ index ].annum_share = cart.cart_items[ index ].total * 0.15;

                            cart.total = cart.total + ( parseInt( cart.cart_items[ index ].qty, 10 ) *
                                parseFloat( cart.cart_items[ index ].price ) );

                            canAdd = false;
                            index = cart.cart_items.length;

                        }

                    }
                    */

                    if (canAdd) {

                        product.total = product.qty * product.price;
                        product.annum_fee = product.total * 0.15;
                        product.ngo_share = product.total * 0.85;
                        product.annum_share = product.total * 0.15;

                        product.annum_fee = product.annum_fee.toFixed(2);
                        product.ngo_share = product.ngo_share.toFixed(2);

                        cart.cart_items.push(product);
                    }


                    for (index = 0; index < cart.cart_items.length; index++) {

                        cart.total += (parseInt(cart.cart_items[index].qty, 10) *
                            parseFloat(cart.cart_items[index].price));


                    }

                    return updateCart(cart);

                });

        } else {

            return Promise.reject("missing product Id");

        }

    }

    function throwExecption(response) {

        return response.json()
            .then(function (err) {

                throw err;

            });

    }

    var retries = 0;

    function completePurchase(purchase) {

        if (retries > 1) {
            return Promise.reject({
                "message": "problem connecting to payment processor...please try again after a few seconds",
                "code": 400
            });
        }

        var confirmation;

        return love2dev.http.post({
                "mode": "cors",
                "url": siteConfig.apiBase + "cart/purchase",
                "body": JSON.stringify(purchase)
            })
            .then(function (response) {

                if (response.ok) {

                    return response.json();

                } else {
                    return throwExecption(response);
                }

            })
            .then(function (c) {

                confirmation = c;

                return updateCart({});

            })
            .then(function () {

                return love2dev.user.getUserByUsername({
                    "username": purchase.username,
                    "forceUpdate": true
                });

            })
            .then(function () {

                return love2dev.product.
                forceCachedUserproductsUpdate(purchase.user_id);

            })
            .then(function () {
                return confirmation;
            })
            .catch(function (err) {

                //place strip connection error handler hereF

                console.error(err);

                if (err && err.detail &&
                    err.detail.code && err.detail.code !== "ECONNRESET") {

                    throw err;

                } else {
                    console.info("retry the request");

                    retries += 1;

                    return completePurchase(purchase);
                }

            });

    }

    function cancelSubscription(options) {

        return love2dev.http.post({
                "mode": "cors",
                "url": siteConfig.apiBase + "cart/cancel",
                "body": JSON.stringify(options)
            })
            .then(function (response) {

                if (response.ok) {

                    return response.json();

                } else {
                    return throwExecption(response);
                }

            });

    }

    function deletePaymentMethod(options) {

        return love2dev.http.post({
                "mode": "cors",
                "url": siteConfig.apiBase + "cart/payment",
                "body": JSON.stringify(options)
            })
            .then(function (response) {

                if (response.ok) {

                    return response.json();

                } else {
                    return throwExecption(response);
                }

            })
            .then(function (deleteResponse) {

                return love2dev.user.getUserByUsername({
                        username: options.username,
                        forceUpdate: true
                    })
                    .then(function () {

                        return deleteResponse;

                    });

            });

    }

    function postCharge(cart, profile, paymentMethod) {

        return love2dev.http.post({
                "mode": "cors",
                "url": siteConfig.apiBase + ORDER,
                "body": JSON.stringify({
                    "user": profile,
                    "cart": cart,
                    "paymentMethod": paymentMethod.id || paymentMethod
                })
            })
            .then(function (response) {

                if (response.ok) {
                    return response.json();
                }

            });

    }

    love2dev.cart = {

        retries: retries,
        addChangeCallback: addChangeCallback,
        completePurchase: completePurchase,
        postCharge: postCharge,

        changeQty: changeQty,
        cancelSubscription: cancelSubscription,

        getCart: getCart,
        updateCart: updateCart,
        deleteCartItem: deleteCartItem,
        addCartItem: addCartItem,

        deletePaymentMethod: deletePaymentMethod

    };

}());