/* UI 0.8: contratación real y progreso por días. Se usa caja controlada después
   de fundar para cubrir varios proyectos y comparar vistas, no como prueba de equilibrio. */
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
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await p.evaluate(() => {
      const create = RCS.createGame;
      RCS.createGame = (name, logo) => create(name, logo, 1580);
    });
    await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
    await p.locator("#company-name").fill("Academia del Asfalto");
    const b = await p.locator("#logo-canvas").boundingBox();
    await p.mouse.move(b.x + 25, b.y + 20);
    await p.mouse.down();
    await p.mouse.move(b.x + 120, b.y + 90, { steps: 10 });
    await p.mouse.up();
    await p.getByRole("button", { name: /Fundar compañía/ }).click();
    await p.locator('[data-action="tutorial-skip"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    assert.equal(
      await p.evaluate(
        () => RCS.Data.models.filter((m) => !m.auctionOnly).length,
      ),
      64,
    );
    await p.evaluate(() => RCS.App.go("research"));
    assert.match(
      await p.locator(".research-locked").innerText(),
      /Contrata un investigador/,
    );
    assert.equal(await p.locator(".research-node").count(), 0);
    await p.evaluate(() => {
      const s = RCS.App.state;
      RCS.player(s).balance = 100000;
      for (const e of s.season.events) e.day += 365;
      RCS.App.persist();
    });
    async function hire(role) {
      await p.evaluate(() => {
        RCS.App.staffTab = "market";
        RCS.App.go("staff");
      });
      await p.locator('[data-action="staff-tab"][data-tab="market"]').click();
      await p
        .locator(`[data-action="staff-role"][data-role="${role}"]`)
        .click();
      const id = await p.evaluate(
        (role) =>
          RCS.App.state.employees
            .filter((e) => e.role === role)
            .sort(
              (a, b) =>
                RCS.Professionals.profile(RCS.App.state, a.id).level -
                RCS.Professionals.profile(RCS.App.state, b.id).level,
            )[0].id,
        role,
      );
      await p
        .locator(`[data-employee="${id}"] [data-action="staff-profile"]`)
        .click();
      await p.locator('[data-action="staff-negotiate"]').click();
      const ask = await p.evaluate(
        (id) => RCS.App.state.employees.find((e) => e.id === id).ask,
        id,
      );
      await p
        .locator('#staff-offer-form [name="salary"]')
        .fill(String(Math.ceil(ask * 1.15)));
      await p.locator('#staff-offer-form [name="months"]').selectOption("3");
      await p.locator('#staff-offer-form [type="submit"]').click();
      assert.equal(
        await p.evaluate(
          (id) => RCS.App.state.employees.find((e) => e.id === id).companyId,
          id,
        ),
        "player",
      );
      return id;
    }
    const scientist = await hire("researcher");
    await p.evaluate(() => RCS.App.go("research"));
    assert.equal(await p.locator(".research-node").count(), 9);
    assert.equal(await p.locator(".research-node.available").count(), 3);
    await p
      .locator('[data-node="learning"] [data-action="research-node"]')
      .click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Total previsto/,
    );
    await p.locator("#confirm-action").click();
    const initial = await p.evaluate(() =>
      JSON.stringify(RCS.App.state.research.project),
    );
    await p.waitForTimeout(700);
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state.research.project)),
      initial,
    );
    await p.locator('.topbar [data-action="advance"]').click();
    assert.ok(await p.evaluate(() => RCS.App.state.research.project.work > 0));
    await p.locator('[data-action="research-pause"]').click();
    const work = await p.evaluate(() => RCS.App.state.research.project.work);
    await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.research.project.work),
      work,
    );
    await p.locator('[data-action="research-resume"]').click();
    await p.locator("#confirm-action").click();
    const packed = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.go("research");
    }, packed);
    assert.equal(
      await p.evaluate(() => RCS.App.state.research.project.scientistId),
      scientist,
    );
    for (
      let i = 0;
      i < 20 && (await p.evaluate(() => !!RCS.App.state.research.project));
      i++
    )
      await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p
        .locator('[data-node="learning"]')
        .evaluate((e) => e.classList.contains("completed")),
      true,
    );
    const coach = await hire("trainer");
    await p.evaluate(() => RCS.App.go("team"));
    const driver = await p.evaluate(
      () =>
        RCS.App.state.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => a.ask - b.ask)[0].id,
    );
    await p.locator(`[data-action="negotiate"][data-id="${driver}"]`).click();
    await p.locator('#negotiate-form [name="months"]').selectOption("3");
    await p.getByRole("button", { name: "Enviar oferta", exact: true }).click();
    await p.evaluate(() => RCS.App.go("practice"));
    await p.locator('#practice-form [name="driverId"]').selectOption(driver);
    await p.locator('#practice-form [name="coachId"]').selectOption(coach);
    assert.match(await p.locator("#practice-risk").innerText(), /días/);
    await p.locator('#practice-form [type="submit"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /distribuidas en/,
    );
    await p.locator("#confirm-action").click();
    const state = await p.evaluate(() => JSON.stringify(RCS.App.state)),
      preview1 = await p
        .locator("#practice-canvas")
        .evaluate((c) => c.toDataURL());
    await p.waitForTimeout(900);
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), state);
    const preview2 = await p
      .locator("#practice-canvas")
      .evaluate((c) => c.toDataURL());
    assert.notEqual(
      preview1,
      preview2,
      "La vista del entrenamiento debe estar animada sin conceder progreso real",
    );
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(150);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.screenshot({
        path: `test-results/development080-campus-${width}.png`,
        fullPage: true,
      });
    }
    await p.locator('[data-action="camp-day"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Practice.active(RCS.App.state).daysWorked),
      1,
    );
    const savedCamp = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.go("practice");
    }, savedCamp);
    assert.equal(
      await p.evaluate(() => RCS.Practice.active(RCS.App.state).daysWorked),
      1,
    );
    await p.evaluate(() => RCS.App.go("finance"));
    assert.equal(await p.evaluate(() => RCS.App.view), "finance");
    await p.evaluate(() => RCS.App.go("practice"));
    for (
      let i = 0;
      i < 35 && (await p.evaluate(() => !!RCS.Practice.active(RCS.App.state)));
      i++
    )
      await p.locator('[data-action="camp-day"]').click();
    assert.match(await p.locator(".modal-content").innerText(), /Qué mejoró/);
    await p.locator('[data-action="close"]').last().click();
    assert.ok(await p.locator(".camp-report").count());
    assert.match(
      await p.locator(".camp-report").first().innerText(),
      /Qué mejoró/,
    );
    await p.locator('[data-action="camp-report"]').first().click();
    assert.match(await p.locator(".modal-content").innerText(), /Qué empeoró/);
    await p.locator('[data-action="close"]').last().click();
    await p.screenshot({
      path: "test-results/development080-report-mobile.png",
      fullPage: true,
    });
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const view of ["research", "practice"]) {
        await p.evaluate((v) => RCS.App.go(v), view);
        await p.waitForTimeout(100);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${view} ${width}`,
        );
        await p.screenshot({
          path: `test-results/development080-${view}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await p.evaluate(() => {
      for (const i of RCS.Circuits.indices()) {
        RCS.Circuits.validate(i);
        const scene = RCS.ModernScene.build(i);
        if (scene.canvas.width < 500) throw Error("Escena vacía " + i);
      }
    });
    await p.evaluate(() => {
      RCS.App.go("competition");
      RCS.App.competitionTab = "tracks";
      RCS.App.render();
    });
    assert.equal(await p.locator(".circuit-card").count(), 32);
    assert.match(await p.locator(".circuit-atlas").innerText(), /Experta/);
    await p
      .locator(
        '[data-action="track-filter"][data-field="difficulty"][data-value="Experta"]',
      )
      .click();
    assert.ok((await p.locator(".circuit-card").count()) < 32);
    await p
      .locator(
        '[data-action="track-filter"][data-field="category"][data-value="street"]',
      )
      .click();
    assert.ok((await p.locator(".circuit-card").count()) > 0);
    await p
      .locator(
        '[data-action="track-filter"][data-field="difficulty"][data-value="Todas"]',
      )
      .click();
    await p
      .locator(
        '[data-action="track-filter"][data-field="category"][data-value="all"]',
      )
      .click();
    await p.screenshot({
      path: "test-results/development080-atlas.png",
      fullPage: true,
    });
    // Actualizar una empresa 0.7 mantiene su calendario, dinero y activos propios.
    const oldSave = fs.readFileSync("tests/fixtures/v70-finished.json", "utf8");
    await p.evaluate((raw) => {
      const G = RCS,
        s = G.Storage.validate(JSON.parse(raw)),
        events = JSON.stringify(s.season.events),
        cash = G.player(s).balance,
        owned = G.ownedCars(s).map((c) => c.id);
      G.App.setState(s, 1);
      G.App.go("research");
      window.oldMigration = { events, cash, owned };
    }, oldSave);
    await p.locator('[data-action="development-enable"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(
        () =>
          JSON.stringify(RCS.App.state.season.events) ===
          window.oldMigration.events,
      ),
      true,
    );
    assert.equal(
      await p.evaluate(
        () => RCS.player(RCS.App.state).balance === window.oldMigration.cash,
      ),
      true,
    );
    assert.equal(
      await p.evaluate(() => RCS.Research.enabled(RCS.App.state)),
      true,
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    assert.deepEqual(errors, []);
    console.log(
      "0.8: científico, árbol, pausa/recarga, programa por días con vista animada, informe real, 32 escenas, actualización y tres tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
