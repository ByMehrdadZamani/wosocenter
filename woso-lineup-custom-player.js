/* WoSoCenter Studio — session-only custom players; zero server uploads.
   Runs alongside existing lineup.js without replacing its drawing or save engine. */
(() => {
  'use strict';
  if (!/lineup\.html$/i.test(location.pathname)) return;
  const KEY = 'woso_custom_players_session_v1';
  const PREFIX = 'woso-session-player-';
  const $ = id => document.getElementById(id);
  const records = new Map();
  let creating = null, currentFileUrl = null, oldScale = 100, frameConfirmed = false;
  let initialized = false;
  let input;
  const notify = (message, bad=false) => {
    try { lNotify(message, bad?'error':undefined); } catch { console[bad?'error':'info'](message); }
  };
  function safeJson(x) { try { return JSON.parse(x||'[]'); } catch { return []; } }
  function persistSession(){
    try {
      const items=[...records.values()].filter(x=>x.imageData).map(({id,teamId,name,flag,positionGroup,imageData})=>({id,teamId,name,flag,positionGroup,imageData}));
      sessionStorage.setItem(KEY,JSON.stringify(items));return true;
    } catch { notify('تصویر فقط تا قبل از بستن یا تازه‌سازی این صفحه در دسترس است؛ فضای موقت مرورگر کافی نیست.','error');return false; }
  }
  const imageFileUrl = data => {
    const [header,value]=data.split(',');
    const mime=/^data:([^;]+);base64$/.exec(header)?.[1]||'image/webp';
    const bin=atob(value);const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes],{type:mime}));
  };
  function saveNewPlayer(row) {
    records.set(row.id,row);
    if (!lPlayers.some(p=>p.id===row.id)) lPlayers.unshift({id:row.id,teamId:row.teamId,name:row.name,flag:row.flag,positionGroup:row.positionGroup,category:'بازیکن دلخواه',position:'MID',image:row.url,pickerPortrait:row.url,thumb:row.url});
  }
  function refreshPlayerRecord(row){
    const p=lPlayers.find(x=>x.id===row.id);if(!p)return;
    Object.assign(p,{name:row.name,flag:row.flag,positionGroup:row.positionGroup,teamId:row.teamId,image:row.url,pickerPortrait:row.url,thumb:row.url});
  }
  function repairSlots(){
    const pages=Array.isArray(lPages)?lPages:[];
    const stateSlots=Array.isArray(lState?.slots)?lState.slots:[];
    const all=new Set([...stateSlots,...pages.flatMap(p=>p.data?.slots||[])]);
    let fixed=false;
    for(const slot of all){
      if(!slot||!String(slot.playerId||'').startsWith(PREFIX))continue;
      const item=records.get(slot.playerId);
      if(item){
        if(slot.image!==item.url){slot.image=item.url;slot.imageKey='';fixed=true;}
      }else{
        // A session-only image must never be replaced by a broken blob URL.
        slot.playerId='';slot.image='';slot.imageKey='';slot.faceFrame=null;fixed=true;
      }
    }
    if(fixed){lRender();lSave();}
  }
  function restoreSession(){
    let saved='[]';try{saved=sessionStorage.getItem(KEY)||'[]'}catch{}
    const entries=safeJson(saved);
    for(const row of entries){
      if(!row||!String(row.id||'').startsWith(PREFIX)||!/^data:image\/(png|webp|jpeg);base64,/.test(row.imageData||''))continue;
      try{const url=imageFileUrl(row.imageData);saveNewPlayer({...row,url});}catch(e){console.warn('Custom player restore skipped',e);}
    }
    repairSlots();
  }
  function prependCreateTile(){
    const grid=$('lineupPlayerGrid');if(!grid||grid.firstElementChild?.matches('[data-woso-create-player]'))return;
    const tile=document.createElement('button');tile.type='button';tile.className='woso-create-player-tile';tile.dataset.wosoCreatePlayer='';
    tile.innerHTML='<span class="woso-create-plus" aria-hidden="true">+</span><strong>ساخت بازیکن جدید</strong><small>بارگذاری عکس از گالری</small>';
    tile.addEventListener('click',()=>input.click());grid.prepend(tile);
  }
  async function normalizeFile(file){
    if(!file||!file.type.startsWith('image/'))throw Error('لطفاً یک عکس معتبر انتخاب کن.');
    if(file.size>18*1024*1024)throw Error('حجم عکس باید کمتر از ۱۸ مگابایت باشد.');
    const orig=URL.createObjectURL(file);const img=new Image();
    try{
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('مرورگر نتوانست این فرمت تصویر را باز کند.'));img.src=orig;});
      const max=1280,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);
      let blob=await new Promise((resolve,reject)=>c.toBlob(v=>v?resolve(v):reject(Error('ساخت تصویر موقت انجام نشد.')),'image/webp',.88));
      if(blob.type!=='image/webp')blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
      const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(Error('خواندن عکس انجام نشد.'));fr.readAsDataURL(blob);});
      const url=URL.createObjectURL(blob);c.width=c.height=1;return {url,imageData:data};
    }finally{URL.revokeObjectURL(orig);}
  }
  function setUploadMode(on){
    const dialog=$('lineupFaceDialog');const title=$('lineupFaceTitle');const save=$('lineupFaceSave');
    if(!dialog||!title||!save)return;
    title.textContent=on?'ساخت بازیکن جدید · تنظیم تصویر':'تنظیم چهره بازیکن در کارت';
    save.textContent=on?'✓ ساخت بازیکن':'✓ تأیید قاب‌بندی';
    dialog.classList.toggle('woso-upload-mode',on);
  }
  function addSizeControl(){
    const fields=$('lineupFaceDialog')?.querySelector('.lineup-face-fields');if(!fields||$('wosoFaceSize'))return;
    const label=document.createElement('label');label.className='woso-face-size-control';
    label.innerHTML='اندازه تصویر در کارت <output id="wosoFaceSizeValue">۱۰۰٪</output><input type="range" id="wosoFaceSize" min="70" max="145" step="1" value="100">';
    fields.prepend(label);
    $('wosoFaceSize').addEventListener('input',()=>{
      const val=Number($('wosoFaceSize').value);$('wosoFaceSizeValue').textContent=val.toLocaleString('fa-IR')+'٪';
      $('lineupPopupScale').value=String(val);$('lineupPopupScalePx').value=String(Math.round(val*1.8));
      lFacePreview();
    });
  }
  function syncSize(){
    const val=Math.max(70,Math.min(145,Math.round(Number($('lineupPopupScalePx').value||180)/1.8)));
    $('wosoFaceSize').value=String(val);$('wosoFaceSizeValue').textContent=val.toLocaleString('fa-IR')+'٪';
  }
  function moveStickyActions(){
    const dialog=$('lineupFaceDialog');const head=dialog?.querySelector('.dialog-head'),actions=dialog?.querySelector('.lineup-face-actions');
    if(!head||!actions||dialog.querySelector('.woso-face-top'))return;
    const top=document.createElement('div');top.className='woso-face-top';dialog.prepend(top);top.append(head,actions);
  }
  function cleanupProvisional(){
    const item=creating;if(!item||item.finalized)return;
    const i=lPlayers.findIndex(p=>p.id===item.id);if(i>=0)lPlayers.splice(i,1);
    try{URL.revokeObjectURL(item.url);}catch{}
    if(lPendingPlayerId===item.id){
      lPendingPlayerId=item.previousId;
      if(item.previousId&&lPlayers.some(p=>p.id===item.previousId))lUsePlayer(item.previousId);
      else {
        lPendingPlayerId=null;
        $('lineupPopupName').value=item.previousName;
        $('lineupPopupPosition').value=item.previousPosition;
        lPlayersDialogRender();
      }
    }
    creating=null;setUploadMode(false);
  }
  async function handleFile(file){
    if(!file)return;
    if(creating)cleanupProvisional();
    let img;try{img=await normalizeFile(file);}catch(e){notify(e.message,true);return;}
    const id=PREFIX+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    const previousId=lPendingPlayerId,previousName=$('lineupPopupName').value,previousPosition=$('lineupPopupPosition').value;
    const teamId=lState.teamId==='mixed'?'mixed':lState.teamId;
    const positionGroup=lPositionCategory(lSpotList()[lSelected]?.position||'MID');
    const row={id,teamId,name:'بازیکن جدید',flag:'es',positionGroup,url:img.url,imageData:img.imageData};
    lPlayers.unshift({id,teamId,name:row.name,flag:row.flag,positionGroup,category:'بازیکن دلخواه',position:'MID',image:row.url,pickerPortrait:row.url,thumb:row.url});
    creating={...row,previousId,previousName,previousPosition,finalized:false};
    lUsePlayer(id);
    $('lineupPopupScale').value='100';$('lineupPopupScalePx').value='180';
    setUploadMode(true);
    $('lineupFaceAdjust').click();
    syncSize();
  }
  function init(){
    if(initialized)return;
    if(typeof lLoaded==='undefined'||!lLoaded||!$('lineupPlayerGrid')||!$('lineupFaceDialog'))return;
    initialized=true;
    input=document.createElement('input');input.type='file';input.accept='image/*';input.hidden=true;input.id='wosoCustomPlayerFile';document.body.append(input);
    input.addEventListener('change',()=>{const file=input.files?.[0];input.value='';void handleFile(file)});
    const grid=$('lineupPlayerGrid');const obs=new MutationObserver(prependCreateTile);obs.observe(grid,{childList:true});prependCreateTile();
    addSizeControl();moveStickyActions();restoreSession();
    const faceDialog=$('lineupFaceDialog');
    $('lineupFaceAdjust').addEventListener('click',()=>{
      oldScale=Number($('lineupPopupScale').value)||100;frameConfirmed=false;syncSize();
      setUploadMode(!!creating);
    });
    $('lineupFaceSave').addEventListener('click',()=>{
      frameConfirmed=true;
      if(!creating)return;
      const row={...creating,name:$('lineupPopupName').value.trim()||'بازیکن جدید',flag:lPendingFlagId||'es',positionGroup:lPositionCategory($('lineupPopupPosition').value||'MID')};
      row.finalized=true;saveNewPlayer(row);creating=null;setUploadMode(false);persistSession();lPlayersDialogRender();
      notify('بازیکن دلخواه ساخته شد. حالا نام، پوزیشن و پرچم کارت را تعیین کن و ✓ را بزن.');
    });
    faceDialog.addEventListener('close',()=>{
      if(!frameConfirmed){$('lineupPopupScale').value=String(oldScale);$('lineupPopupScalePx').value=String(Math.round(oldScale*1.8));}
      if(creating)cleanupProvisional();
      setUploadMode(false);
    });
    $('lineupPlayerConfirm').addEventListener('click',()=>{
      const row=records.get(lPendingPlayerId);if(!row)return;
      row.name=$('lineupPopupName').value.trim()||row.name;
      row.flag=lPendingFlagId||row.flag;
      row.positionGroup=lPositionCategory($('lineupPopupPosition').value||'MID');
      refreshPlayerRecord(row);persistSession();
    });
    notify('ساخت بازیکن دلخواه فعال شد؛ تصویر فقط در همین نشست مرورگر ذخیره می‌شود.');
  }
  const timer=setInterval(()=>{if(initialized){clearInterval(timer);return;}init();},120);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&initialized)prependCreateTile()});
})();
