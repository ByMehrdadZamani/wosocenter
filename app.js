'use strict';
// WoSoCenter — independent, browser-only football schedule designer.
const $ = id => document.getElementById(id);
const WIDTH=1080, HEIGHT=1350, MAX_GAMES=6, HISTORY_LIMIT=500;
const STORE='wosocenter-project-v2', HISTORY_STORE='wosocenter-history-v2';
const FONTS=[
 ['Ario','آریو','پیش‌فرض'],
 ["DastNevis","دست‌نویس","دست‌نویس"],
 ["ShahGosh","شاهگوش","فانتزی"],
 ["Shokoh","شکوه","نمایشی"],
 ["Paeez","پاییز","فانتزی"],
 ["Tehran","تهران","تیتر"],
 ["Titr","تیتر","تیتر ضخیم"],
 ["Hayat","حیات","کلاسیک"],
 ["DinArabic","دینا عربیک","مدرن"],
 ["Sahel","ساحل","متنی"],
 ["Soltan","سلطان","نمایشی"],
 ["Sepahbod","سپهبد","نمایشی"],
 ["Cinema","سینما","فانتزی"],
 ["Lalezar","لاله‌زار","تیتر"],
 ["Matin","متین","متنی"],
 ["Mikhak","میخک","مدرن"],
 ["Haftad","هفتاد","نمایشی"],
 ["Casablanca","کازابلانکا","فانتزی"],
 ["GraphikArabic","گرافیک عربیک","نمایشی"],
 ["YekanBoom","یکان بوم","نمایشی"]
];
const ASSETS={titlePurple:'assets/brand/title-purple-hq.webp',titleWhite:'assets/brand/title-white-alpha.webp',logo:'assets/brand/logo-alpha.webp'};
const COLORS={background:'پس‌زمینه',patternColor:'رنگ پترن',frameColor:'کادر اصلی',cardColor:'کادر مسابقه',brandLogoColor:'لوگوی WoSoCenter',dayColor:'روز هفته',dateColor:'تاریخ',dateLineColor:'خط تاریخ',titlePurple:'عنوان برنامه',titleWhite:'عنوان بازی‌های امروز',footerColor:'آیدی کانال',telegramColor:'آیکون تلگرام',leftBg:'زمینه تیم اول',rightBg:'زمینه تیم دوم',leagueColor:'نام لیگ',timeColor:'ساعت',clockColor:'آیکون ساعت'};
const DEFAULT_MATCH={flag:'liga-af-spain',league:'لیگا اف اسپانیا',time:'۲۲:۳۰',leftTeam:'barcelona',rightTeam:'real-madrid',leftBg:'#783695',rightBg:'#dfb6e7',leftBgInitialized:true,rightBgInitialized:true,leftBgLocked:false,rightBgLocked:false,leagueColor:'#fff4ff',timeColor:'#fff4ff',clockColor:'#ae5acf',leagueFont:'Ario',timeFont:'Ario'};
const DEFAULTS={weekDay:'شنبه',monthDay:'۱۶ آبان',dayColor:'#ae5acf',dateColor:'#fff4ff',dayFont:'Ario',dateFont:'Ario',dateLineColor:'#ae5acf',titlePurple:'#ae5acf',titleWhite:'#fff4ff',brandLogoColor:'#ae5acf',footerText:'WoSoCenter',footerColor:'#ae5acf',telegramColor:'#ae5acf',footerFont:'Ario',background:'#050207',patternColor:'#320a3e',frameColor:'#050207',cardColor:'#19101d',globalFont:'Ario',patternId:'woso-petals',patternTintEnabled:true,paletteId:'woso',matches:[{...DEFAULT_MATCH}]};
const PALETTES=[
  {id:'woso',name:'ووسو سنتر',colors:['#050207','#320a3e','#ae5acf','#19101d'],settings:{"background":"#050207","patternColor":"#320a3e","frameColor":"#050207","cardColor":"#19101d","brandLogoColor":"#ae5acf","titlePurple":"#ae5acf","titleWhite":"#fff4ff","dayColor":"#ae5acf","dateColor":"#fff4ff","dateLineColor":"#ae5acf","footerColor":"#ae5acf","telegramColor":"#ae5acf"},match:{"leftBg":"#783695","rightBg":"#dfb6e7","leagueColor":"#fff4ff","timeColor":"#fff4ff","clockColor":"#ae5acf"}},
  {id:'midnight',name:'آبی نیمه‌شب',colors:['#071426','#154576','#4abafa','#10243e'],settings:{background:'#061321',patternColor:'#154576',frameColor:'#071a2c',cardColor:'#11263d',brandLogoColor:'#4abafa',titlePurple:'#3fa9f5',titleWhite:'#f5faff',dayColor:'#4abafa',dateColor:'#ffffff',dateLineColor:'#3fa9f5',footerColor:'#72cdfd',telegramColor:'#3fa9f5'},match:{leftBg:'#173b6a',rightBg:'#0b687a',leagueColor:'#ffffff',timeColor:'#e6f7ff',clockColor:'#47c7f1'}},
  {id:'emerald',name:'زمردی',colors:['#071b18','#185f50','#79e7c7','#122c26'],settings:{background:'#071b18',patternColor:'#185f50',frameColor:'#071a17',cardColor:'#142b25',brandLogoColor:'#79e7c7',titlePurple:'#56d7af',titleWhite:'#ebfff6',dayColor:'#64deb6',dateColor:'#ffffff',dateLineColor:'#56d7af',footerColor:'#8af1d0',telegramColor:'#56d7af'},match:{leftBg:'#176c5b',rightBg:'#8e743b',leagueColor:'#f7fffb',timeColor:'#f7fffb',clockColor:'#70dcb8'}},
  {id:'ruby',name:'سرخ ورزشی',colors:['#190b12','#79223e','#ff6682','#29151c'],settings:{background:'#17080e',patternColor:'#6f1b38',frameColor:'#180b10',cardColor:'#28161d',brandLogoColor:'#f4688b',titlePurple:'#f4688b',titleWhite:'#fff0f2',dayColor:'#ff8aa3',dateColor:'#fff0f2',dateLineColor:'#f4688b',footerColor:'#ff8aa3',telegramColor:'#f4688b'},match:{leftBg:'#822641',rightBg:'#c16c3d',leagueColor:'#ffffff',timeColor:'#ffffff',clockColor:'#ff819c'}},
  {id:'gold',name:'مشکی طلایی',colors:['#10100f','#4b3e22','#e5bf65','#24221d'],settings:{background:'#0b0b0b',patternColor:'#514025',frameColor:'#0c0b08',cardColor:'#24221e',brandLogoColor:'#e5bf65',titlePurple:'#e5bf65',titleWhite:'#fff7e4',dayColor:'#e5bf65',dateColor:'#fff7e4',dateLineColor:'#d1aa50',footerColor:'#e5bf65',telegramColor:'#d1aa50'},match:{leftBg:'#5f4930',rightBg:'#806c3b',leagueColor:'#fff8e8',timeColor:'#fff8e8',clockColor:'#dbb85e'}},
  {id:'ivory',name:'روشن صدفی',colors:['#f2eae9','#cba6cf','#713b88','#e1d6dd'],settings:{background:'#f2eae9',patternColor:'#cba6cf',frameColor:'#faf5f8',cardColor:'#e1d6dd',brandLogoColor:'#713b88',titlePurple:'#86409f',titleWhite:'#5c445d',dayColor:'#713b88',dateColor:'#36283e',dateLineColor:'#9a60ad',footerColor:'#713b88',telegramColor:'#86409f'},match:{leftBg:'#d6c2d8',rightBg:'#d7c690',leagueColor:'#30243a',timeColor:'#30243a',clockColor:'#86409f'}},
  ...[
    ['arctic','یخی قطبی','#eef8fc','#b8ddec','#f8fcff','#d2e7f0','#1a718e','#203e50','#4d99b4','#c0a27c'],
    ['cyber','نئون سایبری','#070b19','#292664','#0c0d23','#17192d','#36efdc','#f1f8ff','#1a3b79','#6c2fa5'],
    ['ocean','اقیانوس آرام','#031d29','#17617b','#0a2534','#153b4d','#73e6f5','#e8fcff','#197da0','#345b8d'],
    ['orange-flare','نارنجی انرژی','#21120a','#9b4415','#2d160b','#442414','#ff9e38','#fff2d7','#c55a20','#f0ac4f'],
    ['sand','کویر طلایی','#f7edd9','#dec29c','#fff9f0','#ead9bd','#aa6338','#312d31','#b98257','#8db6aa'],
    ['forest','جنگل زمردی','#0d1f18','#315f45','#152820','#203e30','#d2f98b','#f4ffe8','#276b4b','#a58b46'],
    ['royal','ارغوان سلطنتی','#190e37','#56399b','#211542','#36265f','#c7a6ff','#fbf6ff','#6035b2','#b77b9e'],
    ['steel','استیل سرد','#111925','#5b8193','#152030','#273a4a','#b7dcf0','#f4fbff','#35526e','#667f98'],
    ['rose','رز روشن','#fff1f3','#eac3d1','#fffafd','#ead8e0','#a8577f','#3a2734','#b77595','#e4a8a6'],
    ['lime','سبز لیمویی','#101c12','#385a2d','#142518','#274129','#d6fc65','#f6ffe6','#5e7b2d','#aba145'],
    ['aurora','شفق مرجانی','#101b32','#294d6a','#16273d','#203448','#ffad78','#fff2ed','#a95b68','#54b4bc']
  ].map(([id,name,background,patternColor,frameColor,cardColor,titlePurple,titleWhite,leftBg,rightBg])=>({
    id,name,colors:[background,patternColor,titlePurple,cardColor],
    settings:{background,patternColor,frameColor,cardColor,brandLogoColor:titlePurple,titlePurple,titleWhite,dayColor:titlePurple,dateColor:titleWhite,dateLineColor:titlePurple,footerColor:titlePurple,telegramColor:titlePurple},
    match:{leftBg,rightBg,leagueColor:titleWhite,timeColor:titleWhite,clockColor:titlePurple}
  }))
];
function safeHex(v,fallback){return typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():fallback;}
function validFont(v){return FONTS.some(x=>x[0]===v)?v:'Ario';}
function cleanMatch(item){const m={...DEFAULT_MATCH,...(item&&typeof item==='object'?item:{})};for(const k of ['leftBg','rightBg','leagueColor','timeColor','clockColor'])m[k]=safeHex(m[k],DEFAULT_MATCH[k]);for(const k of ['leagueFont','timeFont'])m[k]=validFont(m[k]);for(const k of ['flag','leftTeam','rightTeam','league','time'])m[k]=String(m[k]??DEFAULT_MATCH[k]).slice(0,100);for(const side of ['left','right']){
 const key=side+'BgInitialized',lock=side+'BgLocked';
 m[key]=typeof item?.[key]==='boolean'?item[key]:Boolean(m[side+'Team']);
 // Null means a v3.3 saved project: resolve using brand colors after the catalog loads.
 m[lock]=typeof item?.[lock]==='boolean'?item[lock]:null;
 }return m;}
