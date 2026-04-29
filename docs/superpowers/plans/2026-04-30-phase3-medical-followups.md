# Phase 3 — Medical Follow-up Watchlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `followUpDone` checkbox to medical follow-up items and surface all open follow-ups in a dedicated watchlist in both the Salud tab and Mission Control.

**Architecture:** Two files change — `salud.js` handles data model, UI rendering, and events; `mission-control.js` handles the watchlist card. All writes go through `__updateMedical()` → `state.meta.medical` → Supabase automatically. No migration script needed — missing `followUpDone` fields are backfilled to `false` on read.

**Tech Stack:** Vanilla JS, HTML string rendering, Supabase via `state.meta` (no direct Supabase calls in these files).

---

## File Map

| File | What changes |
|------|-------------|
| `salud.js` | DEFAULTS get `followUpDone: false`; `getData()` backfills it; owner values renamed `dad→papi`, `mum→mami`; `render()` adds watchlist section + done checkbox in detail panel; `bindEvents()` handles done checkbox; new specialist form includes field |
| `mission-control.js` | `collectMedicalItems()` includes `followUpDone`; `renderWatchlist()` gains "Seguimientos médicos" card showing all open follow-ups; existing date-based alerts respect `followUpDone` |
| `service-worker.js` | VERSION bumped from `v76` to `v77` |

---

## Task 1: Add `followUpDone` to DEFAULTS and backfill on load

**Files:**
- Modify: `salud.js` (DEFAULTS entries + `getData()` function)

- [ ] **Step 1: Add `followUpDone: false` to every DEFAULTS item**

In `salud.js`, every object in DEFAULTS currently ends with `followUpDue: null }`. Add `followUpDone: false` after it. There are 22 items total (luca×12, leo×4, mum×3, daddey×3). The pattern is the same for all:

Change every occurrence of:
```js
followUpOwner: null, followUpDue: null }
```
To:
```js
followUpOwner: null, followUpDue: null, followUpDone: false }
```

- [ ] **Step 2: Backfill `followUpDone` on read in `getData()`**

Replace the current `getData()`:
```js
function getData() {
  var saved = window.__getMedical ? window.__getMedical() : null;
  if (saved && (saved.luca || saved.leo || saved.mum || saved.daddey)) return saved;
  var data = JSON.parse(JSON.stringify(DEFAULTS));
  saveData(data);
  return data;
}
```

With:
```js
function getData() {
  var saved = window.__getMedical ? window.__getMedical() : null;
  var data;
  if (saved && (saved.luca || saved.leo || saved.mum || saved.daddey)) {
    data = saved;
  } else {
    data = JSON.parse(JSON.stringify(DEFAULTS));
    saveData(data);
    return data;
  }
  // Backfill new fields on existing saved data
  ['luca','leo','mum','daddey'].forEach(function(person) {
    (data[person] || []).forEach(function(item) {
      if (item.followUpDone === undefined) item.followUpDone = false;
      // Migrate owner keys: dad→papi, mum→mami
      if (item.followUpOwner === 'dad') item.followUpOwner = 'papi';
      if (item.followUpOwner === 'mum') item.followUpOwner = 'mami';
    });
  });
  return data;
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add salud.js
git commit -m "feat: add followUpDone field to medical items, backfill on load, migrate owner keys"
```

---

## Task 2: Update owner labels and add done checkbox in detail panel

**Files:**
- Modify: `salud.js` (owner `<select>` options + detail panel HTML)

- [ ] **Step 1: Update owner `<select>` options**

Find this block in the `render()` function (around line 149):
```js
html += '<option value=""' + (!item.followUpOwner ? ' selected' : '') + '>Sin asignar</option>';
html += '<option value="dad"' + (item.followUpOwner === 'dad' ? ' selected' : '') + '>Papá</option>';
html += '<option value="mum"' + (item.followUpOwner === 'mum' ? ' selected' : '') + '>Mamá</option>';
html += '<option value="alfred"' + (item.followUpOwner === 'alfred' ? ' selected' : '') + '>Alfred</option>';
```

