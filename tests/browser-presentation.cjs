/* Cámaras, escala del circuito, controles de retransmisión y sonido opcional. */
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
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: "test-results/redesign-menu.png",
      fullPage: true,
    });
    await page.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Aster Motorsport", "", 601);
      G.App.setState(s, 1);
    });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: "test-results/redesign-hq.png",
      fullPage: true,
    });
    // Todas las áreas tienen texto visible en la navegación principal.
    const navigation = page.locator(".rail-nav [data-go]");
    assert.equal(await navigation.count(), 18);
    for (const el of await navigation.all())
      assert.ok((await el.innerText()).trim().length > 3);
    await page.locator('.rail-nav [data-go="workshop"]').click();
    await page
      .locator('[data-action="workshop-tab"][data-value="catalog"]')
      .click();
    assert.equal(await page.locator(".part-card:visible").count(), 14);
    await page.locator("#workshop-search").fill("frenos");
    assert.ok((await page.locator(".part-card:visible").count()) > 0);
    assert.ok((await page.locator(".part-card:visible").count()) < 14);
    assert.equal(
      await page
        .locator("#workshop-search")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.locator("#workshop-search").fill("zz-no-existe");
    assert.equal(await page.locator(".part-card:visible").count(), 0);
    assert.equal(
      await page.locator("#workshop-filter-empty").isVisible(),
      true,
    );
    await page.locator("#workshop-search").fill("");
    await page
      .locator('[data-action="workshop-filter"][data-value="compatible"]')
      .click();
    assert.ok((await page.locator(".part-card:visible").count()) > 0);
    assert.equal(
      await page
        .locator('.part-card[data-part-compatible="false"]:visible')
        .count(),
      0,
    );
    await page
      .locator('[data-action="workshop-tab"][data-value="diagnosis"]')
      .click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: "test-results/redesign-workshop.png",
      fullPage: true,
    });
    await page.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        d = s.drivers.find((d) => !d.companyId),
        e = G.nextEvent(s);
      G.Drivers.offer(s, d.id, d.ask, 12, 0);
      G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
      G.Calendar.advance(s, e.day);
      G.Race.start(s, e.id);
      G.Race.tick(s, 500);
      G.App.paused = true;
      G.App.view = "race";
      G.App.render();
    });
    await page.waitForTimeout(700);
    const before = await page.evaluate(() => JSON.stringify(RCS.App.state));
    assert.equal(
      await page.locator("#camera-button").innerText(),
      "Cámara: TV",
    );
    const originalScale = await page.evaluate(
      () =>
        RCS.Render.cameraInfo(
          document.querySelector("#race-canvas"),
          RCS.App.state.race,
          0,
        ).scale,
    );
    await page.locator('[data-action="camera-zoom"][data-value="in"]').click();
    await page.waitForTimeout(700);
    assert.ok(
      (await page.evaluate(
        () =>
          RCS.Render.cameraInfo(
            document.querySelector("#race-canvas"),
            RCS.App.state.race,
            0,
          ).scale,
      )) > originalScale,
    );
    await page.locator(".timing-row").last().click();
    await page.waitForTimeout(700);
    assert.equal(
      await page.locator("#camera-button").innerText(),
      "Cámara: seguimiento",
    );
    assert.equal(
      await page.evaluate(() => {
        const A = RCS.App,
          r = A.state.race,
          chosen = r.entrants.find((a) => a.carId === A.camera.focusId);
        return (
          RCS.Render.cameraInfo(
            document.querySelector("#race-canvas"),
            r,
            r.track,
          ).focusId === chosen.companyId
        );
      }),
      true,
    );
    await page.locator("#camera-button").click();
    assert.equal(
      await page.locator("#camera-button").innerText(),
      "Cámara: circuito",
    );
    await page.waitForTimeout(700);
    await page.screenshot({
      path: "test-results/redesign-circuit.png",
      fullPage: true,
    });
    await page.locator("#camera-button").click();
    await page.locator('[data-action="camera-zoom"][data-value="out"]').click();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: "test-results/redesign-race.png",
      fullPage: true,
    });
    // Dibujar todos los trazados no consume el RNG ni altera la carrera guardada.
    const geometry = await page.evaluate(() => {
      const G = RCS,
        r = G.App.state.race,
        c = document.createElement("canvas");
      c.style = "width:900px;height:600px;position:fixed;left:-10000px";
      document.body.append(c);
      const result = G.Data.tracks.map((t, i) => {
        G.Render.track(c, r, i, null, { mode: "overview" });
        const p = G.Render.worldPoint(i, 100, 0),
          q = G.Render.worldPoint(i, 100, r.trackWidth);
        return {
          length: G.Render.metrics(i).length,
          width: Math.hypot(p.x - q.x, p.y - q.y),
          carLength: r.entrants[0].length,
        };
      });
      c.remove();
      return result;
    });
    for (const t of geometry) {
      assert.ok(t.length > 1500);
      assert.ok(Math.abs(t.width - 12.4) < 0.001);
      assert.ok(t.width / t.carLength > 2.5 && t.width / t.carLength < 3.5);
    }
    assert.equal(
      await page.evaluate(() => JSON.stringify(RCS.App.state)),
      before,
    );
    // El audio solo se crea tras un gesto y se puede silenciar y pausar.
    assert.equal(await page.evaluate(() => RCS.Sound.enabled), false);
    await page.locator("#audio-button").click();
    await page.waitForFunction(
      () => RCS.Sound.enabled && RCS.Sound.context?.state === "running",
    );
    assert.equal(
      await page.locator("#audio-button").getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#pause-button").click();
    await page.waitForTimeout(250);
    assert.ok((await page.evaluate(() => RCS.Sound.master.gain.value)) > 0);
    await page.locator("#pause-button").click();
    await page.waitForTimeout(650);
    assert.ok((await page.evaluate(() => RCS.Sound.master.gain.value)) < 0.001);
    await page.locator("#audio-button").click();
    assert.equal(await page.evaluate(() => RCS.Sound.enabled), false);
    // La vista en móvil mantiene cámara, radio, órdenes y guardado accesibles.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    for (const selector of [
      "#camera-button",
      "#pause-button",
      "#audio-button",
      '[data-action="save"]',
      '[data-action="saves"]',
    ])
      assert.equal(
        await page.locator(selector).first().isVisible(),
        true,
        selector,
      );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "test-results/redesign-race-mobile.png",
      fullPage: true,
    });
    // Escenario de impacto controlado: el motor produce los daños y avisos de UI.
    await page.setViewportSize({ width: 1440, height: 1000 });
    const collision = await page.evaluate(() => {
      const G = RCS,
        r = G.App.state.race;
      const a = r.entrants.find((a) => a.companyId === "player"),
        b = r.entrants.find((a) => a.companyId !== "player");
      a.progress = 420;
      b.progress = 423;
      a.lateral = b.lateral = 0;
      a.headingSlip = 0.8;
      b.headingSlip = 0;
      a.speed = 65;
      b.speed = 0;
      a.contactCooldown = b.contactCooldown = 0;
      const body = a.components.body;
      G.Race.resolveContacts(r);
      G.App.cameraOptions = { mode: "broadcast", focusId: a.carId, zoom: 1.7 };
      G.UI.updateRace(G.App.state);
      return {
        damaged: a.components.body < body,
        retired: a.dnf,
        crash: r.events.some((e) => e.type === "crash"),
      };
    });
    assert.deepEqual(collision, { damaged: true, retired: true, crash: true });
    await page.waitForTimeout(700);
    assert.match(await page.locator("#live-flag").innerText(), /PRECAUCIÓN/);
    assert.ok(
      (await page.locator("#live-radio").innerText()).includes("Colisión"),
    );
    assert.equal(
      await page.locator('[data-action="order"]').first().isDisabled(),
      true,
    );
    await page.screenshot({
      path: "test-results/controlled-collision.png",
      fullPage: true,
    });
    await page.locator("#audio-button").click();
    await page.waitForFunction(() => RCS.Sound.enabled);
    await page.locator("#pause-button").click();
    await page.waitForTimeout(650);
    assert.ok(
      (await page.evaluate(() => RCS.Sound.skid.gain.value)) < 0.001,
      "Un retirado girado no mantiene el chirrido de neumáticos",
    );
    await page.locator("#pause-button").click();
    await page.locator("#audio-button").click();
    const summary = await page.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        id = s.race.eventId;
      while (!s.race.finished) G.Race.tick(s, 500);
      const counts = s.race.eventCounts;
      G.Race.finish(s);
      G.App.view = "competition";
      G.App.render();
      G.App.results(id);
      const e = s.season.events.find((e) => e.id === id);
      G.Storage.validate(s);
      return {
        expectedContacts: (counts.contact || 0) + (counts.crash || 0),
        summary: e.raceSummary,
      };
    });
    assert.equal(summary.summary.contacts, summary.expectedContacts);
    const recapContacts = page
      .locator(".race-recap .stat")
      .filter({ hasText: "Contactos" });
    assert.equal(
      Number(await recapContacts.locator("strong").innerText()),
      summary.expectedContacts,
    );
    await page.screenshot({
      path: "test-results/redesign-results.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "OK presentación: navegación, tabs/filtros, 3 cámaras, foco, zoom, 6 circuitos, RNG intacto, audio/pausa, móvil y colisión/daños/recap.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
