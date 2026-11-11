// Offline support for the installed web app.
// Bump VERSION whenever any file in this folder changes, so installed copies pick up the update.
const VERSION="ndd-2026-11-11-14";
const PRECACHE=["./","index.html","studio.html","rr-nagar.html","nagarabhavi.html","account.html","admin.html","privacy.html","terms.html","cancellation.html","refund.html","catalog.js","demo-api.js","ndd-ui.js","customer.js","extras.js","branch.js","account.js","admin.js","studio.js","ndd.css","theme.css","manifest.webmanifest","owner.webmanifest","assets/artist-hair.webp","assets/artist-nails.webp","assets/artist-skin.webp","assets/og-image.jpg","assets/p-logo.webp","assets/p-nb-front.webp","assets/p-nb-g1.webp","assets/p-nb-g2.webp","assets/p-nb-g3.webp","assets/p-nb-g4.webp","assets/p-nb-g5.webp","assets/p-nb-hair.webp","assets/p-nb-hero.webp","assets/p-nb-more.webp","assets/p-nb-nails.webp","assets/p-nb-skin.webp","assets/p-nb-split.webp","assets/p-rr-g1.webp","assets/p-rr-g2.webp","assets/p-rr-g3.webp","assets/p-rr-g4.webp","assets/p-rr-g5.webp","assets/p-rr-hair.webp","assets/p-rr-hero.webp","assets/p-rr-more.webp","assets/p-rr-nails.webp","assets/p-rr-skin.webp","assets/p-rr-split.webp","assets/product-conditioner.webp","assets/product-shampoo.webp","assets/product-skin.webp","icons/apple-touch-icon.png","icons/favicon-48.png","icons/icon-any-192.png","icons/icon-any-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","icons/owner-any-192.png","icons/owner-any-512.png","icons/owner-apple-touch.png","icons/owner-maskable-192.png","icons/owner-maskable-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;
 const url=new URL(req.url);
 // Pages: network first so updates show at once, cached copy when offline.
 if(req.mode==="navigate"){e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(r=>r||caches.match("index.html"))));return}
 // Google Fonts: serve from cache, refresh in the background.
 if(/fonts.(googleapis|gstatic).com$/.test(url.hostname)){e.respondWith(caches.open(VERSION).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(res=>{c.put(req,res.clone());return res}).catch(()=>hit);return hit||net})));return}
 if(url.origin!==location.origin)return;
 // Code: network first too, so a page never runs new HTML with old scripts after an update.
 if(/\.(js|css|webmanifest)$/.test(url.pathname)){e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req)));return}
 // Pictures and icons: cache first.
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return res})));
});
