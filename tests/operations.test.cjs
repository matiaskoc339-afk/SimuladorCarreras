const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1263) {
  const { G } = engine();
  return { G, s: G.createGame("Aster Gerencia", "", seed) };
}
function hire(G, s, role) {
  const e = s.employees
    .filter((e) => e.role === role && e.status === "available")
    .sort((a, b) => b.skill - a.skill)[0];
  const r = G.Staff.offer(s, e.id, { salary: 1400, months: 12 });
  assert.equal(r.accepted, true);
  return e;
}
function setup(G, s, kinds) {
  const q = G.Operations.defaults();
  q.enabled = true;
  q.minimumCash = 0;
  q.reserveMonths = 0;
  q.dailyLimit = 10000;
  q.monthlyLimit = 20000;
  for (const k of kinds) {
    q.policies[k].enabled = true;
    q.policies[k].budget = 10000;
  }
  G.Operations.configure(s, q);
  return s.operations.settings;
}
function pilot(G, s) {
  const d = s.drivers.find((d) => !d.companyId);
  assert.equal(G.Drivers.offer(s, d.id, d.ask, 12).accepted, true);
  return d;
}
function damage(G, s, component = "engine", value = 45) {
  const c = G.ownedCars(s)[0];
  c.components[component] = value;
  G.Workshop.recalculate(s, c);
  return c;
}
function strip(s) {
  const x = json(s);
  delete x.operations;
  x.employees = x.employees.filter((e) => !e.id.startsWith("specialist-"));
  if (x.professional)
    for (const id of Object.keys(x.professional.profiles))
      if (id.startsWith("specialist-")) delete x.professional.profiles[id];
  return x;
}

