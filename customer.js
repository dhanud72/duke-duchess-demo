const $=id=>document.getElementById(id);
const H=SalonData.escapeHTML,money=SalonData.money,clock=SalonData.clock,localDate=SalonData.localDate;
let data=SalonData.load();
const BRANCHES={
 "RR Nagar":{key:"rr",label:"R R Nagar",name:"Rajarajeshwari Nagar",eyebrow:"Inside Rajarajeshwari Nagar",title:"Our Rajarajeshwari Nagar studio.",intro:"Round LED mirrors, black styling chairs and a green skin-care suite on Krishna Garden Main Rd. Every photo here is the real salon.",gallery:[["01 / Styling floor","Black styling chairs and round LED mirrors"],["02 / Stone-wall studio","Styling stations beside a stone-effect wall"],["03 / Treatment room","Green treatment room with a facial chair"],["04 / Styling corner","Styling chairs in the glass-walled corner"],["05 / Find us","New Duke and Duchess shopfront with the red sign"]]},
 "Nagarabhavi":{key:"nb",label:"Nagarabhavi",name:"Nagarabhavi",eyebrow:"Inside Nagarabhavi",title:"Our Nagarabhavi studio.",intro:"Gold-framed mirrors, quiet treatment rooms and a pedicure lounge on Muddenapalya Main Rd. Every photo here is the real salon.",gallery:[["01 / Reception","Reception desk with the Duke and Duchess wall mural"],["02 / Styling floor","Styling chairs and gold-framed mirrors"],["03 / Care shelf","Product shelving beside the studio mural"],["04 / Treatment room","Private treatment room"],["05 / Pedicure lounge","Pedicure and manicure lounge"]]}};
const CATEGORY_LABEL={Hair:"Hair",Skin:"Skin",Nails:"Nails",More:"Bridal & makeup"};
const BRANCH_KEY="ndd-branch",BAG_KEY="ndd-bag",ME_KEY="ndd-customer";
let currentBranch="RR Nagar";
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let bag=store.get(BAG_KEY,{});

