/**
 * MUNDO SOLARPUNK VIVO
 * ====================
 * Un solo archivo. Lee world.json, simula el día, guarda world.json.
 *
 * Variables de entorno:
 *   GEMINI_API_KEY  → tu API key de Google AI Studio (gratis)
 *
 * Para correr localmente:
 *   node simulation.js
 */

const fs = require('fs');

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const GEMINI_KEY   = process.env.GEMINI_API_KEY || '';
const WORLD_FILE   = 'world.json';
const MAX_HISTORY  = 100;

// ─── DATOS INICIALES ──────────────────────────────────────────────
const SEED = {
  world: {
    name: 'Ventania',
    day: 0,
    date: '',
    season: 'primavera',
    seasonDay: 1,
    climate: 'soleado',
    resources: { food: 70, energy: 80, mood: 75 },
  },
  characters: [
    { id: 'c1', name: 'Sola Venegas',  type: 'humano',       age: 34, role: 'arquitecta de biomateriales',    location: 'Zona Este',       traits: ['curiosa', 'líder'],          emotion: 'curiosidad',    alive: true, belief: 'panteísta',   faction: 'Ecoverde' },
    { id: 'c2', name: 'Iko',           type: 'robot',        age: 7,  role: 'compositor y filósofo',          location: 'Taller Comunal',  traits: ['empático', 'metódico'],      emotion: 'contemplación', alive: true, belief: 'Culto Circuitos', faction: 'Tecnolibres' },
    { id: 'c3', name: 'Teo Quilín',    type: 'humano',       age: 17, role: 'aprendiz de cartógrafo',         location: 'Bosque Norte',    traits: ['soñador', 'valiente'],       emotion: 'euforia',       alive: true, belief: 'agnóstico',   faction: 'sin filiación' },
    { id: 'c4', name: 'Maro Esteve',   type: 'humano',       age: 38, role: 'guardián de semillas',           location: 'Granja Central',  traits: ['paciente', 'sabio'],         emotion: 'serenidad',     alive: true, belief: 'animista',    faction: 'Círculo Raíz' },
    { id: 'c5', name: 'Lua',           type: 'humano',       age: 28, role: 'mensajera en moto solar',        location: 'Zona Este',       traits: ['veloz', 'leal'],             emotion: 'energía',       alive: true, belief: 'ateísta',     faction: 'Círculo Raíz' },
    { id: 'c6', name: 'Pipa',          type: 'animal',       age: 4,  role: 'compañera de Lua',               location: 'Zona Este',       traits: ['fiel', 'olfato cuántico'],   emotion: 'alerta gozosa', alive: true, belief: null,          faction: null },
    { id: 'c7', name: 'Zerda',         type: 'robot',        age: 12, role: 'agrónoma autónoma',              location: 'Granja Central',  traits: ['analítica', 'gentil'],       emotion: 'enfoque',       alive: true, belief: 'panteísta',   faction: 'Ecoverde' },
    { id: 'c8', name: 'Bastián Hilo',  type: 'humano',       age: 67, role: 'narrador oral e historiador',    location: 'Plaza Central',   traits: ['sabio', 'melancólico'],      emotion: 'nostalgia',     alive: true, belief: 'agnóstico',   faction: 'Contemplativxs' },
    { id: 'c9', name: 'Vex',           type: 'interdimensional', age: null, role: 'observador de umbrales', location: 'La Frontera',     traits: ['imprevisible', 'cósmico'],   emotion: 'curiosidad cósmica', alive: true, belief: 'fe interdimensional', faction: null },
  ],
  locations: [
    { id: 'zona_este',     name: 'Zona Este',       description: 'Barrio residencial con jardines verticales y murales bioluminiscentes.' },
    { id: 'granja',        name: 'Granja Central',  description: 'Corazón agrícola. Paneles solares traslúcidos sobre hileras de cultivos.' },
    { id: 'mirador',       name: 'El Mirador',      description: 'Plataforma entre robles centenarios. Punto de meditación y astronomía.' },
    { id: 'taller',        name: 'Taller Comunal',  description: 'Fábrica abierta: impresoras 3D, herrería, laboratorio de química verde.' },
    { id: 'lago',          name: 'Lago del Sur',    description: 'Aguas calmas rodeadas de totoras y nenúfares gigantes.' },
    { id: 'bosque',        name: 'Bosque Norte',    description: 'Árboles que cambian de lugar según dicen los más viejos.' },
    { id: 'plaza',         name: 'Plaza Central',   description: 'Centro neurálgico. Árbol de mimbre de 200 años y debates eternos.' },
    { id: 'frontera',      name: 'La Frontera',     description: 'Límite del mundo conocido. Algunos regresan cambiados. Otros no regresan.' },
  ],
  history: [],
};

