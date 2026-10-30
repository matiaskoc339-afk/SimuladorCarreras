const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (value) => JSON.parse(JSON.stringify(value));
function setup(seed = 1470) {
  const { G } = engine({ tour: true }),
    s = G.createGame("Avisos claros", "", seed);
  // Isolate calendar/availability regressions from economic balancing and race days.
  G.player(s).balance = 100000;
  s.season.events.forEach((e) => (e.day += 365));
  const d = s.drivers
      .filter((d) => !d.companyId)
      .sort((a, b) => a.ask - b.ask)[0],
    e = s.employees
      .filter((e) => e.role === "trainer")
      .sort((a, b) => a.ask - b.ask)[0],
    car = G.ownedCars(s)[0];
  assert.equal(G.Drivers.offer(s, d.id, d.ask, 12).accepted, true);
  assert.equal(
    G.Staff.offer(s, e.id, {
      salary: Math.ceil(e.ask * 1.15),
      months: 12,
      bonus: 0,
    }).accepted,
    true,
  );
  return {
    G,
    s,
    d,
    e,
    car,
    o: {
      driverId: d.id,
      coachId: e.id,
      carId: car.id,
      laps: 20,
      intensity: "hard",
      focus: "control",
    },
  };
}
function denied(G, s, o, pattern) {
  const before = JSON.stringify(s);
  assert.throws(() => G.Practice.quote(s, o), pattern);
  assert.throws(() => G.Practice.start(s, o), pattern);
  assert.equal(
    JSON.stringify(s),
    before,
    "Un rechazo no cobra, reserva ni consume RNG",
  );
}
test("Regresión: programas de 12 días no sufren averías térmicas falsas en el tercer día", () => {
  for (const seed of [1470, 1580, 20]) {
    const { G, s, car, o } = setup(seed),
      q = G.Practice.quote(s, o),
      j = G.Practice.start(s, o),
      day = s.day;
    assert.equal(q.days, 12);
    for (let i = 0; i < q.days; i++) {
      G.Calendar.advance(s, 1);
      assert.ok(
        Number.isFinite(j.a.thermal) && j.a.thermal >= 20 && j.a.thermal < 160,
      );
      assert.equal(j.daysWorked, i + 1);
      if (i < q.days - 1) assert.equal(j.status, "running");
    }
    assert.equal(j.incident, null);
    assert.equal(j.daysWorked, q.days);
    assert.equal(s.day, day + q.days);
    assert.equal(j.report.reason, "Objetivo del programa completado.");
    assert.ok(
      car.components.engine < 80 && car.components.engine > 20,
      "El desgaste real sigue presente",
    );
    assert.ok(car.tires < 20);
    denied(G, s, o, /Neumáticos:.*20 %.*Cambia las gomas/s);
    G.Storage.validate(s);
  }
});
test("Entrenar de nuevo explica cada componente que falta y no oculta la lesión o el descanso", () => {
  const { G, s, d, e, car, o } = setup();
  G.Professionals.care(s, d.id).injuryUntil = s.day + 5;
  G.Professionals.profile(s, e.id).restUntil = s.day + 3;
  car.components.engine = 18;
  car.components.tires = 12;
  G.Workshop.recalculate(s, car);
  denied(G, s, o, /lesionado.*5 días.*descansando.*Neumáticos: 12.*Motor: 18/s);
  const blockers = G.Practice.blockers(s, o).join(" ");
  assert.match(blockers, /Operaciones y salud/);
  assert.match(blockers, /hasta el/);
  assert.match(blockers, /al menos 30/);
});
test("El coste y la cobertura de contratos muestran importes, diferencia y fecha necesarios", () => {
  const { G, s, d, o } = setup(),
    q = G.Practice.quote(s, o);
  G.player(s).balance = q.cost - 10;
  denied(G, s, o, /necesitas.*tienes.*te faltan.*10/s);
  G.player(s).balance = 100000;
  d.contract.end = s.day + 2;
  denied(G, s, o, /todos los días.*12 días.*Renueva/s);
});
test("Impago del entrenador se explica antes de reservar; el impago posterior produce informe parcial", () => {
  const { G, s, e, o } = setup();
  e.contract.arrears = 50;
  denied(G, s, o, /50.*sueldo vencido.*liquide/s);
  e.contract.arrears = 0;
  const j = G.Practice.start(s, o);
  G.Calendar.advance(s, 1);
  e.contract.arrears = 50;
  s.day++;
  G.Camps.daily(s);
  assert.equal(j.status, "cancelled");
  assert.equal(j.daysWorked, 1);
  assert.match(j.report.reason, /50.*sueldo vencido/);
  assert.ok(j.report.changes.control > 0);
  G.Storage.validate(s);
});
test("Una avería real interrumpe antes del plazo y explica neumáticos y reparación, sin aprendizaje futuro", () => {
  const { G, s, car, o } = setup();
  car.components.tires = 20;
  G.Workshop.recalculate(s, car);
  const j = G.Practice.start(s, o);
  while (G.Practice.active(s)) G.Calendar.advance(s, 1);
  assert.equal(j.incident, "mechanical");
  assert.ok(j.daysWorked < j.days && j.workLaps < j.laps);
  assert.match(j.report.reason, /avería: neumáticos al.*5 %.*Taller/s);
  const finished = JSON.stringify(j);
  G.Calendar.advance(s, 1);
  assert.equal(JSON.stringify(j), finished);
  denied(G, s, o, /Neumáticos:.*Cambia las gomas/s);
  G.Storage.validate(s);
});
test("Lesión temprana conserva días reales, fecha de recuperación y causa en el informe", () => {
  const { G, s, d, o } = setup();
  G.Professionals.care(s, d.id).stress = 100;
  d.fatigue = 100;
  const j = G.Practice.start(s, o);
  // Force only the incident draw; the engine still calculates injury and recovery normally.
  let seed = 0;
  while (G.random({ rng: seed }) >= 0.00001) seed++;
  j.rng = seed;
  G.Calendar.advance(s, 1);
  assert.equal(j.incident, "injury");
  assert.equal(j.daysWorked, 1);
  assert.match(j.report.reason, /lesión.*días de recuperación.*hasta el/s);
  denied(G, s, o, /lesionado.*días restantes/s);
  G.Storage.validate(s);
});
test("Guardar y agrupar días no acelera el programa ni altera nóminas, desgaste o resultados", () => {
  const { G, s, o } = setup();
  const j = G.Practice.start(s, { ...o, laps: 10, intensity: "easy" });
  G.Calendar.advance(s, 2);
  const restored = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Calendar.advance(s, j.end - s.day);
  while (G.Practice.active(restored)) G.Calendar.advance(restored, 1);
  assert.deepEqual(json(s), json(restored));
  G.Storage.validate(s);
});
test("Requisitos compartidos: plazas, nivel, especialidad y presupuesto explican cómo resolverlos", () => {
  const { G, s, e } = setup(),
    high = s.employees.filter((e) => e.role === "scout").at(-1);
  assert.match(G.Feedback.staffHiring(s, high), /nivel.*objetivos/s);
  assert.match(
    G.Feedback.staffHiring(s, e),
    /responsable.*uno por especialidad/s,
  );
  const before = JSON.stringify(s);
  G.Feedback.car(s, G.ownedCars(s)[0]);
  G.Feedback.employee(s, e);
  G.Feedback.funds(s, 120000, "comprar piezas");
  assert.equal(JSON.stringify(s), before);
});
