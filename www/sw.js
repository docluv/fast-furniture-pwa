const siteConfig = {
  "apiBase": "https://fastfurniture.love2dev.com/api/",
  "ClientId": "15elav51g5mlu99vl76ui8i6pb",
  "region": "us-east-1",
  "base": "/"
};

importScripts(
  "sw/push-mgr.js",
  "js/libs/localforage.min.js",
  "js/libs/localforage.min.js",
  "js/libs/callbacks.js",
  "js/libs/mustache.min.js",
  "js/app/services/offline.js",
  "js/app/services/http.js",
  "js/app/services/auth.js",
  "js/app/services/offline.js",
  "js/app/services/cart.js"
);

const version = "v5.00",
  noCacheList = ["cognito-idp"],
  cacheList = [
    "css/bootstrap.min.css",
    "css/site.css",
    "css/login.css",
    "css/all.min.css",
    "css/addtohomescreen.css",
    "js/app/libs/push-manager.js",
    "js/libs/dollar-bill.js",
    "js/libs/lazy.images.js",
    "js/libs/callbacks.js",
    "js/app/services/offline.js",
    "js/app/services/http.js",
    "js/app/services/auth.js",
    "js/app/app.js",
    "js/app/controllers/cart.js",
    "js/app/settings.js",
    "js/libs/addtohomescreen.js",
    "js/libs/localforage.min.js",
    "js/libs/mustache.min.js",
    "js/app/ui/component.base.js",
    "js/app/ui/modal.js",
    "js/app/ui/prompt.js",
    "/",
    "404/",
    "contact/",
    "fallback/",
    "settings/",
    "categories/",
    "cart/",
    "images/offline-product.jpg",
    "html/app/shell.html",
    "html/templates/cart.html",
    "html/templates/product.template.html",
    "html/templates/category.template.html"
  ],
  preCacheName = "precache-" + version,
  dynamicCacheName = "dynamic-cache-" + version,
  productsCacheName = "products-cache-" + version,
  productImagesCacheName = "product-image-cache-" + version,
  categoryCacheName = "category-cache-" + version,
  pushManager = new PushManager(),
  routeRules = [{
    "route": /category\/\?/,
    "strategy": "fetchAndRenderResponseCache",
    "options": {
      pageURL: "templates/category-page.html",
      template: "templates/category.html",
      api: function (request) {
        return ffAPI.getEvent(getParameterByName("id", request.url));
      },
      cacheName: categoryCacheName
    },
    "cacheName": categoryCacheName
  }],
  STALE_KEY = "-expires",
  CATEGORIES_KEY = "categories-key",
  PRODUCTS_KEY = "products-key",
  MAX_LIST_CACHE = 60,
  Content_Type = "Content-Type",
  mime_types_helpers = {
    "application/json": "json",
    //  "multipart/form-data": "blob",
    "image/jpg": "blob",
    "image/png": "blob",
    "image/gif": "blob",
    "application/octet-stream": "blob"
  },
  image_mime_types = ["image/jpg",
    "image/png",
    "image/gif"
  ],
  MEDIA_STORAGE = "media-storage-",
  INVALIDATE_PRECACHE = "invalidate-cache",
  UPDATE_DATA = "update-data",
  UPDATE_CACHE = "update-cache",
  OFFLINE_QUEUE_KEY = "offline-queue",
  OFFLINE_MSG_KEY = "offline-message",
  DYNAMIC_CACHE = "dynamic-cache";


let onlineState = {
    online: true,
    serverState: true,
    available: true
  },
  sync_queue,
  profile;

self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(

    cacheList.forEach(url => {

      cacheOrUpdate(url, preCacheName);

    })

  );

});

/* Clean up legacy named caches */

self.addEventListener("activate", event => {

  if (self.clients && clients.claim) {
    clients.claim();
  }

  event.waitUntil(

    getTemplates()
    .then(() => {

      return updateCachedData();

    })
    .then(() => {

      return renderSite();

    })

  );

});

