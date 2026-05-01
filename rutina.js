// ========== RUTINA — SCENARIO ENGINE & TIMELINE ==========
(function() {

  var LOCAL_KEY = 'fp-rutina';
  var SHARED_TABLE = 'shared_rutina';
  var renderTimer = null;

  var state = {
    scenario: null,       // current scenario object
    scenarioId: null,     // e.g. 'weekday_both'
    grandmaToggle: false, // persisted
    personFilter: null,   // null = todos, or 'leo','luca','mum','dad','grandma'
    editMode: false,
    editingStep: null,
    overrides: {}         // user edits keyed by scenarioId
  };

  // ---- Persistence ----
  function loadLocal() {
    try {
      var saved = JSON.parse(localStorage.getItem(LOCAL_KEY));
      if (saved) {
        state.grandmaToggle = !!saved.grandmaToggle;
        state.overrides = saved.overrides || {};
        return true;
      }
    } catch(e) {}
    return false;
  }

  function saveLocal() {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({
        grandmaToggle: state.grandmaToggle,
        overrides: state.overrides
      }));
    } catch(e) {}
  }

  // ---- Supabase sync ----
  function pullFromSupabase() {
    if (!window.sb || !window.__authReady) return;
    window.sb.from(SHARED_TABLE).select('*').limit(1).maybeSingle().then(function(res) {
      if (res.data) {
        if (typeof res.data.grandma_toggle === 'boolean') state.grandmaToggle = res.data.grandma_toggle;
        if (res.data.overrides) state.overrides = res.data.overrides;
        saveLocal();
        detectScenario();
        render();
      }
    });
  }

  function pushToSupabase() {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      var payload = {
        grandma_toggle: state.grandmaToggle,
        overrides: state.overrides,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      };
      window.sb.from(SHARED_TABLE).select('id').limit(1).maybeSingle().then(function(res2) {
        if (res2.data) {
          window.sb.from(SHARED_TABLE).update(payload).eq('id', res2.data.id).then(function() {});
        } else {
          window.sb.from(SHARED_TABLE).insert(payload).then(function() {});
        }
      });
    });
  }

  // ---- Scenario detection ----
  function isDadHome() {
    var cfg = window.__calendarConfig || window.__defaultCalendarConfig;
    if (!cfg) return true; // default to home
    var helpers = window.__calendarHelpers;
    if (!helpers || !helpers.buildHelpers) return true;
    var h = helpers.buildHelpers(cfg);
    var today = new Date(); today.setHours(0,0,0,0);
    // Dad is home if: on shift days off, OR on any type of leave (mandatory, parental, annual)
    return h.isShiftOff(today) || h.getType(today) !== null;
  }

  function isWeekend() {
    var dow = new Date().getDay();
    return dow === 0 || dow === 6;
  }

  function detectScenario() {
    var data = window.RUTINA_DATA;
    if (!data || !data.scenarios) return;

    var dayType = isWeekend() ? 'weekend' : 'weekday';
    var whoHome;

    if (state.grandmaToggle) {
      whoHome = 'grandma';
    } else if (isDadHome()) {
      whoHome = 'both';
    } else {
      whoHome = 'solo';
    }

    var id = dayType + '_' + whoHome;
    state.scenarioId = id;
    state.scenario = data.scenarios[id] || null;

    // If Dad is home AND grandma is toggled, merge Dad's activities into the grandma scenario
    if (state.grandmaToggle && isDadHome() && state.scenario) {
      var bothScenario = data.scenarios[dayType + '_both'];
      if (bothScenario) {
        state.scenario = mergeDadIntoGrandma(state.scenario, bothScenario);
      }
    }
  }

  function mergeDadIntoGrandma(grandmaScenario, bothScenario) {
    var merged = JSON.parse(JSON.stringify(grandmaScenario));
    merged.roles = merged.roles.slice();
    if (merged.roles.indexOf('dad') === -1) merged.roles.push('dad');
    merged.label = merged.label.replace('Granma-Tere', 'Granma-Tere + Daddey');

    // Build a time-indexed map from the both scenario
    var dadByTime = {};
    for (var b = 0; b < bothScenario.blocks.length; b++) {
      for (var s = 0; s < bothScenario.blocks[b].steps.length; s++) {
        var step = bothScenario.blocks[b].steps[s];
        for (var a = 0; a < step.activities.length; a++) {
          if (step.activities[a].who === 'dad') {
            dadByTime[step.time + '-' + step.endTime] = step.activities[a];
          }
        }
      }
    }

    // Merge into grandma scenario steps
    for (var bb = 0; bb < merged.blocks.length; bb++) {
      for (var ss = 0; ss < merged.blocks[bb].steps.length; ss++) {
        var mstep = merged.blocks[bb].steps[ss];
        var key = mstep.time + '-' + mstep.endTime;
        if (dadByTime[key]) {
          var hasDad = false;
          for (var aa = 0; aa < mstep.activities.length; aa++) {
            if (mstep.activities[aa].who === 'dad') { hasDad = true; break; }
          }
          if (!hasDad) {
            mstep.activities.push(JSON.parse(JSON.stringify(dadByTime[key])));
          }
        }
      }
    }

    return merged;
  }

  // ---- Time helpers ----
  function toMinutes(t) {
    var p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }

  function nowMinutes() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function findCurrent() {
    if (!state.scenario) return { currentBlockIdx: -1, currentStep: null, nextStep: null, isSleeping: false };
    var blocks = state.scenario.blocks;
    var now = nowMinutes();
    var currentBlockIdx = -1;
    var currentStep = null;
    var nextStep = null;

    for (var b = 0; b < blocks.length; b++) {
      var bl = blocks[b];
      var bStart = bl.startH * 60 + bl.startM;
      var bEnd = bl.endH * 60 + bl.endM;
      if (bEnd < bStart) {
        if (now >= bStart || now < bEnd) { currentBlockIdx = b; break; }
      } else {
        if (now >= bStart && now < bEnd) { currentBlockIdx = b; break; }
      }
    }

    var found = false;
    for (var b2 = 0; b2 < blocks.length && !found; b2++) {
      for (var s = 0; s < blocks[b2].steps.length; s++) {
        var step = blocks[b2].steps[s];
        var start = toMinutes(step.time);
        var end = toMinutes(step.endTime);
        var inStep;
        if (end < start) {
          inStep = now >= start || now < end;
        } else {
          inStep = now >= start && now < end;
        }
        if (inStep) {
          currentStep = { b: b2, s: s, step: step };
          // Find next
          for (var nb = b2, ns = s + 1; nb < blocks.length; nb++, ns = 0) {
            for (; ns < blocks[nb].steps.length; ns++) {
              nextStep = { b: nb, s: ns, step: blocks[nb].steps[ns] };
              found = true;
              break;
            }
            if (found) break;
          }
          found = true;
          break;
        }
        if (!currentStep && !nextStep) {
          if (now < start) {
            nextStep = { b: b2, s: s, step: step };
          }
        }
      }
    }

    var firstStart = blocks.length ? blocks[0].startH * 60 + blocks[0].startM : 0;
    var lastBlock = blocks.length ? blocks[blocks.length - 1] : null;
    var lastEnd = lastBlock ? lastBlock.endH * 60 + lastBlock.endM : 0;
    var isSleeping;
    if (firstStart === lastEnd) {
      // Schedule is 24h continuous — no sleeping period
      isSleeping = false;
    } else if (lastEnd < firstStart) {
      isSleeping = now >= lastEnd && now < firstStart;
    } else {
      isSleeping = now >= lastEnd || now < firstStart;
    }

    return { currentBlockIdx: currentBlockIdx, currentStep: currentStep, nextStep: nextStep, isSleeping: isSleeping };
  }

  // ---- Luca live data ----
  function getLucaStatus() {
    var activeFeed = window.getLucaActiveFeed ? window.getLucaActiveFeed() : null;
    var lastEntry = window.getLucaLastEntry ? window.getLucaLastEntry() : null;
    if (activeFeed) {
      return { status: 'feeding', elapsed: window.fmtLucaElapsed ? window.fmtLucaElapsed(activeFeed.elapsed) : '0:00', side: activeFeed.side };
    }
    if (lastEntry) {
      var hrs = lastEntry.elapsedSeconds / 3600;
      var urgency = hrs >= 4 ? 'overdue' : hrs >= 3 ? 'soon' : 'ok';
      return { status: 'waiting', elapsed: window.fmtLucaElapsed ? window.fmtLucaElapsed(lastEntry.elapsedSeconds) : '', urgency: urgency, nextSide: lastEntry.nextSide };
    }
    return { status: 'none' };
  }

  // ---- Badge helper ----
  function badgeHtml(who, small) {
    var data = window.RUTINA_DATA;
    var label = (data && data.whoLabels && data.whoLabels[who]) || who;
    return '<span class="caregiver-badge caregiver-' + who + (small ? ' badge-sm' : '') + '">' + label + '</span>';
  }

  // ---- Render ----
  function render() {
    var section = document.getElementById('rutina');
    if (!section) return;
    if (!state.scenario) {
      section.innerHTML = '<div class="glass" style="padding:24px;text-align:center;color:var(--text-muted)">Cargando datos de rutina...</div>';
      return;
    }

    var cur = findCurrent();
    var html = '';

    // ---- Toolbar ----
    html += '<div class="rutina-toolbar">';
    html += '<div class="rutina-toolbar-top">';
    html += '<label class="rutina-grandma-toggle">';
    html += '<span class="rutina-grandma-label">Granma-Tere hoy?</span>';
    html += '<input type="checkbox" id="rutina-grandma-check"' + (state.grandmaToggle ? ' checked' : '') + '>';
    html += '<span class="rutina-toggle-slider"></span>';
    html += '</label>';
    html += '<span class="rutina-scenario-label">' + state.scenario.label + '</span>';
    if (state.scenario.subtitle) html += '<span class="rutina-scenario-sub">' + state.scenario.subtitle + '</span>';
    html += '</div>';

    // Person filter pills
    html += '<div class="rutina-person-filter">';
    var filterAll = state.personFilter === null;
    html += '<button class="rutina-filter-pill' + (filterAll ? ' rutina-filter-active' : '') + '" data-filter="">Todos</button>';
    var roles = state.scenario.roles;
    for (var r = 0; r < roles.length; r++) {
      var isActive = state.personFilter === roles[r];
      html += '<button class="rutina-filter-pill caregiver-' + roles[r] + (isActive ? ' rutina-filter-active' : '') + '" data-filter="' + roles[r] + '">';
      html += (window.RUTINA_DATA.whoLabels[roles[r]] || roles[r]);
      html += '</button>';
    }
    html += '</div>';

    // Edit toggle
    html += '<button class="rutina-edit-toggle' + (state.editMode ? ' rutina-edit-toggle-active' : '') + '" id="rutina-edit-toggle">';
    html += state.editMode ? '\u2713 Listo' : '\u270f\ufe0f Editar';
    html += '</button>';
    html += '</div>';

    // Notification permission card
    if ('Notification' in window && Notification.permission === 'default') {
      var dismissed = false;
      try { dismissed = localStorage.getItem('fp-notif-dismissed') === '1'; } catch(e) {}
      if (!dismissed) {
        html += '<div class="rutina-notif-card glass">';
        html += '<p>\u00bfActivar recordatorios importantes?</p>';
        html += '<p style="font-size:11px;color:var(--text-muted)">Bloque de Oro, siesta, tomas de Luca, tiempo con Leo</p>';
        html += '<button class="rutina-notif-btn" id="rutina-notif-accept">Activar</button>';
        html += '<button class="rutina-notif-dismiss" id="rutina-notif-dismiss">No, gracias</button>';
        html += '</div>';
      }
    }

    // ---- Hero card ----
    if (!state.editMode) {
      html += '<div class="glass rutina-hero">';
      html += '<div class="rutina-hero-label">AHORA MISMO</div>';
      if (cur.currentStep) {
        var cs = cur.currentStep.step;
        html += '<div class="rutina-hero-time">' + cs.time + '\u2013' + cs.endTime + '</div>';
        var heroActivities = filterActivities(cs.activities);
        for (var ha = 0; ha < heroActivities.length; ha++) {
          var act = heroActivities[ha];
          html += '<div class="rutina-hero-activity">';
          html += badgeHtml(act.who, false);
          html += '<span class="rutina-hero-name">' + act.name + '</span>';
          if (act.desc) html += '<span class="rutina-hero-desc">' + act.desc + '</span>';
          html += '</div>';
        }
        if (!state.personFilter || state.personFilter === 'luca') {
          var lucaStatus = getLucaStatus();
          if (lucaStatus.status === 'feeding') {
            html += '<div class="rutina-luca-live"><span class="resumen-badge-live">Live: ' + (lucaStatus.side === 'left' ? 'Izquierdo' : 'Derecho') + '</span> ' + lucaStatus.elapsed + '</div>';
          } else if (lucaStatus.status === 'waiting') {
            html += '<div class="rutina-luca-status rutina-luca-' + lucaStatus.urgency + '">\ud83c\udf7c \u00daltima toma hace ' + lucaStatus.elapsed + '</div>';
          }
        }
      } else {
        html += '<div class="rutina-hero-name rutina-hero-off">' + (cur.isSleeping ? 'Durmiendo \ud83d\ude34' : 'Fuera de horario') + '</div>';
      }
      if (cur.nextStep) {
        var ns = cur.nextStep.step;
        var nextActs = filterActivities(ns.activities);
        var nextLabel = nextActs.length ? nextActs[0].name : '';
        html += '<div class="rutina-hero-next">Siguiente \u00b7 <strong>' + ns.time + '</strong> \u00b7 ' + nextLabel + '</div>';
      }
      html += '</div>';
    }

    // ---- Blocks ----
    var blocks = state.scenario.blocks;
    for (var b = 0; b < blocks.length; b++) {
      var block = blocks[b];
      var isActiveBlock = b === cur.currentBlockIdx;
      var isGolden = !!block.golden;

      html += '<div class="glass rutina-block' + (isActiveBlock && !state.editMode ? ' rutina-block-active' : '') + (isGolden ? ' rutina-block-golden' : '') + '">';
      html += '<div class="rutina-block-header">';
      html += '<div class="rutina-block-title">' + block.emoji + ' ' + block.title;
      if (block.subtitle) html += ' <span class="rutina-block-sub">' + block.subtitle + '</span>';
      html += '</div>';
      html += '<div class="rutina-block-time">' + block.timeRange + '</div>';
      html += '</div>';
      html += '<div class="rutina-steps">';

      for (var s = 0; s < block.steps.length; s++) {
        var step = block.steps[s];
        var isCurrentStep = !state.editMode && cur.currentStep && cur.currentStep.b === b && cur.currentStep.s === s;
        var isGoldenStep = !!step.golden;
        var activities = filterActivities(step.activities);
        if (activities.length === 0) continue;

        html += '<div class="rutina-step' + (isCurrentStep ? ' rutina-step-active' : '') + (isGoldenStep ? ' rutina-step-golden' : '') + (state.editMode ? ' rutina-step-editable' : '') + '"';
        if (state.editMode) html += ' data-edit-b="' + b + '" data-edit-s="' + s + '"';
        html += '>';
        html += '<div class="rutina-step-time">' + step.time + '<span class="rutina-step-end">' + step.endTime + '</span></div>';
        html += '<div class="rutina-step-activities">';

        for (var a = 0; a < activities.length; a++) {
          var sact = activities[a];
          html += '<div class="rutina-activity">';
          html += badgeHtml(sact.who, true);
          html += '<div class="rutina-activity-body">';
          html += '<span class="rutina-activity-name">' + sact.name + '</span>';
          if (sact.desc) html += '<span class="rutina-activity-desc">' + sact.desc + '</span>';
          if (sact.who === 'luca') {
            var ls = getLucaStatus();
            if (ls.status === 'feeding') {
              html += '<span class="rutina-luca-live badge-sm"><span class="resumen-badge-live">Live</span> ' + ls.elapsed + '</span>';
            } else if (ls.status === 'waiting') {
              html += '<span class="rutina-luca-status rutina-luca-' + ls.urgency + '">\u00daltima toma: ' + ls.elapsed + '</span>';
            }
          }
          html += '</div></div>';
        }

        html += '</div></div>';
      }

      html += '</div>';

      if (!state.editMode) {
        var guidanceHtml = renderGuidanceCards(block);
        if (guidanceHtml) html += guidanceHtml;

        if (isActiveBlock && window.getSelfcareReminders) {
          var reminders = window.getSelfcareReminders();
          for (var ri = 0; ri < reminders.length; ri++) {
            var rem = reminders[ri];
            html += '<div class="rutina-guidance glass rutina-selfcare-reminder">';
            html += '<div class="rutina-guidance-header">';
            html += '<span class="rutina-guidance-icon">' + rem.icon + '</span>';
            html += '<span class="rutina-guidance-title">Autocuidado</span>';
            html += '</div>';
            html += '<div class="rutina-guidance-content">' + rem.text + '</div>';
            html += '</div>';
          }
        }
      }

      html += '</div>';
    }

    if (!state.editMode) {
      html += renderRedFlags();
    }

    section.innerHTML = html;
    bindEvents();

    if (!state.editMode) {
      if (renderTimer) clearTimeout(renderTimer);
      renderTimer = setTimeout(render, 60000);
    }
  }

  function filterActivities(activities) {
    if (!state.personFilter) return activities;
    return activities.filter(function(a) { return a.who === state.personFilter; });
  }

  function renderGuidanceCards(block) {
    var data = window.RUTINA_DATA;
    if (!data || !data.guidance) return '';
    var now = nowMinutes();
    var html = '';

    for (var i = 0; i < data.guidance.length; i++) {
      var g = data.guidance[i];
      var gStart = toMinutes(g.timeStart);
      var gEnd = toMinutes(g.timeEnd);
      if (now < gStart || now >= gEnd) continue;

      var bStart = block.startH * 60 + block.startM;
      var bEnd = block.endH * 60 + block.endM;
      if (bEnd < bStart) {
        if (!(gStart >= bStart || gStart < bEnd)) continue;
      } else {
        if (gStart < bStart || gStart >= bEnd) continue;
      }

      if (g.scenarios.indexOf('all') === -1 && g.scenarios.indexOf(state.scenarioId) === -1) continue;

      html += '<div class="rutina-guidance glass">';
      html += '<div class="rutina-guidance-header">';
      html += '<span class="rutina-guidance-icon">' + g.icon + '</span>';
      html += '<span class="rutina-guidance-title">' + g.title + '</span>';
      html += '</div>';
      html += '<div class="rutina-guidance-content">' + g.content + '</div>';
      html += '</div>';
    }

    return html;
  }

  function renderRedFlags() {
    var data = window.RUTINA_DATA;
    if (!data || !data.redFlags) return '';
    var flags = data.redFlags;
    var html = '<div class="glass rutina-redflags">';
    html += '<details>';
    html += '<summary class="rutina-redflags-title">\ud83d\udea8 Se\u00f1ales de alarma \u2014 cu\u00e1ndo pedir ayuda</summary>';
    html += '<div class="rutina-redflags-body">';

    var categories = ['mum', 'newborn', 'toddler', 'family'];
    for (var c = 0; c < categories.length; c++) {
      var cat = flags[categories[c]];
      if (!cat) continue;
      html += '<div class="rutina-redflag-cat' + (cat.urgent ? ' rutina-redflag-urgent' : '') + '">';
      html += '<h4>' + cat.title + '</h4><ul>';
      for (var ii = 0; ii < cat.items.length; ii++) {
        html += '<li>' + cat.items[ii] + '</li>';
      }
      html += '</ul></div>';
    }

    html += '</div></details></div>';
    return html;
  }

  function bindEvents() {
    var section = document.getElementById('rutina');
    if (!section) return;

    var grandmaCheck = document.getElementById('rutina-grandma-check');
    if (grandmaCheck) {
      grandmaCheck.addEventListener('change', function() {
        state.grandmaToggle = this.checked;
        saveLocal();
        pushToSupabase();
        detectScenario();
        render();
      });
    }

    section.querySelectorAll('.rutina-filter-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        var filter = this.dataset.filter;
        state.personFilter = filter || null;
        render();
      });
    });

    var editBtn = document.getElementById('rutina-edit-toggle');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        state.editMode = !state.editMode;
        state.editingStep = null;
        render();
      });
    }

    if (state.editMode) {
      section.querySelectorAll('.rutina-step-editable').forEach(function(el) {
        el.addEventListener('click', function() {
          state.editingStep = { b: parseInt(el.dataset.editB), s: parseInt(el.dataset.editS) };
          render();
        });
      });
    }

    var notifAccept = document.getElementById('rutina-notif-accept');
    if (notifAccept) {
      notifAccept.addEventListener('click', function() {
        Notification.requestPermission().then(function(perm) {
          if (perm === 'granted') scheduleNotifications();
          render();
        });
      });
    }
    var notifDismiss = document.getElementById('rutina-notif-dismiss');
    if (notifDismiss) {
      notifDismiss.addEventListener('click', function() {
        try { localStorage.setItem('fp-notif-dismissed', '1'); } catch(e) {}
        render();
      });
    }
  }

  // ---- Push notifications ----
  var notifTimers = [];

  function clearNotifTimers() {
    for (var i = 0; i < notifTimers.length; i++) clearTimeout(notifTimers[i]);
    notifTimers = [];
  }

  function getNotifSettings() {
    try {
      return JSON.parse(localStorage.getItem('fp-notif-settings')) || {
        golden: true, nap: true, feed: true, specialTime: true
      };
    } catch(e) { return { golden: true, nap: true, feed: true, specialTime: true }; }
  }

  function scheduleNotifications() {
    clearNotifTimers();
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var settings = getNotifSettings();
    var now = Date.now();

    if (settings.golden) {
      var golden = getGoldenSleepBlock();
      if (golden) {
        var today = new Date();
        var gH = parseInt(golden.timeStart.split(':')[0]);
        var gM = parseInt(golden.timeStart.split(':')[1]);
        var goldenTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), gH, gM);
        var alertTime = goldenTime.getTime() - 15 * 60000;
        if (alertTime > now) {
          notifTimers.push(setTimeout(function() {
            showNotification('\ud83c\udf19 Hora de dormir', 'Tu bloque de oro empieza en 15 min');
          }, alertTime - now));
        }
      }
    }

    if (settings.nap && !isWeekend()) {
      var napTime = new Date();
      napTime.setHours(9, 0, 0, 0);
      if (napTime.getTime() > now) {
        notifTimers.push(setTimeout(function() {
          showNotification('\ud83d\ude34 Ventana de siesta abierta', 'Descansa ahora');
        }, napTime.getTime() - now));
      }
    }

    if (settings.feed) {
      scheduleFeedAlert();
    }

    if (settings.specialTime && state.scenario) {
      for (var b = 0; b < state.scenario.blocks.length; b++) {
        for (var s = 0; s < state.scenario.blocks[b].steps.length; s++) {
          var step = state.scenario.blocks[b].steps[s];
          for (var a = 0; a < step.activities.length; a++) {
            if (step.activities[a].name && step.activities[a].name.indexOf('15 min') !== -1 && step.activities[a].name.indexOf('Leo') !== -1) {
              var stH = parseInt(step.time.split(':')[0]);
              var stM = parseInt(step.time.split(':')[1]);
              var stTime = new Date();
              stTime.setHours(stH, stM, 0, 0);
              if (stTime.getTime() > now) {
                (function(t) {
                  notifTimers.push(setTimeout(function() {
                    showNotification('\ud83d\udc9c 15 min solo con Leo', 'Sin beb\u00e9, sin m\u00f3vil');
                  }, t - now));
                })(stTime.getTime());
              }
              break;
            }
          }
        }
      }
    }
  }

  function scheduleFeedAlert() {
    var lastEntry = window.getLucaLastEntry ? window.getLucaLastEntry() : null;
    if (!lastEntry) return;
    var fourHoursMs = 4 * 3600 * 1000;
    var msUntilAlert = fourHoursMs - (lastEntry.elapsedSeconds * 1000);
    if (msUntilAlert > 0) {
      notifTimers.push(setTimeout(function() {
        showNotification('\ud83c\udf7c Luca: 4h sin comer', 'Hora de alimentar');
      }, msUntilAlert));
    }
  }

  function showNotification(title, body) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'show-notification', title: title, body: body });
    } else if ('Notification' in window) {
      new Notification(title, { body: body, icon: 'icon-192.png' });
    }
  }

  // ---- Golden Sleep Block export ----
  function getGoldenSleepBlock() {
    if (!state.scenario) return null;
    var blocks = state.scenario.blocks;
    for (var b = 0; b < blocks.length; b++) {
      if (!blocks[b].golden) continue;
      for (var s = 0; s < blocks[b].steps.length; s++) {
        if (blocks[b].steps[s].golden) {
          var step = blocks[b].steps[s];
          var coveredBy = null;
          for (var a = 0; a < step.activities.length; a++) {
            if (step.activities[a].who !== 'mum' && step.activities[a].who !== 'luca') {
              coveredBy = step.activities[a].who;
              break;
            }
          }
          return {
            timeStart: step.time,
            timeEnd: step.endTime,
            coveredBy: coveredBy,
            scenario: state.scenarioId
          };
        }
      }
    }
    return null;
  }

  // ---- Init ----
  function init() {
    loadLocal();
    detectScenario();
    render();
    scheduleNotifications();
    window.RUTINA_WHO_LABELS = window.RUTINA_DATA ? window.RUTINA_DATA.whoLabels : {};
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    pullFromSupabase();
  });

  // ---- Exposed globals ----
  window.getRutinaCurrentStep = function() {
    if (!state.scenario) return null;
    var result = findCurrent();
    result.scenario = state.scenarioId;
    result.scenarioLabel = state.scenario ? state.scenario.label : '';
    return result;
  };
  window.getLeoCurrentStep = window.getRutinaCurrentStep;
  window.getGoldenSleepBlock = getGoldenSleepBlock;
  window.RUTINA_WHO_LABELS = window.RUTINA_DATA ? window.RUTINA_DATA.whoLabels : {};

})();
