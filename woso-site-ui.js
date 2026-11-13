/* WoSoCenter Studio — shared identity, browser titles and homepage-matching tool icons.
   Presentation only: does not modify poster canvas or saved project data. */
(() => {
 'use strict';
 const file=location.pathname.split('/').filter(Boolean).pop()||'index.html';
 const root=document.head;
 if(!root.querySelector('link[rel="icon"]')){
  const icon=document.createElement('link');icon.rel='icon';icon.type='image/png';icon.href='assets/lineup/woso-emblem-full.png';root.append(icon);
 }
 const icons={
  fixture:'<rect x="12" y="12" width="48" height="48" rx="9"/><path d="M22 25h28M22 35h28M22 45h19"/><circle cx="24" cy="25" r="3" fill="currentColor" stroke="none"/><circle cx="24" cy="35" r="3" fill="currentColor" stroke="none"/><circle cx="24" cy="45" r="3" fill="currentColor" stroke="none"/>',
  lineup:'<rect x="9" y="10" width="54" height="52" rx="8"/><path d="M36 10v52M9 36h54" stroke-dasharray="3 5"/><circle cx="36" cy="36" r="9"/><circle cx="22" cy="23" r="4" fill="currentColor" stroke="none"/><circle cx="50" cy="23" r="4" fill="currentColor" stroke="none"/>',
  interview:'<path d="M12 18a7 7 0 0 1 7-7h34a7 7 0 0 1 7 7v30a7 7 0 0 1-7 7H32L19 64v-9a7 7 0 0 1-7-7z"/><path d="M23 26h26M23 35h26M23 44h17"/><path d="M30 18v5m12-5v5"/>',
  standings:'<rect x="9" y="9" width="54" height="54" rx="7"/><path d="M9 23h54M9 37h54M9 50h54M21 23v40M48 23v40"/><path d="M21 16h13"/>'
 };
 const map={
  'fixture.html':{name:'کنداکتور ووسو',icon:'fixture'},
  'lineup.html':{name:'شماتیک ووسو',icon:'lineup'},
  'interview.html':{name:'مصاحبه ووسو',icon:'interview'},
  'standings.html':{name:'جدول ووسو',icon:'standings'}
 };
 const config=map[file];
 if(!config){if(file==='index.html')document.title='WosoCenter Studio';return}
 document.title=config.name+' | WosoCenter Studio';
 const identity=document.querySelector('header .identity');if(!identity)return;
 const title=identity.querySelector('strong');if(title)title.textContent=config.name;
 const desc=identity.querySelector('small');if(desc)desc.textContent=(desc.textContent||'').replace(/WoSoCenter/g,'استودیو ووسو سنتر');
 const icon=identity.querySelector('.woso-appmark');
 if(icon){icon.innerHTML=`<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:31px;height:31px;display:block;margin:auto" aria-hidden="true">${icons[config.icon]}</svg>`;icon.setAttribute('title',config.name);}
})();
