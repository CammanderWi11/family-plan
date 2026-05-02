// ========== RUTINA DATA ==========
// All scenario timetables, guidance, self-care items — pure data, no rendering.
(function() {

  var WHO_LABELS = {
    leo: 'Leo',
    luca: 'Luca',
    mum: 'Mum',
    dad: 'Daddey',
    grandma: 'Granma-Tere'
  };

  var WHO_OPTIONS = ['leo', 'luca', 'mum', 'dad', 'grandma'];

  var SCENARIOS = {};

  SCENARIOS.weekday_both = {
    id: 'weekday_both',
    label: 'Día entre semana — Ambos padres',
    roles: ['leo', 'luca', 'mum', 'dad'],
    blocks: [
      {
        id: 'manana_temprano',
        title: 'Mañana temprana',
        emoji: '☀️',
        timeRange: '6:30–9:00',
        startH: 6, startM: 30, endH: 9, endM: 0,
        steps: [
          {
            time: '6:30', endTime: '7:00',
            activities: [
              { who: 'leo', name: 'Despierta', desc: '' },
              { who: 'luca', name: 'Probably just fed', desc: 'On/off sleep' },
              { who: 'mum', name: 'Sigue en cama', desc: 'Hasta ~8am si la última toma fue a las 5–6am' },
              { who: 'dad', name: 'Con Leo', desc: 'Pañal, leche, mimos' }
            ]
          },
          {
            time: '7:00', endTime: '8:00',
            activities: [
              { who: 'leo', name: 'Desayuno con Daddey', desc: 'Avena + fruta + leche' },
              { who: 'luca', name: 'Durmiendo o comiendo', desc: '' },
              { who: 'mum', name: 'Duerme / toma en cama', desc: '' },
              { who: 'dad', name: 'Desayuno Leo + prepara bolsa guardería', desc: '' }
            ]
          },
          {
            time: '8:00', endTime: '8:45',
            activities: [
              { who: 'leo', name: 'Vestirse, juego libre', desc: '' },
              { who: 'luca', name: 'Toma + pañal + piel con piel con Dad', desc: '' },
              { who: 'mum', name: 'Desayuno alto en proteína, agua, ducha', desc: '' },
              { who: 'dad', name: 'Prep guardería', desc: '' }
            ]
          },
          {
            time: '8:45', endTime: '9:00',
            activities: [
              { who: 'leo', name: 'Guardería drop-off (Dad)', desc: '' },
              { who: 'luca', name: 'Durmiendo en porteo', desc: '' },
              { who: 'mum', name: 'Tiempo tranquilo sola', desc: '' },
              { who: 'dad', name: 'Drop-off + recado de vuelta', desc: 'Compras, farmacia' }
            ]
          }
        ]
      },
      {
        id: 'manana_guarderia',
        title: 'Ventana de guardería',
        subtitle: 'TIEMPO SAGRADO',
        emoji: '💤',
        timeRange: '9:00–14:30',
        startH: 9, startM: 0, endH: 14, endM: 30,
        steps: [
          {
            time: '9:00', endTime: '10:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Siesta con Dad o en moisés', desc: '' },
              { who: 'mum', name: 'SIESTA PROTEGIDA #1', desc: 'En cama, habitación oscura, bebé en moisés o con Dad' },
              { who: 'dad', name: 'Con Luca (otra habitación) / colada / cocina batch', desc: '' }
            ]
          },
          {
            time: '10:30', endTime: '12:00',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma, tummy time 3–5 min, piel con piel', desc: '' },
              { who: 'mum', name: 'Comer de verdad, paseo corto, respiración pelvic floor', desc: '' },
              { who: 'dad', name: 'Con Luca (tummy time) O prep comida', desc: '' }
            ]
          },
          {
            time: '12:00', endTime: '13:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma → siesta', desc: '' },
              { who: 'mum', name: 'SIESTA #2 o ducha/descanso/diario', desc: '' },
              { who: 'dad', name: 'Limpia cocina, compra, admin', desc: '' }
            ]
          },
          {
            time: '13:30', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Ventana despierto, siesta en brazos', desc: '' },
              { who: 'mum', name: 'Snack, llamada a amiga', desc: 'Contacto social protege contra PPD' },
              { who: 'dad', name: 'Libre / recados', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:30',
        startH: 14, startM: 30, endH: 17, endM: 30,
        steps: [
          {
            time: '14:30', endTime: '15:00',
            activities: [
              { who: 'leo', name: 'Recogida guardería (Dad)', desc: '+ parque 20 min de vuelta' },
              { who: 'luca', name: 'En porteo', desc: '' },
              { who: 'mum', name: 'Descanso breve', desc: '' },
              { who: 'dad', name: 'Recoge + parque', desc: '' }
            ]
          },
          {
            time: '15:00', endTime: '16:30',
            golden: true,
            activities: [
              { who: 'leo', name: 'Juego al aire libre', desc: 'Pati, jardín, ≥ 60 min activo' },
              { who: 'luca', name: 'Cluster feed / porteo / siesta en brazos', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue su juego' },
              { who: 'dad', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue el juego de Leo · Mum da pecho' }
            ]
          },
          {
            time: '16:30', endTime: '17:30',
            activities: [
              { who: 'leo', name: 'Juego tranquilo, libros, ayuda con cena', desc: '' },
              { who: 'luca', name: 'A menudo inquieto / cluster feeding', desc: '' },
              { who: 'mum', name: 'Sentada, da el pecho', desc: 'Leo ayuda trayendo paño de eructos' },
              { who: 'dad', name: 'Cocina la cena', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:30–21:30',
        startH: 17, startM: 30, endH: 21, endM: 30,
        steps: [
          {
            time: '17:30', endTime: '18:00',
            activities: [
              { who: 'leo', name: 'Cena familiar (sin pantallas)', desc: '' },
              { who: 'luca', name: 'En hamaca o durmiendo a la vista', desc: '' },
              { who: 'mum', name: 'Cena familiar', desc: '' },
              { who: 'dad', name: 'Cena familiar', desc: '' }
            ]
          },
          {
            time: '18:00', endTime: '18:30',
            activities: [
              { who: 'leo', name: 'Baño (Dad)', desc: '' },
              { who: 'luca', name: 'Mum descansa 30 min', desc: 'Descanso no negociable' },
              { who: 'mum', name: 'Té, snack, tumbarse — NO tareas', desc: '' },
              { who: 'dad', name: 'Baño + pijama Leo', desc: '' }
            ]
          },
          {
            time: '18:30', endTime: '19:00',
            activities: [
              { who: 'leo', name: 'Cuentos, dientes, nana (Dad)', desc: '' },
              { who: 'luca', name: 'Toma en habitación oscura', desc: '' },
              { who: 'mum', name: 'Da el pecho en penumbra', desc: '' },
              { who: 'dad', name: 'Rutina cama Leo', desc: '' }
            ]
          },
          {
            time: '19:00', endTime: '19:30',
            activities: [
              { who: 'leo', name: 'Dormido ≤ 19:30', desc: '' },
              { who: 'luca', name: 'Cluster feeding', desc: '' },
              { who: 'mum', name: 'Segundo snack, hidratarse', desc: '' },
              { who: 'dad', name: 'Ordena, prepara bolsa guardería mañana', desc: '' }
            ]
          },
          {
            time: '19:30', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feeding / asentando', desc: '' },
              { who: 'mum', name: 'Sofá, serie, conversación con Dad', desc: '' },
              { who: 'dad', name: 'Sofá juntos', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '21:30',
            golden: true,
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Última toma nocturna', desc: '' },
              { who: 'mum', name: 'A LA CAMA', desc: 'Empieza el Bloque de Oro' },
              { who: 'dad', name: 'Se queda con bebé / biberón ~22–23h', desc: 'Leche extraída previamente' }
            ]
          }
        ]
      },
      {
        id: 'noche_golden',
        title: 'Bloque de Oro',
        subtitle: 'SUEÑO PROTEGIDO',
        emoji: '🌟',
        timeRange: '21:30–6:30',
        startH: 21, startM: 30, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '21:30', endTime: '2:30',
            golden: true,
            activities: [
              { who: 'luca', name: '1 toma Dad da biberón ~22–23h', desc: 'O Dad cambia/calma mientras Mum duerme' },
              { who: 'mum', name: 'BLOQUE DE ORO (4–5h seguidas)', desc: 'Intervención #1 contra depresión postparto' },
              { who: 'dad', name: 'Turno de noche hasta ~2am', desc: '' }
            ]
          },
          {
            time: '2:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '1–2 tomas', desc: '' },
              { who: 'mum', name: 'Tomas nocturnas', desc: 'Bebé vuelve al moisés tras cada toma (AAP safe sleep)' },
              { who: 'dad', name: 'Duerme', desc: '' }
            ]
          }
        ]
      }
    ]
  };

  SCENARIOS.weekday_solo = {
    id: 'weekday_solo',
    label: 'Día entre semana — Mum sola',
    subtitle: 'MODO SUPERVIVENCIA',
    roles: ['leo', 'luca', 'mum'],
    blocks: [
      {
        id: 'manana',
        title: 'Mañana',
        emoji: '☀️',
        timeRange: '6:30–9:00',
        startH: 6, startM: 30, endH: 9, endM: 0,
        steps: [
          {
            time: '6:30', endTime: '7:30',
            activities: [
              { who: 'leo', name: 'Despierta, mimos en cama de Mum', desc: 'Dibujos OK 1 episodio (≤25 min) mientras Mum da pecho' },
              { who: 'luca', name: 'Toma matutina', desc: '' },
              { who: 'mum', name: 'En cama, alarma para guardería', desc: '' }
            ]
          },
          {
            time: '7:30', endTime: '8:15',
            activities: [
              { who: 'leo', name: 'Desayuno (preparado la noche anterior)', desc: 'Cereales, fruta, leche en vaso' },
              { who: 'luca', name: 'En porteo o en alfombra en cocina', desc: '' },
              { who: 'mum', name: 'Desayuno de pie; barrita proteína + agua; vitaminas', desc: '' }
            ]
          },
          {
            time: '8:15', endTime: '8:45',
            activities: [
              { who: 'leo', name: 'Vestido, dientes, zapatos', desc: 'Usar tabla visual de rutina' },
              { who: 'luca', name: 'En porteo', desc: '' },
              { who: 'mum', name: 'Prep salida', desc: '' }
            ]
          },
          {
            time: '8:45', endTime: '9:00',
            activities: [
              { who: 'leo', name: 'Guardería drop-off', desc: 'Andar si está cerca (cuenta como ejercicio)' },
              { who: 'luca', name: 'En porteo', desc: '' },
              { who: 'mum', name: 'Drop-off', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'guarderia',
        title: 'Ventana de guardería',
        subtitle: 'DEFIENDE LA SIESTA',
        emoji: '💤',
        timeRange: '9:00–14:30',
        startH: 9, startM: 0, endH: 14, endM: 30,
        steps: [
          {
            time: '9:00', endTime: '10:00',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma', desc: '' },
              { who: 'mum', name: 'A casa, DIRECTA A LA CAMA', desc: 'Móvil en no molestar excepto guardería' }
            ]
          },
          {
            time: '10:00', endTime: '11:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Duerme al lado de Mum o en moisés', desc: '' },
              { who: 'mum', name: 'DUERME — único bloque de siesta diurno', desc: 'Si no ocurre, el día fallará' }
            ]
          },
          {
            time: '11:30', endTime: '12:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma + tummy time 3–5 min en pecho de Mum', desc: '' },
              { who: 'mum', name: 'Almuerzo de verdad (preparado o delivery); 1L agua', desc: '' }
            ]
          },
          {
            time: '12:30', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma → siesta (porteo o moisés)', desc: '' },
              { who: 'mum', name: 'Ducha, paseo jardín, 1 colada máx', desc: 'NO empezar ningún proyecto' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:00',
        startH: 14, startM: 30, endH: 17, endM: 0,
        steps: [
          {
            time: '14:30', endTime: '15:00',
            activities: [
              { who: 'leo', name: 'Recogida guardería', desc: '' },
              { who: 'luca', name: 'En porteo', desc: '' },
              { who: 'mum', name: 'Snack de camino', desc: '' }
            ]
          },
          {
            time: '15:00', endTime: '16:00',
            activities: [
              { who: 'leo', name: 'Juego al aire libre / parque', desc: '' },
              { who: 'luca', name: 'Porteo o cochecito', desc: '' },
              { who: 'mum', name: 'Sentada en banco — no tienes que jugar activamente', desc: 'Leo quema energía = mejor hora de dormir' }
            ]
          },
          {
            time: '16:00', endTime: '17:00',
            golden: true,
            activities: [
              { who: 'leo', name: 'Actividades tranquilas: plastilina, libros, dibujar', desc: '' },
              { who: 'luca', name: 'En hamaca; ventana despierto', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · bebé en hamaca · sigue el juego de Leo' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:00–21:00',
        startH: 17, startM: 0, endH: 21, endM: 0,
        steps: [
          {
            time: '17:00', endTime: '17:30',
            activities: [
              { who: 'leo', name: 'Cena fácil', desc: 'Pasta+queso, huevos revueltos, sobras. Nutrición semanal, no por comida' },
              { who: 'luca', name: 'Pecho o en porteo', desc: '' },
              { who: 'mum', name: 'Come con Leo', desc: '' }
            ]
          },
          {
            time: '17:30', endTime: '18:00',
            activities: [
              { who: 'leo', name: 'Baño (skip si agotada — esponja vale)', desc: '' },
              { who: 'luca', name: 'Hamaca en puerta baño, Mum canta a ambos', desc: '' },
              { who: 'mum', name: 'Canta/habla durante todo', desc: '' }
            ]
          },
          {
            time: '18:00', endTime: '18:30',
            activities: [
              { who: 'leo', name: 'Cuentos en su habitación, nana', desc: '' },
              { who: 'luca', name: 'En porteo (calma bebé + manos libres)', desc: 'El porteo es tu herramienta #1 para días sola' },
              { who: 'mum', name: 'Cuentos + nana', desc: '' }
            ]
          },
          {
            time: '18:30', endTime: '19:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feeding empieza', desc: '' },
              { who: 'mum', name: 'Sofá + pecho', desc: '' }
            ]
          },
          {
            time: '19:00', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Pico de cluster feeding', desc: 'Tomas cada 30–60 min — esto es NORMAL' },
              { who: 'mum', name: 'Sofá, pecho, cena #2, 1 serie, NO lavar platos', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '21:30',
            golden: true,
            activities: [
              { who: 'luca', name: 'Cluster feeding baja', desc: '' },
              { who: 'mum', name: 'A LA CAMA cuando bebé hace tramo largo', desc: 'Normalmente 21–23h. Dormir cuando duerme el bebé, aunque haya platos' }
            ]
          }
        ]
      },
      {
        id: 'noche_sleep',
        title: 'Noche',
        emoji: '🌟',
        timeRange: '21:30–6:30',
        startH: 21, startM: 30, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '21:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '2–3 tomas', desc: '' },
              { who: 'mum', name: 'Dar pecho tumbada, bebé vuelve al moisés', desc: 'No mires el reloj nunca' }
            ]
          }
        ]
      }
    ]
  };

  SCENARIOS.weekday_grandma = {
    id: 'weekday_grandma',
    label: 'Día entre semana — Mum + Granma-Tere',
    roles: ['leo', 'luca', 'mum', 'grandma'],
    blocks: [
      {
        id: 'manana',
        title: 'Mañana',
        emoji: '☀️',
        timeRange: '6:00–9:00',
        startH: 6, startM: 0, endH: 9, endM: 0,
        steps: [
          {
            time: '6:00', endTime: '7:00',
            activities: [
              { who: 'leo', name: 'Durmiendo / despertando', desc: '' },
              { who: 'luca', name: 'Toma matutina', desc: '' },
              { who: 'mum', name: 'SIGUE EN CAMA (Granma tiene la mañana)', desc: '' },
              { who: 'grandma', name: 'Levantada con Leo, actividad tranquila, desayuno', desc: '' }
            ]
          },
          {
            time: '7:00', endTime: '8:30',
            activities: [
              { who: 'leo', name: 'Desayuno, vestido, dientes, bolsa guardería', desc: '' },
              { who: 'luca', name: 'Con Mum, toma en cama', desc: '' },
              { who: 'mum', name: 'Da pecho en cama; desayuno subido', desc: '' },
              { who: 'grandma', name: 'Rutina matutina Leo', desc: '' }
            ]
          },
          {
            time: '8:30', endTime: '9:00',
            activities: [
              { who: 'leo', name: 'Guardería drop-off (Granma)', desc: '' },
              { who: 'luca', name: 'Con Mum', desc: '' },
              { who: 'mum', name: 'Piel con piel en cama', desc: '' },
              { who: 'grandma', name: 'Drop-off, compra pan/café de vuelta', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'guarderia',
        title: 'Ventana guardería',
        subtitle: 'MEJOR SUEÑO DE LA SEMANA',
        emoji: '💤',
        timeRange: '9:00–14:30',
        startH: 9, startM: 0, endH: 14, endM: 30,
        steps: [
          {
            time: '9:00', endTime: '11:00',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma → siesta con Granma', desc: '' },
              { who: 'mum', name: 'SIESTA LARGA PROTEGIDA', desc: 'Sin niño pequeño en casa, sin obligaciones' },
              { who: 'grandma', name: 'Platos, colada, orden silencioso; sostiene a Luca', desc: 'NO aspirar ni hacer ruido que despierte a Mum' }
            ]
          },
          {
            time: '11:00', endTime: '13:00',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma; ventana despierto con mimos Granma (piel con piel)', desc: '' },
              { who: 'mum', name: 'Brunch/almuerzo temprano; llamada a amiga o 10 min fuera', desc: '' },
              { who: 'grandma', name: 'Sostiene bebé para siesta en brazos; prep almuerzo', desc: '' }
            ]
          },
          {
            time: '13:00', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'En guardería', desc: '' },
              { who: 'luca', name: 'Toma → siesta', desc: '' },
              { who: 'mum', name: 'SEGUNDA SIESTA o descanso', desc: '' },
              { who: 'grandma', name: 'Tareas domésticas tranquilas; lee, jardín', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:00',
        startH: 14, startM: 30, endH: 17, endM: 0,
        steps: [
          {
            time: '14:30', endTime: '15:00',
            activities: [
              { who: 'leo', name: 'Recogida guardería (Granma)', desc: '+ parque breve' },
              { who: 'luca', name: 'Porteo con Mum o Granma', desc: '' },
              { who: 'mum', name: 'Té + snack', desc: '' },
              { who: 'grandma', name: 'Recoge + parque', desc: '' }
            ]
          },
          {
            time: '15:00', endTime: '17:00',
            golden: true,
            activities: [
              { who: 'leo', name: 'Juego exterior + interior', desc: '' },
              { who: 'luca', name: 'Cluster feed con Mum', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue su juego' },
              { who: 'grandma', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue el juego de Leo · Mum da pecho' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:00–22:00',
        startH: 17, startM: 0, endH: 22, endM: 0,
        steps: [
          {
            time: '17:00', endTime: '18:00',
            activities: [
              { who: 'leo', name: 'Cena cocida por Granma', desc: '' },
              { who: 'luca', name: 'A menudo inquieto; porteo', desc: '' },
              { who: 'mum', name: 'Sentada a la mesa, come con las dos manos', desc: '' },
              { who: 'grandma', name: 'Cocina; come con familia', desc: '' }
            ]
          },
          {
            time: '18:00', endTime: '19:00',
            activities: [
              { who: 'leo', name: 'Baño (Granma) + cuentos (Mum)', desc: 'Granma baño, Mum libros + nana (preserva apego)' },
              { who: 'luca', name: 'Mum da pecho durante cuentos', desc: '' },
              { who: 'mum', name: 'Cuentos + nana con Leo', desc: '' },
              { who: 'grandma', name: 'Baño Leo, luego limpia cocina', desc: '' }
            ]
          },
          {
            time: '19:00', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feeding nocturno', desc: '' },
              { who: 'mum', name: 'Sofá con Granma; charla, comer, hidratar', desc: '' },
              { who: 'grandma', name: 'Sofá con Mum', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '22:00',
            golden: true,
            activities: [
              { who: 'luca', name: 'Última toma grande', desc: '' },
              { who: 'mum', name: 'A CAMA 21–21:30', desc: '' },
              { who: 'grandma', name: 'Se queda; biberón ~22:30 si Mum ha extraído', desc: 'Lleva bebé a Mum a las 2–3am' }
            ]
          }
        ]
      },
      {
        id: 'noche_golden',
        title: 'Bloque de Oro',
        subtitle: 'SUEÑO PROTEGIDO',
        emoji: '🌟',
        timeRange: '22:00–6:30',
        startH: 22, startM: 0, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '22:00', endTime: '2:30',
            golden: true,
            activities: [
              { who: 'luca', name: '1 toma Granma con biberón o calma/cambia para acortar despertares', desc: '' },
              { who: 'mum', name: 'BLOQUE DE ORO', desc: '' },
              { who: 'grandma', name: 'Turno de noche (1 toma/cambio)', desc: '' }
            ]
          },
          {
            time: '2:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '1–2 tomas', desc: '' },
              { who: 'mum', name: 'Tomas nocturnas', desc: '' },
              { who: 'grandma', name: 'Duerme', desc: '' }
            ]
          }
        ]
      }
    ]
  };

  SCENARIOS.weekend_both = {
    id: 'weekend_both',
    label: 'Fin de semana — Ambos padres',
    roles: ['leo', 'luca', 'mum', 'dad'],
    blocks: [
      {
        id: 'manana',
        title: 'Mañana',
        emoji: '☀️',
        timeRange: '6:30–12:30',
        startH: 6, startM: 30, endH: 12, endM: 30,
        steps: [
          {
            time: '6:30', endTime: '8:00',
            activities: [
              { who: 'leo', name: 'Despierta, desayuno lento, dibujos OK 20 min', desc: '' },
              { who: 'luca', name: 'Toma matutina', desc: '' },
              { who: 'mum', name: 'En cama; da pecho; Dad sube desayuno', desc: '' },
              { who: 'dad', name: 'Desayuno con Leo', desc: '' }
            ]
          },
          {
            time: '8:00', endTime: '10:00',
            activities: [
              { who: 'leo', name: 'Actividad exterior (parque, jardín, paseo)', desc: '≥ 60 min actividad física' },
              { who: 'luca', name: 'En cochecito o porteo', desc: '' },
              { who: 'mum', name: 'Vuelve a cama O se une según energía', desc: 'Fines de semana con poco sueño: cama' },
              { who: 'dad', name: 'Solo con Leo fuera', desc: '' }
            ]
          },
          {
            time: '10:00', endTime: '11:30',
            activities: [
              { who: 'leo', name: 'Casa; snack; juego tranquilo', desc: '' },
              { who: 'luca', name: 'Toma → ventana despierto', desc: '' },
              { who: 'mum', name: 'Brunch (sentada, comida real); piel con piel', desc: '' },
              { who: 'dad', name: 'Ordena; prep almuerzo', desc: '' }
            ]
          },
          {
            time: '11:30', endTime: '12:30',
            activities: [
              { who: 'leo', name: 'Almuerzo; bajar ritmo', desc: '' },
              { who: 'luca', name: 'Toma', desc: '' },
              { who: 'mum', name: 'Almuerzo familiar', desc: '' },
              { who: 'dad', name: 'Almuerzo + prep siesta', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'siesta',
        title: 'Siesta familiar',
        subtitle: 'HORA SAGRADA',
        emoji: '💤',
        timeRange: '12:30–14:30',
        startH: 12, startM: 30, endH: 14, endM: 30,
        steps: [
          {
            time: '12:30', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'Siesta (1.5–2h)', desc: '' },
              { who: 'luca', name: 'Toma → siesta en brazos', desc: '' },
              { who: 'mum', name: 'DUERME con bebé en moisés al lado', desc: '' },
              { who: 'dad', name: 'Descansa / hobby tranquilo / 1 tarea', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:30',
        startH: 14, startM: 30, endH: 17, endM: 30,
        steps: [
          {
            time: '14:30', endTime: '16:00',
            golden: true,
            activities: [
              { who: 'leo', name: 'Despierta, snack, juego exterior / biblioteca / amigos', desc: '' },
              { who: 'luca', name: 'Porteo; ventana despierto', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue su juego' },
              { who: 'dad', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue el juego de Leo · Mum da pecho' }
            ]
          },
          {
            time: '16:00', endTime: '17:30',
            activities: [
              { who: 'leo', name: 'Interior tranquilo', desc: '' },
              { who: 'luca', name: 'Cluster-feed', desc: '' },
              { who: 'mum', name: 'Pecho; descansa', desc: '' },
              { who: 'dad', name: 'Cocina; ordena', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:30–21:30',
        startH: 17, startM: 30, endH: 21, endM: 30,
        steps: [
          {
            time: '17:30', endTime: '18:30',
            activities: [
              { who: 'leo', name: 'Cena familiar; baño', desc: '' },
              { who: 'luca', name: 'Hamaca / porteo', desc: '' },
              { who: 'mum', name: 'Cena familiar', desc: '' },
              { who: 'dad', name: 'Baño Leo', desc: '' }
            ]
          },
          {
            time: '18:30', endTime: '19:15',
            activities: [
              { who: 'leo', name: 'Rutina cama (alternar padres)', desc: '' },
              { who: 'luca', name: 'Mum da pecho simultáneamente', desc: '' },
              { who: 'mum', name: 'Cuentos + nana O pecho mientras Dad hace rutina', desc: '' },
              { who: 'dad', name: 'Rutina cama Leo O turno bebé', desc: '' }
            ]
          },
          {
            time: '19:15', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feed', desc: '' },
              { who: 'mum', name: 'Como Scenario A entre semana noche', desc: '' },
              { who: 'dad', name: 'Sofá juntos', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '21:30',
            golden: true,
            activities: [
              { who: 'luca', name: 'Última toma', desc: '' },
              { who: 'mum', name: 'A LA CAMA 21:30', desc: '' },
              { who: 'dad', name: 'Biberón ~22:30', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche_golden',
        title: 'Bloque de Oro',
        subtitle: 'SUEÑO PROTEGIDO',
        emoji: '🌟',
        timeRange: '21:30–6:30',
        startH: 21, startM: 30, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '21:30', endTime: '2:30',
            golden: true,
            activities: [
              { who: 'luca', name: '1 toma Dad biberón ~22–23h', desc: '' },
              { who: 'mum', name: 'BLOQUE DE ORO', desc: '' },
              { who: 'dad', name: 'Turno noche hasta ~2am', desc: '' }
            ]
          },
          {
            time: '2:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '1–2 tomas', desc: '' },
              { who: 'mum', name: 'Tomas nocturnas', desc: '' },
              { who: 'dad', name: 'Duerme', desc: '' }
            ]
          }
        ]
      }
    ]
  };

  SCENARIOS.weekend_solo = {
    id: 'weekend_solo',
    label: 'Fin de semana — Mum sola',
    subtitle: 'MÁXIMA TENSIÓN — PILAR 1: SALIR + PILAR 2: SIESTA',
    roles: ['leo', 'luca', 'mum'],
    blocks: [
      {
        id: 'manana',
        title: 'Mañana',
        emoji: '☀️',
        timeRange: '6:30–12:30',
        startH: 6, startM: 30, endH: 12, endM: 30,
        steps: [
          {
            time: '6:30', endTime: '8:00',
            activities: [
              { who: 'leo', name: 'Despertar lento; desayuno; dibujos OK 25 min', desc: '' },
              { who: 'luca', name: 'Toma matutina', desc: '' },
              { who: 'mum', name: 'Da pecho en cama; desayuno en bandeja; vitaminas', desc: '' }
            ]
          },
          {
            time: '8:00', endTime: '10:30',
            activities: [
              { who: 'leo', name: 'SALIR DE CASA. Parque, biblioteca, amigos, soft-play', desc: 'La hora más difícil; una vez fuera es más fácil' },
              { who: 'luca', name: 'Cochecito o porteo', desc: '' },
              { who: 'mum', name: 'Llama a amiga para quedar', desc: 'Contacto social = protección contra PPD' }
            ]
          },
          {
            time: '10:30', endTime: '11:30',
            activities: [
              { who: 'leo', name: 'Casa; snack; juego tranquilo', desc: '' },
              { who: 'luca', name: 'Toma', desc: '' },
              { who: 'mum', name: 'Sentarse; comer; agua', desc: '' }
            ]
          },
          {
            time: '11:30', endTime: '12:30',
            activities: [
              { who: 'leo', name: 'Almuerzo; cuento para bajar ritmo', desc: '' },
              { who: 'luca', name: 'Toma', desc: '' },
              { who: 'mum', name: 'Almuerzo junto a Leo', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'siesta',
        title: 'Siesta',
        subtitle: 'PILAR 2 — SIEMPRE DORMIR AQUÍ',
        emoji: '💤',
        timeRange: '12:30–14:30',
        startH: 12, startM: 30, endH: 14, endM: 30,
        steps: [
          {
            time: '12:30', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'Siesta (1.5–2h)', desc: '' },
              { who: 'luca', name: 'Moisés al lado de Mum', desc: '' },
              { who: 'mum', name: 'DUERME. Aunque sean 45 min cuenta', desc: 'Si bebé no se calma, siesta en brazos en sofá' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:30',
        startH: 14, startM: 30, endH: 17, endM: 30,
        steps: [
          {
            time: '14:30', endTime: '16:30',
            activities: [
              { who: 'leo', name: 'Despierta, snack, exterior otra vez o interior tranquilo', desc: '' },
              { who: 'luca', name: 'Porteo; ventana despierto con Leo', desc: '' },
              { who: 'mum', name: 'Sentada en banco. No le debes a nadie una tarde de Instagram', desc: '' }
            ]
          },
          {
            time: '16:30', endTime: '17:30',
            activities: [
              { who: 'leo', name: '"Cena TV" OK: 30 min serie + plato en bandeja', desc: '' },
              { who: 'luca', name: 'Cluster-feed; Mum en sofá', desc: '' },
              { who: 'mum', name: 'Come con Leo; no luches contra el cluster feed', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:30–21:00',
        startH: 17, startM: 30, endH: 21, endM: 0,
        steps: [
          {
            time: '17:30', endTime: '18:30',
            golden: true,
            activities: [
              { who: 'leo', name: 'Baño (skip si agotada); pijamas', desc: '' },
              { who: 'luca', name: 'Hamaca durante cuentos', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Cuentos en pijama · sin móvil · sigue el juego / historia de Leo' }
            ]
          },
          {
            time: '18:30', endTime: '19:00',
            activities: [
              { who: 'leo', name: 'Dormido ≤ 19:00', desc: '' },
              { who: 'luca', name: 'Cluster feeding', desc: '' },
              { who: 'mum', name: 'Sofá; pecho; cena #2', desc: '' }
            ]
          },
          {
            time: '19:00', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feed', desc: '' },
              { who: 'mum', name: '1 serie; llamar a Dad si puede; EN CAMA 21–21:30', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '21:30',
            golden: true,
            activities: [
              { who: 'luca', name: 'Tramo largo empieza', desc: '' },
              { who: 'mum', name: 'A LA CAMA', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche_sleep',
        title: 'Noche',
        emoji: '🌟',
        timeRange: '21:30–6:30',
        startH: 21, startM: 30, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '21:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '2–3 tomas', desc: '' },
              { who: 'mum', name: 'Pecho tumbada, bebé vuelve al moisés (AAP safe sleep)', desc: '' }
            ]
          }
        ]
      }
    ]
  };

  SCENARIOS.weekend_grandma = {
    id: 'weekend_grandma',
    label: 'Fin de semana — Mum + Granma-Tere',
    roles: ['leo', 'luca', 'mum', 'grandma'],
    blocks: [
      {
        id: 'manana',
        title: 'Mañana',
        emoji: '☀️',
        timeRange: '6:30–12:30',
        startH: 6, startM: 30, endH: 12, endM: 30,
        steps: [
          {
            time: '6:30', endTime: '8:00',
            activities: [
              { who: 'leo', name: 'Despierta; mañana tranquila con Granma', desc: '' },
              { who: 'luca', name: 'Toma en cama de Mum', desc: '' },
              { who: 'mum', name: 'Toma relajada en cama', desc: '' },
              { who: 'grandma', name: 'Desayuno Leo, vestirlo', desc: '' }
            ]
          },
          {
            time: '8:00', endTime: '11:00',
            activities: [
              { who: 'leo', name: 'Salida con Granma (parque, piscina, amigas de Granma)', desc: '' },
              { who: 'luca', name: 'Cochecito/porteo con Mum en casa O Granma se lo lleva', desc: '' },
              { who: 'mum', name: 'DESCANSO LARGO MAÑANA EN CASA con bebé', desc: '' },
              { who: 'grandma', name: 'Dueña de la salida con Leo', desc: '' }
            ]
          },
          {
            time: '11:00', endTime: '12:30',
            activities: [
              { who: 'leo', name: 'Casa; almuerzo', desc: '' },
              { who: 'luca', name: 'Toma', desc: '' },
              { who: 'mum', name: 'Brunch; piel con piel', desc: '' },
              { who: 'grandma', name: 'Cocina almuerzo; ordena', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'siesta',
        title: 'Siesta',
        emoji: '💤',
        timeRange: '12:30–14:30',
        startH: 12, startM: 30, endH: 14, endM: 30,
        steps: [
          {
            time: '12:30', endTime: '14:30',
            activities: [
              { who: 'leo', name: 'Siesta', desc: '' },
              { who: 'luca', name: 'Siesta en brazos de Granma', desc: '' },
              { who: 'mum', name: 'DUERME', desc: '' },
              { who: 'grandma', name: 'Sostiene a Luca; tranquila; lee', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'tarde',
        title: 'Tarde',
        emoji: '🌳',
        timeRange: '14:30–17:00',
        startH: 14, startM: 30, endH: 17, endM: 0,
        steps: [
          {
            time: '14:30', endTime: '17:00',
            golden: true,
            activities: [
              { who: 'leo', name: 'Juego activo; proyecto con Granma (cocinar, jardín)', desc: '' },
              { who: 'luca', name: 'Porteo con Mum; ventana despierto', desc: '' },
              { who: 'mum', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue su juego' },
              { who: 'grandma', name: '💜 15 min Regla de Conexión', desc: 'Sin móvil · sin bebé · sigue el juego de Leo · Mum da pecho' }
            ]
          }
        ]
      },
      {
        id: 'noche',
        title: 'Noche',
        emoji: '🌙',
        timeRange: '17:00–22:00',
        startH: 17, startM: 0, endH: 22, endM: 0,
        steps: [
          {
            time: '17:00', endTime: '18:30',
            activities: [
              { who: 'leo', name: 'Cena (Granma cocina); baño', desc: '' },
              { who: 'luca', name: 'Pecho en sofá', desc: '' },
              { who: 'mum', name: 'Come sentada', desc: '' },
              { who: 'grandma', name: 'Cocina + ayuda baño', desc: '' }
            ]
          },
          {
            time: '18:30', endTime: '19:00',
            activities: [
              { who: 'leo', name: 'Rutina cama (MUM)', desc: 'Preserva apego' },
              { who: 'luca', name: 'Granma lo lleva', desc: '' },
              { who: 'mum', name: 'Cuentos + nana con Leo', desc: '' },
              { who: 'grandma', name: 'Limpia cocina', desc: '' }
            ]
          },
          {
            time: '19:00', endTime: '21:00',
            activities: [
              { who: 'leo', name: 'Dormido', desc: '' },
              { who: 'luca', name: 'Cluster feed', desc: '' },
              { who: 'mum', name: 'Sofá con Granma', desc: '' },
              { who: 'grandma', name: 'Sofá con Mum', desc: '' }
            ]
          },
          {
            time: '21:00', endTime: '22:00',
            golden: true,
            activities: [
              { who: 'luca', name: 'Última toma', desc: '' },
              { who: 'mum', name: 'A cama a las 21', desc: '' },
              { who: 'grandma', name: 'Biberón a las 22:30', desc: '' }
            ]
          }
        ]
      },
      {
        id: 'noche_golden',
        title: 'Bloque de Oro',
        subtitle: 'SUEÑO PROTEGIDO',
        emoji: '🌟',
        timeRange: '22:00–6:30',
        startH: 22, startM: 0, endH: 6, endM: 30,
        golden: true,
        steps: [
          {
            time: '22:00', endTime: '2:30',
            golden: true,
            activities: [
              { who: 'luca', name: '1 toma Granma', desc: '' },
              { who: 'mum', name: 'BLOQUE DE ORO', desc: '' },
              { who: 'grandma', name: 'Turno noche', desc: '' }
            ]
          },
          {
            time: '2:30', endTime: '6:30',
            activities: [
              { who: 'luca', name: '1–2 tomas', desc: '' },
              { who: 'mum', name: 'Tomas nocturnas', desc: '' },
              { who: 'grandma', name: 'Duerme', desc: '' }
            ]
          }
        ]
      }
    ]
  };

  var GUIDANCE = [
    {
      id: 'cluster-feed',
      title: 'Cluster feeding — la hora bruja',
      content: 'Las tomas agrupadas de 18:00–22:00 son normales a las 2–3 semanas. Coinciden con el primer espirón de crecimiento y ayudan a establecer la producción. No intentes espaciarlas. Aceptar es más fácil que luchar.',
      timeStart: '17:00',
      timeEnd: '22:00',
      scenarios: ['all'],
      icon: '🍼'
    },
    {
      id: 'toddler-bedtime-tip',
      title: 'Tip: Leo y pecho simultáneo',
      content: 'Portea al bebé durante baño y cuentos de Leo. Si estás sola: prepara baño/cena antes de las 17h. Baja luces desde las 17:30, audiolibro para Leo en su cuarto mientras das pecho.',
      timeStart: '17:30',
      timeEnd: '19:00',
      scenarios: ['all'],
      icon: '💡'
    },
    {
      id: 'wake-window',
      title: 'Ventanas de vigilia del bebé',
      content: 'A las 2 semanas: 30–60 min despierto (la toma cuenta). Si lleva ≥60 min despierto, probablemente esté listo para dormir. Señales: bostezos, mirada perdida, puños cerrados.',
      timeStart: '7:00',
      timeEnd: '21:00',
      scenarios: ['all'],
      icon: '⏰'
    },
    {
      id: 'safe-sleep',
      title: 'Recordatorio sueño seguro',
      content: 'Solo, Boca arriba, Cuna vacía. Compartir habitación sí, compartir cama no. Superficie firme y plana. Sin gorros, sin mantas, sin cojines. Chupete al dormir reduce SMSL.',
      timeStart: '19:00',
      timeEnd: '22:00',
      scenarios: ['all'],
      icon: '🛡️'
    },
    {
      id: 'dad-reentry',
      title: 'Dad vuelve de viaje',
      content: '3 reglas: (1) Dad se ducha/descomprime 1h antes de "entrar en servicio". (2) Primera noche: Dad hace biberón 22:30 aunque tenga jet lag. (3) Leo puede rechazar a Dad el día 1 — es normal, se arregla con 15 min de juego dirigido, no intentando hacer la rutina de cama.',
      timeStart: '14:00',
      timeEnd: '20:00',
      scenarios: ['weekday_both', 'weekend_both'],
      icon: '✈️'
    },
    {
      id: 'toddler-regression',
      title: 'Si Leo pega al bebé o actúa raro',
      content: 'Es ajuste normal de hermanos (2–8 semanas). No castigues. Responde: (1) protege al bebé, voz calmada, "somos suaves"; (2) nombra el sentimiento de Leo ("es difícil cuando Mum alimenta al bebé"); (3) aumenta tiempo 1:1 al día siguiente. Consulta pediatra si dura >8 semanas.',
      timeStart: '7:00',
      timeEnd: '21:00',
      scenarios: ['all'],
      icon: '🧡'
    },
    {
      id: 'survival-mode',
      title: 'Permiso para bajar el listón',
      content: 'Platos desechables un día a la semana si hace falta. Compra online. Acepta cualquier comida que ofrezca un amigo. Un día de más pantallas no daña a Leo; una Mum agotada y desregulada sí es un riesgo real.',
      timeStart: '7:00',
      timeEnd: '21:00',
      scenarios: ['weekday_solo', 'weekend_solo'],
      icon: '📝'
    },
    {
      id: 'boredom-box',
      title: 'Caja de aburrimiento para Leo',
      content: 'Actividades nuevas solo para cuando Mum da pecho: pegatinas, washi tape en el suelo, azulejos magnéticos. Ábrela solo en esos momentos para que mantenga la novedad.',
      timeStart: '15:00',
      timeEnd: '19:00',
      scenarios: ['weekday_solo', 'weekend_solo'],
      icon: '📦'
    },
    {
      id: 'connection-rule',
      title: '💜 Regla de Conexión — 15 min cada adulto',
      content: 'La protección más eficaz contra la regresión por hermano nuevo. Cada adulto presente da a Leo 10–15 min de juego dirigido por él: sin móvil, sin bebé, sin agenda adulta. El adulto sigue y obedece — Leo manda. Evidencia sólida en psicología del apego y estudios de hermanos (Dunn & Kendrick, 1982; Kramer, 2010). No es opcional.',
      timeStart: '14:00',
      timeEnd: '19:00',
      scenarios: ['all'],
      icon: '💜'
    }
  ];

  var SELF_CARE_ITEMS = [
    { id: 'nap', label: 'Siesta ≥45min', icon: '😴', frequency: 'daily', reminderTime: '09:30', reminderText: 'Ventana de guardería abierta — hora de tu siesta protegida' },
    { id: 'walk', label: 'Paseo + luz exterior', icon: '☀️', frequency: 'daily', reminderTime: '10:30', reminderText: '¿Has salido? 10 min de luz mejora ánimo y ritmo circadiano' },
    { id: 'meals', label: '3 comidas + 2 snacks', icon: '🍽', frequency: 'daily', reminderTime: '13:00', reminderText: '¿Has comido de verdad? Proteína + agua. ~2500 kcal/día lactando' },
    { id: 'water', label: 'Agua ≥3L', icon: '💧', frequency: 'daily', reminderTime: '11:00', reminderText: 'Botón de agua en cada estación de lactancia. ≥3L al día' },
    { id: 'social', label: 'Contacto adulto', icon: '📱', frequency: 'daily', reminderTime: '14:00', reminderText: '¿Has hablado con alguien hoy? Llamada, mensaje, visita breve' },
    { id: 'non-mum', label: 'Actividad no-mum (20min)', icon: '📚', frequency: 'daily', reminderTime: '19:30', reminderText: 'Libro, podcast, skincare — 20 min de identidad propia' },
    { id: 'pelvic', label: 'Respiración suelo pélvico (2x)', icon: '🫁', frequency: 'daily', reminderTime: '09:00', reminderText: 'Tumbada, respiración profunda, exhala y aprieta suave. 2 veces hoy' },
    { id: 'epds', label: 'Check-in EPDS semanal', icon: '❤️', frequency: 'weekly', reminderTime: '10:00', reminderText: '¿Cómo te sientes esta semana? Puntúa ≥10 = llama al médico. ≥13 = hoy.' }
  ];

  var ROLES = {
    mum: {
      label: 'Mum',
      primary: 'Lactancia (solo ella puede), piel con piel, vínculo con bebé, 1:1 con Leo, RECUPERACIÓN Y SUEÑO',
      avoid: 'Cocinar, limpiar, colada, ruta escolar, recibir visitas, recados'
    },
    dad: {
      label: 'Daddey',
      primary: 'Mañanas + noche Leo, guardería ida/vuelta, cambios nocturnos, 1 biberón ~22h para Bloque de Oro, admin hogar, cocina',
      avoid: 'Dejar que Mum haga al bebé por cortesía — apoyar = hacerse cargo de Leo/casa'
    },
    grandma: {
      label: 'Granma-Tere',
      primary: 'Rutina Leo mañana + guardería, platos, colada, comidas sencillas, sostener bebé para siestas en brazos, 1 turno noche',
      avoid: 'Aconsejar sobre alimentación/sueño sin que se lo pidan; hacer demasiado (Mum se siente obligada a atender)'
    }
  };

  var RED_FLAGS = {
    mum: {
      title: 'Salud mental postparto',
      urgent: true,
      items: [
        'Ánimo bajo persistente, ansiedad, desesperanza >2 semanas',
        'Incapacidad de dormir cuando bebé duerme >1 semana',
        'Pensamientos intrusivos de hacerse daño o dañar al bebé (cualquier frecuencia)',
        'Dificultad para vincularse, sentimientos de desapego',
        'Ataques de pánico, pensamientos acelerados que no paran',
        'URGENCIA: Psicosis postparto (~1/1000): confusión, delirios, alucinaciones, manía → Urgencias'
      ]
    },
    newborn: {
      title: 'Bebé (llamar pediatra hoy)',
      urgent: true,
      items: [
        'Temp rectal ≥38°C / 100.4°F',
        '<6 pañales mojados/día después del día 7',
        'Ictericia que aumenta, muy dormilón, difícil despertar, rechaza tomas',
        'Cluster feeding todo el día (no solo por la noche) >1 semana',
        'Respiración rápida/con dificultad, labios azules'
      ]
    },
    toddler: {
      title: 'Regresión de Leo (llamar pediatra si)',
      urgent: false,
      items: [
        'Regresión severa que dura >8 semanas',
        'Pérdida de lenguaje o interacción social previamente adquiridos',
        'Conducta autolesiva, golpes de cabeza, agresión persistente al bebé',
        'Alteración del sueño >6–8 semanas con rutina consistente'
      ]
    },
    family: {
      title: 'Sistema familiar',
      urgent: false,
      items: [
        'Resentimiento escalando a lenguaje deshumanizante hacia pareja o hijo',
        'Mum saltando comidas o bloques de sueño repetidamente aunque se le ofrezcan',
        'Dad vuelve y se siente excluido de la unidad parental'
      ]
    }
  };

  window.RUTINA_DATA = {
    scenarios: SCENARIOS,
    guidance: GUIDANCE,
    selfCareItems: SELF_CARE_ITEMS,
    roles: ROLES,
    redFlags: RED_FLAGS,
    whoLabels: WHO_LABELS,
    whoOptions: WHO_OPTIONS
  };

})();
