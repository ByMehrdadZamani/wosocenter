/* WoSoCenter v6.1 — unified two-quality PNG for posters and page galleries. */
(() => {
 'use strict';
 let dialog=null,token=0,session=null;
 const $=s=>document.querySelector(s);
 const faNumber=n=>Number(n).toLocaleString('fa-IR');
 const prettyBytes=b=>b>=1048576?(b/1048576).toLocaleString('fa-IR',{maximumFractionDigits:2})+' مگابایت':Math.ceil(b/1024).toLocaleString('fa-IR')+' کیلوبایت';
 const toPNG=c=>new Promise((res,rej)=>{try{c.toBlob(b=>b?res(b):rej(Error('مرورگر نتوانست PNG ایجاد کند')),'image/png')}catch(e){rej(e)}});
 const currentTool=()=>location.pathname.includes('lineup')?'Lineup':location.pathname.includes('interview')?'Interview':location.pathname.includes('standings')?'Standings':'Fixture';
 function mount(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.id='wosoSharedDownloadDialog';dialog.className='picker-dialog s-dialog s-download-dialog woso-shared-download';dialog.setAttribute('aria-label','انتخاب کیفیت خروجی');
  dialog.innerHTML=`<div class="dialog-head"><div><h2 id="wosoDownloadTitle">کیفیت خروجی پوستر</h2><p>دو اندازه واقعی PNG با کیفیت چاپ و انتشار</p></div><button type="button" class="dialog-close" data-export-close aria-label="بستن">×</button></div>
   <div class="s-download-options"><button class="s-download-choice recommended" type="button" data-export-quality="2" disabled><span class="s-download-badge">✦ پیشنهادی</span><strong>دانلود با کیفیت بالا</strong><span dir="ltr">2160 × 2700 px</span><small data-export-size="2">در حال محاسبه حجم…</small></button>
   <button class="s-download-choice" type="button" data-export-quality="1" disabled><span class="s-download-badge compact">حجم کمتر</span><strong>دانلود با حجم بهینه</strong><span dir="ltr">1080 × 1350 px</span><small data-export-size="1">در حال محاسبه حجم…</small></button></div>
   <p class="hint compact" data-export-status role="status" aria-live="polite">برای انتخاب یکی از دو کیفیت صبر کن.</p>`;
  document.body.append(dialog);
  $('[data-export-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>{token++;session=null});
  dialog.querySelectorAll('[data-export-quality]').forEach(btn=>btn.addEventListener('click',()=>downloadQuality(+btn.dataset.exportQuality)));
 }
 function fileName(key,scale){const n=typeof key==='number'?String(key+1).padStart(2,'0'):'',kind=currentTool();return `WoSoCenter-${kind}${n?'-Page-'+n:''}-${scale===2?'HQ':'Compact'}-${Date.now()}.png`}
 function saveBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000)}
 function pageKeys(request){if(!request)return null;if(request.kind==='single')return [request.key];const count=Math.min(80,Math.max(0,Number(window.wosoPageCount?.())||0));return Array.from({length:count},(_,i)=>i)}
 async function render(key,scale){const c=key===null?await window.wosoGenerateExport(scale):await window.wosoGeneratePageExport(key,scale);if(!c||c.width!==1080*scale||c.height!==1350*scale)throw Error('اندازه تصویر خروجی مطابق قالب نیست.');return c}
 async function makeBlob(key,scale){const canvas=await render(key,scale);try{return await toPNG(canvas)}finally{canvas.width=canvas.height=1}}
 async function openChooser(request=null){
  mount();const pages=pageKeys(request);if(pages&&(!pages.length||typeof window.wosoGeneratePageExport!=='function')){alert('دریافت صفحات هنوز آماده نیست. صفحه را یک بار بازخوانی کن.');return}
  if(!pages&&typeof window.wosoGenerateExport!=='function'){alert('سازنده خروجی هنوز آماده نیست. صفحه را دوباره بارگذاری کن.');return}
  if(dialog.open)dialog.close();dialog.showModal();const t=++token;
  const keys=pages||[null],all=keys.length>1;
  session={keys,cached:{},busy:false};
  $('#wosoDownloadTitle').textContent=all?`دانلود ${faNumber(keys.length)} صفحه`:request?'دانلود این صفحه':'کیفیت خروجی پوستر';
  dialog.querySelector('[data-export-status]').textContent=all?'اندازه‌های زیر مربوط به یک صفحه نمونه هستند؛ هر صفحه به صورت فایل جداگانه دانلود می‌شود.':'در حال محاسبه حجم واقعی هر کیفیت…';
  dialog.querySelectorAll('[data-export-quality]').forEach(b=>b.disabled=true);
  dialog.querySelectorAll('[data-export-size]').forEach(el=>el.textContent='در حال محاسبه حجم…');
  try{
    const small=await makeBlob(keys[0],1);if(t!==token||!dialog.open)return;
    const big=await makeBlob(keys[0],2);if(t!==token||!dialog.open)return;
    session.cached={'1':small,'2':big};
    for(const [scale,blob] of [['1',small],['2',big]]){
      dialog.querySelector(`[data-export-size="${scale}"]`).textContent=(all?'نمونه یک صفحه: ':'')+prettyBytes(blob.size);
    }
    dialog.querySelectorAll('[data-export-quality]').forEach(b=>b.disabled=false);
    if(!all)dialog.querySelector('[data-export-status]').textContent='حجم‌های نمایش‌داده‌شده، اندازه واقعی همین پوستر هستند.';
  }catch(err){console.error('WoSo export',err);if(t===token)dialog.querySelector('[data-export-status]').textContent='خطا در آماده‌سازی: '+(err?.message||'نامشخص')}
 }
 async function downloadQuality(scale){
  const s=session;if(!s||s.busy||!s.cached?.[scale])return;
  s.busy=true;dialog.querySelectorAll('[data-export-quality]').forEach(b=>b.disabled=true);const t=token;
  try{
    for(let i=0;i<s.keys.length;i++){
      if(t!==token||!dialog.open)break;
      dialog.querySelector('[data-export-status]').textContent=`ساخت فایل ${faNumber(i+1)} از ${faNumber(s.keys.length)}…`;
      const blob=i===0?s.cached[scale]:await makeBlob(s.keys[i],scale);
      if(t!==token||!dialog.open)break;
      saveBlob(blob,fileName(s.keys[i],scale));
      if(i<s.keys.length-1)await new Promise(r=>setTimeout(r,350));
    }
    if(t===token&&dialog.open){dialog.querySelector('[data-export-status]').textContent='دانلود انجام شد. در صورت درخواست مرورگر، اجازه دانلود چند فایل را بده.';dialog.close()}
  }catch(err){console.error(err);if(t===token)dialog.querySelector('[data-export-status]').textContent='خطای دانلود: '+(err?.message||'نامشخص')}
  finally{if(dialog.open)dialog.querySelectorAll('[data-export-quality]').forEach(b=>b.disabled=false);s.busy=false}
 }
 function requestFromClick(target){
  if(target.closest('#lineupPageDownloadAll,#downloadAllPages,#downloadAllPagesBtn'))return {kind:'all'};
  const a=target.closest('[data-lpage-download]');if(a)return {kind:'single',key:Number(a.dataset.lpageDownload)};
  const b=target.closest('[data-page-download]');if(b)return {kind:'single',key:location.pathname.includes('fixture')?b.dataset.pageDownload:Number(b.dataset.pageDownload)};
  const interview=target.closest('#pageGallery .page-actions button:first-child');if(interview){const tile=interview.closest('.page-tile');if(tile){const tiles=[...tile.parentElement.children];return {kind:'single',key:tiles.indexOf(tile)}}}
  return null;
 }
 function init(){mount();document.addEventListener('click',e=>{
   if(!(e.target instanceof Element))return;
   const request=requestFromClick(e.target);
   if(request){e.preventDefault();e.stopImmediatePropagation();void openChooser(request);return}
   // Preserve the existing, fully featured standings main download dialog.
   if(location.pathname.includes('standings'))return;
   if(e.target.closest('#lineupDownload,#downloadBtn,#downloadBtnBottom,#downloadTop')){
     e.preventDefault();e.stopImmediatePropagation();void openChooser(null);
   }
 },true)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.wosoOpenDownloadChooser=openChooser;
})();

