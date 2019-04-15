class InvalidationManager {

    constructor(invalidationRules = [{
            "cacheName": "precache-v4.03",
            "invalidationStrategy": "ttl",
            "strategyOptions": {
                "ttl": 604800 //1 week
            }
        },
        {
            "cacheName": "dynamic-cache-v4.03",
            "invalidationStrategy": "maxItems",
            "strategyOptions": {
                "max": 25
            }
        },
        {
            "cacheName": "product-image-cache-v4.03",
            "invalidationStrategy": "maxItems",
            "strategyOptions": {
                "max": 10
            }
        },
        {
            "cacheName": "products-cache-v4.03",
            "invalidationStrategy": "maxItems",
            "strategyOptions": {
                "max": 20
            }
        }
    ]) {

        this.invalidationRules = invalidationRules;

        this.cacheCleanUp();
    }

    cacheCleanUp() {

        let invMgr = this;

        invMgr.invalidationRules.forEach((value) => {

            switch (value.invalidationStrategy) {

                case "ttl":

                    invMgr.updateStaleEntries(value);

                    break;

                case "maxItems":

                    invMgr.maxItems(value);

                    break;

                default:
                    break;
            }

        });

    }

    maxItems(options) {

        self.caches.open(options.cacheName).then((cache) => {

            cache.keys().then((keys) => {

                if (keys.length > options.strategyOptions.max) {

                    let purge = keys.length - options.strategyOptions.max;

                    for (let i = 0; i < purge; i++) {
                        cache.delete(keys[i]);
                    }

                }

            });

        });

    }

    updateStaleEntries(rule) {

        console.log(rule.cacheName);

        self.caches.open(rule.cacheName)
            .then((cache) => {

                cache.keys().then(function (keys) {

                    keys.forEach((request, index, array) => {

                        cache.match(request).then((response) => {

                            console.log(request.url);

                            // for (let pair of response.headers.entries()) {
                            //     console.log(pair[0]+ ': '+ pair[1]);
                            //  }

                            let date = new Date(response.headers.get("date")),
                                current = Date.now();

                            console.log(date.toLocaleString());

                            //300 === 5 minutes
                            //3600 === 1 Hour
                            //86400 === 1 day
                            //604800 === 1 week

                            if (!DateManager.compareDates(current, DateManager.addSecondsToDate(date, 300))) {

                                cache.add(request);

                            }

                        });

                    });

                });

            });

    }

    invalidateCache(cacheName) {

        let invMgr = this;

        invMgr.invalidationRules.forEach((value) => {

            if (value.cacheName === cacheName) {

                switch (value.invalidationStrategy) {

                    case "ttl":

                        invMgr.updateStaleEntries(value);

                        break;

                    case "maxItems":

                        invMgr.maxItems(value);

                        break;

                    default:
                        break;
                }

            }

        });


    }

}