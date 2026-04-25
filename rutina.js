// ========== RUTINA DE LEO ==========
(function() {

  var LOCAL_KEY = 'fp-leo-routine';
  var SHARED_TABLE = 'shared_leo_routine';

  var DEFAULT_BLOCKS = [
    {
      id: 'manana',
      title: 'Ma\u00f1ana',
      emoji: '\u2600\ufe0f',
      timeRange: '7:30\u201312:30',
      startH: 7, startM: 30,
      endH: 12, endM: 30,
      steps: [
        { time: '7:30', endTime: '8:00',   who: 'granma', name: 'Despertar',             desc: 'Duerme con \u00e9l \u00b7 5 min de mimos en la cama' },
        { time: '8:00', endTime: '8:30',   who: 'granma', name: 'Desayuno',              desc: 'Sentado \u00b7 sin pantallas \u00b7 opciones fijas' },
        { time: '8:30', endTime: '10:00',  who: 'granma', name: 'Juego tranquilo en casa', desc: '' },
        { time: '10:00', endTime: '12:00', who: 'daddey', name: 'Parque / playa \ud83c\udfd6',  desc: 'Clave para la siesta \u00b7 Snack fruta 11:00' },
        { time: '11:30', endTime: '12:30', who: 'mum',    name: 'Prepara la comida',     desc: '' }
      ]
    },
    {
      id: 'mediodia',
      title: 'Mediod\u00eda \u00b7 Siesta',
      emoji: '\ud83c\udf7d',
      timeRange: '12:30\u201316:15',
      startH: 12, startM: 30,
      endH: 16, endM: 15,
      steps: [
        { time: '12:30', endTime: '13:00', who: 'daddey', name: 'Da de comer a Leo',    desc: '' },
        { time: '13:00', endTime: '13:15', who: 'daddey', name: 'Transici\u00f3n tranquila', desc: '' },
        { time: '13:15', endTime: '13:30', who: 'daddey', name: 'Ritual siesta',         desc: 'Pa\u00f1al \u2192 cuento \u2192 luz baja \u2192 cama' },
        { time: '13:30', endTime: '15:30', who: 'ancla',  name: 'Siesta \ud83d\udca4',           desc: 'm\u00e1x. 2h \u00b7 si pasa de 2h, despertarlo' },
        { time: '15:45', endTime: '16:15', who: 'ancla',  name: 'Merienda \ud83c\udf4e',         desc: 'Fruta + l\u00e1cteo o bocadillo' }
      ]
    },
    {
      id: 'tarde',
      title: 'Tarde',
      subtitle: 'BLOQUE DE ORO',
      emoji: '\ud83c\udf33',
      timeRange: '16:15\u201319:30',
      startH: 16, startM: 15,
      endH: 19, endM: 30,
      steps: [
        { time: '16:15', endTime: '18:30', who: 'granma', name: 'Tarde con Granma-Tere', desc: 'Parque, manualidades, juego libre' },
        { time: '18:30', endTime: '19:00', who: 'granma', name: 'Vuelta a casa',          desc: '' },
        { time: '18:30', endTime: '19:30', who: 'daddey', name: 'Prepara la cena',        desc: '' },
        { time: '19:00', endTime: '19:30', who: 'mum',    name: '\ud83d\udc97 15 min \u201csolo Mum y t\u00fa\u201d', desc: 'Sin beb\u00e9, sin m\u00f3vil \u00b7 ant\u00eddoto celos' }
      ]
    },
    {
      id: 'noche',
      title: 'Noche',
      subtitle: 'MUM SIEMPRE',
      emoji: '\ud83c\udf19',
      timeRange: '19:30\u201320:30',
      startH: 19, startM: 30,
      endH: 20, endM: 30,
      steps: [
        { time: '19:30', endTime: '20:00', who: 'mum', name: 'Cena en familia',   desc: 'Daddey con el beb\u00e9 cerca' },
        { time: '20:00', endTime: '20:20', who: 'mum', name: 'Ba\u00f1o \ud83d\udec1',         desc: 'Daddey ayuda a sacarlo si duele' },
        { time: '20:20', endTime: '20:30', who: 'mum', name: 'Ritual cama',       desc: 'Pijama \u2192 cuentos \u2192 canci\u00f3n' },
        { time: '20:30', endTime: '21:00', who: 'mum', name: 'A dormir \ud83d\udca4',       desc: '' }
      ]
    }
  ];

  var DEFAULT_CLAVES = [
    'Anclas fijas, medio flexible. Despertar, comida, siesta, cena y cama siempre a la misma hora.',
    '15 min solo Mum y Leo antes de cenar. Sin beb\u00e9, sin m\u00f3vil. Ant\u00eddoto celos.',
    'Si se rompe un d\u00eda, no lo recuper\u00e9is. Volved a la siguiente ancla y seguid.'
  ];

  var WHO_LABELS = { daddey: 'Daddey', mum: 'Mum', granma: 'Granma-Tere', ancla: 'Ancla fija' };
  var WHO_OPTIONS = ['daddey', 'mum', 'granma', 'ancla'];

  var BLOCKS = [];
  var CLAVES = [];
  var editMode = false;
  var editingStep = null; // { b, s } indices of step being edited

  // ---- Local cache ----
  function loadLocal() {
    try {
      var saved = JSON.parse(localStorage.getItem(LOCAL_KEY));
      if (saved && saved.blocks && saved.blocks.length) {
        BLOCKS = saved.blocks;
        CLAVES = saved.claves || DEFAULT_CLAVES;
        return true;
      }
    } catch(e) {}
    return false;
  }

  function saveLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ blocks: BLOCKS, claves: CLAVES })); } catch(e) {}
  }

  // ---- Supabase sync ----
  function pullFromSupabase() {
    if (!window.sb || !window.__authReady) return;
    window.sb.from(SHARED_TABLE).select('*').limit(1).maybeSingle().then(function(res) {
      if (res.data && res.data.blocks && res.data.blocks.length) {
        BLOCKS = res.data.blocks;
        CLAVES = res.data.claves || DEFAULT_CLAVES;
        saveLocal();
        render();
      }
    });
  }

  function pushToSupabase() {
    if (!window.sb || !window.__authReady) return;
    window.sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) return;
      var payload = {
        blocks: BLOCKS,
        claves: CLAVES,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      };
      window.sb.from(SHARED_TABLE).select('id').limit(1).maybeSingle().then(function(res2) {
        if (res2.data) {
          window.sb.from(SHARED_TABLE).update(payload).eq('id', res2.data.id).then(function() {});
        } else {
          window.sb.from(SHARED_TABLE).insert(payload).then(function() {});
        }
      });
    });
  }

  // ---- Helpers ----
  function recalcBlock(block) {
    if (!block.steps.length) return;
    var firstStep = block.steps[0];
    var lastStep = block.steps[block.steps.length - 1];
    var sp = firstStep.time.split(':');
    block.startH = parseInt(sp[0]); block.startM = parseInt(sp[1]);
    var ep = lastStep.endTime.split(':');
    block.endH = parseInt(ep[0]); block.endM = parseInt(ep[1]);
    block.timeRange = firstStep.time + '\u2013' + lastStep.endTime;
  }

  function toMinutes(t) {
    var p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }

  function nowMinutes() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function findCurrent() {
    var now = nowMinutes();
    var currentBlockIdx = -1;
    var currentStepRef = null;
    var nextStepRef = null;

    for (var b = 0; b < BLOCKS.length; b++) {
      var bl = BLOCKS[b];
      if (now >= bl.startH * 60 + bl.startM && now < bl.endH * 60 + bl.endM) {
        currentBlockIdx = b;
        break;
      }
    }

    var found = false;
    outer:
    for (var b = 0; b < BLOCKS.length; b++) {
      for (var s = 0; s < BLOCKS[b].steps.length; s++) {
        var step = BLOCKS[b].steps[s];
        var start = toMinutes(step.time);
        var end = toMinutes(step.endTime);
        if (now >= start && now < end) {
          currentStepRef = { b: b, s: s, step: step };
          for (var nb = b, ns = s + 1; nb < BLOCKS.length; nb++, ns = 0) {
            for (; ns < BLOCKS[nb].steps.length; ns++) {
              nextStepRef = { b: nb, s: ns, step: BLOCKS[nb].steps[ns] };
              break outer;
            }
          }
          found = true;
          break outer;
        }
        if (!found && !currentStepRef && now < start && !nextStepRef) {
          nextStepRef = { b: b, s: s, step: step };
        }
      }
    }

    return { currentBlockIdx: currentBlockIdx, currentStep: currentStepRef, nextStep: nextStepRef };
  }

  function badgeHtml(who, small) {
    return '<span class="caregiver-badge caregiver-' + who + (small ? ' badge-sm' : '') + '">' + (WHO_LABELS[who] || who) + '</span>';
  }

  // ---- Edit form for a step ----
  function renderEditForm(b, s) {
    var step = BLOCKS[b].steps[s];
    var whoOpts = WHO_OPTIONS.map(function(w) {
      return '<option value="' + w + '"' + (step.who === w ? ' selected' : '') + '>' + WHO_LABELS[w] + '</option>';
    }).join('');
    return '<div class="rutina-edit-form" data-b="' + b + '" data-s="' + s + '">' +
      '<div class="rutina-edit-row">' +
        '<label>Inicio</label><input type="time" class="rutina-edit-input" value="' + step.time + '" data-field="time">' +
        '<label>Fin</label><input type="time" class="rutina-edit-input" value="' + step.endTime + '" data-field="endTime">' +
      '</div>' +
      '<div class="rutina-edit-row">' +
        '<label>Qui\u00e9n</label><select class="rutina-edit-input" data-field="who">' + whoOpts + '</select>' +
      '</div>' +
      '<div class="rutina-edit-row">' +
        '<label>Actividad</label><input type="text" class="rutina-edit-input" value="' + (step.name || '') + '" data-field="name">' +
      '</div>' +
      '<div class="rutina-edit-row">' +
        '<label>Notas</label><input type="text" class="rutina-edit-input" value="' + (step.desc || '') + '" data-field="desc" placeholder="Opcional">' +
      '</div>' +
      '<div class="rutina-edit-actions">' +
        '<button class="btn-primary rutina-edit-save">Guardar</button>' +
        '<button class="btn-secondary rutina-edit-cancel">Cancelar</button>' +
      '</div>' +
    '</div>';
  }

  // ---- Render ----
  function render() {
    var section = document.getElementById('rutina');
    if (!section) return;

    var cur = findCurrent();
    var html = '';

    // ---- Edit mode toggle ----
    html += '<div class="rutina-toolbar">';
    html += '<button class="rutina-edit-toggle' + (editMode ? ' rutina-edit-toggle-active' : '') + '" id="rutina-edit-toggle">';
    html += editMode ? '\u2713 Listo' : '\u270f\ufe0f Editar';
    html += '</button>';
    html += '</div>';

    // ---- Hero ----
    if (!editMode) {
      html += '<div class="glass rutina-hero">';
      html += '<div class="rutina-hero-label">AHORA MISMO</div>';
      if (cur.currentStep) {
        var cs = cur.currentStep.step;
        html += '<div class="rutina-hero-time">' + cs.time + '\u2013' + cs.endTime + '</div>';
        html += '<div class="rutina-hero-who">' + badgeHtml(cs.who, false) + '</div>';
        html += '<div class="rutina-hero-name">' + cs.name + '</div>';
        if (cs.desc) html += '<div class="rutina-hero-desc">' + cs.desc + '</div>';
      } else {
        var nowM = nowMinutes();
        var firstStart = BLOCKS.length ? BLOCKS[0].startH * 60 + BLOCKS[0].startM : 0;
        var lastEnd = BLOCKS.length ? BLOCKS[BLOCKS.length - 1].endH * 60 + BLOCKS[BLOCKS.length - 1].endM : 0;
        if (nowM >= lastEnd || nowM < firstStart) {
          html += '<div class="rutina-hero-name rutina-hero-off">Durmiendo \ud83d\ude34</div>';
        } else {
          html += '<div class="rutina-hero-name rutina-hero-off">Fuera de horario</div>';
        }
      }
      if (cur.nextStep) {
        var ns = cur.nextStep.step;
        html += '<div class="rutina-hero-next">Siguiente \u00b7 <strong>' + ns.time + '</strong> \u00b7 ' + ns.name + ' ' + badgeHtml(ns.who, true) + '</div>';
      }
      html += '</div>';
    }

    // ---- Blocks ----
    for (var b = 0; b < BLOCKS.length; b++) {
      var block = BLOCKS[b];
      var isActive = b === cur.currentBlockIdx;
      html += '<div class="glass rutina-block' + (isActive && !editMode ? ' rutina-block-active' : '') + '">';
      html += '<div class="rutina-block-header">';
      html += '<div class="rutina-block-title">' + block.emoji + ' ' + block.title;
      if (block.subtitle) html += ' <span class="rutina-block-sub">' + block.subtitle + '</span>';
      html += '</div>';
      html += '<div class="rutina-block-time">' + block.timeRange + '</div>';
      html += '</div>';
      html += '<div class="rutina-steps">';
      for (var s = 0; s < block.steps.length; s++) {
        var step = block.steps[s];
        var isCurrentStep = !editMode && cur.currentStep && cur.currentStep.b === b && cur.currentStep.s === s;
        var isEditing = editMode && editingStep && editingStep.b === b && editingStep.s === s;

        if (isEditing) {
          html += renderEditForm(b, s);
        } else {
          html += '<div class="rutina-step' + (isCurrentStep ? ' rutina-step-active' : '') + (editMode ? ' rutina-step-editable' : '') + '"';
          if (editMode) html += ' data-edit-b="' + b + '" data-edit-s="' + s + '"';
          html += '>';
          html += '<div class="rutina-step-time">' + step.time + '</div>';
          html += badgeHtml(step.who, false);
          html += '<div class="rutina-step-body">';
          html += '<div class="rutina-step-name">' + step.name + '</div>';
          if (step.desc) html += '<div class="rutina-step-desc">' + step.desc + '</div>';
          html += '</div></div>';
        }
      }
      html += '</div></div>';
    }

    // ---- Las 3 Claves ----
    html += '<div class="glass rutina-claves">';
    html += '<div class="rutina-claves-title">\ud83d\udd11 Las 3 claves</div>';
    html += '<ol class="rutina-claves-list">';
    for (var i = 0; i < CLAVES.length; i++) {
      html += '<li>' + CLAVES[i] + '</li>';
    }
    html += '</ol></div>';

    section.innerHTML = html;

    // ---- Bind events ----
    // Edit mode toggle
    document.getElementById('rutina-edit-toggle').addEventListener('click', function() {
      editMode = !editMode;
      editingStep = null;
      render();
    });

    // Click step to edit (in edit mode)
    if (editMode) {
      section.querySelectorAll('.rutina-step-editable').forEach(function(el) {
        el.addEventListener('click', function() {
          editingStep = { b: parseInt(el.dataset.editB), s: parseInt(el.dataset.editS) };
          render();
        });
      });

      // Save/cancel form
      var form = section.querySelector('.rutina-edit-form');
      if (form) {
        form.querySelector('.rutina-edit-save').addEventListener('click', function() {
          var bi = parseInt(form.dataset.b);
          var si = parseInt(form.dataset.s);
          var step = BLOCKS[bi].steps[si];
          form.querySelectorAll('.rutina-edit-input').forEach(function(input) {
            var field = input.dataset.field;
            step[field] = input.value;
          });
          recalcBlock(BLOCKS[bi]);
          editingStep = null;
          saveLocal();
          pushToSupabase();
          render();
        });
        form.querySelector('.rutina-edit-cancel').addEventListener('click', function() {
          editingStep = null;
          render();
        });
      }
    }

    // Re-render every minute to keep "now" accurate (only when not editing)
    if (!editMode) {
      setTimeout(render, 60 * 1000);
    }
  }

  function init() {
    // Load from local cache first, then pull from Supabase
    if (!loadLocal()) {
      BLOCKS = JSON.parse(JSON.stringify(DEFAULT_BLOCKS));
      CLAVES = DEFAULT_CLAVES.slice();
    }
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', function() {
    pullFromSupabase();
  });

  // Expose for Resumen banners
  window.getLeoCurrentStep = function() {
    if (!BLOCKS.length) return null;
    var result = findCurrent();
    var nowM = nowMinutes();
    var firstStart = BLOCKS[0].startH * 60 + BLOCKS[0].startM;
    var lastEnd = BLOCKS[BLOCKS.length - 1].endH * 60 + BLOCKS[BLOCKS.length - 1].endM;
    result.isSleeping = (nowM >= lastEnd || nowM < firstStart);
    return result;
  };
  window.LEO_WHO_LABELS = WHO_LABELS;
})();
