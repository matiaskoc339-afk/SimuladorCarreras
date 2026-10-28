const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1162) {
  const { G } = engine();
  return { G, s: G.createGame("Aster Especialistas", "", seed) };
}
function hire(G, s, role, cid = s.playerId) {
  const e = s.employees
    .filter((e) => e.role === role && e.status === "available")
    .sort((a, b) => b.skill - a.skill)[0];
  const salary = Math.max(e.ask, G.Professionals.marketSalary(s, e)) + 100;
  assert.equal(
    G.Staff.offer(s, e.id, { salary, months: 12, bonus: 0 }, cid).accepted,
    true,
  );
  return e;
}
function pilot(G, s) {
  const d = s.drivers.find((d) => !d.companyId);
  G.Drivers.offer(s, d.id, d.ask, 12);
  return d;
}
function daily(G, s, n) {
  for (let i = 0; i < n; i++) {
    s.day++;
    G.Staff.daily(s);
  }
}
function race(G, s) {
  const d = pilot(G, s),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Race.register(s, e.id, d.id, car.id);
  G.Calendar.advance(s, e.day - s.day);
  G.Race.start(s, e.id);
  return {
    r: s.race,
    a: s.race.entrants.find((a) => a.companyId === s.playerId),
    d,
    car,
    e,
  };
}
function until(G, s, p, max = 15000) {
  for (let i = 0; i < max && !p(); i++) G.Race.tick(s, 1);
  assert.ok(p(), "La fase prevista debe alcanzarse.");
}
function pit(G, s, a, options = { compound: "hard" }) {
  G.RaceWeekend.requestPit(s, s.playerId, options);
  until(G, s, () => a.pit.phase === "box");
}
function action(G, s, name, wheel) {
  const m = s.race.entrants.find((a) => a.companyId === s.playerId).pit.manual;
  while (s.race.time + 0.0001 < m.readyAt) G.Race.tick(s, 1);
  return G.PitCrew.action(s, name, wheel);
}
function wheels(G, s) {
  action(G, s, "lift");
  for (let i = 0; i < 4; i++) {
    action(G, s, "select", i);
    for (let k = 0; k < 4; k++) action(G, s, "loosen");
    action(G, s, "remove");
    action(G, s, "fit");
    for (let k = 0; k < 4; k++) action(G, s, "tighten");
  }
  action(G, s, "lower");
  action(G, s, "check");
}
function training(G, s, options = {}) {
  const coach = hire(G, s, "trainer"),
    d = pilot(G, s),
    car = G.ownedCars(s)[0];
  return {
    coach,
    d,
    car,
    options: {
      driverId: d.id,
      coachId: coach.id,
      carId: car.id,
      laps: 3,
      intensity: "normal",
      focus: "control",
      ...options,
    },
  };
}
function completePractice(G, s) {
  while (G.Practice.active(s)) G.Practice.tick(s, 2000);
}

