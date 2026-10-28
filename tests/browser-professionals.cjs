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
    await p.evaluate(() => {
      RCS.App.setState(
        RCS.createLegacyGame("Aster Especialistas", "", 1162),
        1,
      );
      RCS.App.go("garage");
    });
    assert.ok(await p.locator('[data-action="pro-review"]').isDisabled());
    const hire = async (role) => {
      await p.evaluate((role) => {
        RCS.App.go("staff");
        RCS.App.staffTab = "market";
        RCS.App.staffRole = role;
        RCS.App.render();
      }, role);
      const id = await p.evaluate(
        (role) =>
          RCS.App.state.employees
            .filter((e) => e.role === role && e.status === "available")
            .sort((a, b) => b.skill - a.skill)[0].id,
        role,
      );
      await p
        .locator(`[data-employee="${id}"] [data-action="staff-profile"]`)
        .click();
      assert.match(await p.locator(".professional-level").textContent(), /NV/);
      await p.locator('[data-action="staff-negotiate"]').click();
      await p.locator('#staff-offer-form [name="salary"]').fill("1400");
      await p.locator('#staff-offer-form [type="submit"]').click();
      return id;
    };
    const mechanic = await hire("mechanic");
    await p.evaluate(() => RCS.App.go("garage"));
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator('[data-action="pro-review"]').click();
    assert.match(await p.locator(".accuracy-stamp").textContent(), /%/);
    await p
      .locator('[data-action="pro-review-confirm"][data-adjust="1"]')
      .click();
    assert.equal(
      await p.locator(".professional-components .metric").count(),
      7,
    );
    assert.ok(
      await p.evaluate(
        (cash) => RCS.player(RCS.App.state).balance < cash,
        cash,
      ),
    );
    await p.locator('.modal [data-action="close"]').click();
    const coach = await hire("trainer");
    await p.evaluate((mechanic) => {
      const G = RCS,
        s = G.App.state,
        e = s.employees.find((e) => e.id === mechanic);
      G.Professionals.demand(s, e);
      const b = s.companies.find((c) => c.id !== s.playerId);
      b.balance = 100000;
      G.Professionals.poach(s, e.id, b.id);
      G.App.go("staff");
    }, mechanic);
    await p.locator('[data-action="pro-raise"]').click();
    await p.locator('#pro-raise-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.professional.demands[0].status),
      "accepted",
    );
    await p.locator('[data-action="pro-counter"]').click();
    await p.locator('#pro-counter-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.professional.offers[0].status),
      "countered",
    );
    const driver = await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        d = s.drivers.find((d) => !d.companyId);
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.App.go("practice");
      return d.id;
    });
    await p.locator('#practice-form [name="driverId"]').selectOption(driver);
    await p.locator('#practice-form [name="coachId"]').selectOption(coach);
    await p.locator('#practice-form [name="laps"]').selectOption("3");
    assert.match(
      await p.locator("#practice-risk").textContent(),
      /Riesgo estimado/,
    );
    const before = await p.evaluate(
      (driver) =>
        RCS.App.state.drivers.find((d) => d.id === driver).stats.control,
      driver,
    );
    await p.locator('#practice-form [type="submit"]').click();
    assert.match(
      await p.locator(".modal-content").textContent(),
      /Fatiga prevista/,
    );
    await p.locator("#confirm-action").click();
    await p.locator('[data-action="practice-pause"]').click();
    await p.evaluate(() => {
      RCS.Practice.tick(RCS.App.state, 1000);
      RCS.App.persist();
    });
    const practiceState = await p.evaluate(() =>
      RCS.Storage.pack(RCS.App.state),
    );
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(200);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.screenshot({
        path: `test-results/pro062-practice-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await p.setViewportSize({ width: 1440, height: 1050 });
    await p.evaluate(
      (raw) => RCS.App.setState(RCS.Storage.unpack(raw).state, 1),
      practiceState,
    );
    assert.equal(await p.evaluate(() => RCS.App.practicePaused), true);
    await p.locator('[data-action="practice-speed"][data-speed="20"]').click();
    await p.locator('[data-action="practice-pause"]').click();
    assert.equal(await p.evaluate(() => RCS.App.practicePaused), false);
    await p
      .waitForFunction(
        () => !RCS.Practice.active(RCS.App.state),
        {},
        { timeout: 25000 },
      )
      .catch(async (e) => {
        console.log(
          await p.evaluate(() => ({
            paused: RCS.App.practicePaused,
            speed: RCS.App.practiceSpeed,
            j: RCS.Practice.active(RCS.App.state)?.time,
            acc: RCS.ProfessionalUI.practiceAccumulator,
          })),
          errors,
        );
        throw e;
      });
    assert.equal(await p.evaluate(() => RCS.App.state.day), 1);
    assert.ok(
      await p.evaluate(
        ({ driver, before }) =>
          RCS.App.state.drivers.find((d) => d.id === driver).stats.control >
          before,
        { driver, before },
      ),
    );
    await p.evaluate((coach) => {
      RCS.App.go("staff");
      RCS.App.staffTab = "team";
      RCS.App.render();
      RCS.StaffUI.profile(RCS.App, coach);
    }, coach);
    await p.locator('[data-action="pro-rest"][data-days="3"]').click();
    await p.locator("#confirm-action").click();
    assert.match(
      await p.locator(".professional-profile").textContent(),
      /Descanso hasta/,
    );
    await p.locator('.modal [data-action="close"]').click();

    for (const width of [1440, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.evaluate(() => RCS.App.go("staff"));
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.screenshot({
        path: `test-results/pro062-staff-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    // Carrera nueva sin mecánico: se llega al puesto por la física, nunca se completa el minijuego por manipulación de estado.
    await p.setViewportSize({ width: 1440, height: 1050 });
    await p.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Boxes en directo", "", 1162),
        d = s.drivers.find((d) => !d.companyId),
        ev = G.nextEvent(s);
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.Race.register(s, ev.id, d.id, G.ownedCars(s)[0].id);
      G.Calendar.advance(s, ev.day);
      G.Race.start(s, ev.id);
      G.RaceWeekend.requestPit(s, s.playerId, { compound: "hard" });
      const a = s.race.entrants.find((a) => a.companyId === s.playerId);
      for (let n = 0; n < 15000 && a.pit.phase !== "box"; n++)
        G.Race.tick(s, 1);
      G.App.setState(s, 1);
      G.App.paused = true;
    });
    await p.locator("#manual-pit-panel").waitFor({ state: "visible" });
    const progress = await p.evaluate(() => {
      const s = RCS.App.state,
        r = s.race;
      return r.entrants.map((a) => a.progress);
    });
    await p.evaluate(() => (RCS.App.paused = false));
    await p.waitForTimeout(700);
    assert.ok(
      await p.evaluate((progress) => {
        const s = RCS.App.state;
        return s.race.entrants.some(
          (a, i) => a.companyId !== s.playerId && a.progress > progress[i],
        );
      }, progress),
    );
    assert.ok(
      await p
        .locator('[data-action="pit-manual"][data-value="lift"]')
        .isEnabled(),
    );
    await p.locator('[data-action="pit-manual"][data-value="lift"]').click();
    for (let k = 0; k < 2; k++)
      await p
        .locator('[data-action="pit-manual"][data-value="loosen"]')
        .click();
    await p.evaluate(() => {
      RCS.App.paused = true;
      RCS.App.persist();
      RCS.App.saves();
    });
    await p.locator('[data-action="load"][data-slot="1"]').click();
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find(
            (a) => a.companyId === RCS.App.state.playerId,
          ).pit.manual.wheels[0].loose,
      ),
      2,
    );
    await p.evaluate(() => (RCS.App.paused = true));

    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(200);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.locator("#manual-pit-panel").scrollIntoViewIfNeeded();
      await p.screenshot({
        path: `test-results/pro062-boxes-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await p.setViewportSize({ width: 1440, height: 1050 });
    await p.evaluate(() => (RCS.App.paused = false));
    for (let i = 0; i < 4; i++) {
      await p.locator(`[data-action="pit-wheel"][data-wheel="${i}"]`).click();
      for (let k = i === 0 ? 2 : 0; k < 4; k++)
        await p
          .locator('[data-action="pit-manual"][data-value="loosen"]')
          .click();
      await p
        .locator('[data-action="pit-manual"][data-value="remove"]')
        .click();
      await p.locator('[data-action="pit-manual"][data-value="fit"]').click();
      for (let k = 0; k < 4; k++)
        await p
          .locator('[data-action="pit-manual"][data-value="tighten"]')
          .click();
    }
    await p.locator('[data-action="pit-manual"][data-value="lower"]').click();
    await p.locator('[data-action="pit-manual"][data-value="check"]').click();
    await p.waitForFunction(
      () => {
        const s = RCS.App.state;
        return (
          s.race.entrants.find((a) => a.companyId === s.playerId).pit.phase ===
          "none"
        );
      },
      {},
      { timeout: 15000 },
    );
    assert.equal(
      await p.evaluate(() => {
        const s = RCS.App.state;
        return s.race.entrants.find((a) => a.companyId === s.playerId).pitStops;
      }),
      1,
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Control del estratega y datos médicos en la ficha.
    await p.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Decisiones técnicas", "", 1164),
        e = s.employees.find((e) => e.role === "strategist"),
        d = s.drivers.find((d) => !d.companyId),
        ev = G.nextEvent(s);
      G.Staff.offer(s, e.id, { salary: 1400, months: 12 });
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.Race.register(s, ev.id, d.id, G.ownedCars(s)[0].id);
      G.Calendar.advance(s, ev.day);
      G.Race.start(s, ev.id);
      G.App.setState(s, 1);
      G.App.paused = true;
    });
    await p.locator('[data-action="pro-auto"]').click();
    assert.match(
      await p.locator("#professional-strategy").textContent(),
      /control manual/,
    );
    await p.locator('[data-action="pro-auto"]').click();
    assert.match(
      await p.locator("#professional-strategy").textContent(),
      /automáticas/,
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Descubrimientos", "", 1165),
        e = s.employees.find((e) => e.role === "scout");
      G.Staff.offer(s, e.id, { salary: 1400, months: 12 });
      s.day = 20;
      G.Professionals.autoCV(s, e);
      G.App.setState(s, 1);
      G.App.staffTab = "reports";
      G.App.go("staff");
    });
    await p.locator('[data-action="pro-cv"]').click();
    assert.equal(await p.locator(".detail-stats .metric").count(), 4);
    assert.match(
      await p.locator(".modal-content").textContent(),
      /CV presentado por tu ojeador/,
    );
    assert.match(
      await p.locator(".modal-content").textContent(),
      /acierto estimado/,
    );
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v61-race.json");
    await p.waitForFunction(() => RCS.App.state?.seed === 1161);
    assert.equal(
      await p.evaluate(() => RCS.App.state.race.professionalVersion),
      undefined,
    );
    assert.ok(await p.locator("#manual-pit-panel").isHidden());
    assert.deepEqual(errors, []);
    console.log(
      "Profesionales 0.6.2 OK: niveles, diagnóstico, aumentos/competencia, descanso, pista en directo, guardado y cambio completo de cuatro ruedas con rivales en marcha; ocho capturas adaptables y compatibilidad 0.6.1.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
