// ========== DEADLINE ENGINE ==========
window.BIRTH_EDD = new Date(2026, 3, 17, 12, 0, 0); // C-section 17 Apr 2026 12:00
window.birthActual = '2026-04-17'; // Luca born April 17, 2026
window.getBirthAnchor = function() {
  if (window.birthActual) {
    const [y, m, d] = window.birthActual.split('-').map(n => parseInt(n, 10));
    return new Date(y, m - 1, d);
  }
  return window.BIRTH_EDD;
};
window.isBornYet = function() { return !!window.birthActual; };

window.BLOQUE_STARTS = {
  1: new Date(2026, 3, 17),   // obligatorio
  2: new Date(2026, 5, 26),
  3: new Date(2026, 7, 10),
  4: new Date(2026, 10, 8),
  5: new Date(2026, 11, 23)
};

// Full trámite registry. Backwards-compat: window.TRAMITE_DEADLINES still works, read from .deadline.
// scope: nacional | autonomica | municipal | privado | empresa
// priority: critical | high | normal
// dependsOn: [otherKey, ...]  — row greys out until deps are checked
// Existing 4 groups are also in HTML; new 3 groups (bebe, salud, ayudas) render from this config.
window.TRAMITES = {
  // ---------- Preparación ----------
  'preparacion-0': { deadline: { kind: 'beforeEDD', days: 7, label: 'Lista 7d antes de FPP' }, priority: 'critical', owner: 'mum',
    subtasks: [
      { id: 'mama-ropa', label: 'Mamá: camisones (2) + bata + sujetador lactancia + chanclas' },
      { id: 'mama-higiene', label: 'Mamá: neceser (cepillo, pasta, compresas postparto, toalla)' },
      { id: 'bebe-bodys', label: 'Bebé: bodies 0-3m (5-6) + pijamas + calcetines + gorrito' },
      { id: 'bebe-manta', label: 'Bebé: arrullo + muselina + toalla con capucha' },
      { id: 'bebe-panales', label: 'Bebé: pañales recién nacido (1 paquete) + toallitas' },
      { id: 'docs-hospital', label: 'Docs: DNIs padres + tarjeta SS mamá + tarjeta seguro Vithas' },
      { id: 'acomp-essentials', label: 'Acompañante: cargador móvil + snacks + botella agua + ropa de cambio' }
    ]
  },
  'preparacion-1': { deadline: { kind: 'absolute', date: '2026-04-30', label: 'Antes del 30 abr' }, priority: 'critical', owner: 'dad',
    subtasks: [
      { id: 'comprar', label: 'Comprar silla i-Size grupo 0+ homologada' },
      { id: 'instalar', label: 'Instalar en el coche (base isofix o cinturón)' },
      { id: 'probar', label: 'Practicar enganche y desenganche' }
    ]
  },
  'preparacion-2': { deadline: { kind: 'beforeEDD', days: 14, label: 'Entregar semana 36-37' }, priority: 'high', owner: 'mum' },
  'preparacion-3': { deadline: { kind: 'beforeEDD', days: 3, label: 'Coordinar 3d antes de FPP' }, priority: 'high', owner: 'mum',
    subtasks: [
      { id: 'school', label: 'Confirmar horario/recogida Luther King' },
      { id: 'cuidador', label: 'Confirmar cuidador principal (abuelos/familia)' },
      { id: 'pernocta', label: 'Plan B para pernocta si el parto es de noche' }
    ]
  },
  // ---------- INSS ----------
  'inss-0': { deadline: { kind: 'afterBirth', days: 15, label: 'Cuanto antes tras el parto' }, priority: 'high', owner: 'dad',
    subtasks: [
      { id: 'clave', label: 'Tener Cl@ve PIN activo o certificado digital' },
      { id: 'form', label: 'Rellenar formulario MP-1 bis (portal INSS)' },
      { id: 'adj-libro', label: 'Adjuntar Libro de Familia / copia certificada' },
      { id: 'adj-dni', label: 'Adjuntar DNIs de ambos padres' },
      { id: 'adj-iban', label: 'Adjuntar certificado de titularidad IBAN' },
      { id: 'enviar', label: 'Enviar solicitud y guardar número de referencia' }
    ]
  },
  'inss-1': { deadline: { kind: 'afterBirth', days: 15, label: 'Con la solicitud' }, owner: 'dad' },
  'inss-2': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras el parto' }, owner: 'dad' },
  'inss-3': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras inscripción en Registro Civil' }, owner: 'dad' },
  'inss-4': { deadline: { kind: 'afterBirth', days: 15, label: 'Certificado de empresa' }, owner: 'dad' },
  'inss-5': { deadline: { kind: 'beforeBloque', bloque: 2, days: 15, label: '15d antes del bloque' }, owner: 'dad' },
  // ---------- Binter ----------
  'binter-0': { deadline: { kind: 'beforeEDD', days: 1, label: 'Antes del parto' }, priority: 'critical', owner: 'dad' },
  'binter-1': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras inscripción en Registro Civil' }, owner: 'dad' },
  'binter-2': { deadline: { kind: 'beforeBloque', bloque: 2, days: 15, label: '15d antes del bloque' }, owner: 'dad' },
  'binter-3': { deadline: { kind: 'absolute', date: '2026-06-20', label: 'Límite 20 jun 2026' }, owner: 'dad' },
  'binter-4': { deadline: { kind: 'absolute', date: '2026-04-25', label: 'Límite 25 abr 2026' }, priority: 'high', owner: 'dad' },
  // ---------- Bebé (admin) ----------
  'bebe-0': { name: 'Inscripción nacimiento en Registro Civil (Vithas lo gestiona)', meta: 'Vithas Ciudad Jardín · 72h · Tramitado desde el hospital',
              deadline: { kind: 'afterBirth', days: 3, label: '72h tras el parto' }, priority: 'critical', owner: 'mum' },
  'bebe-1': { name: 'Libro de Familia / Copia certificada', meta: 'Registro Civil online · Necesario para el resto de trámites',
              deadline: { kind: 'afterBirth', days: 10, label: '~10 días tras inscripción' }, priority: 'high', owner: 'dad',
              dependsOn: ['bebe-0'] },
  'bebe-2': { name: 'Empadronamiento del bebé (Ciudad Jardín, LPGC)', meta: 'Ayuntamiento de Las Palmas · OAC Ciudad Jardín · Requiere Libro de Familia',
              deadline: { kind: 'afterBirth', days: 30, label: 'Primer mes' }, owner: 'dad',
              dependsOn: ['bebe-1'],
              subtasks: [
                { id: 'cita', label: 'Pedir cita en OAC Ciudad Jardín' },
                { id: 'docs', label: 'Llevar: Libro de Familia + DNIs padres + empadronamiento de la madre' },
                { id: 'volante', label: 'Obtener volante de empadronamiento del bebé' }
              ] },
  'bebe-3': { name: 'Tarjeta sanitaria SCS del bebé', meta: 'SCS · Requiere empadronamiento · Asignación de centro de salud',
              deadline: { kind: 'afterBirth', days: 30, label: 'Primer mes' }, owner: 'dad',
              dependsOn: ['bebe-2'],
              subtasks: [
                { id: 'online', label: 'Solicitud online en sede electrónica SCS' },
                { id: 'presencial', label: 'Alternativa: presencial en CS Ciudad Jardín con Libro de Familia + volante empadronamiento' }
              ] },
  'bebe-4': { name: 'Familia Digital (app Mi Familia)', meta: 'Ministerio de Justicia · Sustituye al Libro de Familia en papel · Opcional',
              deadline: { kind: 'afterBirth', days: 30, label: 'Cuando esté disponible' }, owner: 'dad',
              dependsOn: ['bebe-1'] },
  'bebe-5': { name: 'DNI del bebé', meta: 'Dirección General de Policía · Cita previa obligatoria · Necesario para pasaporte',
              deadline: { kind: 'afterBirth', days: 90, label: 'Antes de solicitar pasaporte' }, owner: 'dad',
              dependsOn: ['bebe-1'] },
  'bebe-6': { name: 'Pasaporte del bebé', meta: 'Dirección General de Policía · Necesario para viaje a Japón abr 2027 · Iniciar 2 meses antes',
              deadline: { kind: 'absolute', date: '2027-02-01', label: 'Al menos 2 meses antes del viaje' }, owner: 'dad',
              dependsOn: ['bebe-5'] },
  // ---------- Salud ----------
  'salud-0': { name: 'Asignación de pediatra (CS Ciudad Jardín)', meta: 'SCS Gran Canaria · Centro de salud por zona',
               deadline: { kind: 'afterBirth', days: 30, label: 'Tras tarjeta sanitaria' }, owner: 'dad',
               dependsOn: ['bebe-3'] },
  'salud-1': { name: 'Cribado metabólico (prueba del talón)', meta: 'Vithas · En las primeras 48h · Resultados ~15 días',
               deadline: { kind: 'afterBirth', days: 2, label: '48h tras el parto' }, priority: 'critical', owner: 'mum' },
  'salud-2': { name: 'Cribado auditivo', meta: 'Vithas · Se realiza en el hospital al nacer',
               deadline: { kind: 'afterBirth', days: 2, label: '48h tras el parto' }, priority: 'critical', owner: 'mum' },
  'salud-3': { name: 'Revisión postparto con matrona (semana 1 y 6)', meta: 'SCS La Laguna · Primera visita en la primera semana',
               deadline: { kind: 'afterBirth', days: 7, label: 'Primera semana' }, priority: 'high', owner: 'dad' },
  'salud-4': { name: 'Informe de maternidad (SCS)', meta: 'Matrona o médico de familia · NO lo emite Vithas · Necesario para prestación INSS',
               deadline: { kind: 'afterBirth', days: 15, label: 'Primeras 2 semanas' }, priority: 'high', owner: 'dad' },
  // ---------- Ayudas económicas ----------
  'ayudas-0': { name: 'Contactar asesora fiscal Elena Melián', meta: 'Verificación IRPF — datos familiares · Actualizar nº hijos para retenciones · Al empleador',
                deadline: { kind: 'afterBirth', days: 60, label: 'Primeros 2 meses' }, owner: 'dad' },
  'ayudas-1': { name: 'Actualizar beneficiarios seguro de vida', meta: 'Compañía de seguros · Incluir al nuevo hijo',
                deadline: { kind: 'afterBirth', days: 60, label: 'Primeros 2 meses' }, owner: 'dad' },
  'ayudas-2': { name: 'Actualizar seguro médico privado (si aplica)', meta: 'Compañía de seguros · Dar de alta al bebé · Algunas tienen plazo de 15-30 días',
                deadline: { kind: 'afterBirth', days: 15, label: 'Primeras 2 semanas' }, priority: 'high', owner: 'mum' }
};

