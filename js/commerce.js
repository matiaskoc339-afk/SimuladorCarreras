"use strict";
(() => {
  const G = RCS,
    W = G.Workshop,
    P = G.Professionals;
  const C = (G.Commerce = {
    enabled: (s) => s?.commerce?.version === 1,
    next: (s) => (s.commerce.week + 1) * 7,
    initialize(s) {
      if (this.enabled(s)) return s;
      G.assert(
        G.Coachwork.enabled(s) &&
          G.Challenge.enabled(s) &&
          G.Competition.enabled(s) &&
          !s.race &&
          !G.Auctions.active(s),
        "Termina la carrera o subasta y activa el taller visual antes de abrir el suministro semanal.",
      );
      s.commerce = {
        version: 1,
        week: Math.floor(s.day / 7),
        refreshed: s.day,
      };
      for (const d of s.drivers.filter(
        (d) => !d.companyId && P.available(s, d),
      )) {
        d.recruitWeek = s.commerce.week;
        d.marketUntil = this.next(s) - 1;
      }
      this.stock(s);
      this.showroom(s);
      G.Trophies.initialize(s);
      return s;
    },
    stock(s) {
      // Solo se retiran existencias libres del proveedor. Las unidades del jugador,
      // rivales, coches, consignaciones y trabajos pendientes siguen siendo las mismas.
      s.parts = s.parts.filter(
        (p) =>
          !(
            p.companyId === null &&
            !p.carId &&
            !p.reservedFor &&
            !p.auctionOwnerId &&
            !G.Auctions.locked(s, "part", p.id) &&
            G.Parts.definition(p.definitionId)?.weekly &&
            G.Parts.definition(p.definitionId).week !== s.commerce.week
          ),
      );
      for (const def of G.WeeklyContent.definitions(s)) {
        const minimum = def.weekly ? 1 : 2;
        for (let n = W.stock(s, def.id).length; n < minimum; n++)
          s.parts.push({
            id: G.uid(s, "part"),
            definitionId: def.id,
            companyId: null,
            carId: null,
            reservedFor: null,
            condition: 100,
          });
      }
    },
    showroom(s) {
      for (const model of G.WeeklyContent.models) {
        if (
          s.market.some(
            (l) =>
              l.kind === "new" &&
              s.cars.find((c) => c.id === l.carId)?.modelIndex === model,
          )
        )
          continue;
        const m = G.Data.models[model],
          car = {
            ...G.clone(m),
            id: G.uid(s, "car"),
            modelIndex: model,
            companyId: null,
            color:
              G.AuctionContent.palette[
                (model + s.commerce.week) % G.AuctionContent.palette.length
              ],
            km: 0,
            condition: 100,
            tires: 100,
            oemTires: 100,
            repair: null,
            starts: 0,
            wins: 0,
            base: Object.fromEntries(W.attributes.map((k) => [k, m[k]])),
            components: Object.fromEntries(
              Object.keys(G.Parts.components).map((k) => [k, 100]),
            ),
            installed: {},
            upgradeValue: 0,
            factoryDelivery: true,
            history: [
              {
                day: s.day,
                type: "Unidad nueva · configuración deportiva de fábrica · 0 km",
              },
            ],
          };
        s.cars.push(car);
        s.market.push({
          id: G.uid(s, "listing"),
          carId: car.id,
          sellerId: null,
          price: m.value,
          day: s.day,
          kind: "new",
        });
      }
    },
    recruit(s, company, scout = null, n = 0) {
      const d = G.Drivers.generate(s, null),
        profile = scout ? P.profile(s, scout.id) : null,
        level = profile?.level || 0,
        prestige = G.clamp(company.reputation, 0, 100),
        ceiling = Math.min(94, 20 + company.level * 5 + prestige * 0.2),
        // Un ojeador amplía la búsqueda y descubre potencial; la empresa sigue
        // necesitando nivel, caja y capacidad para contratar a quien encuentra.
        scoutCeiling = Math.min(
          94,
          Math.max(ceiling, 12 + level * 5 + company.level + prestige * 0.12),
        ),
        cap = scout ? scoutCeiling : ceiling,
        surprise = scout && G.random(s.challenge) < 0.015 + level * 0.004,
        novice = !scout && n < 4,
        base = novice
          ? G.integer(s.challenge, 10, 19)
          : G.integer(
              s.challenge,
              Math.max(10, Math.floor(cap - 18)),
              Math.floor(cap - 4),
            );
      for (const key of G.Drivers.stats)
        d.stats[key] = G.clamp(
          base +
            G.integer(s.challenge, -7, 9) +
            (G.Data.traits[d.trait][key] || 0) +
            (surprise ? 5 : 0),
          3,
          96,
        );
      const delta = Math.max(
        0,
        G.Drivers.rating(d) - Math.floor(cap + (surprise ? 5 : 0)),
      );
      if (delta)
        for (const key of G.Drivers.stats)
          d.stats[key] = Math.max(3, d.stats[key] - delta);
      d.potential = G.clamp(
        Math.max(...Object.values(d.stats), 30 + level * 3 + prestige * 0.22) +
          G.integer(s.challenge, 4, surprise ? 32 : 19),
        25,
        98,
      );
      d.ask = G.Challenge.driverAsk(d);
      d.recruitWeek = s.commerce.week;
      d.cvCompanyId = company.id;
      d.marketUntil = this.next(s) - 1;
      // Se conserva todo piloto anterior, incluso caducado: nunca reciclar nombre o retrato.
      const names = new Set(s.drivers.map((p) => p.name));
      if (names.has(d.name)) d.name += ` ${d.id.split("-")[1]}`;
      s.drivers.push(d);
      if (scout) {
        const report = P.estimate(
          s,
          d.potential,
          P.accuracy(s, scout, "scout"),
          level,
        );
        s.professional.cvs.push({
          id: P.uid(s, "scoutcv"),
          companyId: company.id,
          employeeId: scout.id,
          driverId: d.id,
          day: s.day,
          accuracy: report.accuracy,
          report,
          detail: `Búsqueda semanal para una empresa de nivel ${company.level} y prestigio ${prestige.toFixed(1)}. ${level >= 4 ? `Punto fuerte: ${G.Drivers.labels[G.Drivers.stats.slice().sort((a, b) => d.stats[b] - d.stats[a])[0]]}. ` : ""}El potencial es una estimación; no garantiza su desarrollo. CV válido hasta ${G.dateAt(d.marketUntil).toISOString().slice(0, 10)}.`,
        });
      }
      return d;
    },
    refresh(s) {
      if (!this.enabled(s) || Math.floor(s.day / 7) <= s.commerce.week) return;
      s.commerce.week = Math.floor(s.day / 7);
      s.commerce.refreshed = s.day;
      // Retirar del tablón no borra el piloto ni invalida contratos o informes antiguos.
      for (const d of s.drivers.filter(
        (d) =>
          !d.companyId &&
          Number.isInteger(d.recruitWeek) &&
          d.recruitWeek < s.commerce.week,
      )) {
        const care = P.care(s, d.id);
        if (care) care.listed = false;
      }
      this.stock(s);
      this.showroom(s);
      for (let n = 0; n < 12; n++) this.recruit(s, G.player(s), null, n);
      let reports = 0;
      for (const scout of s.employees.filter(
        (e) =>
          e.role === "scout" &&
          e.contract &&
          e.companyId &&
          e.status === "active",
      )) {
        const company = s.companies.find((c) => c.id === scout.companyId),
          p = P.profile(s, scout.id);
        if (
          company?.status !== "active" ||
          P.resting(s, scout.id) ||
          G.Staff.busy(s, scout.id)
        )
          continue;
        const count = 2 + Math.floor(p.level / 3);
        for (let n = 0; n < count; n++) this.recruit(s, company, scout, n);
        p.lastCV = s.day;
        P.gain(s, scout.id, count * 7);
        p.stress = Math.min(100, p.stress + 4);
        if (company.id === s.playerId) reports += count;
      }
      s.challenge.lastRecruit = s.day;
      G.news(
        s,
        "Novedades semanales",
        `Catálogo y CV renovados · semana ${s.commerce.week + 1}.`,
        `Llegan 64 referencias nuevas para los 16 alojamientos del coche y 12 currículums distintos${reports ? `, además de ${reports} informes de tu ojeador` : ""}. Los recambios básicos se reponen; tus compras, montajes y contratos se conservan. Próxima renovación: ${G.dateAt(this.next(s)).toISOString().slice(0, 10)}.`,
        "workshop",
      );
    },
    candidates(s) {
      return s.drivers.filter(
        (d) =>
          !d.companyId &&
          P.available(s, d) &&
          (!this.enabled(s) || !d.cvCompanyId || d.cvCompanyId === s.playerId),
      );
    },
    validate(s) {
      if (s.commerce === undefined) return;
      const x = s.commerce;
      G.assert(
        this.enabled(s) &&
          s.trophyRoom?.version === 1 &&
          G.Coachwork.enabled(s) &&
          Number.isInteger(x.week) &&
          x.week >= 0 &&
          x.week <= Math.floor(s.day / 7) &&
          Number.isInteger(x.refreshed) &&
          x.refreshed >= 0 &&
          x.refreshed <= s.day &&
          Math.floor(x.refreshed / 7) === x.week,
        "Suministro semanal inválido.",
      );
      for (const d of s.drivers.filter((d) => d.recruitWeek !== undefined))
        G.assert(
          Number.isInteger(d.recruitWeek) &&
            d.recruitWeek >= 0 &&
            d.recruitWeek <= x.week &&
            Number.isInteger(d.marketUntil) &&
            d.marketUntil === (d.recruitWeek + 1) * 7 - 1 &&
            (!d.cvCompanyId || s.companies.some((c) => c.id === d.cvCompanyId)),
          "Currículum semanal inválido.",
        );
      for (const l of s.market.filter((l) => l.kind === "new")) {
        const car = s.cars.find((c) => c.id === l.carId);
        G.assert(
          car?.showroomOnly &&
            car.factoryDelivery &&
            l.sellerId === null &&
            car.km === 0 &&
            car.starts === 0 &&
            car.condition === 100 &&
            car.tires === 100 &&
            Object.values(car.components).every((v) => v === 100) &&
            !Object.keys(car.installed).length &&
            l.price === G.Data.models[car.modelIndex].value,
          "Unidad de concesionario inválida.",
        );
      }
      for (const p of s.parts) {
        const def = G.Parts.definition(p.definitionId);
        if (def?.weekly)
          G.assert(
            Number(p.definitionId.split("-")[1]) === s.seed >>> 0 &&
              def.week <= x.week,
            "Referencia semanal ajena o futura.",
          );
      }
    },
  });
  const daily = G.Challenge.daily;
  G.Challenge.daily = function (s) {
    if (!C.enabled(s)) return daily.call(this, s);
    C.refresh(s);
    for (const d of s.drivers) d.ask = this.driverAsk(d);
  };
  const autoCV = P.autoCV;
  P.autoCV = function (s, ...args) {
    if (!C.enabled(s)) return autoCV.call(this, s, ...args);
  };
  const available = P.available;
  P.available = function (s, d) {
    return (
      available.call(this, s, d) &&
      (!C.enabled(s) ||
        d.companyId ||
        d.recruitWeek === undefined ||
        s.day <= d.marketUntil)
    );
  };
  const value = G.Market.value;
  G.Market.value = function (car) {
    return Math.round(
      value.call(this, car) *
        (car.showroomOnly && !car.factoryDelivery ? 0.84 : 1),
    );
  };
  const buy = G.Market.buy;
  G.Market.buy = function (s, id, ...args) {
    const l = s.market.find((l) => l.id === id),
      car = l && s.cars.find((c) => c.id === l.carId),
      fresh = l?.kind === "new";
    const result = buy.call(this, s, id, ...args);
    if (fresh) {
      car.factoryDelivery = false;
      car.history.unshift({
        day: s.day,
        type: "Primera matriculación · entrega nueva de fábrica",
      });
    }
    return result;
  };
  const spec = G.Coachwork.spec;
  G.Coachwork.spec = function (s, car, installed = car.installed) {
    const result = spec.call(this, s, car, installed),
      shell = this.defs(s, installed).find(
        (d) => d.slot === "shell" && d.weekly,
      );
    if (shell)
      result.supply = {
        variant: shell.shellVariant,
        accent: shell.accent,
        maker: shell.maker,
      };
    return result;
  };
  const create = G.createGame;
  G.createV100Game = create;
  G.createGame = (...args) => C.initialize(create(...args));
})();
