"use strict";
(() => {
  const G = RCS;
  G.Companies = {
    monthly(s, id) {
      if (s.companies.find((c) => c.id === id)?.status !== "active") return 0;
      return (
        540 +
        G.Facilities.upkeep(s, id) * 30 +
        G.Staff.monthly(s, id) +
        G.Contracts.nextPayments(s, id) +
        G.ownedDrivers(s, id).reduce(
          (n, d) => n + G.Pay.monthly(d.contract) + (d.training ? 540 : 0),
          0,
        )
      );
    },
    carRating(car) {
      return (
        (car.hp / car.weight) * 120 +
        car.grip * 0.45 +
        car.brakes * 0.2 +
        car.condition * 0.25 +
        car.tires * 0.05
      );
    },
    lineup(s, id) {
      const normal = {
        driver: G.ownedDrivers(s, id)
          .filter(
            (d) => d.contract && d.fatigue < 90 && G.Professionals.fit(s, d.id),
          )
          .sort(
            (a, b) =>
              G.Drivers.rating(b) -
                b.fatigue * 0.12 -
                (G.Drivers.rating(a) - a.fatigue * 0.12) ||
              a.id.localeCompare(b.id),
          )[0],
        car: G.ownedCars(s, id)
          .filter(
            (c) =>
              !c.repair &&
              !G.Market.listed(s, c.id) &&
              c.hp <= 210 &&
              G.Workshop.ready(c),
          )
          .sort(
            (a, b) =>
              this.carRating(b) - this.carRating(a) || a.id.localeCompare(b.id),
          )[0],
      };
      return G.Contracts.preferred(s, id, normal);
    },
    log(s, c, action, reason, targetId = null, cost = 0) {
      c.decisions.unshift({ day: s.day, action, reason, targetId, cost });
      c.decisions.length = Math.min(16, c.decisions.length);
    },
    fee(s, d) {
      if (d.contract?.clauses)
        return Math.round(
          G.Pay.monthly(d.contract) * d.contract.clauses.releaseMonths,
        );
      return d.contract
        ? Math.round(
            G.Pay.monthly(d.contract) *
              G.clamp((d.contract.end - s.day) / 90, 1, 3),
          )
        : 0;
    },
    willing(s, d) {
      if (
        !d.companyId ||
        d.companyId === s.playerId ||
        G.Market.locked(s, d.id) ||
        (d.lastTransfer !== null && s.day - d.lastTransfer < 60)
      )
        return false;
      const c = s.companies.find((c) => c.id === d.companyId);
      return (
        c.status === "active" &&
        (d.transferListed ||
          G.ownedDrivers(s, c.id).length > 1 ||
          c.balance < this.monthly(s, c.id) * 1.2)
      );
    },
    salary(d) {
      return Math.round(Math.max(d.ask, (d.contract?.salary || 0) * 1.1));
    },
    sign(
      s,
      id,
      buyerId,
      salary,
      months = 12,
      bonus = 0,
      consent = false,
      agreedFee = null,
    ) {
      const d = s.drivers.find((d) => d.id === id),
        buyer = s.companies.find((c) => c.id === buyerId),
        seller = s.companies.find((c) => c.id === d?.companyId);
      G.assert(
        !s.race && d && buyer?.status === "active" && d.companyId !== buyerId,
        "El fichaje ya no está disponible.",
      );
      G.assert(
        Number.isInteger(salary) &&
          salary >= this.salary(d) &&
          salary <= 10000 &&
          G.Pay.durations(s).includes(months) &&
          Number.isInteger(bonus) &&
          bonus >= 0 &&
          bonus <= 5000,
        "El piloto no acepta estas condiciones.",
      );
      G.assert(
        !G.Market.locked(s, d.id),
        "El piloto está inscrito. Retira esa inscripción antes de traspasarlo.",
      );
      G.assert(
        G.ownedDrivers(s, buyerId).length < buyer.driverCapacity,
        "La plantilla está completa.",
      );
      G.assert(
        !seller || (seller.id === s.playerId ? consent : this.willing(s, d)),
        "Su compañía no acepta un traspaso.",
      );
      G.assert(
        G.Professionals.available(s, d),
        "Piloto no disponible médicamente o currículum caducado.",
      );
      G.Challenge.requireDriver(s, d, buyerId);
      const fee = agreedFee ?? this.fee(s, d),
        cost = fee + bonus;
      G.assert(
        Number.isInteger(fee) && fee >= 0 && Number.isFinite(cost),
        "Compensación inválida.",
      );
      G.assert(
        buyer.balance >= cost,
        "La compañía compradora no puede cubrir el traspaso y la prima.",
      );
      if (seller) G.Contracts.settlePromise(s, d);
      const from = d.companyId;
      if (cost)
        G.Economy.transact(
          s,
          buyerId,
          -cost,
          "Contratos",
          `Fichaje · ${d.name} · traspaso $${fee} + prima $${bonus}`,
        );
      if (seller) {
        G.Economy.transact(
          s,
          seller.id,
          fee,
          "Traspasos",
          `Compensación por ${d.name} a ${buyer.name}`,
        );
        if (d.contract.accrued)
          G.Economy.transact(
            s,
            seller.id,
            -d.contract.accrued,
            "Salarios",
            `Liquidación de traspaso · ${d.name}`,
          );
      }
      d.companyId = buyerId;
      if (G.Professionals.care(s, d.id))
        G.Professionals.care(s, d.id).recruited = true;
      d.contract = {
        salary,
        ...G.Pay.fields(d),
        bonus,
        start: s.day,
        end: s.day + months * 30,
        role: "principal",
        accrued: 0,
      };
      d.training = null;
      d.transferListed = false;
      d.lastTransfer = s.day;
      d.memory.push({
        day: s.day,
        event: `Fichaje de ${seller?.name || "agencia libre"} a ${buyer.name}`,
      });
      d.memory.length = Math.min(30, d.memory.length);
      delete s.negotiations[id];
      for (const o of s.transferOffers)
        if (o.driverId === id && o.status === "pending") o.status = "withdrawn";
      s.trades.unshift({
        id: G.uid(s, "trade"),
        day: s.day,
        kind: "driver",
        entityId: id,
        from,
        to: buyerId,
        price: fee,
      });
      s.trades.length = Math.min(80, s.trades.length);
      G.news(
        s,
        "Fichajes",
        `${d.name} ficha por ${buyer.name}.`,
        `${seller ? "Llega de " + seller.name + " por $" + fee + " de compensación." : "Firma como agente libre."} Percibirá $${salary}${G.Pay.daily(d) ? "/día" : " al mes"} y una prima de $${bonus}. Se ha conservado su historial deportivo.`,
        "driver",
        id,
      );
      return d;
    },
    offer(s, driverId, buyerId) {
      const d = s.drivers.find(
          (d) => d.id === driverId && d.companyId === s.playerId,
        ),
        buyer = s.companies.find((c) => c.id === buyerId);
      G.assert(
        d &&
          buyer &&
          buyerId !== s.playerId &&
          buyer.status === "active" &&
          !s.race &&
          !G.Market.locked(s, d.id),
        "No se puede presentar esta oferta.",
      );
      G.assert(
        !s.transferOffers.some(
          (o) =>
            o.driverId === driverId &&
            o.buyerId === buyerId &&
            o.status === "pending",
        ),
        "Ya existe una oferta pendiente.",
      );
      G.assert(
        G.ownedDrivers(s, buyerId).length < buyer.driverCapacity &&
          buyer.balance >= this.fee(s, d) + 300,
        "El comprador no puede financiar esta oferta.",
      );
      const o = {
        id: G.uid(s, "offer"),
        driverId,
        buyerId,
        fee: this.fee(s, d),
        salary: this.salary(d),
        months: 12,
        bonus: 300,
        day: s.day,
        expires: s.day + 7,
        status: "pending",
      };
      s.transferOffers.unshift(o);
      s.transferOffers.length = Math.min(30, s.transferOffers.length);
      G.news(
        s,
        "Fichajes",
        `${buyer.name} presenta una oferta por ${d.name}.`,
        `Ofrece una compensación de $${o.fee}. Tu compañía decide hasta el ${G.dateAt(o.expires).toISOString().slice(0, 10)}; el piloto no cambiará de equipo sin tu consentimiento.`,
        "team",
        driverId,
      );
      return o;
    },
    resolve(s, id, accept) {
      G.ensurePlayable(s);
      const o = s.transferOffers.find((o) => o.id === id),
        d = s.drivers.find((d) => d.id === o?.driverId);
      G.assert(
        o?.status === "pending" &&
          o.expires >= s.day &&
          d?.companyId === s.playerId,
        "La oferta ha vencido o el piloto ya no te pertenece.",
      );
      if (!accept) {
        o.status = "rejected";
        return;
      }
      // Se usa la compensación acordada; su cuantía no depende de la fecha de aceptación.
      this.sign(s, d.id, o.buyerId, o.salary, o.months, o.bonus, true, o.fee);
      o.status = "accepted";
    },
    release(s, id, companyId) {
      const d = s.drivers.find((d) => d.id === id && d.companyId === companyId),
        c = s.companies.find((c) => c.id === companyId);
      G.assert(
        d && c && companyId !== s.playerId && !G.Market.locked(s, id),
        "No se puede rescindir este contrato.",
      );
      const cost = G.Drivers.releaseQuote(d);
      G.assert(
        c.balance >= cost,
        "Fondos insuficientes para la indemnización.",
      );
      G.Economy.transact(s, c.id, -cost, "Contratos", `Rescisión · ${d.name}`);
      G.Contracts.settlePromise(s, d);
      d.companyId = null;
      d.contract = null;
      d.training = null;
      d.transferListed = false;
      G.news(
        s,
        "Fichajes",
        `${c.name} rescinde el contrato de ${d.name}.`,
        `Abona $${cost} de indemnización y nóminas. El piloto vuelve a la agencia libre.`,
        "driver",
        id,
      );
    },
    daily(s) {
      for (const o of s.transferOffers.filter((o) => o.status === "pending")) {
        const d = s.drivers.find((d) => d.id === o.driverId),
          buyer = s.companies.find((c) => c.id === o.buyerId);
        if (s.day > o.expires) o.status = "expired";
        else if (
          d?.companyId !== s.playerId ||
          buyer.status !== "active" ||
          buyer.balance < o.fee + o.bonus
        )
          o.status = "withdrawn";
      }
    },
    bankrupt(s, c) {
      G.Staff.bankrupt(s, c.id);
      if (G.Facilities.site(s, c.id)?.project)
        G.Facilities.cancel(s, c.id, true);
      G.Contracts.bankrupt(s, c.id);
      for (const d of G.ownedDrivers(s, c.id)) {
        G.Contracts.settlePromise(s, d);
        if (d.contract.accrued)
          G.Economy.transact(
            s,
            c.id,
            -d.contract.accrued,
            "Salarios",
            `Obligación pendiente · ${d.name}`,
          );
        d.companyId = null;
        d.contract = null;
        d.training = null;
        d.transferListed = false;
      }
      if (c.id !== s.playerId)
        for (const car of G.ownedCars(s, c.id)) {
          if (car.repair?.partId) {
            const p = s.parts.find((p) => p.id === car.repair.partId);
            if (p) p.reservedFor = null;
          }
          car.repair = null;
          if (!G.Market.listed(s, car.id))
            G.Market.list(
              s,
              car.id,
              Math.round(G.Market.value(car) * 0.65),
              c.id,
            );
        }
      this.daily(s);
    },
  };
})();
