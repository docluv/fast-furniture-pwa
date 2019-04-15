(function () {


    if ('storage' in navigator && 'estimate' in navigator.storage) {

        navigator.storage.estimate().then(estimate => {

            console.log(`Using ${estimate.usage} out of ${estimate.quota} bytes.`);

            var $used = document.querySelector(".storage-use"),
                $available = document.querySelector(".storage-avaialble");

                $used.innerText = (estimate.usage/1048576).toFixed(2);
                $available.innerText = Math.floor(estimate.quota/1073741824);
        });

    }



})();