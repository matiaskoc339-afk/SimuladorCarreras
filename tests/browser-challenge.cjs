/* Ruta del juego ACTUAL: no usa createLegacyGame ni reglas históricas. */
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
    await p.evaluate(() => {
      const create = RCS.createV64Game;
      RCS.createGame = (name, logo) => create(name, logo, 1364);
    });
    await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
    assert.match(await p.locator(".modal-content").innerText(), /4,200/);
    await p.locator("#company-name").fill("Aster Desafío");
    const box = await p.locator("#logo-canvas").boundingBox();
    await p.mouse.move(box.x + 30, box.y + 30);
    await p.mouse.down();
    await p.mouse.move(box.x + 130, box.y + 100, { steps: 8 });
    await p.mouse.up();
    await p.getByRole("button", { name: /Fundar compañía/ }).click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    await p.evaluate(() => RCS.App.go("team"));
    await p.waitForTimeout(350);
    const names = await p.locator(".driver-identity h3").allTextContents();
    assert.equal(new Set(names).size, 12);
    await p.locator('[data-action="negotiate"]').first().click();
    assert.match(await p.locator("#deal-preview").innerText(), /cada día/);
    await p.locator(".deal-clauses summary").click();
    assert.equal(
      await p.locator('#negotiate-form [name="releaseMonths"]').count(),
      1,
    );
    await p.locator('#negotiate-form [name="salary"]').fill("10");
    assert.match(await p.locator(".deal-verdict").innerText(), /inferior/);
    await p
      .getByRole("button", { name: "Sueldo de referencia", exact: true })
      .click();
    await p.locator(".deal-clauses summary").click();
    await p.waitForTimeout(350);
    await p.screenshot({
      path: "test-results/challenge064-deal.png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Enviar oferta", exact: true }).click();
    assert.equal(
      await p.evaluate(
        () => RCS.ownedDrivers(RCS.App.state)[0].contract.period,
      ),
      "day",
    );
    const daily = await p.evaluate(
      () => RCS.ownedDrivers(RCS.App.state)[0].contract.salary,
    );
    await p.locator('.topbar [data-action="advance"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200 - 18 - daily,
    );
    await p.locator('.rail-nav [data-go="staff"]').click();
    await p
      .getByRole("button", { name: "Mercado laboral", exact: true })
      .click();
    await p.locator('[data-action="staff-profile"]').first().click();
    await p.locator('[data-action="staff-negotiate"]').click();
    assert.match(await p.locator("#deal-preview").innerText(), /cada día/);
    await p.locator('#staff-offer-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.Staff.owned(RCS.App.state)[0].contract.period),
      "day",
    );
    await p.evaluate(() => RCS.App.go("competition"));
    await p.locator('[data-action="event"]').first().click();
    assert.equal(await p.locator("#entry-compound option").count(), 17);
    await p.locator("#entry-compound").selectOption("fortis-hard");
    assert.match(
      await p.locator("#entry-tyre-quote").innerText(),
      /vueltas hasta el 22/,
    );
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    const charge = await p
      .locator('#entry-form button[type="submit"]')
      .innerText();
    await p.locator('#entry-form button[type="submit"]').click();
    assert.equal(
      cash - (await p.evaluate(() => RCS.player(RCS.App.state).balance)),
      Number(charge.match(/\$(\d+)/)[1]),
    );
    await p.getByRole("button", { name: "Volver al calendario" }).click();
    await p.getByRole("button", { name: /Hasta la próxima prueba/ }).click();
    await p.getByRole("button", { name: /Ir a la parrilla/ }).click();
    await p.waitForTimeout(600);
    const progress = await p.evaluate(
      () =>
        RCS.App.state.race.entrants.find((a) => a.companyId === "player")
          .progress,
    );
    await p.waitForTimeout(600);
    assert.ok(
      await p.evaluate(
        (p0) =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .progress > p0,
        progress,
      ),
    );
    await p.getByRole("button", { name: "Pausar", exact: true }).click();
    await p.evaluate(() => {
      RCS.Race.tick(RCS.App.state, 1200);
      RCS.App.render();
    });
    await p.waitForTimeout(350);
    assert.match(await p.locator("#racecraft-status").innerText(), /Fatiga/);
    await p.screenshot({
      path: "test-results/challenge064-race.png",
      fullPage: true,
    });
    const pack = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.paused = true;
      RCS.App.go("race");
    }, pack);
    assert.equal(await p.evaluate(() => RCS.App.state.race.dynamicsVersion), 1);
    // Pista y boxes avanzan con la física real. Se fuerza el fallo de servicio únicamente para comprobar su UI.
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        a = s.race.entrants.find((a) => a.companyId === s.playerId);
      a.professional.mechanic = null;
      G.RaceWeekend.requestPit(s, s.playerId, {
        compound: "nomada-hard",
        fuel: 0,
        repair: false,
        limiter: true,
      });
      for (let i = 0; i < 16000 && !a.pit.manual; i++) G.Race.tick(s, 1);
      if (!a.pit.manual) throw Error("No ha llegado al servicio manual");
      G.App.render();
    });
    assert.ok(await p.locator('[data-action="pit-manual"]').count());
    await p.waitForTimeout(350);
    await p.screenshot({
      path: "test-results/challenge064-pit.png",
      fullPage: true,
    });
    // Carrera y boxes a los tres tamaños, antes de terminar la prueba.
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 960 });
      await p.waitForTimeout(350);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.screenshot({
        path: `test-results/challenge064-race-${width}.png`,
        fullPage: true,
      });
      assert.equal(
        await p.locator(".telemetry-driver").evaluate((e) => {
          const a = e.getBoundingClientRect(),
            b = document.querySelector(".live-speed").getBoundingClientRect();
          return a.right > b.left + 1;
        }),
        false,
      );
    }
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        r = s.race,
        a = r.entrants.find((a) => a.companyId === s.playerId);
      const act = (action, w) => {
        while (r.time + 0.0001 < a.pit.manual.readyAt) G.Race.tick(s, 1);
        G.PitCrew.action(s, action, w);
      };
      act("lift");
      for (let w = 0; w < 4; w++) {
        act("select", w);
        for (let n = 0; n < 4; n++) act("loosen");
        act("remove");
        act("fit");
        for (let n = 0; n < 4; n++) act("tighten");
      }
      act("lower");
      act("check");
      while (!r.finished) G.Race.tick(s, 400);
      G.Race.finish(s);
      G.App.go("competition");
    });
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 960 });
      for (const view of ["team", "market", "workshop", "finance"]) {
        await p.evaluate((view) => RCS.App.go(view), view);
        await p.waitForTimeout(350);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${view} a ${width}px`,
        );
        assert.equal(await p.evaluate(() => RCS.App.view), view);
        if (width === 390)
          await p.screenshot({
            path: `test-results/challenge064-${view}-mobile.png`,
            fullPage: true,
          });
      }
    }
    await p.evaluate(() => RCS.App.go("team"));
    await p.locator('[data-action="negotiate"]').first().click();
    await p.waitForTimeout(350);
    assert.equal(
      await p
        .locator(".modal-content")
        .evaluate((e) => e.scrollWidth > e.clientWidth + 1),
      false,
    );
    await p.screenshot({
      path: "test-results/challenge064-deal-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "0.6.4: inicio actual, contratación diaria, presupuesto, neumáticos, carrera, boxes, guardado y 3 tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
