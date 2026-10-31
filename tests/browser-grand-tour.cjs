const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
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
        reducedMotion: "reduce",
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await p.evaluate(() => {
      RCS.App.setState(RCS.createGame("Sueños de Fórmula", "", 1470), 1);
      RCS.App.persist();
      RCS.App.go("market");
    });
    await p
      .getByRole("button", {
        name: "Autos nuevos · concesionario",
        exact: true,
      })
      .click();
    assert.equal(await p.locator(".market-card").count(), 72);
    await p.locator('[data-action="grand-filter"][data-key="formula"]').click();
    assert.equal(await p.locator(".market-card").count(), 6);
    assert.equal(
      await p.locator('.market-card [data-grand-shape="formula"]').count(),
      6,
    );
    assert.equal(
      await p.locator('.market-card [data-action="buy-car"]:disabled').count(),
      6,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    await p.screenshot({
      path: "test-results/grand-formula-showroom.png",
      fullPage: true,
    });
    for (const [key, count] of [
      ["prototype", 6],
      ["gt", 6],
      ["supercar", 12],
      ["road", 30],
    ]) {
      await p
        .locator(`[data-action="grand-filter"][data-key="${key}"]`)
        .click();
      assert.equal(await p.locator(".market-card").count(), count);
    }
    await p.locator('[data-action="grand-filter"][data-key="formula"]').click();
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 1000000;
      RCS.App.render();
    });
    await p.locator('.market-card [data-action="buy-car"]').first().click();
    await p.locator("#confirm-action").click();
    const carId = await p.evaluate(
      () =>
        RCS.ownedCars(RCS.App.state).find(
          (c) => RCS.GrandContent.family(c) === "formula",
        ).id,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      350000,
    );
    await p.locator('.rail [data-go="workshop"]').click();
    await p.locator("#wb-car").selectOption(carId);
    assert.equal(
      await p.locator('.wb-scene [data-grand-side="formula"]').count(),
      1,
    );
    assert.equal(await p.locator(".wb-hotspot").count(), 7);
    await p.screenshot({
      path: "test-results/grand-formula-workshop-side.png",
      fullPage: true,
    });
    await p.locator('[data-action="wb-view"][data-view="top"]').click();
    assert.equal(
      await p.locator('.wb-scene [data-grand-shape="formula"]').count(),
      1,
    );
    await p.screenshot({
      path: "test-results/grand-formula-workshop-top.png",
      fullPage: true,
    });
    await p.locator('[data-action="wb-tab"][data-tab="catalog"]').click();
    assert.equal(await p.locator(".wb-part-card").count(), 285);
    await p.locator("#wb-search").fill("Fórmula GP");
    assert.equal(await p.locator(".wb-part-card:visible").count(), 48);
    const partId = await p.evaluate(
      () => RCS.Workshop.stock(RCS.App.state, "grand-formula-intake-0")[0].id,
    );
    const before = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator(`[data-action="wb-preview"][data-id="${partId}"]`).click();
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), before);
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Mano de obra:.*Plazo: 4 días/s,
    );
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).repair.type,
        carId,
      ),
      "install",
    );
    for (let n = 0; n < 5; n++)
      await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).repair,
        carId,
      ),
      null,
    );
    assert.ok(
      await p.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).hp > 650,
        carId,
      ),
    );
    await p.locator('.rail [data-go="competition"]').click();
    await p.locator(".grand-divisions summary").click();
    await p
      .locator('[data-action="grand-division"][data-key="formula"]')
      .click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.grandTour.division),
      "formula",
    );
    assert.match(
      await p.locator('[data-grand-division="formula"]').innerText(),
      /90.000/,
    );
    await p.locator(".grand-divisions").evaluate((e) => (e.open = true));
    await p.screenshot({
      path: "test-results/grand-divisions-desktop.png",
      fullPage: true,
    });
    for (const width of [800, 390]) {
      await p.setViewportSize({ width, height: 950 });
      await p.screenshot({
        path: `test-results/grand-divisions-${width}.png`,
        fullPage: true,
      });
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        e = s.season.events.find((e) => e.cup === "national");
      s.day = e.day;
      G.Auctions.daily(s);
      G.Commerce.refresh(s);
      G.Race.start(s, e.id, true);
      G.Race.tick(s, 80);
      G.App.go("race");
    });
    await p.locator("canvas").first().waitFor();
    assert.equal(await p.evaluate(() => RCS.App.state.race.entrants.length), 6);
    assert.equal(
      await p.evaluate(
        () => RCS.GrandTour.divisionReason(RCS.App.state).length > 0,
      ),
      true,
    );
    await p.screenshot({
      path: "test-results/grand-formula-race.png",
      fullPage: true,
    });
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    assert.deepEqual(errors, []);
    console.log(
      "Gran Serie: 60 modelos, compra, montaje, vistas, categorías, móvil y carrera OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
