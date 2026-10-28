const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    const ids = await p.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Aster Contratos", "", 744);
      G.App.setState(s, 1);
      const o = s.commercial.offers.find(
        (o) =>
          s.commercial.providers.find((p) => p.id === o.providerId).kind ===
          "manufacturer",
      );
      return { offer: o.id, driver: o.driverId, cars: s.cars.length };
    });
    await p.locator('.rail-nav [data-go="contracts"]').click();
    assert.equal(await p.locator(".commercial-card").count(), 5);
    await p
      .locator(`[data-action="sponsor-offer"][data-id="${ids.offer}"]`)
      .click();
    await p.locator('[name="advance"]').fill("9000");
    await p.locator('[name="perRound"]').fill("3000");
    await p
      .getByRole("button", { name: "Presentar propuesta", exact: true })
      .click();
    await p.getByText("Contraoferta de la marca", { exact: true }).waitFor();
    assert.ok(Number(await p.locator('[name="advance"]').inputValue()) < 9000);
    await p.locator('[name="advance"]').fill("600");
    await p.locator('[name="perRound"]').fill("200");
    await p.locator('[name="targetPosition"]').selectOption("8");
    await p
      .getByRole("button", { name: "Presentar propuesta", exact: true })
      .click();
    await p.getByRole("button", { name: "Revisar y firmar" }).click();
    await p.getByRole("heading", { name: "Firmar con obligaciones" }).waitFor();
    assert.match(await p.locator(".modal-content").innerText(), /piloto/);
    await p.locator("#confirm-action").click();
    const deal = await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        c = G.Contracts.live(s)[0];
      return {
        id: c.id,
        car: c.carId,
        driver: c.driverId,
        ownedCars: G.ownedCars(s).length,
        ownedDrivers: G.ownedDrivers(s).length,
        cars: s.cars.length,
      };
    });
    assert.equal(deal.driver, ids.driver);
    assert.equal(deal.ownedCars, 2);
    assert.equal(deal.ownedDrivers, 1);
    assert.equal(deal.cars, ids.cars);
    await p.locator('[data-action="sponsor-promotion"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Contracts.live(RCS.App.state)[0].promotions),
      0,
    );
    await p.locator('[data-action="save"]').click();
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    assert.equal(
      await p.evaluate(
        () => RCS.Contracts.live(RCS.App.state)[0].promotionUntil,
      ),
      1,
    );
    await p.locator('[data-action="advance"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Contracts.live(RCS.App.state)[0].promotions),
      1,
    );
    await p.locator('.rail-nav [data-go="contracts"]').click();
    await p
      .locator('[data-action="commercial-tab"][data-value="active"]')
      .click();
    await p.locator('[data-action="sponsor-logo"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.Contracts.live(RCS.App.state)[0].logo),
      false,
    );
    await p.locator('.rail-nav [data-go="team"]').click();
    await p.locator('[data-action="negotiate"]').first().click();
    const secondId = await p.locator("#negotiate-form").getAttribute("data-id");
    await p.locator('[name="contractRole"]').selectOption("reserva");
    await p.locator('[name="winBonus"]').fill("200");
    await p.locator('[name="releaseMonths"]').selectOption("2");
    await p.locator('[name="promiseShare"]').selectOption("1");
    await p.locator('[name="renewalOption"]').check();
    await p
      .getByRole("button", { name: "Presentar oferta", exact: true })
      .click();
    assert.equal(
      await p.evaluate(
        (id) =>
          RCS.App.state.drivers.find((d) => d.id === id).contract.clauses
            .releaseMonths,
        secondId,
      ),
      2,
    );
    await p.locator('.rail-nav [data-go="contracts"]').click();
    await p
      .locator('[data-action="commercial-tab"][data-value="bank"]')
      .click();
    await p.locator('[name="months"]').selectOption("3");
    await p.getByRole("button", { name: "Solicitar propuesta" }).click();
    await p.getByRole("heading", { name: "Propuesta del banco" }).waitFor();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.commercial.loans.length),
      1,
    );
    await p.waitForTimeout(600);
    await p.screenshot({
      path: "test-results/contracts-bank.png",
      fullPage: true,
    });
    await p.evaluate(
      ({ driver, car }) => {
        const G = RCS,
          s = G.App.state,
          e = G.nextEvent(s);
        G.Race.register(s, e.id, driver, car);
        G.Calendar.advance(s, e.day - s.day);
        G.Race.start(s, e.id);
        G.App.view = "race";
        G.App.paused = true;
        G.App.render();
        while (!s.race.finished) G.Race.tick(s, 500);
      },
      { driver: secondId, car: deal.car },
    );
    await p.getByRole("heading", { name: "Bandera a cuadros." }).waitFor();
    await p.locator('[data-action="close"]').click();
    assert.equal(
      await p.evaluate(
        () => RCS.Contracts.live(RCS.App.state)[0].fulfilledIds.length,
      ),
      0,
    );
    assert.equal(
      await p.evaluate(() =>
        RCS.Contracts.live(RCS.App.state)[0].rounds[0].issues.includes(
          "no participa el piloto impuesto",
        ),
      ),
      true,
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        next = G.nextEvent(s);
      G.Calendar.advance(s, next.day - s.day);
      G.App.persist();
      G.App.go("contracts");
      G.App.contractTab = "bank";
      G.App.render();
    });
    assert.equal(
      await p.evaluate(
        () => RCS.App.state.commercial.loans[0].schedule[0].paid,
      ),
      true,
    );
    await p.locator('[data-action="repay-loan"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(await p.evaluate(() => RCS.Contracts.debt(RCS.App.state)), 0);
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    await p.locator('.rail-nav [data-go="contracts"]').click();
    await p
      .locator('[data-action="commercial-tab"][data-value="active"]')
      .click();
    await p.locator('[data-action="sponsor-logo"]').click();
    await p.locator("#confirm-action").click();
    // Las rondas restantes se disputan con el mismo motor. La compañía renuncia y asume el incumplimiento.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      while (G.nextEvent(s)) {
        const e = G.nextEvent(s);
        while (s.day < e.day) {
          if (
            !s.job &&
            s.day - s.lastJob >= 7 &&
            !G.ownedCars(s).some((c) => c.repair)
          )
            G.Economy.job(s);
          G.Calendar.advance(s, Math.min(7, e.day - s.day));
          if (s.status !== "active")
            throw new Error(
              "La compañía debe financiar la temporada de prueba con encargos reales.",
            );
        }
        G.Race.skip(s, e.id);
      }
      G.Storage.validate(s);
      G.App.persist();
      G.App.go("contracts");
      G.App.contractTab = "history";
      G.App.render();
    });
    const outcome = await p.evaluate((id) => {
      const G = RCS,
        s = G.App.state,
        c = s.commercial.contracts.find((c) => c.id === id);
      return {
        status: c.status,
        penalty: c.penalty,
        escrow: c.escrow,
        ledger: G.player(s).ledger.filter((t) =>
          t.label.includes("Devolución e indemnización"),
        ).length,
      };
    }, deal.id);
    assert.equal(outcome.status, "breached");
    assert.ok(outcome.penalty > 600);
    assert.equal(outcome.escrow, 0);
    assert.equal(outcome.ledger, 1);
    // La noticia abre la entidad real; el archivo conserva sus condiciones y las rondas evaluadas.
    const news = await p.evaluate(
      (id) =>
        RCS.App.state.news.find(
          (n) =>
            n.target === "contracts" &&
            n.entityId === id &&
            n.title.includes("incumplido"),
        ).id,
      deal.id,
    );
    await p.evaluate(() => RCS.App.go("news"));
    await p.locator(`[data-action="news-target"][data-id="${news}"]`).click();
    await p.getByRole("heading", { name: /seguimiento/ }).waitFor();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /piloto impuesto/,
    );
    await p.locator('[data-action="close"]').click();
    // Preparación de una renovación dentro del periodo permitido; la firma se realiza por UI.
    const renewal = await p.evaluate((id) => {
      const d = RCS.App.state.drivers.find((d) => d.id === id);
      d.contract.end = RCS.App.state.day + 30;
      d.contract.accrued = 123;
      RCS.App.go("team");
      RCS.App.driverDetail(id);
      return { end: d.contract.end, accrued: d.contract.accrued };
    }, secondId);
    await p.locator('[data-action="renew-driver"]').click();
    await p.getByRole("button", { name: "Aceptar renovación" }).click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).contract.end,
        secondId,
      ),
      renewal.end + 360,
    );
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).contract.accrued,
        secondId,
      ),
      123,
    );
    await p.locator('[data-action="close"]').click();
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.evaluate(() => RCS.App.go("contracts"));
      for (const tab of ["offers", "active", "bank", "history"]) {
        await p
          .locator(`[data-action="commercial-tab"][data-value="${tab}"]`)
          .click();
        await p.waitForTimeout(150);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${tab} a ${width}px`,
        );
        await p.screenshot({
          path: `test-results/contracts-${tab}-${width}.png`,
          fullPage: true,
        });
      }
    }
    // Bancarrota: el archivo financiero sigue siendo consultable y bloquea nuevo crédito.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      G.player(s).balance = -10000;
      for (let i = 0; i < 14; i++) G.Economy.assess(s);
      G.App.contractTab = "bank";
      G.App.go("contracts");
    });
    assert.equal(
      await p.getByRole("button", { name: "Solicitar propuesta" }).isDisabled(),
      true,
    );
    assert.match(await p.locator("#loan-form").innerText(), /bancarrota/);
    // Importación de una carrera0.3.1: continúa en el modelo anterior sin regenerar participantes.
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v31-race.json");
    await p.waitForFunction(() => RCS.App.state?.seed === 731);
    assert.equal(await p.evaluate(() => RCS.App.state.commercial.version), 1);
    assert.equal(await p.evaluate(() => RCS.App.state.race.racingVersion), 1);
    assert.deepEqual(errors, []);
    console.log(
      "Browser0.4 OK: negociación/contraoferta, fabricante/piloto/coche, promoción, logo, cláusulas, crédito/cuota/amortización, incumplimiento real de temporada, noticia→contrato, renovación, import0.3.1 y12vistas1440/1024/390.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
