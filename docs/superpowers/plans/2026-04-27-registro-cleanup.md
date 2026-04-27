# Registro de Luca — Targeted Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up Registro de Luca — reorder sections, fix bugs, polish UX — without restructuring the file.

**Architecture:** All changes are in the existing `registro.js` IIFE, `styles.css`, and `service-worker.js`. No new files. Supabase tables for reminder sync are created via the dashboard (not code). The section order changes happen in `renderSection()`. Bug fixes are scattered across helper functions.

**Tech Stack:** Vanilla JS, CSS, Supabase JS client (already loaded globally as `window.sb`)

**Note:** This project has no test framework. Verify each task by opening the app in a browser at `https://cammanderwi11.github.io/family-plan/` (after push) or via a local server.

---

### Task 1: Translate "Save" to "Guardar"

**Files:**
- Modify: `registro.js:677`

- [ ] **Step 1: Fix the English string**

In `registro.js`, in the `renderSection()` function, change line 677:

```js
// OLD
html += '<button class="btn-primary reg-bottle-btn" id="reg-manual-save" style="width:100%;">Save</button>';

// NEW
html += '<button class="btn-primary reg-bottle-btn" id="reg-manual-save" style="width:100%;">Guardar</button>';
```

- [ ] **Step 2: Verify in browser**

Open the app, navigate to Registro de Luca, scroll to "Registro manual". Button should say "Guardar".

- [ ] **Step 3: Commit**

```bash
git add registro.js
git commit -m "fix: translate Save button to Guardar in registro manual"
```

---

### Task 2: Allow delete on any day

**Files:**
- Modify: `registro.js:560`

- [ ] **Step 1: Remove the todayFlag guard on delete buttons**

In `renderLog()`, the delete button is conditionally rendered with `todayFlag`. Change it to always render:

```js
// OLD (line ~560)
(todayFlag ? '<button class="reg-del" data-id="' + entry.id + '" title="Borrar">×</button>' : '') +

// NEW
'<button class="reg-del" data-id="' + entry.id + '" title="Borrar">×</button>' +
```

- [ ] **Step 2: Verify in browser**

Navigate to a previous day using the ← arrow. Each entry should now show the × delete button.

- [ ] **Step 3: Commit**

```bash
git add registro.js
git commit -m "fix: allow deleting feeding entries on any day, not just today"
```

---

### Task 3: Fix "Media entre tomas" to use end-of-feed time

**Files:**
- Modify: `registro.js:463-469`

- [ ] **Step 1: Change interval calculation to use end-of-feed time**

In `renderStats()`, the interval calculation uses `startedAt`. Change it to use end time (start + duration):

```js
// OLD (lines ~463-469)
var intervals = [];
for (var i = 1; i < breast.length; i++) {
  intervals.push((new Date(breast[i].startedAt) - new Date(breast[i-1].startedAt)) / 1000);
}

// NEW
var intervals = [];
for (var i = 1; i < breast.length; i++) {
  var prevEnd = new Date(breast[i-1].startedAt).getTime() + (breast[i-1].durationSeconds || 0) * 1000;
  intervals.push((new Date(breast[i].startedAt).getTime() - prevEnd) / 1000);
}
```

Note: `breast` is sorted ascending by `startedAt` (line 450), so `breast[i-1]` is the earlier feed. The interval is now "time between end of previous feed and start of next feed", matching the hero card's elapsed logic.

- [ ] **Step 2: Verify in browser**

Check the stats row. "Media entre tomas" should now show slightly shorter intervals than before (since it measures gap, not start-to-start).

- [ ] **Step 3: Commit**

```bash
git add registro.js
git commit -m "fix: compute avg interval between feeds using end-of-feed time for consistency with hero"
```

---

### Task 4: Change "Izq / Der (total)" to last 7 days

**Files:**
- Modify: `registro.js:456-458` and `registro.js:493`

- [ ] **Step 1: Filter allLog to last 7 days for the L/R stat**

In `renderStats()`, replace the all-time percentage with a 7-day window:

```js
// OLD (lines ~456-458)
var allPct = breastPct(allLog);
var allPctHtml = allPct ? allPct.left + '% / ' + allPct.right + '%' : '—';

// NEW
var sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
var recentLog = allLog.filter(function(e) {
  return new Date(e.startedAt) >= sevenDaysAgo;
});
var recentPct = breastPct(recentLog);
var recentPctHtml = recentPct ? recentPct.left + '% / ' + recentPct.right + '%' : '—';
```

- [ ] **Step 2: Update the label**

```js
// OLD (line ~493)
'<div class="reg-stat"><span class="reg-stat-val">' + allPctHtml + '</span><span class="reg-stat-lbl">Izq / Der (total)</span></div>' +

// NEW
'<div class="reg-stat"><span class="reg-stat-val">' + recentPctHtml + '</span><span class="reg-stat-lbl">Izq / Der (7d)</span></div>' +
```

