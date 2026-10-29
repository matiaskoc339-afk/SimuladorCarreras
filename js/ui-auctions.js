"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    A = G.Auctions,
    C = G.AuctionContent,
    money = U.money.bind(U),
    esc = U.escape.bind(U),
    button = U.button.bind(U);
  const types = {
    collector: "Coleccionista",
    tuner: "Preparador",
    restorer: "Restaurador",
    dealer: "Comerciante",
    team: "Compañía rival",
  };
  const B = (G.AuctionUI = {
    accumulator: 0,
    lastSignature: "",
    savedSecond: null,
    art(s, l) {
      const p = A.preview(s, l);
      if (l.kind === "car")
        return G.CoachworkArt.side(p, { key: "auction-" + l.id });
      const d = G.Parts.definition(p.definitionId);
      if (d.slot === "shell") {
        const car = s.cars.find((c) => d.models?.includes(c.modelIndex)) || {
          ...G.Data.models[d.models?.[0] || 0],
          modelIndex: d.models?.[0] || 0,
          id: l.id,
          color: d.accent,
          base: G.Data.models[d.models?.[0] || 0],
          installed: {},
        };
        return G.CoachworkArt.side(
          {
            ...car,
            coachwork: {
              ...G.Coachwork.spec(s, car),
              style: d.kit,
              widthExtra: d.widthExtra || 0,
              exclusive: { accent: d.accent },
            },
          },
          { key: l.id },
        );
      }
      return `<div class="auction-specimen" style="--specimen-color:${d.accent || "#b9c2aa"}">${G.Art.part(d)}<span>${d.serial ? "CERTIFICADO #" + d.serial.toString(36).toUpperCase() : "UNIDAD DE INVENTARIO"}</span><small>${esc(d.maker || "Paddock Components")}</small></div>`;
    },
    quality(s, l) {
      const p = A.preview(s, l);
      return l.kind === "car"
        ? `${p.year} · ${Math.round(p.hp)} CV · ${Math.round(p.km).toLocaleString("es-ES")} km`
        : `${G.Parts.slots[G.Parts.definition(p.definitionId).slot]}${G.Parts.definition(p.definitionId).slot === "shell" ? " · solo paneles" : ""} · ${Math.round(p.condition)} % de estado`;
    },
    feature(s, l) {
      const p = A.preview(s, l);
      if (l.kind === "car")
        return p.collectible
          ? `${p.collectible.title} · edición ${p.collectible.edition} · ${Object.keys(p.installed).length} conjuntos montados`
          : `${p.brand} ${p.model} con su configuración y desgaste actuales`;
      const d = G.Parts.definition(p.definitionId);
      return d.auctionOnly
        ? `${d.maker} · ${d.rarity}`
        : "Unidad del inventario · usada";
    },
    card(s, l) {
      const mine = l.sellerId === s.playerId,
        p = A.preview(s, l),
        unique =
          l.kind === "car"
            ? !!p.collectible
            : G.Parts.definition(p.definitionId).auctionOnly;
      return `<article class="auction-lot-card panel" data-auction-kind="${l.kind}"><div class="auction-lot-art">${this.art(s, l)}<span class="auction-seal">${unique ? "EDICIÓN INDIVIDUAL" : "TU INVENTARIO"}</span><span class="auction-lot-number">LOTE ${l.id.split("-")[1]}</span></div><div class="auction-lot-copy"><span class="eyebrow">${esc(this.feature(s, l))}</span><h2>${esc(A.title(s, l))}</h2><p>${esc(this.quality(s, l))}</p><div class="auction-estimate"><span>Estimación orientativa</span><b>${money(Math.round(l.estimate * 0.8))} – ${money(Math.round(l.estimate * 1.2))}</b></div><div class="auction-lot-price"><div><small>Precio de salida</small><strong>${money(l.opening)}</strong></div>${button(mine ? "Ver mi subasta" : "Entrar a la sala", "auction-enter", "primary", `data-id="${l.id}"`)}</div><div class="auction-card-footer"><span>${mine ? "Recibes el 80 % si se vende" : "Observar es gratis · pujar compromete la compra"}</span><span>Hasta ${U.date(l.endDay, true)}</span></div><div class="auction-lot-links">${button("Inspeccionar lote", "auction-detail", "text-button", `data-id="${l.id}"`)}${mine ? button("Retirar antes de abrir", "auction-cancel", "text-button", `data-id="${l.id}"`) : ""}</div></div></article>`;
    },
    inspect(s, l) {
      const p = A.preview(s, l);
      let html = `<div class="auction-detail-art">${this.art(s, l)}</div><p class="eyebrow">${esc(this.feature(s, l))}</p><h3>${esc(A.title(s, l))}</h3><p>${esc(this.quality(s, l))}</p>`;
      if (l.kind === "part") {
        const d = G.Parts.definition(p.definitionId);
        html += `<p>${esc(d.description)}</p><div class="auction-spec-list">${Object.entries(
          d.effects,
        )
          .map(
            ([k, v]) =>
              `<span>${esc({ hp: "Potencia", weight: "Masa", grip: "Agarre", brakes: "Frenada", top: "Punta", cooling: "Refrigeración", acceleration: "Transmisión", stress: "Carga térmica", bodyWear: "Exposición al daño", tireWear: "Desgaste de gomas", reliability: "Fiabilidad" }[k] || k)} <b>${v > 0 ? "+" : ""}${v}</b></span>`,
          )
          .join(
            "",
          )}</div><p>Montaje aparte: ${money(d.labor)} y ${G.Staff.plan(s, s.playerId, "install", d.days).days} días. No se instala al adjudicar.</p><h4>Compatibilidad con tus coches</h4>${
          G.ownedCars(s)
            .map((car) => {
              const temp = { ...s, parts: [...s.parts, p] },
                reason = WFit(temp, car, p);
              return `<p><b>${esc(car.brand + " " + car.model)}</b>: ${esc(reason || "Compatible con esta configuración")}</p>`;
            })
            .join("") ||
          "<p>No tienes coches para comparar. Revisa el modelo y requisitos de la ficha.</p>"
        }`;
      } else
        html += `<div class="auction-spec-list"><span>Masa <b>${Math.round(p.weight)} kg</b></span><span>Agarre <b>${p.grip.toFixed(1)}</b></span><span>Frenada <b>${p.brakes.toFixed(1)}</b></span><span>Fiabilidad <b>${p.reliability.toFixed(1)}</b></span></div><h4>Preparación que se entrega</h4><p>${
          l.blueprint?.parts
            .map((id) => esc(G.Parts.definition(id).name))
            .join(" · ") ||
          Object.values(p.installed)
            .map((id) =>
              esc(
                G.Parts.definition(
                  s.parts.find((p) => p.id === id).definitionId,
                ).name,
              ),
            )
            .join(" · ") ||
          "Equipamiento original"
        }</p><p>Conserva su pintura, kilometraje, piezas y desgaste. Se comprueba el reglamento al inscribirse en una competición.</p>`;
      return (
        html +
        `<div class="auction-estimate"><span>Salida ${money(l.opening)} · incremento mínimo ${money(l.step)}</span><b>La estimación no garantiza el precio de venta.</b></div>`
      );
    },
    landing(s) {
      const lots = s.auctions.lots.filter((l) => l.status === "listed"),
        mine = lots.filter((l) => l.sellerId === s.playerId);
      return `<section class="auction-hero"><div><span class="eyebrow">R/C · SALÓN DE COLECCIONISTAS</span><h2>Algunas oportunidades<br>solo pasan una vez.</h2><p>Preparaciones de autor, carrocerías de archivo y coches de colección. Estudia el lote, escucha al presentador y decide cuánto merece tu dinero.</p><div class="auction-hero-facts"><span><b>${lots.length}</b> lotes abiertos</span><span><b>10 s</b> tras cada puja</span><span><b>80 %</b> neto al vender</span></div></div><div class="auction-gavel" aria-hidden="true"><svg viewBox="0 0 300 240"><defs><linearGradient id="auction-wood"><stop stop-color="#cdad77"/><stop offset="1" stop-color="#7e6849"/></linearGradient></defs><ellipse cx="160" cy="204" rx="98" ry="12" fill="#000" opacity=".3"/><path d="M80 190H229L247 207H64Z" fill="#38515b" stroke="#78918d"/><g transform="rotate(-28 156 104)"><rect x="144" y="86" width="22" height="114" rx="8" fill="url(#auction-wood)"/><rect x="99" y="48" width="110" height="68" rx="9" fill="url(#auction-wood)"/><path d="M110 50V113M198 50V113" stroke="#e4d4a0" stroke-width="7"/><path d="M121 61H184" stroke="#ead7aa" opacity=".5" stroke-width="3"/></g></svg><span>EL VALOR LO DECIDE LA SALA.</span></div></section><div class="auction-entry-grid"><button class="auction-entry panel" data-action="auction-tab" data-tab="browse"><span class="eyebrow">01 · ADQUIRIR</span><h2>Ver subastas <span>${U.icon("arrow")}</span></h2><p>${lots.length} lotes: piezas exclusivas, carrocerías y coches preparados. Puedes entrar solo a observar.</p></button><button class="auction-entry panel" data-action="auction-tab" data-tab="sell"><span class="eyebrow">02 · CONSIGNAR</span><h2>Subastar mis objetos <span>${U.icon("arrow")}</span></h2><p>Elige un coche o una pieza libre. Fija la salida y sigue la puja. ${mine.length ? mine.length + " lotes tuyos pendientes." : "Recibes el 80 %; la casa cobra un 20 %."}</p></button></div>`;
    },
    browser(s, mine = false) {
      const lots = s.auctions.lots.filter(
          (l) => l.status === "listed" && (!mine || l.sellerId === s.playerId),
        ),
        filter = G.App.auctionFilter || "all";
      return `<div class="auction-list-heading"><div><span class="eyebrow">${mine ? "TUS CONSIGNACIONES" : "CATÁLOGO DE LA SALA"}</span><h2>${mine ? "Objetos que has consignado" : "Elige tu próxima oportunidad"}</h2><p>Renovación de lotes ${U.date(s.auctions.nextDay)}. Los objetos que no visites también pueden adjudicarse al vencer.</p></div><label><span>Mostrar</span><select id="auction-filter"><option value="all">Todos los lotes</option><option value="part" ${filter === "part" ? "selected" : ""}>Piezas y carrocerías</option><option value="car" ${filter === "car" ? "selected" : ""}>Coches de colección</option></select></label></div><div class="auction-lot-grid">${
        lots
          .filter((l) => filter === "all" || l.kind === filter)
          .map((l) => this.card(s, l))
          .join("") ||
        '<section class="panel padded auction-empty"><h3>No hay lotes con este filtro.</h3><p>Puedes consignar un objeto o esperar a la próxima renovación.</p></section>'
      }</div>`;
    },
    selling(s) {
      const kind = G.App.auctionSellKind || "part",
        items = kind === "car" ? G.ownedCars(s) : G.Workshop.inventory(s),
        id = G.App.auctionSellId,
        p = items.find((p) => p.id === id) || items[0],
        lot = p ? { kind, assetId: p.id, sellerId: s.playerId } : null,
        reason = p
          ? A.sellerReason(s, kind, p.id)
          : "No tienes objetos de esta categoría.",
        value = p ? A.value(s, lot) : 0,
        opening =
          G.App.auctionOpening ?? Math.max(100, Math.round(value * 0.7)),
        min = Math.max(100, Math.round(value * 0.5)),
        max = Math.max(100, Math.round(value * 1.5));
      return `<section class="auction-sell-intro panel"><div><span class="eyebrow">CONSIGNA TU OBJETO</span><h2>De tu inventario a la sala.</h2><p>Tu objeto queda reservado hasta la adjudicación o retirada. No se cobra por consignar; solo se retiene el 20 % del precio de venta.</p></div><div class="auction-kind-buttons">${["part", "car"].map((k) => button(k === "part" ? "Piezas libres" : "Mis coches", "auction-kind", kind === k ? "primary" : "secondary", `data-kind="${k}"`)).join("")}</div></section>${p ? `<div class="auction-sell-layout"><section class="panel auction-sell-preview"><div class="auction-detail-art">${this.art(s, lot)}</div><div class="padded"><span class="eyebrow">${p.id}</span><h2>${esc(A.title(s, lot))}</h2><p>${esc(this.quality(s, lot))}</p><b>Valoración orientativa ${money(value)}</b></div></section><section class="panel padded"><form id="auction-consign-form" data-kind="${kind}" data-id="${p.id}"><label class="form-field"><span>Objeto de tu inventario</span><select id="auction-sell-item">${items.map((item) => `<option value="${item.id}" ${item.id === p.id ? "selected" : ""}>${esc(kind === "car" ? item.brand + " " + item.model : G.Parts.definition(item.definitionId).name)} · ${item.id}${A.sellerReason(s, kind, item.id) ? " · no disponible" : ""}</option>`).join("")}</select></label><label class="form-field"><span>Precio de salida (US$)</span><input id="auction-opening" name="opening" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${opening}" required></label><p class="fine-print">Entre ${money(min)} y ${money(max)}. Una salida alta puede dejar el objeto sin vender.</p><div class="auction-net-panel"><span>Si se vende por la salida, recibes</span><strong id="auction-net">${money(Math.floor(opening * 0.8))}</strong><small>80 % para ti · 20 % para la casa</small></div>${reason ? `<p class="auction-warning">${esc(reason)}</p>` : ""}<button type="submit" class="primary wide" ${reason ? "disabled" : ""}>Consignar en subasta</button><p class="fine-print">Puedes entrar a observar tu sala. Si no la abres, se resolverá con participantes IA al vencer dentro de siete días. No puedes pujar por tu propio objeto.</p></form></section></div>` : `<section class="panel padded"><h3>No tienes ${kind === "car" ? "coches" : "piezas libres"} para consignar.</h3><p>Las piezas instaladas se desmontan primero desde el taller.</p><button class="secondary" data-go="workshop">Abrir el taller</button></section>`}`;
    },
    room(s) {
      const r = A.room(s),
        l = A.lot(s, r.lotId),
        current = A.actor(s, r.leader),
        reason = A.bidReason(s, r.ask),
        mine = l.sellerId === s.playerId,
        isLive = A.active(s),
        count = r.leader ? Math.ceil(r.remaining / 10) : null;
      return `<section class="auction-room" data-room-status="${r.status}"><div class="auction-room-top"><span class="eyebrow">${isLive ? "SALA EN VIVO" : "SALA CERRADA"} · LOTE ${l.id.split("-")[1]}</span><span>${mine ? "ESTÁS OBSERVANDO TU OBJETO" : "Cada nueva oferta reinicia 10 segundos"}</span></div><div class="auction-room-stage"><div class="auction-room-item">${this.art(s, l)}<div><span class="eyebrow">${esc(this.feature(s, l))}</span><h2>${esc(A.title(s, l))}</h2><p>${esc(this.quality(s, l))}</p></div></div><div class="auction-podium"><span class="auction-presenter-label">EL PRESENTADOR</span><div class="auction-count ${count !== null && count <= 3 && isLive ? "urgent" : ""}" id="auction-count" aria-label="Segundos restantes">${!isLive ? "0" : (count ?? "—")}</div><p class="auction-presenter" id="auction-presenter" aria-live="polite">${esc(r.comment)}</p><span id="auction-timer-note">${!isLive ? (r.status === "sold" ? "Adjudicación cerrada" : "Lote sin adjudicar") : r.leader ? "segundos para el golpe de martillo" : "Esperando la primera oferta"}</span></div></div><div class="auction-room-bottom"><div class="auction-current"><span>${r.leader ? "Mejor oferta" : "Precio de salida"}</span><b>${money(r.price || l.opening)}</b><small>${esc(current?.name || "Nadie ha levantado la paleta")}</small></div>${isLive ? `<div class="auction-bid-controls">${button(mine ? "No puedes pujar por tu objeto" : r.leader === s.playerId ? "Tu oferta es la más alta" : "Pujar " + money(r.ask), "auction-bid", "primary", `data-price="${r.ask}" ${reason ? "disabled" : ""}`)}${button(r.leader === s.playerId ? "Retirarme · mi puja sigue vigente" : mine ? "Salir y ver resultado" : "Retirarme y ver resultado", "auction-exit", "secondary")}<small>${esc(mine ? "La sala se resolverá con los participantes presentes." : reason || "Aceptar este precio compromete la compra si tu oferta gana.")}</small></div>` : `<div class="auction-result"><strong>${r.status === "sold" ? (r.leader === s.playerId ? "El lote ya es tuyo." : mine ? "Venta completada." : "Adjudicado a otro participante.") : "El objeto no se ha vendido."}</strong><p>${mine && l.result?.price ? `Has recibido ${money(l.result.net)} · comisión ${money(l.result.fee)}.` : r.leader === s.playerId ? (l.kind === "part" ? "La unidad está en tu almacén. El montaje se programa aparte." : "El coche y sus piezas están en tu garaje.") : r.status === "unsold" && mine ? "Conservas el objeto, disponible de nuevo en tu inventario." : "Puedes consultar otras oportunidades."}</p><div>${button("Volver a los lotes", "auction-tab", "secondary", 'data-tab="browse"')}${r.leader === s.playerId ? `<button class="primary" data-go="${l.kind === "part" ? "workshop" : "garage"}">Ver mi ${l.kind === "part" ? "pieza" : "coche"}</button>` : ""}</div></div>`}</div><div class="auction-commitment">${r.leader === s.playerId && isLive ? `Tienes ${money(r.price)} comprometidos. Retirarte no anula esa oferta; si nadie la supera, se adjudicará a tu compañía.` : "La sala utiliza el dinero y las plazas reales de los participantes. El tiempo de la empresa se detiene durante la puja."}</div></section><section class="auction-audience panel padded"><div class="section-title"><div><span class="eyebrow">PALETAS EN LA SALA</span><h2>Intereses distintos. Límites propios.</h2></div><span>${r.bidders.length} participantes IA</span></div><div class="auction-audience-grid">${r.bidders.map((b) => `<div class="auction-bidder ${b.id === r.leader ? "leading" : ""} ${b.out ? "out" : ""}"><span class="auction-paddle">${esc(b.name.slice(0, 2).toUpperCase())}</span><div><b>${esc(b.name)}</b><small>${types[b.type]}</small><span>${b.id === r.leader ? "Mejor oferta" : b.out ? "Se retira" : b.bids ? "Sigue la disputa" : "Observa el lote"}</span></div></div>`).join("")}</div></section><section class="panel padded auction-bid-history"><div class="section-title"><h2>Paletas levantadas</h2><span>${r.count} pujas</span></div>${
        r.bids
          .slice()
          .reverse()
          .slice(0, 15)
          .map(
            (b) =>
              `<div class="auction-bid-line"><span>${esc(A.actor(s, b.id)?.name || "Participante")}</span><small>${(b.tick / 10).toFixed(1)} s</small><b>${money(b.price)}</b></div>`,
          )
          .join("") ||
        '<p class="muted">El presentador está buscando la primera oferta.</p>'
      }</section>`;
    },
    history(s) {
      const rows = s.auctions.lots
        .filter((l) => ["sold", "unsold", "withdrawn"].includes(l.status))
        .slice()
        .reverse();
      return `<section class="panel padded auction-history"><div class="section-title"><h2>Adjudicaciones y lotes cerrados</h2><span>Últimos ${rows.length}</span></div>${rows.map((l) => `<div class="auction-history-row"><div><span class="eyebrow">${U.date(l.result?.day ?? l.day, true)} · ${l.status === "sold" ? "ADJUDICADO" : l.status === "withdrawn" ? "RETIRADO" : "SIN PUJAS"}</span><h3>${esc(A.title(s, l))}</h3><p>${l.result?.winnerId ? esc(A.actor(s, l.result.winnerId)?.name) : "El objeto conserva su propietario"}</p></div><div><b>${l.result?.price ? money(l.result.price) : "—"}</b>${l.sellerId === s.playerId && l.result?.price ? `<small>Tu ingreso ${money(l.result.net)}</small>` : ""}</div></div>`).join("") || "<p>Aún no se ha cerrado ninguna subasta.</p>"}</section>`;
    },
    refresh(app) {
      const y = scrollY;
      app.render();
      window.scrollTo(0, y);
    },
    action(app, name, data) {
      if (!name.startsWith("auction-")) return false;
      const s = app.state;
      G.assert(s, "Abre una partida.");
      if (name === "auction-enable") {
        G.assert(!s.race, "Termina la carrera.");
        A.initialize(s);
        app.auctionTab = "home";
        app.persist();
        app.go("auctions");
        return true;
      }
      if (name === "auction-prefill") {
        G.assert(!A.active(s), "Termina la sala actual.");
        if (!A.enabled(s)) A.initialize(s);
        app.auctionSellKind = data.kind;
        app.auctionSellId = data.id;
        app.auctionOpening = null;
        app.auctionTab = "sell";
        app.persist();
        app.go("auctions");
        return true;
      }
      G.assert(A.enabled(s), "Abre la casa de subastas.");
      if (name === "auction-tab") {
        G.assert(!A.active(s), "Termina la sala o retírate antes de salir.");
        app.auctionTab = data.tab;
        this.refresh(app);
        return true;
      }
      if (name === "auction-kind") {
        app.auctionSellKind = data.kind;
        app.auctionSellId = null;
        app.auctionOpening = null;
        this.refresh(app);
        return true;
      }
      if (name === "auction-detail") {
        const l = A.lot(s, data.id);
        G.assert(l, "El lote ya no existe.");
        U.modal("Inspección del lote", this.inspect(s, l), true);
        return true;
      }
      if (name === "auction-enter") {
        const l = A.lot(s, data.id);
        G.assert(l?.status === "listed", "El lote ya no está abierto.");
        app.confirm(
          "Entrar a la sala de subastas",
          `Salida: ${money(l.opening)}. Observar es gratis. Cada oferta reinicia 10 segundos. Las pujas son vinculantes: retirarte no cancela una oferta ganadora. El calendario se detiene durante la sala y la compra se paga al adjudicar.`,
          () => {
            A.start(s, l.id);
            app.auctionTab = "room";
            this.accumulator = 0;
            this.lastSignature = "";
            app.persist();
            app.render();
          },
        );
        return true;
      }
      if (name === "auction-bid") {
        A.bid(s, Number(data.price));
        app.persist();
        this.refresh(app);
        return true;
      }
      if (name === "auction-exit") {
        if (A.room(s).leader === s.playerId)
          app.confirm(
            "Tu oferta sigue vigente",
            `Tu puja de ${money(A.room(s).price)} no se cancela. Si nadie te supera, comprarás el lote. Al salir se resolverán las ofertas de los demás participantes.`,
            () => {
              A.withdraw(s);
              app.persist();
              this.refresh(app);
            },
          );
        else {
          A.withdraw(s);
          app.persist();
          this.refresh(app);
        }
        return true;
      }
      if (name === "auction-cancel") {
        app.confirm(
          "Retirar objeto antes de abrir",
          "El objeto vuelve a estar disponible sin coste. Solo se puede retirar antes de comenzar la sala.",
          () => {
            A.cancel(s, data.id);
            app.persist();
            this.refresh(app);
          },
        );
        return true;
      }
      return false;
    },
    submit(app, form) {
      if (form.id !== "auction-consign-form") return false;
      const opening = Number(new FormData(form).get("opening")),
        kind = form.dataset.kind,
        id = form.dataset.id;
      app.confirm(
        "Consignar objeto",
        `Precio de salida: ${money(opening)}. Si se vende por esa cantidad, recibes ${money(Math.floor(opening * 0.8))}; la comisión es el 20 %. El objeto queda reservado hasta venderse o retirarlo antes de abrir la sala.`,
        () => {
          A.consign(app.state, kind, id, opening);
          app.auctionTab = "mine";
          app.auctionOpening = null;
          app.persist();
          app.render();
        },
      );
      return true;
    },
    frame(app, elapsed) {
      if (!A.active(app.state) || document.hidden) return;
      this.accumulator += elapsed;
      let steps = Math.floor(this.accumulator * 10);
      if (!steps) return;
      this.accumulator -= steps / 10;
      A.tick(app.state, steps);
      const r = A.room(app.state),
        sig =
          r.status +
          ":" +
          r.count +
          ":" +
          r.bidders.filter((b) => b.out).length;
      if (sig !== this.lastSignature) {
        this.lastSignature = sig;
        const focused = document.activeElement?.dataset.action;
        this.refresh(app);
        if (focused === "auction-bid")
          document
            .querySelector('[data-action="auction-bid"]:not(:disabled)')
            ?.focus({ preventScroll: true });
        app.persist();
      }
      if (app.auctionShownId !== r.lotId) {
        app.auctionShownId = r.lotId;
        document
          .querySelector(".auction-room")
          ?.scrollIntoView({ block: "start", behavior: "instant" });
      }
      const count = document.getElementById("auction-count"),
        n = r.leader ? Math.ceil(r.remaining / 10) : null;
      if (count) {
        count.textContent = String(r.status !== "live" ? 0 : (n ?? "—"));
        count.classList.toggle(
          "urgent",
          n !== null && n <= 3 && A.active(app.state),
        );
      }
      const second = Math.ceil(r.remaining / 10);
      if (this.savedSecond !== second) {
        this.savedSecond = second;
        app.persist();
      }
    },
  });
  function WFit(s, car, p) {
    return G.Workshop.fit(s, car, p);
  }
  U.auctions = function (s) {
    if (!A.enabled(s))
      return (
        this.heading(
          "SUBASTAS",
          "Un nuevo salón de oportunidades.",
          "Activa la casa de subastas para descubrir objetos exclusivos y consignar los tuyos.",
        ) +
        `<section class="panel padded"><p>Se añaden lotes y participantes con presupuestos propios. Conservas tu caja, coches y trabajos. Las carreras en curso se terminan primero.</p>${button("Abrir casa de subastas", "auction-enable", "primary", s.race ? "disabled" : "")}</section>`
      );
    const tab = A.active(s) ? "room" : G.App.auctionTab || "home",
      tabs = [
        ["home", "Casa de subastas"],
        ["browse", "Ver subastas"],
        ["sell", "Subastar mis objetos"],
        ["mine", "Mis lotes"],
        ["history", "Adjudicaciones"],
      ];
    return `<div class="auction-root">${this.heading("CASA DE SUBASTAS", "Levanta la paleta. Elige tu límite.", "Objetos individuales, dinero real y diez segundos para decidir.")}<nav class="auction-tabs" aria-label="Secciones de subastas">${tabs.map(([id, label]) => button(label, "auction-tab", tab === id ? "primary" : "secondary", `data-tab="${id}" ${A.active(s) ? "disabled" : ""}`)).join("")}</nav>${tab === "home" ? B.landing(s) : tab === "sell" ? B.selling(s) : tab === "history" ? B.history(s) : tab === "room" && A.room(s) ? B.room(s) : B.browser(s, tab === "mine")}</div>`;
  };
  document.addEventListener("change", (e) => {
    const app = G.App;
    if (e.target.id === "auction-filter") {
      app.auctionFilter = e.target.value;
      B.refresh(app);
    }
    if (e.target.id === "auction-sell-item") {
      app.auctionSellId = e.target.value;
      app.auctionOpening = null;
      B.refresh(app);
      document
        .getElementById("auction-sell-item")
        ?.focus({ preventScroll: true });
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id !== "auction-opening") return;
    G.App.auctionOpening = Number(e.target.value);
    document.getElementById("auction-net").textContent = money(
      Math.floor(Number(e.target.value) * 0.8),
    );
  });
})();
