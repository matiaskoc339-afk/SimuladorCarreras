"use strict";
(() => {
  const G = RCS,
    W = G.Workshop,
    C = G.AuctionContent;
  const int = (n, min = 0, max = 1e12) =>
    Number.isInteger(n) && n >= min && n <= max;
  const live = (r) => r?.status === "live";
  const baseOccupied = W.occupied.bind(W);
  const A = (G.Auctions = {
    enabled: (s) => s?.auctions?.version === 1,
    active: (s) => live(s?.auctions?.room),
    random(x) {
      return G.random(x);
    },
    pick(x, a) {
      return a[G.integer(x, 0, a.length - 1)];
    },
    initialize(s) {
      if (this.enabled(s)) return s;
      G.assert(
        s.version === 3 && !s.race,
        "Termina la carrera antes de abrir la casa de subastas.",
      );
      G.Coachwork.initialize(s);
      const x = (s.auctions = {
        version: 1,
        rng: (s.seed ^ 0x51a0c71) >>> 0,
        serial: 0,
        round: 0,
        seededDay: s.day,
        nextDay: s.day + 7,
        house: { received: 0, paid: 0, balance: 0 },
        patrons: [],
        lots: [],
        room: null,
      });
      const names = [
        "Colección Vega",
        "Atelier Nakamura",
        "Fundación Bellini",
        "Restauraciones Boreal",
        "Galería Altamar",
        "Colección Mistral",
        "Museo del Automóvil",
        "Archivo Nébula",
        "Taller Arashi",
        "Gran Turismo Heritage",
        "Colección Isadora",
        "Comercio Meridian",
      ];
      for (let i = 0; i < names.length; i++) {
        const capital = Math.round(
          [
            85000, 160000, 235000, 320000, 470000, 650000, 900000, 1200000,
            180000, 420000, 750000, 280000,
          ][i] *
            (0.9 + this.random(x) * 0.2),
        );
        x.patrons.push({
          id: G.uid(s, "patron"),
          name: names[i],
          type: ["collector", "tuner", "restorer", "dealer"][i % 4],
          taste: G.integer(x, 0, 15),
          patience: G.integer(x, 15, 85),
          ego: 0.03 + this.random(x) * 0.22,
          initial: capital,
          balance: capital,
          income: 0,
          spent: 0,
        });
      }
      this.refresh(s);
      return s;
    },
    externalOwner(s, id) {
      return this.enabled(s) && s.auctions.patrons.some((p) => p.id === id);
    },
    nextSerial(s) {
      return ++s.auctions.serial;
    },
    definition(s, t, model) {
      const x = s.auctions;
      return C.id(t, model, this.nextSerial(s), G.integer(x, 0, 4294967295));
    },
    refresh(s) {
      const x = s.auctions;
      if (!x) return;
      const existing = x.lots.filter((l) =>
        ["listed", "live"].includes(l.status),
      );
      if (existing.filter((l) => l.sellerId === null).length) return;
      const own = G.ownedCars(s)[0],
        models = G.Data.models
          .map((m, i) => i)
          .filter(
            (i) =>
              G.Competition.enabled(s) ||
              (G.Data.models[i].hp <= 210 && G.Data.models[i].weight >= 850),
          ),
        special = models.filter((i) => G.Data.models[i].auctionOnly),
        round = x.round++;
      for (let i = 0; i < 8; i++) {
        let blueprint,
          kind = i >= 6 ? "car" : "part";
        if (kind === "part") {
          const t =
            i === 0
              ? 22 + (round % 6)
              : i === 1
                ? 28 + (round % 6)
                : i === 3
                  ? 37 + (round % 3)
                  : i === 4
                    ? 34 + (round % 3)
                    : (round * 17 + i * 7) % C.families.length;
          const model =
            i === 0 && own && round % 2 === 0
              ? own.modelIndex
              : this.pick(x, models);
          blueprint = {
            definitionId: this.definition(s, t, model),
            condition: G.integer(x, 88, 100),
          };
        } else {
          const model =
              i === 6
                ? (special.length ? special : models)[
                    (round * 5 + G.integer(x, 0, 2)) %
                      (special.length || models.length)
                  ]
                : this.pick(x, models),
            m = G.Data.models[model],
            kit = round % 3,
            defs = [];
          if (i === 7 || round % 2 === 1) {
            defs.push(
              this.definition(s, 35, model),
              this.definition(s, 24 + (kit % 2), model),
              this.definition(s, 38, model),
              this.definition(s, 14, model),
              this.definition(s, 6, model),
            );
            if (m.hp < 210 && (G.Competition.enabled(s) || m.hp + 30 <= 210))
              defs.push(this.definition(s, 29, model));
          }
          blueprint = {
            modelIndex: model,
            color: C.palette[G.integer(x, 0, C.palette.length - 1)],
            condition: G.integer(x, m.year < 1990 ? 78 : 94, 100),
            tires: G.integer(x, 85, 100),
            km: G.integer(
              x,
              m.year < 1990 ? 28000 : 0,
              m.year < 1990 ? 115000 : 9000,
            ),
            parts: defs,
            collectible: {
              serial: this.nextSerial(s),
              title: [
                "Restauración de archivo",
                "Comisión de autor",
                "Homologación privada",
                "Prototipo firmado",
                "Heritage de resistencia",
                "Atelier de competición",
              ][(round + i) % 6],
              accent: C.palette[(round + i + 3) % 8],
              edition: C.series[(round * 3 + i) % 16],
            },
          };
        }
        const lot = {
          id: G.uid(s, "lot"),
          kind,
          sellerId: null,
          assetId: null,
          blueprint,
          day: s.day,
          endDay: x.nextDay,
          status: "listed",
          estimate: 0,
          opening: 0,
          step: 0,
          result: null,
        };
        lot.estimate = this.value(s, lot);
        lot.opening = Math.max(
          kind === "car" ? 50000 : 6500,
          Math.round((lot.estimate * (0.54 + this.random(x) * 0.35)) / 100) *
            100,
        );
        lot.step = Math.max(
          kind === "car" ? 1000 : 250,
          Math.round((lot.opening * 0.045) / 50) * 50,
        );
        x.lots.push(lot);
      }
      this.prune(s);
    },
    prune(s) {
      const x = s.auctions,
        closed = x.lots
          .filter((l) => !["listed", "live"].includes(l.status))
          .slice(-80),
        ids = new Set(closed.map((l) => l.id));
      x.lots = x.lots.filter(
        (l) =>
          ["listed", "live"].includes(l.status) ||
          ids.has(l.id) ||
          l.id === x.room?.lotId,
      );
    },
    lot(s, id) {
      return s.auctions?.lots.find((l) => l.id === id);
    },
    asset(s, lot) {
      return lot.kind === "car"
        ? s.cars.find((c) => c.id === lot.assetId)
        : s.parts.find((p) => p.id === lot.assetId);
    },
    preview(s, lot) {
      if (lot.assetId) return this.asset(s, lot);
      const b = lot.blueprint;
      if (lot.kind === "part")
        return {
          id: "previewpart",
          definitionId: b.definitionId,
          condition: b.condition,
          carId: null,
          companyId: null,
          reservedFor: null,
        };
      const m = G.Data.models[b.modelIndex],
        car = {
          ...G.clone(m),
          id: "previewcar",
          modelIndex: b.modelIndex,
          companyId: null,
          color: b.color,
          km: b.km,
          condition: b.condition,
          tires: b.tires,
          oemTires: b.tires,
          repair: null,
          history: [],
          starts: 0,
          wins: 0,
          collectible: G.clone(b.collectible),
          base: Object.fromEntries(W.attributes.map((k) => [k, m[k]])),
          components: Object.fromEntries(
            Object.keys(G.Parts.components).map((k) => [
              k,
              k === "tires" ? b.tires : b.condition,
            ]),
          ),
          installed: {},
          upgradeValue: 0,
        };
      const parts = b.parts.map((id, i) => ({
        id: "previewpart" + i,
        definitionId: id,
        condition: 100,
        companyId: null,
        carId: car.id,
        reservedFor: null,
      }));
      for (const p of parts)
        car.installed[G.Parts.definition(p.definitionId).slot] = p.id;
      const temp = { ...s, parts };
      Object.assign(car, W.configuration(temp, car));
      car.coachwork = G.Coachwork.spec(temp, car);
      car.upgradeValue = parts.reduce(
        (n, p) => n + G.Parts.definition(p.definitionId).price * 0.5,
        0,
      );
      return car;
    },
    value(s, lot) {
      const p = this.preview(s, lot);
      if (lot.kind === "part")
        return Math.round(
          (G.Parts.definition(p.definitionId).price * p.condition) / 100,
        );
      return Math.round(
        G.Market.value(p) +
          (p.collectible
            ? Math.max(24000, p.value * 0.65) * (p.condition / 100)
            : 0),
      );
    },
    title(s, lot) {
      const p = this.preview(s, lot);
      return lot.kind === "part"
        ? G.Parts.definition(p.definitionId).name
        : `${p.brand} ${p.model}${p.collectible ? " · " + p.collectible.edition : ""}`;
    },
    assetLot(s, kind, id) {
      return s.auctions?.lots.find(
        (l) =>
          l.kind === kind &&
          l.assetId === id &&
          ["listed", "live"].includes(l.status),
      );
    },
    locked(s, kind, id) {
      return !!this.assetLot(s, kind, id);
    },
    sellerReason(s, kind, id) {
      const p =
        kind === "car"
          ? s.cars.find((c) => c.id === id)
          : s.parts.find((p) => p.id === id);
      if (!p || p.companyId !== s.playerId) return "El objeto no te pertenece.";
      if (this.locked(s, kind, id))
        return "El objeto ya está consignado en una subasta.";
      if (kind === "part")
        return p.carId
          ? "Desmonta la pieza en el taller antes de subastarla."
          : p.reservedFor
            ? "La pieza está reservada para un montaje."
            : p.condition < 10
              ? "La pieza está demasiado dañada para ser aceptada."
              : "";
      return p.repair
        ? "Termina el trabajo de taller antes de subastar el coche."
        : G.Market.listed(s, id)
          ? "Retira el anuncio del mercado antes de subastarlo."
          : G.Market.locked(s, id)
            ? "El coche está inscrito, entrenando o reservado."
            : "";
    },
    consign(s, kind, id, opening) {
      G.ensurePlayable(s);
      G.assert(
        this.enabled(s) && !s.race && !this.active(s),
        "Abre Subastas fuera de una carrera o sala activa.",
      );
      G.assert(["part", "car"].includes(kind), "Objeto inválido.");
      const reason = this.sellerReason(s, kind, id);
      G.assert(!reason, reason);
      G.assert(
        s.auctions.lots.filter(
          (l) => l.sellerId === s.playerId && l.status === "listed",
        ).length < 4,
        "Ya tienes cuatro objetos pendientes de subasta.",
      );
      const l = {
        id: null,
        kind,
        sellerId: s.playerId,
        assetId: id,
        blueprint: null,
        day: s.day,
        endDay: s.day + 7,
        status: "listed",
        estimate: 0,
        opening,
        step: 0,
        result: null,
      };
      l.estimate = this.value(s, l);
      G.assert(
        int(
          opening,
          Math.max(100, Math.round(l.estimate * 0.5)),
          Math.max(100, Math.round(l.estimate * 1.5)),
        ),
        "La salida debe estar entre el 50 % y el 150 % de la valoración (mínimo 100 US$).",
      );
      l.step = Math.max(50, Math.round((opening * 0.045) / 50) * 50);
      l.id = G.uid(s, "lot");
      s.auctions.lots.push(l);
      G.news(
        s,
        "Mercado",
        `Consignas ${this.title(s, l)} en subasta.`,
        `Salida: $${opening}. Recibirás el 80 % si se adjudica; el objeto permanece bloqueado hasta la venta o retirada.`,
        "auctions",
        l.id,
      );
      return l;
    },
    cancel(s, id) {
      G.ensurePlayable(s);
      const l = this.lot(s, id);
      G.assert(
        l?.sellerId === s.playerId && l.status === "listed" && !this.active(s),
        "Solo puedes retirar tu lote antes de iniciar la sala.",
      );
      l.status = "withdrawn";
      return l;
    },
    actor(s, id) {
      return (
        s.companies.find((c) => c.id === id) ||
        s.auctions?.patrons.find((p) => p.id === id)
      );
    },
    room(s) {
      return s.auctions?.room;
    },
    reserved(s, id, kind = null) {
      const r = this.room(s);
      if (!live(r) || r.leader !== id) return 0;
      if (kind) return this.lot(s, r.lotId).kind === kind ? 1 : 0;
      return r.price;
    },
    receiveReason(s, lot, id) {
      const c = s.companies.find((c) => c.id === id);
      if (!c)
        return s.auctions.patrons.some((p) => p.id === id)
          ? ""
          : "Participante desconocido.";
      if (c.status !== "active") return "La compañía no está activa.";
      if (lot.kind === "car" && G.ownedCars(s, id).length >= c.carCapacity)
        return "No tienes una plaza libre en el garaje.";
      if (lot.kind === "part" && baseOccupied(s, id) >= c.sparesCapacity)
        return "No tienes una plaza libre en el almacén.";
      return "";
    },
    bidders(s, lot) {
      const x = s.auctions,
        p = this.preview(s, lot),
        def = lot.kind === "part" ? G.Parts.definition(p.definitionId) : null,
        signature = def
          ? Object.keys(G.Parts.slots).indexOf(def.slot)
          : p.modelIndex;
      const patrons = x.patrons
        .slice()
        .sort((a, b) => C.hash(lot.id + a.id) - C.hash(lot.id + b.id))
        .slice(0, 5 + G.integer(x, 0, 2));
      const rivals = s.companies
        .filter(
          (c) =>
            c.id !== s.playerId &&
            c.id !== lot.sellerId &&
            !this.receiveReason(s, lot, c.id) &&
            c.balance >= lot.opening * 1.25,
        )
        .sort((a, b) => C.hash(lot.id + a.id) - C.hash(lot.id + b.id))
        .slice(0, 3);
      return [...patrons, ...rivals].map((c) => {
        const company = s.companies.includes(c),
          match = company
            ? def?.models
              ? G.ownedCars(s, c.id).some((car) =>
                  def.models.includes(car.modelIndex),
                )
              : true
            : c.taste % 4 === signature % 4,
          type = company ? "team" : c.type;
        const taste = match
          ? 1.12 + this.random(x) * 0.55
          : 0.56 + this.random(x) * 0.4;
        const factor =
          type === "dealer"
            ? 0.66 + this.random(x) * 0.25
            : type === "restorer"
              ? lot.kind === "car" && p.year < 1990
                ? 1.4
                : 0.82
              : type === "tuner"
                ? def
                  ? 1.18
                  : 0.87
                : type === "team"
                  ? match
                    ? 1.08
                    : 0.48
                  : 1.1;
        const reserve = company
          ? Math.max(
              3000,
              c.balance * 0.34,
              [
                ...G.ownedDrivers(s, c.id),
                ...s.employees.filter((e) => e.companyId === c.id),
              ].reduce((n, e) => n + (G.Pay.monthly(e.contract) * 14) / 30, 0),
            )
          : 0;
        const budget = Math.max(0, Math.floor(c.balance - reserve));
        return {
          id: c.id,
          name: c.name,
          type,
          budget,
          value: Math.round(
            Math.min(
              lot.estimate * taste * factor * (0.83 + this.random(x) * 0.3),
              def?.auctionOnly ||
                p.collectible ||
                G.Data.models[p.modelIndex]?.auctionOnly
                ? 1e12
                : lot.estimate * 1.12,
            ),
          ),
          ego: company ? 0.04 + this.random(x) * 0.14 : c.ego,
          patience: company ? G.integer(x, 15, 85) : c.patience,
          next: 0,
          out: false,
          bids: 0,
        };
      });
    },
    delay(s, b) {
      return 4 + Math.round(b.patience * 0.86) + G.integer(s.auctions, 0, 8);
    },
    start(s, id, { background = false } = {}) {
      if (!background) G.ensurePlayable(s);
      const l = this.lot(s, id);
      G.assert(
        this.enabled(s) &&
          !s.race &&
          !this.active(s) &&
          l?.status === "listed" &&
          (background || l.endDay >= s.day),
        "Esta subasta no está disponible.",
      );
      const r = {
        lotId: id,
        status: "live",
        elapsed: 0,
        remaining: 120,
        leader: null,
        price: 0,
        ask: l.opening,
        playerOut: background || l.sellerId === s.playerId,
        bidders: this.bidders(s, l),
        bids: [],
        comment: `La salida es de $${l.opening}. ¿Quién abre la puja?`,
        count: 0,
      };
      for (const b of r.bidders) b.next = this.delay(s, b);
      s.auctions.room = r;
      l.status = "live";
      return r;
    },
    bidReason(s, expected) {
      const r = this.room(s),
        l = r && this.lot(s, r.lotId);
      if (!live(r)) return "La sala ya ha cerrado.";
      if (r.playerOut || l.sellerId === s.playerId)
        return "Te has retirado o eres el vendedor; puedes seguir mirando.";
      if (r.leader === s.playerId) return "Tu puja ya es la más alta.";
      if (expected !== r.ask)
        return "El precio ha cambiado. Revisa la nueva puja antes de aceptarla.";
      if (this.receiveReason(s, l, s.playerId))
        return this.receiveReason(s, l, s.playerId);
      if (G.player(s).balance < r.ask)
        return "No tienes fondos para esta puja.";
      return "";
    },
    bid(s, expected) {
      const reason = this.bidReason(s, expected);
      G.assert(!reason, reason);
      return this.accept(s, s.playerId);
    },
    accept(s, id) {
      const r = this.room(s),
        l = this.lot(s, r.lotId),
        actor = this.actor(s, id),
        bidder = r.bidders.find((b) => b.id === id);
      G.assert(
        live(r) &&
          id !== r.leader &&
          id !== l.sellerId &&
          (id === s.playerId
            ? !r.playerOut
            : bidder && !bidder.out && bidder.budget >= r.ask) &&
          actor?.balance >= r.ask &&
          !this.receiveReason(s, l, id),
        "Puja inválida o sin fondos/capacidad.",
      );
      r.price = r.ask;
      r.leader = id;
      r.ask =
        r.price + Math.max(l.step, Math.round((r.price * 0.045) / 50) * 50);
      r.remaining = 100;
      r.count++;
      r.bids.push({ id, price: r.price, tick: r.elapsed });
      if (r.bids.length > 80) r.bids.shift();
      r.comment = `${actor.name} ofrece $${r.price}. ¿Alguien da $${r.ask}?`;
      for (const b of r.bidders) {
        if (b.id === id) b.bids++;
        b.next = r.elapsed + this.delay(s, b);
      }
      return r;
    },
    tick(s, steps = 1) {
      G.assert(int(steps, 1, 10000), "Tiempo de subasta inválido.");
      for (let i = 0; i < steps && this.active(s); i++) {
        const r = this.room(s);
        r.elapsed++;
        r.remaining--;
        // Al llegar a cero se adjudica antes de aceptar una oferta nueva.
        if (r.remaining <= 0) {
          this.close(s);
          break;
        }
        for (const b of r.bidders) {
          if (
            !this.active(s) ||
            b.out ||
            b.id === r.leader ||
            b.next > r.elapsed
          )
            continue;
          const actor = this.actor(s, b.id),
            limit = Math.min(
              b.budget,
              actor?.balance || 0,
              Math.round(b.value * (1 + b.ego * Math.min(1, r.count / 8))),
            );
          if (
            r.ask > limit ||
            this.receiveReason(s, this.lot(s, r.lotId), b.id)
          ) {
            b.out = true;
            continue;
          }
          this.accept(s, b.id);
          break;
        }
      }
      return this.room(s);
    },
    run(s) {
      for (let i = 0; this.active(s) && i < 20000; i++) this.tick(s, 1);
      G.assert(!this.active(s), "La sala no pudo cerrar.");
      return this.room(s);
    },
    withdraw(s) {
      G.assert(this.active(s), "La sala ya ha cerrado.");
      this.room(s).playerOut = true;
      return this.run(s);
    },
    transfer(s, lot, id) {
      const company = s.companies.some((c) => c.id === id),
        owner = company ? id : null;
      let asset;
      if (lot.assetId) {
        asset = this.asset(s, lot);
        asset.companyId = owner;
        delete asset.auctionOwnerId;
        if (!company) asset.auctionOwnerId = id;
        if (lot.kind === "car") {
          for (const partId of Object.values(asset.installed)) {
            const p = s.parts.find((p) => p.id === partId);
            p.companyId = owner;
            delete p.auctionOwnerId;
            if (!company) p.auctionOwnerId = id;
          }
          asset.history.unshift({
            day: s.day,
            type: `Subasta: adjudicado a ${this.actor(s, id).name}`,
          });
          asset.history.length = Math.min(30, asset.history.length);
        }
      } else if (lot.kind === "part") {
        asset = {
          ...this.preview(s, lot),
          id: G.uid(s, "part"),
          companyId: owner,
        };
        if (!company) asset.auctionOwnerId = id;
        s.parts.push(asset);
      } else {
        asset = G.clone(this.preview(s, lot));
        asset.id = G.uid(s, "car");
        asset.companyId = owner;
        asset.installed = {};
        if (!company) asset.auctionOwnerId = id;
        for (const defId of lot.blueprint.parts) {
          const p = {
            id: G.uid(s, "part"),
            definitionId: defId,
            condition: 100,
            companyId: owner,
            carId: asset.id,
            reservedFor: null,
          };
          if (!company) p.auctionOwnerId = id;
          s.parts.push(p);
          asset.installed[G.Parts.definition(defId).slot] = p.id;
        }
        W.recalculate(s, asset);
        asset.history = [
          {
            day: s.day,
            type: `Unidad de colección adjudicada en subasta a ${this.actor(s, id).name}`,
          },
        ];
        s.cars.push(asset);
      }
      asset.auctionHistory = [
        ...(asset.auctionHistory || []),
        { lotId: lot.id, day: s.day, price: this.room(s).price, buyerId: id },
      ].slice(-12);
      return asset;
    },
    close(s) {
      const r = this.room(s),
        l = this.lot(s, r.lotId);
      G.assert(
        live(r) && l?.status === "live",
        "La adjudicación ya se ha procesado.",
      );
      if (!r.leader) {
        r.status = l.status = "unsold";
        r.remaining = 0;
        r.comment = "Sin pujas. El lote queda sin adjudicar.";
        l.result = {
          day: s.day,
          winnerId: null,
          price: 0,
          net: 0,
          fee: 0,
          bids: [],
          assetId: l.assetId,
        };
        return l.result;
      }
      const buyer = this.actor(s, r.leader),
        reason = this.receiveReason(s, l, r.leader);
      G.assert(
        buyer && buyer.balance >= r.price && !reason,
        reason || "El adjudicatario no puede liquidar la compra.",
      );
      if (l.assetId)
        G.assert(
          this.asset(s, l)?.companyId === l.sellerId,
          "La propiedad del lote ha cambiado.",
        );
      const price = r.price,
        net = l.sellerId ? Math.floor(price * 0.8) : 0,
        fee = l.sellerId ? price - net : 0;
      // Desactiva la reserva solo después de validar todo, antes de liquidar el único pago.
      r.status = "settling";
      if (s.companies.some((c) => c.id === r.leader))
        G.Economy.transact(
          s,
          r.leader,
          -price,
          "Subastas",
          `Adjudicación · ${this.title(s, l)} · ${l.id}`,
        );
      else {
        buyer.balance -= price;
        buyer.spent += price;
      }
      const h = s.auctions.house;
      h.received += price;
      h.paid += net;
      h.balance += price - net;
      if (l.sellerId)
        G.Economy.transact(
          s,
          l.sellerId,
          net,
          "Subastas",
          `Venta en subasta · ${this.title(s, l)} · 80 % neto`,
        );
      const asset = this.transfer(s, l, r.leader);
      if (buyer.decisions && buyer.id !== s.playerId) {
        buyer.decisions.unshift({
          day: s.day,
          action: "subasta",
          reason: `Adjudicación de ${this.title(s, l)} tras ${r.count} pujas.`,
          targetId: l.kind === "car" ? asset.id : null,
          cost: price,
        });
        buyer.decisions.length = Math.min(16, buyer.decisions.length);
      }

      r.status = l.status = "sold";
      r.remaining = 0;
      r.comment = `¡Adjudicado a ${buyer.name} por $${price}!${l.sellerId ? ` El vendedor recibe $${net}; comisión $${fee}.` : ""}`;
      l.result = {
        day: s.day,
        winnerId: r.leader,
        price,
        net,
        fee,
        bids: G.clone(r.bids),
        assetId: asset.id,
      };
      G.news(
        s,
        "Mercado",
        `${this.title(s, l)}: adjudicado a ${buyer.name}.`,
        `${price} US$ en ${r.count} pujas.${l.sellerId ? ` El vendedor recibe ${net} US$ y la casa retiene ${fee} US$.` : ""}`,
        "auctions",
        l.id,
      );
      return l.result;
    },
    daily(s) {
      if (!this.enabled(s) || this.active(s)) return;
      const x = s.auctions;
      for (const l of x.lots.filter(
        (l) => l.status === "listed" && l.endDay <= s.day,
      )) {
        if (l.sellerId && this.asset(s, l)?.companyId !== l.sellerId) {
          l.status = "withdrawn";
          continue;
        }
        this.start(s, l.id, { background: true });
        this.run(s);
      }
      if (s.day >= x.nextDay) {
        for (const p of x.patrons) {
          const income = Math.round(p.initial * 0.035);
          p.balance += income;
          p.income += income;
        }
        x.nextDay = s.day + 7;
        this.refresh(s);
      }
    },
    validate(s) {
      if (s.auctions === undefined) {
        G.assert(
          !s.cars.some((c) => c.auctionOwnerId || c.collectible) &&
            !(s.parts || []).some(
              (p) =>
                p.auctionOwnerId ||
                G.Parts.definition(p.definitionId)?.auctionOnly,
            ),
          "Falta la gestión de objetos de subasta.",
        );
        return;
      }
      const x = s.auctions;
      G.assert(
        this.enabled(s) &&
          G.Coachwork.enabled(s) &&
          int(x.serial, 1, 1e9) &&
          int(x.round, 1, 1e9) &&
          int(x.seededDay, 0, s.day) &&
          int(x.nextDay, s.day + 1, s.day + 7) &&
          int(x.rng, 0, 4294967295) &&
          Array.isArray(x.patrons) &&
          x.patrons.length === 12 &&
          Array.isArray(x.lots) &&
          x.lots.length <= 100,
        "Gestión de subastas inválida.",
      );
      const h = x.house;
      G.assert(
        h &&
          [h.received, h.paid, h.balance].every((n) => int(n)) &&
          h.balance === h.received - h.paid,
        "Contabilidad de la casa de subastas incoherente.",
      );
      const ids = new Set(s.companies.map((c) => c.id)),
        assets = new Set();
      for (const p of x.patrons) {
        G.assert(
          /^patron-\d+$/.test(p.id) &&
            !ids.has(p.id) &&
            typeof p.name === "string" &&
            p.name.length < 80 &&
            ["collector", "tuner", "restorer", "dealer"].includes(p.type) &&
            [p.initial, p.balance, p.income, p.spent].every((n) => int(n)) &&
            p.balance === p.initial + p.income - p.spent &&
            int(p.taste, 0, 15) &&
            int(p.patience, 15, 85) &&
            p.ego >= 0 &&
            p.ego <= 0.3,
          "Cuenta o perfil de participante inválido.",
        );
        ids.add(p.id);
      }
      const lotIds = new Set();
      for (const l of x.lots) {
        G.assert(
          /^lot-\d+$/.test(l.id) &&
            !lotIds.has(l.id) &&
            ["car", "part"].includes(l.kind) &&
            ["listed", "live", "sold", "unsold", "withdrawn"].includes(
              l.status,
            ) &&
            [null, s.playerId].includes(l.sellerId) &&
            int(l.day, 0, s.day) &&
            int(l.endDay, l.day + 1) &&
            int(l.opening, 100) &&
            int(l.estimate, 1) &&
            int(l.step, 50),
          "Ficha de lote inválida.",
        );
        lotIds.add(l.id);
        if (l.assetId) {
          const p = this.asset(s, l);
          G.assert(p && l.blueprint === null, "Objeto de subasta inexistente.");
          if (["listed", "live"].includes(l.status)) {
            G.assert(
              p.companyId === l.sellerId &&
                !assets.has(l.kind + l.assetId) &&
                !(l.kind === "car"
                  ? p.repair ||
                    G.Market.listed(s, p.id) ||
                    s.season.events.some(
                      (e) =>
                        e.status === "scheduled" && e.entry?.carId === p.id,
                    ) ||
                    G.Practice.active(s)?.carId === p.id
                  : p.carId || p.reservedFor),
              "Objeto consignado duplicado, usado o con propiedad incorrecta.",
            );
            assets.add(l.kind + l.assetId);
          }
        } else {
          const b = l.blueprint;
          G.assert(b && l.sellerId === null, "Falta la ficha exclusiva.");
          if (l.kind === "part")
            G.assert(
              G.Parts.definition(b.definitionId)?.auctionOnly &&
                int(b.condition, 1, 100),
              "Pieza exclusiva inválida.",
            );
          else {
            G.assert(
              G.Data.models[b.modelIndex] &&
                /^#[0-9a-f]{6}$/i.test(b.color) &&
                int(b.km) &&
                int(b.condition, 1, 100) &&
                int(b.tires, 1, 100) &&
                Array.isArray(b.parts) &&
                b.parts.length <= 8 &&
                b.parts.every((id) => G.Parts.definition(id)?.auctionOnly) &&
                b.collectible &&
                int(b.collectible.serial, 1, x.serial),
              "Vehículo de colección inválido.",
            );
            const car = this.preview(s, l),
              parts = b.parts.map((id, i) => ({
                id: "previewpart" + i,
                definitionId: id,
                condition: 100,
              }));
            G.assert(
              !W.rules({ ...s, parts }, car, car.installed),
              "Preparación del coche subastado incompatible.",
            );
          }
        }
        if (["sold", "unsold"].includes(l.status)) {
          const r = l.result;
          G.assert(
            r &&
              int(r.day, l.day, s.day) &&
              Array.isArray(r.bids) &&
              r.bids.length <= 80 &&
              int(r.price) &&
              int(r.net) &&
              int(r.fee) &&
              ((l.status === "sold" &&
                ids.has(r.winnerId) &&
                r.price >= l.opening &&
                r.net === (l.sellerId ? Math.floor(r.price * 0.8) : 0) &&
                r.fee === (l.sellerId ? r.price - r.net : 0) &&
                r.bids.at(-1)?.id === r.winnerId &&
                r.bids.at(-1)?.price === r.price) ||
                (l.status === "unsold" &&
                  r.winnerId === null &&
                  r.price === 0)),
            "Liquidación de subasta inválida.",
          );
        }
      }
      const collectible = (c) =>
        c &&
        int(c.serial, 1, x.serial) &&
        C.palette.includes(c.accent) &&
        C.series.includes(c.edition) &&
        typeof c.title === "string" &&
        c.title.length <= 80;
      const exclusiveIds = new Set();
      for (const p of s.parts) {
        const d = G.Parts.definition(p.definitionId);
        if (!d?.auctionOnly) continue;
        G.assert(
          d.serial <= x.serial && !exclusiveIds.has(d.id),
          "Una pieza exclusiva se ha duplicado o tiene una serie imposible.",
        );
        exclusiveIds.add(d.id);
      }
      for (const l of x.lots)
        if (l.blueprint?.collectible)
          G.assert(
            collectible(l.blueprint.collectible),
            "Certificado o pintura de colección inválidos.",
          );
      for (const c of s.cars)
        if (c.collectible)
          G.assert(
            collectible(c.collectible),
            "Certificado del coche de colección inválido.",
          );
      for (const c of s.cars)
        if (c.auctionOwnerId)
          G.assert(
            c.companyId === null &&
              x.patrons.some((p) => p.id === c.auctionOwnerId) &&
              !G.Market.listed(s, c.id),
            "Propiedad de colección inválida.",
          );
      for (const p of s.parts)
        if (p.auctionOwnerId)
          G.assert(
            p.companyId === null &&
              x.patrons.some((c) => c.id === p.auctionOwnerId) &&
              (!p.carId ||
                s.cars.some(
                  (c) =>
                    c.id === p.carId && c.auctionOwnerId === p.auctionOwnerId,
                )),
            "Propiedad externa de repuesto inválida.",
          );
      const r = x.room;
      if (!r) return;
      const l = this.lot(s, r.lotId);
      G.assert(
        l &&
          ["live", "sold", "unsold"].includes(r.status) &&
          l.status === r.status &&
          int(r.elapsed, 0, 20000) &&
          int(r.remaining, 0, 120) &&
          int(r.price) &&
          int(r.ask, l.opening) &&
          int(r.count, 0, 200) &&
          typeof r.playerOut === "boolean" &&
          typeof r.comment === "string" &&
          Array.isArray(r.bidders) &&
          r.bidders.length <= 10 &&
          Array.isArray(r.bids) &&
          r.bids.length <= 80,
        "Sala o contador de subasta inválidos.",
      );
      const seen = new Set();
      for (const b of r.bidders) {
        G.assert(
          ids.has(b.id) &&
            b.id !== s.playerId &&
            b.id !== l.sellerId &&
            !seen.has(b.id) &&
            typeof b.out === "boolean" &&
            int(b.budget) &&
            int(b.value) &&
            int(b.next, 1, 21000) &&
            int(b.patience, 0, 100) &&
            b.ego >= 0 &&
            b.ego <= 0.3,
          "Participante de sala inválido.",
        );
        seen.add(b.id);
      }
      let previous = 0;
      for (const b of r.bids) {
        G.assert(
          ids.has(b.id) &&
            int(b.price, l.opening) &&
            b.price > previous &&
            int(b.tick, 0, r.elapsed),
          "Historial de pujas inválido.",
        );
        previous = b.price;
      }
      G.assert(
        r.leader === null
          ? r.price === 0 && r.bids.length === 0
          : ids.has(r.leader) &&
              r.leader !== l.sellerId &&
              r.bids.at(-1)?.id === r.leader &&
              r.bids.at(-1)?.price === r.price &&
              r.ask >= r.price + l.step,
        "Última puja incoherente.",
      );
      if (live(r))
        G.assert(
          !s.race &&
            r.remaining > 0 &&
            (!r.leader ||
              (this.actor(s, r.leader).balance >= r.price &&
                !this.receiveReason(s, l, r.leader))),
          "Reserva de compra sin liquidez o capacidad.",
        );
    },
  });
  // Reservas y propiedad compartidas con taller, mercado, entrenamiento y calendario.
  const stock = W.stock;
  W.stock = function (s, ...args) {
    return stock
      .call(this, s, ...args)
      .filter(
        (p) =>
          !p.auctionOwnerId &&
          !A.locked(s, "part", p.id) &&
          !G.Parts.definition(p.definitionId).auctionOnly,
      );
  };
  const buy = W.buy;
  W.buy = function (s, id, cid = s.playerId) {
    const p = s.parts.find((p) => p.id === id);
    G.assert(
      !p?.auctionOwnerId &&
        !G.Parts.definition(p?.definitionId)?.auctionOnly &&
        !A.locked(s, "part", id),
      "Este objeto solo se transfiere mediante subasta.",
    );
    G.assert(
      baseOccupied(s, cid) + A.reserved(s, cid, "part") <
        s.companies.find((c) => c.id === cid).sparesCapacity,
      "El almacén está lleno o tiene una plaza comprometida en subasta.",
    );
    return buy.call(this, s, id, cid);
  };
  const sell = W.sell;
  W.sell = function (s, id, ...args) {
    const p = s.parts.find((p) => p.id === id);
    G.assert(
      !A.locked(s, "part", id) &&
        !G.Parts.definition(p?.definitionId)?.auctionOnly,
      "La pieza está consignada o es exclusiva: véndela desde Subastas.",
    );
    return sell.call(this, s, id, ...args);
  };
  const fit = W.fit;
  W.fit = function (s, car, p) {
    return A.locked(s, "part", p?.id)
      ? "Esta pieza está consignada en subasta."
      : fit.call(this, s, car, p);
  };
  const available = W.available;
  W.available = function (s, car, ...args) {
    G.assert(
      !A.locked(s, "car", car?.id),
      "El coche está consignado en una subasta.",
    );
    return available.call(this, s, car, ...args);
  };
  W.occupied = function (s, id = s.playerId) {
    return baseOccupied(s, id) + A.reserved(s, id, "part");
  };
  const locked = G.Market.locked;
  G.Market.locked = function (s, id) {
    return A.locked(s, "car", id) || locked.call(this, s, id);
  };
  const marketBuy = G.Market.buy;
  G.Market.buy = function (s, id, cid = s.playerId) {
    const c = s.companies.find((c) => c.id === cid);
    G.assert(
      !A.reserved(s, cid, "car") ||
        !c ||
        G.ownedCars(s, cid).length + A.reserved(s, cid, "car") < c.carCapacity,
      "El garaje está lleno o tiene una plaza comprometida en subasta.",
    );
    const result = marketBuy.call(this, s, id, cid);
    return result;
  };
  const register = G.Race.register;
  G.Race.register = function (s, event, driver, car, ...args) {
    G.assert(
      !A.active(s) && !A.locked(s, "car", car),
      "Cierra la sala de subasta o retira el coche consignado antes de inscribirte.",
    );
    return register.call(this, s, event, driver, car, ...args);
  };
  const practice = G.Practice.start;
  G.Practice.start = function (s, opts, ...args) {
    G.assert(
      !A.active(s) && !A.locked(s, "car", opts?.carId),
      "Cierra la subasta o retira el coche consignado antes de entrenar.",
    );
    return practice.call(this, s, opts, ...args);
  };
  const transact = G.Economy.transact;
  G.Economy.transact = function (s, id, amount, ...args) {
    const held = A.reserved(s, id);
    G.assert(
      !held ||
        amount >= 0 ||
        s.companies.find((c) => c.id === id).balance + amount >= held,
      "Ese dinero respalda tu puja vinculante en la subasta.",
    );
    return transact.call(this, s, id, amount, ...args);
  };
  const advance = G.Calendar.advance;
  G.Calendar.advance = function (s, ...args) {
    G.assert(
      !A.active(s),
      "Termina la subasta en vivo antes de avanzar el día.",
    );
    return advance.call(this, s, ...args);
  };
  const spec = G.Coachwork.spec;
  G.Coachwork.spec = function (s, car, installed = car.installed) {
    const v = spec.call(this, s, car, installed),
      d = this.defs(s, installed).find(
        (d) => d.slot === "shell" && d.auctionOnly,
      );
    if (d) v.exclusive = { accent: d.accent, maker: d.maker, serial: d.serial };
    return v;
  };
  const ai = W.aiCandidates;
  W.aiCandidates = function (s, c, budget, days, profile) {
    const rows = ai.call(this, s, c, budget, days, profile);
    if (
      !A.enabled(s) ||
      days <= 4 ||
      G.Facilities.workload(s, c.id) >= G.Facilities.bays(s, c.id)
    )
      return rows;
    for (const p of W.inventory(s, c.id).filter(
      (p) => !p.reservedFor && G.Parts.definition(p.definitionId).auctionOnly,
    )) {
      const d = G.Parts.definition(p.definitionId);
      if (d.labor > budget) continue;
      for (const car of G.ownedCars(s, c.id).filter(
        (car) =>
          !car.repair &&
          !G.Market.listed(s, car.id) &&
          !G.Market.locked(s, car.id),
      )) {
        if (W.fit(s, car, p)) continue;
        const v = W.configuration(s, car, { ...car.installed, [d.slot]: p.id }),
          gain =
            (v.hp / v.weight - car.hp / car.weight) * 120 +
            (v.grip - car.grip) * 0.45 +
            (v.brakes - car.brakes) * 0.2 +
            (v.reliability - car.reliability) * 0.2;
        if (gain < 1) continue;
        rows.push({
          action: "instalación de lote",
          utility: 60 + gain * profile.car,
          reason:
            "Aprovechar una pieza adjudicada, respetando compatibilidad y reserva de caja.",
          targetId: car.id,
          cost: d.labor,
          run: () => W.install(s, car.id, p.id, c.id),
        });
      }
    }
    return rows;
  };
  const create = G.createGame;
  G.createV90Game = create;
  G.createGame = (...args) => A.initialize(create(...args));
})();