// ─── EVENTOS DE RESPALDO (cuando la IA falla) ─────────────────────
const BACKUP_EVENTS = [
  { cat: 'contemplativo', text: '{name} se despertó antes del amanecer y contempló el cielo cambiando de color sobre los paneles solares.' },
  { cat: 'contemplativo', text: '{name} pasó la tarde bajo el árbol de mimbre. Las hojas susurraban algo parecido a una canción de cuna.' },
  { cat: 'contemplativo', text: '{name} se quedó en el Mirador hasta que el último color del atardecer desapareció. No dijo nada al regresar.' },
  { cat: 'contemplativo', text: '{name} caminó descalzo por el jardín de musgo. La tierra estaba tibia. Se quedó quieto un largo rato.' },
  { cat: 'trivial',       text: '{name} preparó una olla de sopa de verduras y la repartió entre los vecinos. Alguien dijo que era la mejor del año.' },
  { cat: 'trivial',       text: '{name} pasó la mañana reparando bicicletas en el taller abierto. Arregló siete en total.' },
  { cat: 'trivial',       text: '{name} enseñó a tres niños a construir papalotes con materiales reciclados. Los llamaron "dragones del viento".' },
  { cat: 'trivial',       text: '{name} horneó pan de masa madre. El aroma convocó a media docena de vecinos sin que nadie los invitara.' },
  { cat: 'trivial',       text: '{name} organizó una partida de cartas en la terraza. Ganó, pero fue generoso con los perdedores.' },
  { cat: 'trivial',       text: '{name} pasó el día sin hacer nada productivo y por primera vez en mucho tiempo, eso estuvo perfectamente bien.' },
  { cat: 'trivial',       text: '{name} catalogó semillas del banco comunal y encontró una variedad que nadie recordaba haber guardado.' },
  { cat: 'interpersonal', text: '{name} tuvo una conversación que duró hasta el amanecer. No recordaba la última vez que había hablado así de verdad.' },
  { cat: 'interpersonal', text: '{name} dio el primer paso para reconciliarse con alguien después de semanas de silencio. Fue difícil. Fue necesario.' },
  { cat: 'fantástico',    text: '{name} fue testigo de cómo un portal de luz azul se abrió brevemente en la ladera de la montaña. No dejó rastro.' },
  { cat: 'fantástico',    text: '{name} encontró en su jardín una planta que no existía ayer. Sus flores cambian de color según quién las mira.' },
  { cat: 'fantástico',    text: 'Una mariposa de alas plateadas siguió a {name} todo el día. Donde se posaba, las plantas florecían en segundos.' },
  { cat: 'fantástico',    text: '{name} encontró en el molino abandonado una habitación nueva que nadie había visto. Contenía mapas de otro tiempo.' },
  { cat: 'fantástico',    text: 'Vex se materializó cerca de {name} y dejó una nota en un idioma que nadie ha identificado. {name} la guardó.' },
  { cat: 'espiritual',    text: '{name} participó en un ritual al amanecer. Sintió algo que no sabe cómo nombrar.' },
  { cat: 'ecológico',     text: 'Una tormenta inesperada pasó sobre el sector de {name}. Duró poco pero dejó el aire oliendo a promesas.' },
];

// ─── UTILIDADES ───────────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, min=0, max=100) => Math.max(min, Math.min(max, v));

