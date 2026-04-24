// ========== REGISTRO DE LUCA ==========
(function() {

  var LOCAL_KEY = 'fp-luca-log';

  var TIMER_KEYS = ['breast_left', 'breast_right', 'pump_left', 'pump_right'];

  var TIMER_META = {
    breast_left:  { icon: '\ud83e\udd31', label: 'Pecho izq.',    type: 'breast', side: 'left' },
    breast_right: { icon: '\ud83e\udd31', label: 'Pecho der.',    type: 'breast', side: 'right' },
    pump_left:    { icon: '\ud83c\udf7c', label: 'Sacaleche izq.', type: 'pump',   side: 'left' },
    pump_right:   { icon: '\ud83c\udf7c', label: 'Sacaleche der.', type: 'pump',   side: 'right' }
  };

  var active = {}; // key -> { startedAt, elapsed, intervalId }

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
          renderLog();
        }
      });
    });
  }

  // ---- Helpers ----
  function isToday(iso) {
    var d = new Date(iso), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }

  function fmtDuration(secs) {
    var m = Math.floor(secs / 60), s = secs % 60;
    if (m === 0) return s + 's';
    return m + 'min' + (s > 0 ? ' ' + s + 's' : '');
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function timeSince(iso) {
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'ahora mismo';
    if (diff === 1) return 'hace 1 min';
    if (diff < 60) return 'hace ' + diff + ' min';
    var h = Math.floor(diff / 60);
    return 'hace ' + h + 'h';
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
    renderLog();
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
      var log = getLog().filter(function(e) { return isToday(e.startedAt); });
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

  // ---- Render ----
  function renderSummary() {
    var el = document.getElementById('registro-summary');
    if (!el) return;
    var todayLog = getLog().filter(function(e) { return isToday(e.startedAt); });
    var breastSecs = todayLog.filter(function(e) { return e.type === 'breast'; })
      .reduce(function(s, e) { return s + e.durationSeconds; }, 0);
    var pumpSecs = todayLog.filter(function(e) { return e.type === 'pump'; })
      .reduce(function(s, e) { return s + e.durationSeconds; }, 0);
    var last = todayLog[0];
    el.innerHTML =
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83e\udd31 Pecho hoy</span><span class="reg-sum-val">' + (breastSecs > 0 ? fmtDuration(breastSecs) : '\u2014') + '</span></div>' +
      '<div class="reg-sum-item"><span class="reg-sum-lbl">\ud83c\udf7c Sacaleche hoy</span><span class="reg-sum-val">' + (pumpSecs > 0 ? fmtDuration(pumpSecs) : '\u2014') + '</span></div>' +
      (last ? '<div class="reg-sum-item"><span class="reg-sum-lbl">Última sesión</span><span class="reg-sum-val">' + timeSince(last.startedAt) + '</span></div>' : '');
  }

  function renderLog() {
    var el = document.getElementById('registro-log');
    if (!el) return;
    var todayLog = getLog().filter(function(e) { return isToday(e.startedAt); });
    if (todayLog.length === 0) {
      el.innerHTML = '<div class="reg-empty">Sin registros hoy</div>';
      renderSummary();
      return;
    }
    var html = '';
    todayLog.forEach(function(entry) {
      var icon = entry.type === 'breast' ? '\ud83e\udd31' : '\ud83c\udf7c';
      var typeLbl = entry.type === 'breast' ? 'Pecho' : 'Sacaleche';
      var sideLbl = entry.side === 'left' ? 'Izq' : 'Der';
      html += '<div class="reg-entry">' +
        '<span class="reg-entry-icon">' + icon + '</span>' +
        '<div class="reg-entry-body">' +
          '<span class="reg-entry-name">' + typeLbl + ' ' + sideLbl + '</span>' +
          '<span class="reg-entry-dur">' + fmtDuration(entry.durationSeconds) + '</span>' +
        '</div>' +
        '<span class="reg-entry-time">' + fmtTime(entry.startedAt) + '</span>' +
        '<button class="reg-del" data-id="' + entry.id + '" title="Borrar">\xd7</button>' +
        '</div>';
    });
    el.innerHTML = html;
    el.querySelectorAll('.reg-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        saveLog(getLog().filter(function(e) { return e.id !== id; }));
        renderLog();
      });
    });
    renderSummary();
  }

  function renderSection() {
    var section = document.getElementById('registro');
    if (!section) return;

    var html = '';

    // Summary strip
    html += '<div class="glass reg-summary" id="registro-summary"></div>';

    // Timers — breast row
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

    // Log
    html += '<div class="glass data-card">';
    html += '<h3 class="reg-sec-title">Registro de hoy</h3>';
    html += '<div id="registro-log"></div>';
    html += '</div>';

    section.innerHTML = html;

    // Bind buttons
    TIMER_KEYS.forEach(function(key) {
      var btn = document.getElementById('reg-btn-' + key);
      if (!btn) return;
      btn.addEventListener('click', function() {
        if (active[key]) { stopTimer(key); } else { startTimer(key); }
      });
      refreshBtn(key);
    });

    renderLog();
    renderSummary();
  }

  function init() {
    renderSection();
  }

  function onAuth() {
    pullFromSupabase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', onAuth);

})();