// ── Which items show at the current branch ────────────────────────────────
const here=(x,b)=>x.active!==false&&(!x.branches||!x.branches.length||x.branches.includes(b||currentBranch));
const services=b=>data.services.filter(s=>here(s,b));
const team=()=>data.artists.filter(a=>here(a));
const products=()=>data.products.filter(p=>here(p));
function validOffers(){const today=localDate();return data.offers.filter(o=>here(o)&&(!o.validUntil||o.validUntil>=today))}
const branchLabel=b=>BRANCHES[b].label;
const waNumber=b=>data.settings.whatsapp[b||currentBranch];
const phoneOf=b=>data.settings.phone[b||currentBranch];
function openWhatsApp(url){const w=window.open(url,"_blank");if(!w)location.href=url}
const waLink=(b,text)=>"https://wa.me/"+waNumber(b)+"?text="+encodeURIComponent(text);
const prettyDate=iso=>new Date(iso+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
const addDays=(iso,n)=>{const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return localDate(d)};
const nowMinutes=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const cleanPhone=v=>{const d=v.replace(/\D/g,"");return d.length>=10?d.slice(-10):""};
const avatar=a=>a.photo?'<img src="'+H(a.photo)+'" alt="">':H(a.name.charAt(0));

// ── Branch page: photos, gallery, team heading ────────────────────────────
function renderBranchPage(){const b=BRANCHES[currentBranch],k=b.key;$("heroImage").src=data.photos[k+"Hero"]||"";$("heroImage").alt="Inside New Duke and Duchess, "+b.name;$("heroTag").textContent=b.name.toUpperCase()+" STUDIO";$("galleryEyebrow").textContent=b.eyebrow;$("galleryTitle").textContent=b.title;$("galleryIntro").textContent=b.intro;$("galleryGrid").innerHTML=b.gallery.map(([cap,alt],i)=>{const src=data.photos[k+"G"+(i+1)];return src?'<figure'+(i?'':' class="large"')+'><img loading="lazy" src="'+H(src)+'" alt="'+H(alt)+'"><figcaption>'+H(cap.toUpperCase())+'</figcaption></figure>':""}).join("");$("teamTitle").textContent="The "+b.name+" team.";for(const [key,selector] of Object.entries({Hair:".service.one",Skin:".service.two",Nails:".service.three",More:".service.four"})){const src=data.photos[k+key];document.querySelector(selector).style.backgroundImage=src?'url("'+src.replace(/"/g,"%22")+'")':"none"}
  const bg=data.photos[k+"Hero"];$("booking").style.setProperty("--bookbg",bg?'url("'+bg.replace(/"/g,"%22")+'")':"none");
  document.querySelectorAll("[data-bg]").forEach(s=>{const src=data.photos[k+s.dataset.bg];s.style.setProperty("--secbg",src?'url("'+src.replace(/"/g,"%22")+'")':"none")})}

// ── Opening hours and live status ──────────────────────────────────────────
function weekSummary(b){const days=data.hours[b]||[],fmt=h=>h?clock(h.open)+"–"+clock(h.close):"Closed",names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  if(days.every(h=>fmt(h)===fmt(days[1])))return "Open "+fmt(days[1])+", every day.";
  const order=[1,2,3,4,5,6,0],groups=[];order.forEach(i=>{const t=fmt(days[i]),g=groups[groups.length-1];if(g&&g.t===t)g.to=i;else groups.push({from:i,to:i,t})});
  return groups.map(g=>names[g.from]+(g.to!==g.from?"–"+names[g.to]:"")+" "+g.t).join(" · ")}
function statusLine(b){const today=localDate(),info=SalonData.dayInfo(data,b,today),now=nowMinutes();
  if(!info.closed&&now>=info.open&&now<info.close)return {open:true,text:"Open now · closes "+clock(info.close)+(info.note?" ("+info.note+")":"")};
  if(!info.closed&&now<info.open)return {open:false,text:"Opens today at "+clock(info.open)+(info.note?" ("+info.note+")":"")};
  for(let i=1;i<=14;i++){const d=addDays(today,i),n=SalonData.dayInfo(data,b,d);if(!n.closed)return {open:false,text:(info.closed&&info.note?"Closed today ("+info.note+") · ":"Closed now · ")+"opens "+(i===1?"tomorrow":prettyDate(d))+" at "+clock(n.open)}}
  return {open:false,text:"Closed"}}
function renderHours(){for(const [b,id] of [["RR Nagar","rr"],["Nagarabhavi","nb"]]){$(id+"Hours").textContent=weekSummary(b);const s=statusLine(b),el=$(id+"Status");el.textContent=s.text;el.classList.toggle("isopen",s.open);$(id+"Whatsapp").href=waLink(b,"Hello New Duke & Duchess ("+branchLabel(b)+"), ")}
  const mine=statusLine(currentBranch);$("bookStatus").textContent=branchLabel(currentBranch)+" · "+mine.text;$("bookStatus").classList.toggle("isopen",mine.open);
  const up=[...new Set(data.holidays.filter(h=>h.to>=localDate()&&h.from<=addDays(localDate(),21)).map(h=>(h.branches.length===1?branchLabel(h.branches[0])+": ":"")+(h.hours?"special hours "+clock(h.hours.open)+"–"+clock(h.hours.close):"closed")+" "+(h.from===h.to?prettyDate(h.from):prettyDate(h.from)+" – "+prettyDate(h.to))+" ("+h.reason+")"))];
  $("holidayNote").hidden=!up.length;$("holidayNote").textContent=up.length?"Coming up: "+up.join(" · "):""}
function renderAnnouncement(){const s=data.settings,show=s.announcement&&(!s.announcementUntil||s.announcementUntil>=localDate());let hidden=false;try{hidden=sessionStorage.getItem("ndd-announce")===s.announcement}catch(e){}
  $("announce").hidden=!show||hidden;$("announceText").textContent=show?s.announcement:""}

// ── Booking: service → day → time → you ───────────────────────────────────
const bk={step:1,cat:"All",svc:null,artist:"any",date:null,time:null};
const svcOf=()=>data.services.find(s=>s.id===bk.svc);
const canDo=(a,id)=>(a.capabilities||[]).includes(id);
function slotsFor(iso){if(iso<localDate()||iso>addDays(localDate(),data.settings.daysAhead))return {info:{outOfRange:true},slots:[]};const info=SalonData.dayInfo(data,currentBranch,iso);if(info.closed)return {info,slots:[]};
  const svc=svcOf(),dur=svc?svc.duration:data.settings.slot,step=data.settings.slot;
  let start=info.open;if(iso===localDate()){const earliest=nowMinutes()+data.settings.notice;while(start<earliest)start+=step}
  const slots=[];for(let t=start;t+dur<=info.close;t+=step)slots.push(t);return {info,slots}}
function stepValid(n){if(n===1)return !!svcOf();if(n===2)return !!bk.date&&slotsFor(bk.date).slots.length>0;if(n===3)return bk.time!=null&&slotsFor(bk.date).slots.includes(bk.time);if(n===4)return !!$("name").value.trim()&&!!cleanPhone($("phone").value);return false}
const reachable=n=>{for(let i=1;i<n;i++)if(!stepValid(i))return false;return true};
// Drop choices that no longer fit after a branch, service or data change.
function tidyBooking(){if(bk.svc&&!services().some(s=>s.id===bk.svc))bk.svc=null;
  if(bk.artist!=="any"&&!(bk.svc&&team().some(a=>a.id===bk.artist&&canDo(a,bk.svc))))bk.artist="any";
  if(bk.date&&!slotsFor(bk.date).slots.length)bk.date=null;if(bk.time!=null&&(!bk.date||!slotsFor(bk.date).slots.includes(bk.time)))bk.time=null;
  while(bk.step>1&&!reachable(bk.step))bk.step--}
function renderStep1(){const list=services(),cats=["All",...["Hair","Skin","Nails","More"].filter(c=>list.some(s=>s.category===c))];if(!cats.includes(bk.cat))bk.cat="All";
  $("catChips").innerHTML=cats.map(c=>'<button type="button" role="tab" data-cat="'+c+'" aria-selected="'+(c===bk.cat)+'">'+H(c==="All"?"All":CATEGORY_LABEL[c])+'</button>').join("");
  const shown=list.filter(s=>bk.cat==="All"||s.category===bk.cat);
  $("svcGrid").innerHTML=shown.length?shown.map(s=>'<button type="button" class="svccard'+(s.id===bk.svc?" sel":"")+'" data-svc="'+H(s.id)+'" aria-pressed="'+(s.id===bk.svc)+'"><b>'+H(s.name)+'</b><span>'+H(s.duration)+' min · '+H(s.price||"Price on request")+'</span></button>').join(""):'<p class="wizhint">No services in this category at '+H(branchLabel(currentBranch))+'.</p>';
  const pros=bk.svc?team().filter(a=>canDo(a,bk.svc)):[];$("prosBox").hidden=!bk.svc;
  $("prosRow").innerHTML='<button type="button" class="pro'+(bk.artist==="any"?" sel":"")+'" data-pro="any"><i>✦</i>Any available</button>'+pros.map(a=>'<button type="button" class="pro'+(bk.artist===a.id?" sel":"")+'" data-pro="'+H(a.id)+'"><i>'+avatar(a)+'</i>'+H(a.name.split(" ")[0])+'</button>').join("")}
function renderStep2(){const today=localDate(),days=Math.min(data.settings.daysAhead,30),closed=[];let html="";
  for(let i=0;i<=days;i++){const d=addDays(today,i),{info,slots}=slotsFor(d),dt=new Date(d+"T12:00:00"),off=!slots.length;
    if(off&&info.closed&&info.note&&info.note!=="Weekly holiday")closed.push(prettyDate(d)+" ("+info.note+")");
    html+='<button type="button" class="daybtn'+(d===bk.date?" sel":"")+'" data-day="'+d+'"'+(off?' disabled title="'+H(info.closed?(info.note||"Closed"):"No times left")+'"':"")+'><small>'+(i===0?"Today":i===1?"Tmrw":dt.toLocaleDateString("en-IN",{weekday:"short"}))+'</small><b>'+dt.getDate()+'</b><small>'+dt.toLocaleDateString("en-IN",{month:"short"})+'</small>'+(off?'<i>'+(info.closed?"Closed":"Full")+'</i>':"")+'</button>'}
  $("dayStrip").innerHTML=html;$("dayLabel").textContent="Choose a day at "+branchLabel(currentBranch);
  $("dayHint").textContent=closed.length?"Closed: "+closed.slice(0,4).join(" · "):"Swipe for more days. Greyed-out days are closed or full."}
function renderStep3(){const {info,slots}=slotsFor(bk.date),groups=[["Morning",0,720],["Afternoon",720,1020],["Evening",1020,1440]];
  $("timeLabel").textContent="Free times on "+prettyDate(bk.date)+(info.note?" · special hours ("+info.note+")":"");
  $("slotGroups").innerHTML=groups.map(([name,from,to])=>{const g=slots.filter(t=>t>=from&&t<to);return g.length?'<div class="slotgroup"><h4>'+name+'</h4><div class="slots">'+g.map(t=>'<button type="button" data-time="'+t+'"'+(t===bk.time?' class="sel"':"")+'>'+clock(t)+'</button>').join("")+'</div></div>':""}).join("")}
function renderSummary(){const svc=svcOf(),who=bk.artist!=="any"?team().find(a=>a.id===bk.artist):null,bits=[];
  if(svc)bits.push(svc.name+" ("+svc.duration+" min)");if(who)bits.push("with "+who.name);if(bk.date)bits.push(prettyDate(bk.date));if(bk.time!=null)bits.push(clock(bk.time));if(bits.length)bits.push(branchLabel(currentBranch));
  $("bookingSummary").textContent=bits.join(" · ")}
function renderWizard(){tidyBooking();$("wizBranch").textContent=branchLabel(currentBranch);
  [...$("wizSteps").querySelectorAll("button")].forEach(b=>{const n=+b.dataset.step;b.classList.toggle("current",n===bk.step);b.classList.toggle("done",n<bk.step||(n!==bk.step&&stepValid(n)&&reachable(n)));b.disabled=!reachable(n);b.setAttribute("aria-current",n===bk.step?"step":"false")});
  document.querySelectorAll(".wizview").forEach(v=>v.hidden=+v.dataset.view!==bk.step);
  if(bk.step===1)renderStep1();if(bk.step===2)renderStep2();if(bk.step===3)renderStep3();
  $("wizBack").hidden=bk.step===1;$("wizNext").hidden=bk.step===4;$("wizSubmit").hidden=bk.step!==4;$("wizNext").disabled=!stepValid(bk.step);
  $("dayNote").hidden=true;$("formError").textContent="";renderSummary()}
function goStep(n){if(n<1||n>4||!reachable(n))return;bk.step=n;renderWizard();const v=document.querySelector('.wizview[data-view="'+n+'"]');const f=v&&v.querySelector("button.sel,button:not([disabled]),input");if(f)f.focus({preventScroll:true})}
function goToBooking(){$("booking").scrollIntoView({behavior:"smooth"});history.replaceState(null,"","#booking")}
function fillBooking(serviceId,artistId){const s=data.services.find(x=>x.id===serviceId);if(!s)return;bk.svc=s.id;bk.cat=s.category;bk.artist=artistId||"any";bk.time=null;renderWizard();goStep(bk.date&&stepValid(2)?3:2);goToBooking()}
function bookingMessage(){const svc=svcOf(),who=bk.artist!=="any"?team().find(a=>a.id===bk.artist):null,notes=$("notes").value.trim();
  return ["Hello New Duke & Duchess ("+branchLabel(currentBranch)+"), I'd like to book an appointment:","",
    "• Service: "+svc.name+" ("+svc.duration+" min)","• Specialist: "+(who?who.name:"Any available"),
    "• Date: "+new Date(bk.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),"• Time: "+clock(bk.time),
    "• Name: "+$("name").value.trim(),"• Mobile: "+cleanPhone($("phone").value)].concat(notes?["• Notes: "+notes]:[]).concat(["","Please confirm my slot. Thank you!"]).join("\n")}

// ── Services, team, offers ────────────────────────────────────────────────
function renderServiceMenu(){const list=services();$("serviceMenu").innerHTML=list.length?list.map(s=>'<article class="menuitem"><div><small>'+H(CATEGORY_LABEL[s.category]||s.category)+' · '+H(s.duration)+' min</small><h3>'+H(s.name)+'</h3><p>'+H(s.price||"Price on request")+'</p></div><button class="btn small" data-book-service="'+H(s.id)+'">Book this ↗</button></article>').join(""):'<p>No services are listed for this branch yet.</p>'}
function renderArtists(){const list=$("artistCards"),members=team();list.innerHTML=members.length?members.map(a=>{const compatible=services().filter(s=>canDo(a,s.id));const pic=a.photo?'<img loading="lazy" src="'+H(a.photo)+'" alt="Photo of '+H(a.name)+'">':'<div class="artistavatar">'+H(a.name.charAt(0))+'</div>';return '<article class="artistcard"><div class="artistphoto">'+pic+'</div><div class="artistbody"><small>'+H(a.role)+(a.id.startsWith("sample-")?" · sample profile":"")+'</small><h3>'+H(a.name)+'</h3>'+(a.experience?'<p>'+H(a.experience)+'</p>':"")+(a.bio?'<p>'+H(a.bio)+'</p>':"")+'<div class="artskills">'+compatible.map(s=>'<span>'+H(s.name)+'</span>').join("")+'</div><select aria-label="Choose service with '+H(a.name)+'" data-artist-service="'+H(a.id)+'"><option value="">Choose a service</option>'+compatible.map(s=>'<option value="'+H(s.id)+'">'+H(s.name)+'</option>').join("")+'</select><button class="btn small" data-book-artist="'+H(a.id)+'">Book with '+H(a.name.split(" ")[0])+' ↗</button></div></article>'}).join(""):'<p>No team profiles are listed for this branch yet.</p>'}
function renderOffers(){const offers=validOffers(),section=$("offers");section.hidden=!offers.length;$("offerCards").innerHTML=offers.map(o=>'<article class="offercard"><small>'+H(o.discount||"Offer")+'</small><h3>'+H(o.title)+'</h3><p>'+H(o.details||"")+'</p>'+(o.validUntil?'<span>Valid until '+H(prettyDate(o.validUntil))+'</span>':"")+'<button type="button" class="linkbtn" data-offer="'+H(o.id)+'">Book with this offer ↗</button></article>').join("")}

// ── Shop ───────────────────────────────────────────────────────────────────
let shopCat="All",viewing=null;
function qtyControl(id,qty,cls){return '<span class="qty '+(cls||"")+'"><button type="button" data-qty="'+H(id)+'" data-step="-1" aria-label="One less">−</button><b>'+qty+'</b><button type="button" data-qty="'+H(id)+'" data-step="1" aria-label="One more">+</button></span>'}
function productAction(p){const q=bag[p.id]||0;return p.inStock===false?'<button disabled>Out of stock</button>':q?qtyControl(p.id,q):'<button data-product="'+H(p.id)+'">Add to bag +</button>'}
function renderProducts(){const all=products(),cats=["All",...new Set(all.map(p=>p.category||"Salon care"))];if(!cats.includes(shopCat))shopCat="All";
  $("shopChips").hidden=cats.length<3;$("shopChips").innerHTML=cats.map(c=>'<button type="button" role="tab" data-shopcat="'+H(c)+'" aria-selected="'+(c===shopCat)+'">'+H(c)+'</button>').join("");
  const list=all.filter(p=>shopCat==="All"||(p.category||"Salon care")===shopCat);
  $("productGrid").innerHTML=list.length?list.map((p,i)=>{const image=p.photo?'<img loading="lazy" src="'+H(p.photo)+'" alt="">':'<div class="bottle"></div>';
  return '<article class="product'+(p.inStock===false?" soldout":"")+'"><button type="button" class="productimage '+["a","b","c"][i%3]+'" data-view-product="'+H(p.id)+'" aria-label="View '+H(p.name)+'">'+image+'</button><div class="productbody"><small>'+H(p.category||"Salon care")+(p.id.startsWith("sample-")?" · sample":"")+'</small><h3><button type="button" data-view-product="'+H(p.id)+'">'+H(p.name)+'</button></h3><p>'+H(p.description||"")+'</p><div class="productbottom"><span class="price">'+H(p.price||"Price at salon")+'</span>'+productAction(p)+'</div></div></article>'}).join(""):'<p>No products are listed for this branch yet.</p>';
  if(viewing)renderProductView()}
function renderProductView(){const p=data.products.find(x=>x.id===viewing);if(!p){$("productView").close();return}
  $("pvImg").innerHTML=p.photo?'<img src="'+H(p.photo)+'" alt="'+H(p.name)+'">':"";
  $("pvBody").innerHTML='<small>'+H(p.category||"Salon care")+(p.id.startsWith("sample-")?" · sample":"")+'</small><h3 id="pvTitle">'+H(p.name)+'</h3><div class="price">'+H(p.price||"Price at salon")+'</div><p>'+H(p.description||"")+'</p><p>'+(p.inStock===false?"Out of stock right now.":"Reserve it now and collect it at "+H(branchLabel(currentBranch))+". Pay at the salon.")+'</p><div class="pvact productbottom">'+productAction(p)+((bag[p.id]||0)?'<button type="button" class="btn small" data-open-bag>View bag →</button>':"")+'</div>'}
function openProduct(id){viewing=id;renderProductView();const d=$("productView");if(!d.open)d.showModal()}

// ── Bag ────────────────────────────────────────────────────────────────────
function bagLines(){return Object.entries(bag).map(([id,qty])=>({p:data.products.find(x=>x.id===id),qty})).filter(l=>l.p&&l.qty>0)}
function setQty(id,qty){const before=bag[id]||0;if(qty>0)bag[id]=Math.min(qty,20);else delete bag[id];store.set(BAG_KEY,bag);renderProducts();updateCart();if((bag[id]||0)>before){const b=$("bagBtn");b.classList.remove("bump");void b.offsetWidth;b.classList.add("bump")}}
function updateCart(){const lines=bagLines(),count=lines.reduce((n,l)=>n+l.qty,0),total=lines.reduce((n,l)=>n+(l.p.amount||0)*l.qty,0),unpriced=lines.some(l=>!l.p.amount);
  const totalText=lines.length?(total?money(total):"")+(unpriced&&total?" + items priced at the salon":unpriced?"Priced at the salon":""):"";
  $("bagCount").textContent=count;$("bagCount").hidden=!count;
  $("cartItems").innerHTML=lines.length?lines.map(l=>'<div class="cartitem"><div><h3>'+H(l.p.name)+'</h3><p>'+(l.p.amount?money(l.p.amount)+" each":"Price at salon")+(l.p.inStock===false?" · now out of stock":"")+'</p><button type="button" class="linkbtn" data-qty="'+H(l.p.id)+'" data-set="0">Remove</button></div><div class="cartright">'+qtyControl(l.p.id,l.qty,"small")+'<strong>'+(l.p.amount?money(l.p.amount*l.qty):"—")+'</strong></div></div>').join(""):'<p class="empty">Your bag is empty. Add products from “Take it home” to reserve them for pickup.</p>';
  $("cartTotal").textContent=totalText;$("cartTotal2").textContent=totalText;$("cartfoot").hidden=!lines.length;
  $("bagBarText").textContent=count+(count===1?" item":" items")+(total?" · "+money(total):"");
  const showBar=count>0&&!$("drawer").classList.contains("show");$("bagBar").hidden=!count;$("bagBar").classList.toggle("show",showBar);document.body.classList.toggle("hasbag",count>0)}
function orderMessage(){const lines=bagLines(),total=lines.reduce((n,l)=>n+(l.p.amount||0)*l.qty,0),b=$("pickupBranch").value;
  return ["Hello New Duke & Duchess ("+branchLabel(b)+"), I'd like to reserve these products for pickup:",""]
    .concat(lines.map(l=>"• "+l.qty+" × "+l.p.name+(l.p.amount?" — "+money(l.p.amount*l.qty):" — price at salon")))
    .concat(["",total?"Total: "+money(total)+" (I'll pay at the salon)":"I'll pay at the salon.","• Name: "+$("orderName").value.trim(),"• Mobile: "+cleanPhone($("orderPhone").value),"","Please let me know when it's ready. Thank you!"]).join("\n")}
function checkoutStep(b){$("checkA").hidden=b;$("checkB").hidden=!b;if(b)$(($("orderName").value?"orderPhone":"orderName")).focus()}
function toggleBag(open){if(open){if($("productView").open)$("productView").close();$("pickupBranch").value=currentBranch;const me=store.get(ME_KEY,{});if(!$("orderName").value)$("orderName").value=me.name||"";if(!$("orderPhone").value)$("orderPhone").value=me.phone||"";checkoutStep(false)}
  $("drawer").classList.toggle("show",open);$("overlay").classList.toggle("show",open);$("drawer").setAttribute("aria-hidden",String(!open));$("drawer").inert=!open;document.body.style.overflow=open?"hidden":"";updateCart()}

// ── Everything together ───────────────────────────────────────────────────
function renderBusiness(){renderBranchPage();renderHours();renderAnnouncement();$("rrAddress").textContent=data.business.rrAddress;$("nagarabhaviAddress").textContent=data.business.nagarabhaviAddress;const phone=$("contactPhone"),n=phoneOf();phone.href="tel:"+n.replace(/[^+0-9]/g,"");phone.textContent="Call "+branchLabel(currentBranch)+": "+n;$("bookCall").href=phone.href}
function render(){data=SalonData.load();renderServiceMenu();renderArtists();renderProducts();renderOffers();renderBusiness();renderWizard();updateCart()}

// Wizard
$("wizSteps").addEventListener("click",e=>{const b=e.target.closest("[data-step]");if(b)goStep(+b.dataset.step)});
$("wizNext").addEventListener("click",()=>{if(stepValid(bk.step))goStep(bk.step+1)});
$("wizBack").addEventListener("click",()=>goStep(bk.step-1));
$("wizSwitch").addEventListener("click",()=>applyBranch(currentBranch==="RR Nagar"?"Nagarabhavi":"RR Nagar"));
$("bookingForm").addEventListener("click",e=>{
  const c=e.target.closest("[data-cat]");if(c){bk.cat=c.dataset.cat;renderStep1();return}
  const s=e.target.closest("[data-svc]");if(s){if(bk.svc!==s.dataset.svc){bk.svc=s.dataset.svc;bk.artist="any";bk.time=null}renderWizard();return}
  const p=e.target.closest("[data-pro]");if(p){bk.artist=p.dataset.pro;renderStep1();renderSummary();return}
  const d=e.target.closest("[data-day]");if(d&&!d.disabled){bk.date=d.dataset.day;bk.time=null;renderWizard();goStep(3);return}
  const t=e.target.closest("[data-time]");if(t){bk.time=+t.dataset.time;renderWizard();goStep(4)}});
["name","phone"].forEach(id=>$(id).addEventListener("input",()=>{$("wizNext").disabled=!stepValid(bk.step);$("formError").textContent=""}));
$("bookingForm").addEventListener("submit",e=>{e.preventDefault();$("formError").textContent="";
  for(let n=1;n<=3;n++)if(!stepValid(n)){goStep(n);$("formError").textContent=["","Please choose a service.","Please choose a day.","Please choose a time."][n];return}
  const name=$("name").value.trim(),phone=cleanPhone($("phone").value);if(!name||!phone){$("formError").textContent="Please enter your name and a 10-digit mobile number.";$(name?"phone":"name").focus();return}
  store.set(ME_KEY,{name,phone});openWhatsApp(waLink(currentBranch,bookingMessage()));
  showToast("WhatsApp is opening with your booking. Press send, and the salon will confirm your slot.")});
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{bk.cat=b.dataset.category;bk.step=1;renderWizard();goToBooking()}));

// Everything else that is clicked
document.addEventListener("click",e=>{
  const s=e.target.closest("[data-book-service]");if(s){fillBooking(s.dataset.bookService);return}
  const a=e.target.closest("[data-book-artist]");if(a){const sel=document.querySelector('[data-artist-service="'+CSS.escape(a.dataset.bookArtist)+'"]');if(!sel.value){showToast("Choose a service with this artist first.");sel.focus();return}fillBooking(sel.value,a.dataset.bookArtist);return}
  const v=e.target.closest("[data-view-product]");if(v){openProduct(v.dataset.viewProduct);return}
  const p=e.target.closest("[data-product]");if(p){const item=data.products.find(x=>x.id===p.dataset.product);if(item){setQty(item.id,(bag[item.id]||0)+1);showToast(item.name+" is in your bag.")}return}
  const q=e.target.closest("[data-qty]");if(q){const id=q.dataset.qty;setQty(id,q.dataset.set!=null?+q.dataset.set:(bag[id]||0)+(+q.dataset.step));return}
  const sc=e.target.closest("[data-shopcat]");if(sc){shopCat=sc.dataset.shopcat;renderProducts();return}
  if(e.target.closest("[data-open-bag]")){toggleBag(true);return}
  const o=e.target.closest("[data-offer]");if(o){const offer=data.offers.find(x=>x.id===o.dataset.offer);if(offer){$("notes").value="Offer: "+offer.title+(offer.discount?" ("+offer.discount+")":"");goToBooking()}}
});
$("pvClose").addEventListener("click",()=>$("productView").close());
$("productView").addEventListener("click",e=>{if(e.target===$("productView"))$("productView").close()});
$("productView").addEventListener("close",()=>{viewing=null});
$("toCheckout").addEventListener("click",()=>{if(bagLines().some(l=>l.p.inStock===false)){showToast("Remove the items that are out of stock first.");return}checkoutStep(true)});
$("backToBag").addEventListener("click",()=>checkoutStep(false));
$("checkoutBtn").addEventListener("click",()=>{$("orderError").textContent="";const name=$("orderName").value.trim(),phone=cleanPhone($("orderPhone").value);
  if(!name||!phone){$("orderError").textContent="Please enter your name and a 10-digit mobile number.";$(name?"orderPhone":"orderName").focus();return}
  store.set(ME_KEY,{name,phone});openWhatsApp(waLink($("pickupBranch").value,orderMessage()));
  showToast("WhatsApp is opening with your order. Press send to reserve it.");$("clearBag").hidden=false});
$("clearBag").addEventListener("click",()=>{bag={};store.set(BAG_KEY,bag);renderProducts();updateCart();$("clearBag").hidden=true;toggleBag(false)});
$("bagBtn").addEventListener("click",()=>toggleBag(true));$("bagBar").addEventListener("click",()=>toggleBag(true));$("closeBag").addEventListener("click",()=>toggleBag(false));$("overlay").addEventListener("click",()=>toggleBag(false));document.addEventListener("keydown",e=>{if(e.key==="Escape")toggleBag(false)});
$("announceClose").addEventListener("click",()=>{try{sessionStorage.setItem("ndd-announce",data.settings.announcement)}catch(e){}$("announce").hidden=true});
function toggleMenu(open){$("mobileMenu").classList.toggle("open",open);$("menuBtn").setAttribute("aria-expanded",String($("mobileMenu").classList.contains("open")))}
$("menuBtn").addEventListener("click",()=>toggleMenu());$("mobileMenu").querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>toggleMenu(false)));
document.querySelectorAll("[data-branch]").forEach(a=>a.addEventListener("click",()=>applyBranch(a.dataset.branch)));
let toastTimer;function showToast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),5200)}

