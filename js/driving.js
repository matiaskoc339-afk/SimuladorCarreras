"use strict";
(() => {
  const G = RCS,
    F = G.Racecraft,
    R = G.Race,
    cache = new Map(),
    nativeSample = F.sample,
    wrapAngle = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  F.sample = function (index, distance) {
    if (!G.Data.tracks[index].modern)
      return nativeSample.call(this, index, distance);
    const length = G.Data.tracks[index].length;
    if (!cache.has(index)) {
      const n = Math.ceil(length / 5),
        step = length / n;
      cache.set(index, {
        step,
        points: Array.from({ length: n }, (_, i) =>
          nativeSample.call(this, index, i * step),
        ),
      });
    }
    const c = cache.get(index),
      v = (((distance % length) + length) % length) / c.step,
      i = Math.floor(v),
      t = v - i,
      a = c.points[i],
      b = c.points[(i + 1) % c.points.length];
    return {
      ...a,
      angle: a.angle + wrapAngle(b.angle - a.angle) * t,
      limit: a.limit + (b.limit - a.limit) * t,
      curvature: a.curvature + (b.curvature - a.curvature) * t,
    };
  };
  const D = (G.Driving = {
    safeSpeed(r, a, brakes) {
      const reaction = F.effect(a).reaction,
        grip = G.RaceWeekend.grip(r, a),
        quality =
          (0.78 + G.Performance.grip(a) / 260) *
          (r.lifeVersion
            ? G.RaceLife.cornerFactor(a)
            : 0.82 + a.stats.control / 300) *
          (0.85 + a.tires * 0.0015) *
          Math.sqrt(grip);
      let limit = 75;
      for (let look = 0; look <= 414; look += 18) {
        const corner = F.sample(r.track, a.progress + look).limit * quality,
          distance = Math.max(0, look - a.speed * reaction * 0.45);
        limit = Math.min(
          limit,
          Math.sqrt(corner * corner + 2 * brakes * 0.93 * distance),
        );
      }
      a.brain.speedCeiling = limit;
      return limit;
    },
    pitNeed(s, r, a) {
      const t = G.Data.tracks[r.track],
        left = Math.max(0, t.length * t.laps - a.progress),
        rate = G.Rubber.wearRate(a, a.compound, r.weather.wetness),
        fuelRequired =
          left *
          0.00013 *
          (a.hp / 180) *
          (r.directorVersion
            ? G.RaceDirector.fuel(a)
            : a.mode === "save"
              ? 0.9
              : a.mode === "attack"
                ? 1.2
                : 1);
      const layout = G.RaceWeekend.pitLayout(r.track),
        position = ((a.progress % t.length) + t.length) % t.length,
        toEntry = (layout.entry - position + t.length) % t.length,
        lapFuel =
          t.length *
          0.00014 *
          (a.hp / 180) *
          (r.directorVersion ? G.RaceDirector.fuel(a) : 1);
      const fuel =
          a.fuel < fuelRequired + 0.12 &&
          a.fuel < (toEntry / t.length + 1) * lapFuel + 0.16,
        tires =
          a.puncture ||
          (a.tires < 47 && a.tires - rate * left < 12 + a.stats.focus * 0.06);
      const wanted = G.RaceWeekend.bestCompound(r),
        grip = G.RaceWeekend.grip(r, a),
        fresh = G.RaceWeekend.grip(r, {
          ...a,
          compound: wanted,
          tires: 100,
          tyreTemp: 65,
        }),
        p = G.RaceWeekend.pitLayout(r.track),
        crew = a.professional?.mechanic,
        service = crew
          ? 10 * G.PitCrew.serviceFactor(crew, a.professional?.engineer)
          : 43;
      const loss =
          Math.max(
            0,
            (p.exit - p.entry) / p.limit -
              (p.exit - p.entry) / Math.max(15, a.speed),
          ) + service,
        gain =
          (left / Math.max(14, a.speed)) *
          Math.max(0, fresh / Math.max(0.3, grip) - 1) *
          0.7;
      return {
        fuel,
        tires,
        weather:
          a.compound !== wanted &&
          fresh > grip + 0.13 &&
          gain > loss * 1.25 &&
          left > t.length * 0.8,
        compound: wanted,
      };
    },
    contact(r, a, b, impulse, gap, closing) {
      if (!r.competitionVersion || r.cup === "street") return;
      const culprit =
        Math.abs(a.lateralVelocity) > Math.abs(b.lateralVelocity) + 0.5
          ? a
          : Math.abs(b.lateralVelocity) > Math.abs(a.lateralVelocity) + 0.5
            ? b
            : gap > 0
              ? a
              : b;
      if (
        (impulse > 7 || closing > 3.5) &&
        r.time - (culprit.brain.lastPenalty ?? -100) > 20
      ) {
        culprit.brain.lastPenalty = r.time;
        culprit.totalPenalty += 10;
        culprit.unservedPenalty += 10;
        R.event(
          r,
          "penalty",
          `${culprit.name}: 10 segundos por causar una colisión evitable.`,
          [culprit.carId],
          culprit.progress,
        );
      }
    },
    wall(r, a, dt) {
      G.Performance.moved(a, dt);
      if (r.cup !== "street" || a.dnf || a.pit.phase !== "none") return;
      const edge = r.trackWidth / 2 - a.width / 2 - 0.12;
      if (Math.abs(a.lateral) > edge) {
        a.lateral = G.clamp(a.lateral, -edge, edge);
        if (a.speed > 5 && r.time > (a.brain.lastWall ?? -100) + 2.5) {
          a.brain.lastWall = r.time;
          const impulse = G.clamp(
            a.speed * 0.065 + Math.abs(a.lateralVelocity) * 1.4,
            1,
            10,
          );
          R.damageCar(
            a,
            impulse * 1.5,
            impulse * 0.5,
            impulse * 0.14,
            impulse * 0.03,
          );
          a.speed *= 0.72;
          a.tires = Math.max(0, a.tires - impulse * 0.3);
          a.components.tires = a.tires;
          R.event(
            r,
            "wall",
            `${a.name} roza el muro: daños en carrocería y suspensión.`,
            [a.carId],
            a.progress,
          );
        }
      }
    },
  });
  const line = F.line;
  F.line = function (r, a) {
    if (!r.competitionVersion) return line.call(this, r, a);
    const now = F.sample(r.track, a.progress),
      next = F.sample(r.track, a.progress + 40),
      side = Math.sign(next.curvature || now.curvature) || a.brain.side;
    const phase =
        next.limit < now.limit - 2 ? -1 : next.limit > now.limit + 3 ? -0.6 : 1,
      error =
        Math.sin(a.progress * 0.018 + a.brain.seed) *
        (1 - a.stats.control / 110);
    return G.clamp(
      side * phase * (1.05 + a.stats.control * 0.012) + error,
      -r.trackWidth * 0.25,
      r.trackWidth * 0.25,
    );
  };
  const decide = F.decide;
  F.decide = function (r, a, cars, c) {
    if (!r.competitionVersion) return decide.call(this, r, a, cars, c);
    const b = a.brain,
      due = r.time >= b.nextThink,
      result = decide.call(this, r, a, cars, c),
      room = r.trackWidth / 2 - a.width / 2 - 0.45;
    if (due) {
      const previous = b.targetCar && cars.find((o) => o.carId === b.targetCar),
        stillAhead =
          previous &&
          R.relative(a, previous, G.Data.tracks[r.track].length) > -a.length;
      if (r.time < b.commitUntil && stillAhead) {
        result.lateral = b.passLane;
        result.passing = true;
        b.intent = "Mantiene la maniobra sin cambiar de lado";
      } else if (c.preparingPass && c.front && !c.yellow) {
        const spacing = (a.width + c.front.b.width) / 2 + 0.65,
          options = [
            c.front.b.lateral - spacing,
            c.front.b.lateral + spacing,
          ].filter(
            (l) =>
              Math.abs(l) <= room &&
              cars.every(
                (o) =>
                  o.carId === a.carId ||
                  o.carId === c.front.b.carId ||
                  Math.abs(
                    R.relative(a, o, G.Data.tracks[r.track].length) +
                      (o.speed - a.speed) * 1.2,
                  ) >
                    a.length + 4 ||
                  Math.abs(l - o.lateral) > a.width + 0.45,
              ),
          );
        const bend = F.sample(r.track, a.progress + 45).curvature;
        options.sort(
          (x, y) =>
            Math.abs(x - a.lateral) -
            Math.abs(y - a.lateral) +
            (a.stats.overtake / 100) * Math.sign(bend) * (y - x) * 0.35,
        );
        if (options.length) {
          b.targetCar = c.front.b.carId;
          b.passLane = options[0];
          b.commitUntil = r.time + 2.1 + (100 - a.stats.focus) * 0.012;
          b.tactic = "pass";
          result.lateral = b.passLane;
          result.passing = true;
          b.intent =
            c.corner > 0.4
              ? "Prepara un adelantamiento al salir de la curva"
              : "Sale del rebufo y compromete un lado";
        } else {
          b.tactic = "wait";
          result.passing = false;
          result.target = Math.min(result.target, c.front.b.speed);
          b.intent = "Espera un hueco seguro";
        }
      } else if (r.time >= b.commitUntil) {
        b.tactic = "line";
        b.targetCar = null;
      }
      if (
        r.cup === "street" &&
        (r.directorVersion
          ? a.directive.plan.risk > 75 &&
            a.directive.plan.pace > 70 &&
            a.stats.discipline < 30
          : a.mode === "attack") &&
        c.front &&
        c.front.gap > 3 &&
        c.front.gap < 13 &&
        !c.yellow &&
        r.time - b.lastContact > 18 &&
        G.random(r) <
          0.018 *
            (1 + (100 - a.stats.discipline) / 100) *
            G.Data.traits[a.trait].risk
      ) {
        b.lastContact = r.time;
        b.commitUntil = r.time + 2.3;
        b.tactic = "contact";
        b.targetCar = c.front.b.carId;
        b.passLane = c.front.b.lateral;
        b.intent = "Presión callejera: acepta el riesgo de contacto";
      }
    }
    if (r.time < b.commitUntil && b.targetCar) {
      const front = cars.find((o) => o.carId === b.targetCar);
      if (front) {
        result.lateral = b.passLane;
        if (b.tactic === "contact") {
          result.target = Math.min(b.speedCeiling, front.speed + 0.8);
          result.passing = false;
        } else if (b.tactic === "pass") result.passing = true;
      }
    }
    if (
      a.companyId !== G.App?.state?.playerId &&
      a.companyId !== "player" &&
      !a.professional?.auto
    ) {
      const lapsLeft = Math.max(
        0,
        (G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps -
          a.progress) /
          G.Data.tracks[r.track].length,
      );
      if (
        a.tires < 38 &&
        G.Rubber.estimate(a, a.compound, r.track, r.weather.wetness) <
          lapsLeft * 0.7
      )
        a.mode = "save";
    }
    result.lateral = G.clamp(result.lateral, -room, room);
    b.lane = result.lateral;
    return result;
  };
  const moved = F.moved;
  F.moved = function (r, a, ...args) {
    const v = moved.call(this, r, a, ...args);
    if (r.competitionVersion) D.wall(r, a, args[1]);
    return v;
  };
  const error = R.errorRate;
  R.errorRate = function (a, ...args) {
    return error.call(this, a, ...args) * (a.rules === "street" ? 1.3 : 1);
  };
})();
