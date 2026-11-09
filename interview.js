/* WoSoCenter Interview Studio v1 — isolated from lineup/fixture drawing engines. */
(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const W=1080, H=1350, PANEL_BOTTOM=1272, TEXT_X=94, TEXT_W=892;
const FONT_NAMES=['Ario','Mikhak','DinArabic','Sahel','GraphikArabic','Tehran','YekanBoom','Lalezar','Hayat','Titr','ShahGosh','Shokoh','Paeez','Matin','Soltan','Sepahbod','Cinema','Casablanca','Haftad','DastNevis'];
const LOGOS=[{id:'barca',name:'Barca Femeni',src:'assets/interview/logo-barca.jpg'},{id:'woso',name:'WoSo Center',src:'assets/interview/logo-woso.jpg'}];
const DEFAULT_STRIPES=['#123f6b','#d3a54a','#ff4a0a','#ec50af','#06bd65','#f33345'];
const DEFAULT={logo:'barca',questionFont:'Ario',answerFont:'Ario',footerFont:'Ario',questionSize:24,answerSize:23,footerSize:24,lineHeight:1.43,questionColor:'#f5d44e',answerColor:'#ffffff',footerColor:'#ffffff',telegramColor:'#ffe277',panelColor:'#000000',panelOpacity:90,panelRadius:0,logoSize:102,footerText:'Barca_Femenino',stripes:[...DEFAULT_STRIPES],photo:{zoom:1,x:0,y:0},questionAlign:'justify',answerAlign:'justify',manualPages:[],pagePlan:[],palette:'ready:interview-original',photoSrc:'assets/interview/sample-photo.webp'};
let state={...DEFAULT,photo:{...DEFAULT.photo},stripes:[...DEFAULT.stripes]};
const poster=$('#poster'), ctx=poster.getContext('2d');
let photo=new Image(), logoImages={}, cropImage=null, cropDraft=null, cropIsNew=false, pageIndex=0, pages=[{lines:[],height:370}];
let scheduled=false, chosenFontTarget=null, chosenColorTarget=null, proposedColor='#ffffff', hsv={h:0,s:0,v:1};
let palettes=[];
const status=$('#status');
const changed = (message) => {if(message){status.textContent=message;clearTimeout(changed.timer);changed.timer=setTimeout(()=>status.textContent='',5000);} scheduleRender();};
const clamp=(x,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+x)?+x:min));
const hexOK=(s)=>/^#[0-9a-f]{6}$/i.test(s||'');
function rgba(h,a){const n=parseInt((hexOK(h)?h:'#000000').slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${clamp(a,0,1)})`;}
function safeFont(name){return FONT_NAMES.includes(name)||name==='Arial'?name:'Ario';}
function loadPhoto(src){const img=new Image();img.onload=()=>{photo=img;$('#photoSample').style.backgroundImage=`url("${src.replace(/"/g,'')}")`;scheduleRender();};img.onerror=()=>changed('بارگذاری تصویر پس‌زمینه انجام نشد.');img.src=src;}
LOGOS.forEach(l=>{const im=new Image();im.onload=scheduleRender;im.src=l.src;logoImages[l.id]=im;});
const fontCss=(kind,bold=false,italic=false)=>`${italic?'italic ':''}${bold?'900':'700'} ${state[kind+'Size']}px "${safeFont(state[kind+'Font'])}", Tahoma, sans-serif`;
const heightFor=(kind)=>Math.ceil(state[kind+'Size']*state.lineHeight)+3;
function getRichRuns(root){
 const out=[];
 function add(t,style){if(t)out.push({text:t,bold:!!style.bold,italic:!!style.italic,under:!!style.under});}
 function nl(){if(out.length && !out[out.length-1].text.endsWith('\n'))add('\n',{});}
 function walk(node,style={bold:false,italic:false,under:false}){
   if(node.nodeType===Node.TEXT_NODE){add(node.nodeValue,style);return;}
   if(node.nodeType!==Node.ELEMENT_NODE)return;
   const tag=node.tagName.toLowerCase();if(tag==='br'){add('\n',style);return;}
   const isBlock=['div','p','h1','h2','h3','li','blockquote'].includes(tag);
   if(isBlock&&out.length)nl();
   const next={bold:style.bold||['b','strong'].includes(tag)||Number(node.style.fontWeight)>=700,italic:style.italic||['i','em'].includes(tag)||node.style.fontStyle==='italic',under:style.under||tag==='u'||(node.style.textDecoration||'').includes('underline')};
   [...node.childNodes].forEach(n=>walk(n,next));
   if(isBlock)nl();
 }
 [...root.childNodes].forEach(n=>walk(n));
 while(out.length && out[out.length-1].text==='\n')out.pop();return out;
}
function tokenize(runs){
 const tokens=[];
 for(const r of runs){const chunks=r.text.split(/(\n|[ \t\r\u00a0]+)/u);
 for(const chunk of chunks){if(!chunk)continue;if(chunk==='\n'){tokens.push({type:'break'});continue;}
 if(/^\s+$/u.test(chunk)){tokens.push({type:'space'});continue;}
 tokens.push({type:'word',text:chunk,bold:r.bold,italic:r.italic,under:r.under});}}
 return tokens;
}
function lineWidth(words,kind){let total=0;const sp=measureSpace(kind);for(let i=0;i<words.length;i++){const w=words[i];ctx.font=fontCss(kind,w.bold,w.italic);total+=ctx.measureText(w.text).width;if(i)total+=sp;}return total;}
function measureSpace(kind){ctx.font=fontCss(kind);return ctx.measureText(' ').width||state[kind+'Size']*.3;}
function wrapRuns(root,kind){
 const tokens=tokenize(getRichRuns(root));const lines=[];let row=[];let explicit=false;
 const push=(final=true)=>{lines.push({kind,words:row,final,breakBefore:0,height:heightFor(kind)});row=[];};
 for(let t of tokens){
  if(t.type==='break'){push(true);explicit=true;continue;}
  if(t.type==='space'){continue;}
  ctx.font=fontCss(kind,t.bold,t.italic);if(ctx.measureText(t.text).width>TEXT_W){
    // Split exceptionally long unspaced words without dropping any characters.
    for(const ch of [...t.text]){const copy={...t,text:ch};if(row.length && lineWidth([...row,copy],kind)>TEXT_W)push(false);row.push(copy);}continue;
  }
  if(row.length&&lineWidth([...row,t],kind)>TEXT_W)push(false);
  row.push(t);
 }
 if(row.length||!lines.length)push(true);
 return lines;
}
function paginate(){
 const questionLines=wrapRuns($('#questionEditor'),'question');const answerLines=wrapRuns($('#answerEditor'),'answer');
 if(questionLines.every(l=>!l.words.length)&&answerLines.every(l=>!l.words.length)){const auto={key:'auto:0',isAuto:true,lines:[],height:370};const manual=(state.manualPages||[]).map(m=>({key:`manual:${m.id}`,isAuto:false,lines:m.lines||[],height:m.height||370}));const keys=[auto,...manual];state.pagePlan=(state.pagePlan||[]).filter(k=>keys.some(p=>p.key===k));keys.forEach(p=>{if(!state.pagePlan.includes(p.key))state.pagePlan.push(p.key)});pages=state.pagePlan.map(k=>keys.find(p=>p.key===k));pageIndex=clamp(pageIndex,0,pages.length-1);return;}
 const entries=[];for(const l of questionLines)entries.push({...l});
 for(let i=0;i<answerLines.length;i++)entries.push({...answerLines[i],breakBefore:i===0?22:0});
 let pg={lines:[],used:0};const list=[];const MAX_H=865;
 for(const entry of entries){const pad=pg.lines.length ? (entry.breakBefore||0) : 0;
   if(pg.lines.length && pg.used+entry.height+pad>MAX_H){list.push(pg);pg={lines:[],used:0};}
   const e={...entry,breakBefore:pg.lines.length?(entry.breakBefore||0):0};pg.lines.push(e);pg.used+=e.height+e.breakBefore;
 }
 if(pg.lines.length)list.push(pg);
 const automatic=list.map((x,i)=>({key:`auto:${i}`,isAuto:true,lines:x.lines,height:Math.max(370,x.used+76)}));
 const manual=Array.isArray(state.manualPages)?state.manualPages:[];
 const all=[...automatic,...manual.map(m=>({key:`manual:${m.id}`,isAuto:false,lines:m.lines||[],height:m.height||370}))];
 const available=new Map(all.map(x=>[x.key,x]));
 const order=Array.isArray(state.pagePlan)?state.pagePlan.filter(k=>available.has(k)):[];
 for(const page of automatic)if(!order.includes(page.key))order.push(page.key);
 for(const page of manual.map(m=>`manual:${m.id}`))if(!order.includes(page))order.push(page);
 state.pagePlan=order;pages=order.map(k=>available.get(k));
 pageIndex=clamp(pageIndex,0,pages.length-1);
}
function roundPath(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function paintImage(c,img,w,h,photoState){
 if(!img||!img.complete||!img.naturalWidth){c.fillStyle='#0d0d11';c.fillRect(0,0,w,h);return;}
 const base=Math.max(w/img.naturalWidth,h/img.naturalHeight);const z=clamp(photoState.zoom,1,5);
 const dw=img.naturalWidth*base*z,dh=img.naturalHeight*base*z;
 c.fillStyle='#100d13';c.fillRect(0,0,w,h);
 c.drawImage(img,(w-dw)/2+photoState.x*(w/W),(h-dh)/2+photoState.y*(h/H),dw,dh);
}
function drawLine(c,l,y){
 const kind=l.kind;const words=l.words;if(!words.length)return;
 const avail=TEXT_W;const wordsWidth=lineWidth(words,kind);const spaces=words.length-1;
 const align=state[kind+'Align']||'justify';const justify=align==='justify'&&!l.final&&spaces>0&&wordsWidth<avail;
 const baseSp=measureSpace(kind),gap=justify?baseSp+(avail-wordsWidth)/spaces:baseSp;
 // Match text alignment in the editor, using the same poster text width.
 const lineLength=wordsWidth+(justify?(avail-wordsWidth):0);
 let x=align==='left'?TEXT_X+lineLength:align==='center'?TEXT_X+(avail+lineLength)/2:TEXT_X+TEXT_W;
 c.direction='rtl';c.textAlign='right';c.textBaseline='alphabetic';
 for(let i=0;i<words.length;i++){
   const word=words[i];c.font=fontCss(kind,word.bold,word.italic);c.fillStyle=state[kind+'Color'];
   const dy=y+state[kind+'Size']*.91;
   c.fillText(word.text,x,dy);
   const wd=c.measureText(word.text).width;
   if(word.under){c.save();c.strokeStyle=c.fillStyle;c.lineWidth=1.3;c.beginPath();c.moveTo(x-wd,dy+4);c.lineTo(x,dy+4);c.stroke();c.restore();}
   x-=wd+(i<words.length-1?gap:0);
 }
}
function drawTelegram(c,x,y,color){c.save();c.translate(x,y);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3.4;c.lineJoin='round';c.beginPath();c.moveTo(0,10);c.lineTo(28,0);c.lineTo(19,27);c.lineTo(12,17);c.lineTo(7,24);c.lineTo(7,16);c.closePath();c.stroke();c.beginPath();c.moveTo(7,16);c.lineTo(28,0);c.stroke();c.restore();}
function paintPoster(c,which){
 const current=pages[which]||pages[0];c.clearRect(0,0,W,H);paintImage(c,photo,W,H,state.photo);
 const logo=logoImages[state.logo];if(logo&&logo.complete&&logo.naturalWidth){const sz=state.logoSize;c.save();roundPath(c,W-30-sz,30,sz,sz,15);c.clip();c.drawImage(logo,W-30-sz,30,sz,sz);c.restore();}
 const panelY=PANEL_BOTTOM-current.height;
 c.save();c.fillStyle=rgba(state.panelColor,state.panelOpacity/100);roundPath(c,54,panelY,972,current.height,state.panelRadius);c.fill();c.restore();
 let y=panelY+30;
 for(const line of current.lines){y+=line.breakBefore||0;drawLine(c,line,y);y+=line.height;}
 const stripeW=972/state.stripes.length;state.stripes.forEach((v,i)=>{c.fillStyle=v;c.fillRect(54+i*stripeW,PANEL_BOTTOM,stripeW+0.5,13);});
 if(state.footerText.trim()){
  const ft=state.footerText.trim();let fz=state.footerSize;
  c.save();c.direction='ltr';c.font=`700 ${fz}px "${safeFont(state.footerFont)}", Arial, sans-serif`;c.textAlign='left';c.textBaseline='middle';
  let tw=c.measureText(ft).width;const iconW=34, gap=13;if(tw>W-110){fz=Math.max(11,Math.floor(fz*(W-110)/tw));c.font=`700 ${fz}px \"${safeFont(state.footerFont)}\", Arial, sans-serif`;tw=c.measureText(ft).width;}const xx=(W-tw-iconW-gap)/2,fy=1321;
  drawTelegram(c,xx,fy-14,state.telegramColor);c.fillStyle=state.footerColor;c.fillText(ft,xx+iconW+gap,fy);c.restore();
 }
}
function draw(){scheduled=false;if(!photo.complete||!photo.naturalWidth)return;paginate();paintPoster(ctx,pageIndex);$('#pageCounter').textContent=`صفحه ${pageIndex+1} از ${pages.length}`;$('#pageTotal').textContent=`${pages.length} صفحه`;if($('#pagesDialog').open)refreshPageGallery();$('#previousPage').disabled=pageIndex<=0;$('#nextPage').disabled=pageIndex>=pages.length-1;
 const dots=$('#pageDots');dots.replaceChildren();pages.forEach((_,i)=>{const b=document.createElement('button');b.className='page-dot'+(i===pageIndex?' active':'');b.type='button';b.title=`صفحه ${i+1}`;b.setAttribute('aria-label',b.title);b.onclick=()=>{pageIndex=i;scheduleRender();};dots.append(b);});
}
function scheduleRender(){if(historyReady&&!restoring)queueHistory();if(scheduled)return;scheduled=true;requestAnimationFrame(draw);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
async function toPNG(which){const c=document.createElement('canvas');c.width=W;c.height=H;paintPoster(c.getContext('2d'),which);return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG')), 'image/png'));}
$('#downloadTop').onclick=async()=>{try{await document.fonts.ready;const b=await toPNG(pageIndex);downloadBlob(b,`WoSo-Interview-${pageIndex+1}.png`);changed('تصویر PNG دریافت شد.');}catch{changed('دانلود انجام نشد. دوباره تلاش کنید.');}};
// Browsers may request permission for multiple automatic downloads. No ZIP is generated.
async function downloadSeparatePages(){
 const btn=$('#downloadAllPagesBtn');const old=btn.textContent;btn.disabled=true;btn.textContent='در حال ساخت تصاویر…';
 try{await document.fonts.ready;paginate();const count=pages.length;
   for(let i=0;i<count;i++){const blob=await toPNG(i);downloadBlob(blob,`WoSo-Interview-${String(i+1).padStart(2,'0')}.png`);
     // Leave breathing room for the browser's download scheduler.
     if(i<count-1)await new Promise(r=>setTimeout(r,250));}
   changed(`${count} فایل PNG جداگانه برای دانلود ارسال شد؛ در صورت نیاز اجازهٔ دانلود چند فایل را بدهید.`);
 }catch(error){console.error(error);changed('دریافت تصاویر انجام نشد؛ دوباره تلاش کنید.');}
 finally{btn.disabled=false;btn.textContent=old;}
}
$('#downloadAllPagesBtn').onclick=downloadSeparatePages;
$('#previousPage').onclick=()=>{pageIndex--;scheduleRender();};$('#nextPage').onclick=()=>{pageIndex++;scheduleRender();};
// Editors: plain-text paste prevents inherited Word/website styles from breaking the poster.
$$('.rich-editor').forEach(el=>{el.addEventListener('input',()=>{pageIndex=0;scheduleRender();});el.addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,text);});});
$$('.editor-toolbar button').forEach(b=>b.addEventListener('mousedown',e=>e.preventDefault()));
$$('.editor-toolbar button').forEach(b=>b.onclick=()=>{const target=$('#'+b.closest('.editor-toolbar').dataset.editor);
 if(b.dataset.align){const kind=target.id==='questionEditor'?'question':'answer';state[kind+'Align']=b.dataset.align;updateAlignButtons();scheduleRender();return;}
 target.focus();document.execCommand(b.dataset.cmd,false,null);scheduleRender();});
