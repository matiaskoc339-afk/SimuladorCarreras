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
        viewport: { width: 1440, height: 1000 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:4173");
    const base = await p.evaluate(() => {
      const G = RCS,
        s = G.createLegacyGame("Aster Estrategia", "", 817),
        d = s.drivers.find((d) => !d.companyId),
        car = G.ownedCars(s)[0];
      G.Drivers.offer(s, d.id, d.ask, 12);
      G.App.setState(s, 1);
      G.App.go("competition");
      return {
        driver: d.id,
        car: car.id,
        road: car.tires,
        cash: G.player(s).balance,
      };
    });
    await p.locator('[data-action="event"]').first().click();
    await p.locator("#entry-compound").selectOption("soft");
    await p.locator('#entry-form [name="fuel"]').selectOption("1");
    await p
      .getByRole("button", {
        name: "Confirmar inscripción · $590",
        exact: true,
      })
      .click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      base.cash - 590,
    );
    const tyre = await p.evaluate(
      () => RCS.App.state.season.events[0].entry.tyreSetId,
    );
    assert.ok(tyre);
    await p.getByRole("button", { name: "Volver al calendario" }).click();
    await p.getByRole("button", { name: /Hasta la próxima prueba/ }).click();
    await p.getByRole("button", { name: /Ir a la parrilla/ }).click();
    await p.getByRole("button", { name: "Pausar", exact: true }).click();
    // Pronóstico controlado para comprobar una transición meteorológica con la misma física.
    await p.evaluate(() => {
      delete RCS.App.state.race.professionalVersion; // Ejercita la compatibilidad del modelo 0.5.
      const w = RCS.App.state.race.weather;
      w.rain = 0;
      w.wetness = 0;
      w.phase = "dry";
      w.plan = [
        { time: 0, rain: 0 },
        { time: 40, rain: 0.95 },
        { time: 230, rain: 0 },
      ];
    });
    await p.locator("#pit-strategy>summary").click();
    await p.locator("#pit-compound").selectOption("inter");
    await p.locator('#pit-form [name="fuel"]').selectOption("2");
    await p.locator('#pit-form [name="repair"]').check();
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator("#pit-request").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      cash - 240,
    );
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        a = s.race.entrants.find((a) => a.companyId === s.playerId);
      for (let i = 0; i < 18000 && a.pit.phase !== "box" && !a.dnf; i++)
        G.Race.tick(s, 1);
      G.Storage.validate(s);
    });
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player").pit
            .phase,
      ),
      "box",
    );
    const service = await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        a = s.race.entrants.find((a) => a.companyId === "player");
      return {
        cash: G.player(s).balance,
        remaining: a.pit.remaining,
        id: a.pit.setId,
      };
    });
    assert.equal(service.cash, cash - 240 - 205);
    await p.locator('[data-action="save"]').click();
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    await p.getByRole("button", { name: "Pausar", exact: true }).click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      service.cash,
    );
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player").pit
            .setId,
      ),
      service.id,
    );
    assert.ok(
      (await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player").pit
            .remaining,
      )) > 0,
    );
    await p.locator(`.timing-row[data-id="${base.car}"]`).click();
    await p.locator('[data-action="camera-zoom"][data-value="in"]').click();
    await p.locator('[data-action="camera-zoom"][data-value="in"]').click();
    if (!(await p.locator("#pit-strategy").getAttribute("open")))
      await p.locator("#pit-strategy>summary").click();
    await p.waitForTimeout(650);
    await p.screenshot({
      path: "test-results/race05-boxes.png",
      fullPage: true,
    });
    const before = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator("#instant-replay").click();
    await p.getByRole("heading", { name: /Repetición ·/ }).waitFor();
    await p.locator("#replay-play").click();
    await p.locator("#replay-driver").selectOption(base.car);
    await p.locator("#replay-speed").selectOption("0.5");
    await p.locator('[data-action="replay-camera"]').click();
    await p.locator("#replay-timeline").evaluate((el) => {
      el.value = String(Number(el.max) / 2);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await p.waitForTimeout(450);
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), before);
    await p.screenshot({
      path: "test-results/race05-replay.png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Volver al directo" }).click();
    assert.equal(await p.evaluate(() => RCS.App.paused), true);
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), before);
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        a = s.race.entrants.find((a) => a.companyId === "player");
      for (let i = 0; i < 18000 && a.pit.phase !== "none" && !a.dnf; i++)
        G.Race.tick(s, 1);
      G.Storage.validate(s);
    });
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .pitStops,
      ),
      1,
    );
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .compound,
      ),
      "inter",
    );
    await p.evaluate(() => RCS.Race.tick(RCS.App.state, 1800));
    await p.waitForTimeout(250);
    assert.ok(
      (await p.evaluate(() => RCS.App.state.race.weather.wetness)) > 0.05,
    );
    assert.ok(
      (await p.locator("#live-weather").innerText()).includes("Lluvia"),
    );
    await p.screenshot({
      path: "test-results/race05-rain.png",
      fullPage: true,
    });
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(350);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        "Carrera" + width,
      );
      assert.equal(await p.locator("#pit-request").isVisible(), true);
      await p.screenshot({
        path: `test-results/race05-live-${width}.png`,
        fullPage: true,
      });
    }
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state;
      while (!s.race.finished) G.Race.tick(s, 500);
    });
    await p.getByRole("heading", { name: "Bandera a cuadros." }).waitFor();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.cars.find((c) => c.id === id).tires,
        base.car,
      ),
      base.road,
    );
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.raceSupplies.sets.find((t) => t.id === id).status,
        tyre,
      ),
      "stored",
    );
    assert.ok(
      (await p.evaluate(
        () => RCS.App.state.raceSupplies.lastReplay.frames.length,
      )) <= 480,
    );
    await p.locator('.modal [data-action="replay-open"]').click();
    await p.locator("#replay-play").click();
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.waitForTimeout(300);
      assert.equal(
        await p
          .locator(".modal")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
        false,
        "Repetición" + width,
      );
      await p
        .locator(".modal")
        .screenshot({ path: `test-results/race05-replay-${width}.png` });
    }
    await p.getByRole("button", { name: "Volver a resultados" }).click();
    await p.locator('.modal [data-action="close"]').click();
    await p.evaluate(() => RCS.App.go("garage"));
    const amount = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p
      .locator(`[data-action="discard-race-tyre"][data-id="${tyre}"]`)
      .click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      amount,
    );
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.raceSupplies.sets.find((t) => t.id === id).status,
        tyre,
      ),
      "used",
    );
    await p.locator('[data-action="save"]').click();
    await p.reload();
    await p.locator('.load-card[data-slot="1"]').click();
    assert.ok(
      (await p.evaluate(
        () => RCS.App.state.raceSupplies.lastReplay.frames.length,
      )) > 0,
    );
    await p.evaluate(() => RCS.App.go("competition"));
    await p.locator('.page [data-action="replay-open"]').click();
    await p.getByRole("heading", { name: /Repetición ·/ }).waitFor();
    await p.locator('.modal [data-action="close"]').click();
    await p.evaluate(() => RCS.App.saves());
    await p
      .locator("#import-file")
      .setInputFiles("tests/fixtures/v4-race.json");
    await p.waitForFunction(() => RCS.App.state?.seed === 805);
    assert.equal(
      await p.evaluate(() => RCS.App.state.race.weekendVersion),
      undefined,
    );
    assert.equal(await p.evaluate(() => RCS.App.state.raceSupplies.version), 1);
    assert.deepEqual(errors, []);
    console.log(
      "Browser0.5 OK: inscripción con gomas/coste, boxes/servicio/cobro, guardar en boxes, clima, instantánea sin mutar/RNG, repetición final/persistencia, almacén,6 vistas1440/1024/390 e importación0.4.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
