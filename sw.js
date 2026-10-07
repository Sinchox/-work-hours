const CACHE='work-hours-v8-2.1';
const ASSETS=[
  './','./index.html?v=8.2','./manifest.json?v=8.2','./css/app.css?v=8.2',
  './js/database.js?v=8.2','./js/records.js?v=8.2','./js/ui.js?v=8.2','./js/reports.js?v=8.2','./js/settings.js?v=8.2','./js/app.js?v=8.2'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));return r;}).catch(()=>caches.match('./index.html?v=8.2'))));
});
