/* Caja y habilidad Autónoma controladas para aislar la interfaz. El calendario,
   reservas, nóminas y carreras rivales usan el motor real. */
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
    const id = await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Aprender sin correr", "", 1470);
      G.player(s).balance = 100000;
      G.news(
        s,
        "Agenda",
        "NOTICIA ANTIGUA DE PRUEBA",
        "Solo pertenece a la primera jornada.",
      );
      G.App.setState(s, 2);
      G.App.go("team");
      return s.drivers
        .filter((d) => !d.companyId && G.Challenge.driverLevel(d) <= 1)
        .sort((a, b) => a.ask - b.ask)[0].id;
    });
    assert.ok(
      await p
        .locator(".driver-personality-note")
        .first()
        .innerText()
        .then((t) => t.includes("desconocido")),
    );
    await p.locator(`[data-action="negotiate"][data-id="${id}"]`).click();
    assert.equal(
      await p.locator(".agency-personality h3").innerText(),
      "Perfil desconocido",
    );
    const snapshot = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('#negotiate-form [name="salary"]').fill("10");
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state)),
      snapshot,
    );
    assert.match(
      await p.locator(".deal-verdict").innerText(),
      /sin él no conoces/,
    );
    await p.locator('[data-action="close"]').last().click();
    const profile = await p.evaluate((id) => {
      const G = RCS,
        s = G.App.state,
        scout = s.employees
          .filter((e) => e.role === "scout")
          .sort((a, b) => a.ask - b.ask)[0];
      const q = G.Staff.offer(s, scout.id, {
        salary: Math.ceil(scout.ask * 1.15),
        months: 12,
        bonus: 0,
      });
      if (!q.accepted) throw Error("Ojeador no contratado");
      G.App.render();
      return G.DriverAgency.persona(
        s,
        s.drivers.find((d) => d.id === id),
      ).name;
    }, id);
    await p.locator(`[data-action="negotiate"][data-id="${id}"]`).click();
    assert.equal(
      await p.locator(".agency-personality h3").innerText(),
      profile,
    );
    await p.locator('#negotiate-form [name="months"]').selectOption("12");
    await p.locator('#negotiate-form [type="submit"]').click();
    if (await p.locator("#negotiate-form").count())
      await p.locator('#negotiate-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).companyId,
        id,
      ),
      "player",
    );
    const coach = await p.evaluate((id) => {
      const G = RCS,
        s = G.App.state,
        e = s.employees
          .filter((e) => e.role === "trainer")
          .sort((a, b) => a.ask - b.ask)[0];
      if (
        !G.Staff.offer(s, e.id, {
          salary: Math.ceil(e.ask * 1.15),
          months: 12,
          bonus: 0,
        }).accepted
      )
        throw Error("Entrenador no contratado");
      s.driverWorld.talents[id] = ["autonomo"];
      G.App.go("team");
      return e.id;
    }, id);
    assert.equal(await p.locator(".ability-index article").count(), 108);
    assert.doesNotMatch(
      await p.locator(".ability-index").innerText(),
      /[0-9%]/,
    );
    assert.match(
      await p.locator(".ability-encyclopedia>summary").innerText(),
      /108/,
    );
    await p.locator(`[data-action="driver-detail"][data-id="${id}"]`).click();
    assert.match(
      await p.locator(".driver-abilities").innerText(),
      /Autónomo.*saca más partido/s,
    );
    await p.locator('[data-action="close"]').last().click();
    await p.evaluate(() => RCS.App.go("practice"));
    await p.locator('#practice-form [name="driverId"]').selectOption(id);
    await p.locator('#practice-form [name="coachId"]').selectOption(coach);
    await p.locator('#practice-form [name="laps"]').selectOption("10");
    await p.locator('#practice-form [name="intensity"]').selectOption("easy");
    assert.match(
      await p.locator(".learning-boost").innerText(),
      /\+\d+\.\d{2}\b/,
    );
    await p.locator('#practice-form [type="submit"]').click();
    await p.locator("#confirm-action").click();
    for (let i = 0; i < 7; i++)
      await p.locator('[data-action="camp-day"]').click();
    assert.equal(await p.evaluate(() => RCS.App.state.day), 7);
    assert.equal(await p.locator(".modal-content").count(), 0);
    assert.equal(await p.evaluate(() => RCS.App.view), "practice");
    assert.match(await p.locator(".alert").innerText(), /opcional.*avanzas/s);
    assert.match(
      await p.locator(".topbar .advance").innerText(),
      /Avanzar día/,
    );
    await p.screenshot({
      path: "test-results/driver-world-optional-race-1440.png",
      fullPage: true,
    });
    await p.locator('[data-action="camp-day"]').click();
    assert.equal(await p.evaluate(() => RCS.App.state.day), 8);
    assert.equal(
      await p.evaluate(() => RCS.App.state.season.events[0].status),
      "skipped",
    );
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).starts,
        id,
      ),
      0,
    );
    for (
      let i = 0;
      i < 12 && (await p.evaluate(() => !!RCS.Practice.active(RCS.App.state)));
      i++
    )
      await p.locator('[data-action="camp-day"]').click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Programa completado/,
    );
    assert.ok(await p.locator(".camp-stat-before").count());
    await p.locator('[data-action="close"]').last().click();
    await p.evaluate(() => RCS.App.go("finance"));
    assert.ok(await p.locator('[data-go="news"] .news-badge').count());
    await p.locator('.rail-button[data-go="news"]').click();
    assert.equal(await p.locator(".news-badge").count(), 0);
    assert.equal(
      await p.locator(".paper-article").count(),
      await p.evaluate(
        () =>
          RCS.App.state.news.filter((n) => n.day === RCS.App.state.day).length,
      ),
    );
    assert.ok(
      !(await p.locator(".paper").innerText()).includes(
        "NOTICIA ANTIGUA DE PRUEBA",
      ),
    );
    const raw = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.reload();
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 2);
      RCS.App.go("finance");
    }, raw);
    assert.equal(await p.locator(".news-badge").count(), 0);
    await p.evaluate(() => {
      RCS.news(
        RCS.App.state,
        "Agenda",
        "UNA NUEVA NOTICIA",
        "Publicada después de leer.",
      );
      RCS.App.render();
    });
    assert.equal(await p.locator(".news-badge").innerText(), "1");
    await p.locator('.rail-button[data-go="news"]').click();
    assert.equal(await p.locator(".news-badge").count(), 0);
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 1000 });
      for (const view of ["team", "practice", "companies", "news"]) {
        await p.evaluate((view) => RCS.App.go(view), view);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${view}: ${width}`,
        );
      }
      await p.screenshot({
        path: `test-results/driver-world-news-${width}.png`,
        fullPage: true,
      });
    }
    await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Neumático pinchado", "", 1470);
      G.player(s).balance = 100000;
      const d = s.drivers
        .filter((d) => !d.companyId)
        .sort((a, b) => a.ask - b.ask)[0];
      let q = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!q.accepted) G.Drivers.offer(s, d.id, q.salary, 12);
      s.driverWorld.talents[d.id] = ["motivador"];
      G.Calendar.advance(s, G.nextEvent(s).day);
      const e = G.nextEvent(s);
      G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
      G.Race.start(s, e.id);
      G.Race.tick(s, 600);
      const a = s.race.entrants.find((a) => a.companyId === "player");
      a.tires = 0;
      G.DriverWorld.puncture(s.race, a);
      G.Race.tick(s, 200);
      G.App.setState(s, 2);
      G.App.paused = true;
      G.App.render();
    });
    assert.match(
      await p.locator(".puncture-alert").innerText(),
      /18 km\/h.*boxes/,
    );
    assert.ok(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find((a) => a.companyId === "player")
            .speed <= 5.01,
      ),
    );
    await p
      .locator("#skills-reading")
      .screenshot({ path: "test-results/driver-world-puncture-390.png" });
    assert.deepEqual(errors, []);
    console.log(
      "Pilotos 0.16: negociación oculta/con ojeador, 108 habilidades, formación real durante carrera opcional, noticias de hoy y contador persistente, rivales, pinchazo y tres tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
