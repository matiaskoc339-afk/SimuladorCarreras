"use strict";
(() => {
  const G = RCS,
    stats = [
      "pace",
      "brakes",
      "control",
      "overtake",
      "defense",
      "consistency",
      "weather",
      "tires",
      "stamina",
      "focus",
      "discipline",
      "teamwork",
    ];
  G.Drivers = {
    stats,
    labels: {
      pace: "Velocidad",
      brakes: "Frenada",
      control: "Control",
      overtake: "Adelantamiento",
      defense: "Defensa",
      consistency: "Consistencia",
      weather: "Adaptación",
      tires: "Neumáticos",
      stamina: "Resistencia",
      focus: "Concentración",
      discipline: "Disciplina",
      teamwork: "Equipo",
    },
    generate(s, companyId) {
      const trait = G.integer(s, 0, 3),
        age = G.integer(s, 18, 29),
        base = G.integer(s, 39, 53);
      const d = {
        id: G.uid(s, "driver"),
        name:
          G.Data.firstNames[G.integer(s, 0, 15)] +
          " " +
          G.Data.lastNames[G.integer(s, 0, 11)],
        age,
        nation: G.Data.nations[G.integer(s, 0, 5)],
        companyId,
        trait,
        stats: {},
        potential: G.integer(s, 66, 92),
        experience: G.integer(s, 0, 3),
        morale: 75,
        fatigue: 0,
        training: null,
        contract: null,
        memory: [],
        starts: 0,
        wins: 0,
        points: 0,
        transferListed: false,
        lastTransfer: null,
      };
      stats.forEach(
        (k) =>
          (d.stats[k] = G.clamp(
            base + G.integer(s, -10, 13) + (G.Data.traits[trait][k] || 0),
            25,
            80,
          )),
      );
      d.ask = Math.round((460 + this.rating(d) * 3) / 10) * 10;
      return d;
    },
    rating(d) {
      return Math.round(
        (d.stats.pace +
          d.stats.control +
          d.stats.brakes +
          d.stats.consistency) /
          4,
      );
    },
    offer(s, id, salary, months, bonus = 0, terms = undefined) {
      G.ensurePlayable(s);
      const d = s.drivers.find((d) => d.id === id);
      G.assert(d && !d.companyId, "Este piloto ya no está disponible.");
      G.assert(!s.race, "Termina la carrera antes de negociar.");
      G.assert(
        G.ownedDrivers(s).length < G.player(s).driverCapacity,
        "La plantilla está completa (2 plazas).",
      );
      G.assert(
        Number.isInteger(salary) && salary >= 200 && salary <= 10000,
        "Salario inválido.",
      );
      G.assert(
        [6, 12, 24].includes(months) &&
          Number.isInteger(bonus) &&
          bonus >= 0 &&
          bonus <= 5000,
        "Condiciones contractuales inválidas.",
      );
      const old = s.negotiations[id];
      G.assert(
        !old || old.cooldown <= s.day,
        "El representante pide esperar " +
          ((old?.cooldown || s.day) - s.day) +
          " días.",
      );
      const clauses =
        terms === undefined ? null : G.Contracts.driverTerms(s, months, terms);
      const min = G.Contracts.salaryMinimum(d, months, bonus, clauses);
      if (salary < min) {
        const attempts = (old?.attempts || 0) + 1;
        s.negotiations[id] = {
          salary: min,
          months,
          bonus,
          terms,
          attempts,
          cooldown: attempts >= 3 ? s.day + 7 : s.day,
        };
        d.memory.push({
          day: s.day,
          event: "Oferta salarial inferior a sus expectativas",
        });
        if (attempts >= 3) d.morale = G.clamp(d.morale - 5, 0, 100);
        return { accepted: false, salary: min, cooldown: attempts >= 3 };
      }
      G.Economy.spend(
        s,
        bonus,
        "Contratos",
        `Prima de contratación · ${d.name}`,
      );
      d.companyId = s.playerId;
      d.contract = {
        salary,
        bonus,
        start: s.day,
        end: s.day + months * 30,
        role: clauses?.role || "principal",
        accrued: 0,
        ...(clauses ? { clauses } : {}),
      };
      delete s.negotiations[id];
      d.memory.push({ day: s.day, event: "Contrato firmado" });
      G.news(
        s,
        "Fichajes",
        `${d.name} firma con ${G.player(s).name}.`,
        `El piloto de ${d.age} años acepta un contrato de ${months} meses por $${salary} mensuales y una prima de $${bonus}.`,
        "team",
        id,
      );
      return { accepted: true };
    },
    train(s, id, type) {
      G.ensurePlayable(s);
      const d = s.drivers.find(
        (d) => d.id === id && d.companyId === s.playerId,
      );
      G.assert(
        d && [null, "pace", "control"].includes(type),
        "Plan de entrenamiento inválido.",
      );
      d.training = type;
    },
    releaseQuote(d) {
      return Math.round(
        d.contract.salary * (d.contract.clauses?.releaseMonths || 1) +
          d.contract.accrued,
      );
    },
    release(s, id) {
      G.assert(!s.race, "Termina la carrera antes de rescindir contratos.");
      const d = s.drivers.find(
        (d) => d.id === id && d.companyId === s.playerId,
      );
      G.assert(d, "Piloto no disponible.");
      const cost = this.releaseQuote(d);
      G.Economy.spend(
        s,
        cost,
        "Contratos",
        `Rescisión y nómina pendiente · ${d.name}`,
      );
      G.Contracts.settlePromise(s, d);
      d.companyId = null;
      d.contract = null;
      d.training = null;
      for (const e of s.season.events)
        if (e.status === "scheduled" && e.entry?.driverId === id) {
          G.RaceWeekend.releaseEntry(s, e);
          e.entry = null;
          G.news(
            s,
            "Competición",
            "Inscripción retirada por rescisión.",
            "La plaza ha quedado libre; los gastos de inscripción y transporte no se reembolsan.",
            "competition",
          );
        }
    },
    daily(s) {
      for (const d of s.drivers) {
        d.fatigue = G.clamp(d.fatigue - (d.training ? 2 : 8), 0, 100);
        if (
          d.companyId &&
          d.training &&
          s.companies.find((c) => c.id === d.companyId)?.status === "active"
        ) {
          const c = s.companies.find((c) => c.id === d.companyId);
          if (c.balance >= 18 && d.fatigue < 60) {
            G.Economy.transact(
              s,
              c.id,
              -18,
              "Formación",
              `Entrenamiento · ${d.name}`,
            );
            d.stats[d.training] = Math.min(
              d.potential,
              d.stats[d.training] + 0.015 * (d.age < 25 ? 1 : 0.5),
            );
          }
        }
        if (d.contract && s.day >= d.contract.end) {
          const c = s.companies.find((c) => c.id === d.companyId);
          G.Economy.transact(
            s,
            c.id,
            -d.contract.accrued,
            "Salarios",
            `Liquidación · ${d.name}`,
          );
          d.companyId = null;
          d.contract = null;
          d.training = null;
          G.news(
            s,
            "Fichajes",
            `${d.name} queda libre tras finalizar su contrato.`,
            `${c.name} debe renovar su alineación para volver a competir.`,
            "team",
            d.id,
          );
          for (const e of s.season.events)
            if (e.status === "scheduled" && e.entry?.driverId === d.id) {
              G.RaceWeekend.releaseEntry(s, e);
              e.entry = null;
            }
        }
      }
      if (
        s.day % 30 === 0 &&
        s.drivers.filter((d) => !d.companyId).length < 5
      ) {
        const d = this.generate(s, null);
        s.drivers.push(d);
        G.news(
          s,
          "Talentos",
          `${d.name} busca su primera oportunidad.`,
          `Un piloto de ${d.age} años envía su currículum a las escuderías locales.`,
          "team",
          d.id,
        );
      }
    },
  };
})();
