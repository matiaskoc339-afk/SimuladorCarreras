const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 1900, isolated = true) {
  const { G } = engine({ auctions: true }),
    s = G.createGame("Casa de subastas", "", seed);
  if (isolated) {
    G.player(s).balance = 2000000;
    for (const e of s.season.events) e.day += 365;
  }
  return { G, s, A: G.Auctions };
}
function untouched(s, fn, re) {
  const before = JSON.stringify(s);
  assert.throws(fn, re);
  assert.equal(JSON.stringify(s), before);
}
function win(G, s, lot, id = s.playerId) {
  G.Auctions.start(s, lot.id);
  if (id === s.playerId) G.Auctions.bid(s, lot.opening);
  else {
    if (id === "patron")
      id = s.auctions.room.bidders.find(
        (b) => b.type !== "team" && b.budget >= lot.opening,
      ).id;
    G.Auctions.accept(s, id);
  }
  for (const b of s.auctions.room.bidders) b.out = true;
  G.Auctions.tick(s, 100);
  assert.equal(lot.result.winnerId, id);
  G.Storage.validate(s);
  return G.Auctions.asset(s, { ...lot, assetId: lot.result.assetId });
}
function buy(G, s, def) {
  const p = G.Workshop.stock(s, def)[0];
  G.Workshop.buy(s, p.id);
  return p;
}
function finish(G, s, car) {
  G.Calendar.advance(s, car.repair.end - s.day);
  assert.equal(car.repair, null);
  G.Storage.validate(s);
}
function sellLot(G, s, kind, id, factor = 0.7) {
  const l = { kind, assetId: id, sellerId: s.playerId },
    value = G.Auctions.value(s, l);
  return G.Auctions.consign(
    s,
    kind,
    id,
    Math.max(100, Math.round(value * factor)),
  );
}

