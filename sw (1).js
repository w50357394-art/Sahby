/* sw.js — صحبي · ضغط الإشعار يفتح المحادثة
   لو عندك sw.js بالفعل: انسخ بس الجزء الخاص بـ notificationclick في ملفك. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const chatId=(e.notification.data&&e.notification.data.chatId)||'';
  e.waitUntil((async()=>{
    const all=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of all){
      if('focus' in c){await c.focus();c.postMessage({type:'sahby-open-chat',chatId});return}
    }
    const url=new URL('./',self.registration.scope);
    if(chatId)url.searchParams.set('chat',chatId);
    if(clients.openWindow)return clients.openWindow(url.href);
  })());
});
