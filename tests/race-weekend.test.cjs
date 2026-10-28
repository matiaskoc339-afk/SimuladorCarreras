const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function grid(seed = 810, options = {}) {
  const { G } = engine(),
    s = G.createGame("Fin de semana", "", seed),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  G.Race.register(s, e.id, d.id, car.id, options);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  const r = s.race;
  delete r.professionalVersion; // Regresión del modelo de fin de semana 0.5, conservado para carreras antiguas.
  r.entrants = r.entrants.filter((a) => a.companyId === s.playerId);
  r.weather.rain = 0;
  r.weather.wetness = 0;
  r.weather.phase = "dry";
  r.weather.plan = [
    { time: 0, rain: 0 },
    { time: 10000, rain: 0 },
    { time: 11000, rain: 0 },
  ];
  return { G, s, r, a: r.entrants[0], d, e, car };
}
function finish(G, s, steps = 300) {
  while (!s.race.finished) G.Race.tick(s, steps);
  return G.Race.finish(s);
}
function until(G, s, predicate, max = 20000) {
  for (let i = 0; i < max && !predicate(); i++) G.Race.tick(s, 1);
  assert.ok(predicate(), "La simulación debe alcanzar la fase prevista");
}
test("Salida con slicks: unidad física reservada, pago único y neumático de calle preservado", () => {
  const { G, s, r, a, car } = grid(810, { compound: "soft" });
  const t = s.raceSupplies.sets.find((t) => t.id === a.tyreSetId);
  assert.equal(t.compound, "soft");
  assert.equal(t.status, "running");
  assert.equal(s.raceSupplies.stock.soft, 31);
  assert.equal(a.tires, 100);
  G.Storage.validate(s);
  const road = a.roadCondition;
  G.Race.tick(s, 600);
  assert.ok(a.tires < 100);
  finish(G, s);
  assert.equal(car.tires, road);
  assert.equal(t.status, "stored");
  assert.ok(t.condition < 100);
  assert.equal(s.raceSupplies.lastReplay.eventId, r.eventId);
  G.Storage.validate(s);
});
test("Retirar inscripción conserva el juego comprado; reinscribir reutiliza el mismo ID y no lo paga otra vez", () => {
  const { G } = engine(),
    s = G.createGame("Reserva", "", 811),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  const balance = G.player(s).balance;
  G.Race.register(s, e.id, d.id, car.id, { compound: "hard" });
  const id = e.entry.tyreSetId;
  assert.equal(G.player(s).balance, balance - 570);
  G.Race.withdraw(s, e.id);
  assert.equal(s.raceSupplies.sets.find((t) => t.id === id).status, "stored");
  G.Race.register(s, e.id, d.id, car.id, { compound: "hard" });
  assert.equal(e.entry.tyreSetId, id);
  assert.equal(G.player(s).balance, balance - 940);
  G.Storage.validate(s);
});
test("Stock agotado o fondos insuficientes bloquean la inscripción sin cobros ni reservas parciales", () => {
  const { G } = engine(),
    s = G.createGame("Límite", "", 812),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  s.raceSupplies.stock.wet = 0;
  let before = JSON.stringify(s);
  assert.throws(
    () => G.Race.register(s, e.id, d.id, car.id, { compound: "wet" }),
    /quedan/,
  );
  assert.equal(JSON.stringify(s), before);
  G.player(s).balance = 400;
  before = JSON.stringify(s);
  assert.throws(
    () => G.Race.register(s, e.id, d.id, car.id, { compound: "soft" }),
    /fondos/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("Proveedor: entrega mensual financiada, sin reponer al cargar o repetir el día", () => {
  const { G } = engine(),
    s = G.createGame("Proveedor", "", 813);
  s.raceSupplies.stock.soft = 20;
  s.day = 30;
  const balance = s.partsSupplier.balance;
  G.RaceWeekend.daily(s);
  assert.equal(s.raceSupplies.stock.soft, 28);
  assert.equal(s.partsSupplier.balance, balance - 8 * 88);
  const once = json(s);
  G.RaceWeekend.daily(s);
  assert.deepEqual(json(s), once);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), once);
});
test("Compuestos: lluvia/intermedio ganan agarre sobre agua; slicks secos y durabilidad tienen compromisos", () => {
  const { G, r, a } = grid(814),
    get = (c) => {
      a.compound = c;
      a.tyreTemp =
        c === "soft" ? 85 : c === "hard" ? 95 : c === "inter" ? 62 : 52;
      return G.RaceWeekend.grip(r, a);
    };
  r.weather.wetness = 0;
  assert.ok(get("soft") > get("hard"));
  assert.ok(get("hard") > get("wet"));
  r.weather.wetness = 0.9;
  assert.ok(get("wet") > get("soft") * 1.5);
  r.weather.wetness = 0.35;
  assert.ok(get("inter") > get("road"));
  a.compound = "wet";
  r.weather.wetness = 0;
  const wearDry = G.RaceWeekend.wearFactor(r, a);
  r.weather.wetness = 1;
  assert.ok(wearDry > G.RaceWeekend.wearFactor(r, a));
});
test("Clima dinámico: lluvia moja gradualmente, afecta frenada y se seca sin saltos", () => {
  const { G, s, r, a } = grid(815);
  r.weather.plan = [
    { time: 0, rain: 0.9 },
    { time: 50, rain: 0 },
    { time: 10000, rain: 0 },
  ];
  G.Race.tick(s, 700);
  const wet = r.weather.wetness;
  assert.ok(wet > 0.05 && wet < 1);
  assert.ok(r.events.some((e) => e.type === "weather"));
  a.compound = "soft";
  assert.ok(G.RaceWeekend.errorFactor(r, a) > 1);
  G.Race.tick(s, 2000);
  assert.ok(r.weather.rain < 0.05);
  assert.ok(r.weather.wetness < 1);
  G.Storage.validate(s);
});
test("Orden de boxes: reserva y pago del juego; cancelar devuelve combustible y conserva la compra", () => {
  const { G, s, a } = grid(816),
    cash = G.player(s).balance,
    fuel = s.raceSupplies.fuelStock;
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "inter", fuel: 2 });
  const id = a.pit.setId;
  assert.equal(G.player(s).balance, cash - 240);
  assert.equal(s.raceSupplies.fuelStock, fuel - 2);
  assert.equal(a.pit.phase, "queued");
  const before = JSON.stringify(s);
  assert.throws(() =>
    G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard" }),
  );
  assert.equal(JSON.stringify(s), before);
  G.RaceWeekend.cancelPit(s);
  assert.equal(a.pit.phase, "none");
  assert.equal(s.raceSupplies.fuelStock, fuel);
  assert.equal(s.raceSupplies.sets.find((t) => t.id === id).status, "stored");
  assert.equal(G.player(s).balance, cash - 240);
  G.Storage.validate(s);
});
test("Parada física: carril métrico, detención, servicio, cobro y reincorporación sin progreso ficticio", () => {
  const { G, s, r, a } = grid(817),
    cash = G.player(s).balance;
  G.RaceWeekend.requestPit(s, s.playerId, {
    compound: "hard",
    fuel: 2,
    repair: true,
  });
  const initial = a.components.cooling;
  a.components.cooling = 40;
  a.components.suspension = 45;
  a.condition = G.Workshop.summary(a.components);
  until(G, s, () => a.pit.phase === "box");
  assert.ok(Math.abs(a.lateral) > 10);
  assert.equal(a.speed, 0);
  const progress = a.progress;
  G.Race.tick(s, 20);
  assert.equal(a.progress, progress);
  assert.ok(a.pit.remaining > 0);
  G.Storage.validate(s);
  until(G, s, () => a.pit.phase === "none");
  assert.equal(a.pitStops, 1);
  assert.equal(a.compound, "hard");
  assert.ok(a.components.cooling > 40);
  assert.ok(a.components.cooling < initial);
  assert.ok(a.fuel > 3);
  assert.equal(G.player(s).balance, cash - 200 - 55 - 140 - 10);
  assert.ok(r.events.some((e) => e.type === "pit-out"));
  assert.ok(Math.abs(a.lateral) < 1);
  G.Storage.validate(s);
});
test("Reparación rápida no rejuvenece piezas instaladas ni otros sistemas base", () => {
  const { G, s, a } = grid(818);
  a.components.engine = 64;
  a.components.transmission = 68;
  a.components.body = 35;
  a.components.suspension = 35;
  a.components.cooling = 35;
  const before = G.clone(a.partWear);
  G.RaceWeekend.requestPit(s, s.playerId, { repair: true });
  until(G, s, () => a.pit.phase === "box");
  const engine = a.components.engine,
    transmission = a.components.transmission;
  until(G, s, () => a.pit.phase === "exit");
  assert.equal(a.components.engine, engine);
  assert.equal(a.components.transmission, transmission);
  assert.ok(a.components.body > 35);
  for (const [id, value] of Object.entries(before))
    assert.ok(a.partWear[id] <= value);
  G.Storage.validate(s);
});
test("Limitador: el exceso medido causa5s una sola vez; parada normal no recibe sanción", () => {
  for (const limiter of [true, false]) {
    const { G, s, a } = grid(limiter ? 819 : 820);
    a.pit.limiter = limiter;
    G.RaceWeekend.requestPit(s, s.playerId, {});
    until(G, s, () => a.pit.phase === "none");
    assert.equal(a.totalPenalty, limiter ? 0 : 5);
    assert.equal(a.unservedPenalty, 0);
    G.Storage.validate(s);
  }
});
test("Combustible: ahorrar reduce consumo y ritmo; agotar el depósito provoca abandono real", () => {
  const { G, s, a } = grid(821),
    copy = G.clone(s);
  a.mode = "balanced";
  copy.race.entrants[0].mode = "fuel";
  G.Race.tick(s, 600);
  G.Race.tick(copy, 600);
  assert.ok(a.progress > copy.race.entrants[0].progress);
  assert.ok(a.fuel < copy.race.entrants[0].fuel);
  const { G: H, s: t, a: b } = grid(822);
  b.fuel = 0.00001;
  H.Race.tick(t, 10);
  assert.equal(b.dnf, true);
  assert.equal(b.dnfReason, "Sin combustible");
});
test("Pinchazo contextual: neumático agotado pierde ritmo y cambiarlo en boxes lo resuelve", () => {
  const { G, s, r, a } = grid(823);
  a.tires = 2;
  a.components.tires = 2;
  until(G, s, () => a.puncture, 6000);
  assert.ok(r.events.some((e) => e.type === "puncture"));
  assert.ok(G.RaceWeekend.target(r, a, 50, 6) <= 14);
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard" });
  until(G, s, () => a.pit.phase === "none");
  assert.equal(a.puncture, false);
  assert.ok(a.tires > 95);
  G.Storage.validate(s);
});
test("VSC: dos retirados que bloquean activan límite global y el procedimiento termina", () => {
  const { G, s, r, a } = grid(824);
  const b = G.clone(a);
  b.carId = s.cars.find((c) => c.id !== a.carId).id;
  b.driverId = s.drivers.find((d) => d.id !== a.driverId).id;
  b.companyId = s.companies[1].id;
  b.dnf = true;
  b.retiredAt = r.time;
  b.lateral = 0;
  b.progress = 100;
  a.dnf = true;
  a.retiredAt = r.time;
  a.lateral = 1;
  r.entrants.push(b);
  const c = G.clone(a);
  c.dnf = false;
  c.companyId = s.companies[2].id;
  c.carId = s.cars.find((car) => car.companyId === c.companyId).id;
  c.driverId = s.drivers.find((d) => d.companyId === c.companyId).id;
  c.progress = 500;
  r.entrants.push(c);
  G.Race.tick(s, 1);
  assert.equal(r.safety.active, true);
  assert.equal(G.Race.underYellow(r, c), true);
  assert.ok(G.RaceWeekend.target(r, c, 60, 6) <= 20);
  G.Race.tick(s, 420);
  assert.equal(r.safety.active, false);
  assert.ok(r.events.some((e) => e.type === "safety-end"));
});
test("Guardar durante el servicio conserva tiempo, factura, juego y resultado exacto", () => {
  const { G, s, a } = grid(825);
  G.RaceWeekend.requestPit(s, s.playerId, {
    compound: "soft",
    fuel: 2,
    repair: true,
  });
  until(G, s, () => a.pit.phase === "box");
  G.Race.tick(s, 30);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  const rows1 = finish(G, s, 1),
    rows2 = finish(G, copy, 80);
  assert.deepEqual(json(rows1), json(rows2));
  assert.deepEqual(json(s), json(copy));
});
test("Repetición: estados grabados, límites de memoria y navegación sin alterar la simulación o RNG", () => {
  const { G, s, r } = grid(826);
  r.entrants[0].top = 60;
  G.Race.tick(s, 5500);
  assert.ok(r.replay.frames.length <= 480);
  assert.ok(r.replay.sampleEvery > 10);
  G.Storage.validate(s);
  const before = JSON.stringify(s);
  for (const time of [0, 10, 80, r.time]) {
    const snap = G.RaceWeekend.playback(r.replay, time);
    assert.ok(snap.entrants.every((a) => Number.isFinite(a.progress)));
    assert.ok(Math.abs(snap.time - time) < 0.001);
  }
  assert.equal(JSON.stringify(s), before);
  const results = finish(G, s);
  const rec = s.raceSupplies.lastReplay,
    final = G.RaceWeekend.playback(rec, rec.duration);
  assert.ok(final.entrants[0].finishTime !== null || final.entrants[0].dnf);
  const player = final.entrants.find((a) => a.companyId === s.playerId);
  assert.equal(
    player.finishTime,
    results.find((row) => row.companyId === s.playerId).time,
  );
  G.Storage.validate(s);
});
test("Carrera0.4 auténtica: resultado, economía, contratos y entidades exactamente iguales al commit2bc6a4f", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v4-race.json"),
      "utf8",
    ),
    s = G.Storage.unpack(raw).state;
  assert.equal(s.race.weekendVersion, undefined);
  const rows = finish(G, s);
  assert.deepEqual(
    json(rows),
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v4-results.json"), "utf8"),
    ),
  );
  const actual = json(s);
  delete actual.professional; // Bloque aditivo de la nueva versión.
  delete actual.raceSupplies;
  delete actual.expansion; // Bloque nuevo; el estado y algoritmo 0.4 se conservan.
  delete actual.staffing;
  actual.employees = []; // Las plantillas anteriores no contenían personal.
  assert.deepEqual(
    actual,
    JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "fixtures/v4-finished.json"),
        "utf8",
      ),
    ),
  );
  G.Storage.validate(s);
});
test("Validación rechaza clima, paradas, juegos y fotogramas corruptos antes de cargar", () => {
  const { G, s, a } = grid(827, { compound: "hard" });
  G.Race.tick(s, 100);
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "inter", fuel: 1 });
  for (const mutate of [
    (x) => (x.race.weather.wetness = 2),
    (x) => (x.race.weather.plan[0].rain = NaN),
    (x) => (x.race.entrants[0].pit.remaining = NaN),
    (x) => (x.race.entrants[0].fuel = -1),
    (x) => x.raceSupplies.sets.push(G.clone(x.raceSupplies.sets[0])),
    (x) => (x.race.replay.frames[0].cars[0][0] = NaN),
    (x) => (x.race.replay.frames[0].time = -4),
  ]) {
    const c = G.clone(s);
    mutate(c);
    assert.throws(() => G.Storage.validate(c));
  }
  G.Storage.validate(s);
});

