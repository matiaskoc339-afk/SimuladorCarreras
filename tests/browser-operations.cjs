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
        viewport: { width: 1440, height: 1050 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    await p.evaluate(() =>
      RCS.App.setState(RCS.createGame("Aster Operaciones", "", 1263), 1),
    );
    await p.locator('.rail-nav [data-go="operations"]').click();
    assert.match(
      await p.locator(".operations-wait").textContent(),
      /desactivada/,
    );
    await p.locator('[data-action="staff-find"][data-role="manager"]').click();
    const candidate = await p.evaluate(
      () =>
        RCS.App.state.employees
          .filter((e) => e.role === "manager")
          .sort((a, b) => b.skill - a.skill)[0].id,
    );
    await p
      .locator(`[data-employee="${candidate}"] [data-action="staff-profile"]`)
      .click();
    assert.match(await p.locator(".professional-level").textContent(), /NV/);
    await p.locator('[data-action="staff-negotiate"]').click();
    await p.locator('#staff-offer-form [name="salary"]').fill("1400");
    await p.locator('#staff-offer-form [type="submit"]').click();
    await p.locator('.rail-nav [data-go="operations"]').click();
    await p.locator('[name="enabled"]').check();
    await p.locator('[name="monthlyLimit"]').fill("5000");
    await p.locator('[name="dailyLimit"]').fill("2000");
    await p.locator('[name="minimumCash"]').fill("0");
    await p.locator('[name="reserveMonths"]').selectOption("0");
    await p.locator('[name="enable-maintenance"]').check();
    await p.locator('[name="maintenance-below"]').fill("95");
    await p.locator('[name="enable-purchases"]').check();
    await p.locator('[name="parts"][value="cooling-race"]').check();
    await p.locator('#operations-form [type="submit"]').click();
    assert.match(
      await p.locator(".modal-content").textContent(),
      /Tope mensual/,
    );
    await p.locator("#confirm-action").click();
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator('[data-action="operations-run"]').click();
    await p.locator("#confirm-action").click();
    const result = await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        c = G.ownedCars(s)[0];
      return {
        cost: G.Operations.spending(s).total,
        repair: c.repair,
        parts: G.Workshop.inventory(s).length,
        balance: G.player(s).balance,
      };
    });
    assert.ok(result.repair);
    assert.equal(result.parts, 1);
    assert.equal(result.balance, cash - result.cost);
    assert.ok(await p.locator('[data-action="operations-run"]').isDisabled());
    // Mantener lo contratado y cambiar la política para autorizar el montaje siguiente.
    await p.locator('[name="enable-maintenance"]').uncheck();
    await p.locator('[name="enable-inventory"]').check();
    await p.locator('#operations-form [type="submit"]').click();
    await p.locator("#confirm-action").click();
    await p
      .locator('[data-action="operations-tab"][data-tab="activity"]')
      .click();
    assert.match(
      await p.locator(".operations-log-row").first().textContent(),
      /espera|REALIZADO|contratado/i,
    );
    await p.evaluate(() => {
      RCS.App.persist();
      RCS.App.saves();
    });
    await p.locator('[data-action="load"][data-slot="1"]').click();
    await p.locator('.rail-nav [data-go="operations"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Operations.spending(RCS.App.state).total),
      result.cost,
    );
    for (let i = 0; i < 4; i++)
      await p.locator('.topbar [data-action="advance"]').click();
    assert.ok(
      await p.evaluate(
        () => !!RCS.ownedCars(RCS.App.state)[0].installed.cooling,
      ),
    );
    const activeState = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        d = s.drivers.find((d) => !d.companyId);
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.Professionals.care(s, d.id).injuryUntil = s.day + 12;
      G.App.operationsTab = "medical";
      G.App.go("operations");
    });
    await p.locator('[data-action="staff-find"][data-role="doctor"]').click();
    const doctor = await p.evaluate(
      () =>
        RCS.App.state.employees
          .filter((e) => e.role === "doctor")
          .sort((a, b) => b.skill - a.skill)[0].id,
    );
    await p
      .locator(`[data-employee="${doctor}"] [data-action="staff-profile"]`)
      .click();
    await p.locator('[data-action="staff-negotiate"]').click();
    await p.locator('#staff-offer-form [name="salary"]').fill("1400");
    await p.locator('#staff-offer-form [type="submit"]').click();
    await p.locator('.rail-nav [data-go="operations"]').click();
    const medicalState = await p.evaluate(() =>
      RCS.Storage.pack(RCS.App.state),
    );
    await p.locator('[data-action="operations-treat"]').click();
    assert.match(
      await p.locator(".modal-content").textContent(),
      /Puede no mejorar/,
    );
    await p.locator("#confirm-action").click();
    const treatment = await p.evaluate(() => {
      const s = RCS.App.state,
        c = s.operations.care[0];
      c.roll = 0;
      RCS.App.persist();
      return { id: c.id, until: c.originalUntil, saving: c.potentialSaving };
    });
    assert.match(
      await p.locator(".operations-patient").textContent(),
      /Tratamiento en curso/,
    );
    await p.evaluate(() => RCS.App.saves());
    await p.locator('[data-action="load"][data-slot="1"]').click();
    await p.locator('.rail-nav [data-go="operations"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.operations.care[0].roll),
      0,
    );
    for (let i = 0; i < 2; i++)
      await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p.evaluate(() => {
        const s = RCS.App.state,
          c = s.operations.care[0];
        return RCS.Professionals.care(s, c.driverId).injuryUntil;
      }),
      treatment.until - treatment.saving,
    );
    assert.match(
      await p.locator(".game-body").textContent(),
      /Recuperación adelantada|LESIONADO/,
    );
    await p
      .locator('[data-action="operations-tab"][data-tab="activity"]')
      .click();
    await p.locator('[data-action="operations-pause"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.operations.settings.enabled),
      false,
    );
    await p.locator("#toast.show").waitFor({ state: "hidden" });
    // Tres áreas a tres tamaños; cargar no ejecuta políticas ni sortea resultados médicos.
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const tab of ["policies", "activity", "medical"]) {
        await p.evaluate(
          ({ raw, tab }) => {
            RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
            RCS.App.operationsTab = tab;
            RCS.App.go("operations");
          },
          { raw: tab === "medical" ? medicalState : activeState, tab },
        );
        await p.waitForTimeout(120);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${tab} a ${width}px`,
        );
        assert.ok(
          await p.evaluate(() => {
            const input = document.querySelector(".operations-switch input");
            return !input || parseFloat(getComputedStyle(input).width) <= 20;
          }),
        );
        await p.screenshot({
          path: `test-results/ops063-${tab}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
    }
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v62-practice.json");
    await p.waitForFunction(
      () =>
        RCS.App.state?.seed === 1263 && !!RCS.Practice.active(RCS.App.state),
    );
    assert.equal(await p.evaluate(() => RCS.App.practicePaused), true);
    assert.equal(
      await p.evaluate(() => RCS.App.state.operations.settings.enabled),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Operaciones 0.6.3 OK: contratación de gerente/médico, políticas reales, reparación/compra/montaje, presupuesto persistente, pausa, tratamiento/recarga/recuperación y migración de práctica 0.6.2; nueve vistas sin errores ni desbordamiento.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
