/* WoSoCenter Standings Maker 5.1 — no API key or personal files are sent to GitHub. */
(() => {
'use strict';
const API = 'https://wosocenter-standings.mr-mehrdadzamani1382.workers.dev/api/standings';
const DEFAULT_PHOTO='assets/standings/ewa-pajor-default.webp';
const WORDMARK='assets/standings/wosocenter-wordmark.webp';
const W=1080,H=1350, STORE='woso-standings-studio-v3', DATA_STORE='woso-standings-last-success-v3';
const $=id=>document.getElementById(id), $$=(s,scope=document)=>Array.from(scope.querySelectorAll(s));
const deep=v=>JSON.parse(JSON.stringify(v));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const persian=v=>String(v??'').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace(/-/g,'−');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rgba=(hex,opacity)=>{const m=/^#([0-9a-f]{6})$/i.exec(hex);if(!m)return `rgba(6,29,73,${opacity})`;const c=m[1];return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${opacity})`};
const FONTS=['Mikhak','Ario','DinArabic','YekanBoom','Lalezar','Titr','Tehran','ShahGosh','Shokoh','Sahel','GraphikArabic','Matin','Casablanca','Sepahbod','Cinema','DastNevis','Paeez','Hayat','Soltan','Haftad','Georgia'];
const FONT_LABELS={Mikhak:'میخک',Ario:'آریو',DinArabic:'دین عربیک',YekanBoom:'یکان بوم',Lalezar:'لاله‌زار',Titr:'تیتر',Tehran:'تهران',ShahGosh:'شاهگش',Shokoh:'شکوه',Sahel:'ساحل',GraphikArabic:'گرافیک عربیک',Matin:'متین',Casablanca:'کازابلانکا',Sepahbod:'سپهبد',Cinema:'سینما',DastNevis:'دست‌نویس',Paeez:'پاییز',Hayat:'حیات',Soltan:'سلطان',Haftad:'هفتاد',Georgia:'جورجیا (لاتین)'};
// Literal, verified mapping from user-supplied Persian names and data/teams.json.
// Eibar and FC Badalona have no exact matching entry in the existing team bank.
const TEAM_MAP={
 'soccer-barcelona-women':['بارسلونا','barcelona'],
 'soccer-real-madrid-women':['رئال مادرید','real-madrid'],
 'soccer-atletico-madrid-women':['اتلتیکو مادرید','tltykhw-mdryd'],
 'soccer-madrid-cff-women':['مادرید','mdryd'],
 'soccer-athletic-club-women':['اتلتیک بیلبائو','tltykh-bylbyw'],
 'soccer-espanyol-women':['اسپانیول','spnywl'],
 'soccer-cd-tenerife-women':['تنریفه','tnryfh'],
 'soccer-real-sociedad-women':['رئال سوسیداد','ryl-swsydd'],
 'soccer-eibar-women':['ایبار','eybar'],
 'soccer-deportivo-women':['دپورتیوو لاکرونیا','dpwrtyww-lkhrwny'],
 'soccer-granada-women':['گرانادا','grnd'],
 'soccer-dux-logrono-women':['لوگرونیو','lwgrwnyw'],
 'soccer-sevilla-women':['سویا','swy'],
 'soccer-alaves-women':['دپورتیوو آلاوز','dpwrtyww-alwz'],
 'soccer-fc-badalona-women':['بادالونا','lwnth-bdlwn'],
 'soccer-valencia-women':['والنسیا','wlnsy']
};
// Read-only example preview. These figures are a historical snapshot from 11 Nov 2026,
// not live standings; they never enter state.data or the API cache.
const PREVIEW_ROWS=[
 ['soccer-barcelona-women','Barcelona','BAR',10,9,0,1,41,5,27],
 ['soccer-real-madrid-women','Real Madrid','RMA',10,7,2,1,23,18,23],
 ['soccer-atletico-madrid-women','Atlético Madrid','ATL',10,6,1,3,22,12,19],
 ['soccer-madrid-cff-women','Madrid CFF','MCF',10,5,2,3,16,21,17],
 ['soccer-athletic-club-women','Athletic Club','ATH',10,4,4,2,13,11,16],
 ['soccer-espanyol-women','Espanyol','ESP',10,4,3,3,14,11,15],
 ['soccer-cd-tenerife-women','CD Tenerife','TEN',9,4,2,3,14,14,14],
 ['soccer-real-sociedad-women','Real Sociedad','RSO',10,3,4,3,13,15,13],
 ['soccer-eibar-women','Eibar','EIB',10,3,3,4,10,13,12],
 ['soccer-deportivo-women','Deportivo','DEP',10,3,2,5,11,13,11],
 ['soccer-granada-women','Granada','GRA',10,3,2,5,9,16,11],
 ['soccer-dux-logrono-women','Dux Logroño','DUX',10,3,1,6,11,14,10],
 ['soccer-sevilla-women','Sevilla','SEV',10,2,4,4,11,16,10],
 ['soccer-alaves-women','Alavés','ALA',9,2,2,5,6,13,8],
 ['soccer-fc-badalona-women','FC Badalona','BAD',10,2,2,6,9,20,8],
 ['soccer-valencia-women','Valencia','VAL',10,2,0,8,8,19,6]
].map(([id,team,abbreviation,played,win,draw,loss,goalsFor,goalsAgainst,points],i)=>({
 id,team,abbreviation,rank:i+1,played,win,draw,loss,goalsFor,goalsAgainst,
 goalDifference:goalsFor-goalsAgainst,points
}));
const NAME_TO_ID={Barcelona:'soccer-barcelona-women','Real Madrid':'soccer-real-madrid-women','Atlético Madrid':'soccer-atletico-madrid-women','Atletico Madrid':'soccer-atletico-madrid-women','Madrid CFF':'soccer-madrid-cff-women','Athletic Club':'soccer-athletic-club-women',Espanyol:'soccer-espanyol-women','CD Tenerife':'soccer-cd-tenerife-women','Real Sociedad':'soccer-real-sociedad-women',Eibar:'soccer-eibar-women',Deportivo:'soccer-deportivo-women',Granada:'soccer-granada-women','Dux Logroño':'soccer-dux-logrono-women',Sevilla:'soccer-sevilla-women','Alavés':'soccer-alaves-women','FC Badalona':'soccer-fc-badalona-women',Valencia:'soccer-valencia-women'};
const BASE_COLORS={bgColor:'#082a65',fadeColor:'#071b52',fadeOpacity:10,fadeCoverage:80,fadeSoftness:100,titleColor:'#ffffff',brandColor:'#8c47bb',starsColor:'#ffffff',tableText:'#ffffff',columnColor:'#ffffff',pointsColor:'#ffffff',firstBox:'#bc9b24',championsBox:'#0aa6d2',regularBox:'#307bd7',relegationBox:'#a73757',accentColor:'#44b1ed'};
const DEFAULT=()=>({...BASE_COLORS,
 titleText:'',weekOverride:'',league:'ligaf',headerLogo:'woso',footerText:'WoSoCenter',footerFont:'Mikhak',footerColor:'#ffffff',footerSize:19,titleFont:'Mikhak',tableFont:'Mikhak',allFont:'Mikhak',
 titleSize:48,brandSize:41,titleX:0,titleY:0,brandX:0,brandY:0,teamSize:23,numberSize:24,rowOpacity:0,
 imageId:null,noBackgroundPhoto:false,photoPosition:{x:19,y:0,zoom:1},patternId:null,patternOpacity:35,paletteId:'ligaf',overrides:{},
 data:null,dataFetchedAt:null});
const palSpecial=[{id:'ligaf',name:'لیگا اف',colors:['#082a65','#0aa6d2','#bc9b24','#ffffff'],bgColor:'#082a65',fadeColor:'#071b52',accentColor:'#44b1ed',tableText:'#ffffff',columnColor:'#ffffff',firstBox:'#bc9b24',championsBox:'#0aa6d2',regularBox:'#307bd7',relegationBox:'#a73757',brandColor:'#8c47bb',starsColor:'#ffffff'},
 {id:'woso',name:'ووسو سنتر',colors:['#13091c','#5d2676','#b765e1','#f2c66b'],bgColor:'#22122f',fadeColor:'#10071d',accentColor:'#b765e1',tableText:'#fff7ff',columnColor:'#f4d9fe',firstBox:'#c0a24b',championsBox:'#754a9c',regularBox:'#553a84',relegationBox:'#97374e',brandColor:'#d6a1eb',starsColor:'#edd0ff'},
  {id:'silver',name:'موج‌های نقره‌ای',colors:['#131c2e','#536d81','#b4c8dc','#293649'],bgColor:'#14243c',fadeColor:'#0d1a2c',accentColor:'#a8bdd3',tableText:'#ffffff',columnColor:'#f6fbff',firstBox:'#a38e54',championsBox:'#6088ac',regularBox:'#517194',relegationBox:'#943851',brandColor:'#d0b8f5',starsColor:'#e2f4ff'}];
let state=DEFAULT(),pages=[{id:'page-1',name:'صفحه ۱',state:deep(state)}],pageIndex=0,past=[],future=[],hist=[],openTeamId=null,patterns=[],palettes=[...palSpecial],teamBank=new Map(),renderPending=false,dbPromise=null,mediaUrls=new Map(),imgCache=new Map(),activeColor=null,activeTeamColor=null,activeFont=null,pendingPhoto=null,cropPosition={x:0,y:0,zoom:1},downloadPrepared=null,downloadSeq=0,tintCache=new Map();
const activePage=()=>pages[pageIndex];
const notify=(message,error=false)=>{const n=$('editorNotice');n.hidden=false;n.textContent=message;n.style.color=error?'#ed8d9b':'';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.hidden=true,5200)};
function status(message,type=''){const n=$('fetchStatus');n.className='standings-message '+type;n.textContent=message}
function loadJSON(url){return fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Cannot load '+url);return r.json()})}
const PRIORITY_PALETTES=['ligaf','woso','silver','ready:midnight','ready:emerald','ready:ruby','ready:gold','ready:cyber','ready:ocean','ready:orange-flare','ready:forest','ready:royal','ready:steel','ready:lime','ready:aurora'];
function colorTriplet(hex){const m=/^#([a-f\d]{6})$/i.exec(String(hex||''));return m?[1,3,5].map(i=>parseInt(m[1].slice(i-1,i+1),16)):[38,86,143]}
function blendHex(a,b,weight){const x=colorTriplet(a),y=colorTriplet(b);return '#'+x.map((v,i)=>Math.round(v*(1-weight)+y[i]*weight).toString(16).padStart(2,'0')).join('')}
function visualDistance(a,b){const x=colorTriplet(a),y=colorTriplet(b);return Math.sqrt(x.reduce((sum,v,i)=>sum+(v-y[i])**2,0))}
function boxColorForPalette(bg,box,accent){let out=box||'#317bd6';if(visualDistance(bg,out)<94)out=blendHex(out,accent||'#46a7ef',.68);if(visualDistance(bg,out)<85)out=blendHex(out,/^#f/i.test(bg)?'#19396b':'#72baff',.65);return out}
function normalizePalette(p){p.name=String(p.name||'').replace(/^پالت(?:\s+پیشنهادی)?\s*/,'').trim();p.regularBox=boxColorForPalette(p.bgColor,p.regularBox,p.accentColor);if(!p.starsColor)p.starsColor=p.accentColor||'#ffffff';return p}
async function loadLibraries(){const results=await Promise.allSettled([loadJSON('data/teams.json'),loadJSON('data/patterns.json'),loadJSON('data/lineup-ready-palettes.json')]);
  if(results[0].status==='fulfilled'&&Array.isArray(results[0].value))for(const x of results[0].value)if(x?.id&&x?.image)teamBank.set(x.id,x);
  const suggested=[];
  if(results[1].status==='fulfilled'&&Array.isArray(results[1].value)){
   patterns=results[1].value;
   for(const x of patterns.filter(x=>x.suggestedPalette?.colors?.length>=3)){
    const sp=x.suggestedPalette,cs=sp.colors;
    suggested.push({id:'pattern:'+x.id,name:x.name,colors:cs,bgColor:cs[0],fadeColor:cs[1],accentColor:cs[2],tableText:'#ffffff',columnColor:'#ffffff',firstBox:cs[2],championsBox:cs[1],regularBox:cs[1],relegationBox:'#a73757',brandColor:cs[2],starsColor:cs[2]});
   }
  }
  const ready=[];
  if(results[2].status==='fulfilled'&&Array.isArray(results[2].value))for(const x of results[2].value.filter(x=>x.id!=='ready:woso')){
    ready.push({id:x.id,name:x.name,colors:[x.header,x.upper,x.accent,x.lower],bgColor:x.header,fadeColor:x.lower,accentColor:x.accent,tableText:x.text,columnColor:x.text,firstBox:x.accent,championsBox:x.card2,regularBox:x.card1,relegationBox:'#a73757',brandColor:x.accent,starsColor:x.accent});
  }
  palettes=[...palSpecial,...ready,...suggested].map(normalizePalette);
  palettes.sort((a,b)=>{const ai=PRIORITY_PALETTES.indexOf(a.id),bi=PRIORITY_PALETTES.indexOf(b.id);if(ai>=0&&bi>=0)return ai-bi;if(ai>=0)return -1;if(bi>=0)return 1;return 0});
  buildPalettes();buildPatternLibrary();buildTeamEditors();drawSoon();
}
function mediaDB(){if(dbPromise)return dbPromise;dbPromise=new Promise(resolve=>{if(!('indexedDB'in window)){resolve(null);return}try{const req=indexedDB.open('woso-standings-media-v3',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch{resolve(null)}});return dbPromise}
async function mediaPut(id,obj){const db=await mediaDB();if(!db)return false;return new Promise(resolve=>{try{const tx=db.transaction('images','readwrite');tx.objectStore('images').put(obj,id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false)}catch{resolve(false)}})}
async function loadMedia(){const db=await mediaDB();if(!db)return;try{const tx=db.transaction('images','readonly');const req=tx.objectStore('images').openCursor();await new Promise(resolve=>{req.onsuccess=()=>{const cur=req.result;if(cur){const v=cur.value;if(v?.blob instanceof Blob)mediaUrls.set(cur.key,URL.createObjectURL(v.blob));cur.continue()}else resolve()};req.onerror=resolve})}catch{}buildPatternLibrary();buildTeamEditors();refreshPhotoThumb();drawSoon()}
const saveStored=()=>{clearTimeout(saveStored.timer);$('saveIndicator').textContent='در حال ذخیره…';saveStored.timer=setTimeout(()=>{try{activePage().state=deep(state);localStorage.setItem(STORE,JSON.stringify({pages,pageIndex,hist:hist.slice(-28),past:past.slice(-28),future:future.slice(-28)}));$('saveIndicator').textContent='ذخیره شد ✓'}catch(e){$('saveIndicator').textContent='ذخیره نشد';console.warn('storage:',e)}},180)};
function commit(label,fn,{sync=true,editors=false}={}){const before=deep(state);fn();if(JSON.stringify(before)===JSON.stringify(state))return;past.push(before);if(past.length>28)past.shift();future=[];hist.push({label,time:Date.now(),snapshot:deep(state)});if(hist.length>28)hist.shift();renderAll({sync,editors});saveStored()}
function undo(){if(!past.length)return;future.push(deep(state));state=past.pop();hist.push({label:'واگرد',time:Date.now(),snapshot:deep(state)});renderAll({sync:true,editors:true});saveStored()}
function redo(){if(!future.length)return;past.push(deep(state));state=future.pop();hist.push({label:'بازانجام',time:Date.now(),snapshot:deep(state)});renderAll({sync:true,editors:true});saveStored()}
function restore(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'null');if(raw?.pages?.length){pages=raw.pages.filter(x=>x&&x.state&&x.id).slice(0,30);for(const p of pages){if(p.state.titleText==='جدول لیگا اف | هفته ۱۰')p.state.titleText='';if(p.state.brandSize===58&&p.state.brandText==='WoSoCenter')p.state.brandSize=41;if(p.state.fadeOpacity===67&&p.state.fadeCoverage===85&&p.state.fadeSoftness===58){p.state.fadeOpacity=10;p.state.fadeCoverage=80;p.state.fadeSoftness=100};if(p.state.photoPosition&&p.state.photoPosition.x===0&&p.state.photoPosition.y===0&&p.state.photoPosition.zoom===1&&!p.state.imageId)p.state.photoPosition={x:19,y:0,zoom:1}}if(pages.length){pageIndex=clamp(Number(raw.pageIndex)||0,0,pages.length-1);state={...DEFAULT(),...pages[pageIndex].state,overrides:pages[pageIndex].state.overrides||{}};past=(raw.past||[]).slice(-28);future=(raw.future||[]).slice(-28);hist=(raw.hist||[]).slice(-28);return}}}catch(e){console.warn(e)}
 try{const cache=JSON.parse(localStorage.getItem(DATA_STORE)||'null');if(cache?.data?.teams?.length){state.data=cache.data;state.dataFetchedAt=new Date(cache.at||Date.now()).toISOString()}}catch{}}
const teamInfo=t=>{const key=t?.id||NAME_TO_ID[t?.team]||t?.team;const map=TEAM_MAP[key]||[t?.team||'تیم',null];const bank=map[1]?teamBank.get(map[1]):null;return {key,name:map[0],bank,logo:bank?.image||null,abbreviation:t?.abbreviation||''}}
function currentRows(){return (Array.isArray(state.data?.teams)?state.data.teams:PREVIEW_ROWS).slice().sort((a,b)=>a.rank-b.rank)}
const LEAGUES=[
 {id:'ligaf',name:'لیگا اف',label:'لیگا اف · اسپانیا',image:'assets/leagues/liga-af-spain.webp',enabled:true},
 {id:'wsl',name:'سوپرلیگ زنان انگلیس',label:'سوپرلیگ زنان انگلیس',image:'assets/leagues/wsl-england.webp',enabled:false},
 {id:'bundesliga',name:'بوندسلیگای زنان آلمان',label:'بوندسلیگای آلمان',image:'assets/leagues/bundesliga-germany.webp',enabled:false},
 {id:'seriea',name:'سری آ زنان ایتالیا',label:'سری آ ایتالیا',image:'assets/leagues/serie-a-italy.webp',enabled:false},
 {id:'premiere',name:'لیگ یک زنان فرانسه',label:'لیگ یک فرانسه',image:'assets/leagues/premiere-league-france.webp',enabled:false},
 {id:'ucl',name:'لیگ قهرمانان اروپا',label:'لیگ قهرمانان اروپا',image:'assets/leagues/champions-league-europe.webp',enabled:false}
];
function currentLeague(){return LEAGUES.find(x=>x.id===state.league)||LEAGUES[0]}
function getWeek(){const d=state.data;const overridden=Number(state.weekOverride);if(overridden>0)return {number:overridden,source:'دستی'};const apiNum=Number(d?.week??d?.matchweek??d?.round);if(Number.isInteger(apiNum)&&apiNum>0)return {number:apiNum,source:'API'};const rows=Array.isArray(d?.teams)?d.teams:PREVIEW_ROWS;const max=Math.max(0,...rows.map(x=>Number(x.played)||0));return {number:max,source:max?'برآوردی':'نامشخص'}}
function weekOrdinal(n){const values=['','اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم','سیزدهم','چهاردهم','پانزدهم','شانزدهم','هفدهم','هجدهم','نوزدهم','بیستم'];if(values[n])return values[n];if(n<30){const suffix=['','یکم','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم'];return 'بیست‌و'+suffix[n-20]}if(n===30)return 'سی‌ام';return persian(n)+'ام'}
function computedTitle(){if(String(state.titleText||'').trim())return state.titleText.trim();const w=getWeek();return w.number?`جدول هفته ${weekOrdinal(w.number)} ${currentLeague().name}`:`جدول ${currentLeague().name}`;}
function renderLeagueDialog(){$('leagueGrid').innerHTML=LEAGUES.map(l=>`<button class="s-league-row" type="button" data-league-choice="${l.id}" ${l.enabled?'':'disabled'}><img src="${l.image}" alt=""><strong>${safe(l.label)}</strong><small>${l.enabled?'قابل انتخاب':'به‌زودی'}</small><span aria-hidden="true">${l.enabled?'‹':'•'}</span></button>`).join('')}
async function fetchTable(){const btn=$('fetchBtn');btn.disabled=true;status('در حال دریافت جدول آنلاین…');try{const season=new Date().getUTCFullYear()-(new Date().getUTCMonth()<6?1:0);const url=`${API}?league=${encodeURIComponent(state.league||'ligaf')}&season=${season}`;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),14000);let res;try{res=await fetch(url,{signal:controller.signal,cache:'no-store'})}finally{clearTimeout(timeout)};const data=await res.json();if(!res.ok||data.success!==true||!Array.isArray(data.teams)||data.teams.length<10)throw Error(data.error||data.detail||'جدول معتبر دریافت نشد.');const teams=data.teams.map(t=>({...t,id:t.id||NAME_TO_ID[t.team],rank:Number(t.rank)||0}));if(teams.some(t=>!t.id||t.rank<1))throw Error('شناسه یا رتبه برخی تیم‌ها نامعتبر است.');
 commit('دریافت جدول لیگ اف',()=>{state.data={...data,teams};state.dataFetchedAt=new Date().toISOString()},{sync:true,editors:true});try{localStorage.setItem(DATA_STORE,JSON.stringify({data:state.data,at:Date.now()}))}catch{}status(`${persian(teams.length)} تیم دریافت شد. ${lastFetchLabel(state.dataFetchedAt)}`, 'ok');$('dataBadge').textContent=`${persian(teams.length)} تیم · ${persian(data.season)} · ${data.source||'API Ninjas'}`;
 }catch(e){status('دریافت ناموفق: '+(e.name==='AbortError'?'مهلت پاسخ‌گویی تمام شد':e.message),'error')}finally{btn.disabled=false}}
function lastFetchLabel(value){
 if(!value)return '';
 const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
 const today=d.toDateString()===new Date().toDateString();
 const date=today?'امروز':d.toLocaleDateString('fa-IR',{day:'numeric',month:'long'});
 const time=d.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 return `آخرین دریافت اطلاعات: ${date} ${time}`;
}
function imageRecord(src){if(!src)return null;let r=imgCache.get(src);if(r)return r;r={status:'loading',img:new Image()};r.img.onload=()=>{r.status='ok';drawSoon();if($('pagesDialog')?.open)renderPages()};r.img.onerror=()=>{r.status='error';drawSoon()};r.img.decoding='async';r.img.src=src;imgCache.set(src,r);return r}
function imageFor(src){const r=imageRecord(src);return r?.status==='ok'?r.img:null}
function imageURL(id){return mediaUrls.get(id)||null}
function photoSource(){return state.noBackgroundPhoto?null:(imageURL(state.imageId)||(!state.patternId?DEFAULT_PHOTO:null))}
function tintedAsset(src,color){const img=imageFor(src);if(!img)return null;const key=src+'|'+color;let c=tintCache.get(key);if(c)return c;c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(key,c);if(tintCache.size>60)tintCache.clear();return c}
function drawCover(ctx,img,x,y,w,h,pos={x:0,y:0,zoom:1}){if(!img?.naturalWidth)return;const ratio=Math.max(w/img.naturalWidth,h/img.naturalHeight)*clamp(Number(pos.zoom)||1,.6,5);const dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;const dx=x+(w-dw)/2+(Number(pos.x)||0)/100*w,dy=y+(h-dh)/2+(Number(pos.y)||0)/100*h;ctx.drawImage(img,dx,dy,dw,dh)}
function fontName(value){return value==='Georgia'?'Georgia,serif':`"${value||'Mikhak'}",Tahoma,sans-serif`}
function write(ctx,value,x,y,size,color,font='Mikhak',weight='bold',align='right',max=null){ctx.font=`${font==='Georgia'?'italic ':''}${weight} ${Math.round(size)}px ${fontName(font)}`;ctx.textBaseline='middle';ctx.textAlign=align;ctx.direction='rtl';ctx.fillStyle=color;let content=persian(value);if(max){while(content.length>1&&ctx.measureText(content).width>max)content=content.slice(0,-2)+'…'}ctx.fillText(content,x,y)}
function drawBackground(ctx){
 ctx.fillStyle=state.bgColor;ctx.fillRect(0,0,W,H);
 const wash=ctx.createLinearGradient(0,0,W,H);wash.addColorStop(0,rgba(state.fadeColor,.44));wash.addColorStop(1,rgba(state.bgColor,.13));ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
 const p=patterns.find(x=>x.id===state.patternId);
 if(p&&!state.imageId&&!state.noBackgroundPhoto){const im=imageFor(p.image);if(im){ctx.save();ctx.globalAlpha=state.patternOpacity/100;drawCover(ctx,im,0,0,W,H,{zoom:1});ctx.restore()}}
 const src=photoSource(),img=src?imageFor(src):null;
 if(img){const start=W*(1-clamp(state.fadeCoverage,15,100)/100);ctx.save();ctx.beginPath();ctx.rect(start,0,W-start,H);ctx.clip();drawCover(ctx,img,0,0,W,H,state.photoPosition);ctx.restore();
  const op=clamp(state.fadeOpacity/100,0,1),soft=clamp(state.fadeSoftness/100,0,1);
  const grad=ctx.createLinearGradient(start,0,W,0);grad.addColorStop(0,rgba(state.fadeColor,1));
  grad.addColorStop(Math.max(.001,.08+soft*.90),rgba(state.fadeColor,op));grad.addColorStop(1,rgba(state.fadeColor,op));
  ctx.fillStyle=grad;ctx.fillRect(start,0,W-start,H);ctx.fillStyle=state.fadeColor;ctx.fillRect(0,0,start,H);
 }else if(!p||state.noBackgroundPhoto){const grad=ctx.createLinearGradient(0,0,W,0);grad.addColorStop(0,rgba(state.fadeColor,.75));grad.addColorStop(1,rgba(state.fadeColor,.08));ctx.fillStyle=grad;ctx.fillRect(0,0,W,H)}
}
function championGold(){
 // Always a mid/deep golden shade; palette/pattern choice only changes its shade.
 if(state.paletteId==='ligaf'&&!state.patternId)return '#b58b32';
 const shades=['#af842a','#b6943d','#a98230','#bd9943','#b18b36','#c09b4a','#aa8230','#b6923d'];
 const name=String(state.paletteId||'ligaf')+'|'+String(state.patternId||'');
 let hash=0;for(const c of name)hash=(hash*31+c.charCodeAt(0))>>>0;
 return shades[hash%shades.length];
}
function drawPoster(ctx){ctx.save();ctx.clearRect(0,0,W,H);drawBackground(ctx);
 const logoPaths={woso:'assets/interview/logo-woso.jpg',barca:'assets/interview/logo-barca.jpg'};
 const headerLogo=logoPaths[state.headerLogo];
 if(headerLogo){const im=imageFor(headerLogo);if(im){ctx.save();ctx.beginPath();ctx.roundRect(25,31,64,64,15);ctx.clip();ctx.drawImage(im,25,31,64,64);ctx.restore()}}
 const wordmark=tintedAsset(WORDMARK,state.brandColor||'#8c47bb');
 if(wordmark){const hh=clamp(Number(state.brandSize)||41,20,90),ww=Math.min(370,wordmark.width*hh/wordmark.height);ctx.drawImage(wordmark,107+state.brandX,63-hh/2+state.brandY,ww,hh)}
 write(ctx,computedTitle(),1049+state.titleX,73+state.titleY,state.titleSize,state.titleColor,state.titleFont,'bold','right',640);
 const col=[1030,884,696,612,530,451,375,274,158,63];
 const headings=['رتبه','تیم','بازی','برد','تساوی','باخت','گل زده','گل خورده','تفاضل گل','امتیاز'];
 headings.forEach((str,i)=>write(ctx,str,col[i],146,i===1?21:20,state.columnColor,state.tableFont,'bold',i===1?'right':'center',i===1?180:94));
 const rows=currentRows();const start=178,rowH=68.5;
 rows.slice(0,16).forEach((t,i)=>{const y=start+i*rowH,cy=y+rowH/2,info=teamInfo(t),ov=state.overrides[info.key]||{};
  if(state.rowOpacity>0){ctx.fillStyle=rgba(i%2?'#051535':'#aedaff',state.rowOpacity/100*(i%2?.65:.5));ctx.fillRect(0,y+1,W,rowH-2)}
  write(ctx,t.rank,col[0],cy,23,state.tableText,state.tableFont,'bold','center');
  const logoUrl=imageURL(ov.logoId)||info.logo;const logo=logoUrl?imageFor(logoUrl):null;
  if(logo){const fit=Math.min(51/logo.naturalWidth,51/logo.naturalHeight);ctx.drawImage(logo,955-logo.naturalWidth*fit/2,cy-logo.naturalHeight*fit/2,logo.naturalWidth*fit,logo.naturalHeight*fit)}
  else{ctx.fillStyle='#102e5eae';ctx.beginPath();ctx.arc(955,cy,22,0,Math.PI*2);ctx.fill();write(ctx,(info.abbreviation||t.abbreviation||'•').slice(0,3),955,cy,12,'#e8f5ff','Mikhak','bold','center')}
  write(ctx,ov.name??info.name,889,cy,Number(ov.teamSize)||state.teamSize,ov.nameColor||state.tableText,ov.font||state.tableFont,'bold','right',190);
  [t.played,t.win,t.draw,t.loss,t.goalsFor,t.goalsAgainst].forEach((n,j)=>write(ctx,n,col[j+2],cy,state.numberSize,ov.numberColor||state.tableText,ov.font||state.tableFont,'bold','center',63));
  const gd=Number(t.goalDifference);if(Number.isFinite(gd)){
   const txt=persian(Math.abs(gd)),fs=state.numberSize,fg=ov.numberColor||state.tableText;
   write(ctx,txt,164,cy,fs,fg,ov.font||state.tableFont,'bold','center',63);
   if(gd!==0)write(ctx,gd>0?'+':'−',138,cy,fs,fg,ov.font||state.tableFont,'bold','center');
  }else write(ctx,t.goalDifference,col[8],cy,state.numberSize,ov.numberColor||state.tableText,ov.font||state.tableFont,'bold','center');
  const boxX=34,boxY=y+10,boxW=58,boxH=49,isFirst=t.rank===1,isTop=t.rank<=3,isBottom=t.rank>=15;
  ctx.save();ctx.fillStyle=isFirst?championGold():(ov.boxColor||(isTop?state.championsBox:isBottom?state.relegationBox:state.regularBox));ctx.shadowColor='#03133e55';ctx.shadowBlur=7;ctx.fillRect(boxX,boxY,boxW,boxH);ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(255,255,255,.23)';ctx.lineWidth=1;ctx.strokeRect(boxX+.5,boxY+.5,boxW-1,boxH-1);ctx.restore();
  write(ctx,t.points,boxX+boxW/2,cy,26,ov.pointsColor||state.pointsColor,ov.font||state.tableFont,'bold','center');
 });
 const footer=String(state.footerText??'').trim();
 if(footer){
  const fs=state.footerSize||19,fullText=persian(footer),iconWidth=20,gap=8;
  const lastRowBottom=start+Math.min(rows.length,16)*rowH;
  const footerY=(lastRowBottom+H)/2;
  ctx.save();ctx.font=`bold ${fs}px ${fontName(state.footerFont||'Mikhak')}`;
  const textW=ctx.measureText(fullText).width,groupW=iconWidth+gap+textW;
  const left=(W-groupW)/2;
  ctx.save();ctx.translate(left+3,footerY);ctx.strokeStyle='#12eddf';ctx.lineWidth=2.4;
  ctx.beginPath();ctx.moveTo(-2,1);ctx.lineTo(16,-8);ctx.lineTo(10,12);ctx.lineTo(6,4);ctx.closePath();ctx.stroke();
  ctx.beginPath();ctx.moveTo(6,4);ctx.lineTo(15,-7);ctx.stroke();ctx.restore();
  ctx.fillStyle=state.footerColor||'#fff';ctx.textBaseline='middle';ctx.textAlign='center';
  ctx.direction=/[\u0600-\u06FF]/.test(fullText)?'rtl':'ltr';
  ctx.fillText(fullText,left+iconWidth+gap+textW/2,footerY);
  ctx.restore();
 }
 ctx.restore();
}
function drawSoon(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;const canvas=$('poster');const ctx=canvas.getContext('2d',{alpha:false});drawPoster(ctx)})}
const humanSize=bytes=>bytes>=1024*1024?(bytes/(1024*1024)).toLocaleString('fa-IR',{maximumFractionDigits:2})+' مگابایت':Math.ceil(bytes/1024).toLocaleString('fa-IR')+' کیلوبایت';
function sourcesForCurrentPage(){return [...currentRows().map(t=>{const v=teamInfo(t),ov=state.overrides[v.key]||{};return imageURL(ov.logoId)||v.logo}),photoSource(),patterns.find(p=>p.id===state.patternId)?.image,WORDMARK, ...['woso','barca'].includes(state.headerLogo)?['assets/interview/logo-'+(state.headerLogo==='woso'?'woso':'barca')+'.jpg']:[]].filter(Boolean)}
async function readyForExport(){await document.fonts.ready;const sources=sourcesForCurrentPage();await Promise.all(sources.map(src=>new Promise(resolve=>{const r=imageRecord(src);if(r.status!=='loading')return resolve();r.img.addEventListener('load',resolve,{once:true});r.img.addEventListener('error',resolve,{once:true})})));}
async function posterBlob(scale){const c=document.createElement('canvas');c.width=W*scale;c.height=H*scale;const cx=c.getContext('2d',{alpha:false});cx.scale(scale,scale);drawPoster(cx);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));c.width=c.height=1;if(!blob)throw Error('مرورگر نتوانست فایل PNG تولید کند.');return blob;}
function saveBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function download(){const dialog=$('downloadDialog');openDialog('downloadDialog');const seq=++downloadSeq;
 $('downloadHint').textContent='در حال آماده‌سازی دو کیفیت…';for(const x of $$('[data-download-scale]'))x.disabled=true;
 $('downloadSizeHigh').textContent='در حال محاسبه حجم…';$('downloadSizeLow').textContent='در حال محاسبه حجم…';
 try{await readyForExport();if(seq!==downloadSeq||!dialog.open)return;const signature=JSON.stringify(state);if(!downloadPrepared||downloadPrepared.signature!==signature){
   const low=await posterBlob(1);const high=await posterBlob(2);downloadPrepared={signature,low,high};
  }
  if(seq!==downloadSeq||!dialog.open)return;
  $('downloadSizeHigh').textContent=humanSize(downloadPrepared.high.size);$('downloadSizeLow').textContent=humanSize(downloadPrepared.low.size);
  for(const x of $$('[data-download-scale]'))x.disabled=false;
  $('downloadHint').textContent='اندازه فایل‌ها واقعی است و بر اساس تنظیمات فعلی محاسبه شده.';
 }catch(e){$('downloadHint').textContent='آماده‌سازی ناموفق: '+e.message;notify('خطای دریافت تصویر: '+e.message,true)}
}
function syncControls(){for(const el of $$('[data-field]')){if(document.activeElement!==el)el.value=state[el.dataset.field]??''}
 for(const el of $$('[data-range]')){el.value=state[el.dataset.range]??0;const out=$(el.id+'Value');if(out)out.textContent=persian(el.value)+(el.dataset.range==='fadeCoverage'||['fadeOpacity','fadeSoftness','rowOpacity','patternOpacity'].includes(el.dataset.range)?'٪':'');const n=document.querySelector(`[data-number-for="${el.id}"]`);if(n&&document.activeElement!==n)n.value=el.value}
 for(const el of $$('button[data-color]')){const c=state[el.dataset.color]||'#ffffff';el.innerHTML=`<span class="s-color-dot" style="background:${safe(c)}"></span><span class="s-color-hex">${safe(c)}</span><span class="s-color-arrow">⌄</span>`}
 for(const el of $$('button[data-font]')){const f=state[el.dataset.font]||'Mikhak';el.textContent=(FONT_LABELS[f]||f)+' ▾';el.style.fontFamily=fontName(f)}
 refreshPhotoThumb();refreshPatternThumb();$$('.s-palette').forEach(el=>el.classList.toggle('selected',el.dataset.palette===state.paletteId));$('pageCount').textContent=persian(pages.length)+' صفحه';updateHeaderLogoControls();$('undoBtn').disabled=$('historyUndo').disabled=!past.length;$('redoBtn').disabled=$('historyRedo').disabled=!future.length;renderHistory()}
