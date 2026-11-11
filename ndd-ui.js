/* Shared UI for every page: toast, dialogs, sign-in, pretend payment, consent banner, maps.
   Needs catalog.js and demo-api.js first. All "services" here are demo stand-ins; see demo-api.js. */
(function(){
"use strict";
const A=window.NDD_API,H=SalonData.escapeHTML;
const $=id=>document.getElementById(id);
const UI={H};

// ── Toast ───────────────────────────────────────────────────────────────────
let tt;UI.toast=function(msg){let t=$("toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";t.setAttribute("role","status");document.body.appendChild(t)}
  t.textContent=msg;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),5200)};

// ── Dialog helper: UI.dialog(html, {wide}) → <dialog>; resolves nothing, close() removes it ──
UI.dialog=function(html,opts){opts=opts||{};const d=document.createElement("dialog");d.className="nd-dialog"+(opts.wide?" wide":"");
  d.innerHTML='<button type="button" class="nd-x" aria-label="Close">×</button><div class="nd-body">'+html+'</div>';document.body.appendChild(d);
  d.querySelector(".nd-x").addEventListener("click",()=>d.close());d.addEventListener("click",e=>{if(e.target===d)d.close()});
  d.addEventListener("close",()=>{setTimeout(()=>d.remove(),50);if(opts.onClose)opts.onClose()});d.showModal();return d};

// ── Sign-in: demo Google (name + email) or mobile OTP ───────────────────────────
UI.signIn=function(done,opts){opts=opts||{};
  const d=UI.dialog('<h2>Sign in</h2><p class="nd-sub">'+H(opts.reason||"Keep your bookings, orders and points in one place.")+'</p>'+
    '<div class="nd-demo">Demo sign-in. The live site uses real Google sign-in and an SMS code. Nothing leaves this device.</div>'+
    '<div class="nd-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-t="g">Google</button><button type="button" role="tab" aria-selected="false" data-t="p">Mobile number</button></div>'+
    '<form class="nd-form" data-f="g"><label>Name<input name="name" autocomplete="name" required></label><label>Email<input name="email" type="email" autocomplete="email" required placeholder="you@gmail.com"></label>'+
    '<label>Referral code <span class="nd-opt">(optional)</span><input name="ref" placeholder="ND-XXXX"></label><p class="nd-err" aria-live="polite"></p><button class="nd-btn gold" type="submit"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Continue with Google (demo)</button></form>'+
    '<form class="nd-form" data-f="p" hidden><label>Name<input name="name" autocomplete="name" required></label><label>Mobile number<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="10-digit mobile"></label>'+
    '<label>Code from SMS<input name="otp" inputmode="numeric" maxlength="6" placeholder="Demo code: '+A.DEMO_OTP+'" required></label><p class="nd-err" aria-live="polite"></p><button class="nd-btn gold" type="submit">Sign in</button></form>');
  d.querySelectorAll(".nd-tabs button").forEach(b=>b.addEventListener("click",()=>{d.querySelectorAll(".nd-tabs button").forEach(x=>x.setAttribute("aria-selected",String(x===b)));d.querySelectorAll("form").forEach(f=>f.hidden=f.dataset.f!==b.dataset.t)}));
  d.querySelectorAll("form").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f));
    const r=A.signIn(f.dataset.f==="g"?{provider:"google",name:v.name,email:v.email,refCode:v.ref}:{provider:"phone",name:v.name,phone:v.phone,otp:v.otp});
    if(!r.ok){f.querySelector(".nd-err").textContent=r.msg;return}
    d.close();UI.toast(r.isNew?"Welcome, "+(r.user.name||"there")+"! You're signed in.":"Welcome back, "+(r.user.name||"")+".");if(done)done(r.user)}));
  return d};
UI.requireUser=function(reason){return new Promise(res=>{const u=A.me();if(u)return res(u);UI.signIn(res,{reason})})};

