navigator.serviceWorker.register('http://localhost:57661/toughmudder-sw.js').then(function (registration) {    // Registration was successful
    console.log('External ServiceWorker registration successful with scope: ', registration.scope);
}).catch(function (err) {    // registration failed :(

    console.log('ServiceWorker registration failed: ', err);
});