const SEASONS     = ['primavera', 'verano', 'otoño', 'invierno'];
const NAMES_F     = ['Ari','Bel','Cal','Deva','Fio','Gael','Hira','Juno','Luma','Mira','Noa','Remi','Sal','Umi','Vela'];
const NAMES_L     = ['Viento','Tierra','Agua','Luz','Raíz','Nube','Flor','Río','Sol','Musgo','Bruma','Savia'];
const randomName  = () => `${pick(NAMES_F)} ${pick(NAMES_L)}`;

// ─── PROMPT PARA GEMINI ───────────────────────────────────────────
function buildPrompt(world, featured) {
  const charList = featured.map(c =>
    `- ${c.name} (${c.type}, ${c.age ? c.age + ' años' : 'edad desconocida'}, ${c.role}, emoción: ${c.emotion}, creencia: ${c.belief || 'ninguna'})`
  ).join('\n');

  return `Eres el narrador de un mundo solarpunk llamado "${world.name}".
Es el día ${world.day}. Estación: ${world.season}. Clima: ${world.climate}.

Personajes de hoy:
${charList}

Generá exactamente 4 eventos narrativos para hoy. Reglas:
- Cada evento es sobre uno de estos personajes (usá su nombre exacto).
- El texto debe ser literario y evocador, 2-3 oraciones.
- Variedad: al menos 1 contemplativo, 1 trivial, 1 fantástico o interpersonal.
- Tono solarpunk: esperanza, armonía, diversidad, cuidado comunitario.
- Los robots y animales tienen emociones y subjetividad propia.

Respondé SOLO con este JSON, sin texto adicional, sin markdown:
[
  {"name": "nombre del personaje", "category": "contemplativo|trivial|interpersonal|fantástico|espiritual|ecológico", "text": "texto del evento"}
]`;
}

// ─── LLAMADA A GEMINI ─────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Limpiar markdown si lo hay
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── GENERAR EVENTOS ──────────────────────────────────────────────
async function generateEvents(world, characters) {
  const alive    = characters.filter(c => c.alive);
  const featured = [...alive].sort(() => Math.random() - 0.5).slice(0, 4);

  // Intentar con IA
  if (GEMINI_KEY) {
    try {
      const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000));
      const aiCall  = callGemini(buildPrompt(world, featured));
      const parsed  = await Promise.race([aiCall, timeout]);

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`  🤖 Gemini generó ${parsed.length} eventos`);
        return parsed.map(e => ({
          id:       `ai_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
          date:     world.date,
          day:      world.day,
          source:   'ia',
          name:     e.name,
          category: e.category,
          text:     e.text,
        }));
      }
    } catch (err) {
      console.warn(`  ⚠️  Gemini falló (${err.message}) — usando respaldo local`);
    }
  }

  // Respaldo local
  console.log('  📖 Usando catálogo local');
  return Array.from({ length: 4 }, () => {
    const template = pick(BACKUP_EVENTS);
    const char     = pick(alive);
    return {
      id:       `local_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      date:     world.date,
      day:      world.day,
      source:   'local',
      name:     char.name,
      category: template.cat,
      text:     template.text.replace(/{name}/g, char.name),
    };
  });
}

