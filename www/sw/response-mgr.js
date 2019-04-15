'use strict';

self.importScripts("js/libs/mustache.min.js");


class ResponseManager {

    isResponseCacheable(response) {

        //only cache good responses
        //200 - Good :)
        // 0  - Good, but CORS. 
        //This is for Cross Origin opaque requests

        return [0, 200].includes(response.status);

    }

    isResponseNotFound(response) {

        return response.status === 404;

    }

    fetchText(url) {

        return fetch(url)
            .then(response => {

                if (response.ok) {

                    return response.text();

                }

            });

    }

    fetchJSON(url) {

        return fetch(url)
            .then(response => {

                if (response.ok) {

                    return response.json();

                }

            });

    }

    /*
        This will fetch an app shell, page and data template
        It then uses Mustache to render everything together

        {
            request: //the request that triggered the fetch
            pageURL: "url to core page html",
            template: "url to the data template",
            api: //a method to execute that makes the API call,
            cacheName: "cache name to save the rendered response"
        }
    */
    fetchAndRenderResponseCache(options) {

        let _self = this;

        return _self.fetchText(options.pageURL)
            .then(pageHTML => {

                return _self.fetchText(options.template)
                    .then(template => {

                        return pageHTML.replace(/<%template%>/g, template);

                    });

            })
            .then(pageTemplate => {

                return options.api(options.request)
                    .then(data => {

                        return Mustache.render(pageTemplate, data);

                    });

            }).then(html => {

                //make custom response
                let response = new Response(html, {
                        headers: {
                            'content-type': 'text/html'
                        }
                    }),
                    copy = response.clone();

                caches.open(options.cacheName)
                    .then(cache => {
                        cache.put(options.request, copy);
                    });

                return response;

            });

    }

    cacheFallingBackToNetwork(request, cacheName) {

        var responseManager = this;

        return caches.match(request)
            .then(response => {

                return response || fetch(request);

            });
    }

    cacheFallingBackToNetworkCache(request, cacheName) {

        var responseManager = this;

        return caches.match(request)
            .then(response => {

                if (response) {

                    return response;

                } else {

                    return fetch(request)
                        .then(response => {

                            //don't cache a 404 because the URL may become 200, etc
                            //chrome-extension requests can't be cached
                            //0 & 200 are good responses that can be cached
                            if (!responseManager.isResponseNotFound(response) &&
                                request.method.toUpperCase() === "GET" &&
                                request.url.indexOf("chrome-extension") === -1 &&
                                responseManager.isResponseCacheable(response)) {

                                let rsp = response.clone();

                                //cache response for the next time around
                                return caches.open(cacheName).then(function (cache) {

                                    cache.put(request, rsp);

                                    return response;

                                });

                            } else {

                                return response;

                            }

                        });

                }

            });

    }

    cacheOnly(request, cacheName) {

        return caches.match(request);

    }

    networkOnly(request) {

        return fetch(request);

    }

}