"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    N = G.DriverWorld,
    B = G.DriverAbilities,
    esc = U.escape.bind(U);
  const UI = (G.DriverWorldUI = {
    abilities(s, d, compact = false) {
      if (!N.enabled(s)) return "";
      const list = B.list(s, d);
      return compact
        ? `<div class="ability-badges">${list.map((x) => `<span title="${esc(x.description)}">${esc(x.name)}</span>`).join("")}</div>`
        : `<section class="driver-abilities"><span class="eyebrow">SUS HABILIDADES</span><h3>Su manera de competir y aprender.</h3><p>Son ventajas situacionales, no puntos permanentes. Se combinan con sus atributos, las órdenes y el coche.</p>${list.map((x) => `<article><b>${esc(x.name)}</b><p>${esc(x.description)}</p></article>`).join("")}</section>`;
    },
    guide() {
      return `<details class="ability-encyclopedia panel padded"><summary>Conocer las ${B.catalog.length} habilidades de los pilotos</summary><p>Cada piloto tiene entre una y tres. Los efectos de carrera modifican atributos efectivos; no aumentan la potencia del coche ni reparan neumáticos. Los CV nuevos pueden traer otras combinaciones.</p><div class="ability-index">${B.catalog.map((x) => `<article><b>${esc(x.name)}</b><p>${esc(x.description)}</p></article>`).join("")}</div></details>`;
    },
    rivals(s) {
      if (!N.enabled(s)) return "";
      const x = s.driverWorld;
      return `<section class="panel padded rival-development"><span class="eyebrow">EL PADDOCK TAMBIÉN PROGRESA</span><h2>Aprendices y programas de los rivales.</h2><p>Invierten su propia caja, reservan jornadas y descansan antes de competir. Sus mejoras del coche se compran y montan en el taller.</p>${x.programs.map((j) => `<article><b>${esc(s.companies.find((c) => c.id === j.companyId).name)}</b><p>${esc(s.drivers.find((d) => d.id === j.driverId).name)} · ${G.Drivers.labels[j.focus]} · ${j.worked}/${j.days} jornadas · inversión ${U.money(j.cost)}</p></article>`).join("") || "<p>Ahora no hay programas activos. Los equipos invierten cuando tienen fondos y tiempo hasta la próxima prueba.</p>"}${
        x.history.length
          ? `<details><summary>Últimos informes públicos</summary>${x.history
              .slice(0, 8)
              .map(
                (j) =>
                  `<p>${esc(s.companies.find((c) => c.id === j.companyId).name)} · ${esc(s.drivers.find((d) => d.id === j.driverId).name)} · ${G.Drivers.labels[j.focus]} +${j.gain.toFixed(2)} · ${U.date(j.end, true)} · ${esc(j.reason)}</p>`,
              )
              .join("")}</details>`
          : ""
      }</section>`;
    },
    live(s) {
      const r = s.race;
      if (!r?.abilityVersion) return;
      const a = r.entrants.find((a) => a.companyId === s.playerId),
        panel = document.getElementById("skills-reading");
      if (!a || !panel) return;
      let div = document.getElementById("ability-live");
      if (!div) {
        div = document.createElement("div");
        div.id = "ability-live";
        panel.querySelector("#skills-battle").after(div);
      }
      const ids =
          a.dnf ||
          a.finishTime !== null ||
          !["none", "queued"].includes(a.pit.phase)
            ? []
            : a.abilities.active.filter(
                (id) =>
                  id !== "mal-perdedor" || a.abilities.boostUntil > r.time,
              ),
        signature =
          ids.join("/") +
          Math.ceil(Math.max(0, a.abilities.boostUntil - r.time)) +
          "/" +
          a.puncture;
      if (div.dataset.signature === signature) return;
      div.dataset.signature = signature;
      div.innerHTML = `<span class="eyebrow">HABILIDADES EN USO</span><div class="ability-badges">${ids.map((id) => `<span title="${esc(B.byId[id].description)}">${esc(B.byId[id].name)}${id === "mal-perdedor" ? ` · ${Math.ceil(a.abilities.boostUntil - r.time)} s` : ""}</span>`).join("") || "<small>Ninguna condición activa en este tramo.</small>"}</div>${a.puncture ? '<p class="puncture-alert">Neumático pinchado: máximo 18 km/h para volver a boxes. Cambia las gomas.</p>' : ""}`;
    },
  });
  const card = U.driverCard;
  U.driverCard = function (d, ...args) {
    const html = card.call(this, d, ...args);
    return html.replace(
      "</article>",
      UI.abilities(G.App.state, d, true) + "</article>",
    );
  };
  const details = G.ContractsUI.driverDetails;
  G.ContractsUI.driverDetails = function (s, d, ...args) {
    return details.call(this, s, d, ...args) + UI.abilities(s, d);
  };
  const team = U.team;
  U.team = function (s, ...args) {
    return team.call(this, s, ...args) + (N.enabled(s) ? UI.guide() : "");
  };
  const companies = U.companies;
  U.companies = function (s, ...args) {
    return companies.call(this, s, ...args) + UI.rivals(s);
  };
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    UI.live(s);
  };
})();
