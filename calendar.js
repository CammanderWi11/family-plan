// ========== CALENDAR ==========
(function() {
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayLabels = ['L','M','X','J','V','S','D'];

  // Default config — used when no saved config exists
  const DEFAULT_CONFIG = {
    shiftRef: '2026-04-03',
    shiftCycle: 9,
    shiftDaysOff: 3,
    mandatory: { start: '2026-04-17', end: '2026-05-28' },
    flexibleBlocks: [
      { label: 'Bloque 1 – Junio', start: '2026-06-26', end: '2026-07-02' },
      { label: 'Bloque 2 – Agosto', start: '2026-08-10', end: '2026-08-16' },
      { label: 'Bloque 3 – La Graciosa', start: '2026-11-08', end: '2026-11-14' },
      { label: 'Bloque 4 – Navidad', start: '2026-12-23', end: '2026-12-29' },
      { label: 'Bloque 5 – Año Nuevo', start: '2026-12-30', end: '2027-01-05' },
      { label: 'Bloque 6 – Enero', start: '2027-01-06', end: '2027-01-12' },
      { label: 'Bloque 7 – Japón I', start: '2027-03-26', end: '2027-04-01' },
      { label: 'Bloque 8 – Japón II', start: '2027-04-02', end: '2027-04-08' },
      { label: 'Bloque 9 – Japón III', start: '2027-04-09', end: '2027-04-15' },
    ],
    annualLeave: [
      { label: 'Semana Santa', start: '2026-04-21', end: '2026-05-02' },
      { label: 'Otoño', start: '2026-09-21', end: '2026-10-02' },
      { label: 'Diciembre', start: '2026-12-11', end: '2026-12-22' },
    ],
    trips: [
      { label: 'Siam Park', start: '2026-06-05', end: '2026-06-07' },
      { label: 'La Graciosa', start: '2026-11-05', end: '2026-11-12' },
      { label: 'Japón', start: '2027-03-26', end: '2027-04-15' },
    ],
    school: { start: '2026-06-22', end: '2026-07-31' },
    lastSchoolDay: '2026-06-19',
    birthDate: '2026-04-17',
  };

  function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

  function getConfig() {
    const saved = window.__calendarConfig;
    return saved || DEFAULT_CONFIG;
  }
  // Expose for settings UI
  window.__defaultCalendarConfig = DEFAULT_CONFIG;

  function daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  function buildHelpers(cfg) {
    const shiftRef = parseDate(cfg.shiftRef);
    const cycle = cfg.shiftCycle || 9;
    const daysOff = cfg.shiftDaysOff || 3;
    const mandatory = { start: parseDate(cfg.mandatory.start), end: parseDate(cfg.mandatory.end) };
    const flexibleBlocks = cfg.flexibleBlocks.map(b => ({ label: b.label, start: parseDate(b.start), end: parseDate(b.end) }));
    const annualLeave = cfg.annualLeave.map(a => ({ label: a.label, start: parseDate(a.start), end: parseDate(a.end) }));
    const trips = cfg.trips.map(t => ({ label: t.label, start: parseDate(t.start), end: parseDate(t.end) }));
    const school = { start: parseDate(cfg.school.start), end: parseDate(cfg.school.end) };
    const lastSchoolDay = cfg.lastSchoolDay ? parseDate(cfg.lastSchoolDay) : null;
    const birthDate = parseDate(cfg.birthDate || cfg.mandatory.start);

    function inRange(d, s, e) { return d >= s && d <= e; }
    function isShiftOff(date) {
      const diff = daysBetween(shiftRef, date);
      const pos = ((diff % cycle) + cycle) % cycle;
      return pos < daysOff;
    }
    function getType(date) {
      if (inRange(date, mandatory.start, mandatory.end)) return 'mandatory';
      for (const b of flexibleBlocks) { if (inRange(date, b.start, b.end)) return 'parental'; }
      for (const a of annualLeave) { if (inRange(date, a.start, a.end)) return 'annual'; }
      return null;
    }
    function isTrip(d) { for (const t of trips) { if (inRange(d, t.start, t.end)) return true; } return false; }
    function isSchool(d) { return inRange(d, school.start, school.end); }
    function isAnnualLeave(d) { for (const a of annualLeave) { if (inRange(d, a.start, a.end)) return true; } return false; }
    function isLastSchoolDay(d) { return lastSchoolDay && d.getTime() === lastSchoolDay.getTime(); }
    function isBirthDay(d) { return d.getTime() === birthDate.getTime(); }

    return { mandatory, flexibleBlocks, annualLeave, trips, school, birthDate, isShiftOff, getType, isTrip, isSchool, isAnnualLeave, isLastSchoolDay, isBirthDay, inRange };
  }

  function renderCalendar(cfg) {
    const container = document.getElementById('yearCalendar');
    if (!container) return;
    container.innerHTML = '';

    const h = buildHelpers(cfg);

    // Parental day count
    let totalParentalDays = 0, totalWorkDays = 0;
    for (let dt = new Date(h.mandatory.start); dt <= h.mandatory.end; dt.setDate(dt.getDate() + 1)) {
      totalParentalDays++; if (!h.isShiftOff(new Date(dt))) totalWorkDays++;
    }
    for (const b of h.flexibleBlocks) {
      for (let dt = new Date(b.start); dt <= b.end; dt.setDate(dt.getDate() + 1)) {
        totalParentalDays++; if (!h.isShiftOff(new Date(dt))) totalWorkDays++;
      }
    }
    const target = document.getElementById('parentalDaySummary');
    if (target) {
      target.innerHTML =
        '<div class="total-box"><div class="num c-purple">' + totalParentalDays + '</div><div class="lbl">Días de permiso (asignados)</div></div>' +
        '<div class="total-box"><div class="num c-pink">' + totalWorkDays + '</div><div class="lbl">Días laborables en turno</div></div>';
    }

    // Render months
    var startYear = h.birthDate.getFullYear(), startMonth = h.birthDate.getMonth();
    var monthsToShow = [];
    for (var i = 0; i < 13; i++) {
      var m = (startMonth + i) % 12;
      var y = startYear + Math.floor((startMonth + i) / 12);
      monthsToShow.push([y, m]);
    }
    container.__monthsToShow = monthsToShow;
    var todayCmp = new Date(); todayCmp.setHours(0,0,0,0);
    for (const [year, month] of monthsToShow) {
      const monthDiv = document.createElement('div');
      monthDiv.className = 'glass cal-month';
      const title = document.createElement('h3');
      title.textContent = monthNames[month] + (year === 2027 ? ' 2027' : '');
      monthDiv.appendChild(title);
      const header = document.createElement('div');
      header.className = 'cal-header';
      for (const lbl of dayLabels) { const s = document.createElement('span'); s.textContent = lbl; header.appendChild(s); }
      monthDiv.appendChild(header);
      const daysDiv = document.createElement('div');
      daysDiv.className = 'cal-days';
      const firstDay = new Date(year, month, 1);
      let startDow = firstDay.getDay() - 1; if (startDow < 0) startDow = 6;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < startDow; i++) { const e = document.createElement('div'); e.className = 'cal-day empty'; daysDiv.appendChild(e); }
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dow = date.getDay();
        const isWeekend = (dow === 0 || dow === 6);
        const shiftOff = h.isShiftOff(date);
        const type = h.getType(date);
        const tripDay = h.isTrip(date);
        const schoolDay = h.isSchool(date);
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        const alsoAnnual = h.isAnnualLeave(date);
        if (type && alsoAnnual && type !== 'annual') {
          cell.classList.add(type === 'mandatory' ? 'split-mandatory-annual' : 'split-parental-annual');
        } else if (type) {
          cell.classList.add(type);
        } else if (isWeekend) {
          cell.classList.add('weekend');
        } else {
          cell.classList.add('workday');
        }
        if (shiftOff) { cell.classList.add('shift-off'); cell.title = 'Día libre de turno'; }
        if (tripDay) cell.classList.add('trip');
        if (schoolDay) cell.classList.add('school');
        if (h.isBirthDay(date)) { cell.classList.add('baby'); cell.title = '¡Nace Luca!'; }
        if (h.isLastSchoolDay(date)) { cell.classList.add('last-school'); cell.title = 'Último día de cole'; }
        if (date.getTime() === todayCmp.getTime()) { cell.classList.add('today'); cell.title = (cell.title ? cell.title + ' · ' : '') + 'Hoy'; }
        daysDiv.appendChild(cell);
      }
      monthDiv.appendChild(daysDiv);
      container.appendChild(monthDiv);
    }

    // Update leave countdown if available
    if (typeof window.updateLeaveCountdown === 'function') {
      window.updateLeaveCountdown(cfg);
    }
    renderLeaveBlocks(cfg);
    renderVacationBlocks(cfg);
    var todayCell = document.querySelector('.cal-day.today');
    if (todayCell) todayCell.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  function fmtBlockDate(d) {
    var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    var day = d.getDate();
    var mon = months[d.getMonth()];
    var yr = d.getFullYear();
    return day + ' ' + mon + (yr !== 2026 ? " '" + String(yr).slice(2) : '');
  }

  function renderLeaveBlocks(cfg) {
    var host = document.getElementById('leave-blocks-table');
    if (!host) return;
    var blocks = [];
    var today = new Date(); today.setHours(0,0,0,0);

    // Mandatory block
    if (cfg.mandatory && cfg.mandatory.start && cfg.mandatory.end) {
      var ms = parseDate(cfg.mandatory.start), me = parseDate(cfg.mandatory.end);
      var days = daysBetween(ms, me) + 1;
      var done = today > me;
      var active = today >= ms && today <= me;
      blocks.push({ label: 'Obligatorio', start: ms, end: me, days: days, mandatory: true, done: done, active: active });
    }

    // Flexible blocks
    (cfg.flexibleBlocks || []).forEach(function(b) {
      if (!b.start || !b.end) return;
      var bs = parseDate(b.start), be = parseDate(b.end);
      var days = daysBetween(bs, be) + 1;
      var done = today > be;
      var active = today >= bs && today <= be;
      blocks.push({ label: b.label || 'Flexible', start: bs, end: be, days: days, mandatory: false, done: done, active: active });
    });

    // Sort chronologically
    blocks.sort(function(a, b) { return a.start - b.start; });

    var totalDays = blocks.reduce(function(s, b) { return s + b.days; }, 0);
    var usedDays = blocks.reduce(function(s, b) {
      if (b.done) return s + b.days;
      if (b.active) return s + daysBetween(b.start, today) + 1;
      return s;
    }, 0);

    var html = '<table class="data-table">';
    html += '<thead><tr><th>Bloque</th><th>Periodo</th><th>D\u00edas</th><th>Estado</th></tr></thead>';
    html += '<tbody>';
    blocks.forEach(function(b) {
      var statusCls = b.done ? 'exp-green' : (b.active ? 'exp-amber' : '');
      var statusLabel = b.done ? 'Completado' : (b.active ? 'En curso' : 'Pendiente');
      var dotColor = b.mandatory ? '#fbbf24' : '#f59e0b';
      var rowCls = b.done ? ' class="muted-row"' : (b.active ? ' class="active-row"' : '');
      html += '<tr' + rowCls + '>';
      html += '<td data-label="Bloque"><span class="status-dot" style="background:' + dotColor + '"></span>' + b.label + '</td>';
      html += '<td data-label="Periodo">' + fmtBlockDate(b.start) + ' \u2013 ' + fmtBlockDate(b.end) + '</td>';
      html += '<td data-label="D\u00edas">' + b.days + '</td>';
      html += '<td data-label="Estado"><span class="' + statusCls + '">' + statusLabel + '</span></td>';
      html += '</tr>';
    });
    html += '<tr class="total-row"><td>Total</td><td>' + usedDays + ' de ' + totalDays + ' d\u00edas usados</td><td>' + totalDays + '</td><td></td></tr>';
    html += '</tbody></table>';
    host.innerHTML = html;
  }

  function renderVacationBlocks(cfg) {
    var host = document.getElementById('vacation-blocks-table');
    if (!host) return;
    var today = new Date(); today.setHours(0,0,0,0);
    var blocks = (cfg.annualLeave || []).map(function(a) {
      if (!a.start || !a.end) return null;
      var s = parseDate(a.start), e = parseDate(a.end);
      var done = today > e;
      var active = today >= s && today <= e;
      return { label: a.label || 'Vacaciones', start: s, end: e, done: done, active: active };
    }).filter(Boolean);

    if (!blocks.length) { host.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Sin vacaciones configuradas</p>'; return; }

    var html = '<table class="data-table">';
    html += '<thead><tr><th>Bloque</th><th>Periodo</th><th>Estado</th></tr></thead>';
    html += '<tbody>';
    blocks.forEach(function(b) {
      var statusCls = b.done ? 'exp-green' : (b.active ? 'exp-amber' : '');
      var statusLabel = b.done ? 'Completado' : (b.active ? 'En curso' : 'Pendiente');
      var rowCls = b.done ? ' class="muted-row"' : (b.active ? ' class="active-row"' : '');
      html += '<tr' + rowCls + '>';
      html += '<td data-label="Bloque"><span class="status-dot" style="background:#4ade80"></span>' + b.label + '</td>';
      html += '<td data-label="Periodo">' + fmtBlockDate(b.start) + ' \u2013 ' + fmtBlockDate(b.end) + '</td>';
      html += '<td data-label="Estado"><span class="' + statusCls + '">' + statusLabel + '</span></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    host.innerHTML = html;
  }

  // ========== LEAVE COUNTDOWN ==========
  function fmtShort(d) {
    var s = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
    if (d.getFullYear() !== new Date().getFullYear()) s += '/' + d.getFullYear();
    return s;
  }

  window.updateLeaveCountdown = function(cfg) {
    const today = new Date(); today.setHours(0,0,0,0);

    // Total entitlement: 19 weeks = 133 days
    const TOTAL_ENTITLEMENT = 133;

    // Build sorted list of all leave blocks
    const allBlocks = [];
    if (cfg.mandatory && cfg.mandatory.start && cfg.mandatory.end) {
      allBlocks.push({ label: 'Obligatorio', start: parseDate(cfg.mandatory.start), end: parseDate(cfg.mandatory.end) });
    }
    (cfg.flexibleBlocks || []).forEach(b => {
      if (b.start && b.end) allBlocks.push({ label: b.label || 'Flexible', start: parseDate(b.start), end: parseDate(b.end) });
    });
    allBlocks.sort((a, b) => a.start - b.start);

    // Calculate days used
    let daysUsed = 0;
    let currentBlock = null;
    let nextBlock = null;

    for (const block of allBlocks) {
      const blockDays = daysBetween(block.start, block.end) + 1;

      if (today > block.end) {
        daysUsed += blockDays;
      } else if (today >= block.start && today <= block.end) {
        daysUsed += daysBetween(block.start, today) + 1;
        currentBlock = block;
      } else if (!nextBlock && today < block.start) {
        nextBlock = block;
      }
    }

    const remaining = TOTAL_ENTITLEMENT - daysUsed;

    // Days off until next work day (factors in leave block end + shift pattern)
    function nextWorkDay(date) {
      const shiftRef = parseDate(cfg.shiftRef);
      const cycle = cfg.shiftCycle || 9;
      const off = cfg.shiftDaysOff || 3;
      const d = new Date(date);
      for (let i = 0; i < 30; i++) {
        const diff = daysBetween(shiftRef, d);
        const pos = ((diff % cycle) + cycle) % cycle;
        if (pos >= off) return d;
        d.setDate(d.getDate() + 1);
      }
      return d;
    }

    let daysOff = '—';
    if (currentBlock) {
      const ret = new Date(currentBlock.end); ret.setDate(ret.getDate() + 1);
      const returnDate = nextWorkDay(ret);
      daysOff = daysBetween(today, returnDate);
    } else if (nextBlock) {
      // Not on leave — show days until next work day (today or next shift day)
      daysOff = 0;
    }

    // Update DOM
    var el;

    // Status banner
    var statusEl = document.getElementById('cd-status');
    if (statusEl) {
      if (currentBlock) {
        var daysInBlock = daysBetween(currentBlock.start, currentBlock.end) + 1;
        var dayNum = daysBetween(currentBlock.start, today) + 1;
        var blockLabel = currentBlock.label === 'Obligatorio' ? 'Paternidad Obligatoria' : ('Paternidad \u2014 ' + currentBlock.label);
        statusEl.textContent = '\u25CF ' + blockLabel + ' (d\u00eda ' + dayNum + ' de ' + daysInBlock + ')';
        statusEl.style.color = 'var(--green)';
      } else if (nextBlock) {
        statusEl.textContent = '\u25CB TRABAJANDO \u2014 pr\u00f3ximo permiso en ' + daysBetween(today, nextBlock.start) + ' d\u00edas';
        statusEl.style.color = 'var(--text-muted)';
      } else {
        statusEl.textContent = '\u25A0 PATERNIDAD COMPLETADA';
        statusEl.style.color = 'var(--text-muted)';
      }
    }

    // Stat cards
    el = document.getElementById('cd-used'); if (el) el.textContent = daysUsed;
    el = document.getElementById('cd-remaining'); if (el) el.textContent = remaining;
    el = document.getElementById('cd-days-off'); if (el) el.textContent = daysOff;

    // Progress bar with label
    var pct = TOTAL_ENTITLEMENT ? Math.round((daysUsed / TOTAL_ENTITLEMENT) * 100) : 0;
    el = document.getElementById('cd-progress');
    if (el) el.style.width = pct + '%';
    var progLabel = document.getElementById('cd-progress-label');
    if (progLabel) progLabel.textContent = daysUsed + ' de ' + TOTAL_ENTITLEMENT + ' d\u00edas usados (' + pct + '%)';

  };

  // ========== EXTERNAL ICS CALENDARS ==========
  var ICS_KEY = 'fp-ics-urls';
  var ICS_CACHE_KEY = 'fp-ics-events';
  var CORS_PROXIES = [
    { prefix: 'https://corsproxy.io/?', encode: true },
    { prefix: 'https://api.allorigins.win/raw?url=', encode: true },
    { prefix: 'https://cors-proxy.fringe.zone/', encode: false },
  ];
  var icsDebugLog = [];
  var externalEvents = {}; // dateKey -> [{summary, calIndex}]

  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function parseICS(text, calIndex) {
    var events = [];
    var blocks = text.split('BEGIN:VEVENT');
    for (var i = 1; i < blocks.length; i++) {
      var block = blocks[i].split('END:VEVENT')[0];
      // Unfold lines (RFC 5545: line starting with space/tab is continuation)
      block = block.replace(/\r?\n[ \t]/g, '');
      var summary = '', dtstart = '', dtend = '';
      var lines = block.split(/\r?\n/);
      for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (line.match(/^SUMMARY[;:]/)) summary = line.replace(/^SUMMARY[^:]*:/, '');
        if (line.match(/^DTSTART[;:]/)) dtstart = line.replace(/^DTSTART[^:]*:/, '');
        if (line.match(/^DTEND[;:]/)) dtend = line.replace(/^DTEND[^:]*:/, '');
      }
      if (!dtstart || !summary) continue;
      var allDay = isAllDay(dtstart);
      var startDate = parseICSDate(dtstart);
      var endDate = dtend ? parseICSDate(dtend) : startDate;
      if (!startDate) continue;
      // Build time label (start time only)
      var timeLabel = null;
      var sortMinutes = allDay ? -1 : startDate.getHours() * 60 + startDate.getMinutes();
      if (!allDay) {
        timeLabel = fmtTime(startDate);
      }
      // For date-only comparisons, normalize to midnight
      var startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      var endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      // For all-day events, DTEND is exclusive
      if (allDay && dtend && isAllDay(dtend)) {
        endDay.setDate(endDay.getDate() - 1);
      }
      // Add event for each day in range
      var cur = new Date(startDay);
      while (cur <= endDay) {
        var key = dateKey(cur);
        if (!events[key]) events[key] = [];
        events[key] = events[key] || [];
        events[key].push({ summary: summary, calIndex: calIndex, time: timeLabel, sortMin: sortMinutes });
        cur = new Date(cur); cur.setDate(cur.getDate() + 1);
      }
    }
    return events;
  }

  function parseICSDate(s) {
    if (!s) return null;
    s = s.replace(/[^0-9TZ]/g, '');
    if (s.length >= 8) {
      var y = parseInt(s.substr(0, 4), 10);
      var m = parseInt(s.substr(4, 2), 10) - 1;
      var d = parseInt(s.substr(6, 2), 10);
      if (s.length >= 15) {
        var hh = parseInt(s.substr(9, 2), 10);
        var mm = parseInt(s.substr(11, 2), 10);
        if (s.indexOf('Z') > -1) {
          return new Date(Date.UTC(y, m, d, hh, mm));
        }
        return new Date(y, m, d, hh, mm);
      }
      return new Date(y, m, d);
    }
    return null;
  }

  function fmtTime(d) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function isAllDay(raw) {
    return raw && raw.replace(/[^0-9TZ]/g, '').length === 8;
  }

  function loadICSUrls() {
    // Prefer synced state (Supabase), fall back to localStorage for migration
    if (window.__getICSUrls) {
      var synced = window.__getICSUrls();
      if (synced) return synced;
    }
    try { return JSON.parse(localStorage.getItem(ICS_KEY) || '[]'); } catch(e) { return []; }
  }

  function saveICSUrls(urls) {
    // Save to synced state so all devices get them
    if (window.__updateICSUrls) {
      window.__updateICSUrls(urls);
    }
    // Also keep localStorage as fallback
    try { localStorage.setItem(ICS_KEY, JSON.stringify(urls)); } catch(e) {}
  }

  function loadCachedEvents() {
    try {
      var cached = JSON.parse(localStorage.getItem(ICS_CACHE_KEY) || '{}');
      if (cached.events && cached.ts && (Date.now() - cached.ts) < 30 * 60000) {
        externalEvents = cached.events;
        return true;
      }
    } catch(e) {}
    return false;
  }

  function saveCachedEvents() {
    try { localStorage.setItem(ICS_CACHE_KEY, JSON.stringify({ events: externalEvents, ts: Date.now() })); } catch(e) {}
  }

  function fetchWithProxy(httpsUrl, proxyIdx) {
    if (proxyIdx >= CORS_PROXIES.length) {
      return Promise.reject(new Error('All CORS proxies failed'));
    }
    var proxy = CORS_PROXIES[proxyIdx];
    var proxyUrl = proxy.prefix + (proxy.encode ? encodeURIComponent(httpsUrl) : httpsUrl);
    return fetch(proxyUrl).then(function(r) {
      if (!r.ok) throw new Error('Proxy ' + proxyIdx + ' returned ' + r.status);
      return r.text();
    }).then(function(text) {
      if (text.indexOf('BEGIN:VCALENDAR') === -1) throw new Error('Proxy ' + proxyIdx + ' returned non-ICS content');
      return text;
    }).catch(function(err) {
      console.warn('ICS proxy ' + proxyIdx + ' failed:', err.message);
      return fetchWithProxy(httpsUrl, proxyIdx + 1);
    });
  }

  function fetchAllICS(callback) {
    var urls = loadICSUrls().filter(function(u) { return u && u.trim(); });
    icsDebugLog = [];
    if (!urls.length) {
      icsDebugLog.push('No ICS URLs configured');
      externalEvents = {};
      if (callback) callback();
      return;
    }
    icsDebugLog.push(urls.length + ' ICS feed(s) configured');
    var pending = urls.length;
    var allEvents = {};
    urls.forEach(function(url, idx) {
      var fetchUrl = url.replace(/^webcal:\/\//, 'https://');
      fetchWithProxy(fetchUrl, 0)
        .then(function(text) {
          var parsed = parseICS(text, idx);
          var dayCount = 0;
          for (var key in parsed) {
            if (!allEvents[key]) allEvents[key] = [];
            allEvents[key] = allEvents[key].concat(parsed[key]);
            dayCount++;
          }
          icsDebugLog.push('Feed ' + (idx + 1) + ': ' + dayCount + ' days with events');
        })
        .catch(function(err) {
          icsDebugLog.push('Feed ' + (idx + 1) + ': FAILED — ' + err.message);
        })
        .finally(function() {
          pending--;
          if (pending <= 0) {
            externalEvents = allEvents;
            var totalDays = Object.keys(externalEvents).length;
            icsDebugLog.push('Total: ' + totalDays + ' days with events');
            saveCachedEvents();
            if (callback) callback();
          }
        });
    });
  }

  function getEventsForDate(date) {
    return externalEvents[dateKey(date)] || [];
  }

  // Expose for calendar rendering
  window.__icsGetEvents = getEventsForDate;

  // Apply event dots to already-rendered calendar
  var tooltip = null;

  function hideTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null; }
  }

  function showTooltip(cell, evts) {
    hideTooltip();
    tooltip = document.createElement('div');
    tooltip.className = 'ics-tooltip';
    var sorted = evts.slice().sort(function(a, b) { return (a.sortMin || 0) - (b.sortMin || 0); });
    tooltip.innerHTML = sorted.map(function(e) {
      var timeHtml = e.time ? '<span class="ics-tooltip-time">' + e.time + '</span> ' : '';
      return '<div class="ics-tooltip-item"><span class="ics-dot ics-dot-' + e.calIndex + '"></span>' +
        '<span>' + timeHtml + e.summary + '</span></div>';
    }).join('');
    document.body.appendChild(tooltip);
    var rect = cell.getBoundingClientRect();
    var top = rect.bottom + 6;
    var left = rect.left + rect.width / 2 - 110;
    if (left < 8) left = 8;
    if (left + 220 > window.innerWidth) left = window.innerWidth - 228;
    if (top + 100 > window.innerHeight) top = rect.top - tooltip.offsetHeight - 6;
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  function applyEventDots() {
    var cells = document.querySelectorAll('.cal-day[data-date]');
    cells.forEach(function(cell) {
      var evts = externalEvents[cell.dataset.date];
      if (evts && evts.length) {
        cell.classList.add('has-ics-event');
        // Add dots
        var dotsEl = cell.querySelector('.ics-dots');
        if (!dotsEl) {
          dotsEl = document.createElement('div');
          dotsEl.className = 'ics-dots';
          cell.appendChild(dotsEl);
        }
        var calIndices = [];
        evts.forEach(function(e) { if (calIndices.indexOf(e.calIndex) === -1) calIndices.push(e.calIndex); });
        dotsEl.innerHTML = calIndices.map(function(ci) { return '<span class="ics-dot ics-dot-' + ci + '"></span>'; }).join('');
        // Tooltip on click/tap
        cell.addEventListener('click', function(e) {
          e.stopPropagation();
          showTooltip(cell, evts);
        });
        // Tooltip on hover (desktop)
        cell.addEventListener('mouseenter', function() { showTooltip(cell, evts); });
        cell.addEventListener('mouseleave', hideTooltip);
      }
    });
  }

  // Dismiss tooltip on outside click
  document.addEventListener('click', hideTooltip);

  // Patch renderCalendar to add data-date attributes
  var _origRender = renderCalendar;
  renderCalendar = function(cfg) {
    _origRender(cfg);
    // Add data-date to all day cells for event overlay
    var container = document.getElementById('yearCalendar');
    if (!container) return;
    var months = container.querySelectorAll('.cal-month');
    var monthsToShow = container.__monthsToShow || [];
    months.forEach(function(monthDiv, mi) {
      if (mi >= monthsToShow.length) return;
      var year = monthsToShow[mi][0], month = monthsToShow[mi][1];
      var dayCells = monthDiv.querySelectorAll('.cal-day:not(.empty)');
      dayCells.forEach(function(cell, di) {
        var d = new Date(year, month, di + 1);
        cell.dataset.date = dateKey(d);
      });
    });
    applyEventDots();
  };

  // Migrate localStorage ICS URLs to synced state on first load
  function migrateICSUrls() {
    if (!window.__getICSUrls || !window.__updateICSUrls) return;
    var synced = window.__getICSUrls();
    if (synced && synced.some(function(u) { return u && u.trim(); })) return; // already synced
    try {
      var local = JSON.parse(localStorage.getItem(ICS_KEY) || '[]');
      if (local.some(function(u) { return u && u.trim(); })) {
        window.__updateICSUrls(local);
      }
    } catch(e) {}
  }

  // Settings UI
  function initICSSettings() {
    migrateICSUrls();
    var urls = loadICSUrls();
    for (var i = 0; i < 3; i++) {
      var input = document.getElementById('cfg-ics-' + (i + 1));
      if (input && urls[i]) input.value = urls[i];
    }
    var saveBtn = document.getElementById('cfg-ics-save');
    var statusEl = document.getElementById('cfg-ics-status');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var newUrls = [];
        for (var i = 0; i < 3; i++) {
          var input = document.getElementById('cfg-ics-' + (i + 1));
          newUrls.push(input ? input.value.trim() : '');
        }
        saveICSUrls(newUrls);
        if (statusEl) statusEl.textContent = 'Cargando calendarios...';
        // Clear cache to force re-fetch
        try { localStorage.removeItem(ICS_CACHE_KEY); } catch(e) {}
        fetchAllICS(function() {
          if (statusEl) statusEl.textContent = icsDebugLog.join(' · ');
          renderCalendar(getConfig());
        });
      });
    }
  }

  // Public API
  window.rebuildCalendar = function() {
    renderCalendar(getConfig());
  };
  window.getCalendarConfig = getConfig;
  window.__calendarHelpers = { daysBetween: daysBetween, parseDate: parseDate, buildHelpers: buildHelpers };
  window.__icsDebugLog = function() { return icsDebugLog; };

  // Initial render
  if (loadCachedEvents()) {
    icsDebugLog.push('Loaded from cache (' + Object.keys(externalEvents).length + ' days)');
    renderCalendar(getConfig());
    // Still refresh in background
    fetchAllICS(function() { renderCalendar(getConfig()); });
  } else {
    renderCalendar(getConfig());
    fetchAllICS(function() { renderCalendar(getConfig()); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initICSSettings);
  } else {
    initICSSettings();
  }
})();
