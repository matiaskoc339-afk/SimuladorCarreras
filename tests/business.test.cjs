const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function hire(G, s) {
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 12, 0);
  return d;
}
const cash = (s) =>
  s.dealer.balance + s.companies.reduce((n, c) => n + c.balance, 0);
test("Mercado único: proveedor y compraventa entre compañías conservan caja, coche e historial", () => {
  const { G } = engine(),
    s = G.createGame("Mercado", "", 211),
    l = s.market[0],
    initial = s.cars.length,
    before = cash(s),
    p = G.player(s),
    car = s.cars.find((c) => c.id === l.carId);
  const balance = p.balance;
  G.Market.buy(s, l.id);
  assert.equal(car.companyId, p.id);
  assert.equal(p.balance, balance - l.price);
  assert.equal(s.dealer.balance, l.price);
  assert.ok(!s.market.some((x) => x.id === l.id));
  assert.equal(s.cars.length, initial);
  assert.equal(cash(s), before);
  const listing = G.Market.list(s, car.id, G.Market.value(car)),
    buyer = s.companies[1],
    price = listing.price;
  const pBefore = p.balance,
    bBefore = buyer.balance;
  G.Market.buy(s, listing.id, buyer.id);
  assert.equal(p.balance, pBefore + price);
  assert.equal(buyer.balance, bBefore - price);
  assert.equal(car.companyId, buyer.id);
  assert.equal(cash(s), before);
  assert.equal(
    G.ownedCars(s, buyer.id).filter((c) => c.id === car.id).length,
    1,
  );
  assert.ok(car.history[0].type.includes(buyer.name));
  G.Storage.validate(s);
  const saved = JSON.stringify(s);
  assert.throws(() => G.Market.buy(s, listing.id), /disponibles/);
  assert.equal(JSON.stringify(s), saved);
});
test("Mercado: límites de capacidad, falta de dinero, venta ajena y anuncio repetido no mutan saldos", () => {
  const { G } = engine(),
    s = G.createGame("Límites", "", 212);
  G.Market.buy(s, s.market[0].id);
  let old = JSON.stringify(s);
  assert.throws(() => G.Market.buy(s, s.market[0].id), /plazas/);
  assert.equal(JSON.stringify(s), old);
  const other = s.companies[1];
  other.balance = 0;
  old = JSON.stringify(s);
  assert.throws(() => G.Market.buy(s, s.market[0].id, other.id), /fondos/);
  assert.equal(JSON.stringify(s), old);
  const car = G.ownedCars(s)[0];
  assert.throws(() => G.Market.list(s, car.id, -1), /precio/);
  const l = G.Market.list(s, car.id, G.Market.value(car));
  old = JSON.stringify(s);
  assert.throws(() => G.Market.list(s, car.id, l.price), /anunciado/);
  assert.throws(() => G.Market.withdraw(s, l.id, other.id), /pertenece/);
  assert.equal(JSON.stringify(s), old);
  G.Market.withdraw(s, l.id);
  assert.ok(!G.Market.listed(s, car.id));
});
test("Venta, reparación e inscripción excluyentes; retirar inscripción no devuelve gastos", () => {
  const { G } = engine(),
    s = G.createGame("Inscripción", "", 213),
    car = G.ownedCars(s)[0],
    d = hire(G, s),
    e = G.nextEvent(s),
    l = G.Market.list(s, car.id, G.Market.value(car));
  const before = G.player(s).balance;
  assert.throws(() => G.Race.register(s, e.id, d.id, car.id), /mantenimiento/);
  assert.throws(() => G.Economy.repair(s, car.id), /anuncio/);
  assert.equal(G.player(s).balance, before);
  G.Market.withdraw(s, l.id);
  G.Race.register(s, e.id, d.id, car.id);
  assert.throws(
    () => G.Market.list(s, car.id, G.Market.value(car)),
    /inscripción/,
  );
  const after = G.player(s).balance;
  G.Race.withdraw(s, e.id);
  assert.equal(e.entry, null);
  assert.equal(G.player(s).balance, after);
  assert.throws(() => G.Race.withdraw(s, e.id), /inscripción/);
});
test("Traspaso: propietario único, pago al vendedor, nóminas devengadas e historial deportivo", () => {
  const { G } = engine(),
    s = G.createGame("Traspasos", "", 214),
    seller = s.companies[1],
    d = G.ownedDrivers(s, seller.id)[0];
  d.transferListed = true;
  d.contract.accrued = 130;
  d.starts = 9;
  d.points = 42;
  const fee = G.Companies.fee(s, d),
    a = G.player(s).balance,
    b = seller.balance;
  G.Companies.sign(s, d.id, s.playerId, G.Companies.salary(d), 12, 300);
  assert.equal(d.companyId, s.playerId);
  assert.equal(G.player(s).balance, a - fee - 300);
  assert.equal(seller.balance, b + fee - 130);
  assert.equal(G.ownedDrivers(s, seller.id).length, 0);
  assert.equal(d.contract.accrued, 0);
  assert.equal(d.points, 42);
  assert.equal(d.starts, 9);
  assert.ok(d.memory[0].event.includes(seller.name));
  G.Storage.validate(s);
  const saved = JSON.stringify(s);
  assert.throws(() => G.Companies.sign(s, d.id, s.playerId, 900), /disponible/);
  assert.equal(JSON.stringify(s), saved);
});
test("Ofertas al jugador: consentimiento obligatorio, rechazo, aceptación posterior y pago acordado", () => {
  const { G } = engine(),
    s = G.createGame("Ofertas", "", 215),
    d = hire(G, s),
    buyer = s.companies[1];
  buyer.balance = 20000;
  const salary = G.Companies.salary(d),
    before = JSON.stringify(s);
  assert.throws(() => G.Companies.sign(s, d.id, buyer.id, salary), /traspaso/);
  assert.equal(JSON.stringify(s), before);
  const rejected = G.Companies.offer(s, d.id, buyer.id);
  G.Companies.resolve(s, rejected.id, false);
  assert.equal(d.companyId, s.playerId);
  assert.equal(rejected.status, "rejected");
  const accepted = G.Companies.offer(s, d.id, buyer.id),
    fee = accepted.fee;
  s.day += 3;
  d.contract.accrued = 90;
  const p = G.player(s).balance,
    b = buyer.balance;
  G.Companies.resolve(s, accepted.id, true);
  assert.equal(accepted.status, "accepted");
  assert.equal(d.companyId, buyer.id);
  assert.equal(G.player(s).balance, p + fee - 90);
  assert.equal(buyer.balance, b - fee - 300);
  const copy = JSON.stringify(s);
  assert.throws(() => G.Companies.resolve(s, accepted.id, true), /vencido/);
  assert.equal(JSON.stringify(s), copy);
});
test("Ofertas vencidas, comprador sin fondos y piloto inscrito: sin traspasos silenciosos", () => {
  const { G } = engine(),
    s = G.createGame("Caducidad", "", 216),
    d = hire(G, s),
    buyer = s.companies[1],
    o = G.Companies.offer(s, d.id, buyer.id);
  s.day = o.expires + 1;
  G.Companies.daily(s);
  assert.equal(o.status, "expired");
  assert.throws(() => G.Companies.resolve(s, o.id, true), /vencido/);
  assert.equal(d.companyId, s.playerId);
  const fresh = G.Companies.offer(s, d.id, buyer.id);
  buyer.balance = 0;
  G.Companies.daily(s);
  assert.equal(fresh.status, "withdrawn");
  buyer.balance = 20000;
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  assert.throws(() => G.Companies.offer(s, d.id, buyer.id), /oferta/);
});
test("IA: perfiles con reservas diferentes evalúan activos sin dinero infinito", () => {
  const { G } = engine(),
    s = G.createGame("Perfiles", "", 217),
    c = s.companies[1],
    other = s.companies[2],
    car = G.ownedCars(s, c.id)[0];
  car.companyId = other.id;
  c.balance = 5000;
  const l = s.market[0];
  l.price = 3000;
  const current = s.cars.find((c) => c.id === l.carId);
  current.condition = 95;
  current.tires = 100;
  c.personality = "Conservadora";
  assert.ok(
    !G.AI.candidates(s, c).some(
      (a) => a.action === "compra" && a.targetId === current.id,
    ),
  );
  c.personality = "Agresiva";
  assert.ok(
    G.AI.candidates(s, c).some(
      (a) => a.action === "compra" && a.targetId === current.id,
    ),
  );
  c.balance = 1;
  assert.ok(G.AI.candidates(s, c).every((a) => a.cost <= 1));
});
test("IA real: cubrir un asiento, pagar sueldos y usar al piloto en la carrera siguiente", () => {
  const { G } = engine(),
    s = G.createGame("Fichaje rival", "", 218),
    c = s.companies[1],
    old = G.ownedDrivers(s, c.id)[0];
  old.companyId = null;
  old.contract = null;
  c.nextDecision = 0;
  G.Calendar.advance(s, 3);
  const hired = G.ownedDrivers(s, c.id)[0];
  assert.ok(hired);
  assert.ok(c.decisions.some((d) => d.action === "fichaje"));
  assert.ok(c.ledger.some((t) => t.label.includes("Fichaje")));
  G.Calendar.advance(s, G.nextEvent(s).day - s.day);
  const e = G.nextEvent(s);
  G.Race.start(s, e.id, true);
  assert.ok(
    s.race.entrants.some(
      (a) => a.companyId === c.id && a.driverId === hired.id,
    ),
  );
  while (!s.race.finished) G.Race.tick(s, 500);
  G.Race.finish(s);
  G.Calendar.advance(s, 15);
  assert.ok(c.ledger.some((t) => t.category === "Salarios"));
});
test("IA: ingreso por trabajo exige tres días y el taller no repara mientras hay encargo", () => {
  const { G } = engine(),
    s = G.createGame("Trabajo", "", 219),
    c = s.companies[1];
  c.balance = 1500;
  c.nextDecision = 0;
  G.Calendar.advance(s, 1);
  assert.ok(c.job);
  const before = c.balance;
  assert.throws(
    () => G.Economy.repair(s, G.ownedCars(s, c.id)[0].id, c.id),
    /ocupado/,
  );
  G.Calendar.advance(s, 2);
  assert.equal(c.balance, before - 36);
  G.Calendar.advance(s, 1);
  assert.equal(c.balance, before - 54 + 360);
  assert.ok(
    c.ledger.some((t) => t.category === "Servicios" && t.amount === 360),
  );
});
test("IA de formación: el entrenamiento se asigna, cuesta dinero y mejora un atributo observable", () => {
  const { G } = engine(),
    s = G.createGame("Academia rival", "", 220),
    c = s.companies[4],
    d = G.ownedDrivers(s, c.id)[0];
  c.personality = "Formadora";
  c.balance = 20000;
  c.nextDecision = 0;
  d.age = 20;
  for (const k of G.Drivers.stats) d.stats[k] = 60;
  d.stats.pace = 55;
  for (const free of s.drivers.filter((d) => !d.companyId))
    for (const k of G.Drivers.stats) free.stats[k] = 40;
  G.Calendar.advance(s, 1);
  assert.equal(d.training, "pace");
  const old = d.stats.pace;
  G.Calendar.advance(s, 1);
  assert.ok(d.stats.pace > old);
  assert.ok(c.ledger.some((t) => t.category === "Formación"));
});
test("Bancarrota rival: libera pilotos, liquida activos y nunca vuelve a la parrilla", () => {
  const { G } = engine(),
    s = G.createGame("Liquidación", "", 221),
    c = s.companies[1],
    d = G.ownedDrivers(s, c.id)[0],
    car = G.ownedCars(s, c.id)[0];
  c.balance = -90000;
  c.debtDays = 13;
  G.Economy.assess(s);
  assert.equal(c.status, "bankrupt");
  assert.equal(G.Companies.monthly(s, c.id), 0);
  assert.equal(d.companyId, null);
  const l = G.Market.listed(s, car.id);
  assert.ok(l);
  const before = c.balance;
  G.Market.buy(s, l.id);
  assert.equal(c.balance, before + l.price);
  assert.equal(c.status, "bankrupt");
  s.day = 13;
  G.Race.start(s, G.nextEvent(s).id, true);
  assert.ok(!s.race.entrants.some((a) => a.companyId === c.id));
  G.Storage.validate(s);
});
test("Noticias comerciales enlazan exactamente al coche adquirido por la IA", () => {
  const { G } = engine(),
    s = G.createGame("Verificable", "", 222),
    c = s.companies[1],
    l = s.market[0];
  G.Market.buy(s, l.id, c.id);
  const n = s.news.find((n) => n.entityId === l.carId && n.target === "car");
  assert.ok(n);
  assert.equal(s.cars.find((c) => c.id === n.entityId).companyId, c.id);
  assert.ok(
    c.ledger.some((t) => t.label.includes(l.carId) && t.amount === -l.price),
  );
});
test("Migración auténtica 0.1: conserva la carrera en curso y reproduce exactamente su resultado", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v1-race.json"),
      "utf8",
    ),
    old = JSON.parse(JSON.parse(raw).data),
    { state: s } = G.Storage.unpack(raw);
  assert.equal(s.version, 3);
  assert.equal(s.seed, old.seed);
  assert.equal(s.rng, old.rng);
  assert.deepEqual(json(s.race), old.race);
  assert.deepEqual(
    s.companies.map((c) => c.balance),
    old.companies.map((c) => c.balance),
  );
  for (const car of old.cars)
    for (const key of Object.keys(car))
      assert.deepEqual(
        json(s.cars.find((c) => c.id === car.id)[key]),
        car[key],
      );
  while (!s.race.finished) G.Race.tick(s, 400);
  const rows = G.Race.finish(s),
    expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v1-results.json"), "utf8"),
    );
  assert.deepEqual(json(rows), expected);
  const loaded = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.deepEqual(json(loaded), json(s));
});
test("Mundo y RNG empresarial persisten: cargar varias veces no repone stock ni duplica anuncios", () => {
  const { G } = engine(),
    s = G.createGame("Persistencia", "", 223);
  G.Market.buy(s, s.market[0].id);
  G.Calendar.advance(s, 8);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  const twice = G.Storage.unpack(G.Storage.pack(copy)).state;
  assert.deepEqual(json(twice), json(s));
  G.Calendar.advance(s, 3);
  G.Calendar.advance(copy, 3);
  assert.deepEqual(json(copy), json(s));
  assert.equal(new Set(s.market.map((l) => l.carId)).size, s.market.length);
});
test("Validación rechaza anuncios duplicados, propietarios falsos y ofertas corruptas sin cargar", () => {
  const { G } = engine(),
    s = G.createGame("Integridad", "", 224),
    dup = G.clone(s);
  dup.market.push({ ...dup.market[0], id: "listing-99999" });
  assert.throws(() => G.Storage.pack(dup), /mercado/);
  const bad = G.clone(s);
  bad.market[0].sellerId = "player";
  assert.throws(() => G.Storage.pack(bad), /mercado/);
  const orphan = G.clone(s);
  orphan.market.shift();
  assert.throws(() => G.Storage.pack(orphan), /propietario/);
});

test("Estabilidad: la IA no vuelve a traspasar un fichaje durante 60 días", () => {
  const { G } = engine(),
    s = G.createGame("Permanencia", "", 225),
    seller = s.companies[1],
    buyer = s.companies[2],
    d = G.ownedDrivers(s, seller.id)[0];
  d.transferListed = true;
  buyer.balance = 40000;
  G.Companies.sign(s, d.id, buyer.id, G.Companies.salary(d), 12, 300);
  d.transferListed = true;
  assert.equal(G.Companies.willing(s, d), false);
  assert.equal(d.lastTransfer, 0);
  for (const c of s.companies.filter(
    (c) => c.id !== buyer.id && c.id !== s.playerId,
  ))
    assert.ok(
      !G.AI.candidates(s, c).some(
        (a) => a.action === "fichaje" && a.targetId === d.id,
      ),
    );
  s.day = 60;
  assert.equal(G.Companies.willing(s, d), true);
});
