"use strict";
(() => {
  const G = RCS,
    scenes = new Map(),
    hash = (n) => {
      let x = Math.imul((n + 1) ^ 0x9e3779b9, 0x45d9f3b);
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
    };
  const stroke = (c, pts, color, width, dash = [], closed = false) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    if (closed) c.closePath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.setLineDash(dash);
    c.stroke();
    c.setLineDash([]);
  };
  const rect = (c, p, w, h, color) => {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle || 0);
    c.fillStyle = color;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
  };
  G.ModernScene = {
    build(index) {
      if (scenes.has(index)) return scenes.get(index);
      const m = G.Render.metrics(index),
        t = G.Data.tracks[index],
        b = m.bounds,
        street = t.kind === "street",
        night = ["night", "neon"].includes(t.theme),
        density = Math.min(3, 3072 / Math.max(b.width, b.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.ceil(b.width * density);
      canvas.height = Math.ceil(b.height * density);
      const c = canvas.getContext("2d");
      c.scale(density, density);
      c.translate(-b.x, -b.y);
      c.fillStyle =
        t.theme === "desert"
          ? "#bca77c"
          : t.theme === "coast"
            ? "#99a78d"
            : street
              ? night
                ? "#303544"
                : "#797c75"
              : [
                  "#78825f",
                  "#6e835d",
                  "#8b8b67",
                  "#78886c",
                  "#617756",
                  "#7c8b6b",
                ][index % 6];
      c.fillRect(b.x, b.y, b.width, b.height);
      const point = (d, l = 0) => G.Racecraft.metric(index, d, l),
        path = (start = 0, end = t.length, l = 0, step = 4) => {
          const pts = [];
          for (let d = start; d <= end; d += step) pts.push(point(d, l));
          pts.push(point(end, l));
          return pts;
        };
      const pit = t.pit,
        pitPoints = Array.from({ length: 81 }, (_, i) => {
          const d = pit.entry + ((pit.exit - pit.entry) * i) / 80;
          return point(d, G.RaceWeekend.pitLateral(index, d));
        });
      const obstacles = [...m.points, ...pitPoints];
      const clear = (x, y, r) =>
        obstacles.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 > (r + 3) ** 2);
      if (t.theme === "coast") {
        for (let y = b.y + b.height * 0.55; y < b.y + b.height; y += 12)
          for (let x = b.x; x < b.x + b.width; x += 12)
            if (clear(x, y, 21)) {
              c.fillStyle = y > b.y + b.height * 0.74 ? "#376f7f" : "#5b949a";
              c.fillRect(x - 6, y - 6, 12, 12);
              if (Math.round(x + y) % 3 === 0) {
                c.fillStyle = "#adcec14d";
                c.fillRect(x - 4, y, 7, 0.5);
              }
            }
      }
      // Huellas completas alejadas del asfalto y del ramal de boxes, no solo sus centros.
      for (
        let i = 0;
        i < (street ? 230 : t.theme === "forest" ? 360 : 130);
        i++
      ) {
        const x = b.x + hash(i * 17 + index * 501) * b.width,
          y = b.y + hash(i * 29 + index * 91) * b.height;
        if (street) {
          const w = 16 + hash(i * 31) * 35,
            h = 13 + hash(i * 23) * 30;
          if (!clear(x, y, Math.hypot(w, h) / 2 + 13)) continue;
          rect(c, { x: x + 3, y: y + 4 }, w, h, "#1d252550");
          rect(
            c,
            { x, y },
            w,
            h,
            ["#a3a49c", "#8a958d", "#b0a699", "#747f83", "#899097"][i % 5],
          );
          rect(
            c,
            { x, y },
            w - 3,
            h - 3,
            ["#b6b6a9", "#919c91", "#acaaa0"][i % 3],
          );
          if (t.theme === "neon") {
            c.strokeStyle = ["#e68ca0", "#6bd0cd", "#c3adf0"][i % 3];
            c.lineWidth = 1;
            c.strokeRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2);
          }
          c.strokeStyle = "#6c756a";
          c.lineWidth = 0.4;
          for (let k = -w / 2 + 4; k < w / 2; k += 5) {
            c.beginPath();
            c.moveTo(x + k, y - h / 2 + 2);
            c.lineTo(x + k, y + h / 2 - 2);
            c.stroke();
          }
        } else {
          const size =
            t.theme === "desert" ? 2 + hash(i * 31) * 2 : 4 + hash(i * 31) * 6;
          if (!clear(x, y, size + 30)) continue;
          c.fillStyle = "#2d4a2e70";
          c.beginPath();
          c.arc(x + 2, y + 2, size, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = (
            t.theme === "desert"
              ? ["#8c9661", "#99936a", "#89885a"]
              : ["#4e6e43", "#5b784c", "#3f643e"]
          )[i % 3];
          c.beginPath();
          c.arc(x, y, size, 0, Math.PI * 2);
          c.fill();
        }
      }
      if (!street) {
        stroke(c, m.points, "#b0ab89", t.width + 26, [], true);
        stroke(c, m.points, "#96a078", t.width + 19, [], true);
      } else {
        stroke(
          c,
          m.points,
          night ? "#686d73" : "#b7b5a7",
          t.width + 7,
          [],
          true,
        );
        stroke(c, m.points, "#666d6b", t.width + 2, [], true);
      }
      stroke(c, m.points, night ? "#303d43" : "#3a4242", t.width, [], true);
      stroke(c, m.points, "#171f2410", t.width * 0.6, [], true);
      for (let i = 0; i < 1800; i++) {
        const d = hash(i * 37 + index * 77) * t.length,
          l = (hash(i * 13) - 0.5) * (t.width - 0.6),
          p = point(d, l);
        rect(
          c,
          p,
          0.15 + hash(i) * 0.6,
          0.08,
          i % 3 ? "#20282b19" : "#cad0c313",
        );
      }
      for (const side of [-1, 1]) {
        stroke(
          c,
          path(0, t.length, side * (t.width / 2 - 0.35)),
          street ? "#d9d6bb" : "#eee9d8",
          0.14,
          [],
          false,
        );
        if (street) {
          const color = night ? "#bdc6c5" : "#dadbd0";
          if (side === pit.side) {
            stroke(
              c,
              path(0, pit.entry - 10, side * (t.width / 2 + 0.65)),
              color,
              0.9,
            );
            stroke(
              c,
              path(pit.exit + 10, t.length, side * (t.width / 2 + 0.65)),
              color,
              0.9,
            );
          } else
            stroke(
              c,
              path(0, t.length, side * (t.width / 2 + 0.65)),
              color,
              0.9,
            );
        } else {
          stroke(
            c,
            path(0, t.length, side * (t.width / 2 + 17)),
            "#708471",
            0.65,
            [0.7, 2],
          );
        }
      }
      if (street) stroke(c, path(0, t.length, 0), "#d1c69c", 0.12, [5, 7]);
      else {
        for (let d = 0; d < t.length; d += 3) {
          const p = G.Racecraft.sample(index, d);
          if (p.limit > 40) continue;
          const side = Math.sign(p.curvature) || 1;
          stroke(
            c,
            [
              point(d, side * (t.width / 2 + 0.35)),
              point(d + 3, side * (t.width / 2 + 0.35)),
            ],
            Math.floor(d / 3) % 2 ? "#d8dbce" : "#b34d3d",
            1.2,
          );
        }
      }
      // Un carril de paso común, diez puestos independientes y vías de entrada/salida suaves.
      const middle = (pit.entry + pit.exit) / 2,
        pad = point(middle, pit.side * 31),
        span = (pit.exit - pit.entry) * 0.57;
      rect(c, pad, span, 32, street ? "#646d6b" : "#8a918a");
      stroke(c, pitPoints, "#a6ada4", 7.4);
      stroke(c, pitPoints, "#424d4e", 6.4);
      stroke(c, pitPoints, "#e2e3c8", 0.12, [3, 3]);
      for (let i = 0; i < 10; i++) {
        const d = pit.entry + (pit.exit - pit.entry) * (0.32 + (i / 9) * 0.36),
          base = G.RaceWeekend.pitLateral(index, d),
          box = point(d, base + pit.side * 5),
          garage = point(d, base + pit.side * 16);
        rect(c, box, 6.3, 3.3, "#dcdec967");
        rect(c, box, 5.7, 2.7, "#53625c");
        rect(
          c,
          garage,
          11,
          12,
          street ? ["#b17955", "#7b8891", "#b6ad88"][i % 3] : "#d9ded4",
        );
        c.save();
        c.translate(garage.x, garage.y);
        c.rotate(garage.angle);
        c.strokeStyle = street ? "#e7ded0" : "#aab6af";
        c.lineWidth = 0.35;
        for (let x = -4; x < 5; x += 1.5) {
          c.beginPath();
          c.moveTo(x, -5);
          c.lineTo(x, 5);
          c.stroke();
        }
        c.restore();
        const label = point(d, base + pit.side * 8.3);
        c.save();
        c.translate(label.x, label.y);
        c.rotate(label.angle);
        c.fillStyle = "#e4e8d5";
        c.font = "bold 1.7px monospace";
        c.textAlign = "center";
        c.fillText(String(i + 1).padStart(2, "0"), 0, 0.5);
        c.restore();
      }
      for (let i = 0; i < (t.theme === "stadium" ? 6 : 3); i++) {
        const d = t.length * (0.19 + i * (t.theme === "stadium" ? 0.12 : 0.23)),
          p = G.Racecraft.safePlacement(index, d, 54, 15, 1, 35, 18);
        rect(c, p, 54, 15, street ? "#8b8b78" : "#b2b5a7");
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        for (let row = 0; row < 5; row++) {
          c.fillStyle = row % 2 ? "#6d8981" : "#889e8a";
          c.fillRect(-25, -6 + row * 2.5, 50, 2);
          for (let seat = 0; seat < 32; seat++) {
            c.fillStyle = ["#d8cfad", "#647c78", "#c7bfb4", "#ad8664"][
              Math.floor(hash(row * 43 + seat + i * 178) * 4)
            ];
            c.fillRect(-24 + seat * 1.5, -5.5 + row * 2.5, 0.7, 0.6);
          }
        }
        c.restore();
      }
      // La meta y parrilla se orientan con la misma tangente que los coches.
      const start = point(4);
      c.save();
      c.translate(start.x, start.y);
      c.rotate(start.angle);
      for (let row = 0; row < 2; row++)
        for (let y = -t.width / 2; y < t.width / 2; y += 0.6) {
          c.fillStyle = (row + Math.round(y / 0.6)) % 2 ? "#e4e4d3" : "#293537";
          c.fillRect(row * 0.6, y, 0.6, 0.6);
        }
      c.restore();
      for (let i = 0; i < 10; i++) {
        const d = -9 - Math.floor(i / 2) * 9.2 - (i % 2) * 2.5,
          p = point(d, i % 2 ? -2.2 : 2.2);
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        c.strokeStyle = "#d9dfd1";
        c.lineWidth = 0.1;
        c.strokeRect(-2.3, -1.1, 4.6, 2.2);
        c.restore();
      }
      for (const distance of [50, 100, 150]) {
        const p = point(t.length - distance, -t.width / 2 - 3.3);
        rect(c, p, 4.2, 2, "#e4e6d6");
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        c.fillStyle = "#2f4140";
        c.font = "bold 1.4px monospace";
        c.textAlign = "center";
        c.fillText(String(distance), 0, 0.5);
        c.restore();
      }
      if (street) {
        for (let d = 65; d < t.length; d += 85) {
          const p = point(d, t.width / 2 + 3);
          if (!clear(p.x, p.y, 1)) continue;
          rect(c, p, 0.6, 0.6, "#c1bca1");
          if (night) {
            const gradient = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 17);
            gradient.addColorStop(0, "#f1d4a818");
            gradient.addColorStop(1, "#f1d4a800");
            c.fillStyle = gradient;
            c.beginPath();
            c.arc(p.x, p.y, 17, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
      const scene = {
        ...m,
        canvas,
        density,
        pitStart: pit.entry,
        pitEnd: pit.exit,
      };
      scenes.set(index, scene);
      if (scenes.size > 4) scenes.delete(scenes.keys().next().value);
      return scene;
    },
  };
})();
