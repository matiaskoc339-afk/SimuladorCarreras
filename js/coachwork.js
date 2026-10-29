"use strict";
(() => {
  const G = RCS,
    W = G.Workshop,
    P = G.Parts;
  const extraSlots = {
    engine: "Motor preparado",
    shell: "Carrocería",
    chassis: "Refuerzos de chasis",
    wheels: "Llantas",
  };
  Object.assign(P.slots, extraSlots);
  const definitions = [
    {
      id: "shell-touring",
      name: "Carrocería Touring",
      slot: "shell",
      component: "body",
      price: 980,
      labor: 260,
      days: 3,
      effects: { weight: 3, bodyWear: -0.05 },
      kit: "touring",
      maxRim: 18,
      widthExtra: 0,
      description:
        "Paneles, faldones y pasos de rueda adaptados a la plataforma del coche. Admite llantas de hasta 18 pulgadas; conserva el chasis y la identidad del vehículo.",
    },
    {
      id: "shell-wide",
      name: "Carrocería ensanchada",
      slot: "shell",
      component: "body",
      price: 2100,
      labor: 550,
      days: 4,
      effects: { weight: 8, grip: 1.5, top: -2 },
      kit: "wide",
      maxRim: 19,
      widthExtra: 0.08,
      minChassis: 1,
      description:
        "Aletas anchas, entradas de aire y faldones específicos para cada modelo. Requiere refuerzo de chasis y admite llantas de hasta 19 pulgadas.",
    },
    {
      id: "shell-race",
      name: "Carrocería de competición",
      slot: "shell",
      component: "body",
      price: 4400,
      labor: 900,
      days: 5,
      effects: { weight: -10, grip: 2, top: -3, bodyWear: 0.1 },
      kit: "race",
      maxRim: 20,
      widthExtra: 0.12,
      minChassis: 2,
      description:
        "Paneles ligeros, capó ventilado y vías ensanchadas. Requiere chasis de nivel 2; menos peso a cambio de mayor exposición al daño.",
    },
    {
      id: "chassis-street",
      name: "Refuerzo de chasis · Calle",
      slot: "chassis",
      component: "body",
      price: 900,
      labor: 260,
      days: 3,
      effects: { weight: 8, bodyWear: -0.1 },
      chassisTier: 1,
      description:
        "Refuerzos de torretas y uniones. Habilita preparaciones de nivel 1 y hasta 240 CV, o la capacidad original si es mayor.",
    },
    {
      id: "chassis-sport",
      name: "Refuerzo de chasis · Sport",
      slot: "chassis",
      component: "body",
      price: 2300,
      labor: 550,
      days: 4,
      effects: { weight: 18, bodyWear: -0.18, grip: 1 },
      chassisTier: 2,
      description:
        "Refuerzo estructural y jaula interior. Admite preparaciones de nivel 2 y hasta 320 CV, conservando las exigencias de refrigeración y frenada.",
    },
    {
      id: "chassis-race",
      name: "Refuerzo de chasis · Competición",
      slot: "chassis",
      component: "body",
      price: 5800,
      labor: 1050,
      days: 6,
      effects: { weight: 28, bodyWear: -0.25, grip: 2 },
      chassisTier: 3,
      description:
        "Estructura de competición para la plataforma existente. Habilita hasta 350 CV. La masa adicional también afecta a la aceleración.",
    },
    {
      id: "engine-club",
      name: "Motor preparado · Etapa 1",
      slot: "engine",
      component: "engine",
      price: 1550,
      labor: 400,
      days: 3,
      effects: { hp: 25, weight: 5, stress: 0.12, reliability: -1 },
      engineStage: 1,
      description:
        "Preparación del motor compatible con la plataforma: +25 CV de juego. Cambia potencia y carga térmica; no convierte el coche en otro modelo.",
    },
    {
      id: "engine-sport",
      name: "Motor preparado · Etapa 2",
      slot: "engine",
      component: "engine",
      price: 3500,
      labor: 650,
      days: 4,
      effects: { hp: 65, weight: 12, stress: 0.25, reliability: -3 },
      engineStage: 2,
      minChassis: 1,
      minCooling: 1.6,
      needsClutch: true,
      description:
        "Conjunto de motor de mayor rendimiento. Exige refuerzo, embrague reforzado y radiador suficiente. Consulta el límite final del chasis.",
    },
    {
      id: "engine-race",
      name: "Motor preparado · Etapa 3",
      slot: "engine",
      component: "engine",
      price: 8200,
      labor: 1200,
      days: 6,
      effects: { hp: 120, weight: 22, stress: 0.44, reliability: -6 },
      engineStage: 3,
      minChassis: 2,
      minCooling: 1.9,
      needsClutch: true,
      minBrakeTier: 1,
      description:
        "Preparación extrema: exige chasis Sport, embrague, refrigeración profesional y frenos mejorados. Los límites de cada competición siguen aplicándose.",
    },
    {
      id: "wheels-sport",
      name: "Llantas Sport · 17 pulgadas",
      slot: "wheels",
      component: "suspension",
      price: 650,
      labor: 80,
      days: 1,
      effects: { weight: -3, grip: 1 },
      rim: 17,
      description:
        "Juego completo de llantas de cinco radios. En utilitarios pequeños necesita la carrocería Touring para dejar espacio. No incluye neumáticos nuevos.",
    },
    {
      id: "wheels-forged",
      name: "Llantas forjadas · 18 pulgadas",
      slot: "wheels",
      component: "suspension",
      price: 1450,
      labor: 110,
      days: 2,
      effects: { weight: -5, grip: 1.5 },
      rim: 18,
      description:
        "Juego de llantas ligeras de diez radios. Más espacio para frenos grandes; exige suficiente espacio en los pasos de rueda. No rejuvenece las gomas.",
    },
    {
      id: "brakes-four",
      name: "Frenos de cuatro pistones · 320 mm",
      slot: "brakes",
      component: "brakes",
      price: 1450,
      labor: 260,
      days: 3,
      effects: { brakes: 20, weight: 5 },
      brakeTier: 2,
      minChassis: 1,
      minRim: 17,
      description:
        "Kit completo con pinzas rojas y discos de mayor diámetro. Necesita llantas de 17 pulgadas y refuerzo de chasis.",
    },
    {
      id: "brakes-six",
      name: "Frenos de seis pistones · 350 mm",
      slot: "brakes",
      component: "brakes",
      price: 2700,
      labor: 380,
      days: 3,
      effects: { brakes: 28, weight: 8 },
      brakeTier: 3,
      minChassis: 2,
      minRim: 18,
      description:
        "Frenada de competición con discos grandes. Exige chasis Sport y llantas de al menos 18 pulgadas.",
    },
    {
      id: "cooling-pro",
      name: "Refrigeración profesional",
      slot: "cooling",
      component: "cooling",
      price: 1180,
      labor: 220,
      days: 3,
      effects: { cooling: 1.1, weight: 7, reliability: 3 },
      description:
        "Radiador y conductos de gran capacidad. Prepara el sistema para motores de etapa 3; también añade peso.",
    },
    {
      id: "aero-adjustable",
      name: "Aerodinámica ajustable",
      slot: "aero",
      component: "body",
      price: 1750,
      labor: 350,
      days: 3,
      effects: { grip: 10, top: -10, weight: 7 },
      minChassis: 1,
      minShell: 1,
      description:
        "Splitter y alerón regulable adaptados al modelo. Requiere carrocería modificada y refuerzo. Aporta apoyo a velocidad alta, con más resistencia.",
    },
  ];
  for (const d of definitions)
    P.catalogue.push({ models: null, ...d, workbench: true });
  const M = (G.Coachwork = {
    extraSlots: Object.keys(extraSlots),
    definitions,
    enabled: (s) => s?.workbench?.version === 1,
    initialize(s) {
      if (this.enabled(s)) return s;
      G.assert(
        s.version === 3 && !s.race,
        "Termina la carrera antes de activar el taller visual.",
      );
      s.workbench = { version: 1, seededDay: s.day };
      for (const d of definitions)
        for (let i = 0; i < 3; i++)
          s.parts.push({
            id: G.uid(s, "part"),
            definitionId: d.id,
            companyId: null,
            carId: null,
            reservedFor: null,
            condition: 100,
          });
      for (const car of s.cars) this.sync(s, car);
      return s;
    },
    defs(s, installed) {
      return Object.values(installed)
        .map((id) =>
          P.definition(s.parts.find((p) => p.id === id)?.definitionId),
        )
        .filter(Boolean);
    },
    spec(s, car, installed = car.installed) {
      const defs = this.defs(s, installed),
        shell = defs.find((d) => d.slot === "shell"),
        chassis = defs.find((d) => d.slot === "chassis"),
        wheels = defs.find((d) => d.slot === "wheels"),
        engine = defs.find((d) => d.slot === "engine"),
        brakes = defs.find((d) => d.slot === "brakes"),
        model = G.Data.models[car.modelIndex],
        factoryRim =
          car.base.brakes >= 75 ? 17 : car.base.brakes >= 65 ? 16 : 14,
        factoryClearance =
          (model.length || 4.1) >= 4.2 || car.base.brakes >= 70 ? 18 : 16,
        tier = chassis?.chassisTier || 0,
        oemPower = Math.min(350, Math.max(180, car.base.hp * 1.35));
      return {
        version: 1,
        shellId: shell?.id || null,
        style: shell?.kit || "factory",
        chassisTier: tier,
        powerLimit: Math.max(oemPower, [oemPower, 240, 320, 350][tier]),
        wheelId: wheels?.id || null,
        rim: wheels?.rim || factoryRim,
        maxRim: shell?.maxRim || factoryClearance,
        widthExtra: shell?.widthExtra || 0,
        engineStage: engine?.engineStage || 0,
        aero: defs.some((d) => d.slot === "aero"),
        brakeTier:
          brakes?.brakeTier || (brakes ? 1 : car.base.brakes >= 75 ? 1 : 0),
        coolingCapacity:
          1 + defs.reduce((n, d) => n + (d.effects.cooling || 0), 0),
        clutch: defs.some((d) => d.slot === "clutch"),
        modified: Object.keys(installed).length > 0,
      };
    },
    sync(s, car) {
      if (!this.enabled(s)) return;
      const spec = this.spec(s, car);
      if (spec.modified) car.coachwork = spec;
      else delete car.coachwork;
    },
    visual(s, car, installed = car.installed) {
      return {
        ...car,
        installed: { ...installed },
        coachwork: this.spec(s, car, installed),
      };
    },
    rules(s, car, installed) {
      const defs = this.defs(s, installed),
        hasNew = defs.some((d) => d.workbench);
      if (!this.enabled(s))
        return hasNew
          ? "Activa el taller visual para utilizar este catálogo."
          : "";
      const spec = this.spec(s, car, installed),
        tier = { factory: 0, touring: 1, wide: 2, race: 3 }[spec.style];
      for (const d of defs) {
        if ((d.minChassis || 0) > spec.chassisTier)
          return `${d.name}: necesita refuerzo de chasis de nivel ${d.minChassis}.`;
        if ((d.minShell || 0) > tier)
          return `${d.name}: necesita una carrocería modificada.`;
        if ((d.minRim || 0) > spec.rim)
          return `${d.name}: necesita llantas de al menos ${d.minRim} pulgadas.`;
        if ((d.minCooling || 0) > spec.coolingCapacity + 1e-8)
          return `${d.name}: necesita refrigeración nominal ×${d.minCooling.toFixed(1)} o superior.`;
        if (d.needsClutch && !spec.clutch)
          return `${d.name}: necesita un embrague reforzado.`;
        if ((d.minBrakeTier || 0) > spec.brakeTier)
          return `${d.name}: necesita un kit de frenos mejorado.`;
      }
      if (spec.rim > spec.maxRim)
        return `Las llantas de ${spec.rim} pulgadas no caben en esta carrocería (máximo ${spec.maxRim}). Monta un conjunto de carrocería adecuado.`;
      const hp = W.configuration(s, car, installed).hp;
      if (hp > spec.powerLimit + 0.0001)
        return `Esta preparación alcanza ${hp.toFixed(1)} CV y supera los ${Math.round(spec.powerLimit)} CV nominales del chasis. Instala un refuerzo superior.`;
      return "";
    },
    fit(s, car, unit) {
      const d = P.definition(unit?.definitionId);
      if (
        d?.workbench &&
        ["chassis", "shell"].includes(d.slot) &&
        car.components.body < 65
      )
        return "Repara la carrocería hasta el 65 % antes de montar paneles o refuerzos.";
      return "";
    },
    inspect(s, car, unit) {
      const d = P.definition(unit?.definitionId);
      G.assert(car && d, "Selecciona un coche y una pieza.");
      const installed = { ...car.installed, [d.slot]: unit.id },
        before = W.configuration(s, car),
        after = W.configuration(s, car, installed),
        old = s.parts.find((p) => p.id === car.installed[d.slot]);
      return {
        car,
        unit,
        def: d,
        installed,
        before,
        after,
        old,
        appearance: this.spec(s, car, installed),
        reason: W.fit(s, car, unit),
      };
    },
    quote(s, carId, partId) {
      G.ensurePlayable(s);
      G.assert(this.enabled(s), "Activa el taller visual.");
      const car = s.cars.find(
          (c) => c.id === carId && c.companyId === s.playerId,
        ),
        unit = s.parts.find((p) => p.id === partId);
      G.assert(
        unit &&
          [null, s.playerId].includes(unit.companyId) &&
          !unit.carId &&
          !unit.reservedFor,
        "La pieza está instalada, reservada o pertenece a otro equipo.",
      );
      W.available(s, car);
      G.assert(
        !G.Market.locked(s, car.id),
        "Retira la inscripción antes de modificar el coche.",
      );
      const q = this.inspect(s, car, unit);
      G.assert(!q.reason, q.reason);
      const purchase =
        unit.companyId === null
          ? Math.round((q.def.price * unit.condition) / 100)
          : 0;
      if (purchase)
        G.assert(
          W.occupied(s) < G.player(s).sparesCapacity,
          "El almacén está lleno: necesitas espacio para reservar la pieza.",
        );
      const total = purchase + q.def.labor,
        plan = G.Staff.plan(s, s.playerId, "install", q.def.days);
      G.assert(
        G.player(s).balance >= total,
        "No tienes fondos para la pieza y su mano de obra.",
      );
      return {
        ...q,
        purchase,
        labor: q.def.labor,
        total,
        days: plan.days,
        end: s.day + plan.days,
      };
    },
    install(s, carId, partId) {
      const q = this.quote(s, carId, partId);
      if (q.purchase) W.buy(s, partId);
      return W.install(s, carId, partId);
    },
    removeQuote(s, carId, slot) {
      const car = s.cars.find(
        (c) => c.id === carId && c.companyId === s.playerId,
      );
      W.available(s, car);
      G.assert(
        !G.Market.locked(s, car.id),
        "Retira la inscripción antes de modificar el coche.",
      );
      const unit = s.parts.find((p) => p.id === car.installed[slot]),
        d = P.definition(unit?.definitionId);
      G.assert(d, "Ese alojamiento conserva el equipo original.");
      const installed = { ...car.installed };
      delete installed[slot];
      const reason = W.rules(s, car, installed);
      G.assert(!reason, reason);
      G.assert(
        W.occupied(s) < G.player(s).sparesCapacity,
        "No hay espacio para recuperar la pieza desmontada.",
      );
      const cost = Math.round(d.labor * 0.6),
        days = G.Staff.plan(s, s.playerId, "remove", 1).days;
      G.assert(
        G.player(s).balance >= cost,
        "No hay fondos para el desmontaje.",
      );
      return {
        car,
        unit,
        def: d,
        cost,
        days,
        end: s.day + days,
        installed,
        after: W.configuration(s, car, installed),
      };
    },
    validate(s) {
      if (s.workbench === undefined) return;
      G.assert(
        this.enabled(s) &&
          Number.isInteger(s.workbench.seededDay) &&
          s.workbench.seededDay >= 0 &&
          s.workbench.seededDay <= s.day,
        "Formato de taller visual inválido.",
      );
      for (const car of s.cars) {
        const spec = this.spec(s, car);
        G.assert(
          spec.modified
            ? JSON.stringify(car.coachwork) === JSON.stringify(spec)
            : car.coachwork === undefined,
          "Carrocería o preparación visual incoherente con las piezas instaladas.",
        );
      }
      if (s.race?.workbenchVersion) {
        G.assert(
          s.race.workbenchVersion === 1,
          "Versión de preparación en carrera inválida.",
        );
        for (const a of s.race.entrants) {
          const car = s.cars.find((c) => c.id === a.carId),
            expected = car.coachwork;
          G.assert(
            JSON.stringify(a.coachwork) === JSON.stringify(expected),
            "Preparación visual de carrera incoherente.",
          );
          if (expected) {
            const meta = s.race.replay.cars.find((m) => m.carId === a.carId);
            G.assert(
              a.width ===
                G.Data.models[car.modelIndex].width + expected.widthExtra &&
                meta?.width === a.width &&
                JSON.stringify(meta.coachwork) === JSON.stringify(expected),
              "Preparación visual o anchura de repetición inválida.",
            );
          }
        }
      }
    },
  });
  const rules = W.rules;
  W.rules = function (s, car, installed) {
    return rules.call(this, s, car, installed) || M.rules(s, car, installed);
  };
  const fit = W.fit;
  W.fit = function (s, car, unit) {
    return (
      fit.call(this, s, car, unit) || (car && unit ? M.fit(s, car, unit) : "")
    );
  };
  const recalculate = W.recalculate;
  W.recalculate = function (s, car) {
    recalculate.call(this, s, car);
    M.sync(s, car);
  };
  const snapshot = W.raceSnapshot;
  W.raceSnapshot = function (s, car) {
    const a = snapshot.call(this, s, car);
    return car.coachwork ? { ...a, coachwork: G.clone(car.coachwork) } : a;
  };
  const start = G.Race.start;
  G.Race.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (M.enabled(s)) {
      r.workbenchVersion = 1;
      for (const a of r.entrants) {
        if (a.coachwork) a.width += a.coachwork.widthExtra;
        const meta = r.replay.cars.find((m) => m.carId === a.carId);
        if (meta && a.coachwork) {
          meta.coachwork = G.clone(a.coachwork);
          meta.width = a.width;
        }
      }
    }
    return r;
  };
  const create = G.createGame;
  G.createV80Game = create;
  G.createGame = (...args) => M.initialize(create(...args));
})();