function updateAlignButtons(){$$('.editor-toolbar [data-align]').forEach(b=>{const kind=b.closest('.editor-toolbar').dataset.editor==='questionEditor'?'question':'answer';const selected=(state[kind+'Align']||'justify')===b.dataset.align;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});$$('.rich-editor').forEach(el=>{el.style.textAlign=state[el.id==='questionEditor'?'questionAlign':'answerAlign']||'justify';});}
$$('[data-reset-font]').forEach(b=>b.onclick=()=>{const kind=b.dataset.resetFont;state[kind+'Font']=DEFAULT[kind+'Font'];state[kind+'Size']=DEFAULT[kind+'Size'];refreshControls();changed(`تنظیمات پیش‌فرض ${kind==='question'?'سؤال':'جواب'} (آریو) بازیابی شد.`);});
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b));});$$('.tab-panel').forEach(x=>x.classList.toggle('hidden',x.id!=='tab-'+b.dataset.tab));if(b.dataset.tab==='history')refreshHistoryUI();});
const unitLabel=(key)=>({questionSize:'px',answerSize:'px',footerSize:'px',logoSize:'px',panelOpacity:'%',panelRadius:'px',lineHeight:'×'})[key];
$$('[data-number]').forEach(el=>{const key=el.dataset.number;el.value=state[key];const lbl=$('#'+key+'Label');if(lbl)lbl.textContent=state[key]+unitLabel(key);el.addEventListener('input',()=>{state[key]=+el.value;if(lbl)lbl.textContent=el.value+unitLabel(key);scheduleRender();});});
$$('[data-number-input]').forEach(input=>{const key=input.dataset.numberInput;input.value=state[key];const range=$('#'+key);input.oninput=()=>{if(input.value==='')return;const v=clamp(+input.value,+input.min,+input.max);state[key]=v;range.value=v;$('#'+key+'Label').textContent=v+unitLabel(key);scheduleRender();};input.onchange=()=>{input.value=state[key];};});
$$('[data-number]').forEach(range=>range.addEventListener('input',()=>{const input=$('#'+range.dataset.number+'Number');if(input)input.value=state[range.dataset.number];}));
$('#footerText').value=state.footerText;$('#footerText').oninput=e=>{state.footerText=e.target.value;scheduleRender();};
$('#photoSample').style.backgroundImage=`url('${state.photoSrc}')`;loadPhoto(state.photoSrc);
function showDialog(selector){const d=$(selector);if(!d.open)d.showModal();}
function closeDialog(id){const d=$('#'+id);if(d.open)d.close();}
$$('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
// Logo selector: same selected-state treatment as player/formation lists.
function refreshLogoChoices(){const holder=$('#logoOptions');holder.replaceChildren();LOGOS.forEach(l=>{const b=document.createElement('button');b.type='button';b.className='logo-option'+(state.logo===l.id?' selected':'');b.innerHTML=`<img src="${l.src}" alt=""/><strong>${l.name}</strong><span class="check">✓</span>`;b.onclick=()=>{state.logo=l.id;$('#currentLogo').src=l.src;closeDialog('logoDialog');scheduleRender();};holder.append(b);});}
$('#openLogoDialog').onclick=()=>{refreshLogoChoices();showDialog('#logoDialog');};
// Font selector — all options are locally bundled site fonts.
function refreshFontList(term=''){$('#fontOptions').replaceChildren();FONT_NAMES.filter(n=>n.toLowerCase().includes(term.toLowerCase())).forEach(f=>{const b=document.createElement('button');b.type='button';b.className='font-option'+(state[chosenFontTarget+'Font']===f?' selected':'');b.innerHTML=`<small>${f}</small><strong style="font-family:'${f}',Tahoma,sans-serif">مصاحبه با ووسو سنتر</strong>`;b.onclick=async()=>{state[chosenFontTarget+'Font']=f;$('#font'+chosenFontTarget[0].toUpperCase()+chosenFontTarget.slice(1)).textContent=f+' ▾';closeDialog('fontDialog');try{await document.fonts.load(`700 24px "${f}"`);}catch{}scheduleRender();};$('#fontOptions').append(b);});}
$$('[data-font]').forEach(b=>b.onclick=()=>{chosenFontTarget=b.dataset.font;$('#fontSearch').value='';refreshFontList();showDialog('#fontDialog');});$('#fontSearch').oninput=e=>refreshFontList(e.target.value);
// Color picker with adjustable hue and saturation/value.
function hexToHSV(hex){let n=parseInt(hex.slice(1),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}return{h,s:max===0?0:d/max,v:max};}
function hsvToHex(o){const h=o.h,s=o.s,v=o.v,k=n=>(n+h/60)%6,f=n=>Math.round((v-v*s*Math.max(Math.min(k(n),4-k(n),1),0))*255);return '#'+[f(5),f(3),f(1)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function updateColorUI(){proposedColor=hsvToHex(hsv);$('#hexColor').value=proposedColor.toUpperCase();$('#nativeColor').value=proposedColor;$('#colorHue').value=hsv.h;$('#colorArea').style.background=`linear-gradient(0deg,#000,transparent),linear-gradient(90deg,#fff,hsl(${hsv.h} 100% 50%))`;$('#colorPointer').style.left=(hsv.s*100)+'%';$('#colorPointer').style.top=((1-hsv.v)*100)+'%';}
const COLOR_SWATCHES=['#ffffff','#000000','#f5d44e','#ff4a0a','#f450ab','#00c776','#113e78','#90284f','#a95cd5','#e2b351','#d5d5d5','#ef4568'];
COLOR_SWATCHES.forEach(hex=>{const b=document.createElement('button');b.type='button';b.style.background=hex;b.title=hex;b.onclick=()=>{hsv=hexToHSV(hex);updateColorUI();};$('#colorPresets').append(b);});
function getColor(key){if(key.startsWith('stripe'))return state.stripes[+key.slice(6)];return state[key];}
function setColor(key,hex){if(key.startsWith('stripe'))state.stripes[+key.slice(6)]=hex;else state[key]=hex;updateColorButtons();scheduleRender();}
function openColor(target){chosenColorTarget=target;hsv=hexToHSV(getColor(target));updateColorUI();showDialog('#colorDialog');}
$$('[data-color]').forEach(b=>b.onclick=()=>openColor(b.dataset.color));
function updateColorButtons(){$$('[data-color]').forEach(b=>b.style.background=getColor(b.dataset.color));$$('[data-stripe]').forEach(b=>b.style.background=getColor('stripe'+b.dataset.stripe));}
const area=$('#colorArea');function setSV(e){const r=area.getBoundingClientRect();hsv.s=clamp((e.clientX-r.left)/r.width,0,1);hsv.v=1-clamp((e.clientY-r.top)/r.height,0,1);updateColorUI();}
area.addEventListener('pointerdown',e=>{area.setPointerCapture(e.pointerId);setSV(e);});area.addEventListener('pointermove',e=>{if(e.buttons)setSV(e);});$('#colorHue').oninput=e=>{hsv.h=+e.target.value;updateColorUI();};
$('#nativeColor').oninput=e=>{hsv=hexToHSV(e.target.value);updateColorUI();};
$('#hexColor').addEventListener('input',e=>{const val=e.target.value;if(hexOK(val)){hsv=hexToHSV(val);updateColorUI();}});
$('#confirmColor').onclick=()=>{setColor(chosenColorTarget,proposedColor);closeDialog('colorDialog');};
// Stripes from the supplied reference: six color sections, all individually editable.
const stripeHolder=$('#stripeColors');for(let i=0;i<6;i++){const wrap=document.createElement('label');wrap.className='stripe-item';wrap.textContent=`بخش ${i+1}`;const b=document.createElement('button');b.type='button';b.dataset.stripe=i;b.onclick=()=>openColor('stripe'+i);wrap.append(b);stripeHolder.append(wrap);}updateColorButtons();
// Use existing ready palettes from lineup. Default colors intentionally match user's template.
function paletteMap(p){return{questionColor:p.accent||'#f5d44e',answerColor:p.text||'#ffffff',footerColor:p.text||'#ffffff',telegramColor:p.accent||'#e4bd54',panelColor:p.lower||'#000000',stripes:[p.header,p.upper,p.accent,p.card1,p.card2,p.lower].map(x=>hexOK(x)?x:'#000000')};}
const ORIGINAL_PALETTE={id:'ready:interview-original',name:'اصلی مصاحبه (پیش‌فرض)',header:'#123f6b',upper:'#d3a54a',accent:'#ff4a0a',card1:'#ec50af',card2:'#06bd65',lower:'#f33345',text:'#ffffff',interviewOriginal:true};
function drawPalettes(){const holder=$('#paletteList');holder.replaceChildren();palettes.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='palette-choice'+(state.palette===p.id?' selected':'');const colors=[p.header,p.upper,p.accent,p.card1,p.card2,p.lower];const swatches=document.createElement('span');swatches.className='swatches';colors.forEach(x=>{const i=document.createElement('i');i.style.background=x;swatches.append(i);});const name=document.createElement('strong');name.textContent=p.name;b.append(swatches,name);b.onclick=()=>{Object.assign(state,p.interviewOriginal?{questionColor:DEFAULT.questionColor,answerColor:DEFAULT.answerColor,footerColor:DEFAULT.footerColor,telegramColor:DEFAULT.telegramColor,panelColor:DEFAULT.panelColor,panelOpacity:DEFAULT.panelOpacity,panelRadius:DEFAULT.panelRadius,stripes:[...DEFAULT_STRIPES]}:paletteMap(p));state.palette=p.id;updateColorButtons();drawPalettes();updateAlignButtons();$$('[data-number-input]').forEach(input=>input.value=state[input.dataset.numberInput]);scheduleRender();};holder.append(b);});}
fetch('data/lineup-ready-palettes.json').then(x=>x.ok?x.json():Promise.reject()).then(data=>{palettes=[ORIGINAL_PALETTE,...data];fetch('data/lineup-palettes.json').then(r=>r.ok?r.json():[]).then(all=>{const barca=all.find(x=>x.id==='barcelona');if(barca)palettes.splice(1,0,{...barca,id:'lineup:barcelona',name:'بارسلونا (پالت شماتیک‌ساز)'});drawPalettes();}).catch(drawPalettes);drawPalettes();}).catch(()=>{palettes=[ORIGINAL_PALETTE,{id:'ready:woso',name:'ووسو سنتر',header:'#050207',upper:'#320a3e',accent:'#ae5acf',card1:'#783695',card2:'#dfb6e7',lower:'#050207',text:'#fff4ff'}];drawPalettes();});
// Photo crop, pixel-perfect coordinate system (1080 x 1350) shared by preview and export.
const cropC=$('#cropCanvas'),cropCtx=cropC.getContext('2d');
function drawCrop(){if(!cropDraft||!cropImage)return;cropCtx.clearRect(0,0,540,675);paintImage(cropCtx,cropImage,540,675,cropDraft);}
function syncCropInputs(){if(!cropDraft)return;const d=cropDraft;$('#cropZoomNumber').value=Math.round(d.zoom*100);$('#cropZoomRange').value=Math.round(d.zoom*100);$('#cropXpx').value=Math.round(d.x);$('#cropYpx').value=Math.round(d.y);$('#cropXpercent').value=(d.x/W*100).toFixed(1);$('#cropYpercent').value=(d.y/H*100).toFixed(1);$('#cropXrange').value=Math.round(d.x);$('#cropYrange').value=Math.round(d.y);drawCrop();}
function openCrop(img=null){cropIsNew=!!img;cropImage=img||photo;cropDraft=img?{zoom:1,x:0,y:0}:{...state.photo};syncCropInputs();showDialog('#cropDialog');}
$('#adjustPhoto').onclick=()=>openCrop();$('#uploadPhoto').onclick=()=>$('#photoUpload').click();
$('#photoUpload').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;$('#photoUpload').value='';if(!/^image\/(png|jpeg|webp|avif|gif|bmp)$/.test(f.type)){changed('فرمت تصویر پشتیبانی نمی‌شود.');return;}if(f.size>35*1024*1024){changed('حجم عکس بیش از ۳۵ مگابایت است.');return;}
 const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{img.datasetSource=reader.result;openCrop(img);};img.onerror=()=>changed('خواندن فایل تصویر ممکن نبود.');img.src=reader.result;};reader.readAsDataURL(f);
};
$('#cropZoomNumber').oninput=e=>{cropDraft.zoom=clamp(+e.target.value/100,1,5);syncCropInputs();};$('#cropZoomRange').oninput=e=>{cropDraft.zoom=clamp(+e.target.value/100,1,5);syncCropInputs();};
for(const axis of ['X','Y']){
 const key=axis.toLowerCase(),size=axis==='X'?W:H;
 $('#crop'+axis+'px').oninput=e=>{cropDraft[key]=clamp(+e.target.value,-size,size);syncCropInputs();};
 $('#crop'+axis+'percent').oninput=e=>{cropDraft[key]=clamp(+e.target.value/100*size,-size,size);syncCropInputs();};
 $('#crop'+axis+'range').oninput=e=>{cropDraft[key]=+e.target.value;syncCropInputs();};
}
const cropSurface=$('.crop-preview');const cropPointers=new Map();let cropGesture=null;
function pointerPos(e){return{x:e.clientX,y:e.clientY};}
function pointerDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function startCropGesture(){if(!cropDraft||!cropPointers.size)return;const arr=[...cropPointers.values()];const cx=arr.reduce((a,p)=>a+p.x,0)/arr.length,cy=arr.reduce((a,p)=>a+p.y,0)/arr.length;
 cropGesture={count:arr.length,startX:cx,startY:cy,x:cropDraft.x,y:cropDraft.y,zoom:cropDraft.zoom,dist:arr.length>1?pointerDistance(arr[0],arr[1]):0};}
