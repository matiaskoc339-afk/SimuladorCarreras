"use strict";
(() => {
  const G = RCS,
    A = G.Art,
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
  const tone = (hex, n) => {
    const v = String(hex || "#a35e4b").replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(v)) return "#985e4d";
    return (
      "#" +
      [0, 2, 4]
        .map((i) =>
          G.clamp(parseInt(v.slice(i, i + 2), 16) + n, 0, 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  };
  const profile = A.carProfile;
  A.carProfile = function (car) {
    const p = profile.call(this, car),
      kit = car.coachwork?.style;
    if (!kit || kit === "factory") return p;
    const points = p.points.map((v, i) => {
      const widen = kit === "touring" ? 0.006 : kit === "wide" ? 0.018 : 0.024;
      return {
        ...v,
        x:
          Math.sign(v.x) *
          Math.min(
            0.5,
            Math.abs(v.x) + (i % 7 === 1 || i % 7 === 4 ? widen : 0),
          ),
      };
    });
    return {
      ...p,
      points,
      kit,
      body:
        points
          .map(
            (v, i) =>
              (i ? "L" : "M") +
              (120 + v.x * 154).toFixed(2) +
              " " +
              (25 + v.y * 390).toFixed(2),
          )
          .join("") + "Z",
    };
  };
  const overlay = A.overlay;
  A.overlay = function (car) {
    const original = overlay.call(this, car),
      m = car.coachwork;
    if (!m) return original;
    return (
      original +
      `<g data-body-kit="${m.style}">${m.style !== "factory" ? '<path d="M58 84Q120 101 182 84M56 369Q120 359 184 369" fill="none" stroke="#172d36" stroke-width="5"/>' : ""}${["wide", "race"].includes(m.style) ? '<path d="M48 101L42 142M192 101L198 142M46 303L43 346M194 303L197 346" stroke="#c8d2cd" stroke-width="3"/>' : ""}${m.style === "race" || m.engineStage >= 2 ? '<path d="M84 103H102M84 110H102M84 117H102M138 103H156M138 110H156M138 117H156" stroke="#172e37" stroke-width="3"/>' : ""}${m.chassisTier >= 2 ? '<path d="M81 205L159 279M159 205L81 279" stroke="#bec8b3" stroke-width="3" opacity=".65"/>' : ""}${m.wheelId ? '<path d="M42 112H52M188 112H198M43 326H53M187 326H197" stroke="#d7c395" stroke-width="4"/>' : ""}</g>`
    );
  };
  const canvas = A.canvas;
  A.canvas = function (c, car, len, width) {
    canvas.call(this, c, car, len, width);
    const m = car.coachwork;
    if (!m) return;
    if (m.style !== "factory") {
      c.strokeStyle = "#1a2c32";
      c.lineWidth = 0.09;
      c.beginPath();
      c.moveTo(len * 0.42, -width * 0.37);
      c.lineTo(len * 0.46, 0);
      c.lineTo(len * 0.42, width * 0.37);
      c.stroke();
    }
    if (m.chassisTier >= 2) {
      c.strokeStyle = "#c2bba4";
      c.lineWidth = 0.025;
      c.beginPath();
      c.moveTo(-len * 0.22, -width * 0.25);
      c.lineTo(len * 0.07, width * 0.25);
      c.moveTo(-len * 0.22, width * 0.25);
      c.lineTo(len * 0.07, -width * 0.25);
      c.stroke();
    }
    if (m.style === "race" || m.aero) {
      c.fillStyle = "#172b33";
      c.fillRect(-len * 0.43, -width * 0.53, len * 0.035, width * 1.06);
    }
    if (m.wheelId) {
      c.fillStyle = m.rim >= 18 ? "#d8bc73" : "#ced9d5";
      for (const x of [-len * 0.29, len * 0.28])
        for (const y of [-width * 0.49, width * 0.49])
          c.fillRect(x - 0.12, y - 0.03, 0.24, 0.06);
    }
  };
  const top = G.Render.carSVG;
  G.Render.carSVG = function (car, number) {
    const m = car.coachwork;
    if (!m) return top.call(this, car, number);
    const result = top.call(this, car, number),
      base = G.Data.models[car.modelIndex]?.width || 1.72;
    return result.replace(
      /scale\(([0-9.]+) ([0-9.]+)\)/,
      (_, x, y) =>
        `scale(${(Number(x) * (1 + m.widthExtra / base)).toFixed(4)} ${y})`,
    );
  };
  const B = (G.CoachworkArt = {
    metrics(car) {
      const p = A.carProfile(car),
        model = G.Data.models[car.modelIndex] || car,
        length = G.clamp((model.length || 4.15) / 4.72, 0.7, 1.04) * 750,
        left = 500 - length / 2,
        shape = p.style,
        family = {
          city: [173, 0.285, 0.38, 0.81, 0.96, 0.57],
          hatch: [181, 0.315, 0.415, 0.78, 0.95, 0.58],
          wagon: [178, 0.32, 0.425, 0.85, 0.96, 0.555],
          box: [168, 0.32, 0.405, 0.82, 0.96, 0.56],
          sedan: [193, 0.355, 0.455, 0.66, 0.83, 0.565],
          classic: [184, 0.35, 0.445, 0.67, 0.83, 0.56],
          coupe: [209, 0.38, 0.49, 0.65, 0.875, 0.595],
          fastback: [202, 0.36, 0.465, 0.68, 0.92, 0.585],
          mid: [219, 0.29, 0.405, 0.63, 0.8, 0.54],
          open: [218, 0.32, 0.43, 0.69, 0.9, 0.56],
        }[shape] || [202, 0.36, 0.465, 0.68, 0.9, 0.58],
        variation = (A.hash(model.brand + model.model) % 9) - 4;
      return {
        p,
        length,
        left,
        right: left + length,
        frontWheel: left + length * 0.21,
        rearWheel: left + length * 0.79,
        wheelY: 365,
        roof: p.open ? 218 : family[0] + variation,
        hoodEnd: family[1],
        roofFront: family[2],
        roofEnd: family[3],
        rearGlassEnd: family[4],
        pillar: family[5],
      };
    },
    layout(car, view) {
      const m = this.metrics(car);
      if (view === "top") {
        const model = G.Data.models[car.modelIndex] || car,
          sy = (model.length || 4.15) / 4.72,
          sx = ((model.width || 1.72) + (car.coachwork?.widthExtra || 0)) / 1.8;
        return {
          engine: [500 - 150 * sy, 250],
          drivetrain: [500 - 30 * sy, 217],
          rolling: [500 - 188 * sy, 250 - 105 * sx],
          rear: [500 + 175 * sy, 250 + 105 * sx],
          chassis: [500 + 45 * sy, 287],
          bodywork: [500 + 70 * sy, 250 - 105 * sx],
          aero: [500 + 275 * sy, 250],
        };
      }
      return {
        engine: [m.left + m.length * 0.19, 264],
        drivetrain: [m.left + m.length * 0.37, 330],
        rolling: [m.frontWheel, m.wheelY],
        rear: [m.rearWheel, m.wheelY],
        chassis: [m.left + m.length * 0.53, 278],
        bodywork: [m.left + m.length * 0.58, m.roof + 12],
        aero: [m.right - 24, 252],
      };
    },
    top(car, options = {}) {
      const inner = G.Render.carSVG(car)
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>$/, "");
      return `<svg viewBox="0 0 1000 500" class="wb-car-drawing wb-top-drawing" role="img" aria-label="Vista superior del ${esc(car.brand)} ${esc(car.model)}"><ellipse cx="500" cy="338" rx="320" ry="23" fill="#050b10" opacity=".35"/><g transform="translate(500 250) rotate(-90) scale(1.65) translate(-120 -220)" opacity="${options.technical ? 0.48 : 1}">${inner}</g>${options.technical ? '<g fill="#b0bd9b" stroke="#d5dbcd" stroke-width="2"><rect x="270" y="213" width="92" height="74" rx="12"/><path d="M365 250H730M430 220V280M630 220V280" fill="none" stroke-width="8"/><path d="M460 200L610 300M610 200L460 300" fill="none"/></g>' : ""}</svg>`;
    },
    side(car, options = {}) {
      const m = this.metrics(car),
        c = car.coachwork || {},
        kit = c.style || "factory",
        kitLabel = {
          factory: "De serie",
          touring: "Touring",
          wide: "Ensanchada",
          race: "Competición",
        }[kit],
        p = m.p,
        color = car.color || "#a65d4c",
        id =
          "wbside-" +
          A.hash(
            (options.key || car.id) +
              ":" +
              kit +
              ":" +
              (options.technical ? "x" : "n"),
          ),
        L = m.length,
        x = m.left,
        x2 = m.right,
        roof = m.roof,
        roofFront = x + L * m.roofFront,
        roofBack = x + L * m.roofEnd,
        hood = x + L * m.hoodEnd,
        rearGlass = x + L * m.rearGlassEnd,
        pillar = x + L * m.pillar,
        glassBottom = 265,
        wheels = [m.frontWheel, m.rearWheel],
        rim = c.rim || (car.base?.brakes >= 65 ? 16 : 14),
        r = 49,
        rr = G.clamp(25 + (rim - 14) * 2.5, 25, 38),
        wheelColor =
          c.wheelId === "wheels-forged"
            ? "#cfb677"
            : c.wheelId
              ? "#becbd1"
              : "#94a2a7",
        wide = ["wide", "race"].includes(kit),
        sport = kit !== "factory",
        closed = !p.open,
        roofPath = closed
          ? `L${hood} 272C${hood + 24} 249 ${roofFront - 21} ${roof + 3} ${roofFront + 14} ${roof}Q${(roofFront + roofBack) / 2} ${roof - 5} ${roofBack} ${roof + 3}C${roofBack + 21} ${roof + 11} ${rearGlass - 16} 256 ${rearGlass} 275`
          : `L${hood} 276L${x + L * 0.43} 217L${x + L * 0.46} 220L${x + L * 0.44} 275H${x + L * 0.69}L${x + L * 0.73} 254L${x2 - 68} 276`;
      const body = `M${x + 6} 351Q${x - 6} 337 ${x} 316Q${x + 2} 299 ${x + 33} 291L${hood} 274${roofPath}L${x2 - 20} 285Q${x2 + 9} 291 ${x2 + 8} 319L${x2 + 3} 354Q500 365 ${x + 6} 351Z`;
      const wheel = (cx, i) =>
        `<g transform="translate(${cx} ${m.wheelY})" class="wb-wheel"><circle r="${r + 4}" fill="#0b131a"/><circle r="${r}" fill="url(#tire-${id})" stroke="#536169" stroke-width="1.5"/><circle r="${rr + 3}" fill="#101b22"/><circle r="${rr}" fill="url(#rim-${id})" stroke="${wheelColor}" stroke-width="2"/><circle r="${rr - 6}" fill="#28333b" stroke="#7f8b8f" stroke-width="1"/>${c.brakeTier > 0 || car.installed?.brakes ? `<path d="M${rr * 0.57} -${rr * 0.58}Q${rr} -4 ${rr * 0.75} ${rr * 0.5}L${rr * 0.4} ${rr * 0.45}L${rr * 0.4} -${rr * 0.55}Z" fill="${c.brakeTier >= 2 ? "#d55a43" : "#b1925a"}"/>` : ""}${Array.from(
          { length: c.wheelId ? (c.rim >= 18 ? 10 : 5) : 8 },
          (_, n) => {
            const a = (n * 360) / (c.wheelId ? (c.rim >= 18 ? 10 : 5) : 8);
            return `<path d="M-3 -${rr - 2}L-5 -8L5 -8L3 -${rr - 2}Z" transform="rotate(${a})" fill="${wheelColor}" stroke="#4f6067" stroke-width=".8"/>`;
          },
        ).join(
          "",
        )}<circle r="8" fill="#a1afb3" stroke="#1c2b32" stroke-width="2"/><circle r="3.2" fill="#26353c"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${Math.cos((a * Math.PI) / 180) * 5}" cy="${Math.sin((a * Math.PI) / 180) * 5}" r="1.2" fill="#e1e6dc"/>`).join("")}<path d="M-${r * 0.75} -${r * 0.5}A${r * 0.9} ${r * 0.9} 0 0 1 ${r * 0.6} -${r * 0.7}" fill="none" stroke="#a8b4ae" opacity=".25" stroke-width="2"/></g>`;
      const windows = closed
        ? `<path d="M${hood + 24} ${glassBottom - 2}L${roofFront + 9} ${roof + 16}Q${roofFront + 14} ${roof + 11} ${roofFront + 24} ${roof + 12}L${pillar - 10} ${roof + 12}L${pillar - 3} ${glassBottom - 1}Z" fill="url(#glass-${id})" stroke="#bac6bf" stroke-width="2"/><path d="M${pillar + 6} ${roof + 12}L${roofBack - 7} ${roof + 15}Q${roofBack + 11} ${roof + 18} ${rearGlass - 26} ${glassBottom - 4}L${pillar + 15} ${glassBottom - 1}Z" fill="url(#glass-${id})" stroke="#8eaaa9" stroke-width="2"/><path d="M${roofFront + 24} ${roof + 23}L${pillar - 19} ${roof + 23}M${roofFront + 14} ${roof + 30}L${pillar - 38} ${roof + 30}" stroke="#c4dadd" opacity=".45" stroke-width="3"/>${["wagon", "box"].includes(p.style) ? `<path d="M${x + L * 0.75} ${roof + 19}L${x + L * 0.78} 261" stroke="${color}" stroke-width="7"/><path d="M${roofFront + 7} ${roof - 7}H${roofBack - 8}" stroke="#73888b" stroke-width="4"/>` : ""}`
        : `<path d="M${hood + 10} 270L${x + L * 0.43} 224L${x + L * 0.444} 228L${x + L * 0.42} 270Z" fill="url(#glass-${id})" stroke="#b9c8c6" stroke-width="3"/><path d="M${x + L * 0.48} 271V244Q${x + L * 0.5} 231 ${x + L * 0.53} 248V271M${x + L * 0.6} 271V244Q${x + L * 0.62} 231 ${x + L * 0.65} 248V271" fill="#695647" stroke="#1e2e34" stroke-width="4"/>`;

      return `<svg viewBox="0 0 1000 500" class="wb-car-drawing wb-side-drawing" role="img" aria-label="Vista lateral del ${esc(car.brand)} ${esc(car.model)} · ${esc(kitLabel)}"><defs><linearGradient id="paint-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${tone(color, 47)}"/><stop offset=".27" stop-color="${tone(color, 8)}"/><stop offset=".55" stop-color="${color}"/><stop offset=".7" stop-color="${tone(color, -14)}"/><stop offset="1" stop-color="${tone(color, -48)}"/></linearGradient><linearGradient id="glass-${id}" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#7997a4"/><stop offset=".42" stop-color="#284550"/><stop offset="1" stop-color="#122936"/></linearGradient><radialGradient id="tire-${id}"><stop stop-color="#30414a"/><stop offset=".78" stop-color="#15242c"/><stop offset="1" stop-color="#09131a"/></radialGradient><radialGradient id="rim-${id}"><stop stop-color="#e1e7dd"/><stop offset=".5" stop-color="#6c7d86"/><stop offset=".85" stop-color="#bcc7c6"/><stop offset="1" stop-color="#465a66"/></radialGradient><mask id="arches-${id}"><rect width="1000" height="500" fill="white"/>${wheels.map((cx) => `<circle cx="${cx}" cy="${m.wheelY}" r="54" fill="black"/>`).join("")}</mask></defs><ellipse cx="500" cy="416" rx="${L * 0.53}" ry="17" fill="#000a0e" opacity=".55"/><path d="M${x - 40} 423H${x2 + 40}" stroke="#83a29e" stroke-width="1" opacity=".25"/>${options.technical ? `<g stroke="#adc3a5" fill="#334c47"><path d="M${x + 70} 338H${x2 - 50}" stroke-width="12"/><rect x="${x + L * 0.13}" y="268" width="98" height="64" rx="12"/><path d="M${x + L * 0.17} 279H${x + L * 0.27}M${x + L * 0.17} 289H${x + L * 0.27}M${x + L * 0.17} 299H${x + L * 0.27}" stroke-width="4"/><rect x="${x + L * 0.31}" y="313" width="75" height="24" rx="8"/><path d="M${x + L * 0.44} 338H${m.rearWheel}" stroke-width="6"/></g>` : ""}<g opacity="${options.technical ? 0.37 : 1}"><path d="${body}" mask="url(#arches-${id})" fill="url(#paint-${id})" stroke="${tone(color, -45)}" stroke-width="2.2"/><path d="M${x + 35} 300L${hood - 8} 279M${x + 42} 308L${hood - 4} 286M${x + L * 0.37} 286Q${x + L * 0.64} 284 ${x2 - 36} 302" fill="none" stroke="${tone(color, 75)}" stroke-width="2" opacity=".5"/>${windows}<path d="M${m.frontWheel + 62} 318Q${x + L * 0.57} 326 ${m.rearWheel - 63} 317L${m.rearWheel - 68} 341H${m.frontWheel + 66}Z" fill="${tone(color, -38)}" opacity=".17"/>${p.style === "mid" ? `<path d="M${m.rearWheel - 76} 284L${m.rearWheel - 30} 278L${m.rearWheel - 62} 310L${m.rearWheel - 81} 308Z" fill="#15313c" stroke="${tone(color, 35)}" stroke-width="2"/>` : ""}${c.chassisTier >= 2 ? `<path d="M${x + L * 0.43} ${roof + 20}L${x + L * 0.69} 267M${x + L * 0.69} ${roof + 20}L${x + L * 0.43} 267" stroke="#d1c8a7" stroke-width="4" opacity=".7"/>` : ""}<path d="M${pillar} ${roof + 9}L${pillar + 8} 330Q${pillar + 8} 342 ${pillar - 18} 345H${m.frontWheel + 60}M${m.frontWheel + 55} 295L${m.frontWheel + 63} 342" stroke="${tone(color, -58)}" fill="none" stroke-width="1.6"/><path d="M${pillar - 38} 282H${pillar - 14}" stroke="#bdc9c5" stroke-width="4" stroke-linecap="round"/>${["sedan", "wagon", "classic", "hatch", "box", "city"].includes(p.style) ? `<path d="M${x + L * 0.72} 274V326M${x + L * 0.69} 285H${x + L * 0.73}" stroke="${tone(color, -47)}" stroke-width="2"/>` : ""}<path d="M${hood + 7} 261L${hood - 14} 257L${hood - 25} 269L${hood - 5} 278L${hood + 8} 273Z" fill="${tone(color, -26)}" stroke="#6f878c" stroke-width="2"/><path d="M${x + 2} 307L${x + 31} 299L${x + 36} 313L${x + 4} 320Z" fill="#eee7bf" stroke="#bfcdbf" stroke-width="2"/><path d="M${x2 - 22} 293L${x2 + 1} 297L${x2 + 2} 320L${x2 - 21} 316Z" fill="#c74e3c"/><path d="M${x + 2} 335H${x + 48}M${x2 - 25} 339H${x2 + 5}" stroke="#172b35" stroke-width="8"/>${sport ? `<path d="M${x - 6} 355H${m.frontWheel - 50}M${m.frontWheel + 53} 358H${m.rearWheel - 52}M${m.rearWheel + 52} 356H${x2 + 12}" stroke="#142731" stroke-width="8"/><path d="M${m.frontWheel + 64} 351H${m.rearWheel - 63}" stroke="${tone(color, 51)}" stroke-width="2"/>` : ""}${wide ? wheels.map((cx) => `<path d="M${cx - 58} 355A59 59 0 0 1 ${cx + 58} 355" stroke="${tone(color, 20)}" stroke-width="10" fill="none"/><path d="M${cx - 61} 351A62 62 0 0 1 ${cx + 61} 351" stroke="#243d43" stroke-width="2" stroke-dasharray="2 13" fill="none"/>`).join("") : ""}${kit === "race" || c.engineStage >= 2 ? `<path d="M${x + L * 0.2} 287L${x + L * 0.29} 280M${x + L * 0.21} 293L${x + L * 0.3} 286M${x + L * 0.22} 299L${x + L * 0.31} 292" stroke="#142d38" stroke-width="4"/>` : ""}${c.aero ? `<path d="M${x2 - 42} 284V240M${x2 - 20} 288V240" stroke="#52666c" stroke-width="4"/><path d="M${x2 - 70} 236H${x2 + 21}L${x2 + 8} 246H${x2 - 68}Z" fill="#142a34" stroke="#8ba0a1" stroke-width="2"/>` : kit === "race" ? `<path d="M${x2 - 61} 281L${x2 + 10} 278V285H${x2 - 59}Z" fill="#192e36"/>` : ""}</g>${wheels.map(wheel).join("")}<path d="M${x2 - 6} 351L${x2 + 14} 355" stroke="#aebfc1" stroke-width="7" stroke-linecap="round"/><path d="M${x + L * 0.61} 325H${x + L * 0.69}" stroke="${tone(color, 35)}" stroke-width="1" opacity=".7"/></svg>`;
    },
  });
  const part = A.part;
  A.part = function (d) {
    const paths = {
      shell:
        "M12 55L26 30L43 15H82L102 31L116 55L103 66H25ZM28 34H99M47 17L41 35M78 17L85 35",
      chassis: "M18 13H108V68H18ZM18 13L108 68M108 13L18 68M31 13V68M95 13V68",
      engine:
        "M25 23H80V61H25ZM37 12H72V23M80 31H100V48H80M13 34H25M13 49H25M36 30V53M48 30V53M60 30V53M26 62H80",
      wheels:
        "M64 8A32 32 0 1 0 64 72A32 32 0 1 0 64 8ZM64 21A19 19 0 1 0 64 59A19 19 0 1 0 64 21ZM64 10V30M64 50V70M34 25L56 35M72 45L94 55M34 55L56 45M72 35L94 25",
    };
    if (!paths[d.slot]) return part.call(this, d);
    return `<svg viewBox="0 0 128 80" role="img" aria-label="Ilustración de ${esc(d.name)}"><path d="${paths[d.slot]}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
})();