function cleanState(item){const s={...DEFAULTS,...(item&&typeof item==='object'?item:{})};for(const k of ['dayColor','dateColor','dateLineColor','titlePurple','titleWhite','brandLogoColor','footerColor','telegramColor','background','patternColor','frameColor','cardColor'])s[k]=safeHex(s[k],DEFAULTS[k]);for(const k of ['dayFont','dateFont','footerFont','globalFont'])s[k]=validFont(s[k]);for(const k of ['weekDay','monthDay','footerText','patternId','paletteId'])s[k]=String(s[k]??DEFAULTS[k]).slice(0,80);s.patternTintEnabled=typeof s.patternTintEnabled==='boolean'?s.patternTintEnabled:true;s.matches=Array.isArray(s.matches)?s.matches.slice(0,MAX_GAMES).map(cleanMatch):[{...DEFAULT_MATCH}];if(!s.matches.length)s.matches=[{...DEFAULT_MATCH}];return s;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
function safeLoad(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
let state=cleanState(safeLoad(STORE)||safeLoad('football-conductor-v1'));
let history=[{label:'شروع ویرایش',time:Date.now(),snapshot:clone(state)}],historyIndex=0;
try{const saved=safeLoad(HISTORY_STORE);if(saved&&Array.isArray(saved.entries)&&saved.entries.length&&saved.entries.length<=HISTORY_LIMIT+1&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<saved.entries.length){history=saved.entries.map(x=>({label:String(x.label||'تغییر').slice(0,120),time:Number(x.time)||Date.now(),snapshot:cleanState(x.snapshot)}));historyIndex=saved.index;state=clone(history[historyIndex].snapshot);}}catch{}
// Each page contains its own template-01 design state; team and league catalogs remain shared.
const PROJECT_STORE='wosocenter-pages-v1', MULTI_HISTORY='wosocenter-pages-history-v1';
let pageSequence=0;
function normalizeProject(raw){
 if(!raw||!Array.isArray(raw.pages)||!raw.pages.length){
  return {pages:[{id:'page-1',title:'صفحه ۱',data:cleanState(raw&&raw.matches?raw:state)}],activePageId:'page-1'};
 }
 const used=new Set();
 const pages=raw.pages.slice(0,40).map((pg,i)=>{
  const id=String(pg.id||'page-'+(i+1)).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,35)||'page-'+(i+1);
  const safeId=used.has(id)?'page-'+(i+1)+'-'+String(i):id;used.add(safeId);
  return {id:safeId,title:String(pg.title||`صفحه ${i+1}`).slice(0,35),data:cleanState(pg.data||pg.state||pg)};
 });
 return {pages,activePageId:pages.some(pg=>pg.id===raw.activePageId)?raw.activePageId:pages[0].id};
}
let project=normalizeProject(safeLoad(PROJECT_STORE)||state);
function activePage(){return project.pages.find(pg=>pg.id===project.activePageId)||project.pages[0];}
function activatePageState(){state=activePage().data;}
function projectSnapshot(){return clone(project);}
activatePageState();
const savedMultiHistory=safeLoad(MULTI_HISTORY);
if(savedMultiHistory&&Array.isArray(savedMultiHistory.entries)&&savedMultiHistory.entries.length&&Number.isInteger(savedMultiHistory.index)&&savedMultiHistory.index>=0&&savedMultiHistory.index<savedMultiHistory.entries.length){
 history=savedMultiHistory.entries.slice(-HISTORY_LIMIT-1).map(h=>({label:String(h.label||'تغییر'),time:Number(h.time)||Date.now(),snapshot:normalizeProject(h.snapshot)}));
 historyIndex=Math.min(savedMultiHistory.index,history.length-1);
 project=normalizeProject(history[historyIndex].snapshot);activatePageState();
}else{
 history=history.map(h=>({...h,snapshot:normalizeProject(h.snapshot)}));
 historyIndex=Math.min(historyIndex,history.length-1);
 // existing historical states continue as a one-page project; last state gets latest project data
 history[historyIndex].snapshot=projectSnapshot();
}
function nextPageId(){return 'pg-'+Date.now().toString(36)+'-'+(++pageSequence).toString(36);}
function displayPage(){activatePageState();syncGlobals();refreshGames();refreshPalettes();refreshPages();preloadCurrentImages();ensureFonts().then(queueRender).catch(()=>{});queueRender();}
function refreshPages(){
 const tabs=$('pageTabs');if(!tabs)return;
 $('pageTotal').textContent=`${project.pages.length.toLocaleString('fa-IR')} صفحه`;
 tabs.innerHTML=project.pages.map((pg,i)=>`<div class="page-tile ${pg.id===project.activePageId?'current':''}"><button type="button" class="page-select" data-page-select="${esc(pg.id)}" aria-label="انتخاب صفحه ${esc(pg.title)}"><canvas class="page-thumb" width="540" height="675" data-thumb-id="${esc(pg.id)}" aria-hidden="true"></canvas><strong class="page-name">${esc(pg.title)}</strong><small class="page-sub">${pg.data.matches.length.toLocaleString('fa-IR')} بازی ${pg.id===project.activePageId?'· صفحه فعال':''}</small></button><div class="page-actions"><button type="button" data-page-move="${esc(pg.id)}" data-page-dir="-1" title="صفحه قبلی" ${i===0?'disabled':''}>↑</button><button type="button" data-page-move="${esc(pg.id)}" data-page-dir="1" title="صفحه بعدی" ${i===project.pages.length-1?'disabled':''}>↓</button><button type="button" data-page-rename="${esc(pg.id)}" title="تغییر نام">✎</button><button type="button" data-page-clone="${esc(pg.id)}" title="تکثیر">⧉</button><button type="button" data-page-download="${esc(pg.id)}" title="دانلود این صفحه" aria-label="دانلود صفحه ${i+1}">⇩</button><button type="button" data-page-delete="${esc(pg.id)}" title="حذف" ${project.pages.length===1?'disabled':''}>×</button></div></div>`).join('');
 $('addPageBtn').disabled=project.pages.length>=40;
 if($('pagesDialog').open)void refreshPageThumbs();
}
let thumbRefreshId=0;
// Keep each gallery thumbnail sharp on both desktop and high-DPI phones.
// The preview backing store is at least 540px wide, and scales with its
// onscreen size, capped to avoid using full-size canvases for every page.
function resizePageThumb(canvas){
 const shownWidth=canvas.getBoundingClientRect().width||canvas.parentElement?.getBoundingClientRect().width||216;
 const dpr=Math.min(2.5,Math.max(1,window.devicePixelRatio||1));
 const width=Math.max(540,Math.min(900,Math.round(shownWidth*Math.max(2,dpr)/4)*4));
 const height=Math.round(width*HEIGHT/WIDTH);
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
}
function preloadForPage(data){const pattern=findPattern(data.patternId)||patterns[0];const paths=[...Object.values(ASSETS),pattern?.image,...data.matches.flatMap(m=>[findTeam(m.leftTeam)?.image,findTeam(m.rightTeam)?.image,findFlag(m.flag)?.image])];return Promise.all(paths.filter(Boolean).map(preload));}
async function refreshPageThumbs(){
 const rid=++thumbRefreshId,dialog=$('pagesDialog');
 for(const pg of project.pages){
  if(rid!==thumbRefreshId||!dialog.open)return;
  const canvas=[...$('pageTabs').querySelectorAll('canvas[data-thumb-id]')].find(el=>el.dataset.thumbId===pg.id);
  if(!canvas)continue;
  resizePageThumb(canvas);
  // Immediate first paint, then a second paint when that page's images/fonts are ready.
  drawPoster(canvas,pg.data);
  try{
   await preloadForPage(pg.data);
   const families=new Set([pg.data.dayFont,pg.data.dateFont,pg.data.footerFont,...pg.data.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);
   await loadFontFamilies([...families]);
  }catch(e){console.warn('Page thumbnail assets',e);}
  if(rid!==thumbRefreshId||!dialog.open)return;
  drawPoster(canvas,pg.data);
 }
}
function openPages(){refreshPages();$('pagesDialog').showModal();void refreshPageThumbs();try{$('pagesDialog').focus({preventScroll:true});}catch{}}
let pagePreviewResizeTimer;
window.addEventListener('resize',()=>{if(!$('pagesDialog')?.open)return;clearTimeout(pagePreviewResizeTimer);pagePreviewResizeTimer=setTimeout(()=>void refreshPageThumbs(),160);});

function addPage(fromId,duplicate=false){
 if(project.pages.length>=40){message('حداکثر ۴۰ صفحه در هر پروژه قابل ایجاد است.','warning');return;}
 const source=project.pages.find(pg=>pg.id===fromId)||activePage();
 const copy=clone(source.data);
 if(!duplicate){
  const style=source.data.matches[0]||DEFAULT_MATCH;
  copy.matches=[{...DEFAULT_MATCH,leagueColor:style.leagueColor,timeColor:style.timeColor,clockColor:style.clockColor,leagueFont:style.leagueFont,timeFont:style.timeFont,leftBg:style.leftBg,rightBg:style.rightBg,leftBgInitialized:true,rightBgInitialized:true,leftBgLocked:style.leftBgLocked,rightBgLocked:style.rightBgLocked}];
 }
 const pg={id:nextPageId(),title:`صفحه ${project.pages.length+1}`,data:cleanState(copy)};
 const idx=project.pages.findIndex(p=>p.id===source.id);
 project.pages.splice(idx+1,0,pg);project.activePageId=pg.id;displayPage();commitHistory(duplicate?'کپی کامل صفحه':'افزودن صفحه جدید');
}
function moveConductorPage(id,delta){
 const index=project.pages.findIndex(p=>p.id===id),target=index+delta;
 if(index<0||target<0||target>=project.pages.length)return;
 const [page]=project.pages.splice(index,1);project.pages.splice(target,0,page);
 displayPage();commitHistory('تغییر ترتیب صفحات');
}
function renameConductorPage(id){
 const pg=project.pages.find(p=>p.id===id);if(!pg)return;
 const title=prompt('نام صفحه:',pg.title);
 if(!title?.trim())return;
 pg.title=title.trim().slice(0,50);displayPage();commitHistory('تغییر نام صفحه');
}
async function downloadConductorPage(id){
 const page=project.pages.find(p=>p.id===id);if(!page)return;
 try{
  await preloadForPage(page.data);
  const families=new Set([page.data.dayFont,page.data.dateFont,page.data.footerFont,...page.data.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);
  await loadFontFamilies([...families]);
  const output=document.createElement('canvas');output.width=WIDTH;output.height=HEIGHT;
  drawPoster(output,page.data);
  const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('PNG export failed');
  downloadBlob(blob,'WoSoCenter-Fixture-Page-'+String(project.pages.indexOf(page)+1).padStart(2,'0')+'.png');
  message('تصویر صفحه به‌صورت PNG جداگانه دانلود شد.');
 }catch(e){console.error(e);message('خطا در دریافت تصویر این صفحه.','error')}
}
function deletePage(id){
 if(project.pages.length<=1)return;
 const idx=project.pages.findIndex(pg=>pg.id===id);if(idx<0)return;
 if(!confirm(`صفحه «${project.pages[idx].title}» حذف شود؟`))return;
 project.pages.splice(idx,1);
 if(project.activePageId===id)project.activePageId=project.pages[Math.min(idx,project.pages.length-1)].id;
 displayPage();commitHistory('حذف صفحه');
}
let teams=[],flags=[],patterns=[],activeTab='games';
const images=new Map(),tinted=new Map(),hueCache=new Map();
let renderPending=false,feedbackTimer=null,saveTimer=null,pickContext=null,colorContext=null,colorAtOpen='',colorDirty=false;
const findTeam=id=>teams.find(t=>t.id===id),findFlag=id=>flags.find(f=>f.id===id),findPattern=id=>patterns.find(p=>p.id===id);
const image=path=>images.get(path)||null;
// Never let an unreachable image lock the initial render or image export.
// A late image can still paint when the connection recovers.
const IMAGE_WAIT_MS=6500;
const pendingImages=new Map();
function preload(path){
 if(!path||images.has(path))return Promise.resolve();
 if(pendingImages.has(path))return pendingImages.get(path);
 const job=new Promise(resolve=>{
  const img=new Image();let finished=false;
  const timer=setTimeout(()=>finish(),IMAGE_WAIT_MS);
  function finish(){if(finished)return;finished=true;clearTimeout(timer);pendingImages.delete(path);resolve();}
  img.onload=()=>{images.set(path,img);tinted.clear();hueCache.clear();queueRender();finish();};
  img.onerror=()=>{images.set(path,null);finish();};
  img.src=path;
 });
 pendingImages.set(path,job);return job;
}
async function fetchTimed(path,limit=7000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),limit);
 try{return await fetch(path,{cache:'no-store',signal:controller.signal});}
 finally{clearTimeout(timer);}
}
async function loadList(path,fallback){try{const res=await fetchTimed(path);if(!res.ok)throw Error(res.status);const list=await res.json();if(!Array.isArray(list))throw Error('List is not an array');return list.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.image==='string'&&/^assets\/[\w./-]+\.(svg|png|webp|jpg|jpeg)$/i.test(x.image));}catch{return fallback;}}
// Optional brand-shade suggestions. Kept separate so adding teams never replaces the team's catalog.
async function loadTeamColors(){
  try{
    const res=await fetchTimed('data/team-colors.json');
    if(!res.ok)return {};
    const data=await res.json();
    return data&&typeof data==='object'&&!Array.isArray(data)?data:{};
  }catch{return {};}
}
const fallbackTeams=[{id:'barcelona',name:'بارسلونا',image:'assets/teams/barcelona.webp',color:'#873d58'},{id:'real-madrid',name:'رئال مادرید',image:'assets/teams/real-madrid.webp',color:'#e2b944'},{id:'bayern-munich',name:'بایرن مونیخ',image:'assets/teams/bayern-munich.webp',color:'#b63a4a'},{id:'srwt',name:'سروت',image:'assets/teams/srwt.webp',color:'#83182e'},{id:'nordsjaelland',name:'نورشلاند',image:'assets/teams/nordsjaelland.webp',color:'#ecce24'}];
const fallbackFlags=[{id:'liga-af-spain',name:'لیگا اف اسپانیا',image:'assets/leagues/liga-af-spain.webp',type:'league'}];
const fallbackPatterns=[{id:'woso-petals',name:'گلبرگ کلاسیک',image:'assets/patterns/woso-petals.webp',tileWidth:432,tileHeight:430,mode:'mask'}];
const fontInfo=id=>FONTS.find(f=>f[0]===id)||FONTS[0];
const fontButton=(key,value,kind='game')=>`<button type="button" class="font-pick" data-${kind==='game'?'game':'global'}-font="${esc(key)}" aria-label="انتخاب فونت"><span class="font-pick-title" style="font-family:'${esc(validFont(value))}',Tahoma,sans-serif">${esc(fontInfo(value)[1])}</span><span class="font-pick-chevron">⌄</span></button>`;
function field(caption,name,value,opts={}){const {type='text',wide=false,maxlength=90}=opts;let input;if(type==='color')input=`<button type="button" class="color-trigger" data-game-color="${name}" aria-label="${esc(caption)}"></button>`;else if(type==='select')input=fontButton(name,value);else input=`<input data-field="${name}" type="text" maxlength="${maxlength}" value="${esc(value)}" />`;return `<label class="${wide?'span2':''}">${esc(caption)}${input}</label>`;}
function assetPickField(label,kind,choice,wide=false){const a=kind==='flag'?findFlag(choice):findTeam(choice);return `<div class="asset-field ${wide?'span2':''}"><span class="field-label">${esc(label)}</span><button class="asset-pick" type="button" data-pick="${kind}" aria-label="${esc(label)}"><span class="asset-sample">${a?`<img src="${esc(a.image)}" alt="" loading="lazy" />`:'⚽'}</span><span class="asset-pick-name">${esc(a?.name||'انتخاب کنید')}</span><span class="pick-arrow">⌄</span></button></div>`;}
function gameMarkup(m,i){const title=`${findTeam(m.leftTeam)?.name||'تیم اول'} — ${findTeam(m.rightTeam)?.name||'تیم دوم'}`;return `<article class="game-editor" data-index="${i}">
  <div class="game-head"><div><h3>مسابقه ${i+1}</h3><div class="game-info">${esc(title)}</div></div><button class="remove-game" type="button" title="حذف مسابقه" aria-label="حذف مسابقه ${i+1}" data-remove="${i}">×</button></div>
  <div class="field-grid">
    ${assetPickField('پرچم یا لوگوی لیگ','flag',m.flag)}${field('نام لیگ','league',m.league,{maxlength:48})}
    ${assetPickField('لوگوی تیم اول (چپ)','leftTeam',m.leftTeam)}${assetPickField('لوگوی تیم دوم','rightTeam',m.rightTeam)}
    ${field('ساعت بازی','time',m.time,{maxlength:35})}<div></div>
    ${field('پس‌زمینه لوگوی اول','leftBg',m.leftBg,{type:'color'})}${field('پس‌زمینه لوگوی دوم','rightBg',m.rightBg,{type:'color'})}
  </div>
  <details class="details"><summary>رنگ و فونت اختصاصی بازی</summary><div class="field-grid">
    ${field('رنگ نام لیگ','leagueColor',m.leagueColor,{type:'color'})}${field('رنگ ساعت','timeColor',m.timeColor,{type:'color'})}${field('رنگ آیکون ساعت','clockColor',m.clockColor,{type:'color'})}<div></div>
    ${field('فونت نام لیگ','leagueFont',m.leagueFont,{type:'select'})}${field('فونت ساعت','timeFont',m.timeFont,{type:'select'})}
  </div></details></article>`;}
