"use strict";
(() => {
  const G = RCS,
    P = G.Professionals,
    S = G.Staff;
  const T = (G.Practice = {
    active(s) {
      return s.professional?.practices.find((j) => j.status === "running");
    },
    risk(stress, fatigue, level, control) {
      return (
        0.00001 +
        Math.pow(Math.max(0, stress + fatigue - 50) / 100, 2) *
          0.006 *
          (1 - level * 0.07) *
          (1.5 - control / 200)
      );
    },
    quote(s, options) {
      const driver = s.drivers.find(
          (d) => d.id === options.driverId && d.companyId === s.playerId,
        ),
        coach = S.owned(s).find(
          (e) => e.id === options.coachId && e.role === "trainer",
        ),
        car = s.cars.find(
          (c) => c.id === options.carId && c.companyId === s.playerId,
        );
      G.ensurePlayable(s);
      G.assert(
        !s.race && !this.active(s),
        "Termina la carrera o el entrenamiento en curso.",
      );
      G.assert(
        driver &&
          P.fit(s, driver.id) &&
          driver.contract &&
          coach &&
          !P.resting(s, coach.id) &&
          !S.busy(s, coach.id) &&
          car &&
          !car.repair &&
          !G.Market.listed(s, car.id) &&
          G.Workshop.ready(car),
        "Necesitas un piloto apto, un entrenador disponible y un coche operativo propios.",
      );
      G.assert(
        coach.contract.end >= s.day + 1 && driver.contract.end >= s.day + 1,
        "Los contratos deben cubrir la jornada de entrenamiento.",
      );
      const laps = Number(options.laps),
        intensity = options.intensity || "normal",
        focus = options.focus || "control";
      G.assert(
        [3, 5, 10, 20].includes(laps) &&
          ["easy", "normal", "hard"].includes(intensity) &&
          ["pace", "brakes", "control", "consistency"].includes(focus),
        "Plan de entrenamiento inválido.",
      );
      G.assert(
        !G.nextEvent(s) || G.nextEvent(s).day > s.day,
        "Resuelve la carrera de hoy antes de entrenar.",
      );
      G.assert(
        G.player(s).balance >= 80,
        "No hay fondos para los $80 de uso de pista y consumibles.",
      );
      const level = P.profile(s, coach.id).level,
        ability = Math.max(
          1,
          level * (1 - P.profile(s, coach.id).stress * 0.007),
        ),
        current = P.care(s, driver.id),
        load = { easy: 1, normal: 2.5, hard: 4 }[intensity],
        stressPerLap = load * (1 - ability * 0.06),
        fatiguePerLap =
          { easy: 0.8, normal: 1.3, hard: 2.2 }[intensity] *
          (1 - driver.stats.stamina / 250);
      let stress = current.stress,
        fatigue = driver.fatigue,
        safe = 1;
      for (let i = 0; i < laps; i++) {
        stress = G.clamp(stress + stressPerLap, 0, 100);
        fatigue = G.clamp(fatigue + fatiguePerLap, 0, 100);
        safe *= 1 - this.risk(stress, fatigue, ability, driver.stats.control);
      }
      return {
        driver,
        coach,
        car,
        laps,
        intensity,
        focus,
        level,
        ability,
        cost: 80,
        stressPerLap,
        fatiguePerLap,
        stressAfter: stress,
        fatigueAfter: fatigue,
        incidentRisk: (1 - safe) * 100,
        severeRisk:
          (1 - safe) * 0.01 * (stress / 100) * (1 - level * 0.04) * 100,
      };
    },
    start(s, options) {
      const q = this.quote(s, options);
      G.Economy.spend(
        s,
        80,
        "Formación",
        "Pista de entrenamiento y consumibles",
      );
      const a = {
        ...G.Workshop.raceSnapshot(s, q.car),
        carId: q.car.id,
        driverId: q.driver.id,
        companyId: s.playerId,
        name: q.driver.name,
        team: G.player(s).name,
        model: q.car.model,
        color: q.car.color,
        shape: q.car.shape,
        hp: q.car.hp,
        weight: q.car.weight,
        grip: q.car.grip,
        brakes: q.car.brakes,
        top: q.car.top,
        reliability: q.car.reliability,
        condition: q.car.condition,
        tires: q.car.tires,
        stats: G.clone(q.driver.stats),
        trait: q.driver.trait,
        fatigue: q.driver.fatigue,
        morale: q.driver.morale,
        mode:
          q.intensity === "hard"
            ? "attack"
            : q.intensity === "easy"
              ? "save"
              : "balanced",
        speed: 0,
        progress: 0,
        lateral: 0,
        lane: 0,
        headingSlip: 0,
        width: 1.8,
        length: 4.3,
        braking: false,
        dnf: false,
        damage: 0,
        finishTime: null,
        pit: { phase: "none" },
        staffSupport: S.snapshot(s, s.playerId),
      };
      const j = {
        id: P.uid(s, "practice"),
        companyId: s.playerId,
        driverId: q.driver.id,
        coachId: q.coach.id,
        carId: q.car.id,
        day: s.day,
        completedDay: null,
        track: 0,
        laps: q.laps,
        completed: 0,
        intensity: q.intensity,
        focus: q.focus,
        coachLevel: q.level,
        coachAbility: q.ability,
        stressPerLap: q.stressPerLap,
        fatiguePerLap: q.fatiguePerLap,
        driverStress: P.care(s, q.driver.id).stress,
        driverFatigue: q.driver.fatigue,
        time: 0,
        lapStarted: 0,
        lapTimes: [],
        rng: G.integer(s.professional, 0, 4294967295),
        status: "running",
        incident: null,
        recoveryDays: 0,
        a,
        cost: 80,
        gain: 0,
      };
      s.professional.practices.push(j);
      return j;
    },
    tick(s, steps = 1) {
      const j = this.active(s);
      if (!j) return;
      G.assert(
        Number.isInteger(steps) && steps >= 1 && steps <= 20000,
        "Pasos de entrenamiento inválidos.",
      );
      const a = j.a,
        len = G.Data.tracks[j.track].length,
        dt = G.Race.dt;
      for (let i = 0; i < steps && j.status === "running"; i++) {
        j.time += dt;
        let limit = 64;
        for (const distance of [0, 25, 55]) {
          const curve = G.Race.point(j.track, a.progress + distance).limit;
          limit = Math.min(
            limit,
            Math.sqrt(
              Math.pow(
                curve * (0.72 + a.grip / 240) * (0.8 + a.stats.control / 350),
                2,
              ) +
                2 * 6 * distance,
            ),
          );
        }
        const target =
          Math.min(a.top / 3.6, limit) *
          { easy: 0.8, normal: 0.94, hard: 1.04 }[j.intensity] *
          (0.8 + a.stats.pace / 350) *
          G.Workshop.mechanical(a);
        a.braking = a.speed > target;
        a.speed += G.clamp(
          target - a.speed,
          -6 * dt,
          Math.max(1.5, (a.hp / a.weight) * 24) * dt,
        );
        const moved = Math.max(0, a.speed * dt);
        a.progress += moved;
        a.tires = Math.max(
          0,
          a.tires - moved * 0.0008 * (j.intensity === "hard" ? 1.5 : 1),
        );
        G.Workshop.wear(a, moved, dt, a.braking ? 1 : 0);
        const lap = Math.floor(a.progress / len);
        if (lap > j.completed) {
          j.completed = lap;
          j.lapTimes.push(j.time - j.lapStarted);
          j.lapStarted = j.time;
          j.driverStress = G.clamp(j.driverStress + j.stressPerLap, 0, 100);
          j.driverFatigue = G.clamp(j.driverFatigue + j.fatiguePerLap, 0, 100);
          if (
            G.random(j) <
            this.risk(
              j.driverStress,
              j.driverFatigue,
              j.coachAbility,
              a.stats.control,
            )
          ) {
            const severe =
              G.random(j) <
              0.01 * (j.driverStress / 100) * (1 - j.coachLevel * 0.04);
            j.incident = severe ? "career-end" : "injury";
            j.recoveryDays = severe ? 0 : G.integer(j, 3, 21);
            G.Race.damageCar(a, 10, 10);
            a.dnf = true;
            a.headingSlip = 0.7;
            a.lateral = 5;
            this.finish(s, "completed");
            break;
          }
          if (j.completed >= j.laps) {
            this.finish(s, "completed");
            break;
          }
        }
        if (
          Math.min(
            a.components.engine,
            a.components.transmission,
            a.components.cooling,
          ) < 20 ||
          a.tires <= 5 ||
          j.time > 5000
        ) {
          j.incident = "mechanical";
          a.dnf = true;
          a.headingSlip = 0.7;
          a.lateral = 5;
          this.finish(s, "completed");
          break;
        }
      }
    },
    finish(s, status = "cancelled") {
      const j = this.active(s);
      G.assert(j, "No hay un entrenamiento activo.");
      const d = s.drivers.find((d) => d.id === j.driverId),
        e = s.employees.find((e) => e.id === j.coachId),
        car = s.cars.find((c) => c.id === j.carId);
      j.a.speed = 0;
      j.a.finishTime = j.time;
      j.status = status;
      j.completedDay = s.day + 1;
      const before = d.stats[j.focus],
        amount =
          j.completed *
          0.02 *
          (0.65 + j.coachAbility * 0.12) *
          { easy: 0.75, normal: 1, hard: 1.25 }[j.intensity];
      d.stats[j.focus] = Math.max(
        before,
        Math.min(d.potential, before + amount),
      );
      j.gain = d.stats[j.focus] - before;
      car.km += Math.max(0, j.a.progress) / 1000;
      G.Workshop.finishRace(s, car, j.a, true);
      car.history.unshift({
        day: s.day,
        type: `Entrenamiento · ${j.completed} vueltas${j.incident ? " · incidente" : ""}`,
      });
      car.history.length = Math.min(30, car.history.length);
      e.contributions.sessions += j.completed;
      P.profile(s, e.id).stress = G.clamp(
        P.profile(s, e.id).stress + 4 + j.completed * 0.6,
        0,
        100,
      );
      G.Calendar.advance(s, 1);
      const care = P.care(s, d.id);
      care.stress = j.driverStress;
      d.fatigue = j.driverFatigue;
      if (j.incident === "injury" || j.incident === "career-end") {
        care.injuryUntil = j.incident === "injury" ? s.day + j.recoveryDays : 0;
        care.retired = j.incident === "career-end";
        d.training = null;
        for (const ev of s.season.events)
          if (ev.status === "scheduled" && ev.entry?.driverId === d.id) {
            G.RaceWeekend.releaseEntry(s, ev);
            ev.entry = null;
          }
      }
      G.news(
        s,
        "Talentos",
        `${d.name}: entrenamiento ${status === "cancelled" ? "interrumpido" : "finalizado"}.`,
        `${j.completed}/${j.laps} vueltas. ${j.incident === "career-end" ? "Un accidente grave ha terminado su carrera deportiva. Su identidad y obligaciones se conservan." : j.incident === "injury" ? `Lesión: ${j.recoveryDays} días de recuperación.` : j.incident === "mechanical" ? "La sesión termina por el estado del coche." : `Mejora ${j.gain.toFixed(3)} en ${G.Drivers.labels[j.focus]}.`} El uso de pista y el tiempo ya se han contabilizado.`,
        "practice",
        j.id,
      );
      s.professional.practices = [
        ...s.professional.practices
          .filter((p) => p.status !== "running")
          .slice(-20),
        ...s.professional.practices.filter((p) => p.status === "running"),
      ];
      return j;
    },
    validate(s) {
      if (!s.professional) return;
      G.assert(
        s.professional.practices.filter((j) => j.status === "running").length <=
          1,
        "Entrenamientos simultáneos inválidos.",
      );
      for (const j of s.professional.practices) {
        G.assert(
          s.drivers.some((d) => d.id === j.driverId) &&
            s.employees.some(
              (e) => e.id === j.coachId && e.role === "trainer",
            ) &&
            s.cars.some((c) => c.id === j.carId) &&
            j.companyId === s.playerId &&
            Number.isInteger(j.day) &&
            j.day >= 0 &&
            j.day <= s.day &&
            [3, 5, 10, 20].includes(j.laps) &&
            Number.isInteger(j.completed) &&
            j.completed >= 0 &&
            j.completed <= j.laps &&
            ["running", "completed", "cancelled"].includes(j.status) &&
            ["pace", "brakes", "control", "consistency"].includes(j.focus) &&
            ["easy", "normal", "hard"].includes(j.intensity) &&
            Number.isInteger(j.coachLevel) &&
            j.coachLevel >= 1 &&
            j.coachLevel <= 10 &&
            Number.isFinite(j.coachAbility) &&
            j.coachAbility >= 1 &&
            j.coachAbility <= j.coachLevel &&
            [j.stressPerLap, j.fatiguePerLap].every(
              (n) => Number.isFinite(n) && n > 0 && n <= 5,
            ) &&
            Number.isFinite(j.gain) &&
            j.gain >= 0 &&
            j.track === 0 &&
            Number.isInteger(j.recoveryDays) &&
            j.recoveryDays >= 0 &&
            j.recoveryDays <= 21 &&
            [j.driverStress, j.driverFatigue].every(
              (n) => Number.isFinite(n) && n >= 0 && n <= 100,
            ) &&
            Number.isFinite(j.time) &&
            j.time >= 0 &&
            j.time <= 5100 &&
            Number.isInteger(j.rng) &&
            Array.isArray(j.lapTimes) &&
            j.lapTimes.length === j.completed &&
            j.lapTimes.every((t) => Number.isFinite(t) && t > 0) &&
            j.cost === 80 &&
            j.a &&
            Number.isFinite(j.a.progress) &&
            j.a.progress >= 0 &&
            Number.isFinite(j.a.speed) &&
            j.a.speed >= 0 &&
            j.a.components &&
            Object.keys(G.Parts.components).every(
              (key) =>
                Number.isFinite(j.a.components[key]) &&
                j.a.components[key] >= 0 &&
                j.a.components[key] <= 100,
            ) &&
            j.a.carId === j.carId &&
            j.a.driverId === j.driverId &&
            j.a.companyId === j.companyId &&
            [
              "hp",
              "weight",
              "grip",
              "brakes",
              "top",
              "reliability",
              "thermal",
              "stress",
              "cooling",
              "tireWear",
              "bodyWear",
              "acceleration",
              "tires",
              "condition",
            ].every((key) => Number.isFinite(j.a[key]) && j.a[key] >= 0) &&
            j.a.hp > 0 &&
            j.a.weight > 0 &&
            j.a.stats &&
            G.Drivers.stats.every(
              (key) =>
                Number.isFinite(j.a.stats[key]) &&
                j.a.stats[key] >= 0 &&
                j.a.stats[key] <= 100,
            ) &&
            j.a.partWear &&
            Object.values(j.a.partWear).every(
              (n) => Number.isFinite(n) && n >= 0 && n <= 100,
            ) &&
            Number.isFinite(j.lapStarted) &&
            j.lapStarted >= 0 &&
            j.lapStarted <= j.time &&
            typeof j.a.dnf === "boolean" &&
            (j.status === "running"
              ? j.a.finishTime === null && j.completedDay === null
              : j.a.finishTime === j.time) &&
            [null, "injury", "career-end", "mechanical"].includes(j.incident),
          "Sesión de entrenamiento inválida.",
        );
        if (j.status === "running")
          G.assert(
            !s.race &&
              s.day === j.day &&
              s.drivers.some(
                (d) => d.id === j.driverId && d.companyId === s.playerId,
              ) &&
              s.employees.some(
                (e) => e.id === j.coachId && e.companyId === s.playerId,
              ) &&
              s.cars.some(
                (c) =>
                  c.id === j.carId && c.companyId === s.playerId && !c.repair,
              ),
            "Entrenamiento huérfano.",
          );
        else
          G.assert(
            Number.isInteger(j.completedDay) && j.completedDay <= s.day,
            "Fecha de entrenamiento inválida.",
          );
      }
    },
  });
  const busy = S.busy;
  S.busy = function (s, id) {
    return busy.call(this, s, id) || T.active(s)?.coachId === id;
  };
})();
