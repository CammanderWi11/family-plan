# Phase 2: Medical Section Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split medical tracking into a dedicated "Salud" tab with per-family-member sections (Luca, Leo, Mum, Daddey), each containing well-visits, vaccines, and specialist appointments with prep/follow-up notes.

**Architecture:** New `salud.js` handles all rendering and events. Data lives in `state.meta.medical` via existing Supabase sync. Pre-populated defaults are defined in `salud.js` and seeded on first load when no saved data exists. One-time admin items (salud-0 through salud-4) stay in Trámites; recurring medical items (salud-5 through salud-10) are removed from Trámites.

**Tech Stack:** Vanilla JS, Supabase (existing sync via state.meta), existing CSS custom properties.

---

### Task 1: Add medical accessors to tramites.js and remove salud-5 through salud-10 from app.js

**Files:**
- Modify: `tramites.js` (add accessors near other state.meta accessors, around line 101-109)
- Modify: `app.js` (remove salud-5 through salud-10, reduce GROUPS.salud.count)

- [ ] **Step 1: Add medical accessors to tramites.js**

In `tramites.js`, after the `__updateTrackedDocs` accessor (around line 109), add:

```javascript
  // Medical appointments — synced across devices
  window.__getMedical = function() {
    return (state.meta && state.meta.medical) || null;
  };
  window.__updateMedical = function(data) {
    state.meta = state.meta || {};
    state.meta.medical = data;
    queueSave();
  };
```

- [ ] **Step 2: Remove salud-5 through salud-10 from app.js TRAMITES**

In `app.js`, delete these entries from `window.TRAMITES`:
- `'salud-5'` (Revisión del niño sano 1 mes, around line 118-120)
- `'salud-6'` (Vacunas 2 meses, around line 121-123)
- `'salud-7'` (Vacunas 4 meses, around line 124-126)
- `'salud-8'` (Vacunas 11 meses, around line 127-129)
- `'salud-9'` (Vacunas 12 meses, around line 130-132)
- `'salud-10'` (Vacuna 15 meses, around line 133-135)

- [ ] **Step 3: Reduce GROUPS.salud.count from 11 to 5**

In `app.js`, find `window.GROUPS` (around line 159). Change the `salud` entry:

```javascript
  salud:       { title: '🩺 Revisiones y vacunas', desc: 'Seguimiento sanitario entre Vithas (parto) y SCS (postparto La Laguna / LPGC).', renderMode: 'js', host: 'js-groups-host-salud', count: 5 },
```

- [ ] **Step 4: Commit**

```bash
git add tramites.js app.js
git commit -m "feat: add medical accessors, remove salud-5..10 from trámites"
```

---

### Task 2: Add Salud nav item and tab section to index.html

**Files:**
- Modify: `index.html` (sidebar nav, mobile tabs, new section, script tag)
- Modify: `nav.js` (add salud to pageTitles)

- [ ] **Step 1: Add Salud to sidebar nav**

In `index.html`, after the Trámites nav item (line 112, before `</div>` closing `sidebar-nav`), add:

```html
    <a href="#salud" class="nav-item" data-tab="salud">
      <span class="nav-icon">&#9879;</span>
      <span class="nav-label">Salud</span>
    </a>
```

- [ ] **Step 2: Add Salud to mobile tabs**

In `index.html`, after the tramites mobile tab (around line 151), add:

```html
    <a href="#salud" class="mobile-tab" data-tab="salud">
      <span class="tab-icon">&#9879;</span>
      <span>SALUD</span>
    </a>
```

- [ ] **Step 3: Add Salud tab section**

In `index.html`, between the tramites `</section>` (around line 500) and the ajustes section (around line 502), add:

```html
  <!-- ========== SALUD ========== -->
  <section id="salud" class="tab-section">
    <div class="section-title">Salud familiar</div>
    <div id="salud-host"></div>
  </section>
```

- [ ] **Step 4: Add script tag**

In `index.html`, after the `doc-tracker.js` script tag (near the bottom, before `</body>`), add:

```html
<script src="salud.js"></script>
```

- [ ] **Step 5: Add salud to pageTitles in nav.js**

In `nav.js`, add to the `pageTitles` object (around line 18):

```javascript
    salud: 'Salud',
```

- [ ] **Step 6: Commit**

