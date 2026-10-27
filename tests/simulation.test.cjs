const { test } = require("node:test");
const assert = require("node:assert/strict");
const { engine } = require("./helpers.cjs");
function hire(G, s, months = 12) {
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, months, 0);
  return d;
}
function finish(G, s, steps = 500) {
  while (!s.race.finished) G.Race.tick(s, steps);
  return G.Race.finish(s);
}
test("Contratación: contraoferta, firma única, sueldo real, capacidad y vencimiento", () => {
  const { G } = engine(),
    s = G.createGame("Aster", "", 17),
    d = s.drivers.find((d) => !d.companyId);
  assert.equal(G.Drivers.offer(s, d.id, 200, 6, 100).accepted, false);
  const counter = s.negotiations[d.id];
  assert.ok(counter.salary > d.ask);
  assert.equal(G.Drivers.offer(s, d.id, counter.salary, 6, 100).accepted, true);
  assert.equal(G.player(s).balance, 11900);
  assert.equal(d.companyId, s.playerId);
  assert.throws(() => G.Drivers.offer(s, d.id, d.ask, 12), /disponible/);
  hire(G, s);
  assert.throws(() => hire(G, s), /completa/);
  const before = G.player(s).balance;
  G.Calendar.advance(s, 13);
  assert.equal(s.day, 13);
  assert.ok(G.player(s).balance < before);
  G.Race.skip(s, G.nextEvent(s).id);
  G.Calendar.advance(s, 32 - s.day);
  assert.ok(G.player(s).ledger.some((t) => t.category === "Salarios"));
  d.contract.end = s.day + 1;
  const previous = d.contract.accrued;
  G.Calendar.advance(s);
  assert.equal(d.companyId, null);
  assert.ok(
    G.player(s).ledger.some(
      (t) => t.label.includes("Liquidación") && Math.abs(t.amount) >= previous,
    ),
  );
});
test("Taller: gastos, plazo real, recursos limitados y neumáticos", () => {
  const { G } = engine(),
    s = G.createGame("Taller", "", 5),
    car = G.ownedCars(s)[0];
  const b = G.player(s).balance,
    q = G.Economy.repairQuote(car);
  G.Economy.repair(s, car.id);
  assert.equal(G.player(s).balance, b - q);
  assert.throws(() => G.Economy.repair(s, car.id), /ocupado/);
  G.Calendar.advance(s);
  assert.ok(car.repair);
  G.Calendar.advance(s);
  assert.equal(car.repair, null);
  assert.equal(car.condition, 100);
  car.tires = 30;
  G.Economy.tires(s, car.id);
  assert.equal(car.tires, 100);
  assert.throws(() => G.Economy.tires(s, car.id), /nuevos/);
  G.Economy.job(s);
  assert.throws(() => G.Economy.job(s), /ocupado/);
  const before = G.player(s).balance;
  G.Calendar.advance(s, 3);
  assert.equal(G.player(s).balance, before - 54 + 360);
  assert.equal(s.job, null);
});
test("Calendario: no omite carreras y las inscripciones no se pagan dos veces", () => {
  const { G } = engine(),
    s = G.createGame("Club", "", 32),
    d = hire(G, s),
    car = G.ownedCars(s)[0],
    e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, car.id);
  const balance = G.player(s).balance;
  assert.throws(() => G.Race.register(s, e.id, d.id, car.id), /disponible/);
  assert.equal(G.player(s).balance, balance);
  assert.equal(G.Calendar.advance(s, 300).blocked, true);
  assert.equal(s.day, e.day);
  G.Calendar.advance(s, 5);
  assert.equal(s.day, e.day);
  G.Race.start(s, e.id);
  assert.throws(() => G.Calendar.advance(s), /carrera/);
  assert.throws(() => G.Race.start(s, e.id), /curso/);
});
test("Simulación determinista a diferentes velocidades y tras guardar a media carrera", () => {
  const { G } = engine(),
    s = G.createGame("Determinista", "", 928),
    d = hire(G, s),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Race.register(s, e.id, d.id, car.id);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  G.Race.tick(s, 500);
  G.Race.order(s, "attack");
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  const a = finish(G, s, 1),
    b = finish(G, copy, 80);
  assert.deepEqual(
    JSON.parse(JSON.stringify(a)),
    JSON.parse(JSON.stringify(b)),
  );
  assert.equal(G.player(s).balance, G.player(copy).balance);
  assert.ok(car.km > 42000);
  assert.ok(car.condition < car.history.length + 100);
  assert.ok(car.tires < 100);
  assert.ok(a.some((row) => row.time > 0));
  assert.ok(
    a.every(
      (row) =>
        s.drivers.some((d) => d.id === row.driverId) &&
        s.cars.some((c) => c.id === row.carId),
    ),
  );
  const balance = G.player(s).balance;
  assert.throws(() => G.Race.finish(s), /curso/);
  assert.equal(G.player(s).balance, balance);
});
test("Órdenes influyen en ritmo y desgaste sin modificar el render", () => {
  const { G } = engine(),
    s = G.createGame("Orden", "", 98),
    d = hire(G, s),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Race.register(s, e.id, d.id, car.id);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  const a = G.clone(s),
    b = G.clone(s);
  G.Race.order(a, "attack");
  G.Race.order(b, "save");
  G.Race.tick(a, 2500);
  G.Race.tick(b, 2500);
  const fast = a.race.entrants.find((x) => x.companyId === "player"),
    safe = b.race.entrants.find((x) => x.companyId === "player");
  assert.ok(fast.tires < safe.tires);
  assert.ok(fast.progress > safe.progress);
});
test("Una temporada completa: seis carreras, clasificación, premios e historia persistente", () => {
  const { G } = engine(),
    s = G.createGame("Temporada", "", 321),
    d = hire(G, s, 24),
    car = G.ownedCars(s)[0];
  for (let i = 0; i < 6; i++) {
    const e = G.nextEvent(s);
    if (car.condition < 65) {
      G.Economy.repair(s, car.id);
      G.Calendar.advance(s, 2);
    }
    if (car.tires < 40) G.Economy.tires(s, car.id);
    G.Race.register(s, e.id, d.id, car.id);
    G.Calendar.advance(s, e.day - s.day);
    G.Race.start(s, e.id);
    const results = finish(G, s);
    assert.ok(results.length >= 2);
    assert.equal(e.status, "completed");
    G.Storage.validate(s);
  }
  assert.equal(s.season.phase, "complete");
  assert.equal(s.history.length, 1);
  assert.equal(car.starts, 6);
  assert.equal(d.starts, 6);
  assert.equal(
    s.season.standings.player.points,
    s.season.events.reduce(
      (n, e) => n + e.results.find((r) => r.companyId === "player").points,
      0,
    ),
  );
  assert.ok(
    s.companies.every((c) => c.ledger.some((x) => x.category === "Salarios")),
  );
  assert.ok(
    G.player(s).balance > 0,
    "El presupuesto inicial permite terminar una temporada sin ingresos inventados",
  );
  G.Storage.save(1, s);
  const restored = G.Storage.load(1).state;
  assert.equal(JSON.stringify(s), JSON.stringify(restored));
  const ids = s.cars.map((c) => c.id).join();
  G.Calendar.nextSeason(s);
  assert.equal(s.season.year, 2027);
  assert.equal(s.history.length, 1);
  assert.equal(s.cars.map((c) => c.id).join(), ids);
  assert.equal(s.season.standings.player.points, 0);
});
test("Guardado: corrupción, recuperación, versiones antiguas e inventarios inválidos", () => {
  const { G, store } = engine(),
    s = G.createGame("Guardar", "", 6);
  G.Storage.save(1, s);
  G.Calendar.advance(s, 2);
  G.Storage.save(1, s);
  store.set("rcs.v1.slot.1", '{"corrupt":true}');
  const recovered = G.Storage.load(1);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.state.day, 0);
  const raw = G.Storage.pack(s);
  assert.throws(
    () => G.Storage.unpack(raw.replace("checksum", "tampered")),
    /comprobación/,
  );
  const old = G.clone(s);
  old.version = 0;
  assert.throws(() => G.Storage.pack(old), /incompatible/);
  const dup = G.clone(s);
  dup.cars.push(G.clone(dup.cars[0]));
  assert.throws(() => G.Storage.pack(dup), /duplicados/);
  const invalid = G.clone(s);
  invalid.cars[0].companyId = "inexistente";
  assert.throws(() => G.Storage.pack(invalid), /Vehículo/);
  G.Storage.remove(1);
  assert.equal(G.Storage.list()[0].empty, true);
});
test("Bancarrota: margen de recuperación, final definitivo y rivales fuera de parrilla", () => {
  const { G } = engine(),
    s = G.createGame("Crisis", "", 101);
  G.player(s).balance = 0;
  G.Calendar.advance(s, 13);
  assert.equal(s.status, "active");
  G.Race.skip(s, G.nextEvent(s).id);
  G.Calendar.advance(s, 1);
  assert.equal(s.status, "bankrupt");
  assert.throws(() => G.Calendar.advance(s), /bancarrota/);
  const t = G.createGame("Otro", "", 103),
    rival = t.companies[1];
  rival.status = "bankrupt";
  G.Calendar.advance(t, 13);
  G.Race.start(t, G.nextEvent(t).id, true);
  assert.ok(!t.race.entrants.some((a) => a.companyId === rival.id));
});
test("Noticias y transacciones reflejan las entidades del mismo mundo", () => {
  const { G } = engine(),
    s = G.createGame("Noticias", "", 345),
    d = hire(G, s);
  const n = s.news.find((n) => n.entityId === d.id);
  assert.ok(n);
  assert.equal(
    s.drivers.find((d) => d.id === n.entityId).companyId,
    s.playerId,
  );
  G.Calendar.advance(s, 13);
  const e = G.nextEvent(s);
  G.Race.skip(s, e.id);
  const result = s.news.find((n) => n.entityId === e.id);
  assert.ok(result);
  assert.ok(e.results.length);
  assert.ok(
    s.companies
      .find((c) => c.id === e.results[0].companyId)
      .ledger.some((t) => t.category === "Premios"),
  );
});
test("Recuperación: los encargos cobrados el último día evitan la bancarrota", () => {
  const { G } = engine(),
    s = G.createGame("Recuperación", "", 71),
    p = G.player(s);
  p.balance = -100;
  p.debtDays = 13;
  s.job = { end: 1, net: 360 };
  G.Calendar.advance(s, 1);
  assert.equal(s.status, "active");
  assert.equal(p.debtDays, 0);
  assert.equal(p.balance, 242);
});
test("Inscripción vencida: baja al terminar un contrato y la siguiente temporada mantiene fechas futuras", () => {
  const { G } = engine(),
    s = G.createGame("Continuidad", "", 72),
    d = hire(G, s),
    car = G.ownedCars(s)[0],
    e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, car.id);
  d.contract.end = 1;
  G.Calendar.advance(s, 1);
  assert.equal(e.entry, null);
  for (const e of s.season.events) {
    G.Calendar.advance(s, e.day - s.day);
    G.Race.skip(s, e.id);
  }
  G.player(s).balance = 100000;
  // Avanzar más allá de la fecha normal de apertura no genera carreras en el pasado.
  G.Calendar.advance(s, 100);
  G.Calendar.nextSeason(s);
  assert.ok(G.nextEvent(s).day > s.day);
});