/* WoSoCenter reliable-image layer — direct-upload edition, 2026-11.
 * This existing shared script is loaded AFTER each editor's own script.
 * Preserve the download code above. No new CDN, server, or deployment step.
 */
(() => {
 'use strict';
 if(window.wosoReliableImages202611)return;
 window.wosoReliableImages202611=true;
 const delay=ms=>new Promise(done=>setTimeout(done,ms));
 const visiblePath=location.pathname;

 if(visiblePath.includes('fixture') && typeof window.preload==='function' &&
    typeof images!=='undefined' && typeof patterns!=='undefined'){
   const inflight=new Map(),failed=new Map();
   const MAX_ATTEMPTS=3,MAX_LOAD_MS=20000;
   const selectedPattern=()=>findPattern(state.patternId)||patterns[0];
   const currentPatternMatches=src=>selectedPattern()?.image===src;
   const syncSelected=src=>{if(currentPatternMatches(src))window.syncPattern?.()};
   const loadOnce=src=>new Promise(resolve=>{
     const img=new Image();img.decoding='async';
     let finished=false;
     const deadline=setTimeout(()=>finish(null),MAX_LOAD_MS);
     function finish(result){
       if(finished)return;
       finished=true;clearTimeout(deadline);
       img.onload=null;img.onerror=null;
       if(!result)img.removeAttribute('src');
       resolve(result);
     }
     img.onload=()=>finish(img.naturalWidth>0?img:null);
     img.onerror=()=>finish(null);
     img.src=src;
   });
   window.preload=function(src,{force=false}={}){
     if(!src)return Promise.resolve(false);
     if(images.get(src))return Promise.resolve(true);
     if(inflight.has(src))return inflight.get(src);
     const previous=failed.get(src);
     if(!force&&previous&&previous.retryAt>Date.now())return Promise.resolve(false);
     const job=(async()=>{
       for(let attempt=0;attempt<MAX_ATTEMPTS;attempt++){
         const image=await loadOnce(src);
         if(image){
           images.set(src,image);failed.delete(src);
           // Unrelated images should not invalidate expensive recoloring caches.
           for(const key of tinted.keys())if(key.startsWith(src+'|'))tinted.delete(key);
           for(const key of hueCache.keys())if(key.startsWith('hsv|'+src+'|'))hueCache.delete(key);
           syncSelected(src);queueRender();
           return true;
         }
         if(attempt<MAX_ATTEMPTS-1)await delay(400*(2**attempt));
       }
       const count=Math.min(4,(failed.get(src)?.count||0)+1);
       failed.set(src,{count,retryAt:Date.now()+Math.min(30000,1500*(2**count))});
       console.warn('WoSoCenter: image unavailable; retry supported:',src);
       if(currentPatternMatches(src)){
         syncSelected(src);
         message('بارگذاری پترن انجام نشد؛ دوباره انتخابش کن یا اتصال را بررسی کن.','warning');
       }
       return false;
     })().finally(()=>{inflight.delete(src);syncSelected(src)});
     inflight.set(src,job);syncSelected(src);
     return job;
   };

   // A lightweight, independent thumbnail is enough for the 43px picker.
   // In particular, never download the high-resolution image just for the picker.
   window.syncPattern=function(){
     const p=selectedPattern();if(!p)return;
     if(state.patternId!==p.id)state.patternId=p.id;
     const sample=document.getElementById('patternSample');
     const thumbnail=p.thumb||p.image;
     const retryThumb=sample?.dataset.thumbError==='1' &&
       Number(sample.dataset.thumbRetryAt||0)<Date.now();
     if(sample&&(sample.dataset.source!==thumbnail||retryThumb)){
       sample.dataset.source=thumbnail;
       sample.dataset.thumbError='0';
       sample.textContent='';
       const img=document.createElement('img');
       img.alt='';img.loading='eager';img.decoding='async';
       img.onload=()=>{if(sample.contains(img))sample.dataset.thumbError='0'};
       img.onerror=()=>{
         if(!sample.contains(img))return;
         sample.dataset.thumbError='1';
         sample.dataset.thumbRetryAt=String(Date.now()+3000);
         img.remove();sample.textContent='▧';
       };
       img.src=thumbnail;sample.append(img);
     }
     const status=failed.get(p.image);
     const failedNow=Boolean(status&&!inflight.has(p.image)&&!images.get(p.image));
     const loading=Boolean(!failedNow&&!images.get(p.image));
     document.getElementById('patternName').textContent=p.name+(failedNow?' · بارگذاری ناموفق':loading?' · در حال بارگذاری…':'');
     const toggle=document.getElementById('patternTintToggle');
     const recolorable=p.mode==='mask'||p.mode==='hue';
     const enabled=p.mode==='mask'||(p.mode==='hue'&&state.patternTintEnabled);
     toggle.checked=enabled;toggle.disabled=p.mode!=='hue';
     document.getElementById('patternColorPicker').hidden=!recolorable||!enabled;
     document.getElementById('patternTintHint').textContent=
       p.mode==='mask'?'این پترن همیشه با رنگ انتخابی شما نمایش داده می‌شود.':
       p.mode==='image'?'این تصویر فقط با رنگ اصلی نمایش داده می‌شود.':
       enabled?'بخش‌های رنگی پترن دقیقاً با رنگ انتخابی نمایش داده می‌شوند؛ سایه‌ها حفظ می‌شوند.':'رنگ اصلی تصویر نمایش داده می‌شود.';
   };

   // Never silently export a poster with its selected background image missing.
   if(typeof window.wosoGenerateExport==='function'){
     const originalExport=window.wosoGenerateExport;
     window.wosoGenerateExport=async function(scale){
       const src=selectedPattern()?.image;
       if(src&&!(await preload(src,{force:true})))
         throw Error('پترن پس‌زمینه بارگذاری نشد. اتصال را بررسی و دوباره تلاش کن.');
       return originalExport(scale);
     };
   }
   if(typeof window.wosoGeneratePageExport==='function'){
     const originalPageExport=window.wosoGeneratePageExport;
     window.wosoGeneratePageExport=async function(index,scale){
       const page=typeof index==='string'?project.pages.find(p=>p.id===index):project.pages[Number(index)];
       const pattern=findPattern(page?.data?.patternId)||patterns[0];
       if(pattern?.image&&!(await preload(pattern.image,{force:true})))
         throw Error('پترن یکی از صفحات بارگذاری نشد. اتصال را بررسی و دوباره تلاش کن.');
       return originalPageExport(index,scale);
     };
   }

   // Concurrent preview-page generation; all original poster drawing is retained.
   if(typeof window.refreshPageThumbs==='function')window.refreshPageThumbs=async function(){
     const requestId=++thumbRefreshId;
     const dialog=document.getElementById('pagesDialog');
     const pages=project.pages.slice();let cursor=0;
     const workers=Math.min(2,pages.length);
     const work=async()=>{
       while(cursor<pages.length){
         if(requestId!==thumbRefreshId||!dialog.open)return;
         const page=pages[cursor++];
         const canvas=[...document.querySelectorAll('#pageTabs canvas[data-thumb-id]')]
           .find(x=>x.dataset.thumbId===page.id);
         if(!canvas)continue;
         resizePageThumb(canvas);drawPoster(canvas,page.data);
         try{
           const fonts=new Set([page.data.dayFont,page.data.dateFont,page.data.footerFont,
             ...page.data.matches.flatMap(m=>[m.leagueFont,m.timeFont])]);
           await Promise.all([preloadForPage(page.data),loadFontFamilies([...fonts])]);
         }catch(e){console.warn('WoSoCenter page preview resources',e)}
         if(requestId!==thumbRefreshId||!dialog.open)return;
         drawPoster(canvas,page.data);
       }
     };
     await Promise.all(Array.from({length:workers},()=>work()));
   };

   // Choosing an already failed image is a deliberate request to retry now.
   document.addEventListener('click',event=>{
     const button=event.target instanceof Element?event.target.closest('[data-asset-id]'):null;
     if(!button||pickContext?.kind!=='patternId')return;
     const pattern=patterns.find(p=>p.id===button.dataset.assetId);
     if(pattern)void preload(pattern.image,{force:true});
   },true);
   window.addEventListener('online',()=>{
     const src=selectedPattern()?.image;
     if(src&&!images.get(src))void preload(src,{force:true});
     const sample=document.getElementById('patternSample');
     if(sample?.dataset.thumbError==='1')sample.dataset.thumbRetryAt='0';
     window.syncPattern();
   });
 }

 if(visiblePath.includes('lineup') && typeof window.lImage==='function' &&
    typeof lImgCache!=='undefined'){
   const failures=new Map();
   window.lImage=function(src){
     if(!src)return null;
     let record=lImgCache.get(src);
     if(record){
       if(!record.error)return record.image;
       if(Date.now()<record.retryAfter)return null;
       lImgCache.delete(src);
     }
     const prior=failures.get(src)||0;
     record={image:new Image(),loaded:false,error:false,retryAfter:0};
     lImgCache.set(src,record);
     const image=record.image;image.decoding='async';
     image.onload=()=>{
       if(lImgCache.get(src)!==record)return;
       record.loaded=true;record.error=false;failures.delete(src);
       lRender();
       if(L('lineupPagesDialog')?.open){clearTimeout(lThumbnailTimer);lThumbnailTimer=setTimeout(lPageDialogRender,250)}
     };
     image.onerror=()=>{
       if(lImgCache.get(src)!==record)return;
       record.error=true;
       const count=Math.min(3,prior+1);failures.set(src,count);
       const pause=count<3?650*(2**(count-1)):30000;
       record.retryAfter=Date.now()+pause;
       if(count<3)setTimeout(()=>{
         if(lImgCache.get(src)!==record)return;
         lImgCache.delete(src);window.lImage(src);lRender();
       },pause);
       lRender();
       console.warn('WoSoCenter lineup image unavailable:',src);
     };
     image.src=src.startsWith('assets/players/lineup-calibrated/arsenal-')?src+'?v=6.11':src;
     return image;
   };
   document.addEventListener('click',event=>{
     const button=event.target instanceof Element?event.target.closest('[data-lpattern]'):null;
     if(!button||lPatternType!=='graphic')return;
     const pattern=lPatterns.find(p=>p.id===button.dataset.lpattern);
     if(pattern&&lImgCache.get(pattern.image)?.error){
       lImgCache.delete(pattern.image);failures.delete(pattern.image);
     }
   },true);
   window.addEventListener('online',()=>{
     const pattern=lPatterns.find(p=>p.id===lState.backgroundPatternId);
     if(lState.backgroundPatternType==='graphic'&&pattern&&!lImgCache.get(pattern.image)?.loaded){
       lImgCache.delete(pattern.image);failures.delete(pattern.image);
       window.lImage(pattern.image);lRender();
     }
   });
 }

 if(visiblePath.includes('standings') && typeof window.imageRecord==='function' &&
    typeof imgCache!=='undefined'){
   const failures=new Map();
   window.imageRecord=function(src){
     if(!src)return null;
     let record=imgCache.get(src);
     if(record){
       if(record.status!=='error'||Date.now()<record.retryAfter)return record;
       imgCache.delete(src);
     }
     const prior=failures.get(src)||0;
     record={status:'loading',img:new Image(),retryAfter:0};
     imgCache.set(src,record);
     const image=record.img;image.decoding='async';
     image.onload=()=>{
       if(imgCache.get(src)!==record)return;
       record.status='ok';failures.delete(src);drawSoon();
       if(document.getElementById('pagesDialog')?.open)renderPages();
     };
     image.onerror=()=>{
       if(imgCache.get(src)!==record)return;
       record.status='error';
       const count=Math.min(3,prior+1);failures.set(src,count);
       const pause=count<3?700*(2**(count-1)):30000;
       record.retryAfter=Date.now()+pause;
       if(count<3)setTimeout(()=>{
         if(imgCache.get(src)!==record)return;
         imgCache.delete(src);window.imageRecord(src);drawSoon();
       },pause);
       drawSoon();console.warn('WoSoCenter standings image unavailable:',src);
     };
     image.src=src;return record;
   };
   document.addEventListener('click',event=>{
     const button=event.target instanceof Element?event.target.closest('[data-pattern-id]'):null;
     if(!button)return;
     const pattern=patterns.find(p=>p.id===button.dataset.patternId);
     if(pattern&&imgCache.get(pattern.image)?.status==='error'){
       imgCache.delete(pattern.image);failures.delete(pattern.image);
     }
   },true);
   window.addEventListener('online',()=>{
     const pattern=patterns.find(p=>p.id===state.patternId);
     if(pattern&&imgCache.get(pattern.image)?.status!=='ok'){
       imgCache.delete(pattern.image);failures.delete(pattern.image);
       window.imageRecord(pattern.image);drawSoon();
     }
   });
 }
})();
