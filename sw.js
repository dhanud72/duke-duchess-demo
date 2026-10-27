// Offline support for the installed web app.
// Bump VERSION whenever any file in this folder changes, so installed copies pick up the update.
const VERSION="ndd-2026-10-27-30";
const PRECACHE=["./","index.html","studio.html","catalog.js","customer.js","studio.js","manifest.webmanifest","assets/artist-hair.webp","assets/artist-nails.webp","assets/artist-skin.webp","assets/branch-rr.webp","assets/og-image.jpg","assets/product-conditioner.webp","assets/product-shampoo.webp","assets/product-skin.webp","assets/rr-g2.webp","assets/rr-g3.webp","assets/rr-g4.webp","assets/rr-g5.webp","assets/rr-hero-wide.webp","assets/rr-hero.webp","assets/rr-svc-hair.webp","assets/rr-svc-more.webp","assets/rr-svc-nails.webp","assets/rr-svc-skin.webp","assets/salon-facial.webp","assets/salon-floor.webp","assets/salon-hairwash.webp","assets/salon-lounge.webp","assets/salon-pedicure.webp","assets/salon-reception.webp","assets/salon-shelf.webp","assets/salon-styling.webp","assets/salon-treatment.webp","assets/salon-vanity.webp","assets/split-nb.webp","icons/apple-touch-icon.png","icons/favicon-48.png","icons/icon-any-192.png","icons/icon-any-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;
 const url=new URL(req.url);
 // Pages: network first so updates show at once, cached copy when offline.
 if(req.mode==="navigate"){e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(r=>r||caches.match("index.html"))));return}
 // Google Fonts: serve from cache, refresh in the background.
 if(/fonts.(googleapis|gstatic).com$/.test(url.hostname)){e.respondWith(caches.open(VERSION).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(res=>{c.put(req,res.clone());return res}).catch(()=>hit);return hit||net})));return}
 if(url.origin!==location.origin)return;
 // Everything else from this site: cache first.
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return res})));
});
