"use strict";
(() => {
  const G = RCS,
    U = G.UI;
  G.App = {
    state: null,
    slot: null,
    view: "hq",
    speed: 1,
    paused: false,
    follow: true,
    cameraOptions: { mode: "broadcast", focusId: null, zoom: 1.5 },
    workshopFilter: "all",
    workshopSearch: "",
    workshopTab: "diagnosis",
    contractTab: "offers",
    get camera() {
      return this.cameraOptions;
    },
    get audioEnabled() {
      return G.Sound.enabled;
    },
    accumulator: 0,
    lastFrame: 0,
    lastPaint: 0,
    lastAuto: 0,
    logoImage: null,
    saveError: false,
    boot() {
      U.render(null);
      document.addEventListener("click", (event) => {
        const el = event.target.closest("[data-action],[data-go]");
        if (!el || el.disabled) return;
        event.preventDefault();
        try {
          if (el.dataset.go) this.go(el.dataset.go);
          else this.action(el.dataset.action, el.dataset);
        } catch (error) {
          U.toast(error.message, true);
        }
      });
      document.addEventListener("input", (event) => {
        if (event.target.id === "workshop-search") {
          this.workshopSearch = event.target.value;
          U.applyWorkshopFilter?.(this.state);
        }
      });
      document.addEventListener("submit", (event) => {
        event.preventDefault();
        try {
          this.submit(event.target);
        } catch (error) {
          U.toast(error.message, true);
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.close();
          return;
        }
        if (e.key === "Tab" && document.querySelector(".modal")) {
          const focusables = [
              ...document.querySelectorAll(
                '.modal button:not(:disabled),.modal input:not([type=hidden]),.modal select,.modal [tabindex="0"]',
              ),
            ].filter((el) => el.offsetParent !== null),
            first = focusables[0],
            last = focusables.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
        if (
          (e.key === "Enter" || e.key === " ") &&
          e.target.matches("g[data-go]")
        ) {
          e.preventDefault();
          this.go(e.target.dataset.go);
        }
        if (
          e.code === "Space" &&
          this.state?.race &&
          !e.target.matches("input,select,button") &&
          !document.querySelector(".modal")
        ) {
          e.preventDefault();
          this.action("pause", {});
        }
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.persist();
          if (this.state?.race) {
            this.paused = true;
            this.updatePause();
          }
        }
      });
      window.addEventListener("beforeunload", () => this.persist());
      requestAnimationFrame((t) => this.frame(t));
    },
    setState(s, slot) {
      this.state = s;
      this.selectedCarId = null;
      this.slot = slot;
      this.speed = 1;
      this.paused = false;
      this.follow = true;
      this.cameraOptions = { mode: "broadcast", focusId: null, zoom: 1.5 };
      G.Sound.reset();
      this.accumulator = 0;
      this.lastAuto = 0;
      this.saveError = false;
      this.loadLogo();
      this.view = s.race ? "race" : "hq";
      this.close();
      this.render();
    },
    loadLogo() {
      this.logoImage = null;
      if (this.state?.logo) {
        const image = new Image();
        image.src = this.state.logo;
        this.logoImage = image;
      }
    },
    render() {
      U.render(this.state, this.view);
      if (this.view === "workshop") U.applyWorkshopFilter?.(this.state);
      this.updateSaveStatus();
      this.updateCamera();
      this.updatePause();
      window.scrollTo(0, 0);
    },
    go(view) {
      this.close();
      if (!this.state) return;
      if (this.state.race) {
        this.view = "race";
        this.render();
        if (view !== "race")
          U.toast("Termina la carrera para volver a la sede.");
        return;
      }
      if (
        ![
          "hq",
          "garage",
          "team",
          "finance",
          "competition",
          "news",
          "history",
          "market",
          "companies",
          "workshop",
          "contracts",
        ].includes(view)
      )
        return;
      this.view = view;
      this.render();
    },
    close() {
      G.RaceUI.closeReplay(this);
      document.getElementById("modal-root").innerHTML = "";
      this.editor = null;
    },
    updateSaveStatus() {
      const el = document.getElementById("save-status");
      if (el)
        el.textContent = this.saveError
          ? "No se pudo guardar · exporta tu partida"
          : `Guardado local · ranura ${this.slot || "—"}`;
    },
    persist(manual = false) {
      if (!this.state || !this.slot) return false;
      try {
        G.Storage.save(this.slot, this.state);
        this.saveError = false;
        this.updateSaveStatus();
        if (manual) U.toast("Partida guardada en la ranura " + this.slot + ".");
        return true;
      } catch (error) {
        this.saveError = true;
        this.updateSaveStatus();
        if (manual || !this.warnedSave) {
          U.toast(
            "No se pudo guardar: " +
              error.message +
              " Puedes exportar una copia desde Opciones.",
            true,
          );
          this.warnedSave = true;
        }
        return false;
      }
    },
    mutate(fn, view = null) {
      fn();
      this.persist();
      if (view) this.view = view;
      this.render();
    },
    advance(count = 1) {
      const result = G.Calendar.advance(this.state, count);
      this.persist();
      if (result.blocked) {
        this.view = "competition";
        this.render();
        this.event(result.event.id);
      } else {
        this.render();
        if (result.bankrupt)
          U.toast("Tu compañía ha agotado su margen de recuperación.", true);
      }
    },
    action(name, data) {
      if (
        G.RaceUI.action(this, name, data) ||
        G.ContractsUI.action(this, name, data) ||
        G.WorkshopUI.action(this, name, data) ||
        G.BusinessUI.action(this, name, data)
      )
        return;
      const s = this.state;
      switch (name) {
        case "new":
          this.newGame();
          break;
        case "close":
          this.close();
          break;
        case "identity":
          this.identity();
          break;
        case "go-competition":
          this.go("competition");
          break;
        case "advance":
          this.advance();
          break;
        case "advance-race": {
          const e = G.nextEvent(s);
          if (e) this.advance(Math.max(1, e.day - s.day));
          break;
        }
        case "next-season":
          this.confirm(
            "Preparar una nueva temporada",
            `Se procesarán todos los días del descanso hasta el 5 de enero: alquiler, nóminas, contratos y encargos pendientes. La previsión de gasto mensual actual es ${U.money(G.Economy.monthly(s))}. El dinero, los vehículos y los rivales se conservan.`,
            () => this.mutate(() => G.Calendar.nextSeason(s), "competition"),
          );
          break;
        case "save":
          this.persist(true);
          break;
        case "saves":
          this.saves();
          break;
        case "load": {
          const loaded = G.Storage.load(Number(data.slot));
          this.setState(loaded.state, Number(data.slot));
          if (loaded.recovered)
            U.toast(
              "Guardado principal dañado: se ha recuperado la copia anterior.",
              true,
            );
          break;
        }
        case "delete-slot":
          this.confirm(
            "Eliminar partida",
            `Se eliminarán la ranura ${data.slot} y su copia de recuperación. Esta acción no se puede deshacer.`,
            () => {
              G.Storage.remove(Number(data.slot));
              if (this.slot === Number(data.slot)) {
                this.state = null;
                this.slot = null;
                U.render(null);
              }
              this.saves();
            },
          );
          break;
        case "menu":
          if (!this.persist() && s) {
            this.confirm(
              "Salir sin guardar",
              "No se pudo guardar. Exporta una copia antes de salir si quieres conservar el progreso.",
              () => {
                this.state = null;
                this.slot = null;
                this.close();
                U.render(null);
              },
            );
          } else {
            this.state = null;
            this.slot = null;
            this.close();
            U.render(null);
          }
          break;
        case "export":
          G.assert(s, "Carga una partida antes de exportarla.");
          this.download(
            G.Storage.pack(s),
            "racing-company-" + s.season.year + ".json",
            "application/json",
          );
          break;
        case "import":
          document.getElementById("import-file").click();
          break;
        case "repair":
          this.mutate(() => G.Economy.repair(s, data.id));
          U.toast("Revisión iniciada. El coche estará listo en dos días.");
          break;
        case "tires":
          this.mutate(() => G.Economy.tires(s, data.id));
          U.toast("Neumáticos instalados.");
          break;
        case "job":
          this.mutate(() => G.Economy.job(s));
          U.toast("Encargo aceptado. Se cobrarán $360 netos en tres días.");
          break;
        case "negotiate":
          this.negotiate(data.id);
          break;
        case "driver-detail":
          this.driverDetail(data.id);
          break;
        case "train":
          this.mutate(() =>
            G.Drivers.train(
              s,
              data.id,
              data.value === "none" ? null : data.value,
            ),
          );
          this.driverDetail(data.id);
          break;
        case "release": {
          const d = s.drivers.find((d) => d.id === data.id);
          this.confirm(
            "Rescindir contrato",
            `La rescisión de ${d.name} cuesta ${U.money(G.Drivers.releaseQuote(d))}, incluidas las nóminas devengadas. Sus inscripciones se retirarán sin reembolso.`,
            () => this.mutate(() => G.Drivers.release(s, data.id), "team"),
          );
          break;
        }
        case "event":
          this.event(data.id);
          break;
        case "start-race":
          G.Race.start(s, data.id);
          this.close();
          this.view = "race";
          this.speed = 1;
          this.paused = false;
          this.accumulator = 0;
          this.cameraOptions = { mode: "broadcast", focusId: null, zoom: 1.5 };
          G.Sound.reset();
          if (G.Sound.enabled)
            G.Sound.unlock().catch(() => {
              G.Sound.enabled = false;
            });
          this.persist();
          this.render();
          break;
        case "skip-race":
          this.confirm(
            "Renunciar a esta ronda",
            "La ronda se disputará entre los rivales. Tu equipo no recibirá puntos ni premios de carrera y no se devolverá la inscripción. El resultado será definitivo.",
            () => {
              this.mutate(() => G.Race.skip(s, data.id), "competition");
              this.results(data.id);
            },
          );
          break;
        case "results":
          this.results(data.id);
          break;
        case "article": {
          const n = s.news.find((n) => n.id === data.id);
          U.modal(
            U.escape(n.title),
            `<p class="eyebrow gold">${n.category.toUpperCase()} / ${U.date(n.day)}</p><p>${U.escape(n.body)}</p><div class="modal-actions">${U.button("Consultar acontecimiento", "news-target", "primary", `data-id="${n.id}"`)}</div>`,
          );
          break;
        }
        case "news-target":
          this.newsTarget(data.id);
          break;
        case "company":
          this.company(data.id);
          break;
        case "speed":
          this.speed = Number(data.value);
          document
            .querySelectorAll(".speed-button")
            .forEach((b) =>
              b.classList.toggle(
                "selected",
                Number(b.dataset.value) === this.speed,
              ),
            );
          break;
        case "pause":
          this.paused = !this.paused;
          this.updatePause();
          break;
        case "camera": {
          const modes = ["broadcast", "follow", "overview"];
          this.cameraOptions.mode =
            modes[(modes.indexOf(this.cameraOptions.mode) + 1) % modes.length];
          if (this.cameraOptions.mode === "broadcast")
            this.cameraOptions.focusId = null;
          this.follow = this.cameraOptions.mode !== "overview";
          this.updateCamera();
          break;
        }
        case "camera-zoom":
          this.cameraOptions.zoom = G.clamp(
            this.cameraOptions.zoom + (data.value === "in" ? 0.2 : -0.2),
            0.65,
            2,
          );
          this.updateCamera();
          break;
        case "watch-driver":
          G.assert(
            s?.race?.entrants.some(
              (a) => a.carId === data.id || a.companyId === data.id,
            ),
            "Ese piloto no está en esta carrera.",
          );
          this.cameraOptions.focusId = data.id;
          this.cameraOptions.mode = "follow";
          this.follow = true;
          this.updateCamera();
          U.updateRace(s);
          break;
        case "race-audio": {
          const wasEnabled = G.Sound.enabled;
          G.Sound.toggle().then((enabled) => {
            this.updateCamera();
            if (!enabled) G.Sound.silence();
            if (!wasEnabled && !enabled)
              U.toast(
                "El navegador no pudo activar el sonido. La carrera continúa.",
                true,
              );
          });
          break;
        }
        case "workshop-filter":
          this.workshopFilter = data.value || "all";
          U.applyWorkshopFilter?.(s);
          break;
        case "workshop-tab":
          this.workshopTab = data.value || "diagnosis";
          U.applyWorkshopFilter?.(s);
          break;
        case "order":
          G.Race.order(s, data.value);
          U.updateRace(s);
          this.persist();
          break;
        case "logo-brush":
          this.editor.tool = "brush";
          this.updateLogoTool();
          break;
        case "logo-eraser":
          this.editor.tool = "eraser";
          this.updateLogoTool();
          break;
        case "logo-color":
          this.editor.color = data.color;
          document.getElementById("logo-color").value = data.color;
          this.editor.tool = "brush";
          this.updateLogoTool();
          break;
        case "logo-undo":
          this.logoUndo(false);
          break;
        case "logo-redo":
          this.logoUndo(true);
          break;
        case "logo-clear":
          this.logoSnapshot();
          this.editor.ctx.clearRect(0, 0, 320, 220);
          this.updateLogoPreview();
          break;
        case "logo-export":
          this.downloadURL(
            this.editor.canvas.toDataURL("image/png"),
            "logotipo.png",
          );
          break;
      }
    },
    confirm(title, text, fn) {
      U.modal(
        title,
        `<p>${U.escape(text)}</p><div class="modal-actions"><button class="secondary" data-action="close">Cancelar</button><button class="primary" id="confirm-action">Confirmar</button></div>`,
      );
      document
        .getElementById("confirm-action")
        .addEventListener("click", () => {
          try {
            this.close();
            fn();
          } catch (error) {
            U.toast(error.message, true);
          }
        });
    },
    newGame() {
      const empty = G.Storage.list().find((x) => x.empty);
      if (!empty) {
        this.saves();
        U.toast(
          "Las cinco ranuras están ocupadas. Exporta y elimina una partida para liberar espacio.",
          true,
        );
        return;
      }
      this.pendingSlot = empty.slot;
      U.modal(
        "Toda leyenda necesita un nombre.",
        `<p>Tu punto de partida: un garaje alquilado en Sevilla, un Honda Civic usado y $12,000. Contrata a tu primer piloto y disputa una temporada completa.</p><form id="new-game-form"><label class="form-field"><span>Nombre de tu compañía</span><input name="companyName" id="company-name" placeholder="Ej. Aster Motorsport" minlength="2" maxlength="32" required autocomplete="off"></label>${this.logoFields()}<div class="modal-actions"><button class="secondary" data-action="close">Volver</button><button class="primary" type="submit">Fundar compañía ${U.icon("arrow")}</button></div></form>`,
        true,
      );
      this.attachLogo("");
      document
        .getElementById("company-name")
        .addEventListener(
          "input",
          (e) =>
            (document.getElementById("logo-company-name").textContent =
              e.target.value || "TU COMPAÑÍA"),
        );
    },
    logoFields() {
      return `<div class="form-field"><span>Tu logotipo · dibuja tu identidad</span></div><div class="logo-workspace"><div class="logo-canvas-wrap"><canvas id="logo-canvas" width="320" height="220" aria-label="Lienzo para dibujar el logotipo"></canvas></div><div class="logo-preview-block"><span class="eyebrow">VISTA PREVIA</span><img id="logo-preview" alt="Vista previa de tu diseño"><b id="logo-company-name">TU COMPAÑÍA</b><small>Fondo transparente</small></div></div><div class="logo-tools"><button type="button" class="selected" data-action="logo-brush">Pincel</button><button type="button" data-action="logo-eraser">Borrador</button>${["#e3af58", "#ecede3", "#8cad98", "#76a6c4", "#d07561"].map((c) => `<button type="button" class="color-dot" data-action="logo-color" data-color="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join("")}<input type="color" id="logo-color" value="#e3af58" aria-label="Color del pincel"><label>Grosor <input type="range" id="logo-size" min="2" max="30" value="9" aria-label="Grosor del pincel"></label></div><div class="logo-tools"><button type="button" data-action="logo-undo">↶ Deshacer</button><button type="button" data-action="logo-redo">↷ Rehacer</button><button type="button" data-action="logo-clear">Limpiar</button><button type="button" data-action="logo-export">Exportar PNG ↗</button></div><p class="fine-print">Dibuja con el ratón o un lápiz. El logotipo te acompañará en la sede, los contratos, los coches y tu archivo histórico. Podrás editarlo después.</p>`;
    },
    attachLogo(src) {
      const canvas = document.getElementById("logo-canvas"),
        ctx = canvas.getContext("2d", { willReadFrequently: true });
      const e = (this.editor = {
        canvas,
        ctx,
        tool: "brush",
        color: "#e3af58",
        size: 9,
        undo: [],
        redo: [],
        drawing: false,
      });
      if (src) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 320, 220);
          this.updateLogoPreview();
        };
        img.src = src;
      }
      const point = (ev) => {
        const b = canvas.getBoundingClientRect();
        return {
          x: ((ev.clientX - b.left) * 320) / b.width,
          y: ((ev.clientY - b.top) * 220) / b.height,
        };
      };
      const draw = (a, b) => {
        ctx.globalCompositeOperation =
          e.tool === "eraser" ? "destination-out" : "source-over";
        ctx.lineWidth = e.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x + 0.01, b.y + 0.01);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      };
      canvas.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        this.logoSnapshot();
        e.drawing = true;
        e.last = point(ev);
        canvas.setPointerCapture(ev.pointerId);
        draw(e.last, e.last);
      });
      canvas.addEventListener("pointermove", (ev) => {
        if (!e.drawing) return;
        const p = point(ev);
        draw(e.last, p);
        e.last = p;
      });
      const end = () => {
        if (!e.drawing) return;
        e.drawing = false;
        this.updateLogoPreview();
      };
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      document.getElementById("logo-color").addEventListener("input", (ev) => {
        e.color = ev.target.value;
        e.tool = "brush";
        this.updateLogoTool();
      });
      document
        .getElementById("logo-size")
        .addEventListener("input", (ev) => (e.size = Number(ev.target.value)));
    },
    updateLogoTool() {
      document
        .querySelector('[data-action="logo-brush"]')
        ?.classList.toggle("selected", this.editor.tool === "brush");
      document
        .querySelector('[data-action="logo-eraser"]')
        ?.classList.toggle("selected", this.editor.tool === "eraser");
    },
    logoSnapshot() {
      const e = this.editor;
      e.undo.push(e.ctx.getImageData(0, 0, 320, 220));
      if (e.undo.length > 25) e.undo.shift();
      e.redo = [];
    },
    logoUndo(redo) {
      const e = this.editor,
        from = redo ? e.redo : e.undo,
        to = redo ? e.undo : e.redo;
      if (!from.length) return;
      to.push(e.ctx.getImageData(0, 0, 320, 220));
      e.ctx.putImageData(from.pop(), 0, 0);
      this.updateLogoPreview();
    },
    updateLogoPreview() {
      const e = this.editor;
      document.getElementById("logo-preview").src =
        e.canvas.toDataURL("image/png");
    },
    logoData() {
      const e = this.editor,
        pixels = e.ctx.getImageData(0, 0, 320, 220).data;
      let nonempty = false;
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i]) {
          nonempty = true;
          break;
        }
      return nonempty ? e.canvas.toDataURL("image/png") : "";
    },
    identity() {
      U.modal(
        "Identidad de tu compañía",
        `<form id="identity-form"><label class="form-field"><span>Nombre de compañía</span><input name="companyName" value="${U.escape(G.player(this.state).name)}" minlength="2" maxlength="32" required></label>${this.logoFields()}<div class="modal-actions"><button class="secondary" data-action="close">Cancelar</button><button class="primary" type="submit">Guardar identidad</button></div></form>`,
        true,
      );
      this.attachLogo(this.state.logo);
    },
    negotiate(id) {
      const s = this.state,
        d = s.drivers.find((d) => d.id === id && !d.companyId);
      G.assert(d, "El piloto no está disponible.");
      const n = s.negotiations[id];
      U.modal(
        "Negociación · " + U.escape(d.name),
        `<div class="company-profile">${U.portrait(d)}<div><h3>${U.escape(d.name)}</h3><p>${d.age} años · ${U.escape(d.nation)} · ${G.Data.traits[d.trait].name}</p><p>Solicita ${U.money(d.ask)} mensuales · Representante: Agencia Club</p></div></div>${n ? `<div class="counter-offer"><b>Contraoferta: ${U.money(n.salary)} al mes</b><p>${n.cooldown > s.day ? "Tras varias ofertas insuficientes, el representante pide esperar hasta el " + U.date(n.cooldown, true) + "." : "El piloto aceptaría este salario con la duración y prima propuestas. Puedes aceptarlo o presentar otra oferta."}</p></div>` : ""}<form id="negotiate-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Salario mensual ($)</span><input type="number" name="salary" min="200" max="10000" step="1" value="${n?.salary || d.ask}" required></label><label class="form-field"><span>Duración</span><select name="months">${[6, 12, 24].map((m) => `<option value="${m}" ${(n?.months || 12) === m ? "selected" : ""}>${m} meses</option>`).join("")}</select></label></div><label class="form-field"><span>Prima de contratación ($)</span><input name="bonus" type="number" min="0" max="5000" step="1" value="${n?.bonus || 0}" required></label>${G.ContractsUI.driverFields(s, n?.terms)}<div class="onboarding-note"><strong>Pago de nóminas</strong>Los salarios se devengan diariamente y se pagan el día 1. La rescisión suma los meses pactados y lo devengado. Las primas de victoria se pagan al liquidar la carrera.</div><div class="modal-actions"><button class="secondary" data-action="close">Retirarse</button><button class="primary" type="submit">${n ? "Presentar / aceptar oferta" : "Presentar oferta"}</button></div></form>`,
        true,
      );
    },
    driverDetail(id) {
      const s = this.state,
        d = s.drivers.find((d) => d.id === id);
      G.assert(d, "Piloto no disponible.");
      const own = d.companyId === s.playerId;
      U.modal(
        U.escape(d.name),
        `<div class="company-profile">${U.portrait(d)}<div><h3>${U.escape(d.name)}</h3><p>${d.age} años · ${U.escape(d.nation)} · ${G.Data.traits[d.trait].name}</p><p>${d.starts} salidas · ${d.points} puntos · Moral ${Math.round(d.morale)} %</p></div></div><div class="detail-stats">${G.Drivers.stats.map((k) => U.bar(G.Drivers.labels[k], d.stats[k])).join("")}</div>${
          own
            ? `<div class="onboarding-note"><strong>Contrato · ${U.money(d.contract.salary)}/mes</strong>Vence ${U.date(d.contract.end)} · Fatiga ${Math.round(d.fatigue)} % · El descanso recupera 8 puntos de fatiga al día. La formación cuesta $18 por día y recupera solo 2 puntos.</div><div class="modal-actions">${[
                ["none", "Descansar"],
                ["pace", "Entrenar velocidad"],
                ["control", "Entrenar control"],
              ]
                .map(([v, l]) =>
                  U.button(
                    l,
                    "train",
                    (d.training || "none") === v ? "primary" : "secondary",
                    `data-id="${id}" data-value="${v}"`,
                  ),
                )
                .join(
                  "",
                )}</div><div class="modal-actions">${U.button("Rescindir contrato", "release", "text-button negative", `data-id="${id}"`)}</div>`
            : !d.companyId
              ? `<div class="modal-actions">${U.button("Negociar contrato", "negotiate", "primary", `data-id="${id}"`)}</div>`
              : ""
        }`,
        true,
      );
      if (own)
        document
          .querySelector(".modal-content")
          .insertAdjacentHTML("beforeend", G.ContractsUI.driverDetails(s, d));
      if (G.Companies.willing(s, d))
        document
          .querySelector(".modal-content")
          .insertAdjacentHTML(
            "beforeend",
            `<div class="modal-actions">${U.button("Negociar traspaso", "transfer-driver", "primary", `data-id="${id}"`)}</div>`,
          );
    },
    event(id) {
      const s = this.state,
        e = s.season.events.find((e) => e.id === id);
      G.assert(e, "Carrera desconocida.");
      if (e.status !== "scheduled") {
        this.results(id);
        return;
      }
      const t = G.Data.tracks[e.track],
        due = e.day <= s.day,
        d = G.ownedDrivers(s),
        cars = G.ownedCars(s).filter((c) => !G.Market.listed(s, c.id));
      U.modal(
        U.escape(t.name),
        `<p class="eyebrow gold">RONDA ${e.round} / 6 · ${U.date(e.day)} · ${t.laps} VUELTAS</p>${e.entry ? `<div class="onboarding-note"><strong>Inscripción confirmada</strong>${U.escape(s.drivers.find((d) => d.id === e.entry.driverId)?.name || "Piloto no disponible")} · ${U.escape(s.cars.find((c) => c.id === e.entry.carId)?.model || "Coche no disponible")} · Inscripción y transporte pagados: $370</div>${due ? `<div class="modal-actions">${U.button("Renunciar a la ronda", "skip-race", "secondary", `data-id="${id}"`)}${U.button("Ir a la parrilla " + U.icon("flag"), "start-race", "primary", `data-id="${id}"`)}</div>` : `<p class="fine-print">Avanza hasta la fecha de la prueba. El calendario se detendrá para preparar la salida. No puedes sustituir un coche o piloto sin retirar su inscripción.</p><div class="modal-actions">${U.button("Volver al calendario", "close", "primary")}</div>`}` : d.length && cars.length ? `<form id="entry-form" data-id="${id}"><label class="form-field"><span>Piloto</span><select name="driver">${d.map((d) => `<option value="${d.id}">${U.escape(d.name)} · Fatiga ${Math.round(d.fatigue)} %</option>`).join("")}</select></label><label class="form-field"><span>Vehículo</span><select name="car">${cars.map((c) => `<option value="${c.id}">${c.brand} ${c.model} · ${Math.round(c.condition)} % ${c.repair ? "(EN REVISIÓN)" : ""}</option>`).join("")}</select></label><p class="fine-print">Inscripción: $250 · Transporte: $120 · Total: $370. Estado mínimo 45 %, neumáticos 20 % y fatiga inferior a 90 %. La selección quedará vinculada a este evento.</p><div class="modal-actions">${due ? U.button("Renunciar", "skip-race", "secondary", `data-id="${id}"`) : U.button("Cancelar", "close", "secondary")}<button class="primary" type="submit">Confirmar inscripción · $370</button></div></form>` : `<p>${!cars.length ? "Necesitas un vehículo propio sin anuncio de venta. Consulta el mercado o retira tu anuncio antes de inscribirte." : "Necesitas contratar un piloto antes de participar. Hay currículums disponibles en la sala de pilotos."}</p><div class="modal-actions">${due ? U.button("Renunciar a la ronda", "skip-race", "secondary", `data-id="${id}"`) : ""}<button class="primary" data-go="${!cars.length ? "market" : "team"}">${!cars.length ? "Consultar mercado →" : "Buscar un piloto →"}</button></div>`}`,
        true,
      );
      G.RaceUI.entry(this, e);
      if (e.entry)
        document
          .querySelector(".modal-content")
          .insertAdjacentHTML(
            "beforeend",
            `<div class="modal-actions">${U.button("Retirar inscripción sin reembolso", "withdraw-entry", "text-button", `data-id="${id}"`)}</div>`,
          );
    },
    raceRecap(event) {
      const summary = event.raceSummary;
      if (!summary) return "";
      const clock = (t) =>
        String(Math.floor(t / 60)).padStart(2, "0") +
        ":" +
        String(Math.floor(t % 60)).padStart(2, "0");
      return `<section class="race-recap"><div class="section-title"><h3>Así se decidió la carrera</h3></div><div class="overview-strip">${U.stat("Adelantamientos", summary.overtakes || 0)}${U.stat("Contactos", summary.contacts || 0)}${U.stat("Trompos", summary.spins || 0)}${U.stat("Abandonos", summary.retirements || 0)}</div>${(
        summary.highlights || []
      )
        .slice(0, 6)
        .map(
          (e) =>
            `<div class="timeline-line"><small>${clock(e.time)}</small><span>${U.escape(e.text)}</span></div>`,
        )
        .join("")}</section>`;
    },
    results(id) {
      const s = this.state,
        e = s.season.events.find((e) => e.id === id);
      G.assert(e && e.status !== "scheduled", "Todavía no hay resultados.");
      const row = e.results.find((r) => r.companyId === s.playerId);
      const time = (n) =>
        Math.floor(n / 60) + ":" + (n % 60).toFixed(2).padStart(5, "0");
      U.modal(
        "Bandera a cuadros.",
        `<div class="results-hero">${U.logo(s)}<span class="result-position">${row ? (row.dnf ? "DNF" : row.position + "º") : "—"}</span><div><span class="eyebrow">${G.Data.tracks[e.track].name}</span><h3>${row ? U.escape(row.name) : "Tu equipo no participó"}</h3><p>${row ? `${row.points} puntos · Premio ${U.money(row.prize)} · Desgaste aplicado al coche.` : "Renuncia registrada. Los rivales han disputado la ronda."}</p></div></div><div class="results-table"><table><thead><tr><th>POS</th><th>PILOTO / COMPAÑÍA</th><th>TIEMPO</th><th>PTS</th><th>PREMIO</th></tr></thead><tbody>${e.results.map((r) => `<tr class="${r.companyId === s.playerId ? "player-row" : ""}"><td class="position">${r.position}</td><td>${U.escape(r.name)}<br><small class="muted">${U.escape(r.team)}</small></td><td>${r.dnf ? "Abandono" : time(r.time)}${r.dnfReason ? `<small class="muted" style="display:block">${U.escape(r.dnfReason)}</small>` : ""}${r.compound ? `<small class="muted" style="display:block">${G.RaceWeekend.compounds[r.compound].name} · ${r.pitStops} paradas${r.penalty ? " · sanción " + r.penalty + " s" : ""}</small>` : ""}</td><td class="gold">${r.points}</td><td>${U.money(r.prize)}</td></tr>`).join("")}</tbody></table></div>${this.raceRecap(e)}${s.season.phase === "complete" ? '<p class="fine-print">Temporada completada. La clasificación y la prima final ya están registradas en tu archivo histórico.</p>' : ""}<div class="modal-actions"><button class="primary" data-go="competition">${s.season.phase === "complete" ? "Ver clasificación final" : "Volver al paddock"} ${U.icon("arrow")}</button></div>`,
        true,
      );
      G.RaceUI.results(this, e);
    },
    newsTarget(id) {
      const n = this.state.news.find((n) => n.id === id);
      if (!n) return;
      if (n.target === "contracts") {
        this.go("contracts");
        if (n.entityId) G.ContractsUI.detail(this, n.entityId);
        return;
      }
      if (n.entityId && n.target === "car") {
        G.BusinessUI.car(this, n.entityId);
        return;
      }
      if (n.entityId && n.target === "driver") {
        this.driverDetail(n.entityId);
        return;
      }
      if (n.entityId && n.target === "market") {
        this.go("market");
        G.BusinessUI.car(this, n.entityId);
        return;
      }
      if (
        n.entityId &&
        n.target === "finance" &&
        n.entityId !== this.state.playerId
      ) {
        this.company(n.entityId);
        return;
      }
      if (n.target === "companies" && n.entityId) {
        this.company(n.entityId);
        return;
      }
      if (n.entityId && n.target === "team") {
        this.go("team");
        this.driverDetail(n.entityId);
        return;
      }
      if (n.entityId && n.target === "competition") {
        const e = this.state.season.events.find((e) => e.id === n.entityId);
        this.go("competition");
        if (e) this.event(e.id);
        return;
      }
      this.go(n.target === "companies" ? "competition" : n.target);
    },
    company(id) {
      const s = this.state,
        c = s.companies.find((c) => c.id === id);
      G.assert(c, "Compañía no disponible.");
      U.modal(U.escape(c.name), U.companyBody(s, c), true);
    },
    saves() {
      const slots = G.Storage.list();
      U.modal(
        "Tu historia, guardada.",
        `<p>Cinco partidas locales, cada una con una copia de recuperación. Exporta un archivo para conservar tu progreso fuera de este navegador.</p>${slots.map((x) => `<div class="slot-row"><div><span class="eyebrow gold">RANURA ${x.slot} ${x.slot === this.slot ? "· ACTUAL" : ""}</span><h3>${U.escape(x.name || (x.empty ? "Disponible" : "Guardado dañado"))}</h3><p>${x.empty ? "Una historia por escribir." : x.error ? U.escape(x.error) : U.date(x.day) + " · " + new Date(x.savedAt).toLocaleString("es-ES") + (x.recovered ? " · COPIA RECUPERADA" : "")}</p></div><div class="slot-actions">${!x.empty && !x.error ? U.button("Cargar", "load", "secondary", `data-slot="${x.slot}"`) : ""}${!x.empty ? U.button("Eliminar", "delete-slot", "text-button negative", `data-slot="${x.slot}"`) : ""}</div></div>`).join("")}<div class="save-utilities">${this.state ? U.button("Guardar ahora", "save", "primary") + U.button("Exportar JSON", "export", "secondary") : ""}${U.button("Importar JSON", "import", "secondary")}<input id="import-file" type="file" accept=".json,application/json">${U.button("Nueva compañía", "new", "secondary")}${this.state ? U.button("Menú principal", "menu", "text-button") : ""}</div><p class="about-note">Guardado automático tras cada decisión y cada 5 segundos de carrera. El borrado del navegador también borra las partidas locales. Abrir index.html y usar el servidor local pueden crear almacenes diferentes; usa exportar/importar para trasladarlas.</p>`,
        true,
      );
      document
        .getElementById("import-file")
        .addEventListener("change", async (event) => {
          try {
            const file = event.target.files[0];
            if (!file) return;
            G.assert(file.size < 5000000, "Archivo demasiado grande.");
            const { state } = G.Storage.unpack(await file.text());
            const slot = G.Storage.list().find((x) => x.empty)?.slot;
            G.assert(
              slot,
              "No hay ranuras libres. Exporta y elimina una partida antes de importar.",
            );
            G.Storage.save(slot, state);
            this.setState(state, slot);
            U.toast("Partida importada y validada.");
          } catch (error) {
            U.toast(error.message, true);
          }
        });
    },
    submit(form) {
      const values = new FormData(form),
        s = this.state;
      if (
        G.RaceUI.submit(this, form, values) ||
        G.ContractsUI.submit(this, form, values) ||
        G.BusinessUI.submit(this, form, values)
      )
        return;
      switch (form.id) {
        case "new-game-form": {
          const logo = this.logoData();
          G.assert(logo, "Dibuja tu logotipo antes de fundar la compañía.");
          G.assert(
            G.Storage.list().find((x) => x.slot === this.pendingSlot)?.empty,
            "La ranura ya está ocupada. Abre una nueva partida otra vez.",
          );
          const state = G.createGame(String(values.get("companyName")), logo);
          G.Storage.save(this.pendingSlot, state);
          this.setState(state, this.pendingSlot);
          U.toast(
            "Bienvenido a tu primer garaje. Empieza por la sala de pilotos.",
          );
          break;
        }
        case "identity-form": {
          const name = String(values.get("companyName")).trim();
          G.assert(
            name.length >= 2 && name.length <= 32,
            "El nombre debe tener entre 2 y 32 caracteres.",
          );
          const logo = this.logoData();
          G.assert(logo, "El logotipo está vacío.");
          G.player(s).name = name;
          s.logo = logo;
          this.loadLogo();
          this.close();
          this.persist();
          this.render();
          break;
        }
        case "negotiate-form": {
          const result = G.Drivers.offer(
            s,
            form.dataset.id,
            Number(values.get("salary")),
            Number(values.get("months")),
            Number(values.get("bonus")),
            {
              role: String(values.get("contractRole") || "principal"),
              winBonus: Number(values.get("winBonus") || 0),
              releaseMonths: Number(values.get("releaseMonths") || 1),
              promiseShare: Number(values.get("promiseShare") || 0),
              renewalOption: values.has("renewalOption"),
            },
          );
          this.persist();
          this.render();
          if (result.accepted) {
            this.close();
            this.go("team");
            U.toast(
              "Contrato firmado. El piloto ya forma parte de tu compañía.",
            );
          } else {
            this.negotiate(form.dataset.id);
            U.toast(
              result.cooldown
                ? "La negociación se pausa durante siete días."
                : "El representante ha presentado una contraoferta.",
            );
          }
          break;
        }
        case "entry-form": {
          const id = form.dataset.id;
          G.Race.register(s, id, values.get("driver"), values.get("car"), {
            compound: String(values.get("compound") || "road"),
            fuel: Number(values.get("fuel") || 3),
          });
          this.persist();
          this.render();
          this.event(id);
          U.toast("Inscripción confirmada. Se han descontado $370.");
          break;
        }
      }
    },
    download(text, name, mime) {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      this.downloadURL(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    downloadURL(url, name) {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
    },
    updateCamera() {
      const button = document.getElementById("camera-button");
      if (button)
        button.textContent =
          "Cámara: " +
          { broadcast: "TV", follow: "seguimiento", overview: "circuito" }[
            this.cameraOptions.mode
          ];
      const zoom = document.getElementById("camera-zoom-value");
      if (zoom)
        zoom.textContent = Math.round(this.cameraOptions.zoom * 100) + " %";
      const sound = document.getElementById("audio-button");
      if (sound) {
        sound.textContent = G.Sound.enabled
          ? "Silenciar sonido"
          : "Activar sonido";
        sound.setAttribute("aria-pressed", String(G.Sound.enabled));
      }
    },
    updatePause() {
      const b = document.getElementById("pause-button");
      if (b) b.textContent = this.paused ? "Reanudar" : "Pausar";
    },
    frame(time) {
      const elapsed = this.lastFrame
        ? Math.min(0.25, (time - this.lastFrame) / 1000)
        : 0;
      this.lastFrame = time;
      const s = this.state;
      if (s?.race && this.view === "race") {
        if (!this.paused) {
          this.accumulator += elapsed * this.speed;
          const steps = Math.floor(this.accumulator / G.Race.dt);
          if (steps) {
            G.Race.tick(s, steps);
            this.accumulator -= steps * G.Race.dt;
          }
        }
        const canvas = document.getElementById("race-canvas");
        if (canvas)
          G.Render.track(
            canvas,
            s.race,
            s.race.track,
            this.logoImage,
            this.cameraOptions,
          );
        G.Sound.update(
          s.race,
          this.paused,
          canvas
            ? G.Render.cameraInfo(
                canvas,
                s.race,
                s.race.track,
                this.cameraOptions,
              )?.focusId
            : this.cameraOptions.focusId,
        );
        if (time - this.lastPaint > 150) {
          U.updateRace(s);
          this.lastPaint = time;
        }
        if (time - this.lastAuto > 5000) {
          this.persist();
          this.lastAuto = time;
        }
        if (s.race.finished) {
          const id = s.race.eventId;
          G.Race.finish(s);
          this.view = "competition";
          this.persist();
          this.render();
          this.results(id);
        }
      }
      G.RaceUI.frame(time);
      if (!s?.race) G.Sound.silence();
      requestAnimationFrame((t) => this.frame(t));
    },
  };
  G.App.boot();
})();