- [ ] **Step 3: Verify in browser**

Stats row should show "Izq / Der (7d)" with percentages based on last 7 days only.

- [ ] **Step 4: Commit**

```bash
git add registro.js
git commit -m "fix: show L/R breast percentage for last 7 days instead of all-time"
```

---

### Task 5: Prune stale reminder checks on load

**Files:**
- Modify: `registro.js` — add a `pruneOldChecks()` function and call it from `renderSection()`

- [ ] **Step 1: Add pruneOldChecks function**

Add this function right after `todayKey()` (around line 791):

```js
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
```

- [ ] **Step 2: Call it from renderSection()**

In `renderSection()`, add a call right before `restoreActiveTimers()` (around line 757):

```js
pruneOldChecks();
restoreActiveTimers();
```

- [ ] **Step 3: Verify**

Open browser dev tools → Application → Local Storage → look for `fp-reg-fixed-checks`. After reload, any keys with dates older than 7 days should be gone.

- [ ] **Step 4: Commit**

```bash
git add registro.js
git commit -m "fix: prune reminder check keys older than 7 days on load"
```

---

### Task 6: Add date picker to manual entry

**Files:**
- Modify: `registro.js` — `renderSection()` (HTML scaffold) + `saveBottle()` + `saveManualBreast()`

- [ ] **Step 1: Add date input to the manual entry form**

In `renderSection()`, right after the `<h3>` for "Registro manual" (line ~652), add a date picker row before the type selector:

```js
// Find this line:
html += '<div style="display:flex;flex-direction:column;gap:8px;">';

// Insert after it:
html += '<input type="date" id="reg-manual-date" class="reg-bottle-input" value="' + new Date().toISOString().slice(0, 10) + '">';
```

- [ ] **Step 2: Use the date in saveBottle()**

In `saveBottle()` (around line 339), change the `startedAt` to use the selected date:

```js
// OLD
var entry = {
  id: Date.now() + '_bottle',
  type: 'bottle',
  side: null,
  startedAt: new Date().toISOString(),
  durationSeconds: 0,
  ml: ml
};

// NEW
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
```

- [ ] **Step 3: Use the date in saveManualBreast()**

In `saveManualBreast()` (around line 322-326), use the manual date instead of today:

```js
// OLD
var parts = timeInput.value.split(':');
var d = new Date();
d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);

// NEW
var dateInput = document.getElementById('reg-manual-date');
var parts = timeInput.value.split(':');
var d = dateInput && dateInput.value ? new Date(dateInput.value) : new Date();
d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
```

- [ ] **Step 4: Verify in browser**

Open Registro manual section. A date picker should appear above the type selector, defaulting to today. Change it to yesterday, enter a bottle amount, tap Guardar. Navigate to yesterday's log — the entry should appear there.

- [ ] **Step 5: Commit**

```bash
git add registro.js
git commit -m "feat: add date picker to manual entry for backfilling past feeds"
```

---

### Task 7: Reorder sections in renderSection()

**Files:**
- Modify: `registro.js:624-760` — the entire `renderSection()` function

- [ ] **Step 1: Rewrite the HTML scaffold in renderSection()**

Replace the section order inside `renderSection()`. The new order is:

1. Hero (última toma)
2. Pecho timers
3. Sacaleche (collapsible)
4. Daily log + summary footer + stats
5. Reminders
6. Manual entry

The full replacement for the HTML building portion of `renderSection()` (lines ~628-708):

