/* WoSoCenter Studio analytics dashboard v2 — no external JS dependencies. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const API=window.WoSoAnalytics?.endpoint;
 const tokenKey='woso_admin_token_v1';
 const themeKey='wosocenter-ui-theme';
 const fa=n=>Number(n||0).toLocaleString('fa-IR');
 const persianDate=(iso,short=false)=>{
  const date= new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(iso))?iso+'T12:00:00Z':iso);
  if(!Number.isFinite(date.getTime()))return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{
   timeZone:'Europe/Berlin',year:short?undefined:'numeric',month:short?'numeric':'long',day:'numeric'
  }).format(date);
 };
 const toolsInfo={
  home:{name:'صفحه اصلی',english:'HOME',href:'index.html',icon:'<path d="M10 31 36 9l26 22v31H10z"/><path d="M29 62V40h14v22"/>'},
  fixture:{name:'کنداکتور ووسو',english:'FIXTURE MAKER',href:'fixture.html',icon:'<rect x="12" y="12" width="48" height="48" rx="9"/><path d="M22 25h28M22 35h28M22 45h19"/><circle cx="24" cy="25" r="3" fill="currentColor" stroke="none"/><circle cx="24" cy="35" r="3" fill="currentColor" stroke="none"/><circle cx="24" cy="45" r="3" fill="currentColor" stroke="none"/>'},
  lineup:{name:'شماتیک ووسو',english:'LINEUP BUILDER',href:'lineup.html',icon:'<rect x="9" y="10" width="54" height="52" rx="8"/><path d="M36 10v52M9 36h54" stroke-dasharray="3 5"/><circle cx="36" cy="36" r="9"/><circle cx="22" cy="23" r="4" fill="currentColor" stroke="none"/><circle cx="50" cy="23" r="4" fill="currentColor" stroke="none"/>'},
  interview:{name:'مصاحبه ووسو',english:'INTERVIEW STUDIO',href:'interview.html',icon:'<path d="M12 18a7 7 0 0 1 7-7h34a7 7 0 0 1 7 7v30a7 7 0 0 1-7 7H32L19 64v-9a7 7 0 0 1-7-7z"/><path d="M23 26h26M23 35h26M23 44h17"/><path d="M30 18v5m12-5v5"/>'},
  standings:{name:'جدول ووسو',english:'STANDINGS MAKER',href:'standings.html',icon:'<rect x="9" y="9" width="54" height="54" rx="7"/><path d="M9 23h54M9 37h54M9 50h54M21 23v40M48 23v40"/><path d="M21 16h13"/>'}
 };
 const svgIcon=(id)=>`<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${toolsInfo[id].icon}</svg>`;
 let token='',busy=false;
 try{token=sessionStorage.getItem(tokenKey)||''}catch{}
 function showDashboard(visible){$('dashboard').hidden=!visible;$('loginPanel').hidden=visible;if(!visible)$('adminPassword').value=''}
 function saveToken(value){token=value;try{value?sessionStorage.setItem(tokenKey,value):sessionStorage.removeItem(tokenKey)}catch{}}
 function setStatus(message='',login=false){$(login?'loginStatus':'dashboardStatus').textContent=message}
 function initTheme(){
  let selected='dark';try{selected=localStorage.getItem(themeKey)==='light'?'light':'dark'}catch{}
  function apply(theme){
   document.documentElement.dataset.theme=theme;
   const toggle=$('themeToggle');if(toggle){toggle.setAttribute('aria-pressed',String(theme==='dark'));toggle.setAttribute('aria-label',theme==='dark'?'تغییر به حالت روز':'تغییر به حالت شب');toggle.title=theme==='dark'?'حالت روز':'حالت شب';toggle.innerHTML=theme==='dark'?'<span aria-hidden="true">☀</span><span>حالت روز</span>':'<span aria-hidden="true">☾</span><span>حالت شب</span>'}
   const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='dark'?'#0d0b16':'#f8f3fc';
  }
  apply(selected);
  $('themeToggle')?.addEventListener('click',()=>{selected=document.documentElement.dataset.theme==='light'?'dark':'light';try{localStorage.setItem(themeKey,selected)}catch{}apply(selected)});
 }
 async function call(path,options={}){
  if(!API||!/^https:\/\//.test(API))throw Error('آدرس Worker در woso-analytics.js تنظیم نشده است.');
  const headers={'Accept':'application/json'};if(options.body)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
  let res;try{res=await fetch(API+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,credentials:'omit',cache:'no-store'})}
  catch{throw Error('اتصال به Worker برقرار نشد؛ اتصال اینترنت و نشانی Worker را بررسی کن.')}
  let data;try{data=await res.json()}catch{throw Error('پاسخ Worker معتبر نیست.')}
  if(!res.ok||!data.success){const e=new Error(data.error||'خطا در سرور');e.status=res.status;throw e}return data;
 }
 function daysRange(today,num){const base=new Date(today+'T12:00:00Z').getTime();return Array.from({length:num},(_,i)=>new Date(base-(num-1-i)*86400000).toISOString().slice(0,10))}
 function sum(rows,key){return rows.reduce((n,r)=>n+Number(r[key]||0),0)}
 const cleanCount=x=>Math.max(0,Number(x)||0);
 function linePath(points){
  if(!points.length)return '';
  let s=`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for(let i=1;i<points.length;i++){
   const p=points[i-1],q=points[i],mx=(p.x+q.x)/2;
   s+=` C ${mx.toFixed(1)} ${p.y.toFixed(1)}, ${mx.toFixed(1)} ${q.y.toFixed(1)}, ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }
  return s;
 }
 function drawChart(data){
  const days=Number(data.days)||30,dates=daysRange(data.today,days);
  const dayMap=new Map((data.daily||[]).map(x=>[x.day,x]));
  const visits=dates.map(d=>cleanCount(dayMap.get(d)?.views));
  const downloads=dates.map(d=>cleanCount(dayMap.get(d)?.downloads));
  const max=Math.max(1,...visits,...downloads);
  const chart=$('trendChart');chart.replaceChildren();
  const w=days>45?1400:days>15?1030:950,h=320,left=45,right=w-16,top=28,bottom=255;
  const x=i=>left+i*(right-left)/Math.max(1,dates.length-1);
  const y=v=>bottom-(v/max)*(bottom-top);
  const pts=values=>values.map((v,i)=>({x:x(i),y:y(v)}));
  const pv=pts(visits),pd=pts(downloads);
  const dom='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(dom,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('role','img');
  svg.setAttribute('aria-label','نمودار پیوسته بازدید و دانلود به تفکیک روز، با تاریخ شمسی');svg.classList.add('woso-line-chart');
  const ns=(tag,attrs={},parent=svg)=>{const el=document.createElementNS(dom,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el};
  const defs=ns('defs');for(const [id,c] of [['lineViews','#b66de6'],['lineDownloads','#eab655']]){
   const g=ns('linearGradient',{id,x1:0,y1:0,x2:0,y2:1},defs);ns('stop',{offset:'0%','stop-color':c,'stop-opacity':'.24'},g);ns('stop',{offset:'100%','stop-color':c,'stop-opacity':'0'},g);
  }
  for(let j=0;j<=4;j++){
   const yy=top+(bottom-top)*j/4;ns('line',{x1:left,x2:right,y1:yy,y2:yy,class:'woso-chart-grid'});
   const value=fa(Math.round(max*(1-j/4)));const t=ns('text',{x:left-10,y:yy+4,class:'woso-axis-label','text-anchor':'end'});t.textContent=value;
  }
  function drawSeries(points,series,grad){
   const path=linePath(points);ns('path',{d:path+` L ${right} ${bottom} L ${left} ${bottom} Z`,fill:`url(#${grad})`,class:'woso-chart-area'});
   ns('path',{d:path,class:'woso-chart-line '+series});
   points.forEach((p,i)=>{
    const c=ns('circle',{cx:p.x,cy:p.y,r:days>45?3:4,class:'woso-chart-point '+series,tabindex:0});
    ns('title',{},c).textContent=`${persianDate(dates[i])} · ${series==='view'?'بازدید':'دانلود'}: ${fa(series==='view'?visits[i]:downloads[i])}`;
   });
  }
  drawSeries(pv,'view','lineViews');drawSeries(pd,'download','lineDownloads');
  const step=days>45?10:days>15?5:1;
  dates.forEach((date,i)=>{
   if(i%step!==0&&i!==dates.length-1)return;
   const xx=x(i);const t=ns('text',{x:xx,y:bottom+26,class:'woso-chart-date','text-anchor':'middle'});t.textContent=persianDate(date,true);
  });
  chart.append(svg);
  chart.style.minWidth=days>45?'950px':days>15?'760px':'630px';
  $('emptyChart').hidden=!!(sum(data.daily||[],'views')+sum(data.daily||[],'downloads'));
 }
 function renderTools(tools){
  const tbody=$('toolRows');tbody.replaceChildren();
  const max=Math.max(1,...(tools||[]).map(t=>cleanCount(t.views)));
  for(const id of ['home','fixture','lineup','interview','standings']){
   const row=(tools||[]).find(t=>t.tool===id)||{};const tr=document.createElement('tr');tr.className='woso-tool-row woso-tool-'+id;
   const name=document.createElement('td');const link=document.createElement('a');link.href=toolsInfo[id].href;link.className='woso-tool-link';
   const icon=document.createElement('span');icon.className='woso-tool-icon';icon.innerHTML=svgIcon(id);
   const info=document.createElement('span');const title=document.createElement('strong');title.className='tool-name';title.textContent=toolsInfo[id].name;
   const sub=document.createElement('small');sub.className='tool-sub';sub.textContent=toolsInfo[id].english;info.append(title,sub);link.append(icon,info);name.append(link);
   const bar=document.createElement('div');bar.className='woso-tool-meter';const inner=document.createElement('span');inner.style.width=(cleanCount(row.views)/max*100).toFixed(1)+'%';bar.append(inner);name.append(bar);tr.append(name);
   for(const field of ['views','downloads','high','compact']){const td=document.createElement('td');const value=document.createElement('span');value.className='woso-count '+(field==='downloads'?'woso-download-count':'');value.textContent=fa(row[field]);td.append(value);tr.append(td)}
   tbody.append(tr);
  }
 }
 function render(data){
  const daily=data.daily||[],sessions=data.sessions||[],today=daily.find(x=>x.day===data.today)||{},nowSessions=sessions.find(x=>x.day===data.today)||{};
  $('todayViews').textContent=fa(today.views);$('todayDownloads').textContent=fa(today.downloads);
  $('rangeViews').textContent=fa(sum(daily,'views'));$('rangeDownloads').textContent=fa(sum(daily,'downloads'));
  $('todaySessions').textContent=fa(nowSessions.sessions);$('periodSessions').textContent=fa(sum(sessions,'sessions'));
  $('highDownloads').textContent=fa(sum(daily,'high'));$('compactDownloads').textContent=fa(sum(daily,'compact'));
  $('periodCaption').textContent=fa(data.days)+' روز اخیر';
  $('zoneLabel').textContent='مبنای روز آماری: '+(data.timezone||'Europe/Berlin');
  $('updatedTime').textContent='آخرین بررسی: '+persianDate(data.updatedAt)+'، '+new Date(data.updatedAt).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
  $('todayJalali').textContent='امروز '+persianDate(data.today);
  drawChart(data);renderTools(data.tools||[]);
 }
 async function refresh(){
  if(busy)return;busy=true;$('refreshButton').disabled=true;setStatus('در حال بارگذاری اطلاعات…');
  try{const data=await call('/api/admin/stats?days='+$('rangeSelect').value);render(data);showDashboard(true);setStatus('')}
  catch(e){if(e.status===401){saveToken('');showDashboard(false);setStatus('نشست مدیریت منقضی شده؛ دوباره وارد شو.',true)}else setStatus(e.message)}
  finally{busy=false;$('refreshButton').disabled=false}
 }
 $('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const pass=$('adminPassword').value;const btn=$('loginButton');btn.disabled=true;setStatus('در حال بررسی رمز…',true);
  try{const data=await call('/api/admin/login',{method:'POST',body:{password:pass}});saveToken(data.token);$('adminPassword').value='';showDashboard(true);await refresh()}
  catch(err){setStatus(err.message,true)}finally{btn.disabled=false}
 });
 $('logoutButton').addEventListener('click',async()=>{try{await call('/api/admin/logout',{method:'POST'})}catch{}saveToken('');showDashboard(false);setStatus('از پنل مدیریت خارج شدی.',true)});
 $('refreshButton').addEventListener('click',refresh);$('rangeSelect').addEventListener('change',refresh);
 initTheme();if(token){showDashboard(true);void refresh()}else showDashboard(false);
})();
