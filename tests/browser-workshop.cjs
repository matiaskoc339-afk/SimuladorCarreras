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
    const info = await page.evaluate(() => {
      const G = RCS,
        s = G.createGame("Aster Engineering", "", 403),
        d = s.drivers.find((d) => !d.companyId);
      G.Drivers.offer(s, d.id, d.ask, 12, 0);
      G.Storage.save(1, s);
      G.App.setState(s, 1);
      const c = G.ownedCars(s)[0];
      return { id: c.id, brakes: c.brakes };
    });
    await page.locator('g[data-go="garage"]').click();
    await page
      .getByRole("button", { name: "Abrir taller de modificaciones ↗" })
      .click();
    await page
      .getByRole("heading", { name: "El rendimiento se construye." })
      .waitFor();
    async function workshopTab(tab) {
      await page
        .locator(`[data-action="workshop-tab"][data-value="${tab}"]`)
        .click();
      await page
        .locator(`[data-workshop-panel="${tab}"]`)
        .waitFor({ state: "visible" });
    }
    async function buy(definition) {
      await workshopTab("catalog");
      const id = await page.evaluate(
        (key) => RCS.Workshop.stock(RCS.App.state, key)[0].id,
        definition,
      );
      await page
        .locator(`[data-action="part-preview"][data-id="${id}"]`)
        .first()
        .click();
      await page
        .getByRole("button", { name: "Comprar repuesto", exact: true })
        .click();
      await page.locator("#confirm-action").click();
      await workshopTab("inventory");
      return id;
    }
    const part = await buy("brakes-club");
    await page
      .locator(`[data-action="install-part"][data-id="${part}"]`)
      .click();
    await page.locator("#confirm-action").click();
    const balance = await page.evaluate(
      () => RCS.player(RCS.App.state).balance,
    );
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).brakes,
        info.id,
      ),
      info.brakes,
    );
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    assert.ok(
      await page.evaluate(
        (id) => RCS.App.state.parts.find((p) => p.id === id).reservedFor,
        part,
      ),
    );
    await page
      .getByRole("button", { name: "Guardar partida", exact: true })
      .click();
    await page.reload();
    await page.locator('[data-action="load"][data-slot="1"]').click();
    await page.locator('g[data-go="garage"]').click();
    await page
      .getByRole("button", { name: "Abrir taller de modificaciones ↗" })
      .click();
    assert.equal(
      await page.evaluate(() => RCS.player(RCS.App.state).balance),
      balance - 18,
    );
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).brakes,
        info.id,
      ),
      info.brakes + 11,
    );
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.parts.find((p) => p.id === id).carId,
        part,
      ),
      info.id,
    );
    assert.equal(
      await page
        .locator(`[data-action="install-part"][data-id="${part}"]`)
        .count(),
      0,
    );
    const wrong = await buy("ecu-t23");
    assert.equal(
      await page
        .locator(`[data-action="install-part"][data-id="${wrong}"]`)
        .isDisabled(),
      true,
    );
    assert.ok(
      (await page.locator(".spare-inventory").textContent()).includes(
        "Modelo incompatible",
      ),
    );
    const ecu = await buy("ecu-ep3");
    await page
      .locator(`[data-action="install-part"][data-id="${ecu}"]`)
      .click();
    await page.locator("#confirm-action").click();
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).hp,
        info.id,
      ),
      205,
    );
    await workshopTab("installed");
    await page
      .locator('[data-action="remove-part"][data-slot="brakes"]')
      .click();
    await page.locator("#confirm-action").click();
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.parts.find((p) => p.id === id).carId,
        part,
      ),
      null,
    );
    await page.waitForTimeout(350);
    await page.screenshot({
      path: "test-results/workshop-03.png",
      fullPage: true,
    });
    await page.evaluate(() => RCS.App.go("competition"));
    await page.locator('[data-action="event"]').first().click();
    await page
      .getByRole("button", { name: "Confirmar inscripción · $370" })
      .click();
    await page.getByRole("button", { name: "Volver al calendario" }).click();
    await page.getByRole("button", { name: /Hasta la próxima prueba/ }).click();
    await page.getByRole("button", { name: /Ir a la parrilla/ }).click();
    await page.getByRole("button", { name: /Atacar/ }).click();
    await page.waitForTimeout(500);
    assert.ok(await page.locator(".race-mechanics").count());
    assert.equal(
      await page.evaluate(() => RCS.App.state.race.mechanicalVersion),
      3,
    );
    await page.screenshot({
      path: "test-results/race-mechanics-03.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Pausar", exact: true }).click();
    await page
      .getByRole("button", { name: "Guardar partida", exact: true })
      .click();
    await page.reload();
    await page.locator('[data-action="load"][data-slot="1"]').click();
    await page.evaluate(() => {
      RCS.App.paused = true;
      while (!RCS.App.state.race.finished) RCS.Race.tick(RCS.App.state, 400);
    });
    await page.getByRole("heading", { name: "Bandera a cuadros." }).waitFor();
    await page.getByRole("button", { name: /Volver al paddock/ }).click();
    assert.ok(
      await page.evaluate(
        (id) => RCS.App.state.parts.find((p) => p.id === id).condition < 100,
        ecu,
      ),
    );
    const other = await page.evaluate((id) => {
      const c = RCS.App.state.cars.find((c) => c.id === id);
      return { brakes: c.components.brakes, tires: c.components.tires };
    }, info.id);
    await page.evaluate(() => RCS.App.go("workshop"));
    await workshopTab("diagnosis");
    await page
      .locator('[data-action="repair-component"][data-component="engine"]')
      .click();
    await page.locator("#confirm-action").click();
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Avanzar día", exact: true })
      .click();
    const repaired = await page.evaluate(
      (id) => RCS.App.state.cars.find((c) => c.id === id).components,
      info.id,
    );
    assert.equal(repaired.engine, 100);
    assert.equal(repaired.brakes, other.brakes);
    assert.equal(repaired.tires, other.tires);
    await workshopTab("inventory");
    await page.locator(`[data-action="sell-part"][data-id="${wrong}"]`).click();
    await page.locator("#confirm-action").click();
    assert.equal(
      await page.evaluate(
        (id) => RCS.App.state.parts.find((p) => p.id === id).companyId,
        wrong,
      ),
      null,
    );
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 950 });
      for (const view of [
        "workshop",
        "garage",
        "market",
        "companies",
        "team",
        "competition",
        "finance",
        "news",
        "history",
        "hq",
      ]) {
        await page.evaluate((v) => RCS.App.go(v), view);
        await page.waitForTimeout(35);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${view} desborda a ${width}px`,
        );
        if (view === "workshop" && width === 390) {
          for (const tab of [
            "diagnosis",
            "installed",
            "inventory",
            "catalog",
          ]) {
            await workshopTab(tab);
            assert.equal(
              await page.locator("[data-workshop-panel]:visible").count(),
              1,
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth + 1,
              ),
              false,
              `Taller ${tab} desborda a ${width}px`,
            );
          }
          await page
            .locator('[data-action="workshop-filter"][data-value="brakes"]')
            .click();
          const shown = await page
            .locator(".part-card:visible")
            .evaluateAll((cards) =>
              cards.map((card) => card.dataset.partComponent),
            );
          assert.ok(shown.length > 0);
          assert.ok(shown.every((component) => component === "brakes"));
          await page
            .locator('[data-action="workshop-filter"][data-value="all"]')
            .click();
          await workshopTab("diagnosis");
        }
      }
    }
    await page.evaluate(() => RCS.App.saves());
    await page
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v2-race.json");
    await page.waitForFunction(() => RCS.App.slot === 2 && RCS.App.state?.race);
    await page.evaluate(() => (RCS.App.paused = true));
    assert.equal(await page.evaluate(() => RCS.App.state.version), 3);
    assert.equal(
      await page.evaluate(() => RCS.App.state.race.mechanicalVersion),
      undefined,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Browser 0.3 OK: compra, compatibilidad, reserva, plazo, guardar/reanudar trabajo, montaje/desmontaje, desgaste en carrera, telemetría, reparación focal, venta de repuestos, migración 0.2 y 33 pantallas/pestañas sin desbordamiento.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
