const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { engine } = require("./helpers.cjs"),
  json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ competitions: true });
  return { G, s: G.createGame("Asfalto y circuitos", "", seed) };
}
function pilot(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => b.ask - a.ask)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  return d;
}
function grid(track = 6, seed = 1470) {
  const { G, s } = game(seed),
    d = pilot(G, s),
    car = G.ownedCars(s)[0],
    e = s.season.events.find((e) => e.track === track);
  if (e.cup !== "street") {
    s.competitions.licenses[s.playerId] = true;
    s.competitions.proPoints[s.playerId] = 12;
    G.player(s).balance = 20000;
    for (const key of Object.keys(car.components)) car.components[key] = 95;
    G.Workshop.recalculate(s, car);
    if (G.Drivers.rating(d) < 24)
      for (const key of G.Drivers.stats) d.stats[key] += 5;
  }
  if (e.final) {
    s.season.cups[e.cup].standings.player.points = s.season.cups[
      e.cup
    ].standings.player.qualifying = G.Competition.rule(e).qualify;
  }
  s.day = e.day;
  G.Race.register(s, e.id, d.id, car.id, {
    compound: e.cup !== "street" ? "fortis-hard" : "road",
  });
  G.Race.start(s, e.id);
  return {
    G,
    s,
    d,
    car,
    e,
    r: s.race,
    a: s.race.entrants.find((a) => a.companyId === s.playerId),
  };
}
function finish(G, s) {
  for (let i = 0; i < 200 && !s.race.finished; i++) G.Race.tick(s, 400);
  assert.ok(s.race.finished);
  return G.Race.finish(s);
}
function equip(G, s, car, definition) {
  G.player(s).balance = 20000;
  const def = G.Parts.definition(definition);
  const unit = G.Workshop.stock(s, definition)[0];
  G.Workshop.buy(s, unit.id);
  G.Workshop.install(s, car.id, unit.id);
  s.day = car.repair.end;
  G.Workshop.complete(s, car);
  return unit;
}
test("Nuevo inicio reproducible: 16 trazados originales, 20 pruebas y tres clasificaciones separadas", () => {
  const { G, s } = game();
  assert.deepEqual(
    json(s),
    json(G.createGame("Asfalto y circuitos", "", 1470)),
  );
  assert.equal(G.Circuits.indices().length, 16);
  assert.equal(s.season.events.length, 20);
  assert.ok(s.season.events.every((e) => e.track >= 6));
  assert.equal(s.season.events.filter((e) => e.final).length, 3);
  assert.equal(s.companies.filter((c) => c.privateer).length, 7);
  G.Storage.validate(s);
  const before = JSON.stringify(s);
  G.Competition.initialize(s);
  assert.equal(JSON.stringify(s), before);
});
test("La calle es accesible; la copa profesional cobra más y bloquea la inscripción sin licencia de forma atómica", () => {
  const { G, s } = game(),
    d = pilot(G, s),
    car = G.ownedCars(s)[0],
    street = G.nextEvent(s),
    pro = s.season.events.find((e) => e.cup === "pro");
  assert.equal(G.Competition.fee(street), 220);
  assert.equal(G.Competition.fee(pro), 2100);
  const before = JSON.stringify(s);
  assert.throws(() => G.Race.register(s, pro.id, d.id, car.id), /licencia/);
  assert.equal(JSON.stringify(s), before);
  const cash = G.player(s).balance;
  G.Race.register(s, street.id, d.id, car.id);
  assert.equal(cash - G.player(s).balance, 220);
  assert.equal(street.entry.paid, 220);
});
test("Licencia: exige 24 puntos reales de trayectoria, paga $900 una sola vez y no concede puntos para finales", () => {
  const { G, s } = game();
  assert.throws(() => G.Competition.license(s), /24/);
  s.competitions.streetPoints[s.playerId] = 24;
  const cash = G.player(s).balance;
  G.Competition.license(s);
  assert.equal(G.player(s).balance, cash - 900);
  assert.equal(G.Competition.score(s, s.playerId, "pro", true), 0);
  assert.throws(() => G.Competition.license(s), /Ya tienes/);
  G.Storage.validate(s);
});
test("Los puntos de una liga y de otra temporada no abren automáticamente una final profesional", () => {
  const { G, s } = game(),
    street = s.season.events.find((e) => e.cup === "street" && e.final),
    pro = s.season.events.find((e) => e.cup === "pro" && e.final);
  s.competitions.licenses.player = true;
  s.season.cups.street.standings.player.points =
    s.season.cups.street.standings.player.qualifying = 15;
  assert.equal(G.Competition.eligible(s, street), "");
  assert.match(G.Competition.eligible(s, pro), /18/);
  s.season.cups.pro.standings.player.points =
    s.season.cups.pro.standings.player.qualifying = 18;
  assert.equal(G.Competition.eligible(s, pro), "");
  const next = G.makeSeason(s, 2027);
  assert.equal(next.cups.pro.standings.player.qualifying, 0);
  assert.equal(s.competitions.licenses.player, true);
});
test("La verificación técnica exige piloto, componentes, neumáticos y un contrato que cubra la carrera", () => {
  const { G, s } = game(),
    e = s.season.events.find((e) => e.cup === "pro"),
    car = G.ownedCars(s)[0],
    d = pilot(G, s);
  for (const k of G.Drivers.stats) d.stats[k] = 30;
  for (const k of Object.keys(car.components)) car.components[k] = 95;
  G.Workshop.recalculate(s, car);
  assert.equal(G.Competition.technical(s, e, car, d), "");
  car.components.brakes = 65;
  assert.match(G.Competition.technical(s, e, car, d), /frenos/);
  car.components.brakes = 95;
  d.contract.end = e.day;
  assert.match(G.Competition.technical(s, e, car, d), /contrato/);
});
test("Las parrillas callejeras son independientes; las profesionales excluyen a los equipos callejeros", () => {
  const street = grid(),
    pro = grid(10);
  assert.equal(
    street.r.entrants.filter(
      (a) => street.s.companies.find((c) => c.id === a.companyId).privateer,
    ).length,
    7,
  );
  assert.equal(street.r.entrants.length, 8);
  assert.ok(
    pro.r.entrants.every(
      (a) => !pro.s.companies.find((c) => c.id === a.companyId).privateer,
    ),
  );
  assert.ok(pro.r.entrants.length >= 5);
  street.G.Storage.validate(street.s);
  pro.G.Storage.validate(pro.s);
});
test("Dieciséis geometrías cerradas sin cruces ni segmentos degenerados; recta y carril de boxes acordes", () => {
  const { G } = game();
  const signatures = new Set();
  for (const i of G.Circuits.indices()) {
    assert.ok(G.Circuits.validate(i));
    const def = G.Data.tracks[i],
      pts = G.Race.track(i);
    assert.ok(def.length > 1800 && def.length < 7000);
    assert.ok(pts.every((p) => Number.isFinite(p.angle) && p.segment > 0));
    const p = G.Racecraft.metric(i, 0),
      q = G.Racecraft.metric(i, def.length);
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) < 1e-7);
    signatures.add(JSON.stringify(def.vertices));
    const pit = G.RaceWeekend.pitLayout(i);
    assert.ok(Math.abs(G.RaceWeekend.pitLateral(i, pit.entry)) < 1e-9);
    assert.ok(
      Math.abs(G.RaceWeekend.pitLateral(i, (pit.entry + pit.exit) / 2)) > 18,
    );
  }
  assert.equal(signatures.size, 16);
});
test("Partidas guardadas: cerebro, piezas, ligas y RNG se reanudan con exactamente el mismo resultado por agrupación de pasos", () => {
  const { G, s } = grid();
  G.Race.tick(s, 750);
  G.Storage.validate(s);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 500);
  for (let i = 0; i < 500; i++) G.Race.tick(copy, 1);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(copy);
});
test("Los neumáticos nuevos duran más que en 0.6.4 y siguen respondiendo al ritmo, marca y humedad", () => {
  const { G, r, a } = grid(),
    old = { ...r, competitionVersion: undefined };
  assert.ok(
    G.RaceWeekend.wearFactor(r, a) < G.RaceWeekend.wearFactor(old, a) * 0.6,
  );
  assert.ok(
    G.Rubber.estimate({ ...a, mode: "save" }, "road", r.track) >
      G.Rubber.estimate({ ...a, mode: "attack" }, "road", r.track) * 2,
  );
  assert.ok(
    G.Rubber.estimate(a, "fortis-hard", r.track) >
      G.Rubber.estimate(a, "vertice-soft", r.track),
  );
});
test("IA de boxes: no compra una parada meteorológica que pierde más tiempo que permanecer en pista", () => {
  const { G, s, r, a } = grid();
  r.weather.wetness = 0.3;
  a.compound = "road";
  a.tires = 80;
  a.fuel = 3;
  a.progress =
    G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps - 700;
  const need = G.Driving.pitNeed(s, r, a);
  assert.equal(need.weather, false);
  assert.equal(need.tires, false);
  a.puncture = true;
  assert.equal(G.Driving.pitNeed(s, r, a).tires, true);
});
test("Un coche en su puesto no bloquea el carril de paso y cada participante recibe un puesto propio", () => {
  const { G, s, r } = grid(),
    [a, b] = r.entrants.filter((a) => a.companyId !== "player").slice(0, 2);
  G.RaceWeekend.requestPit(s, a.companyId, { compound: "keep", fuel: 0 });
  G.RaceWeekend.requestPit(s, b.companyId, { compound: "keep", fuel: 0 });
  assert.notEqual(a.pit.box, b.pit.box);
  const layout = G.RaceWeekend.pitLayout(r.track),
    length = G.Data.tracks[r.track].length;
  a.pit.phase = "box";
  a.progress = a.pit.box;
  a.lateral = G.RaceWeekend.pitLateral(r.track, a.progress) + layout.side * 5;
  a.pit.remaining = 100;
  b.pit.phase = "entry";
  b.pit.box = a.progress + 50;
  b.progress = a.progress - 7;
  b.speed = layout.limit;
  b.lateral = G.RaceWeekend.pitLateral(r.track, b.progress);
  for (let i = 0; i < 30; i++) G.RaceWeekend.drivePit(s, r, b, G.Race.dt);
  assert.ok(b.progress > a.progress + 5);
  assert.equal(a.pit.remaining, 100);
  assert.ok(Number.isFinite(b.progress) && b.progress < length);
});
test("Servicios simultáneos: dos mecánicos trabajan al mismo tiempo y la velocidad del equipo cambia el tiempo propio", () => {
  const { G, s, r } = grid(),
    [a, b] = r.entrants.filter((a) => a.companyId !== "player").slice(0, 2);
  for (const car of [a, b]) {
    G.RaceWeekend.requestPit(s, car.companyId, { compound: "keep", fuel: 0 });
    car.pit.phase = "box";
    car.progress = car.pit.box;
    car.speed = 0;
    car.pit.remaining = 20;
  }
  G.RaceWeekend.drivePit(s, r, a, 0.05);
  G.RaceWeekend.drivePit(s, r, b, 0.05);
  assert.equal(a.pit.remaining, 19.95);
  assert.equal(b.pit.remaining, 19.95);
  const slow = { level: 1, speed: 40, stress: 0, skill: 35 },
    fast = { level: 8, speed: 85, stress: 0, skill: 85 };
  assert.ok(G.PitCrew.serviceFactor(fast) < G.PitCrew.serviceFactor(slow));
});
test("Frenada y toma de decisiones: mejor piloto frena con margen y conserva una maniobra elegida", () => {
  const { G, r, a } = grid(),
    low = json(a),
    high = json(a);
  for (const k of ["focus", "control", "brakes", "discipline"]) {
    low.stats[k] = 10;
    high.stats[k] = 90;
  }
  low.brain.experience = 0;
  high.brain.experience = 18;
  assert.ok(
    G.Racecraft.effect(high).reaction < G.Racecraft.effect(low).reaction,
  );
  assert.ok(G.Driving.safeSpeed(r, high, 7) >= G.Driving.safeSpeed(r, low, 3));
});
test("Un contacto evitable se sanciona en copa profesional y no recibe esa sanción en la calle", () => {
  const { G, r } = grid(10),
    [a, b] = r.entrants;
  a.lateralVelocity = b.lateralVelocity = 0;
  r.time = 40;
  G.Driving.contact(r, a, b, 9, 3, 5);
  assert.equal(a.totalPenalty, 10);
  r.cup = "street";
  G.Driving.contact(r, b, a, 12, 3, 6);
  assert.equal(b.totalPenalty, 0);
});
test("El muro callejero produce daño físico sin permitir que el vehículo atraviese el público", () => {
  const { G, r, a } = grid();
  const body = a.components.body;
  a.speed = 25;
  a.lateral = 7;
  a.lateralVelocity = 2;
  r.time = 10;
  G.Driving.wall(r, a, 0.05);
  assert.ok(a.components.body < body);
  assert.ok(Math.abs(a.lateral) + a.width / 2 < r.trackWidth / 2);
  assert.ok(a.speed < 25);
  assert.ok(r.events.some((e) => e.type === "wall"));
  G.assert(Number.isFinite(a.condition), "Estado físico finito");
});
test("Instalar una pieza modifica la configuración de salida; desgaste e impactos reducen su efecto durante la carrera", () => {
  const { G, s } = game(),
    car = G.ownedCars(s)[0],
    unit = equip(G, s, car, "exhaust-light");
  const d = pilot(G, s),
    e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, car.id);
  s.day = e.day;
  G.Race.start(s, e.id);
  const a = s.race.entrants.find((a) => a.companyId === s.playerId),
    fresh = a.hp;
  assert.ok(fresh > car.base.hp + 3);
  a.partWear[unit.id] = 20;
  G.Performance.refresh(a);
  assert.ok(a.hp < fresh - 2);
  const before = a.partWear[unit.id];
  G.Race.damageCar(a, 1, 1, 1, 20);
  assert.ok(a.partWear[unit.id] < before);
  G.Storage.validate(s);
});
test("Frenos, refrigeración y aerodinámica tienen comportamientos distintos y no crean piezas nuevas al calcularlos", () => {
  const { G, s, r, a } = grid(10),
    before = JSON.stringify(s.parts);
  const hot = json(a);
  hot.performance.brakeHeat = 260;
  assert.ok(G.Performance.brakeFactor(hot) < G.Performance.brakeFactor(a));
  hot.performance.downforce = 8;
  hot.speed = 50;
  const fast = G.Performance.grip(hot);
  hot.speed = 10;
  assert.ok(G.Performance.grip(hot) < fast);
  assert.equal(JSON.stringify(s.parts), before);
  G.Storage.validate(s);
});
test("Carrera completa moderna: resultados, economía, desgaste, puntos y repetición pertenecen a la misma liga", () => {
  const { G, s, r, e, a } = grid(),
    cash = G.player(s).balance;
  G.Race.order(s, "save");
  const rows = finish(G, s);
  assert.equal(e.status, "completed");
  const own = rows.find((r) => r.companyId === "player");
  assert.equal(G.Competition.score(s, "player", "street"), own.points);
  assert.equal(G.Competition.score(s, "player", "pro"), 0);
  assert.ok(G.player(s).balance >= cash);
  assert.ok(a.tires < a.initialTires);
  assert.equal(s.raceSupplies.lastReplay.competitionVersion, 1);
  const replay = G.RaceWeekend.playback(s.raceSupplies.lastReplay, 100);
  assert.equal(replay.trackWidth, 10.6);
  assert.equal(replay.cup, "street");
  G.Storage.validate(s);
});
test("Importar una carrera auténtica 0.6.4 conserva física, resultado y estado completos", () => {
  const { G } = engine({ competitions: true }),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"),
    s = G.Storage.unpack(read("v64-race.json")).state;
  assert.equal(s.competitions, undefined);
  assert.deepEqual(json(finish(G, s)), JSON.parse(read("v64-results.json")));
  assert.deepEqual(json(s), JSON.parse(read("v64-finished.json")));
});
test("Cada trazado completa una carrera física sin saltos, NaN ni salidas de carril en su geometría", () => {
  for (const index of game().G.Circuits.indices()) {
    const { G, s, r, a } = grid(index);
    r.entrants = [a];
    r.replay.cars = r.replay.cars.filter((c) => c.carId === a.carId);
    r.replay.frames = [];
    G.RaceWeekend.record(r, true);
    a.fuel = 8;
    G.Race.order(s, "save");
    const rows = finish(G, s);
    assert.equal(rows.length, 1);
    assert.equal(a.dnf, false, G.Data.tracks[index].name);
    assert.ok(a.finishTime > 0);
    assert.ok(
      Number.isFinite(a.progress) &&
        Number.isFinite(a.lateral) &&
        Number.isFinite(a.speed),
    );
    G.Storage.validate(s);
  }
});
test("Un embrague realmente comprado e instalado mejora la salida del mismo coche con el mismo piloto y órdenes", () => {
  const runs = [];
  for (const upgraded of [false, true]) {
    const { G, s } = game(),
      car = G.ownedCars(s)[0];
    if (upgraded) equip(G, s, car, "clutch-sport");
    const d = pilot(G, s),
      e = G.nextEvent(s);
    G.Race.register(s, e.id, d.id, car.id);
    s.day = e.day;
    G.Race.start(s, e.id);
    const r = s.race,
      a = r.entrants.find((a) => a.companyId === "player");
    r.entrants = [a];
    r.weather.rain = r.weather.wetness = 0;
    r.weather.plan = [
      { time: 0, rain: 0 },
      { time: 10000, rain: 0 },
    ];
    a.progress = 0;
    a.speed = 0;
    G.Race.tick(s, 160);
    runs.push(a.progress);
  }
  assert.ok(runs[1] > runs[0] + 1, JSON.stringify(runs));
});
test("Ocho puestos trabajan simultáneamente sin recurso de servicio global ni coche esperando una reparación ajena", () => {
  const { G, s, r } = grid();
  for (const a of r.entrants) {
    G.RaceWeekend.requestPit(s, a.companyId, { compound: "keep", fuel: 0 });
    a.pit.phase = "box";
    a.progress = a.pit.box;
    a.speed = 0;
    a.pit.remaining = 15;
  }
  assert.equal(
    new Set(r.entrants.map((a) => a.pit.box)).size,
    r.entrants.length,
  );
  for (const a of r.entrants) G.RaceWeekend.drivePit(s, r, a, 0.05);
  assert.ok(r.entrants.every((a) => a.pit.remaining === 14.95));
});
test("La copa nacional tiene presupuesto, requisitos y puntos propios; la licencia básica no basta", () => {
  const { G, s } = game(),
    e = s.season.events.find((e) => e.cup === "national");
  assert.equal(G.Competition.fee(e), 7200);
  s.competitions.licenses.player = true;
  assert.match(G.Competition.eligible(s, e), /12 puntos/);
  s.competitions.proPoints.player = 12;
  assert.equal(G.Competition.eligible(s, e), "");
  assert.equal(G.Competition.score(s, "player", "national"), 0);
  assert.ok(G.player(s).balance < G.Competition.fee(e));
  G.Storage.validate(s);
});
test("La inscripción abre 14 días antes; no se inmoviliza un coche durante toda la temporada al reservar una final", () => {
  const { G, s } = game(),
    e = s.season.events.filter((e) => e.cup === "street")[1],
    d = pilot(G, s),
    car = G.ownedCars(s)[0],
    before = JSON.stringify(s);
  assert.match(G.Competition.registrationReason(s, e), /14 días/);
  assert.throws(() => G.Race.register(s, e.id, d.id, car.id), /14 días/);
  assert.equal(JSON.stringify(s), before);
  s.day = e.day - 14;
  G.Race.register(s, e.id, d.id, car.id);
  assert.equal(e.entry.paid, 220);
});
test("La importación rechaza decisiones no finitas, reglas de repetición alteradas y efectos de piezas inventados", () => {
  const { G, s, r, a } = grid(),
    raw = json(s);
  a.brain.commitUntil = NaN;
  assert.throws(() => G.Storage.validate(s), /Decisiones/);
  s.race = json(raw.race);
  s.race.replay.trackWidth = 100;
  assert.throws(() => G.Storage.validate(s), /repetición/);
  const second = game(),
    car = second.G.ownedCars(second.s)[0];
  equip(second.G, second.s, car, "exhaust-light");
  const d = pilot(second.G, second.s),
    e = second.G.nextEvent(second.s);
  second.G.Race.register(second.s, e.id, d.id, car.id);
  second.s.day = e.day;
  second.G.Race.start(second.s, e.id);
  second.s.race.entrants.find(
    (a) => a.companyId === "player",
  ).performance.parts[0].effects.hp = 999;
  assert.throws(() => second.G.Storage.validate(second.s), /unidad física/);
});