test("Gerente y médico: candidatos nuevos con identidad propia, sin alterar mercado anterior ni RNG global", () => {
  const { G, s } = game();
  assert.equal(s.employees.length, 35);
  assert.equal(s.employees.filter((e) => e.role === "manager").length, 5);
  assert.equal(s.employees.filter((e) => e.role === "doctor").length, 5);
  assert.equal(s.staffing.sequence, 25);
  const before = json(s);
  G.Operations.initialize(s);
  assert.deepEqual(json(s), before);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
  G.Storage.validate(s);
});
test("Previsión de operaciones: consultas y selección no cambian caja, RNG, inventario ni contratos", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  setup(G, s, ["maintenance", "purchases"]);
  damage(G, s);
  s.operations.settings.parts = ["cooling-race"];
  const before = json(s);
  for (let i = 0; i < 5; i++) G.Operations.plan(s);
  assert.deepEqual(json(s), before);
});
test("Mantenimiento: paga una vez, programa un trabajo real y solo repara al vencer su plazo", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  hire(G, s, "mechanic");
  setup(G, s, ["maintenance"]);
  const c = damage(G, s),
    cash = G.player(s).balance;
  const result = G.Operations.run(s);
  assert.equal(result.count, 1);
  assert.ok(c.repair);
  assert.equal(c.components.engine, 45);
  assert.equal(G.player(s).balance, cash - result.spent);
  const before = json(s);
  assert.throws(() => G.Operations.run(s), /hoy/);
  assert.deepEqual(json(s), before);
  G.Calendar.advance(s, c.repair.end - s.day);
  assert.equal(c.components.engine, 100);
  assert.equal(G.Operations.spending(s).total, result.spent);
  G.Storage.validate(s);
});
test("El coste máximo por reparación, los topes diario, de área y mensual son vinculantes", () => {
  for (const cap of ["work", "day", "area", "month"]) {
    const { G, s } = game();
    hire(G, s, "manager");
    const q = setup(G, s, ["maintenance"]);
    damage(G, s);
    if (cap === "work") q.policies.maintenance.maxCost = 100;
    if (cap === "day") q.dailyLimit = 100;
    if (cap === "area") q.policies.maintenance.budget = 100;
    if (cap === "month") q.monthlyLimit = 100;
    const cash = G.player(s).balance;
    assert.equal(G.Operations.run(s).count, 0);
    assert.equal(G.player(s).balance, cash);
    assert.ok(
      s.operations.log.some(
        (r) =>
          r.status === "blocked" && /máximo|límite|Presupuesto/.test(r.reason),
      ),
    );
    G.Storage.validate(s);
  }
});
test("La reserva protege caja y previsión de nóminas antes de gastar", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const q = setup(G, s, ["maintenance"]);
  damage(G, s);
  q.minimumCash = G.player(s).balance;
  q.reserveMonths = 1;
  const cash = G.player(s).balance;
  assert.equal(G.Operations.run(s).spent, 0);
  assert.equal(G.player(s).balance, cash);
  assert.ok(s.operations.log.some((r) => r.reason.includes("reserva")));
});
test("Cambiar políticas y recargar no reinicia gasto consumido; solo el nuevo mes abre otro presupuesto", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const q = setup(G, s, ["maintenance"]);
  const c = damage(G, s);
  G.Operations.run(s);
  const total = G.Operations.spending(s).total;
  G.Operations.configure(s, json(q));
  const loaded = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.equal(G.Operations.spending(loaded).total, total);
  s.day = c.repair.end;
  G.Workshop.complete(s, c);
  s.day = G.dayOf(2026, 1, 1);
  assert.equal(G.Operations.spending(s).total, 0);
  assert.equal(s.operations.months[0].total, total);
  G.Storage.validate(s);
});
test("El gerente no retira inscripciones ni inicia reparaciones que invaden la jornada deportiva", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const d = pilot(G, s),
    c = G.ownedCars(s)[0],
    ev = G.nextEvent(s);
  G.Race.register(s, ev.id, d.id, c.id);
  const entry = json(ev.entry);
  damage(G, s);
  setup(G, s, ["maintenance"]);
  s.day = ev.day - 1;
  assert.equal(G.Operations.run(s).count, 0);
  assert.deepEqual(json(ev.entry), entry);
  assert.equal(c.repair, null);
  s.day = ev.day;
  assert.match(G.Operations.plan(s).gate, /carrera/);
});
test("Una bahía ocupada bloquea mantenimiento y montaje; no se duplican recursos", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  setup(G, s, ["maintenance"]);
  const c = damage(G, s);
  G.Economy.job(s);
  const before = G.player(s).balance;
  assert.equal(G.Operations.run(s).count, 0);
  assert.equal(G.player(s).balance, before);
  assert.equal(c.repair, null);
  G.Storage.validate(s);
});
test("Compras: una unidad real cambia de propietario, paga al proveedor y respeta el objetivo de almacén", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const q = setup(G, s, ["purchases"]);
  q.parts = ["cooling-race"];
  const supplier = s.partsSupplier.balance,
    cash = G.player(s).balance;
  const r = G.Operations.run(s),
    parts = G.Workshop.inventory(s);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].definitionId, "cooling-race");
  assert.equal(s.partsSupplier.balance, supplier + r.spent);
  assert.equal(G.player(s).balance, cash - r.spent);
  s.day++;
  assert.equal(G.Operations.run(s).count, 0);
  assert.equal(G.Workshop.inventory(s).length, 1);
  G.Storage.validate(s);
});
test("Stock, compatibilidad, estado mínimo, precio y espacio bloquean compras sin gastar", () => {
  for (const scenario of ["stock", "model", "condition", "price", "capacity"]) {
    const { G, s } = game();
    hire(G, s, "manager");
    const q = setup(G, s, ["purchases"]);
    q.parts = [scenario === "model" ? "ecu-t23" : "cooling-race"];
    if (scenario === "stock")
      for (const p of s.parts.filter((p) => p.definitionId === "cooling-race"))
        p.companyId = s.companies[1].id;
    if (scenario === "condition")
      for (const p of s.parts.filter((p) => p.definitionId === "cooling-race"))
        p.condition = 30;
    if (scenario === "price") q.policies.purchases.maxUnit = 10;
    if (scenario === "capacity") {
      for (const p of s.parts.slice(0, 8)) p.companyId = s.playerId;
    }
    const cash = G.player(s).balance;
    assert.equal(G.Operations.run(s).spent, 0);
    assert.equal(G.player(s).balance, cash);
  }
});
test("Inventario autorizado: montaje con reserva y entrega física, sin reemplazar mejoras sanas", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  hire(G, s, "engineer");
  const q = setup(G, s, ["inventory"]);
  q.parts = ["cooling-race"];
  const p = G.Workshop.stock(s, "cooling-race")[0];
  G.Workshop.buy(s, p.id);
  const car = G.ownedCars(s)[0];
  G.Operations.run(s);
  assert.equal(car.repair.partId, p.id);
  assert.ok(p.reservedFor);
  assert.equal(car.installed.cooling, undefined);
  G.Calendar.advance(s, car.repair.end - s.day);
  assert.equal(car.installed.cooling, p.id);
  const other = G.Workshop.stock(s, "cooling-race")[0];
  G.Workshop.buy(s, other.id);
  s.day++;
  assert.equal(G.Operations.run(s).count, 0);
  assert.equal(car.installed.cooling, p.id);
  G.Storage.validate(s);
});
test("Montajes inscritos y requisitos mecánicos se respetan sin retirar ni pagar pedidos inválidos", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const d = pilot(G, s),
    c = G.ownedCars(s)[0];
  const part = G.Workshop.stock(s, "cooling-race")[0];
  G.Workshop.buy(s, part.id);
  G.Race.register(s, G.nextEvent(s).id, d.id, c.id);
  const q = setup(G, s, ["inventory"]);
  q.parts = ["cooling-race"];
  const before = G.player(s).balance;
  assert.equal(G.Operations.run(s).spent, 0);
  assert.equal(G.player(s).balance, before);
  assert.equal(part.reservedFor, null);
});
test("Prioridades y nivel del gerente cambian el número de órdenes, sin saltarse presupuestos", () => {
  const counts = [];
  for (const level of [1, 10]) {
    const { G, s } = game();
    const m = hire(G, s, "manager");
    G.Professionals.profile(s, m.id).level = level;
    const q = setup(G, s, ["purchases"]);
    q.parts = ["cooling-race", "exhaust-light", "intake-club"];
    const r = G.Operations.run(s);
    counts.push(r.count);
    assert.ok(r.spent <= q.dailyLimit);
  }
  assert.equal(counts[0], 1);
  assert.ok(counts[1] > counts[0]);
  const ability = game(),
    manager = hire(ability.G, ability.s, "manager");
  ability.G.Professionals.profile(ability.s, manager.id).level = 10;
  manager.skill = 30;
  const lowAbility = ability.G.Operations.capacity(ability.s, manager);
  manager.skill = 95;
  assert.ok(ability.G.Operations.capacity(ability.s, manager) > lowAbility);

  const { G, s } = game();
  const m = hire(G, s, "manager");
  G.Professionals.profile(s, m.id).level = 1;
  const q = setup(G, s, ["maintenance", "purchases"]);
  damage(G, s);
  q.parts = ["cooling-race"];
  q.policies.purchases.priority = 1;
  q.policies.maintenance.priority = 9;
  G.Operations.run(s);
  assert.equal(
    s.operations.log.find((r) => r.status === "done").kind,
    "purchases",
  );
});
test("Descanso, rescisión, impago y pausa detienen delegación sin gastar por vías alternativas", () => {
  for (const why of ["rest", "release", "arrears", "paused"]) {
    const { G, s } = game();
    const m = hire(G, s, "manager");
    setup(G, s, ["maintenance"]);
    damage(G, s);
    if (why === "rest") G.Professionals.rest(s, m.id, 3);
    if (why === "release") G.Staff.release(s, m.id);
    if (why === "arrears") m.contract.arrears = 100;
    if (why === "paused") G.Operations.pause(s);
    const cash = G.player(s).balance;
    G.Operations.daily(s);
    assert.equal(G.player(s).balance, cash);
    assert.equal(G.ownedCars(s)[0].repair, null);
    G.Storage.validate(s);
  }
});
test("Formación delegada cobra $18 una sola vez, mejora con entrenador y conserva límites de descanso", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  hire(G, s, "manager");
  hire(G, s, "trainer");
  const d = pilot(G, s);
  const q = setup(G, s, ["training"]);
  q.policies.training.drivers = [d.id];
  d.training = "pace";
  const stat = d.stats.control;
  d.stats.pace = d.stats.control + 5;
  const before = G.player(s).balance;
  G.Calendar.advance(s, 1);
  assert.equal(G.Operations.spending(s).total, 18);
  assert.ok(d.stats.control > stat);
  assert.equal(G.player(s).balance, before - 18 - 18);
  assert.equal(d.fatigue, 10);
  assert.ok(G.Operations.controlsTraining(s, d));
  G.Storage.validate(s);
});
test("Sin entrenador o con fatiga, estrés, lesión o carrera próxima no se cobra formación", () => {
  for (const why of ["coach", "fatigue", "stress", "injury", "race"]) {
    const { G, s } = game();
    G.player(s).balance = 100000;
    hire(G, s, "manager");
    if (why !== "coach") hire(G, s, "trainer");
    const d = pilot(G, s),
      q = setup(G, s, ["training"]);
    q.policies.training.drivers = [d.id];
    if (why === "fatigue") d.fatigue = 90;
    if (why === "stress") G.Professionals.care(s, d.id).stress = 90;
    if (why === "injury")
      G.Professionals.care(s, d.id).injuryUntil = s.day + 10;
    if (why === "race") s.day = G.nextEvent(s).day - 2;
    assert.equal(G.Operations.run(s).spent, 0);
  }
});
test("Pausar no deja una cuota de formación manual oculta; una orden manual retoma el control", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  hire(G, s, "manager");
  hire(G, s, "trainer");
  const d = pilot(G, s),
    q = setup(G, s, ["training"]);
  q.policies.training.drivers = [d.id];
  d.training = "pace";
  G.Operations.pause(s);
  const stat = d.stats.pace;
  G.Calendar.advance(s, 1);
  assert.equal(d.stats.pace, stat);
  assert.equal(G.Operations.spending(s).total, 0);
  G.Drivers.train(s, d.id, "control");
  assert.equal(G.Operations.controlsTraining(s, d), false);
  assert.equal(d.training, "control");
  assert.equal(s.operations.log.at(-1).status, "manual");
  G.Storage.validate(s);
});
test("Ojeo delegado: encargo pagado, filtros, espera y un solo informe por candidato", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  hire(G, s, "manager");
  hire(G, s, "scout");
  const q = setup(G, s, ["scouting"]);
  q.policies.scouting.maxAge = 45;
  q.policies.scouting.minRating = 20;
  const r = G.Operations.run(s);
  assert.equal(r.spent, 75);
  const j = s.staffing.assignments[0];
  assert.ok(j);
  assert.ok(s.drivers.find((d) => d.id === j.driverId && !d.companyId));
  s.day++;
  assert.equal(G.Operations.run(s).spent, 0);
  G.Storage.validate(s);
});
test("Ojeador con contrato insuficiente produce bloqueo informativo en vez de una ejecución parcial", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  hire(G, s, "manager");
  const scout = hire(G, s, "scout");
  scout.contract.end = s.day + 1;
  setup(G, s, ["scouting"]);
  const cash = G.player(s).balance;
  assert.equal(G.Operations.run(s).count, 0);
  assert.equal(G.player(s).balance, cash);
  assert.ok(s.operations.log.some((r) => /Renueva/.test(r.reason)));
});
test("Encargos delegados ocupan una bahía y entregan el mismo ingreso neto una sola vez", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  setup(G, s, ["jobs"]);
  const cash = G.player(s).balance;
  const r = G.Operations.run(s);
  assert.equal(r.spent, 0);
  assert.ok(s.job);
  const days = s.job.end - s.day;
  G.Calendar.advance(s, days);
  assert.equal(G.player(s).balance, cash - days * 18 + 360);
  assert.equal(s.job, null);
  G.Storage.validate(s);
});
test("Guardar con reparación y políticas activas reproduce las mismas decisiones y facturas", () => {
  const { G, s } = game();
  hire(G, s, "manager");
  const q = setup(G, s, ["maintenance", "purchases"]);
  q.parts = ["cooling-race"];
  damage(G, s);
  G.Operations.run(s);
  const other = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 3);
  G.Calendar.advance(other, 3);
  assert.deepEqual(json(other), json(s));
});
test("Tratamiento: exige médico, lesión recuperable, contratos, coste y un intento por episodio", () => {
  const { G, s } = game(),
    d = pilot(G, s);
  G.Professionals.care(s, d.id).injuryUntil = 10;
  assert.throws(() => G.Operations.medicalQuote(s, d.id), /médico/);
  hire(G, s, "doctor");
  const q = G.Operations.medicalQuote(s, d.id),
    before = json(s);
  G.Operations.medicalQuote(s, d.id);
  assert.deepEqual(json(s), before);
  const cash = G.player(s).balance,
    c = G.Operations.treat(s, d.id);
  assert.equal(G.player(s).balance, cash - 120);
  assert.equal(c.end, 2);
  assert.equal(c.accuracy, q.accuracy);
  assert.throws(() => G.Operations.treat(s, d.id), /médico|tratamiento/);
  assert.throws(() => G.Drivers.release(s, d.id), /tratamiento/);
  assert.ok(G.Market.locked(s, d.id));
  G.Storage.validate(s);
});
test("Médico experto puede ahorrar más días y el estrés reduce el acierto", () => {
  const { G, s } = game(),
    d = pilot(G, s),
    e = hire(G, s, "doctor"),
    p = G.Professionals.profile(s, e.id);
  G.Professionals.care(s, d.id).injuryUntil = 20;
  p.level = 1;
  const low = G.Operations.medicalQuote(s, d.id);
  p.level = 10;
  const high = G.Operations.medicalQuote(s, d.id);
  assert.ok(high.accuracy > low.accuracy);
  assert.ok(high.saving > low.saving);
  p.stress = 90;
  assert.ok(G.Operations.medicalQuote(s, d.id).accuracy < high.accuracy);
});
for (const success of [true, false])
  test(`Tratamiento ${success ? "acertado" : "fallido"}: resultado al segundo día, sin curación instantánea, ni cargos o intentos duplicados`, () => {
    const { G, s } = game(),
      d = pilot(G, s),
      doc = hire(G, s, "doctor");
    G.Professionals.profile(s, doc.id).level = 10;
    const care = G.Professionals.care(s, d.id);
    care.injuryUntil = 20;
    const c = G.Operations.treat(s, d.id);
    c.roll = success ? 0 : 0.999;
    assert.throws(() => G.Staff.release(s, doc.id), /trabajo|entrenamiento/);
    assert.throws(() => G.Professionals.rest(s, doc.id, 3), /trabajo/);
    G.Calendar.advance(s, 1);
    assert.equal(care.injuryUntil, 20);
    G.Calendar.advance(s, 1);
    assert.equal(c.status, "complete");
    assert.equal(care.injuryUntil, success ? 16 : 20);
    assert.equal(G.Professionals.fit(s, d.id), false);
    const before = json(s);
    G.Operations.medicalDaily(s);
    assert.deepEqual(json(s), before);
    assert.throws(() => G.Operations.treat(s, d.id), /lesión/);
    assert.ok(doc.contributions.jobs > 0);
    G.Storage.validate(s);
  });
