/* Fills a branch landing page (rr-nagar.html / nagarabhavi.html) with live hours, prices, team and reviews.
   The page's static text already carries the SEO content; this adds what changes. */
(function(){
"use strict";
const A=NDD_API,U=NDDUI,E=SalonData.escapeHTML,$=id=>document.getElementById(id);
const br=document.body.dataset.branch,key=document.body.dataset.key;
const data=A.catalog(),clock=SalonData.clock,money=A.rupee;
const names=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// Hours table (Monday first)
const days=data.hours[br]||[];
$("hours").innerHTML=[1,2,3,4,5,6,0].map(i=>{const h=days[i];return "<span>"+names[i]+"</span><span>"+(h?clock(h.open)+" – "+clock(h.close):"Closed")+"</span>"}).join("");
// Open now?
(function(){const t=A.today(),info=SalonData.dayInfo(data,br,t),d=new Date(),now=d.getHours()*60+d.getMinutes();
  $("status").textContent=!info.closed&&now>=info.open&&now<info.close?"Open now · closes "+clock(info.close):!info.closed&&now<info.open?"Opens today at "+clock(info.open):"Closed now";
  const up=data.holidays.filter(h=>h.to>=t&&h.from<=A.addDays(t,21)&&(!h.branches.length||h.branches.includes(br)));
  $("holiday").textContent=up.length?"Coming up: "+up.map(h=>(h.hours?"special hours "+clock(h.hours.open)+"–"+clock(h.hours.close):"closed")+" "+A.fmtDate(h.from)+" ("+h.reason+")").join(" · "):""})();
$("wa").href="https://wa.me/"+data.settings.whatsapp[br]+"?text="+encodeURIComponent("Hello New Duke & Duchess ("+br+"), ");

// Services with this branch's prices
const here=x=>x.active!==false&&(!x.branches||!x.branches.length||x.branches.includes(br));
const cat={Hair:"Hair",Skin:"Skin",Nails:"Nails",More:"Bridal & makeup"};
$("services").innerHTML=["Hair","Skin","Nails","More"].map(c=>{const l=data.services.filter(s=>here(s)&&s.category===c);return l.length?'<h3 style="margin:14px 0 4px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#9b7625">'+cat[c]+'</h3>'+l.map(s=>{const p=SalonData.priceFor(s,br);return '<div class="nd-svc"><div><b>'+E(s.name)+'</b><small>'+s.duration+' min</small></div><div><span class="p">'+(p?money(p):E(s.price||"Price on request"))+'</span> <a class="nd-btn" style="min-height:44px;padding:0 16px;font-size:11px;margin-left:8px" href="index.html?branch='+key+'&svc='+E(s.id)+'#booking">Book</a></div></div>'}).join(""):""}).join("");

// Team
const team=data.artists.filter(a=>here(a));
$("team").innerHTML=team.length?team.map(a=>'<div class="m">'+(a.photo?'<img src="'+E(a.photo)+'" alt="'+E(a.name)+'" loading="lazy">':'')+'<b>'+E(a.name)+'</b><br><small>'+E(a.role||"")+(a.id.startsWith("sample-")?" · sample profile":"")+'</small></div>').join(""):"<p>Team profiles are coming soon.</p>";

// Reviews
const rv=A.reviews(br).slice(0,6);
$("reviews").innerHTML=rv.length?rv.map(r=>'<article class="nd-rev"><div class="st" aria-label="'+r.rating+' out of 5">'+U.stars(r.rating)+'</div><p>'+E(r.text)+'</p><small>'+E(r.name)+(r.demo?" · Sample":"")+" · "+E(A.fmtDate(r.date))+'</small></article>').join(""):"<p>No reviews yet.</p>";

U.mapEmbed($("mapHost"),document.querySelector(".nd-panel p").textContent);
})();
