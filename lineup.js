'use strict';
/* WoSoCenter Lineup Builder v5.2 — no external JS, API, CDN, or image service. */
const L=$id=>document.getElementById($id),LW=1080,LH=1350;
const LSTORE='wosocenter-lineup-v1',LMEDIA_DB='wosocenter-lineup-media-v1';
const LFONT=[['Ario','آریو'],['DastNevis','دست‌نویس'],['ShahGosh','شاهگوش'],['Shokoh','شکوه'],['Paeez','پاییز'],['Tehran','تهران'],['Titr','تیتر'],['Hayat','حیات'],['DinArabic','دینا عربیک'],['Sahel','ساحل'],['Soltan','سلطان'],['Sepahbod','سپهبد'],['Cinema','سینما'],['Lalezar','لاله‌زار'],['Matin','متین'],['Mikhak','میخک'],['Haftad','هفتاد'],['Casablanca','کازابلانکا'],['GraphikArabic','گرافیک عربیک'],['YekanBoom','یکان بوم']];
const LFONTS=new Set(LFONT.map(x=>x[0]));
const LDEFAULT_COLORS={header:'#920a36',upper:'#0e3562',lower:'#970d39',accent:'#e6aa22',side:'#edb824',card1:'#a51a47',card2:'#134e87',cardName:'#0b3157',cardBorder:'#ab1b52',watermark:'#d01847',text:'#f2bc27',headerText:'#f2bc27',logoBg:'#092c5d',topText:'#f2bc27',topBox:'#a51a47',footerText:'#f2bc27',footerBox:'#a51a47',logoTint:'#f2bc27',cardPosition:'#f2bc27'};
const LDUMMY_A='assets/lineup/demo-portrait-a.png',LDUMMY_B='assets/lineup/demo-portrait-b.png';
const LFORMATION={
 '4-3-3':[[218,305,'LW'],[540,305,'ST'],[862,305,'RW'],[218,590,'LCM'],[540,590,'CM'],[862,590,'RCM'],[125,846,'LB'],[391,846,'LCB'],[655,846,'RCB'],[925,846,'RB']],
 '4-2-3-1':[[540,272,'ST',.84],[218,461,'LW',.84],[540,461,'CAM',.84],[862,461,'RW',.84],[355,651,'LDM',.84],[725,651,'RDM',.84],[125,846,'LB',.84],[391,846,'LCB',.84],[655,846,'RCB',.84],[925,846,'RB',.84]],
 '4-4-2':[[346,305,'ST'],[734,305,'ST'],[125,587,'LM'],[390,587,'CM'],[655,587,'CM'],[925,587,'RM'],[125,846,'LB'],[391,846,'LCB'],[655,846,'RCB'],[925,846,'RB']],
 '3-5-2':[[340,310,'ST'],[740,310,'ST'],[103,581,'LWB',.78],[322,581,'LCM',.78],[540,581,'CM',.78],[758,581,'RCM',.78],[977,581,'RWB',.78],[255,846,'LCB'],[540,846,'CB'],[825,846,'RCB']],
 '3-4-3':[[218,307,'LW'],[540,307,'ST'],[862,307,'RW'],[135,590,'LM'],[392,590,'CM'],[658,590,'CM'],[943,590,'RM'],[255,846,'LCB'],[540,846,'CB'],[825,846,'RCB']],
 '4-1-4-1':[[540,272,'ST',.84],[135,461,'LM',.84],[390,461,'LCM',.84],[655,461,'RCM',.84],[943,461,'RM',.84],[540,651,'CDM',.84],[125,846,'LB',.84],[391,846,'LCB',.84],[655,846,'RCB',.84],[925,846,'RB',.84]]
};
const LFLAG_EMOJI={tr:'🇹🇷',es:'🇪🇸',de:'🇩🇪',fr:'🇫🇷',gb:'🇬🇧',us:'🇺🇸',br:'🇧🇷',ar:'🇦🇷',pt:'🇵🇹',it:'🇮🇹',nl:'🇳🇱',se:'🇸🇪',no:'🇳🇴',ch:'🇨🇭',jp:'🇯🇵',au:'🇦🇺',ca:'🇨🇦',mx:'🇲🇽',ng:'🇳🇬',co:'🇨🇴'};
const lEscape=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const lHex=(x,f='#ffffff')=>/^#[0-9a-f]{6}$/i.test(String(x))?String(x).toLowerCase():f;
const lClone=v=>JSON.parse(JSON.stringify(v));
const lName=s=>String(s||'').replace(/\s+[۰-۹0-9]+\s*$/,'').trim();
const lFindTeam=id=>lTeams.find(x=>x.id===id);
const lFindPlayer=id=>lPlayers.find(x=>x.id===id);
const lNotify=(msg,cls='')=>{const el=L('lineupFeedback');el.textContent=msg;el.className='feedback '+cls;};
const lFont=id=>LFONTS.has(id)?id:'Ario';
let lTeams=[],lPlayers=[],lLeagues=[],lPalettes=[],lNationalFlags=[];
let lState, lSelected=0,lLogoTarget='headerRightId',lFontTarget='all',lRAF=0,lLoaded=false,lDragFrom=null,lCanvas=L('lineupCanvas'),lCtx=lCanvas.getContext('2d');
const lImgCache=new Map(),lImageKeyUrls=new Map();
let lPast=[],lFuture=[],lDataSeq=0,lSaveTimer=0,lDbPromise=null;
let lPendingPlayerId=null,lColorKey=null,lColorStart='',lColorBefore=null,lColorHSV={h:270,s:1,v:1};
function lNewSlots(team){return Array.from({length:11},(_,i)=>{
 const demo=team==='barcelona'?((i<6)?{id:'demo-bonmati',name:'آیتانا بونماتی',image:LDUMMY_A}:{id:'demo-patri',name:'پاتری',image:LDUMMY_B}):null;
 return {playerId:demo?.id||'',name:demo?.name||'',image:demo?.image||'',imageKey:'',flag:demo?'tr':'',flagKey:'',positionOverride:'',photoScale:1};
});}
function lFresh(team='barcelona'){
 return {teamId:team,backgroundLogoId:team==='mixed'?'':team,headerRightId:team==='mixed'?'barcelona':team,
 headerLeftId:'stwn-wyl',paletteId:team==='mixed'?'woso':team,colors:lClone(LDEFAULT_COLORS),
 formation:'4-3-3',league:'لیگ قهرمانان اروپا',week:'هفته ۲۸',matchup:'',matchupManual:false,time:'۲۲:۳۰',
 channel:'WoSoCenter',telegramTop:true,telegramBottom:true,watermarkCustom:false,title:'شماتیک ترکیب',coach:'پره رومئو',stadium:'یوهان کرایف',mixColor:'#f2bc27',
 cardSecond:false,cardText:'#f2bc27',fontAll:'Ario',fonts:{header:'Ario',player:'Ario',title:'Ario',footer:'Ario'},slots:lNewSlots(team)};
}
function lValidate(raw){
 const def=lFresh(),s={...def,...raw};
 s.colors={...LDEFAULT_COLORS,...(raw?.colors||{})};for(const key of Object.keys(LDEFAULT_COLORS))s.colors[key]=lHex(s.colors[key],LDEFAULT_COLORS[key]);
 s.fonts={...def.fonts,...(raw?.fonts||{})};for(const key in s.fonts)s.fonts[key]=lFont(s.fonts[key]);s.fontAll=lFont(s.fontAll);
 s.formation='4-3-3'; // Formation selector is intentionally disabled until new layouts are supplied.s.teamId=String(s.teamId||'barcelona');
 s.slots=Array.from({length:11},(_,i)=>{const inp=raw?.slots?.[i]||def.slots[i];return {...lNewSlots('mixed')[i],...inp,name:String(inp?.name||'').slice(0,65),positionOverride:String(inp?.positionOverride||'').slice(0,12),photoScale:Math.min(1.45,Math.max(.7,Number(inp?.photoScale)||1))};});
 for(const key of ['league','week','matchup','time','channel','title','coach','stadium'])s[key]=String(s[key]??def[key]).slice(0,110);
 // One-time color refinement: migrate only untouched v5.0 Barcelona template shades.
 if(raw?.colors&&s.paletteId==='barcelona'&&s.colors.header==='#920a36'&&s.colors.upper==='#0e3562'&&s.colors.lower==='#970d39'&&s.colors.accent==='#e6aa22'&&s.colors.side==='#edb824'){
  Object.assign(s.colors,{header:'#940930',upper:'#073265',lower:'#940930',accent:'#d2992d',side:'#e1bd2c'});
 }
 // Migrated projects retain their colors and fonts; new section colors default from their existing palette.
 if(raw?.colors){for(const [k,prior] of Object.entries({headerText:'text',logoBg:'upper',topText:'text',topBox:'card1',footerText:'text',footerBox:'card1',logoTint:'accent',cardPosition:'accent'}))if(!raw.colors[k])s.colors[k]=s.colors[prior];}
 s.mixColor=lHex(s.mixColor,'#f2bc27');s.cardText=lHex(s.cardText,'#f2bc27');return s;
}
function lSave(){clearTimeout(lSaveTimer);lSaveTimer=setTimeout(()=>{try{localStorage.setItem(LSTORE,JSON.stringify(lState));L('lineupSave').textContent='ذخیره شد ✓';}catch(e){L('lineupSave').textContent='فضای ذخیره‌سازی محدود';console.warn(e)}},220);}
function lChange(fn,{history=true}={}){if(history){lPast.push(lClone(lState));if(lPast.length>100)lPast.shift();lFuture=[];}fn();lSave();lSync();lRender();lHistoryButtons();}
function lUndo(){if(!lPast.length)return;lFuture.push(lClone(lState));lState=lValidate(lPast.pop());lSave();lSync();lRender();lHistoryButtons()}
function lRedo(){if(!lFuture.length)return;lPast.push(lClone(lState));lState=lValidate(lFuture.pop());lSave();lSync();lRender();lHistoryButtons()}
function lHistoryButtons(){L('lineupUndo').disabled=!lPast.length;L('lineupRedo').disabled=!lFuture.length;}
function lLoadJSON(path,fallback){return fetch(path,{cache:'no-store'}).then(r=>r.ok?r.json():fallback).catch(()=>fallback)}
function lImage(src){
 if(!src)return null;
 let o=lImgCache.get(src);if(o)return o.image;
 const im=new Image();lImgCache.set(src,{image:im,loaded:false});im.onload=()=>{lImgCache.get(src).loaded=true;lRender();};im.onerror=()=>{lImgCache.get(src).error=true;};im.src=src;return im;
}
function lReady(src){const o=lImgCache.get(src);return o?.loaded?o.image:null;}
function lPrepareImages(){
 const urls=['assets/lineup/combined-title.png','assets/lineup/woso-emblem-full.png','assets/brand/logo-alpha.webp'];
 for(const id of [lState.backgroundLogoId,lState.headerRightId,lState.headerLeftId]){const t=lFindTeam(id);if(t)urls.push(t.image)}
 for(const slot of lState.slots){if(slot.image)urls.push(slot.image);if(slot.flagImage)urls.push(slot.flagImage);const f=lNationalFlags.find(x=>x.id===slot.flag);if(f?.image)urls.push(f.image)}
 urls.forEach(lImage);
}
async function lMediaDB(){
 if(!('indexedDB'in window))return null;
 if(!lDbPromise){lDbPromise=new Promise(resolve=>{try{const r=indexedDB.open(LMEDIA_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch{resolve(null)}})}return lDbPromise;
}
async function lPutMedia(blob){const key='m-'+Date.now().toString(36)+'-'+(++lDataSeq);const db=await lMediaDB();if(db){await new Promise((resolve,reject)=>{const tr=db.transaction('files','readwrite');tr.objectStore('files').put(blob,key);tr.oncomplete=resolve;tr.onerror=reject;});}const url=URL.createObjectURL(blob);lImageKeyUrls.set(key,url);lImage(url);return {key,url};}
async function lGetMedia(key){if(!key)return null;const db=await lMediaDB();if(!db)return null;return new Promise(resolve=>{try{const r=db.transaction('files','readonly').objectStore('files').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch{resolve(null)}})}
async function lRestoreMedia(){const keys=new Set(lState.slots.flatMap(x=>[x.imageKey,x.flagKey]).filter(Boolean));for(const key of keys){const blob=await lGetMedia(key);if(blob){const url=URL.createObjectURL(blob);lImageKeyUrls.set(key,url);lState.slots.forEach(x=>{if(x.imageKey===key)x.image=url;if(x.flagKey===key)x.flagImage=url});lImage(url)}}lRender();}
function lPalette(id){const exact=lPalettes.find(x=>x.id===id);if(exact)return exact;
 // Numbered alternate crests use their club's primary palette without duplicating it in the list.
 const team=lFindTeam(id),original=team&&lName(team.name);const primary=original&&lPalettes.find(x=>lName(x.name)===original);
 return primary||lPalettes.find(x=>x.id==='woso')||lPalettes[0]||{...LDEFAULT_COLORS,id:'woso'};}
function lApplyPalette(id){const p=lPalette(id);lState.paletteId=p.id;for(const key of Object.keys(LDEFAULT_COLORS))if(p[key])lState.colors[key]=p[key];
 Object.assign(lState.colors,{headerText:p.text||LDEFAULT_COLORS.headerText,logoBg:p.upper||LDEFAULT_COLORS.logoBg,topText:p.text||LDEFAULT_COLORS.topText,topBox:p.card1||LDEFAULT_COLORS.topBox,footerText:p.text||LDEFAULT_COLORS.footerText,footerBox:p.card1||LDEFAULT_COLORS.footerBox,logoTint:p.accent||LDEFAULT_COLORS.logoTint,cardPosition:p.accent||LDEFAULT_COLORS.cardPosition});
 lState.cardText=p.text||'#f2bc27';lState.watermarkCustom=false;}
function lAutoMatch(){const a=lName(lFindTeam(lState.headerRightId)?.name||''),b=lName(lFindTeam(lState.headerLeftId)?.name||'');return [a,b].filter(Boolean).join(' - ');}
function lTeamChoose(id){
 if(id===lState.teamId){lClose('lineupTeamDialog');return;}
 const editing=lState.slots.some(x=>x.imageKey||x.name&&!['آیتانا بونماتی','پاتری'].includes(x.name));
 if(editing && id!==lState.teamId && !window.confirm('با تغییر تیم، کارت‌های بازیکنان فعلی با کارت‌های پیش‌فرض جایگزین می‌شوند. ادامه می‌دهید؟'))return;
 lChange(()=>{
 lState.teamId=id;lState.backgroundLogoId=id==='mixed'?'':id;
 lState.headerRightId=id==='mixed'?'barcelona':id;
 lState.slots=lNewSlots(id);lSelected=0;
 lApplyPalette(id==='mixed'?'woso':id);lState.matchupManual=false;lState.matchup=lAutoMatch();
 });lClose('lineupTeamDialog');lNotify(id==='mixed'?'ترکیب منتخب فعال شد؛ همه بازیکنان قابل انتخاب‌اند.':'تیم و رنگ‌های پیشنهادی انتخاب شدند.');
}
function lSelectedSlot(){return lState.slots[lSelected]}
function lSpotList(){const array=LFORMATION['4-3-3'];return [...array.map((a,i)=>({i,x:a[0],y:a[1],position:a[2],scale:a[3]||1})),{i:10,x:540,y:1097,position:'GK',scale:1}];}
function lSync(){
 if(!lLoaded)return;
 const team=lFindTeam(lState.teamId),isMix=lState.teamId==='mixed';
 L('lineupTeamLabel').textContent=isMix?'ترکیب منتخب':team?.name||'تیم جدید';
 L('lineupTeamCaption').textContent=isMix?'تمام بازیکنانِ بانک':'بازیکنان ثبت‌شده همین تیم';
 L('lineupTeamIcon').innerHTML=team?`<img src="${lEscape(team.image)}" alt="">`:'⚽';
 for(const [target,id] of [['lineupHeaderRightImg',lState.headerRightId],['lineupHeaderLeftImg',lState.headerLeftId]]){const t=lFindTeam(id);L(target).innerHTML=t?`<img src="${lEscape(t.image)}" alt="${lEscape(t.name)}">`:'⚽';}
 L('lineupHeaderRight').disabled=isMix;L('lineupHeaderLeft').disabled=isMix;
 for(const [id,key] of [['lineupLeague','league'],['lineupWeek','week'],['lineupMatch','matchup'],['lineupTime','time'],['lineupTelegram','channel'],['lineupTelegramFooter','channel'],['lineupTitle','title'],['lineupCoach','coach'],['lineupStadium','stadium']])if(document.activeElement!==L(id))L(id).value=lState[key];
 L('lineupLeaguePickName').textContent=lState.league||'انتخاب از لیگ‌های آماده';
 for(const el of document.querySelectorAll('[data-lcolor]')){const key=el.dataset.lcolor;const val=lGetColor(key);el.innerHTML=`<span class="lineup-color-round" style="background:${val}"></span><span class="lineup-color-code">${val.toUpperCase()}</span><span class="lineup-color-chevron">⌄</span>`;}
 L('lineupAddSecondColor').hidden=!!lState.cardSecond;
 L('lineupSecondColorArea').hidden=!lState.cardSecond;
 for(const el of document.querySelectorAll('[data-lfont]')){const type=el.dataset.lfont;const name=type==='all'?lState.fontAll:lState.fonts[type];const face=LFONT.find(x=>x[0]===name);el.innerHTML=`<span class="font-pick-title" style="font-family:'${lEscape(name)}',Tahoma,sans-serif">${lEscape(face?.[1]||name)} · بارسلونا</span><span class="font-pick-chevron">⌄</span>`;}
 lDrawPaletteList();lPrepareImages();
}
function lSetSelected(i){if(i<0||i>10)return;lSelected=i;lSync();lRender()}
function lDrawPaletteList(){
 const ids=[lState.teamId==='mixed'?'woso':lState.teamId,'woso','barcelona','real-madrid','bayern-munich'];
 const arr=[...ids.map(lPalette),...lPalettes].filter((p,i,list)=>p && list.findIndex(x=>x.id===p.id)===i).slice(0,10);
 const el=L('lineupPaletteTop');el.innerHTML=arr.map(lPaletteHTML).join('');
}
function lPaletteHTML(p){const chosen=lState.paletteId===p.id,t=lFindTeam(p.teamId);
 const mark=t?`<img class="lineup-palette-logo" src="${lEscape(t.image)}" loading="lazy" alt="">`:'<span class="lineup-brandmark">✦</span>';
 return `<button type="button" class="palette-option ${chosen?'selected':''}" data-lpalette="${lEscape(p.id)}"><span class="lineup-palette-label">${mark}<strong>${lEscape(lName(p.name))}</strong></span><span class="palette-dots">${[p.upper,p.lower,p.accent,p.card1].map(c=>`<i style="background:${lHex(c)}"></i>`).join('')}</span>${chosen?'<b>✓</b>':''}</button>`;
}
function lFilterText(v){return String(v||'').normalize('NFKC').toLocaleLowerCase('fa-IR').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim()}
function lHasTeamRoster(t){
 if(!t||/\s+[0-9۰-۹]+\s*$/.test(t.name||''))return false;
 return lPlayers.some(p=>p&&p.teamId===t.id&&typeof p.image==='string'&&p.image.trim()&&typeof p.name==='string'&&p.name.trim());
}
function lTeamDialogRender(){const q=lFilterText(L('lineupTeamSearch').value);const important=['barcelona','real-madrid','bayern-munich'];
 const ordered=[...important.map(lFindTeam).filter(Boolean),...lTeams.filter(t=>!important.includes(t.id))].filter(x=>lFilterText(x.name).includes(q));
 let html=(!q||lFilterText('ترکیب منتخب').includes(q))?'<button type="button" class="lineup-team-option mixed" data-lteam="mixed"><strong>⚽</strong><strong>ترکیب منتخب</strong><small>همه بازیکنان بانک</small></button>':'';
 html+=ordered.map(t=>`<button type="button" data-lteam="${lEscape(t.id)}" class="lineup-team-option ${important.includes(t.id)?'promoted':''}"><img src="${lEscape(t.image)}" loading="lazy" alt=""><span>${lEscape(t.name)}</span>${important.includes(t.id)?'<em>پیشنهادی</em>':''}</button>`).join('');
 L('lineupTeamGrid').innerHTML=html||'<div class="lineup-empty">تیمی با این نام پیدا نشد.</div>';
}
function lLogoDialogRender(){const q=lFilterText(L('lineupLogoSearch').value);L('lineupLogoGrid').innerHTML=lTeams.filter(t=>lFilterText(t.name).includes(q)).map(t=>`<button type="button" class="lineup-logo-option" data-llogo="${lEscape(t.id)}"><img src="${lEscape(t.image)}" loading="lazy" alt=""><span>${lEscape(t.name)}</span></button>`).join('')||'<div class="lineup-empty">نتیجه‌ای پیدا نشد.</div>';}
function lPaletteDialogRender(){const q=lFilterText(L('lineupPaletteSearch').value);L('lineupPaletteGrid').innerHTML=lPalettes.filter(p=>lFilterText(p.name).includes(q)).map(lPaletteHTML).join('')||'<div class="lineup-empty">پالتی پیدا نشد.</div>';}
function lPlayersDialogRender(){const q=lFilterText(L('lineupPlayerSearch').value);const list=lPlayers.filter(p=>(lState.teamId==='mixed'||p.teamId===lState.teamId)&&lFilterText(p.name).includes(q));
 L('lineupPlayerCount').textContent=lState.teamId==='mixed'?'بازیکنان تمام تیم‌ها':('بازیکنان '+(lFindTeam(lState.teamId)?.name||''));
 L('lineupPlayerGrid').innerHTML=list.map(p=>`<button type="button" data-lplayer="${lEscape(p.id)}" class="${p.id===lPendingPlayerId?'pending':''}"><img src="${lEscape(p.image||'')}" loading="lazy" alt=""><strong>${lEscape(p.name)}</strong><small>${lEscape(lFindTeam(p.teamId)?.name||'')}${p.demo?' · نمونه':''}</small>${p.id===lPendingPlayerId?'<span>✓ انتخاب‌شده</span>':''}</button>`).join('')||'<div class="lineup-empty">هنوز بازیکنی برای این تیم در بانک ثبت نشده است. برای افزودن بازیکنان جدید، مدیر سایت بانک داده را تکمیل می‌کند.</div>';
}
function lPlayerDialogShow(index){lSelected=index;const slot=lSelectedSlot();lPendingPlayerId=slot.playerId||null;
 L('lineupPlayerDialogTitle').textContent='کارت '+(index+1)+' · '+(lSpotList()[index]?.position||'GK');
 L('lineupPopupName').value=slot.name||'';L('lineupPopupPosition').value=slot.positionOverride||'';L('lineupPopupScale').value=Math.round((slot.photoScale||1)*100);
 L('lineupPlayerSearch').value='';lPlayersDialogRender();lOpen('lineupPlayerDialog');}
function lPlayerDialogConfirm(){const id=lPendingPlayerId,p=lFindPlayer(id),name=L('lineupPopupName').value.trim(),position=L('lineupPopupPosition').value.trim().toUpperCase(),scale=Number(L('lineupPopupScale').value)/100;
 lChange(()=>{const slot=lSelectedSlot();if(p&&id!==slot.playerId)Object.assign(slot,{playerId:p.id,image:p.image||'',imageKey:'',flag:p.flag||'',flagImage:p.flagImage||'',flagKey:''});slot.name=name||p?.name||'';slot.positionOverride=position;slot.photoScale=scale;});lClose('lineupPlayerDialog');lNotify('تنظیمات کارت ثبت شد.');}
function lPlayerDialogRemove(){lChange(()=>Object.assign(lSelectedSlot(),{playerId:'',name:'',image:'',imageKey:'',flag:'',flagImage:'',flagKey:'',positionOverride:'',photoScale:1}));lClose('lineupPlayerDialog');lNotify('بازیکن از کارت حذف شد.');}
function lLeagueDialogRender(){const q=lFilterText(L('lineupLeagueSearch').value);L('lineupLeagueGrid').innerHTML=lLeagues.filter(x=>lFilterText(x.name).includes(q)).map(x=>`<button type="button" data-lleague="${lEscape(x.name)}">${x.image?`<img src="${lEscape(x.image)}" loading="lazy" alt="">`:'🏆'}<span>${lEscape(x.name)}</span></button>`).join('')||'<div class="lineup-empty">لیگی با این نام یافت نشد؛ می‌توانید نام دلخواه را دستی وارد کنید.</div>';}
function lFontDialogRender(){const q=lFilterText(L('lineupFontSearch').value);L('lineupFontGrid').innerHTML=LFONT.filter(f=>lFilterText(f.join(' ')).includes(q)).map(f=>`<button type="button" class="${(lFontTarget==='all'?lState.fontAll:lState.fonts[lFontTarget])===f[0]?'selected':''}" data-lfontpick="${f[0]}"><strong>${lEscape(f[1])}</strong><span class="font-sample" style="font-family:'${f[0]}',Tahoma,sans-serif">بارسلونا</span><small>${f[0]}</small></button>`).join('');}
function lOpen(id){const el=L(id);if(!el.open)el.showModal();}
function lClose(id){if(L(id)?.open)L(id).close()}
function lSelectLogo(id){lChange(()=>{lState[lLogoTarget]=id;
 if(lLogoTarget==='backgroundLogoId')lApplyPalette(id);
 if(['headerRightId','headerLeftId'].includes(lLogoTarget)&&!lState.matchupManual)lState.matchup=lAutoMatch();
});lClose('lineupLogoDialog');}
function lUsePlayer(id){const p=lFindPlayer(id);if(!p)return;lPendingPlayerId=p.id;L('lineupPopupName').value=p.name;L('lineupPopupPosition').value='';lPlayersDialogRender();}
function lDialogEvents(){
 document.addEventListener('click',e=>{
  const target=e.target.closest('[data-lclose]');if(target){lClose(target.dataset.lclose);return;}
  const team=e.target.closest('[data-lteam]');if(team){lTeamChoose(team.dataset.lteam);return;}
  const logo=e.target.closest('[data-llogo]');if(logo){lSelectLogo(logo.dataset.llogo);return;}
  const pal=e.target.closest('[data-lpalette]');if(pal){lChange(()=>lApplyPalette(pal.dataset.lpalette));lClose('lineupPaletteDialog');return;}
  const pl=e.target.closest('[data-lplayer]');if(pl){lUsePlayer(pl.dataset.lplayer);return;}
  const f=e.target.closest('[data-lfontpick]');if(f){const id=f.dataset.lfontpick;lChange(()=>{if(lFontTarget==='all')lState.fontAll=id;else lState.fonts[lFontTarget]=id});lLoadFont(id);lClose('lineupFontDialog');return;}
  const league=e.target.closest('[data-lleague]');if(league){lChange(()=>lState.league=league.dataset.lleague);lClose('lineupLeagueDialog');return;}
  const slot=e.target.closest('[data-lslot]');if(slot){lPlayerDialogShow(Number(slot.dataset.lslot));return;}
 });
 L('lineupTeamSearch').addEventListener('input',lTeamDialogRender);
 L('lineupLogoSearch').addEventListener('input',lLogoDialogRender);
 L('lineupPaletteSearch').addEventListener('input',lPaletteDialogRender);
 L('lineupPlayerSearch').addEventListener('input',lPlayersDialogRender);
 L('lineupFontSearch').addEventListener('input',lFontDialogRender);
 L('lineupLeagueSearch').addEventListener('input',lLeagueDialogRender);
 for(const el of document.querySelectorAll('dialog.lineup-modal'))el.addEventListener('click',e=>{if(e.target===el)el.close()});
}
function lSetInputs(){
 document.querySelectorAll('[data-ltab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-ltab]').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('[id^="ltab-"]').forEach(n=>n.classList.add('hidden'));L('ltab-'+btn.dataset.ltab).classList.remove('hidden');}));
 L('lineupChangeTeam').onclick=()=>{L('lineupTeamSearch').value='';lTeamDialogRender();lOpen('lineupTeamDialog')};
 for(const [id,target] of [['lineupHeaderRight','headerRightId'],['lineupHeaderLeft','headerLeftId'],['lineupWatermarkPick','backgroundLogoId']])L(id).onclick=()=>{lLogoTarget=target;L('lineupLogoTitle').textContent=target==='backgroundLogoId'?'انتخاب لوگوی محو پس‌زمینه':'انتخاب لوگوی هدر';L('lineupLogoSearch').value='';lLogoDialogRender();lOpen('lineupLogoDialog')};
 L('lineupLeaguePick').onclick=()=>{L('lineupLeagueSearch').value='';lLeagueDialogRender();lOpen('lineupLeagueDialog')};
 L('lineupShowPalettes').onclick=()=>{L('lineupPaletteSearch').value='';lPaletteDialogRender();lOpen('lineupPaletteDialog')};
 for(const btn of document.querySelectorAll('[data-lcolor]'))btn.onclick=()=>lOpenColor(btn.dataset.lcolor,btn.dataset.colorLabel||'رنگ');
 L('lineupAddSecondColor').onclick=()=>lChange(()=>{lState.cardSecond=true});
 L('lineupRemoveSecondColor').onclick=()=>lChange(()=>{lState.cardSecond=false});
 L('lineupOpenSelectedPlayer').onclick=()=>lPlayerDialogShow(lSelected);
 L('lineupPlayerConfirm').onclick=lPlayerDialogConfirm;L('lineupPlayerRemove').onclick=lPlayerDialogRemove;
 for(const id of ['lineupPopupName','lineupPopupPosition'])L(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lPlayerDialogConfirm();}});
 for(const [id,key] of [['lineupLeague','league'],['lineupWeek','week'],['lineupTime','time'],['lineupTelegram','channel'],['lineupTelegramFooter','channel'],['lineupTitle','title'],['lineupCoach','coach'],['lineupStadium','stadium']])L(id).oninput=e=>lChange(()=>lState[key]=e.target.value,{history:false});
 L('lineupMatch').oninput=e=>lChange(()=>{lState.matchup=e.target.value;lState.matchupManual=true},{history:false});
 L('lineupAutoMatch').onclick=()=>lChange(()=>{lState.matchupManual=false;lState.matchup=lAutoMatch()});
 for(const button of document.querySelectorAll('[data-lfont]'))button.onclick=()=>{lFontTarget=button.dataset.lfont;L('lineupFontSearch').value='';lFontDialogRender();lOpen('lineupFontDialog');LFONT.forEach(f=>lLoadFont(f[0]));};
 L('lineupFontAll').onclick=()=>lChange(()=>{for(const k in lState.fonts)lState.fonts[k]=lState.fontAll;});
 L('lineupUndo').onclick=lUndo;L('lineupRedo').onclick=lRedo;
 L('lineupDownload').onclick=()=>lDownload(1);L('lineupDownloadBottom').onclick=()=>lDownload(1);L('lineupDownloadHQ').onclick=()=>lDownload(2);L('lineupDownloadHQBottom').onclick=()=>lDownload(2);
 L('lineupExport').onclick=lExport;L('lineupImport').onclick=()=>L('lineupImportFile').click();L('lineupImportFile').onchange=lImport;
 L('lineupReset').onclick=()=>{if(window.confirm('پروژه فعلی از نو شروع شود؟')){lPast.push(lClone(lState));lState=lFresh();lApplyPalette('barcelona');lState.matchup=lAutoMatch();lSelected=0;lSave();lSync();lRender();L('lineupChangeTeam').click()}};
 L('lineupTheme').onclick=()=>{const root=document.documentElement,light=root.dataset.theme!=='light';root.dataset.theme=light?'light':'dark';try{localStorage.setItem('wosocenter-ui-theme',light?'light':'dark')}catch{}};
 lColorDialogEvents();lSetupPointer();
}
// Replicates the fixture builder's custom HSV picker (no OS-native color selector).
function lGetColor(key){return lHex(key==='mixColor'?lState.mixColor:key==='cardText'?lState.cardText:lState.colors[key],LDEFAULT_COLORS[key]||'#f2bc27');}
function lSetColor(key,color){color=lHex(color);lChange(()=>{if(key==='mixColor')lState.mixColor=color;else if(key==='cardText')lState.cardText=color;else lState.colors[key]=color;if(key==='watermark')lState.watermarkCustom=true;lState.paletteId='';},{history:false});}
function lToHSV(color){const a=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255),max=Math.max(...a),min=Math.min(...a),d=max-min;let h=0;if(d){if(max===a[0])h=((a[1]-a[2])/d)%6;else if(max===a[1])h=(a[2]-a[0])/d+2;else h=(a[0]-a[1])/d+4;h=(h*60+360)%360;}return{h,s:max?d/max:0,v:max};}
function lFromHSV(h,s,v){const f=n=>{const k=(n+h/60)%6;return Math.round((v-v*s*Math.max(Math.min(k,4-k,1),0))*255);};return '#'+[f(5),f(3),f(1)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function lShowColor(hex){lColorHSV=lToHSV(hex);L('lineupColorHue').value=lColorHSV.h;L('lineupColorSV').style.setProperty('--pure-hue',lFromHSV(lColorHSV.h,1,1));L('lineupColorTarget').style.left=(lColorHSV.s*100)+'%';L('lineupColorTarget').style.top=((1-lColorHSV.v)*100)+'%';L('lineupColorPreview').style.background=hex;L('lineupColorHex').value=hex.toUpperCase();}
function lOpenColor(key,title){lColorKey=key;lColorBefore=lClone(lState);lColorStart=lGetColor(key);L('lineupColorTitle').textContent=title;lShowColor(lColorStart);lOpen('lineupColorDialog');}
function lColorLive(hex){if(!lColorKey)return;lSetColor(lColorKey,hex);lShowColor(hex);}
function lColorDialogEvents(){const sv=L('lineupColorSV');const point=e=>{const r=sv.getBoundingClientRect();if(!r.width||!r.height)return;lColorHSV.s=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));lColorHSV.v=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));lColorLive(lFromHSV(lColorHSV.h,lColorHSV.s,lColorHSV.v));};
 sv.addEventListener('pointerdown',e=>{e.preventDefault();sv.setPointerCapture(e.pointerId);point(e)});sv.addEventListener('pointermove',e=>{if(sv.hasPointerCapture(e.pointerId))point(e)});
 L('lineupColorHue').oninput=e=>{lColorHSV.h=Number(e.target.value);lColorLive(lFromHSV(lColorHSV.h,lColorHSV.s,lColorHSV.v))};
 L('lineupColorHex').oninput=e=>{let val=e.target.value.trim();if(!val.startsWith('#'))val='#'+val;if(/^#[0-9a-f]{6}$/i.test(val))lColorLive(val)};
 L('lineupColorHex').onblur=()=>{if(lColorKey)lShowColor(lGetColor(lColorKey))};
 const swatches=['#ffffff','#030303','#181818','#a457bf','#9141aa','#85152d','#ffdb0d','#f8f8f8','#4abafa','#79e7c7','#ff6682','#e5bf65','#713b88','#f2eae9','#5c445d'];
 L('lineupColorSwatches').innerHTML=swatches.map(c=>`<button type="button" class="quick-color" style="background:${c}" data-lquick="${c}" aria-label="رنگ ${c}"></button>`).join('');
 L('lineupColorSwatches').onclick=e=>{const b=e.target.closest('[data-lquick]');if(b)lColorLive(b.dataset.lquick)};
 L('lineupColorDone').onclick=()=>lClose('lineupColorDialog');
 L('lineupColorDialog').addEventListener('close',()=>{if(lColorKey&&lColorStart!==lGetColor(lColorKey)){lPast.push(lColorBefore);if(lPast.length>100)lPast.shift();lFuture=[];lHistoryButtons()}lColorKey=null;lColorBefore=null;});
}
function lFillRounded(ctx,x,y,w,h,r,fill,stroke=null,lineWidth=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke()}}
function lPathFill(ctx,points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function lText(text,x,y,size,opts={}){
 if(!String(text||'').trim())return;
 const {align='center',color='#fff',font='Ario',weight=700,maxWidth=500,minSize=12,dir='rtl'}=opts;
 lCtx.save();lCtx.fillStyle=color;lCtx.textAlign=align;lCtx.textBaseline='middle';lCtx.direction=dir;
 let sz=size;while(sz>minSize){lCtx.font=`${weight} ${sz}px "${lFont(font)}",Tahoma,sans-serif`;if(lCtx.measureText(String(text)).width<=maxWidth)break;sz-=1.5;}
 lCtx.font=`${weight} ${sz}px "${lFont(font)}",Tahoma,sans-serif`;lCtx.fillText(String(text),x,y,maxWidth);lCtx.restore();
}
function lImageBox(src,x,y,w,h,contain=true,opacity=1){const img=lReady(src)||lImage(src);if(!img?.complete||!img.naturalWidth)return;const sc=contain?Math.min(w/img.width,h/img.height):Math.max(w/img.width,h/img.height);const dw=img.width*sc,dh=img.height*sc;lCtx.save();lCtx.globalAlpha=opacity;lCtx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);lCtx.restore()}
function lPlane(x,y,scale,col){const ctx=lCtx;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle=col;ctx.lineWidth=3.4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-18,-5);ctx.lineTo(17,-16);ctx.lineTo(5,20);ctx.lineTo(-3,7);ctx.lineTo(-9,13);ctx.lineTo(-9,1);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(-9,1);ctx.lineTo(17,-16);ctx.stroke();ctx.restore()}
function lJersey(x,y,col){lCtx.save();lCtx.translate(x,y);lCtx.beginPath();lCtx.moveTo(-12,-17);lCtx.lineTo(-25,-10);lCtx.lineTo(-19,0);lCtx.lineTo(-12,-4);lCtx.lineTo(-12,18);lCtx.lineTo(14,18);lCtx.lineTo(14,-4);lCtx.lineTo(22,0);lCtx.lineTo(28,-10);lCtx.lineTo(15,-17);lCtx.lineTo(8,-11);lCtx.lineTo(-4,-11);lCtx.closePath();lCtx.fillStyle=col;lCtx.fill();lCtx.restore()}
function lPerson(x,y,c){const ctx=lCtx;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y-9,9,0,Math.PI*2);ctx.fill();lFillRounded(ctx,x-16,y+3,32,19,[12,12,1,1],c)}
function lStadium(x,y,c){const ctx=lCtx;ctx.save();ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y,18,7,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x-16,y+14);ctx.quadraticCurveTo(x,y+25,x+16,y+14);ctx.lineTo(x+18,y);ctx.stroke();for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(x+i*4,y+5);ctx.lineTo(x+i*3.5,y+17);ctx.stroke()}ctx.restore()}
function lDashes(x,y,w,h,c){const ctx=lCtx;ctx.save();ctx.setLineDash([9,5]);lFillRounded(ctx,x,y,w,h,13,null,c,2);ctx.setLineDash([]);ctx.restore()}
// Detect the opaque bounding box so each crest has the same visual scale even if its source
// image contains different transparent margins. Cache per source image; never alter pixels.
const lCrestBounds=new WeakMap();
function lLogoBounds(img){
 if(lCrestBounds.has(img))return lCrestBounds.get(img);
 let out={sx:0,sy:0,sw:img.naturalWidth||img.width,sh:img.naturalHeight||img.height};
 try{
  const w=Math.min(512,img.naturalWidth||img.width),h=Math.min(512,img.naturalHeight||img.height),off=document.createElement('canvas');off.width=w;off.height=h;
  const oc=off.getContext('2d',{willReadFrequently:true});oc.drawImage(img,0,0,w,h);
  const a=oc.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]>25){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  if(maxX>=minX&&maxY>=minY){
   const iw=out.sw,ih=out.sh;
   out={sx:Math.max(0,minX*iw/w),sy:Math.max(0,minY*ih/h),sw:Math.min(iw,(maxX-minX+1)*iw/w),sh:Math.min(ih,(maxY-minY+1)*ih/h)};
  }
 }catch(e){console.warn('Crest bounds:',e)}
 lCrestBounds.set(img,out);return out;
}
const lTintedWatermarks=new Map();
function lDrawLargeWatermark(){
 const t=lFindTeam(lState.backgroundLogoId);if(!t)return;
 const img=lReady(t.image)||lImage(t.image);if(!img?.complete||!img.naturalWidth)return;
 const b=lLogoBounds(img),zoom=1638/Math.max(b.sw,b.sh),w=b.sw*zoom,h=b.sh*zoom;
 lCtx.save();
 if(lState.watermarkCustom){
  // Cached recolor avoids reprocessing an entire crest whenever a card or field changes.
  const key=t.image+'|'+lState.colors.watermark;let mask=lTintedWatermarks.get(key);
  if(!mask){mask=document.createElement('canvas');mask.width=img.naturalWidth;mask.height=img.naturalHeight;
   const tctx=mask.getContext('2d');tctx.drawImage(img,0,0);tctx.globalCompositeOperation='source-in';tctx.fillStyle=lState.colors.watermark;tctx.fillRect(0,0,mask.width,mask.height);
   lTintedWatermarks.set(key,mask);if(lTintedWatermarks.size>24)lTintedWatermarks.delete(lTintedWatermarks.keys().next().value);
  }
  lCtx.globalAlpha=.11;lCtx.drawImage(mask,b.sx,b.sy,b.sw,b.sh,536-w/2,766-h/2,w,h);
 }else{lCtx.globalAlpha=.042;lCtx.drawImage(img,b.sx,b.sy,b.sw,b.sh,536-w/2,766-h/2,w,h);}
 lCtx.restore();
}
function lDrawBackground(){const c=lCtx,col=lState.colors;
 c.fillStyle=col.lower;c.fillRect(0,0,LW,LH);
 // Upper curved field (blue in the reference) bends down in the center.
 c.beginPath();c.moveTo(8,108);c.lineTo(1072,108);c.lineTo(1072,585);c.bezierCurveTo(823,745,277,751,8,593);c.closePath();c.fillStyle=col.upper;c.fill();
 // The reference has no synthetic grid pattern: its translucent forms belong to the enlarged crest itself.
 // A single full-height watermark reproduces the reference scale and preserves the selected team's actual emblem.
 lDrawLargeWatermark();
 // Header & vertical edge strokes
 c.fillStyle=col.header;c.fillRect(8,0,1064,108);
 c.fillStyle=col.side;c.fillRect(0,0,8,108);c.fillRect(1072,0,8,108);
 c.fillStyle=col.cardBorder;c.fillRect(0,108,8,1242);c.fillRect(1072,108,8,1242);
 // four upper geometric stripes
 lPathFill(c,[[8,108],[211,108],[276,160],[81,160]],col.accent);lPathFill(c,[[375,108],[579,108],[645,160],[444,160]],col.accent);
 lPathFill(c,[[644,108],[810,108],[876,160],[710,160]],col.accent);lPathFill(c,[[958,108],[1072,108],[1072,160],[1023,160]],col.accent);
 // decorative bottom stripes
 lPathFill(c,[[7,1298],[135,1298],[200,1350],[7,1350]],col.upper);lPathFill(c,[[349,1298],[547,1298],[615,1350],[411,1350]],col.upper);
 lPathFill(c,[[620,1298],[824,1298],[889,1350],[687,1350]],col.upper);lPathFill(c,[[972,1298],[1072,1298],[1072,1350],[1039,1350]],col.upper);
}
function lHeader(){const c=lCtx,s=lState,col=s.colors;
 // Right anchored group with optional separator, preventing empty label drift.
 const rightValue=s.league.trim(),week=s.week.trim();
 c.save();c.textBaseline='middle';c.direction='rtl';c.fillStyle=col.text;
 const rightMax=350,sz=26;
 const rightStr=[rightValue,week].filter(Boolean);
 if(rightStr.length)lText(rightStr.join('  |  '),1047,54,sz,{align:'right',color:col.headerText,font:s.fonts.header,maxWidth:rightMax,minSize:16});
 // Left anchored group, only adds divider when both are filled.
 const leftVal=s.matchup.trim(),time=s.time.trim();if(leftVal||time)lText([leftVal,time].filter(Boolean).join('  |  '),32,54,25,{align:'left',color:col.headerText,font:s.fonts.header,maxWidth:355,minSize:16});
 c.restore();
 if(s.teamId==='mixed'){
  const img=lReady('assets/lineup/combined-title.png')||lImage('assets/lineup/combined-title.png');
  if(img?.complete&&img.naturalWidth){const off=document.createElement('canvas');off.width=260;off.height=77;const oc=off.getContext('2d');const sc=Math.min(250/img.width,60/img.height);const w=img.width*sc,h=img.height*sc;oc.drawImage(img,130-w/2,38.5-h/2,w,h);oc.globalCompositeOperation='source-in';oc.fillStyle=s.mixColor;oc.fillRect(0,0,260,77);c.drawImage(off,410,15)}
  else lText('ترکیب منتخب',540,56,33,{color:s.mixColor,maxWidth:246,font:s.fonts.header});
 }else{
  for(const [id,x] of [[s.headerRightId,544],[s.headerLeftId,459]]){lFillRounded(c,x,16,77,76,15,col.logoBg);const t=lFindTeam(id);if(t)lImageBox(t.image,x+7,21,63,66)}
 }
}
function lLegible(fg,bg,fallback){const rgb=x=>[1,3,5].map(k=>parseInt(x.slice(k,k+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));const lum=x=>{const v=rgb(lHex(x));return .2126*v[0]+.7152*v[1]+.0722*v[2]};const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=2.8?fg:fallback;}
function lTopBar(){const c=lCtx,s=lState,col=s.colors;
 // Formation is right-side box with purely decorative arrows.
 lDashes(832,183,220,55,col.accent);
 lFillRounded(c,842,191,39,40,7,col.accent);lFillRounded(c,1003,191,39,40,7,col.accent);
 lText('❮',861,212,25,{color:col.upper,dir:'ltr'});lText('❯',1022,212,25,{color:col.upper,dir:'ltr'});
 lText(s.formation.replace(/-/g,'-'),943,212,28,{color:col.topText,dir:'ltr',font:s.fonts.title,maxWidth:115});
 if(s.channel.trim()){lPlane(479,210,.83,col.topText);lText(s.channel,579,211,24,{color:col.topText,maxWidth:161,font:s.fonts.title,dir:'ltr'});}
 if(s.title.trim()){
  lFillRounded(c,33,183,221,51,16,col.topBox);lJersey(222,207,col.topText);
  lText(s.title,125,212,23,{color:lLegible(col.topText,col.topBox,col.topText),font:s.fonts.title,maxWidth:169,minSize:15});
 }
}
function lCard(spot,selected,highlight){const c=lCtx,s=lState,col=s.colors,slot=s.slots[spot.i];const w=180*spot.scale,h=189*spot.scale;const x=spot.x-w/2,y=spot.y;spot.box={x,y,w,h};
 c.save();c.beginPath();c.roundRect(x,y,w,h,13*spot.scale);c.clip();
 c.fillStyle=col.card1;c.fillRect(x,y,w,h);
 if(s.cardSecond){c.fillStyle=col.card2;c.fillRect(x+w*.5,y,w*.5,h)}
 // Portrait extends above the card's top border. Draw after restoring card clipping.
 c.restore();
 // Draw the frame underneath the transparent player cutout: no line across the forehead.
 c.save();c.beginPath();c.roundRect(x,y,w,h,13*spot.scale);c.strokeStyle=col.cardBorder;c.lineWidth=3.8*spot.scale;c.stroke();c.restore();
 const src=slot.image;if(src){const img=lReady(src)||lImage(src);if(img?.complete&&img.naturalWidth){
  const factor=(slot.photoScale||1),targetH=(h+19*spot.scale)*factor;
  const maxW=w*1.03*factor;let dw=Math.min(maxW,targetH*(img.width/img.height)),dh=dw*img.height/img.width;
  // Portraits are bottom-aligned to the name strip and can extend outside the top of the card.
  const bottom=y+h-29*spot.scale,dx=x+(w-dw)/2,dy=bottom-dh;
  c.save();c.beginPath();c.rect(x-3*spot.scale,y-75*spot.scale,w+6*spot.scale,h+75*spot.scale);c.clip();c.drawImage(img,dx,dy,dw,dh);c.restore();
 }}else{
  // Unfilled cards have a subdued generic placeholder; no third-party player artwork.
  c.save();c.globalAlpha=.22;c.fillStyle=col.text;c.beginPath();c.arc(spot.x,y+70*spot.scale,31*spot.scale,0,Math.PI*2);c.fill();lFillRounded(c,spot.x-55*spot.scale,y+100*spot.scale,110*spot.scale,61*spot.scale,[38*spot.scale,38*spot.scale,0,0],col.text);c.restore();
 }
 // Position and flag anchored at left edge, visible on top of photos.
 const position=slot.positionOverride?.trim()||spot.position;
 lText(position,x+10*spot.scale,y+17*spot.scale,17*spot.scale,{align:'left',dir:'ltr',font:s.fonts.player,color:lLegible(col.cardPosition,col.card1,col.cardPosition),maxWidth:44*spot.scale,minSize:10*spot.scale});
 if(slot.flagImage){lImageBox(slot.flagImage,x+8*spot.scale,y+31*spot.scale,26*spot.scale,22*spot.scale)}
 else if(slot.flag){const f=lNationalFlags.find(x=>x.id===slot.flag);if(f?.image)lImageBox(f.image,x+7*spot.scale,y+32*spot.scale,27*spot.scale,22*spot.scale);else lText(LFLAG_EMOJI[slot.flag]||slot.flag,x+8*spot.scale,y+44*spot.scale,20*spot.scale,{align:'left',dir:'ltr',color:'#ffffff',font:'Ario',maxWidth:37*spot.scale,minSize:10*spot.scale})}
 lFillRounded(c,x+2*spot.scale,y+h-30*spot.scale,w-4*spot.scale,28*spot.scale,1,col.cardName);
 if(slot.name.trim())lText(slot.name,spot.x,y+h-16.5*spot.scale,18*spot.scale,{color:s.cardText,dir:'rtl',font:s.fonts.player,maxWidth:w-10*spot.scale,minSize:10*spot.scale});
 if(highlight&&selected===spot.i){c.save();c.setLineDash([7,5]);c.strokeStyle='#fff';c.lineWidth=2;c.strokeRect(x-6,y-56*spot.scale,w+12,h+63*spot.scale);c.restore()}
}
function lFooter(){const c=lCtx,s=lState,col=s.colors;
 // Left corner telegram label and stadium. All boxes hide when empty.
 if(s.channel.trim()){lPlane(70,1185,.8,col.footerText);lText(s.channel,167,1186,24,{color:col.footerText,dir:'ltr',font:s.fonts.footer,maxWidth:165});}
 if(s.stadium.trim()){
  lDashes(35,1215,219,56,col.footerText);
  lStadium(210,1237,col.footerText);
  lText(s.stadium,121,1244,21,{color:col.footerText,font:s.fonts.footer,maxWidth:158,minSize:13});
 }
 // Woso icon on right; use exact cropped brand emblem from the supplied layout.
 const logo='assets/lineup/woso-emblem-full.png';const emblem=lReady(logo);if(emblem){const mask=document.createElement('canvas');mask.width=emblem.naturalWidth;mask.height=emblem.naturalHeight;const m=mask.getContext('2d');m.drawImage(emblem,0,0);m.globalCompositeOperation='source-in';m.fillStyle=col.logoTint;m.fillRect(0,0,mask.width,mask.height);lCtx.drawImage(mask,857,1102,160,115);}else lText('WoSoCenter',942,1181,25,{color:col.logoTint,dir:'ltr'});
 if(s.coach.trim()){
  lFillRounded(c,828,1215,220,54,14,col.footerBox);lPerson(1015,1239,col.footerText);
  lText(s.coach,915,1242,22,{color:lLegible(col.footerText,col.footerBox,col.footerText),font:s.fonts.footer,maxWidth:139,minSize:12});
 }
}
function lDraw(highlight=true){if(!lState)return;lCtx.clearRect(0,0,LW,LH);lDrawBackground();lHeader();lTopBar();const spots=lSpotList();for(const spot of spots)lCard(spot,lSelected,highlight);lFooter();}
function lRender(){if(lRAF)return;lRAF=requestAnimationFrame(()=>{lRAF=0;lPrepareImages();lDraw(true)});}
function lSetupPointer(){
 let start=null,origin=null;const locate=e=>{const r=lCanvas.getBoundingClientRect();return{x:(e.clientX-r.left)*LW/r.width,y:(e.clientY-r.top)*LH/r.height}};
 const hit=e=>{const p=locate(e);return lSpotList().find(s=>{const w=180*s.scale,h=189*s.scale;return p.x>=s.x-w/2-8&&p.x<=s.x+w/2+8&&p.y>=s.y-57*s.scale&&p.y<=s.y+h+5})?.i??null};
 lCanvas.addEventListener('pointerdown',e=>{start=hit(e);origin=locate(e);if(start!==null){lCanvas.setPointerCapture?.(e.pointerId);lSetSelected(start)}});
 lCanvas.addEventListener('pointerup',e=>{const end=hit(e),at=locate(e),distance=origin?Math.hypot(at.x-origin.x,at.y-origin.y):0;
  if(start!==null&&end!==null&&start!==end&&distance>12){const from=start;lChange(()=>{const a=lState.slots[from],b=lState.slots[end];lState.slots[from]=b;lState.slots[end]=a});lSetSelected(end);lNotify('بازیکنان جابه‌جا شدند؛ جایگاه‌ها ثابت ماندند.');}
  else if(start!==null&&distance<16)lPlayerDialogShow(start);
  start=null;origin=null;});
 lCanvas.addEventListener('pointercancel',()=>{start=null;origin=null});
 lCanvas.setAttribute('tabindex','0');lCanvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();lPlayerDialogShow(lSelected)}});
}
async function lLoadFont(id){if(!document.fonts)return;try{await Promise.race([document.fonts.load(`700 24px "${lFont(id)}"`),new Promise(resolve=>setTimeout(resolve,3500))]);lRender()}catch{}}
async function lWaitResources(){const fonts=Object.values(lState.fonts).map(lLoadFont);const paths=[lFindTeam(lState.headerRightId)?.image,lFindTeam(lState.headerLeftId)?.image,lFindTeam(lState.backgroundLogoId)?.image,...lState.slots.flatMap(x=>[x.image,x.flagImage,lNationalFlags.find(f=>f.id===x.flag)?.image]),'assets/lineup/woso-emblem-full.png','assets/lineup/combined-title.png'].filter(Boolean);await Promise.race([Promise.all([Promise.all(fonts),...paths.map(path=>new Promise(resolve=>{const img=lImage(path);if(img.complete){resolve();return}img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})}))]),new Promise(resolve=>setTimeout(resolve,5000))]);}
async function lDownload(scale=1){const ids=['lineupDownload','lineupDownloadBottom','lineupDownloadHQ','lineupDownloadHQBottom'],buttons=ids.map(L);buttons.forEach(b=>b.disabled=true);
 try{await lWaitResources();const out=document.createElement('canvas');out.width=LW*scale;out.height=LH*scale;const old=lCtx;lCtx=out.getContext('2d',{alpha:false});lCtx.imageSmoothingEnabled=true;lCtx.imageSmoothingQuality='high';lCtx.scale(scale,scale);
 try{lDraw(false)}finally{lCtx=old}
 const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export unavailable');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WoSoCenter-Lineup-'+lState.formation+'-'+(scale>1?'HQ-':'')+Date.now()+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 lNotify('خروجی PNG با ابعاد '+out.width+'×'+out.height+' پیکسل ساخته شد.');
 }catch(e){lNotify('دریافت PNG انجام نشد: '+e.message,'error')}finally{buttons.forEach(b=>b.disabled=false);lRender();}}
