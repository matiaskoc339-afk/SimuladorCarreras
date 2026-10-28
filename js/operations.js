"use strict";
(() => {
  const G = RCS,
    S = G.Staff,
    P = G.Professionals;
  S.roles.manager = {
    name: "Gerente de operaciones",
    base: 260,
    rate: 3,
    description:
      "Ejecuta tus políticas y presupuestos. Su nivel, habilidad y estrés limitan cuántas decisiones puede supervisar cada jornada.",
  };
  S.roles.doctor = {
    name: "Médico deportivo",
    base: 280,
    rate: 3.2,
    description:
      "Trata lesiones con un curso de dos días. Nivel, habilidad y estrés afectan al acierto y a los días de recuperación que puede ahorrar.",
  };
  const O = (G.Operations = {
    kinds: {
      maintenance: "Mantenimiento",
      training: "Formación",
      inventory: "Inventario",
      scouting: "Ojeo",
      purchases: "Compras",
      jobs: "Encargos",
    },
    defaults() {
      return {
        enabled: false,
        minimumCash: 1500,
        reserveMonths: 1,
        dailyLimit: 800,
        monthlyLimit: 2000,
        parts: [],
        policies: {
          maintenance: {
            enabled: false,
            budget: 1000,
            priority: 1,
            below: 65,
            maxCost: 2000,
            tiresBelow: 40,
          },
          training: {
            enabled: false,
            budget: 300,
            priority: 2,
            drivers: [],
            focus: "weakest",
            fatigue: 45,
            stress: 60,
            restDays: 3,
          },
          inventory: {
            enabled: false,
            budget: 400,
            priority: 3,
            replaceBelow: 40,
            maxLabor: 300,
          },
          scouting: {
            enabled: false,
            budget: 150,
            priority: 4,
            minRating: 40,
            maxAge: 27,
            interval: 14,
          },
          purchases: {
            enabled: false,
            budget: 600,
            priority: 5,
            target: 1,
            minCondition: 80,
            maxUnit: 800,
          },
          jobs: { enabled: false, budget: 0, priority: 6 },
        },
      };
    },
    initialize(s) {
      if (s.operations !== undefined) {
        G.assert(
          s.operations.version === 1,
          "Versión de operaciones incompatible.",
        );
        return s;
      }
      s.operations = {
        version: 1,
        sequence: 0,
        rng: (s.seed ^ 0x0630a11) >>> 0,
        lastDaily: -1,
        lastRecruit: s.day,
        lastScouting: -100,
        settings: this.defaults(),
        months: [],
        log: [],
        trained: {},
        injuries: {},
        care: [],
      };
      // Mercado adicional con RNG e IDs propios: no altera las carreras ni el personal anterior.
      for (const role of ["manager", "doctor"])
        for (let i = 0; i < 5; i++)
          s.employees.push(S.generate(s, role, s.operations, "specialist"));
      for (const d of s.drivers)
        if (P.care(s, d.id).injuryUntil > s.day)
          s.operations.injuries[d.id] = this.injury(s, d);
      return s;
    },
    uid(s, prefix = "operation") {
      return `${prefix}-${++s.operations.sequence}`;
    },
    month(s) {
      return G.dateAt(s.day).toISOString().slice(0, 7);
    },
    spending(s) {
      return (
        s.operations.months.find((m) => m.month === this.month(s)) || {
          month: this.month(s),
          total: 0,
          spent: Object.fromEntries(Object.keys(this.kinds).map((k) => [k, 0])),
        }
      );
    },
    member(s, role) {
      return S.owned(s).find(
        (e) =>
          e.role === role &&
          !P.resting(s, e.id) &&
          !S.busy(s, e.id) &&
          e.contract.end > s.day &&
          !e.contract.arrears,
      );
    },
    capacity(s, e) {
      if (!e) return 0;
      const p = P.profile(s, e.id);
      return Math.max(
        1,
        Math.floor(
          1 +
            p.level *
              0.4 *
              (1 - p.stress * 0.007) *
              (0.7 + e.motivation * 0.003) *
              (0.8 + S.strength(s, s.playerId, "manager") / 200),
        ),
      );
    },
    reserve(s) {
      const q = s.operations.settings;
      return (
        Math.round(
          (q.minimumCash +
            G.Companies.monthly(s, s.playerId) * q.reserveMonths) *
            100,
        ) / 100
      );
    },
    validateSettings(s, q) {
      const integer = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
      G.assert(
        q &&
          typeof q.enabled === "boolean" &&
          integer(q.minimumCash, 0, 1000000) &&
          integer(q.reserveMonths, 0, 6) &&
          integer(q.dailyLimit, 0, 100000) &&
          integer(q.monthlyLimit, 0, 1000000) &&
          Array.isArray(q.parts) &&
          q.parts.length <= G.Parts.catalogue.length &&
          new Set(q.parts).size === q.parts.length &&
          q.parts.every((id) => G.Parts.definition(id)) &&
          q.policies,
        "Políticas o presupuesto inválidos.",
      );
      for (const kind of Object.keys(this.kinds)) {
        const p = q.policies[kind];
        G.assert(
          p &&
            typeof p.enabled === "boolean" &&
            integer(p.budget, 0, 1000000) &&
            integer(p.priority, 1, 10),
          "Límite o prioridad de política inválidos.",
        );
      }
      const p = q.policies;
      G.assert(
        integer(p.maintenance.below, 30, 95) &&
          integer(p.maintenance.maxCost, 1, 10000) &&
          integer(p.maintenance.tiresBelow, 20, 90) &&
          integer(p.purchases.target, 1, 3) &&
          integer(p.purchases.minCondition, 25, 100) &&
          integer(p.purchases.maxUnit, 1, 10000) &&
          integer(p.inventory.replaceBelow, 25, 80) &&
          integer(p.inventory.maxLabor, 1, 5000),
        "Reglas de taller o inventario inválidas.",
      );
      G.assert(
        Array.isArray(p.training.drivers) &&
          new Set(p.training.drivers).size === p.training.drivers.length &&
          p.training.drivers.length <= 100 &&
          p.training.drivers.every((id) =>
            s.drivers.some((d) => d.id === id),
          ) &&
          ["weakest", "pace", "control"].includes(p.training.focus) &&
          integer(p.training.fatigue, 20, 80) &&
          integer(p.training.stress, 20, 80) &&
          integer(p.training.restDays, 1, 14),
        "Reglas de formación inválidas.",
      );
      G.assert(
        integer(p.scouting.minRating, 20, 90) &&
          integer(p.scouting.maxAge, 18, 45) &&
          integer(p.scouting.interval, 3, 60),
        "Reglas de ojeo inválidas.",
      );
    },
    configure(s, settings) {
      G.ensurePlayable(s);
      G.assert(
        !s.race && !G.Practice.active(s),
        "Termina la carrera o práctica antes de cambiar las políticas.",
      );
      this.validateSettings(s, settings);
      G.assert(
        settings.policies.training.drivers.every((id) =>
          s.drivers.some((d) => d.id === id && d.companyId === s.playerId),
        ),
        "Solo puedes delegar la formación de tus pilotos.",
      );
      s.operations.settings = G.clone(settings);
    },
    pause(s) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de cambiar las políticas.");
      s.operations.settings.enabled = false;
    },
    controlsTraining(s, d) {
      return (
        !!s.operations?.settings.policies.training.enabled &&
        s.operations.settings.policies.training.drivers.includes(d.id) &&
        d.companyId === s.playerId
      );
    },
    releaseTraining(s, id) {
      if (!s.operations) return;
      const p = s.operations.settings.policies.training;
      if (!p.drivers.includes(id)) return;
      p.drivers = p.drivers.filter((other) => other !== id);
      this.record(s, {
        kind: "training",
        status: "manual",
        targetId: id,
        label: "Orden manual de formación",
        reason:
          "El piloto sale del programa delegado. Tu orden tiene prioridad.",
        cost: 0,
        managerId: null,
      });
    },
    gate(s) {
      const x = s.operations;
      if (!x.settings.enabled) return "Delegación desactivada.";
      if (s.status !== "active") return "La compañía no está activa.";
      if (s.race || G.Practice.active(s))
        return "Termina la actividad en pista antes de ejecutar operaciones.";
      if (G.nextEvent(s)?.day <= s.day)
        return "Jornada de carrera: las operaciones esperan a que termine la prueba.";
      if (S.overdue(s) > 0)
        return "Hay nóminas vencidas: primero hay que liquidarlas.";
      if (!this.member(s, "manager"))
        return "Necesitas un gerente contratado, disponible, descansado y al corriente de pago.";
      return "";
    },
    budgetReason(s, kind, cost, dailySpent = 0) {
      if (!cost) return "";
      const q = s.operations.settings,
        m = this.spending(s);
      if (m.total + cost > q.monthlyLimit)
        return "Presupuesto mensual general agotado o insuficiente.";
      if (m.spent[kind] + cost > q.policies[kind].budget)
        return "Presupuesto mensual de esta área insuficiente.";
      if (dailySpent + cost > q.dailyLimit)
        return "Supera el límite diario de gasto delegado.";
      if (G.player(s).balance - cost + 0.001 < this.reserve(s))
        return "La operación invadiría tu reserva de caja y gastos mensuales.";
      return "";
    },
    carReason(s, car, days, install = false) {
      try {
        G.Workshop.available(s, car);
        if (install)
          G.assert(
            !G.Market.locked(s, car.id),
            "El coche está inscrito: no se modifica su preparación.",
          );
      } catch (error) {
        return error.message;
      }
      const event = G.nextEvent(s);
      if (event && s.day + days >= event.day)
        return "El trabajo no deja una jornada libre antes de la próxima carrera.";
      return "";
    },
    candidates(s) {
      const x = s.operations,
        q = x.settings,
        p = q.policies,
        list = [],
        cars = G.ownedCars(s)
          .slice()
          .sort(
            (a, b) => a.condition - b.condition || a.id.localeCompare(b.id),
          );
      const add = (kind, id, label, cost, days, reason = "", extra = {}) =>
        list.push({ kind, targetId: id, label, cost, days, reason, ...extra });
      if (p.maintenance.enabled)
        for (const c of cars) {
          const components = Object.keys(G.Parts.components)
            .filter((k) => k !== "tires")
            .sort((a, b) => c.components[a] - c.components[b]);
          if (c.tires < p.maintenance.tiresBelow)
            add(
              "maintenance",
              c.id,
              `Neumáticos de calle · ${c.model}`,
              G.Workshop.tireCost(s, c),
              0,
              this.carReason(s, c, 0),
              { task: "tires" },
            );
          if (c.components[components[0]] < p.maintenance.below) {
            const component = components[0],
              days = S.plan(
                s,
                s.playerId,
                "repair",
                ["engine", "transmission"].includes(component) ? 2 : 1,
              ).days;
            add(
              "maintenance",
              c.id,
              `Reparar ${G.Parts.components[component].toLowerCase()} · ${c.model}`,
              G.Workshop.repairQuote(c, component, s),
              days,
              this.carReason(s, c, days),
              { task: "repair", component },
            );
          }
        }
      if (p.training.enabled)
        for (const id of p.training.drivers) {
          const d = s.drivers.find(
            (d) => d.id === id && d.companyId === s.playerId,
          );
          if (!d) continue;
          const coach = this.member(s, "trainer"),
            care = P.care(s, d.id),
            event = G.nextEvent(s),
            focus =
              p.training.focus === "weakest"
                ? d.stats.pace < d.stats.control
                  ? "pace"
                  : "control"
                : p.training.focus;
          let reason = !P.fit(s, id)
            ? "El piloto está lesionado o retirado."
            : !coach
              ? "No hay un entrenador disponible."
              : d.fatigue >= p.training.fatigue ||
                  care.stress >= p.training.stress
                ? "Descanso por fatiga o estrés."
                : event && event.day - s.day <= p.training.restDays
                  ? "Descanso previo a la carrera."
                  : x.trained[id] === s.day ||
                      s.professional.practices.some(
                        (j) => j.driverId === id && j.completedDay === s.day,
                      )
                    ? "El piloto ya ha entrenado hoy."
                    : !d.contract || d.contract.end <= s.day
                      ? "Contrato del piloto no disponible."
                      : "";
          add(
            "training",
            id,
            `Formación de ${G.Drivers.labels[focus].toLowerCase()} · ${d.name}`,
            18,
            0,
            reason,
            { focus, coachId: coach?.id || null },
          );
        }
      if (p.inventory.enabled)
        for (const c of cars)
          for (const defId of q.parts) {
            const def = G.Parts.definition(defId),
              old = s.parts.find((unit) => unit.id === c.installed[def.slot]);
            if (old && old.condition >= p.inventory.replaceBelow) continue;
            const part = G.Workshop.inventory(s)
              .filter(
                (unit) =>
                  unit.definitionId === defId &&
                  !unit.reservedFor &&
                  unit.condition >= p.purchases.minCondition &&
                  (!old || unit.condition > old.condition),
              )
              .sort(
                (a, b) => b.condition - a.condition || a.id.localeCompare(b.id),
              )[0];
            if (!part) continue;
            const days = S.plan(s, s.playerId, "install", def.days).days,
              reason =
                this.carReason(s, c, days, true) ||
                G.Workshop.fit(s, c, part) ||
                (def.labor > p.inventory.maxLabor
                  ? "Supera el máximo de mano de obra autorizado."
                  : "");
            add(
              "inventory",
              c.id,
              `Instalar ${def.name} · ${c.model}`,
              def.labor,
              days,
              reason,
              { partId: part.id },
            );
          }
      if (p.scouting.enabled) {
        const scout = this.member(s, "scout"),
          busy = s.staffing.assignments.some(
            (j) => j.employeeId === scout?.id && j.status === "active",
          );
        const d = s.drivers
          .filter(
            (d) =>
              !d.companyId &&
              P.available(s, d) &&
              d.age <= p.scouting.maxAge &&
              G.Drivers.rating(d) >= p.scouting.minRating &&
              !s.staffing.assignments.some(
                (j) =>
                  j.companyId === s.playerId &&
                  j.driverId === d.id &&
                  j.status !== "cancelled",
              ) &&
              !s.professional.cvs.some(
                (cv) => cv.companyId === s.playerId && cv.driverId === d.id,
              ),
          )
          .sort(
            (a, b) =>
              G.Drivers.rating(b) - G.Drivers.rating(a) ||
              a.id.localeCompare(b.id),
          )[0];
        let reason = !scout
          ? "No hay un ojeador disponible."
          : busy
            ? "El ojeador ya prepara un informe."
            : s.day - x.lastScouting < p.scouting.interval
              ? "Todavía no toca el siguiente encargo de ojeo."
              : !d
                ? "No hay candidatos nuevos dentro de tus filtros."
                : "";
        if (!reason)
          try {
            S.scoutQuote(s, scout.id, d.id);
          } catch (error) {
            reason = error.message;
          }
        add(
          "scouting",
          d?.id || null,
          d ? `Informe de potencial · ${d.name}` : "Buscar candidato para ojeo",
          75,
          scout
            ? Math.max(
                3,
                7 - Math.floor(S.strength(s, s.playerId, "scout") / 20),
              )
            : 7,
          reason,
          { scoutId: scout?.id || null },
        );
      }
      if (p.purchases.enabled)
        for (const defId of q.parts) {
          const def = G.Parts.definition(defId),
            count = G.Workshop.inventory(s).filter(
              (part) =>
                part.definitionId === defId &&
                part.condition >= p.purchases.minCondition,
            ).length;
          if (count >= p.purchases.target) continue;
          const part = G.Workshop.stock(s, defId).find(
              (part) => part.condition >= p.purchases.minCondition,
            ),
            cost = part
              ? Math.round((def.price * part.condition) / 100)
              : def.price;
          const reason = !cars.some(
            (c) =>
              !G.Market.listed(s, c.id) &&
              (!def.models || def.models.includes(c.modelIndex)),
          )
            ? "No tienes un vehículo compatible para este repuesto."
            : !part
              ? "El proveedor no tiene una unidad con la condición exigida."
              : G.Workshop.occupied(s) >= G.player(s).sparesCapacity
                ? "Almacén lleno."
                : cost > p.purchases.maxUnit
                  ? "Supera el precio máximo por unidad."
                  : "";
          add(
            "purchases",
            defId,
            `Reponer ${def.name} (${count}/${p.purchases.target})`,
            cost,
            0,
            reason,
            { partId: part?.id || null },
          );
        }
      if (p.jobs.enabled) {
        const days = S.plan(s, s.playerId, "repair", 3).days,
          reason = s.job
            ? "Ya hay un encargo en curso."
            : s.day - s.lastJob < 7
              ? "El siguiente encargo aún no está disponible."
              : G.Facilities.workload(s) >= G.Facilities.bays(s)
                ? "No hay una bahía libre."
                : G.nextEvent(s) && s.day + days >= G.nextEvent(s).day
                  ? "El encargo ocuparía el taller hasta la próxima carrera."
                  : "";
        add(
          "jobs",
          s.playerId,
          "Aceptar encargo de taller · $360 netos al entregar",
          0,
          days,
          reason,
        );
      }
      for (const item of list)
        if (
          item.kind === "maintenance" &&
          item.cost > p.maintenance.maxCost &&
          !item.reason
        )
          item.reason =
            "Supera el coste máximo por intervención de mantenimiento.";
      return list.sort(
        (a, b) =>
          p[a.kind].priority - p[b.kind].priority ||
          Object.keys(this.kinds).indexOf(a.kind) -
            Object.keys(this.kinds).indexOf(b.kind) ||
          String(a.targetId).localeCompare(String(b.targetId)),
      );
    },
    plan(s) {
      const gate = this.gate(s),
        manager = this.member(s, "manager");
      return {
        gate,
        manager,
        capacity: this.capacity(s, manager),
        reserve: this.reserve(s),
        spending: this.spending(s),
        items: this.candidates(s).map((c) => ({
          ...c,
          reason: gate || c.reason || this.budgetReason(s, c.kind, c.cost),
        })),
      };
    },
    record(s, row) {
      const x = s.operations;
      const entry = {
        id: this.uid(s),
        day: s.day,
        status: "done",
        reason: "",
        managerId: null,
        targetId: null,
        workId: null,
        ...row,
      };
      x.log.push(entry);
      x.log = x.log.slice(-160);
      return entry;
    },
    execute(s, c) {
      switch (c.kind) {
        case "maintenance":
          return c.task === "tires"
            ? G.Economy.tires(s, c.targetId)
            : G.Workshop.repair(s, c.targetId, c.component);
        case "purchases":
          return G.Workshop.buy(s, c.partId);
        case "inventory":
          return G.Workshop.install(s, c.targetId, c.partId);
        case "scouting": {
          const j = S.scout(s, c.scoutId, c.targetId);
          s.operations.lastScouting = s.day;
          return j;
        }
        case "jobs":
          return G.Economy.job(s);
        case "training": {
          const d = s.drivers.find((d) => d.id === c.targetId),
            coach = s.employees.find((e) => e.id === c.coachId),
            before = d.stats[c.focus];
          G.Economy.spend(
            s,
            18,
            "Formación",
            `Entrenamiento delegado · ${d.name}`,
          );
          d.stats[c.focus] = Math.max(
            before,
            Math.min(
              d.potential,
              before +
                0.015 * (d.age < 25 ? 1 : 0.5) * S.training(s, s.playerId),
            ),
          );
          d.fatigue = G.clamp(d.fatigue + 10, 0, 100);
          P.care(s, d.id).stress = G.clamp(
            P.care(s, d.id).stress +
              12 * (1 - P.profile(s, coach.id).level * 0.04),
            0,
            100,
          );
          coach.contributions.sessions++;
          P.profile(s, coach.id).stress = Math.min(
            100,
            P.profile(s, coach.id).stress + 2,
          );
          s.operations.trained[d.id] = s.day;
          return null;
        }
      }
    },
    run(s) {
      G.ensurePlayable(s);
      const x = s.operations;
      G.assert(
        !s.race && !G.Practice.active(s),
        "Termina la actividad en pista.",
      );
      G.assert(x.lastDaily !== s.day, "Las operaciones ya se evaluaron hoy.");
      const initial = this.plan(s);
      G.assert(!initial.gate, initial.gate);
      x.lastDaily = s.day;
      const manager = initial.manager,
        capacity = initial.capacity,
        done = new Set();
      let spent = 0,
        count = 0;
      while (count < capacity) {
        const list = this.candidates(s),
          c = list.find(
            (c) =>
              !done.has(`${c.kind}:${c.targetId}`) &&
              !c.reason &&
              !this.budgetReason(s, c.kind, c.cost, spent),
          );
        if (!c) break;
        const before = G.player(s).balance,
          job = this.execute(s, c),
          cost = Math.round((before - G.player(s).balance) * 100) / 100;
        G.assert(
          cost === c.cost,
          "El coste ejecutado no coincide con la orden.",
        );
        let m = x.months.find((m) => m.month === this.month(s));
        if (!m) {
          m = this.spending(s);
          x.months.push(m);
        }
        m.total += cost;
        m.spent[c.kind] += cost;
        x.months = x.months.slice(-24);
        this.record(s, {
          kind: c.kind,
          targetId: c.targetId,
          label: c.label,
          cost,
          managerId: manager.id,
          workId: job?.id || null,
          reason: c.days
            ? `Trabajo contratado: ${c.days} día${c.days === 1 ? "" : "s"}.`
            : "Operación completada.",
        });
        done.add(`${c.kind}:${c.targetId}`);
        spent += cost;
        count++;
        manager.contributions.jobs++;
        P.profile(s, manager.id).stress = Math.min(
          100,
          P.profile(s, manager.id).stress + 4,
        );
      }
      const remaining = this.candidates(s).filter(
        (c) => !done.has(`${c.kind}:${c.targetId}`),
      );
      for (const kind of Object.keys(this.kinds)) {
        const group = remaining.filter((c) => c.kind === kind);
        if (!group.length) continue;
        const c = group.find((c) => !c.reason) || group[0],
          reason =
            c.reason ||
            this.budgetReason(s, c.kind, c.cost, spent) ||
            (count >= capacity
              ? "El gerente alcanzó su capacidad diaria."
              : "Sin tarea ejecutable.");
        this.record(s, {
          kind,
          status: "blocked",
          targetId: c.targetId,
          label: c.label,
          cost: 0,
          managerId: manager.id,
          reason,
        });
      }
      if (!count && !remaining.length)
        this.record(s, {
          kind: "system",
          status: "idle",
          label: "Sin tareas pendientes",
          cost: 0,
          managerId: manager.id,
          reason: "Los activos ya cumplen tus políticas.",
        });
      if (count)
        G.news(
          s,
          "Compañía",
          `${manager.name}: ${count} operación${count === 1 ? "" : "es"} delegada${count === 1 ? "" : "s"}.`,
          `Gasto de la jornada: $${spent}. Las decisiones y los bloqueos quedan registrados en Operaciones.`,
          "operations",
        );
      return { count, spent };
    },
    daily(s) {
      const x = s.operations;
      if (!x) return;
      if (s.day - x.lastRecruit >= 60) {
        x.lastRecruit = s.day;
        for (const role of ["manager", "doctor"])
          if (
            s.employees.filter(
              (e) => e.role === role && e.status === "available",
            ).length < 2 &&
            s.employees.length < 1980
          )
            s.employees.push(S.generate(s, role, x, "specialist"));
      }
      for (const [id, day] of Object.entries(x.trained))
        if (s.day - day > 14) delete x.trained[id];
      if (!x.settings.enabled || x.lastDaily === s.day) return;
      const reason = this.gate(s);
      if (reason) {
        x.lastDaily = s.day;
        this.record(s, {
          kind: "system",
          status: "blocked",
          label: "Delegación en espera",
          reason,
          cost: 0,
        });
        return;
      }
      this.run(s);
    },
    patientBusy(s, id) {
      return !!s.operations?.care.some(
        (c) => c.driverId === id && c.status === "active",
      );
    },
    injury(s, d) {
      const care = P.care(s, d.id),
        known = s.operations.injuries[d.id];
      return known && known.currentUntil === care.injuryUntil
        ? known
        : {
            key: `${d.id}:${care.injuryUntil}:legacy`,
            since: s.day,
            initialUntil: care.injuryUntil,
            currentUntil: care.injuryUntil,
          };
    },
    medicalQuote(s, id) {
      G.ensurePlayable(s);
      const d = s.drivers.find(
          (d) => d.id === id && d.companyId === s.playerId,
        ),
        doctor = this.member(s, "doctor"),
        care = d && P.care(s, id);
      G.assert(
        !s.race && !G.Practice.active(s) && d && care && !care.retired,
        "Atención médica no disponible.",
      );
      G.assert(
        doctor,
        "Necesitas un médico contratado, disponible y descansado.",
      );
      const remaining = care.injuryUntil - s.day;
      G.assert(
        remaining >= 4,
        "El tratamiento requiere al menos cuatro días pendientes de recuperación.",
      );
      G.assert(
        doctor.contract.end > s.day + 2 && P.canAssign(s, doctor, 2),
        "El médico no puede cubrir los dos días de tratamiento.",
      );
      G.assert(
        d.contract && d.contract.end > s.day + 2,
        "El contrato del piloto debe cubrir el tratamiento.",
      );
      const injury = this.injury(s, d);
      G.assert(
        !s.operations.care.some(
          (c) => c.driverId === id && c.injuryKey === injury.key,
        ),
        "Esta lesión ya ha tenido un tratamiento; conserva la recuperación indicada.",
      );
      const profile = P.profile(s, doctor.id),
        accuracy = Math.round(
          G.clamp(
            0.3 +
              profile.level * 0.06 +
              doctor.skill * 0.001 -
              profile.stress * 0.003,
            0.05,
            0.98,
          ) * 100,
        ),
        saving = Math.min(
          Math.floor(remaining * 0.4),
          1 + Math.floor((profile.level - 1) / 3),
        );
      G.assert(
        G.player(s).balance >= 120,
        "No hay fondos para los $120 del tratamiento.",
      );
      return {
        d,
        doctor,
        injury,
        remaining,
        accuracy,
        saving,
        cost: 120,
        days: 2,
      };
    },
    treat(s, id) {
      const q = this.medicalQuote(s, id),
        x = s.operations;
      G.Economy.spend(s, q.cost, "Salud", "Tratamiento médico · " + q.d.name);
      const c = {
        id: this.uid(s, "treatment"),
        companyId: s.playerId,
        driverId: id,
        doctorId: q.doctor.id,
        injuryKey: q.injury.key,
        start: s.day,
        end: s.day + 2,
        originalUntil: P.care(s, id).injuryUntil,
        accuracy: q.accuracy,
        potentialSaving: q.saving,
        roll: G.random(x),
        cost: q.cost,
        status: "active",
        saved: 0,
      };
      x.injuries[id] = G.clone(q.injury);
      x.care.push(c);
      P.profile(s, q.doctor.id).stress = Math.min(
        100,
        P.profile(s, q.doctor.id).stress + 3,
      );
      return c;
    },
    medicalDaily(s) {
      const x = s.operations;
      if (!x) return;
      for (const c of x.care.filter(
        (c) => c.status === "active" && c.end <= s.day,
      )) {
        const d = s.drivers.find((d) => d.id === c.driverId),
          e = s.employees.find((e) => e.id === c.doctorId),
          care = P.care(s, c.driverId);
        if (
          !d ||
          d.companyId !== c.companyId ||
          !e?.contract ||
          e.companyId !== c.companyId ||
          care.retired
        ) {
          c.status = "cancelled";
          continue;
        }
        const before = care.injuryUntil;
        if (c.roll * 100 < c.accuracy)
          care.injuryUntil = Math.min(
            before,
            Math.max(s.day + 1, c.originalUntil - c.potentialSaving),
          );
        c.saved = before - care.injuryUntil;
        c.status = "complete";
        x.injuries[d.id].currentUntil = care.injuryUntil;
        e.contributions.jobs++;
        P.profile(s, e.id).stress = Math.min(
          100,
          P.profile(s, e.id).stress + 3,
        );
        G.news(
          s,
          "Talentos",
          `${d.name}: tratamiento finalizado.`,
          c.saved
            ? `Se reducen ${c.saved} días de recuperación. Fecha prevista: ${G.dateAt(care.injuryUntil).toISOString().slice(0, 10)}. Sigue lesionado hasta entonces.`
            : "El tratamiento no ha adelantado la recuperación. Mantiene el descanso médico indicado.",
          "operations",
        );
      }
      x.care = [
        ...x.care.filter((c) => c.status !== "active").slice(-60),
        ...x.care.filter((c) => c.status === "active"),
      ];
    },
    validate(s) {
      const x = s.operations;
      if (x === undefined) return;
      const day = (n) => Number.isInteger(n) && n >= 0 && n <= s.day,
        money = (n) => Number.isFinite(n) && n >= 0,
        id = (n) => s.employees.some((e) => e.id === n);
      G.assert(
        x &&
          x.version === 1 &&
          Number.isInteger(x.sequence) &&
          x.sequence >= 0 &&
          Number.isInteger(x.rng) &&
          x.rng >= 0 &&
          x.rng <= 4294967295 &&
          Number.isInteger(x.lastDaily) &&
          x.lastDaily >= -1 &&
          x.lastDaily <= s.day &&
          day(x.lastRecruit) &&
          Number.isInteger(x.lastScouting) &&
          x.lastScouting >= -100 &&
          x.lastScouting <= s.day &&
          Array.isArray(x.months) &&
          x.months.length <= 24 &&
          Array.isArray(x.log) &&
          x.log.length <= 160 &&
          x.trained &&
          x.injuries &&
          Array.isArray(x.care),
        "Estado de operaciones inválido.",
      );
      this.validateSettings(s, x.settings);
      G.assert(
        new Set(x.months.map((m) => m.month)).size === x.months.length,
        "Presupuestos mensuales duplicados.",
      );
      for (const m of x.months)
        G.assert(
          /^\d{4}-(0[1-9]|1[0-2])$/.test(m.month) &&
            m.month <= this.month(s) &&
            money(m.total) &&
            m.spent &&
            Object.keys(this.kinds).every((k) => money(m.spent[k])) &&
            Math.abs(
              Object.values(m.spent).reduce((a, b) => a + b, 0) - m.total,
            ) < 0.01,
          "Contabilidad de delegación inválida.",
        );
      for (const r of x.log)
        G.assert(
          /^operation-[0-9]+$/.test(r.id) &&
            Number(r.id.split("-")[1]) <= x.sequence &&
            day(r.day) &&
            ["done", "blocked", "idle", "manual"].includes(r.status) &&
            [...Object.keys(this.kinds), "system"].includes(r.kind) &&
            money(r.cost) &&
            typeof r.label === "string" &&
            r.label.length < 300 &&
            typeof r.reason === "string" &&
            r.reason.length < 500 &&
            (r.managerId === null || id(r.managerId)) &&
            (r.targetId === null || typeof r.targetId === "string") &&
            (r.workId === null || typeof r.workId === "string"),
          "Registro de operaciones inválido.",
        );
      for (const [did, date] of Object.entries(x.trained))
        G.assert(
          s.drivers.some((d) => d.id === did) && day(date),
          "Formación delegada huérfana.",
        );
      for (const [did, injury] of Object.entries(x.injuries))
        G.assert(
          s.drivers.some((d) => d.id === did) &&
            typeof injury.key === "string" &&
            day(injury.since) &&
            Number.isInteger(injury.initialUntil) &&
            injury.initialUntil >= 0 &&
            Number.isInteger(injury.currentUntil) &&
            injury.currentUntil >= 0,
          "Episodio médico inválido.",
        );
      G.assert(
        new Set(x.care.map((c) => c.injuryKey)).size === x.care.length,
        "Tratamientos repetidos para una misma lesión.",
      );
      const doctors = new Set();
      for (const c of x.care) {
        G.assert(
          /^treatment-[0-9]+$/.test(c.id) &&
            Number(c.id.split("-")[1]) <= x.sequence &&
            (c.status !== "complete" || c.end <= s.day) &&
            s.drivers.some((d) => d.id === c.driverId) &&
            s.employees.some(
              (e) => e.id === c.doctorId && e.role === "doctor",
            ) &&
            c.companyId === s.playerId &&
            typeof c.injuryKey === "string" &&
            day(c.start) &&
            c.end === c.start + 2 &&
            Number.isInteger(c.originalUntil) &&
            c.originalUntil >= c.start + 4 &&
            Number.isInteger(c.accuracy) &&
            c.accuracy >= 5 &&
            c.accuracy <= 98 &&
            Number.isInteger(c.potentialSaving) &&
            c.potentialSaving >= 1 &&
            c.potentialSaving <= 4 &&
            Number.isFinite(c.roll) &&
            c.roll >= 0 &&
            c.roll < 1 &&
            c.cost === 120 &&
            ["active", "complete", "cancelled"].includes(c.status) &&
            Number.isInteger(c.saved) &&
            c.saved >= 0 &&
            c.saved <= c.potentialSaving,
          "Tratamiento médico inválido.",
        );
        if (c.status === "active") {
          G.assert(
            !doctors.has(c.doctorId) &&
              s.employees.some(
                (e) => e.id === c.doctorId && e.companyId === c.companyId,
              ) &&
              s.drivers.some(
                (d) => d.id === c.driverId && d.companyId === c.companyId,
              ) &&
              x.injuries[c.driverId]?.key === c.injuryKey,
            "Tratamiento activo huérfano o médico duplicado.",
          );
          doctors.add(c.doctorId);
        }
      }
    },
  });
  const busy = S.busy;
  S.busy = function (s, id) {
    return (
      busy.call(this, s, id) ||
      !!s.operations?.care.some(
        (c) => c.status === "active" && c.doctorId === id,
      )
    );
  };
  const depart = S.depart;
  S.depart = function (s, e, ...args) {
    const result = depart.call(this, s, e, ...args);
    if (s.operations)
      for (const c of s.operations.care)
        if (c.doctorId === e.id && c.status === "active")
          c.status = "cancelled";
    return result;
  };
  const finish = G.Practice.finish;
  G.Practice.finish = function (s, ...args) {
    const j = finish.call(this, s, ...args);
    if (s.operations && j.incident === "injury") {
      const until = P.care(s, j.driverId).injuryUntil;
      s.operations.injuries[j.driverId] = {
        key: `${j.driverId}:${until}:${j.id}`,
        since: s.day,
        initialUntil: until,
        currentUntil: until,
      };
    }
    return j;
  };
})();
