/* 0.10: primera observación sin dinero añadido; luego caja controlada para revisar
   puja, reloj real, recarga, adjudicación, montaje y venta desde los formularios. */
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
      const create = RCS.createGame;
      RCS.createGame = (n, l) => create(n, l, 1900);
    });
    await p.getByRole("button", { name: /Fundar mi compañía/ }).click();
    await p.locator("#company-name").fill("Galería del Asfalto");
    const logo = await p.locator("#logo-canvas").boundingBox();
    await p.mouse.move(logo.x + 20, logo.y + 20);
    await p.mouse.down();
    await p.mouse.move(logo.x + 105, logo.y + 85, { steps: 6 });
    await p.mouse.up();
    await p.getByRole("button", { name: /Fundar compañía/ }).click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    await p.locator('.rail [data-go="auctions"]').click();
    await p.waitForTimeout(400);
    assert.equal(await p.locator(".auction-entry").count(), 2);
    await p.screenshot({
      path: "test-results/auctions-home.png",
      fullPage: true,
    });
    async function tab(t) {
      await p.locator(`.auction-tabs [data-tab="${t}"]`).click();
    }
    async function enter(id) {
      await p.locator(`[data-action="auction-enter"][data-id="${id}"]`).click();
      await p.locator("#confirm-action").click();
      await p.locator('.auction-room[data-room-status="live"]').waitFor();
    }
    await p.locator('.auction-entry[data-tab="browse"]').click();
    assert.equal(await p.locator(".auction-lot-card").count(), 8);
    const lots = await p.evaluate(() =>
      RCS.App.state.auctions.lots.map((l) => ({
        id: l.id,
        kind: l.kind,
        price: l.opening,
      })),
    );
    assert.ok(lots.every((l) => l.price > 4200));
    await p.locator('[data-action="auction-detail"]').first().click();
    assert.match(
      await p.locator(".modal-content").innerText(),
      /Compatibilidad con tus coches/,
    );
    await p.getByRole("button", { name: "Cerrar ventana" }).click();
    await enter(lots[0].id);
    assert.equal(
      await p.locator('[data-action="auction-bid"]').isDisabled(),
      true,
    );
    await p.waitForFunction(
      () => RCS.Auctions.room(RCS.App.state).leader !== null,
      {},
      { timeout: 12000 },
    );
    assert.ok(Number(await p.locator("#auction-count").innerText()) <= 10);
    await p.locator('[data-action="auction-exit"]').click();
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      4200,
    );
    assert.notEqual(
      await p.evaluate(() => RCS.App.state.auctions.room.leader),
      "player",
    );
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Puja y descenso real de diez a ocho segundos, sin rival en este tramo controlado.
    await p.evaluate(() => {
      RCS.player(RCS.App.state).balance = 2000000;
      RCS.App.persist();
    });
    await tab("browse");
    await enter(lots[1].id);
    await p.evaluate(() => {
      for (const b of RCS.App.state.auctions.room.bidders) b.out = true;
    });
    const price = await p.evaluate(() => RCS.App.state.auctions.room.ask);
    await p.locator('[data-action="auction-bid"]').click();
    assert.equal(
      await p.evaluate(() => RCS.App.state.auctions.room.leader),
      "player",
    );
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      2000000,
    );
    await p.waitForFunction(
      () => RCS.App.state.auctions.room.remaining <= 80,
      {},
      { timeout: 4000 },
    );
    assert.ok(Number(await p.locator("#auction-count").innerText()) <= 8);
    await p
      .getByRole("button", { name: "Guardar partida", exact: true })
      .click();
    const saved = await p.evaluate(() => RCS.App.state.auctions.room.remaining);
    await p.reload();
    await p.locator('[data-action="load"]').first().click();
    await p.locator(".auction-room").waitFor();
    assert.equal(await p.evaluate(() => RCS.App.view), "auctions");
    const loaded = await p.evaluate(
      () => RCS.App.state.auctions.room.remaining,
    );
    assert.ok(loaded <= saved && loaded >= saved - 20);
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      2000000,
    );
    // El resto del recorrido avanza el mismo reloj por su API para comprobar estados exactos.
    await p.evaluate(() => {
      RCS.AuctionUI.frame = () => {};
    });
    await p
      .locator(".auction-room")
      .screenshot({ path: "test-results/auctions-live.png" });
    await p.evaluate(() => {
      const s = RCS.App.state;
      RCS.Auctions.tick(s, s.auctions.room.remaining);
      RCS.App.persist();
      RCS.App.render();
    });
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      2000000 - price,
    );
    const unit = await p.evaluate(() => {
      const s = RCS.App.state,
        l = RCS.Auctions.lot(s, s.auctions.room.lotId);
      return s.parts.find((p) => p.id === l.result.assetId);
    });
    assert.equal(unit.companyId, "player");
    await p.getByRole("button", { name: "Ver mi pieza", exact: true }).click();
    await p.locator('[data-action="wb-tab"][data-tab="inventory"]').click();
    await p.locator(`[data-action="wb-preview"][data-id="${unit.id}"]`).click();
    assert.match(
      await p.locator(".wb-preview").innerText(),
      /Subastar pieza exclusiva/,
    );
    await p.locator('.wb-comparison-strip [data-action="wb-fit"]').click();
    await p.locator("#confirm-action").click();
    const end = await p.evaluate(
      () => RCS.ownedCars(RCS.App.state)[0].repair.end,
    );
    for (let day = 0; day < end; day++)
      await p.locator('.topbar [data-action="advance"]').click();
    assert.ok(
      await p.evaluate(
        () =>
          RCS.ownedCars(RCS.App.state)[0].hp >
          RCS.ownedCars(RCS.App.state)[0].base.hp,
      ),
    );
    // Venta de una unidad comprada de verdad, precio propio y resultado con el 80 % exacto.
    const item = await p.evaluate(() => {
      const s = RCS.App.state,
        p = RCS.Workshop.stock(s, "exhaust-light")[0];
      RCS.Workshop.buy(s, p.id);
      RCS.App.persist();
      return p.id;
    });
    await p.locator('.rail [data-go="auctions"]').click();
    await tab("sell");
    await p.locator("#auction-sell-item").selectOption(item);
    await p.locator("#auction-opening").fill("300");
    assert.match(await p.locator("#auction-net").innerText(), /240/);
    await p.locator('#auction-consign-form [type="submit"]').click();
    assert.match(await p.locator(".modal-content").innerText(), /20 %/);
    await p.locator("#confirm-action").click();
    const own = await p.evaluate(
      (id) => RCS.Auctions.assetLot(RCS.App.state, "part", id).id,
      item,
    );
    assert.ok(own);
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    await enter(own);
    assert.equal(
      await p.locator('[data-action="auction-bid"]').isDisabled(),
      true,
    );
    const cash = await p.evaluate(() => RCS.player(RCS.App.state).balance);
    await p.locator('[data-action="auction-exit"]').click();
    const sale = await p.evaluate(
      (id) => RCS.Auctions.lot(RCS.App.state, id).result,
      own,
    );
    assert.ok(sale.price > 0);
    assert.equal(sale.net, Math.floor(sale.price * 0.8));
    assert.equal(
      await p.evaluate(() => RCS.player(RCS.App.state).balance),
      cash + sale.net,
    );
    assert.match(
      await p.locator(".auction-result").innerText(),
      /Venta completada/,
    );
    await tab("history");
    assert.ok((await p.locator(".auction-history-row").count()) >= 3);
    await p.screenshot({
      path: "test-results/auctions-sales.png",
      fullPage: true,
    });
    // Una retirada antes de abrir no crea dinero y libera el coche.
    await tab("sell");
    await p.locator('[data-action="auction-kind"][data-kind="car"]').click();
    await p.locator('#auction-consign-form [type="submit"]').click();
    await p.locator("#confirm-action").click();
    const carLot = await p.evaluate(
      () =>
        RCS.App.state.auctions.lots.find(
          (l) =>
            l.kind === "car" &&
            l.sellerId === "player" &&
            l.status === "listed",
        ).id,
    );
    await p
      .locator(`[data-action="auction-cancel"][data-id="${carLot}"]`)
      .click();
    await p.locator("#confirm-action").click();
    assert.equal(
      await p.evaluate(
        (id) => RCS.Auctions.lot(RCS.App.state, id).status,
        carLot,
      ),
      "withdrawn",
    );
    await p.waitForFunction(
      () => !document.querySelector("#toast").classList.contains("show"),
    );
    for (const width of [1440, 1024, 390]) {
      await p.setViewportSize({ width, height: 900 });
      for (const t of ["home", "browse", "sell", "mine", "history"]) {
        await tab(t);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${width}/${t}`,
        );
      }
      await tab("browse");
      await p.locator("#auction-filter").selectOption("car");
      assert.equal(
        await p.locator('.auction-lot-card[data-auction-kind="part"]').count(),
        0,
      );
      await p.locator("#auction-filter").selectOption("all");
      await p.waitForTimeout(400);
      await p.screenshot({ path: `test-results/auctions-${width}.png` });
    }
    await p.setViewportSize({ width: 390, height: 900 });
    await tab("browse");
    const last = await p
      .locator('[data-action="auction-enter"]')
      .first()
      .getAttribute("data-id");
    await enter(last);
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p
      .locator(".auction-room")
      .screenshot({ path: "test-results/auctions-mobile-room.png" });
    await p.locator('[data-action="auction-exit"]').click();
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    // Importar 0.9 conserva todo hasta abrir Subastas; activación una sola vez.
    const raw = fs.readFileSync("tests/fixtures/v80-install.json", "utf8");
    await p.evaluate((raw) => {
      const s = RCS.Storage.unpack(raw).state;
      RCS.App.setState(s, 1);
      RCS.App.go("workshop");
    }, raw);
    assert.equal(await p.evaluate(() => RCS.App.state.auctions), undefined);
    const before = await p.evaluate(() => ({
      rng: RCS.App.state.rng,
      cash: RCS.player(RCS.App.state).balance,
      job: JSON.stringify(RCS.ownedCars(RCS.App.state)[0].repair),
    }));
    await p.evaluate(() => RCS.App.go("auctions"));
    assert.deepEqual(
      await p.evaluate(() => ({
        rng: RCS.App.state.rng,
        cash: RCS.player(RCS.App.state).balance,
        job: JSON.stringify(RCS.ownedCars(RCS.App.state)[0].repair),
      })),
      before,
    );
    assert.equal(await p.evaluate(() => RCS.App.state.auctions.lots.length), 8);
    await p.evaluate(() => RCS.Storage.validate(RCS.App.state));
    assert.deepEqual(errors, []);
    console.log(
      "Subastas 0.10 OK: reloj real, observación sin fondos, puja/recarga/entrega, montaje, consignación, 80 % neto, retirada, guardados y tres tamaños.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
