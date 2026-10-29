const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(isolated = true) {
  const { G } = engine({ workbench: true }),
    s = G.createGame("Taller visual", "", 1700),
    car = G.ownedCars(s)[0];
  if (isolated) {
    G.player(s).balance = 200000;
    for (const e of s.season.events) e.day += 365;
  }
  return { G, s, car };
}
function stock(G, s, id) {
  return G.Workshop.stock(s, id)[0];
}
function finish(G, s, car) {
  G.Calendar.advance(s, car.repair.end - s.day);
  assert.equal(car.repair, null);
  G.Storage.validate(s);
}
function fit(G, s, car, id) {
  const p = stock(G, s, id);
  G.Coachwork.install(s, car.id, p.id);
  finish(G, s, car);
  return p;
}
function unchanged(s, fn, reason) {
  const old = JSON.stringify(s);
  assert.throws(fn, reason);
  assert.equal(JSON.stringify(s), old);
}
const read = (name) =>
  fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

test("Taller nuevo: presupuesto difícil, 29 referencias físicas y activación idempotente sin alterar RNG ni caja", () => {
  const { G, s } = game(false);
  assert.equal(G.player(s).balance, 4200);
  assert.equal(G.Parts.catalogue.length, 29);
  assert.equal(Object.keys(G.Parts.slots).length, 16);
  assert.equal(s.parts.length, 101);
  G.Storage.validate(s);
  const before = JSON.stringify(s);
  G.Coachwork.initialize(s);
  assert.equal(JSON.stringify(s), before);
  const old = G.createV80Game("Empresa anterior", "", 1700),
    rng = old.rng,
    cash = G.player(old).balance,
    base = json(old.cars);
  G.Coachwork.initialize(old);
  assert.equal(old.rng, rng);
  assert.equal(G.player(old).balance, cash);
  assert.deepEqual(json(old.cars), base);
  G.Storage.validate(old);
});
test("Comparar una carrocería es lectura: muestra aspecto, peso y requisitos sin gastar, reservar ni avanzar", () => {
  const { G, s, car } = game(),
    p = stock(G, s, "shell-wide"),
    before = JSON.stringify(s),
    q = G.Coachwork.inspect(s, car, p),
    v = G.Coachwork.visual(s, car, q.installed);
  assert.equal(v.coachwork.style, "wide");
  assert.equal(v.id, car.id);
  assert.equal(v.modelIndex, car.modelIndex);
  assert.equal(q.after.weight, q.before.weight + 8);
  assert.match(q.reason, /chasis/);
  assert.equal(JSON.stringify(s), before);
});
test("Comprar y montar tiene un pago revisable, plazo real y aspecto original hasta la entrega; guardar no vuelve a cobrar", () => {
  const { G, s, car } = game(false),
    p = stock(G, s, "shell-touring"),
    q = G.Coachwork.quote(s, car.id, p.id),
    cash = G.player(s).balance;
  const j = G.Coachwork.install(s, car.id, p.id);
  assert.equal(q.total, 1240);
  assert.equal(G.player(s).balance, cash - q.total);
  assert.equal(j.end, q.end);
  assert.equal(car.coachwork, undefined);
  assert.equal(p.reservedFor, j.id);
  assert.equal(p.carId, null);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state,
    c = G.ownedCars(copy)[0];
  assert.equal(G.player(copy).balance, cash - q.total);
  G.Calendar.advance(copy, 1);
  assert.equal(c.coachwork, undefined);
  finish(G, copy, c);
  assert.equal(c.coachwork.style, "touring");
  assert.equal(c.modelIndex, car.modelIndex);
  assert.equal(c.components.tires, car.components.tires);
  assert.equal(c.components.engine, car.components.engine);
  const before = JSON.stringify(copy);
  G.Workshop.complete(copy, c);
  assert.equal(JSON.stringify(copy), before);
});
test("Sustituir y desmontar recupera la misma unidad con desgaste y restaura la configuración original", () => {
  const { G, s, car } = game(),
    old = fit(G, s, car, "shell-touring");
  old.condition = 63;
  G.Workshop.recalculate(s, car);
  fit(G, s, car, "shell-touring");
  assert.equal(old.carId, null);
  assert.equal(old.condition, 63);
  assert.equal(
    G.Workshop.inventory(s).filter((p) => p.id === old.id).length,
    1,
  );
  const current = s.parts.find((p) => p.id === car.installed.shell),
    q = G.Coachwork.removeQuote(s, car.id, "shell");
  G.Workshop.remove(s, car.id, "shell");
  assert.equal(car.repair.end, q.end);
  finish(G, s, car);
  assert.equal(current.carId, null);
  assert.equal(car.coachwork, undefined);
  assert.equal(car.weight, car.base.weight);
  assert.equal(s.parts.length, 101);
});
test("La carrocería y el refuerzo son requisitos reales; no permite quitar soportes ni reducirlos con un kit activo", () => {
  const { G, s, car } = game();
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "shell-wide").id),
    /chasis/,
  );
  fit(G, s, car, "chassis-street");
  fit(G, s, car, "shell-wide");
  assert.equal(car.coachwork.widthExtra, 0.08);
  unchanged(s, () => G.Workshop.remove(s, car.id, "chassis"), /chasis/);
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "shell-race").id),
    /nivel 2/,
  );
  fit(G, s, car, "chassis-sport");
  fit(G, s, car, "shell-race");
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "chassis-street").id),
    /nivel 2/,
  );
});
test("Llantas, pinzas y pasos de rueda se comprueban juntos, también al desmontar o volver a una carrocería pequeña", () => {
  const { G, s, car } = game();
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "wheels-sport").id),
    /no caben/,
  );
  fit(G, s, car, "shell-touring");
  fit(G, s, car, "wheels-sport");
  unchanged(s, () => G.Workshop.remove(s, car.id, "shell"), /no caben/);
  fit(G, s, car, "chassis-street");
  fit(G, s, car, "brakes-four");
  assert.equal(car.brakes, car.base.brakes + 20);
  unchanged(s, () => G.Workshop.remove(s, car.id, "wheels"), /llantas/);
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "brakes-six").id),
    /nivel 2/,
  );
});
test("Preparación de motor exige refrigeración, embrague, frenos y chasis; el montaje no repara ni renueva gomas", () => {
  const { G, s, car } = game();
  fit(G, s, car, "chassis-sport");
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "engine-race").id),
    /refrigeración/,
  );
  fit(G, s, car, "cooling-pro");
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "engine-race").id),
    /embrague/,
  );
  fit(G, s, car, "clutch-sport");
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "engine-race").id),
    /frenos/,
  );
  fit(G, s, car, "brakes-club");
  const components = json(car.components);
  fit(G, s, car, "engine-race");
  assert.equal(car.hp, car.base.hp + 120);
  assert.deepEqual(json(car.components), components);
  for (const slot of ["cooling", "clutch", "brakes", "chassis"])
    unchanged(s, () => G.Workshop.remove(s, car.id, slot), /necesita/);
  G.Storage.validate(s);
});
test("El daño estructural impide montar paneles; el desgaste posterior conserva la compatibilidad y reduce eficacia", () => {
  const { G, s, car } = game();
  car.components.body = 60;
  G.Workshop.recalculate(s, car);
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "shell-touring").id),
    /65/,
  );
  car.components.body = 82;
  G.Workshop.recalculate(s, car);
  const p = fit(G, s, car, "engine-club");
  p.condition = 40;
  car.components.body = 30;
  G.Workshop.recalculate(s, car);
  assert.equal(car.hp, car.base.hp + 10);
  G.Storage.validate(s);
});
test("Fallo de fondos, propiedad, reserva, stock, bahía, inscripción o almacén: ninguna compra parcial", () => {
  for (const mode of [
    "funds",
    "foreign",
    "reserved",
    "sold",
    "busy",
    "registered",
    "capacity",
    "missingcar",
  ]) {
    const { G, s, car } = game(),
      p = stock(G, s, "shell-touring");
    if (mode === "funds") G.player(s).balance = 1000;
    if (mode === "foreign")
      p.companyId = s.companies.find((c) => c.id !== s.playerId).id;
    if (mode === "reserved") p.reservedFor = "other-job";
    if (mode === "sold") p.carId = car.id;
    if (mode === "busy") G.Economy.job(s);
    if (mode === "registered") {
      const d = s.drivers
        .filter((d) => !d.companyId)
        .sort((a, b) => a.ask - b.ask)[0];
      G.Drivers.offer(s, d.id, d.ask, 12);
      const e = G.nextEvent(s);
      d.contract.end = e.day + 365;
      s.day = e.day;
      G.Race.register(s, e.id, d.id, car.id);
    }
    if (mode === "capacity") {
      G.player(s).sparesCapacity = 1;
      G.Workshop.buy(s, stock(G, s, "intake-club").id);
    }
    unchanged(
      s,
      () =>
        G.Coachwork.install(s, mode === "missingcar" ? "none" : car.id, p.id),
      /./,
    );
  }
});
test("Un programa de entrenamiento reserva el coche también para el nuevo montaje, sin compra ni cobro", () => {
  const { G } = engine({ workbench: true }),
    s = G.Storage.unpack(read("v80-camp.json")).state;
  G.Coachwork.initialize(s);
  const car = s.cars.find((c) => c.id === G.Practice.active(s).carId);
  unchanged(
    s,
    () => G.Coachwork.install(s, car.id, stock(G, s, "shell-touring").id),
    /entrenando/,
  );
});
test("Carrocería ancha modifica ancho físico y repetición; motor y frenada llegan a la simulación y el guardado sigue válido", () => {
  const { G, s, car } = game();
  fit(G, s, car, "chassis-street");
  fit(G, s, car, "shell-wide");
  fit(G, s, car, "engine-club");
  fit(G, s, car, "brakes-club");
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  const e = G.nextEvent(s);
  d.contract.end = e.day + 365;
  s.day = e.day;
  G.Race.register(s, e.id, d.id, car.id);
  G.Race.start(s, e.id);
  const r = s.race,
    a = r.entrants.find((a) => a.companyId === s.playerId),
    meta = r.replay.cars.find((m) => m.carId === car.id);
  assert.equal(a.coachwork.style, "wide");
  assert.equal(a.width, G.Data.models[car.modelIndex].width + 0.08);
  assert.equal(meta.width, a.width);
  assert.equal(meta.coachwork.style, "wide");
  assert.ok(a.hp > car.base.hp);
  assert.ok(a.brakes > car.base.brakes);
  G.Race.tick(s, 100);
  G.Storage.validate(s);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 100);
  G.Race.tick(copy, 100);
  assert.deepEqual(json(copy), json(s));
  const playback = G.RaceWeekend.playback(
    { ...r.replay, duration: r.time },
    r.time,
  );
  assert.equal(
    playback.entrants.find((a) => a.carId === car.id).coachwork.style,
    "wide",
  );
  while (!r.finished) G.Race.tick(s, 400);
  G.Race.finish(s);
  G.Storage.validate(s);
  assert.equal(car.coachwork.style, "wide");
});
test("El guardado rechaza metadatos visuales falsos y piezas sin propietario o sin activación", () => {
  const { G, s, car } = game();
  fit(G, s, car, "shell-touring");
  car.coachwork.style = "race";
  assert.throws(() => G.Storage.validate(s), /incoherente/);
  G.Coachwork.sync(s, car);
  const p = s.parts.find((p) => p.id === car.installed.shell);
  p.companyId = null;
  assert.throws(() => G.Storage.validate(s), /propietario/);
  p.companyId = s.playerId;
  delete s.workbench;
  assert.throws(() => G.Storage.validate(s), /requisitos/);
});
test("Una carrera auténtica 0.8 termina con su resultado y estado exactos antes de abrir el taller nuevo", () => {
  const { G } = engine({ workbench: true }),
    s = G.Storage.unpack(read("v80-race.json")).state;
  assert.equal(s.workbench, undefined);
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(read("v80-results.json")),
  );
  assert.deepEqual(json(s), JSON.parse(read("v80-finished.json")));
});
for (const type of ["install", "camp"])
  test(`Un ${type === "camp" ? "programa" : "montaje"} auténtico 0.8 conserva entrega, cobros, informe y estado completos`, () => {
    const { G } = engine({ workbench: true }),
      s = G.Storage.unpack(read(`v80-${type}.json`)).state;
    const end =
      type === "camp" ? G.Practice.active(s).end : G.ownedCars(s)[0].repair.end;
    G.Calendar.advance(s, end - s.day);
    assert.deepEqual(json(s), JSON.parse(read(`v80-${type}-finished.json`)));
    G.Storage.validate(s);
  });
