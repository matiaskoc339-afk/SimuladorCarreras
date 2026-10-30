"use strict";
(() => {
  const G = RCS,
    P = G.Parts;
  // Las referencias antiguas conservan sus índices y sus definiciones.
  const rows = [
    [
      "Aster",
      "Sprint 26",
      "hatch",
      170,
      1120,
      221,
      80,
      80,
      91,
      28000,
      3.98,
      1.76,
      "hatch",
    ],
    [
      "Kairo",
      "Pulse GT",
      "hatch",
      205,
      1220,
      238,
      83,
      83,
      89,
      36000,
      4.12,
      1.8,
      "fastback",
    ],
    [
      "Nival",
      "Fjord Sport",
      "wagon",
      240,
      1510,
      250,
      80,
      85,
      93,
      47000,
      4.65,
      1.85,
      "wagon",
    ],
    [
      "Vesper",
      "Mistral",
      "roadster",
      195,
      1030,
      233,
      87,
      81,
      88,
      43000,
      3.91,
      1.77,
      "open",
    ],
    [
      "Aurelia",
      "Linea S",
      "coupe",
      260,
      1320,
      265,
      85,
      86,
      90,
      58000,
      4.42,
      1.87,
      "coupe",
    ],
    [
      "Valmont",
      "Arc GT",
      "sedan",
      280,
      1490,
      270,
      82,
      88,
      92,
      65000,
      4.71,
      1.89,
      "sedan",
    ],
    [
      "Orsini",
      "Fulmine",
      "coupe",
      305,
      1240,
      281,
      90,
      89,
      85,
      85000,
      4.3,
      1.9,
      "mid",
    ],
    [
      "Aster",
      "Metro RS",
      "hatch",
      185,
      1060,
      226,
      84,
      80,
      90,
      33000,
      3.72,
      1.73,
      "city",
    ],
    [
      "Nival",
      "Boreal T",
      "targa",
      230,
      1170,
      251,
      86,
      84,
      89,
      53000,
      4.18,
      1.83,
      "coupe",
    ],
    [
      "Kairo",
      "Vector S",
      "coupe",
      295,
      1380,
      277,
      88,
      90,
      88,
      72000,
      4.51,
      1.91,
      "fastback",
    ],
    [
      "Vesper",
      "Largo GT",
      "wagon",
      265,
      1460,
      260,
      84,
      87,
      91,
      61000,
      4.58,
      1.86,
      "wagon",
    ],
    [
      "Aurelia",
      "Corsa 320",
      "coupe",
      320,
      1290,
      285,
      91,
      92,
      86,
      98000,
      4.39,
      1.93,
      "mid",
    ],
  ];
  const models = [];
  for (const [
    brand,
    model,
    shape,
    hp,
    weight,
    top,
    grip,
    brakes,
    reliability,
    value,
    length,
    width,
    design,
  ] of rows) {
    models.push(G.Data.models.length);
    G.Data.models.push({
      brand,
      model,
      generation: "Serie 2026",
      year: 2026,
      shape,
      hp,
      weight,
      top,
      grip,
      brakes,
      reliability,
      value,
      length,
      width,
      design,
      showroomOnly: true,
    });
  }
  const makers = [
    "Atlas Dynamics",
    "Senda Motorsport",
    "Kuma Works",
    "Boreal Engineering",
    "Vértice Performance",
    "Mistral Components",
    "Tessera Racing",
    "Nexo Garage",
  ];
  const palette = [
    "#d59b55",
    "#d36a55",
    "#6daab6",
    "#9ea969",
    "#a888b3",
    "#b9c7cb",
    "#6ba38c",
    "#e0be7c",
  ];
  // Cada familia tiene un propósito y un coste mecánico: no son nombres sobre la misma pieza.
  const shells = [
    [
      "Touring limpio",
      "touring",
      950,
      { weight: 2, bodyWear: -0.08 },
      0,
      18,
      0,
    ],
    [
      "Touring ligero",
      "touring",
      1600,
      { weight: -16, bodyWear: 0.08 },
      0,
      18,
      0.01,
    ],
    [
      "Touring refrigerado",
      "touring",
      1750,
      { weight: 6, cooling: 0.22, top: -1 },
      0,
      18,
      0.015,
    ],
    [
      "Gran Turismo",
      "touring",
      2100,
      { weight: 10, bodyWear: -0.16, top: 1 },
      0,
      18,
      0.02,
    ],
    [
      "Aletas atornilladas",
      "wide",
      2600,
      { weight: 11, grip: 2, top: -3 },
      1,
      19,
      0.07,
    ],
    [
      "Wide de montaña",
      "wide",
      3200,
      { weight: -8, grip: 2.7, top: -5, bodyWear: 0.12 },
      1,
      19,
      0.09,
    ],
    [
      "Wide resistente",
      "wide",
      3000,
      { weight: 20, grip: 1, bodyWear: -0.2, top: -2 },
      1,
      19,
      0.08,
    ],
    [
      "Wide de velocidad",
      "wide",
      3900,
      { weight: 3, grip: 1.2, top: 3 },
      1,
      19,
      0.065,
    ],
    [
      "Silueta Sprint",
      "race",
      4800,
      { weight: -25, grip: 3, bodyWear: 0.2, top: -4 },
      2,
      20,
      0.12,
    ],
    [
      "Silueta Endurance",
      "race",
      5400,
      { weight: 9, grip: 2, cooling: 0.3, bodyWear: -0.12, top: -3 },
      2,
      20,
      0.1,
    ],
    [
      "Silueta Aero",
      "race",
      6200,
      { weight: -12, grip: 4, top: -7, bodyWear: 0.14 },
      2,
      20,
      0.14,
    ],
    [
      "Silueta Carbono",
      "race",
      7900,
      { weight: -38, grip: 1.5, bodyWear: 0.28 },
      2,
      20,
      0.11,
    ],
  ];
  const families = {
    intake: [
      ["intake-club", "Respuesta", { hp: 5, stress: 0.04 }],
      ["intake-club", "Flujo alto", { hp: 10, stress: 0.12, reliability: -1 }],
      ["intake-club", "Filtro protegido", { hp: 2, reliability: 2, weight: 2 }],
      ["intake-club", "Conducto frío", { hp: 6, cooling: 0.12, weight: 3 }],
    ],
    exhaust: [
      ["exhaust-light", "Titanio", { hp: 5, weight: -9, stress: 0.06 }],
      ["exhaust-light", "Par medio", { hp: 3, acceleration: 0.035, weight: 2 }],
      [
        "exhaust-light",
        "Flujo libre",
        { hp: 9, stress: 0.15, reliability: -2 },
      ],
      ["exhaust-light", "Silenciado", { hp: 3, weight: -3, reliability: 1 }],
    ],
    ecu: [
      ["ecu-ep3", "Ahorro térmico", { hp: 3, stress: -0.05, reliability: 2 }],
      ["ecu-ep3", "Respuesta", { hp: 8, acceleration: 0.02, stress: 0.13 }],
      ["ecu-ep3", "Mapa Sprint", { hp: 15, stress: 0.24, reliability: -3 }],
      ["ecu-ep3", "Mapa lluvia", { hp: 4, grip: 1, stress: 0.04 }],
    ],
    boost: [
      [
        "engine-club",
        "Compresor lineal",
        { hp: 30, weight: 9, stress: 0.22, reliability: -2 },
      ],
      [
        "engine-club",
        "Turbo Sprint",
        { hp: 55, weight: 13, stress: 0.38, reliability: -5 },
      ],
      ["engine-club", "Baja presión", { hp: 18, weight: 7, stress: 0.1 }],
      [
        "engine-club",
        "Turbo refrigerado",
        { hp: 42, weight: 18, stress: 0.25, cooling: 0.15, reliability: -2 },
      ],
    ],
    clutch: [
      ["clutch-sport", "Disco orgánico", { acceleration: 0.045, weight: 1 }],
      [
        "clutch-sport",
        "Cerámico",
        { acceleration: 0.09, weight: 3, stress: 0.04 },
      ],
      [
        "clutch-sport",
        "Endurance",
        { acceleration: 0.035, weight: 4, reliability: 2 },
      ],
      [
        "clutch-sport",
        "Volante ligero",
        { acceleration: 0.07, weight: -4, reliability: -1 },
      ],
    ],
    differential: [
      ["diff-rear", "Tracción", { grip: 3, acceleration: 0.035, weight: 3 }],
      ["diff-rear", "Salida curva", { grip: 2, acceleration: 0.06, weight: 5 }],
      ["diff-rear", "Lluvia", { grip: 4, acceleration: -0.015, weight: 4 }],
      ["diff-rear", "Ligero", { grip: 1.5, weight: -3 }],
    ],
    suspension: [
      [
        "suspension-club",
        "Bache urbano",
        { grip: 3, bodyWear: -0.12, weight: 4 },
      ],
      [
        "suspension-club",
        "Circuito",
        { grip: 8, bodyWear: 0.22, tireWear: 0.1, weight: 2 },
      ],
      ["suspension-club", "Equilibrada", { grip: 5, weight: -1 }],
      [
        "suspension-club",
        "Larga distancia",
        { grip: 2, tireWear: -0.1, bodyWear: -0.06, weight: 5 },
      ],
    ],
    brakes: [
      ["brakes-club", "Ventilados", { brakes: 12, weight: 3 }],
      ["brakes-four", "Cuatro pistones", { brakes: 21, weight: 5 }],
      ["brakes-six", "Seis pistones", { brakes: 29, weight: 8 }],
      ["brakes-club", "Disco ligero", { brakes: 8, weight: -4 }],
    ],
    tires: [
      ["tires-sport", "Sprint", { grip: 8, tireWear: 0.4 }],
      ["tires-endurance", "Endurance", { grip: -1, tireWear: -0.32 }],
      ["tires-sport", "Polivalentes", { grip: 4, tireWear: 0.08 }],
      [
        "tires-endurance",
        "Urbano reforzado",
        { grip: 1, tireWear: -0.15, weight: 3 },
      ],
    ],
    aero: [
      ["aero-club", "Baja resistencia", { grip: 3, top: 3, weight: 3 }],
      ["aero-adjustable", "Carga alta", { grip: 12, top: -13, weight: 9 }],
      ["aero-club", "Equilibrio GT", { grip: 7, top: -5, weight: 5 }],
      ["aero-adjustable", "Montaña", { grip: 14, top: -17, weight: 5 }],
    ],
    body: [
      ["light-body", "Panel ligero", { weight: -38, bodyWear: 0.12 }],
      ["light-body", "Carbono", { weight: -78, bodyWear: 0.4 }],
      ["light-body", "Panel resistente", { weight: 14, bodyWear: -0.23 }],
      ["light-body", "Aluminio", { weight: -51, bodyWear: 0.2 }],
    ],
    cooling: [
      ["cooling-race", "Ligero", { cooling: 0.55, weight: 2, reliability: 1 }],
      [
        "cooling-pro",
        "Endurance",
        { cooling: 1.2, weight: 10, reliability: 4 },
      ],
      [
        "cooling-pro",
        "Doble núcleo",
        { cooling: 1.4, weight: 14, reliability: 2 },
      ],
      [
        "cooling-race",
        "Equilibrado",
        { cooling: 0.8, weight: 5, reliability: 2 },
      ],
    ],
    engine: [
      [
        "engine-club",
        "Fiable",
        { hp: 20, weight: 7, stress: 0.07, reliability: 2 },
      ],
      [
        "engine-sport",
        "Sport",
        { hp: 60, weight: 13, stress: 0.23, reliability: -3 },
      ],
      [
        "engine-race",
        "Sprint",
        { hp: 110, weight: 19, stress: 0.45, reliability: -6 },
      ],
      [
        "engine-club",
        "Ligero",
        { hp: 27, weight: -3, stress: 0.17, reliability: -2 },
      ],
    ],
    chassis: [
      ["chassis-street", "Torretas", { weight: 7, bodyWear: -0.1 }],
      ["chassis-sport", "Jaula Sport", { weight: 19, bodyWear: -0.2, grip: 1 }],
      [
        "chassis-race",
        "Jaula integral",
        { weight: 30, bodyWear: -0.27, grip: 2 },
      ],
      [
        "chassis-sport",
        "Jaula ligera",
        { weight: 11, bodyWear: -0.12, grip: 0.5 },
      ],
    ],
    wheels: [
      ["wheels-sport", "Cinco radios", { weight: -3, grip: 1 }],
      ["wheels-forged", "Forjadas", { weight: -6, grip: 1.5 }],
      ["wheels-sport", "Rally", { weight: 2, grip: 0.5, bodyWear: -0.03 }],
      ["wheels-forged", "Magnesio", { weight: -9, grip: 2, bodyWear: 0.07 }],
    ],
  };
  const slots = Object.keys(P.slots),
    cache = new Map(),
    original = P.definition.bind(P);
  const C = (G.WeeklyContent = {
    models,
    shells,
    makers,
    slots,
    id(seed, week, n) {
      return `supply1-${seed >>> 0}-${week}-${n}`;
    },
    definition(id) {
      if (typeof id !== "string") return;
      const match = /^supply1-(\d+)-(\d+)-(\d+)$/.exec(id);
      if (!match) return;
      const [seed, week, n] = match.slice(1).map(Number);
      if (
        !Number.isSafeInteger(seed) ||
        seed > 4294967295 ||
        !Number.isSafeInteger(week) ||
        week > 100000 ||
        n >= slots.length * 4
      )
        return;
      if (cache.has(id)) return cache.get(id);
      const slot = slots[Math.floor(n / 4)],
        variant = n % 4,
        h = G.AuctionContent.hash(id),
        factor = 0.96 + (h % 81) / 1000,
        maker = makers[(h >>> 8) % makers.length];
      let base,
        name,
        effects,
        extra = {};
      if (slot === "shell") {
        const t = shells[(week * 4 + variant + (seed % 3) * 4) % shells.length];
        [
          name,
          extra.kit,
          extra.price,
          effects,
          extra.minChassis,
          extra.maxRim,
          extra.widthExtra,
        ] = t;
        base = original(
          "shell-" +
            { touring: "touring", wide: "wide", race: "race" }[extra.kit],
        );
        extra.shellVariant = shells.indexOf(t);
      } else {
        const family = families[slot][(variant + week) % 4];
        [base, name, effects] = family;
        base = original(base);
      }
      const fx = Object.fromEntries(
        Object.entries(effects).map(([k, v]) => [
          k,
          Math.round(v * factor * 1000) / 1000,
        ]),
      );
      const d = {
        ...base,
        ...extra,
        id,
        slot,
        effects: fx,
        models: null,
        requires: [],
        workbench: true,
        weekly: true,
        week,
        maker,
        accent: palette[h % palette.length],
        price: Math.max(
          220,
          Math.round(
            ((extra.price || base.price) * (0.98 + variant * 0.14) * factor) /
              10,
          ) * 10,
        ),
        name: `${maker.split(" ")[0]} · ${name} · S${week + 1}-${n + 1}`,
        description: `${name}: ${C.effectText(fx)}. Serie semanal ${week + 1}; sus ventajas y contrapartidas afectan a la configuración y a la carrera.`,
      };
      // La ECU se adapta a cada plataforma; el turbo conserva exigencias reales.
      if (slot === "boost")
        Object.assign(d, {
          minChassis: variant % 2 ? 1 : 0,
          minCooling: 1.6,
          needsClutch: true,
          engineStage: undefined,
        });
      if (slot === "wheels" && name === "Rally") d.rim = 16;
      if (cache.size >= 2048) cache.delete(cache.keys().next().value);
      cache.set(id, d);
      return d;
    },
    effectText(fx) {
      const labels = {
        hp: "CV",
        weight: "kg",
        grip: "agarre",
        brakes: "frenada",
        top: "km/h punta",
        reliability: "fiabilidad",
        stress: "carga térmica",
        cooling: "refrigeración",
        acceleration: "transmisión de par",
        tireWear: "desgaste gomas",
        bodyWear: "exposición al daño",
      };
      return Object.entries(fx)
        .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${labels[k] || k}`)
        .join(" · ");
    },
    definitions(s) {
      if (!G.Commerce?.enabled(s)) return P.catalogue;
      return [
        ...Array.from({ length: slots.length * 4 }, (_, n) =>
          this.definition(this.id(s.seed, s.commerce.week, n)),
        ),
        ...P.catalogue,
      ];
    },
  });
  P.definition = (id) => original(id) || C.definition(id);
})();
