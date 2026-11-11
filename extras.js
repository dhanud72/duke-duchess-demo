/* Customer-site features that sit on the demo platform (demo-api.js).
   Loaded after customer.js, whose top-level names ($, bk, data, currentBranch, bag…) it uses. */
(function(){
"use strict";
const A=NDD_API,U=NDDUI,E=SalonData.escapeHTML;
const money=n=>A.rupee(n);
const branchKey={rr:"RR Nagar",nb:"Nagarabhavi"};
let decorated=false;

// ── One-time DOM additions ──────────────────────────────────────────────────────
function decorate(){if(decorated)return;decorated=true;
  // header: account button
  const right=document.querySelector("header.nav .navright");
  if(right){const b=document.createElement("button");b.type="button";b.className="bag acct";b.id="acctBtn";b.setAttribute("aria-label","Account");
    b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg><span class="acctname" id="acctName"></span>';
    right.insertBefore(b,$("bagBtn"));b.addEventListener("click",()=>{if(A.me())location.href="account.html";else U.signIn(()=>{refreshAccount();location.href="account.html"})})}
  // booking step 4 extras
  const v4=document.querySelector('.wizview[data-view="4"]');
  v4.insertAdjacentHTML("beforeend",'<div class="nd-extra" id="bkExtra"><div class="field full"><label for="bkEmail">Email <span class="optional">(for your confirmation)</span></label><input id="bkEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>'+
   '<div class="nd-promo"><input id="bkCoupon" placeholder="Offer code" aria-label="Offer code" autocapitalize="characters"><button type="button" class="nd-btn" id="bkApply">Apply</button></div>'+
   '<div class="nd-promo"><input id="bkGift" placeholder="Gift card code" aria-label="Gift card code" autocapitalize="characters"><button type="button" class="nd-btn" id="bkApplyG">Apply</button></div>'+
   '<label class="nd-check" id="bkPassRow" hidden><input type="checkbox" id="bkPass"> <span>Use my pass <small id="bkPassLeft"></small></span></label>'+
   '<label class="nd-check" id="bkPtsRow" hidden><input type="checkbox" id="bkPts"> <span>Use my <b id="bkPtsN"></b> loyalty points</span></label>'+
   '<fieldset class="nd-pay" id="bkPay"><legend>Payment</legend><label><input type="radio" name="bkpay" value="salon" checked> Pay at the salon</label><label><input type="radio" name="bkpay" value="online"> Pay now online <small>(demo)</small></label></fieldset>'+
   '<div class="nd-quote" id="bkQuote" aria-live="polite"></div></div>');
  const ex=$("bkExtra");ex.addEventListener("input",refreshQuote);ex.addEventListener("change",refreshQuote);$("bkApply").addEventListener("click",refreshQuote);$("bkApplyG").addEventListener("click",refreshQuote);
  // bag checkout extras
  const cb=$("checkB");cb.querySelector(".carttotal.small").hidden=true;
  cb.querySelector(".carttotal.small").insertAdjacentHTML("beforebegin",'<div class="nd-extra" id="ordExtra"><div class="field"><label for="ordEmail">Email <span class="optional">(for your receipt)</span></label><input id="ordEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>'+
   '<div class="nd-promo"><input id="ordCoupon" placeholder="Offer code" aria-label="Offer code" autocapitalize="characters"><button type="button" class="nd-btn" id="ordApply">Apply</button></div>'+
   '<div class="nd-promo"><input id="ordGift" placeholder="Gift card code" aria-label="Gift card code" autocapitalize="characters"><button type="button" class="nd-btn" id="ordApplyG">Apply</button></div>'+
   '<label class="nd-check" id="ordPtsRow" hidden><input type="checkbox" id="ordPts"> <span>Use my <b id="ordPtsN"></b> loyalty points</span></label>'+
   '<fieldset class="nd-pay"><legend>Payment</legend><label><input type="radio" name="ordpay" value="salon" checked> Pay when I collect</label><label><input type="radio" name="ordpay" value="online"> Pay now online <small>(demo)</small></label></fieldset>'+
   '<div class="nd-quote" id="ordQuote" aria-live="polite"></div></div>');
  const ox=$("ordExtra");ox.addEventListener("input",refreshOrderQuote);ox.addEventListener("change",refreshOrderQuote);$("ordApply").addEventListener("click",refreshOrderQuote);$("ordApplyG").addEventListener("click",refreshOrderQuote);$("pickupBranch").addEventListener("change",refreshOrderQuote);
  $("checkoutBtn").className="btn";$("checkoutBtn").textContent="Place order";
  const note=document.querySelector("#checkA .cartnote");if(note)note.textContent="Pay when you collect at the salon, or pay online in the next step.";
  // maps on the branch cards
  [["rrAddress","locRR"],["nagarabhaviAddress","locNB"]].forEach(([id,card])=>{const host=document.createElement("div");host.className="nd-map";$(card).querySelector(".hoursline").after(host);U.mapEmbed(host,$(id).textContent)});
  // footer links
  const fl=document.querySelector(".footlinks");
  if(fl)fl.insertAdjacentHTML("beforeend",'<a href="rr-nagar.html">R R Nagar</a><a href="nagarabhavi.html">Nagarabhavi</a><a href="account.html">My account</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="cancellation.html">Cancellation</a><a href="refund.html">Refunds</a><a href="admin.html">Admin (demo)</a>');
  // text updates now that booking is real
  const perks=document.querySelectorAll(".perks li");if(perks.length>=3){perks[0].textContent="Live availability by stylist";perks[1].textContent="Confirmation by email and WhatsApp";perks[2].textContent="Pay at the salon or online";}
  const bp=document.querySelector(".bookingcopy>p");if(bp)bp.textContent="Pick a service, a stylist and a time that suits you. You see only times that are really free, and your confirmation arrives straight away.";
  const how=document.querySelector(".bookingnote ol");if(how)how.innerHTML="<li>Pick a service, a day and a free time.</li><li>Add a code, pass or points if you have them.</li><li>Confirm. Change or cancel any time up to "+A.settings().cancelHours+" hours before.</li>";
  const sub=document.querySelector("footer .bottom span:last-child");if(sub)sub.textContent="Online booking, orders and payments on this demo are for preview only.";
  document.querySelectorAll("#reviews,#plans").forEach(s=>s.hidden=false);
}
const $=id=>document.getElementById(id);

// ── Header account button + prefill ─────────────────────────────────────────────
function refreshAccount(){const u=A.me(),n=$("acctName");if(!n)return;n.textContent=u?(u.name||"Account").split(" ")[0]:"Sign in";$("acctBtn").classList.toggle("on",!!u);
  if(u){if($("name")&&!$("name").value)$("name").value=u.name||"";if($("phone")&&!$("phone").value&&u.phone)$("phone").value=u.phone;if($("bkEmail")&&!$("bkEmail").value)$("bkEmail").value=u.email||"";
    if($("orderName")&&!$("orderName").value)$("orderName").value=u.name||"";if($("orderPhone")&&!$("orderPhone").value&&u.phone)$("orderPhone").value=u.phone;if($("ordEmail")&&!$("ordEmail").value)$("ordEmail").value=u.email||""}}

// ── Booking: price, offers, payment ──────────────────────────────────────────────
function bookInput(){const v=id=>($(id)?$(id).value.trim():"");const u=A.me();
  return {branch:currentBranch,serviceId:bk.svc,artistId:bk.artist,date:bk.date,time:bk.time,name:v("name"),phone:cleanPhone(v("phone")),email:v("bkEmail"),notes:v("notes"),coupon:v("bkCoupon"),giftCode:v("bkGift"),
    points:$("bkPts")&&$("bkPts").checked&&u?u.points:0,useMembership:!!($("bkPass")&&$("bkPass").checked&&!$("bkPassRow").hidden),pay:(document.querySelector('input[name="bkpay"]:checked')||{}).value||"salon"}}
function quoteBooking(i){const svc=svcOf(),u=A.me(),sub=svc?(SalonData.priceFor(svc,i.branch)||0):0,mem=i.useMembership?A.membershipFor({userId:u&&u.id,phone:i.phone},svc):null;
  return {sub,svc,q:A.quote({kind:"booking",subtotal:sub,coupon:i.coupon,points:i.points,giftCode:i.giftCode,useMembership:!!mem,membershipId:mem&&mem.id,phone:i.phone,userId:u&&u.id})}}
function quoteHTML(sub,q,payNote,lbl){if(!sub)return '<p>The price for this service is confirmed at the salon.</p>';
  const row=(l,v,neg)=>'<div><span>'+l+'</span><b>'+(neg?"−":"")+money(v)+'</b></div>';
  return row(lbl||"Service",sub)+(q.member?row("Pass session",q.member,true):"")+(q.couponDiscount?row("Offer "+q.coupon,q.couponDiscount,true):"")+(q.points?row("Loyalty points",q.points,true):"")+(q.gift?row("Gift card",q.gift,true):"")+
    '<div class="tot"><span>'+(payNote||"To pay")+'</span><b>'+money(q.total)+'</b></div>'+q.msgs.filter(Boolean).map(m=>'<p class="nd-msg">'+E(m)+'</p>').join("")}
function refreshQuote(){const svc=svcOf();if(!$("bkQuote")||!svc||bk.step!==4)return;const u=A.me(),i=bookInput();
  const mem=u||i.phone?A.membershipFor({userId:u&&u.id,phone:i.phone},svc):null;$("bkPassRow").hidden=!mem;if(mem)$("bkPassLeft").textContent="("+mem.remaining+" session"+(mem.remaining===1?"":"s")+" left)";
  const pts=u?u.points:0,pmin=A.settings().pointsMin;$("bkPtsRow").hidden=!(u&&pts>=pmin);$("bkPtsN").textContent=pts;
  const {sub,q}=quoteBooking(bookInput());$("bkPay").hidden=!sub;
  $("bkQuote").innerHTML=quoteHTML(sub,q,document.querySelector('input[name="bkpay"]:checked').value==="online"?"To pay now":"To pay at the salon")}

async function bookSubmit(){
  const btn=$("wizSubmit"),i=bookInput(),{sub,svc,q}=quoteBooking(i);if(!svc)return;
  let paid=false,payRef="",pay=i.pay;if(!sub)pay="salon";
  btn.disabled=true;
  try{
    if(pay==="online"){if(q.total>0){const r=await U.pay({amount:q.total,label:svc.name+" · "+prettyDate(i.date)+", "+clock(i.time)});if(!r){return}paid=true;payRef=r.ref}else paid=true}
    const res=A.createBooking(Object.assign(i,{pay,paid,payRef}));
    if(!res.ok){$("formError").textContent=res.msg;bk.time=null;goStep(3);return}
    confirmBooking(res.booking);
  }finally{btn.disabled=false}}

function download(name,type,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function confirmBooking(b){
  const svc=data.services.find(s=>s.id===b.serviceId),art=data.artists.find(a=>a.id===b.artistId);
  const msg=["Hello New Duke & Duchess ("+branchLabel(b.branch)+"), I've booked online:","","• "+b.serviceName+" ("+b.dur+" min)","• Specialist: "+(art?art.name:"Any available"),"• "+new Date(b.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})+", "+clock(b.time),"• Name: "+b.name,"• Ref: "+b.id].join("\n");
  const d=U.dialog('<div class="nd-ok">✓</div><h2>You\'re booked!</h2><p class="nd-sub">Ref <b>'+E(b.id)+'</b></p>'+
    '<dl class="nd-dl"><div><dt>Service</dt><dd>'+E(b.serviceName)+' · '+b.dur+' min</dd></div><div><dt>When</dt><dd>'+E(A.fmtDate(b.date))+', '+E(clock(b.time))+'</dd></div><div><dt>Where</dt><dd>'+E(branchLabel(b.branch))+'</dd></div>'+(art?'<div><dt>With</dt><dd>'+E(art.name)+'</dd></div>':'')+
    '<div><dt>Payment</dt><dd>'+(b.total?(b.paid?"Paid "+money(b.total)+" online (demo)":money(b.total)+" at the salon"):(b.price?"Nothing to pay":"Price confirmed at the salon"))+'</dd></div></dl>'+
    '<p class="nd-sub">We sent an email and a WhatsApp confirmation, and will send a reminder 24 hours before. <small>(Demo: see Admin → Messages.)</small></p>'+
    '<div class="nd-actions"><button type="button" class="nd-btn gold" data-a="ics">Add to calendar</button><button type="button" class="nd-btn" data-a="wa">Also tell the salon on WhatsApp</button>'+(A.me()?'<a class="nd-btn" href="account.html">Manage in My account</a>':'<button type="button" class="nd-btn" data-a="in">Sign in to manage it</button>')+'</div>');
  d.addEventListener("click",e=>{const a=e.target.closest("[data-a]");if(!a)return;
    if(a.dataset.a==="ics")download(b.id+".ics","text/calendar",A.ics(b));
    if(a.dataset.a==="wa")openWhatsApp(waLink(b.branch,msg));
    if(a.dataset.a==="in")U.signIn(()=>{refreshAccount();d.close();location.href="account.html"},{reason:"Sign in with the same mobile number to see this booking."})});
  bk.time=null;bk.date=null;bk.step=1;["notes","bkCoupon","bkGift"].forEach(id=>{if($(id))$(id).value=""});if($("bkPass"))$("bkPass").checked=false;if($("bkPts"))$("bkPts").checked=false;renderWizard()}

// Show the price in the running summary and refresh totals
const _summary=renderSummary;
renderSummary=function(){_summary();const svc=svcOf();if(svc&&bk.time!=null){const p=SalonData.priceFor(svc,currentBranch);if(p)$("bookingSummary").textContent+=" · "+money(p)}if(bk.step===4)refreshQuote()};

// Full days: offer the waitlist
const _step2=renderStep2;
renderStep2=function(){_step2();const full=[...document.querySelectorAll("#dayStrip .daybtn:disabled")].filter(b=>/Full|No times/.test(b.textContent+b.title));
  if(full.length&&!$("wlLink")){$("dayHint").insertAdjacentHTML("beforeend",' <button type="button" class="linkbtn" id="wlLink">Day full? Join the waitlist</button>')}};
document.addEventListener("click",e=>{if(e.target.id!=="wlLink")return;const svc=svcOf();
  const full=[...document.querySelectorAll("#dayStrip .daybtn:disabled")].filter(b=>/Full/.test(b.textContent)).map(b=>b.dataset.day);
  const d=U.dialog('<h2>Join the waitlist</h2><p class="nd-sub">If someone cancels, we message you first.</p><form class="nd-form"><label>Day<select name="date">'+full.map(x=>'<option value="'+x+'">'+E(prettyDate(x))+'</option>').join("")+'</select></label><label>Your name<input name="name" required value="'+E($("name").value)+'"></label><label>Mobile<input name="phone" type="tel" required value="'+E($("phone").value)+'"></label><button class="nd-btn gold" type="submit">Add me</button></form>');
  d.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();const v=Object.fromEntries(new FormData(ev.target));if(cleanPhone(v.phone).length<10){U.toast("Enter a 10-digit mobile number.");return}
    A.joinWaitlist({branch:currentBranch,serviceId:bk.svc,serviceName:svc?svc.name:"",date:v.date,name:v.name,phone:cleanPhone(v.phone)});d.close();U.toast("You're on the waitlist. We'll message you if a slot opens.")})});

