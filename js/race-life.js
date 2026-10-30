"use strict";
(() => {
  const G = RCS,
    R = G.Race,
    F = G.Racecraft;
  const modes = {
    attack: "Atacar",
    balanced: "Equilibrado",
    save: "Conservar",
    fuel: "Ahorrar combustible",
    defend: "Defender",
  };
  const L = (G.RaceLife = {
    modes,
    cornerFactor(a) {
      return (
        (0.72 + 0.62 * Math.pow(G.clamp(a.stats.control, 0, 100) / 100, 0.8)) *
        (1 - Math.min(100, a.fatigue) * 0.00035)
      );
    },
    missChance(a) {
      return G.clamp(
        0.025 +
          (100 - a.stats.teamwork) * 0.0011 +
          (100 - a.stats.focus) * 0.00055 +
          (100 - a.stats.discipline) * 0.0004 +
          (a.professional?.driverStress || 0) * 0.0012 +
          Math.max(0, 50 - a.morale) * 0.0007 -
          (a.professional?.strategist?.level || 0) * 0.007,
        0.01,
        0.28,
      );
    },
    say(r, a, text) {
      r.messages.unshift({ time: r.time, text: `${a.name}: ${text}` });
      r.messages.length = Math.min(30, r.messages.length);
    },
    order(s, mode) {
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === s.playerId);
      G.assert(
        modes[mode],
        "Elige una orden del muro: atacar, equilibrado, conservar, ahorrar combustible o defender.",
      );
      G.assert(
        a && !r.finished && !a.dnf && a.finishTime === null,
        "No hay un piloto activo en pista. Las órdenes se habilitan mientras tu coche sigue en carrera.",
      );
      const radio = a.radio;
      G.assert(
        !radio.pending,
        `La orden anterior sigue esperando respuesta (${Math.max(1, Math.ceil((radio.pending?.answerAt || r.time) - r.time))} s de carrera). Deja avanzar la simulación antes de enviar otra.`,
      );
      G.assert(
        r.time >= radio.readyAt,
        `Espera ${Math.max(1, Math.ceil(radio.readyAt - r.time))} s de carrera antes de transmitir de nuevo.`,
      );
      radio.pending = {
        id: ++radio.sequence,
        mode,
        sent: r.time,
        answerAt:
          r.time +
          1.2 +
          (100 - a.stats.focus) / 65 +
          (100 - a.stats.teamwork) / 100,
        status: "pending",
        text: `Muro: ${modes[mode]}. Esperando respuesta del piloto.`,
      };
      if (a.professional)
        a.professional.manualUntil = radio.pending.answerAt + 35;
      L.say(
        r,
        a,
        `recibo una instrucción del muro: ${modes[mode].toLowerCase()}.`,
      );
      return radio.pending;
    },
    radioStep(s, r) {
      for (const a of r.entrants) {
        const radio = a.radio,
          p = radio.pending;
        if (!p) continue;
        if (a.dnf || a.finishTime !== null) {
          p.status = "unavailable";
          p.text =
            "La orden quedó sin aplicar: el coche ya no sigue en carrera.";
        } else if (r.time < p.answerAt) continue;
        else if (
          p.mode === "attack" &&
          (R.underYellow(r, a) || r.safety.active)
        ) {
          p.status = "deferred";
          p.text =
            "No puedo atacar bajo bandera amarilla o VSC. Mantengo el ritmo permitido; vuelve a pedirlo con bandera verde.";
        } else if (
          p.mode === "attack" &&
          (a.tires < 8 || a.components.engine < 20)
        ) {
          p.status = "refused";
          p.text =
            "No puedo exigir más al coche en este estado. Necesito conservar o entrar a boxes para evitar una avería.";
        } else if (G.random(a.brain.mind) < L.missChance(a)) {
          p.status = "missed";
          p.text =
            "No entendí bien la instrucción entre el tráfico. Mantengo el plan anterior; puedes repetir la orden.";
        } else {
          a.mode = p.mode;
          p.status = "accepted";
          p.text = {
            attack:
              "Entendido. Voy a buscar el hueco; gastaré más gomas y asumiré más riesgo.",
            balanced: "Recibido. Mantengo un ritmo equilibrado.",
            save: "Recibido. Levanto antes y cuido coche y neumáticos.",
            fuel: "Entendido. Voy a levantar el acelerador para ahorrar combustible.",
            defend:
              "Recibido. Protegeré el interior cuando el rival se acerque, dejando espacio.",
          }[p.mode];
          if (a.professional) a.professional.manualUntil = r.time + 35;
        }
        p.answered = r.time;
        radio.last = p;
        radio.history.unshift(p);
        radio.history.length = Math.min(12, radio.history.length);
        radio.pending = null;
        radio.readyAt = r.time + 1.5;
        L.say(r, a, p.text);
      }
    },
    aiMode(r, a, front, rear) {
      const m = a.brain.mind;
      if (
        a.tires < 32 ||
        a.components.engine < 45 ||
        (r.weather.wetness > 0.6 && a.stats.weather < 40)
      )
        return "save";
      if (r.time < m.nextMode) return m.mode;
      m.nextMode = r.time + 6 + G.random(m) * 8;
      const aggression = G.clamp(
          0.1 +
            a.stats.overtake * 0.004 +
            (G.Data.traits[a.trait].risk - 1) * 0.8,
          0.12,
          0.8,
        ),
        roll = G.random(m);
      m.mode =
        front && front.gap < 32 && a.tires > 45 && roll < aggression
          ? "attack"
          : rear && rear.gap < 20 && roll < a.stats.defense / 130
            ? "defend"
            : "balanced";
      return m.mode;
    },
    decide(r, a, c, result) {
      const m = a.brain.mind;
      if (r.time >= m.nextMoment) {
        m.nextMoment = r.time + 5 + G.random(m) * 7;
        m.effect = 1;
        m.until = r.time;
        m.intent = "";
        const pressured = !!(
            (c.front && c.front.gap < 24) ||
            (c.rear && c.rear.gap < 18)
          ),
          roll = G.random(m);
        if (
          !c.yellow &&
          c.corner > 0.35 &&
          !a.incident &&
          pressured &&
          roll <
            0.025 +
              (100 - a.stats.control) * 0.00065 +
              (100 - a.stats.consistency) * 0.0005
        ) {
          m.effect = 0.93 + (a.stats.control / 100) * 0.045;
          m.until = r.time + 1.2 + G.random(m) * 1.5;
          m.intent = "Duda en la referencia de frenada";
          if (r.time - m.lastReport > 25) {
            m.lastReport = r.time;
            R.event(
              r,
              "hesitation",
              `${a.name} duda en la entrada de la curva y pierde impulso.`,
              [a.carId],
              a.progress,
            );
          }
        } else if (
          !c.yellow &&
          c.corner > 0.3 &&
          a.stats.control >= 55 &&
          a.stats.focus >= 45 &&
          roll < 0.2 &&
          a.fatigue < 65
        ) {
          m.effect = 1.008 + a.stats.control * 0.0001;
          m.until = r.time + 2.5;
          m.intent = "Enlaza la curva y prepara una buena salida";
          if (c.front && c.front.gap < 25 && r.time - m.lastReport > 30) {
            m.lastReport = r.time;
            R.event(
              r,
              "racecraft",
              `${a.name} enlaza una trazada limpia y presiona a ${c.front.b.name} al salir.`,
              [a.carId, c.front.b.carId],
              a.progress,
            );
          }
        }
      }
      if (r.time < m.until) {
        result.target *= m.effect;
        a.brain.intent = m.intent;
      }
      result.target = Math.min(
        result.target,
        a.brain.speedCeiling,
        (a.top / 3.6) * (1.01 + a.stats.pace / 1000),
      );
      return result;
    },
    validate(s) {
      const r = s.race;
      if (r?.lifeVersion === undefined) return;
      G.assert(
        r.lifeVersion === 1 && r.competitionVersion,
        "Versión de lectura de carrera inválida.",
      );
      for (const a of r.entrants) {
        const m = a.brain.mind,
          radio = a.radio,
          num = (v) => Number.isFinite(v) && Math.abs(v) < 1e9;
        G.assert(
          m &&
            Number.isInteger(m.rng) &&
            m.rng >= 0 &&
            m.rng <= 4294967295 &&
            [m.nextMode, m.nextMoment, m.until, m.lastReport].every(num) &&
            m.effect >= 0.9 &&
            m.effect <= 1.03 &&
            modes[m.mode] &&
            typeof m.intent === "string" &&
            m.intent.length < 80,
          "Decisión del piloto inválida.",
        );
        G.assert(
          radio &&
            Number.isInteger(radio.sequence) &&
            radio.sequence >= 0 &&
            num(radio.readyAt) &&
            Array.isArray(radio.history) &&
            radio.history.length <= 12,
          "Radio del piloto inválida.",
        );
        const history = radio.history;
        G.assert(
          new Set(history.map((p) => p.id)).size === history.length,
          "Respuesta de radio duplicada.",
        );
        for (const p of [...history, ...(radio.pending ? [radio.pending] : [])])
          G.assert(
            Number.isInteger(p.id) &&
              p.id > 0 &&
              p.id <= radio.sequence &&
              modes[p.mode] &&
              num(p.sent) &&
              p.sent >= 0 &&
              p.sent <= r.time &&
              num(p.answerAt) &&
              p.answerAt >= p.sent &&
              p.answerAt <= p.sent + 5 &&
              typeof p.text === "string" &&
              p.text.length < 500 &&
              (p === radio.pending
                ? p.status === "pending" && p.answered === undefined
                : [
                    "accepted",
                    "missed",
                    "deferred",
                    "refused",
                    "unavailable",
                  ].includes(p.status) &&
                  num(p.answered) &&
                  p.answered >= p.sent &&
                  p.answered <= r.time),
            "Orden o respuesta de radio inválida.",
          );
        G.assert(
          radio.last === null
            ? history.length === 0
            : JSON.stringify(radio.last) === JSON.stringify(history[0]),
          "Última respuesta de radio incoherente.",
        );
      }
    },
  });
  const start = R.start;
  R.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (!G.TeamLife.enabled(s) || !r.competitionVersion) return r;
    r.lifeVersion = 1;
    for (const a of r.entrants) {
      a.brain.mind = {
        rng: G.AuctionContent.hash(
          `${s.seed}/${r.eventId}/${a.driverId}/${r.rng}`,
        ),
        nextMode: 0,
        nextMoment: 1,
        mode: a.mode,
        effect: 1,
        until: 0,
        lastReport: -100,
        intent: "",
      };
      a.radio = {
        sequence: 0,
        readyAt: 0,
        pending: null,
        last: null,
        history: [],
      };
    }
    return r;
  };
  const order = R.order;
  R.order = function (s, mode) {
    return s.race?.lifeVersion ? L.order(s, mode) : order.call(this, s, mode);
  };
  const finish = R.finish;
  R.finish = function (s, ...args) {
    if (s.race?.lifeVersion && s.race.finished) L.radioStep(s, s.race);
    return finish.call(this, s, ...args);
  };
  const step = G.RaceWeekend.step;
  G.RaceWeekend.step = function (s, r, ...args) {
    if (r.lifeVersion) L.radioStep(s, r);
    return step.call(this, s, r, ...args);
  };
  const decide = F.decide;
  F.decide = function (r, a, cars, c) {
    const result = decide.call(this, r, a, cars, c);
    return r.lifeVersion ? L.decide(r, a, c, result) : result;
  };
})();
