# Phase 1: Mission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename to Mission Control, replace trámite scope with ownership (Dad/Mum/Alfred), and add a document expiry tracker with photo upload.

**Architecture:** All data flows through `state.meta` in the existing `app_state` Supabase table. Ownership is a per-trámite field with defaults in `window.TRAMITES`. Document tracker stores entries in `state.meta.trackedDocs` array with optional file links to existing Supabase storage. No new tables needed.

**Tech Stack:** Vanilla JS, Supabase (existing), existing CSS custom properties.

---

### Task 1: Rename to Mission Control

**Files:**
- Modify: `index.html:94` (nav label), `index.html:161` (header h1)
- Modify: `nav.js:18` (pageTitles.resumen)

- [ ] **Step 1: Update index.html nav label**

In `index.html`, change line 94:
```html
      <span class="nav-label">Mission Control</span>
```

- [ ] **Step 2: Update index.html header**

In `index.html`, change line 161:
```html
    <h1>Mission Control <span class="page-sys" id="page-sys">SYS.ACTIVE</span></h1>
```

- [ ] **Step 3: Update nav.js page title**

In `nav.js`, change line 18:
```javascript
    resumen: 'Mission Control',
```

- [ ] **Step 4: Commit**

```bash
git add index.html nav.js
git commit -m "rename: Panel De Control → Mission Control"
```

---

### Task 2: Replace SCOPE_CHIPS with OWNER_CHIPS in app.js

**Files:**
- Modify: `app.js:164-170` (replace SCOPE_CHIPS with OWNER_CHIPS)

- [ ] **Step 1: Replace SCOPE_CHIPS definition**

In `app.js`, replace the `window.SCOPE_CHIPS` block (lines 164-170) with:

```javascript
window.OWNER_CHIPS = {
  dad:    { label: 'Dad', emoji: '👨', cls: 'chip-dad' },
  mum:    { label: 'Mum', emoji: '👩', cls: 'chip-mum' },
  alfred: { label: 'Alfred', emoji: '🎩', cls: 'chip-alfred' }
};
```

- [ ] **Step 2: Commit**

```bash
git add app.js
git commit -m "feat: replace SCOPE_CHIPS with OWNER_CHIPS"
```

---

### Task 3: Replace scope with owner on all TRAMITES entries

**Files:**
- Modify: `app.js:22-143` (all TRAMITES entries)

- [ ] **Step 1: Replace all scope fields with owner**

Apply these replacements across all entries in `window.TRAMITES` (lines 22-143 of app.js):

- All entries with `scope: 'empresa'` → `owner: 'dad'`
- All entries with `scope: 'nacional'` → `owner: 'dad'`
- All entries with `scope: 'autonomica'` → `owner: 'dad'`
- All entries with `scope: 'municipal'` → `owner: 'dad'`
- All entries with `scope: 'privado'` → `owner: 'mum'`

Use find-and-replace:
- `scope: 'empresa'` → `owner: 'dad'`
- `scope: 'nacional'` → `owner: 'dad'`
- `scope: 'autonomica'` → `owner: 'dad'`
- `scope: 'municipal'` → `owner: 'dad'`
- `scope: 'privado'` → `owner: 'mum'`

- [ ] **Step 2: Verify no scope references remain in TRAMITES**

```bash
grep -n "scope:" app.js
```

