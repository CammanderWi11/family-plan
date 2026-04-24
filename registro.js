// ========== REGISTRO DE LUCA ==========
(function() {

  var LOCAL_KEY = 'fp-luca-log';

  var TIMER_KEYS = ['breast_left', 'breast_right', 'pump_left', 'pump_right'];

  var TIMER_META = {
    breast_left:  { icon: '\ud83e\udd31', label: 'Pecho izq.',     type: 'breast', side: 'left' },
    breast_right: { icon: '\ud83e\udd31', label: 'Pecho der.',     type: 'breast', side: 'right' },
    pump_left:    { icon: '\ud83c\udf7c', label: 'Sacaleche izq.', type: 'pump',   side: 'left' },
    pump_right:   { icon: '\ud83c\udf7c', label: 'Sacaleche der.', type: 'pump',   side: 'right' }
  };

  var active = {};      // key -> { startedAt, elapsed, intervalId }
  var viewDate = new Date(); // the date currently shown in the log
  var heroInterval = null;

  // ---- Storage ----
  function getLog() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch(e) { return []; }
  }

  function saveLog(log) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(log)); } catch(e) {}
    pushToSupabase(log);
  }

  function pushToSupabase(log) {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      window.sb.from('app_state').select('id').limit(1).maybeSingle().then(function(res2) {
        if (!res2.data) return;
        window.sb.from('app_state').update({ luca_log: log }).eq('id', res2.data.id).then(function() {});
      });
    });
  }

  function pullFromSupabase() {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      window.sb.from('app_state').select('luca_log').limit(1).maybeSingle().then(function(res2) {
        if (res2.data && Array.isArray(res2.data.luca_log)) {
          try { localStorage.setItem(LOCAL_KEY, JSON.stringify(res2.data.luca_log)); } catch(e) {}
          renderAll();
        }
      });
    });
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
    var days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
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
  function startTimer(key) {
    if (active[key]) return;
    var startedAt = new Date().toISOString();
    var id = setInterval(function() {
      if (!active[key]) { clearInterval(id); return; }
      active[key].elapsed = Math.floor((Date.now() - new Date(active[key].startedAt).getTime()) / 1000);
      refreshBtn(key);
    }, 1000);
    active[key] = { startedAt: startedAt, elapsed: 0, intervalId: id };
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
    var log = getLog();
    log.unshift(entry);
    saveLog(log);
    refreshBtn(key);
    renderAll();
  }

  function refreshBtn(key) {
    var btn = document.getElementById('reg-btn-' + key);
    if (!btn) return;
    var meta = TIMER_META[key];
    var isActive = !!active[key];
    btn.className = 'timer-btn' + (isActive ? ' timer-btn-active' : '');
    var elapsed = isActive ? active[key].elapsed : 0;
    var lastLog = null;
    if (!isActive) {
      var log = getLog().filter(function(e) { return isToday(new Date(e.startedAt)); });
      lastLog = log.find(function(e) { return e.type === meta.type && e.side === meta.side; }) || null;
    }
    btn.innerHTML =
      '<span class="timer-icon">' + meta.icon + '</span>' +
      '<span class="timer-label">' + meta.label + '</span>' +
      (isActive
        ? '<span class="timer-elapsed">' + fmtDuration(elapsed) + '</span>'
        : (lastLog
            ? '<span class="timer-last">' + fmtDuration(lastLog.durationSeconds) + '</span>'
            : '<span class="timer-tap">Iniciar</span>'));
  }

  // ---- Hero: próximo lado + tiempo ----
  function renderHero() {
    var el = document.getElementById('reg-hero');
    if (!el) return;
    var log = getLog();
    // Last entry of any type (for elapsed time)
    var lastAny = log[0] || null;
    // Last breast entry (for next side)
    var lastBreast = log.filter(function(e) { return e.type === 'breast'; })[0] || null;

    if (!lastAny) {
      el.className = 'glass reg-hero';
      el.innerHTML =
        '<div class="reg-hero-label">PRÓXIMA TOMA</div>' +
        '<div class="reg-hero-empty">Sin registros aún · inicia el primer timer</div>';
      return;
    }

    var secs = elapsedSince(lastAny.startedAt);
    var isAlert = secs > 3 * 3600;
    el.className = 'glass reg-hero' + (isAlert ? ' reg-hero-alert' : '');

    var nextSideHtml = '';
    if (lastBreast) {
      var nextSide = lastBreast.side === 'left' ? 'Derecho \u2192' : '\u2190 Izquierdo';
      var nextSideClass = lastBreast.side === 'left' ? 'caregiver-badge caregiver-daddey' : 'caregiver-badge caregiver-mum';
      nextSideHtml = '<div class="reg-hero-next-side">Próxima toma <span class="' + nextSideClass + '">' + nextSide + '</span></div>';
    }

    el.innerHTML =
      '<div class="reg-hero-label">ÚLTIMA TOMA</div>' +
      '<div class="reg-hero-elapsed' + (isAlert ? ' reg-hero-elapsed-alert' : '') + '">' + fmtElapsed(secs) + '</div>' +
      nextSideHtml +
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

    el.innerHTML =
      '<div class="reg-stat"><span class="reg-stat-val">' + tomasHtml + '</span><span class="reg-stat-lbl">Tomas</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + avgIntervalHtml + '</span><span class="reg-stat-lbl">Media entre tomas</span></div>' +
      '<div class="reg-stat"><span class="reg-stat-val">' + avgDurHtml + '</span><span class="reg-stat-lbl">Media/sesión</span></div>';
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
    el.innerHTML =
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83e\udd31 Pecho</span><span class="reg-sum-val">' + (breastSecs > 0 ? fmtDuration(breastSecs) : '\u2014') + '</span></div>' +
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83c\udf7c Sacaleche</span><span class="reg-sum-val">' + (pumpSecs > 0 ? fmtDuration(pumpSecs) : '\u2014') + '</span></div>';
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
      logHtml = '<div class="reg-empty">Sin registros ' + (todayFlag ? 'hoy' : 'ese día') + '</div>';
    } else {
      dayLog.forEach(function(entry) {
        var icon = entry.type === 'breast' ? '\ud83e\udd31' : '\ud83c\udf7c';
        var typeLbl = entry.type === 'breast' ? 'Pecho' : 'Sacaleche';
        var sideLbl = entry.side === 'left' ? 'Izq' : 'Der';
        logHtml +=
          '<div class="reg-entry">' +
          '<span class="reg-entry-icon">' + icon + '</span>' +
          '<div class="reg-entry-body">' +
            '<span class="reg-entry-name">' + typeLbl + ' ' + sideLbl + '</span>' +
            '<span class="reg-entry-dur">' + fmtDuration(entry.durationSeconds) + '</span>' +
          '</div>' +
          '<span class="reg-entry-time">' + fmtTime(entry.startedAt) + '</span>' +
          (todayFlag ? '<button class="reg-del" data-id="' + entry.id + '" title="Borrar">\xd7</button>' : '') +
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
        saveLog(getLog().filter(function(e) { return e.id !== id; }));
        renderAll();
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
    html += '<div class="glass reg-summary" id="registro-summary"></div>';
    html += '<div class="glass reg-hero" id="reg-hero"></div>';
    html += '<div class="glass data-card reg-stats-card"><div class="reg-stats-row" id="reg-stats"></div></div>';
    html += '<div class="glass data-card">';
    html += '<h3 class="reg-sec-title">\ud83e\udd31 Pecho</h3>';
    html += '<div class="reg-timer-row">';
    html += '<button class="timer-btn" id="reg-btn-breast_left"></button>';
    html += '<button class="timer-btn" id="reg-btn-breast_right"></button>';
    html += '</div>';
    html += '<h3 class="reg-sec-title" style="margin-top:16px">\ud83c\udf7c Sacaleche</h3>';
    html += '<div class="reg-timer-row">';
    html += '<button class="timer-btn" id="reg-btn-pump_left"></button>';
    html += '<button class="timer-btn" id="reg-btn-pump_right"></button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="glass data-card"><div id="registro-log"></div></div>';

    section.innerHTML = html;

    TIMER_KEYS.forEach(function(key) {
      var btn = document.getElementById('reg-btn-' + key);
      if (!btn) return;
      btn.addEventListener('click', function() {
        if (active[key]) { stopTimer(key); } else { startTimer(key); }
      });
    });

    renderAll();
    startHeroInterval();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSection);
  } else {
    renderSection();
  }
  window.addEventListener('auth-ready', pullFromSupabase);

})();
