"use strict";
(() => {
  const G = RCS,
    S = G.Staff,
    P = G.Professionals;
  const B = (G.Challenge = {
    startFunds: 4200,
    enabled: (s) => s?.challenge?.version === 1,
    initialize(s) {
      s.challenge = {
        version: 1,
        rng: (s.seed ^ 0x064ba1a) >>> 0,
        lastRecruit: s.day,
      };
      G.player(s).balance = this.startFunds;
      for (const d of s.drivers) this.driver(s, d, !!d.companyId);
      for (const role of Object.keys(S.roles)) {
        const candidates = s.employees.filter((e) => e.role === role);
        candidates.forEach((e, i) =>
          this.employee(s, e, [1, 1, 2, 4, 6][i % 5]),
        );
      }
      for (const [i, c] of s.cars.entries()) {
        const player = c.companyId === s.playerId,
          npc = c.companyId && c.companyId !== s.playerId;
        const model = player
          ? G.integer(s.challenge, 4, 8)
          : npc
            ? [5, 9, 11, 12, 14, 15, 17][
                Math.max(
                  0,
                  s.companies.findIndex((t) => t.id === c.companyId) - 1,
                )
              ]
            : c.modelIndex;
        if (player || npc) {
          Object.assign(c, G.Data.models[model], { modelIndex: model });
          c.base = Object.fromEntries(
            G.Workshop.attributes.map((k) => [k, c[k]]),
          );
          for (const key of Object.keys(c.components))
            c.components[key] =
              key === "tires"
                ? G.integer(s.challenge, 68, 80)
                : G.integer(s.challenge, 80, 92);
          c.oemTires = c.components.tires;
          G.Workshop.recalculate(s, c);
        }
      }
      for (let i = 4; i < Math.min(24, G.Data.models.length); i++) {
        const car = G.makeCar(
          s,
          null,
          i,
          ["#ac3430", "#295b79", "#e0d8bf", "#3f5b4b", "#b8bac1", "#cea749"][
            i % 6
          ],
        );
        car.base = Object.fromEntries(
          G.Workshop.attributes.map((k) => [k, car[k]]),
        );
        car.components = Object.fromEntries(
          Object.keys(G.Parts.components).map((k) => [
            k,
            k === "tires" ? car.tires : car.condition,
          ]),
        );
        car.installed = {};
        car.oemTires = car.tires;
        car.upgradeValue = 0;
        s.cars.push(car);
        s.market.push({
          id: G.uid(s, "listing"),
          carId: car.id,
          sellerId: null,
          price: G.Market.value(car),
          day: s.day,
        });
      }
      while (s.drivers.filter((d) => !d.companyId).length < 12)
        s.drivers.push(G.Drivers.generate(s, null));
      for (const d of s.drivers)
        if (d.contract) {
          d.contract.salary = d.ask;
          d.contract.period = "day";
        }
      const starter = G.ownedCars(s)[0];
      for (const n of s.news)
        if (n.body.includes("Un Civic usado"))
          n.body = `Un ${starter.brand} ${starter.model} usado, $${this.startFunds} y una plantilla por construir. Los salarios se pagan cada jornada. Revisa costes, neumáticos y caja antes de contratar.`;
      G.Rubber.initialize(s);
      return s;
    },
    driverLevel(d) {
      return Math.max(1, Math.ceil((G.Drivers.rating(d) - 25) / 10) + 1);
    },
    staffLevel(s, e) {
      return Math.max(1, Math.ceil((P.profile(s, e.id).level - 1) / 2));
    },
    requireDriver(s, d, cid = s.playerId) {
      if (!this.enabled(s)) return;
      G.assert(
        s.companies.find((c) => c.id === cid).level >= this.driverLevel(d),
        `Este piloto exige una compañía de nivel ${this.driverLevel(d)}.`,
      );
    },
    driverAsk(d) {
      const r = G.Drivers.rating(d);
      return Math.round(
        (16 + r * r * 0.072) *
          (1 + Math.min(20, d.experience) * 0.013) *
          (d.age < 23 ? 1.04 : 1),
      );
    },
    staffAsk(s, e) {
      const level = P.profile(s, e.id).level,
        factor = { engineer: 1.15, doctor: 1.15, manager: 1.1 }[e.role] || 1;
      return Math.round(
        (15 + Math.pow(level, 2.4) * 12) *
          factor *
          (0.8 + e.skill / 220) *
          (0.8 + e.motivation / 400),
      );
    },
    aiReserve(s, c) {
      const pending = s.season.events.filter((e) => e.status === "scheduled"),
        days = Math.max(30, (pending.at(-1)?.day || s.day + 30) - s.day + 14),
        daily = G.Companies.monthly(s, c.id) / 30;
      // El trabajo tiene precio y plazo reales; no se presupuestan victorias ni subvenciones.
      return Math.max(
        daily * G.AI.policy(c).reserve,
        Math.max(0, daily - 420 / 7) * days + pending.length * 850 + 1000,
      );
    },
    aiCandidates(s, c) {
      if (!this.enabled(s) || c.balance >= G.Companies.monthly(s, c.id) * 3)
        return [];
      const old = G.ownedDrivers(s, c.id)
        .filter((d) => !G.Market.locked(s, d.id))
        .sort((a, b) => b.contract.salary - a.contract.salary)[0];
      if (!old) return [];
      const candidate = s.drivers
        .filter(
          (d) =>
            !d.companyId &&
            G.Professionals.available(s, d) &&
            !G.Market.locked(s, d.id) &&
            c.level >= this.driverLevel(d) &&
            d.ask < old.contract.salary * 0.7 &&
            (!G.Competition?.enabled(s) ||
              c.privateer ||
              G.Drivers.rating(d) >= 22),
        )
        .sort(
          (a, b) =>
            G.Drivers.rating(b) / b.ask - G.Drivers.rating(a) / a.ask ||
            a.ask - b.ask,
        )[0];
      if (!candidate) return [];
      const cost = G.Drivers.releaseQuote(old),
        monthly =
          G.Companies.monthly(s, c.id) -
          G.Pay.monthly(old.contract) +
          candidate.ask * 30;
      if (c.balance < cost + monthly * 1.5 + 370) return [];
      return [
        {
          action: "ajuste de asiento",
          utility: 121,
          reason:
            "Liquidar el contrato caro y contratar un piloto local para sostener la temporada sin ayudas externas.",
          targetId: candidate.id,
          cost,
          run: () => {
            G.Companies.release(s, old.id, c.id);
            G.Companies.sign(s, candidate.id, c.id, candidate.ask, 12, 0);
          },
        },
      ];
    },
    driver(s, d, npc = false) {
      const x = s.challenge,
        company = npc
          ? s.companies.find((c) => c.id === d.companyId)
          : G.player(s),
        cap = npc
          ? 34
          : Math.min(93, 20 + company.level * 5 + company.reputation * 0.08),
        base = G.integer(
          x,
          npc ? 18 : Math.max(7, Math.floor(cap - 19)),
          npc ? 29 : Math.max(15, Math.floor(cap - 6)),
        );
      d.trait = G.integer(x, 0, G.Data.traits.length - 1);
      d.age = G.integer(x, 18, 41);
      d.experience = G.integer(x, 0, Math.max(0, d.age - 19));
      d.nation = G.Data.nations[G.integer(x, 0, G.Data.nations.length - 1)];
      const names = new Set(
        s.drivers.filter((o) => o.id !== d.id).map((o) => o.name),
      );
      let name;
      for (let i = 0; i < 50; i++) {
        name =
          G.DriverAppearance.firstName(x) +
          " " +
          G.Data.lastNames[G.integer(x, 0, G.Data.lastNames.length - 1)];
        if (!names.has(name)) break;
      }
      if (names.has(name))
        name +=
          " " +
          G.Data.lastNames[
            Number(d.id.split("-")[1]) % G.Data.lastNames.length
          ];
      d.name = name;
      for (const stat of G.Drivers.stats)
        d.stats[stat] = G.clamp(
          base + G.integer(x, -7, 10) + (G.Data.traits[d.trait][stat] || 0),
          3,
          96,
        );
      let rating = G.Drivers.rating(d);
      if (rating > cap) {
        const delta = rating - Math.floor(cap);
        for (const stat of G.Drivers.stats)
          d.stats[stat] = Math.max(3, d.stats[stat] - delta);
      }
      if (!npc && company.level === 1) {
        rating = G.Drivers.rating(d);
        if (rating < 10)
          for (const stat of G.Drivers.stats)
            d.stats[stat] = Math.min(96, d.stats[stat] + 10 - rating);
      }
      d.potential = G.clamp(
        Math.max(...Object.values(d.stats)) +
          G.integer(x, 3, G.random(x) < 0.12 ? 55 : 20),
        25,
        98,
      );
      d.salaryPeriod = "day";
      d.ask = this.driverAsk(d);
      const identities = new Set(
        s.drivers.filter((o) => o.id !== d.id).map((o) => o.identity),
      );
      do d.identity = G.integer(x, 0, 4294967295);
      while (identities.has(d.identity));
      d.marketUntil = s.day + 45;
      return d;
    },
    employee(s, e, level = null) {
      const x = s.challenge,
        p = P.profile(s, e.id);
      p.level = level || G.integer(x, 1, Math.min(10, 2 + G.player(s).level));
      p.xp = 0;
      e.skill = G.clamp(27 + p.level * 6 + G.integer(x, -5, 8), 20, 95);
      e.salaryPeriod = "day";
      e.ask = this.staffAsk(s, e);
      return e;
    },
    daily(s) {
      if (!this.enabled(s)) return;
      // La valoración de mercado sigue el progreso; un contrato firmado mantiene su sueldo pactado.
      for (const d of s.drivers) d.ask = this.driverAsk(d);
      if (s.day - s.challenge.lastRecruit < 7) return;
      s.challenge.lastRecruit = s.day;
      for (
        let i = 0;
        i < 2 &&
        s.drivers.filter((d) => !d.companyId && P.available(s, d)).length < 16;
        i++
      ) {
        const d = G.Drivers.generate(s, null);
        s.drivers.push(d);
        G.news(
          s,
          "Talentos",
          `${d.name} envía su currículum.`,
          `Valoración ${G.Drivers.rating(d)}, ${d.age} años. Sueldo de referencia $${d.ask}/día. La oferta caduca en 45 jornadas.`,
          "driver",
          d.id,
        );
      }
    },
    validate(s) {
      if (s.challenge === undefined) return;
      G.assert(
        s.challenge.version === 1 &&
          Number.isInteger(s.challenge.rng) &&
          s.challenge.rng >= 0 &&
          s.challenge.rng <= 4294967295 &&
          Number.isInteger(s.challenge.lastRecruit) &&
          s.challenge.lastRecruit >= 0 &&
          s.challenge.lastRecruit <= s.day,
        "Reglas de dificultad inválidas.",
      );
      for (const person of [...s.drivers, ...s.employees])
        G.assert(
          person.salaryPeriod === "day" &&
            (!person.contract || person.contract.period === "day") &&
            Number.isFinite(person.ask) &&
            person.ask >= 10,
          "Unidad salarial incoherente.",
        );
      const identities = s.drivers.map((d) => d.identity);
      G.assert(
        identities.every(
          (id) => Number.isInteger(id) && id >= 0 && id <= 4294967295,
        ) && new Set(identities).size === identities.length,
        "Identidad de piloto inválida o duplicada.",
      );
    },
  });
  G.Pay = {
    daily: (p) => p?.period === "day" || p?.salaryPeriod === "day",
    monthly: (c) => (c ? c.salary * (G.Pay.daily(c) ? 30 : 1) : 0),
    monthlyRate: (rate, p) => rate * (G.Pay.daily(p) ? 30 : 1),
    fields: (p) => (G.Pay.daily(p) ? { period: "day" } : {}),
    unit: (p) => (G.Pay.daily(p) ? "día" : "mes"),
    label: (p) => (G.Pay.daily(p) ? "diario" : "mensual"),
    minimum: (p) => (G.Pay.daily(p) ? 10 : 150),
    durations: (s) => (B.enabled(s) ? [1, 3, 6, 12, 24] : [6, 12, 24]),
  };
  const create = G.createGame;
  G.createLegacyGame = create;
  G.createGame = (...args) => B.initialize(create(...args));
  const budget = G.AI.budget;
  G.AI.budget = function (s, c) {
    const available = budget.call(this, s, c);
    return B.enabled(s)
      ? Math.max(0, Math.min(available, c.balance - B.aiReserve(s, c)))
      : available;
  };
  const driver = G.Drivers.generate;
  G.Drivers.generate = function (s, ...args) {
    const d = driver.call(this, s, ...args);
    return B.enabled(s) ? B.driver(s, d, !!args[0]) : d;
  };
  const employee = S.generate;
  S.generate = function (s, ...args) {
    const e = employee.call(this, s, ...args);
    return B.enabled(s) ? B.employee(s, e) : e;
  };
  const minimum = S.minimum;
  S.minimum = function (s, e, t, id) {
    return B.enabled(s)
      ? Math.max(
          10,
          Math.ceil(
            B.staffAsk(s, e) *
              (t.months <= 3 ? 1.06 : t.months === 24 ? 1.03 : 1) -
              Math.min(e.ask * 0.1, (t.bonus / (t.months * 30)) * 0.6),
          ),
        )
      : minimum.call(this, s, e, t, id);
  };
  const available = P.available;
  P.available = function (s, d) {
    return (
      available.call(this, s, d) &&
      (!B.enabled(s) ||
        d.companyId ||
        this.care(s, d.id)?.recruited ||
        d.marketUntil === undefined ||
        d.marketUntil >= s.day)
    );
  };
  const snapshot = G.Workshop.raceSnapshot;
  G.Workshop.raceSnapshot = function (s, c) {
    return {
      ...snapshot.call(this, s, c),
      ...(B.enabled(s) ? { physicsVersion: 2 } : {}),
    };
  };
  const wear = G.Workshop.wear;
  G.Workshop.wear = function (a, moved, dt, braking) {
    return wear.call(
      this,
      a,
      moved * (a.physicsVersion === 2 ? 1.9 : 1),
      dt,
      braking,
    );
  };
  const job = G.Economy.job;
  G.Economy.job = function (s, id = s.playerId) {
    const result = job.call(this, s, id);
    if (B.enabled(s))
      (id === s.playerId
        ? s.job
        : s.companies.find((c) => c.id === id).job
      ).net = 420;
    return result;
  };
})();
