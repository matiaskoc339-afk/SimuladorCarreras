const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  { engine } = require("./helpers.cjs");
function game() {
  const { G } = engine({ life: true });
  return { G, s: G.createGame("Ligas independientes", "", 1470) };
}
test("La licencia utiliza exclusivamente puntos callejeros, cobra una vez y no gasta puntos de ninguna liga", () => {
  const { G, s } = game();
  for (const cup of ["street", "pro", "national"]) {
    s.season.cups[cup].standings.player.points = 100;
    s.season.cups[cup].standings.player.qualifying = 80;
  }
  s.season.standings.player.points = 300;
  s.competitions.proPoints.player = 200;
  s.competitions.streetPoints.player = 23;
  const before = JSON.stringify(s),
    q = G.Competition.licenseStatus(s);
  assert.equal(q.missing, 1);
  assert.match(q.reason, /Solo cuentan.*Callejera/);
  assert.throws(() => G.Competition.license(s), /te faltan 1/);
  assert.equal(JSON.stringify(s), before);
  s.competitions.streetPoints.player = 24;
  const cash = G.player(s).balance,
    boards = JSON.stringify(s.season.cups);
  G.Competition.license(s);
  assert.equal(G.player(s).balance, cash - 900);
  assert.equal(s.competitions.streetPoints.player, 24);
  assert.equal(JSON.stringify(s.season.cups), boards);
  const licensed = JSON.stringify(s);
  assert.throws(() => G.Competition.license(s), /Ya tienes/);
  assert.equal(JSON.stringify(s), licensed);
  G.Storage.validate(s);
});
test("Regional y Nacional exigen licencia, incluso con suficientes puntos en cualquier clasificación", () => {
  const { G, s } = game();
  s.competitions.streetPoints.player = 999;
  s.competitions.proPoints.player = 999;
  for (const cup of ["street", "pro", "national"])
    Object.assign(s.season.cups[cup].standings.player, {
      points: 999,
      qualifying: 999,
    });
  for (const event of s.season.events.filter((e) => e.cup !== "street"))
    assert.match(G.Competition.eligible(s, event), /licencia profesional/);
  assert.equal(
    G.Competition.eligible(
      s,
      s.season.events.find((e) => e.cup === "street" && !e.final),
    ),
    "",
  );
  G.Competition.license(s);
  for (const event of s.season.events.filter((e) => e.cup !== "street"))
    assert.equal(G.Competition.eligible(s, event), "");
});
test("La inscripción profesional y el inicio de una prueba sin licencia se rechazan antes de cobrar o consumir RNG", () => {
  const { G, s } = game();
  G.player(s).balance = 200000;
  const d = s.drivers
      .filter((d) => !d.companyId)
      .sort((a, b) => a.ask - b.ask)[0],
    car = G.ownedCars(s)[0],
    event = s.season.events.find((e) => e.cup === "pro" && !e.final);
  G.Drivers.offer(s, d.id, d.ask, 12);
  for (const key of G.Drivers.stats) d.stats[key] = 60;
  for (const key of Object.keys(car.components)) car.components[key] = 100;
  G.Workshop.recalculate(s, car);
  s.day = event.day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  let before = JSON.stringify(s);
  assert.throws(() => G.Race.register(s, event.id, d.id, car.id), /licencia/);
  assert.equal(JSON.stringify(s), before);
  s.competitions.streetPoints.player = 24;
  G.Competition.license(s);
  G.Race.register(s, event.id, d.id, car.id);
  // A loaded/altered entry never bypasses the license check at the start.
  s.competitions.licenses.player = false;
  before = JSON.stringify(s);
  assert.throws(() => G.Race.start(s, event.id), /licencia profesional/);
  assert.equal(JSON.stringify(s), before);
});
test("Las finales solo admiten puntos clasificatorios de su propia liga y la Nacional conserva su requisito regional", () => {
  const { G, s } = game(),
    regional = s.season.events.find((e) => e.cup === "pro" && e.final),
    national = s.season.events.find((e) => e.cup === "national" && e.final);
  s.competitions.licenses.player = true;
  s.season.cups.street.standings.player.points = 999;
  s.season.cups.street.standings.player.qualifying = 999;
  Object.assign(s.season.cups.pro.standings.player, {
    points: 17,
    qualifying: 17,
  });
  assert.match(
    G.Competition.eligible(s, regional),
    /Regional.*te faltan 1.*otras ligas/s,
  );
  s.season.cups.pro.standings.player.points =
    s.season.cups.pro.standings.player.qualifying = 18;
  assert.equal(G.Competition.eligible(s, regional), "");
  Object.assign(s.season.cups.national.standings.player, {
    points: 18,
    qualifying: 18,
  });
  assert.match(G.Competition.eligible(s, national), /12 puntos.*regional/);
  s.competitions.proPoints.player = 12;
  assert.equal(G.Competition.eligible(s, national), "");
  s.season.cups.national.standings.player.qualifying = 17;
  assert.match(G.Competition.eligible(s, national), /Nacional.*te faltan 1/);
});
test("Al cambiar de temporada se separan los marcadores nuevos y se conservan licencia y trayectorias", () => {
  const { G, s } = game();
  s.competitions.streetPoints.player = 30;
  G.Competition.license(s);
  s.competitions.proPoints.player = 20;
  const season = G.makeSeason(s, 2027);
  for (const cup of Object.keys(G.Competition.rules)) {
    assert.equal(season.cups[cup].standings.player.points, 0);
    assert.equal(season.cups[cup].standings.player.qualifying, 0);
  }
  assert.equal(s.competitions.licenses.player, true);
  assert.equal(s.competitions.streetPoints.player, 30);
  assert.equal(s.competitions.proPoints.player, 20);
});
test("Una carrera guardada reparte sus puntos solo a la liga disputada", () => {
  const { G } = engine({ life: true }),
    s = G.Storage.unpack(
      fs.readFileSync("tests/fixtures/v110-race.json", "utf8"),
    ).state,
    r = s.race,
    cup = r.cup;
  const before = Object.fromEntries(
    Object.keys(G.Competition.rules).map((key) => [
      key,
      JSON.stringify(s.season.cups[key]),
    ]),
  );
  while (!r.finished) G.Race.tick(s, 500);
  const results = G.Race.finish(s);
  for (const key of Object.keys(G.Competition.rules))
    if (key !== cup)
      assert.equal(JSON.stringify(s.season.cups[key]), before[key]);
  for (const row of results)
    assert.equal(
      s.season.cups[cup].standings[row.companyId].points,
      JSON.parse(before[cup]).standings[row.companyId].points + row.points,
    );
  G.Storage.validate(s);
});
test("El archivo de pilotos calcula una tabla por liga sin mezclar al mismo piloto entre copas", () => {
  const { G } = game(),
    events = [
      {
        cup: "street",
        results: [
          {
            driverId: "d",
            name: "Piloto",
            points: 15,
            position: 1,
            dnf: false,
          },
        ],
      },
      {
        cup: "pro",
        results: [
          { driverId: "d", name: "Piloto", points: 8, position: 4, dnf: false },
        ],
      },
      {
        cup: "national",
        results: [
          { driverId: "d", name: "Piloto", points: 6, position: 5, dnf: false },
        ],
      },
    ];
  assert.equal(G.Competition.driverBoard(events, "street")[0].points, 15);
  assert.equal(G.Competition.driverBoard(events, "pro")[0].points, 8);
  assert.equal(G.Competition.driverBoard(events, "national")[0].points, 6);
});
