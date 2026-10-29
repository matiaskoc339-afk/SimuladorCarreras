"use strict";
(() => {
  const G = RCS,
    A = G.Art;
  // Índices anteriores intactos: el catálogo se amplía al final.
  const rows = [
    [
      "Alfa Romeo",
      "147 Twin Spark",
      "937",
      2003,
      120,
      1200,
      195,
      68,
      65,
      75,
      5800,
      "hatch",
      4.17,
      1.73,
    ],
    [
      "Honda",
      "CR-X VTi",
      "Del Sol",
      1995,
      160,
      1100,
      210,
      73,
      65,
      86,
      9800,
      "targa",
      4.0,
      1.7,
    ],
    [
      "Mazda",
      "RX-7",
      "FD",
      1995,
      255,
      1280,
      250,
      80,
      75,
      68,
      24500,
      "coupe",
      4.29,
      1.76,
    ],
    [
      "Nissan",
      "Skyline GTS-t",
      "R32",
      1993,
      215,
      1320,
      235,
      74,
      71,
      78,
      19300,
      "coupe",
      4.53,
      1.76,
    ],
    [
      "Toyota",
      "Supra SZ",
      "JZA80",
      1994,
      225,
      1460,
      240,
      75,
      75,
      84,
      23000,
      "coupe",
      4.52,
      1.81,
    ],
    [
      "Porsche",
      "944 S2",
      "944",
      1991,
      211,
      1340,
      240,
      79,
      78,
      82,
      16900,
      "coupe",
      4.32,
      1.74,
    ],
    [
      "Lancia",
      "Delta HF",
      "Integrale",
      1992,
      210,
      1300,
      220,
      82,
      73,
      72,
      25200,
      "hatch",
      3.9,
      1.77,
    ],
    [
      "Ford",
      "Escort RS",
      "Cosworth",
      1994,
      227,
      1275,
      235,
      81,
      74,
      75,
      26700,
      "coupe",
      4.21,
      1.73,
    ],
    [
      "Mercedes-Benz",
      "190E 2.3",
      "W201",
      1990,
      185,
      1300,
      225,
      68,
      73,
      90,
      12500,
      "sedan",
      4.43,
      1.69,
    ],
    [
      "Saab",
      "900 Turbo",
      "Classic",
      1992,
      175,
      1280,
      210,
      64,
      67,
      86,
      7900,
      "hatch",
      4.68,
      1.69,
    ],
    [
      "Volvo",
      "V70 T5",
      "P80",
      1998,
      240,
      1490,
      245,
      65,
      74,
      85,
      11400,
      "wagon",
      4.72,
      1.8,
    ],
    [
      "Lotus",
      "Elise",
      "S1",
      1998,
      120,
      725,
      200,
      88,
      78,
      74,
      21800,
      "roadster",
      3.73,
      1.72,
    ],
    [
      "Renault",
      "5 GT Turbo",
      "Supercinq",
      1990,
      120,
      850,
      204,
      68,
      57,
      72,
      7400,
      "compact",
      3.59,
      1.6,
    ],
    [
      "Fiat",
      "Coupé 20V",
      "175",
      1997,
      147,
      1250,
      212,
      71,
      67,
      77,
      8900,
      "coupe",
      4.25,
      1.77,
    ],
    [
      "Peugeot",
      "205 GTI",
      "1.9",
      1991,
      130,
      880,
      206,
      74,
      62,
      78,
      10500,
      "compact",
      3.7,
      1.57,
    ],
    [
      "Audi",
      "TT 1.8T",
      "8N",
      2000,
      225,
      1395,
      243,
      79,
      76,
      82,
      15400,
      "coupe",
      4.04,
      1.76,
    ],
  ];
  for (const r of rows) {
    const [
      brand,
      model,
      generation,
      year,
      hp,
      weight,
      top,
      grip,
      brakes,
      reliability,
      value,
      shape,
      length,
      width,
    ] = r;
    G.Data.models.push({
      brand,
      model,
      generation,
      year,
      hp,
      weight,
      top,
      grip,
      brakes,
      reliability,
      value,
      shape,
      length,
      width,
    });
  }
  // Semianchuras desde el morro hasta la cola. Cada familia cambia proporciones,
  // posición del habitáculo y caída de la carrocería, también en el canvas de carrera.
  const families = {
    city: {
      widths: [0.27, 0.43, 0.5, 0.49, 0.48, 0.44, 0.3],
      ys: [0.04, 0.13, 0.28, 0.48, 0.73, 0.91, 0.97],
      cabin: [0.29, 0.7],
      round: 0.8,
    },
    hatch: {
      widths: [0.35, 0.46, 0.5, 0.49, 0.5, 0.47, 0.37],
      ys: [0.04, 0.13, 0.31, 0.49, 0.72, 0.93, 0.97],
      cabin: [0.3, 0.76],
      round: 0.35,
    },
    box: {
      widths: [0.38, 0.47, 0.49, 0.49, 0.49, 0.47, 0.38],
      ys: [0.04, 0.1, 0.3, 0.49, 0.73, 0.94, 0.97],
      cabin: [0.3, 0.77],
      round: 0.12,
    },
    coupe: {
      widths: [0.22, 0.39, 0.5, 0.45, 0.5, 0.45, 0.29],
      ys: [0.03, 0.12, 0.31, 0.48, 0.72, 0.9, 0.97],
      cabin: [0.37, 0.66],
      round: 0.55,
    },
    fastback: {
      widths: [0.27, 0.43, 0.5, 0.46, 0.49, 0.41, 0.26],
      ys: [0.035, 0.14, 0.3, 0.49, 0.72, 0.9, 0.97],
      cabin: [0.3, 0.75],
      round: 0.7,
    },
    sedan: {
      widths: [0.34, 0.45, 0.5, 0.47, 0.49, 0.46, 0.34],
      ys: [0.035, 0.13, 0.29, 0.49, 0.72, 0.92, 0.97],
      cabin: [0.32, 0.65],
      round: 0.3,
    },
    wagon: {
      widths: [0.34, 0.45, 0.49, 0.48, 0.5, 0.49, 0.4],
      ys: [0.035, 0.13, 0.29, 0.49, 0.72, 0.94, 0.97],
      cabin: [0.3, 0.84],
      round: 0.22,
    },
    open: {
      widths: [0.22, 0.42, 0.5, 0.42, 0.5, 0.41, 0.25],
      ys: [0.035, 0.13, 0.3, 0.49, 0.72, 0.9, 0.97],
      cabin: [0.39, 0.68],
      round: 0.75,
    },
    mid: {
      widths: [0.26, 0.44, 0.48, 0.43, 0.5, 0.46, 0.28],
      ys: [0.035, 0.13, 0.26, 0.47, 0.73, 0.91, 0.97],
      cabin: [0.28, 0.61],
      round: 0.45,
    },
    classic: {
      widths: [0.35, 0.45, 0.49, 0.46, 0.48, 0.46, 0.36],
      ys: [0.035, 0.1, 0.32, 0.5, 0.72, 0.94, 0.97],
      cabin: [0.4, 0.68],
      round: 0.12,
    },
  };
  const styles = [
    "hatch",
    "open",
    "fastback",
    "hatch",
    "city",
    "box",
    "city",
    "city",
    "hatch",
    "box",
    "hatch",
    "hatch",
    "city",
    "hatch",
    "city",
    "hatch",
    "mid",
    "coupe",
    "sedan",
    "sedan",
    "wagon",
    "sedan",
    "open",
    "sedan",
    "hatch",
    "open",
    "mid",
    "classic",
    "coupe",
    "classic",
    "box",
    "box",
    "classic",
    "fastback",
    "wagon",
    "mid",
    "box",
    "coupe",
    "box",
    "fastback",
  ];
  const native = A.carProfile.bind(A),
    cache = new Map();
  A.carProfile = function (car) {
    const old = native(car),
      m = G.Data.models[old.index] || car,
      key = old.index;
    let p = cache.get(key);
    if (!p) {
      const style = styles[key] || "coupe",
        f = families[style],
        h = A.hash(m.brand + ":" + m.model),
        dx = (((h >>> 6) % 9) - 4) * 0.002,
        dy = (((h >>> 12) % 7) - 3) * 0.002 + key * 0.00011;
      const right = f.widths.map((w, i) => ({
          x: Math.min(0.5, w + dx),
          y: f.ys[i] + (i > 0 && i < 6 ? dy : 0),
        })),
        points = [
          ...right,
          ...right
            .slice()
            .reverse()
            .map((v) => ({ x: -v.x, y: v.y })),
        ];
      const body =
        points
          .map(
            (v, i) =>
              (i ? "L" : "M") +
              (120 + v.x * 154).toFixed(2) +
              " " +
              (25 + v.y * 390).toFixed(2),
          )
          .join("") + "Z";
      const cabin = f.cabin.map((v) => v + dy),
        wx =
          style === "mid"
            ? 43
            : style === "classic"
              ? 50
              : style === "city"
                ? 49
                : 52,
        wy = 25 + cabin[0] * 390,
        ry = 25 + cabin[1] * 390;
      p = {
        style,
        points,
        body,
        cabin,
        wind: `M${120 - wx} ${wy}Q120 ${wy - 15} ${120 + wx} ${wy}L${120 + wx - 11} ${wy + 39}H${120 - wx + 11}Z`,
        rear: `M${120 - wx + 11} ${ry - 20}H${120 + wx - 11}L${120 + wx} ${ry + 13}Q120 ${ry + 24} ${120 - wx} ${ry + 13}Z`,
        roofY: wy + 42,
        roofEnd: ry - 23,
        frontRoof: 0.5 - cabin[0] - 0.1,
        rearRoof: 0.5 - cabin[1] + 0.06,
        open: m.shape === "roadster" || m.shape === "targa",
        light: h % 6,
        wheelbase: 0.52 + (h % 6) * 0.012,
        spoiler: [7, 17, 27, 30, 31].includes(key),
        vent: style === "mid",
        round: f.round,
      };
      cache.set(key, p);
    }
    return {
      ...old,
      ...p,
      roof: m.brand === "Mini" ? "#ede6d0" : car.color || "#a6ac9b",
    };
  };
  A.bodyCanvas = function (c, design, length, width) {
    c.beginPath();
    design.points.forEach((v, i) => {
      const x = (0.5 - v.y) * length,
        y = v.x * width;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    });
    c.closePath();
  };
  A.overlay = function (car) {
    const p = this.carProfile(car),
      h = p.key,
      round = p.light === 0 || p.light === 4,
      light = round
        ? '<circle cx="76" cy="63" r="10"/><circle cx="164" cy="63" r="10"/>'
        : p.light === 1
          ? '<path d="M64 57H92V73H64ZM148 57H176V73H148Z"/>'
          : p.light === 2
            ? '<path d="M64 59L95 70L91 77L62 69ZM176 59L145 70L149 77L178 69Z"/>'
            : '<path d="M65 64H94M146 64H175" fill="none" stroke="#e6efe0" stroke-width="6"/>';
    return `<g data-design="${p.index}" data-body-style="${p.style}"><g fill="#e5edda" stroke="#9daea5" stroke-width="1">${light}</g><path d="M99 64H141" stroke="#17272c" stroke-width="6"/>${p.vent ? '<path d="M55 260L64 298M185 260L176 298" stroke="#183138" stroke-width="7"/><path d="M81 331H159M81 340H159M81 349H159" stroke="#253c40" stroke-width="3"/>' : ""}${p.style === "wagon" ? '<path d="M75 183V330M165 183V330" stroke="#c8cfc6" stroke-width="4"/>' : ""}${p.spoiler || car.installed?.aero ? '<path d="M48 382H192" stroke="#18282e" stroke-width="12"/><path d="M61 381H179" stroke="#70848a" stroke-width="2"/>' : ""}<path d="M64 389H86M154 389H176" stroke="#c14939" stroke-width="6"/>${h % 3 === 0 ? '<path d="M106 80V130M116 80V130" stroke="#ece6cb" stroke-width="6" opacity=".85"/>' : ""}</g>`;
  };
  const detail = A.canvas.bind(A);
  A.canvas = function (c, a, length, width) {
    const p = this.carProfile(a);
    detail(c, a, length, width);
    if (p.vent) {
      c.strokeStyle = "#1a3036";
      c.lineWidth = 0.065;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-length * (0.31 + i * 0.035), -width * 0.3);
        c.lineTo(-length * (0.31 + i * 0.035), width * 0.3);
        c.stroke();
      }
    }
    if (p.spoiler) {
      c.fillStyle = "#1b2c31";
      c.fillRect(-length * 0.43, -width * 0.52, length * 0.035, width * 1.04);
    }
    if (p.style === "box" || p.style === "classic") {
      c.fillStyle = "#d3d9bf";
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(
          length * 0.43,
          side * width * 0.27,
          length * 0.03,
          width * 0.09,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    }
  };
})();
