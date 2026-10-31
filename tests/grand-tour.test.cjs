const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game() {
  const { G } = engine({ grand: true });
  return { G, s: G.createGame("Gran Serie", "", 1470) };
}
function national(G, s, key = "gt") {
  G.GrandTour.choose(s, key);
  return s.season.events.find((e) => e.cup === "national");
}
function factory(G, s, key = "formula", n = 0) {
  return s.cars.find(
    (c) =>
      c.companyId === s.grandTour.teams[n] && G.GrandContent.family(c) === key,
  );
}
function start(G, s, key) {
  const e = national(G, s, key);
  s.day = e.day;
  G.Race.skip(s, e.id);
  return e;
}
test("60 modelos, diez familias y 192 piezas cubren los 16 alojamientos sin regalar dinero al jugador", () => {
  const { G, s } = game();
  assert.equal(G.Data.models.length, 148);
  assert.equal(G.player(s).balance, 4200);
  assert.equal(G.GrandContent.models.length, 60);
  assert.equal(
    new Set(G.GrandContent.models.map((i) => G.Data.models[i].grandFamily))
      .size,
    10,
  );
  assert.equal(G.GrandContent.parts.length, 192);
  assert.equal(new Set(G.GrandContent.parts.map((p) => p.slot)).size, 16);
  assert.equal(s.market.filter((l) => l.kind === "new").length, 72);
  assert.ok(G.GrandContent.models.every((i) => G.Data.models[i].showroomOnly));
  G.Storage.validate(s);
});
test("El mundo nuevo es reproducible y los monoplazas son aspiraciones caras con configuraciones distintas", () => {
  const { G, s } = game();
  assert.deepEqual(json(s), json(G.createGame("Gran Serie", "", 1470)));
  const models = G.GrandContent.byFamily.formula.map((i) => G.Data.models[i]);
  assert.deepEqual(
    json(models.map((m) => m.hp)),
    [650, 730, 810, 890, 970, 1050],
  );
  assert.equal(models[0].value, 650000);
  assert.equal(models.at(-1).value, 6500000);
  assert.equal(new Set(models.map((m) => m.model)).size, 6);
  assert.ok(models.every((m) => m.weight < 850 && m.factory.braking > 1.5));
});
test("Comprar un Fórmula cobra su precio real y conserva la plataforma en guardado", () => {
  const { G, s } = game();
  const car = s.cars.find(
      (c) => !c.companyId && G.GrandContent.family(c) === "formula",
    ),
    l = s.market.find((l) => l.carId === car.id);
  assert.throws(() => G.Market.buy(s, l.id));
  assert.equal(car.companyId, null);
  G.player(s).balance = 800000;
  G.Market.buy(s, l.id);
  assert.equal(car.companyId, s.playerId);
  assert.equal(G.player(s).balance, 800000 - l.price);
  assert.equal(car.condition, 100);
  assert.equal(car.hp, 650);
  G.Storage.validate(s);
  G.Storage.validate(json(s));
});
test("Una pieza de Fórmula rechaza un coche convencional y no cambia el saldo", () => {
  const { G, s } = game();
  const car = G.ownedCars(s)[0],
    p = s.parts.find((p) => p.definitionId === "grand-formula-engine-0");
  assert.ok(p);
  const before = G.player(s).balance;
  assert.match(G.Workshop.fit(s, car, p), /plataforma|compatible/i);
  assert.equal(G.player(s).balance, before);
});
test("Las tres orientaciones de cada pieza cambian prestaciones, coste y desgaste", () => {
  const { G } = game();
  for (const slot of new Set(G.GrandContent.parts.map((p) => p.slot))) {
    const ds = G.GrandContent.parts.filter(
      (p) => p.slot === slot && p.group === "formula",
    );
    assert.equal(ds.length, 3);
    assert.equal(new Set(ds.map((d) => JSON.stringify(d.effects))).size, 3);
    assert.ok(ds.every((d) => d.price > 0 && d.days >= 1));
  }
});
test("Una modificación compatible de monoplaza exige compra y montaje, y afecta la física", () => {
  const { G, s } = game(),
    car = factory(G, s),
    c = s.companies.find((c) => c.id === car.companyId),
    p = s.parts.find(
      (p) => p.definitionId === "grand-formula-intake-0" && !p.companyId,
    );
  assert.equal(G.Workshop.fit(s, car, p), "");
  const cash = c.balance,
    before = G.Workshop.configuration(s, car),
    d = G.Parts.definition(p.definitionId);
  G.Workshop.buy(s, p.id, c.id);
  G.Workshop.install(s, car.id, p.id, c.id);
  assert.ok(car.repair);
  assert.equal(cash - c.balance, d.price + d.labor);
  assert.equal(car.hp, before.hp);
  for (let day = 0; day < 20 && car.repair; day++) {
    s.day++;
    G.Workshop.complete(s, car);
  }
  assert.equal(car.repair, null);
  assert.ok(car.hp > before.hp);
  assert.equal(p.carId, car.id);
  const config = G.Workshop.configuration(s, car),
    a = {
      ...config,
      components: G.clone(car.components),
      partWear: Object.fromEntries(
        Object.values(car.installed).map((id) => [id, 100]),
      ),
      performance: G.Performance.capture(s, car),
    };
  G.Performance.refresh(a);
  assert.equal(a.hp, config.hp);
  assert.ok(a.cooling > 2);
  G.Performance.refresh(a);
  assert.equal(a.cooling, config.cooling);
});
test("Las tasas y premios crecen de Regional a GT, Prototipos y Fórmula; las finales cuestan más", () => {
  const { G, s } = game(),
    regional = s.season.events.find((e) => e.cup === "pro");
  assert.equal(G.Competition.fee(regional), 3250);
  const fees = [],
    prizes = [];
  for (const key of ["gt", "prototype", "formula"]) {
    const e = national(G, s, key),
      r = G.Competition.rule(e);
    fees.push(G.Competition.fee(e));
    prizes.push(r.prizes[0]);
    assert.equal(
      G.Competition.fee(
        s.season.events.find((e) => e.cup === "national" && e.final),
      ),
      G.Competition.fee(e) * 1.5,
    );
  }
  assert.deepEqual(fees, [16000, 40000, 90000]);
  assert.deepEqual(prizes, [100000, 260000, 650000]);
  assert.ok(G.Competition.rule(regional).prizes[0] < prizes[0]);
});
test("La división nacional se fija al comenzar y no permite cambiar las reglas de una parrilla", () => {
  const { G, s } = game(),
    e = national(G, s, "formula");
  assert.equal(e.grandDivision, "formula");
  e.entry = { driverId: "pending", carId: "pending" };
  assert.match(G.GrandTour.divisionReason(s), /fijada/);
  assert.throws(() => G.GrandTour.choose(s, "gt"), /fijada/);
  assert.equal(e.grandDivision, "formula");
});
test("La verificación exige potencia, plataforma y piloto; explica lo que falta", () => {
  const { G, s } = game(),
    e = national(G, s, "formula"),
    car = factory(G, s),
    d = G.ownedDrivers(s, car.companyId).find((d) => d.grandSeat === "elite");
  assert.equal(G.Competition.technical(s, e, car, d), "");
  const novice = {
    ...d,
    stats: Object.fromEntries(Object.keys(d.stats).map((k) => [k, 50])),
  };
  assert.match(G.Competition.technical(s, e, car, novice), /valoración 75/);
  assert.match(
    G.Competition.technical(s, e, factory(G, s, "gt"), d),
    /plataforma/,
  );
  car.components.brakes = 90;
  assert.match(G.Competition.technical(s, e, car, d), /frenos.*95/);
});
test("Seis equipos de fábrica tienen pilotos de élite, contratos y cuatro clases de coche", () => {
  const { G, s } = game();
  assert.equal(s.grandTour.teams.length, 6);
  for (const id of s.grandTour.teams) {
    const c = s.companies.find((c) => c.id === id);
    assert.ok(c.balance > 3000000);
    assert.equal(G.ownedCars(s, id).length, 4);
    assert.equal(G.ownedDrivers(s, id).length, 2);
    assert.equal(s.employees.filter((e) => e.companyId === id).length, 4);
    for (const key of ["gt", "prototype", "formula"]) {
      const e = national(G, s, key),
        a = G.Competition.lineup(s, id, e);
      assert.equal(G.GrandContent.family(a.car), key);
      assert.ok(a.driver.contract.salary > 200);
      assert.equal(G.Competition.technical(s, e, a.car, a.driver), "");
    }
  }
});
test("La preparación rival conserva el límite de su categoría y protege sus cuatro coches", () => {
  const { G, s } = game(),
    id = s.grandTour.teams[0],
    c = s.companies.find((c) => c.id === id);
  const candidates = G.Workshop.aiCandidates(s, c, 100000, 20, { car: 2 });
  assert.ok(candidates.length);
  for (const q of candidates.filter((q) => q.action === "repuesto")) {
    const car = s.cars.find((c) => c.id === q.targetId);
    assert.ok(car);
    q.run();
    const next = G.Workshop.aiCandidates(s, c, 100000, 20, { car: 2 });
    for (const row of next.filter((q) => q.action === "instalación")) {
      const car = s.cars.find((c) => c.id === row.targetId);
      row.run();
      assert.ok(car.repair);
      break;
    }
    break;
  }
  assert.ok(
    !G.AI.candidates(s, c).some(
      (q) =>
        q.action === "venta" &&
        G.ownedCars(s, id).some((car) => car.id === q.targetId),
    ),
  );
});
test("La reposición semanal devuelve coches nuevos sin duplicar ni quitar el que compraste", () => {
  const { G, s } = game();
  G.player(s).balance = 1000000;
  const car = s.cars.find(
      (c) => !c.companyId && G.GrandContent.family(c) === "formula",
    ),
    l = s.market.find((l) => l.carId === car.id);
  G.Market.buy(s, l.id);
  G.Commerce.showroom(s);
  assert.equal(car.companyId, s.playerId);
  assert.equal(s.market.filter((l) => l.kind === "new").length, 72);
  const raw = JSON.stringify(s);
  G.Commerce.showroom(s);
  assert.equal(JSON.stringify(s), raw);
  G.Storage.validate(s);
});
test("La refrigeración y frenada de fábrica se aplican una vez y se conservan en telemetría", () => {
  const { G, s } = game(),
    car = factory(G, s),
    config = G.Workshop.configuration(s, car),
    a = {
      ...config,
      components: G.clone(car.components),
      partWear: Object.fromEntries(
        Object.values(car.installed).map((id) => [id, 100]),
      ),
      performance: G.Performance.capture(s, car),
    };
  G.Performance.refresh(a);
  assert.ok(a.acceleration > 1);
  assert.equal(a.cooling, config.cooling);
  assert.equal(a.performance.factory.braking, 1.85);
  const initial = json(a);
  G.Performance.refresh(a);
  assert.deepEqual(json(a), initial);
  assert.ok(G.Performance.brakeFactor(a) > 1);
});
test("Un guardado manipulado no puede quitar la versión ni inventar una categoría", () => {
  const { G, s } = game();
  let copy = json(s);
  delete copy.grandTour;
  assert.throws(() => G.Storage.validate(copy), /Gran Serie/);
  copy = json(s);
  copy.grandTour.division = "invalid";
  assert.throws(() => G.Storage.validate(copy), /Gran Serie/);
  copy = json(s);
  copy.season.events.find((e) => e.cup === "national").grandDivision =
    "invalid";
  assert.throws(() => G.Storage.validate(copy), /Categoría/);
});
for (const key of ["gt", "prototype", "formula"])
  test(`Una carrera completa de ${key} tiene seis rivales legales, pit stops y premios reales`, () => {
    const { G, s } = game(),
      e = national(G, s, key);
    s.day = e.day;
    G.Auctions.daily(s);
    G.Commerce.refresh(s);
    const cash = new Map(
      s.grandTour.teams.map((id) => [
        id,
        s.companies.find((c) => c.id === id).balance,
      ]),
    );
    G.Race.start(s, e.id, true);
    const r = s.race;
    assert.equal(r.grandVersion, 1);
    assert.equal(r.entrants.length, 6);
    assert.ok(r.entrants.every((a) => G.GrandContent.family(a) === key));
    for (let n = 0; n < 1000 && !r.finished; n++) G.Race.tick(s, 100);
    assert.equal(r.finished, true);
    G.Race.finish(s);
    assert.equal(e.results.length, 6);
    assert.ok(e.results.some((row) => !row.dnf));
    const winner = e.results.find((row) => !row.dnf);
    assert.equal(
      winner.prize,
      G.Competition.rule(e).prizes[winner.position - 1],
    );
    const c = s.companies.find((c) => c.id === winner.companyId);
    assert.ok(
      c.balance <=
        cash.get(winner.companyId) - G.Competition.fee(e) + winner.prize,
    );
    assert.ok(
      c.ledger.some((row) =>
        JSON.stringify(row).includes(String(winner.prize)),
      ),
    );
    G.Storage.validate(s);
  });
