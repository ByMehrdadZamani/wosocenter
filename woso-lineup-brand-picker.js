/* WoSoCenter lineup footer brand selector — independent of the main editor.
 * Two branded logos share the original 160×115 px poster slot, the existing
 * logoTint color control, undo/redo, page persistence and PNG export pipeline.
 */
(() => {
 'use strict';
 if ((location.pathname.split('/').pop() || '') !== 'lineup.html') return;
 if (window.__wosoLineupBrandPicker) return;
 window.__wosoLineupBrandPicker = true;

 const WOSO = 'assets/lineup/woso-emblem-full.png';
 const BARCA = 'assets/lineup/barca-femeni-logo-mask.webp';
 const choices = [
   { id: 'woso', name: 'WOSOCENTER', src: WOSO },
   { id: 'barca', name: 'Barca Femeni', src: BARCA }
 ];
 const $ = id => document.getElementById(id);
 const activeType = () => (typeof lState !== 'undefined' && lState?.bottomBrandLogo === 'barca') ? 'barca' : 'woso';
 const selectedLogo = () => choices.find(c => c.id === activeType()) || choices[0];
 const getPatternKey = () => typeof lState === 'undefined' || !lState ? '' :
   [lState.backgroundPatternType, lState.backgroundPatternType === 'graphic' ? lState.backgroundPatternId : lState.backgroundLogoId].join('|');

 const css = document.createElement('style');
 css.textContent = `
 .lineup-brand-choose{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;margin:11px 0 12px;
   background:var(--input,#241b35);color:var(--text,#fff);border:1px solid var(--edge,#544769);
   border-radius:12px;text-align:right;cursor:pointer;font-family:inherit;min-height:82px}
 .lineup-brand-choose:hover,.lineup-brand-choose:focus-visible{border-color:var(--violet,#ad73ea);outline-offset:2px}
 .lineup-brand-choose .lineup-brand-thumb{display:grid;place-items:center;flex:none;width:83px;height:62px;
   border-radius:9px;background:#18162d;overflow:hidden}
 .lineup-brand-thumb img{width:75px;height:53px;object-fit:contain}
 .lineup-brand-choose .lineup-brand-caption{display:grid;gap:5px;flex:1;min-width:0}
 .lineup-brand-choose .lineup-brand-caption strong{font-size:12px;line-height:1.5}
 .lineup-brand-choose .lineup-brand-caption small{font-size:10px;color:var(--muted,#b8b0cc);line-height:1.6}
 .lineup-brand-choose .lineup-brand-arrow{font-size:12px;color:var(--violet,#c69cf9);white-space:nowrap}
 .lineup-brand-hint{font-size:11px;line-height:1.85;margin:3px 0 9px;color:var(--muted,#b8b0cc)}
 .lineup-brand-dialog{width:min(520px,calc(100vw - 24px));max-height:85dvh;overflow:auto;
   padding:20px;background:var(--panel,#1b1529);color:var(--text,#fff);border:1px solid var(--edge,#544769);
   border-radius:16px;box-shadow:0 16px 70px rgba(0,0,0,.5)}
 .lineup-brand-dialog:not([open]){display:none}
 .lineup-brand-dialog::backdrop{background:rgba(0,0,0,.7)}
 .lineup-brand-dialog-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}
 .lineup-brand-dialog-header h2{margin:0 0 6px;font-size:17px}
 .lineup-brand-dialog-header p{margin:0;font-size:11px;color:var(--muted,#b8b0cc);line-height:1.7}
 .lineup-brand-close{border:1px solid var(--edge,#544769);border-radius:10px;background:var(--input,#241b35);
   color:var(--text,#fff);font-size:20px;width:34px;height:34px;cursor:pointer;flex:none}
 .lineup-brand-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
 .lineup-brand-option{position:relative;display:grid;justify-items:center;align-content:center;gap:10px;
   padding:13px 8px;min-height:154px;border:2px solid var(--edge,#544769);border-radius:12px;
   background:var(--input,#241b35);color:var(--text,#fff);font-family:inherit;cursor:pointer}
 .lineup-brand-option img{width:119px;max-width:100%;height:91px;object-fit:contain;
   background:#18162d;border-radius:8px;padding:8px}
 .lineup-brand-option strong{font-size:12px}
 .lineup-brand-option[aria-pressed="true"]{border-color:#20b86b;background:color-mix(in srgb,#20b86b 9%,var(--input,#241b35))}
 .lineup-brand-option .lineup-brand-check{position:absolute;top:7px;right:7px;color:#20b86b;font-size:15px;font-weight:900}
 .lineup-brand-option[aria-pressed="false"] .lineup-brand-check{display:none}
 @media(max-width:420px){.lineup-brand-dialog{padding:13px}.lineup-brand-option{min-height:136px;padding:9px 5px}
 .lineup-brand-option img{height:78px}.lineup-brand-choose{gap:8px;padding:9px}}
 `;
 document.head.append(css);

 let button, thumbnail, currentName, modal;
 const tintCache = {woso: null, barca: null};

 function makeTinted(img, color, id) {
   const item = tintCache[id];
   if (item && item.image === img && item.color === color) return item.canvas;
   const canvas = document.createElement('canvas');
   canvas.width = img.naturalWidth;
   canvas.height = img.naturalHeight;
   const ctx = canvas.getContext('2d');
   ctx.drawImage(img, 0, 0);
   ctx.globalCompositeOperation = 'source-in';
   ctx.fillStyle = color;
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   tintCache[id] = {image:img, color, canvas};
   return canvas;
 }

 // Preserve all existing footer positions and rendering, replacing only the
 // logo source. Every PNG, page thumbnail and live preview calls this function.
 lFooter = function () {
   const c = lCtx, s = lState, col = s.colors;
   if (s.channel.trim()) {
     lPlane(70, 1185, .8, col.channelText);
     lText(s.channel, 167, 1186, 24, {color:col.channelText,dir:'ltr',font:s.fonts.channel,maxWidth:165});
   }
   if (s.stadium.trim()) {
     lDashes(35, 1215, 219, 56, col.stadiumText);
     lStadium(210, 1237, col.stadiumText);
     lText(s.stadium, 121, 1244, 21, {color:col.stadiumText,font:s.fonts.stadium,maxWidth:158,minSize:13});
   }
   const id = activeType(), logo = id === 'barca' ? BARCA : WOSO;
   const emblem = lReady(logo);
   if (emblem) {
     const mask = makeTinted(emblem, col.logoTint, id);
     // Same original poster rectangle: x=857, y=1070, 160×115.
     // Keep the shield's original aspect ratio within that rectangle.
     if (id === 'barca') {
       const fit = Math.min(160 / mask.width, 115 / mask.height);
       const w = mask.width * fit, h = mask.height * fit;
       c.drawImage(mask, 857 + (160 - w) / 2, 1070 + (115 - h) / 2, w, h);
     } else c.drawImage(mask, 857, 1070, 160, 115);
   } else {
     lImage(logo);
     lText(id === 'barca' ? 'Barca Femeni' : 'WoSoCenter', 942, 1144, 25,
       {color:col.logoTint,dir:'ltr'});
   }
   if (s.coach.trim()) {
     lFillRounded(c, 828, 1215, 220, 54, 14, col.footerBox);
     lPerson(1015, 1239, col.coachText);
     lText(s.coach, 915, 1242, 22,
       {color:lLegible(col.coachText,col.footerBox,col.coachText),font:s.fonts.coach,maxWidth:139,minSize:12});
   }
 };

 // When selecting a different background pattern, adapt JUST the brand tint to
 // that pattern's suggested palette. Manual tint edits remain free until the
 // next pattern/palette selection. This is part of the same undoable change.
 const originalChange = lChange;
 lChange = function (change, options) {
   const before = getPatternKey();
   return originalChange.call(this, () => {
     change();
     if (getPatternKey() !== before) {
       const suggestion = lSuggestedPatternPalette();
       const suggestedColor = suggestion?.accent || lState.colors.accent;
       if (/^#[0-9a-f]{6}$/i.test(suggestedColor || '')) lState.colors.logoTint = suggestedColor;
     }
   }, options);
 };

 // Existing palette picks already update colors.logoTint through lApplyPalette.
 // Also wait for the added optimized asset on all PNG export paths.
 const originalWait = lWaitResources;
 lWaitResources = async function (...args) {
   const pending = activeType() === 'barca' ? waitForImage(BARCA) : Promise.resolve();
   await Promise.all([originalWait.apply(this, args), pending]);
 };
 function waitForImage(src) {
   const img = lImage(src);
   if (!img || img.complete) return Promise.resolve();
   return Promise.race([
     new Promise(resolve => {
       img.addEventListener('load', resolve, {once:true});
       img.addEventListener('error', resolve, {once:true});
     }),
     new Promise(resolve => setTimeout(resolve, 5000))
   ]);
 }

 function refresh() {
   if (!button) return;
   const logo = selectedLogo();
   thumbnail.src = logo.src;
   thumbnail.alt = logo.name;
   currentName.textContent = logo.name + ' · تغییر لوگو';
   for (const option of modal.querySelectorAll('[data-brand-choice]')) {
     const selected = option.dataset.brandChoice === logo.id;
     option.setAttribute('aria-pressed', String(selected));
   }
 }
 const originalSync = lSync;
 lSync = function (...args) {
   const result = originalSync.apply(this, args);
   refresh();
   return result;
 };

 function mount() {
   const title = [...document.querySelectorAll('#ltab-footer .settings-group > h2')]
     .find(el => el.textContent.trim() === 'لوگوی ووسو سنتر');
   const group = title?.parentElement;
   if (!group || $('lineupBrandChoose')) return;

   button = document.createElement('button');
   button.id = 'lineupBrandChoose';
   button.type = 'button';
   button.className = 'lineup-brand-choose';
   button.setAttribute('aria-haspopup', 'dialog');
   button.setAttribute('aria-label', 'انتخاب لوگوی پایین پوستر');
   button.innerHTML = `<span class="lineup-brand-thumb"><img id="lineupBrandThumbnail" alt=""></span>
     <span class="lineup-brand-caption"><strong>انتخاب لوگوی پایین پوستر</strong>
     <small id="lineupBrandCurrentName"></small></span>
     <span class="lineup-brand-arrow" aria-hidden="true">تغییر ◀</span>`;
   group.insertBefore(button, group.querySelector('label'));
   thumbnail = $('lineupBrandThumbnail');
   currentName = $('lineupBrandCurrentName');

   const hint = document.createElement('p');
   hint.className = 'lineup-brand-hint';
   hint.textContent = 'رنگ هر دو لوگو با انتخاب پالت یا پترن هماهنگ می‌شود؛ از گزینه رنگ زیر هم می‌توانید رنگ دلخواه انتخاب کنید.';
   group.append(hint);

   modal = document.createElement('dialog');
   modal.id = 'lineupBrandDialog';
   modal.className = 'lineup-brand-dialog';
   modal.setAttribute('aria-labelledby', 'lineupBrandDialogTitle');
   modal.innerHTML = `<div class="lineup-brand-dialog-header"><div>
     <h2 id="lineupBrandDialogTitle">انتخاب لوگوی پایین پوستر</h2>
     <p>لوگوی فعال با تیک سبز مشخص شده است.</p></div>
     <button class="lineup-brand-close" type="button" aria-label="بستن">×</button></div>
     <div class="lineup-brand-choices"></div>`;
   const grid = modal.querySelector('.lineup-brand-choices');
   for (const logo of choices) {
     const option = document.createElement('button');
     option.className = 'lineup-brand-option';
     option.type = 'button';
     option.dataset.brandChoice = logo.id;
     option.setAttribute('aria-pressed', 'false');
     const img = document.createElement('img');
     img.src = logo.src;
     img.alt = '';
     const name = document.createElement('strong');
     name.textContent = logo.name;
     const tick = document.createElement('span');
     tick.className = 'lineup-brand-check';
     tick.setAttribute('aria-hidden', 'true');
     tick.textContent = '✓';
     option.append(img, name, tick);
     option.addEventListener('click', () => {
       lChange(() => { lState.bottomBrandLogo = logo.id; });
       modal.close();
     });
     grid.append(option);
   }
   document.body.append(modal);
   button.addEventListener('click', () => { refresh(); modal.showModal(); });
   modal.querySelector('.lineup-brand-close').addEventListener('click', () => modal.close());
   modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
   refresh();
 }

 // Warm the tiny asset once; image cache and future exports reuse the same file.
 lImage(BARCA);
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
 else mount();
 lRender();
})();
