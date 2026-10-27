const { test } = require("node:test");
const assert = require("node:assert/strict");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function grid(seed = 601) {
  const { G } = engine(),
    s = G.createGame("Trackside", "", seed),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s);
  G.Drivers.offer(s, d.id, d.ask, 12, 0);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  return { G, s, r: s.race };
}
function pair(seed = 601) {
  const t = grid(seed);
  t.r.entrants = t.r.entrants.slice(0, 2);
  const [a, b] = t.r.entrants;
  a.progress = 100;
  b.progress = 103;
  a.lateral = 0;
  b.lateral = 0;
  a.speed = 43;
  b.speed = 30;
  return { ...t, a, b };
}
function finish(G, s, steps) {
  while (!s.race.finished) G.Race.tick(s, steps);
  return G.Race.finish(s);
}
test("Parrilla nueva: dimensiones en metros, dos filas con espacio y estado persistente de pista", () => {
  const { G, s, r } = grid();
  assert.equal(r.racingVersion, 1);
  assert.equal(r.trackWidth, 12.4);
  assert.equal(r.flag, "green");
  assert.equal(r.events.length, 0);
  for (let i = 0; i < r.entrants.length; i++) {
    const a = r.entrants[i];
    assert.ok(a.length > 3.8 && a.length < 4.7);
    assert.ok(a.width > 1.7 && a.width < 1.95);
    assert.ok(Math.abs(a.lateral) < r.trackWidth / 2);
    for (const b of r.entrants.slice(i + 1))
      assert.ok(
        Math.abs(a.progress - b.progress) >= (a.length + b.length) / 2 ||
          Math.abs(a.lateral - b.lateral) >= (a.width + b.width) / 2,
      );
  }
  G.Storage.validate(s);
});
test("Contacto real: dos volúmenes superpuestos se separan y dañan a los dos coches", () => {
  const { G, s, r, a, b } = pair(),
    bodyA = a.components.body,
    bodyB = b.components.body;
  G.Race.resolveContacts(r);
  assert.ok(a.components.body < bodyA);
  assert.ok(b.components.body < bodyB);
  assert.equal(a.collisionCount, 1);
  assert.equal(b.collisionCount, 1);
  assert.ok(r.events.some((e) => e.type === "contact" || e.type === "crash"));
  const dx = Math.abs(G.Race.relative(a, b, G.Data.tracks[r.track].length)),
    dy = Math.abs(a.lateral - b.lateral);
  assert.ok(dx >= (a.length + b.length) / 2 || dy >= (a.width + b.width) / 2);
  const damaged = a.components.body;
  G.Race.resolveContacts(r);
  assert.equal(
    a.components.body,
    damaged,
    "La separación/cooldown evita cobrar el mismo contacto cada fotograma",
  );
  G.Storage.validate(s);
});
test("Coches emparejados con espacio no colisionan por compartir distancia longitudinal", () => {
  const { G, r, a, b } = pair();
  a.progress = b.progress;
  a.lateral = -2;
  b.lateral = 2;
  const condition = a.condition;
  G.Race.resolveContacts(r);
  assert.equal(r.events.length, 0);
  assert.equal(a.condition, condition);
  assert.equal(a.collisionCount, 0);
});
test("Geometría cíclica: un doblado cercano puede tocar físicamente a un coche de otra vuelta", () => {
  const { G, r, a, b } = pair();
  a.progress = G.Data.tracks[r.track].length + 100;
  b.progress = 102;
  G.Race.resolveContacts(r);
  assert.equal(a.collisionCount, 1);
  assert.ok(a.components.body < a.initialCondition);
});
test("Choque fuerte: abandono, amarilla local y daños mecánicos conservados al liquidar la carrera", () => {
  const { G, s, r, a, b } = pair();
  a.speed = 65;
  b.speed = 0;
  G.Race.resolveContacts(r);
  assert.equal(a.dnf, true);
  assert.ok(a.dnfReason.includes("colisión"));
  assert.ok(a.components.cooling < 30);
  assert.equal(r.flag, "yellow");
  assert.ok(r.yellowUntil > r.time);
  assert.ok(r.events.some((e) => e.type === "retirement"));
  G.Race.tick(s, 1);
  assert.equal(r.finished, true);
  const rows = G.Race.finish(s);
  assert.ok(rows.every((row) => row.dnf));
  assert.ok(rows[0].dnfReason);
  const car = s.cars.find((c) => c.id === a.carId);
  assert.ok(car.components.cooling < 30);
  assert.equal(G.Workshop.ready(car), false);
  const e = s.season.events[0];
  assert.equal(e.raceSummary.retirements, 2);
  assert.equal(e.raceSummary.crashes, 1);
  assert.ok(s.news.some((n) => n.title.includes("sin clasificados")));
  G.Storage.validate(s);
});
test("Un retirado sigue siendo un obstáculo hasta apartarse gradualmente al arcén", () => {
  const { G, s, r, a, b } = pair();
  a.progress = 100;
  a.lateral = 0;
  a.speed = 0;
  b.progress = 80;
  b.lateral = 0;
  b.speed = 15;
  G.Race.retire(r, a, "Avería mecánica");
  assert.equal(a.lateral, 0, "La retirada no teletransporta el coche");
  G.Race.tick(s, 20);
  assert.ok(Math.abs(a.lateral) > 0 && Math.abs(a.lateral) < 2);
  assert.ok(
    b.progress < a.progress - 3 || Math.abs(b.lateral - a.lateral) > 1.7,
  );
  G.Race.tick(s, 220);
  assert.ok(Math.abs(a.lateral) > r.trackWidth / 2);
});
test("Riesgo contextual: un piloto preciso y conservador tiene menos propensión a perder control", () => {
  const { G, r, a } = pair();
  const safe = G.clone(a),
    reckless = G.clone(a);
  for (const k of ["control", "consistency", "discipline"]) {
    safe.stats[k] = 85;
    reckless.stats[k] = 25;
  }
  safe.mode = "save";
  safe.tires = 95;
  safe.trait = 2;
  reckless.mode = "attack";
  reckless.tires = 30;
  reckless.trait = 1;
  assert.ok(
    G.Race.errorRate(reckless, 0.85, 1) > G.Race.errorRate(safe, 0.85, 1) * 8,
  );
  assert.equal(
    G.Race.errorRate(reckless, 0, 1),
    0,
    "En una recta no se simula pérdida lateral de curva por azar",
  );
  reckless.speed = 38;
  r.entrants = [reckless];
  G.Race.loseControl(r, reckless, 0.85);
  assert.ok(["slide", "spin"].includes(reckless.incident));
  assert.ok(reckless.incidentUntil > r.time);
  assert.ok(r.events.some((e) => e.type === reckless.incident));
  assert.ok(reckless.tires < 30);
});
test("Adelantamiento disputado: la mayor prestación necesita abrir hueco y cruzar físicamente", () => {
  const { G, s, r, a, b } = pair(604);
  r.entrants = [a, b];
  a.companyId = s.playerId;
  a.progress = 30;
  b.progress = 45;
  a.lateral = 0;
  b.lateral = 0;
  a.hp = 205;
  a.top = 235;
  a.grip = 76;
  a.brakes = 76;
  a.paceFactor = 1;
  a.stats.pace = 80;
  a.stats.control = 80;
  a.stats.overtake = 85;
  a.stats.consistency = 85;
  a.mode = "attack";
  a.speed = 30;
  b.hp = 100;
  b.top = 160;
  b.grip = 55;
  b.brakes = 55;
  b.paceFactor = 0.98;
  b.speed = 25;
  b.stats.pace = 30;
  b.stats.defense = 35;
  G.Race.tick(s, 1800);
  assert.ok(a.progress > b.progress);
  assert.ok(a.overtakeCount > 0);
  assert.ok(
    r.events.some((e) => e.type === "overtake" && e.carIds[0] === a.carId),
  );
  assert.ok(
    a.collisionCount < 3,
    "Una maniobra con hueco no requiere golpes para superar al rival",
  );
});
test("Amarilla local: el peligro limita el ritmo en su sector y se retira al despejarse", () => {
  const { G, s, r, a, b } = pair(605);
  a.progress = 100;
  b.progress = 800;
  a.lateral = -2;
  b.lateral = 2;
  a.speed = 45;
  b.speed = 45;
  G.Race.caution(r, 150, 4);
  assert.equal(G.Race.underYellow(r, a), true);
  assert.equal(G.Race.underYellow(r, b), false);
  G.Race.tick(s, 60);
  assert.ok(a.speed < 34);
  G.Race.tick(s, 25);
  assert.equal(r.flag, "green");
  assert.ok(r.events.some((e) => e.type === "green"));
});
test("Determinismo: combate, contactos, errores y recap se conservan al guardar y agrupar pasos", () => {
  const { G, s, r } = grid(606);
  G.Race.order(s, "attack");
  G.Race.tick(s, 700);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  const rows1 = finish(G, s, 1),
    rows2 = finish(G, copy, 80);
  assert.deepEqual(json(rows1), json(rows2));
  assert.deepEqual(json(s), json(copy));
  assert.ok(s.season.events[0].raceSummary.highlights.length <= 12);
  assert.ok(s.season.events[0].raceSummary.overtakes >= 0);
});
test("Los registros son acotados y no se crean incidentes por cambiar la cámara o refrescar UI", () => {
  const { G, s, r } = grid(607);
  const before = JSON.stringify(r);
  G.Race.positions(r);
  G.Race.point(r.track, 200);
  G.Race.track(r.track);
  assert.equal(JSON.stringify(r), before);
  G.Race.tick(s, 2000);
  assert.ok(r.events.length <= 80);
  assert.ok(new Set(r.events.map((e) => e.id)).size === r.events.length);
  assert.ok(r.messages.length <= 30);
  assert.ok(r.cautions.length <= 8);
});
test("Un coche girado transversalmente ocupa su longitud real en el ancho de pista", () => {
  const { G, r, a, b } = pair(609);
  a.progress = b.progress;
  a.lateral = 0;
  b.lateral = 2.4;
  a.headingSlip = Math.PI / 2;
  a.speed = 30;
  b.speed = 20;
  G.Race.resolveContacts(r);
  assert.equal(a.collisionCount, 1);
  const da = G.Race.dimensions(a),
    db = G.Race.dimensions(b);
  assert.ok(
    Math.abs(a.lateral - b.lateral) >= (da.lateral + db.lateral) / 2 ||
      Math.abs(a.progress - b.progress) >=
        (da.longitudinal + db.longitudinal) / 2,
  );
  assert.ok(r.events.some((e) => e.type === "contact" || e.type === "crash"));
});
test("Una colisión en cadena separa también al tercer coche sin registrar golpes repetidos", () => {
  const { G, s, r } = grid(611);
  r.entrants = r.entrants.slice(0, 3);
  for (const [i, a] of r.entrants.entries()) {
    a.progress = 100 + i;
    a.lateral = 0;
    a.speed = 30 - i * 5;
  }
  G.Race.resolveContacts(r);
  for (let i = 0; i < r.entrants.length; i++)
    for (const b of r.entrants.slice(i + 1)) {
      const a = r.entrants[i],
        da = G.Race.dimensions(a),
        db = G.Race.dimensions(b);
      assert.ok(
        Math.abs(G.Race.relative(a, b, G.Data.tracks[r.track].length)) >=
          (da.longitudinal + db.longitudinal) / 2 ||
          Math.abs(a.lateral - b.lateral) >= (da.lateral + db.lateral) / 2,
        "Un tercero no puede volver a empujar coches ya resueltos a través de su carrocería",
      );
    }
  const damage = r.entrants.map((a) => a.damage);
  G.Race.resolveContacts(r);
  assert.deepEqual(
    r.entrants.map((a) => a.damage),
    damage,
  );
  G.Storage.validate(s);
});
test("Habilidad de adelantamiento: prepara antes una maniobra limpia con el mismo coche y ritmo", () => {
  const original = pair(612);
  function maneuver(overtake) {
    const s = original.G.clone(original.s),
      r = s.race,
      [a, b] = r.entrants,
      G = original.G;
    a.companyId = s.playerId;
    a.progress = 100;
    b.progress = 118;
    a.lateral = b.lateral = 0;
    a.speed = 37;
    b.speed = 32;
    a.hp = 180;
    a.top = 220;
    a.paceFactor = 1;
    a.stats.control = 70;
    a.stats.pace = 75;
    a.stats.consistency = 95;
    a.stats.overtake = overtake;
    a.mode = "attack";
    b.hp = 145;
    b.top = 205;
    b.paceFactor = 1;
    b.stats.pace = 60;
    b.stats.defense = 70;
    let passedAt = null;
    for (let n = 0; n < 500; n++) {
      G.Race.tick(s);
      if (a.overtakeCount) {
        passedAt = r.time;
        break;
      }
    }
    assert.ok(
      passedAt !== null,
      "Ambos pueden superar al coche más lento cuando aparece hueco",
    );
    assert.equal(
      a.collisionCount,
      0,
      "El adelantamiento depende del espacio, no de empujar al rival",
    );
    return passedAt;
  }
  assert.ok(
    maneuver(90) < maneuver(10) - 1,
    "La habilidad permite resolver la misma disputa antes sin aumentar potencia ni velocidad punta",
  );
});
