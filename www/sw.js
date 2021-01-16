const siteConfig = {
  "apiBase": "https://fastfurniture.love2dev.com/api/",
  "ClientId": "15elav51g5mlu99vl76ui8i6pb",
  "region": "us-east-1",
  "base": "/"
};

importScripts(
  siteConfig.base + "js/libs/localforage.min.js",
  siteConfig.base + "js/libs/callbacks.js",
  siteConfig.base + "js/libs/mustache.min.js",
  siteConfig.base + "js/app/services/offline.js",
  siteConfig.base + "js/app/services/http.js",
  siteConfig.base + "js/app/services/auth.js",
  siteConfig.base + "js/app/services/offline.js",
  siteConfig.base + "js/app/services/cart.js"
);

const version = "v5.00",
  cacheList = [
    "css/bootstrap.min.css",
    "css/site.css",
    "css/login.css",
    "css/all.css",
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
  responseManager = new ResponseManager([{
      "route": "/product/.+/",
      "cache": productsCacheName
    },
    {
      "route": "/images/originals/.+/|/images/display/.+/|/images/mobile/.+/|/images/thumbnail/.+/",
      "cache": productImagesCacheName
    }
  ]),
  pushManager = new PushManager(),
  invalidationManager = new InvalidationManager(),
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
  MAX_LIST_CACHE = 60;


self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(

    caches.open(preCacheName).then(cache => {

      cacheList.forEach(url => {

        cache.add(url)
          .catch(err => {
            console.log("precache Error: ", url);
            console.error(err);
          });

      });

    })

  );

});

/* Clean up legacy named caches */

self.addEventListener("activate", event => {

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

self.addEventListener("fetch", event => {

  event.respondWith(

    handleResponse(event)

  );

});

self.addEventListener('message', handleMessage);


function handleResponse(event) {

  if (event.request.method === 'GET') {

    let cacheName = getCacheName(event.request.url);

    let rule = testRequestRule(event.request.url, routeRules);

    rule = rule || {};

    switch (rule.strategy) {

      case "cacheFallingBackToNetwork":

        return responseManager.cacheFallingBackToNetworkCache(event.request, cacheName);

      case "fetchAndRenderResponseCache":

        return responseManager.fetchAndRenderResponseCache({
            request: event.request,
            pageURL: rule.options.pageURL,
            template: rule.options.template,
            api: rule.options.api,
            cacheName: cacheName
          })
          .then(response => {

            invalidationManager.cacheCleanUp();

            return response;

          });

      case "cacheOnly":

        return responseManager.cacheOnly(event.request, cacheName)
          .then(response => {

            invalidationManager.cacheCleanUp(cacheName);

            return response;

          });

      case "networkOnly":

        return responseManager.networkOnly(event.request);

      case "cacheFallingBackToNetworkCache":
      default:

        return responseManager.cacheFallingBackToNetworkCache(event.request, cacheName)
          .then(response => {

            invalidationManager.cacheCleanUp(cacheName);

            return response;

          });

    }

  } else {
    return fetch(event.request);
  }

}


// Promise.race is no good to us because it rejects if
// a promise rejects before fulfilling. Let's make a proper
// race function:
function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    // make sure promises are all promises
    promises = promises.map(p => Promise.resolve(p)); // resolve this promise as soon as one resolves
    promises.forEach(p => p.then(resolve)); // reject if all promises reject
    promises
      .reduce((a, b) => a.catch(() => b))
      .catch(() => reject(Error("All failed")));
  });
}

//Push Stuff
self.addEventListener("pushsubscriptionchange", event => {

  console.log("subscription change ", event);

});


function testRequestRule(url, rules) {

  for (let i = 0; i < rules.length - 1; i++) {

    if (rules[i].route.test(url)) {
      return rules[i];
    }

  }

}


function getParameterByName(name, url) {

  name = name.replace(/[\[\]]/g, "\\$&");

  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);

  if (!results) {
    return null;
  }

  if (!results[2]) {
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
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

        pages.push(renderPage("category/" +
          category.Slug + "/", "category", category));

      });

      products.forEach(product => {

        pages.push(renderPage("product/" +
          product.Slug + "/", "product", product));

      });

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
          templates.shell = html;
        });

    })
    .then(() => {

      return getHTMLAsset("html/templates/product.template.html")
        .then(html => {
          templates.product = html;
        });

    });

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

  return fetch("api/categories.json")
    .then(response => {

      if (response && response.ok) {

        return response.json();

      } else {
        throw {
          status: response.status,
          message: "failed to fetch session data"
        };
      }

    })
    .then(categories => {

      return localforage.setItem(CATEGORIES_KEY, categories);

    })
    .then(() => {

      var dt = new Date();

      dt.setMinutes(dt.getMinutes() + MAX_LIST_CACHE);

      return localforage
        .setItem(CATEGORIES_KEY + STALE_KEY, dt);

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
          message: "failed to fetch category data"
        };
      }

    })
    .then(products => {

      return localforage.setItem(PRODUCTS_KEY, products);

    })
    .then(() => {

      var dt = new Date();

      dt.setMinutes(dt.getMinutes() + MAX_LIST_CACHE);

      return localforage
        .setItem(PRODUCTS_KEY + STALE_KEY, dt);

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

if (SyncManager) {

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