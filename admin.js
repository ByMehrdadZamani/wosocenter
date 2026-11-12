/* WoSoCenter admin dashboard, no dependencies or external JS. */
(() => {
 'use strict';
 const $ = id=>document.getElementById(id);
 const API = window.WoSoAnalytics?.endpoint;
 const tokenKey='woso_admin_token_v1';
 const names={home:'صفحه اصلی',fixture:'کنداکتورساز',lineup:'شماتیک‌ساز',interview:'مصاحبه‌ساز',standings:'جدول‌ساز'};
 const en={home:'Home',fixture:'Fixtures',lineup:'Lineup',interview:'Interview',standings:'Standings'};
 const fa=n=>Number(n||0).toLocaleString('fa-IR');
 let token='',busy=false;
 try{token=sessionStorage.getItem(tokenKey)||''}catch{}
 function setStatus(message='',login=false){$(login?'loginStatus':'dashboardStatus').textContent=message}
 function saveToken(value){token=value;try{value?sessionStorage.setItem(tokenKey,value):sessionStorage.removeItem(tokenKey)}catch{}}
 function showDashboard(visible){$('dashboard').hidden=!visible;$('loginPanel').hidden=visible;if(!visible)$('adminPassword').value=''}
 async function call(path,options={}){
  if(!API||!/^https:\/\//.test(API))throw Error('آدرس Worker در woso-analytics.js تنظیم نشده است.');
  const headers={'Accept':'application/json'};
  if(options.body)headers['Content-Type']='application/json';
  if(token)headers.Authorization='Bearer '+token;
  let res;
  try{res=await fetch(API+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,credentials:'omit',cache:'no-store'})}catch{throw Error('اتصال به Worker برقرار نشد؛ آدرس Worker و مجوزها را بررسی کن.')}
  let data;try{data=await res.json()}catch{throw Error('پاسخ Worker معتبر نیست.')}
  if(!res.ok||!data.success){const error=new Error(data.error||'خطا در سرور');error.status=res.status;throw error}
  return data;
 }
 function dateDays(today,num){const base=new Date(`${today}T12:00:00Z`).getTime();return Array.from({length:num},(_,i)=>new Date(base-(num-1-i)*86400000).toISOString().slice(0,10))}
 function sum(rows,key){return rows.reduce((n,row)=>n+Number(row[key]||0),0)}
 function render(data){
  const days=Number(data.days),daily=data.daily||[],sessions=data.sessions||[],tools=data.tools||[];
  const today=daily.find(d=>d.day===data.today)||{},nowSessions=sessions.find(d=>d.day===data.today)||{};
  $('todayViews').textContent=fa(today.views);$('todayDownloads').textContent=fa(today.downloads);$('rangeViews').textContent=fa(sum(daily,'views'));
  $('rangeDownloads').textContent=fa(sum(daily,'downloads'));$('todaySessions').textContent=fa(nowSessions.sessions);
  $('periodSessions').textContent=fa(sum(sessions,'sessions'));$('highDownloads').textContent=fa(sum(daily,'high'));$('compactDownloads').textContent=fa(sum(daily,'compact'));
  $('periodCaption').textContent=fa(days)+' روز اخیر';
  $('zoneLabel').textContent='منطقه زمانی آمار: '+data.timezone;
  $('updatedTime').textContent='آخرین بررسی: '+new Date(data.updatedAt).toLocaleString('fa-IR',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'long'});
  const dayMap=new Map(daily.map(row=>[row.day,row]));const labels=dateDays(data.today,days).reverse();const max=Math.max(1,...daily.map(row=>Math.max(+row.views||0,+row.downloads||0)));
  const chart=$('trendChart');chart.replaceChildren();
  labels.forEach((date,i)=>{
   const row=dayMap.get(date)||{};const el=document.createElement('div');el.className='chart-day';
   const bars=document.createElement('div');bars.className='bars';
   for(const [field,kind,caption] of [['views','view','بازدید'],['downloads','download','دانلود']]){
    const v=Number(row[field]||0);const bar=document.createElement('span');bar.className='bar '+kind;
    bar.style.height=(v?Math.max(2,Math.round(v/max*198)):2)+'px';bar.title=`${date}: ${fa(v)} ${caption}`;
    bar.setAttribute('aria-label',bar.title);bars.append(bar)
   }
   const caption=document.createElement('span');caption.className='day-label';caption.textContent=(days===90&&i%6!==0&&i!==89)?'':date.slice(5);
   el.append(bars,caption);chart.append(el);
  });
  $('emptyChart').hidden=!!(sum(daily,'views')+sum(daily,'downloads'));
  const tbody=$('toolRows');tbody.replaceChildren();
  for(const id of ['home','fixture','lineup','interview','standings']){
    const row=tools.find(t=>t.tool===id)||{},tr=document.createElement('tr');
    const name=document.createElement('td');const title=document.createElement('span');title.className='tool-name';title.textContent=names[id];const sub=document.createElement('small');sub.className='tool-sub';sub.textContent=en[id];name.append(title,sub);tr.append(name);
    for(const field of ['views','downloads','high','compact']){const td=document.createElement('td');td.textContent=fa(row[field]);tr.append(td)}tbody.append(tr);
  }
 }
 async function refresh(){if(busy)return;busy=true;$('refreshButton').disabled=true;setStatus('در حال بارگذاری اطلاعات…');try{const data=await call('/api/admin/stats?days='+$('rangeSelect').value);render(data);showDashboard(true);setStatus('')}catch(error){if(error.status===401){saveToken('');showDashboard(false);setStatus('نشست مدیریت منقضی شده؛ دوباره وارد شو.',true)}else setStatus(error.message)}finally{busy=false;$('refreshButton').disabled=false}}
 $('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const pass=$('adminPassword').value;const btn=$('loginButton');btn.disabled=true;setStatus('در حال بررسی رمز…',true);
  try{const data=await call('/api/admin/login',{method:'POST',body:{password:pass}});saveToken(data.token);$('adminPassword').value='';showDashboard(true);await refresh()}catch(error){setStatus(error.message,true)}finally{btn.disabled=false}
 });
 $('logoutButton').addEventListener('click',async()=>{try{await call('/api/admin/logout',{method:'POST'})}catch{}saveToken('');showDashboard(false);setStatus('از پنل مدیریت خارج شدی.',true)});
 $('refreshButton').addEventListener('click',refresh);$('rangeSelect').addEventListener('change',refresh);
 if(token){showDashboard(true);void refresh()}else showDashboard(false);
})();
