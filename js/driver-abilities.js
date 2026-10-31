"use strict";
(() => {
  const G = RCS;
  const conditions = {
    wet: "con la pista mojada",
    worn: "con neumáticos entre el 5 % y el 45 %",
    start: "durante los primeros 35 segundos",
    closing: "en la última vuelta",
    traffic: "con un rival a menos de 25 metros",
    clear: "con pista libre por delante",
    heat: "con asfalto por encima de 35 °C",
    tired: "con fatiga entre 35 y 80",
    hairpin: "en curvas cerradas",
    sweeper: "en curvas rápidas",
    chase: "fuera del podio",
    lead: "liderando la carrera",
  };
  const groups = [
    [
      "wet",
      "Domador de lluvia|Frenada en mojado|Explorador de charcos|Escudo de agua|Pulso de tormenta|Radar de lluvia|Guardián del dibujo|Ritmo bajo el agua",
    ],
    [
      "worn",
      "Equilibrista de gomas|Freno delicado|Cazador de última goma|Defensor con desgaste|Regular hasta el límite|Lector del desgaste|Conservador de caucho|Impulso residual",
    ],
    [
      "start",
      "Manos de salida|Primera frenada|Lanzador de ataques|Guardián de parrilla|Salida metódica|Reflejos de semáforo|Gomas despiertas|Arranque decidido",
    ],
    [
      "closing",
      "Control de cierre|Última referencia|Último asalto|Candado final|Finalizador sereno|Cuenta atrás|Último dibujo|Ritmo de bandera",
    ],
    [
      "traffic",
      "Equilibrio en pelotón|Frenada entre coches|Buscador de huecos|Muralla móvil|Pulso en tráfico|Visión periférica|Caucho en combate|Ritmo de grupo",
    ],
    [
      "clear",
      "Trazada libre|Referencias propias|Preparador solitario|Alerta de retrovisor|Vueltas limpias|Concentración aislada|Gestor de pista libre|Especialista de aire limpio",
    ],
    [
      "heat",
      "Control tropical|Freno en verano|Ataque de calor|Defensa al sol|Pulso estival|Lector del asfalto caliente|Protector térmico|Ritmo de verano",
    ],
    [
      "tired",
      "Manos resistentes|Frenador resistente|Atacante incansable|Defensa resistente|Regularidad resistente|Concentración resistente|Gestor cansado|Ritmo resistente",
    ],
    [
      "hairpin",
      "Maestro de horquillas|Frenada de horquilla|Cazador del vértice|Cierre del vértice|Repetidor de vértices|Lector de horquillas|Cuidador del giro|Impulso de horquilla",
    ],
    [
      "sweeper",
      "Apoyo rápido|Frenada de apoyo|Ataque en curva rápida|Escudo de apoyo|Arco constante|Visión de curva larga|Caucho de apoyo|Ritmo de curva rápida",
    ],
    [
      "chase",
      "Control de remontada|Frenada de remontada|Remontador paciente|Escudo de remontada|Regularidad de remontada|Visión de remontada|Gomas de remontada|Perseguidor",
    ],
    [
      "lead",
      "Control de líder|Referencias de líder|Lectura de doblados|Guardián del liderato|Líder constante|Cabeza fría al frente|Administrador de ventaja|Ritmo de líder",
    ],
  ];
  const keys = [
    "control",
    "brakes",
    "overtake",
    "defense",
    "consistency",
    "focus",
    "tires",
    "pace",
  ];
  const specials = [
    [
      "motivador",
      "Motivador",
      "Compensa parte de la pérdida de ritmo con gomas gastadas: hasta +6 Velocidad y +2 Control. No actúa con pinchazo ni restaura agarre.",
    ],
    [
      "autonomo",
      "Autónomo",
      "Aprende hasta un 35 % más en entrenamientos pagados. Mantiene días, costes, fatiga y límite de potencial.",
    ],
    [
      "tramposo",
      "Tramposo",
      "Puede buscar contacto al atacar con riesgo alto. Puede dañar su propio coche; en carreras profesionales se expone a sanciones.",
    ],
    [
      "mal-perdedor",
      "Mal perdedor",
      "Con tres o más participantes sin abandonar, al quedar último después de 35 segundos intenta remontar durante 24 segundos: +14 Velocidad y +6 Adelantamiento. Solo una vez por carrera, con más desgaste.",
    ],
    [
      "testarudo",
      "Testarudo",
      "Gana +8 Defensa bajo ataque, a costa de 2 puntos de Adelantamiento. Respeta el espacio del coche emparejado.",
    ],
    [
      "drifting",
      "Drifting",
      "Puede preparar una pequeña rotación de salida desde Control 45. Más Control mejora la ejecución; sigue necesitando agarre y asumiendo desgaste.",
    ],
    [
      "analitico",
      "Analítico",
      "Aprende un 15 % más al entrenar Frenada, Control o Consistencia.",
    ],
    [
      "pupilo",
      "Pupilo aplicado",
      "Aprende un 15 % más en un programa con entrenador de nivel 4 o superior.",
    ],
    [
      "manos-suaves",
      "Manos suaves",
      "Reduce un 6 % el desgaste continuo de neumáticos; no evita un pinchazo ni los daños de un bloqueo.",
    ],
    [
      "resiliente",
      "Resiliente",
      "Con fatiga moderada conserva +5 Concentración y +3 Consistencia, sin eliminar la fatiga.",
    ],
    [
      "adaptable",
      "Adaptable",
      "Con la pista mojada gana +4 Adaptación al clima y +3 Control.",
    ],
    [
      "sereno",
      "Sereno",
      "Bajo presión gana +5 Disciplina y +3 Concentración para ejecutar con menos errores.",
    ],
  ].map(([id, name, description]) => ({
    id,
    name,
    description,
    kind: "special",
  }));
  const catalog = [...specials];
  for (const [condition, names] of groups)
    names.split("|").forEach((name, i) => {
      const amount = i === 7 ? 4 : i === 2 || i === 3 ? 6 : 5;
      catalog.push({
        id: `${condition}-${keys[i]}`,
        name,
        condition,
        stat: keys[i],
        amount,
        kind: "situational",
        description: `+${amount} ${G.Drivers.labels[keys[i]]} ${conditions[condition]}. El atributo efectivo nunca supera 100; se mantienen los límites del coche.`,
      });
    });
  const B = (G.DriverAbilities = {
    catalog,
    byId: Object.fromEntries(catalog.map((x) => [x.id, x])),
    seeded(s, d) {
      const h = G.AuctionContent.hash(
          `${s.seed}/${d.identity || d.id}/abilities`,
        ),
        random = { rng: h },
        roll = G.random(random),
        count = roll < 0.2 ? 1 : roll < 0.6 ? 2 : 3,
        ids = [];
      for (let i = 0; ids.length < count; i++) {
        const id = catalog[Math.floor(G.random(random) * catalog.length)].id;
        if (!ids.includes(id)) ids.push(id);
      }
      return ids;
    },
    ids(s, d) {
      return G.DriverWorld?.enabled(s)
        ? s.driverWorld.talents[d.id] || B.seeded(s, d)
        : [];
    },
    list(s, d) {
      return B.ids(s, d).map((id) => B.byId[id]);
    },
    has(a, id) {
      return !!a.abilities?.ids.includes(id);
    },
    context(r, a) {
      const t = G.Data.tracks[r.track],
        ordered = G.Race.positions(r).filter((o) => !o.dnf),
        position = ordered.indexOf(a) + 1,
        front = r.entrants.some(
          (o) =>
            o !== a &&
            !o.dnf &&
            o.finishTime === null &&
            G.Race.relative(a, o, t.length) > 0 &&
            G.Race.relative(a, o, t.length) < 25,
        ),
        rear = r.entrants.some(
          (o) =>
            o !== a &&
            !o.dnf &&
            o.finishTime === null &&
            G.Race.relative(a, o, t.length) < 0 &&
            G.Race.relative(a, o, t.length) > -25,
        ),
        limit = G.Racecraft.sample(r.track, a.progress).limit;
      return {
        wet: r.weather.wetness > 0.25,
        worn: a.tires > 5 && a.tires < 45 && !a.puncture,
        start: r.time < 35,
        closing: a.progress >= t.length * (t.laps - 1),
        traffic: front || rear,
        clear: !front,
        heat: r.weather.trackTemp > 35,
        tired: a.fatigue >= 35 && a.fatigue < 80,
        hairpin: limit < 24,
        sweeper: limit >= 24 && limit < 45,
        chase: position > 3,
        lead: position === 1,
        position,
        total: ordered.length,
        rear,
      };
    },
    before(s, r, a) {
      const x = a.abilities;
      if (x) x.clock = r.time;
      if (!x || r.time < x.nextUpdate) return;
      x.nextUpdate = r.time + 0.25;
      const c = B.context(r, a),
        bonus = {},
        active = [];
      const add = (key, n) => (bonus[key] = (bonus[key] || 0) + n);
      if (
        B.has(a, "mal-perdedor") &&
        !x.boostUsed &&
        r.time >= 35 &&
        c.total >= 3 &&
        c.position === c.total &&
        a.pit.phase === "none" &&
        !a.incident &&
        !a.puncture &&
        !G.Race.underYellow(r, a)
      ) {
        x.boostUsed = true;
        x.boostUntil = r.time + 24;
        G.Race.event(
          r,
          "ability",
          `${a.name}: mal perdedor, intenta una remontada durante 24 segundos.`,
          [a.carId],
          a.progress,
        );
      }
      for (const id of x.ids) {
        const ability = B.byId[id];
        if (ability.kind === "situational" && c[ability.condition]) {
          add(ability.stat, ability.amount);
          active.push(id);
        }
        if (id === "motivador" && c.worn) {
          const strength = G.clamp((60 - a.tires) / 55, 0, 1);
          add("pace", 6 * strength);
          add("control", 2 * strength);
          active.push(id);
        }
        if (id === "mal-perdedor" && x.boostUntil > r.time) {
          add("pace", 14);
          add("overtake", 6);
          active.push(id);
        }
        if (id === "testarudo" && c.rear) {
          add("defense", 8);
          add("overtake", -2);
          active.push(id);
        }
        if (id === "resiliente" && c.tired) {
          add("focus", 5);
          add("consistency", 3);
          active.push(id);
        }
        if (id === "adaptable" && c.wet) {
          add("weather", 4);
          add("control", 3);
          active.push(id);
        }
        if (id === "sereno" && c.traffic) {
          add("discipline", 5);
          add("focus", 3);
          active.push(id);
        }
      }
      for (const key of G.Drivers.stats)
        a.stats[key] = G.clamp(x.baseStats[key] + (bonus[key] || 0), 0, 100);
      x.active = active;
    },
    tactic(r, a, c, result) {
      const x = a.abilities,
        p = a.directive?.plan,
        front = c.front;
      if (
        !x ||
        !B.has(a, "tramposo") ||
        !front ||
        c.yellow ||
        r.safety.active ||
        a.pit.phase !== "none" ||
        a.incident ||
        ["clean", "follow"].includes(p.tactic) ||
        p.risk < 45 ||
        a.speed < 8
      )
        return result;
      if (front.gap < 12 && front.gap > 2 && r.time > x.nextDirty) {
        x.nextDirty = r.time + 8;
        if (G.random(x) < 0.3) {
          x.dirtyUntil = r.time + 2;
          x.dirtyTarget = front.b.carId;
        }
      }
      if (x.dirtyUntil > r.time && x.dirtyTarget === front.b.carId) {
        result.lateral = front.b.lateral;
        result.target = Math.min(
          a.skills.envelope.driver,
          a.top / 3.6,
          Math.max(result.target, front.b.speed + 1.5),
        );
        result.passing = true;
        a.brain.intent =
          "Busca contacto con el rival: arriesga daños y sanción";
        if (!x.active.includes("tramposo")) x.active.push("tramposo");
      }
      return result;
    },
    wear(a, time = a.abilities?.clock || 0) {
      return (
        (B.has(a, "manos-suaves") ? 0.94 : 1) *
        (a.abilities?.boostUntil > 0 && a.abilities.boostUntil > time
          ? 1.12
          : 1)
      );
    },
    learning(s, d, focus, level = 0) {
      const ids = B.ids(s, d);
      return (
        (ids.includes("autonomo") ? 1.35 : 1) *
        (ids.includes("analitico") &&
        ["control", "brakes", "consistency"].includes(focus)
          ? 1.15
          : 1) *
        (ids.includes("pupilo") && level >= 4 ? 1.15 : 1)
      );
    },
    validate(s) {
      if (s.race?.abilityVersion === undefined) return;
      G.assert(
        G.DriverWorld.enabled(s) &&
          s.race.abilityVersion === 1 &&
          s.race.skillsVersion === 1,
        "Versión de habilidades inválida.",
      );
      for (const a of s.race.entrants) {
        const x = a.abilities,
          num = (v) => Number.isFinite(v) && v >= 0 && v <= 1e8;
        G.assert(
          x &&
            Array.isArray(x.ids) &&
            x.ids.length >= 1 &&
            x.ids.length <= 3 &&
            new Set(x.ids).size === x.ids.length &&
            x.ids.every(
              (id) => typeof id === "string" && Object.hasOwn(B.byId, id),
            ) &&
            Array.isArray(x.active) &&
            x.active.length <= x.ids.length &&
            new Set(x.active).size === x.active.length &&
            x.active.every((id) => x.ids.includes(id)) &&
            G.Drivers.stats.every(
              (key) =>
                Number.isFinite(x.baseStats?.[key]) &&
                x.baseStats[key] >= 0 &&
                x.baseStats[key] <= 100,
            ) &&
            Number.isInteger(x.rng) &&
            x.rng >= 0 &&
            x.rng <= 4294967295 &&
            typeof x.boostUsed === "boolean" &&
            [
              x.boostUntil,
              x.nextUpdate,
              x.nextDirty,
              x.dirtyUntil,
              x.clock,
            ].every(num) &&
            (x.punctureAt === null ||
              (num(x.punctureAt) && x.punctureAt <= s.race.time)) &&
            (x.dirtyTarget === null ||
              s.race.entrants.some((o) => o.carId === x.dirtyTarget)),
          "Habilidades de carrera inválidas.",
        );
      }
    },
  });
})();
