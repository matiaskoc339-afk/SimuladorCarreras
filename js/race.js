"use strict";
(() => {
  const G = RCS,
    cache = new Map();
  const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  G.Race = {
    dt: 0.05,
    track(index) {
      if (cache.has(index)) return cache.get(index);
      const def = G.Data.tracks[index],
        pts = def.points,
        samples = [];
      const at = (i) => pts[(i + pts.length) % pts.length];
      for (let i = 0; i < pts.length; i++)
        for (let k = 0; k < 30; k++) {
          const t = k / 30,
            a = at(i - 1),
            b = at(i),
            c = at(i + 1),
            d = at(i + 2);
          const f = (j) =>
            0.5 *
            (2 * b[j] +
              (-a[j] + c[j]) * t +
              (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t +
              (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t * t * t);
          samples.push({ x: f(0), y: f(1) });
        }
      let total = 0;
      samples.forEach((p, i) => {
        const q = samples[(i + 1) % samples.length];
        p.segment = Math.hypot(q.x - p.x, (q.y - p.y) * 0.66);
        total += p.segment;
        p.angle = Math.atan2((q.y - p.y) * 0.66, q.x - p.x);
      });
      let distance = 0;
      samples.forEach((p, i) => {
        p.distance = distance;
        p.meters = (p.segment / total) * def.length;
        distance += p.meters;
        const curvature = Math.abs(
          angleDiff(
            samples[(i + 3) % samples.length].angle,
            samples[(i - 3 + samples.length) % samples.length].angle,
          ),
        );
        p.limit = G.clamp(64 - curvature * 62, 18, 64);
      });
      cache.set(index, samples);
      return samples;
    },
    point(index, distance) {
      const pts = this.track(index),
        len = G.Data.tracks[index].length;
      const d = ((distance % len) + len) % len;
      let lo = 0,
        hi = pts.length - 1;
      while (lo < hi) {
        const m = Math.ceil((lo + hi) / 2);
        if (pts[m].distance <= d) lo = m;
        else hi = m - 1;
      }
      const p = pts[lo],
        q = pts[(lo + 1) % pts.length],
        t = G.clamp((d - p.distance) / p.meters, 0, 1);
      return {
        x: p.x + (q.x - p.x) * t,
        y: p.y + (q.y - p.y) * t,
        angle: p.angle,
        limit: p.limit,
      };
    },
    register(s, eventId, driverId, carId) {
      G.ensurePlayable(s);
      const e = s.season.events.find((e) => e.id === eventId);
      G.assert(
        e && e.status === "scheduled" && !e.entry && !s.race,
        "La inscripción no está disponible.",
      );
      G.assert(e.day >= s.day, "La fecha de inscripción ya ha pasado.");
      const d = s.drivers.find(
        (d) => d.id === driverId && d.companyId === s.playerId,
      );
      const c = s.cars.find(
        (c) => c.id === carId && c.companyId === s.playerId,
      );
      G.assert(d && c, "Elige un piloto contratado y un vehículo propio.");
      G.assert(d.fatigue < 90, "El piloto necesita descansar.");
      G.assert(
        !c.repair && !G.Market.listed(s, c.id) && G.Workshop.ready(c),
        "El coche necesita mantenimiento antes de inscribirse.",
      );
      G.assert(
        c.hp <= 210,
        "El reglamento limita la potencia a 210 CV de juego.",
      );
      G.Economy.spend(
        s,
        370,
        "Competición",
        `Inscripción y transporte · Ronda ${e.round}`,
      );
      e.entry = { driverId, carId, paid: 370 };
      G.news(
        s,
        "Competición",
        `${G.player(s).name} confirma su inscripción.`,
        `${d.name} pilotará el ${c.brand} ${c.model} en ${G.Data.tracks[e.track].name}.`,
        "competition",
        eventId,
      );
    },
    withdraw(s, id) {
      G.ensurePlayable(s);
      const e = s.season.events.find((e) => e.id === id);
      G.assert(
        e && e.status === "scheduled" && e.entry && !s.race,
        "No hay una inscripción que retirar.",
      );
      e.entry = null;
      G.news(
        s,
        "Competición",
        "Inscripción retirada voluntariamente.",
        "La plaza se libera. No se reembolsan los gastos de inscripción y transporte.",
        "competition",
        id,
      );
    },
    start(s, eventId, skip = false) {
      G.assert(!s.race, "Ya hay una carrera en curso.");
      const e = s.season.events.find((e) => e.id === eventId);
      G.assert(
        e && e.status === "scheduled" && e.day <= s.day,
        "Esta carrera aún no está disponible.",
      );
      if (!skip) {
        G.ensurePlayable(s);
        G.assert(e.entry, "Primero debes inscribirte.");
      }
      const r = {
        eventId,
        track: e.track,
        rng: Math.floor(G.random(s) * 4294967295),
        time: 0,
        step: 0,
        entrants: [],
        messages: [],
        finished: false,
        playerSkipped: skip,
        mechanicalVersion: 3,
        racingVersion: 1,
        trackWidth: 12.4,
        events: [],
        eventSequence: 0,
        eventCounts: {},
        flag: "green",
        yellowUntil: 0,
        yellowProgress: 0,
        encounterCooldowns: {},
        cautions: [],
      };
      for (const c of s.companies.filter((c) => c.status === "active")) {
        if (c.id === s.playerId && skip) continue;
        const d =
          c.id === s.playerId
            ? s.drivers.find(
                (d) => d.id === e.entry.driverId && d.companyId === c.id,
              )
            : G.Companies.lineup(s, c.id).driver;
        const car =
          c.id === s.playerId
            ? s.cars.find(
                (car) => car.id === e.entry.carId && car.companyId === c.id,
              )
            : G.Companies.lineup(s, c.id).car;
        if (c.id === s.playerId)
          G.assert(
            d && car && !car.repair && G.Workshop.ready(car) && d.fatigue < 90,
            "La alineación no está disponible. Revisa piloto, contrato y mantenimiento; también puedes renunciar.",
          );
        if (!d || !car || car.repair || car.condition < 35) continue;
        if (c.id !== s.playerId) {
          if (c.balance < 370) continue;
          G.Economy.transact(
            s,
            c.id,
            -370,
            "Competición",
            `Inscripción · Ronda ${e.round}`,
          );
        }
        r.entrants.push({
          ...G.Workshop.raceSnapshot(s, car),
          companyId: c.id,
          driverId: d.id,
          carId: car.id,
          sponsors: G.Contracts.marks(s, c.id),
          sponsorParts: Object.values(car.installed)
            .map((id) => s.parts.find((p) => p.id === id)?.definitionId)
            .filter(Boolean),
          name: d.name,
          team: c.name,
          color: car.color,
          model: car.model,
          shape: car.shape,
          stats: G.clone(d.stats),
          trait: d.trait,
          hp: car.hp,
          weight: car.weight,
          grip: car.grip,
          brakes: car.brakes,
          reliability: car.reliability,
          top: car.top,
          condition: car.condition,
          tires: car.tires,
          initialTires: car.tires,
          initialCondition: car.condition,
          fatigue: d.fatigue,
          morale: d.morale,
          progress: 0,
          speed: 0,
          lane: 0,
          mode: "balanced",
          slow: 0,
          finishTime: null,
          dnf: false,
          lastLap: 0,
          bestLap: null,
          lapStarted: 0,
        });
      }
      r.entrants.sort(
        (a, b) =>
          (b.hp / b.weight) * 100 +
          G.Drivers.rating({ stats: b.stats }) -
          ((a.hp / a.weight) * 100 + G.Drivers.rating({ stats: a.stats })),
      );
      r.entrants.forEach((a, i) => {
        a.progress = -Math.floor(i / 2) * 9.2 - (i % 2) * 2.5;
        a.lateral = i % 2 ? -2.2 : 2.2;
        a.width =
          a.shape === "roadster" ? 1.74 : a.shape === "coupe" ? 1.82 : 1.79;
        a.length =
          a.shape === "roadster" ? 3.98 : a.shape === "coupe" ? 4.42 : 4.16;
        a.headingSlip = 0;
        a.incident = null;
        a.incidentUntil = 0;
        a.incidentStarted = 0;
        a.offTrack = false;
        a.damage = 0;
        a.collisionCount = 0;
        a.overtakeCount = 0;
        a.contactCooldown = 0;
        a.errorCooldown = 0;
        a.paceFactor = 0.978 + G.random(r) * 0.044;
        a.braking = false;
        a.dnfReason = null;
        a.lane = a.lateral / this.worldScale(r.track);
      });
      r.messages.unshift({
        time: 0,
        text: "Ingeniero: salida autorizada. Mantén el coche entero y busca tu ritmo.",
      });
      s.race = r;
      return r;
    },
    order(s, mode) {
      G.assert(
        ["attack", "balanced", "save"].includes(mode),
        "Orden inválida.",
      );
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === s.playerId);
      G.assert(
        a && !r.finished && !a.dnf && a.finishTime === null,
        "No hay un piloto activo en pista.",
      );
      if (a.mode === mode) return;
      a.mode = mode;
      r.messages.unshift({
        time: r.time,
        text:
          "Radio · " +
          {
            attack: "Ataca. Usaremos más neumático para ganar ritmo.",
            balanced: "Entendido. Mantendré un ritmo constante.",
            save: "Recibido. Reduciré riesgos y cuidaré las gomas.",
          }[mode],
      });
      r.messages.length = Math.min(r.messages.length, 30);
    },
    tick(s, steps = 1) {
      const r = s.race;
      if (!r || r.finished) return;
      if (r.racingVersion === 1) return this.tickRacing(s, steps);
      const def = G.Data.tracks[r.track],
        distance = def.length * def.laps,
        dt = this.dt;
      for (let k = 0; k < steps && !r.finished; k++) {
        r.time += dt;
        r.step++;
        const sorted = [...r.entrants].sort((a, b) => b.progress - a.progress);
        for (const a of sorted) {
          if (a.dnf || a.finishTime !== null) continue;
          const mode =
            a.mode === "attack" ? 1.036 : a.mode === "save" ? 0.958 : 1;
          const skill = (0.8 + a.stats.pace / 300) * (1 - a.fatigue * 0.00055);
          const modern = r.mechanicalVersion === 3;
          const mech =
            (0.77 + a.condition * 0.0023) *
            (modern ? G.Workshop.mechanical(a) : 1);
          const grip =
            a.grip * (modern ? 0.85 + a.components.suspension * 0.0015 : 1);
          const brakePower =
            (4 + a.brakes / 25) *
            (modern ? 0.75 + a.components.brakes * 0.0025 : 1);
          let limit = 70;
          for (const ahead of [0, 25, 55, 85]) {
            const corner = this.point(r.track, a.progress + ahead).limit;
            const cornerSpeed =
              corner *
              (0.78 + grip / 260) *
              (0.82 + a.stats.control / 300) *
              (0.85 + a.tires * 0.0015);
            limit = Math.min(
              limit,
              Math.sqrt(cornerSpeed * cornerSpeed + 2 * brakePower * ahead),
            );
          }
          let target = Math.min((a.top / 3.6) * skill, limit) * mech * mode;
          const front = sorted.find(
            (b) =>
              b !== a &&
              !b.dnf &&
              b.progress > a.progress &&
              b.progress - a.progress < 14,
          );
          let laneTarget = 0;
          if (front) {
            laneTarget =
              a.stats.overtake + mode * 20 > front.stats.defense + 15
                ? 0.011
                : -0.011;
            if (Math.abs(a.lane - front.lane) < 0.008)
              target = Math.min(target, Math.max(8, front.speed - 1));
          }
          a.lane += (laneTarget - a.lane) * dt * 2;
          if (a.slow > 0) {
            a.slow -= dt;
            target *= 0.35;
          }
          const braking = a.speed > target ? 1 : 0;
          const accel =
            (modern
              ? a.acceleration * (0.85 + a.components.engine * 0.0015)
              : 1) *
            Math.min(6, (a.hp * 500) / (a.weight * Math.max(a.speed, 12)));
          a.speed = Math.max(
            0,
            a.speed + G.clamp(target - a.speed, -brakePower * dt, accel * dt),
          );
          const moved = a.speed * dt;
          a.progress += moved;
          a.tires = Math.max(
            0,
            a.tires -
              moved *
                0.001 *
                (a.mode === "attack" ? 2 : a.mode === "save" ? 0.55 : 1) *
                (1.3 - a.stats.tires / 170) *
                (modern ? a.tireWear : 1),
          );
          if (modern) G.Workshop.wear(a, moved, dt, braking);
          else
            a.condition = Math.max(
              0,
              a.condition - moved * 0.00025 * (a.mode === "attack" ? 1.5 : 1),
            );
          // Riesgo por paso fijo: los resultados no están predeterminados.
          const risk =
            ((0.000035 * dt * (100 - a.stats.consistency)) / 30) *
            G.Data.traits[a.trait].risk *
            (a.mode === "attack" ? 2.4 : 0.75) *
            (1 + (100 - a.condition) / 30);
          if (G.random(r) < risk) {
            a.slow = 4;
            if (modern) {
              a.components.body = Math.max(0, a.components.body - 7);
              a.components.suspension = Math.max(
                0,
                a.components.suspension - 4,
              );
              a.condition = G.Workshop.summary(a.components);
            } else a.condition = Math.max(0, a.condition - 3);
            r.messages.unshift({
              time: r.time,
              text: `Dirección de carrera: ${a.name} se sale de la trazada y pierde tiempo.`,
            });
          }
          const lap = Math.floor(Math.max(0, a.progress) / def.length);
          if (lap > a.lastLap) {
            const lapTime = r.time - a.lapStarted;
            a.bestLap =
              a.bestLap === null ? lapTime : Math.min(a.bestLap, lapTime);
            a.lapStarted = r.time;
            a.lastLap = lap;
            if (a.companyId === s.playerId && a.tires < 40)
              r.messages.unshift({
                time: r.time,
                text: "Piloto: las gomas están perdiendo agarre. Conviene conservar.",
              });
          }
          if (
            (modern
              ? Math.min(
                  a.components.engine,
                  a.components.transmission,
                  a.components.cooling,
                ) < 25
              : a.condition < 25) &&
            G.random(r) < dt * 0.003
          ) {
            a.dnf = true;
            r.messages.unshift({
              time: r.time,
              text: `Avería: ${a.name} abandona por daño mecánico.`,
            });
          }
          if (a.progress >= distance) {
            a.finishTime =
              r.time - (a.progress - distance) / Math.max(a.speed, 1);
            a.progress = distance;
          }
        }
        if (r.time > 1500)
          r.entrants.forEach((a) => {
            if (a.finishTime === null) a.dnf = true;
          });
        r.finished = r.entrants.every((a) => a.finishTime !== null || a.dnf);
        if (r.messages.length > 30) r.messages.length = 30;
      }
    },
    positions(r) {
      return [...r.entrants].sort(
        (a, b) =>
          Number(a.dnf) - Number(b.dnf) ||
          (a.finishTime !== null && b.finishTime !== null
            ? a.finishTime - b.finishTime
            : b.progress - a.progress),
      );
    },
    finish(s) {
      const r = s.race;
      G.assert(r?.finished, "La carrera aún está en curso.");
      const e = s.season.events.find((e) => e.id === r.eventId);
      G.assert(e, "Evento desconocido.");
      if (e.status !== "scheduled") {
        s.race = null;
        return e.results;
      }
      const results = this.positions(r).map((a, i) => ({
        companyId: a.companyId,
        driverId: a.driverId,
        carId: a.carId,
        name: a.name,
        team: a.team,
        position: i + 1,
        time: a.finishTime,
        dnf: a.dnf,
        points: a.dnf ? 0 : G.Data.points[i] || 0,
        prize: a.dnf ? 250 : G.Data.prizes[i] || 500,
        bestLap: a.bestLap,
        ...(r.racingVersion === 1
          ? {
              incidents: a.collisionCount,
              overtakes: a.overtakeCount,
              dnfReason: a.dnfReason,
            }
          : {}),
      }));
      e.results = results;
      if (r.racingVersion === 1)
        e.raceSummary = {
          duration: r.time,
          contacts: (r.eventCounts.contact || 0) + (r.eventCounts.crash || 0),
          crashes: r.eventCounts.crash || 0,
          overtakes: r.eventCounts.overtake || 0,
          spins: r.eventCounts.spin || 0,
          retirements: r.eventCounts.retirement || 0,
          highlights: G.clone(
            r.events
              .filter(
                (event) => !["finish", "radio", "green"].includes(event.type),
              )
              .slice(0, 12),
          ),
        };
      e.status = r.playerSkipped ? "skipped" : "completed";
      for (const row of results) {
        const a = r.entrants.find((a) => a.companyId === row.companyId),
          car = s.cars.find((c) => c.id === a.carId),
          d = s.drivers.find((d) => d.id === a.driverId),
          c = s.companies.find((c) => c.id === a.companyId);
        car.condition = a.condition;
        car.tires = a.tires;
        G.Workshop.finishRace(s, car, a, r.mechanicalVersion === 3);
        car.km += Math.max(0, a.progress) / 1000;
        car.starts++;
        if (row.position === 1 && !row.dnf) car.wins++;
        car.history.unshift({
          day: s.day,
          type: `R${e.round} · ${row.dnf ? "Abandono" : row.position + "º puesto"}`,
        });
        if (car.history.length > 30) car.history.length = 30;
        d.fatigue = G.clamp(d.fatigue + 22, 0, 100);
        d.starts++;
        d.points += row.points;
        d.stats.consistency = Math.min(d.potential, d.stats.consistency + 0.12);
        c.stats.starts++;
        if (row.position === 1 && !row.dnf) {
          c.stats.wins++;
          d.wins++;
        }
        if (row.position <= 3 && !row.dnf) c.stats.podiums++;
        c.reputation = G.clamp(
          c.reputation + (row.dnf ? -0.4 : row.position <= 3 ? 1 : 0.25),
          0,
          100,
        );
        const stats = s.season.standings[c.id];
        stats.points += row.points;
        stats.starts++;
        if (row.position === 1 && !row.dnf) stats.wins++;
        if (row.position <= 3 && !row.dnf) stats.podiums++;
        G.Economy.transact(
          s,
          c.id,
          row.prize,
          "Premios",
          `Premio · Ronda ${e.round} · ${row.dnf ? "abandono" : row.position + "º"}`,
        );
      }
      G.Contracts.raceFinished(s, e, r);
      if (results.length) {
        const noWinner =
          r.racingVersion === 1 && results.every((row) => row.dnf);
        G.news(
          s,
          "Resultados",
          noWinner
            ? `Carrera sin clasificados en ${G.Data.tracks[e.track].name}.`
            : `${results[0].team} se impone en ${G.Data.tracks[e.track].name}.`,
          noWinner
            ? "Todos los participantes han abandonado. No se adjudica una victoria; las ayudas logísticas y daños se han contabilizado."
            : `${results[0].name} ${results[0].dnf ? "lideró hasta el abandono" : "cruza primero la meta"}. Los puntos, premios y desgaste ya se han registrado.`,
          "competition",
          e.id,
        );
      }
      if (s.season.events.every((e) => e.status !== "scheduled")) {
        s.season.phase = "complete";
        const board = G.leaderboard(s),
          p = board.findIndex((r) => r.company.id === s.playerId);
        const bonus = Math.max(600, 2600 - p * 250);
        if (s.status === "active")
          G.Economy.transact(
            s,
            s.playerId,
            bonus,
            "Premios",
            `Clasificación final · ${p + 1}º`,
          );
        s.history.unshift({
          year: s.season.year,
          champion: board[0]?.company.name,
          playerPosition: p + 1,
          playerPoints: board[p]?.points || 0,
          bonus,
          logo: s.logo,
          standings: board.map((row) => ({
            name: row.company.name,
            points: row.points,
          })),
        });
        G.news(
          s,
          "Temporada",
          `${board[0]?.company.name || "La Copa Club"} cierra la temporada ${s.season.year}.`,
          `${G.player(s).name} termina en posición ${p + 1}, con ${board[p]?.points || 0} puntos y $${bonus} de prima final.`,
          "history",
        );
      }
      s.race = null;
      return results;
    },
    skip(s, id) {
      this.start(s, id, true);
      while (!s.race.finished) this.tick(s, 400);
      return this.finish(s);
    },
  };
})();

/* Dinámica de pista de la edición visual. Las carreras guardadas anteriores
   continúan usando tick() clásico hasta cruzar la meta. */
(() => {
  const G = RCS,
    R = G.Race;
  const signedAngle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const active = (a) => !a.dnf && a.finishTime === null;
  Object.assign(R, {
    worldScale(index) {
      return (
        G.Data.tracks[index].length /
        this.track(index).reduce((n, p) => n + p.segment, 0)
      );
    },
    relative(a, b, length) {
      return (
        ((((b.progress - a.progress + length / 2) % length) + length) %
          length) -
        length / 2
      );
    },
    event(r, type, text, carIds, progress) {
      const event = {
        id: "race-event-" + ++r.eventSequence,
        time: r.time,
        type,
        text,
        carIds,
        progress,
      };
      r.eventCounts ||= {};
      r.eventCounts[type] = (r.eventCounts[type] || 0) + 1;
      r.events.unshift(event);
      if (r.events.length > 80) r.events.length = 80;
      r.messages.unshift({ time: r.time, text });
      if (r.messages.length > 30) r.messages.length = 30;
      return event;
    },
    caution(r, progress, duration = 10) {
      r.cautions ||= [];
      r.cautions.push({ progress, until: r.time + duration });
      if (r.cautions.length > 8) r.cautions.shift();
      r.yellowProgress = progress;
      r.yellowUntil = Math.max(r.yellowUntil, r.time + duration);
      r.flag = "yellow";
    },
    underYellow(r, a) {
      const length = G.Data.tracks[r.track].length;
      return (r.cautions || []).some(
        (c) =>
          c.until > r.time &&
          this.relative(a, { progress: c.progress }, length) > -40 &&
          this.relative(a, { progress: c.progress }, length) < 145,
      );
    },
    damageCar(
      a,
      body,
      suspension = body * 0.45,
      cooling = body * 0.12,
      engine = body * 0.06,
    ) {
      a.components.body = Math.max(0, a.components.body - body * a.bodyWear);
      a.components.suspension = Math.max(
        0,
        a.components.suspension - suspension,
      );
      a.components.cooling = Math.max(0, a.components.cooling - cooling);
      a.components.engine = Math.max(0, a.components.engine - engine);
      a.damage += body + suspension + cooling + engine;
      a.condition = G.Workshop.summary(a.components);
    },
    errorRate(a, corner, pressure = 0) {
      const precision =
        (a.stats.control * 0.55 +
          a.stats.consistency * 0.3 +
          a.stats.discipline * 0.15) /
        100;
      const style = a.mode === "attack" ? 2.1 : a.mode === "save" ? 0.38 : 1;
      return (
        0.0022 *
        Math.max(0.12, 1.18 - precision) *
        G.Data.traits[a.trait].risk *
        style *
        corner *
        corner *
        (1 + pressure * 0.75) *
        (1 + (100 - a.tires) / 65) *
        (1 + a.fatigue / 120)
      );
    },
    loseControl(r, a, corner) {
      if (r.time < a.errorCooldown || !active(a)) return;
      const gripSkill = (a.stats.control + a.stats.consistency) / 200;
      const roll = G.random(r);
      const spin = roll > gripSkill * 0.6 + 0.2;
      a.incident = spin ? "spin" : "slide";
      a.incidentStarted = r.time;
      a.incidentUntil =
        r.time + (spin ? 4 + G.random(r) * 3 : 1.4 + G.random(r) * 1.7);
      a.errorCooldown = a.incidentUntil + 12;
      a.slideSide = G.random(r) < 0.5 ? -1 : 1;
      a.offTrack = spin || G.random(r) > 0.7;
      a.tires = Math.max(0, a.tires - (spin ? 3.5 : 1.3));
      a.components.tires = a.tires;
      if (a.offTrack) {
        this.damageCar(a, spin ? 4 : 1.5, spin ? 2 : 1);
        this.caution(r, a.progress, spin ? 9 : 5);
      }
      this.event(
        r,
        spin ? "spin" : "slide",
        spin
          ? `${a.name} pierde la zaga y hace un trompo. Se reincorpora con precaución.`
          : `${a.name} corrige un derrape y pierde impulso a la salida de la curva.`,
        [a.carId],
        a.progress,
      );
    },
    retire(r, a, reason) {
      if (a.dnf) return;
      a.dnf = true;
      a.dnfReason = reason;
      a.speed = 0;
      a.offTrack = true;
      a.incident = "contact";
      a.incidentStarted = r.time;
      a.incidentUntil = r.time + 20;
      a.retiredAt = r.time;
      this.caution(r, a.progress, 13);
      this.event(
        r,
        "retirement",
        `${a.name} abandona: ${reason.toLowerCase()}.`,
        [a.carId],
        a.progress,
      );
    },
    dimensions(a) {
      const c = Math.abs(Math.cos(a.headingSlip || 0)),
        s = Math.abs(Math.sin(a.headingSlip || 0));
      return {
        longitudinal: c * a.length + s * a.width,
        lateral: c * a.width + s * a.length,
      };
    },
    resolveContacts(r) {
      const length = G.Data.tracks[r.track].length,
        cars = r.entrants.filter(
          (a) =>
            active(a) ||
            (a.dnf && Math.abs(a.lateral) < r.trackWidth / 2 + 0.3),
        );
      // Una corrección puede empujar un tercer coche: vuelve a separar hasta
      // despejar la cadena, sin cobrar daños otra vez gracias al cooldown.
      for (let pass = 0; pass < 8; pass++) {
        let separations = 0;
        for (let i = 0; i < cars.length; i++)
          for (let j = i + 1; j < cars.length; j++) {
            const a = cars[i],
              b = cars[j];
            if (!active(a) && !active(b)) continue;
            let gap = this.relative(a, b, length),
              lat = b.lateral - a.lateral;
            const da = this.dimensions(a),
              db = this.dimensions(b);
            const limitX = (da.longitudinal + db.longitudinal) / 2 + 0.04,
              limitY = (da.lateral + db.lateral) / 2 + 0.04;
            const overlapX = limitX - Math.abs(gap),
              overlapY = limitY - Math.abs(lat);
            if (overlapX <= 0 || overlapY <= 0) continue;
            separations++;
            const closing = Math.abs(a.speed - b.speed),
              lateralClosing = Math.abs(
                (a.lateralVelocity || 0) - (b.lateralVelocity || 0),
              );
            const strong = closing > 1 || lateralClosing > 0.3;
            // Separación de volúmenes: los coches no se teletransportan uno a través del otro.
            const lateralSide =
              lat === 0
                ? a.carId.localeCompare(b.carId) < 0
                  ? 1
                  : -1
                : Math.sign(lat);
            const correction = overlapY / 2 + 0.015;
            const lateralClear =
              Math.abs(a.lateral - lateralSide * correction) <= 7.8 &&
              Math.abs(b.lateral + lateralSide * correction) <= 7.8;
            if (overlapY < overlapX && lateralClear) {
              const sign =
                lat === 0
                  ? a.carId.localeCompare(b.carId) < 0
                    ? 1
                    : -1
                  : Math.sign(lat);
              a.lateral -= sign * (overlapY / 2 + 0.015);
              b.lateral += sign * (overlapY / 2 + 0.015);
              a.lateral = G.clamp(a.lateral, -7.8, 7.8);
              b.lateral = G.clamp(b.lateral, -7.8, 7.8);
            } else {
              if (gap >= 0) {
                a.progress -= overlapX + 0.015;
                a.speed = Math.min(a.speed, b.speed * 0.94);
              } else {
                b.progress -= overlapX + 0.015;
                b.speed = Math.min(b.speed, a.speed * 0.94);
              }
            }
            if (
              !strong ||
              r.time < Math.max(a.contactCooldown, b.contactCooldown)
            )
              continue;
            const impulse = G.clamp(
              (closing * closing * 0.018 + lateralClosing * 1.2 + 0.7) *
                (1.25 - (a.stats.control + b.stats.control) / 500),
              0.45,
              30,
            );
            this.damageCar(
              a,
              impulse,
              impulse * 0.45,
              impulse * 0.14,
              impulse * 0.08,
            );
            this.damageCar(
              b,
              impulse * 0.78,
              impulse * 0.35,
              impulse * 0.1,
              impulse * 0.04,
            );
            for (const x of [a, b]) {
              x.collisionCount++;
              x.contactCooldown = r.time + 2.5;
              x.errorCooldown = Math.max(x.errorCooldown, r.time + 4);
              x.incident = "contact";
              x.incidentStarted = r.time;
              x.incidentUntil = r.time + 1.2;
              x.speed *= G.clamp(1 - impulse * 0.007, 0.6, 0.99);
            }
            this.event(
              r,
              impulse >= 9 ? "crash" : "contact",
              impulse >= 9
                ? `Colisión entre ${a.name} y ${b.name}. Hay daños y bandera amarilla en el sector.`
                : `Contacto entre ${a.name} y ${b.name}: ambos continúan con daños leves.`,
              [a.carId, b.carId],
              a.progress,
            );
            if (impulse >= 7) this.caution(r, a.progress, 12);
            if (closing > 34) {
              a.components.cooling = Math.min(a.components.cooling, 18);
              a.components.suspension = Math.min(a.components.suspension, 28);
              a.condition = G.Workshop.summary(a.components);
            }
            if (closing > 39) {
              b.components.cooling = Math.min(b.components.cooling, 25);
              b.components.suspension = Math.min(b.components.suspension, 20);
              b.condition = G.Workshop.summary(b.components);
            }
            if (
              closing > 34 ||
              a.components.suspension < 17 ||
              a.components.body < 12
            )
              this.retire(r, a, "Daños tras colisión");
            if (
              closing > 39 ||
              b.components.suspension < 17 ||
              b.components.body < 12
            )
              this.retire(r, b, "Daños tras colisión");
          }
        if (!separations) break;
      }
    },
    recordPasses(r) {
      const cars = r.entrants.filter(active);
      for (let i = 0; i < cars.length; i++)
        for (let j = i + 1; j < cars.length; j++) {
          const a = cars[i],
            b = cars[j],
            delta = a.progress - b.progress;
          if (Math.abs(delta) > 38) continue;
          const key = [a.carId, b.carId].sort().join("|"),
            leader = delta >= 0 ? a : b;
          let encounter = r.encounterCooldowns[key];
          if (!encounter) {
            r.encounterCooldowns[key] = {
              leader: leader.carId,
              lastEvent: -100,
            };
            continue;
          }
          if (Math.abs(delta) < 1.4 || encounter.leader === leader.carId)
            continue;
          const old = r.entrants.find((x) => x.carId === encounter.leader);
          encounter.leader = leader.carId;
          if (
            r.time - encounter.lastEvent < 9 ||
            !old ||
            old.dnf ||
            this.underYellow(r, leader)
          )
            continue;
          encounter.lastEvent = r.time;
          leader.overtakeCount++;
          this.event(
            r,
            "overtake",
            `${leader.name} supera a ${old.name} tras disputar la posición.`,
            [leader.carId, old.carId],
            leader.progress,
          );
        }
    },
    tickRacing(s, steps = 1) {
      const r = s.race;
      if (!r || r.finished) return;
      const def = G.Data.tracks[r.track],
        distance = def.length * def.laps,
        dt = this.dt,
        scale = this.worldScale(r.track);
      r.cautions ||= [];
      for (let k = 0; k < steps && !r.finished; k++) {
        r.time += dt;
        r.step++;
        r.cautions = r.cautions.filter((c) => c.until > r.time);
        const wasYellow = r.flag === "yellow";
        r.flag = r.cautions.length ? "yellow" : "green";
        if (wasYellow && r.flag === "green")
          this.event(
            r,
            "green",
            "Dirección de carrera: sector despejado, se retira la bandera amarilla.",
            [],
            r.yellowProgress,
          );
        for (const retired of r.entrants.filter((a) => a.dnf)) {
          const edge =
            retired.lateral >= 0
              ? r.trackWidth / 2 + 1.2
              : -(r.trackWidth / 2 + 1.2);
          retired.lateral += G.clamp(
            edge - retired.lateral,
            -dt * 0.8,
            dt * 0.8,
          );
          retired.lane = retired.lateral / scale;
        }
        const snapshots = r.entrants
          .filter(
            (a) =>
              active(a) ||
              (a.dnf && Math.abs(a.lateral) < r.trackWidth / 2 + 0.3),
          )
          .map((a) => ({ ...a, stats: a.stats, components: a.components }));
        for (const a of r.entrants) {
          if (!active(a)) continue;
          const me = snapshots.find((x) => x.carId === a.carId);
          const ahead = snapshots
            .filter((b) => b.carId !== a.carId)
            .map((b) => ({ b, gap: this.relative(me, b, def.length) }))
            .filter((x) => x.gap > 0 && x.gap < 65)
            .sort((x, y) => x.gap - y.gap);
          const front = ahead[0],
            rear = snapshots
              .filter((b) => b.carId !== a.carId)
              .map((b) => ({ b, gap: -this.relative(me, b, def.length) }))
              .filter((x) => x.gap > 0 && x.gap < 28)
              .sort((x, y) => x.gap - y.gap)[0];
          if (a.companyId !== s.playerId) {
            a.mode =
              a.tires < 30 || a.components.engine < 45
                ? "save"
                : front &&
                    front.gap < 26 &&
                    a.tires > 45 &&
                    (a.trait === 1 || a.trait === 3)
                  ? "attack"
                  : "balanced";
          }
          const yellow = this.underYellow(r, a),
            mode = a.mode === "attack" ? 1.037 : a.mode === "save" ? 0.957 : 1;
          const skill =
            (0.8 + a.stats.pace / 300) *
            (1 - a.fatigue * 0.00055) *
            a.paceFactor;
          const mech = (0.77 + a.condition * 0.0023) * G.Workshop.mechanical(a);
          const grip = a.grip * (0.85 + a.components.suspension * 0.0015),
            brakePower =
              (4 + a.brakes / 25) * (0.75 + a.components.brakes * 0.0025);
          const point = this.point(r.track, a.progress),
            curve = signedAngle(
              this.point(r.track, a.progress + 20).angle,
              this.point(r.track, a.progress - 20).angle,
            );
          const corner = G.clamp((64 - point.limit) / 46, 0, 1);
          let limit = 70;
          for (const look of [0, 25, 55, 85]) {
            const cornerLimit = this.point(r.track, a.progress + look).limit;
            const cornerSpeed =
              cornerLimit *
              (0.78 + grip / 260) *
              (0.82 + a.stats.control / 300) *
              (0.85 + a.tires * 0.0015);
            limit = Math.min(
              limit,
              Math.sqrt(cornerSpeed * cornerSpeed + 2 * brakePower * look),
            );
          }
          let target =
            Math.min((a.top / 3.6) * skill, limit) *
            mech *
            mode *
            (0.94 + (a.morale ?? 75) * 0.0008);
          let lateralTarget =
            Math.abs(curve) > 0.025 ? Math.sign(curve) * 1.15 : 0.15;
          let drafting = false,
            preparingPass = false;
          const passingSkill = G.clamp(a.stats.overtake / 100, 0, 1);
          if (front) {
            drafting =
              front.gap > 5 &&
              front.gap < 40 &&
              Math.abs(front.b.lateral - a.lateral) < 1.7;
            if (drafting && corner < 0.45)
              target *= 1.012 + (0.5 - a.stats.pace / 200) * 0.012;
            const tryPass =
              (!yellow || front.b.dnf) &&
              front.gap < 20 + passingSkill * 16 &&
              (target > front.b.speed + 0.7 - passingSkill * 0.5 ||
                a.mode === "attack") &&
              r.time > 1.2;
            if (tryPass) {
              const passingWidth =
                (a.width + this.dimensions(front.b).lateral) / 2 + 0.7;
              const lanes = [
                front.b.lateral - passingWidth,
                front.b.lateral + passingWidth,
              ].map((x) => G.clamp(x, -4.85, 4.85));
              const options = lanes.filter(
                (l) =>
                  Math.abs(l - front.b.lateral) > 2.1 &&
                  !snapshots.some(
                    (b) =>
                      b.carId !== a.carId &&
                      b.carId !== front.b.carId &&
                      Math.abs(this.relative(me, b, def.length)) < 9 &&
                      Math.abs(b.lateral - l) < 2.3,
                  ),
              );
              options.sort(
                (x, y) => Math.abs(x - a.lateral) - Math.abs(y - a.lateral),
              );
              if (options.length) {
                lateralTarget = options[0];
                preparingPass = true;
                // Un piloto menos hábil levanta mientras prepara la maniobra; la
                // habilidad facilita encontrar el hueco, no aumenta la potencia.
                if (Math.abs(lateralTarget - a.lateral) > 0.6)
                  target *= 0.95 + passingSkill * 0.05;
              }
            }
            if (
              front.gap < 12 &&
              Math.abs(front.b.lateral - a.lateral) <
                (a.width + this.dimensions(front.b).lateral) / 2 + 0.3
            ) {
              const desiredGap =
                4.4 + a.speed * (a.mode === "attack" ? 0.1 : 0.16);
              if (front.gap < desiredGap)
                target = Math.min(
                  target,
                  Math.max(1, front.b.speed - (desiredGap - front.gap) * 1.45),
                );
            }
          }
          if (
            !front &&
            rear &&
            !yellow &&
            rear.gap < 21 &&
            rear.gap > 7 &&
            corner < 0.7
          ) {
            const defense = G.clamp((a.stats.defense - 25) / 65, 0, 1);
            lateralTarget +=
              (G.clamp(rear.b.lateral, -2, 2) - lateralTarget) * defense;
          }
          // Un piloto disciplinado deja espacio antes de converger sobre un coche emparejado.
          const beside = snapshots.find(
            (b) =>
              b.carId !== a.carId &&
              Math.abs(this.relative(me, b, def.length)) < a.length + 1 &&
              Math.abs(b.lateral - lateralTarget) <
                (this.dimensions(a).lateral + this.dimensions(b).lateral) / 2 +
                  0.25,
          );
          if (beside) {
            const buffer =
              (this.dimensions(a).lateral + this.dimensions(beside).lateral) /
                2 +
              0.2;
            const side = a.lateral >= beside.lateral ? 1 : -1;
            const care = 0.94 + a.stats.discipline / 500;
            lateralTarget = beside.lateral + side * buffer * care;
          }
          if (yellow) target = Math.min(target, front?.b.dnf ? 14 : 24);
          const beforeLateral = a.lateral;
          if (a.incident && r.time >= a.incidentUntil) {
            a.incident = null;
            a.offTrack = false;
          }
          if (a.incident === "spin") {
            const phase =
              (r.time - a.incidentStarted) /
              Math.max(0.1, a.incidentUntil - a.incidentStarted);
            a.headingSlip = a.slideSide * Math.sin(phase * Math.PI) * 2.7;
            lateralTarget = a.slideSide * (r.trackWidth / 2 + 1.1);
            target = Math.min(target, 4 + Math.max(0, phase - 0.65) * 10);
          } else if (a.incident === "slide") {
            const phase =
              (r.time - a.incidentStarted) /
              Math.max(0.1, a.incidentUntil - a.incidentStarted);
            a.headingSlip = a.slideSide * Math.sin(phase * Math.PI) * 0.45;
            lateralTarget =
              a.slideSide * (a.offTrack ? r.trackWidth / 2 + 0.55 : 3.8);
            target *= 0.68;
          } else {
            a.headingSlip *= Math.max(0, 1 - dt * 5);
            if (a.incident === "contact") target *= 0.82;
          }
          const lateralSpeed =
            (1.1 +
              a.stats.control / 90 +
              (preparingPass ? passingSkill * 0.55 : 0)) *
            (a.incident === "spin" ? 1.2 : 1);
          a.lateral += G.clamp(
            lateralTarget - a.lateral,
            -lateralSpeed * dt,
            lateralSpeed * dt,
          );
          a.lateral = G.clamp(a.lateral, -7.8, 7.8);
          a.offTrack = Math.abs(a.lateral) > r.trackWidth / 2 - 0.3;
          if (a.offTrack) target *= 0.65;
          a.lateralVelocity = (a.lateral - beforeLateral) / dt;
          a.braking = a.speed > target + 1;
          const accel =
            a.acceleration *
            (0.85 + a.components.engine * 0.0015) *
            Math.min(6, (a.hp * 500) / (a.weight * Math.max(a.speed, 12)));
          a.speed = Math.max(
            0,
            a.speed + G.clamp(target - a.speed, -brakePower * dt, accel * dt),
          );
          const moved = a.speed * dt;
          a.progress += moved;
          a.tires = Math.max(
            0,
            a.tires -
              moved *
                0.001 *
                (a.mode === "attack" ? 2 : a.mode === "save" ? 0.55 : 1) *
                (1.3 - a.stats.tires / 170) *
                a.tireWear,
          );
          G.Workshop.wear(a, moved, dt, a.braking ? 1 : 0);
          const pressure =
            front && front.gap < 12 ? 1 : rear && rear.gap < 10 ? 0.7 : 0;
          if (
            !a.incident &&
            r.time > a.errorCooldown &&
            a.speed > 15 &&
            corner > 0.25 &&
            G.random(r) < this.errorRate(a, corner, pressure) * dt
          )
            this.loseControl(r, a, corner);
          if (
            Math.min(
              a.components.engine,
              a.components.transmission,
              a.components.cooling,
            ) < 25 &&
            G.random(r) < dt * 0.003
          )
            this.retire(r, a, "Avería mecánica");
          a.lane = a.lateral / scale;
        }
        this.resolveContacts(r);
        this.recordPasses(r);
        for (const a of r.entrants) {
          if (!active(a)) continue;
          a.lane = a.lateral / scale;
          const lap = Math.floor(Math.max(0, a.progress) / def.length);
          if (lap > a.lastLap) {
            const lapTime = r.time - a.lapStarted;
            a.bestLap =
              a.bestLap === null ? lapTime : Math.min(a.bestLap, lapTime);
            a.lapStarted = r.time;
            a.lastLap = lap;
            if (a.companyId === s.playerId && a.tires < 40)
              this.event(
                r,
                "radio",
                "Piloto: pierdo agarre con estas gomas. Necesito conservar.",
                [a.carId],
                a.progress,
              );
          }
          if (a.progress >= distance) {
            a.finishTime =
              r.time - (a.progress - distance) / Math.max(a.speed, 1);
            a.progress = distance;
            this.event(
              r,
              "finish",
              `${a.name} cruza la línea de meta.`,
              [a.carId],
              distance,
            );
          }
        }
        if (r.time > 1500)
          for (const a of r.entrants.filter(active))
            this.retire(r, a, "No puede completar la distancia de carrera");
        r.finished = r.entrants.every((a) => a.finishTime !== null || a.dnf);
      }
    },
  });
})();
