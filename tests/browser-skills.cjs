/* Interfaz 0.15. La caja y el nivel del piloto se controlan para aislar la UI;
   las reservas, jornadas, nóminas y carreras se ejecutan con las reglas reales. */
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
      const G = RCS,
        s = G.createGame("Escuela de combate", "", 1470);
      G.player(s).balance = 100000;
      s.season.events.forEach((e) => (e.day += 365));
      const d = s.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => a.ask - b.ask)[0],
        coach = s.employees
          .filter((e) => e.role === "trainer")
          .sort((a, b) => a.ask - b.ask)[0];
      let q = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!q.accepted) q = G.Drivers.offer(s, d.id, q.salary, 12);
      if (
        !q.accepted ||
        !G.Staff.offer(s, coach.id, {
          salary: Math.ceil(coach.ask * 1.15),
          months: 12,
          bonus: 0,
        }).accepted
      )
        throw Error("No se pudo contratar al equipo del escenario");
      G.App.setState(s, 2);
      G.App.go("practice");
    });
    assert.deepEqual(
      await p
        .locator('#practice-form [name="focus"] option')
        .evaluateAll((els) => els.map((e) => e.value)),
      ["control", "pace", "brakes", "consistency", "overtake", "defense"],
    );
    for (const focus of ["overtake", "defense"]) {
      const ids = await p.evaluate(() => ({
        driver: RCS.ownedDrivers(RCS.App.state)[0].id,
        coach: RCS.Staff.owned(RCS.App.state).find((e) => e.role === "trainer")
          .id,
      }));
      await p
        .locator('#practice-form [name="driverId"]')
        .selectOption(ids.driver);
      await p
        .locator('#practice-form [name="coachId"]')
        .selectOption(ids.coach);
      await p.locator('#practice-form [name="intensity"]').selectOption("easy");
      const before = await p.evaluate(() => JSON.stringify(RCS.App.state));
      await p.locator('#practice-form [name="focus"]').selectOption(focus);
      assert.equal(
        await p.evaluate(() => JSON.stringify(RCS.App.state)),
        before,
      );
      assert.match(
        await p.locator(".skills-training-note").innerText(),
        focus === "overtake"
          ? /rebufo.*Frenada/s
          : /línea defensiva.*Concentración/s,
      );
      await p.locator('#practice-form [type="submit"]').click();
      assert.match(
        await p.locator(".modal-content").innerText(),
        /distribuidas en.*días/s,
      );
      await p.locator("#confirm-action").click();
      const unchanged = await p.evaluate(() => JSON.stringify(RCS.App.state));
      await p.waitForTimeout(200);
      assert.equal(
        await p.evaluate(() => JSON.stringify(RCS.App.state)),
        unchanged,
      );
      await p.locator('[data-action="camp-day"]').click();
      const raw = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
      await p.reload();
      await p.evaluate((raw) => {
        RCS.App.setState(RCS.Storage.unpack(raw).state, 2);
        RCS.App.go("practice");
      }, raw);
      assert.equal(
        await p.evaluate(() => RCS.Practice.active(RCS.App.state).daysWorked),
        1,
      );
      for (
        let i = 0;
        i < 25 &&
        (await p.evaluate(() => !!RCS.Practice.active(RCS.App.state)));
        i++
      )
        await p.locator('[data-action="camp-day"]').click();
      assert.match(
        await p.locator(".modal-content").innerText(),
        /Programa completado.*Qué mejoró/s,
      );
      const report = await p.locator(".modal-content").innerText();
      for (const attribute of focus === "overtake"
        ? ["Adelantamiento", "Frenada"]
        : ["Defensa", "Concentración"])
        assert.ok(
          report.includes(attribute),
          `El informe debe mostrar ${attribute}`,
        );
      await p.locator('[data-action="close"]').last().click();
      assert.equal(
        await p.evaluate(
          (focus) =>
            RCS.App.state.professional.practices.at(-1).report.changes[focus] >
            0,
          focus,
        ),
        true,
      );
    }
    await p.screenshot({
      path: "test-results/skills-campus-report-1440.png",
      fullPage: true,
    });
    await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Lectura de carrera", "", 1470);
      G.player(s).balance = 100000;
      const d = s.drivers
        .filter((d) => !d.companyId)
        .sort((a, b) => a.ask - b.ask)[0];
      let q = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!q.accepted) G.Drivers.offer(s, d.id, q.salary, 12);
      d.stats.control = 65;
      d.stats.focus = d.stats.discipline = d.stats.teamwork = 100;
      G.Calendar.advance(s, G.nextEvent(s).day);
      const e = G.nextEvent(s);
      G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
      G.Race.start(s, e.id);
      G.Race.tick(s, 600);
      G.App.setState(s, 2);
      G.App.paused = true;
      G.App.render();
    });
    assert.equal(await p.locator("#skills-reading").count(), 1);
    assert.match(
      await p.locator("#skills-corner-data").innerText(),
      /Control.*65.0\/100.*Margen elegido.*Capacidad de paso/s,
    );
    await p.locator(".skills-details>summary").click();
    assert.equal(await p.locator("#skills-reading .skills-loss").count(), 4);
    assert.match(
      await p.locator(".skills-explanation").innerText(),
      /mismo coche sano.*No es la diferencia con el líder/s,
    );
    assert.equal(await p.locator("#skills-speed-graph path").count(), 3);
    const state = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('[data-action="skills-line"]').click();
    assert.equal(
      await p
        .locator('[data-action="skills-line"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    await p.evaluate(() => RCS.App.render());
    assert.equal(
      await p
        .locator('[data-action="skills-line"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      state,
      "Consultar datos y dibujar la trazada no altera la simulación",
    );
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [390, 844],
    ]) {
      await p.setViewportSize({ width, height });
      await p.locator(".skills-details>summary").click();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await p.screenshot({
        path: `test-results/skills-live-${width}.png`,
        fullPage: true,
      });
      await p.locator('[data-action="race-theatre"]').click();
      await p.locator(".radio-toggle").click();
      assert.equal(
        await p.locator(".radio-floating #skills-reading").count(),
        1,
      );
      assert.equal(await p.locator("#skills-reading").count(), 1);
      if (width === 390) {
        const box = await p.locator(".radio-floating").boundingBox();
        assert.ok(
          box.x >= 0 &&
            box.x + box.width <= width &&
            box.y >= 0 &&
            box.y + box.height <= height,
        );
      }
      await p.screenshot({ path: `test-results/skills-radio-${width}.png` });
      await p.keyboard.press("Escape");
      await p.keyboard.press("Escape");
      // Render recreates the details closed while preserving the camera preference.
      await p.evaluate(() => RCS.App.render());
    }
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        r = s.race;
      G.Race.order(s, { ...G.RaceDirector.presets.save, duration: 0 });
      for (let n = 0; n < 80 && !r.finished; n++) G.Race.tick(s, 500);
      if (!r.finished) throw Error("La carrera de UI no terminó");
      const id = r.eventId;
      G.Race.finish(s);
      G.Storage.validate(s);
      G.App.go("competition");
      G.App.results(id);
    });
    assert.equal(await p.locator(".skills-race-report").count(), 1);
    assert.equal(
      await p.locator(".skills-race-report .skills-loss").count(),
      4,
    );
    assert.match(
      await p.locator(".skills-race-report").innerText(),
      /Frenadas tardías.*Bloqueos.*Pérdidas de tracción.*Defensas preparadas/s,
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.locator(".skills-race-report").scrollIntoViewIfNeeded();
    await p.locator(".skills-race-report").screenshot({
      path: "test-results/skills-report-detail-390.png",
    });
    await p.screenshot({
      path: "test-results/skills-result-390.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Conducción 0.15: dos programas completos por días, guardado, causas de pérdida, gráfica, trazada sin mutaciones, radio en tres tamaños e informe de carrera real: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
