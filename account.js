/* My account: bookings (reschedule, cancel, calendar, book again), orders, passes, gift-card balance, points, profile. */
(function(){
"use strict";
const A=NDD_API,U=NDDUI,E=SalonData.escapeHTML,$=id=>document.getElementById(id),money=A.rupee,clock=SalonData.clock;
const app=$("app");
let tab=(location.hash||"#bookings").slice(1);if(!["bookings","orders","passes","profile"].includes(tab))tab="bookings";
const bname=id=>{const s=A.catalog().services.find(x=>x.id===id);return s?s.name:id};
const aname=id=>{const a=A.catalog().artists.find(x=>x.id===id);return a?a.name:(id==="walk-in"?"Any available":id)};
const key={"RR Nagar":"rr","Nagarabhavi":"nb"};
function download(name,type,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

function signedOut(){app.innerHTML='<div class="nd-eyebrow">My account</div><h1>Sign in</h1><div class="nd-panel"><p>See your bookings, orders, passes and loyalty points in one place, and change or cancel a visit.</p><button class="nd-btn gold" id="go">Sign in</button> <a class="nd-btn" href="index.html#booking">Book as a guest</a></div>';
  $("go").addEventListener("click",()=>U.signIn(render))}

function render(){const u=A.me();if(!u)return signedOut();
  app.innerHTML='<div class="nd-eyebrow">My account</div><h1>Hello, '+E((u.name||"there").split(" ")[0])+'</h1><p class="nd-sub">'+E(u.email||("+91 "+u.phone))+' · <b>'+u.points+'</b> loyalty points</p>'+
   '<div class="nd-tabs page" role="tablist">'+[["bookings","Bookings"],["orders","Orders"],["passes","Passes & cards"],["profile","Profile & data"]].map(([k,l])=>'<button role="tab" data-tab="'+k+'" aria-selected="'+(k===tab)+'">'+l+'</button>').join("")+'</div><div id="pane"></div>';
  app.querySelector(".nd-tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b){tab=b.dataset.tab;history.replaceState(null,"","#"+tab);render()}});
  ({bookings,orders,passes,profile})[tab]()}

// ── Bookings ──
function bookings(){const all=A.myBookings(),t=A.today(),up=all.filter(b=>b.status==="booked"&&b.date>=t).reverse(),past=all.filter(b=>!up.includes(b));
  const item=b=>{const c=A.canChange(b);return '<div class="nd-item"><div><b>'+E(b.serviceName||bname(b.serviceId))+'</b><small>'+E(A.fmtDate(b.date))+', '+E(clock(b.time))+' · '+E(b.branch)+' · with '+E(aname(b.artistId))+'<br>Ref '+E(b.id)+(b.total?' · '+money(b.total)+(b.paid?' paid':' at salon'):'')+'</small></div><div class="nd-actions" style="flex:0 1 auto"><span class="nd-tag '+b.status+'">'+b.status+'</span>'+
    (b.status==="booked"?'<button class="nd-btn" data-a="ics" data-id="'+b.id+'">Calendar</button><button class="nd-btn" data-a="re" data-id="'+b.id+'"'+(c.ok?'':' disabled title="'+E(c.msg)+'"')+'>Reschedule</button><button class="nd-btn danger" data-a="cx" data-id="'+b.id+'"'+(c.ok?'':' disabled title="'+E(c.msg)+'"')+'>Cancel</button>':
     '<a class="nd-btn" href="index.html?branch='+key[b.branch]+'&svc='+E(b.serviceId)+'#booking">Book again</a>'+(b.status==="completed"?'<button class="nd-btn" data-a="rv" data-id="'+b.id+'">Review</button>':''))+'</div></div>'};
  $("pane").innerHTML='<h2>Upcoming</h2><div class="nd-list">'+(up.length?up.map(item).join(""):'<div class="nd-panel">Nothing booked. <a href="index.html#booking">Book a visit</a>.</div>')+'</div>'+(past.length?'<h2>History</h2><div class="nd-list">'+past.map(item).join("")+'</div>':'')+
   '<p class="nd-sub" style="margin-top:14px">Changes close '+A.settings().cancelHours+' hours before a visit. See the <a href="cancellation.html">cancellation policy</a>.</p>'}
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b||!b.dataset.id)return;const id=b.dataset.id,bk=A.allBookings().find(x=>x.id===id);if(!bk)return;
  if(b.dataset.a==="ics")download(id+".ics","text/calendar",A.ics(bk));
  if(b.dataset.a==="cx"){const d=U.dialog('<h2>Cancel this visit?</h2><p class="nd-sub">'+E(bk.serviceName||bname(bk.serviceId))+' · '+E(A.fmtDate(bk.date))+', '+E(clock(bk.time))+'.'+(bk.paid&&bk.total?' Your '+money(bk.total)+' is refunded in 5–7 working days.':'')+'</p><div class="nd-actions"><button class="nd-btn danger" id="yes">Yes, cancel</button><button class="nd-btn" id="no">Keep it</button></div>');
    d.querySelector("#no").onclick=()=>d.close();d.querySelector("#yes").onclick=()=>{const r=A.cancelBooking(id);d.close();U.toast(r.ok?"Booking cancelled.":r.msg);render()}}
  if(b.dataset.a==="re")reschedule(bk);
  if(b.dataset.a==="rv")U.dialog('<h2>Review this visit</h2><p class="nd-sub">Write it on the <a href="index.html?branch='+key[bk.branch]+'#reviews">website’s reviews section</a>. Your visit is marked verified when your mobile number matches.</p>')});

function reschedule(bk){let date=null;const days=[];for(let i=0;i<=21;i++){const d=A.addDays(A.today(),i);const info=SalonData.dayInfo(A.catalog(),bk.branch,d);if(info.closed)continue;
    const slots=[];for(let t=info.open;t+bk.dur<=info.close;t+=30){if(d===A.today()){const n=new Date();if(t<n.getHours()*60+n.getMinutes()+60)continue}if(A.freeSlot(bk.branch,bk.serviceId,bk.artistId,d,t,bk.dur,bk.id))slots.push(t)}
    if(slots.length)days.push({d,slots})}
  const d=U.dialog('<h2>Reschedule</h2><p class="nd-sub">'+E(bk.serviceName||bname(bk.serviceId))+' with '+E(aname(bk.artistId))+'. Now: '+E(A.fmtDate(bk.date))+', '+E(clock(bk.time))+'.</p><div class="nd-chips" id="rd">'+(days.length?days.map(x=>'<button type="button" data-d="'+x.d+'" aria-pressed="false">'+E(A.fmtDate(x.d))+'</button>').join(""):"No free times in the next 3 weeks. Please call the branch.")+'</div><div class="nd-chips" id="rt" style="margin-top:14px"></div><p class="nd-err" id="re"></p>');
  d.querySelector("#rd").addEventListener("click",e=>{const b=e.target.closest("[data-d]");if(!b)return;date=b.dataset.d;d.querySelectorAll("#rd button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
    d.querySelector("#rt").innerHTML=days.find(x=>x.d===date).slots.map(t=>'<button type="button" data-t="'+t+'" aria-pressed="false">'+E(clock(t))+'</button>').join("")});
  d.querySelector("#rt").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;const r=A.rescheduleBooking(bk.id,date,+b.dataset.t,bk.artistId);if(!r.ok){d.querySelector("#re").textContent=r.msg;return}d.close();U.toast("Rescheduled to "+A.fmtDate(date)+", "+clock(+b.dataset.t)+".");render()})}

