( function () {

  "use strict";

  var defaults = {
    cameraList: ".camera-list",
    videoPlayer: "camera-player",
    cameraToggle: ".btn-toggle-camera",
    snapPhotoRow: ".row-capture-btn",
    snapPhotoBtn: ".btn-capture",
    srcWrapper: ".camera-source-wrapper",
    retakePhoto: ".btn-retake-photo",
    photoPreview: ".image-upload-preview",
    selectPhotoCallback: function () {},
    previewPhoto:function(){}
  };

  //need to add redirectUri to the queryString
  var videoElement = document.querySelector( "video" ),
    $videoid = document.querySelector( "#cameraList" ),
    $switchCameras = $( ".btn-toggle-camera" ),
    $cameraRow,
    deviceId = "",
    devices = [],
    canvas,
    $captureBtnRow,
    config;

  function init() {

    if ( "mediaDevices" in navigator && videoElement && $videoid ) {
      setupCamera();
    }

  }

  function setupCamera() {

    canvas = document.createElement( "canvas" );

    canvas.classList.add("camera-capture-canvas");

    $captureBtnRow = $( config.snapPhotoRow );

    $videoid.onchange = function () {

      deviceId = $videoid.value;

      getStream();

    };

    return navigator.mediaDevices
      .enumerateDevices()
      .then( gotDevices )
      //   .then( getStream )
      .catch( handleError );
  }

  function gotDevices( deviceInfos ) {

    console.log( deviceInfos );

    devices = [];

    for ( var index = 0; index < deviceInfos.length; index++ ) {

      if ( deviceInfos[ index ].kind === "videoinput" ) {
        devices.push( deviceInfos[ index ] );
      }

    }

    deviceId = devices[ 0 ].deviceId;

    if ( devices.length < 3 ) {
      //$switchCameras.addClass( "d-none" );
      getStream();
    }

    if ( devices.length > 2 ) {

      deviceInfos.forEach( function ( deviceInfo ) {

        if ( deviceInfo.kind === "videoinput" && deviceInfo.deviceId && deviceInfo.deviceId !== "" ) {
          var option = document.createElement( "option" );

          option.value = deviceInfo.deviceId;

          option.text = deviceInfo.label || "camera " + ( $videoid.length + 1 );

          $videoid.appendChild( option );
        }
      } );

      $( ".camera-list-wrapper" ).addClass( "d-flex" );

    }

    $switchCameras.on( "click", toggleCameras );

  }

  function uploadPhoto(){

      config.previewPhoto( canvas );

  }

  function stopStream() {

    if ( window.stream ) {
      window.stream.getTracks().forEach( function ( track ) {
        track.stop();
      } );
    }

  }

  function getStream() {

    stopStream();

    // var constraints = {
    //   video: {
    //     width: {
    //       min: 1280
    //     },
    //     height: {
    //       min: 720
    //     }
    //   }
    // };

    navigator.mediaDevices
      .getUserMedia( {
        video: {
          width: {
            min: 320,
            ideal: 1280,
            max: 1920
          },
          height: {
            min: 480,
            ideal: 720,
            max: 1080
          }
        },
        deviceId: {
          exact: deviceId
        }
      } )
      .then( gotStream )
      .then( showCapture )
      .catch( handleError );

  }

  function showCapture() {

    $captureBtnRow.removeClass( "d-none" );

    //$( config.snapPhotoBtn + ", " + config.retakePhoto ).on( "click", capturePhoto );
    $( config.snapPhotoBtn ).on( "click", capturePhoto );

  }

  /**
   * Captures a image frame from the provided video element.
   *
   * @param {Video} video HTML5 video element from where the image frame will be captured.
   * @param {Number} scaleFactor Factor to scale the canvas element that will be return. This is an optional parameter.
   *
   * @return {Canvas}
   */
  function capturePhoto( evt ) {

    evt.preventDefault();

    var $photoCapture = $( ".row-captured-photo" ),
      $cameraPlayer = document.querySelector( ".camera-player" );

    $captureBtnRow.addClass("d-none");
    //hide camera canvas
    //display preview

    if ( $cameraPlayer.paused ) {

      $cameraPlayer.play();
      getStream();
      $captureBtnRow.removeClass( "d-none" );

    } else {

      canvas.height = $cameraPlayer.videoHeight;
      canvas.width = $cameraPlayer.videoWidth;

      var ctx = canvas.getContext( "2d" );

      ctx.drawImage( $cameraPlayer, 0, 0, $cameraPlayer.videoWidth, $cameraPlayer.videoHeight );

      var img_b64 = canvas.toDataURL( 'image/jpeg' );

      $( config.photoPreview )[ 0 ].src = URL.createObjectURL( dataURItoBlob( img_b64 ) );

      $cameraPlayer.pause();

      stopStream();

      //show preview

      uploadPhoto();
    }

    $cameraRow.toggleClass( "d-flex" );
    $cameraRow.toggleClass( "d-none" );
    $photoCapture.toggleClass( "d-flex" );
    $photoCapture.toggleClass( "d-none" );

  }

  function dataURItoBlob( dataURI ) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;

    if ( dataURI.split( ',' )[ 0 ].indexOf( 'base64' ) >= 0 ){
      byteString = atob( dataURI.split( ',' )[ 1 ] );
    }else{
      byteString = unescape( dataURI.split( ',' )[ 1 ] );
    }

    // separate out the mime component
    var mimeString = dataURI.split( ',' )[ 0 ].split( ':' )[ 1 ].split( ';' )[ 0 ];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array( byteString.length );

    for ( var i = 0; i < byteString.length; i++ ) {
      ia[ i ] = byteString.charCodeAt( i );
    }

    return new Blob( [ ia ], {
      type: mimeString
    } );

  }

  function gotStream( stream ) {

    window.stream = stream; // make stream available to console
    $cameraRow.addClass( "d-flex" );
    videoElement.setAttribute( "playsinline", true );
    videoElement.srcObject = stream;

  }

  function toggleCameras() {

    var index = 0;

    for ( index = 0; index < devices.length; index++ ) {

      if ( devices[ index ].deviceId !== deviceId ) {

        if ( devices.length > 2 ) {
          $videoid.value = devices[ index ].deviceId;
        }

        deviceId = devices[ index ].deviceId;
        index = devices.length;

      }

    }

    console.log("camera id: ", deviceId);

    getStream();

  }

  function handleError( error ) {
    alert( "Error: ", error );
  }

  function camera( options ) {

    config = Object.assign( {}, defaults, options );

    $cameraRow = $( config.srcWrapper );

    return {
      display: init
    };

  }

  window.camera = camera;

} )();