// ── Bag checkout: orders ──────────────────────────────────────────────────────────
function orderInput(){const v=id=>($(id)?$(id).value.trim():"");const u=A.me();
  return {branch:$("pickupBranch").value,lines:bagLines().map(l=>({id:l.p.id,qty:l.qty})),name:v("orderName"),phone:cleanPhone(v("orderPhone")),email:v("ordEmail"),coupon:v("ordCoupon"),giftCode:v("ordGift"),
    points:$("ordPts")&&$("ordPts").checked&&u?u.points:0,pay:(document.querySelector('input[name="ordpay"]:checked')||{}).value||"salon"}}
function orderSub(){return bagLines().reduce((n,l)=>n+(l.p.amount||0)*l.qty,0)}
function refreshOrderQuote(){if(!$("ordQuote"))return;const u=A.me(),i=orderInput(),sub=orderSub();$("ordPtsRow").hidden=!(u&&u.points>=A.settings().pointsMin);$("ordPtsN").textContent=u?u.points:0;
  const q=A.quote({kind:"order",subtotal:sub,coupon:i.coupon,points:i.points,giftCode:i.giftCode,phone:i.phone,userId:u&&u.id});
  $("ordQuote").innerHTML=sub?quoteHTML(sub,q,i.pay==="online"?"To pay now":"To pay when you collect","Items"):'<p>Prices are confirmed at the salon.</p>'+(bagLines().some(l=>!l.p.amount)?"":"")}