test("Niveles: cambian sueldo, eficacia y experiencia sin consumir el RNG de la compañía", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    p = G.Professionals.profile(s, e.id),
    before = json(s);
  G.Professionals.initialize(s);
  assert.deepEqual(json(s), before);
  p.level = 1;
  const cheap = G.Professionals.marketSalary(s, e),
    weak = G.Staff.strength(s, s.playerId, "mechanic");
  p.level = 10;
  assert.ok(G.Professionals.marketSalary(s, e) > cheap);
  assert.ok(G.Staff.strength(s, s.playerId, "mechanic") > weak);
  p.level = 1;
  p.xp = 224;
  G.Professionals.gain(s, e.id, 1);
  assert.equal(p.level, 2);
  assert.equal(p.xp, 0);
  assert.equal(s.rng, before.rng);
  assert.equal(s.sequence, before.sequence + 1);
  G.Storage.validate(s);
});
test("Descanso remunerado: recupera estrés, mantiene nómina y bloquea revisiones y apoyo", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    p = G.Professionals.profile(s, e.id);
  p.stress = 90;
  const salary = e.contract.salary;
  G.Professionals.rest(s, e.id, 3);
  assert.equal(G.Staff.strength(s, s.playerId, "mechanic"), 0);
  assert.throws(
    () => G.Professionals.reviewQuote(s, G.ownedCars(s)[0].id),
    /mecánico/,
  );
  daily(G, s, 1);
  assert.equal(p.stress, 78);
  assert.equal(e.contract.salary, salary);
  assert.ok(e.contract.accrued > 0);
  daily(G, s, 2);
  assert.ok(!G.Professionals.resting(s, e.id));
  assert.ok(G.Staff.strength(s, s.playerId, "mechanic") > 0);
  G.Storage.validate(s);
});
test("Aumento: negociación, rechazo y aceptación conservan salarios ya devengados", () => {
  const { G, s } = game(),
    e = hire(G, s, "engineer");
  daily(G, s, 2);
  const due = e.contract.accrued,
    d = G.Professionals.demand(s, e);
  assert.equal(
    G.Professionals.answerRaise(s, d.id, e.contract.salary).accepted,
    false,
  );
  const cash = G.player(s).balance;
  assert.equal(G.Professionals.answerRaise(s, d.id, d.salary).accepted, true);
  assert.equal(e.contract.accrued, due);
  assert.equal(G.player(s).balance, cash);
  assert.equal(e.contract.salary, d.salary);
  assert.throws(() => G.Professionals.answerRaise(s, d.id, d.salary));
  const d2 = G.Professionals.demand(s, e),
    morale = e.motivation;
  G.Professionals.answerRaise(s, d2.id, null);
  assert.ok(e.motivation < morale);
  G.Storage.validate(s);
});
test("Un ascenso mal pagado provoca una petición periódica; ignorarla perjudica la relación", () => {
  const { G, s } = game(),
    e = hire(G, s, "trainer"),
    p = G.Professionals.profile(s, e.id);
  e.contract.salary = 150;
  p.level = 10;
  daily(G, s, 90);
  const d = s.professional.demands.find(
    (d) => d.employeeId === e.id && d.status === "pending",
  );
  assert.ok(d);
  for (const o of s.professional.offers) o.roll = 0.999;
  const loyalty = e.loyalty;
  daily(G, s, 15);
  assert.equal(d.status, "ignored");
  assert.ok(e.loyalty < loyalty);
  G.Storage.validate(s);
});
test("Competencia: oferta real transfiere la misma persona, compensación y liquidación una sola vez", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    buyer = s.companies.find((c) => c.id !== s.playerId);
  buyer.balance = 100000;
  daily(G, s, 3);
  e.loyalty = 0;
  G.Professionals.profile(s, e.id).stress = 100;
  const o = G.Professionals.poach(s, e.id, buyer.id);
  o.roll = 0;
  const cash = G.player(s).balance,
    buyerCash = buyer.balance,
    due = e.contract.accrued;
  s.day = o.deadline;
  G.Professionals.resolveOffer(s, o);
  assert.equal(o.status, "accepted");
  assert.equal(e.companyId, buyer.id);
  assert.equal(e.contract.salary, o.salary);
  assert.equal(G.player(s).balance, cash + o.fee - due);
  assert.equal(buyer.balance, buyerCash - o.fee);
  assert.equal(s.employees.filter((x) => x.id === e.id).length, 1);
  const completed = json(s);
  G.Professionals.resolveOffer(s, o);
  assert.deepEqual(json(s), completed);
  G.Storage.validate(s);
});
test("Contraoferta y plaza ocupada: retener mejora sueldo; un traspaso inviable cancela sin mover dinero", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    buyer = s.companies.find((c) => c.id !== s.playerId);
  buyer.balance = 100000;
  let o = G.Professionals.poach(s, e.id, buyer.id);
  const cash = buyer.balance;
  G.Professionals.counterPoach(s, o.id, o.salary);
  assert.equal(o.status, "countered");
  assert.equal(e.companyId, s.playerId);
  assert.equal(buyer.balance, cash);
  o = G.Professionals.poach(s, e.id, buyer.id);
  o.roll = 0;
  hire(G, s, "mechanic", buyer.id);
  const before = json(s);
  G.Professionals.resolveOffer(s, o);
  assert.equal(o.status, "cancelled");
  assert.equal(
    G.player(s).balance,
    before.companies.find((c) => c.id === s.playerId).balance,
  );
  assert.equal(e.companyId, s.playerId);
  G.Storage.validate(s);
});
test("Ojeo en curso impide una oferta laboral; condiciones salariales desactualizadas se cancelan", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout"),
    buyer = s.companies.find((c) => c.id !== s.playerId);
  buyer.balance = 100000;
  const j = G.Staff.scout(s, e.id, s.drivers[0].id);
  assert.throws(() => G.Professionals.poach(s, e.id, buyer.id), /informe/);
  j.status = "cancelled";
  j.report = null;
  const o = G.Professionals.poach(s, e.id, buyer.id);
  o.salary = 150;
  const before = G.player(s).balance;
  G.Professionals.resolveOffer(s, o);
  assert.equal(o.status, "cancelled");
  assert.equal(G.player(s).balance, before);
  G.Storage.validate(s);
});
test("Diagnóstico obligatorio con mecánico; ingeniero aumenta precisión y el informe cobra una vez", () => {
  const { G, s } = game(),
    car = G.ownedCars(s)[0];
  assert.throws(() => G.Professionals.review(s, car.id), /mecánico/);
  const m = hire(G, s, "mechanic"),
    first = G.Professionals.reviewQuote(s, car.id);
  hire(G, s, "engineer");
  const q = G.Professionals.reviewQuote(s, car.id, true);
  assert.ok(q.accuracy > first.accuracy);
  assert.ok(q.cost > first.cost);
  const cash = G.player(s).balance,
    report = G.Professionals.review(s, car.id, true);
  assert.equal(report.accuracy, q.accuracy);
  assert.equal(G.player(s).balance, cash - q.cost);
  assert.equal(Object.keys(report.components).length, 7);
  const before = json(s);
  assert.throws(() => G.Professionals.review(s, car.id), /hoy/);
  assert.deepEqual(json(s), before);
  assert.ok(G.Professionals.profile(s, m.id).xp > 0);
  G.Storage.validate(s);
});
test("El ajuste de manejo se utiliza en la física de una carrera nueva y caduca", () => {
  const { G, s } = game(),
    car = G.ownedCars(s)[0];
  hire(G, s, "mechanic");
  G.Professionals.review(s, car.id, true);
  const effect = s.professional.setups[car.id].effect;
  const { a } = race(G, s);
  assert.equal(a.grip, car.grip * (1 + effect));
  G.Storage.validate(s);
});
test("El porcentaje del informe está calibrado: 80 % cubre el potencial unas ocho de cada diez veces", () => {
  const { G, s } = game();
  let accurate = 0;
  for (let i = 0; i < 3000; i++) {
    const r = G.Professionals.estimate(s, 78, 80, 7);
    if (r.lower <= 78 && r.upper >= 78) accurate++;
  }
  assert.ok(
    accurate > 2300 && accurate < 2500,
    `${accurate}/3000 informes acertados`,
  );
});
test("CVs periódicos: añaden pilotos reales, calidad por nivel e informes persistentes sin duplicar", () => {
  const low = game(),
    high = game();
  let ratings = [];
  for (const { G, s } of [low, high]) {
    const e = hire(G, s, "scout"),
      p = G.Professionals.profile(s, e.id);
    p.level = ratings.length ? 10 : 1;
    s.day = 20;
    const count = s.drivers.length,
      rng = s.rng;
    G.Professionals.autoCV(s, e);
    assert.equal(s.drivers.length, count + 1);
    assert.equal(s.rng, rng);
    const cv = s.professional.cvs[0],
      d = s.drivers.find((d) => d.id === cv.driverId);
    assert.ok(d && !d.companyId);
    ratings.push(G.Drivers.rating(d));
    const before = json(s);
    G.Professionals.autoCV(s, e);
    assert.deepEqual(json(s), before);
    assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), before);
  }
  assert.ok(ratings[1] > ratings[0] + 20);
});
test("Ojeador descansando no entrega CV; currículum antiguo caduca conservando identidad e historial", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout");
  s.day = 20;
  G.Professionals.rest(s, e.id, 3);
  G.Professionals.autoCV(s, e);
  assert.equal(s.professional.cvs.length, 0);
  s.day = 23;
  G.Professionals.autoCV(s, e);
  const cv = s.professional.cvs[0],
    d = s.drivers.find((d) => d.id === cv.driverId);
  s.day = 114;
  G.Professionals.daily(s);
  assert.ok(!G.Professionals.available(s, d));
  assert.ok(s.drivers.includes(d));
  assert.throws(() => G.Drivers.offer(s, d.id, d.ask, 12), /caducado/);
  G.Storage.validate(s);
});
test("Sin mecánico, siempre hay boxes manuales: el jugador se detiene y sus rivales continúan", () => {
  const { G, s } = game(),
    { r, a } = race(G, s);
  pit(G, s, a);
  assert.equal(a.pit.manual.reason, "no-mechanic");
  const own = a.progress,
    rival = r.entrants.find((b) => b !== a && !b.dnf && b.finishTime === null),
    progress = rival.progress;
  G.Race.tick(s, 100);
  assert.equal(a.progress, own);
  assert.ok(rival.progress > progress);
  assert.equal(a.speed, 0);
  G.Storage.validate(s);
});
test("Cambio manual: secuencia de cuatro ruedas, errores, seguridad, salida real y un solo cobro", () => {
  const { G, s } = game(),
    { a } = race(G, s);
  const cash = G.player(s).balance;
  pit(G, s, a);
  const paid = G.player(s).balance;
  assert.ok(paid < cash);
  assert.equal(action(G, s, "remove"), false);
  assert.equal(a.pit.manual.errors, 1);
  wheels(G, s);
  assert.equal(a.pit.manual.phase, "done");
  G.Storage.validate(s);
  until(G, s, () => a.pit.phase === "exit");
  G.Storage.validate(s);
  until(G, s, () => a.pit.phase === "none");
  assert.equal(a.pitStops, 1);
  assert.equal(a.compound, "hard");
  assert.equal(G.player(s).balance, paid);
  G.Storage.validate(s);
});
test("Guardar a mitad del minijuego reproduce las ruedas, los tiempos y la carrera exactamente", () => {
  const { G, s } = game(),
    { a } = race(G, s);
  pit(G, s, a);
  action(G, s, "lift");
  action(G, s, "loosen");
  action(G, s, "loosen");
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.deepEqual(json(copy), json(s));
  G.Race.tick(s, 400);
  G.Race.tick(copy, 400);
  assert.deepEqual(json(copy), json(s));
  assert.throws(() => G.PitCrew.action(s, "select", 7), /Rueda/);
  const corrupt = json(s);
  corrupt.race.entrants.find(
    (a) => a.companyId === s.playerId,
  ).pit.manual.phase = "done";
  assert.throws(() => G.Storage.validate(corrupt), /ruedas sueltas/);
});
test("Nivel y velocidad individuales gobiernan boxes; novato falla y experto puede atender automáticamente", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic"),
    p = G.Professionals.profile(s, e.id);
  p.level = 1;
  const novice = G.PitCrew.member(s, s.playerId, "mechanic");
  p.level = 10;
  const expert = G.PitCrew.member(s, s.playerId, "mechanic");
  assert.ok(G.PitCrew.accuracy(expert) > G.PitCrew.accuracy(novice));
  assert.ok(G.PitCrew.serviceFactor(expert) < G.PitCrew.serviceFactor(novice));
  assert.ok(
    G.PitCrew.serviceFactor({ ...expert, speed: 90 }) <
      G.PitCrew.serviceFactor({ ...expert, speed: 50 }),
  );
  const { r, a } = race(G, s);
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard" });
  until(G, s, () => a.pit.phase === "entry");
  const random = G.random;
  G.random = (x) => (x === r ? 0 : random(x));
  until(G, s, () => a.pit.phase === "box");
  G.random = random;
  assert.equal(a.pit.manual, undefined);
  until(G, s, () => a.pit.phase === "none");
  assert.equal(a.pitStops, 1);
  G.Storage.validate(s);
  const second = game(1163),
    m = hire(second.G, second.s, "mechanic");
  second.G.Professionals.profile(second.s, m.id).level = 1;
  const grid = race(second.G, second.s);
  second.G.RaceWeekend.requestPit(second.s, second.s.playerId, {
    compound: "hard",
  });
  until(second.G, second.s, () => grid.a.pit.phase === "entry");
  const rng = second.G.random;
  second.G.random = (x) => (x === grid.r ? 0.999 : rng(x));
  until(second.G, second.s, () => grid.a.pit.phase === "box");
  second.G.random = rng;
  assert.equal(grid.a.pit.manual.reason, "failure");
  second.G.Storage.validate(second.s);
});
test("Sanción de boxes: el nivel del mecánico nunca descuenta los cinco segundos reglamentarios", () => {
  const { G, s } = game(),
    e = hire(G, s, "mechanic");
  G.Professionals.profile(s, e.id).level = 10;
  const { r, a } = race(G, s);
  a.unservedPenalty = 5;
  a.totalPenalty = 5;
  G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard" });
  until(G, s, () => a.pit.phase === "entry");
  const rng = G.random;
  G.random = (x) => (x === r ? 0 : rng(x));
  until(G, s, () => a.pit.phase === "box");
  G.random = rng;
  assert.ok(a.pit.remaining >= 5);
  const start = r.time;
  until(G, s, () => a.pit.phase === "exit");
  assert.ok(r.time - start >= 4.99);
  G.Storage.validate(s);
});
test("Estratega automático: orden contextual, menor estrés y prioridad temporal de órdenes manuales", () => {
  const { G, s } = game(),
    e = hire(G, s, "strategist");
  G.Professionals.profile(s, e.id).level = 10;
  const { r, a } = race(G, s);
  a.professional.driverStress = 50;
  a.fuel = 0.5;
  const rng = G.random;
  G.random = (x) => (x === r ? 0.99 : rng(x));
  G.PitCrew.decide(s, r);
  G.random = rng;
  assert.equal(a.mode, "fuel");
  assert.equal(a.pit.phase, "queued");
  assert.ok(a.professional.driverStress < 50);
  G.RaceWeekend.cancelPit(s);
  G.Race.order(s, "attack");
  assert.equal(a.professional.manualUntil, r.time + 30);
  G.PitCrew.decide(s, r);
  assert.equal(a.mode, "attack");
  a.professional.auto = false;
  r.time += 31;
  G.PitCrew.decide(s, r);
  assert.equal(a.mode, "attack");
  G.Storage.validate(s);
});
test("Entrenamiento: la previsión muestra más riesgo por estrés y menos con entrenador experto descansado", () => {
  const { G, s } = game(),
    x = training(G, s, { laps: 20, intensity: "hard" }),
    p = G.Professionals.profile(s, x.coach.id),
    care = G.Professionals.care(s, x.d.id);
  care.stress = 90;
  x.d.fatigue = 85;
  p.level = 1;
  const novice = G.Practice.quote(s, x.options);
  p.level = 10;
  const expert = G.Practice.quote(s, x.options);
  assert.ok(expert.incidentRisk < novice.incidentRisk);
  assert.ok(expert.stressPerLap < novice.stressPerLap);
  p.stress = 100;
  assert.ok(G.Practice.quote(s, x.options).incidentRisk > expert.incidentRisk);
  care.stress = 0;
  x.d.fatigue = 0;
  assert.ok(G.Practice.quote(s, x.options).incidentRisk < expert.incidentRisk);
  G.Storage.validate(s);
});
test("Pista de entrenamiento real: vueltas, mejora, desgaste, kilometraje, coste y una jornada sin premios", () => {
  const { G, s } = game(),
    x = training(G, s),
    stat = x.d.stats.control,
    km = x.car.km,
    condition = x.car.condition,
    cash = G.player(s).balance;
  const j = G.Practice.start(s, x.options);
  assert.equal(G.player(s).balance, cash - 80);
  G.Practice.tick(s, 100);
  assert.ok(j.a.progress > 0);
  assert.ok(j.a.speed > 0);
  assert.throws(() => G.Calendar.advance(s, 1), /entrenamiento/);
  assert.throws(() => G.Drivers.release(s, x.d.id), /entrenamiento/);
  assert.throws(
    () => G.Market.list(s, x.car.id, G.Market.value(x.car)),
    /inscripción/,
  );
  assert.throws(() => G.Staff.release(s, x.coach.id), /trabajo/);
  completePractice(G, s);
  assert.equal(j.completed, 3);
  assert.equal(j.lapTimes.length, 3);
  assert.ok(x.d.stats.control > stat);
  assert.ok(x.car.km > km);
  assert.ok(x.car.condition < condition);
  assert.equal(s.day, 1);
  assert.equal(s.season.events.flatMap((e) => e.results).length, 0);
  assert.ok(G.Professionals.profile(s, x.coach.id).xp > 0);
  G.Storage.validate(s);
});
test("Guardar entrenamiento en marcha conserva física y resultado; interrumpir conserva gastos y desgaste", () => {
  const { G, s } = game(),
    x = training(G, s),
    cash = G.player(s).balance;
  const j = G.Practice.start(s, x.options);
  G.Practice.tick(s, 1000);
  const loaded = G.Storage.unpack(G.Storage.pack(s)).state;
  completePractice(G, s);
  completePractice(G, loaded);
  assert.deepEqual(json(loaded), json(s));
  const other = game(),
    y = training(other.G, other.s),
    km = y.car.km;
  other.G.Practice.start(other.s, y.options);
  other.G.Practice.tick(other.s, 1000);
  const paid = other.G.player(other.s).balance;
  const done = other.G.Practice.finish(other.s, "cancelled");
  assert.equal(done.status, "cancelled");
  assert.ok(y.car.km > km);
  assert.equal(other.s.day, 1);
  assert.equal(other.G.player(other.s).balance, paid - 18);
  other.G.Storage.validate(other.s);
});
for (const severe of [false, true])
  test(`Accidente de entrenamiento: ${severe ? "fin de carrera deportiva" : "lesión y recuperación"}, bloqueo médico y retirada de inscripción`, () => {
    const { G, s } = game(severe ? 1170 : 1171),
      x = training(G, s);
    G.Professionals.care(s, x.d.id).stress = 100;
    const ev = G.nextEvent(s);
    G.Race.register(s, ev.id, x.d.id, x.car.id, { compound: "hard" });
    const set = s.raceSupplies.sets.find((t) => t.status === "reserved");
    x.d.fatigue = 100;
    const j = G.Practice.start(s, x.options);
    j.a.progress = G.Data.tracks[0].length - 0.01;
    j.a.speed = 40;
    const random = G.random;
    let rolls = 0;
    G.random = (z) =>
      z === j ? (++rolls === 1 ? 0 : severe ? 0 : 0.99) : random(z);
    G.Practice.tick(s, 1);
    G.random = random;
    const care = G.Professionals.care(s, x.d.id);
    assert.equal(j.incident, severe ? "career-end" : "injury");
    assert.equal(care.retired, severe);
    assert.ok(!G.Professionals.fit(s, x.d.id));
    assert.equal(ev.entry, null);
    assert.equal(set.status, "stored");
    assert.throws(
      () => G.Race.register(s, ev.id, x.d.id, x.car.id),
      /recuper|disponible|apto|lesionado/,
    );
    assert.throws(() => G.Drivers.train(s, x.d.id, "pace"), /recuper/);
    if (!severe) {
      s.day = care.injuryUntil;
      assert.ok(G.Professionals.fit(s, x.d.id));
    } else {
      s.day += 100;
      assert.ok(!G.Professionals.fit(s, x.d.id));
    }
    G.Storage.validate(s);
  });