```bash
git add index.html nav.js
git commit -m "feat: add Salud tab to nav, mobile tabs, and page structure"
```

---

### Task 3: Create salud.js with defaults, rendering, and events

**Files:**
- Create: `salud.js`

- [ ] **Step 1: Create salud.js**

Create the file `salud.js` with this complete implementation:

```javascript
// ========== SALUD — FAMILY MEDICAL TRACKER ==========
(function() {

  var PERSONS = [
    { key: 'luca', label: 'Luca', emoji: '👶', born: '2026-04-17' },
    { key: 'leo',  label: 'Leo',  emoji: '🧒', born: '2023-10-26' },
    { key: 'mum',  label: 'Mum',  emoji: '👩', born: '1984-02-09' },
    { key: 'daddey', label: 'Daddey', emoji: '👨', born: '1982-05-24' }
  ];

  var CAT_LABELS = { revision: 'Revisiones', vaccine: 'Vacunas', specialist: 'Especialistas' };
  var CAT_ORDER = ['revision', 'vaccine', 'specialist'];

  // ---- Default pre-populated items ----
  var DEFAULTS = {
    luca: [
      // Revisiones
      { id: 'luca_rev_1m',  category: 'revision', name: 'Revisión del niño sano (1 mes)', meta: 'Pediatra asignado · Primera visita del Programa de Salud Infantil', ageLabel: '1 mes', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_2m',  category: 'revision', name: 'Revisión del niño sano (2 meses)', meta: 'Pediatra asignado', ageLabel: '2 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_4m',  category: 'revision', name: 'Revisión del niño sano (4 meses)', meta: 'Pediatra asignado', ageLabel: '4 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_6m',  category: 'revision', name: 'Revisión del niño sano (6 meses)', meta: 'Pediatra asignado', ageLabel: '6 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_9m',  category: 'revision', name: 'Revisión del niño sano (9 meses)', meta: 'Pediatra asignado', ageLabel: '9 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_12m', category: 'revision', name: 'Revisión del niño sano (12 meses)', meta: 'Pediatra asignado', ageLabel: '12 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_rev_15m', category: 'revision', name: 'Revisión del niño sano (15 meses)', meta: 'Pediatra asignado', ageLabel: '15 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      // Vacunas
      { id: 'luca_vac_2m',  category: 'vaccine', name: 'Vacunas 2 meses', meta: 'Hexavalente + Meningococo B + Neumococo + Rotavirus', ageLabel: '2 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_vac_4m',  category: 'vaccine', name: 'Vacunas 4 meses', meta: 'Hexavalente + Meningococo B + Neumococo + Rotavirus', ageLabel: '4 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_vac_11m', category: 'vaccine', name: 'Vacunas 11 meses', meta: 'Hexavalente + Meningococo C', ageLabel: '11 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_vac_12m', category: 'vaccine', name: 'Vacunas 12 meses', meta: 'Triple vírica + Meningococo B + Varicela + Neumococo', ageLabel: '12 meses', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'luca_vac_15m', category: 'vaccine', name: 'Vacuna 15 meses', meta: 'Hepatitis A', ageLabel: '15 meses', date: null, done: false, prepNotes: '', followUpNotes: '' }
    ],
    leo: [
      { id: 'leo_rev_3a',  category: 'revision', name: 'Revisión del niño sano (3 años)', meta: 'Pediatra asignado · Oct 2026', ageLabel: '3 años', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'leo_rev_4a',  category: 'revision', name: 'Revisión del niño sano (4 años)', meta: 'Pediatra asignado · Oct 2027', ageLabel: '4 años', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'leo_vac_3a',  category: 'vaccine', name: 'DTPa (3 años)', meta: 'Si pendiente · Centro de salud asignado', ageLabel: '3 años', date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'leo_vac_6a',  category: 'vaccine', name: 'Vacunas 6 años', meta: 'DTPa + Triple vírica (2ª dosis) + Varicela (2ª dosis)', ageLabel: '6 años', date: null, done: false, prepNotes: '', followUpNotes: '' }
    ],
    mum: [
      { id: 'mum_rev_pp',  category: 'revision', name: 'Revisión postparto 6 semanas', meta: 'Ginecología', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'mum_rev_gyn', category: 'revision', name: 'Revisión ginecológica anual', meta: 'Ginecología', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'mum_vac_td',  category: 'vaccine', name: 'Td — Tétanos-difteria', meta: 'Cada 10 años · Verificar última dosis', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' }
    ],
    daddey: [
      { id: 'dad_rev_emp', category: 'revision', name: 'Reconocimiento médico empresa', meta: 'Binter · Anual', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'dad_rev_gen', category: 'revision', name: 'Revisión general', meta: 'Médico de familia', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' },
      { id: 'dad_vac_td',  category: 'vaccine', name: 'Td — Tétanos-difteria', meta: 'Cada 10 años · Verificar última dosis', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '' }
    ]
  };

  function getData() {
    var saved = window.__getMedical ? window.__getMedical() : null;
    if (saved && (saved.luca || saved.leo || saved.mum || saved.daddey)) return saved;
    // First load: seed with defaults
    var data = JSON.parse(JSON.stringify(DEFAULTS));
    saveData(data);
    return data;
  }

  function saveData(data) {
    if (window.__updateMedical) window.__updateMedical(data);
  }

  function fmtDate(d) {
    if (!d) return 'Sin cita';
    var p = d.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  // ---- Render ----
  function render() {
    var host = document.getElementById('salud-host');
    if (!host) return;
    var data = getData();
    var html = '';

    PERSONS.forEach(function(person) {
      var items = data[person.key] || [];
      html += '<div class="glass data-card salud-person-card">';
      html += '<h2 class="salud-person-title" data-person="' + person.key + '">';
      html += '<span class="salud-person-toggle" id="salud-toggle-' + person.key + '">▾</span> ';
      html += person.emoji + ' ' + person.label;
      html += '</h2>';
      html += '<div class="salud-person-body" id="salud-body-' + person.key + '">';

      CAT_ORDER.forEach(function(cat) {
        var catItems = items.filter(function(it) { return it.category === cat; });
        // Sort: not done first, then by date or id
        catItems.sort(function(a, b) {
          if (a.done !== b.done) return a.done ? 1 : -1;
          if (a.date && b.date) return a.date.localeCompare(b.date);
          return 0;
        });

        html += '<div class="salud-category">';
        html += '<div class="salud-cat-label">' + CAT_LABELS[cat] + '</div>';

        if (!catItems.length) {
          html += '<div class="salud-empty">—</div>';
        }

        catItems.forEach(function(item) {
          var doneClass = item.done ? ' salud-done' : '';
          html += '<div class="salud-item' + doneClass + '" data-id="' + item.id + '" data-person="' + person.key + '">';
          html += '<label class="salud-check"><input type="checkbox"' + (item.done ? ' checked' : '') + ' data-id="' + item.id + '" data-person="' + person.key + '"></label>';
          html += '<div class="salud-item-body">';
          html += '<div class="salud-item-name">' + item.name;
          if (item.ageLabel) html += ' <span class="salud-age-badge">' + item.ageLabel + '</span>';
          html += '</div>';
          if (item.meta) html += '<div class="salud-item-meta">' + item.meta + '</div>';
          html += '</div>';
          html += '<div class="salud-item-date">' + fmtDate(item.date) + '</div>';
          html += '<button class="salud-expand-btn" data-id="' + item.id + '" data-person="' + person.key + '">⋯</button>';
          html += '</div>';

          // Detail panel (hidden)
          html += '<div class="salud-detail" id="salud-detail-' + item.id + '" style="display:none;">';
          html += '<div class="salud-detail-row"><label>Fecha cita</label>';
          html += '<input type="date" class="doc-tracker-input salud-field" value="' + (item.date || '') + '" data-field="date" data-id="' + item.id + '" data-person="' + person.key + '"></div>';
          html += '<div class="salud-detail-row"><label>Preparación</label>';
          html += '<textarea class="doc-tracker-input salud-field salud-textarea" placeholder="Preguntas, documentos a llevar..." data-field="prepNotes" data-id="' + item.id + '" data-person="' + person.key + '">' + (item.prepNotes || '') + '</textarea></div>';
          html += '<div class="salud-detail-row"><label>Seguimiento</label>';
          html += '<textarea class="doc-tracker-input salud-field salud-textarea" placeholder="Resultado, próximos pasos..." data-field="followUpNotes" data-id="' + item.id + '" data-person="' + person.key + '">' + (item.followUpNotes || '') + '</textarea></div>';
          if (item.category === 'specialist') {
            html += '<div class="salud-detail-row"><button class="doc-tracker-btn doc-tracker-del salud-del" data-id="' + item.id + '" data-person="' + person.key + '">Eliminar</button></div>';
          }
          html += '</div>';
        });

        if (cat === 'specialist') {
          html += '<button class="salud-add-specialist" data-person="' + person.key + '">+ Añadir especialista</button>';
        }

        html += '</div>'; // salud-category
      });

      html += '</div>'; // salud-person-body
      html += '</div>'; // glass card
    });

    host.innerHTML = html;
    bindEvents();
  }

  function findItem(data, personKey, itemId) {
    var items = data[personKey] || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === itemId) return items[i];
    }
    return null;
  }

  function bindEvents() {
    // Toggle person sections
    document.querySelectorAll('.salud-person-title').forEach(function(title) {
      title.addEventListener('click', function() {
        var key = title.dataset.person;
        var body = document.getElementById('salud-body-' + key);
        var toggle = document.getElementById('salud-toggle-' + key);
        if (body) {
          var hidden = body.style.display === 'none';
          body.style.display = hidden ? '' : 'none';
          if (toggle) toggle.textContent = hidden ? '▾' : '▸';
        }
      });
    });

    // Done checkboxes
    document.querySelectorAll('.salud-check input').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var data = getData();
        var item = findItem(data, cb.dataset.person, cb.dataset.id);
        if (item) { item.done = cb.checked; saveData(data); render(); }
      });
    });

    // Expand buttons
    document.querySelectorAll('.salud-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var detail = document.getElementById('salud-detail-' + btn.dataset.id);
        if (detail) detail.style.display = detail.style.display === 'none' ? '' : 'none';
      });
    });

    // Field edits (date, prepNotes, followUpNotes)
    document.querySelectorAll('.salud-field').forEach(function(input) {
      var evt = input.tagName === 'TEXTAREA' ? 'blur' : 'change';
      input.addEventListener(evt, function() {
        var data = getData();
        var item = findItem(data, input.dataset.person, input.dataset.id);
        if (item) { item[input.dataset.field] = input.value; saveData(data); }
        if (input.dataset.field === 'date') render();
      });
    });

    // Delete specialist
    document.querySelectorAll('.salud-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (!confirm('¿Eliminar esta cita?')) return;
        var data = getData();
        data[btn.dataset.person] = (data[btn.dataset.person] || []).filter(function(it) { return it.id !== btn.dataset.id; });
        saveData(data);
        render();
      });
    });

    // Add specialist
    document.querySelectorAll('.salud-add-specialist').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var personKey = btn.dataset.person;
        if (document.getElementById('salud-add-form-' + personKey)) return;
        var form = document.createElement('div');
        form.id = 'salud-add-form-' + personKey;
        form.className = 'salud-add-form';
        form.innerHTML =
          '<input type="text" class="doc-tracker-input" id="saf-name-' + personKey + '" placeholder="Nombre (ej: Dermatólogo)">' +
          '<input type="text" class="doc-tracker-input" id="saf-meta-' + personKey + '" placeholder="Centro / notas">' +
          '<input type="date" class="doc-tracker-input" id="saf-date-' + personKey + '">' +
          '<div style="display:flex;gap:8px;margin-top:6px;">' +
            '<button class="btn-primary" id="saf-save-' + personKey + '" style="flex:1;">Guardar</button>' +
            '<button class="doc-tracker-btn" id="saf-cancel-' + personKey + '">Cancelar</button>' +
          '</div>';
        btn.parentElement.insertBefore(form, btn);

        document.getElementById('saf-save-' + personKey).addEventListener('click', function() {
          var name = document.getElementById('saf-name-' + personKey).value.trim();
          if (!name) return;
          var data = getData();
          if (!data[personKey]) data[personKey] = [];
          data[personKey].push({
            id: 'med_' + Date.now(),
            category: 'specialist',
            name: name,
            meta: document.getElementById('saf-meta-' + personKey).value.trim(),
            ageLabel: null,
            date: document.getElementById('saf-date-' + personKey).value || null,
            done: false,
            prepNotes: '',
            followUpNotes: ''
          });
          saveData(data);
          render();
        });

        document.getElementById('saf-cancel-' + personKey).addEventListener('click', function() {
          form.remove();
        });
      });
    });
  }

  // ---- Init ----
  function init() { render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    setTimeout(render, 2000);
  });
})();
```