cropSurface.addEventListener('pointerdown',e=>{if(!cropDraft)return;e.preventDefault();cropPointers.set(e.pointerId,pointerPos(e));try{cropSurface.setPointerCapture(e.pointerId);}catch{}startCropGesture();});
cropSurface.addEventListener('pointermove',e=>{if(!cropPointers.has(e.pointerId)||!cropDraft)return;e.preventDefault();cropPointers.set(e.pointerId,pointerPos(e));const arr=[...cropPointers.values()];if(!cropGesture||cropGesture.count!==arr.length)startCropGesture();
 const r=cropSurface.getBoundingClientRect(),cx=arr.reduce((a,p)=>a+p.x,0)/arr.length,cy=arr.reduce((a,p)=>a+p.y,0)/arr.length;
 cropDraft.x=clamp(cropGesture.x+(cx-cropGesture.startX)*W/r.width,-W,W);cropDraft.y=clamp(cropGesture.y+(cy-cropGesture.startY)*H/r.height,-H,H);
 if(arr.length>1&&cropGesture.dist>0)cropDraft.zoom=clamp(cropGesture.zoom*pointerDistance(arr[0],arr[1])/cropGesture.dist,1,5);
 syncCropInputs();});
function endCropPointer(e){cropPointers.delete(e.pointerId);startCropGesture();}
cropSurface.addEventListener('pointerup',endCropPointer);cropSurface.addEventListener('pointercancel',endCropPointer);cropSurface.addEventListener('lostpointercapture',endCropPointer);
cropSurface.addEventListener('wheel',e=>{if(!cropDraft)return;e.preventDefault();cropDraft.zoom=clamp(cropDraft.zoom*(e.deltaY<0?1.06:1/1.06),1,5);syncCropInputs();},{passive:false});
$('#cropReset').onclick=()=>{cropDraft={zoom:1,x:0,y:0};syncCropInputs();};$('#cropCancel').onclick=()=>closeDialog('cropDialog');
$('#cropSave').onclick=()=>{if(cropIsNew){photo=cropImage;state.photoSrc=photo.datasetSource||photo.src;$('#photoSample').style.backgroundImage=`url("${state.photoSrc}")`;}state.photo={...cropDraft};cropIsNew=false;closeDialog('cropDialog');pageIndex=0;changed('تنظیم تصویر با موفقیت ثبت شد ✓');};
$('#cropDialog').addEventListener('close',()=>{cropDraft=null;cropImage=null;cropIsNew=false;cropPointers.clear();cropGesture=null;});
// Import/export user project (does not change other WOSO tools).
$('#exportProject').onclick=()=>{const obj={version:1,type:'woso-interview',state:{...state},question:$('#questionEditor').innerHTML,answer:$('#answerEditor').innerHTML};downloadBlob(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),'WoSo-Interview-project.json');};
function cleanRich(str){const container=document.createElement('div');container.innerHTML=String(str||'');const allow=new Set(['B','STRONG','I','EM','U','BR','P','DIV','SPAN']);function clean(n){for(const node of [...n.childNodes]){if(node.nodeType===Node.ELEMENT_NODE){if(!allow.has(node.tagName)){node.replaceWith(document.createTextNode(node.textContent||''));continue;}for(const a of [...node.attributes])node.removeAttribute(a.name);clean(node);}else if(node.nodeType!==Node.TEXT_NODE)node.remove();}}clean(container);return container.innerHTML;}
$('#importProject').onclick=()=>$('#projectUpload').click();$('#projectUpload').onchange=async(e)=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>40*1024*1024)throw Error('too big');const data=JSON.parse(await file.text());if(data.type!=='woso-interview'||!data.state)throw Error('wrong type');
 const next={...DEFAULT,...data.state};for(const k of ['questionColor','answerColor','footerColor','telegramColor','panelColor'])if(!hexOK(next[k]))next[k]=DEFAULT[k];next.stripes=Array.isArray(next.stripes)&&next.stripes.length===6?next.stripes.map((v,i)=>hexOK(v)?v:DEFAULT_STRIPES[i]):[...DEFAULT_STRIPES];next.photo={zoom:clamp(next.photo?.zoom,1,5),x:clamp(next.photo?.x,-W,W),y:clamp(next.photo?.y,-H,H)};next.logo=LOGOS.some(l=>l.id===next.logo)?next.logo:'barca';for(const k of ['questionAlign','answerAlign'])if(!['right','left','center','justify'].includes(next[k]))next[k]='justify';next.manualPages=Array.isArray(next.manualPages)?next.manualPages.filter(m=>m&&typeof m.id==='string'&&Array.isArray(m.lines)).slice(0,70):[];next.pagePlan=Array.isArray(next.pagePlan)?next.pagePlan.filter(k=>typeof k==='string').slice(0,100):[];for(const k of ['questionFont','answerFont','footerFont'])next[k]=safeFont(next[k]);for(const k of ['questionSize','answerSize','footerSize','logoSize','panelRadius','panelOpacity','lineHeight'])next[k]=clamp(next[k],k==='lineHeight'?1.2:(k==='logoSize'?65:(k.endsWith('Size')?16:0)),k==='lineHeight'?2:(k==='panelOpacity'?100:(k==='logoSize'?175:(k==='panelRadius'?60:36))));
 state=next;$('#questionEditor').innerHTML=cleanRich(data.question);$('#answerEditor').innerHTML=cleanRich(data.answer);refreshControls();loadPhoto(typeof state.photoSrc==='string'&& (state.photoSrc.startsWith('data:image/')||state.photoSrc.startsWith('assets/interview/'))?state.photoSrc:DEFAULT.photoSrc);pageIndex=0;changed('فایل پروژه با موفقیت بازیابی شد.');
 }catch(err){changed('فایل پروژه معتبر نیست یا بسیار بزرگ است.');}};
