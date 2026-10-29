"use strict";
(() => {
  const G = RCS,
    cache = new Map();
  // Trazados originales: arquetipos de circuitos reales, sin utilizar planos oficiales.
  const definitions = [
    [
      "muelles",
      "Muelles del Sur",
      "Calle · puerto industrial",
      "street",
      3,
      16,
      "Long Beach: puerto y frenadas a 90°",
      [
        [0, 0],
        [720, 0],
        [720, 240],
        [520, 240],
        [520, 460],
        [180, 460],
        [180, 260],
        [0, 260],
      ],
    ],
    [
      "barrio",
      "Barrio de la Estación",
      "Calle · zona urbana",
      "street",
      3,
      13,
      "Mónaco: curvas lentas y espacio limitado",
      [
        [0, 0],
        [620, 0],
        [620, 200],
        [440, 200],
        [440, 360],
        [620, 360],
        [620, 550],
        [130, 550],
        [130, 340],
        [0, 340],
      ],
    ],
    [
      "viaducto",
      "Anillo del Viaducto",
      "Calle · avenidas y enlaces",
      "street",
      3,
      28,
      "Bakú: recta larga y sector técnico",
      [
        [0, 0],
        [920, 0],
        [1050, 180],
        [820, 380],
        [590, 270],
        [450, 450],
        [140, 450],
        [-80, 200],
      ],
    ],
    [
      "almacenes",
      "Distrito de Almacenes",
      "Calle · ronda nocturna",
      "street",
      4,
      18,
      "Macau: muros, horquillas y cambios de dirección",
      [
        [0, 0],
        [780, 0],
        [880, 160],
        [720, 300],
        [470, 300],
        [470, 530],
        [200, 530],
        [200, 180],
        [0, 180],
      ],
    ],
    [
      "velocidad",
      "Autódromo de la Vega",
      "Profesional · alta velocidad",
      "pro",
      4,
      58,
      "Monza: rectas, chicanes y frenadas fuertes",
      [
        [0, 0],
        [1050, 0],
        [1050, 170],
        [910, 190],
        [910, 340],
        [1110, 430],
        [940, 640],
        [610, 640],
        [520, 460],
        [220, 540],
        [-100, 320],
      ],
    ],
    [
      "eses",
      "Circuito de las Eses",
      "Profesional · curvas enlazadas",
      "pro",
      4,
      48,
      "Suzuka: cambios de apoyo y curva larga",
      [
        [0, 0],
        [820, 0],
        [950, 180],
        [760, 300],
        [580, 180],
        [430, 340],
        [610, 490],
        [420, 650],
        [60, 590],
        [-100, 340],
      ],
    ],
    [
      "campina",
      "Gran Premio de Campiña",
      "Profesional · curvas rápidas",
      "pro",
      4,
      72,
      "Silverstone: apoyos rápidos y complejos técnicos",
      [
        [0, 0],
        [960, 0],
        [1120, 230],
        [870, 390],
        [1040, 610],
        [700, 780],
        [540, 550],
        [300, 660],
        [40, 470],
        [-140, 240],
      ],
    ],
    [
      "montana",
      "Circuito de los Pinos",
      "Profesional · frenadas y horquillas",
      "pro",
      4,
      42,
      "Red Bull Ring: aceleración y grandes frenadas",
      [
        [0, 0],
        [1000, 0],
        [1120, 220],
        [850, 680],
        [590, 650],
        [760, 410],
        [490, 300],
        [220, 480],
        [-80, 230],
      ],
    ],
    [
      "bosque",
      "Parque Motor del Bosque",
      "Profesional · trazado mixto",
      "pro",
      4,
      65,
      "Spa: sectores rápidos y complejos de curvas",
      [
        [0, 0],
        [1120, 0],
        [1210, 190],
        [960, 340],
        [1080, 550],
        [810, 830],
        [510, 760],
        [650, 560],
        [390, 420],
        [170, 590],
        [-130, 290],
      ],
    ],
    [
      "final",
      "Autódromo Horizonte",
      "Profesional · final de temporada",
      "pro",
      5,
      55,
      "Interlagos: sector sinuoso y larga aceleración",
      [
        [0, 0],
        [980, 0],
        [1110, 210],
        [850, 420],
        [630, 280],
        [440, 450],
        [690, 600],
        [480, 820],
        [100, 750],
        [-140, 420],
      ],
    ],
    [
      "neon",
      "Avenida del Neón",
      "Calle · distrito comercial nocturno",
      "street",
      3,
      21,
      "Singapur: avenidas iluminadas, esquinas y frenadas",
      [
        [0, 0],
        [860, 0],
        [860, 230],
        [640, 230],
        [640, 460],
        [850, 460],
        [850, 660],
        [300, 660],
        [300, 450],
        [0, 450],
      ],
    ],
    [
      "costera",
      "Ronda del Malecón",
      "Calle · paseo costero",
      "street",
      3,
      25,
      "Adelaide: vías urbanas, curvas rápidas y sección estrecha",
      [
        [0, 0],
        [940, 0],
        [1110, 210],
        [880, 430],
        [600, 430],
        [460, 620],
        [150, 620],
        [-120, 380],
        [-120, 180],
      ],
    ],
    [
      "dunas",
      "Circuito de las Dunas",
      "Profesional · desierto y escapatorias",
      "pro",
      4,
      63,
      "Bahréin: frenadas fuertes y curvas lentas sobre asfalto caliente",
      [
        [0, 0],
        [1100, 0],
        [1100, 230],
        [820, 230],
        [820, 440],
        [1060, 580],
        [860, 800],
        [420, 800],
        [280, 530],
        [-100, 360],
      ],
    ],
    [
      "estadio",
      "Autódromo del Estadio",
      "Profesional · sector de estadio",
      "pro",
      4,
      50,
      "Hockenheim: rectas de adelantamiento y complejo final",
      [
        [0, 0],
        [1000, 0],
        [1210, 230],
        [1120, 490],
        [820, 490],
        [700, 740],
        [390, 740],
        [390, 500],
        [150, 500],
        [-120, 240],
      ],
    ],
    [
      "atlantico",
      "Circuito Atlántico",
      "Profesional · litoral y curvas abiertas",
      "pro",
      4,
      70,
      "Portimão: curvas de radio cambiante y aceleraciones",
      [
        [0, 0],
        [960, 0],
        [1150, 200],
        [920, 360],
        [1080, 590],
        [780, 810],
        [570, 660],
        [300, 800],
        [20, 550],
        [-160, 270],
      ],
    ],
    [
      "abedules",
      "Gran Premio de los Abedules",
      "Profesional · bosque y recta técnica",
      "pro",
      4,
      54,
      "Nürburgring GP: horquillas, cambios de apoyo y bosque",
      [
        [0, 0],
        [1020, 0],
        [1130, 200],
        [880, 330],
        [970, 550],
        [720, 760],
        [500, 620],
        [350, 810],
        [60, 640],
        [-140, 340],
      ],
    ],
  ];
  const compile = (def) => {
    const v = def.vertices,
      n = v.length,
      d = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]),
      corners = v.map((b, i) => {
        const a = v[(i + n - 1) % n],
          c = v[(i + 1) % n],
          cut = Math.min(def.radius, d(a, b) * 0.28, d(b, c) * 0.28);
        return {
          in: [
            b[0] + ((a[0] - b[0]) * cut) / d(a, b),
            b[1] + ((a[1] - b[1]) * cut) / d(a, b),
          ],
          out: [
            b[0] + ((c[0] - b[0]) * cut) / d(b, c),
            b[1] + ((c[1] - b[1]) * cut) / d(b, c),
          ],
        };
      });
    const pts = [];
    let straight = 0;
    for (let i = 0; i < n; i++) {
      const a = corners[i].out,
        j = (i + 1) % n,
        b = corners[j].in,
        c = v[j],
        end = corners[j].out,
        len = d(a, b),
        steps = Math.max(2, Math.ceil(len / 3));
      if (i === 0) straight = len;
      for (let k = 0; k < steps; k++) {
        const t = k / steps;
        pts.push({
          x: a[0] + (b[0] - a[0]) * t,
          y: (a[1] + (b[1] - a[1]) * t) / 0.66,
        });
      }
      const cs = Math.max(10, Math.ceil((d(b, c) + d(c, end)) / 2));
      for (let k = 0; k < cs; k++) {
        const t = k / cs,
          u = 1 - t;
        pts.push({
          x: u * u * b[0] + 2 * u * t * c[0] + t * t * end[0],
          y: (u * u * b[1] + 2 * u * t * c[1] + t * t * end[1]) / 0.66,
        });
      }
    }
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i],
        q = pts[(i + 1) % pts.length];
      p.segment = Math.hypot(q.x - p.x, (q.y - p.y) * 0.66);
      p.angle = Math.atan2((q.y - p.y) * 0.66, q.x - p.x);
      total += p.segment;
    }
    def.length = Math.round(total);
    let distance = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.distance = distance;
      p.meters = (p.segment / total) * def.length;
      distance += p.meters;
      p.limit = 60;
    }
    for (let i = 0; i < pts.length; i++) {
      const before = pts[(i - 3 + pts.length) % pts.length],
        after = pts[(i + 3) % pts.length],
        angle = Math.atan2(
          Math.sin(after.angle - before.angle),
          Math.cos(after.angle - before.angle),
        );
      let span = 0;
      for (let j = -3; j < 3; j++)
        span += pts[(i + j + pts.length) % pts.length].meters;
      pts[i].limit = G.clamp(
        Math.sqrt(8 / Math.max(0.001, Math.abs(angle) / span)),
        def.kind === "street" ? 10 : 13,
        70,
      );
    }
    const area = v.reduce(
      (sum, p, i) => sum + p[0] * v[(i + 1) % n][1] - v[(i + 1) % n][0] * p[1],
      0,
    );
    def.pit = {
      entry: straight * 0.1,
      exit: straight * 0.9,
      side: area > 0 ? -1 : 1,
      offset: 19,
      limit: (def.kind === "street" ? 40 : 60) / 3.6,
    };
    return pts;
  };
  for (const [
    id,
    name,
    region,
    kind,
    laps,
    radius,
    inspiration,
    vertices,
  ] of definitions) {
    const def = {
      id,
      name,
      region,
      kind,
      laps,
      radius,
      inspiration,
      vertices,
      modern: true,
      width: kind === "street" ? 10.6 : 13.4,
      month: 0,
      date: 1,
      points: vertices.map(([x, y]) => [x, y / 0.66]),
    };
    def.theme =
      {
        almacenes: "night",
        neon: "neon",
        costera: "coast",
        dunas: "desert",
        estadio: "stadium",
        atlantico: "coast",
        abedules: "forest",
        bosque: "forest",
      }[id] || (kind === "street" ? "urban" : "park");
    const points = compile(def);
    G.Data.tracks.push(def);
    cache.set(G.Data.tracks.length - 1, points);
  }
  const track = G.Race.track;
  G.Race.track = function (index) {
    return cache.get(index) || track.call(this, index);
  };
  const pit = G.RaceWeekend.pitLayout;
  G.RaceWeekend.pitLayout = function (index) {
    return G.Data.tracks[index].pit || pit.call(this, index);
  };
  const lateral = G.RaceWeekend.pitLateral;
  G.RaceWeekend.pitLateral = function (index, progress) {
    const def = G.Data.tracks[index];
    if (!def.modern) return lateral.call(this, index, progress);
    const p = def.pit,
      d = ((progress % def.length) + def.length) % def.length,
      u = G.clamp((d - p.entry) / (p.exit - p.entry), 0, 1),
      smooth = (x) => x * x * (3 - 2 * x);
    return (
      p.side *
      p.offset *
      (u < 0.18 ? smooth(u / 0.18) : u > 0.82 ? smooth((1 - u) / 0.18) : 1)
    );
  };
  G.Circuits = {
    indices: () =>
      G.Data.tracks
        .map((t, i) => (t.modern ? i : null))
        .filter((i) => i !== null),
    validate(index) {
      const pts = G.Race.track(index),
        def = G.Data.tracks[index];
      G.assert(def.modern && pts.length > 100, "Trazado moderno inválido.");
      const cross = (a, b, c) =>
        (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      // Los vértices de diseño no pueden cruzarse; los empalmes permanecen dentro de sus segmentos.
      const v = def.vertices.map(([x, y]) => ({ x, y }));
      for (let i = 0; i < v.length; i++)
        for (let j = i + 2; j < v.length; j++)
          if (!(i === 0 && j === v.length - 1)) {
            const a = v[i],
              b = v[(i + 1) % v.length],
              c = v[j],
              d = v[(j + 1) % v.length];
            G.assert(
              !(
                cross(a, b, c) * cross(a, b, d) < 0 &&
                cross(c, d, a) * cross(c, d, b) < 0
              ),
              "El trazado se cruza consigo mismo.",
            );
          }
      G.assert(
        def.pit.exit < def.length && def.pit.exit - def.pit.entry > 300,
        "Recta de boxes insuficiente.",
      );
      return true;
    },
  };
})();