test("Migración auténtica 0.6.1 en boxes: mantiene apoyo antiguo, resultado y estado completo exactos", () => {
  const { G } = engine(),
    fixture = (name) =>
      fs.readFileSync(path.join(__dirname, "fixtures/" + name), "utf8"),
    raw = fixture("v61-race.json"),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.deepEqual(json(s.race), old.race);
  assert.equal(s.race.professionalVersion, undefined);
  assert.equal(s.rng, old.rng);
  assert.equal(s.sequence, old.sequence);
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(fixture("v61-results.json")),
  );
  const actual = json(s);
  delete actual.operations;
  actual.employees = actual.employees.filter(
    (e) => !e.id.startsWith("specialist-"),
  );
  delete actual.professional;
  assert.deepEqual(actual, JSON.parse(fixture("v61-finished.json")));
  G.Storage.validate(s);
});
test("Validación rechaza perfiles, salarios, informes, atención médica y sesiones corruptos", () => {
  const { G, s } = game(),
    x = training(G, s);
  G.Practice.start(s, x.options);
  const original = json(s);
  for (const corrupt of [
    (s) => (s.professional.profiles[x.coach.id].level = 11),
    (s) => (s.professional.profiles[x.coach.id].stress = -1),
    (s) => delete s.professional.drivers[x.d.id],
    (s) => (s.professional.drivers[x.d.id].retired = "si"),
    (s) => (s.professional.practices[0].coachAbility = NaN),
    (s) => (s.professional.practices[0].a.components.engine = -1),
    (s) => (s.professional.practices[0].a.thermal = NaN),
    (s) => delete s.professional.practices[0].a.stats.control,
    (s) => s.professional.practices.push(json(s.professional.practices[0])),
  ]) {
    const copy = json(original);
    corrupt(copy);
    assert.throws(() => G.Storage.validate(copy));
  }
});

test("Entrenar no rebaja un atributo que ya supera el potencial y no permite liquidar dos veces", () => {
  const { G, s } = game(),
    x = training(G, s);
  x.d.stats.control = 90;
  x.d.potential = 80;
  const j = G.Practice.start(s, x.options);
  completePractice(G, s);
  assert.equal(x.d.stats.control, 90);
  assert.equal(j.gain, 0);
  const before = json(s);
  assert.throws(() => G.Practice.finish(s));
  assert.deepEqual(json(s), before);
  G.Storage.validate(s);
});

test("Un piloto descubierto que ya fue contratado puede volver como agente libre sin caducar por su antiguo CV", () => {
  const { G, s } = game(),
    e = hire(G, s, "scout");
  s.day = 20;
  G.Professionals.autoCV(s, e);
  const d = s.drivers.find((d) => d.id === s.professional.cvs[0].driverId);
  G.Drivers.offer(s, d.id, d.ask, 12);
  G.Drivers.release(s, d.id);
  assert.equal(G.Professionals.care(s, d.id).recruited, true);
  s.day = 114;
  G.Professionals.daily(s);
  assert.ok(G.Professionals.available(s, d));
  G.Storage.validate(s);
});
