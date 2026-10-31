"use strict";
(() => {
  const G = RCS,
    B = G.DriverAbilities,
    R = G.Race,
    W = G.RaceWeekend;
  const N = (G.DriverWorld = {
    enabled: (s) => s?.driverWorld?.version === 1,
    initialize(s) {
      if (s.driverWorld !== undefined) {
        G.assert(
          N.enabled(s),
          "Versión de desarrollo de pilotos incompatible.",
        );
        return s;
      }
      G.assert(
        G.RaceSkills.enabled(s) && !s.race && !G.Auctions.active(s),
        "Termina la actividad en directo antes de actualizar pilotos y agenda.",
      );
      s.driverWorld = {
        version: 1,
        since: s.day,
        lastDaily: s.day,
        seenDay: s.day,
        seen: [],
        talents: {},
        programs: [],
        history: [],
      };
      for (const d of s.drivers) s.driverWorld.talents[d.id] = B.seeded(s, d);
      return s;
    },
    scout(s) {
      return G.Staff.owned(s).some(
        (e) => e.role === "scout" && e.contract && e.contract.end > s.day,
      );
    },
    unread(s) {
      return N.enabled(s)
        ? s.news.filter(
            (n) =>
              n.day === s.day &&
              (s.driverWorld.seenDay !== s.day ||
                !s.driverWorld.seen.includes(n.id)),
          ).length
        : 0;
    },
    markRead(s) {
      if (N.enabled(s)) {
        s.driverWorld.seenDay = s.day;
        s.driverWorld.seen = s.news
          .filter((n) => n.day === s.day)
          .map((n) => n.id);
      }
    },
    learningRate(s, d, focus, level = 0) {
      return N.enabled(s)
        ? 7.25 * (d ? B.learning(s, d, focus, level) : 1)
        : G.TeamLife.enabled(s)
          ? 1.45
          : 1;
    },
    puncture(r, a) {
      if (!r.abilityVersion || a.tires > 0 || a.puncture) return;
      a.puncture = true;
      if (a.compound === "road") a.roadPuncture = true;
      a.abilities.punctureAt = r.time;
      G.Race.event(
        r,
        "puncture",
        `${a.name}: neumático al 0 %, pinchazo confirmado. Solo puede volver despacio a boxes.`,
        [a.carId],
        a.progress,
      );
    },
    busy(s, id) {
      return (
        N.enabled(s) &&
        s.driverWorld.programs.some(
          (j) => j.driverId === id || j.coachId === id,
        )
      );
    },
    programEnd(s, j, reason = "Programa completado") {
      const x = s.driverWorld,
        d = s.drivers.find((d) => d.id === j.driverId),
        c = s.companies.find((c) => c.id === j.companyId),
        report = {
          ...j,
          end: s.day,
          reason,
          gain: d ? Math.max(0, d.stats[j.focus] - j.before) : 0,
        };
      x.history.unshift(report);
      x.history.length = Math.min(80, x.history.length);
      x.programs = x.programs.filter((o) => o.id !== j.id);
      G.news(
        s,
        "Talentos",
        `${c.name}: ${d.name} termina su formación.`,
        `${j.worked}/${j.days} jornadas de ${G.Drivers.labels[j.focus]}; mejora +${report.gain.toFixed(2)}. ${reason}. Inversión ${j.cost} US$, sueldos aparte.`,
        "companies",
        c.id,
      );
    },
    daily(s) {
      if (!N.enabled(s) || s.driverWorld.lastDaily >= s.day) return;
      const x = s.driverWorld;
      x.lastDaily = s.day;
      for (const j of [...x.programs]) {
        const d = s.drivers.find((d) => d.id === j.driverId),
          c = s.companies.find((c) => c.id === j.companyId),
          coach = j.coachId && s.employees.find((e) => e.id === j.coachId);
        if (
          !d?.contract ||
          (j.coachId && !coach) ||
          d.companyId !== j.companyId ||
          c.status !== "active" ||
          !G.Professionals.fit(s, d.id) ||
          d.fatigue > 75 ||
          (coach &&
            (coach.companyId !== c.id ||
              coach.contract?.arrears ||
              G.Professionals.resting(s, coach.id)))
        ) {
          N.programEnd(
            s,
            j,
            "Interrumpido: contrato, salud o disponibilidad del equipo",
          );
          continue;
        }
        const care = G.Professionals.care(s, d.id),
          level = coach ? G.Professionals.profile(s, coach.id).level : 0,
          gain =
            0.11 *
            (d.age < 28 ? 1 : 0.7) *
            (1 + level * 0.055) *
            B.learning(s, d, j.focus, level) *
            (1 + (G.Research.effect(s, "training", c.id) || 0));
        d.stats[j.focus] = Math.min(d.potential, d.stats[j.focus] + gain);
        d.fatigue = G.clamp(d.fatigue + 12, 0, 100);
        care.stress = G.clamp(care.stress + 7, 0, 100);
        d.training = null;
        j.worked++;
        if (coach) {
          coach.contributions.sessions++;
          G.Professionals.gain(s, coach.id, 3);
        }
        if (j.worked >= j.days) N.programEnd(s, j);
      }
      const next = G.nextEvent(s),
        days = next ? next.day - s.day : 365;
      if (days <= 6) return;
      for (const c of s.companies.filter(
        (c) => c.id !== s.playerId && c.status === "active",
      )) {
        if (
          x.programs.some((j) => j.companyId === c.id) ||
          x.history.some((j) => j.companyId === c.id && s.day - j.end < 7) ||
          s.day % 3 !== G.AuctionContent.hash(c.id) % 3
        )
          continue;
        const d = G.ownedDrivers(s, c.id)
          .filter(
            (d) =>
              d.contract.end > s.day + 5 &&
              !G.Market.locked(s, d.id) &&
              G.Professionals.fit(s, d.id) &&
              d.fatigue < 45 &&
              (G.Professionals.care(s, d.id)?.stress || 0) < 50,
          )
          .sort(
            (a, b) =>
              (a.age > 27) - (b.age > 27) ||
              G.Drivers.rating(a) - G.Drivers.rating(b),
          )[0];
        if (!d) continue;
        const focus = G.RaceSkills.focuses(s)
          .filter((k) => d.stats[k] < d.potential - 0.1)
          .sort((a, b) => d.stats[a] - d.stats[b])[0];
        if (!focus) continue;
        const coach = G.Staff.owned(s, c.id).find(
            (e) =>
              e.role === "trainer" &&
              e.contract.end > s.day + 5 &&
              !e.contract.arrears &&
              !G.Professionals.resting(s, e.id) &&
              !G.Staff.busy(s, e.id),
          ),
          cost =
            90 + (coach ? G.Professionals.profile(s, coach.id).level * 4 : 0),
          reserve = Math.max(700, (G.Companies.monthly(s, c.id) / 30) * 14);
        if (c.balance < cost + reserve) continue;
        G.Economy.transact(
          s,
          c.id,
          -cost,
          "Formación",
          `Programa de aprendizaje · ${d.name}`,
        );
        d.training = null;
        const j = {
          id: G.uid(s, "rival-camp"),
          companyId: c.id,
          driverId: d.id,
          coachId: coach?.id || null,
          focus,
          start: s.day,
          days: 5,
          worked: 0,
          cost,
          before: d.stats[focus],
        };
        x.programs.push(j);
        G.Companies.log(
          s,
          c,
          "formación",
          `Programa pagado de cinco jornadas para ${d.name}: ${G.Drivers.labels[focus]}.`,
          d.id,
          cost,
        );
      }
    },
    validate(s) {
      if (s.driverWorld === undefined) {
        G.assert(
          s.race?.abilityVersion === undefined,
          "Falta la versión de habilidades.",
        );
        return;
      }
      const x = s.driverWorld,
        num = (v, min = 0, max = 1e8) =>
          Number.isFinite(v) && v >= min && v <= max;
      G.assert(
        N.enabled(s) &&
          Number.isInteger(x.since) &&
          num(x.since, 0, s.day) &&
          Number.isInteger(x.lastDaily) &&
          num(x.lastDaily, x.since, s.day) &&
          Number.isInteger(x.seenDay) &&
          num(x.seenDay, 0, s.day) &&
          Array.isArray(x.seen) &&
          x.seen.length <= 200 &&
          new Set(x.seen).size === x.seen.length &&
          x.seen.every((id) => typeof id === "string") &&
          x.talents &&
          typeof x.talents === "object" &&
          !Array.isArray(x.talents),
        "Gestión de pilotos inválida.",
      );
      for (const [id, ids] of Object.entries(x.talents))
        G.assert(
          s.drivers.some((d) => d.id === id) &&
            Array.isArray(ids) &&
            ids.length >= 1 &&
            ids.length <= 3 &&
            new Set(ids).size === ids.length &&
            ids.every(
              (id) => typeof id === "string" && Object.hasOwn(B.byId, id),
            ),
          "Habilidades asignadas inválidas.",
        );
      G.assert(
        Array.isArray(x.programs) &&
          x.programs.length <= s.companies.length &&
          Array.isArray(x.history) &&
          x.history.length <= 80,
        "Programas rivales inválidos.",
      );
      for (const j of [...x.programs, ...x.history])
        G.assert(
          typeof j.id === "string" &&
            s.companies.some(
              (c) => c.id === j.companyId && c.id !== s.playerId,
            ) &&
            s.drivers.some((d) => d.id === j.driverId) &&
            (j.coachId === null ||
              s.employees.some(
                (e) => e.id === j.coachId && e.role === "trainer",
              )) &&
            G.RaceSkills.focuses(s).includes(j.focus) &&
            Number.isInteger(j.start) &&
            num(j.start, 0, s.day) &&
            j.days === 5 &&
            Number.isInteger(j.worked) &&
            num(j.worked, 0, j.days) &&
            num(j.cost, 90, 130) &&
            num(j.before, 0, 100) &&
            (j.end === undefined ||
              (Number.isInteger(j.end) &&
                num(j.end, j.start, s.day) &&
                num(j.gain, 0, 100) &&
                typeof j.reason === "string")),
          "Informe de formación rival inválido.",
        );
      G.assert(
        new Set(x.programs.map((j) => j.companyId)).size === x.programs.length,
        "Dos programas simultáneos para la misma compañía.",
      );
      B.validate(s);
    },
  });
  const create = G.createGame;
  G.createV150Game = create;
  G.createGame = function (...args) {
    const s = create(...args);
    N.initialize(s);
    return s;
  };
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (N.enabled(s) && r.skillsVersion) {
      r.abilityVersion = 1;
      for (const a of r.entrants) {
        const d = s.drivers.find((d) => d.id === a.driverId);
        a.abilities = {
          ids: [...B.ids(s, d)],
          baseStats: G.clone(a.stats),
          active: [],
          rng: G.AuctionContent.hash(
            `${s.seed}/${a.driverId}/${r.eventId}/ability`,
          ),
          nextUpdate: 0,
          boostUsed: false,
          boostUntil: 0,
          nextDirty: 0,
          dirtyUntil: 0,
          dirtyTarget: null,
          clock: 0,
          punctureAt: null,
        };
        N.puncture(r, a);
      }
    }
    return r;
  };
  const finish = R.finish;
  R.finish = function (s, ...args) {
    const r = s.race;
    if (r?.abilityVersion)
      for (const a of r.entrants) {
        a.stats = G.clone(a.abilities.baseStats);
      }
    return finish.call(this, s, ...args);
  };
  const target = W.target;
  W.target = function (r, a, ...args) {
    N.puncture(r, a);
    const speed = target.call(this, r, a, ...args);
    return r.abilityVersion && a.puncture ? Math.min(speed, 5) : speed;
  };
  const moved = W.moved;
  W.moved = function (s, r, a, ...args) {
    const result = moved.call(this, s, r, a, ...args);
    N.puncture(r, a);
    return result;
  };
  const motion = G.RaceSkills.motion;
  G.RaceSkills.motion = function (r, a, ...args) {
    const v = motion.call(this, r, a, ...args);
    if (r.abilityVersion && a.puncture) {
      v.target = Math.min(v.target, 5);
      // A flat tire adds strong rolling resistance even when its braking grip is poor.
      v.brakes = Math.max(v.brakes, 3.5);
      a.skills.rotation = 0;
      a.skills.rotating = false;
    }
    return v;
  };
  const wear = W.wearFactor;
  W.wearFactor = function (r, a) {
    return wear.call(this, r, a) * (r.abilityVersion ? B.wear(a, r.time) : 1);
  };
  const busy = G.Staff.busy;
  G.Staff.busy = function (s, id) {
    return busy.call(this, s, id) || N.busy(s, id);
  };
  const candidates = G.AI.candidates;
  G.AI.candidates = function (s, c) {
    const rows = candidates.call(this, s, c);
    if (!N.enabled(s)) return rows;
    return rows
      .filter((row) => row.action !== "entrenamiento")
      .map((row) =>
        ["repuesto", "instalación"].includes(row.action)
          ? {
              ...row,
              utility: Math.max(row.utility, 103),
              reason:
                "Invertir en una mejora física compatible conservando la reserva salarial.",
            }
          : row,
      )
      .sort(
        (a, b) =>
          b.utility - a.utility ||
          a.action.localeCompare(b.action) ||
          String(a.targetId).localeCompare(String(b.targetId)),
      );
  };
  const learning = G.Camps.learning;
  G.Camps.learning = function (laps, ability, intensity, bonus, rate = 1) {
    const amount = learning.call(this, laps, ability, intensity, bonus, rate);
    return rate > 1.45
      ? Math.min(amount, 5, 0.25 + laps * 0.18 + ability * 0.15)
      : amount;
  };
})();
