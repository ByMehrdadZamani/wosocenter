'use strict';
// No backend, API key, or build step is needed. All drawing happens in the browser.
const $ = id => document.getElementById(id);
const WIDTH = 1080, HEIGHT = 1350, MAX_GAMES = 6;
const FONTS = [
  ['Vazirmatn','وزیرمتن'], ['Lalezar','لاله‌زار'],
  ['Noto Sans Arabic','Noto Sans Arabic'], ['Cairo','Cairo'],
  ['Amiri','امیری'], ['Tahoma','Tahoma']
];
const FONT_NAMES = Object.fromEntries(FONTS);
const ASSETS = {
  pattern: 'assets/brand/pattern-alpha.png',
  titlePurple: 'assets/brand/title-purple-alpha.png',
  titleWhite: 'assets/brand/title-white-alpha.png',
  logo: 'assets/brand/logo-alpha.png'
};
const DEFAULT_MATCH = {
  flag: 'belgium', league: 'لیگ برتر بلژیک', time: '۲۲:۳۰',
  leftTeam: 'servette', rightTeam: 'nordsjaelland',
  leftBg: '#85152d', rightBg: '#ffdb0d',
  leagueColor: '#f8f8f8', timeColor: '#f8f8f8', clockColor: '#a94ac2',
  leagueFont: 'Vazirmatn', timeFont: 'Vazirmatn'
};
const DEFAULTS = {
  weekDay:'شنبه', monthDay:'۱۶ آبان', dayColor:'#aa55bc', dateColor:'#ffffff',
  dayFont:'Vazirmatn', dateFont:'Vazirmatn', dateLineColor:'#a64db6',
  titlePurple:'#a457bf', titleWhite:'#d9d9d9', footerText:'WoSoCenter',
  footerColor:'#ae58c7', telegramColor:'#af58c8', footerFont:'Vazirmatn',
  background:'#030303', patternColor:'#320a3e', frameColor:'#09050c',
  cardColor:'#181818', globalFont:'Vazirmatn', matches:[{...DEFAULT_MATCH}]
};
function safeHex(v, fallback){ return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback; }
function validFont(v){ return FONTS.some(([f])=>f===v) ? v : 'Vazirmatn'; }
function sanitizeMatch(item){
  const m = {...DEFAULT_MATCH, ...(item && typeof item === 'object' ? item : {})};
  ['leftBg','rightBg','leagueColor','timeColor','clockColor'].forEach(k=>m[k]=safeHex(m[k],DEFAULT_MATCH[k]));
  ['leagueFont','timeFont'].forEach(k=>m[k]=validFont(m[k]));
  ['flag','leftTeam','rightTeam','league','time'].forEach(k=>m[k]=String(m[k]??DEFAULT_MATCH[k]).slice(0,120));
  return m;
}
function sanitizeState(item){
  const s={...DEFAULTS,...(item && typeof item === 'object' ? item : {})};
  for (const k of ['dayColor','dateColor','dateLineColor','titlePurple','titleWhite','footerColor','telegramColor','background','patternColor','frameColor','cardColor']) s[k]=safeHex(s[k],DEFAULTS[k]);
  for (const k of ['dayFont','dateFont','footerFont','globalFont']) s[k]=validFont(s[k]);
  for (const k of ['weekDay','monthDay','footerText']) s[k]=String(s[k]??DEFAULTS[k]).slice(0,80);
  s.matches=Array.isArray(s.matches) ? s.matches.slice(0,MAX_GAMES).map(sanitizeMatch):[{...DEFAULT_MATCH}];
  if(!s.matches.length)s.matches=[{...DEFAULT_MATCH}];
  return s;
}
let state;
try { state=sanitizeState(JSON.parse(localStorage.getItem('football-conductor-v1')||'null')); }
catch { state=sanitizeState(null); }
let teams=[], flags=[];
const images=new Map(), tinted=new Map();
let pendingRender=false, feedbackTimer=null, saveTimer=null;

