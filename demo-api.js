/* ─────────────────────────────────────────────────────────────────────────────
   DEMO BACKEND  ·  window.NDD_API

   Everything the real platform will do on a server is done here in the browser
   (localStorage key "ndd-demo-v1"), so the whole site can be clicked through
   today. NOTHING here is secure and nothing leaves the device:
     · "Google sign-in" is a form, the mobile OTP is always 123456,
     · "online payment" is a pretend card/UPI screen — no money moves,
     · email / WhatsApp / SMS are written to a log (Admin → Messages), not sent,
     · admin PINs are in this file.

   TO GO LIVE: keep these method names and signatures, replace each body with a
   call to the real backend (Firebase / Supabase / your API). The pages never
   touch localStorage themselves. Replace, in this order:
     1. auth      → Google Identity Services + OTP provider
     2. bookings  → freeSlot()/createBooking()/cancel…()   (server decides slots)
     3. orders    → createOrder() + payment gateway (Razorpay etc.) via charge()
     4. messaging → notify() → WhatsApp Business / SMS (DLT) / email provider
     5. adminLogin() → real roles (owner, location manager)
   ───────────────────────────────────────────────────────────────────────────── */
(function(){
"use strict";
const KEY="ndd-demo-v1",VER=3;
const BRANCHES=["RR Nagar","Nagarabhavi"];
const ADMIN_PINS={"1234":{role:"owner",branch:null,name:"Owner"},"1111":{role:"manager",branch:"RR Nagar",name:"R R Nagar manager"},"2222":{role:"manager",branch:"Nagarabhavi",name:"Nagarabhavi manager"}};
const DEMO_OTP="123456";
const pad=n=>String(n).padStart(2,"0");
const localDate=d=>SalonData.localDate(d);
const today=()=>localDate();
const addDays=(iso,n)=>{const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return localDate(d)};
const uid=p=>p+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const clean=v=>String(v||"").replace(/\D/g,"").slice(-10);
const rupee=n=>"₹"+Math.round(n).toLocaleString("en-IN");

// ── State ────────────────────────────────────────────────────────────────────
let S=load(),vers=0;
function norm(s){s.content=s.content||{faq:null,photos:{}};s.content.photos=s.content.photos||{};s.catalog=s.catalog||{};s.catalog.artists=s.catalog.artists||{};return s}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));if(v&&v.ver===VER)return norm(v)}catch(e){}const s=norm(seed());try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}return s}
function save(){vers++;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}window.dispatchEvent(new Event("ndd-demo-changed"))}
function seed(){
  const t=localDate();
  const mk=(d,time,svc,name,art,br,price,phone)=>({id:"BK-"+(1000+Math.floor(Math.random()*8999)),userId:null,name,phone:phone||"90000"+(10000+Math.floor(Math.random()*89999)),email:"",branch:br||"RR Nagar",serviceId:svc,artistId:art,date:addDays(t,d),time,dur:60,price,discount:0,gift:0,points:0,total:price,coupon:"",membershipId:"",pay:"salon",paid:false,status:"booked",created:new Date().toISOString(),source:"demo-seed",demo:true});
  const svcDur={haircut:60,facial:60,manicure:45,hairspa:60};
  const bookings=[mk(1,660,"haircut","Demo guest A","sample-hair","RR Nagar",499),mk(1,720,"haircut","Demo guest B","sample-hair","RR Nagar",499),mk(1,960,"hairspa","Demo guest C","sample-hair","RR Nagar",799),
    mk(1,600,"facial","Demo guest D","sample-skin","RR Nagar",1299),mk(2,840,"facial","Demo guest E","sample-skin","RR Nagar",1299),mk(2,600,"manicure","Demo guest F","sample-nails","Nagarabhavi",599),mk(0,1020,"haircut","Demo guest G","sample-hair","Nagarabhavi",499),
    mk(-1,660,"haircut","Demo guest H","sample-hair","RR Nagar",499),mk(-2,780,"facial","Demo guest I","sample-skin","RR Nagar",1299),mk(-3,900,"manicure","Demo guest J","sample-nails","Nagarabhavi",599)];
  bookings.forEach(b=>{b.dur=svcDur[b.serviceId]||60;if(b.date<t){b.status="completed";b.paid=true}});
  return {ver:VER,users:{},session:null,bookings,orders:[],notifications:[],waitlist:[],
    reviews:[
      {id:"RV-1",branch:"RR Nagar",name:"Sample reviewer",rating:5,text:"Sample review: the round LED mirrors and calm treatment room made the facial feel special.",date:addDays(t,-6),status:"approved",demo:true},
      {id:"RV-2",branch:"RR Nagar",name:"Sample reviewer",rating:4,text:"Sample review: easy to book, started on time.",date:addDays(t,-11),status:"approved",demo:true},
      {id:"RV-3",branch:"Nagarabhavi",name:"Sample reviewer",rating:5,text:"Sample review: lovely pedicure lounge and friendly team.",date:addDays(t,-4),status:"approved",demo:true},
      {id:"RV-4",branch:"Nagarabhavi",name:"Sample reviewer",rating:5,text:"Sample review: great haircut, clean tools at every chair.",date:addDays(t,-9),status:"approved",demo:true}],
    coupons:[
      {code:"WELCOME10",type:"percent",value:10,min:0,scope:"both",until:"",max:0,uses:0,active:true,firstOnly:true,note:"10% off your first booking or order"},
      {code:"FLAT100",type:"flat",value:100,min:800,scope:"both",until:"",max:0,uses:0,active:true,note:"₹100 off above ₹800"},
      {code:"GLOW15",type:"percent",value:15,min:0,scope:"booking",until:addDays(t,60),max:100,uses:0,active:true,note:"15% off any booking"}],
    giftcards:[{code:"GC-DEMO-0500",initial:500,balance:500,buyer:"Demo",recipient:"",message:"Demo gift card — try it at checkout",created:t,demo:true}],
    plans:[
      {id:"hair5",name:"Hair care pack",category:"Hair",sessions:5,price:2199,validDays:180,perks:"5 hair services of up to ₹499 each. Save about 12%."},
      {id:"glow4",name:"Glow pass",category:"Skin",sessions:4,price:4399,validDays:180,perks:"4 facials or skin services. Save about 15%."},
      {id:"nails4",name:"Mani-pedi club",category:"Nails",sessions:4,price:2199,validDays:180,perks:"4 manicures or pedicures. Save about 12%."}],
    owned:[],
    banners:[
      {id:"BN-1",title:"Welcome offer",text:"10% off your first visit. Use code WELCOME10.",image:"assets/p-nb-g1.webp",cta:"Book now",link:"#booking",from:"",until:"",order:1,active:true,branches:[]},
      {id:"BN-2",title:"Glow pass",text:"4 facials, one pass. Save about 15%.",image:"assets/p-rr-skin.webp",cta:"See passes",link:"#plans",from:"",until:"",order:2,active:true,branches:[]},
      {id:"BN-3",title:"Gift a salon day",text:"Digital gift cards, sent in seconds.",image:"assets/p-nb-g5.webp",cta:"Gift a card",link:"#plans",from:"",until:"",order:3,active:true,branches:[]}],
    staff:{},catalog:{services:{},products:{},addedServices:[],addedProducts:[]},
    settings:{cancelHours:4,pointsPerHundred:10,pointValue:1,maxPointsPct:20,referralBonus:100,pointsMin:50}};
}

