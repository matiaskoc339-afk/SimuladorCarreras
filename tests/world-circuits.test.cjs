const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ tour: true });
  return { G, s: G.createGame("Gira internacional", "", seed) };
}
test("68 circuitos modernos en 13 países; 36 sedes nuevas con categoría y dificultad propias", () => {
  const { G, s } = game();
  assert.equal(G.Circuits.indices().length, 68);
  assert.equal(G.WorldCircuits.added.length, 36);
  assert.equal(Object.keys(G.WorldCircuits.countries).length, 13);
  assert.equal(
    new Set(G.WorldCircuits.added.map((i) => G.Data.tracks[i].country)).size,
    12,
  );
  assert.equal(G.player(s).balance, 4200);
  assert.deepEqual(json(s), json(G.createGame("Gira internacional", "", 1470)));
  for (const [code, name] of Object.entries(G.WorldCircuits.countries)) {
    const tracks = G.WorldCircuits.indices(code).map((i) => G.Data.tracks[i]);
    assert.ok(tracks.length >= 3);
    assert.ok(
      tracks.every((t) => t.countryName === name && t.city && t.inspiration),
    );
    for (const cup of ["street", "pro", "national"])
      assert.ok(tracks.some((t) => t.cups.includes(cup)));
  }
  assert.equal(
    new Set(G.WorldCircuits.added.map((i) => G.Data.tracks[i].difficulty)).size,
    4,
  );
  G.Storage.validate(s);
});
test("Cada año cambia sus veinte sedes y finales, sin duplicados y con categorías correctas", () => {
  const { G } = game();
  for (let seed = 1; seed <= 40; seed++) {
    let previous = new Set();
    for (let year = 2026; year < 2046; year++) {
      const tracks = ["street", "pro", "national"].flatMap((cup) => {
        const list = G.SeasonTour.selection(seed, year, cup);
        assert.equal(list.length, { street: 9, pro: 6, national: 5 }[cup]);
        assert.ok(list.every((i) => G.Data.tracks[i].cups.includes(cup)));
        return list;
      });
      assert.equal(new Set(tracks).size, 20);
      assert.ok(
        tracks.every((i) => !previous.has(i)),
        `${seed} ${year}`,
      );
      assert.ok(new Set(tracks.map((i) => G.Data.tracks[i].country)).size >= 5);
      previous = new Set(tracks);
    }
  }
});
test("Cuatro temporadas cubren todo el atlas; la selección es reproducible y depende de la semilla", () => {
  const { G, s } = game(),
    covered = new Set(),
    before = JSON.stringify(s),
    signatures = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const seen = new Set();
    for (let year = 2026; year < 2030; year++)
      for (const cup of ["street", "pro", "national"])
        G.SeasonTour.selection(seed, year, cup).forEach((i) => seen.add(i));
    assert.equal(seen.size, 68);
    signatures.add(
      JSON.stringify(G.SeasonTour.selection(seed, 2027, "street")),
    );
  }
  assert.ok(signatures.size >= 18);
  for (let year = 2026; year < 2030; year++)
    for (const cup of ["street", "pro", "national"])
      G.SeasonTour.selection(s.seed, year, cup).forEach((i) => covered.add(i));
  assert.equal(covered.size, 68);
  assert.equal(JSON.stringify(s), before);
});
test("La temporada inicial conserva la entrada conocida; después abre con la pista más accesible de su selección", () => {
  const { G, s } = game(),
    rank = { Fácil: 0, Intermedia: 1, Difícil: 2, Experta: 3 };
  assert.equal(G.nextEvent(s).track, 6);
  for (let year = 2027; year < 2040; year++) {
    const list = G.SeasonTour.selection(s.seed, year, "street"),
      ranks = list.map((i) => rank[G.Data.tracks[i].difficulty]);
    assert.equal(ranks[0], Math.min(...ranks));
  }
});
test("Renovar las sedes conserva fechas, tasas, clasificación requerida y tres finales", () => {
  const { G, s } = game(),
    legacy = G.createV110Game("Calendario anterior", "", 1470),
    newEvents = s.season.events;
  assert.deepEqual(
    json(
      newEvents.map((e) => [
        e.day,
        e.cup,
        e.round,
        e.final,
        G.Competition.fee(e),
      ]),
    ),
    json(
      legacy.season.events.map((e) => [
        e.day,
        e.cup,
        e.round,
        e.final,
        G.Competition.fee(e),
      ]),
    ),
  );
  assert.equal(newEvents.filter((e) => e.final).length, 3);
  for (const cup of ["street", "pro", "national"])
    assert.match(
      G.Competition.eligible(
        s,
        newEvents.find((e) => e.cup === cup && e.final),
      ),
      /puntos/,
    );
});
test("Actualizar una empresa conserva el calendario en curso; la siguiente temporada abre la nueva gira", () => {
  const { G } = game(),
    s = G.createV110Game("Mi campeonato", "", 1470),
    raw = G.Storage.pack(s),
    snapshot = JSON.stringify(s),
    oldTracks = json(s.season.events.map((e) => e.track));
  assert.deepEqual(json(G.Storage.unpack(raw).state), json(s));
  assert.equal(JSON.stringify(s), snapshot);
  assert.equal(s.seasonTour, undefined);
  G.player(s).balance = 1000000;
  for (const e of s.season.events) e.status = "skipped";
  s.day = s.season.events.at(-1).day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  G.Competition.completeSeason(s);
  const archive = json(s.expansion.archive[0]);
  G.Calendar.nextSeason(s);
  assert.equal(s.season.year, 2027);
  assert.equal(s.season.tourVersion, 1);
  assert.equal(s.seasonTour.sinceYear, 2027);
  assert.ok(s.season.events.every((e) => !oldTracks.includes(e.track)));
  let previous = new Set(s.season.events.map((e) => e.track));
  for (let year = 2028; year < 2038; year++) {
    const next = ["street", "pro", "national"].flatMap((cup) =>
      G.SeasonTour.selection(s.seed, year, cup, s.seasonTour),
    );
    assert.equal(new Set(next).size, 20);
    assert.ok(next.every((i) => !previous.has(i)));
    previous = new Set(next);
  }
  assert.deepEqual(json(s.expansion.archive[0]), archive);
  assert.deepEqual(
    json(s.expansion.archive[0].events.map((e) => e.track)),
    oldTracks,
  );
  G.Storage.validate(s);
});
test("Guardar y cargar no vuelve a elegir sedes, consumir RNG ni alterar inscripciones", () => {
  const { G, s } = game(),
    d = G.Commerce.candidates(s).sort((a, b) => a.ask - b.ask)[0],
    car = G.ownedCars(s)[0],
    e = G.nextEvent(s);
  G.Drivers.offer(s, d.id, d.ask, 12);
  G.Race.register(s, e.id, d.id, car.id);
  const before = json(s),
    packed = G.Storage.pack(s);
  for (let n = 0; n < 4; n++)
    assert.deepEqual(json(G.Storage.unpack(packed).state), before);
  assert.deepEqual(json(s), before);
});
test("La validación rechaza sedes alteradas o repetidas y una versión de gira inválida", () => {
  const { G, s } = game(),
    duplicate = json(s);
  duplicate.season.events[1].track = duplicate.season.events[0].track;
  assert.throws(() => G.Storage.validate(duplicate), /Sede/);
  const corrupt = json(s);
  corrupt.seasonTour.version = 99;
  assert.throws(() => G.Storage.validate(corrupt), /gira/);
  const missing = json(s);
  delete missing.seasonTour;
  assert.throws(() => G.Storage.validate(missing), /gira/);
  assert.throws(
    () => G.SeasonTour.selection(s.seed, Infinity, "street"),
    /Año/,
  );
});
test("Geometrías cerradas, sin cruces, segmentos degenerados ni un ramal de boxes sobre el circuito", () => {
  const { G } = game(),
    shapes = new Set();
  for (const i of G.WorldCircuits.added) {
    const t = G.Data.tracks[i],
      pts = G.Race.track(i),
      pit = G.RaceWeekend.pitLayout(i);
    assert.ok(G.Circuits.validate(i), t.name);
    assert.ok(t.length > 2400 && t.length < 7000);
    assert.ok(pts.every((p) => p.segment > 0 && Number.isFinite(p.angle)));
    assert.ok(pit.exit - pit.entry > 300);
    assert.ok(pit.entry > 0 && pit.exit < t.length);
    assert.ok(Math.abs(G.RaceWeekend.pitLateral(i, pit.entry)) < 1e-9);
    assert.ok(
      Math.abs(G.RaceWeekend.pitLateral(i, (pit.entry + pit.exit) / 2)) >
        t.width / 2 + 8,
    );
    const p = G.Racecraft.metric(i, 0),
      q = G.Racecraft.metric(i, t.length);
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) < 1e-7);
    shapes.add(JSON.stringify(t.vertices));
    const boxes = Array.from(
      { length: 9 },
      (_, n) => pit.entry + (pit.exit - pit.entry) * (0.32 + (n / 9) * 0.36),
    );
    assert.ok(boxes.every((d, n) => !n || d - boxes[n - 1] > 10));
  }
  assert.equal(shapes.size, 36);
});
test("Los 36 trazados nuevos completan carreras físicas con desgaste y resultados guardables", () => {
  for (const trackId of game().G.WorldCircuits.added) {
    const { G } = engine({ tour: true }),
      s = G.createV110Game("Verificación física", "", 1470),
      t = G.Data.tracks[trackId],
      cup = t.cups[0],
      e = s.season.events.find((e) => e.cup === cup && !e.final),
      d = G.Commerce.candidates(s).sort((a, b) => a.ask - b.ask)[0],
      car = G.ownedCars(s)[0];
    G.player(s).balance = 1000000;
    G.Drivers.offer(s, d.id, d.ask, 12);
    d.potential = 95;
    for (const k of G.Drivers.stats) d.stats[k] = 75;
    d.contract.end = e.day + 365;
    for (const k of Object.keys(car.components)) car.components[k] = 100;
    car.oemTires = 100;
    G.Workshop.recalculate(s, car);
    s.competitions.licenses.player = true;
    s.competitions.proPoints.player = 12;
    e.track = trackId;
    s.day = e.day;
    G.Auctions.daily(s);
    G.Commerce.refresh(s);
    G.Race.register(s, e.id, d.id, car.id, {
      compound: cup === "street" ? "road" : "fortis-hard",
    });
    G.Race.start(s, e.id);
    const r = s.race,
      a = r.entrants.find((a) => a.companyId === s.playerId);
    r.entrants = [a];
    r.replay.cars = r.replay.cars.filter((c) => c.carId === a.carId);
    r.replay.frames = [];
    G.RaceWeekend.record(r, true);
    a.fuel = 8;
    G.Race.order(s, "save");
    for (let n = 0; n < 300 && !r.finished; n++) {
      G.Race.tick(s, 400);
      assert.ok(
        Number.isFinite(a.speed) &&
          Number.isFinite(a.progress) &&
          Number.isFinite(a.lateral),
        t.name,
      );
      if (!a.pit)
        assert.ok(
          Math.abs(a.lateral) + a.width / 2 <= t.width / 2 + 0.1,
          t.name,
        );
    }
    assert.ok(r.finished, t.name);
    assert.equal(a.dnf, false, t.name);
    assert.ok(a.finishTime > 0);
    assert.ok(a.tires < 100);
    const rows = G.Race.finish(s);
    assert.equal(rows.length, 1);
    G.Storage.validate(s);
  }
});
test("Una carrera auténtica 0.11 conserva resultado y estado final completos", () => {
  const { G } = game(),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"),
    s = G.Storage.unpack(read("v110-race.json")).state;
  assert.equal(s.seasonTour, undefined);
  for (let n = 0; n < 300 && !s.race.finished; n++) G.Race.tick(s, 400);
  assert.ok(s.race.finished);
  const results = G.Race.finish(s);
  assert.deepEqual(json(results), JSON.parse(read("v110-results.json")));
  assert.deepEqual(json(s), JSON.parse(read("v110-finished.json")));
  G.Storage.validate(s);
});
