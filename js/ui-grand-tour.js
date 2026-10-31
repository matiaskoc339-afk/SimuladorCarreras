"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    T = G.GrandTour,
    C = G.GrandContent,
    esc = U.escape.bind(U);
  const filters = {
    all: "Toda la gama",
    road: "Calle, rally y lujo",
    supercar: "Súper e hiperdeportivos",
    gt: "GT de competición",
    prototype: "Prototipos",
    formula: "Monoplazas",
  };
  const UI = (G.GrandTourUI = {
    divisions(s) {
      const reason = T.divisionReason(s),
        selected = s.grandTour.division;
      return `<details class="grand-divisions panel padded" ${G.App.competitionTab === "national" ? "open" : ""}><summary>Nacional · ${esc(T.divisions[selected].name)} · elegir categoría</summary><p>Una categoría nacional para toda la temporada. Comparte el marcador Nacional y su final; se fija al inscribirse o disputarse la primera prueba. Podrás cambiarla en el siguiente año. La licencia y los 12 puntos regionales siguen siendo necesarios.</p><div class="grand-division-grid">${Object.entries(
        T.divisions,
      )
        .map(
          ([key, r]) =>
            `<article class="${selected === key ? "selected" : ""}" data-grand-division="${key}"><span class="eyebrow">${key === "gt" ? "GT Y TURISMOS PREPARADOS" : key === "prototype" ? "RESISTENCIA Y ALTA TECNOLOGÍA" : "MONOPLAZAS · ÉLITE"}</span><h3>${esc(r.name)}</h3><b class="grand-prize">${U.money(r.prizes[0])}</b><small>Premio al ganador por ronda · doble en la final</small><dl><div><dt>Tasas y transporte</dt><dd>${U.money(r.fee + r.transport)}</dd></div><div><dt>Final</dt><dd>${U.money((r.fee + r.transport) * 1.5)}</dd></div><div><dt>Potencia admitida</dt><dd>${r.minHP}–${r.maxHP} CV</dd></div><div><dt>Piloto mínimo</dt><dd>Valoración ${r.rating}</dd></div><div><dt>Estado del coche</dt><dd>${r.health} % · frenos ${r.brakes} %</dd></div></dl>${U.button(selected === key ? "Categoría seleccionada" : "Elegir esta categoría", "grand-division", selected === key ? "secondary" : "primary", `data-key="${key}" ${U.blocked(selected === key ? "Ya está seleccionada." : reason)}`)}</article>`,
        )
        .join(
          "",
        )}</div>${reason ? `<p class="grand-lock">${esc(reason)}</p>` : ""}</details>`;
    },
    action(A, name, data) {
      if (name === "grand-filter") {
        G.assert(Object.hasOwn(filters, data.key), "Filtro desconocido.");
        A.grandFilter = data.key;
        A.render();
        return true;
      }
      if (name === "grand-division") {
        A.competitionTab = "national";
        A.mutate(() => T.choose(A.state, data.key), "competition");
        return true;
      }
      return false;
    },
  });
  const market = U.market;
  U.market = function (s, ...args) {
    if (!T.enabled(s)) return market.call(this, s, ...args);
    const selected = G.App.grandFilter || "all",
      fresh = G.App.marketTab === "new",
      accept = (car) =>
        selected === "all" ||
        (selected === "road"
          ? ["city", "rally", "sport", "muscle", "grandtourer"]
          : selected === "supercar"
            ? ["supercar", "hypercar"]
            : [selected]
        ).includes(C.family(car)),
      shown = fresh
        ? {
            ...s,
            market: s.market.filter(
              (l) =>
                l.kind !== "new" ||
                accept(s.cars.find((c) => c.id === l.carId)),
            ),
          }
        : s;
    let html = market.call(this, shown, ...args);
    if (fresh)
      html = html
        .replace(
          "Modelos deportivos de 2026,",
          "Gamas deportivas 2026 y Gran Serie 2027,",
        )
        .replace(`Desde ${U.money(28000)}`, `Desde ${U.money(14000)}`);
    const intro = `<section class="grand-market"><div><span class="eyebrow">60 MODELOS NUEVOS · 148 EN EL MUNDO</span><h2>Del primer deportivo al monoplaza.</h2><p>Diez familias, plataformas propias y 192 piezas nuevas. Los monoplazas parten de ${U.money(650000)} y llegan al híbrido de 1050 CV. Compra, preparación, piloto y mantenimiento forman parte del presupuesto.</p></div>${fresh ? "" : U.button("Ver autos nuevos", "commerce-market", "primary", 'data-tab="new"')}</section>${
      fresh
        ? `<nav class="grand-filters" aria-label="Familias de vehículos">${Object.entries(
            filters,
          )
            .map(([key, label]) =>
              U.button(
                label,
                "grand-filter",
                selected === key ? "primary" : "secondary",
                `data-key="${key}" aria-pressed="${selected === key}"`,
              ),
            )
            .join("")}</nav>`
        : ""
    }`;
    return intro + html;
  };
  const competition = U.competition;
  U.competition = function (s, ...args) {
    return (
      (T.enabled(s) ? UI.divisions(s) : "") + competition.call(this, s, ...args)
    );
  };
  const workshop = U.workshop;
  U.workshop = function (s, ...args) {
    return (
      (T.enabled(s)
        ? '<section class="grand-workshop-note"><b>Gran Serie · 192 referencias nuevas</b><p>Club avanzado, GT Motorsport, Endurance P y Fórmula GP. Hay tres enfoques por alojamiento: Resistencia, Equilibrio y Ataque. La compatibilidad y las prestaciones se comprueban sobre tu plataforma; las piezas vuelven a reponerse cada semana.</p></section>'
        : "") + workshop.call(this, s, ...args)
    );
  };
})();