async function orderSubmit(){const i=orderInput(),sub=orderSub();if(!sub){$("orderError").textContent="Items without a price can't be ordered online. Ask the salon.";return}
  const q=A.quote({kind:"order",subtotal:sub,coupon:i.coupon,points:i.points,giftCode:i.giftCode,phone:i.phone,userId:(A.me()||{}).id});
  const btn=$("checkoutBtn");btn.disabled=true;let paid=false,payRef="";
  try{if(i.pay==="online"){if(q.total>0){const r=await U.pay({amount:q.total,label:bagLines().map(l=>l.qty+"× "+l.p.name).join(", ")});if(!r)return;paid=true;payRef=r.ref}else paid=true}
    const res=A.createOrder(Object.assign(i,{paid,payRef}));if(!res.ok){$("orderError").textContent=res.msg;return}
    const o=res.order;bag={};store.set(BAG_KEY,bag);toggleBag(false);renderProducts();updateCart();
    const msg="Hello New Duke & Duchess ("+branchLabel(o.branch)+"), I've ordered online:\n"+o.lines.map(l=>"• "+l.qty+" × "+l.name).join("\n")+"\nRef: "+o.id;
    const d=U.dialog('<div class="nd-ok">✓</div><h2>Order placed</h2><p class="nd-sub">Ref <b>'+E(o.id)+'</b></p><dl class="nd-dl">'+o.lines.map(l=>'<div><dt>'+l.qty+' ×</dt><dd>'+E(l.name)+'</dd></div>').join("")+'<div><dt>Collect from</dt><dd>'+E(branchLabel(o.branch))+'</dd></div><div><dt>Payment</dt><dd>'+(o.total?(o.paid?"Paid "+money(o.total)+" online (demo)":money(o.total)+" when you collect"):"Nothing to pay")+'</dd></div></dl><p class="nd-sub">We\'ll message you when it\'s ready for pickup. Delivery isn\'t offered; the salon hands it over at the branch.</p><div class="nd-actions">'+(A.me()?'<a class="nd-btn" href="account.html#orders">See my orders</a>':"")+'<button type="button" class="nd-btn" data-a="wa">Tell the salon on WhatsApp</button></div>');
    d.addEventListener("click",e=>{if(e.target.closest('[data-a="wa"]'))openWhatsApp(waLink(o.branch,msg))})
  }finally{btn.disabled=false}}
