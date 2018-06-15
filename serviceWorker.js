const CACHES_NAME = 'assets-v8';
const CACHES = [
	'/index.html',
	'/js/main.js',
	'/css/styles.css',
  '/img_src/1.jpg',
  '/img_src/2.jpg',
  '/img_src/3.jpg',
  '/img_src/4.jpg',
  '/img_src/5.jpg',
  '/img_src/6.jpg',
  '/img_src/7.jpg',
  '/img_src/8.jpg',
  '/img_src/9.jpg',
  '/img_src/10.jpg',
  '/img_src/heart-empty.svg',
  '/img_src/heart-full.svg',
  '/img_src/rr.svg',
  '/img_src/triangle.svg',
];

self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('assets-') && !CACHES.includes(cacheName);
        }).map(function (cacheName) {
          return caches['delete'](cacheName);
        }));
    }));
});


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
        return response || fetch(event.request).then(function(res) {
          if (event.request.method == "GET") {
            cache.put(event.request, res.clone());
            return res;
          }
        });
      });
    })
  );  
});

