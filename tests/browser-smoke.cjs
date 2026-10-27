/* Comprobación opcional: requiere Playwright y Chromium, nunca para ejecutar el juego. */
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
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await page.getByRole("button", { name: /Fundar mi compañía/ }).click();
    await page.locator("#company-name").fill("Aster Motorsport");
    const box = await page.locator("#logo-canvas").boundingBox();
    await page.mouse.move(box.x + 90, box.y + 160);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + 40, { steps: 10 });
    await page.mouse.move(box.x + 225, box.y + 160, { steps: 10 });
    await page.mouse.up();
    const drawn = await page.evaluate(() => RCS.App.logoData());
    assert.ok(drawn);
    await page.getByRole("button", { name: /Deshacer/ }).click();
    assert.equal(await page.evaluate(() => RCS.App.logoData()), "");
    await page.getByRole("button", { name: /Rehacer/ }).click();
    assert.equal(await page.evaluate(() => RCS.App.logoData()), drawn);
    const png = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar PNG ↗" }).click();
    assert.equal((await png).suggestedFilename(), "logotipo.png");
    await page.getByRole("button", { name: /Fundar compañía/ }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: "test-results/hq.png", fullPage: true });
    assert.equal(await page.evaluate(() => RCS.App.state.companies.length), 8);
    // Navegación real desde el edificio, negociación y firma.
    await page.locator('g[data-go="team"]').click();
    await page.locator('[data-action="negotiate"]').first().click();
    await page.locator('input[name="salary"]').fill("200");
    await page
      .getByRole("button", { name: "Presentar oferta", exact: true })
      .click();
    await page.getByText(/Contraoferta:/).waitFor();
    await page
      .getByRole("button", { name: "Presentar / aceptar oferta" })
      .click();
    assert.equal(
      await page.evaluate(() => RCS.ownedDrivers(RCS.App.state).length),
      1,
    );
    await page.evaluate(() => RCS.App.go("competition"));
    await page.locator('[data-action="event"]').first().click();
    await page
      .getByRole("button", { name: "Confirmar inscripción · $370" })
      .click();
    await page.getByRole("button", { name: "Volver al calendario" }).click();
    await page.getByRole("button", { name: /Hasta la próxima prueba/ }).click();
    assert.equal(await page.evaluate(() => RCS.App.state.day), 13);
    await page.getByRole("button", { name: /Ir a la parrilla/ }).click();
    await page.waitForTimeout(600);
    const pos1 = await page.evaluate(
      () => RCS.App.state.race.entrants[0].progress,
    );
    await page.locator('[data-action="speed"][data-value="4"]').click();
    await page.locator('[data-action="order"][data-value="attack"]').click();
    await page.getByRole("button", { name: "Cámara: TV" }).click();
    await page.waitForTimeout(1000);
    assert.ok(
      (await page.evaluate(() => RCS.App.state.race.entrants[0].progress)) >
        pos1,
    );
    await page.getByRole("button", { name: "Cámara: seguimiento" }).click();
    await page.getByRole("button", { name: "Cámara: circuito" }).click();
    await page.screenshot({ path: "test-results/race.png", fullPage: true });
    await page.getByRole("button", { name: "Pausar", exact: true }).click();
    const paused = await page.evaluate(() => RCS.App.state.race.time);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => RCS.App.state.race.time), paused);
    await page
      .getByRole("button", { name: "Guardar partida", exact: true })
      .click();
    const before = await page.evaluate(() => JSON.stringify(RCS.App.state));
    // Recarga completa: la simulación, el RNG y los participantes se restauran.
    await page.reload();
    await page.locator('[data-action="load"]').first().click();
    await page.evaluate(() => (RCS.App.paused = true));
    const restored = await page.evaluate(() => RCS.App.state);
    const original = JSON.parse(before);
    assert.deepEqual(restored.cars, original.cars);
    assert.deepEqual(restored.companies, original.companies);
    assert.ok(restored.race.time >= original.race.time);
    await page.getByRole("button", { name: "Reanudar", exact: true }).count();
    // Acelerar SOLO el tiempo de simulación desde la misma API; la UI liquida la meta.
    await page.evaluate(() => {
      while (!RCS.App.state.race.finished) RCS.Race.tick(RCS.App.state, 400);
    });
    await page.getByRole("heading", { name: "Bandera a cuadros." }).waitFor();
    await page.getByRole("button", { name: /Volver al paddock/ }).click();
    assert.equal(
      await page.evaluate(() => RCS.App.state.season.events[0].status),
      "completed",
    );
    // Las otras cinco rondas recorren toda la simulación; no hay resultados prefijados.
    for (let i = 1; i < 6; i++) {
      await page.evaluate(() => {
        const G = RCS,
          s = G.App.state,
          d = G.ownedDrivers(s)[0],
          car = G.ownedCars(s)[0],
          e = G.nextEvent(s);
        if (car.tires < 35) G.Economy.tires(s, car.id);
        G.Race.register(s, e.id, d.id, car.id);
        G.Calendar.advance(s, e.day - s.day);
        G.Race.start(s, e.id);
        while (!s.race.finished) G.Race.tick(s, 400);
        G.App.view = "race";
        G.App.render();
      });
      await page.getByRole("heading", { name: "Bandera a cuadros." }).waitFor();
      await page
        .getByRole("button", {
          name: i === 5 ? "Ver clasificación final" : "Volver al paddock",
          exact: false,
        })
        .click();
    }
    assert.equal(await page.evaluate(() => RCS.App.state.history.length), 1);
    assert.equal(
      await page.evaluate(() => RCS.App.state.season.phase),
      "complete",
    );
    const jsonDownload = page.waitForEvent("download");
    await page.evaluate(() => RCS.App.action("export", {}));
    const dl = await jsonDownload;
    await dl.saveAs("test-results/temporada.json");
    await page.evaluate(() => RCS.App.go("history"));
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/season.png", fullPage: true });
    // Todas las pantallas, tamaños de PC y tamaño pequeño sin desbordamiento.
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const view of [
        "hq",
        "garage",
        "team",
        "competition",
        "finance",
        "news",
        "history",
      ]) {
        await page.evaluate((v) => RCS.App.go(v), view);
        await page.waitForTimeout(30);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        assert.equal(overflow, false, `${view} desborda a ${width}px`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => RCS.App.go("finance"));
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/finance.png", fullPage: true });
    await page.evaluate(() => RCS.App.saves());
    await page
      .locator("#import-file")
      .setInputFiles("test-results/temporada.json");
    await page.waitForFunction(() => RCS.App.slot === 2);
    assert.equal(
      await page.evaluate(() => RCS.App.state.season.phase),
      "complete",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "Browser OK: logo, negociación, contrato, inscripción, carrera animada, órdenes, pausa, recarga, temporada, exportación/importación y 21 pantallas sin desbordamiento.",
    );
    // Inicio autónomo sin servidor ni red.
    const standalone = await context.newPage();
    standalone.on("pageerror", (e) => errors.push(e.message));
    try {
      await standalone.goto(
        "file://" + require("node:path").resolve("index.html"),
      );
      await standalone
        .getByRole("button", { name: /Fundar mi compañía/ })
        .waitFor();
      assert.equal(errors.length, 0, errors.join("\n"));
      console.log("Inicio file:// OK.");
    } catch (error) {
      if (!error.message.includes("ERR_BLOCKED_BY_ADMINISTRATOR")) throw error;
      console.log(
        "SKIP file://: bloqueado por la política del navegador del entorno. Inicio HTTP verificado.",
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
