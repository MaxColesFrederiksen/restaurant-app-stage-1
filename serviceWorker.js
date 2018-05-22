const CACHES_NAME = 'assets-v3';
const CACHES = [
	'/index.html',
	'/js/main.js',
	'/css/styles.css',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/img/heart-empty.svg',
  '/img/heart-full.svg',
  '/img/rr.svg',
  '/img/triangle.svg',
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
    caches.open(CACHES_NAME).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );  
});
