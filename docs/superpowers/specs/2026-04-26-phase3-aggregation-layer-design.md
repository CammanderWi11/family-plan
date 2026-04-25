# Phase 3: Aggregation Layer — Upcoming, Watchlist, Search, Structured Follow-ups

**Date:** 2026-04-26
**Phase:** 3 of 3

## Overview

Add the aggregation layer to Mission Control: a global search bar, a smart watchlist strip replacing the urgent banner, an upcoming 7/30 days panel, and structured follow-up fields on medical appointments.

## 1. Structured follow-up fields on medical appointments

Upgrade the existing follow-up textarea in `salud.js` detail panels by adding two fields below it:
- **Owner dropdown:** Dad / Mum / Alfred / Sin asignar (default: null)
- **Due date picker:** date input (default: null)

The free text `followUpNotes` textarea remains unchanged.

### Data model additions

Each medical item in `state.meta.medical[person][]` gains two new fields:

```json
{
  "followUpOwner": null,
  "followUpDue": null
}
```

- `followUpOwner`: `null | 'dad' | 'mum' | 'alfred'`
- `followUpDue`: `null | '2026-06-15'` (ISO date string)

Existing items without these fields are treated as null (no migration needed).

### Watchlist integration

The watchlist surfaces any medical item where:
- `followUpDue` is set AND `done` is false AND the date is within 7 days or past

## 2. Watchlist strip (replaces urgent banner)

Replaces the existing `#urgent-banner` div on Mission Control. Scans all data sources every time the tab renders and shows a compact list of items needing attention.

### Data sources scanned

1. **Overdue trámites** — deadline passed, checkbox not checked. Uses `window.TRAMITE_DEADLINES` proxy to compute deadlines.
2. **Expired documents** — from `state.meta.trackedDocs` where `expiryDate` is past.
3. **Overdue medical follow-ups** — from `state.meta.medical` where `followUpDue` is past and `done` is false.
4. **Documents expiring <30 days** — from `state.meta.trackedDocs`.
5. **Trámites due within 7 days** — replaces old urgent banner logic.
6. **Medical appointments in next 7 days** — from `state.meta.medical` where `date` is set, within 7 days, and `done` is false.

### Priority ordering

Items sorted by urgency:
1. Overdue (past due, red)
2. Expired docs (red)
3. Overdue follow-ups (red)
4. Expiring soon (amber)
5. Due this week (amber)
6. Upcoming medical (blue)

### UI

Compact list inside a card with red/amber left border (like the old urgent banner). Each row:
- Status dot (red/amber/blue)
- Icon (📋/📁/🩺)
- Short label (e.g., "Inscripción Registro Civil — 2d vencido")
- Tap: navigates to relevant tab

If nothing needs attention: the entire strip is hidden (display:none).

### Replaces

Remove the old `#urgent-banner` div and its JS logic in `tramites.js`. The watchlist renders in its place.

## 3. Upcoming 7/30 days panel

A new card on Mission Control, positioned after the estado (leave countdown) card.

### Toggle

Two buttons at the top of the card: "7 días" (default active) and "30 días". Clicking switches the time window. State is not persisted (resets to 7 on tab switch).

### Data sources

1. **Trámites with deadlines** in the window — uses `window.TRAMITE_DEADLINES` proxy.
2. **Medical appointments** with `date` set in the window and `done` is false — from `state.meta.medical`.
3. **Document expiries** in the window — from `state.meta.trackedDocs`.
4. **Travel dates** from calendar config `trips` array.
5. **Leave block start/end dates** from calendar config `mandatory` + `flexibleBlocks`.

### UI

Items grouped by day, sorted chronologically. Each item:
- Date label (e.g., "Lun 28 abr")
- Icon + label (e.g., "🩺 Vacunas 2 meses — Luca")
- Items without a specific date are excluded (only scheduled items show)

If no items in the window: show "Nada programado" muted text.

## 4. Global search

A search input at the very top of Mission Control, above the resumen banners.

### Search scope

Searches across (case-insensitive substring match):
- Trámite `name` and `meta` fields from `window.TRAMITES`
- Document tracker `label` and `notes` from `state.meta.trackedDocs`
- Medical appointment `name`, `meta`, `prepNotes`, `followUpNotes` from `state.meta.medical`
- Travel `label` from calendar config `trips`

### UI

- Input with search icon and clear button, styled to match existing inputs.
- On typing (debounced 200ms), a dropdown appears below the input.
- Results grouped by type with icon prefix:
  - 📋 Trámites
  - 📁 Documentos
  - 🩺 Salud
  - 📅 Calendario
- Max 10 results shown.
- Each result: icon + label + muted meta snippet.
- Tap: navigates to the relevant tab. For trámites/medical, scrolls to the item if possible.
- Empty query: dropdown hidden.
- No matches: "Sin resultados" muted text in dropdown.

## 5. Mission Control layout order

1. **Search bar** (new)
2. Resumen banners (feeding/Leo — unchanged)
3. **Watchlist strip** (new, replaces urgent banner)
4. Estado card (leave countdown — unchanged)
5. **Upcoming 7/30 panel** (new)

## 6. Files affected

- Create: `mission-control.js` — search, watchlist, upcoming panel logic and rendering
- Modify: `salud.js` — add followUpOwner and followUpDue fields to detail panel
- Modify: `index.html` — replace urgent banner with watchlist host, add search bar, add upcoming host, add script tag
- Modify: `styles.css` — search bar, watchlist, upcoming panel styles
- Modify: `tramites.js` — remove old urgent banner JS logic
- Modify: `service-worker.js` — add mission-control.js to SHELL cache, bump version

## 7. Out of scope

- Push notifications for overdue items
- Calendar integration for medical appointments (adding to ICS)
- Filtering upcoming panel by person or type