// ─── SIMULACIÓN DIARIA ────────────────────────────────────────────
async function simulate() {

  // 1. Cargar o inicializar estado
  let state;
  if (fs.existsSync(WORLD_FILE)) {
    state = JSON.parse(fs.readFileSync(WORLD_FILE, 'utf8'));
    console.log(`📂 Estado cargado (día ${state.world.day})`);
  } else {
    state = JSON.parse(JSON.stringify(SEED));
    console.log('🌱 Primera ejecución — inicializando mundo');
  }

  let { world, characters, locations, history } = state;

  // 2. Avanzar día
  world.day  += 1;
  world.date  = new Date().toISOString().split('T')[0];
  world.seasonDay = (world.seasonDay || 1) + 1;
  if (world.seasonDay > 90) {
    world.seasonDay = 1;
    world.season = SEASONS[(SEASONS.indexOf(world.season) + 1) % 4];
  }
  world.climate = pick(['soleado','nublado','lluvioso','ventoso','templado','frío seco','tormenta suave','bruma']);
  console.log(`📅 Día ${world.day} | ${world.season} | ${world.climate}`);

  // 3. Envejecer personajes
  characters = characters.map(c => {
    if (!c.alive) return c;
    const age = (c.age || 0) + 1;
    let alive = true;
    if (c.type === 'humano'  && age > 80  && Math.random() < 0.015) alive = false;
    if (c.type === 'animal'  && age > 14  && Math.random() < 0.06)  alive = false;
    if (c.type === 'robot'   && age > 50  && Math.random() < 0.003) alive = false;
    return { ...c, age, alive, ...(alive ? {} : { deathDay: world.day }) };
  });
  const deaths = characters.filter(c => !c.alive && c.deathDay === world.day);

  // 4. Nacimientos
  const parents  = characters.filter(c => c.alive && c.type === 'humano');
  const newborns = [];
  if (parents.length >= 2 && Math.random() < 0.07) {
    newborns.push({
      id:       `c_${Date.now()}`,
      name:     randomName(),
      type:     'humano',
      age:      0,
      role:     'recién nacido',
      location: pick(parents).location,
      traits:   ['curioso'],
      emotion:  'asombro puro',
      alive:    true,
      belief:   null,
      faction:  null,
    });
  }

  // 5. Inmigración ocasional
  const arrived = [];
  if (Math.random() < 0.1) {
    const types = ['humano','humano','humano','robot','animal'];
    arrived.push({
      id:       `c_${Date.now()}_i`,
      name:     randomName(),
      type:     pick(types),
      age:      rand(18, 45),
      role:     'recién llegado',
      location: pick(locations).name,
      traits:   [pick(['viajero','valiente','curioso','silencioso','alegre'])],
      emotion:  pick(['esperanza','nostalgia','determinación']),
      alive:    true,
      belief:   pick(['animista','panteísta','ateísta','agnóstico','Culto Circuitos']),
      faction:  pick(['Ecoverde','Tecnolibres','Círculo Raíz','Contemplativxs','sin filiación']),
    });
  }

  characters = [...characters, ...newborns, ...arrived];

  // 6. Recursos (estación + azar)
  const seasonDelta = { primavera:[2,1,2], verano:[3,3,1], otoño:[1,0,-1], invierno:[-3,-2,-2] };
  const [df, de, dm] = seasonDelta[world.season] || [0,0,0];
  world.resources = {
    food:   clamp(world.resources.food   + df + rand(-2, 2) - 1),
    energy: clamp(world.resources.energy + de + rand(-2, 2) - 1),
    mood:   clamp(world.resources.mood   + dm + rand(-2, 2) - 1),
  };

  // 7. Eventos narrativos (IA o respaldo)
  const events = await generateEvents(world, characters);

  // 8. Eventos vitales
  const vitalEvents = [
    ...newborns.map(c => ({ id: `v_${Date.now()}n`, date: world.date, day: world.day, source: 'mundo', name: c.name, category: 'nacimiento', text: `${c.name} nació hoy.` })),
    ...deaths.map(c   => ({ id: `v_${Date.now()}d`, date: world.date, day: world.day, source: 'mundo', name: c.name, category: 'muerte',    text: `${c.name} falleció hoy.` })),
    ...arrived.map(c  => ({ id: `v_${Date.now()}a`, date: world.date, day: world.day, source: 'mundo', name: c.name, category: 'llegada',   text: `${c.name} llegó al mundo hoy.` })),
  ];

  const todayEvents = [...events, ...vitalEvents];
  history = [...todayEvents, ...history].slice(0, MAX_HISTORY);
  world.todayEvents = todayEvents;

  // 9. Guardar
  const newState = { world, characters, locations, history };
  fs.writeFileSync(WORLD_FILE, JSON.stringify(newState, null, 2));

  // 10. Resumen
  const alive = characters.filter(c => c.alive).length;
  console.log(`✅ Día ${world.day} listo | 👥 ${alive} habitantes | 🎭 ${todayEvents.length} eventos`);
  console.log(`   🍎 ${world.resources.food}% comida | ⚡ ${world.resources.energy}% energía | 💚 ${world.resources.mood}% humor\n`);
}

simulate().catch(err => { console.error('❌', err.message); process.exit(1); });
