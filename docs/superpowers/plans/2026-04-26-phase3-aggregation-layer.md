# Phase 3: Aggregation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smart watchlist, upcoming 7/30 days panel, global search, and structured medical follow-ups to Mission Control.

**Architecture:** New `mission-control.js` handles all three Mission Control features (search, watchlist, upcoming). It reads from existing data accessors (`window.__getTrackedDocs`, `window.__getMedical`, `window.TRAMITES`, `window.resolveDeadline`, calendar config). Medical follow-up fields are added in `salud.js`. The old urgent banner in `tramites.js` is removed.

**Tech Stack:** Vanilla JS, existing Supabase sync, existing CSS custom properties.

---

### Task 1: Add structured follow-up fields to salud.js

**Files:**
- Modify: `salud.js`

- [ ] **Step 1: Add followUpOwner and followUpDue to DEFAULTS**

In `salud.js`, in every item across all four person arrays in `DEFAULTS`, add two fields after `followUpNotes`:

```javascript
followUpOwner: null, followUpDue: null
```

This applies to ALL items in DEFAULTS (luca, leo, mum, daddey). For example, the first luca item becomes:

```javascript
{ id: 'luca_rev_1m', category: 'revision', name: 'Revisión del niño sano (1 mes)', meta: 'Pediatra asignado · Primera visita del Programa de Salud Infantil', ageLabel: '1 mes', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null },
```

Do this for every single item in DEFAULTS.

- [ ] **Step 2: Add followUpOwner and followUpDue fields to the detail panel render**

In salud.js, find the line that renders the follow-up textarea (search for `Seguimiento`). After that `</div>` closing the followUpNotes textarea row, add:

```javascript
          html += '<div class="salud-detail-row salud-followup-extra">';
          html += '<div style="display:flex;gap:8px;">';
          html += '<div style="flex:1;"><label>Responsable</label>';
          html += '<select class="doc-tracker-input salud-field" data-field="followUpOwner" data-id="' + item.id + '" data-person="' + person.key + '" style="width:100%;">';
          html += '<option value=""' + (!item.followUpOwner ? ' selected' : '') + '>Sin asignar</option>';
          html += '<option value="dad"' + (item.followUpOwner === 'dad' ? ' selected' : '') + '>Dad</option>';
          html += '<option value="mum"' + (item.followUpOwner === 'mum' ? ' selected' : '') + '>Mum</option>';
          html += '<option value="alfred"' + (item.followUpOwner === 'alfred' ? ' selected' : '') + '>Alfred</option>';
          html += '</select></div>';
          html += '<div style="flex:1;"><label>Fecha límite</label>';
          html += '<input type="date" class="doc-tracker-input salud-field" value="' + (item.followUpDue || '') + '" data-field="followUpDue" data-id="' + item.id + '" data-person="' + person.key + '" style="width:100%;"></div>';
          html += '</div></div>';
```

- [ ] **Step 3: Also add these fields to the specialist add form defaults**

In the `showAddForm` / add specialist click handler, find where the new specialist object is pushed. Add the two new fields:

```javascript
          data[personKey].push({
            id: 'med_' + Date.now(),
            category: 'specialist',
            name: name,
            meta: document.getElementById('saf-meta-' + personKey).value.trim(),
            ageLabel: null,
            date: document.getElementById('saf-date-' + personKey).value || null,
            done: false,
            prepNotes: '',
            followUpNotes: '',
            followUpOwner: null,
            followUpDue: null
          });
```

- [ ] **Step 4: Commit**

```bash
git add salud.js
git commit -m "feat: add followUpOwner and followUpDue fields to medical appointments"
```

---

### Task 2: Update index.html — replace urgent banner, add search and upcoming hosts

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the urgent banner and add new Mission Control elements**

In `index.html`, find the resumen section (around line 174-200). Replace this block:

```html
    <div class="resumen-banners" id="resumen-banners"></div>
    <div class="urgent-banner" id="urgent-banner" style="display:none;">
      <span class="urgent-text">URGENTE ESTA SEMANA</span>
      <span class="urgent-arrow">&rarr;</span>
      <button class="urgent-x" id="urgent-dismiss" title="Hide until logout">&times;</button>
    </div>
    <div class="glass countdown-dashboard" id="leave-countdown">
```