function storedBranch(){return store.get(BRANCH_KEY,null)}
function applyBranch(b,remember=true){if(!BRANCHES[b])return;currentBranch=b;if(remember)store.set(BRANCH_KEY,b);render();$("locRR").classList.toggle("chosen",b==="RR Nagar");$("locNB").classList.toggle("chosen",b==="Nagarabhavi")}
function askBranch(){$("branchDialog").scrollIntoView({behavior:"smooth"})}
$("branchDialog").addEventListener("click",e=>{const b=e.target.closest("[data-pick-branch]");if(b){applyBranch(b.dataset.pickBranch);$("site").scrollIntoView({behavior:"smooth"})}});
document.querySelector("header .brand").addEventListener("click",e=>{e.preventDefault();askBranch()});

// The sticky Book button shows on phones only while neither the split screen nor the booking form is on screen.
const seen=new Set();const watch=new IntersectionObserver(es=>{es.forEach(x=>x.isIntersecting?seen.add(x.target.id):seen.delete(x.target.id));$("bookFab").classList.toggle("show",!seen.size)});watch.observe($("branchDialog"));watch.observe($("booking"));

const me=store.get(ME_KEY,{});$("name").value=me.name||"";$("phone").value=me.phone||"";
window.addEventListener("salon-data-changed",render);
applyBranch(BRANCHES[storedBranch()]?storedBranch():"RR Nagar",!!BRANCHES[storedBranch()]);
SalonData.refresh();
setInterval(renderHours,60000);
// ── Install the app ─────────────────────────────────────────────────────────
(()=>{const ua=navigator.userAgent,p=navigator.platform||"";const os=/android/i.test(ua)?"android":/iphone|ipad|ipod/i.test(ua)||(p==="MacIntel"&&navigator.maxTouchPoints>1)?"ios":/windows/i.test(ua)?"windows":/macintosh|mac os/i.test(ua)?"mac":/linux|cros/i.test(ua)?"linux":"";
  const mine=os&&document.querySelector('.installcard[data-os="'+os+'"]');if(mine)mine.classList.add("yours");
  const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;if(standalone){$("installedNote").hidden=false;$("installGrid").hidden=true}
  let deferred=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("installBtn").hidden=false});
  $("installBtn").addEventListener("click",async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$("installBtn").hidden=true});
  window.addEventListener("appinstalled",()=>{$("installBtn").hidden=true;$("installedNote").hidden=false;$("installedNote").textContent="✓ Installed. Find New Duke & Duchess with your other apps."})})();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
