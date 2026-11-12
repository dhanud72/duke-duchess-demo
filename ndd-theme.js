/* Theme loader + "Appearance" switch (Dark / Light beige / Light sky).
   Loaded in <head> before any stylesheet so the right theme paints first.
   Pages call NDDTheme.writeNdd() where the shared stylesheet goes and (home page only) NDDTheme.writeTheme() after the page's own <style>. */
(function(){
"use strict";
var KEY="ndd-theme",ALL=["dark","beige","sky"],META={dark:"#0F0D0C",beige:"#F8F1E7",sky:"#F6FAFD"};
function stored(){var t="dark",m=/[?&]theme=(dark|beige|sky)\b/.exec(location.search);try{t=m?m[1]:(localStorage.getItem(KEY)||"dark");if(m)localStorage.setItem(KEY,t)}catch(e){if(m)t=m[1]}return ALL.indexOf(t)<0?"dark":t}
var cur=stored();document.documentElement.setAttribute("data-theme",cur);
function link(kind){return '<link rel="stylesheet" href="'+kind+'-'+cur+'.css" data-th="'+kind+'">'}
function paintButtons(){var b=document.querySelectorAll("[data-theme-set]");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(b[i].getAttribute("data-theme-set")===cur))}
function set(t){if(ALL.indexOf(t)<0||t===cur)return;cur=t;try{localStorage.setItem(KEY,t)}catch(e){}
  document.documentElement.setAttribute("data-theme",t);
  var ls=document.querySelectorAll("link[data-th]");for(var i=0;i<ls.length;i++)ls[i].setAttribute("href",ls[i].getAttribute("data-th")+"-"+t+".css");
  var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",META[t]);
  paintButtons();window.dispatchEvent(new Event("ndd-theme-changed"))}
window.NDDTheme={get:function(){return cur},set:set,writeNdd:function(){document.write(link("ndd"))},writeTheme:function(){document.write(link("theme"))}};

var CSS=".themebar{position:relative;z-index:40;display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:5px max(14px,env(safe-area-inset-right)) 5px max(14px,env(safe-area-inset-left));font:600 10px/1 'DM Sans',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}"+
".themebar .tb-l{margin-right:6px;opacity:.85}.themebar button{min-height:30px;padding:0 12px;border:1px solid var(--tb-line);background:transparent;color:var(--tb-fg);font:inherit;cursor:pointer;border-radius:var(--tb-r,0)}"+
".themebar button[aria-pressed=true]{background:var(--tb-on-bg);color:var(--tb-on-fg);border-color:var(--tb-on-bg)}"+
"[data-theme=dark] .themebar{--tb-bg:#0A0908;--tb-fg:#B9AA9C;--tb-line:#3A322D;--tb-on-bg:#D8BFA9;--tb-on-fg:#1A1410;--tb-r:0;border-bottom:1px solid #2A2420}"+
"[data-theme=beige] .themebar{--tb-bg:#F8F1E7;--tb-fg:#5E5046;--tb-line:rgba(59,42,32,.25);--tb-on-bg:#3B2A20;--tb-on-fg:#fff;--tb-r:999px;border-bottom:1px solid rgba(160,111,73,.2)}"+
"[data-theme=sky] .themebar{--tb-bg:#F6FAFD;--tb-fg:#526A82;--tb-line:rgba(31,51,71,.22);--tb-on-bg:#1F3347;--tb-on-fg:#fff;--tb-r:999px;border-bottom:1px solid rgba(76,155,214,.2)}"+
".themebar{background:var(--tb-bg);color:var(--tb-fg)}@media(max-width:480px){.themebar .tb-l{display:none}.themebar{justify-content:center}}";
var st=document.createElement("style");st.setAttribute("data-ndd","themebar");st.textContent=CSS;document.head.appendChild(st);

function mount(){if(document.querySelector(".themebar"))return;var bar=document.createElement("div");bar.className="themebar";bar.setAttribute("role","group");bar.setAttribute("aria-label","Appearance");
  bar.innerHTML='<span class="tb-l">Appearance</span><button type="button" data-theme-set="dark">Dark</button><button type="button" data-theme-set="beige">Light · Beige</button><button type="button" data-theme-set="sky">Light · Sky</button>';
  document.body.insertBefore(bar,document.body.firstChild);paintButtons()}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-theme-set]");if(b)set(b.getAttribute("data-theme-set"))});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