function renderAll({sync=true,editors=false}={}){if(sync)syncControls();if(editors)buildTeamEditors();drawSoon();updateWeekNote()}
function buildTeamEditors(){const panel=$('teamEditors');const rows=currentRows();if(!rows.length){panel.innerHTML='<p class="hint compact">پس از دریافت جدول، فهرست تیم‌ها در اینجا نمایش داده می‌شود.</p>';return}
 panel.innerHTML=rows.map(t=>{const info=teamInfo(t),ov=state.overrides[info.key]||{},opened=openTeamId===info.key,logo=imageURL(ov.logoId)||info.logo,avatar=logo?`<img alt="" src="${safe(logo)}" onerror="this.style.display='none'">`:`<span class="s-logo-fallback">${safe(info.abbreviation||'؟')}</span>`;
 return `<div class="s-team-editor ${opened?'open':''}" data-team="${safe(info.key)}"><button type="button" class="s-team-summary" data-team-open="${safe(info.key)}">${avatar}<strong>${safe(ov.name??info.name)}</strong><small>رتبه ${persian(t.rank)} ${opened?'▴':'▾'}</small></button>
 <div class="s-team-content"><div class="s-team-head"><button data-team-done="${safe(info.key)}" title="ثبت">✓</button><button data-team-close="${safe(info.key)}" title="بستن">−</button><button data-team-reset="${safe(info.key)}" title="حالت پیش‌فرض">↺</button></div>
 <label>نام تیم<input type="text" maxlength="38" data-team-field="name" data-team-key="${safe(info.key)}" value="${safe(ov.name??info.name)}"></label>
 <div class="two-col"><label>رنگ نام<button type="button" class="s-color-button" data-team-color="nameColor" data-team-key="${safe(info.key)}"><span class="s-color-dot" style="background:${safe(ov.nameColor||state.tableText)}"></span><span class="s-color-hex">${safe(ov.nameColor||state.tableText)}</span>⌄</button></label><label>رنگ عددها<button type="button" class="s-color-button" data-team-color="numberColor" data-team-key="${safe(info.key)}"><span class="s-color-dot" style="background:${safe(ov.numberColor||state.tableText)}"></span><span class="s-color-hex">${safe(ov.numberColor||state.tableText)}</span>⌄</button></label></div>
 <div class="two-col"><label>رنگ باکس امتیاز${t.rank===1?`<span class="s-gold-locked">طلایی ثابت با سایه هماهنگ پالت</span>`:`<button type="button" class="s-color-button" data-team-color="boxColor" data-team-key="${safe(info.key)}"><span class="s-color-dot" style="background:${safe(ov.boxColor||((t.rank<=3)?state.championsBox:(t.rank>=15)?state.relegationBox:state.regularBox))}"></span>⌄</button>`}</label><label>رنگ عدد امتیاز<button type="button" class="s-color-button" data-team-color="pointsColor" data-team-key="${safe(info.key)}"><span class="s-color-dot" style="background:${safe(ov.pointsColor||state.pointsColor)}"></span>⌄</button></label></div>
 <div class="two-col"><label>فونت تیم<select data-team-field="font" data-team-key="${safe(info.key)}">${FONTS.map(f=>`<option value="${f}" ${f===(ov.font||state.tableFont)?'selected':''}>${safe(FONT_LABELS[f]||f)}</option>`).join('')}</select></label><label>اندازه نام تیم<select data-team-field="teamSize" data-team-key="${safe(info.key)}">${[18,20,21,22,23,24,25,26,27,28,29].map(n=>`<option value="${n}" ${Number(ov.teamSize||state.teamSize)===n?'selected':''}>${persian(n)}</option>`).join('')}</select></label></div>
 <label>لوگوی اختصاصی<input type="file" accept="image/png,image/jpeg,image/webp" data-logo-file="${safe(info.key)}"></label>
 <div class="s-team-logo-row">${avatar}<button type="button" class="btn secondary" data-logo-reset="${safe(info.key)}">استفاده از لوگوی بانک سایت</button></div>
 </div></div>`}).join('');}
