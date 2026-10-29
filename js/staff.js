"use strict";
(() => {
  const G = RCS;
  const S = (G.Staff = {
    roles: {
      mechanic: {
        name: "Mecánico",
        base: 160,
        rate: 2,
        description:
          "Especialista de boxes y mantenimiento. Sus niveles, velocidad y estrés afectan al acierto; revisa coches y apoya reparaciones.",
      },
      engineer: {
        name: "Ingeniero de motores",
        base: 260,
        rate: 3,
        description:
          "Especialista en diagnóstico y ajustes. Apoya montajes, mejora las revisiones del mecánico y colabora en boxes.",
      },
      trainer: {
        name: "Entrenador",
        base: 180,
        rate: 2,
        description:
          "Dirige entrenamientos en pista y formación diaria. Su nivel y descanso mejoran el progreso y reducen estrés y riesgo de lesión.",
      },
      scout: {
        name: "Ojeador",
        base: 140,
        rate: 2,
        description:
          "Presenta CVs nuevos e informes de potencial con porcentaje de acierto. Su nivel afecta talento y precisión; un encargo individual cuesta $75.",
      },
      strategist: {
        name: "Estratega",
        base: 220,
        rate: 2.5,
        description:
          "Toma decisiones de ritmo y boxes automáticamente; reduce estrés del piloto. Puedes darle órdenes o tomar el control manual.",
      },
    },
    personalities: {
      calm: "Sereno",
      sociable: "Sociable",
      ambitious: "Ambicioso",
      independent: "Independiente",
    },
    initialize(s) {
      if (s.staffing !== undefined) {
        G.assert(s.staffing.version === 1, "Versión de personal incompatible.");
        return s;
      }
      G.assert(
        Array.isArray(s.employees) && s.employees.length === 0,
        "No se puede regenerar una plantilla existente.",
      );
      s.staffing = {
        version: 1,
        sequence: 0,
        rng: (s.seed ^ 0x5aaff061) >>> 0,
        lastDaily: s.day,
        lastRecruit: s.day,
        negotiations: {},
        assignments: [],
        bonds: [],
        debts: [],
      };
      // Secuencia y RNG propios: importar no altera la carrera ni los IDs anteriores.
      for (const role of Object.keys(this.roles).filter(
        (role) => !["manager", "doctor", "researcher"].includes(role),
      ))
        for (let i = 0; i < 5; i++) s.employees.push(this.generate(s, role));
      return s;
    },
    uid(s, prefix) {
      return `${prefix}-${++s.staffing.sequence}`;
    },
    birthday(s) {
      const date = G.dateAt(s.day),
        year = date.getUTCFullYear();
      return {
        year,
        day: Math.floor((date - Date.UTC(year, 0, 1, 12)) / 86400000),
      };
    },
    generate(s, role, source = s.staffing, prefix = "employee") {
      const x = source,
        skill = G.integer(x, 42, 80),
        age = G.integer(x, 24, 55),
        born = G.integer(x, 0, 364),
        now = this.birthday(s);
      return {
        id:
          prefix === "employee"
            ? this.uid(s, "employee")
            : `${prefix}-${++source.sequence}`,
        name: `${G.Data.firstNames[G.integer(x, 0, 15)]} ${G.Data.lastNames[G.integer(x, 0, 11)]}`,
        role,
        age,
        birthday: born,
        lastBirthdayYear: now.day >= born ? now.year : now.year - 1,
        experience: G.integer(x, 2, Math.max(2, age - 20)),
        skill,
        teamwork: G.integer(x, 40, 90),
        learning: G.integer(x, 40, 90),
        personality: Object.keys(this.personalities)[G.integer(x, 0, 3)],
        motivation: G.integer(x, 72, 88),
        loyalty: G.integer(x, 45, 65),
        ask:
          Math.round(
            (this.roles[role].base + skill * this.roles[role].rate) / 10,
          ) * 10,
        companyId: null,
        contract: null,
        status: "available",
        lastCompanyId: null,
        availableAfter: s.day,
        memory: [],
        contributions: { jobs: 0, sessions: 0, reports: 0 },
        poorDays: 0,
      };
    },
    owned(s, id = s.playerId) {
      return (s.employees || []).filter(
        (e) => e.companyId === id && e.status === "active",
      );
    },
    capacity(s, id = s.playerId) {
      return 2 + (G.Facilities.tier(s, id, "office") - 1) * 2;
    },
    monthly(s, id = s.playerId) {
      return this.owned(s, id).reduce(
        (n, e) => n + G.Pay.monthly(e.contract),
        0,
      );
    },
    overdue(s, id = s.playerId) {
      return (
        Math.round(
          (this.owned(s, id).reduce((n, e) => n + e.contract.arrears, 0) +
            (s.staffing?.debts || [])
              .filter((d) => d.companyId === id && !d.paid)
              .reduce((n, d) => n + d.amount, 0)) *
            100,
        ) / 100
      );
    },
    liability(s, id = s.playerId) {
      return (
        this.overdue(s, id) +
        this.owned(s, id).reduce((n, e) => n + e.contract.accrued, 0)
      );
    },
    remember(e, s, text) {
      e.memory.push({ day: s.day, text });
      e.memory = e.memory.slice(-24);
    },
    busy(s, id) {
      return (
        s.cars.some((c) => c.repair?.staffSupport?.employeeId === id) ||
        s.companies.some(
          (c) =>
            (c.id === s.playerId ? s.job : c.job)?.staffSupport?.employeeId ===
            id,
        )
      );
    },
    cohesion(s, id = s.playerId) {
      const employees = this.owned(s, id),
        ids = new Set(employees.map((e) => e.id));
      const bonds = (s.staffing?.bonds || []).filter(
        (b) => ids.has(b.a) && ids.has(b.b),
      );
      return G.clamp(
        70 +
          (bonds.length
            ? (bonds.reduce((n, b) => n + b.value, 0) / bonds.length) * 0.25
            : 0),
        45,
        95,
      );
    },
    strength(s, id, role, available = false) {
      const e = this.owned(s, id).find(
        (e) => e.role === role && (!available || !this.busy(s, e.id)),
      );
      return e
        ? e.skill *
            (0.65 + e.motivation * 0.0035) *
            (0.9 + e.loyalty * 0.001) *
            (0.85 + this.cohesion(s, id) * 0.0015) *
            (e.contract.arrears ? 0.75 : 1)
        : 0;
    },
    plan(s, id, type, days) {
      const base = G.Facilities.duration(s, id, days),
        role =
          type === "install" || type === "remove" ? "engineer" : "mechanic";
      const employee = this.owned(s, id).find(
        (e) =>
          e.role === role &&
          !this.busy(s, e.id) &&
          (!G.Professionals || G.Professionals.canAssign(s, e, base)) &&
          e.contract.end >= s.day + base,
      );
      const quality = employee ? this.strength(s, id, role) : 0;
      return {
        days: Math.max(1, base - (quality >= 40 && base >= 2 ? 1 : 0)),
        staffSupport: employee ? { employeeId: employee.id, quality } : null,
      };
    },
    credit(s, id, support) {
      const e = s.employees.find(
        (e) => e.id === support?.employeeId && e.companyId === id,
      );
      if (e) {
        e.contributions.jobs++;
        e.skill = Math.min(95, e.skill + e.learning * 0.0008);
      }
    },
    training(s, id) {
      return 1 + this.strength(s, id, "trainer") * 0.008;
    },
    minimum(s, e, terms, id) {
      const c = s.companies.find((c) => c.id === id);
      return Math.max(
        150,
        Math.round(
          (e.ask *
            (1 +
              (terms.months === 6 ? 0.06 : terms.months === 24 ? 0.03 : 0) +
              (e.lastCompanyId === id && e.loyalty < 40 ? 0.08 : 0) -
              Math.min(0.04, c.reputation / 1000)) -
            Math.min(e.ask * 0.15, (terms.bonus / terms.months) * 0.6)) /
            10,
        ) * 10,
      );
    },
    terms(s, eid, terms, id = s.playerId) {
      const e = s.employees.find((e) => e.id === eid),
        c = s.companies.find((c) => c.id === id);
      G.assert(
        c?.status === "active" && !s.race,
        "Termina la carrera o recupera una compañía activa para negociar.",
      );
      G.assert(
        e?.status === "available" &&
          !e.companyId &&
          (e.lastCompanyId !== id || e.availableAfter <= s.day),
        "Este profesional no está disponible para tu compañía.",
      );
      G.assert(
        this.owned(s, id).length < this.capacity(s, id),
        "La oficina no tiene plazas libres para más personal.",
      );
      G.assert(
        !this.owned(s, id).some((other) => other.role === e.role),
        "Ya hay un responsable de esta especialidad en la plantilla.",
      );
      if (G.Challenge.enabled(s))
        G.assert(
          c.level >= G.Challenge.staffLevel(s, e),
          `Esta especialidad exige una compañía de nivel ${G.Challenge.staffLevel(s, e)}.`,
        );
      const t = {
        salary: Number(terms.salary),
        months: Number(terms.months),
        bonus: Number(terms.bonus || 0),
      };
      G.assert(
        Number.isInteger(t.salary) &&
          t.salary >= G.Pay.minimum(e) &&
          t.salary <= 5000 &&
          G.Pay.durations(s).includes(t.months) &&
          Number.isInteger(t.bonus) &&
          t.bonus >= 0 &&
          t.bonus <= 2000,
        "Condiciones de personal inválidas.",
      );
      G.assert(
        c.balance >= t.bonus + Math.ceil(t.salary * (G.Pay.daily(e) ? 7 : 0.5)),
        G.Pay.daily(e)
          ? "Necesitas fondos para la prima y una reserva de siete días de sueldo."
          : "Necesitas fondos para la prima y una reserva de media nómina.",
      );
      return {
        employee: e,
        company: c,
        ...t,
        minimum: this.minimum(s, e, t, id),
      };
    },
    offer(s, eid, terms, id = s.playerId) {
      const q = this.terms(s, eid, terms, id),
        x = s.staffing,
        key = `${id}:${eid}`,
        previous = x.negotiations[key];
      G.assert(
        !previous || previous.cooldown <= s.day,
        "El representante pide esperar antes de volver a negociar.",
      );
      const e = q.employee;
      if (q.salary < q.minimum) {
        const attempts = (previous?.attempts || 0) + 1;
        x.negotiations[key] = {
          employeeId: eid,
          companyId: id,
          salary: q.minimum,
          months: q.months,
          bonus: q.bonus,
          attempts,
          cooldown: s.day + (attempts >= 3 ? 7 : 0),
        };
        this.remember(e, s, "Oferta inferior a sus expectativas salariales.");
        if (attempts >= 3) {
          e.motivation = Math.max(0, e.motivation - 3);
          e.loyalty = Math.max(0, e.loyalty - 2);
        }
        return { accepted: false, salary: q.minimum, cooldown: attempts >= 3 };
      }
      if (q.bonus)
        G.Economy.spendCompany(
          s,
          id,
          q.bonus,
          "Personal",
          `Prima de contratación · ${e.name}`,
        );
      e.companyId = id;
      e.status = "active";
      e.poorDays = 0;
      e.contract = {
        salary: q.salary,
        ...G.Pay.fields(e),
        bonus: q.bonus,
        start: s.day,
        end: s.day + q.months * 30,
        accrued: 0,
        arrears: 0,
      };
      e.motivation = Math.min(100, e.motivation + 4);
      for (const k of Object.keys(x.negotiations))
        if (x.negotiations[k].employeeId === eid) delete x.negotiations[k];
      this.remember(e, s, `Contrato firmado con ${q.company.name}.`);
      G.news(
        s,
        "Fichajes",
        `${q.company.name} incorpora a ${e.name}.`,
        `${this.roles[e.role].name}: $${q.salary}/${G.Pay.unit(e)} durante ${q.months} meses. Su capacidad profesional depende de experiencia, motivación y convivencia.`,
        "staff",
        eid,
      );
      return { accepted: true };
    },
    releaseQuote(e) {
      return (
        Math.round(
          (G.Pay.monthly(e.contract) +
            e.contract.accrued +
            e.contract.arrears) *
            100,
        ) / 100
      );
    },
    cancelAssignments(s, eid) {
      for (const j of s.staffing.assignments.filter(
        (j) => j.employeeId === eid && j.status === "active",
      )) {
        j.status = "cancelled";
        j.report = null;
        G.news(
          s,
          "Talentos",
          `Se interrumpe el informe sobre ${j.driverName}.`,
          "El ojeador ha dejado la compañía. Los gastos de desplazamiento ya ejecutados no se devuelven.",
          "staff",
          j.id,
        );
      }
    },
    depart(s, e, reason, paid = false, retired = false) {
      const id = e.companyId,
        c = s.companies.find((c) => c.id === id),
        due = Math.round((e.contract.accrued + e.contract.arrears) * 100) / 100;
      let owed = false;
      if (!paid && due) {
        if (c.balance >= due)
          G.Economy.transact(
            s,
            id,
            -due,
            "Personal",
            `Liquidación · ${e.name}`,
          );
        else {
          owed = true;
          s.staffing.debts.push({
            id: this.uid(s, "staffdebt"),
            companyId: id,
            employeeId: e.id,
            amount: due,
            day: s.day,
            paid: false,
          });
        }
      }
      this.cancelAssignments(s, e.id);
      this.remember(e, s, `${reason} · ${c.name}.`);
      e.companyId = null;
      e.contract = null;
      e.status = retired ? "retired" : "available";
      e.lastCompanyId = id;
      e.availableAfter =
        s.day + (reason === "Dimisión" || reason === "Rescisión" ? 30 : 0);
      e.poorDays = 0;
      G.news(
        s,
        "Fichajes",
        `${e.name}: ${reason.toLowerCase()}.`,
        `${this.roles[e.role].name} de ${c.name}. ${retired ? "Su trayectoria queda archivada." : "Puede estudiar nuevas propuestas."}${owed ? " La obligación salarial pendiente se conserva." : ""}`,
        "staff",
        e.id,
      );
    },
    release(s, eid, id = s.playerId) {
      const e = s.employees.find((e) => e.id === eid && e.companyId === id);
      G.assert(
        !s.race && e?.contract,
        "No puedes rescindir este contrato ahora.",
      );
      G.assert(
        !this.busy(s, eid),
        "Termina primero el trabajo o entrenamiento asignado a este profesional.",
      );
      G.Economy.spendCompany(
        s,
        id,
        this.releaseQuote(e),
        "Personal",
        `Rescisión y nóminas · ${e.name}`,
      );
      e.loyalty = Math.max(0, e.loyalty - 10);
      this.depart(s, e, "Rescisión", true);
    },
    renewalMinimum(e) {
      return (
        Math.round((e.contract.salary * (e.loyalty >= 70 ? 1.03 : 1.06)) / 10) *
        10
      );
    },
    renew(s, eid, salary, months = 12, id = s.playerId) {
      const e = s.employees.find((e) => e.id === eid && e.companyId === id);
      G.assert(
        !s.race &&
          s.companies.find((c) => c.id === id)?.status === "active" &&
          e?.contract,
        "Contrato no disponible.",
      );
      G.assert(
        e.contract.end - s.day <= 60 && e.contract.end > s.day,
        "La renovación se abre durante los últimos 60 días.",
      );
      G.assert(
        Number.isInteger(salary) &&
          salary >= this.renewalMinimum(e) &&
          salary <= 5000 &&
          G.Pay.durations(s).includes(months),
        "El profesional no acepta la renovación.",
      );
      e.contract.salary = salary;
      e.contract.end += months * 30;
      e.motivation = Math.min(100, e.motivation + 8);
      e.loyalty = Math.min(100, e.loyalty + 5);
      this.remember(e, s, "Renovación acordada sin perder nóminas devengadas.");
      G.news(
        s,
        "Fichajes",
        `${e.name} renueva su contrato.`,
        `$${salary}/${G.Pay.unit(e)} y ${months} meses adicionales. Se conservan las obligaciones anteriores.`,
        "staff",
        eid,
      );
    },
    pay(s, id = s.playerId) {
      const c = s.companies.find((c) => c.id === id),
        total = this.overdue(s, id);
      G.assert(
        !s.race && c?.status === "active" && total > 0 && c.balance >= total,
        "No hay liquidez suficiente o nóminas pendientes para liquidar.",
      );
      this.payDue(s, id);
    },
    payDue(s, id) {
      const c = s.companies.find((c) => c.id === id);
      for (const e of this.owned(s, id))
        if (e.contract.arrears > 0 && c.balance >= e.contract.arrears) {
          G.Economy.transact(
            s,
            id,
            -e.contract.arrears,
            "Personal",
            `Nómina · ${e.name}`,
          );
          e.contract.arrears = 0;
        }
      for (const d of s.staffing.debts.filter(
        (d) => d.companyId === id && !d.paid,
      ))
        if (c.balance >= d.amount) {
          G.Economy.transact(
            s,
            id,
            -d.amount,
            "Personal",
            "Liquidación salarial pendiente",
          );
          d.paid = true;
        }
    },
    scoutQuote(s, eid, driverId, id = s.playerId) {
      const e = s.employees.find(
          (e) => e.id === eid && e.companyId === id && e.role === "scout",
        ),
        d = s.drivers.find((d) => d.id === driverId),
        c = s.companies.find((c) => c.id === id);
      G.assert(
        !s.race && c?.status === "active" && e?.contract && d,
        "Necesitas un ojeador contratado y un piloto válido.",
      );
      G.assert(
        !G.Professionals?.resting(s, eid),
        "El ojeador está descansando.",
      );
      G.assert(
        !s.staffing.assignments.some(
          (j) => j.employeeId === eid && j.status === "active",
        ),
        "Este ojeador ya prepara otro informe.",
      );
      const quality = this.strength(s, id, "scout"),
        days = Math.max(3, 7 - Math.floor(quality / 20));
      G.assert(
        e.contract.end >= s.day + days,
        "Renueva al ojeador antes de pedir un informe que excede su contrato.",
      );
      G.assert(c.balance >= 75, "No hay fondos para los gastos de ojeo.");
      return { employee: e, driver: d, cost: 75, days, quality };
    },
    scout(s, eid, driverId, id = s.playerId) {
      const q = this.scoutQuote(s, eid, driverId, id),
        x = s.staffing;
      G.Economy.spendCompany(
        s,
        id,
        q.cost,
        "Formación",
        `Informe de ojeo · ${q.driver.name}`,
      );
      const estimated = G.clamp(
          Math.round(
            q.driver.potential + (G.random(x) - 0.5) * (36 - q.quality * 0.25),
          ),
          25,
          99,
        ),
        margin = Math.max(8, Math.round(23 - q.quality * 0.16));
      const job = {
        id: this.uid(s, "scoutjob"),
        companyId: id,
        employeeId: eid,
        driverId,
        driverName: q.driver.name,
        start: s.day,
        end: s.day + q.days,
        cost: 75,
        quality: q.quality,
        status: "active",
        report: {
          lower: Math.max(20, estimated - margin),
          upper: Math.min(99, estimated + margin),
        },
      };
      x.assignments.push(job);
      return job;
    },
    compatibility(a, b) {
      const pair = [a.personality, b.personality];
      return (
        (pair.includes("sociable")
          ? 30
          : pair.includes("ambitious") && pair.includes("independent")
            ? -65
            : pair[0] === pair[1]
              ? 15
              : 0) +
        (a.teamwork + b.teamwork - 120) * 0.4
      );
    },
    daily(s) {
      const x = s.staffing;
      if (!x || x.lastDaily === s.day) return;
      const now = this.birthday(s),
        date = G.dateAt(s.day);
      x.lastDaily = s.day;
      for (const e of s.employees) {
        const birthdayYear = now.day >= e.birthday ? now.year : now.year - 1;
        if (birthdayYear > e.lastBirthdayYear) {
          e.age += birthdayYear - e.lastBirthdayYear;
          e.lastBirthdayYear = birthdayYear;
        }
        if (e.status === "retired") continue;
        if (e.companyId) {
          const c = s.companies.find((c) => c.id === e.companyId);
          e.contract.accrued += G.Pay.daily(e.contract)
            ? e.contract.salary
            : e.contract.salary / 30;
          if (G.Pay.daily(e.contract) || date.getUTCDate() === 1) {
            e.contract.arrears =
              Math.round((e.contract.arrears + e.contract.accrued) * 100) / 100;
            e.contract.accrued = 0;
          }
          e.experience += 1 / 365;
          e.skill = Math.min(
            95,
            e.skill + (e.motivation >= 60 ? e.learning * 0.000025 : 0),
          );
          if (e.age >= 65) {
            this.depart(s, e, "Retiro", false, true);
            continue;
          }
          if (s.day >= e.contract.end) {
            this.depart(s, e, "Fin de contrato");
            continue;
          }
          if (c.balance < 0) e.motivation = Math.max(0, e.motivation - 0.4);
        } else if (e.age >= 65) {
          e.status = "retired";
          this.remember(e, s, "Retiro profesional.");
        }
      }
      for (const c of s.companies) {
        this.payDue(s, c.id);
        const team = this.owned(s, c.id);
        for (let i = 0; i < team.length; i++)
          for (const b of team.slice(i + 1)) {
            const a = team[i],
              [first, second] = [a.id, b.id].sort();
            let bond = x.bonds.find((r) => r.a === first && r.b === second);
            if (!bond) {
              bond = {
                a: first,
                b: second,
                value: 0,
                warned: false,
                lastDay: s.day,
              };
              x.bonds.push(bond);
            }
            bond.value += G.clamp(
              this.compatibility(a, b) - bond.value,
              -0.8,
              0.8,
            );
            bond.value = G.clamp(bond.value, -100, 100);
            bond.lastDay = s.day;
            if (bond.value < -35) {
              a.motivation = Math.max(0, a.motivation - 0.2);
              b.motivation = Math.max(0, b.motivation - 0.2);
              if (!bond.warned) {
                bond.warned = true;
                this.remember(a, s, `Tensión laboral con ${b.name}.`);
                this.remember(b, s, `Tensión laboral con ${a.name}.`);
                G.news(
                  s,
                  "Compañía",
                  `Desacuerdos en la plantilla de ${c.name}.`,
                  `${a.name} y ${b.name} tienen dificultades para trabajar juntos. La convivencia afecta al rendimiento.`,
                  "staff",
                  a.id,
                );
              }
            }
          }
        for (const e of team) {
          const overdue = e.contract.arrears > 0;
          if (overdue) {
            e.motivation = Math.max(0, e.motivation - 1);
            e.loyalty = Math.max(0, e.loyalty - 0.5);
          } else if (this.cohesion(s, c.id) >= 70) {
            e.motivation = Math.min(90, e.motivation + 0.08);
            e.loyalty = Math.min(95, e.loyalty + 0.015);
          }
          e.poorDays = e.motivation < 25 ? e.poorDays + 1 : 0;
          if (e.poorDays >= 30 && !this.busy(s, e.id))
            this.depart(s, e, "Dimisión");
        }
      }
      for (const j of x.assignments.filter(
        (j) => j.status === "active" && j.end <= s.day,
      )) {
        const e = s.employees.find(
          (e) => e.id === j.employeeId && e.companyId === j.companyId,
        );
        if (!e) {
          j.status = "cancelled";
          j.report = null;
          continue;
        }
        j.status = "complete";
        e.contributions.reports++;
        e.skill = Math.min(95, e.skill + 0.08);
        G.news(
          s,
          "Talentos",
          `Informe disponible: ${j.driverName}.`,
          "El ojeador ha completado su evaluación. El intervalo es una estimación, no una garantía del potencial real.",
          "staff",
          j.id,
        );
      }
      if (s.day - x.lastRecruit >= 60) {
        x.lastRecruit = s.day;
        for (const role of Object.keys(this.roles).filter(
          (role) => !["manager", "doctor", "researcher"].includes(role),
        ))
          if (
            s.employees.filter(
              (e) => e.role === role && e.status === "available",
            ).length < 2
          )
            s.employees.push(this.generate(s, role));
      }
      const active = x.assignments.filter((j) => j.status === "active"),
        completed = x.assignments.filter((j) => j.status !== "active");
      x.assignments = [...completed.slice(-80), ...active];
      x.debts = [
        ...x.debts.filter((d) => !d.paid),
        ...x.debts.filter((d) => d.paid).slice(-80),
      ];
      x.bonds.sort((a, b) => b.lastDay - a.lastDay);
      x.bonds.length = Math.min(160, x.bonds.length);
    },
    bankrupt(s, id) {
      for (const e of this.owned(s, id)) this.depart(s, e, "Bancarrota");
      for (const car of G.ownedCars(s, id))
        if (car.repair?.staffSupport) car.repair.staffSupport = null;
      const c = s.companies.find((c) => c.id === id),
        job = id === s.playerId ? s.job : c?.job;
      if (job?.staffSupport) job.staffSupport = null;
    },
    aiCandidates(s, c, budget) {
      if (!s.staffing || s.day < 30) return [];
      const team = this.owned(s, c.id),
        monthly = G.Companies.monthly(s, c.id),
        management = [];
      for (const e of team) {
        if (
          e.contract.end - s.day <= 60 &&
          e.contract.end > s.day &&
          c.balance >=
            (monthly -
              G.Pay.monthly(e.contract) +
              G.Pay.monthlyRate(this.renewalMinimum(e), e)) *
              4 &&
          !this.overdue(s, c.id)
        )
          management.push({
            action: "renovación de personal",
            utility: 58,
            reason: `Retener a ${e.name} con cuatro meses de reserva y condiciones de renovación reales.`,
            targetId: null,
            cost: 0,
            run: () => this.renew(s, e.id, this.renewalMinimum(e), 12, c.id),
          });
        const cost = this.releaseQuote(e);
        if (
          c.balance < monthly * 0.8 &&
          !this.busy(s, e.id) &&
          c.balance >= cost
        )
          management.push({
            action: "ajuste de personal",
            utility: 120 - this.strength(s, c.id, e.role) / 10,
            reason: `Reducir nómina liquidando el contrato de ${e.name} antes de agotar la caja.`,
            targetId: null,
            cost,
            run: () => this.release(s, e.id, c.id),
          });
      }
      if (team.length >= this.capacity(s, c.id) || c.balance < monthly * 3)
        return management;
      const existing = new Set(this.owned(s, c.id).map((e) => e.role)),
        priorities =
          c.personality === "Formadora"
            ? ["trainer", "mechanic", "engineer"]
            : c.personality === "Desarrolladora"
              ? ["engineer", "mechanic", "trainer"]
              : ["mechanic", "strategist", "engineer"];
      return [
        ...management,
        ...priorities.flatMap((role, i) => {
          if (existing.has(role)) return [];
          const e = s.employees
            .filter(
              (e) =>
                e.status === "available" &&
                e.role === role &&
                (!G.Challenge.enabled(s) ||
                  c.level >= G.Challenge.staffLevel(s, e)) &&
                (e.lastCompanyId !== c.id || e.availableAfter <= s.day),
            )
            .sort((a, b) => b.skill / b.ask - a.skill / a.ask)[0];
          if (!e) return [];
          const salary = this.minimum(s, e, { months: 12, bonus: 0 }, c.id);
          if (
            G.Pay.monthlyRate(salary, e) * 3 > budget ||
            c.balance <
              (G.Companies.monthly(s, c.id) + G.Pay.monthlyRate(salary, e)) * 4
          )
            return [];
          return [
            {
              action: "personal",
              utility: 39 - i * 5,
              reason: `${this.roles[role].name}: incorporar apoyo real con reserva para cuatro meses de operación.`,
              targetId: null,
              cost: 0,
              run: () =>
                this.offer(s, e.id, { salary, months: 12, bonus: 0 }, c.id),
            },
          ];
        }),
      ];
    },
    snapshot(s, id) {
      return Object.fromEntries(
        ["mechanic", "engineer", "strategist"].map((role) => [
          role,
          this.strength(s, id, role, true),
        ]),
      );
    },
    pitFactor(a) {
      return a.staffSupport
        ? 1 -
            Math.min(
              0.25,
              a.staffSupport.mechanic * 0.0015 +
                a.staffSupport.strategist * 0.0015,
            )
        : 1;
    },
    validate(s) {
      const x = s.staffing;
      if (x === undefined) {
        G.assert(!s.employees?.length, "Personal sin versión de gestión.");
        return;
      }
      const num = (v, lo = 0, hi = 100) =>
          Number.isFinite(v) && v >= lo && v <= hi,
        day = (v) => Number.isInteger(v) && v >= 0 && v <= s.day;
      G.assert(
        x &&
          x.version === 1 &&
          Number.isInteger(x.sequence) &&
          x.sequence >= 25 &&
          Number.isInteger(x.rng) &&
          day(x.lastDaily) &&
          day(x.lastRecruit) &&
          Array.isArray(s.employees) &&
          s.employees.length <= 2000 &&
          x.negotiations &&
          typeof x.negotiations === "object" &&
          !Array.isArray(x.negotiations) &&
          Array.isArray(x.assignments) &&
          Array.isArray(x.bonds) &&
          x.bonds.length <= 160 &&
          Array.isArray(x.debts),
        "Gestión de personal inválida.",
      );
      const companies = new Set(s.companies.map((c) => c.id)),
        employeeIds = new Set(s.employees.map((e) => e.id));
      for (const e of s.employees) {
        G.assert(
          ((/^employee-[0-9]+$/.test(e.id) &&
            Number(e.id.split("-")[1]) <= x.sequence) ||
            (/^specialist-[0-9]+$/.test(e.id) &&
              ["manager", "doctor"].includes(e.role) &&
              Number(e.id.split("-")[1]) <= (s.operations?.sequence || 0))) &&
            typeof e.name === "string" &&
            e.name.length <= 100 &&
            Object.hasOwn(this.roles, e.role) &&
            Number.isInteger(e.age) &&
            e.age >= 18 &&
            e.age <= 200 &&
            Number.isInteger(e.birthday) &&
            e.birthday >= 0 &&
            e.birthday <= 364 &&
            Number.isInteger(e.lastBirthdayYear) &&
            num(e.experience, 0, 200) &&
            [e.skill, e.teamwork, e.learning, e.motivation, e.loyalty].every(
              (v) => num(v),
            ) &&
            Object.hasOwn(this.personalities, e.personality) &&
            Number.isInteger(e.ask) &&
            e.ask >= G.Pay.minimum(e) &&
            ["available", "active", "retired"].includes(e.status) &&
            (e.lastCompanyId === null || companies.has(e.lastCompanyId)) &&
            Number.isInteger(e.availableAfter) &&
            e.availableAfter >= 0 &&
            Number.isInteger(e.poorDays) &&
            e.poorDays >= 0 &&
            Array.isArray(e.memory) &&
            e.memory.length <= 24 &&
            e.memory.every((m) => day(m.day) && typeof m.text === "string") &&
            e.contributions &&
            ["jobs", "sessions", "reports"].every(
              (k) =>
                Number.isInteger(e.contributions[k]) && e.contributions[k] >= 0,
            ),
          "Perfil profesional inválido.",
        );
        G.assert(
          e.status === "active"
            ? companies.has(e.companyId) &&
                s.companies.find((c) => c.id === e.companyId).status ===
                  "active" &&
                e.contract &&
                Number.isInteger(e.contract.salary) &&
                e.contract.salary >= G.Pay.minimum(e) &&
                e.contract.salary <= 5000 &&
                Number.isInteger(e.contract.bonus) &&
                e.contract.bonus >= 0 &&
                e.contract.bonus <= 2000 &&
                day(e.contract.start) &&
                Number.isInteger(e.contract.end) &&
                e.contract.end > e.contract.start &&
                e.contract.end > s.day &&
                num(e.contract.accrued, 0, 1000000) &&
                num(e.contract.arrears, 0, 1000000)
            : e.companyId === null && e.contract === null,
          "Contrato profesional inválido.",
        );
      }
      for (const c of s.companies) {
        const team = this.owned(s, c.id);
        G.assert(
          team.length <= this.capacity(s, c.id) &&
            new Set(team.map((e) => e.role)).size === team.length,
          "Plantilla por encima de la capacidad o especialidad duplicada.",
        );
      }
      const assigned = new Set();
      for (const { work, companyId } of [
        ...s.cars
          .filter((c) => c.repair)
          .map((c) => ({ work: c.repair, companyId: c.companyId })),
        ...s.companies
          .map((c) => ({
            work: c.id === s.playerId ? s.job : c.job,
            companyId: c.id,
          }))
          .filter((item) => item.work),
      ])
        if (work.staffSupport) {
          const p = work.staffSupport;
          G.assert(
            employeeIds.has(p.employeeId) &&
              !assigned.has(p.employeeId) &&
              s.employees.some(
                (e) =>
                  e.id === p.employeeId &&
                  (e.companyId === companyId || e.status === "retired") &&
                  e.role ===
                    (["install", "remove"].includes(work.type)
                      ? "engineer"
                      : "mechanic"),
              ) &&
              num(p.quality),
            "Profesional asignado a dos trabajos o apoyo inválido.",
          );
          assigned.add(p.employeeId);
        }
      const working = new Set();
      for (const j of x.assignments) {
        G.assert(
          /^scoutjob-[0-9]+$/.test(j.id) &&
            Number(j.id.split("-")[1]) <= x.sequence &&
            companies.has(j.companyId) &&
            employeeIds.has(j.employeeId) &&
            s.employees.find((e) => e.id === j.employeeId).role === "scout" &&
            s.drivers.some((d) => d.id === j.driverId) &&
            typeof j.driverName === "string" &&
            day(j.start) &&
            Number.isInteger(j.end) &&
            j.end > j.start &&
            j.end - j.start >= 3 &&
            j.end - j.start <= 7 &&
            j.cost === 75 &&
            num(j.quality) &&
            ["active", "complete", "cancelled"].includes(j.status),
          "Encargo de ojeo inválido.",
        );
        if (j.status === "active") {
          G.assert(
            !working.has(j.employeeId) &&
              s.employees.some(
                (e) =>
                  e.id === j.employeeId &&
                  e.companyId === j.companyId &&
                  e.contract,
              ) &&
              j.end > s.day,
            "Ojeador ocupado dos veces o informe huérfano.",
          );
          working.add(j.employeeId);
        }
        G.assert(
          j.status === "cancelled"
            ? j.report === null
            : j.report &&
                Number.isInteger(j.report.lower) &&
                Number.isInteger(j.report.upper) &&
                j.report.lower >= 20 &&
                j.report.upper <= 99 &&
                j.report.lower < j.report.upper,
          "Estimación de potencial inválida.",
        );
      }
      for (const [key, n] of Object.entries(x.negotiations))
        G.assert(
          key === `${n.companyId}:${n.employeeId}` &&
            companies.has(n.companyId) &&
            employeeIds.has(n.employeeId) &&
            Number.isInteger(n.salary) &&
            n.salary >= (G.Challenge.enabled(s) ? 10 : 150) &&
            n.salary <= 5000 &&
            [6, 12, 24].includes(n.months) &&
            Number.isInteger(n.bonus) &&
            n.bonus >= 0 &&
            n.bonus <= 2000 &&
            Number.isInteger(n.attempts) &&
            n.attempts > 0 &&
            Number.isInteger(n.cooldown) &&
            n.cooldown >= 0,
          "Negociación profesional inválida.",
        );
      const pairs = new Set();
      for (const b of x.bonds) {
        const key = `${b.a}:${b.b}`;
        G.assert(
          employeeIds.has(b.a) &&
            employeeIds.has(b.b) &&
            b.a < b.b &&
            !pairs.has(key) &&
            num(b.value, -100, 100) &&
            typeof b.warned === "boolean" &&
            day(b.lastDay),
          "Relación laboral inválida.",
        );
        pairs.add(key);
      }
      for (const d of x.debts)
        G.assert(
          /^staffdebt-[0-9]+$/.test(d.id) &&
            Number(d.id.split("-")[1]) <= x.sequence &&
            companies.has(d.companyId) &&
            employeeIds.has(d.employeeId) &&
            num(d.amount, 0.01, 1000000) &&
            day(d.day) &&
            typeof d.paid === "boolean",
          "Obligación salarial inválida.",
        );
      if (s.race?.staffVersion !== undefined) {
        G.assert(
          s.race.staffVersion === 1,
          "Versión de apoyo técnico incompatible.",
        );
        for (const a of s.race.entrants)
          G.assert(
            a.staffSupport &&
              ["mechanic", "engineer", "strategist"].every((role) =>
                num(a.staffSupport[role]),
              ),
            "Apoyo de carrera inválido.",
          );
      }
    },
  });
  const start = G.Race.start;
  G.Race.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    r.staffVersion = 1;
    for (const a of r.entrants) a.staffSupport = S.snapshot(s, a.companyId);
    return r;
  };
})();
