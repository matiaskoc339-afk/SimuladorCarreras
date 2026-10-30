const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(life = true, seed = 1470) {
  const { G } = engine(life ? { life: true } : { tour: true });
  return { G, s: G.createGame("Equipo vivo", "", seed) };
}
function hire(G, s, role = "trainer") {
  const e = s.employees
    .filter((e) => e.role === role)
    .sort((a, b) => a.ask - b.ask)[0];
  assert.equal(
    G.Staff.offer(s, e.id, {
      salary: Math.ceil(e.ask * 1.15),
      months: 12,
      bonus: 0,
    }).accepted,
    true,
  );
  return e;
}
function pilot(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  assert.equal(G.Drivers.offer(s, d.id, d.ask, 12).accepted, true);
  return d;
}
function race(seed = 1470) {
  const { G, s } = game(true, seed);
  G.player(s).balance = 100000;
  const d = pilot(G, s),
    car = G.ownedCars(s)[0];
  G.Calendar.advance(s, G.nextEvent(s).day);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, car.id);
  const r = G.Race.start(s, e.id),
    a = r.entrants.find((a) => a.companyId === s.playerId);
  return { G, s, r, a, d, car };
}
function reply(G, s, a) {
  while (s.race.time + G.Race.dt < a.radio.pending.answerAt) G.Race.tick(s, 1);
  G.Race.tick(s, 1);
}
test("Encargos semanales: previsión sin mutación, cobro al entregar y un apoyo limitado", () => {
  const { G, s } = game(),
    before = JSON.stringify(s),
    q = G.TeamLife.offers(s)[0],
    balance = G.player(s).balance;
  G.TeamLife.quote(s, q.id);
  assert.equal(JSON.stringify(s), before);
  assert.ok(G.TeamLife.offers(s).every((o) => o.pay <= 270));
  const j = G.TeamLife.start(s, q.id);
  assert.equal(G.player(s).balance, balance);
  G.Calendar.advance(s, 1);
  assert.equal(j.status, "active");
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, 1);
  G.Calendar.advance(restored, 1);
  assert.deepEqual(json(s), json(restored));
  assert.equal(j.status, "completed");
  assert.equal(G.player(s).balance, balance - 36 + q.pay);
  G.Calendar.advance(s, 1);
  assert.equal(
    G.player(s).ledger.filter((t) => t.category === "Ingresos de apoyo").length,
    1,
  );
  const snapshot = JSON.stringify(s);
  assert.throws(() => G.TeamLife.start(s, q.id), /siete días|otro encargo/);
  assert.equal(JSON.stringify(s), snapshot);
  G.Storage.validate(s);
});
test("Taller abierto reserva una bahía y cancelar libera recursos sin cobrar ni reiniciar la espera", () => {
  const { G, s } = game(),
    j = G.TeamLife.start(s, G.TeamLife.offers(s)[1].id),
    car = G.ownedCars(s)[0];
  assert.equal(G.Facilities.workload(s), 1);
  const raw = JSON.stringify(s);
  assert.throws(() => G.Workshop.repair(s, car.id, "all"), /bahías/);
  assert.equal(JSON.stringify(s), raw);
  G.TeamLife.close(s, "Cancelado por el jugador.");
  assert.equal(G.Facilities.workload(s), 0);
  assert.equal(G.player(s).balance, 4200);
  assert.equal(j.status, "cancelled");
  assert.match(
    G.TeamLife.quote(s, G.TeamLife.offers(s)[0].id).reason,
    /siete días/,
  );
  G.Storage.validate(s);
  const old = G.TeamLife.offers(s).map((o) => o.id);
  G.Calendar.advance(s, 7);
  assert.notDeepEqual(
    G.TeamLife.offers(s).map((o) => o.id),
    old,
  );
  assert.equal(G.TeamLife.quote(s, G.TeamLife.offers(s)[0].id).reason, "");
});
test("Telemetría requiere ingeniero y cobertura; lo ocupa, remunera y detecta impago", () => {
  const { G, s } = game();
  G.player(s).balance = 100000;
  const id = G.TeamLife.offers(s)[2].id;
  assert.match(G.TeamLife.quote(s, id).reason, /ingeniero contratado/);
  const e = hire(G, s, "engineer");
  const end = e.contract.end;
  e.contract.end = 2;
  assert.match(G.TeamLife.quote(s, id).reason, /Renueva/);
  e.contract.end = end;
  const j = G.TeamLife.start(s, id);
  assert.equal(G.Staff.busy(s, e.id), true);
  assert.throws(() => G.Professionals.rest(s, e.id, 1), /trabajo/);
  G.Calendar.advance(s, 3);
  assert.equal(j.status, "completed");
  assert.equal(e.contributions.reports, 1);
  assert.equal(G.Staff.busy(s, e.id), false);
  G.Storage.validate(s);
  const c = G.clone(s);
  c.teamLife.history[0].pay += 1;
  assert.throws(() => G.Storage.validate(c), /Encargo/);
  const unpaid = game();
  G.player(unpaid.s).balance = 100000;
  hire(unpaid.G, unpaid.s, "engineer");
  const interrupted = unpaid.G.TeamLife.start(
    unpaid.s,
    unpaid.G.TeamLife.offers(unpaid.s)[2].id,
  );
  unpaid.G.player(unpaid.s).balance = 0;
  unpaid.G.Calendar.advance(unpaid.s, 1);
  assert.equal(interrupted.status, "cancelled");
  assert.match(interrupted.reason, /sueldo pendiente/);
  assert.equal(
    unpaid.G.player(unpaid.s).ledger.filter(
      (t) => t.category === "Ingresos de apoyo",
    ).length,
    0,
  );
  unpaid.G.Storage.validate(unpaid.s);
});
test("La formación gana 45 % más con el mismo coste, plazo y riesgo, sin superar el potencial", () => {
  const results = [];
  for (const life of [false, true]) {
    const { G, s } = game(life);
    G.player(s).balance = 100000;
    const d = pilot(G, s),
      e = hire(G, s),
      car = G.ownedCars(s)[0],
      o = {
        driverId: d.id,
        coachId: e.id,
        carId: car.id,
        laps: 5,
        intensity: "easy",
        focus: "control",
      };
    const q = G.Practice.quote(s, o),
      j = G.Practice.start(s, o);
    G.Calendar.advance(s, q.days);
    results.push({
      gain: j.gain,
      cost: q.cost,
      days: q.days,
      risk: q.incidentRisk,
    });
    assert.ok(d.stats.control <= d.potential);
    G.Storage.validate(s);
  }
  assert.ok(Math.abs(results[1].gain / results[0].gain - 1.45) < 1e-9);
  for (const key of ["cost", "days", "risk"])
    assert.equal(results[0][key], results[1][key]);
});
test("Control distingue el paso por curvas con el mismo coche, frenos y agarre", () => {
  const { G, r, a } = race();
  const low = G.clone(a),
    high = G.clone(a);
  low.stats.control = 15;
  high.stats.control = 85;
  low.speed = high.speed = 12;
  const samples = [];
  for (let p = 0; p < G.Data.tracks[r.track].length; p += 40) {
    low.progress = high.progress = p;
    if (G.Racecraft.sample(r.track, p).limit < 35)
      samples.push([
        G.Driving.safeSpeed(r, low, 6),
        G.Driving.safeSpeed(r, high, 6),
      ]);
  }
  assert.ok(samples.length > 4);
  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  assert.ok(
    average(samples.map((s) => s[1])) >
      average(samples.map((s) => s[0])) * 1.25,
  );
  const worn = G.clone(high);
  worn.tires = 10;
  worn.components.suspension = 20;
  r.weather.wetness = 1;
  assert.ok(
    G.Driving.safeSpeed(r, worn, 6) <
      G.Driving.safeSpeed(
        { ...r, weather: { ...r.weather, wetness: 0 } },
        high,
        6,
      ),
  );
});
test("El entrenamiento diario y el delegado mejoran más sin duplicar la cuota ni la nómina", () => {
  for (const delegated of [false, true]) {
    const runs = [];
    for (const life of [false, true]) {
      const { G, s } = game(life);
      G.player(s).balance = 100000;
      const d = pilot(G, s);
      hire(G, s);
      if (delegated) {
        hire(G, s, "manager");
        const settings = G.Operations.defaults();
        settings.enabled = true;
        settings.minimumCash = 0;
        settings.reserveMonths = 0;
        settings.dailyLimit = 1000;
        settings.monthlyLimit = 3000;
        Object.assign(settings.policies.training, {
          enabled: true,
          budget: 1000,
          drivers: [d.id],
          focus: "control",
        });
        G.Operations.configure(s, settings);
      } else G.Drivers.train(s, d.id, "control");
      const before = d.stats.control,
        cash = G.player(s).balance;
      G.Calendar.advance(s, 1);
      const charges = G.player(s).ledger.filter(
        (t) => t.category === "Formación" && t.day === s.day,
      );
      assert.equal(charges.length, 1);
      assert.equal(charges[0].amount, -18);
      runs.push({
        gain: d.stats.control - before,
        cost: cash - G.player(s).balance,
      });
      G.Storage.validate(s);
    }
    assert.ok(Math.abs(runs[1].gain / runs[0].gain - 1.45) < 1e-8);
    assert.equal(runs[0].cost, runs[1].cost);
  }
});
test("Radio: enviar no aplica el plan hasta la respuesta y guardar conserva la transmisión", () => {
  const { G, s, r, a } = race();
  G.Race.order(s, "save");
  assert.equal(a.mode, "balanced");
  assert.equal(a.radio.pending.status, "pending");
  const raw = JSON.stringify(s);
  assert.throws(() => G.Race.order(s, "attack"), /respuesta/);
  assert.equal(JSON.stringify(s), raw);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  reply(G, s, a);
  const other = restored.race.entrants.find((x) => x.carId === a.carId);
  reply(G, restored, other);
  assert.deepEqual(json(s), json(restored));
  assert.equal(a.radio.pending, null);
  assert.ok(["accepted", "missed"].includes(a.radio.last.status));
  assert.equal(a.radio.history.length, 1);
  G.Storage.validate(s);
});
test("Una orden de atacar bajo amarilla se aplaza con causa, sin fingir aceptación", () => {
  const { G, s, r, a } = race();
  G.Race.order(s, "attack");
  G.Race.caution(r, a.progress, 20);
  a.radio.pending.answerAt = r.time;
  G.Race.tick(s, 1);
  assert.equal(a.radio.last.status, "deferred");
  assert.equal(a.mode, "balanced");
  assert.match(a.radio.last.text, /amarilla.*verde/s);
  G.Storage.validate(s);
});
test("Malentendidos posibles y dependientes de equipo, concentración, disciplina y estrés", () => {
  const { G, s, r, a } = race(),
    low = G.clone(a),
    high = G.clone(a);
  for (const k of ["teamwork", "focus", "discipline"]) {
    low.stats[k] = 10;
    high.stats[k] = 90;
  }
  low.professional.driverStress = 90;
  high.professional.driverStress = 10;
  assert.ok(G.RaceLife.missChance(low) > G.RaceLife.missChance(high) * 2);
  G.Race.order(s, "defend");
  a.radio.pending.answerAt = r.time;
  let seed = 0;
  while (G.random({ rng: seed }) >= 0.001) seed++;
  a.brain.mind.rng = seed;
  G.Race.tick(s, 1);
  assert.equal(a.radio.last.status, "missed");
  assert.equal(a.mode, "balanced");
  assert.match(a.radio.last.text, /plan anterior.*repetir/);
  G.Storage.validate(s);
  const broken = G.clone(s);
  broken.race.entrants.find((x) => x.carId === a.carId).radio.last.status =
    "inventado";
  assert.throws(() => G.Storage.validate(broken), /radio/);
});
test("La IA muestra dudas y buenas salidas por habilidades y varía decisiones entre carreras", () => {
  const { G, r, a } = race(),
    decisions = [];
  for (const control of [10, 85]) {
    const driver = G.clone(a);
    driver.stats.control = control;
    driver.stats.consistency = control;
    driver.stats.focus = 85;
    driver.fatigue = 0;
    driver.brain.speedCeiling = 35;
    let hesitations = 0,
      flow = 0;
    for (let i = 0; i < 300; i++) {
      r.time = i * 15;
      G.RaceLife.decide(
        r,
        driver,
        {
          corner: 0.8,
          yellow: false,
          front: { gap: 15, b: { name: "Rival", carId: "rival" } },
        },
        { target: 25, lateral: 0, passing: false },
      );
      if (driver.brain.mind.intent.startsWith("Duda")) hesitations++;
      if (driver.brain.mind.effect > 1) flow++;
    }
    decisions.push({ hesitations, flow });
  }
  assert.ok(decisions[0].hesitations > decisions[1].hesitations);
  assert.equal(decisions[0].flow, 0);
  assert.ok(decisions[1].flow > 0);
  const sequences = [];
  for (const seed of [1470, 1580]) {
    const { G, r, a } = race(seed);
    const seq = [];
    a.stats.overtake = 65;
    a.stats.defense = 65;
    for (let i = 0; i < 30; i++) {
      r.time = i * 20;
      seq.push(G.RaceLife.aiMode(r, a, { gap: 20 }, { gap: 15 }));
    }
    sequences.push(seq);
  }
  assert.notDeepEqual(sequences[0], sequences[1]);
  assert.ok(new Set(sequences[0]).size > 1);
});
test("La carrera completa por pasos agrupados o guardado mantiene decisiones y mensajes", () => {
  const { G, s } = race();
  G.Race.order(s, "balanced");
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 1800);
  for (let i = 0; i < 18; i++) G.Race.tick(restored, 100);
  assert.deepEqual(json(s), json(restored));
  G.Storage.validate(s);
});
test("Un rival prepara juntos frenos, suspensión y gomas para no perder una copa por planificación tardía", () => {
  const { G, s } = game(),
    c = s.companies.find((c) => c.id !== s.playerId && !c.privateer),
    d = G.Companies.lineup(s, c.id).driver,
    car = G.ownedCars(s, c.id)[0],
    event = s.season.events.find((e) => e.cup === "pro" && !e.final);
  c.balance = 50000;
  for (const key of G.Drivers.stats) d.stats[key] = 60;
  event.day = 10;
  car.components.brakes = 70;
  car.components.suspension = 65;
  car.components.tires = 30;
  G.Workshop.recalculate(s, car);
  const candidate = G.Competition.maintenance(s, c)[0];
  assert.ok(candidate);
  const before = c.balance;
  candidate.run();
  assert.equal(c.balance, before - candidate.cost);
  assert.equal(car.tires, 100);
  assert.ok(car.repair.end <= event.day);
  G.Calendar.advance(s, car.repair.end - s.day);
  assert.equal(G.Competition.technical(s, event, car, d), "");
  G.Storage.validate(s);
});
