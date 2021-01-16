( function () {
  "use strict";

  var profile;

  var $profileNavBtn = $( ".btn-user-profile" ),
    $logoutNavBtn = $( ".btn-mobile-logout" ),
    $loginNavBtn = $( ".btn-mobile-login" ),
    $signupNavBtn = $( ".mobile-signup-btn" ),
    $logoutBtn = $( ".btn-user-logout" ),
    $btnLogin = $( ".btn-user-login" ),
    $btnSettings = $( ".btn-settings" );

  function initialize() {

    love2dev.auth.addNoAuthCallback( notAuthorizedHandler );
    love2dev.auth.addAuthCallback( authorizedHandler );

 }

  function toggleNoneFlex( $ele, state ) {

    if ( $ele ) {
      
      if ( state ) {
        $ele.removeClass( love2dev.cssClasses.dNone );
        $ele.addClass( love2dev.cssClasses.dFlex );
      } else {
        $ele.addClass( love2dev.cssClasses.dNone );
        $ele.removeClass( love2dev.cssClasses.dFlex );
      }

    }

  }

  function notAuthorizedHandler() {
    toggleNoneFlex( $btnLogin, true );
    toggleNoneFlex( $loginNavBtn, true );
    toggleNoneFlex( $signupNavBtn, true );
    toggleNoneFlex( $logoutNavBtn, false );
  }

  function authorizedHandler() {

    return fetchUser()
      .then( parseUserGroups )
      .then( function () {
        toggleNoneFlex( $profileNavBtn, true );
        toggleNoneFlex( $logoutNavBtn, true );
        toggleNoneFlex( $btnLogin, false );
        toggleNoneFlex( $logoutBtn, true );
        toggleNoneFlex( $btnSettings, true );
        toggleNoneFlex( $loginNavBtn, false );

        renderProfile();
        bindEvents();
      } );

  }

  function setProfileLinks( target ) {

    var $profileLinks = $( ".profile-link" );

    for ( let index = 0; index < $profileLinks.length; index++ ) {
      $profileLinks[ index ].href = target;
    }

  }

  function parseUserGroups() {

    return love2dev.auth.getCognitoGroups().then( function ( groups ) {

      if ( groups && groups.length ) {
        setProfileLinks( "profile/" );
      }

    } );

  }

  function fetchUser() {

    return love2dev.user.getProfile()
      .then( function ( user )
      {
        
        if ( user )
        {

          profile = user;

          console.log( "profile-nav user fetch" );

          callbacks.fireCallback( "hasProfile", profile );
          
        }
        
      } )
      .catch( function ( err ) {
        console.error( err );
      } );
  }

  function renderProfile() {

    var $userName = $( ".user-name" );

    if ( $userName && $userName.length > 0 ) {
      $userName[ 0 ].innerText = profile.first_name + " " + profile.last_name;
    }

    if(profile.PatientPhoto ){
      
      var $imageAvatar = $(".profile-avatar"),
          $iconAvatar = $(".icon-avatar");

      if ( $imageAvatar && $imageAvatar.length > 0 )
      {
        
        for (var index = 0; index < $imageAvatar.length; index++) {

          $imageAvatar[ index ].src = "data:" + profile.PatientPhoto.DocumentType + ";base64," + profile.PatientPhoto.thumb;
          $imageAvatar[ index ].alt = profile.first_name + " " + profile.last_name;
          
        }

        $iconAvatar.addClass( love2dev.cssClasses.dNone );
        $imageAvatar.removeClass( love2dev.cssClasses.dNone );

      }

    }

  }

  function bindEvents() {

    $logoutBtn.on( love2dev.events.click, signOut );

    $( ".profile-wrapper .dropdown-toggle" ).on(
      love2dev.events.click,
      toggleProfileMenu
    );

  }

  function toggleProfileMenu( e ) {

    e.preventDefault();

    $( ".profile-wrapper .dropdown-menu" ).toggleClass( love2dev.cssClasses.show );

    return false;
  }

  function signOut( e ) {

    e.preventDefault();

    love2dev.auth.signOutRedirect();

    return false;
  }

  function addProfileCallback( func ) {

    if ( profile && func ) {
      func(profile);
      return;
    }

    callbacks.addCallback( "hasProfile", "profile", func, profile );
  }

  love2dev.app.addProfileCallback = addProfileCallback;

  initialize();

} )();