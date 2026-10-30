"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    esc = U.escape.bind(U);
  const labels = {
    pending: "Esperando respuesta",
    accepted: "Orden confirmada",
    missed: "Orden no entendida",
    deferred: "Orden aplazada",
    refused: "Orden rechazada",
    unavailable: "Sin piloto en pista",
  };
  const detail = {
    attack: "Más ritmo y riesgo · más desgaste",
    balanced: "Ritmo estable · gasto normal",
    save: "Cuida coche y neumáticos",
    fuel: "Levanta antes · menos consumo",
    defend: "Protege la trazada ante el rival",
  };
  const C = (G.RaceCommandUI = {
    mount(s) {
      if (
        !s.race?.competitionVersion ||
        document.getElementById("race-command")
      )
        return;
      const track = document.querySelector(".race-track"),
        layout = document.querySelector(".race-layout"),
        aside = document.querySelector(".telemetry");
      if (!track || !aside) return;
      layout.classList.add("command-layout");
      const broadcast = document.createElement("div");
      broadcast.className = "command-broadcast";
      const camera = track.querySelector(".camera-toolbar");
      for (const node of [...track.children])
        if (node !== camera) broadcast.append(node);
      track.prepend(broadcast);
      if (camera)
        camera.insertAdjacentHTML(
          "beforeend",
          '<button class="camera-control radio-toggle" data-action="race-radio" aria-expanded="false" aria-controls="race-command">Radio y estrategia</button><button class="camera-control theatre-toggle" data-action="race-theatre" aria-pressed="false">Ampliar transmisión</button>',
        );
      document
        .querySelector(".race-page")
        ?.classList.toggle("race-theatre", !!G.App.raceTheatre);
      const deck = document.createElement("section");
      deck.id = "race-command";
      deck.className = "race-command";
      deck.setAttribute("aria-label", "Muro de órdenes y estrategia");
      deck.innerHTML = `<div class="command-heading"><div><span class="eyebrow">ENLACE CON TU PILOTO</span><h2>Tu muro, al lado de la pista.</h2></div><span id="command-current" class="command-current"></span></div><div class="command-telemetry"></div><div class="command-orders" role="group" aria-label="Órdenes de ritmo">${Object.entries(
        G.RaceLife.modes,
      )
        .map(
          ([id, name]) =>
            `<button class="order command-order" data-action="order" data-value="${id}" aria-describedby="command-reply"><span class="order-mode-dot"></span><b>${name}</b><small>${detail[id]}</small><em>Enviar por radio</em></button>`,
        )
        .join(
          "",
        )}</div><section class="command-reply" id="command-reply" aria-live="polite" aria-atomic="true"><div class="reply-head"><b id="reply-status"></b><span id="reply-time"></span></div><p id="reply-text"></p><small id="reply-note"></small></section><div id="command-strategist"></div><div class="command-boxes"></div><details class="command-history"><summary>Últimas órdenes y respuestas</summary><div id="command-radio-history"></div></details>`;
      aside.querySelector(".orders")?.remove();
      aside.querySelector(".weekend-orders")?.remove();
      const telemetry = aside.querySelector("#live-telemetry"),
        pit = aside.querySelector("#pit-strategy"),
        metrics = aside.querySelector("#weekend-metrics");
      if (telemetry) deck.querySelector(".command-telemetry").append(telemetry);
      if (metrics) deck.querySelector(".command-telemetry").append(metrics);
      const strategist = document.getElementById("professional-strategy");
      if (strategist)
        deck.querySelector("#command-strategist").append(strategist);
      if (pit) deck.querySelector(".command-boxes").append(pit);
      const manual = document.getElementById("manual-pit-panel");
      if (manual) deck.querySelector(".command-boxes").append(manual);
      const carDetails = document.createElement("details");
      carDetails.className = "command-car-details";
      carDetails.innerHTML =
        '<summary>Telemetría detallada, piezas y apoyo técnico</summary><div id="command-car-data"></div>';
      deck.append(carDetails);
      aside.remove();
      layout.append(deck);
      deck.insertAdjacentHTML(
        "afterbegin",
        '<button class="radio-dock-close secondary" data-action="race-radio">Cerrar radio flotante</button>',
      );
      if (G.App.radioFloating) C.dock(true);
      if (s.race.directorVersion) {
        deck
          .querySelector(".command-orders")
          .insertAdjacentHTML("afterend", C.planForm(s));
        const form = deck.querySelector("#command-plan-form");
        form.elements.duration.value = String(
          s.race.entrants.find((a) => a.companyId === s.playerId)?.directive
            ?.plan.duration ?? 60,
        );
        form.addEventListener("input", () => C.preview(form));
        form.addEventListener("change", () => C.preview(form));
        C.preview(form);
      }
      const feed = document.querySelector(".radio-panel");
      if (feed) {
        feed.classList.add("command-race-feed");
        feed.querySelector("h2").textContent = "Noticias de toda la carrera";
      }
    },
    update(s) {
      if (!s.race?.competitionVersion) return;
      C.mount(s);
      const telemetry = document.getElementById("live-telemetry"),
        carData = document.getElementById("command-car-data");
      const mechanics = telemetry?.querySelector(".race-mechanics");
      if (mechanics && carData) {
        carData.querySelector(".race-mechanics")?.remove();
        carData.append(mechanics);
      }
      if (telemetry && carData)
        for (const child of [...telemetry.children]) {
          if (child.matches(".telemetry-driver,.live-speed,.telemetry-bars"))
            continue;
          for (const old of [...carData.children])
            if (
              child.id ? old.id === child.id : old.className === child.className
            )
              old.remove();
          carData.append(child);
        }
      const r = s.race,
        a = r.entrants.find((a) => a.companyId === s.playerId),
        root = document.getElementById("race-command");
      if (!root) return;
      const radio = a?.radio || {
          pending: null,
          last: null,
          history: [],
          readyAt: 0,
        },
        legacyMessage =
          !r.lifeVersion &&
          r.messages.find((m) => m.text.startsWith("Radio · ")),
        request =
          radio.pending ||
          radio.last ||
          (legacyMessage
            ? {
                status: "accepted",
                text: legacyMessage.text,
                answered: legacyMessage.time,
              }
            : null),
        live = a && !a.dnf && a.finishTime === null && !r.finished;
      const applied = a?.directive?.preset,
        selected = r.directorVersion ? applied : a?.mode;
      document.getElementById("command-current").textContent = a
        ? `Plan aplicado: ${r.directorVersion ? (applied ? G.RaceLife.modes[applied] : "Personalizado") : G.RaceLife.modes[a.mode]}`
        : "Tu equipo observa esta ronda";
      const status = !live
        ? "Sin piloto activo"
        : request
          ? labels[request.status]
          : "Radio disponible";
      document.getElementById("reply-status").textContent = status;
      document.getElementById("reply-time").textContent = radio?.pending
        ? `${Math.max(1, Math.ceil(request.answerAt - r.time))} s de carrera para la respuesta`
        : request
          ? U.date(s.day, true) +
            ` · ${Math.floor(request.answered / 60)}:${Math.floor(
              request.answered % 60,
            )
              .toString()
              .padStart(2, "0")}`
          : "";
      document.getElementById("reply-text").textContent = !live
        ? "Las órdenes se habilitan mientras tu coche sigue en carrera."
        : request
          ? request.text
          : "Elige un plan. El piloto responde con la carrera en marcha; concentración, equipo, disciplina y estrés influyen en la comunicación.";
      document.getElementById("reply-note").textContent = radio?.pending
        ? `La simulación ${G.App.paused ? "está pausada: reanúdala para recibir la respuesta" : "debe avanzar para recibir respuesta"}. El plan anterior sigue aplicado hasta que el piloto confirme.`
        : live
          ? `Tu piloto: ${a.brain.intent}. ${a.professional?.strategist ? (a.professional.auto ? `Estratega activo${r.time < a.professional.manualUntil ? "; tu orden tiene prioridad durante " + Math.ceil(a.professional.manualUntil - r.time) + " s" : ""}.` : "Estratega en control manual.") : "Sin estratega: tú decides el ritmo y las paradas."}`
          : "";
      root.querySelector(".command-reply").dataset.status = !live
        ? "unavailable"
        : request?.status || "ready";
      if (live && !radio.pending && r.time < radio.readyAt)
        document.getElementById("reply-note").textContent +=
          ` Radio ocupada ${Math.max(1, Math.ceil(radio.readyAt - r.time))} s de carrera más.${G.App.paused ? " Reanuda la simulación para liberar el canal." : ""}`;
      root.querySelectorAll(".command-order").forEach((b) => {
        b.disabled =
          !live || !!radio?.pending || r.time < (radio?.readyAt || 0);
        b.setAttribute("aria-pressed", String(b.dataset.value === selected));
        b.classList.toggle("selected", b.dataset.value === selected);
        b.classList.toggle(
          "order-requested",
          b.dataset.value ===
            (radio?.pending?.plan
              ? radio.pending.preset
              : radio?.pending?.mode),
        );
        b.querySelector("em").textContent =
          b.dataset.value ===
          (radio?.pending?.plan ? radio.pending.preset : radio?.pending?.mode)
            ? "Transmitiendo…"
            : b.dataset.value === selected
              ? "Plan en uso"
              : !live
                ? "No disponible"
                : radio?.pending
                  ? "Espera respuesta"
                  : r.time < radio.readyAt
                    ? "Radio ocupada"
                    : "Enviar por radio";
      });
      const key = JSON.stringify(radio?.history || []),
        history = document.getElementById("command-radio-history");
      if (history.dataset.key !== key) {
        history.dataset.key = key;
        history.innerHTML = radio?.history.length
          ? radio.history
              .map(
                (p) =>
                  `<p><b>${esc(p.plan && !p.preset ? "Plan personalizado" : G.RaceLife.modes[p.mode])} · ${esc(labels[p.status])}</b><span>${esc(p.text)}</span></p>`,
              )
              .join("")
          : "<p>Aún no has enviado instrucciones.</p>";
      }
      const form = document.getElementById("command-plan-form");
      if (form) {
        const send = form.querySelector('[type="submit"]');
        send.disabled = !live || !!radio.pending || r.time < radio.readyAt;
        send.textContent = radio.pending
          ? "Esperando al piloto…"
          : "Transmitir mi plan";
        const appliedText = document.getElementById("command-applied-plan");
        appliedText.textContent = a?.directive
          ? `En uso: ${G.RaceDirector.describe(a.directive.plan)}. ${a.directive.manual && a.directive.until < 1e8 ? `Quedan ${Math.max(0, Math.ceil(a.directive.until - r.time))} s de carrera.` : a.directive.manual ? "Hasta nueva orden." : "Plan del piloto o estratega."}`
          : "Sin piloto activo.";
      }
      const theatre = document.querySelector(".theatre-toggle");
      if (theatre) {
        theatre.setAttribute("aria-pressed", String(!!G.App.raceTheatre));
        theatre.textContent = G.App.raceTheatre
          ? "Volver a vista normal"
          : "Ampliar transmisión";
      }
    },
    planForm(s) {
      const a = s.race.entrants.find((a) => a.companyId === s.playerId),
        p = a?.directive?.plan || G.RaceDirector.plan();
      return `<form id="command-plan-form" class="command-plan"><div class="plan-title"><div><span class="eyebrow">TU PLAN, A TU MEDIDA</span><h3>Combina las instrucciones.</h3></div><span>Se aplica cuando el piloto confirme</span></div><div class="plan-sliders">${[
        ["pace", "Ritmo", "Tranquilo → máximo esfuerzo"],
        ["risk", "Riesgo", "Esperar margen → aceptar huecos pequeños"],
        ["tires", "Cuidar neumáticos", "Priorizar ritmo → alargar su vida"],
        ["fuel", "Ahorrar combustible", "Consumo normal → levantar antes"],
      ]
        .map(
          ([key, label, hint]) =>
            `<label><span>${label}<output data-plan-value="${key}">${p[key]}</output></span><input type="range" name="${key}" min="0" max="100" step="1" value="${p[key]}"><small>${hint}</small></label>`,
        )
        .join(
          "",
        )}</div><div class="plan-selects"><label class="form-field"><span>Qué intentar en el tráfico</span><select name="tactic">${Object.entries(
        G.RaceDirector.tactics,
      )
        .map(
          ([id, label]) =>
            `<option value="${id}" ${p.tactic === id ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="form-field"><span>Durante cuánto tiempo</span><select name="duration"><option value="30">30 segundos de carrera</option><option value="60" selected>60 segundos de carrera</option><option value="120">120 segundos de carrera</option><option value="0">Hasta mi próxima orden</option></select></label></div><p id="command-plan-preview"></p><p class="plan-help">Un ritmo alto consume más y cuidar las gomas exige ceder velocidad. La maniobra necesita espacio; las habilidades del piloto y las banderas mandan.</p><button type="submit" class="primary">Transmitir mi plan</button><p id="command-applied-plan" class="plan-applied"></p></form>`;
    },
    preview(form) {
      for (const key of ["pace", "risk", "tires", "fuel"])
        form.querySelector(`[data-plan-value="${key}"]`).textContent =
          form.elements[key].value;
      const p = C.read(form);
      document.getElementById("command-plan-preview").textContent =
        `Preparado, sin enviar: ${G.RaceDirector.describe(p)}. ${p.duration ? p.duration + " s de carrera" : "Hasta nueva orden"}.`;
    },
    read(form) {
      return G.RaceDirector.plan(
        Object.fromEntries(
          ["pace", "risk", "tires", "fuel", "tactic", "duration"].map((k) => [
            k,
            k === "tactic"
              ? form.elements[k].value
              : Number(form.elements[k].value),
          ]),
        ),
      );
    },
    submit(app, form) {
      if (form.id !== "command-plan-form") return false;
      G.Race.order(app.state, C.read(form));
      app.persist();
      U.updateRace(app.state);
      return true;
    },
    action(app, name) {
      if (name === "race-radio") {
        app.radioFloating = !app.radioFloating;
        C.dock(app.radioFloating);
        return true;
      }
      if (name !== "race-theatre") return false;
      app.raceTheatre = !app.raceTheatre;
      document
        .querySelector(".race-page")
        ?.classList.toggle("race-theatre", app.raceTheatre);
      C.update(app.state);
      return true;
    },
    dock(open) {
      const deck = document.getElementById("race-command"),
        layout = document.querySelector(".command-layout"),
        track = document.querySelector(".command-layout .race-track");
      if (!deck || !layout || !track) return;
      if (open) track.append(deck);
      else layout.append(deck);
      deck.classList.toggle("radio-floating", open);
      const button = document.querySelector(".radio-toggle");
      button?.setAttribute("aria-expanded", String(open));
      if (button)
        button.textContent = open ? "Cerrar radio" : "Radio y estrategia";
      if (open) deck.querySelector(".radio-dock-close")?.focus();
      else button?.focus();
    },
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      G.App?.radioFloating &&
      !document.querySelector(".modal")
    ) {
      C.action(G.App, "race-radio");
      return;
    }
    if (
      e.key === "Escape" &&
      G.App?.raceTheatre &&
      !document.querySelector(".modal")
    ) {
      C.action(G.App, "race-theatre");
      document.querySelector(".theatre-toggle")?.focus();
    }
  });
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    C.update(s);
  };
})();