function refreshControls(){for(const el of $$('[data-number]')){const key=el.dataset.number;el.value=state[key];const lbl=$('#'+key+'Label');if(lbl)lbl.textContent=state[key]+unitLabel(key);}$('#footerText').value=state.footerText;$('#currentLogo').src=LOGOS.find(l=>l.id===state.logo).src;for(const kind of ['question','answer','footer'])$('#font'+kind[0].toUpperCase()+kind.slice(1)).textContent=state[kind+'Font']+' ▾';updateColorButtons();drawPalettes();updateAlignButtons();$$('[data-number-input]').forEach(input=>input.value=state[input.dataset.numberInput]);scheduleRender();}
$('#resetProject').onclick=()=>{if(!confirm('متن و تنظیمات مصاحبه به حالت اولیه برگردند؟'))return;state={...DEFAULT,photo:{...DEFAULT.photo},stripes:[...DEFAULT.stripes]};$('#questionEditor').textContent='نینا پاتالون، سرمربی تیم ملی لهستان، گفته بود که تو در این فصل شایسته عنوان بهترین بازیکن جهان بوده‌ای. هم‌تیمی‌هایت نیز حمایت زیادی از تو نشان داده‌اند. این حمایت برایت چه معنایی دارد؟';$('#answerEditor').textContent='حالا که دوباره این حرف‌ها را می‌شنوم، واقعاً احساس گرمای خاصی در قلبم دارم. از این کلمات و پیام‌هایی که از دخترها دریافت کردم، عمیقاً تحت تأثیر قرار گرفتم و بسیار سپاسگزارم. خوشحالم که عضوی از چنین تیم فوق‌العاده‌ای هستم؛ تیمی که هرکدام از ما تمام توانمان را به کار می‌گیریم تا در کنار یکدیگر به دستاوردی ویژه برسیم. اینکه کاپیتان چنین تیمی هستم، برایم افتخار بزرگی است. حمایت هم‌تیمی‌هایم واقعاً اهمیت زیادی برایم دارد و از آن‌ها بسیار ممنونم.';loadPhoto(DEFAULT.photoSrc);refreshControls();pageIndex=0;changed('طرح پیش‌فرض بازیابی شد.');};

