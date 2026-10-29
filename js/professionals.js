"use strict";
(() => {
  const G = RCS,
    S = G.Staff;
  const P = (G.Professionals = {
    initialize(s) {
      if (s.professional !== undefined) {
        G.assert(
          s.professional.version === 1,
          "Versión profesional incompatible.",
        );
        return s;
      }
      s.professional = {
        version: 1,
        sequence: 0,
        rng: (s.seed ^ 0x0622026) >>> 0,
        lastDaily: s.day,
        lastLabour: s.day,
        profiles: {},
        drivers: {},
        demands: [],
        offers: [],
        inspections: [],
        setups: {},
        cvs: [],
        practices: [],
      };
      for (const e of s.employees) this.addEmployee(s, e);
      for (const d of s.drivers) this.addDriver(s, d);
      return s;
    },
    uid(s, prefix) {
      return `${prefix}-${++s.professional.sequence}`;
    },
    addEmployee(s, e) {
      if (!s.professional || s.professional.profiles[e.id]) return;
      s.professional.profiles[e.id] = {
        level: G.clamp(1 + Math.floor((e.skill - 40) / 7), 1, 8),
        xp: 0,
        stress: 0,
        restUntil: 0,
        lastRaise: s.day,
        lastCV: s.day,
        observed: { ...e.contributions },
        speed: 50 + ((Number(e.id.split("-")[1]) * 17 + s.seed) % 36),
      };
    },
    addDriver(s, d) {
      if (s.professional && !s.professional.drivers[d.id])
        s.professional.drivers[d.id] = {
          stress: 0,
          injuryUntil: 0,
          retired: false,
          listed: true,
          introduced: s.day,
          recruited: !!d.companyId,
        };
    },
    profile(s, id) {
      return s.professional?.profiles[id];
    },
    care(s, id) {
      return s.professional?.drivers[id];
    },
    resting(s, id) {
      return (this.profile(s, id)?.restUntil || 0) > s.day;
    },
    fit(s, id) {
      const c = this.care(s, id);
      return !c || (!c.retired && c.injuryUntil <= s.day);
    },
    available(s, d) {
      return (
        this.fit(s, d.id) &&
        (d.companyId || this.care(s, d.id)?.listed !== false)
      );
    },
    gain(s, eid, amount) {
      const e = s.employees.find((e) => e.id === eid),
        p = this.profile(s, eid);
      if (!p || !e || p.level === 10) return;
      p.xp += amount;
      while (p.level < 10 && p.xp >= 150 + p.level * 75) {
        p.xp -= 150 + p.level * 75;
        p.level++;
        S.remember(e, s, `Alcanza el nivel profesional ${p.level}.`);
        G.news(
          s,
          "Talentos",
          `${e.name} alcanza el nivel ${p.level}.`,
          "Su experiencia mejora el rendimiento y eleva sus expectativas salariales.",
          "staff",
          eid,
        );
      }
      if (p.level === 10) p.xp = 0;
    },
    multiplier(s, id) {
      const p = this.profile(s, id);
      return !p
        ? 1
        : this.resting(s, id)
          ? 0
          : (0.35 + p.level * 0.065) * (1 - p.stress * 0.005);
    },
    rest(s, id, days) {
      const e = s.employees.find(
          (e) => e.id === id && e.companyId === s.playerId,
        ),
        p = this.profile(s, id);
      G.assert(
        !s.race && e?.contract && [1, 3, 7].includes(days),
        "Descanso no disponible.",
      );
      G.assert(
        !S.busy(s, id) &&
          !s.staffing.assignments.some(
            (j) => j.employeeId === id && j.status === "active",
          ),
        "Termina el trabajo o informe en curso antes de dar descanso.",
      );
      p.restUntil = Math.max(s.day, p.restUntil) + days;
      S.remember(e, s, `${days} días de descanso remunerado.`);
      e.motivation = Math.min(100, e.motivation + 3);
      e.loyalty = Math.min(100, e.loyalty + 2);
    },
    canAssign(s, e, days) {
      return (
        !this.resting(s, e.id) &&
        !s.professional?.offers.some(
          (o) =>
            o.employeeId === e.id &&
            o.status === "pending" &&
            o.deadline <= s.day + days,
        )
      );
    },
    marketSalary(s, e) {
      return S.minimum(
        s,
        e,
        { months: 12, bonus: 0 },
        e.companyId || s.playerId,
      );
    },
    demand(s, e) {
      if (
        !e.contract ||
        s.professional.demands.some(
          (d) => d.employeeId === e.id && d.status === "pending",
        )
      )
        return null;
      const p = this.profile(s, e.id),
        salary = Math.min(
          5000,
          Math.ceil(
            Math.max(e.contract.salary * 1.06, this.marketSalary(s, e)) / 10,
          ) * 10,
        );
      if (salary <= e.contract.salary) return null;
      const d = {
        id: this.uid(s, "staffraise"),
        employeeId: e.id,
        companyId: e.companyId,
        day: s.day,
        deadline: s.day + 14,
        salary,
        status: "pending",
      };
      s.professional.demands.push(d);
      p.lastRaise = s.day;
      S.remember(
        e,
        s,
        `Solicita una revisión salarial de $${salary}/${G.Pay.unit(e)}.`,
      );
      G.news(
        s,
        "Compañía",
        `${e.name} solicita un aumento.`,
        `$${salary}/${G.Pay.unit(e)}; espera una respuesta en catorce días. Puedes negociar, aceptar o rechazar.`,
        "staff",
        e.id,
      );
      return d;
    },
    answerRaise(s, id, salary = null) {
      const d = s.professional.demands.find(
          (d) =>
            d.id === id && d.companyId === s.playerId && d.status === "pending",
        ),
        e = s.employees.find(
          (e) => e.id === d?.employeeId && e.companyId === s.playerId,
        );
      G.assert(!s.race && e?.contract, "Petición salarial no disponible.");
      if (salary === null) {
        d.status = "refused";
        e.motivation = Math.max(0, e.motivation - 12);
        e.loyalty = Math.max(0, e.loyalty - 8);
        this.profile(s, e.id).stress = Math.min(
          100,
          this.profile(s, e.id).stress + 8,
        );
        S.remember(e, s, "Petición de aumento rechazada.");
        return { accepted: false };
      }
      G.assert(
        Number.isInteger(salary) &&
          salary >= e.contract.salary &&
          salary <= 5000,
        "Salario propuesto inválido.",
      );
      const floor =
        Math.ceil((d.salary * (e.loyalty >= 65 ? 0.92 : 1)) / 10) * 10;
      if (salary < floor) return { accepted: false, counter: floor };
      G.assert(
        G.player(s).balance >= salary / 2,
        "Necesitas una reserva de media nómina para aceptar el aumento.",
      );
      e.contract.salary = salary;
      d.status = "accepted";
      e.motivation = Math.min(100, e.motivation + 10);
      e.loyalty = Math.min(100, e.loyalty + 5);
      S.remember(
        e,
        s,
        `Acuerda $${salary}/${G.Pay.unit(e)} tras negociar su aumento.`,
      );
      return { accepted: true };
    },
    poach(s, eid, buyerId) {
      const e = s.employees.find((e) => e.id === eid),
        buyer = s.companies.find((c) => c.id === buyerId),
        seller = s.companies.find((c) => c.id === e?.companyId);
      G.assert(
        e?.contract &&
          buyer?.status === "active" &&
          seller?.status === "active" &&
          buyerId !== seller.id &&
          !S.busy(s, eid) &&
          !this.resting(s, eid),
        "Oferta rival no disponible.",
      );
      if (G.Challenge.enabled(s))
        G.assert(
          buyer.level >= G.Challenge.staffLevel(s, e),
          "La compañía rival no tiene nivel para este profesional.",
        );
      G.assert(
        !s.professional.offers.some(
          (o) => o.employeeId === eid && o.status === "pending",
        ),
        "Ya existe una oferta para este profesional.",
      );
      G.assert(
        S.owned(s, buyerId).length < S.capacity(s, buyerId) &&
          !S.owned(s, buyerId).some((other) => other.role === e.role),
        "El comprador no tiene plaza o especialidad libre.",
      );
      G.assert(
        !s.staffing.assignments.some(
          (j) => j.employeeId === eid && j.status === "active",
        ),
        "El ojeador tiene un informe en curso.",
      );
      const salary =
          Math.ceil(
            Math.max(
              e.contract.salary * 1.2,
              S.minimum(s, e, { months: 12, bonus: 0 }, buyerId),
            ) / 10,
          ) * 10,
        fee = Math.ceil(G.Pay.monthly(e.contract) * 0.5);
      G.assert(
        salary <= 5000 &&
          buyer.balance >=
            fee +
              (G.Companies.monthly(s, buyerId) + G.Pay.monthlyRate(salary, e)) *
                4,
        "El rival no puede financiar la oferta y su reserva.",
      );
      const o = {
        id: this.uid(s, "staffpoach"),
        employeeId: eid,
        sellerId: seller.id,
        buyerId,
        salary,
        fee,
        day: s.day,
        deadline: s.day + 7,
        roll: G.random(s.professional),
        status: "pending",
      };
      s.professional.offers.push(o);
      G.news(
        s,
        "Fichajes",
        `${buyer.name} presenta una oferta a ${e.name}.`,
        `$${salary}/${G.Pay.unit(e)}. El profesional decidirá dentro de siete días; su salario, lealtad, estrés y tu respuesta influyen.`,
        "staff",
        eid,
      );
      return o;
    },
    counterPoach(s, oid, salary) {
      const o = s.professional.offers.find(
          (o) =>
            o.id === oid && o.sellerId === s.playerId && o.status === "pending",
        ),
        e = s.employees.find(
          (e) => e.id === o?.employeeId && e.companyId === s.playerId,
        );
      G.assert(
        !s.race &&
          e?.contract &&
          Number.isInteger(salary) &&
          salary >= o.salary &&
          salary <= 5000 &&
          G.player(s).balance >= salary / 2,
        "No puedes financiar o presentar esta contraoferta.",
      );
      e.contract.salary = salary;
      o.status = "countered";
      e.loyalty = Math.min(100, e.loyalty + 8);
      e.motivation = Math.min(100, e.motivation + 8);
      this.profile(s, e.id).stress = Math.max(
        0,
        this.profile(s, e.id).stress - 6,
      );
      S.remember(
        e,
        s,
        "Rechaza la oferta rival tras una mejora salarial de su compañía.",
      );
    },
    resolveOffer(s, o) {
      if (o.status !== "pending") return;
      const e = s.employees.find((e) => e.id === o.employeeId),
        buyer = s.companies.find((c) => c.id === o.buyerId),
        seller = s.companies.find((c) => c.id === o.sellerId);
      if (
        !e?.contract ||
        e.companyId !== o.sellerId ||
        buyer?.status !== "active" ||
        (G.Challenge.enabled(s) &&
          buyer.level < G.Challenge.staffLevel(s, e)) ||
        seller?.status !== "active" ||
        S.busy(s, e.id) ||
        S.owned(s, buyer.id).length >= S.capacity(s, buyer.id) ||
        S.owned(s, buyer.id).some((other) => other.role === e.role) ||
        buyer.balance <
          o.fee +
            (G.Companies.monthly(s, buyer.id) +
              G.Pay.monthlyRate(o.salary, e)) *
              4 ||
        o.salary < S.minimum(s, e, { months: 12, bonus: 0 }, buyer.id)
      ) {
        o.status = "cancelled";
        return;
      }
      const chance = G.clamp(
        0.15 +
          (o.salary / e.contract.salary - 1) * 0.8 +
          this.profile(s, e.id).stress / 180 -
          e.loyalty / 160,
        0.05,
        0.9,
      );
      if (o.roll >= chance) {
        o.status = "declined";
        S.remember(e, s, `Rechaza la oferta de ${buyer.name}.`);
        return;
      }
      // Todos los fondos y plazas se comprueban antes de transferir o liquidar.
      G.assert(
        o.salary >= S.minimum(s, e, { months: 12, bonus: 0 }, buyer.id),
        "La oferta rival ha quedado desactualizada.",
      );
      G.Economy.spendCompany(
        s,
        buyer.id,
        o.fee,
        "Personal",
        `Compensación por ${e.name}`,
      );
      G.Economy.transact(
        s,
        seller.id,
        o.fee,
        "Personal",
        `Salida de ${e.name} a ${buyer.name}`,
      );
      S.depart(s, e, "Oferta de la competencia");
      S.offer(s, e.id, { salary: o.salary, months: 12, bonus: 0 }, buyer.id);
      o.status = "accepted";
      this.profile(s, e.id).stress = Math.max(
        0,
        this.profile(s, e.id).stress - 10,
      );
      for (const d of s.professional.demands)
        if (d.employeeId === e.id && d.status === "pending")
          d.status = "cancelled";
    },
    accuracy(s, e) {
      const p = this.profile(s, e.id);
      return G.clamp(
        Math.round(10 + p.level * 8.5 + e.skill * 0.04 - p.stress * 0.22),
        5,
        99,
      );
    },
    estimate(s, value, accuracy, level) {
      const x = s.professional,
        correct = G.random(x) * 100 < accuracy,
        margin = Math.max(3, 13 - level);
      let lower, upper;
      if (correct) {
        lower = Math.max(20, Math.floor(value - margin - G.random(x) * 2));
        upper = Math.min(99, Math.ceil(value + margin));
      } else if (value > 55) {
        upper = Math.max(21, Math.floor(value - 3 - G.random(x) * 6));
        lower = Math.max(20, upper - margin * 2);
      } else {
        lower = Math.min(98, Math.ceil(value + 3 + G.random(x) * 6));
        upper = Math.min(99, lower + margin * 2);
      }
      return { lower, upper, accuracy };
    },
    reviewQuote(s, carId, adjust = false, cid = s.playerId) {
      const car = s.cars.find((c) => c.id === carId && c.companyId === cid),
        mechanic = S.owned(s, cid).find(
          (e) =>
            e.role === "mechanic" && !S.busy(s, e.id) && !this.resting(s, e.id),
        ),
        engineer = S.owned(s, cid).find(
          (e) =>
            e.role === "engineer" && !S.busy(s, e.id) && !this.resting(s, e.id),
        );
      G.assert(
        !s.race && car && !car.repair && !G.Market.listed(s, car.id),
        "El coche no está disponible para diagnosticar.",
      );
      G.assert(
        mechanic,
        "Necesitas un mecánico contratado, disponible y descansado para revisar el vehículo.",
      );
      const m = this.profile(s, mechanic.id),
        n = engineer ? this.profile(s, engineer.id) : null;
      G.assert(
        !G.Practice.active(s) || G.Practice.active(s).carId !== carId,
        "El coche está entrenando.",
      );
      G.assert(
        !s.professional.inspections.some(
          (r) => r.carId === carId && r.day === s.day,
        ),
        "Este vehículo ya fue revisado hoy. Consulta su informe.",
      );
      const accuracy = G.clamp(
          Math.round(
            20 +
              m.level * 5 +
              mechanic.skill * 0.2 -
              m.stress * 0.3 +
              (n ? n.level * 2.4 + engineer.skill * 0.1 - n.stress * 0.1 : 0),
          ),
          0,
          100,
        ),
        cost =
          35 + m.level * 10 + (engineer ? n.level * 5 : 0) + (adjust ? 40 : 0);
      G.assert(
        s.companies.find((c) => c.id === cid).balance >= cost,
        "No hay fondos para la revisión.",
      );
      return { car, mechanic, engineer, accuracy, cost, adjust: !!adjust };
    },
    review(s, carId, adjust = false) {
      const q = this.reviewQuote(s, carId, adjust),
        x = s.professional;
      G.Economy.spend(
        s,
        q.cost,
        "Taller",
        "Diagnóstico profesional" + (adjust ? " y ajuste" : ""),
      );
      const accurate = G.random(x) * 100 < q.accuracy;
      const components = Object.fromEntries(
        Object.entries(q.car.components).map(([key, actual]) => [
          key,
          Math.round(
            G.clamp(
              actual +
                (accurate
                  ? (G.random(x) - 0.5) * (100 - q.accuracy) * 0.1
                  : (G.random(x) < 0.5 ? -1 : 1) * (12 + G.random(x) * 20)),
              0,
              100,
            ),
          ),
        ]),
      );
      const report = {
        id: this.uid(s, "inspection"),
        companyId: s.playerId,
        carId,
        day: s.day,
        mechanicId: q.mechanic.id,
        engineerId: q.engineer?.id || null,
        accuracy: q.accuracy,
        cost: q.cost,
        adjusted: !!adjust,
        components,
      };
      x.inspections.push(report);
      if (adjust)
        x.setups[carId] = {
          inspectionId: report.id,
          until: s.day + 14,
          kmLimit: q.car.km + 100,
          effect: accurate
            ? Math.min(
                0.06,
                0.008 +
                  this.profile(s, q.mechanic.id).level * 0.002 +
                  (q.engineer
                    ? this.profile(s, q.engineer.id).level * 0.003
                    : 0),
              )
            : -0.015,
        };
      this.gain(s, q.mechanic.id, 18);
      this.profile(s, q.mechanic.id).stress = Math.min(
        100,
        this.profile(s, q.mechanic.id).stress + 5,
      );
      if (q.engineer) {
        this.gain(s, q.engineer.id, 12);
        this.profile(s, q.engineer.id).stress = Math.min(
          100,
          this.profile(s, q.engineer.id).stress + 3,
        );
      }
      return report;
    },
    autoCV(s, e) {
      const p = this.profile(s, e.id),
        interval = Math.max(7, 18 - p.level);
      if (
        this.resting(s, e.id) ||
        s.day - p.lastCV < interval ||
        s.staffing.assignments.some(
          (j) => j.employeeId === e.id && j.status === "active",
        )
      )
        return;
      p.lastCV = s.day;
      const free = s.drivers.filter(
        (d) => !d.companyId && this.available(s, d),
      );
      if (free.length >= 20) return;
      const proxy = { ...s, rng: s.professional.rng },
        d = G.Drivers.generate(proxy, null);
      s.sequence = proxy.sequence;
      s.professional.rng = proxy.rng;
      const surprise = G.random(s.professional) < 0.015 + p.level * 0.004;
      const base =
        (G.Challenge.enabled(s) ? 10 : 27) +
        p.level * (G.Challenge.enabled(s) ? 5 : 4.5) +
        (surprise ? 8 : 0);
      for (const key of G.Drivers.stats)
        d.stats[key] = G.clamp(
          Math.round(base + (G.random(s.professional) - 0.5) * 16),
          G.Challenge.enabled(s) ? 3 : 20,
          90,
        );
      d.potential = G.clamp(
        Math.round(
          Math.max(
            G.Drivers.rating(d) + 5,
            43 + p.level * 4 + (surprise ? 25 : G.random(s.professional) * 16),
          ),
        ),
        35,
        98,
      );
      d.ask = G.Challenge.enabled(s)
        ? G.Challenge.driverAsk(d)
        : Math.round((400 + G.Drivers.rating(d) * 5) / 10) * 10;
      s.drivers.push(d);
      this.addDriver(s, d);
      const report = this.estimate(
        s,
        d.potential,
        this.accuracy(s, e, "scout"),
        p.level,
      );
      const cv = {
        id: this.uid(s, "scoutcv"),
        companyId: e.companyId,
        employeeId: e.id,
        driverId: d.id,
        day: s.day,
        accuracy: report.accuracy,
        report,
        detail:
          p.level >= 4
            ? `Punto fuerte: ${G.Drivers.labels[G.Drivers.stats.slice().sort((a, b) => d.stats[b] - d.stats[a])[0]]}. Adaptación estimada: ${Math.round(G.clamp(d.stats.weather + (G.random(s.professional) - 0.5) * (100 - report.accuracy) * 0.5, 20, 99))}/100. Trabajo en equipo estimado: ${Math.round(G.clamp(d.stats.teamwork + (G.random(s.professional) - 0.5) * (100 - report.accuracy) * 0.5, 20, 99))}/100.`
            : "El ojeador todavía no puede ofrecer una evaluación especializada completa.",
      };
      s.professional.cvs.push(cv);
      this.gain(s, e.id, 15);
      p.stress = Math.min(100, p.stress + 4);
      G.news(
        s,
        "Talentos",
        `${e.name} presenta el CV de ${d.name}.`,
        `Un nuevo piloto entra en el mercado real. Informe con ${report.accuracy} % de acierto estimado; la evaluación puede equivocarse.`,
        "driver",
        d.id,
      );
    },
    daily(s) {
      const x = s.professional;
      if (!x || x.lastDaily === s.day) return;
      x.lastDaily = s.day;
      for (const d of s.drivers) {
        this.addDriver(s, d);
        const c = this.care(s, d.id);
        c.stress = Math.max(
          0,
          c.stress -
            (G.Practice.active(s)?.calendarVersion &&
            G.Practice.active(s).driverId === d.id
              ? 3
              : d.training && !G.Operations?.controlsTraining(s, d)
                ? 3
                : 9),
        );
        if (
          !d.companyId &&
          !c.recruited &&
          x.cvs.some((cv) => cv.driverId === d.id) &&
          s.day - c.introduced > 90
        )
          c.listed = false;
      }
      for (const e of s.employees) {
        this.addEmployee(s, e);
        const p = this.profile(s, e.id),
          delta = Object.fromEntries(
            ["jobs", "sessions", "reports"].map((k) => [
              k,
              Math.max(0, e.contributions[k] - p.observed[k]),
            ]),
          );
        p.observed = { ...e.contributions };
        this.gain(
          s,
          e.id,
          delta.jobs * 25 + delta.sessions + delta.reports * 20,
        );
        const working =
          S.busy(s, e.id) ||
          s.staffing.assignments.some(
            (j) => j.employeeId === e.id && j.status === "active",
          );
        p.stress = G.clamp(
          p.stress +
            (this.resting(s, e.id)
              ? -12
              : working
                ? 3
                : delta.sessions
                  ? Math.min(8, delta.sessions * 1.5)
                  : -4),
          0,
          100,
        );
        if (!e.contract) continue;
        if (p.stress > 75) {
          e.motivation = Math.max(0, e.motivation - 0.4);
          e.loyalty = Math.max(0, e.loyalty - 0.1);
        }
        const history = Object.values(e.contributions).reduce(
            (n, v) => n + v,
            0,
          ),
          underpaid = this.marketSalary(s, e) > e.contract.salary * 1.12;
        if (
          s.day - p.lastRaise >= 90 &&
          (underpaid ||
            (s.day - p.lastRaise >= 180 && history > 0 && e.loyalty < 75) ||
            (p.stress > 85 && e.personality === "ambitious"))
        )
          this.demand(s, e);
        if (e.role === "scout") this.autoCV(s, e);
      }
      for (const d of x.demands.filter((d) => d.status === "pending")) {
        const e = s.employees.find(
          (e) => e.id === d.employeeId && e.companyId === d.companyId,
        );
        if (!e?.contract) d.status = "cancelled";
        else if (
          d.companyId !== s.playerId &&
          s.companies.find((c) => c.id === d.companyId).balance >=
            (G.Companies.monthly(s, d.companyId) +
              G.Pay.monthlyRate(d.salary, e) -
              G.Pay.monthly(e.contract)) *
              3
        ) {
          e.contract.salary = d.salary;
          d.status = "accepted";
          e.motivation = Math.min(100, e.motivation + 8);
        } else if (d.deadline < s.day) {
          d.status = "ignored";
          e.motivation = Math.max(0, e.motivation - 15);
          e.loyalty = Math.max(0, e.loyalty - 10);
          S.remember(e, s, "Petición salarial sin respuesta.");
        }
      }
      for (const o of x.offers.filter(
        (o) => o.status === "pending" && o.deadline <= s.day,
      ))
        this.resolveOffer(s, o);
      if (s.day - x.lastLabour >= 7 && s.day >= 90) {
        x.lastLabour = s.day;
        for (const e of s.employees.filter(
          (e) =>
            e.contract &&
            (this.profile(s, e.id).stress > 55 ||
              e.loyalty < 50 ||
              this.marketSalary(s, e) > e.contract.salary * 1.2),
        )) {
          if (x.offers.some((o) => o.employeeId === e.id && s.day - o.day < 45))
            continue;
          for (const c of s.companies.filter(
            (c) =>
              c.id !== e.companyId &&
              c.id !== s.playerId &&
              c.status === "active",
          )) {
            try {
              this.poach(s, e.id, c.id);
              break;
            } catch {}
          }
        }
      }
      for (const key of ["demands", "offers"])
        x[key] = [
          ...x[key].filter((v) => v.status === "pending"),
          ...x[key].filter((v) => v.status !== "pending").slice(-60),
        ];
      x.inspections = x.inspections.slice(-80);
      x.cvs = x.cvs.slice(-80);
    },
    validate(s) {
      const x = s.professional;
      if (x === undefined) return;
      const num = (n, a = 0, b = 100) => Number.isFinite(n) && n >= a && n <= b,
        day = (n) => Number.isInteger(n) && n >= 0,
        employee = (id) => s.employees.some((e) => e.id === id),
        company = (id) => s.companies.some((c) => c.id === id);
      G.assert(
        x &&
          x.version === 1 &&
          day(x.sequence) &&
          Number.isInteger(x.rng) &&
          day(x.lastDaily) &&
          x.lastDaily <= s.day &&
          day(x.lastLabour) &&
          x.lastLabour <= s.day &&
          x.profiles &&
          x.drivers &&
          [x.demands, x.offers, x.inspections, x.cvs, x.practices].every(
            Array.isArray,
          ) &&
          x.setups,
        "Desarrollo profesional inválido.",
      );
      G.assert(
        Object.keys(x.profiles).length === s.employees.length &&
          Object.keys(x.drivers).length === s.drivers.length,
        "Faltan perfiles profesionales o médicos.",
      );
      for (const e of s.employees) {
        const p = x.profiles[e.id];
        G.assert(
          p &&
            Number.isInteger(p.level) &&
            p.level >= 1 &&
            p.level <= 10 &&
            num(p.xp, 0, 100000) &&
            num(p.stress) &&
            day(p.restUntil) &&
            day(p.lastRaise) &&
            p.lastRaise <= s.day &&
            day(p.lastCV) &&
            p.lastCV <= s.day &&
            num(p.speed, 40, 100) &&
            p.observed &&
            ["jobs", "sessions", "reports"].every(
              (k) => day(p.observed[k]) && p.observed[k] <= e.contributions[k],
            ),
          "Nivel, experiencia o estrés inválidos.",
        );
      }
      for (const d of s.drivers) {
        const c = x.drivers[d.id];
        G.assert(
          c &&
            num(c.stress) &&
            day(c.injuryUntil) &&
            typeof c.retired === "boolean" &&
            typeof c.listed === "boolean" &&
            typeof c.recruited === "boolean" &&
            day(c.introduced) &&
            c.introduced <= s.day,
          "Estado médico del piloto inválido.",
        );
      }
      for (const d of x.demands)
        G.assert(
          employee(d.employeeId) &&
            company(d.companyId) &&
            day(d.day) &&
            d.day <= s.day &&
            d.deadline === d.day + 14 &&
            Number.isInteger(d.salary) &&
            d.salary >= (G.Challenge.enabled(s) ? 10 : 150) &&
            d.salary <= 5000 &&
            ["pending", "accepted", "refused", "ignored", "cancelled"].includes(
              d.status,
            ),
          "Petición salarial inválida.",
        );
      for (const o of x.offers)
        G.assert(
          employee(o.employeeId) &&
            company(o.sellerId) &&
            company(o.buyerId) &&
            o.buyerId !== o.sellerId &&
            day(o.day) &&
            o.day <= s.day &&
            o.deadline === o.day + 7 &&
            Number.isInteger(o.salary) &&
            o.salary >= (G.Challenge.enabled(s) ? 10 : 150) &&
            o.salary <= 5000 &&
            Number.isInteger(o.fee) &&
            o.fee >= 0 &&
            num(o.roll, 0, 1) &&
            [
              "pending",
              "accepted",
              "countered",
              "declined",
              "cancelled",
            ].includes(o.status),
          "Oferta laboral inválida.",
        );
      G.assert(
        new Set(
          x.offers
            .filter((o) => o.status === "pending")
            .map((o) => o.employeeId),
        ).size === x.offers.filter((o) => o.status === "pending").length,
        "Ofertas laborales simultáneas duplicadas.",
      );
      for (const r of x.inspections)
        G.assert(
          company(r.companyId) &&
            s.cars.some((c) => c.id === r.carId) &&
            employee(r.mechanicId) &&
            (r.engineerId === null || employee(r.engineerId)) &&
            day(r.day) &&
            r.day <= s.day &&
            num(r.accuracy) &&
            Number.isInteger(r.cost) &&
            r.cost >= 0 &&
            typeof r.adjusted === "boolean" &&
            r.components &&
            Object.keys(G.Parts.components).every((k) => num(r.components[k])),
          "Revisión profesional inválida.",
        );
      for (const [cid, p] of Object.entries(x.setups))
        G.assert(
          s.cars.some((c) => c.id === cid) &&
            typeof p.inspectionId === "string" &&
            day(p.until) &&
            num(p.kmLimit, 0, 10000000) &&
            num(p.effect, -0.02, 0.06),
          "Ajuste de manejo inválido.",
        );
      for (const cv of x.cvs)
        G.assert(
          company(cv.companyId) &&
            employee(cv.employeeId) &&
            s.drivers.some((d) => d.id === cv.driverId) &&
            day(cv.day) &&
            cv.day <= s.day &&
            num(cv.accuracy) &&
            cv.report &&
            num(cv.report.lower, 20, 99) &&
            num(cv.report.upper, 20, 99) &&
            cv.report.lower < cv.report.upper &&
            typeof cv.detail === "string",
          "Currículum de ojeo inválido.",
        );
    },
  });
  const depart = S.depart;
  S.depart = function (s, e, ...args) {
    const result = depart.call(this, s, e, ...args);
    if (s.professional)
      for (const key of ["demands", "offers"])
        for (const item of s.professional[key])
          if (item.employeeId === e.id && item.status === "pending")
            item.status = "cancelled";
    return result;
  };
  const generate = S.generate;
  S.generate = function (s, ...args) {
    const e = generate.call(this, s, ...args);
    P.addEmployee(s, e);
    return e;
  };
  const driver = G.Drivers.generate;
  G.Drivers.generate = function (s, ...args) {
    const d = driver.call(this, s, ...args);
    if (s.professional) P.addDriver(s, d);
    return d;
  };
  const strength = S.strength;
  S.strength = function (s, id, role, available = false) {
    const e = this.owned(s, id).find(
      (e) => e.role === role && (!available || !this.busy(s, e.id)),
    );
    return (
      strength.call(this, s, id, role, available) *
      (e ? P.multiplier(s, e.id) : 1)
    );
  };
  const minimum = S.minimum;
  S.minimum = function (s, e, t, id) {
    const level = P.profile(s, e.id)?.level;
    return Math.max(
      150,
      Math.round(
        (minimum.call(this, s, e, t, id) * (level ? 0.6 + level * 0.08 : 1)) /
          10,
      ) * 10,
    );
  };
  const daily = S.daily;
  S.daily = function (s) {
    daily.call(this, s);
    P.daily(s);
  };
  const scout = S.scout;
  S.scout = function (s, eid, did, ...args) {
    const j = scout.call(this, s, eid, did, ...args),
      e = s.employees.find((e) => e.id === eid);
    if (s.professional)
      j.report = P.estimate(
        s,
        s.drivers.find((d) => d.id === did).potential,
        P.accuracy(s, e, "scout"),
        P.profile(s, eid).level,
      );
    return j;
  };
})();