// ── Catalogue overlay (admin edits on top of the sheet / built-in content) ────
let baseCache=null,baseVer=-1;
function applyCatalog(data){
  const c=S.catalog;
  data.services.forEach(s=>{const o=c.services[s.id];if(o)Object.assign(s,o)});
  (c.addedServices||[]).forEach(s=>{if(!data.services.some(x=>x.id===s.id))data.services.push(JSON.parse(JSON.stringify(s)))});
  data.services.forEach(s=>{if(s.amount&&(!s.price||/₹|request/i.test(s.price)))s.price=rupee(s.amount)});
  data.products.forEach(p=>{const o=c.products[p.id];if(o)Object.assign(p,o)});
  (c.addedProducts||[]).forEach(p=>{if(!data.products.some(x=>x.id===p.id))data.products.push(JSON.parse(JSON.stringify(p)))});
  data.products.forEach(p=>{if(p.stock!=null){p.inStock=p.stock>0&&p.inStock!==false}if(p.amount)p.price=rupee(p.amount)});
  (S.staffAdded||[]).forEach(a=>{if(!data.artists.some(x=>x.id===a.id))data.artists.push(JSON.parse(JSON.stringify(a)))});
  data.artists.forEach(a=>{const o=S.catalog.artists&&S.catalog.artists[a.id];if(o)Object.assign(a,o)});
  if(S.content&&S.content.photos)Object.assign(data.photos,S.content.photos);
  return data}
function base(){if(baseCache&&baseVer===vers)return baseCache;baseCache=applyCatalog(SalonData.load());baseVer=vers;return baseCache}
window.addEventListener("salon-data-changed",()=>{baseVer=-1});
const svcById=id=>base().services.find(s=>s.id===id);
const priceOf=(id,branch)=>SalonData.priceFor(svcById(id),branch)||0;

// ── Staff, availability ───────────────────────────────────────────────────────
function staffCfg(id){if(!S.staff[id])S.staff[id]={days:{},leave:[]};return S.staff[id]}
function dayCfg(id,dow){const d=(S.staff[id]&&S.staff[id].days&&S.staff[id].days[dow]);return Object.assign({on:true,start:null,end:null,bs:810,be:870},d||{})}
function onLeave(id,iso){return ((S.staff[id]&&S.staff[id].leave)||[]).some(l=>iso>=l.from&&iso<=l.to)}
function eligible(branch,svcId){return base().artists.filter(a=>a.active!==false&&(!a.branches||!a.branches.length||a.branches.includes(branch))&&(a.capabilities||[]).includes(svcId))}
const busyStatus=b=>b.status==="booked"||b.status==="completed";
function artistFree(a,branch,iso,t,dur,ignoreId){
  const info=SalonData.dayInfo(base(),branch,iso);if(info.closed)return false;
  const dow=new Date(iso+"T12:00:00").getDay(),c=dayCfg(a.id,dow);if(!c.on||onLeave(a.id,iso))return false;
  const open=Math.max(info.open,c.start==null?0:c.start),close=Math.min(info.close,c.end==null?1440:c.end);
  if(t<open||t+dur>close)return false;
  if(c.bs!=null&&c.be!=null&&t<c.be&&t+dur>c.bs)return false;
  return !S.bookings.some(b=>b.id!==ignoreId&&b.artistId===a.id&&b.date===iso&&busyStatus(b)&&t<b.time+b.dur&&t+dur>b.time)}