// ── Orders ──
function orders(){const l=A.myOrders();$("pane").innerHTML=l.length?'<div class="nd-list">'+l.map(o=>'<div class="nd-item"><div><b>Order '+E(o.id)+'</b><small>'+o.lines.map(x=>x.qty+'× '+E(x.name)).join(', ')+'<br>Collect from '+E(o.branch)+' · '+money(o.total)+(o.paid?' paid online':' when you collect')+(o.earned?' · +'+o.earned+' points':'')+'</small></div><div class="nd-actions" style="flex:0 1 auto"><span class="nd-tag '+o.status+'">'+o.status+'</span>'+(o.status==="new"?'<button class="nd-btn danger" data-o="'+o.id+'">Cancel</button>':'')+'</div></div>').join("")+'</div>':'<div class="nd-panel">No orders yet. <a href="index.html#shop">Browse the shop</a>.</div>'}
document.addEventListener("click",e=>{const b=e.target.closest("[data-o]");if(!b)return;A.setOrderStatus(b.dataset.o,"cancelled");U.toast("Order cancelled.");render()});

// ── Passes, gift cards ──
function passes(){const m=A.myMemberships(),plans=A.plans();
  $("pane").innerHTML='<h2>My passes</h2><div class="nd-list">'+(m.length?m.map(x=>{const p=plans.find(y=>y.id===x.planId)||{name:"Pass"};return '<div class="nd-item"><div><b>'+E(p.name)+'</b><small>'+x.remaining+' session'+(x.remaining===1?'':'s')+' left · valid until '+E(A.fmtDate(x.expires))+'</small></div><a class="nd-btn" href="index.html#booking">Use it</a></div>'}).join(""):'<div class="nd-panel">No passes yet. <a href="index.html#plans">See passes</a>.</div>')+'</div>'+
   '<h2>Gift card balance</h2><form class="nd-panel nd-form" id="gc"><label>Gift card code<input name="code" placeholder="GC-XXXX-0000" autocapitalize="characters"></label><button class="nd-btn" type="submit">Check balance</button><p id="gcr" class="nd-sub"></p></form>'+
   '<h2>Loyalty</h2><div class="nd-panel"><b>'+A.me().points+' points</b> = '+money(A.me().points*A.settings().pointValue)+'. Your referral code is <span class="nd-code">'+E(A.me().ref)+'</span>.</div>';
  $("gc").addEventListener("submit",e=>{e.preventDefault();const b=A.giftBalance(e.target.code.value);$("gcr").textContent=b==null?"We can't find that code.":"Balance: "+money(b)})}

