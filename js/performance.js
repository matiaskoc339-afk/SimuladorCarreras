"use strict";
(() => {
  const G = RCS,
    W = G.Workshop,
    R = G.Race;
  const P = (G.Performance = {
    capture(s, c) {
      return {
        base: G.clone(c.base),
        initialComponents: G.clone(c.components),
        parts: Object.values(c.installed).map((id) => {
          const u = s.parts.find((p) => p.id === id),
            d = G.Parts.definition(u.definitionId);
          return {
            id,
            definitionId: d.id,
            component: d.component,
            slot: d.slot,
            effects: G.clone(d.effects),
          };
        }),
        downforce: 0,
        brakeHeat: 35,
        traction: 1,
      };
    },
    refresh(a) {
      const p = a.performance;
      if (!p) return;
      const v = {
        ...p.base,
        stress: 0,
        cooling: 1,
        acceleration: 1,
        tireWear: 1,
        bodyWear: 1,
      };
      p.downforce = 0;
      p.traction = 1;
      for (const part of p.parts) {
        const condition = G.clamp(a.partWear[part.id] / 100, 0, 1),
          integrity = G.clamp(
            a.components[part.component] /
              Math.max(1, p.initialComponents[part.component]),
            0,
            1,
          ),
          quality = condition * integrity;
        for (const [key, n] of Object.entries(part.effects)) {
          const effective =
            n * (["weight", "stress", "bodyWear"].includes(key) ? 1 : quality);
          if (part.slot === "aero" && key === "grip") p.downforce += effective;
          else v[key] = (v[key] || 0) + effective;
        }
        if (part.slot === "differential") p.traction += quality * 0.035;
      }
      for (const key of [
        ...W.attributes,
        "stress",
        "cooling",
        "acceleration",
        "tireWear",
        "bodyWear",
      ])
        a[key] = v[key];
      a.top *= 0.94 + a.components.body * 0.0006;
      a.cooling *= 0.55 + a.components.cooling * 0.0045;
      a.acceleration *= p.traction * (0.8 + a.components.transmission * 0.002);
      a.grip *= 0.88 + a.components.suspension * 0.0012;
      if (a.rules === "street")
        a.grip *= 0.96 + a.components.suspension * 0.0004;
    },
    grip(a) {
      return a.performance
        ? a.grip +
            a.performance.downforce *
              G.clamp((a.speed * a.speed) / 1600, 0.05, 1.5)
        : a.grip;
    },
    brakeFactor(a) {
      return a.performance
        ? G.clamp(
            1 - Math.max(0, a.performance.brakeHeat - 155) * 0.0025,
            0.65,
            1,
          )
        : 1;
    },
    moved(a, dt) {
      if (!a.performance) return;
      const p = a.performance,
        vent =
          1 +
          p.parts
            .filter((x) => x.slot === "brakes")
            .reduce((n, x) => n + ((a.partWear[x.id] || 0) / 100) * 0.4, 0);
      p.brakeHeat = G.clamp(
        p.brakeHeat +
          dt *
            ((a.braking ? a.speed * 0.8 : 0) -
              (p.brakeHeat - 30) * 0.045 * vent),
        25,
        300,
      );
    },
    validate(s) {
      if (!s.race?.competitionVersion) return;
      for (const a of s.race.entrants) {
        const p = a.performance;
        G.assert(
          p &&
            p.base &&
            p.initialComponents &&
            Array.isArray(p.parts) &&
            Number.isFinite(p.brakeHeat) &&
            p.brakeHeat >= 25 &&
            p.brakeHeat <= 300,
          "Especificación física inválida.",
        );
        G.assert(
          W.attributes.every((k) => Number.isFinite(p.base[k])) &&
            Object.keys(G.Parts.components).every(
              (k) =>
                Number.isFinite(p.initialComponents[k]) &&
                p.initialComponents[k] >= 0 &&
                p.initialComponents[k] <= 100,
            ),
          "Base de configuración inválida.",
        );
        for (const part of p.parts) {
          const def = G.Parts.definition(part.definitionId),
            unit = s.parts.find((u) => u.id === part.id);
          G.assert(
            def &&
              unit?.definitionId === part.definitionId &&
              unit.carId === a.carId &&
              a.partWear[part.id] !== undefined &&
              part.component === def.component &&
              part.slot === def.slot &&
              JSON.stringify(part.effects) === JSON.stringify(def.effects),
            "Pieza de carrera sin unidad física.",
          );
        }
      }
    },
  });
  const snapshot = W.raceSnapshot;
  W.raceSnapshot = function (s, c) {
    const v = snapshot.call(this, s, c);
    return G.Competition.enabled(s)
      ? { ...v, performance: P.capture(s, c) }
      : v;
  };
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (r.competitionVersion) for (const a of r.entrants) P.refresh(a);
    return r;
  };
  const damage = R.damageCar;
  R.damageCar = function (a, ...args) {
    const before = { ...a.components };
    const v = damage.call(this, a, ...args);
    if (a.performance) {
      for (const p of a.performance.parts)
        a.partWear[p.id] = Math.max(
          0,
          a.partWear[p.id] -
            Math.max(0, before[p.component] - a.components[p.component]),
        );
      P.refresh(a);
    }
    return v;
  };
  const wear = G.RaceWeekend.wearFactor;
  G.RaceWeekend.wearFactor = function (r, a) {
    return wear.call(this, r, a) * (r.competitionVersion ? 0.45 : 1);
  };
  const rate = G.Rubber.wearRate;
  G.Rubber.wearRate = function (a, ...args) {
    return rate.call(this, a, ...args) * (a.performance || a.modern ? 0.45 : 1);
  };
})();
