"use strict";
(() => {
  const G = RCS;
  G.World = {
    initialize(s) {
      const owners = [
        "Marina Cortés",
        "Daniel Pardo",
        "Valeria Montes",
        "Hugo Leal",
        "Eva Soler",
        "Álvaro Luna",
        "Clara Vidal",
      ];
      s.dealer = { name: "Club Usados", balance: 0 };
      s.market = [];
      s.trades = [];
      s.transferOffers = [];
      for (const [i, c] of s.companies.entries()) {
        c.driverCapacity ??= 2;
        c.carCapacity ??= 2;
        c.facilities ??= { garage: 1, workshop: 1 };
        c.owner =
          c.id === s.playerId
            ? "Tu dirección"
            : owners[(i - 1 + owners.length) % owners.length];
        c.founded = c.id === s.playerId ? 0 : G.dayOf(2025, 0, 1);
        c.decisions = [];
        c.nextDecision = s.day + 1 + (i % 3);
        c.lastJob = -7;
        c.job = null;
        c.lastOffer = -60;
      }
      for (const d of s.drivers) {
        d.transferListed = false;
        d.lastTransfer = null;
      }
      // Stock finito: ninguna unidad se fabrica al comprar. La migración conserva el RNG.
      const rng = s.rng;
      s.rng = (s.seed ^ 0x57ca021) >>> 0;
      for (let i = 0; i < 6; i++) {
        const car = G.makeCar(
          s,
          null,
          i % Math.min(4, G.Data.models.length),
          ["#a3b7a5", "#a48e7a", "#8398b5", "#ab9970"][i % 4],
        );
        car.condition = G.integer(s, 62, 97);
        car.tires = G.integer(s, 55, 100);
        s.cars.push(car);
        s.market.push({
          id: G.uid(s, "listing"),
          carId: car.id,
          sellerId: null,
          price: G.Market.value(car),
          day: s.day,
        });
      }
      s.rng = rng;
      s.version = 2;
      return s;
    },
    validate(s) {
      G.assert(
        s.dealer && Number.isFinite(s.dealer.balance) && s.dealer.balance >= 0,
        "Finanzas del proveedor inválidas.",
      );
      for (const c of s.companies) {
        G.assert(
          Number.isInteger(c.carCapacity) &&
            c.carCapacity >= 1 &&
            c.carCapacity <= 10 &&
            Number.isInteger(c.driverCapacity) &&
            c.driverCapacity >= 1 &&
            c.driverCapacity <= 10,
          "Capacidad de instalaciones inválida.",
        );
        G.assert(
          G.ownedCars(s, c.id).length <= c.carCapacity &&
            G.ownedDrivers(s, c.id).length <= c.driverCapacity,
          "Inventario por encima de su capacidad.",
        );
        G.assert(
          typeof c.owner === "string" &&
            Array.isArray(c.decisions) &&
            c.decisions.length <= 16 &&
            Number.isInteger(c.nextDecision) &&
            Number.isInteger(c.lastJob) &&
            Number.isInteger(c.lastOffer),
          "Gestión de compañía inválida.",
        );
        for (const d of c.decisions)
          G.assert(
            Number.isInteger(d.day) &&
              typeof d.action === "string" &&
              typeof d.reason === "string" &&
              Number.isFinite(d.cost) &&
              d.cost >= 0 &&
              (d.targetId === null ||
                s.cars.some((c) => c.id === d.targetId) ||
                s.drivers.some((p) => p.id === d.targetId)),
            "Decisión empresarial inválida.",
          );
        if (c.job)
          G.assert(
            Number.isInteger(c.job.end) &&
              c.job.net === (G.Challenge.enabled(s) ? 420 : 360),
            "Encargo empresarial inválido.",
          );
      }
      const cars = new Set();
      for (const l of s.market) {
        const car = s.cars.find((c) => c.id === l.carId);
        G.assert(
          car &&
            !cars.has(l.carId) &&
            car.companyId === l.sellerId &&
            (l.sellerId === null ||
              s.companies.some((c) => c.id === l.sellerId)) &&
            Number.isInteger(l.price) &&
            l.price > 0 &&
            Number.isInteger(l.day) &&
            !car.repair,
          "Anuncio o propiedad del mercado inválidos.",
        );
        G.assert(
          !s.season.events.some(
            (e) => e.status === "scheduled" && e.entry?.carId === car.id,
          ),
          "Un coche inscrito no puede estar a la venta.",
        );
        cars.add(l.carId);
      }
      for (const car of s.cars)
        G.assert(
          car.companyId !== null ||
            cars.has(car.id) ||
            G.Auctions?.externalOwner(s, car.auctionOwnerId),
          "Unidad sin propietario ni anuncio.",
        );
      for (const d of s.drivers)
        G.assert(
          typeof d.transferListed === "boolean" &&
            (d.lastTransfer === null ||
              (Number.isInteger(d.lastTransfer) && d.lastTransfer <= s.day)),
          "Disponibilidad de piloto inválida.",
        );
      for (const o of s.transferOffers)
        G.assert(
          s.drivers.some((d) => d.id === o.driverId) &&
            s.companies.some(
              (c) => c.id === o.buyerId && c.id !== s.playerId,
            ) &&
            [
              "pending",
              "accepted",
              "rejected",
              "expired",
              "withdrawn",
            ].includes(o.status) &&
            Number.isInteger(o.expires) &&
            Number.isInteger(o.day) &&
            Number.isInteger(o.fee) &&
            o.fee >= 0 &&
            Number.isInteger(o.salary) &&
            o.salary >= 200 &&
            Number.isInteger(o.bonus) &&
            o.bonus >= 0 &&
            [6, 12, 24].includes(o.months),
          "Oferta de traspaso inválida.",
        );
      for (const t of s.trades)
        G.assert(
          ["car", "driver"].includes(t.kind) &&
            (t.kind === "car" ? s.cars : s.drivers).some(
              (x) => x.id === t.entityId,
            ) &&
            Number.isInteger(t.day) &&
            Number.isFinite(t.price) &&
            t.price >= 0 &&
            s.companies.some((c) => c.id === t.to) &&
            (t.from === null || s.companies.some((c) => c.id === t.from)),
          "Historial de transacciones inválido.",
        );
    },
    migrate(s) {
      if (s.version === 3) return s;
      G.assert([1, 2].includes(s.version), "Versión incompatible.");
      if (s.version === 1) this.initialize(s);
      return G.Workshop.initialize(s);
    },
  };
})();
