"use strict";
(() => {
  const G = RCS;
  G.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  G.clone = (x) => JSON.parse(JSON.stringify(x));
  G.uid = (s, prefix) => `${prefix}-${++s.sequence}`;
  G.random = (s) => {
    let t = (s.rng += 0x6d2b79f5);
    s.rng >>>= 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  G.integer = (s, a, b) => a + Math.floor(G.random(s) * (b - a + 1));
  G.dateAt = (day) =>
    new Date(Date.parse(G.Data.startDate + "T12:00:00Z") + day * 86400000);
  G.dayOf = (year, month, date) =>
    Math.round(
      (Date.UTC(year, month, date, 12) -
        Date.parse(G.Data.startDate + "T12:00:00Z")) /
        86400000,
    );
  G.player = (s) => s.companies.find((c) => c.id === s.playerId);
  G.ownedDrivers = (s, id = s.playerId) =>
    s.drivers.filter((d) => d.companyId === id);
  G.ownedCars = (s, id = s.playerId) =>
    s.cars.filter((c) => c.companyId === id);
  G.assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  G.news = (s, category, title, body, target = "news", entityId = null) => {
    s.news.unshift({
      id: G.uid(s, "news"),
      day: s.day,
      category,
      title,
      body,
      target,
      entityId,
    });
    if (s.news.length > 200) s.news.length = 200;
  };
  G.makeCar = (s, companyId, model = 0, color = "#e7ac50") => {
    const m = G.Data.models[model];
    return {
      id: G.uid(s, "car"),
      companyId,
      modelIndex: model,
      color,
      km: G.integer(s, 42000, 105000),
      condition: G.integer(s, 79, 92),
      tires: 100,
      repair: null,
      history: [],
      starts: 0,
      wins: 0,
      ...G.clone(m),
    };
  };
  G.makeSeason = (s, year) => ({
    year,
    name: "Copa Club de Turismos",
    phase: "active",
    events: G.Data.tracks.map((track, i) => ({
      id: G.uid(s, "event"),
      track: i,
      round: i + 1,
      day: G.dayOf(year, track.month, track.date),
      status: "scheduled",
      entry: null,
      results: [],
    })),
    standings: Object.fromEntries(
      s.companies
        .filter((c) => c.status === "active")
        .map((c) => [c.id, { points: 0, wins: 0, podiums: 0, starts: 0 }]),
    ),
  });
  G.createGame = (name, logo = "", seed = Date.now() >>> 0) => {
    G.assert(
      typeof name === "string" &&
        name.trim().length >= 2 &&
        name.trim().length <= 32,
      "El nombre debe tener entre 2 y 32 caracteres.",
    );
    const s = {
      version: 3,
      seed: seed >>> 0,
      rng: seed >>> 0,
      sequence: 0,
      day: 0,
      playerId: "player",
      logo,
      companies: [],
      drivers: [],
      cars: [],
      news: [],
      history: [],
      negotiations: {},
      race: null,
      job: null,
      lastJob: -7,
      status: "active",
      totals: { income: 0, expense: 0 },
      research: [],
      employees: [],
      market: [],
      relations: [],
      unread: true,
    };
    s.companies.push({
      id: "player",
      name: name.trim(),
      color: "#e7ac50",
      balance: 12000,
      level: 1,
      reputation: 2,
      status: "active",
      ledger: [],
      debtDays: 0,
      driverCapacity: 2,
      carCapacity: 2,
      facilities: { garage: 1, workshop: 1 },
      salaryAccrued: {},
      personality: "Jugador",
      stats: { starts: 0, wins: 0, podiums: 0 },
    });
    G.Data.rivals.forEach(([name, color, personality, model]) => {
      const c = {
        id: G.uid(s, "company"),
        name,
        color,
        personality,
        level: 1,
        reputation: G.integer(s, 4, 15),
        balance: G.integer(s, 11000, 19000),
        status: "active",
        ledger: [],
        debtDays: 0,
        salaryAccrued: {},
        stats: { starts: 0, wins: 0, podiums: 0 },
      };
      s.companies.push(c);
      const d = G.Drivers.generate(s, c.id);
      d.contract = {
        salary: d.ask,
        bonus: 0,
        start: 0,
        end: 365,
        role: "principal",
        accrued: 0,
      };
      s.drivers.push(d);
      s.cars.push(G.makeCar(s, c.id, model, color));
    });
    s.cars.unshift(G.makeCar(s, "player", 0));
    for (let i = 0; i < 4; i++) s.drivers.push(G.Drivers.generate(s, null));
    s.season = G.makeSeason(s, 2026);
    G.news(
      s,
      "Compañía",
      `${name.trim()} abre las puertas de su primer garaje.`,
      "Un Civic usado, herramientas básicas y una temporada por delante. La Copa Club permite inscribirse hasta el día de cada carrera. Empieza por negociar con un piloto.",
      "hq",
      "player",
    );
    G.news(
      s,
      "Competición",
      "El Olivar abrirá la Copa Club el 18 de enero.",
      "Seis pruebas, ocho escuderías y un presupuesto ajustado. Máximo 210 CV y un coche por equipo. La inscripción cuesta $250 más $120 de transporte.",
      "competition",
    );
    G.World.initialize(s);
    G.Workshop.initialize(s);
    return s;
  };
  G.nextEvent = (s) => s.season.events.find((e) => e.status === "scheduled");
  G.leaderboard = (s) =>
    Object.entries(s.season.standings)
      .map(([id, stats]) => ({
        ...stats,
        company: s.companies.find((c) => c.id === id),
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.wins - a.wins ||
          a.company.id.localeCompare(b.company.id),
      );
  G.ensurePlayable = (s) =>
    G.assert(
      s.status === "active",
      "La compañía está en bancarrota. Puedes conservar su archivo o comenzar otra partida.",
    );
})();