// Returns the artist id who would take this slot, "walk-in" when the service has no
// scheduled artist (e.g. content from a sheet), or null when the slot is not free.
function freeSlot(branch,svcId,artistId,iso,t,dur,ignoreId){
  const info=SalonData.dayInfo(base(),branch,iso);if(info.closed||t<info.open||t+dur>info.close)return null;
  if(artistId&&artistId!=="any"){const a=base().artists.find(x=>x.id===artistId);return a&&a.active!==false&&(!a.branches||!a.branches.length||a.branches.includes(branch))&&artistFree(a,branch,iso,t,dur,ignoreId)?a.id:null}
  const list=eligible(branch,svcId);if(!list.length)return "walk-in";
  const free=list.filter(a=>artistFree(a,branch,iso,t,dur,ignoreId));if(!free.length)return null;
  const load=a=>S.bookings.filter(b=>b.artistId===a.id&&b.date===iso&&busyStatus(b)).length;
  free.sort((x,y)=>load(x)-load(y));return free[0].id}

// ── Money: coupons, gift cards, points, memberships ───────────────────────────
function user(){return S.session?S.users[S.session]||null:null}
function isFirst(phone,userId){return !S.bookings.concat(S.orders).some(x=>x.status!=="cancelled"&&!x.demo&&((phone&&clean(x.phone)===clean(phone))||(userId&&x.userId===userId)))}
function checkCoupon(code,scope,subtotal,who){
  code=String(code||"").trim().toUpperCase();if(!code)return {ok:false,msg:""};
  const c=S.coupons.find(x=>x.code===code);if(!c||!c.active)return {ok:false,msg:"That code isn't valid."};
  if(c.until&&c.until<today())return {ok:false,msg:"That code has expired."};
  if(c.scope!=="both"&&c.scope!==scope)return {ok:false,msg:"That code works for "+(c.scope==="booking"?"bookings":"store orders")+" only."};
  if(c.max&&c.uses>=c.max)return {ok:false,msg:"That code has been fully used."};
  if(subtotal<c.min)return {ok:false,msg:"Spend "+rupee(c.min)+" or more to use "+code+"."};
  if(c.firstOnly&&!isFirst(who&&who.phone,who&&who.userId))return {ok:false,msg:code+" is for first-time customers."};
  const d=c.type==="percent"?Math.round(subtotal*c.value/100):Math.min(c.value,subtotal);
  return {ok:true,code,discount:d,msg:code+" applied: −"+rupee(d)}}
function giftBalance(code){const g=S.giftcards.find(x=>x.code===String(code||"").trim().toUpperCase());return g?g.balance:null}
function myPoints(u){return u?u.points||0:0}
function membershipFor(who,svc){
  if(!svc)return null;const t=today();
  return S.owned.find(m=>m.remaining>0&&m.expires>=t&&((who.userId&&m.userId===who.userId)||(who.phone&&clean(m.phone)===clean(who.phone)))&&S.plans.find(p=>p.id===m.planId).category===svc.category)||null}
// Price a basket. kind = "booking" | "order". lines are {amount}.
function quote(o){
  const sub=o.subtotal,r={sub,coupon:null,couponDiscount:0,member:0,gift:0,points:0,total:sub,msgs:[]};
  let left=sub;
  if(o.useMembership&&o.membershipId){r.member=sub;left=0}
  if(left>0&&o.coupon){const c=checkCoupon(o.coupon,o.kind,left,{phone:o.phone,userId:o.userId});if(c.ok){r.coupon=c.code;r.couponDiscount=c.discount;left-=c.discount}r.msgs.push(c.msg)}
  if(left>0&&o.points>0){const u=o.userId&&S.users[o.userId];const cap=Math.floor(left*S.settings.maxPointsPct/100/S.settings.pointValue);r.points=Math.max(0,Math.min(o.points,u?u.points:0,cap));left-=r.points*S.settings.pointValue}
  if(left>0&&o.giftCode){const g=S.giftcards.find(x=>x.code===String(o.giftCode).trim().toUpperCase());if(g&&g.balance>0){r.gift=Math.min(g.balance,left);left-=r.gift}else r.msgs.push("Gift card not found or empty.")}
  r.total=Math.max(0,Math.round(left));return r}

