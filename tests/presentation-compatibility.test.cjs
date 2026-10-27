const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
test("Una carrera auténtica de 0.3 reanudada conserva exactamente su resultado anterior", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v3-race.json"),
      "utf8",
    ),
    original = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.equal(s.race.racingVersion, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(s.race)), original.race);
  while (!s.race.finished) G.Race.tick(s, 400);
  const actual = JSON.parse(JSON.stringify(G.Race.finish(s))),
    expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, "fixtures/v3-results.json"), "utf8"),
    );
  assert.deepEqual(actual, expected);
  G.Storage.validate(s);
});

test("Guardar la nueva carrera rechaza dinámica, eventos o registros de duelos corruptos", () => {
  const { G } = engine(),
    s = G.createGame("Validación de pista", "", 665),
    d = s.drivers.find((d) => !d.companyId),
    e = G.nextEvent(s);
  G.Drivers.offer(s, d.id, d.ask, 12, 0);
  G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  G.Race.tick(s, 800);
  assert.ok(s.race.events.length > 0);
  G.Storage.validate(s);
  for (const mutate of [
    (r) => (r.entrants[0].lateral = NaN),
    (r) => (r.entrants[0].headingSlip = Infinity),
    (r) => {
      r.entrants[0].incident = "spin";
      r.entrants[0].slideSide = 1;
      delete r.entrants[0].incidentStarted;
    },
    (r) => {
      r.entrants[0].incident = "slide";
      delete r.entrants[0].slideSide;
    },
    (r) => (r.entrants[0].errorCooldown = NaN),
    (r) => (r.entrants[0].contactCooldown = Infinity),
    (r) => (r.trackWidth = -1),
    (r) => (r.events[0].carIds = ["missing-car"]),
    (r) => r.events.push({ ...r.events[0] }),
    (r) => (r.cautions = [{ progress: NaN, until: 30 }]),
    (r) =>
      (r.encounterCooldowns.broken = { leader: "missing-car", lastEvent: 1 }),
    (r) => (r.eventCounts.contact = -1),
  ]) {
    const copy = G.clone(s);
    mutate(copy.race);
    assert.throws(() => G.Storage.validate(copy));
  }
  assert.deepEqual(
    JSON.parse(JSON.stringify(G.Storage.unpack(G.Storage.pack(s)).state)),
    JSON.parse(JSON.stringify(s)),
  );
});
