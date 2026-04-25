# Phase 2: Medical Section Overhaul

**Date:** 2026-04-26
**Phase:** 2 of 3

## Overview

Split medical tracking out of the Trámites tab into a dedicated "Salud" tab. Four family members (Luca, Leo, Mum, Daddey), each with well-visits, vaccines, and specialist appointments. Prep notes and follow-up notes per appointment.

## 1. What stays in Trámites

These one-time admin items remain as trámite checkboxes (salud-0 through salud-4):
- salud-0: Asignación de pediatra
- salud-1: Cribado metabólico (prueba del talón)
- salud-2: Cribado auditivo
- salud-3: Revisión postparto con matrona
- salud-4: Informe de maternidad (SCS)

## 2. What moves to the new Salud tab

Ongoing medical tracking (salud-5 through salud-10: well-visits and vaccines) moves out of Trámites and into the new dedicated tab. These entries are removed from `window.TRAMITES` and `window.GROUPS.salud.count` is reduced accordingly.

## 3. New "Salud" tab

A new nav item in the sidebar, between Trámites and Ajustes. Icon: 🩺

Four collapsible sections ordered: **Luca → Leo → Mum → Daddey** (kids first).

Each section has three categories:
- **Revisiones** — well-child visits or routine checkups
- **Vacunas** — vaccine schedule
- **Especialistas** — added manually by user

## 4. Data model

Stored in `state.meta.medical`, synced via Supabase `app_state.meta`:

```json
{
  "luca": [
    {
      "id": "med_1714060000000",
      "category": "revision | vaccine | specialist",
      "name": "Revisión del niño sano (1 mes)",
      "meta": "Pediatra asignado · Primera visita",
      "ageLabel": "1 mes",
      "date": "2026-05-17",
      "done": false,
      "prepNotes": "",
      "followUpNotes": ""
    }
  ],
  "leo": [...],
  "mum": [...],
  "daddey": [...]
}
```

- `category`: revision, vaccine, or specialist
- `ageLabel`: display label like "2 meses", "3 años", null for specialists
- `date`: ISO date, manually entered when appointment is scheduled. Null if not yet scheduled.
- `done`: boolean, marks appointment as completed
- `prepNotes`: free text, written before the visit
- `followUpNotes`: free text, written after the visit. (Phase 3 upgrades this to structured action items with owners and due dates.)

## 5. Pre-populated items

### Luca (born 2026-04-17)

**Revisiones (SCS Programa de Salud Infantil):**
- 1 mes — Revisión del niño sano
- 2 meses — Revisión del niño sano
- 4 meses — Revisión del niño sano
- 6 meses — Revisión del niño sano
- 9 meses — Revisión del niño sano
- 12 meses — Revisión del niño sano
- 15 meses — Revisión del niño sano

**Vacunas (Calendario vacunal de Canarias):**
- 2 meses — Hexavalente + Meningococo B + Neumococo + Rotavirus
- 4 meses — Hexavalente + Meningococo B + Neumococo + Rotavirus
- 11 meses — Hexavalente + Meningococo C
- 12 meses — Triple vírica + Meningococo B + Varicela + Neumococo
- 15 meses — Hepatitis A

### Leo (born 2023-10-26, age 2.5)

**Revisiones:**
- 3 años (oct 2026) — Revisión del niño sano
- 4 años (oct 2027) — Revisión del niño sano

**Vacunas (remaining SCS schedule):**
- 3 años — DTPa (si pendiente)
- 6 años — DTPa + Triple vírica (2ª dosis) + Varicela (2ª dosis)

### Mum (born 1984-02-09, age 42)

**Revisiones:**
- Revisión postparto 6 semanas — Ginecología
- Revisión ginecológica anual

**Vacunas:**
- Td — Tétanos-difteria (cada 10 años, verificar última dosis)

### Daddey (born 1982-05-24, age 44)

**Revisiones:**
- Reconocimiento médico empresa — Binter, anual
- Revisión general — Médico de familia

**Vacunas:**
- Td — Tétanos-difteria (cada 10 años, verificar última dosis)

## 6. Appointment card UI

Each appointment renders as a card with:
- Left: done checkbox
- Center: name (bold), meta (muted), age label badge
- Right: date (if scheduled) or "Sin cita" placeholder

Tap to expand:
- Date picker (to schedule/reschedule)
- Prep notes textarea (placeholder: "Preguntas, documentos a llevar...")
- Follow-up notes textarea (placeholder: "Resultado, próximos pasos...")
- Delete button (only for specialist entries, not pre-populated ones)

Completed appointments sort to the bottom of their category, muted.

## 7. Specialist entries

Each person section has a "+ Añadir especialista" button. Opens inline form:
- Name (text input)
- Meta/description (text input)
- Date (date picker)
- Saves immediately

## 8. Supabase accessors

Add to `tramites.js` (alongside existing state.meta accessors):
```javascript
window.__getMedical = function() {
  return (state.meta && state.meta.medical) || null;
};
window.__updateMedical = function(data) {
  state.meta = state.meta || {};
  state.meta.medical = data;
  queueSave();
};
```

## 9. Files affected

- Create: `salud.js` — new tab logic, rendering, event handling
- Modify: `index.html` — add Salud nav item, add salud tab section with host div, add script tag
- Modify: `nav.js` — add 'salud' to pageTitles
- Modify: `app.js` — remove salud-5 through salud-10 from TRAMITES, reduce GROUPS.salud.count from 11 to 5
- Modify: `tramites.js` — add __getMedical/__updateMedical accessors
- Modify: `styles.css` — salud card styles, category headers, expandable sections
- Modify: `service-worker.js` — add salud.js to SHELL cache, bump version

## 10. Out of scope

- Structured follow-up actions with owners/due dates (Phase 3)
- Surfacing upcoming appointments on Mission Control (Phase 3)
- Vaccine reminders/notifications (Phase 3 watchlist)