// Shared WoSoCenter editor chrome: theme, undo/redo timeline and page gallery.
let historyReady=false,restoring=false,historyTimer=null,history=[],historyPosition=-1,historyLabel='ویرایش طرح';
const rememberedTheme=(()=>{try{return localStorage.getItem('wosocenter-ui-theme')||'dark';}catch{return'dark'}})();
document.documentElement.dataset.theme=rememberedTheme;
$('#themeToggle').textContent=rememberedTheme==='dark'?'☀':'☾';
$('#themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;$('#themeToggle').textContent=next==='dark'?'☀':'☾';try{localStorage.setItem('wosocenter-ui-theme',next);}catch{}};
function snapshot(){return{state:JSON.stringify(state),question:$('#questionEditor').innerHTML,answer:$('#answerEditor').innerHTML};}
function snapshotKey(s){return s.state+'\u0001'+s.question+'\u0001'+s.answer;}
function queueHistory(){if(!historyReady||restoring)return;clearTimeout(historyTimer);historyTimer=setTimeout(()=>saveHistory(),360);}
const INTERVIEW_HISTORY_STORE='wosocenter-interview-history-v66';
function persistHistory(){try{const current=snapshot();let entries=history.slice(-30).map(h=>({data:h.data,label:h.label,at:h.at.toISOString()}));let index=historyPosition-(history.length-entries.length);
 let output=JSON.stringify({current,entries,index});
 if(output.length>3_500_000){entries=[{data:current,label:'آخرین طرح',at:new Date().toISOString()}];index=0;output=JSON.stringify({current,entries,index});}
 if(output.length>3_500_000)throw Error('storage quota');localStorage.setItem(INTERVIEW_HISTORY_STORE,output);$('#saveIndicator').textContent='✓ ذخیره شد';
 }catch(e){try{localStorage.removeItem(INTERVIEW_HISTORY_STORE)}catch{}$('#saveIndicator').textContent='ذخیره فقط در این جلسه';}}
function saveHistory(label=historyLabel){if(!historyReady||restoring)return;clearTimeout(historyTimer);const s=snapshot(),key=snapshotKey(s);
 if(historyPosition>=0&&history[historyPosition].key===key)return;
 history=history.slice(0,historyPosition+1);history.push({data:s,key,label,at:new Date()});
 if(history.length>200)history.shift();historyPosition=history.length-1;
 historyLabel='ویرایش طرح';refreshHistoryUI();persistHistory();}
function applyHistory(index){if(index<0||index>=history.length)return;clearTimeout(historyTimer);if(historyReady)saveHistory();restoring=true;historyPosition=index;
 const s=history[index].data,oldSrc=state.photoSrc;state=JSON.parse(s.state);
 $('#questionEditor').innerHTML=s.question;$('#answerEditor').innerHTML=s.answer;
 if(state.photoSrc!==oldSrc)loadPhoto(state.photoSrc);
 refreshControls();pageIndex=0;restoring=false;refreshHistoryUI();persistHistory();scheduleRender();}
function historyJump(index){if(index===historyPosition)return;clearTimeout(historyTimer);saveHistory();applyHistory(index);}
function undo(){saveHistory();if(historyPosition>0)applyHistory(historyPosition-1);}
function redo(){if(historyPosition<history.length-1)applyHistory(historyPosition+1);}
function refreshHistoryUI(){const canUndo=historyPosition>0,canRedo=historyPosition<history.length-1;
 ['undoBtn','historyUndo'].forEach(id=>$('#'+id).disabled=!canUndo);
 ['redoBtn','historyRedo'].forEach(id=>$('#'+id).disabled=!canRedo);
 $('#historyCount').textContent=`${Math.max(0,history.length-1)} تغییر`;
 const list=$('#historyList');list.replaceChildren();
 history.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='history-item'+(i===historyPosition?' selected':'')+(i>historyPosition?' future':'');
 const n=document.createElement('span');n.className='history-num';n.textContent=String(i+1);
 const t=document.createElement('span');t.className='history-label';t.textContent=i===0?'شروع پروژه':item.label;
 const time=document.createElement('time');time.textContent=item.at.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
 b.append(n,t,time);b.onclick=()=>historyJump(i);list.append(b);});}