With:

```html
    <div class="mc-search-wrap" id="mc-search-wrap">
      <input type="text" id="mc-search-input" class="mc-search-input" placeholder="Buscar trámites, documentos, citas..." autocomplete="off">
      <button class="mc-search-clear" id="mc-search-clear" style="display:none;">&times;</button>
      <div class="mc-search-dropdown" id="mc-search-dropdown" style="display:none;"></div>
    </div>
    <div class="resumen-banners" id="resumen-banners"></div>
    <div id="mc-watchlist" style="display:none;"></div>
    <div class="glass countdown-dashboard" id="leave-countdown">
```

- [ ] **Step 2: Add upcoming panel host after the leave countdown card closing div**

Find the closing `</div>` of the leave countdown card (the one after the progress track). After it, add:

```html
    <div id="mc-upcoming"></div>
```

- [ ] **Step 3: Add script tag**

After the `salud.js` script tag, add:

```html
<script src="mission-control.js"></script>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add search bar, watchlist host, upcoming host to Mission Control"
```

---

### Task 3: Remove old urgent banner JS from tramites.js

**Files:**
- Modify: `tramites.js`

- [ ] **Step 1: Remove renderUrgentBanner function**

In `tramites.js`, find the `renderUrgentBanner` function (around line 517). Delete the entire function (from `function renderUrgentBanner()` to its closing `}`).

- [ ] **Step 2: Remove calls to renderUrgentBanner**

Search for `renderUrgentBanner` in tramites.js and remove/comment out any calls to it.

- [ ] **Step 3: Remove the urgent-dismiss event listener**

Find the code that attaches to `urgent-dismiss` (around line 1089). Remove the block:

```javascript
    sessionStorage.setItem('urgent-banner-dismissed', '1');
    document.getElementById('urgent-banner').style.display = 'none';
```

And the event listener setup for it.

- [ ] **Step 4: Commit**

```bash
git add tramites.js
git commit -m "feat: remove old urgent banner logic from tramites.js"
```

---

### Task 4: Create mission-control.js

**Files:**
- Create: `mission-control.js`

- [ ] **Step 1: Create mission-control.js**

