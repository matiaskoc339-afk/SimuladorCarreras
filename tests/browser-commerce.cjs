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
      const s = RCS.createGame("Nuevas series", "", 1470);
      RCS.App.setState(s, 1);
      RCS.App.persist();
    });
    const snapshot = () => p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('.rail [data-go="workshop"]').click();
    assert.match(await p.locator(".weekly-banner").innerText(), /64 novedades/);
    await p.locator('[data-action="wb-tab"][data-tab="catalog"]').click();
    assert.equal(await p.locator(".wb-catalog-grid .wb-part-card").count(), 285);
    assert.equal(await p.locator(".weekly-mark").count(), 64);
    await p.locator("#wb-catalog-slot").selectOption("shell");
    assert.equal(await p.locator(".wb-part-card:visible").count(), 19);
    const before = await snapshot();
    await p
      .locator('.wb-part-card:visible [data-action="wb-preview"]')
      .first()
      .click();
    assert.equal(await snapshot(), before);
    await p.screenshot({
      path: "test-results/weekly-catalog-desktop.png",
      fullPage: true,
    });
    const old = await p.evaluate(() =>
      RCS.Commerce.candidates(RCS.App.state).map((d) => d.id),
    );
    await p.evaluate(() => {
      RCS.Calendar.advance(RCS.App.state, 7);
      RCS.App.persist();
      RCS.App.go("team");
    });
    const current = await p.evaluate(() =>
      RCS.Commerce.candidates(RCS.App.state).map((d) => d.id),
    );
    assert.equal(current.length, 12);
    assert.ok(current.every((id) => !old.includes(id)));
    assert.match(await p.locator(".cv-banner").innerText(), /SEMANA 2/);
    await p.screenshot({
      path: "test-results/weekly-cvs-desktop.png",
      fullPage: true,
    });
    await p.locator('.rail [data-go="market"]').click();
    await p
      .getByRole("button", {
        name: "Autos nuevos · concesionario",
        exact: true,
      })
      .click();
    assert.equal(await p.locator(".market-card").count(), 72);
    assert.equal(
      await p.locator('.market-card [data-action="buy-car"]:disabled').count(),
      72,
    );
    assert.match(await p.locator("main").innerText(), /Gama nueva disponible/);
    await p.screenshot({
      path: "test-results/showroom-desktop.png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Autos usados", exact: true }).click();
    assert.ok((await p.locator(".market-card").count()) > 30);
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 100000;
      RCS.App.render();
    });
    await p
      .getByRole("button", {
        name: "Autos nuevos · concesionario",
        exact: true,
      })
      .click();
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator('.market-card [data-action="buy-car"]').first().click();
    assert.match(await p.locator(".modal").innerText(), /0 km/);
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.ownedCars(RCS.App.state).length),
      2,
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      cash - 28000,
    );
    await p.locator('.rail [data-go="trophies"]').click();
    assert.equal(await p.locator(".trophy-empty").count(), 1);
    assert.match(await p.locator("main").innerText(), /Una carrera da puntos/);
    await p.evaluate(() => {
      const G = RCS,
        s = G.App.state,
        e = s.season.events.find((e) => e.cup === "pro" && e.final),
        d = G.Commerce.candidates(s).sort((a, b) => a.ask - b.ask)[0];
      const agreement = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!agreement.accepted) G.Drivers.offer(s, d.id, agreement.salary, 12);
      s.day = e.day;
      G.Auctions.daily(s);
      G.Commerce.refresh(s);
      e.status = "completed";
      s.season.cups.pro.standings.player.qualifying = 18;
      s.season.cups.pro.standings.player.points = 33;
      Object.assign(s.season.standings.player, {
        points: 15,
        starts: 1,
        wins: 1,
        podiums: 1,
      });
      e.results = [
        {
          companyId: s.playerId,
          driverId: d.id,
          carId: G.ownedCars(s)[0].id,
          name: d.name,
          team: G.player(s).name,
          position: 1,
          dnf: false,
          points: 15,
          prize: 12400,
          time: 1000,
          bestLap: 100,
        },
      ];
      G.Trophies.award(s, e);
      G.App.persist();
      G.App.render();
      G.Storage.validate(s);
    });
    assert.equal(await p.locator(".trophy-card").count(), 1);
    assert.match(await p.locator(".trophy-card").innerText(), /Campeón · Oro/);
    assert.match(
      await p.locator(".trophy-engraving").innerText(),
      /Reputación \+6/,
    );
    const trophyBefore = await snapshot();
    await p.locator('.rail [data-go="competition"]').click();
    await p.locator('.rail [data-go="trophies"]').click();
    assert.equal(await snapshot(), trophyBefore);
    await p.screenshot({
      path: "test-results/trophy-room-desktop.png",
      fullPage: true,
    });
    await p.evaluate(() =>
      RCS.App.results(
        RCS.App.state.season.events.find((e) => e.cup === "pro" && e.final).id,
      ),
    );
    assert.equal(await p.locator(".trophy-result").count(), 1);
    await p.locator('.trophy-result [data-go="trophies"]').click();
    await p.reload();
    await p.locator('[data-action="load"]').first().click();
    await p.locator('.rail [data-go="trophies"]').click();
    assert.equal(await p.locator(".trophy-card").count(), 1);
    const stable = await snapshot();
    for (const width of [1024, 390]) {
      await p.setViewportSize({ width, height: 900 });
      for (const view of ["trophies", "market", "team", "workshop"]) {
        await p.evaluate((v) => RCS.App.go(v), view);
        if (view === "market")
          await p
            .getByRole("button", {
              name: "Autos nuevos · concesionario",
              exact: true,
            })
            .click();
        if (view === "workshop")
          await p.locator('[data-action="wb-tab"][data-tab="catalog"]').click();
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${view} desborda a ${width}`,
        );
        assert.equal(await snapshot(), stable);
        await p.screenshot({
          path: `test-results/commerce-${view}-${width}.png`,
          fullPage: true,
        });
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "Suministro 0.11 OK: catálogo y comparación, CV semanales, concesionario usado/nuevo, compra, vitrina/resultados, recarga y tres tamaños sin desbordamiento.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
