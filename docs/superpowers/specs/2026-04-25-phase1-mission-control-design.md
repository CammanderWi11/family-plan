# Phase 1: Mission Control — Rename, Ownership, Document Expiry Tracker

**Date:** 2026-04-25
**Phase:** 1 of 3

## 1. Rename

Replace "Panel De Control" with "Mission Control" in:
- `index.html` — sidebar nav label, header `<h1>`
- `nav.js` — `pageTitles.resumen`

## 2. Trámite Ownership

### What changes
- Replace the existing `scope` field (nacional/autonomica/municipal/privado/empresa) on trámites with an `owner` field.
- Valid owners: `dad`, `mum`, `alfred`
- Default owner assigned per trámite in `window.TRAMITES` config (in `app.js`).
- User can change owner via the trámite UI — saved in `state.tramites[key].owner` (Supabase synced, same mechanism as checkbox state).

### UI
- Owner badge on each trámite row, colored consistently:
  - Dad: blue (`--blue`)
  - Mum: pink (`--pink`)
  - Alfred: amber (`--amber`)
- Badge uses same styling as caregiver badges in rutina (`.caregiver-badge`).
- Filter dropdown at top of trámites tab: All / Dad / Mum / Alfred.
- Remove all existing scope-related UI (scope badges, scope filters, scope legend).

### Data migration
- Existing `scope` values in `window.TRAMITES` entries are replaced with `owner` values.
- Mapping (manual, in code):
  - empresa → dad (Binter stuff is Luis's responsibility)
  - nacional/autonomica/municipal → dad (default, can be reassigned)
  - privado → mum (hospital/health default, can be reassigned)
- Any saved `state.tramites[key].scope` data is ignored going forward.

## 3. Document Expiry Tracker

### What it replaces
The current "documents" section in trámites (upload-only library) becomes a document expiry tracker. The existing Supabase storage upload flow is preserved but wrapped in the new tracker UI.

### Data model
Stored in `state.meta.trackedDocs` (array), synced via Supabase `app_state.meta`:

```json
{
  "id": "doc_1714060000000",
  "type": "passport | dni | health_card | insurance | school | other",
  "label": "Pasaporte Leo",
  "person": "dad | mum | leo | luca",
  "expiryDate": "2028-06-15",
  "fileId": null,
  "notes": ""
}
```

- `type`: one of passport, dni, health_card, insurance, school, other
- `person`: one of dad, mum, leo, luca
- `fileId`: optional reference to a document in Supabase storage (existing `documents` table). When set, the photo/scan is viewable from the tracker.
- `expiryDate`: ISO date string, manually entered by user.

### UI location
Replaces the current document library section in the trámites tab. The existing library.js upload mechanics are preserved internally but the presentation changes.

### UI layout
A card titled "Documentos" grouped by person (Dad, Mum, Leo, Luca):

Each document row shows:
- Type icon (passport emoji, ID card emoji, etc.)
- Label (e.g., "Pasaporte Leo")
- Expiry date with status color:
  - Green: >6 months until expiry
  - Amber: 1–6 months until expiry
  - Red: <1 month until expiry
  - Flashing red border: expired
- Tap to expand: shows photo (if uploaded), notes field, edit expiry date, upload/replace photo button

### Add document flow
- "+" button at bottom of tracker
- Select person → select type → enter label → enter expiry date → optional: upload photo
- Saved immediately to `state.meta.trackedDocs` and synced

### Photo upload
- Uses existing Supabase storage bucket and upload flow from library.js
- Photo stored in `documents` table, `fileId` linked in tracker entry
- Viewable via signed URL (existing `signedUrlFor` function)

## Files affected

- `index.html` — rename nav/header, restructure trámites documents section HTML
- `nav.js` — rename page title
- `app.js` — rename in TRAMITES config, replace scope with owner defaults
- `tramites.js` — owner badges, owner filter, remove scope UI, document tracker UI and logic
- `library.js` — refactor to serve as upload engine for tracker (keep storage mechanics, remove standalone UI)
- `styles.css` — owner badge colors, expiry status colors, tracker card styles
- `service-worker.js` — version bump

## Out of scope (Phase 2 & 3)
- Medical section overhaul (Phase 2)
- Upcoming 7/30 panel, watchlist strip, global search (Phase 3)
- Expiry alerts surfacing on Mission Control (Phase 3 — watchlist)
