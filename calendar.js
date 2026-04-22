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
    const monthsToShow = [
      [2026,3],[2026,4],[2026,5],[2026,6],[2026,7],[2026,8],
      [2026,9],[2026,10],[2026,11],[2027,0],[2027,1],[2027,2],[2027,3]
    ];
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
        const todayCmp = new Date(); todayCmp.setHours(0,0,0,0);
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
  }

  // ========== LEAVE COUNTDOWN ==========
  function fmtShort(d) {
    var s = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
    if (d.getFullYear() !== new Date().getFullYear()) s += '/' + d.getFullYear();
    return s;
  }

  window.updateLeaveCountdown = function(cfg) {
    const today = new Date(); today.setHours(0,0,0,0);
    const birthDate = parseDate(cfg.birthDate || cfg.mandatory.start);

    // Build sorted list of all leave blocks
    const allBlocks = [];
    if (cfg.mandatory && cfg.mandatory.start && cfg.mandatory.end) {
      allBlocks.push({ label: 'Obligatorio', start: parseDate(cfg.mandatory.start), end: parseDate(cfg.mandatory.end) });
    }
    (cfg.flexibleBlocks || []).forEach(b => {
      if (b.start && b.end) allBlocks.push({ label: b.label || 'Flexible', start: parseDate(b.start), end: parseDate(b.end) });
    });
    allBlocks.sort((a, b) => a.start - b.start);

    // Calculate totals
    let totalAssigned = 0;
    let daysUsed = 0;
    let currentBlock = null;
    let nextBlock = null;

    for (const block of allBlocks) {
      const blockDays = daysBetween(block.start, block.end) + 1;
      totalAssigned += blockDays;

      if (today > block.end) {
        daysUsed += blockDays;
      } else if (today >= block.start && today <= block.end) {
        daysUsed += daysBetween(block.start, today) + 1;
        currentBlock = block;
      } else if (!nextBlock && today < block.start) {
        nextBlock = block;
      }
    }

    const remaining = totalAssigned - daysUsed;

    // Next block info
    let nextText = '—';
    let nextLabel = 'Siguiente bloque';
    if (currentBlock) {
      const daysLeft = daysBetween(today, currentBlock.end);
      nextText = daysLeft + 'd restantes';
      nextLabel = currentBlock.label || 'De permiso';
    } else if (nextBlock) {
      const daysUntil = daysBetween(today, nextBlock.start);
      nextText = 'en ' + daysUntil + 'd';
      nextLabel = (nextBlock.label || 'Siguiente') + ' · ' + fmtShort(nextBlock.start);
    } else {
      nextText = '—';
      nextLabel = 'Todos los bloques completados';
    }

    // Return to work: first working day (not a shift day off) after block ends
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
    let returnText = '—';
    let returnSub = '';
    if (currentBlock) {
      const ret = new Date(currentBlock.end); ret.setDate(ret.getDate() + 1);
      const returnDate = nextWorkDay(ret);
      const daysUntilReturn = daysBetween(today, returnDate);
      returnText = fmtShort(returnDate);
      returnSub = 'en ' + daysUntilReturn + ' días';
    } else if (nextBlock) {
      const ret = new Date(nextBlock.end); ret.setDate(ret.getDate() + 1);
      returnText = fmtShort(nextWorkDay(ret));
    }

    // Deadlines
    const age1 = new Date(birthDate); age1.setFullYear(age1.getFullYear() + 1);
    const age8 = new Date(birthDate); age8.setFullYear(age8.getFullYear() + 8);
    const daysToAge1 = daysBetween(today, age1);
    const daysToAge8 = daysBetween(today, age8);

    // Update DOM
    var el;

    // Status banner
    var statusEl = document.getElementById('cd-status');
    if (statusEl) {
      if (currentBlock) {
        var daysInBlock = daysBetween(currentBlock.start, currentBlock.end) + 1;
        var dayNum = daysBetween(currentBlock.start, today) + 1;
        statusEl.textContent = '\u25CF EN PERMISO \u2014 ' + currentBlock.label + ' (d\u00eda ' + dayNum + ' de ' + daysInBlock + ')';
        statusEl.style.color = 'var(--green)';
      } else if (nextBlock) {
        statusEl.textContent = '\u25CB TRABAJANDO \u2014 pr\u00f3ximo permiso en ' + daysBetween(today, nextBlock.start) + ' d\u00edas';
        statusEl.style.color = 'var(--text-muted)';
      } else {
        statusEl.textContent = '\u25A0 PERMISO COMPLETADO';
        statusEl.style.color = 'var(--text-muted)';
      }
    }

    // Stat cards
    el = document.getElementById('cd-used'); if (el) el.textContent = daysUsed;
    el = document.getElementById('cd-remaining'); if (el) el.textContent = remaining;
    el = document.getElementById('cd-next-in'); if (el) el.textContent = nextText;
    el = document.getElementById('cd-next-label'); if (el) el.textContent = nextLabel;
    el = document.getElementById('cd-return'); if (el) el.textContent = returnText;
    el = document.getElementById('cd-return-sub'); if (el) el.textContent = returnSub;

    // Block-active highlight on 3rd card
    var gridItems = document.querySelectorAll('#leave-countdown .countdown-item');
    if (gridItems[2]) {
      gridItems[2].classList.toggle('block-active', !!currentBlock);
    }

    // Progress bar with label
    var pct = totalAssigned ? Math.round((daysUsed / totalAssigned) * 100) : 0;
    el = document.getElementById('cd-progress');
    if (el) el.style.width = pct + '%';
    var progLabel = document.getElementById('cd-progress-label');
    if (progLabel) progLabel.textContent = daysUsed + ' de ' + totalAssigned + ' d\u00edas usados (' + pct + '%)';

    // Deadline pills
    var dlEl = document.getElementById('cd-deadlines');
    if (dlEl) {
      var pills = [];
      if (daysToAge1 > 0) {
        var urgency = daysToAge1 < 90 ? ' cd-deadline-urgent' : '';
        pills.push('<span class="cd-deadline' + urgency + '"><strong>FLEX</strong> ' + fmtShort(age1) + ' <span class="cd-deadline-days">' + daysToAge1 + 'd</span></span>');
      }
      pills.push('<span class="cd-deadline cd-deadline-dim"><strong>+ADD</strong> ' + fmtShort(age8) + ' <span class="cd-deadline-days">' + daysToAge8 + 'd</span></span>');
      dlEl.innerHTML = pills.join('');
    }
  };

  // Public API
  window.rebuildCalendar = function() {
    renderCalendar(getConfig());
  };
  window.getCalendarConfig = getConfig;
  window.__calendarHelpers = { daysBetween: daysBetween, parseDate: parseDate, buildHelpers: buildHelpers };

  // Initial render
  renderCalendar(getConfig());
})();
