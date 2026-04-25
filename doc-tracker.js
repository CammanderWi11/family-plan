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
          // Expandable detail
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
    document.querySelectorAll('.doc-tracker-expand-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.docId;
        var detail = document.getElementById('doc-detail-' + id);
        if (detail) detail.style.display = detail.style.display === 'none' ? '' : 'none';
      });
    });

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

    var addBtn = document.getElementById('doc-tracker-add');
    if (addBtn) {
      addBtn.addEventListener('click', showAddForm);
    }
  }

  function showAddForm() {
    var host = document.getElementById('doc-tracker-host');
    if (!host || document.getElementById('doc-tracker-add-form')) return;

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

    var typeSelect = document.getElementById('dta-type');
    var personSelect = document.getElementById('dta-person');
    var labelInput = document.getElementById('dta-label');
    function autoLabel() {
      var typeLabels = { passport: 'Pasaporte', dni: 'DNI', health_card: 'Tarjeta sanitaria', insurance: 'Seguro', school: 'Escolar/Admin', other: 'Otro' };
      var personLabels = { dad: 'Dad', mum: 'Mum', leo: 'Leo', luca: 'Luca' };
      labelInput.value = (typeLabels[typeSelect.value] || '') + ' ' + (personLabels[personSelect.value] || '');
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

  function init() { render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    setTimeout(render, 2000);
  });

  window.renderDocTracker = render;
})();
