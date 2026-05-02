// ========== RUTINA SELF-CARE — MUM'S DAILY CHECKLIST ==========
(function() {

  var LOCAL_PREFIX = 'fp-selfcare-';
  var SHARED_TABLE = 'shared_selfcare';

  var expanded = false;

  function todayKey() {
    var d = new Date();
    return LOCAL_PREFIX + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function weekKey() {
    var d = new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + weekNum;
  }

  function getItems() {
    var data = window.RUTINA_DATA;
    return (data && data.selfCareItems) ? data.selfCareItems : [];
  }

  function loadChecks() {
    try {
      var saved = JSON.parse(localStorage.getItem(todayKey()));
      return saved || {};
    } catch(e) { return {}; }
  }

  function saveChecks(checks) {
    try { localStorage.setItem(todayKey(), JSON.stringify(checks)); } catch(e) {}
  }

  // ---- Supabase sync ----
  function pullFromSupabase() {
    if (!window.sb || !window.__authReady) return;
    var key = todayKey();
    window.sb.from(SHARED_TABLE).select('*').eq('day_key', key).maybeSingle().then(function(res) {
      if (res.data && res.data.checks) {
        saveChecks(res.data.checks);
        renderCard();
      }
    });
  }

  function pushToSupabase(checks) {
    if (!window.sb || !window.__authReady) return;
    var key = todayKey();
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      var payload = {
        day_key: key,
        checks: checks,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      };
      window.sb.from(SHARED_TABLE).select('id').eq('day_key', key).maybeSingle().then(function(res2) {
        if (res2.data) {
          window.sb.from(SHARED_TABLE).update(payload).eq('id', res2.data.id).then(function() {});
        } else {
          window.sb.from(SHARED_TABLE).insert(payload).then(function() {});
        }
      });
    });
  }

  // ---- Render the card ----
  function renderCard() {
    var host = document.getElementById('rutina-selfcare');
    if (!host) return;

    var items = getItems();
    var checks = loadChecks();
    var total = 0;
    var checked = 0;

    var visibleItems = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.frequency === 'weekly') {
        var lastWeek = checks['_epds_week'] || '';
        if (lastWeek === weekKey()) {
          visibleItems.push(item);
          total++;
          checked++;
          continue;
        }
      }
      visibleItems.push(item);
      total++;
      if (checks[item.id]) checked++;
    }

    var html = '<div class="rutina-selfcare-card glass' + (expanded ? ' rutina-selfcare-expanded' : '') + '">';

    html += '<div class="rutina-selfcare-header" id="rutina-selfcare-toggle">';
    html += '<span class="rutina-selfcare-icon">🧴</span>';
    html += '<span class="rutina-selfcare-summary">Autocuidado: ' + checked + '/' + total + ' ✓</span>';
    html += '<div class="rutina-selfcare-bar"><div class="rutina-selfcare-fill" style="width:' + (total ? Math.round(checked / total * 100) : 0) + '%"></div></div>';
    html += '<span class="rutina-selfcare-chevron">' + (expanded ? '▲' : '▼') + '</span>';
    html += '</div>';

    if (expanded) {
      html += '<div class="rutina-selfcare-list">';
      for (var j = 0; j < visibleItems.length; j++) {
        var vitem = visibleItems[j];
        var isChecked = !!checks[vitem.id] || (vitem.frequency === 'weekly' && checks['_epds_week'] === weekKey());
        html += '<label class="rutina-selfcare-item' + (isChecked ? ' rutina-selfcare-done' : '') + '">';
        html += '<input type="checkbox" data-item="' + vitem.id + '"' + (isChecked ? ' checked' : '') + '>';
        html += '<span class="rutina-selfcare-item-icon">' + vitem.icon + '</span>';
        html += '<span class="rutina-selfcare-item-label">' + vitem.label + '</span>';
        if (vitem.frequency === 'weekly') html += '<span class="rutina-selfcare-weekly">semanal</span>';
        html += '</label>';
      }
      html += '</div>';
    }

    html += '</div>';
    host.innerHTML = html;

    var toggle = document.getElementById('rutina-selfcare-toggle');
    if (toggle) {
      toggle.addEventListener('click', function() {
        expanded = !expanded;
        renderCard();
      });
    }

    host.querySelectorAll('input[type="checkbox"][data-item]').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var itemId = this.dataset.item;
        var currentChecks = loadChecks();
        if (this.checked) {
          currentChecks[itemId] = true;
          var allItems = getItems();
          for (var k = 0; k < allItems.length; k++) {
            if (allItems[k].id === itemId && allItems[k].frequency === 'weekly') {
              currentChecks['_epds_week'] = weekKey();
            }
          }
        } else {
          delete currentChecks[itemId];
          // If this is a weekly item, also clear the week marker so it can be re-checked
          var allItemsU = getItems();
          for (var u = 0; u < allItemsU.length; u++) {
            if (allItemsU[u].id === itemId && allItemsU[u].frequency === 'weekly') {
              delete currentChecks['_epds_week'];
            }
          }
        }
        saveChecks(currentChecks);
        pushToSupabase(currentChecks);
        renderCard();
      });
    });
  }

  // ---- Contextual reminders (rendered inline in timeline by rutina.js) ----
  window.getSelfcareReminders = function() {
    var items = getItems();
    var checks = loadChecks();
    var now = new Date().getHours() * 60 + new Date().getMinutes();
    var reminders = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (checks[item.id]) continue;
      if (item.frequency === 'weekly' && checks['_epds_week'] === weekKey()) continue;
      if (!item.reminderTime) continue;
      var rTime = parseInt(item.reminderTime.split(':')[0]) * 60 + parseInt(item.reminderTime.split(':')[1]);
      if (now >= rTime && now < rTime + 120) {
        reminders.push({ id: item.id, icon: item.icon, text: item.reminderText });
      }
    }

    return reminders;
  };

  // ---- Dashboard export ----
  window.getSelfcareStatus = function() {
    var items = getItems();
    var checks = loadChecks();
    var total = items.length;
    var checkedCount = 0;
    for (var i = 0; i < items.length; i++) {
      if (checks[items[i].id]) checkedCount++;
      else if (items[i].frequency === 'weekly' && checks['_epds_week'] === weekKey()) checkedCount++;
    }
    return { checked: checkedCount, total: total };
  };

  // ---- Exposed: expand and scroll to card ----
  window.expandSelfcare = function() {
    expanded = true;
    renderCard();
    var el = document.getElementById('rutina-selfcare');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---- Init ----
  function init() {
    renderCard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    pullFromSupabase();
  });

})();
