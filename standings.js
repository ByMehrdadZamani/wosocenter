/* WoSoCenter Standings - frontend only; API Ninjas key stays in the Cloudflare Worker Secret. */
'use strict';
(() => {
  const API_URL = 'https://wosocenter-standings.mr-mehrdadzamani1382.workers.dev/api/standings';
  const canvas = document.getElementById('poster');
  const ctx = canvas.getContext('2d');
  const seasonEl = document.getElementById('season');
  const titleEl = document.getElementById('posterTitle');
  const themeEl = document.getElementById('posterTheme');
  const themes = {
    purple: {bg1:'#2b183a',bg2:'#171127',bg3:'#0c1220',accent:'#bc80d7',header:'#71428d',gold:'#f3ca7a'},
    navy: {bg1:'#102942',bg2:'#111d32',bg3:'#071019',accent:'#6cd6db',header:'#21637a',gold:'#a8ede5'},
    rose: {bg1:'#3a1936',bg2:'#241126',bg3:'#190e1b',accent:'#f3a4c8',header:'#8d3f6e',gold:'#ffd09e'}
  };
  function palette(){ return themes[themeEl.value] || themes.purple; }
  function titleValue(){ return titleEl.value.trim() || 'جدول لیگ فوتبال زنان اسپانیا'; }
  const fetchBtn = document.getElementById('fetchBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusEl = document.getElementById('status');
  const W = canvas.width, H = canvas.height;
  const family = 'Ario, Tahoma, sans-serif';
  const now = new Date();
  const activeSeason = now.getUTCFullYear() - (now.getUTCMonth() < 6 ? 1 : 0);
  seasonEl.replaceChildren();
  for (let year = activeSeason; year >= activeSeason - 2; year--) {
    const opt = document.createElement('option');
    opt.value = String(year);
    opt.textContent = `${year}/${String(year + 1).slice(-2)}`;
    seasonEl.appendChild(opt);
  }
  let currentData = null;
  let logoLoadId = 0;

  function status(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
  }
  function roundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function text(value, x, y, size, color, weight = 700, align = 'right') {
    ctx.direction = 'rtl'; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.font = `${weight} ${size}px ${family}`; ctx.fillStyle = color;
    ctx.fillText(String(value ?? ''), x, y);
  }
  function fitText(value, maxWidth, baseSize = 24) {
    let str = String(value ?? '');
    let size = baseSize;
    while (size > 16) {
      ctx.font = `780 ${size}px ${family}`;
      if (ctx.measureText(str).width <= maxWidth) return {value: str, size};
      size--;
    }
    ctx.font = `780 ${size}px ${family}`;
    while (str.length && ctx.measureText(str + '…').width > maxWidth) str = str.slice(0, -1);
    return {value: str + '…', size};
  }
  function background() {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    const p = palette();
    bg.addColorStop(0, p.bg1); bg.addColorStop(.55, p.bg2); bg.addColorStop(1, p.bg3);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(201,139,236,.12)'; ctx.lineWidth = 2;
    for (let i=0;i<10;i++){ctx.beginPath();ctx.arc(1060,-80,110+i*62,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle = '#eabd71'; ctx.beginPath();ctx.arc(985, 76, 7, 0, Math.PI*2);ctx.fill();
    text('WOSO CENTER', 950, 78, 25, '#f4deee', 900);
    roundRect(42, 104, 996, 2, 0, palette().accent);
  }
  function drawEmpty() {
    background();
    text('جدول‌ساز ووسو', 973, 216, 60, '#f6eaf7', 900);
    text('STANDINGS MAKER', 970, 274, 22, '#ecc576', 700);
    roundRect(42, 354, 996, 650, 23, '#ffffff0b');
    text('جدول لیگ در این قسمت نمایش داده می‌شود', 540, 630, 32, '#d1bfd8', 700, 'center');
    text('ابتدا روی «دریافت اطلاعات آنلاین» کلیک کن', 540, 689, 24, '#ac98be', 500, 'center');
    text('WoSoCenter  •  Football Graphics', 540, 1268, 21, '#e0badf', 700, 'center');
  }
  const columnX = [1004, 944, 526, 459, 391, 325, 261, 194, 129, 73];
  const headers = ['#', 'تیم', 'بازی', 'برد', 'مساوی', 'باخت', 'گل+', 'گل−', 'تفاضل', 'امتیاز'];

  function drawTable(data, logos = new Map()) {
    background();
    const heading = fitText(titleValue(), 970, 42);
    text(heading.value, 993, 162, heading.size, '#fff5ff', 900);
    text(`LIGA F  ·  ${data.season}`, 992, 218, 25, palette().gold, 800);
    roundRect(42, 262, 996, 67, 12, palette().header);
    const teams = data.teams;
    const rowHeight = Math.min(55, Math.floor(840 / teams.length));
    const bodySize = rowHeight >= 50 ? 24 : rowHeight >= 41 ? 20 : 17;
    headers.forEach((label, i) => text(label, columnX[i], 296, i === 1 ? 23 : 18, '#fff8fc', 800, i === 1 ? 'right' : 'center'));
    let y = 340;
    teams.forEach((team, i) => {
      const ry = y + i * rowHeight;
      roundRect(42, ry, 996, rowHeight - 3, 7, i%2 ? '#ffffff0b' : '#ffffff19');
      if (i < 3) roundRect(1028, ry + 3, 5, rowHeight - 9, 3, palette().accent);
      text(team.rank, columnX[0], ry + rowHeight/2, bodySize, '#eee8f0', 800, 'center');
      const teamText = fitText(team.team, 317, bodySize);
      text(teamText.value, 944, ry + rowHeight/2, teamText.size, '#fff7ff', 780);
      const img = logos.get(team.id);
      if (!img) {
        roundRect(564, ry + (rowHeight - 30)/2, 56, 30, 7, palette().header);
        text(String(team.abbreviation || '').slice(0, 4), 592, ry + rowHeight/2, 13, '#fffafa', 800, 'center');
      }
      if (img) {
        try {
          ctx.drawImage(img, 568, ry + (rowHeight - 35)/2, 35, 35);
        } catch { /* A failed logo must not break the poster. */ }
      }
      [team.played,team.win,team.draw,team.loss,team.goalsFor,team.goalsAgainst,team.goalDifference,team.points]
        .forEach((v,j) => text(v, columnX[j+2], ry+rowHeight/2, bodySize - 1,
          j === 7 ? palette().gold : '#dfd8e7', j === 7 ? 900 : 650, 'center'));
    });
    const bottom = y + teams.length * rowHeight + 27;
    roundRect(42, bottom, 996, 2, 1, '#ffffff3a');
    const updated = new Date(data.updatedAt);
    const updatedLabel = Number.isNaN(updated.getTime()) ? '' : updated.toLocaleString('fa-IR', {dateStyle:'medium',timeStyle:'short'});
    text(`زمان دریافت: ${updatedLabel}`, 1016, 1245, 20, '#c9b7d4', 600);
    text(`منبع: ${data.source || 'API Ninjas'} | WoSoCenter`, 65, 1290, 19, '#e6c6ef', 650, 'left');
    text('طراحی گرافیکی ووسو سنتر', 1016, 1290, 20, palette().gold, 800);
  }
  async function loadLogos(data, loadId) {
    const logos = new Map();
    await Promise.all(data.teams.map(team => new Promise(resolve => {
      if (!team.logo) return resolve();
      let done = false;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      const timeout = setTimeout(finish, 2500);
      function finish() { if(done) return; done = true; clearTimeout(timeout); resolve(); }
      image.onload = () => { if (image.naturalWidth) logos.set(team.id, image); finish(); };
      image.onerror = finish;
      image.src = team.logo;
    })));
    if (loadId !== logoLoadId || !currentData) return;
    imageLogos = logos;
    drawTable(data, logos);
  }
  async function fetchStandings() {
    fetchBtn.disabled = true; downloadBtn.disabled = true;
    currentData = null; imageLogos = new Map(); ++logoLoadId;
    status('در حال دریافت اطلاعات جدول از سرور...');
    try {
      const url = new URL(API_URL);
      url.searchParams.set('league', 'ligaf'); url.searchParams.set('season', seasonEl.value);
      const response = await fetch(url.toString(), {method:'GET',cache:'no-store'});
      const payload = await response.json();
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.detail || payload.error || `خطای HTTP ${response.status}`);
      }
      if (!Array.isArray(payload.teams) || payload.teams.length === 0 ||
          !payload.teams.every(t => t.team && Number.isFinite(Number(t.points)))) {
        throw new Error('اطلاعات جدول ناقص یا نامعتبر است.');
      }
      // Ensure sorting even when an API changes its initial ordering.
      payload.teams.sort((a,b) => Number(a.rank)-Number(b.rank));
      currentData = payload;
      imageLogos = new Map();
      await document.fonts.ready;
      drawTable(payload);
      downloadBtn.disabled = false;
      status(`${payload.teams.length} تیم از ${payload.leagueName || 'Liga F'} دریافت شد. تصویر آماده دانلود است.`, 'success');
      const id = ++logoLoadId;
      // Remote logos are optional: downloading stays available immediately.
      loadLogos(payload, id).catch(() => {});
    } catch (error) {
      drawEmpty();
      status(`دریافت جدول ناموفق بود: ${error.message}. ابتدا خروجی آدرس /api/standings ورکر را بررسی کن.`, 'error');
    } finally { fetchBtn.disabled = false; }
  }
  function download() {
    if (!currentData) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `WoSoCenter-LigaF-${seasonEl.value}.png`;
    document.body.appendChild(link);link.click();link.remove();
    status('تصویر PNG برای دانلود آماده شد.', 'success');
  }
  const redraw = () => {if(currentData) drawTable(currentData, imageLogos); else drawEmpty();};
  let imageLogos = new Map();
  titleEl.addEventListener('input', redraw);
  themeEl.addEventListener('change', redraw);
  fetchBtn.addEventListener('click', fetchStandings);
  downloadBtn.addEventListener('click', download);
  seasonEl.addEventListener('change', () => {
    ++logoLoadId; currentData = null; imageLogos = new Map();
    downloadBtn.disabled = true; drawEmpty();
    status('فصل تغییر کرد. دوباره «دریافت اطلاعات آنلاین» را بزن.');
  });
  if (ctx) drawEmpty();
})();
