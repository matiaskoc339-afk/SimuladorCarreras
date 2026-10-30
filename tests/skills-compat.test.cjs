const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { engine } = require("./helpers.cjs");
test("Una carrera auténtica 0.14 termina con sus resultados y estado completo originales", () => {
  const { G } = engine({ skills: true }),
    read = (file) =>
      fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8"),
    s = G.Storage.unpack(read("v140-race.json")).state,
    expected = JSON.parse(read("v140-expected.json"));
  assert.equal(s.raceSkills, undefined);
  assert.equal(s.race.directorVersion, 1);
  assert.equal(s.race.skillsVersion, undefined);
  assert.throws(() => G.RaceSkills.initialize(s), /Termina la actividad/);
  for (let n = 0; n < 300 && !s.race.finished; n++) G.Race.tick(s, 400);
  assert.equal(s.race.finished, true);
  const results = G.Race.finish(s);
  assert.deepEqual(JSON.parse(JSON.stringify(results)), expected.results);
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(s)).digest("hex"),
    expected.stateSHA256,
  );
  G.Storage.validate(s);
  const before = JSON.parse(JSON.stringify(s));
  G.RaceSkills.initialize(s);
  const copy = JSON.parse(JSON.stringify(s));
  delete copy.raceSkills;
  assert.deepEqual(copy, before);
  G.Storage.validate(s);
});