// ── Messages (logged, not sent) ───────────────────────────────────────────────
function notify(channel,to,text,extra){if(!to)return;S.notifications.unshift(Object.assign({id:uid("MSG"),at:new Date().toISOString(),channel,to,text},extra||{}));S.notifications=S.notifications.slice(0,300)}
const fmtDate=iso=>new Date(iso+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
const fmtTime=m=>SalonData.clock(m);

// ── Public API ────────────────────────────────────────────────────────────────
const API={
  BRANCHES,DEMO_OTP,rupee,clean,
  // —— catalogue
  applyCatalog:data=>applyCatalog(data),
  catalog:()=>base(),
  setServiceOverride(id,patch){S.catalog.services[id]=Object.assign(S.catalog.services[id]||{},patch);save()},
  setProductOverride(id,patch){S.catalog.products[id]=Object.assign(S.catalog.products[id]||{},patch);save()},
  addService(s){s.id=s.id||("svc-"+uid("x").toLowerCase());S.catalog.addedServices.push(s);save();return s},
  addProduct(p){p.id=p.id||("prd-"+uid("x").toLowerCase());S.catalog.addedProducts.push(p);save();return p},
  addArtist(a){S.staffAdded=S.staffAdded||[];a.id=a.id||("stf-"+uid("x").toLowerCase());S.staffAdded.push(a);save();return a},
  // —— content (stylist profiles, gallery photos, FAQ)
  updateArtist(id,patch){const added=(S.staffAdded||[]).find(x=>x.id===id);if(added)Object.assign(added,patch);else S.catalog.artists[id]=Object.assign(S.catalog.artists[id]||{},patch);save()},
  faq:()=>S.content.faq,
  setFaq(list){S.content.faq=list;save()},
  setPhoto(slot,url){if(url)S.content.photos[slot]=url;else delete S.content.photos[slot];save()},
  photoOverrides:()=>Object.assign({},S.content.photos),
  // —— auth
  me:user,
  signIn({provider,name,email,phone,refCode,otp}){
    if(provider==="phone"){if(otp!==DEMO_OTP)return {ok:false,msg:"Wrong code. In this demo the code is "+DEMO_OTP+"."};if(clean(phone).length<10)return {ok:false,msg:"Enter a 10-digit mobile number."}}
    else if(!/^\S+@\S+\.\S+$/.test(email||""))return {ok:false,msg:"Enter a valid email address."};
    const key=provider==="phone"?"ph:"+clean(phone):"em:"+String(email).toLowerCase();let u=S.users[key],isNew=false;
    if(!u){isNew=true;u=S.users[key]={id:key,provider,name:name||"",email:email||"",phone:clean(phone),points:0,ref:"ND-"+Math.random().toString(36).slice(2,6).toUpperCase(),created:new Date().toISOString()};
      if(refCode){const f=Object.values(S.users).find(x=>x.ref===String(refCode).trim().toUpperCase()&&x.id!==key);if(f){f.points+=S.settings.referralBonus;u.points+=S.settings.referralBonus;u.referredBy=f.id}}}
    else{if(name&&!u.name)u.name=name;if(email&&!u.email)u.email=email;if(phone&&!u.phone)u.phone=clean(phone)}
    S.session=key;save();return {ok:true,user:u,isNew}},
  signOut(){S.session=null;save()},
  // Right to erasure (DPDP): removes the account; past bookings stay for accounting but lose the link.
  deleteMe(){const u=user();if(!u)return;S.bookings.forEach(b=>{if(b.userId===u.id)b.userId=null});S.orders.forEach(o=>{if(o.userId===u.id)o.userId=null});delete S.users[u.id];S.session=null;save()},
  updateMe(p){const u=user();if(u){Object.assign(u,p);if(p.phone)u.phone=clean(p.phone);save()}return u},
  // —— settings
  settings:()=>S.settings,
  setSettings(p){Object.assign(S.settings,p);save()},
  // —— availability + bookings
  freeSlot:(branch,svcId,artistId,iso,t,dur,ignoreId)=>freeSlot(branch,svcId,artistId,iso,t,dur,ignoreId),
  quote,
  checkCoupon,giftBalance,membershipFor,myPoints,
  createBooking(i){
    const svc=svcById(i.serviceId);if(!svc)return {ok:false,msg:"Choose a service."};
    const who=freeSlot(i.branch,svc.id,i.artistId,i.date,i.time,svc.duration);if(!who)return {ok:false,msg:"Sorry, that time was just taken. Please pick another."};
    const u=user(),phone=clean(i.phone),sub=priceOf(svc.id,i.branch);
    const mem=i.useMembership?membershipFor({userId:u&&u.id,phone},svc):null;
    const q=quote({kind:"booking",subtotal:sub,coupon:i.coupon,points:i.points||0,giftCode:i.giftCode,useMembership:!!mem,membershipId:mem&&mem.id,phone,userId:u&&u.id});
    const b={id:"BK-"+(1000+Math.floor(Math.random()*8999)),userId:u?u.id:null,name:i.name,phone,email:i.email||(u&&u.email)||"",branch:i.branch,serviceId:svc.id,serviceName:svc.name,artistId:who,date:i.date,time:i.time,dur:svc.duration,price:sub,discount:q.couponDiscount,gift:q.gift,points:q.points,member:q.member,total:q.total,coupon:q.coupon||"",membershipId:mem?mem.id:"",pay:i.pay||"salon",paid:!!i.paid,payRef:i.payRef||"",notes:i.notes||"",status:"booked",created:new Date().toISOString(),source:i.source||"website"};
    if(q.coupon){const c=S.coupons.find(x=>x.code===q.coupon);if(c)c.uses++}
    if(q.gift){const g=S.giftcards.find(x=>x.code===String(i.giftCode).trim().toUpperCase());g.balance-=q.gift;b.giftCode=g.code}
    if(q.points&&u)u.points-=q.points;
    if(mem)mem.remaining--;
    S.bookings.push(b);
    const a=base().artists.find(x=>x.id===who),where=i.branch,when=fmtDate(b.date)+" at "+fmtTime(b.time);
    const msg="Booked: "+svc.name+" at "+where+", "+when+(a?" with "+a.name:"")+". Ref "+b.id+".";
    if(b.email)notify("email",b.email,"Booking confirmation. "+msg,{ref:b.id});
    notify("whatsapp","+91"+phone,"Hi "+b.name+", "+msg+" Reply CANCEL to cancel.",{ref:b.id});
    notify("sms","+91"+phone,"Reminder (24 h before): "+svc.name+" tomorrow "+fmtTime(b.time)+" at "+where+".",{ref:b.id,scheduled:true,at2:addDays(b.date,-1)});
    notify("staff",where+" team","New booking "+b.id+": "+svc.name+", "+when+", "+b.name+" ("+phone+").",{ref:b.id});
    save();return {ok:true,booking:b}},
  myBookings(){const u=user();if(!u)return [];return S.bookings.filter(b=>b.userId===u.id||(u.phone&&clean(b.phone)===u.phone)).sort((a,b)=>(b.date+pad(b.time)).localeCompare(a.date+pad(a.time)))},
  canChange(b){if(b.status!=="booked")return {ok:false,msg:"This booking is "+b.status+"."};const start=new Date(b.date+"T00:00:00");start.setMinutes(b.time);const hrs=(start-new Date())/36e5;
    if(hrs<S.settings.cancelHours)return {ok:false,msg:hrs<0?"This visit has passed.":"Changes close "+S.settings.cancelHours+" hours before the visit. Please call the salon."};return {ok:true}},
  cancelBooking(id,byAdmin){const b=S.bookings.find(x=>x.id===id);if(!b)return {ok:false,msg:"Not found."};
    if(!byAdmin){const c=API.canChange(b);if(!c.ok)return c}else if(b.status!=="booked")return {ok:false,msg:"Already "+b.status+"."};
    b.status="cancelled";b.cancelledAt=new Date().toISOString();
    if(b.giftCode){const g=S.giftcards.find(x=>x.code===b.giftCode);if(g)g.balance+=b.gift}
    if(b.points&&b.userId&&S.users[b.userId])S.users[b.userId].points+=b.points;
    if(b.membershipId){const m=S.owned.find(x=>x.id===b.membershipId);if(m)m.remaining++}
    if(b.coupon){const c=S.coupons.find(x=>x.code===b.coupon);if(c&&c.uses>0)c.uses--}
    notify("whatsapp","+91"+b.phone,"Your booking "+b.id+" ("+fmtDate(b.date)+", "+fmtTime(b.time)+") is cancelled."+(b.paid&&b.total?" Refund of "+rupee(b.total)+" will reach you in 5–7 days (demo).":""),{ref:b.id});
    S.waitlist.filter(w=>!w.notified&&w.branch===b.branch&&w.date===b.date).forEach(w=>{w.notified=true;notify("whatsapp","+91"+w.phone,"Good news "+w.name+": a slot opened on "+fmtDate(b.date)+" at "+b.branch+". Book now before it goes.",{ref:w.id})});
    save();return {ok:true}},
  rescheduleBooking(id,date,time,artistId){const b=S.bookings.find(x=>x.id===id);if(!b)return {ok:false,msg:"Not found."};const c=API.canChange(b);if(!c.ok)return c;
    const who=freeSlot(b.branch,b.serviceId,artistId||"any",date,time,b.dur,b.id);if(!who)return {ok:false,msg:"That time isn't free. Pick another."};
    b.date=date;b.time=time;b.artistId=who;b.rescheduled=(b.rescheduled||0)+1;
    notify("whatsapp","+91"+b.phone,"Rescheduled: "+(b.serviceName||b.serviceId)+" now "+fmtDate(date)+" at "+fmtTime(time)+" ("+b.branch+"). Ref "+b.id+".",{ref:b.id});save();return {ok:true,booking:b}},
  setBookingStatus(id,status){const b=S.bookings.find(x=>x.id===id);if(!b)return;const was=b.status;b.status=status;
    if(status==="completed"&&was!=="completed"){b.paid=true;const earn=Math.floor(b.total*S.settings.pointsPerHundred/100);const u=b.userId?S.users[b.userId]:Object.values(S.users).find(x=>x.phone&&x.phone===clean(b.phone));if(u&&earn){u.points+=earn;b.earned=earn;notify("whatsapp","+91"+b.phone,"Thanks for visiting! You earned "+earn+" loyalty points. Balance: "+u.points+".",{ref:b.id})}
      notify("whatsapp","+91"+b.phone,"How was your visit? Rate us on the website: "+location.origin+"/#reviews",{ref:b.id})}
    save()},
  addManualBooking(i){return API.createBooking(Object.assign({source:i.source||"admin"},i))},
  allBookings:()=>S.bookings.slice().sort((a,b)=>(a.date+pad(a.time)).localeCompare(b.date+pad(b.time))),
  joinWaitlist(w){const x=Object.assign({id:uid("WL"),created:new Date().toISOString()},w);S.waitlist.push(x);notify("staff",w.branch+" team","Waitlist: "+w.name+" ("+w.phone+") wants "+w.serviceName+" on "+fmtDate(w.date)+".",{ref:x.id});save();return x},
  waitlist:()=>S.waitlist.slice(),
  ics(b){const a=b.date.replace(/-/g,""),st=b.time,en=b.time+b.dur,f=m=>pad(Math.floor(m/60))+pad(m%60)+"00";
    return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//New Duke & Duchess//Booking//EN","BEGIN:VEVENT","UID:"+b.id+"@newdukeandduchess","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z","DTSTART:"+a+"T"+f(st),"DTEND:"+a+"T"+f(en),"SUMMARY:"+(b.serviceName||"Salon visit")+" · New Duke & Duchess","LOCATION:New Duke & Duchess, "+b.branch+", Bengaluru","DESCRIPTION:Booking "+b.id,"BEGIN:VALARM","TRIGGER:-PT2H","ACTION:DISPLAY","DESCRIPTION:Salon visit in 2 hours","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n")},
  // —— staff calendars
  staff:()=>base().artists,
  staffDay:(id,dow)=>dayCfg(id,dow),
  setStaffDay(id,dow,patch){const c=staffCfg(id);c.days[dow]=Object.assign(dayCfg(id,dow),patch);save()},
  leaves:id=>((S.staff[id]&&S.staff[id].leave)||[]).slice(),
  addLeave(id,from,to,reason){staffCfg(id).leave.push({from,to:to||from,reason:reason||"Leave"});save()},
  removeLeave(id,i){staffCfg(id).leave.splice(i,1);save()},
  // —— orders
  stockOf(p){return p.stock==null?null:p.stock},
  createOrder(i){
    const lines=[];let sub=0;
    for(const l of i.lines){const p=base().products.find(x=>x.id===l.id);if(!p)continue;if(p.inStock===false||(p.stock!=null&&p.stock<l.qty))return {ok:false,msg:p.name+" is out of stock or has fewer than "+l.qty+" left."};
      lines.push({id:p.id,name:p.name,qty:l.qty,price:p.amount||0});sub+=(p.amount||0)*l.qty}
    if(!lines.length)return {ok:false,msg:"Your bag is empty."};
    const u=user(),phone=clean(i.phone);
    const q=quote({kind:"order",subtotal:sub,coupon:i.coupon,points:i.points||0,giftCode:i.giftCode,phone,userId:u&&u.id});
    lines.forEach(l=>{const p=base().products.find(x=>x.id===l.id);if(p.stock!=null){S.catalog.products[p.id]=Object.assign(S.catalog.products[p.id]||{},{stock:p.stock-l.qty})}});
    const o={id:"OR-"+(2000+Math.floor(Math.random()*7999)),userId:u?u.id:null,name:i.name,phone,email:i.email||(u&&u.email)||"",branch:i.branch,lines,subtotal:sub,discount:q.couponDiscount,gift:q.gift,points:q.points,total:q.total,coupon:q.coupon||"",pay:i.pay||"salon",paid:!!i.paid,payRef:i.payRef||"",status:"new",created:new Date().toISOString()};
    if(q.coupon){const c=S.coupons.find(x=>x.code===q.coupon);if(c)c.uses++}
    if(q.gift){const g=S.giftcards.find(x=>x.code===String(i.giftCode).trim().toUpperCase());g.balance-=q.gift;o.giftCode=g.code}
    if(q.points&&u)u.points-=q.points;
    S.orders.push(o);
    const txt="Order "+o.id+": "+lines.map(l=>l.qty+"× "+l.name).join(", ")+". Total "+rupee(o.total)+(o.paid?" (paid online)":" (pay at the salon)")+". Collect from "+o.branch+".";
    if(o.email)notify("email",o.email,"Order confirmation. "+txt,{ref:o.id});
    notify("whatsapp","+91"+phone,txt,{ref:o.id});notify("staff",o.branch+" team","New order "+o.id+" — "+o.name+" ("+phone+"). "+txt,{ref:o.id});
    save();return {ok:true,order:o}},
  myOrders(){const u=user();if(!u)return [];return S.orders.filter(o=>o.userId===u.id||(u.phone&&clean(o.phone)===u.phone)).slice().reverse()},
  allOrders:()=>S.orders.slice().reverse(),
  setOrderStatus(id,status){const o=S.orders.find(x=>x.id===id);if(!o)return;const was=o.status;o.status=status;
    if(status==="cancelled"&&was!=="cancelled"){o.lines.forEach(l=>{const p=base().products.find(x=>x.id===l.id);if(p&&p.stock!=null)S.catalog.products[p.id]=Object.assign(S.catalog.products[p.id]||{},{stock:p.stock+l.qty})})}
    if(status==="collected"&&was!=="collected"){o.paid=true;const u=o.userId?S.users[o.userId]:null;const earn=Math.floor(o.total*S.settings.pointsPerHundred/100);if(u&&earn){u.points+=earn;o.earned=earn}}
    if(status==="ready")notify("whatsapp","+91"+o.phone,"Your order "+o.id+" is ready for pickup at "+o.branch+".",{ref:o.id});
    save()},
  // —— pretend payment gateway (async on purpose: the real one is)
  charge(method,amount){return new Promise(res=>setTimeout(()=>res({ok:true,ref:"DEMO-"+Math.random().toString(36).slice(2,10).toUpperCase(),method,amount}),900))},
  // —— coupons
  coupons:()=>S.coupons.slice(),
  saveCoupon(c){c.code=String(c.code).trim().toUpperCase();const i=S.coupons.findIndex(x=>x.code===c.code);if(i>=0)Object.assign(S.coupons[i],c);else S.coupons.push(Object.assign({uses:0,active:true,scope:"both",min:0,max:0,until:""},c));save()},
  deleteCoupon(code){S.coupons=S.coupons.filter(x=>x.code!==code);save()},
  // —— gift cards
  giftcards:()=>S.giftcards.slice(),
  buyGiftCard({amount,buyer,recipient,message,phone,email}){amount=Math.round(+amount);if(!(amount>=100&&amount<=20000))return {ok:false,msg:"Choose an amount between ₹100 and ₹20,000."};
    const code="GC-"+Math.random().toString(36).slice(2,6).toUpperCase()+"-"+String(amount).padStart(4,"0");
    const g={code,initial:amount,balance:amount,buyer,recipient,message,created:today()};S.giftcards.push(g);
    notify("whatsapp","+91"+clean(phone||""),"Your gift card "+code+" worth "+rupee(amount)+" is ready. Share this code with "+(recipient||"your friend")+". Redeem at booking or checkout.",{ref:code});
    if(email)notify("email",email,"Gift card "+code+" · "+rupee(amount)+". "+(message||""),{ref:code});save();return {ok:true,card:g}},
  // —— memberships
  plans:()=>S.plans.slice(),
  savePlan(p){const i=S.plans.findIndex(x=>x.id===p.id);if(i>=0)Object.assign(S.plans[i],p);else S.plans.push(Object.assign({id:"plan-"+uid("x").toLowerCase(),validDays:180},p));save()},
  deletePlan(id){S.plans=S.plans.filter(x=>x.id!==id);save()},
  buyPlan(planId,who){const p=S.plans.find(x=>x.id===planId);if(!p)return {ok:false,msg:"Plan not found."};const m={id:uid("MB"),planId,userId:who.userId||null,phone:clean(who.phone),name:who.name,remaining:p.sessions,expires:addDays(today(),p.validDays),bought:today(),price:p.price};S.owned.push(m);
    notify("whatsapp","+91"+clean(who.phone),"Welcome to "+p.name+": "+p.sessions+" sessions, valid till "+fmtDate(m.expires)+". Pick “Use my pass” when you book.",{ref:m.id});save();return {ok:true,membership:m}},
  myMemberships(){const u=user();if(!u)return [];return S.owned.filter(m=>m.userId===u.id||(u.phone&&clean(m.phone)===u.phone))},
  allMemberships:()=>S.owned.slice(),
  // —— reviews
  reviews(branch,all){return S.reviews.filter(r=>(all||r.status==="approved")&&(!branch||r.branch===branch)).sort((a,b)=>b.date.localeCompare(a.date))},
  addReview(r){if(!(r.rating>=1&&r.rating<=5)||!String(r.text||"").trim())return {ok:false,msg:"Add a star rating and a few words."};
    const done=S.bookings.some(b=>b.status==="completed"&&clean(b.phone)===clean(r.phone)&&b.branch===r.branch);
    S.reviews.push({id:uid("RV"),branch:r.branch,name:r.name||"Guest",rating:+r.rating,text:String(r.text).trim().slice(0,500),date:today(),status:"pending",verified:done});
    notify("staff",r.branch+" team","New review awaiting approval from "+(r.name||"Guest")+" ("+r.rating+"★).");save();return {ok:true}},
  setReviewStatus(id,status){const r=S.reviews.find(x=>x.id===id);if(r){r.status=status;save()}},
  deleteReview(id){S.reviews=S.reviews.filter(x=>x.id!==id);save()},
  ratingSummary(branch){const l=API.reviews(branch).filter(r=>!r.demo);return {count:l.length,avg:l.length?l.reduce((n,r)=>n+r.rating,0)/l.length:0}},
  // —— banners
  banners(branch,all){const t=today();return S.banners.filter(b=>all||(b.active&&(!b.from||b.from<=t)&&(!b.until||b.until>=t)&&(!b.branches.length||!branch||b.branches.includes(branch)))).sort((a,b)=>a.order-b.order)},
  saveBanner(b){const i=S.banners.findIndex(x=>x.id===b.id);if(i>=0)Object.assign(S.banners[i],b);else S.banners.push(Object.assign({id:uid("BN"),order:S.banners.length+1,active:true,branches:[],from:"",until:"",cta:"Learn more",link:"#booking",image:""},b));save()},
  deleteBanner(id){S.banners=S.banners.filter(x=>x.id!==id);save()},
  moveBanner(id,dir){const l=S.banners.slice().sort((a,b)=>a.order-b.order),i=l.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=l.length)return;[l[i].order,l[j].order]=[l[j].order,l[i].order];save()},
  // —— messages, customers, reports
  messages:()=>S.notifications.slice(),
  customers(branch){const m=new Map();const add=(x,kind)=>{const k=clean(x.phone);if(!k)return;let c=m.get(k);if(!c){c={phone:k,name:x.name,email:x.email||"",bookings:0,orders:0,spent:0,last:"",branches:new Set()};m.set(k,c)}
      c.name=c.name||x.name;c.email=c.email||x.email||"";if(kind==="b")c.bookings++;else c.orders++;if(x.status!=="cancelled"&&(x.paid||x.status==="completed"||x.status==="collected"))c.spent+=x.total||0;const d=(x.date||x.created||"").slice(0,10);if(d>c.last)c.last=d;c.branches.add(x.branch)};
    S.bookings.filter(b=>!b.demo&&(!branch||b.branch===branch)).forEach(b=>add(b,"b"));S.orders.filter(o=>!branch||o.branch===branch).forEach(o=>add(o,"o"));
    Object.values(S.users).forEach(u=>{if(u.phone&&!m.has(u.phone)&&!branch)m.set(u.phone,{phone:u.phone,name:u.name,email:u.email,bookings:0,orders:0,spent:0,last:u.created.slice(0,10),branches:new Set()});const c=m.get(u.phone);if(c)c.points=u.points});
    return [...m.values()].map(c=>Object.assign(c,{branches:[...c.branches].join(" · ")})).sort((a,b)=>b.last.localeCompare(a.last))},
  report(branch,from,to){
    const inR=d=>d>=from&&d<=to,ok=b=>(!branch||b.branch===branch);
    const bs=S.bookings.filter(b=>ok(b)&&inR(b.date)),os=S.orders.filter(o=>ok(o)&&inR(o.created.slice(0,10)));
    const rev=bs.filter(b=>b.status==="completed").reduce((n,b)=>n+b.total,0),orev=os.filter(o=>o.status!=="cancelled").reduce((n,o)=>n+o.total,0);
    const svc={},prd={};bs.filter(b=>b.status!=="cancelled").forEach(b=>{const n=b.serviceName||(svcById(b.serviceId)||{}).name||b.serviceId;svc[n]=svc[n]||{n:0,rev:0};svc[n].n++;svc[n].rev+=b.total});
    os.filter(o=>o.status!=="cancelled").forEach(o=>o.lines.forEach(l=>{prd[l.name]=prd[l.name]||{n:0,rev:0};prd[l.name].n+=l.qty;prd[l.name].rev+=l.qty*l.price}));
    const days={};for(let d=from;d<=to;d=addDays(d,1))days[d]=0;bs.filter(b=>b.status!=="cancelled").forEach(b=>{days[b.date]++});
    // Stylist utilisation: booked minutes ÷ working minutes in the range
    const util=base().artists.filter(a=>a.active!==false).map(a=>{let work=0,booked=0;
      (a.branches&&a.branches.length?a.branches:BRANCHES).forEach(br=>{if(branch&&br!==branch)return;});
      for(let d=from;d<=to&&d<=addDays(from,92);d=addDays(d,1)){const dow=new Date(d+"T12:00:00").getDay(),c=dayCfg(a.id,dow);if(!c.on||onLeave(a.id,d))continue;
        const brs=(a.branches&&a.branches.length?a.branches:BRANCHES).filter(br=>!branch||br===branch);let best=0;brs.forEach(br=>{const i=SalonData.dayInfo(base(),br,d);if(i.closed)return;const o=Math.max(i.open,c.start==null?0:c.start),cl=Math.min(i.close,c.end==null?1440:c.end);best=Math.max(best,Math.max(0,cl-o-((c.bs!=null&&c.be!=null)?(c.be-c.bs):0)))});work+=best}
      S.bookings.filter(b=>b.artistId===a.id&&ok(b)&&inR(b.date)&&busyStatus(b)).forEach(b=>booked+=b.dur);
      return {id:a.id,name:a.name,work,booked,pct:work?Math.round(booked/work*100):0}});
    return {bookings:bs.length,completed:bs.filter(b=>b.status==="completed").length,cancelled:bs.filter(b=>b.status==="cancelled").length,noshow:bs.filter(b=>b.status==="noshow").length,upcoming:bs.filter(b=>b.status==="booked").length,
      serviceRevenue:rev,orderRevenue:orev,orders:os.length,svc,prd,days,util,newCustomers:API.customers(branch).filter(c=>c.last>=from&&c.last<=to).length}},
  // —— admin access
  adminLogin(pin){return ADMIN_PINS[String(pin).trim()]||null},
  // —— housekeeping
  reset(){try{localStorage.removeItem(KEY)}catch(e){}S=seed();vers++;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}window.dispatchEvent(new Event("ndd-demo-changed"))},
  today,addDays,fmtDate,fmtTime
};
window.addEventListener("storage",e=>{if(e.key===KEY){S=load();vers++;window.dispatchEvent(new Event("ndd-demo-changed"))}});
window.NDD_API=API;
})();
