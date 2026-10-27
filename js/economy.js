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
      return this.spendCompany(s, s.playerId, amount, category, label);
    },
    spendCompany(s, companyId, amount, category, label) {
      const company = s.companies.find((c) => c.id === companyId);
      G.assert(company?.status === "active", "La compañía no está activa.");
      if (companyId === s.playerId) G.ensurePlayable(s);
      G.assert(Number.isFinite(amount) && amount >= 0, "Importe inválido.");
      G.assert(company.balance >= amount, "No tienes fondos suficientes.");
      this.transact(s, companyId, -amount, category, label);
    },
    monthly(s) {
      return G.Companies.monthly(s, s.playerId);
    },
    repairQuote(car) {
      return Math.round((100 - car.condition) * 24 + 120);
    },
    repair(s, id, companyId = s.playerId) {
      const car = s.cars.find((c) => c.id === id && c.companyId === companyId);
      G.assert(car, "Vehículo no disponible.");
      G.assert(
        !G.Market.listed(s, id),
        "Retira el anuncio antes de revisar el coche.",
      );
      G.assert(
        !s.race &&
          !(companyId === s.playerId
            ? s.job
            : s.companies.find((c) => c.id === companyId)?.job) &&
          !G.ownedCars(s, companyId).some((c) => c.repair),
        "El taller está ocupado.",
      );
      G.assert(car.condition < 99, "El coche ya está en buen estado.");
      const cost = this.repairQuote(car);
      this.spendCompany(
        s,
        companyId,
        cost,
        "Taller",
        `Revisión de ${car.model}`,
      );
      car.repair = { end: s.day + 2, cost };
    },
    tires(s, id, companyId = s.playerId) {
      const car = s.cars.find((c) => c.id === id && c.companyId === companyId);
      G.assert(car && !car.repair && !s.race, "Vehículo no disponible.");
      G.assert(
        !G.Market.listed(s, id),
        "Retira el anuncio antes de cambiar neumáticos.",
      );
      G.assert(car.tires < 99, "Los neumáticos ya están nuevos.");
      this.spendCompany(
        s,
        companyId,
        160,
        "Taller",
        "Juego de neumáticos de calle",
      );
      car.tires = 100;
      car.history.unshift({ day: s.day, type: "Neumáticos nuevos" });
    },
    job(s, companyId = s.playerId) {
      const c = s.companies.find((c) => c.id === companyId);
      G.assert(c?.status === "active", "La compañía no está activa.");
      G.assert(
        !s.race &&
          !(companyId === s.playerId ? s.job : c.job) &&
          !G.ownedCars(s, companyId).some((car) => car.repair),
        "El taller está ocupado.",
      );
      G.assert(
        s.day - (companyId === s.playerId ? s.lastJob : c.lastJob) >= 7,
        "El siguiente encargo estará disponible en unos días.",
      );
      if (companyId === s.playerId) {
        s.job = { end: s.day + 3, net: 360 };
        s.lastJob = s.day;
      } else {
        c.job = { end: s.day + 3, net: 360 };
        c.lastJob = s.day;
      }
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
            G.Companies.bankrupt(s, c);
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
            "car",
            car.id,
          );
        }
      for (const c of s.companies.filter((c) => c.status === "active")) {
        const job = c.id === s.playerId ? s.job : c.job;
        if (job && s.day >= job.end) {
          this.transact(
            s,
            c.id,
            job.net,
            "Servicios",
            "Encargo de mantenimiento local (neto)",
          );
          if (c.id === s.playerId) s.job = null;
          else c.job = null;
          G.news(
            s,
            "Finanzas",
            `${c.name} entrega un encargo de taller.`,
            "El cliente ha abonado $360 netos, descontados los consumibles.",
            c.id === s.playerId ? "finance" : "companies",
            c.id,
          );
        }
      }
    },
  };
})();
