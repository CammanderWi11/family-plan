// ========== RUTINA DE LEO ==========
(function() {

  var BLOCKS = [
    {
      id: 'manana',
      title: 'Ma\xf1ana',
      emoji: '\u2600\ufe0f',
      timeRange: '7:30\u201312:30',
      startH: 7, startM: 30,
      endH: 12, endM: 30,
      steps: [
        { time: '7:30', endTime: '8:00',   who: 'granma', name: 'Despertar',             desc: 'Duerme con \xe9l \xb7 5 min de mimos en la cama' },
        { time: '8:00', endTime: '8:30',   who: 'granma', name: 'Desayuno',              desc: 'Sentado \xb7 sin pantallas \xb7 opciones fijas' },
        { time: '8:30', endTime: '10:00',  who: 'granma', name: 'Juego tranquilo en casa', desc: '' },
        { time: '10:00', endTime: '12:00', who: 'daddey', name: 'Parque / playa \ud83c\udfd6',  desc: 'Clave para la siesta \xb7 Snack fruta 11:00' },
        { time: '11:30', endTime: '12:30', who: 'mum',    name: 'Prepara la comida',     desc: '' }
      ]
    },
    {
      id: 'mediodia',
      title: 'Mediod\xeda \xb7 Siesta',
      emoji: '\ud83c\udf7d',
      timeRange: '12:30\u201316:15',
      startH: 12, startM: 30,
      endH: 16, endM: 15,
      steps: [
        { time: '12:30', endTime: '13:00', who: 'daddey', name: 'Da de comer a Leo',    desc: '' },
        { time: '13:00', endTime: '13:15', who: 'daddey', name: 'Transici\xf3n tranquila', desc: '' },
        { time: '13:15', endTime: '13:30', who: 'daddey', name: 'Ritual siesta',         desc: 'Pa\xf1al \u2192 cuento \u2192 luz baja \u2192 cama' },
        { time: '13:30', endTime: '15:30', who: 'ancla',  name: 'Siesta \ud83d\udca4',           desc: 'm\xe1x. 2h \xb7 si pasa de 2h, despertarlo' },
        { time: '15:45', endTime: '16:15', who: 'ancla',  name: 'Merienda \ud83c\udf4e',         desc: 'Fruta + l\xe1cteo o bocadillo' }
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
        { time: '19:00', endTime: '19:30', who: 'mum',    name: '\ud83d\udc97 15 min \u201csolo Mum y t\xfa\u201d', desc: 'Sin beb\xe9, sin m\xf3vil \xb7 ant\xeddoto celos' }
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
        { time: '19:30', endTime: '20:00', who: 'mum', name: 'Cena en familia',   desc: 'Daddey con el beb\xe9 cerca' },
        { time: '20:00', endTime: '20:20', who: 'mum', name: 'Ba\xf1o \ud83d\udec1',         desc: 'Daddey ayuda a sacarlo si duele' },
        { time: '20:20', endTime: '20:30', who: 'mum', name: 'Ritual cama',       desc: 'Pijama \u2192 cuentos \u2192 canci\xf3n' },
        { time: '20:30', endTime: '21:00', who: 'mum', name: 'A dormir \ud83d\udca4',       desc: '' }
      ]
    }
  ];

  var CLAVES = [
    'Anclas fijas, medio flexible. Despertar, comida, siesta, cena y cama siempre a la misma hora.',
    '15 min solo Mum y Leo antes de cenar. Sin beb\xe9, sin m\xf3vil. Ant\xeddoto celos.',
    'Si se rompe un d\xeda, no lo recuper\xe9is. Volved a la siguiente ancla y seguid.'
  ];

  var WHO_LABELS = { daddey: 'Daddey', mum: 'Mum', granma: 'Granma-Tere', ancla: 'Ancla fija' };

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
          // find next
          for (var nb = b, ns = s + 1; nb < BLOCKS.length; nb++, ns = 0) {
            for (; ns < BLOCKS[nb].steps.length; ns++) {
              nextStepRef = { b: nb, s: ns, step: BLOCKS[nb].steps[ns] };
              break outer; // eslint-disable-line no-labels
            }
          }
          found = true;
          break outer; // eslint-disable-line no-labels
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

  function render() {
    var section = document.getElementById('rutina');
    if (!section) return;

    var cur = findCurrent();
    var html = '';

    // ---- Hero ----
    html += '<div class="glass rutina-hero">';
    html += '<div class="rutina-hero-label">AHORA MISMO</div>';
    if (cur.currentStep) {
      var cs = cur.currentStep.step;
      html += '<div class="rutina-hero-time">' + cs.time + '\u2013' + cs.endTime + '</div>';
      html += '<div class="rutina-hero-who">' + badgeHtml(cs.who, false) + '</div>';
      html += '<div class="rutina-hero-name">' + cs.name + '</div>';
      if (cs.desc) html += '<div class="rutina-hero-desc">' + cs.desc + '</div>';
    } else {
      html += '<div class="rutina-hero-name rutina-hero-off">Fuera de horario</div>';
    }
    if (cur.nextStep) {
      var ns = cur.nextStep.step;
      html += '<div class="rutina-hero-next">Siguiente \u00b7 <strong>' + ns.time + '</strong> \u00b7 ' + ns.name + ' ' + badgeHtml(ns.who, true) + '</div>';
    }
    html += '</div>';

    // ---- Blocks ----
    for (var b = 0; b < BLOCKS.length; b++) {
      var block = BLOCKS[b];
      var isActive = b === cur.currentBlockIdx;
      html += '<div class="glass rutina-block' + (isActive ? ' rutina-block-active' : '') + '">';
      html += '<div class="rutina-block-header">';
      html += '<div class="rutina-block-title">' + block.emoji + ' ' + block.title;
      if (block.subtitle) html += ' <span class="rutina-block-sub">' + block.subtitle + '</span>';
      html += '</div>';
      html += '<div class="rutina-block-time">' + block.timeRange + '</div>';
      html += '</div>';
      html += '<div class="rutina-steps">';
      for (var s = 0; s < block.steps.length; s++) {
        var step = block.steps[s];
        var isCurrentStep = cur.currentStep && cur.currentStep.b === b && cur.currentStep.s === s;
        html += '<div class="rutina-step' + (isCurrentStep ? ' rutina-step-active' : '') + '">';
        html += '<div class="rutina-step-time">' + step.time + '</div>';
        html += badgeHtml(step.who, false);
        html += '<div class="rutina-step-body">';
        html += '<div class="rutina-step-name">' + step.name + '</div>';
        if (step.desc) html += '<div class="rutina-step-desc">' + step.desc + '</div>';
        html += '</div></div>';
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

    // Re-render every minute to keep "now" accurate
    setTimeout(render, 60 * 1000);
  }

  function init() { render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('auth-ready', init);

})();
