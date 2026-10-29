"use strict";
(() => {
  const G = RCS,
    S = G.Staff,
    P = G.Professionals;
  S.roles.researcher = {
    name: "Investigador científico",
    base: 500,
    rate: 5,
    description:
      "Desarrolla protocolos permanentes del equipo. Cobra un sueldo diario alto; nivel, habilidad y estrés cambian el coste y el plazo de cada investigación.",
  };
  const R = (G.Research = {
    enabled: (s) => s?.research?.version === 1,
    nodes: [
      {
        id: "recovery",
        branch: "health",
        name: "Recuperación guiada",
        description:
          "Reduce un 8 % la duración de nuevas lesiones recuperables.",
        cost: 550,
        days: 7,
        level: 1,
        requires: [],
        effects: { recovery: 0.08 },
      },
      {
        id: "rest",
        branch: "health",
        name: "Sueño y descanso",
        description:
          "Recupera un 8 % más de fatiga en las jornadas de descanso.",
        cost: 2200,
        days: 14,
        level: 3,
        requires: ["recovery"],
        effects: { rest: 0.08 },
      },
      {
        id: "rehabilitation",
        branch: "health",
        name: "Rehabilitación personalizada",
        description:
          "Reduce otro 12 % las lesiones nuevas; nunca evita el descanso mínimo ni una retirada.",
        cost: 8500,
        days: 28,
        level: 5,
        requires: ["rest"],
        effects: { recovery: 0.12 },
      },
      {
        id: "learning",
        branch: "training",
        name: "Registro de aprendizaje",
        description:
          "Aumenta un 5 % la mejora de atributos en formación y programas de pista.",
        cost: 650,
        days: 7,
        level: 1,
        requires: [],
        effects: { training: 0.05 },
      },
      {
        id: "telemetry",
        branch: "training",
        name: "Análisis de telemetría",
        description:
          "Otro 5 % de aprendizaje y un 5 % menos de estrés por vuelta en los programas de pista.",
        cost: 2600,
        days: 16,
        level: 3,
        requires: ["learning"],
        effects: { training: 0.05, trainingStress: 0.05 },
      },
      {
        id: "adaptation",
        branch: "training",
        name: "Planes adaptativos",
        description:
          "Otro 5 % de aprendizaje y un 8 % menos de días por programa de pista.",
        cost: 9500,
        days: 30,
        level: 5,
        requires: ["telemetry"],
        effects: { training: 0.05, campTime: 0.08 },
      },
      {
        id: "diagnostics",
        branch: "engineering",
        name: "Listas de verificación",
        description:
          "Suma 3 puntos porcentuales al acierto del diagnóstico de mecánico e ingeniero.",
        cost: 700,
        days: 8,
        level: 1,
        requires: [],
        effects: { diagnostics: 3 },
      },
      {
        id: "pit-protocol",
        branch: "engineering",
        name: "Procedimientos de boxes",
        description:
          "Reduce un 3 % el tiempo de servicio de un mecánico; no sustituye al equipo ni evita errores.",
        cost: 3000,
        days: 17,
        level: 3,
        requires: ["diagnostics"],
        effects: { pit: 0.03 },
      },
      {
        id: "tire-data",
        branch: "engineering",
        name: "Mapa de desgaste",
        description:
          "Reduce un 3 % el desgaste continuo de neumáticos; los golpes y derrapes conservan su coste.",
        cost: 10500,
        days: 32,
        level: 5,
        requires: ["pit-protocol"],
        effects: { tireWear: 0.03 },
      },
    ],
    branches: {
      health: "Salud y recuperación",
      training: "Aprendizaje del piloto",
      engineering: "Operación técnica",
    },
    initialize(s, options = {}) {
      if (this.enabled(s)) return s;
      G.assert(
        s.competitions && !s.race && !G.Practice.active(s),
        "Termina la carrera o práctica anterior antes de activar investigación y programas por días.",
      );
      s.research = {
        version: 1,
        sequence: 0,
        rng: (s.seed ^ 0x080a721) >>> 0,
        lastDaily: s.day,
        lastRecruit: s.day,
        completed: {},
        project: null,
        history: [],
        expandedCalendar: false,
      };
      for (const level of [1, 2, 3, 5, 7]) this.recruit(s, level);
      G.ContentExpansion?.initialize(s);
      if (options.newGame) {
        G.ContentExpansion.rotate(s, s.season);
        s.research.expandedCalendar = true;
      }
      return s;
    },
    recruit(s, level = 1) {
      const e = S.generate(s, "researcher", s.research);
      P.profile(s, e.id).level = level;
      e.skill = G.clamp(36 + level * 6 + G.integer(s.research, -4, 6), 25, 95);
      e.salaryPeriod = "day";
      e.ask = G.Challenge.staffAsk(s, e);
      s.employees.push(e);
      return e;
    },
    owned(s) {
      return S.owned(s).filter(
        (e) => e.role === "researcher" && e.contract?.end > s.day,
      );
    },
    effect(s, key, cid = s.playerId) {
      if (!this.enabled(s) || cid !== s.playerId) return 0;
      return Object.keys(s.research.completed).reduce(
        (n, id) => n + (this.nodes.find((n) => n.id === id)?.effects[key] || 0),
        0,
      );
    },
    recoveryDays(s, days, cid = s.playerId) {
      return Math.max(
        Math.min(2, days),
        Math.round(days * (1 - this.effect(s, "recovery", cid))),
      );
    },
    quote(s, nodeId, eid, resume = false) {
      G.ensurePlayable(s);
      G.assert(
        this.enabled(s) && !s.race,
        "Investigación no disponible durante una carrera.",
      );
      const node = this.nodes.find((n) => n.id === nodeId),
        e = this.owned(s).find((e) => e.id === eid),
        p = e && P.profile(s, e.id),
        project = s.research.project;
      G.assert(
        node && e && p,
        "Selecciona una mejora y un investigador contratado.",
      );
      G.assert(
        !s.research.completed[nodeId],
        "Esta mejora ya está investigada.",
      );
      G.assert(
        node.requires.every((id) => s.research.completed[id]),
        "Investiga primero las mejoras anteriores de esta rama.",
      );
      G.assert(
        p.level >= node.level,
        `Este proyecto requiere un investigador de nivel ${node.level}.`,
      );
      G.assert(
        !P.resting(s, e.id) &&
          !e.contract.arrears &&
          (!S.busy(s, e.id) ||
            (resume &&
              project?.scientistId === eid &&
              project.status === "paused")),
        "El investigador debe estar disponible, descansado y al día de sueldo.",
      );
      G.assert(
        resume
          ? project?.status === "paused" && project.nodeId === nodeId
          : !project,
        "Ya hay un proyecto: pausa, reanuda o cancela antes de iniciar otro.",
      );
      const discount = Math.min(0.22, (p.level - 1) * 0.024),
        duration = Math.max(
          2,
          Math.ceil(
            node.days *
              (1 - (p.level - 1) * 0.027) *
              (1 + Math.max(0, 65 - e.skill) * 0.003 + p.stress * 0.003),
          ),
        ),
        remaining = resume ? Math.max(0, 1 - project.work / node.days) : 1,
        days = Math.max(1, Math.ceil(duration * remaining)),
        cost = resume ? 0 : Math.round(node.cost * (1 - discount));
      G.assert(
        e.contract.end > s.day + days,
        "Renueva el contrato del investigador para cubrir el plazo previsto.",
      );
      return {
        node,
        e,
        level: p.level,
        cost,
        days,
        duration,
        end: s.day + days,
        discount,
        wages: days * e.contract.salary,
        total: cost + days * e.contract.salary,
      };
    },
    start(s, id, eid) {
      const q = this.quote(s, id, eid);
      G.Economy.spend(s, q.cost, "Investigación", "Proyecto · " + q.node.name);
      const j = (s.research.project = {
        id: "research-" + ++s.research.sequence,
        nodeId: id,
        scientistId: eid,
        start: s.day,
        lastDay: s.day,
        completedDay: null,
        work: 0,
        duration: q.duration,
        level: q.level,
        cost: q.cost,
        status: "active",
        blockedReason: "",
        segments: [
          {
            day: s.day,
            scientistId: eid,
            level: q.level,
            duration: q.duration,
          },
        ],
      });
      G.news(
        s,
        "Compañía",
        `Investigación: ${q.node.name}.`,
        `Materiales: $${q.cost}. Plazo: ${q.days} jornadas activas, con salario aparte. La investigación termina al avanzar días.`,
        "research",
        j.id,
      );
      return j;
    },
    pause(s) {
      G.assert(
        this.enabled(s) && !s.race && s.research.project?.status === "active",
        "No hay una investigación activa que pausar.",
      );
      s.research.project.status = "paused";
      s.research.project.blockedReason =
        "Pausa solicitada. El material y el progreso se conservan.";
    },
    resume(s, eid) {
      const j = s.research.project,
        q = this.quote(s, j?.nodeId, eid, true);
      j.scientistId = eid;
      j.duration = q.duration;
      j.level = q.level;
      j.status = "active";
      j.blockedReason = "";
      j.lastDay = s.day;
      j.segments.push({
        day: s.day,
        scientistId: eid,
        level: q.level,
        duration: q.duration,
      });
      return j;
    },
    cancel(s) {
      G.assert(
        this.enabled(s) && !s.race && s.research.project,
        "No hay proyecto que cancelar.",
      );
      const j = s.research.project;
      j.status = "cancelled";
      j.completedDay = s.day;
      this.archive(s, j);
    },
    archive(s, j) {
      s.research.history.unshift(G.clone(j));
      s.research.history = s.research.history
        .filter((j) => j.status === "completed")
        .concat(
          s.research.history
            .filter((j) => j.status !== "completed")
            .slice(0, 25),
        )
        .sort((a, b) => b.completedDay - a.completedDay);
      s.research.project = null;
    },
    daily(s) {
      if (!this.enabled(s) || s.research.lastDaily === s.day) return;
      s.research.lastDaily = s.day;
      const j = s.research.project;
      if (j?.status === "active" && j.lastDay < s.day) {
        j.lastDay = s.day;
        const e = this.owned(s).find((e) => e.id === j.scientistId),
          p = e && P.profile(s, e.id),
          node = this.nodes.find((n) => n.id === j.nodeId);
        if (
          !e ||
          e.contract.arrears ||
          P.resting(s, e.id) ||
          p.level < node.level
        ) {
          j.status = "paused";
          j.blockedReason =
            "Investigador ausente, contrato vencido, nómina pendiente o descanso. Reasigna y reanuda; no vuelves a pagar materiales.";
          G.news(
            s,
            "Compañía",
            "Investigación pausada.",
            j.blockedReason,
            "research",
            j.id,
          );
        } else {
          j.work = Math.min(node.days, j.work + node.days / j.duration);
          if (j.work + 1e-8 >= node.days) {
            j.work = node.days;
            j.status = "completed";
            j.completedDay = s.day;
            s.research.completed[node.id] = {
              day: s.day,
              projectId: j.id,
              cost: j.cost,
            };
            e.contributions.reports++;
            P.gain(s, e.id, node.days * 3);
            G.news(
              s,
              "Talentos",
              `Mejora investigada: ${node.name}.`,
              node.description +
                " El protocolo queda disponible de forma permanente para tu equipo.",
              "research",
              j.id,
            );
            this.archive(s, j);
          }
        }
      }
      if (s.day - s.research.lastRecruit >= 60) {
        s.research.lastRecruit = s.day;
        if (
          s.employees.filter(
            (e) => e.role === "researcher" && e.status === "available",
          ).length < 3
        )
          this.recruit(
            s,
            G.integer(s.research, 1, Math.min(8, G.player(s).level + 2)),
          );
      }
    },
    validate(s) {
      if (
        s.research === undefined ||
        (Array.isArray(s.research) && s.research.length === 0)
      )
        return;
      const x = s.research,
        num = (v, a, b) => Number.isFinite(v) && v >= a && v <= b,
        int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
      G.assert(
        this.enabled(s) &&
          s.competitions &&
          int(x.sequence, 0, 1e7) &&
          int(x.rng, 0, 4294967295) &&
          int(x.lastDaily, 0, s.day) &&
          int(x.lastRecruit, 0, s.day) &&
          typeof x.expandedCalendar === "boolean" &&
          x.completed &&
          Array.isArray(x.history) &&
          x.history.length <= 40,
        "Formato de investigación inválido.",
      );
      if (s.season.contentVersion === 1)
        G.assert(
          s.season.events.every((e) =>
            G.Data.tracks[e.track].cups?.includes(e.cup),
          ),
          "Circuito fuera de su categoría exclusiva.",
        );
      const ids = new Set();
      for (const j of [x.project, ...x.history].filter(Boolean)) {
        const n = this.nodes.find((n) => n.id === j.nodeId);
        G.assert(
          n &&
            /^research-\d+$/.test(j.id) &&
            !ids.has(j.id) &&
            Number(j.id.split("-")[1]) <= x.sequence &&
            s.employees.some(
              (e) => e.id === j.scientistId && e.role === "researcher",
            ) &&
            int(j.start, 0, s.day) &&
            int(j.lastDay, j.start, s.day) &&
            num(j.work, 0, n.days) &&
            int(j.duration, 2, 100) &&
            int(j.level, n.level, 10) &&
            int(j.cost, 1, n.cost) &&
            ["active", "paused", "completed", "cancelled"].includes(j.status) &&
            typeof j.blockedReason === "string" &&
            Array.isArray(j.segments) &&
            j.segments.length > 0 &&
            j.segments.every(
              (v) =>
                s.employees.some(
                  (e) => e.id === v.scientistId && e.role === "researcher",
                ) &&
                int(v.day, j.start, s.day) &&
                int(v.level, n.level, 10) &&
                int(v.duration, 2, 100),
            ),
          "Proyecto de investigación inválido.",
        );
        ids.add(j.id);
        if (j.status === "active" || j.status === "paused")
          G.assert(
            j === x.project && j.completedDay === null,
            "Proyecto activo archivado.",
          );
        else
          G.assert(
            int(j.completedDay, j.start, s.day) && j !== x.project,
            "Fecha de proyecto inválida.",
          );
      }
      for (const [id, v] of Object.entries(x.completed)) {
        const n = this.nodes.find((n) => n.id === id);
        G.assert(
          n &&
            n.requires.every((id) => x.completed[id]) &&
            int(v.day, 0, s.day) &&
            x.history.some(
              (j) =>
                j.id === v.projectId &&
                j.nodeId === id &&
                j.status === "completed" &&
                j.cost === v.cost,
            ),
          "Mejora investigada sin proyecto válido.",
        );
      }
      if (s.race)
        for (const a of s.race.entrants) {
          if (a.researchWear !== undefined)
            G.assert(
              num(a.researchWear, 0, 0.03),
              "Protocolo de desgaste inválido.",
            );
          for (const role of ["mechanic", "engineer", "strategist"]) {
            const member = a.professional?.[role];
            if (member?.researchPit !== undefined)
              G.assert(
                num(member.researchPit, 0, 0.03),
                "Protocolo de boxes inválido.",
              );
          }
        }
    },
  });
  const ask = G.Challenge.staffAsk;
  G.Challenge.staffAsk = function (s, e) {
    return e.role === "researcher"
      ? Math.min(
          4500,
          Math.round(
            (140 + P.profile(s, e.id).level ** 2 * 28) *
              (1 + e.skill / 300) *
              (0.8 + e.motivation / 400),
          ),
        )
      : ask.call(this, s, e);
  };
  const busy = S.busy;
  S.busy = function (s, id) {
    return (
      busy.call(this, s, id) ||
      !!(
        R.enabled(s) &&
        s.research.project?.status === "active" &&
        s.research.project.scientistId === id
      )
    );
  };
  const training = S.training;
  S.training = function (s, id) {
    return training.call(this, s, id) * (1 + R.effect(s, "training", id));
  };
  const accuracy = P.accuracy;
  P.accuracy = function (s, e, ...args) {
    return Math.min(
      99,
      accuracy.call(this, s, e, ...args) +
        (["mechanic", "engineer"].includes(e.role)
          ? R.effect(s, "diagnostics", e.companyId)
          : 0),
    );
  };
  const member = G.PitCrew.member;
  G.PitCrew.member = function (s, cid, role) {
    const m = member.call(this, s, cid, role);
    if (m && R.effect(s, "pit", cid)) m.researchPit = R.effect(s, "pit", cid);
    return m;
  };
  const service = G.PitCrew.serviceFactor;
  G.PitCrew.serviceFactor = function (m, ...args) {
    return service.call(this, m, ...args) * (1 - (m?.researchPit || 0));
  };
  const snapshot = G.Workshop.raceSnapshot;
  G.Workshop.raceSnapshot = function (s, car) {
    const a = snapshot.call(this, s, car);
    return R.enabled(s)
      ? { ...a, researchWear: R.effect(s, "tireWear", car.companyId) }
      : a;
  };
  const wear = G.RaceWeekend.wearFactor;
  G.RaceWeekend.wearFactor = function (r, a) {
    return wear.call(this, r, a) * (1 - (a.researchWear || 0));
  };
  const create = G.createGame;
  G.createV70Game = create;
  G.createGame = (...args) => R.initialize(create(...args), { newGame: true });
})();
