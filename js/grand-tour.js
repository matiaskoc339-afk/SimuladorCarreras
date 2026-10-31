"use strict";
(() => {
  const G = RCS,
    C = G.GrandContent,
    W = G.Workshop,
    L = G.Competition;
  const divisions = {
    gt: {
      name: "Copa Nacional GT",
      fee: 14500,
      transport: 1500,
      maxHP: 650,
      minHP: 300,
      rating: 45,
      health: 80,
      brakes: 85,
      suspension: 80,
      tires: 55,
      prizes: [100000, 80000, 65000, 50000, 40000, 30000, 25000, 20000],
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
    },
    prototype: {
      name: "Campeonato de Prototipos",
      fee: 37000,
      transport: 3000,
      maxHP: 1150,
      minHP: 500,
      rating: 62,
      health: 85,
      brakes: 90,
      suspension: 85,
      tires: 65,
      prizes: [260000, 200000, 160000, 125000, 95000, 70000, 50000, 35000],
      families: ["prototype", "hypercar", "supercar"],
    },
    formula: {
      name: "Gran Campeonato de Fórmula",
      fee: 84000,
      transport: 6000,
      maxHP: 1350,
      minHP: 600,
      rating: 75,
      health: 90,
      brakes: 95,
      suspension: 90,
      tires: 75,
      prizes: [650000, 480000, 360000, 280000, 210000, 155000, 120000, 100000],
      families: ["formula"],
    },
  };
  const T = (G.GrandTour = {
    divisions,
    enabled: (s) => s?.grandTour?.version === 1,
    makeCar(s, model, companyId = null) {
      const m = G.Data.models[model];
      return {
        ...G.clone(m),
        id: G.uid(s, "car"),
        modelIndex: model,
        companyId,
        color:
          G.AuctionContent.palette[model % G.AuctionContent.palette.length],
        km: 0,
        condition: 100,
        tires: 100,
        oemTires: 100,
        repair: null,
        starts: 0,
        wins: 0,
        base: Object.fromEntries(W.attributes.map((k) => [k, m[k]])),
        components: Object.fromEntries(
          Object.keys(G.Parts.components).map((k) => [k, 100]),
        ),
        installed: {},
        upgradeValue: 0,
        factoryDelivery: companyId === null,
        history: [
          { day: s.day, type: "Configuración de fábrica · Gran Serie" },
        ],
      };
    },
    showroom(s) {
      if (!T.enabled(s)) return;
      for (const model of C.models)
        if (
          !s.market.some(
            (l) =>
              l.kind === "new" &&
              s.cars.find((c) => c.id === l.carId)?.modelIndex === model,
          )
        ) {
          const car = T.makeCar(s, model);
          s.cars.push(car);
          s.market.push({
            id: G.uid(s, "listing"),
            carId: car.id,
            sellerId: null,
            price: car.value,
            day: s.day,
            kind: "new",
          });
        }
    },
    season(s, season = s.season) {
      for (const e of season.events)
        if (e.status === "scheduled" && !e.entry) {
          if (e.cup === "pro") {
            e.grandVersion = 1;
            e.grandDivision = "regional";
          }
          if (
            e.cup === "national" &&
            !season.events.some(
              (o) =>
                o.cup === "national" && (o.status !== "scheduled" || o.entry),
            )
          ) {
            e.grandVersion = 1;
            e.grandDivision = s.grandTour.division;
          }
        }
    },
    divisionReason(s) {
      return s.race
        ? "Termina la carrera antes de elegir categoría."
        : G.Auctions.active(s)
          ? "Termina la subasta antes de elegir categoría."
          : s.season.events.some(
                (e) =>
                  e.cup === "national" && (e.entry || e.status !== "scheduled"),
              )
            ? "La categoría nacional queda fijada al inscribirse o disputarse su primera prueba. Podrás elegir otra al abrir la siguiente temporada."
            : "";
    },
    choose(s, key) {
      G.assert(
        T.enabled(s) && Object.hasOwn(divisions, key),
        "Categoría de élite desconocida.",
      );
      G.assert(!T.divisionReason(s), T.divisionReason(s));
      s.grandTour.division = key;
      T.season(s);
    },
    teams(s) {
      const template = s.companies.find(
          (c) => c.id !== s.playerId && !c.privateer,
        ),
        names = [
          "Aurelia Corse",
          "Kairo GP Works",
          "Valmont Racing",
          "Orsini Scuderia",
          "Vesper Dynamics",
          "Aster Competition",
        ];
      for (let n = 0; n < 6; n++) {
        const c = {
          ...G.clone(template),
          id: G.uid(s, "company"),
          name: names[n],
          color: G.AuctionContent.palette[n],
          personality: ["Prestigiosa", "Desarrolladora", "Agresiva"][n % 3],
          level: 8,
          reputation: 65 + n * 3,
          balance: 4500000 + n * 650000,
          status: "active",
          ledger: [],
          debtDays: 0,
          salaryAccrued: {},
          stats: { starts: 110, wins: 32, podiums: 70 },
          driverCapacity: 5,
          carCapacity: 8,
          facilities: { garage: 4, workshop: 4 },
          owner: `Consejo ${names[n]}`,
          founded: s.day - 4015,
          decisions: [],
          nextDecision: s.day + 3,
          lastJob: s.day - 7,
          job: null,
          lastOffer: s.day - 60,
          sparesCapacity: 32,
          grandTeam: true,
          grandIndex: n,
        };
        s.companies.push(c);
        s.grandTour.teams.push(c.id);
        s.expansion.sites[c.id] = {
          buildings: { garage: 4, workshop: 4, warehouse: 4, office: 4 },
          base: { cars: 2, drivers: 2, spares: 8 },
          project: null,
          highestLevel: 8,
          levelChanged: s.day,
          crisisDays: 0,
          lastReview: s.day,
          history: [],
        };
        for (const cup of Object.values(s.season.cups))
          cup.standings[c.id] = {
            points: 0,
            qualifying: 0,
            wins: 0,
            starts: 0,
          };
        s.season.standings[c.id] = {
          points: 0,
          wins: 0,
          podiums: 0,
          starts: 0,
        };
        s.competitions.licenses[c.id] = true;
        s.competitions.streetPoints[c.id] = 100;
        s.competitions.proPoints[c.id] = 50;
        for (const [seat, rating] of [
          ["gt", 55 + n * 3],
          ["elite", 76 + n * 3],
        ]) {
          const d = G.Drivers.generate(s, c.id);
          d.age = seat === "gt" ? 23 + n : 29 + n;
          d.experience = seat === "gt" ? 4 + n : 9 + n;
          d.potential = 98;
          d.grandSeat = seat;
          for (const k of G.Drivers.stats)
            d.stats[k] = G.clamp(
              rating + (G.AuctionContent.hash(d.id + k) % 7) - 3,
              3,
              97,
            );
          d.ask = G.Challenge.driverAsk(d);
          d.contract = {
            ...d.contract,
            salary: d.ask,
            bonus: 0,
            accrued: 0,
            role: seat === "gt" ? "reserva" : "principal",
            period: "day",
            start: s.day,
            end: s.day + 1095,
          };
          d.salaryPeriod = "day";
          d.transferListed = false;
          d.lastTransfer = null;
          s.drivers.push(d);
          G.DriverAgency.signed(s, d);
        }
        for (const [family, variant] of [
          ["rally", n % 4],
          ["gt", n],
          ["prototype", n],
          ["formula", n],
        ])
          s.cars.push(T.makeCar(s, C.byFamily[family][variant], c.id));
        for (const role of ["mechanic", "engineer", "strategist", "trainer"]) {
          const e = G.Staff.generate(s, role);
          s.employees.push(e);
          const p = G.Professionals.profile(s, e.id);
          p.level = (role === "trainer" ? 2 : 3) + (n % 2);
          e.skill = 70 + n * 3;
          e.salaryPeriod = "day";
          e.ask = G.Challenge.staffAsk(s, e);
          G.Staff.offer(
            s,
            e.id,
            { salary: Math.ceil(e.ask * 1.15), months: 12, bonus: 0 },
            c.id,
          );
        }
      }
    },
    initialize(s) {
      if (s.grandTour !== undefined) {
        G.assert(T.enabled(s), "Versión de Gran Serie incompatible.");
        return s;
      }
      G.assert(
        G.DriverWorld.enabled(s) && !s.race && !G.Auctions.active(s),
        "Termina la actividad en directo antes de ampliar el catálogo y las categorías.",
      );
      const rng = s.rng;
      s.grandTour = { version: 1, since: s.day, division: "gt", teams: [] };
      G.Commerce.stock(s);
      T.showroom(s);
      T.teams(s);
      T.season(s);
      s.rng = rng;
      G.news(
        s,
        "Competición",
        "Gran Serie: del GT al monoplaza.",
        "El concesionario recibe 60 modelos y el taller 192 referencias de distintas plataformas. La categoría nacional ofrece GT, Prototipos o Fórmula, con sus tasas, premios y verificación. Los equipos de fábrica ya tienen sus propios coches y presupuesto.",
        "competition",
      );
      return s;
    },
    validate(s) {
      if (s.grandTour === undefined) {
        G.assert(
          !s.race?.grandVersion &&
            !s.cars.some((c) => C.models.includes(c.modelIndex)) &&
            !(s.parts || []).some(
              (p) => G.Parts.definition(p.definitionId)?.grand,
            ),
          "Falta la versión de Gran Serie.",
        );
        return;
      }
      const x = s.grandTour;
      G.assert(
        T.enabled(s) &&
          Number.isInteger(x.since) &&
          x.since >= 0 &&
          x.since <= s.day &&
          Object.hasOwn(divisions, x.division) &&
          Array.isArray(x.teams) &&
          x.teams.length === 6 &&
          new Set(x.teams).size === 6 &&
          x.teams.every((id) =>
            s.companies.some((c) => c.id === id && c.grandTeam === true),
          ),
        "Formato de Gran Serie inválido.",
      );
      for (const e of s.season.events)
        if (e.grandVersion !== undefined)
          G.assert(
            e.grandVersion === 1 &&
              ((e.cup === "pro" && e.grandDivision === "regional") ||
                (e.cup === "national" &&
                  Object.hasOwn(divisions, e.grandDivision))),
            "Categoría de carrera inválida.",
          );
      if (s.race?.grandVersion !== undefined)
        G.assert(
          s.race.grandVersion === 1 &&
            s.race.skillsVersion === 1 &&
            s.season.events.some(
              (e) => e.id === s.race.eventId && e.grandVersion === 1,
            ),
          "Carrera de élite incoherente.",
        );
      if (s.race?.grandVersion === 1)
        for (const a of s.race.entrants)
          G.assert(
            JSON.stringify(a.performance?.factory || null) ===
              JSON.stringify(C.factory(a)),
            "Plataforma de fábrica de carrera inválida.",
          );
    },
  });
  const create = G.createGame;
  G.createV160Game = create;
  G.createGame = (...args) => T.initialize(create(...args));
  const supply = G.WeeklyContent.definitions;
  G.WeeklyContent.definitions = function (s) {
    return [...supply.call(this, s), ...(T.enabled(s) ? C.parts : [])];
  };
  const showroom = G.Commerce.showroom;
  G.Commerce.showroom = function (s) {
    showroom.call(this, s);
    T.showroom(s);
  };
  const makeSeason = L.makeSeason;
  L.makeSeason = function (s, year) {
    const season = makeSeason.call(this, s, year);
    if (T.enabled(s)) T.season(s, season);
    return season;
  };
  const rule = L.rule;
  L.rule = function (e) {
    if (e.grandVersion !== 1) return rule.call(this, e);
    if (e.cup === "pro")
      return {
        ...L.rules.pro,
        fee: 2800,
        transport: 450,
        maxHP: 350,
        prizes: [10000, 8000, 6500, 5000, 3800, 2800, 2000, 1500],
        rating: 26,
      };
    return { ...L.rules.national, ...divisions[e.grandDivision] };
  };
  const fee = L.fee;
  L.fee = function (e) {
    if (e.grandVersion !== 1) return fee.call(this, e);
    const r = L.rule(e);
    return Math.round((r.fee + r.transport) * (e.final ? 1.5 : 1));
  };
  const technical = L.technical;
  L.technical = function (s, e, car, d) {
    if (e.grandVersion === 1 && G.Drivers.rating(d) < L.rule(e).rating)
      return `Esta categoría necesita un piloto de valoración ${L.rule(e).rating}; ${d.name} tiene ${G.Drivers.rating(d)}. Entrénalo o elige otro piloto.`;
    const base = technical.call(this, s, e, car, d);
    if (base || e.grandVersion !== 1) return base;
    const r = L.rule(e);
    if (e.cup !== "national") return "";
    if (!r.families.includes(C.family(car)))
      return `${r.name}: esta plataforma no pertenece a la categoría. Consulta los GT, prototipos o monoplazas adecuados en el concesionario.`;
    if (car.hp < r.minHP)
      return `Esta categoría exige al menos ${r.minHP} CV; tu coche tiene ${Math.round(car.hp)}. Prepara una plataforma compatible antes de inscribirte.`;
    const checks = [
      ["estado", car.condition, r.health],
      ["frenos", car.components.brakes, r.brakes],
      ["suspensión", car.components.suspension, r.suspension],
      ["neumáticos", car.tires, r.tires],
    ].filter(([, v, min]) => v < min);
    return checks.length
      ? `Verificación de élite: ${checks.map(([name, v, min]) => `${name} ${v.toFixed(1)} %, mínimo ${min} %`).join("; ")}. Repara o cambia gomas antes de inscribirte.`
      : "";
  };
  const lineup = L.lineup;
  L.lineup = function (s, id, e) {
    const c = s.companies.find((c) => c.id === id);
    if (e.grandVersion !== 1) return lineup.call(this, s, id, e);
    const r = L.rule(e),
      seat = e.cup === "pro" || e.grandDivision === "gt" ? "gt" : "elite",
      drivers = G.ownedDrivers(s, id)
        .slice()
        .sort(
          (a, b) =>
            (b.grandSeat === seat) - (a.grandSeat === seat) ||
            G.Drivers.rating(b) - G.Drivers.rating(a),
        );
    for (const driver of drivers) {
      const car = G.ownedCars(s, id)
        .filter(
          (car) =>
            !G.Market.listed(s, car.id) && !this.technical(s, e, car, driver),
        )
        .sort((a, b) => G.Companies.carRating(b) - G.Companies.carRating(a))[0];
      if (car) return { driver, car };
    }
    return { driver: null, car: null };
  };
  const enters = L.enters;
  L.enters = function (s, c, e) {
    if (
      c.grandTeam &&
      e.cup === "pro" &&
      e.grandVersion === 1 &&
      ![(e.round - 1) % 6, e.round % 6, (e.round + 1) % 6].includes(
        c.grandIndex,
      )
    )
      return false;
    return enters.call(this, s, c, e);
  };
  const spec = G.Coachwork.spec;
  G.Coachwork.spec = function (s, car, installed = car.installed) {
    const v = spec.call(this, s, car, installed);
    if (!T.enabled(s)) return v;
    const family = C.family(car),
      factory = C.factory(car),
      defs = G.Coachwork.defs(s, installed),
      chassis = defs.find((d) => d.slot === "chassis"),
      cap = C.families[family]?.cap || 400,
      competition = ["formula", "prototype", "gt"].includes(family),
      tier =
        family === "formula" || family === "prototype"
          ? 3
          : competition
            ? 2
            : 0;
    if (!factory && !defs.some((d) => d.grand)) return v;
    return {
      ...v,
      chassisTier: Math.max(v.chassisTier, tier),
      powerLimit: Math.min(
        cap,
        Math.max(v.powerLimit, car.base.hp * 1.15, chassis?.powerLimit || 0),
      ),
      rim: defs.some((d) => d.slot === "wheels")
        ? v.rim
        : family === "formula"
          ? 18
          : factory
            ? competition
              ? 18
              : 19
            : v.rim,
      maxRim:
        family === "formula" ? 18 : factory ? Math.max(v.maxRim, 21) : v.maxRim,
      coolingCapacity: v.coolingCapacity + (factory?.cooling || 1) - 1,
      clutch: v.clutch || competition || (!!factory && car.base.hp >= 400),
      brakeTier: Math.max(v.brakeTier, competition ? 2 : 0),
    };
  };
  const rules = W.rules;
  W.rules = function (s, car, installed) {
    if (!T.enabled(s)) return rules.call(this, s, car, installed);
    const family = C.family(car),
      defs = G.Coachwork.defs(s, installed);
    for (const d of defs) {
      if (d.grand && !d.families.includes(family))
        return `${d.name}: no es compatible con esta plataforma (${C.families[family]?.name || "Club"}).`;
      if (["formula", "prototype"].includes(family) && !d.grand)
        return "Esta plataforma de competición requiere piezas específicas de Fórmula GP o Endurance P.";
    }
    const base = rules.call(this, s, car, installed);
    if (base && !base.startsWith("El límite de preparación es 350 CV"))
      return base;
    const v = W.configuration(s, car, installed);
    if (v.weight < Math.max(650, car.base.weight * 0.78))
      return "El aligerado supera la capacidad de esta plataforma.";
    return G.Coachwork.rules(s, car, installed);
  };
  const configuration = W.configuration;
  W.configuration = function (s, car, ...args) {
    const v = configuration.call(this, s, car, ...args),
      f = T.enabled(s) && C.factory(car);
    if (f) {
      v.cooling += f.cooling - 1;
      v.acceleration *= f.acceleration;
    }
    return v;
  };
  const capture = G.Performance.capture;
  G.Performance.capture = function (s, car) {
    const p = capture.call(this, s, car),
      f = T.enabled(s) && C.factory(car);
    if (f) p.factory = G.clone(f);
    return p;
  };
  const refresh = G.Performance.refresh;
  G.Performance.refresh = function (a) {
    refresh.call(this, a);
    const f = a.performance?.factory;
    if (f) {
      a.cooling += f.cooling - 1;
      a.acceleration *= f.acceleration;
      a.performance.downforce += f.downforce;
    }
  };
  const brakes = G.Performance.brakeFactor;
  G.Performance.brakeFactor = function (a) {
    return brakes.call(this, a) * (a.performance?.factory?.braking || 1);
  };
  const start = G.Race.start;
  G.Race.start = function (s, ...args) {
    const r = start.call(this, s, ...args),
      e = s.season.events.find((e) => e.id === r.eventId);
    if (e.grandVersion === 1) r.grandVersion = 1;
    return r;
  };
  const candidates = G.AI.candidates;
  G.AI.candidates = function (s, c) {
    const rows = candidates.call(this, s, c);
    return c.grandTeam
      ? rows.filter(
          (q) =>
            q.action !== "venta" ||
            !G.ownedCars(s, c.id).some(
              (car) =>
                car.id === q.targetId && C.models.includes(car.modelIndex),
            ),
        )
      : rows;
  };
  const upgrades = W.aiCandidates;
  W.aiCandidates = function (s, c, budget, days, profile) {
    const original = upgrades.call(this, s, c, budget, days, profile);
    if (!T.enabled(s)) return original;
    const rows = original.filter(
      (q) => !["repuesto", "instalación"].includes(q.action),
    );
    if (
      days <= 4 ||
      profile.car < 1 ||
      G.Facilities.workload(s, c.id) >= G.Facilities.bays(s, c.id)
    )
      return rows;
    const definitions = G.WeeklyContent.definitions(s),
      free = new Map(),
      stored = new Map();
    for (const p of s.parts)
      if (
        !p.carId &&
        !p.reservedFor &&
        !p.auctionOwnerId &&
        !G.Auctions.locked(s, "part", p.id) &&
        p.condition >= 70
      ) {
        if (p.companyId === null) free.set(p.definitionId, p);
        if (p.companyId === c.id) stored.set(p.definitionId, p);
      }
    for (const car of G.ownedCars(s, c.id).filter(
      (car) =>
        !car.repair &&
        !G.Market.listed(s, car.id) &&
        !G.Market.locked(s, car.id),
    )) {
      const family = C.family(car),
        max =
          family === "formula"
            ? 1350
            : family === "prototype" || family === "hypercar"
              ? 1150
              : car.base.hp > 350 || family === "gt"
                ? 650
                : 350,
        before = W.configuration(s, car),
        options = [];
      for (const d of definitions) {
        if (
          car.installed[d.slot] ||
          (d.grand && !d.families.includes(family)) ||
          (["formula", "prototype"].includes(family) && !d.grand)
        )
          continue;
        const own = stored.get(d.id),
          unit = own || free.get(d.id);
        if (!unit) continue;
        const cost =
          (own ? 0 : Math.round((d.price * unit.condition) / 100)) + d.labor;
        if (
          cost > budget ||
          (!own && W.occupied(s, c.id) >= c.sparesCapacity) ||
          W.fit(s, car, unit)
        )
          continue;
        const after = W.configuration(s, car, {
          ...car.installed,
          [d.slot]: unit.id,
        });
        if (after.hp > max) continue;
        const gain =
          (after.hp / after.weight - before.hp / before.weight) * 120 +
          (after.grip - before.grip) * 0.45 +
          (after.brakes - before.brakes) * 0.2 +
          (after.reliability - before.reliability) * 0.2 +
          (after.cooling - before.cooling) * 2;
        if (gain > 0.1) options.push({ d, unit, own, cost, gain });
      }
      options.sort(
        (a, b) =>
          b.gain / b.cost - a.gain / a.cost || a.d.id.localeCompare(b.d.id),
      );
      const q = options[0];
      if (q)
        rows.push({
          action: q.own ? "instalación" : "repuesto",
          utility: 44 + q.gain * profile.car,
          reason:
            "Preparar la plataforma con una pieza compatible y dentro de su categoría deportiva.",
          targetId: car.id,
          cost: q.own
            ? q.d.labor
            : Math.round((q.d.price * q.unit.condition) / 100),
          run: () =>
            q.own
              ? W.install(s, car.id, q.unit.id, c.id)
              : W.buy(s, q.unit.id, c.id),
        });
    }
    return rows;
  };
  const maintenance = L.maintenance;
  L.maintenance = function (s, c) {
    if (!T.enabled(s)) return maintenance.call(this, s, c);
    const next = s.season.events.find(
      (e) =>
        e.grandVersion === 1 &&
        e.status === "scheduled" &&
        e.cup !== "street" &&
        !L.eligible(s, e, c.id) &&
        (!c.grandTeam ||
          e.cup !== "pro" ||
          [(e.round - 1) % 6, e.round % 6, (e.round + 1) % 6].includes(
            c.grandIndex,
          )),
    );
    if (
      !next ||
      next.day - s.day > 14 ||
      next.day - s.day < 3 ||
      G.Facilities.workload(s, c.id) >= G.Facilities.bays(s, c.id)
    )
      return [];
    const r = L.rule(next),
      car = G.ownedCars(s, c.id)
        .filter(
          (car) =>
            !car.repair &&
            !G.Market.listed(s, car.id) &&
            car.hp <= r.maxHP &&
            (!r.minHP || car.hp >= r.minHP) &&
            (!r.families || r.families.includes(C.family(car))),
        )
        .sort((a, b) => G.Companies.carRating(b) - G.Companies.carRating(a))[0];
    if (!car) return [];
    const component =
      car.components.brakes < Math.min(100, (r.brakes || 77) + 3)
        ? "brakes"
        : car.components.suspension < Math.min(100, (r.suspension || 72) + 3)
          ? "suspension"
          : car.condition < Math.min(100, (r.health || 72) + 3)
            ? "all"
            : car.tires < (r.tires || 35)
              ? "tires"
              : null;
    if (!component) return [];
    const cost =
      component === "tires"
        ? W.tireCost(s, car)
        : W.repairQuote(car, component);
    if (
      c.balance <
      cost + L.fee(next) + (G.Companies.monthly(s, c.id) / 30) * 7
    )
      return [];
    return [
      {
        action: "verificación técnica",
        utility: 125,
        reason:
          "Cumplir el estado exigido por la categoría y conservar la reserva salarial.",
        targetId: car.id,
        cost,
        run: () =>
          component === "tires"
            ? G.Economy.tires(s, car.id, c.id)
            : W.repair(s, car.id, component, c.id),
      },
    ];
  };
})();
