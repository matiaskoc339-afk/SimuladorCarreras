/* Temporada 0.7: ingresos, contratos, reparaciones, puntos y matrículas reales.
   No inyecta financiación ni estadísticas; omite las pruebas inaccesibles. */
const { engine } = require("../tests/helpers.cjs");
const assert = require("node:assert/strict");
const { G } = engine({ competitions: true });
const seed = Number(process.argv[2] || 1470),
  s = G.createGame("Del asfalto al circuito", "", seed);
const d = s.drivers
    .filter((d) => !d.companyId)
    .sort((a, b) => a.ask - b.ask)[0],
  car = G.ownedCars(s)[0];
G.Drivers.offer(s, d.id, d.ask, 12);
const metrics = [];
function manual(a, r) {
  if (!a.pit.manual || a.pit.manual.phase === "done") return;
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
while (G.nextEvent(s)) {
  const e = G.nextEvent(s);
  while (s.day < e.day) {
    if (
      !car.repair &&
      !s.job &&
      G.Facilities.workload(s) < G.Facilities.bays(s)
    ) {
      if (
        e.day - s.day >= 5 &&
        car.condition < 76 &&
        G.player(s).balance > G.Workshop.repairQuote(car, "all") + 1000
      )
        G.Workshop.repair(s, car.id, "all");
      else if (s.day - s.lastJob >= 7) G.Economy.job(s);
    }
    if (
      !s.competitions.licenses.player &&
      s.competitions.streetPoints.player >= 24 &&
      G.player(s).balance > 2500
    )
      G.Competition.license(s);
    G.Calendar.advance(s, 1);
    assert.equal(s.status, "active", "La ruta prudente debe poder sobrevivir");
  }
  if (car.tires < 35 && !car.repair && !s.job) G.Economy.tires(s, car.id);
  const reason =
    G.Competition.registrationReason(s, e) ||
    G.Competition.technical(s, e, car, d) ||
    (!G.Workshop.ready(car) ? "Mantenimiento pendiente" : "") ||
    (!G.Professionals.fit(s, d.id) ? "Piloto en recuperación" : "");
  let own = null,
    a = null;
  if (
    !reason &&
    !car.repair &&
    G.player(s).balance > G.Competition.fee(e) + 650
  ) {
    G.Race.register(s, e.id, d.id, car.id, {
      compound: e.cup === "street" ? "road" : "fortis-hard",
    });
    G.Race.start(s, e.id);
    const r = s.race;
    a = r.entrants.find((a) => a.companyId === "player");
    G.Race.order(s, "save");
    for (let i = 0; !r.finished && i < 500; i++) {
      const left =
          G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps -
          a.progress,
        need = G.Driving.pitNeed(s, r, a);
      if (
        !a.dnf &&
        a.finishTime === null &&
        a.pit.phase === "none" &&
        left > 500 &&
        (need.tires || need.fuel)
      )
        G.RaceWeekend.requestPit(s, "player", {
          compound: "fortis-hard",
          fuel: need.fuel ? 3 : 0,
          repair: false,
          limiter: true,
        });
      manual(a, r);
      G.Race.tick(s, 400);
    }
    assert.ok(r.finished, "Carrera terminada sin bucle");
    const rows = G.Race.finish(s);
    own = rows.find((row) => row.companyId === "player");
  } else G.Race.skip(s, e.id);
  G.Storage.validate(s);
  metrics.push({
    cup: e.cup,
    round: e.round,
    final: e.final,
    day: s.day,
    entrants: e.results.length,
    balance: G.player(s).balance,
    position: own?.position || null,
    dnf: own?.dnf || false,
    stops: a?.pitStops || 0,
    tires: a ? Math.round(a.tires) : null,
    reason: own ? "" : reason || "Reserva de caja o coche ocupado",
    streetPoints: s.competitions.streetPoints.player,
    regionalPoints: s.competitions.proPoints.player,
    active: s.companies.filter((c) => c.status === "active").length,
  });
  console.log(JSON.stringify(metrics.at(-1)));
}
assert.equal(s.season.phase, "complete");
assert.equal(metrics.length, 20);
assert.equal(s.history.length, 1);
assert.ok(
  metrics.filter((m) => m.cup === "street").every((m) => m.entrants >= 4),
  "Escena callejera poblada",
);
assert.ok(
  metrics
    .filter((m) => m.cup === "pro" && !m.final)
    .every((m) => m.entrants >= 3),
  "Parrilla regional viable",
);
const points = s.competitions.streetPoints.player,
  license = s.competitions.licenses.player;
G.Calendar.nextSeason(s);
G.Storage.validate(s);
assert.equal(G.Competition.score(s, "player", "street"), 0);
assert.equal(s.competitions.streetPoints.player, points);
assert.equal(s.competitions.licenses.player, license);
require("node:fs").mkdirSync("test-results", { recursive: true });
require("node:fs").writeFileSync(
  "test-results/balance-070-" + seed + ".json",
  JSON.stringify(
    {
      seed,
      dailyWage: d.contract?.salary,
      metrics,
      totals: s.totals,
      license,
      champions: s.history[0].cups,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    seed,
    completed: metrics.length,
    license,
    nextYear: s.season.year,
    balance: G.player(s).balance,
    champions: s.history[0].cups,
  }),
);
