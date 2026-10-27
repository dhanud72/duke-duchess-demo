const $=id=>document.getElementById(id);
const E=SalonData.escapeHTML;
const NAMES={services:"Services",artists:"Team",products:"Products",offers:"Offers",hours:"Hours",holidays:"Holidays",settings:"Settings"};

function showNumbers(){const s=SalonData.load().settings,fmt=n=>"+"+n.replace(/^(\d{2})(\d{5})(\d{5})$/,"$1 $2 $3");
  $("numbers").innerHTML="WhatsApp now set to: R R Nagar <b>"+E(fmt(s.whatsapp["RR Nagar"]))+"</b> · Nagarabhavi <b>"+E(fmt(s.whatsapp["Nagarabhavi"]))+"</b>. Change them in the Settings tab."}

if(SalonData.sheetUrl){$("openSheet").href=SalonData.sheetUrl;$("openSheet").hidden=false;$("sheetState").innerHTML="<p>Your website is connected to the salon’s Google Sheet. After you change something, press <b>Check my sheet</b> to see what customers will see.</p>"}
else{$("sheetState").innerHTML='<p class="notice"><b>Not connected yet.</b> Make your copy of the salon sheet, share it as <b>Anyone with the link → Viewer</b>, and send the link to your web developer once. Until then the website shows its built-in content.</p>';$("checkBtn").hidden=true}

$("checkBtn").addEventListener("click",async()=>{const btn=$("checkBtn");btn.disabled=true;btn.textContent="Checking…";
  const r=await SalonData.refresh();btn.disabled=false;btn.textContent="Check again";const box=$("report");box.hidden=false;
  box.innerHTML=Object.keys(NAMES).map(k=>{const t=r[k]||{};const head=t.ok?'<span class="ok">✓ '+t.count+(k==="hours"?" days":k==="settings"?" settings":" rows")+'</span>':'<span class="bad">✗ '+E(t.error||"Not read")+'</span>';
    return '<div class="row"><b>'+NAMES[k]+'</b><div>'+head+(t.warnings&&t.warnings.length?'<ul>'+t.warnings.map(w=>'<li>'+E(w)+'</li>').join("")+'</ul>':"")+'</div></div>'}).join("")+
    '<p class="muted">Checked '+new Date().toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"})+'. '+(Object.keys(NAMES).every(k=>r[k]&&r[k].ok&&!r[k].warnings.length)?"Everything looks good.":"Fix the red lines in the sheet, then check again.")+'</p>';showNumbers()});

showNumbers();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