// Backwards-compat alias used by legacy paths.
window.TRAMITE_DEADLINES = new Proxy({}, {
  get(_, key) {
    const t = window.TRAMITES[key];
    if (!t || !t.deadline) return undefined;
    return Object.assign({ priority: t.priority }, t.deadline);
  },
  has(_, key) { return !!(window.TRAMITES[key] && window.TRAMITES[key].deadline); }
});

window.GROUPS = {
  inss:        { title: 'Prestación por nacimiento — INSS', renderMode: 'html' },
  binter:      { title: 'Comunicación a Binter / RRHH', renderMode: 'html' },
  bebe:        { title: '👶 Registro y documentos del bebé', desc: 'Inscripción, empadronamiento, tarjeta sanitaria y demás trámites administrativos tras el nacimiento.', renderMode: 'js', host: 'js-groups-host-bebe', count: 7 },
  salud:       { title: '🩺 Revisiones y vacunas', desc: 'Seguimiento sanitario entre Vithas (parto) y SCS (postparto La Laguna / LPGC).', renderMode: 'js', host: 'js-groups-host-salud', count: 5 },
  ayudas:      { title: '💶 Deducciones y ayudas económicas', desc: 'Prestaciones y deducciones a nivel nacional, autonómico y municipal.', renderMode: 'js', count: 3 },
  preparacion: { title: '🎒 Preparación pre-parto', desc: 'Tareas previas al parto.', renderMode: 'html' }
};

