/* WoSoCenter Analytics Phase 1 — no cookies, no IP collection, no poster content.
 * Only page views and actual initiated PNG downloads are reported.
 * Update the Worker URL here if Cloudflare assigns a different address.
 */
(() => {
 'use strict';
 const API = 'https://wosocenter-analytics.mr-mehrdadzamani1382.workers.dev';
 window.WoSoAnalytics = Object.freeze({endpoint:API});
 // Shared UI additions load on every tool independently of analytics opt-outs.
 // Keep them BEFORE Do-Not-Track / GPC checks: turning analytics off must not disable the editor.
 const pageName=location.pathname.split('/').filter(Boolean).pop()||'index.html';
 if(pageName!=='admin.html'){
   const ui=document.createElement('script');ui.src='woso-site-ui.js?v=2';document.head.appendChild(ui);
   if(pageName==='lineup.html'){
     const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='woso-lineup-custom-player.css?v=2';document.head.appendChild(stylesheet);
     const feature=document.createElement('script');feature.src='woso-lineup-custom-player.js?v=2';document.head.appendChild(feature);
   }
 }

 const map = {'':'home','index.html':'home','fixture.html':'fixture','lineup.html':'lineup','interview.html':'interview','standings.html':'standings'};
 const path = location.pathname.endsWith('/') ? 'index.html' : (location.pathname.split('/').filter(Boolean).pop() || 'index.html');
 const tool = map[path];
 if(!tool || navigator.doNotTrack==='1' || navigator.globalPrivacyControl === true)return;
 let session;
 try{
   const key='wosocenter_analytics_session_v1';
   session=sessionStorage.getItem(key);
   if(!session){session=crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'') : [...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');sessionStorage.setItem(key,session)}
 }catch{session=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('')}
 function send(event,quality='unknown'){
  const payload=JSON.stringify({event,tool,quality,session});
  const url=API+'/api/track';
  try{
   if(navigator.sendBeacon && navigator.sendBeacon(url,new Blob([payload],{type:'text/plain'})))return;
  }catch{}
  try{fetch(url,{method:'POST',body:payload,headers:{'Content-Type':'text/plain'},mode:'cors',keepalive:true,credentials:'omit'}).catch(()=>{})}catch{}
 }
 // One view per normal page load, not a view for opening the export modal.
 send('page_view');
 let selectedQuality='unknown',selectedAt=0;
 // All four tools save a PNG through a temporary download anchor.
 // Both direct and "download all pages" exports fire these click events.
 document.addEventListener('click',event=>{
   const node=event.target;
   const btn=node instanceof Element ? node.closest('[data-download-scale],[data-export-quality]') : null;
   if(btn){const n=Number(btn.dataset.downloadScale||btn.dataset.exportQuality);selectedQuality=n===2?'high':n===1?'compact':'unknown';selectedAt=Date.now()}
   const a=node instanceof Element ? node.closest('a[download]') : null;
   if(!a || !/^blob:/.test(a.href||'') || !/\.png$/i.test(a.download||''))return;
   const name=a.download || '';
   const quality=/(?:^|[-_])(HQ|High|2160)(?:[-_.]|$)/i.test(name)?'high':/(?:^|[-_])(Compact|Small|1080)(?:[-_.]|$)/i.test(name)?'compact':Date.now()-selectedAt<30000?selectedQuality:'unknown';
   send('download',quality);
 },true);
})();
