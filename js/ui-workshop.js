"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    W = G.Workshop;
  const labels = {
    hp: "Potencia (CV)",
    weight: "Masa (kg)",
    grip: "Agarre",
    brakes: "Frenada",
    top: "Velocidad punta (km/h)",
    reliability: "Fiabilidad",
    stress: "Carga térmica",
    cooling: "Refrigeración",
    acceleration: "Transmisión de par",
    tireWear: "Desgaste de gomas",
    bodyWear: "Exposición de carrocería",
  };
  const effects = (d) =>
    Object.entries(d.effects)
      .map(
        ([k, v]) =>
          `${labels[k]} ${v > 0 ? "+" : ""}${Math.round(v * 100) / 100}`,
      )
      .join(" · ");
  const pending = (s, car) =>
    car.repair
      ? `${car.repair.type === "install" ? "Instalación" : car.repair.type === "remove" ? "Desmontaje" : "Reparación"} · listo ${U.date(car.repair.end, true)}`
      : "Disponible";
  U.workshop = function (s) {
    const cars = G.ownedCars(s),
      car = cars.find((c) => c.id === G.App.selectedCarId) || cars[0],
      company = G.player(s),
      inventory = W.inventory(s),
      busy = cars.find((c) => c.repair),
      job = s.job;
    const head = this.heading(
      "TALLER · BAHÍA 01",
      "El rendimiento se construye.",
      "Piezas compatibles. Trabajo real. Cada modificación tiene sus consecuencias.",
      `<button class="secondary" data-go="garage">Volver al garaje →</button>`,
    );
    if (!car)
      return (
        head +
        '<section class="panel empty-state"><h2>Necesitas una máquina para empezar.</h2><p>Consulta el Mercado Club y compra un vehículo antes de preparar su configuración.</p><button class="primary" data-go="market">Consultar vehículos →</button></section>' +
        this.workshopInventory(s, null)
      );
    const current = W.configuration(s, car),
      tabs = [
        ["diagnosis", "Diagnóstico"],
        ["installed", "Piezas instaladas"],
        ["inventory", "Mi almacén"],
        ["catalog", "Catálogo"],
      ],
      tabNav = `<nav class="workshop-section-nav" aria-label="Secciones del taller">${tabs.map(([id, label]) => `<button class="${G.App.workshopTab === id ? "active" : ""}" data-action="workshop-tab" data-value="${id}" aria-pressed="${G.App.workshopTab === id}">${label}${id === "inventory" ? `<span>${inventory.length}</span>` : ""}</button>`).join("")}</nav>`,
      catalogueTools = `<div class="parts-toolbar"><label class="parts-search"><span class="eyebrow">BUSCAR UN REPUESTO</span><input type="search" id="workshop-search" placeholder="Nombre, modelo o componente" value="${this.escape(G.App.workshopSearch || "")}" autocomplete="off"></label><div class="parts-filter-buttons" aria-label="Filtrar catálogo">${[["all", "Todas"], ["compatible", "Compatibles"], ...Object.entries(G.Parts.components)].map(([key, label]) => `<button class="${G.App.workshopFilter === key ? "selected" : ""}" data-action="workshop-filter" data-value="${key}" aria-pressed="${G.App.workshopFilter === key}">${label}</button>`).join("")}</div></div><p class="parts-count" id="workshop-catalogue-count" aria-live="polite"></p>`;
    return (
      head +
      `<div class="fleet-nav"><div>${cars.map((c) => this.button(`${c.brand} ${c.model} · ${c.id}`, "workshop-car", c === car ? "primary" : "secondary", `data-id="${c.id}"`)).join("")}</div>${this.badge("ALMACÉN " + W.occupied(s) + " / " + company.sparesCapacity, "outline")}</div>${tabNav}<div data-workshop-panel="diagnosis"><div class="workshop-layout"><section class="panel workshop-car"><div class="panel-heading"><span class="eyebrow">${car.id} · ${car.brand.toUpperCase()} ${car.generation}</span>${this.badge(car.repair ? "EN TRABAJO" : "COPA CLUB", car.repair ? "outline" : "green")}</div><div class="workshop-art">${G.Render.carSVG(car)}<div class="blueprint-callout top">MOTOR<br><b>${car.hp.toFixed(1)} CV</b></div><div class="blueprint-callout bottom">CHASIS<br><b>${car.weight.toFixed(0)} kg</b></div></div><div class="padded"><h2>${car.brand} ${car.model}</h2><p>${Object.keys(car.installed).length} modificaciones · ${pending(s, car)}</p><div class="workshop-meta"><span>Refrigeración <b>×${current.cooling.toFixed(2)}</b></span><span>Desgaste gomas <b>×${current.tireWear.toFixed(2)}</b></span><span>Carga térmica <b>+${current.stress.toFixed(2)}</b></span></div></div></section><section class="panel padded"><div class="section-title"><h2>Diagnóstico por componentes</h2><span class="eyebrow">ESTADO REAL</span></div><div class="component-list">${Object.entries(
        G.Parts.components,
      )
        .map(
          ([key, label]) =>
            `<div class="component-line"><div>${this.bar(label, car.components[key], car.components[key] < 40 ? "#df8d70" : "")}</div>${this.button("Reparar · " + this.money(W.repairQuote(car, key, s)), "repair-component", "secondary", `data-id="${car.id}" data-component="${key}" ${car.components[key] >= 99 ? "disabled" : ""}`)}</div>`,
        )
        .join(
          "",
        )}</div><p class="fine-print">La revisión restaura los sistemas base, no rejuvenece las piezas de mejora. El desgaste de estas se conserva al desmontar. Motor, transmisión, frenos y refrigeración deben superar el 30 % para competir.</p></section></div><section class="panel workshop-bay"><div><span class="eyebrow gold">ÚNICA BAHÍA DE TRABAJO</span><h3>${busy ? `${busy.brand} ${busy.model} · ${pending(s, busy)}` : job ? "Encargo de cliente · entrega " + this.date(job.end, true) : "Taller libre"}</h3><p>${busy ? `Coste abonado: ${this.money(busy.repair.cost)}. El coche permanece fuera de servicio hasta finalizar.` : job ? "Los encargos y las revisiones comparten personal y espacio." : "Los cambios se aplican al completar el plazo. El calendario procesa cada jornada."}</p></div>${this.badge(busy || job ? "OCUPADO" : "1 / 1 DISPONIBLE", busy || job ? "outline" : "green")}</section></div><section class="panel padded" data-workshop-panel="installed"><div class="section-title"><h2>Configuración instalada</h2><span class="eyebrow">${Object.keys(car.installed).length} PIEZAS DE MEJORA</span></div><div class="installed-grid">${Object.entries(
        G.Parts.slots,
      )
        .map(([slot, label]) => {
          const p = s.parts.find((p) => p.id === car.installed[slot]),
            d = G.Parts.definition(p?.definitionId);
          return `<div class="installed-slot ${p ? "modified" : ""}"><span class="eyebrow">${label}</span><h3>${d ? d.name : "Equipo original"}</h3>${p ? `<p>${p.id} · ${Math.round(p.condition)} % de estado</p><small>${effects(d)}</small><button class="text-button" data-action="remove-part" data-id="${car.id}" data-slot="${slot}">Desmontar y recuperar ↗</button>` : "<p>Configuración de serie conservada.</p>"}</div>`;
        })
        .join("")}</div></section>` +
      this.workshopInventory(s, car) +
      `<section data-workshop-panel="catalog"><div class="section-title"><div><span class="eyebrow">COMPRA · COMPARA · PROGRAMA EL MONTAJE</span><h2>Proveedor de repuestos</h2></div><span class="eyebrow">STOCK COMPARTIDO</span></div><p class="catalogue-help">Comprar guarda la pieza en tu almacén. Desde allí podrás programar el montaje y consultar su plazo.</p>${catalogueTools}<div class="parts-grid">${G.Parts.catalogue
        .map((d) => {
          const stock = W.stock(s, d.id),
            unit = stock[0],
            reason = unit ? W.fit(s, car, unit) : "Sin existencias.",
            compatible = !reason;
          return `<article class="panel part-card" data-part-component="${d.component}" data-part-compatible="${compatible}" data-part-search="${this.escape([d.name, d.description, G.Parts.components[d.component], ...(d.models || []).map((i) => G.Data.models[i].generation)].join(" ").toLowerCase())}"><div class="part-diagram ${d.component}"><span>${G.Parts.slots[d.slot]}</span><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M18 48L30 20H85L102 45L89 55H28Z M38 20V53 M80 20V53 M24 35H96 M50 26H70V47H50Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="52" r="7" fill="#1b292d" stroke="currentColor"/><circle cx="98" cy="52" r="7" fill="#1b292d" stroke="currentColor"/></svg><b>${String(stock.length).padStart(2, "0")} <small>UNIDADES</small></b></div><div class="padded"><span class="eyebrow">${d.models ? d.models.map((i) => G.Data.models[i].generation).join(" / ") : "MULTIMODELO"}</span><h3>${d.name}</h3><p>${d.description}</p><div class="part-effects">${effects(d)}</div><div class="fit-note ${compatible ? "positive" : "muted"}">${compatible ? "Compatible con esta configuración" : this.escape(reason)}</div><div class="market-price"><b>${this.money(unit ? Math.round((d.price * unit.condition) / 100) : d.price)}</b>${this.button("Ver pieza y montaje", "part-preview", "secondary", `data-id="${unit?.id || ""}" data-car="${car.id}" ${unit ? "" : "disabled"}`)}</div><small class="muted">Mano de obra ${this.money(d.labor)} · ${d.days} ${d.days === 1 ? "día" : "días"} · Compra separada de instalación</small></div></article>`;
        })
        .join(
          "",
        )}</div><div class="panel workshop-filter-empty" id="workshop-filter-empty" hidden><h3>No hay piezas con estos filtros.</h3><p>Prueba otro nombre o selecciona «Todas» para revisar el catálogo completo.</p></div></section>`
    );
  };
  U.applyWorkshopFilter = function () {
    const A = G.App,
      tab = A.workshopTab || "diagnosis",
      filter = A.workshopFilter || "all";
    const normalize = (value) =>
      String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const query = normalize(A.workshopSearch || "").trim();
    document.querySelectorAll("[data-workshop-panel]").forEach((el) => {
      el.hidden = el.dataset.workshopPanel !== tab;
    });
    document.querySelectorAll('[data-action="workshop-tab"]').forEach((el) => {
      const selected = el.dataset.value === tab;
      el.classList.toggle("active", selected);
      el.setAttribute("aria-pressed", selected);
    });
    document
      .querySelectorAll('[data-action="workshop-filter"]')
      .forEach((el) => {
        const selected = el.dataset.value === filter;
        el.classList.toggle("selected", selected);
        el.setAttribute("aria-pressed", selected);
      });
    let count = 0,
      total = 0;
    document
      .querySelectorAll(".part-card[data-part-component]")
      .forEach((el) => {
        total++;
        const matches =
          (filter === "all" ||
            (filter === "compatible" && el.dataset.partCompatible === "true") ||
            filter === el.dataset.partComponent) &&
          (!query || normalize(el.dataset.partSearch).includes(query));
        el.hidden = !matches;
        if (matches) count++;
      });
    const empty = document.getElementById("workshop-filter-empty"),
      counter = document.getElementById("workshop-catalogue-count");
    if (empty) empty.hidden = count > 0;
    if (counter)
      counter.textContent = `${count} de ${total} referencias · Las existencias son compartidas con los rivales`;
  };
  U.workshopInventory = function (s, car) {
    const inventory = W.inventory(s),
      used = W.occupied(s),
      company = G.player(s);
    return `<section class="panel padded" ${car ? 'data-workshop-panel="inventory"' : ""}><div class="section-title"><h2>Tu almacén de repuestos</h2>${this.badge(used + " / " + company.sparesCapacity + " PLAZAS", "outline")}</div>${
      inventory.length
        ? `<div class="spare-inventory">${inventory
            .map((p) => {
              const d = G.Parts.definition(p.definitionId),
                reason = car ? W.fit(s, car, p) : "Necesitas un coche.";
              return `<div class="spare-row"><div><span class="eyebrow">${p.id} · ${G.Parts.slots[d.slot]}</span><h3>${d.name}</h3><p>Estado: ${Math.round(p.condition)} %${p.reservedFor ? " · RESERVADA PARA INSTALACIÓN" : ""}</p><small>${p.reservedFor ? "La pieza saldrá del almacén al finalizar el trabajo." : this.escape(reason || "Compatible con el coche seleccionado.")}</small></div><div>${this.button("Comparar", "part-preview", "secondary", `data-id="${p.id}" data-car="${car?.id || ""}"`)}${this.button("Instalar", "install-part", "primary", `data-id="${p.id}" data-car="${car?.id || ""}" ${reason || p.reservedFor ? "disabled" : ""}`)}${this.button("Vender repuesto", "sell-part", "text-button", `data-id="${p.id}" ${p.reservedFor ? "disabled" : ""}`)}</div></div>`;
            })
            .join("")}</div>`
        : '<p class="muted">El almacén está vacío. Compra una pieza compatible al proveedor para comenzar. Las unidades instaladas aparecen en el coche; nunca se duplican en el almacén.</p>'
    }<p class="fine-print">Las piezas reservadas ocupan su plaza hasta el montaje. Un desmontaje también reserva espacio para la pieza que recuperará. El proveedor recompra unidades libres al 60 % de su precio, ajustado por desgaste y sujeto a su liquidez.</p></section>`;
  };
  const garage = U.garage;
  U.garage = function (s) {
    return (
      `<div class="garage-workshop-link"><span class="eyebrow">INGENIERÍA Y MANTENIMIENTO</span><button class="primary" data-go="workshop">Abrir taller de modificaciones ↗</button></div>` +
      garage.call(this, s)
    );
  };
  const live = U.updateRace;
  U.updateRace = function (s) {
    live.call(this, s);
    const a = s.race?.entrants.find((a) => a.companyId === s.playerId);
    if (a?.components) {
      const el = document.querySelector(".telemetry-bars");
      if (el)
        el.insertAdjacentHTML(
          "beforeend",
          `<div class="race-mechanics"><span>Motor <b>${Math.round(a.components.engine)} %</b></span><span>Frenos <b>${Math.round(a.components.brakes)} %</b></span><span>Refrigerante <b class="${a.thermal > 105 ? "negative" : ""}">${a.thermal.toFixed(0)} °C</b></span></div>`,
        );
    }
  };
  G.WorkshopUI = {
    action(A, name, data) {
      const s = A.state;
      switch (name) {
        case "workshop-car":
          A.selectedCarId = data.id;
          A.go("workshop");
          return true;
        case "part-preview":
          this.preview(A, data.id, data.car);
          return true;
        case "buy-part": {
          const p = s.parts.find((p) => p.id === data.id);
          G.assert(p, "Pieza desconocida.");
          const d = G.Parts.definition(p.definitionId);
          A.confirm(
            "Comprar repuesto",
            `${d.name} (${p.id}) cuesta ${U.money(Math.round((d.price * p.condition) / 100))}. Pasará a tu almacén; la instalación se abona por separado.`,
            () => {
              A.workshopTab = "inventory";
              A.mutate(() => W.buy(s, p.id), "workshop");
              U.toast("La pieza ya está en tu almacén.");
            },
          );
          return true;
        }
        case "install-part": {
          const p = s.parts.find((p) => p.id === data.id);
          G.assert(p, "Pieza desconocida.");
          const d = G.Parts.definition(p.definitionId);
          A.confirm(
            "Programar instalación",
            `${d.name}: ${U.money(d.labor)} de mano de obra y ${d.days} días de taller. Las prestaciones cambiarán al terminar y la pieza anterior se recuperará.`,
            () => {
              A.workshopTab = "diagnosis";
              A.mutate(() => W.install(s, data.car, p.id), "workshop");
              U.toast("Pieza reservada. Trabajo de instalación iniciado.");
            },
          );
          return true;
        }
        case "remove-part":
          A.confirm(
            "Desmontar modificación",
            "El coche usará su equipamiento original en este alojamiento. La pieza volverá al almacén con su desgaste; el trabajo dura un día y cuesta el 60 % de la instalación.",
            () => {
              A.workshopTab = "diagnosis";
              A.mutate(() => W.remove(s, data.id, data.slot), "workshop");
              U.toast("Desmontaje programado.");
            },
          );
          return true;
        case "sell-part": {
          const p = s.parts.find((p) => p.id === data.id);
          G.assert(p, "Pieza desconocida.");
          const value = Math.round(
            (G.Parts.definition(p.definitionId).price * 0.6 * p.condition) /
              100,
          );
          A.confirm(
            "Vender repuesto",
            `Recibirás ${U.money(value)}. La unidad volverá al stock del proveedor con su desgaste.`,
            () => {
              A.mutate(() => W.sell(s, p.id), "workshop");
              U.toast("Repuesto vendido.");
            },
          );
          return true;
        }
        case "repair-component": {
          const car = s.cars.find((c) => c.id === data.id);
          G.assert(car, "Vehículo desconocido.");
          A.confirm(
            "Reparación por componente",
            `${G.Parts.components[data.component]}: ${U.money(W.repairQuote(car, data.component, s))}. Solo se restaurará ese sistema base, conservando el resto del desgaste y la condición de las mejoras.`,
            () => {
              A.workshopTab = "diagnosis";
              A.mutate(() => W.repair(s, car.id, data.component), "workshop");
            },
          );
          return true;
        }
        default:
          return false;
      }
    },
    preview(A, id, carId) {
      const s = A.state,
        p = s.parts.find((p) => p.id === id),
        car = s.cars.find((c) => c.id === carId && c.companyId === s.playerId);
      G.assert(p, "La pieza ya no está disponible.");
      const d = G.Parts.definition(p.definitionId),
        before = car ? W.configuration(s, car) : null,
        after = car
          ? W.configuration(s, car, { ...car.installed, [d.slot]: p.id })
          : null,
        reason = car
          ? W.fit(s, car, p)
          : "Selecciona un vehículo en el taller.";
      U.modal(
        d.name,
        `<p class="eyebrow gold">${p.id} · ${G.Parts.slots[d.slot]} · ESTADO ${Math.round(p.condition)} %</p><p>${d.description}</p><div class="onboarding-note"><strong>${reason ? U.escape(reason) : "Compatible con el coche seleccionado"}</strong>${d.requires ? "Requisitos: " + d.requires.map((id) => G.Parts.definition(id).name).join(" y ") : "No requiere otras piezas."}<br>Mano de obra: ${U.money(d.labor)} · ${d.days} días</div>${
          car
            ? `<table class="part-comparison"><thead><tr><th>ATRIBUTO</th><th>ACTUAL</th><th>TRAS MONTAR</th><th>CAMBIO</th></tr></thead><tbody>${W.attributes
                .concat(["cooling", "stress", "acceleration", "tireWear"])
                .map(
                  (k) =>
                    `<tr><td>${labels[k]}</td><td>${before[k].toFixed(k === "weight" ? 0 : 2)}</td><td>${after[k].toFixed(k === "weight" ? 0 : 2)}</td><td class="${after[k] !== before[k] ? "gold" : "muted"}">${after[k] - before[k] > 0 ? "+" : ""}${(after[k] - before[k]).toFixed(2)}</td></tr>`,
                )
                .join("")}</tbody></table>`
            : ""
        }<p class="fine-print">Proyección para esta unidad y su desgaste actual. Más potencia no compensa siempre el peso, el calor o el consumo de neumáticos. Los valores son parámetros del juego. Las prestaciones se aplican al terminar el trabajo.</p><div class="modal-actions">${p.companyId === null ? U.button("Comprar repuesto", "buy-part", "primary", `data-id="${p.id}"`) : p.companyId === s.playerId ? U.button("Programar instalación", "install-part", "primary", `data-id="${p.id}" data-car="${car?.id || ""}" ${reason || p.reservedFor ? "disabled" : ""}`) : ""}</div>`,
        true,
      );
    },
  };
})();
