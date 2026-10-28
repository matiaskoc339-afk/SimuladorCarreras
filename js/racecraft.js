"use strict";
(() => {
  const G = RCS,
    R = G.Race,
    clamp = G.clamp,
    angle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const F = (G.Racecraft = {
    metric(index, distance, lateral = 0) {
      const p = R.point(index, distance),
        before = R.point(index, distance - 1.5),
        after = R.point(index, distance + 1.5),
        scale = R.worldScale(index),
        heading = Math.atan2((after.y - before.y) * 0.66, after.x - before.x);
      return {
        x: p.x * scale - Math.sin(heading) * lateral,
        y: p.y * 0.66 * scale + Math.cos(heading) * lateral,
        angle: heading,
        limit: p.limit,
      };
    },
    sample(index, distance) {
      const p = R.point(index, distance),
        a = this.metric(index, distance - 8),
        b = this.metric(index, distance + 8),
        curvature = angle(b.angle, a.angle) / 16;
      return {
        ...p,
        angle: this.metric(index, distance).angle,
        limit: clamp(
          Math.sqrt(8.0 / Math.max(0.0015, Math.abs(curvature))),
          13,
          68,
        ),
        curvature,
      };
    },
    effect(a) {
      const b = a.brain,
        age = b.age > 36 ? Math.max(0.9, 1 - (b.age - 36) * 0.006) : 1,
        experience = Math.min(18, b.experience);
      return {
        pace: (0.94 + experience * 0.004) * age * (1 - a.fatigue * 0.00045),
        braking: clamp(
          0.57 + a.stats.brakes * 0.006 + experience * 0.007,
          0.56,
          1.26,
        ),
        reaction: clamp(
          1.1 - a.stats.focus * 0.008 - experience * 0.008,
          0.2,
          1.1,
        ),
      };
    },
    line(r, a) {
      const now = this.sample(r.track, a.progress),
        next = this.sample(r.track, a.progress + 55),
        side = Math.sign(next.curvature || now.curvature) || a.brain.side;
      const phase =
        next.limit < now.limit - 3 ? -1 : next.limit > now.limit + 4 ? -0.7 : 1;
      const error =
        Math.sin(a.progress * 0.025 + a.brain.seed) *
        (0.8 - a.stats.control * 0.007);
      return clamp(
        side * phase * (1.1 + Math.min(60, a.stats.control) * 0.012) + error,
        -3.2,
        3.2,
      );
    },
    decide(r, a, cars, c) {
      const b = a.brain;
      if (r.time >= b.nextThink) {
        b.nextThink = r.time + this.effect(a).reaction;
        b.lane = c.lateralTarget;
        b.passing = c.preparingPass;
        b.intent = c.preparingPass
          ? "Busca un hueco"
          : c.rear && c.rear.gap < 18
            ? "Protege la posición"
            : a.tires < 35
              ? "Gestiona neumáticos"
              : "Traza la siguiente curva";
        if (c.preparingPass && c.front) {
          const predicted = c.front.gap + (c.front.b.speed - a.speed) * 0.7;
          const unsafe = cars.some(
            (o) =>
              o.carId !== a.carId &&
              o.carId !== c.front.b.carId &&
              Math.abs(
                R.relative(a, o, G.Data.tracks[r.track].length) +
                  (o.speed - a.speed) * 0.7,
              ) <
                a.length + 2 &&
              Math.abs(o.lateral - b.lane) < a.width + 0.4,
          );
          if (unsafe || (predicted < 1 && a.stats.discipline > 45)) {
            b.lane = a.lateral;
            b.passing = false;
            b.intent = "Espera espacio para pasar";
          }
          if (b.passing && r.time - b.lastRadio > 18 && c.front.gap < 24) {
            b.lastRadio = r.time;
            R.event(
              r,
              "battle",
              `${a.name} estudia el ${b.lane < c.front.b.lateral ? "interior" : "exterior"} de ${c.front.b.name}. Hay lucha por posición.`,
              [a.carId, c.front.b.carId],
              a.progress,
            );
          }
        }
      }
      let target = c.target;
      if (c.preparingPass && !b.passing)
        target = Math.min(target, c.front?.b.speed || target);
      return { target, lateral: b.lane, passing: b.passing };
    },
    moved(r, a, moved, dt) {
      a.fatigue = clamp(
        a.fatigue +
          (moved / G.Data.tracks[r.track].length) *
            (3.8 - a.stats.stamina * 0.025) *
            (a.mode === "attack" ? 1.25 : 1),
        0,
        100,
      );
      if (a.professional)
        a.professional.driverStress = clamp(
          a.professional.driverStress +
            dt * (0.012 - a.stats.teamwork * 0.00015),
          0,
          100,
        );
      if (!a.incident)
        a.headingSlip =
          Math.atan2(a.lateralVelocity, Math.max(6, a.speed)) * 0.6;
    },
    safePlacement(
      index,
      progress,
      w,
      h,
      side = 1,
      offset = 28,
      clearance = 14,
    ) {
      const samples = R.track(index),
        scale = R.worldScale(index),
        pts = samples.map((p) => ({ x: p.x * scale, y: p.y * 0.66 * scale }));
      const segments = pts.map((a, i) => [a, pts[(i + 1) % pts.length]]),
        pit = G.RaceWeekend.pitLayout(index);
      for (let i = 0; i < 48; i++) {
        const at = (t) =>
          this.metric(index, t, G.RaceWeekend.pitLateral(index, t));
        segments.push([
          at(pit.entry + ((pit.exit - pit.entry) * i) / 48),
          at(pit.entry + ((pit.exit - pit.entry) * (i + 1)) / 48),
        ]);
      }
      const distance = (x, y) => {
        let min = Infinity;
        for (const [a, b] of segments) {
          const dx = b.x - a.x,
            dy = b.y - a.y,
            t = clamp(
              ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy),
              0,
              1,
            ),
            sq = (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2;
          if (sq < min) min = sq;
        }
        return min;
      };
      for (const sign of [side, -side])
        for (const extra of [0, 15, 30, 50, 75, 110, 160, 250, 400]) {
          const p = this.metric(index, progress, sign * (offset + extra)),
            co = Math.cos(p.angle),
            si = Math.sin(p.angle);
          let safe = true;
          const nx = Math.ceil(w / 6),
            ny = Math.ceil(h / 5);
          for (let ix = 0; ix <= nx && safe; ix++)
            for (let iy = 0; iy <= ny; iy++) {
              const x = -w / 2 + (w * ix) / nx,
                y = -h / 2 + (h * iy) / ny;
              if (
                distance(p.x + x * co - y * si, p.y + x * si + y * co) <
                clearance * clearance
              ) {
                safe = false;
                break;
              }
            }
          if (safe) return { ...p, side: sign };
        }
      throw Error("No se encuentra una posición segura fuera del trazado.");
    },
    validate(s) {
      const r = s.race;
      if (!r?.dynamicsVersion) return;
      G.assert(r.dynamicsVersion === 1, "Versión de dinámica inválida.");
      for (const a of r.entrants) {
        const b = a.brain;
        G.assert(
          b &&
            [
              b.age,
              b.experience,
              b.nextThink,
              b.lane,
              b.lastRadio,
              b.seed,
            ].every(Number.isFinite) &&
            b.age >= 18 &&
            b.age <= 90 &&
            b.experience >= 0 &&
            Math.abs(b.lane) <= 8 &&
            b.nextThink >= 0 &&
            typeof b.intent === "string" &&
            b.intent.length < 80 &&
            typeof b.passing === "boolean",
          "Lectura de carrera del piloto inválida.",
        );
      }
    },
  });
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (!G.Challenge.enabled(s)) return r;
    r.dynamicsVersion = 1;
    if (r.replay) r.replay.dynamicsVersion = 1;
    for (const a of r.entrants) {
      const d = s.drivers.find((d) => d.id === a.driverId),
        car = s.cars.find((c) => c.id === a.carId),
        model = G.Data.models[car.modelIndex];
      a.modelIndex = car.modelIndex;
      a.width = model.width || a.width;
      a.length = model.length || a.length;
      a.brain = {
        age: d.age,
        experience: d.experience,
        nextThink: 0,
        lane: a.lateral,
        seed: (d.identity || 0) % 1000,
        side: (d.identity || 0) % 2 ? 1 : -1,
        intent: "Prepara la salida",
        passing: false,
        lastRadio: -100,
      };
      const meta = r.replay?.cars.find((c) => c.carId === a.carId);
      if (meta) {
        meta.modelIndex = a.modelIndex;
        meta.width = a.width;
        meta.length = a.length;
      }
    }
    return r;
  };
  const rate = R.errorRate;
  R.errorRate = function (a, corner, pressure) {
    const base = rate.call(this, a, corner, pressure);
    return a.brain
      ? (base *
          0.65 *
          (1.4 - a.stats.focus * 0.008) *
          (1 + Math.max(0, a.brain.age - 36) * 0.01)) /
          (1 + a.brain.experience * 0.015)
      : base;
  };
  const lose = R.loseControl;
  R.loseControl = function (r, a, corner) {
    if (!a.brain) return lose.call(this, r, a, corner);
    if (r.time < a.errorCooldown || a.dnf || a.finishTime !== null) return;
    const spin =
        G.random(r) <
        0.06 + (100 - a.stats.control) * 0.0018 + a.fatigue * 0.001,
      wide = G.random(r) < 0.15 + (100 - a.stats.discipline) * 0.001;
    a.incident = spin ? "spin" : "slide";
    a.incidentStarted = r.time;
    a.incidentUntil =
      r.time + (spin ? 3 + G.random(r) * 3 : 0.8 + G.random(r) * 1.1);
    a.errorCooldown = a.incidentUntil + 10;
    a.slideSide = G.random(r) < 0.5 ? -1 : 1;
    a.offTrack = spin || wide;
    a.tires = Math.max(0, a.tires - (spin ? 4 : 1.5));
    a.components.tires = a.tires;
    if (a.offTrack) {
      R.damageCar(a, spin ? 4 : 1, spin ? 2 : 0.5);
      R.caution(r, a.progress, spin ? 8 : 4);
    }
    R.event(
      r,
      spin ? "spin" : "slide",
      spin
        ? `${a.name} pierde la zaga. Levanta para recuperar el coche.`
        : `${a.name} ${a.braking ? "bloquea al frenar" : "corrige la trazada"} y pierde impulso.`,
      [a.carId],
      a.progress,
    );
  };
  const finish = R.finish;
  R.finish = function (s) {
    const r = s.race,
      result = finish.call(this, s);
    if (r?.dynamicsVersion)
      for (const a of r.entrants) {
        const d = s.drivers.find((d) => d.id === a.driverId);
        if (d) {
          d.fatigue = Math.max(d.fatigue, a.fatigue);
          d.experience += 0.04;
        }
      }
    return result;
  };
})();