function refreshColors(){document.querySelectorAll('[data-global-color]').forEach(b=>paintColorButton(b,state[b.dataset.globalColor]));document.querySelectorAll('.game-editor').forEach(article=>{const m=state.matches[Number(article.dataset.index)];if(m)article.querySelectorAll('[data-game-color]').forEach(b=>paintColorButton(b,m[b.dataset.gameColor]));});}
function paintColorButton(b,hex){if(!b||!hex)return;b.innerHTML=`<span class="color-chip" style="background:${esc(hex)}"></span><span class="hex-caption" dir="ltr">${esc(hex.toUpperCase())}</span><span class="color-chevron">⌄</span>`;}
function refreshGames(){const wasOpen=[...document.querySelectorAll('.game-editor')].map(e=>e.querySelector('.details')?.open);$('gamesList').innerHTML=state.matches.map(gameMarkup).join('');[...document.querySelectorAll('.game-editor')].forEach((e,i)=>{if(wasOpen[i])e.querySelector('.details').open=true;});$('gameCount').textContent=`${state.matches.length} از ${MAX_GAMES} مسابقه`;$('addGameBtn').disabled=state.matches.length>=MAX_GAMES;$('addGameBtn').textContent=state.matches.length>=MAX_GAMES?'ظرفیت کامل است':'＋ افزودن بازی';refreshColors();}
function syncGlobals(){
 for(const key of ['weekDay','monthDay','footerText'])if($(key))$(key).value=state[key];
 for(const key of ['dayFont','dateFont','footerFont','globalFont']){
   const b=document.querySelector(`[data-global-font="${key}"]`);
   if(b)b.outerHTML=fontButton(key,state[key],'global');
 }
 refreshColors();syncPattern();}

