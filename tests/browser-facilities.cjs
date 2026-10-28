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
        viewport: { width: 1440, height: 1050 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await p.evaluate(() =>
      RCS.App.setState(RCS.createGame("Aster Desarrollo", "", 960), 1),
    );
    await p.locator('.rail [data-go="facilities"]').click();
    await p
      .getByRole("heading", { name: "Dale espacio a tu ambición." })
      .waitFor();
    const start = async (key) => {
      await p
        .locator(
          `[data-facility="${key}"] [data-action="construction-preview"]`,
        )
        .click();
      await p.locator("#confirm-action").click();
    };
    const day = async () => {
      await p.getByRole("button", { name: /Avanzar día/ }).click();
    };
    await start("warehouse");
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      10900,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).sparesCapacity),
      8,
    );
    assert.equal(
      await p.locator('[data-action="construction-preview"]:enabled').count(),
      0,
    );
    for (let i = 0; i < 3; i++) await day();
    const refund = await p.evaluate(() => RCS.Facilities.refund(RCS.App.state));
    const beforeCancel = await p.evaluate(
      () => RCS.player(RCS.App.state).balance,
    );
    await p.getByRole("button", { name: "Cancelar obra", exact: true }).click();
    assert.ok(
      (await p.locator(".modal-content").textContent()).includes(
        String(refund),
      ),
    );
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      beforeCancel + refund,
    );
    assert.equal(
      await p.evaluate(() => RCS.Facilities.site(RCS.App.state).project),
      null,
    );
    await start("warehouse");
    for (let i = 0; i < 2; i++) await day();
    const saved = await p.evaluate(() => ({
      project: RCS.Facilities.site(RCS.App.state).project,
      balance: RCS.player(RCS.App.state).balance,
      rng: RCS.App.state.rng,
    }));
    await p.locator('[data-action="save"]').click();
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    assert.deepEqual(
      await p.evaluate(() => ({
        project: RCS.Facilities.site(RCS.App.state).project,
        balance: RCS.player(RCS.App.state).balance,
        rng: RCS.App.state.rng,
      })),
      saved,
    );
    await p.locator('.rail [data-go="facilities"]').click();
    await p.screenshot({
      path: "test-results/expansion06-construction.png",
      fullPage: true,
    });
    for (let i = 0; i < 5; i++) await day();
    assert.equal(await p.evaluate(() => RCS.App.state.day), 10);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).sparesCapacity),
      16,
    );
    assert.match(await p.locator(".estate-costs").textContent(), /0,5/);
    assert.equal(
      await p.evaluate(() => RCS.Facilities.site(RCS.App.state).project),
      null,
    );
    await start("garage");
    // El avance respeta la carrera del día 13; la obra no salta por encima de ella.
    const blocked = await p.evaluate(() =>
      RCS.Calendar.advance(RCS.App.state, 14),
    );
    assert.equal(blocked.blocked, true);
    assert.equal(await p.evaluate(() => RCS.App.state.day), 13);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).carCapacity),
      2,
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      G.Race.skip(s, G.nextEvent(s).id);
      G.Calendar.advance(s, 11);
      G.App.persist();
      G.App.go("facilities");
    });
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).carCapacity),
      4,
    );
    assert.equal(
      await p.evaluate(
        () => RCS.Facilities.site(RCS.App.state).buildings.garage,
      ),
      2,
    );
    await p.screenshot({
      path: "test-results/expansion06-campus.png",
      fullPage: true,
    });
    const active = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    // Se simulan las cinco carreras restantes con el mismo motor, sin insertar resultados.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      G.player(s).balance = 50000; // Reserva controlada para aislar archivo y cambio de temporada.
      while (G.nextEvent(s)) {
        const e = G.nextEvent(s);
        G.Calendar.advance(s, e.day - s.day);
        G.Race.skip(s, e.id);
      }
      G.Calendar.nextSeason(s);
      G.Storage.validate(s);
      G.App.persist();
      G.App.go("history");
    });
    assert.equal(await p.evaluate(() => RCS.App.state.season.year), 2027);
    assert.equal(
      await p.evaluate(() => RCS.App.state.expansion.archive[0].events.length),
      6,
    );
    const recorded = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p
      .getByRole("button", { name: "Consultar pilotos y carreras" })
      .click();
    await p
      .getByRole("heading", { name: "Archivo de la temporada 2026" })
      .waitFor();
    await p.locator(".archive-race summary").first().click();
    assert.ok(
      await p.locator(".archive-race").first().locator("tbody tr").count(),
    );
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      recorded,
    );
    await p
      .locator(".modal")
      .screenshot({ path: "test-results/expansion06-history.png" });
    const archived = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.locator('.modal [data-action="close"]').click();
    // Objetivos controlados: el ascenso se aplica al avanzar una jornada, no al abrir la vista.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        c = G.player(s);
      c.stats.starts = 3;
      c.stats.podiums = 1;
      c.reputation = 4;
      G.App.go("facilities");
    });
    assert.equal(await p.evaluate(() => RCS.player(RCS.App.state).level), 1);
    await day();
    assert.equal(await p.evaluate(() => RCS.player(RCS.App.state).level), 2);
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.evaluate((raw) => {
        RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
        RCS.App.go("facilities");
      }, active);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      assert.equal(await p.locator(".facility-card").count(), 4);
      const snapshot = await p.evaluate(() => JSON.stringify(RCS.App.state));
      await p.locator(".growth-path summary").click();
      assert.equal(await p.locator(".growth-path-row").count(), 10);
      assert.equal(
        await p.evaluate(() => JSON.stringify(RCS.App.state)),
        snapshot,
      );
      await p.locator(".growth-path summary").click();
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({
        path: `test-results/expansion06-facilities-${width}.png`,
        fullPage: true,
      });
      await p.evaluate((raw) => {
        RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
        RCS.App.go("history");
      }, archived);
      await p
        .getByRole("button", { name: "Consultar pilotos y carreras" })
        .click();
      await p.locator(".archive-race summary").first().click();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p
        .locator(".modal")
        .screenshot({ path: `test-results/expansion06-history-${width}.png` });
      await p.locator('.modal [data-action="close"]').click();
    }
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v5-race.json");
    await p.waitForFunction(() => RCS.App.state?.seed === 950);
    assert.equal(await p.evaluate(() => RCS.App.state.expansion.version), 1);
    assert.ok(await p.evaluate(() => RCS.App.state.race.time > 0));
    assert.deepEqual(errors, []);
    console.log(
      "Instalaciones: obra, cancelación, costes, guardado, entrega, bloqueo deportivo, ascenso, archivo y migración 0.5 correctos; seis vistas sin desbordamiento ni errores.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
