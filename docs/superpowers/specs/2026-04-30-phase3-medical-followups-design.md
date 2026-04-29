# Phase 3 — Medical Follow-up Watchlist

**Date:** 2026-04-30  
**Status:** Approved

## Overview

Add a `followUpDone` completion checkbox to medical follow-up items, and surface all open follow-ups in a dedicated watchlist — both inside the Salud tab and as a summary card in Mission Control. Completed follow-ups move to a collapsed "Completados" section rather than disappearing.

## Data Model

Each medical item gains one new field:

```js
followUpDone: false  // boolean, default false
```

Added to all DEFAULTS entries. On load, existing items missing this field are treated as `false` (backfill on read, no migration needed).

Owner stored values change from `dad/mum` to `papi/mami`. Stored keys update to:
- `papi` (was `dad`)
- `mami` (was `mum`)
- `alfred` (unchanged)

Sync: written via `__updateMedical(data)` → `state.meta.medical` → Supabase automatically.

## Salud Tab — Seguimientos Pendientes Section

A "Seguimientos pendientes" section renders at the top of the Salud tab when at least one item has `followUpDone: false` AND has any follow-up content (`followUpNotes`, `followUpOwner`, or `followUpDue` set).

**Each row shows:**
- 🩺 icon + appointment name + person emoji
- Owner badge (Papi / Mami / Alfred) if set
- Due date formatted as dd/mm/yy, or "sin fecha" if null; overdue dates rendered in red
- Checkbox to mark `followUpDone: true`

**Completados section:**  
A collapsed accordion below lists items where `followUpDone: true`, rendered crossed out. User can expand to review or uncheck to reopen.

**Hidden entirely** if no follow-up content exists on any item.

## Mission Control — Summary Card

The existing watchlist already surfaces follow-ups with a due date. This extends it to include **all open follow-ups** (even undated).

A "Seguimientos médicos" card appears in the Mission Control watchlist when there is at least one open follow-up:

- Header: "Seguimientos médicos" + count badge ("3 pendientes")
- Up to 3 preview rows, priority order: overdue (red) → soonest due → undated
- Each row: person emoji + appointment name + owner badge + due date or "sin fecha"
- Tapping a row navigates to that item in the Salud tab (existing `navigateTo('salud', key)` behavior)
- Card hidden when zero open follow-ups

## Files Changed

| File | Change |
|------|--------|
| `salud.js` | Add `followUpDone` to DEFAULTS; backfill on `getData()`; rename owner values `dad→papi`, `mum→mami`; add "Seguimientos pendientes" section UI; add done checkbox handler |
| `mission-control.js` | Extend follow-up alert logic to include undated items; add "Seguimientos médicos" summary card |

## Out of Scope

- Converting `followUpNotes` to a structured title field (keep as free text)
- Push notifications or reminders
- Per-follow-up priority levels
