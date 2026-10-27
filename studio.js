const $=id=>document.getElementById(id);
const E=SalonData.escapeHTML,clock=SalonData.clock,money=SalonData.money;
const NAMES={services:"Services",artists:"Team",products:"Products",offers:"Offers",hours:"Hours",holidays:"Holidays",settings:"Settings"};
const BRANCH={"RR Nagar":"R R Nagar","Nagarabhavi":"Nagarabhavi"};
const LINK_KEY="ndd-owner-sheet";
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let lastData=null,previewBranch="RR Nagar";

const live=SalonData.sheetUrl;
if(live){$("sheetState").innerHTML="<p>Your website is <b>connected</b> to the salon’s Google Sheet. After changing something, press <b>Check my sheet</b> to see what customers will see.</p>";$("sheetLink").value=live;$("openSheet").href=live;$("openSheet").hidden=false}
else{$("sheetState").innerHTML='<p class="notice"><b>Not connected yet.</b> Paste your sheet’s link below to check it. When everything is green, send the link to your web developer once and the website will start using it.</p>';$("sheetLink").value=store.get(LINK_KEY)||""}

const fmtNum=n=>"+"+String(n).replace(/^(\d{2})(\d{5})(\d{5})$/,"$1 $2 $3");
const pretty=iso=>new Date(iso+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
const here=(x,b)=>x.active!==false&&(!x.branches||!x.branches.length||x.branches.includes(b));
function hoursLine(d,b){const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],days=d.hours[b]||[];return [1,2,3,4,5,6,0].map(i=>names[i]+" "+(days[i]?clock(days[i].open)+"–"+clock(days[i].close):"closed")).join(" · ")}

function renderPreview(){const d=lastData;if(!d)return;const b=previewBranch,today=SalonData.localDate();
  document.querySelectorAll("#branchTabs button").forEach(x=>x.setAttribute("aria-selected",String(x.dataset.b===b)));
  const svc=d.services.filter(s=>here(s,b)),team=d.artists.filter(a=>here(a,b)),prods=d.products.filter(p=>here(p,b)),offers=d.offers.filter(o=>here(o,b)&&(!o.validUntil||o.validUntil>=today)),hols=d.holidays.filter(h=>h.to>=today&&(!h.branches.length||h.branches.includes(b))).slice(0,6);
  const list=(items,fn,empty)=>items.length?"<ul>"+items.map(fn).join("")+"</ul>":'<p class="empty">'+empty+"</p>";
  const s=d.settings,ann=s.announcement&&(!s.announcementUntil||s.announcementUntil>=today);
  $("preview").innerHTML='<div class="pv">'+
    "<h3>Services ("+svc.length+")</h3>"+list(svc,x=>"<li>"+E(x.name)+' <span class="meta">· '+E(x.duration)+" min · "+E(x.price)+"</span></li>","No services at this branch.")+
    "<h3>Team ("+team.length+")</h3>"+list(team,x=>"<li>"+E(x.name)+' <span class="meta">· '+E(x.role||"")+(x.capabilities&&x.capabilities.length?" · "+x.capabilities.length+" services":" · no services linked")+(x.photo?"":" · no photo")+"</span></li>","No team members at this branch.")+
    "<h3>Products ("+prods.length+")</h3>"+list(prods,x=>"<li>"+E(x.name)+' <span class="meta">· '+E(x.price)+(x.inStock===false?" · out of stock":"")+"</span></li>","No products at this branch.")+
    "<h3>Offers showing now ("+offers.length+")</h3>"+list(offers,x=>"<li>"+E(x.title)+' <span class="meta">· '+E(x.discount||"")+(x.validUntil?" · until "+pretty(x.validUntil):"")+"</span></li>","No offers showing.")+
    "<h3>Opening hours</h3><p class=\"meta\">"+E(hoursLine(d,b))+"</p>"+
    "<h3>Coming holidays</h3>"+list(hols,h=>"<li>"+E(h.from===h.to?pretty(h.from):pretty(h.from)+" – "+pretty(h.to))+' <span class="meta">· '+E(h.reason)+(h.hours?" · open "+clock(h.hours.open)+"–"+clock(h.hours.close):" · closed")+"</span></li>","None in the sheet.")+
    "<h3>Bookings and orders go to</h3><p class=\"meta\">WhatsApp "+E(fmtNum(s.whatsapp[b]))+" · Phone "+E(s.phone[b])+"</p>"+
    "<h3>Announcement</h3><p class=\"meta\">"+(ann?E(s.announcement)+(s.announcementUntil?" (until "+pretty(s.announcementUntil)+")":""):"None showing.")+"</p></div>"}