test("Una carrera auténtica de 0.16 continúa con los mismos resultados y el mismo estado completo", () => {
  const { G } = engine({ grand: true }),
    s = JSON.parse(fs.readFileSync("tests/fixtures/v160-race.json")),
    expected = JSON.parse(fs.readFileSync("tests/fixtures/v160-expected.json"));
  G.Storage.validate(s);
  for (let n = 0; n < 1000 && !s.race.finished; n++) G.Race.tick(s, 100);
  G.Race.finish(s);
  G.Storage.validate(s);
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(s)).digest("hex"),
    expected.sha256,
  );
});
test("Actualizar una partida 0.16 conserva coche, dinero, piloto y RNG del jugador", () => {
  const { G, s } = game();
  const old = G.createV160Game("Anterior", "", 1470),
    cash = G.player(old).balance,
    car = json(G.ownedCars(old)[0]),
    rng = old.rng;
  G.GrandTour.initialize(old);
  assert.equal(G.player(old).balance, cash);
  assert.deepEqual(json(G.ownedCars(old)[0]), car);
  assert.equal(old.rng, rng);
  assert.equal(old.grandTour.division, "gt");
  G.Storage.validate(old);
});

test("Los coches de Gran Serie nacen en el concesionario y las subastas crean preparaciones compatibles", () => {
  const { G, s } = game();
  assert.ok(
    s.cars
      .filter(
        (c) => G.GrandContent.models.includes(c.modelIndex) && !c.companyId,
      )
      .every(
        (c) =>
          c.factoryDelivery &&
          s.market.some((l) => l.carId === c.id && l.kind === "new"),
      ),
  );
  for (let n = 1; n < 30; n++) {
    s.day = n * 7;
    G.Auctions.daily(s);
    G.Commerce.refresh(s);
    G.Auctions.validate(s);
  }
  assert.equal(G.player(s).balance, 4200);
});
test("Actualizar un coche modificado de 0.16 conserva exactamente su preparación", () => {
  const { G } = game(),
    s = G.createV160Game("Preparación anterior", "", 1470);
  G.player(s).balance = 100000;
  const car = G.ownedCars(s)[0],
    p = G.Workshop.stock(s, "shell-touring")[0];
  G.Workshop.buy(s, p.id);
  G.Workshop.install(s, car.id, p.id);
  s.day = car.repair.end;
  G.Workshop.complete(s, car);
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  G.Storage.validate(s);
  const before = json(car);
  G.GrandTour.initialize(s);
  assert.deepEqual(json(car), before);
  G.Storage.validate(s);
});
test("La plataforma de fábrica del guardado de carrera no puede falsificarse", () => {
  const { G, s } = game(),
    e = national(G, s, "formula");
  s.day = e.day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  G.Race.start(s, e.id, true);
  G.Storage.validate(s);
  const copy = json(s);
  copy.race.entrants[0].performance.factory.acceleration = 100;
  assert.throws(() => G.Storage.validate(copy), /Plataforma de fábrica/);
});
