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
    resumen: 'Dashboard',
    calendario: 'Calendar',
    tramites: 'Tramites',
    salud: 'Citas Medicas',
    documentos: 'Documents',
    ajustes: 'Settings'
  };

  var pageSysLabels = {
    resumen: 'SYS.ACTIVE',
    calendario: 'ANNUAL_VIEW',
    tramites: 'TASK_TRACKER',
    salud: 'MEDICAL_LOG',
    documentos: 'FILE_STORE',
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
