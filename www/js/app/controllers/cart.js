(function () {
    "use strict";

    var self = love2dev.component,
        profile,
        cart,
        auth = false,
        promptState = false;

    var $btnCheckout = $(".btn-checkout"),
        $checkoutWrapper = $(".checkout-wrapper"),
        $cartWrapper = $(".cart-wrapper"),
        $cartContainer = $(".cart-container"),
        $confirmationContainer = $(".purchase-confirmation-container"),
        $existingPaymentsWrapper = $(".existing-payments-wrapper"),
        $paymentWrapper = $(".customer-payments-wrapper"),
        $shippingWraper = $(".customer-shipping-wrapper"),
        $anonymousWrapper = $(".customer-anonymous-contact"),
        $a2hsPromo = $(".a2hs-promo"),
        $checkoutBtnWrapper = $(".checkout-btn-wrapper"),
        $confirmPurchase = $(".purchase-confirmation"),
        $alert = $(".alert"),
        $cardError = $("#card-errors"),
        $first_name = $("[name='given_name']"),
        $last_name = $("[name='family_name']"),
        $email = $("[name='user_email']"),
        $btnShipping = $(".btn-submit-shipping"),
        $btnNewShipping = $(".btn-create-new-address"),
        $btnNewPayment = $(".btn-create-new-payment"),
        $btnDefaultPayment = $(".btn-select-default-payment"),
        $defaultPayment = $("[name='make-default-card']"),
        $cancelPaymentDelete = $(".btn-cancel-delete-payment"),
        $confirmPaymentDelete = $(".btn-delete-payment-confirmation");

    var tokenId,
        stripe,
        elements,
        card,
        // cardNumber,
        // cardExpiry,
        // cardCvc,
        paymentMethod,
        shippingAddress,
        requiresShipping = false;

    // Custom styling can be passed to options when creating an Element.
    // (Note that this demo uses a wider set of styles than the guide below.)
    var style = {
        base: {
            color: "#333",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", "sans-serif"',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#4C4C4C"
            }
        },
        invalid: {
            color: "#DC0002",
            iconColor: "#EF6361"
        }
    };

    function initialize() {
        love2dev.auth.addNoAuthCallback(loadPage);
        // love2dev.auth.addAuthCallback( authorizedHandler );
        love2dev.app.canPromptCallback(canPrompt);

        love2dev.app.addProfileCallback(authorizedHandler);
    }

    function checkShippingRequired() {
        for (var index = 0; index < cart.cart_items.length; index++) {
            if (cart.cart_items[index].requires_shipping) {
                requiresShipping = true;
            }
        }
    }

    function loadCart() {
        return getCart()
            .then(renderCart)
            .then(function () {
                if (cart.cart_items.length > 0) {
                    $btnCheckout.toggleDisabled(false);

                    showCheckout();

                    checkShippingRequired();
                }
            });
    }

    function hideCartPanels() {
        $(".cart-panel ").addClass("d-none").removeClass("d-flex");
    }

    function authorizedHandler(_profile) {
        auth = true;
        profile = _profile;

        loadCart()
            .then(bindEvents)
            .then(function () {
                if (cart && cart.cart_items && cart.cart_items.length > 0) {
                    initStripe();
                }
            })
            .then(checkA2HSPrompt);
    }

    function loadPage() {
        fetchUser()
            .then(loadCart)
            .then(bindEvents)
            .then(function () {
                if (cart && cart.cart_items && cart.cart_items.length > 0) {
                    initStripe();
                }
            });
    }

    function bindEvents() {
        $btnCheckout.on(love2dev.events.click, toggleCheckout);

        $(".btn-submit-anonymous").on(love2dev.events.click, submitAnoymous);
        $(".btn-cancel-anonymous").on(love2dev.events.click, cancelAnoymous);

        $(".btn-cancel-payment").on(love2dev.events.click, function (e) {
            hideCartPanels();

            if (profile && profile.sources) {
                $existingPaymentsWrapper
                    .addClass(love2dev.cssClasses.dFlex)
                    .removeClass(love2dev.cssClasses.dNone);
            } else {
                toggleCart();
            }

            return false;
        });

        $(".btn-submit-payment").on(love2dev.events.click, submitCardInfo);

        $(".btn-shipping-cancel").on(love2dev.events.click, cancelShipping);
        $btnShipping.on(love2dev.events.click, submitShipping);

        $btnNewPayment.on(love2dev.events.click, function (e) {
            hideCartPanels();

            $paymentWrapper
                .toggleClass(love2dev.cssClasses.dNone)
                .toggleClass(love2dev.cssClasses.dFlex);

            return false;
        });

        $(".btn-confirm-purchase").on(love2dev.events.click, confirmPurchase);

        $first_name.on(love2dev.events.keyup, validateAnonymous);
        $last_name.on(love2dev.events.keyup, validateAnonymous);
        $email.on(love2dev.events.keyup, validateAnonymous);

        $(
            ".shipping-form input, .shipping-form select, .shipping-form textarea"
        ).on("blur", function (e) {
            console.log("validate shipping");

            $btnShipping.toggleDisabled(
                !document.querySelector(".shipping-form").reportValidity()
            );
        });

        $btnNewShipping.on(love2dev.events.click, newShippingAddress);

        $btnDefaultPayment.on(love2dev.events.click, function (e) {
            setPaymentMethodToDefault();

            hideCartPanels();

            if (requiresShipping) {
                if (profile.shipping) {
                    if (profile.shipping.length === 1) {
                        profile.shipping[0].default = true;
                    }

                    renderShippingList();
                } else {
                    toggleShipping();
                }
            } else {
                togglePurchaseConfirmation();
            }

            return false;
        });

        $cancelPaymentDelete.on(love2dev.events.click, handlePaymentDeleteCancel);

        $confirmPaymentDelete.on(
            love2dev.events.click,
            handleDeletePaymentConfirmation
        );

        $(".btn-select-default-address").on(
            love2dev.events.click,
            selectDefaultPayment
        );
    }

    /* Start Stripe */

    function initStripe() {
        var script = document.createElement("script");

        script.src = "https://js.stripe.com/v3/";

        script.onload = stripeLoaded;

        document.body.appendChild(script);
    }

    function handleStripeError(event) {
        if (event.error) {
            $cardError.text(event.error.message);
        } else {
            $cardError.text("");
        }
    }

    function stripeLoaded() {
        if (!stripe) {
            stripe = Stripe("pk_test_Upqdwttf0zncERMPkloAqK9m");

            if (!elements) {
                elements = stripe.elements();
            }

            if (!card) {
                /*
                        cardNumber
                        cardExpiry
                        cardCvc

                        handleStripeError
                        */

                // Create an instance of the card Element.
                card = elements.create("card", {
                    style: style
                });

                // cardNumber = elements.create( 'cardNumber', {
                //     style: style
                // } );

                // cardExpiry = elements.create( 'cardExpiry', {
                //     style: style
                // } );

                // cardCvc = elements.create( 'cardCvc', {
                //     style: style
                // } );

                // cardNumber.on( love2dev.events.change, handleStripeError );
                // cardExpiry.on( love2dev.events.change, handleStripeError );
                // cardCvc.on( love2dev.events.change, handleStripeError );

                card.on(love2dev.events.change, handleStripeError);

                // Add an instance of the card Element into the `card-element` <div>.
                card.mount("#card-element");
            }
        }
    }

    function submitCardInfo() {
        //show processing animation here

        return stripe
            .createSource(card, {
                type: "card",
                currency: "usd"
            })
            .then(function (result) {
                if (result.error) {
                    // Inform the user if there was an error.

                    $cardError.removeClass(love2dev.cssClasses.dNone);

                    $cardError.text(result.error.message);
                } else {
                    $cardError.addClass(love2dev.cssClasses.dNone);
                    // Send the token to your server.
                    return stripeTokenHandler(result.source).then(function () {
                        hideCartPanels();

                        if (requiresShipping) {
                            if (profile.shipping) {
                                renderShippingList();
                            } else {
                                toggleShipping();
                            }
                        } else {
                            togglePurchaseConfirmation();
                        }
                    });
                }
            });
    }

    // Submit the form with the token ID.
    function stripeTokenHandler(pm) {
        if (pm) {
            return addPaymentMethod({
                id: pm.id,
                default: $defaultPayment.checked(),
                card: pm.card,
                created: pm.created,
                type: pm.type
            }).then(function () {
                setPayentMethod(pm.id);
            });
        }

        return Promise.resolve();
    }

    function addPaymentMethod(paymentMethod) {
        profile.sources = profile.sources || [];

        paymentMethod.card.brand = paymentMethod.card.brand.replace(/\s+/, "-");

        if (paymentMethod.default) {
            for (var index = 0; index < profile.sources.length; index++) {
                profile.sources[index].default = false;
            }
        }

        profile.sources.push(paymentMethod);

        sortPaymentMethods();

        return updateUser();
    }

    function sortPaymentMethods() {
        profile.sources.sort(function (a, b) {
            return a.default ? -1 : 1;
        });
    }

    function setDefaultPaymentMethod(id, state) {
        profile.sources = profile.sources || [];

        for (var i = 0; i < profile.sources.length; i++) {
            profile.sources[i].default = false;
        }

        var index = profile.sources.findIndex(function (pm) {
            return pm.id === id;
        });

        if (state) {
            profile.sources[index].default = true;
        } else if (profile.sources && profile.sources.length > 0) {
            profile.sources[0].default = true;
        }

        sortPaymentMethods();

        updateUser();
    }

    function deletePaymentMethod(id) {
        profile.sources = profile.sources || [];

        var index = profile.sources.findIndex(function (pm) {
            return pm.id === id;
        });

        var isDefault = profile.sources[index].default;

        profile.sources.splice(index, 1);

        if (profile.sources && profile.sources.length > 0 && isDefault) {
            profile.sources[0].default = true;
        }

        sortPaymentMethods();

        updateUser();
    }

    /* End Stripe */

    function renderCart() {
        cart = cart || {
            cart_items: [],
            total: 0
        };

        return self.fetchAndRenderTemplate("src/templates/cart.html", cart)
            .then(function (html) {
                var $target = $(".cart-display");

                $target.html(html);

                var $cartConfirmation = $(".cart-confirmation-display");

                $cartConfirmation.html(html);

                $(".delete-cart").on(love2dev.events.click, deleteCartItem);

                if (!cart.cart_items && !cart.cart_items.length) {
                    var $noItems = $(".no-items-wrapper");
                    $noItems.removeClass(love2dev.cssClasses.dNone);
                    $noItems.addClass(love2dev.cssClasses.dFlex);
                } else if (cart.cart_items.length > 0) {
                    $checkoutBtnWrapper.addClass(love2dev.cssClasses.dFlex);
                    $checkoutBtnWrapper.removeClass(love2dev.cssClasses.dNone);
                }
            });
    }

    function fetchUser() {
        return love2dev.user
            .getProfile()
            .then(function (u) {
                profile = u;

                return profile;
            })
            .catch(function (err) {
                console.error(err);
            });
    }

    function resetPage() {
        var $noItems = $(".no-items-wrapper");
        $noItems.removeClass(love2dev.cssClasses.dFlex);
        $noItems.addClass(love2dev.cssClasses.dNone);
    }

    function deleteCartItem(e) {
        e.preventDefault();

        var productId = e.currentTarget.getAttribute("assetid");

        love2dev.cart.deleteCartItem(productId).then(function () {
            resetPage();

            return getCart().then(renderCart);
        });

        return false;
    }

    function getCart() {
        return love2dev.cart.getCart().then(function (result) {
            if (result) {
                result.total = parseFloat(result.total).toFixed(2);

                cart = result;
            }

            if (!result || !result.items || result.items.length === 0) {
                $checkoutBtnWrapper.addClass(love2dev.cssClasses.dNone);
                $checkoutBtnWrapper.removeClass(love2dev.cssClasses.dFlex);
            }

            return result;
        });
    }

    function toggleCheckout() {
        hideCartPanels();

        if (profile) {
            togglePaymentForm();
        } else {
            toggleAnonymousUser();
        }
    }

    function toggleAnonymousUser() {
        $anonymousWrapper
            .toggleClass(love2dev.cssClasses.dNone)
            .toggleClass(love2dev.cssClasses.dFlex);

        $first_name[0].focus();
    }

    function cancelAnoymous(e) {
        e.preventDefault();

        toggleCart(true);

        return false;
    }

    function validateAnonymous(e) {
        e.preventDefault();

        $(".btn-submit-anonymous").toggleDisabled(!isAnonymousValid());

        return false;
    }

    function isAnonymousValid() {
        return $first_name.isValid() && $last_name.isValid() && $email.isValid();
    }

    function submitAnoymous(e) {
        e.preventDefault();

        saveAnonymousUser().then(function () {
            toggleAnonymousUser(false);

            if (requiresShipping) {
                toggleShipping();
            } else {
                togglePaymentForm();
            }
        });

        return false;
    }

    function toggleCart() {
        $cartContainer
            .toggleClass(love2dev.cssClasses.dFlex)
            .toggleClass(love2dev.cssClasses.dNone);
    }

    function togglePaymentForm() {
        hideCartPanels();

        var $main = document.querySelector(".main-container ");

        $main.scrollTo(0, 0);

        if (profile && profile.sources && profile.sources.length) {
            //show payment options
            $existingPaymentsWrapper
                .removeClass(love2dev.cssClasses.dNone)
                .addClass(love2dev.cssClasses.dFlex);

            if (profile.sources && profile.sources.length === 1) {
                profile.sources[0].default = true;
            }

            return self
                .fetchAndRenderTemplate("src/templates/payment-list.html", {
                    paymentMethods: profile.sources
                })
                .then(function (html) {
                    $(".payments-wrapper").html(html);

                    bindPaymentListEvents();
                });

            //allow new card entry
            //allow edit payment
        } else {
            $defaultPayment.checked(true); //first payment method, so default....

            $paymentWrapper
                .removeClass(love2dev.cssClasses.dNone)
                .addClass(love2dev.cssClasses.dFlex);
        }
    }

    function bindPaymentListEvents() {
        $(".payment-default").on(love2dev.events.click, toggleDefaultPayment);
        $(".delete-payment").on(love2dev.events.click, deletePayment);
        $(".protocol-text").on(love2dev.events.dblclick, handleSetPayentMethod);
    }

    function setPaymentMethodToDefault() {
        if (profile.sources.length > 1) {
            var index = profile.sources.findIndex(function (pm) {
                return pm.default;
            });

            paymentMethod = profile.sources[index];
        } else {
            paymentMethod = profile.sources[0];
        }
    }

    function setPayentMethod(id) {
        var index = profile.sources.findIndex(function (pm) {
            return pm.id === id;
        });

        paymentMethod = profile.sources[index];
    }

    function handleSetPayentMethod(e) {
        e.preventDefault();

        var id = e.currentTarget.getAttribute("token");

        setPayentMethod(id);

        togglePurchaseConfirmation();

        $existingPaymentsWrapper
            .removeClass(love2dev.cssClasses.dFlex)
            .addClass(love2dev.cssClasses.dNone);

        return false;
    }

    function toggleDefaultPayment(e) {
        var id = e.currentTarget.getAttribute("token"),
            setDefault = !e.currentTarget.getAttribute("isDefault");

        setDefaultPaymentMethod(id, setDefault);

        togglePaymentForm();

        return false;
    }

    function deletePayment(e) {
        tokenId = e.currentTarget.getAttribute("token");

        modal.toggleModal(".delete-payment-confirmation", true);

        return false;
    }

    function handlePaymentDeleteCancel(e) {
        modal.toggleModal(".delete-payment-confirmation", false);

        return false;
    }

    function handleDeletePaymentConfirmation(e) {
        modal.toggleModal(".delete-payment-confirmation", false);

        deletePaymentMethod(tokenId);

        togglePaymentForm();

        return false;
    }

    function showAlert(msg) {
        $alert.text(msg);

        $alert.removeClass(love2dev.cssClasses.dNone);

        setTimeout(function () {
            $alert.addClass(love2dev.cssClasses.dNone);
        }, 7000);
    }

    function togglePurchaseConfirmation() {
        hideCartPanels();

        //insert payment details here
        $(".card-brand")[0].src = "img/" + paymentMethod.card.brand + ".svg";
        $(".card-brand")[0].alt = paymentMethod.card.brand;
        $(".last-4-digits").text(paymentMethod.card.last4);
        $(".card-exp").text(
            paymentMethod.card.exp_month + "/" + paymentMethod.card.exp_year
        );

        if (shippingAddress) {
            $(".confirm-address1").text(shippingAddress.address1);
            $(".confirm-address2").text(shippingAddress.address2);
            $(".confirm-city-state-zip").text(
                shippingAddress.shipping_city +
                " " +
                shippingAddress.stateAbbr +
                " " +
                shippingAddress.shipping_postal_code
            );

            //show shipping address
            $(".shipping-address-confirmation")
                .removeClass(love2dev.cssClasses.dNone)
                .addClass(love2dev.cssClasses.dFlex);
        }

        $confirmPurchase
            .toggleClass(love2dev.cssClasses.dNone)
            .toggleClass(love2dev.cssClasses.dFlex);
    }

    function toggleConfirmation() {
        $confirmationContainer
            .toggleClass(love2dev.cssClasses.dFlex)
            .toggleClass(love2dev.cssClasses.dNone);
    }

    function confirmPurchase(e) {
        togglePurchaseConfirmation();

        $cartWrapper
            .toggleClass(love2dev.cssClasses.dNone)
            .toggleClass(love2dev.cssClasses.dFlex);
        toggleProcessing();

        love2dev.cart
            .postCharge(cart, profile, paymentMethod.id)
            .then(love2dev.cart.updateCart)
            .then(function () {
                toggleProcessing();
                toggleConfirmation();
                console.log("completed purchase");
            });

        return false;
    }

    function saveAnonymousUser() {
        if (!isAnonymousValid()) {
            showAlert("a field is invalid");

            return Promise.reject("invalid form");
        }

        //temp username, email
        profile = {
            first_name: $first_name.value(),
            last_name: $last_name.value(),
            email: $email.value(),
            username: $email.value()
        };

        return updateUser();
    }

    function updateUser() {
        return love2dev.user.updateUser(profile).then(function (result) {
            if (!result.exist || result.assetId) {
                profile = result;

                // } else
                // {
                //     location.href = "login/";
            }
        });
    }

    function showCheckout() {
        $checkoutWrapper
            .addClass(love2dev.cssClasses.dFlex)
            .removeClass(love2dev.cssClasses.dNone);
    }

    function toggleProcessing() {
        var $processingCard = $(".processing-payment");

        $processingCard
            .toggleClass(love2dev.cssClasses.dNone)
            .toggleClass(love2dev.cssClasses.dFlex);
    }

    function canPrompt(platform) {
        promptState = platform;

        checkA2HSPrompt();
    }

    function checkA2HSPrompt() {
        if (promptState) {
            $a2hsPromo
                .removeClass(love2dev.cssClasses.dNone)
                .addClass(love2dev.cssClasses.dFlex);

            $(".btn-triger-a2hs").on(love2dev.events.click, installAnnum);
        }
    }

    function installAnnum(e) {
        e.preventDefault();

        return false;
    }

    /* begin shipping */

    function renderShippingList() {
        return self
            .fetchAndRenderTemplate("src/templates/shipping-list.html", {
                shipping: profile.shipping
            })
            .then(function (html) {
                $(".address-wrapper").html(html);

                bindShippingListEvents();
                showShippingList();
            });
    }

    function bindShippingListEvents() {
        $(".shipping-default").on(love2dev.events.click, toggleDefaultPayment);
        $(".delete-address").on(love2dev.events.click, deleteAddress);
        $(".shipping-address").on(love2dev.events.dblclick, handleSetAddress);
        $(".edit-address").on(love2dev.events.click, editAddress);
    }

    function deleteAddress(e) {
        var id = e.currentTarget.getAttribute("addressId");

        var index = profile.shipping.findIndex(function (pm) {
            return pm.id === id;
        });

        profile.shipping = profile.shipping.slice(index, 1);

        renderShippingList();
    }

    function handleSetAddress(e) {
        e.preventDefault();

        var id = e.currentTarget.getAttribute("addressId");

        setShippingAddress(id);

        return false;
    }

    function setShippingAddress(id) {
        profile.shipping = profile.shipping || [];

        for (var i = 0; i < profile.shipping.length; i++) {
            profile.shipping[i].default = false;
        }

        var index = profile.shipping.findIndex(function (pm) {
            return pm.id === id;
        });

        if (state) {
            profile.shipping[index].default = true;
        } else {
            profile.shipping[0].default = true;
        }

        sortShippingMethods();

        updateUser();

        togglePurchaseConfirmation();
    }

    function sortShippingMethods() {
        profile.shipping.sort(function (a, b) {
            return a.default ? -1 : 1;
        });
    }

    function showShippingList() {
        $(".customer-shipping-list-wrapper")
            .toggleClass(love2dev.cssClasses.dFlex)
            .toggleClass(love2dev.cssClasses.dNone);
    }

    function toggleShipping() {
        $shippingWraper
            .toggleClass(love2dev.cssClasses.dFlex)
            .toggleClass(love2dev.cssClasses.dNone);
    }

    function cancelShipping(e) {
        e.preventDefault();

        hideCartPanels();

        showShippingList();

        return false;
    }

    function editAddress(e) {
        e.preventDefault();

        var id = e.currentTarget.getAttribute("addressId");

        formSubmission.serialize(getSelectedAddress(id), ".shipping-form");

        return false;
    }

    function getSelectedAddress(id) {
        var index = profile.shipping.findIndex(function (pm) {
            return pm.id === id;
        });

        return profile.shipping[index];
    }

    function submitShipping(e) {
        e.preventDefault();

        var address = formSubmission.serialize(".shipping-form");

        if (!address.addressId || address.addressId === "") {
            address.addressId = Date.now();
        }

        console.log(address);

        profile.shipping = profile.shipping || [];

        profile.shipping.push(address);

        console.log("update user profile before completing checkout");

        return updateUser().then(function () {
            toggleShipping();
            togglePurchaseConfirmation();

            return false;
        });
    }

    function newShippingAddress() {
        hideCartPanels();
        showShippingList();
        toggleShipping();
    }

    function selectDefaultPayment(e) {
        e.preventDefault();

        for (var index = 0; index < profile.shipping.length; index++) {
            if (profile.shipping[index].default) {
                shippingAddress = profile.shipping[index];
            }
        }

        togglePurchaseConfirmation();

        return false;
    }

    /* end shipping */

    initialize();

})();