function getCacheName(url) {

  var cacheName = dynamicCacheName;

  if (/\/product\//.test(url)) {

    cacheName = productsCacheName;

  } else if (/\/images\/originals\/|\/images\/display\/|\/images\/mobile\/|\/images\/thumbnail\//.test(url)) {

    cacheName = productImagesCacheName;

  }

  return cacheName;

}

self.addEventListener("fetch", function (e) {

  e.respondWith(

    handleFetch(e.request)

  );

});

self.addEventListener('message', handleMessage);


//Push Stuff
self.addEventListener("pushsubscriptionchange", event => {

  console.log("subscription change ", event);

});


function handleFetch(request) {

  if (request.method.toUpperCase() === "GET") {
    /* check the cache first, then hit the network */

    return caches.match(request, {
        ignoreSearch: true
      })
      .then(function (response) {

        return response || fetchRequest(request);

      });

  } else {
    return fetchRequest(request);
  }

}

function fetchRequest(request) {

  let hasTimedOut = false;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {

    hasTimedOut = true;
    controller.abort();

  }, 30000);

  controller.signal.addEventListener('abort', () => {
    console.log(`Abort event fired on signal. Aborting execution on timer ${timeoutId}.`);
    clearTimeout(timeoutId);
    hasTimedOut = true;
  });

  return fetch(request.clone(), {
      signal: controller.signal
    })
    .then(response => {

      clearTimeout(timeoutId);

      if (response && [0, 200].includes(response.status)) {

        if (!onlineState.available) {
          //trigger cached queue to process

          onlineState = {
            online: true,
            serverState: true,
            available: true
          };

          postMessage({
            "onlineState": true,
            "state": onlineState
          });

          self.onlineStatus.saveOnlineState({
            "onlineState": true,
            "state": onlineState
          });

          processOfflineQueue();

        }

      }

      return checkCanCache(request, response.clone())
        .then(() => {

          return response;

        });

    })
    .catch(err => {

      console.info(request.url);
      console.info(err);

      console.log("hasTimedOut: ", hasTimedOut);

      if (onlineState.available) {

        onlineState = {
          online: false,
          serverState: false,
          available: false
        };

        postMessage({
          "onlineState": false,
          "state": onlineState
        });

        self.onlineStatus.saveOnlineState({
          "onlineState": false,
          "state": onlineState
        });

      }

      if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {

        //cache request for later

        return saveRequestToOfflineQueue(request);

      } else if (request.method === "GET") {
        //TODO: only return HTML for doc request 

        if (!isNotDoc(request.url)) {

          return caches.match("/offline");
          // .then( function ( response ) {

          //   if (response){

          //   return response.text()
          //     .then( html => {

          //       return new Response( html, {
          //         status: 200,
          //         statusText: 'Service Unavailable',
          //         headers: new Headers( {
          //           'Content-Type': 'text/html'
          //         } )
          //       } );
          //     } );

          //   }

          // } );

        } else {

          return new Response("");

        }

      }

    });

}

function isCacheWhiteList(url) {

  let whitelist = true;

  noCacheList.forEach(noCachePattern => {

    if (url.includes(noCachePattern)) {
      whitelist = false;
    }

  });

  return whitelist;

}

function checkCanCache(request, response) {

  let requestURL = new URL(request.url);

  if (requestURL.origin === location.origin &&
    request.method.toLowerCase() === "get" &&
    !request.url.includes("api") &&
    isCacheWhiteList(request.url)) {

    return cacheResponse(request.url, response);

  }

  return Promise.resolve(response);

}

function cacheResponse(url, response) {

  return caches.open("dynamic").then(cache => {

    return cache.put(url, response)
      .catch(err => {
        console.log("dynamic Error: ", url);
        console.error(err);
      });

  })

}

function cacheOrUpdate(url, cacheName){

  const now = Date.now();
  //only cache photo if it is not already cached
  return caches.match(url)
    .then(response => {

      if (!response) {

        return caches.open(cacheName)
          .then(cache => {
            return cache.add(url);
          })
          .catch(err => {
            console.info("failed to cache ", url);
          });

      } else {

        let date = response.headers.get("Date") || response.headers.get("date"),
          ttl = response.headers.get("cache-control") || 
                response.headers.get("Cache-Control");

        if (date && ttl) {

          ttl = ttl.replace("max-age=", "");

          let dt = new Date(date).getTime();

          if (now >= dt + (ttl * 1000)) {

            return caches.open(cacheName)
              .then(cache => {
                return cache.add(url);
              })
              .catch(err => {
                console.info("failed to update ", url);
              });

          }

        }

      }

    });

}