window.OWNER_CHIPS = {
  dad:    { label: 'Papá', emoji: '👨', cls: 'chip-dad' },
  mum:    { label: 'Mamá', emoji: '👩', cls: 'chip-mum' },
  alfred: { label: 'Alfred', emoji: '🎩', cls: 'chip-alfred' }
};

window.resolveDeadline = function(key) {
  const rule = window.TRAMITE_DEADLINES[key];
  if (!rule) return null;
  let d = null;
  if (rule.kind === 'absolute') d = new Date(rule.date);
  else if (rule.kind === 'afterBirth') { d = new Date(window.getBirthAnchor()); d.setDate(d.getDate() + rule.days); }
  else if (rule.kind === 'beforeEDD') { d = new Date(window.BIRTH_EDD); d.setDate(d.getDate() - rule.days); }
  else if (rule.kind === 'beforeBloque') { const b = window.BLOQUE_STARTS[rule.bloque]; if (!b) return null; d = new Date(b); d.setDate(d.getDate() - rule.days); }
  if (!d) return null;
  d.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const days = Math.round((d - today) / 86400000);
  return { date: d, daysUntil: days, label: rule.label, rule };
};

window.formatDeadlineBadge = function(daysUntil) {
  if (daysUntil < 0) return { text: 'Vencido ' + Math.abs(daysUntil) + 'd', cls: 'dl-overdue' };
  if (daysUntil === 0) return { text: 'Vence hoy', cls: 'dl-urgent' };
  if (daysUntil === 1) return { text: 'Vence mañana', cls: 'dl-urgent' };
  if (daysUntil <= 3) return { text: 'Vence en ' + daysUntil + 'd', cls: 'dl-urgent' };
  if (daysUntil <= 14) return { text: 'Vence en ' + daysUntil + 'd', cls: 'dl-soon' };
  return { text: 'Vence en ' + daysUntil + 'd', cls: 'dl-ok' };
};

