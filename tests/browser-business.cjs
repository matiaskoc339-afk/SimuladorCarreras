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
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    // Crear la partida por API: el recorrido de creación/dibujo ya tiene su prueba propia.
    await page.evaluate(() => {
      const s = RCS.createLegacyGame("Aster Business", "", 320);
      RCS.Storage.save(1, s);
      RCS.App.setState(s, 1);
    });
    await page.locator('.rail-nav [data-go="companies"]').click();
    await page.locator(".rival-card").first().waitFor();
    assert.equal(await page.locator(".rival-card").count(), 8);
    await page.getByRole("button", { name: "Mercado compartido ↗" }).click();
    assert.equal(await page.locator(".market-card").count(), 6);
    const unit = await page.evaluate(() => {
      const s = RCS.App.state,
        l = s.market[0];
      return {
        listingId: l.id,
        carId: l.carId,
        price: l.price,
        balance: RCS.player(s).balance,
      };
    });
    await page
      .locator(`[data-action="buy-car"][data-id="${unit.listingId}"]`)
      .click();
    await page.locator("#confirm-action").click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).companyId,
        unit.carId,
      ),
      "player",
    );
    assert.equal(
      await page.evaluate(() => RCS.player(RCS.App.state).balance),
      unit.balance - unit.price,
    );
    assert.equal(
      await page.locator('.fleet-nav [data-action="select-car"]').count(),
      2,
    );
    await page
      .getByRole("button", { name: "Poner a la venta", exact: true })
      .click();
    await page.locator('#listing-form button[type="submit"]').click();
    await page.locator('[data-action="withdraw-listing"]').click();
    await page.getByRole("button", { name: "Volver al garaje →" }).click();
    // Seleccionar la segunda unidad no borra ni sustituye la primera.
    await page
      .locator(`[data-action="select-car"][data-id="${unit.carId}"]`)
      .click();
    await page
      .getByRole("button", { name: "Poner a la venta", exact: true })
      .click();
    await page.locator('#listing-form button[type="submit"]').click();
    const sale = await page.evaluate(
      (id) => RCS.App.state.market.find((l) => l.carId === id),
      unit.carId,
    );
    // La IA compra el mismo anuncio desde su comando compartido y el enlace de la noticia abre el activo real.
    const newsId = await page.evaluate(
      ({ id }) => {
        const G = RCS,
          s = G.App.state,
          buyer = s.companies[1];
        G.Market.buy(s, id, buyer.id);
        G.App.persist();
        G.App.go("news");
        return s.news[0].id;
      },
      { id: sale.id },
    );
    await page
      .locator(`[data-action="news-target"][data-id="${newsId}"]`)
      .click();
    await page
      .getByRole("heading", { name: /Propietario: Costa Racing/ })
      .waitFor();
    assert.ok(
      (await page.locator(".modal-content").textContent()).includes(unit.carId),
    );
    await page.getByRole("button", { name: "Cerrar ventana" }).click();
    // Negociar por UI un piloto transferible de un rival: desaparece de origen.
    const driver = await page.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        d = G.ownedDrivers(s, s.companies[1].id)[0];
      d.transferListed = true;
      G.App.go("team");
      return { id: d.id, seller: d.companyId };
    });
    await page
      .locator(`[data-action="transfer-driver"][data-id="${driver.id}"]`)
      .click();
    await page.getByRole("button", { name: "Firmar traspaso" }).click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).companyId,
        driver.id,
      ),
      "player",
    );
    // Oferta rival: rechazar y aceptar solo a través de los controles de la partida.
    await page.evaluate((id) => {
      const G = RCS,
        s = G.App.state;
      G.Companies.offer(s, id, s.companies[2].id);
      G.App.go("team");
    }, driver.id);
    await page.getByRole("button", { name: "Rechazar", exact: true }).click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).companyId,
        driver.id,
      ),
      "player",
    );
    await page.evaluate((id) => {
      const G = RCS,
        s = G.App.state;
      G.Companies.offer(s, id, s.companies[2].id);
      G.App.go("team");
    }, driver.id);
    await page.getByRole("button", { name: "Aceptar traspaso" }).click();
    await page.locator("#confirm-action").click();
    assert.notEqual(
      await page.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).companyId,
        driver.id,
      ),
      "player",
    );
    // Las decisiones empresariales proceden del procesamiento diario, no de la interfaz.
    await page.evaluate(() => {
      RCS.Calendar.advance(RCS.App.state, 8);
      RCS.App.persist();
      RCS.App.go("companies");
    });
    assert.ok(
      await page.evaluate(() =>
        RCS.App.state.companies.some((c) => c.decisions.length),
      ),
    );
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "test-results/companies-02.png",
      fullPage: true,
    });
    await page.evaluate(() => RCS.App.go("market"));
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "test-results/market-02.png",
      fullPage: true,
    });
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 950 });
      for (const view of [
        "hq",
        "garage",
        "team",
        "market",
        "companies",
        "competition",
        "finance",
        "news",
        "history",
      ]) {
        await page.evaluate((v) => RCS.App.go(v), view);
        await page.waitForTimeout(40);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${view} desborda a ${width}px`,
        );
      }
    }
    // Vender incluso el último coche deja una sede/garaje navegable y permite recuperarse.
    await page.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        car = G.ownedCars(s)[0];
      const buyer = s.companies.find(
        (c) =>
          c.id !== s.playerId &&
          c.status === "active" &&
          c.balance >= G.Market.value(car) &&
          G.ownedCars(s, c.id).length < c.carCapacity,
      );
      if (!buyer)
        throw new Error(
          "La prueba necesita un comprador solvente con plaza libre",
        );
      const l = G.Market.list(s, car.id, G.Market.value(car));
      G.Market.buy(s, l.id, buyer.id);
      G.App.persist();
      G.App.go("garage");
    });
    await page
      .getByRole("heading", { name: "El garaje está vacío." })
      .waitFor();
    await page.evaluate(() => RCS.App.go("hq"));
    await page.locator(".hq-map").waitFor();
    assert.equal(await page.locator(".hq-car").count(), 0);
    // Migración de un archivo real 0.1 dentro del navegador.
    await page.evaluate(() => RCS.App.saves());
    await page
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v1-race.json");
    await page.waitForFunction(() => RCS.App.slot === 2 && RCS.App.state?.race);
    await page.evaluate(() => {
      RCS.App.paused = true;
      RCS.App.updatePause();
    });
    assert.equal(await page.evaluate(() => RCS.App.state.version), 3);
    assert.ok((await page.locator("#live-standings").innerText()).length);
    const data = await page.evaluate(() => ({
      market: RCS.App.state.market.length,
      ids: RCS.App.state.cars.map((c) => c.id),
    }));
    await page
      .getByRole("button", { name: "Guardar partida", exact: true })
      .click();
    await page.reload();
    await page.locator('[data-action="load"][data-slot="2"]').click();
    await page.evaluate(() => (RCS.App.paused = true));
    assert.deepEqual(
      await page.evaluate(() => RCS.App.state.cars.map((c) => c.id)),
      data.ids,
    );
    assert.equal(
      await page.evaluate(() => RCS.App.state.market.length),
      data.market,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Browser 0.2 OK: mercado, compras/ventas, selección de flota, traspasos, consentimiento, noticia→activo, IA diaria, garaje vacío, migración 0.1 en carrera y 27 pantallas sin desbordamiento.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
