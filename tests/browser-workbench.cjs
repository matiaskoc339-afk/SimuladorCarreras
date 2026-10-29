/* 0.9: recorrido real de un usuario, montaje por días, vista previa sin mutaciones,
   devolución física y adaptación a móvil. Caja controlada solo tras verificar el inicio. */
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
      const create = RCS.createGame;
      RCS.createGame = (n, l) => create(n, l, 1700);
    });
    await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
    await p.locator("#company-name").fill("Studio del Asfalto");
    const logo = await p.locator("#logo-canvas").boundingBox();
    await p.mouse.move(logo.x + 25, logo.y + 25);
    await p.mouse.down();
    await p.mouse.move(logo.x + 120, logo.y + 90, { steps: 8 });
    await p.mouse.up();
    await p.getByRole("button", { name: /Fundar compañía/ }).click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    await p.locator('.rail [data-go="workshop"]').click();
    await p.locator(".wb-root").waitFor();
    assert.equal(await p.locator(".wb-hotspot").count(), 7);
    assert.equal(await p.locator('.wb-stat-row[data-stat="hp"]').count(), 1);
    async function state() {
      return p.evaluate(() => JSON.stringify(RCS.App.state));
    }
    async function preview(def) {
      const id = await p.evaluate(
        (def) => RCS.Workshop.stock(RCS.App.state, def)[0].id,
        def,
      );
      if (
        !(await p
          .locator(`[data-action="wb-preview"][data-id="${id}"]`)
          .count())
      )
        await p
          .locator('[data-action="wb-source"][data-source="catalog"]')
          .click();
      await p.locator(`[data-action="wb-preview"][data-id="${id}"]`).click();
      return id;
    }
    async function tab(id) {
      await p.locator(`[data-action="wb-tab"][data-tab="${id}"]`).click();
    }
    async function group(id) {
      await p.locator(`.wb-zone-nav [data-group="${id}"]`).click();
    }
    async function days(n) {
      for (let i = 0; i < n; i++)
        await p.locator('.topbar [data-action="advance"]').click();
    }
    const initial = await state();
    const touring = await preview("shell-touring");
    assert.equal(await state(), initial);
    assert.equal(
      await p.locator(".wb-scene").getAttribute("data-coachwork"),
      "touring",
    );
    assert.match(await p.locator(".wb-stats").innerText(), /Así quedaría/);
    assert.match(await p.locator('[data-stat="weight"]').innerText(), /\+3/);
    await p.locator('[data-action="wb-view"][data-view="top"]').click();
    assert.equal(await p.locator(".wb-top-drawing").count(), 1);
    await p.locator('[data-action="wb-technical"]').click();
    assert.equal(await p.locator(".wb-is-technical").count(), 1);
    assert.equal(await state(), initial);
    await p.locator('[data-action="wb-view"][data-view="side"]').click();
    await p.locator('[data-action="wb-technical"]').click();
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Total hoy: 1240\sUS\$/,
    );
    await p.getByRole("button", { name: "Cancelar", exact: true }).click();
    assert.equal(await state(), initial);
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      2960,
    );
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state)[0].coachwork),
      undefined,
    );
    assert.match(await p.locator(".wb-job-banner").innerText(), /Mano de obra/);
    const packed = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.go("workshop");
    }, packed);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      2960,
    );
    await days(2);
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state)[0].coachwork),
      undefined,
    );
    await days(1);
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state)[0].installed.shell),
      touring,
    );
    assert.match(
      await p.locator(".wb-installed-card").innerText(),
      /Carrocería Touring/,
    );
    assert.ok((await p.locator(".wb-hotspot.has-parts").count()) > 0);
    await p.locator('[data-action="wb-remove"]').click();
    await p.locator("#confirm-action").click();
    await days(1);
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state)[0].coachwork),
      undefined,
    );
    await tab("inventory");
    assert.equal(await p.locator(".wb-catalog-grid .wb-part-card").count(), 1);
    await p.locator("#wb-search").fill("touring");
    assert.equal(
      await p.locator(".wb-catalog-grid .wb-part-card:visible").count(),
      1,
    );
    await p.locator("#wb-search").fill("noexiste");
    assert.equal(
      await p.locator(".wb-catalog-grid .wb-part-card:visible").count(),
      0,
    );
    assert.equal(
      await p
        .locator("#wb-search")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await p.locator("#wb-search").fill("");
    await tab("catalog");
    assert.equal(await p.locator(".wb-catalog-grid .wb-part-card").count(), 29);
    await p.locator("#wb-catalog-slot").selectOption("engine");
    assert.equal(
      await p.locator(".wb-catalog-grid .wb-part-card:visible").count(),
      3,
    );
    await p.locator("#wb-search").fill("Etapa 3");
    assert.equal(
      await p.locator(".wb-catalog-grid .wb-part-card:visible").count(),
      1,
    );
    await p.locator('[data-action="wb-preview"]:visible').click();
    assert.match(await p.locator(".wb-comparison-strip").innerText(), /chasis/);
    assert.equal(
      await p
        .locator('.wb-comparison-strip [data-action="wb-fit"]')
        .isDisabled(),
      true,
    );
    assert.match(await p.locator(".wb-stats").innerText(), /\+120/);
    await tab("build");
    await group("bodywork");
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 100000;
      for (const e of RCS.App.state.season.events) e.day += 365;
      RCS.App.persist();
    });
    await preview("shell-touring");
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    await p.locator("#confirm-action").click();
    await days(3);
    await group("chassis");
    await p.setViewportSize({ width: 1440, height: 2000 });
    await p.evaluate(() => window.scrollTo(0, 0));
    const chassis = await p.evaluate(
        () => RCS.Workshop.stock(RCS.App.state, "chassis-street")[0].id,
      ),
      preDrag = await state();
    await p
      .locator(`[data-wb-unit="${chassis}"] .wb-part-art`)
      .dragTo(p.locator('.wb-hotspot[data-group="engine"]'));
    assert.equal(await state(), preDrag);
    assert.equal(await p.locator("#confirm-action").count(), 0);
    await p
      .locator(`[data-wb-unit="${chassis}"] .wb-part-art`)
      .dragTo(p.locator('.wb-hotspot[data-group="chassis"]'));
    await p.locator("#confirm-action").waitFor();
    assert.equal(await state(), preDrag);
    await p.locator("#confirm-action").click();
    await days(3);
    await p.setViewportSize({ width: 1440, height: 1000 });
    await group("bodywork");
    const old = await p.evaluate(
      () => RCS.ownedCars(RCS.App.state)[0].installed.shell,
    );
    await p.evaluate((id) => {
      const s = RCS.App.state;
      s.parts.find((p) => p.id === id).condition = 64;
      RCS.Workshop.recalculate(s, RCS.ownedCars(s)[0]);
      RCS.App.persist();
    }, old);
    await preview("shell-wide");
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /volverá al almacén/,
    );
    await p.locator("#confirm-action").click();
    await days(4);
    assert.deepEqual(
      await p.evaluate((id) => {
        const p = RCS.App.state.parts.find((p) => p.id === id);
        return [p.carId, p.condition];
      }, old),
      [null, 64],
    );
    await group("chassis");
    assert.equal(
      await p.locator('[data-action="wb-remove"]').isDisabled(),
      true,
    );
    assert.match(
      await p.locator(".wb-installed-card").innerText(),
      /necesita refuerzo/,
    );
    await group("rolling");
    await p.locator("#wb-slot").selectOption("wheels");
    await preview("wheels-sport");
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    await p.locator("#confirm-action").click();
    await days(1);
    await group("bodywork");
    await p.waitForFunction(
      () => !document.querySelector("#toast").classList.contains("show"),
    );
    await p.locator(".wb-stage-panel").scrollIntoViewIfNeeded();
    await p.waitForTimeout(450);
    await p.screenshot({ path: "test-results/workshop-09-desktop.png" });
    await p
      .locator(".wb-stage-panel")
      .screenshot({ path: "test-results/workshop-09-side.png" });
    await p.locator('[data-action="wb-view"][data-view="top"]').click();
    await p
      .locator(".wb-stage-panel")
      .screenshot({ path: "test-results/workshop-09-top.png" });
    for (const width of [1024, 390]) {
      await p.setViewportSize({ width, height: 900 });
      await p.evaluate(() => RCS.App.render());
      await p.waitForTimeout(450);
      for (const t of ["build", "catalog", "inventory", "service"]) {
        await tab(t);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${width}/${t}`,
        );
      }
      await tab("build");
      await p.locator(".wb-stage-panel").scrollIntoViewIfNeeded();
      await p.screenshot({ path: `test-results/workshop-09-${width}.png` });
    }
    await p.locator('[data-action="wb-view"][data-view="side"]').click();
    await p
      .locator(".wb-stage-panel")
      .screenshot({ path: "test-results/workshop-09-mobile-side.png" });
    await p.locator('[data-action="wb-zoom"]').click();
    assert.match(
      await p.locator(".wb-scene").getAttribute("style"),
      /--wb-zoom:1$/,
    );
    await p.locator('[data-action="wb-view"][data-view="top"]').click();
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // La misma preparación se dibuja en la carrera física y se guarda con su ancho.
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        car = G.ownedCars(s)[0],
        d = s.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => a.ask - b.ask)[0],
        e = G.nextEvent(s);
      G.Drivers.offer(s, d.id, d.ask, 12);
      d.contract.end = e.day + 365;
      s.day = e.day;
      G.Race.register(s, e.id, d.id, car.id);
      G.Race.start(s, e.id);
      G.App.paused = true;
      G.App.go("race");
    });
    await p.locator("#race-canvas").waitFor();
    await p.waitForTimeout(400);
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .coachwork.style,
      ),
      "wide",
    );
    await p
      .locator("#race-canvas")
      .screenshot({ path: "test-results/workshop-09-race.png" });
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Importación real 0.8: la activación no cambia coche, precio ni plazo pendiente.
    const oldsave = fs.readFileSync("tests/fixtures/v80-install.json", "utf8");
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.go("garage");
    }, oldsave);
    assert.equal(await p.evaluate(() => RCS.App.state.workbench), undefined);
    const beforeCar = await p.evaluate(() =>
      JSON.stringify(RCS.ownedCars(RCS.App.state)[0]),
    );
    await p.evaluate(() => RCS.App.go("workshop"));
    assert.equal(await p.locator(".wb-root").count(), 1);
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.ownedCars(RCS.App.state)[0])),
      beforeCar,
    );
    await days(2);
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state)[0].repair),
      null,
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Galería de geometrías reales: carrocerías originales, techos abiertos, familiar y deportivos.
    await p.setViewportSize({ width: 1500, height: 1100 });
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      document.body.innerHTML =
        '<div id="gallery" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px;background:#10252f">' +
        [0, 7, 20, 29, 16, 31, 37, 42, 49, 55, 61, 63]
          .map((i) => {
            const c = s.cars.find((c) => c.modelIndex === i);
            return (
              '<article style="color:#dfebe2;font:14px sans-serif;padding:10px;border:1px solid #47606a">' +
              c.brand +
              " " +
              c.model +
              G.CoachworkArt.side(c, { key: "gallery-" + i }) +
              "</article>"
            );
          })
          .join("") +
        "</div>";
    });
    await p
      .locator("#gallery")
      .screenshot({ path: "test-results/workshop-09-models.png" });
    assert.deepEqual(errors, []);
    console.log(
      "Taller visual 0.9 OK: fundación, compra y montaje real, plazo, recambio, arrastre, compatibilidad, importación y 3 tamaños.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
