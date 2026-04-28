// ========== DOCUMENT EXPIRY TRACKER ==========
(function() {

  var TYPE_ICONS = {
    passport: '🛂', dni: '🪪', health_card: '🏥',
    insurance: '📋', school: '🎒', other: '📄'
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
          if (doc.fileId) {
            html += '<span class="doc-tracker-label doc-tracker-link" data-action="view" data-doc-id="' + doc.id + '">' + doc.label + ' 📎</span>';
          } else {
            html += '<span class="doc-tracker-label">' + doc.label + '</span>';
          }
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
          html += '<div class="doc-tracker-detail-row" style="gap:8px;display:flex;flex-wrap:wrap;">';
          html += '<button class="btn-primary doc-tracker-btn" data-action="upload" data-doc-id="' + doc.id + '">' + (doc.fileId ? '📎 Reemplazar archivo' : '📎 Subir archivo') + '</button>';
          if (doc.fileId) {
            html += '<button class="btn-primary doc-tracker-btn" data-action="view" data-doc-id="' + doc.id + '">Ver documento</button>';
          }
          html += '<button class="doc-tracker-btn doc-tracker-del" data-action="delete" data-doc-id="' + doc.id + '">Eliminar</button>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      });
    }

    html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px;">';
    html += '<select id="doc-tracker-quick-select" style="flex:1;min-width:160px;padding:10px 12px;font-size:14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);-webkit-appearance:menulist;appearance:menulist;cursor:pointer;">';
    html += '<option value="" disabled selected>Seleccionar Documento</option>';
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
    html += '</div>';
    html += '</div>';

    host.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Clickable doc labels to view document
    document.querySelectorAll('.doc-tracker-link').forEach(function(link) {
      link.style.cursor = 'pointer';
      link.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = link.dataset.docId;
        var doc = getDocs().find(function(d) { return d.id === id; });
        if (doc && doc.fileId && window.__viewDocFile) window.__viewDocFile(doc.fileId);
      });
    });

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
          var fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*,application/pdf';
          fileInput.onchange = async function() {
            if (!fileInput.files[0]) return;
            btn.textContent = 'Subiendo...';
            btn.disabled = true;
            var uploaded = await window.__uploadDocFile(fileInput.files[0]);
            if (uploaded) {
              var docs = getDocs();
              for (var i = 0; i < docs.length; i++) {
                if (docs[i].id === id) { docs[i].fileId = uploaded.id; break; }
              }
              saveDocs(docs);
            }
            render();
          };
          fileInput.click();
        });
      }
    });

    var quickSel = document.getElementById('doc-tracker-quick-select');
    if (quickSel) {
      quickSel.addEventListener('change', function() {
        var sel = quickSel;
        if (!sel.value) return;
        var parts = sel.value.split('|');
        var person = parts[0], type = parts[1], label = parts[2];
        if (type === 'other' && !label) {
          label = prompt('Nombre del documento:');
          if (!label || !label.trim()) return;
          label = label.trim();
          person = prompt('¿De quién? (dad/mum/leo/luca):', 'dad') || 'dad';
        }
        var newId = 'doc_' + Date.now();
        var docs = getDocs();
        docs.push({
          id: newId,
          type: type,
          label: label,
          person: person,
          expiryDate: null,
          fileId: null,
          notes: ''
        });
        saveDocs(docs);
        sel.selectedIndex = 0;
        render();
        // Auto-expand the new entry's detail panel so user can upload
        setTimeout(function() {
          var detail = document.getElementById('doc-detail-' + newId);
          if (detail) detail.style.display = '';
        }, 100);
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