```javascript
// ========== MISSION CONTROL — SEARCH, WATCHLIST, UPCOMING ==========
(function() {

  // ---- Helpers ----
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
    var tState = (window.__appState && window.__appState.tramites) || {};
    Object.keys(tramites).forEach(function(key) {
      var t = tramites[key];
      var done = false;
      // Check if checked via DOM (most reliable for current state)
      var box = document.querySelector('input[type="checkbox"][data-group="' + key.split('-')[0] + '"][data-idx="' + key.split('-').slice(1).join('-') + '"]');
      if (box) done = box.checked;
      var dl = window.resolveDeadline ? window.resolveDeadline(key) : null;
      items.push({ key: key, name: t.name || key, meta: t.meta || '', done: done, deadline: dl, source: 'tramite' });
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
    // Leave blocks
    if (cfg.mandatory && cfg.mandatory.start) {
      items.push({ label: 'Permiso obligatorio', start: cfg.mandatory.start, end: cfg.mandatory.end, source: 'calendar' });
    }
    (cfg.flexibleBlocks || []).forEach(function(b) {
      items.push({ label: b.label || 'Permiso', start: b.start, end: b.end, source: 'calendar' });
    });
    return items;
  }

  // ========== WATCHLIST ==========

  function renderWatchlist() {
    var host = document.getElementById('mc-watchlist');
    if (!host) return;

    var alerts = [];
    var now = today();

    // 1. Overdue trámites
    collectTramiteItems().forEach(function(t) {
      if (t.done || !t.deadline) return;
      if (t.deadline.daysUntil < 0) {
        alerts.push({ priority: 1, cls: 'wl-red', icon: '📋', label: t.name, sub: Math.abs(t.deadline.daysUntil) + 'd vencido', tab: 'tramites' });
      } else if (t.deadline.daysUntil <= 7) {
        alerts.push({ priority: 5, cls: 'wl-amber', icon: '📋', label: t.name, sub: 'en ' + t.deadline.daysUntil + 'd', tab: 'tramites' });
      }
    });

    // 2. Expired / expiring docs
    collectDocItems().forEach(function(d) {
      if (d.expDays === null) return;
      if (d.expDays < 0) {
        alerts.push({ priority: 2, cls: 'wl-red', icon: '📁', label: d.label, sub: 'Caducado', tab: 'tramites' });
      } else if (d.expDays < 30) {
        alerts.push({ priority: 4, cls: 'wl-amber', icon: '📁', label: d.label, sub: 'caduca en ' + d.expDays + 'd', tab: 'tramites' });
      }
    });

    // 3. Overdue medical follow-ups + upcoming appointments
    collectMedicalItems().forEach(function(m) {
      if (m.done) return;
      // Overdue follow-ups
      if (m.followUpDue) {
        var fuDiff = daysDiff(now, parseDate(m.followUpDue));
        if (fuDiff < 0) {
          alerts.push({ priority: 3, cls: 'wl-red', icon: '🩺', label: m.name + ' — seguimiento', sub: Math.abs(fuDiff) + 'd vencido', tab: 'salud' });
        } else if (fuDiff <= 7) {
          alerts.push({ priority: 5, cls: 'wl-amber', icon: '🩺', label: m.name + ' — seguimiento', sub: 'en ' + fuDiff + 'd', tab: 'salud' });
        }
      }
      // Upcoming appointments
      if (m.date) {
        var apptDiff = daysDiff(now, parseDate(m.date));
        if (apptDiff >= 0 && apptDiff <= 7) {
          alerts.push({ priority: 6, cls: 'wl-blue', icon: '🩺', label: m.name, sub: apptDiff === 0 ? 'Hoy' : 'en ' + apptDiff + 'd', tab: 'salud' });
        }
      }
    });

    // Sort by priority
    alerts.sort(function(a, b) { return a.priority - b.priority; });

    if (!alerts.length) {
      host.style.display = 'none';
      return;
    }

    var html = '<div class="mc-watchlist-card">';
    html += '<div class="mc-watchlist-title">⚠ Atención</div>';
    alerts.forEach(function(a) {
      html += '<div class="mc-wl-item ' + a.cls + '" data-tab="' + a.tab + '">';
      html += '<span class="mc-wl-icon">' + a.icon + '</span>';
      html += '<span class="mc-wl-label">' + a.label + '</span>';
      html += '<span class="mc-wl-sub">' + a.sub + '</span>';
      html += '</div>';
    });
    html += '</div>';

    host.innerHTML = html;
    host.style.display = '';

    // Tap to navigate
    host.querySelectorAll('.mc-wl-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var tab = item.dataset.tab;
        var nav = document.querySelector('.nav-item[data-tab="' + tab + '"]');
        if (nav) nav.click();
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

    // Trámites with deadlines
    collectTramiteItems().forEach(function(t) {
      if (t.done || !t.deadline) return;
      var d = t.deadline.date ? parseDate(t.deadline.date.toISOString().slice(0,10)) : null;
      if (!d) {
        // resolveDeadline returns { date: Date, daysUntil: N }
        if (t.deadline.daysUntil >= 0 && t.deadline.daysUntil <= windowDays) {
          var evDate = new Date(now); evDate.setDate(evDate.getDate() + t.deadline.daysUntil);
          events.push({ date: evDate, icon: '📋', label: t.name, tab: 'tramites' });
        }
        return;
      }
      if (d >= now && d <= cutoff) {
        events.push({ date: d, icon: '📋', label: t.name, tab: 'tramites' });
      }
    });

    // Medical appointments
    collectMedicalItems().forEach(function(m) {
      if (m.done || !m.date) return;
      var d = parseDate(m.date);
      if (d >= now && d <= cutoff) {
        events.push({ date: d, icon: '🩺', label: m.name + ' — ' + m.person, tab: 'salud' });
      }
      if (m.followUpDue) {
        var fd = parseDate(m.followUpDue);
        if (fd >= now && fd <= cutoff) {
          events.push({ date: fd, icon: '🩺', label: m.name + ' seguimiento', tab: 'salud' });
        }
      }
    });

    // Doc expiries
    collectDocItems().forEach(function(d) {
      if (!d.expiryDate) return;
      var exp = parseDate(d.expiryDate);
      if (exp >= now && exp <= cutoff) {
        events.push({ date: exp, icon: '📁', label: d.label + ' caduca', tab: 'tramites' });
      }
    });

    // Calendar (trips, leave blocks)
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

    // Sort by date
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

    // Toggle buttons
    host.querySelectorAll('.mc-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        host.dataset.window = btn.dataset.window;
        renderUpcoming();
      });
    });

    // Tap to navigate
    host.querySelectorAll('.mc-upcoming-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var nav = document.querySelector('.nav-item[data-tab="' + item.dataset.tab + '"]');
        if (nav) nav.click();
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
      clear.style.display = q ? '' : 'none';
      if (!q) { dropdown.style.display = 'none'; return; }
      debounceTimer = setTimeout(function() { doSearch(q, dropdown); }, 200);
    });

    clear.addEventListener('click', function() {
      input.value = '';
      clear.style.display = 'none';
      dropdown.style.display = 'none';
      input.focus();
    });

    // Close dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#mc-search-wrap')) dropdown.style.display = 'none';
    });
  }

  function doSearch(q, dropdown) {
    var results = [];

    // Trámites
    var tramites = window.TRAMITES || {};
    Object.keys(tramites).forEach(function(key) {
      var t = tramites[key];
      var name = t.name || key;
      var meta = t.meta || '';
      if (name.toLowerCase().indexOf(q) !== -1 || meta.toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '📋', label: name, meta: meta, tab: 'tramites', group: 'Trámites' });
      }
    });

    // Documents
    var docs = window.__getTrackedDocs ? window.__getTrackedDocs() : [];
    docs.forEach(function(d) {
      if ((d.label || '').toLowerCase().indexOf(q) !== -1 || (d.notes || '').toLowerCase().indexOf(q) !== -1) {
        results.push({ icon: '📁', label: d.label, meta: d.notes || '', tab: 'tramites', group: 'Documentos' });
      }
    });

    // Medical
    var medical = window.__getMedical ? window.__getMedical() : {};
    ['luca','leo','mum','daddey'].forEach(function(person) {
      (medical[person] || []).forEach(function(item) {
        var haystack = [item.name, item.meta, item.prepNotes, item.followUpNotes].join(' ').toLowerCase();
        if (haystack.indexOf(q) !== -1) {
          results.push({ icon: '🩺', label: item.name + ' — ' + person, meta: item.meta || '', tab: 'salud', group: 'Salud' });
        }
      });
    });

    // Calendar trips
    var cfg = window.__calendarConfig || window.__defaultCalendarConfig;
    if (cfg && cfg.trips) {
      cfg.trips.forEach(function(t) {
        if (t.label.toLowerCase().indexOf(q) !== -1) {
          results.push({ icon: '📅', label: t.label, meta: t.start + ' → ' + t.end, tab: 'calendario', group: 'Calendario' });
        }
      });
    }

    // Render (max 10)
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
        var nav = document.querySelector('.nav-item[data-tab="' + el.dataset.tab + '"]');
        if (nav) nav.click();
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

  // Re-render when tab becomes active
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
```

