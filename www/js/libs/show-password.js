(function () {
    "use strict";

    var $showPassword = $(".show-password-btn");
    
    $showPassword.on("click", showPassword);

    function showPassword(e){

        e.preventDefault();

        var target = e.currentTarget.getAttribute("for"),
            $target = document.getElementById(target);

        if(e.currentTarget.classList.contains("hide-btn")){
            $target.type = "password";
        }else{
            $target.type = "text";
        }

        e.currentTarget.classList.toggle("hide-btn");

        return false;
    }


})();