Expected: zero matches in the TRAMITES block (lines 22-143). The only remaining `scope` reference should be in old comments, if any.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: replace scope with owner on all TRAMITES entries"
```

---

### Task 4: Replace scope chip CSS with owner chip CSS

**Files:**
- Modify: `styles.css:745-756` (replace scope chip classes)

- [ ] **Step 1: Replace scope chip CSS**

In `styles.css`, find the scope chip block (around lines 745-756) and replace the 5 chip-* classes with:

```css
/* Owner chips */
.scope-chip {
  font-family: var(--font-mono);
  display: inline-block; font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 6px; margin-left: 6px;
  vertical-align: middle; letter-spacing: 0.2px; border: 1px solid transparent;
}
.chip-dad { background: var(--blue-soft); color: #93c5fd; border-color: var(--blue-border); }
.chip-mum { background: var(--pink-soft); color: #fda4af; border-color: var(--pink-border); }
.chip-alfred { background: var(--amber-softer); color: var(--amber); border-color: rgba(251,191,36,0.25); }
```

Remove the old classes: `.chip-nac`, `.chip-aut`, `.chip-mun`, `.chip-prv`, `.chip-emp`.

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: replace scope chip CSS with owner chip colors"
```

---

### Task 5: Update tramites.js — scope rendering → owner rendering

**Files:**
- Modify: `tramites.js:245-263` (renderScopeChips function)

- [ ] **Step 1: Rename and update renderScopeChips to use owner**

In `tramites.js`, find the `renderScopeChips` function (around line 245) and replace it with:

```javascript
function renderOwnerChips() {
  document.querySelectorAll('.tramite-row input[type="checkbox"]').forEach(box => {
    const key = box.dataset.group + '-' + box.dataset.idx;
    const t = window.TRAMITES[key];
    if (!t) return;
    const info = box.parentElement.querySelector('.tramite-info');
    if (!info || info.querySelector('.scope-chip')) return;
    // Use saved owner from state, or default from TRAMITES config
    const owner = (state.tramites[key + '_owner']) || t.owner || 'dad';
    const chipDef = window.OWNER_CHIPS[owner];
    if (!chipDef) return;
    const chip = document.createElement('span');
    chip.className = 'scope-chip ' + chipDef.cls;
    chip.textContent = chipDef.emoji + ' ' + chipDef.label;
    chip.title = 'Responsable: ' + chipDef.label;
    // Make chip clickable to cycle owner
    chip.style.cursor = 'pointer';
    chip.addEventListener('click', function(e) {
      e.stopPropagation();
      var owners = ['dad', 'mum', 'alfred'];
      var idx = owners.indexOf(owner);
      var nextOwner = owners[(idx + 1) % owners.length];
      state.tramites[key + '_owner'] = nextOwner;
      queueSave();
      // Re-render chips
      info.querySelectorAll('.scope-chip').forEach(c => c.remove());
      renderOwnerChips();
    });
    const nameEl = info.querySelector('.name');
    if (nameEl) nameEl.appendChild(chip);
  });
}
```

- [ ] **Step 2: Update all calls from renderScopeChips to renderOwnerChips**

Search for `renderScopeChips` in tramites.js and replace every call with `renderOwnerChips`.

- [ ] **Step 3: Commit**

```bash
git add tramites.js
git commit -m "feat: replace scope chips with clickable owner chips on trámites"
```

---

### Task 6: Add owner filter dropdown to trámites tab

**Files:**
- Modify: `index.html` (add filter dropdown near tramites search)
- Modify: `tramites.js` (filter logic)

- [ ] **Step 1: Add owner filter dropdown in index.html**

Find the trámites search input area in `index.html` and add a select dropdown next to it:

```html
<select id="tramites-owner-filter" class="reg-bottle-input" style="flex:0 0 auto;min-width:80px;font-size:12px;">
  <option value="all">Todos</option>
  <option value="dad">👨 Dad</option>
  <option value="mum">👩 Mum</option>
  <option value="alfred">🎩 Alfred</option>
</select>
```

- [ ] **Step 2: Add filter logic in tramites.js**

After the existing search filter code, add owner filter logic:

```javascript
const ownerFilter = document.getElementById('tramites-owner-filter');
if (ownerFilter) {
  ownerFilter.addEventListener('change', applyOwnerFilter);
}

function applyOwnerFilter() {
  const sel = ownerFilter ? ownerFilter.value : 'all';
  document.querySelectorAll('.tramite-row').forEach(row => {
    if (sel === 'all') { row.style.display = ''; return; }
    const box = row.querySelector('input[type="checkbox"]');
    if (!box) return;
    const key = box.dataset.group + '-' + box.dataset.idx;
    const t = window.TRAMITES[key];
    const owner = (state.tramites[key + '_owner']) || (t && t.owner) || 'dad';
    row.style.display = (owner === sel) ? '' : 'none';
  });
  // Hide groups that have all rows hidden
  document.querySelectorAll('.tramite-group').forEach(g => {
    const visible = g.querySelectorAll('.tramite-row[style=""], .tramite-row:not([style])').length;
    g.style.display = visible ? '' : 'none';
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html tramites.js
git commit -m "feat: add owner filter dropdown to trámites tab"
```

---

### Task 7: Add trackedDocs accessors to tramites.js

**Files:**
- Modify: `tramites.js` (add getter/setter near other state.meta accessors)

- [ ] **Step 1: Add trackedDocs accessors**

In `tramites.js`, after the `__updateDocNotes` accessor, add:

```javascript
  // Tracked documents (expiry tracker) — synced across devices
  window.__getTrackedDocs = function() {
    return (state.meta && state.meta.trackedDocs) || [];
  };
  window.__updateTrackedDocs = function(docs) {
    state.meta = state.meta || {};
    state.meta.trackedDocs = docs;
    queueSave();
  };
```

- [ ] **Step 2: Commit**

```bash
git add tramites.js
git commit -m "feat: add trackedDocs state.meta accessors for doc expiry tracker"
```

---

### Task 8: Build document expiry tracker UI

**Files:**
- Create: `doc-tracker.js`
- Modify: `index.html` (add script tag, add tracker host div in trámites section)
- Modify: `styles.css` (tracker styles)

- [ ] **Step 1: Create doc-tracker.js**

Create `doc-tracker.js` with the full tracker implementation:

```javascript
// ========== DOCUMENT EXPIRY TRACKER ==========
(function() {

  var TYPE_ICONS = {
    passport: '🛂', dni: '🪪', health_card: '🏥',
    insurance: '📋', school: '🎒', other: '📄'
  };
  var TYPE_LABELS = {
    passport: 'Pasaporte', dni: 'DNI', health_card: 'Tarjeta sanitaria',
    insurance: 'Seguro', school: 'Escolar/Admin', other: 'Otro'
  };
  var PERSON_LABELS = { dad: 'Dad', mum: 'Mum', leo: 'Leo', luca: 'Luca' };
  var PERSON_ORDER = ['dad', 'mum', 'leo', 'luca'];

  function getDocs() {
    return window.__getTrackedDocs ? window.__getTrackedDocs() : [];
  }

  function saveDocs(docs) {
    if (window.__updateTrackedDocs) window.__updateTrackedDocs(docs);
  }

  function expiryStatus(dateStr) {
    if (!dateStr) return { cls: 'exp-unknown', label: 'Sin fecha' };
    var now = new Date(); now.setHours(0,0,0,0);
    var exp = new Date(dateStr + 'T00:00:00');
    var diff = Math.floor((exp - now) / 86400000);
    if (diff < 0) return { cls: 'exp-expired', label: 'Caducado' };
    if (diff < 30) return { cls: 'exp-red', label: diff + 'd' };
    if (diff < 180) return { cls: 'exp-amber', label: Math.floor(diff / 30) + ' meses' };
    return { cls: 'exp-green', label: Math.floor(diff / 30) + ' meses' };
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    var parts = dateStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function render() {
    var host = document.getElementById('doc-tracker-host');
    if (!host) return;
    var docs = getDocs();

    var html = '<div class="glass data-card">';
    html += '<h2 class="tramite-group-title">📁 Documentos</h2>';

    if (!docs.length) {
      html += '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">Sin documentos registrados</div>';
    } else {
      PERSON_ORDER.forEach(function(person) {
        var personDocs = docs.filter(function(d) { return d.person === person; });
        if (!personDocs.length) return;
        html += '<div class="doc-tracker-person">';
        html += '<div class="doc-tracker-person-label">' + PERSON_LABELS[person] + '</div>';
        personDocs.forEach(function(doc) {
          var status = expiryStatus(doc.expiryDate);
          html += '<div class="doc-tracker-row" data-doc-id="' + doc.id + '">';
          html += '<span class="doc-tracker-icon">' + (TYPE_ICONS[doc.type] || '📄') + '</span>';
          html += '<div class="doc-tracker-info">';
          html += '<span class="doc-tracker-label">' + doc.label + '</span>';
          html += '<span class="doc-tracker-expiry ' + status.cls + '">' + fmtDate(doc.expiryDate) + ' · ' + status.label + '</span>';
          html += '</div>';
          html += '<button class="doc-tracker-expand-btn" data-doc-id="' + doc.id + '">⋯</button>';
          html += '</div>';
          // Expandable detail (hidden by default)
          html += '<div class="doc-tracker-detail" id="doc-detail-' + doc.id + '" style="display:none;">';
          html += '<div class="doc-tracker-detail-row">';
          html += '<label>Fecha caducidad</label>';
          html += '<input type="date" class="doc-tracker-input" value="' + (doc.expiryDate || '') + '" data-field="expiryDate" data-doc-id="' + doc.id + '">';
          html += '</div>';
          html += '<div class="doc-tracker-detail-row">';
          html += '<label>Notas</label>';
          html += '<input type="text" class="doc-tracker-input" value="' + (doc.notes || '') + '" placeholder="Notas..." data-field="notes" data-doc-id="' + doc.id + '">';
          html += '</div>';
          html += '<div class="doc-tracker-detail-row" style="gap:8px;display:flex;">';
          if (doc.fileId) {
            html += '<button class="btn-primary doc-tracker-btn" data-action="view" data-doc-id="' + doc.id + '">Ver foto</button>';
          }
          html += '<button class="btn-primary doc-tracker-btn" data-action="upload" data-doc-id="' + doc.id + '">📷 Subir foto</button>';
          html += '<button class="doc-tracker-btn doc-tracker-del" data-action="delete" data-doc-id="' + doc.id + '">Eliminar</button>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      });
    }

    html += '<button class="btn-primary" id="doc-tracker-add" style="margin-top:12px;width:100%;">+ Añadir documento</button>';
    html += '</div>';

    host.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Expand/collapse
    document.querySelectorAll('.doc-tracker-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.docId;
        var detail = document.getElementById('doc-detail-' + id);
        if (detail) detail.style.display = detail.style.display === 'none' ? '' : 'none';
      });
    });

    // Field edits
    document.querySelectorAll('.doc-tracker-input').forEach(function(input) {
      input.addEventListener('change', function() {
        var id = input.dataset.docId;
        var field = input.dataset.field;
        var docs = getDocs();
        for (var i = 0; i < docs.length; i++) {
          if (docs[i].id === id) { docs[i][field] = input.value; break; }
        }
        saveDocs(docs);
        render();
      });
    });

    // Action buttons (view, upload, delete)
    document.querySelectorAll('.doc-tracker-btn').forEach(function(btn) {
      var action = btn.dataset.action;
      var id = btn.dataset.docId;
      if (action === 'delete') {
        btn.addEventListener('click', function() {
          if (!confirm('¿Eliminar este documento?')) return;
          saveDocs(getDocs().filter(function(d) { return d.id !== id; }));
          render();
        });
      }
      if (action === 'view') {
        btn.addEventListener('click', function() {
          var doc = getDocs().find(function(d) { return d.id === id; });
          if (!doc || !doc.fileId) return;
          // Use library's signed URL mechanism
          if (window.__viewDocFile) window.__viewDocFile(doc.fileId);
        });
      }
      if (action === 'upload') {
        btn.addEventListener('click', function() {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = async function() {
            if (!input.files[0]) return;
            var uploaded = await window.__uploadDocFile(input.files[0]);
            if (uploaded) {
              var docs = getDocs();
              for (var i = 0; i < docs.length; i++) {
                if (docs[i].id === id) { docs[i].fileId = uploaded.id; break; }
              }
              saveDocs(docs);
              render();
            }
          };
          input.click();
        });
      }
    });

    // Add document button
    var addBtn = document.getElementById('doc-tracker-add');
    if (addBtn) {
      addBtn.addEventListener('click', showAddForm);
    }
  }

  function showAddForm() {
    var host = document.getElementById('doc-tracker-host');
    if (!host) return;
    // Check if form already open
    if (document.getElementById('doc-tracker-add-form')) return;

    var form = document.createElement('div');
    form.id = 'doc-tracker-add-form';
    form.className = 'glass data-card';
    form.innerHTML =
      '<h3 class="reg-sec-title">Nuevo documento</h3>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<select id="dta-person" class="doc-tracker-input">' +
          '<option value="dad">Dad</option><option value="mum">Mum</option>' +
          '<option value="leo">Leo</option><option value="luca">Luca</option>' +
        '</select>' +
        '<select id="dta-type" class="doc-tracker-input">' +
          '<option value="passport">🛂 Pasaporte</option><option value="dni">🪪 DNI</option>' +
          '<option value="health_card">🏥 Tarjeta sanitaria</option><option value="insurance">📋 Seguro</option>' +
          '<option value="school">🎒 Escolar/Admin</option><option value="other">📄 Otro</option>' +
        '</select>' +
        '<input type="text" id="dta-label" class="doc-tracker-input" placeholder="Nombre (ej: Pasaporte Leo)">' +
        '<input type="date" id="dta-expiry" class="doc-tracker-input">' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn-primary" id="dta-save" style="flex:1;">Guardar</button>' +
          '<button class="doc-tracker-btn" id="dta-cancel" style="flex:0 0 auto;">Cancelar</button>' +
        '</div>' +
      '</div>';

    host.appendChild(form);

    // Auto-fill label from type + person
    var typeSelect = document.getElementById('dta-type');
    var personSelect = document.getElementById('dta-person');
    var labelInput = document.getElementById('dta-label');
    function autoLabel() {
      labelInput.value = (TYPE_LABELS[typeSelect.value] || '') + ' ' + (PERSON_LABELS[personSelect.value] || '');
    }
    typeSelect.addEventListener('change', autoLabel);
    personSelect.addEventListener('change', autoLabel);
    autoLabel();

    document.getElementById('dta-save').addEventListener('click', function() {
      var label = labelInput.value.trim();
      if (!label) return;
      var docs = getDocs();
      docs.push({
        id: 'doc_' + Date.now(),
        type: typeSelect.value,
        label: label,
        person: personSelect.value,
        expiryDate: document.getElementById('dta-expiry').value || null,
        fileId: null,
        notes: ''
      });
      saveDocs(docs);
      form.remove();
      render();
    });

    document.getElementById('dta-cancel').addEventListener('click', function() {
      form.remove();
    });
  }

  // Init
  function init() {
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    // Re-render after sync pulls fresh data
    setTimeout(render, 2000);
  });

  window.renderDocTracker = render;
})();
```

- [ ] **Step 2: Add tracker host div in index.html**

In the trámites section of `index.html`, add a host div where the document tracker will render. Place it after the last trámite group:

```html
<div id="doc-tracker-host"></div>
```

- [ ] **Step 3: Add script tag in index.html**

Before the closing `</body>`, add:

```html
<script src="doc-tracker.js"></script>
```

Place it after `library.js` so the upload helpers are available.

- [ ] **Step 4: Commit**

```bash
git add doc-tracker.js index.html
git commit -m "feat: add document expiry tracker UI"
```

---

### Task 9: Add doc tracker CSS styles

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Add tracker styles**

Append to `styles.css`:

```css
/* ---- Document Expiry Tracker ---- */
.doc-tracker-person { margin-bottom: 16px; }
.doc-tracker-person-label {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;
}
.doc-tracker-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.doc-tracker-icon { font-size: 18px; flex: 0 0 auto; }
.doc-tracker-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.doc-tracker-label { font-size: 13px; font-weight: 600; color: var(--text); }
.doc-tracker-expiry { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.5px; }
.doc-tracker-expand-btn {
  background: none; border: none; color: var(--text-muted); font-size: 18px;
  cursor: pointer; padding: 4px 8px;
}
.doc-tracker-detail {
  padding: 12px 0 12px 28px;
  border-bottom: 1px solid var(--border);
}
.doc-tracker-detail-row {
  display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;
}
.doc-tracker-detail-row label {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--text-muted);
}
.doc-tracker-input {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 8px 12px; color: var(--text); font-size: 13px; font-family: var(--font-sans);
  outline: none;
}
.doc-tracker-input:focus { border-color: var(--amber); }
.doc-tracker-btn {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  padding: 8px 12px; color: var(--text); font-size: 12px; cursor: pointer;
  font-family: var(--font-sans);
}
.doc-tracker-del { color: var(--red); border-color: var(--red-border); }
.doc-tracker-del:hover { background: var(--red-soft); }

/* Expiry status colors */
.exp-green { color: var(--green); }
.exp-amber { color: var(--amber); }
.exp-red { color: var(--red); font-weight: 700; }
.exp-expired { color: var(--red); font-weight: 700; animation: expBlink 1s step-end infinite; }
.exp-unknown { color: var(--text-muted); }
@keyframes expBlink { 50% { opacity: 0.4; } }
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add document expiry tracker styles"
```

---

### Task 10: Expose upload/view helpers from library.js for doc tracker

**Files:**
- Modify: `library.js` (expose __uploadDocFile and __viewDocFile)

- [ ] **Step 1: Add window helpers at the end of library.js IIFE**

Inside the library.js IIFE (before the closing `})()`), add:

```javascript
  // Expose for doc-tracker.js
  window.__uploadDocFile = async function(file) {
    return await uploadToLibrary(file, 'tracked_doc');
  };
  window.__viewDocFile = function(docId) {
    var doc = library.find(function(d) { return d.id === docId; });
    if (!doc) return;
    var w = window.open('about:blank', '_blank');
    signedUrl(doc.storage_path).then(function(url) {
      if (url && w) w.location.href = url;
      else { if (w) w.close(); }
    });
  };
```

- [ ] **Step 2: Commit**

```bash
git add library.js
git commit -m "feat: expose upload/view helpers from library for doc tracker"
```

---

### Task 11: Add doc-tracker.js to service worker cache and bump version

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Add doc-tracker.js to SHELL cache array**

In `service-worker.js`, add `'./doc-tracker.js'` to the SHELL array.

- [ ] **Step 2: Bump VERSION**

Update the VERSION constant to the next version.

- [ ] **Step 3: Commit and push**

```bash
git add service-worker.js
git commit -m "chore: add doc-tracker.js to SW cache, bump version"
git push
```

---

### Task 12: Final integration test

- [ ] **Step 1: Verify rename**

Open the app. Confirm sidebar shows "Mission Control" and header shows "Mission Control".

- [ ] **Step 2: Verify owner chips**

Go to Trámites. Each trámite should show a colored owner badge (Dad/Mum/Alfred). Click a badge to cycle through owners. Refresh — the change should persist.

- [ ] **Step 3: Verify owner filter**

Use the owner dropdown to filter by Dad only. Confirm only Dad-owned trámites show. Switch to All — everything returns.

- [ ] **Step 4: Verify document tracker**

Scroll to the "Documentos" section at the bottom of Trámites. Click "+ Añadir documento". Fill in person, type, label, expiry date. Save. Confirm it appears grouped by person with correct expiry color coding. Tap ⋯ to expand. Edit expiry date — confirm color updates. Upload a photo. View the photo.

- [ ] **Step 5: Verify sync**

Open the app on a second device. Confirm owner changes and tracked documents appear on both devices.

- [ ] **Step 6: Final commit and push**

```bash
git push
```
