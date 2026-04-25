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
    var m = Math.floor(secs / 60), s = secs % 60;
    if (m === 0) return s + 's';
    return m + 'min' + (s > 0 ? ' ' + s + 's' : '');
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

    if (!isActive) {
      var log = getLog().filter(function(e) { return isToday(new Date(e.startedAt)); });
      lastLog = log.find(function(e) { return e.type === meta.type && e.side === meta.side; }) || null;
      if (lastLog && meta.type === 'breast') {
        var lastBreast = log.find(function(e) { return e.type === 'breast'; });
        isLastUsed = lastBreast && lastBreast.id === lastLog.id;
      }
    }

    btn.className = 'timer-btn'
      + (isActive ? ' timer-btn-active' : '')
      + (isLastUsed ? ' timer-btn-last' : '');

    btn.innerHTML =
      '<span class="timer-icon">' + meta.icon + '</span>' +
      '<span class="timer-label">' + meta.label + '</span>' +
      (isActive
        ? '<span class="timer-elapsed">' + fmtDuration(elapsed) + '</span>'
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
    // Build startedAt from the time input + today's date
    var parts = timeInput.value.split(':');
    var d = new Date();
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
    var entry = {
      id: Date.now() + '_bottle',
      type: 'bottle',
      side: null,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      ml: ml
    };
    addEntry(entry);
    input.value = '';
    renderAll();
  }

  // ---- Hero: pr\u00f3ximo lado + tiempo ----
  function renderHero() {
    var el = document.getElementById('reg-hero');
    if (!el) return;
    var log = getLog();
    // Last entry of any type (for elapsed time) — includes bottle
    var lastAny = log[0] || null;
    // Last breast entry (for next side)
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
    var isAlert = secs > 3 * 3600;
    el.className = 'glass reg-hero' + (isAlert ? ' reg-hero-alert' : '');

    var nextSideHtml = '';
    if (lastBreast) {
      var nextSide = lastBreast.side === 'left' ? 'Derecho \u2192' : '\u2190 Izquierdo';
      var nextSideClass = lastBreast.side === 'left' ? 'caregiver-badge caregiver-daddey' : 'caregiver-badge caregiver-mum';
      nextSideHtml = '<div class="reg-hero-next-side">Pr\u00f3xima toma <span class="' + nextSideClass + '">' + nextSide + '</span></div>';
    }

    // Show ml if last entry was a bottle
    var lastMlHtml = '';
    if (lastAny.type === 'bottle' && lastAny.ml) {
      lastMlHtml = '<div class="reg-hero-next-side">\ud83c\udf7c \u00daltimo biber\u00f3n: ' + lastAny.ml + 'ml</div>';
    }

    el.innerHTML =
      '<div class="reg-hero-label">\u00daLTIMA TOMA</div>' +
      '<div class="reg-hero-elapsed' + (isAlert ? ' reg-hero-elapsed-alert' : '') + '">' + fmtElapsed(secs) + '</div>' +
      nextSideHtml +
      lastMlHtml +
      (isAlert ? '<div class="reg-hero-warn">Han pasado +3h \u00b7 revisar</div>' : '');
  }

  function startHeroInterval() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(renderHero, 30000);
  }

  // ---- Stats row ----
  function renderStats() {
    var el = document.getElementById('reg-stats');
    if (!el) return;
    var dayLog = getLog().filter(function(e) { return isSameDay(e.startedAt, viewDate); });
    var breast = dayLog.filter(function(e) { return e.type === 'breast'; })
      .slice().sort(function(a, b) { return new Date(a.startedAt) - new Date(b.startedAt); });

    var tomasHtml = String(breast.length);

    var avgIntervalHtml = '\u2014';
    if (breast.length >= 2) {
      var intervals = [];
      for (var i = 1; i < breast.length; i++) {
        intervals.push((new Date(breast[i].startedAt) - new Date(breast[i-1].startedAt)) / 1000);
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

    el.innerHTML =
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
          (todayFlag ? '<button class="reg-del" data-id="' + entry.id + '" title="Borrar">\u00d7</button>' : '') +
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
    html += '<div class="reg-bottle-row" style="flex-wrap:wrap;gap:6px;">';
    html += '<select id="reg-manual-type" class="reg-bottle-input" style="flex:0 0 auto;min-width:80px;">';
    html += '<option value="bottle">\ud83c\udf7c Bib</option>';
    html += '<option value="breast">\ud83e\udd31 Pecho</option>';
    html += '</select>';
    html += '<div id="reg-manual-fields-bottle" style="display:flex;gap:6px;flex:1;min-width:0;">';
    html += '<div class="reg-bottle-input-wrap" style="flex:1;min-width:60px;">';
    html += '<input type="number" id="reg-bottle-ml" class="reg-bottle-input" min="0" step="10" inputmode="numeric" placeholder="ml">';
    html += '<span class="reg-bottle-unit">ml</span>';
    html += '</div>';
    html += '</div>';
    html += '<div id="reg-manual-fields-breast" style="display:none;gap:6px;flex:1;min-width:0;">';
    html += '<input type="time" id="reg-manual-breast-time" class="reg-bottle-input" style="flex:1;min-width:70px;">';
    html += '<div class="reg-bottle-input-wrap" style="flex:0 0 auto;min-width:55px;">';
    html += '<input type="number" id="reg-manual-breast-dur" class="reg-bottle-input" min="1" step="1" inputmode="numeric" placeholder="min" style="width:50px;">';
    html += '<span class="reg-bottle-unit">min</span>';
    html += '</div>';
    html += '<select id="reg-manual-breast-side" class="reg-bottle-input" style="flex:0 0 auto;min-width:60px;">';
    html += '<option value="left">Izq</option>';
    html += '<option value="right">Der</option>';
    html += '</select>';
    html += '</div>';
    html += '<button class="btn-primary reg-bottle-btn" id="reg-manual-save">Registrar</button>';
    html += '</div>';
    html += '</div>';

    // 4. Última toma hero
    html += '<div class="glass reg-hero" id="reg-hero"></div>';

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

    restoreActiveTimers();
    renderAll();
    startHeroInterval();
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
  window.fmtLucaElapsed = fmtElapsed;
})();
