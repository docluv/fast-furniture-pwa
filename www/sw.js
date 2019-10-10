importScripts( "/js/libs/idb.js", "sw/response-mgr.js",
  "sw/push-mgr.js",
  "sw/invalidation-mgr.js", "sw/date-mgr.js" );

var version = "v4.05",
  precache_urls = [
    "css/bootstrap.min.css",
    "css/site.css",
    "js/libs/jquery.small.js",
    "js/libs/bootstrap.min.js",
    "js/app/app.js",
    "js/app/app.bootstrap.js",
    "/",
    "/404/",
    "/categories/",
    "/contact/",
    "/fallback/",
    "/settings/",
    "/product-template.html",
    "api/products/35.json"
  ],
  precache_no_dependency_urls = [
    "categories/",
    "category/",
    "cart/",
    "js/app/categories.js",
    "js/app/cart.js",
    "js/app/category.js",
    "js/app/product.js",
    "js/app/settings.js",
    //    "images/offline-product.jpg",
    "images/originals/Addison-Traditional-Style-Dining-Room-Furniture.jpg"
  ],
  preCacheName = "precache-" + version,
  preCacheNoDependencyName = "precache-no-dependency-" + version,
  dynamicCacheName = "dynamic-cache-" + version,
  productsCacheName = "products-cache-" + version,
  productImagesCacheName = "product-image-cache-" + version,
  categoryCacheName = "category-cache-" + version,
  responseManager = new ResponseManager( [ {
      "route": "/product/.+/",
      "cache": productsCacheName
    },
    {
      "route": "/images/originals/.+/|/images/display/.+/|/images/mobile/.+/|/images/thumbnail/.+/",
      "cache": productImagesCacheName
    }
  ] ),
  pushManager = new PushManager(),
  invalidationManager = new InvalidationManager(),
  routeRules = [ {
    "route": /category\/\?/,
    "strategy": "fetchAndRenderResponseCache",
    "options": {
      pageURL: "templates/category-page.html",
      template: "templates/category.html",
      api: function ( request ) {
        return ffAPI.getEvent( getParameterByName( "id", request.url ) );
      },
      cacheName: categoryCacheName
    },
    "cacheName": categoryCacheName
  } ];

/*



  */



self.addEventListener( "install", event => {

  self.skipWaiting();

  event.waitUntil(
    //pre-cache
    //on install as a dependency
    caches.open( preCacheName ).then( cache => {
      //won't delay install completing and won't cause installation to
      //fail if caching fails.
      //the difference is as dependency returns a Promise, the
      //no dependency does not.
      //on install not as dependency (lazy-load)
      console.log( "caches add as no-dependency" );

      cache.addAll( precache_no_dependency_urls );

      console.log( "caches add as dependency" );

      return cache.addAll( precache_urls );

    } )

  );

} );

/* Clean up legacy named caches */

self.addEventListener( "activate", event => {

  event.waitUntil(

    caches.keys().then( cacheNames => {
      cacheNames.forEach( value => {

        if ( value.indexOf( version ) < 0 ) {
          caches.delete( value );
        }

      } );

      console.log( "service worker activated" );

      return;

    } )

  );

} );

function getCacheName( url ) {

  var cacheName = dynamicCacheName;

  if ( /\/product\//.test( url ) ) {

    cacheName = productsCacheName;

  } else if ( /\/images\/originals\/|\/images\/display\/|\/images\/mobile\/|\/images\/thumbnail\//.test( url ) ) {

    cacheName = productImagesCacheName;

  }

  return cacheName;

}

self.addEventListener( "fetch", event => {

  event.respondWith(

    handleResponse( event )

  );

} );

function handleResponse( event ) {

  if ( event.request.method === 'GET' ) {

    let cacheName = getCacheName( event.request.url );

    let rule = testRequestRule( event.request.url, routeRules );

    rule = rule || {};

    switch ( rule.strategy ) {

      case "cacheFallingBackToNetwork":

        return responseManager.cacheFallingBackToNetworkCache( event.request, cacheName );

      case "fetchAndRenderResponseCache":

        return responseManager.fetchAndRenderResponseCache( {
            request: event.request,
            pageURL: rule.options.pageURL,
            template: rule.options.template,
            api: rule.options.api,
            cacheName: cacheName
          } )
          .then( response => {

            invalidationManager.cacheCleanUp();

            return response;

          } );

      case "cacheOnly":

        return responseManager.cacheOnly( event.request, cacheName )
          .then( response => {

            invalidationManager.cacheCleanUp( cacheName );

            return response;

          } );

      case "networkOnly":

        return responseManager.networkOnly( event.request );

      case "cacheFallingBackToNetworkCache":
      default:

        return responseManager.cacheFallingBackToNetworkCache( event.request, cacheName )
          .then( response => {

            invalidationManager.cacheCleanUp( cacheName );

            return response;

          } );

    }

  }

}


// Promise.race is no good to us because it rejects if
// a promise rejects before fulfilling. Let's make a proper
// race function:
function promiseAny( promises ) {
  return new Promise( ( resolve, reject ) => {
    // make sure promises are all promises
    promises = promises.map( p => Promise.resolve( p ) ); // resolve this promise as soon as one resolves
    promises.forEach( p => p.then( resolve ) ); // reject if all promises reject
    promises
      .reduce( ( a, b ) => a.catch( () => b ) )
      .catch( () => reject( Error( "All failed" ) ) );
  } );
}

//Push Stuff
self.addEventListener( "pushsubscriptionchange", event => {

  console.log( "subscription change ", event );

} );


function testRequestRule( url, rules ) {

  for ( let i = 0; i < rules.length - 1; i++ ) {

    if ( rules[ i ].route.test( url ) ) {
      return rules[ i ];
    }

  }

}


function getParameterByName( name, url ) {

  name = name.replace( /[\[\]]/g, "\\$&" );

  var regex = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
    results = regex.exec( url );

  if ( !results ) {
    return null;
  }

  if ( !results[ 2 ] ) {
    return '';
  }

  return decodeURIComponent( results[ 2 ].replace( /\+/g, " " ) );
}

function getCategoryTemplate() {

  return fetch( "templates/category.html" )
    .then( response => {

      if ( response.ok ) {

        return response.text()
          .then( html => {

            return html;

          } );
      }

    } );

}

function getCategory( id ) {

  return fetch( apiHost + "category/" + id )
    .then( function ( response ) {

      if ( response.ok ) {

        return response.json();

      } else {

        throw "event " + id + " fetch failed";
      }

    } );

}

function renderCategory( event ) {

  let id = getParameterByName( event.request.url, "id" ),
    appShell = "",
    eventTemplate = "";

  return getAppShell()
    .then( html => {

      appShell = html;

    } )
    .then( () => {

      return getCategoryTemplate()
        .then( html => {

          eventTemplate = html;

        } );

    } ).then( () => {

      let eventShell = appShell.replace( "<%template%>", eventTemplate );

      return getCategory( id )
        .then( ( eventObj ) => {

          let sessionPage = Mustache.render( eventShell, session );

          //make custom response
          let response = new Response( sessionPage, {
              headers: {
                'content-type': 'text/html'
              }
            } ),
            copy = response.clone();

          caches.open( dynamicCache )
            .then( cache => {
              cache.put( event.request, copy );
            } );

          return response;

        } );

    } );

}