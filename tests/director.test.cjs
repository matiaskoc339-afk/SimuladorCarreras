const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ director: true });
  return { G, s: G.createGame("Equipo con criterio", "", seed) };
}
function hire(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  let q = G.Drivers.offer(s, d.id, d.ask, 12);
  if (!q.accepted) q = G.Drivers.offer(s, d.id, q.salary, 12);
  assert.equal(q.accepted, true);
  return d;
}
function race(seed = 1470) {
  const { G, s } = game(seed);
  G.player(s).balance = 100000;
  const d = hire(G, s);
  G.Calendar.advance(s, G.nextEvent(s).day);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  const r = G.Race.start(s, e.id),
    a = r.entrants.find((a) => a.companyId === s.playerId);
  return { G, s, d, r, a };
}
function answer(G, s) {
  for (
    let n = 0;
    n < 150 &&
    s.race.entrants.find((a) => a.companyId === s.playerId).radio.pending;
    n++
  )
    G.Race.tick(s, 1);
}

test("La actualización conserva dinero, contratos, resultados, aleatoriedad y carrera histórica", () => {
  const { G } = engine({ life: true }),
    s = G.createGame("Existente", "", 1470),
    before = JSON.stringify(s);
  G.DriverAgency.initialize(s);
  const copy = json(s);
  delete copy.driverAgency;
  assert.deepEqual(copy, JSON.parse(before));
  assert.equal(G.DriverAgency.enabled(s), true);
  G.Storage.validate(s);
  const raw = JSON.stringify(s),
    d = s.drivers.find((d) => !d.companyId);
  G.DriverAgency.persona(s, d);
  G.DriverAgency.value(s, d, d.ask, 3, 0, G.Contracts.driverTerms(s, 3));
  assert.equal(JSON.stringify(s), raw);
});
test("Personalidades negocian duración, rol, primas y oportunidades de forma distinta", () => {
  const { G, s } = game(),
    candidates = s.drivers;
  const ambitious = candidates.find(
      (d) => G.DriverAgency.persona(s, d).ambition > 70,
    ),
    humble = candidates.find(
      (d) => G.DriverAgency.persona(s, d).name === "Humilde",
    );
  assert.ok(ambitious && humble);
  for (const d of [ambitious, humble]) {
    const short = G.DriverAgency.value(
        s,
        d,
        d.ask,
        3,
        0,
        G.Contracts.driverTerms(s, 3),
      ),
      long = G.DriverAgency.value(
        s,
        d,
        d.ask,
        24,
        0,
        G.Contracts.driverTerms(s, 24),
      );
    if (d === ambitious) assert.ok(long.floor > short.floor);
    else assert.ok(long.floor < short.floor);
    const reserve = G.DriverAgency.value(
      s,
      d,
      d.ask,
      3,
      0,
      G.Contracts.driverTerms(s, 3, { role: "reserva" }),
    );
    assert.ok(reserve.floor >= short.floor);
    const bonus = G.DriverAgency.value(
      s,
      d,
      d.ask,
      3,
      300,
      G.Contracts.driverTerms(s, 3),
    );
    assert.ok(bonus.floor < short.floor);
    const promises = G.DriverAgency.value(
      s,
      d,
      d.ask,
      3,
      0,
      G.Contracts.driverTerms(s, 3, { promiseShare: 1 }),
    );
    assert.ok(promises.floor <= short.floor);
    const fulfilled = G.Contracts.driverTerms(s, 3, { promiseShare: 1 });
    fulfilled.settled = true;
    assert.equal(
      G.DriverAgency.value(s, d, d.ask, 3, 0, fulfilled).floor,
      short.floor,
      "Una promesa ya liquidada no compra otro descuento al renovar",
    );
  }
});
test("Una contraoferta se mueve ante una mejora; repetir el mismo importe no extrae concesiones", () => {
  const { G, s } = game(),
    d = s.drivers
      .filter((d) => !d.companyId)
      .sort((a, b) => b.ask - a.ask)
      .find((d) => G.Challenge.driverLevel(d) <= 1),
    terms = {
      role: "principal",
      releaseMonths: 1,
      promiseShare: 0,
      winBonus: 0,
      renewalOption: false,
    };
  const q = G.DriverAgency.value(
    s,
    d,
    d.ask,
    3,
    0,
    G.Contracts.driverTerms(s, 3, terms),
  );
  const first = Math.max(10, Math.ceil(q.floor * 0.9)),
    a = G.Drivers.offer(s, d.id, first, 3, 0, terms);
  assert.equal(a.accepted, false);
  const b = G.Drivers.offer(s, d.id, first, 3, 0, terms);
  assert.equal(b.salary, a.salary);
  const c = G.Drivers.offer(
    s,
    d.id,
    Math.min(q.floor - 1, first + 2),
    3,
    0,
    terms,
  );
  assert.equal(c.accepted, false);
  assert.ok(c.salary < a.salary);
  assert.equal(s.negotiations[d.id].conversation.length, 3);
  const balance = G.player(s).balance,
    accepted = G.Drivers.offer(s, d.id, c.salary, 3, 0, terms);
  assert.equal(accepted.accepted, true);
  assert.equal(G.player(s).balance, balance);
  G.Storage.validate(s);
});
test("Insultos reiterados paran la conversación; recargar conserva la pausa y ninguna consulta gasta RNG", () => {
  const { G, s } = game(),
    d = s.drivers
      .filter((d) => !d.companyId && G.Challenge.driverLevel(d) <= 1)
      .sort((a, b) => b.ask - a.ask)[0];
  G.Drivers.offer(s, d.id, 10, 3);
  const q = G.Drivers.offer(s, d.id, 10, 3);
  assert.equal(q.cooldown, true);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.throws(() => G.Drivers.offer(restored, d.id, q.salary, 3), /esperar/);
  assert.equal(restored.negotiations[d.id].cooldown, s.day + 7);
});
test("Una prima o una cláusula de victorias no compra un sueldo irrisorio ni gasta al ser rechazada", () => {
  const { G, s } = game(),
    d = s.drivers
      .filter((d) => !d.companyId && G.Challenge.driverLevel(d) <= 1)
      .sort((a, b) => b.ask - a.ask)[0],
    cash = G.player(s).balance;
  const q = G.Drivers.offer(s, d.id, 10, 24, 1000, { winBonus: 1500 });
  assert.equal(q.accepted, false);
  assert.equal(G.player(s).balance, cash);
  assert.equal(d.companyId, null);
});
test("Ganar sin cobrar lo justo provoca una petición explicada, no un cambio automático de sueldo", () => {
  const { G, s } = game(),
    d = hire(G, s),
    p = G.DriverAgency.profile(s, d),
    salary = d.contract.salary;
  // Controlled management fixture: isolate an actual review threshold, not race balance.
  s.day = 42;
  d.wins += 4;
  d.starts += 4;
  d.stats.pace += 8;
  d.stats.control += 8;
  d.stats.brakes += 8;
  d.stats.consistency += 8;
  p.recent = Array.from({ length: 4 }, (_, i) => ({
    eventId: `controlled-${i}`,
    day: 14 + i * 7,
    position: 1,
    field: 8,
    cup: "street",
    dnf: false,
  }));
  G.DriverAgency.review(s, d);
  assert.equal(p.demand.status, "pending");
  assert.ok(p.demand.salary > salary);
  assert.match(p.demand.reason, /4 victorias.*referencia/);
  assert.equal(d.contract.salary, salary);
  const request = json(p.demand);
  G.DriverAgency.review(s, d);
  assert.deepEqual(json(p.demand), request);
  G.player(s).balance = 100000;
  const end = d.contract.end,
    k = JSON.stringify(d.contract.clauses);
  const result = G.DriverAgency.answer(s, d.id, request.salary);
  assert.equal(result.accepted, true);
  assert.equal(d.contract.end, end);
  assert.equal(JSON.stringify(d.contract.clauses), k);
  assert.equal(p.demand.status, "accepted");
  assert.equal(p.wins, d.wins);
  assert.equal(G.player(s).balance, 100000);
});
test("Ignorar o rechazar el aumento afecta moral, confianza y futuras negociaciones; nunca rompe el contrato", () => {
  const { G, s } = game(),
    d = hire(G, s),
    p = G.DriverAgency.profile(s, d);
  s.day = 90;
  d.stats.pace += 12;
  d.stats.control += 12;
  d.stats.brakes += 12;
  d.stats.consistency += 12;
  G.DriverAgency.review(s, d);
  assert.ok(p.demand);
  const before = G.DriverAgency.value(
      s,
      d,
      d.contract.salary,
      6,
      0,
      null,
    ).floor,
    morale = d.morale,
    contract = json(d.contract);
  G.DriverAgency.answer(s, d.id, null);
  assert.ok(d.morale < morale);
  assert.ok(p.loyalty < 60);
  assert.deepEqual(json(d.contract), contract);
  assert.ok(
    G.DriverAgency.value(s, d, d.contract.salary, 6, 0, null).floor > before,
  );
  G.DriverAgency.review(s, d);
  assert.equal(p.demand.status, "refused");
});
test("Renovar permite contraofertar y respeta la opción contractual del 3 %", () => {
  const { G, s } = game(),
    d = hire(G, s);
  s.day = d.contract.end - 30;
  const before = d.contract.end;
  let q = G.Contracts.renewDriver(s, d.id, d.contract.salary, 6);
  assert.equal(q.accepted, false);
  q = G.Contracts.renewDriver(s, d.id, q.salary, 6);
  assert.equal(q.accepted, true);
  assert.equal(d.contract.end, before + 180);
  const { G: H, s: t } = game(1580),
    e = t.drivers.filter((d) => !d.companyId).sort((a, b) => a.ask - b.ask)[0];
  let r = H.Drivers.offer(t, e.id, e.ask, 3, 0, { renewalOption: true });
  if (!r.accepted)
    H.Drivers.offer(t, e.id, r.salary, 3, 0, { renewalOption: true });
  t.day = e.contract.end - 20;
  const salary = Math.ceil(e.contract.salary * 1.03);
  r = H.Contracts.renewDriver(t, e.id, salary, 6);
  assert.equal(r.accepted, true);
  assert.equal(e.contract.salary, salary);
  assert.equal(e.contract.clauses.renewalUsed, true);
});
test("Órdenes combinadas esperan respuesta, sobreviven la recarga y tienen prioridad durante el plazo elegido", () => {
  const { G, s, r, a } = race();
  a.stats.focus = a.stats.teamwork = a.stats.discipline = 100;
  const p = {
      pace: 73,
      risk: 32,
      tires: 81,
      fuel: 52,
      tactic: "inside",
      duration: 120,
    },
    before = json(a.directive);
  G.Race.order(s, p);
  assert.deepEqual(json(a.directive), before);
  assert.match(a.radio.pending.text, /Ritmo 73/);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  answer(G, s);
  answer(G, restored);
  assert.deepEqual(json(s), json(restored));
  assert.equal(a.radio.last.status, "accepted");
  assert.deepEqual(json(a.directive.plan), p);
  assert.ok(a.professional.manualUntil > r.time + 110);
  G.Storage.validate(s);
});
test("Bandera amarilla rechaza también el ataque personalizado; ningún ajuste queda aplicado en silencio", () => {
  const { G, s, r, a } = race();
  a.stats.focus = a.stats.teamwork = a.stats.discipline = 100;
  G.Race.caution(r, a.progress, 20);
  const old = json(a.directive);
  G.Race.order(s, { pace: 90, risk: 80, tactic: "outside", duration: 30 });
  answer(G, s);
  assert.equal(a.radio.last.status, "deferred");
  assert.match(a.radio.last.text, /amarilla|VSC/);
  assert.deepEqual(json(a.directive), old);
});
test("Las órdenes caducan en segundos de carrera y hasta nueva orden se mantiene", () => {
  const { G, s, r, a } = race();
  a.stats.focus = a.stats.teamwork = a.stats.discipline = 100;
  G.Race.order(s, {
    pace: 40,
    risk: 20,
    tires: 75,
    fuel: 20,
    tactic: "clean",
    duration: 30,
  });
  answer(G, s);
  assert.equal(a.directive.manual, true);
  const stop = a.directive.until;
  while (r.time <= stop + 0.1) G.Race.tick(s, 1);
  assert.equal(a.directive.manual, false);
  assert.equal(a.directive.preset, "balanced");
  G.Race.order(s, {
    pace: 40,
    risk: 20,
    tires: 75,
    fuel: 20,
    tactic: "clean",
    duration: 0,
  });
  answer(G, s);
  G.Race.tick(s, 700);
  assert.equal(a.directive.manual, true);
  assert.equal(a.directive.until, 1e8);
  G.Storage.validate(s);
});
test("Ritmo, riesgo, gomas y combustible cambian costes físicos sin superar los límites del coche", () => {
  const { G, s, r, a } = race();
  a.directive.plan = G.RaceDirector.plan({
    pace: 90,
    risk: 90,
    tires: 10,
    fuel: 0,
  });
  const wearHigh = G.Rubber.wearRate(a),
    errorsHigh = G.Race.errorRate(a, 0.8, 1),
    fuelHigh = G.RaceDirector.fuel(a);
  a.directive.plan = G.RaceDirector.plan({
    pace: 20,
    risk: 10,
    tires: 90,
    fuel: 90,
  });
  assert.ok(G.Rubber.wearRate(a) < wearHigh * 0.6);
  assert.ok(G.Race.errorRate(a, 0.8, 1) < errorsHigh * 0.4);
  assert.ok(G.RaceDirector.fuel(a) < fuelHigh * 0.7);
  const old = a.fuel;
  G.RaceWeekend.moved(s, r, a, 100, 0.05);
  const delta = old - a.fuel;
  const b = json(a);
  b.fuel = old;
  b.directive.plan.fuel = 0;
  G.RaceWeekend.moved(s, r, b, 100, 0.05);
  assert.ok(delta < old - b.fuel);
  const raw = JSON.stringify(s);
  assert.throws(() => G.Race.order(s, { pace: 101 }), /entre 0 y 100/);
  assert.equal(JSON.stringify(s), raw);
});
test("Un piloto experto juzga mejor un hueco que un novato y conserva el margen físico y lateral", () => {
  const { G, r, a } = race(),
    front = json(r.entrants.find((b) => b.carId !== a.carId)),
    context = {
      front: { b: front, gap: 20 },
      rear: null,
      corner: 0.2,
      yellow: false,
      curve: 0,
    };
  a.progress = 100;
  a.speed = 30;
  front.progress = 120;
  front.speed = 30.25;
  a.brain.speedCeiling = 60;
  a.directive.manual = true;
  a.directive.until = 1e8;
  a.directive.plan = G.RaceDirector.plan({
    pace: 70,
    risk: 20,
    tactic: "auto",
  });
  for (const k of ["overtake", "focus", "control", "brakes"]) a.stats[k] = 10;
  a.brain.experience = 0;
  front.stats.brakes = 10;
  let result = G.RaceDirector.decide(
    r,
    a,
    context,
    { target: 50, lateral: 2, passing: true },
    [a, front],
  );
  assert.equal(result.passing, false);
  assert.match(a.brain.intent, /Espera/);
  for (const k of ["overtake", "focus", "control", "brakes"]) a.stats[k] = 90;
  a.brain.experience = 18;
  result = G.RaceDirector.decide(
    r,
    a,
    context,
    { target: 1000, lateral: 2, passing: true },
    [a, front],
  );
  assert.equal(result.passing, true);
  assert.ok(result.target <= a.brain.speedCeiling);
  assert.ok(Math.abs(result.lateral) < r.trackWidth / 2);
});
test("Una maniobra solicitada nunca atraviesa un carril ocupado ni autoriza adelantar con amarilla", () => {
  const { G, r, a } = race(),
    front = json(r.entrants.find((b) => b.carId !== a.carId));
  a.progress = 100;
  a.speed = 32;
  a.brain.speedCeiling = 60;
  a.directive.manual = true;
  a.directive.until = 1e8;
  a.directive.plan = G.RaceDirector.plan({
    pace: 80,
    risk: 90,
    tactic: "inside",
  });
  front.progress = 120;
  front.speed = 28;
  front.lateral = 0;
  const side =
      Math.sign(G.Racecraft.sample(r.track, a.progress + 40).curvature) ||
      a.brain.side,
    blocker = json(front);
  blocker.carId = "blocking-car";
  blocker.progress = 105;
  blocker.lateral = side * ((a.width + front.width) / 2 + 0.7);
  const c = {
    front: { b: front, gap: 20 },
    rear: null,
    corner: 0.5,
    yellow: false,
    curve: 0.1,
  };
  let q = G.RaceDirector.decide(
    r,
    a,
    c,
    { target: 50, lateral: -2, passing: true },
    [a, front, blocker],
  );
  assert.equal(q.passing, false);
  assert.match(a.brain.intent, /ocupado/);
  c.yellow = true;
  q = G.RaceDirector.decide(
    r,
    a,
    c,
    { target: 50, lateral: 0, passing: true },
    [a, front],
  );
  assert.equal(q.passing, false);
});
test("La validación rechaza planes, conversaciones y peticiones salariales manipuladas", () => {
  const { G, s, a } = race();
  a.directive.plan.risk = 1000;
  assert.throws(() => G.Storage.validate(s), /entre 0 y 100/);
  a.directive.plan.risk = 50;
  G.Storage.validate(s);
  const { G: H, s: t } = game(),
    d = t.drivers.find((d) => !d.companyId);
  H.Drivers.offer(t, d.id, 10, 3);
  t.negotiations[d.id].salary = Infinity;
  assert.throws(() => H.Storage.validate(t), /Conversación contractual/);
});
test("El estratega mantiene su plan entre decisiones, vuelve a equilibrado y respeta órdenes largas aun pidiendo boxes", () => {
  const { G, s, r, a } = race();
  // Isolate the strategy bridge from its probabilistic decision interval.
  a.professional.strategist = {
    id: s.employees.find((e) => e.role === "strategist").id,
    level: 5,
    stress: 0,
    speed: 70,
    skill: 65,
  };
  a.professional.auto = true;
  a.professional.nextDecision = 1e6;
  a.professional.manualUntil = 0;
  a.brain.mind.strategistMode = "attack";
  G.PitCrew.decide(s, r);
  assert.equal(a.directive.preset, "attack");
  assert.equal(a.mode, "balanced");
  G.PitCrew.decide(s, r);
  assert.equal(a.directive.preset, "attack");
  a.brain.mind.strategistMode = "balanced";
  G.PitCrew.decide(s, r);
  assert.equal(a.directive.preset, "balanced");
  a.directive = {
    plan: G.RaceDirector.plan({ pace: 45, risk: 20, duration: 120 }),
    preset: null,
    until: r.time + 120,
    manual: true,
  };
  a.professional.manualUntil = r.time + 45;
  G.PitCrew.decide(s, r);
  assert.equal(a.professional.manualUntil, a.directive.until);
  assert.equal(a.directive.manual, true);
  assert.equal(a.directive.plan.pace, 45);
});
test("Vencer el plazo del aumento conserva la deuda y sueldo pactados; impide aceptarlo tarde", () => {
  const { G, s } = game(),
    d = hire(G, s),
    p = G.DriverAgency.profile(s, d);
  s.day = 90;
  for (const key of ["pace", "control", "brakes", "consistency"])
    d.stats[key] += 12;
  G.DriverAgency.review(s, d);
  const deadline = p.demand.deadline,
    salary = d.contract.salary,
    morale = d.morale;
  s.day = deadline + 1;
  G.DriverAgency.daily(s);
  assert.equal(p.demand.status, "expired");
  assert.equal(d.contract.salary, salary);
  assert.ok(d.morale < morale);
  assert.throws(
    () => G.DriverAgency.answer(s, d.id, p.demand.salary),
    /ya no está pendiente/,
  );
});
