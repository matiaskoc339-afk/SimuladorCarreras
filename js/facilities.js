"use strict";
(() => {
  const G = RCS;
  const F = (G.Facilities = {
    definitions: {
      garage: { name: "Garaje", price: 3200, days: 14, upkeep: 1 },
      workshop: { name: "Taller", price: 2600, days: 14, upkeep: 1.5 },
      warehouse: { name: "Almacén", price: 1100, days: 7, upkeep: 0.5 },
      office: { name: "Oficina de equipo", price: 1800, days: 10, upkeep: 1 },
    },
    // Patrimonio, antigüedad y resultados: no se asciende por comprar un edificio.
    ranks: [
      {},
      {
        days: 120,
        starts: 3,
        podiums: 1,
        reputation: 4,
        equity: 14000,
        built: 2,
      },
      {
        days: 365,
        starts: 10,
        podiums: 3,
        reputation: 10,
        equity: 22000,
        built: 3,
      },
      {
        days: 730,
        starts: 18,
        wins: 2,
        reputation: 18,
        equity: 30000,
        built: 4,
      },
      {
        days: 1095,
        starts: 30,
        wins: 5,
        reputation: 25,
        equity: 45000,
        built: 6,
      },
      {
        days: 1825,
        starts: 45,
        wins: 10,
        reputation: 35,
        equity: 65000,
        built: 8,
      },
      {
        days: 2920,
        starts: 65,
        wins: 18,
        reputation: 45,
        equity: 95000,
        built: 10,
      },
      {
        days: 4015,
        starts: 90,
        wins: 25,
        reputation: 60,
        equity: 140000,
        built: 12,
      },
      {
        days: 5475,
        starts: 120,
        wins: 40,
        reputation: 75,
        equity: 220000,
        built: 14,
      },
      {
        days: 7300,
        starts: 160,
        wins: 60,
        reputation: 90,
        equity: 350000,
        built: 16,
      },
    ],
    initialize(s) {
      if (s.expansion !== undefined) {
        G.assert(
          s.expansion.version === 1,
          "Versión de instalaciones incompatible.",
        );
        return s;
      }
      s.expansion = {
        version: 1,
        builder: { name: "Obras del Paddock", balance: 0 },
        sites: Object.fromEntries(
          s.companies.map((c) => [
            c.id,
            {
              buildings: { garage: 1, workshop: 1, warehouse: 1, office: 1 },
              base: {
                cars: c.carCapacity,
                drivers: c.driverCapacity,
                spares: c.sparesCapacity,
              },
              project: null,
              highestLevel: c.level,
              levelChanged: s.day,
              crisisDays: 0,
              lastReview: s.day,
              history: [],
            },
          ]),
        ),
        archive: [],
      };
      if (s.season.phase === "complete") this.archiveSeason(s);
      return s;
    },
    site(s, id = s.playerId) {
      return s.expansion?.sites[id];
    },
    tier(s, id, key) {
      return this.site(s, id)?.buildings[key] || 1;
    },
    bays(s, id = s.playerId) {
      return [1, 1, 2, 2, 3][this.tier(s, id, "workshop") - 1];
    },
    duration(s, id, days) {
      return Math.max(
        1,
        Math.ceil(
          days * [1, 0.75, 0.6, 0.5, 0.4][this.tier(s, id, "workshop") - 1],
        ),
      );
    },
    workload(s, id = s.playerId) {
      return (
        G.ownedCars(s, id).filter((c) => c.repair).length +
        ((id === s.playerId ? s.job : s.companies.find((c) => c.id === id)?.job)
          ? 1
          : 0)
      );
    },
    upkeep(s, id = s.playerId) {
      return Object.entries(this.definitions).reduce(
        (n, [key, d]) => n + (this.tier(s, id, key) - 1) * d.upkeep,
        0,
      );
    },
    capacity(site, buildings = site.buildings) {
      return {
        cars: Math.min(10, site.base.cars + (buildings.garage - 1) * 2),
        drivers: Math.min(10, site.base.drivers + buildings.office - 1),
        spares: Math.min(100, site.base.spares + (buildings.warehouse - 1) * 8),
      };
    },
    equity(s, id) {
      const c = s.companies.find((c) => c.id === id),
        site = this.site(s, id);
      const investment = Object.entries(site?.buildings || {}).reduce(
        (n, [key, tier]) => {
          for (let t = 2; t <= tier; t++) n += this.price(key, t) * 0.5;
          return n;
        },
        0,
      );
      const spares = G.Workshop.inventory(s, id).reduce(
        (n, p) =>
          n +
          ((G.Parts.definition(p.definitionId).price * p.condition) / 100) *
            0.6,
        0,
      );
      const principal = (s.commercial?.loans || [])
        .filter((l) => l.companyId === id)
        .reduce(
          (n, l) =>
            n +
            l.schedule
              .filter((p) => !p.paid)
              .reduce((v, p) => v + p.principal, 0),
          0,
        );
      const accrued = G.ownedDrivers(s, id).reduce(
        (n, d) => n + (d.contract?.accrued || 0),
        0,
      );
      return Math.round(
        c.balance +
          G.ownedCars(s, id).reduce((n, car) => n + G.Market.value(car), 0) +
          spares +
          investment -
          principal -
          accrued -
          G.Staff.liability(s, id),
      );
    },
    price(key, tier) {
      return (
        Math.round(
          (this.definitions[key].price * Math.pow(1.8, tier - 2)) / 50,
        ) * 50
      );
    },
    requiredLevel(tier) {
      return [0, 1, 1, 3, 5, 7][tier] || 10;
    },
    quote(s, key, id = s.playerId) {
      const c = s.companies.find((c) => c.id === id),
        site = this.site(s, id),
        def = this.definitions[key];
      G.assert(c && site && def, "Instalación desconocida.");
      const from = site.buildings[key],
        to = from + 1;
      const cost = to <= 5 ? this.price(key, to) : 0;
      const days = def.days + (to - 2) * 7;
      const requiredLevel = this.requiredLevel(to);
      const reason =
        c.status !== "active"
          ? "La compañía ha terminado su actividad."
          : s.race
            ? "Termina la carrera antes de iniciar obras."
            : from >= 5
              ? "Esta instalación ha alcanzado su máximo."
              : site.project
                ? "Hay otra obra en curso en esta sede."
                : c.level < requiredLevel
                  ? `Requiere nivel empresarial ${requiredLevel}.`
                  : c.balance < cost
                    ? "Fondos insuficientes para la obra."
                    : "";
      return {
        key,
        from,
        to,
        cost,
        days,
        end: s.day + days,
        requiredLevel,
        upkeep: def.upkeep,
        reason,
        accepted: !reason,
      };
    },
    remember(site, item) {
      site.history.unshift(item);
      site.history.length = Math.min(40, site.history.length);
    },
    start(s, key, id = s.playerId) {
      const q = this.quote(s, key, id);
      G.assert(q.accepted, q.reason);
      const site = this.site(s, id),
        c = s.companies.find((c) => c.id === id);
      G.Economy.spendCompany(
        s,
        id,
        q.cost,
        "Construcción",
        `${this.definitions[key].name} · nivel ${q.to}`,
      );
      s.expansion.builder.balance += q.cost;
      site.project = {
        id: G.uid(s, "construction"),
        key,
        from: q.from,
        to: q.to,
        cost: q.cost,
        start: s.day,
        end: q.end,
      };
      this.remember(site, {
        day: s.day,
        type: "start",
        key,
        tier: q.to,
        amount: q.cost,
      });
      G.news(
        s,
        "Compañía",
        `${c.name} amplía su ${this.definitions[key].name.toLowerCase()}.`,
        `Invierte $${q.cost}. Las obras terminan en ${q.days} días; hasta entonces conserva la capacidad actual y los trabajos ya contratados.`,
        "facilities",
        id,
      );
      return site.project;
    },
    refund(s, id = s.playerId) {
      const j = this.site(s, id)?.project;
      return j
        ? Math.floor(
            j.cost * 0.5 * G.clamp((j.end - s.day) / (j.end - j.start), 0, 1),
          )
        : 0;
    },
    cancel(s, id = s.playerId, bankruptcy = false) {
      const site = this.site(s, id),
        c = s.companies.find((c) => c.id === id),
        j = site?.project;
      G.assert(
        j &&
          (bankruptcy || (!s.race && c.status === "active" && s.day < j.end)),
        "No se puede cancelar esta obra.",
      );
      const refund = this.refund(s, id);
      G.assert(
        s.expansion.builder.balance >= refund,
        "La constructora no puede devolver ese importe.",
      );
      if (refund) {
        s.expansion.builder.balance -= refund;
        G.Economy.transact(
          s,
          id,
          refund,
          "Construcción",
          "Devolución de obra cancelada",
        );
      }
      site.project = null;
      this.remember(site, {
        day: s.day,
        type: "cancel",
        key: j.key,
        tier: j.to,
        amount: refund,
      });
      G.news(
        s,
        "Compañía",
        `${c.name} cancela una ampliación.`,
        `Se devuelven $${refund}. La movilización y los trabajos ejecutados no se recuperan; la instalación conserva su nivel ${j.from}.`,
        "facilities",
        id,
      );
      return refund;
    },
    complete(s) {
      if (!s.expansion) return;
      for (const c of s.companies) {
        const site = this.site(s, c.id),
          j = site.project;
        if (!j || j.end > s.day || c.status !== "active") continue;
        site.buildings[j.key] = j.to;
        const cap = this.capacity(site);
        c.carCapacity = cap.cars;
        c.driverCapacity = cap.drivers;
        c.sparesCapacity = cap.spares;
        c.facilities = { ...site.buildings };
        site.project = null;
        this.remember(site, {
          day: s.day,
          type: "complete",
          key: j.key,
          tier: j.to,
          amount: 0,
        });
        G.news(
          s,
          "Compañía",
          `${c.name} estrena ${this.definitions[j.key].name.toLowerCase()} de nivel ${j.to}.`,
          `La ampliación ya está operativa. Garaje: ${cap.cars} coches; oficina: ${cap.drivers} pilotos; almacén: ${cap.spares} repuestos. Conservación adicional: $${this.upkeep(s, c.id)} al día.`,
          "facilities",
          c.id,
        );
      }
    },
    objectives(s, id = s.playerId, level = null) {
      const c = s.companies.find((c) => c.id === id),
        site = this.site(s, id);
      const target = level ?? c.level + 1,
        rule = this.ranks[target - 1];
      if (!rule) return [];
      const values = {
        days: s.day - Math.max(0, c.founded),
        starts: c.stats.starts,
        wins: c.stats.wins,
        podiums: c.stats.podiums,
        reputation: c.reputation,
        equity: this.equity(s, id),
        built: Object.values(site.buildings).reduce((n, v) => n + v - 1, 0),
      };
      const labels = {
        days: "Días de trayectoria",
        starts: "Carreras disputadas",
        wins: "Victorias",
        podiums: "Podios",
        reputation: "Reputación",
        equity: "Patrimonio estimado",
        built: "Ampliaciones terminadas",
      };
      const goals = Object.entries(rule).map(([key, required]) => ({
        key,
        label: labels[key],
        value: values[key],
        required,
        met: values[key] >= required,
      }));
      if (target > 1) {
        const reserve = G.Companies.monthly(s, id);
        goals.push({
          key: "liquidity",
          label: "Reserva de un mes de operación",
          value: c.balance,
          required: reserve,
          met: c.balance >= reserve,
        });
      }
      return goals;
    },
    daily(s) {
      if (!s.expansion) return;
      for (const c of s.companies) {
        const site = this.site(s, c.id);
        if (c.status !== "active" || site.lastReview === s.day) continue;
        site.lastReview = s.day;
        const crisis =
          c.level > 1 &&
          c.balance < G.Companies.monthly(s, c.id) &&
          c.reputation < (this.ranks[c.level - 1].reputation || 0) * 0.5;
        site.crisisDays = crisis ? site.crisisDays + 1 : 0;
        let direction = "";
        if (site.crisisDays >= 90) {
          c.level--;
          site.crisisDays = 0;
          direction = "desciende";
        } else if (
          !crisis &&
          c.level < 10 &&
          s.day - site.levelChanged >= 90 &&
          this.objectives(s, c.id).every((o) => o.met)
        ) {
          c.level++;
          site.highestLevel = Math.max(site.highestLevel, c.level);
          direction = "asciende";
        }
        if (direction) {
          site.levelChanged = s.day;
          this.remember(site, {
            day: s.day,
            type: direction === "asciende" ? "promotion" : "relegation",
            tier: c.level,
            amount: 0,
          });
          G.news(
            s,
            "Compañía",
            `${c.name} ${direction} al nivel ${c.level}.`,
            `${G.Data.levels[c.level - 1]}. ${direction === "asciende" ? "Los objetivos deportivos, patrimoniales y de instalaciones se han cumplido." : "Noventa días con baja reputación y menos de un mes de liquidez. Conserva edificios, capacidad y activos."}`,
            "facilities",
            c.id,
          );
        }
      }
    },
    aiCandidates(s, c, budget) {
      const site = this.site(s, c.id);
      if (
        !site ||
        site.project ||
        s.day < 60 ||
        c.balance < G.Companies.monthly(s, c.id) * 3
      )
        return [];
      const missingBuild = this.objectives(s, c.id).some(
        (o) => o.key === "built" && !o.met,
      );
      return Object.keys(this.definitions).flatMap((key) => {
        const q = this.quote(s, key, c.id);
        if (
          !q.accepted ||
          q.cost > budget ||
          c.balance - q.cost < G.Companies.monthly(s, c.id) * 3 + q.upkeep * 90
        )
          return [];
        const need =
          key === "garage"
            ? G.ownedCars(s, c.id).length >= c.carCapacity
            : key === "warehouse"
              ? G.Workshop.occupied(s, c.id) >= c.sparesCapacity - 2
              : key === "workshop"
                ? G.ownedCars(s, c.id).length > 1
                : G.ownedDrivers(s, c.id).length >= c.driverCapacity ||
                  G.Staff.owned(s, c.id).length >= G.Staff.capacity(s, c.id);
        if (!need && !missingBuild) return [];
        return [
          {
            action: "ampliación",
            utility:
              (need ? 45 : 24) +
              (c.personality === "Desarrolladora" ? 8 : 0) -
              q.cost / 2000,
            reason: `${this.definitions[key].name}: ampliar capacidad con reserva para tres meses de operación.`,
            targetId: null,
            cost: q.cost,
            run: () => this.start(s, key, c.id),
          },
        ];
      });
    },
    archiveSeason(s) {
      if (
        !s.expansion ||
        s.season.phase !== "complete" ||
        s.expansion.archive.some((h) => h.year === s.season.year)
      )
        return;
      const teams = G.leaderboard(s).map((row) => ({
        companyId: row.company.id,
        name: row.company.name,
        points: row.points,
        wins: row.wins,
        podiums: row.podiums,
        starts: row.starts,
      }));
      const drivers = new Map();
      const events = s.season.events.map((e) => ({
        id: e.id,
        round: e.round,
        day: e.day,
        track: e.track,
        trackName: G.Data.tracks[e.track].name,
        ...(s.competitions ? { cup: e.cup, final: e.final } : {}),
        status: e.status,
        results: e.results.map((row) => {
          const d = drivers.get(row.driverId) || {
            driverId: row.driverId,
            name: row.name,
            points: 0,
            wins: 0,
            starts: 0,
          };
          d.points += row.points;
          d.starts++;
          if (row.position === 1 && !row.dnf) d.wins++;
          drivers.set(row.driverId, d);
          const car = s.cars.find((c) => c.id === row.carId);
          return {
            ...G.clone(row),
            carLabel: car
              ? `${car.brand} ${car.model} ${car.generation}`
              : row.carId,
          };
        }),
      }));
      s.expansion.archive.unshift({
        year: s.season.year,
        name: s.season.name,
        completedDay: s.day,
        teams,
        drivers: [...drivers.values()].sort(
          (a, b) =>
            b.points - a.points ||
            b.wins - a.wins ||
            a.driverId.localeCompare(b.driverId),
        ),
        events,
        ...(s.competitions ? { competitionVersion: 1 } : {}),
      });
    },
    validate(s) {
      const x = s.expansion;
      if (x === undefined) return;
      const integer = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;
      G.assert(
        x &&
          x.version === 1 &&
          x.builder &&
          Number.isFinite(x.builder.balance) &&
          x.builder.balance >= 0 &&
          x.sites &&
          Object.keys(x.sites).length === s.companies.length &&
          Array.isArray(x.archive),
        "Instalaciones o constructora inválidas.",
      );
      for (const c of s.companies) {
        const site = x.sites[c.id];
        G.assert(
          site &&
            site.buildings &&
            Object.keys(site.buildings).length === 4 &&
            Object.keys(this.definitions).every((k) =>
              integer(site.buildings[k], 1, 5),
            ) &&
            site.base &&
            integer(site.base.cars, 1, 10) &&
            integer(site.base.drivers, 1, 10) &&
            integer(site.base.spares, 1, 100) &&
            integer(site.highestLevel, c.level, 10) &&
            integer(site.levelChanged, 0, s.day) &&
            integer(site.lastReview, 0, s.day) &&
            integer(site.crisisDays, 0, 89) &&
            Array.isArray(site.history) &&
            site.history.length <= 40,
          "Sede empresarial inválida.",
        );
        const cap = this.capacity(site);
        G.assert(
          c.carCapacity === cap.cars &&
            c.driverCapacity === cap.drivers &&
            c.sparesCapacity === cap.spares,
          "La capacidad no corresponde a las instalaciones construidas.",
        );
        for (const h of site.history)
          G.assert(
            integer(h.day, 0, s.day) &&
              [
                "start",
                "complete",
                "cancel",
                "promotion",
                "relegation",
              ].includes(h.type) &&
              integer(h.tier, 1, 10) &&
              Number.isFinite(h.amount) &&
              h.amount >= 0 &&
              (h.key === undefined || this.definitions[h.key]),
            "Historial de obras inválido.",
          );
        const j = site.project;
        if (j !== null)
          G.assert(
            j &&
              c.status === "active" &&
              this.definitions[j.key] &&
              j.from === site.buildings[j.key] &&
              j.to === j.from + 1 &&
              integer(j.to, 2, 5) &&
              j.cost === this.price(j.key, j.to) &&
              integer(j.start, 0, s.day) &&
              j.end > s.day &&
              j.end === j.start + this.definitions[j.key].days + (j.to - 2) * 7,
            "Obra o reserva de construcción inválida.",
          );
      }
      const years = new Set();
      G.assert(x.archive.length <= 2000, "Archivo histórico demasiado grande.");
      for (const h of x.archive) {
        G.assert(
          integer(h.year, 2026, 9999) &&
            !years.has(h.year) &&
            typeof h.name === "string" &&
            integer(h.completedDay, 0, s.day) &&
            Array.isArray(h.teams) &&
            Array.isArray(h.drivers) &&
            Array.isArray(h.events) &&
            h.events.length === (h.competitionVersion ? 20 : 6),
          "Temporada archivada inválida.",
        );
        years.add(h.year);
        const teams = new Set(),
          drivers = new Map();
        for (const t of h.teams) {
          G.assert(
            s.companies.some((c) => c.id === t.companyId) &&
              !teams.has(t.companyId) &&
              typeof t.name === "string" &&
              [t.points, t.wins, t.podiums, t.starts].every((n) =>
                integer(n, 0, 100000),
              ),
            "Clasificación histórica inválida.",
          );
          teams.add(t.companyId);
        }
        const eventIds = new Set(),
          rounds = {};
        for (const [i, e] of h.events.entries()) {
          G.assert(
            typeof e.id === "string" &&
              /^event-[0-9]+$/.test(e.id) &&
              !eventIds.has(e.id) &&
              (h.competitionVersion
                ? G.Competition.rules[e.cup] &&
                  typeof e.final === "boolean" &&
                  e.round === (rounds[e.cup] = (rounds[e.cup] || 0) + 1)
                : e.round === i + 1) &&
              integer(e.day, 0, h.completedDay) &&
              integer(e.track, 0, G.Data.tracks.length - 1) &&
              typeof e.trackName === "string" &&
              ["completed", "skipped"].includes(e.status) &&
              Array.isArray(e.results) &&
              e.results.length <= s.companies.length,
            "Carrera histórica inválida.",
          );
          eventIds.add(e.id);
          const participants = new Set();
          for (const [pos, r] of e.results.entries()) {
            G.assert(
              teams.has(r.companyId) &&
                s.drivers.some((d) => d.id === r.driverId) &&
                s.cars.some((c) => c.id === r.carId) &&
                !participants.has(r.companyId) &&
                r.position === pos + 1 &&
                typeof r.name === "string" &&
                typeof r.team === "string" &&
                typeof r.carLabel === "string" &&
                typeof r.dnf === "boolean" &&
                (r.time === null || (Number.isFinite(r.time) && r.time >= 0)) &&
                integer(r.points, 0, 10000) &&
                Number.isFinite(r.prize) &&
                r.prize >= 0 &&
                (r.bestLap === null ||
                  (Number.isFinite(r.bestLap) && r.bestLap > 0)),
              "Resultado histórico inválido.",
            );
            participants.add(r.companyId);
            const d = drivers.get(r.driverId) || {
              points: 0,
              starts: 0,
              wins: 0,
            };
            d.points += r.points;
            d.starts++;
            if (r.position === 1 && !r.dnf) d.wins++;
            drivers.set(r.driverId, d);
          }
        }
        G.assert(
          h.drivers.length === drivers.size &&
            new Set(h.drivers.map((d) => d.driverId)).size === drivers.size,
          "Pilotos históricos duplicados.",
        );
        for (const d of h.drivers) {
          const actual = drivers.get(d.driverId);
          G.assert(
            actual &&
              typeof d.name === "string" &&
              ["points", "starts", "wins"].every((k) => d[k] === actual[k]),
            "Puntos históricos de pilotos incoherentes.",
          );
        }
        for (const t of h.teams) {
          const rows = h.events.flatMap((e) =>
            e.results.filter((r) => r.companyId === t.companyId),
          );
          G.assert(
            t.points === rows.reduce((n, r) => n + r.points, 0) &&
              t.starts === rows.length &&
              t.wins ===
                rows.filter((r) => r.position === 1 && !r.dnf).length &&
              t.podiums ===
                rows.filter((r) => r.position <= 3 && !r.dnf).length,
            "Puntos históricos de equipos incoherentes.",
          );
        }
      }
    },
  });
})();
