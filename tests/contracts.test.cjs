const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { engine } = require("./helpers.cjs");
const json = (x) => JSON.parse(JSON.stringify(x));
function game(seed = 701) {
  const { G } = engine();
  return { G, s: G.createGame("Acuerdos", "", seed) };
}
function offer(G, s, kind = "financial", index = 0) {
  const ps = s.commercial.providers.filter((p) => p.kind === kind),
    p = ps[index];
  return s.commercial.offers.find(
    (o) => o.providerId === p.id && o.year === s.season.year,
  );
}
function terms(G, s, o, extra = {}) {
  const t = {
    ...G.Contracts.baseTerms(s, o),
    advance: 600,
    perRound: 200,
    ...extra,
  };
  assert.equal(G.Contracts.quote(s, o.id, t).accepted, true);
  return t;
}
function sign(G, s, kind = "financial", extra = {}) {
  const o = offer(G, s, kind);
  return G.Contracts.sign(s, o.id, terms(G, s, o, extra));
}
function hire(G, s, extra) {
  const d = s.drivers.find((d) => !d.companyId);
  const r = G.Drivers.offer(s, d.id, d.ask, 12, 0, extra);
  if (!r.accepted) G.Drivers.offer(s, d.id, r.salary, 12, 0, extra);
  return d;
}
function round(G, s, e, d, car) {
  e.results = d
    ? [
        {
          companyId: s.playerId,
          driverId: d.id,
          carId: car.id,
          position: 1,
          dnf: false,
        },
      ]
    : [];
  e.status = "completed";
  G.Contracts.raceFinished(s, e, {
    entrants: d
      ? [
          {
            companyId: s.playerId,
            sponsorParts: Object.values(car.installed).map(
              (id) => s.parts.find((p) => p.id === id).definitionId,
            ),
          },
        ]
      : [],
  });
}
function advanceWithoutRace(G, s, day) {
  while (s.day < day) {
    const e = G.nextEvent(s);
    if (e && e.day <= s.day) G.Race.skip(s, e.id);
    else G.Calendar.advance(s, Math.min(day - s.day, 400));
  }
}
test("Patrocinio: reserva todo el presupuesto y abona un solo anticipo, con exclusividad real", () => {
  const { G, s } = game(),
    o = offer(G, s),
    p = s.commercial.providers.find((p) => p.id === o.providerId),
    budget = p.balance,
    balance = G.player(s).balance,
    t = terms(G, s, o),
    c = G.Contracts.sign(s, o.id, t);
  assert.equal(G.player(s).balance, balance + t.advance);
  assert.equal(p.balance, budget - t.advance - t.perRound * 6 - c.finishBonus);
  assert.equal(c.escrow, t.perRound * 6 + c.finishBonus);
  const before = JSON.stringify(s);
  assert.throws(() => G.Contracts.sign(s, o.id, t));
  assert.equal(JSON.stringify(s), before);
  G.Storage.validate(s);
});
test("Negociación comercial: contraoferta, contraprestaciones, cooldown y presupuesto finito", () => {
  const { G, s } = game(702),
    o = offer(G, s),
    cash = G.player(s).balance;
  let n = G.Contracts.negotiate(s, o.id, {
    ...G.Contracts.baseTerms(s, o),
    advance: 10000,
    perRound: 3000,
  });
  assert.equal(n.accepted, false);
  assert.ok(n.terms.advance < 10000);
  assert.equal(G.player(s).balance, cash);
  assert.equal(G.Contracts.quote(s, o.id, n.terms).accepted, true);
  const low = G.Contracts.quote(s, o.id, {
      ...n.terms,
      share: 0.5,
      promotions: 0,
      targetPosition: 8,
    }),
    high = G.Contracts.quote(s, o.id, {
      ...n.terms,
      share: 1,
      promotions: 2,
      targetPosition: 3,
    });
  assert.ok(high.maximum > low.maximum);
  for (let i = 0; i < 2; i++)
    G.Contracts.negotiate(s, o.id, { advance: 10000, perRound: 3000 });
  const before = JSON.stringify(s);
  assert.throws(() => G.Contracts.negotiate(s, o.id, {}), /esperar/);
  assert.equal(JSON.stringify(s), before);
  s.commercial.providers.find((p) => p.id === o.providerId).balance = 0;
  assert.equal(
    G.Contracts.quote(s, o.id, { advance: 0, perRound: 0 }).accepted,
    false,
  );
});
test("Dos marcas rivales del mismo sector no se firman juntas; rechazar y vencer no genera dinero", () => {
  const { G, s } = game(703),
    energy = s.commercial.providers.filter((p) => p.sector === "energía"),
    a = s.commercial.offers.find((o) => o.providerId === energy[0].id),
    b = s.commercial.offers.find((o) => o.providerId === energy[1].id);
  G.Contracts.sign(s, a.id, terms(G, s, a));
  assert.match(
    G.Contracts.quote(s, b.id, { advance: 0, perRound: 0 }).reason,
    /exclusividad/,
  );
  const o = offer(G, s, "technical"),
    cash = G.player(s).balance;
  G.Contracts.decline(s, o.id);
  assert.equal(G.Contracts.quote(s, o.id, {}).accepted, false);
  assert.equal(G.player(s).balance, cash);
  s.day = 11;
  G.Contracts.daily(s);
  assert.ok(
    s.commercial.offers.filter((o) => o.status === "open").length === 0,
  );
  G.Storage.validate(s);
});
test("Fabricante: piloto impuesto y coche del mercado, propiedad e inventarios conservados", () => {
  const { G, s } = game(704),
    o = offer(G, s, "manufacturer"),
    d = s.drivers.find((d) => d.id === o.driverId),
    beforeCars = s.cars.map((c) => c.id),
    q = G.Contracts.quote(s, o.id, terms(G, s, o)),
    dealer = s.dealer.balance,
    balance = G.player(s).balance;
  assert.ok(q.vehicle);
  const c = G.Contracts.sign(s, o.id, q.terms);
  assert.equal(d.companyId, s.playerId);
  assert.equal(d.contract.salary, d.ask);
  assert.equal(s.cars.find((car) => car.id === c.carId).companyId, s.playerId);
  assert.equal(s.dealer.balance, dealer + q.vehicle.price);
  assert.equal(G.player(s).balance, balance + q.terms.advance);
  assert.deepEqual(
    s.cars.map((c) => c.id),
    beforeCars,
  );
  assert.equal(
    s.market.some((l) => l.carId === c.carId),
    false,
  );
  G.Storage.validate(s);
});
test("Fichaje impuesto: plantilla o garaje llenos y activo vendido bloquean la firma sin mutación parcial", () => {
  const { G, s } = game(705),
    o = offer(G, s, "manufacturer");
  s.companies[0].driverCapacity = 1;
  const existing = s.drivers.find((d) => !d.companyId && d.id !== o.driverId);
  G.Drivers.offer(s, existing.id, existing.ask, 12);
  const before = JSON.stringify(s);
  assert.throws(
    () => G.Contracts.sign(s, o.id, { advance: 0, perRound: 0, promotions: 1 }),
    /plaza/,
  );
  assert.equal(JSON.stringify(s), before);
  s.companies[0].driverCapacity = 2;
  s.companies[0].carCapacity = 1;
  const again = JSON.stringify(s);
  assert.throws(
    () => G.Contracts.sign(s, o.id, { advance: 0, perRound: 0, promotions: 1 }),
    /plaza/,
  );
  assert.equal(JSON.stringify(s), again);
});
test("Prueba H: otro piloto no factura; incumplir devuelve capital y anticipo, baja reputación y deja memoria", () => {
  const { G, s } = game(706),
    c = sign(G, s, "manufacturer"),
    d = hire(G, s),
    car = G.ownedCars(s).find((car) => car.id === c.carId),
    initial = G.player(s).balance,
    rep = G.player(s).reputation,
    p = s.commercial.providers.find((p) => p.id === c.providerId);
  for (const e of s.season.events) round(G, s, e, d, car);
  assert.equal(c.fulfilledIds.length, 0);
  assert.equal(c.status, "breached");
  assert.equal(c.penalty, c.terms.advance + c.vehicleFunding + c.exitFee);
  assert.equal(G.player(s).balance, initial - c.penalty);
  assert.equal(c.escrow, 0);
  assert.ok(G.player(s).reputation < rep);
  assert.ok(G.Contracts.relation(s, s.playerId, p.id) < 0);
  assert.ok(
    c.rounds.every((r) => r.issues.includes("no participa el piloto impuesto")),
  );
  G.Storage.validate(s);
});
test("Cumplimiento: cuotas, promoción, prima final y liquidación idempotente de reservas", () => {
  const { G, s } = game(707),
    c = sign(G, s, "manufacturer", { targetPosition: 8 }),
    d = s.drivers.find((d) => d.id === c.driverId),
    car = s.cars.find((car) => car.id === c.carId);
  G.Contracts.promotion(s, c.id);
  assert.equal(c.promotions, 0);
  G.Calendar.advance(s, 1);
  assert.equal(c.promotions, 1);
  const initial = G.player(s).balance;
  for (const e of s.season.events) round(G, s, e, d, car);
  assert.equal(c.status, "completed");
  assert.equal(c.fulfilledIds.length, 6);
  assert.equal(c.escrow, 0);
  assert.equal(
    G.player(s).balance,
    initial + 6 * c.terms.perRound + c.finishBonus,
  );
  const after = JSON.stringify(s);
  G.Contracts.raceFinished(s, s.season.events[5], { entrants: [] });
  assert.equal(JSON.stringify(s), after);
  assert.throws(() => G.Contracts.cancel(s, c.id), /disponible/);
  G.Storage.validate(s);
});
test("Retirar logo o no montar la pieza técnica retiene la cuota; cancelación cobra una vez", () => {
  const { G, s } = game(708),
    d = hire(G, s),
    car = G.ownedCars(s)[0],
    c = sign(G, s, "technical"),
    before = G.player(s).balance;
  round(G, s, s.season.events[0], d, car);
  assert.equal(c.fulfilledIds.length, 0);
  assert.equal(G.player(s).balance, before);
  G.Contracts.toggleLogo(s, c.id);
  round(G, s, s.season.events[1], d, car);
  assert.ok(c.rounds[1].issues.includes("logotipo retirado"));
  const cost = G.Contracts.exitCost(c);
  G.Contracts.cancel(s, c.id);
  assert.equal(G.player(s).balance, before - cost);
  const state = JSON.stringify(s);
  assert.throws(() => G.Contracts.cancel(s, c.id));
  assert.equal(JSON.stringify(s), state);
  G.Storage.validate(s);
});
test("Crédito: capital finito, calendario exacto, límite y prohibición de deuda duplicada", () => {
  const { G, s } = game(709),
    bank = s.commercial.bank.balance,
    balance = G.player(s).balance,
    q = G.Contracts.loanQuote(s, 2000, 3),
    l = G.Contracts.borrow(s, 2000, 3);
  assert.equal(G.player(s).balance, balance + 2000);
  assert.equal(s.commercial.bank.balance, bank - 2000);
  assert.equal(
    l.schedule.reduce((n, p) => n + p.principal + p.interest, 0),
    q.total,
  );
  assert.ok(l.schedule.every((p) => p.principal + p.interest <= q.payment));
  const before = JSON.stringify(s);
  assert.throws(() => G.Contracts.borrow(s, 1000, 3), /deuda/);
  assert.equal(JSON.stringify(s), before);
  assert.equal(G.Contracts.loanQuote(s, 8000, 3).accepted, false);
  G.Storage.validate(s);
});
test("Cuota vencida: capital e intereses salen una sola vez y el banco recupera el dinero", () => {
  const { G, s } = game(710),
    l = G.Contracts.borrow(s, 2000, 3),
    initial = G.player(s).balance,
    bank = s.commercial.bank.balance;
  assert.equal(l.schedule[0].paid, false);
  s.day = 30;
  G.Contracts.daily(s);
  const p = l.schedule[0],
    amount = p.principal + p.interest;
  assert.equal(p.paid, true);
  assert.equal(G.player(s).balance, initial - amount);
  assert.equal(s.commercial.bank.balance, bank + amount);
  const after = G.player(s).balance;
  G.Contracts.daily(s);
  assert.equal(G.player(s).balance, after);
  G.Storage.validate(s);
});
test("Impago: mora, reputación y deuda persisten; pagar después salda lo pendiente", () => {
  const { G, s } = game(711),
    l = G.Contracts.borrow(s, 2000, 3);
  G.player(s).balance = 0;
  s.day = 44;
  G.Contracts.daily(s);
  assert.equal(l.status, "defaulted");
  assert.equal(l.schedule[0].fee, 100);
  assert.equal(s.commercial.profiles.player.defaults, 1);
  assert.equal(l.schedule[0].paid, false);
  const rep = G.player(s).reputation;
  G.Contracts.daily(s);
  assert.equal(G.player(s).reputation, rep);
  assert.equal(l.schedule[0].fee, 100);
  G.player(s).balance = 5000;
  const cost = G.Contracts.payoff(s, l);
  G.Contracts.repay(s, l.id);
  assert.equal(G.player(s).balance, 5000 - cost);
  assert.equal(l.status, "repaid");
  assert.equal(G.Contracts.debt(s), 0);
  G.Storage.validate(s);
});
test("Amortización anticipada condona solo intereses no vencidos y rechaza doble pago", () => {
  const { G, s } = game(712),
    bank = s.commercial.bank.balance,
    l = G.Contracts.borrow(s, 2000, 6),
    before = G.player(s).balance;
  assert.equal(G.Contracts.payoff(s, l), 2000);
  G.Contracts.repay(s, l.id);
  assert.equal(G.player(s).balance, before - 2000);
  assert.equal(s.commercial.bank.balance, bank);
  const state = JSON.stringify(s);
  assert.throws(() => G.Contracts.repay(s, l.id));
  assert.equal(JSON.stringify(s), state);
  G.Storage.validate(s);
});
test("Cláusulas de piloto: salario negociado, victoria, rescisión y promesas con memoria", () => {
  const { G, s } = game(713),
    d = hire(G, s, {
      role: "reserva",
      winBonus: 200,
      releaseMonths: 3,
      promiseShare: 1,
      renewalOption: true,
    }),
    car = G.ownedCars(s)[0];
  assert.equal(d.contract.role, "reserva");
  assert.equal(d.contract.clauses.releaseMonths, 3);
  const initial = G.player(s).balance;
  round(G, s, s.season.events[0], d, car);
  assert.equal(G.player(s).balance, initial - 200);
  const once = G.player(s).balance;
  round(G, s, s.season.events[0], d, car);
  assert.equal(G.player(s).balance, once);
  for (const e of s.season.events.slice(1)) round(G, s, e, null, car);
  assert.equal(d.contract.clauses.settled, true);
  assert.equal(d.morale, 60);
  assert.ok(d.memory.some((m) => m.event.includes("incumplida")));
  assert.equal(G.Drivers.releaseQuote(d), d.contract.salary * 3);
  G.Storage.validate(s);
});
test("Renovación: opción negociada, salario devengado conservado y condiciones revalidadas", () => {
  const { G, s } = game(714),
    d = hire(G, s, { renewalOption: true }),
    end = d.contract.end;
  d.contract.accrued = 123;
  assert.throws(
    () => G.Contracts.renewDriver(s, d.id, d.contract.salary, 12),
    /60 días/,
  );
  s.day = end - 60;
  const salary = Math.ceil(d.contract.salary * 1.03);
  G.Contracts.renewDriver(s, d.id, salary, 12);
  assert.equal(d.contract.end, end + 360);
  assert.equal(d.contract.accrued, 123);
  assert.equal(d.contract.clauses.renewalUsed, true);
  assert.ok(d.memory.some((m) => m.event.includes("Renovación")));
  G.Storage.validate(s);
});
test("Rivales: adjudicación del mismo presupuesto y alineación compatible con sus obligaciones", () => {
  const { G, s } = game(715);
  s.day = 8;
  G.Contracts.aiDaily(s);
  const contracts = s.commercial.contracts.filter(
    (c) => c.companyId !== s.playerId,
  );
  assert.ok(contracts.length >= 1);
  assert.equal(
    new Set(contracts.map((c) => c.providerId)).size,
    contracts.length,
  );
  for (const c of contracts) {
    const p = s.commercial.providers.find((p) => p.id === c.providerId);
    assert.ok(p.balance < 35000);
    if (c.driverId)
      assert.equal(G.Companies.lineup(s, c.companyId).driver.id, c.driverId);
  }
  const after = JSON.stringify(s);
  G.Contracts.aiDaily(s);
  assert.equal(JSON.stringify(s), after);
  G.Storage.validate(s);
});
test("Guardar/cargar conserva negociación, reservas, deuda, promoción pendiente y RNG", () => {
  const { G, s } = game(716),
    c = sign(G, s, "manufacturer");
  G.Contracts.promotion(s, c.id);
  G.Contracts.borrow(s, 1000, 3);
  G.Contracts.negotiate(s, offer(G, s).id, { advance: 10000, perRound: 3000 });
  const before = json(s),
    copy = G.Storage.unpack(G.Storage.pack(s)).state;
  assert.deepEqual(json(copy), before);
  G.Calendar.advance(s, 1);
  G.Calendar.advance(copy, 1);
  assert.deepEqual(json(copy), json(s));
  G.Storage.validate(copy);
});
test("Migración 0.3.1 auténtica inicializa comercio una vez y no cambia carrera ni RNG", () => {
  const { G } = engine(),
    raw = fs.readFileSync(
      path.join(__dirname, "fixtures/v31-race.json"),
      "utf8",
    ),
    old = JSON.parse(JSON.parse(raw).data),
    s = G.Storage.unpack(raw).state;
  assert.equal(s.commercial.version, 1);
  assert.deepEqual(json(s.race), old.race);
  assert.equal(s.rng, old.rng);
  assert.deepEqual(json(s.cars), old.cars);
  assert.deepEqual(json(s.drivers), old.drivers);
  const once = json(s);
  assert.deepEqual(json(G.Storage.unpack(G.Storage.pack(s)).state), once);
  while (!s.race.finished) G.Race.tick(s, 500);
  assert.deepEqual(
    json(G.Race.finish(s)),
    JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "fixtures/v31-results.json"),
        "utf8",
      ),
    ),
  );
});
test("Validación comercial: rechaza reservas, duplicados, propiedad, cuotas y cláusulas corruptas", () => {
  const { G, s } = game(717);
  sign(G, s);
  G.Contracts.borrow(s, 2000, 3);
  hire(G, s, { winBonus: 150 });
  for (const mutate of [
    (x) => x.commercial.contracts[0].escrow++,
    (x) => x.commercial.contracts.push(G.clone(x.commercial.contracts[0])),
    (x) => x.commercial.loans[0].schedule[0].principal++,
    (x) => (x.commercial.loans[0].schedule[0].due = NaN),
    (x) => (x.commercial.providers[0].balance = -1),
    (x) => (G.ownedDrivers(x)[0].contract.clauses.promiseShare = 0.9),
  ]) {
    const copy = G.clone(s);
    mutate(copy);
    assert.throws(() => G.Storage.validate(copy));
  }
  G.Storage.validate(s);
});

