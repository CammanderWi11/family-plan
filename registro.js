// ========== REGISTRO DE LUCA ==========
(function() {

  var LOCAL_KEY = 'fp-luca-log';
  var ACTIVE_KEY = 'fp-luca-active';
  var SHARED_TABLE = 'shared_luca_log';
  var MAX_ACTIVE_AGE = 45 * 60 * 1000; // 45 min — auto-stop forgotten timers

  var TIMER_KEYS = ['breast_left', 'breast_right', 'pump_left', 'pump_right'];

  var TIMER_META = {
    breast_left:  { icon: '\ud83e\udd31', label: 'Pecho izq.',     type: 'breast', side: 'left' },
    breast_right: { icon: '\ud83e\udd31', label: 'Pecho der.',     type: 'breast', side: 'right' },
    pump_left:    { icon: '\ud83c\udf7c', label: 'Sacaleche izq.', type: 'pump',   side: 'left' },
    pump_right:   { icon: '\ud83c\udf7c', label: 'Sacaleche der.', type: 'pump',   side: 'right' }
  };

  var active = {};      // key -> { startedAt, elapsed, intervalId }

  // ---- Active-timer persistence (localStorage + Supabase sync) ----
  function saveActiveTimers() {
    var data = {};
    TIMER_KEYS.forEach(function(key) {
      if (active[key]) {
        data[key] = { startedAt: active[key].startedAt };
      }
    });
    try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(data)); } catch(e) {}
    if (window.__updateActiveTimers) window.__updateActiveTimers(data);
  }

  function clearActiveTimer(key) {
    try {
      var data = JSON.parse(localStorage.getItem(ACTIVE_KEY) || '{}');
      delete data[key];
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
      if (window.__updateActiveTimers) window.__updateActiveTimers(data);
    } catch(e) {}
  }

  function getActiveTimerData() {
    // Prefer synced state, fall back to localStorage
    if (window.__getActiveTimers) {
      var synced = window.__getActiveTimers();
      if (synced) return synced;
    }
    try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || '{}'); } catch(e) { return {}; }
  }

  function restoreActiveTimers() {
    try {
      var data = getActiveTimerData();
      var now = Date.now();
      Object.keys(data).forEach(function(key) {
        if (!TIMER_META[key] || !data[key].startedAt) return;
        var age = now - new Date(data[key].startedAt).getTime();
        if (age > MAX_ACTIVE_AGE) {
          // Auto-register as 45 min feeding (someone forgot to stop)
          clearActiveTimer(key);
          addEntry({
            id: new Date(data[key].startedAt).getTime() + '_' + key,
            type: TIMER_META[key].type,
            side: TIMER_META[key].side,
            startedAt: data[key].startedAt,
            durationSeconds: 45 * 60
          });
          return;
        }
        startTimer(key, data[key].startedAt);
      });
    } catch(e) {}
  }
  var viewDate = new Date(); // the date currently shown in the log
  var heroInterval = null;

  // ---- Storage ----
  function getLog() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch(e) { return []; }
  }

  function saveLogLocal(log) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(log)); } catch(e) {}
  }

  // Push a single entry to shared Supabase table
  function pushEntry(entry) {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      window.sb.from(SHARED_TABLE).insert({
        entry_id: entry.id,
        type: entry.type,
        side: entry.side || null,
        started_at: entry.startedAt,
        duration_seconds: entry.durationSeconds || 0,
        ml: entry.ml || null,
        created_by: session.user.id
      }).then(function() {});
    });
  }

  // Delete entry from shared Supabase table
  function deleteEntry(entryId) {
    if (!window.sb || !window.__authReady) return;
    window.sb.from(SHARED_TABLE).delete().eq('entry_id', entryId).then(function() {});
  }

  // Update entry duration in shared Supabase table
  function updateEntryDuration(entryId, durationSeconds) {
    if (!window.sb || !window.__authReady) return;
    window.sb.from(SHARED_TABLE).update({ duration_seconds: durationSeconds })
      .eq('entry_id', entryId).then(function() {});
  }

  // Pull all entries from shared table, replace local cache
  function pullSharedLog() {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      window.sb.from(SHARED_TABLE).select('*').order('started_at', { ascending: false }).then(function(res2) {
        if (res2.data && Array.isArray(res2.data)) {
          var log = res2.data.map(function(row) {
            return {
              id: row.entry_id,
              type: row.type,
              side: row.side,
              startedAt: row.started_at,
              durationSeconds: row.duration_seconds,
              ml: row.ml || null
            };
          });
          saveLogLocal(log);
          renderAll();
        }
      });
    });
  }

  // Save entry locally and push to shared table
  function addEntry(entry) {
    var log = getLog();
    log.unshift(entry);
    saveLogLocal(log);
    pushEntry(entry);
  }

  // Remove entry locally and from shared table
  function removeEntry(entryId) {
    saveLogLocal(getLog().filter(function(e) { return e.id !== entryId; }));
    deleteEntry(entryId);
  }

  // Update duration locally and in shared table
  function editDuration(entryId, newSeconds) {
    var log = getLog();
    for (var i = 0; i < log.length; i++) {
      if (log[i].id === entryId) { log[i].durationSeconds = newSeconds; break; }
    }
    saveLogLocal(log);
    updateEntryDuration(entryId, newSeconds);
  }

  // ---- Date helpers ----
  function isSameDay(iso, date) {
    var d = new Date(iso);
    return d.getFullYear() === date.getFullYear() &&
           d.getMonth()    === date.getMonth() &&
           d.getDate()     === date.getDate();
  }

  function isToday(date) {
    var n = new Date();
    return date.getFullYear() === n.getFullYear() &&
           date.getMonth()    === n.getMonth() &&
           date.getDate()     === n.getDate();
  }

  function isYesterday(date) {
    var y = new Date(); y.setDate(y.getDate() - 1);
    return date.getFullYear() === y.getFullYear() &&
           date.getMonth()    === y.getMonth() &&
           date.getDate()     === y.getDate();
  }

  function fmtDateLabel(date) {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    var days = ['Dom','Lun','Mar','Mi\u00e9','Jue','Vie','S\u00e1b'];
    var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return days[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth()];
  }

  // ---- Format helpers ----
  function fmtDuration(secs) {
    var m = Math.round(secs / 60);
    if (m === 0) return '<1min';
    return m + 'min';
  }

  function fmtDurationLive(secs) {
    var m = Math.floor(secs / 60), s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function fmtInterval(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (h > 0) return h + 'h ' + (m > 0 ? m + 'min' : '');
    return m + 'min';
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function elapsedSince(iso) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  }

  function fmtElapsed(secs) {
    if (secs < 60) return 'Ahora mismo';
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (h > 0) return 'Hace ' + h + 'h ' + (m > 0 ? m + 'min' : '');
    return 'Hace ' + m + 'min';
  }

  // ---- Timer ----
  function startTimer(key, resumeFrom) {
    if (active[key]) return;
    var startedAt = resumeFrom || new Date().toISOString();
    var elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    var id = setInterval(function() {
      if (!active[key]) { clearInterval(id); return; }
      active[key].elapsed = Math.floor((Date.now() - new Date(active[key].startedAt).getTime()) / 1000);
      refreshBtn(key);
      renderHero();
    }, 1000);
    active[key] = { startedAt: startedAt, elapsed: elapsed, intervalId: id };
    saveActiveTimers();
    refreshBtn(key);
  }

  function stopTimer(key) {
    if (!active[key]) return;
    clearInterval(active[key].intervalId);
    var entry = {
      id: Date.now() + '_' + key,
      type: TIMER_META[key].type,
      side: TIMER_META[key].side,
      startedAt: active[key].startedAt,
      durationSeconds: active[key].elapsed
    };
    active[key] = null;
    clearActiveTimer(key);
    addEntry(entry);
    refreshBtn(key);
    renderAll();
  }

  function refreshBtn(key) {
    var btn = document.getElementById('reg-btn-' + key);
    if (!btn) return;
    var meta = TIMER_META[key];
    var isActive = !!active[key];
    var elapsed = isActive ? active[key].elapsed : 0;
    var lastLog = null;
    var isLastUsed = false;

    var isNextSide = false;
    if (!isActive) {
      var log = getLog().filter(function(e) { return isToday(new Date(e.startedAt)); });
      lastLog = log.find(function(e) { return e.type === meta.type && e.side === meta.side; }) || null;
      if (lastLog && meta.type === 'breast') {
        var lastBreast = log.find(function(e) { return e.type === 'breast'; });
        isLastUsed = lastBreast && lastBreast.id === lastLog.id;
      }
      // Determine next side for breast buttons
      if (meta.type === 'breast') {
        var allBreast = getLog().filter(function(e) { return e.type === 'breast'; });
        var lastAnyBreast = allBreast[0] || null;
        if (lastAnyBreast) {
          isNextSide = lastAnyBreast.side !== meta.side;
        }
      }
    }

    btn.className = 'timer-btn'
      + (isActive ? ' timer-btn-active' : '')
      + (isLastUsed ? ' timer-btn-last' : '')
      + (isNextSide ? ' timer-btn-next' : '');

    var badgeHtml = '';
    if (!isActive && meta.type === 'breast') {
      if (isLastUsed) badgeHtml = '<span class="timer-badge timer-badge-last">\u00faltimo</span>';
      else if (isNextSide) badgeHtml = '<span class="timer-badge timer-badge-next">siguiente</span>';
    }

    btn.innerHTML =
      badgeHtml +
      '<span class="timer-icon">' + meta.icon + '</span>' +
      '<span class="timer-label">' + meta.label + '</span>' +
      (isActive
        ? '<span class="timer-elapsed">' + fmtDurationLive(elapsed) + '</span>'
        : (lastLog
            ? '<span class="timer-last">' + fmtDuration(lastLog.durationSeconds) + '</span>'
            : '<span class="timer-tap">Iniciar</span>'));
  }

  // ---- Manual breast entry ----
  function saveManualBreast() {
    var timeInput = document.getElementById('reg-manual-breast-time');
    var durInput  = document.getElementById('reg-manual-breast-dur');
    var sideInput = document.getElementById('reg-manual-breast-side');
    if (!timeInput || !timeInput.value || !durInput || !sideInput) return;
    var durMins = parseInt(durInput.value, 10);
    if (!durMins || durMins <= 0) return;
    // Build startedAt from the time input + selected date
    var dateInput = document.getElementById('reg-manual-date');
    var parts = timeInput.value.split(':');
    var d = dateInput && dateInput.value ? new Date(dateInput.value) : new Date();
    d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    var entry = {
      id: Date.now() + '_manual_breast',
      type: 'breast',
      side: sideInput.value,
      startedAt: d.toISOString(),
      durationSeconds: durMins * 60
    };
    addEntry(entry);
    timeInput.value = '';
    durInput.value = '';
    renderAll();
  }

  // ---- Bottle input ----
  function saveBottle() {
    var input = document.getElementById('reg-bottle-ml');
    if (!input) return;
    var ml = parseInt(input.value, 10);
    if (!ml || ml <= 0) return;
    var dateInput = document.getElementById('reg-manual-date');
    var d = dateInput && dateInput.value ? new Date(dateInput.value + 'T' + new Date().toTimeString().slice(0, 5)) : new Date();
    var entry = {
      id: Date.now() + '_bottle',
      type: 'bottle',
      side: null,
      startedAt: d.toISOString(),
      durationSeconds: 0,
      ml: ml
    };
    addEntry(entry);
    input.value = '';
    renderAll();
  }

  // ---- Hero: active feed or última toma ----
  function getActiveBreast() {
    if (active.breast_left) return { key: 'breast_left', side: 'left', label: 'Pecho Izquierdo', elapsed: active.breast_left.elapsed };
    if (active.breast_right) return { key: 'breast_right', side: 'right', label: 'Pecho Derecho', elapsed: active.breast_right.elapsed };
    return null;
  }

  function renderHero() {
    var el = document.getElementById('reg-hero');
    if (!el) return;

    // Check for active breast feeding
    var activeFeed = getActiveBreast();
    if (activeFeed) {
      var sideClass = activeFeed.side === 'left' ? 'caregiver-badge caregiver-mum' : 'caregiver-badge caregiver-daddey';
      el.className = 'glass reg-hero reg-hero-active';
      el.innerHTML =
        '<div class="reg-hero-label">TOMA ACTUAL</div>' +
        '<div class="reg-hero-elapsed">' + fmtDurationLive(activeFeed.elapsed) + '</div>' +
        '<div class="reg-hero-next-side"><span class="' + sideClass + '">' + activeFeed.label + '</span></div>';
      return;
    }

    var log = getLog();
    var lastAny = log[0] || null;
    var lastBreast = log.filter(function(e) { return e.type === 'breast'; })[0] || null;

    if (!lastAny) {
      el.className = 'glass reg-hero';
      el.innerHTML =
        '<div class="reg-hero-label">PR\u00d3XIMA TOMA</div>' +
        '<div class="reg-hero-empty">Sin registros a\u00fan \u00b7 inicia el primer timer</div>';
      return;
    }

    var endTime = new Date(new Date(lastAny.startedAt).getTime() + (lastAny.durationSeconds || 0) * 1000);
    var secs = Math.floor((Date.now() - endTime.getTime()) / 1000);
    var isWarning = secs > 3 * 3600;
    var isCritical = secs > 4 * 3600;
    el.className = 'glass reg-hero' + (isCritical ? ' reg-hero-critical' : (isWarning ? ' reg-hero-alert' : ''));

    var nextSideHtml = '';
    if (lastBreast) {
      var nextSide = lastBreast.side === 'left' ? 'Derecho \u2192' : '\u2190 Izquierdo';
      var nextSideClass = lastBreast.side === 'left' ? 'caregiver-badge caregiver-daddey' : 'caregiver-badge caregiver-mum';
      nextSideHtml = '<div class="reg-hero-next-side">Pr\u00f3xima toma <span class="' + nextSideClass + '">' + nextSide + '</span></div>';
    }

    var lastMlHtml = '';
    if (lastAny.type === 'bottle' && lastAny.ml) {
      lastMlHtml = '<div class="reg-hero-next-side">\ud83c\udf7c \u00daltimo biber\u00f3n: ' + lastAny.ml + 'ml</div>';
    }

    var warnHtml = '';
    if (isCritical) {
      warnHtml = '<div class="reg-hero-warn reg-hero-warn-critical">+4h \u00b7 Feed Luca Now!</div>';
    } else if (isWarning) {
      warnHtml = '<div class="reg-hero-warn">Han pasado +3h \u00b7 revisar</div>';
    }

    el.innerHTML =
      '<div class="reg-hero-label">\u00daLTIMA TOMA</div>' +
      '<div class="reg-hero-elapsed' + (isWarning ? ' reg-hero-elapsed-alert' : '') + '">' + fmtElapsed(secs) + '</div>' +
      nextSideHtml +
      lastMlHtml +
      warnHtml;
  }

  function startHeroInterval() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(renderHero, 30000);
  }

  // ---- Breast L/R percentage helper ----
  function breastPct(entries) {
    var leftSecs = 0, rightSecs = 0;
    entries.forEach(function(e) {
      if (e.type !== 'breast') return;
      if (e.side === 'left') leftSecs += e.durationSeconds;
      else if (e.side === 'right') rightSecs += e.durationSeconds;
    });
    var total = leftSecs + rightSecs;
    if (total === 0) return null;
    return { left: Math.round((leftSecs / total) * 100), right: Math.round((rightSecs / total) * 100) };
  }

  // ---- Stats row ----
  function renderStats() {
    var el = document.getElementById('reg-stats');
    if (!el) return;
    var allLog = getLog();
    var dayLog = allLog.filter(function(e) { return isSameDay(e.startedAt, viewDate); });
    var breast = dayLog.filter(function(e) { return e.type === 'breast'; })
      .slice().sort(function(a, b) { return new Date(a.startedAt) - new Date(b.startedAt); });

    // Breast L/R percentages — daily
    var dayPct = breastPct(dayLog);
    var dayPctHtml = dayPct ? dayPct.left + '% / ' + dayPct.right + '%' : '\u2014';

    // Breast L/R percentages — last 7 days
    var sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    var recentLog = allLog.filter(function(e) {
      return new Date(e.startedAt) >= sevenDaysAgo;
    });
    var recentPct = breastPct(recentLog);
    var recentPctHtml = recentPct ? recentPct.left + '% / ' + recentPct.right + '%' : '\u2014';

    var tomasHtml = String(breast.length);

    var avgIntervalHtml = '\u2014';
    if (breast.length >= 2) {
      var intervals = [];
      for (var i = 1; i < breast.length; i++) {
        var prevEnd = new Date(breast[i-1].startedAt).getTime() + (breast[i-1].durationSeconds || 0) * 1000;
        intervals.push((new Date(breast[i].startedAt).getTime() - prevEnd) / 1000);
      }
      var avg = intervals.reduce(function(s, v) { return s + v; }, 0) / intervals.length;
      avgIntervalHtml = fmtInterval(Math.round(avg));
    }

    var avgDurHtml = '\u2014';
    if (breast.length >= 1) {
      var avgDur = breast.reduce(function(s, e) { return s + e.durationSeconds; }, 0) / breast.length;
      avgDurHtml = fmtDuration(Math.round(avgDur));
    }

    // Bottle ml total for the day
    var bottleMl = dayLog.filter(function(e) { return e.type === 'bottle' && e.ml; })
      .reduce(function(s, e) { return s + e.ml; }, 0);
    var bottleHtml = bottleMl > 0 ? bottleMl + 'ml' : '\u2014';

    // Render Izq/Der (hoy) inside the pecho section
    var pctEl = document.getElementById('reg-pecho-pct');
    if (pctEl) {
      pctEl.innerHTML = dayPct
        ? '<span class="reg-pecho-pct-cell"><span class="reg-pecho-pct-chip reg-pecho-pct-chip-left"></span><span class="reg-pecho-pct-val">' + dayPct.left + '%</span></span>' +
          '<span class="reg-pecho-pct-cell"><span class="reg-pecho-pct-chip reg-pecho-pct-chip-right"></span><span class="reg-pecho-pct-val">' + dayPct.right + '%</span></span>'
        : '';
    }

    el.innerHTML =
      '<div class="reg-stat"><span class="reg-stat-val">' + recentPctHtml + '</span><span class="reg-stat-lbl">Izq / Der (7d)</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + tomasHtml + '</span><span class="reg-stat-lbl">Tomas</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + avgIntervalHtml + '</span><span class="reg-stat-lbl">Media entre tomas</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + avgDurHtml + '</span><span class="reg-stat-lbl">Media/sesi\u00f3n</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + bottleHtml + '</span><span class="reg-stat-lbl">Biber\u00f3n</span></div>';
  }

  // ---- Summary strip ----
  function renderSummary() {
    var el = document.getElementById('registro-summary');
    if (!el) return;
    var dayLog = getLog().filter(function(e) { return isSameDay(e.startedAt, viewDate); });
    var breastSecs = dayLog.filter(function(e) { return e.type === 'breast'; })
      .reduce(function(s, e) { return s + e.durationSeconds; }, 0);
    var pumpSecs = dayLog.filter(function(e) { return e.type === 'pump'; })
      .reduce(function(s, e) { return s + e.durationSeconds; }, 0);
    var bottleMl = dayLog.filter(function(e) { return e.type === 'bottle' && e.ml; })
      .reduce(function(s, e) { return s + e.ml; }, 0);
    el.innerHTML =
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83e\udd31 Pecho</span><span class="reg-sum-val">' + (breastSecs > 0 ? fmtDuration(breastSecs) : '\u2014') + '</span></div>' +
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83c\udf7c Sacaleche</span><span class="reg-sum-val">' + (pumpSecs > 0 ? fmtDuration(pumpSecs) : '\u2014') + '</span></div>' +
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83c\udf7c Biber\u00f3n</span><span class="reg-sum-val">' + (bottleMl > 0 ? bottleMl + 'ml' : '\u2014') + '</span></div>';
  }

  // ---- Log ----
  function renderLog() {
    var el = document.getElementById('registro-log');
    if (!el) return;
    var dayLog = getLog().filter(function(e) { return isSameDay(e.startedAt, viewDate); });

    // Date nav
    var todayFlag = isToday(viewDate);
    var navHtml =
      '<div class="reg-nav">' +
      '<button id="reg-prev-day" class="reg-nav-btn">\u2190</button>' +
      '<span class="reg-nav-label" id="reg-date-label">' + fmtDateLabel(viewDate) + '</span>' +
      '<button id="reg-next-day" class="reg-nav-btn"' + (todayFlag ? ' disabled' : '') + '>\u2192</button>' +
      '</div>';

    var logHtml = '';
    if (dayLog.length === 0) {
      logHtml = '<div class="reg-empty">Sin registros ' + (todayFlag ? 'hoy' : 'ese d\u00eda') + '</div>';
    } else {
      dayLog.forEach(function(entry) {
        var icon, typeLbl, detailHtml;
        if (entry.type === 'bottle') {
          icon = '\ud83c\udf7c';
          typeLbl = 'Biber\u00f3n';
          detailHtml = '<span class="reg-entry-dur">' + (entry.ml || 0) + 'ml</span>';
        } else {
          icon = entry.type === 'breast' ? '\ud83e\udd31' : '\ud83c\udf7c';
          typeLbl = entry.type === 'breast' ? 'Pecho' : 'Sacaleche';
          var sideLbl = entry.side === 'left' ? 'Izq' : 'Der';
          typeLbl += ' ' + sideLbl;
          var mins = Math.round(entry.durationSeconds / 60);
          detailHtml = '<span class="reg-entry-dur reg-entry-dur-edit" data-id="' + entry.id + '" data-secs="' + entry.durationSeconds + '" title="Editar duración">' + fmtDuration(entry.durationSeconds) + '</span>';
        }
        var endDate = new Date(new Date(entry.startedAt).getTime() + entry.durationSeconds * 1000);
        var timeRange = fmtTime(entry.startedAt) + '\u2013' + fmtTime(endDate.toISOString());
        logHtml +=
          '<div class="reg-entry">' +
          '<span class="reg-entry-icon">' + icon + '</span>' +
          '<div class="reg-entry-body">' +
            '<span class="reg-entry-name">' + typeLbl + '</span>' +
            detailHtml +
          '</div>' +
          '<span class="reg-entry-time">' + timeRange + '</span>' +
          '<button class="reg-del" data-id="' + entry.id + '" title="Borrar">\u00d7</button>' +
          '</div>';
      });
    }

    el.innerHTML = navHtml + logHtml;

    document.getElementById('reg-prev-day').addEventListener('click', function() {
      viewDate = new Date(viewDate); viewDate.setDate(viewDate.getDate() - 1);
      renderLog(); renderSummary(); renderStats();
    });
    var nextBtn = document.getElementById('reg-next-day');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', function() {
        viewDate = new Date(viewDate); viewDate.setDate(viewDate.getDate() + 1);
        renderLog(); renderSummary(); renderStats();
      });
    }

    el.querySelectorAll('.reg-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        removeEntry(id);
        renderAll();
      });
    });

    el.querySelectorAll('.reg-entry-dur-edit').forEach(function(span) {
      span.addEventListener('click', function() {
        var entryId = span.dataset.id;
        var curSecs = parseInt(span.dataset.secs, 10) || 0;
        var curMins = Math.round(curSecs / 60);
        var input = document.createElement('input');
        input.type = 'number';
        input.className = 'reg-dur-input';
        input.value = curMins;
        input.min = '0';
        input.inputMode = 'numeric';
        span.replaceWith(input);
        input.focus();
        input.select();
        function save() {
          var newMins = parseInt(input.value, 10);
          if (isNaN(newMins) || newMins < 0) newMins = curMins;
          editDuration(entryId, newMins * 60);
          renderAll();
        }
        input.addEventListener('blur', save);
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        });
      });
    });
  }

  function renderAll() {
    renderHero();
    renderStats();
    renderSummary();
    renderLog();
    TIMER_KEYS.forEach(refreshBtn);
  }

  // ---- Section scaffold ----
  function renderSection() {
    var section = document.getElementById('registro');
    if (!section) return;

    var html = '';

    // 1. Pecho buttons
    html += '<div class="glass data-card">';
    html += '<h3 class="reg-sec-title">\ud83e\udd31 Pecho</h3>';
    html += '<div class="reg-timer-row">';
    html += '<button class="timer-btn" id="reg-btn-breast_left"></button>';
    html += '<button class="timer-btn" id="reg-btn-breast_right"></button>';
    html += '</div>';
    html += '<div class="reg-pecho-pct" id="reg-pecho-pct"></div>';
    html += '</div>';

    // 2. Sacaleche
    html += '<div class="glass data-card">';
    html += '<h3 class="reg-sec-title">\ud83c\udf7c Sacaleche</h3>';
    html += '<div class="reg-timer-row">';
    html += '<button class="timer-btn" id="reg-btn-pump_left"></button>';
    html += '<button class="timer-btn" id="reg-btn-pump_right"></button>';
    html += '</div>';
    html += '</div>';

    // 3. Registro manual (Biberón + Pecho manual merged)
    html += '<div class="glass data-card">';
    html += '<h3 class="reg-sec-title">\u270d Registro manual</h3>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';
    html += '<input type="date" id="reg-manual-date" class="reg-bottle-input" value="' + new Date().toISOString().slice(0, 10) + '">';
    html += '<div class="reg-bottle-row" style="flex-wrap:wrap;gap:6px;">';
    html += '<select id="reg-manual-type" class="reg-bottle-input" style="flex:0 0 auto;min-width:110px;padding-right:14px;">';
    html += '<option value="bottle">\ud83c\udf7c Biberón</option>';
    html += '<option value="breast">\ud83e\udd31 Pecho</option>';
    html += '</select>';
    html += '<div id="reg-manual-fields-bottle" style="display:flex;gap:6px;flex:1;min-width:0;">';
    html += '<div class="reg-bottle-input-wrap" style="flex:1;min-width:60px;">';
    html += '<input type="number" id="reg-bottle-ml" class="reg-bottle-input" min="0" step="10" inputmode="numeric" placeholder="0">';
    html += '<span class="reg-bottle-unit">ml</span>';
    html += '</div>';
    html += '</div>';
    html += '<div id="reg-manual-fields-breast" style="display:none;gap:6px;flex:1;min-width:0;">';
    html += '<input type="time" id="reg-manual-breast-time" class="reg-bottle-input" style="flex:1;min-width:0;padding-right:8px;">';
    html += '<div class="reg-bottle-input-wrap" style="flex:1;min-width:0;">';
    html += '<input type="number" id="reg-manual-breast-dur" class="reg-bottle-input" min="1" step="1" inputmode="numeric" placeholder="0" style="width:100%;">';
    html += '<span class="reg-bottle-unit">min</span>';
    html += '</div>';
    html += '<select id="reg-manual-breast-side" class="reg-bottle-input" style="flex:1;min-width:0;padding:10px 6px;padding-right:6px;font-size:14px;">';
    html += '<option value="left">Izq</option>';
    html += '<option value="right">Der</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';
    html += '<button class="btn-primary reg-bottle-btn" id="reg-manual-save" style="width:100%;">Guardar</button>';
    html += '</div>';
    html += '</div>';

    // 4. Última toma hero
    html += '<div class="glass reg-hero" id="reg-hero"></div>';

    // 4.5 Recordatorios (unified)
    html += '<div class="glass data-card">';
    html += '<div class="reg-remind-header"><h3 class="reg-sec-title">\ud83d\udccb Recordatorios</h3><button class="reg-remind-edit-btn" id="reg-remind-edit">\u270f\ufe0f</button></div>';
    html += '<div id="reg-reminders"></div>';
    html += '<div class="reg-reminder-add">';
    html += '<input type="text" id="reg-reminder-text" class="reg-bottle-input" placeholder="Nuevo recordatorio...">';
    html += '<select id="reg-reminder-cat" class="reg-bottle-input" style="width:auto;">';
    html += '<option value="medicina">Medicina</option>';
    html += '<option value="cuidado">Cuidado Diario</option>';
    html += '</select>';
    html += '<select id="reg-reminder-freq" class="reg-bottle-input" style="width:auto;">';
    html += '<option value="daily">Diario</option>';
    html += '<option value="weekly">Semanal</option>';
    html += '</select>';
    html += '<input type="time" id="reg-reminder-time" class="reg-bottle-input" style="width:auto;">';
    html += '<button class="btn-primary" id="reg-reminder-add-btn" style="white-space:nowrap;">A\u00f1adir</button>';
    html += '</div>';
    html += '</div>';

    // 5. Daily log
    html += '<div class="glass data-card"><div id="registro-log"></div></div>';

    // 6. Summary + stats at bottom
    html += '<div class="glass reg-summary" id="registro-summary"></div>';
    html += '<div class="glass data-card reg-stats-card"><div class="reg-stats-row" id="reg-stats"></div></div>';

    section.innerHTML = html;

    TIMER_KEYS.forEach(function(key) {
      var btn = document.getElementById('reg-btn-' + key);
      if (!btn) return;
      btn.addEventListener('click', function() {
        if (active[key]) { stopTimer(key); } else { startTimer(key); }
      });
    });

    // Manual register type toggle
    var manualType = document.getElementById('reg-manual-type');
    var bottleFields = document.getElementById('reg-manual-fields-bottle');
    var breastFields = document.getElementById('reg-manual-fields-breast');
    if (manualType) {
      manualType.addEventListener('change', function() {
        var isBotl = manualType.value === 'bottle';
        bottleFields.style.display = isBotl ? 'flex' : 'none';
        breastFields.style.display = isBotl ? 'none' : 'flex';
      });
    }
    var manualSaveBtn = document.getElementById('reg-manual-save');
    if (manualSaveBtn) {
      manualSaveBtn.addEventListener('click', function() {
        if (manualType.value === 'bottle') saveBottle();
        else saveManualBreast();
      });
    }
    var bottleInput = document.getElementById('reg-bottle-ml');
    if (bottleInput) {
      bottleInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveBottle();
      });
    }

    // Render reminders
    renderReminders();
    var addReminderBtn = document.getElementById('reg-reminder-add-btn');
    if (addReminderBtn) addReminderBtn.addEventListener('click', addCustomReminder);
    var editBtn = document.getElementById('reg-remind-edit');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        reminderEditMode = !reminderEditMode;
        editBtn.textContent = reminderEditMode ? 'Listo' : '\u270f\ufe0f';
        renderReminders();
      });
    }

    pruneOldChecks();
    restoreActiveTimers();
    renderAll();
    startHeroInterval();
  }

  // ---- Reminders (unified) ----
  var reminderEditMode = false;

  var DEFAULT_REMINDERS = [
    { id: 'vitD',      cat: 'medicina', freq: 'daily', text: 'Vitamina D: 2 gotas al d\u00eda', time: null, builtin: true },
    { id: 'entero',    cat: 'medicina', freq: 'daily', text: 'Enterosilicona (c\u00f3licos/eructos): 1 cucharadita cada 8\u201324h', time: null, builtin: true },
    { id: 'bocaAbajo', cat: 'cuidado',  freq: 'daily', text: 'Boca abajo 1 min varias veces al d\u00eda (fortalecer cuello)', time: null, builtin: true },
    { id: 'bano',      cat: 'cuidado',  freq: 'daily', text: 'Ba\u00f1o diario, antes de la \u00faltima toma', time: null, builtin: true },
    { id: 'unas',      cat: 'cuidado',  freq: 'weekly', text: 'Cortarle las u\u00f1as', time: null, dayOfWeek: 0, builtin: true },
    { id: 'pomada',    cat: 'cuidado',  freq: 'daily', text: 'Si enrojecimiento genital: pomada Green Cornress 2\u20133 veces/d\u00eda', time: null, builtin: true },
    { id: 'luz',       cat: 'cuidado',  freq: 'daily', text: '1 min junto a la ventana varias veces al d\u00eda (luz)', time: null, builtin: true }
  ];

  var CAT_LABELS_REM = { medicina: 'Medicina', cuidado: 'Cuidado Diario' };

  function getReminders() {
    try {
      var saved = JSON.parse(localStorage.getItem('fp-reg-reminders'));
      if (saved && saved.length) return saved;
    } catch(e) {}
    return JSON.parse(JSON.stringify(DEFAULT_REMINDERS));
  }
  function saveReminders(list) { localStorage.setItem('fp-reg-reminders', JSON.stringify(list)); }

  function getChecks() {
    try { return JSON.parse(localStorage.getItem('fp-reg-fixed-checks') || '{}'); } catch(e) { return {}; }
  }
  function saveChecks(obj) { localStorage.setItem('fp-reg-fixed-checks', JSON.stringify(obj)); }

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function pruneOldChecks() {
    var checks = getChecks();
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var cutoffStr = cutoff.toISOString().slice(0, 10);
    var pruned = {};
    Object.keys(checks).forEach(function(key) {
      var dateStr = key.slice(0, 10);
      if (dateStr >= cutoffStr) pruned[key] = checks[key];
    });
    saveChecks(pruned);
  }

  function isReminderDueToday(r) {
    if (r.freq === 'daily') return true;
    if (r.freq === 'weekly') return new Date().getDay() === (r.dayOfWeek != null ? r.dayOfWeek : 0);
    return true;
  }

  function renderReminders() {
    var el = document.getElementById('reg-reminders');
    if (!el) return;
    var all = getReminders();
    var due = all.filter(isReminderDueToday);
    var checks = getChecks();
    var today = todayKey();
    var html = '';
    ['medicina', 'cuidado'].forEach(function(cat) {
      var items = due.filter(function(r) { return r.cat === cat; });
      if (!items.length) return;
      html += '<div class="reg-remind-group">' + CAT_LABELS_REM[cat] + '</div>';
      items.forEach(function(r) {
        var key = today + '_' + r.id;
        var checked = checks[key] ? ' checked' : '';
        var timeLabel = r.time ? '<span class="reg-remind-time">' + r.time + '</span>' : '';
        var freqLabel = r.freq === 'weekly' ? '<span class="reg-remind-freq">Semanal</span>' : '';
        var delBtn = reminderEditMode ? '<button class="reg-remind-del" data-remind-id="' + r.id + '">\u00d7</button>' : '';
        html += '<label class="reg-remind-item"><input type="checkbox" data-remind-key="' + key + '"' + checked + '><span>' + r.text + '</span>' + timeLabel + freqLabel + delBtn + '</label>';
      });
    });
    if (!html) html = '<div class="reg-remind-empty">Sin recordatorios para hoy</div>';
    el.innerHTML = html;
    el.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var c = getChecks();
        if (cb.checked) c[cb.dataset.remindKey] = true;
        else delete c[cb.dataset.remindKey];
        saveChecks(c);
      });
    });
    el.querySelectorAll('.reg-remind-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var list = getReminders().filter(function(r) { return r.id !== btn.dataset.remindId; });
        saveReminders(list);
        renderReminders();
      });
    });
  }

  function addCustomReminder() {
    var textInput = document.getElementById('reg-reminder-text');
    var catInput = document.getElementById('reg-reminder-cat');
    var freqInput = document.getElementById('reg-reminder-freq');
    var timeInput = document.getElementById('reg-reminder-time');
    if (!textInput || !textInput.value.trim()) return;
    var list = getReminders();
    list.push({
      id: String(Date.now()),
      cat: catInput.value,
      text: textInput.value.trim(),
      freq: freqInput.value,
      time: timeInput.value || null,
      dayOfWeek: freqInput.value === 'weekly' ? new Date().getDay() : null
    });
    saveReminders(list);
    textInput.value = '';
    timeInput.value = '';
    renderReminders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSection);
  } else {
    renderSection();
  }
  window.addEventListener('auth-ready', pullSharedLog);

  // Expose for Resumen banners
  window.getLucaLastEntry = function() {
    var log = getLog();
    if (!log.length) return null;
    var last = log[0];
    var endTime = new Date(new Date(last.startedAt).getTime() + (last.durationSeconds || 0) * 1000);
    var lastBreast = log.filter(function(e) { return e.type === 'breast'; })[0] || null;
    return {
      type: last.type,
      side: last.side,
      ml: last.ml || null,
      startedAt: last.startedAt,
      elapsedSeconds: Math.floor((Date.now() - endTime.getTime()) / 1000),
      nextSide: lastBreast ? (lastBreast.side === 'left' ? 'Der' : 'Izq') : null
    };
  };
  window.getLucaActiveFeed = function() {
    var af = getActiveBreast();
    if (!af) return null;
    return { side: af.side, label: af.label, elapsed: af.elapsed };
  };
  window.fmtLucaElapsed = fmtElapsed;
})();
