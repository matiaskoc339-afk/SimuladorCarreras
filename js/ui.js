"use strict";
(() => {
  const G = RCS;
  G.UI = {
    escape: (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
    money: (v) =>
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(v),
    date: (day, short = false) =>
      G.dateAt(day).toLocaleDateString("es-ES", {
        timeZone: "UTC",
        day: "2-digit",
        month: short ? "short" : "long",
        ...(short ? {} : { year: "numeric" }),
      }),
    icon(name) {
      const paths = {
        garage: "M3 20V8L12 3L21 8V20M6 20V11H18V20M6 15H18M6 18H18",
        tool: "M14 5L19 2L22 5L19 10L15 10L7 21L3 17L14 8Z",
        team: "M8 12A4 4 0 1 0 8 4A4 4 0 1 0 8 12M2 21V18Q2 14 8 14Q14 14 14 18V21M17 5Q22 5 22 9Q22 13 17 13M18 16Q23 16 23 20",
        research: "M9 3H15M10 3V9L4 19Q3 22 7 22H17Q21 22 20 19L14 9V3M7 15H17",
        market: "M3 4H5L8 16H19L22 7H6M10 20H10.1M18 20H18.1",
        companies:
          "M3 21V7H11V21M11 21V3H21V21M6 11H8M6 15H8M14 7H18M14 11H18M14 15H18M1 21H23",
        finance: "M3 21H22M6 17V12M12 17V6M18 17V2M3 9L10 3L15 6L22 1",
        sound: "M3 9H7L13 4V20L7 15H3ZM17 8Q22 12 17 16M19 4Q28 12 19 20",
        home: "M3 10L12 3L21 10V21H14V14H10V21H3Z",
        news: "M4 3H18V21H4ZM8 7H14M8 11H14M8 15H14M8 18H12M18 7H21V19Q21 21 18 21",
        history: "M3 5V10H8M3 10A9 9 0 1 1 4 18M12 7V12L16 14",
        save: "M4 3H18L21 6V21H3V3ZM7 3V9H16V3M7 21V14H17V21",
        arrow: "M5 12H20M14 6L20 12L14 18",
        flag: "M5 22V3M5 4Q10 0 14 4T22 4V15Q18 19 14 15T5 15",
        settings:
          "M12 8A4 4 0 1 0 12 16A4 4 0 1 0 12 8M10 3H14L15 6L18 7L21 7L23 11L21 14L20 17L19 21L15 22L12 20L9 21L5 20L4 16L2 13L3 9L6 8L8 6Z",
        back: "M20 12H4M10 6L4 12L10 18",
        check: "M4 12L9 17L20 6",
      };
      return `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.arrow}"/></svg>`;
    },
    logo(s, cls = "") {
      return s.logo
        ? `<img class="company-logo ${cls}" src="${s.logo}" alt="Logotipo de la compañía">`
        : `<span class="company-logo monogram ${cls}">${this.escape(G.player(s).name.slice(0, 2).toUpperCase())}</span>`;
    },
    button(text, action, cls = "", extra = "") {
      return `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
    },
    badge(text, cls = "") {
      return `<span class="badge ${cls}">${text}</span>`;
    },
    stat(label, value, hint = "") {
      return `<div class="stat"><span class="eyebrow">${label}</span><strong>${value}</strong>${hint ? `<small>${hint}</small>` : ""}</div>`;
    },
    bar(label, value, color = "") {
      return `<div class="metric"><div><span>${label}</span><b>${Math.round(value)}<small>/100</small></b></div><span class="meter"><i style="width:${G.clamp(value, 0, 100)}%;${color ? "background:" + color : ""}"></i></span></div>`;
    },
    portrait(d) {
      return G.Art.portrait(d);
    },
    menu() {
      let slots;
      try {
        slots = G.Storage.list();
      } catch {
        slots = [];
      }
      const saves = slots.filter((x) => !x.empty);
      return `<div class="main-menu"><div class="menu-top"><a class="wordmark" aria-label="Racing Company">R<span>//</span>C <em>RACING COMPANY</em></a><span class="eyebrow">EL AUTOMOVILISMO DESDE EL OTRO LADO DEL MURO</span><span class="menu-build">GESTIÓN + COMPETICIÓN</span></div><main class="menu-content"><div class="menu-copy"><span class="kicker"><i></i> TU NOMBRE. TU EQUIPO. TU HISTORIA.</span><h1>HAZ QUE<br>TE <span>RECUERDEN.</span></h1><p>No necesitas ser el más rápido al volante.<br>Necesitas tomar la decisión correcta cuando todo está en juego.</p><button class="primary large" data-action="new">Fundar mi compañía ${this.icon("arrow")}</button><div class="menu-pillars"><div><b>01</b><span>Construye tu equipo</span></div><div><b>02</b><span>Dirige la carrera</span></div><div><b>03</b><span>Deja tu huella</span></div></div><span class="menu-note">RACING COMPANY SIMULATOR · JUEGA SIN CONEXIÓN</span></div><div class="menu-side"><div class="menu-stage"><span class="stage-label">EL PRIMER CAPÍTULO</span><div class="menu-track-lines"></div><div class="menu-car">${G.Render.carSVG({ ...G.Data.models[0], id: "menu", color: "#ed563e" })}</div><span class="stage-model">${G.Data.models.length} MODELOS <small>DEL UTILITARIO AL COCHE DE TUS SUEÑOS.</small></span><span class="stage-number">01</span></div><div class="continue-panel"><div><span class="eyebrow">VOLVER A TU HISTORIA</span><h3>${saves.length ? "El paddock te espera." : "Todo empieza con una decisión."}</h3></div>${saves.length ? saves.map((x) => `<button class="load-card" data-action="load" data-slot="${x.slot}" ${x.error ? "disabled" : ""}><span><b>${this.escape(x.name || "Guardado dañado")}</b><small>${x.error ? this.escape(x.error) : this.date(x.day, true) + " · Temporada " + x.year}</small></span>${this.icon("arrow")}</button>`).join("") : "<p>Aún no tienes una compañía. Empieza desde un pequeño garaje y escribe tu primera temporada.</p>"}<button class="text-button" data-action="saves">Partidas guardadas e importación ${this.icon("arrow")}</button></div></div></main><footer class="menu-footer"><span>RACING COMPANY SIMULATOR</span><span>UNA VIDA EN EL MOTOR. SIN CONDUCCIÓN DIRECTA.</span></footer></div>`;
    },
    shell(s, view, content) {
      const p = G.player(s),
        e = G.nextEvent(s),
        due = e && e.day <= s.day,
        isRace = view === "race";
      const nav = (id, icon, title) =>
        `<button title="${title}" aria-label="${title}" aria-current="${view === id ? "page" : "false"}" class="rail-button ${view === id ? "active" : ""}" data-go="${id}">${this.icon(icon)}<span>${title}</span>${view === id ? "<i></i>" : ""}</button>`;
      const groups = [
        [
          "TU EQUIPO",
          [
            ["hq", "home", "Sede central"],
            ["facilities", "home", "Instalaciones y progreso"],
            ["garage", "garage", "Garaje"],
            ["workshop", "tool", "Taller"],
            ["team", "team", "Pilotos"],
            ["staff", "team", "Personal"],
            ["operations", "tool", "Operaciones y salud"],
            ["practice", "flag", "Entrenamiento en pista"],
            ["research", "research", "Investigación"],
          ],
        ],
        [
          "EN EL PADDOCK",
          [
            ["competition", "flag", "Competiciones"],
            ["market", "market", "Mercado de coches"],
            ["auctions", "market", "Subastas"],
            ["companies", "companies", "Compañías rivales"],
          ],
        ],
        [
          "TU COMPAÑÍA",
          [
            ["finance", "finance", "Finanzas"],
            ["contracts", "finance", "Patrocinios y crédito"],
            ["news", "news", "Motor World Daily"],
            ["history", "history", "Archivo histórico"],
          ],
        ],
      ];
      return `<div class="game-shell ${isRace ? "is-racing" : ""}"><aside class="rail"><button class="wordmark rail-brand" data-go="hq" aria-label="Sede central">R<span>//</span>C <em>RACING<br>COMPANY</em></button><div class="rail-nav">${groups.map(([title, items]) => `<div class="nav-group"><span class="nav-group-label">${title}</span>${items.map(([id, icon, text]) => nav(id, icon, text)).join("")}</div>`).join("")}</div><div class="rail-bottom"><span class="rail-season">TEMPORADA ${s.season.year} <i></i></span><button class="rail-button" title="Guardar partida" aria-label="Guardar partida" data-action="save">${this.icon("save")}<span>Guardar partida</span></button><button class="rail-button" title="Partidas y opciones" aria-label="Partidas y opciones" data-action="saves">${this.icon("settings")}<span>Partidas y opciones</span></button></div></aside><div class="game-body"><header class="topbar"><button class="company-brand" data-go="hq">${this.logo(s)}<span><b>${this.escape(p.name)}</b><small>Nivel ${p.level} · ${G.Data.levels[p.level - 1]}</small></span></button><div class="top-metrics"><div><small>EFECTIVO DISPONIBLE</small><b class="${p.balance < 0 ? "negative" : ""}">${this.money(p.balance)}</b></div><div class="reputation"><small>REPUTACIÓN</small><b><span class="gold">✦</span> ${p.reputation.toFixed(1)} <span class="muted">/ 100</span></b></div><div class="date-block"><small>${G.dateAt(s.day).toLocaleDateString("es-ES", { weekday: "long", timeZone: "UTC" }).toUpperCase()}</small><b>${this.date(s.day, true)} ${G.dateAt(s.day).getUTCFullYear()}</b></div></div><button class="primary advance" data-action="advance" ${s.race || G.Auctions?.active(s) || s.status !== "active" ? "disabled" : ""}>${due ? "Jornada de carrera" : "Avanzar día"} ${this.icon(due ? "flag" : "arrow")}</button></header>${
        G.Contracts.marks(s, s.playerId).length
          ? `<div class="sponsor-ribbon" aria-label="Marcas de la compañía">${G.Contracts.marks(
              s,
              s.playerId,
            )
              .map(
                (p) =>
                  `<span style="--brand:${p.color}">${this.escape(p.name)}</span>`,
              )
              .join("")}</div>`
          : ""
      }${s.status === "bankrupt" ? '<div class="alert danger"><b>Tu compañía ha terminado su actividad.</b> La trayectoria queda archivada. Puedes guardar tu historia o comenzar una nueva partida.</div>' : p.balance < 0 || G.Staff.overdue(s) > 0 ? `<div class="alert danger"><span><b>Necesitas recuperar liquidez.</b> Quedan ${14 - p.debtDays} días de margen antes de la bancarrota.</span><button class="text-button" data-go="finance">Revisar finanzas →</button></div>` : due && !s.race ? `<div class="alert"><span>${this.icon("flag")} <b>Hoy es día de carrera.</b> ${G.Data.tracks[e.track].name} está esperando tu decisión.</span><button class="text-button" data-go="competition">Preparar la salida →</button></div>` : ""}<main class="page ${isRace ? "race-page" : ""}" data-current-view="${view}">${content}</main><footer class="statusbar"><span><i class="live-dot"></i> TU COMPAÑÍA SIGUE SU CAMINO</span><span id="save-status">Guardado automático · ranura ${G.App.slot || "—"}</span><span>RACING COMPANY SIMULATOR</span></footer></div></div>`;
    },
    heading(tag, title, subtitle = "", actions = "") {
      return `<div class="page-heading"><div><div class="eyebrow breadcrumb"><button data-go="hq">SEDE CENTRAL</button> <span>/</span> ${tag}</div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div><div class="heading-actions">${actions}</div></div>`;
    },
    hq(s) {
      const p = G.player(s),
        next = G.nextEvent(s),
        drivers = G.ownedDrivers(s),
        cars = G.ownedCars(s),
        car = cars[0],
        board = G.leaderboard(s),
        position = board.findIndex((x) => x.company.id === s.playerId) + 1;
      const ready = !!car && G.Workshop.ready(car),
        hired = drivers.length > 0,
        entry = !!next?.entry;
      const steps = [
        {
          done: hired,
          num: "01",
          title: "Encuentra a tu piloto",
          text: hired
            ? drivers[0].name
            : s.drivers.filter((d) => !d.companyId).length +
              " candidatos en tu mesa",
          go: "team",
        },
        {
          done: ready,
          num: "02",
          title: "Prepara tu coche",
          text: car
            ? `${car.brand} ${car.model} · ${Math.round(car.condition)} % de estado`
            : "El garaje está vacío",
          go: car ? "garage" : "market",
        },
        {
          done: entry,
          num: "03",
          title: "Confirma tu inscripción",
          text: entry
            ? "Piloto y coche listos para competir"
            : "Reserva $370 para inscripción y transporte",
          go: "competition",
        },
      ];
      const current = !hired
        ? steps[0]
        : !ready
          ? steps[1]
          : !entry
            ? steps[2]
            : {
                title: "Tu próxima carrera está en marcha",
                text: next
                  ? "Todo preparado para " +
                    this.date(next.day, true) +
                    ". Avanza el calendario cuando hayas terminado tus decisiones."
                  : "Has completado la temporada. Consulta tu clasificación final.",
                go: "competition",
              };
      return (
        this.heading(
          "RESUMEN DE EQUIPO",
          `Bienvenido al paddock<span class="accent-dot">.</span>`,
          `Este es el centro de tu compañía. Decide dónde invertir hoy para llegar mejor a la próxima carrera.`,
          this.badge("TEMPORADA " + s.season.year, "outline"),
        ) +
        `<div class="dashboard-hero"><section class="hero-company"><div class="hero-company-top"><span class="kicker"><i></i> ${this.escape(p.name.toUpperCase())}</span><span class="hero-level">EQUIPO NIVEL ${String(p.level).padStart(2, "0")}</span></div><div class="hero-company-copy"><span class="eyebrow">TU PRÓXIMA DECISIÓN</span><h2>${this.escape(current.title)}</h2><p>${this.escape(current.text)}</p><button class="primary" data-go="${current.go}">${entry ? "Ver preparación" : "Continuar preparación"} ${this.icon("arrow")}</button></div><div class="hero-company-stats"><div><strong>${String(position).padStart(2, "0")}</strong><span>Posición en la Copa</span></div><div><strong>${s.season.standings.player?.points || 0}</strong><span>Puntos esta temporada</span></div><div><strong>${p.stats.podiums}</strong><span>Podios de tu compañía</span></div></div></section><section class="next-race panel"><div class="next-race-top"><span class="eyebrow">${next ? "PRÓXIMO FIN DE SEMANA" : "TEMPORADA COMPLETADA"}</span>${this.icon("flag")}</div><h2>${next ? G.Data.tracks[next.track].name : "La bandera a cuadros."}</h2><p>${next ? G.Data.tracks[next.track].region : "La primera página de tu historia ya está escrita."}</p><div class="next-race-date"><strong>${next ? Math.max(0, next.day - s.day) : "06"}</strong><span>${next ? "días para la carrera" : "rondas completadas"}<b>${next ? this.date(next.day) : "Temporada " + s.season.year}</b></span></div><div class="next-race-details"><span>${next ? "Ronda " + next.round + " / 6" : "Copa Club"}</span><span>${next ? G.Data.tracks[next.track].laps + " vueltas · " + (G.Data.tracks[next.track].length / 1000).toFixed(2) + " km" : "Resultados registrados"}</span></div>${this.button(next ? (entry ? "Ver inscripción" : "Preparar carrera") : "Ver clasificación", "go-competition", "secondary wide")}</section></div><div class="preparation-steps" aria-label="Preparación de la próxima carrera">${steps.map((step) => `<button class="preparation-step ${step.done ? "done" : ""}" data-go="${step.go}"><span class="step-number">${step.done ? this.icon("check") : step.num}</span><span><b>${step.title}</b><small>${this.escape(step.text)}</small></span>${this.icon("arrow")}</button>`).join("")}</div><div class="section-title spaced"><div><span class="eyebrow">TU CENTRO DE OPERACIONES</span><h2>Un lugar para construirlo todo.</h2></div><span class="map-instruction">Haz clic en un departamento para entrar.</span></div><section class="map-panel panel">${G.Render.headquarters(s)}<div class="map-footer"><span><b>01</b> Sede en Sevilla</span><span><b>${drivers.length}/${p.driverCapacity}</b> Pilotos contratados</span><span><b>${cars.length}/${p.carCapacity}</b> Plazas de garaje</span><span>Garaje alquilado · herramientas básicas</span></div></section><div class="dashboard-bottom"><section class="panel padded budget-glance"><div class="section-title"><h2>Tu margen para competir</h2><button class="text-button" data-go="finance">Ver finanzas →</button></div><div class="budget-glance-numbers"><div><span>Disponible hoy</span><b>${this.money(p.balance)}</b></div><div><span>Previsión de gasto mensual</span><b>${this.money(G.Economy.monthly(s))}</b></div></div><p>Antes de invertir, conserva liquidez para salarios, mantenimiento y tu siguiente inscripción.</p></section><section class="panel padded"><div class="section-title"><h2>Desde el paddock</h2><button class="text-button" data-go="news">Leer el diario →</button></div><div class="news-grid">${s.news
          .slice(0, 2)
          .map(
            (n) =>
              `<button class="news-teaser" data-action="article" data-id="${n.id}"><div class="eyebrow">${n.category} · ${this.date(n.day, true)}</div><h3>${this.escape(n.title)}</h3><span>Leer historia ${this.icon("arrow")}</span></button>`,
          )
          .join("")}</div></section></div>`
      );
    },
    garage(s) {
      const car = G.ownedCars(s)[0];
      return (
        this.heading(
          "GARAJE",
          "Elige la máquina para tu próxima carrera.",
          "Consulta su estado, prepara el mantenimiento y entra al taller para mejorar su rendimiento.",
        ) +
        `<div class="garage-layout"><section class="panel car-showcase"><div class="panel-heading"><span class="eyebrow">GARAJE 01 / ${String(G.player(s).carCapacity).padStart(2, "0")}</span>${this.badge(car.repair ? "EN REVISIÓN" : "VEHÍCULO PROPIO", car.repair ? "" : "green")}</div><div class="car-art">${G.Render.carSVG(car)}${s.logo ? `<img class="car-livery-logo" src="${s.logo}" alt="Librea de la compañía">` : ""}<span class="car-number">01</span></div><div class="car-caption"><span class="eyebrow">${car.brand.toUpperCase()} · ${car.generation} · ${car.year}</span><h2>${car.model}</h2><p>${Math.round(car.km).toLocaleString("es-ES")} km · Usado · ${car.brand === "Honda" || car.brand === "Toyota" ? "Tracción delantera" : "Tracción trasera"}</p></div></section><div class="garage-details"><section class="panel padded"><div class="section-title"><h2>Ficha de taller</h2>${this.badge("CLASE CLUB")}</div><div class="spec-grid">${this.stat("POTENCIA", car.hp + " <span>CV</span>")}${this.stat("PESO", car.weight + " <span>kg</span>")}${this.stat("VELOCIDAD MÁX.", car.top + " <span>km/h</span>")}${this.stat("FIABILIDAD", car.reliability + " <span>/100</span>")}</div>${this.bar("Estado mecánico", car.condition, car.condition < 50 ? "#dc7869" : "")}${this.bar("Neumáticos de calle", car.tires)}<div class="service-actions">${this.button(car.repair ? "Listo el " + this.date(car.repair.end, true) : "Reparación · " + this.money(G.Economy.repairQuote(car)), "repair", "secondary", 'data-id="' + car.id + '" ' + (car.repair ? "disabled" : ""))}${this.button("Neumáticos · " + this.money(G.Workshop.tireCost(s, car)), "tires", "secondary", 'data-id="' + car.id + '" ' + (car.tires >= 99 ? "disabled" : ""))}</div><p class="fine-print">La reparación ocupa una bahía durante ${G.Staff.plan(s, s.playerId, "repair", 2).days} días. El estado y el agarre afectan a la velocidad y la fiabilidad en carrera. Cifras técnicas y valores económicos equilibrados para el juego; no son una ficha de homologación.</p></section><section class="panel padded"><div class="section-title"><h2>Pasaporte del vehículo</h2><span class="eyebrow">${car.id}</span></div><div class="passport-stats"><span>${car.starts} salidas</span><span>${car.wins} victorias</span><span>${this.money((car.value * car.condition) / 100)} valor estimado</span></div>${
          car.history.length
            ? car.history
                .slice(0, 6)
                .map(
                  (h) =>
                    `<div class="timeline-line"><small>${this.date(h.day, true)}</small><span>${this.escape(h.type)}</span></div>`,
                )
                .join("")
            : '<p class="muted">Tu primera carrera quedará registrada aquí.</p>'
        }</section></div></div>`
      );
    },
    driverCard(d, owned = false) {
      const trait = G.Data.traits[d.trait];
      return `<article class="driver-card panel"><div class="driver-identity">${this.portrait(d)}<div><span class="eyebrow">${this.escape(d.nation)} · ${d.age} AÑOS</span><h3>${this.escape(d.name)}</h3>${this.badge(trait.name, "outline")}<p>${trait.description}</p></div><div class="driver-rating">${G.Drivers.rating(d)}<small>VALORACIÓN</small></div></div><div class="driver-metrics">${["pace", "control", "consistency", "overtake"].map((k) => this.bar(G.Drivers.labels[k], d.stats[k])).join("")}</div><div class="driver-footer">${owned ? `<span><b>${this.money(d.contract.salary)}/${G.Pay.unit(d)}</b><small>Vence ${this.date(d.contract.end, true)} · Moral ${Math.round(d.morale)} % · Fatiga ${Math.round(d.fatigue)} %</small></span>` : `<span><b>${this.money(d.ask)}/${G.Pay.unit(d)}</b><small>${d.experience} temporadas · Potencial aún por descubrir</small></span>`}${this.button(owned ? "Gestionar" : "Negociar", owned ? "driver-detail" : "negotiate", owned ? "secondary" : "primary", `data-id="${d.id}"`)}</div></article>`;
    },
    team(s) {
      const hired = G.ownedDrivers(s),
        free = s.drivers.filter(
          (d) => !d.companyId && G.Professionals.available(s, d),
        );
      return (
        this.heading(
          "SALA DE PILOTOS",
          "Un buen equipo empieza por su piloto.",
          "Compara candidatos, negocia sus condiciones y cuida la moral de tu equipo.",
          this.badge(
            hired.length + " / " + G.player(s).driverCapacity + " ASIENTOS",
          ),
        ) +
        `<div class="section-title"><h2>Tu alineación</h2><span class="muted">El potencial real no se muestra en los currículums.</span></div><div class="drivers-grid">${hired.length ? hired.map((d) => this.driverCard(d, true)).join("") : '<div class="empty-state panel"><span class="empty-number">00</span><h3>El asiento está libre.</h3><p>Estudia los currículums y negocia un salario sostenible.<br>Necesitas un piloto para inscribirte en la Copa Club.</p></div>'}</div><div class="section-title spaced"><h2>Candidatos disponibles <span class="muted">${free.length.toString().padStart(2, "0")}</span></h2><span class="eyebrow">PILOTOS INTERESADOS EN TU EQUIPO</span></div><div class="drivers-grid">${free.map((d) => this.driverCard(d)).join("")}</div>`
      );
    },
    standings(s) {
      return `<table class="standings"><thead><tr><th>POS</th><th>COMPAÑÍA</th><th>SAL.</th><th>VIC.</th><th>PTS</th></tr></thead><tbody>${G.leaderboard(
        s,
      )
        .map(
          (row, i) =>
            `<tr class="${row.company.id === s.playerId ? "player-row" : ""}"><td class="position">${String(i + 1).padStart(2, "0")}</td><td><button class="table-team" data-action="company" data-id="${row.company.id}"><i style="background:${row.company.color}"></i>${row.company.id === s.playerId ? this.logo(s, "tiny") : ""}${this.escape(row.company.name)}${row.company.status === "bankrupt" ? " †" : ""}</button></td><td>${row.starts}</td><td>${row.wins}</td><td class="points">${row.points}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    },
    driverStandings(s) {
      const rows = new Map();
      for (const e of s.season.events)
        for (const r of e.results) {
          const row = rows.get(r.driverId) || {
            id: r.driverId,
            name: r.name,
            points: 0,
            starts: 0,
          };
          row.points += r.points;
          row.starts++;
          rows.set(r.driverId, row);
        }
      const sorted = [...rows.values()].sort(
        (a, b) => b.points - a.points || a.name.localeCompare(b.name),
      );
      return `<div class="panel-heading"><h2>Clasificación de pilotos</h2><span class="eyebrow">COPA CLUB</span></div>${sorted.length ? `<table class="standings"><thead><tr><th>POS</th><th>PILOTO</th><th>SAL.</th><th>PTS</th></tr></thead><tbody>${sorted.map((r, i) => `<tr class="${s.drivers.find((d) => d.id === r.id)?.companyId === s.playerId ? "player-row" : ""}"><td class="position">${i + 1}</td><td><button class="table-team" data-action="driver-detail" data-id="${r.id}">${this.escape(r.name)}</button></td><td>${r.starts}</td><td class="points">${r.points}</td></tr>`).join("")}</tbody></table>` : '<p class="fine-print padded">La primera prueba abrirá la clasificación de pilotos.</p>'}`;
    },
    competition(s) {
      const next = G.nextEvent(s);
      return (
        this.heading(
          "CENTRO DE ESTRATEGIA",
          "Tu temporada, carrera a carrera.",
          "Copa Club de Turismos · Temporada " + s.season.year,
          next
            ? this.button(
                "Hasta la próxima prueba " + this.icon("arrow"),
                "advance-race",
                "secondary",
              )
            : this.button(
                "Abrir temporada " + (s.season.year + 1),
                "next-season",
                "primary",
              ),
        ) +
        `<div class="competition-grid"><section class="panel padded schedule"><div class="section-title"><h2>Calendario deportivo</h2>${this.badge("6 RONDAS", "outline")}</div>${s.season.events
          .map((e) => {
            const t = G.Data.tracks[e.track],
              scheduled = e.status === "scheduled",
              due = scheduled && e.day <= s.day;
            return `<article class="round ${due ? "due" : ""}"><div class="round-number">${String(e.round).padStart(2, "0")}</div><div class="round-info"><small>${this.date(e.day, true).toUpperCase()} · ${t.region}</small><h3>${t.name}</h3><span>${t.laps} vueltas · ${(t.length / 1000).toFixed(2)} km ${e.entry ? "· Inscrito" : ""}</span></div><div class="round-action">${scheduled ? this.button(due ? "Jornada de carrera" : e.entry ? "Ver inscripción" : "Inscribirse", "event", due ? "primary" : "secondary", `data-id="${e.id}"`) : this.button(e.status === "skipped" ? "Renuncia · resultados" : "Ver resultados", "results", "text-button", `data-id="${e.id}"`)}</div></article>`;
          })
          .join(
            "",
          )}<div class="rule-note"><b>Reglamento Club</b><p>Máximo 210 CV · 1 coche por compañía · $250 de inscripción + $120 de transporte · Puntos: 15 / 12 / 10 / 8 / 6 / 4 / 2 / 1 · Premios: $550–$1,800 por carrera. Los abandonos reciben $250 de ayuda logística.</p></div></section><section class="panel classification"><div class="panel-heading"><h2>Clasificación de equipos</h2><span class="eyebrow">${s.season.events.filter((e) => e.status !== "scheduled").length}/6</span></div>${this.standings(s)}${this.driverStandings(s)}<p class="fine-print padded">Los resultados surgen de las prestaciones del coche, la técnica del piloto, el desgaste y las órdenes en pista. Cada rival paga sus inscripciones y nóminas.</p></section></div>`
      );
    },
    finance(s) {
      const p = G.player(s),
        salary = G.ownedDrivers(s).reduce((n, d) => n + d.contract.accrued, 0);
      const daily = Array.from({ length: 30 }, (_, i) => {
        const day = s.day - 29 + i;
        return p.ledger
          .filter((t) => t.day === day)
          .reduce((n, t) => n + t.amount, 0);
      });
      const max = Math.max(30, ...daily.map(Math.abs));
      return (
        this.heading(
          "OFICINA",
          "Mantén tu compañía en carrera.",
          G.Challenge.enabled(s)
            ? "Los sueldos, el alquiler y los suministros se pagan al avanzar cada jornada. La previsión de 30 días ayuda a reservar caja."
            : "Las nóminas se liquidan el día 1. El alquiler y los suministros se pagan diariamente.",
          this.button("Editar identidad", "identity", "secondary"),
        ) +
        `<div class="overview-strip finance-stats">${this.stat("EFECTIVO DISPONIBLE", this.money(p.balance), "Capital inicial: $12,000")}${this.stat("ENTRADAS DE CAJA", this.money(s.totals.income), "Incluye patrocinios y financiación")}${this.stat("SALIDAS DE CAJA", this.money(s.totals.expense), "Todos los movimientos registrados")}${this.stat("NÓMINAS DEVENGADAS", this.money(salary), "Pendientes de la siguiente liquidación")}</div><div class="finance-grid"><section class="panel padded"><div class="section-title"><h2>Flujo de caja</h2><span class="eyebrow">ÚLTIMOS 30 DÍAS</span></div><div class="cash-chart"><svg viewBox="0 0 640 170" role="img" aria-label="Ingresos y gastos netos diarios de los últimos 30 días"><path d="M0 85H640" stroke="#56615b" stroke-dasharray="3 6"/>${daily.map((n, i) => `<rect x="${i * 21 + 4}" y="${n >= 0 ? 85 - (n / max) * 70 : 85}" width="12" height="${Math.max(1, (Math.abs(n) / max) * 70)}" rx="2" fill="${n >= 0 ? "#8cae8e" : "#cb8b68"}"/>`).join("")}</svg><div class="chart-labels"><span>${this.date(Math.max(0, s.day - 29), true)}</span><span>HOY</span></div></div><div class="budget-lines"><div><span>Operación del garaje</span><b>$18 / día</b></div><div><span>Previsión mensual total</span><b>${this.money(G.Economy.monthly(s))}</b></div><div><span>Margen de recuperación en descubierto</span><b>14 días</b></div></div></section><section class="panel padded service-panel"><span class="eyebrow gold">INGRESO COMPLEMENTARIO</span><h2>El garaje también trabaja.</h2><p>Acepta un encargo de mantenimiento para un cliente local. El encargo ocupa una bahía durante ${G.Staff.plan(s, s.playerId, "repair", 3).days} días.</p><div class="job-pay">$360 <small>NETOS / ENCARGO</small></div>${this.button(s.job ? "Entrega el " + this.date(s.job.end, true) : "Aceptar encargo", "job", "primary wide", s.job ? "disabled" : "")}<p class="fine-print">Consumibles ya descontados. Un encargo cada 7 días. Los encargos y revisiones comparten las ${G.Facilities.bays(s)} bahías disponibles.</p></section></div><section class="panel ledger-panel"><div class="panel-heading"><h2>Libro de movimientos</h2><span class="eyebrow">${p.ledger.length} REGISTROS RECIENTES</span></div><table><thead><tr><th>FECHA</th><th>CONCEPTO</th><th>CATEGORÍA</th><th class="align-right">IMPORTE</th></tr></thead><tbody>${
          p.ledger
            .slice(0, 45)
            .map(
              (t) =>
                `<tr><td class="muted">${this.date(t.day, true)}</td><td>${this.escape(t.label)}</td><td><span class="badge outline">${this.escape(t.category)}</span></td><td class="align-right ${t.amount >= 0 ? "positive" : "negative"}">${t.amount > 0 ? "+" : ""}${this.money(t.amount)}</td></tr>`,
            )
            .join("") ||
          '<tr><td colspan="4" class="empty-cell">Todavía no hay movimientos. El capital inicial es de $12,000.</td></tr>'
        }</tbody></table></section>`
      );
    },
    news(s) {
      return `<div class="paper"><div class="paper-top"><span>EDICIÓN ${String(s.day + 1).padStart(4, "0")}</span><span>PERIODISMO DEL MUNDO SIMULADO</span><span>${this.date(s.day).toUpperCase()}</span></div><div class="masthead"><span>THE</span><h1>MOTOR WORLD DAILY</h1><p>THE BUSINESS OF GOING FASTER.</p></div><div class="paper-sub"><span>EMPRESAS / PILOTOS / COMPETICIÓN</span><span>HECHOS CONFIRMADOS · ARCHIVO DE 200 NOTICIAS</span></div>${!s.news.some((n) => n.day === s.day) ? '<div class="paper-quiet">Sin nuevos acontecimientos confirmados hoy. Consulta las últimas noticias del paddock.</div>' : ""}<div class="articles">${s.news.map((n, i) => `<article class="paper-article ${i === 0 ? "lead" : ""}"><div class="eyebrow">${n.category.toUpperCase()} / ${this.date(n.day, true)}</div><h2>${this.escape(n.title)}</h2><p>${this.escape(n.body)}</p><button class="paper-link" data-action="news-target" data-id="${n.id}">Consultar ${n.category === "Fichajes" ? "piloto" : n.target === "competition" ? "competición" : "acontecimiento"} ↗</button></article>`).join("")}</div></div>`;
    },
    history(s) {
      return (
        this.heading(
          "ARCHIVO",
          "Tu legado en el automovilismo.",
          "Los campeones y resultados se conservan al abrir nuevas temporadas.",
        ) +
        `<div class="history-grid">${s.history.length ? s.history.map((h) => `<article class="panel padded season-history"><span class="eyebrow gold">TEMPORADA ${h.year}</span><h2>${this.escape(h.champion)}</h2><p>Campeón de la Copa Club de Turismos</p><div class="history-player">${h.logo ? `<img class="company-logo" src="${h.logo}" alt="Logotipo histórico">` : this.logo(s)}<div><strong>${h.playerPosition}º · ${h.playerPoints} puntos</strong><small>${this.escape(G.player(s).name)} · Prima ${this.money(h.bonus)}</small></div></div>${h.standings.map((row, i) => `<div class="timeline-line"><small>${String(i + 1).padStart(2, "0")}</small><span>${this.escape(row.name)}</span><b>${row.points}</b></div>`).join("")}</article>`).join("") : '<section class="panel empty-state"><span class="empty-number">2026</span><h2>La historia está en tus manos.</h2><p>Completa las seis rondas de tu primera temporada.<br>Su campeón y tu resultado quedarán registrados aquí.</p><button class="secondary" data-go="competition">Ver la Copa Club →</button></section>'}</div>`
      );
    },
    race(s) {
      const r = s.race,
        t = G.Data.tracks[r.track],
        mode = G.App.camera?.mode || "broadcast",
        cameraLabel =
          mode === "overview"
            ? "Cámara: circuito"
            : mode === "follow"
              ? "Cámara: seguimiento"
              : "Cámara: TV";
      return `<div class="broadcast-heading"><div><span class="kicker"><i></i> COPA CLUB · TRANSMISIÓN EN DIRECTO</span><h1>${t.name}</h1><p>${t.region} <span>·</span> ${t.laps} vueltas <span>·</span> ${(t.length / 1000).toFixed(2)} km por vuelta</p></div><div class="race-controls"><button class="secondary" data-action="pause" id="pause-button">${G.App.paused ? "Reanudar" : "Pausar"}</button><div class="speed-selector" aria-label="Velocidad de simulación">${[1, 2, 4].map((n) => `<button class="speed-button ${G.App.speed === n ? "selected" : ""}" data-action="speed" data-value="${n}" aria-label="Velocidad ${n}">×${n}</button>`).join("")}</div><button class="secondary" data-action="race-audio" id="audio-button" aria-pressed="${!!G.App.audioEnabled}">${this.icon("sound")} ${G.App.audioEnabled ? "Sonido activado" : "Activar sonido"}</button></div></div><div class="race-layout"><section class="timing-panel panel"><div class="panel-heading"><h2>En pista</h2><span class="live-label"><i></i> DIRECTO</span></div><div class="timing-labels"><span>POS / PILOTO</span><span>DIF.</span></div><div id="live-standings"></div><div class="timing-hint">Selecciona un piloto para seguir su carrera.</div></section><section class="race-track panel"><div class="track-overlay"><span class="broadcast-brand">R<span>//</span>C <b>LIVE</b></span><span id="live-lap">VUELTA 1 / ${t.laps}</span></div><canvas id="race-canvas" aria-label="Transmisión de la carrera: circuito, coches y acontecimientos en tiempo real"></canvas><div class="race-event-banner" id="live-event" aria-live="polite"></div><div class="track-bottom"><span class="race-flag" id="live-flag"><i class="live-dot"></i> BANDERA VERDE</span><span id="live-clock">00:00.0</span></div><div class="camera-toolbar"><span id="camera-focus">Cámara de realización</span><div><button class="camera-control" data-action="camera" id="camera-button">${cameraLabel}</button><button class="camera-control" data-action="camera-zoom" data-value="out" aria-label="Alejar cámara">−</button><span id="camera-zoom-value">${(G.App.camera?.zoom || 1).toFixed(1)}×</span><button class="camera-control" data-action="camera-zoom" data-value="in" aria-label="Acercar cámara">+</button></div></div></section><aside class="telemetry panel"><div class="telemetry-heading"><span class="eyebrow">TU MURO DE ESTRATEGIA</span><span class="radio-dot"></span></div><div id="live-telemetry"></div><div class="orders"><span class="eyebrow">DA UNA ORDEN A TU PILOTO</span><button class="order" data-action="order" data-value="attack"><b>↑ Atacar</b><small>Busca huecos. Más ritmo y riesgo.</small></button><button class="order selected" data-action="order" data-value="balanced"><b>→ Equilibrado</b><small>Competir sin exigirlo todo.</small></button><button class="order" data-action="order" data-value="save"><b>↓ Conservar</b><small>Cuida el coche y evita contactos.</small></button></div></aside></div><section class="radio-panel panel"><div><span class="eyebrow">RADIO DEL PADDOCK</span><h2>La carrera, al momento.</h2></div><div id="live-radio"></div></section>`;
    },
    updateRace(s) {
      const r = s.race;
      if (!r) return;
      const def = G.Data.tracks[r.track],
        sorted = G.Race.positions(r),
        a = r.entrants.find((x) => x.companyId === s.playerId),
        focusId = G.App.camera?.focusId;
      const clock = (seconds) =>
        `${Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
      const standings = document.getElementById("live-standings");
      if (!standings) return;
      const leader = sorted.find((x) => !x.dnf) || sorted[0];
      const focusedTimingId =
        document.activeElement?.closest?.(".timing-row")?.dataset.id;
      standings.innerHTML = sorted
        .map((x, i) => {
          const gap = x.dnf
            ? "RET"
            : x.finishTime !== null
              ? "META"
              : i === 0
                ? "LÍDER"
                : "+" +
                  (
                    (leader.progress - x.progress) /
                    Math.max(leader.speed, 12)
                  ).toFixed(1) +
                  " s";
          return `<button class="timing-row ${x.companyId === s.playerId ? "is-player" : ""} ${focusId === x.carId ? "is-watched" : ""}" data-action="watch-driver" data-id="${x.carId}" aria-label="Seguir a ${this.escape(x.name)}"><b>${String(i + 1).padStart(2, "0")}</b><i style="background:${x.color}"></i><span>${this.escape(x.name)}<small>${this.escape(x.team)}</small></span><em>${gap}</em>${x.incident && x.incidentUntil > r.time ? '<span class="timing-incident" title="Incidente en pista">!</span>' : ""}</button>`;
        })
        .join("");
      if (focusedTimingId)
        standings
          .querySelector(`[data-id="${focusedTimingId}"]`)
          ?.focus({ preventScroll: true });
      document.getElementById("live-lap").textContent =
        `VUELTA ${Math.min(def.laps, Math.floor(Math.max(0, leader?.progress || 0) / def.length) + 1)} / ${def.laps}`;
      document.getElementById("live-clock").textContent = clock(r.time);
      const yellow = r.yellowUntil > r.time || r.flag === "yellow",
        flag = document.getElementById("live-flag");
      if (flag) {
        flag.classList.toggle("yellow", yellow);
        flag.innerHTML = yellow
          ? '<i class="flag-square"></i> PRECAUCIÓN EN PISTA'
          : '<i class="live-dot"></i> BANDERA VERDE';
      }
      const latest = r.events?.find((e) => r.time - e.time < 9),
        banner = document.getElementById("live-event");
      if (banner) {
        banner.classList.toggle("visible", !!latest);
        banner.classList.toggle(
          "incident-event",
          !!latest &&
            [
              "contact",
              "collision",
              "spin",
              "crash",
              "offtrack",
              "retirement",
            ].includes(latest.type),
        );
        banner.innerHTML = latest
          ? `<span>${clock(latest.time)} / ${latest.type === "overtake" ? "ADELANTAMIENTO" : "EN PISTA"}</span><strong>${this.escape(latest.text)}</strong>`
          : "";
      }
      const camera = G.Render.cameraInfo(
          document.getElementById("race-canvas"),
          r,
          r.track,
          G.App.camera,
        ),
        actualFocus = camera?.focusId || focusId,
        watched =
          r.entrants.find(
            (x) => x.carId === actualFocus || x.companyId === actualFocus,
          ) ||
          a ||
          leader,
        caption = document.getElementById("camera-focus");
      if (caption)
        caption.textContent =
          G.App.camera?.mode === "overview"
            ? "Vista general del circuito"
            : watched
              ? `${G.App.camera?.mode === "broadcast" ? "TV · " : ""}${watched.name} · ${watched.model}`
              : "Cámara de realización";
      const t = document.getElementById("live-telemetry");
      t.innerHTML = a
        ? `<div class="telemetry-driver">${this.portrait(s.drivers.find((d) => d.id === a.driverId))}<div><small>TU PILOTO</small><b>${this.escape(a.name)}</b><span>${sorted.findIndex((x) => x === a) + 1}º puesto · ${a.dnf ? "RETIRADO" : a.finishTime !== null ? "EN META" : a.incident === "spin" ? "RECUPERANDO EL CONTROL" : a.offTrack ? "FUERA DE PISTA" : "EN CARRERA"}</span></div></div><div class="live-speed">${Math.round(a.speed * 3.6)}<small>KM/H</small></div><div class="padded telemetry-bars">${this.bar("Neumáticos", a.tires)}${this.bar("Estado del coche", a.condition)}</div>`
        : '<div class="padded muted">Tu equipo no participa en esta ronda. Puedes seguir a cualquier rival.</div>';
      document.querySelectorAll(".order").forEach((b) => {
        b.classList.toggle("selected", b.dataset.value === a?.mode);
        b.disabled = !a || a.dnf || a.finishTime !== null;
      });
      document.getElementById("live-radio").innerHTML = r.messages
        .slice(0, 4)
        .map(
          (m) =>
            `<p><time>${clock(m.time)}</time><span>${this.escape(m.text)}</span></p>`,
        )
        .join("");
    },
    modal(title, body, wide = false) {
      document.getElementById("modal-root").innerHTML =
        `<div class="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" class="modal ${wide ? "modal-wide" : ""}"><div class="modal-heading"><div><span class="eyebrow gold">RACING COMPANY SIMULATOR</span><h2 id="modal-title">${title}</h2></div><button class="close-button" data-action="close" aria-label="Cerrar ventana">×</button></div><div class="modal-content">${body}</div></section></div>`;
      const focus = document.querySelector(
        '.modal input:not([type="hidden"]),.modal button',
      );
      focus?.focus();
    },
    toast(message, error = false) {
      const el = document.getElementById("toast");
      el.textContent = message;
      el.className = "show " + (error ? "error" : "");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => (el.className = ""), 4500);
    },
    render(s, view) {
      document.getElementById("app").innerHTML = s
        ? this.shell(s, view, this[view](s))
        : this.menu();
      if (view === "race" && s) this.updateRace(s);
    },
  };
})();