test("40 modelos disponibles con siluetas propias, motores y dimensiones distintos sin modificar el RNG al dibujar", () => {
  const { G, s } = game(),
    before = JSON.stringify(s);
  assert.equal(G.Data.models.length, 40);
  assert.equal(new Set(s.cars.map((c) => c.modelIndex)).size, 40);
  const profiles = G.Data.models.map((m, i) =>
    G.Art.carProfile({ ...m, modelIndex: i, color: "#aa5533" }),
  );
  assert.equal(new Set(profiles.map((p) => p.body)).size, 40);
  assert.ok(new Set(profiles.map((p) => p.style)).size >= 9);
  assert.ok(new Set(profiles.map((p) => p.wind)).size >= 20);
  for (const m of G.Data.models.slice(24))
    assert.ok(m.hp >= 100 && m.hp <= 350 && m.length > 3.4 && m.width > 1.5);
  assert.equal(JSON.stringify(s), before);
  G.Storage.validate(s);
});
test("Los 16 trazados tienen fecha en la temporada y las nuevas sedes mantienen su carácter visual", () => {
  const { G, s } = game();
  assert.equal(new Set(s.season.events.map((e) => e.track)).size, 16);
  const themes = new Set(
    G.Circuits.indices().map((i) => G.Data.tracks[i].theme),
  );
  for (const theme of [
    "urban",
    "night",
    "neon",
    "coast",
    "desert",
    "stadium",
    "forest",
  ])
    assert.ok(themes.has(theme));
});

test("Archivar tres ligas y abrir otro año conserva las rondas de cada copa, activos e historial importable", () => {
  const { G, s } = game();
  for (const e of s.season.events) e.status = "skipped";
  s.day = s.season.events.at(-1).day;
  G.Competition.completeSeason(s);
  G.Storage.validate(s);
  const archive = s.expansion.archive[0];
  assert.equal(archive.events.length, 20);
  assert.equal(archive.events.filter((e) => e.round === 1).length, 3);
  assert.equal(archive.events.filter((e) => e.final).length, 3);
  G.Calendar.nextSeason(s);
  const loaded = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.equal(loaded.season.year, 2027);
  assert.equal(loaded.expansion.archive.length, 1);
  assert.equal(loaded.season.events.length, 20);
  assert.equal(loaded.competitions.streetPoints.player, 0);
});
