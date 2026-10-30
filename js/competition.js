"use strict";
(() => {
  const G = RCS,
    R = G.Race,
    B = G.Challenge;
  const C = (G.Competition = {
    enabled: (s) => s?.competitions?.version === 1,
    rules: {
      street: {
        name: "Liga Callejera",
        qualify: 12,
        fee: 180,
        transport: 40,
        maxHP: 350,
        prizes: [1400, 1100, 850, 650, 500, 380, 280, 180],
        points: [15, 12, 10, 8, 6, 4, 2, 1],
      },
      pro: {
        name: "Copa Regional Profesional",
        qualify: 18,
        fee: 1800,
        transport: 300,
        maxHP: 280,
        prizes: [6200, 4700, 3600, 2800, 2100, 1600, 1200, 900],
        points: [15, 12, 10, 8, 6, 4, 2, 1],
      },
      national: {
        name: "Copa Nacional",
        qualify: 18,
        fee: 6500,
        transport: 700,
        maxHP: 320,
        prizes: [20000, 14000, 10000, 7000, 5000, 3000, 2000, 1500],
        points: [15, 12, 10, 8, 6, 4, 2, 1],
      },
    },
    rule: (e) => C.rules[e.cup],
    fee(e) {
      const r = this.rule(e);
      return (
        r.fee +
        r.transport +
        (e.final
          ? e.cup === "street"
            ? 100
            : e.cup === "national"
              ? 1800
              : 900
          : 0)
      );
    },
    board(s, cup) {
      return Object.entries(s.season.cups[cup].standings)
        .map(([id, v]) => ({
          ...v,
          company: s.companies.find((c) => c.id === id),
        }))
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.wins - a.wins ||
            a.company.id.localeCompare(b.company.id),
        );
    },
    score(s, id, cup, qualifying = false) {
      const v = s.season.cups[cup].standings[id];
      return v ? (qualifying ? v.qualifying : v.points) : 0;
    },
    eligible(s, e, cid = s.playerId) {
      if (e.final && this.score(s, cid, e.cup, true) < this.rule(e).qualify)
        return `Necesitas ${this.rule(e).qualify} puntos de clasificación de esta liga; tienes ${this.score(s, cid, e.cup, true)}.`;
      if (e.cup !== "street" && !s.competitions.licenses[cid])
        return "Necesitas licencia profesional: 24 puntos callejeros acumulados y $900 para tramitarla.";
      if (e.cup === "national" && (s.competitions.proPoints[cid] || 0) < 12)
        return `Necesitas 12 puntos acumulados en la copa regional; tienes ${s.competitions.proPoints[cid] || 0}.`;
      return "";
    },
    registrationReason(s, e, cid = s.playerId) {
      return (
        this.eligible(s, e, cid) ||
        (e.day - s.day > 14
          ? `La inscripción abre el ${G.dateAt(e.day - 14)
              .toISOString()
              .slice(0, 10)} (14 días antes de la prueba).`
          : "")
      );
    },
    technical(s, e, car, d) {
      const camp = G.Practice.active(s);
      if (
        camp?.calendarVersion &&
        (camp.driverId === d.id || camp.carId === car.id)
      )
        return "Termina o interrumpe el programa de pista antes de inscribir a ese piloto o coche.";
      if (d.contract.end <= e.day)
        return "El contrato del piloto debe cubrir la jornada de carrera. Renueva antes de inscribirte.";
      if (!G.Professionals.fit(s, d.id))
        return G.Professionals.care(s, d.id)?.retired
          ? `${d.name} se ha retirado por un accidente grave y no puede competir. Selecciona otro piloto.`
          : `El piloto necesita recuperación médica: ${d.name} está lesionado hasta el ${G.Feedback.date(G.Professionals.care(s, d.id).injuryUntil)}. Espera o consulta Operaciones y salud.`;
      if (d.fatigue >= 90)
        return `El piloto necesita descansar: fatiga ${d.fatigue.toFixed(1)}/100; debe estar por debajo de 90. Ponlo a descansar y avanza el calendario antes de inscribirlo.`;
      if (car.repair || !G.Workshop.ready(car))
        return (
          "El coche necesita mantenimiento: " + G.Feedback.car(s, car).join(" ")
        );
      if (car.hp > this.rule(e).maxHP)
        return `Límite de ${this.rule(e).maxHP} CV para esta prueba; tu coche tiene ${car.hp.toFixed(1)} CV. Reduce su preparación en Taller o selecciona otro coche.`;
      if (
        e.cup !== "street" &&
        (car.condition < (e.cup === "national" ? 75 : 70) ||
          car.components.brakes < (e.cup === "national" ? 80 : 75) ||
          car.components.suspension < (e.cup === "national" ? 75 : 70) ||
          car.tires < (e.cup === "national" ? 45 : 35))
      )
        return `Verificación ${e.cup === "national" ? "nacional" : "técnica profesional"}: ${[
          ["estado general", car.condition, e.cup === "national" ? 75 : 70],
          ["frenos", car.components.brakes, e.cup === "national" ? 80 : 75],
          [
            "suspensión",
            car.components.suspension,
            e.cup === "national" ? 75 : 70,
          ],
          ["neumáticos", car.tires, e.cup === "national" ? 45 : 35],
        ]
          .filter(([, value, minimum]) => value < minimum)
          .map(
            ([label, value, minimum]) =>
              `${label} al ${value.toFixed(1)} %, mínimo ${minimum} %`,
          )
          .join(
            "; ",
          )}. Repara esos sistemas o cambia las gomas en Taller antes de inscribirte.`;
      if (
        e.cup !== "street" &&
        G.Drivers.rating(d) < (e.cup === "national" ? 24 : 22)
      )
        return `El piloto necesita valoración ${e.cup === "national" ? 24 : 22} como mínimo para esta prueba; ${d.name} tiene ${G.Drivers.rating(d)}. Entrénalo en el campus o selecciona otro piloto.`;
      return "";
    },
    license(s) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de tramitar la licencia.");
      G.assert(!s.competitions.licenses[s.playerId], "Ya tienes licencia.");
      G.assert(
        (s.competitions.streetPoints[s.playerId] || 0) >= 24,
        `Necesitas 24 puntos callejeros acumulados: tienes ${s.competitions.streetPoints[s.playerId] || 0} y te faltan ${Math.max(0, 24 - (s.competitions.streetPoints[s.playerId] || 0))}. Disputa más pruebas callejeras antes de tramitar la licencia.`,
      );
      G.Economy.spend(
        s,
        900,
        "Licencia",
        "Licencia de competición profesional",
      );
      s.competitions.licenses[s.playerId] = true;
      G.news(
        s,
        "Competición",
        "Licencia profesional concedida.",
        "La licencia no sustituye las verificaciones técnicas ni los puntos de acceso a la final.",
        "competition",
      );
    },
    enters(s, c, e) {
      if (c.id === s.playerId) return !!e.entry;
      if (e.cup !== "street" && c.privateer) return false;
      if (e.cup === "street" && !c.privateer) {
        const guest = s.companies.find(
          (c) => c.id !== s.playerId && !c.privateer,
        );
        if (c.id !== guest.id || e.round !== 3) return false;
      }
      const lineup = this.lineup(s, c.id, e);
      return (
        !this.eligible(s, e, c.id) &&
        lineup.driver &&
        lineup.car &&
        !this.technical(s, e, lineup.car, lineup.driver)
      );
    },
    lineup(s, id, e) {
      const d = G.Companies.lineup(s, id).driver;
      return {
        driver: d,
        car: d
          ? G.ownedCars(s, id)
              .filter(
                (car) =>
                  !car.repair &&
                  !G.Market.listed(s, car.id) &&
                  G.Workshop.ready(car) &&
                  !this.technical(s, e, car, d),
              )
              .sort(
                (a, b) => G.Companies.carRating(b) - G.Companies.carRating(a),
              )[0]
          : null,
      };
    },
    makeSeason(s, year) {
      const events = [],
        start = G.dayOf(year, 0, 5),
        cups = {};
      for (const key of Object.keys(this.rules))
        cups[key] = {
          standings: Object.fromEntries(
            s.companies
              .filter((c) => c.status === "active")
              .map((c) => [
                c.id,
                { points: 0, qualifying: 0, wins: 0, starts: 0 },
              ]),
          ),
          champion: null,
        };
      const schedule = [
        ["street", 6, 7],
        ["street", 7, 21],
        ["street", 8, 35],
        ["street", 9, 49],
        ["street", 16, 91],
        ["pro", 10, 112],
        ["street", 17, 154],
        ["pro", 11, 168],
        ["street", 8, 217],
        ["pro", 12, 224],
        ["pro", 13, 266],
        ["street", 9, 280],
        ["pro", 14, 294],
        ["street", 9, 329, true],
        ["pro", 15, 343, true],
        ["national", 18, 189],
        ["national", 19, 245],
        ["national", 20, 308],
        ["national", 21, 322],
        ["national", 15, 350, true],
      ];
      schedule.sort((a, b) => a[2] - b[2]);
      const rounds = { street: 0, pro: 0, national: 0 };
      for (const [cup, track, day, final = false] of schedule)
        events.push({
          id: G.uid(s, "event"),
          cup,
          track,
          day: start + day,
          round: ++rounds[cup],
          final,
          status: "scheduled",
          entry: null,
          results: [],
        });
      return {
        year,
        name: "Del asfalto a los circuitos",
        phase: "active",
        competitionVersion: 1,
        cups,
        events,
        standings: Object.fromEntries(
          s.companies
            .filter((c) => c.status === "active")
            .map((c) => [c.id, { points: 0, wins: 0, podiums: 0, starts: 0 }]),
        ),
      };
    },
    initialize(s) {
      if (this.enabled(s)) return s;
      s.competitions = {
        version: 1,
        licenses: Object.fromEntries(
          s.companies.map((c) => [c.id, c.id !== s.playerId]),
        ),
        streetPoints: Object.fromEntries(s.companies.map((c) => [c.id, 0])),
        proPoints: Object.fromEntries(s.companies.map((c) => [c.id, 0])),
      };
      for (const c of s.companies.filter((c) => c.id !== s.playerId)) {
        const d = G.ownedDrivers(s, c.id)[0];
        if (!d) continue;
        const delta = Math.max(0, 24 - G.Drivers.rating(d));
        for (const k of G.Drivers.stats) d.stats[k] += delta;
        d.potential = Math.max(d.potential, ...Object.values(d.stats));
        d.ask = B.driverAsk(d);
        d.contract.salary = d.ask;
      }
      const names = [
          "Equipo Nómada",
          "Los del Puerto",
          "Ronda Cero",
          "Avenida Sur",
          "Taller Eclipse",
          "Asfalto Libre",
          "Distrito Motor",
        ],
        colors = [
          "#ef8648",
          "#936fb6",
          "#458a97",
          "#bd604e",
          "#ccb768",
          "#6b9a75",
          "#a8adb9",
        ];
      for (let i = 0; i < 7; i++) {
        const c = {
          ...G.clone(s.companies[1]),
          id: G.uid(s, "company"),
          name: names[i],
          owner: "Equipo independiente",
          personality: [
            "Agresiva",
            "Formadora",
            "Conservadora",
            "Oportunista",
            "Desarrolladora",
            "Agresiva",
            "Conservadora",
          ][i],
          color: colors[i],
          privateer: true,
          status: "active",
          debtDays: 0,
          balance: 9500 + i * 650,
          ledger: [],
          stats: { starts: 0, wins: 0, podiums: 0 },
          decisions: [],
          job: null,
          level: 1,
          reputation: 3,
          nextDecision: s.day + 1,
          lastJob: -7,
        };
        s.companies.push(c);
        s.expansion.sites[c.id] = G.clone(s.expansion.sites[s.companies[1].id]);
        s.competitions.licenses[c.id] = false;
        s.competitions.streetPoints[c.id] = 0;
        s.competitions.proPoints[c.id] = 0;
        const d = G.Drivers.generate(s, c.id);
        for (const key of G.Drivers.stats)
          d.stats[key] = G.clamp(
            10 +
              i * 1.6 +
              G.integer(s.challenge, -5, 9) +
              (G.Data.traits[d.trait][key] || 0),
            3,
            35,
          );
        d.ask = B.driverAsk(d);
        d.contract = {
          salary: d.ask,
          period: "day",
          bonus: 0,
          start: s.day,
          end: s.day + 365,
          role: "principal",
          accrued: 0,
        };
        s.drivers.push(d);
        G.Professionals.care(s, d.id).recruited = true;
        const model = [6, 7, 8, 4, 5, 9, 4][i],
          car = G.makeCar(s, c.id, model, c.color);
        car.base = Object.fromEntries(
          G.Workshop.attributes.map((k) => [k, car[k]]),
        );
        car.components = Object.fromEntries(
          Object.keys(G.Parts.components).map((k) => [
            k,
            k === "tires" ? 82 : 88,
          ]),
        );
        car.installed = {};
        car.oemTires = 82;
        car.upgradeValue = 0;
        G.Workshop.recalculate(s, car);
        s.cars.push(car);
      }
      for (let i = 24; i < G.Data.models.length; i++) {
        if (G.Data.models[i].auctionOnly || G.Data.models[i].showroomOnly)
          continue;
        const car = G.makeCar(
          s,
          null,
          i,
          ["#ad493a", "#294958", "#e4d6ad", "#668176", "#717c98", "#c8a261"][
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
      s.season = this.makeSeason(s, s.season.year);
      G.news(
        s,
        "Competición",
        "Tu primer camino empieza en la calle.",
        "Las inscripciones callejeras parten de $220. Suma puntos, prepara el coche y tramita la licencia para las copas profesionales. Los daños se pagan; abandonar no da puntos.",
        "competition",
      );
      return s;
    },
    raceFinished(s, e, r) {
      for (const row of e.results) {
        const v = s.season.cups[e.cup].standings[row.companyId];
        G.assert(v, "Participante fuera del campeonato.");
        v.starts++;
        v.points += row.points;
        if (!e.final) v.qualifying += row.points;
        if (row.position === 1 && !row.dnf) v.wins++;
        if (e.cup === "street")
          s.competitions.streetPoints[row.companyId] =
            (s.competitions.streetPoints[row.companyId] || 0) + row.points;
        if (e.cup === "pro")
          s.competitions.proPoints[row.companyId] =
            (s.competitions.proPoints[row.companyId] || 0) + row.points;
      }
      for (const c of s.companies.filter((c) => c.id !== s.playerId)) {
        const sets = s.raceSupplies.sets
          .filter((t) => t.companyId === c.id && t.status === "stored")
          .sort((a, b) => b.condition - a.condition);
        sets.forEach((t, i) => {
          if (t.condition < 50 || i >= 6) t.status = "used";
        });
      }
      if (e.final) {
        const winner = e.results.find((row) => !row.dnf);
        s.season.cups[e.cup].champion = winner?.companyId || null;
      }
    },
    completeSeason(s) {
      s.season.phase = "complete";
      const pro = this.board(s, "national"),
        p = pro.findIndex((v) => v.company.id === s.playerId),
        champions = Object.fromEntries(
          Object.entries(s.season.cups).map(([key, cup]) => [
            key,
            cup.champion
              ? s.companies.find((c) => c.id === cup.champion).name
              : "Sin ganador",
          ]),
        );
      s.history.unshift({
        year: s.season.year,
        champion:
          champions.national === "Sin ganador"
            ? champions.pro
            : champions.national,
        playerPosition: p + 1,
        playerPoints: pro[p]?.points || 0,
        bonus: 0,
        logo: s.logo,
        standings: pro.map((v) => ({ name: v.company.name, points: v.points })),
        cups: champions,
      });
      G.Facilities.archiveSeason(s);
      G.news(
        s,
        "Temporada",
        `Temporada ${s.season.year} completada.`,
        `Liga callejera: ${champions.street}. Copa regional: ${champions.pro}. Copa nacional: ${champions.national}. Los campeones se decidieron en sus finales; no se concede una prima automática por renunciar.`,
        "history",
      );
    },
    maintenance(s, c) {
      if (!this.enabled(s) || c.privateer) return [];
      const next = s.season.events.find(
          (e) =>
            e.cup !== "street" &&
            e.status === "scheduled" &&
            !this.eligible(s, e, c.id),
        ),
        car = G.Companies.lineup(s, c.id).car;
      if (
        !next ||
        next.day - s.day > 14 ||
        next.day - s.day < 3 ||
        !car ||
        car.repair ||
        G.Market.listed(s, car.id) ||
        G.Facilities.workload(s, c.id) >= G.Facilities.bays(s, c.id)
      )
        return [];
      const component =
        car.components.brakes < (next.cup === "national" ? 85 : 80)
          ? "brakes"
          : car.components.suspension < (next.cup === "national" ? 80 : 75)
            ? "suspension"
            : car.condition < (next.cup === "national" ? 79 : 74)
              ? "all"
              : null;
      if (!component) return [];
      const cost = G.Workshop.repairQuote(car, component);
      if (
        c.balance <
        cost + this.fee(next) + (G.Companies.monthly(s, c.id) / 30) * 7
      )
        return [];
      return [
        {
          action: "verificación técnica",
          utility: 118,
          reason:
            "Preparar un componente para cumplir la verificación profesional antes de la prueba.",
          targetId: car.id,
          cost,
          run: () => G.Workshop.repair(s, car.id, component, c.id),
        },
      ];
    },
    validate(s) {
      if (s.competitions === undefined) return;
      G.assert(
        this.enabled(s) && s.challenge && s.season.competitionVersion === 1,
        "Formato de competiciones inválido.",
      );
      G.assert(
        s.season.events.length === 20 &&
          s.competitions.licenses &&
          s.competitions.streetPoints,
        "Calendario de ligas inválido.",
      );
      for (const e of s.season.events)
        G.assert(
          this.rules[e.cup] &&
            G.Data.tracks[e.track]?.modern &&
            G.Data.tracks[e.track].kind ===
              (e.cup === "street" ? "street" : "pro") &&
            Number.isInteger(e.round) &&
            typeof e.final === "boolean",
          "Reglamento del evento inválido.",
        );
      for (const key of Object.keys(this.rules)) {
        G.assert(
          s.season.cups?.[key]?.standings,
          "Falta clasificación de liga.",
        );
        for (const [id, v] of Object.entries(s.season.cups[key].standings))
          G.assert(
            s.companies.some((c) => c.id === id) &&
              ["points", "qualifying", "wins", "starts"].every(
                (k) => Number.isInteger(v[k]) && v[k] >= 0,
              ) &&
              v.qualifying <= v.points,
            "Puntos de campeonato inválidos.",
          );
      }
      for (const c of s.companies)
        G.assert(
          typeof s.competitions.licenses[c.id] === "boolean" &&
            Number.isInteger(s.competitions.streetPoints[c.id]) &&
            s.competitions.streetPoints[c.id] >= 0 &&
            Number.isInteger(s.competitions.proPoints[c.id]) &&
            s.competitions.proPoints[c.id] >= 0,
          "Licencia o trayectoria inválida.",
        );
      if (s.race) {
        const r = s.race;
        G.assert(
          r.competitionVersion === 1 &&
            this.rules[r.cup] &&
            r.trackWidth === G.Data.tracks[r.track].width,
          "Carrera sin reglamento.",
        );
        for (const a of r.entrants) {
          const b = a.brain;
          G.assert(
            b &&
              [b.commitUntil, b.lastContact].every(Number.isFinite) &&
              ["line", "pass", "wait", "contact"].includes(b.tactic) &&
              (b.targetCar === null ||
                r.entrants.some((o) => o.carId === b.targetCar)) &&
              ["speedCeiling", "passLane", "lastWall", "lastPenalty"].every(
                (k) => b[k] === undefined || Number.isFinite(b[k]),
              ),
            "Decisiones del piloto inválidas.",
          );
        }
      }
      for (const rec of [s.race?.replay, s.raceSupplies.lastReplay])
        if (rec?.competitionVersion !== undefined)
          G.assert(
            rec.competitionVersion === 1 &&
              this.rules[rec.cup] &&
              G.Data.tracks[rec.track]?.modern &&
              rec.trackWidth === G.Data.tracks[rec.track].width,
            "Reglamento de repetición inválido.",
          );
    },
  });
  const create = G.createGame;
  G.createV64Game = create;
  G.createGame = (...args) => C.initialize(create(...args));
  const season = G.makeSeason;
  G.makeSeason = (s, year) =>
    C.enabled(s) ? C.makeSeason(s, year) : season(s, year);
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (C.enabled(s)) {
      const e = s.season.events.find((e) => e.id === r.eventId);
      r.competitionVersion = 1;
      r.cup = e.cup;
      r.trackWidth = G.Data.tracks[r.track].width;
      r.replay.competitionVersion = 1;
      r.replay.cup = e.cup;
      r.replay.trackWidth = r.trackWidth;
      for (const a of r.entrants) {
        a.brain.commitUntil = 0;
        a.brain.targetCar = null;
        a.brain.lastContact = -100;
        a.brain.tactic = "line";
        a.rules = e.cup;
      }
    }
    return r;
  };
  const finish = R.finish;
  R.finish = function (s) {
    const r = s.race,
      result = finish.call(this, s);
    if (r?.competitionVersion) {
      for (const a of r.entrants) {
        const d = s.drivers.find((d) => d.id === a.driverId);
        if (a.dnf && a.damage > 20) {
          const chance = G.clamp(
            ((a.damage - 15) / 140) * (r.cup === "street" ? 1.7 : 1),
            0,
            0.55,
          );
          if (G.random(r) < chance) {
            const care = G.Professionals.care(s, d.id);
            care.injuryUntil =
              s.day +
              (G.Research
                ? G.Research.recoveryDays(s, G.integer(r, 4, 18), a.companyId)
                : G.integer(r, 4, 18));
            G.news(
              s,
              "Competición",
              `${d.name} necesita recuperación.`,
              `Las consecuencias del accidente le mantienen fuera de pista hasta la jornada ${care.injuryUntil}.`,
              "driver",
              d.id,
            );
          }
        }
      }
    }
    return result;
  };
  const future = G.Contracts.future;
  G.Contracts.future = function (s) {
    const events = future.call(this, s);
    return C.enabled(s) ? events.filter((e) => e.cup !== "street") : events;
  };
  const reserve = B.aiReserve;
  B.aiReserve = function (s, c) {
    if (!C.enabled(s)) return reserve.call(this, s, c);
    const events = s.season.events.filter(
        (e) =>
          e.status === "scheduled" &&
          (c.privateer
            ? e.cup === "street"
            : e.cup !== "street" && !C.eligible(s, e, c.id)),
      ),
      days = Math.max(30, (events.at(-1)?.day || s.day + 30) - s.day + 14),
      daily = G.Companies.monthly(s, c.id) / 30;
    return Math.max(
      daily * G.AI.policy(c).reserve,
      Math.max(0, daily - 420 / 7) * days +
        events.reduce((n, e) => n + C.fee(e) + 350, 0) +
        800,
    );
  };
})();
