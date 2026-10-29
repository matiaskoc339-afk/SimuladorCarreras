"use strict";
(() => {
  const G = RCS,
    esc = (v) =>
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
      );
  G.Render.carSVG = function (car, number = "01") {
    const p = G.Art.carProfile(car),
      paint = car.color || "#b7b7aa",
      id = "vehicle-" + G.Art.hash((car.id || p.index) + ":" + number),
      roof = p.roof,
      wy = p.roofY,
      ry = p.roofEnd;
    const glass = `url(#glass-${id})`,
      metal = `url(#paint-${id})`,
      seed = G.Art.hash(car.id || car.model),
      accent = ["#e5e1c8", "#213a44", "#d9c18b", "#d9e4d8"][seed % 4];
    const cabin = p.open
      ? `<path d="M76 ${wy}H164V${Math.max(wy + 45, ry)}H76Z" fill="#172c33"/><g fill="#a38a68" stroke="#4a514b" stroke-width="2"><rect x="82" y="${wy + 7}" width="28" height="43" rx="9"/><rect x="130" y="${wy + 7}" width="28" height="43" rx="9"/></g><path d="M78 ${wy + 53}H162" stroke="#b8c4ba" stroke-width="6"/>`
      : `<path d="M77 ${wy}H163L166 ${ry}H74Z" fill="${roof}" stroke="#526467" stroke-width="1"/><path d="M67 ${wy - 7}L72 ${ry}L59 ${ry + 14}L58 ${wy}ZM173 ${wy - 7}L168 ${ry}L181 ${ry + 14}L182 ${wy}Z" fill="${glass}" stroke="#243c41" stroke-width="2"/>${["sedan", "wagon", "box", "classic"].includes(p.style) ? `<path d="M62 ${(wy + ry) / 2}H73M168 ${(wy + ry) / 2}H179" stroke="${paint}" stroke-width="6"/>` : ""}`;
    const m = G.Data.models[p.index] || car,
      sx = (m.width || 1.72) / 1.8,
      sy = (m.length || (p.open ? 4.0 : 4.15)) / 4.72;
    return `<svg viewBox="0 0 240 440" aria-label="Ilustración original del ${esc(car.brand)} ${esc(car.model)}" role="img" data-car-model="${p.index}"><defs><linearGradient id="paint-${id}" x1="0" y1="0" x2="1" y2=".1"><stop stop-color="#182d35"/><stop offset=".15" stop-color="${paint}"/><stop offset=".4" stop-color="${paint}"/><stop offset=".52" stop-color="${roof}"/><stop offset=".82" stop-color="${paint}"/><stop offset="1" stop-color="#213841"/></linearGradient><linearGradient id="glass-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9dafb0"/><stop offset=".35" stop-color="#375867"/><stop offset="1" stop-color="#0d2531"/></linearGradient></defs><g transform="translate(120 220) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-120 -220)"><ellipse cx="124" cy="231" rx="85" ry="191" fill="#07191f" opacity=".22"/><g fill="#14232a" stroke="#465655" stroke-width="2">${[106, 326].map((y) => `<rect x="35" y="${y - 24}" width="20" height="49" rx="5"/><rect x="185" y="${y - 24}" width="20" height="49" rx="5"/>`).join("")}</g><path d="${p.body}" fill="${metal}" stroke="#3a5154" stroke-width="2"/><path d="M65 89L67 ${wy - 10}M175 89L173 ${wy - 10}" stroke="#ebefe4" opacity=".35" stroke-width="2"/><path d="M76 86Q120 97 164 86M71 365Q120 354 169 365" fill="none" stroke="#1b343c" opacity=".65" stroke-width="2"/><path d="${p.wind}" fill="${glass}" stroke="#20353e" stroke-width="3"/>${cabin}<path d="${p.rear}" fill="${glass}" stroke="#20353e" stroke-width="3"/><path d="M75 ${wy - 26}L164 ${wy - 16}" fill="none" stroke="#d2e0db" opacity=".35" stroke-width="2"/>${!p.open ? `<rect x="94" y="${(wy + ry) / 2 - 19}" width="52" height="40" rx="4" fill="#efede0"/><text x="120" y="${(wy + ry) / 2 + 11}" fill="#243943" text-anchor="middle" font-size="29" font-family="Arial" font-weight="800">${esc(number)}</text>` : ""}<path d="M55 ${wy + 10}L38 ${wy + 16}V${wy + 27}L56 ${wy + 24}ZM185 ${wy + 10}L202 ${wy + 16}V${wy + 27}L184 ${wy + 24}Z" fill="${paint}" stroke="#2c454a" stroke-width="2"/>${seed % 5 === 0 ? `<path d="M108 83V${wy - 22}M119 83V${wy - 22}" stroke="${accent}" stroke-width="6"/>` : seed % 5 === 1 ? `<path d="M65 104L74 126M175 104L166 126" stroke="${accent}" stroke-width="7"/>` : ""}${G.Art.overlay(car)}<path d="M92 403H148" stroke="#20363d" stroke-width="5"/>${(car.components?.body ?? 100) < 65 ? '<path d="M169 95L180 124M165 106L177 135M57 330L74 347" stroke="#c5ceca" stroke-width="3"/>' : ""}</g></svg>`;
  };
})();