window.fmtLongDate = function(d) {
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getFullYear()).slice(2);
};

// Dependency helpers — used by dashboard action queue
window.getUnmetDeps = function(key, tramiteState) {
  var t = window.TRAMITES[key];
  if (!t || !t.dependsOn || !t.dependsOn.length) return [];
  return t.dependsOn.filter(function(k) { return !tramiteState[k]; });
};
window.isBlocked = function(key, tramiteState) {
  return window.getUnmetDeps(key, tramiteState).length > 0;
};
window.getGroupForKey = function(key) {
  return key.split('-')[0];
};
window.getTabForKey = function(key) {
  return '#tramites';
};

// ========== SALUD NOTES ==========
(function() {
  var KEY = 'fp-salud-notes';
  var el = document.getElementById('salud-notes');
  if (!el) return;
  var saveTimer = null;

  function load() {
    // Prefer synced state, fall back to localStorage
    if (window.__getSaludNotes) {
      var synced = window.__getSaludNotes();
      if (synced !== null) { el.value = synced; return; }
    }
    try { el.value = localStorage.getItem(KEY) || ''; } catch(e) {}
  }

  function save() {
    var text = el.value;
    if (window.__updateSaludNotes) window.__updateSaludNotes(text);
    try { localStorage.setItem(KEY, text); } catch(e) {}
  }

  // Migrate localStorage to synced state
  function migrate() {
    if (!window.__getSaludNotes || !window.__updateSaludNotes) return;
    if (window.__getSaludNotes() !== null) return;
    try {
      var local = localStorage.getItem(KEY);
      if (local) window.__updateSaludNotes(local);
    } catch(e) {}
  }

  // Load once auth is ready (synced state available)
  function init() { migrate(); load(); }
  if (window.__authReady) init();
  else window.addEventListener('auth-ready', init, { once: true });

  el.addEventListener('input', function() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 800);
  });
})();