function lBlobToData(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}
async function lExport(){try{const snapshot=lClone(lState),media={};for(const slot of snapshot.slots)for(const k of ['imageKey','flagKey'])if(slot[k]&&!media[slot[k]]){const blob=(await lGetMedia(slot[k]))||await fetch(slot[k]==='imageKey'?slot.image:slot.flagImage).then(r=>r.blob()).catch(()=>null);if(blob)media[slot[k]]=await lBlobToData(blob)}
 // Remove ephemeral blob: URLs from exported state; importer rehydrates from media dictionary.
 snapshot.slots.forEach(slot=>{if(slot.imageKey)slot.image='';if(slot.flagKey)slot.flagImage=''});
 const json=JSON.stringify({format:'wosocenter-lineup-v1',version:5,state:snapshot,media},null,2),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='wosocenter-lineup-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);lNotify('پروژه با عکس‌های آپلودشده صادر شد.')}catch(e){lNotify('خطا در تهیه نسخه پشتیبان: '+e.message,'error')}}
async function lImport(e){const file=e.target.files?.[0];if(!file)return;try{if(file.size>80*1024*1024)throw Error('فایل بسیار بزرگ است.');const obj=JSON.parse(await file.text());if(obj.format!=='wosocenter-lineup-v1'||!obj.state)throw Error('قالب فایل پروژه معتبر نیست.');const next=lValidate(obj.state),remap=new Map();for(const [old,data] of Object.entries(obj.media||{})){if(!/^data:image\/(png|jpeg|webp);base64,/.test(data))continue;const blob=await(await fetch(data)).blob(),stored=await lPutMedia(blob);remap.set(old,stored)}for(const slot of next.slots){if(slot.imageKey){const media=remap.get(slot.imageKey);if(media){slot.imageKey=media.key;slot.image=media.url}else{slot.imageKey='';slot.image=''}}if(slot.flagKey){const media=remap.get(slot.flagKey);if(media){slot.flagKey=media.key;slot.flagImage=media.url}else{slot.flagKey='';slot.flagImage=''}}}lPast.push(lClone(lState));lState=next;lSelected=0;lSave();lSync();lRender();lNotify('پروژه با موفقیت وارد شد.')}catch(err){lNotify('فایل پروژه قابل بازیابی نیست: '+err.message,'error')}e.target.value='';}
async function lInit(){
 const themesafe=(()=>{try{return localStorage.getItem('wosocenter-ui-theme')==='light'}catch{return false}})();document.documentElement.dataset.theme=themesafe?'light':'dark';
 [lTeams,lPlayers,lLeagues,lPalettes,lNationalFlags]=await Promise.all([
 lLoadJSON('data/teams.json',[]),lLoadJSON('data/players.json',[]),lLoadJSON('data/flags.json',[]),lLoadJSON('data/lineup-palettes.json',[]),lLoadJSON('data/national-flags.json',[])]);
 let persisted=null;try{persisted=JSON.parse(localStorage.getItem(LSTORE)||'null')}catch{}
 lState=lValidate(persisted||lFresh());if(!persisted){lApplyPalette('barcelona');lState.matchup=lAutoMatch();}
 lLoaded=true;
 lDialogEvents();lSetInputs();lSync();lRender();lHistoryButtons();lLoadFont('Ario');await lRestoreMedia();
 if(!persisted){lTeamDialogRender();lOpen('lineupTeamDialog');}
}
lInit().catch(e=>{console.error('Lineup init',e);lNotify('خطا در شروع شماتیک‌ساز. صفحه را دوباره بارگذاری کنید.','error')});
