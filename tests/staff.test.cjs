const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1070) {
  const { G } = engine();
  return { G, s: G.createGame("Aster Personal", "", seed) };
}
function hire(G, s, role, id = s.playerId) {
  const e = s.employees
    .filter((e) => e.role === role && e.status === "available")
    .sort((a, b) => b.skill - a.skill)[0];
  G.Staff.offer(s, e.id, { salary: e.ask + 50, months: 12, bonus: 0 }, id);
  return e;
}
function upgrade(G, s, key, id = s.playerId) {
  const j = G.Facilities.start(s, key, id);
  s.day = j.end;
  G.Facilities.complete(s);
}
function workshop(G, s) {
  G.player(s).balance = 100000;
  G.player(s).level = 3;
  G.Facilities.site(s).highestLevel = 3;
  upgrade(G, s, "workshop");
  upgrade(G, s, "workshop");
}
function daily(G, s, end, assess = false) {
  while (s.day < end) {
    s.day++;
    G.Staff.daily(s);
    if (assess) G.Economy.assess(s);
  }
}
function race(G, s) {
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 12);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  G.Calendar.advance(s, e.day - s.day);
  G.Race.start(s, e.id);
  return s.race;
}
test("Personal persistente: 25 candidatos, semilla independiente e inicialización idempotente", () => {
  const { G, s } = game(),
    other = game();
  assert.equal(s.employees.length, 25);
  assert.deepEqual(json(s.employees), json(other.s.employees));
  const before = json(s);
  G.Staff.initialize(s);
  assert.deepEqual(json(s), before);
  assert.equal(new Set(s.employees.map((e) => e.id)).size, 25);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
});
test("Negociación: contraoferta, prima única, contrato y rechazo de doble contratación", () => {
  const { G, s } = game(),
    e = s.employees[0],
    cash = G.player(s).balance;
  const first = G.Staff.offer(s, e.id, { salary: 150, months: 12, bonus: 40 });
  assert.equal(first.accepted, false);
  assert.equal(G.player(s).balance, cash);
  assert.equal(
    G.Staff.offer(s, e.id, { salary: first.salary, months: 12, bonus: 40 })
      .accepted,
    true,
  );
  assert.equal(G.player(s).balance, cash - 40);
  assert.equal(e.companyId, s.playerId);
  assert.equal(e.contract.end, 360);
  const before = json(s);
  assert.throws(
    () => G.Staff.offer(s, e.id, { salary: e.ask, months: 12 }),
    /disponible/,
  );
  assert.deepEqual(json(s), before);
  G.Storage.validate(s);
});
test("Tres ofertas insuficientes guardan memoria y pausa de negociación sin cobrar salarios", () => {
  const { G, s } = game(),
    e = s.employees.find((e) => e.role === "engineer"),
    rng = s.rng;
  for (let i = 0; i < 3; i++)
    G.Staff.offer(s, e.id, { salary: 150, months: 12 });
  assert.equal(s.staffing.negotiations[`player:${e.id}`].cooldown, 7);
  assert.equal(e.memory.length, 3);
  assert.equal(e.companyId, null);
  const before = json(s);
  assert.throws(
    () => G.Staff.offer(s, e.id, { salary: 1000, months: 12 }),
    /esperar/,
  );
  assert.deepEqual(json(s), before);
  assert.equal(s.rng, rng);
});
test("Capacidad de oficina, especialidad, fondos y términos se validan antes de mutar", () => {
  const { G, s } = game();
  hire(G, s, "mechanic");
  const duplicate = s.employees.find(
    (e) => e.role === "mechanic" && e.status === "available",
  );
  let before = json(s);
  assert.throws(
    () => G.Staff.offer(s, duplicate.id, { salary: 1000, months: 12 }),
    /especialidad/,
  );
  assert.deepEqual(json(s), before);
  hire(G, s, "engineer");
  const trainer = s.employees.find((e) => e.role === "trainer");
  before = json(s);
  assert.throws(
    () => G.Staff.offer(s, trainer.id, { salary: 1000, months: 12 }),
    /plazas/,
  );
  assert.deepEqual(json(s), before);
  upgrade(G, s, "office");
  hire(G, s, "trainer");
  assert.equal(G.Staff.owned(s).length, 3);
  assert.equal(G.Staff.capacity(s), 4);
  const scout = s.employees.find((e) => e.role === "scout");
  G.player(s).balance = 1;
  before = json(s);
  assert.throws(
    () => G.Staff.offer(s, scout.id, { salary: 500, months: 12, bonus: 20 }),
    /fondos/,
  );
  assert.deepEqual(json(s), before);
  G.player(s).balance = 10000;
  assert.throws(
    () => G.Staff.offer(s, scout.id, { salary: 500, months: 2 }),
    /Condiciones/,
  );
  G.Storage.validate(s);
});
test("El mismo profesional libre no puede terminar contratado por dos compañías", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout"),
    buyer = s.companies[1],
    before = json(s);
  assert.throws(
    () => G.Staff.offer(s, e.id, { salary: 1000, months: 12 }, buyer.id),
    /disponible/,
  );
  assert.deepEqual(json(s), before);
});
test("Mecánico: una reparación tarda menos y el profesional recibe crédito al entregar", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    car = G.ownedCars(s)[0],
    skill = e.skill;
  assert.equal(G.Facilities.duration(s, s.playerId, 2), 2);
  const j = G.Economy.repair(s, car.id);
  assert.equal(j.end - j.start, 1);
  assert.equal(j.staffSupport.employeeId, e.id);
  assert.throws(() => G.Staff.release(s, e.id), /trabajo/);
  s.day = j.end;
  G.Workshop.complete(s, car);
  assert.equal(e.contributions.jobs, 1);
  assert.ok(e.skill > skill);
  assert.equal(car.repair, null);
  const copy = json(s);
  G.Workshop.complete(s, car);
  assert.deepEqual(json(s), copy);
  G.Storage.validate(s);
});
test("Asignación real: un mecánico no apoya dos bahías a la vez", () => {
  const { G, s } = game();
  workshop(G, s);
  const e = hire(G, s, "mechanic");
  G.Market.buy(s, s.market[0].id);
  const [a, b] = G.ownedCars(s),
    first = G.Economy.repair(s, a.id),
    second = G.Economy.repair(s, b.id);
  assert.equal(first.staffSupport.employeeId, e.id);
  assert.equal(second.staffSupport, null);
  assert.equal(
    second.end - second.start,
    G.Facilities.duration(s, s.playerId, 2),
  );
  G.Storage.validate(s);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), json(s));
});
test("Ingeniero: montaje con trabajador asignado y plazo conservado al contratar después", () => {
  const { G, s } = game(),
    car = G.ownedCars(s)[0],
    e = hire(G, s, "engineer"),
    part = s.parts.find(
      (p) => p.definitionId === "light-body" && p.companyId === null,
    );
  G.Workshop.buy(s, part.id);
  const j = G.Workshop.install(s, car.id, part.id);
  assert.equal(j.end - j.start, 2);
  assert.equal(j.staffSupport.employeeId, e.id);
  const end = j.end;
  hire(G, s, "mechanic");
  assert.equal(j.end, end);
  s.day = end;
  G.Workshop.complete(s, car);
  assert.equal(e.contributions.jobs, 1);
  G.Storage.validate(s);
});
test("Encargos comparten disponibilidad de mecánicos y pagan el mismo neto, sin duplicar el cobro", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  const cash = G.player(s).balance;
  G.Economy.job(s);
  assert.equal(s.job.end - s.day, 2);
  assert.equal(s.job.staffSupport.employeeId, e.id);
  s.day = s.job.end;
  G.Economy.daily(s);
  assert.equal(e.contributions.jobs, 1);
  assert.equal(s.job, null);
  assert.equal(G.player(s).balance, cash + 360 - 18);
  assert.equal(
    G.player(s).ledger.filter((t) =>
      t.label.includes("Encargo de mantenimiento"),
    ).length,
    1,
  );
});
test("Un trabajador con contrato insuficiente no se asigna al nuevo trabajo", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  e.contract.end = 1;
  const plan = G.Staff.plan(s, s.playerId, "repair", 2);
  assert.equal(plan.staffSupport, null);
  assert.equal(plan.days, 2);
});
test("Entrenador: mejora formación pagada, respeta el potencial y registra sesiones", () => {
  const { G, s } = game(),
    e = hire(G, s, "trainer"),
    d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 12);
  G.Drivers.train(s, d.id, "pace");
  d.stats.pace = 50;
  d.potential = 80;
  s.day = 1;
  const base = json(s);
  base.employees.find((other) => other.id === e.id).companyId = null;
  base.employees.find((other) => other.id === e.id).contract = null;
  base.employees.find((other) => other.id === e.id).status = "available";
  G.Drivers.daily(base);
  G.Drivers.daily(s);
  assert.ok(
    d.stats.pace > base.drivers.find((other) => other.id === d.id).stats.pace,
  );
  assert.equal(e.contributions.sessions, 1);
  d.stats.pace = d.potential - 0.001;
  G.Drivers.daily(s);
  assert.equal(d.stats.pace, d.potential);
  G.Storage.validate(s);
});
test("Ingeniero en carrera: reduce temperatura y desgaste reales sin restaurar componentes", () => {
  const { G, s } = game();
  hire(G, s, "engineer");
  const r = race(G, s),
    a = r.entrants.find((a) => a.companyId === s.playerId),
    baseline = json(a);
  assert.ok(a.staffSupport.engineer > 0);
  baseline.staffSupport.engineer = 0;
  const initial = a.components.engine;
  for (let i = 0; i < 20; i++) {
    G.Workshop.wear(a, 100, 1, 0);
    G.Workshop.wear(baseline, 100, 1, 0);
  }
  assert.ok(a.components.engine < initial);
  assert.ok(a.components.engine > baseline.components.engine);
  assert.ok(a.thermal < baseline.thermal);
  assert.throws(() => G.Staff.release(s, G.Staff.owned(s)[0].id), /ahora/);
});
test("Boxes: mecánico y estratega reducen servicio; la sanción mantiene sus cinco segundos completos", () => {
  const { G, s } = game();
  hire(G, s, "mechanic");
  hire(G, s, "strategist");
  const r = race(G, s),
    a = r.entrants.find((a) => a.companyId === s.playerId),
    copy = json(s),
    b = copy.race.entrants.find((a) => a.companyId === s.playerId);
  b.staffSupport = { mechanic: 0, engineer: 0, strategist: 0 };
  a.unservedPenalty = b.unservedPenalty = 5;
  G.RaceWeekend.requestPit(s);
  G.RaceWeekend.requestPit(copy);
  for (let i = 0; i < 10000 && a.pit.phase !== "box"; i++) G.Race.tick(s, 1);
  for (let i = 0; i < 10000 && b.pit.phase !== "box"; i++) G.Race.tick(copy, 1);
  assert.equal(a.pit.phase, "box");
  assert.equal(b.pit.phase, "box");
  assert.ok(a.pit.remaining < b.pit.remaining);
  assert.ok(
    Math.abs(
      a.pit.remaining - ((b.pit.remaining - 5) * G.Staff.pitFactor(a) + 5),
    ) < 1e-8,
  );
  G.Storage.validate(s);
});
test("Ojeo: gastos reales, demora, un encargo por ojeador y RNG independiente", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout"),
    d = s.drivers[0],
    cash = G.player(s).balance,
    rng = s.rng;
  const j = G.Staff.scout(s, e.id, d.id);
  assert.equal(G.player(s).balance, cash - 75);
  assert.ok(j.end - s.day >= 3 && j.end - s.day <= 7);
  assert.equal(s.rng, rng);
  const before = json(s);
  assert.throws(() => G.Staff.scout(s, e.id, s.drivers[1].id), /otro informe/);
  assert.deepEqual(json(s), before);
  daily(G, s, j.end - 1);
  assert.equal(j.status, "active");
  daily(G, s, j.end);
  assert.equal(j.status, "complete");
  assert.equal(e.contributions.reports, 1);
  assert.ok(j.report.lower < j.report.upper);
  assert.ok(j.report.lower >= 20 && j.report.upper <= 99);
  G.Storage.validate(s);
});
test("Ojeo guardado a mitad: misma evaluación, fecha y factura tras recargar", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout"),
    j = G.Staff.scout(s, e.id, s.drivers[0].id);
  daily(G, s, 2);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  daily(G, s, j.end);
  daily(G, copy, j.end);
  assert.deepEqual(json(copy), json(s));
  const before = json(s);
  G.Staff.daily(s);
  assert.deepEqual(json(s), before);
});
test("Rescindir al ojeador cancela el encargo y conserva los gastos ejecutados", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout"),
    j = G.Staff.scout(s, e.id, s.drivers[0].id),
    before = G.player(s).balance,
    cost = G.Staff.releaseQuote(e);
  G.Staff.release(s, e.id);
  assert.equal(G.player(s).balance, before - cost);
  assert.equal(j.status, "cancelled");
  assert.equal(j.report, null);
  assert.equal(e.status, "available");
  assert.throws(
    () => G.Staff.offer(s, e.id, { salary: e.ask, months: 12 }),
    /disponible/,
  );
  G.Storage.validate(s);
});
test("Nómina: devengo diario, pago el día 1 y ausencia de cobro doble al guardar o repetir", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    cash = G.player(s).balance;
  daily(G, s, 27);
  const due = Math.round((e.contract.salary / 30) * 27 * 100) / 100;
  assert.equal(G.player(s).balance, cash - due);
  assert.equal(e.contract.accrued, 0);
  assert.equal(e.contract.arrears, 0);
  assert.equal(
    G.player(s).ledger.filter((t) => t.label === `Nómina · ${e.name}`).length,
    1,
  );
  const before = json(s);
  G.Staff.daily(s);
  assert.deepEqual(json(s), before);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
});
test("Impago real: la nómina queda pendiente, afecta insolvencia y se recupera al disponer de fondos", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  daily(G, s, 26);
  G.player(s).balance = 0;
  daily(G, s, 27, true);
  const due = e.contract.arrears;
  assert.ok(due > 0);
  assert.equal(G.player(s).balance, 0);
  assert.equal(G.player(s).debtDays, 1);
  assert.equal(G.Staff.overdue(s), due);
  G.player(s).balance = due + 100;
  daily(G, s, 28, true);
  assert.equal(e.contract.arrears, 0);
  assert.equal(G.player(s).balance, 100);
  assert.equal(G.player(s).debtDays, 0);
  G.Storage.validate(s);
});
test("Catorce días sin pagar personal provocan bancarrota aunque la caja no sea negativa", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  daily(G, s, 26);
  G.player(s).balance = 0;
  daily(G, s, 40, true);
  assert.equal(s.status, "bankrupt");
  assert.equal(G.player(s).status, "bankrupt");
  assert.equal(e.companyId, null);
  assert.equal(e.contract, null);
  assert.ok(s.staffing.debts.some((d) => !d.paid && d.employeeId === e.id));
  G.Storage.validate(s);
});
test("Liquidar atrasos exige liquidez total y no se puede repetir el pago", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  daily(G, s, 26);
  G.player(s).balance = 0;
  daily(G, s, 27);
  const before = json(s);
  assert.throws(() => G.Staff.pay(s), /liquidez/);
  assert.deepEqual(json(s), before);
  G.player(s).balance = e.contract.arrears + 100;
  G.Staff.pay(s);
  assert.equal(G.player(s).balance, 100);
  assert.equal(G.Staff.overdue(s), 0);
  assert.throws(() => G.Staff.pay(s), /pendientes/);
});
test("Rescisión: indemnización, salarios y atrasos salen una sola vez; no se cobra al fallar", () => {
  const { G, s } = game(),
    e = hire(G, s, "trainer");
  daily(G, s, 5);
  e.contract.arrears = 80;
  const quote = G.Staff.releaseQuote(e);
  G.player(s).balance = quote - 1;
  const before = json(s);
  assert.throws(() => G.Staff.release(s, e.id), /fondos/);
  assert.deepEqual(json(s), before);
  G.player(s).balance = quote + 100;
  G.Staff.release(s, e.id);
  assert.equal(G.player(s).balance, 100);
  const after = json(s);
  assert.throws(() => G.Staff.release(s, e.id), /ahora/);
  assert.deepEqual(json(s), after);
  G.Storage.validate(s);
});
test("Contrato vencido: liquida lo devengado y el mismo empleado puede fichar por un rival", () => {
  const { G, s } = game(),
    e = hire(G, s, "trainer"),
    rival = s.companies[1];
  e.contract.end = 10;
  daily(G, s, 10);
  assert.equal(e.status, "available");
  assert.equal(e.contract, null);
  const before = s.employees.length;
  G.Staff.offer(s, e.id, { salary: e.ask + 100, months: 12 }, rival.id);
  assert.equal(e.companyId, rival.id);
  assert.equal(s.employees.length, before);
  G.Storage.validate(s);
});
test("Renovación: respeta plazo anterior y conserva nóminas devengadas y atrasos", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  assert.throws(() => G.Staff.renew(s, e.id, 1000), /60 días/);
  s.day = 310;
  e.contract.accrued = 50;
  e.contract.arrears = 80;
  const end = e.contract.end,
    salary = G.Staff.renewalMinimum(e);
  G.Staff.renew(s, e.id, salary, 12);
  assert.equal(e.contract.end, end + 360);
  assert.equal(e.contract.accrued, 50);
  assert.equal(e.contract.arrears, 80);
  G.Storage.validate(s);
});
test("Cumpleaños y retiro se procesan una vez, conservando identidad y trayectoria", () => {
  const { G, s } = game(),
    e = hire(G, s, "engineer");
  e.age = 64;
  e.birthday = 0;
  e.lastBirthdayYear = 2026;
  e.contract.end = 720;
  s.day = G.dayOf(2027, 0, 1);
  G.Staff.daily(s);
  assert.equal(e.age, 65);
  assert.equal(e.status, "retired");
  assert.equal(e.companyId, null);
  const age = e.age;
  G.Staff.daily(s);
  assert.equal(e.age, age);
  assert.ok(s.employees.includes(e));
  G.Storage.validate(s);
});
test("Convivencia: conflicto contextual deja memoria y reduce rendimiento; no se repite la noticia diariamente", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const a = hire(G, s, "mechanic"),
    b = hire(G, s, "engineer");
  a.personality = "ambitious";
  b.personality = "independent";
  a.teamwork = b.teamwork = 40;
  const original = G.Staff.strength(s, s.playerId, "mechanic");
  daily(G, s, 60);
  assert.ok(s.staffing.bonds[0].value < -35);
  assert.ok(G.Staff.strength(s, s.playerId, "mechanic") < original);
  assert.equal(s.news.filter((n) => n.title.includes("Desacuerdos")).length, 1);
  assert.ok(a.memory.some((m) => m.text.includes("Tensión")));
  G.Storage.validate(s);
});
test("Convivencia: una relación compatible mejora la cohesión con el tiempo", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const a = hire(G, s, "mechanic"),
    b = hire(G, s, "trainer");
  a.personality = "calm";
  b.personality = "sociable";
  a.teamwork = b.teamwork = 80;
  const before = G.Staff.cohesion(s);
  daily(G, s, 60);
  assert.ok(G.Staff.cohesion(s) > before);
  assert.ok(s.staffing.bonds[0].value > 25);
  G.Storage.validate(s);
});
test("Motivación persistentemente baja permite dimitir, conservando las obligaciones", () => {
  const { G, s } = game(),
    e = hire(G, s, "trainer");
  e.motivation = 10;
  daily(G, s, 30);
  assert.equal(e.status, "available");
  assert.equal(e.companyId, null);
  assert.ok(e.memory.some((m) => m.text.includes("Dimisión")));
  G.Storage.validate(s);
});
test("Mercado laboral: nuevas candidaturas dependen de escasez, sin reponer al cargar", () => {
  const { G, s } = game();
  const id = s.companies[1].id,
    second = s.companies[2].id,
    third = s.companies[3].id;
  hire(G, s, "mechanic");
  hire(G, s, "mechanic", id);
  hire(G, s, "mechanic", second);
  hire(G, s, "mechanic", third);
  assert.equal(
    s.employees.filter((e) => e.role === "mechanic" && e.status === "available")
      .length,
    1,
  );
  daily(G, s, 60);
  assert.equal(
    s.employees.filter((e) => e.role === "mechanic" && e.status === "available")
      .length,
    2,
  );
  const before = json(s);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
  G.Staff.daily(s);
  assert.deepEqual(json(s), before);
});
test("IA de personal: paga contratos reales, comparte candidatos y respeta reserva financiera", () => {
  const { G, s } = game(),
    c = s.companies[1];
  s.day = 30;
  c.balance = 30000;
  const candidates = G.Staff.aiCandidates(s, c, G.AI.budget(s, c));
  assert.ok(candidates.length);
  candidates[0].run();
  assert.equal(G.Staff.owned(s, c.id).length, 1);
  assert.ok(
    G.Companies.monthly(s, c.id) >
      540 + G.ownedDrivers(s, c.id)[0].contract.salary,
  );
  c.balance = 100;
  assert.equal(G.Staff.aiCandidates(s, c, 30000).length, 0);
  G.Storage.validate(s);
});
test("Patrimonio y reserva incluyen obligaciones de personal", () => {
  const { G, s } = game();
  const e = hire(G, s, "mechanic"),
    before = G.Facilities.equity(s, s.playerId);
  e.contract.accrued = 50;
  e.contract.arrears = 80;
  assert.equal(G.Facilities.equity(s, s.playerId), before - 130);
  assert.equal(G.Staff.liability(s), 130);
});
test("IA conserva personal valioso y liquida contratos cuando debe reducir la nómina", () => {
  const { G, s } = game(),
    c = s.companies[1],
    e = hire(G, s, "mechanic", c.id);
  s.day = 310;
  c.balance = 30000;
  const end = e.contract.end,
    renew = G.Staff.aiCandidates(s, c, G.AI.budget(s, c)).find(
      (a) => a.action === "renovación de personal",
    );
  assert.ok(renew);
  renew.run();
  assert.equal(e.contract.end, end + 360);
  c.balance = G.Staff.releaseQuote(e) + 100;
  const adjust = G.Staff.aiCandidates(s, c, 0).find(
    (a) => a.action === "ajuste de personal",
  );
  assert.ok(adjust);
  adjust.run();
  assert.equal(e.companyId, null);
  assert.equal(c.balance, 100);
  G.Storage.validate(s);
});
test("La IA considera ampliar oficina cuando su plantilla especializada ha llenado las plazas", () => {
  const { G, s } = game(),
    c = s.companies[1];
  c.balance = 100000;
  hire(G, s, "mechanic", c.id);
  hire(G, s, "trainer", c.id);
  s.day = 60;
  const office = G.Facilities.aiCandidates(s, c, G.AI.budget(s, c)).find((a) =>
    a.reason.startsWith("Oficina de equipo"),
  );
  assert.ok(office);
  office.run();
  assert.equal(G.Facilities.site(s, c.id).project.key, "office");
  G.Storage.validate(s);
});
test("Bancarrota libera al profesional del encargo anterior y permite trabajar para otra compañía", () => {
  const { G, s } = game(),
    seller = s.companies[1],
    buyer = s.companies[2],
    e = hire(G, s, "mechanic", seller.id);
  G.Economy.job(s, seller.id);
  assert.equal(seller.job.staffSupport.employeeId, e.id);
  seller.balance = 0;
  seller.debtDays = 13;
  e.contract.arrears = 100;
  G.Economy.assess(s);
  assert.equal(seller.status, "bankrupt");
  assert.equal(seller.job.staffSupport, null);
  assert.equal(G.Staff.busy(s, e.id), false);
  G.Staff.offer(s, e.id, { salary: e.ask + 100, months: 12 }, buyer.id);
  assert.equal(
    G.Staff.plan(s, buyer.id, "repair", 2).staffSupport.employeeId,
    e.id,
  );
  G.Storage.validate(s);
});
test("Planificar y consultar no consume RNG ni cambia contratos, trabajos o plantilla", () => {
  const { G, s } = game();
  hire(G, s, "mechanic");
  const before = json(s);
  for (let i = 0; i < 10; i++) {
    G.Staff.plan(s, s.playerId, "repair", 2);
    G.Staff.strength(s, s.playerId, "mechanic");
    G.Staff.cohesion(s);
    G.Staff.monthly(s);
  }
  assert.deepEqual(json(s), before);
});
test("Migración auténtica 0.6: conserva carrera, almacén ampliado y estado final completo", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v6-race.json"),
      "utf8",
    ),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.deepEqual(json(s.race), old.race);
  assert.deepEqual(json(s.companies), old.companies);
  assert.deepEqual(json(s.expansion), old.expansion);
  assert.equal(s.rng, old.rng);
  assert.equal(s.sequence, old.sequence);
  while (!s.race.finished) G.Race.tick(s, 400);
  const rows = G.Race.finish(s);
  assert.deepEqual(
    json(rows),
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v6-results.json")),
    ),
  );
  const actual = json(s);
  delete actual.staffing;
  actual.employees = [];
  assert.deepEqual(
    actual,
    JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v6-finished.json")),
    ),
  );
  G.Storage.validate(s);
});
test("Validación rechaza duplicados, roles, contratos, salarios y datos de ojeo corruptos", () => {
  const { G, s } = game();
  hire(G, s, "scout");
  G.Staff.scout(s, G.Staff.owned(s)[0].id, s.drivers[0].id);
  for (const change of [
    (s) => s.employees.push(json(s.employees[0])),
    (s) => (s.employees[0].role = "unknown"),
    (s) => (s.employees[0].role = "constructor"),
    (s) => (s.staffing.negotiations = []),
    (s) => (s.employees[0].contributions = {}),
    (s) => (s.employees[0].skill = 101),
    (s) => (G.Staff.owned(s)[0].contract.salary = -1),
    (s) => (G.Staff.owned(s)[0].contract.arrears = -1),
    (s) => (s.staffing.assignments[0].report.lower = 100),
    (s) => (s.staffing.assignments[0].employeeId = "employee-999999"),
    (s) => (s.staffing.assignments[0].id = s.parts[0].id),
  ]) {
    const bad = json(s);
    change(bad);
    assert.throws(() => G.Storage.validate(bad));
  }
});