function paletteButton(p){return `<button type="button" class="s-palette ${state.paletteId===p.id?'selected':''}" data-palette="${safe(p.id)}"><strong>${safe(p.name)}</strong><span class="s-palette-swatches">${p.colors.filter(Boolean).map(c=>`<i style="background:${safe(c)}"></i>`).join('')}</span><small>${p.id==='ligaf'?'پیشنهادی برای لیگا اف':p.id==='woso'?'رنگ‌های ووسو سنتر':'رنگ‌بندی آماده'}</small></button>`}
function buildPalettes(){$('paletteGrid').innerHTML=palettes.slice(0,10).map(paletteButton).join('');$('allPaletteGrid').innerHTML=palettes.map(paletteButton).join('');}
function filterPalettes(q){const key=String(q||'').trim();$$('#allPaletteGrid .s-palette').forEach(el=>{el.hidden=!!key&&!el.textContent.includes(key)})}
function updateSuggestedPattern(){const p=patterns.find(x=>x.id===state.patternId);const box=$('patternSuggestedBox');if(!box)return;const active=!!p&&!state.imageId&&!state.noBackgroundPhoto&&!!p.suggestedPalette?.colors;box.hidden=!active;if(active){const pick=palettes.find(x=>x.id==='pattern:'+p.id);$('patternSuggestedPalette').innerHTML=pick?paletteButton(pick):'<small>پالت پیشنهادی این طرح آماده نیست.</small>';}}
function scrollToPreview(){const canvas=$('poster');if(canvas)canvas.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
function refreshPhotoThumb(){const thumb=$('photoThumb');const url=photoSource();thumb.innerHTML=url?`<img src="${safe(url)}" alt="تصویر پس‌زمینه انتخابی">`:'<span>بدون تصویر؛ می‌توانید عکس دلخواه آپلود کنید.</span>';}
function refreshPatternThumb(){const selected=patterns.find(p=>p.id===state.patternId),url=imageURL(state.imageId),src=url||selected?.thumb||selected?.image;const n=$('patternThumb');n.innerHTML=(src||(!state.noBackgroundPhoto?DEFAULT_PHOTO:null))?`<img alt="" src="${safe(src||DEFAULT_PHOTO)}">`:'▧';$('patternName').textContent=url?'تصویر دلخواه':selected?.name||(state.noBackgroundPhoto?'رنگ خالص':'تصویر پیش‌فرض');updateSuggestedPattern()}
function buildPatternLibrary(){const my=$('patternMy'),ready=$('patternReady');my.innerHTML=`<button type="button" class="s-library-card" data-default-photo="1"><img src="${DEFAULT_PHOTO}" alt="عکس پیش‌فرض"><strong>تصویر پیش‌فرض</strong></button><button type="button" class="s-library-card" data-no-photo="1"><span class="s-page-art">بدون تصویر</span><strong>رنگ خالص پس‌زمینه</strong></button>`+Array.from(mediaUrls.entries()).filter(([id])=>id.startsWith('photo-')).map(([id,url])=>`<button type="button" class="s-library-card ${state.imageId===id?'selected':''}" data-photo-id="${safe(id)}"><img src="${safe(url)}" alt="تصویر دلخواه"><strong>تصویر دلخواه</strong><small>استفاده مجدد</small></button>`).join('');
 ready.innerHTML=patterns.map(p=>`<button type="button" class="s-library-card ${state.patternId===p.id?'selected':''}" data-pattern-id="${safe(p.id)}"><img src="${safe(p.thumb||p.image)}" alt=""><strong>${safe(p.name)}</strong></button>`).join('');}
function renderHistory(){const items=hist.slice().reverse();$('historyList').innerHTML=items.length?items.map((h,i)=>`<button type="button" class="s-history-item" data-history-i="${hist.length-1-i}"><span>◴</span><span>${safe(h.label)}</span><small>${new Date(h.time).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'})}</small></button>`).join(''):'<p class="hint">هنوز تغییری ثبت نشده است.</p>'}
function renderPages(){const grid=$('pagesGrid');activePage().state=deep(state);grid.innerHTML=pages.map((p,i)=>`<div class="s-page ${i===pageIndex?'active':''}" data-page-i="${i}"><button type="button" class="s-page-open" data-page-go="${i}"><canvas width="216" height="270" class="s-page-thumb" data-page-thumb="${i}" aria-label="پیش‌نمایش صفحه"></canvas><strong>${safe(p.name)}</strong></button><div class="s-page-tools"><button type="button" data-page-go="${i}">باز کردن</button><button type="button" data-page-duplicate="${i}">تکثیر</button><button type="button" data-page-rename="${i}">تغییر نام</button><button type="button" data-page-delete="${i}" ${pages.length<=1?'disabled':''}>حذف</button></div></div>`).join('');const prior=state;for(const el of $$('[data-page-thumb]',grid)){const p=pages[Number(el.dataset.pageThumb)];if(!p)continue;const cx=el.getContext('2d');cx.setTransform(.2,0,0,.2,0,0);state={...DEFAULT(),...p.state};drawPoster(cx)}state=prior;}
function updateWeekNote(){const w=getWeek(),note=$('weekNote');if(!state.data?.teams?.length&&!state.weekOverride){if(note)note.textContent='پیش‌نمایش نمونه هفته ۱۰ است؛ با دریافت آنلاین شماره هفته از داده‌های جدید برآورد می‌شود.';return}if(note)note.textContent=w.source==='برآوردی'?`هفته ${persian(w.number)} بر اساس بیشترین تعداد بازی انجام‌شده برآورد شده؛ اگر با هفته رسمی فرق دارد، آن را اصلاح کن.`:w.source==='API'?`شماره هفته ${persian(w.number)} از داده API دریافت شد.`:w.source==='دستی'?`هفته ${persian(w.number)} به‌صورت دستی تنظیم شده است.`:'تا دریافت جدول، شماره هفته مشخص نیست.';}
function updateHeaderLogoControls(){const l=({woso:['لوگوی ووسو سنتر','assets/interview/logo-woso.jpg'],barca:['لوگوی بارسلونا','assets/interview/logo-barca.jpg'],none:['بدون لوگو','']})[state.headerLogo||'woso'];if(!l)return;$('headerLogoName').textContent=l[0];$('headerLogoPreview').src=l[1]||'assets/brand/logo-alpha.webp';$('headerLogoPreview').style.opacity=l[1]?'1':'.3'}
function addPage(copy=false){activePage().state=deep(state);if(pages.length>=30){notify('حداکثر ۳۰ صفحه قابل نگهداری است.',true);return}const id='page-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),number=pages.length+1;const s=copy?deep(state):{...DEFAULT(),data:deep(state.data),dataFetchedAt:state.dataFetchedAt};pages.push({id,name:(copy?'کپی صفحه ':'صفحه ')+persian(number),state:deep(s)});switchPage(pages.length-1);renderPages()}
function switchPage(n){activePage().state=deep(state);pageIndex=n;state={...DEFAULT(),...deep(pages[n].state)};past=[];future=[];hist=[];openTeamId=null;buildPalettes();renderAll({sync:true,editors:true});saveStored();renderPages()}
function validatePaletteColor(x){return /^#[0-9a-f]{6}$/i.test(String(x||''))?x:'#ffffff'}
function openDialog(id){$(id).showModal()}
function closeDialog(id){if($(id).open)$(id).close()}
let pickerHSV={h:270,s:1,v:1};
function hsvToHex({h,s,v}){const c=v*s,xx=c*(1-Math.abs((h/60)%2-1)),m=v-c;let parts=h<60?[c,xx,0]:h<120?[xx,c,0]:h<180?[0,c,xx]:h<240?[0,xx,c]:h<300?[xx,0,c]:[c,0,xx];return '#'+parts.map(x=>Math.round((x+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase()}
function hexToHSV(hex){const vals=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);const [r,g,b]=vals,max=Math.max(...vals),min=Math.min(...vals),d=max-min;let h=0;if(d)h=max===r?60*(((g-b)/d)%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);return {h:(h+360)%360,s:max===0?0:d/max,v:max}}
function renderColorPicker(){const hex=hsvToHex(pickerHSV);$('hexColor').value=hex;$('colorPreview').style.backgroundColor=hex;$('colorHue').value=String(Math.round(pickerHSV.h));$('colorSV').style.setProperty('--pure-hue',`hsl(${pickerHSV.h} 100% 50%)`);$('colorTarget').style.left=(pickerHSV.s*100)+'%';$('colorTarget').style.top=((1-pickerHSV.v)*100)+'%'}
function setPickerHex(hex){if(!/^#[0-9a-f]{6}$/i.test(hex))return;pickerHSV=hexToHSV(hex);renderColorPicker()}
function openColor(target,teamKey=null){activeColor=target;activeTeamColor=teamKey;const val=validatePaletteColor((teamKey?state.overrides[teamKey]?.[target]:state[target])||'#ffffff');setPickerHex(val);$('colorTitle').textContent='انتخاب رنگ';const colors=[...new Set([...palettes.flatMap(p=>p.colors),'#ffffff','#000000','#0c2d6b','#008dd2','#ffd233','#dd427a','#1fc395'].filter(Boolean))].slice(0,40);$('colorSwatches').innerHTML=colors.map(c=>`<button type="button" class="quick-color" title="${safe(c)}" data-swatch="${safe(c)}" style="background:${safe(c)}"></button>`).join('');openDialog('colorDialog')}
async function openFont(target){activeFont=target;
 $('fontGrid').innerHTML=FONTS.map(f=>{const selected=f===(state[target]||'Mikhak');return `<button type="button" class="s-font-option${selected?' selected':''}" data-font-choice="${f}" aria-pressed="${selected}"><span class="s-font-option-name">${safe(FONT_LABELS[f]||f)}</span><strong class="s-font-sample" lang="fa" dir="rtl" style='font-family:${fontName(f)}'>بارسلونا</strong><span class="s-font-option-check" aria-hidden="true">${selected?'✓':''}</span></button>`}).join('');
 openDialog('fontDialog');
 // Every sample loads its actual local font face; do not display the generic sample.
 await Promise.allSettled(FONTS.filter(f=>f!=='Georgia').map(f=>document.fonts.load(`24px "${f}"`,'بارسلونا')));
}
async function imageUpload(file){if(!file)return;if(!file.type.startsWith('image/')){notify('فقط فایل تصویری انتخاب کن.',true);return}if(file.size>16*1024*1024){notify('حجم فایل تصویر باید کمتر از ۱۶ مگابایت باشد.',true);return}const url=URL.createObjectURL(file);const img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});pendingPhoto={file,url};imageRecord(url);cropPosition={x:0,y:0,zoom:1},downloadPrepared=null,downloadSeq=0,tintCache=new Map();syncCropControls();drawCrop();openDialog('cropDialog')}catch{URL.revokeObjectURL(url);notify('فایل تصویر قابل خواندن نیست.',true)}}
function openCropForCurrent(){const url=photoSource();if(!url){$('photoFile').click();return}pendingPhoto={url,id:state.imageId,file:null};cropPosition=deep(state.photoPosition||{x:0,y:0,zoom:1});syncCropControls();drawCrop();openDialog('cropDialog')}
function syncCropControls(){$('cropZoom').value=Math.round((cropPosition.zoom||1)*100);$('cropX').value=Math.round(cropPosition.x||0);$('cropY').value=Math.round(cropPosition.y||0);$('cropZoomVal').textContent=persian($('cropZoom').value)+'٪';for(const id of ['cropZoom','cropX','cropY']){const n=document.querySelector(`[data-number-for="${id}"]`);if(n&&document.activeElement!==n)n.value=$(id).value}}
function drawCrop(){if(!pendingPhoto)return;const c=$('cropCanvas'),ctx=c.getContext('2d');ctx.fillStyle=state.bgColor;ctx.fillRect(0,0,432,540);const img=imageFor(pendingPhoto.url);if(img){ctx.save();ctx.scale(.4,.4);drawCover(ctx,img,0,0,W,H,cropPosition);ctx.restore();const start=432*(1-state.fadeCoverage/100);const g=ctx.createLinearGradient(start,0,432,0);g.addColorStop(0,rgba(state.fadeColor,1));g.addColorStop(.5,rgba(state.fadeColor,state.fadeOpacity/100));g.addColorStop(1,rgba(state.fadeColor,.09));ctx.fillStyle=g;ctx.fillRect(0,0,432,540);ctx.fillStyle=state.fadeColor;ctx.fillRect(0,0,start,540)}else{imageRecord(pendingPhoto.url);setTimeout(()=>{if($('cropDialog').open)drawCrop()},180)}}
async function saveCrop(){if(!pendingPhoto)return;let id=pendingPhoto.id;if(pendingPhoto.file){id='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const ok=await mediaPut(id,{blob:pendingPhoto.file,name:pendingPhoto.file.name,created:Date.now()});mediaUrls.set(id,pendingPhoto.url);if(!ok)notify('عکس فعلاً قابل استفاده است، اما مرورگر امکان ذخیره دائمی آن را نداد.',true)}commit('تنظیم تصویر پس‌زمینه',()=>{state.imageId=id||null;state.patternId=null;state.noBackgroundPhoto=false;state.photoPosition=deep(cropPosition)});pendingPhoto=null;closeDialog('cropDialog');buildPatternLibrary()}
async function teamLogoUpload(file,id){if(!file)return;if(!file.type.startsWith('image/'))return notify('فایل لوگو باید تصویری باشد.',true);const imageId='teamlogo-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const okay=await mediaPut(imageId,{blob:file,name:file.name,created:Date.now()});mediaUrls.set(imageId,URL.createObjectURL(file));commit('تغییر لوگوی تیم',()=>{(state.overrides[id]??={}).logoId=imageId},{editors:true});if(!okay)notify('لوگو انتخاب شد اما ذخیره بلندمدت مرورگر در دسترس نیست.',true)}
function enhanceRangeControls(){
 const ranges=$$('.standings-editor input[type="range"][data-range],.s-crop-controls input[type="range"]');
 for(const slider of ranges){if(slider.dataset.enhanced)continue;slider.dataset.enhanced='1';
  const isCrop=slider.closest('.s-crop-controls')!==null;
  const field=isCrop?slider.id:slider.dataset.range;
  const base=isCrop?({cropZoom:100,cropX:0,cropY:0})[slider.id]:DEFAULT()[field];
  const row=document.createElement('span');row.className='s-range-edit';
  const num=document.createElement('input');num.type='number';num.min=slider.min;num.max=slider.max;num.step=slider.step||'1';num.inputMode='decimal';num.value=slider.value;num.dataset.numberFor=slider.id;num.setAttribute('aria-label','مقدار عددی '+field);
  const reset=document.createElement('button');reset.type='button';reset.className='s-range-reset';reset.textContent='↺';reset.title='بازگشت به پیش‌فرض';reset.setAttribute('aria-label','بازگشت '+field+' به پیش‌فرض');
  function update(val){const v=clamp(Number(val),Number(slider.min),Number(slider.max));if(!Number.isFinite(v))return;slider.value=String(v);num.value=slider.value;slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));}
  num.addEventListener('change',()=>update(num.value));reset.addEventListener('click',()=>update(base));
  row.append(num,reset);slider.insertAdjacentElement('afterend',row);
  slider.addEventListener('input',()=>{if(document.activeElement!==num)num.value=slider.value});
 }
}
function attachEvents(){
  enhanceRangeControls();
 $$('.standings-tabs .tab').forEach(btn=>btn.addEventListener('click',()=>{const t=btn.dataset.tab;$$('.standings-tabs .tab').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-selected',b===btn?'true':'false')});$$('.standings-editor > .tab-content').forEach(p=>p.classList.toggle('hidden',p.id!==`tab-${t}`))}));
 $('fetchBtn').addEventListener('click',fetchTable);$('downloadBtn').addEventListener('click',download);$('allPalettes').addEventListener('click',()=>{buildPalettes();$('paletteSearch').value='';filterPalettes('');openDialog('paletteDialog')});$('paletteSearch').addEventListener('input',e=>filterPalettes(e.target.value));$$('[data-download-scale]').forEach(b=>b.addEventListener('click',()=>{const scale=Number(b.dataset.downloadScale);const blob=scale===2?downloadPrepared?.high:downloadPrepared?.low;if(!blob)return;saveBlob(blob,`WoSoCenter-LigaF-${state.data?.season?.replace('/','-')||'poster'}-${scale}x-${Date.now()}.png`);closeDialog('downloadDialog');notify('فایل PNG ذخیره شد ✓')}));$('undoBtn').addEventListener('click',undo);$('redoBtn').addEventListener('click',redo);$('historyUndo').addEventListener('click',undo);$('historyRedo').addEventListener('click',redo);$('historyOpen').addEventListener('click',()=>{const tab=$$('.standings-tabs .tab').find(x=>x.dataset.tab==='history');tab?.click();document.querySelector('.standings-editor')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});
 $('themeToggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('woso-standings-ui-theme',document.documentElement.dataset.theme)}catch{}});
 $('uploadPhoto').addEventListener('click',()=>$('photoFile').click());$('patternUpload').addEventListener('click',()=>$('photoFile').click());$('adjustPhoto').addEventListener('click',openCropForCurrent);
 $('photoFile').addEventListener('change',e=>{imageUpload(e.target.files?.[0]);e.target.value=''});
 $('leaguePick').addEventListener('click',()=>{renderLeagueDialog();openDialog('leagueDialog')});$('headerLogoPick').addEventListener('click',()=>openDialog('headerLogoDialog'));$('resetAutoTitle').addEventListener('click',()=>commit('بازگشت به عنوان خودکار',()=>{state.titleText=''}));
 $('openPattern').addEventListener('click',()=>{buildPatternLibrary();openDialog('patternDialog')});
 $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeDialog(btn.dataset.close)));
 $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.leagueChoice){const lg=LEAGUES.find(x=>x.id===b.dataset.leagueChoice);if(lg?.enabled){commit('تغییر لیگ',()=>{state.league=lg.id});closeDialog('leagueDialog')}}
 if(b.dataset.headerLogo){commit('انتخاب لوگوی کانال',()=>{state.headerLogo=b.dataset.headerLogo});closeDialog('headerLogoDialog')}
 if(b.dataset.pageDuplicate){const i=Number(b.dataset.pageDuplicate);if(i!==pageIndex)switchPage(i);addPage(true)}
 if(b.dataset.color)openColor(b.dataset.color);
 if(b.dataset.teamColor)openColor(b.dataset.teamColor,b.dataset.teamKey);
 if(b.dataset.font)openFont(b.dataset.font);
 if(b.dataset.swatch)setPickerHex(b.dataset.swatch)
 if(b.dataset.fontChoice){commit('تغییر فونت',()=>{state[activeFont]=b.dataset.fontChoice});closeDialog('fontDialog')}
 if(b.dataset.palette){const p=palettes.find(x=>x.id===b.dataset.palette);if(!p)return;commit('تغییر پالت رنگی',()=>{for(const name of ['bgColor','fadeColor','accentColor','tableText','columnColor','firstBox','championsBox','regularBox','relegationBox','brandColor','starsColor'])if(p[name])state[name]=p[name];state.paletteId=p.id});if($('paletteDialog').open)closeDialog('paletteDialog');scrollToPreview();}
 if(b.dataset.ptab){$$('[data-ptab]').forEach(el=>el.classList.toggle('active',el===b));$('patternMy').hidden=b.dataset.ptab!=='my';$('patternReady').hidden=b.dataset.ptab!=='ready';$('patternUpload').hidden=b.dataset.ptab!=='my'}
 if(b.dataset.patternId){commit('انتخاب پترن',()=>{state.patternId=b.dataset.patternId;state.imageId=null;state.noBackgroundPhoto=false});closeDialog('patternDialog');buildPatternLibrary()}
 if(b.dataset.photoId){commit('انتخاب تصویر از گالری',()=>{state.imageId=b.dataset.photoId;state.patternId=null;state.noBackgroundPhoto=false});closeDialog('patternDialog');buildPatternLibrary()}
 if(b.dataset.defaultPhoto){commit('بازگشت به تصویر پیش‌فرض',()=>{state.imageId=null;state.patternId=null;state.noBackgroundPhoto=false;state.photoPosition=deep(DEFAULT().photoPosition)});closeDialog('patternDialog');buildPatternLibrary()}
  if(b.dataset.noPhoto){commit('حذف پس‌زمینه تصویری',()=>{state.imageId=null;state.patternId=null;state.noBackgroundPhoto=true});closeDialog('patternDialog');buildPatternLibrary()}
 if(b.dataset.teamOpen){openTeamId=openTeamId===b.dataset.teamOpen?null:b.dataset.teamOpen;buildTeamEditors()}
 if(b.dataset.teamDone){notify('تنظیمات تیم ذخیره شد ✓');openTeamId=null;buildTeamEditors()}
 if(b.dataset.teamClose){openTeamId=null;buildTeamEditors()}
 if(b.dataset.teamReset){const id=b.dataset.teamReset;commit('بازنشانی تیم',()=>{delete state.overrides[id]},{editors:true})}
 if(b.dataset.logoReset){const id=b.dataset.logoReset;commit('بازگشت به لوگوی بانک',()=>{if(state.overrides[id])delete state.overrides[id].logoId},{editors:true})}
 if(b.dataset.historyI){const i=Number(b.dataset.historyI),h=hist[i];if(h){commit('بازگشت به مرحله قبلی',()=>{state=deep(h.snapshot)},{sync:true,editors:true})}}
 if(b.dataset.pageGo) {switchPage(Number(b.dataset.pageGo));closeDialog('pagesDialog')}
 if(b.dataset.pageRename){const i=Number(b.dataset.pageRename),name=prompt('نام صفحه را وارد کن',pages[i].name);if(name?.trim()){pages[i].name=name.trim().slice(0,40);saveStored();renderPages()}}
 if(b.dataset.pageDelete){const i=Number(b.dataset.pageDelete);if(pages.length<=1)return;if(confirm(`صفحه «${pages[i].name}» حذف شود؟`)){pages.splice(i,1);pageIndex=clamp(pageIndex>i?pageIndex-1:pageIndex,0,pages.length-1);state=deep(pages[pageIndex].state);past=[];future=[];hist=[];renderAll({sync:true,editors:true});saveStored();renderPages()}}
 });
 $('hexColor').addEventListener('input',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))setPickerHex(e.target.value)});
 $('colorHue').addEventListener('input',e=>{pickerHSV.h=Number(e.target.value);renderColorPicker()});
 const colorSV=$('colorSV');function updateSV(e){const r=colorSV.getBoundingClientRect();pickerHSV.s=clamp((e.clientX-r.left)/r.width,0,1);pickerHSV.v=1-clamp((e.clientY-r.top)/r.height,0,1);renderColorPicker()}
 colorSV.addEventListener('pointerdown',e=>{e.preventDefault();colorSV.setPointerCapture(e.pointerId);updateSV(e)});colorSV.addEventListener('pointermove',e=>{if(colorSV.hasPointerCapture(e.pointerId))updateSV(e)});
 $('colorApply').addEventListener('click',()=>{const val=$('hexColor').value;if(!/^#[0-9a-f]{6}$/i.test(val)){notify('رنگ را به شکل #123ABC وارد کن.',true);return}commit('تغییر رنگ',()=>{if(activeTeamColor){(state.overrides[activeTeamColor]??={})[activeColor]=val}else{state[activeColor]=val;state.paletteId='custom'}},{editors:!!activeTeamColor});closeDialog('colorDialog')});
 const snapshots=new WeakMap();
 document.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-field],[data-range],[data-team-field]')){if(!snapshots.has(el))snapshots.set(el,deep(state));if(el.dataset.field)state[el.dataset.field]=el.value;
 else if(el.dataset.range)state[el.dataset.range]=Number(el.value);
 else if(el.dataset.teamField){const id=el.dataset.teamKey,field=el.dataset.teamField;(state.overrides[id]??={})[field]=field==='teamSize'?Number(el.value):el.value}
 const out=$(el.id+'Value');if(out)out.textContent=persian(el.value)+(el.dataset.range&&['fadeOpacity','fadeCoverage','fadeSoftness','rowOpacity','patternOpacity'].includes(el.dataset.range)?'٪':'');const numeric=document.querySelector(`[data-number-for="${el.id}"]`);if(numeric&&document.activeElement!==numeric)numeric.value=el.value;drawSoon();}}
 );
 document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-field],[data-range],[data-team-field]')){const old=snapshots.get(el);snapshots.delete(el);if(old&&JSON.stringify(old)!==JSON.stringify(state)){past.push(old);if(past.length>28)past.shift();future=[];hist.push({label:el.dataset.teamField?'ویرایش تیم':'ویرایش تنظیمات',time:Date.now(),snapshot:deep(state)});if(hist.length>28)hist.shift();renderAll({sync:true,editors:!!el.dataset.teamField});saveStored()}}
 if(el.dataset.logoFile){teamLogoUpload(el.files?.[0],el.dataset.logoFile)}
 });
 $('cropZoom').addEventListener('input',e=>{cropPosition.zoom=Number(e.target.value)/100;syncCropControls();drawCrop()});$('cropX').addEventListener('input',e=>{cropPosition.x=Number(e.target.value);drawCrop()});$('cropY').addEventListener('input',e=>{cropPosition.y=Number(e.target.value);drawCrop()});
 const cropCanvas=$('cropCanvas');let pointers=new Map(),gesture=null;
 function updateGesture(){const ps=[...pointers.values()];if(ps.length===1){gesture={count:1,point:ps[0],x:cropPosition.x,y:cropPosition.y}}else if(ps.length>=2){const a=ps[0],b=ps[1];gesture={count:2,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,dist:Math.hypot(a.x-b.x,a.y-b.y)||1,x:cropPosition.x,y:cropPosition.y,zoom:cropPosition.zoom}}}
 cropCanvas.addEventListener('pointerdown',e=>{e.preventDefault();cropCanvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});updateGesture()});
 cropCanvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()],b=cropCanvas.getBoundingClientRect();if(gesture?.count===1&&ps.length===1){cropPosition.x=clamp(gesture.x+(ps[0].x-gesture.point.x)/b.width*100,-180,180);cropPosition.y=clamp(gesture.y+(ps[0].y-gesture.point.y)/b.height*100,-180,180)}else if(gesture?.count===2&&ps.length>=2){const a=ps[0],d=ps[1],cx=(a.x+d.x)/2,cy=(a.y+d.y)/2;cropPosition.x=clamp(gesture.x+(cx-gesture.mx)/b.width*100,-180,180);cropPosition.y=clamp(gesture.y+(cy-gesture.my)/b.height*100,-180,180);cropPosition.zoom=clamp(gesture.zoom*Math.hypot(a.x-d.x,a.y-d.y)/gesture.dist,.6,5)}syncCropControls();drawCrop()});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])cropCanvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);updateGesture()});
 cropCanvas.addEventListener('wheel',e=>{e.preventDefault();const delta=Math.exp(-e.deltaY*.002);cropPosition.zoom=clamp(cropPosition.zoom*delta,.6,5);syncCropControls();drawCrop()},{passive:false});
 $('cropCancel').addEventListener('click',()=>{if(pendingPhoto?.file)URL.revokeObjectURL(pendingPhoto.url);pendingPhoto=null;closeDialog('cropDialog')});$('cropSave').addEventListener('click',saveCrop);
 $('applyAllFont').addEventListener('click',()=>commit('فونت کلی پوستر',()=>{state.titleFont=state.tableFont=state.footerFont=state.allFont;for(const k of Object.keys(state.overrides))delete state.overrides[k].font},{editors:true}));
 $('pagesOpen').addEventListener('click',()=>{renderPages();openDialog('pagesDialog')});$('pagesOpen2').addEventListener('click',()=>{renderPages();openDialog('pagesDialog')}); $('downloadAllPages').addEventListener('click',async()=>{activePage().state=deep(state);const btn=$('downloadAllPages');btn.disabled=true;try{await document.fonts.ready;const original=state;for(let i=0;i<pages.length;i++){state={...DEFAULT(),...pages[i].state};const sources=[...currentRows().map(t=>{const v=teamInfo(t),ov=state.overrides[v.key]||{};return imageURL(ov.logoId)||v.logo}),photoSource(),WORDMARK,patterns.find(p=>p.id===state.patternId)?.image,state.headerLogo==='barca'?'assets/interview/logo-barca.jpg':'assets/interview/logo-woso.jpg'].filter(Boolean);await Promise.all(sources.map(src=>new Promise(resolve=>{const r=imageRecord(src);if(r.status!=='loading')return resolve();r.img.addEventListener('load',resolve,{once:true});r.img.addEventListener('error',resolve,{once:true})})));const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const cx=c.getContext('2d');cx.scale(2,2);drawPoster(cx);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WoSoCenter-'+String(i+1).padStart(2,'0')+'-'+pages[i].name.replace(/[\\/:*?"<>|]/g,'')+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}await new Promise(resolve=>setTimeout(resolve,350))}state=original;drawSoon();notify('دریافت جداگانه تصاویر آغاز شد؛ اگر مرورگر پرسید، اجازه دانلود چند فایل را بده.')}catch(err){notify('دانلود صفحات ناموفق: '+err.message,true)}finally{state={...DEFAULT(),...pages[pageIndex].state};btn.disabled=false;drawSoon()}});
$('addPage').addEventListener('click',()=>addPage(false));$('duplicatePage').addEventListener('click',()=>addPage(true));
 $('exportProject').addEventListener('click',()=>{activePage().state=deep(state);const content=JSON.stringify({schema:'woso-standings-v3',pages,pageIndex},null,2);const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WoSoCenter-standings-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('فایل تنظیمات ذخیره شد. تصاویر جداگانه در مرورگر نگهداری می‌شوند.')});
 $('importProject').addEventListener('click',()=>$('importProjectFile').click());$('importProjectFile').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;const value=JSON.parse(await f.text());if(value.schema!=='woso-standings-v3'||!Array.isArray(value.pages)||!value.pages.length)throw Error('فرمت فایل تنظیمات قابل پشتیبانی نیست.');if(!confirm('پروژه فعلی با تنظیمات واردشده جایگزین شود؟'))return;pages=value.pages.slice(0,30);pageIndex=clamp(Number(value.pageIndex)||0,0,pages.length-1);state={...DEFAULT(),...deep(pages[pageIndex].state)};past=[];future=[];hist=[];renderAll({sync:true,editors:true});saveStored();notify('تنظیمات بازیابی شد؛ تصاویر در صورت وجود در همین مرورگر بارگیری می‌شوند.')}catch(err){notify(err.message,true)}e.target.value=''});
 $('resetProject').addEventListener('click',()=>{if(!confirm('تمام تنظیمات پروژه جاری پاک شود و از اول شروع کنیم؟'))return;pages=[{id:'page-'+Date.now(),name:'صفحه ۱',state:DEFAULT()}];pageIndex=0;state=deep(pages[0].state);past=[];future=[];hist=[];renderAll({sync:true,editors:true});saveStored();notify('پروژه تازه ساخته شد.')});
 document.addEventListener('keydown',e=>{const input=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');if((e.ctrlKey||e.metaKey)&&!e.altKey){if(e.key.toLowerCase()==='z'&&!input){e.preventDefault();e.shiftKey?redo():undo()}else if(e.key.toLowerCase()==='y'&&!input){e.preventDefault();redo()}}});
 }
async function init(){try{document.documentElement.dataset.theme=localStorage.getItem('woso-standings-ui-theme')||'dark'}catch{}restore();attachEvents();syncControls();buildTeamEditors();drawSoon();if(state.data?.teams?.length){status(lastFetchLabel(state.dataFetchedAt)||'جدول ذخیره‌شده نمایش داده می‌شود؛ برای به‌روزرسانی دریافت کن.', 'ok');$('dataBadge').textContent=`${persian(state.data.teams.length)} تیم · ${persian(state.data.season)} · داده ذخیره‌شده`}if(!state.data?.teams?.length){status('پیش‌نمایش نمونه نمایش داده می‌شود؛ برای جدول تازه، «ساخت خودکار جدول» را بزن.');$('dataBadge').textContent='پیش‌نمایش نمونه · داده‌ها آنلاین نیستند'}await Promise.allSettled([loadLibraries(),loadMedia()]);try{await document.fonts.ready}catch{}drawSoon()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