- [ ] **Step 2: Commit**

```bash
git add mission-control.js
git commit -m "feat: create mission-control.js with search, watchlist, upcoming panel"
```

---

### Task 5: Add Mission Control CSS styles

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append Mission Control styles to styles.css**

```css
/* ---- Mission Control — Search, Watchlist, Upcoming ---- */

/* Search */
.mc-search-wrap { position: relative; margin-bottom: 16px; }
.mc-search-input {
  width: 100%; padding: 12px 40px 12px 16px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  color: var(--text); font-size: 14px; font-family: var(--font-sans); outline: none;
}
.mc-search-input::placeholder { color: var(--text-muted); }
.mc-search-input:focus { border-color: var(--amber); }
.mc-search-clear {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-muted); font-size: 18px;
  cursor: pointer; padding: 4px;
}
.mc-search-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  margin-top: 4px; max-height: 320px; overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.mc-search-group {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text-muted); padding: 10px 14px 4px;
}
.mc-search-result {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  cursor: pointer; border-bottom: 1px solid var(--border);
}
.mc-search-result:hover { background: rgba(255,255,255,0.03); }
.mc-search-result:last-child { border-bottom: none; }
.mc-search-result-icon { font-size: 16px; flex: 0 0 auto; }
.mc-search-result-body { flex: 1; min-width: 0; }
.mc-search-result-label { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-search-result-meta { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-search-empty { padding: 14px; color: var(--text-muted); font-size: 13px; text-align: center; }

/* Watchlist */
.mc-watchlist-card {
  border-radius: 10px; margin-bottom: 16px; overflow: hidden;
  border: 1px solid var(--red-border);
  background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(251,113,133,0.04));
}
.mc-watchlist-title {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;
  color: var(--red); padding: 12px 14px 6px; font-weight: 700;
}
.mc-wl-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  cursor: pointer; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.04);
}
.mc-wl-item:hover { background: rgba(255,255,255,0.03); }
.mc-wl-icon { font-size: 14px; flex: 0 0 auto; }
.mc-wl-label { flex: 1; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-wl-sub { font-family: var(--font-mono); font-size: 11px; flex: 0 0 auto; }
.wl-red .mc-wl-sub { color: var(--red); font-weight: 700; }
.wl-amber .mc-wl-sub { color: var(--amber); }
.wl-blue .mc-wl-sub { color: var(--blue); }

/* Upcoming */
.mc-upcoming-card { margin-top: 18px; }
.mc-upcoming-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.mc-upcoming-toggle { display: flex; gap: 4px; }
.mc-toggle-btn {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.5px;
  padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border);
  background: none; color: var(--text-muted); cursor: pointer;
}
.mc-toggle-btn.active { background: var(--amber-softer); color: var(--amber); border-color: rgba(251,191,36,0.25); }
.mc-upcoming-date {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px;
  color: var(--text-muted); margin: 12px 0 4px; text-transform: uppercase;
}
.mc-upcoming-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 0;
  border-bottom: 1px solid var(--border); cursor: pointer; font-size: 13px;
}
.mc-upcoming-item:hover { color: var(--amber); }
.mc-upcoming-icon { font-size: 14px; flex: 0 0 auto; }
.mc-upcoming-label { flex: 1; color: var(--text); }

/* Follow-up extra row in salud */
.salud-followup-extra label {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; display: block;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add Mission Control CSS — search, watchlist, upcoming, follow-up fields"
```