function syncPattern(){const p=findPattern(state.patternId)||patterns[0];if(!p)return;if(state.patternId!==p.id)state.patternId=p.id;
  $('patternName').textContent=p.name;$('patternSample').innerHTML=`<img src="${esc(p.image)}" alt="" />`;
  const toggle=$('patternTintToggle');const canRecolor=p.mode==='mask'||p.mode==='hue';const enabled=p.mode==='mask'||(p.mode==='hue'&&state.patternTintEnabled);
  toggle.checked=enabled;toggle.disabled=p.mode!=='hue';
  $('patternColorPicker').hidden=!canRecolor||!enabled;
  $('patternTintHint').textContent=p.mode==='mask'?'این پترن همیشه با رنگ انتخابی شما نمایش داده می‌شود.':p.mode==='image'?'این تصویر فقط با رنگ اصلی نمایش داده می‌شود.':enabled?'بخش‌های رنگی پترن دقیقاً با رنگ انتخابی نمایش داده می‌شوند؛ سایه‌ها حفظ می‌شوند.':'رنگ اصلی تصویر نمایش داده می‌شود.';
}
function message(text,kind='success'){$('feedback').textContent=text;$('feedback').className='feedback '+kind;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{if($('feedback').textContent===text)$('feedback').textContent='';},5500);}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{
 try{
  localStorage.setItem(PROJECT_STORE,JSON.stringify(projectSnapshot()));
  // History is bounded by count and storage size; preserve newest entries if storage fills.
  let entries=history.slice(),index=historyIndex;
  while(entries.length){
   try{localStorage.setItem(MULTI_HISTORY,JSON.stringify({entries,index}));break;}
   catch(e){if(entries.length<2)throw e;entries.shift();index=Math.max(0,index-1);}
  }
  $('saveIndicator').textContent='✓ ذخیره شد';
 }catch{$('saveIndicator').textContent='ذخیره محلی در دسترس نیست';}
},350);}
function queueRender(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;render();});}
function updateHistoryButtons(){const canUndo=historyIndex>0,canRedo=historyIndex<history.length-1;for(const id of ['undoBtn','historyUndo'])$(id).disabled=!canUndo;for(const id of ['redoBtn','historyRedo'])$(id).disabled=!canRedo;$('historyCount').textContent=`${history.length-1} تغییر · مرحله ${historyIndex}`;if(activeTab==='history')refreshHistoryList();}
function commitHistory(label){history.splice(historyIndex+1);history.push({label,time:Date.now(),snapshot:projectSnapshot()});if(history.length>HISTORY_LIMIT+1)history.shift();historyIndex=history.length-1;updateHistoryButtons();persist();queueRender();}
function restoreHistory(index){if(index<0||index>=history.length||index===historyIndex)return;historyIndex=index;project=normalizeProject(clone(history[index].snapshot));displayPage();updateHistoryButtons();persist();queueRender();}
function undo(){restoreHistory(historyIndex-1);}function redo(){restoreHistory(historyIndex+1);}
function refreshHistoryList(){$('historyList').innerHTML=history.map((h,i)=>`<button type="button" class="history-item ${i===historyIndex?'selected':''} ${i>historyIndex?'future':''}" data-revision="${i}"><span class="history-num">${i}</span><span class="history-label">${esc(h.label)}</span><time>${new Date(h.time).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}</time></button>`).reverse().join('');}
function switchTab(name){activeTab=name;document.querySelectorAll('.tab').forEach(t=>{const chosen=t.dataset.tab===name;t.classList.toggle('active',chosen);t.setAttribute('aria-selected',String(chosen));});for(const n of ['games','header','design','history'])$(n+'Tab').classList.toggle('hidden',name!==n);if(name==='history')refreshHistoryList();}
function teamLogoPaletteColor(teamId,fallback){return safeHex(findTeam(teamId)?.color,fallback);}
function teamLogoColorsActive(){return state.matches.length>0&&state.matches.every(m=>m.leftBg===teamLogoPaletteColor(m.leftTeam,m.leftBg)&&m.rightBg===teamLogoPaletteColor(m.rightTeam,m.rightBg));}
function selectTeamLogoPalette(){
 // This special option is an overlay: leave the chosen pattern and every other palette color untouched.
 for(const match of state.matches){
  match.leftBg=teamLogoPaletteColor(match.leftTeam,match.leftBg);
  match.rightBg=teamLogoPaletteColor(match.rightTeam,match.rightBg);
  match.leftBgInitialized=true;match.rightBgInitialized=true;
  match.leftBgLocked=false;match.rightBgLocked=false;
 }
 refreshGames();refreshPalettes();commitHistory('رنگ لوگو تیم · رنگ اختصاصی قاب تیم‌ها');
}
function refreshPalettes(){const recommended=findPattern(state.patternId)?.suggestedPalette;const chosenPalette=recommended?{...recommended,id:'suggested-'+state.patternId,recommended:true}:null;const options=chosenPalette?[chosenPalette,...PALETTES]:PALETTES;const a=state.matches[0],left=a?teamLogoPaletteColor(a.leftTeam,'#783695'):'#783695',right=a?teamLogoPaletteColor(a.rightTeam,'#dfb6e7'):'#dfb6e7';
 const active=teamLogoColorsActive();
 const logoPalette=`<button type="button" data-team-logo-palette="1" class="palette-option team-logo-palette ${active?'selected':''}" aria-label="رنگ لوگو تیم" aria-pressed="${active}"><span class="palette-dots"><i style="background:${left}"></i><i style="background:${right}"></i></span><strong>رنگ لوگو تیم</strong><small>فقط رنگ قاب لوگوی تیم‌ها</small>${active?'<b>✓</b>':''}</button>`;
 $('paletteList').innerHTML=logoPalette+options.map(p=>`<button type="button" data-palette="${p.id}" class="palette-option ${state.paletteId===p.id?'selected':''} ${p.recommended?'palette-recommended':''}"><span class="palette-dots">${p.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span>${esc(p.name)}</span>${p.recommended?'<em class="palette-tag">پالت پیشنهادی این پترن</em>':''}${state.paletteId===p.id?'<b>✓</b>':''}</button>`).join('');}