const _toggleBag=toggleBag;toggleBag=function(open){_toggleBag(open);if(open){refreshAccount();refreshOrderQuote()}};

// ── Offers carousel ───────────────────────────────────────────────────────────────
let carTimer=null;
function renderCarousel(){const list=A.banners(currentBranch),sec=$("carousel");sec.hidden=!list.length;if(!list.length)return;
  $("ndTrack").innerHTML=list.map((b,i)=>'<article class="nd-slide" id="slide'+i+'" style="--img:url(\''+E(b.image)+'\')"><div><small>'+E(b.title)+'</small><h3>'+E(b.text)+'</h3><a class="btn small" href="'+E(b.link||"#booking")+'">'+E(b.cta||"Learn more")+' ↗</a></div></article>').join("");
  $("ndDots").innerHTML=list.map((b,i)=>'<button type="button" aria-label="Show '+E(b.title)+'" data-slide="'+i+'"></button>').join("");
  syncDots();clearInterval(carTimer);
  if(list.length>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)carTimer=setInterval(()=>{const t=$("ndTrack");if(t.matches(":hover")||t.contains(document.activeElement))return;const w=t.firstElementChild.getBoundingClientRect().width+12;t.scrollTo({left:t.scrollLeft+w>=t.scrollWidth-4?0:t.scrollLeft+w,behavior:"smooth"})},5500)}
