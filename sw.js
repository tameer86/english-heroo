const CACHE_NAME = 'hero-app-cache-v2';

// الملفات الأساسية التي يجب حفظها فور فتح التطبيق لأول مرة
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './game.html',
  './save.html',
  './memorized.html',
  './review.html',
  './matchg.html',
  './listen.html',
  './missing_letters.html',
  './scramble_letters.html',
  './crossword.html',
  './videoAssistant.html',
  './manifest.json',
  './config/passwords.json',
  './config/serials.json'
];

// حدث التثبيت: حفظ الملفات الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// حدث التنشيط: تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// حدث الجلب (Fetch): استراتيجية الشبكة أولاً مع الاحتفاظ بالكاش للعمل بدون إنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // إذا كان الاتصال بالإنترنت ناجحاً، نعيد النتيجة ونحفظ نسخة محدثة في الكاش
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return networkResponse;
      }

      let responseToCache = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseToCache);
      });

      return networkResponse;
    }).catch(() => {
      // إذا فشل الاتصال بالإنترنت (وضع عدم الاتصال)، نلجأ للنسخة المخزنة
      return caches.match(event.request).then((cachedResponse) => {
         if (cachedResponse) {
             return cachedResponse;
         }
         console.log('أنت الآن في وضع عدم الاتصال (Offline).');
      });
    })
  );
});