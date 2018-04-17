const CACHES_NAME = 'assets-v1';
const CACHES = [
	'/index.html',
	'/js/main.js',
	'/css/styles.css',
];

if('serviceWorker' in navigator) {
  navigator.serviceWorker
  	.register('/serviceWorker.js')
  	.then(function(sw) { 
  		console.log("Service Worker Registered");
  	});
}

self.addEventListener('install', function(e) {
	console.log('installing..');
	 e.waitUntil(
	   caches.open(CACHES_NAME).then(function(cache) {
	     return cache.addAll(CACHES);
	   })
	 );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {

        if (response) {
          return response;
        }

        let fetchClone = event.request.clone();

        return fetch(fetchClone).then(
          function(response) {

            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            let responseToCache = response.clone();

            caches.open(CACHES_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});