test("Acuerdo técnico: una pieza comprada e instalada de verdad habilita el pago por ronda", () => {
  const { G, s } = game(718),
    d = hire(G, s),
    car = G.ownedCars(s)[0],
    p = G.Workshop.buy(s, G.Workshop.stock(s, "brakes-club")[0].id);
  G.Workshop.install(s, car.id, p.id);
  G.Calendar.advance(s, car.repair.end - s.day);
  assert.equal(car.installed.brakes, p.id);
  const c = sign(G, s, "technical"),
    cash = G.player(s).balance;
  round(G, s, s.season.events[0], d, car);
  assert.equal(c.fulfilledIds.length, 1);
  assert.equal(G.player(s).balance, cash + c.terms.perRound);
  G.Storage.validate(s);
});
test("Cuota del70%: cinco de seis rondas cumplen; cuatro generan la devolución pactada", () => {
  for (const count of [4, 5]) {
    const { G, s } = game(720 + count),
      c = sign(G, s, "manufacturer"),
      d = s.drivers.find((d) => d.id === c.driverId),
      car = s.cars.find((car) => car.id === c.carId);
    G.Contracts.promotion(s, c.id);
    G.Calendar.advance(s, 1);
    for (const [i, e] of s.season.events.entries())
      round(G, s, e, i < count ? d : null, car);
    assert.equal(c.status, count === 5 ? "completed" : "breached");
    assert.equal(c.penalty > 0, count === 4);
    G.Storage.validate(s);
  }
});
test("Bancarrota con obligaciones libera reservas y mantiene la deuda bancaria registrada", () => {
  const { G, s } = game(727),
    c = sign(G, s),
    l = G.Contracts.borrow(s, 1000, 3),
    bank = s.commercial.bank.balance;
  G.player(s).balance = -10000;
  for (let i = 0; i < 14; i++) G.Economy.assess(s);
  assert.equal(s.status, "bankrupt");
  assert.equal(c.status, "breached");
  assert.equal(c.escrow, 0);
  assert.equal(l.status, "defaulted");
  assert.equal(s.commercial.bank.balance, bank);
  assert.ok(G.Contracts.debt(s) > 1000);
  G.Storage.validate(s);
});
test("Financiar un coche en descubierto no causa una firma parcial ni duplica el presupuesto al renovar", () => {
  const { G, s } = game(728),
    o = offer(G, s, "manufacturer");
  G.player(s).balance = -1200;
  const before = JSON.stringify(s);
  assert.throws(
    () => G.Contracts.sign(s, o.id, { advance: 0, perRound: 0, promotions: 1 }),
    /descubierto/,
  );
  assert.equal(JSON.stringify(s), before);
  G.player(s).balance = 12000;
  const budgets = s.commercial.providers.map((p) => p.balance),
    rng = s.rng;
  s.season = G.makeSeason(s, 2027);
  G.Contracts.openSeason(s);
  assert.equal(s.commercial.offers.filter((o) => o.year === 2027).length, 5);
  G.Contracts.openSeason(s);
  assert.equal(s.commercial.offers.filter((o) => o.year === 2027).length, 5);
  assert.deepEqual(
    s.commercial.providers.map((p) => p.balance),
    budgets,
  );
  assert.equal(s.rng, rng);
  G.Storage.validate(s);
});