function selectPalette(id){const p=findPattern(state.patternId);const suggested=p?.suggestedPalette?{...p.suggestedPalette,id:'suggested-'+p.id}:null;const palette=(suggested?.id===id?suggested:null)||PALETTES.find(x=>x.id===id);if(!palette)return;Object.assign(state,palette.settings);state.matches.forEach(m=>{Object.assign(m,palette.match);m.leftBgInitialized=true;m.rightBgInitialized=true;m.leftBgLocked=true;m.rightBgLocked=true;});state.paletteId=id;syncGlobals();refreshGames();refreshPalettes();commitHistory(`ترکیب رنگی «${palette.name}»`);}
function setTheme(isLight){document.documentElement.dataset.theme=isLight?'light':'dark';$('themeToggle').textContent=isLight?'☾':'☀';$('themeToggle').title=isLight?'حالت تاریک':'حالت روشن';try{localStorage.setItem('wosocenter-ui-theme',isLight?'light':'dark');}catch{}}
function openAsset(kind,index){pickContext={kind,index};const group=kind==='flag'?flags:kind==='patternId'?patterns:teams;$('assetDialogTitle').textContent=kind==='flag'?'انتخاب پرچم یا لوگوی لیگ':kind==='patternId'?'انتخاب پترن پس‌زمینه':'انتخاب تیم و لوگو';$('assetSearch').value='';renderAssetResults(group,'');$('assetDialog').showModal();
  // Do not auto-focus the input: on phones the keyboard must stay closed until a deliberate tap.
  try{$('assetDialog').focus({preventScroll:true});}catch{$('assetDialog').focus();}}
// Persian/Arabic letter variants and Persian/Latin numerals are searchable together.
function normalizeTeamQuery(value){return String(value??'').normalize('NFKC').toLocaleLowerCase('fa-IR').replace(/[آأإٱ]/g,'ا').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ةۀ]/g,'ه').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[\u064b-\u065f\u0670\u200c\u200d]/g,'').replace(/[_\-]+/g,' ').replace(/\s+/g,' ').trim();}
const SUGGESTED_TEAM_IDS=['barcelona','real-madrid','bayern-munich'];
function renderAssetResults(group,search){const q=normalizeTeamQuery(search);const isTeam=pickContext?.kind==='leftTeam'||pickContext?.kind==='rightTeam';let filtered=group.filter(x=>normalizeTeamQuery(x.name).includes(q)||normalizeTeamQuery(x.id).includes(q));if(isTeam){filtered.sort((a,b)=>{if(!q){const ai=SUGGESTED_TEAM_IDS.indexOf(a.id),bi=SUGGESTED_TEAM_IDS.indexOf(b.id);if(ai!==bi)return ai===-1?1:bi===-1?-1:ai-bi;return a.name.localeCompare(b.name,'fa');}const an=normalizeTeamQuery(a.name),bn=normalizeTeamQuery(b.name);const ar=an.startsWith(q)?0:an.split(' ').some(w=>w.startsWith(q))?1:2,br=bn.startsWith(q)?0:bn.split(' ').some(w=>w.startsWith(q))?1:2;return ar-br||a.name.localeCompare(b.name,'fa');});}
const visible=filtered.slice(0,250);$('assetResults').classList.toggle('pattern-grid',pickContext?.kind==='patternId');$('assetDialog').classList.toggle('pattern-dialog',pickContext?.kind==='patternId');$('assetCount').textContent=`${filtered.length.toLocaleString('fa-IR')} مورد ${filtered.length>250?'· برای نتایج بیشتر جست‌وجو کنید':''}`;$('assetResults').innerHTML=visible.map(x=>pickContext?.kind==='patternId'?`<button class="asset-result pattern-item" type="button" data-asset-id="${esc(x.id)}"><span class="pattern-thumb"><img loading="lazy" src="${esc(x.thumb||x.image)}" alt="" /></span><span class="result-name">${esc(x.name)}</span></button>`:`<button class="asset-result" type="button" data-asset-id="${esc(x.id)}"><span class="result-thumb"><img loading="lazy" src="${esc(x.image)}" alt="" /></span><span class="result-name">${esc(x.name)}</span><span class="result-meta">${esc(x.type==='league'?'لوگوی لیگ':isTeam&&!q&&SUGGESTED_TEAM_IDS.includes(x.id)?'پیشنهادی':'')}</span></button>`).join('')||'<p class="empty-results">موردی یافت نشد.</p>';}

function chooseAsset(id){if(!pickContext)return;const {kind,index}=pickContext;const group=kind==='flag'?flags:kind==='patternId'?patterns:teams;const chosen=group.find(x=>x.id===id);if(!chosen)return;if(kind==='patternId'){state.patternId=id;state.patternTintEnabled=chosen.mode==='mask'||chosen.recolorDefault===true;syncPattern();refreshPalettes();}else if(Number.isInteger(index)&&state.matches[index]){const match=state.matches[index];if(kind==='leftTeam'||kind==='rightTeam'){const side=kind==='leftTeam'?'left':'right',initKey=side+'BgInitialized',bgKey=side+'Bg';if(!match[side+'BgLocked']){match[bgKey]=safeHex(chosen.color,match[bgKey]);}match[initKey]=true;}match[kind]=id;if(kind==='flag')match.league=chosen.name;refreshGames();}preload(chosen.image);$('assetDialog').close();commitHistory(`${kind==='patternId'?'پترن':kind==='flag'?'پرچم یا لیگ':'تیم'}: ${chosen.name}`);}

// Font picker is a custom dialog; the preview is painted in the same family as the output.
let fontContext=null;
function openFont(kind,key,index){
 fontContext={kind,key,index};
 $('fontSearch').value='';
 renderFontOptions();
 $('fontDialog').showModal();
 try{$('fontDialog').focus({preventScroll:true});}catch{$('fontDialog').focus();}
}
function fontCurrentValue(){return !fontContext?DEFAULTS.globalFont:fontContext.kind==='global'?state[fontContext.key]:(state.matches[fontContext.index]?.[fontContext.key]||'Ario');}
function renderFontOptions(){
 const q=normalizeTeamQuery($('fontSearch').value),selected=fontCurrentValue();
 const all=FONTS.filter(f=>normalizeTeamQuery(f[1]).includes(q)||normalizeTeamQuery(f[0]).includes(q));
 $('fontCount').textContent=all.length.toLocaleString('fa-IR')+' فونت · پیش‌نمایش «بارسلونا»';
 $('fontResults').innerHTML=all.map(([id,name,style])=>`<button class="font-option ${id===selected?'selected':''}" data-font-id="${esc(id)}" type="button"><span class="font-demo" dir="rtl" style="font-family:'${esc(id)}',Tahoma,sans-serif">بارسلونا</span><span class="font-option-meta"><strong>${esc(name)}</strong><small>${esc(style)}</small></span><span class="font-option-check">${id===selected?'✓':''}</span></button>`).join('')||'<p class="empty-results">فونتی یافت نشد.</p>';
}
function chooseFont(id){
 if(!fontContext||!FONTS.some(f=>f[0]===id))return;
 const {kind,key,index}=fontContext;
 if(kind==='global'){
   if(state[key]!==id){state[key]=id;syncGlobals();commitHistory('تغییر فونت '+fontInfo(id)[1]);}
 }else if(state.matches[index]&&state.matches[index][key]!==id){
   state.matches[index][key]=id;refreshGames();commitHistory('تغییر فونت بازی '+(index+1)+' · '+fontInfo(id)[1]);
 }
 $('fontDialog').close();fontContext=null;
 ensureFonts().then(queueRender);
}

