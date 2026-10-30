"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    E = G.RaceSkills,
    esc = U.escape.bind(U);
  const phases = {
    entry: "Entrada · frenada",
    apex: "Paso por curva",
    exit: "Salida · aceleración",
    straight: "Recta",
  };
  const UI = (G.RaceSkillsUI = {
    bars(analysis) {
      const total = Object.values(analysis.losses).reduce((n, v) => n + v, 0);
      return `<div class="skills-losses">${Object.entries(E.categories)
        .map(
          ([key, label]) =>
            `<div class="skills-loss" data-loss="${key}"><span>${label}<b>${analysis.losses[key].toFixed(1)} s</b></span><div><i style="width:${total ? (analysis.losses[key] / total) * 100 : 0}%"></i></div></div>`,
        )
        .join("")}</div>`;
    },
    graph(samples) {
      const points = samples.slice(-40),
        max = Math.max(
          30,
          ...points.map((p) => Math.max(p.speed, p.reference)),
        );
      const path = (key) =>
        points
          .map(
            (p, i) =>
              `${i ? "L" : "M"}${(((p.time - (points[0]?.time || 0)) / Math.max(1, (points.at(-1)?.time || 0) - (points[0]?.time || 0))) * 420).toFixed(1)},${(90 - (p[key] / max) * 80).toFixed(1)}`,
          )
          .join(" ");
      return `<svg class="skills-speed-chart" viewBox="0 0 420 100" role="img" aria-label="Velocidad real y ritmo de referencia durante los últimos segundos"><path d="M0 90H420" stroke="#cad6c4"/><path d="${path("reference")}" fill="none" stroke="#9ba991" stroke-width="2" stroke-dasharray="4 4"/><path d="${path("speed")}" fill="none" stroke="#377c5a" stroke-width="2.5"/></svg><div class="skills-chart-key"><span>Verde: velocidad real</span><span>Discontinua: referencia del coche</span></div>`;
    },
    explanation:
      "Estimación frente al ritmo libre de tu mismo coche sano y con neumáticos adecuados, sobre el tramo recorrido. No es la diferencia con el líder. Conducción incluye el margen del piloto y tus órdenes de ritmo o ahorro. Se excluyen banderas y boxes; los cuatro motivos reparten el total sin sumar dos veces una misma pérdida.",
    update(s) {
      const r = s.race;
      if (!r?.skillsVersion) return;
      const a = r.entrants.find((a) => a.companyId === s.playerId),
        deck = document.getElementById("race-command");
      if (!a || !deck) return;
      let panel = document.getElementById("skills-reading");
      if (!panel) {
        panel = document.createElement("section");
        panel.id = "skills-reading";
        panel.className = "skills-reading";
        panel.innerHTML =
          '<div class="skills-reading-head"><span class="eyebrow">ENTIENDE SU CONDUCCIÓN</span><b id="skills-phase"></b></div><p id="skills-current-reason"></p><div id="skills-corner-data"></div><p id="skills-battle"></p><p id="skills-line-cost" class="skills-line-cost"></p><button class="skills-line-button" data-action="skills-line" aria-pressed="false">Ver la línea que prepara</button><details class="skills-details"><summary>Tiempo cedido y ejecución</summary><div id="skills-loss-bars"></div><p class="skills-explanation"></p><div id="skills-speed-graph"></div><div id="skills-execution"></div></details>';
        panel.querySelector(".skills-explanation").textContent = UI.explanation;
        deck.append(panel);
      }
      const t = a.skills,
        c = t.current;
      document.getElementById("skills-phase").textContent = phases[t.phase];
      document.getElementById("skills-current-reason").textContent =
        `${E.categories[c.cause] || (c.cause === "neutral" ? "Carrera neutralizada" : "Ritmo disponible")}: ${c.detail}.`;
      const env = t.envelope;
      document.getElementById("skills-corner-data").innerHTML =
        `<span>Control <b>${a.stats.control.toFixed(1)}/100</b></span><span>Margen elegido <b>${(Math.min(env.driver, a.top / 3.6) * 3.6).toFixed(0)} km/h</b></span><span>Capacidad de paso <b>${(Math.min(env.physical, a.top / 3.6) * 3.6).toFixed(0)} km/h</b></span>${t.rotation ? '<span class="skills-rotation">Rotación controlada · prepara la salida</span>' : ""}`;
      const rival = r.entrants.find((o) => o.carId === t.battle.targetId);
      document.getElementById("skills-battle").textContent =
        `${E.stages[t.battle.stage]}${rival ? ` · ${rival.name}` : ""}. ${a.brain.intent}.`;
      document.getElementById("skills-line-cost").textContent =
        t.pathScale < 0.995
          ? `Interior: recorre un ${(100 * (1 - t.pathScale)).toFixed(1)} % menos en este tramo, con un radio más cerrado y menor velocidad de paso.`
          : t.pathScale > 1.005
            ? `Exterior: recorre un ${(100 * (t.pathScale - 1)).toFixed(1)} % más en este tramo; el radio abierto permite conservar velocidad y preparar la salida.`
            : "Interior: menos recorrido, giro más cerrado. Exterior: más recorrido, mayor margen de velocidad y salida. El espacio y el agarre deciden.";
      const line = panel.querySelector(".skills-line-button"),
        showLine = !!G.App.cameraOptions.showLine;
      line.setAttribute("aria-pressed", String(showLine));
      line.textContent = showLine
        ? "Ocultar trazada prevista"
        : "Ver la línea que prepara";
      if (panel.dataset.second !== String(Math.floor(r.time))) {
        panel.dataset.second = String(Math.floor(r.time));
        document.getElementById("skills-loss-bars").innerHTML = UI.bars(
          t.analysis,
        );
        document.getElementById("skills-speed-graph").innerHTML = UI.graph(
          t.analysis.samples,
        );
        document.getElementById("skills-execution").innerHTML =
          `<span>Frenadas tardías: <b>${t.analysis.errors.lateBrake}</b></span><span>Bloqueos: <b>${t.analysis.errors.lock}</b></span><span>Pérdidas de tracción: <b>${t.analysis.errors.wheelspin}</b></span>`;
      }
    },
    result(s, e) {
      const report = s.raceSkills?.reports.find((x) => x.eventId === e.id);
      if (!report) return "";
      const t = report.analysis;
      return `<section class="skills-race-report" data-skills-report="${esc(e.id)}"><span class="eyebrow">INFORME DE CONDUCCIÓN</span><h3>Por qué cediste tiempo.</h3>${UI.bars(t)}<p class="skills-explanation">${UI.explanation}</p><div class="skills-report-events"><span>Frenadas tardías <b>${t.errors.lateBrake}</b></span><span>Bloqueos <b>${t.errors.lock}</b></span><span>Pérdidas de tracción <b>${t.errors.wheelspin}</b></span><span>Rotaciones controladas <b>${t.rotations}</b></span><span>Defensas preparadas <b>${report.defenses}</b></span></div>${UI.graph(t.samples)}<p>Para mejorar: ${Object.keys(t.losses).sort((a, b) => t.losses[b] - t.losses[a])[0] === "driving" ? "entrena Control, Frenada o la especialidad de combate que necesite el piloto." : Object.keys(t.losses).sort((a, b) => t.losses[b] - t.losses[a])[0] === "tires" ? "revisa el compuesto, el desgaste y el momento de parar en boxes." : Object.keys(t.losses).sort((a, b) => t.losses[b] - t.losses[a])[0] === "traffic" ? "prepara adelantamientos o busca otra ventana de parada para tener pista libre." : "revisa el estado mecánico, la refrigeración y los frenos del coche."}</p></section>`;
    },
    action(app, name) {
      if (name !== "skills-line") return false;
      app.cameraOptions.showLine = !app.cameraOptions.showLine;
      const button = document.querySelector(".skills-line-button");
      if (button) {
        button.setAttribute("aria-pressed", String(app.cameraOptions.showLine));
        button.textContent = app.cameraOptions.showLine
          ? "Ocultar trazada prevista"
          : "Ver la línea que prepara";
      }
      return true;
    },
  });
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    UI.update(s);
  };
  const risk = G.ProfessionalUI.risk;
  G.ProfessionalUI.risk = function (q) {
    return (
      risk.call(this, q) +
      (["overtake", "defense"].includes(q.focus)
        ? `<p class="skills-training-note"><b>${q.focus === "overtake" ? "Combate: adelantamiento" : "Combate: defensa"}</b> · ${q.focus === "overtake" ? "Practicará rebufo, amagos, referencias de frenada y salida por otro lado. También trabaja Frenada." : "Practicará lectura del rival y una línea defensiva estable, dejando espacio al coche emparejado. También trabaja Concentración."} Los días, sueldo, desgaste y riesgos se mantienen; el informe mostrará los cambios reales.</p>`
        : "")
    );
  };
  G.TeamLifeUI.descriptions.control =
    "Control: cada punto cambia el margen al tomar curvas y la dosificación del acelerador. Un novato levanta antes; un experto conserva velocidad y puede orientar el coche con una pequeña rotación para preparar la salida. El coche, el agarre y el desgaste fijan el límite.";
  G.TeamLifeUI.descriptions.overtake =
    "Adelantamiento: prepara rebufos, observa las frenadas del rival, amaga y mantiene la maniobra cuando encuentra espacio. Se puede entrenar en el campus; no garantiza ganar una posición.";
  G.TeamLifeUI.descriptions.defense =
    "Defensa: anticipa ataques y elige una línea estable para proteger la posición. Deja espacio al rival emparejado y se puede entrenar en el campus.";
})();
