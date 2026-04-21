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
  'preparacion-0': { deadline: { kind: 'beforeEDD', days: 7, label: 'Lista 7d antes de FPP' }, priority: 'critical', scope: 'privado',
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
  'preparacion-1': { deadline: { kind: 'absolute', date: '2026-04-30', label: 'Antes del 30 abr' }, priority: 'critical', scope: 'nacional',
    subtasks: [
      { id: 'comprar', label: 'Comprar silla i-Size grupo 0+ homologada' },
      { id: 'instalar', label: 'Instalar en el coche (base isofix o cinturón)' },
      { id: 'probar', label: 'Practicar enganche y desenganche' }
    ]
  },
  'preparacion-2': { deadline: { kind: 'beforeEDD', days: 14, label: 'Entregar semana 36-37' }, priority: 'high', scope: 'privado' },
  'preparacion-3': { deadline: { kind: 'beforeEDD', days: 3, label: 'Coordinar 3d antes de FPP' }, priority: 'high', scope: 'privado',
    subtasks: [
      { id: 'school', label: 'Confirmar horario/recogida Luther King' },
      { id: 'cuidador', label: 'Confirmar cuidador principal (abuelos/familia)' },
      { id: 'pernocta', label: 'Plan B para pernocta si el parto es de noche' }
    ]
  },
  // ---------- INSS ----------
  'inss-0': { deadline: { kind: 'afterBirth', days: 15, label: 'Cuanto antes tras el parto' }, priority: 'high', scope: 'nacional',
    subtasks: [
      { id: 'clave', label: 'Tener Cl@ve PIN activo o certificado digital' },
      { id: 'form', label: 'Rellenar formulario MP-1 bis (portal INSS)' },
      { id: 'adj-libro', label: 'Adjuntar Libro de Familia / copia certificada' },
      { id: 'adj-dni', label: 'Adjuntar DNIs de ambos padres' },
      { id: 'adj-iban', label: 'Adjuntar certificado de titularidad IBAN' },
      { id: 'enviar', label: 'Enviar solicitud y guardar número de referencia' }
    ]
  },
  'inss-1': { deadline: { kind: 'afterBirth', days: 15, label: 'Con la solicitud' }, scope: 'nacional' },
  'inss-2': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras el parto' }, scope: 'autonomica' },
  'inss-3': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras inscripción en Registro Civil' }, scope: 'nacional' },
  'inss-4': { deadline: { kind: 'afterBirth', days: 15, label: 'Certificado de empresa' }, scope: 'empresa' },
  'inss-5': { deadline: { kind: 'beforeBloque', bloque: 2, days: 15, label: '15d antes del bloque' }, scope: 'nacional' },
  // ---------- Binter ----------
  'binter-0': { deadline: { kind: 'beforeEDD', days: 1, label: 'Antes del parto' }, priority: 'critical', scope: 'empresa' },
  'binter-1': { deadline: { kind: 'afterBirth', days: 15, label: 'Tras inscripción en Registro Civil' }, scope: 'empresa' },
  'binter-2': { deadline: { kind: 'beforeBloque', bloque: 2, days: 15, label: '15d antes del bloque' }, scope: 'empresa' },
  'binter-3': { deadline: { kind: 'absolute', date: '2026-06-20', label: 'Límite 20 jun 2026' }, scope: 'empresa' },
  'binter-4': { deadline: { kind: 'absolute', date: '2026-04-25', label: 'Límite 25 abr 2026' }, priority: 'high', scope: 'empresa' },
  // ---------- Bebé (admin) ----------
  'bebe-0': { name: 'Inscripción nacimiento en Registro Civil (Vithas lo gestiona)', meta: 'Vithas Ciudad Jardín · 72h · Tramitado desde el hospital',
              deadline: { kind: 'afterBirth', days: 3, label: '72h tras el parto' }, priority: 'critical', scope: 'privado' },
  'bebe-1': { name: 'Libro de Familia / Copia certificada', meta: 'Registro Civil online · Necesario para el resto de trámites',
              deadline: { kind: 'afterBirth', days: 10, label: '~10 días tras inscripción' }, priority: 'high', scope: 'nacional',
              dependsOn: ['bebe-0'] },
  'bebe-2': { name: 'Empadronamiento del bebé (Ciudad Jardín, LPGC)', meta: 'Ayuntamiento de Las Palmas · OAC Ciudad Jardín · Requiere Libro de Familia',
              deadline: { kind: 'afterBirth', days: 30, label: 'Primer mes' }, scope: 'municipal',
              dependsOn: ['bebe-1'],
              subtasks: [
                { id: 'cita', label: 'Pedir cita en OAC Ciudad Jardín' },
                { id: 'docs', label: 'Llevar: Libro de Familia + DNIs padres + empadronamiento de la madre' },
                { id: 'volante', label: 'Obtener volante de empadronamiento del bebé' }
              ] },
  'bebe-3': { name: 'Tarjeta sanitaria SCS del bebé', meta: 'SCS · Requiere empadronamiento · Asignación de centro de salud',
              deadline: { kind: 'afterBirth', days: 30, label: 'Primer mes' }, scope: 'autonomica',
              dependsOn: ['bebe-2'],
              subtasks: [
                { id: 'online', label: 'Solicitud online en sede electrónica SCS' },
                { id: 'presencial', label: 'Alternativa: presencial en CS Ciudad Jardín con Libro de Familia + volante empadronamiento' }
              ] },
  'bebe-4': { name: 'Familia Digital (app Mi Familia)', meta: 'Ministerio de Justicia · Sustituye al Libro de Familia en papel · Opcional',
              deadline: { kind: 'afterBirth', days: 30, label: 'Cuando esté disponible' }, scope: 'nacional',
              dependsOn: ['bebe-1'] },
  'bebe-5': { name: 'DNI del bebé', meta: 'Dirección General de Policía · Cita previa obligatoria · Necesario para pasaporte',
              deadline: { kind: 'afterBirth', days: 90, label: 'Antes de solicitar pasaporte' }, scope: 'nacional',
              dependsOn: ['bebe-1'] },
  'bebe-6': { name: 'Pasaporte del bebé', meta: 'Dirección General de Policía · Necesario para viaje a Japón abr 2027 · Iniciar 2 meses antes',
              deadline: { kind: 'absolute', date: '2027-02-01', label: 'Al menos 2 meses antes del viaje' }, scope: 'nacional',
              dependsOn: ['bebe-5'] },
  // ---------- Salud ----------
  'salud-0': { name: 'Asignación de pediatra (CS Ciudad Jardín)', meta: 'SCS Gran Canaria · Centro de salud por zona',
               deadline: { kind: 'afterBirth', days: 30, label: 'Tras tarjeta sanitaria' }, scope: 'autonomica',
               dependsOn: ['bebe-3'] },
  'salud-1': { name: 'Cribado metabólico (prueba del talón)', meta: 'Vithas · En las primeras 48h · Resultados ~15 días',
               deadline: { kind: 'afterBirth', days: 2, label: '48h tras el parto' }, priority: 'critical', scope: 'privado' },
  'salud-2': { name: 'Cribado auditivo', meta: 'Vithas · Se realiza en el hospital al nacer',
               deadline: { kind: 'afterBirth', days: 2, label: '48h tras el parto' }, priority: 'critical', scope: 'privado' },
  'salud-3': { name: 'Revisión postparto con matrona (semana 1 y 6)', meta: 'SCS La Laguna · Primera visita en la primera semana',
               deadline: { kind: 'afterBirth', days: 7, label: 'Primera semana' }, priority: 'high', scope: 'autonomica' },
  'salud-4': { name: 'Informe de maternidad (SCS)', meta: 'Matrona o médico de familia · NO lo emite Vithas · Necesario para prestación INSS',
               deadline: { kind: 'afterBirth', days: 15, label: 'Primeras 2 semanas' }, priority: 'high', scope: 'autonomica' },
  'salud-5': { name: 'Revisión del niño sano (1 mes)', meta: 'Pediatra asignado · Primera visita del Programa de Salud Infantil',
               deadline: { kind: 'afterBirth', days: 30, label: '~1 mes de vida' }, scope: 'autonomica',
               dependsOn: ['salud-0'] },
  'salud-6': { name: 'Vacunas 2 meses (calendario Canarias)', meta: 'Centro de salud asignado · Hexavalente + meningo B + neumococo + rotavirus',
               deadline: { kind: 'afterBirth', days: 60, label: '2 meses exactos' }, scope: 'autonomica',
               dependsOn: ['salud-0'] },
  'salud-7': { name: 'Vacunas 4 meses', meta: 'Centro de salud asignado',
               deadline: { kind: 'afterBirth', days: 120, label: '4 meses' }, scope: 'autonomica',
               dependsOn: ['salud-6'] },
  'salud-8': { name: 'Vacunas 11 meses', meta: 'Hexavalente + Meningo C',
               deadline: { kind: 'afterBirth', days: 330, label: '11 meses' }, scope: 'autonomica',
               dependsOn: ['salud-7'] },
  'salud-9': { name: 'Vacunas 12 meses', meta: 'Triple vírica + Meningo B + Varicela + Neumococo',
               deadline: { kind: 'afterBirth', days: 365, label: '12 meses' }, scope: 'autonomica',
               dependsOn: ['salud-8'] },
  'salud-10': { name: 'Vacuna 15 meses', meta: 'Hepatitis A',
                deadline: { kind: 'afterBirth', days: 456, label: '15 meses' }, scope: 'autonomica',
                dependsOn: ['salud-9'] },
  // ---------- Ayudas económicas ----------
  'ayudas-0': { name: 'Contactar asesora fiscal Elena Melián', meta: 'Verificación IRPF — datos familiares · Actualizar nº hijos para retenciones · Al empleador',
                deadline: { kind: 'afterBirth', days: 60, label: 'Primeros 2 meses' }, scope: 'nacional' },
  'ayudas-1': { name: 'Actualizar beneficiarios seguro de vida', meta: 'Compañía de seguros · Incluir al nuevo hijo',
                deadline: { kind: 'afterBirth', days: 60, label: 'Primeros 2 meses' }, scope: 'nacional' },
  'ayudas-2': { name: 'Actualizar seguro médico privado (si aplica)', meta: 'Compañía de seguros · Dar de alta al bebé · Algunas tienen plazo de 15-30 días',
                deadline: { kind: 'afterBirth', days: 15, label: 'Primeras 2 semanas' }, priority: 'high', scope: 'privado' }
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
  preparacion: { title: '🎒 Preparación pre-parto', desc: 'Tareas críticas antes del parto.', renderMode: 'html' },
  inss:        { title: 'INSS / Seguridad Social — Prestación por nacimiento', renderMode: 'html' },
  binter:      { title: 'Binter — Empresa / RRHH', renderMode: 'html' },
  bebe:        { title: '👶 Bebé — Administración', desc: 'Trámites administrativos del bebé tras el nacimiento.', renderMode: 'js', count: 7 },
  salud:       { title: '🩺 Revisiones y vacunas', desc: 'Seguimiento sanitario entre Vithas (parto) y SCS (postparto La Laguna / LPGC). Calendario vacunal de Canarias.', renderMode: 'js', host: 'js-groups-host-salud', count: 11 },
  ayudas:      { title: '💶 Ayudas y gestiones económicas', desc: 'Deducciones y prestaciones a nivel nacional, autonómico y municipal.', renderMode: 'js', count: 3 }
};

window.SCOPE_CHIPS = {
  nacional:   { label: 'National', emoji: '🇪🇸', cls: 'chip-nac' },
  autonomica: { label: 'Canarias', emoji: '🌴', cls: 'chip-aut' },
  municipal:  { label: 'LPGC', emoji: '🏛', cls: 'chip-mun' },
  privado:    { label: 'Vithas', emoji: '🏥', cls: 'chip-prv' },
  empresa:    { label: 'Binter', emoji: '🏢', cls: 'chip-emp' }
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
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
};
