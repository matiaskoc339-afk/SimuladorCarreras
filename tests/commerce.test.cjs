const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1470) {
  const { G } = engine({ commerce: true }),
    s = G.createGame("Series y copas", "", seed);
  return { G, s };
}
function weeks(G, s, n = 1) {
  s.day += n * 7;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
}
function rich(G, s) {
  G.player(s).balance = 1000000;
}
function pilot(G, s) {
  const d = G.Commerce.candidates(s).sort((a, b) => a.ask - b.ask)[0];
  G.Drivers.offer(s, d.id, d.ask, 12);
  return d;
}
function podium(G, s, cup = "pro") {
  const e = s.season.events.find((e) => e.cup === cup && e.final);
  e.status = "completed";
  s.day = e.day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  const teams = s.companies.filter((c) => !c.privateer).slice(0, 3);
  e.results = teams.map((c, i) => {
    const d = c.id === s.playerId ? pilot(G, s) : G.ownedDrivers(s, c.id)[0];
    s.season.cups[cup].standings[c.id].qualifying = 18;
    s.season.cups[cup].standings[c.id].points = 18;
    Object.assign(s.season.standings[c.id], {
      points: 15 - i * 3,
      starts: 1,
      wins: i === 0 ? 1 : 0,
      podiums: 1,
    });
    return {
      companyId: c.id,
      driverId: d.id,
      name: d.name,
      position: i + 1,
      dnf: false,
      carId: G.ownedCars(s, c.id)[0].id,
      points: 15 - i * 3,
      team: c.name,
      time: 900 + i,
      prize: 1000 - i * 100,
      bestLap: 90,
    };
  });
  return e;
}
test("Inicio reproducible y difícil: 64 novedades, 16 alojamientos, 12 coches nuevos y CV modestos", () => {
  const { G, s } = game();
  assert.deepEqual(json(s), json(G.createGame("Series y copas", "", 1470)));
  assert.equal(G.player(s).balance, 4200);
  assert.equal(
    G.WeeklyContent.definitions(s).filter((d) => d.weekly).length,
    64,
  );
  assert.equal(
    new Set(
      G.WeeklyContent.definitions(s)
        .filter((d) => d.weekly)
        .map((d) => d.slot),
    ).size,
    16,
  );
  assert.equal(s.market.filter((l) => l.kind === "new").length, 12);
  assert.equal(G.Data.models.length, 88);
  assert.ok(
    G.Commerce.candidates(s).every(
      (d) => G.Drivers.rating(d) >= 10 && G.Drivers.rating(d) <= 25,
    ),
  );
  G.Storage.validate(s);
});
test("El día 7 renueva exactamente una vez; leer el catálogo y abrir vistas no consume RNG", () => {
  const { G, s } = game(),
    before = json(s);
  G.Calendar.advance(s, 6);
  assert.equal(s.commerce.week, 0);
  G.Calendar.advance(s);
  assert.equal(s.commerce.week, 1);
  assert.equal(G.Commerce.candidates(s).length, 12);
  const snap = JSON.stringify(s);
  G.Commerce.refresh(s);
  G.Commerce.initialize(s);
  for (let n = 0; n < 5; n++) G.WeeklyContent.definitions(s);
  assert.equal(JSON.stringify(s), snap);
  const oldIds = new Set(
    before.parts
      .map((p) => p.definitionId)
      .filter((id) => id.startsWith("supply1-")),
  );
  assert.ok(
    s.parts
      .filter((p) => p.definitionId.startsWith("supply1-"))
      .every((p) => !oldIds.has(p.definitionId)),
  );
  G.Storage.validate(s);
});
test("Cincuenta semanas: sin repetir referencias, nombre de CV ni retrato; stock libre acotado", () => {
  const { G, s } = game(),
    defs = new Set(),
    names = new Set(s.drivers.map((d) => d.name)),
    portraits = new Set(s.drivers.map((d) => d.identity));
  for (let week = 0; week < 50; week++) {
    const refs = G.WeeklyContent.definitions(s).filter((d) => d.weekly);
    for (const d of refs) {
      assert.ok(!defs.has(d.id));
      defs.add(d.id);
    }
    const previous = new Set(s.drivers.map((d) => d.id));
    weeks(G, s);
    for (const d of s.drivers.filter((d) => !previous.has(d.id))) {
      assert.ok(!names.has(d.name), d.name);
      assert.ok(!portraits.has(d.identity));
      names.add(d.name);
      portraits.add(d.identity);
    }
    assert.ok(
      s.parts.filter((p) => p.companyId === null && !p.auctionOwnerId).length <=
        165,
    );
    assert.equal(G.Commerce.candidates(s).length, 12);
    G.Storage.validate(s);
  }
  assert.equal(defs.size, 3200);
});
test("El rollover conserva compras, reservas, piezas instaladas y lotes consignados", () => {
  const { G, s } = game();
  rich(G, s);
  const car = G.ownedCars(s)[0],
    def = G.WeeklyContent.definitions(s).find(
      (d) => d.weekly && d.slot === "intake",
    ),
    part = G.Workshop.stock(s, def.id)[0];
  G.Workshop.buy(s, part.id);
  G.Workshop.install(s, car.id, part.id);
  s.day = 7;
  G.Commerce.refresh(s);
  assert.equal(
    s.parts.find((p) => p.id === part.id),
    part,
  );
  assert.ok(part.reservedFor);
  G.Workshop.complete(s, car);
  assert.equal(car.installed.intake, part.id);
  assert.ok(car.hp > car.base.hp);
  s.day = 13;
  G.Auctions.daily(s);
  const spare = s.parts.find(
    (p) =>
      p.companyId === null &&
      G.Parts.definition(p.definitionId)?.weekly &&
      G.Parts.definition(p.definitionId).slot === "body",
  );
  G.Workshop.buy(s, spare.id);
  const lot = G.Auctions.consign(
    s,
    "part",
    spare.id,
    Math.round(G.Parts.definition(spare.definitionId).price),
  );
  s.day = 14;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  assert.equal(car.installed.intake, part.id);
  assert.ok(s.parts.some((p) => p.id === spare.id));
  assert.equal(G.Auctions.locked(s, "part", spare.id), true);
  assert.equal(lot.assetId, spare.id);
  G.Storage.validate(s);
  const loaded = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.deepEqual(json(loaded), json(s));
  assert.equal(G.Parts.definition(def.id).effects.hp, def.effects.hp);
});
test("Los recambios básicos se reponen y no hay compra/venta con beneficio inmediato", () => {
  const { G, s } = game();
  rich(G, s);
  const c = G.player(s),
    part = G.Workshop.stock(s, "cooling-race")[0],
    cash = c.balance;
  G.Workshop.buy(s, part.id);
  G.Workshop.sell(s, part.id);
  assert.ok(c.balance < cash);
  const def = G.WeeklyContent.definitions(s).find(
    (d) => d.weekly && d.slot === "tires",
  );
  const p = G.Workshop.stock(s, def.id)[0];
  G.Workshop.buy(s, p.id);
  const cost = Math.round(def.price);
  const before = c.balance;
  G.Workshop.sell(s, p.id);
  assert.equal(c.balance - before, Math.round(cost * 0.6));
  weeks(G, s);
  assert.ok(G.Workshop.stock(s, "cooling-race").length >= 2);
  G.Storage.validate(s);
});
test("Doce carrocerías y especializaciones producen diferencias físicas, requisitos y desgaste", () => {
  const { G, s } = game(),
    seen = new Set();
  for (let w = 0; w < 3; w++) {
    const shells = G.WeeklyContent.definitions(s).filter(
      (d) => d.weekly && d.slot === "shell",
    );
    for (const d of shells) {
      seen.add(d.shellVariant);
      assert.ok(["touring", "wide", "race"].includes(d.kit));
      assert.ok(d.price >= 900);
      assert.ok(Object.keys(d.effects).length >= 2);
    }
    weeks(G, s);
  }
  assert.equal(seen.size, 12);
  const tires = G.WeeklyContent.definitions(s).filter(
    (d) => d.weekly && d.slot === "tires",
  );
  assert.ok(
    tires.some((d) => d.effects.tireWear < 0) &&
      tires.some((d) => d.effects.tireWear > 0),
  );
  const car = G.ownedCars(s)[0],
    d = G.WeeklyContent.definitions(s).find(
      (d) => d.weekly && d.slot === "engine" && d.engineStage === 3,
    ),
    p = G.Workshop.stock(s, d.id)[0];
  assert.match(G.Workshop.fit(s, car, p), /chasis|refrigeración|embrague|CV/);
});
test("Concesionario: compra atómica, 0 km, pago único y reventa posterior como usado", () => {
  const { G, s } = game(),
    l = s.market.find((l) => l.kind === "new"),
    car = s.cars.find((c) => c.id === l.carId),
    snap = JSON.stringify(s);
  assert.ok(l.price >= 28000);
  assert.ok(car.hp >= 170);
  assert.throws(() => G.Market.buy(s, l.id), /fondos/);
  assert.equal(JSON.stringify(s), snap);
  rich(G, s);
  const before = G.player(s).balance;
  G.Market.buy(s, l.id);
  assert.equal(G.player(s).balance, before - l.price);
  assert.equal(car.km, 0);
  assert.equal(car.condition, 100);
  assert.equal(car.tires, 100);
  assert.equal(car.companyId, s.playerId);
  assert.equal(car.factoryDelivery, false);
  assert.throws(() => G.Market.buy(s, l.id), /disponibles/);
  const resale = G.Market.list(s, car.id, G.Market.value(car));
  assert.equal(resale.kind, undefined);
  assert.ok(resale.price < l.price);
  weeks(G, s);
  assert.equal(s.market.filter((l) => l.kind === "new").length, 12);
  assert.equal(s.cars.filter((c) => c.id === car.id).length, 1);
  G.Storage.validate(s);
});
test("Un garaje completo o reservado impide comprar un coche nuevo sin gastar", () => {
  const { G, s } = game();
  rich(G, s);
  const l = s.market.find((l) => l.kind === "new");
  G.player(s).carCapacity = 1;
  const before = JSON.stringify(s);
  assert.throws(() => G.Market.buy(s, l.id), /plazas|garaje/);
  assert.equal(JSON.stringify(s), before);
});
test("El prestigio y el nivel atraen mejores CV, mantienen candidatos modestos y cobran su valor", () => {
  const average = (level, rep) => {
    const { G, s } = game(1881);
    G.player(s).level = level;
    G.player(s).reputation = rep;
    weeks(G, s);
    const ds = G.Commerce.candidates(s);
    assert.ok(ds.some((d) => G.Drivers.rating(d) < 25));
    assert.ok(ds.every((d) => d.ask === G.Challenge.driverAsk(d)));
    return ds.reduce((n, d) => n + G.Drivers.rating(d), 0) / ds.length;
  };
  assert.ok(average(1, 80) > average(1, 2) + 5);
  assert.ok(average(8, 80) > average(1, 80) + 12);
});
test("Caducan solo CV libres: un piloto firmado mantiene contrato y disponibilidad entre semanas", () => {
  const { G, s } = game(),
    d = pilot(G, s),
    contract = json(d.contract),
    other = G.Commerce.candidates(s)[0];
  weeks(G, s);
  assert.deepEqual(json(d.contract), contract);
  assert.ok(G.Professionals.available(s, d));
  assert.equal(G.Professionals.available(s, other), false);
  const before = JSON.stringify(s);
  assert.throws(() => G.Drivers.offer(s, other.id, other.ask, 12), /caducado/);
  assert.equal(JSON.stringify(s), before);
  G.Storage.validate(s);
});
test("Ojeador: entrega semanal real según nivel, precisión, prestigio, estrés y descanso", () => {
  const { G, s } = game();
  rich(G, s);
  const scout = s.employees.find(
    (e) => e.role === "scout" && G.Professionals.profile(s, e.id).level === 1,
  );
  G.Staff.offer(s, scout.id, {
    salary: G.Staff.minimum(s, scout, { months: 12, bonus: 0 }),
    months: 12,
    bonus: 0,
    role: "titular",
  });
  weeks(G, s);
  assert.equal(
    s.professional.cvs.filter((cv) => cv.employeeId === scout.id).length,
    2,
  );
  assert.ok(G.Professionals.profile(s, scout.id).stress > 0);
  const p = G.Professionals.profile(s, scout.id);
  p.level = 9;
  weeks(G, s);
  const cvs = s.professional.cvs.filter((cv) => cv.employeeId === scout.id);
  assert.equal(cvs.length, 7);
  assert.ok(cvs.at(-1).accuracy > cvs[0].accuracy);
  p.restUntil = s.day + 8;
  weeks(G, s);
  assert.equal(
    s.professional.cvs.filter((cv) => cv.employeeId === scout.id).length,
    7,
  );
  G.Storage.validate(s);
});
test("Trofeos regionales: oro/plata/bronce, prestigio real, sin duplicar al consultar o cargar", () => {
  const { G, s } = game();
  rich(G, s);
  const e = podium(G, s),
    before = e.results.map(
      (row) => s.companies.find((c) => c.id === row.companyId).reputation,
    );
  G.Trophies.award(s, e);
  assert.equal(s.trophyRoom.awards.length, 3);
  assert.deepEqual(json(s.trophyRoom.awards.map((t) => t.bonus)), [6, 4, 2]);
  e.results.forEach((row, i) =>
    assert.equal(
      s.companies.find((c) => c.id === row.companyId).reputation,
      before[i] + [6, 4, 2][i],
    ),
  );
  const snap = JSON.stringify(s);
  G.Trophies.award(s, e);
  assert.equal(JSON.stringify(s), snap);
  G.Storage.validate(s);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), json(s));
});
test("Nacional da más prestigio, respeta el límite 100 y no premia DNF", () => {
  const { G, s } = game();
  rich(G, s);
  const e = podium(G, s, "national");
  G.player(s).reputation = 98;
  e.results[2].dnf = true;
  G.Trophies.award(s, e);
  assert.equal(G.player(s).reputation, 100);
  assert.equal(s.trophyRoom.awards[0].reputationGain, 2);
  assert.equal(s.trophyRoom.awards[1].bonus, 8);
  assert.equal(s.trophyRoom.awards.length, 2);
  G.Storage.validate(s);
});
test("Ni carrera ordinaria, ni calle, ni final sin puntos clasificatorios entrega copa", () => {
  const { G, s } = game();
  rich(G, s);
  const e = podium(G, s);
  e.final = false;
  G.Trophies.award(s, e);
  assert.equal(s.trophyRoom.awards.length, 0);
  e.final = true;
  const cup = e.cup;
  e.cup = "street";
  G.Trophies.award(s, e);
  assert.equal(s.trophyRoom.awards.length, 0);
  e.cup = cup;
  for (const row of e.results)
    s.season.cups.pro.standings[row.companyId].qualifying = 0;
  G.Trophies.award(s, e);
  assert.equal(s.trophyRoom.awards.length, 0);
});
test("Los trofeos permanecen en el archivo al abrir otra temporada; los puntos se reinician", () => {
  const { G, s } = game();
  rich(G, s);
  const e = podium(G, s);
  G.Trophies.award(s, e);
  for (const event of s.season.events)
    if (event.status === "scheduled") event.status = "skipped";
  s.day = s.season.events.at(-1).day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  G.Competition.completeSeason(s);
  G.Calendar.nextSeason(s);
  assert.equal(s.season.year, 2027);
  assert.equal(s.trophyRoom.awards.length, 3);
  assert.equal(G.Competition.score(s, s.playerId, "pro", true), 0);
  G.Storage.validate(s);
});
test("No se acepta una vitrina falsificada, un concesionario desgastado ni referencias futuras", () => {
  const { G, s } = game();
  rich(G, s);
  const e = podium(G, s);
  G.Trophies.award(s, e);
  const raw = json(s);
  s.trophyRoom.awards.push({ ...s.trophyRoom.awards[0] });
  assert.throws(() => G.Storage.validate(s), /Trofeo/);
  const next = json(raw);
  next.trophyRoom.awards[0].eventId = "event-0";
  assert.throws(() => G.Storage.validate(next), /podio/);
  const newer = json(raw);
  newer.cars.find((c) => c.factoryDelivery).km = 1;
  assert.throws(() => G.Storage.validate(newer), /concesionario/);
  const bad = json(raw);
  bad.parts.find(
    (p) => G.Parts.definition(p.definitionId)?.weekly,
  ).definitionId = G.WeeklyContent.id(s.seed, s.commerce.week + 1, 0);
  assert.throws(() => G.Storage.validate(bad), /futura/);
});
test("Las empresas 0.10 conservan el estado al cargar; activar no borra trabajo ni CV", () => {
  const { G } = engine({ commerce: true }),
    old = G.createV100Game("Empresa anterior", "", 1944),
    before = JSON.stringify(old);
  assert.equal(old.commerce, undefined);
  assert.deepEqual(
    json(G.Storage.unpack(G.Storage.pack(old)).state),
    json(old),
  );
  assert.equal(JSON.stringify(old), before);
  const funds = G.player(old).balance,
    car = G.ownedCars(old)[0];
  G.Workshop.install(
    old,
    car.id,
    (() => {
      const p = G.Workshop.stock(old, "exhaust-light")[0];
      G.Workshop.buy(old, p.id);
      return p.id;
    })(),
  );
  const job = json(car.repair),
    cash = G.player(old).balance;
  G.Commerce.initialize(old);
  G.Trophies.initialize(old);
  assert.deepEqual(json(car.repair), job);
  assert.equal(G.player(old).balance, cash);
  assert.ok(cash < funds);
  G.Storage.validate(old);
});
test("El patrocinio rechaza un CV caducado antes de reservar dinero o firmar", () => {
  const { G, s } = game(),
    offer = s.commercial.offers.find((o) => o.driverId);
  assert.ok(offer);
  const d = s.drivers.find((d) => d.id === offer.driverId);
  d.marketUntil = -1;
  d.recruitWeek = 0;
  const before = JSON.stringify(s),
    terms = G.Contracts.baseTerms(s, offer),
    q = G.Contracts.quote(s, offer.id, terms);
  assert.equal(q.accepted, false);
  assert.match(q.reason, /caducado|nivel/);
  assert.throws(() => G.Contracts.sign(s, offer.id, terms), /caducado|nivel/);
  assert.equal(JSON.stringify(s), before);
});
test("La carrera usa una referencia semanal física y se reanuda igual tras exportar", () => {
  const { G, s } = game();
  rich(G, s);
  const d = pilot(G, s),
    car = G.ownedCars(s)[0],
    def = G.WeeklyContent.definitions(s).find(
      (d) => d.weekly && d.slot === "intake",
    ),
    part = G.Workshop.stock(s, def.id)[0];
  G.Workshop.buy(s, part.id);
  G.Workshop.install(s, car.id, part.id);
  G.Calendar.advance(s, car.repair.end);
  const e = G.nextEvent(s);
  G.Race.register(s, e.id, d.id, car.id);
  G.Calendar.advance(s, e.day - s.day);
  G.Race.start(s, e.id);
  const a = s.race.entrants.find((a) => a.companyId === s.playerId);
  assert.equal(a.performance.parts[0].definitionId, def.id);
  assert.deepEqual(json(a.performance.parts[0].effects), json(def.effects));
  G.Race.tick(s, 50);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  G.Race.tick(s, 100);
  for (let n = 0; n < 100; n++) G.Race.tick(copy, 1);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(s);
});
test("Liquidar la gran final por Race.finish concede el trofeo y su reputación, una sola vez", () => {
  const { G, s } = game();
  rich(G, s);
  const d = pilot(G, s);
  for (const key of G.Drivers.stats) d.stats[key] = 35;
  const car = G.Market.buy(s, s.market.find((l) => l.kind === "new").id),
    e = s.season.events.find((e) => e.cup === "pro" && e.final);
  s.competitions.licenses.player = true;
  Object.assign(s.season.cups.pro.standings.player, {
    points: 18,
    qualifying: 18,
  });
  s.day = e.day;
  G.Auctions.daily(s);
  G.Commerce.refresh(s);
  G.Race.register(s, e.id, d.id, car.id);
  G.Race.start(s, e.id);
  const r = s.race,
    a = r.entrants.find((a) => a.companyId === s.playerId);
  r.entrants = [a];
  r.replay.cars = r.replay.cars.filter((m) => m.carId === a.carId);
  r.replay.frames = [];
  G.RaceWeekend.record(r, true);
  a.progress = G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps;
  a.finishTime = 900;
  r.time = 900;
  r.finished = true;
  const rep = G.player(s).reputation;
  G.Race.finish(s);
  assert.equal(
    s.trophyRoom.awards.filter((t) => t.companyId === s.playerId).length,
    1,
  );
  assert.equal(G.player(s).reputation, rep + 7);
  G.Storage.validate(s);
  assert.throws(() => G.Race.finish(s), /carrera|Carrera/);
});
