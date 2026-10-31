const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
test("Todos los nombres del catálogo tienen un retrato coherente", () => {
  const { G } = engine({ traits: true });
  for (const name of G.Data.firstNames) {
    const d = {
        id: "test-" + name,
        name: name + " Navarro",
        age: 27,
        trait: 0,
      },
      female = G.DriverAppearance.femaleNames.has(name);
    assert.ok(female || G.DriverAppearance.maleNames.has(name), name);
    const svg = G.Art.portrait(d);
    assert.ok(
      svg.includes(`data-gender="${female ? "female" : "male"}"`),
      name,
    );
    if (female) assert.ok(svg.includes('data-beard="false"'));
  }
});
test("Los CV nuevos incluyen ambos géneros y mantienen el nombre y la imagen emparejados", () => {
  const { G } = engine({ traits: true }),
    s = G.createGame("Retratos", "", 1470);
  let female = 0,
    male = 0;
  for (let i = 0; i < 200; i++) {
    const d = G.Drivers.generate(s, null),
      gender = G.DriverAppearance.gender(d);
    if (gender === "female") female++;
    else male++;
    assert.ok(G.Art.portrait(d).includes(`data-gender="${gender}"`));
  }
  assert.ok(female > 50 && male > 50);
});
test("Las mujeres tienen distintos retratos y ocho peinados, sin modificar la partida al dibujarlas", () => {
  const { G } = engine({ traits: true }),
    s = G.createGame("Variación", "", 1470),
    before = JSON.stringify(s),
    styles = new Set(),
    portraits = new Set();
  for (let i = 0; i < 150; i++) {
    const d = {
        id: "female-" + i,
        identity: i * 9871,
        name: "Valentina Navarro",
        age: 20 + (i % 30),
        trait: i % 4,
      },
      svg = G.Art.portrait(d);
    styles.add(svg.match(/data-hair-style="(\d+)"/)[1]);
    portraits.add(svg);
    assert.equal(svg, G.Art.portrait(d));
    assert.ok(svg.includes('data-beard="false"'));
  }
  assert.equal(styles.size, 8);
  assert.equal(portraits.size, 150);
  assert.equal(JSON.stringify(s), before);
});
test("La corrección visual se aplica a nombres de guardados anteriores sin renombrar ni alterar sus datos", () => {
  const { G } = engine({ traits: true });
  const d = {
    id: "anterior",
    name: "Lucía Ferrer",
    gender: "male",
    age: 32,
    trait: 1,
  };
  const before = JSON.stringify(d);
  assert.equal(G.DriverAppearance.gender(d), "female");
  assert.ok(G.Art.portrait(d).includes('data-gender="female"'));
  assert.equal(JSON.stringify(d), before);
});
