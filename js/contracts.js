"use strict";
(() => {
  const G = RCS;
  const money = (n) => Math.round(n * 100) / 100;
  const unique = (a) => Array.isArray(a) && new Set(a).size === a.length;
  const active = (s, id) =>
    s.companies.find((c) => c.id === id && c.status === "active");
  const C = (G.Contracts = {
    initialize(s) {
      if (s.commercial !== undefined) {
        G.assert(s.commercial.version === 1, "Versión comercial incompatible.");
        return s;
      }
      s.commercial = {
        version: 1,
        providers: [],
        offers: [],
        contracts: [],
        negotiations: {},
        profiles: {},
        loans: [],
        bank: { name: "Banco Circuito · entidad ficticia", balance: 150000 },
      };
      const definitions = [
        [
          "Faro Seguros",
          "financial",
          "seguros",
          "#4e7a9a",
          1200,
          380,
          null,
          null,
        ],
        [
          "Voltio Energy",
          "financial",
          "energía",
          "#b76534",
          1000,
          420,
          null,
          null,
        ],
        [
          "Nexo Energy",
          "financial",
          "energía",
          "#7e659e",
          1400,
          320,
          null,
          null,
        ],
        [
          "Ápice Frenos",
          "technical",
          "frenos",
          "#398475",
          1600,
          450,
          null,
          "brakes-club",
        ],
        [
          "Proyecto NB",
          "manufacturer",
          "fabricante",
          "#b44e41",
          2200,
          500,
          1,
          null,
        ],
      ];
      for (const [
        name,
        kind,
        sector,
        color,
        advance,
        perRound,
        modelIndex,
        partDefinition,
      ] of definitions) {
        s.commercial.providers.push({
          id: G.uid(s, "sponsor"),
          name,
          kind,
          sector,
          color,
          advance,
          perRound,
          modelIndex,
          partDefinition,
          balance: 35000,
          ledger: [],
        });
      }
      this.openSeason(s);
      return s;
    },
    preferred(s, id, normal) {
      if (id === s.playerId) return normal;
      for (const c of this.live(s, id)) {
        const p = s.commercial.providers.find((p) => p.id === c.providerId);
        const d = G.ownedDrivers(s, id).find(
          (d) => d.id === c.driverId && d.contract && d.fatigue < 90,
        );
        if (d) normal.driver = d;
        const car = G.ownedCars(s, id)
          .filter(
            (car) =>
              !car.repair &&
              !G.Market.listed(s, car.id) &&
              car.hp <= 210 &&
              G.Workshop.ready(car),
          )
          .find(
            (car) =>
              (p.modelIndex === null || car.modelIndex === p.modelIndex) &&
              (!p.partDefinition ||
                Object.values(car.installed).some(
                  (id) =>
                    s.parts.find((part) => part.id === id)?.definitionId ===
                    p.partDefinition,
                )),
          );
        if (car && (p.modelIndex !== null || p.partDefinition))
          normal.car = car;
      }
      return normal;
    },
    profile(s, id) {
      return (s.commercial.profiles[id] ||= {
        relations: {},
        defaults: 0,
        repaid: 0,
      });
    },
    relation(s, cid, pid) {
      return s.commercial?.profiles[cid]?.relations[pid] || 0;
    },
    changeRelation(s, cid, pid, n) {
      const p = this.profile(s, cid);
      p.relations[pid] = G.clamp((p.relations[pid] || 0) + n, -100, 100);
    },
    providerMove(s, p, n, label) {
      G.assert(
        Number.isFinite(n) && p.balance + n >= -0.001,
        "El patrocinador no puede financiar este acuerdo.",
      );
      p.balance = money(p.balance + n);
      p.ledger.unshift({ day: s.day, amount: money(n), label });
      p.ledger.length = Math.min(100, p.ledger.length);
    },
    remember(d, day, event) {
      d.memory.push({ day, event });
      d.memory = d.memory.slice(-30);
    },
    openSeason(s) {
      if (
        !s.commercial ||
        !s.season.events.some((e) => e.status === "scheduled")
      )
        return;
      for (const p of s.commercial.providers) {
        if (
          s.commercial.offers.some(
            (o) => o.year === s.season.year && o.providerId === p.id,
          )
        )
          continue;
        const imposed =
          p.kind === "manufacturer"
            ? [...s.drivers]
                .filter((d) => !d.companyId)
                .sort(
                  (a, b) =>
                    G.Drivers.rating(a) - G.Drivers.rating(b) ||
                    a.id.localeCompare(b.id),
                )[0]
            : null;
        s.commercial.offers.push({
          id: G.uid(s, "sponsorship"),
          providerId: p.id,
          year: s.season.year,
          deadline: s.day + 10,
          decisionDay: s.day + (p.kind === "manufacturer" ? 8 : 5),
          status: "open",
          winnerId: null,
          declined: [],
          driverId: imposed?.id || null,
        });
      }
    },
    live(s, cid = s.playerId) {
      return (s.commercial?.contracts || []).filter(
        (c) => c.companyId === cid && c.status === "active",
      );
    },
    future(s) {
      return s.season.events.filter((e) => e.status === "scheduled");
    },
    baseTerms(s, o) {
      const p = s.commercial.providers.find((p) => p.id === o.providerId);
      return {
        advance: p.advance,
        perRound: p.perRound,
        share: p.kind === "manufacturer" ? 0.7 : 0.5,
        promotions: p.kind === "manufacturer" ? 1 : 0,
        targetPosition: 5,
      };
    },
    quote(s, id, proposal, companyId = s.playerId) {
      const o = s.commercial.offers.find((o) => o.id === id),
        p = s.commercial.providers.find((p) => p.id === o?.providerId),
        company = active(s, companyId);
      G.assert(o && p && company, "Acuerdo comercial no disponible.");
      const t = { ...this.baseTerms(s, o), ...proposal };
      G.assert(
        Number.isInteger(t.advance) &&
          t.advance >= 0 &&
          t.advance <= 10000 &&
          Number.isInteger(t.perRound) &&
          t.perRound >= 0 &&
          t.perRound <= 3000 &&
          [0.5, 0.7, 1].includes(t.share) &&
          [0, 1, 2].includes(t.promotions) &&
          [3, 5, 8].includes(t.targetPosition),
        "Propuesta comercial inválida.",
      );
      const events = this.future(s),
        existing = this.live(s, companyId),
        base = this.baseTerms(s, o);
      let reason = "";
      if (s.race || (s.status !== "active" && companyId === s.playerId))
        reason = "Termina la carrera antes de firmar.";
      else if (
        o.status !== "open" ||
        o.deadline < s.day ||
        o.year !== s.season.year ||
        o.declined.includes(companyId) ||
        !events.length
      )
        reason = "La convocatoria ya no está disponible.";
      else if (this.live(s, companyId).length >= 3)
        reason = "La compañía ya tiene tres acuerdos activos.";
      else if (
        existing.some(
          (c) =>
            s.commercial.providers.find((p) => p.id === c.providerId).sector ===
            p.sector,
        )
      )
        reason =
          "La exclusividad impide contratar otra marca del mismo sector.";
      else if (
        s.commercial.contracts.some(
          (c) => c.providerId === p.id && c.status === "active",
        )
      )
        reason =
          "El presupuesto de esta marca ya está comprometido con otra compañía.";
      const d = s.drivers.find((d) => d.id === o.driverId);
      if (
        !reason &&
        o.driverId &&
        (!d || (d.companyId && d.companyId !== companyId))
      )
        reason = "El piloto impuesto ya pertenece a otra compañía.";
      if (
        !reason &&
        o.driverId &&
        !d.companyId &&
        G.ownedDrivers(s, companyId).length >= company.driverCapacity
      )
        reason = "Necesitas una plaza libre para el piloto impuesto.";
      let vehicle = null;
      if (
        !reason &&
        p.kind === "manufacturer" &&
        !G.ownedCars(s, companyId).some((c) => c.modelIndex === p.modelIndex)
      ) {
        const listing = s.market
          .filter(
            (l) =>
              l.sellerId !== companyId &&
              s.cars.find((c) => c.id === l.carId)?.modelIndex === p.modelIndex,
          )
          .sort((a, b) => a.price - b.price)[0];
        if (!listing)
          reason = "No queda una unidad del modelo requerido en el mercado.";
        else if (G.ownedCars(s, companyId).length >= company.carCapacity)
          reason = "Necesitas una plaza libre para el vehículo financiado.";
        else
          vehicle = {
            listingId: listing.id,
            carId: listing.carId,
            price: listing.price,
          };
      }
      if (
        !reason &&
        ((d && !d.companyId) || vehicle) &&
        company.balance + t.advance < 0
      )
        reason =
          "El anticipo no cubre el descubierto para transferir los activos.";
      if (!reason && d && !d.companyId && G.Market.locked(s, d.id))
        reason = "El piloto impuesto no está disponible para contratar.";
      const relation = this.relation(s, companyId, p.id),
        total = t.advance + t.perRound * events.length;
      const maximum = Math.round(
        (p.advance + p.perRound * events.length) *
          G.clamp(
            0.94 +
              company.reputation * 0.005 +
              relation * 0.001 +
              (t.share - base.share) * 0.28 +
              t.promotions * 0.07 +
              (5 - t.targetPosition) * 0.018,
            0.72,
            1.45,
          ),
      );
      const finishBonus = 600,
        exitFee = p.kind === "manufacturer" ? 900 : 450;
      if (!reason && t.share < base.share)
        reason = "La marca no acepta reducir tanto su presencia en pista.";
      if (!reason && total > maximum)
        reason =
          "La contraprestación solicitada supera la valoración de la marca.";
      if (!reason && p.balance < total + finishBonus + (vehicle?.price || 0))
        reason = "La marca no dispone de presupuesto suficiente.";
      if (!reason && p.kind === "manufacturer" && t.promotions < 1)
        reason = "El programa exige al menos un acto promocional.";
      return {
        accepted: !reason,
        reason,
        terms: t,
        maximum,
        finishBonus,
        exitFee,
        vehicle,
        driverId: o.driverId,
        eventIds: events.map((e) => e.id),
        cost: total + finishBonus + (vehicle?.price || 0),
      };
    },
    negotiate(s, id, proposal, companyId = s.playerId) {
      G.assert(!s.race, "Termina la carrera antes de negociar.");
      const key = companyId + "|" + id,
        old = s.commercial.negotiations[key];
      G.assert(
        !old || old.cooldown <= s.day,
        "La marca pide esperar tres días antes de otra propuesta.",
      );
      const q = this.quote(s, id, proposal, companyId);
      let terms = q.terms;
      if (!q.accepted) {
        const o = s.commercial.offers.find((o) => o.id === id),
          base = this.baseTerms(s, o);
        const share = Math.max(base.share, terms.share),
          promotions = Math.max(base.promotions, terms.promotions);
        const candidate = this.quote(
            s,
            id,
            { ...terms, share, promotions },
            companyId,
          ),
          total = terms.advance + terms.perRound * candidate.eventIds.length;
        const ratio = Math.min(1, candidate.maximum / Math.max(1, total));
        terms = {
          ...terms,
          share,
          promotions,
          advance: Math.floor(terms.advance * ratio),
          perRound: Math.floor(terms.perRound * ratio),
        };
      }
      const attempts = (old?.attempts || 0) + 1;
      const result = {
        terms,
        accepted: q.accepted,
        reason: q.reason,
        attempts,
        cooldown: !q.accepted && attempts >= 3 ? s.day + 3 : s.day,
      };
      s.commercial.negotiations[key] = result;
      return result;
    },
    sign(s, id, proposal, companyId = s.playerId) {
      const q = this.quote(s, id, proposal, companyId);
      G.assert(q.accepted, q.reason);
      const o = s.commercial.offers.find((o) => o.id === id),
        p = s.commercial.providers.find((p) => p.id === o.providerId),
        c = active(s, companyId);
      const d = s.drivers.find((d) => d.id === o.driverId);
      // Se validan todos los recursos antes de mover dinero o transferir activos.
      if (d && !d.companyId)
        G.assert(
          c.balance + q.terms.advance >= 0,
          "No puedes asumir este fichaje en descubierto.",
        );
      const contract = {
        id: G.uid(s, "agreement"),
        offerId: o.id,
        providerId: p.id,
        companyId,
        year: o.year,
        status: "active",
        start: s.day,
        terms: q.terms,
        eventIds: q.eventIds,
        checkedIds: [],
        fulfilledIds: [],
        rounds: [],
        escrow: q.terms.perRound * q.eventIds.length + q.finishBonus,
        finishBonus: q.finishBonus,
        exitFee: q.exitFee,
        vehicleFunding: q.vehicle?.price || 0,
        carId: q.vehicle?.carId || null,
        driverId: o.driverId,
        logo: true,
        promotions: 0,
        promotionUntil: null,
        closedDay: null,
        penalty: 0,
      };
      this.providerMove(s, p, -q.cost, `Reserva íntegra · ${c.name}`);
      s.commercial.contracts.push(contract);
      o.status = "awarded";
      o.winnerId = companyId;
      G.Economy.transact(
        s,
        companyId,
        q.terms.advance,
        "Patrocinios",
        `Anticipo · ${p.name}`,
      );
      if (q.vehicle) {
        G.Economy.transact(
          s,
          companyId,
          q.vehicle.price,
          "Patrocinios",
          `Capital para vehículo · ${p.name}`,
        );
        G.Market.buy(s, q.vehicle.listingId, companyId);
      }
      if (d && !d.companyId) G.Companies.sign(s, d.id, companyId, d.ask, 12, 0);
      this.changeRelation(s, companyId, p.id, 2);
      G.news(
        s,
        "Finanzas",
        `${c.name} firma con ${p.name}.`,
        `${p.kind === "manufacturer" ? "Programa ficticio de fabricante. " : ""}Anticipo $${q.terms.advance}, $${q.terms.perRound} por ronda conforme y presencia mínima del ${Math.round(q.terms.share * 100)} %.${d ? " Piloto impuesto: " + d.name + "." : ""} El dinero restante queda reservado; incumplir puede exigir devolver el anticipo y el capital del coche.`,
        "contracts",
        contract.id,
      );
      return contract;
    },
    decline(s, id) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera.");
      const o = s.commercial.offers.find((o) => o.id === id);
      G.assert(
        o?.status === "open" && !o.declined.includes(s.playerId),
        "Oferta no disponible.",
      );
      o.declined.push(s.playerId);
    },
    marks(s, cid) {
      return this.live(s, cid)
        .filter((c) => c.logo)
        .map((c) => {
          const p = s.commercial.providers.find((p) => p.id === c.providerId);
          return {
            name: p.name,
            color: p.color,
            short: p.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 3),
          };
        });
    },
    promotion(s, id) {
      G.ensurePlayable(s);
      const c = this.live(s).find((c) => c.id === id);
      G.assert(
        c &&
          !s.race &&
          !c.promotionUntil &&
          c.promotions < c.terms.promotions &&
          (!G.nextEvent(s) || G.nextEvent(s).day > s.day),
        "No puedes programar este acto hoy.",
      );
      G.Economy.spend(s, 80, "Promoción", "Acto de marca · un día");
      c.promotionUntil = s.day + 1;
    },
    toggleLogo(s, id) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de cambiar la marca.");
      const c = this.live(s).find((c) => c.id === id);
      G.assert(c, "Acuerdo no disponible.");
      c.logo = !c.logo;
    },
    exitCost(c) {
      return Math.round(
        (c.terms.advance + c.vehicleFunding) *
          (1 - c.fulfilledIds.length / c.eventIds.length) +
          c.exitFee,
      );
    },
    close(s, c, status, reason) {
      const p = s.commercial.providers.find((p) => p.id === c.providerId),
        company = s.companies.find((x) => x.id === c.companyId);
      G.assert(c.status === "active", "Este acuerdo ya se ha liquidado.");
      c.status = status;
      c.closedDay = s.day;
      c.promotionUntil = null;
      if (status !== "completed") {
        c.penalty = this.exitCost(c);
        G.Economy.transact(
          s,
          c.companyId,
          -c.penalty,
          "Contratos",
          `Devolución e indemnización · ${p.name}`,
        );
        this.providerMove(
          s,
          p,
          c.penalty,
          "Recuperación de anticipo e indemnización",
        );
        company.reputation = G.clamp(company.reputation - 2, 0, 100);
        this.changeRelation(s, c.companyId, p.id, -18);
      } else {
        company.reputation = G.clamp(company.reputation + 0.6, 0, 100);
        this.changeRelation(s, c.companyId, p.id, 8);
      }
      this.providerMove(s, p, c.escrow, "Liberación de reserva no utilizada");
      c.escrow = 0;
      G.news(
        s,
        "Finanzas",
        `${p.name}: acuerdo ${status === "completed" ? "cumplido" : status === "terminated" ? "rescindido" : "incumplido"}.`,
        `${company.name}: ${reason}${c.penalty ? " Devolución y penalización: $" + c.penalty + "." : ""}`,
        "contracts",
        c.id,
      );
    },
    cancel(s, id) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de rescindir.");
      const c = this.live(s).find((c) => c.id === id);
      G.assert(c, "Acuerdo no disponible.");
      G.assert(
        G.player(s).balance >= this.exitCost(c),
        "No hay fondos para la rescisión; revisa el coste antes de firmar.",
      );
      this.close(s, c, "terminated", "Rescisión voluntaria.");
    },
    checkRound(s, c, e, row, entrant) {
      const p = s.commercial.providers.find((p) => p.id === c.providerId),
        car = s.cars.find((x) => x.id === row?.carId),
        issues = [];
      if (!row) issues.push("sin participación");
      if (!c.logo) issues.push("logotipo retirado");
      if (c.driverId && row?.driverId !== c.driverId)
        issues.push("no participa el piloto impuesto");
      if (p.modelIndex !== null && car?.modelIndex !== p.modelIndex)
        issues.push("vehículo distinto del pactado");
      if (
        p.partDefinition &&
        !Object.values(entrant?.installedParts || {}).some(
          (id) =>
            s.parts.find((part) => part.id === id)?.definitionId ===
            p.partDefinition,
        ) &&
        !(entrant?.sponsorParts || []).includes(p.partDefinition)
      ) {
        if (
          !car ||
          !Object.values(car.installed).some(
            (id) =>
              s.parts.find((part) => part.id === id)?.definitionId ===
              p.partDefinition,
          )
        )
          issues.push("falta la pieza comprometida");
      }
      return issues;
    },
    raceFinished(s, e, r) {
      if (!s.commercial) return;
      for (const c of this.live(s).concat(
        s.commercial.contracts.filter(
          (c) => c.companyId !== s.playerId && c.status === "active",
        ),
      )) {
        if (!c.eventIds.includes(e.id) || c.checkedIds.includes(e.id)) continue;
        const row = e.results.find((row) => row.companyId === c.companyId),
          entrant = r.entrants.find((a) => a.companyId === c.companyId),
          issues = this.checkRound(s, c, e, row, entrant);
        c.checkedIds.push(e.id);
        c.rounds.push({ eventId: e.id, day: s.day, issues });
        if (!issues.length) {
          c.fulfilledIds.push(e.id);
          c.escrow = money(c.escrow - c.terms.perRound);
          G.Economy.transact(
            s,
            c.companyId,
            c.terms.perRound,
            "Patrocinios",
            `Ronda conforme · ${s.commercial.providers.find((p) => p.id === c.providerId).name}`,
          );
        } else
          G.news(
            s,
            "Finanzas",
            "Ronda sin pago de patrocinio.",
            `${s.companies.find((x) => x.id === c.companyId).name}: ${issues.join("; ")}. La cuota se retiene; revisa la presencia mínima antes de la siguiente ronda.`,
            "contracts",
            c.id,
          );
        if (c.checkedIds.length === c.eventIds.length) {
          const enough =
              c.fulfilledIds.length >=
              Math.ceil(c.eventIds.length * c.terms.share),
            promo = c.promotions >= c.terms.promotions;
          if (enough && promo) {
            const pos =
              G.leaderboard(s).findIndex(
                (row) => row.company.id === c.companyId,
              ) + 1;
            if (pos > 0 && pos <= c.terms.targetPosition) {
              c.escrow -= c.finishBonus;
              G.Economy.transact(
                s,
                c.companyId,
                c.finishBonus,
                "Patrocinios",
                "Objetivo de clasificación cumplido",
              );
            }
            this.close(
              s,
              c,
              "completed",
              `${c.fulfilledIds.length}/${c.eventIds.length} rondas conformes y actos promocionales cumplidos.`,
            );
          } else
            this.close(
              s,
              c,
              "breached",
              `${c.fulfilledIds.length}/${c.eventIds.length} rondas conformes; exigidas ${Math.ceil(c.eventIds.length * c.terms.share)}. Actos: ${c.promotions}/${c.terms.promotions}.`,
            );
        }
      }
      for (const d of s.drivers.filter((d) => d.contract?.clauses)) {
        const k = d.contract.clauses;
        if (k.processedIds.includes(e.id)) continue;
        k.processedIds.push(e.id);
        const row = e.results.find(
          (row) => row.driverId === d.id && row.companyId === d.companyId,
        );
        if (row?.position === 1 && !row.dnf && k.winBonus)
          G.Economy.transact(
            s,
            d.companyId,
            -k.winBonus,
            "Salarios",
            `Prima de victoria · ${d.name}`,
          );
        if (k.eventIds.includes(e.id)) {
          k.checkedIds.push(e.id);
          if (row) k.usedIds.push(e.id);
          if (k.checkedIds.length === k.eventIds.length)
            this.settlePromise(s, d);
        }
      }
    },
    driverTerms(s, months, terms = {}) {
      const t = {
        role: "principal",
        winBonus: 0,
        releaseMonths: 1,
        promiseShare: 0,
        renewalOption: false,
        ...terms,
      };
      G.assert(
        ["principal", "reserva"].includes(t.role) &&
          Number.isInteger(t.winBonus) &&
          t.winBonus >= 0 &&
          t.winBonus <= 1500 &&
          [1, 2, 3].includes(t.releaseMonths) &&
          [0, 0.5, 0.7, 1].includes(t.promiseShare) &&
          typeof t.renewalOption === "boolean",
        "Cláusulas de piloto inválidas.",
      );
      const eventIds = this.future(s)
        .filter((e) => e.day < s.day + months * 30)
        .map((e) => e.id);
      G.assert(
        !t.promiseShare || eventIds.length,
        "No quedan rondas para prometer participación.",
      );
      return {
        ...t,
        eventIds,
        checkedIds: [],
        usedIds: [],
        processedIds: [],
        settled: false,
        renewalUsed: false,
      };
    },
    salaryMinimum(d, months, bonus, k) {
      const conventional =
        d.ask * (months === 6 ? 1.1 : months === 24 ? 0.96 : 1) -
        Math.min(bonus / 12, d.ask * 0.12);
      if (!k) return Math.round(conventional);
      return Math.round(
        conventional *
          (1 -
            (k.role === "reserva" ? 0.035 : 0) -
            Math.min(0.08, k.winBonus / 15000) -
            (k.releaseMonths - 1) * 0.02 -
            k.promiseShare * 0.045 +
            (k.renewalOption ? 0.025 : 0)),
      );
    },
    settlePromise(s, d) {
      const k = d.contract?.clauses;
      if (!k || k.settled) return;
      k.settled = true;
      if (!k.promiseShare || !k.eventIds.length) return;
      const kept =
        k.usedIds.length >= Math.ceil(k.eventIds.length * k.promiseShare);
      d.morale = G.clamp(d.morale + (kept ? 5 : -15), 0, 100);
      this.remember(
        d,
        s.day,
        kept
          ? "Promesa de participación cumplida"
          : "Promesa de participación incumplida: conflicto con la dirección",
      );
      G.news(
        s,
        "Fichajes",
        `${d.name}: promesa ${kept ? "cumplida" : "incumplida"}.`,
        `${k.usedIds.length}/${k.eventIds.length} participaciones; mínimo ${Math.round(k.promiseShare * 100)} %. Moral ${Math.round(d.morale)} %.`,
        "driver",
        d.id,
      );
    },
    renewDriver(s, id, salary, months = 12) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de renovar.");
      const d = G.ownedDrivers(s).find((d) => d.id === id),
        k = d?.contract?.clauses;
      G.assert(
        d &&
          d.contract.end - s.day <= 60 &&
          d.contract.end > s.day &&
          [6, 12, 24].includes(months),
        "La renovación se abre en los últimos 60 días.",
      );
      const minimum = Math.ceil(
        d.contract.salary * (k?.renewalOption && !k.renewalUsed ? 1.03 : 1.08),
      );
      G.assert(
        Number.isInteger(salary) && salary >= minimum && salary <= 10000,
        `El representante pide al menos $${minimum} al mes.`,
      );
      d.contract.salary = salary;
      d.contract.end += months * 30;
      if (k) k.renewalUsed = true;
      this.remember(
        d,
        s.day,
        `Renovación por ${months} meses; salario $${salary}`,
      );
      G.news(
        s,
        "Fichajes",
        `${d.name} renueva su contrato.`,
        `El contrato se amplía ${months} meses sin liquidar ni borrar el salario devengado. Nuevo salario: $${salary}/mes.`,
        "driver",
        id,
      );
    },
    nextPayments(s, id = s.playerId) {
      return (s.commercial?.loans || [])
        .filter((l) => l.companyId === id && l.status !== "repaid")
        .reduce(
          (n, l) =>
            n +
            l.schedule
              .filter((p) => !p.paid && p.due <= s.day + 30)
              .reduce((sum, p) => sum + p.principal + p.interest + p.fee, 0),
          0,
        );
    },
    debt(s, cid = s.playerId) {
      return (s.commercial?.loans || [])
        .filter((l) => l.companyId === cid && l.status !== "repaid")
        .reduce(
          (n, l) =>
            n +
            l.schedule
              .filter((p) => !p.paid)
              .reduce((sum, p) => sum + p.principal + p.interest + p.fee, 0),
          0,
        );
    },
    loanQuote(s, principal, months, companyId = s.playerId) {
      const c = active(s, companyId);
      G.assert(
        c &&
          [3, 6].includes(months) &&
          Number.isInteger(principal) &&
          principal >= 1000 &&
          principal <= 8000,
        "Solicitud de crédito inválida.",
      );
      const profile = s.commercial.profiles[companyId],
        assets = G.ownedCars(s, companyId).reduce(
          (n, c) => n + G.Market.value(c),
          0,
        ),
        revenue =
          c.ledger
            .filter(
              (t) =>
                t.day > s.day - 90 &&
                t.amount > 0 &&
                !["Financiación", "Mercado", "Traspasos"].includes(
                  t.category,
                ) &&
                !t.label.startsWith("Anticipo") &&
                !t.label.startsWith("Capital para"),
            )
            .reduce((n, t) => n + t.amount, 0) / 3;
      const cap = Math.min(
        8000,
        Math.round(
          (1000 + c.reputation * 180 + assets * 0.18 + revenue * 0.5) / 500,
        ) * 500,
      );
      const rate = money(
          (months === 3 ? 0.06 : 0.11) +
            Math.max(0, 8 - c.reputation) * 0.002 +
            (profile?.defaults || 0) * 0.025,
        ),
        interest = Math.round(principal * rate);
      const reason = s.race
        ? "Termina la carrera antes de solicitar crédito."
        : this.debt(s, companyId)
          ? "Liquida la deuda existente antes de pedir otro préstamo."
          : c.reputation < 1
            ? "La reputación no alcanza el mínimo del banco."
            : principal > cap
              ? "El banco limita esta solicitud a $" + cap + "."
              : s.commercial.bank.balance < principal
                ? "El banco no dispone de liquidez para este préstamo."
                : "";
      return {
        accepted: !reason,
        reason,
        principal,
        months,
        rate,
        interest,
        total: principal + interest,
        payment:
          Math.floor(principal / months) +
          Math.floor(interest / months) +
          (principal % months) +
          (interest % months),
        limit: cap,
        firstDue: s.day + 30,
      };
    },
    borrow(s, principal, months, companyId = s.playerId) {
      const q = this.loanQuote(s, principal, months, companyId);
      G.assert(q.accepted, q.reason);
      const l = {
        id: G.uid(s, "loan"),
        companyId,
        start: s.day,
        principal,
        months,
        status: "active",
        defaultRecorded: false,
        schedule: [],
      };
      for (let i = 0; i < months; i++)
        l.schedule.push({
          due: s.day + (i + 1) * 30,
          principal:
            Math.floor(principal / months) +
            (i === months - 1 ? principal % months : 0),
          interest:
            Math.floor(q.interest / months) +
            (i === months - 1 ? q.interest % months : 0),
          fee: 0,
          paid: false,
          waived: false,
        });
      s.commercial.bank.balance = money(s.commercial.bank.balance - principal);
      s.commercial.loans.push(l);
      G.Economy.transact(
        s,
        companyId,
        principal,
        "Financiación",
        `Préstamo ${l.id} · ${months} cuotas`,
      );
      G.news(
        s,
        "Finanzas",
        "Crédito concedido.",
        `${s.companies.find((c) => c.id === companyId).name} recibe $${principal}. Interés total $${q.interest}; primera cuota en 30 días. El principal es financiación, no beneficio.`,
        "contracts",
        l.id,
      );
      return l;
    },
    payoff(s, l) {
      return money(
        l.schedule
          .filter((p) => !p.paid)
          .reduce(
            (n, p) =>
              n + p.principal + p.fee + (p.due <= s.day ? p.interest : 0),
            0,
          ),
      );
    },
    repay(s, id) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de amortizar.");
      const l = s.commercial.loans.find(
        (l) =>
          l.id === id && l.companyId === s.playerId && l.status !== "repaid",
      );
      G.assert(l, "Préstamo no disponible.");
      const cost = this.payoff(s, l);
      G.Economy.spend(s, cost, "Deuda", `Amortización anticipada · ${l.id}`);
      s.commercial.bank.balance = money(s.commercial.bank.balance + cost);
      l.schedule.forEach((p) => {
        if (!p.paid) {
          p.waived = p.due > s.day;
          p.paid = true;
        }
      });
      l.status = "repaid";
      this.profile(s, l.companyId).repaid++;
    },
    daily(s) {
      if (!s.commercial) return;
      for (const d of s.drivers)
        if (d.contract && s.day >= d.contract.end) this.settlePromise(s, d);
      for (const c of s.commercial.contracts.filter(
        (c) => c.status === "active",
      )) {
        if (!active(s, c.companyId)) {
          this.close(s, c, "breached", "La compañía ha cesado su actividad.");
          continue;
        }
        if (c.promotionUntil && s.day >= c.promotionUntil) {
          c.promotions++;
          c.promotionUntil = null;
          G.news(
            s,
            "Finanzas",
            "Acto promocional completado.",
            `${s.companies.find((x) => x.id === c.companyId).name} cumple un compromiso de marca.`,
            "contracts",
            c.id,
          );
        }
      }
      for (const l of s.commercial.loans.filter((l) => l.status !== "repaid")) {
        const c = active(s, l.companyId);
        if (!c) {
          l.status = "defaulted";
          continue;
        }
        for (const p of l.schedule.filter((p) => !p.paid && p.due <= s.day)) {
          const due = money(p.principal + p.interest + p.fee);
          if (c.balance >= due) {
            G.Economy.transact(
              s,
              c.id,
              -p.principal,
              "Deuda",
              `Principal · ${l.id}`,
            );
            G.Economy.transact(
              s,
              c.id,
              -(p.interest + p.fee),
              "Intereses",
              `Interés y mora · ${l.id}`,
            );
            s.commercial.bank.balance = money(s.commercial.bank.balance + due);
            p.paid = true;
          } else if (s.day - p.due >= 14 && !l.defaultRecorded) {
            l.defaultRecorded = true;
            l.status = "defaulted";
            p.fee = 100;
            this.profile(s, c.id).defaults++;
            c.reputation = G.clamp(c.reputation - 3, 0, 100);
            G.news(
              s,
              "Finanzas",
              "Préstamo en impago.",
              `${c.name} acumula 14 días de retraso. Recargo único de $100, pérdida de reputación y bloqueo de nuevo crédito; la deuda sigue exigible.`,
              "contracts",
              l.id,
            );
          }
        }
        if (l.schedule.every((p) => p.paid)) {
          l.status = "repaid";
          this.profile(s, c.id).repaid++;
        } else if (
          l.status === "defaulted" &&
          !l.schedule.some((p) => !p.paid && p.due <= s.day)
        ) {
          l.status = "active";
        }
      }
      for (const o of s.commercial.offers.filter((o) => o.status === "open"))
        if (s.day > o.deadline || o.year !== s.season.year)
          o.status = "expired";
    },
    bankrupt(s, id) {
      if (!s.commercial) return;
      for (const c of this.live(s, id))
        this.close(s, c, "breached", "Bancarrota de la compañía.");
      for (const l of s.commercial.loans.filter(
        (l) => l.companyId === id && l.status !== "repaid",
      ))
        l.status = "defaulted";
    },
    aiDaily(s) {
      if (!s.commercial || s.race) return;
      for (const o of s.commercial.offers.filter(
        (o) =>
          o.status === "open" && s.day >= o.decisionDay && s.day <= o.deadline,
      )) {
        const p = s.commercial.providers.find((p) => p.id === o.providerId);
        const candidates = s.companies
          .filter(
            (c) =>
              c.id !== s.playerId &&
              c.status === "active" &&
              c.balance >= 0 &&
              G.Companies.lineup(s, c.id).driver &&
              G.Companies.lineup(s, c.id).car,
          )
          .filter((c) =>
            p.partDefinition
              ? Object.values(G.Companies.lineup(s, c.id).car.installed).some(
                  (id) =>
                    s.parts.find((part) => part.id === id)?.definitionId ===
                    p.partDefinition,
                )
              : true,
          )
          .map((c) => ({
            c,
            q: this.quote(s, o.id, this.baseTerms(s, o), c.id),
          }))
          .filter((x) => x.q.accepted)
          .sort(
            (a, b) =>
              b.c.reputation - a.c.reputation ||
              b.c.stats.starts - a.c.stats.starts ||
              a.c.id.localeCompare(b.c.id),
          );
        const winner = candidates[0];
        if (winner) {
          this.sign(s, o.id, winner.q.terms, winner.c.id);
          G.Companies.log(
            s,
            winner.c,
            "patrocinio",
            `Conseguir presupuesto de ${p.name} a cambio de presencia y exclusividad.`,
            null,
            0,
          );
        }
      }
    },
    validate(s) {
      if (s.commercial === undefined) return;
      const v = s.commercial,
        num = (n) => Number.isFinite(n) && n >= 0,
        ids = new Set(),
        company = (id) => s.companies.some((c) => c.id === id),
        provider = (id) => v.providers.some((p) => p.id === id),
        all = [...v.providers, ...v.offers, ...v.contracts, ...v.loans];
      G.assert(
        v.version === 1 &&
          Array.isArray(v.providers) &&
          v.providers.length === 5 &&
          Array.isArray(v.offers) &&
          Array.isArray(v.contracts) &&
          Array.isArray(v.loans) &&
          v.bank &&
          num(v.bank.balance) &&
          v.profiles &&
          v.negotiations,
        "Sistema comercial inválido.",
      );
      for (const x of all) {
        G.assert(
          x && /^[a-z]+-[0-9]+$/.test(x.id) && !ids.has(x.id),
          "Identificadores comerciales duplicados.",
        );
        ids.add(x.id);
      }
      for (const p of v.providers)
        G.assert(
          num(p.balance) &&
            typeof p.name === "string" &&
            ["financial", "technical", "manufacturer"].includes(p.kind) &&
            typeof p.sector === "string" &&
            /^#[a-f0-9]{6}$/i.test(p.color) &&
            Array.isArray(p.ledger) &&
            p.ledger.length <= 100 &&
            p.ledger.every(
              (t) =>
                Number.isInteger(t.day) &&
                Number.isFinite(t.amount) &&
                typeof t.label === "string",
            ) &&
            (p.modelIndex === null || G.Data.models[p.modelIndex]) &&
            (p.partDefinition === null ||
              G.Parts.catalogue.some((d) => d.id === p.partDefinition)),
          "Patrocinador corrupto.",
        );
      for (const o of v.offers)
        G.assert(
          provider(o.providerId) &&
            Number.isInteger(o.year) &&
            Number.isInteger(o.deadline) &&
            Number.isInteger(o.decisionDay) &&
            ["open", "awarded", "expired"].includes(o.status) &&
            unique(o.declined) &&
            o.declined.every(company) &&
            (o.winnerId === null || company(o.winnerId)) &&
            (o.driverId === null || s.drivers.some((d) => d.id === o.driverId)),
          "Convocatoria comercial inválida.",
        );
      const committed = new Set(),
        sectors = new Set(),
        counts = {};
      for (const c of v.contracts) {
        const t = c.terms;
        G.assert(
          company(c.companyId) &&
            provider(c.providerId) &&
            v.offers.some(
              (o) =>
                o.id === c.offerId &&
                o.providerId === c.providerId &&
                o.winnerId === c.companyId,
            ) &&
            ["active", "completed", "terminated", "breached"].includes(
              c.status,
            ) &&
            Number.isInteger(c.start) &&
            unique(c.eventIds) &&
            c.eventIds.length > 0 &&
            c.eventIds.length <= 6 &&
            unique(c.checkedIds) &&
            unique(c.fulfilledIds) &&
            c.checkedIds.every((id) => c.eventIds.includes(id)) &&
            c.fulfilledIds.every((id) => c.checkedIds.includes(id)) &&
            Array.isArray(c.rounds) &&
            c.rounds.length === c.checkedIds.length &&
            c.rounds.every(
              (r) =>
                c.checkedIds.includes(r.eventId) &&
                Array.isArray(r.issues) &&
                r.issues.every((x) => typeof x === "string"),
            ) &&
            num(c.escrow) &&
            num(c.finishBonus) &&
            num(c.exitFee) &&
            num(c.vehicleFunding) &&
            num(c.penalty) &&
            typeof c.logo === "boolean" &&
            Number.isInteger(c.promotions) &&
            c.promotions >= 0 &&
            (c.promotionUntil === null || Number.isInteger(c.promotionUntil)) &&
            (c.driverId === null ||
              s.drivers.some((d) => d.id === c.driverId)) &&
            (c.carId === null || s.cars.some((car) => car.id === c.carId)) &&
            t &&
            Number.isInteger(t.advance) &&
            num(t.advance) &&
            Number.isInteger(t.perRound) &&
            num(t.perRound) &&
            [0.5, 0.7, 1].includes(t.share) &&
            [0, 1, 2].includes(t.promotions) &&
            [3, 5, 8].includes(t.targetPosition),
          "Contrato comercial corrupto.",
        );
        if (c.status === "active") {
          G.assert(
            !committed.has(c.providerId),
            "La marca tiene dos contratos activos.",
          );
          committed.add(c.providerId);
          const sectorKey =
            c.companyId +
            "|" +
            v.providers.find((p) => p.id === c.providerId).sector;
          counts[c.companyId] = (counts[c.companyId] || 0) + 1;
          G.assert(
            !sectors.has(sectorKey) && counts[c.companyId] <= 3,
            "Exclusividad o capacidad comercial inválida.",
          );
          sectors.add(sectorKey);
          G.assert(
            c.escrow ===
              money(
                (c.eventIds.length - c.fulfilledIds.length) * t.perRound +
                  c.finishBonus,
              ),
            "Reserva de patrocinio incoherente.",
          );
        } else
          G.assert(
            c.escrow === 0,
            "Un acuerdo liquidado conserva fondos bloqueados.",
          );
      }
      for (const [id, p] of Object.entries(v.profiles))
        G.assert(
          company(id) &&
            Number.isInteger(p.defaults) &&
            p.defaults >= 0 &&
            Number.isInteger(p.repaid) &&
            p.repaid >= 0 &&
            p.relations &&
            Object.entries(p.relations).every(
              ([id, n]) =>
                provider(id) && Number.isFinite(n) && n >= -100 && n <= 100,
            ),
          "Historial financiero corrupto.",
        );
      for (const [key, n] of Object.entries(v.negotiations)) {
        const t = n.terms;
        G.assert(
          t &&
            Number.isInteger(t.advance) &&
            t.advance >= 0 &&
            t.advance <= 10000 &&
            Number.isInteger(t.perRound) &&
            t.perRound >= 0 &&
            t.perRound <= 3000 &&
            [0.5, 0.7, 1].includes(t.share) &&
            [0, 1, 2].includes(t.promotions) &&
            [3, 5, 8].includes(t.targetPosition) &&
            typeof n.accepted === "boolean" &&
            typeof n.reason === "string" &&
            Number.isInteger(n.attempts) &&
            n.attempts >= 1 &&
            Number.isInteger(n.cooldown) &&
            v.offers.some((o) => key.endsWith("|" + o.id)),
          "Negociación comercial corrupta.",
        );
      }
      const borrowers = new Set();
      for (const l of v.loans) {
        G.assert(
          company(l.companyId) &&
            num(l.principal) &&
            l.principal >= 1000 &&
            [3, 6].includes(l.months) &&
            ["active", "defaulted", "repaid"].includes(l.status) &&
            typeof l.defaultRecorded === "boolean" &&
            Number.isInteger(l.start) &&
            Array.isArray(l.schedule) &&
            l.schedule.length === l.months &&
            l.schedule.every(
              (p) =>
                Number.isInteger(p.due) &&
                num(p.principal) &&
                num(p.interest) &&
                num(p.fee) &&
                typeof p.paid === "boolean" &&
                typeof p.waived === "boolean",
            ) &&
            l.schedule.reduce((n, p) => n + p.principal, 0) === l.principal &&
            (l.status === "repaid") === l.schedule.every((p) => p.paid),
          "Préstamo corrupto.",
        );
        if (l.status !== "repaid") {
          G.assert(
            !borrowers.has(l.companyId),
            "Préstamos activos duplicados.",
          );
          borrowers.add(l.companyId);
        }
      }
      for (const d of s.drivers)
        if (d.contract?.clauses) {
          const k = d.contract.clauses;
          G.assert(
            ["principal", "reserva"].includes(k.role) &&
              num(k.winBonus) &&
              k.winBonus <= 1500 &&
              [1, 2, 3].includes(k.releaseMonths) &&
              [0, 0.5, 0.7, 1].includes(k.promiseShare) &&
              typeof k.renewalOption === "boolean" &&
              typeof k.renewalUsed === "boolean" &&
              typeof k.settled === "boolean" &&
              unique(k.eventIds) &&
              unique(k.checkedIds) &&
              unique(k.usedIds) &&
              unique(k.processedIds) &&
              k.checkedIds.every((id) => k.eventIds.includes(id)) &&
              k.usedIds.every((id) => k.checkedIds.includes(id)),
            "Cláusulas de piloto corruptas.",
          );
        }
    },
  });
})();