test("Volver a un neumático de calle pinchado conserva el daño; descartar juegos libres libera almacén sin crear dinero", () => {
  const { G, s, r, a } = grid(828);
  a.puncture = true;
  a.roadPuncture = true;
  a.roadCondition = 5;
  G.RaceWeekend.fitSet(s, r, a, null);
  assert.equal(a.puncture, true);
  finish(G, s);
  const e = G.nextEvent(s),
    q = G.RaceWeekend.reserve(s, s.playerId, "hard", e.id);
  q.status = "stored";
  q.eventId = null;
  const cash = G.player(s).balance;
  G.RaceWeekend.discard(s, q.id);
  assert.equal(q.status, "used");
  assert.equal(G.player(s).balance, cash);
  const before = JSON.stringify(s);
  assert.throws(() => G.RaceWeekend.discard(s, q.id));
  assert.equal(JSON.stringify(s), before);
  G.Storage.validate(s);
});
test("No se compra una parada tras la última entrada ni se reserva más combustible que capacidad", () => {
  const { G, s, r, a } = grid(829);
  a.fuel = 7.5;
  const before = JSON.stringify(s);
  assert.throws(
    () => G.RaceWeekend.requestPit(s, s.playerId, { fuel: 2 }),
    /8 L/,
  );
  assert.equal(JSON.stringify(s), before);
  a.progress =
    G.Data.tracks[r.track].length * (G.Data.tracks[r.track].laps - 0.1);
  const after = JSON.stringify(s);
  assert.throws(
    () => G.RaceWeekend.requestPit(s, s.playerId, { compound: "soft" }),
    /meta/,
  );
  assert.equal(JSON.stringify(s), after);
});
test("Retirar al piloto devuelve también la reserva de neumáticos, sin duplicar el juego ni reembolsar su compra", () => {
  const { G } = engine(),
    s = G.createGame("Piloto", "", 830),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s);
  G.Drivers.offer(s, d.id, d.ask, 12);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id, { compound: "hard" });
  const id = e.entry.tyreSetId;
  G.Drivers.release(s, d.id);
  assert.equal(e.entry, null);
  assert.equal(s.raceSupplies.sets.find((t) => t.id === id).status, "stored");
  G.Storage.validate(s);
});

