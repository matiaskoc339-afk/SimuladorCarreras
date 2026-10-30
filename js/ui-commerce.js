"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    C = G.Commerce;
  const esc = U.escape.bind(U);
  const UI = (G.CommerceUI = {
    weekly(s, kind) {
      if (!C.enabled(s)) return "";
      const cv = kind === "cv",
        p = G.player(s);
      return `<section class="weekly-banner ${cv ? "cv-banner" : ""}"><div><span class="eyebrow">${cv ? "CONVOCATORIA DE PILOTOS" : "SUMINISTRO DEL TALLER"} · SEMANA ${s.commerce.week + 1}</span><h2>${cv ? "Nuevos rostros para tu siguiente etapa." : "64 novedades, cada siete días."}</h2><p>${cv ? `Tu nivel ${p.level} y reputación ${p.reputation.toFixed(1)} atraen mejores candidatos. Un ojeador aporta informes y descubrimientos extra según su nivel; su precisión nunca es una garantía. Siempre quedan opciones de iniciación con sueldos modestos.` : "Cuatro series nuevas por alojamiento: potencia, durabilidad, ligereza o apoyo. Compara sus contrapartidas. Los recambios básicos se mantienen y reponen; tus piezas y montajes se conservan."}</p></div><div class="weekly-date"><small>PRÓXIMA RENOVACIÓN</small><b>${U.date(C.next(s), true)}</b><span>En ${C.next(s) - s.day} día${C.next(s) - s.day === 1 ? "" : "s"}${cv ? " · los CV libres caducan" : " · stock limitado"}</span></div></section>`;
    },
    trophyArt(position) {
      return `<svg viewBox="0 0 240 210" class="trophy-art place-${position}" role="img" aria-label="Trofeo de ${["oro", "plata", "bronce"][position - 1]}"><ellipse cx="120" cy="193" rx="75" ry="10" fill="#000" opacity=".2"/><g fill="none" stroke="currentColor" stroke-width="8"><path d="M75 38H40V63Q40 102 88 105M165 38H200V63Q200 102 152 105"/></g><path d="M71 25H169L160 85Q157 119 120 127Q83 119 80 85Z" fill="currentColor"/><path d="M82 36H99L106 98Q89 88 87 69Z" fill="#fff" opacity=".28"/><path d="M112 124H128V157L151 167H89L112 157Z" fill="currentColor"/><path d="M82 165H158L168 186H72Z" fill="#30423f" stroke="currentColor" stroke-width="2"/><text x="120" y="82" text-anchor="middle" font-size="38" font-family="sans-serif" font-weight="800" fill="#23302e">${position}</text><path d="M62 183H178" stroke="currentColor" stroke-width="4"/></svg>`;
    },
    result(s, e) {
      const t = s.trophyRoom?.awards.find(
        (t) => t.eventId === e.id && t.companyId === s.playerId,
      );
      return t
        ? `<div class="trophy-result">${this.trophyArt(t.position)}<div><b>Trofeo de ${["oro", "plata", "bronce"][t.position - 1]} · ${G.Competition.rules[t.cup].name}</b><p>Prestigio +${t.reputationGain.toFixed(1)}. Tu gran final ya está en la vitrina.</p><button class="secondary" data-go="trophies">Ver mi trofeo →</button></div></div>`
        : "";
    },
    action(A, name, data) {
      if (name === "commerce-market") {
        G.assert(["used", "new"].includes(data.tab), "Mercado desconocido.");
        A.marketTab = data.tab;
        A.go("market");
        return true;
      }
      return false;
    },
  });
  const team = U.team;
  U.team = function (s) {
    const html = team.call(this, s);
    return html.replace(
      '<div class="section-title spaced"><h2>Candidatos disponibles',
      UI.weekly(s, "cv") +
        '<div class="section-title spaced"><h2>Candidatos disponibles',
    );
  };
  const workshop = U.workshop;
  U.workshop = function (s) {
    return UI.weekly(s, "parts") + workshop.call(this, s);
  };
  const competition = U.competition;
  U.competition = function (s) {
    return (
      competition.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><div><span class="eyebrow gold">GRANDES FINALES</span><h2>Las copas se ganan durante la temporada.</h2><p>Solo el podio de la final regional o nacional entrega trofeo. Necesitas licencia, puntos de clasificación, coche y piloto aptos, y pagar sus tasas. Una ronda normal o la liga callejera no conceden copas de esta vitrina.</p><p>Regional: oro +6, plata +4, bronce +2 de reputación. Nacional: +12, +8 y +5. La reputación tiene un máximo de 100.</p></div><button class="secondary" data-go="trophies">Vitrina de trofeos →</button></div></section>`
    );
  };
  const history = U.history;
  U.history = function (s) {
    return (
      history.call(this, s) +
      `<section class="panel padded spaced"><h2>Tu colección de grandes copas</h2><p>Los trofeos y sus pilotos permanecen al abrir otra temporada.</p><button class="secondary" data-go="trophies">Abrir vitrina →</button></section>`
    );
  };
  U.trophies = function (s) {
    const awards = (s.trophyRoom?.awards || [])
        .filter((t) => t.companyId === s.playerId)
        .sort(
          (a, b) => b.year - a.year || b.day - a.day || a.position - b.position,
        ),
      counts = [1, 2, 3].map(
        (n) => awards.filter((t) => t.position === n).length,
      );
    return (
      U.heading(
        "PALMARÉS",
        "Tu vitrina de trofeos.",
        "Grandes finales, temporadas y pilotos que hicieron historia.",
        '<button class="secondary" data-go="competition">Ver competiciones →</button>',
      ) +
      `<div class="overview-strip trophy-summary">${U.stat("ORO", counts[0], "1.er puesto de gran final")}${U.stat("PLATA", counts[1], "2.º puesto de gran final")}${U.stat("BRONCE", counts[2], "3.er puesto de gran final")}${U.stat("PRESTIGIO OBTENIDO", "+" + awards.reduce((n, t) => n + t.reputationGain, 0).toFixed(1), "Bonificaciones ya aplicadas")}</div>` +
      (awards.length
        ? `<div class="trophy-shelf">${awards.map((t) => `<article class="trophy-card place-${t.position}"><span class="eyebrow">TEMPORADA ${t.year} · GRAN FINAL</span>${UI.trophyArt(t.position)}<h2>${G.Competition.rules[t.cup].name}</h2><strong>${["Campeón · Oro", "Subcampeón · Plata", "Tercer puesto · Bronce"][t.position - 1]}</strong><p>${esc(t.driverName)}<br><span>${esc(G.Data.tracks[t.track].name)} · ${U.date(t.day, true)}</span></p><div class="trophy-engraving">${esc(G.player(s).name)}<b>Reputación +${t.reputationGain.toFixed(1)}</b></div></article>`).join("")}</div>`
        : `<section class="trophy-empty panel"><div class="trophy-ghost">${UI.trophyArt(1)}</div><div><span class="eyebrow gold">EL PRIMER HUECO TE ESPERA</span><h2>Una carrera da puntos. Una gran final da una copa.</h2><p>Termina entre los tres primeros de la final regional o nacional. El trofeo conservará la temporada, el piloto y el circuito; el prestigio mejora las oportunidades de tu empresa.</p><button class="primary" data-go="competition">Seguir el camino a la final →</button></div></section>`) +
      `<section class="panel padded spaced trophy-requirements"><span class="eyebrow">CÓMO CONSEGUIRLAS</span><div><article><h3>Copa Regional Profesional</h3><p>Licencia profesional (24 puntos callejeros y $900), piloto de valoración 22, verificación técnica y 18 puntos regionales para entrar a la final.</p><strong>Trofeos: +6 / +4 / +2 de reputación</strong></article><article><h3>Copa Nacional</h3><p>Licencia, 12 puntos regionales de trayectoria, piloto de valoración 24 y verificación superior. Acumula 18 puntos nacionales de clasificación para su final.</p><strong>Trofeos: +12 / +8 / +5 de reputación</strong></article></div><p class="fine-print">Las tasas, neumáticos y daños se pagan aparte. No se otorgan trofeos por abandonos, carreras normales ni finales callejeras. Cada premio se aplica una sola vez; los anteriores a la activación de esta versión quedan en el archivo histórico.</p></section>`
    );
  };
})();
