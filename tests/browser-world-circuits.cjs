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
      const s = RCS.createGame("Mapamundi Racing", "", 1470);
      RCS.App.setState(s, 1);
      RCS.App.persist();
      RCS.App.go("competition");
    });
    const snapshot = () => p.evaluate(() => JSON.stringify(RCS.App.state)),
      initial = await snapshot(),
      firstTracks = await p.evaluate(() =>
        RCS.App.state.season.events.map((e) => e.track),
      );
    assert.match(
      await p.locator(".tour-overview").innerText(),
      /veinte sedes distintas/,
    );
    assert.equal(await p.locator(".league-event .venue-country").count(), 9);
    await p
      .locator('[data-action="competition-tab"][data-tab="tracks"]')
      .click();
    assert.equal(await p.locator(".circuit-card").count(), 68);
    assert.equal(await p.locator(".country-circuits").count(), 13);
    assert.equal(await p.locator("#atlas-country option").count(), 14);
    assert.equal(await snapshot(), initial);
    await p.screenshot({
      path: "test-results/world-atlas-desktop.png",
      fullPage: true,
    });
    await p.locator("#atlas-country").selectOption("PE");
    assert.equal(await p.locator(".circuit-card").count(), 3);
    assert.match(await p.locator(".country-circuits h2").innerText(), /Perú/);
    await p.locator("#atlas-search").fill("LIMA");
    assert.equal(await p.locator(".circuit-card").count(), 1);
    assert.match(
      await p.locator(".circuit-card").innerText(),
      /Costa de la Bruma/,
    );
    assert.equal(
      await p
        .locator("#atlas-search")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await p.locator("#atlas-search").fill("");
    await p
      .locator(
        '[data-action="track-filter"][data-field="category"][data-value="national"]',
      )
      .click();
    assert.equal(await p.locator(".circuit-card").count(), 1);
    await p
      .locator(
        '[data-action="track-filter"][data-field="difficulty"][data-value="Fácil"]',
      )
      .click();
    assert.equal(await p.locator(".circuit-card").count(), 0);
    assert.equal(await p.locator(".atlas-empty").count(), 1);
    await p.locator('.atlas-empty [data-action="world-track-reset"]').click();
    assert.equal(await p.locator(".circuit-card").count(), 68);
    await p
      .locator(
        '[data-action="world-track-filter"][data-field="scope"][data-value="current"]',
      )
      .click();
    assert.equal(await p.locator(".circuit-card").count(), 20);
    assert.equal(await p.locator(".tour-scheduled").count(), 20);
    await p
      .locator(
        '[data-action="world-track-filter"][data-field="scope"][data-value="new"]',
      )
      .click();
    assert.equal(await p.locator(".circuit-card").count(), 36);
    assert.equal(await snapshot(), initial);
    await p.locator('[data-action="world-track-reset"]').click();
    await p.locator("#atlas-country").selectOption("PE");
    await p.locator('.circuit-card [data-action="track-view"]').last().click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Arequipa · Perú/,
    );
    assert.equal(await p.locator('.modal [data-pit-route="true"]').count(), 1);
    await p.screenshot({
      path: "test-results/world-track-boxes.png",
      fullPage: true,
    });
    await p
      .getByRole("button", { name: "Cerrar ventana", exact: true })
      .click();
    assert.equal(await snapshot(), initial);
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.evaluate(() => RCS.App.render());
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Atlas ${width}`,
      );
      assert.equal(await p.locator(".circuit-card").count(), 3);
      await p.screenshot({
        path: `test-results/world-peru-${width}.png`,
        fullPage: true,
      });
    }
    await p.reload();
    await p.locator('[data-action="load"]').first().click();
    assert.deepEqual(
      await p.evaluate(() => RCS.App.state.season.events.map((e) => e.track)),
      firstTracks,
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      G.player(s).balance = 1000000;
      for (const e of s.season.events) e.status = "skipped";
      s.day = s.season.events.at(-1).day;
      G.Auctions.daily(s);
      G.Commerce.refresh(s);
      G.Competition.completeSeason(s);
      G.App.go("competition");
    });
    await p.locator('.league-next [data-action="next-season"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(await p.evaluate(() => RCS.App.state.season.year), 2027);
    const second = await p.evaluate(() =>
      RCS.App.state.season.events.map((e) => e.track),
    );
    assert.equal(new Set(second).size, 20);
    assert.ok(second.every((i) => !firstTracks.includes(i)));
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      RCS.App.competitionTab = "street";
      RCS.App.render();
    });
    assert.equal(await p.locator(".league-event .venue-country").count(), 9);
    await p.screenshot({
      path: "test-results/world-calendar-2027.png",
      fullPage: true,
    });
    // Importar una empresa 0.11 conserva su calendario; consultar el atlas es una lectura.
    await p.evaluate(() => {
      const G = RCS,
        s = G.createV110Game("Calendario conservado", "", 1470);
      G.App.setState(s, 2);
      G.App.go("competition");
    });
    assert.match(
      await p.locator(".tour-overview").innerText(),
      /siguiente temporada/,
    );
    const legacy = await snapshot();
    await p
      .locator('[data-action="competition-tab"][data-tab="tracks"]')
      .click();
    await p.locator("#atlas-country").selectOption("JP");
    assert.equal(await p.locator(".circuit-card").count(), 3);
    assert.equal(await snapshot(), legacy);
    await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Muro internacional", "", 1470),
        e = s.season.events.find(
          (e) => G.Data.tracks[e.track].country !== "ES" && e.cup === "street",
        ),
        car = G.ownedCars(s)[0];
      s.day = e.day;
      G.Auctions.daily(s);
      G.Commerce.refresh(s);
      const d = G.Commerce.candidates(s).sort((a, b) => a.ask - b.ask)[0];
      const agreement = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!agreement.accepted) G.Drivers.offer(s, d.id, agreement.salary, 12);
      G.Race.register(s, e.id, d.id, car.id);
      G.Race.start(s, e.id);
      G.App.setState(s, 3);
      G.App.paused = true;
      G.App.render();
      G.Storage.validate(s);
    });
    const raceBefore = await snapshot();
    assert.match(
      await p.locator(".race-location").innerText(),
      /Oporto · Portugal/,
    );
    await p.screenshot({
      path: "test-results/world-race-porto.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 1000 });
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    assert.equal(await snapshot(), raceBefore);
    await p.screenshot({
      path: "test-results/world-race-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Atlas 0.12 OK: 68 pistas/13 países, filtros combinados, búsqueda/foco, temporada/novedades, planos de boxes, cambio real de año, calendario antiguo intacto y carrera internacional en tres tamaños.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
