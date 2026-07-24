const CACHE_NAME = 'hero-app-cache-v1';

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

// حدث التنشيط: تنظيف الكاش القديم إذا قمت بتحديث التطبيق
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

// حدث الجلب (Fetch): الخوارزمية الذكية (الكاش أولاً، ثم الإنترنت، مع حفظ أي ملف جديد يطلبه المستخدم)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا وجد الملف في الكاش (وضع الأوفلاين)، قم بإرجاعه فوراً
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن في الكاش، اطلبه من الإنترنت
      return fetch(event.request).then((networkResponse) => {
        // تأكد أن الاستجابة صالحة
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // احفظ نسخة من الملف الجديد (مثل ملفات الصوت والصور التي لم نذكرها بالأعلى) في الكاش للمستقبل
        let responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // إذا فشل الاتصال بالإنترنت والملف غير موجود بالكاش، نتجاهل الخطأ بصمت لكي لا ينهار التطبيق
        console.log('أنت الآن في وضع عدم الاتصال (Offline).');
      });
    })
  );
});