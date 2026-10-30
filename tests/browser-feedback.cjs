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
      const s = RCS.createGame("Motivos y soluciones", "", 1470);
      RCS.App.setState(s, 1);
      RCS.App.go("practice");
    });
    assert.match(
      await p.locator("#practice-risk").innerText(),
      /piloto contratado.*entrenador contratado/s,
    );
    assert.equal(
      await p.locator('#practice-form [type="submit"]').isDisabled(),
      true,
    );
    const ids = await p.evaluate(() => {
      const s = RCS.App.state;
      RCS.player(s).balance = 100000;
      s.season.events.forEach((e) => (e.day += 365));
      const d = s.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => a.ask - b.ask)[0],
        e = s.employees
          .filter((e) => e.role === "trainer")
          .sort((a, b) => a.ask - b.ask)[0];
      const agreement = RCS.Drivers.offer(s, d.id, d.ask, 12);
      if (!agreement.accepted) RCS.Drivers.offer(s, d.id, agreement.salary, 12);
      RCS.Staff.offer(s, e.id, {
        salary: Math.ceil(e.ask * 1.15),
        months: 12,
        bonus: 0,
      });
      RCS.App.render();
      return { driver: d.id, coach: e.id, car: RCS.ownedCars(s)[0].id };
    });
    await p
      .locator('#practice-form [name="driverId"]')
      .selectOption(ids.driver);
    await p.locator('#practice-form [name="coachId"]').selectOption(ids.coach);
    await p.locator('#practice-form [name="laps"]').selectOption("20");
    await p.locator('#practice-form [name="intensity"]').selectOption("hard");
    assert.match(await p.locator("#practice-risk").innerText(), /12 días/);
    const before = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('#practice-form [type="submit"]').click();
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), before);
    assert.match(
      await p.locator(".modal-content").innerText(),
      /12 días.*interrumpirlo antes.*informe parcial/s,
    );
    await p.locator("#confirm-action").click();
    await p.locator('[data-action="camp-day"]').click();
    await p.locator('[data-action="camp-day"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Practice.active(RCS.App.state).daysWorked),
      2,
    );
    const saved = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.reload();
    await p.evaluate(
      (raw) => RCS.App.setState(RCS.Storage.unpack(raw).state, 1),
      saved,
    );
    const state = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.waitForTimeout(700);
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      state,
      "Mirar la pista no consume jornadas",
    );
    for (let i = 2; i < 12; i++)
      await p.locator('[data-action="camp-day"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Programa completado.*Duración prevista: 12 días.*Duración real: 12 días/s,
    );
    await p.locator('.modal [data-action="close"]').click();
    assert.equal(
      await p.locator('#practice-form [name="driverId"]').inputValue(),
      ids.driver,
    );
    assert.match(
      await p.locator("#practice-risk").innerText(),
      /Neumáticos:.*20 %.*Cambia las gomas.*Motor:.*30 %/s,
    );
    assert.equal(
      await p.locator('#practice-form [type="submit"]').isDisabled(),
      true,
    );
    await p.screenshot({
      path: "test-results/feedback-retraining-desktop.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.screenshot({
      path: "test-results/feedback-retraining-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.evaluate(({ driver, coach }) => {
      const s = RCS.App.state;
      RCS.Professionals.care(s, driver).injuryUntil = s.day + 5;
      RCS.Professionals.profile(s, coach).restUntil = s.day + 3;
      RCS.App.render();
    }, ids);
    assert.match(
      await p.locator('#practice-form [name="driverId"]').innerText(),
      /lesionado hasta/,
    );
    assert.match(
      await p.locator("#practice-risk").innerText(),
      /lesionado.*5 días restantes.*descansando.*Neumáticos/s,
    );
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      const s = RCS.App.state;
      RCS.player(s).balance = 0;
      RCS.App.go("garage");
    });
    const noFunds = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('[data-action="repair"]').first().click();
    assert.match(
      await p.locator("#toast").innerText(),
      /No se pudo.*necesitas.*tienes.*te faltan/s,
    );
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      noFunds,
    );
    assert.equal(await p.locator("#toast").getAttribute("role"), "alert");
    await p.waitForTimeout(5000);
    assert.match(await p.locator("#toast").getAttribute("class"), /show/);
    await p.screenshot({
      path: "test-results/feedback-denial-desktop.png",
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.screenshot({
      path: "test-results/feedback-denial-mobile.png",
      fullPage: true,
    });
    await p.locator('[aria-label="Cerrar aviso"]').click();
    assert.doesNotMatch(
      await p.locator("#toast").getAttribute("class"),
      /show/,
    );
    await p.evaluate(() => {
      RCS.App.staffTab = "market";
      RCS.App.staffRole = "scout";
      RCS.App.go("staff");
    });
    const high = await p.evaluate(
      () => RCS.App.state.employees.filter((e) => e.role === "scout").at(-1).id,
    );
    await p
      .locator(`[data-employee="${high}"] [data-action="staff-profile"]`)
      .click();
    const blocked = p.locator('[data-action="staff-negotiate"]');
    assert.equal(await blocked.isDisabled(), true);
    const description = await blocked.getAttribute("aria-describedby");
    assert.match(
      await p.locator(`#${description}`).innerText(),
      /empresa es nivel 1.*exige nivel.*objetivos/s,
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.locator('.modal [data-action="close"]').click();
    // Changing an invalid lineup to a valid one must re-enable entry immediately.
    await p.evaluate(() => {
      const s = RCS.App.state,
        d = RCS.ownedDrivers(s)[0],
        c = RCS.ownedCars(s)[0];
      RCS.player(s).balance = 100000;
      RCS.Professionals.care(s, d.id).injuryUntil = 0;
      const event = s.season.events.find((e) => e.cup === "street" && !e.final);
      event.day = s.day + 3;
      RCS.App.go("competition");
      RCS.App.event(event.id);
    });
    assert.equal(
      await p.locator('#entry-form [type="submit"]').isDisabled(),
      true,
    );
    assert.match(
      await p.locator("#entry-technical").innerText(),
      /mantenimiento.*Neumáticos/s,
    );
    await p.evaluate(() => {
      const s = RCS.App.state,
        c = RCS.ownedCars(s)[0];
      for (const key of Object.keys(c.components)) c.components[key] = 100;
      RCS.Workshop.recalculate(s, c);
      document
        .querySelector('#entry-form [name="car"]')
        .dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await p.locator('#entry-form [type="submit"]').isDisabled(),
      false,
    );
    assert.match(
      await p.locator("#entry-technical").innerText(),
      /Alineación conforme/,
    );
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 0;
      document
        .querySelector('#entry-form [name="car"]')
        .dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await p.locator('#entry-form [type="submit"]').isDisabled(),
      true,
    );
    assert.match(
      await p.locator("#entry-tyre-quote").innerText(),
      /necesitas.*tienes.*te faltan/s,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Avisos: requisitos visibles, 12 días reales, recuperación, errores persistentes, móvil y desbloqueo de inscripción verificados.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
