/* Producción 0.7. Las vistas profesionales controladas no prueban la economía;
   scripts/check-balance.cjs recorre una temporada sin ayudas. */
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
      RCS.Data.models.length = 40;
      RCS.Data.tracks.length = 22;
      const create = RCS.createV70Game;
      RCS.createGame = (name, logo) => create(name, logo, 1470);
    });
    await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
    assert.match(await p.locator(".modal-content").innerText(), /callejeras/);
    await p.locator("#company-name").fill("Escudería del Puerto");
    const box = await p.locator("#logo-canvas").boundingBox();
    await p.mouse.move(box.x + 20, box.y + 20);
    await p.mouse.down();
    await p.mouse.move(box.x + 100, box.y + 100, { steps: 8 });
    await p.mouse.up();
    await p.getByRole("button", { name: /Fundar compañía/ }).click();
    await p.locator('[data-action="tutorial-skip"]').click();
    await p.evaluate(() => RCS.App.go("team"));
    const id = await p.evaluate(
      () =>
        RCS.App.state.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => b.ask - a.ask)[0].id,
    );
    await p.locator(`[data-action="negotiate"][data-id="${id}"]`).click();
    await p.locator('#negotiate-form [name="months"]').selectOption("12");
    await p.getByRole("button", { name: "Enviar oferta", exact: true }).click();
    await p.evaluate(() => RCS.App.go("competition"));
    assert.equal(await p.locator(".league-event").count(), 9);
    await p.locator('[data-tab="pro"]').click();
    assert.equal(await p.locator(".league-event").count(), 6);
    await p.locator('[data-action="event"]').first().click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /licencia profesional/,
    );
    assert.equal(await p.locator("#entry-form").count(), 0);
    await p.locator('[data-action="close"]').last().click();
    await p.locator('[data-tab="national"]').click();
    assert.equal(await p.locator(".league-event").count(), 5);
    assert.match(await p.locator(".league-layout").innerText(), /7[,.]?200/);
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 960 });
      for (const tab of ["street", "pro", "national", "tracks"]) {
        await p.locator(`[data-tab="${tab}"]`).click();
        await p.waitForTimeout(100);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${tab} ${width}`,
        );
        if (tab === "tracks")
          assert.equal(await p.locator(".circuit-card").count(), 16);
        if (width !== 1024)
          await p.screenshot({
            path: `test-results/leagues070-${tab}-${width}.png`,
            fullPage: true,
          });
      }
    }
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.locator('[data-tab="street"]').click();
    await p.locator('[data-action="event"]').first().click();
    assert.equal(await p.locator("#entry-compound option").count(), 17);
    assert.match(
      await p.locator("#entry-tyre-quote").innerText(),
      /Total hoy: .*220/,
    );
    await p.locator('#entry-form [type="submit"]').click();
    await p.getByRole("button", { name: "Volver al calendario" }).click();
    await p.getByRole("button", { name: /Hasta la próxima prueba/ }).click();
    if (await p.evaluate(() => !!RCS.App.state.driverWorld))
      await p.locator('[data-action="event"]').first().click();
    await p.getByRole("button", { name: /Ir a la parrilla/ }).click();
    await p.waitForTimeout(600);
    const dist = await p.evaluate(
      () =>
        RCS.App.state.race.entrants.find((a) => a.companyId === "player")
          .progress,
    );
    await p.waitForTimeout(600);
    assert.ok(
      await p.evaluate(
        (d) =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .progress > d,
        dist,
      ),
    );
    await p.getByRole("button", { name: "Pausar", exact: true }).click();
    await p.evaluate(() => {
      RCS.Race.tick(RCS.App.state, 800);
      RCS.App.render();
    });
    await p.waitForTimeout(150);
    await p.locator(".command-car-details > summary").click();
    assert.match(
      await p.locator("#live-car-parts").innerText(),
      /Motor configurado/,
    );
    const saved = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 1);
      RCS.App.paused = true;
      RCS.App.go("race");
    }, saved);
    assert.equal(await p.evaluate(() => RCS.App.state.race.cup), "street");
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 960 });
      await p.waitForTimeout(180);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      assert.ok(
        await p.evaluate(() => {
          const c = document.getElementById("race-canvas"),
            v = c.getContext("2d").getImageData(30, 30, 1, 1).data;
          return c.height < 1300 && v[3] === 255 && v[0] < 240;
        }),
      );
      await p.screenshot({
        path: `test-results/leagues070-street-race-${width}.png`,
      });
    }
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        r = s.race;
      for (const a of r.entrants)
        G.RaceWeekend.requestPit(s, a.companyId, {
          compound: "fortis-hard",
          fuel: 0,
          repair: false,
          limiter: true,
        });
      const a = r.entrants.find((a) => a.companyId === "player");
      for (let i = 0; i < 16000 && !a.pit.manual; i++) G.Race.tick(s, 1);
      if (!a.pit.manual) throw Error("No llegó a su puesto");
      G.Storage.validate(s);
      G.App.render();
    });
    assert.ok(await p.locator('[data-action="pit-manual"]').count());
    await p.screenshot({
      path: "test-results/leagues070-pit-mobile.png",
      fullPage: true,
    });
    await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Parrilla regional", "", 1471),
        d = s.drivers
          .filter((d) => !d.companyId)
          .sort((a, b) => b.ask - a.ask)[0],
        car = G.ownedCars(s)[0],
        e = s.season.events.find((e) => e.cup === "pro");
      G.player(s).balance = 20000;
      G.Drivers.offer(s, d.id, d.ask, 12);
      for (const k of G.Drivers.stats) d.stats[k] = 30;
      for (const k of Object.keys(car.components)) car.components[k] = 95;
      G.Workshop.recalculate(s, car);
      s.competitions.licenses.player = true;
      s.day = e.day;
      G.Race.register(s, e.id, d.id, car.id, { compound: "fortis-hard" });
      G.Race.start(s, e.id);
      G.Race.tick(s, 500);
      G.App.setState(s, 1);
      G.App.paused = true;
      G.App.go("race");
    });
    assert.match(
      await p.locator(".race-regulation").innerText(),
      /colisiones evitables se sancionan/,
    );
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 960 });
      await p.waitForTimeout(180);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await p.screenshot({
        path: `test-results/leagues070-professional-${width}.png`,
      });
    }
    await p.evaluate(() => {
      for (const i of RCS.Circuits.indices()) {
        const v = RCS.ModernScene.build(i);
        if (v.canvas.width < 500 || v.canvas.height < 500)
          throw Error("Escena vacía " + i);
      }
    });
    const migration = fs.readFileSync(
      "tests/fixtures/v64-finished.json",
      "utf8",
    );
    await p.evaluate((raw) => {
      const G = RCS,
        s = G.Storage.validate(JSON.parse(raw));
      for (const e of s.season.events)
        if (e.status === "scheduled") {
          e.status = "skipped";
          e.results = [];
        }
      s.day = Math.max(...s.season.events.map((e) => e.day));
      s.season.phase = "complete";
      G.Facilities.archiveSeason(s);
      G.App.setState(s, 1);
      G.App.go("competition");
    }, migration);
    await p.locator('[data-action="competition-upgrade"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.season.events.length),
      20,
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Galería para comparar siluetas de los 40 modelos con el mismo color.
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      document.body.innerHTML =
        '<main style="padding:25px;background:#c4cbb8;display:grid;grid-template-columns:repeat(8,1fr);gap:16px">' +
        RCS.Data.models
          .map(
            (m, i) =>
              '<article style="background:#dbe1d1;padding:12px;text-align:center;color:#203b43;font:12px Arial"><div style="height:230px">' +
              RCS.Render.carSVG(
                { ...m, modelIndex: i, id: "gallery-" + i, color: "#ad604d" },
                String(i + 1),
              ) +
              "</div><b>" +
              m.brand +
              " " +
              m.model +
              "</b></article>",
          )
          .join("") +
        "</main>";
      document.querySelectorAll("svg").forEach((e) => {
        e.style.height = "100%";
        e.style.width = "100%";
      });
    });
    await p.screenshot({
      path: "test-results/leagues070-car-designs.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "0.7: tres ligas, 16 pistas, 40 diseños, UI real, carrera, boxes, guardado y 3 tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
