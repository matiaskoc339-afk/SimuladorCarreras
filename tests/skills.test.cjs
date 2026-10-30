const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ skills: true });
  return { G, s: G.createGame("Pilotos que aprenden", "", seed) };
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
function context(G, r, a) {
  const front = json(r.entrants.find((o) => o.carId !== a.carId));
  a.progress = 700;
  a.speed = 28;
  front.progress = 720;
  front.speed = 27;
  front.braking = true;
  front.stats.brakes = 25;
  const side =
    Math.sign(G.Racecraft.sample(r.track, a.progress + 45).curvature) ||
    a.brain.side;
  front.lateral = side * 1.9;
  return {
    front: { b: front, gap: 20 },
    rear: null,
    yellow: false,
    corner: 0.65,
    curve: side * 0.03,
    preparingPass: true,
    lateralTarget: 0,
    target: 35,
  };
}

test("Actualizar una empresa conserva dinero, contratos, puntos y RNG; una carrera 0.14 conserva sus reglas", () => {
  const { G } = engine({ director: true }),
    s = G.createGame("Continuidad", "", 1470),
    before = json(s);
  G.RaceSkills.initialize(s);
  const after = json(s);
  delete after.raceSkills;
  assert.deepEqual(after, before);
  G.Storage.validate(s);
  const { G: H, s: t } = game();
  assert.equal(H.RaceSkills.enabled(t), true);
  assert.equal(H.RaceSkills.focuses(t).length, 6);
});
test("Control es continuo en cada punto: 10 conserva 37 km/h, 50 ronda 64 y 90 ronda 82 en la misma curva", () => {
  const { G, r, a } = race();
  a.stats = Object.fromEntries(G.Drivers.stats.map((k) => [k, 50]));
  a.brain.age = 28;
  a.brain.experience = 3;
  a.fatigue = 0;
  a.tires = 100;
  r.weather.wetness = 0;
  a.progress = 700;
  a.lateral = 0;
  a.speed = 10;
  const values = [10, 50, 90].map((control) => {
    a.stats.control = control;
    return G.Driving.safeSpeed(r, a, G.RaceSkills.brakes(r, a)) * 3.6;
  });
  assert.ok(values[0] > 34 && values[0] < 41);
  assert.ok(values[1] > 60 && values[1] < 70);
  assert.ok(values[2] > 77 && values[2] < 88);
  for (let control = 1; control <= 100; control++)
    assert.ok(
      G.RaceSkills.controlFactor(control) >
        G.RaceSkills.controlFactor(control - 1),
    );
  a.stats.control = 100;
  const full = G.RaceSkills.envelope(r, a, G.RaceSkills.brakes(r, a));
  assert.ok(full.driver <= full.physical + 1e-8);
  const dry = full.driver;
  a.tires = 18;
  r.weather.wetness = 0.8;
  assert.ok(G.Driving.safeSpeed(r, a, G.RaceSkills.brakes(r, a)) < dry * 0.75);
});
test("El techo físico no aumenta con Control; mejor piloto aprovecha más ese mismo techo", () => {
  const { G, r, a } = race();
  a.progress = 700;
  a.lateral = 0;
  a.speed = 10;
  a.fatigue = 0;
  const rows = [10, 50, 90].map((control) => {
    a.stats.control = control;
    return G.RaceSkills.envelope(r, a, G.RaceSkills.brakes(r, a));
  });
  assert.ok(Math.abs(rows[0].physical - rows[2].physical) < 1e-9);
  assert.ok(rows[0].driver < rows[1].driver && rows[1].driver < rows[2].driver);
});
test("Interior recorre menos metros y exterior permite más velocidad con mayor distancia; cambiar de carril consume recorrido", () => {
  const { G, r, a } = race();
  a.progress = 700;
  a.speed = 15;
  a.stats.control = 90;
  const bend = Math.sign(G.Racecraft.sample(r.track, a.progress).curvature);
  assert.ok(bend);
  const result = (lane) => {
    a.lateral = lane;
    a.skills.beforeLateral = lane;
    const advance = G.RaceSkills.advance(r, a, 1, 0.05),
      env = G.RaceSkills.envelope(r, a, G.RaceSkills.brakes(r, a));
    return { advance, physical: env.physical };
  };
  const inside = result(bend * 2),
    outside = result(-bend * 2);
  assert.ok(inside.advance > outside.advance);
  assert.ok(inside.physical < outside.physical);
  a.lateral = 0;
  a.skills.beforeLateral = 0;
  const straight = G.RaceSkills.advance(r, a, 1, 0.05);
  a.lateral = 0.2;
  a.skills.beforeLateral = 0;
  assert.ok(G.RaceSkills.advance(r, a, 1, 0.05) < straight * 1.05);
  assert.ok(Number.isFinite(straight));
});
test("Una trayectoria ocupada y un coche emparejado impiden cerrar el paso", () => {
  const { G, r, a } = race(),
    c = context(G, r, a),
    front = c.front.b,
    side = Math.sign(c.curve),
    lane = front.lateral - side * ((a.width + front.width) / 2 + 0.7),
    blocker = json(front);
  blocker.carId = r.entrants.find(
    (o) => o.carId !== a.carId && o.carId !== front.carId,
  ).carId;
  blocker.progress = a.progress + 2;
  blocker.lateral = lane;
  assert.equal(
    G.RaceSkills.clearLane(r, a, [a, front, blocker], lane, front.carId),
    false,
  );
  a.skills.battle = {
    ...a.skills.battle,
    stage: "defend",
    side: 1,
    targetId: front.carId,
    until: 10,
    nextThink: 10,
  };
  c.front = null;
  c.rear = { b: front, gap: 2 };
  front.progress = a.progress - 2;
  const q = G.RaceSkills.decide(
    r,
    a,
    c,
    { target: 30, lateral: a.lateral, passing: false },
    [a, front],
  );
  assert.equal(q.lateral, a.lateral);
});
test("Los expertos preparan salida cruzada y recuerdan la frenada rival; un novato usa una maniobra más simple", () => {
  for (const expert of [false, true]) {
    const { G, r, a } = race();
    for (const key of ["control", "overtake", "focus", "brakes"])
      a.stats[key] = expert ? 90 : 10;
    a.brain.experience = expert ? 18 : 0;
    const c = context(G, r, a),
      cars = [a, c.front.b];
    r.time = 1;
    G.RaceSkills.plan(r, a, c, cars);
    assert.equal(a.skills.battle.stage, "tow");
    r.time = 4;
    G.RaceSkills.plan(r, a, c, cars);
    assert.equal(a.skills.battle.stage, expert ? "switchback" : "tow");
    assert.ok(a.skills.battle.observations[0].samples >= 1);
    if (expert) {
      r.time = 9;
      G.RaceSkills.plan(r, a, c, cars);
      assert.equal(a.skills.battle.stage, "commit");
    }
  }
});
test("Una defensa mantiene un lado, cuenta un ataque y no alterna de carril cada paso", () => {
  const { G, r, a } = race(),
    c = context(G, r, a);
  c.rear = c.front;
  c.rear.b.progress = a.progress - 15;
  c.rear.gap = 15;
  c.front = null;
  a.stats.defense = 90;
  a.directive.plan.tactic = "defend";
  r.time = 1;
  G.RaceSkills.plan(r, a, c, [a, c.rear.b]);
  const side = a.skills.battle.side;
  for (const time of [2, 3, 4]) {
    r.time = time;
    G.RaceSkills.plan(r, a, c, [a, c.rear.b]);
    assert.equal(a.skills.battle.side, side);
  }
  assert.equal(a.skills.battle.defenses, 1);
});
test("Orden de conservar, bandera o boxes impiden preparar un ataque", () => {
  const { G, r, a } = race(),
    c = context(G, r, a);
  a.directive.plan.tactic = "clean";
  r.time = 1;
  G.RaceSkills.plan(r, a, c, [a, c.front.b]);
  assert.equal(a.skills.battle.stage, "observe");
  a.directive.plan.tactic = "auto";
  c.yellow = true;
  r.time = 3;
  G.RaceSkills.plan(r, a, c, [a, c.front.b]);
  assert.equal(a.skills.battle.targetId, null);
  c.yellow = false;
  a.pit.phase = "entry";
  r.time = 5;
  G.RaceSkills.plan(r, a, c, [a, c.front.b]);
  assert.equal(a.skills.battle.stage, "observe");
});
test("Los errores requieren ejecución exigente: no aparecen por conducir tranquilo ni por refrescar", () => {
  const { G, r, a } = race();
  for (const key of ["brakes", "control", "focus", "discipline"])
    a.stats[key] = 0;
  a.speed = 4;
  a.skills.envelope = {
    physical: 60,
    driver: 35,
    apex: 25,
    cornerDistance: 80,
    turn: 0.02,
    grip: 1,
  };
  a.directive.plan.pace = 90;
  a.directive.plan.risk = 100;
  for (let i = 1; i <= 300; i++) {
    r.time = i * 0.1;
    G.RaceSkills.motion(r, a, 20, 5, 2, 0.1, false);
  }
  assert.deepEqual(json(a.skills.analysis.errors), {
    lateBrake: 0,
    lock: 0,
    wheelspin: 0,
  });
  let found = false;
  for (let seed = 1; seed <= 500 && !found; seed++) {
    a.skills.rng = seed;
    a.skills.execution = {
      kind: "none",
      until: 0,
      cooldown: 0,
      delayUntil: 0,
      nextAttempt: 0,
      delayed: false,
    };
    a.speed = 30;
    r.time = 50;
    G.RaceSkills.motion(r, a, 10, 5, 2, 0.8, false);
    found = a.skills.execution.kind === "lock";
  }
  assert.equal(found, true);
  assert.ok(a.skills.analysis.errors.lock > 0);
});
test("Control alto mejora la aceleración de salida y permite rotación pequeña sin añadir potencia", () => {
  const { G, r, a } = race(),
    hp = a.hp;
  let point = -1;
  for (
    let progress = 0;
    progress < G.Data.tracks[r.track].length;
    progress += 5
  ) {
    if (
      G.Racecraft.sample(r.track, progress + 45).limit >
      G.Racecraft.sample(r.track, progress).limit + 2
    ) {
      point = progress;
      break;
    }
  }
  assert.ok(point >= 0);
  a.progress = point;
  a.speed = 10;
  a.tires = 100;
  r.weather.wetness = 0;
  a.directive.plan = { ...a.directive.plan, pace: 75, risk: 55 };
  a.skills.envelope = {
    physical: 60,
    driver: 45,
    apex: 30,
    cornerDistance: 0,
    turn: 0.03,
    grip: 1,
  };
  r.time = 1;
  a.skills.execution.nextAttempt = 100;
  a.stats.control = 10;
  const novice = G.RaceSkills.motion(r, a, 40, 6, 3, 0.5, false);
  assert.equal(a.skills.rotation, 0);
  a.stats.control = 90;
  const expert = G.RaceSkills.motion(r, a, 40, 6, 3, 0.5, false);
  assert.ok(expert.accel > novice.accel * 1.4);
  assert.ok(expert.accel <= 3);
  assert.ok(
    Math.abs(a.skills.rotation) > 0 && Math.abs(a.skills.rotation) < 0.1,
  );
  assert.equal(a.hp, hp);
});
test("Tiempo cedido se reparte sin duplicados, excluye neutralización y no cambia al consultar", () => {
  const { G, s, r, a } = race();
  G.Race.tick(s, 400);
  const t = a.skills,
    total = Object.values(t.analysis.losses).reduce((n, v) => n + v, 0);
  assert.ok(total > 0 && total <= t.analysis.activeTime);
  assert.ok(t.analysis.samples.length > 0);
  const before = JSON.stringify(s);
  G.RaceSkills.controlFactor(50);
  assert.equal(JSON.stringify(s), before);
  const losses = json(t.analysis.losses);
  G.Race.caution(r, a.progress, 15);
  G.Race.tick(s, 10);
  assert.deepEqual(json(t.analysis.losses), losses);
  assert.equal(t.current.cause, "neutral");
  G.Storage.validate(s);
});
test("El informe distingue una limitación aislada de coche, gomas, conducción o tráfico", () => {
  for (const cause of ["car", "tires", "driving", "traffic"]) {
    const { G, r, a } = race(),
      t = a.skills;
    t.reference = t.referenceSpeed = 30;
    t.healthyDrive = { acceleration: 0, hp: 100, weight: 1000, brakes: 6 };
    t.carCapacity = cause === "car" ? 20 : 30;
    t.envelope.physical = ["car", "tires"].includes(cause) ? 20 : 30;
    t.planTarget = cause === "traffic" ? 30 : 20;
    t.trafficTarget = 20;
    a.speed = 20;
    r.time = 1;
    G.RaceSkills.after(r, a, 1, 0.05);
    assert.equal(t.current.cause, cause);
    assert.ok(t.analysis.losses[cause] > 0);
    for (const other of Object.keys(t.analysis.losses).filter(
      (key) => key !== cause,
    ))
      assert.equal(t.analysis.losses[other], 0);
    assert.ok(Math.abs(t.analysis.losses[cause] - 0.05 / 3) < 1e-8);
  }
});
test("Preparación, ejecución y telemetría se reanudan exactamente desde una orden pendiente", () => {
  const { G, s, r, a } = race();
  G.Race.order(s, {
    pace: 73,
    risk: 52,
    tires: 55,
    fuel: 0,
    tactic: "outside",
    duration: 120,
  });
  G.Race.tick(s, 30);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 600);
  G.Race.tick(restored, 600);
  assert.deepEqual(json(s), json(restored));
  assert.ok(a.skills.analysis.samples.length <= 60);
  assert.ok(r.entrants.every((a) => a.skills.battle.observations.length <= 6));
  G.Storage.validate(s);
});
test("Adelantamiento y defensa son programas reales por días con coste, ganancia, atributo secundario e informe", () => {
  for (const focus of ["overtake", "defense"]) {
    const { G, s } = game();
    G.player(s).balance = 100000;
    s.season.events.forEach((e) => (e.day += 365));
    const d = hire(G, s),
      coach = s.employees
        .filter((e) => e.role === "trainer")
        .sort((a, b) => a.ask - b.ask)[0];
    assert.equal(
      G.Staff.offer(s, coach.id, {
        salary: Math.ceil(coach.ask * 1.15),
        months: 12,
        bonus: 0,
      }).accepted,
      true,
    );
    const options = {
        driverId: d.id,
        coachId: coach.id,
        carId: G.ownedCars(s)[0].id,
        laps: 5,
        intensity: "easy",
        focus,
      },
      before = d.stats[focus],
      secondary = focus === "overtake" ? "brakes" : "focus",
      oldSecondary = d.stats[secondary],
      q = G.Practice.quote(s, options),
      cash = G.player(s).balance,
      j = G.Practice.start(s, options);
    assert.equal(G.player(s).balance, cash - q.cost);
    G.Calendar.advance(s, 1);
    const restored = G.Storage.unpack(G.Storage.pack(s)).state;
    G.Calendar.advance(s, j.days - 1);
    G.Calendar.advance(restored, j.days - 1);
    assert.deepEqual(json(s), json(restored));
    assert.equal(j.status, "completed");
    assert.ok(d.stats[focus] > before && d.stats[secondary] > oldSecondary);
    assert.ok(j.report.changes[focus] > 0);
    assert.match(j.report.learned, focus === "overtake" ? /Rebufo/ : /defensa/);
    G.Storage.validate(s);
  }
});
test("Validación rechaza referencias, memoria y contadores manipulados antes de reanudar", () => {
  const { G, s, a } = race();
  G.Race.tick(s, 20);
  a.skills.referenceSpeed = Infinity;
  assert.throws(() => G.Storage.validate(s), /Referencias de ritmo/);
  a.skills.referenceSpeed = 10;
  a.skills.battle.observations.push({
    id: "car-inexistente",
    samples: 1,
    brakeAhead: 80,
    inside: 0,
    wasBraking: false,
    lastSeen: 0,
  });
  assert.throws(() => G.Storage.validate(s), /Memoria del rival/);
  a.skills.battle.observations = [];
  a.skills.analysis.losses.driving = 1000;
  assert.throws(() => G.Storage.validate(s), /Planificación/);
});
test("Una carrera completa guarda el informe real una sola vez, con datos finitos y ritmo medido", () => {
  const { G, s, r, a } = race();
  G.Race.order(s, { ...G.RaceDirector.presets.save, duration: 0 });
  for (let n = 0; n < 80 && !r.finished; n++) G.Race.tick(s, 500);
  assert.equal(r.finished, true);
  assert.ok(r.entrants.filter((a) => !a.dnf).length >= 2);
  const id = r.eventId,
    record = json(a.skills.analysis);
  G.Storage.validate(s);
  const results = G.Race.finish(s);
  assert.ok(results.length >= 4);
  assert.equal(s.raceSkills.reports.length, 1);
  assert.equal(s.raceSkills.reports[0].eventId, id);
  assert.deepEqual(json(s.raceSkills.reports[0].analysis), record);
  const defenses = s.raceSkills.reports[0].defenses;
  s.raceSkills.reports[0].defenses = "sin dato";
  assert.throws(() => G.Storage.validate(s), /Informe de conducción/);
  s.raceSkills.reports[0].defenses = defenses;
  const packed = G.Storage.pack(s);
  assert.deepEqual(json(G.Storage.unpack(packed).state), json(s));
  G.Storage.validate(s);
});
test("Control cambia el tiempo de una vuelta física del mismo coche, sin tráfico ni potencia extra", () => {
  const times = [10, 50, 90].map((control) => {
    const { G, s, r, a } = race();
    // Aislamiento físico: mismo coche y pista; solo cambia Control.
    r.entrants = [a];
    r.replay.cars = r.replay.cars.filter((c) => c.carId === a.carId);
    r.replay.frames = [];
    G.RaceWeekend.record(r, true);
    for (const key of G.Drivers.stats) a.stats[key] = 75;
    a.stats.control = control;
    a.brain.experience = 18;
    a.brain.age = 28;
    a.fuel = 8;
    G.Race.order(s, {
      pace: 60,
      risk: 15,
      tires: 60,
      fuel: 0,
      tactic: "clean",
      duration: 0,
    });
    for (let n = 0; n < 150 && a.lastLap < 1 && !a.dnf; n++)
      G.Race.tick(s, 100);
    assert.equal(a.dnf, false);
    assert.ok(a.bestLap > 0);
    G.Storage.validate(s);
    return a.bestLap;
  });
  assert.ok(times[1] < times[0] * 0.9, JSON.stringify(times));
  assert.ok(times[2] < times[1] * 0.97, JSON.stringify(times));
});
test("La conducción nueva completa trazados fácil, difícil y experto con límites laterales y guardado válidos", () => {
  for (const track of [41, 44, 53]) {
    const { G } = game(),
      // Calendario anterior actualizado en gestión: permite aislar estas sedes
      // sin alterar la selección firmada de una gira moderna.
      s = G.createV110Game("Prueba de trazadas", "", 1470),
      e = G.nextEvent(s),
      oldTrack = e.track,
      duplicate = s.season.events.find((o) => o !== e && o.track === track);
    G.TeamLife.initialize(s);
    G.DriverAgency.initialize(s);
    G.RaceSkills.initialize(s);
    if (duplicate) duplicate.track = oldTrack;
    e.track = track;
    G.player(s).balance = 100000;
    const d = hire(G, s);
    for (const key of G.Drivers.stats) d.stats[key] = 75;
    d.potential = 95;
    G.Calendar.advance(s, e.day);
    G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id, {
      compound: "fortis-hard",
    });
    const r = G.Race.start(s, e.id),
      a = r.entrants.find((a) => a.companyId === s.playerId);
    r.entrants = [a];
    r.replay.cars = r.replay.cars.filter((c) => c.carId === a.carId);
    r.replay.frames = [];
    G.RaceWeekend.record(r, true);
    a.fuel = 8;
    G.Race.order(s, {
      ...G.RaceDirector.presets.save,
      tactic: "clean",
      duration: 0,
    });
    for (let n = 0; n < 150 && !r.finished; n++) {
      G.Race.tick(s, 400);
      assert.ok(Number.isFinite(a.speed) && Number.isFinite(a.progress));
      assert.ok(Math.abs(a.lateral) + a.width / 2 <= r.trackWidth / 2 + 0.1);
    }
    assert.equal(r.finished, true, G.Data.tracks[track].name);
    assert.equal(a.dnf, false, G.Data.tracks[track].name);
    assert.ok(a.finishTime > 0 && a.finishTime < 1500);
    G.Storage.validate(s);
    assert.equal(G.Race.finish(s).length, 1);
    G.Storage.validate(s);
  }
});
