/* WoSoCenter shared download dialog — fixture, lineup, interview; no external libraries. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 let dialog, sequence = 0, prepared = null;
 const sizes = bytes => bytes >= 1048576
   ? (bytes / 1048576).toLocaleString('fa-IR',{maximumFractionDigits:2})+' مگابایت'
   : Math.ceil(bytes / 1024).toLocaleString('fa-IR')+' کیلوبایت';
 const toBlob = canvas => new Promise((resolve,reject) => {
   canvas.toBlob(b => b ? resolve(b) : reject(Error('مرورگر نتوانست PNG تولید کند.')),'image/png');
 });
 function mount() {
   if ($('wosoSharedDownloadDialog')) return;
   dialog = document.createElement('dialog');
   dialog.id = 'wosoSharedDownloadDialog';
   dialog.className = 'picker-dialog s-dialog s-download-dialog woso-shared-download';
   dialog.setAttribute('aria-label','انتخاب کیفیت خروجی');
   dialog.innerHTML = `<div class="dialog-head"><div><h2>کیفیت خروجی پوستر</h2><p>همان تصویر با دو وضوح مختلف؛ حجم واقعی PNG محاسبه می‌شود.</p></div><button type="button" class="dialog-close" data-woso-export-close aria-label="بستن">×</button></div>
    <div class="s-download-options">
     <button class="s-download-choice recommended" type="button" data-woso-export-scale="2" disabled><span class="s-download-badge">✦ پیشنهادی</span><strong>دانلود با کیفیت بالا</strong><span dir="ltr">2160 × 2700 px</span><small data-woso-size="2">در حال محاسبه حجم…</small></button>
     <button class="s-download-choice" type="button" data-woso-export-scale="1" disabled><span class="s-download-badge compact">حجم کمتر</span><strong>دانلود با حجم بهینه</strong><span dir="ltr">1080 × 1350 px</span><small data-woso-size="1">در حال محاسبه حجم…</small></button>
    </div><p class="hint compact" data-woso-hint aria-live="polite">هر دو خروجی با فرمت PNG هستند.</p>`;
   document.body.append(dialog);
   dialog.querySelector('[data-woso-export-close]').addEventListener('click',() => dialog.close());
   dialog.addEventListener('click',e => {if(e.target===dialog)dialog.close();});
   dialog.addEventListener('close',() => {sequence++;prepared=null;});
   dialog.querySelectorAll('[data-woso-export-scale]').forEach(button => button.addEventListener('click',() => {
     const scale=button.dataset.wosoExportScale, blob=prepared?.[scale];
     if(!blob || !dialog.open) return;
     const a=document.createElement('a'),url=URL.createObjectURL(blob);
     a.href=url;a.download=`WoSoCenter-${location.pathname.includes('lineup')?'Lineup':location.pathname.includes('interview')?'Interview':'Fixture'}-${scale}x-${Date.now()}.png`;
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
     dialog.close();
   }));
 }
 async function openPicker(){
   if(typeof window.wosoGenerateExport!=='function') {
     alert('سازنده خروجی هنوز آماده نشده است. لطفاً صفحه را یک بار تازه‌سازی کن.');return;
   }
   if(!dialog)mount();if(!dialog.open)dialog.showModal();const seq=++sequence;
   prepared=null;dialog.querySelector('[data-woso-hint]').textContent='در حال آماده‌سازی هر دو کیفیت…';
   dialog.querySelectorAll('[data-woso-export-scale]').forEach(b=>b.disabled=true);
   dialog.querySelectorAll('[data-woso-size]').forEach(el=>el.textContent='در حال محاسبه حجم…');
   try{
     const lowCanvas=await window.wosoGenerateExport(1);
     const low=await toBlob(lowCanvas);lowCanvas.width=lowCanvas.height=1;
     if(seq!==sequence||!dialog.open)return;
     const highCanvas=await window.wosoGenerateExport(2);
     const high=await toBlob(highCanvas);highCanvas.width=highCanvas.height=1;
     if(seq!==sequence||!dialog.open)return;
     prepared={'1':low,'2':high};
     dialog.querySelector('[data-woso-size="1"]').textContent=sizes(low.size);
     dialog.querySelector('[data-woso-size="2"]').textContent=sizes(high.size);
     dialog.querySelectorAll('[data-woso-export-scale]').forEach(b=>b.disabled=false);
     dialog.querySelector('[data-woso-hint]').textContent='حجم هر گزینه بر اساس پوستر فعلی اندازه‌گیری شده است.';
   }catch(err){if(seq===sequence&&dialog.open)dialog.querySelector('[data-woso-hint]').textContent='خطای آماده‌سازی: '+(err?.message||'ناشناخته');console.error('WoSo export:',err)}
 }
 function initialize(){mount();document.addEventListener('click', e => {
   const target=e.target.closest?.('#lineupDownload,#downloadBtn,#downloadBtnBottom,#downloadTop');
   if(!target)return;
   // Do not change other buttons or individual/all-page download actions.
   e.preventDefault();e.stopImmediatePropagation();openPicker();
 },true);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
