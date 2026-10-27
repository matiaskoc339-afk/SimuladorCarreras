"use strict";
(() => {
  const G = RCS;
  G.Economy = {
    transact(s, companyId, amount, category, label) {
      const c = s.companies.find((c) => c.id === companyId);
      G.assert(c && Number.isFinite(amount), "Transacción inválida.");
      amount = Math.round(amount * 100) / 100;
      c.balance = Math.round((c.balance + amount) * 100) / 100;
      c.ledger.unshift({
        id: G.uid(s, "transaction"),
        day: s.day,
        amount,
        category,
        label,
      });
      if (c.ledger.length > 600) c.ledger.length = 600;
      if (companyId === s.playerId)
        s.totals[amount > 0 ? "income" : "expense"] += Math.abs(amount);
    },
    spend(s, amount, category, label) {
      G.ensurePlayable(s);
      G.assert(Number.isFinite(amount) && amount >= 0, "Importe inválido.");
      G.assert(G.player(s).balance >= amount, "No tienes fondos suficientes.");
      this.transact(s, s.playerId, -amount, category, label);
    },
    monthly(s) {
      const p = G.player(s);
      return (
        18 * 30 +
        G.ownedDrivers(s).reduce(
          (n, d) => n + (d.contract?.salary || 0) + (d.training ? 18 * 30 : 0),
          0,
        )
      );
    },
    repairQuote(car) {
      return Math.round((100 - car.condition) * 24 + 120);
    },
    repair(s, id) {
      const car = s.cars.find((c) => c.id === id && c.companyId === s.playerId);
      G.assert(car, "Vehículo no disponible.");
      G.assert(
        !s.race && !s.job && !G.ownedCars(s).some((c) => c.repair),
        "El taller está ocupado.",
      );
      G.assert(car.condition < 99, "El coche ya está en buen estado.");
      const cost = this.repairQuote(car);
      this.spend(s, cost, "Taller", `Revisión de ${car.model}`);
      car.repair = { end: s.day + 2, cost };
    },
    tires(s, id) {
      const car = s.cars.find((c) => c.id === id && c.companyId === s.playerId);
      G.assert(car && !car.repair && !s.race, "Vehículo no disponible.");
      G.assert(car.tires < 99, "Los neumáticos ya están nuevos.");
      this.spend(s, 160, "Taller", "Juego de neumáticos de calle");
      car.tires = 100;
      car.history.unshift({ day: s.day, type: "Neumáticos nuevos" });
    },
    job(s) {
      G.assert(
        !s.race && !s.job && !G.ownedCars(s).some((c) => c.repair),
        "El taller está ocupado.",
      );
      G.assert(
        s.day - s.lastJob >= 7,
        "El siguiente encargo estará disponible en " +
          (7 - (s.day - s.lastJob)) +
          " días.",
      );
      G.ensurePlayable(s);
      s.job = { end: s.day + 3, net: 360 };
      s.lastJob = s.day;
    },
    assess(s) {
      for (const c of s.companies.filter((c) => c.status === "active")) {
        if (c.balance < 0) {
          c.debtDays++;
          if (c.debtDays === 1)
            G.news(
              s,
              "Finanzas",
              `${c.name} entra en descubierto.`,
              "La administración concede 14 días consecutivos para recuperar un saldo positivo. Los encargos de taller pueden ayudar.",
              "finance",
              c.id,
            );
          if (c.debtDays >= 14) {
            c.status = "bankrupt";
            if (c.id === s.playerId) s.status = "bankrupt";
            G.news(
              s,
              "Finanzas",
              `${c.name} se declara en bancarrota.`,
              "Ha agotado su margen para afrontar las obligaciones. La compañía no podrá volver a participar. Su historial se conserva.",
              "finance",
              c.id,
            );
          }
        } else c.debtDays = 0;
      }
    },
    daily(s) {
      const date = G.dateAt(s.day);
      for (const c of s.companies.filter((c) => c.status === "active")) {
        this.transact(
          s,
          c.id,
          -18,
          "Operación",
          "Alquiler, herramientas y suministros",
        );
        for (const d of G.ownedDrivers(s, c.id)) {
          if (d.contract) {
            d.contract.accrued =
              (d.contract.accrued || 0) + d.contract.salary / 30;
            if (date.getUTCDate() === 1) {
              this.transact(
                s,
                c.id,
                -d.contract.accrued,
                "Salarios",
                `Nómina · ${d.name}`,
              );
              d.contract.accrued = 0;
            }
          }
        }
      }
      for (const car of s.cars)
        if (car.repair && s.day >= car.repair.end) {
          car.condition = 100;
          car.history.unshift({ day: s.day, type: "Revisión completa" });
          car.repair = null;
          G.news(
            s,
            "Taller",
            `${car.brand} ${car.model}: revisión terminada.`,
            "El vehículo recupera su estado mecánico. Ya está disponible para competir.",
            "garage",
            car.id,
          );
        }
      if (s.job && s.day >= s.job.end) {
        this.transact(
          s,
          s.playerId,
          s.job.net,
          "Servicios",
          "Encargo de mantenimiento local (neto)",
        );
        s.job = null;
        G.news(
          s,
          "Finanzas",
          "Encargo de taller entregado.",
          "El cliente ha abonado $360 netos, descontados los consumibles.",
          "finance",
        );
      }
    },
  };
})();
