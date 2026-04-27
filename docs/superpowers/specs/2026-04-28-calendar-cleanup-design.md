# Calendar Tab — Targeted Cleanup

**Date:** 2026-04-28
**Approach:** B (targeted fixes + section reorder)
**Scope:** `calendar.js`, `index.html`, `styles.css`, `service-worker.js`

## 1. Section Reorder

New tab layout order:
1. Leave countdown card (standalone, moved to top)
2. Calendar grid
3. Leave blocks table (dynamic, already exists)
4. Vacation table (dynamic, replaces hardcoded HTML)
5. Action queue
6. Tramites aggregate

Notes section removed entirely (stale planning artifacts).

## 2. Leave Countdown as Standalone Card

Move the countdown out of the calendar render flow into a dedicated card at the top. HTML structure in `index.html` with IDs `cd-status`, `cd-used`, `cd-remaining`, `cd-days-off`, `cd-progress`, `cd-progress-label`. `updateLeaveCountdown()` continues to target these IDs — no JS change needed for the countdown logic itself.

## 3. Dynamic Vacation Table

Add `renderVacationBlocks(cfg)` function in `calendar.js`. Reads `cfg.annualLeave`, generates table with columns: Bloque, Periodo, Estado. Status: compare dates to today (Completado / En curso / Pendiente). Called from `renderCalendar()` alongside `renderLeaveBlocks()`.

Remove hardcoded "Vacaciones anuales" HTML from `index.html`, replace with `<div id="vacation-blocks-table"></div>`.

## 4. Remove Hardcoded Notes

Delete the entire Notes div (`#dashboard-notes`) from `index.html`.

## 5. Derive Months from Config

Replace hardcoded `monthsToShow` array in `renderCalendar()` with computation from `cfg.birthDate` (or `cfg.mandatory.start`), spanning 13 months forward. Store result so the ICS patch function can reuse it (attach to container as data or use a module-level variable).

## 6. Performance: Hoist todayCmp

Move `var todayCmp = new Date(); todayCmp.setHours(0,0,0,0);` before the month loop (currently created per day cell).

## 7. Remove Dead Code

Delete unused `var calNames = ['Mum', 'Daddey', 'Family Matters'];`.

## 8. Auto-scroll to Today

After `renderCalendar()` completes, scroll today's cell into view:
```js
var todayCell = document.querySelector('.cal-day.today');
if (todayCell) todayCell.scrollIntoView({ block: 'center', behavior: 'instant' });
```

## Files Changed

- `calendar.js` — items 3, 5, 6, 7, 8
- `index.html` — items 1, 2, 4 (reorder, standalone countdown, remove hardcoded vacation + notes)
- `service-worker.js` — bump VERSION
