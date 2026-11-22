/* WoSoCenter admin dashboard v3
 * Works with the existing aggregate endpoint. Per-event details are shown only
 * when the Cloudflare Worker supports an authenticated event endpoint.
 * All displayed timestamps use Asia/Tehran. Accurate Tehran-based grouping
 * requires a corresponding Worker migration: see INSTALL-ADMIN-V3-FA.md.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ZONE = 'Asia/Tehran';
  const ENDPOINT = window.WoSoAnalytics?.endpoint;
  const TOKEN_KEY = 'woso_admin_token_v1';
  const THEME_KEY = 'wosocenter-ui-theme';
  const numeric = v => Math.max(0, Number(v) || 0);
  const fa = n => numeric(n).toLocaleString('fa-IR');
  const dayMs = 86400000;
  let token = '', busy = false;
  try { token = sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_) {}

  const dateParts = (value, zone = ZONE, calendar = 'gregory') => {
    const dt = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(dt.getTime())) return null;
    const fmt = new Intl.DateTimeFormat('en-US-u-ca-' + calendar + '-nu-latn', {
      timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric'
    });
    const p = Object.fromEntries(fmt.formatToParts(dt).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
    return p;
  };
  const iso = d => d.toISOString().slice(0, 10);
  const utcDate = s => new Date(s + 'T12:00:00Z');
  const offsetISO = (s, days) => iso(new Date(utcDate(s).getTime() + days * dayMs));
  const todayISO = () => {
    const p = dateParts(new Date());
    return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  };
  const persianNumeric = s => {
    const p = dateParts(utcDate(s), 'UTC', 'persian');
    if (!p) return '—';
    return [p.year, p.month, p.day].map(v => Number(v).toLocaleString('fa-IR')).join('/');
  };
  const persianLong = s => {
    const d = /^\d{4}-\d\d-\d\d$/.test(String(s)) ? utcDate(s) : new Date(s);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: /^\d{4}-\d\d-\d\d$/.test(String(s)) ? 'UTC' : ZONE,
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(d);
  };
  const tehranClock = value => {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d);
  };
  const dayArray = (from, to) => {
    const arr = [];
    if (!/^\d{4}-\d\d-\d\d$/.test(from) || !/^\d{4}-\d\d-\d\d$/.test(to)) return arr;
    for (let d = from, i = 0; d <= to && i < 90; d = offsetISO(d, 1), i++) arr.push(d);
    return arr;
  };
  const toolList = [
    {id:'home', title:'صفحه اصلی', sub:'HOME', href:'index.html', icon:'⌂'},
    {id:'fixture', title:'کنداکتور ووسو', sub:'FIXTURE MAKER', href:'fixture.html', icon:'▣'},
    {id:'lineup', title:'شماتیک ووسو', sub:'LINEUP BUILDER', href:'lineup.html', icon:'♙'},
    {id:'interview', title:'مصاحبه ووسو', sub:'INTERVIEW STUDIO', href:'interview.html', icon:'◩'},
    {id:'standings', title:'جدول ووسو', sub:'STANDINGS MAKER', href:'standings.html', icon:'▦'}
  ];
  const toolName = id => toolList.find(t => t.id === id)?.title || 'نامشخص';

  function saveToken(value) {
    token = value;
    try { value ? sessionStorage.setItem(TOKEN_KEY, value) : sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
  }
  function showDashboard(yes) {
    $('dashboard').hidden = !yes;
    $('loginPanel').hidden = yes;
    if (!yes) $('adminPassword').value = '';
  }
  function status(text = '', login = false) { $(login ? 'loginStatus' : 'dashboardStatus').textContent = text; }
  function setupTheme() {
    let current = 'dark';
    try { current = localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch (_) {}
    const apply = () => {
      document.documentElement.dataset.theme = current;
      const toggle = $('themeToggle');
      toggle.setAttribute('aria-pressed', String(current === 'dark'));
      toggle.innerHTML = current === 'dark' ? '<span>☀</span><span>حالت روز</span>' : '<span>☾</span><span>حالت شب</span>';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = current === 'dark' ? '#0d0b16' : '#f8f3fc';
    };
    apply();
    $('themeToggle').addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, current); } catch (_) {}
      apply();
    });
  }
  async function api(path, options = {}) {
    if (!ENDPOINT || !/^https:\/\//.test(ENDPOINT)) throw Error('آدرس Cloudflare Worker تنظیم نشده است.');
    const headers = {Accept:'application/json'};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (options.body) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await fetch(ENDPOINT + path, {
        method:options.method || 'GET', headers, credentials:'omit', cache:'no-store',
        body:options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (_) { throw Error('اتصال به Cloudflare Worker برقرار نشد.'); }
    let data;
    try { data = await response.json(); } catch (_) { const e = new Error('پاسخ Worker قابل خواندن نیست.'); e.status = response.status; throw e; }
    if (!response.ok || !data.success) {
      const e = new Error(data.error || 'پاسخ ناموفق سرور'); e.status = response.status; throw e;
    }
    return data;
  }

  function selectedRange() {
    const t = todayISO(), choice = $('rangeSelect').value;
    if (choice === 'today') return {from:t, to:t, text:'امروز', days:7, exactTools:true};
    if (choice === 'yesterday') { const d = offsetISO(t, -1); return {from:d, to:d, text:'دیروز', days:90, exactTools:true}; }
    if (choice === 'two-days-ago') { const d = offsetISO(t, -2); return {from:d, to:d, text:'دو روز پیش', days:90, exactTools:true}; }
    if (choice === 'custom') return {from:fromDate, to:toDate, text:'از '+persianNumeric(fromDate)+' تا '+persianNumeric(toDate), days:90, exactTools:true};
    const count = Number(choice) || 30;
    return {from:offsetISO(t, 1-count), to:t, text:fa(count)+' روز اخیر', days:count, exactTools:true};
  }

  // Native Persian-calendar date picker. Gregorian ISO values are kept as
  // canonical keys for the existing Worker; no external library is required.
  const persianMonthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  let fromDate = offsetISO(todayISO(), -29), toDate = todayISO();
  let pickerTarget = 'from', pickerYear = 0, pickerMonth = 0;
  const monthFirstCache = new Map();
  function firstDayOfMonth(y, m) {
    const key = y + '-' + m;
    if (monthFirstCache.has(key)) return monthFirstCache.get(key);
    // All dates of Persian year y lie in Gregorian y+621 through y+622.
    // Noon UTC prevents date-boundary DST ambiguity.
    const first = Date.UTC(y+621, 0, 1, 12);
    for (let i=0; i<460; i++) {
      const d = new Date(first+i*dayMs), p = dateParts(d, 'UTC', 'persian');
      if (p?.year === y && p.month === m && p.day === 1) {
        const found=iso(d); monthFirstCache.set(key, found); return found;
      }
    }
    return null;
  }
  function shiftMonth(delta) {
    pickerMonth += delta;
    while (pickerMonth < 1) { pickerMonth += 12; pickerYear--; }
    while (pickerMonth > 12) { pickerMonth -= 12; pickerYear++; }
    paintCalendar();
  }
  function paintCalendar() {
    const first = firstDayOfMonth(pickerYear, pickerMonth);
    $('jalaliMonthTitle').textContent = persianMonthNames[pickerMonth-1]+' '+Number(pickerYear).toLocaleString('fa-IR');
    const grid = $('jalaliDays'); grid.replaceChildren();
    if (!first) return;
    const start = utcDate(first).getUTCDay(); // Sunday=0, Saturday=6
    const offset = (start+1)%7;
    for (let i=0;i<offset;i++) {
      const empty=document.createElement('span');empty.className='jalali-padding';grid.append(empty);
    }
    const min = offsetISO(todayISO(), -89), max = todayISO();
    for (let i=0;i<31;i++) {
      const d = offsetISO(first, i), p = dateParts(utcDate(d), 'UTC', 'persian');
      if (p?.year !== pickerYear || p.month !== pickerMonth) break;
      const btn = document.createElement('button'); btn.type='button'; btn.className='jalali-day';
      btn.textContent = Number(p.day).toLocaleString('fa-IR'); btn.dataset.iso=d;
      btn.disabled = d < min || d > max;
      btn.setAttribute('aria-label', persianLong(d));
      if (d === todayISO()) btn.classList.add('jalali-today');
      if (d >= fromDate && d <= toDate) btn.classList.add('jalali-in-range');
      if (d === fromDate || d === toDate) {btn.classList.add('jalali-selected');btn.setAttribute('aria-pressed','true');}
      btn.addEventListener('click',()=>{
        if (pickerTarget === 'from') {
          fromDate=d;
          if (fromDate > toDate) toDate=d;
        } else {
          toDate=d;
          if (toDate < fromDate) fromDate=d;
        }
        updateDateButtons();closeCalendar();
      });
      grid.append(btn);
    }
    $('monthPrev').disabled = (first <= min);
    const last = offsetISO(first, 30);
    $('monthNext').disabled = (last >= max && dateParts(utcDate(max), 'UTC', 'persian').month === pickerMonth);
  }
  function updateDateButtons() {
    $('dateFromButton').textContent = 'شروع: '+persianNumeric(fromDate);
    $('dateToButton').textContent = 'پایان: '+persianNumeric(toDate);
  }
  function openCalendar(target) {
    pickerTarget=target;
    const p=dateParts(utcDate(target === 'from' ? fromDate : toDate), 'UTC', 'persian');
    pickerYear=p.year;pickerMonth=p.month;
    $('jalaliPicker').hidden=false;
    paintCalendar();$('pickerClose').focus();
  }
  function closeCalendar() {$('jalaliPicker').hidden=true;}
  $('dateFromButton').addEventListener('click',()=>openCalendar('from'));
  $('dateToButton').addEventListener('click',()=>openCalendar('to'));
  $('monthPrev').addEventListener('click',()=>shiftMonth(-1));
  $('monthNext').addEventListener('click',()=>shiftMonth(1));
  $('pickerClose').addEventListener('click',closeCalendar);
  $('pickerToday').addEventListener('click',()=>{
    const p=dateParts(utcDate(todayISO()), 'UTC', 'persian');pickerYear=p.year;pickerMonth=p.month;paintCalendar();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCalendar()});
  document.addEventListener('pointerdown',e=>{
    if (!$('jalaliPicker').hidden && !$('jalaliPicker').contains(e.target) &&
        !$('dateFromButton').contains(e.target) && !$('dateToButton').contains(e.target)) closeCalendar();
  });
  $('rangeSelect').addEventListener('change',()=>{
    $('customDatePanel').hidden = $('rangeSelect').value !== 'custom';
    closeCalendar();
    if ($('rangeSelect').value !== 'custom') void refresh();
  });
  $('applyDateButton').addEventListener('click',()=>{
    const min=offsetISO(todayISO(),-89),max=todayISO();
    if (fromDate<min || toDate>max || fromDate>toDate) { status('بازه انتخابی باید در ۹۰ روز اخیر باشد.');return; }
    void refresh();
  });
  updateDateButtons();

  function metricValue(day, key, map) { return numeric(map.get(day)?.[key]); }
  function sum(rows, field) {return rows.reduce((total,r)=>total+numeric(r[field]),0);}
  function linePath(points) {
    if (!points.length) return '';
    let d=`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for(let i=1;i<points.length;i++) {
      const p=points[i-1],q=points[i],mx=(p.x+q.x)/2;
      d+=` C ${mx.toFixed(1)} ${p.y.toFixed(1)}, ${mx.toFixed(1)} ${q.y.toFixed(1)}, ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    }
    return d;
  }
  function chartFor(dates, dailyMap) {
    const chart=$('trendChart');chart.replaceChildren();
    const rows=dates.map(d=>({day:d,views:metricValue(d,'views',dailyMap),downloads:metricValue(d,'downloads',dailyMap)}));
    if (!rows.length) return;
    const max=Math.max(1,...rows.flatMap(r=>[r.views,r.downloads]));
    const w=Math.max(710,Math.min(2000,dates.length*43)), h=344, left=54, right=w-24, top=35, bottom=270;
    const x=i=>left + (right-left)*(dates.length===1?.5:i/(dates.length-1));
    const y=v=>bottom-(v/max)*(bottom-top);
    const ns='http://www.w3.org/2000/svg';
    const root=document.createElementNS(ns,'svg');root.setAttribute('viewBox',`0 0 ${w} ${h}`);
    root.setAttribute('class','woso-line-chart');root.setAttribute('role','img');
    root.setAttribute('aria-label','نمودار خطی بازدید و دانلود در بازه انتخاب‌شده');
    const append=(tag,attrs={},parent=root)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;};
    const defs=append('defs');
    for(const [id,color] of [['viewsFill','#b66de6'],['downloadsFill','#eab655']]) {
      const grad=append('linearGradient',{id,x1:0,y1:0,x2:0,y2:1},defs);
      append('stop',{offset:'0%','stop-color':color,'stop-opacity':'.26'},grad);
      append('stop',{offset:'100%','stop-color':color,'stop-opacity':'0'},grad);
    }
    for(let i=0;i<=4;i++) {
      const yy=top+(bottom-top)*i/4;
      append('line',{x1:left,x2:right,y1:yy,y2:yy,class:'woso-chart-grid'});
      const label=append('text',{x:left-10,y:yy+4,class:'woso-axis-label','text-anchor':'end'});
      label.textContent=fa(Math.round(max*(1-i/4)));
    }
    const markDay=(date, row)=>{
      $('chartSelectedDay').textContent=persianLong(date)+' — بازدید: '+fa(row.views)+' | دانلود: '+fa(row.downloads);
    };
    for(const [field,klass,grad] of [['views','view','viewsFill'],['downloads','download','downloadsFill']]) {
      const pts=rows.map((r,i)=>({x:x(i),y:y(r[field])}));
      const line=linePath(pts);
      if (pts.length>1) append('path',{d:line+` L ${pts[pts.length-1].x} ${bottom} L ${pts[0].x} ${bottom} Z`,fill:`url(#${grad})`,class:'woso-chart-area'});
      append('path',{d:line,class:'woso-chart-line '+klass});
      pts.forEach((point,i)=>{
        const btn=append('circle',{cx:point.x,cy:point.y,r:5,tabindex:0,role:'button',class:'woso-chart-point '+klass,'aria-label':`${persianLong(rows[i].day)}، ${field==='views'?'بازدید':'دانلود'}: ${fa(rows[i][field])}`});
        append('title',{},btn).textContent=btn.getAttribute('aria-label');
        btn.addEventListener('click',()=>markDay(rows[i].day,rows[i]));
        btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();markDay(rows[i].day,rows[i]);}});
      });
    }
    const step=dates.length>60?10:dates.length>20?5:dates.length>10?2:1;
    rows.forEach((row,i)=>{
      if (i%step && i!==rows.length-1) return;
      const label=append('text',{x:x(i),y:bottom+28,class:'woso-chart-date','text-anchor':'middle'});
      const p=dateParts(utcDate(row.day),'UTC','persian');
      label.textContent=Number(p.month).toLocaleString('fa-IR')+'/'+Number(p.day).toLocaleString('fa-IR');
    });
    chart.append(root);
    chart.style.minWidth=dates.length>16?'740px':'600px';
    $('emptyChart').hidden = rows.some(r=>r.views || r.downloads);
    if (rows.length) markDay(rows[rows.length-1].day,rows[rows.length-1]);
  }
  function dailyTable(dates, map) {
    const body=$('dailyRows');body.replaceChildren();
    for(const day of [...dates].reverse()) {
      const row=map.get(day)||{},tr=document.createElement('tr');
      for(const str of [persianLong(day),fa(row.views),fa(row.downloads),fa(row.high),fa(row.compact)]) {
        const cell=document.createElement('td');cell.textContent=str;tr.append(cell);
      }
      body.append(tr);
    }
  }
  function toolTable(tools, enabled) {
    const body=$('toolRows');body.replaceChildren();
    const max=Math.max(1,...(tools||[]).map(x=>numeric(x.views)));
    $('toolsScopeInfo').textContent=enabled?'مقایسه صفحات در بازه انتخاب‌شده':'برای تفکیک ابزارها در یک روز تاریخی یا بازه دلخواه، به ارتقای API نیاز است.';
    for(const item of toolList) {
      const metrics=(tools||[]).find(x=>x.tool===item.id)||{};
      const tr=document.createElement('tr');tr.className='woso-tool-row woso-tool-'+item.id;
      const td=document.createElement('td');
      const link=document.createElement('a');link.className='woso-tool-link';link.href=item.href;
      const ic=document.createElement('span');ic.className='woso-tool-icon';ic.textContent=item.icon;
      const info=document.createElement('span');
      const title=document.createElement('strong');title.className='tool-name';title.textContent=item.title;
      const sub=document.createElement('small');sub.className='tool-sub';sub.textContent=item.sub;
      info.append(title,sub);link.append(ic,info);td.append(link);
      if(enabled){const bar=document.createElement('div');bar.className='woso-tool-meter';const fill=document.createElement('span');fill.style.width=(numeric(metrics.views)*100/max).toFixed(1)+'%';bar.append(fill);td.append(bar);}
      tr.append(td);
      for(const field of ['views','downloads','high','compact']){
        const cell=document.createElement('td'),value=document.createElement('span');value.className='woso-count';
        value.textContent=enabled?fa(metrics[field]):'—';cell.append(value);tr.append(cell);
      }
      body.append(tr);
    }
  }
  function render(data, selection) {
    const map=new Map((data.daily||[]).map(x=>[x.day,x]));
    const sessions=new Map((data.sessions||[]).map(x=>[x.day,x]));
    const dates=dayArray(selection.from,selection.to);
    const rows=dates.map(day=>map.get(day)||{});
    const sessionRows=dates.map(day=>sessions.get(day)||{});
    const t=todayISO();
    const actualToday = data.todaySummary || {};
    $('todayViews').textContent=fa(data.rangeApplied ? actualToday.views : metricValue(t,'views',map));
    $('todayDownloads').textContent=fa(data.rangeApplied ? actualToday.downloads : metricValue(t,'downloads',map));
    $('rangeViews').textContent=fa(sum(rows,'views'));
    $('rangeDownloads').textContent=fa(sum(rows,'downloads'));
    $('anonymousViews').textContent=fa(sum(rows,'anonymousViews'));
    $('anonymousDownloads').textContent=fa(sum(rows,'anonymousDownloads'));
    $('highDownloads').textContent=fa(sum(rows,'high'));
    $('compactDownloads').textContent=fa(sum(rows,'compact'));
    $('todaySessions').textContent=fa(data.rangeApplied ? actualToday.sessions : metricValue(t,'sessions',sessions));
    $('periodSessions').textContent=fa(sum(sessionRows,'sessions'));
    $('periodCaption').textContent=selection.text;
    $('todayJalali').textContent='امروز '+persianLong(t);
    $('updatedTime').textContent='آخرین بررسی: '+persianLong(data.updatedAt || new Date().toISOString())+'، '+tehranClock(data.updatedAt || new Date().toISOString());
    const serverZone=data.timezone||'نامشخص';
    $('zoneLabel').textContent='زمان نمایش: '+ZONE+' | روزبندی Worker: '+serverZone;
    $('timezoneWarning').hidden=serverZone===ZONE;
    $('timezoneWarning').textContent='توجه: نمایش تاریخ و ساعت بر اساس تهران است، اما گروه‌بندی روزانه Worker هنوز «'+serverZone+'» است. برای هماهنگی دقیق مرز روزها، لازم است timezone سرور نیز به Asia/Tehran تغییر کند.';
    chartFor(dates,map);dailyTable(dates,map);toolTable(data.tools||[],Boolean(data.rangeApplied) || selection.exactTools);
  }
  let cachedEvents = [];
  let eventsRequestId = 0, eventsNextCursor = null, eventsSelection = null, eventsLoadingMore = false;
  function renderEvents(events, rebuildFilters = true) {
    cachedEvents = events;
    if (rebuildFilters) {
      const filter=$('sessionFilter');filter.replaceChildren();
      const all=document.createElement('option');all.value='';all.textContent='همه نشست‌ها';filter.append(all);
      const sessions=[...new Set(events.map(e=>e.session).filter(Boolean))].sort();
      sessions.forEach((session,i)=>{const opt=document.createElement('option');opt.value=String(session);opt.textContent='نشست '+fa(i+1)+' · '+String(session).slice(0,8)+'…';filter.append(opt);});
      $('eventFilters').hidden=!sessions.length;
    }
    const chosen=$('sessionFilter').value;
    const visible=chosen?events.filter(x=>String(x.session||'')===chosen):events;
    const body=$('eventsRows');body.replaceChildren();
    $('eventsTableWrap').hidden=false;
    $('eventsState').textContent='فعال';
    $('eventsInfo').textContent='نمایش '+fa(visible.length)+' رویداد از '+fa(events.length)+' رویداد بارگذاری‌شده؛ ساعت‌ها به وقت تهران هستند. شناسه نشست تصادفی است؛ IP خام برای ۷ روز اخیر و فقط در پنل ادمین نمایش داده می‌شود. موقعیت مکانی تقریبی است.';
    for(const ev of visible) {
      const tr=document.createElement('tr');
      const time=ev.timestamp||ev.createdAt||ev.occurredAt||ev.time;
      const action=ev.event||ev.type||'—';
      const eventLabel=action==='page_view'?'بازدید صفحه':action==='download'?'شروع دانلود':String(action);
      const text=[time?(persianLong(time)+' '+tehranClock(time)):'—',
        ev.session?String(ev.session).slice(0,10)+'…':'—',toolName(ev.tool),eventLabel,
        [ev.deviceType,ev.deviceModel,ev.os,ev.browser].filter(Boolean).join(' / ')||'نامشخص',
        ev.ipAddress||'—',
        [ev.country,ev.city].filter(Boolean).join('، ')||'نامشخص',
        [ev.fileType,ev.quality,ev.downloadType].filter(Boolean).join(' / ')||'—'];
      text.forEach(v=>{const td=document.createElement('td');td.textContent=String(v);tr.append(td);});
      body.append(tr);
    }
    if(!visible.length){
      const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=8;
      td.textContent='در این بازه رویدادی ثبت نشده است.';tr.append(td);body.append(tr);
    }
  }
  $('sessionFilter').addEventListener('change',()=>renderEvents(cachedEvents,false));
  async function loadEvents(selection, append = false) {
    const id = append ? eventsRequestId : ++eventsRequestId;
    if (append && (eventsLoadingMore || !eventsNextCursor)) return;
    if (!append) {
      cachedEvents = [];
      eventsNextCursor = null;
      eventsSelection = selection;
      $('eventFilters').hidden=true;
      $('eventsTableWrap').hidden=true;
      $('eventsState').textContent='در حال بررسی';
    } else eventsLoadingMore = true;
    const more=$('eventsMoreButton');more.disabled=true;
    try {
      const params=new URLSearchParams({from:selection.from,to:selection.to,limit:'100',timezone:ZONE});
      if (append && eventsNextCursor) params.set('before',eventsNextCursor);
      const data=await api('/api/admin/events?'+params.toString());
      if (id !== eventsRequestId) return;
      if(!Array.isArray(data.events)) throw new Error('ساختار پاسخ رویدادها معتبر نیست.');
      eventsNextCursor = data.hasMore ? data.nextCursor : null;
      const priorSelection = append ? $('sessionFilter').value : '';
      const accumulated = append ? cachedEvents.concat(data.events) : data.events;
      renderEvents(accumulated);
      if (priorSelection && [...$('sessionFilter').options].some(o=>o.value===priorSelection)) {
        $('sessionFilter').value=priorSelection;
        renderEvents(accumulated,false);
      }
    } catch(err) {
      if (id!==eventsRequestId) return;
      $('eventsState').textContent='خطای دریافت رویدادها';
      $('eventsInfo').textContent=err.status===404
        ? 'در Worker هنوز API ثبت جزئیات بازدیدها فعال نیست.'
        : 'دریافت رویدادها انجام نشد: '+err.message;
    } finally {
      eventsLoadingMore=false;
      if(id===eventsRequestId){more.hidden=!eventsNextCursor;more.disabled=false;}
    }
  }
  $('eventsMoreButton').addEventListener('click',()=>{if(eventsSelection)void loadEvents(eventsSelection,true)});
  async function refresh() {
    if(busy)return;
    const selection=selectedRange();
    const min=offsetISO(todayISO(),-89);
    if(selection.from<min || selection.to>todayISO() || selection.from>selection.to) {
      status('بازه باید در ۹۰ روز اخیر باشد.');return;
    }
    busy=true;$('refreshButton').disabled=true;status('در حال دریافت آمار…');
    try {
      const params=new URLSearchParams({from:selection.from,to:selection.to,days:String(selection.days)});
      const data=await api('/api/admin/stats?'+params.toString());
      render(data,selection);showDashboard(true);status('');
      void loadEvents(selection);
    } catch(err) {
      if(err.status===401){saveToken('');showDashboard(false);status('نشست مدیریت منقضی شد؛ دوباره وارد شو.',true);}
      else status(err.message);
    } finally {busy=false;$('refreshButton').disabled=false;}
  }
  $('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const btn=$('loginButton');btn.disabled=true;status('در حال بررسی رمز…',true);
    try {
      const data=await api('/api/admin/login',{method:'POST',body:{password:$('adminPassword').value}});
      saveToken(data.token);$('adminPassword').value='';showDashboard(true);status('',true);await refresh();
    } catch(err){status(err.message,true);} finally{btn.disabled=false;}
  });
  $('logoutButton').addEventListener('click',async()=>{
    try{await api('/api/admin/logout',{method:'POST'});}catch(_){}
    saveToken('');showDashboard(false);status('از پنل مدیریت خارج شدی.',true);
  });
  $('refreshButton').addEventListener('click',()=>void refresh());
  setupTheme();
  if(token){showDashboard(true);void refresh();}else showDashboard(false);
})();