test("La moral de un conflicto afecta al ritmo real de las carreras nuevas sin cambiar las antiguas", () => {
  const { G, s } = game(729),
    d = hire(G, s, { promiseShare: 1 }),
    e = G.nextEvent(s),
    car = G.ownedCars(s)[0];
  G.Race.register(s, e.id, d.id, car.id);
  G.Calendar.advance(s, e.day);
  G.Race.start(s, e.id);
  s.race.entrants = s.race.entrants.filter((a) => a.companyId === s.playerId);
  const copy = G.clone(s);
  s.race.entrants[0].morale = 75;
  copy.race.entrants[0].morale = 30;
  G.Race.tick(s, 500);
  G.Race.tick(copy, 500);
  assert.ok(s.race.entrants[0].progress > copy.race.entrants[0].progress);
  G.Storage.validate(s);
  G.Storage.validate(copy);
});

test("Pagar el atraso regulariza el préstamo y conserva el historial de impago sin volver a multar", () => {
  const { G, s } = game(730),
    l = G.Contracts.borrow(s, 2000, 3);
  G.player(s).balance = 0;
  s.day = 44;
  G.Contracts.daily(s);
  assert.equal(l.status, "defaulted");
  G.player(s).balance = 1000;
  G.Contracts.daily(s);
  assert.equal(l.status, "active");
  assert.equal(l.schedule[0].paid, true);
  assert.equal(l.defaultRecorded, true);
  assert.equal(s.commercial.profiles.player.defaults, 1);
  assert.ok(G.Contracts.debt(s) > 0);
  G.Storage.validate(s);
});
