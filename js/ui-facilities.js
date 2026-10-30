"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    F = G.Facilities;
  const count = (n) => Number(n.toFixed(1)).toLocaleString("es-ES");
  const value = (o) =>
    ["equity", "liquidity"].includes(o.key) ? U.money(o.value) : count(o.value);
  const target = (o) =>
    ["equity", "liquidity"].includes(o.key)
      ? U.money(o.required)
      : count(o.required);
  function benefit(s, key, tier) {
    const site = F.site(s),
      cap = F.capacity(site, { ...site.buildings, [key]: tier });
    return {
      garage: `${cap.cars} plazas de vehículos`,
      warehouse: `${cap.spares} repuestos en almacén`,
      office: `${cap.drivers} pilotos · ${2 + (tier - 1) * 2} profesionales`,
      workshop: `${[1, 1, 2, 2, 3][tier - 1]} bahía${tier < 3 ? "" : "s"} · trabajo de 4 días en ${Math.max(1, Math.ceil(4 * [1, 0.75, 0.6, 0.5, 0.4][tier - 1]))} días`,
    }[key];
  }
  function objectives(s, level = null) {
    const items = F.objectives(s, s.playerId, level);
    return items
      .map(
        (o) =>
          `<div class="growth-objective ${o.met ? "met" : ""}"><span class="objective-mark">${o.met ? U.icon("check") : "○"}</span><div><span>${o.label}</span><div class="objective-meter"><i style="width:${G.clamp((o.value / o.required) * 100, 0, 100)}%"></i></div></div><b>${value(o)} <small>/ ${target(o)}</small></b></div>`,
      )
      .join("");
  }
  function project(s) {
    const j = F.site(s).project;
    if (!j)
      return `<div class="project-idle"><span class="eyebrow">TERRENO DISPONIBLE</span><h3>Elige dónde crecer.</h3><p>Consulta el efecto y el coste de cada ampliación. Solo una obra simultánea; los edificios actuales siguen funcionando.</p></div>`;
    const progress = G.clamp((s.day - j.start) / (j.end - j.start), 0, 1);
    return `<div class="project-live"><span class="eyebrow">OBRA EN CURSO · ${j.end - s.day} DÍAS RESTANTES</span><h3>${F.definitions[j.key].name} <span>→ nivel ${j.to}</span></h3><div class="construction-meter" role="progressbar" aria-label="Avance de construcción" aria-valuenow="${Math.round(progress * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress * 100}%"></i></div><div class="project-dates"><span>Inicio ${U.date(j.start, true)}</span><b>Entrega ${U.date(j.end, true)}</b></div><p>${benefit(s, j.key, j.to)} al finalizar. Ya abonado: ${U.money(j.cost)}.</p>${U.button("Cancelar obra", "construction-cancel", "text-button negative", s.status === "active" ? "" : "disabled")}<small class="fine-print">Devolución hoy: ${U.money(F.refund(s))}. El 50 % de movilización y el trabajo ejecutado no se recuperan.</small></div>`;
  }
  U.facilities = function (s) {
    const c = G.player(s),
      site = F.site(s),
      goals = F.objectives(s),
      met = goals.filter((o) => o.met).length;
    return (
      this.heading(
        "DESARROLLO DE LA COMPAÑÍA",
        "Dale espacio a tu ambición.",
        "Una sola sede. Cada ampliación necesita inversión y tiempo; su capacidad se activa al terminar.",
        this.badge("NIVEL " + c.level + " / 10", "outline"),
      ) +
      `<div class="estate-overview"><section class="estate-map panel"><div class="panel-heading"><div><span class="eyebrow">SEVILLA · SEDE ÚNICA</span><h2>${this.escape(c.name)}</h2></div>${this.badge(site.project ? "EN CONSTRUCCIÓN" : "EN ACTIVIDAD", site.project ? "outline" : "green")}</div>${G.Render.headquarters(s)}<div class="estate-map-note">Los edificios reflejan su nivel construido. Selecciónalos para abrir su departamento.</div></section><aside class="panel padded estate-project">${project(s)}<div class="estate-costs"><span>Conservación de ampliaciones<b>${this.money(F.upkeep(s))} / día</b></span><span>Operación total de la sede<b>${this.money(18 + F.upkeep(s))} / día</b></span><span>Patrimonio estimado<b>${this.money(F.equity(s, c.id))}</b></span></div><p class="fine-print">Los gastos diarios comienzan en la entrega y se incluyen en la previsión mensual de Finanzas.</p></aside></div>` +
      `<div class="section-title spaced"><div><span class="eyebrow">INSTALACIONES OPERATIVAS</span><h2>Invierte donde hace falta.</h2></div><span class="muted">Una obra a la vez</span></div><div class="facility-grid">${Object.entries(
        F.definitions,
      )
        .map(([key, d]) => {
          const tier = site.buildings[key],
            q = F.quote(s, key),
            cap = tier >= 5;
          return `<article class="panel facility-card" data-facility="${key}"><div class="facility-card-top"><span class="facility-emblem">${this.icon(key === "garage" ? "garage" : key === "workshop" ? "tool" : key === "office" ? "team" : "market")}</span><span class="eyebrow">INSTALACIÓN ${String(Object.keys(F.definitions).indexOf(key) + 1).padStart(2, "0")}</span><b>N${tier}</b></div><h3>${d.name}</h3><p class="facility-benefit">${benefit(s, key, tier)}</p><div class="facility-levels" aria-label="Nivel ${tier} de 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= tier ? "built" : ""}"></i>`).join("")}</div>${cap ? '<p class="facility-next">Desarrollo máximo de esta instalación.</p>' : `<div class="facility-next"><small>SIGUIENTE AMPLIACIÓN · NIVEL ${q.to}</small><strong>${benefit(s, key, q.to)}</strong><span>+${this.money(q.upkeep)}/día de conservación</span></div><div class="facility-price"><b>${this.money(q.cost)}</b><span>${q.days} días · empresa nivel ${q.requiredLevel}</span></div>`}<p class="facility-availability ${q.accepted ? "positive" : "muted"}">${q.accepted ? "Puedes iniciar esta ampliación." : this.escape(q.reason)}</p>${!cap ? this.button("Estudiar ampliación", "construction-preview", "secondary wide", `data-key="${key}" ${q.accepted ? "" : "disabled"}`) : ""}</article>`;
        })
        .join("")}</div>` +
      `<section class="panel padded growth-panel spaced"><div class="section-title"><div><span class="eyebrow">TRAYECTORIA EMPRESARIAL</span><h2>${c.level < 10 ? `El camino al nivel ${c.level + 1}` : "Leyenda del automovilismo"}</h2><p>${c.level < 10 ? G.Data.levels[c.level] : "Has alcanzado el nivel máximo. La partida continúa."}</p></div>${this.badge(c.level < 10 ? `${met} / ${goals.length} OBJETIVOS` : "NIVEL 10", "outline")}</div><div class="growth-objectives">${objectives(s)}</div><p class="fine-print">Todos los ascensos requieren al menos un mes de caja para afrontar la operación. Ascenso automático al avanzar una jornada si cumples todos los objetivos y han pasado 90 días desde el último cambio de nivel. La trayectoria se cuenta desde 2026 para las compañías iniciales.</p>${c.level > 1 ? `<div class="growth-crisis ${site.crisisDays ? "negative" : "muted"}">Crisis prolongada: ${site.crisisDays}/90 días. Solo cuenta con menos de un mes de liquidez y reputación inferior a la mitad de la exigida por tu nivel. Un descenso conserva edificios, capacidad y activos.</div>` : ""}<details class="growth-path"><summary>Consultar los diez niveles y sus requisitos</summary>${F.ranks
        .map(
          (rule, i) =>
            `<div class="growth-path-row"><b>${String(i + 1).padStart(2, "0")}</b><div><strong>${G.Data.levels[i]}</strong><p>${
              i
                ? Object.entries(rule)
                    .map(
                      ([k, n]) =>
                        ({
                          days: `${n} días de trayectoria`,
                          starts: `${n} carreras`,
                          wins: `${n} victorias`,
                          podiums: `${n} podios`,
                          reputation: `${n} reputación`,
                          equity: `${this.money(n)} de patrimonio`,
                          built: `${n} ampliaciones`,
                        })[k],
                    )
                    .join(" · ")
                : "Tu punto de partida"
            }</p></div><span>${c.level === i + 1 ? "ACTUAL" : site.highestLevel >= i + 1 ? "ALCANZADO" : ""}</span></div>`,
        )
        .join("")}</details></section>` +
      `<section class="panel padded spaced"><div class="section-title"><h2>Diario de desarrollo</h2><span class="muted">Últimos movimientos</span></div>${
        site.history
          .slice(0, 12)
          .map(
            (h) =>
              `<div class="timeline-line"><small>${this.date(h.day, true)}</small><span>${{ start: "Obra iniciada", complete: "Ampliación entregada", cancel: "Obra cancelada", promotion: "Ascenso empresarial", relegation: "Descenso empresarial" }[h.type]}<br><small class="muted">${h.key ? F.definitions[h.key].name + " · nivel " : "Nivel empresarial "}${h.tier}</small></span><b>${h.amount ? this.money(h.amount) : this.icon("check")}</b></div>`,
          )
          .join("") ||
        '<p class="muted">Aquí quedarán registradas tus obras y cambios de nivel.</p>'
      }</section>`
    );
  };
  const hq = U.hq;
  U.hq = function (s) {
    const c = G.player(s),
      site = F.site(s),
      goals = F.objectives(s),
      j = site.project;
    const banner = `<section class="estate-hq-banner"><div><span class="eyebrow">DESARROLLO EMPRESARIAL · NIVEL ${c.level}</span><strong>${j ? F.definitions[j.key].name + " en obras · entrega " + this.date(j.end, true) : c.level < 10 ? `${goals.filter((o) => o.met).length}/${goals.length} objetivos para el siguiente nivel` : "Tu compañía es una leyenda"}</strong><small>${j ? "La capacidad actual sigue disponible durante las obras." : "Amplía tu sede y construye una trayectoria duradera."}</small></div><button class="secondary" data-go="facilities">Instalaciones y progreso ${this.icon("arrow")}</button></section>`;
    return hq
      .call(this, s)
      .replace(
        '<div class="preparation-steps"',
        banner + '<div class="preparation-steps"',
      )
      .replace(
        "Garaje alquilado · herramientas básicas",
        `Garaje N${site.buildings.garage} · taller N${site.buildings.workshop} · ${F.bays(s)} bahía${F.bays(s) === 1 ? "" : "s"}`,
      );
  };
  const companyBody = U.companyBody;
  U.companyBody = function (s, c) {
    const site = F.site(s, c.id);
    return (
      companyBody.call(this, s, c) +
      `<section class="onboarding-note"><strong>Desarrollo empresarial · nivel ${c.level}</strong>${Object.entries(
        site.buildings,
      )
        .map(([key, n]) => `${F.definitions[key].name} N${n}`)
        .join(
          " · ",
        )}<br>Conservación: ${this.money(F.upkeep(s, c.id))}/día. ${site.project ? `Obra: ${F.definitions[site.project.key].name} N${site.project.to}, entrega ${this.date(site.project.end, true)}.` : "Sin obras en curso."}</section>`
    );
  };
  U.history = function (s) {
    return (
      this.heading(
        "ARCHIVO",
        "Tu legado en el automovilismo.",
        "Campeonatos, pilotos y resultados conservados al cambiar de temporada.",
      ) +
      `<div class="history-grid">${
        s.history
          .map((h) => {
            const full = s.expansion.archive.find((a) => a.year === h.year);
            return `<article class="panel padded season-history"><span class="eyebrow gold">TEMPORADA ${h.year}</span><h2>${this.escape(h.champion)}</h2>${
              h.cups
                ? `<p>Campeones de las finales</p>${Object.entries(h.cups)
                    .map(
                      ([key, name]) =>
                        `<p><b>${G.Competition.rules[key].name}</b> · ${this.escape(name)}</p>`,
                    )
                    .join("")}`
                : "<p>Campeón de equipos · Copa Club</p>"
            }${full?.drivers.length && !h.cups ? `<p><b>${this.escape(full.drivers[0].name)}</b><br>Campeón de pilotos · ${full.drivers[0].points} puntos</p>` : ""}<div class="history-player">${h.logo ? `<img class="company-logo" src="${h.logo}" alt="Logotipo histórico">` : this.logo(s)}<div><strong>${h.playerPosition}º · ${h.playerPoints} puntos${h.cups ? " en la Copa Nacional" : ""}</strong><small>${this.escape(G.player(s).name)} · Prima ${this.money(h.bonus)}</small></div></div>${h.cups ? "<h3>Copa Nacional · equipos</h3>" : ""}${h.standings.map((row, i) => `<div class="timeline-line"><small>${String(i + 1).padStart(2, "0")}</small><span>${this.escape(row.name)}</span><b>${row.points}</b></div>`).join("")}${full ? this.button("Consultar pilotos y carreras", "archive-season", "secondary wide", `data-year="${h.year}"`) : '<p class="fine-print">Resumen de una versión anterior. Los resultados detallados que no fueron guardados no se pueden reconstruir.</p>'}</article>`;
          })
          .join("") ||
        `<section class="panel empty-state"><span class="empty-number">2026</span><h2>La historia está en tus manos.</h2><p>Completa tu primera temporada para conservar sus campeones, clasificaciones y ${s.competitions ? "veinte pruebas en tres ligas" : "seis carreras"}.</p><button class="secondary" data-go="competition">Ver las competiciones →</button></section>`
      }</div>`
    );
  };
  G.FacilitiesUI = {
    action(A, name, data) {
      const s = A.state;
      if (name === "construction-preview") {
        const q = F.quote(s, data.key);
        G.assert(q.accepted, q.reason);
        A.confirm(
          `Ampliar ${F.definitions[q.key].name.toLowerCase()} a nivel ${q.to}`,
          `${U.money(q.cost)} ahora. Entrega el ${U.date(q.end)} (${q.days} días). Capacidad al terminar: ${benefit(s, q.key, q.to)}. Conservación adicional: ${U.money(q.upkeep)}/día. Hasta la entrega conservas la instalación actual. Si cancelas, se devuelve como máximo el 50 %, disminuyendo con el trabajo ejecutado.`,
          () => {
            A.mutate(() => F.start(s, q.key), "facilities");
            U.toast("Obra contratada. Puedes seguir usando tu sede.");
          },
        );
        return true;
      }
      if (name === "construction-cancel") {
        G.assert(F.site(s).project, "No hay una obra en curso.");
        A.confirm(
          "Cancelar ampliación",
          `Recuperarás ${U.money(F.refund(s))}. La movilización y los trabajos ya ejecutados no se devuelven. La capacidad actual se conserva.`,
          () => {
            A.mutate(() => F.cancel(s), "facilities");
            U.toast("Obra cancelada y devolución registrada.");
          },
        );
        return true;
      }
      if (name === "archive-season") {
        const h = s.expansion.archive.find((h) => h.year === Number(data.year));
        G.assert(h, "Temporada no disponible.");
        U.modal(
          `Archivo de la temporada ${h.year}`,
          `<section class="archive-detail"><span class="eyebrow">${U.escape(h.name)}</span>${h.events.some((e) => G.Competition.rules[e.cup]) ? G.CompetitionUI.driverTables(h.events) : `<h3>Clasificación de pilotos</h3><div class="archive-scroll"><table><thead><tr><th>POS</th><th>PILOTO</th><th>SAL.</th><th>VIC.</th><th>PTS</th></tr></thead><tbody>${h.drivers.map((d, i) => `<tr><td>${i + 1}</td><td>${U.escape(d.name)}</td><td>${d.starts}</td><td>${d.wins}</td><td>${d.points}</td></tr>`).join("")}</tbody></table></div>`}<h3>Resultados por ronda</h3>${h.events.map((e) => `<details class="archive-race"><summary>${e.cup ? U.escape(G.Competition.rules[e.cup].name) + " · " : ""}${e.final ? "FINAL" : "R" + e.round} · ${U.escape(e.trackName)} <span>${U.date(e.day, true)} · ${e.results.length} participantes</span></summary><div class="archive-scroll"><table><thead><tr><th>POS</th><th>PILOTO / EQUIPO</th><th>VEHÍCULO</th><th>TIEMPO</th><th>PTS</th></tr></thead><tbody>${e.results.map((r) => `<tr class="${r.companyId === s.playerId ? "player-row" : ""}"><td>${r.position}</td><td><b>${U.escape(r.name)}</b><br><small>${U.escape(r.team)}</small></td><td>${U.escape(r.carLabel)}</td><td>${r.dnf ? "Abandono" : r.time === null ? "—" : r.time.toFixed(2) + " s"}</td><td>${r.points}</td></tr>`).join("")}</tbody></table></div></details>`).join("")}<p class="fine-print">Estos registros son instantáneas históricas. Consultarlos no vuelve a simular carreras ni modifica puntos, contratos o premios.</p></section>`,
          true,
        );
        return true;
      }
      return false;
    },
  };
})();
