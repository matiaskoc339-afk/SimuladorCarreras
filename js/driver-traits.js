"use strict";
(() => {
  const G = RCS,
    B = G.DriverAbilities,
    E = G.RaceSkills;
  const names = {
    wet: "Pez de agua|Valiente bajo la lluvia|Cazador de spray|Tapón bajo el agua|Metrónomo mojado|Miedo al agua|Guardián del dibujo|Tormenta impaciente",
    worn: "Equilibrista del caucho|Última frenada|Olfato de última goma|No me pasas|Abuelo del caucho|Desconfía del agarre|Enfermero de neumáticos|Hasta reventar",
    start:
      "Pulso de semáforo|Salta al hueco|Olfato de salida|Portero de parrilla|Salida de ajedrecista|Se queda clavado|Calienta con cariño|Todo en la salida",
    closing:
      "Guante de seda|A todo o nada|Huele el podio|Candado de bandera|Firma la llegada|Le tiembla el pulso|Llegar es ganar|Obsesión por la meta",
    traffic:
      "Bailarín de pelotón|Codazos de frenada|Rata de huecos|Cierra la puerta|Espera su momento|Se agobia entre coches|Escudo del caucho|No soporta un rebufo",
    clear:
      "Dibuja solo|Frena de memoria|Caza la sombra|Vive del retrovisor|Vuelta de reloj|Se desconecta|Taxista de carrera|Conejo escapado",
    heat: "Sangre fría|Frenos al rojo|Cazador del calor|Sombra incómoda|Ritual de verano|Se derrite|Cuida su máquina|Quema el asfalto",
    tired:
      "Manos de veterano|Último esfuerzo|Olfato tras el cansancio|No cede agotado|Piloto de oficio|Cabeceador|Dosifica lo que queda|Corazón antes que cabeza",
    hairpin:
      "Cirujano de horquillas|Tira el ancla tarde|Cruce de vértices|Dueño del interior|Compás de horquilla|Pánico al vértice|Caricia de volante|Se tira al hueco",
    sweeper:
      "Sobre raíles|Frenador de apoyo|Acecha por fuera|El arco es suyo|Círculo perfecto|Vértigo de velocidad|Cuida los hombros|Valiente de apoyo",
    chase:
      "Remonta con cabeza|Última bala|Rey del oportunismo|Ni un puesto más|Remontador paciente|Se rinde demasiado pronto|Piensa en la próxima|Rabia de remontada",
    lead: "Líder de guante blanco|No sabe aflojar|Lector de doblados|Celoso del liderato|Firma cada vuelta|Se confía al liderar|Administra el colchón|No quiere ver a nadie",
  };
  const contexts = {
    wet: "Cuando llueve",
    worn: "Cuando las gomas empiezan a pedir relevo",
    start: "Al apagarse el semáforo",
    closing: "Cuando ya se ve la bandera a cuadros",
    traffic: "Cuando queda encerrado en el pelotón",
    clear: "Cuando tiene pista libre",
    heat: "Cuando el asfalto abrasa",
    tired: "Cuando empieza a pesar el cansancio",
    hairpin: "Al llegar a una horquilla",
    sweeper: "Al enlazar curvas rápidas",
    chase: "Cuando rueda fuera del podio",
    lead: "Cuando manda en la carrera",
  };
  const profiles = [
    [
      "suave",
      "abre la entrada y acaricia el volante para cuidar el caucho. Evita pelear el vértice: a veces cede un hueco que otro aprovecharía.",
      "Prefiere una salida amplia y cuida las gomas",
    ],
    [
      "apuesta",
      "se la juega por el interior y busca cerrar el adelantamiento antes de la salida. Puede sorprender, pero precipitarse provoca bloqueos y castiga las ruedas.",
      "Se la juega por el interior",
    ],
    [
      "oportunista",
      "se pega al rival y espera su salida de curva para cruzarle la trazada por fuera. Si el hueco no aparece, pierde tiempo esperando su momento.",
      "Espera la salida del rival para cruzarle la trazada",
    ],
    [
      "cerrojo",
      "vigila el retrovisor y ocupa pronto la línea del perseguidor. Defiende con orgullo, aunque descuida su propio ritmo y gasta más caucho.",
      "Protege su posición aunque pierda ritmo",
    ],
    [
      "metodico",
      "prefiere asegurar una vuelta limpia antes que lanzarse a un hueco dudoso. Suele cuidar sus neumáticos, pero deja escapar oportunidades de adelantar.",
      "Espera un hueco limpio y evita precipitarse",
    ],
    [
      "nervioso",
      "duda y levanta el pie en momentos incómodos. La concentración le ayuda a contenerlo, pero un rival atento puede aprovechar su vacilación.",
      "Vacila y levanta el pie",
    ],
    [
      "cuidador",
      "pone la llegada por delante del cronómetro y reduce la pelea para alargar la vida del neumático. Conserva recursos, pero puede perder el tren de cabeza.",
      "Dosifica el coche para llegar con gomas",
    ],
    [
      "impaciente",
      "no soporta quedarse detrás y busca otra línea en cuanto ve espacio. Su ímpetu ayuda a atacar, pero acelera el desgaste y puede acabar en una mala ejecución.",
      "Busca una línea para salir del atasco",
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
  for (const [condition, list] of Object.entries(names))
    list.split("|").forEach((name, i) => {
      const d = B.byId[`${condition}-${keys[i]}`];
      d.name = name;
      d.profile = profiles[i][0];
      d.description = `${contexts[condition]}, ${profiles[i][1]}`;
      d.tone =
        i === 5
          ? "defecto"
          : [1, 3, 7].includes(i)
            ? "arriesgada"
            : "con contrapartida";
    });
  const special = {
    motivador:
      "Cuanto más cansado está el neumático, más se anima a pelear. Puede compensar parte de la pérdida de ritmo, pero no inventa agarre ni salva una rueda pinchada.",
    autonomo:
      "Se organiza por su cuenta y saca más partido de cada entrenamiento. Necesita descansar como cualquiera: su iniciativa no lo protege de lesiones ni supera su potencial.",
    tramposo:
      "Le gusta sacar al rival de sus casillas y puede buscar un golpe si le das rienda suelta. También puede romper su propio coche o recibir una sanción en una carrera legal.",
    "mal-perdedor":
      "Verse último le enciende la sangre: intenta una remontada desesperada y breve, aunque castigue las gomas. Solo encuentra ese arrebato una vez en cada carrera.",
    testarudo:
      "No regala su posición cuando lo atacan. Se concentra tanto en cerrar la puerta que le cuesta preparar su propio adelantamiento; aun así, debe respetar a un coche emparejado.",
    drifting:
      "Sabe hacer girar el coche para preparar la salida antes que otros pilotos. Con buenas manos puede lucirse; sin agarre suficiente el espectáculo puede salir caro.",
    analitico:
      "Después de entrenar vuelve sobre sus errores y aprende especialmente bien a frenar, controlar el coche y repetir una vuelta. No convierte una mala sesión en una mejora milagrosa.",
    pupilo:
      "Escucha y aprovecha especialmente bien los consejos de un entrenador experimentado. Necesita un buen mentor: contratar a cualquiera no despierta su talento.",
    "manos-suaves":
      "Trata el caucho con delicadeza durante la marcha y suele llegar con más goma que otro piloto. Un bloqueo o un pinchazo siguen pudiendo arruinarle el plan.",
    resiliente:
      "Aunque llegue cansado, mantiene la cabeza en su sitio y repite mejor sus referencias. Sigue necesitando descanso: no es inmune al agotamiento.",
    adaptable:
      "Cuando cambia el agarre bajo la lluvia, encuentra antes la manera de sujetar el coche. Ayuda a conducir, pero no sustituye a montar el neumático adecuado.",
    sereno:
      "Con otros coches respirándole en la nuca conserva la calma para ejecutar. Resiste mejor la presión, aunque no puede crear un hueco donde no lo hay.",
  };
  for (const [id, description] of Object.entries(special))
    B.byId[id].description = description;
  const oldSeed = B.seeded;
  const T = (G.DriverTraits = {
    enabled: (s) => s?.driverTraits?.version === 1,
    count(s, d) {
      const x = {
          rng: G.AuctionContent.hash(
            `${s.seed}/${d.identity || d.id}/abilities`,
          ),
        },
        roll = G.random(x);
      return roll < 0.9 ? 1 : roll < 0.995 ? 2 : 3;
    },
    initialize(s) {
      if (T.enabled(s)) return s;
      G.assert(
        G.GrandTour.enabled(s) && !s.race && !G.Auctions.active(s),
        "Termina la actividad en directo antes de actualizar las habilidades.",
      );
      s.driverTraits = { version: 1, since: s.day };
      for (const d of s.drivers) {
        const ids = s.driverWorld.talents[d.id] || oldSeed(s, d);
        s.driverWorld.talents[d.id] = ids.slice(0, T.count(s, d));
      }
      return s;
    },
    validate(s) {
      if (s.driverTraits === undefined) {
        G.assert(!s.race?.traitVersion, "Falta la versión de rasgos.");
        return;
      }
      G.assert(
        T.enabled(s) &&
          Number.isInteger(s.driverTraits.since) &&
          s.driverTraits.since >= 0 &&
          s.driverTraits.since <= s.day,
        "Versión de rasgos inválida.",
      );
      if (s.race?.traitVersion !== undefined) {
        G.assert(
          s.race.traitVersion === 1 && s.race.abilityVersion === 1,
          "Rasgos de carrera inválidos.",
        );
        for (const a of s.race.entrants)
          G.assert(
            a.abilities.traitsVersion === 1 &&
              [a.abilities.traitNext, a.abilities.traitNotice].every(
                (n) => Number.isFinite(n) && n >= 0,
              ),
            "Rasgos de piloto inválidos.",
          );
      }
    },
  });
  B.seeded = function (s, d) {
    const ids = oldSeed(s, d);
    return T.enabled(s) ? ids.slice(0, T.count(s, d)) : ids;
  };
  const ids = B.ids;
  B.ids = function (s, d) {
    const result = ids.call(this, s, d);
    return T.enabled(s) ? result.slice(0, T.count(s, d)) : result;
  };
  const create = G.createGame;
  G.createV171Game = create;
  G.createGame = (...args) => T.initialize(create(...args));
  const start = G.Race.start;
  G.Race.start = function (s, ...args) {
    const r = start.call(this, s, ...args);
    if (T.enabled(s)) {
      r.traitVersion = 1;
      for (const a of r.entrants)
        Object.assign(a.abilities, {
          traitsVersion: 1,
          traitNext: 0,
          traitNotice: 0,
        });
    }
    return r;
  };
  const tactic = B.tactic;
  B.tactic = function (r, a, c, result) {
    result = tactic.call(this, r, a, c, result);
    if (
      !r.traitVersion ||
      c.yellow ||
      r.safety.active ||
      a.incident ||
      a.puncture ||
      a.pit.phase !== "none" ||
      a.dnf ||
      a.finishTime !== null
    )
      return result;
    const x = a.abilities,
      p = a.directive.plan,
      front = c.front?.b,
      room = Math.max(0, r.trackWidth / 2 - a.width / 2 - 0.45),
      cars = r.entrants.filter((o) => !o.dnf && o.finishTime === null),
      bend =
        Math.sign(G.Racecraft.sample(r.track, a.progress + 35).curvature) ||
        a.brain.side ||
        1;
    const lane = (value, target) => {
      value = G.clamp(value, -room, room);
      if (E.clearLane(r, a, cars, value, target)) {
        result.lateral = value;
        return true;
      }
      return false;
    };
    const pass = (side) => {
      if (
        !front ||
        ["clean", "follow", "defend"].includes(p.tactic) ||
        p.risk < 30 ||
        a.stats.control < 25 ||
        c.front.gap > 22 ||
        c.front.gap < (100 - a.stats.overtake) * 0.12 + 5
      )
        return false;
      if (p.tactic === "inside") side = bend;
      if (p.tactic === "outside") side = -bend;
      const value = front.lateral + side * ((a.width + front.width) / 2 + 0.75);
      if (Math.abs(value) > room || !lane(value, front.carId)) return false;
      result.passing = true;
      result.target = Math.max(result.target, a.skills.planTarget);
      a.skills.battle.targetId = front.carId;
      E.change(r, a, "commit", side, 1 + a.stats.overtake / 100);
      return true;
    };
    for (const id of x.active) {
      const d = B.byId[id];
      if (!d.profile) continue;
      const profile = d.profile;
      if (profile === "suave") {
        result.target *= 0.98;
        if (c.corner > 0.25) lane(-bend * room * 0.35);
      }
      if (profile === "apuesta") pass(bend);
      if (profile === "oportunista" && front) {
        if (a.skills.phase === "exit" || c.corner < 0.2) pass(-bend);
        else {
          result.passing = false;
          result.target = Math.min(result.target, front.speed + 0.3);
        }
      }
      if (profile === "cerrojo" && c.rear?.b) {
        const rear = c.rear.b;
        if (
          Math.abs(G.Race.relative(a, rear, G.Data.tracks[r.track].length)) >
          (a.length + rear.length) / 2 + 2
        )
          lane(rear.lateral, rear.carId);
        result.target *= 0.98;
      }
      if (profile === "metodico") {
        result.target *= 0.99;
        if (front && c.front.gap < 12) {
          result.passing = false;
          result.target = Math.min(result.target, front.speed);
        }
      }
      if (
        profile === "nervioso" &&
        Math.sin(r.time * 0.7 + (G.AuctionContent.hash(id) % 7)) > 0.25
      ) {
        result.target *= 0.86 + a.stats.focus * 0.001;
        result.passing = false;
      }
      if (profile === "cuidador") {
        result.target *= 0.94;
        if (front) {
          result.passing = false;
          result.target = Math.min(result.target, front.speed);
        }
      }
      if (profile === "impaciente") pass(-bend) || pass(bend);
      if (
        ["apuesta", "impaciente"].includes(profile) &&
        r.time >= x.traitNext
      ) {
        x.traitNext = r.time + 8;
        if (
          a.speed > 12 &&
          p.risk >= 30 &&
          r.time > a.skills.execution.cooldown &&
          (c.corner > 0.25 || result.target > a.speed + 0.5) &&
          G.random(x) < (1 - a.stats.control / 100) * 0.12 * (p.risk / 100)
        )
          E.error(
            r,
            a,
            c.corner > 0.25 ? "lock" : "wheelspin",
            "se precipita al intentar aprovechar su rasgo",
          );
      }
      a.brain.intent = `${d.name}: ${profiles.find((row) => row[0] === profile)[2]}`;
      if (r.time >= x.traitNotice) {
        x.traitNotice = r.time + 25;
        G.Race.event(
          r,
          "ability",
          `${a.name}: ${a.brain.intent}.`,
          [a.carId],
          a.progress,
        );
      }
    }
    result.target = Math.max(
      0,
      Math.min(
        result.target,
        a.skills.planTarget > 0
          ? a.skills.planTarget
          : a.skills.envelope.driver,
        a.skills.envelope.driver,
        (a.top / 3.6) * (1.01 + a.stats.pace / 1000),
      ),
    );
    return result;
  };
  const wear = B.wear;
  B.wear = function (a, ...args) {
    let n = wear.call(this, a, ...args);
    if (a.abilities?.traitsVersion === 1 && !a.puncture)
      for (const id of a.abilities.active) {
        const p = B.byId[id].profile;
        n *=
          {
            suave: 0.92,
            apuesta: 1.1,
            cerrojo: 1.06,
            metodico: 0.95,
            cuidador: 0.8,
            impaciente: 1.12,
          }[p] || 1;
      }
    return n;
  };
})();
