"use strict";
(() => {
  const G = RCS;
  const families = {
    city: {
      name: "Urbanos deportivos",
      shape: "hatch",
      design: "city",
      hp: 90,
      step: 22,
      weight: 980,
      top: 175,
      grip: 69,
      brakes: 68,
      price: 14000,
      priceStep: 6500,
      length: 3.65,
      width: 1.7,
      cap: 350,
    },
    rally: {
      name: "Rally y tracción integral",
      shape: "hatch",
      design: "hatch",
      hp: 190,
      step: 32,
      weight: 1230,
      top: 215,
      grip: 81,
      brakes: 80,
      price: 65000,
      priceStep: 21000,
      length: 4.03,
      width: 1.81,
      cap: 480,
    },
    sport: {
      name: "Coupés deportivos",
      shape: "coupe",
      design: "fastback",
      hp: 230,
      step: 38,
      weight: 1180,
      top: 245,
      grip: 83,
      brakes: 82,
      price: 72000,
      priceStep: 26000,
      length: 4.24,
      width: 1.86,
      cap: 600,
    },
    muscle: {
      name: "Muscle y V8",
      shape: "coupe",
      design: "classic",
      hp: 350,
      step: 52,
      weight: 1540,
      top: 265,
      grip: 78,
      brakes: 81,
      price: 105000,
      priceStep: 39000,
      length: 4.78,
      width: 1.94,
      cap: 850,
    },
    grandtourer: {
      name: "Gran turismo de lujo",
      shape: "coupe",
      design: "coupe",
      hp: 410,
      step: 46,
      weight: 1620,
      top: 280,
      grip: 84,
      brakes: 88,
      price: 185000,
      priceStep: 58000,
      length: 4.88,
      width: 1.96,
      cap: 900,
    },
    supercar: {
      name: "Superdeportivos",
      shape: "coupe",
      design: "mid",
      hp: 480,
      step: 62,
      weight: 1320,
      top: 305,
      grip: 89,
      brakes: 92,
      price: 290000,
      priceStep: 110000,
      length: 4.52,
      width: 1.97,
      cap: 1100,
    },
    gt: {
      name: "GT de competición",
      shape: "coupe",
      design: "mid",
      hp: 480,
      step: 27,
      weight: 1260,
      top: 285,
      grip: 94,
      brakes: 98,
      price: 245000,
      priceStep: 71000,
      length: 4.61,
      width: 1.98,
      cap: 850,
    },
    hypercar: {
      name: "Hiperdeportivos",
      shape: "coupe",
      design: "mid",
      hp: 800,
      step: 58,
      weight: 1340,
      top: 345,
      grip: 94,
      brakes: 100,
      price: 680000,
      priceStep: 330000,
      length: 4.73,
      width: 2,
      cap: 1350,
    },
    prototype: {
      name: "Prototipos de resistencia",
      shape: "coupe",
      design: "mid",
      hp: 620,
      step: 44,
      weight: 970,
      top: 315,
      grip: 98,
      brakes: 104,
      price: 470000,
      priceStep: 250000,
      length: 4.92,
      width: 2,
      cap: 1150,
    },
    formula: {
      name: "Monoplazas · Fórmula",
      shape: "roadster",
      design: "open",
      hp: 650,
      step: 80,
      weight: 810,
      top: 305,
      grip: 97,
      brakes: 110,
      price: 650000,
      priceStep: 0,
      length: 5.18,
      width: 2,
      cap: 1350,
    },
  };
  const names = {
    city: [
      "Metro RS",
      "Pico Sprint",
      "Nimble S",
      "Bairro GT",
      "Breeze R",
      "Swiftlet Cup",
    ],
    rally: [
      "Roca RX",
      "Delta Cross",
      "Tundra R",
      "Sierra AWD",
      "Storm RX",
      "Terra Evo",
    ],
    sport: ["Arc RS", "Kestrel", "Veloce S", "Nexus R", "Solstice", "Vector R"],
    muscle: [
      "Thunder V8",
      "Iron Cobra",
      "Falcon XR",
      "Charger S",
      "Blackwood",
      "Atlas 660",
    ],
    grandtourer: [
      "Imperiale",
      "Grand Azure",
      "Velour GT",
      "Meridian",
      "Sovereign",
      "Riviera R",
    ],
    supercar: [
      "Fulmine R",
      "Nemesis",
      "Tachyon",
      "Mirage",
      "Vulcano",
      "Spectra",
    ],
    gt: [
      "Corsa GT3",
      "Enduro GT",
      "Vantage GT",
      "Apex GT3",
      "Stratos GT",
      "GTR Evo",
    ],
    hypercar: [
      "Eclipse H",
      "Aether",
      "Astral X",
      "Celeste",
      "Leviathan",
      "Zenith H",
    ],
    prototype: [
      "P620",
      "Endurance P",
      "Aurora LMP",
      "Centaur P",
      "Orion P",
      "Helios P",
    ],
    formula: [
      "F-Junior",
      "F-Club",
      "F-Continental",
      "F-Grand Prix",
      "F-Hybrid",
      "F-Ultimate",
    ],
  };
  const brands = ["Aster", "Kairo", "Aurelia", "Valmont", "Orsini", "Vesper"],
    models = [],
    byFamily = {};
  for (const [family, f] of Object.entries(families)) {
    byFamily[family] = [];
    for (let i = 0; i < 6; i++) {
      const index = G.Data.models.length,
        formula = family === "formula",
        prototype = family === "prototype",
        competition = formula || prototype || family === "gt";
      const factory = {
        cooling: formula
          ? 3.2
          : prototype
            ? 2.8
            : competition
              ? 2.2
              : 1.1 + f.hp / 800,
        acceleration: formula
          ? 1.5
          : prototype
            ? 1.32
            : competition
              ? 1.17
              : 1 + f.hp / 2500,
        braking: formula ? 1.85 : prototype ? 1.45 : competition ? 1.2 : 1,
        downforce: formula ? 15 : prototype ? 11 : competition ? 6 : 0,
      };
      G.Data.models.push({
        brand: brands[i],
        model: names[family][i],
        generation: competition ? "Competition 2027" : "Gran Serie 2027",
        year: 2027,
        shape: f.shape,
        design: f.design,
        visualStyle: f.design,
        hp: f.hp + f.step * i,
        weight: f.weight + (formula ? -3 : 8) * i,
        top: f.top + (formula ? 12 : 7) * i,
        grip: f.grip + i * 0.6,
        brakes: f.brakes + i * 0.6,
        reliability: competition ? 88 - i * 0.5 : 91 - i * 0.6,
        value: formula
          ? [650000, 1100000, 1800000, 3200000, 4800000, 6500000][i]
          : f.price + f.priceStep * i,
        length: f.length + i * 0.035,
        width: f.width,
        showroomOnly: true,
        grandFamily: family,
        grandVariant: i,
        factory,
      });
      models.push(index);
      byFamily[family].push(index);
    }
  }
  const groups = {
    club: {
      name: "Club avanzado",
      scale: 1,
      families: [
        "club",
        "city",
        "rally",
        "sport",
        "muscle",
        "grandtourer",
        "supercar",
        "gt",
        "hypercar",
      ],
      stage: 1,
    },
    gt: {
      name: "GT Motorsport",
      scale: 7,
      families: [
        "sport",
        "muscle",
        "grandtourer",
        "supercar",
        "gt",
        "hypercar",
      ],
      stage: 2,
    },
    prototype: {
      name: "Endurance P",
      scale: 22,
      families: ["prototype", "hypercar", "supercar"],
      stage: 3,
    },
    formula: { name: "Fórmula GP", scale: 65, families: ["formula"], stage: 3 },
  };
  const slots = {
    engine: [
      "Unidad de potencia",
      "engine",
      2200,
      { hp: 32, weight: 4, stress: 0.12 },
    ],
    intake: [
      "Admisión y conductos",
      "engine",
      420,
      { hp: 4, top: 1, stress: 0.02 },
    ],
    exhaust: [
      "Escape de titanio",
      "engine",
      650,
      { hp: 5, weight: -5, stress: 0.03 },
    ],
    ecu: [
      "Gestión electrónica",
      "engine",
      950,
      { hp: 8, top: 2, stress: 0.06 },
    ],
    boost: [
      "Sistema de sobrealimentación",
      "engine",
      1850,
      { hp: 26, weight: 7, stress: 0.16, reliability: -1 },
    ],
    clutch: [
      "Embrague y transmisión de par",
      "transmission",
      750,
      { acceleration: 0.07, weight: 1 },
    ],
    differential: [
      "Diferencial de tracción",
      "transmission",
      820,
      { grip: 2, acceleration: 0.03, weight: 2 },
    ],
    suspension: [
      "Suspensión de competición",
      "suspension",
      1150,
      { grip: 5, weight: 2, bodyWear: 0.04 },
    ],
    brakes: ["Conjunto de frenada", "brakes", 1080, { brakes: 12, weight: 2 }],
    tires: [
      "Neumáticos de alto rendimiento",
      "tires",
      650,
      { grip: 4, tireWear: 0.08 },
    ],
    aero: [
      "Paquete aerodinámico",
      "body",
      1380,
      { grip: 4, top: -1, weight: 2 },
    ],
    body: [
      "Aligerado estructural",
      "body",
      1350,
      { weight: -35, bodyWear: 0.08 },
    ],
    cooling: [
      "Refrigeración integrada",
      "cooling",
      980,
      { cooling: 0.8, weight: 5, reliability: 1 },
    ],
    shell: [
      "Carrocería de competición",
      "body",
      2350,
      { grip: 2, weight: -12, bodyWear: 0.04 },
    ],
    chassis: [
      "Estructura y célula de seguridad",
      "body",
      2750,
      { grip: 1, weight: 10, bodyWear: -0.12 },
    ],
    wheels: [
      "Llantas forjadas",
      "suspension",
      1150,
      { weight: -7, grip: 1, acceleration: 0.02 },
    ],
  };
  const parts = [];
  for (const [group, g] of Object.entries(groups))
    for (const [slot, [label, component, base, effects]] of Object.entries(
      slots,
    ))
      for (let variant = 0; variant < 3; variant++) {
        const purpose = ["Resistencia", "Equilibrio", "Ataque"][variant],
          power = [0.76, 1, 1.2][variant],
          fx = { ...effects };
        if (fx.hp)
          fx.hp = Math.round(fx.hp * (1 + Math.log2(g.scale) * 0.42) * power);
        if (fx.grip)
          fx.grip =
            Math.round(fx.grip * (1 + Math.log2(g.scale) * 0.1) * power * 10) /
            10;
        if (fx.brakes)
          fx.brakes = Math.round(
            fx.brakes * (1 + Math.log2(g.scale) * 0.14) * power,
          );
        if (fx.top > 0)
          fx.top = Math.round(fx.top * (1 + g.stage * 0.3) * power);
        if (fx.cooling)
          fx.cooling = Math.round(fx.cooling * (1 + g.stage * 0.18) * 10) / 10;
        if (variant === 0) {
          fx.reliability = (fx.reliability || 0) + 3;
          fx.weight = (fx.weight || 0) + 2;
          fx.tireWear = (fx.tireWear || 0) - 0.09;
        }
        if (variant === 2) {
          fx.reliability = (fx.reliability || 0) - 2;
          fx.stress = (fx.stress || 0) + 0.035;
          fx.tireWear = (fx.tireWear || 0) + 0.08;
        }
        const d = {
          id: `grand-${group}-${slot}-${variant}`,
          name: `${g.name} · ${label} · ${purpose}`,
          slot,
          component,
          models: null,
          grand: true,
          group,
          families: g.families,
          price:
            Math.round((base * g.scale * [0.88, 1, 1.24][variant]) / 10) * 10,
          labor: Math.round((base * g.scale * 0.1) / 10) * 10,
          days: Math.min(
            10,
            1 +
              g.stage +
              (["engine", "shell", "chassis"].includes(slot) ? 2 : 0),
          ),
          effects: fx,
          workbench: true,
          description: `${purpose}: ${G.WeeklyContent.effectText(fx)}. Plataforma ${g.name}; consulta compatibilidad, estructura, refrigeración y desgaste.`,
        };
        if (slot === "engine")
          Object.assign(d, {
            engineStage: g.stage,
            minChassis: Math.max(0, g.stage - 1),
            minCooling: 1.2 + g.stage * 0.35,
            needsClutch: g.stage > 1,
          });
        if (slot === "boost")
          Object.assign(d, {
            minChassis: Math.max(0, g.stage - 1),
            minCooling: 1.4 + g.stage * 0.25,
            needsClutch: true,
          });
        if (slot === "chassis")
          Object.assign(d, {
            chassisTier: g.stage,
            powerLimit: [0, 480, 1050, 1350][g.stage],
          });
        if (slot === "shell")
          Object.assign(d, {
            kit: group === "club" ? "wide" : "race",
            maxRim: group === "formula" ? 18 : 21,
            widthExtra: group === "formula" ? 0 : 0.04 + variant * 0.015,
            minChassis: g.stage > 1 ? g.stage - 1 : 0,
          });
        if (slot === "wheels")
          Object.assign(d, {
            rim: group === "formula" ? 18 : 17 + g.stage + Math.min(1, variant),
            minShell: 0,
          });
        if (slot === "brakes")
          Object.assign(d, {
            brakeTier: g.stage,
            minRim: group === "formula" ? 18 : 16 + g.stage,
          });
        parts.push(d);
      }
  const C = (G.GrandContent = {
    families,
    models,
    byFamily,
    groups,
    parts,
    definitions: Object.fromEntries(parts.map((d) => [d.id, d])),
    family(car) {
      return (
        (
          G.Data.models[car.modelIndex] ||
          G.Data.models.find(
            (m) =>
              m.model === car.model && (!car.brand || m.brand === car.brand),
          )
        )?.grandFamily ||
        car.grandFamily ||
        "club"
      );
    },
    factory(car) {
      return (
        (
          G.Data.models[car.modelIndex] ||
          G.Data.models.find(
            (m) =>
              m.model === car.model && (!car.brand || m.brand === car.brand),
          )
        )?.factory || null
      );
    },
  });
  const definition = G.Parts.definition;
  G.Parts.definition = function (id) {
    return typeof id === "string" && Object.hasOwn(C.definitions, id)
      ? C.definitions[id]
      : definition.call(this, id);
  };
})();