- [ ] **Step 2: Commit**

```bash
git add salud.js
git commit -m "feat: create salud.js with family medical tracker"
```

---

### Task 4: Add Salud CSS styles

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append salud styles to styles.css**

```css
/* ---- Salud — Family Medical Tracker ---- */
.salud-person-card { margin-bottom: 18px; }
.salud-person-title {
  font-family: var(--font-mono); font-size: 14px; font-weight: 700;
  color: var(--text); cursor: pointer; user-select: none;
  display: flex; align-items: center; gap: 6px;
}
.salud-person-toggle {
  font-size: 12px; color: var(--text-muted); width: 14px; text-align: center;
}
.salud-cat-label {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text-muted); margin: 14px 0 6px;
}
.salud-empty { font-size: 12px; color: var(--text-muted); padding: 4px 0; }
.salud-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.salud-item.salud-done { opacity: 0.4; }
.salud-check { flex: 0 0 auto; display: flex; align-items: center; }
.salud-check input { width: 18px; height: 18px; accent-color: var(--green); cursor: pointer; }
.salud-item-body { flex: 1; min-width: 0; }
.salud-item-name { font-size: 13px; font-weight: 600; color: var(--text); }
.salud-item-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.salud-age-badge {
  font-family: var(--font-mono); font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 6px; margin-left: 6px;
  background: var(--blue-soft); color: #93c5fd; border: 1px solid var(--blue-border);
  vertical-align: middle;
}
.salud-item-date {
  font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);
  flex: 0 0 auto; white-space: nowrap;
}
.salud-expand-btn {
  background: none; border: none; color: var(--text-muted); font-size: 18px;
  cursor: pointer; padding: 4px 8px; flex: 0 0 auto;
}
.salud-detail {
  padding: 12px 0 12px 28px;
  border-bottom: 1px solid var(--border);
}
.salud-detail-row {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;
}
.salud-detail-row label {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text-muted);
}
.salud-textarea {
  min-height: 60px; resize: vertical;
  font-family: var(--font-sans); font-size: 13px;
}
.salud-add-specialist {
  display: block; width: 100%; margin-top: 8px; padding: 10px;
  background: none; border: 1px dashed var(--border); border-radius: 8px;
  color: var(--text-muted); font-size: 12px; cursor: pointer;
  font-family: var(--font-sans);
}
.salud-add-specialist:hover { border-color: var(--amber); color: var(--amber); }
.salud-add-form {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 0; margin-top: 8px;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add Salud tab CSS styles"
```

