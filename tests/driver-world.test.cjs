const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ evolution: true });
  return { G, s: G.createGame("Talento y rivales", "", seed) };
}
function hire(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  let q = G.Drivers.offer(s, d.id, d.ask, 12);
  if (!q.accepted) q = G.Drivers.offer(s, d.id, q.salary, 12);
  assert.equal(q.accepted, true);
  return d;
}
function coach(G, s) {
  const e = s.employees
    .filter((e) => e.role === "trainer")
    .sort((a, b) => a.ask - b.ask)[0];
  assert.equal(
    G.Staff.offer(s, e.id, {
      salary: Math.ceil(e.ask * 1.15),
      months: 12,
      bonus: 0,
    }).accepted,
    true,
  );
  return e;
}
function race() {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const d = hire(G, s);
  G.Calendar.advance(s, G.nextEvent(s).day);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  const r = G.Race.start(s, e.id),
    a = r.entrants.find((a) => a.companyId === s.playerId);
  return { G, s, d, r, a };
}
function ability(a, id) {
  a.abilities.ids = [id];
  a.abilities.nextUpdate = 0;
  a.abilities.active = [];
}
test("Migrar conserva todos los datos y RNG; las asignaciones y consultas son reproducibles", () => {
  const { G } = engine({ skills: true }),
    s = G.createGame("Empresa anterior", "", 1470),
    before = json(s);
  G.DriverWorld.initialize(s);
  const copy = json(s);
  delete copy.driverWorld;
  assert.deepEqual(copy, before);
  G.Storage.validate(s);
  const raw = JSON.stringify(s);
  for (const d of s.drivers) {
    assert.deepEqual(
      json(G.DriverAbilities.ids(s, d)),
      json(G.DriverAbilities.seeded(s, d)),
    );
    G.DriverAbilities.list(s, d);
  }
  assert.equal(JSON.stringify(s), raw);
  const signatures = new Set(
    Array.from({ length: 500 }, (_, n) =>
      G.DriverAbilities.seeded(s, { id: `candidate-${n}` }).join("/"),
    ),
  );
  assert.ok(signatures.size > 400);
});
test("Hay 108 habilidades nuevas, con nombres únicos, efecto definido y combinaciones de una a tres", () => {
  const { G, s } = game(),
    all = G.DriverAbilities.catalog;
  assert.equal(all.length, 108);
  assert.equal(new Set(all.map((x) => x.name)).size, 108);
  assert.equal(new Set(all.map((x) => x.id)).size, 108);
  assert.equal(all.filter((x) => x.kind === "situational").length, 96);
  for (const x of all) assert.ok(x.description.length > 30);
  for (const d of s.drivers) {
    const ids = G.DriverAbilities.ids(s, d);
    assert.ok(ids.length >= 1 && ids.length <= 3);
    assert.equal(ids.length, new Set(ids).size);
  }
});
test("El informe de negociación requiere un ojeador contratado", () => {
  const { G, s } = game();
  assert.equal(G.DriverWorld.scout(s), false);
  G.player(s).balance = 100000;
  const e = s.employees
    .filter((e) => e.role === "scout")
    .sort((a, b) => a.ask - b.ask)[0];
  G.Staff.offer(s, e.id, {
    salary: Math.ceil(e.ask * 1.15),
    months: 3,
    bonus: 0,
  });
  assert.equal(G.DriverWorld.scout(s), true);
});
test("Llegar a una carrera avisa; avanzar otro día la disputa sin el jugador y permite seguir entrenando", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const d = hire(G, s),
    e = coach(G, s),
    o = {
      driverId: d.id,
      coachId: e.id,
      carId: G.ownedCars(s)[0].id,
      laps: 10,
      intensity: "easy",
      focus: "control",
    },
    j = G.Practice.start(s, o),
    event = G.nextEvent(s);
  const result = G.Calendar.advance(s, event.day);
  assert.equal(result.blocked, false);
  assert.equal(result.raceToday, true);
  assert.equal(s.day, event.day);
  assert.equal(event.status, "scheduled");
  assert.equal(j.daysWorked, event.day);
  G.Calendar.advance(s, 1);
  assert.equal(s.day, event.day + 1);
  assert.equal(s.race, null);
  assert.equal(event.status, "skipped");
  assert.ok(event.results.length >= 4);
  assert.ok(event.results.every((r) => r.companyId !== "player"));
  assert.equal(d.starts, 0);
  assert.ok(j.daysWorked >= event.day);
  G.Storage.validate(s);
});
test("Las noticias pendientes son solo las de hoy y su lectura se conserva sin tocar RNG", () => {
  const { G, s } = game();
  G.DriverWorld.markRead(s);
  const rng = s.rng;
  assert.equal(G.DriverWorld.unread(s), 0);
  G.news(s, "Agenda", "Aviso de hoy", "Texto");
  assert.equal(G.DriverWorld.unread(s), 1);
  G.DriverWorld.markRead(s);
  assert.equal(s.rng, rng);
  assert.equal(G.DriverWorld.unread(s), 0);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.equal(G.DriverWorld.unread(restored), 0);
  s.day++;
  assert.equal(G.DriverWorld.unread(s), 0);
  G.news(s, "Agenda", "Nuevo día", "Texto");
  assert.equal(G.DriverWorld.unread(s), 1);
});
test("Cada habilidad situacional modifica el atributo efectivo al cumplirse su condición", () => {
  const { G, s, r, a } = race(),
    B = G.DriverAbilities,
    t = G.Data.tracks[r.track],
    base = Object.fromEntries(G.Drivers.stats.map((k) => [k, 50]));
  for (const skill of B.catalog.filter((x) => x.kind === "situational")) {
    ability(a, skill.id);
    a.abilities.baseStats = { ...base };
    r.time = 10;
    r.weather.wetness = 0.5;
    r.weather.trackTemp = 40;
    a.tires = 35;
    a.puncture = false;
    a.fatigue = 45;
    let point = 0;
    const tight = skill.condition !== "sweeper";
    while (
      point < t.length &&
      !(tight
        ? G.Racecraft.sample(r.track, point).limit < 24
        : G.Racecraft.sample(r.track, point).limit >= 24 &&
          G.Racecraft.sample(r.track, point).limit < 45)
    )
      point += 5;
    a.progress = t.length * (t.laps - 1) + point;
    const others = r.entrants.filter((o) => o !== a);
    others.forEach((o, i) => {
      o.progress = a.progress - 10 - i * 10;
      o.dnf = false;
      o.finishTime = null;
    });
    if (skill.condition === "chase")
      others
        .slice(0, 4)
        .forEach((o, i) => (o.progress = a.progress + 10 + i * 10));
    assert.equal(B.context(r, a)[skill.condition], true, skill.name);
    B.before(s, r, a);
    assert.equal(a.stats[skill.stat], 50 + skill.amount, skill.name);
    assert.ok(a.abilities.active.includes(skill.id));
  }
});
test("Motivador aprovecha gomas gastadas pero no restaura neumáticos ni actúa con pinchazo", () => {
  const { G, s, r, a } = race();
  ability(a, "motivador");
  a.tires = 20;
  r.time = 10;
  G.DriverAbilities.before(s, r, a);
  assert.ok(a.stats.pace > a.abilities.baseStats.pace);
  assert.equal(a.tires, 20);
  a.tires = 0;
  G.DriverWorld.puncture(r, a);
  r.time = 11;
  G.DriverAbilities.before(s, r, a);
  assert.equal(a.stats.pace, a.abilities.baseStats.pace);
  assert.equal(a.puncture, true);
});
test("Mal perdedor dura 24 segundos y no se vuelve a activar al quedar último otra vez", () => {
  const { G, s, r, a } = race();
  ability(a, "mal-perdedor");
  a.progress = 0;
  r.entrants
    .filter((o) => o !== a)
    .forEach((o, i) => (o.progress = 100 + i * 10));
  r.time = 36;
  G.DriverAbilities.before(s, r, a);
  assert.equal(a.abilities.boostUsed, true);
  assert.equal(a.abilities.boostUntil, 60);
  assert.equal(a.stats.pace, Math.min(100, a.abilities.baseStats.pace + 14));
  r.time = 61;
  G.DriverAbilities.before(s, r, a);
  assert.equal(a.stats.pace, a.abilities.baseStats.pace);
  r.time = 80;
  G.DriverAbilities.before(s, r, a);
  assert.equal(a.abilities.boostUntil, 60);
});
test("Testarudo mejora la defensa bajo ataque y mantiene una contrapartida en adelantamiento", () => {
  const { G, s, r, a } = race();
  ability(a, "testarudo");
  a.abilities.baseStats.overtake = 50;
  const rear = r.entrants.find((o) => o !== a);
  a.progress = 200;
  rear.progress = 190;
  r.time = 10;
  G.DriverAbilities.before(s, r, a);
  assert.equal(
    a.stats.defense,
    Math.min(100, a.abilities.baseStats.defense + 8),
  );
  assert.equal(a.stats.overtake, 48);
});
test("Drifting permite rotación desde Control 45 y la lluvia sigue impidiéndola", () => {
  const { G, r, a } = race();
  ability(a, "drifting");
  let point = 0;
  while (
    point < G.Data.tracks[r.track].length &&
    G.Racecraft.sample(r.track, point + 45).limit <=
      G.Racecraft.sample(r.track, point).limit + 2
  )
    point += 5;
  a.progress = point;
  a.speed = 10;
  a.stats.control = 45;
  a.directive.plan = { ...a.directive.plan, pace: 75, risk: 55 };
  a.tires = 100;
  r.weather.wetness = 0;
  a.skills.envelope = {
    physical: 60,
    driver: 45,
    apex: 30,
    cornerDistance: 0,
    turn: 0.03,
    grip: 1,
  };
  a.skills.execution.nextAttempt = 100;
  G.RaceSkills.motion(r, a, 40, 6, 3, 0.5, false);
  assert.ok(
    Math.abs(a.skills.rotation) > 0 && Math.abs(a.skills.rotation) < 0.1,
  );
  assert.equal(
    Math.sign(a.skills.rotation),
    Math.sign(G.Racecraft.sample(r.track, point).curvature),
  );
  r.weather.wetness = 0.7;
  G.RaceSkills.motion(r, a, 40, 6, 3, 0.5, false);
  assert.equal(a.skills.rotation, 0);
});
test("Tramposo prepara contacto físico; limpio y amarilla prevalecen", () => {
  const { G, r, a } = race(),
    front = r.entrants.find((o) => o !== a),
    c = { front: { b: front, gap: 7 }, yellow: false };
  ability(a, "tramposo");
  a.speed = 20;
  front.speed = 20;
  front.lateral = 1;
  a.directive.plan.risk = 90;
  a.directive.plan.tactic = "auto";
  a.skills.envelope.driver = 40;
  let found = false;
  for (let seed = 1; seed < 500 && !found; seed++) {
    a.abilities.rng = seed;
    a.abilities.nextDirty = 0;
    r.time = 10;
    const q = G.DriverAbilities.tactic(r, a, c, {
      target: 20,
      lateral: -2,
      passing: false,
    });
    found = q.lateral === front.lateral && q.passing;
  }
  assert.equal(found, true);
  assert.match(a.brain.intent, /contacto/);
  a.directive.plan.tactic = "clean";
  assert.equal(
    G.DriverAbilities.tactic(r, a, c, {
      target: 20,
      lateral: -2,
      passing: false,
    }).lateral,
    -2,
  );
  a.directive.plan.tactic = "auto";
  c.yellow = true;
  assert.equal(
    G.DriverAbilities.tactic(r, a, c, {
      target: 20,
      lateral: -2,
      passing: false,
    }).lateral,
    -2,
  );
});
test("Una maniobra sucia produce contacto real y conserva las sanciones profesionales", () => {
  const { G, s, r, a } = race(),
    front = r.entrants.find((o) => o !== a);
  ability(a, "tramposo");
  r.cup = "pro";
  r.entrants = [a, front];
  r.replay.cars = r.replay.cars.filter((c) =>
    r.entrants.some((a) => a.carId === c.carId),
  );
  a.progress = 100;
  front.progress = 105;
  a.speed = 32;
  front.speed = 20;
  a.lateral = front.lateral = 0;
  a.abilities.dirtyUntil = 100;
  a.abilities.dirtyTarget = front.carId;
  a.abilities.nextDirty = 100;
  a.directive.plan = {
    ...a.directive.plan,
    pace: 90,
    risk: 90,
    tactic: "auto",
  };
  r.time = 10;
  G.Race.tick(s, 20);
  assert.ok((r.eventCounts.contact || 0) + (r.eventCounts.crash || 0) > 0);
  assert.ok(a.totalPenalty + front.totalPenalty >= 10);
  assert.ok(a.components.body < 100 || front.components.body < 100);
});
test("Un neumático al 0 pincha sin sorteo, obliga a frenar y no puede recuperar ritmo con habilidades", () => {
  const { G, s, r, a } = race();
  ability(a, "motivador");
  a.speed = 35;
  a.tires = 0;
  const before = r.rng;
  G.DriverWorld.puncture(r, a);
  assert.equal(a.puncture, true);
  assert.equal(r.rng, before);
  const events = r.eventCounts.puncture;
  G.DriverWorld.puncture(r, a);
  assert.equal(r.eventCounts.puncture, events);
  G.Race.tick(s, 200);
  assert.ok(a.speed <= 5.01, `${a.speed} m/s`);
  assert.ok(a.puncture || a.pit.phase !== "none");
  G.Storage.validate(s);
});
test("El pinchazo limita también el carril de boxes y desaparece al montar un juego sano", () => {
  const { G, s, r, a } = race();
  G.RaceWeekend.requestPit(s, "player", {
    compound: "fortis-hard",
    fuel: 0,
    repair: false,
    limiter: true,
  });
  a.pit.phase = "entry";
  a.progress = a.pit.entry + 10;
  a.speed = 5;
  a.tires = 0;
  G.DriverWorld.puncture(r, a);
  G.RaceWeekend.drivePit(s, r, a, 0.05);
  assert.ok(a.speed <= 5.00001);
  const set = s.raceSupplies.sets.find((t) => t.id === a.pit.setId);
  assert.ok(set && set.condition > 0);
  G.RaceWeekend.fitSet(s, r, a, set);
  assert.equal(a.puncture, false);
  assert.ok(a.tires > 0);
});
test("Autónomo mejora el aprendizaje real y la previsión coincide con el informe; se mantiene el potencial", () => {
  for (const id of ["start-pace", "autonomo"]) {
    const { G, s } = game();
    G.player(s).balance = 100000;
    s.season.events.forEach((e) => (e.day += 365));
    const d = hire(G, s),
      e = coach(G, s);
    s.driverWorld.talents[d.id] = [id];
    const o = {
        driverId: d.id,
        coachId: e.id,
        carId: G.ownedCars(s)[0].id,
        laps: 5,
        intensity: "normal",
        focus: "control",
      },
      q = G.Practice.quote(s, o),
      before = d.stats.control,
      j = G.Practice.start(s, o);
    assert.ok(q.estimatedGain >= 0.8 && q.estimatedGain < 2);
    G.Calendar.advance(s, j.days);
    assert.equal(j.status, "completed");
    assert.ok(Math.abs(d.stats.control - before - q.estimatedGain) < 1e-8);
    assert.ok(d.stats.control <= d.potential);
    assert.ok(j.gain > 0.8);
    G.Storage.validate(s);
  }
  const { G, s } = game(),
    d = s.drivers[0];
  s.driverWorld.talents[d.id] = ["autonomo"];
  assert.equal(G.DriverAbilities.learning(s, d, "control"), 1.35);
  assert.ok(G.Camps.learning(20, 10, "hard", 0.15, 12.9) <= 5);
});
test("Los rivales pagan programas, progresan, descansan y no duplican jornadas al consultar o cargar", () => {
  const { G, s } = game();
  s.season.events.forEach((e) => (e.day += 365));
  const balances = Object.fromEntries(
    s.companies.map((c) => [c.id, c.balance]),
  );
  s.day = 1;
  G.DriverWorld.daily(s);
  assert.ok(s.driverWorld.programs.length > 0);
  for (const j of s.driverWorld.programs) {
    assert.equal(
      s.companies.find((c) => c.id === j.companyId).balance,
      balances[j.companyId] - j.cost,
    );
    assert.equal(j.worked, 0);
  }
  const raw = JSON.stringify(s);
  G.DriverWorld.daily(s);
  assert.equal(JSON.stringify(s), raw);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 5);
  G.Calendar.advance(restored, 5);
  assert.deepEqual(json(s), json(restored));
  assert.ok(s.driverWorld.history.some((j) => j.worked === 5 && j.gain > 0.3));
  G.Storage.validate(s);
});
test("La competencia compra mejoras físicas con su caja y reserva, sin bonificación gratuita", () => {
  const { G, s } = game();
  s.season.events.forEach((e) => (e.day += 365));
  const c = s.companies.find(
    (c) =>
      c.id !== s.playerId &&
      c.personality === "Desarrolladora" &&
      G.ownedCars(s, c.id).length,
  );
  c.balance = 100000;
  const rows = G.AI.candidates(s, c),
    q = rows.find((q) => q.action === "repuesto" || q.action === "instalación");
  assert.ok(q);
  assert.ok(q.utility >= 103);
  const before = c.balance;
  const count = G.Workshop.inventory(s, c.id).length;
  q.run();
  assert.ok(c.balance < before);
  assert.ok(
    G.Workshop.inventory(s, c.id).length > count ||
      G.ownedCars(s, c.id).some((car) => car.repair),
  );
  G.Storage.validate(s);
});
test("Habilidades y efecto temporal guardan exactamente su ejecución sin modificar atributos permanentes", () => {
  const { G, s, r, a, d } = race();
  ability(a, "mal-perdedor");
  const before = json(d.stats);
  a.progress = 0;
  r.entrants
    .filter((o) => o !== a)
    .forEach((o, i) => (o.progress = 100 + i * 10));
  r.time = 36;
  G.DriverAbilities.before(s, r, a);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 400);
  G.Race.tick(restored, 400);
  assert.deepEqual(json(s), json(restored));
  assert.deepEqual(json(d.stats), before);
  G.Storage.validate(s);
});
test("La validación rechaza habilidades desconocidas y estados temporales corruptos", () => {
  const { G, s, a } = race();
  a.abilities.ids = ["inventada"];
  assert.throws(() => G.Storage.validate(s), /Habilidades de carrera/);
  a.abilities.ids = ["__proto__"];
  assert.throws(() => G.Storage.validate(s), /Habilidades de carrera/);
  a.abilities.ids = ["autonomo"];
  a.abilities.clock = Infinity;
  assert.throws(() => G.Storage.validate(s), /Habilidades de carrera/);
  a.abilities.clock = 0;
  s.driverWorld.talents[a.driverId] = ["inventada"];
  assert.throws(() => G.Storage.validate(s), /Habilidades asignadas/);
});
test("Una carrera auténtica 0.15 conserva sus resultados y estado completo originales", () => {
  const { G } = engine({ evolution: true }),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"),
    s = G.Storage.unpack(read("v150-race.json")).state,
    expected = JSON.parse(read("v150-expected.json"));
  assert.equal(s.driverWorld, undefined);
  assert.throws(() => G.DriverWorld.initialize(s), /actividad en directo/);
  for (let n = 0; n < 300 && !s.race.finished; n++) G.Race.tick(s, 400);
  assert.equal(s.race.finished, true);
  const results = G.Race.finish(s);
  assert.deepEqual(json(results), expected.results);
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(s)).digest("hex"),
    expected.stateSHA256,
  );
  G.Storage.validate(s);
});
