// ========== DOCUMENT LIBRARY ==========
(function() {
  const BUCKET = 'documents';
  const LIB_PREFIX = 'library/';
  let sb = null;
  let library = [];            // [{ id, filename, storage_path, doc_type, tags, uploaded_at }]
  let attachments = [];         // [{ tramite_key, document_id }]
  let currentPickerTramite = null;

  const typeLabels = {
    'dni-luis': 'DNI Luis', 'dni-madre': 'DNI Colombina',
    'libro-familia': 'Libro de Familia', 'empadronamiento': 'Empadronamiento',
    'parte-medico': 'Parte médico de nacimiento', 'informe-mat': 'Informe de maternidad',
    'cert-empresa': 'Cert. empresa', 'iban': 'IBAN',
    'seguro-medico': 'Seguro médico', 'otro': 'Otro'
  };

  function toast(msg, kind) {
    const host = document.getElementById('toast-host'); if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    el.innerHTML = '<span>' + msg + '</span>';
    host.appendChild(el);
    setTimeout(() => el.remove(), kind === 'error' ? 6000 : 2500);
  }

  async function signedUrl(path) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) return null;
    return data && data.signedUrl;
  }

  async function fetchLibrary() {
    const { data, error } = await sb.from('documents').select('*').order('uploaded_at', { ascending: false });
    if (error) { toast('⚠ No se pudo leer la biblioteca: ' + error.message, 'error'); return; }
    library = data || [];
    renderLibrary();
    renderAttachedPillsAll();
  }
  async function fetchAttachments() {
    const { data, error } = await sb.from('tramite_attachments').select('*');
    if (error) { toast('⚠ No se pudieron leer los adjuntos: ' + error.message, 'error'); return; }
    attachments = data || [];
    renderAttachedPillsAll();
  }

  // ---- Notes (synced via Supabase state.meta, localStorage fallback) ----
  function getDocNotes() {
    if (window.__getDocNotes) {
      var synced = window.__getDocNotes();
      if (synced) return synced;
    }
    try { return JSON.parse(localStorage.getItem('fp-doc-notes') || '{}'); } catch(e) { return {}; }
  }
  function saveDocNote(id, note) {
    const notes = getDocNotes();
    if (note && note.trim()) notes[id] = note.trim();
    else delete notes[id];
    try { localStorage.setItem('fp-doc-notes', JSON.stringify(notes)); } catch(e) {}
    if (window.__updateDocNotes) window.__updateDocNotes(notes);
  }

  function renderLibrary() {
    const listEl = document.getElementById('lib-list');
    if (!listEl) return;
    if (!library.length) { listEl.innerHTML = '<div class="doc-list-empty">Aún no hay documentos en la biblioteca.</div>'; return; }
    const notes = getDocNotes();
    const byType = {};
    library.forEach(d => {
      const k = d.doc_type || 'otro';
      (byType[k] = byType[k] || []).push(d);
    });
    let html = '';
    Object.keys(byType).forEach(type => {
      html += '<div class="lib-group">';
      html += '<div class="lib-group-title">' + (typeLabels[type] || type) + ' <span class="lib-group-count">' + byType[type].length + '</span></div>';
      byType[type].forEach(d => {
        const count = attachments.filter(a => a.document_id === d.id).length;
        const note = notes[d.id] || '';
        html += '<div class="lib-entry" data-id="' + d.id + '">';
        html += '<div class="lib-entry-main">';
        html += '<a class="lib-name" href="#">' + escapeHtml(d.filename) + '</a>';
        if (note) html += '<div class="lib-note-preview">' + escapeHtml(note) + '</div>';
        html += '</div>';
        html += '<div class="lib-entry-actions">';
        html += '<span class="lib-attach-count" title="Adjunto a ' + count + ' trámites">&#9993; ' + count + '</span>';
        html += '<button class="lib-edit-btn" title="Editar nombre y notas">&#9998;</button>';
        html += '<button class="lib-del" title="Eliminar">&#128465;</button>';
        html += '</div>';
        html += '</div>';
        // Edit panel (hidden by default)
        html += '<div class="lib-edit-panel" data-id="' + d.id + '" style="display:none;">';
        html += '<label class="lib-edit-label">Nombre del documento</label>';
        html += '<input class="lib-edit-name" type="text" value="' + escapeHtml(d.filename) + '" placeholder="Nombre del documento">';
        html += '<label class="lib-edit-label">Notas</label>';
        html += '<textarea class="lib-edit-notes" placeholder="Añade notas sobre este documento...">' + escapeHtml(note) + '</textarea>';
        html += '<div class="lib-edit-btns">';
        html += '<button class="btn btn-primary lib-save-btn">Guardar</button>';
        html += '<button class="btn btn-secondary lib-cancel-btn">Cancelar</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.lib-entry').forEach(entry => {
      const id = entry.dataset.id;
      const doc = library.find(d => d.id === id);
      const panel = listEl.querySelector('.lib-edit-panel[data-id="' + id + '"]');

      entry.querySelector('.lib-name').onclick = (e) => {
        e.preventDefault();
        const w = window.open('about:blank', '_blank');
        signedUrl(doc.storage_path).then(url => {
          if (url && w) w.location.href = url; else if (w) w.close();
        });
      };

      entry.querySelector('.lib-edit-btn').onclick = () => {
        const isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : 'block';
      };

      panel.querySelector('.lib-cancel-btn').onclick = () => { panel.style.display = 'none'; };

      panel.querySelector('.lib-save-btn').onclick = async () => {
        const newName = panel.querySelector('.lib-edit-name').value.trim();
        const newNote = panel.querySelector('.lib-edit-notes').value;
        if (!newName) { toast('⚠ El nombre no puede estar vacío', 'error'); return; }
        const t = toast('Guardando…', 'loading');
        if (newName !== doc.filename) {
          const { error } = await sb.from('documents').update({ filename: newName }).eq('id', id);
          if (error) { t.remove(); toast('⚠ ' + error.message, 'error'); return; }
        }
        saveDocNote(id, newNote);
        t.remove();
        toast('✓ Guardado', 'success');
        panel.style.display = 'none';
        await fetchLibrary();
      };

      entry.querySelector('.lib-del').onclick = async () => {
        if (!confirm('¿Eliminar "' + doc.filename + '" de la biblioteca? Se desvinculará de todos los trámites.')) return;
        const t = toast('Eliminando…', 'loading');
        await sb.storage.from(BUCKET).remove([doc.storage_path]);
        const { error } = await sb.from('documents').delete().eq('id', doc.id);
        t.remove();
        if (error) { toast('⚠ ' + error.message, 'error'); return; }
        saveDocNote(id, '');
        toast('✓ Eliminado', 'success');
        await Promise.all([fetchLibrary(), fetchAttachments()]);
      };
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function renderAttachedPillsAll() {
    document.querySelectorAll('.tramite-row').forEach(row => {
      const cb = row.querySelector('input[type="checkbox"][data-group]');
      if (!cb) return;
      const key = cb.dataset.group + '-' + cb.dataset.idx;
      renderAttachedPills(key, row);
    });
    // Also refresh salud attachment pills
    if (window.__renderSaludAttachments) window.__renderSaludAttachments();
  }
  function renderAttachedPills(key, row) {
    if (!row) {
      const cb = document.querySelector('.tramite-row input[data-group="' + key.split('-')[0] + '"][data-idx="' + key.split('-').slice(1).join('-') + '"]');
      if (!cb) return;
      row = cb.closest('.tramite-row');
    }
    let host = row.querySelector('.lib-attached-host');
    if (!host) {
      host = document.createElement('span');
      host.className = 'lib-attached-host';
      const info = row.querySelector('.tramite-info');
      if (info) info.appendChild(host);
    }
    host.innerHTML = '';
    const keyAttachments = attachments.filter(a => a.tramite_key === key);
    keyAttachments.forEach(a => {
      const doc = library.find(d => d.id === a.document_id);
      if (!doc) return;
      const pill = document.createElement('a');
      pill.className = 'lib-pill';
      pill.href = '#';
      pill.innerHTML = '<span>📎</span><span>' + escapeHtml(doc.filename) + '</span>';
      pill.onclick = (e) => { e.preventDefault(); const w = window.open('about:blank', '_blank'); signedUrl(doc.storage_path).then(u => { if (u && w) w.location.href = u; else if (w) w.close(); }); };
      host.appendChild(pill);
    });
    // "Adjuntar desde biblioteca" button
    let addBtn = row.querySelector('.lib-add-btn');
    if (!addBtn) {
      addBtn = document.createElement('button');
      addBtn.className = 'lib-add-btn';
      addBtn.type = 'button';
      addBtn.title = 'Adjuntar desde biblioteca';
      addBtn.textContent = '📎+';
      row.appendChild(addBtn);
      addBtn.onclick = () => openPickerForTramite(key);
    }
  }

  function openPickerForTramite(key) {
    currentPickerTramite = key;
    const modal = document.getElementById('lib-picker-modal');
    const t = window.TRAMITES && window.TRAMITES[key];
    const nameEl = document.getElementById('lib-picker-tramite-name');
    nameEl.textContent = t && t.name ? t.name : key;
    renderPickerList();
    modal.classList.add('open');
  }
  function renderPickerList() {
    const list = document.getElementById('lib-picker-list');
    if (!library.length) {
      list.innerHTML = '<div class="doc-list-empty">Sube documentos primero desde la sección Documentos en Trámites.</div>';
      return;
    }
    const attachedIds = new Set(attachments.filter(a => a.tramite_key === currentPickerTramite).map(a => a.document_id));
    list.innerHTML = library.map(d => {
      const type = typeLabels[d.doc_type || 'otro'] || 'Otro';
      const checked = attachedIds.has(d.id) ? 'checked' : '';
      return '<label class="lib-pick-item"><input type="checkbox" data-id="' + d.id + '" ' + checked + '> <span class="lib-pick-name">' + escapeHtml(d.filename) + '</span> <span class="lib-pick-type">' + type + '</span></label>';
    }).join('');
    list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', async () => {
        const docId = cb.dataset.id;
        if (cb.checked) {
          const { error } = await sb.from('tramite_attachments').insert({ tramite_key: currentPickerTramite, document_id: docId });
          if (error) { toast('⚠ ' + error.message, 'error'); cb.checked = false; return; }
        } else {
          const { error } = await sb.from('tramite_attachments').delete().match({ tramite_key: currentPickerTramite, document_id: docId });
          if (error) { toast('⚠ ' + error.message, 'error'); cb.checked = true; return; }
        }
        await fetchAttachments();
      });
    });
  }

  async function uploadToLibrary(file, docType) {
    if (!file) return;
    var _sb = sb || window.sb;
    if (!_sb) { toast('⚠ No conectado', 'error'); return null; }
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = LIB_PREFIX + id + '/' + safeName;
    const t = toast('Subiendo…', 'loading');
    const up = await _sb.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (up.error) { t.remove(); toast('⚠ ' + up.error.message, 'error'); return null; }
    const ins = await _sb.from('documents').insert({
      id, filename: file.name, storage_path: path, doc_type: docType || null
    }).select().single();
    t.remove();
    if (ins.error) { toast('⚠ ' + ins.error.message, 'error'); return null; }
    toast('✓ Subido', 'success');
    await fetchLibrary();
    return ins.data;
  }

  function wire() {
    const pickBtn = document.getElementById('lib-pick-btn');
    const fileInput = document.getElementById('lib-file-input');
    const typeSelect = document.getElementById('lib-type-select');
    pickBtn && pickBtn.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
    fileInput && fileInput.addEventListener('change', async () => {
      if (!fileInput.files || !fileInput.files[0]) return;
      await uploadToLibrary(fileInput.files[0], typeSelect.value || null);
      fileInput.value = '';
    });
    const modal = document.getElementById('lib-picker-modal');
    modal && modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
    document.getElementById('lib-picker-close').onclick = () => modal.classList.remove('open');
    document.getElementById('lib-picker-upload').onclick = () => {
      const tempIn = document.createElement('input');
      tempIn.type = 'file';
      tempIn.accept = 'application/pdf,image/*';
      tempIn.onchange = async () => {
        if (!tempIn.files || !tempIn.files[0]) return;
        const t = window.TRAMITES && window.TRAMITES[currentPickerTramite];
        const guessType = t && t.requiresDocs && t.requiresDocs[0] ? t.requiresDocs[0] : null;
        const doc = await uploadToLibrary(tempIn.files[0], guessType);
        if (doc) {
          await sb.from('tramite_attachments').insert({ tramite_key: currentPickerTramite, document_id: doc.id });
          await fetchAttachments();
          renderPickerList();
        }
      };
      tempIn.click();
    };
  }

  function subscribeLibRealtime() {
    sb.channel('lib-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchLibrary())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tramite_attachments' }, () => fetchAttachments())
      .subscribe();
  }

  async function init() {
    sb = window.sb;
    wire();
    await Promise.all([fetchLibrary(), fetchAttachments()]);
    subscribeLibRealtime();
  }

  // Expose for doc-tracker.js
  window.__uploadDocFile = async function(file) {
    return await uploadToLibrary(file, 'tracked_doc');
  };
  window.__viewDocFile = function(docId) {
    var doc = library.find(function(d) { return d.id === docId; });
    var w = window.open('about:blank', '_blank');
    if (doc) {
      signedUrl(doc.storage_path).then(function(url) {
        if (url && w) w.location.href = url;
        else { if (w) w.close(); }
      });
    } else {
      // Fallback: fetch document record directly from Supabase
      sb.from('documents').select('storage_path').eq('id', docId).maybeSingle().then(function(res) {
        if (res.data && res.data.storage_path) {
          signedUrl(res.data.storage_path).then(function(url) {
            if (url && w) w.location.href = url;
            else { if (w) w.close(); }
          });
        } else {
          if (w) w.close();
        }
      });
    }
  };

  // Expose generic picker for salud and other modules
  window.__openPickerForKey = function(key, label) {
    currentPickerTramite = key;
    const modal = document.getElementById('lib-picker-modal');
    const nameEl = document.getElementById('lib-picker-tramite-name');
    nameEl.textContent = label || key;
    renderPickerList();
    modal.classList.add('open');
  };

  // Render attachment pills for salud items
  window.__renderSaludAttachments = function() {
    // Render in .salud-attach-links containers (new style)
    document.querySelectorAll('.salud-attach-links').forEach(host => {
      const key = host.dataset.saludKey;
      if (!key) return;
      host.innerHTML = '';
      const keyAttachments = attachments.filter(a => a.tramite_key === key);
      keyAttachments.forEach(a => {
        const doc = library.find(d => d.id === a.document_id);
        if (!doc) return;
        const link = document.createElement('a');
        link.className = 'salud-attach-link';
        link.href = '#';
        link.textContent = doc.filename;
        link.onclick = (e) => { e.preventDefault(); const w = window.open('about:blank', '_blank'); signedUrl(doc.storage_path).then(u => { if (u && w) w.location.href = u; else if (w) w.close(); }); };
        host.appendChild(link);
      });
    });
    // Legacy pill hosts
    document.querySelectorAll('.salud-attach-host').forEach(host => {
      const key = host.dataset.saludKey;
      if (!key) return;
      host.innerHTML = '';
      const keyAttachments = attachments.filter(a => a.tramite_key === key);
      keyAttachments.forEach(a => {
        const doc = library.find(d => d.id === a.document_id);
        if (!doc) return;
        const pill = document.createElement('a');
        pill.className = 'lib-pill';
        pill.href = '#';
        pill.innerHTML = '<span>📎</span><span>' + escapeHtml(doc.filename) + '</span>';
        pill.onclick = (e) => { e.preventDefault(); const w = window.open('about:blank', '_blank'); signedUrl(doc.storage_path).then(u => { if (u && w) w.location.href = u; else if (w) w.close(); }); };
        host.appendChild(pill);
      });
    });
  };

  if (window.__authReady) init();
  else window.addEventListener('auth-ready', init, { once: true });
})();
