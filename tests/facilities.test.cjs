const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 960) {
  const { G } = engine();
  return { G, s: G.createGame("Aster Desarrollo", "", seed) };
}
function upgrade(G, s, key, id = s.playerId) {
  const j = G.Facilities.start(s, key, id);
  s.day = j.end;
  G.Facilities.complete(s);
  return j;
}
function level(G, s, n, id = s.playerId) {
  const c = s.companies.find((c) => c.id === id);
  c.level = n;
  G.Facilities.site(s, id).highestLevel = n;
}
function finish(G, s) {
  while (!s.race.finished) G.Race.tick(s, 400);
  return G.Race.finish(s);
}
let season;
function completedSeason() {
  const { G, s } = game(975);
  if (season) return { G, s: json(season) };
  G.player(s).balance = 100000;
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 24);
  for (const e of s.season.events) {
    const car = G.ownedCars(s)[0];
    if (!G.Workshop.ready(car)) {
      G.Economy.repair(s, car.id);
      G.Calendar.advance(s, 2);
    }
    if (car.tires < 50) G.Economy.tires(s, car.id);
    G.Race.register(s, e.id, d.id, car.id);
    G.Calendar.advance(s, e.day - s.day);
    G.Race.start(s, e.id);
    finish(G, s);
  }
  season = json(s);
  return { G, s };
}
test("Instalaciones: inicio no altera dinero, RNG ni capacidades; guardado idempotente", () => {
  const { G, s } = game();
  const before = json(s);
  G.Facilities.initialize(s);
  assert.deepEqual(json(s), before);
  assert.equal(G.Facilities.upkeep(s), 0);
  assert.equal(G.Facilities.bays(s), 1);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
});
test("Obra: pago a constructora, capacidad diferida, entrega única y rechazo de obra simultánea", () => {
  const { G, s } = game(),
    p = G.player(s),
    F = G.Facilities;
  const cash = p.balance,
    j = F.start(s, "garage");
  assert.equal(p.balance, cash - 3200);
  assert.equal(s.expansion.builder.balance, 3200);
  assert.equal(p.carCapacity, 2);
  assert.equal(F.site(s).buildings.garage, 1);
  const before = json(s);
  assert.throws(() => F.start(s, "warehouse"), /otra obra/);
  assert.deepEqual(json(s), before);
  s.day = j.end - 1;
  F.complete(s);
  assert.equal(p.carCapacity, 2);
  s.day++;
  F.complete(s);
  assert.equal(p.carCapacity, 4);
  assert.equal(F.site(s).project, null);
  const delivered = json(s);
  F.complete(s);
  assert.deepEqual(json(s), delivered);
  assert.equal(p.balance, cash - 3200);
  G.Storage.validate(s);
});
test("Fondos, nivel, carrera, instalación y compañía inválidos no producen pagos parciales", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s);
  p.balance = 100;
  let before = json(s);
  assert.throws(() => F.start(s, "garage"), /Fondos/);
  assert.deepEqual(json(s), before);
  p.balance = 100000;
  upgrade(G, s, "garage");
  before = json(s);
  assert.throws(() => F.start(s, "garage"), /nivel empresarial 3/);
  assert.deepEqual(json(s), before);
  assert.throws(() => F.start(s, "unknown"), /desconocida/);
  assert.deepEqual(json(s), before);
  s.race = {};
  before = json(s);
  assert.throws(() => F.start(s, "office"), /carrera/);
  assert.deepEqual(json(s), before);
  s.race = null;
  p.status = "bankrupt";
  assert.throws(() => F.start(s, "office"), /terminado/);
});
test("Cancelación: movilización y avance no recuperables, devolución real sin duplicación", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s),
    cash = p.balance;
  F.start(s, "garage");
  s.day = 7;
  assert.equal(F.refund(s), 800);
  const refund = F.cancel(s);
  assert.equal(refund, 800);
  assert.equal(p.balance, cash - 2400);
  assert.equal(s.expansion.builder.balance, 2400);
  assert.equal(p.carCapacity, 2);
  assert.equal(F.site(s).project, null);
  const before = json(s);
  assert.throws(() => F.cancel(s), /cancelar/);
  assert.deepEqual(json(s), before);
  G.Storage.validate(s);
});
test("Calendario: conservación empieza en la entrega y la previsión coincide con el cargo diario", () => {
  const { G, s } = game(),
    p = G.player(s),
    F = G.Facilities;
  F.start(s, "warehouse");
  const cash = p.balance;
  G.Calendar.advance(s, 6);
  assert.equal(p.balance, cash - 108);
  assert.equal(p.sparesCapacity, 8);
  G.Calendar.advance(s);
  assert.equal(p.balance, cash - 126.5);
  assert.equal(p.sparesCapacity, 16);
  assert.equal(G.Companies.monthly(s, p.id), 555);
  assert.equal(
    p.ledger.filter((t) => t.label === "Conservación de instalaciones").length,
    1,
  );
  G.Storage.validate(s);
});
test("Garaje ampliado: permite comprar una tercera unidad real que antes excedía la capacidad", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  G.Market.buy(s, s.market[0].id);
  assert.equal(G.ownedCars(s).length, 2);
  const listing = s.market[0],
    unit = s.cars.find((c) => c.id === listing.carId);
  assert.throws(() => G.Market.buy(s, listing.id), /plazas/);
  upgrade(G, s, "garage");
  G.Market.buy(s, listing.id);
  assert.equal(G.ownedCars(s).length, 3);
  assert.equal(unit.companyId, s.playerId);
  assert.ok(!s.market.some((l) => l.id === listing.id));
  G.Storage.validate(s);
});
test("Oficina ampliada: abre una tercera plaza de pilotos sin crear ni regalar candidatos", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const free = s.drivers.filter((d) => !d.companyId),
    size = s.drivers.length;
  for (const d of free.slice(0, 2)) G.Drivers.offer(s, d.id, d.ask, 12);
  assert.throws(
    () => G.Drivers.offer(s, free[2].id, free[2].ask, 12),
    /plantilla/,
  );
  upgrade(G, s, "office");
  G.Drivers.offer(s, free[2].id, free[2].ask, 12);
  assert.equal(G.ownedDrivers(s).length, 3);
  assert.equal(s.drivers.length, size);
  G.Storage.validate(s);
});
test("Almacén: compras e inventario respetan la capacidad construida", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  for (let i = 0; i < 8; i++)
    G.Workshop.buy(s, s.parts.find((p) => p.companyId === null).id);
  const part = s.parts.find((p) => p.companyId === null);
  assert.throws(() => G.Workshop.buy(s, part.id), /lleno/);
  upgrade(G, s, "warehouse");
  G.Workshop.buy(s, part.id);
  assert.equal(G.Workshop.inventory(s).length, 9);
  G.Storage.validate(s);
});
test("Taller ampliado: dos bahías comparten encargos y reparaciones, sin trabajar dos veces el mismo coche", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  G.Market.buy(s, s.market[0].id);
  level(G, s, 3);
  upgrade(G, s, "workshop");
  upgrade(G, s, "workshop");
  assert.equal(G.Facilities.bays(s), 2);
  const [a, b] = G.ownedCars(s);
  G.Economy.job(s);
  G.Economy.repair(s, a.id);
  assert.equal(G.Facilities.workload(s), 2);
  assert.throws(() => G.Economy.repair(s, b.id), /ocupado/);
  assert.throws(() => G.Economy.repair(s, a.id), /ocupado/);
  s.day = s.job.end;
  G.Economy.daily(s);
  G.Economy.repair(s, b.id);
  G.Storage.validate(s);
});
test("Mejoras de taller: acortan nuevas instalaciones y conservan el plazo de trabajos ya contratados", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  level(G, s, 5);
  upgrade(G, s, "workshop");
  upgrade(G, s, "workshop");
  const j = G.Facilities.start(s, "workshop");
  s.day = j.end - 1;
  const car = G.ownedCars(s)[0],
    part = s.parts.find((p) => p.definitionId === "light-body" && !p.companyId);
  G.Workshop.buy(s, part.id);
  const work = G.Workshop.install(s, car.id, part.id);
  const deadline = work.end;
  s.day++;
  G.Facilities.complete(s);
  assert.equal(work.end, deadline);
  s.day = deadline;
  G.Workshop.complete(s, car);
  const other = s.parts.find(
    (p) => p.definitionId === "brakes-club" && !p.companyId,
  );
  G.Workshop.buy(s, other.id);
  const newer = G.Workshop.install(s, car.id, other.id);
  assert.equal(newer.end - newer.start, 1);
  G.Storage.validate(s);
});
test("Progresión: ascenso por objetivos completos, sin regalo de dinero o capacidad, con revisión única diaria", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s);
  p.balance = 30000;
  upgrade(G, s, "garage");
  upgrade(G, s, "warehouse");
  s.day = 120;
  p.stats.starts = 3;
  p.stats.podiums = 1;
  p.reputation = 3.9;
  F.daily(s);
  assert.equal(p.level, 1);
  s.day++;
  p.reputation = 4;
  const cash = p.balance,
    cap = p.carCapacity;
  F.daily(s);
  assert.equal(p.level, 2);
  assert.equal(p.balance, cash);
  assert.equal(p.carCapacity, cap);
  const before = json(s);
  F.daily(s);
  assert.deepEqual(json(s), before);
  assert.equal(F.objectives(s).find((o) => o.key === "days").met, false);
  G.Storage.validate(s);
});
test("Progresión: diez niveles exigen trayectoria y los niveles altos desbloquean obras mayores", () => {
  const { G, s } = game(),
    F = G.Facilities;
  assert.equal(F.ranks.length, 10);
  assert.equal(F.ranks[9].days, 7300);
  G.player(s).balance = 100000;
  upgrade(G, s, "garage");
  assert.match(F.quote(s, "garage").reason, /nivel empresarial 3/);
  level(G, s, 3);
  assert.ok(F.quote(s, "garage").accepted);
  upgrade(G, s, "garage");
  assert.match(F.quote(s, "garage").reason, /nivel empresarial 5/);
});
test("Crisis: noventa jornadas consecutivas bajan un nivel sin desalojar vehículos o perder edificios", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s);
  upgrade(G, s, "garage");
  level(G, s, 3);
  p.balance = 100;
  p.reputation = 0;
  const start = s.day,
    cap = p.carCapacity;
  for (let i = 1; i <= 89; i++) {
    s.day = start + i;
    F.daily(s);
  }
  assert.equal(p.level, 3);
  assert.equal(F.site(s).crisisDays, 89);
  s.day++;
  F.daily(s);
  assert.equal(p.level, 2);
  assert.equal(F.site(s).highestLevel, 3);
  assert.equal(p.carCapacity, cap);
  assert.equal(F.site(s).buildings.garage, 2);
  G.Storage.validate(s);
});
test("Crisis: recuperar la liquidez reinicia el contador; la reputación baja por sí sola no provoca descenso", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s);
  level(G, s, 2);
  p.balance = 100;
  p.reputation = 0;
  for (let i = 1; i <= 60; i++) {
    s.day = i;
    F.daily(s);
  }
  p.balance = 30000;
  s.day++;
  F.daily(s);
  assert.equal(F.site(s).crisisDays, 0);
  for (let i = 1; i <= 40; i++) {
    s.day++;
    F.daily(s);
  }
  assert.equal(p.level, 2);
});
test("Patrimonio: pedir crédito no satisface por sí solo los objetivos de riqueza", () => {
  const { G, s } = game(),
    F = G.Facilities;
  const equity = F.equity(s, s.playerId);
  G.Contracts.borrow(s, 1000, 3);
  assert.equal(F.equity(s, s.playerId), equity);
});
test("Ascenso: los activos no sustituyen la reserva de caja para afrontar el siguiente mes", () => {
  const { G, s } = game(),
    F = G.Facilities,
    p = G.player(s);
  p.balance = 100000;
  upgrade(G, s, "garage");
  upgrade(G, s, "warehouse");
  G.Market.buy(s, s.market[0].id);
  G.Market.buy(s, s.market[0].id);
  s.day = 120;
  p.stats.starts = 3;
  p.stats.podiums = 1;
  p.reputation = 4;
  p.balance = 100;
  assert.ok(F.objectives(s).find((o) => o.key === "equity").met);
  F.daily(s);
  assert.equal(p.level, 1);
  assert.equal(F.objectives(s).find((o) => o.key === "liquidity").met, false);
  s.day++;
  p.balance = 2000;
  F.daily(s);
  assert.equal(p.level, 2);
  G.Storage.validate(s);
});
test("Rivales: construcción real con la misma cotización y reserva; sin inversión con escasez de liquidez", () => {
  const { G, s } = game(),
    F = G.Facilities,
    c = s.companies[1];
  s.day = 60;
  c.balance = 30000;
  const initial = c.balance;
  const choices = F.aiCandidates(s, c, G.AI.budget(s, c));
  assert.ok(choices.length);
  const best = choices.sort((a, b) => b.utility - a.utility)[0];
  best.run();
  assert.equal(c.balance, initial - best.cost);
  assert.equal(s.expansion.builder.balance, best.cost);
  assert.ok(F.site(s, c.id).project);
  assert.equal(F.aiCandidates(s, c, 30000).length, 0);
  s.day = F.site(s, c.id).project.end;
  F.complete(s);
  assert.equal(F.site(s, c.id).project, null);
  c.balance = 100;
  assert.equal(F.aiCandidates(s, c, 30000).length, 0);
  G.Storage.validate(s);
});
test("Bancarrota: liquida la obra una sola vez y la sede no vuelve a recibir ampliaciones", () => {
  const { G, s } = game(),
    c = s.companies[1],
    F = G.Facilities;
  const j = F.start(s, "garage", c.id);
  s.day = 2;
  c.balance = -100;
  c.debtDays = 13;
  G.Economy.assess(s);
  assert.equal(c.status, "bankrupt");
  assert.equal(F.site(s, c.id).project, null);
  const cash = c.balance;
  s.day = j.end;
  F.complete(s);
  assert.equal(c.carCapacity, 2);
  assert.equal(c.balance, cash);
  assert.throws(() => F.start(s, "warehouse", c.id), /terminado/);
  G.Storage.validate(s);
});
test("Guardar a mitad de obra conserva factura, progreso y resultado al avanzar agrupado o día a día", () => {
  const { G, s } = game();
  G.Facilities.start(s, "warehouse");
  G.Calendar.advance(s, 3);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 4);
  for (let i = 0; i < 4; i++) G.Calendar.advance(copy);
  assert.deepEqual(json(copy), json(s));
  const reloaded = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Facilities.complete(reloaded);
  assert.deepEqual(json(reloaded), json(s));
});
test("Migración auténtica 0.5: conserva carrera, RNG, economía, activos y resultado final completo", () => {
  const { G } = engine();
  const raw = fs.readFileSync(
    path.join(__dirname, "fixtures/v5-race.json"),
    "utf8",
  );
  const old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.deepEqual(json(s.race), old.race);
  assert.deepEqual(json(s.companies), old.companies);
  assert.deepEqual(
    json(finish(G, s)),
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v5-results.json")),
    ),
  );
  const actual = json(s);
  delete actual.professional; // Bloque aditivo de la nueva versión.
  delete actual.expansion;
  delete actual.staffing;
  actual.employees = []; // Las plantillas anteriores no contenían personal.
  assert.deepEqual(
    actual,
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v5-finished.json")),
    ),
  );
  G.Storage.validate(s);
});
test("Archivo: conserva seis rondas, pilotos y equipos de una temporada real; consultar o abrir otra no paga dos veces", () => {
  const { G, s } = completedSeason(),
    F = G.Facilities;
  assert.equal(s.season.phase, "complete");
  assert.equal(s.expansion.archive.length, 1);
  const h = s.expansion.archive[0],
    before = json(h);
  assert.equal(h.events.length, 6);
  assert.ok(h.events.every((e) => e.results.length > 0));
  assert.ok(h.drivers.length > 1);
  assert.ok(h.drivers.some((d) => d.driverId === G.ownedDrivers(s)[0].id));
  const state = json(s);
  F.archiveSeason(s);
  assert.deepEqual(json(s), state);
  G.Calendar.nextSeason(s);
  assert.equal(s.season.year, 2027);
  assert.deepEqual(json(s.expansion.archive[0]), before);
  assert.equal(s.season.events[0].results.length, 0);
  G.Storage.validate(s);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), json(s));
});
test("Archivo: instantáneas independientes de nombres y estado actuales", () => {
  const { G, s } = completedSeason(),
    h = json(s.expansion.archive[0]);
  s.companies[0].name = "Nueva identidad";
  s.drivers[0].name = "Cambio de nombre";
  s.cars[0].km += 1000;
  assert.deepEqual(json(s.expansion.archive[0]), h);
  G.Storage.validate(s);
});
test("Migración de resúmenes: recupera la temporada completa aún presente y conserva resúmenes anteriores sin inventar rondas", () => {
  const { G, s } = completedSeason();
  delete s.expansion;
  delete s.staffing;
  delete s.professional;
  s.employees = []; // Simula una versión anterior al personal.
  s.history.push({
    year: 2025,
    champion: "Resumen heredado",
    playerPosition: 2,
    playerPoints: 30,
    bonus: 1000,
    logo: "",
    standings: [],
  });
  G.Facilities.initialize(s);
  assert.equal(s.expansion.archive.length, 1);
  assert.equal(s.expansion.archive[0].year, 2026);
  assert.equal(s.history.length, 2);
  G.Storage.validate(s);
});
test("Validación: rechaza capacidad sin obra, proyectos duplicados, plazos y niveles corruptos", () => {
  const { G, s } = game();
  const baseline = json(s);
  for (const change of [
    (s) => (s.expansion.sites.player.buildings.garage = 6),
    (s) => (G.player(s).carCapacity = 10),
    (s) => (s.expansion.sites.player.crisisDays = 100),
    (s) => (s.expansion.builder.balance = -1),
    (s) => delete s.expansion.sites.player,
  ]) {
    const bad = json(baseline);
    change(bad);
    assert.throws(() => G.Storage.validate(bad));
  }
  G.Facilities.start(s, "warehouse");
  let bad = json(s);
  bad.expansion.sites.player.project.id = s.parts[0].id;
  assert.throws(() => G.Storage.validate(bad), /Identificadores/);
  bad = json(s);
  bad.expansion.sites.player.project.end++;
  assert.throws(() => G.Storage.validate(bad), /Obra/);
});
test("Validación histórica: rechaza duplicados, pilotos inexistentes y puntos incoherentes", () => {
  const { G, s } = completedSeason();
  for (const change of [
    (s) => s.expansion.archive.push(json(s.expansion.archive[0])),
    (s) => s.expansion.archive[0].drivers[0].points++,
    (s) => s.expansion.archive[0].teams[0].points++,
    (s) =>
      (s.expansion.archive[0].events[0].results[0].driverId = "driver-999999"),
    (s) =>
      s.expansion.archive[0].events[0].results.push(
        json(s.expansion.archive[0].events[0].results[0]),
      ),
  ]) {
    const bad = json(s);
    change(bad);
    assert.throws(() => G.Storage.validate(bad));
  }
});
