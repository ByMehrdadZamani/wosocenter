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
