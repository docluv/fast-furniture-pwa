//questions

(function (window, document, undefined) {
  "use strict";

  var $confirmationPrompt = $(".slidedown-container"),
    $btnConfirm = $(".slidedown-allow-button"),
    $btnCancel = $(".slidedown-cancel-button");

  $btnCancel.on("click", hide);
  $btnConfirm.on("click", confirm);

  function hide() {
    $confirmationPrompt.addClass("d-none").removeClass("d-flex");
  }

  function confirm(e) {
    e.preventDefault();

    prompt.confirmCallback();

    return false;
  }

  function show() {
    $confirmationPrompt.removeClass("d-none").addClass("d-flex");
  }

  window.prompt = {
    show: show,
    hide: hide,
    confirmCallback: function () {}
  };
})(window, document);
