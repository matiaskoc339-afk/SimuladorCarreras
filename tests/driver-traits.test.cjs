const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game() {
  const { G } = engine({ traits: true });
  return { G, s: G.createGame("Pilotos con carácter", "", 1470) };
}
function race() {
  const { G, s } = game(),
    e = G.nextEvent(s);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id, true);
  return { G, s, r: s.race, a: s.race.entrants[0] };
}
function only(a, id) {
  a.abilities.ids = [id];
  a.abilities.active = [id];
  a.abilities.nextUpdate = 0;
}
test("Las 108 habilidades tienen relatos sin porcentajes ni sumas; incluyen defectos", () => {
  const { G } = game(),
    defs = G.DriverAbilities.catalog;
  assert.equal(defs.length, 108);
  assert.equal(new Set(defs.map((d) => d.name)).size, 108);
  assert.ok(
    defs.every(
      (d) => d.description.length > 80 && !/[0-9%]/.test(d.description),
    ),
  );
  assert.equal(defs.filter((d) => d.tone === "defecto").length, 12);
  assert.equal(
    new Set(defs.filter((d) => d.profile).map((d) => d.profile)).size,
    8,
  );
});
test("Una habilidad es lo normal, dos raras y tres excepcionales; sin consumir RNG del mundo", () => {
  const { G, s } = game(),
    rng = s.rng,
    counts = [0, 0, 0, 0];
  for (let i = 0; i < 10000; i++) {
    const ids = G.DriverAbilities.seeded(s, { id: "nuevo-" + i });
    counts[ids.length]++;
    assert.equal(ids.length, new Set(ids).size);
  }
  assert.ok(counts[1] > 8700 && counts[1] < 9300, counts.join("/"));
  assert.ok(counts[2] > 700 && counts[2] < 1200);
  assert.ok(counts[3] > 10 && counts[3] < 100);
  assert.equal(s.rng, rng);
});
test("Actualizar conserva el primer rasgo, contratos, coches, dinero y RNG; no repite la migración", () => {
  const { G } = engine({ grand: true }),
    s = G.createGame("Anterior", "", 1470),
    old = json(s);
  G.DriverTraits.initialize(s);
  for (const [id, ids] of Object.entries(old.driverWorld.talents))
    assert.equal(s.driverWorld.talents[id][0], ids[0]);
  assert.deepEqual(json(s.cars), old.cars);
  assert.deepEqual(json(s.drivers), old.drivers);
  assert.equal(s.rng, old.rng);
  assert.deepEqual(json(s.companies), old.companies);
  const raw = JSON.stringify(s);
  G.DriverTraits.initialize(s);
  assert.equal(JSON.stringify(s), raw);
  G.Storage.validate(s);
});
test("Los rasgos nuevos cambian decisiones sin sumar atributos; la carrera antigua conserva su cálculo", () => {
  const { G, s, r, a } = race();
  only(a, "clear-control");
  for (const o of r.entrants) if (o !== a) o.progress = a.progress - 100;
  G.DriverAbilities.before(s, r, a);
  assert.deepEqual(json(a.stats), json(a.abilities.baseStats));
  assert.ok(a.abilities.active.includes("clear-control"));
  delete r.traitVersion;
  a.abilities.nextUpdate = 0;
  G.DriverAbilities.before(s, r, a);
  assert.equal(
    a.stats.control,
    Math.min(100, a.abilities.baseStats.control + 5),
  );
});
test("Conservar gomas tiene un coste real de ritmo; el nerviosismo puede hacer perder tiempo", () => {
  const { G, r, a } = race(),
    c = { front: null, rear: null, yellow: false, corner: 0 };
  a.skills.envelope.driver = 40;
  a.top = 200;
  only(a, "clear-tires");
  let result = G.DriverAbilities.tactic(r, a, c, {
    target: 20,
    lateral: 0,
    passing: false,
  });
  assert.ok(Math.abs(result.target - 18.8) < 1e-9);
  assert.equal(G.DriverAbilities.wear(a), 0.8);
  only(a, "clear-focus");
  let hesitated = false;
  for (let t = 0; t < 15; t++) {
    r.time = t;
    result = G.DriverAbilities.tactic(r, a, c, {
      target: 20,
      lateral: 0,
      passing: true,
    });
    if (result.target < 20) {
      hesitated = true;
      assert.equal(result.passing, false);
    }
  }
  assert.equal(hesitated, true);
});
test("El carácter respeta amarillas, pinchazos y el límite físico", () => {
  const { G, r, a } = race();
  only(a, "clear-tires");
  const result = { target: 4, lateral: 0, passing: false };
  assert.deepEqual(
    G.DriverAbilities.tactic(r, a, { yellow: true }, { ...result }),
    result,
  );
  a.puncture = true;
  assert.deepEqual(
    G.DriverAbilities.tactic(r, a, { yellow: false }, { ...result }),
    result,
  );
  a.puncture = false;
  a.skills.envelope.driver = 3;
  assert.ok(
    G.DriverAbilities.tactic(
      r,
      a,
      { yellow: false, front: null, rear: null, corner: 0 },
      { target: 20, lateral: 0, passing: false },
    ).target <= 3,
  );
});
test("Un atacante busca un carril seguro, pero obedece la orden de seguir", () => {
  const { G, r, a } = race(),
    b = r.entrants.find((o) => o !== a);
  only(a, "traffic-brakes");
  a.stats.control = 90;
  a.stats.overtake = 90;
  a.skills.envelope.driver = 40;
  a.skills.driverTarget = 30;
  a.directive.plan.risk = 70;
  a.directive.plan.tactic = "auto";
  r.trackWidth = 14;
  for (const o of r.entrants) if (o !== a) o.progress = a.progress - 500;
  b.progress = a.progress + 12;
  b.lateral = 0;
  const c = { front: { b, gap: 12 }, rear: null, yellow: false, corner: 0 };
  let result = G.DriverAbilities.tactic(r, a, c, {
    target: 20,
    lateral: 0,
    passing: false,
  });
  assert.equal(result.passing, true);
  a.directive.plan.tactic = "follow";
  result = G.DriverAbilities.tactic(r, a, c, {
    target: 20,
    lateral: 0,
    passing: false,
  });
  assert.equal(result.passing, false);
});
test("Guardar durante una carrera conserva los rasgos, sus decisiones y el resultado", () => {
  const { G, s, r } = race();
  G.Race.tick(s, 200);
  G.Storage.validate(s);
  const copy = json(s);
  for (const state of [s, copy]) {
    for (let i = 0; i < 1000 && !state.race.finished; i++)
      G.Race.tick(state, 100);
    assert.ok(state.race.finished);
    G.Race.finish(state);
    G.Storage.validate(state);
  }
  assert.deepEqual(json(s), json(copy));
});