```js
var html = '';

// 1. Hero — última toma (most glanced info, top of page)
html += '<div class="glass reg-hero" id="reg-hero"></div>';

// 2. Pecho buttons
html += '<div class="glass data-card">';
html += '<h3 class="reg-sec-title">🤱 Pecho</h3>';
html += '<div class="reg-timer-row">';
html += '<button class="timer-btn" id="reg-btn-breast_left"></button>';
html += '<button class="timer-btn" id="reg-btn-breast_right"></button>';
html += '</div>';
html += '<div class="reg-pecho-pct" id="reg-pecho-pct"></div>';
html += '</div>';

// 3. Sacaleche (collapsible)
html += '<div class="glass data-card reg-collapsible" id="reg-sacaleche-card">';
html += '<div class="reg-collapsible-header" id="reg-sacaleche-toggle">';
html += '<h3 class="reg-sec-title" style="margin-bottom:0;">🍼 Sacaleche</h3>';
html += '<span class="reg-collapsible-chevron" id="reg-sacaleche-chevron">▸</span>';
html += '</div>';
html += '<div class="reg-collapsible-body" id="reg-sacaleche-body">';
html += '<div class="reg-timer-row">';
html += '<button class="timer-btn" id="reg-btn-pump_left"></button>';
html += '<button class="timer-btn" id="reg-btn-pump_right"></button>';
html += '</div>';
html += '</div>';
html += '</div>';

// 4. Daily log + summary footer + stats
html += '<div class="glass data-card"><div id="registro-log"></div>';
html += '<div class="reg-summary" id="registro-summary"></div>';
html += '</div>';
html += '<div class="glass data-card reg-stats-card"><div class="reg-stats-row" id="reg-stats"></div></div>';

// 5. Reminders
html += '<div class="glass data-card">';
html += '<div class="reg-remind-header"><h3 class="reg-sec-title">📋 Recordatorios</h3><button class="reg-remind-edit-btn" id="reg-remind-edit">✏️</button></div>';
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
html += '<button class="btn-primary" id="reg-reminder-add-btn" style="white-space:nowrap;">Añadir</button>';
html += '</div>';
html += '</div>';

// 6. Manual entry (rare action, bottom)
html += '<div class="glass data-card">';
html += '<h3 class="reg-sec-title">✍ Registro manual</h3>';
html += '<div style="display:flex;flex-direction:column;gap:8px;">';
html += '<input type="date" id="reg-manual-date" class="reg-bottle-input" value="' + new Date().toISOString().slice(0, 10) + '">';
html += '<div class="reg-bottle-row" style="flex-wrap:wrap;gap:6px;">';
html += '<select id="reg-manual-type" class="reg-bottle-input" style="flex:0 0 auto;min-width:110px;padding-right:14px;">';
html += '<option value="bottle">🍼 Biberón</option>';
html += '<option value="breast">🤱 Pecho</option>';
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
```

- [ ] **Step 2: Add sacaleche collapsible toggle logic**

After `section.innerHTML = html;` and before the timer button event listeners, add:

```js
// Sacaleche collapsible
var sacaBody = document.getElementById('reg-sacaleche-body');
var sacaToggle = document.getElementById('reg-sacaleche-toggle');
var sacaChevron = document.getElementById('reg-sacaleche-chevron');
var sacaOpen = localStorage.getItem('fp-reg-sacaleche-open') === '1';

function setSacaState(open) {
  sacaOpen = open;
  sacaBody.style.display = open ? 'block' : 'none';
  sacaChevron.textContent = open ? '▾' : '▸';
  localStorage.setItem('fp-reg-sacaleche-open', open ? '1' : '0');
}
setSacaState(sacaOpen);

sacaToggle.addEventListener('click', function() {
  setSacaState(!sacaOpen);
});
```

- [ ] **Step 3: Verify in browser**

Reload the app. Section order should be: Hero → Pecho → Sacaleche (collapsed) → Log/Stats → Reminders → Manual entry. Tapping Sacaleche header should expand/collapse it. Summary strip should appear at the bottom of the log card.

- [ ] **Step 4: Commit**

```bash
git add registro.js
git commit -m "feat: reorder registro sections — hero first, sacaleche collapsible, manual entry last"
```

---

### Task 8: Add collapsible CSS styles

**Files:**
- Modify: `styles.css` — add styles after the existing Registro section (after line ~1822)

- [ ] **Step 1: Add collapsible styles**

Add these styles at the end of the Registro de Luca CSS section (before the "Resumen banners" comment at line 1824):

```css
/* Collapsible sections */
.reg-collapsible-header {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; padding: 2px 0;
  -webkit-tap-highlight-color: transparent;
}
.reg-collapsible-chevron {
  font-size: 14px; color: var(--text-muted);
  transition: transform 0.2s;
}
.reg-collapsible-body {
  margin-top: 10px;
}
```

- [ ] **Step 2: Adjust summary strip to work as log footer**

The summary strip (`.reg-summary`) is now inside the log card instead of standalone. Remove its bottom margin and add a top border to visually separate it from the log entries:

```css
/* Update existing .reg-summary */
.reg-summary {
  display: flex; flex-wrap: wrap; gap: 0;
  padding: 0; margin-top: 12px; margin-bottom: 0; overflow: hidden;
  border-top: 1px solid var(--border);
}
```

- [ ] **Step 3: Verify in browser**