function isNotDoc(url) {
  return /(.css|.js|.jpg|.jpeg|.gif|.png|.webp|.woff|.woff2|.svg)$/.test(url);
}

function requestHelper(ContentType) {

  let helper = "text";

  for (const key in mime_types_helpers) {

    if (ContentType.includes(key)) {
      helper = mime_types_helpers[key];
    }

  }

  return helper;

}

/**
 * Serializes a Request into a plain JS object.
 * 
 * @param request
 * @returns Promise
 */
function serializeRequest(request) {

  let serialized = {
    url: request.url,
    headers: serializeHeaders(request.headers),
    method: request.method,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  };

  if (['PUSH', 'POST', 'DELETE'].includes(request.method.toUpperCase())) {

    let helper = requestHelper(request.headers.get(Content_Type));

    if (helper) {

      return request.clone()[helper]().then(function (body) {

        serialized.body = body;

        return serialized;

      });

    }

    return Promise.resolve(serialized);

  }

  return Promise.resolve(serialized);

}

/**
 * Serializes a Request into a plain JS object.
 * 
 * @param request
 * @returns Promise
 */
function deserializeRequest(srcRequest) {

  let request = new Request(srcRequest.url, {
    headers: srcRequest.headers,
    method: srcRequest.method,
    mode: srcRequest.mode,
    credentials: srcRequest.credentials,
    cache: srcRequest.cache,
    redirect: srcRequest.redirect,
    referrer: srcRequest.referrer
  });

  if (srcRequest.body) {

    for (const key in mime_types_helpers) {

      if (mime_types_helpers.hasOwnProperty(key)) {

        if (srcRequest.headers['content-type'].includes(key)) {

          if (key === "application/json") {
            request.body = JSON.stringify(srcRequest.body);
          } else if (mime_types_helpers[key] === "blob") {

            request.body = new Blob(srcRequest.body);

          }

        }

        if (srcRequest.headers['content-type'].includes()) {
          request.body = JSON.stringify(srcRequest.body);
        } else {

          request.body = srcRequest.body;
        }

      }

    }

  }

  if (request.headers.Authorization) {

    return love2dev.auth.getIdToken()
      .then(token => {

        if (token) {

          request.headers.Authorization = "Bearer " + token;

          return request;

        } else {
          return null;
        }

      });

  }

  return Promise.resolve(request);

}


/**
 * Serializes headers into a plain JS object
 * 
 * @param headers
 * @returns object
 */
function serializeHeaders(headers) {

  let serialized = {};
  // `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
  // notation as well and this is the only way of retrieving all the headers.
  for (let entry of headers.entries()) {
    serialized[entry[0]] = entry[1];
  }

  return serialized;

}

function setTTL(options) {

  let ttlDt = new Date(),
    _url = new URL(options._url);

  _url = _url.href.replace(_url.orgin, "");

  ttlDt.setSeconds(ttlDt.getSeconds() + (options.ttl / 1000));

  return localforage.setItem(options.key + _url, ttlDt);
}


function postMessage(msg) {

  self.clients.matchAll().then(all => all.map(client => client.postMessage(msg)));

}


function getCategoryTemplate() {

  return fetch("templates/category.html")
    .then(response => {

      if (response.ok) {

        return response.text()
          .then(html => {

            return html;

          });
      }

    });

}

function getCategory(id) {

  return fetch(apiHost + "category/" + id)
    .then(function (response) {

      if (response.ok) {

        return response.json();

      } else {

        throw "event " + id + " fetch failed";
      }

    });

}

