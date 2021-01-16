(function () {
  "use strict";

  var config = {
    selector: ".primary-alert",
    msgSelector: ".primary-alert",
    timeout: 10000,
    hide: "d-none",
    show: "d-flex",
    exitAnimation: "fadeOut",
    introAnimation: "fadeIn",
    alertType: "info"
  };

  var $alert;

  function showAlert(options) {
    if (!options.msg) {
      return;
    }

    options = Object.assign({}, config, options);

    if (!$alert) {
      $alert = document.querySelector(options.selector);

      if ($alert) {
        $alert.addEventListener("animationend", function () {
          if ($alert.classList.contains(options.exitAnimation)) {
            $alert.classList.remove(options.exitAnimation);
            $alert.classList.add(options.introAnimation);
            $alert.classList.add(options.hide);
            $alert.classList.remove(options.show);
          }
        });
      } else {
        return;
      }
    }

    $alert.innerText = options.msg;

    $alert.classList.remove(options.hide);
    $alert.classList.add(options.show);

    for (var index = 0; index < $alert.classList.length; index++) {
      if ($alert.classList[index].indexOf("alert-") > -1) {
        $alert.classList.remove($alert.classList[index]);
      }
    }

    $alert.classList.add("alert-" + options.alertType);

    setTimeout(function () {
      hideAlert(options);
    }, options.timeout);
  }

  function hideAlert(options) {
    options = Object.assign({}, config, options);

    if ($alert) {
      $alert.classList.remove(options.introAnimation);
      $alert.classList.add(options.exitAnimation);
    }
  }

  window.alert_banner = {
    showAlert: showAlert,
    hideAlert: hideAlert
  };
  
})();