test("Interrumpir un servicio devuelve el repostaje no entregado y libera el juego reservado", () => {
  const { G, s, r, a } = grid(831),
    fuel = s.raceSupplies.fuelStock;
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard", fuel: 2 });
  until(G, s, () => a.pit.phase === "box");
  const id = a.pit.setId,
    cash = G.player(s).balance;
  G.Race.retire(r, a, "Daño que impide continuar");
  G.Race.tick(s, 1);
  finish(G, s);
  assert.equal(s.raceSupplies.fuelStock, fuel);
  assert.equal(s.raceSupplies.sets.find((t) => t.id === id).status, "stored");
  assert.equal(G.player(s).balance, cash + 10 + 250);
  G.Storage.validate(s);
});

test("Reparar en boxes nunca reduce la condición de un sistema que ya supera el tope de reparación", () => {
  const { G, s, a } = grid(832);
  a.components.body = 95;
  a.components.suspension = 95;
  a.components.cooling = 95;
  G.RaceWeekend.requestPit(s, s.playerId, { repair: true });
  until(G, s, () => a.pit.phase === "box");
  const before = {
    body: a.components.body,
    suspension: a.components.suspension,
    cooling: a.components.cooling,
  };
  until(G, s, () => a.pit.phase === "exit");
  for (const [k, n] of Object.entries(before)) assert.equal(a.components[k], n);
  G.Storage.validate(s);
});

test("La carga de combustible pesa: con el mismo coche, ritmo y superficie, una salida ligera acelera algo más", () => {
  const { G, s } = grid(833),
    copy = G.clone(s);
  s.race.entrants[0].fuel = 1;
  copy.race.entrants[0].fuel = 3;
  G.Race.tick(s, 100);
  G.Race.tick(copy, 100);
  assert.ok(s.race.entrants[0].progress > copy.race.entrants[0].progress);
  assert.ok(s.race.entrants[0].fuel < copy.race.entrants[0].fuel);
});