$('#undoBtn').onclick=$('#historyUndo').onclick=undo;$('#redoBtn').onclick=$('#historyRedo').onclick=redo;
$('#showHistoryBtn').onclick=()=>{$$('.tab').find(b=>b.dataset.tab==='history').click();document.querySelector('.sidebar').scrollIntoView({behavior:'smooth',block:'start'});};
document.addEventListener('keydown',e=>{if(!e.ctrlKey&&!e.metaKey)return;const key=e.key.toLowerCase();if(key==='z'||key==='y'){
 // Keep native undo while actually editing text; custom history is for editor/canvas controls.
 if(e.target.closest('[contenteditable=true]'))return;e.preventDefault();if(key==='y'||e.shiftKey)redo();else undo();}});
// Label edits without interfering with normal input event behavior.
document.addEventListener('input',e=>{historyLabel=e.target.closest('label')?.firstChild?.textContent?.trim()?.slice(0,45)|| (e.target.classList.contains('rich-editor')?'ویرایش متن مصاحبه':'تنظیم ظاهر');});
document.addEventListener('click',e=>{if(e.target.closest('[data-font],[data-color],.palette-choice,.logo-option,[data-reset-font],#cropSave'))historyLabel='تغییر تنظیمات طراحی';},true);

function manualTextFromLines(page,kind){return page.lines.filter(l=>l.kind===kind).map(l=>l.words.map(w=>w.text).join(' ')).join('\n');}
function syncManualEditing(){const current=pages[pageIndex];const edit=$('#manualPageEditing');if(!current||current.isAuto){edit.classList.add('hidden');return;}const manual=state.manualPages.find(m=>`manual:${m.id}`===current.key);if(!manual)return;
 edit.classList.remove('hidden');const q=manual.question??manualTextFromLines(current,'question'),a=manual.answer??manualTextFromLines(current,'answer');
 if($('#manualQuestion').value!==q)$('#manualQuestion').value=q;
 if($('#manualAnswer').value!==a)$('#manualAnswer').value=a;
 const total=(manual.lines||[]).reduce((n,l)=>n+l.height+(l.breakBefore||0),0);
 $('#manualPageWarning').textContent=total>865?'⚠ متن این صفحه از فضای پوستر بیشتر است؛ متن را کوتاه‌تر کنید.':'متن صفحهٔ دستی مستقل و قابل ویرایش است؛ صفحات خودکار دست‌نخورده می‌مانند.';}
