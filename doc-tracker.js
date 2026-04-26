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

    html += '<p style="color:var(--text-muted);font-size:12px;margin-top:14px;margin-bottom:8px;">Selecciona el documento y pulsa Registrar. Se añade con fecha de caducidad pendiente.</p>';
    html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">';
    html += '<select id="doc-tracker-quick-select" class="doc-tracker-input" style="flex:1;min-width:160px;">';
    html += '<optgroup label="Dad">';
    html += '<option value="dad|passport|Pasaporte Dad">🛂 Pasaporte Dad</option>';
    html += '<option value="dad|dni|DNI Dad">🪪 DNI Dad</option>';
    html += '<option value="dad|health_card|Tarjeta sanitaria Dad">🏥 Tarjeta sanitaria Dad</option>';
    html += '<option value="dad|insurance|Seguro médico Dad">📋 Seguro médico Dad</option>';
    html += '</optgroup>';
    html += '<optgroup label="Mum">';
    html += '<option value="mum|passport|Pasaporte Mum">🛂 Pasaporte Mum</option>';
    html += '<option value="mum|dni|DNI Mum">🪪 DNI Mum</option>';
    html += '<option value="mum|health_card|Tarjeta sanitaria Mum">🏥 Tarjeta sanitaria Mum</option>';
    html += '<option value="mum|insurance|Seguro médico Mum">📋 Seguro médico Mum</option>';
    html += '</optgroup>';
    html += '<optgroup label="Leo">';
    html += '<option value="leo|passport|Pasaporte Leo">🛂 Pasaporte Leo</option>';
    html += '<option value="leo|dni|DNI Leo">🪪 DNI Leo</option>';
    html += '<option value="leo|health_card|Tarjeta sanitaria Leo">🏥 Tarjeta sanitaria Leo</option>';
    html += '<option value="leo|insurance|Seguro médico Leo">📋 Seguro médico Leo</option>';
    html += '<option value="leo|school|Escolar Leo">🎒 Escolar Leo</option>';
    html += '</optgroup>';
    html += '<optgroup label="Luca">';
    html += '<option value="luca|passport|Pasaporte Luca">🛂 Pasaporte Luca</option>';
    html += '<option value="luca|dni|DNI Luca">🪪 DNI Luca</option>';
    html += '<option value="luca|health_card|Tarjeta sanitaria Luca">🏥 Tarjeta sanitaria Luca</option>';
    html += '<option value="luca|insurance|Seguro médico Luca">📋 Seguro médico Luca</option>';
    html += '</optgroup>';
    html += '<optgroup label="Otro">';
    html += '<option value="other|other|">📄 Otro...</option>';
    html += '</optgroup>';
    html += '</select>';
    html += '<button class="btn-primary" id="doc-tracker-quick-add">Registrar</button>';
    html += '</div>';
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

    var quickAddBtn = document.getElementById('doc-tracker-quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', function() {
        var sel = document.getElementById('doc-tracker-quick-select');
        if (!sel || !sel.value) return;
        var parts = sel.value.split('|');
        var person = parts[0], type = parts[1], label = parts[2];
        if (type === 'other' && !label) {
          label = prompt('Nombre del documento:');
          if (!label || !label.trim()) return;
          label = label.trim();
          person = prompt('¿De quién? (dad/mum/leo/luca):', 'dad') || 'dad';
        }
        var docs = getDocs();
        docs.push({
          id: 'doc_' + Date.now(),
          type: type,
          label: label,
          person: person,
          expiryDate: null,
          fileId: null,
          notes: ''
        });
        saveDocs(docs);
        render();
      });
    }
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