function renderCategory(event) {

  let id = getParameterByName(event.request.url, "id"),
    appShell = "",
    eventTemplate = "";

  return getAppShell()
    .then(html => {

      appShell = html;

    })
    .then(() => {

      return getCategoryTemplate()
        .then(html => {

          eventTemplate = html;

        });

    }).then(() => {

      let eventShell = appShell.replace("<%template%>", eventTemplate);

      return getCategory(id)
        .then((eventObj) => {

          let sessionPage = Mustache.render(eventShell, session);

          //make custom response
          let response = new Response(sessionPage, {
              headers: {
                'content-type': 'text/html'
              }
            }),
            copy = response.clone();

          caches.open(dynamicCache)
            .then(cache => {
              cache.put(event.request, copy);
            });

          return response;

        });

    });

}

function renderSite() {

  let categories = [],
    products = [];

  return localforage.getItem(CATEGORIES_KEY)
    .then(results => {

      categories = results;

      return localforage.getItem(PRODUCTS_KEY);
    })
    .then(res => {

      products = res;

      let pages = [];

      categories.forEach(category => {

        for (let index = 0; index < category.Products.length; index++) {

          category.Products[index].slug = makeSlug(category.Products[index].Name);
          category.Products[index].photo = category.Products[index].slug + ".jpg";

          let slug = "images/display/" + category.Products[index].photo;

          cacheOrUpdate(slug, "fast-furniture-pages");

        }

        pages.push(renderPage("category/" + category.Slug + "/", "category", category));


      });


      //limit to 100 for now.
      //found caching all 5500 slowed the site down...time to investigate
      for (let index = 0; index < 100; index++) {
        
        let product = products[index];

        product.slug = makeSlug(product.Name);
        product.photo = product.slug + ".jpg";

        pages.push(renderPage("product/" + product.slug + "/", "product", product));

      }

      return Promise.all(pages);

    })
    .then(results => {

      console.log("site updated");

    })
    .catch(err => {

      console.error(err);

    });

}

let templates = {};

function getTemplates() {

  return getHTMLAsset("html/templates/category.template.html")
    .then(html => {
      templates.category = html;
    })
    .then(() => {

      return getHTMLAsset("html/app/shell.html")
        .then(html => {

          html = html || "";

          templates.shell = html.replace("{{{body}}}", "<%template%>");
        });

    })
    .then(() => {

      return getHTMLAsset("html/templates/product.template.html")
        .then(html => {
          templates.product = html;
        });

    });

}

