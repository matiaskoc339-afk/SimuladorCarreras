"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    W = G.RaceWeekend;
  const race = U.race,
    update = U.updateRace,
    competition = U.competition;
  const phases = {
    none: "Sin parada pendiente",
    queued: "Parada solicitada",
    entry: "En el carril de boxes",
    box: "Servicio en curso",
    exit: "Salida de boxes",
  };
  const clock = (t) =>
    Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");
  const UI = (G.RaceUI = {
    session: null,
    entry(app, e) {
      const s = app.state,
        f = W.forecast(s, e);
      document
        .querySelector(".modal-content")
        .insertAdjacentHTML(
          "afterbegin",
          `<div class="race-forecast"><span class="eyebrow">PREVISIÓN DEL FIN DE SEMANA</span><strong>${f.initialWet ? "Salida húmeda" : "Salida seca"} · ${f.temperature} °C</strong><p>Probabilidad de chubascos durante la carrera: ${f.chance} %. El pronóstico no garantiza cuándo lloverá.</p></div>`,
        );
      const form = document.getElementById("entry-form");
      if (!form) {
        if (e.entry)
          document
            .querySelector(".onboarding-note")
            ?.insertAdjacentHTML(
              "beforeend",
              `<p>Gomas: ${W.compounds[e.entry.compound || "road"].name} · Combustible inicial ${e.entry.fuel || 3} L. ${e.entry.tyreSetId ? "Juego reservado " + U.escape(e.entry.tyreSetId) + "." : ""}</p>`,
            );
        return;
      }
      form.querySelector(".modal-actions").insertAdjacentHTML(
        "beforebegin",
        `<div class="entry-strategy"><h3>Prepara la salida</h3><div class="form-row"><label class="form-field"><span>Neumáticos</span><select id="entry-compound" name="compound">${Object.entries(
          W.compounds,
        )
          .map(
            ([id, c]) =>
              `<option value="${id}">${c.name}${c.price ? " · " + U.money(c.price) + " nuevo" : ""}</option>`,
          )
          .join(
            "",
          )}</select></label><label class="form-field"><span>Combustible incluido</span><select name="fuel"><option value="3">3 L · margen normal</option><option value="1">1 L · ligero, puede exigir repostaje</option></select></label></div><p>Blando: más agarre y desgaste. Duro: mayor duración. Intermedio: humedad moderada. Lluvia: agua abundante. Los de lluvia se gastan antes sobre seco. Los juegos de carrera se pagan al reservar y se conservan si retiras la inscripción; las gomas de calle permanecen con su desgaste real.</p><p id="entry-tyre-quote" aria-live="polite"></p></div>`,
      );
      const quote = () => {
        const msg = document.getElementById("entry-tyre-quote"),
          submit = form.querySelector('button[type="submit"]');
        try {
          const q = W.entryQuote(
            s,
            s.playerId,
            form.elements.compound.value,
            Number(form.elements.fuel.value),
          );
          msg.textContent =
            (q.set
              ? "Reutilizar " +
                q.set.id +
                " · " +
                Math.round(q.set.condition) +
                " % de estado. "
              : q.cost
                ? "Juego nuevo: " + U.money(q.cost) + ". "
                : "Gomas actuales del coche. ") +
            "Inscripción y transporte: $370. Total hoy: " +
            U.money(q.total) +
            ".";
          submit.textContent = "Confirmar inscripción · $" + q.total;
          submit.disabled = G.player(s).balance < q.total;
        } catch (err) {
          msg.textContent = err.message;
          submit.disabled = true;
        }
      };
      form.addEventListener("change", quote);
      quote();
    },
    pitHTML(s) {
      const a = s.race.entrants.find((a) => a.companyId === s.playerId);
      return `<div class="weekend-metrics" id="weekend-metrics"></div><details class="pit-strategy" id="pit-strategy" ${G.App.pitOpen ? "open" : ""}><summary>Boxes y estrategia <span id="pit-status">${a ? phases[a.pit.phase] : "Sin coche propio en pista"}</span></summary><div class="pit-strategy-body"><div class="weekend-orders"><button class="secondary weekend-order" data-action="order" data-value="fuel">Ahorrar combustible</button><button class="secondary weekend-order" data-action="order" data-value="defend">Defender posición</button></div><form id="pit-form"><div class="pit-fields"><label class="form-field"><span>Juego para la parada</span><select name="compound" id="pit-compound"><option value="keep">Mantener gomas</option>${Object.entries(
        W.compounds,
      )
        .map(
          ([id, c]) =>
            `<option value="${id}">${id === "road" ? "Volver a las gomas de calle" : c.name + " · " + U.money(c.price) + " nuevo"}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="form-field"><span>Repostaje</span><select name="fuel"><option value="0">Sin repostar</option><option value="1">+1 L · $5</option><option value="2">+2 L · $10</option><option value="4">+4 L · $20</option></select></label><label class="checkbox-field"><input type="checkbox" name="repair">Reparación rápida · $140 y +12 s</label></div><p>Reparación limitada de carrocería, suspensión y refrigeración; no sustituye mejoras ni repara motor o transmisión. Servicio base $55. El carril está limitado a 60 km/h.</p><p id="pit-quote" aria-live="polite"></p><div class="pit-actions"><button type="submit" id="pit-request" class="primary">Entrar a boxes</button><button class="secondary" type="button" data-action="pit-cancel" id="pit-cancel">Cancelar parada</button><label class="checkbox-field"><input id="pit-limiter" type="checkbox" ${a?.pit.limiter ? "checked" : ""}>Limitador de boxes</label></div><p class="fine-print">Desactivar el limitador permite superar la velocidad: se sanciona el exceso real con 5 segundos. Si cancelas antes de entrar, el juego comprado queda en el almacén. El servicio se cobra al detenerse.</p></form></div></details>`;
    },
    controls() {
      const details = document.getElementById("pit-strategy");
      if (details && !details.dataset.bound) {
        details.dataset.bound = "true";
        details.addEventListener("toggle", () => {
          G.App.pitOpen = details.open;
        });
        document.getElementById("pit-form").addEventListener("change", (e) => {
          if (e.target.id === "pit-limiter") {
            const a = G.App.state.race?.entrants.find(
              (a) => a.companyId === G.App.state.playerId,
            );
            if (a) {
              a.pit.limiter = e.target.checked;
              G.App.persist();
            }
          }
          UI.pitQuote(G.App.state);
        });
      }
    },
    pitQuote(s) {
      const form = document.getElementById("pit-form");
      if (!form) return;
      const a = s.race?.entrants.find((a) => a.companyId === s.playerId),
        button = document.getElementById("pit-request"),
        cancel = document.getElementById("pit-cancel"),
        msg = document.getElementById("pit-quote");
      cancel.disabled = a?.pit.phase !== "queued";
      form
        .querySelectorAll('select,input[name="repair"]')
        .forEach(
          (el) => (el.disabled = !a || !W.onTrack(a) || a.pit.phase !== "none"),
        );
      document.getElementById("pit-limiter").disabled =
        !a || a.dnf || a.finishTime !== null;
      if (a && a.pit.phase !== "none") {
        form.elements.compound.value = a.pit.compound;
        form.elements.repair.checked = a.pit.repair;
        form.elements.fuel.value = String(a.pit.fuel);
      } else if (a && form.dataset.phase && form.dataset.phase !== "none") {
        form.elements.compound.value = "keep";
        form.elements.repair.checked = false;
        form.elements.fuel.value = "0";
      }
      form.dataset.phase = a?.pit.phase || "none";
      if (!a || a.dnf || a.finishTime !== null || a.pit.phase !== "none") {
        button.disabled = true;
        msg.textContent =
          a?.pit.phase === "box"
            ? "Tiempo restante: " + a.pit.remaining.toFixed(1) + " s."
            : a?.pit.mergeWait
              ? "Esperando un hueco seguro para reincorporarse."
              : a
                ? phases[a.pit.phase]
                : "";
        return;
      }
      try {
        const q = W.pitQuote(s, s.playerId, {
          compound: form.elements.compound.value,
          repair: form.elements.repair.checked,
          fuel: Number(form.elements.fuel.value),
        });
        button.disabled = false;
        msg.textContent =
          "Entrada en vuelta " +
          (Math.floor(q.entry / G.Data.tracks[s.race.track].length) + 1) +
          ". " +
          (q.set
            ? "Reutilizar " +
              q.set.id +
              " (" +
              Math.round(q.set.condition) +
              " %). "
            : q.cost
              ? "Juego nuevo " + U.money(q.cost) + ". "
              : "") +
          "Servicio " +
          U.money(q.service) +
          ". Total: " +
          U.money(q.total) +
          ".";
      } catch (err) {
        button.disabled = true;
        msg.textContent = err.message;
      }
    },
    action(app, name, data) {
      if (
        ![
          "discard-race-tyre",
          "pit-cancel",
          "replay-open",
          "replay-close",
          "replay-play",
          "replay-speed",
          "replay-camera",
          "replay-jump",
        ].includes(name)
      )
        return false;
      switch (name) {
        case "discard-race-tyre":
          app.confirm(
            "Descartar juego de competición",
            "El juego se retira sin reembolso. Las piezas y las gomas de calle del coche se conservan.",
            () => {
              W.discard(app.state, data.id);
              app.close();
              app.mutate(() => {}, "garage");
            },
          );
          break;
        case "pit-cancel":
          W.cancelPit(app.state);
          app.persist();
          U.updateRace(app.state);
          break;
        case "replay-open":
          this.openReplay(app, data.source === "live");
          break;
        case "replay-close":
          app.close();
          if (data.id && app.state.season.events.some((e) => e.id === data.id))
            app.results(data.id);
          break;
        case "replay-play":
          this.session.playing = !this.session.playing;
          this.replayControls();
          break;
        case "replay-speed":
          this.session.speed = Number(data.value);
          this.replayControls();
          break;
        case "replay-camera": {
          const p = this.session;
          p.camera.mode = ["broadcast", "follow", "overview"][
            (["broadcast", "follow", "overview"].indexOf(p.camera.mode) + 1) % 3
          ];
          break;
        }
        case "replay-jump":
          this.session.time = Number(data.time);
          this.session.playing = true;
          break;
      }
      return true;
    },
    submit(app, form, values) {
      if (form.id !== "pit-form") return false;
      W.requestPit(app.state, app.state.playerId, {
        compound: String(values.get("compound")),
        fuel: Number(values.get("fuel")),
        repair: values.has("repair"),
      });
      app.persist();
      U.updateRace(app.state);
      U.toast(
        "Parada solicitada. El piloto entrará en la próxima entrada disponible.",
      );
      return true;
    },
    openReplay(app, instant = false) {
      const rec = instant
        ? app.state.race?.replay
        : app.state.raceSupplies.lastReplay;
      G.assert(rec?.frames.length > 1, "Todavía no hay grabación suficiente.");
      app.close();
      const session = (this.session = {
        rec: G.clone(rec),
        time: instant ? Math.max(0, rec.duration - 12) : 0,
        playing: true,
        speed: 1,
        camera: { mode: "broadcast", focusId: null, zoom: 1.5 },
        wasPaused: app.paused,
        live: instant,
        last: 0,
      });
      if (instant) {
        app.paused = true;
        app.updatePause();
        G.Sound.silence();
      }
      U.modal(
        "Repetición · " + G.Data.tracks[rec.track].name,
        `<div class="replay-info"><span class="badge">GRABACIÓN</span><span>La carrera está ${instant ? "pausada" : "finalizada"}. Esta reproducción no cambia resultados, daños ni dinero.</span></div><div class="replay-stage"><canvas id="replay-canvas" aria-label="Repetición grabada de la carrera"></canvas><span id="replay-clock">0:00.0</span></div><label class="replay-timeline"><span>Buscar en la grabación</span><input id="replay-timeline" type="range" min="0" max="${rec.duration}" step="0.1" value="${session.time}"></label><div class="replay-controls"><button class="secondary" data-action="replay-play" id="replay-play">Pausar repetición</button><label>Velocidad <select id="replay-speed"><option value="0.5">×0.5</option><option value="1" selected>×1</option><option value="2">×2</option></select></label><button class="secondary" data-action="replay-camera">Cambiar cámara</button><label>Piloto <select id="replay-driver"><option value="">Realización automática</option>${rec.cars.map((c) => `<option value="${c.carId}">${U.escape(c.name)}</option>`).join("")}</select></label></div><div class="replay-events"><h3>Momentos grabados</h3>${
          rec.events
            .filter((e) =>
              [
                "contact",
                "crash",
                "spin",
                "slide",
                "puncture",
                "pit-in",
                "pit-box",
                "pit-out",
                "weather",
                "penalty",
                "safety",
                "retirement",
                "overtake",
              ].includes(e.type),
            )
            .slice(-24)
            .map(
              (e) =>
                `<button data-action="replay-jump" data-time="${Math.max(0, e.time - 3)}"><time>${clock(e.time)}</time><span>${U.escape(e.text)}</span></button>`,
            )
            .join("") ||
          "<p>No se han registrado incidentes en este intervalo.</p>"
        }</div><div class="modal-actions"><button class="primary" data-action="replay-close" ${instant ? "" : `data-id="${rec.eventId}"`}>${instant ? "Volver al directo" : "Volver a resultados"}</button></div>`,
        true,
      );
      document.querySelector(".modal").classList.add("replay-modal");
      document
        .getElementById("replay-timeline")
        .addEventListener("input", (e) => {
          session.time = Number(e.target.value);
          session.playing = false;
          this.replayControls();
        });
      document
        .getElementById("replay-speed")
        .addEventListener("change", (e) => {
          session.speed = Number(e.target.value);
        });
      document
        .getElementById("replay-driver")
        .addEventListener("change", (e) => {
          session.camera.focusId = e.target.value || null;
          session.camera.mode = e.target.value ? "follow" : "broadcast";
        });
    },
    closeReplay(app) {
      if (!this.session) return;
      const p = this.session;
      this.session = null;
      if (p.live && app.state?.race) {
        app.paused = p.wasPaused;
        app.updatePause();
      }
    },
    replayControls() {
      const b = document.getElementById("replay-play");
      if (b)
        b.textContent = this.session.playing
          ? "Pausar repetición"
          : "Reanudar repetición";
    },
    frame(time) {
      const p = this.session,
        canvas = document.getElementById("replay-canvas");
      if (!p || !canvas) return;
      if (p.last && p.playing)
        p.time = Math.min(
          p.rec.duration,
          p.time + Math.min(0.15, (time - p.last) / 1000) * p.speed,
        );
      p.last = time;
      if (p.time >= p.rec.duration) {
        p.playing = false;
        this.replayControls();
      }
      const r = W.playback(p.rec, p.time);
      G.Render.track(canvas, r, p.rec.track, G.App.logoImage, p.camera);
      document.getElementById("replay-clock").textContent =
        clock(p.time) + " / " + clock(p.rec.duration);
      const slider = document.getElementById("replay-timeline");
      if (document.activeElement !== slider) slider.value = p.time;
    },
    results(app, e) {
      const rec = app.state.raceSupplies?.lastReplay;
      if (rec?.eventId === e.id)
        document
          .querySelector(".modal-content")
          .insertAdjacentHTML(
            "beforeend",
            `<section class="replay-result"><h3>Vuelve a ver cómo ocurrió.</h3><p>Grabación de la última carrera, con cámaras y selección de momentos.</p>${U.button("Ver repetición", "replay-open", "secondary")}</section>`,
          );
    },
  });
  U.race = function (s) {
    let html = race.call(this, s);
    if (!s.race.weekendVersion) return html;
    html = html.replace(
      '<div class="race-layout">',
      '<div id="live-weather" class="weekend-weather"></div><div class="race-layout">',
    );
    html = html.replace("</aside>", "" + UI.pitHTML(s) + "</aside>");
    html = html.replace(
      '<div class="race-controls">',
      '<div class="race-controls"><button class="secondary" data-action="replay-open" data-source="live" id="instant-replay">Repetición instantánea</button>',
    );
    return html;
  };
  U.updateRace = function (s) {
    update.call(this, s);
    const r = s.race;
    if (!r?.weekendVersion) return;
    const a = r.entrants.find((a) => a.companyId === s.playerId),
      weather = document.getElementById("live-weather");
    if (!weather) return;
    const w = r.weather;
    weather.innerHTML = `<span class="weather-state"><i class="weather-dot ${w.rain > 0.04 ? "rain" : ""}"></i><b>${W.weatherLabel(w)}</b></span><span>Agua en pista <b>${Math.round(w.wetness * 100)} %</b></span><span>Aire <b>${Math.round(w.ambient)} °C</b></span><span>Asfalto <b>${Math.round(w.trackTemp)} °C</b></span>${r.safety.active ? '<strong class="vsc-label">VSC · VELOCIDAD LIMITADA</strong>' : ""}`;
    const metrics = document.getElementById("weekend-metrics");
    metrics.innerHTML = a
      ? `<span><i style="background:${W.compounds[a.compound].color}"></i>${W.compounds[a.compound].name} <b>${Math.round(a.tyreTemp)} °C</b>${a.puncture ? " · PINCHAZO" : ""}</span><span>Combustible <b>${a.fuel.toFixed(2)} L</b></span><span>Paradas <b>${a.pitStops}</b></span>${a.totalPenalty ? `<span class="negative">Sanción <b>${a.totalPenalty} s</b></span>` : ""}`
      : "Sin vehículo propio en pista.";
    const pitstatus = document.getElementById("pit-status");
    pitstatus.textContent = a ? phases[a.pit.phase] : "";
    if (r.safety.active)
      document.getElementById("live-flag").textContent =
        "VSC · 72 KM/H · SIN ADELANTAMIENTOS";
    if (a) {
      document.getElementById("pit-limiter").checked = a.pit.limiter;
      document.querySelectorAll(".weekend-order").forEach((b) => {
        b.classList.toggle("selected", b.dataset.value === a.mode);
        b.disabled = !live(a);
      });
    }
    for (const b of document.querySelectorAll(".timing-row")) {
      const car = r.entrants.find((a) => a.carId === b.dataset.id);
      if (car && ["entry", "box", "exit"].includes(car.pit.phase))
        b.querySelector("em").textContent = "BOX";
    }
    document.getElementById("instant-replay").disabled =
      r.replay.frames.length < 2;
    UI.controls();
    UI.pitQuote(s);
  };
  function live(a) {
    return !!a && !a.dnf && a.finishTime === null;
  }
  const garage = U.garage;
  U.garage = function (s) {
    const sets = s.raceSupplies.sets.filter(
      (t) => t.companyId === s.playerId && t.status !== "used",
    );
    return (
      garage.call(this, s) +
      `<section class="panel padded spaced race-supplies"><div class="section-title"><div><span class="eyebrow">CONSUMIBLES DE COMPETICIÓN</span><h2>Tus juegos de carrera</h2></div>${U.badge(sets.filter((t) => t.status === "stored" || t.status === "reserved").length + " / 8 JUEGOS")}</div><p>Se reservan al inscribirte o pedir boxes. Cada juego conserva su desgaste; no son piezas de mejora del taller. Puedes descartar un juego libre para comprar otro nuevo del mismo compuesto.</p>${sets.map((t) => `<div class="timeline-line"><span>${U.escape(t.id)} · ${W.compounds[t.compound].name}<br><small>${Math.round(t.condition)} % · ${t.status === "stored" ? "En almacén" : t.status === "reserved" ? "Reservado" : "En uso"}</small></span>${t.status === "stored" ? U.button("Descartar", "discard-race-tyre", "text-button negative", `data-id="${t.id}"`) : ""}</div>`).join("") || '<p class="fine-print">No tienes juegos de competición comprados. Puedes competir con las gomas actuales del coche o elegir un compuesto al inscribirte.</p>'}</section>`
    );
  };
  U.competition = function (s) {
    return (
      competition.call(this, s) +
      (s.raceSupplies?.lastReplay
        ? `<section class="panel padded spaced replay-result"><div><span class="eyebrow">ÚLTIMA GRABACIÓN CONSERVADA</span><h2>${G.Data.tracks[s.raceSupplies.lastReplay.track].name}</h2><p>${clock(s.raceSupplies.lastReplay.duration)} de carrera. Solo se conserva la grabación más reciente; los resultados históricos permanecen.</p></div>${this.button("Ver repetición", "replay-open", "secondary")}</section>`
        : "")
    );
  };
})();
