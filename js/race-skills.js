"use strict";
(() => {
  const G = RCS,
    R = G.Race,
    F = G.Racecraft,
    W = G.RaceWeekend,
    P = G.Performance,
    clamp = G.clamp;
  const categories = {
    driving: "Conducción",
    car: "Coche",
    tires: "Neumáticos",
    traffic: "Tráfico",
  };
  const stages = {
    observe: "Estudia al rival",
    tow: "Prepara el rebufo",
    feint: "Amaga una maniobra",
    switchback: "Prepara la salida cruzada",
    commit: "Mantiene el adelantamiento",
    defend: "Protege una posición",
    recover: "Consolida la maniobra",
  };
  const E = (G.RaceSkills = {
    categories,
    stages,
    enabled: (s) => s?.raceSkills?.version === 1,
    focuses(s) {
      return E.enabled(s)
        ? ["control", "pace", "brakes", "consistency", "overtake", "defense"]
        : ["control", "pace", "brakes", "consistency"];
    },
    initialize(s) {
      if (s.raceSkills !== undefined) {
        G.assert(E.enabled(s), "Versión de conducción incompatible.");
        return s;
      }
      G.assert(
        !s.race && !G.Auctions.active(s),
        "Termina la actividad en directo antes de actualizar la conducción.",
      );
      s.raceSkills = { version: 1, since: s.day, reports: [] };
      return s;
    },
    controlFactor(control, fatigue = 0) {
      const x = clamp(control, 0, 100) / 100;
      return (
        (0.64 + 1.8 * x - 0.56 * x * x) * (1 - clamp(fatigue, 0, 100) * 0.00035)
      );
    },
    pathScale(curvature, lateral) {
      return clamp(1 - curvature * lateral, 0.82, 1.2);
    },
    envelope(r, a, brakes, record = true) {
      const grip = W.grip(r, a),
        quality =
          (0.78 + P.grip(a) / 260) *
          (0.85 + a.tires * 0.0015) *
          Math.sqrt(grip);
      const utilization = E.controlFactor(a.stats.control, a.fatigue) / 1.88,
        reaction = F.effect(a).reaction,
        physicalBrakes = E.brakes(r, a, true);
      let physical = 75,
        driver = 75,
        cornerDistance = 0,
        apex = 75,
        turn = 0;
      for (let look = 0; look <= 360; look += 18) {
        const p = F.sample(r.track, a.progress + look),
          jac = E.pathScale(p.curvature, a.lateral);
        const carCorner = p.limit * quality * 1.88 * Math.sqrt(jac),
          driverCorner = carCorner * utilization;
        const distance = Math.max(0, look - a.speed * reaction * 0.32);
        const safe = Math.sqrt(
          driverCorner * driverCorner + 2 * brakes * 0.96 * distance,
        );
        if (safe < driver) {
          driver = safe;
          cornerDistance = look;
          apex = driverCorner;
          turn = p.curvature;
        }
        physical = Math.min(
          physical,
          Math.sqrt(carCorner * carCorner + 2 * physicalBrakes * 0.96 * look),
        );
      }
      const v = {
        physical,
        driver: Math.min(driver, physical),
        apex,
        cornerDistance,
        turn,
        grip,
      };
      if (record && a.skills) {
        a.skills.envelope = v;
        a.brain.speedCeiling = v.driver;
      }
      return v;
    },
    healthy(a) {
      const b = {
        ...a,
        components: Object.fromEntries(
          Object.keys(a.components).map((k) => [k, 100]),
        ),
        tires: 100,
        thermal: 90,
        condition: 100,
        fatigue: 0,
        partWear: Object.fromEntries(
          Object.keys(a.partWear).map((k) => [k, 100]),
        ),
        stats: { ...a.stats, control: 100, brakes: 100, focus: 100 },
        brain: { age: 28, experience: 18 },
        performance: {
          ...a.performance,
          initialComponents: Object.fromEntries(
            Object.keys(a.components).map((k) => [k, 100]),
          ),
          brakeHeat: 35,
        },
      };
      P.refresh(b);
      return b;
    },
    brakes(r, a, expert = false) {
      return (
        (4 + a.brakes / 25) *
        (0.75 + a.components.brakes * 0.0025) *
        W.grip(r, a) *
        (expert ? 1.26 : F.effect(a).braking) *
        P.brakeFactor(a)
      );
    },
    prepare(r, a, driverTarget) {
      const t = a.skills;
      if (!t) return;
      t.beforeSpeed = a.speed;
      t.driverTarget = driverTarget;
      t.beforeProgress = a.progress;
      t.beforeLateral = a.lateral;
      if (r.step % 10 === 0 || !t.reference) {
        const healthy = E.healthy(a),
          best = W.bestCompound(r);
        healthy.compound = best;
        healthy.tyreTemp = 65;
        const fresh = { ...a, tires: 100, compound: best, tyreTemp: 65 };
        const ideal = E.envelope(r, healthy, E.brakes(r, healthy), false),
          car = E.envelope(r, fresh, E.brakes(r, fresh), false);
        t.reference = Math.min(healthy.top / 3.6, ideal.physical);
        t.healthyDrive = {
          acceleration: healthy.acceleration,
          hp: healthy.hp,
          weight: healthy.weight,
          brakes: E.brakes(r, healthy, true),
        };
        t.carCapacity = Math.min(
          (a.top / 3.6) *
            (0.77 + a.condition * 0.0023) *
            G.Workshop.mechanical(a),
          car.physical,
        );
      }
    },
    clearLane(r, a, cars, lane, targetId) {
      const room = r.trackWidth / 2 - a.width / 2 - 0.45;
      return (
        Math.abs(lane) <= room &&
        cars.every(
          (o) =>
            o.carId === a.carId ||
            o.carId === targetId ||
            Math.abs(
              R.relative(a, o, G.Data.tracks[r.track].length) +
                (o.speed - a.speed) * 1.1,
            ) >
              a.length + 4 ||
            Math.abs(o.lateral - lane) > (a.width + o.width) / 2 + 0.55,
        )
      );
    },
    observe(r, a, c) {
      const b = a.skills.battle,
        front = c.front?.b;
      if (!front) return;
      let o = b.observations.find((o) => o.id === front.carId);
      if (!o) {
        o = {
          id: front.carId,
          samples: 0,
          brakeAhead: 0,
          inside: 0,
          wasBraking: false,
          lastSeen: r.time,
        };
        b.observations.push(o);
        if (b.observations.length > 6) b.observations.shift();
      }
      if (front.braking && !o.wasBraking) {
        let distance = 0,
          min = Infinity;
        for (let look = 0; look <= 250; look += 25) {
          const p = F.sample(r.track, front.progress + look);
          if (p.limit < min) {
            min = p.limit;
            distance = look;
          }
        }
        o.brakeAhead = o.samples
          ? o.brakeAhead * 0.65 + distance * 0.35
          : distance;
        o.samples++;
      }
      const bend =
        Math.sign(F.sample(r.track, a.progress + 45).curvature) || a.brain.side;
      o.inside =
        o.inside * 0.85 + clamp((front.lateral * bend) / 3, -1, 1) * 0.15;
      o.wasBraking = !!front.braking;
      o.lastSeen = r.time;
    },
    change(r, a, stage, side = 0, duration = 1) {
      const b = a.skills.battle;
      if (b.stage === stage) return;
      b.stage = stage;
      b.side = side;
      b.until = r.time + duration;
      if (
        r.time - b.lastMessage > 12 &&
        ["feint", "switchback", "commit", "defend"].includes(stage)
      ) {
        b.lastMessage = r.time;
        R.event(
          r,
          "racecraft",
          `${a.name}: ${stages[stage].toLowerCase()}.`,
          [a.carId, ...(b.targetId ? [b.targetId] : [])],
          a.progress,
        );
      }
    },
    plan(r, a, c, cars) {
      const b = a.skills.battle,
        p = a.directive.plan,
        front = c.front,
        skill =
          (a.stats.overtake * 0.45 +
            a.stats.control * 0.2 +
            a.stats.focus * 0.2 +
            Math.min(20, a.brain.experience) * 0.75) /
          100;
      if (r.time < b.nextThink) return;
      b.nextThink = r.time + 0.22 + (100 - a.stats.focus) * 0.006;
      E.observe(r, a, c);
      if (c.yellow || r.safety.active || a.pit.phase !== "none" || a.incident) {
        b.stage = "observe";
        b.targetId = null;
        return;
      }
      if (["clean", "follow"].includes(p.tactic)) {
        b.stage = p.tactic === "follow" ? "tow" : "observe";
        b.targetId = front?.b.carId || null;
        return;
      }
      const rear = c.rear;
      if (
        rear &&
        rear.gap < 10 + a.stats.defense * 0.2 &&
        (p.tactic === "defend" || !front || front.gap > 30)
      ) {
        if (
          !G.RaceDirector.sideBySide(r, a, rear.b) &&
          r.time >= b.defenseUntil
        ) {
          b.defenseUntil = r.time + 5;
          const side =
            Math.sign(F.sample(r.track, a.progress + 45).curvature) ||
            a.brain.side;
          if (b.stage !== "defend" || b.targetId !== rear.b.carId) b.defenses++;
          E.change(r, a, "defend", side, 4);
          b.until = r.time + 4;
          b.targetId = rear.b.carId;
        }
        return;
      }
      if (b.stage === "defend" && r.time < b.until) return;
      const previous = b.targetId && cars.find((o) => o.carId === b.targetId);
      if (
        previous &&
        R.relative(a, previous, G.Data.tracks[r.track].length) < -a.length
      ) {
        E.change(r, a, "recover", 0, 2);
        b.targetId = null;
        return;
      }
      if (b.stage === "recover" && r.time < b.until) return;
      if (!front || front.gap > 55 || a.tires < 22) {
        b.stage = "observe";
        b.targetId = null;
        return;
      }
      if (b.targetId !== front.b.carId) {
        b.targetId = front.b.carId;
        b.stage = "observe";
        b.until = r.time;
      }
      const closing = a.speed - front.b.speed,
        opportunity = clamp(
          (closing + 1) / 5 + (a.stats.brakes - front.b.stats.brakes) / 250,
          0.05,
          0.95,
        ),
        threshold = 0.6 - p.risk * 0.003 - skill * 0.18;
      const bend =
          Math.sign(F.sample(r.track, a.progress + 45).curvature) ||
          a.brain.side,
        observation = b.observations.find((o) => o.id === front.b.carId);
      if (b.stage === "commit" && r.time < b.until) return;
      if (b.stage === "switchback") {
        if (
          F.sample(r.track, a.progress + 45).limit >
            F.sample(r.track, a.progress).limit + 2 ||
          r.time > b.until
        )
          E.change(r, a, "commit", -bend, 3.5);
        return;
      }
      if (b.stage === "feint") {
        if (r.time > b.until) E.change(r, a, "commit", -b.side, 3);
        return;
      }
      if (b.stage === "observe") {
        E.change(r, a, "tow", 0, 0.6 + (1 - skill) * 1.2);
        return;
      }
      if (r.time < b.until) return;
      if (opportunity < threshold || front.gap > 35) {
        b.until = r.time + 0.6;
        return;
      }
      const ownsInside =
        observation?.inside > 0.2 || front.b.lateral * bend > 1;
      if (
        skill > 0.58 &&
        c.corner > 0.32 &&
        ownsInside &&
        front.gap > 8 &&
        p.tactic === "auto"
      )
        E.change(r, a, "switchback", -bend, 4);
      else if (
        skill > 0.65 &&
        front.gap > 12 &&
        front.gap < 30 &&
        c.corner < 0.35 &&
        observation?.samples > 0 &&
        p.tactic === "auto"
      )
        E.change(r, a, "feint", bend, 0.7);
      else
        E.change(
          r,
          a,
          "commit",
          p.tactic === "inside"
            ? bend
            : p.tactic === "outside"
              ? -bend
              : observation?.brakeAhead > 70 &&
                  a.stats.brakes > front.b.stats.brakes
                ? bend
                : -bend,
          2.5 + skill,
        );
    },
    decide(r, a, c, result, cars) {
      if (!r.skillsVersion) return result;
      E.plan(r, a, c, cars);
      const b = a.skills.battle,
        p = a.directive.plan,
        front = c.front,
        room = r.trackWidth / 2 - a.width / 2 - 0.45;
      const free = Math.min(
        a.skills.driverTarget *
          clamp(
            0.93 +
              p.pace * 0.0014 -
              p.fuel * 0.00055 -
              Math.max(0, p.tires - 50) * 0.0003,
            0.87,
            1.07,
          ),
        a.brain.speedCeiling,
      );
      a.skills.planTarget = free;
      if (
        b.stage === "defend" &&
        c.rear &&
        !G.RaceDirector.sideBySide(r, a, c.rear.b)
      ) {
        const lane = b.side * (0.8 + a.stats.defense * 0.015);
        if (E.clearLane(r, a, cars, lane, c.rear.b.carId)) {
          result.lateral = lane;
          a.brain.intent =
            "Defiende una línea y deja espacio al rival emparejado";
        }
      } else if (
        front &&
        b.targetId === front.b.carId &&
        !["clean", "follow"].includes(p.tactic)
      ) {
        const gap = front.gap,
          alongside = G.RaceDirector.sideBySide(r, a, front.b);
        if (["tow", "switchback", "feint"].includes(b.stage) && !alongside) {
          const side =
              b.stage === "feint"
                ? b.side * 0.7
                : b.stage === "switchback"
                  ? b.side * 1.4
                  : 0,
            lane = clamp(front.b.lateral + side, -room, room);
          if (E.clearLane(r, a, cars, lane, front.b.carId))
            result.lateral = lane;
          result.passing = false;
          a.brain.commitUntil = r.time;
          a.brain.targetCar = null;
          result.target = Math.min(
            free,
            Math.max(6, front.b.speed + (gap - (8 + a.speed * 0.14)) * 0.2),
          );
          a.brain.intent =
            b.stage === "switchback"
              ? "Deja cerrar el interior y prepara una salida más abierta"
              : b.stage === "feint"
                ? "Amaga antes de comprometerse, sin cerrar a otro coche"
                : "Prepara el rebufo y estudia dónde frena el rival";
        } else if (b.stage === "commit") {
          const lane =
            front.b.lateral + b.side * ((a.width + front.b.width) / 2 + 0.7);
          if (!c.yellow && E.clearLane(r, a, cars, lane, front.b.carId)) {
            result.lateral = lane;
            result.passing = true;
            result.target = free;
            a.brain.passLane = lane;
            a.brain.lane = lane;
            a.brain.targetCar = front.b.carId;
            a.brain.commitUntil = b.until;
            a.brain.tactic = "pass";
            a.brain.intent = `Completa el adelantamiento por ${b.side === (Math.sign(F.sample(r.track, a.progress + 35).curvature) || a.brain.side) ? "dentro" : "fuera"}`;
          } else {
            result.passing = false;
            result.target = Math.min(result.target, front.b.speed);
            a.brain.intent = "El carril está ocupado: mantiene distancia";
          }
        }
      }
      result.lateral = clamp(result.lateral, -room, room);
      if (
        a.skills.execution.kind === "lateBrake" &&
        a.skills.execution.until > r.time &&
        !c.yellow
      ) {
        result.lateral = clamp(
          result.lateral -
            Math.sign(F.sample(r.track, a.progress).curvature) *
              (0.25 + (100 - a.stats.control) * 0.006),
          -room,
          room,
        );
      }
      result.target = Math.min(
        result.target,
        a.skills.envelope.driver,
        (a.top / 3.6) * (1.01 + a.stats.pace / 1000),
      );
      a.skills.trafficTarget = result.target;
      return result;
    },
    motion(r, a, target, brakes, accel, corner, yellow) {
      const t = a.skills,
        e = t.execution,
        env = t.envelope,
        now = F.sample(r.track, a.progress),
        next = F.sample(r.track, a.progress + 45),
        plan = a.directive.plan;
      t.phase =
        next.limit < now.limit - 2
          ? "entry"
          : next.limit > now.limit + 2
            ? "exit"
            : corner > 0.3
              ? "apex"
              : "straight";
      let throttle = t.phase === "exit" ? 0.58 + a.stats.control * 0.0042 : 1,
        brake = brakes;
      if (!yellow && !a.incident && a.pit.phase === "none") {
        if (r.time >= e.nextAttempt) {
          e.nextAttempt = r.time + 0.55;
          const execution =
            (a.stats.brakes * 0.35 +
              a.stats.control * 0.3 +
              a.stats.focus * 0.2 +
              a.stats.discipline * 0.15) /
            100;
          const risk =
            (0.4 + plan.risk / 100) *
            (1 + a.fatigue / 140) *
            (1 + (a.professional?.driverStress || 0) / 200);
          const requested = clamp(
            (a.speed - target) / Math.max(0.1, brakes * 0.65),
            0,
            2,
          );
          if (
            r.time > e.cooldown &&
            a.speed > 12 &&
            target < a.speed - 2 &&
            env.cornerDistance > 0 &&
            env.cornerDistance < 150 &&
            G.random(t) < (1 - execution) * risk * 0.1
          ) {
            e.delayUntil = r.time + 0.1 + (1 - execution) * 0.25;
          }
          if (
            r.time > e.cooldown &&
            requested > 0.8 &&
            corner > 0.25 &&
            G.random(t) < (1 - execution) * risk * 0.075
          ) {
            E.error(
              r,
              a,
              "lock",
              `bloquea una rueda al combinar frenada fuerte y giro`,
            );
          } else if (
            r.time > e.cooldown &&
            t.phase === "exit" &&
            a.speed > 5 &&
            target > a.speed + 0.4 &&
            accel > 1 &&
            plan.pace > 55 &&
            corner > 0.25 &&
            G.random(t) < (1 - a.stats.control / 100) * risk * 0.08
          ) {
            E.error(
              r,
              a,
              "wheelspin",
              `acelera demasiado pronto con el volante girado`,
            );
          }
        }
        if (r.time < e.delayUntil && a.speed > target + 1) {
          brake = 0;
          e.delayed = true;
        }
        if (e.delayed && r.time >= e.delayUntil) {
          e.delayed = false;
          if (a.speed > target + 1 && env.cornerDistance < 100)
            E.error(
              r,
              a,
              "lateBrake",
              `pierde la referencia de frenada y debe corregir la entrada`,
            );
        }
      }
      if (e.until > r.time) {
        if (e.kind === "wheelspin") throttle *= 0.45;
        if (e.kind === "lock") {
          brake *= 0.7;
          throttle *= 0.8;
          if (t.phase !== "straight")
            target = Math.min(target, env.apex * 0.93);
        }
        if (e.kind === "lateBrake") {
          throttle *= 0.65;
          if (t.phase !== "straight")
            target = Math.min(target, Math.max(6, env.apex * 0.88));
        }
      }
      t.rotation = 0;
      if (
        t.phase === "exit" &&
        a.speed > 8 &&
        target > a.speed + 0.5 &&
        a.stats.control >= 78 &&
        plan.pace >= 55 &&
        plan.risk >= 35 &&
        plan.risk <= 80 &&
        a.tires > 40 &&
        r.weather.wetness < 0.3 &&
        env.grip > 0.75 &&
        !a.incident &&
        !yellow
      ) {
        t.rotation =
          Math.sign(now.curvature) * (0.035 + (a.stats.control - 78) * 0.0018);
        if (!t.rotating) {
          t.analysis.rotations++;
          t.rotating = true;
        }
      } else t.rotating = false;
      if (
        a.speed > env.physical * 1.1 &&
        corner > 0.45 &&
        !yellow &&
        !a.incident &&
        r.time > e.cooldown
      ) {
        E.error(r, a, "lateBrake", "entra por encima del agarre disponible");
        R.loseControl(r, a, corner);
      }
      t.motionTarget = target;
      return { target, brakes: brake, accel: accel * clamp(throttle, 0.2, 1) };
    },
    error(r, a, kind, description) {
      const e = a.skills.execution;
      e.kind = kind;
      e.until = r.time + (kind === "lateBrake" ? 1.4 : 1.1);
      e.cooldown = r.time + 9;
      e.delayUntil = 0;
      e.delayed = false;
      a.skills.analysis.errors[kind]++;
      if (kind === "lock") {
        a.tires = Math.max(0, a.tires - 0.28);
        a.components.tires = a.tires;
      }
      R.event(
        r,
        "execution",
        `${a.name} ${description}.`,
        [a.carId],
        a.progress,
      );
    },
    advance(r, a, distance, dt) {
      const t = a.skills,
        delta = a.lateral - t.beforeLateral,
        p = F.sample(r.track, a.progress);
      t.pathScale = E.pathScale(p.curvature, (a.lateral + t.beforeLateral) / 2);
      const advanced =
        Math.sqrt(Math.max(0, distance * distance - delta * delta)) /
        t.pathScale;
      t.lastAdvance = advanced;
      return advanced;
    },
    after(r, a, distance, dt) {
      const t = a.skills;
      if (!t || a.dnf || a.finishTime !== null) return;
      if (!a.incident && t.rotation) a.headingSlip += t.rotation;
      if (t.execution.until > r.time && t.execution.kind === "wheelspin") {
        a.headingSlip += Math.sin(r.time * 12) * 0.035;
        a.tires = Math.max(0, a.tires - dt * 0.08);
        a.components.tires = a.tires;
      }
      if (t.rotation) {
        a.tires = Math.max(0, a.tires - dt * 0.015);
        a.components.tires = a.tires;
      }
      const analysis = t.analysis;
      analysis.distance += distance;
      analysis.activeTime += dt;
      const neutral =
        R.underYellow(r, a) || r.safety.active || a.pit.phase !== "none";
      if (neutral) {
        t.referenceSpeed = a.speed;
        t.current = {
          cause: "neutral",
          detail:
            a.pit.phase !== "none"
              ? "Entrada o servicio de boxes"
              : "Bandera: ritmo limitado por dirección de carrera",
          reference: a.speed,
          actual: a.speed,
          rate: 0,
        };
        return;
      }
      // Equivalent time against this car's healthy, free-running capacity, not against the leader.
      const drive = t.healthyDrive,
        referenceAccel =
          drive.acceleration *
          Math.min(
            6,
            (drive.hp * 500) /
              ((drive.weight + a.fuel * 0.75) * Math.max(t.referenceSpeed, 12)),
          );
      t.referenceSpeed = Math.max(
        0,
        t.referenceSpeed +
          clamp(
            t.reference - t.referenceSpeed,
            -drive.brakes * dt,
            referenceAccel * dt,
          ),
      );
      const reference = Math.max(1, t.referenceSpeed),
        car = Math.min(reference, t.carCapacity || reference),
        tires = Math.min(car, t.envelope.physical),
        driver = Math.min(tires, t.planTarget),
        traffic = Math.min(driver, t.trafficTarget || driver);
      const weights = {
        car: Math.max(0, reference - car),
        tires: Math.max(0, car - tires),
        driving: Math.max(0, tires - driver),
        traffic: Math.max(0, driver - traffic),
      };
      if (t.execution.until > r.time)
        weights.driving += Math.max(1, reference - a.speed);
      const sum = Object.values(weights).reduce((n, v) => n + v, 0),
        loss = dt * clamp(1 - a.speed / reference, 0, 1);
      if (sum > 0)
        for (const key of Object.keys(weights))
          analysis.losses[key] += (loss * weights[key]) / sum;
      else if (loss > 0) {
        weights.car = loss;
        analysis.losses.car += loss;
      }
      const cause = Object.keys(weights).sort(
        (a, b) => weights[b] - weights[a],
      )[0];
      const detail =
        loss < 0.0001
          ? "Mantiene el ritmo disponible"
          : cause === "car"
            ? a.performance.brakeHeat > 155
              ? "Los frenos calientes pierden eficacia"
              : Math.min(a.components.engine, a.components.transmission) < 65
                ? "Motor o transmisión limitan la entrega"
                : "Desgaste mecánico limita el rendimiento"
            : cause === "tires"
              ? a.tires < 40
                ? "Neumáticos gastados reducen el agarre"
                : "El compuesto y la pista limitan el agarre"
              : cause === "traffic"
                ? a.brain.intent
                : t.execution.until > r.time
                  ? {
                      lateBrake: "Corrige una frenada tardía",
                      lock: "Recupera adherencia tras bloquear",
                      wheelspin: "Modula el acelerador tras patinar",
                    }[t.execution.kind]
                  : a.directive.plan.fuel > 60
                    ? "Levanta antes para ahorrar combustible"
                    : a.directive.plan.tires > 75
                      ? "Cuida las gomas por orden del muro"
                      : t.phase === "entry"
                        ? `Frena con el margen de Control ${Math.round(a.stats.control)} y Frenada ${Math.round(a.stats.brakes)}`
                        : t.phase === "exit"
                          ? "Dosifica el acelerador al salir de la curva"
                          : "El ritmo del piloto y la orden aplicada fijan el margen";
      t.current = {
        cause: loss < 0.0001 ? "free" : cause,
        detail,
        reference,
        actual: a.speed,
        rate: loss / dt,
      };
      if (r.time >= t.nextSample) {
        t.nextSample = r.time + 1;
        analysis.samples.push({
          time: r.time,
          speed: a.speed * 3.6,
          reference: reference * 3.6,
          cause: t.current.cause,
        });
        if (analysis.samples.length > 60) analysis.samples.shift();
      }
    },
    validate(s) {
      if (s.raceSkills === undefined) {
        G.assert(
          s.race?.skillsVersion === undefined,
          "La carrera necesita su versión de conducción.",
        );
        return;
      }
      const root = s.raceSkills,
        num = (v, min = 0, max = 1e8) =>
          Number.isFinite(v) && v >= min && v <= max;
      G.assert(
        E.enabled(s) &&
          Number.isInteger(root.since) &&
          root.since >= 0 &&
          root.since <= s.day &&
          Array.isArray(root.reports) &&
          root.reports.length <= 12,
        "Gestión de conducción inválida.",
      );
      const checkAnalysis = (x) =>
        x &&
        Object.keys(categories).every((k) => num(x.losses?.[k])) &&
        num(x.activeTime) &&
        Object.values(x.losses).reduce((n, v) => n + v, 0) <=
          x.activeTime + 0.00001 &&
        num(x.distance) &&
        num(x.rotations) &&
        ["lateBrake", "lock", "wheelspin"].every(
          (k) => Number.isInteger(x.errors?.[k]) && num(x.errors[k]),
        ) &&
        Array.isArray(x.samples) &&
        x.samples.length <= 60 &&
        x.samples.every(
          (p) =>
            num(p.time) &&
            num(p.speed, 0, 600) &&
            num(p.reference, 0, 600) &&
            [...Object.keys(categories), "free", "neutral"].includes(p.cause),
        );
      for (const report of root.reports)
        G.assert(
          s.drivers.some((d) => d.id === report.driverId) &&
            s.cars.some((c) => c.id === report.carId) &&
            typeof report.eventId === "string" &&
            Number.isInteger(report.day) &&
            report.day >= 0 &&
            report.day <= s.day &&
            Number.isInteger(report.defenses) &&
            num(report.defenses) &&
            checkAnalysis(report.analysis),
          "Informe de conducción inválido.",
        );
      if (s.race?.skillsVersion === undefined) return;
      G.assert(
        s.race.skillsVersion === 1 && s.race.directorVersion === 1,
        "Versión de trazadas inválida.",
      );
      for (const a of s.race.entrants) {
        const t = a.skills,
          b = t?.battle,
          e = t?.execution;
        G.assert(
          t &&
            [
              t.beforeSpeed,
              t.driverTarget,
              t.planTarget,
              t.trafficTarget,
              t.reference,
              t.referenceSpeed,
              t.carCapacity,
            ].every((v) => num(v, 0, 150)) &&
            num(t.beforeProgress, -100, 1e8) &&
            num(t.beforeLateral, -15, 15) &&
            num(t.plannedLane, -15, 15) &&
            num(t.nextSample, 0, s.race.time + 1.01) &&
            typeof t.rotating === "boolean",
          "Referencias de ritmo inválidas.",
        );
        G.assert(
          !t.reference ||
            (t.healthyDrive &&
              num(t.healthyDrive.acceleration, 0, 20) &&
              num(t.healthyDrive.hp, 1, 5000) &&
              num(t.healthyDrive.weight, 100, 10000) &&
              num(t.healthyDrive.brakes, 0.01, 100)),
          "Referencia del coche sano inválida.",
        );
        G.assert(
          t &&
            Number.isInteger(t.rng) &&
            num(t.rng, 0, 4294967295) &&
            checkAnalysis(t.analysis) &&
            Object.hasOwn(stages, b?.stage) &&
            [b.nextThink, b.until, b.defenseUntil, b.lastMessage].every((v) =>
              num(v, -100, 1e8),
            ) &&
            [-1, 0, 1].includes(b.side) &&
            Number.isInteger(b.defenses) &&
            num(b.defenses) &&
            Array.isArray(b.observations) &&
            b.observations.length <= 6,
          "Planificación del piloto inválida.",
        );
        G.assert(
          (b.targetId === null ||
            s.race.entrants.some((o) => o.carId === b.targetId)) &&
            b.observations.every(
              (o) =>
                s.race.entrants.some((c) => c.carId === o.id) &&
                Number.isInteger(o.samples) &&
                num(o.samples) &&
                num(o.brakeAhead, 0, 250) &&
                num(o.inside, -1, 1) &&
                typeof o.wasBraking === "boolean" &&
                num(o.lastSeen, 0, s.race.time),
            ),
          "Memoria del rival inválida.",
        );
        G.assert(
          e &&
            ["none", "lateBrake", "lock", "wheelspin"].includes(e.kind) &&
            [e.until, e.cooldown, e.delayUntil, e.nextAttempt].every((v) =>
              num(v),
            ) &&
            typeof e.delayed === "boolean" &&
            num(t.rotation, -0.1, 0.1) &&
            num(t.pathScale, 0.82, 1.2) &&
            num(t.lastAdvance) &&
            ["entry", "apex", "exit", "straight"].includes(t.phase),
          "Ejecución del piloto inválida.",
        );
        G.assert(
          t.envelope &&
            [t.envelope.physical, t.envelope.driver, t.envelope.apex].every(
              (v) => num(v, 0, 150),
            ) &&
            num(t.envelope.cornerDistance, 0, 360) &&
            num(t.envelope.turn, -2, 2) &&
            num(t.envelope.grip, 0, 2),
          "Límite de curva inválido.",
        );
        G.assert(
          t.current &&
            [...Object.keys(categories), "free", "neutral"].includes(
              t.current.cause,
            ) &&
            typeof t.current.detail === "string" &&
            t.current.detail.length < 300 &&
            [t.current.reference, t.current.actual].every((v) =>
              num(v, 0, 150),
            ) &&
            num(t.current.rate, 0, 1),
          "Telemetría explicada inválida.",
        );
      }
    },
  });
  const create = G.createGame;
  G.createV140Game = create;
  G.createGame = function (...args) {
    const s = create(...args);
    E.initialize(s);
    return s;
  };
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (E.enabled(s) && r.directorVersion) {
      r.skillsVersion = 1;
      for (const a of r.entrants) {
        a.skills = {
          rng: G.AuctionContent.hash(
            `${s.seed}/${r.eventId}/${a.driverId}/execution`,
          ),
          beforeSpeed: 0,
          referenceSpeed: 0,
          planTarget: 0,
          beforeProgress: a.progress,
          beforeLateral: a.lateral,
          plannedLane: a.lateral,
          driverTarget: 0,
          trafficTarget: 0,
          reference: 0,
          carCapacity: 0,
          rotation: 0,
          rotating: false,
          pathScale: 1,
          lastAdvance: 0,
          nextSample: 0,
          phase: "straight",
          envelope: {
            physical: 75,
            driver: 75,
            apex: 75,
            cornerDistance: 0,
            turn: 0,
            grip: 1,
          },
          current: {
            cause: "free",
            detail: "Prepara la salida",
            reference: 0,
            actual: 0,
            rate: 0,
          },
          battle: {
            stage: "observe",
            targetId: null,
            side: 0,
            nextThink: 0,
            until: 0,
            defenseUntil: 0,
            lastMessage: -100,
            defenses: 0,
            observations: [],
          },
          execution: {
            kind: "none",
            until: 0,
            cooldown: 0,
            delayUntil: 0,
            nextAttempt: 0,
            delayed: false,
          },
          analysis: {
            losses: { driving: 0, car: 0, tires: 0, traffic: 0 },
            activeTime: 0,
            distance: 0,
            rotations: 0,
            errors: { lateBrake: 0, lock: 0, wheelspin: 0 },
            samples: [],
          },
        };
      }
    }
    return r;
  };
  const corner = G.RaceLife.cornerFactor;
  G.RaceLife.cornerFactor = function (a) {
    return a.skills
      ? E.controlFactor(a.stats.control, a.fatigue)
      : corner.call(this, a);
  };
  const safe = G.Driving.safeSpeed;
  G.Driving.safeSpeed = function (r, a, brakes) {
    return r.skillsVersion
      ? E.envelope(r, a, brakes).driver
      : safe.call(this, r, a, brakes);
  };
  const decide = F.decide;
  F.decide = function (r, a, cars, c) {
    return E.decide(r, a, c, decide.call(this, r, a, cars, c), cars);
  };
  const moved = F.moved;
  F.moved = function (r, a, distance, dt) {
    const result = moved.call(this, r, a, distance, dt);
    if (r.skillsVersion) E.after(r, a, distance, dt);
    return result;
  };
  const finish = R.finish;
  R.finish = function (s, ...args) {
    const r = s.race,
      result = finish.call(this, s, ...args);
    if (E.enabled(s) && r?.skillsVersion && r.finished) {
      const a = r.entrants.find((a) => a.companyId === s.playerId);
      if (a && !s.raceSkills.reports.some((x) => x.eventId === r.eventId)) {
        s.raceSkills.reports.unshift({
          eventId: r.eventId,
          driverId: a.driverId,
          carId: a.carId,
          day: s.day,
          analysis: G.clone(a.skills.analysis),
          defenses: a.skills.battle.defenses,
        });
        s.raceSkills.reports.length = Math.min(12, s.raceSkills.reports.length);
      }
    }
    return result;
  };
})();
