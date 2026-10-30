"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    W = G.WorldCircuits,
    C = G.Competition,
    esc = U.escape.bind(U);
  const clean = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const UI = (G.WorldCircuitUI = {
    location(t) {
      return `<span class="venue-country"><b>${esc(t.country || "ES")}</b>${esc(W.location(t))}</span>`;
    },
    notice(s) {
      if (!G.Research.enabled(s)) return "";
      const countries = new Set(
        s.season.events.map((e) => G.Data.tracks[e.track].country),
      );
      return `<section class="tour-overview"><div><span class="eyebrow">CALENDARIO ${s.season.year} · ${countries.size} ${countries.size === 1 ? "PAÍS" : "PAÍSES"}</span><h2>${s.season.tourVersion ? "Una temporada, veinte sedes distintas." : "El mundo se amplía en tu siguiente temporada."}</h2><p>${s.season.tourVersion ? "Las veinte pistas cambian al abrir el siguiente año, incluidas las finales. Cada copa conserva su categoría, sus fechas y los requisitos para clasificar." : "Puedes explorar las nuevas sedes por país. Tu calendario actual y sus inscripciones se conservan; la nueva selección se estrena al abrir la próxima temporada."}</p></div><div class="tour-numbers"><span><b>${G.Circuits.indices().length}</b>pistas</span><span><b>${Object.keys(W.countries).length}</b>países</span><span><b>20</b>fechas al año</span></div></section>`;
    },
    atlas(s) {
      const country = G.App.circuitCountry || "all",
        category = G.App.circuitCategory || "all",
        difficulty = G.App.circuitDifficulty || "Todas",
        scope = G.App.circuitScope || "all",
        query = clean(G.App.circuitSearch || ""),
        current = new Set(s.season.events.map((e) => e.track)),
        indices = G.Circuits.indices().filter((i) => {
          const t = G.Data.tracks[i];
          return (
            (country === "all" || country === t.country) &&
            (category === "all" || t.cups.includes(category)) &&
            (difficulty === "Todas" || t.difficulty === difficulty) &&
            (scope !== "current" || current.has(i)) &&
            (scope !== "new" || t.international) &&
            (!query ||
              clean(`${t.name} ${t.city} ${t.countryName}`).includes(query))
          );
        }),
        groups = Object.entries(W.countries)
          .filter(([code]) =>
            indices.some((i) => G.Data.tracks[i].country === code),
          )
          .sort((a, b) => a[1].localeCompare(b[1], "es"));
      const filter = (label, field, value, selected) =>
        U.button(
          label,
          field === "scope" ? "world-track-filter" : "track-filter",
          selected ? "primary" : "secondary",
          `data-field="${field}" data-value="${value}" aria-pressed="${selected}"`,
        );
      return `<section class="world-atlas"><div class="atlas-tools panel"><div class="atlas-primary-filters"><label><span>País</span><select id="atlas-country"><option value="all">Todos los países</option>${Object.entries(
        W.countries,
      )
        .filter(([code]) => W.indices(code).length)
        .sort((a, b) => a[1].localeCompare(b[1], "es"))
        .map(
          ([code, name]) =>
            `<option value="${code}" ${country === code ? "selected" : ""}>${esc(name)} · ${W.indices(code).length} pistas</option>`,
        )
        .join(
          "",
        )}</select></label><label><span>Buscar pista o ciudad</span><input type="search" id="atlas-search" value="${esc(G.App.circuitSearch || "")}" placeholder="Ej. Lima, Minato o bosque"></label></div><div class="circuit-filters"><div>${[
        ["all", "Todas las categorías"],
        ["street", "Callejeras"],
        ["pro", "Copa regional"],
        ["national", "Copa nacional"],
      ]
        .map(([value, label]) =>
          filter(label, "category", value, category === value),
        )
        .join(
          "",
        )}</div><div>${["Todas", "Fácil", "Intermedia", "Difícil", "Experta"].map((value) => filter(value, "difficulty", value, difficulty === value)).join("")}</div></div><div class="atlas-scopes">${[
        ["all", "Todo el atlas"],
        ["current", "Esta temporada"],
        ["new", "36 pistas nuevas"],
      ]
        .map(([value, label]) => filter(label, "scope", value, scope === value))
        .join(
          "",
        )}${U.button("Restablecer filtros", "world-track-reset", "text-button")}</div><p class="atlas-count" aria-live="polite">${indices.length} ${indices.length === 1 ? "pista" : "pistas"} · ${groups.length} ${groups.length === 1 ? "país" : "países"}${scope === "current" ? ` · calendario ${s.season.year}` : ""}</p></div><div class="circuit-atlas country-atlas">${groups
        .map(([code, name]) => {
          const list = indices.filter((i) => G.Data.tracks[i].country === code);
          return `<section class="country-circuits" data-country="${code}"><header><div class="country-monogram">${code}</div><div><span class="eyebrow">PAÍS · ${list.length} ${list.length === 1 ? "PISTA" : "PISTAS"}</span><h2>${esc(name)}</h2></div></header><div class="country-track-grid">${list
            .map((i) => {
              const t = G.Data.tracks[i],
                scheduled = s.season.events.filter((e) => e.track === i);
              return `<article class="panel circuit-card" data-track="${i}"><div class="atlas-map">${G.CompetitionUI.map(i)}<span>${t.international ? "NUEVA SEDE" : "SEDE ESTABLECIDA"}</span></div><div><span class="eyebrow">${esc(t.city)} · ${(t.length / 1000).toFixed(2)} KM</span><h3>${esc(t.name)}</h3><p>${esc(t.inspiration)}.</p><div class="track-tags"><span class="difficulty-${clean(t.difficulty)}">${t.difficulty}</span><span>${t.kind === "street" ? "Callejero" : "Profesional"}</span><span>${t.vertices.length} curvas</span></div><p class="fine-print">${t.cups.map((key) => C.rules[key].name).join(" / ")} · ${t.laps} vueltas${scheduled.length ? `<br><b class="tour-scheduled">${scheduled.map((e) => (e.final ? "Final" : "Ronda " + e.round) + " · " + U.date(e.day, true)).join(" / ")}</b>` : ""}</p>${U.button("Ver trazado y boxes", "track-view", "secondary", `data-track="${i}"`)}</div></article>`;
            })
            .join("")}</div></section>`;
        })
        .join(
          "",
        )}</div>${!indices.length ? `<section class="panel atlas-empty"><h2>No hay pistas con estos filtros.</h2><p>Prueba otro país, categoría o dificultad.</p>${U.button("Mostrar todo el atlas", "world-track-reset", "primary")}</section>` : ""}<p class="fine-print">Sedes ficticias situadas en países reales. Los trazados son diseños originales. Las pistas actuales no se borran: cambia su selección en el calendario de cada año.</p></section>`;
    },
    refresh(A, focus) {
      const y = window.scrollY;
      A.render();
      window.scrollTo(0, y);
      if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
    },
  });
  const action = G.CompetitionUI.action;
  G.CompetitionUI.action = function (A, name, data) {
    if (name === "world-track-filter" || name === "track-filter") {
      const options = {
        category: ["all", "street", "pro", "national"],
        difficulty: ["Todas", "Fácil", "Intermedia", "Difícil", "Experta"],
        scope: ["all", "current", "new"],
      };
      G.assert(
        options[data.field]?.includes(data.value),
        "Filtro de pistas inválido.",
      );
      A[
        {
          category: "circuitCategory",
          difficulty: "circuitDifficulty",
          scope: "circuitScope",
        }[data.field]
      ] = data.value;
      UI.refresh(
        A,
        `[data-action="${name}"][data-field="${data.field}"][data-value="${data.value}"]`,
      );
      return true;
    }
    if (name === "world-track-reset") {
      A.circuitCountry = "all";
      A.circuitCategory = "all";
      A.circuitDifficulty = "Todas";
      A.circuitScope = "all";
      A.circuitSearch = "";
      UI.refresh(A, "#atlas-country");
      return true;
    }
    return action.call(this, A, name, data);
  };
  document.addEventListener("change", (event) => {
    if (event.target.id !== "atlas-country") return;
    const code = event.target.value;
    if (code !== "all" && !W.countries[code]) return;
    G.App.circuitCountry = code;
    UI.refresh(G.App, "#atlas-country");
  });
  document.addEventListener("input", (event) => {
    if (event.target.id !== "atlas-search") return;
    G.App.circuitSearch = event.target.value;
    const start = event.target.selectionStart,
      end = event.target.selectionEnd;
    UI.refresh(G.App, "#atlas-search");
    document.getElementById("atlas-search")?.setSelectionRange(start, end);
  });
  const race = U.race;
  U.race = function (s) {
    const html = race.call(this, s),
      t = G.Data.tracks[s.race.track];
    return t.modern
      ? `<div class="race-location">${UI.location(t)}<span>${s.race.cup ? C.rules[s.race.cup].name : "Competición"} · Temporada ${s.season.year}</span></div>` +
          html
      : html;
  };
})();