function syncDots(){const t=$("ndTrack");if(!t.firstElementChild)return;const w=t.firstElementChild.getBoundingClientRect().width+12,i=Math.round(t.scrollLeft/w);[...$("ndDots").children].forEach((d,k)=>d.classList.toggle("on",k===i))}
document.addEventListener("click",e=>{const d=e.target.closest("[data-slide]");if(d){const t=$("ndTrack");t.scrollTo({left:t.children[+d.dataset.slide].offsetLeft-t.offsetLeft,behavior:"smooth"})}});

// ── Reviews ───────────────────────────────────────────────────────────────────────
function renderReviews(){const list=A.reviews(currentBranch),s=A.ratingSummary(currentBranch);
  $("revIntro").textContent=s.count?s.avg.toFixed(1)+" ★ from "+s.count+" guest review"+(s.count===1?"":"s")+" at "+branchLabel(currentBranch)+".":"Reviews from guests of "+branchLabel(currentBranch)+". The ones marked “Sample” only show the layout; real reviews replace them.";
  $("revList").innerHTML=list.length?list.slice(0,6).map(r=>'<article class="nd-rev"><div class="st" aria-label="'+r.rating+' out of 5">'+U.stars(r.rating)+'</div><p>'+E(r.text)+'</p><small>'+E(r.name)+(r.verified?' · verified visit':'')+(r.demo?' · Sample':'')+' · '+E(A.fmtDate(r.date))+'</small></article>').join(""):'<p>No reviews yet. Be the first.</p>'}
