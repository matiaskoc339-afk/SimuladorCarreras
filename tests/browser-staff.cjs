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
      RCS.App.setState(
        RCS.createLegacyGame("Aster Profesionales", "", 1070),
        1,
      ),
    );
    await p.locator('.rail [data-go="staff"]').click();
    await p
      .getByRole("button", { name: "Explorar profesionales", exact: true })
      .click();
    const candidate = async (role) =>
      p.evaluate(
        (role) =>
          RCS.App.state.employees
            .filter((e) => e.role === role && e.status === "available")
            .sort((a, b) => b.skill - a.skill)[0].id,
        role,
      );
    const viewProfile = async (id) =>
      p
        .locator(`[data-employee="${id}"] [data-action="staff-profile"]`)
        .click();
    const hire = async (role) => {
      await p.locator('[data-action="staff-tab"][data-tab="market"]').click();
      await p
        .locator(`[data-action="staff-role"][data-role="${role}"]`)
        .click();
      const id = await candidate(role);
      await viewProfile(id);
      await p
        .getByRole("button", { name: "Negociar contrato", exact: true })
        .click();
      const salary = await p.evaluate(
        (id) => RCS.App.state.employees.find((e) => e.id === id).ask + 50,
        id,
      );
      await p.locator('#staff-offer-form [name="salary"]').fill(String(salary));
      await p.locator('#staff-offer-form [type="submit"]').click();
      return id;
    };
    const mechanic = await candidate("mechanic");
    await viewProfile(mechanic);
    await p
      .getByRole("button", { name: "Negociar contrato", exact: true })
      .click();
    await p.locator('#staff-offer-form [name="salary"]').fill("150");
    await p.locator('#staff-offer-form [type="submit"]').click();
    assert.match(
      await p.locator(".modal-content").textContent(),
      /Contraoferta/,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      12000,
    );
    await p.locator('#staff-offer-form [name="bonus"]').fill("60");
    await p.locator('#staff-offer-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      11940,
    );
    const scout = await hire("scout");
    assert.equal(
      await p.evaluate(() => RCS.Staff.owned(RCS.App.state).length),
      2,
    );
    await p.evaluate(() => RCS.App.go("garage"));
    await p.locator('[data-action="repair"]').click();
    assert.equal(
      await p.evaluate(() => {
        const j = RCS.ownedCars(RCS.App.state)[0].repair;
        return j.end - j.start;
      }),
      1,
    );
    await p.locator('.rail [data-go="staff"]').click();
    await viewProfile(mechanic);
    assert.ok(
      await p
        .getByRole("button", { name: "Rescindir contrato", exact: true })
        .isDisabled(),
    );
    await p.locator('.modal [data-action="close"]').click();
    await p.locator('[data-action="staff-tab"][data-tab="reports"]').click();
    const target = await p.evaluate(
      () => RCS.App.state.drivers.find((d) => !d.companyId).id,
    );
    await p.locator('#staff-scout-form [name="driver"]').selectOption(target);
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator('#staff-scout-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      cash - 75,
    );
    const day = async () =>
      p.getByRole("button", { name: /Avanzar día/ }).click();
    await day();
    await day();
    const saved = await p.evaluate(() => ({
      employees: RCS.App.state.employees,
      assignments: RCS.App.state.staffing.assignments,
      balance: RCS.player(RCS.App.state).balance,
      rng: RCS.App.state.rng,
    }));
    await p.locator('[data-action="save"]').click();
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    assert.deepEqual(
      await p.evaluate(() => ({
        employees: RCS.App.state.employees,
        assignments: RCS.App.state.staffing.assignments,
        balance: RCS.player(RCS.App.state).balance,
        rng: RCS.App.state.rng,
      })),
      saved,
    );
    await p.locator('.rail [data-go="staff"]').click();
    await p.locator('[data-action="staff-tab"][data-tab="reports"]').click();
    const due = await p.evaluate(
      () => RCS.App.state.staffing.assignments[0].end,
    );
    for (let i = 2; i < due; i++) await day();
    assert.match(
      await p.locator(".scout-report").textContent(),
      /Potencial estimado/,
    );
    const completed = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.getByRole("button", { name: "Abrir informe", exact: true }).click();
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      completed,
    );
    await p
      .locator(".modal")
      .screenshot({ path: "test-results/staff061-report.png" });
    await p.locator('.modal [data-action="close"]').click();
    // Ampliación real: el calendario se detiene en la carrera y la renuncia usa el motor.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        j = G.Facilities.start(s, "office");
      while (s.day < j.end) {
        const result = G.Calendar.advance(s, j.end - s.day);
        if (result.blocked) G.Race.skip(s, result.event.id);
      }
      G.App.persist();
      G.App.go("staff");
    });
    assert.equal(await p.evaluate(() => RCS.Staff.capacity(RCS.App.state)), 4);
    const trainer = await hire("trainer"),
      engineer = await hire("engineer");
    assert.equal(
      await p.evaluate(() => RCS.Staff.owned(RCS.App.state).length),
      4,
    );
    const trainee = await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        d = s.drivers.find((d) => !d.companyId);
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.App.driverDetail(d.id);
      return d.id;
    });
    await p.locator('[data-action="train"][data-value="pace"]').click();
    if (await p.locator('.modal [data-action="close"]').count())
      await p.locator('.modal [data-action="close"]').click();
    const pace = await p.evaluate((id) => {
      const d = RCS.App.state.drivers.find((d) => d.id === id);
      return { value: d.stats.pace, age: d.age };
    }, trainee);
    await day();
    const gain = await p.evaluate(
      (id) => RCS.App.state.drivers.find((d) => d.id === id).stats.pace,
      trainee,
    );
    assert.ok(gain - pace.value > 0.015 * (pace.age < 25 ? 1 : 0.5));
    assert.ok(
      await p.evaluate(
        (id) =>
          RCS.App.state.employees.find((e) => e.id === id).contributions
            .sessions > 0,
        trainer,
      ),
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        c = G.ownedCars(s)[0],
        part = s.parts.find(
          (p) => p.definitionId === "light-body" && p.companyId === null,
        );
      G.Workshop.buy(s, part.id);
      G.Workshop.install(s, c.id, part.id);
      G.App.go("workshop");
      G.App.persist();
    });
    assert.equal(
      await p.evaluate(() => {
        const j = RCS.ownedCars(RCS.App.state)[0].repair;
        return j.end - j.start;
      }),
      2,
    );
    assert.match(
      await p.locator(".workshop-bay").textContent(),
      /Apoyo asignado/,
    );
    await p.screenshot({
      path: "test-results/staff061-workshop.png",
      fullPage: true,
      animations: "disabled",
    });
    await day();
    await day();
    const state = await p.evaluate(() => {
      RCS.Storage.validate(RCS.App.state);
      return RCS.Storage.pack(RCS.App.state);
    });
    // Aislar la ventana de renovación sin avanzar meses de otras obligaciones.
    const beforeRenew = await p.evaluate((id) => {
      const e = RCS.App.state.employees.find((e) => e.id === id);
      e.contract.end = RCS.App.state.day + 30;
      RCS.App.staffTab = "team";
      RCS.App.go("staff");
      return { end: e.contract.end, accrued: e.contract.accrued };
    }, engineer);
    await viewProfile(engineer);
    await p
      .getByRole("button", { name: "Renovar contrato", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Confirmar renovación", exact: true })
      .click();
    assert.deepEqual(
      await p.evaluate((id) => {
        const e = RCS.App.state.employees.find((e) => e.id === id);
        return { end: e.contract.end, accrued: e.contract.accrued };
      }, engineer),
      { end: beforeRenew.end + 360, accrued: beforeRenew.accrued },
    );
    await viewProfile(scout);
    const release = await p.evaluate(
      (id) =>
        RCS.Staff.releaseQuote(
          RCS.App.state.employees.find((e) => e.id === id),
        ),
      scout,
    );
    const cashBefore = await p.evaluate(
      () => RCS.player(RCS.App.state).balance,
    );
    await p
      .getByRole("button", { name: "Rescindir contrato", exact: true })
      .click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      Math.round((cashBefore - release) * 100) / 100,
    );
    await p.evaluate((raw) => {
      const s = RCS.Storage.unpack(raw).state;
      const e = RCS.Staff.owned(s)[0];
      e.contract.arrears = 100;
      RCS.player(s).balance = 500;
      RCS.App.setState(s, 1);
      RCS.App.go("staff");
    }, state);
    await p
      .getByRole("button", { name: "Liquidar pendientes", exact: true })
      .click();
    await p.locator("#confirm-action").click();
    assert.equal(await p.evaluate(() => RCS.Staff.overdue(RCS.App.state)), 0);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      400,
    );
    await p.locator("#toast.show").waitFor({ state: "hidden" });
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const tab of ["team", "market", "reports", "relations"]) {
        await p.evaluate(
          ({ raw, tab }) => {
            RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
            RCS.App.staffTab = tab;
            RCS.App.staffRole = "engineer";
            RCS.App.go("staff");
          },
          { raw: state, tab },
        );
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
        );
        await p.screenshot({
          path: `test-results/staff061-${tab}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
    }
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v6-race.json");
    await p.waitForFunction(() => RCS.App.state?.seed === 1060);
    assert.equal(
      await p.evaluate(() => RCS.App.state.race.staffVersion),
      undefined,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).sparesCapacity),
      16,
    );
    assert.equal(await p.evaluate(() => RCS.App.state.staffing.version), 1);
    assert.deepEqual(errors, []);
    console.log(
      "Personal OK: negociación, nóminas, oficina, asignación, formación, ojeo/guardado, renovación, rescisión, atrasos e importación 0.6; doce vistas sin errores ni desbordamiento.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