---

### Task 5: Update service worker and push

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Add salud.js to SHELL cache array**

In `service-worker.js`, add `'./salud.js'` to the SHELL array.

- [ ] **Step 2: Bump VERSION**

Update the VERSION constant to the next version.

- [ ] **Step 3: Commit and push**

```bash
git add service-worker.js
git commit -m "chore: add salud.js to SW cache, bump version"
git push
```

---

### Task 6: Integration verification

- [ ] **Step 1: Verify Salud tab appears**

Open the app. Confirm "Salud" appears in sidebar and mobile tabs. Click it — should show "Salud familiar" with four collapsible person sections.

- [ ] **Step 2: Verify pre-populated items**

Luca should have 7 revisiones + 5 vacunas. Leo should have 2 revisiones + 2 vacunas. Mum should have 2 revisiones + 1 vacuna. Daddey should have 2 revisiones + 1 vacuna.

- [ ] **Step 3: Verify interactions**

Mark an item as done — it should sort to bottom and become muted. Expand an item — date picker, prep notes, follow-up notes should appear. Add a specialist — inline form, saves correctly. Delete a specialist — works with confirmation.

- [ ] **Step 4: Verify Trámites reduced**

Go to Trámites. The "Revisiones y vacunas" group should only show 5 items (salud-0 through salud-4), not 11.

- [ ] **Step 5: Verify sync**

Open on second device. Confirm medical data syncs.
