const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1364) {
  const { G } = engine({ current: true });
  return { G, s: G.createGame("Aster Desafío", "", seed) };
}
function hire(G, s) {
  const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0];
  assert.equal(G.Drivers.offer(s, d.id, d.ask, 3).accepted, true);
  return d;
}
function grid(seed = 1364, compound = "fortis-hard") {
  const { G, s } = game(seed),
    d = hire(G, s),
    c = G.ownedCars(s)[0],
    e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, c.id, { compound });
  G.Calendar.advance(s, e.day - s.day);
  G.Race.start(s, e.id);
  return {
    G,
    s,
    d,
    c,
    e,
    r: s.race,
    a: s.race.entrants.find((a) => a.companyId === s.playerId),
  };
}
function finish(G, s) {
  let n = 0;
  while (!s.race.finished && n++ < 200) G.Race.tick(s, 300);
  assert.ok(s.race.finished);
  return G.Race.finish(s);
}
test("0.6.4: inicio reproducible, $4200 y candidatos modestos en 30 semillas", () => {
  const { G, s } = game();
  assert.deepEqual(json(s), json(G.createGame("Aster Desafío", "", 1364)));
  const starters = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const x = G.createGame("Muestra", "", seed);
    assert.equal(G.player(x).balance, 4200);
    assert.equal(x.drivers.filter((d) => !d.companyId).length, 12);
    for (const d of x.drivers.filter((d) => !d.companyId))
      assert.ok(G.Drivers.rating(d) >= 10 && G.Drivers.rating(d) <= 25);
    starters.add(G.ownedCars(x)[0].modelIndex);
    G.Storage.validate(x);
  }
  assert.equal(starters.size, 5);
});
test("Identidades: 500 nombres/retratos distintos, atributos, países, edades y temperamentos variados; dibujar no consume azar", () => {
  const { G, s } = game();
  const ds = [];
  for (let i = 0; i < 500; i++) {
    const d = G.Drivers.generate(s, null);
    s.drivers.push(d);
    ds.push(d);
  }
  assert.equal(new Set(s.drivers.map((d) => d.name)).size, s.drivers.length);
  assert.equal(
    new Set(s.drivers.map((d) => d.identity)).size,
    s.drivers.length,
  );
  const before = JSON.stringify(s),
    faces = ds.map((d) =>
      G.Art.portrait(d)
        .replace(/data-portrait="[^"]*"/, "")
        .replace(/aria-label="[^"]*"/g, ""),
    );
  assert.equal(new Set(faces).size, 500);
  assert.equal(JSON.stringify(s), before);
  assert.ok(new Set(ds.map((d) => d.trait)).size >= 15);
  assert.ok(new Set(ds.map((d) => d.nation)).size >= 18);
  assert.ok(new Set(ds.map((d) => d.age)).size >= 20);
});
test("La progresión atrae pilotos más capaces y el precio diario crece con valoración y experiencia", () => {
  const { G, s } = game();
  G.player(s).level = 7;
  G.player(s).reputation = 60;
  const ds = Array.from({ length: 40 }, () => G.Drivers.generate(s, null));
  assert.ok(ds.some((d) => G.Drivers.rating(d) > 45));
  const d = json(ds[0]);
  for (const k of G.Drivers.stats) d.stats[k] = 20;
  const low = G.Challenge.driverAsk(d);
  for (const k of G.Drivers.stats) d.stats[k] = 50;
  assert.ok(G.Challenge.driverAsk(d) > low * 3);
  assert.ok(G.Challenge.driverAsk(d) * 30 > 5000);
  const tracked = s.drivers.find((x) => !x.companyId);
  for (const key of G.Drivers.stats) tracked.stats[key] = 50;
  G.Challenge.daily(s);
  assert.equal(tracked.ask, G.Challenge.driverAsk(tracked));
  assert.ok(tracked.ask * 30 > 5000);
});
test("24 modelos con carrocerías, medidas y acabados; las 12 familias de piezas tienen dibujos propios", () => {
  const { G, s } = game();
  assert.equal(G.Data.models.length, 24);
  assert.equal(new Set(s.cars.map((c) => c.modelIndex)).size, 24);
  const designs = G.Data.models.map((m, i) =>
    G.Art.carProfile({ ...m, modelIndex: i, color: "#aaa" }),
  );
  assert.ok(new Set(designs.map((p) => p.body)).size >= 15);
  assert.ok(
    new Set(designs.map((p) => p.frontRoof + ":" + p.rearRoof)).size >= 5,
  );
  const slots = new Map();
  for (const d of G.Parts.catalogue) slots.set(d.slot, G.Art.part(d));
  assert.equal(new Set(slots.values()).size, slots.size);
});
test("Sueldos diarios reales: piloto, mecánico y coste de operación se pagan en cada jornada", () => {
  const { G, s } = game(),
    d = hire(G, s),
    e = s.employees.find((e) => e.role === "mechanic");
  const wage = G.Staff.minimum(s, e, { months: 3, bonus: 0 }, s.playerId);
  assert.equal(
    G.Staff.offer(s, e.id, { salary: wage, months: 3, bonus: 0 }).accepted,
    true,
  );
  assert.equal(d.contract.period, "day");
  assert.equal(e.contract.period, "day");
  const cash = G.player(s).balance;
  G.Calendar.advance(s, 1);
  assert.equal(
    G.player(s).balance,
    cash - 18 - d.contract.salary - e.contract.salary,
  );
  assert.equal(d.contract.accrued, 0);
  assert.equal(e.contract.arrears, 0);
  assert.equal(G.Staff.monthly(s), wage * 30);
  G.Storage.validate(s);
});
test("Nivel 6 motivado exige más de $800/día y no se puede contratar sin empresa suficiente", () => {
  const { G, s } = game(),
    e = s.employees.find(
      (e) => e.role === "scout" && G.Professionals.profile(s, e.id).level === 6,
    );
  e.motivation = 90;
  assert.ok(G.Challenge.staffAsk(s, e) > 800);
  const before = JSON.stringify(s);
  assert.throws(
    () => G.Staff.offer(s, e.id, { salary: 2000, months: 3, bonus: 0 }),
    /nivel/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("Las cláusulas de rescisión usan meses de sueldo diario, con prima y devengado separados", () => {
  const { G, s } = game(),
    d = hire(G, s),
    q = G.Drivers.releaseQuote(d);
  assert.equal(q, d.contract.salary * 30);
  assert.equal(G.Pay.monthly(d.contract), d.contract.salary * 30);
});
test("Mercado nuevo cada semana y pérdida de vigencia sin borrar pilotos contratados", () => {
  const { G, s } = game(),
    d = hire(G, s),
    old = s.drivers.find((d) => !d.companyId),
    n = s.drivers.length;
  s.day = 7;
  G.Challenge.daily(s);
  assert.equal(s.drivers.length, n + 2);
  G.Challenge.daily(s);
  assert.equal(s.drivers.length, n + 2);
  s.day = 46;
  assert.equal(!!G.Professionals.available(s, old), false);
  assert.equal(!!G.Professionals.available(s, d), true);
});
test("Suministro: 17 alternativas, marcas duraderas y deportivas con precios y desgaste distintos", () => {
  const { G, s } = game();
  assert.equal(G.Rubber.options(s).length, 17);
  const d = hire(G, s),
    a = { stats: d.stats, tires: 100, tireWear: 1 };
  assert.ok(
    G.Rubber.estimate(a, "fortis-hard") > G.Rubber.estimate(a, "vertice-hard"),
  );
  assert.ok(
    G.RaceWeekend.compounds["vertice-hard"].grip >
      G.RaceWeekend.compounds["fortis-hard"].grip,
  );
  const cash = G.player(s).balance,
    e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id, {
    compound: "nomada-hard",
  });
  assert.equal(
    cash - G.player(s).balance,
    370 + G.Rubber.price(s, "nomada-hard"),
  );
  G.Storage.validate(s);
});
test("Guardado nuevo a mitad de carrera, neumáticos de marca, cerebro y RNG se reanudan exactamente", () => {
  const { G, s } = grid();
  G.Race.tick(s, 700);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 600);
  for (let i = 0; i < 600; i++) G.Race.tick(copy, 1);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(s);
});
test("Desgaste exige estrategia: calle por debajo del umbral antes de acabar, ahorrar prolonga y la lluvia se degrada en seco", () => {
  const { G, r, a } = grid(1364, "road");
  const base = G.Rubber.estimate(a, "road", r.track);
  assert.ok(base < G.Data.tracks[r.track].laps);
  const dry = G.RaceWeekend.wearFactor(r, { ...a, compound: "fortis-wet" });
  r.weather.wetness = 1;
  assert.ok(
    dry > G.RaceWeekend.wearFactor(r, { ...a, compound: "fortis-wet" }),
  );
  const low = G.RaceWeekend.grip(r, {
      ...a,
      compound: "fortis-wet",
      tires: 10,
    }),
    good = G.RaceWeekend.grip(r, { ...a, compound: "fortis-wet", tires: 100 });
  assert.ok(low < good * 0.85);
});
test("Frenada, atención, edad, experiencia y resistencia influyen en la conducción y fatiga", () => {
  const { G, r, a } = grid();
  const low = json(a),
    high = json(a);
  low.stats.brakes = low.stats.focus = low.stats.stamina = 10;
  high.stats.brakes = high.stats.focus = high.stats.stamina = 90;
  low.brain.experience = 0;
  high.brain.experience = 15;
  assert.ok(G.Racecraft.effect(high).braking > G.Racecraft.effect(low).braking);
  assert.ok(
    G.Racecraft.effect(high).reaction < G.Racecraft.effect(low).reaction,
  );
  assert.ok(G.Racecraft.effect(high).pace > G.Racecraft.effect(low).pace);
  G.Racecraft.moved(r, low, 1000, 20);
  G.Racecraft.moved(r, high, 1000, 20);
  assert.ok(low.fatigue > high.fatigue);
  high.brain.age = 60;
  assert.ok(
    G.Racecraft.effect(high).pace <
      G.Racecraft.effect({ ...high, brain: { ...high.brain, age: 30 } }).pace,
  );
});
test("No se fuerza un accidente: el error depende de control, disciplina, concentración, experiencia y presión", () => {
  const { G, a } = grid();
  const good = json(a),
    bad = json(a);
  for (const k of ["control", "consistency", "discipline", "focus"]) {
    good.stats[k] = 95;
    bad.stats[k] = 10;
  }
  good.brain.experience = 18;
  bad.brain.experience = 0;
  assert.ok(G.Race.errorRate(good, 0.8, 1) < G.Race.errorRate(bad, 0.8, 1));
});
test("Todos los circuitos: tangente continua y edificios/público alejados de cualquier tramo", () => {
  const { G } = game();
  for (let i = 0; i < 6; i++) {
    const len = G.Data.tracks[i].length,
      points = G.Race.track(i).map((p) => ({
        x: p.x * G.Race.worldScale(i),
        y: p.y * 0.66 * G.Race.worldScale(i),
      }));
    for (let d = 0; d < len; d += 5) {
      const a = G.Racecraft.metric(i, d),
        b = G.Racecraft.metric(i, d + 0.1);
      assert.ok(
        Math.abs(
          Math.atan2(Math.sin(a.angle - b.angle), Math.cos(a.angle - b.angle)),
        ) < 0.12,
      );
    }
    const pit = G.RaceWeekend.pitLayout(i);
    const pitPoints = Array.from({ length: 49 }, (_, k) => {
      const d = pit.entry + ((pit.exit - pit.entry) * k) / 48;
      return G.Racecraft.metric(i, d, G.RaceWeekend.pitLateral(i, d));
    });
    for (const progress of [0.05, 0.2, 0.4, 0.65, 0.9].map((f) => len * f)) {
      const p = G.Racecraft.safePlacement(i, progress, 52, 15, 1, 28, 17);
      for (let x = -26; x <= 26; x += 6.5)
        for (let y = -7.5; y <= 7.5; y += 5) {
          const px = p.x + x * Math.cos(p.angle) - y * Math.sin(p.angle),
            py = p.y + x * Math.sin(p.angle) + y * Math.cos(p.angle);
          for (const q of pitPoints)
            assert.ok(
              Math.hypot(px - q.x, py - q.y) > 16.5,
              "Tribuna fuera del carril de boxes",
            );
          for (let j = 0; j < points.length; j++) {
            const a = points[j],
              b = points[(j + 1) % points.length],
              dx = b.x - a.x,
              dy = b.y - a.y,
              t = Math.max(
                0,
                Math.min(
                  1,
                  ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy),
                ),
              );
            assert.ok(Math.hypot(px - a.x - t * dx, py - a.y - t * dy) > 16.5);
          }
        }
    }
  }
});
test("Carrera completa: desgaste, lucha, paradas rivales, resultado finito y repetición de marca persistente", () => {
  const { G, s, r, a, c } = grid();
  const engineBefore = a.components.engine;
  const rows = finish(G, s);
  assert.equal(rows.length, 8);
  assert.ok(rows.every((r) => Number.isFinite(r.time)));
  assert.ok(r.entrants.some((a) => a.pitStops > 0));
  assert.ok(r.events.some((e) => ["battle", "overtake"].includes(e.type)));
  assert.ok(c.components.engine < engineBefore);
  G.Storage.validate(s);
  const rec = s.raceSupplies.lastReplay;
  assert.equal(rec.dynamicsVersion, 1);
  assert.ok(
    G.RaceWeekend.playback(rec, rec.duration / 2).entrants.every(
      (a) => G.RaceWeekend.compounds[a.compound],
    ),
  );
});
test("Validación rechaza salarios de unidad incoherente y cerebro corrupto", () => {
  const { G, s, a } = grid();
  a.brain.nextThink = NaN;
  assert.throws(() => G.Storage.validate(s));
  a.brain.nextThink = 0;
  s.drivers[0].salaryPeriod = "month";
  assert.throws(() => G.Storage.validate(s), /salarial/);
});
test("Carrera auténtica 0.6.3 importada conserva resultados y estado completos con sus reglas previas", () => {
  const { G } = engine({ current: true }),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");
  const s = G.Storage.unpack(read("v63-race.json")).state;
  assert.equal(s.challenge, undefined);
  assert.equal(s.race.dynamicsVersion, undefined);
  const rows = finish(G, s);
  assert.deepEqual(json(rows), JSON.parse(read("v63-results.json")));
  assert.deepEqual(json(s), JSON.parse(read("v63-finished.json")));
});
test("Estadísticas en la física: mejor frenada/control ganan distancia con el mismo coche, semilla y órdenes", () => {
  const { G, s, r, a } = grid();
  const other = G.Storage.unpack(G.Storage.pack(s)).state;
  const b = other.race.entrants.find((b) => b.companyId === s.playerId);
  r.entrants = [a];
  other.race.entrants = [b];
  a.stats.brakes = 10;
  a.stats.control = 10;
  a.stats.focus = 10;
  b.stats.brakes = 90;
  b.stats.control = 90;
  b.stats.focus = 90;
  for (const x of [r, other.race]) {
    x.weather.rain = x.weather.wetness = 0;
    x.weather.plan = [
      { time: 0, rain: 0 },
      { time: 10000, rain: 0 },
    ];
  }
  G.Race.tick(s, 3000);
  G.Race.tick(other, 3000);
  assert.ok(b.progress > a.progress * 1.05);
});
test("Rivales: reservas del calendario, trabajo real, última unidad operativa y renovación con aumento diario", () => {
  const { G, s } = game(),
    c = s.companies[1],
    d = G.ownedDrivers(s, c.id)[0];
  assert.ok(
    G.AI.budget(s, c) <= Math.max(0, c.balance - G.Challenge.aiReserve(s, c)),
  );
  c.balance = G.Companies.monthly(s, c.id) * 0.6;
  assert.equal(
    G.AI.candidates(s, c).some((a) => a.action === "venta"),
    false,
    "No liquidar el único coche activo antes de la insolvencia",
  );
  assert.ok(G.AI.candidates(s, c).some((a) => a.action === "servicio"));
  c.balance = G.Companies.monthly(s, c.id) * 3;
  d.contract.end = s.day + 20;
  const salary = d.contract.salary,
    cash = c.balance,
    renew = G.AI.candidates(s, c).find(
      (a) => a.action === "renovación de piloto",
    );
  assert.ok(renew);
  renew.run();
  assert.equal(d.contract.salary, Math.ceil(salary * 1.08));
  assert.equal(d.contract.period, "day");
  assert.equal(d.contract.end, s.day + 380);
  assert.equal(c.balance, cash);
  G.Storage.validate(s);
});
test("Saneamiento rival paga la indemnización y sustituye una nómina inasumible por un contrato local real", () => {
  const { G, s } = game(),
    c = s.companies[1],
    old = G.ownedDrivers(s, c.id)[0];
  c.balance = 6000;
  const salary = old.contract.salary,
    cost = G.Drivers.releaseQuote(old),
    plan = G.Challenge.aiCandidates(s, c)[0];
  assert.ok(plan);
  const newcomer = s.drivers.find((d) => d.id === plan.targetId),
    identity = newcomer.identity;
  plan.run();
  assert.equal(c.balance, 6000 - cost);
  assert.equal(old.companyId, null);
  assert.equal(newcomer.companyId, c.id);
  assert.equal(newcomer.identity, identity);
  assert.ok(newcomer.contract.salary < salary * 0.7);
  assert.equal(newcomer.contract.period, "day");
  G.Storage.validate(s);
});
