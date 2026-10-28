"use strict";
(() => {
  const G = RCS,
    R = G.Race;
  const finite = Number.isFinite,
    clamp = G.clamp,
    round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  const live = (a) => !!a && !a.dnf && a.finishTime === null;
  const hash = (n) => {
    let x = Math.imul((n ^ 0x45d9f3b) >>> 0, 0x27d4eb2d);
    x = Math.imul(x ^ (x >>> 15), 0x85ebca6b);
    return ((x ^ (x >>> 13)) >>> 0) / 4294967296;
  };
  const pitCache = new Map();
  const W = (G.RaceWeekend = {
    compounds: {
      road: {
        name: "Calle · juego del coche",
        price: 0,
        wear: 1,
        color: "#c6cbd0",
      },
      soft: { name: "Slick blando", price: 220, wear: 1.9, color: "#ef6654" },
      hard: { name: "Slick duro", price: 200, wear: 0.65, color: "#e6e3ce" },
      inter: { name: "Intermedio", price: 240, wear: 1.15, color: "#71b98c" },
      wet: { name: "Lluvia", price: 260, wear: 1.2, color: "#79aee4" },
    },
    initialize(s) {
      if (s.raceSupplies !== undefined) {
        G.assert(
          s.raceSupplies.version === 1,
          "Versión de suministros de carrera incompatible.",
        );
        return s;
      }
      s.raceSupplies = {
        version: 1,
        stock: { soft: 32, hard: 32, inter: 32, wet: 32 },
        fuelStock: 160,
        sets: [],
        lastRestock: -1,
        lastReplay: null,
      };
      return s;
    },
    daily(s) {
      const d = s.raceSupplies;
      if (!d || s.day % 30 || d.lastRestock === s.day) return;
      d.lastRestock = s.day;
      for (const [id, c] of Object.entries(this.compounds)) {
        if (id === "road" || d.stock[id] > 24) continue;
        const cost = Math.round(c.price * 0.4) * 8;
        if (s.partsSupplier.balance >= cost) {
          s.partsSupplier.balance -= cost;
          d.stock[id] += 8;
        }
      }
      if (d.fuelStock <= 120 && s.partsSupplier.balance >= 120) {
        d.fuelStock += 40;
        s.partsSupplier.balance -= 120;
      }
    },
    stored(s, cid, compound) {
      return s.raceSupplies.sets
        .filter(
          (t) =>
            t.companyId === cid &&
            t.compound === compound &&
            t.status === "stored" &&
            t.condition >= 35,
        )
        .sort((a, b) => b.condition - a.condition || a.id.localeCompare(b.id));
    },
    tyreQuote(s, cid, compound) {
      G.assert(this.compounds[compound], "Compuesto desconocido.");
      if (compound === "road" || compound === "keep")
        return { cost: 0, set: null };
      const set = this.stored(s, cid, compound)[0];
      if (set) return { cost: 0, set };
      G.assert(
        s.raceSupplies.stock[compound] > 0,
        "No quedan juegos de ese compuesto en el proveedor.",
      );
      G.assert(
        s.raceSupplies.sets.filter(
          (t) =>
            t.companyId === cid && ["stored", "reserved"].includes(t.status),
        ).length < 8,
        "Tu almacén de carrera está lleno (8 juegos libres o reservados).",
      );
      return { cost: this.compounds[compound].price, set: null };
    },
    reserve(s, cid, compound, eventId) {
      if (compound === "road" || compound === "keep") return null;
      const q = this.tyreQuote(s, cid, compound);
      let t = q.set;
      if (!t) {
        G.Economy.spendCompany(
          s,
          cid,
          q.cost,
          "Carrera",
          "Juego de competición · " + this.compounds[compound].name,
        );
        s.partsSupplier.balance += q.cost;
        s.raceSupplies.stock[compound]--;
        t = {
          id: G.uid(s, "tyreset"),
          companyId: cid,
          compound,
          condition: 100,
          status: "stored",
          eventId: null,
        };
        s.raceSupplies.sets.push(t);
      }
      t.status = "reserved";
      t.eventId = eventId;
      return t;
    },
    entryQuote(s, cid, compound = "road", fuel = 3) {
      G.assert([1, 3].includes(fuel), "Carga inicial inválida.");
      const q = this.tyreQuote(s, cid, compound);
      return { ...q, compound, fuel, total: 370 + q.cost };
    },
    releaseEntry(s, e) {
      const t = s.raceSupplies.sets.find((t) => t.id === e.entry?.tyreSetId);
      if (t?.status === "reserved") {
        t.status = "stored";
        t.eventId = null;
      }
    },
    pitLayout(index) {
      if (pitCache.has(index)) return pitCache.get(index);
      const samples = R.track(index),
        factor = R.worldScale(index),
        length = G.Data.tracks[index].length,
        entry = length * 0.105,
        exit = length * 0.27,
        mid = R.point(index, (entry + exit) / 2),
        center = {
          x: samples.reduce((n, p) => n + p.x * factor, 0) / samples.length,
          y:
            samples.reduce((n, p) => n + p.y * 0.66 * factor, 0) /
            samples.length,
        },
        toward =
          (mid.x * factor - center.x) * -Math.sin(mid.angle) +
          (mid.y * 0.66 * factor - center.y) * Math.cos(mid.angle);
      const value = {
        entry,
        exit,
        side: toward >= 0 ? 1 : -1,
        offset: 19,
        limit: 60 / 3.6,
      };
      pitCache.set(index, value);
      return value;
    },
    pitLateral(index, progress) {
      const p = this.pitLayout(index),
        len = G.Data.tracks[index].length,
        d = ((progress % len) + len) % len,
        u = clamp((d - p.entry) / (p.exit - p.entry), 0, 1);
      return Math.sin(u * Math.PI) * p.offset * p.side;
    },
    forecast(s, e) {
      const n = s.seed ^ Math.imul(e.day + 1, 7919) ^ (e.track * 117);
      return {
        chance: Math.round((0.15 + hash(n) * 0.65) * 100),
        temperature: Math.round(17 + hash(n + 17) * 14),
        initialWet: hash(n + 23) > 0.88 ? 0.25 : 0,
      };
    },
    makeWeather(s, r) {
      const e = s.season.events.find((e) => e.id === r.eventId),
        f = this.forecast(s, e),
        n = s.seed ^ Math.imul(e.day + 1, 7919) ^ (e.track * 117),
        showers = hash(n + 37) < f.chance / 100,
        lap = G.Data.tracks[r.track].length / 38;
      return {
        rain: f.initialWet ? 0.15 : 0,
        wetness: f.initialWet,
        ambient: f.temperature,
        trackTemp: f.temperature + 9,
        phase: f.initialWet ? "light-rain" : "dry",
        stage: 0,
        forecast: f,
        plan: [
          { time: 0, rain: f.initialWet ? 0.15 : 0 },
          {
            time: lap * (1.0 + hash(n + 43) * 0.4),
            rain: showers ? 0.45 + hash(n + 51) * 0.5 : 0,
          },
          { time: lap * 2.8, rain: showers && hash(n + 63) > 0.65 ? 0.7 : 0 },
        ],
      };
    },
    start(s, r) {
      this.initialize(s);
      r.weekendVersion = 1;
      r.weather = this.makeWeather(s, r);
      r.safety = { active: false, until: 0, reason: "" };
      r.replay = {
        version: 1,
        eventId: r.eventId,
        track: r.track,
        sampleEvery: 10,
        lastEvent: 0,
        frames: [],
        events: [],
        duration: 0,
        cars: [],
      };
      const e = s.season.events.find((e) => e.id === r.eventId);
      for (const [i, a] of r.entrants.entries()) {
        const car = s.cars.find((c) => c.id === a.carId),
          player = a.companyId === s.playerId;
        let compound = "road",
          set = null;
        if (player && e.entry?.tyreSetId) {
          set = s.raceSupplies.sets.find((t) => t.id === e.entry.tyreSetId);
          G.assert(
            set && set.companyId === a.companyId && set.status === "reserved",
            "El juego inscrito ya no está disponible.",
          );
          compound = set.compound;
        }
        if (!player && r.weather.wetness > 0.18) {
          const wanted = r.weather.wetness > 0.65 ? "wet" : "inter";
          try {
            const q = this.tyreQuote(s, a.companyId, wanted);
            if (
              s.companies.find((c) => c.id === a.companyId).balance >=
              q.cost + 250
            ) {
              set = this.reserve(s, a.companyId, wanted, r.eventId);
              compound = wanted;
            }
          } catch {}
        }
        a.compound = "road";
        a.tyreSetId = null;
        a.roadCondition = a.tires;
        a.roadTirePartId = car.installed.tires || null;
        a.tyreTemp = 62;
        a.fuel = player ? e.entry?.fuel || 3 : 3;
        a.fuelInitial = a.fuel;
        a.puncture = false;
        a.roadPuncture = false;
        a.pitStops = 0;
        a.pit = { phase: "none", limiter: true };
        a.gridIndex = i;
        a.totalPenalty = 0;
        a.unservedPenalty = 0;
        a.punctureWarned = false;
        a.lowFuelWarned = false;
        if (set) this.fitSet(s, r, a, set);
        r.replay.cars.push({
          companyId: a.companyId,
          carId: a.carId,
          driverId: a.driverId,
          name: a.name,
          team: a.team,
          model: a.model,
          shape: a.shape,
          width: a.width,
          length: a.length,
          color: a.color,
          sponsors: G.clone(a.sponsors || []),
        });
      }
      this.record(r, true);
      return r;
    },
    onTrack(a) {
      return live(a) && (!a.pit || ["none", "queued"].includes(a.pit.phase));
    },
    grip(r, a) {
      if (!r.weekendVersion) return 1;
      const wet = r.weather.wetness;
      let g =
        a.compound === "soft"
          ? 1.07 * (1 - wet * 0.67)
          : a.compound === "hard"
            ? 1.015 * (1 - wet * 0.62)
            : a.compound === "inter"
              ? 0.92 +
                0.13 * Math.min(1, wet * 3) -
                Math.max(0, wet - 0.6) * 0.5
              : a.compound === "wet"
                ? 0.79 + 0.26 * Math.min(1, wet * 1.5)
                : 1 - wet * 0.3;
      if (a.compound !== "road")
        g *=
          1 -
          Math.min(
            0.1,
            Math.abs(
              a.tyreTemp -
                (a.compound === "soft"
                  ? 85
                  : a.compound === "hard"
                    ? 95
                    : a.compound === "inter"
                      ? 62
                      : 52),
            ) / 700,
          );
      g *= 1 - wet * (1 - a.stats.weather / 100) * 0.08;
      return clamp(g * (a.puncture ? 0.45 : 1), 0.3, 1.12);
    },
    wearFactor(r, a) {
      const c = this.compounds[a.compound],
        wet = r.weather.wetness;
      return (
        c.wear *
        (a.compound === "wet" || a.compound === "inter"
          ? 1 + (1 - wet) * 1.8
          : 1)
      );
    },
    errorFactor(r, a) {
      return (
        1 +
        r.weather.wetness * Math.max(0, 1 - this.grip(r, a)) * 6 +
        (a.puncture ? 1.5 : 0)
      );
    },
    bestCompound(r) {
      return r.weather.wetness > 0.65
        ? "wet"
        : r.weather.wetness > 0.22
          ? "inter"
          : "hard";
    },
    step(s, r) {
      const w = r.weather,
        dt = R.dt;
      let index = w.plan.length - 1;
      while (index > 0 && w.plan[index].time > r.time) index--;
      w.stage = index;
      const goal = w.plan[index].rain;
      w.rain += clamp(goal - w.rain, -dt * 0.025, dt * 0.025);
      w.wetness = clamp(
        w.wetness + dt * (w.rain * 0.018 - (1 - w.rain) * 0.0033),
        0,
        1,
      );
      w.trackTemp += (w.ambient + 9 - w.rain * 13 - w.trackTemp) * dt * 0.012;
      const phase =
        w.rain > 0.63
          ? "heavy-rain"
          : w.rain > 0.04
            ? "light-rain"
            : w.wetness > 0.08
              ? "drying"
              : "dry";
      if (phase !== w.phase) {
        w.phase = phase;
        R.event(
          r,
          "weather",
          "Dirección de carrera: " +
            this.weatherLabel(w) +
            ". Revisa el compuesto.",
          [],
          0,
        );
      }
      if (r.safety.active && r.time >= r.safety.until) {
        r.safety.active = false;
        R.event(
          r,
          "safety-end",
          "Fin del coche de seguridad virtual. Se permite volver al ritmo de carrera.",
          [],
          0,
        );
      }
      for (const a of r.entrants.filter(
        (a) => a.dnf && a.pit && !["none", "queued"].includes(a.pit.phase),
      )) {
        if (r.time - (a.retiredAt || 0) > 2) {
          const target =
            this.pitLateral(r.track, a.progress) +
            this.pitLayout(r.track).side * 4;
          a.lateral += clamp(target - a.lateral, -dt * 0.6, dt * 0.6);
        }
      }
      const blocked = r.entrants.filter(
        (a) => a.dnf && Math.abs(a.lateral) < r.trackWidth / 2 + 0.3,
      ).length;
      if (
        !r.safety.active &&
        (r.safety.until === 0 || r.time > r.safety.until + 4) &&
        blocked >= 2
      ) {
        r.safety = {
          active: true,
          until: r.time + 20,
          reason: "Dos vehículos obstruyen la pista",
        };
        r.flag = "yellow";
        R.event(
          r,
          "safety",
          "Coche de seguridad virtual: dos coches obstruyen la pista. Velocidad limitada y sin adelantamientos.",
          [],
          0,
        );
      }
      if (r.step % 20 === 0)
        for (const a of r.entrants.filter(
          (a) =>
            live(a) && a.companyId !== s.playerId && a.pit.phase === "none",
        )) {
          const remaining =
            G.Data.tracks[r.track].length * G.Data.tracks[r.track].laps -
            a.progress;
          if (
            (a.puncture ||
              a.fuel < 0.4 ||
              a.tires < 18 ||
              (this.grip(r, a) < 0.82 && w.wetness > 0.25)) &&
            remaining > 160
          ) {
            try {
              this.requestPit(s, a.companyId, {
                compound:
                  a.puncture || a.tires < 18 || this.grip(r, a) < 0.82
                    ? this.bestCompound(r)
                    : "keep",
                repair:
                  a.components.suspension < 45 || a.components.cooling < 45,
                fuel: a.fuel < 0.5 ? 2 : 0,
              });
            } catch {}
          }
        }
    },
    weatherLabel(w) {
      return (
        {
          dry: w.rain < 0.01 ? "Pista seca" : "Nublado",
          "light-rain": "Lluvia ligera",
          "heavy-rain": "Lluvia intensa",
          drying: "Pista secándose",
        }[w.phase] || "Pista húmeda"
      );
    },
    target(r, a, target, brakes) {
      if (!r.weekendVersion) return target;
      target *= 1 - r.weather.wetness * 0.025;
      if (a.mode === "fuel") target *= 0.94;
      if (a.mode === "defend") target *= 0.99;
      if (a.puncture) target = Math.min(target, 14);
      if (r.safety.active) target = Math.min(target, 20);
      if (a.pit.phase === "queued") {
        const d = a.pit.entry - a.progress;
        if (d > 0 && d < 130)
          target = Math.min(
            target,
            Math.sqrt(this.pitLayout(r.track).limit ** 2 + 2 * brakes * d),
          );
      }
      return target;
    },
    moved(s, r, a, moved, dt) {
      const oldRoadWear = a.roadTirePartId
        ? a.partWear[a.roadTirePartId]
        : undefined;
      a.fuel = Math.max(
        0,
        a.fuel -
          moved *
            0.00013 *
            (a.hp / 180) *
            (a.mode === "attack"
              ? 1.2
              : a.mode === "fuel"
                ? 0.7
                : a.mode === "save"
                  ? 0.9
                  : 1) -
          dt * 0.000035,
      );
      const temp =
        r.weather.trackTemp +
        a.speed * 0.8 +
        (a.mode === "attack" ? 15 : 6) -
        (a.compound === "wet" || a.compound === "inter"
          ? r.weather.wetness * 18
          : 0);
      a.tyreTemp += (temp - a.tyreTemp) * dt * 0.06;
      if (a.compound === "road") {
        a.roadCondition = a.tires;
        a.roadPuncture = a.puncture;
      } else if (oldRoadWear !== undefined)
        a.partWear[a.roadTirePartId] = oldRoadWear;
      if (a.tires < 20 && !a.punctureWarned) {
        a.punctureWarned = true;
        R.event(
          r,
          "radio",
          `${a.name}: gomas por debajo del 20 %. Aumenta el riesgo de pinchazo.`,
          [a.carId],
          a.progress,
        );
      }
      if (a.fuel < 0.4 && !a.lowFuelWarned) {
        a.lowFuelWarned = true;
        R.event(
          r,
          "radio",
          `${a.name}: combustible bajo. Necesito ahorrar o repostar.`,
          [a.carId],
          a.progress,
        );
      }
      if (
        !a.puncture &&
        a.tires < 12 &&
        a.speed > 15 &&
        G.random(r) < dt * 0.008 * (1 + (12 - a.tires) / 8)
      ) {
        a.puncture = true;
        if (a.compound === "road") a.roadPuncture = true;
        R.damageCar(a, 1, 2);
        R.event(
          r,
          "puncture",
          `${a.name} sufre un pinchazo con el neumático desgastado.`,
          [a.carId],
          a.progress,
        );
        R.caution(r, a.progress, 6);
      }
      if (a.fuel <= 0 && !a.dnf) R.retire(r, a, "Sin combustible");
    },
    pitQuote(s, cid, options = {}) {
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === cid);
      G.assert(
        r?.weekendVersion === 1 &&
          live(a) &&
          a.pit.phase === "none" &&
          !r.finished,
        "No hay un coche disponible para entrar en boxes.",
      );
      const compound = options.compound || "keep";
      G.assert(
        compound === "keep" || this.compounds[compound],
        "Compuesto inválido.",
      );
      const fuel = Number(options.fuel) || 0;
      G.assert(
        [0, 1, 2, 4].includes(fuel) &&
          typeof (options.repair ?? false) === "boolean",
        "Servicio de boxes inválido.",
      );
      G.assert(
        fuel <= 8 - a.fuel + 0.0001,
        "El depósito admite un máximo de 8 L.",
      );
      const p = this.pitLayout(r.track),
        len = G.Data.tracks[r.track].length;
      let entry = Math.floor((a.progress + 65) / len) * len + p.entry;
      if (entry < a.progress + 65) entry += len;
      G.assert(
        entry < len * G.Data.tracks[r.track].laps,
        "Ya no hay otra entrada de boxes antes de la meta.",
      );
      const q =
        compound === "keep"
          ? { cost: 0, set: null }
          : this.tyreQuote(s, cid, compound);
      G.assert(
        s.raceSupplies.fuelStock >= fuel,
        "No queda combustible suficiente en el depósito de boxes.",
      );
      const service = 55 + (options.repair ? 140 : 0) + fuel * 5;
      G.assert(
        s.companies.find((c) => c.id === cid).balance >= q.cost + service,
        "No puedes financiar el juego y el servicio de boxes.",
      );
      return {
        ...q,
        entry,
        exit: entry + (p.exit - p.entry),
        compound,
        fuel,
        repair: !!options.repair,
        service,
        total: q.cost + service,
      };
    },
    requestPit(s, cid = s.playerId, options = {}) {
      const q = this.pitQuote(s, cid, options),
        r = s.race,
        a = r.entrants.find((a) => a.companyId === cid),
        t =
          q.compound === "keep"
            ? null
            : this.reserve(s, cid, q.compound, r.eventId);
      s.raceSupplies.fuelStock -= q.fuel;
      a.pit = {
        phase: "queued",
        limiter: a.pit.limiter,
        entry: q.entry,
        exit: q.exit,
        box:
          q.entry +
          (q.exit - q.entry) * (0.32 + ((a.gridIndex % 10) / 9) * 0.36),
        compound: q.compound,
        setId: t?.id || null,
        repair: q.repair,
        fuel: q.fuel,
        remaining: 0,
        paid: false,
        overspeed: 0,
        sanctioned: false,
        mergeWait: false,
      };
      R.event(
        r,
        "pit-order",
        `${a.name}: boxes en la próxima entrada. ${q.compound === "keep" ? "Mantener gomas" : this.compounds[q.compound].name}${q.repair ? ", reparación rápida" : ""}${q.fuel ? ", repostar " + q.fuel + " L" : ""}.`,
        [a.carId],
        a.progress,
      );
      return a.pit;
    },
    cancelPit(s, cid = s.playerId) {
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === cid);
      G.assert(
        a?.pit.phase === "queued",
        "Solo puedes cancelar antes de entrar en el carril.",
      );
      this.releasePit(s, a);
      a.pit = { phase: "none", limiter: a.pit.limiter };
      R.event(
        r,
        "pit-cancel",
        `${a.name}: cancelada la parada. El juego comprado permanece en el almacén.`,
        [a.carId],
        a.progress,
      );
    },
    releasePit(s, a) {
      const t = s.raceSupplies.sets.find((t) => t.id === a.pit.setId);
      if (t?.status === "reserved") {
        t.status = "stored";
        t.eventId = null;
      }
      if (a.pit.fuel) {
        if (a.pit.paid) {
          G.Economy.transact(
            s,
            a.companyId,
            a.pit.fuel * 5,
            "Carrera",
            "Repostaje no servido · devolución",
          );
          s.partsSupplier.balance -= a.pit.fuel * 5;
        }
        s.raceSupplies.fuelStock += a.pit.fuel;
        a.pit.fuel = 0;
      }
    },
    discard(s, id) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera para gestionar el almacén.");
      const t = s.raceSupplies.sets.find(
        (t) =>
          t.id === id && t.companyId === s.playerId && t.status === "stored",
      );
      G.assert(t, "Este juego está en uso o reservado.");
      t.status = "used";
    },
    fitSet(s, r, a, t) {
      if (a.tyreSetId) {
        const old = s.raceSupplies.sets.find((t) => t.id === a.tyreSetId);
        if (old) {
          old.condition = round(a.tires);
          old.status = old.condition >= 15 ? "stored" : "used";
          old.eventId = null;
        }
      }
      a.compound = t?.compound || "road";
      a.tyreSetId = t?.id || null;
      a.tires = t ? t.condition : a.roadCondition;
      a.components.tires = a.tires;
      a.tyreTemp = 48;
      a.puncture = t ? false : a.roadPuncture;
      a.punctureWarned = false;
      if (t) {
        t.status = "running";
        t.eventId = r.eventId;
      }
    },
    drivePit(s, r, a, dt) {
      const p = a.pit;
      if (!p || p.phase === "none") return false;
      if (p.phase === "queued") {
        if (a.progress < p.entry) return false;
        p.phase = "entry";
        a.progress = Math.max(a.progress, p.entry);
        R.event(
          r,
          "pit-in",
          `${a.name} entra en el carril de boxes.`,
          [a.carId],
          a.progress,
        );
      }
      const layout = this.pitLayout(r.track),
        u = (a.progress - p.entry) / (p.exit - p.entry);
      if (p.phase === "box") {
        a.speed = 0;
        p.remaining = Math.max(0, p.remaining - dt);
        a.thermal += (55 - a.thermal) * dt * 0.04;
        if (p.remaining === 0) {
          if (p.compound !== "keep")
            this.fitSet(
              s,
              r,
              a,
              p.setId
                ? s.raceSupplies.sets.find((t) => t.id === p.setId)
                : null,
            );
          if (p.repair) {
            for (const [key, amount, cap] of [
              ["body", 20, 85],
              ["suspension", 15, 80],
              ["cooling", 20, 80],
            ])
              a.components[key] = Math.max(
                a.components[key],
                Math.min(cap, a.components[key] + amount),
              );
            a.condition = G.Workshop.summary(a.components);
          }
          const fuel = Math.min(p.fuel, 8 - a.fuel);
          a.fuel += fuel;
          s.raceSupplies.fuelStock += p.fuel - fuel;
          p.fuel = 0;
          p.phase = "exit";
          a.pitStops++;
          a.unservedPenalty = 0;
          R.event(
            r,
            "pit-service",
            `${a.name} completa el servicio y sale de su puesto.`,
            [a.carId],
            a.progress,
          );
        }
        return true;
      }
      const max = p.limiter ? layout.limit : 25;
      a.speed = Math.max(0, a.speed + clamp(max - a.speed, -10 * dt, 3 * dt));
      if (u > 0.1 && u < 0.9 && a.speed > layout.limit + 1.1) {
        p.overspeed += dt;
        if (p.overspeed > 0.75 && !p.sanctioned) {
          p.sanctioned = true;
          a.totalPenalty += 5;
          a.unservedPenalty += 5;
          R.event(
            r,
            "penalty",
            `${a.name}: 5 segundos por exceso de velocidad en boxes.`,
            [a.carId],
            a.progress,
          );
        }
      }
      let moved = a.speed * dt;
      for (const b of r.entrants)
        if (
          b !== a &&
          (live(b) || (b.dnf && Math.abs(b.lateral - a.lateral) < 2.1)) &&
          b.pit &&
          ["entry", "box", "exit"].includes(b.pit.phase) &&
          b.progress > a.progress &&
          b.progress - a.progress < 10
        )
          moved = Math.min(moved, Math.max(0, b.progress - a.progress - 5.1));
      if (p.phase === "exit" && u > 0.85) {
        const eta = (p.exit - a.progress) / Math.max(a.speed, 8),
          unsafe = r.entrants.some(
            (b) =>
              b !== a &&
              this.onTrack(b) &&
              Math.abs(
                R.relative(
                  { progress: p.exit },
                  { progress: b.progress + b.speed * eta },
                  G.Data.tracks[r.track].length,
                ),
              ) < 13,
          );
        if (unsafe) {
          moved = 0;
          a.speed = 0;
          p.mergeWait = true;
        } else p.mergeWait = false;
      }
      const limit = p.phase === "entry" ? p.box : p.exit;
      moved = Math.min(moved, Math.max(0, limit - a.progress));
      a.progress += moved;
      if (moved < 0.00001) a.speed = 0;
      a.lateral = this.pitLateral(r.track, a.progress);
      a.headingSlip = 0;
      a.braking = a.speed > max + 0.1;
      a.offTrack = false;
      const roadWear = a.roadTirePartId
        ? a.partWear[a.roadTirePartId]
        : undefined;
      a.tires = Math.max(0, a.tires - moved * 0.0005 * this.wearFactor(r, a));
      G.Workshop.wear(a, moved, dt, 0);
      if (a.compound !== "road" && roadWear !== undefined)
        a.partWear[a.roadTirePartId] = roadWear;
      this.moved(s, r, a, moved, dt);
      if (!live(a)) return true;
      if (p.phase === "entry" && a.progress >= p.box - 0.001) {
        a.speed = 0;
        p.phase = "box";
        p.remaining =
          (6 + G.random(r) * 2 + (p.repair ? 12 : 0) + p.fuel * 1.2) *
            G.Staff.pitFactor(a) +
          a.unservedPenalty;
        const cost = 55 + (p.repair ? 140 : 0) + p.fuel * 5;
        G.Economy.transact(
          s,
          a.companyId,
          -cost,
          "Carrera",
          `Servicio de boxes · ${a.name}`,
        );
        s.partsSupplier.balance += cost;
        p.paid = true;
        R.event(
          r,
          "pit-box",
          `${a.name}: coche detenido, servicio en curso.`,
          [a.carId],
          a.progress,
        );
      }
      if (p.phase === "exit" && a.progress >= p.exit - 0.001) {
        a.lateral = 0;
        a.pit = { phase: "none", limiter: p.limiter };
        R.event(
          r,
          "pit-out",
          `${a.name} se reincorpora a pista.`,
          [a.carId],
          a.progress,
        );
      }
      a.lane = a.lateral / R.worldScale(r.track);
      return true;
    },
    record(r, force = false) {
      const rec = r.replay;
      if (!rec || (!force && r.step % rec.sampleEvery)) return;
      const keys = Object.keys(this.compounds),
        previous = rec.frames.at(-1);
      const cars = rec.cars.map((m, i) => {
        const a = r.entrants.find((a) => a.carId === m.carId);
        if (!a)
          return previous
            ? previous.cars[i].map((n, k) =>
                k === 2 ? 0 : k === 7 ? n | 1 : n,
              )
            : [0, 0, 0, 0, 100, 100, 100, 1, 0, 100];
        m.finishTime = a.finishTime;
        let flags =
          (a.dnf ? 1 : 0) |
          (a.finishTime !== null ? 2 : 0) |
          (a.braking ? 4 : 0) |
          (a.incident === "spin" ? 8 : 0) |
          (a.incident === "slide" ? 16 : 0) |
          (!this.onTrack(a) && !a.dnf && a.finishTime === null ? 32 : 0);
        return [
          round(a.progress),
          round(a.lateral, 2),
          round(a.speed),
          round(a.headingSlip, 3),
          round(a.tires),
          round(a.condition),
          round(a.components.body),
          flags,
          keys.indexOf(a.compound),
          round(a.components.engine),
        ];
      });
      const f = {
        time: round(r.time, 3),
        cars,
        weather: [
          round(r.weather.rain, 3),
          round(r.weather.wetness, 3),
          round(r.weather.ambient),
        ],
        safety: r.safety.active,
        cautions: r.cautions.map((c) => [round(c.progress), round(c.until, 3)]),
      };
      if (previous?.time === f.time) rec.frames[rec.frames.length - 1] = f;
      else rec.frames.push(f);
      if (rec.frames.length > 480) {
        rec.frames = rec.frames.filter(
          (_, i) => i % 2 === 0 || i === rec.frames.length - 1,
        );
        rec.sampleEvery *= 2;
      }
      rec.duration = f.time;
    },
    afterStep(r) {
      if (!r.weekendVersion) return;
      r.replay.duration = round(r.time, 3);
      for (const a of r.entrants)
        if (a.finishTime !== null && !a.penaltyApplied) {
          a.finishTime += a.unservedPenalty;
          a.penaltyApplied = true;
        }
      for (const e of [...r.events].reverse())
        if (Number(e.id.split("-").at(-1)) > r.replay.lastEvent) {
          r.replay.events.push(G.clone(e));
          r.replay.lastEvent = Number(e.id.split("-").at(-1));
        }
      r.replay.events = r.replay.events.slice(-120);
      this.record(r, r.finished);
    },
    finish(s, r) {
      this.record(r, true);
      s.raceSupplies.lastReplay = G.clone(r.replay);
      for (const a of r.entrants) {
        if (a.tyreSetId) {
          const t = s.raceSupplies.sets.find((t) => t.id === a.tyreSetId);
          if (t) {
            t.condition = round(a.tires);
            t.status = t.condition >= 15 ? "stored" : "used";
            t.eventId = null;
          }
        }
        if (a.pit.phase !== "none") this.releasePit(s, a);
        a.tires = a.roadCondition;
        a.components.tires = a.roadCondition;
      }
      for (const t of s.raceSupplies.sets.filter(
        (t) => t.eventId === r.eventId,
      )) {
        t.status = t.condition >= 15 ? "stored" : "used";
        t.eventId = null;
      }
      s.raceSupplies.sets = s.raceSupplies.sets
        .filter((t) => t.status !== "used")
        .concat(
          s.raceSupplies.sets.filter((t) => t.status === "used").slice(-80),
        );
    },
    playback(rec, time) {
      const t = clamp(time, 0, rec.duration);
      let hi = rec.frames.findIndex((f) => f.time >= t);
      if (hi < 0) hi = rec.frames.length - 1;
      const b = rec.frames[hi],
        a = rec.frames[Math.max(0, hi - 1)],
        ratio = b.time > a.time ? (t - a.time) / (b.time - a.time) : 0;
      const w = b.weather;
      return {
        track: rec.track,
        time: t,
        step: Math.floor(t * 20),
        trackWidth: 12.4,
        cautions: b.cautions
          .map((c) => ({ progress: c[0], until: c[1] }))
          .filter((c) => c.until > t),
        weather: { rain: w[0], wetness: w[1], ambient: w[2] },
        safety: { active: b.safety },
        events: rec.events
          .filter((e) => e.time <= t)
          .slice()
          .reverse(),
        entrants: rec.cars.map((m, i) => {
          const x = a.cars[i],
            y = b.cars[i],
            flags = ratio < 1 ? x[7] : y[7],
            blend = (k) => x[k] + (y[k] - x[k]) * ratio;
          return {
            ...m,
            progress: blend(0),
            lateral: blend(1),
            speed: blend(2),
            headingSlip: blend(3),
            tires: blend(4),
            condition: blend(5),
            components: { body: blend(6), engine: blend(9) },
            dnf: !!(flags & 1),
            finishTime: flags & 2 ? (m.finishTime ?? t) : null,
            braking: !!(flags & 4),
            incident: flags & 8 ? "spin" : flags & 16 ? "slide" : null,
            incidentUntil: flags & (8 | 16) ? t + 1 : 0,
            offTrack: false,
            compound: Object.keys(W.compounds)[y[8]],
            pit: flags & 32 ? { phase: "box" } : { phase: "none" },
          };
        }),
      };
    },
    validateReplay(s, rec) {
      if (rec === null) return;
      G.assert(
        rec &&
          rec.version === 1 &&
          Number.isInteger(rec.track) &&
          G.Data.tracks[rec.track] &&
          typeof rec.eventId === "string" &&
          finite(rec.duration) &&
          rec.duration >= 0 &&
          Number.isInteger(rec.sampleEvery) &&
          [10, 20, 40, 80, 160].includes(rec.sampleEvery) &&
          Array.isArray(rec.cars) &&
          rec.cars.length <= 40 &&
          rec.cars.length > 0 &&
          Array.isArray(rec.frames) &&
          rec.frames.length > 0 &&
          rec.frames.length <= 480 &&
          Array.isArray(rec.events) &&
          rec.events.length <= 120,
        "Repetición inválida.",
      );
      G.assert(rec.frames[0].time === 0, "Falta el inicio de la grabación.");
      const seen = new Set();
      for (const m of rec.cars) {
        G.assert(
          m &&
            s.cars.some((c) => c.id === m.carId) &&
            s.drivers.some((d) => d.id === m.driverId) &&
            !seen.has(m.carId) &&
            typeof m.name === "string" &&
            typeof m.team === "string" &&
            /^#[a-f0-9]{6}$/i.test(m.color) &&
            finite(m.length) &&
            m.length > 0 &&
            finite(m.width) &&
            m.width > 0,
          "Participante de repetición inválido.",
        );
        seen.add(m.carId);
      }
      let previous = -1;
      for (const f of rec.frames) {
        G.assert(
          f &&
            finite(f.time) &&
            f.time > previous &&
            f.time <= rec.duration + 0.1 &&
            Array.isArray(f.cars) &&
            f.cars.length === rec.cars.length &&
            Array.isArray(f.weather) &&
            f.weather.length === 3 &&
            f.weather.every(finite) &&
            f.weather[0] >= 0 &&
            f.weather[0] <= 1 &&
            f.weather[1] >= 0 &&
            f.weather[1] <= 1 &&
            typeof f.safety === "boolean" &&
            Array.isArray(f.cautions) &&
            f.cautions.length <= 8 &&
            f.cautions.every(
              (c) => Array.isArray(c) && c.length === 2 && c.every(finite),
            ) &&
            f.cars.every(
              (a) =>
                Array.isArray(a) &&
                a.length === 10 &&
                a.every(finite) &&
                Math.abs(a[1]) <= 25 &&
                a[2] >= 0 &&
                a[4] >= 0 &&
                a[4] <= 100 &&
                a[5] >= 0 &&
                a[5] <= 100 &&
                Number.isInteger(a[7]) &&
                a[7] >= 0 &&
                a[7] < 64 &&
                Number.isInteger(a[8]) &&
                a[8] >= 0 &&
                a[8] < 5,
            ),
          "Fotograma corrupto.",
        );
        previous = f.time;
      }
      for (const e of rec.events)
        G.assert(
          finite(e.time) &&
            e.time >= 0 &&
            e.time <= rec.duration + 0.1 &&
            typeof e.text === "string" &&
            typeof e.type === "string" &&
            Array.isArray(e.carIds) &&
            e.carIds.every((id) => seen.has(id)),
          "Evento de repetición inválido.",
        );
    },
    validate(s) {
      if (s.raceSupplies === undefined) return;
      const d = s.raceSupplies;
      G.assert(
        d.version === 1 &&
          d.stock &&
          ["soft", "hard", "inter", "wet"].every(
            (k) =>
              Number.isInteger(d.stock[k]) &&
              d.stock[k] >= 0 &&
              d.stock[k] <= 32,
          ) &&
          finite(d.fuelStock) &&
          d.fuelStock >= 0 &&
          d.fuelStock <= 160 &&
          Number.isInteger(d.lastRestock) &&
          d.lastRestock >= -1 &&
          d.lastRestock <= s.day &&
          Array.isArray(d.sets),
        "Suministros de carrera inválidos.",
      );
      const ids = new Set();
      for (const t of d.sets) {
        G.assert(
          t &&
            /^tyreset-[0-9]+$/.test(t.id) &&
            !ids.has(t.id) &&
            s.companies.some((c) => c.id === t.companyId) &&
            t.compound !== "road" &&
            this.compounds[t.compound] &&
            finite(t.condition) &&
            t.condition >= 0 &&
            t.condition <= 100 &&
            ["stored", "reserved", "running", "used"].includes(t.status) &&
            (t.eventId === null || typeof t.eventId === "string"),
          "Juego de competición corrupto.",
        );
        ids.add(t.id);
      }
      this.validateReplay(s, d.lastReplay);
      for (const e of s.season.events)
        for (const row of e.results)
          if (row.compound !== undefined)
            G.assert(
              this.compounds[row.compound] &&
                Number.isInteger(row.pitStops) &&
                row.pitStops >= 0 &&
                finite(row.penalty) &&
                row.penalty >= 0,
              "Resultado de estrategia inválido.",
            );
      for (const e of s.season.events.filter(
        (e) => e.entry?.compound !== undefined,
      )) {
        G.assert(
          this.compounds[e.entry.compound] && [1, 3].includes(e.entry.fuel),
          "Estrategia de salida inválida.",
        );
      }
      for (const e of s.season.events.filter(
        (e) => e.status === "scheduled" && e.entry?.tyreSetId,
      )) {
        const t = d.sets.find((t) => t.id === e.entry.tyreSetId);
        G.assert(
          t &&
            t.companyId === s.playerId &&
            ((t.eventId === e.id && t.status === "reserved") ||
              s.race?.eventId === e.id),
          "Juego inscrito sin reserva válida.",
        );
      }
      const r = s.race;
      if (!r?.weekendVersion) return;
      G.assert(
        r.weekendVersion === 1 &&
          r.weather &&
          r.safety &&
          typeof r.safety.active === "boolean" &&
          finite(r.safety.until) &&
          Array.isArray(r.weather.plan) &&
          r.weather.plan.length === 3 &&
          r.weather.plan.every(
            (p) =>
              finite(p.time) &&
              p.time >= 0 &&
              finite(p.rain) &&
              p.rain >= 0 &&
              p.rain <= 1,
          ) &&
          finite(r.weather.rain) &&
          r.weather.rain >= 0 &&
          r.weather.rain <= 1 &&
          finite(r.weather.wetness) &&
          r.weather.wetness >= 0 &&
          r.weather.wetness <= 1 &&
          finite(r.weather.ambient) &&
          finite(r.weather.trackTemp),
        "Clima o dirección de carrera corruptos.",
      );
      this.validateReplay(s, r.replay);
      const running = new Set();
      for (const a of r.entrants) {
        G.assert(
          this.compounds[a.compound] &&
            typeof a.roadPuncture === "boolean" &&
            Number.isInteger(a.gridIndex) &&
            a.gridIndex >= 0 &&
            a.gridIndex < 40 &&
            finite(a.fuelInitial) &&
            [1, 3].includes(a.fuelInitial) &&
            finite(a.roadCondition) &&
            a.roadCondition >= 0 &&
            a.roadCondition <= 100 &&
            finite(a.tyreTemp) &&
            finite(a.fuel) &&
            a.fuel >= 0 &&
            a.fuel <= 8 &&
            typeof a.puncture === "boolean" &&
            Number.isInteger(a.pitStops) &&
            a.pitStops >= 0 &&
            finite(a.totalPenalty) &&
            a.totalPenalty >= 0 &&
            finite(a.unservedPenalty) &&
            a.unservedPenalty >= 0 &&
            a.pit &&
            ["none", "queued", "entry", "box", "exit"].includes(a.pit.phase) &&
            typeof a.pit.limiter === "boolean",
          "Estrategia de carrera corrupta.",
        );
        if (a.tyreSetId) {
          const t = d.sets.find((t) => t.id === a.tyreSetId);
          G.assert(
            t &&
              t.companyId === a.companyId &&
              t.status === "running" &&
              t.eventId === r.eventId &&
              !running.has(t.id),
            "Juego activo duplicado o ajeno.",
          );
          running.add(t.id);
        }
        if (a.pit.phase !== "none") {
          const p = a.pit;
          G.assert(
            [p.entry, p.exit, p.box, p.remaining, p.fuel, p.overspeed].every(
              finite,
            ) &&
              p.entry < p.box &&
              p.box < p.exit &&
              p.remaining >= 0 &&
              p.fuel >= 0 &&
              p.fuel <= 4 &&
              typeof p.repair === "boolean" &&
              typeof p.paid === "boolean" &&
              typeof p.sanctioned === "boolean" &&
              typeof p.mergeWait === "boolean" &&
              (p.compound === "keep" || this.compounds[p.compound]),
            "Parada en boxes corrupta.",
          );
          if (p.setId) {
            const t = d.sets.find((t) => t.id === p.setId);
            G.assert(
              t &&
                t.companyId === a.companyId &&
                t.compound === p.compound &&
                ["reserved", "running"].includes(t.status),
              "Juego de boxes no reservado.",
            );
          }
        }
      }
    },
  });
  const register = R.register,
    withdraw = R.withdraw,
    start = R.start,
    finish = R.finish;
  R.register = function (s, eventId, driverId, carId, options = {}) {
    const q = W.entryQuote(
      s,
      s.playerId,
      options.compound || "road",
      options.fuel || 3,
    );
    G.assert(
      G.player(s).balance >= q.total,
      "No hay fondos para inscripción, transporte y el juego seleccionado.",
    );
    register.call(this, s, eventId, driverId, carId);
    const e = s.season.events.find((e) => e.id === eventId),
      t = W.reserve(s, s.playerId, q.compound, eventId);
    e.entry.tyreSetId = t?.id || null;
    e.entry.compound = q.compound;
    e.entry.fuel = q.fuel;
  };
  R.withdraw = function (s, id) {
    const e = s.season.events.find((e) => e.id === id),
      entry = e?.entry;
    withdraw.call(this, s, id);
    W.releaseEntry(s, { entry });
  };
  R.start = function (s, id, skip = false) {
    const r = start.call(this, s, id, skip);
    return W.start(s, r);
  };
  R.finish = function (s) {
    const r = s.race;
    if (r?.weekendVersion) {
      G.assert(r.finished, "La carrera aún está en curso.");
      W.finish(s, r);
    }
    return finish.call(this, s);
  };
})();
