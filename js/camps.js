"use strict";
(() => {
  const G = RCS,
    T = G.Practice,
    P = G.Professionals,
    S = G.Staff,
    R = G.Research,
    quote = T.quote,
    start = T.start,
    tick = T.tick,
    finish = T.finish,
    validate = T.validate;
  const C = (G.Camps = {
    enabled: (s) => R.enabled(s),
    quote(s, options) {
      const q = quote.call(T, s, options);
      if (!this.enabled(s)) return q;
      G.assert(
        !G.Market.locked(s, q.driver.id) && !G.Market.locked(s, q.car.id),
        "Retira las inscripciones del piloto y coche antes de reservar un programa de entrenamiento.",
      );
      const rating = G.Drivers.rating(q.driver),
        coachFactor = G.clamp(
          1.5 - q.ability * 0.078 - q.coach.skill * 0.002,
          0.5,
          1.5,
        ),
        driverFactor = G.clamp(
          1.26 -
            rating / 210 -
            Math.min(20, q.driver.experience) * 0.009 +
            (q.driver.fatigue + P.care(s, q.driver.id).stress) * 0.002,
          0.55,
          1.7,
        ),
        days = Math.max(
          2,
          Math.ceil(
            (2 + q.laps / 4) *
              coachFactor *
              driverFactor *
              (1 - R.effect(s, "campTime")),
          ),
        ),
        cost = 80 + q.laps * 4 + days * 10;
      G.assert(
        q.driver.contract.end > s.day + days &&
          q.coach.contract.end > s.day + days,
        "Los contratos del piloto y entrenador deben cubrir todos los días previstos del programa.",
      );
      G.assert(
        G.player(s).balance >= cost,
        "No hay fondos para reservar el programa completo.",
      );
      const stressPerLap = q.stressPerLap * (1 - R.effect(s, "trainingStress"));
      let stress = P.care(s, q.driver.id).stress,
        fatigue = q.driver.fatigue,
        safe = 1;
      for (let i = 0; i < days; i++) {
        stress = G.clamp(
          Math.max(0, stress - 3) + (stressPerLap * q.laps) / days,
          0,
          100,
        );
        fatigue = G.clamp(
          Math.max(0, fatigue - 3) + (q.fatiguePerLap * q.laps) / days,
          0,
          100,
        );
        safe *= Math.pow(
          1 - T.risk(stress, fatigue, q.ability, q.driver.stats.control),
          q.laps / days,
        );
      }
      return {
        ...q,
        cost,
        days,
        end: s.day + days,
        stressPerLap,
        stressAfter: stress,
        fatigueAfter: fatigue,
        incidentRisk: (1 - safe) * 100,
        severeRisk:
          (((1 - safe) * 0.01 * stress) / 100) * (1 - q.level * 0.04) * 100,
        learningBonus: R.effect(s, "training"),
        coachWages: q.coach.contract.salary * days,
        pilotWages: q.driver.contract.salary * days,
      };
    },
    start(s, options) {
      const q = this.quote(s, options),
        j = start.call(T, s, options);
      if (!this.enabled(s)) return j;
      if (q.cost > 80)
        G.Economy.spend(
          s,
          q.cost - 80,
          "Formación",
          "Reserva del programa de pista",
        );
      Object.assign(j, {
        calendarVersion: 1,
        end: q.end,
        days: q.days,
        daysWorked: 0,
        lastDay: s.day,
        cost: q.cost,
        workLaps: 0,
        beforeStats: G.clone(q.driver.stats),
        beforeFatigue: q.driver.fatigue,
        beforeStress: P.care(s, q.driver.id).stress,
        beforeTires: q.car.tires,
        learningBonus: q.learningBonus,
        report: null,
        stopReason: "",
      });
      q.driver.training = null;
      G.Operations.releaseTraining(s, q.driver.id);
      G.news(
        s,
        "Talentos",
        `${q.driver.name} comienza un programa de pista.`,
        `${q.laps} vueltas distribuidas en ${q.days} días. Coste de reserva $${q.cost}, salarios aparte. Puedes seguir gestionando la compañía; el piloto, entrenador y coche quedan reservados.`,
        "practice",
        j.id,
      );
      return j;
    },
    daily(s) {
      const j = T.active(s);
      if (!j?.calendarVersion || j.lastDay >= s.day) return;
      j.lastDay = s.day;
      const d = s.drivers.find((d) => d.id === j.driverId),
        e = s.employees.find((e) => e.id === j.coachId),
        car = s.cars.find((c) => c.id === j.carId),
        care = d && P.care(s, d.id);
      if (
        !d?.contract ||
        d.companyId !== s.playerId ||
        !e?.contract ||
        e.companyId !== s.playerId ||
        e.contract.arrears ||
        !car ||
        car.companyId !== s.playerId ||
        car.repair ||
        !P.fit(s, d.id)
      ) {
        j.stopReason =
          "Programa interrumpido: contrato, disponibilidad o salud del equipo.";
        return this.finish(s, "cancelled");
      }
      j.daysWorked++;
      const target = Math.min(j.laps, (j.laps * j.daysWorked) / j.days),
        delta = target - j.workLaps,
        len = G.Data.tracks[j.track].length,
        a = j.a;
      const speed =
          Math.min(a.top / 3.6, 35) *
          (0.75 + d.stats.pace / 300) *
          (0.82 + d.stats.control / 350) *
          (j.intensity === "hard" ? 1.08 : j.intensity === "easy" ? 0.87 : 1),
        distance = len * delta,
        seconds = distance / Math.max(12, speed);
      j.workLaps = target;
      a.progress += distance;
      j.time += seconds;
      a.speed = speed;
      a.braking = false;
      a.tires = Math.max(
        0,
        a.tires -
          distance *
            0.00065 *
            (j.intensity === "hard" ? 1.4 : j.intensity === "easy" ? 0.8 : 1) *
            (1 - R.effect(s, "tireWear")),
      );
      a.components.tires = a.tires;
      G.Workshop.wear(a, distance, seconds, 0.25);
      G.Performance.refresh(a);
      while (j.completed < Math.floor(target + 1e-8)) {
        j.completed++;
        j.lapTimes.push(len / Math.max(12, speed));
      }
      care.stress = G.clamp(care.stress + j.stressPerLap * delta, 0, 100);
      d.fatigue = G.clamp(d.fatigue + j.fatiguePerLap * delta, 0, 100);
      j.driverStress = care.stress;
      j.driverFatigue = d.fatigue;
      const chance =
        1 -
        Math.pow(
          1 - T.risk(care.stress, d.fatigue, j.coachAbility, d.stats.control),
          delta,
        );
      if (G.random(j) < chance) {
        const severe =
          G.random(j) <
          ((0.01 * care.stress) / 100) * (1 - j.coachLevel * 0.04);
        j.incident = severe ? "career-end" : "injury";
        j.recoveryDays = severe ? 0 : R.recoveryDays(s, G.integer(j, 3, 21));
        G.Race.damageCar(a, 10, 10);
        a.dnf = true;
        a.headingSlip = 0.7;
        a.lateral = 4;
        return this.finish(s, "completed");
      }
      if (
        Math.min(
          a.components.engine,
          a.components.transmission,
          a.components.cooling,
        ) < 20 ||
        a.tires <= 5
      ) {
        j.incident = "mechanical";
        a.dnf = true;
        return this.finish(s, "completed");
      }
      if (j.daysWorked >= j.days) return this.finish(s, "completed");
    },
    finish(s, status = "cancelled") {
      const j = T.active(s);
      if (!j?.calendarVersion) return finish.call(T, s, status);
      const d = s.drivers.find((d) => d.id === j.driverId),
        e = s.employees.find((e) => e.id === j.coachId),
        car = s.cars.find((c) => c.id === j.carId),
        care = P.care(s, d.id),
        amount =
          j.workLaps *
          0.035 *
          (0.55 + j.coachAbility * 0.16) *
          (j.intensity === "hard" ? 1.25 : j.intensity === "easy" ? 0.78 : 1) *
          (1 + j.learningBonus),
        secondary = {
          control: "brakes",
          pace: "consistency",
          brakes: "control",
          consistency: "focus",
        }[j.focus];
      for (const [key, mult] of [
        [j.focus, 1],
        [secondary, 0.25],
      ])
        d.stats[key] = Math.max(
          d.stats[key],
          Math.min(d.potential, d.stats[key] + amount * mult),
        );
      if (j.intensity === "hard" && j.driverStress > 75 && j.coachLevel < 4) {
        const key = j.focus === "consistency" ? "focus" : "consistency";
        d.stats[key] = Math.max(
          3,
          d.stats[key] - Math.min(0.75, j.workLaps * 0.03),
        );
      }
      if (j.incident === "injury" || j.incident === "career-end") {
        care.injuryUntil = j.incident === "injury" ? s.day + j.recoveryDays : 0;
        care.retired = j.incident === "career-end";
        if (j.incident === "injury")
          s.operations.injuries[d.id] = {
            key: `${d.id}:${care.injuryUntil}:${j.id}`,
            since: s.day,
            initialUntil: care.injuryUntil,
            currentUntil: care.injuryUntil,
          };
      }
      j.status = status;
      j.completedDay = s.day;
      j.a.finishTime = j.time;
      j.a.speed = 0;
      j.gain = Math.max(0, d.stats[j.focus] - j.beforeStats[j.focus]);
      car.km += Math.max(0, j.a.progress) / 1000;
      G.Workshop.finishRace(s, car, j.a, true);
      car.history.unshift({
        day: s.day,
        type: `Programa de pista · ${j.daysWorked}/${j.days} días${j.incident ? " · incidente" : ""}`,
      });
      car.history.length = Math.min(30, car.history.length);
      if (e) {
        e.contributions.sessions += j.completed;
        P.gain(s, e.id, j.daysWorked * 3);
      }
      const changes = Object.fromEntries(
        G.Drivers.stats.map((k) => [
          k,
          Number((d.stats[k] - j.beforeStats[k]).toFixed(6)),
        ]),
      );
      j.report = {
        day: s.day,
        changes,
        learned:
          amount > 0
            ? {
                control: "Mayor precisión de trazada y control del coche.",
                pace: "Mejor lectura del ritmo y gestión de las vueltas.",
                brakes: "Nuevas referencias de frenada y entradas de curva.",
                consistency:
                  "Repetición de referencias y concentración entre vueltas.",
              }[j.focus]
            : "No hubo tiempo de pista suficiente para consolidar una mejora.",
        stressChange: care.stress - j.beforeStress,
        fatigueChange: d.fatigue - j.beforeFatigue,
        tireChange: car.tires - j.beforeTires,
        incident: j.incident,
        reason:
          j.stopReason ||
          (status === "cancelled"
            ? "Interrumpido por el jugador."
            : j.incident
              ? "Programa terminado por incidente."
              : "Objetivo del programa completado."),
        cost: j.cost,
      };
      G.news(
        s,
        "Talentos",
        `${d.name}: informe de entrenamiento disponible.`,
        `${j.daysWorked}/${j.days} días, ${j.workLaps.toFixed(1)} vueltas. ${j.report.learned} ${G.Drivers.labels[j.focus]}: ${j.gain >= 0 ? "+" : ""}${j.gain.toFixed(3)}. ${j.report.reason}`,
        "practice",
        j.id,
      );
      s.professional.practices = [
        ...s.professional.practices
          .filter((v) => v.status !== "running")
          .slice(-20),
        ...s.professional.practices.filter((v) => v.status === "running"),
      ];
      return j;
    },
    validate(s) {
      const jobs = s.professional?.practices || [],
        modern = jobs.filter((j) => j.calendarVersion !== undefined);
      validate.call(T, {
        ...s,
        professional: s.professional
          ? {
              ...s.professional,
              practices: jobs.filter((j) => j.calendarVersion === undefined),
            }
          : undefined,
      });
      G.assert(
        jobs.filter((j) => j.status === "running").length <= 1,
        "Programas simultáneos inválidos.",
      );
      const num = (x, a, b) => Number.isFinite(x) && x >= a && x <= b,
        int = (x, a, b) => Number.isInteger(x) && x >= a && x <= b;
      for (const j of modern) {
        G.assert(
          R.enabled(s) &&
            j.calendarVersion === 1 &&
            int(j.days, 2, 40) &&
            int(j.daysWorked, 0, j.days) &&
            int(j.day, 0, s.day) &&
            int(j.end, j.day + 2, j.day + 40) &&
            j.end === j.day + j.days &&
            int(j.lastDay, j.day, s.day) &&
            [3, 5, 10, 20].includes(j.laps) &&
            int(j.completed, 0, j.laps) &&
            num(j.workLaps, 0, j.laps) &&
            Math.abs(j.workLaps - (j.laps * j.daysWorked) / j.days) < 1e-7 &&
            j.completed === Math.floor(j.workLaps + 1e-8) &&
            ["running", "completed", "cancelled"].includes(j.status) &&
            j.companyId === s.playerId &&
            s.drivers.some((d) => d.id === j.driverId) &&
            s.employees.some(
              (e) => e.id === j.coachId && e.role === "trainer",
            ) &&
            s.cars.some((c) => c.id === j.carId) &&
            j.track === 10 &&
            ["pace", "brakes", "control", "consistency"].includes(j.focus) &&
            ["easy", "normal", "hard"].includes(j.intensity) &&
            int(j.coachLevel, 1, 10) &&
            num(j.coachAbility, 1, j.coachLevel) &&
            num(j.stressPerLap, 0, 5) &&
            num(j.fatiguePerLap, 0, 5) &&
            num(j.driverStress, 0, 100) &&
            num(j.driverFatigue, 0, 100) &&
            num(j.time, 0, 100000) &&
            int(j.rng, 0, 4294967295) &&
            Array.isArray(j.lapTimes) &&
            j.lapTimes.length === j.completed &&
            j.lapTimes.every((v) => num(v, 0.1, 5000)) &&
            j.cost === 80 + j.laps * 4 + j.days * 10 &&
            num(j.gain, 0, 100) &&
            num(j.learningBonus, 0, 0.151) &&
            int(j.recoveryDays, 0, 21) &&
            [null, "injury", "career-end", "mechanical"].includes(j.incident) &&
            typeof j.stopReason === "string" &&
            j.a?.carId === j.carId &&
            j.a.driverId === j.driverId &&
            num(j.a.progress, 0, 200000) &&
            num(j.a.speed, 0, 100) &&
            G.Drivers.stats.every(
              (k) =>
                num(j.beforeStats?.[k], 0, 100) && num(j.a.stats?.[k], 0, 100),
            ) &&
            Object.keys(G.Parts.components).every((k) =>
              num(j.a.components?.[k], 0, 100),
            ) &&
            Object.values(j.a.partWear).every((v) => num(v, 0, 100)),
          "Programa de entrenamiento inválido.",
        );
        if (j.status === "running")
          G.assert(
            j.report === null &&
              j.completedDay === null &&
              j.a.finishTime === null,
            "Programa activo finalizado de forma incoherente.",
          );
        else
          G.assert(
            int(j.completedDay, j.day, s.day) &&
              j.a.finishTime === j.time &&
              j.report?.day === j.completedDay &&
              j.report.cost === j.cost &&
              G.Drivers.stats.every((k) =>
                num(j.report.changes[k], -100, 100),
              ) &&
              ["stressChange", "fatigueChange", "tireChange"].every((k) =>
                num(j.report[k], -100, 100),
              ) &&
              typeof j.report.learned === "string" &&
              typeof j.report.reason === "string",
            "Informe de programa inválido.",
          );
      }
    },
  });
  T.quote = (s, ...args) => C.quote(s, ...args);
  T.start = (s, ...args) => C.start(s, ...args);
  T.finish = (s, ...args) => C.finish(s, ...args);
  T.tick = function (s, ...args) {
    if (T.active(s)?.calendarVersion) return;
    return tick.call(this, s, ...args);
  };
  T.validate = (s) => C.validate(s);
  const depart = S.depart;
  S.depart = function (s, e, ...args) {
    if (T.active(s)?.calendarVersion && T.active(s).coachId === e.id) {
      T.active(s).stopReason = "El entrenador deja la plantilla.";
      C.finish(s, "cancelled");
    }
    if (
      s.research?.project?.status === "active" &&
      s.research.project.scientistId === e.id
    ) {
      s.research.project.status = "paused";
      s.research.project.blockedReason =
        "El investigador dejó la plantilla; conserva el progreso y reasigna otro.";
    }
    return depart.call(this, s, e, ...args);
  };
})();
