const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1580, isolated = true) {
  const { G } = engine({ development: true }),
    s = G.createGame("Campus e investigación", "", seed);
  if (isolated) {
    G.player(s).balance = 200000;
    G.player(s).level = 10;
    G.Facilities.site(s).highestLevel = 10;
    for (const e of s.season.events) e.day += 365;
  }
  return { G, s };
}
function hire(G, s, role, level = 1) {
  const e =
    s.employees.find(
      (e) =>
        e.role === role && G.Professionals.profile(s, e.id).level === level,
    ) || s.employees.find((e) => e.role === role);
  G.Professionals.profile(s, e.id).level = level;
  e.ask = G.Challenge.staffAsk(s, e);
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
function pilot(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  assert.equal(G.Drivers.offer(s, d.id, d.ask, 12).accepted, true);
  return d;
}
function options(G, s, level = 1) {
  const d = pilot(G, s),
    e = hire(G, s, "trainer", level),
    car = G.ownedCars(s)[0];
  return {
    d,
    e,
    car,
    o: {
      driverId: d.id,
      coachId: e.id,
      carId: car.id,
      laps: 5,
      intensity: "normal",
      focus: "control",
    },
  };
}
function research(G, s, id, e) {
  const j = G.Research.start(s, id, e.id);
  for (let i = 0; s.research.project && i < 100; i++) {
    G.Calendar.advance(s, 1);
    G.Storage.validate(s);
  }
  assert.equal(j.status, "completed");
  return j;
}
function camp(G, s, o) {
  const j = G.Practice.start(s, o);
  for (let i = 0; G.Practice.active(s) && i < 45; i++) {
    G.Calendar.advance(s, 1);
    G.Storage.validate(s);
  }
  assert.equal(j.status, "completed");
  return j;
}

test("Inicio 0.8: 64 modelos, 32 trazados, cinco científicos caros y nueve mejoras todavía sin efectos", () => {
  const { G, s } = game(1580, false);
  assert.equal(G.player(s).balance, 4200);
  assert.equal(G.Data.models.length, 64);
  assert.equal(G.Circuits.indices().length, 32);
  assert.equal(new Set(s.cars.map((c) => c.modelIndex)).size, 64);
  assert.equal(s.employees.length, 40);
  assert.equal(G.Research.nodes.length, 9);
  const scientists = s.employees.filter((e) => e.role === "researcher");
  assert.equal(scientists.length, 5);
  assert.ok(scientists.every((e) => e.salaryPeriod === "day" && e.ask >= 180));
  assert.ok(scientists.at(-1).ask > scientists[0].ask * 5);
  assert.equal(G.Research.effect(s, "training"), 0);
  G.Storage.validate(s);
  const before = JSON.stringify(s);
  G.Research.initialize(s);
  assert.equal(JSON.stringify(s), before);
});
test("Nivel científico: rebaja moderada de coste y plazo; las investigaciones finales conservan su escala", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher");
  e.skill = 70;
  const low = G.Research.quote(s, "learning", e.id);
  G.Professionals.profile(s, e.id).level = 7;
  const high = G.Research.quote(s, "learning", e.id);
  assert.ok(high.cost < low.cost && high.cost > low.cost * 0.75);
  assert.ok(high.days < low.days);
  const last = G.Research.nodes.find((n) => n.id === "adaptation");
  assert.ok(last.cost > high.cost * 10 && last.days > high.days * 3);
  assert.ok(e.contract.salary >= 180);
  G.Storage.validate(s);
});
test("Árbol y contratos: sin científico, prerrequisitos, nivel o cobertura no hay cobro ni mutaciones parciales", () => {
  const { G, s } = game();
  let before = JSON.stringify(s);
  assert.throws(
    () => G.Research.start(s, "learning", "no-existe"),
    /investigador/,
  );
  assert.equal(JSON.stringify(s), before);
  const e = hire(G, s, "researcher");
  before = JSON.stringify(s);
  assert.throws(() => G.Research.start(s, "adaptation", e.id), /anteriores/);
  assert.equal(JSON.stringify(s), before);
  e.contract.end = s.day + 2;
  before = JSON.stringify(s);
  assert.throws(() => G.Research.start(s, "learning", e.id), /Renueva/);
  assert.equal(JSON.stringify(s), before);
});
test("Materiales se pagan una vez; el avance científico requiere jornadas y mantiene nóminas reales", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher"),
    q = G.Research.quote(s, "learning", e.id),
    cash = G.player(s).balance,
    j = G.Research.start(s, "learning", e.id);
  assert.equal(G.player(s).balance, cash - q.cost);
  assert.equal(j.work, 0);
  const day = s.day;
  G.Calendar.advance(s, 1);
  assert.equal(s.day, day + 1);
  assert.equal(G.player(s).balance, cash - q.cost - 18 - e.contract.salary);
  const work = j.work;
  G.Research.daily(s);
  assert.equal(j.work, work);
  for (let i = 1; i < q.days; i++) G.Calendar.advance(s, 1);
  assert.equal(s.research.completed.learning.projectId, j.id);
  assert.equal(s.research.project, null);
  assert.equal(s.research.history.length, 1);
  assert.ok(G.Research.effect(s, "training") > 0);
  G.Storage.validate(s);
});
test("Pausa, descanso y reanudación conservan trabajo y materiales; sin equipo no se puede acelerar el proyecto", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher"),
    j = G.Research.start(s, "recovery", e.id);
  G.Calendar.advance(s, 2);
  const work = j.work;
  assert.equal(G.Staff.busy(s, e.id), true);
  assert.throws(() => G.Professionals.rest(s, e.id, 3), /trabajo|actividad/);
  G.Research.pause(s);
  assert.equal(G.Staff.busy(s, e.id), false);
  G.Professionals.rest(s, e.id, 3);
  G.Calendar.advance(s, 2);
  assert.equal(j.work, work);
  assert.throws(() => G.Research.resume(s, e.id), /descansado/);
  G.Calendar.advance(s, 1);
  const cash = G.player(s).balance;
  G.Research.resume(s, e.id);
  assert.equal(G.player(s).balance, cash);
  while (s.research.project) G.Calendar.advance(s, 1);
  assert.equal(j.status, "completed");
  assert.equal(G.Research.effect(s, "recovery"), 0.08);
  G.Storage.validate(s);
});
test("Un investigador que se marcha pausa el proyecto; otro puede retomarlo sin pagar los materiales otra vez", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher"),
    j = G.Research.start(s, "recovery", e.id);
  G.Calendar.advance(s, 1);
  const work = j.work;
  G.Staff.depart(s, e, "Oferta rival");
  assert.equal(j.status, "paused");
  G.Calendar.advance(s, 1);
  assert.equal(j.work, work);
  const next = s.employees.find(
    (x) => x.role === "researcher" && !x.companyId && x.id !== e.id,
  );
  assert.equal(
    G.Staff.offer(s, next.id, {
      salary: Math.ceil(next.ask * 1.15),
      months: 12,
      bonus: 0,
    }).accepted,
    true,
  );
  const cash = G.player(s).balance;
  G.Research.resume(s, next.id);
  assert.equal(G.player(s).balance, cash);
  while (s.research.project) G.Calendar.advance(s, 1);
  assert.equal(j.segments.length, 2);
  G.Storage.validate(s);
});
test("Investigar recuperación cambia las nuevas lesiones y mantiene un descanso mínimo", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher");
  const before = G.Research.recoveryDays(s, 18);
  research(G, s, "recovery", e);
  assert.ok(G.Research.recoveryDays(s, 18) < before);
  assert.equal(G.Research.recoveryDays(s, 2), 2);
  assert.equal(G.Research.recoveryDays(s, 18, s.companies[1].id), 18);
  assert.equal(G.Professionals.care(s, s.drivers[0].id).retired, false);
});
test("Aprendizaje investigado aumenta realmente la ganancia del mismo plan; no concede puntos ni efectivo", () => {
  const gains = [];
  for (const enabled of [false, true]) {
    const { G, s } = game(),
      e = hire(G, s, "researcher");
    if (enabled) research(G, s, "learning", e);
    const { o, d } = options(G, s);
    const q = G.Practice.quote(s, o),
      j = camp(G, s, o);
    gains.push(j.gain);
    assert.equal(j.report.changes.control, Number(j.gain.toFixed(6)));
    assert.equal(G.Competition.score(s, "player", "street"), 0);
    assert.ok(d.stats.control > j.beforeStats.control);
    G.Storage.validate(s);
  }
  assert.ok(gains[1] > gains[0] * 1.04, JSON.stringify(gains));
});
test("Diagnóstico, boxes y desgaste tienen efectos físicos separados después de investigar sus ramas", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher", 7);
  const before = G.Staff.training(s, "player");
  research(G, s, "diagnostics", e);
  assert.equal(G.Research.effect(s, "diagnostics"), 3);
  research(G, s, "pit-protocol", e);
  research(G, s, "tire-data", e);
  assert.equal(G.Staff.training(s, "player"), before);
  const member = { level: 5, speed: 65, stress: 20, skill: 60 },
    r = { track: 6, weather: { wetness: 0 }, competitionVersion: 1 },
    a = {
      mode: "balanced",
      tires: 80,
      stats: { tires: 30 },
      compound: "road",
      tyreTemp: 65,
      tireWear: 1,
    };
  assert.ok(
    G.PitCrew.serviceFactor({ ...member, researchPit: 0.03 }) <
      G.PitCrew.serviceFactor(member),
  );
  assert.ok(
    G.RaceWeekend.wearFactor(r, { ...a, researchWear: 0.03 }) <
      G.RaceWeekend.wearFactor(r, a),
  );
  const snapshot = G.Workshop.raceSnapshot(s, G.ownedCars(s)[0]);
  assert.equal(snapshot.researchWear, 0.03);
  G.Storage.validate(s);
});
test("Científico de nivel bajo no investiga el siguiente nodo aunque el anterior esté terminado", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher");
  research(G, s, "learning", e);
  const raw = JSON.stringify(s);
  assert.throws(() => G.Research.start(s, "telemetry", e.id), /nivel 3/);
  assert.equal(JSON.stringify(s), raw);
});
test("Piloto y entrenador mejores reducen los días; la carga del programa sigue importando", () => {
  const { G, s } = game(),
    { o, d, e } = options(G, s),
    low = G.Practice.quote(s, o);
  for (const k of G.Drivers.stats) d.stats[k] = 75;
  d.experience = 12;
  G.Professionals.profile(s, e.id).level = 8;
  e.skill = 90;
  const high = G.Practice.quote(s, o),
    long = G.Practice.quote(s, { ...o, laps: 20 });
  assert.ok(high.days < low.days);
  assert.ok(long.days > high.days);
  const before = JSON.stringify(s);
  G.Practice.quote(s, o);
  assert.equal(JSON.stringify(s), before);
});
test("Ver pasar el tiempo o llamar tick no avanza un programa; los días sí, con coche y entrenador reservados", () => {
  const { G, s } = game(),
    { o, car, e, d } = options(G, s),
    j = G.Practice.start(s, o),
    raw = JSON.stringify(s);
  G.Practice.tick(s, 20000);
  assert.equal(JSON.stringify(s), raw);
  assert.equal(G.Staff.busy(s, e.id), true);
  assert.equal(G.Market.locked(s, car.id), true);
  assert.equal(G.Market.locked(s, d.id), true);
  assert.throws(() => G.Workshop.repair(s, car.id, "all"), /entrenando/);
  G.Calendar.advance(s, 1);
  assert.equal(j.daysWorked, 1);
  assert.ok(j.a.progress > 0 && j.workLaps > 0);
  assert.equal(j.report, null);
  G.Storage.validate(s);
});
test("Programa finalizado: informe de atributos y aprendizaje, desgaste real y ninguna jornada adicional oculta", () => {
  const { G, s } = game(),
    { o, d, car } = options(G, s),
    days = G.Practice.quote(s, o).days,
    day = s.day,
    j = camp(G, s, o);
  assert.equal(s.day, day + days);
  assert.equal(j.daysWorked, days);
  assert.equal(j.completedDay, s.day);
  assert.equal(j.workLaps, 5);
  assert.ok(j.report.changes.control > 0 && j.report.changes.brakes > 0);
  assert.equal(d.stats.control, j.beforeStats.control + j.gain);
  assert.ok(car.tires < j.beforeTires);
  assert.ok(j.report.learned.includes("trazada"));
  assert.equal(G.Practice.active(s), undefined);
  G.Storage.validate(s);
});
test("Interrupción entrega informe parcial sin consumir otro día; sobrecarga puede empeorar regularidad", () => {
  const { G, s } = game(),
    { o, d } = options(G, s);
  G.Professionals.care(s, d.id).stress = 100;
  d.fatigue = 75;
  const j = G.Practice.start(s, { ...o, laps: 20, intensity: "hard" });
  G.Calendar.advance(s, 1);
  const day = s.day;
  G.Practice.finish(s, "cancelled");
  assert.equal(s.day, day);
  assert.equal(j.status, "cancelled");
  assert.ok(j.workLaps < j.laps);
  assert.ok(j.report.changes.consistency < 0);
  assert.ok(j.report.tireChange < 0);
  G.Storage.validate(s);
});
test("Los contratos deben cubrir todo el programa y no puede reservarse una alineación inscrita", () => {
  const { G, s } = game(),
    { o, d, car } = options(G, s);
  d.contract.end = 2;
  const raw = JSON.stringify(s);
  assert.throws(() => G.Practice.start(s, o), /todos los días/);
  assert.equal(JSON.stringify(s), raw);
  d.contract.end = 360;
  const e = G.nextEvent(s);
  s.day = e.day;
  d.contract.end = s.day + 360;
  const coach = s.employees.find((e) => e.id === o.coachId);
  coach.contract.end = s.day + 360;
  G.Race.register(s, e.id, d.id, car.id);
  assert.throws(() => G.Practice.start(s, o), /inscripciones|carrera de hoy/);
});
test("Campamento y proyecto simultáneos: guardado intermedio y agrupación de días producen el mismo estado", () => {
  const { G, s } = game(),
    science = hire(G, s, "researcher"),
    { o } = options(G, s);
  G.Practice.start(s, o);
  G.Research.start(s, "learning", science.id);
  G.Calendar.advance(s, 2);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 3);
  for (let i = 0; i < 3; i++) G.Calendar.advance(copy, 1);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(copy);
});
test("Un encargo del taller puede continuar mientras el piloto entrena en pista", () => {
  const { G, s } = game(),
    { o } = options(G, s);
  G.Practice.start(s, o);
  G.Economy.job(s);
  const pay = s.job.net;
  G.Calendar.advance(s, 3);
  assert.equal(s.job, null);
  assert.ok(G.player(s).ledger.some((t) => t.amount === pay));
  assert.equal(G.Practice.active(s).daysWorked, 3);
  G.Storage.validate(s);
});
test("Catálogo ampliado: 64 siluetas y 32 geometrías distintas, con todos los circuitos accesibles en la rotación y categoría correcta", () => {
  const { G, s } = game();
  assert.equal(
    new Set(
      G.Data.models.map(
        (m, i) => G.Art.carProfile({ ...m, modelIndex: i }).body,
      ),
    ).size,
    64,
  );
  const covered = new Set(),
    difficulty = new Set();
  for (let year = 2026; year < 2031; year++) {
    const season = G.makeSeason(s, year);
    assert.equal(season.events.length, 20);
    for (const e of season.events) {
      assert.ok(G.Data.tracks[e.track].cups.includes(e.cup));
      covered.add(e.track);
    }
  }
  assert.equal(covered.size, 32);
  for (const i of G.Circuits.indices()) {
    assert.ok(G.Circuits.validate(i));
    difficulty.add(G.Data.tracks[i].difficulty);
    assert.ok(
      G.Race.track(i).every((p) => Number.isFinite(p.angle) && p.segment > 0),
    );
  }
  assert.equal(difficulty.size, 4);
});
test("Validación rechaza progreso imposible, efectos sin investigar, categorías prohibidas e informes corruptos", () => {
  const { G, s } = game(),
    e = hire(G, s, "researcher");
  G.Research.start(s, "learning", e.id);
  s.research.project.work = 999;
  assert.throws(() => G.Storage.validate(s), /Proyecto/);
  s.research.project.work = 0;
  s.research.completed.adaptation = {
    day: 0,
    projectId: "research-1",
    cost: 1,
  };
  assert.throws(() => G.Storage.validate(s), /Mejora/);
  delete s.research.completed.adaptation;
  const event = s.season.events[0],
    old = event.track;
  event.track = 34;
  assert.throws(() => G.Storage.validate(s), /reglamento|exclusiva/i);
  event.track = old;
  G.Research.cancel(s);
  const { o } = options(G, s),
    j = camp(G, s, o);
  j.report.changes.control = Infinity;
  assert.throws(() => G.Storage.validate(s), /Informe/);
});
test("Una carrera auténtica 0.7.0 termina con exactamente sus resultados y estado anteriores", () => {
  const { G } = engine({ development: true }),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"),
    s = G.Storage.unpack(read("v70-race.json")).state;
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(read("v70-results.json")),
  );
  assert.deepEqual(json(s), JSON.parse(read("v70-finished.json")));
});
test("Los 32 trazados completan una carrera física: curvas técnicas, desgaste y resultados finitos sin saltos de geometría", () => {
  for (const index of game().G.Circuits.indices()) {
    const { G, s } = game(),
      d = pilot(G, s),
      car = G.ownedCars(s)[0],
      track = G.Data.tracks[index],
      cup = track.cups[0],
      e = s.season.events.find((e) => e.cup === cup && !e.final);
    for (const k of G.Drivers.stats) d.stats[k] = 40;
    d.contract.end = e.day + 100;
    for (const k of Object.keys(car.components)) car.components[k] = 95;
    G.Workshop.recalculate(s, car);
    s.competitions.licenses.player = true;
    s.competitions.proPoints.player = 12;
    e.track = index;
    s.day = e.day;
    G.Race.register(s, e.id, d.id, car.id, {
      compound: cup === "street" ? "road" : "fortis-hard",
    });
    G.Race.start(s, e.id);
    const r = s.race,
      a = r.entrants.find((a) => a.companyId === "player");
    r.entrants = [a];
    r.replay.cars = r.replay.cars.filter((c) => c.carId === a.carId);
    r.replay.frames = [];
    G.RaceWeekend.record(r, true);
    a.fuel = 8;
    G.Race.order(s, "save");
    for (let i = 0; i < 250 && !r.finished; i++) G.Race.tick(s, 400);
    assert.equal(r.finished, true, track.name);
    assert.equal(a.dnf, false, track.name);
    assert.ok(
      Number.isFinite(a.progress) &&
        Number.isFinite(a.lateral) &&
        Number.isFinite(a.finishTime),
    );
    G.Race.finish(s);
    G.Storage.validate(s);
  }
});

test("Una lesión durante el programa aplica la investigación de recuperación y entrega el informe sin bloquear entidades", () => {
  const { G, s } = game(),
    scientist = hire(G, s, "researcher");
  research(G, s, "recovery", scientist);
  const { o, d, car, e } = options(G, s),
    j = G.Practice.start(s, o),
    risk = G.Practice.risk;
  j.rng = 0;
  const expected = { rng: 0 };
  G.random(expected);
  G.random(expected);
  const days = G.Research.recoveryDays(s, G.integer(expected, 3, 21));
  G.Practice.risk = () => 1;
  G.Calendar.advance(s, 1);
  G.Practice.risk = risk;
  assert.equal(j.incident, "injury");
  assert.equal(j.recoveryDays, days);
  assert.equal(G.Professionals.care(s, d.id).injuryUntil, s.day + days);
  assert.equal(G.Professionals.fit(s, d.id), false);
  assert.equal(G.Practice.active(s), undefined);
  assert.equal(G.Market.locked(s, car.id), false);
  assert.equal(G.Staff.busy(s, e.id), false);
  assert.equal(j.report.incident, "injury");
  G.Storage.validate(s);
});
