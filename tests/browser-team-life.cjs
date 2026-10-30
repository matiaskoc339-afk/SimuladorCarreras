const { chromium, expect } = require("playwright"),
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
      const s = RCS.createGame("Entre jornadas", "", 1470);
      RCS.App.setState(s, 1);
      RCS.App.go("finance");
    });
    assert.equal(await p.locator(".support-card").count(), 3);
    const pay = await p.evaluate(
        () => RCS.TeamLife.offers(RCS.App.state)[0].pay,
      ),
      raw = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p
      .locator('.support-card [data-action="support-review"]')
      .first()
      .click();
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), raw);
    assert.match(
      await p.locator(".modal-content").innerText(),
      /solo al completar.*siete días/s,
    );
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    await p.locator('.topbar [data-action="advance"]').click();
    const packed = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.reload();
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.go("finance");
    }, packed);
    assert.match(await p.locator(".support-active").innerText(), /1\/2 días/);
    await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200 - 36 + pay,
    );
    assert.equal(await p.locator(".support-active").count(), 0);
    assert.match(
      await p.locator(".support-income").innerText(),
      /siete días.*entregar/s,
    );
    await p.screenshot({
      path: "test-results/support-income-desktop.png",
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
      path: "test-results/support-income-mobile.png",
      fullPage: true,
    });
    await p.evaluate(() => RCS.App.go("team"));
    await p.locator(".driver-stat-guide>summary").first().click();
    assert.equal(await p.locator(".driver-stat-guide dl dt").count(), 12);
    assert.match(
      await p.locator(".driver-stat-guide").innerText(),
      /Control.*curvas.*Equipo.*instrucciones/s,
    );
    await p.locator('.driver-card [data-stat="control"]').first().click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Control.*novato.*experto.*agarre/s,
    );
    await p.locator('.modal [data-action="close"]').click();
    await p.screenshot({
      path: "test-results/driver-stat-guide-mobile.png",
      fullPage: true,
    });
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
      RCS.App.go("practice");
      return { driver: d.id, coach: e.id };
    });
    await p
      .locator('#practice-form [name="driverId"]')
      .selectOption(ids.driver);
    await p.locator('#practice-form [name="coachId"]').selectOption(ids.coach);
    assert.match(
      await p.locator("#practice-risk").innerText(),
      /Mejora prevista/,
    );
    await p.locator('#practice-form [type="submit"]').click();
    await p.locator("#confirm-action").click();
    const days = await p.evaluate(
      () => RCS.Practice.active(RCS.App.state).days,
    );
    for (let i = 0; i < days; i++)
      await p.locator('[data-action="camp-day"]').click();
    assert.match(
      await p.locator(".camp-report").first().innerText(),
      /Programa completado/,
    );
    assert.ok(
      await p.evaluate(
        () => RCS.App.state.professional.practices.at(-1).gain > 0.1,
      ),
    );
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      // Controlled UI fixture: finance and radio attributes isolate interaction, not balance.
      const s = RCS.createGame("Muro en directo", "", 1470);
      RCS.player(s).balance = 100000;
      const d = s.drivers
        .filter((d) => !d.companyId)
        .sort((a, b) => a.ask - b.ask)[0];
      const agreement = RCS.Drivers.offer(s, d.id, d.ask, 12);
      if (!agreement.accepted) RCS.Drivers.offer(s, d.id, agreement.salary, 12);
      d.stats.teamwork = 90;
      d.stats.focus = 90;
      d.stats.discipline = 90;
      RCS.Calendar.advance(s, RCS.nextEvent(s).day);
      const e = RCS.nextEvent(s);
      RCS.Race.register(s, e.id, d.id, RCS.ownedCars(s)[0].id);
      RCS.Race.start(s, e.id);
      RCS.App.setState(s, 2);
      RCS.App.paused = true;
      RCS.App.render();
    });
    assert.equal(await p.locator("#race-command .command-order").count(), 5);
    assert.equal(await p.locator("#race-command #pit-strategy").count(), 1);
    assert.equal(await p.locator(".command-broadcast #race-canvas").count(), 1);
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Radio disponible",
    );
    await p.locator('.command-order[data-value="attack"]').click();
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Esperando respuesta",
    );
    assert.match(
      await p.locator("#reply-note").innerText(),
      /pausada.*reanúdala.*plan anterior/s,
    );
    assert.equal(
      await p
        .locator('.command-order[data-value="balanced"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await p
        .locator('.command-order[data-value="attack"]')
        .getAttribute("aria-pressed"),
      "false",
    );
    await p.screenshot({
      path: "test-results/command-pending-desktop.png",
      fullPage: true,
    });
    await p.locator('[data-action="speed"][data-value="4"]').click();
    await p.locator("#pause-button").click();
    await p.waitForFunction(
      () =>
        !RCS.App.state.race.entrants.find(
          (a) => a.companyId === RCS.App.state.playerId,
        ).radio.pending,
    );
    await p.locator("#pause-button").click();
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Orden confirmada",
    );
    assert.match(await p.locator("#command-current").innerText(), /Atacar/);
    await p.evaluate(() => {
      const s = RCS.App.state,
        a = s.race.entrants.find((a) => a.companyId === s.playerId);
      a.mode = "balanced";
      a.radio.readyAt = 0;
      RCS.Race.caution(s.race, a.progress, 15);
      RCS.UI.updateRace(s);
    });
    await p.locator('.command-order[data-value="attack"]').click();
    await p.locator("#pause-button").click();
    await p.waitForFunction(
      () =>
        !RCS.App.state.race.entrants.find(
          (a) => a.companyId === RCS.App.state.playerId,
        ).radio.pending,
    );
    await p.locator("#pause-button").click();
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Orden aplazada",
    );
    assert.match(
      await p.locator("#reply-text").innerText(),
      /amarilla.*verde/s,
    );
    await p.locator('.rail [data-action="save"]').click();
    await p.reload();
    await p.evaluate(() => {
      RCS.App.setState(RCS.Storage.load(2).state, 2);
      RCS.App.paused = true;
      RCS.App.render();
    });
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Orden aplazada",
    );
    await p.locator("#pit-strategy>summary").click();
    await p.locator('#pit-form [name="fuel"]').selectOption("1");
    await p.locator("#pit-request").click();
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find(
            (a) => a.companyId === RCS.App.state.playerId,
          ).pit.phase,
      ),
      "queued",
    );
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [390, 844],
    ]) {
      await p.setViewportSize({ width, height });
      await p.evaluate(() => RCS.App.render());
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Desbordamiento a ${width}`,
      );
      const geometry = await p.evaluate(() => {
        const canvas = document
            .getElementById("race-canvas")
            .getBoundingClientRect(),
          flag = document.getElementById("live-flag").getBoundingClientRect();
        return {
          height: canvas.height,
          inside: flag.top >= canvas.top && flag.bottom <= canvas.bottom,
        };
      });
      assert.ok(geometry.height >= 260);
      assert.equal(geometry.inside, true);
      await p.screenshot({
        path: `test-results/command-live-${width}.png`,
        fullPage: true,
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "Equipo 0.13: ingresos por entrega, límite semanal, CV explicados, formación reforzada y muro integrado con radio real/recarga/boxes en tres tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
