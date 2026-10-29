"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    W = G.Workshop,
    M = G.Coachwork,
    Art = G.CoachworkArt,
    esc = U.escape.bind(U),
    money = U.money.bind(U),
    button = U.button.bind(U);
  const groups = {
    bodywork: {
      name: "Carrocería",
      short: "Carrocería",
      slots: ["shell", "body"],
    },
    engine: {
      name: "Motor y refrigeración",
      short: "Motor",
      slots: ["engine", "intake", "exhaust", "ecu", "boost", "cooling"],
    },
    drivetrain: {
      name: "Transmisión",
      short: "Transmisión",
      slots: ["clutch", "differential"],
    },
    rolling: {
      name: "Ruedas, frenos y suspensión",
      short: "Tren rodante",
      slots: ["wheels", "tires", "brakes", "suspension"],
    },
    chassis: {
      name: "Refuerzos de chasis",
      short: "Chasis",
      slots: ["chassis"],
    },
    aero: { name: "Aerodinámica", short: "Aerodinámica", slots: ["aero"] },
  };
  const metrics = [
      ["hp", "Potencia configurada", "CV", true],
      ["weight", "Masa", "kg", false],
      ["grip", "Agarre del coche", "", true],
      ["brakes", "Frenada", "", true],
      ["top", "Velocidad punta", "km/h", true],
      ["reliability", "Fiabilidad", "/100", true],
    ],
    details = [
      ["cooling", "Refrigeración", "×", true],
      ["acceleration", "Transmisión de par", "×", true],
      ["stress", "Carga térmica", "", false],
      ["tireWear", "Desgaste de gomas", "×", false],
      ["bodyWear", "Exposición al daño", "×", false],
    ];
  const number = (v, digits = 1) =>
      Number(v.toFixed(digits)).toLocaleString("es-ES", {
        maximumFractionDigits: digits,
      }),
    sign = (v) => (v > 0 ? "+" : "") + number(v, 2);
  const B = (G.WorkbenchUI = {
    groups,
    current(s) {
      const cars = G.ownedCars(s);
      return cars.find((c) => c.id === G.App.selectedCarId) || cars[0];
    },
    refresh(A, focus = null) {
      const y = window.scrollY;
      A.render();
      window.scrollTo({ top: y, behavior: "instant" });
      if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
    },
    select(A, group, slot = null) {
      G.assert(groups[group], "Zona desconocida.");
      A.wbGroup = group;
      A.wbSlot =
        slot && groups[group].slots.includes(slot)
          ? slot
          : A.wbLastSlots?.[group] || groups[group].slots[0];
      A.wbLastSlots = { ...A.wbLastSlots, [group]: A.wbSlot };
      A.wbPreview = null;
      const own = W.inventory(A.state).some(
        (p) =>
          !p.reservedFor &&
          G.Parts.definition(p.definitionId).slot === A.wbSlot,
      );
      A.wbSource = own ? "inventory" : "catalog";
      this.refresh(A);
    },
    review(A, unitId) {
      const car = this.current(A.state),
        q = M.quote(A.state, car?.id, unitId);
      A.confirm(
        q.purchase ? "Comprar y programar montaje" : "Programar montaje",
        `${q.def.name}. ${q.purchase ? "Pieza: " + money(q.purchase) + ". " : ""}Mano de obra: ${money(q.labor)}. Total hoy: ${money(q.total)}. Plazo: ${q.days} días; entrega ${U.date(q.end)}. ${q.old ? "Se desmontará " + G.Parts.definition(q.old.definitionId).name + " y volverá al almacén con su desgaste." : "Se conservará el equipamiento original del alojamiento."} El aspecto y las estadísticas reales cambiarán al terminar.`,
        () => {
          M.install(A.state, car.id, unitId);
          A.wbPreview = null;
          A.persist();
          this.refresh(A);
          U.toast(
            "Montaje reservado. El coche conserva su configuración hasta la entrega.",
          );
        },
      );
    },
    action(A, name, data) {
      if (!name.startsWith("wb-")) return false;
      G.assert(A.state, "Abre una partida para utilizar el taller.");
      const s = A.state,
        car = this.current(s);
      if (name === "wb-enable") {
        A.confirm(
          "Abrir taller visual",
          "Se añade un catálogo de carrocerías, motores y refuerzos con piezas físicas. Conservas tus coches y las instalaciones pendientes. Las reglas nuevas impiden preparaciones incompatibles.",
          () => {
            M.initialize(s);
            A.persist();
            A.go("workshop");
          },
        );
        return true;
      }
      if (name === "wb-tab") {
        A.wbTab = data.tab;
        A.wbPreview = null;
        this.refresh(A);
        return true;
      }
      if (name === "wb-car") {
        A.selectedCarId = data.id;
        A.wbPreview = null;
        this.refresh(A);
        return true;
      }
      if (name === "wb-group") {
        A.wbTab = "build";
        this.select(A, data.group);
        return true;
      }
      if (name === "wb-view") {
        A.wbView = data.view === "top" ? "top" : "side";
        this.refresh(A, `[data-action="wb-view"][data-view="${A.wbView}"]`);
        return true;
      }
      if (name === "wb-zoom") {
        const zoom = A.wbZoom || (window.innerWidth < 560 ? 1.15 : 1);
        A.wbZoom = zoom > 1 ? 1 : 1.25;
        this.refresh(A, '[data-action="wb-zoom"]');
        return true;
      }
      if (name === "wb-technical") {
        A.wbTechnical = !A.wbTechnical;
        this.refresh(A, '[data-action="wb-technical"]');
        return true;
      }
      if (name === "wb-source") {
        A.wbSource = data.source;
        A.wbPreview = null;
        this.refresh(A);
        return true;
      }
      if (name === "wb-preview") {
        const p = s.parts.find((p) => p.id === data.id);
        G.assert(
          p && [null, s.playerId].includes(p.companyId) && !p.carId,
          "Esta pieza ya no está disponible.",
        );
        A.wbPreview = p.id;
        const d = G.Parts.definition(p.definitionId),
          g = Object.keys(groups).find((key) =>
            groups[key].slots.includes(d.slot),
          );
        A.wbGroup = g;
        A.wbSlot = d.slot;
        this.refresh(A, `[data-action="wb-preview"][data-id="${p.id}"]`);
        document
          .querySelector(".wb-stage-panel")
          ?.scrollIntoView({ block: "start", behavior: "instant" });
        return true;
      }
      if (name === "wb-clear") {
        A.wbPreview = null;
        this.refresh(A);
        return true;
      }
      if (name === "wb-fit") {
        this.review(A, data.id);
        return true;
      }
      if (name === "wb-buy") {
        const p = s.parts.find((p) => p.id === data.id),
          d = G.Parts.definition(p?.definitionId);
        G.assert(p?.companyId === null && d, "Pieza no disponible.");
        A.confirm(
          "Comprar para el almacén",
          `${d.name}: ${money(Math.round((d.price * p.condition) / 100))}. La compra no instala la pieza. Podrás montarla o venderla desde tu almacén.`,
          () => {
            W.buy(s, p.id);
            A.wbSource = "inventory";
            A.wbPreview = p.id;
            A.persist();
            this.refresh(A);
            U.toast("Pieza guardada en el almacén.");
          },
        );
        return true;
      }
      if (name === "wb-remove") {
        const q = M.removeQuote(s, car?.id, data.slot);
        A.confirm(
          "Desmontar y recuperar",
          `${q.def.name}: ${money(q.cost)} y ${q.days} día${q.days === 1 ? "" : "s"} de taller. La pieza volverá al almacén con su desgaste y el alojamiento recuperará su configuración original.`,
          () => {
            W.remove(s, car.id, data.slot);
            A.wbPreview = null;
            A.persist();
            this.refresh(A);
          },
        );
        return true;
      }
      if (name === "wb-sell") {
        const p = s.parts.find((p) => p.id === data.id),
          d = G.Parts.definition(p?.definitionId);
        G.assert(p && d, "Pieza desconocida.");
        A.confirm(
          "Vender repuesto",
          `${d.name}: recibirás ${money(Math.round((d.price * 0.6 * p.condition) / 100))}. La unidad volverá al proveedor con su desgaste.`,
          () => {
            W.sell(s, p.id);
            A.wbPreview = null;
            A.persist();
            this.refresh(A);
          },
        );
        return true;
      }
      if (name === "wb-show-all") {
        A.wbTab = "catalog";
        A.wbCatalogSlot = "all";
        A.wbSearch = "";
        A.wbPreview = null;
        this.refresh(A);
        return true;
      }
      return false;
    },
    stage(s, car, preview = null) {
      const A = G.App,
        view = A.wbView || "side",
        zoom = A.wbZoom || (window.innerWidth < 560 ? 1.15 : 1),
        visual = preview
          ? M.visual(s, car, preview.installed)
          : M.visual(s, car),
        points = Art.layout(visual, view),
        group = A.wbGroup || "bodywork",
        props = {
          key: car.id + (preview ? "-" + preview.unit.id : "-actual"),
          technical: !!A.wbTechnical,
        };
      return `<section class="wb-stage-panel"><div class="wb-stage-toolbar"><div><span class="wb-eyebrow">${preview ? "VISTA PREVIA · SIN MONTAR" : "TU CONFIGURACIÓN ACTUAL"}</span><b>${esc(car.brand + " " + car.model)}</b></div><div class="wb-view-controls" aria-label="Perspectiva del coche">${[
        ["side", "Lateral"],
        ["top", "Superior"],
      ]
        .map(
          ([id, label]) =>
            `<button data-action="wb-view" data-view="${id}" aria-pressed="${view === id}" class="${view === id ? "selected" : ""}">${label}</button>`,
        )
        .join(
          "",
        )}<button data-action="wb-zoom" aria-label="Ampliar o reducir vista del coche">${zoom > 1 ? "−" : "+"}</button></div></div><div class="wb-scene ${view === "top" ? "wb-is-top" : "wb-is-side"} ${A.wbTechnical ? "wb-is-technical" : ""}" data-coachwork="${visual.coachwork.style}" style="--wb-zoom:${zoom}"><div class="wb-studio-lines"></div><div class="wb-scene-mark">R<span>//</span>C <small>ENGINEERING STUDIO</small></div><div class="wb-turntable"><div class="wb-view-animation" data-view="${view}">${view === "top" ? Art.top(visual, props) : Art.side(visual, props)}</div></div>${[
        "engine",
        "drivetrain",
        "rolling",
        "rear",
        "chassis",
        "bodywork",
        "aero",
      ]
        .map((id, i) => {
          const key = id === "rear" ? "rolling" : id,
            fitted = groups[key].slots.filter(
              (slot) => car.installed[slot],
            ).length,
            point = points[id],
            selected = group === key;
          return `<button class="wb-hotspot ${selected ? "selected" : ""} ${fitted ? "has-parts" : ""}" style="--x:${(500 + (point[0] - 500) * zoom) / 10}%;--y:${(250 + (point[1] - 250) * zoom) / 5}%" data-action="wb-group" data-group="${key}" data-drop-group="${key}" aria-label="Modificar ${groups[key].short}${id === "rear" ? " · eje trasero" : ""}" aria-pressed="${selected}" title="${groups[key].name}${fitted ? " · " + fitted + " mejoras instaladas" : " · equipo original"}${key === "rolling" ? " · el juego afecta ambos ejes" : ""}"><span>${i + 1}</span><em>${groups[key].short}</em></button>`;
        })
        .join(
          "",
        )}</div><div class="wb-scene-footer"><span>${preview ? "Comparación visual de la pieza elegida" : car.repair ? "Coche en trabajo · cambios pendientes" : "Selecciona una zona o arrastra una pieza sobre ella"}</span><button data-action="wb-technical" aria-pressed="${!!A.wbTechnical}" class="${A.wbTechnical ? "selected" : ""}">${A.wbTechnical ? "Ver carrocería" : "Vista técnica"}</button></div><div class="wb-zone-nav" aria-label="Zonas modificables">${Object.entries(
        groups,
      )
        .map(
          ([id, g]) =>
            `<button data-action="wb-group" data-group="${id}" class="${group === id ? "selected" : ""}" aria-pressed="${group === id}">${g.short}</button>`,
        )
        .join("")}</div>${
        preview
          ? `<div class="wb-comparison-strip" aria-live="polite"><div><span class="wb-eyebrow">VISTA PREVIA · AÚN SIN MONTAR</span><b>${esc(preview.def.name)}</b><small>${preview.reason ? esc(preview.reason) : "Consulta el cambio de prestaciones en la ficha dinámica."}</small></div><div>${button(
              "Revisar montaje",
              "wb-fit",
              "primary",
              `data-id="${preview.unit.id}" ${(() => {
                try {
                  M.quote(s, car.id, preview.unit.id);
                  return "";
                } catch {
                  return "disabled";
                }
              })()}`,
            )}${button("Descartar", "wb-clear", "secondary")}</div></div>`
          : ""
      }${car.repair ? `<div class="wb-job-banner"><span class="wb-status-dot"></span><div><b>${car.repair.type === "install" ? "Montaje" : car.repair.type === "remove" ? "Desmontaje" : "Reparación"} en curso</b><span>Entrega ${U.date(car.repair.end)} · ${Math.max(0, car.repair.end - s.day)} días restantes · ${car.repair.type === "install" ? "Mano de obra " : ""}${money(car.repair.cost)} ya pagados</span></div></div>` : ""}</section>`;
    },
    stats(s, car, preview) {
      const before = W.configuration(s, car),
        after = preview?.after || before,
        spec = preview?.appearance || M.spec(s, car);
      const row = ([key, label, unit, up]) => {
        const delta = after[key] - before[key],
          changed = Math.abs(delta) > 0.00005,
          good = up ? delta > 0 : delta < 0;
        return `<div class="wb-stat-row" data-stat="${key}"><span>${label}</span><div><b>${number(after[key], key === "weight" ? 0 : 1)} <small>${unit}</small></b>${changed ? `<em class="${good ? "gain" : "loss"}">${sign(delta)}</em>` : preview ? '<em class="unchanged">Igual</em>' : ""}</div>${changed ? `<small class="wb-stat-was">Actual: ${number(before[key], 1)} ${unit}</small>` : ""}</div>`;
      };
      const limits = G.Competition.enabled(s)
        ? [
            ["Calle", G.Competition.rules.street.maxHP],
            ["Regional", G.Competition.rules.pro.maxHP],
            ["Nacional", G.Competition.rules.national.maxHP],
          ]
        : [["Copa Club", 210]];
      return `<aside class="wb-stats panel"><div class="wb-stats-heading"><span class="eyebrow">FICHA DINÁMICA</span><h2>${preview ? "Así quedaría" : "Así está tu coche"}</h2><p>${preview ? esc(preview.def.name) : "Configuración y estado de las piezas instaladas"}</p>${preview ? button("Volver al estado actual", "wb-clear", "text-button") : ""}</div><div class="wb-main-stats">${metrics.map(row).join("")}</div><div class="wb-structure"><span>Chasis <b>${spec.chassisTier ? "Nivel " + spec.chassisTier : "De serie"}</b></span><span>Preparación nominal <b>Hasta ${Math.round(spec.powerLimit)} CV</b></span><span>Espacio en aletas <b>Hasta ${spec.maxRim}″</b></span><span>Llantas <b>${spec.rim}″</b></span></div><details class="wb-stat-details"><summary>Temperatura, desgaste y transmisión</summary>${details.map(row).join("")}</details><div class="wb-homologation"><b>Límites de potencia por competición</b><p>${limits
        .map(
          ([label, limit]) =>
            `<span class="${after.hp <= limit ? "legal" : "illegal"}">${after.hp <= limit ? "✓" : "!"} ${label}: ${limit} CV</span>`,
        )
        .join(
          "",
        )}</p><small>La inscripción también comprueba licencia, piloto y estado mecánico.</small></div><p class="wb-fine-print">Las cifras comparan la configuración. En carrera también influyen desgaste, piloto, temperatura, neumáticos y clima.</p></aside>`;
    },
    selected(s, car, preview) {
      const A = G.App,
        group = A.wbGroup || "bodywork",
        slot = groups[group].slots.includes(A.wbSlot)
          ? A.wbSlot
          : groups[group].slots[0],
        unit = s.parts.find((p) => p.id === car.installed[slot]),
        def = G.Parts.definition(unit?.definitionId);
      let removal = "";
      if (unit) {
        try {
          M.removeQuote(s, car.id, slot);
        } catch (e) {
          removal = e.message;
        }
      }
      return `<section class="wb-parts-panel panel"><div class="wb-parts-heading"><div><span class="eyebrow">${groups[group].name}</span><h2>Elige qué vas a modificar</h2></div><label class="wb-slot-picker"><span>Componente</span><select id="wb-slot">${groups[group].slots.map((id) => `<option value="${id}" ${slot === id ? "selected" : ""}>${G.Parts.slots[id]}</option>`).join("")}</select></label></div><div class="wb-installed-card ${unit ? "modified" : ""}"><div class="wb-installed-icon">${G.Art.part(def || { slot, name: G.Parts.slots[slot] })}</div><div><span class="eyebrow">${unit ? "PIEZA INSTALADA" : "EQUIPO ORIGINAL"}</span><h3>${def ? esc(def.name) : "De serie · " + G.Parts.slots[slot]}</h3><p>${unit ? `${unit.id} · ${Math.round(unit.condition)} % de estado` : "Se conserva el conjunto original de " + esc(car.brand + " " + car.model) + "."}</p>${unit && removal ? `<small>${esc(removal)}</small>` : ""}</div>${unit ? button("Desmontar y recuperar", "wb-remove", "secondary", `data-slot="${slot}" ${removal ? "disabled" : ""}`) : ""}</div><div class="wb-part-sources" aria-label="Origen de las piezas">${[
        ["catalog", "Comprar al proveedor"],
        ["inventory", "Mi almacén"],
      ]
        .map(([id, label]) =>
          button(
            label,
            "wb-source",
            (A.wbSource || "catalog") === id ? "primary" : "secondary",
            `data-source="${id}"`,
          ),
        )
        .join(
          "",
        )}<small>Puedes comparar antes de gastar. Un cambio devuelve la pieza anterior al almacén.</small></div><div class="wb-part-grid">${this.cards(s, car, slot, A.wbSource || "catalog")}</div>${preview ? this.preview(s, car, preview) : '<div class="wb-hint">Pulsa «Comparar en el coche» para ver el resultado en la imagen y en las estadísticas. También puedes arrastrar la pieza a su zona para revisar el montaje.</div>'}<button class="text-button" data-action="wb-show-all">Explorar catálogo completo →</button></section>`;
    },
    cards(s, car, slot, source, all = false) {
      let rows = [];
      if (source === "inventory")
        rows = W.inventory(s)
          .filter(
            (p) => all || G.Parts.definition(p.definitionId).slot === slot,
          )
          .map((p) => ({ p, d: G.Parts.definition(p.definitionId), count: 1 }));
      else
        rows = G.Parts.catalogue
          .filter((d) => all || d.slot === slot)
          .map((d) => ({
            p: W.stock(s, d.id)[0],
            d,
            count: W.stock(s, d.id).length,
          }));
      if (!rows.length)
        return `<div class="wb-empty"><b>${source === "inventory" ? "No tienes piezas libres de este componente." : "No hay referencias disponibles."}</b><p>${source === "inventory" ? "Consulta el proveedor o recupera una pieza instalada." : "Las existencias son compartidas con las demás compañías."}</p></div>`;
      return rows
        .map(({ p, d, count }) => {
          const reason = p ? W.fit(s, car, p) : "Sin existencias.",
            owned = p?.companyId === s.playerId,
            selected = !!p && G.App.wbPreview === p.id,
            price = p ? Math.round((d.price * p.condition) / 100) : d.price,
            body = d.slot === "shell",
            visual =
              body && p
                ? M.visual(s, car, { ...car.installed, shell: p.id })
                : null;
          return `<article class="wb-part-card ${selected ? "selected" : ""}" data-wb-slot="${d.slot}" data-wb-search="${esc((d.name + " " + d.description + " " + G.Parts.slots[d.slot]).toLowerCase())}" ${p && !p.reservedFor ? `draggable="true" data-wb-unit="${p.id}"` : ""}><div class="wb-part-art ${body ? "bodywork" : ""}">${visual ? Art.side(visual, { key: "part-" + p.id }) : G.Art.part(d)}<span>${owned ? "EN TU ALMACÉN" : count + " EN STOCK"}</span></div><div class="wb-part-copy"><span class="eyebrow">${G.Parts.slots[d.slot]}</span><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><div class="wb-fit-note ${reason ? "blocked" : "fits"}">${p?.reservedFor ? "Reservada para un montaje" : reason ? esc(reason) : "Compatible con esta configuración"}</div><div class="wb-part-price"><b>${owned ? "Ya comprada" : money(price)}</b><span>${p ? Math.round(p.condition) + " % de estado" : ""}</span></div><small>Montaje ${money(d.labor)} · ${G.Staff.plan(s, s.playerId, "install", d.days).days} días</small>${button("Comparar en el coche", "wb-preview", "secondary wide", `data-id="${p?.id || ""}" ${!p || p.reservedFor ? "disabled" : ""}`)}</div></article>`;
        })
        .join("");
    },
    preview(s, car, q) {
      const p = q.unit;
      let installReason = "";
      try {
        M.quote(s, car.id, p.id);
      } catch (e) {
        installReason = e.message;
      }
      return `<section class="wb-preview" aria-live="polite"><div><span class="eyebrow">COMPARACIÓN · AÚN SIN MONTAR</span><h3>${esc(q.def.name)}</h3><p>${esc(q.def.description)}</p><p>${q.old ? "Sustituye " + esc(G.Parts.definition(q.old.definitionId).name) + ". La unidad retirada se recupera." : "Este alojamiento conserva su equipo original al desmontar."}</p>${q.reason ? `<div class="wb-fit-note blocked">${esc(q.reason)}</div>` : ""}<p><b>${p.companyId === null ? `Pieza ${money(Math.round((q.def.price * p.condition) / 100))} + ` : ""}montaje ${money(q.def.labor)}</b> · ${G.Staff.plan(s, s.playerId, "install", q.def.days).days} días</p>${installReason && !q.reason ? `<p class="wb-fit-note blocked">${esc(installReason)}</p>` : ""}</div><div class="wb-preview-actions">${button(p.companyId === null ? "Comprar y montar" : "Montar esta pieza", "wb-fit", "primary", `data-id="${p.id}" ${installReason ? "disabled" : ""}`)}${p.companyId === null ? button("Solo comprar para almacén", "wb-buy", "secondary", `data-id="${p.id}" ${p.reservedFor || G.player(s).balance < Math.round((q.def.price * p.condition) / 100) || W.occupied(s) >= G.player(s).sparesCapacity ? "disabled" : ""}`) : button("Vender repuesto", "wb-sell", "text-button", `data-id="${p.id}" ${p.reservedFor ? "disabled" : ""}`)}${button("Descartar vista previa", "wb-clear", "text-button")}</div></section>`;
    },
    catalogue(s, car, inventory = false) {
      return `<section class="wb-parts-panel panel"><div class="wb-parts-heading"><div><span class="eyebrow">${inventory ? "UNIDADES QUE YA COMPRASTE" : "PIEZAS FÍSICAS · STOCK COMPARTIDO"}</span><h2>${inventory ? "Tu almacén de repuestos" : "Catálogo de preparación"}</h2><p>Selecciona una referencia para verla en el coche. La compatibilidad se comprueba sobre la configuración completa.</p></div><div class="wb-catalog-filters"><label><span>Componente</span><select id="wb-catalog-slot"><option value="all">Todos los componentes</option>${Object.entries(
        G.Parts.slots,
      )
        .map(
          ([key, label]) =>
            `<option value="${key}" ${G.App.wbCatalogSlot === key ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label><label><span>Buscar</span><input id="wb-search" type="search" value="${esc(G.App.wbSearch || "")}" placeholder="Nombre o característica"></label></div></div><p class="wb-count" id="wb-part-count"></p><div class="wb-part-grid wb-catalog-grid">${this.cards(s, car, null, inventory ? "inventory" : "catalog", true)}</div><div id="wb-filter-empty" class="wb-empty" hidden>No hay piezas con esos filtros.</div></section>`;
    },
    service(s, car) {
      return `<section class="panel padded wb-service"><div class="section-title"><div><span class="eyebrow">CONSERVACIÓN DEL COCHE</span><h2>Estado y mantenimiento</h2></div>${U.badge("ESTADO " + Math.round(car.condition) + " %", "outline")}</div><div class="component-list">${Object.entries(
        G.Parts.components,
      )
        .map(
          ([key, label]) =>
            `<div class="component-line"><div>${U.bar(label, car.components[key])}</div>${button("Reparar · " + money(W.repairQuote(car, key, s)), "repair-component", "secondary", `data-id="${car.id}" data-component="${key}" ${car.components[key] >= 99 ? "disabled" : ""}`)}</div>`,
        )
        .join(
          "",
        )}</div><p class="fine-print">Reparar restaura el sistema base; el desgaste de las mejoras instaladas se conserva. El diagnóstico profesional necesita un mecánico.</p>${G.ProfessionalReviewPanel ? G.ProfessionalReviewPanel(s, car) : ""}</section>`;
    },
    filter() {
      const root = document.querySelector(".wb-root");
      if (!root) return;
      const A = G.App,
        query = (A.wbSearch || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim(),
        slot = A.wbCatalogSlot || "all";
      let shown = 0,
        total = 0;
      root.querySelectorAll(".wb-catalog-grid .wb-part-card").forEach((e) => {
        total++;
        const text = e.dataset.wbSearch
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
          match =
            (slot === "all" || e.dataset.wbSlot === slot) &&
            (!query || text.includes(query));
        e.hidden = !match;
        if (match) shown++;
      });
      const count = document.getElementById("wb-part-count");
      if (count)
        count.textContent = `${shown} de ${total} referencias · Las piezas no se instalan hasta completar el trabajo.`;
      const empty = document.getElementById("wb-filter-empty");
      if (empty) empty.hidden = shown > 0;
    },
  });
  const legacy = U.workshop;
  U.workshop = function (s) {
    if (!M.enabled(s))
      return (
        legacy.call(this, s) +
        `<section class="panel padded spaced"><h2>Prepara el coche desde su carrocería.</h2><p>Abre el taller visual para elegir piezas sobre una vista lateral o superior y comparar los cambios antes de montarlos.</p>${button("Abrir taller visual", "wb-enable", "primary", s.race ? "disabled" : "")}</section>`
      );
    const A = G.App,
      car = B.current(s),
      cars = G.ownedCars(s),
      tab = A.wbTab || "build";
    if (!car)
      return (
        this.heading(
          "TALLER",
          "Elige tu próximo proyecto.",
          "Necesitas un coche propio para preparar su mecánica y su carrocería.",
        ) +
        `<section class="panel padded"><button class="primary" data-go="market">Ir al mercado de coches</button></section>`
      );
    let preview = null;
    const selected = s.parts.find(
      (p) =>
        p.id === A.wbPreview &&
        [null, s.playerId].includes(p.companyId) &&
        !p.carId,
    );
    if (selected) preview = M.inspect(s, car, selected);
    const jobs = cars.filter((c) => c.repair);
    return `<div class="wb-root">${this.heading("TALLER DE PREPARACIÓN", "Tu coche. Pieza a pieza.", "Elige una zona, compara y programa el montaje. La carrocería se adapta al modelo; los refuerzos permiten preparar la mecánica.", '<button class="secondary" data-go="garage">Volver al garaje</button>')}<div class="wb-garage-bar"><label><span>COCHE EN EL TALLER</span><select id="wb-car">${cars.map((c) => `<option value="${c.id}" ${c === car ? "selected" : ""}>${esc(c.brand + " " + c.model)} · ${c.id}</option>`).join("")}</select></label><div><span>Almacén <b>${W.occupied(s)} / ${G.player(s).sparesCapacity}</b></span><span>Bahías <b>${G.Facilities.bays(s) - G.Facilities.workload(s)} / ${G.Facilities.bays(s)}</b></span></div></div><nav class="wb-tabs" aria-label="Secciones del taller visual">${[
      ["build", "Modificar coche"],
      ["catalog", "Catálogo"],
      ["inventory", "Mi almacén"],
      ["service", "Mantenimiento"],
    ]
      .map(([id, label]) =>
        button(
          label,
          "wb-tab",
          tab === id ? "primary" : "secondary",
          `data-tab="${id}" aria-pressed="${tab === id}"`,
        ),
      )
      .join(
        "",
      )}</nav><div class="wb-layout"><div class="wb-main">${B.stage(s, car, preview)}${tab === "build" ? B.selected(s, car, preview) : tab === "service" ? B.service(s, car) : B.catalogue(s, car, tab === "inventory")}${tab !== "build" && preview ? B.preview(s, car, preview) : ""}<section class="wb-workload"><div><span class="eyebrow">PLAN DE TALLER</span><h3>${jobs.length || s.job ? "Trabajos programados" : "Puedes preparar tu próximo montaje"}</h3>${jobs.map((c) => `<p>${esc(c.brand + " " + c.model)} · entrega ${U.date(c.repair.end)} · ${money(c.repair.cost)} pagados</p>`).join("")}${s.job ? `<p>Encargo de cliente · entrega ${U.date(s.job.end)}</p>` : ""}<p>Los trabajos comparten bahías y especialistas. El montaje puede sustituir una pieza y recuperar la anterior; no necesitas desecharla.</p></div><button class="secondary" data-go="facilities">Ampliar taller →</button></section></div>${B.stats(s, car, preview)}</div></div>`;
  };
  const apply = U.applyWorkshopFilter;
  U.applyWorkshopFilter = function (s) {
    if (document.querySelector(".wb-root")) return B.filter();
    return apply.call(this, s);
  };
  document.addEventListener("change", (event) => {
    const A = G.App,
      id = event.target.id;
    if (id === "wb-slot") {
      B.select(A, A.wbGroup || "bodywork", event.target.value);
    }
    if (id === "wb-car") {
      A.selectedCarId = event.target.value;
      A.wbPreview = null;
      B.refresh(A);
    }
    if (id === "wb-catalog-slot") {
      A.wbCatalogSlot = event.target.value;
      B.filter();
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.id === "wb-search") {
      G.App.wbSearch = event.target.value;
      B.filter();
    }
  });
  document.addEventListener("dragstart", (event) => {
    const el = event.target.closest("[data-wb-unit]");
    if (!el) return;
    event.dataTransfer.setData("text/rcs-part", el.dataset.wbUnit);
    event.dataTransfer.effectAllowed = "copy";
    document.querySelector(".wb-scene")?.classList.add("wb-dragging");
  });
  document.addEventListener("dragend", () =>
    document.querySelector(".wb-scene")?.classList.remove("wb-dragging"),
  );
  document.addEventListener("dragover", (event) => {
    if (event.target.closest("[data-drop-group]")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  });
  document.addEventListener("drop", (event) => {
    const target = event.target.closest("[data-drop-group]");
    if (!target) return;
    event.preventDefault();
    document.querySelector(".wb-scene")?.classList.remove("wb-dragging");
    try {
      const A = G.App,
        id = event.dataTransfer.getData("text/rcs-part"),
        unit = A.state.parts.find((p) => p.id === id),
        d = G.Parts.definition(unit?.definitionId);
      G.assert(
        d && groups[target.dataset.dropGroup].slots.includes(d.slot),
        "Esta pieza va en otra zona del coche. Selecciona su componente para montarla.",
      );
      A.wbGroup = target.dataset.dropGroup;
      A.wbSlot = d.slot;
      A.wbPreview = unit.id;
      B.refresh(A);
      B.review(A, unit.id);
    } catch (error) {
      U.toast(error.message, true);
    }
  });
})();