document.addEventListener("click",e=>{if(e.target.id!=="revWrite")return;const u=A.me();let rating=5;
  const d=U.dialog('<h2>Write a review</h2><p class="nd-sub">About '+E(branchLabel(currentBranch))+'. It appears after the salon approves it.</p><form class="nd-form"><div class="nd-stars" id="starPick" role="radiogroup" aria-label="Rating">'+[1,2,3,4,5].map(n=>'<button type="button" role="radio" data-n="'+n+'" aria-label="'+n+' star'+(n>1?"s":"")+'" aria-checked="'+(n===5)+'">★</button>').join("")+'</div><label>Your name<input name="name" required value="'+E(u?u.name:"")+'"></label><label>Mobile <span class="nd-opt">(to mark your visit as verified)</span><input name="phone" type="tel" value="'+E(u?u.phone:"")+'"></label><label>Your review<textarea name="text" rows="4" maxlength="500" required></textarea></label><p class="nd-err"></p><button class="nd-btn gold" type="submit">Send review</button></form>');
  const paint=()=>d.querySelectorAll("#starPick button").forEach(b=>{const on=+b.dataset.n<=rating;b.classList.toggle("on",on);b.setAttribute("aria-checked",String(+b.dataset.n===rating))});paint();
  d.querySelector("#starPick").addEventListener("click",ev=>{const b=ev.target.closest("button");if(b){rating=+b.dataset.n;paint()}});
  d.querySelector("form").addEventListener("submit",ev=>{ev.preventDefault();const v=Object.fromEntries(new FormData(ev.target)),r=A.addReview({branch:currentBranch,name:v.name,phone:v.phone,text:v.text,rating});if(!r.ok){d.querySelector(".nd-err").textContent=r.msg;return}d.close();U.toast("Thank you! Your review will appear once the salon approves it.")})});

