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
      track.append(deck);
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
      document.getElementById("command-current").textContent = a
        ? `Plan aplicado: ${G.RaceLife.modes[a.mode]}`
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
        b.setAttribute("aria-pressed", String(b.dataset.value === a?.mode));
        b.classList.toggle(
          "order-requested",
          b.dataset.value === radio?.pending?.mode,
        );
        b.querySelector("em").textContent =
          b.dataset.value === radio?.pending?.mode
            ? "Transmitiendo…"
            : b.dataset.value === a?.mode
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
                  `<p><b>${esc(G.RaceLife.modes[p.mode])} · ${esc(labels[p.status])}</b><span>${esc(p.text)}</span></p>`,
              )
              .join("")
          : "<p>Aún no has enviado instrucciones.</p>";
      }
    },
  });
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    C.update(s);
  };
})();
