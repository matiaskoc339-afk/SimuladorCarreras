const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function buy(G, s, id) {
  return G.Workshop.buy(s, G.Workshop.stock(s, id)[0].id);
}
function complete(G, s, car) {
  const end = car.repair.end;
  G.Calendar.advance(s, end - s.day);
  assert.equal(car.repair, null);
}
function install(G, s, car, id) {
  const p = buy(G, s, id);
  G.Workshop.install(s, car.id, p.id);
  complete(G, s, car);
  return p;
}
function race(G, s, solo = false) {
  const e = G.nextEvent(s),
    d = G.ownedDrivers(s)[0],
    c = G.ownedCars(s)[0];
  G.Race.register(s, e.id, d.id, c.id);
  G.Calendar.advance(s, e.day - s.day);
  G.Race.start(s, e.id);
  if (solo) {
    s.race.entrants = s.race.entrants.filter((a) => a.companyId === s.playerId);
    s.race.entrants[0].progress = 0;
  }
  return s.race;
}
function hire(G, s) {
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 12, 0);
  return d;
}
test("Repuesto físico: compra, dinero al proveedor y rechazo de doble compra", () => {
  const { G } = engine(),
    s = G.createGame("Compra", "", 301),
    id = G.Workshop.stock(s, "brakes-club")[0].id,
    p = s.parts.find((p) => p.id === id),
    before = G.player(s).balance,
    supplier = s.partsSupplier.balance;
  G.Workshop.buy(s, id);
  assert.equal(p.companyId, s.playerId);
  assert.equal(p.carId, null);
  assert.equal(G.player(s).balance, before - 640);
  assert.equal(s.partsSupplier.balance, supplier + 640);
  const state = JSON.stringify(s);
  assert.throws(() => G.Workshop.buy(s, id), /disponible/);
  assert.equal(JSON.stringify(s), state);
  G.Storage.validate(s);
});
test("Instalación con plazo: reserva, cambia atributos al terminar y no duplica piezas ni pagos", () => {
  const { G } = engine(),
    s = G.createGame("Montaje", "", 302),
    car = G.ownedCars(s)[0],
    p = buy(G, s, "brakes-club"),
    before = car.brakes,
    cash = G.player(s).balance;
  const j = G.Workshop.install(s, car.id, p.id);
  assert.equal(p.reservedFor, j.id);
  assert.equal(car.brakes, before);
  assert.equal(G.player(s).balance, cash - 130);
  G.Calendar.advance(s, 1);
  assert.ok(car.repair);
  assert.equal(car.brakes, before);
  G.Calendar.advance(s, 1);
  assert.equal(car.repair, null);
  assert.equal(car.brakes, before + 11);
  assert.equal(p.carId, car.id);
  assert.equal(p.reservedFor, null);
  assert.ok(!G.Workshop.inventory(s).some((x) => x.id === p.id));
  const snapshot = JSON.stringify(s);
  G.Workshop.complete(s, car);
  assert.equal(JSON.stringify(s), snapshot);
  assert.equal(s.parts.filter((x) => x.id === p.id).length, 1);
});
test("Compatibilidad por modelo, dependencias y reglamento: sin cargo ni reserva al fallar", () => {
  const { G } = engine(),
    s = G.createGame("Reglamento", "", 303),
    car = G.ownedCars(s)[0],
    wrong = buy(G, s, "ecu-t23");
  let old = JSON.stringify(s);
  assert.throws(
    () => G.Workshop.install(s, car.id, wrong.id),
    /Modelo incompatible/,
  );
  assert.equal(JSON.stringify(s), old);
  install(G, s, car, "ecu-ep3");
  install(G, s, car, "intake-club");
  assert.equal(car.hp, 210);
  const exhaust = buy(G, s, "exhaust-light");
  old = JSON.stringify(s);
  assert.throws(() => G.Workshop.install(s, car.id, exhaust.id), /210/);
  assert.equal(JSON.stringify(s), old);
});
test("Sobrealimentación: requiere refrigeración y embrague; no permite desmontar requisitos activos", () => {
  const { G } = engine(),
    s = G.createGame("Compresor", "", 304);
  G.player(s).balance = 50000;
  const listing = s.market.find(
      (l) => s.cars.find((c) => c.id === l.carId).modelIndex === 3,
    ),
    car = G.Market.buy(s, listing.id),
    p = buy(G, s, "supercharger-e36");
  assert.throws(() => G.Workshop.install(s, car.id, p.id), /Requiere/);
  install(G, s, car, "cooling-race");
  install(G, s, car, "clutch-sport");
  const hp = car.hp;
  G.Workshop.install(s, car.id, p.id);
  complete(G, s, car);
  assert.equal(car.hp, hp + 35);
  const old = JSON.stringify(s);
  assert.throws(() => G.Workshop.remove(s, car.id, "cooling"), /Requiere/);
  assert.equal(JSON.stringify(s), old);
  G.Storage.validate(s);
});
test("Bahía compartida e inscripción: encargos, revisiones e instalaciones no pueden solaparse", () => {
  const { G } = engine(),
    s = G.createGame("Bahía", "", 305),
    car = G.ownedCars(s)[0],
    p = buy(G, s, "brakes-club");
  hire(G, s);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, G.ownedDrivers(s)[0].id, car.id);
  assert.throws(() => G.Workshop.install(s, car.id, p.id), /inscripción/);
  G.Race.withdraw(s, e.id);
  G.Economy.job(s);
  assert.throws(() => G.Workshop.install(s, car.id, p.id), /ocupado/);
  G.Calendar.advance(s, 3);
  G.Workshop.install(s, car.id, p.id);
  assert.throws(() => G.Economy.job(s), /ocupado/);
  assert.throws(() => G.Economy.repair(s, car.id), /ocupado/);
  assert.throws(
    () => G.Market.list(s, car.id, G.Market.value(car)),
    /revisión/,
  );
});
test("Almacén lleno y desmontaje: reserva plaza futura sin desbordar ni producir unidades", () => {
  const { G } = engine(),
    s = G.createGame("Espacio", "", 306),
    car = G.ownedCars(s)[0],
    p = install(G, s, car, "brakes-club");
  p.condition = 72;
  G.player(s).sparesCapacity = 1;
  G.Facilities.site(s).base.spares = 1; // Almacén reducido del escenario controlado.
  G.Workshop.remove(s, car.id, "brakes");
  assert.equal(G.Workshop.occupied(s), 1);
  const before = JSON.stringify(s);
  assert.throws(() => buy(G, s, "intake-club"), /lleno/);
  assert.equal(JSON.stringify(s), before);
  complete(G, s, car);
  assert.equal(p.carId, null);
  assert.equal(p.condition, 72);
  assert.equal(car.brakes, car.base.brakes);
  assert.equal(G.Workshop.inventory(s).length, 1);
  G.Storage.validate(s);
});
test("Reemplazar una mejora recupera exactamente la antigua con su desgaste", () => {
  const { G } = engine(),
    s = G.createGame("Reemplazo", "", 307),
    car = G.ownedCars(s)[0],
    old = install(G, s, car, "tires-sport");
  car.components.tires = 61;
  car.tires = 61;
  old.condition = 61;
  const fresh = buy(G, s, "tires-endurance");
  G.Workshop.install(s, car.id, fresh.id);
  complete(G, s, car);
  assert.equal(old.carId, null);
  assert.equal(old.condition, 61);
  assert.equal(fresh.carId, car.id);
  assert.equal(car.installed.tires, fresh.id);
  assert.equal(car.tires, 100);
  assert.equal(
    G.Workshop.inventory(s).filter((p) => p.id === old.id).length,
    1,
  );
});
test("Desmontar gomas conserva el juego original; no genera neumáticos nuevos gratuitos", () => {
  const { G } = engine(),
    s = G.createGame("Gomas", "", 308),
    car = G.ownedCars(s)[0];
  car.components.tires = 47;
  car.tires = 47;
  car.oemTires = 47;
  const p = install(G, s, car, "tires-sport");
  assert.equal(car.oemTires, 47);
  car.components.tires = 68;
  car.tires = 68;
  p.condition = 68;
  G.Workshop.remove(s, car.id, "tires");
  complete(G, s, car);
  assert.equal(car.tires, 47);
  assert.equal(p.condition, 68);
  assert.equal(p.carId, null);
});
test("Reparación focal: solo restaura el componente elegido y respeta el desgaste de las mejoras", () => {
  const { G } = engine(),
    s = G.createGame("Diagnóstico", "", 309),
    car = G.ownedCars(s)[0],
    p = install(G, s, car, "ecu-ep3");
  p.condition = 65;
  car.components.engine = 42;
  car.components.brakes = 71;
  G.Workshop.recalculate(s, car);
  const brakes = car.components.brakes;
  G.Workshop.repair(s, car.id, "engine");
  complete(G, s, car);
  assert.equal(car.components.engine, 100);
  assert.equal(car.components.brakes, brakes);
  assert.equal(p.condition, 65);
  assert.ok(car.condition < 100);
  assert.ok(car.hp < 205);
});
test("Un componente crítico bloquea competir aunque el promedio parezca aceptable", () => {
  const { G } = engine(),
    s = G.createGame("Fiabilidad", "", 310),
    car = G.ownedCars(s)[0],
    d = hire(G, s);
  car.components.engine = 12;
  G.Workshop.recalculate(s, car);
  assert.ok(car.condition > 45);
  assert.throws(
    () => G.Race.register(s, G.nextEvent(s).id, d.id, car.id),
    /mantenimiento/,
  );
});
test("Las mejoras cambian el rendimiento real en pista, no solo las cifras de la ficha", () => {
  const { G } = engine(),
    base = G.createGame("Banco", "", 311);
  hire(G, base);
  const tuned = G.clone(base),
    car = G.ownedCars(tuned)[0];
  install(G, tuned, car, "brakes-club");
  install(G, tuned, car, "suspension-club");
  race(G, base, true);
  race(G, tuned, true);
  G.Race.tick(base, 2000);
  G.Race.tick(tuned, 2000);
  assert.ok(
    tuned.race.entrants[0].progress > base.race.entrants[0].progress + 10,
  );
  assert.notEqual(
    tuned.race.entrants[0].components.brakes,
    base.race.entrants[0].components.brakes,
  );
});
test("Compuestos: el deportivo gana agarre a costa de mayor desgaste", () => {
  const { G } = engine(),
    base = G.createGame("Compuesto", "", 312);
  hire(G, base);
  const tuned = G.clone(base),
    car = G.ownedCars(tuned)[0];
  install(G, tuned, car, "tires-sport");
  race(G, base, true);
  race(G, tuned, true);
  G.Race.tick(base, 2500);
  G.Race.tick(tuned, 2500);
  assert.ok(tuned.race.entrants[0].tires < base.race.entrants[0].tires);
  assert.ok(tuned.race.entrants[0].grip > base.race.entrants[0].grip);
});
test("Refrigeración: reduce temperatura y desgaste del motor durante conducción agresiva", () => {
  const { G } = engine(),
    s = G.createGame("Calor", "", 313);
  hire(G, s);
  install(G, s, G.ownedCars(s)[0], "ecu-ep3");
  const cool = G.clone(s);
  install(G, cool, G.ownedCars(cool)[0], "cooling-race");
  race(G, s, true);
  race(G, cool, true);
  G.Race.order(s, "attack");
  G.Race.order(cool, "attack");
  G.Race.tick(s, 3500);
  G.Race.tick(cool, 3500);
  const a = s.race.entrants[0],
    b = cool.race.entrants[0];
  assert.ok(a.thermal > b.thermal + 4);
  assert.ok(a.components.engine < b.components.engine);
});
test("Desgaste de carrera vuelve al coche y a las piezas, y guardar a mitad reproduce el resultado", () => {
  const { G } = engine(),
    s = G.createGame("Desgaste", "", 314);
  hire(G, s);
  const car = G.ownedCars(s)[0],
    p = install(G, s, car, "suspension-club");
  race(G, s);
  G.Race.tick(s, 900);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  while (!s.race.finished) G.Race.tick(s, 1);
  while (!copy.race.finished) G.Race.tick(copy, 80);
  assert.deepEqual(json(G.Race.finish(s)), json(G.Race.finish(copy)));
  assert.ok(car.components.engine < 100);
  assert.ok(p.condition < 100);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(s);
});
test("Venta del coche transfiere las mejoras instaladas sin tocar los repuestos del vendedor", () => {
  const { G } = engine(),
    s = G.createGame("Activo completo", "", 315),
    car = G.ownedCars(s)[0],
    p = install(G, s, car, "brakes-club"),
    spare = buy(G, s, "intake-club"),
    buyer = s.companies[1];
  buyer.balance = 40000;
  const price = G.Market.value(car),
    l = G.Market.list(s, car.id, price);
  G.Market.buy(s, l.id, buyer.id);
  assert.equal(p.companyId, buyer.id);
  assert.equal(p.carId, car.id);
  assert.equal(spare.companyId, s.playerId);
  assert.equal(car.installed.brakes, p.id);
  assert.ok(car.upgradeValue > 0);
  G.Storage.validate(s);
});
test("Venta de repuestos: oferta limitada, recompra con desgaste y fondos contrapuestos", () => {
  const { G } = engine(),
    s = G.createGame("Proveedor", "", 316),
    p = buy(G, s, "brakes-club");
  p.condition = 70;
  const funds = s.partsSupplier.balance,
    balance = G.player(s).balance;
  const value = G.Workshop.sell(s, p.id);
  assert.equal(value, 269);
  assert.equal(s.partsSupplier.balance, funds - value);
  assert.equal(G.player(s).balance, balance + value);
  assert.equal(p.companyId, null);
  assert.equal(p.condition, 70);
  assert.throws(() => G.Workshop.sell(s, p.id), /pertenece/);
});
test("Reanudar una instalación no vuelve a cobrar ni reserva o duplica una segunda pieza", () => {
  const { G } = engine(),
    s = G.createGame("Reserva", "", 317),
    car = G.ownedCars(s)[0],
    p = buy(G, s, "brakes-club");
  G.Workshop.install(s, car.id, p.id);
  G.Calendar.advance(s, 1);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state,
    count = copy.parts.length,
    balance = G.player(copy).balance;
  G.Calendar.advance(copy, 1);
  const c = copy.cars.find((c) => c.id === car.id);
  assert.equal(c.repair, null);
  assert.equal(c.installed.brakes, p.id);
  assert.equal(copy.parts.length, count);
  assert.equal(G.player(copy).balance, balance - 18);
  assert.equal(copy.parts.filter((x) => x.id === p.id).length, 1);
});
test("Migración auténtica 0.2 conserva resultados exactos de una carrera en curso", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v2-race.json"),
      "utf8",
    ),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.equal(s.version, 3);
  assert.deepEqual(json(s.race), old.race);
  assert.equal(s.rng, old.rng);
  assert.equal(s.cars.length, old.cars.length);
  for (const c of old.cars)
    for (const k of Object.keys(c))
      assert.deepEqual(json(s.cars.find((x) => x.id === c.id)[k]), c[k]);
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v2-results.json"), "utf8"),
    ),
  );
  G.Storage.validate(s);
});
test("La IA compra, monta y usa modificaciones del inventario compartido", () => {
  const { G } = engine(),
    s = G.createGame("Taller rival", "", 318),
    c = s.companies[2];
  c.balance = 30000;
  c.nextDecision = 0;
  G.Calendar.advance(s, 12);
  const cars = G.ownedCars(s, c.id);
  assert.ok(cars.some((car) => Object.keys(car.installed).length > 0));
  assert.ok(c.decisions.some((d) => d.action === "instalación"));
  G.Calendar.advance(s, 1);
  G.Race.start(s, G.nextEvent(s).id, true);
  const a = s.race.entrants.find((a) => a.companyId === c.id);
  assert.ok(a && Object.keys(a.partWear).length > 0);
  G.Storage.validate(s);
});
test("Validación rechaza piezas huérfanas, dobles montajes y reservas inválidas", () => {
  const { G } = engine(),
    s = G.createGame("Integridad", "", 319),
    car = G.ownedCars(s)[0],
    p = install(G, s, car, "brakes-club");
  const duplicate = G.clone(s);
  duplicate.cars[1].installed.brakes = p.id;
  assert.throws(() => G.Storage.pack(duplicate), /Pieza instalada/);
  const orphan = G.clone(s);
  orphan.parts.find((x) => x.id === p.id).carId = null;
  assert.throws(() => G.Storage.pack(orphan), /Pieza instalada/);
  const reservation = G.clone(s);
  reservation.parts.find((x) => x.companyId === null).reservedFor = "work-999";
  assert.throws(() => G.Storage.pack(reservation), /proveedor|Reserva/);
});
test("Renovar neumáticos de mejora actualiza agarre, condición y coste real sin duplicar unidades", () => {
  const { G } = engine(),
    s = G.createGame("Servicio de gomas", "", 320),
    car = G.ownedCars(s)[0],
    p = install(G, s, car, "tires-sport");
  p.condition = 35;
  car.components.tires = 35;
  G.Workshop.recalculate(s, car);
  const before = G.player(s).balance,
    count = s.parts.length;
  G.Economy.tires(s, car.id);
  assert.equal(G.player(s).balance, before - 330);
  assert.equal(car.grip, car.base.grip + 5);
  assert.equal(p.condition, 100);
  assert.equal(car.tires, 100);
  assert.equal(s.parts.length, count);
  p.condition = 42;
  car.components.tires = 42;
  G.Workshop.recalculate(s, car);
  const quote = G.Workshop.repairQuote(car, "tires", s);
  assert.equal(quote, 330);
  G.Workshop.repair(s, car.id, "tires");
  complete(G, s, car);
  assert.equal(p.condition, 100);
  assert.equal(car.grip, car.base.grip + 5);
  G.Storage.validate(s);
});
test("Migrar una revisión antigua en curso conserva plazo y coste ya pagado", () => {
  const { G } = engine(),
    old = JSON.parse(
      JSON.parse(
        fs.readFileSync(path.join(__dirname, "fixtures/v2-race.json"), "utf8"),
      ).data,
    );
  old.race = null;
  old.season.events[0].status = "skipped";
  const car = old.cars.find((c) => c.companyId === "player");
  car.repair = { end: old.day + 2, cost: 575 };
  const body = JSON.stringify(old),
    raw = JSON.stringify({
      format: "RCS",
      version: 2,
      savedAt: new Date().toISOString(),
      checksum: G.Storage.checksum(body),
      data: body,
    }),
    s = G.Storage.unpack(raw).state,
    c = s.cars.find((c) => c.id === car.id),
    balance = G.player(s).balance;
  assert.equal(c.repair.end, old.day + 2);
  assert.equal(c.repair.cost, 575);
  G.Calendar.advance(s, 2);
  assert.equal(c.repair, null);
  assert.equal(c.condition, 100);
  assert.equal(G.player(s).balance, balance - 36);
  G.Storage.validate(s);
});
