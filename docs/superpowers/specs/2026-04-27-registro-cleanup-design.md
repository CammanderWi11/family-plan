# Registro de Luca — Targeted Cleanup

**Date:** 2026-04-27
**Approach:** A (targeted fixes, no structural refactor)
**Scope:** `registro.js`, `index.html` (section scaffold), `styles.css`

## 1. Section Reorder

Change the render order inside `renderSection()` from:

```
Pecho timers -> Sacaleche timers -> Manual entry -> Hero -> Reminders -> Log -> Summary -> Stats
```

To:

```
Hero (ultima toma) -> Pecho timers -> Sacaleche (collapsible) -> Log + Stats -> Reminders -> Manual entry
```

Summary strip moves to sit directly below the log as a footer within the same card.

## 2. Sacaleche Collapsible

Wrap the Sacaleche card in a collapsible container:
- Header row with title + chevron, tappable to expand/collapse
- Closed by default
- State stored in localStorage (`fp-reg-sacaleche-open`)
- CSS transition for smooth open/close

## 3. Bug Fixes

### 3a. Reminder Sync via Supabase
Add two Supabase tables:
- `shared_luca_reminders` — custom reminders (id, text, cat, freq, time, day_of_week, created_by)
- `shared_luca_checks` — daily check-offs (reminder_id, date_key, checked_by)

On load: pull reminders + today's checks from Supabase. On change: push to Supabase. Fall back to localStorage when offline/unauthenticated.

### 3b. Manual Entry Date Picker
Add `<input type="date">` to the manual entry form, defaulting to today. Use this date (instead of `new Date()`) when building `startedAt` for both bottle and manual breast entries.

### 3c. Prune Stale Reminder Checks
On load, remove keys from `fp-reg-fixed-checks` where the date portion is older than 7 days.

### 3d. Translate "Save" to "Guardar"
Line 677 in `registro.js`: change `Save` to `Guardar`.

### 3e. Consistent Elapsed Calculation
In `renderStats()`, change "Media entre tomas" to compute intervals using end-of-feed time (`startedAt + durationSeconds`) instead of `startedAt`, matching the hero card behavior.

### 3f. Delete on Any Day
Remove the `todayFlag` condition that gates the delete button in `renderLog()`. Show the delete button for all days.

## 4. Stats "Izq/Der" Window

Change the all-time L/R percentage stat to cover the last 7 days only. Update label from "Izq / Der (total)" to "Izq / Der (7d)".

## 5. Files Changed

- `registro.js` — all logic changes
- `styles.css` — collapsible sacaleche styles, summary-as-log-footer
- `service-worker.js` — bump VERSION (per project convention)
- Supabase — two new tables (manual migration or created via dashboard)
