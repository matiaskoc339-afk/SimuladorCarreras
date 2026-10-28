/* Una temporada con las reglas actuales, sin financiación ni resultados inyectados. */
const { engine } = require("../tests/helpers.cjs");
const assert = require("node:assert/strict");
const { G } = engine({ current: true });
const seed = Number(process.argv[2] || 1364),
  s = G.createGame("Supervivencia", "", seed);
const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0],
  car = G.ownedCars(s)[0];
G.Drivers.offer(s, d.id, d.ask, 12);
const metrics = [];
for (let round = 0; round < 6; round++) {
  const e = G.nextEvent(s);
  while (s.day < e.day) {
    if (!s.job && s.day - s.lastJob >= 7) G.Economy.job(s);
    G.Calendar.advance(s, 1);
  }
  G.Race.register(s, e.id, d.id, car.id, { compound: "fortis-hard" });
  G.Race.start(s, e.id);
  const r = s.race,
    a = r.entrants.find((a) => a.companyId === s.playerId);
  G.Race.order(s, "save");
  let iterations = 0;
  while (!r.finished && iterations++ < 300) {
    const left =
      G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps - a.progress;
    if (
      a.finishTime === null &&
      !a.dnf &&
      a.pit.phase === "none" &&
      (a.tires < 25 || G.RaceWeekend.grip(r, a) < 0.65) &&
      left > 300
    ) {
      G.RaceWeekend.requestPit(s, s.playerId, {
        compound: G.RaceWeekend.bestCompound(r),
        fuel: 0,
        repair: false,
        limiter: true,
      });
    }
    if (a.pit.manual && a.pit.manual.phase !== "done") {
      const act = (action, w) => {
        while (r.time + 0.0001 < a.pit.manual.readyAt) G.Race.tick(s, 1);
        G.PitCrew.action(s, action, w);
      };
      act("lift");
      for (let w = 0; w < 4; w++) {
        act("select", w);
        for (let n = 0; n < 4; n++) act("loosen");
        act("remove");
        act("fit");
        for (let n = 0; n < 4; n++) act("tighten");
      }
      act("lower");
      act("check");
    }
    G.Race.tick(s, 300);
  }
  assert.ok(r.finished, "La carrera debe terminar");
  const rows = G.Race.finish(s),
    own = rows.find((row) => row.companyId === s.playerId);
  G.Storage.validate(s);
  metrics.push({
    day: s.day,
    entrants: r.entrants.length,
    balance: G.player(s).balance,
    position: own.position,
    dnf: own.dnf,
    stops: a.pitStops,
    engine: Math.round(car.components.engine),
    overtakes: r.events.filter((e) => e.type === "overtake").length,
  });
  console.log(`Ronda ${round + 1}: ${JSON.stringify(metrics.at(-1))}`);
}
assert.equal(G.player(s).status, "active");
assert.equal(s.season.phase, "complete");
if (seed === 1364) {
  assert.ok(metrics.every((m) => m.entrants === 8));
  assert.equal(s.companies.filter((c) => c.status === "active").length, 8);
}
console.log(
  JSON.stringify(
    { seed, dailyWage: d.contract.salary, metrics, totals: s.totals },
    null,
    2,
  ),
);