test("No se resucita un piloto retirado ni se extiende una lesión ya recuperada", () => {
  const { G, s } = game(),
    d = pilot(G, s);
  hire(G, s, "doctor");
  const care = G.Professionals.care(s, d.id);
  care.retired = true;
  assert.throws(() => G.Operations.treat(s, d.id), /no disponible/);
  care.retired = false;
  care.injuryUntil = 10;
  const c = G.Operations.treat(s, d.id);
  c.roll = 0;
  s.day = 12;
  G.Operations.medicalDaily(s);
  assert.equal(care.injuryUntil, 10);
  assert.equal(c.saved, 0);
  G.Storage.validate(s);
});
test("Tratamiento persistente: recargar mantiene el mismo resultado y la bancarrota cancela la atención pendiente", () => {
  const { G, s } = game(),
    d = pilot(G, s);
  hire(G, s, "doctor");
  G.Professionals.care(s, d.id).injuryUntil = 20;
  const c = G.Operations.treat(s, d.id),
    copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 2);
  G.Calendar.advance(copy, 2);
  assert.deepEqual(json(copy), json(s));
  const other = game(),
    p = pilot(other.G, other.s);
  hire(other.G, other.s, "doctor");
  other.G.Professionals.care(other.s, p.id).injuryUntil = 20;
  const treatment = other.G.Operations.treat(other.s, p.id);
  other.G.player(other.s).status = "bankrupt";
  other.s.status = "bankrupt";
  other.G.Companies.bankrupt(other.s, other.G.player(other.s));
  assert.equal(treatment.status, "cancelled");
  other.G.Storage.validate(other.s);
});
test("Migración auténtica 0.6.2 en boxes manuales conserva estado anterior, acciones y resultado final exactos", () => {
  const { G } = engine(),
    read = (n) =>
      fs.readFileSync(path.join(__dirname, "fixtures/" + n), "utf8"),
    raw = read("v62-race.json"),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.deepEqual(strip(s), old);
  const a = s.race.entrants.find((a) => a.companyId === s.playerId);
  const act = (name, w) => {
    while (s.race.time + 0.0001 < a.pit.manual.readyAt) G.Race.tick(s, 1);
    G.PitCrew.action(s, name, w);
  };
  for (let w = 0; w < 4; w++) {
    act("select", w);
    for (let n = w === 0 ? 2 : 0; n < 4; n++) act("loosen");
    act("remove");
    act("fit");
    for (let n = 0; n < 4; n++) act("tighten");
  }
  act("lower");
  act("check");
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(read("v62-results.json")),
  );
  assert.deepEqual(strip(s), JSON.parse(read("v62-finished.json")));
  G.Storage.validate(s);
});
test("Migración auténtica de entrenamiento 0.6.2 conserva la física, progreso, precio y resultado exactos", () => {
  const { G } = engine(),
    read = (n) =>
      fs.readFileSync(path.join(__dirname, "fixtures/" + n), "utf8"),
    raw = read("v62-practice.json"),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.deepEqual(strip(s), old);
  while (G.Practice.active(s)) G.Practice.tick(s, 2000);
  assert.deepEqual(strip(s), JSON.parse(read("v62-practice-finished.json")));
  G.Storage.validate(s);
});
test("Validación: rechaza políticas, contadores, referencias, registros, personal adicional y atención corruptos", () => {
  const { G, s } = game(),
    d = pilot(G, s);
  hire(G, s, "doctor");
  G.Professionals.care(s, d.id).injuryUntil = 20;
  G.Operations.treat(s, d.id);
  for (const change of [
    (s) => (s.operations.settings.monthlyLimit = -1),
    (s) => (s.operations.settings.policies.maintenance.maxCost = 0),
    (s) => (s.operations.settings.parts = ["desconocida"]),
    (s) => (s.operations.settings.policies.training.drivers = ["driver-no"]),
    (s) => (s.operations.lastDaily = s.day + 1),
    (s) => (s.operations.care[0].roll = NaN),
    (s) => (s.operations.care[0].doctorId = s.employees[0].id),
    (s) => s.operations.care.push(json(s.operations.care[0])),
    (s) =>
      s.operations.months.push({ month: "2026-01", total: 100, spent: {} }),
    (s) => (s.operations.sequence = 0),
    (s) => (s.operations.sequence = 10),
  ]) {
    const copy = json(s);
    change(copy);
    assert.throws(() => G.Storage.validate(copy));
  }
});