// ── Passes, gift cards, loyalty ──────────────────────────────────────────────────
function renderPlans(){
  $("planGrid").innerHTML=A.plans().map(p=>'<article class="nd-card"><small>'+E(CATEGORY_LABEL[p.category]||p.category)+' · '+p.sessions+' sessions</small><h3>'+E(p.name)+'</h3><p>'+E(p.perks||"")+'</p><div class="nd-priceline"><b>'+money(p.price)+'</b><span>valid '+p.validDays+' days</span></div><button type="button" class="btn small" data-plan="'+E(p.id)+'">Buy this pass ↗</button></article>').join("");
  const u=A.me();
  $("loyaltyCard").innerHTML='<small>Loyalty points</small><h3>Earn on every visit.</h3><p>1 point for every ₹10 you spend at the salon or in the shop. Each point is worth ₹1 off, up to '+A.settings().maxPointsPct+'% of a bill.</p>'+
   (u?'<div class="nd-priceline"><b>'+u.points+' points</b><span>= '+money(u.points*A.settings().pointValue)+'</span></div><p>Your referral code: <b class="nd-code">'+E(u.ref)+'</b>. A friend who joins with it gets '+money(A.settings().referralBonus)+' of points, and so do you.</p>':'<button type="button" class="btn small" data-signin>Sign in to see your points ↗</button>')}
document.addEventListener("click",async e=>{
  if(e.target.closest("[data-signin]")){U.signIn(()=>{refreshAccount();renderPlans()});return}
  const pb=e.target.closest("[data-plan]");if(pb){const p=A.plans().find(x=>x.id===pb.dataset.plan);const u=await U.requireUser("Sign in to buy a pass. It is linked to your mobile number.");refreshAccount();
    if(!u.phone){const ph=await askPhone();if(!ph)return;A.updateMe({phone:ph})}
    const r=await U.pay({amount:p.price,label:p.name+" · "+p.sessions+" sessions"});if(!r)return;const m=A.buyPlan(p.id,{userId:u.id,phone:A.me().phone,name:u.name});
    if(m.ok)U.dialog('<div class="nd-ok">✓</div><h2>Pass added</h2><p class="nd-sub">'+E(p.name)+': '+p.sessions+' sessions, valid until '+E(A.fmtDate(m.membership.expires))+'. When you book, tick “Use my pass”.</p><div class="nd-actions"><a class="nd-btn gold" href="#booking" onclick="this.closest(\'dialog\').close()">Book now</a><a class="nd-btn" href="account.html#passes">My passes</a></div>');return}
  if(e.target.closest("#giftBuy"))giftDialog()});
function askPhone(){return new Promise(res=>{let done=false;const d=U.dialog('<h2>Your mobile number</h2><p class="nd-sub">Passes and reminders are tied to your mobile number.</p><form class="nd-form"><label>Mobile<input name="phone" type="tel" inputmode="tel" required placeholder="10-digit mobile"></label><p class="nd-err"></p><button class="nd-btn gold" type="submit">Continue</button></form>',{onClose:()=>{if(!done)res("")}});
  d.querySelector("form").addEventListener("submit",e=>{e.preventDefault();const p=cleanPhone(e.target.phone.value);if(p.length<10){d.querySelector(".nd-err").textContent="Enter a 10-digit mobile number.";return}done=true;d.close();res(p)})})}
