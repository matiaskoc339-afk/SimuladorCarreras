/* Guía de inicio: primera visita real, progreso fuera del estado de simulación,
   reanudación, una sola aparición, jugadores existentes y accesibilidad. */
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
  let checks = 0;
  const errors = [];
  try {
    const url = process.env.GAME_URL || "http://127.0.0.1:4173";
    async function page(context) {
      const p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(url);
      return p;
    }
    async function found(p, name = "Escuela del Asfalto", fromMenu = true) {
      if (fromMenu)
        await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
      await p.locator("#company-name").fill(name);
      const b = await p.locator("#logo-canvas").boundingBox();
      await p.mouse.move(b.x + 20, b.y + 20);
      await p.mouse.down();
      await p.mouse.move(b.x + 110, b.y + 85, { steps: 6 });
      await p.mouse.up();
      await p.getByRole("button", { name: /Fundar compañía/ }).click();
    }
    const snapshot = (p) => p.evaluate(() => JSON.stringify(RCS.App.state));
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      }),
      p = await page(context);
    await found(p);
    await p.locator(".tutorial-dialog").waitFor();
    const initial = await snapshot(p);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    assert.equal(await p.evaluate(() => RCS.App.state.day), 0);
    assert.equal(
      await p.evaluate(() => document.getElementById("app").inert),
      true,
    );
    assert.equal(
      await p.getByRole("progressbar").getAttribute("aria-valuenow"),
      "1",
    );
    assert.equal(await p.getByRole("dialog").count(), 1);
    checks++;
    // El fondo no recibe acciones y la guía es la única región de teclado activa.
    await p.evaluate(() => {
      RCS.App.action("advance", {});
      RCS.App.go("market");
    });
    assert.equal(await snapshot(p), initial);
    assert.equal(await p.evaluate(() => RCS.App.view), "hq");
    await p.locator("#tutorial-next").focus();
    await p.keyboard.press("Tab");
    assert.equal(
      await p.evaluate(() => document.activeElement.dataset.action),
      "tutorial-skip",
    );
    await p.keyboard.press("Shift+Tab");
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      "tutorial-next",
    );
    checks++;
    await p.waitForTimeout(250);
    await p.screenshot({ path: "test-results/tutorial-desktop.png" });
    // Lee las once partes y sus diecisiete pantallas sin cambios en dinero, RNG, entidades o tiempo.
    const count = await p.evaluate(() => RCS.Tutorial.steps.length),
      views = new Set();
    for (let i = 0; i < count; i++) {
      assert.equal(
        await p.getByRole("progressbar").getAttribute("aria-valuenow"),
        String(i + 1),
      );
      const links = await p
        .locator(".tutorial-view-links button")
        .evaluateAll((es) => es.map((e) => e.dataset.view));
      for (const v of links) {
        await p
          .locator(`[data-action="tutorial-view"][data-view="${v}"]`)
          .click();
        views.add(v);
        assert.equal(await p.evaluate(() => RCS.App.view), v);
        assert.equal(await snapshot(p), initial);
      }
      await p.locator(".tutorial-more summary").click();
      assert.ok((await p.locator(".tutorial-more p").innerText()).length > 50);
      assert.equal(await snapshot(p), initial);
      if (i === 6)
        assert.match(
          await p.locator(".tutorial-body").innerText(),
          /cuatro ruedas/,
        );
      if (i === 8)
        assert.match(await p.locator(".tutorial-body").innerText(), /80 %/);
      if (i < count - 1) await p.locator("#tutorial-next").click();
    }
    assert.equal(views.size, 17);
    await p.locator("#tutorial-next").click();
    assert.equal(await p.locator(".tutorial-dialog").count(), 0);
    assert.equal(
      await p.evaluate(() => document.getElementById("app").inert),
      false,
    );
    assert.equal(
      await p.evaluate(
        () => JSON.parse(localStorage.getItem(RCS.Tutorial.KEY)).status,
      ),
      "done",
    );
    assert.equal(await snapshot(p), initial);
    checks++;
    await p.reload();
    await p.locator('[data-action="load"]').first().click();
    assert.equal(await p.locator(".tutorial-dialog").count(), 0);
    assert.equal(await snapshot(p), initial);
    await p
      .getByRole("button", { name: "Partidas y opciones", exact: true })
      .click();
    await p.getByRole("button", { name: "Cómo jugar", exact: true }).click();
    assert.equal(await p.locator(".tutorial-dialog").count(), 1);
    assert.equal(await p.evaluate(() => RCS.Tutorial.mode), "manual");
    const pref = await p.evaluate(() => localStorage.getItem(RCS.Tutorial.KEY));
    await p.keyboard.press("Escape");
    assert.equal(await p.locator(".tutorial-dialog").count(), 0);
    assert.equal(
      await p.evaluate(() => localStorage.getItem(RCS.Tutorial.KEY)),
      pref,
    );
    assert.equal(await snapshot(p), initial);
    checks++;
    // Empezar otra compañía no vuelve a iniciar la guía.
    await p
      .getByRole("button", { name: "Partidas y opciones", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Nueva compañía", exact: true })
      .click();
    await found(p, "Segundo equipo", false);
    assert.equal(await p.locator(".tutorial-dialog").count(), 0);
    assert.equal(
      await p.evaluate(
        () => JSON.parse(localStorage.getItem(RCS.Tutorial.KEY)).status,
      ),
      "done",
    );
    checks++;
    await context.close();
    // Omitir con botón o Escape se recuerda, incluido tras recargar.
    for (const how of ["button", "escape"]) {
      const c = await browser.newContext({
          viewport: { width: 390, height: 844 },
          reducedMotion: "reduce",
        }),
        q = await page(c);
      await found(q, "Guía omitida");
      const before = await snapshot(q);
      if (how === "button")
        await q.locator('[data-action="tutorial-skip"]').click();
      else await q.keyboard.press("Escape");
      assert.equal(
        await q.evaluate(
          () => JSON.parse(localStorage.getItem(RCS.Tutorial.KEY)).status,
        ),
        "skipped",
      );
      assert.equal(await snapshot(q), before);
      await q.reload();
      await q.locator('[data-action="load"]').first().click();
      assert.equal(await q.locator(".tutorial-dialog").count(), 0);
      assert.equal(
        await q.evaluate(() => document.getElementById("app").inert),
        false,
      );
      await c.close();
      checks++;
    }
    // Reanuda el paso correcto y adapta todos los pasos a tableta, móvil y poca altura.
    const c = await browser.newContext({
        viewport: { width: 1024, height: 900 },
        reducedMotion: "reduce",
      }),
      q = await page(c);
    await found(q, "Guía reanudada");
    for (let i = 0; i < 3; i++) await q.locator("#tutorial-next").click();
    assert.equal(await q.evaluate(() => RCS.Tutorial.step), 3);
    const clean = await snapshot(q);
    await q.reload();
    await q.locator('[data-action="load"]').first().click();
    assert.equal(await q.evaluate(() => RCS.Tutorial.step), 3);
    assert.equal(await snapshot(q), clean);
    for (const size of [
      { width: 1024, height: 900 },
      { width: 390, height: 844 },
      { width: 390, height: 560 },
    ]) {
      await q.setViewportSize(size);
      for (let i = 0; i < count; i++) {
        await q.locator(".tutorial-topics summary").click();
        await q
          .locator(`[data-action="tutorial-topic"][data-step="${i}"]`)
          .click();
        assert.equal(
          await q.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        const b = await q.locator(".tutorial-dialog").boundingBox();
        assert.ok(
          b.x >= 0 &&
            b.y >= 0 &&
            b.x + b.width <= size.width + 1 &&
            b.y + b.height <= size.height + 1,
          `${size.width}x${size.height}/${i}`,
        );
        assert.equal(await q.locator("#tutorial-next").isVisible(), true);
        assert.equal(await snapshot(q), clean);
      }
      await q.screenshot({
        path: `test-results/tutorial-${size.width}-${size.height}.png`,
      });
    }
    await q.setViewportSize({ width: 390, height: 844 });
    await q.locator(".tutorial-topics summary").click();
    await q.locator('[data-action="tutorial-topic"][data-step="2"]').click();
    await q.waitForTimeout(250);
    await q.screenshot({ path: "test-results/tutorial-workshop-mobile.png" });
    await q.locator('[data-action="tutorial-back"]').click();
    assert.equal(await q.evaluate(() => RCS.Tutorial.step), 1);
    await q.locator(".tutorial-topics summary").click();
    await q.locator('[data-action="tutorial-topic"][data-step="10"]').click();
    await q.locator('[data-action="tutorial-pilot"]').click();
    assert.equal(await q.evaluate(() => RCS.App.view), "team");
    assert.equal(await snapshot(q), clean);
    await c.close();
    checks++;
    // Un jugador con guardados anteriores no recibe la bienvenida de nuevo, y la consulta no activa sistemas pendientes.
    const raw = fs.readFileSync("tests/fixtures/v80-install.json", "utf8"),
      old = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      });
    await old.addInitScript(
      (raw) => localStorage.setItem("rcs.v1.slot.1", raw),
      raw,
    );
    const v = await page(old);
    await v.locator('[data-action="load"]').first().click();
    assert.equal(await v.locator(".tutorial-dialog").count(), 0);
    assert.equal(
      await v.evaluate(
        () => JSON.parse(localStorage.getItem(RCS.Tutorial.KEY)).status,
      ),
      "returning",
    );
    const state = await snapshot(v);
    await v
      .getByRole("button", { name: "Partidas y opciones", exact: true })
      .click();
    await v.getByRole("button", { name: "Cómo jugar", exact: true }).click();
    for (const step of [2, 4, 7, 8, 9, 10]) {
      await v.locator(".tutorial-topics summary").click();
      await v
        .locator(`[data-action="tutorial-topic"][data-step="${step}"]`)
        .click();
      for (const view of await v
        .locator(".tutorial-view-links button")
        .evaluateAll((es) => es.map((e) => e.dataset.view)))
        await v
          .locator(`[data-action="tutorial-view"][data-view="${view}"]`)
          .click();
      assert.equal(await snapshot(v), state);
    }
    await v.keyboard.press("Escape");
    assert.equal(await snapshot(v), state);
    assert.equal(await v.evaluate(() => RCS.App.state.auctions), undefined);
    assert.equal(await v.evaluate(() => RCS.App.state.workbench), undefined);
    await old.close();
    checks++;
    // Una preferencia pendiente ajena no toma el control de una carrera guardada.
    const race = fs.readFileSync("tests/fixtures/v90-race.json", "utf8"),
      seed = JSON.parse(JSON.parse(race).data).seed,
      busy = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
    await busy.addInitScript(
      ({ raw, seed }) => {
        localStorage.setItem("rcs.v1.slot.1", raw);
        localStorage.setItem(
          "rcs.tutorial.v1",
          JSON.stringify({
            version: 1,
            status: "pending",
            slot: 1,
            seed,
            step: 4,
            revision: 1,
          }),
        );
      },
      { raw: race, seed },
    );
    const r = await page(busy);
    await r.locator('[data-action="load"]').first().click();
    await r.evaluate(() => (RCS.App.paused = true));
    assert.equal(await r.evaluate(() => RCS.App.view), "race");
    assert.equal(await r.locator(".tutorial-dialog").count(), 0);
    const raceBefore = await snapshot(r);
    await r
      .getByRole("button", { name: "Partidas y opciones", exact: true })
      .click();
    assert.equal(
      await r
        .getByRole("button", { name: "Cómo jugar", exact: true })
        .isDisabled(),
      true,
    );
    await r.evaluate(() => RCS.Tutorial.begin(RCS.App, 0, "manual"));
    assert.equal(await snapshot(r), raceBefore);
    assert.equal(await r.locator(".tutorial-dialog").count(), 0);
    await busy.close();
    checks++;
    // Si localStorage deja de aceptar la preferencia, la sesión conserva la omisión frente a la copia pendiente antigua.
    const fallback = await browser.newContext({
        viewport: { width: 390, height: 844 },
      }),
      f = await page(fallback);
    await found(f, "Preferencia de sesión");
    await f.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (this === localStorage && k === RCS.Tutorial.KEY)
          throw new DOMException("Quota", "QuotaExceededError");
        return set.call(this, k, v);
      };
    });
    await f.locator('[data-action="tutorial-skip"]').click();
    assert.equal(
      await f.evaluate(
        () => JSON.parse(sessionStorage.getItem(RCS.Tutorial.KEY)).status,
      ),
      "skipped",
    );
    await f.reload();
    await f.locator('[data-action="load"]').first().click();
    assert.equal(await f.locator(".tutorial-dialog").count(), 0);
    await fallback.close();
    checks++;
    assert.deepEqual(errors, []);
    console.log(
      `Tutorial OK: ${checks} escenarios; once pasos, diecisiete pantallas sin mutar la partida, primera vez/omisión/reanudación, perfiles existentes, teclado, tres tamaños y almacenamiento alternativo.`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
