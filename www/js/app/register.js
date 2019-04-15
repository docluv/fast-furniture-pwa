(function () {

    formSubmission({
        success: function (resp) {

            console.log(resp);

            window.location.href = "/register/success/";

        },
        error: function (err) {
            console.error("we have not failed, we have learned something new.");
            console.error(err);
        },
        submit: ".btn-register",
        targetURL: "https://7g46i3t1el.execute-api.us-east-1.amazonaws.com/demo/register",
        form: "[name='fast-furniture-registration']"
    });


//    initRegistration();

})();