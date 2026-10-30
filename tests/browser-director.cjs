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
      const s = RCS.createGame("Conversaciones reales", "", 1470);
      RCS.App.setState(s, 1);
      RCS.App.go("team");
      return s.drivers
        .filter((d) => !d.companyId && RCS.Challenge.driverLevel(d) <= 1)
        .sort((a, b) => a.ask - b.ask)[0].id;
    });
    await p.locator(`[data-action="negotiate"][data-id="${id}"]`).click();
    assert.equal(await p.locator(".agency-personality").count(), 1);
    assert.match(
      await p.locator(".agency-personality").innerText(),
      /forma de negociar/i,
    );
    await p.locator('#negotiate-form [name="months"]').selectOption("3");
    await p.locator('#negotiate-form [name="salary"]').fill("10");
    assert.match(
      await p.locator(".deal-verdict").innerText(),
      /bajo.*expectativas/s,
    );
    const raw = await p.evaluate(() => JSON.stringify(RCS.App.state));
    await p.locator('#negotiate-form [name="salary"]').fill("11");
    assert.equal(await p.evaluate(() => JSON.stringify(RCS.App.state)), raw);
    await p.locator('#negotiate-form [type="submit"]').click();
    assert.equal(
      await p.locator(".agency-conversation .agency-driver").count(),
      1,
    );
    const bid = await p.locator('#negotiate-form [name="salary"]').inputValue();
    assert.ok(Number(bid) > 11);
    await p.screenshot({
      path: "test-results/agency-counter-1440.png",
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
      path: "test-results/agency-counter-390.png",
      fullPage: true,
    });
    await p.locator('#negotiate-form [type="submit"]').click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.App.state.drivers.find((d) => d.id === id).contract.salary,
        id,
      ),
      Number(bid),
    );
    await p.evaluate((id) => {
      // Controlled progression isolates the review UI; it is not a balance or race result fixture.
      const s = RCS.App.state,
        d = s.drivers.find((d) => d.id === id);
      s.season.events.forEach((e) => (e.day += 365));
      RCS.Calendar.advance(s, 42);
      for (const key of ["pace", "control", "brakes", "consistency"])
        d.stats[key] += 10;
      RCS.DriverAgency.review(s, d);
      RCS.App.go("team");
    }, id);
    assert.equal(await p.locator(".driver-requests article").count(), 1);
    await p.locator('.driver-requests [data-action="driver-raise"]').click();
    const requested = Number(
      await p.locator('#driver-raise-form [name="salary"]').inputValue(),
    );
    await p
      .locator('#driver-raise-form [name="salary"]')
      .fill(String(Number(bid) + 1));
    await p.locator('#driver-raise-form [type="submit"]').click();
    assert.match(
      await p.locator(".agency-response").innerText(),
      /Contraoferta/,
    );
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 100000;
    });
    await p
      .locator('#driver-raise-form [name="salary"]')
      .fill(String(requested));
    await p.locator('#driver-raise-form [type="submit"]').click();
    assert.equal(await p.locator(".driver-requests").count(), 0);
    await p.locator(`[data-action="driver-detail"][data-id="${id}"]`).click();
    await p.locator('[data-action="renew-driver"]').click();
    await p
      .locator('#agency-renew-form [name="salary"]')
      .fill(String(requested));
    await p.locator('#agency-renew-form [type="submit"]').click();
    assert.equal(
      await p.locator(".agency-conversation .agency-driver").count(),
      1,
    );
    await p.locator('#agency-renew-form [type="submit"]').click();
    assert.equal(await p.locator("#agency-renew-form").count(), 0);
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.evaluate(() => {
      const G = RCS,
        s = G.createGame("Carrera ampliada", "", 1470);
      G.player(s).balance = 100000;
      const d = s.drivers
        .filter((d) => !d.companyId)
        .sort((a, b) => a.ask - b.ask)[0];
      let q = G.Drivers.offer(s, d.id, d.ask, 12);
      if (!q.accepted) G.Drivers.offer(s, d.id, q.salary, 12);
      d.stats.focus = d.stats.teamwork = d.stats.discipline = 100;
      G.Calendar.advance(s, G.nextEvent(s).day);
      const e = G.nextEvent(s);
      G.Race.register(s, e.id, d.id, G.ownedCars(s)[0].id);
      G.Race.start(s, e.id);
      G.App.setState(s, 2);
      G.App.paused = true;
      G.App.render();
    });
    const canvas = await p.locator("#race-canvas").boundingBox();
    assert.ok(canvas.height >= 600);
    assert.ok(canvas.width >= 1200);
    assert.equal(
      await p.evaluate(() => {
        const row = document.querySelector(".timing-row");
        for (let i = 0; i < 5; i++) RCS.UI.updateRace(RCS.App.state);
        return row === document.querySelector(".timing-row") && row.isConnected;
      }),
      true,
    );
    await p.locator(".timing-row").last().click();
    assert.equal(
      await p.locator("#camera-button").innerText(),
      "Cámara: seguimiento",
    );
    assert.equal(await p.locator(".command-order").count(), 5);
    await p.locator('[data-action="race-theatre"]').click();
    assert.equal(await p.locator(".race-theatre").count(), 1);
    assert.ok((await p.locator("#race-canvas").boundingBox()).height >= 790);
    await p.locator(".radio-toggle").click();
    assert.equal(
      await p.locator(".radio-floating #command-plan-form").count(),
      1,
    );
    await p.locator('#command-plan-form [name="pace"]').evaluate((el) => {
      el.value = "73";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await p.locator('#command-plan-form [name="risk"]').evaluate((el) => {
      el.value = "32";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await p
      .locator('#command-plan-form [name="tactic"]')
      .selectOption("outside");
    await p.locator('#command-plan-form [name="duration"]').selectOption("120");
    assert.match(
      await p.locator("#command-plan-preview").innerText(),
      /sin enviar.*Ritmo 73.*riesgo 32.*exterior.*120/s,
    );
    assert.equal(
      await p.evaluate(
        () =>
          RCS.App.state.race.entrants.find(
            (a) => a.companyId === RCS.App.state.playerId,
          ).directive.plan.pace,
      ),
      50,
    );
    await p.keyboard.press("Escape");
    assert.equal(await p.locator(".radio-floating").count(), 0);
    assert.equal(await p.locator(".race-theatre").count(), 1);
    await p.locator(".radio-toggle").click();
    assert.equal(
      await p.locator('#command-plan-form [name="pace"]').inputValue(),
      "73",
    );
    await p.locator('#command-plan-form [type="submit"]').click();
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Esperando respuesta",
    );
    assert.match(await p.locator("#reply-note").innerText(), /pausada/);
    const packed = await p.evaluate(() => RCS.Storage.pack(RCS.App.state));
    await p.reload();
    await p.evaluate((raw) => {
      RCS.App.setState(RCS.Storage.unpack(raw).state, 2);
      RCS.App.paused = true;
      RCS.App.render();
    }, packed);
    assert.equal(
      await p.locator("#reply-status").innerText(),
      "Esperando respuesta",
    );
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
    assert.match(
      await p.locator("#command-current").innerText(),
      /Personalizado/,
    );
    assert.match(
      await p.locator("#command-applied-plan").innerText(),
      /Ritmo 73.*riesgo 32.*exterior/s,
    );
    assert.equal(
      await p.locator('.command-order[aria-pressed="true"]').count(),
      0,
    );
    await p.locator("#pit-strategy>summary").click();
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
      await p.evaluate(() => {
        RCS.App.radioFloating = false;
        RCS.App.render();
      });
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Desbordamiento a ${width}`,
      );
      assert.ok((await p.locator("#race-canvas").boundingBox()).height >= 340);
      assert.equal(await p.locator("#command-plan-form").count(), 1);
      assert.equal(await p.locator("#pit-strategy").count(), 1);
      await p.screenshot({
        path: `test-results/director-live-${width}.png`,
        fullPage: true,
      });
      await p.locator('[data-action="race-theatre"]').click();
      await p.locator(".radio-toggle").click();
      assert.equal(await p.locator(".radio-floating").count(), 1);
      if (width === 390) {
        const box = await p.locator(".radio-floating").boundingBox();
        assert.ok(
          box.x >= 0 &&
            box.x + box.width <= width &&
            box.y >= 0 &&
            box.y + box.height <= height,
          "La radio móvil permanece íntegra dentro de la ventana",
        );
        assert.equal(
          await p.evaluate(() => {
            const reply = document.getElementById("reply-status"),
              b = reply.getBoundingClientRect();
            return (
              document
                .elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
                ?.closest("#race-command") ===
              document.getElementById("race-command")
            );
          }),
          true,
          "La clasificación no se superpone a los controles de radio",
        );
      }
      assert.equal(
        await p.evaluate(
          () =>
            document.querySelector(".race-page").scrollWidth <=
            document.querySelector(".race-page").clientWidth,
        ),
        true,
      );
      await p.screenshot({
        path: `test-results/director-theatre-radio-${width}.png`,
        fullPage: false,
      });
      await p.keyboard.press("Escape");
      await p.keyboard.press("Escape");
    }
    assert.deepEqual(errors, []);
    console.log(
      "Director 0.14: negociación real, aumento, renovación, transmisión grande, radio flotante, plan personalizado con respuesta y guardado en tres tamaños: OK",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
