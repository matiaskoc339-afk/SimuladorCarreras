"use strict";
(() => {
  const G = RCS;
  G.Market = {
    value(car) {
      return Math.round(
        car.value *
          (0.4 + car.condition * 0.006) *
          G.clamp(1.05 - car.km / 500000, 0.65, 1) +
          car.wins * 70 +
          (car.upgradeValue || 0),
      );
    },
    listed(s, carId) {
      return s.market.find((l) => l.carId === carId);
    },
    locked(s, id) {
      return (
        !!s.race ||
        [G.Practice.active(s)?.carId, G.Practice.active(s)?.driverId].includes(
          id,
        ) ||
        s.season.events.some(
          (e) =>
            e.status === "scheduled" &&
            (e.entry?.carId === id || e.entry?.driverId === id),
        )
      );
    },
    list(s, carId, price, sellerId = s.playerId) {
      const car = s.cars.find(
        (c) => c.id === carId && c.companyId === sellerId,
      );
      const seller = s.companies.find((c) => c.id === sellerId);
      G.assert(
        car &&
          seller &&
          (seller.status === "active" || sellerId !== s.playerId),
        "El vendedor no dispone del coche.",
      );
      if (sellerId === s.playerId) G.ensurePlayable(s);
      G.assert(
        !this.locked(s, carId) && !car.repair,
        "Retira primero la inscripción o termina la revisión/carrera.",
      );
      G.assert(!this.listed(s, carId), "Este coche ya está anunciado.");
      const value = this.value(car);
      G.assert(
        Number.isInteger(price) &&
          price >= Math.round(value * 0.5) &&
          price <= Math.round(value * 1.5),
        "El precio debe estar entre el 50 % y el 150 % de su valoración.",
      );
      const listing = {
        id: G.uid(s, "listing"),
        carId,
        sellerId,
        price,
        day: s.day,
      };
      s.market.push(listing);
      G.news(
        s,
        "Mercado",
        `${seller.name} pone a la venta su ${car.brand} ${car.model}.`,
        `Una unidad identificada como ${car.id}, con ${Math.round(car.km)} km, se ofrece por $${price}. El vendedor conserva el coche hasta que se confirme la compra.`,
        "market",
        carId,
      );
      return listing;
    },
    withdraw(s, listingId, sellerId = s.playerId) {
      const l = s.market.find((l) => l.id === listingId);
      G.assert(
        l && l.sellerId === sellerId && !s.race,
        "El anuncio ya no está disponible o no te pertenece.",
      );
      s.market = s.market.filter((x) => x.id !== listingId);
    },
    buy(s, listingId, buyerId = s.playerId) {
      G.assert(!s.race, "Termina la carrera antes de comprar.");
      const l = s.market.find((l) => l.id === listingId),
        buyer = s.companies.find((c) => c.id === buyerId);
      G.assert(
        l && buyer?.status === "active",
        "La oferta o la compañía ya no están disponibles.",
      );
      const car = s.cars.find((c) => c.id === l.carId),
        seller = s.companies.find((c) => c.id === l.sellerId);
      G.assert(
        car && car.companyId === l.sellerId && l.sellerId !== buyerId,
        "La propiedad del vehículo ha cambiado.",
      );
      G.assert(
        !this.locked(s, car.id) && !car.repair,
        "El coche no está disponible para una transferencia.",
      );
      G.assert(
        G.ownedCars(s, buyerId).length < buyer.carCapacity,
        "No hay plazas libres en el garaje.",
      );
      G.assert(
        buyer.balance >= l.price,
        "No hay fondos suficientes para la compra.",
      );
      // Todas las condiciones se validan antes del primer movimiento.
      G.Economy.transact(
        s,
        buyerId,
        -l.price,
        "Mercado",
        `Compra · ${car.brand} ${car.model} · ${car.id}`,
      );
      if (seller)
        G.Economy.transact(
          s,
          seller.id,
          l.price,
          "Mercado",
          `Venta a ${buyer.name} · ${car.id}`,
        );
      else s.dealer.balance += l.price;
      const from = l.sellerId;
      G.Workshop.transferParts(s, car, buyerId);
      car.companyId = buyerId;
      car.color = buyer.color;
      car.history.unshift({
        day: s.day,
        type: `Traspaso de ${seller?.name || "Club Usados"} a ${buyer.name}`,
      });
      car.history.length = Math.min(30, car.history.length);
      s.market = s.market.filter((x) => x.id !== l.id);
      s.trades.unshift({
        id: G.uid(s, "trade"),
        day: s.day,
        kind: "car",
        entityId: car.id,
        from,
        to: buyerId,
        price: l.price,
      });
      s.trades.length = Math.min(80, s.trades.length);
      G.news(
        s,
        "Mercado",
        `${buyer.name} incorpora un ${car.brand} ${car.model}.`,
        `Ha pagado $${l.price} a ${seller?.name || "Club Usados"}. La unidad ${car.id} sale del mercado y pasa a su garaje, con su kilometraje e historial intactos.`,
        "car",
        car.id,
      );
      return car;
    },
  };
})();