// ── Pretend payment gateway ─────────────────────────────────────────────────────
// UI.pay({amount,label}) → Promise<{ok,ref,method}|null>   (null = cancelled)
UI.pay=function(o){return new Promise(res=>{let finished=false;
  const d=UI.dialog('<h2>Pay '+A.rupee(o.amount)+'</h2><p class="nd-sub">'+H(o.label||"")+'</p><div class="nd-demo"><b>Demo payment.</b> No money moves. On the live site this screen is the real payment gateway (UPI, cards, net banking, wallets).</div>'+
    '<div class="nd-tabs" role="tablist"><button type="button" aria-selected="true" data-m="upi">UPI</button><button type="button" aria-selected="false" data-m="card">Card</button><button type="button" aria-selected="false" data-m="netbanking">Net banking</button><button type="button" aria-selected="false" data-m="wallet">Wallet</button></div>'+
    '<form class="nd-form" id="payF"><div data-p="upi"><label>UPI ID<input value="demo@upi" aria-label="UPI ID"></label></div>'+
    '<div data-p="card" hidden><label>Card number<input value="4242 4242 4242 4242" inputmode="numeric"></label><div class="nd-row"><label>Expiry<input value="12/30"></label><label>CVV<input value="123" inputmode="numeric"></label></div></div>'+
    '<div data-p="netbanking" hidden><label>Bank<select><option>Demo Bank</option><option>Sample National Bank</option></select></label></div>'+
    '<div data-p="wallet" hidden><label>Wallet<select><option>Demo Wallet</option><option>Sample Pay</option></select></label></div>'+
    '<p class="nd-err" aria-live="polite"></p><button class="nd-btn gold" type="submit">Pay '+A.rupee(o.amount)+' (demo)</button></form>',{onClose:()=>{if(!finished)res(null)}});
  let m="upi";d.querySelectorAll(".nd-tabs button").forEach(b=>b.addEventListener("click",()=>{m=b.dataset.m;d.querySelectorAll(".nd-tabs button").forEach(x=>x.setAttribute("aria-selected",String(x===b)));d.querySelectorAll("[data-p]").forEach(p=>p.hidden=p.dataset.p!==m)}));
  d.querySelector("#payF").addEventListener("submit",async e=>{e.preventDefault();const btn=e.target.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Processing…";
    const r=await A.charge(m,o.amount);finished=true;d.close();res(r)})})};

// ── Consent banner (DPDP) + analytics placeholder ──────────────────────────────
// Paste a GA4 id (G-XXXXXXXXXX) here to switch analytics on after consent.
const ANALYTICS_ID="";
const CONSENT="ndd-consent";
function consentVal(){try{return localStorage.getItem(CONSENT)}catch(e){return null}}
function applyConsent(v){try{localStorage.setItem(CONSENT,v)}catch(e){}
  if(v==="yes"&&ANALYTICS_ID&&!window.__gaLoaded){window.__gaLoaded=true;const s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+ANALYTICS_ID;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",ANALYTICS_ID,{anonymize_ip:true})}}
UI.consent=function(){const v=consentVal();if(v){applyConsent(v);return}
  const b=document.createElement("div");b.className="nd-consent";b.setAttribute("role","dialog");b.setAttribute("aria-label","Cookies and privacy");
  b.innerHTML='<p>We use a few cookies to keep the site working. With your OK we also use privacy-friendly analytics to improve it. Read our <a href="privacy.html">privacy policy</a>.</p><div><button type="button" class="nd-btn" data-c="no">Essential only</button><button type="button" class="nd-btn gold" data-c="yes">Accept analytics</button></div>';
  b.addEventListener("click",e=>{const c=e.target.closest("[data-c]");if(!c)return;applyConsent(c.dataset.c);b.remove()});document.body.appendChild(b)};

// ── "Show map": the embed only loads when asked (faster page, no tracking until then) ──
UI.mapEmbed=function(host,address){host.innerHTML='<button type="button" class="nd-btn mapbtn">Show map</button>';
  host.querySelector("button").addEventListener("click",()=>{host.innerHTML='<iframe title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q='+encodeURIComponent(address)+'&output=embed"></iframe>'})};

UI.stars=n=>"★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n);
UI.signedLabel=function(){const u=A.me();return u?(u.name||"Account").split(" ")[0]:"Sign in"};
window.NDDUI=UI;
document.addEventListener("DOMContentLoaded",UI.consent);
if(document.readyState!=="loading")UI.consent();
})();
