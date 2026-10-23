/* Sahby Chat - Service Worker: يخلي التطبيق يفتح بدون إنترنت ويدعم الإشعارات */
const VER = 'sahby-v1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// استقبال الإشعارات في الخلفية
self.addEventListener('push', function(event) {
    let data = { title: 'رسالة جديدة', body: 'وصلتك رسالة جديدة في تطبيق صحبي' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: './index.html',
        badge: './index.html',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// عند الضغط على الإشعار يتم فتح التطبيق
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // طلبات Supabase والمكتبات الخارجية ماتتخزنش: بتروح للشبكة مباشرة
  if (url.origin !== self.location.origin) return;

  // صفحة التطبيق: الشبكة أولًا (عشان التحديثات توصل)، ولو مفيش نت نفتح النسخة المحفوظة
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put('./index.html', copy)); }
          return res;
        })
        .catch(() =>
          caches.match('./index.html').then(r => r || caches.match('./')).then(r =>
            r || new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;background:#0b141a;color:#eaf2f5;text-align:center;padding:40px" dir="rtl"><h2>مفيش اتصال بالإنترنت</h2><p>افتح التطبيق مرة واحدة بنت عشان يتحفظ، وبعدها هيشتغل بدون نت.</p>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
        )
    );
    return;
  }

  // باقي ملفات نفس الموقع: من الحفظ فورًا وتتحدث في الخلفية
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
