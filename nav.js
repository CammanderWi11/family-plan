// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {/* ignore */});
  });
}

// ========== SIDEBAR + MOBILE TAB NAV ==========
(function() {
  var sections = document.querySelectorAll('.container > section.tab-section');
  var sidebarItems = Array.from(document.querySelectorAll('.sidebar .nav-item[data-tab]'));
  var mobileItems = Array.from(document.querySelectorAll('.mobile-tab[data-tab]'));
  var headerEl = document.querySelector('.header h1');
  var pageSys = document.getElementById('page-sys');

  // Page titles for header updates
  var pageTitles = {
    resumen: 'Resumen',
    calendario: 'Calendario',
    tramites: 'Trámites',
    salud: 'Citas Médicas',
    documentos: 'Documentos',
    rutina: 'Rutina de Leo',
    registro: 'Registro de Luca',
    ajustes: 'Ajustes'
  };

  var pageSysLabels = {
    resumen: 'SYS.ACTIVE',
    calendario: 'ANNUAL_VIEW',
    tramites: 'TASK_TRACKER',
    salud: 'MEDICAL_LOG',
    documentos: 'FILE_STORE',
    rutina: 'ROUTINE.2Y',
    registro: 'FEED.LOG',
    ajustes: 'CONFIG'
  };

  function activate(id) {
    var target = document.getElementById(id);
    if (!target || !target.classList.contains('tab-section')) return false;

    // Switch sections
    sections.forEach(function(s) { s.classList.remove('active'); });
    target.classList.add('active');
    document.body.dataset.tab = id;

    // Update sidebar active state
    sidebarItems.forEach(function(item) {
      if (item.dataset.tab === id) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Update mobile tab active state
    mobileItems.forEach(function(item) {
      if (item.dataset.tab === id) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Update header
    if (headerEl && pageTitles[id]) {
      var sysSpan = pageSys ? '<span class="page-sys" id="page-sys">' + (pageSysLabels[id] || '') + '</span>' : '';
      headerEl.innerHTML = pageTitles[id] + ' ' + sysSpan;
    }

    window.scrollTo(0, 0);
    return true;
  }

  // Sidebar clicks
  sidebarItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var id = item.dataset.tab;
      if (activate(id)) history.replaceState(null, '', '#' + id);
    });
  });

  // Mobile tab clicks
  mobileItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var id = item.dataset.tab;
      if (activate(id)) history.replaceState(null, '', '#' + id);
    });
  });

  // Initial tab from hash
  var initial = (location.hash || '').slice(1);
  if (!initial || !activate(initial)) activate('resumen');
})();

// ========== THEME TOGGLE ==========
(function() {
  var SUN = '\u263C';   // ☼
  var MOON = '\u263D';  // ☽

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    var meta = document.getElementById('meta-theme-color');
    if (meta) meta.content = theme === 'light' ? '#f5f5f0' : '#0a0f1a';

    // Update sidebar toggle
    var icon = document.getElementById('theme-icon');
    var label = document.getElementById('theme-label');
    if (icon) icon.textContent = theme === 'light' ? MOON : SUN;
    if (label) label.textContent = theme === 'light' ? 'Modo oscuro' : 'Modo claro';

    // Update mobile toggle
    var mIcon = document.getElementById('mobile-theme-icon');
    var mBtn = document.getElementById('mobile-theme-toggle');
    if (mIcon) mIcon.textContent = theme === 'light' ? MOON : SUN;
    if (mBtn) mBtn.querySelector('span:last-child').textContent = theme === 'light' ? 'OSCURO' : 'CLARO';
  }

  function toggle() {
    var current = document.documentElement.dataset.theme || 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('fp-theme', next); } catch(e) {}
  }

  // Init from saved preference
  var saved = null;
  try { saved = localStorage.getItem('fp-theme'); } catch(e) {}
  applyTheme(saved || 'dark');

  // Bind clicks
  var btn = document.getElementById('theme-toggle');
  var mBtn = document.getElementById('mobile-theme-toggle');
  if (btn) btn.addEventListener('click', toggle);
  if (mBtn) mBtn.addEventListener('click', toggle);
})();
