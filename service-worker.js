var CACHE_NAME='toolbox-v1';
var urlsToCache = [
  './',
  './index.html',
  './css/normalize.css',
  './css/style.css',
  './css/switch.css',
  './img/logo.png',
  './js/app.js',
  './js/clipboard.min.js',
];

//To clear the cache on load
// caches.delete(CACHE_NAME).then(function() {
//   console.log('Cache successfully deleted!');
// });
//

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {


      return cache.addAll(urlsToCache)
      .then(() => self.skipWaiting());
    })
  )
});


self.addEventListener('activate',  event => {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
      caches.keys().then(function(cacheNames) {

        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }

          })
        );
      })
    );


  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
