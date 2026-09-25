const CACHE_NAME="one-percent-calculator-v6";
const APP_SHELL=["./","./index.html","./manifest.json","./icon.svg"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k.startsWith("one-percent-calculator-") && k!==CACHE_NAME).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  const isHTML=req.mode==="navigate" || req.destination==="document" ||
    url.pathname.endsWith("/") || url.pathname.endsWith(".html");

  if(isHTML){
    event.respondWith(
      fetch(req,{cache:"no-store"}).then(res=>{
        if(res.ok){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
        }
        return res;
      }).catch(()=>caches.match(req).then(cached=>cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(res=>{
      if(res.ok){
        const copy=res.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
      }
      return res;
    }).catch(()=>caches.match("./index.html")))
  );
});