// ========== RESUMEN BANNERS (Leo + Luca) ==========
(function() {
  var bannerInterval = null;

  function renderBanners() {
    var host = document.getElementById('resumen-banners');
    if (!host) return;

    var html = '<div class="resumen-banner-row">';

    // Leo banner (from new rutina engine)
    var leoHtml = '';
    if (window.getRutinaCurrentStep) {
      var cur = window.getRutinaCurrentStep();
      if (cur && cur.currentStep) {
        var s = cur.currentStep.step;
        var leoAct = null;
        for (var a = 0; a < s.activities.length; a++) {
          if (s.activities[a].who === 'leo') { leoAct = s.activities[a]; break; }
        }
        if (leoAct) {
          leoHtml = '<div class="resumen-banner resumen-banner-leo">' +
            '<span class="resumen-banner-icon">\ud83d\udccc</span>' +
            '<div class="resumen-banner-body">' +
              '<span class="resumen-banner-title">Leo ahora</span>' +
              '<span class="resumen-banner-text">' + leoAct.name + ' \u00b7 ' + s.time + '\u2013' + s.endTime + '</span>' +
            '</div>' +
          '</div>';
        }
      } else {
        var offLabel = (cur && cur.isSleeping) ? 'Durmiendo \ud83d\ude34' : 'Fuera de horario';
        leoHtml = '<div class="resumen-banner resumen-banner-leo">' +
          '<span class="resumen-banner-icon">' + (cur && cur.isSleeping ? '\ud83d\ude34' : '\ud83d\udccc') + '</span>' +
          '<div class="resumen-banner-body">' +
            '<span class="resumen-banner-title">Leo ahora</span>' +
            '<span class="resumen-banner-text resumen-banner-muted">' + offLabel + '</span>' +
          '</div>' +
        '</div>';
      }
    }

    // Luca banner
    var lucaHtml = '';
    if (window.getLucaLastEntry) {
      var activeFeed = window.getLucaActiveFeed ? window.getLucaActiveFeed() : null;
      var last = window.getLucaLastEntry();
      if (activeFeed) {
        var liveSide = activeFeed.side === 'left' ? 'Izquierdo' : 'Derecho';
        lucaHtml = '<div class="resumen-banner resumen-banner-luca resumen-banner-live">' +
          '<span class="resumen-banner-icon">\ud83c\udf7c</span>' +
          '<div class="resumen-banner-body">' +
            '<span class="resumen-banner-title">\u00daltima toma</span>' +
            '<span class="resumen-banner-text">' + (window.fmtLucaElapsed ? window.fmtLucaElapsed(activeFeed.elapsed) : '0:00') + '</span>' +
            '<span class="resumen-banner-text"><span class="resumen-badge-live">Live: ' + liveSide + '</span></span>' +
          '</div>' +
        '</div>';
      } else if (last) {
        var elapsed = window.fmtLucaElapsed ? window.fmtLucaElapsed(last.elapsedSeconds) : '';
        var nextSideHtml = '';
        if (last.nextSide) {
          var isRight = last.nextSide === 'Der';
          var nextSideLabel = isRight ? 'Derecho \u2192' : '\u2190 Izquierdo';
          var nextSideClass = isRight ? 'caregiver-badge caregiver-daddey' : 'caregiver-badge caregiver-mum';
          nextSideHtml = '<span class="resumen-banner-text">Pr\u00f3xima toma <span class="' + nextSideClass + ' badge-sm">' + nextSideLabel + '</span></span>';
        }
        var isAlert = last.elapsedSeconds > 3 * 3600;
        lucaHtml = '<div class="resumen-banner resumen-banner-luca' + (isAlert ? ' resumen-banner-alert' : '') + '">' +
          '<span class="resumen-banner-icon">\ud83c\udf7c</span>' +
          '<div class="resumen-banner-body">' +
            '<span class="resumen-banner-title">\u00daltima toma</span>' +
            '<span class="resumen-banner-text">' + elapsed + '</span>' +
            nextSideHtml +
          '</div>' +
        '</div>';
      } else {
        lucaHtml = '<div class="resumen-banner resumen-banner-luca">' +
          '<span class="resumen-banner-icon">\ud83c\udf7c</span>' +
          '<div class="resumen-banner-body">' +
            '<span class="resumen-banner-title">\u00daltima toma</span>' +
            '<span class="resumen-banner-text resumen-banner-muted">Sin registros a\u00fan</span>' +
          '</div>' +
        '</div>';
      }
    }

    // Golden Sleep Block banner
    var goldenHtml = '';
    if (window.getGoldenSleepBlock) {
      var golden = window.getGoldenSleepBlock();
      if (golden) {
        var whoLabels = window.RUTINA_DATA ? window.RUTINA_DATA.whoLabels : {};
        var coveredLabel = whoLabels[golden.coveredBy] || golden.coveredBy || '?';
        var nowM = new Date().getHours() * 60 + new Date().getMinutes();
        var gStart = parseInt(golden.timeStart.split(':')[0]) * 60 + parseInt(golden.timeStart.split(':')[1]);
        var diff = gStart - nowM;
        if (diff < 0) diff += 1440;
        var countdownText = '';
        if (diff <= 120 && diff > 0) {
          var h = Math.floor(diff / 60);
          var m = diff % 60;
          countdownText = ' \u00b7 en ' + (h ? h + 'h ' : '') + m + 'min';
        } else if (diff <= 0 || diff > 1380) {
          countdownText = ' \u00b7 ACTIVO';
        }
        goldenHtml = '<div class="resumen-banner resumen-banner-golden">' +
          '<span class="resumen-banner-icon">\ud83c\udf1f</span>' +
          '<div class="resumen-banner-body">' +
            '<span class="resumen-banner-title">Bloque de Oro</span>' +
            '<span class="resumen-banner-text">' + golden.timeStart + '\u2013' + golden.timeEnd + ' \u00b7 ' + coveredLabel + ' cubre' + countdownText + '</span>' +
          '</div>' +
        '</div>';
      }
    }

    // Self-care pill
    var selfcareHtml = '';
    if (window.getSelfcareStatus) {
      var sc = window.getSelfcareStatus();
      selfcareHtml = '<div class="resumen-banner resumen-banner-selfcare">' +
        '<span class="resumen-banner-icon">\ud83e\udec0</span>' +
        '<div class="resumen-banner-body">' +
          '<span class="resumen-banner-title">Mum autocuidado</span>' +
          '<span class="resumen-banner-text">' + sc.checked + '/' + sc.total + ' \u2713</span>' +
        '</div>' +
      '</div>';
    }

    html += lucaHtml + leoHtml + goldenHtml + selfcareHtml + '</div>';
    host.innerHTML = html;

    var leoBanner = host.querySelector('.resumen-banner-leo');
    var lucaBanner = host.querySelector('.resumen-banner-luca');
    if (leoBanner) {
      leoBanner.addEventListener('click', function() {
        var nav = document.querySelector('[data-tab="rutina"]');
        if (nav) nav.click();
      });
    }
    if (lucaBanner) {
      lucaBanner.addEventListener('click', function() {
        var nav = document.querySelector('[data-tab="registro"]');
        if (nav) nav.click();
      });
    }
    var goldenBanner = host.querySelector('.resumen-banner-golden');
    if (goldenBanner) {
      goldenBanner.addEventListener('click', function() {
        var nav = document.querySelector('[data-tab="rutina"]');
        if (nav) nav.click();
      });
    }
    var selfcareBanner = host.querySelector('.resumen-banner-selfcare');
    if (selfcareBanner) {
      selfcareBanner.addEventListener('click', function() {
        var nav = document.querySelector('[data-tab="rutina"]');
        if (nav) nav.click();
        if (window.expandSelfcare) window.expandSelfcare();
      });
    }
  }

  function startBannerRefresh() {
    if (bannerInterval) clearInterval(bannerInterval);
    renderBanners();
    bannerInterval = setInterval(renderBanners, 60000);
  }

  // Start on DOMContentLoaded, re-render when switching to resumen
  function init() {
    // Delay slightly to let rutina.js and registro.js load their data
    setTimeout(startBannerRefresh, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    setTimeout(renderBanners, 1000);
  });
})();