// Color modal: works via touch gestures, hex field, device-native chooser and preset chips.
function hexToRgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function hsvToHex(h,s,v){const f=n=>{const k=(n+h/60)%6;return Math.round((v-v*s*Math.max(Math.min(k,4-k,1),0))*255);};return '#'+[f(5),f(3),f(1)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function rgbToHsv(hex){const [r,g,b]=hexToRgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;if(h<0)h+=360;}return {h,s:max?d/max:0,v:max};}
let pickerHSV={h:270,s:1,v:1};
function getColorValue(){if(!colorContext)return '#ffffff';return colorContext.kind==='global'?state[colorContext.key]:state.matches[colorContext.index]?.[colorContext.key]||'#ffffff';}
function setColorValue(hex){if(!colorContext||!/^#[0-9a-f]{6}$/i.test(hex))return;hex=hex.toLowerCase();if(colorContext.kind==='global')state[colorContext.key]=hex;else if(state.matches[colorContext.index]){const m=state.matches[colorContext.index];m[colorContext.key]=hex;if(colorContext.key==='leftBg'||colorContext.key==='rightBg'){m[colorContext.key+'Initialized']=true;m[colorContext.key.replace('Bg','BgLocked')]=true;}}state.paletteId='';colorDirty=colorDirty||hex!==colorAtOpen;refreshColors();queueRender();}
function updatePickerView(hex){pickerHSV=rgbToHsv(hex);$('pickerHue').value=Math.round(pickerHSV.h);$('pickerSV').style.setProperty('--pure-hue',hsvToHex(pickerHSV.h,1,1));$('pickerTarget').style.left=(pickerHSV.s*100)+'%';$('pickerTarget').style.top=((1-pickerHSV.v)*100)+'%';$('colorPreview').style.background=hex;$('colorNative').value=hex;$('colorHex').value=hex.toUpperCase();}
function openColor(kind,key,index){colorContext={kind,key,index};colorAtOpen=getColorValue();colorDirty=false;$('colorDialogTitle').textContent='انتخاب رنگ «'+(COLORS[key]||key)+'»';updatePickerView(colorAtOpen);$('colorDialog').showModal();}
function liveColor(hex){setColorValue(hex);updatePickerView(hex);}
function finishColor(){if(!colorContext)return;const finalColor=getColorValue();if(colorDirty&&finalColor!==colorAtOpen){refreshPalettes();commitHistory(`رنگ ${COLORS[colorContext.key]||colorContext.key}`);}colorContext=null;colorDirty=false;}
function handleSvPointer(e){const rect=$('pickerSV').getBoundingClientRect();if(!rect.width||!rect.height)return;pickerHSV.s=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));pickerHSV.v=Math.max(0,Math.min(1,1-(e.clientY-rect.top)/rect.height));liveColor(hsvToHex(pickerHSV.h,pickerHSV.s,pickerHSV.v));}
function populateColorSwatches(){const colors=['#ffffff','#030303','#181818','#a457bf','#9141aa','#85152d','#ffdb0d','#f8f8f8','#4abafa','#79e7c7','#ff6682','#e5bf65','#713b88','#f2eae9','#5c445d'];$('colorSwatches').innerHTML=colors.map(c=>`<button class="quick-color" type="button" style="background:${c}" data-quick-color="${c}" title="${c}" aria-label="انتخاب رنگ ${c}"></button>`).join('');}
// Fixed 1080 × 1350 canvas drawing (shared by preview and PNG download).
function roundPath(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function tintedImage(path,color){const src=image(path);if(!src)return null;const key=path+'|'+color;if(tinted.has(key))return tinted.get(key);const temp=document.createElement('canvas');temp.width=src.naturalWidth;temp.height=src.naturalHeight;const t=temp.getContext('2d');t.drawImage(src,0,0);t.globalCompositeOperation='source-in';t.fillStyle=color;t.fillRect(0,0,temp.width,temp.height);t.globalCompositeOperation='source-over';tinted.set(key,temp);if(tinted.size>75)tinted.delete(tinted.keys().next().value);return temp;}
// Exact HSV colorization: CSS hue-rotate uses an RGB color matrix and can
// turn a requested purple into blue. Set the hue of colored source pixels to
// the chosen hue directly, while preserving brightness/texture, highlights,
// low-saturation neutrals and original alpha. Never change the image asset.
function recoloredPattern(path,color){
  const src=image(path);if(!src)return null;
  const key='hsv|'+path+'|'+color.toLowerCase();
  if(hueCache.has(key))return hueCache.get(key);
  const temp=document.createElement('canvas');temp.width=src.naturalWidth;temp.height=src.naturalHeight;
  const t=temp.getContext('2d',{willReadFrequently:true});
  t.drawImage(src,0,0);
  try{
    const pixels=t.getImageData(0,0,temp.width,temp.height),data=pixels.data;
    const target=rgbToHsv(color);
    const hue=target.h/60,sector=Math.floor(hue)%6,fraction=hue-Math.floor(hue);
    const chromaFactor=1-Math.abs((hue%2)-1);
    const brightnessFactor=.55+.45*target.v;
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]===0)continue;
      const r=data[i],g=data[i+1],b=data[i+2];
      const high=Math.max(r,g,b),low=Math.min(r,g,b),span=high-low;
      // Keep black backgrounds, whites, gray textures and faint neutral lines.
      if(high<12||span<Math.max(8,high*.085))continue;
      const saturation=target.s*(.55+.45*span/high);
      const value=high*brightnessFactor,chrom=value*saturation;
      const x=chrom*chromaFactor,base=value-chrom;
      let nr=0,ng=0,nb=0;
      switch(sector){
        case 0:nr=chrom;ng=x;break;
        case 1:nr=x;ng=chrom;break;
        case 2:ng=chrom;nb=x;break;
        case 3:ng=x;nb=chrom;break;
        case 4:nr=x;nb=chrom;break;
        default:nr=chrom;nb=x;
      }
      data[i]=Math.round(nr+base);
      data[i+1]=Math.round(ng+base);
      data[i+2]=Math.round(nb+base);
    }
    t.putImageData(pixels,0,0);
  }catch(err){
    // Unsupported/tainted canvas: return the unmodified original rather than
    // a blank preview or a crash. Local site images are same-origin normally.
    console.warn('Pattern recoloring unavailable:',err);
    return src;
  }
  hueCache.set(key,temp);if(hueCache.size>8)hueCache.delete(hueCache.keys().next().value);
  return temp;
}
function drawCover(c,img,focusX=.5,focusY=.5){
  const sw=img.width||img.naturalWidth,sh=img.height||img.naturalHeight;
  const sourceRatio=sw/sh,targetRatio=WIDTH/HEIGHT;
  let cropW=sw,cropH=sh;
  if(sourceRatio>targetRatio)cropW=sh*targetRatio;else cropH=sw/targetRatio;
  const sx=(sw-cropW)*Math.max(0,Math.min(1,Number(focusX)||0)),sy=(sh-cropH)*Math.max(0,Math.min(1,Number(focusY)||0));
  c.drawImage(img,sx,sy,cropW,cropH,0,0,WIDTH,HEIGHT);
}
function drawTint(c,path,x,y,w,h,color){const src=tintedImage(path,color);if(src)c.drawImage(src,x,y,w,h);}
function drawRtl(c,text,x,y,maxWidth,font,color,size=28,weight=800){c.save();c.direction='rtl';c.textAlign='right';c.textBaseline='alphabetic';c.font=`${weight} ${size}px "${validFont(font)}","Mikhak",Tahoma,sans-serif`;c.fillStyle=color;c.fillText(String(text??''),x,y,maxWidth);c.restore();}
function drawClock(c,x,y,color){c.save();c.strokeStyle=color;c.lineWidth=2.7;c.lineCap='round';c.beginPath();c.arc(x,y,14,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x,y-9);c.lineTo(x,y+0.5);c.lineTo(x+6,y+5.5);c.stroke();c.restore();}
function drawTelegram(c,x,y,s,color){c.save();c.translate(x,y);c.scale(s/40,s/40);c.strokeStyle=color;c.lineJoin='round';c.lineCap='round';c.lineWidth=3.3;c.beginPath();c.moveTo(3,17);c.lineTo(37,4);c.lineTo(29,36);c.lineTo(21,27);c.lineTo(15,35);c.lineTo(15,23);c.closePath();c.stroke();c.beginPath();c.moveTo(15,23);c.lineTo(34,7);c.stroke();c.restore();}
function contain(c,img,x,y,w,h){if(!img)return;const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);const dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
function drawDate(c){
  const anchorX=965,railX=986;
  c.save();c.strokeStyle=state.dateLineColor;c.lineWidth=5;c.lineCap='round';c.setLineDash([2,10]);
  c.beginPath();c.moveTo(railX,92);c.lineTo(railX,163);c.stroke();c.restore();
  drawRtl(c,state.weekDay,anchorX,115,194,state.dayFont,state.dayColor,28,800);
  drawRtl(c,state.monthDay,anchorX,162,194,state.dateFont,state.dateColor,29,800);
}
function drawBrand(c){drawTint(c,ASSETS.logo,85,70,146,122,state.brandLogoColor);drawTint(c,ASSETS.titleWhite,311,87,459,79,state.titleWhite);drawTint(c,ASSETS.titlePurple,311,87,459,79,state.titlePurple);}
function drawGame(c,m,index){const x=87,y=215+index*171,w=899,h=157;c.save();roundPath(c,x,y,w,h,24);c.clip();c.fillStyle=state.cardColor;c.fillRect(x,y,w,h);c.fillStyle=m.leftBg;c.fillRect(x,y,211,h);c.fillStyle=m.rightBg;c.fillRect(x+211,y,211,h);const t1=findTeam(m.leftTeam),t2=findTeam(m.rightTeam);contain(c,image(t1?.image),x+10,y+5,191,146);contain(c,image(t2?.image),x+221,y+5,191,146);c.restore();const iconCX=x+866, textAnchorX=x+833;
  const flag=findFlag(m.flag);if(flag){const flagImg=image(flag.image);if(flagImg)contain(c,flagImg,iconCX-21,y+26,42,42);}
  drawRtl(c,m.league,textAnchorX,y+57,365,m.leagueFont,m.leagueColor,28,800);
  drawClock(c,iconCX,y+105,m.clockColor);
  drawRtl(c,'ساعت '+m.time,textAnchorX,y+113,365,m.timeFont,m.timeColor,27,800);}