function giftDialog(){const u=A.me();let amt=1000;
  const d=U.dialog('<h2>Send a gift card</h2><p class="nd-sub">A digital card for any service or product. Delivered by WhatsApp and email.</p><form class="nd-form"><div class="nd-chips" id="gAmt">'+[500,1000,2000,5000].map(n=>'<button type="button" data-v="'+n+'" aria-pressed="'+(n===1000)+'">'+money(n)+'</button>').join("")+'</div><label>Other amount (₹100 – ₹20,000)<input name="custom" type="number" min="100" max="20000" step="50" inputmode="numeric"></label><label>For<input name="recipient" placeholder="Friend\'s name"></label><label>Message <span class="nd-opt">(optional)</span><input name="message" maxlength="120" placeholder="Happy birthday!"></label><label>Your name<input name="buyer" required value="'+E(u?u.name:"")+'"></label><label>Your mobile<input name="phone" type="tel" required value="'+E(u?u.phone:"")+'"></label><label>Your email <span class="nd-opt">(optional)</span><input name="email" type="email" value="'+E(u?u.email:"")+'"></label><p class="nd-err"></p><button class="nd-btn gold" type="submit">Continue to payment</button></form>');
  d.querySelector("#gAmt").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;amt=+b.dataset.v;d.querySelector('[name="custom"]').value="";d.querySelectorAll("#gAmt button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)))});
  d.querySelector('[name="custom"]').addEventListener("input",ev=>{if(ev.target.value){amt=+ev.target.value;d.querySelectorAll("#gAmt button").forEach(x=>x.setAttribute("aria-pressed","false"))}});
  d.querySelector("form").addEventListener("submit",async ev=>{ev.preventDefault();const v=Object.fromEntries(new FormData(ev.target));if(!(amt>=100&&amt<=20000)){d.querySelector(".nd-err").textContent="Choose an amount between ₹100 and ₹20,000.";return}
    if(cleanPhone(v.phone).length<10){d.querySelector(".nd-err").textContent="Enter a 10-digit mobile number.";return}
    d.close();const r=await U.pay({amount:amt,label:"Gift card for "+(v.recipient||"a friend")});if(!r)return;
    const g=A.buyGiftCard({amount:amt,buyer:v.buyer,recipient:v.recipient,message:v.message,phone:v.phone,email:v.email});if(!g.ok){U.toast(g.msg);return}
    const share="https://wa.me/?text="+encodeURIComponent("A gift for you from New Duke & Duchess: "+money(amt)+". Code "+g.card.code+". "+(v.message||"")+" Use it when you book or order.");
    U.dialog('<div class="nd-ok">✓</div><h2>Gift card ready</h2><p class="nd-code big">'+E(g.card.code)+'</p><p class="nd-sub">'+money(amt)+(v.recipient?" for "+E(v.recipient):"")+'. We also sent it by WhatsApp. Redeem it at booking or checkout.</p><div class="nd-actions"><a class="nd-btn gold" target="_blank" rel="noopener noreferrer" href="'+share+'">Share on WhatsApp</a></div>')})}

// ── Called by customer.js after every render ───────────────────────────────────────
window.NDDX={bookSubmit,orderSubmit,afterRender(){decorate();refreshAccount();renderCarousel();renderReviews();renderPlans();refreshOrderQuote();if(bk.step===4)refreshQuote()}};
$("ndTrack").addEventListener("scroll",()=>requestAnimationFrame(syncDots),{passive:true});

// ── Deep links from the branch pages: ?branch=rr|nb&svc=haircut ──────────────────
(function(){const q=new URLSearchParams(location.search),b=branchKey[q.get("branch")];decorate();NDDX.afterRender();
  if(b){applyBranch(b);if(q.get("svc"))fillBooking(q.get("svc"));else if(location.hash){const el=document.querySelector(location.hash);if(el)setTimeout(()=>el.scrollIntoView(),150)}}})();
})();