{const s=SalonData.load().settings;$("numbers").innerHTML="WhatsApp now set to: R R Nagar <b>"+E(fmtNum(s.whatsapp["RR Nagar"]))+"</b> · Nagarabhavi <b>"+E(fmtNum(s.whatsapp["Nagarabhavi"]))+"</b>. Change them in the Settings tab."}

$("branchTabs").addEventListener("click",e=>{const x=e.target.closest("[data-b]");if(x){previewBranch=x.dataset.b;renderPreview()}});

$("linkForm").addEventListener("submit",async e=>{e.preventDefault();const link=$("sheetLink").value.trim(),st=$("checkStatus");st.className="status";$("goLive").hidden=true;
  if(!link){st.textContent="Paste your Google Sheet link first.";st.classList.add("bad");$("sheetLink").focus();return}
  if(!SalonData.idFrom(link)){st.textContent="That doesn’t look like a Google Sheet link. In the sheet tap Share → Copy link, then paste it here.";st.classList.add("bad");return}
  const btn=$("checkBtn");btn.disabled=true;btn.textContent="Checking…";st.textContent="";
  const isLive=live&&SalonData.idFrom(live)===SalonData.idFrom(link);
  const r=await SalonData.refresh(link,{preview:!isLive});btn.disabled=false;btn.textContent="Check again";
  if(!isLive){store.set(LINK_KEY,link);$("openSheet").href=link;$("openSheet").hidden=false}
  const keys=Object.keys(NAMES),allOk=keys.every(k=>r[k]&&r[k].ok),clean=allOk&&keys.every(k=>!r[k].warnings.length);
  $("report").hidden=false;
  $("report").innerHTML=keys.map(k=>{const t=r[k]||{};const head=t.ok?'<span class="ok">✓ '+t.count+(k==="hours"?" days":k==="settings"?" settings":" rows")+"</span>":'<span class="bad">✗ '+E(t.error||"Not read")+"</span>";
    return '<div class="row"><b>'+NAMES[k]+"</b><div>"+head+(t.warnings&&t.warnings.length?"<ul>"+t.warnings.map(w=>"<li>"+E(w)+"</li>").join("")+"</ul>":"")+"</div></div>"}).join("");
  st.textContent=clean?"Everything looks good.":allOk?"The sheet works. Fix the red notes for best results, then check again.":"Some tabs couldn’t be read. Fix the red lines, then check again.";st.classList.add(clean||allOk?"good":"bad");
  if(allOk&&!isLive){$("goLive").hidden=false;$("goLive").innerHTML="<p><b>Ready to go live.</b> Send this message to your web developer once:</p><textarea readonly id=\"goLiveMsg\">Please connect the New Duke & Duchess website to our Google Sheet: "+E(link)+"</textarea><div class=\"btns\"><button type=\"button\" class=\"btn\" id=\"copyMsg\">Copy message</button></div>"}
  lastData=r.data;$("previewCard").hidden=false;renderPreview();$("report").scrollIntoView({behavior:"smooth",block:"start"})});

document.addEventListener("click",async e=>{if(e.target.id!=="copyMsg")return;const t=$("goLiveMsg");try{await navigator.clipboard.writeText(t.value);e.target.textContent="Copied ✓"}catch(err){t.select();document.execCommand("copy");e.target.textContent="Copied ✓"}});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
