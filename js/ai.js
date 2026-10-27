"use strict";
(() => {
  const G = RCS;
  G.AI = {
    policies: {
      Conservadora: {
        reserve: 90,
        car: 0.8,
        driver: 0.8,
        training: 0.3,
        objective: "Mantener tres meses de gastos y competir sin descubiertos.",
      },
      Agresiva: {
        reserve: 35,
        car: 1.5,
        driver: 1.5,
        training: 0.6,
        objective:
          "Mejorar el ritmo de carrera sin gastar la reserva operativa.",
      },
      Desarrolladora: {
        reserve: 60,
        car: 1.15,
        driver: 0.7,
        training: 0.6,
        objective: "Recuperar coches usados y preparar una flota competitiva.",
      },
      Formadora: {
        reserve: 60,
        car: 0.7,
        driver: 1.1,
        training: 1.8,
        objective: "Desarrollar pilotos jóvenes con un salario sostenible.",
      },
      Prestigiosa: {
        reserve: 70,
        car: 1.1,
        driver: 1.4,
        training: 0.7,
        objective:
          "Incorporar talento contrastado y mejorar la reputación deportiva.",
      },
      Oportunista: {
        reserve: 65,
        car: 1.3,
        driver: 0.9,
        training: 0.4,
        objective:
          "Aprovechar activos infravalorados sin comprometer las nóminas.",
      },
    },
    policy(c) {
      return this.policies[c.personality] || this.policies.Conservadora;
    },
    budget(s, c) {
      const accrued = G.ownedDrivers(s, c.id).reduce(
        (n, d) => n + d.contract.accrued,
        0,
      );
      return Math.max(
        0,
        c.balance -
          accrued -
          (G.Companies.monthly(s, c.id) / 30) * this.policy(c).reserve -
          370,
      );
    },
    candidates(s, c) {
      const candidates = [],
        p = this.policy(c),
        money = this.budget(s, c),
        cars = G.ownedCars(s, c.id),
        drivers = G.ownedDrivers(s, c.id),
        lineup = G.Companies.lineup(s, c.id),
        next = G.nextEvent(s),
        days = next ? next.day - s.day : 365;
      const add = (action, utility, reason, targetId, cost, run) => {
        if (Number.isFinite(utility) && utility > 0)
          candidates.push({ action, utility, reason, targetId, cost, run });
      };
      // Un encargo crea ingresos por trabajo y ocupa el mismo taller usado para revisar coches.
      const workshopFree = !c.job && !cars.some((car) => car.repair);
      if (workshopFree && s.day - c.lastJob >= 7)
        add(
          "servicio",
          c.balance < G.Companies.monthly(s, c.id) * 2 ? 98 : 30,
          "Aprovechar el taller libre para financiar las próximas nóminas.",
          null,
          0,
          () => G.Economy.job(s, c.id),
        );
      candidates.push(...G.Workshop.aiCandidates(s, c, money, days, p));
      for (const car of cars) {
        if (G.Market.listed(s, car.id)) continue;
        if (
          workshopFree &&
          car.condition < 82 &&
          (car.condition < 55 || p.car >= 1)
        ) {
          const cost = G.Economy.repairQuote(car);
          if (c.balance >= cost + 370 && (money >= cost || !lineup.car))
            add(
              "revisión",
              car.condition < 55 ? 110 : 35 + (100 - car.condition) * p.car,
              "Recuperar el estado mecánico antes de competir.",
              car.id,
              cost,
              () => G.Economy.repair(s, car.id, c.id),
            );
        }
        if (
          workshopFree &&
          car.tires < 45 &&
          c.balance >= G.Workshop.tireCost(s, car) + 370
        )
          add(
            "neumáticos",
            car.tires < 20 ? 115 : 72,
            "El desgaste de neumáticos reduce el agarre de la alineación.",
            car.id,
            G.Workshop.tireCost(s, car),
            () => G.Economy.tires(s, car.id, c.id),
          );
      }
      const rankedCars = [...cars]
        .filter((car) => !G.Market.listed(s, car.id))
        .sort((a, b) => G.Companies.carRating(b) - G.Companies.carRating(a));
      for (const car of rankedCars)
        if (
          !car.repair &&
          !G.Market.locked(s, car.id) &&
          ((rankedCars.length > 1 && car !== rankedCars[0]) ||
            c.balance < G.Companies.monthly(s, c.id) * 0.8)
        ) {
          add(
            "venta",
            c.balance < 500 ? 130 : 67,
            "Liberar capital de una unidad secundaria o de una compañía en crisis.",
            car.id,
            0,
            () =>
              G.Market.list(
                s,
                car.id,
                Math.round(
                  G.Market.value(car) * (c.balance < 500 ? 0.75 : 0.93),
                ),
                c.id,
              ),
          );
        }
      if (cars.length < c.carCapacity)
        for (const l of s.market) {
          if (l.sellerId === c.id || l.price > money) continue;
          const car = s.cars.find((car) => car.id === l.carId);
          if (car.hp > 210 || car.condition < 45 || car.tires < 20) continue;
          const current = rankedCars[0],
            gain = current
              ? G.Companies.carRating(car) - G.Companies.carRating(current)
              : 30;
          const discount = 1 - l.price / G.Market.value(car);
          if (
            gain > 3 ||
            !current ||
            (p === this.policies.Oportunista && discount > 0.18)
          )
            add(
              "compra",
              !current ? 105 : 38 + gain * p.car + discount * 40,
              "Comparar rendimiento, precio y reserva antes de comprar una unidad real.",
              car.id,
              l.price,
              () => G.Market.buy(s, l.id, c.id),
            );
        }
      if (drivers.length < c.driverCapacity)
        for (const d of s.drivers) {
          if (
            d.companyId === c.id ||
            G.Market.locked(s, d.id) ||
            (d.lastTransfer !== null && s.day - d.lastTransfer < 60)
          )
            continue;
          const salary = G.Companies.salary(d),
            fee = G.Companies.fee(s, d),
            cost = fee + 300;
          if (cost > money || salary * 3 > money - cost) continue;
          const current = lineup.driver,
            gain = current
              ? G.Drivers.rating(d) - G.Drivers.rating(current)
              : 30;
          const youth = p === this.policies.Formadora && d.age < 24 ? 6 : 0;
          if (gain + youth < 5 && current) continue;
          if (d.companyId === s.playerId) {
            if (
              s.day - c.lastOffer >= 30 &&
              !s.transferOffers.some(
                (o) =>
                  o.buyerId === c.id &&
                  o.driverId === d.id &&
                  o.status === "pending",
              )
            )
              add(
                "oferta",
                22 + gain * p.driver,
                "Proponer un fichaje al jugador; la decisión final corresponde al propietario.",
                d.id,
                0,
                () => {
                  G.Companies.offer(s, d.id, c.id);
                  c.lastOffer = s.day;
                },
              );
          } else if (!d.companyId || G.Companies.willing(s, d)) {
            add(
              "fichaje",
              !current ? 120 : 40 + gain * p.driver + youth,
              "Cubrir una necesidad deportiva dentro del presupuesto salarial.",
              d.id,
              cost,
              () => {
                G.Companies.sign(s, d.id, c.id, salary, 12, 300);
                const others = G.ownedDrivers(s, c.id).filter(
                  (x) => x.id !== d.id,
                );
                for (const old of others)
                  if (G.Drivers.rating(old) < G.Drivers.rating(d))
                    old.transferListed = true;
              },
            );
          }
        }
      for (const d of drivers) {
        const other = drivers.some(
          (x) => x !== d && G.Drivers.rating(x) > G.Drivers.rating(d),
        );
        if (
          other &&
          !G.Market.locked(s, d.id) &&
          c.balance < G.Companies.monthly(s, c.id) * 2
        ) {
          const cost = Math.round(d.contract.salary + d.contract.accrued);
          if (c.balance >= cost)
            add(
              "rescisión",
              85,
              "Reducir el coste de un asiento secundario sin dejar el equipo sin piloto.",
              d.id,
              cost,
              () => G.Companies.release(s, d.id, c.id),
            );
        }
        const shouldTrain =
          p.training > 1 && d.age < 25 && money > 1000 && days > 10;
        const type = shouldTrain
          ? d.stats.pace < d.stats.control
            ? "pace"
            : "control"
          : null;
        if (d.training !== type)
          add(
            "entrenamiento",
            shouldTrain ? 40 * p.training : 80,
            shouldTrain
              ? "Asignar formación a un joven según sus carencias observables."
              : "Descansar y liberar presupuesto ante una prueba o una reserva insuficiente.",
            d.id,
            0,
            () => (d.training = type),
          );
      }
      return candidates.sort(
        (a, b) =>
          b.utility - a.utility ||
          a.action.localeCompare(b.action) ||
          String(a.targetId).localeCompare(String(b.targetId)),
      );
    },
    daily(s) {
      if (s.race) return;
      G.Companies.daily(s);
      for (const c of s.companies.filter(
        (c) => c.id !== s.playerId && c.status === "active",
      )) {
        const urgent = !G.Companies.lineup(s, c.id).driver || c.balance < 0;
        if (s.day < c.nextDecision && !urgent) continue;
        const best = this.candidates(s, c)[0];
        if (best) {
          best.run();
          G.Companies.log(
            s,
            c,
            best.action,
            best.reason,
            best.targetId,
            best.cost,
          );
        }
        c.nextDecision = s.day + 3;
      }
    },
  };
})();
