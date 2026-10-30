"use strict";
(() => {
  const G = RCS,
    clamp = G.clamp;
  const types = [
    {
      name: "Ambicioso",
      ambition: 90,
      security: 25,
      sport: 90,
      patience: 4,
      description:
        "Quiere progresar, correr y cobrar por sus resultados. Prefiere conservar libertad para su próximo salto.",
    },
    {
      name: "Leal",
      ambition: 35,
      security: 90,
      sport: 60,
      patience: 7,
      description:
        "Valora la continuidad y las promesas cumplidas. Acepta ceder algo de sueldo a cambio de estabilidad.",
    },
    {
      name: "Pragmático",
      ambition: 65,
      security: 55,
      sport: 45,
      patience: 5,
      description:
        "Compara el valor completo del acuerdo: sueldo, prima, duración e indemnización.",
    },
    {
      name: "Humilde",
      ambition: 20,
      security: 65,
      sport: 75,
      patience: 7,
      description:
        "Busca una oportunidad y suele acercar posturas. También espera un trato justo cuando demuestra su valor.",
    },
  ];
  const A = (G.DriverAgency = {
    enabled: (s) => s?.driverAgency?.version === 1,
    persona(s, d) {
      const h = G.AuctionContent.hash(`${s.seed}/${d.identity || d.id}/agency`),
        t = types[(h >>> 16) % types.length];
      return {
        ...t,
        ambition: clamp(t.ambition + ((h >>> 8) % 15) - 7, 0, 100),
      };
    },
    initialize(s) {
      if (s.driverAgency !== undefined) {
        G.assert(
          A.enabled(s),
          "Versión de negociación de pilotos incompatible.",
        );
        return s;
      }
      G.assert(
        !s.race && !G.Auctions.active(s),
        "Termina la actividad en directo antes de actualizar los contratos.",
      );
      s.driverAgency = {
        version: 1,
        since: s.day,
        lastDaily: s.day,
        profiles: {},
        renewals: {},
      };
      for (const d of s.drivers) if (d.contract) A.signed(s, d);
      return s;
    },
    profile(s, d) {
      return s.driverAgency?.profiles[d.id];
    },
    signed(s, d) {
      if (!A.enabled(s)) return;
      s.driverAgency.profiles[d.id] = {
        companyId: d.companyId,
        joined: d.contract.start,
        lastReview: s.day,
        rating: G.Drivers.rating(d),
        wins: d.wins,
        starts: d.starts,
        loyalty: 60,
        friction: 0,
        recent: [],
        demand: null,
      };
      delete s.driverAgency.renewals[d.id];
    },
    market(s, d) {
      const p = A.profile(s, d),
        recent = p?.recent || [],
        wins = recent.filter((x) => x.position === 1 && !x.dnf).length,
        podiums = recent.filter((x) => x.position <= 3 && !x.dnf).length;
      return Math.round(
        Math.max(d.ask, G.Challenge.driverAsk(d)) *
          (1 + Math.min(0.3, wins * 0.055 + podiums * 0.012)),
      );
    },
    value(s, d, salary, months, bonus, k) {
      const p = A.persona(s, d),
        market = A.market(s, d),
        days = months * 30;
      const length =
        months <= 1
          ? 0.025
          : months <= 3
            ? 0
            : months >= 12
              ? p.ambition > 70
                ? 0.07
                : -0.04
              : -0.015;
      const role = k?.role === "reserva" ? (p.sport / 100) * 0.1 : 0;
      const future = s.season.events.filter(
        (e) =>
          e.status === "scheduled" && e.day >= s.day && e.day < s.day + days,
      );
      const livePromise =
        k && !k.settled && future.some((e) => k.eventIds.includes(e.id));
      const opportunity =
        k?.role !== "reserva" && livePromise
          ? (((k.promiseShare || 0) * p.sport) / 100) * 0.07
          : 0;
      const security =
        ((((k?.releaseMonths || 1) - 1) * p.security) / 100) * 0.018;
      const restriction = k?.renewalOption ? 0.025 : 0;
      const relationship = d.companyId ? A.profile(s, d) : null;
      const trust = relationship
        ? relationship.friction * 0.002 -
          Math.max(0, relationship.loyalty - 60) * 0.0005
        : 0;
      const base =
        market *
        (0.94 +
          p.ambition * 0.001 +
          length +
          role -
          opportunity -
          security +
          restriction +
          trust);
      // A promised win bonus has an uncertain value; it cannot replace guaranteed pay.
      const recent = A.profile(s, d)?.recent || [],
        winRate =
          (recent.filter((x) => x.position === 1 && !x.dnf).length + 0.5) /
          (recent.length + 5);
      const races = future.length;
      const credit =
        Math.min(market * 0.14, (bonus / days) * (0.8 + p.security / 200)) +
        Math.min(market * 0.08, ((k?.winBonus || 0) * winRate * races) / days);
      return {
        persona: p,
        market,
        floor: Math.max(10, Math.ceil(base * 0.94 - credit)),
        opening: Math.max(10, Math.ceil(base * 1.035 - credit)),
        equivalent: salary + credit,
        credit,
      };
    },
    respond(s, d, salary, months, bonus, k, old, renewal = false) {
      G.assert(
        G.player(s).balance >= bonus,
        G.Feedback.funds(s, bonus, "Pagar la prima"),
      );
      const q = A.value(s, d, salary, months, bonus, k),
        oldModern = old?.agency === 1 ? old : null;
      const floor = renewal
        ? Math.max(Math.ceil(d.contract.salary * 1.08), q.floor)
        : q.floor;
      const opening = Math.max(floor, q.opening);
      const improved = oldModern ? q.equivalent - oldModern.equivalent : 0;
      // Identical bids do not farm concessions. Meaningful improvements let both sides move.
      const concession =
        improved > 0
          ? Math.max(
              1,
              Math.min(
                q.market * 0.065,
                improved * (q.persona.ambition > 70 ? 0.35 : 0.7),
              ),
            )
          : 0;
      const comparable =
        oldModern &&
        oldModern.months === months &&
        JSON.stringify(oldModern.terms || {}) ===
          JSON.stringify(A.plainTerms(k));
      const target = Math.max(
        floor,
        Math.ceil(
          comparable
            ? oldModern.salary - concession - (q.credit - oldModern.credit)
            : opening,
        ),
      );
      if (salary >= target)
        return {
          accepted: true,
          salary,
          reason: "Acepta el conjunto del acuerdo.",
        };
      const attempts = (oldModern?.attempts || 0) + 1,
        insult = salary < floor * 0.65;
      const cooldown =
        attempts >= q.persona.patience || (insult && attempts >= 2)
          ? s.day + (insult ? 7 : 3)
          : s.day;
      const reason = insult
        ? "Esa cifra queda muy lejos de mi valor. Necesito una mejora seria para seguir hablando."
        : k?.role === "reserva" && q.persona.sport >= 60
          ? "Ser reserva limita mi progreso. Compénsalo con sueldo o proponme un papel principal."
          : months >= 12 && q.persona.ambition > 70
            ? "Un contrato tan largo limita mi próximo salto. Prefiero menos meses o una compensación mayor."
            : improved > 0
              ? "Has mejorado el paquete; yo también acerco mi postura. Esta es mi nueva propuesta."
              : "Valoro la oferta completa. Podemos acercarnos mejorando el sueldo, la prima o mis condiciones deportivas.";
      const conversation = [
        ...(oldModern?.conversation || []),
        { day: s.day, offered: salary, counter: target, text: reason },
      ].slice(-8);
      const n = {
        agency: 1,
        salary: target,
        months,
        bonus,
        terms: A.plainTerms(k),
        attempts,
        cooldown,
        equivalent: q.equivalent,
        credit: q.credit,
        conversation,
        reason,
      };
      (renewal ? s.driverAgency.renewals : s.negotiations)[d.id] = n;
      if (insult) d.morale = clamp(d.morale - 2, 0, 100);
      return {
        accepted: false,
        salary: target,
        cooldown: cooldown > s.day,
        reason,
      };
    },
    plainTerms(k) {
      if (!k) return {};
      return Object.fromEntries(
        [
          "role",
          "winBonus",
          "releaseMonths",
          "promiseShare",
          "renewalOption",
        ].map((key) => [key, k[key]]),
      );
    },
    review(s, d) {
      const p = A.profile(s, d);
      if (
        !p ||
        !d.contract ||
        p.companyId !== d.companyId ||
        p.demand?.status === "pending"
      )
        return;
      const personality = A.persona(s, d),
        wins = d.wins - p.wins,
        gain = G.Drivers.rating(d) - p.rating;
      const waited = s.day - p.lastReview,
        market = A.market(s, d),
        underpaid =
          market > d.contract.salary * (personality.ambition > 70 ? 1.1 : 1.17);
      if (waited < 21 || !underpaid || (wins < 3 && gain < 5 && waited < 90))
        return;
      const salary = Math.min(
        10000,
        Math.max(
          d.contract.salary + 1,
          Math.ceil(market * (personality.ambition > 70 ? 1.02 : 0.96)),
        ),
      );
      p.lastReview = s.day;
      p.demand = {
        day: s.day,
        deadline: s.day + 14,
        salary,
        status: "pending",
        attempts: 0,
        reason: `${wins} victorias desde la última revisión y valoración ${G.Drivers.rating(d)}. Cobra $${d.contract.salary}/${G.Pay.unit(d)}; su referencia actual es $${market}.`,
      };
      G.Contracts.remember(
        d,
        s.day,
        `Pide revisar su sueldo a $${salary}/${G.Pay.unit(d)} por su progresión y resultados.`,
      );
      if (d.companyId === s.playerId)
        G.news(
          s,
          "Fichajes",
          `${d.name} pide un aumento por sus resultados.`,
          `${p.demand.reason} Responde antes del ${G.dateAt(p.demand.deadline).toISOString().slice(0, 10)}. El contrato no cambia sin tu acuerdo.`,
          "team",
          d.id,
        );
    },
    answer(s, id, salary) {
      G.ensurePlayable(s);
      const d = G.ownedDrivers(s).find((d) => d.id === id),
        p = d && A.profile(s, d),
        q = p?.demand;
      G.assert(
        !s.race && q?.status === "pending" && s.day <= q.deadline,
        "Esta petición salarial ya no está pendiente. Consulta el equipo.",
      );
      const ambitious = A.persona(s, d).ambition > 70;
      if (salary === null) {
        A.refuse(s, d, "refused");
        return { accepted: false, refused: true };
      }
      G.assert(
        Number.isInteger(salary) &&
          salary > d.contract.salary &&
          salary <= 10000,
        "Propón un sueldo superior al actual, hasta $10 000 por día.",
      );
      const floor = Math.max(
        d.contract.salary + 1,
        Math.ceil(q.salary * (ambitious ? 0.96 : 0.89)),
      );
      if (salary < floor) {
        q.attempts++;
        q.salary = Math.max(
          floor,
          Math.ceil(q.salary - (q.salary - salary) * (ambitious ? 0.15 : 0.3)),
        );
        return {
          accepted: false,
          salary: q.salary,
          reason:
            "La mejora todavía es pequeña. El piloto ha ajustado su petición.",
        };
      }
      G.assert(
        G.player(s).balance >= salary * 7,
        `Necesitas $${salary * 7} de reserva para siete días del nuevo sueldo. El aumento se cobra cada jornada.`,
      );
      d.contract.salary = salary;
      q.status = "accepted";
      p.loyalty = clamp(p.loyalty + 8, 0, 100);
      p.friction = Math.max(0, p.friction - 15);
      p.wins = d.wins;
      p.rating = G.Drivers.rating(d);
      p.lastReview = s.day;
      d.morale = clamp(d.morale + 7, 0, 100);
      G.Contracts.remember(
        d,
        s.day,
        `Acuerda un aumento a $${salary}/${G.Pay.unit(d)}. Se conserva el plazo y todas las cláusulas.`,
      );
      return { accepted: true, salary };
    },
    refuse(s, d, status) {
      const p = A.profile(s, d),
        ambitious = A.persona(s, d).ambition > 70;
      p.demand.status = status;
      p.lastReview = s.day + 21;
      p.friction = clamp(p.friction + (ambitious ? 22 : 12), 0, 100);
      p.loyalty = clamp(p.loyalty - (ambitious ? 12 : 7), 0, 100);
      d.morale = clamp(d.morale - (ambitious ? 10 : 6), 0, 100);
      G.Contracts.remember(
        d,
        s.day,
        status === "expired"
          ? "Su petición de aumento quedó sin respuesta; pierde confianza en el equipo."
          : "Aumento rechazado. Cumple su contrato, pero negociará su futuro con menos confianza.",
      );
    },
    daily(s) {
      if (!A.enabled(s) || s.driverAgency.lastDaily >= s.day) return;
      s.driverAgency.lastDaily = s.day;
      for (const d of s.drivers) {
        if (!d.contract) {
          delete s.driverAgency.profiles[d.id];
          delete s.driverAgency.renewals[d.id];
          continue;
        }
        let p = A.profile(s, d);
        if (
          !p ||
          p.companyId !== d.companyId ||
          p.joined !== d.contract.start
        ) {
          A.signed(s, d);
          p = A.profile(s, d);
        }
        A.review(s, d);
        const q = p.demand;
        if (q?.status === "pending") {
          const c = s.companies.find((c) => c.id === d.companyId);
          if (
            d.companyId !== s.playerId &&
            c.balance >
              (G.Companies.monthly(s, c.id) / 30 +
                q.salary -
                d.contract.salary) *
                21
          ) {
            d.contract.salary = q.salary;
            q.status = "accepted";
            p.wins = d.wins;
            p.rating = G.Drivers.rating(d);
            p.loyalty = clamp(p.loyalty + 5, 0, 100);
          } else if (s.day > q.deadline) A.refuse(s, d, "expired");
        }
      }
    },
    renew(s, id, salary, months) {
      G.ensurePlayable(s);
      const d = G.ownedDrivers(s).find((d) => d.id === id),
        k = d?.contract?.clauses;
      G.assert(
        !s.race &&
          d &&
          d.contract.end > s.day &&
          d.contract.end - s.day <= 60 &&
          G.Pay.durations(s).includes(months),
        "La renovación se abre en los últimos 60 días del contrato y fuera de carrera.",
      );
      G.assert(
        Number.isInteger(salary) && salary >= 10 && salary <= 10000,
        "Sueldo de renovación inválido.",
      );
      const old = s.driverAgency.renewals[id];
      G.assert(
        !old || old.cooldown <= s.day,
        `La conversación se retoma dentro de ${(old?.cooldown || s.day) - s.day} días.`,
      );
      let result;
      if (k?.renewalOption && !k.renewalUsed) {
        const fixed = Math.ceil(d.contract.salary * 1.03);
        G.assert(
          salary >= fixed,
          `La opción pactada permite renovar desde $${fixed}/${G.Pay.unit(d)}.`,
        );
        result = { accepted: true };
      } else result = A.respond(s, d, salary, months, 0, k, old, true);
      if (!result.accepted) return result;
      d.contract.salary = salary;
      d.contract.end += months * 30;
      if (k) k.renewalUsed = true;
      const p = A.profile(s, d);
      if (p) {
        p.lastReview = s.day;
        p.wins = d.wins;
        p.rating = G.Drivers.rating(d);
        if (p.demand?.status === "pending") p.demand.status = "accepted";
        p.friction = Math.max(0, p.friction - 10);
      }
      delete s.driverAgency.renewals[id];
      G.Contracts.remember(
        d,
        s.day,
        `Renueva ${months} meses por $${salary}/${G.Pay.unit(d)} tras negociar su futuro.`,
      );
      return { accepted: true };
    },
    validate(s) {
      if (s.driverAgency === undefined) return;
      const x = s.driverAgency;
      G.assert(
        A.enabled(s) &&
          Number.isInteger(x.since) &&
          x.since >= 0 &&
          x.since <= s.day &&
          Number.isInteger(x.lastDaily) &&
          x.lastDaily <= s.day &&
          x.profiles &&
          !Array.isArray(x.profiles) &&
          x.renewals &&
          !Array.isArray(x.renewals),
        "Gestión de representantes inválida.",
      );
      for (const [id, p] of Object.entries(x.profiles)) {
        G.assert(
          s.drivers.some((d) => d.id === id) &&
            s.companies.some((c) => c.id === p.companyId) &&
            [
              p.joined,
              p.lastReview,
              p.rating,
              p.wins,
              p.starts,
              p.loyalty,
              p.friction,
            ].every(Number.isFinite) &&
            p.joined >= 0 &&
            p.joined <= s.day &&
            p.loyalty >= 0 &&
            p.loyalty <= 100 &&
            p.friction >= 0 &&
            p.friction <= 100 &&
            Array.isArray(p.recent) &&
            p.recent.length <= 8,
          "Relación contractual del piloto inválida.",
        );
        G.assert(
          new Set(p.recent.map((r) => r.eventId)).size === p.recent.length &&
            p.recent.every(
              (r) =>
                Number.isInteger(r.day) &&
                r.day <= s.day &&
                Number.isInteger(r.position) &&
                r.position >= 1 &&
                Number.isInteger(r.field) &&
                r.position <= r.field &&
                typeof r.dnf === "boolean" &&
                ["street", "pro", "national"].includes(r.cup),
            ),
          "Resultados recientes del representante inválidos.",
        );
        if (p.demand)
          G.assert(
            ["pending", "accepted", "refused", "expired"].includes(
              p.demand.status,
            ) &&
              Number.isInteger(p.demand.salary) &&
              p.demand.salary >= 10 &&
              p.demand.salary <= 10000 &&
              Number.isInteger(p.demand.day) &&
              p.demand.day <= s.day &&
              p.demand.deadline === p.demand.day + 14 &&
              Number.isInteger(p.demand.attempts) &&
              p.demand.attempts >= 0 &&
              typeof p.demand.reason === "string" &&
              p.demand.reason.length < 500,
            "Petición salarial del piloto inválida.",
          );
      }
      for (const map of [x.renewals, s.negotiations])
        for (const [id, n] of Object.entries(map))
          if (n.agency !== undefined) {
            G.assert(
              s.drivers.some((d) => d.id === id) &&
                n.agency === 1 &&
                Number.isInteger(n.salary) &&
                n.salary >= 10 &&
                n.salary <= 10000 &&
                G.Pay.durations(s).includes(n.months) &&
                Number.isInteger(n.bonus) &&
                n.bonus >= 0 &&
                n.bonus <= 5000 &&
                Number.isInteger(n.cooldown) &&
                n.cooldown <= s.day + 7 &&
                Number.isInteger(n.attempts) &&
                n.attempts > 0 &&
                Number.isFinite(n.equivalent) &&
                Number.isFinite(n.credit) &&
                Array.isArray(n.conversation) &&
                n.conversation.length <= 8 &&
                n.conversation.every(
                  (c) =>
                    Number.isInteger(c.day) &&
                    c.day <= s.day &&
                    Number.isInteger(c.offered) &&
                    Number.isInteger(c.counter) &&
                    typeof c.text === "string" &&
                    c.text.length < 500,
                ),
              "Conversación contractual inválida.",
            );
          }
    },
  });
  const create = G.createGame;
  G.createV131Game = create;
  G.createGame = function (...args) {
    const s = create(...args);
    A.initialize(s);
    return s;
  };
  const renew = G.Contracts.renewDriver;
  G.Contracts.renewDriver = function (
    s,
    id,
    salary,
    months = 12,
    cid = s.playerId,
  ) {
    return A.enabled(s) && cid === s.playerId
      ? A.renew(s, id, salary, months)
      : renew.call(this, s, id, salary, months, cid);
  };
  const finish = G.Race.finish;
  G.Race.finish = function (s, ...args) {
    const r = s.race,
      result = finish.call(this, s, ...args);
    if (A.enabled(s) && r?.finished) {
      const e = s.season.events.find((e) => e.id === r.eventId);
      for (const row of e?.results || []) {
        const d = s.drivers.find((d) => d.id === row.driverId),
          p = d && A.profile(s, d);
        if (
          !p ||
          p.companyId !== row.companyId ||
          p.recent.some((x) => x.eventId === e.id)
        )
          continue;
        p.recent.push({
          day: s.day,
          eventId: e.id,
          position: row.position,
          field: e.results.length,
          cup: e.cup,
          dnf: row.dnf,
        });
        p.recent = p.recent.slice(-8);
        A.review(s, d);
      }
    }
    return result;
  };
})();