function makeSlug(src) {

  if (typeof src === "string") {

    return src.replace(/ +/g, "-")
      .replace(/\'/g, "")
      .replace(/[^\w-]+/g, "")
      .replace(/-+/g, "-")
      .toLowerCase();

  }

  return "";

}

function renderPage(slug, templateName, data) {

  let pageTemplate = templates[templateName];

  let template = templates.shell.replace("<%template%>", pageTemplate);

  pageHTML = Mustache.render(template, data);

  let response = new Response(pageHTML, {
    headers: {
      "content-type": "text/html",
      "date": new Date().toLocaleString()
    }
  });

  return caches.open("fast-furniture-pages")
    .then(cache => {
      cache.put(slug, response);
    });

}

function updateCachedData() {

  return fetch("api/home-categories.json")
    .then(response => {

      if (response && response.ok) {

        return response.json();

      } else {
        throw {
          status: response.status,
          message: "failed to fetch category data"
        };
      }

    })
    .then(categories => {

      return localforage.setItem(CATEGORIES_KEY, categories);

    })
    .then(() => {

      var dt = new Date();

      dt.setMinutes(dt.getMinutes() + MAX_LIST_CACHE);

      return localforage.setItem(CATEGORIES_KEY + STALE_KEY, dt);

    })
    .then(() => {

      return fetch("api/products.json");
    })
    .then(response => {

      if (response && response.ok) {

        return response.json();

      } else {
        throw {
          status: response.status,
          message: "failed to fetch products data"
        };
      }

    })
    .then(products => {

      return localforage.setItem(PRODUCTS_KEY, products);

    })
    .then(() => {

      var dt = new Date();

      dt.setMinutes(dt.getMinutes() + MAX_LIST_CACHE);

      return localforage.setItem(PRODUCTS_KEY + STALE_KEY, dt);

    });

}

function getHTMLAsset(slug) {

  return caches.match(slug)
    .then(response => {

      if (response) {

        return response.text();

      }

    });

}


/* Message Handler */
function handleMessage(event) {

  console.log("service worker received: ");
  console.log(event.data);
  console.log("----------------------------");

  if (typeof event.data === "object") {

    data = event.data;


  }

}

//offline cache handlers
/* Cache/Queue Mgt */

if (SyncManager && registration) {

  registration.sync.register('bkg-data-sync');

}

// only triggers in supporting browsers, ie not Safari or FireFox
self.addEventListener('sync', event => {

  if (event.tag == 'bkg-data-sync') {

    event.waitUntil(

      processOfflineQueue()
      //then
      //update cached data
      // or do both at the same time promise.all

    );

  }

});


function cacheRequestInQueue(request) {

  return localforage.getItem(OFFLINE_QUEUE_KEY)
    .then(queue => {

      queue = queue || [];

      //easy way to cache asset
      queue.push(request);

      return localforage.setItem(OFFLINE_QUEUE_KEY, queue);

    })
    .then(() => {

      //send a placeholder response
      //should be JSON since we were posting to the API and expecting JSON in response
      return new Response(JSON.stringify({
        state: "offline",
        message: "request was cached in the offline queue and will sync as soon as possible"
      }))

    });

}

function manageAuthorizationHeader(src) {

  if (src.headers["Authorization"]) {

    return love2dev.auth.getIdToken()
      .then(function (token) {

        if (token) {
          //user/
          return {
            //"Groups": groups,
            "Authorization": "Bearer " + token
          };

        } else {
          return {};
        }

      });

  } else {

    return Promise.resolve({});

  }

}

function processOfflineQueue() {

  console.info("handling offline queue");

  return localforage.getItem(OFFLINE_QUEUE_KEY)
    .then(queue => {

      if (queue) {

        let actions = [];

        queue.forEach(srcRequest => {

          actions.push(deserializeRequest(srcRequest)
            .then(deserialized => {

              //need the latest authentication token
              return manageAuthorizationHeader(deserialized)
                .then(authHeader => {

                  deserialized.headers = Object.assign({}, deserialized.headers, authHeader);

                  let request = new Request(srcRequest.url, deserialized);

                  //try to sync. If this request fails the request will be added back to the queue
                  return fetchRequest(request);

                });

            }));

        });

        return localforage.removeItem(OFFLINE_QUEUE_KEY)
          .then(() => {
            return Promise.all(actions);
          });

      }

    });

}

function saveRequestToOfflineQueue(request) {

  return serializeRequest(request)
    .then(serialized => {

      return cacheRequestInQueue(serialized);

    });

}

function timeTrigger(last_check, delta) {

  let dt = Date.now();

  return (last_check + delta) < dt;

}

function initMannualPeriodicCheck() {

  let periodicCheck_key = "last-periodic-check";

  //default to 1 hour, we can adjust as needed 🕰⌚
  let peridicCheck_Delta = 1000 * 60 * 60; // 1 hour

  return localforage.getItem(periodicCheck_key)
    .then(last_check => {

      if (timeTrigger(last_check, peridicCheck_Delta)) {

        return processOfflineQueue();

      }

    })
    .then(() => {

      return processOfflineQueue();

    });

}

//this should trigger when the service worker executes
//this will run in the background, so no blocking the UI

if ('periodicSync' in registration) {

  registration.periodicSync.register('flush-queue', {
      minInterval: 24 * 60 * 60 * 1000,
    })
    .then(function () {

      self.addEventListener('periodicsync', event => {

        if (event.tag === 'flush-queue') {

          event.waitUntil(processOfflineQueue());

        }

      });

      processOfflineQueue();

    })
    .catch(error => {

      //fallback as periodic sync only works for installed PWAs 
      //and you don't know until you try to register
      initMannualPeriodicCheck();

    });

} else {

  //FireFox and Safari
  initMannualPeriodicCheck();

}