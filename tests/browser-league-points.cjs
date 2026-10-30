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
      const s = RCS.createGame("Tres ligas", "", 1470);
      for (const [cup, value] of [
        ["street", 11],
        ["pro", 7],
        ["national", 4],
      ])
        Object.assign(s.season.cups[cup].standings.player, {
          points: value,
          qualifying: value,
        });
      s.season.standings.player.points = 22;
      s.competitions.streetPoints.player = 11;
      s.competitions.proPoints.player = 7;
      RCS.App.setState(s, 1);
      RCS.App.go("hq");
    });
    for (const [cup, value] of [
      ["street", 11],
      ["pro", 7],
      ["national", 4],
    ])
      assert.equal(
        await p.locator(`[data-hq-league="${cup}"] strong`).innerText(),
        String(value),
      );
    assert.doesNotMatch(
      await p.locator(".hero-company-stats").innerText(),
      /Puntos esta temporada|Posición en la Copa/,
    );
    await p.screenshot({
      path: "test-results/league-points-hq.png",
      fullPage: true,
    });
    await p.evaluate(() => RCS.App.go("competition"));
    assert.equal(await p.locator("[data-league-points]").count(), 3);
    for (const [cup, value] of [
      ["street", 11],
      ["pro", 7],
      ["national", 4],
    ])
      assert.equal(
        await p
          .locator(`[data-league-points="${cup}"] [data-season-points]`)
          .innerText(),
        String(value),
      );
    assert.match(
      await p.locator(".league-license-panel").innerText(),
      /regional y nacional.*24 puntos callejeros.*11 \/ 24.*faltan 13/s,
    );
    assert.equal(
      await p.locator('[data-action="competition-license"]').isDisabled(),
      true,
    );
    const raw = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('[data-action="competition-tab"][data-tab="pro"]').click();
    assert.match(
      await p.locator(".league-layout").innerText(),
      /Copa Regional.*licencia profesional/s,
    );
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), raw);
    await p.evaluate(() => {
      RCS.App.state.competitions.streetPoints.player = 24;
      RCS.App.render();
    });
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance),
      boards = await p.evaluate(() =>
        JSON.stringify(RCS.App.state.season.cups),
      );
    await p.locator('[data-action="competition-license"]').click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      cash - 900,
    );
    assert.equal(
      await p.evaluate(() => JSON.stringify(RCS.App.state.season.cups)),
      boards,
    );
    assert.match(
      await p.locator(".league-license-panel").innerText(),
      /Licencia profesional obtenida.*12 puntos regionales acumulados.*tienes 7/s,
    );
    assert.equal(
      await p.locator('[data-action="competition-license"]').count(),
      0,
    );
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [390, 844],
    ]) {
      await p.setViewportSize({ width, height });
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await p.screenshot({
        path: `test-results/league-points-${width}.png`,
        fullPage: true,
      });
    }
    await p.locator('[data-action="league-open"][data-cup="national"]').click();
    assert.match(
      await p.locator(".league-layout").innerText(),
      /12 puntos.*regional/,
    );
    // Controlled archived example: a former combined driver total must never become a league score.
    await p.evaluate(() => {
      const s = RCS.App.state,
        h = {
          year: 2025,
          name: "Archivo de tres ligas",
          drivers: [{ name: "Piloto común", points: 22, starts: 3, wins: 0 }],
          events: [
            ["street", 11],
            ["pro", 7],
            ["national", 4],
          ].map(([cup, points], i) => ({
            cup,
            id: "archive-" + i,
            round: 1,
            day: 0,
            trackName: "Circuito " + i,
            results: [
              {
                driverId: "same-driver",
                name: "Piloto común",
                companyId: s.playerId,
                team: "Tres ligas",
                position: 1,
                dnf: false,
                time: 100,
                points,
                carLabel: "Turismo",
              },
            ],
          })),
        };
      s.expansion.archive.push(h);
      RCS.FacilitiesUI.action(RCS.App, "archive-season", { year: "2025" });
    });
    for (const [cup, value] of [
      ["street", 11],
      ["pro", 7],
      ["national", 4],
    ]) {
      const text = await p.locator(`[data-driver-league="${cup}"]`).innerText();
      assert.match(text, new RegExp(String(value)));
      assert.doesNotMatch(text, /22/);
    }
    const fixture = fs.readFileSync("tests/fixtures/v110-race.json", "utf8");
    await p.evaluate((raw) => {
      const s = RCS.Storage.unpack(raw).state,
        r = s.race,
        id = r.eventId;
      while (!r.finished) RCS.Race.tick(s, 500);
      RCS.Race.finish(s);
      RCS.App.setState(s, 2);
      RCS.App.results(id);
    }, fixture);
    assert.equal(await p.locator("[data-result-league]").count(), 3);
    assert.match(
      await p.locator(".result-league-points").innerText(),
      /suma exclusivamente.*independientes/s,
    );
    assert.equal(
      await p.locator('[data-result-league="pro"] strong').innerText(),
      "0",
    );
    assert.equal(
      await p.locator('[data-result-league="national"] strong').innerText(),
      "0",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Ligas 0.13.1: sede y marcadores separados, licencia callejera con cobro único, requisitos profesionales, resultados y archivo por liga en tres tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
