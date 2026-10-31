"use strict";
(() => {
  const G = RCS,
    A = G.Art,
    C = G.GrandContent,
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
  const family = (car) => C.family(car),
    variant = (car) =>
      (
        G.Data.models[car.modelIndex] ||
        G.Data.models.find(
          (m) => m.model === car.model && (!car.brand || m.brand === car.brand),
        )
      )?.grandVariant || 0;
  const points = (car) => {
    const v = variant(car),
      formula = family(car) === "formula",
      right = formula
        ? [
            [0.07 + v * 0.007, 0],
            [0.1, 0.19],
            [0.18, 0.34],
            [0.37 + v * 0.008, 0.53],
            [0.4, 0.69],
            [0.24, 0.89],
            [0.2, 1],
          ]
        : [
            [0.28, 0.01],
            [0.47, 0.12],
            [0.48, 0.3],
            [0.36, 0.48],
            [0.49, 0.73],
            [0.46, 0.94],
            [0.32, 1],
          ];
    return [
      ...right,
      ...right
        .slice()
        .reverse()
        .map(([x, y]) => [-x, y]),
    ].map(([x, y]) => ({ x, y }));
  };
  const profile = A.carProfile;
  A.carProfile = function (car) {
    const p = profile.call(this, car);
    if (!["formula", "prototype"].includes(family(car))) return p;
    const ps = points(car);
    return {
      ...p,
      style: family(car),
      points: ps,
      open: family(car) === "formula",
      body:
        ps
          .map((v, i) => `${i ? "L" : "M"}${120 + v.x * 154} ${25 + v.y * 390}`)
          .join("") + "Z",
    };
  };
  const Art = (G.GrandArt = {
    top(car, number = "01") {
      const p = A.carProfile(car),
        v = variant(car),
        formula = family(car) === "formula",
        paint = car.color || "#d35c43",
        id = `grand-${A.hash((car.id || car.model) + number)}`,
        wing = 164 + v * 5;
      return `<svg viewBox="0 0 240 440" role="img" data-grand-shape="${family(car)}" aria-label="${esc(car.brand)} ${esc(car.model)} · vista superior"><defs><linearGradient id="${id}" x1="0" x2="1"><stop stop-color="#183339"/><stop offset=".25" stop-color="${paint}"/><stop offset=".6" stop-color="${paint}"/><stop offset="1" stop-color="#172e35"/></linearGradient></defs><ellipse cx="122" cy="231" rx="96" ry="198" fill="#0e201d" opacity=".18"/>${formula ? `<g stroke="#728283" stroke-width="3"><path d="M63 125L110 176M177 125L130 176M63 125L110 105M177 125L130 105M62 333L104 295M178 333L136 295"/></g>` : ""}<g fill="#142229" stroke="#647378" stroke-width="2">${[119, 330].map((y) => `<rect x="25" y="${y - 25}" width="34" height="58" rx="7"/><rect x="181" y="${y - 25}" width="34" height="58" rx="7"/>`).join("")}</g><path d="${p.body}" fill="url(#${id})" stroke="#283f46" stroke-width="2"/>${formula ? `<path d="M${120 - wing / 2} 61H${120 + wing / 2}V79H${120 - wing / 2}ZM${120 - wing / 2} 380H${120 + wing / 2}V405H${120 - wing / 2}Z" fill="${paint}" stroke="#1c343b" stroke-width="4"/><path d="M${120 - wing / 2} 72H${120 + wing / 2}M${120 - wing / 2} 392H${120 + wing / 2}" stroke="#d8e5dc" stroke-width="3"/><path d="M108 91L115 199M132 91L125 199" stroke="#e8e5cc" stroke-width="5"/><ellipse cx="120" cy="232" rx="24" ry="39" fill="#12262e"/><path d="M95 246Q92 195 120 191Q148 195 145 246M120 195V220" fill="none" stroke="#95a8ac" stroke-width="7"/><ellipse cx="120" cy="238" rx="12" ry="15" fill="#e0bd64"/><path d="M89 273L75 342M151 273L165 342" stroke="#142f37" stroke-width="7"/><path d="M99 304H141M99 314H141M101 324H139" stroke="#193238" stroke-width="4"/>` : `<path d="M81 148Q120 110 159 148L167 232Q120 268 73 232Z" fill="#173947" stroke="#829a9c" stroke-width="3"/><path d="M91 146Q120 128 149 146L151 226H89Z" fill="${paint}"/><path d="M53 94H85M155 94H187M51 104H83M157 104H189" stroke="#e2ebd7" stroke-width="4"/><path d="M50 286L69 316M190 286L171 316M76 359H164" stroke="#1b343a" stroke-width="8"/><path d="M31 377H209V394H31Z" fill="#172b33"/><path d="M107 44V133M120 44V126" stroke="#ece9d0" stroke-width="6"/>`}<rect x="107" y="${formula ? 145 : 273}" width="26" height="31" rx="3" fill="#f3efdc"/><text x="120" y="${formula ? 168 : 297}" font-family="sans-serif" font-size="21" font-weight="800" text-anchor="middle" fill="#263b3c">${esc(number)}</text></svg>`;
    },
    race(c, car, len, width, number, logo, steering = 0) {
      const f = family(car);
      if (!["formula", "prototype"].includes(f)) return false;
      const formula = f === "formula",
        paint = car.dnf ? "#7b8279" : car.color || "#c75540";
      c.fillStyle = "#0b19194a";
      c.beginPath();
      c.ellipse(0.1, 0.15, len * 0.52, width * 0.55, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#82958f";
      c.lineWidth = 0.035;
      for (const x of [-len * 0.29, len * 0.28])
        for (const side of [-1, 1]) {
          if (formula) {
            c.beginPath();
            c.moveTo(x - 0.18, side * width * 0.1);
            c.lineTo(x, side * width * 0.44);
            c.lineTo(x + 0.22, side * width * 0.1);
            c.stroke();
          }
          c.save();
          c.translate(x, side * width * 0.43);
          if (x > 0) c.rotate(steering);
          c.fillStyle = "#142126";
          c.beginPath();
          c.roundRect(
            -len * 0.065,
            -width * 0.095,
            len * 0.13,
            width * 0.19,
            0.055,
          );
          c.fill();
          c.fillStyle = "#687a76";
          c.fillRect(-len * 0.045, -0.025, len * 0.09, 0.05);
          c.restore();
        }
      const gradient = c.createLinearGradient(0, -width * 0.4, 0, width * 0.4);
      gradient.addColorStop(0, "#1e3e43");
      gradient.addColorStop(0.25, paint);
      gradient.addColorStop(0.65, paint);
      gradient.addColorStop(1, "#183037");
      c.fillStyle = gradient;
      A.bodyCanvas(c, A.carProfile(car), len, width);
      c.fill();
      c.lineWidth = 0.035;
      c.strokeStyle = "#aebeb599";
      c.stroke();
      c.fillStyle = formula ? paint : "#18353a";
      c.fillRect(-len * 0.44, -width * 0.48, len * 0.045, width * 0.96);
      if (formula) {
        c.fillRect(len * 0.34, -width * 0.47, len * 0.055, width * 0.94);
        c.fillStyle = "#e5e2ca";
        c.fillRect(len * 0.19, -width * 0.035, len * 0.2, width * 0.07);
        c.fillStyle = "#112b32";
        c.beginPath();
        c.ellipse(
          -len * 0.055,
          0,
          len * 0.095,
          width * 0.145,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.strokeStyle = "#9db0ae";
        c.lineWidth = 0.065;
        c.beginPath();
        c.ellipse(-len * 0.025, 0, len * 0.09, width * 0.17, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#e2c16e";
        c.beginPath();
        c.ellipse(
          -len * 0.08,
          0,
          len * 0.025,
          width * 0.065,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
      } else {
        c.fillStyle = "#163847";
        c.beginPath();
        c.ellipse(0, 0, len * 0.17, width * 0.27, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = paint;
        c.fillRect(-len * 0.12, -width * 0.14, len * 0.25, width * 0.28);
        c.fillStyle = "#eae8ce";
        c.fillRect(len * 0.35, -width * 0.33, 0.1, width * 0.2);
        c.fillRect(len * 0.35, width * 0.13, 0.1, width * 0.2);
      }
      c.fillStyle = car.braking ? "#ff5e39" : "#9c342c";
      c.fillRect(-len * 0.49, -0.09, 0.07, 0.18);
      c.fillStyle = "#eae7d4";
      c.fillRect(len * 0.1, -0.15, 0.35, 0.3);
      c.fillStyle = "#163037";
      c.font = "bold .25px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(number), len * 0.135, 0);
      if (logo?.complete && car.companyId === "player")
        c.drawImage(logo, len * 0.24 - 0.15, -0.15, 0.3, 0.3);
      return true;
    },
    side(car, options = {}) {
      const formula = family(car) === "formula",
        paint = car.color || "#cf5947",
        v = variant(car),
        id = `side-grand-${A.hash(car.id || car.model)}`,
        body = formula
          ? `M135 342L236 322L367 316L428 276L493 262L537 286L562 258L637 246L742 283L862 309L891 341L855 365H150Z`
          : `M128 343Q139 294 224 279L339 272Q406 213 499 220L601 249L723 262Q823 264 883 310L899 356H135Z`;
      const wheel = (cx) =>
        `<g transform="translate(${cx} 357)"><circle r="${formula ? 52 : 48}" fill="#101c23" stroke="#5a6d72" stroke-width="3"/><circle r="33" fill="#283c43" stroke="#9aabaa" stroke-width="3"/><circle r="23" fill="#182a30"/><g stroke="#b8c3bd" stroke-width="4">${Array.from({ length: 6 }, (_, i) => `<path d="M0 -28V28" transform="rotate(${i * 30})"/>`).join("")}</g><circle r="8" fill="#d9c79a"/></g>`;
      return `<svg viewBox="0 0 1000 500" class="wb-car-drawing wb-side-drawing" data-grand-side="${family(car)}" role="img" aria-label="Vista lateral del ${esc(car.brand)} ${esc(car.model)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d3ded0"/><stop offset=".2" stop-color="${paint}"/><stop offset=".7" stop-color="${paint}"/><stop offset="1" stop-color="#142f3b"/></linearGradient></defs><ellipse cx="510" cy="414" rx="405" ry="25" fill="#11211d" opacity=".22"/><g opacity="${options.technical ? 0.5 : 1}"><path d="${body}" fill="url(#${id})" stroke="#203a43" stroke-width="3"/>${formula ? `<path d="M163 342H246M736 330L863 317M738 337L877 327" stroke="#dae1cf" stroke-width="4"/><path d="M456 276L468 253Q502 242 537 264M474 255L513 292" fill="none" stroke="#9db0b3" stroke-width="8"/><ellipse cx="493" cy="280" rx="16" ry="20" fill="#e4bc6a"/><path d="M831 312V242M862 319V242M812 236H896V252H811Z" fill="#213b44" stroke="#829b9a" stroke-width="3"/><path d="M120 361H241V375H116Z" fill="#1a313a"/>` : `<path d="M355 269Q415 226 495 230L575 258L562 281H376Z" fill="#1d3d4c" stroke="#8ba2a3" stroke-width="3"/><path d="M471 231L478 283" stroke="${paint}" stroke-width="9"/><path d="M835 296V250M861 306V250M814 242H895V256H812Z" fill="#203740"/><path d="M604 292L671 284L651 322L610 330Z" fill="#183039"/>`}<path d="M345 337H665M598 300L708 315M600 310L701 325" stroke="#19313a" stroke-width="7"/><rect x="566" y="294" width="46" height="39" rx="4" fill="#e9e7cf"/><text x="589" y="322" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="27" fill="#1b343b">${v + 1}</text><path d="M167 370H867" stroke="#172d35" stroke-width="9"/>${wheel(266)}${wheel(755)}</g></svg>`;
    },
  });
  const top = G.Render.carSVG;
  G.Render.carSVG = function (car, ...args) {
    return ["formula", "prototype"].includes(family(car))
      ? Art.top(car, ...args)
      : top.call(this, car, ...args);
  };
  const side = G.CoachworkArt.side;
  G.CoachworkArt.side = function (car, ...args) {
    return ["formula", "prototype"].includes(family(car))
      ? Art.side(car, ...args)
      : side.call(this, car, ...args);
  };
  const layout = G.CoachworkArt.layout;
  const workshopTop = G.CoachworkArt.top;
  G.CoachworkArt.top = function (car, ...args) {
    const svg = workshopTop.call(this, car, ...args);
    return ["formula", "prototype"].includes(family(car))
      ? svg.replace("<svg ", `<svg data-grand-shape="${family(car)}" `)
      : svg;
  };
  G.CoachworkArt.layout = function (car, view) {
    if (!["formula", "prototype"].includes(family(car)))
      return layout.call(this, car, view);
    return view === "top"
      ? {
          engine: [620, 250],
          drivetrain: [700, 250],
          rolling: [285, 165],
          rear: [730, 335],
          chassis: [500, 280],
          bodywork: [500, 220],
          aero: [860, 250],
        }
      : {
          engine: [655, 275],
          drivetrain: [670, 340],
          rolling: [266, 357],
          rear: [755, 357],
          chassis: [500, 317],
          bodywork: [580, 260],
          aero: [860, 247],
        };
  };
})();
