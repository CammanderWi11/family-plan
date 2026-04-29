// ========== SALUD — FAMILY MEDICAL TRACKER ==========
(function() {

  var PERSONS = [
    { key: 'luca', label: 'Luca', emoji: '👶', born: '2026-04-17' },
    { key: 'leo',  label: 'Leo',  emoji: '🧒', born: '2023-10-26' },
    { key: 'mum',  label: 'Mamá',  emoji: '👩', born: '1984-02-09' },
    { key: 'daddey', label: 'Papá', emoji: '👨', born: '1982-05-24' }
  ];

  var CAT_LABELS = { revision: 'Revisiones', vaccine: 'Vacunas', specialist: 'Especialistas' };
  var CAT_ORDER = ['revision', 'vaccine', 'specialist'];

  var DEFAULTS = {
    luca: [
      { id: 'luca_rev_1m',  category: 'revision', name: 'Revisión del niño sano (1 mes)', meta: 'Pediatra asignado · Primera visita del Programa de Salud Infantil', ageLabel: '1 mes', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_2m',  category: 'revision', name: 'Revisión del niño sano (2 meses)', meta: 'Pediatra asignado', ageLabel: '2 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_4m',  category: 'revision', name: 'Revisión del niño sano (4 meses)', meta: 'Pediatra asignado', ageLabel: '4 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_6m',  category: 'revision', name: 'Revisión del niño sano (6 meses)', meta: 'Pediatra asignado', ageLabel: '6 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_9m',  category: 'revision', name: 'Revisión del niño sano (9 meses)', meta: 'Pediatra asignado', ageLabel: '9 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_12m', category: 'revision', name: 'Revisión del niño sano (12 meses)', meta: 'Pediatra asignado', ageLabel: '12 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_rev_15m', category: 'revision', name: 'Revisión del niño sano (15 meses)', meta: 'Pediatra asignado', ageLabel: '15 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_vac_2m',  category: 'vaccine', name: 'Vacunas 2 meses', meta: 'Hexavalente + Meningococo B + Neumococo + Rotavirus', ageLabel: '2 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_vac_4m',  category: 'vaccine', name: 'Vacunas 4 meses', meta: 'Hexavalente + Meningococo B + Neumococo + Rotavirus', ageLabel: '4 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_vac_11m', category: 'vaccine', name: 'Vacunas 11 meses', meta: 'Hexavalente + Meningococo C', ageLabel: '11 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_vac_12m', category: 'vaccine', name: 'Vacunas 12 meses', meta: 'Triple vírica + Meningococo B + Varicela + Neumococo', ageLabel: '12 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'luca_vac_15m', category: 'vaccine', name: 'Vacuna 15 meses', meta: 'Hepatitis A', ageLabel: '15 meses', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false }
    ],
    leo: [
      { id: 'leo_rev_3a',  category: 'revision', name: 'Revisión del niño sano (3 años)', meta: 'Pediatra asignado · Oct 2026', ageLabel: '3 años', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'leo_rev_4a',  category: 'revision', name: 'Revisión del niño sano (4 años)', meta: 'Pediatra asignado · Oct 2027', ageLabel: '4 años', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'leo_vac_3a',  category: 'vaccine', name: 'DTPa (3 años)', meta: 'Si pendiente · Centro de salud asignado', ageLabel: '3 años', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'leo_vac_6a',  category: 'vaccine', name: 'Vacunas 6 años', meta: 'DTPa + Triple vírica (2ª dosis) + Varicela (2ª dosis)', ageLabel: '6 años', date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false }
    ],
    mum: [
      { id: 'mum_rev_pp',  category: 'revision', name: 'Revisión postparto 6 semanas', meta: 'Ginecología', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'mum_rev_gyn', category: 'revision', name: 'Revisión ginecológica anual', meta: 'Ginecología', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'mum_vac_td',  category: 'vaccine', name: 'Td — Tétanos-difteria', meta: 'Cada 10 años · Verificar última dosis', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false }
    ],
    daddey: [
      { id: 'dad_rev_emp', category: 'revision', name: 'Reconocimiento médico empresa', meta: 'Binter · Anual', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'dad_rev_gen', category: 'revision', name: 'Revisión general', meta: 'Médico de familia', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false },
      { id: 'dad_vac_td',  category: 'vaccine', name: 'Td — Tétanos-difteria', meta: 'Cada 10 años · Verificar última dosis', ageLabel: null, date: null, done: false, prepNotes: '', followUpNotes: '', followUpOwner: null, followUpDue: null, followUpDone: false }
    ]
  };

  function getData() {
    var saved = window.__getMedical ? window.__getMedical() : null;
    var data;
    if (saved && (saved.luca || saved.leo || saved.mum || saved.daddey)) {
      data = saved;
    } else {
      data = JSON.parse(JSON.stringify(DEFAULTS));
      saveData(data);
      return data;
    }
    // Backfill new fields on existing saved data
    var needsSave = false;
    ['luca','leo','mum','daddey'].forEach(function(person) {
      (data[person] || []).forEach(function(item) {
        if (item.followUpDone === undefined) { item.followUpDone = false; needsSave = true; }
        // Migrate owner keys: dad→papi, mum→mami (note: 'mum' here is the legacy owner value, not the person key)
        if (item.followUpOwner === 'dad') { item.followUpOwner = 'papi'; needsSave = true; }
        if (item.followUpOwner === 'mum') { item.followUpOwner = 'mami'; needsSave = true; }
      });
    });
    if (needsSave) saveData(data);
    return data;
  }

  function saveData(data) {
    if (window.__updateMedical) window.__updateMedical(data);
  }

  function fmtDate(d) {
    if (!d) return 'Sin cita';
    var p = d.split('-');
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  }

  function getExpandedState() {
    var state = { persons: {}, details: {} };
    document.querySelectorAll('[id^="salud-body-"]').forEach(function(el) {
      var key = el.id.replace('salud-body-', '');
      state.persons[key] = el.style.display !== 'none';
    });
    document.querySelectorAll('[id^="salud-detail-"]').forEach(function(el) {
      var key = el.id.replace('salud-detail-', '');
      state.details[key] = el.style.display !== 'none';
    });
    return state;
  }

  function restoreExpandedState(state) {
    Object.keys(state.persons).forEach(function(key) {
      var body = document.getElementById('salud-body-' + key);
      var toggle = document.getElementById('salud-toggle-' + key);
      if (body && state.persons[key]) {
        body.style.display = '';
        if (toggle) toggle.textContent = '▾';
      }
    });
    Object.keys(state.details).forEach(function(key) {
      var detail = document.getElementById('salud-detail-' + key);
      if (detail && state.details[key]) detail.style.display = '';
    });
  }

  function collectOpenFollowUps(data) {
    var PERSON_MAP = { luca: '👶', leo: '🧒', mum: '👩', daddey: '👨' };
    var OWNER_LABEL = { papi: 'Papi', mami: 'Mami', alfred: 'Alfred' };
    var open = [];
    var done = [];
    ['luca','leo','mum','daddey'].forEach(function(personKey) {
      (data[personKey] || []).forEach(function(item) {
        if (!item.followUpNotes && !item.followUpOwner && !item.followUpDue) return;
        var entry = {
          id: item.id,
          person: personKey,
          emoji: PERSON_MAP[personKey] || '',
          name: item.name,
          ownerLabel: item.followUpOwner ? (OWNER_LABEL[item.followUpOwner] || item.followUpOwner) : null,
          due: item.followUpDue || null,
          done: !!item.followUpDone
        };
        if (entry.done) done.push(entry);
        else open.push(entry);
      });
    });
    // Sort open: overdue first (smallest timestamps), then upcoming, then undated (Infinity)
    open.sort(function(a, b) {
      var aTs = a.due ? new Date(a.due).getTime() : Infinity;
      var bTs = b.due ? new Date(b.due).getTime() : Infinity;
      return aTs - bTs;
    });
    return { open: open, done: done };
  }

  function render() {
    var host = document.getElementById('salud-host');
    if (!host) return;
    var data = getData();
    var html = '';

    var fuData = collectOpenFollowUps(data);
    if (fuData.open.length || fuData.done.length) {
      var nowTs = new Date(); nowTs.setHours(0,0,0,0); nowTs = nowTs.getTime();
      html += '<div class="glass data-card salud-followup-watchlist" id="salud-fu-watchlist">';
      html += '<h2 class="salud-person-title" data-section="fu-watchlist">';
      html += '<span class="salud-person-toggle" id="salud-toggle-fu-watchlist">▸</span> ';
      html += '📋 Seguimientos pendientes';
      if (fuData.open.length) html += ' <span class="salud-fu-count">' + fuData.open.length + '</span>';
      html += '</h2>';
      html += '<div class="salud-person-body" id="salud-body-fu-watchlist" style="display:none;">';

      if (fuData.open.length) {
        fuData.open.forEach(function(entry) {
          var dueTs = entry.due ? new Date(entry.due).setHours(0,0,0,0) : null;
          var isOverdue = dueTs !== null && dueTs < nowTs;
          var dueTxt = entry.due ? (function() {
            var p = entry.due.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2);
          })() : 'sin fecha';
          html += '<div class="salud-fu-row" data-fu-id="' + entry.id + '" data-fu-person="' + entry.person + '">';
          html += '<label class="salud-fu-check"><input type="checkbox" class="salud-followup-done-cb" data-id="' + entry.id + '" data-person="' + entry.person + '"></label>';
          html += '<span class="salud-fu-emoji">' + entry.emoji + '</span>';
          html += '<span class="salud-fu-name">' + entry.name + '</span>';
          if (entry.ownerLabel) html += '<span class="salud-fu-owner">' + entry.ownerLabel + '</span>';
          html += '<span class="salud-fu-due' + (isOverdue ? ' salud-fu-overdue' : '') + '">' + dueTxt + '</span>';
          html += '</div>';
        });
      } else {
        html += '<div class="salud-empty">Sin seguimientos pendientes</div>';
      }

      if (fuData.done.length) {
        html += '<div class="salud-fu-done-toggle" id="salud-fu-done-toggle">▸ Completados (' + fuData.done.length + ')</div>';
        html += '<div id="salud-fu-done-list" style="display:none;">';
        fuData.done.forEach(function(entry) {
          var dueTxt = entry.due ? (function() {
            var p = entry.due.split('-'); return p[2] + '/' + p[1] + '/' + p[0].slice(2);
          })() : 'sin fecha';
          html += '<div class="salud-fu-row salud-fu-row-done" data-fu-id="' + entry.id + '" data-fu-person="' + entry.person + '">';
          html += '<label class="salud-fu-check"><input type="checkbox" class="salud-followup-done-cb" data-id="' + entry.id + '" data-person="' + entry.person + '" checked></label>';
          html += '<span class="salud-fu-emoji">' + entry.emoji + '</span>';
          html += '<span class="salud-fu-name salud-fu-strikethrough">' + entry.name + '</span>';
          if (entry.ownerLabel) html += '<span class="salud-fu-owner">' + entry.ownerLabel + '</span>';
          html += '<span class="salud-fu-due">' + dueTxt + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '</div>';
      html += '</div>';
    }

    PERSONS.forEach(function(person) {
      var items = data[person.key] || [];
      html += '<div class="glass data-card salud-person-card">';
      html += '<h2 class="salud-person-title" data-person="' + person.key + '">';
      html += '<span class="salud-person-toggle" id="salud-toggle-' + person.key + '">▸</span> ';
      html += person.emoji + ' ' + person.label;
      html += '</h2>';
      html += '<div class="salud-person-body" id="salud-body-' + person.key + '" style="display:none;">';

      CAT_ORDER.forEach(function(cat) {
        var catItems = items.filter(function(it) { return it.category === cat; });
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
          html += '<span class="lib-attached-host salud-attach-host" data-salud-key="salud-' + item.id + '"></span>';
          html += '<div class="salud-attach-links salud-attach-links-row" data-salud-key="salud-' + item.id + '"></div>';
          html += '</div>';
          html += '<div class="salud-item-date">' + fmtDate(item.date) + '</div>';
          html += '<button class="salud-expand-btn" data-id="' + item.id + '" data-person="' + person.key + '">⋯</button>';
          html += '</div>';

          html += '<div class="salud-detail" id="salud-detail-' + item.id + '" style="display:none;">';
          html += '<div class="salud-detail-row"><label>Fecha cita</label>';
          html += '<input type="date" class="doc-tracker-input salud-field" value="' + (item.date || '') + '" data-field="date" data-id="' + item.id + '" data-person="' + person.key + '"></div>';
          html += '<div class="salud-detail-row"><label>Preparación</label>';
          html += '<textarea class="doc-tracker-input salud-field salud-textarea" placeholder="Preguntas, documentos a llevar..." data-field="prepNotes" data-id="' + item.id + '" data-person="' + person.key + '">' + (item.prepNotes || '') + '</textarea></div>';
          html += '<div class="salud-detail-row"><label>Seguimiento</label>';
          html += '<textarea class="doc-tracker-input salud-field salud-textarea" placeholder="Resultado, próximos pasos..." data-field="followUpNotes" data-id="' + item.id + '" data-person="' + person.key + '">' + (item.followUpNotes || '') + '</textarea></div>';
          html += '<div class="salud-detail-row salud-followup-extra">';
          html += '<div style="display:flex;gap:8px;">';
          html += '<div style="flex:1;"><label>Responsable</label>';
          html += '<select class="doc-tracker-input salud-field" data-field="followUpOwner" data-id="' + item.id + '" data-person="' + person.key + '" style="width:100%;">';
          html += '<option value=""' + (!item.followUpOwner ? ' selected' : '') + '>Sin asignar</option>';
          html += '<option value="papi"' + (item.followUpOwner === 'papi' ? ' selected' : '') + '>Papi</option>';
          html += '<option value="mami"' + (item.followUpOwner === 'mami' ? ' selected' : '') + '>Mami</option>';
          html += '<option value="alfred"' + (item.followUpOwner === 'alfred' ? ' selected' : '') + '>Alfred</option>';
          html += '</select></div>';
          html += '<div style="flex:1;"><label>Fecha límite</label>';
          html += '<input type="date" class="doc-tracker-input salud-field" value="' + (item.followUpDue || '') + '" data-field="followUpDue" data-id="' + item.id + '" data-person="' + person.key + '" style="width:100%;"></div>';
          html += '</div></div>';
          html += '<div class="salud-detail-row salud-followup-done-row">';
          html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
          html += '<input type="checkbox" class="salud-followup-done-cb"' + (item.followUpDone ? ' checked' : '') + ' data-id="' + item.id + '" data-person="' + person.key + '">';
          html += '<span>Seguimiento completado</span>';
          html += '</label>';
          html += '</div>';
          html += '<div class="salud-detail-row"><button class="btn-primary salud-attach-btn" data-salud-key="salud-' + item.id + '">Adjuntar archivo</button></div>';
          if (item.category === 'specialist') {
            html += '<div class="salud-detail-row"><button class="doc-tracker-btn doc-tracker-del salud-del" data-id="' + item.id + '" data-person="' + person.key + '">Eliminar</button></div>';
          }
          html += '</div>';
        });

        if (cat === 'specialist') {
          html += '<button class="salud-add-specialist" data-person="' + person.key + '">+ Añadir especialista</button>';
        }

        html += '</div>';
      });

      html += '</div>';
      html += '</div>';
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
    document.querySelectorAll('.salud-person-title').forEach(function(title) {
      title.addEventListener('click', function() {
        var key = title.dataset.person;
        if (!key) return; // watchlist title has no data-person; handled by its own listener
        var body = document.getElementById('salud-body-' + key);
        var toggle = document.getElementById('salud-toggle-' + key);
        if (body) {
          var hidden = body.style.display === 'none';
          body.style.display = hidden ? '' : 'none';
          if (toggle) toggle.textContent = hidden ? '▾' : '▸';
        }
      });
    });

    document.querySelectorAll('.salud-check input').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var data = getData();
        var item = findItem(data, cb.dataset.person, cb.dataset.id);
        if (item) { item.done = cb.checked; saveData(data); var expanded = getExpandedState(); render(); restoreExpandedState(expanded); }
      });
    });

    document.querySelectorAll('.salud-followup-done-cb').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var data = getData();
        var item = findItem(data, cb.dataset.person, cb.dataset.id);
        if (item) {
          item.followUpDone = cb.checked;
          saveData(data);
          var expanded = getExpandedState();
          render();
          restoreExpandedState(expanded);
        }
      });
    });

    document.querySelectorAll('.salud-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var detail = document.getElementById('salud-detail-' + btn.dataset.id);
        if (detail) detail.style.display = detail.style.display === 'none' ? '' : 'none';
      });
    });

    document.querySelectorAll('.salud-field').forEach(function(input) {
      var evt = input.tagName === 'TEXTAREA' ? 'blur' : 'change';
      input.addEventListener(evt, function() {
        var data = getData();
        var item = findItem(data, input.dataset.person, input.dataset.id);
        if (item) { item[input.dataset.field] = input.value; saveData(data); }
        if (input.dataset.field === 'date') { var expanded = getExpandedState(); render(); restoreExpandedState(expanded); }
      });
    });

    document.querySelectorAll('.salud-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (!confirm('¿Eliminar esta cita?')) return;
        var data = getData();
        data[btn.dataset.person] = (data[btn.dataset.person] || []).filter(function(it) { return it.id !== btn.dataset.id; });
        saveData(data);
        var expanded = getExpandedState(); render(); restoreExpandedState(expanded);
      });
    });

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
            followUpNotes: '',
            followUpOwner: null,
            followUpDue: null,
            followUpDone: false
          });
          saveData(data);
          var expanded = getExpandedState(); render(); restoreExpandedState(expanded);
        });

        document.getElementById('saf-cancel-' + personKey).addEventListener('click', function() {
          form.remove();
        });
      });
    });

    // Attach document buttons — native file picker
    document.querySelectorAll('.salud-attach-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = btn.dataset.saludKey;
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*';
        input.onchange = async function() {
          if (!input.files || !input.files[0]) return;
          btn.textContent = 'Subiendo...';
          btn.disabled = true;
          try {
            if (!window.__uploadDocFile) throw new Error('Upload not ready');
            var uploaded = await window.__uploadDocFile(input.files[0]);
            if (uploaded) {
              var _sb = window.sb;
              await _sb.from('tramite_attachments').insert({ tramite_key: key, document_id: uploaded.id });
              if (window.__refreshAttachments) await window.__refreshAttachments();
              if (window.__renderSaludAttachments) window.__renderSaludAttachments();
            }
          } catch(err) {
            console.error('Salud upload error:', err);
          }
          btn.textContent = 'Adjuntar archivo';
          btn.disabled = false;
        };
        input.click();
      });
    });

    var fuTitle = document.querySelector('.salud-followup-watchlist .salud-person-title');
    if (fuTitle) {
      fuTitle.addEventListener('click', function() {
        var body = document.getElementById('salud-body-fu-watchlist');
        var toggle = document.getElementById('salud-toggle-fu-watchlist');
        if (body) {
          var hidden = body.style.display === 'none';
          body.style.display = hidden ? '' : 'none';
          if (toggle) toggle.textContent = hidden ? '▾' : '▸';
        }
      });
    }

    var fuDoneToggle = document.getElementById('salud-fu-done-toggle');
    if (fuDoneToggle) {
      fuDoneToggle.addEventListener('click', function() {
        var list = document.getElementById('salud-fu-done-list');
        if (list) {
          var hidden = list.style.display === 'none';
          list.style.display = hidden ? '' : 'none';
          fuDoneToggle.textContent = (hidden ? '▾' : '▸') + ' Completados (' + document.querySelectorAll('#salud-fu-done-list .salud-fu-row').length + ')';
        }
      });
    }

    // Render attached pills for salud items
    if (window.__renderSaludAttachments) window.__renderSaludAttachments();
  }

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
