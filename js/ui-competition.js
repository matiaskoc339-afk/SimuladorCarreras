"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    C = G.Competition;
  const map = (index) => {
    const pts = G.Race.track(index),
      scaled = pts.map((p) => ({ x: p.x, y: p.y * 0.66 })),
      xs = scaled.map((p) => p.x),
      ys = scaled.map((p) => p.y),
      x = Math.min(...xs) - 35,
      y = Math.min(...ys) - 35,
      w = Math.max(...xs) - x + 35,
      h = Math.max(...ys) - y + 35,
      d =
        scaled
          .filter((p, i) => i % 4 === 0)
          .map(
            (p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1),
          )
          .join("") + "Z";
    const pit = G.RaceWeekend.pitLayout(index),
      scale = G.Race.worldScale(index),
      pitPoints = Array.from({ length: 65 }, (_, i) => {
        const distance = pit.entry + ((pit.exit - pit.entry) * i) / 64;
        const p = G.Racecraft.metric(
          index,
          distance,
          G.RaceWeekend.pitLateral(index, distance),
        );
        return `${i ? "L" : "M"}${(p.x / scale).toFixed(1)} ${(p.y / scale).toFixed(1)}`;
      }).join(""),
      boxes = Array.from({ length: 9 }, (_, i) => {
        const distance =
            pit.entry + (pit.exit - pit.entry) * (0.32 + (i / 9) * 0.36),
          p = G.Racecraft.metric(
            index,
            distance,
            G.RaceWeekend.pitLateral(index, distance) + pit.side * 5,
          );
        return `<rect x="${p.x / scale - 5}" y="${p.y / scale - 4}" width="10" height="8" fill="#b47c43"/>`;
      }).join("");
    return `<svg class="circuit-map" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="Trazado y boxes de ${U.escape(G.Data.tracks[index].name)}"><path d="${d}" fill="none" stroke="#546c60" stroke-width="26" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#e4e7d7" stroke-width="9"/><path data-pit-route="true" d="${pitPoints}" fill="none" stroke="#b47c43" stroke-width="4"/>${boxes}<circle cx="${scaled[0].x}" cy="${scaled[0].y}" r="16" fill="#ee6246"/></svg>`;
  };
  const UI = (G.CompetitionUI = {
    map,
    hqScores(s) {
      return Object.entries(C.rules)
        .map(
          ([cup, rule]) =>
            `<div data-hq-league="${cup}"><strong>${C.score(s, s.playerId, cup)}</strong><span>${U.escape(rule.name)}</span><small>Puntos de esta temporada</small></div>`,
        )
        .join("");
    },
    progress(s) {
      const license = C.licenseStatus(s),
        regional = s.competitions.proPoints[s.playerId] || 0;
      return `<section class="career-path league-points-summary" aria-label="Puntos separados por liga">${Object.entries(
        C.rules,
      )
        .map(
          ([cup, rule]) =>
            `<div data-league-points="${cup}"><span class="eyebrow">${U.escape(rule.name)}</span><b><span data-season-points>${C.score(s, s.playerId, cup)}</span> puntos</b><p>Temporada ${s.season.year} · <span data-final-points>${C.score(s, s.playerId, cup, true)} / ${rule.qualify}</span> para su final</p>${U.button("Ver esta liga", "league-open", "text-button", `data-cup="${cup}" aria-label="Ver ${U.escape(rule.name)}"`)}</div>`,
        )
        .join(
          "",
        )}</section><p class="league-points-note">Cada carrera suma únicamente a su liga. Los puntos de temporada y de clasificación para finales se reinician cada año; no se transfieren entre ligas.</p><section class="panel league-license-panel ${license.owned ? "licensed" : ""}" aria-label="Licencia y acceso profesional"><div><span class="eyebrow">ACCESO A COMPETICIONES PROFESIONALES</span><h2>${license.owned ? "Licencia profesional obtenida" : "Consigue tu licencia en la calle"}</h2><p>Necesitas la licencia para competir en las copas regional y nacional. Se obtiene con <b>24 puntos callejeros acumulados</b> y un pago de <b>${U.money(license.cost)}</b>.</p><p class="license-progress" data-license-street>Trayectoria callejera: <b>${license.points} / ${license.required}</b>${license.missing ? ` · faltan ${license.missing} puntos callejeros` : " · requisito de puntos cumplido"}.</p><small>La licencia se conserva entre temporadas. Los puntos no se gastan al tramitarla.</small><p class="national-access">Acceso a la Nacional: licencia y <b>12 puntos regionales acumulados</b> · tienes ${regional}. Cada copa comprueba además piloto, coche y su propia clasificación a la final.</p></div><div class="license-actions">${license.owned ? '<span class="badge green">Válida en Regional y Nacional</span>' : U.button("Tramitar licencia profesional", "competition-license", "primary", U.blocked(license.reason))}</div></section>`;
    },
    resultPoints(s, e) {
      return `<section class="result-league-points"><b>Puntos de ${U.escape(C.rule(e).name)}</b><p>Esta carrera suma exclusivamente a esta liga. Las otras clasificaciones se mantienen independientes.</p><div>${Object.entries(
        C.rules,
      )
        .map(
          ([cup, rule]) =>
            `<span data-result-league="${cup}">${U.escape(rule.name)} <strong>${C.score(s, s.playerId, cup)}</strong></span>`,
        )
        .join("")}</div></section>`;
    },
    driverTables(events) {
      return Object.entries(C.rules)
        .map(([cup, rule]) => {
          const rows = C.driverBoard(events, cup);
          return `<section class="league-driver-table" data-driver-league="${cup}"><h3>${U.escape(rule.name)} · pilotos</h3>${rows.length ? `<div class="archive-scroll"><table class="standings"><thead><tr><th>POS</th><th>PILOTO</th><th>SAL.</th><th>VIC.</th><th>PTS DE ESTA LIGA</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${U.escape(r.name)}</td><td>${r.starts}</td><td>${r.wins}</td><td>${r.points}</td></tr>`).join("")}</tbody></table></div>` : '<p class="fine-print">Todavía no hay resultados de pilotos en esta liga.</p>'}</section>`;
        })
        .join("");
    },
    event(A, id) {
      const s = A.state,
        e = s.season.events.find((e) => e.id === id);
      G.assert(e, "Prueba desconocida.");
      if (e.status !== "scheduled") return A.results(id);
      const t = G.Data.tracks[e.track],
        rule = C.rule(e),
        block = C.registrationReason(s, e),
        drivers = G.ownedDrivers(s),
        cars = G.ownedCars(s).filter((c) => !G.Market.listed(s, c.id)),
        due = e.day <= s.day;
      const caption = `<div class="event-facts"><b>${rule.name} · ${e.final ? "FINAL" : `Ronda ${e.round}`}</b><span>${U.date(e.day)} · ${t.laps} vueltas · ${(t.length / 1000).toFixed(2)} km/vuelta</span><span>Inscripción ${U.money(C.fee(e) - rule.transport)} + transporte ${U.money(rule.transport)} = <b>${U.money(C.fee(e))}</b>, más gomas elegidas</span></div><div class="event-location">${G.WorldCircuitUI.location(t)}</div>${map(e.track)}<div class="competition-rule ${e.cup}">${e.cup === "street" ? "Contacto entre vehículos admitido. Muros próximos, mayor riesgo y daños persistentes; nadie paga tus reparaciones." : "Reglamento profesional: los contactos evitables se sancionan. Exige licencia y verificación técnica."} Máximo ${rule.maxHP} CV. ${e.final ? `Acceso: ${rule.qualify} puntos de clasificación en esta liga.` : ""}</div>`;
      let content;
      if (e.entry)
        content = `<div class="onboarding-note"><strong>Inscripción confirmada · ${U.money(e.entry.paid)} de tasas pagadas</strong>${U.escape(s.drivers.find((d) => d.id === e.entry.driverId)?.name)} · ${U.escape(s.cars.find((c) => c.id === e.entry.carId)?.model)}</div><div class="modal-actions">${due ? U.button("Ir a la parrilla", "start-race", "primary", `data-id="${id}"`) : U.button("Volver al calendario", "close", "primary")}${U.button("Retirar inscripción sin reembolso", "withdraw-entry", "text-button", `data-id="${id}"`)}</div>`;
      else if (block)
        content = `<section class="onboarding-note"><strong>Acceso pendiente</strong>${U.escape(block)}</section>`;
      else if (!drivers.length || !cars.length)
        content = `<p>Necesitas un piloto contratado y un coche propio operativo.</p><button class="primary" data-go="${drivers.length ? "garage" : "team"}">${drivers.length ? "Consultar garaje" : "Buscar piloto"}</button>`;
      else
        content = `<form id="entry-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Piloto</span><select name="driver">${drivers.map((d) => `<option value="${d.id}">${U.escape(d.name)} · valoración ${G.Drivers.rating(d)} · contrato hasta ${U.date(d.contract.end, true)}</option>`).join("")}</select></label><label class="form-field"><span>Coche</span><select name="car">${cars.map((c) => `<option value="${c.id}">${U.escape(c.brand + " " + c.model)} · ${Math.round(c.hp)} CV · ${Math.round(c.condition)} %</option>`).join("")}</select></label></div><p id="entry-technical" class="fine-print" role="status" aria-live="polite"></p><div class="modal-actions">${U.button("Cancelar", "close", "secondary")}<button class="primary" type="submit">Confirmar inscripción</button></div></form>`;
      U.modal(
        U.escape(t.name),
        caption +
          content +
          (due
            ? `<div class="modal-actions">${U.button("Renunciar a esta prueba", "skip-race", "text-button negative", `data-id="${id}"`)}</div>`
            : ""),
        true,
      );
      G.RaceUI.entry(A, e);
      const form = document.getElementById("entry-form");
      if (form) {
        const check = () => {
          const d = s.drivers.find((d) => d.id === form.elements.driver.value),
            car = s.cars.find((c) => c.id === form.elements.car.value),
            reason = C.technical(s, e, car, d);
          document.getElementById("entry-technical").textContent =
            reason ||
            "Alineación conforme. Prepara las modificaciones antes de inscribirte: la inscripción fija coche y piloto. Las tasas no incluyen sueldos ni gomas de carrera.";
          const submit = form.querySelector('[type="submit"]');
          submit.disabled = !!reason || form.dataset.strategyBlocked === "true";
          submit.setAttribute(
            "aria-describedby",
            "entry-technical entry-tyre-quote",
          );
        };
        form.addEventListener("change", check);
        check();
      }
    },
    action(A, name, data) {
      if (name === "league-open") {
        A.competitionTab = data.cup;
        A.go("competition");
        return true;
      }
      if (name === "track-filter") {
        A[
          data.field === "difficulty" ? "circuitDifficulty" : "circuitCategory"
        ] = data.value;
        A.render();
        return true;
      }
      if (name === "competition-tab") {
        A.competitionTab = data.tab;
        A.render();
        return true;
      }
      if (name === "competition-license") {
        A.confirm(
          "Tramitar licencia profesional",
          "Coste: $900. Exige 24 puntos callejeros acumulados. Seguirás necesitando coche/piloto aptos y pagar la inscripción de cada prueba.",
          () => A.mutate(() => C.license(A.state), "competition"),
        );
        return true;
      }
      if (name === "track-view") {
        const i = Number(data.track),
          t = G.Data.tracks[i];
        G.assert(t?.modern, "Trazado no disponible.");
        U.modal(
          t.name,
          `<div class="event-location">${G.WorldCircuitUI.location(t)}</div>${map(i)}<p>${U.escape(t.inspiration)}.</p><div class="spec-grid">${U.stat("Longitud", (t.length / 1000).toFixed(2) + " km")}${U.stat("Anchura", t.width + " m")}${U.stat("Tipo", t.kind === "street" ? "Urbano" : "Profesional")}</div><p>Diseño original inspirado en el carácter de estos circuitos. Recta de boxes con carril de paso y puestos individuales. El servicio es simultáneo; la salida a pista espera un hueco seguro.</p>`,
          true,
        );
        return true;
      }
      if (name === "competition-upgrade") {
        A.confirm(
          "Activar las nuevas ligas",
          "Se abrirá la siguiente temporada con los nuevos trazados y las tres ligas. Conservas dinero, coches, contratos y el archivo anterior. Necesitas la temporada actual completada.",
          () => {
            G.Calendar.nextSeason(A.state);
            C.initialize(A.state);
            A.persist();
            A.go("competition");
          },
        );
        return true;
      }
      return false;
    },
  });
  const competition = U.competition;
  U.competition = function (s) {
    if (!C.enabled(s)) {
      const html = competition.call(this, s);
      return (
        html +
        (s.challenge && s.season.phase === "complete"
          ? `<section class="panel padded spaced"><h2>La siguiente etapa: calle y circuitos</h2><p>Activa el nuevo calendario al comenzar otra temporada, conservando tu empresa.</p>${U.button("Siguiente temporada con las nuevas ligas", "competition-upgrade", "primary")}</section>`
          : "")
      );
    }
    const tab = G.App.competitionTab || "street";
    let content = "";
    if (tab === "tracks") content = G.WorldCircuitUI.atlas(s);
    else {
      const rule = C.rules[tab],
        events = s.season.events.filter((e) => e.cup === tab),
        board = C.board(s, tab).filter(
          (v) =>
            v.company.id === s.playerId ||
            (tab === "street"
              ? v.company.privateer || v.starts
              : !v.company.privateer),
        );
      content = `<div class="league-layout"><section><div class="competition-rule ${tab}"><b>${rule.name}</b> · Inscripción desde ${U.money(rule.fee + rule.transport)} · ${rule.qualify} puntos para la final. ${tab === "street" ? "Daños y contacto admitidos; asumes reparaciones." : "Licencia y verificación técnica; conducción antirreglamentaria sancionada."}</div><div class="league-events">${events
        .map((e) => {
          const t = G.Data.tracks[e.track],
            block = e.status === "scheduled" ? C.registrationReason(s, e) : "",
            results = e.results.find((r) => r.companyId === s.playerId);
          return `<article class="panel league-event ${e.final ? "final-event" : ""}"><span class="event-round">${e.final ? "FINAL" : String(e.round).padStart(2, "0")}</span><div><span class="eyebrow">${U.date(e.day, true)} · ${t.laps} VUELTAS</span><h3>${U.escape(t.name)}</h3>${G.WorldCircuitUI.location(t)}<p>${e.status === "scheduled" ? `${U.money(C.fee(e))} en tasas · ${e.entry ? "INSCRITO" : block || "Plazas abiertas"}` : results ? `${results.dnf ? "Abandono" : results.position + "º puesto"} · ${results.points} puntos · ${U.money(results.prize)}` : "Prueba resuelta sin participación"}</p></div>${U.button(e.status !== "scheduled" ? "Resultados" : e.entry ? "Ver inscripción" : block ? "Ver requisitos" : "Preparar salida", "event", "secondary", `data-id="${e.id}"`)}</article>`;
        })
        .join(
          "",
        )}</div></section><section class="panel padded"><span class="eyebrow">PUNTOS SEPARADOS POR LIGA</span><h2>${U.escape(rule.name)} · ${s.season.year}</h2><p>La final exige ${rule.qualify} puntos en clasificatorias.${tab === "national" ? ` Acceso a la copa: 12 puntos regionales acumulados, piloto 24 y verificación nacional. Tasas desde ${U.money(rule.fee + rule.transport)}.` : ""}</p><div class="league-standings">${board.map((v, i) => `<div class="${v.company.id === s.playerId ? "my-team" : ""}"><span>${i + 1}</span><b>${U.escape(v.company.name)}</b><span>${v.points} pt<small>${v.qualifying} para su final</small></span></div>`).join("")}</div>${s.season.cups[tab].champion ? `<p class="onboarding-note">Campeón de la final: <b>${U.escape(s.companies.find((c) => c.id === s.season.cups[tab].champion).name)}</b></p>` : ""}</section></div>`;
    }
    const next = G.nextEvent(s);
    return (
      this.heading(
        "COMPETICIÓN · TEMPORADA " + s.season.year,
        "Gana tu sitio en la parrilla.",
        "Empieza en la calle, prepara el coche y el piloto, consigue la licencia y clasifica a las finales.",
      ) +
      UI.progress(s) +
      G.WorldCircuitUI.notice(s) +
      `<nav class="competition-tabs">${[
        ["street", "Liga callejera"],
        ["pro", "Copa regional"],
        ["national", "Copa nacional"],
        ["tracks", `Los ${G.Circuits.indices().length} trazados`],
      ]
        .map(([id, label]) =>
          U.button(
            label,
            "competition-tab",
            tab === id ? "primary" : "secondary",
            `data-tab="${id}"`,
          ),
        )
        .join(
          "",
        )}</nav><div class="league-next">${next ? U.button(`Hasta la próxima prueba · ${U.date(next.day, true)}`, "advance-race", "secondary") : U.button("Abrir siguiente temporada", "next-season", "primary")}</div>` +
      content
    );
  };
  const hq = U.hq;
  U.hq = function (s) {
    let html = hq.call(this, s);
    if (C.enabled(s)) {
      const e = G.nextEvent(s);
      html = html
        .replaceAll("Copa Club", e ? C.rule(e).name : "Las ligas")
        .replaceAll("$370", e ? "$" + C.fee(e) : "$220")
        .replaceAll(
          " / 6",
          " / " +
            (e ? s.season.events.filter((x) => x.cup === e.cup).length : 20),
        );
    }
    return html;
  };
  const race = U.race;
  U.race = function (s) {
    let html = race.call(this, s);
    if (!s.race?.competitionVersion) return html;
    html = html.replace("COPA CLUB", C.rules[s.race.cup].name.toUpperCase());
    return (
      `<div class="competition-rule race-regulation ${s.race.cup}">${s.race.cup === "street" ? "LIGA CALLEJERA · Contactos admitidos, muros próximos y daños persistentes. Atacar aumenta el riesgo para ambos coches." : "COPA PROFESIONAL · Las colisiones evitables se sancionan. La clasificación para la final depende de tus puntos."} Boxes con puestos individuales: los equipos trabajan al mismo tiempo.</div>` +
      html
    );
  };
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    if (!s.race?.competitionVersion) return;
    const a = s.race.entrants.find((a) => a.companyId === s.playerId);
    if (!a) return;
    let box = document.getElementById("live-car-parts");
    if (!box) {
      box = document.createElement("div");
      box.id = "live-car-parts";
      box.className = "live-car-parts";
      document.getElementById("live-telemetry")?.append(box);
    }
    box.innerHTML = `<b>Tu configuración está trabajando</b><div><span>Motor configurado <strong>${a.hp.toFixed(1)} CV</strong></span><span>Agarre coche <strong>${G.Performance.grip(a).toFixed(1)}</strong></span><span>Frenos <strong>${Math.round(a.performance.brakeHeat)} °C · ${Math.round(G.Performance.brakeFactor(a) * 100)} %</strong></span></div>${a.performance.parts.map((p) => `<small>${U.escape(G.Parts.definition(p.definitionId).name)} · ${Math.round(a.partWear[p.id])} % de estado</small>`).join("") || "<small>Configuración de serie. Las mejoras instaladas y su desgaste se muestran aquí.</small>"}`;
  };
  const workshop = U.workshop;
  U.workshop = function (s) {
    let html = workshop.call(this, s);
    if (C.enabled(s))
      html += `<section class="panel padded spaced"><h2>La mejora se siente en la pista.</h2><p>Admisión, escape, ECU y sobrealimentación cambian la potencia y la carga térmica. El embrague y el diferencial afectan a aceleración y salida de curvas. Suspensión, frenos y neumáticos cambian apoyo, frenada y desgaste. La aerodinámica aporta apoyo con la velocidad; el aligerado modifica la masa. Un radiador mantiene la temperatura bajo carga. El desgaste y los impactos reducen el trabajo de cada unidad instalada.</p></section>`;
    return html;
  };
})();