function updateManualText(){const current=pages[pageIndex];if(!current||current.isAuto)return;const manual=state.manualPages.find(m=>`manual:${m.id}`===current.key);if(!manual)return;
 manual.question=$('#manualQuestion').value;manual.answer=$('#manualAnswer').value;const q=document.createElement('div'),a=document.createElement('div');q.textContent=manual.question;a.textContent=manual.answer;
 const qlines=wrapRuns(q,'question'),alines=wrapRuns(a,'answer');const arr=[...qlines.filter(l=>l.words.length),...alines.filter(l=>l.words.length).map((l,i)=>({...l,breakBefore:i===0&&qlines.some(x=>x.words.length)?22:0}))];
 const used=arr.reduce((n,l)=>n+l.height+(l.breakBefore||0),0);manual.lines=arr;manual.height=Math.max(370,used+76);
 $('#manualPageWarning').textContent=used>865?'⚠ متن این صفحه بیش از فضای پوستر است؛ لطفاً متن را کوتاه‌تر کنید یا در متن اصلی مصاحبه قرار دهید.':'متن صفحهٔ دستی ثبت شد.';
 scheduleRender();}
['manualQuestion','manualAnswer'].forEach(id=>$('#'+id).addEventListener('input',updateManualText));
function refreshPageGallery(){if(!$('#pagesDialog').open)return;const gallery=$('#pageGallery');gallery.replaceChildren();syncManualEditing();
 pages.forEach((page,i)=>{const item=document.createElement('div');item.className='page-tile'+(i===pageIndex?' current':'');
 const pick=document.createElement('button');pick.type='button';pick.className='page-select';const thumb=document.createElement('canvas');thumb.width=162;thumb.height=202;
 try{const mini=thumb.getContext('2d');mini.scale(162/W,202/H);paintPoster(mini,i);}catch(e){console.warn(e)}
 const label=document.createElement('span');label.textContent=`صفحه ${i+1} · ${page.isAuto?'خودکار':'دستی'}`;
 pick.append(thumb,label);pick.onclick=()=>{pageIndex=i;scheduleRender();refreshPageGallery();};item.append(pick);
 const actions=document.createElement('div');actions.className='page-actions';
 function action(text,title,fn,disabled=false){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.disabled=disabled;b.onclick=fn;actions.append(b);}
 action('↓','دانلود همین صفحه',async()=>{await document.fonts.ready;downloadBlob(await toPNG(i),`WoSo-Interview-${String(i+1).padStart(2,'0')}.png`);});
 action('⧉','تکثیر صفحه',()=>{const id=String(Date.now())+Math.random().toString(36).slice(2,5);state.manualPages.push({id,lines:JSON.parse(JSON.stringify(page.lines)),height:page.height,question:manualTextFromLines(page,'question'),answer:manualTextFromLines(page,'answer')});state.pagePlan.splice(i+1,0,`manual:${id}`);pageIndex=i+1;scheduleRender();});
 action('→','جابجایی به راست',()=>{[state.pagePlan[i-1],state.pagePlan[i]]=[state.pagePlan[i],state.pagePlan[i-1]];pageIndex=i-1;scheduleRender();},i===0);
 action('←','جابجایی به چپ',()=>{[state.pagePlan[i],state.pagePlan[i+1]]=[state.pagePlan[i+1],state.pagePlan[i]];pageIndex=i+1;scheduleRender();},i===pages.length-1);
 action('×',page.isAuto?'برای حفظ متن اصلی، صفحهٔ خودکار حذف نمی‌شود':'حذف صفحهٔ دستی',()=>{state.manualPages=state.manualPages.filter(m=>`manual:${m.id}`!==page.key);state.pagePlan=state.pagePlan.filter(k=>k!==page.key);pageIndex=clamp(i-1,0,pages.length-2);scheduleRender();},page.isAuto);
 item.append(actions);gallery.append(item);});}
