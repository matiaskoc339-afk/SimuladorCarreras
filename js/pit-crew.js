"use strict";
(() => {
  const G = RCS,
    P = G.Professionals,
    S = G.Staff,
    W = G.RaceWeekend,
    R = G.Race;
  const C = (G.PitCrew = {
    member(s, cid, role) {
      const e = S.owned(s, cid).find(
        (e) => e.role === role && !S.busy(s, e.id) && !P.resting(s, e.id),
      );
      if (!e) return null;
      const p = P.profile(s, e.id);
      return {
        id: e.id,
        level: p.level,
        stress: p.stress,
        speed: p.speed,
        skill: e.skill,
      };
    },
    accuracy(member, engineer = null) {
      return member
        ? G.clamp(
            0.18 +
              member.level * 0.073 +
              member.skill * 0.001 -
              member.stress * 0.004 +
              (engineer ? engineer.level * 0.008 : 0),
            0.05,
            0.99,
          )
        : 0;
    },
    serviceFactor(member, engineer = null) {
      return member
        ? G.clamp(
            1.35 -
              member.level * 0.06 -
              (member.speed - 50) * 0.005 +
              member.stress * 0.005 -
              (engineer ? engineer.level * 0.008 : 0),
            0.5,
            1.8,
          )
        : 1;
    },
    createManual(r, a, reason) {
      a.pit.manual = {
        phase: "lift",
        selected: 0,
        wheels: Array.from({ length: 4 }, () => ({
          loose: 0,
          removed: false,
          fitted: false,
          tight: 0,
        })),
        started: r.time,
        readyAt: r.time,
        errors: 0,
        reason,
      };
      R.event(
        r,
        "pit-failure",
        reason === "no-mechanic"
          ? `${a.name}: sin mecánico. Necesitas intervenir en el cambio de ruedas.`
          : `${a.name}: el mecánico ha fallado. Necesitas terminar el servicio manualmente.`,
        [a.carId],
        a.progress,
      );
    },
    action(s, action, wheel = null) {
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === s.playerId),
        m = a?.pit.manual;
      G.assert(
        r?.professionalVersion === 1 &&
          !r.finished &&
          !a.dnf &&
          a.finishTime === null &&
          a.pit.phase === "box" &&
          m &&
          m.phase !== "done",
        "No hay un servicio manual pendiente.",
      );
      if (action === "select") {
        G.assert(
          Number.isInteger(wheel) && wheel >= 0 && wheel < 4,
          "Rueda inválida.",
        );
        m.selected = wheel;
        return true;
      }
      G.assert(
        r.time + 0.0001 >= m.readyAt,
        "Espera a terminar el movimiento actual.",
      );
      const w = m.wheels[m.selected];
      let valid = false;
      if (action === "lift" && m.phase === "lift") {
        m.phase = "wheel";
        valid = true;
      } else if (m.phase === "wheel") {
        if (action === "loosen" && !w.removed && w.loose < 4) {
          w.loose++;
          valid = true;
        } else if (action === "remove" && w.loose === 4 && !w.removed) {
          w.removed = true;
          valid = true;
        } else if (action === "fit" && w.removed && !w.fitted) {
          w.fitted = true;
          valid = true;
        } else if (action === "tighten" && w.fitted && w.tight < 4) {
          w.tight++;
          valid = true;
        } else if (action === "lower" && m.wheels.every((w) => w.tight === 4)) {
          m.phase = "check";
          valid = true;
        }
      } else if (action === "check" && m.phase === "check") {
        m.phase = "done";
        a.pit.remaining =
          (a.pit.repair ? 12 : 0) +
          a.pit.fuel * 1.2 +
          Math.max(0, a.unservedPenalty - (r.time - m.started));
        valid = true;
        R.event(
          r,
          "pit-manual-complete",
          `${a.name}: ruedas montadas y comprobadas. El servicio puede terminar.`,
          [a.carId],
          a.progress,
        );
      }
      if (!valid) {
        m.errors++;
        m.readyAt = r.time + 1;
        return false;
      }
      m.readyAt = r.time + (["lift", "lower"].includes(action) ? 0.5 : 0.12);
      return true;
    },
    decide(s, r) {
      const dt = R.dt,
        len = G.Data.tracks[r.track].length,
        total = len * G.Data.tracks[r.track].laps;
      for (const a of r.entrants) {
        const p = a.professional;
        if (!p || a.dnf || a.finishTime !== null) continue;
        const help = p.strategist && p.auto && r.time >= p.manualUntil;
        p.driverStress = G.clamp(
          p.driverStress +
            dt * (a.mode === "attack" ? 0.022 : 0.009) -
            (help ? dt * p.strategist.level * 0.002 : 0),
          0,
          100,
        );
        if (!help || r.time < p.nextDecision || a.pit.phase !== "none")
          continue;
        p.nextDecision = r.time + Math.max(3, 10 - p.strategist.level * 0.6);
        const error =
          G.random(r) <
          G.clamp(
            0.45 - p.strategist.level * 0.04 + p.strategist.stress * 0.003,
            0.02,
            0.8,
          );
        const need = r.competitionVersion ? G.Driving.pitNeed(s, r, a) : null;
        const required = (total - a.progress) * 0.00014 * (a.hp / 197),
          fuelLow = need ? need.fuel : a.fuel < required + 0.15,
          wet = r.weather.wetness,
          compound = W.bestCompound(r),
          badCompound = need
            ? need.weather
            : (wet > 0.3 && !G.Rubber.wet(a.compound)) ||
              (wet < 0.08 && G.Rubber.wet(a.compound));
        let mode = fuelLow
          ? "fuel"
          : a.tires < 35 || a.condition < 50 || wet > 0.7
            ? "save"
            : "balanced";
        const traffic = R.positions(r),
          index = traffic.indexOf(a),
          front = traffic[index - 1],
          rear = traffic[index + 1];
        if (
          mode === "balanced" &&
          front &&
          Math.abs(front.progress - a.progress) < 22 &&
          a.tires > 50
        )
          mode = "attack";
        else if (
          mode === "balanced" &&
          rear &&
          Math.abs(a.progress - rear.progress) < 15
        )
          mode = "defend";
        if (error) mode = a.mode === "attack" ? "balanced" : "attack";
        if (mode !== a.mode) {
          a.mode = mode;
          R.event(
            r,
            "radio",
            `Estratega: ${error ? "apostamos por atacar" : "ajustamos el ritmo"} (${mode === "fuel" ? "ahorro de combustible" : mode === "save" ? "conservar" : mode === "defend" ? "defender" : mode === "attack" ? "atacar" : "equilibrado"}).`,
            [a.carId],
            a.progress,
          );
        }
        if (
          !error &&
          (need
            ? need.fuel || need.tires || need.weather
            : fuelLow || a.tires < 20 || a.puncture || badCompound)
        ) {
          try {
            P.automating = true;
            W.requestPit(s, a.companyId, {
              compound:
                badCompound || (need ? need.tires : a.tires < 20) || a.puncture
                  ? compound
                  : "keep",
              fuel: fuelLow ? 2 : 0,
              repair: false,
            });
          } catch {
          } finally {
            P.automating = false;
          }
        }
      }
    },
    validate(s) {
      const r = s.race;
      if (!r?.professionalVersion) return;
      G.assert(
        r.professionalVersion === 1,
        "Versión de personal en carrera inválida.",
      );
      for (const a of r.entrants) {
        const p = a.professional;
        G.assert(
          p &&
            typeof p.auto === "boolean" &&
            Number.isFinite(p.driverStress) &&
            p.driverStress >= 0 &&
            p.driverStress <= 100 &&
            Number.isFinite(p.manualUntil) &&
            p.manualUntil >= 0 &&
            Number.isFinite(p.nextDecision) &&
            p.nextDecision >= 0,
          "Estrategia profesional inválida.",
        );
        for (const role of ["mechanic", "engineer", "strategist"]) {
          const e = p[role];
          if (e !== null)
            G.assert(
              e &&
                s.employees.some(
                  (other) => other.id === e.id && other.role === role,
                ) &&
                Number.isInteger(e.level) &&
                e.level >= 1 &&
                e.level <= 10 &&
                Number.isFinite(e.stress) &&
                e.stress >= 0 &&
                e.stress <= 100 &&
                Number.isFinite(e.speed) &&
                e.speed >= 40 &&
                e.speed <= 100 &&
                Number.isFinite(e.skill) &&
                e.skill >= 0 &&
                e.skill <= 100,
              "Equipo técnico de carrera inválido.",
            );
        }
        const m = a.pit?.manual;
        if (!m) continue;
        G.assert(
          a.companyId === s.playerId &&
            (a.pit.phase === "box" ||
              (m.phase === "done" && a.pit.phase === "exit")) &&
            ["lift", "wheel", "check", "done"].includes(m.phase) &&
            Number.isInteger(m.selected) &&
            m.selected >= 0 &&
            m.selected < 4 &&
            Array.isArray(m.wheels) &&
            m.wheels.length === 4 &&
            Number.isFinite(m.started) &&
            m.started >= 0 &&
            m.started <= r.time &&
            Number.isFinite(m.readyAt) &&
            m.readyAt >= 0 &&
            Number.isInteger(m.errors) &&
            m.errors >= 0 &&
            ["no-mechanic", "failure"].includes(m.reason),
          "Intervención manual inválida.",
        );
        for (const w of m.wheels)
          G.assert(
            Number.isInteger(w.loose) &&
              w.loose >= 0 &&
              w.loose <= 4 &&
              typeof w.removed === "boolean" &&
              typeof w.fitted === "boolean" &&
              Number.isInteger(w.tight) &&
              w.tight >= 0 &&
              w.tight <= 4 &&
              (!w.removed || w.loose === 4) &&
              (!w.fitted || w.removed) &&
              (w.tight === 0 || w.fitted),
            "Estado de rueda inválido.",
          );
        if (["check", "done"].includes(m.phase))
          G.assert(
            m.wheels.every((w) => w.tight === 4),
            "No se puede cerrar boxes con ruedas sueltas.",
          );
      }
    },
  });
  const start = R.start;
  R.start = function (s, ...args) {
    G.assert(
      !G.Practice.active(s) ||
        (G.DriverWorld?.enabled(s) &&
          !!G.Practice.active(s).calendarVersion &&
          args[1] === true),
      "Termina el entrenamiento antes de disputar una carrera.",
    );
    const r = start.call(this, s, ...args);
    if (!s.professional) return r;
    r.professionalVersion = 1;
    for (const a of r.entrants) {
      a.professional = {
        mechanic: C.member(s, a.companyId, "mechanic"),
        engineer: C.member(s, a.companyId, "engineer"),
        strategist: C.member(s, a.companyId, "strategist"),
        driverStress: P.care(s, a.driverId)?.stress || 0,
        auto: false,
        manualUntil: 0,
        nextDecision: 0,
      };
      a.professional.auto = !!a.professional.strategist;
      const setup = s.professional.setups[a.carId],
        car = s.cars.find((c) => c.id === a.carId);
      if (setup && setup.until >= s.day && setup.kmLimit >= car.km)
        a.grip *= 1 + setup.effect;
    }
    return r;
  };
  const drive = W.drivePit;
  W.drivePit = function (s, r, a, dt) {
    if (!r.professionalVersion) return drive.call(this, s, r, a, dt);
    const before = a.pit?.phase,
      m = a.pit?.manual;
    if (before === "box" && m && m.phase !== "done") {
      a.speed = 0;
      a.braking = false;
      a.thermal += (55 - a.thermal) * dt * 0.04;
      return true;
    }
    const result = drive.call(this, s, r, a, dt);
    if (before !== "box" && a.pit?.phase === "box") {
      const p = a.professional,
        crew = p.mechanic,
        success = crew && G.random(r) < C.accuracy(crew, p.engineer),
        penalty = a.unservedPenalty;
      a.pit.remaining =
        (a.pit.remaining - penalty) * C.serviceFactor(crew, p.engineer) +
        penalty;
      if (!success) {
        if (a.companyId === s.playerId)
          C.createManual(r, a, crew ? "failure" : "no-mechanic");
        else
          a.pit.remaining += crew
            ? 12 + G.random(r) * 18
            : 30 + G.random(r) * 15;
      }
    }
    return result;
  };
  const ticking = R.tickRacing;
  R.tickRacing = function (s, steps) {
    if (!s.race?.professionalVersion) return ticking.call(this, s, steps);
    for (let i = 0; i < steps && !s.race.finished; i++) {
      C.decide(s, s.race);
      ticking.call(this, s, 1);
    }
  };
  const order = R.order;
  R.order = function (s, ...args) {
    const result = order.call(this, s, ...args),
      r = s.race,
      a = r?.entrants.find((a) => a.companyId === s.playerId);
    if (r?.professionalVersion && a?.professional)
      a.professional.manualUntil = r.time + 30;
    return result;
  };
  const request = W.requestPit;
  W.requestPit = function (s, cid = s.playerId, ...args) {
    const result = request.call(this, s, cid, ...args),
      a = s.race?.entrants.find((a) => a.companyId === cid);
    if (cid === s.playerId && a?.professional && !P.automating)
      a.professional.manualUntil = s.race.time + 45;
    return result;
  };
  const cancel = W.cancelPit;
  W.cancelPit = function (s, ...args) {
    const result = cancel.call(this, s, ...args),
      a = s.race?.entrants.find((a) => a.companyId === s.playerId);
    if (a?.professional) a.professional.manualUntil = s.race.time + 45;
    return result;
  };
  const rate = R.errorRate;
  R.errorRate = function (a, ...args) {
    return (
      rate.call(this, a, ...args) *
      (a.professional ? 1 + a.professional.driverStress * 0.008 : 1)
    );
  };
  const finish = R.finish;
  R.finish = function (s) {
    const r = s.race,
      e = s.season.events.find((e) => e.id === r?.eventId);
    if (r?.professionalVersion && r.finished && e?.status === "scheduled")
      for (const a of r.entrants) {
        if (P.care(s, a.driverId))
          P.care(s, a.driverId).stress = a.professional.driverStress;
        for (const role of ["mechanic", "engineer", "strategist"]) {
          const member = a.professional[role];
          if (member) {
            P.gain(s, member.id, 20);
            const p = P.profile(s, member.id);
            p.stress = Math.min(100, p.stress + 6);
          }
        }
      }
    return finish.call(this, s);
  };
})();