---

### Task 6: Update service worker and push

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Add mission-control.js to SHELL cache**

In `service-worker.js`, add `'./mission-control.js'` to the SHELL array.

- [ ] **Step 2: Bump VERSION**

Increment the VERSION string.

- [ ] **Step 3: Commit and push**

```bash
git add service-worker.js
git commit -m "chore: add mission-control.js to SW cache, bump version"
git push
```

---

### Task 7: Integration verification

- [ ] **Step 1: Verify search**

Open the app, go to Mission Control. Type "pasaporte" in the search bar. Should see results from trámites and/or documents. Click a result — should navigate to the correct tab. Clear the search.

- [ ] **Step 2: Verify watchlist**

If any trámites are overdue or due this week, the watchlist strip should appear between the banners and the leave card. Red items for overdue, amber for upcoming. Tap to navigate. If nothing is due, the strip should be hidden.

- [ ] **Step 3: Verify upcoming panel**

Below the leave card, the upcoming panel should show events in the next 7 days. Toggle to 30 days — more events should appear. Each item shows date, icon, label. Tap to navigate.

- [ ] **Step 4: Verify medical follow-up fields**

Go to Salud tab. Expand any appointment. Below the follow-up textarea, there should be a "Responsable" dropdown and "Fecha límite" date picker. Set a follow-up owner and due date. Go back to Mission Control — if the due date is within 7 days, it should appear in both the watchlist and upcoming panel.

- [ ] **Step 5: Verify sync**

Open on second device. Confirm follow-up owner/due date syncs. Confirm watchlist and upcoming reflect synced data.