function image(path){ return images.get(path) || null; }
function preload(path){
  if(!path || images.has(path)) return Promise.resolve();
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{images.set(path,img);tinted.clear();scheduleRender();resolve();};
    img.onerror=()=>{images.set(path,null);resolve();};
    img.src=path;
  });
}
async function loadList(path, fallback){
  try {const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw Error(res.status);const data=await res.json();return Array.isArray(data)?data.filter(x=>x?.id && x?.name && x?.image):fallback;}
  catch{return fallback;}
}
const fallbackTeams = [
  {id:'servette',name:'سروت ژنو',image:'assets/teams/servette.png'},
  {id:'nordsjaelland',name:'نورشلاند',image:'assets/teams/nordsjaelland.png'}
];
const fallbackFlags = [{id:'belgium',name:'بلژیک',image:'assets/flags/belgium.svg'}];
const findTeam=id=>teams.find(t=>t.id===id);
const findFlag=id=>flags.find(t=>t.id===id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fontOptions = selected => FONTS.map(([val,name])=>`<option value="${esc(val)}" ${selected===val?'selected':''}>${esc(name)}</option>`).join('');
const teamOptions = selected => teams.map(t=>`<option value="${esc(t.id)}" ${selected===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
const flagOptions = selected => flags.map(f=>`<option value="${esc(f.id)}" ${selected===f.id?'selected':''}>${esc(f.name)}</option>`).join('');
const field = (caption, name, value, options={}) => {
  const {type='text', wide=false,maxlength=90,choices=null}=options;
  const control = type==='select' ? `<select data-field="${name}">${choices}</select>` :
    `<input data-field="${name}" type="${type}" value="${esc(value)}" ${type==='text'?`maxlength="${maxlength}"`:''} />`;
  return `<label class="${wide?'span2':''}">${esc(caption)}${control}</label>`;
};
function gameMarkup(m,i){
  const title=`${findTeam(m.leftTeam)?.name||'تیم اول'} — ${findTeam(m.rightTeam)?.name||'تیم دوم'}`;
  return `<article class="game-editor" data-index="${i}">
    <div class="game-head"><div><h3>مسابقه ${i+1}</h3><div class="game-info">${esc(title)}</div></div>
    <button class="remove-game" title="حذف مسابقه ${i+1}" aria-label="حذف مسابقه ${i+1}" data-remove="${i}" type="button">×</button></div>
    <div class="field-grid">
      ${field('پرچم کشور','flag',m.flag,{type:'select',choices:flagOptions(m.flag)})}
      ${field('نام لیگ','league',m.league,{maxlength:48})}
      ${field('لوگوی سمت چپ','leftTeam',m.leftTeam,{type:'select',choices:teamOptions(m.leftTeam)})}
      ${field('لوگوی کنار آن','rightTeam',m.rightTeam,{type:'select',choices:teamOptions(m.rightTeam)})}
      ${field('ساعت بازی','time',m.time,{maxlength:35})}
      <div></div>
      ${field('زمینه لوگوی چپ','leftBg',m.leftBg,{type:'color'})}
      ${field('زمینه لوگوی دوم','rightBg',m.rightBg,{type:'color'})}
    </div>
    <details class="details"><summary>تنظیمات مستقل رنگ و فونت این بازی</summary>
      <div class="field-grid">
        ${field('رنگ نام لیگ','leagueColor',m.leagueColor,{type:'color'})}
        ${field('رنگ ساعت','timeColor',m.timeColor,{type:'color'})}
        ${field('رنگ آیکون ساعت','clockColor',m.clockColor,{type:'color'})}
        <div></div>
        ${field('فونت نام لیگ','leagueFont',m.leagueFont,{type:'select',choices:fontOptions(m.leagueFont)})}
        ${field('فونت ساعت','timeFont',m.timeFont,{type:'select',choices:fontOptions(m.timeFont)})}
      </div>
    </details>
  </article>`;
}
function updateGamesUI(){
  $('gamesList').innerHTML=state.matches.map(gameMarkup).join('');
  $('gameCount').textContent=`${state.matches.length} از ${MAX_GAMES} مسابقه`;
  $('addGameBtn').disabled=state.matches.length>=MAX_GAMES;
  $('addGameBtn').textContent=state.matches.length>=MAX_GAMES?'ظرفیت کامل است':'＋ افزودن بازی';
}
function syncOtherFields(){
  for(const k of ['weekDay','monthDay','dayColor','dateColor','dayFont','dateFont','dateLineColor','titlePurple','titleWhite','footerText','footerColor','telegramColor','footerFont','background','patternColor','frameColor','cardColor','globalFont'])
    if($(k)) $(k).value=state[k];
}
function showFeedback(msg,kind='success'){
  const el=$('feedback');el.textContent=msg;el.className='feedback '+(kind==='success'?'':kind);
  clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{if(el.textContent===msg)el.textContent='';},6500);
}
function persist(){
  clearTimeout(saveTimer);saveTimer=setTimeout(()=>{
    try{localStorage.setItem('football-conductor-v1',JSON.stringify(state));$('saveIndicator').textContent='✓ ذخیره شد';}
    catch { $('saveIndicator').textContent='حافظه مرورگر در دسترس نیست'; }
  },250);
}
function changed(){persist();scheduleRender();}
function scheduleRender(){
  if(pendingRender)return;
  pendingRender=true;requestAnimationFrame(()=>{pendingRender=false;render();});
}
function switchTab(name){
  document.querySelectorAll('.tab').forEach(tab=>{
    const yes=tab.dataset.tab===name;tab.classList.toggle('active',yes);tab.setAttribute('aria-selected',String(yes));
  });
  ['games','header','design'].forEach(n=>$(n+'Tab').classList.toggle('hidden',n!==name));
}

// --- Drawing primitives: no external canvas or screenshot libraries ---
function roundPath(c,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
  c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
}
function tintedImage(path,color){
  const src=image(path);if(!src)return null;
  const key=path+'|'+color;
  if(tinted.has(key))return tinted.get(key);
  const temp=document.createElement('canvas');temp.width=src.naturalWidth;temp.height=src.naturalHeight;
  const t=temp.getContext('2d',{willReadFrequently:false});t.drawImage(src,0,0);
  t.globalCompositeOperation='source-in';t.fillStyle=color;t.fillRect(0,0,temp.width,temp.height);
  t.globalCompositeOperation='source-over';tinted.set(key,temp);return temp;
}
function drawTint(c,path,x,y,w,h,color){
  const img=tintedImage(path,color);if(img)c.drawImage(img,x,y,w,h);
}
function drawRtl(c,text,x,y,maxWidth,font,color,size=28,weight=800){
  c.save();c.direction='rtl';c.textAlign='right';c.textBaseline='alphabetic';
  c.font=`${weight} ${size}px "${validFont(font)}", Tahoma, sans-serif`;
  c.fillStyle=color;
  c.fillText(String(text??''),x,y,maxWidth);c.restore();
}
function drawClock(c,cx,cy,color){
  c.save();c.strokeStyle=color;c.lineWidth=2.7;c.lineCap='round';
  c.beginPath();c.arc(cx,cy,14,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(cx,cy-9);c.lineTo(cx,cy+0.5);c.lineTo(cx+6,cy+5.5);c.stroke();c.restore();
}
function drawTelegram(c,x,y,s,color){
  c.save();c.translate(x,y);c.scale(s/40,s/40);c.strokeStyle=color;c.lineJoin='round';c.lineCap='round';c.lineWidth=3.3;
  c.beginPath();c.moveTo(3,17);c.lineTo(37,4);c.lineTo(29,36);c.lineTo(21,27);c.lineTo(15,35);c.lineTo(15,23);c.closePath();c.stroke();
  c.beginPath();c.moveTo(15,23);c.lineTo(34,7);c.stroke();c.restore();
}
function contain(c,img,x,y,w,h){
  if(!img)return;
  const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);
  const dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;
  c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function drawDate(c){
  c.save();c.strokeStyle=state.dateLineColor;c.lineWidth=6;c.setLineDash([4,10]);
  c.beginPath();c.moveTo(985,87);c.lineTo(985,168);c.stroke();c.restore();
  drawRtl(c,state.weekDay,966,114,194,state.dayFont,state.dayColor,28,800);
  drawRtl(c,state.monthDay,966,163,194,state.dateFont,state.dateColor,29,800);
}
function drawBrand(c){
  drawTint(c,ASSETS.logo,87,87,105,91,'#9141aa');
  drawTint(c,ASSETS.titlePurple,311,87,459,79,state.titlePurple);
  drawTint(c,ASSETS.titleWhite,311,87,459,79,state.titleWhite);
}
function drawGame(c,m,index){
  const x=87,y=215+index*171,w=899,h=157;
  // Entire card is one rounded shape. Colored team slots are clipped to its border.
  c.save();roundPath(c,x,y,w,h,24);c.clip();
  c.fillStyle=state.cardColor;c.fillRect(x,y,w,h);
  c.fillStyle=m.leftBg;c.fillRect(x,y,211,h);
  c.fillStyle=m.rightBg;c.fillRect(x+211,y,211,h);
  const t1=findTeam(m.leftTeam),t2=findTeam(m.rightTeam);
  contain(c,image(t1?.image),x+10,y+5,191,146);
  contain(c,image(t2?.image),x+221,y+5,191,146);
  c.restore();
  const flag=findFlag(m.flag);if(flag){const flagImg=image(flag.image);if(flagImg)c.drawImage(flagImg,x+852,y+34,27,20);}
  drawRtl(c,m.league,x+835,y+57,365,m.leagueFont,m.leagueColor,28,800);
  drawClock(c,x+866,y+106,m.clockColor);
  drawRtl(c,'ساعت '+m.time,x+835,y+113,365,m.timeFont,m.timeColor,27,800);
}
function drawFooter(c){
  const label=String(state.footerText||'');
  const isMostlyLatin=/^[\x00-\x7f\s]+$/.test(label);
  const font=validFont(state.footerFont);
  c.font=`800 29px "${font}",Tahoma,sans-serif`;
  const textWidth=Math.min(c.measureText(label).width,540);
  const total=textWidth+40+12;
  const left=(WIDTH-total)/2;
  drawTelegram(c,left,1254,38,state.telegramColor);
  c.save();c.fillStyle=state.footerColor;c.font=`800 29px "${font}",Tahoma,sans-serif`;
  c.direction=isMostlyLatin?'ltr':'rtl';c.textAlign=isMostlyLatin?'left':'right';
  c.textBaseline='alphabetic';
  if(isMostlyLatin)c.fillText(label,left+49,1282,540);
  else c.fillText(label,left+49+textWidth,1282,540);
  c.restore();
}
function render(){
  const canvas=$('poster');if(!canvas)return;
  const c=canvas.getContext('2d');c.clearRect(0,0,WIDTH,HEIGHT);
  c.fillStyle=state.background;c.fillRect(0,0,WIDTH,HEIGHT);
  const pattern=tintedImage(ASSETS.pattern,state.patternColor);
  if(pattern)for(let y=0;y<HEIGHT;y+=215)c.drawImage(pattern,0,y,1080,215);
  // Central frame is subtle, preserving the visible patterned background.
  c.save();c.globalAlpha=.14;roundPath(c,38,34,1004,1283,32);c.fillStyle=state.frameColor;c.fill();c.restore();
  c.save();c.globalAlpha=.14;roundPath(c,38,34,1004,1283,32);c.strokeStyle='#7a357e';c.lineWidth=1.5;c.stroke();c.restore();
  drawBrand(c);drawDate(c);
  state.matches.forEach((m,i)=>drawGame(c,m,i));
  drawFooter(c);
}
async function ensureFonts(){
  if(!document.fonts)return;
  const requested=new Set([state.dayFont,state.dateFont,state.footerFont,...state.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);
  await Promise.allSettled([...requested].map(f=>document.fonts.load(`800 28px "${validFont(f)}"`)));
  await document.fonts.ready;
}
async function downloadPNG(){
  const btn=$('downloadBtn');btn.disabled=true;btn.textContent='در حال آماده‌سازی…';
  try{
    await Promise.race([ensureFonts(),new Promise(resolve=>setTimeout(resolve,4500))]);render();
    const blob=await new Promise(resolve=>$('poster').toBlob(resolve,'image/png'));
    if(!blob)throw Error('PNG could not be created');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`football-schedule-${state.matches.length}-games.png`;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    showFeedback('تصویر PNG با ابعاد دقیق ۱۰۸۰×۱۳۵۰ ساخته شد.');
  }catch(e){showFeedback('دانلود ممکن نشد. سایت را روی GitHub Pages یا یک وب‌سرور محلی باز کن.','error');console.error(e);}
  finally{btn.disabled=false;btn.textContent='↓ دریافت PNG';}
}
function downloadJSON(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wosocenter-project.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  showFeedback('فایل تنظیمات پروژه دانلود شد.');
}
function events(){
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>switchTab(tab.dataset.tab)));
  $('addGameBtn').addEventListener('click',()=>{
    if(state.matches.length>=MAX_GAMES)return;
    const last=state.matches.at(-1);
    state.matches.push({...DEFAULT_MATCH,flag:last.flag,league:'',time:'',leftTeam:last.leftTeam,rightTeam:last.rightTeam});
    updateGamesUI();changed();
  });
  $('gamesList').addEventListener('click',e=>{
    const remove=e.target.closest('[data-remove]');if(!remove)return;
    if(state.matches.length===1){showFeedback('حداقل یک بازی باید باقی بماند.','warning');return;}
    state.matches.splice(Number(remove.dataset.remove),1);updateGamesUI();changed();
  });
  const onGameInput=e=>{
    const target=e.target, article=target.closest('.game-editor');if(!article||!target.dataset.field)return;
    const i=Number(article.dataset.index),key=target.dataset.field;
    if(!state.matches[i]||!(key in DEFAULT_MATCH))return;
    state.matches[i][key]=target.value;
    if(key==='leftTeam'||key==='rightTeam'){
      const info=article.querySelector('.game-info');if(info)info.textContent=`${findTeam(state.matches[i].leftTeam)?.name||'تیم اول'} — ${findTeam(state.matches[i].rightTeam)?.name||'تیم دوم'}`;
    }
    if(key.endsWith('Font'))ensureFonts().then(scheduleRender);
    changed();
  };
  $('gamesList').addEventListener('input',onGameInput);
  $('gamesList').addEventListener('change',onGameInput);
  for(const k of ['weekDay','monthDay','dayColor','dateColor','dayFont','dateFont','dateLineColor','titlePurple','titleWhite','footerText','footerColor','telegramColor','footerFont','background','patternColor','frameColor','cardColor','globalFont']){
    $(k).addEventListener('input',e=>{state[k]=e.target.value;changed();if(k.endsWith('Font'))ensureFonts().then(scheduleRender);});
  }
  $('applyAllFonts').addEventListener('click',()=>{
    state.dayFont=state.dateFont=state.footerFont=state.globalFont;
    state.matches.forEach(m=>{m.leagueFont=state.globalFont;m.timeFont=state.globalFont;});
    syncOtherFields();updateGamesUI();changed();ensureFonts().then(scheduleRender);
    showFeedback('فونت روی تمام متن‌های قابل ویرایش اعمال شد؛ عنوان گرافیکی دست‌نخورده ماند.');
  });
  $('resetBtn').addEventListener('click',()=>{
    if(!confirm('تمام تغییرات فعلی به حالت اولیه برگردد؟'))return;
    state=sanitizeState(null);syncOtherFields();updateGamesUI();changed();showFeedback('قالب اولیه بازیابی شد.');
  });
  $('exportProject').addEventListener('click',downloadJSON);
  $('importProjectBtn').addEventListener('click',()=>$('projectFile').click());
  $('projectFile').addEventListener('change',async e=>{
    try{
      const f=e.target.files?.[0];if(!f)return;
      if(f.size>1000000)throw Error('too large');
      const parsed=JSON.parse(await f.text());state=sanitizeState(parsed);syncOtherFields();updateGamesUI();changed();
      await ensureFonts();scheduleRender();showFeedback('تنظیمات از فایل بازیابی شد.');
    }catch {showFeedback('فایل JSON معتبر نیست.','error');}
    finally{e.target.value='';}
  });
  $('downloadBtn').addEventListener('click',downloadPNG);
  $('downloadBtnBottom').addEventListener('click',downloadPNG);
}
async function main(){
  document.querySelectorAll('.font-select').forEach(el=>el.innerHTML=fontOptions('Vazirmatn'));
  syncOtherFields();events();
  [teams,flags]=await Promise.all([loadList('data/teams.json',fallbackTeams),loadList('data/flags.json',fallbackFlags)]);
  updateGamesUI();
  await Promise.all(Object.values(ASSETS).concat(teams.map(t=>t.image),flags.map(t=>t.image)).map(preload));
  render();ensureFonts().then(scheduleRender);
  if(!teams.length || !flags.length)showFeedback('بانک تیم‌ها یا پرچم‌ها خالی است. فایل‌های JSON را بررسی کن.','warning');
}
main().catch(error=>{console.error(error);showFeedback('بارگذاری کامل نشد. صفحه را تازه‌سازی کن.','error');});
