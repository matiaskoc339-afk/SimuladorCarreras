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
        maximumFractionDigits: 0,
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
      const t = d.id.split("-").pop() % 4,
        colors = ["#7f9b90", "#b28c73", "#7b8fa5", "#a09b73"];
      return `<svg class="portrait" viewBox="0 0 100 115" role="img" aria-label="Retrato ilustrado de ${this.escape(d.name)}"><rect width="100" height="115" fill="${colors[t]}"/><path d="M5 115Q5 78 36 78L64 78Q95 78 95 115" fill="#1a292e"/><path d="M40 73V90L50 98L60 90V73" fill="#c79775"/><ellipse cx="50" cy="48" rx="23" ry="32" fill="${t === 2 ? "#bd8b69" : "#ddb18b"}"/><path d="M27 44V28Q40 9 63 18L74 29L71 46L63 29L44 31L30 42" fill="#2e302c"/><path d="M38 48H43M57 48H62" stroke="#363e37" stroke-width="3"/><path d="M44 67Q50 70 56 67" fill="none" stroke="#885d4d" stroke-width="2"/><path d="M15 115V98H35M85 115V98H65M48 100V115" stroke="#d4a14b" stroke-width="3"/><text x="80" y="108" fill="#d3d7ca" font-size="11" font-family="monospace">${d.age}</text></svg>`;
    },
    menu() {
      let slots;
      try {
        slots = G.Storage.list();
      } catch {
        slots = [];
      }
      return `<div class="main-menu"><div class="menu-grid"></div><div class="menu-top"><a class="wordmark">R<span>//</span>C</a><span class="eyebrow">INDEPENDENT MOTORSPORT MANAGEMENT</span>${this.badge("VERSIÓN 0.3 · TALLER Y COMPONENTES")}</div><main class="menu-content"><div class="menu-copy"><span class="kicker"><i></i> LA PRÓXIMA LEYENDA EMPIEZA EN UN GARAJE</span><h1>RACING<br>COMPANY<br><span>SIMULATOR.</span></h1><p>Tu equipo. Tus decisiones. Tu historia.<br>Construye una compañía capaz de llegar a lo más alto.</p><button class="primary large" data-action="new">Fundar mi compañía ${this.icon("arrow")}</button><span class="menu-note">GESTIÓN ESTRATÉGICA · CARRERAS EN TIEMPO REAL · SIN CONEXIÓN</span></div><div class="menu-side"><div class="menu-car">${G.Render.carSVG({ ...G.Data.models[0], id: "menu", color: "#dba64d" })}</div><div class="continue-panel"><span class="eyebrow">TU LEGADO</span><h3>Volver al paddock</h3>${
        slots.some((x) => !x.empty)
          ? slots
              .filter((x) => !x.empty)
              .map(
                (x) =>
                  `<button class="load-card" data-action="load" data-slot="${x.slot}" ${x.error ? "disabled" : ""}><span><b>${this.escape(x.name || "Guardado dañado")}</b><small>${x.error ? this.escape(x.error) : this.date(x.day, true) + " · Temporada " + x.year}</small></span>${this.icon("arrow")}</button>`,
              )
              .join("")
          : '<p class="muted">Tu historia todavía no se ha escrito.<br>Funda una compañía para comenzar.</p>'
      }<button class="text-button" data-action="saves">Gestionar partidas e importar archivo ↗</button></div></div></main><footer class="menu-footer"><span>01 / DE UN PEQUEÑO GARAJE AL MUNDO</span><span>HTML5 · CANVAS 2D · HECHO PARA PC</span></footer></div>`;
    },
    shell(s, view, content) {
      const p = G.player(s),
        e = G.nextEvent(s),
        due = e && e.day <= s.day;
      const nav = (id, icon, title) =>
        `<button title="${title}" aria-label="${title}" class="rail-button ${view === id ? "active" : ""}" data-go="${id}">${this.icon(icon)}</button>`;
      return `<div class="game-shell"><aside class="rail"><button class="wordmark" data-go="hq" aria-label="Sede central">R<span>//</span>C</button><div class="rail-nav">${nav("hq", "home", "Sede central")}${nav("news", "news", "Motor World Daily")}${nav("history", "history", "Archivo histórico")}</div><span class="rail-season">TEMPORADA ${s.season.year}</span><div class="rail-bottom"><button class="rail-button" title="Guardar partida" aria-label="Guardar partida" data-action="save">${this.icon("save")}</button><button class="rail-button" title="Partidas y opciones" aria-label="Partidas y opciones" data-action="saves">${this.icon("settings")}</button></div></aside><div class="game-body"><header class="topbar"><button class="company-brand" data-go="hq">${this.logo(s)}<span><b>${this.escape(p.name)}</b><small>NIVEL ${p.level} / ${G.Data.levels[p.level - 1].toUpperCase()}</small></span></button><div class="top-metrics"><div><small>EFECTIVO</small><b class="${p.balance < 0 ? "negative" : ""}">${this.money(p.balance)}</b></div><div class="reputation"><small>REPUTACIÓN</small><b><span class="gold">✦</span> ${p.reputation.toFixed(1)}<span class="muted"> / 100</span></b></div><div class="date-block"><small>${G.dateAt(s.day).toLocaleDateString("es-ES", { weekday: "long", timeZone: "UTC" }).toUpperCase()}</small><b>${this.date(s.day, true)} <span class="muted">${G.dateAt(s.day).getUTCFullYear()}</span></b></div></div><button class="primary advance" data-action="advance" ${s.race || s.status !== "active" ? "disabled" : ""}>${due ? "Jornada de carrera" : "Avanzar día"} ${this.icon(due ? "flag" : "arrow")}</button></header>${s.status === "bankrupt" ? `<div class="alert danger"><b>La compañía se ha declarado en bancarrota.</b> Tu trayectoria queda archivada. Puedes guardar el legado o iniciar una partida nueva.</div>` : p.balance < 0 ? `<div class="alert danger">Saldo en descubierto · quedan ${14 - p.debtDays} días para recuperarte. Los encargos de taller generan ingresos reales.</div>` : due && !s.race ? `<div class="alert">${this.icon("flag")} Hoy se disputa ${G.Data.tracks[e.track].name}. <button class="text-button" data-go="competition">Preparar la carrera →</button></div>` : ""}<main class="page ${view === "race" ? "race-page" : ""}">${content}</main><footer class="statusbar"><span><i class="live-dot"></i> MUNDO PERSISTENTE <span class="muted">/</span> SEMILLA ${s.seed}</span><span id="save-status">Guardado local · ranura ${G.App.slot || "—"}</span><span>RCS <b>0.3</b></span></footer></div></div>`;
    },
    heading(tag, title, subtitle = "", actions = "") {
      return `<div class="page-heading"><div><div class="eyebrow breadcrumb"><button data-go="hq">SEDE CENTRAL</button> <span>/</span> ${tag}</div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div><div class="heading-actions">${actions}</div></div>`;
    },
    hq(s) {
      const p = G.player(s),
        next = G.nextEvent(s),
        d = G.ownedDrivers(s),
        car = G.ownedCars(s)[0] || { condition: 0 },
        board = G.leaderboard(s),
        position = board.findIndex((x) => x.company.id === s.playerId) + 1;
      const task = (done, title, body, go) =>
        `<button class="task" data-go="${go}"><span class="task-check ${done ? "done" : ""}">${done ? "✓" : "↗"}</span><span><b>${this.escape(title)}</b><small>${this.escape(body)}</small></span></button>`;
      return (
        this.heading(
          "VISTA GENERAL",
          'Un pequeño garaje.<br><span class="muted">Una gran ambición.</span>',
          "Tu primera escudería se construye una decisión a la vez.",
          this.badge("TEMPORADA " + s.season.year, "outline") +
            '<button class="secondary" data-go="companies">Compañías del paddock ↗</button>',
        ) +
        `<div class="hq-layout"><section class="map-panel panel"><div class="panel-heading"><span class="eyebrow">TU SEDE · SEVILLA</span><span class="map-hint"><i class="live-dot"></i> SELECCIONA UN DEPARTAMENTO</span></div>${G.Render.headquarters(s)}<div class="map-footer"><span><b>01</b> Garaje alquilado</span><span><b>${d.length}/2</b> Pilotos</span><span><b>${G.ownedCars(s).length}/${p.carCapacity}</b> Plazas de garaje</span><span class="muted">HERRAMIENTAS BÁSICAS</span></div></section><aside class="hq-sidebar"><section class="next-race panel"><span class="eyebrow gold">${next ? "PRÓXIMO COMPROMISO" : "TEMPORADA COMPLETADA"}</span><h2>${next ? G.Data.tracks[next.track].name : "La bandera a cuadros."}</h2><p>${next ? `RONDA ${next.round} / 6 · ${this.date(next.day, true).toUpperCase()}` : `${s.season.year} ya forma parte de tu historia.`}</p><div class="mini-circuit"><svg viewBox="0 0 300 140"><path d="M40 50Q50 20 100 25L235 30Q278 40 256 78L210 82Q252 125 190 118L72 108Q20 90 40 50Z" fill="none" stroke="#647a6d" stroke-width="12"/><path d="M40 50Q50 20 100 25L235 30Q278 40 256 78L210 82Q252 125 190 118L72 108Q20 90 40 50Z" fill="none" stroke="#b9b9a6" stroke-width="1" stroke-dasharray="5 6"/><circle cx="40" cy="50" r="5" fill="#e2ac52"/></svg><span>${next ? Math.max(0, next.day - s.day) + "<small>DÍAS</small>" : "06<small>PRUEBAS</small>"}</span></div>${this.button(next ? (next.entry ? "Ver inscripción" : "Preparar carrera") : "Ver clasificación", "go-competition", "primary wide")}</section><section class="panel checklist"><span class="eyebrow">EN TU MESA</span>${task(d.length > 0, "Encuentra a tu piloto", d.length ? d[0].name : s.drivers.filter((d) => !d.companyId).length + " currículums disponibles", "team")}${task(car.condition >= 90, "Prepara tu coche", car.id ? `Estado mecánico: ${Math.round(car.condition)} %` : "Garaje vacío: consulta el mercado", car.id ? "garage" : "market")}${task(!!next?.entry, "Confirma tu participación", next?.entry ? "Piloto y vehículo inscritos" : "Inscripción + transporte: $370", "competition")}</section></aside></div><div class="overview-strip">${this.stat("POSICIÓN EN LA COPA", String(position).padStart(2, "0") + " <span>/ 08</span>", (s.season.standings.player?.points || 0) + " puntos esta temporada")}${this.stat("GASTO MENSUAL ESTIMADO", this.money(G.Economy.monthly(s)), "Operación + nóminas + formación")}${this.stat("BALANCE ACUMULADO", this.money(s.totals.income - s.totals.expense), "Ingresos menos gastos de la compañía")}${this.stat("PALMARÉS", p.stats.podiums + " <span>podios</span>", p.stats.starts + " participaciones · " + p.stats.wins + " victorias")}</div><section class="news-preview"><div class="section-title"><h2>Desde el paddock<span class="gold">.</span></h2><button class="text-button" data-go="news">Motor World Daily ${this.icon("arrow")}</button></div><div class="news-grid">${s.news
          .slice(0, 3)
          .map(
            (n, i) =>
              `<button class="news-teaser" data-action="article" data-id="${n.id}"><div class="eyebrow">${n.category.toUpperCase()} <span class="muted">/ ${this.date(n.day, true)}</span></div><h3>${this.escape(n.title)}</h3><span class="muted">LEER HISTORIA ${String(i + 1).padStart(2, "0")} ↗</span></button>`,
          )
          .join("")}</div></section>`
      );
    },
    garage(s) {
      const car = G.ownedCars(s)[0];
      return (
        this.heading(
          "GARAJE",
          "Tu flota, tu identidad.",
          "Un vehículo con pasado. Una historia que todavía puedes escribir.",
        ) +
        `<div class="garage-layout"><section class="panel car-showcase"><div class="panel-heading"><span class="eyebrow">GARAJE 01 / 02</span>${this.badge(car.repair ? "EN REVISIÓN" : "VEHÍCULO PROPIO", car.repair ? "" : "green")}</div><div class="car-art">${G.Render.carSVG(car)}${s.logo ? `<img class="car-livery-logo" src="${s.logo}" alt="Librea de la compañía">` : ""}<span class="car-number">01</span></div><div class="car-caption"><span class="eyebrow">${car.brand.toUpperCase()} · ${car.generation} · ${car.year}</span><h2>${car.model}</h2><p>${Math.round(car.km).toLocaleString("es-ES")} km · Usado · ${car.brand === "Honda" || car.brand === "Toyota" ? "Tracción delantera" : "Tracción trasera"}</p></div></section><div class="garage-details"><section class="panel padded"><div class="section-title"><h2>Ficha de taller</h2>${this.badge("CLASE CLUB")}</div><div class="spec-grid">${this.stat("POTENCIA", car.hp + " <span>CV</span>")}${this.stat("PESO", car.weight + " <span>kg</span>")}${this.stat("VELOCIDAD MÁX.", car.top + " <span>km/h</span>")}${this.stat("FIABILIDAD", car.reliability + " <span>/100</span>")}</div>${this.bar("Estado mecánico", car.condition, car.condition < 50 ? "#dc7869" : "")}${this.bar("Neumáticos de calle", car.tires)}<div class="service-actions">${this.button(car.repair ? "Listo el " + this.date(car.repair.end, true) : "Revisión · " + this.money(G.Economy.repairQuote(car)), "repair", "secondary", 'data-id="' + car.id + '" ' + (car.repair ? "disabled" : ""))}${this.button("Neumáticos · " + this.money(G.Workshop.tireCost(s, car)), "tires", "secondary", 'data-id="' + car.id + '" ' + (car.tires >= 99 ? "disabled" : ""))}</div><p class="fine-print">La revisión ocupa el taller durante 2 días. El estado y el agarre afectan a la velocidad y la fiabilidad en carrera. Cifras técnicas y valores económicos equilibrados para el juego; no son una ficha de homologación.</p></section><section class="panel padded"><div class="section-title"><h2>Pasaporte del vehículo</h2><span class="eyebrow">${car.id}</span></div><div class="passport-stats"><span>${car.starts} salidas</span><span>${car.wins} victorias</span><span>${this.money((car.value * car.condition) / 100)} valor estimado</span></div>${
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
      return `<article class="driver-card panel"><div class="driver-identity">${this.portrait(d)}<div><span class="eyebrow">${this.escape(d.nation)} · ${d.age} AÑOS</span><h3>${this.escape(d.name)}</h3>${this.badge(trait.name, "outline")}<p>${trait.description}</p></div><div class="driver-rating">${G.Drivers.rating(d)}<small>ACTUAL</small></div></div><div class="driver-metrics">${["pace", "control", "consistency", "overtake"].map((k) => this.bar(G.Drivers.labels[k], d.stats[k])).join("")}</div><div class="driver-footer">${owned ? `<span><b>${this.money(d.contract.salary)}/mes</b><small>Vence ${this.date(d.contract.end, true)} · Moral ${Math.round(d.morale)} % · Fatiga ${Math.round(d.fatigue)} %</small></span>` : `<span><b>${this.money(d.ask)}/mes</b><small>${d.experience} temporadas · Potencial sin evaluar</small></span>`}${this.button(owned ? "Gestionar" : "Negociar", owned ? "driver-detail" : "negotiate", owned ? "secondary" : "primary", `data-id="${d.id}"`)}</div></article>`;
    },
    team(s) {
      const hired = G.ownedDrivers(s),
        free = s.drivers.filter((d) => !d.companyId);
      return (
        this.heading(
          "SALA DE PILOTOS",
          "Personas antes que máquinas.",
          "Cada piloto tiene sus fortalezas, expectativas y un contrato que debes cumplir.",
          this.badge(hired.length + " / 2 ASIENTOS"),
        ) +
        `<div class="section-title"><h2>Tu alineación</h2><span class="muted">El potencial real no se muestra en los currículums.</span></div><div class="drivers-grid">${hired.length ? hired.map((d) => this.driverCard(d, true)).join("") : '<div class="empty-state panel"><span class="empty-number">00</span><h3>El asiento está libre.</h3><p>Estudia los currículums y negocia un salario sostenible.<br>Necesitas un piloto para inscribirte en la Copa Club.</p></div>'}</div><div class="section-title spaced"><h2>Currículums recibidos <span class="muted">${free.length.toString().padStart(2, "0")}</span></h2><span class="eyebrow">AGENCIA LOCAL · NIVEL 1</span></div><div class="drivers-grid">${free.map((d) => this.driverCard(d)).join("")}</div>`
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
          "Seis domingos. Una oportunidad.",
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
          "Cada dólar tiene una historia.",
          "Las nóminas se liquidan el día 1. El alquiler y los suministros se pagan diariamente.",
          this.button("Editar identidad", "identity", "secondary"),
        ) +
        `<div class="overview-strip finance-stats">${this.stat("EFECTIVO DISPONIBLE", this.money(p.balance), "Capital inicial: $12,000")}${this.stat("INGRESOS TOTALES", this.money(s.totals.income), "Premios y servicios de taller")}${this.stat("GASTOS TOTALES", this.money(s.totals.expense), "Todos los movimientos registrados")}${this.stat("NÓMINAS DEVENGADAS", this.money(salary), "Pendientes de la siguiente liquidación")}</div><div class="finance-grid"><section class="panel padded"><div class="section-title"><h2>Flujo de caja</h2><span class="eyebrow">ÚLTIMOS 30 DÍAS</span></div><div class="cash-chart"><svg viewBox="0 0 640 170" role="img" aria-label="Ingresos y gastos netos diarios de los últimos 30 días"><path d="M0 85H640" stroke="#56615b" stroke-dasharray="3 6"/>${daily.map((n, i) => `<rect x="${i * 21 + 4}" y="${n >= 0 ? 85 - (n / max) * 70 : 85}" width="12" height="${Math.max(1, (Math.abs(n) / max) * 70)}" rx="2" fill="${n >= 0 ? "#8cae8e" : "#cb8b68"}"/>`).join("")}</svg><div class="chart-labels"><span>${this.date(Math.max(0, s.day - 29), true)}</span><span>HOY</span></div></div><div class="budget-lines"><div><span>Operación del garaje</span><b>$18 / día</b></div><div><span>Previsión mensual total</span><b>${this.money(G.Economy.monthly(s))}</b></div><div><span>Margen de recuperación en descubierto</span><b>14 días</b></div></div></section><section class="panel padded service-panel"><span class="eyebrow gold">INGRESO COMPLEMENTARIO</span><h2>El garaje también trabaja.</h2><p>Acepta un encargo de mantenimiento para un cliente local. El taller quedará ocupado durante tres días.</p><div class="job-pay">$360 <small>NETOS / ENCARGO</small></div>${this.button(s.job ? "Entrega el " + this.date(s.job.end, true) : "Aceptar encargo", "job", "primary wide", s.job ? "disabled" : "")}<p class="fine-print">Consumibles ya descontados. Un encargo cada 7 días. No puedes hacer una revisión completa mientras el taller está ocupado.</p></section></div><section class="panel ledger-panel"><div class="panel-heading"><h2>Libro de movimientos</h2><span class="eyebrow">${p.ledger.length} REGISTROS RECIENTES</span></div><table><thead><tr><th>FECHA</th><th>CONCEPTO</th><th>CATEGORÍA</th><th class="align-right">IMPORTE</th></tr></thead><tbody>${
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
        t = G.Data.tracks[r.track];
      return `<div class="broadcast-heading"><div><span class="kicker"><i></i> EN DIRECTO / COPA CLUB</span><h1>${t.name}</h1><p>${t.region} · ${t.laps} vueltas · Pista seca · Neumáticos de calle</p></div><div class="race-controls"><button class="secondary" data-action="pause" id="pause-button">Pausar</button>${[1, 2, 4].map((n) => `<button class="speed-button ${G.App.speed === n ? "selected" : ""}" data-action="speed" data-value="${n}">×${n}</button>`).join("")}<button class="secondary" data-action="camera" id="camera-button">Cámara: circuito</button></div></div><div class="race-layout"><section class="panel timing-panel"><div class="panel-heading"><h2>Clasificación</h2><span class="badge green">LIVE</span></div><div id="live-standings"></div></section><section class="race-track panel"><div class="track-overlay"><span class="broadcast-brand">R<span>//</span>C <b>LIVE</b></span><span id="live-lap">VUELTA 1 / ${t.laps}</span></div><canvas id="race-canvas" aria-label="Carrera animada: coches recorriendo el circuito"></canvas><div class="track-bottom"><span><i class="live-dot"></i> BANDERA VERDE</span><span id="live-clock">00:00.0</span></div></section><aside class="telemetry panel"><div class="panel-heading"><h2>Radio del equipo</h2><span class="radio-dot"></span></div><div id="live-telemetry"></div><div class="orders"><span class="eyebrow">ORDEN DE RITMO</span><button class="order" data-action="order" data-value="attack">↑ Atacar <small>Más ritmo · más desgaste</small></button><button class="order selected" data-action="order" data-value="balanced">→ Equilibrado <small>Ritmo constante</small></button><button class="order" data-action="order" data-value="save">↓ Conservar <small>Menos riesgo · cuidar gomas</small></button></div></aside></div><section class="radio-panel panel"><span class="eyebrow gold">RADIO / DIRECCIÓN DE CARRERA</span><div id="live-radio"></div></section>`;
    },
    updateRace(s) {
      const r = s.race;
      if (!r) return;
      const def = G.Data.tracks[r.track],
        sorted = G.Race.positions(r),
        a = r.entrants.find((a) => a.companyId === s.playerId);
      const clock = (seconds) =>
        `${Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
      const standings = document.getElementById("live-standings");
      if (!standings) return;
      standings.innerHTML = sorted
        .map(
          (x, i) =>
            `<div class="timing-row ${x.companyId === s.playerId ? "is-player" : ""}"><b>${i + 1}</b><i style="background:${x.color}"></i><span>${this.escape(x.name)}<small>${this.escape(x.team)}</small></span><em>${x.dnf ? "OUT" : x.finishTime !== null ? "FIN" : i === 0 ? "LÍDER" : "+" + ((sorted[0].progress - x.progress) / Math.max(x.speed, 12)).toFixed(1)}</em></div>`,
        )
        .join("");
      document.getElementById("live-lap").textContent =
        `VUELTA ${Math.min(def.laps, Math.floor(Math.max(0, sorted[0]?.progress || 0) / def.length) + 1)} / ${def.laps}`;
      document.getElementById("live-clock").textContent = clock(r.time);
      document.getElementById("live-telemetry").innerHTML = a
        ? `<div class="telemetry-driver">${this.portrait(s.drivers.find((d) => d.id === a.driverId))}<div><b>${this.escape(a.name)}</b><small>${sorted.findIndex((x) => x === a) + 1}º puesto · ${a.dnf ? "ABANDONO" : a.finishTime !== null ? "EN META" : "EN PISTA"}</small></div></div><div class="live-speed">${Math.round(a.speed * 3.6)}<small>KM/H</small></div><div class="padded telemetry-bars">${this.bar("Neumáticos", a.tires)}${this.bar("Mecánica", a.condition)}</div>`
        : '<div class="padded muted">Sin coche de tu compañía en pista.</div>';
      document.querySelectorAll(".order").forEach((b) => {
        b.classList.toggle("selected", b.dataset.value === a?.mode);
        b.disabled = !a || a.dnf || a.finishTime !== null;
      });
      document.getElementById("live-radio").innerHTML = r.messages
        .slice(0, 3)
        .map(
          (m) => `<p><time>${clock(m.time)}</time>${this.escape(m.text)}</p>`,
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