Replace with:
```js
html += '<option value=""' + (!item.followUpOwner ? ' selected' : '') + '>Sin asignar</option>';
html += '<option value="papi"' + (item.followUpOwner === 'papi' ? ' selected' : '') + '>Papi</option>';
html += '<option value="mami"' + (item.followUpOwner === 'mami' ? ' selected' : '') + '>Mami</option>';
html += '<option value="alfred"' + (item.followUpOwner === 'alfred' ? ' selected' : '') + '>Alfred</option>';
```

- [ ] **Step 2: Add `followUpDone` checkbox row to detail panel**

Find the closing `</div>` of the `salud-followup-extra` div (after the date limit input, around line 157). After the closing `</div></div>` of that row, add:

```js
html += '<div class="salud-detail-row salud-followup-done-row">';
html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
html += '<input type="checkbox" class="salud-followup-done-cb"' + (item.followUpDone ? ' checked' : '') + ' data-id="' + item.id + '" data-person="' + person.key + '">';
html += '<span>Seguimiento completado</span>';
html += '</label>';
html += '</div>';
```

Place this immediately before the `Adjuntar archivo` button row.

- [ ] **Step 3: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add salud.js
git commit -m "feat: update owner labels to Papi/Mami, add followUpDone checkbox in detail panel"
```

---

## Task 3: Add event handler for `followUpDone` checkbox

**Files:**
- Modify: `salud.js` (`bindEvents()` function)

- [ ] **Step 1: Add handler for `.salud-followup-done-cb` checkboxes**

In `bindEvents()`, after the existing `.salud-check input` handler block, add:

```js
document.querySelectorAll('.salud-followup-done-cb').forEach(function(cb) {
  cb.addEventListener('change', function() {
    var data = getData();
    var item = findItem(data, cb.dataset.person, cb.dataset.id);
    if (item) {
      item.followUpDone = cb.checked;
      saveData(data);
      var expanded = getExpandedState();
      render();
      restoreExpandedState(expanded);
    }
  });
});
```

- [ ] **Step 2: Add `followUpDone: false` to new specialist items**

In `bindEvents()`, find the `data[personKey].push({...})` call inside the add-specialist form save handler. Add `followUpDone: false` after `followUpDue: null`:

```js
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
  followUpDue: null,
  followUpDone: false
});
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add salud.js
git commit -m "feat: wire followUpDone checkbox event handler, add field to new specialist items"
```

---

## Task 4: Add "Seguimientos pendientes" section at top of Salud tab

**Files:**
- Modify: `salud.js` (`render()` function)

- [ ] **Step 1: Add a helper function to collect open follow-ups**

Add this function just before the `render()` function:

```js
function collectOpenFollowUps(data) {
  var PERSON_MAP = { luca: '👶', leo: '🧒', mum: '👩', daddey: '👨' };
  var OWNER_LABEL = { papi: 'Papi', mami: 'Mami', alfred: 'Alfred' };
  var open = [];
  var done = [];
  ['luca','leo','mum','daddey'].forEach(function(personKey) {
    (data[personKey] || []).forEach(function(item) {
      if (!item.followUpNotes && !item.followUpOwner && !item.followUpDue) return;
      var entry = {
        id: item.id,
        person: personKey,
        emoji: PERSON_MAP[personKey] || '',
        name: item.name,
        ownerLabel: item.followUpOwner ? (OWNER_LABEL[item.followUpOwner] || item.followUpOwner) : null,
        due: item.followUpDue || null,
        done: !!item.followUpDone
      };
      if (entry.done) done.push(entry);
      else open.push(entry);
    });
  });
  // Sort open: overdue first, then by due date, then undated
  var now = new Date(); now.setHours(0,0,0,0);
  open.sort(function(a, b) {
    var aTs = a.due ? new Date(a.due).getTime() : Infinity;
    var bTs = b.due ? new Date(b.due).getTime() : Infinity;
    return aTs - bTs;
  });
  return { open: open, done: done };
}
```

- [ ] **Step 2: Render the watchlist section at the top of `render()`**

In `render()`, after `var html = '';` and before the `PERSONS.forEach(...)` loop, add:

```js
var fuData = collectOpenFollowUps(data);
if (fuData.open.length || fuData.done.length) {
  var nowTs = new Date(); nowTs.setHours(0,0,0,0); nowTs = nowTs.getTime();
  html += '<div class="glass data-card salud-followup-watchlist" id="salud-fu-watchlist">';
  html += '<h2 class="salud-person-title" data-section="fu-watchlist">';
  html += '<span class="salud-person-toggle" id="salud-toggle-fu-watchlist">▸</span> ';
  html += '📋 Seguimientos pendientes';
  if (fuData.open.length) html += ' <span class="salud-fu-count">' + fuData.open.length + '</span>';
  html += '</h2>';
  html += '<div class="salud-person-body" id="salud-body-fu-watchlist" style="display:none;">';

  if (fuData.open.length) {
    fuData.open.forEach(function(entry) {
      var dueTs = entry.due ? new Date(entry.due).setHours(0,0,0,0) : null;
      var isOverdue = dueTs !== null && dueTs < nowTs;
      var dueTxt = entry.due ? (function() {
        var p = entry.due.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2);
      })() : 'sin fecha';
      html += '<div class="salud-fu-row" data-fu-id="' + entry.id + '" data-fu-person="' + entry.person + '">';
      html += '<label class="salud-fu-check"><input type="checkbox" class="salud-followup-done-cb" data-id="' + entry.id + '" data-person="' + entry.person + '"></label>';
      html += '<span class="salud-fu-emoji">' + entry.emoji + '</span>';
      html += '<span class="salud-fu-name">' + entry.name + '</span>';
      if (entry.ownerLabel) html += '<span class="salud-fu-owner">' + entry.ownerLabel + '</span>';
      html += '<span class="salud-fu-due' + (isOverdue ? ' salud-fu-overdue' : '') + '">' + dueTxt + '</span>';
      html += '</div>';
    });
  } else {
    html += '<div class="salud-empty">Sin seguimientos pendientes</div>';
  }

  if (fuData.done.length) {
    html += '<div class="salud-fu-done-toggle" id="salud-fu-done-toggle">▸ Completados (' + fuData.done.length + ')</div>';
    html += '<div id="salud-fu-done-list" style="display:none;">';
    fuData.done.forEach(function(entry) {
      var dueTxt = entry.due ? (function() {
        var p = entry.due.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2);
      })() : 'sin fecha';
      html += '<div class="salud-fu-row salud-fu-row-done" data-fu-id="' + entry.id + '" data-fu-person="' + entry.person + '">';
      html += '<label class="salud-fu-check"><input type="checkbox" class="salud-followup-done-cb" data-id="' + entry.id + '" data-person="' + entry.person + '" checked></label>';
      html += '<span class="salud-fu-emoji">' + entry.emoji + '</span>';
      html += '<span class="salud-fu-name salud-fu-strikethrough">' + entry.name + '</span>';
      if (entry.ownerLabel) html += '<span class="salud-fu-owner">' + entry.ownerLabel + '</span>';
      html += '<span class="salud-fu-due">' + dueTxt + '</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  html += '</div>';
}
```

- [ ] **Step 3: Add toggle handler for the watchlist section in `bindEvents()`**

Add this at the end of `bindEvents()`, before the final attach-render call:

```js
var fuTitle = document.querySelector('.salud-followup-watchlist .salud-person-title');
if (fuTitle) {
  fuTitle.addEventListener('click', function() {
    var body = document.getElementById('salud-body-fu-watchlist');
    var toggle = document.getElementById('salud-toggle-fu-watchlist');
    if (body) {
      var hidden = body.style.display === 'none';
      body.style.display = hidden ? '' : 'none';
      if (toggle) toggle.textContent = hidden ? '▾' : '▸';
    }
  });
}

var fuDoneToggle = document.getElementById('salud-fu-done-toggle');
if (fuDoneToggle) {
  fuDoneToggle.addEventListener('click', function() {
    var list = document.getElementById('salud-fu-done-list');
    if (list) {
      var hidden = list.style.display === 'none';
      list.style.display = hidden ? '' : 'none';
      fuDoneToggle.textContent = (hidden ? '▾' : '▸') + ' Completados (' + document.querySelectorAll('#salud-fu-done-list .salud-fu-row').length + ')';
    }
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add salud.js
git commit -m "feat: add Seguimientos pendientes watchlist section at top of Salud tab"
```

---

## Task 5: Add styles for the follow-up watchlist

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add follow-up watchlist styles**

Open `styles.css` and append these rules at the end of the file:

```css
/* ========== SALUD — FOLLOW-UP WATCHLIST ========== */
.salud-fu-count {
  display: inline-block;
  background: var(--amber, #f59e0b);
  color: #000;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 7px;
  margin-left: 6px;
  vertical-align: middle;
}

.salud-fu-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 0.9rem;
}

.salud-fu-row:last-child { border-bottom: none; }

.salud-fu-check { flex-shrink: 0; }

.salud-fu-emoji { flex-shrink: 0; font-size: 1rem; }

.salud-fu-name { flex: 1; min-width: 0; }

.salud-fu-strikethrough {
  text-decoration: line-through;
  opacity: 0.5;
}

.salud-fu-owner {
  font-size: 0.75rem;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.salud-fu-due {
  font-size: 0.78rem;
  opacity: 0.6;
  white-space: nowrap;
  flex-shrink: 0;
}

.salud-fu-overdue {
  color: var(--red, #ef4444);
  opacity: 1;
  font-weight: 600;
}

.salud-fu-done-toggle {
  font-size: 0.82rem;
  opacity: 0.55;
  cursor: pointer;
  padding: 8px 0 4px;
  user-select: none;
}

.salud-fu-done-toggle:hover { opacity: 0.8; }

.salud-fu-row-done { opacity: 0.6; }
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add styles.css
git commit -m "feat: add styles for follow-up watchlist rows and badges"
```

---

## Task 6: Update Mission Control watchlist

**Files:**
- Modify: `mission-control.js` (`collectMedicalItems()` + `renderWatchlist()`)

- [ ] **Step 1: Add `followUpDone` to `collectMedicalItems()`**

Find `collectMedicalItems()`. The `items.push({...})` call inside currently includes `followUpDue`. Add `followUpDone`:

```js
items.push({
  id: item.id, person: person, name: item.name, meta: item.meta || '',
  date: item.date, done: item.done,
  prepNotes: item.prepNotes || '', followUpNotes: item.followUpNotes || '',
  followUpOwner: item.followUpOwner, followUpDue: item.followUpDue,
  followUpDone: !!item.followUpDone,
  source: 'medical'
});
```

- [ ] **Step 2: Extend `renderWatchlist()` to show all open follow-ups and respect `followUpDone`**

In `renderWatchlist()`, find the `collectMedicalItems().forEach(...)` block. Replace the entire block:

```js
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
```

With:

```js
var openFollowUps = [];
collectMedicalItems().forEach(function(m) {
  if (m.done) return;
  // Appointment alerts (unchanged)
  if (m.date) {
    var apptDiff = daysDiff(now, parseDate(m.date));
    if (apptDiff >= 0 && apptDiff <= 7) {
      alerts.push({ priority: 6, cls: 'wl-blue', icon: '🩺', label: m.name, sub: apptDiff === 0 ? 'Hoy' : 'en ' + apptDiff + 'd', tab: 'salud', key: m.id });
    }
  }
  // Collect open follow-ups (has any follow-up content and not done)
  if (!m.followUpDone && (m.followUpNotes || m.followUpOwner || m.followUpDue)) {
    var dueTs = m.followUpDue ? parseDate(m.followUpDue).getTime() : Infinity;
    openFollowUps.push({ id: m.id, name: m.name, owner: m.followUpOwner, due: m.followUpDue, dueTs: dueTs, tab: 'salud' });
  }
});
// Sort open follow-ups: overdue first, then soonest, then undated
var nowTs = now.getTime();
openFollowUps.sort(function(a, b) { return a.dueTs - b.dueTs; });
```

- [ ] **Step 3: Add "Seguimientos médicos" card to `renderWatchlist()`**

Find where `host.innerHTML = html;` is set (after the alerts loop). The current code builds `html` from alerts only. We need to add the follow-up card separately.

After the closing `html += '</div>';` (end of the alerts card) and before `host.innerHTML = html;`, add:

```js
if (openFollowUps.length) {
  var OWNER_LABEL = { papi: 'Papi', mami: 'Mami', alfred: 'Alfred' };
  html += '<div class="mc-watchlist-card mc-fu-card">';
  html += '<div class="mc-watchlist-title">🩺 Seguimientos médicos <span class="mc-fu-badge">' + openFollowUps.length + '</span></div>';
  var preview = openFollowUps.slice(0, 3);
  preview.forEach(function(fu) {
    var isOverdue = fu.due && parseDate(fu.due).getTime() < nowTs;
    var dueTxt = fu.due ? (function() {
      var p = fu.due.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2);
    })() : 'sin fecha';
    html += '<div class="mc-wl-item' + (isOverdue ? ' wl-red' : ' wl-amber') + '" data-tab="salud" data-key="' + fu.id + '">';
    html += '<span class="mc-wl-label">' + fu.name + '</span>';
    if (fu.owner && OWNER_LABEL[fu.owner]) html += '<span class="mc-wl-sub">' + OWNER_LABEL[fu.owner] + '</span>';
    html += '<span class="mc-wl-sub' + (isOverdue ? ' mc-fu-overdue' : '') + '">' + dueTxt + '</span>';
    html += '</div>';
  });
  html += '</div>';
}
```

Also update the empty-state check: the watchlist currently hides itself with `if (!alerts.length) { host.style.display = 'none'; return; }`. Change to:

```js
if (!alerts.length && !openFollowUps.length) { host.style.display = 'none'; return; }
```

- [ ] **Step 4: Add CSS for Mission Control follow-up card**

Append to `styles.css`:

```css
/* ========== MISSION CONTROL — FOLLOW-UP CARD ========== */
.mc-fu-badge {
  display: inline-block;
  background: var(--amber, #f59e0b);
  color: #000;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 7px;
  margin-left: 6px;
  vertical-align: middle;
}

.mc-fu-overdue {
  color: var(--red, #ef4444) !important;
  font-weight: 600;
}
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add mission-control.js styles.css
git commit -m "feat: add Seguimientos médicos card to Mission Control watchlist"
```

---

## Task 7: Bump service worker version and push

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Bump VERSION from v76 to v77**

In `service-worker.js` line 1, change:
```js
const VERSION = 'v76-family-plan';
```
To:
```js
const VERSION = 'v77-family-plan';
```

- [ ] **Step 2: Commit and push**

```bash
cd "/Users/openbob/Library/Mobile Documents/com~apple~CloudDocs/AI Coworking/Personal Projects/Family Plan"
git add service-worker.js
git commit -m "chore: bump SW to v77 for Phase 3 follow-up watchlist"
git push
```

---

## Self-Review Checklist

- [x] `followUpDone` field covered: DEFAULTS, backfill, specialist form, checkbox UI, event handler
- [x] Owner rename `dad→papi`, `mum→mami`: DEFAULTS migration in `getData()`, select options in render
- [x] Salud watchlist section: open items, done accordion, toggle handler, styles
- [x] Mission Control card: all open follow-ups (not just dated), overdue highlight, nav on click, empty state
- [x] Supabase sync: all writes go through `saveData()` → `__updateMedical()` → `state.meta.medical`
- [x] SW version bumped
- [x] No TBDs or placeholders