test("Inicio difícil: 8 lotes, 12 participantes financiados, 12 plataformas exclusivas y catálogo normal intacto", () => {
  const { G, s, A } = game(1900, false);
  assert.equal(G.player(s).balance, 4200);
  assert.equal(G.Parts.catalogue.length, 29);
  assert.equal(G.Data.models.length, 76);
  assert.equal(s.auctions.lots.length, 8);
  assert.equal(s.auctions.patrons.length, 12);
  assert.ok(s.auctions.lots.every((l) => l.opening > 4200));
  assert.equal(
    s.market.some(
      (l) =>
        G.Data.models[s.cars.find((c) => c.id === l.carId).modelIndex]
          .auctionOnly,
    ),
    false,
  );
  const before = JSON.stringify(s);
  A.initialize(s);
  for (const l of s.auctions.lots) {
    A.title(s, l);
    A.preview(s, l);
    A.value(s, l);
  }
  assert.equal(JSON.stringify(s), before);
  G.Storage.validate(s);
});
test("Activar una empresa 0.9 conserva caja, RNG, vehículos, taller e investigación", () => {
  const { G } = engine({ auctions: true }),
    s = G.createV90Game("Anterior", "", 1900),
    rng = s.rng,
    cash = G.player(s).balance,
    cars = json(s.cars),
    research = json(s.research);
  const p = buy(G, s, "exhaust-light"),
    car = G.ownedCars(s)[0];
  G.Workshop.install(s, car.id, p.id);
  const job = json(car.repair);
  G.Auctions.initialize(s);
  assert.equal(s.rng, rng);
  assert.equal(G.player(s).balance, cash - 680);
  assert.deepEqual(json(car.repair), job);
  assert.deepEqual(json(s.research), research);
  assert.equal(s.cars.length, cars.length);
  finish(G, s, car);
});
test("Cuenta real: espera la primera paleta, reinicia 10 segundos y adjudica una vez al llegar a cero", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0],
    cash = G.player(s).balance;
  A.start(s, l.id);
  for (const b of s.auctions.room.bidders) b.out = true;
  A.tick(s, 30);
  assert.equal(A.room(s).leader, null);
  A.bid(s, l.opening);
  assert.equal(A.room(s).remaining, 100);
  A.tick(s, 99);
  assert.equal(A.room(s).remaining, 1);
  assert.equal(l.status, "live");
  assert.equal(G.player(s).balance, cash);
  assert.equal(A.reserved(s, "player"), l.opening);
  A.tick(s, 1);
  assert.equal(l.status, "sold");
  assert.equal(l.result.price, l.opening);
  assert.equal(G.player(s).balance, cash - l.opening);
  assert.equal(s.auctions.house.balance, l.opening);
  const before = JSON.stringify(s);
  A.tick(s, 5);
  assert.equal(JSON.stringify(s), before);
  untouched(s, () => A.close(s), /procesado/);
  const p = s.parts.find((p) => p.id === l.result.assetId);
  assert.equal(p.companyId, "player");
  assert.equal(p.condition, l.blueprint.condition);
});
test("Una puja contraria reinicia el reloj; no se puede pujar contra uno mismo ni aceptar un precio obsoleto", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0];
  A.start(s, l.id);
  A.bid(s, l.opening);
  untouched(s, () => A.bid(s, A.room(s).ask), /más alta/);
  const b = A.room(s).bidders.find(
    (b) => A.actor(s, b.id).balance > A.room(s).ask,
  );
  A.tick(s, 1);
  const old = A.room(s).ask;
  A.accept(s, b.id);
  assert.equal(A.room(s).remaining, 100);
  assert.ok(A.room(s).ask > old);
  untouched(s, () => A.bid(s, old), /ha cambiado/);
  G.Storage.validate(s);
});
test("Retirarse nunca anula la última oferta vinculante y ser espectador no cuesta dinero", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0],
    before = G.player(s).balance;
  A.start(s, l.id);
  A.bid(s, l.opening);
  for (const b of A.room(s).bidders) b.out = true;
  A.withdraw(s);
  assert.equal(l.result.winnerId, "player");
  assert.equal(G.player(s).balance, before - l.opening);
  const next = s.auctions.lots[1],
    cash = G.player(s).balance;
  A.start(s, next.id);
  A.withdraw(s);
  assert.equal(G.player(s).balance, cash);
  assert.notEqual(next.result.winnerId, "player");
  G.Storage.validate(s);
});
test("Reserva dinero y plazas: fondos, almacén y garaje se comprueban antes de una puja y de otros gastos", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0];
  A.start(s, l.id);
  const initial = G.player(s).balance;
  G.player(s).balance = l.opening - 1;
  untouched(s, () => A.bid(s, l.opening), /fondos/);
  G.player(s).balance = initial;
  G.player(s).sparesCapacity = 1;
  G.Facilities.site(s).base.spares = 1;
  const p = buy(G, s, "exhaust-light");
  untouched(s, () => A.bid(s, l.opening), /almacén/);
  G.Workshop.sell(s, p.id);
  G.player(s).balance = l.opening + 100;
  A.bid(s, l.opening);
  untouched(s, () => G.Economy.spend(s, 101, "Prueba", "Reserva"), /puja/);
  untouched(s, () => buy(G, s, "tires-sport"), /lleno|comprometida/);
  untouched(s, () => G.Calendar.advance(s, 1), /subasta/i);
  A.withdraw(s);
  G.Storage.validate(s);
});
test("Compra un coche exclusivo completo, conserva preparación y pintura y respeta el garaje", () => {
  const { G, s, A } = game(1901),
    l = s.auctions.lots.find(
      (l) => l.kind === "car" && l.blueprint.parts.length,
    );
  G.player(s).carCapacity = 1;
  A.start(s, l.id);
  untouched(s, () => A.bid(s, l.opening), /garaje/);
  G.player(s).carCapacity = 2;
  A.bid(s, l.opening);
  for (const b of A.room(s).bidders) b.out = true;
  A.tick(s, 100);
  const car = s.cars.find((c) => c.id === l.result.assetId);
  assert.equal(car.companyId, "player");
  assert.equal(car.color, l.blueprint.color);
  assert.equal(Object.keys(car.installed).length, l.blueprint.parts.length);
  assert.equal(car.collectible.serial, l.blueprint.collectible.serial);
  assert.equal(car.coachwork.style, "wide");
  assert.equal(
    car.coachwork.exclusive.accent,
    G.Parts.definition(
      s.parts.find((p) => p.id === car.installed.shell).definitionId,
    ).accent,
  );
  G.Storage.validate(s);
});
test("Una pieza exclusiva se monta con dinero y días, influye en el coche y no aparece en el proveedor", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0],
    p = win(G, s, l),
    car = G.ownedCars(s)[0],
    d = G.Parts.definition(p.definitionId),
    before = car.weight;
  assert.equal(
    G.Parts.catalogue.some((x) => x.id === d.id),
    false,
  );
  assert.equal(G.Workshop.stock(s, d.id).length, 0);
  G.Coachwork.install(s, car.id, p.id);
  assert.equal(car.coachwork, undefined);
  finish(G, s, car);
  assert.equal(car.installed.shell, p.id);
  assert.equal(car.coachwork.exclusive.serial, d.serial);
  assert.equal(car.weight, before + d.effects.weight);
  untouched(s, () => G.Workshop.sell(s, p.id), /subasta/i);
  G.Storage.validate(s);
});
test("Vender una pieza cobra exactamente el 80 %, el comprador paga todo y la casa retiene la comisión", () => {
  const { G, s, A } = game(1901),
    p = buy(G, s, "exhaust-light"),
    l = sellLot(G, s, "part", p.id),
    cash = G.player(s).balance;
  A.start(s, l.id);
  A.run(s);
  assert.ok(l.result.price > 0);
  assert.equal(G.player(s).balance, cash + l.result.net);
  assert.equal(l.result.net, Math.floor(l.result.price * 0.8));
  assert.equal(l.result.fee, l.result.price - l.result.net);
  assert.equal(s.auctions.house.balance, l.result.fee);
  assert.notEqual(p.companyId, "player");
  assert.equal(A.locked(s, "part", p.id), false);
  assert.equal(s.parts.filter((x) => x.id === p.id).length, 1);
  G.Storage.validate(s);
});
test("Lotes propios bloquean piezas y coches; retirada sin abrir libera el objeto sin cargo", () => {
  const { G, s, A } = game(),
    p = buy(G, s, "exhaust-light"),
    l = sellLot(G, s, "part", p.id),
    car = G.ownedCars(s)[0];
  untouched(s, () => G.Workshop.install(s, car.id, p.id), /consignada/);
  untouched(s, () => G.Workshop.sell(s, p.id), /consignada/);
  untouched(s, () => sellLot(G, s, "part", p.id), /consignado/);
  const cash = G.player(s).balance;
  A.cancel(s, l.id);
  assert.equal(G.player(s).balance, cash);
  assert.equal(A.locked(s, "part", p.id), false);
  const c = sellLot(G, s, "car", car.id);
  untouched(s, () => G.Workshop.repair(s, car.id), /consignado/);
  untouched(
    s,
    () => G.Market.list(s, car.id, G.Market.value(car)),
    /inscripción|revisión/,
  );
  A.start(s, c.id);
  untouched(s, () => A.bid(s, c.opening), /vendedor/);
  untouched(s, () => A.cancel(s, c.id), /antes/);
  A.withdraw(s);
  G.Storage.validate(s);
});
test("Una sala sin compradores devuelve el objeto sin comisión ni transferencia", () => {
  const { G, s, A } = game(),
    p = buy(G, s, "exhaust-light"),
    l = sellLot(G, s, "part", p.id),
    cash = G.player(s).balance;
  A.start(s, l.id);
  for (const b of A.room(s).bidders) b.out = true;
  A.tick(s, 120);
  assert.equal(l.status, "unsold");
  assert.equal(p.companyId, "player");
  assert.equal(G.player(s).balance, cash);
  assert.equal(l.result.net, 0);
  assert.equal(s.auctions.house.balance, 0);
  G.Storage.validate(s);
});
test("El coleccionista conserva propiedad real y las piezas no pueden recomprarse como stock de proveedor", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots.find(
      (l) => l.kind === "car" && l.blueprint.parts.length,
    ),
    car = win(G, s, l, "patron"),
    patron = s.auctions.patrons.find((p) => p.id === car.auctionOwnerId);
  assert.equal(car.companyId, null);
  assert.equal(car.auctionOwnerId, patron.id);
  assert.equal(patron.spent, l.opening);
  for (const id of Object.values(car.installed)) {
    const p = s.parts.find((p) => p.id === id);
    assert.equal(p.auctionOwnerId, patron.id);
    assert.equal(G.Workshop.stock(s, p.definitionId).length, 0);
    untouched(s, () => G.Workshop.buy(s, p.id), /subasta/i);
  }
  assert.equal(G.Market.listed(s, car.id), undefined);
  G.Storage.validate(s);
});
test("Un rival paga desde su caja, recibe el objeto y registra la operación real", () => {
  const { G, s, A } = game();
  for (const c of s.companies) if (c.id !== s.playerId) c.balance = 300000;
  const p = buy(G, s, "exhaust-light"),
    l = sellLot(G, s, "part", p.id);
  A.start(s, l.id);
  const b = A.room(s).bidders.find((b) => b.type === "team"),
    c = s.companies.find((c) => c.id === b.id),
    cash = c.balance;
  A.accept(s, c.id);
  for (const b of A.room(s).bidders) b.out = true;
  A.tick(s, 100);
  assert.equal(c.balance, cash - l.opening);
  assert.equal(p.companyId, c.id);
  assert.equal(c.decisions[0].action, "subasta");
  assert.equal(c.decisions[0].cost, l.opening);
  G.Storage.validate(s);
});
test("Guardar a mitad conserva reloj, postores, RNG privado y el resultado exacto; cargar no cambia la puja", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0];
  A.start(s, l.id);
  A.bid(s, l.opening);
  A.tick(s, 27);
  const copy = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.deepEqual(json(copy), json(s));
  A.run(s);
  A.run(copy);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(copy);
});
test("Cada siete días se resuelven lotes no visitados y aparecen ediciones nuevas sin duplicar stock al leer", () => {
  const { G, s, A } = game(),
    seen = new Set(),
    models = new Set(),
    families = new Set();
  for (let n = 0; n < 15; n++) {
    for (const l of s.auctions.lots.filter((l) => l.status === "listed")) {
      const signature = JSON.stringify(l.blueprint);
      assert.equal(seen.has(signature), false);
      seen.add(signature);
      if (l.kind === "part")
        families.add(l.blueprint.definitionId.split("-")[1]);
      else models.add(l.blueprint.modelIndex);
    }
    G.Calendar.advance(s, 7);
    G.Storage.validate(s);
  }
  assert.ok(seen.size >= 120);
  assert.ok(families.size >= 20);
  assert.ok(models.size >= 15);
  assert.equal(
    s.auctions.lots.filter((l) => l.status === "listed" && l.sellerId === null)
      .length,
    8,
  );
  assert.ok(s.auctions.lots.length <= 100);
  assert.ok(s.auctions.house.received > 0);
  assert.ok(s.auctions.patrons.some((p) => p.spent > 0 && p.income > 0));
});
test("La IA usa presupuestos propios y produce gangas y sobreprecios, con final finito y ofertas ascendentes", () => {
  let bargain = false,
    expensive = false,
    rivals = false;
  for (let seed = 1910; seed < 1922; seed++) {
    const { G, s, A } = game(seed);
    for (const c of s.companies) if (c.id !== "player") c.balance = 180000;
    for (const l of s.auctions.lots) {
      A.start(s, l.id);
      A.run(s);
      if (!l.result.price) continue;
      for (let i = 1; i < l.result.bids.length; i++)
        assert.ok(l.result.bids[i].price > l.result.bids[i - 1].price);
      bargain ||= l.result.price < l.estimate * 0.8;
      expensive ||= l.result.price > l.estimate * 1.2;
      rivals ||= l.result.winnerId.startsWith("company-");
      G.Storage.validate(s);
    }
  }
  assert.equal(bargain, true);
  assert.equal(expensive, true);
  assert.equal(rivals, true);
});
test("Validación rechaza contador, cartera, puja, pintura, propiedad y unidades exclusivas duplicadas corruptas", () => {
  const { G, s, A } = game(),
    l = s.auctions.lots[0];
  A.start(s, l.id);
  A.bid(s, l.opening);
  const original = G.Storage.pack(s);
  for (const corrupt of [
    (s) => (s.auctions.room.remaining = -1),
    (s) => s.auctions.patrons[0].balance++,
    (s) => s.auctions.room.price++,
    (s) =>
      (s.auctions.lots.find(
        (l) => l.kind === "car",
      ).blueprint.collectible.accent = "red"),
    (s) => s.auctions.house.balance++,
    (s) => (s.auctions.room.bidders[0].id = "player"),
  ]) {
    const c = G.Storage.unpack(original).state;
    corrupt(c);
    assert.throws(() => G.Storage.validate(c));
  }
  A.withdraw(s);
  const p = s.parts.find((p) => G.Parts.definition(p.definitionId).auctionOnly);
  if (p) {
    const clone = { ...p, id: G.uid(s, "part") };
    s.parts.push(clone);
    assert.throws(() => G.Storage.validate(s), /duplicado/);
  }
});
test("Una carrera auténtica 0.9 con carrocería ancha conserva su resultado y estado anteriores completos", () => {
  const { G } = engine({ auctions: true }),
    read = (f) => fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8"),
    s = G.Storage.unpack(read("v90-race.json")).state;
  assert.equal(s.auctions, undefined);
  while (!s.race.finished) G.Race.tick(s, 400);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(read("v90-results.json")),
  );
  assert.deepEqual(json(s), JSON.parse(read("v90-finished.json")));
});
test("El rival instala una pieza exclusiva adjudicada con sus propias bahías, mano de obra y calendario", () => {
  const { G, s, A } = game(1900),
    l = s.auctions.lots[1];
  for (const c of s.companies) if (c.id !== s.playerId) c.balance = 300000;
  A.start(s, l.id);
  const bidder = A.room(s).bidders.find((b) => b.type === "team"),
    company = s.companies.find((c) => c.id === bidder.id);
  A.accept(s, company.id);
  for (const b of A.room(s).bidders) b.out = true;
  A.tick(s, 100);
  const p = s.parts.find((p) => p.id === l.result.assetId),
    candidate = G.Workshop.aiCandidates(
      s,
      company,
      5000,
      30,
      G.AI.policy(company),
    ).find((c) => c.action === "instalación de lote");
  assert.ok(candidate);
  const car = s.cars.find((c) => c.id === candidate.targetId),
    before = car.hp,
    cash = company.balance;
  candidate.run();
  assert.equal(
    company.balance,
    cash - G.Parts.definition(p.definitionId).labor,
  );
  finish(G, s, car);
  assert.equal(p.carId, car.id);
  assert.ok(car.hp > before);
  G.Storage.validate(s);
});
test("Una empresa de Copa Club antigua activa lotes compatibles sin cambiar sus contratos ni su reglamento", () => {
  const { G } = engine({ auctions: true }),
    s = G.createLegacyGame("Archivo antiguo", "", 1902),
    old = json(s.drivers.map((d) => d.contract)),
    rng = s.rng;
  G.Auctions.initialize(s);
  assert.equal(s.competitions, undefined);
  assert.equal(s.rng, rng);
  assert.deepEqual(json(s.drivers.map((d) => d.contract)), old);
  for (const l of s.auctions.lots.filter((l) => l.kind === "car"))
    assert.ok(G.Auctions.preview(s, l).hp <= 210);
  G.Storage.validate(s);
});
