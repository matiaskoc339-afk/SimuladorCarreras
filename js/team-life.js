"use strict";
(() => {
  const G = RCS;
  const L = (G.TeamLife = {
    enabled: (s) => s?.teamLife?.version === 1,
    trainingRate: (s, d, focus) =>
      G.DriverWorld?.enabled(s)
        ? G.DriverWorld.learningRate(s, d, focus)
        : L.enabled(s)
          ? 1.45
          : 1,
    initialize(s) {
      if (s.teamLife !== undefined) {
        G.assert(L.enabled(s), "Versión de gestión del equipo incompatible.");
        return s;
      }
      if (!L.enabled(s)) {
        G.assert(
          !s.race && !G.Auctions.active(s),
          "Termina la actividad en directo antes de actualizar la gestión del equipo.",
        );
        s.teamLife = { version: 1, lastAccepted: -7, job: null, history: [] };
      }
      return s;
    },
    offers(s, week = Math.floor(s.day / 7)) {
      const types = [
        {
          kind: "stock",
          name: "Preparación de material",
          days: 2,
          base: 110,
          bay: false,
          role: null,
          text: "Clasifica y prepara consumibles para un club local. No reserva coche ni piloto.",
        },
        {
          kind: "visit",
          name: "Jornada de taller abierto",
          days: 3,
          base: 170,
          bay: true,
          role: null,
          text: "Recibe a una asociación del motor. Ocupa una bahía durante las jornadas contratadas.",
        },
        {
          kind: "telemetry",
          name: "Informe de telemetría",
          days: 3,
          base: 230,
          bay: false,
          role: "engineer",
          text: "Un ingeniero analiza datos de un equipo aficionado. Queda ocupado hasta la entrega.",
        },
      ];
      const clients = [
        "Club del Puerto",
        "Asociación de Clásicos",
        "Karting del Valle",
        "Escuela de Mecánica",
        "Liga de Aficionados",
        "Peña del Motor",
        "Club de Montaña",
        "Talleres del Barrio",
      ];
      return types.map((t, i) => {
        const hash = G.AuctionContent.hash(`${s.seed}/support/${week}/${i}`);
        return {
          ...t,
          id: `support-${week}-${i}`,
          week,
          client: clients[hash % clients.length],
          pay: t.base + (hash % 41),
        };
      });
    },
    quote(s, id) {
      const offer = L.offers(s).find((o) => o.id === id);
      G.assert(
        offer,
        "La oferta ha caducado. Consulta los encargos de esta semana en Finanzas.",
      );
      let reason =
        s.status !== "active"
          ? "La compañía está en bancarrota; conserva su archivo o empieza otra partida."
          : s.race || G.Auctions.active(s)
            ? "Termina la carrera o la subasta en directo antes de aceptar un encargo."
            : s.teamLife?.job
              ? `Ya hay un encargo de apoyo en curso hasta el ${G.Feedback.date(s.teamLife.job.end)}. Termínalo o cancélalo antes de aceptar otro.`
              : s.day - (s.teamLife?.lastAccepted ?? -7) < 7
                ? `Puedes aceptar otro encargo de apoyo el ${G.Feedback.date(s.teamLife.lastAccepted + 7)}. Solo se admite uno cada siete días, aunque canceles.`
                : "";
      const employee =
        offer.role && G.Staff.owned(s).find((e) => e.role === offer.role);
      if (
        !reason &&
        offer.bay &&
        G.Facilities.workload(s) >= G.Facilities.bays(s)
      )
        reason =
          "No hay una bahía libre. Espera a que termine un trabajo o amplía el taller desde Instalaciones.";
      if (!reason && offer.role)
        reason = !employee
          ? "Necesitas un ingeniero contratado. Puedes buscarlo en Personal."
          : G.Feedback.employee(s, employee).join(" ") ||
            (employee.contract.end <= s.day + offer.days
              ? `Renueva a ${employee.name}: su contrato debe cubrir hasta el ${G.Feedback.date(s.day + offer.days)}.`
              : "");
      return {
        ...offer,
        end: s.day + offer.days,
        employeeId: employee?.id || null,
        reason,
      };
    },
    start(s, id) {
      const q = L.quote(s, id);
      G.assert(!q.reason, q.reason);
      L.initialize(s);
      const j = {
        id: q.id,
        kind: q.kind,
        week: q.week,
        start: s.day,
        end: q.end,
        pay: q.pay,
        bay: q.bay,
        employeeId: q.employeeId,
        status: "active",
        finished: null,
        reason: "",
      };
      s.teamLife.job = j;
      s.teamLife.lastAccepted = s.day;
      G.news(
        s,
        "Finanzas",
        `Encargo de apoyo: ${q.client}.`,
        `${q.name}. Entrega el ${G.Feedback.date(q.end)}: ${G.Feedback.money(q.pay)} al completar, consumibles descontados y salarios habituales aparte.`,
        "finance",
      );
      return j;
    },
    close(s, reason = "") {
      const x = s.teamLife,
        j = x?.job;
      G.assert(j, "No hay un encargo de apoyo en curso.");
      j.status = reason ? "cancelled" : "completed";
      j.finished = s.day;
      j.reason = reason;
      if (!reason) {
        G.Economy.transact(
          s,
          s.playerId,
          j.pay,
          "Ingresos de apoyo",
          L.offers(s, j.week).find((o) => o.id === j.id).name,
        );
        if (j.employeeId) {
          const e = s.employees.find((e) => e.id === j.employeeId);
          e.contributions.reports++;
          G.Professionals.gain(s, e.id, 8);
        }
      }
      x.job = null;
      x.history.unshift(j);
      x.history.length = Math.min(24, x.history.length);
      G.news(
        s,
        "Finanzas",
        reason
          ? "Encargo de apoyo interrumpido."
          : "Encargo de apoyo entregado.",
        reason ||
          `Has cobrado ${G.Feedback.money(j.pay)}. La disponibilidad para otro encargo se mantiene a siete días desde la aceptación.`,
        "finance",
      );
      return j;
    },
    daily(s) {
      if (!L.enabled(s) || !s.teamLife.job) return;
      const j = s.teamLife.job,
        e = j.employeeId && s.employees.find((e) => e.id === j.employeeId);
      if (s.status !== "active")
        return L.close(
          s,
          "La empresa cesó su actividad. El encargo no genera un cobro.",
        );
      if (
        j.employeeId &&
        (!e?.contract ||
          e.companyId !== s.playerId ||
          e.contract.arrears ||
          G.Professionals.resting(s, e.id))
      )
        return L.close(
          s,
          "El ingeniero dejó de estar disponible o tiene sueldo pendiente. No se cobra un informe sin terminar; revisa Personal antes de aceptar otro.",
        );
      if (s.day >= j.end) L.close(s);
    },
    validate(s) {
      if (s.teamLife === undefined) return;
      const x = s.teamLife;
      G.assert(
        x.version === 1 &&
          Array.isArray(x.history) &&
          x.history.length <= 24 &&
          Number.isInteger(x.lastAccepted) &&
          x.lastAccepted >= -7 &&
          x.lastAccepted <= s.day,
        "Gestión de encargos inválida.",
      );
      const jobs = [...(x.job ? [x.job] : []), ...x.history],
        ids = new Set();
      for (const j of jobs) {
        const o = L.offers(s, j.week).find((o) => o.id === j.id);
        G.assert(
          o &&
            !ids.has(j.id) &&
            Number.isInteger(j.start) &&
            j.start >= 0 &&
            j.start <= s.day &&
            j.week === Math.floor(j.start / 7) &&
            j.end === j.start + o.days &&
            j.kind === o.kind &&
            j.pay === o.pay &&
            j.bay === o.bay &&
            typeof j.reason === "string" &&
            j.reason.length < 700 &&
            (o.role
              ? s.employees.some(
                  (e) => e.id === j.employeeId && e.role === o.role,
                )
              : j.employeeId === null),
          "Encargo de apoyo inválido.",
        );
        G.assert(
          j === x.job
            ? j.status === "active" && j.finished === null && s.day < j.end
            : ["completed", "cancelled"].includes(j.status) &&
                Number.isInteger(j.finished) &&
                j.finished >= j.start &&
                j.finished <= s.day &&
                (j.status !== "completed" || j.finished >= j.end),
          "Entrega de encargo inválida.",
        );
        ids.add(j.id);
      }
      const ordered = jobs.slice().sort((a, b) => b.start - a.start);
      G.assert(
        ordered.length
          ? ordered[0].start === x.lastAccepted &&
              ordered.every((j, i) => !i || ordered[i - 1].start - j.start >= 7)
          : x.lastAccepted === -7,
        "Disponibilidad de encargos inválida.",
      );
    },
  });
  const busy = G.Staff.busy;
  G.Staff.busy = function (s, id) {
    return (
      busy.call(this, s, id) ||
      !!(L.enabled(s) && s.teamLife.job?.employeeId === id)
    );
  };
  const workload = G.Facilities.workload;
  G.Facilities.workload = function (s, id = s.playerId) {
    return (
      workload.call(this, s, id) +
      Number(id === s.playerId && L.enabled(s) && !!s.teamLife.job?.bay)
    );
  };
  const create = G.createGame;
  const maintenance = G.Competition.maintenance;
  G.Competition.maintenance = function (s, c) {
    if (!L.enabled(s)) return maintenance.call(this, s, c);
    if (c.privateer || c.id === s.playerId) return [];
    const driver = G.Companies.lineup(s, c.id).driver,
      next = s.season.events.find(
        (e) =>
          e.cup !== "street" &&
          e.status === "scheduled" &&
          !this.eligible(s, e, c.id) &&
          driver &&
          driver.contract.end > e.day &&
          G.Drivers.rating(driver) >= (e.cup === "national" ? 24 : 22),
      );
    if (
      !next ||
      next.day - s.day > 21 ||
      next.day <= s.day ||
      G.Facilities.workload(s, c.id) >= G.Facilities.bays(s, c.id)
    )
      return [];
    const car = G.ownedCars(s, c.id)
      .filter(
        (car) =>
          !car.repair &&
          !G.Market.listed(s, car.id) &&
          car.hp <= this.rule(next).maxHP,
      )
      .sort((a, b) => G.Companies.carRating(b) - G.Companies.carRating(a))[0];
    if (!car) return [];
    const national = next.cup === "national",
      brakes = car.components.brakes < (national ? 83 : 78),
      suspension = car.components.suspension < (national ? 78 : 73),
      tires = car.tires < (national ? 50 : 40),
      all =
        car.condition < (national ? 78 : 73) ||
        ["engine", "transmission", "cooling"].some(
          (k) => car.components[k] < 35,
        ) ||
        (brakes && suspension),
      component = all
        ? "all"
        : brakes
          ? "brakes"
          : suspension
            ? "suspension"
            : null,
      days = component
        ? G.Staff.plan(s, c.id, "repair", component === "all" ? 2 : 1).days
        : 0,
      cost =
        (component ? G.Workshop.repairQuote(car, component) : 0) +
        (tires ? G.Workshop.tireCost(s, car) : 0);
    if (
      !cost ||
      next.day - s.day < days ||
      c.balance - G.Auctions.reserved(s, c.id) <
        cost + this.fee(next) + (G.Companies.monthly(s, c.id) / 30) * 7
    )
      return [];
    return [
      {
        action: "verificación técnica",
        utility: 132,
        reason:
          "Preparar a tiempo la alineación para el reglamento de su próxima copa; se pagan neumáticos y reparaciones con la caja real.",
        targetId: car.id,
        cost,
        run: () => {
          if (tires) G.Economy.tires(s, car.id, c.id);
          if (component) G.Workshop.repair(s, car.id, component, c.id);
        },
      },
    ];
  };
  G.createV121Game = create;
  G.createGame = (...args) => L.initialize(create(...args));
})();
