( function () {
  "use strict";

  window.love2dev = window.love2dev || {};

  function isValidDate( d ) {
    return d instanceof Date && !isNaN( d );
  }

  function queryStringtoJSON() {
    var pairs = location.search.slice( 1 ).split( "&" );

    var result = {};
    pairs.forEach( function ( pair ) {
      pair = pair.split( "=" );
      result[ pair[ 0 ] ] = decodeURIComponent( pair[ 1 ] || "" );
    } );

    return result;
  }

  function jsonToQueryString( json ) {
    if ( !json ) {
      return "";
    }

    return (
      "?" +
      Object.keys( json )
      .map( function ( key ) {
        return encodeURIComponent( key ) + "=" + encodeURIComponent( json[ key ] );
      } )
      .join( "&" )
    );
  }

  var type = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    number: "0123456789",
    special: "~!@#$%^&()_+-={}[];',."
  };

  var KEYS = {
    0: 48,
    9: 57,
    NUMPAD_0: 96,
    NUMPAD_9: 105,
    DELETE: 46,
    BACKSPACE: 8,
    ARROW_LEFT: 37,
    ARROW_RIGHT: 39,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    HOME: 36,
    END: 35,
    TAB: 9,
    A: 65,
    X: 88,
    C: 67,
    V: 86,
    ENTER: 13,
    ESC: 27
  };

  /**
   * Get the key code from the given event.
   *
   * @param e
   * @returns {which|*|Object|which|which|string}
   */
  function keyCodeFromEvent( e ) {
    return e.which || e.keyCode;
  }

  /**
   * Get whether a command key (ctrl of mac cmd) is held down.
   *
   * @param e
   * @returns {boolean|metaKey|*|metaKey}
   */
  function keyIsCommandFromEvent( e ) {
    return e.ctrlKey || e.metaKey;
  }

  /**
   * Is the event a number key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsNumber( e ) {
    return keyIsTopNumber( e ) || keyIsKeypadNumber( e );
  }

  /**
   * Is the event a top keyboard number key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsTopNumber( e ) {
    var keyCode = keyCodeFromEvent( e );
    return keyCode >= KEYS[ "0" ] && keyCode <= KEYS[ "9" ];
  }

  /**
   * Is the event a keypad number key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsKeypadNumber( e ) {
    var keyCode = keyCodeFromEvent( e );
    return keyCode >= KEYS[ "NUMPAD_0" ] && keyCode <= KEYS[ "NUMPAD_9" ];
  }

  /**
   * Is the event a delete key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsDelete( e ) {
    return keyCodeFromEvent( e ) == KEYS[ "DELETE" ];
  }

  /**
   * Is the event a backspace key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsBackspace( e ) {
    return keyCodeFromEvent( e ) == KEYS[ "BACKSPACE" ];
  }

  /**
   * Is the event a deletion key (delete or backspace)
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsDeletion( e ) {
    return keyIsDelete( e ) || keyIsBackspace( e );
  }

  /**
   * Is the event an arrow key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsArrow( e ) {
    var keyCode = keyCodeFromEvent( e );
    return keyCode >= KEYS[ "ARROW_LEFT" ] && keyCode <= KEYS[ "ARROW_DOWN" ];
  }

  /**
   * Is the event a navigation key.
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsNavigation( e ) {
    var keyCode = keyCodeFromEvent( e );
    return keyCode == KEYS[ "HOME" ] || keyCode == KEYS[ "END" ];
  }

  /**
   * Is the event a keyboard command (copy, paste, cut, highlight all)
   *
   * @param e
   * @returns {boolean|metaKey|*|metaKey|boolean}
   */
  function keyIsKeyboardCommand( e ) {
    var keyCode = keyCodeFromEvent( e );

    return (
      keyIsCommandFromEvent( e ) &&
      ( keyCode == KEYS[ "A" ] ||
        keyCode == KEYS[ "X" ] ||
        keyCode == KEYS[ "C" ] ||
        keyCode == KEYS[ "V" ] )
    );
  }

  /**
   * Is the event the tab key?
   *
   * @param e
   * @returns {boolean}
   */
  function keyIsTab( e ) {
    return keyCodeFromEvent( e ) == KEYS[ "TAB" ];
  }

  function numbersOnlyString( string ) {
    var numbersOnlyString = "";
    for ( var i = 0; i < string.length; i++ ) {
      var currentChar = string.charAt( i );
      var isValid = !isNaN( parseInt( currentChar ) );
      if ( isValid ) {
        numbersOnlyString += currentChar;
      }
    }
    return numbersOnlyString;
  }

  /**
   * Get the caret start position of the given element.
   *
   * @param element
   * @returns {*}
   */
  function caretStartPosition( element ) {
    if ( typeof element.selectionStart == "number" ) {
      return element.selectionStart;
    }
    return false;
  }

  /**
   * Gte the caret end position of the given element.
   *
   * @param element
   * @returns {*}
   */
  function caretEndPosition( element ) {
    if ( typeof element.selectionEnd == "number" ) {
      return element.selectionEnd;
    }
    return false;
  }

  /**
   * Set the caret position of the given element.
   *
   * @param element
   * @param caretPos
   */
  function setCaretPosition( element, caretPos ) {
    if ( element != null ) {
      if ( element.createTextRange ) {
        var range = element.createTextRange();
        range.move( "character", caretPos );
        range.select();
      } else {
        if ( element.selectionStart ) {
          element.focus();
          element.setSelectionRange( caretPos, caretPos );
        } else {
          element.focus();
        }
      }
    }
  }

  /**
   * Normalise the caret position for the given mask.
   *
   * @param mask
   * @param caretPosition
   * @returns {number}
   */
  function normaliseCaretPosition( mask, caretPosition ) {
    var numberPos = 0;
    if ( caretPosition < 0 || caretPosition > mask.length ) {
      return 0;
    }
    for ( var i = 0; i < mask.length; i++ ) {
      if ( i == caretPosition ) {
        return numberPos;
      }
      if ( mask[ i ] == "X" ) {
        numberPos++;
      }
    }
    return numberPos;
  }

  type.all = type.lower + type.upper + type.number + type.special;

  /**
   *
   *
   * @param e
   * @param mask
   */
  function handleMaskedNumberInputKey( e, mask ) {
    filterNumberOnlyKey( e );

    var keyCode = e.which || e.keyCode;

    var element = e.target;

    var caretStart = caretStartPosition( element );
    var caretEnd = caretEndPosition( element );

    // Calculate normalised caret position
    var normalisedStartCaretPosition = normaliseCaretPosition( mask, caretStart );
    var normalisedEndCaretPosition = normaliseCaretPosition( mask, caretEnd );

    var newCaretPosition = caretStart;

    var isNumber = keyIsNumber( e );
    var isDelete = keyIsDelete( e );
    var isBackspace = keyIsBackspace( e );

    if ( isNumber || isDelete || isBackspace ) {
      e.preventDefault();
      var rawText = $( element ).val();
      var numbersOnly = numbersOnlyString( rawText );

      var digit = digitFromKeyCode( keyCode );

      var rangeHighlighted =
        normalisedEndCaretPosition > normalisedStartCaretPosition;

      // Remove values highlighted (if highlighted)
      if ( rangeHighlighted ) {
        numbersOnly =
          numbersOnly.slice( 0, normalisedStartCaretPosition ) +
          numbersOnly.slice( normalisedEndCaretPosition );
      }

      // Forward Action
      if ( caretStart != mask.length ) {
        // Insert number digit
        if ( isNumber && rawText.length <= mask.length ) {
          numbersOnly =
            numbersOnly.slice( 0, normalisedStartCaretPosition ) +
            digit +
            numbersOnly.slice( normalisedStartCaretPosition );
          newCaretPosition = Math.max(
            denormaliseCaretPosition( mask, normalisedStartCaretPosition + 1 ),
            denormaliseCaretPosition( mask, normalisedStartCaretPosition + 2 ) - 1
          );
        }

        // Delete
        if ( isDelete ) {
          numbersOnly =
            numbersOnly.slice( 0, normalisedStartCaretPosition ) +
            numbersOnly.slice( normalisedStartCaretPosition + 1 );
        }
      }

      // Backward Action
      if ( caretStart != 0 ) {
        // Backspace
        if ( isBackspace && !rangeHighlighted ) {
          numbersOnly =
            numbersOnly.slice( 0, normalisedStartCaretPosition - 1 ) +
            numbersOnly.slice( normalisedStartCaretPosition );
          newCaretPosition = denormaliseCaretPosition(
            mask,
            normalisedStartCaretPosition - 1
          );
        }
      }

      element.value = applyFormatMask( numbersOnly, mask );

      setCaretPosition( element, newCaretPosition );
    }
  }

  /**
   *
   *
   * @param keyCode
   * @returns {*}
   */
  function digitFromKeyCode( keyCode ) {
    if ( keyCode >= KEYS[ "0" ] && keyCode <= KEYS[ "9" ] ) {
      return keyCode - KEYS[ "0" ];
    }

    if ( keyCode >= KEYS[ "NUMPAD_0" ] && keyCode <= KEYS[ "NUMPAD_9" ] ) {
      return keyCode - KEYS[ "NUMPAD_0" ];
    }

    return null;
  }

  /**
   *
   *
   * @param e
   */
  function filterNumberOnlyKey( e ) {
    var isNumber = keyIsNumber( e );
    var isDeletion = keyIsDeletion( e );
    var isArrow = keyIsArrow( e );
    var isNavigation = keyIsNavigation( e );
    var isKeyboardCommand = keyIsKeyboardCommand( e );
    var isTab = keyIsTab( e );

    if (
      !isNumber &&
      !isDeletion &&
      !isArrow &&
      !isNavigation &&
      !isKeyboardCommand &&
      !isTab
    ) {
      e.preventDefault();
    }
  }

  function isNumber( value ) {
    return Number.isInteger( parseInt( value, 10 ) );
  }

  /**
   * Denormalise the caret position for the given mask.
   *
   * @param mask
   * @param caretPosition
   * @returns {*}
   */
  function denormaliseCaretPosition( mask, caretPosition ) {
    var numberPos = 0;
    if ( caretPosition < 0 || caretPosition > mask.length ) {
      return 0;
    }
    for ( var i = 0; i < mask.length; i++ ) {
      if ( numberPos == caretPosition ) {
        return i;
      }
      if ( mask[ i ] == "X" ) {
        numberPos++;
      }
    }
    return mask.length;
  }

  /**
   * Apply a format mask to the given string
   *
   * @param string
   * @param mask
   * @returns {string}
   */
  function applyFormatMask( string, mask ) {
    var formattedString = "";
    var numberPos = 0;
    for ( var j = 0; j < mask.length; j++ ) {
      var currentMaskChar = mask[ j ];
      if ( currentMaskChar == "X" ) {
        var digit = string.charAt( numberPos );
        if ( !digit ) {
          break;
        }
        formattedString += string.charAt( numberPos );
        numberPos++;
      } else {
        formattedString += currentMaskChar;
      }
    }
    return formattedString;
  }

  function zeroPad( num, places ) {
    var zero = places - num.toString().length + 1;
    return Array( +( zero > 0 && zero ) ).join( "0" ) + num;
  }

  function normalizeDate( value ) {
    var d;

    if ( value ) {
      d = new Date( value );
    } else {
      d = new Date();
    }

    value =
      d.getFullYear() +
      "-" +
      zeroPad( d.getMonth() + 1, 2 ) +
      "-" +
      zeroPad( d.getDate(), 2 );

    return value;
  }

  function getSrcMime( fileName ) {
    var ext = fileName.split( "." ).pop();

    switch ( ext ) {
      case "txt":
        return "text/plain";
      case "svg":
        return "image/svg+xml";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";

      case "webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  }

  function normalizeTarget( target ) {
    if ( typeof target === "string" ) {
      target = qsa( target );
    }

    if ( target.length === undefined ) {
      target = [ target ];
    }

    return target;
  }

  function verifySlug( slug ) {
    var slugEle = qs( SLUG );

    if ( initialSlug === slug ) {
      slugEle.classList.remove( BGWARN );

      return Promise.resolve( true );
    }

    return admin.pages.verifySlug( slug, domain ).then( function ( available ) {
      slugAvailable = available;

      if ( available ) {
        slugEle.classList.remove( BGWARN );
      } else {
        slugEle.classList.add( BGWARN );
      }
    } );
  }

  function makeSlug( src ) {
    if ( typeof src === "string" ) {
      return (
        src
        .toLowerCase()
        .replace( / +/g, "-" )
        .replace( /\'/g, "" )
        .replace( /&/g, "-and-" )
        //OK so I know this is goofy, but I need forward slashes
        //and well regex makes my brain hurt
        .replace( /\//g, "WHACK" )
        .replace( /[^\w-]+/g, "" )
        .replace( /WHACK/g, "/" )
        .replace( /-+/g, "-" )
        .replace( /^-+/, "" ) // Trim - from start of text
        .replace( /-+$/, "" )
      ); // Trim - from end of text;
    }

    return "";
  }

  function validateUrl( value ) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      value
    );
  }

  function fetchAndRenderTemplate( src, data ) {

    var root = siteConfig.base || "";

    if(root === "/"){
      root = "";
    }

    return fetchTemplate( {
      src: root + src
    } ).then( function ( template ) {
      return renderTemplate( template, data );
    } );
  }

  function renderTemplate( html, data ) {
    return Mustache.render( html, data );
  }

  function fetchTemplate( options ) {
    return fetch( options.src ).then( function ( response ) {
      return response.text();
    } );
  }

  function appendLeadingZeroes( n ) {
    if ( n <= 9 ) {
      return "0" + n;
    }
    return n;
  }

  //convert HTML to &lt; encoded string
  function htmlEncode( value ) {
    var $temp = document.createElement( "div" );

    $temp.innerText = value;

    return $temp.innerHTML.replace( /&/g, "%26" );
  }

  //convert &lt; encoded string to html string
  function htmlDecode( value ) {
    var $temp = document.createElement( "div" );

    $temp.innerHTML = value;

    return $temp.innerText;
  }

  /**
   * contains common methods used to manage UI
   * Assumes Mustache is global
   */
  love2dev.component = {
    
    htmlEncode: htmlEncode,
    htmlDecode: htmlDecode,

    setFocus: function ( target ) {
      var $target = document.querySelector( target );

      if ( $target ) {
        $target.focus();
      }
    },

    /**
     * Converts a string to its html characters completely.
     *
     * @param {String} str String with unescaped HTML characters
     **/
    encode: function ( str ) {
      var buf = [];

      for ( var i = str.length - 1; i >= 0; i-- ) {
        buf.unshift( [ "&#", str[ i ].charCodeAt(), ";" ].join( "" ) );
      }

      return buf.join( "" );
    },

    /**
     * Converts an html characterSet into its original character.
     *
     * @param {String} str htmlSet entities
     **/
    decode: function ( str ) {
      return str.replace( /&#(\d+);/g, function ( match, dec ) {
        return String.fromCharCode( dec );
      } );
    },

    parse: function ( src ) {
      if ( typeof src === "string" ) {
        return JSON.parse( src );
      }

      return src;
    },

    stringify: function ( src ) {
      if ( typeof src !== "string" ) {
        return JSON.stringify( src );
      }

      return src;
    },

    getDate: function ( value ) {
      var dt = new Date( value );

      if ( isValidDate( dt ) ) {
        return dt;
      } else {
        return new Date();
      }
    },

    createFragment: function ( htmlStr ) {
      var frag = document.createDocumentFragment(),
        temp = document.createElement( "div" );

      temp.innerHTML = htmlStr;

      while ( temp.firstChild ) {
        frag.appendChild( temp.firstChild );
      }

      return frag;
    },

    toggleDisabled: function ( target, state ) {
      var $target = this.qs( target );

      $target.disabled = state;
      $target.setAttribute( "aria-disabled", state );
      //       $target.setAttribute( "disabled", state );
    },

    generateUUID: function () { // Public Domain/MIT

        var d = new Date().getTime();

        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            .replace( /[xy]/g,
                function ( c ) {

                    var r = ( d + Math.random() * 16 ) % 16 | 0;

                    d = Math.floor( d / 16 );

                    return ( c === "x" ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );

                } );

    },

    fetchAndRenderTemplate: fetchAndRenderTemplate,
    fetchTemplate: fetchTemplate,
    renderTemplate: renderTemplate,

    makeSlug: makeSlug,
    validateUrl: validateUrl,
    verifySlug: verifySlug,

    isValidDate: isValidDate,
    normalizeDate: normalizeDate,
    keyIsTab: keyIsTab,
    keyIsKeyboardCommand: keyIsKeyboardCommand,
    keyIsNavigation: keyIsNavigation,
    keyIsArrow: keyIsArrow,
    keyIsDeletion: keyIsDeletion,
    keyIsBackspace: keyIsBackspace,
    keyIsDelete: keyIsDelete,
    keyIsKeypadNumber: keyIsKeypadNumber,
    keyIsTopNumber: keyIsTopNumber,
    keyIsNumber: keyIsNumber,
    keyIsCommandFromEvent: keyIsCommandFromEvent,
    keyCodeFromEvent: keyCodeFromEvent,
    numbersOnlyString: numbersOnlyString,
    applyFormatMask: applyFormatMask,
    filterNumberOnlyKey: filterNumberOnlyKey,
    caretStartPosition: caretStartPosition,
    caretEndPosition: caretEndPosition,
    setCaretPosition: setCaretPosition,
    normaliseCaretPosition: normaliseCaretPosition,
    denormaliseCaretPosition: denormaliseCaretPosition,
    digitFromKeyCode: digitFromKeyCode,
    isNumber: isNumber,
    KEYS: KEYS,
    zeroPad: zeroPad,
    pad: zeroPad,
    jsonToQueryString: jsonToQueryString,
    queryStringtoJSON: queryStringtoJSON,
    getSrcMime: getSrcMime,
    appendLeadingZeroes: appendLeadingZeroes
  };

  love2dev.cssClasses = {
    dNone: "d-none",
    dFlex: "d-flex",
    dBlock: "d-block",
    dSmNone: "d-sm-none",
    dSmFlex: "d-sm-flex",
    dSmBlock: "d-sm-block",
    hide: "hide",
    show: "show",
    hidden: "hidden",
    active: "active"
  };

  love2dev.events = {
    click: "click",
    dblclick: "dblclick",
    keyup: "keyup",
    input: "input",
    keydown: "keydown",
    change: "change",
    select: "select",
    focus: "focus",
    blur: "blur",
    submit: "submit",
    mousedown: "mousedown",
    inputValidate: "keyup blur"
  };

} )();