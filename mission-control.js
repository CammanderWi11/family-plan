// ========== MISSION CONTROL — SEARCH, WATCHLIST, UPCOMING ==========
(function() {

  function today() { var d = new Date(); d.setHours(0,0,0,0); return d; }
  function parseDate(s) { if (!s) return null; var p = s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function daysDiff(from, to) { return Math.floor((to - from) / 86400000); }
  function fmtShortDate(d) {
    var days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()];
  }

  // ========== DATA COLLECTORS ==========

  function collectTramiteItems() {
    var items = [];
    var tramites = window.TRAMITES || {};
    Object.keys(tramites).forEach(function(key) {
      var t = tramites[key];
      var done = false;
      var parts = key.split('-');
      var box = document.querySelector('input[type="checkbox"][data-group="' + parts[0] + '"][data-idx="' + parts.slice(1).join('-') + '"]');
      if (box) done = box.checked;
      // Get name from config, or from DOM if not in config (HTML-rendered groups)
      var name = t.name || '';
      if (!name && box) {
        var nameEl = box.parentElement && box.parentElement.querySelector('.tramite-info .name');
        if (nameEl) name = nameEl.textContent.replace(/\s*[👨👩🎩].*$/, '').trim();
      }
      if (!name) name = key;
      var dl = window.resolveDeadline ? window.resolveDeadline(key) : null;
      items.push({ key: key, name: name, meta: t.meta || '', done: done, deadline: dl, source: 'tramite' });
    });
    return items;
  }

  function collectDocItems() {
    var docs = window.__getTrackedDocs ? window.__getTrackedDocs() : [];
    return docs.map(function(d) {
      var exp = parseDate(d.expiryDate);
      var diff = exp ? daysDiff(today(), exp) : null;
      return { id: d.id, label: d.label, person: d.person, expiryDate: d.expiryDate, expDays: diff, source: 'doc' };
    });
  }

  function collectMedicalItems() {
    var data = window.__getMedical ? window.__getMedical() : null;
    if (!data) return [];
    var items = [];
    ['luca','leo','mum','daddey'].forEach(function(person) {
      (data[person] || []).forEach(function(item) {
        items.push({
          id: item.id, person: person, name: item.name, meta: item.meta || '',
          date: item.date, done: item.done,
          prepNotes: item.prepNotes || '', followUpNotes: item.followUpNotes || '',
          followUpOwner: item.followUpOwner, followUpDue: item.followUpDue,
          source: 'medical'
        });
      });
    });
    return items;
  }

  function collectCalendarItems() {
    var cfg = window.__calendarConfig || window.__defaultCalendarConfig;
    if (!cfg) return [];
    var items = [];
    (cfg.trips || []).forEach(function(t) {
      items.push({ label: t.label, start: t.start, end: t.end, source: 'calendar' });
    });
    if (cfg.mandatory && cfg.mandatory.start) {
      items.push({ label: 'Permiso obligatorio', start: cfg.mandatory.start, end: cfg.mandatory.end, source: 'calendar' });
    }
    (cfg.flexibleBlocks || []).forEach(function(b) {
      items.push({ label: b.label || 'Permiso', start: b.start, end: b.end, source: 'calendar' });
    });
    return items;
  }

  // ========== SCROLL TO ITEM ==========

  function scrollToItem(tab, key) {
    var el = null;
    if (tab === 'tramites') {
      // Trámite key like "binter-0" → find checkbox with data-group="binter" data-idx="0"
      var parts = key.split('-');
      var group = parts[0];
      var idx = parts.slice(1).join('-');
      var box = document.querySelector('#tramites input[type="checkbox"][data-group="' + group + '"][data-idx="' + idx + '"]');
      if (box) {
        el = box.closest('.tramite-row');
        // Expand group if collapsed
        var grp = el && el.closest('.tramite-group');
        if (grp && grp.classList.contains('group-collapsed')) {
          grp.classList.remove('group-collapsed');
          grp.dataset.manualExpand = '1';
        }
      }
      // Also try doc tracker
      if (!el) {
        el = document.querySelector('.doc-tracker-row[data-doc-id="' + key + '"]');
      }
    } else if (tab === 'salud') {
      el = document.querySelector('.salud-item[data-id="' + key + '"]');
      // Expand person section if collapsed
      if (el) {
        var body = el.closest('.salud-person-body');
        if (body && body.style.display === 'none') {
          body.style.display = '';
          var toggle = body.previousElementSibling && body.previousElementSibling.querySelector('.salud-person-toggle');
          if (toggle) toggle.textContent = '▾';
        }
      }
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 2px var(--amber)';
      setTimeout(function() { el.style.boxShadow = ''; }, 2000);
    }
  }

  // ========== WATCHLIST ==========

  function renderWatchlist() {
    var host = document.getElementById('mc-watchlist');
    if (!host) return;
    var alerts = [];
    var now = today();

    collectTramiteItems().forEach(function(t) {
      if (t.done || !t.deadline) return;
      if (t.deadline.daysUntil < 0) {
        alerts.push({ priority: 1, cls: 'wl-red', icon: '📋', label: t.name, sub: Math.abs(t.deadline.daysUntil) + 'd vencido', tab: 'tramites', key: t.key });
      } else if (t.deadline.daysUntil <= 7) {
        alerts.push({ priority: 5, cls: 'wl-amber', icon: '📋', label: t.name, sub: 'en ' + t.deadline.daysUntil + 'd', tab: 'tramites', key: t.key });
      }
    });

    collectDocItems().forEach(function(d) {
      if (d.expDays === null) return;
      if (d.expDays < 0) {
        alerts.push({ priority: 2, cls: 'wl-red', icon: '📁', label: d.label, sub: 'Caducado', tab: 'tramites', key: d.id });
      } else if (d.expDays < 30) {
        alerts.push({ priority: 4, cls: 'wl-amber', icon: '📁', label: d.label, sub: 'caduca en ' + d.expDays + 'd', tab: 'tramites', key: d.id });
      }
    });

    collectMedicalItems().forEach(function(m) {
      if (m.done) return;
      if (m.followUpDue) {
        var fuDiff = daysDiff(now, parseDate(m.followUpDue));
        if (fuDiff < 0) {
          alerts.push({ priority: 3, cls: 'wl-red', icon: '🩺', label: m.name + ' — seguimiento', sub: Math.abs(fuDiff) + 'd vencido', tab: 'salud', key: m.id });
        } else if (fuDiff <= 7) {
          alerts.push({ priority: 5, cls: 'wl-amber', icon: '🩺', label: m.name + ' — seguimiento', sub: 'en ' + fuDiff + 'd', tab: 'salud', key: m.id });
        }
      }
      if (m.date) {
        var apptDiff = daysDiff(now, parseDate(m.date));
        if (apptDiff >= 0 && apptDiff <= 7) {
          alerts.push({ priority: 6, cls: 'wl-blue', icon: '🩺', label: m.name, sub: apptDiff === 0 ? 'Hoy' : 'en ' + apptDiff + 'd', tab: 'salud', key: m.id });
        }
      }
    });

    alerts.sort(function(a, b) { return a.priority - b.priority; });

    if (!alerts.length) { host.style.display = 'none'; return; }

    var html = '<div class="mc-watchlist-card">';
    html += '<div class="mc-watchlist-title">⚠ Atención</div>';
    alerts.forEach(function(a) {
      html += '<div class="mc-wl-item ' + a.cls + '" data-tab="' + a.tab + '" data-key="' + (a.key || '') + '">';
      html += '<span class="mc-wl-icon">' + a.icon + '</span>';
      html += '<span class="mc-wl-label">' + a.label + '</span>';
      html += '<span class="mc-wl-sub">' + a.sub + '</span>';
      html += '</div>';
    });
    html += '</div>';
    host.innerHTML = html;
    host.style.display = '';

    host.querySelectorAll('.mc-wl-item').forEach(function(item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        var tab = item.getAttribute('data-tab');
        var key = item.getAttribute('data-key');
        if (!tab) return;
        var sidebarLink = document.querySelector('.sidebar .nav-item[data-tab="' + tab + '"]');
        if (sidebarLink) sidebarLink.click();
        else { var m = document.querySelector('.mobile-tab[data-tab="' + tab + '"]'); if (m) m.click(); }
        // After tab switch, scroll to the specific item
        if (key) {
          setTimeout(function() { scrollToItem(tab, key); }, 150);
        }
      });
    });
  }

  // ========== UPCOMING 7/30 ==========

  function renderUpcoming() {
    var host = document.getElementById('mc-upcoming');
    if (!host) return;
    var windowDays = host.dataset.window === '30' ? 30 : 7;
    var now = today();
    var cutoff = new Date(now); cutoff.setDate(cutoff.getDate() + windowDays);
    var events = [];

    collectTramiteItems().forEach(function(t) {
      if (t.done || !t.deadline) return;
      if (t.deadline.daysUntil >= 0 && t.deadline.daysUntil <= windowDays) {
        var evDate = new Date(now); evDate.setDate(evDate.getDate() + t.deadline.daysUntil);
        events.push({ date: evDate, icon: '📋', label: t.name, tab: 'tramites' });
      }
    });

    collectMedicalItems().forEach(function(m) {
      if (m.done) return;
      if (m.date) {
        var d = parseDate(m.date);
        if (d >= now && d <= cutoff) {
          events.push({ date: d, icon: '🩺', label: m.name + ' — ' + m.person, tab: 'salud' });
        }
      }
      if (m.followUpDue) {
        var fd = parseDate(m.followUpDue);
        if (fd >= now && fd <= cutoff) {
          events.push({ date: fd, icon: '🩺', label: m.name + ' seguimiento', tab: 'salud' });
        }
      }
    });

    collectDocItems().forEach(function(d) {
      if (!d.expiryDate) return;
      var exp = parseDate(d.expiryDate);
      if (exp >= now && exp <= cutoff) {
        events.push({ date: exp, icon: '📁', label: d.label + ' caduca', tab: 'tramites' });
      }
    });

    collectCalendarItems().forEach(function(c) {
      var s = parseDate(c.start);
      var e = parseDate(c.end);
      if (s && s >= now && s <= cutoff) {
        events.push({ date: s, icon: '📅', label: c.label + ' (inicio)', tab: 'calendario' });
      }
      if (e && e >= now && e <= cutoff && (!s || e.getTime() !== s.getTime())) {
        events.push({ date: e, icon: '📅', label: c.label + ' (fin)', tab: 'calendario' });
      }
    });

    events.sort(function(a, b) { return a.date - b.date; });

    var html = '<div class="glass data-card mc-upcoming-card">';
    html += '<div class="mc-upcoming-header">';
    html += '<span class="dash-label" style="margin-bottom:0;">Próximamente</span>';
    html += '<div class="mc-upcoming-toggle">';
    html += '<button class="mc-toggle-btn' + (windowDays === 7 ? ' active' : '') + '" data-window="7">7 días</button>';
    html += '<button class="mc-toggle-btn' + (windowDays === 30 ? ' active' : '') + '" data-window="30">30 días</button>';
    html += '</div></div>';

    if (!events.length) {
      html += '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">Nada programado</div>';
    } else {
      var lastDateKey = '';
      events.forEach(function(ev) {
        var dk = ev.date.toISOString().slice(0,10);
        if (dk !== lastDateKey) {
          lastDateKey = dk;
          html += '<div class="mc-upcoming-date">' + fmtShortDate(ev.date) + '</div>';
        }
        html += '<div class="mc-upcoming-item" data-tab="' + ev.tab + '">';
        html += '<span class="mc-upcoming-icon">' + ev.icon + '</span>';
        html += '<span class="mc-upcoming-label">' + ev.label + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';
    host.innerHTML = html;

    host.querySelectorAll('.mc-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        host.dataset.window = btn.dataset.window;
        renderUpcoming();
      });
    });

    host.querySelectorAll('.mc-upcoming-item').forEach(function(item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function() {
        var tab = item.getAttribute('data-tab');
        var sidebarLink = document.querySelector('.sidebar .nav-item[data-tab="' + tab + '"]');
        if (sidebarLink) sidebarLink.click();
        else { var m = document.querySelector('.mobile-tab[data-tab="' + tab + '"]'); if (m) m.click(); }
      });
    });
  }

  // ========== GLOBAL SEARCH ==========

  function initSearch() {
    var input = document.getElementById('mc-search-input');
    var clear = document.getElementById('mc-search-clear');
    var dropdown = document.getElementById('mc-search-dropdown');
    if (!input || !dropdown) return;
    var debounceTimer = null;

    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var q = input.value.trim().toLowerCase();
      if (clear) clear.style.display = q ? '' : 'none';
      if (!q) { dropdown.style.display = 'none'; return; }
      debounceTimer = setTimeout(function() { doSearch(q, dropdown); }, 200);
    });

    if (clear) clear.addEventListener('click', function() {
      input.value = '';
      clear.style.display = 'none';
      dropdown.style.display = 'none';
      input.focus();
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#mc-search-wrap')) dropdown.style.display = 'none';
    });
  }

  function doSearch(q, dropdown) {
    var results = [];

    var tramites = window.TRAMITES || {};
    Object.keys(tramites).forEach(function(key) {
      var t = tramites[key];
      var name = t.name || key;
      var meta = t.meta || '';
      if (name.toLowerCase().indexOf(q) !== -1 || meta.toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '📋', label: name, meta: meta, tab: 'tramites', group: 'Trámites' });
      }
    });

    var docs = window.__getTrackedDocs ? window.__getTrackedDocs() : [];
    docs.forEach(function(d) {
      if ((d.label || '').toLowerCase().indexOf(q) !== -1 || (d.notes || '').toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '📁', label: d.label, meta: d.notes || '', tab: 'tramites', group: 'Documentos' });
      }
    });

    var medical = window.__getMedical ? window.__getMedical() : {};
    ['luca','leo','mum','daddey'].forEach(function(person) {
      (medical[person] || []).forEach(function(item) {
        var haystack = [item.name, item.meta, item.prepNotes, item.followUpNotes].join(' ').toLowerCase();
        if (haystack.indexOf(q) !== -1) {
          results.push({ icon: '🩺', label: item.name + ' — ' + person, meta: item.meta || '', tab: 'salud', group: 'Salud' });
        }
      });
    });

    var cfg = window.__calendarConfig || window.__defaultCalendarConfig;
    if (cfg && cfg.trips) {
      cfg.trips.forEach(function(t) {
        if (t.label.toLowerCase().indexOf(q) !== -1) {
          results.push({ icon: '📅', label: t.label, meta: t.start + ' → ' + t.end, tab: 'calendario', group: 'Calendario' });
        }
      });
    }

    results = results.slice(0, 10);

    if (!results.length) {
      dropdown.innerHTML = '<div class="mc-search-empty">Sin resultados</div>';
      dropdown.style.display = '';
      return;
    }

    var html = '';
    var lastGroup = '';
    results.forEach(function(r) {
      if (r.group !== lastGroup) {
        lastGroup = r.group;
        html += '<div class="mc-search-group">' + r.group + '</div>';
      }
      html += '<div class="mc-search-result" data-tab="' + r.tab + '">';
      html += '<span class="mc-search-result-icon">' + r.icon + '</span>';
      html += '<div class="mc-search-result-body">';
      html += '<div class="mc-search-result-label">' + r.label + '</div>';
      if (r.meta) html += '<div class="mc-search-result-meta">' + r.meta.substring(0, 60) + '</div>';
      html += '</div></div>';
    });

    dropdown.innerHTML = html;
    dropdown.style.display = '';

    dropdown.querySelectorAll('.mc-search-result').forEach(function(el) {
      el.addEventListener('click', function() {
        var tab = el.getAttribute('data-tab');
        var sidebarLink = document.querySelector('.sidebar .nav-item[data-tab="' + tab + '"]');
        if (sidebarLink) sidebarLink.click();
        else { var m = document.querySelector('.mobile-tab[data-tab="' + tab + '"]'); if (m) m.click(); }
        dropdown.style.display = 'none';
      });
    });
  }

  // ========== INIT ==========

  function init() {
    initSearch();
    renderWatchlist();
    renderUpcoming();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    setTimeout(function() { renderWatchlist(); renderUpcoming(); }, 2500);
  });

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.target.id === 'resumen' && m.target.classList.contains('active')) {
        renderWatchlist();
        renderUpcoming();
      }
    });
  });
  var resumen = document.getElementById('resumen');
  if (resumen) observer.observe(resumen, { attributes: true, attributeFilter: ['class'] });
})();