function drawFooter(c){const label=String(state.footerText||'');const isLatin=/^[\x00-\x7f\s]+$/.test(label),font=validFont(state.footerFont);c.font=`800 29px "${font}","Mikhak",Tahoma,sans-serif`;const textWidth=Math.min(c.measureText(label).width,540),total=textWidth+52,left=(WIDTH-total)/2;drawTelegram(c,left,1254,38,state.telegramColor);c.save();c.fillStyle=state.footerColor;c.font=`800 29px "${font}","Mikhak",Tahoma,sans-serif`;c.direction=isLatin?'ltr':'rtl';c.textAlign=isLatin?'left':'right';c.textBaseline='alphabetic';if(isLatin)c.fillText(label,left+49,1282,540);else c.fillText(label,left+49+textWidth,1282,540);c.restore();}
function drawPoster(canvas,pageState=state){if(!canvas)return;const savedState=state;state=pageState;const c=canvas.getContext('2d');c.save();c.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);c.clearRect(0,0,WIDTH,HEIGHT);c.fillStyle=state.background;c.fillRect(0,0,WIDTH,HEIGHT);const p=findPattern(state.patternId)||patterns[0];if(p){
  const pic=p.mode==='mask'?tintedImage(p.image,state.patternColor):((state.patternTintEnabled&&p.mode==='hue')?recoloredPattern(p.image,state.patternColor):image(p.image));
  if(pic){if(p.layout==='cover'){drawCover(c,pic,p.focusX??.5,p.focusY??.5);}else{
    const tw=Math.max(32,Math.min(2048,Number(p.tileWidth)||432)),th=Math.max(32,Math.min(2048,Number(p.tileHeight)||430));
    for(let y=0;y<HEIGHT;y+=th){for(let x=0;x<WIDTH;x+=tw)c.drawImage(pic,x,y,tw,th);}
  }}
}c.save();roundPath(c,38,34,1004,1282,37);c.globalAlpha=.60;c.fillStyle=state.frameColor;c.fill();c.restore();drawBrand(c);drawDate(c);state.matches.forEach((m,i)=>drawGame(c,m,i));drawFooter(c);c.restore();state=savedState;}
function render(){drawPoster($('poster'),state);}
// A missing or corrupted font must NEVER freeze the page, the page gallery,
// an imported project, or the PNG download. Canvas uses a local fallback.
const FONT_WAIT_MS=4500;
async function loadFontFamilies(fonts){
 if(!document.fonts)return true;
 const req=[...new Set(fonts.map(validFont))].map(f=>document.fonts.load(`800 28px "${f}"`,'بارسلونا'));
 let timer;
 try{
  const outcome=await Promise.race([
   Promise.allSettled(req).then(result=>result.every(x=>x.status==='fulfilled'&&x.value.length>0)),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(false),FONT_WAIT_MS);})
  ]);
  return outcome;
 }catch{return false;}finally{clearTimeout(timer);}
}
async function ensureFonts(){return loadFontFamilies([state.dayFont,state.dateFont,state.footerFont,...state.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);}

function preloadCurrentImages(){const paths=[...Object.values(ASSETS),(findPattern(state.patternId)||patterns[0])?.image,...state.matches.flatMap(m=>[findTeam(m.leftTeam)?.image,findTeam(m.rightTeam)?.image,findFlag(m.flag)?.image])];return Promise.all(paths.filter(Boolean).map(preload));}
async function downloadPNG(){const btn=$('downloadBtn');btn.disabled=true;btn.textContent='آماده‌سازی…';try{await Promise.all([ensureFonts(),preloadCurrentImages()]);render();const blob=await new Promise(resolve=>$('poster').toBlob(resolve,'image/png'));if(!blob)throw Error('Failed to encode canvas');downloadBlob(blob,`WoSoCenter-${project.pages.findIndex(p=>p.id===project.activePageId)+1}-${state.matches.length}-games.png`);message('تصویر ۱۰۸۰×۱۳۵۰ با موفقیت دانلود شد.');}catch(e){console.error(e);message('در ساخت تصویر مشکلی پیش آمد؛ صفحه را تازه‌سازی کنید.','error');}finally{btn.disabled=false;btn.textContent='↓ دریافت PNG';}}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
// Download all pages as separate full-resolution PNG files (no ZIP).
// Browser may ask the user to allow multiple automatic downloads.
async function downloadAllPages(){
 const btn=$('downloadAllPagesBtn'),oldLabel=btn.textContent;
 btn.disabled=true;btn.textContent='در حال آماده‌سازی…';
 const output=document.createElement('canvas');output.width=WIDTH;output.height=HEIGHT;
 try{
  for(let i=0;i<project.pages.length;i++){
   const page=project.pages[i];
   await preloadForPage(page.data);
   const fonts=new Set([page.data.dayFont,page.data.dateFont,page.data.footerFont,...page.data.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);
   await loadFontFamilies([...fonts]);
   drawPoster(output,page.data);
   const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
   if(!blob)throw new Error('PNG export failed on page '+(i+1));
   downloadBlob(blob,`WoSoCenter-page-${String(i+1).padStart(2,'0')}.png`);
   btn.textContent=`${(i+1).toLocaleString('fa-IR')} از ${project.pages.length.toLocaleString('fa-IR')} صفحه`;
   // Prevent consecutive download clicks from landing in the very same event loop.
   await new Promise(resolve=>setTimeout(resolve,300));
  }
  message(`دانلود ${project.pages.length.toLocaleString('fa-IR')} تصویر درخواست شد؛ در صورت نیاز، اجازه دانلود چند فایل را به مرورگر بدهید.`);
 }catch(e){console.error(e);message('در دانلود صفحات خطایی رخ داد. می‌توانید هر صفحه را جدا دانلود کنید.','error');}
 finally{btn.disabled=false;btn.textContent=oldLabel;queueRender();}
}

function downloadJSON(){downloadBlob(new Blob([JSON.stringify(projectSnapshot(),null,2)],{type:'application/json;charset=utf-8'}),'WoSoCenter-project-pages.json');message('فایل تنظیمات دانلود شد.');}
function handleGameField(e){const input=e.target,art=input.closest('.game-editor');if(!art||!input.dataset.field)return;if(input.tagName!=='INPUT'||e.type!=='input')return;const i=Number(art.dataset.index),key=input.dataset.field;if(!state.matches[i]||!(key in DEFAULT_MATCH))return;if(state.matches[i][key]===input.value)return;state.matches[i][key]=input.value;commitHistory(`بازی ${i+1} · ${key==='league'?'نام لیگ':key==='time'?'ساعت بازی':'فونت'}`);if(key.endsWith('Font'))ensureFonts().then(queueRender);}
function attachEvents(){
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
  $('themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme!=='light'));
  $('undoBtn').addEventListener('click',undo);$('redoBtn').addEventListener('click',redo);$('historyUndo').addEventListener('click',undo);$('historyRedo').addEventListener('click',redo);$('showHistoryBtn').addEventListener('click',()=>{switchTab('history');requestAnimationFrame(()=>$('historyTab').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));});
  $('openPagesBtn').addEventListener('click',openPages);
  $('addPageBtn').addEventListener('click',()=>{addPage(project.activePageId,false);$('pagesDialog').close();document.querySelector('.preview-area').scrollIntoView({behavior:'smooth',block:'start'});});
  $('pageTabs').addEventListener('click',e=>{
   const dl=e.target.closest('[data-page-download]'),mv=e.target.closest('[data-page-move]'),rename=e.target.closest('[data-page-rename]'),del=e.target.closest('[data-page-delete]'),dup=e.target.closest('[data-page-clone]'),pick=e.target.closest('[data-page-select]');
   if(dl){void downloadConductorPage(dl.dataset.pageDownload)}
   else if(mv){moveConductorPage(mv.dataset.pageMove,Number(mv.dataset.pageDir))}
   else if(rename){renameConductorPage(rename.dataset.pageRename)}
   else if(del){deletePage(del.dataset.pageDelete)}
   else if(dup){addPage(dup.dataset.pageClone,true)}
   else if(pick){if(project.activePageId!==pick.dataset.pageSelect){project.activePageId=pick.dataset.pageSelect;displayPage();commitHistory('رفتن به صفحه '+activePage().title);} $('pagesDialog').close();document.querySelector('.preview-area').scrollIntoView({behavior:'smooth',block:'start'});}
 });
  $('historyList').addEventListener('click',e=>{const b=e.target.closest('[data-revision]');if(b)restoreHistory(Number(b.dataset.revision));});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}});
  $('addGameBtn').addEventListener('click',()=>{if(state.matches.length>=MAX_GAMES)return;const last=state.matches.at(-1);state.matches.push({...last,league:'',time:'',leftTeam:'',rightTeam:'',leftBgInitialized:false,rightBgInitialized:false,leftBgLocked:state.paletteId!==''&&state.paletteId!=='classic',rightBgLocked:state.paletteId!==''&&state.paletteId!=='classic'});refreshGames();commitHistory(`افزودن بازی ${state.matches.length}`);});
  $('gamesList').addEventListener('click',e=>{const rm=e.target.closest('[data-remove]');if(rm){if(state.matches.length<=1){message('حداقل یک بازی باید باقی بماند.','warning');return;}const i=Number(rm.dataset.remove);state.matches.splice(i,1);refreshGames();commitHistory(`حذف بازی ${i+1}`);return;}const pick=e.target.closest('[data-pick]');if(pick){const art=pick.closest('.game-editor');openAsset(pick.dataset.pick,Number(art.dataset.index));return;}const color=e.target.closest('[data-game-color]');if(color){const art=color.closest('.game-editor');openColor('game',color.dataset.gameColor,Number(art.dataset.index));return;}const font=e.target.closest('[data-game-font]');if(font){const art=font.closest('.game-editor');openFont('game',font.dataset.gameFont,Number(art.dataset.index));}});
  $('gamesList').addEventListener('input',handleGameField);$('gamesList').addEventListener('change',handleGameField);
  for(const key of ['weekDay','monthDay','footerText']){
    const el=$(key);el.addEventListener('input',e=>{if(state[key]===e.target.value)return;state[key]=e.target.value;commitHistory(`ویرایش ${key==='weekDay'?'روز هفته':key==='monthDay'?'تاریخ':'آیدی کانال'}`);});
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-global-font]');if(b)openFont('global',b.dataset.globalFont,null);
  });
  $('fontSearch').addEventListener('input',renderFontOptions);
  $('fontResults').addEventListener('click',e=>{const b=e.target.closest('[data-font-id]');if(b)chooseFont(b.dataset.fontId);});
  document.querySelectorAll('[data-global-color]').forEach(b=>b.addEventListener('click',()=>openColor('global',b.dataset.globalColor,null)));
  $('patternPick').addEventListener('click',()=>openAsset('patternId',null));
  $('patternTintToggle').addEventListener('change',e=>{state.patternTintEnabled=e.target.checked;syncPattern();commitHistory(state.patternTintEnabled?'فعال‌سازی تغییر رنگ پترن':'بازگشت به رنگ اصلی پترن');});
  $('paletteList').addEventListener('click',e=>{if(e.target.closest('[data-team-logo-palette]')){selectTeamLogoPalette();return;}const b=e.target.closest('[data-palette]');if(b)selectPalette(b.dataset.palette);});
  $('applyAllFonts').addEventListener('click',()=>{state.dayFont=state.dateFont=state.footerFont=state.globalFont;state.matches.forEach(m=>{m.leagueFont=state.globalFont;m.timeFont=state.globalFont;});syncGlobals();refreshGames();commitHistory('اعمال گروهی فونت');ensureFonts().then(queueRender);message('فونت جدید روی متن‌های قابل ویرایش اعمال شد.');});
  $('resetBtn').addEventListener('click',()=>{if(!confirm('تمام تنظیمات تصویر به حالت اولیه برگردند؟'))return;activePage().data=cleanState(null);displayPage();commitHistory('بازگردانی طرح اولیه');});
  $('exportProject').addEventListener('click',downloadJSON);$('importProjectBtn').addEventListener('click',()=>$('projectFile').click());
  $('projectFile').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>1000000)throw Error('size');project=normalizeProject(JSON.parse(await f.text()));displayPage();await preloadCurrentImages();await ensureFonts();commitHistory('بازیابی فایل تنظیمات');message('تنظیمات بازیابی شد.');}catch(err){console.error(err);message('فایل JSON معتبر نیست.','error');}finally{e.target.value='';}});
  $('downloadBtn').addEventListener('click',downloadPNG);$('downloadBtnBottom').addEventListener('click',downloadPNG);$('downloadAllPagesBtn').addEventListener('click',downloadAllPages);
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.closeDialog).close()));
  for(const id of ['assetDialog','colorDialog','fontDialog','pagesDialog'])$(id).addEventListener('click',e=>{if(e.target===$(id))$(id).close();});
  $('pagesDialog').addEventListener('close',()=>{thumbRefreshId++;});
  $('assetSearch').addEventListener('input',e=>{const kind=pickContext?.kind;const group=kind==='flag'?flags:kind==='patternId'?patterns:teams;renderAssetResults(group,e.target.value);});
  $('assetResults').addEventListener('click',e=>{const b=e.target.closest('[data-asset-id]');if(b)chooseAsset(b.dataset.assetId);});
  $('pickerSV').addEventListener('pointerdown',e=>{e.preventDefault();$('pickerSV').setPointerCapture(e.pointerId);handleSvPointer(e);});
  $('pickerSV').addEventListener('pointermove',e=>{if($('pickerSV').hasPointerCapture(e.pointerId))handleSvPointer(e);});
  $('pickerHue').addEventListener('input',e=>{pickerHSV.h=Number(e.target.value);liveColor(hsvToHex(pickerHSV.h,pickerHSV.s,pickerHSV.v));});
  $('colorHex').addEventListener('input',e=>{let str=e.target.value.trim();if(!str.startsWith('#'))str='#'+str;if(/^#[0-9a-f]{6}$/i.test(str))liveColor(str);});
  $('colorHex').addEventListener('blur',()=>{if(colorContext)updatePickerView(getColorValue());});
  $('colorNative').addEventListener('input',e=>liveColor(e.target.value));
  $('colorSwatches').addEventListener('click',e=>{const b=e.target.closest('[data-quick-color]');if(b)liveColor(b.dataset.quickColor);});
  $('colorDone').addEventListener('click',()=>$('colorDialog').close());
  $('colorDialog').addEventListener('close',finishColor);
}
async function main(){let uiLight=false;try{uiLight=localStorage.getItem('wosocenter-ui-theme')==='light';}catch{}setTheme(uiLight);populateColorSwatches();attachEvents();if(document.fonts?.addEventListener)document.fonts.addEventListener('loadingdone',()=>{queueRender();if($('pagesDialog')?.open)void refreshPageThumbs();});[teams,flags,patterns]=await Promise.all([loadList('data/teams.json',fallbackTeams),loadList('data/flags.json',fallbackFlags),loadList('data/patterns.json',fallbackPatterns)]);const suggestedTeamColors=await loadTeamColors();teams=teams.map(t=>({...t,color:safeHex(suggestedTeamColors[t.id],safeHex(t.color,'#38445b'))}));// Resolve v3.3 projects without a lock flag. Colors unlike current suggestions are
 // treated as user chosen and protected. Existing explicit locks take priority.
 function migrateLocks(project){
  if(!project?.matches)return;
  const byId=new Map(teams.map(t=>[t.id,t]));
  for(const m of project.matches){
   for(const side of ['left','right']){
    const lock=side+'BgLocked';if(typeof m[lock]==='boolean')continue;
    const color=safeHex(m[side+'Bg'],DEFAULT_MATCH[side+'Bg']);
    const suggestion=safeHex(byId.get(m[side+'Team'])?.color,DEFAULT_MATCH[side+'Bg']);
    m[lock]=color!==suggestion;
   }
  }
 }
 for(const snapshot of [project,...history.map(h=>h.snapshot)]){
  for(const pg of snapshot.pages||[]){
   migrateLocks(pg.data);
   for(const m of pg.data.matches||[]){
    if(m.leftTeam==='servette')m.leftTeam='srwt';if(m.rightTeam==='servette')m.rightTeam='srwt';
    if(!flags.some(f=>f.id===m.flag))m.flag=flags[0]?.id||'liga-af-spain';
   }
  }
 }
 activatePageState();
 
 if(!patterns.length)patterns=fallbackPatterns;const available=new Set(patterns.map(p=>p.id));let migrated=false;for(const snapshot of [project,...history.map(h=>h.snapshot)])for(const pg of snapshot.pages||[]){if(!available.has(pg.data.patternId)){pg.data.patternId=patterns[0].id;migrated=true;}}persist();syncGlobals();refreshGames();refreshPalettes();refreshPages();updateHistoryButtons();queueRender();void preloadCurrentImages().then(queueRender).catch(console.warn);void ensureFonts().then(queueRender);if(!teams.length||!flags.length)message('بانک لوگو یا پرچم خالی است.','warning');}
main().catch(e=>{console.error(e);message('بارگذاری اطلاعات انجام نشد؛ صفحه را دوباره باز کنید.','error');});
