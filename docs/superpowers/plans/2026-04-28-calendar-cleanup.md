# Calendar Tab — Targeted Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the Calendar tab — fix bugs, remove stale content, make static HTML dynamic, improve UX.

**Architecture:** Changes to the existing `calendar.js` IIFE, `index.html` calendar section, and `service-worker.js`. No new files.

**Tech Stack:** Vanilla JS, CSS, static HTML

---

### Task 1: Remove hardcoded Notes section and Vacation table from HTML

**Files:**
- Modify: `index.html:226-283`

- [ ] **Step 1: Remove the hardcoded vacation summary**

In `index.html`, replace lines 226-249 (the entire "Vacation Summary" div) with a dynamic container:

```html
    <!-- Vacation Summary (dynamically rendered) -->
    <div class="glass data-card" id="dashboard-vacation-blocks">
      <h2>Vacaciones anuales</h2>
      <div id="vacation-blocks-table"></div>
    </div>
```

- [ ] **Step 2: Remove the hardcoded Notes section**

Delete lines 270-283 (the entire `#dashboard-notes` div including the closing `</div>`).

- [ ] **Step 3: Verify**

Open the app. Calendar tab should show the empty "Vacaciones anuales" card (content comes in Task 2). Notes section should be gone.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: remove hardcoded vacation table and stale notes from calendar"
```

---

### Task 2: Add dynamic renderVacationBlocks function

**Files:**
- Modify: `calendar.js` — add `renderVacationBlocks(cfg)` and call it from `renderCalendar()`

- [ ] **Step 1: Add the renderVacationBlocks function**

Add this function right after `renderLeaveBlocks()` (after line ~229):

```js
function renderVacationBlocks(cfg) {
  var host = document.getElementById('vacation-blocks-table');
  if (!host) return;
  var today = new Date(); today.setHours(0,0,0,0);
  var blocks = (cfg.annualLeave || []).map(function(a) {
    if (!a.start || !a.end) return null;
    var s = parseDate(a.start), e = parseDate(a.end);
    var done = today > e;
    var active = today >= s && today <= e;
    return { label: a.label || 'Vacaciones', start: s, end: e, done: done, active: active };
  }).filter(Boolean);

  if (!blocks.length) { host.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Sin vacaciones configuradas</p>'; return; }

  var html = '<table class="data-table">';
  html += '<thead><tr><th>Bloque</th><th>Periodo</th><th>Estado</th></tr></thead>';
  html += '<tbody>';
  blocks.forEach(function(b) {
    var statusCls = b.done ? 'exp-green' : (b.active ? 'exp-amber' : '');
    var statusLabel = b.done ? 'Completado' : (b.active ? 'En curso' : 'Pendiente');
    var rowCls = b.done ? ' class="muted-row"' : (b.active ? ' class="active-row"' : '');
    html += '<tr' + rowCls + '>';
    html += '<td data-label="Bloque"><span class="status-dot" style="background:#4ade80"></span>' + b.label + '</td>';
    html += '<td data-label="Periodo">' + fmtBlockDate(b.start) + ' \u2013 ' + fmtBlockDate(b.end) + '</td>';
    html += '<td data-label="Estado"><span class="' + statusCls + '">' + statusLabel + '</span></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  host.innerHTML = html;
}
```

- [ ] **Step 2: Call it from renderCalendar**

In `renderCalendar()`, right after the existing `renderLeaveBlocks(cfg);` call (line ~165), add:

```js
renderVacationBlocks(cfg);
```

- [ ] **Step 3: Verify**

Open the app. "Vacaciones anuales" should now show 3 rows (Semana Santa, Otoño, Diciembre) with dynamic status based on today's date.

- [ ] **Step 4: Commit**

```bash
git add calendar.js
git commit -m "feat: render vacation table dynamically from config"
```

---

### Task 3: Derive monthsToShow from config

**Files:**
- Modify: `calendar.js:107-109` and `calendar.js:590-593`

- [ ] **Step 1: Replace hardcoded monthsToShow in renderCalendar**

In `renderCalendar()`, replace lines 107-109:

```js
// OLD
const monthsToShow = [
  [2026,3],[2026,4],[2026,5],[2026,6],[2026,7],[2026,8],
  [2026,9],[2026,10],[2026,11],[2027,0],[2027,1],[2027,2],[2027,3]
];

// NEW
var startYear = h.birthDate.getFullYear(), startMonth = h.birthDate.getMonth();
var monthsToShow = [];
for (var i = 0; i < 13; i++) {
  var m = (startMonth + i) % 12;
  var y = startYear + Math.floor((startMonth + i) / 12);
  monthsToShow.push([y, m]);
}
```

- [ ] **Step 2: Store monthsToShow for ICS patch reuse**

Right after computing `monthsToShow`, store it on the container so the ICS patch can read it:

```js
container.__monthsToShow = monthsToShow;
```

- [ ] **Step 3: Update ICS patch to use stored monthsToShow**

In the ICS render patch (line ~590), replace the hardcoded array:

```js
// OLD
var monthsToShow = [
  [2026,3],[2026,4],[2026,5],[2026,6],[2026,7],[2026,8],
  [2026,9],[2026,10],[2026,11],[2027,0],[2027,1],[2027,2],[2027,3]
];

// NEW
var monthsToShow = container.__monthsToShow || [];
```

- [ ] **Step 4: Verify**

Calendar should still render Apr 2026 – Apr 2027 (same as before, since birthDate is 2026-04-17). But now it's config-driven.

- [ ] **Step 5: Commit**

```bash
git add calendar.js
git commit -m "fix: derive calendar months from config birthDate instead of hardcoding"
```

---

### Task 4: Hoist todayCmp, remove dead code, add auto-scroll

**Files:**
- Modify: `calendar.js`

- [ ] **Step 1: Hoist todayCmp before month loop**

In `renderCalendar()`, add this line right before the `for (const [year, month] of monthsToShow)` loop:

```js
var todayCmp = new Date(); todayCmp.setHours(0,0,0,0);
```

Then remove the same line from inside the day loop (line ~153):
```js
// DELETE this line inside the for (let d = 1...) loop:
const todayCmp = new Date(); todayCmp.setHours(0,0,0,0);
```

- [ ] **Step 2: Remove dead calNames**

Delete line 524:
```js
// DELETE
var calNames = ['Mum', 'Daddey', 'Family Matters'];
```

- [ ] **Step 3: Add auto-scroll to today**

At the end of `renderCalendar()`, right before the closing `}`, add:

```js
var todayCell = document.querySelector('.cal-day.today');
if (todayCell) todayCell.scrollIntoView({ block: 'center', behavior: 'instant' });
```

Note: this must go BEFORE the ICS patch overrides `renderCalendar`. So place it right before `renderLeaveBlocks(cfg);` — actually no, it should be after all rendering is done. Place it at the very end of the original `renderCalendar` function, after `renderVacationBlocks(cfg);`.

- [ ] **Step 4: Verify**

Open calendar tab. Should auto-scroll so today is roughly centered. No console errors. `calNames` reference should not appear in the file.

- [ ] **Step 5: Commit**

```bash
git add calendar.js
git commit -m "fix: hoist todayCmp, remove dead calNames, auto-scroll to today"
```

---

### Task 5: Bump service worker VERSION

**Files:**
- Modify: `service-worker.js:1`

- [ ] **Step 1: Bump VERSION**

```js
// OLD
const VERSION = 'v63-family-plan';
// NEW
const VERSION = 'v64-family-plan';
```

- [ ] **Step 2: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump service worker to v64 for calendar cleanup"
```

---

### Task 6: Final verification and push

- [ ] **Step 1: Full manual test**

Open the app and verify:
1. Calendar tab auto-scrolls to today
2. Month grid still renders correctly (Apr 2026 – Apr 2027)
3. Leave blocks table shows correct status
4. Vacation table is dynamic (shows Semana Santa, Otoño, Diciembre with correct status)
5. Notes section is gone
6. Action queue and Tramites aggregate still render
7. ICS event dots still appear (if configured)
8. No console errors

- [ ] **Step 2: Push**

```bash
git push origin main
```