$('#openPagesBtn').onclick=()=>{paginate();showDialog('#pagesDialog');refreshPageGallery();};
$('#addPageBtn').onclick=()=>{const id=String(Date.now())+Math.random().toString(36).slice(2,6);state.manualPages.push({id,lines:[],height:370,question:'',answer:''});state.pagePlan.splice(pageIndex+1,0,`manual:${id}`);pageIndex++;scheduleRender();};
// Restore the interview editor just like other WoSoCenter tools, where storage is permitted.
try{const saved=JSON.parse(localStorage.getItem(INTERVIEW_HISTORY_STORE)||'null');if(saved?.current?.state&&typeof saved.current.question==='string'&&typeof saved.current.answer==='string'){
 const parsed=JSON.parse(saved.current.state);if(parsed&&typeof parsed==='object'&&Array.isArray(parsed.stripes)&&parsed.stripes.length===6){
 state={...DEFAULT,...parsed};state.photo={...DEFAULT.photo,...parsed.photo};state.manualPages=Array.isArray(parsed.manualPages)?parsed.manualPages:[];state.pagePlan=Array.isArray(parsed.pagePlan)?parsed.pagePlan:[];
 $('#questionEditor').innerHTML=cleanRich(saved.current.question);$('#answerEditor').innerHTML=cleanRich(saved.current.answer);
 if(typeof state.photoSrc==='string'&&(state.photoSrc.startsWith('data:image/')||state.photoSrc.startsWith('assets/interview/')))loadPhoto(state.photoSrc);
 if(Array.isArray(saved.entries)&&saved.entries.length&&saved.entries.length<=200){history=saved.entries.map(h=>({data:h.data,key:snapshotKey(h.data),label:h.label||'ویرایش طرح',at:new Date(h.at||Date.now())}));historyPosition=clamp(saved.index,0,history.length-1);}
 }} }catch(e){console.warn('Interview draft restore unavailable',e);}
refreshControls();paginate();if(!history.length){history=[{data:snapshot(),key:snapshotKey(snapshot()),label:'شروع پروژه',at:new Date()}];historyPosition=0;}
historyReady=true;refreshHistoryUI();document.fonts.ready.then(scheduleRender);scheduleRender();
})();
