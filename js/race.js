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
        a.progress = -i * 8;
        a.lane = i % 2 ? -0.006 : 0.006;
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
      }));
      e.results = results;
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
      if (results.length)
        G.news(
          s,
          "Resultados",
          `${results[0].team} se impone en ${G.Data.tracks[e.track].name}.`,
          `${results[0].name} ${results[0].dnf ? "lideró hasta el abandono" : "cruza primero la meta"}. Los puntos, premios y desgaste ya se han registrado.`,
          "competition",
          e.id,
        );
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