// ── Profile & data ──
function profile(){const u=A.me();
  $("pane").innerHTML='<form class="nd-panel nd-form" id="pf"><label>Name<input name="name" value="'+E(u.name)+'" required></label><label>Mobile<input name="phone" type="tel" value="'+E(u.phone)+'"></label><label>Email<input name="email" type="email" value="'+E(u.email)+'"></label><button class="nd-btn gold" type="submit">Save</button></form>'+
   '<div class="nd-panel"><h3>Your data</h3><p class="nd-sub">You can leave any time. Deleting removes your account, points and sign-in; past bookings stay as anonymous records for accounting. See the <a href="privacy.html">privacy policy</a>.</p><div class="nd-actions"><button class="nd-btn" id="out">Sign out</button><button class="nd-btn danger" id="del">Delete my account</button></div></div>';
  $("pf").addEventListener("submit",e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));A.updateMe(v);U.toast("Saved.");render()});
  $("out").onclick=()=>{A.signOut();render()};
  $("del").onclick=()=>{const d=U.dialog('<h2>Delete your account?</h2><p class="nd-sub">This cannot be undone. Your points and passes are lost.</p><div class="nd-actions"><button class="nd-btn danger" id="y">Delete</button><button class="nd-btn" id="n">Keep it</button></div>');d.querySelector("#n").onclick=()=>d.close();d.querySelector("#y").onclick=()=>{A.deleteMe();d.close();U.toast("Your account is deleted.");render()}}}

window.addEventListener("ndd-demo-changed",()=>{if(!document.querySelector("dialog[open]"))render()});
render();
})();