Collapsible should animate smoothly. Summary should sit at the bottom of the log card with a divider line above it.

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "style: add collapsible sacaleche styles, summary as log footer"
```

---

### Task 9: Sync reminders via Supabase

**Files:**
- Modify: `registro.js` — update reminder functions

- [ ] **Step 1: Create Supabase tables**

In the Supabase dashboard, create two tables:

**`shared_luca_reminders`:**
| Column | Type | Notes |
|--------|------|-------|
| id | int8 | primary key, auto-generated |
| reminder_id | text | unique, not null |
| cat | text | not null |
| text | text | not null |
| freq | text | not null, default 'daily' |
| time | text | nullable |
| day_of_week | int4 | nullable |
| created_by | uuid | nullable |
| builtin | boolean | default false |

**`shared_luca_checks`:**
| Column | Type | Notes |
|--------|------|-------|
| id | int8 | primary key, auto-generated |
| check_key | text | unique, not null (format: "YYYY-MM-DD_reminderID") |
| checked_by | uuid | nullable |

Enable RLS on both tables. Add policies allowing authenticated users full access (same pattern as `shared_luca_log`).

- [ ] **Step 2: Add push/pull functions for reminders**

Add these functions after `saveReminders()` (around line 784):

```js
function pushReminders(list) {
  if (!window.sb || !window.__authReady) return;
  window.sb.auth.getSession().then(function(res) {
    var session = res.data && res.data.session;
    if (!session) return;
    // Delete all, re-insert (simple for small list)
    window.sb.from('shared_luca_reminders').delete().neq('id', 0).then(function() {
      var rows = list.map(function(r) {
        return {
          reminder_id: r.id,
          cat: r.cat,
          text: r.text,
          freq: r.freq,
          time: r.time || null,
          day_of_week: r.dayOfWeek != null ? r.dayOfWeek : null,
          created_by: session.user.id,
          builtin: !!r.builtin
        };
      });
      if (rows.length) window.sb.from('shared_luca_reminders').insert(rows).then(function() {});
    });
  });
}

function pullReminders() {
  if (!window.sb || !window.__authReady) return;
  window.sb.from('shared_luca_reminders').select('*').order('id').then(function(res) {
    if (res.data && Array.isArray(res.data) && res.data.length) {
      var list = res.data.map(function(row) {
        return {
          id: row.reminder_id,
          cat: row.cat,
          text: row.text,
          freq: row.freq,
          time: row.time,
          dayOfWeek: row.day_of_week,
          builtin: row.builtin
        };
      });
      saveReminders(list);
      renderReminders();
    }
  });
}
```

- [ ] **Step 3: Add push/pull functions for checks**

```js
function pushCheck(key, checked) {
  if (!window.sb || !window.__authReady) return;
  window.sb.auth.getSession().then(function(res) {
    var session = res.data && res.data.session;
    if (!session) return;
    if (checked) {
      window.sb.from('shared_luca_checks').upsert({
        check_key: key,
        checked_by: session.user.id
      }, { onConflict: 'check_key' }).then(function() {});
    } else {
      window.sb.from('shared_luca_checks').delete().eq('check_key', key).then(function() {});
    }
  });
}

function pullChecks() {
  if (!window.sb || !window.__authReady) return;
  var today = todayKey();
  window.sb.from('shared_luca_checks').select('*').like('check_key', today + '%').then(function(res) {
    if (res.data && Array.isArray(res.data)) {
      var checks = {};
      res.data.forEach(function(row) { checks[row.check_key] = true; });
      saveChecks(checks);
      renderReminders();
    }
  });
}
```

- [ ] **Step 4: Wire up sync calls**

In `addCustomReminder()`, after `saveReminders(list)`, add:
```js
pushReminders(list);
```

In the delete reminder handler inside `renderReminders()`, after `saveReminders(list)`, add:
```js
pushReminders(list);
```

In `renderReminders()`, in the checkbox change handler, after `saveChecks(c)`, add:
```js
pushCheck(cb.dataset.remindKey, cb.checked);
```

In the `auth-ready` event listener (line ~867), add pulls:
```js
window.addEventListener('auth-ready', function() {
  pullSharedLog();
  pullReminders();
  pullChecks();
});
```

(Replace the existing single `pullSharedLog` listener.)

- [ ] **Step 5: Verify in browser**

Log in on the app. Check a reminder. Open dev tools → Network — should see a Supabase request to `shared_luca_checks`. Open the app on another device/browser — the check should sync.

- [ ] **Step 6: Commit**

```bash
git add registro.js
git commit -m "feat: sync reminders and daily checks via Supabase"
```

---

### Task 10: Bump service worker VERSION

**Files:**
- Modify: `service-worker.js:1`

- [ ] **Step 1: Bump VERSION**

```js
// OLD
const VERSION = 'v61-family-plan';

// NEW
const VERSION = 'v62-family-plan';
```

- [ ] **Step 2: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump service worker to v62 for registro cleanup"
```

---

### Task 11: Final verification and push

- [ ] **Step 1: Full manual test**

Open the app and verify:
1. Hero card appears at top of Registro
2. Pecho timers work (start, stop, log appears)
3. Sacaleche is collapsed by default, expands on tap
4. Log shows entries with delete buttons on all days
5. Stats show "Izq / Der (7d)" 
6. Summary strip is at the bottom of the log card
7. Reminders section works (check, add, delete, edit mode)
8. Manual entry has date picker, "Guardar" button, supports past dates
9. No console errors

- [ ] **Step 2: Push**

```bash
git push origin main
```
