(function(){
// ── Owner content ──────────────────────────────────────────────────────────
// Paste the salon's Google Sheet link here once. The sheet must be shared as
// "Anyone with the link → Viewer". Leave empty to use the built-in content below.
const SHEET_URL="";

const CACHE_KEY="ndd-sheet-v1";
const TABS={services:"Services",artists:"Team",products:"Products",offers:"Offers",hours:"Hours",holidays:"Holidays",settings:"Settings"};
const BRANCH_IDS=["RR Nagar","Nagarabhavi"];
const DAYS=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const everyDay=(open,close)=>DAYS.map(()=>({open,close}));
const defaults={
  services:[
    {id:"haircut",name:"Haircut & styling",category:"Hair",duration:60,price:"Price on request"},
    {id:"colour",name:"Hair colouring & highlights",category:"Hair",duration:120,price:"Price on request"},
    {id:"keratin",name:"Keratin treatment",category:"Hair",duration:120,price:"Price on request"},
    {id:"beard",name:"Beard grooming",category:"Hair",duration:30,price:"Price on request"},
    {id:"kids",name:"Kids haircut",category:"Hair",duration:30,price:"Price on request"},
    {id:"hairspa",name:"Hair spa",category:"Hair",duration:60,price:"Price on request"},
    {id:"facial",name:"Facial care",category:"Skin",duration:60,price:"Price on request"},
    {id:"skincare",name:"Skin consultation",category:"Skin",duration:30,price:"Price on request"},
    {id:"manicure",name:"Manicure",category:"Nails",duration:45,price:"Price on request"},
    {id:"pedicure",name:"Pedicure",category:"Nails",duration:45,price:"Price on request"},
    {id:"bridal",name:"Bridal grooming",category:"More",duration:120,price:"Price on request"},
    {id:"makeup",name:"Makeup",category:"More",duration:60,price:"Price on request"},
    {id:"makeover",name:"Complete makeover",category:"More",duration:180,price:"Price on request"}
  ],
  artists:[
    {id:"sample-hair",name:"Sample Hair Artist",role:"Hair specialist",experience:"Sample profile",bio:"Replace this generated portrait with a real team member.",photo:"assets/artist-hair.webp",branches:["RR Nagar","Nagarabhavi"],capabilities:["haircut","colour","keratin","beard","kids","hairspa"]},
    {id:"sample-skin",name:"Sample Skin Artist",role:"Skin specialist",experience:"Sample profile",bio:"Replace this generated portrait with a real team member.",photo:"assets/artist-skin.webp",branches:["RR Nagar"],capabilities:["facial","skincare"]},
    {id:"sample-nails",name:"Sample Nail Artist",role:"Nail specialist",experience:"Sample profile",bio:"Replace this generated portrait with a real team member.",photo:"assets/artist-nails.webp",branches:["Nagarabhavi"],capabilities:["manicure","pedicure"]}
  ],
  products:[
    {id:"sample-shampoo",name:"Everyday Shampoo",category:"Hair care",amount:null,price:"Price at salon",description:"Sample product. Replace with the salon's actual shampoo.",photo:"assets/product-shampoo.webp"},
    {id:"sample-conditioner",name:"Softness Conditioner",category:"Hair care",amount:null,price:"Price at salon",description:"Sample product. Replace with the salon's actual conditioner.",photo:"assets/product-conditioner.webp"},
    {id:"sample-skin",name:"Daily Skin Ritual",category:"Skin care",amount:null,price:"Price at salon",description:"Sample product. Replace with the salon's actual skincare.",photo:"assets/product-skin.webp"}
  ],
  offers:[],
  // Opening hours in minutes after midnight, Sunday first. null = closed that day.
  hours:{"RR Nagar":everyDay(540,1320),"Nagarabhavi":everyDay(540,1320)},
  holidays:[],
  settings:{
    whatsapp:{"RR Nagar":"918904710353","Nagarabhavi":"918904710353"},
    phone:{"RR Nagar":"+91 89047 10353","Nagarabhavi":"+91 89047 10353"},
    slot:30,notice:60,daysAhead:60,announcement:"",announcementUntil:""
  },
  photos:{rrHair:"assets/rr-svc-hair.webp",rrSkin:"assets/rr-svc-skin.webp",rrNails:"assets/rr-svc-nails.webp",rrMore:"assets/rr-svc-more.webp",nbHair:"assets/salon-hairwash.webp",nbSkin:"assets/salon-facial.webp",nbNails:"assets/salon-pedicure.webp",nbMore:"assets/salon-vanity.webp",rrHero:"assets/rr-hero-wide.webp",rrG1:"assets/rr-hero.webp",rrG2:"assets/rr-g2.webp",rrG3:"assets/rr-g3.webp",rrG4:"assets/rr-g4.webp",rrG5:"assets/rr-g5.webp",nbHero:"assets/salon-styling.webp",nbG1:"assets/salon-reception.webp",nbG2:"assets/salon-floor.webp",nbG3:"assets/salon-shelf.webp",nbG4:"assets/salon-treatment.webp",nbG5:"assets/salon-lounge.webp"},
  business:{
    rrAddress:"07, Krishna Garden Main Rd, near New Happy Home, Balarama Layout, Rajarajeshwari Nagar, Bengaluru 560098",
    nagarabhaviAddress:"1st Floor, Abhiman Arcade, Muddenapalya Main Rd, near Ayodhya Samrat Hotel, Srigandada Kaval, Nagarabhavi, Bengaluru 560072"
  }
};

function copy(x){return JSON.parse(JSON.stringify(x))}
function localDate(d){d=d||new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function escapeHTML(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(n){return "₹"+Number(n).toLocaleString("en-IN")}
function slug(v){return String(v||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function sheetId(){const m=/\/d\/([\w-]+)/.exec(SHEET_URL);return m?m[1]:""}
function clock(min){const h=Math.floor(min/60)%24,m=min%60,ap=h<12?"AM":"PM",h12=h%12||12;return h12+(m?":"+String(m).padStart(2,"0"):"")+" "+ap}

// ── Reading the sheet ──────────────────────────────────────────────────────
function parseCSV(text){
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
    else if(c==='"')q=true;
    else if(c===","){row.push(cell);cell=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell=""}
    else cell+=c}
  if(cell!==""||row.length){row.push(cell);rows.push(row)}
  return rows.filter(r=>r.some(c=>c.trim()!==""));
}
function key(h){return h.toLowerCase().replace(/\(.*?\)/g,"").replace(/[^a-z]/g,"")}
function records(text){const rows=parseCSV(text);if(!rows.length)return [];const head=rows[0].map(key);
  return rows.slice(1).map((r,i)=>{const o={_row:i+2};head.forEach((h,j)=>{if(h)o[h]=(r[j]||"").trim()});return o})}
function pick(o,...names){for(const n of names)if(o[n]!=null&&o[n]!=="")return o[n];return ""}
function yes(v,dflt){if(v==="")return dflt;return /^(y|yes|true|1|show|active|available|in ?stock)$/i.test(v.trim())}
function branchesOf(v){v=(v||"").toLowerCase();if(!v||/both|all|any/.test(v))return [];const out=[];if(/r\s*\.?\s*r|raja/.test(v))out.push("RR Nagar");if(/bhavi/.test(v))out.push("Nagarabhavi");return out}
function category(v){v=(v||"").toLowerCase();if(/hair|beard|cut|colou?r/.test(v))return "Hair";if(/skin|facial/.test(v))return "Skin";if(/nail|mani|pedi/.test(v))return "Nails";return "More"}
function photo(v){if(!v)return "";const m=/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/.exec(v);return m?"https://lh3.googleusercontent.com/d/"+m[1]+"=w800":v}
function validIso(y,m,d){const t=new Date(+y,+m-1,+d);return t.getFullYear()==+y&&t.getMonth()==+m-1&&t.getDate()==+d?y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"):null}
function isoDate(v){if(!v)return "";let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);if(m)return validIso(m[1],m[2],m[3]);
  m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(v);if(m)return validIso(m[3].length===2?"20"+m[3]:m[3],m[2],m[1]);
  const d=new Date(v+" 12:00");return isNaN(d)?null:localDate(d)}
function amountOf(v){const n=parseFloat(String(v).replace(/[^0-9.]/g,""));return isFinite(n)&&n>0?Math.round(n):null}
function minutesOf(v){const m=/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*$/i.exec(v||"");if(!m)return null;let h=+m[1];const min=+(m[2]||0),ap=(m[3]||"").toLowerCase();
  if(ap.startsWith("p")&&h<12)h+=12;if(ap.startsWith("a")&&h===12)h=0;if(h>24||min>59)return null;return h*60+min}
// "9:00 AM - 10:00 PM", "9am to 10pm", "Closed"
function rangeOf(v){if(!v||/closed|holiday|off/i.test(v))return null;const parts=v.split(/\s*(?:-|–|—|to)\s*/i);if(parts.length!==2)return undefined;const open=minutesOf(parts[0]),close=minutesOf(parts[1]);return open==null||close==null||close<=open?undefined:{open,close}}

const READ={
  services:(r,warn)=>{const name=pick(r,"name","service");if(!name)return null;const mins=parseInt(pick(r,"duration","minutes","durationmin"),10);
    return {id:pick(r,"id")||slug(name),name,category:category(pick(r,"category")),duration:mins>0?mins:60,price:pick(r,"price")||"Price on request",branches:branchesOf(pick(r,"branches","branch")),active:yes(pick(r,"show","active"),true)}},
  artists:(r,warn)=>{const name=pick(r,"name");if(!name)return null;
    return {id:pick(r,"id")||slug(name),name,role:pick(r,"role"),experience:pick(r,"experience"),bio:pick(r,"about","bio"),photo:photo(pick(r,"photo","photolink")),branches:branchesOf(pick(r,"branches","branch")),servicesText:pick(r,"services","skills"),active:yes(pick(r,"show","active"),true)}},
  products:(r,warn)=>{const name=pick(r,"name","product");if(!name)return null;const raw=pick(r,"price"),amount=amountOf(raw);if(raw&&!amount)warn("Row "+r._row+": price “"+raw+"” is not a number, so it shows as “Price at salon”.");
    return {id:pick(r,"id")||slug(name),name,category:pick(r,"category"),amount,price:amount?money(amount):"Price at salon",description:pick(r,"description","details"),photo:photo(pick(r,"photo","photolink")),branches:branchesOf(pick(r,"branches","branch")),inStock:yes(pick(r,"instock","stock"),true),active:yes(pick(r,"show","active"),true)}},
  offers:(r,warn)=>{const title=pick(r,"title","offer");if(!title)return null;const raw=pick(r,"validuntil","valid","until"),until=isoDate(raw);if(until===null)warn("Row "+r._row+": “"+raw+"” is not a date. Write it like 30/11/2026.");
    return {id:slug(title),title,discount:pick(r,"discount"),details:pick(r,"details","description"),validUntil:until||"",branches:branchesOf(pick(r,"branches","branch")),active:yes(pick(r,"show","active"),true)}},
  holidays:(r,warn)=>{const raw=pick(r,"date","from","start");if(!raw)return null;const from=isoDate(raw),toRaw=pick(r,"until","to","end"),to=toRaw?isoDate(toRaw):from;
    if(!from||!to){warn("Row "+r._row+": “"+(from?toRaw:raw)+"” is not a date. Write it like 30/11/2026.");return null}
    const special=pick(r,"specialhours","hours","open");let hours=null;if(special){hours=rangeOf(special);if(hours===undefined){warn("Row "+r._row+": special hours “"+special+"” not understood, so the day is treated as closed. Write it like 10:00 AM - 2:00 PM.");hours=null}}
    return {from,to:to<from?from:to,branches:branchesOf(pick(r,"branches","branch")),reason:pick(r,"reason","name","occasion")||"Holiday",hours}}
};
// Hours tab: one row per weekday, one column per branch.
function readHours(rows,warn){const out=copy(defaults.hours);rows.forEach(r=>{const day=DAYS.findIndex(d=>(pick(r,"day")||"").toLowerCase().startsWith(d.slice(0,3)));if(day<0)return;
  for(const b of BRANCH_IDS){const col=b==="RR Nagar"?pick(r,"rrnagar","rajarajeshwarinagar","rrnagarhours"):pick(r,"nagarabhavi","nagarbhavi","nagarabhavihours");if(!col)continue;const v=rangeOf(col);
    if(v===undefined)warn(DAYS[day][0].toUpperCase()+DAYS[day].slice(1)+", "+b+": “"+col+"” not understood. Write it like 9:00 AM - 10:00 PM, or Closed.");else out[b][day]=v}});return out}
// Settings tab: two columns, Setting and Value.
function readSettings(rows,warn){const s=copy(defaults.settings);rows.forEach(r=>{const name=(pick(r,"setting","name")||"").toLowerCase(),v=pick(r,"value");if(!name)return;
  const branch=/r\s*\.?\s*r|raja/.test(name)?"RR Nagar":/bhavi/.test(name)?"Nagarabhavi":null,digits=v.replace(/\D/g,"");
  if(/whatsapp/.test(name)){if(digits.length<10){warn("WhatsApp number “"+v+"” looks too short.");return}const n=digits.length===10?"91"+digits:digits;(branch?[branch]:BRANCH_IDS).forEach(b=>s.whatsapp[b]=n)}
  else if(/phone|call/.test(name)){if(digits.length<10){warn("Phone number “"+v+"” looks too short.");return}(branch?[branch]:BRANCH_IDS).forEach(b=>s.phone[b]=v)}
  else if(/slot|gap|interval/.test(name)){const n=parseInt(v,10);if(n>=10&&n<=120)s.slot=n;else warn("Booking slot “"+v+"” should be between 10 and 120 minutes.")}
  else if(/notice|before|advance/.test(name)){const n=parseInt(v,10);if(n>=0)s.notice=n}
  else if(/ahead|days/.test(name)){const n=parseInt(v,10);if(n>=1&&n<=365)s.daysAhead=n}
  else if(/announcement|notice board|banner|message/.test(name)&&/until|till|end/.test(name)){s.announcementUntil=isoDate(v)||""}
  else if(/announcement|banner|message/.test(name)){s.announcement=v}});return s}

// Team "Services" column lists service names (or ids), separated by commas.
function resolveSkills(data,report){const byId={};data.services.forEach(s=>byId[s.id.toLowerCase()]=s.id);const names=data.services.slice().sort((a,b)=>b.name.length-a.name.length);
  data.artists.forEach(a=>{if(a.servicesText==null)return;let text=","+a.servicesText.toLowerCase()+",";a.capabilities=[];
    // Match whole service names first, so names that contain commas still work.
    names.forEach(s=>{const n=s.name.toLowerCase();if(text.includes(n)){a.capabilities.push(s.id);text=text.split(n).join(",")}});
    text.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).forEach(x=>{if(byId[x])a.capabilities.push(byId[x]);else if(report)report.artists.warnings.push(a.name+": no service called “"+x+"”. Check the spelling against the Services tab.")});delete a.servicesText})}

// ── Opening hours for one branch on one date ───────────────────────────────
function dayInfo(data,branch,iso){const hol=data.holidays.find(h=>iso>=h.from&&iso<=h.to&&(!h.branches.length||h.branches.includes(branch)));
  if(hol)return hol.hours?{open:hol.hours.open,close:hol.hours.close,note:hol.reason}:{closed:true,note:hol.reason};
  const d=new Date(iso+"T12:00:00"),h=(data.hours[branch]||[])[d.getDay()];return h?{open:h.open,close:h.close}:{closed:true,note:"Weekly holiday"}}

function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null")}catch(e){return null}}
function load(){const data=copy(defaults),cache=readCache();if(cache&&cache.id===sheetId()&&cache.tabs)for(const k in TABS)if(cache.tabs[k]!=null)data[k]=copy(cache.tabs[k]);resolveSkills(data);return data}

async function refresh(){const id=sheetId();if(!id)return {connected:false};
  const report={connected:true,at:new Date().toISOString()},tabs={},old=readCache();
  await Promise.all(Object.entries(TABS).map(async([k,tab])=>{const r=report[k]={tab,ok:false,count:0,warnings:[]};const warn=w=>r.warnings.push(w);
    try{const res=await fetch("https://docs.google.com/spreadsheets/d/"+id+"/gviz/tq?tqx=out:csv&sheet="+encodeURIComponent(tab),{cache:"no-store"});
      if(!res.ok)throw new Error("Could not open the "+tab+" tab (error "+res.status+"). Check the tab name.");const text=await res.text();if(/<html/i.test(text.slice(0,300)))throw new Error("The sheet is not shared as “Anyone with the link”.");
      const rows=records(text);
      if(k==="hours")tabs[k]=readHours(rows,warn);else if(k==="settings")tabs[k]=readSettings(rows,warn);else tabs[k]=rows.map(row=>READ[k](row,warn)).filter(Boolean);
      r.ok=true;r.count=Array.isArray(tabs[k])?tabs[k].length:rows.length}
    catch(e){r.error=e.message||String(e);if(old&&old.id===id&&old.tabs&&old.tabs[k]!=null)tabs[k]=old.tabs[k]}}));
  resolveSkills({services:tabs.services||defaults.services,artists:copy(tabs.artists||[])},report);
  try{localStorage.setItem(CACHE_KEY,JSON.stringify({id,at:report.at,tabs}))}catch(e){}
  window.dispatchEvent(new Event("salon-data-changed"));return report}

window.SalonData={load,refresh,dayInfo,clock,escapeHTML,localDate,money,sheetUrl:SHEET_URL,tabs:TABS,defaults:copy(defaults)};
})();
