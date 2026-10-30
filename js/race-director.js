"use strict";
(() => {
  const G = RCS,
    R = G.Race,
    L = G.RaceLife,
    F = G.Racecraft,
    clamp = G.clamp;
  const tactics = {
    auto: "Leer la carrera",
    inside: "Buscar el interior",
    outside: "Buscar el exterior",
    follow: "Seguir y preparar la salida",
    defend: "Proteger posición",
    clean: "Evitar disputas",
  };
  const presets = {
    balanced: { pace: 50, risk: 45, tires: 50, fuel: 0, tactic: "auto" },
    attack: { pace: 90, risk: 80, tires: 15, fuel: 0, tactic: "auto" },
    save: { pace: 25, risk: 20, tires: 90, fuel: 20, tactic: "clean" },
    fuel: { pace: 35, risk: 30, tires: 60, fuel: 90, tactic: "follow" },
    defend: { pace: 55, risk: 55, tires: 40, fuel: 0, tactic: "defend" },
  };
  const D = (G.RaceDirector = {
    tactics,
    presets,
    plan(input = {}) {
      const p = {
        pace: 50,
        risk: 45,
        tires: 50,
        fuel: 0,
        tactic: "auto",
        duration: 60,
        ...input,
      };
      G.assert(
        [p.pace, p.risk, p.tires, p.fuel].every(
          (v) => Number.isInteger(v) && v >= 0 && v <= 100,
        ) &&
          Object.hasOwn(tactics, p.tactic) &&
          [0, 30, 60, 120].includes(p.duration),
        "Ajusta ritmo, riesgo, gomas y combustible entre 0 y 100, elige una maniobra y una duración válida.",
      );
      return Object.fromEntries(
        ["pace", "risk", "tires", "fuel", "tactic", "duration"].map((k) => [
          k,
          p[k],
        ]),
      );
    },
    describe(p) {
      return `Ritmo ${p.pace} · riesgo ${p.risk} · cuidado de gomas ${p.tires} · ahorro ${p.fuel} · ${tactics[p.tactic].toLowerCase()}`;
    },
    order(s, input) {
      G.assert(
        s.race?.directorVersion === 1,
        "Las órdenes combinadas se habilitan en la próxima carrera. Esta carrera guardada conserva sus órdenes anteriores.",
      );
      const preset = typeof input === "string" ? input : null;
      G.assert(
        !preset || Object.hasOwn(presets, preset),
        "Plan de radio desconocido.",
      );
      const plan = D.plan(
        preset ? { ...presets[preset], duration: 60 } : input,
      );
      const p = L.order(s, preset || "balanced");
      p.plan = plan;
      p.preset = preset;
      p.text = `Muro: ${preset ? L.modes[preset] : "plan personalizado"}. ${D.describe(plan)}. ${plan.duration ? `Durante ${plan.duration} s de carrera.` : "Hasta que cambies la orden."} Esperando confirmación.`;
      return p;
    },
    blocked(r, a, p) {
      if (!r.directorVersion || !p.plan) return null;
      if (
        (p.plan.pace > 65 ||
          p.plan.risk > 65 ||
          ["inside", "outside"].includes(p.plan.tactic)) &&
        (R.underYellow(r, a) || r.safety.active)
      )
        return {
          status: "deferred",
          text: "Hay bandera amarilla o VSC: no puedo atacar ni adelantar. Mantengo el plan anterior y el límite de seguridad; repite con verde.",
        };
      if (p.plan.pace > 75 && (a.tires < 8 || a.components.engine < 20))
        return {
          status: "refused",
          text: "El coche no soporta ese ritmo. Reduce la exigencia o entra en boxes; no aplico un plan que provocaría una avería inmediata.",
        };
      return null;
    },
    apply(r, a, p) {
      a.mode = "balanced";
      a.directive = {
        plan: { ...p.plan },
        preset: p.preset,
        until: p.plan.duration ? r.time + p.plan.duration : 1e8,
        manual: true,
      };
      if (a.professional) a.professional.manualUntil = a.directive.until;
      return `Recibido. ${D.describe(p.plan)}. ${p.plan.duration ? `Lo mantengo ${p.plan.duration} s de carrera.` : "Lo mantengo hasta que cambies el plan."} ${p.plan.risk > 70 && a.stats.overtake < 35 ? "Mi adelantamiento es bajo: podré intentarlo, pero no garantizar el hueco." : p.plan.fuel > 60 ? "Levantaré antes de frenar para reducir el consumo." : p.plan.tires > 70 ? "Evitaré castigar las gomas al entrar y salir de curva." : "Actuaré cuando haya espacio real."}`;
    },
    aiPlan(r, a, front, rear) {
      const m = a.brain.mind;
      if (r.time < m.nextMode && a.directive && !a.directive.manual) return;
      m.nextMode = r.time + 2.5 + (100 - a.stats.focus) * 0.025;
      const total = G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps,
        left = (total - a.progress) / G.Data.tracks[r.track].length;
      const attr = a.stats,
        experience = Math.min(20, a.brain.experience),
        awareness = clamp(
          (attr.focus + attr.consistency) / 250 + experience * 0.012,
          0.1,
          0.95,
        );
      const temperament = G.Data.traits[a.trait].risk,
        stressed = (a.professional?.driverStress || 0) / 100;
      const grip = G.RaceWeekend.grip(r, a),
        resourceRisk = a.tires < 30 || a.components.engine < 40 || grip < 0.55;
      const perceived = front
        ? front.gap + (G.random(m) - 0.5) * (1 - awareness) * 12
        : 100;
      const closing = front ? a.speed - front.b.speed : 0;
      const chance = clamp(
        (attr.overtake * 0.48 +
          attr.control * 0.28 +
          attr.brakes * 0.14 +
          attr.focus * 0.1) /
          100 +
          (closing > 1 ? 0.1 : 0) -
          (r.weather.wetness * (100 - attr.weather)) / 180 -
          0.12 * stressed,
        0.02,
        0.95,
      );
      let pace = resourceRisk ? 27 : 49,
        risk = clamp(
          25 +
            attr.overtake * 0.25 +
            (temperament - 1) * 50 -
            attr.discipline * 0.1,
          10,
          80,
        ),
        tactic = "auto",
        tires = resourceRisk ? 85 : 50;
      const fighting =
        front && perceived < 38 && perceived > 3 && closing > -0.8;
      if (fighting && !resourceRisk && G.random(m) < chance) {
        pace = 70 + Math.round(chance * 18);
        tactic =
          attr.overtake > 55
            ? Math.sign(F.sample(r.track, a.progress + 40).curvature) ===
              a.brain.side
              ? "inside"
              : "outside"
            : "auto";
        risk += 12;
      } else if (front && front.gap < 30) {
        tactic = "follow";
        pace = 51;
      }
      if (
        rear &&
        rear.gap < 17 &&
        attr.defense + attr.focus * 0.3 > 45 &&
        !resourceRisk
      ) {
        tactic = "defend";
        pace = Math.max(pace, 58);
      }
      if (
        left < 1.2 &&
        a.tires > 35 &&
        !resourceRisk &&
        front &&
        front.gap < 45
      ) {
        pace += 8;
        risk += 7;
      }
      if (r.weather.wetness > 0.6 && attr.weather < 40) {
        pace -= 8;
        risk -= 12;
        tactic = "clean";
      }
      if (attr.discipline > 70 && chance < 0.35 && fighting) tactic = "follow";
      a.directive = {
        plan: D.plan({
          pace: Math.round(clamp(pace, 10, 95)),
          risk: Math.round(clamp(risk, 5, 95)),
          tires,
          fuel: a.fuel < 0.45 ? 85 : 0,
          tactic,
          duration: 0,
        }),
        preset: null,
        until: 1e8,
        manual: false,
      };
      m.mode = "balanced";
    },
    expire(r, a) {
      if (a.directive.manual && r.time >= a.directive.until) {
        a.directive = {
          plan: D.plan(presets.balanced),
          preset: "balanced",
          until: 1e8,
          manual: false,
        };
        L.say(
          r,
          a,
          "he completado la duración de la orden. Vuelvo al plan equilibrado; el estratega puede retomar el control.",
        );
      }
    },
    decide(r, a, c, result, cars) {
      if (!r.directorVersion) return result;
      D.expire(r, a);
      a.mode = "balanced";
      const p = a.directive.plan,
        b = a.brain,
        f = c.front;
      result.target *= clamp(
        0.93 +
          p.pace * 0.0014 -
          p.fuel * 0.00055 -
          Math.max(0, p.tires - 50) * 0.0003,
        0.87,
        1.07,
      );
      if (c.yellow || r.safety.active) {
        result.passing = false;
        b.passing = false;
      } else if (f && f.gap < 48) {
        const discipline = a.stats.discipline / 100,
          judgment =
            (a.stats.overtake * 0.45 +
              a.stats.focus * 0.25 +
              a.stats.control * 0.2 +
              Math.min(20, b.experience) * 0.5) /
            100;
        const closing = a.speed - f.b.speed,
          opportunity = clamp(
            (closing + 1) / 5 + (a.stats.brakes - f.b.stats.brakes) / 250,
            0.05,
            0.95,
          );
        const required = 0.68 - p.risk * 0.004 - judgment * 0.18;
        const hold =
          p.tactic === "follow" ||
          p.tactic === "clean" ||
          opportunity < required;
        if (hold && !D.sideBySide(r, a, f.b)) {
          result.passing = false;
          b.passing = false;
          b.commitUntil = r.time;
          b.targetCar = null;
          b.tactic = "wait";
          result.lateral = p.tactic === "follow" ? f.b.lateral : F.line(r, a);
          b.lane = result.lateral;
          result.target = Math.min(
            result.target,
            Math.max(6, f.b.speed + (f.gap - 10 - a.speed * 0.16) * 0.25),
          );
          b.intent =
            p.tactic === "clean"
              ? "Deja espacio y evita la disputa"
              : opportunity < required
                ? "Espera: la diferencia de velocidad no justifica arriesgar"
                : "Sigue al rival y prepara una mejor salida";
        } else if (
          result.passing &&
          ["inside", "outside"].includes(p.tactic) &&
          !D.sideBySide(r, a, f.b)
        ) {
          const bend =
              Math.sign(F.sample(r.track, a.progress + 40).curvature) || b.side,
            side = p.tactic === "inside" ? bend : -bend;
          const lane = f.b.lateral + side * ((a.width + f.b.width) / 2 + 0.7),
            room = r.trackWidth / 2 - a.width / 2 - 0.45;
          const clear =
            Math.abs(lane) <= room &&
            cars.every(
              (o) =>
                o.carId === a.carId ||
                o.carId === f.b.carId ||
                Math.abs(
                  R.relative(a, o, G.Data.tracks[r.track].length) +
                    (o.speed - a.speed) * 1.1,
                ) >
                  a.length + 4 ||
                Math.abs(lane - o.lateral) > a.width + 0.5,
            );
          if (clear) {
            result.lateral = lane;
            b.lane = lane;
            b.passLane = lane;
            b.intent = `Busca el ${p.tactic === "inside" ? "interior" : "exterior"} cuando se abre el hueco`;
          } else {
            b.intent = "El lado pedido está ocupado: espera espacio";
            result.passing = false;
            b.passing = false;
            b.commitUntil = r.time;
            b.targetCar = null;
            b.tactic = "wait";
            result.lateral = a.lateral;
            b.lane = a.lateral;
            result.target = Math.min(result.target, f.b.speed);
          }
        }
        // A disciplined novice can wait; a rash novice is more likely to accept a poor margin.
        if (result.passing && discipline > 0.7 && f.gap < 4 && closing > 4)
          result.target = Math.min(result.target, f.b.speed + 1);
      }
      if (
        p.tactic === "defend" &&
        c.rear &&
        c.rear.gap < 24 &&
        !D.sideBySide(r, a, c.rear.b)
      ) {
        const bend =
          Math.sign(F.sample(r.track, a.progress + 35).curvature) || b.side;
        result.lateral = clamp(
          result.lateral +
            (bend * 1.4 - result.lateral) * (a.stats.defense / 150),
          -r.trackWidth * 0.32,
          r.trackWidth * 0.32,
        );
        b.intent = "Protege el interior sin cerrar a un coche emparejado";
      }
      result.target = Math.min(
        result.target,
        b.speedCeiling,
        (a.top / 3.6) * (1.01 + a.stats.pace / 1000),
      );
      result.target *=
        1 +
        Math.sin(
          (a.progress / G.Data.tracks[r.track].length) * Math.PI * 2 + b.seed,
        ) *
          (100 - a.stats.consistency) *
          0.00012;
      result.target = Math.min(
        result.target,
        b.speedCeiling,
        (a.top / 3.6) * (1.01 + a.stats.pace / 1000),
      );
      return result;
    },
    sideBySide(r, a, b) {
      return (
        Math.abs(R.relative(a, b, G.Data.tracks[r.track].length)) <
        Math.max(a.length, b.length) + 1
      );
    },
    wear(a) {
      const p = a.directive?.plan;
      return p
        ? (0.65 + p.pace * 0.007) *
            (1.25 - p.tires * 0.005) *
            (0.85 + p.risk * 0.003)
        : 1;
    },
    fuel(a) {
      const p = a.directive?.plan;
      return p ? (0.84 + p.pace * 0.0032) * (1 - p.fuel * 0.003) : 1;
    },
    validate(s) {
      const r = s.race;
      if (r?.directorVersion === undefined) return;
      G.assert(
        r.directorVersion === 1 && r.lifeVersion === 1,
        "Versión del muro de carrera inválida.",
      );
      for (const a of r.entrants) {
        const d = a.directive;
        G.assert(
          a.brain.mind.strategistMode === undefined ||
            Object.hasOwn(presets, a.brain.mind.strategistMode),
          "Plan del estratega inválido.",
        );
        G.assert(
          d &&
            typeof d.manual === "boolean" &&
            Number.isFinite(d.until) &&
            d.until >= 0 &&
            d.until <= 1e8 &&
            (d.preset === null || Object.hasOwn(presets, d.preset)),
          "Plan aplicado del piloto inválido.",
        );
        D.plan(d.plan);
        for (const p of [a.radio.pending, ...a.radio.history].filter(Boolean))
          if (p.plan) {
            D.plan(p.plan);
            G.assert(
              p.preset === null || presets[p.preset],
              "Plan rápido de radio inválido.",
            );
          }
      }
    },
  });
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (G.DriverAgency.enabled(s) && r.lifeVersion) {
      r.directorVersion = 1;
      for (const a of r.entrants)
        a.directive = {
          plan: D.plan(presets.balanced),
          preset: "balanced",
          until: 1e8,
          manual: false,
        };
    }
    return r;
  };
  const order = R.order;
  R.order = function (s, input) {
    return s.race?.directorVersion
      ? D.order(s, input)
      : order.call(this, s, input);
  };
  const crewDecide = G.PitCrew.decide;
  G.PitCrew.decide = function (s, r) {
    if (!r.directorVersion) return crewDecide.call(this, s, r);
    for (const a of r.entrants) {
      D.expire(r, a);
      if (a.directive.manual && a.professional && r.time < a.directive.until)
        a.professional.manualUntil = Math.max(
          a.professional.manualUntil,
          a.directive.until,
        );
      else if (
        a.professional?.auto &&
        a.professional.strategist &&
        !a.directive.manual
      )
        a.mode = a.brain.mind.strategistMode || "balanced";
    }
    const result = crewDecide.call(this, s, r);
    for (const a of r.entrants) {
      if (
        a.professional?.auto &&
        a.professional.strategist &&
        !a.directive.manual &&
        r.time >= a.professional.manualUntil
      ) {
        a.brain.mind.strategistMode = a.mode;
        a.directive = {
          plan: D.plan({ ...presets[a.mode], duration: 0 }),
          preset: a.mode,
          until: 1e8,
          manual: false,
        };
      }
      a.mode = "balanced";
    }
    return result;
  };
  const ai = L.aiMode;
  L.aiMode = function (r, a, front, rear) {
    if (!r.directorVersion) return ai.call(this, r, a, front, rear);
    D.aiPlan(r, a, front, rear);
    return "balanced";
  };
  const decide = F.decide;
  F.decide = function (r, a, cars, c) {
    const result = decide.call(this, r, a, cars, c);
    return D.decide(r, a, c, result, cars);
  };
  const wear = G.RaceWeekend.wearFactor;
  G.RaceWeekend.wearFactor = function (r, a) {
    return wear.call(this, r, a) * (r.directorVersion ? D.wear(a) : 1);
  };
  const rate = G.Rubber.wearRate;
  G.Rubber.wearRate = function (a, ...args) {
    return rate.call(this, a, ...args) * D.wear(a);
  };
  const moved = F.moved;
  F.moved = function (r, a, ...args) {
    const before = a.fatigue,
      result = moved.call(this, r, a, ...args);
    if (r.directorVersion)
      a.fatigue = clamp(
        before + (a.fatigue - before) * (0.7 + a.directive.plan.pace * 0.006),
        0,
        100,
      );
    return result;
  };
  const error = R.errorRate;
  R.errorRate = function (a, ...args) {
    const p = a.directive?.plan;
    return (
      error.call(this, a, ...args) *
      (p ? (0.4 + p.risk * 0.014) * (1 + Math.max(0, p.pace - 60) * 0.008) : 1)
    );
  };
})();
