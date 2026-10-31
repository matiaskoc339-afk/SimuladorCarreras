"use strict";
(() => {
  const G = RCS;
  const sceneCache = new Map(),
    geometryCache = new Map(),
    cameras = new WeakMap();
  const TAU = Math.PI * 2;
  const hash = (n) => {
    let x = Math.imul((n + 1) ^ 0x9e3779b9, 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  const escape = (v) =>
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
  const shade = (hex, amount) => {
    const v = parseInt(hex.replace("#", ""), 16);
    return (
      "#" +
      [(v >> 16) & 255, (v >> 8) & 255, v & 255]
        .map((n) =>
          Math.round(Math.max(0, Math.min(255, n + amount)))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  };
  function geometry(index) {
    if (geometryCache.has(index)) return geometryCache.get(index);
    const samples = G.Race.track(index),
      length = G.Data.tracks[index].length,
      total = samples.reduce((n, p) => n + p.segment, 0),
      factor = length / total;
    const points = samples.map((p) => ({
      ...p,
      x: p.x * factor,
      y: p.y * 0.66 * factor,
    }));
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y),
      margin = G.Data.tracks[index].modern ? 130 : 100;
    const b = {
      x: Math.min(...xs) - margin,
      y: Math.min(...ys) - margin,
      right: Math.max(...xs) + margin,
      bottom: Math.max(...ys) + margin,
    };
    b.width = b.right - b.x;
    b.height = b.bottom - b.y;
    const value = {
      points,
      factor,
      length,
      bounds: b,
      center: {
        x: points.reduce((n, p) => n + p.x, 0) / points.length,
        y: points.reduce((n, p) => n + p.y, 0) / points.length,
      },
    };
    geometryCache.set(index, value);
    return value;
  }
  function worldPoint(index, progress, lateral = 0) {
    return G.Racecraft.metric(index, progress, lateral);
  }
  function path(c, points, closed = true) {
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    if (closed) c.closePath();
  }
  function curveSection(index, start, end, offset = 0, step = 3) {
    const p = [];
    for (let d = start; d <= end; d += step)
      p.push(worldPoint(index, d, offset));
    return p;
  }
  function stroke(c, points, color, width, dashes = null, closed = true) {
    path(c, points, closed);
    c.strokeStyle = color;
    c.lineWidth = width;
    if (dashes) c.setLineDash(dashes);
    c.stroke();
    if (dashes) c.setLineDash([]);
  }
  function rectangle(c, x, y, w, h, color, angle = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = color;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
  }
  function tree(c, x, y, size, seed) {
    c.save();
    c.translate(x, y);
    c.fillStyle = "#1e2a2540";
    c.beginPath();
    c.ellipse(size * 0.7, size * 0.8, size * 1.1, size * 0.65, 0.3, 0, TAU);
    c.fill();
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5 + seed;
      c.fillStyle = ["#3c503b", "#475d40", "#536644", "#607149", "#4b603f"][i];
      c.beginPath();
      c.arc(
        Math.cos(a) * size * 0.28,
        Math.sin(a) * size * 0.28,
        size * (0.58 + hash(seed + i) * 0.2),
        0,
        TAU,
      );
      c.fill();
    }
    c.restore();
  }
  function building(c, x, y, width, height, angle, kind = "garage") {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = "#19232235";
    c.fillRect(-width / 2 + 3, -height / 2 + 4, width, height);
    c.fillStyle = "#c9cbc3";
    c.fillRect(-width / 2, -height / 2, width, height);
    c.fillStyle = "#e4e5df";
    c.fillRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2);
    c.fillStyle = "#899394";
    c.fillRect(-width / 2, height / 2 - 2, width, 2);
    c.strokeStyle = "#c0c4bd";
    c.lineWidth = 0.5;
    for (let i = -width / 2 + 4; i < width / 2; i += 5) {
      c.beginPath();
      c.moveTo(i, -height / 2);
      c.lineTo(i, height / 2);
      c.stroke();
    }
    if (kind === "garage")
      for (let i = -width / 2 + 5; i < width / 2 - 3; i += 9) {
        c.fillStyle = "#23343b";
        c.fillRect(i, height / 2 - 3, 6, 3);
        c.fillStyle = "#ed6245";
        c.fillRect(i, height / 2 - 3, 1, 3);
      }
    else {
      c.fillStyle = "#657a80";
      for (let i = -width / 2 + 5; i < width / 2 - 4; i += 9)
        c.fillRect(i, -height / 2 + 4, 5, height - 8);
    }
    c.restore();
  }
  function makeScene(index) {
    if (G.Data.tracks[index].modern) return G.ModernScene.build(index);
    if (sceneCache.has(index)) {
      const a = sceneCache.get(index);
      sceneCache.delete(index);
      sceneCache.set(index, a);
      return a;
    }
    const m = geometry(index),
      b = m.bounds,
      density = Math.min(4, 3072 / Math.max(b.width, b.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.ceil(b.width * density);
    canvas.height = Math.ceil(b.height * density);
    const c = canvas.getContext("2d");
    c.scale(density, density);
    c.translate(-b.x, -b.y);
    c.fillStyle = [
      "#7c8660",
      "#808971",
      "#7b8062",
      "#748267",
      "#89906c",
      "#7c8660",
    ][index % 6];
    c.fillRect(b.x, b.y, b.width, b.height);
    // Terreno, sombras y textura generados una sola vez con una semilla visual local.
    for (let i = 0; i < 1050; i++) {
      const x = b.x + hash(i + index * 49) * b.width,
        y = b.y + hash(i * 7 + index * 132) * b.height,
        r = 3 + hash(i * 11 + 91) * 17;
      c.fillStyle = i % 3 === 0 ? "#b2b28c0b" : "#22332608";
      c.beginPath();
      c.ellipse(x, y, r, r * 0.45, hash(i * 15) * TAU, 0, TAU);
      c.fill();
    }
    c.strokeStyle = "#bbba8d10";
    c.lineWidth = 0.4;
    for (let y = b.y; y < b.bottom; y += 5) {
      c.beginPath();
      c.moveTo(b.x, y);
      c.lineTo(b.right, y + 16);
      c.stroke();
    }
    // Vía de servicio y perímetro exterior.
    stroke(c, m.points, "#7d896c", 48);
    stroke(c, m.points, "#758164", 43);
    for (const side of [-1, 1]) {
      stroke(
        c,
        curveSection(index, 0, m.length, side * 23, 4),
        "#92967d",
        2.3,
        null,
        false,
      );
      stroke(
        c,
        curveSection(index, 0, m.length, side * 26, 4),
        "#566b586b",
        0.45,
        null,
        false,
      );
      stroke(
        c,
        curveSection(index, 0, m.length, side * 26, 4),
        "#c0c7b270",
        0.9,
        [0.25, 3.2],
        false,
      );
    }
    // Las curvas disponen de verdaderas escapatorias con grava y barreras de neumáticos.
    const step = m.points.length;
    let last = -40;
    for (let i = 0; i < step; i++)
      if (m.points[i].limit < 35 && i - last > 25) {
        last = i;
        const p = m.points[i],
          cross =
            (p.x - m.center.x) * -Math.sin(p.angle) +
            (p.y - m.center.y) * Math.cos(p.angle),
          side = cross > 0 ? 1 : -1;
        const outer = [],
          inner = [];
        for (let k = -10; k <= 13; k++) {
          const q = m.points[(i + k + step) % step],
            normal = { x: -Math.sin(q.angle), y: Math.cos(q.angle) },
            taper = Math.sin(((k + 10) / 23) * Math.PI);
          inner.push({
            x: q.x + normal.x * side * 8,
            y: q.y + normal.y * side * 8,
          });
          outer.push({
            x: q.x + normal.x * side * (11 + taper * 26),
            y: q.y + normal.y * side * (11 + taper * 26),
          });
        }
        path(c, [...inner, ...outer.reverse()]);
        c.fillStyle = "#c9bd99";
        c.fill();
        c.save();
        c.clip();
        c.strokeStyle = "#a99b7c6b";
        c.lineWidth = 0.35;
        for (let yy = p.y - 60; yy < p.y + 60; yy += 1.1) {
          c.beginPath();
          c.moveTo(p.x - 70, yy);
          c.lineTo(p.x + 70, yy + 12);
          c.stroke();
        }
        c.restore();
        const barriers = curveSection(
          index,
          p.distance - 28,
          p.distance + 36,
          side * 39,
          3,
        );
        stroke(c, barriers, "#56635a", 2.2, null, false);
        stroke(c, barriers, "#d4d5c4", 0.5, [2, 2], false);
      }
    // Asfalto a escala: 12,4 m de ancho frente a coches de unos 4,3 x 1,8 m.
    stroke(c, m.points, "#5b6258", 17);
    stroke(c, m.points, "#b2ada0", 14.4);
    stroke(c, m.points, "#3e4441", 12.4);
    stroke(c, m.points, "#454a46", 9.6);
    stroke(c, m.points, "#20272416", 6.6);
    for (let i = 0; i < 2600; i++) {
      const p = worldPoint(
        index,
        hash(i * 37 + index * 71) * m.length,
        (hash(i * 11 + 4) - 0.5) * 11.8,
      );
      c.fillStyle = i % 3 ? "#1021190e" : "#d3d4b70b";
      c.beginPath();
      c.ellipse(
        p.x,
        p.y,
        0.08 + hash(i) * 0.2,
        0.04 + hash(i * 9) * 0.06,
        p.angle,
        0,
        TAU,
      );
      c.fill();
    }
    // Pianos únicamente en las zonas de curva, no como borde de una pista de karting.
    for (let i = 0; i < step; i++) {
      const p = m.points[i],
        q = m.points[(i + 1) % step];
      if (p.limit > 53) continue;
      const turn = Math.sin(q.angle - p.angle),
        side = turn >= 0 ? 1 : -1,
        nx = -Math.sin(p.angle),
        ny = Math.cos(p.angle),
        nq = { x: -Math.sin(q.angle), y: Math.cos(q.angle) };
      path(c, [
        { x: p.x + nx * 6.2 * side, y: p.y + ny * 6.2 * side },
        { x: q.x + nq.x * 6.2 * side, y: q.y + nq.y * 6.2 * side },
        { x: q.x + nq.x * 7.3 * side, y: q.y + nq.y * 7.3 * side },
        { x: p.x + nx * 7.3 * side, y: p.y + ny * 7.3 * side },
      ]);
      c.fillStyle = Math.floor(p.distance / 3) % 2 ? "#deded2" : "#ad4337";
      c.fill();
    }
    stroke(
      c,
      curveSection(index, 0, m.length, 5.85, 3),
      "#dddcd1",
      0.14,
      null,
      false,
    );
    stroke(
      c,
      curveSection(index, 0, m.length, -5.85, 3),
      "#dddcd1",
      0.14,
      null,
      false,
    );
    // Goma acumulada en la línea de frenada y en los apoyos, sin trazados artificiales animados.
    for (let i = 0; i < step; i += 2)
      if (m.points[i].limit < 43) {
        const p = m.points[i];
        stroke(
          c,
          curveSection(index, p.distance - 35, p.distance + 8, 0.85, 2),
          "#11181717",
          0.38,
          null,
          false,
        );
        stroke(
          c,
          curveSection(index, p.distance - 35, p.distance + 8, -0.85, 2),
          "#11181717",
          0.38,
          null,
          false,
        );
      }
    // Boxes y paddock: una instalación paralela a la recta principal.
    const pitStart = m.length * 0.105,
      pitEnd = m.length * 0.27,
      mid = worldPoint(index, (pitStart + pitEnd) / 2),
      toward =
        (mid.x - m.center.x) * -Math.sin(mid.angle) +
        (mid.y - m.center.y) * Math.cos(mid.angle),
      pitSide = toward >= 0 ? 1 : -1;
    const pit = [];
    for (let k = 0; k <= 50; k++) {
      const t = k / 50,
        offset = Math.sin(Math.PI * t) * 19 * pitSide;
      pit.push(worldPoint(index, pitStart + (pitEnd - pitStart) * t, offset));
    }
    const pad = G.Racecraft.safePlacement(
      index,
      (pitStart + pitEnd) / 2,
      132,
      62,
      pitSide,
      53,
      9,
    );
    rectangle(c, pad.x, pad.y, 132, 62, "#858b80", mid.angle);
    rectangle(c, pad.x, pad.y, 127, 57, "#979c90", mid.angle);
    stroke(c, pit, "#a6aa9d", 8, null, false);
    stroke(c, pit, "#515853", 6.4, null, false);
    stroke(c, pit, "#deddd2", 0.14, [2, 2], false);
    for (let i = 0; i < 10; i++) {
      const progress = pitStart + (pitEnd - pitStart) * (0.32 + (i / 9) * 0.36),
        p = worldPoint(
          index,
          progress,
          Math.sin((0.32 + (i / 9) * 0.36) * Math.PI) * 19 * pitSide,
        );
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.strokeStyle = "#e8e5c980";
      c.lineWidth = 0.12;
      c.strokeRect(-2.5, -1.45, 5, 2.9);
      c.fillStyle = "#b8c8bd";
      c.font = "bold 1.4px monospace";
      c.textAlign = "center";
      c.fillText(String(i + 1).padStart(2, "0"), 0, pitSide * 3.8);
      c.restore();
    }
    const garage = G.Racecraft.safePlacement(
      index,
      (pitStart + pitEnd) / 2,
      115,
      20,
      pitSide,
      33,
      9,
    );
    building(
      c,
      garage.x,
      garage.y,
      115,
      20,
      mid.angle + (pitSide < 0 ? Math.PI : 0),
    );
    c.save();
    c.translate(pad.x, pad.y);
    c.rotate(mid.angle);
    c.strokeStyle = "#d5d5c493";
    c.lineWidth = 0.25;
    for (let x = -55; x < 57; x += 8) {
      c.strokeRect(x, -24, 3.2, 6);
      c.strokeRect(x, 15, 3.2, 6);
      rectangle(
        c,
        x + 1.6,
        -20.7,
        1.7,
        3.9,
        ["#e7e6dd", "#949f9d", "#656f73", "#d6af76"][Math.floor(x + 60) % 4],
      );
    }
    for (let i = 0; i < 4; i++) {
      c.fillStyle = "#e3e4db";
      c.fillRect(-50 + i * 25, -5, 17, 9);
      c.fillStyle = "#bcbbb0";
      c.fillRect(-49 + i * 25, -5, 1, 9);
    }
    c.restore();
    const tower = G.Racecraft.safePlacement(
      index,
      pitStart + 25,
      11,
      18,
      pitSide,
      28,
      10,
    );
    building(c, tower.x, tower.y, 11, 18, tower.angle, "tower");
    // Tribunas, vallas y puestos de comisarios.
    for (let j = 0; j < 3; j++) {
      const prog = m.length * (0.29 + j * 0.23),
        a = worldPoint(index, prog),
        side =
          (a.x - m.center.x) * -Math.sin(a.angle) +
            (a.y - m.center.y) * Math.cos(a.angle) >
          0
            ? 1
            : -1,
        stand = G.Racecraft.safePlacement(index, prog, 52, 15, side, 28, 17);
      c.save();
      c.translate(stand.x, stand.y);
      c.rotate(a.angle);
      c.fillStyle = "#26342e38";
      c.fillRect(-25 + 3, -6 + 3, 50, 15);
      c.fillStyle = "#a5aaa0";
      c.fillRect(-26, -7, 52, 15);
      for (let row = 0; row < 5; row++) {
        c.fillStyle = row % 2 ? "#667975" : "#88998c";
        c.fillRect(-24, -5 + row * 2.4, 48, 1.7);
        for (let seat = 0; seat < 34; seat++) {
          c.fillStyle = ["#c4c1a8", "#596964", "#e0dfce", "#8c6853"][
            Math.floor(hash(seat + row * 39 + j * 130) * 4)
          ];
          c.fillRect(-23 + seat * 1.4, -4.8 + row * 2.4, 0.6, 0.65);
        }
      }
      c.restore();
      const marshal = worldPoint(index, prog - 40, side * 11);
      rectangle(c, marshal.x, marshal.y, 3, 2.5, "#e1dfc8", a.angle);
      rectangle(c, marshal.x, marshal.y, 3, 1, "#d86438", a.angle);
    }
    // Señales de frenada, parrilla y línea de meta.
    for (const marker of [50, 100, 150]) {
      const p = worldPoint(index, m.length - marker, -10);
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.fillStyle = "#f1f0dc";
      c.fillRect(-1.8, -0.65, 3.6, 1.3);
      c.fillStyle = "#27342d";
      c.font = "bold 1.4px monospace";
      c.textAlign = "center";
      c.fillText(String(marker), 0, 0.45);
      c.restore();
    }
    const start = worldPoint(index, 0);
    c.save();
    c.translate(start.x, start.y);
    c.rotate(start.angle);
    for (let x = 0; x < 3; x++)
      for (let y = 0; y < 16; y++) {
        c.fillStyle = (x + y) % 2 ? "#252b29" : "#e4e5d9";
        c.fillRect(x * 0.4 - 0.6, y * 0.775 - 6.2, 0.4, 0.775);
      }
    c.restore();
    for (let i = 0; i < 16; i++) {
      const p = worldPoint(index, -8 - i * 6, i % 2 ? -3.1 : 3.1);
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.angle);
      c.strokeStyle = "#d6d9c788";
      c.lineWidth = 0.13;
      c.strokeRect(-2.5, -1.1, 5, 2.2);
      c.restore();
    }
    // Vegetación apartada de la pista y vías de servicio.
    for (let i = 0; i < 170; i++) {
      const x = b.x + hash(i * 19 + index * 409) * b.width,
        y = b.y + hash(i * 31 + index * 419) * b.height;
      const nearest = m.points.reduce(
        (n, p) => Math.min(n, Math.hypot(p.x - x, p.y - y)),
        Infinity,
      );
      if (nearest < 42 || Math.hypot(x - pad.x, y - pad.y) < 95) continue;
      tree(c, x, y, 3 + hash(i * 23) * 4, i + index * 100);
    }
    // Vallado discreto del paddock.
    c.save();
    c.translate(pad.x, pad.y);
    c.rotate(mid.angle);
    c.strokeStyle = "#495b5280";
    c.lineWidth = 0.5;
    c.strokeRect(-69, -34, 138, 68);
    c.setLineDash([0.3, 3]);
    c.lineWidth = 1.1;
    c.strokeRect(-69, -34, 138, 68);
    c.restore();
    const result = { canvas, density, ...m, pitStart, pitEnd };
    sceneCache.set(index, result);
    while (sceneCache.size > 2)
      sceneCache.delete(sceneCache.keys().next().value);
    return result;
  }
  function chooseFocus(r, options) {
    if (!r?.entrants.length) return null;
    if (options.focusId) {
      const a = r.entrants.find(
        (a) =>
          a.companyId === options.focusId ||
          a.carId === options.focusId ||
          a.driverId === options.focusId,
      );
      if (a) return a;
    }
    const active = r.entrants.filter((a) => !a.dnf && a.finishTime === null);
    if (options.mode === "broadcast") {
      const event = (r.events || [])
        .filter(
          (e) =>
            r.time - e.time < 5 &&
            [
              "contact",
              "collision",
              "crash",
              "retirement",
              "spin",
              "slide",
              "offtrack",
              "pit-in",
              "pit-box",
              "pit-out",
              "puncture",
            ].includes(e.type),
        )
        .sort((a, b) => b.time - a.time)[0];
      if (event) {
        const a = r.entrants.find((a) => event.carIds?.includes(a.carId));
        if (a) return a;
      }
      const player = active.find((a) => a.companyId === "player");
      const order = [...active].sort((a, b) => b.progress - a.progress);
      let focus = order[0],
        best = Infinity;
      for (let i = 1; i < order.length; i++) {
        const gap = order[i - 1].progress - order[i].progress;
        const score =
          gap *
          (order[i].companyId === "player" ||
          order[i - 1].companyId === "player"
            ? 0.65
            : 1);
        if (gap < 70 && score < best) {
          best = score;
          focus = order[i];
        }
      }
      return (best < Infinity ? focus : player || order[0]) || r.entrants[0];
    }
    return (
      active.find((a) => a.companyId === "player") ||
      active[0] ||
      r.entrants.find((a) => a.companyId === "player") ||
      r.entrants[0]
    );
  }
  function carCanvas(c, a, position, scale, logo, number) {
    const length =
        a.length ||
        (a.shape === "roadster" ? 3.95 : a.shape === "coupe" ? 4.35 : 4.15),
      width = a.width || 1.78,
      slip = Number.isFinite(a.headingSlip) ? a.headingSlip : 0,
      paint = a.dnf ? "#747b75" : a.color,
      design = G.Art.carProfile(a);
    c.save();
    c.translate(position.x, position.y);
    c.rotate(position.angle + slip);
    if (G.GrandArt?.race(c, a, length, width, number, logo, position.steering || 0)) {
      c.restore();
      return;
    }
    // La silueta y las proporciones son métricas y no varían con el tamaño del viewport.
    c.fillStyle = "#08100f46";
    c.beginPath();
    c.roundRect(-length * 0.5 + 0.28, -width * 0.5 + 0.24, length, width, 0.32);
    c.fill();
    c.fillStyle = "#121b19";
    for (const x of [-length * 0.29, length * 0.28])
      for (const y of [-width * 0.49, width * 0.49]) {
        c.save();
        c.translate(x, y);
        if (x > 0) c.rotate(position.steering || 0);
        c.fillRect(-0.25, -0.14, 0.5, 0.28);
        c.restore();
      }
    const grad = c.createLinearGradient(0, -width * 0.5, 0, width * 0.5);
    grad.addColorStop(0, shade(paint, 34));
    grad.addColorStop(0.25, paint);
    grad.addColorStop(0.74, shade(paint, -13));
    grad.addColorStop(1, shade(paint, -47));
    c.fillStyle = grad;
    G.Art.bodyCanvas(c, design, length, width);
    c.fill();
    c.strokeStyle = shade(paint, 52);
    c.lineWidth = 0.045;
    c.stroke();
    const frontRoof = design.frontRoof,
      rearRoof = design.rearRoof;
    c.fillStyle = "#122a33";
    c.beginPath();
    c.moveTo(length * 0.28, -width * 0.35);
    c.lineTo(length * 0.3, width * 0.35);
    c.lineTo(length * frontRoof, width * 0.4);
    c.lineTo(length * frontRoof, -width * 0.4);
    c.closePath();
    c.fill();
    c.fillStyle = design.open ? "#1b2424" : shade(paint, -3);
    c.fillRect(
      length * rearRoof,
      -width * 0.34,
      length * (frontRoof - rearRoof),
      width * 0.68,
    );
    if (design.open) {
      c.fillStyle = "#836650";
      c.beginPath();
      c.ellipse(-length * 0.13, -width * 0.16, 0.32, 0.2, 0, 0, TAU);
      c.ellipse(-length * 0.13, width * 0.16, 0.32, 0.2, 0, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = "#19313a";
      c.beginPath();
      c.moveTo(length * (rearRoof - 0.03), -width * 0.34);
      c.lineTo(length * (rearRoof - 0.03), width * 0.34);
      c.lineTo(-length * 0.44, width * 0.27);
      c.lineTo(-length * 0.44, -width * 0.27);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = "#a4b6b663";
    c.lineWidth = 0.035;
    c.beginPath();
    c.moveTo(length * 0.25, -width * 0.29);
    c.lineTo(length * 0.2, width * 0.28);
    c.stroke();
    c.fillStyle = "#f0ede0";
    c.fillRect(length * 0.45, -width * 0.34, 0.08, width * 0.2);
    c.fillRect(length * 0.45, width * 0.14, 0.08, width * 0.2);
    c.fillStyle = a.braking ? "#ff4c2e" : "#a43c30";
    c.fillRect(-length * 0.49, -width * 0.34, 0.075, width * 0.22);
    c.fillRect(-length * 0.49, width * 0.12, 0.075, width * 0.22);
    if (a.braking) {
      c.fillStyle = "#ff4b2b1c";
      c.beginPath();
      c.ellipse(-length * 0.58, 0, 0.45, width * 0.6, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = shade(paint, -35);
    c.fillRect(length * 0.09, -width * 0.57, 0.27, 0.12);
    c.fillRect(length * 0.09, width * 0.45, 0.27, 0.12);
    G.Art.canvas(c, a, length, width);
    c.fillStyle = "#eeeade";
    c.fillRect(-length * 0.16, -width * 0.27, 0.68, 0.54);
    c.fillStyle = "#1a2528";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold .45px monospace";
    c.save();
    c.translate(-length * 0.075, 0);
    c.rotate(Math.PI / 2);
    c.fillText(String(number).padStart(2, "0"), 0, 0);
    c.restore();
    if (logo?.complete && a.companyId === "player")
      c.drawImage(logo, length * 0.32 - 0.22, -0.22, 0.44, 0.44);
    if ((a.components?.body ?? 100) < 65) {
      c.strokeStyle = "#b7b9b1a0";
      c.lineWidth = 0.07;
      c.beginPath();
      c.moveTo(length * 0.38, -width * 0.15);
      c.lineTo(length * 0.31, width * 0.25);
      c.moveTo(-length * 0.42, width * 0.05);
      c.lineTo(-length * 0.32, width * 0.31);
      c.stroke();
    }
    for (const [i, mark] of (a.sponsors || []).slice(0, 3).entries()) {
      c.fillStyle = mark.color;
      c.fillRect(length * 0.3 - i * 0.22, -width * 0.22, 0.18, width * 0.44);
    }
    if (a.dnf) {
      c.fillStyle = "#111b1b88";
      c.fillRect(-length * 0.5, -width * 0.4, length, width * 0.8);
    }
    c.restore();
  }
  const visualEffects = new WeakMap();
  function effects(c, r, index) {
    if (!r) return;
    let fx = visualEffects.get(r);
    if (!fx) {
      fx = { lastStep: -1, lastPoints: new Map(), trails: [] };
      visualEffects.set(r, fx);
    }
    if (fx.lastStep !== r.step) {
      for (const a of r.entrants) {
        const p = worldPoint(
            index,
            a.progress,
            Number.isFinite(a.lateral)
              ? a.lateral
              : (a.lane || 0) * geometry(index).factor,
          ),
          slip = Math.abs(a.headingSlip || 0),
          sliding =
            slip > 0.13 ||
            a.incident === "spin" ||
            a.incident === "slide" ||
            Math.abs(a.skills?.rotation || 0) > 0.02 ||
            (a.skills?.execution.kind === "lock" &&
              a.skills.execution.until > r.time);
        if (sliding && !a.dnf) {
          const old = fx.lastPoints.get(a.carId);
          if (old && Math.hypot(old.x - p.x, old.y - p.y) < 30)
            fx.trails.push({
              x: old.x,
              y: old.y,
              toX: p.x,
              toY: p.y,
              angle: p.angle,
              time: r.time,
            });
        }
        fx.lastPoints.set(a.carId, p);
      }
      fx.lastStep = r.step;
      fx.trails = fx.trails.filter((t) => r.time - t.time < 50).slice(-420);
    }
    for (const t of fx.trails) {
      c.strokeStyle = `rgba(13,20,18,${Math.max(0.08, 0.36 - (r.time - t.time) * 0.004)})`;
      c.lineWidth = 0.2;
      for (const lane of [-0.65, 0.65]) {
        c.beginPath();
        c.moveTo(
          t.x - Math.sin(t.angle) * lane,
          t.y + Math.cos(t.angle) * lane,
        );
        c.lineTo(
          t.toX - Math.sin(t.angle) * lane,
          t.toY + Math.cos(t.angle) * lane,
        );
        c.stroke();
      }
    }
    for (const a of r.entrants) {
      const active =
        a.incidentUntil > r.time || a.offTrack || a.incident === "spin";
      if (!active && !a.dnf) continue;
      const p = worldPoint(
          index,
          a.progress,
          Number.isFinite(a.lateral)
            ? a.lateral
            : (a.lane || 0) * geometry(index).factor,
        ),
        dust = a.offTrack && a.speed > 2,
        smoke =
          (a.speed > 2 &&
            (a.incident === "spin" || Math.abs(a.headingSlip || 0) > 0.25)) ||
          (a.dnf && (a.components?.engine ?? 100) < 30);
      if (dust || smoke)
        for (let i = 0; i < 10; i++) {
          const life = (r.time * 0.7 + i * 0.13) % 1,
            spread = 1 + life * 4,
            behind = 1 + life * 8,
            jitter = (hash(i * 29 + a.carId.length) - 0.5) * spread * 2;
          c.fillStyle = dust
            ? `rgba(177,158,118,${(1 - life) * 0.24})`
            : `rgba(199,208,201,${(1 - life) * 0.2})`;
          c.beginPath();
          c.ellipse(
            p.x - Math.cos(p.angle) * behind - Math.sin(p.angle) * jitter,
            p.y - Math.sin(p.angle) * behind + Math.cos(p.angle) * jitter,
            spread,
            spread * 0.6,
            hash(i * 13) * TAU,
            0,
            TAU,
          );
          c.fill();
        }
      if (a.incident === "contact" && a.incidentUntil - r.time > 0.7) {
        c.strokeStyle = "#ffd89a";
        c.lineWidth = 0.08;
        for (let i = 0; i < 5; i++) {
          const ang = hash(i * 41 + Math.floor(r.time * 20)) * TAU;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(
            p.x + Math.cos(ang) * (1 + hash(i * 7) * 2),
            p.y + Math.sin(ang) * (1 + hash(i * 7) * 2),
          );
          c.stroke();
        }
      }
    }
  }
  function wetSurface(c, r, index, scene) {
    const wet = r?.weather?.wetness || 0;
    if (wet < 0.02) return;
    stroke(c, scene.points, `rgba(40,66,80,${wet * 0.45})`, 12.2);
    for (let i = 0; i < scene.points.length; i += 7)
      if (hash(i + index * 173) > 0.48) {
        const p = worldPoint(
          index,
          scene.points[i].distance,
          (hash(i + 7) - 0.5) * 8,
        );
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        c.fillStyle = `rgba(167,192,198,${wet * 0.28})`;
        c.beginPath();
        c.ellipse(
          0,
          0,
          2 + hash(i + 3) * 5,
          0.3 + hash(i + 5) * 0.5,
          0,
          0,
          TAU,
        );
        c.fill();
        c.restore();
      }
  }
  function pitCrew(c, r, a, index) {
    if (a.pit?.phase !== "box" || a.speed > 0.5 || a.dnf) return;
    const p = worldPoint(index, a.progress, a.lateral);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle);
    for (const [i, x] of [-1.3, 1.3].entries())
      for (const side of [-1, 1]) {
        const y = side * (1.55 + Math.sin(r.time * 4 + i) * 0.05);
        c.fillStyle = "#10202755";
        c.beginPath();
        c.ellipse(x + 0.15, y + 0.1, 0.45, 0.3, 0, 0, TAU);
        c.fill();
        c.fillStyle = a.color;
        c.fillRect(x - 0.28, y - 0.23, 0.55, 0.45);
        c.fillStyle = "#d5d7c9";
        c.beginPath();
        c.arc(x, y, 0.19, 0, TAU);
        c.fill();
        c.strokeStyle = "#d9ddd1";
        c.lineWidth = 0.12;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 0.3 * Math.sin(r.time * 3), y - side * 0.5);
        c.stroke();
      }
    c.restore();
  }
  function rainfall(c, r, w, h, dpr) {
    const rain = r?.weather?.rain || 0;
    if (rain < 0.02) return;
    c.save();
    c.fillStyle = `rgba(17,36,52,${rain * 0.15})`;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = `rgba(207,230,239,${0.12 + rain * 0.16})`;
    c.lineWidth = 0.8 * dpr;
    for (let i = 0; i < Math.ceil(90 * rain); i++) {
      const x =
          ((hash(i * 13) * w + r.time * 170 * dpr) % (w + 20 * dpr)) - 10 * dpr,
        y =
          ((hash(i * 43) * h + r.time * 390 * dpr) % (h + 30 * dpr)) - 15 * dpr;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 4 * dpr, y + 11 * dpr);
      c.stroke();
    }
    c.restore();
  }
  G.Render = {
    worldPoint,
    metrics: geometry,
    carSVG(car, number = "01") {
      const hatch = car.shape === "hatch",
        roadster = car.shape === "roadster",
        bmw = car.brand === "BMW",
        coupe = car.shape === "coupe",
        paint = car.color || "#cf6248",
        id = escape(car.id || "car"),
        design = G.Art.carProfile(car);
      const body = design.body,
        wind = design.wind,
        rear = design.rear;
      return `<svg viewBox="0 0 240 440" aria-label="Ilustración original del ${escape(car.brand)} ${escape(car.model)}" role="img"><defs><linearGradient id="paint-${id}" x1="0" x2="1" y1=".1" y2=".15"><stop stop-color="${shade(paint, -40)}"/><stop offset=".16" stop-color="${shade(paint, 22)}"/><stop offset=".48" stop-color="${paint}"/><stop offset=".83" stop-color="${shade(paint, -8)}"/><stop offset="1" stop-color="${shade(paint, -52)}"/></linearGradient><linearGradient id="glass-${id}" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#8ca9b4"/><stop offset=".24" stop-color="#3a515c"/><stop offset=".65" stop-color="#152934"/><stop offset="1" stop-color="#091c24"/></linearGradient></defs><ellipse cx="125" cy="235" rx="91" ry="192" fill="#020707" opacity=".23"/><ellipse cx="130" cy="230" rx="80" ry="180" fill="#020707" opacity=".15"/><g><g fill="#11191d" stroke="#3c4442" stroke-width="2"><rect x="34" y="87" width="21" height="56" rx="5"/><rect x="185" y="87" width="21" height="56" rx="5"/><rect x="35" y="295" width="21" height="61" rx="5"/><rect x="184" y="295" width="21" height="61" rx="5"/></g><path d="${body}" fill="url(#paint-${id})" stroke="${shade(paint, -32)}" stroke-width="2"/><path d="M59 77Q120 50 181 77M57 348Q120 369 183 348" fill="none" stroke="${shade(paint, -25)}" stroke-width="2"/><path d="M60 86L64 141M180 86L176 141" stroke="${shade(paint, 45)}" stroke-opacity=".65" stroke-width="2"/><path d="${wind}" fill="url(#glass-${id})" stroke="#13242b" stroke-width="4"/><path d="M75 ${roadster ? 192 : 155}Q120 ${roadster ? 181 : 143} 164 ${roadster ? 193 : 155}" stroke="#b8c7c0" stroke-opacity=".5" stroke-width="2" fill="none"/>${roadster ? '<path d="M73 229H167V287H73Z" fill="#15232a"/><g fill="#b19a78" stroke="#554e42" stroke-width="2"><rect x="80" y="232" width="30" height="46" rx="10"/><rect x="130" y="232" width="30" height="46" rx="10"/></g><path d="M77 279H163" stroke="#c3c8bc" stroke-width="6"/>' : `<path d="M76 202L164 202L166 283L74 283Z" fill="${shade(paint, 7)}" stroke="${shade(paint, -25)}" stroke-width="2"/><path d="M66 188L71 280L58 296L57 198ZM174 188L169 280L182 296L183 198Z" fill="url(#glass-${id})" stroke="#11232c" stroke-width="2"/><path d="M81 208V279M160 208V279" stroke="${shade(paint, 35)}" stroke-opacity=".5" stroke-width="1.5"/>`}<path d="${rear}" fill="url(#glass-${id})" stroke="#17282e" stroke-width="4"/><path d="M75 312L163 323" stroke="#9ab1b7" stroke-opacity=".28" stroke-width="2"/><g fill="${paint}" stroke="${shade(paint, -40)}" stroke-width="2"><path d="M48 181L35 187L35 200L53 197ZM192 181L205 187L205 200L187 197Z"/></g>${bmw ? '<path d="M82 57H116V73H82ZM124 57H158V73H124Z" fill="#1b2b2e"/><path d="M64 80H91V91H64ZM149 80H176V91H149Z" fill="#e1e4d9"/>' : roadster ? '<path d="M62 67Q73 48 89 63L85 79L63 81ZM178 67Q167 48 151 63L155 79L177 81Z" fill="#e5e9dc" stroke="#bcc9c4" stroke-width="2"/>' : '<path d="M59 73L93 58L90 79L59 88ZM181 73L147 58L150 79L181 88Z" fill="#e5eadc" stroke="#b5c3c1" stroke-width="2"/>'}<path d="M70 105L170 105" stroke="#172b30" stroke-width="7"/><path d="M81 111L159 111" stroke="#bec7b0" stroke-opacity=".5" stroke-width="1"/><path d="M66 380L88 380L91 391L65 390ZM174 380L152 380L149 391L175 390Z" fill="#a43c34" stroke="#e58367" stroke-width="1.5"/><path d="M78 401H162" stroke="#1a2b30" stroke-width="7"/><path d="M102 44V${roadster ? 180 : 135}M112 43V${roadster ? 179 : 134}" stroke="#e5e9db" stroke-opacity=".75" stroke-width="5"/><path d="M109 349V374M119 352V375" stroke="#e5e9db" stroke-opacity=".72" stroke-width="4"/>${roadster ? "" : `<rect x="92" y="220" width="56" height="52" rx="3" fill="#edf0e6"/><text x="120" y="256" text-anchor="middle" fill="#182b32" font-size="35" font-family="Arial,sans-serif" font-style="italic" font-weight="800">${escape(number)}</text>`}<path d="${car.installed?.aero ? "M31 363H209" : "M60 361H180"}" stroke="#15252c" stroke-width="${car.installed?.aero ? 13 : 7}"/><path d="${car.installed?.aero ? "M38 359H202" : "M65 359H175"}" stroke="#637477" stroke-width="2"/>${(car.components?.body ?? 100) < 65 ? '<path d="M165 73L175 98M168 78L180 103M58 330L78 346M60 338L82 355" stroke="#c7c9bc" stroke-width="2" opacity=".8"/>' : ""}<g fill="#212f31"><rect x="58" y="224" width="4" height="17" rx="2"/><rect x="178" y="224" width="4" height="17" rx="2"/></g></g>${G.Art.overlay(car)}</svg>`;
    },
    headquarters(s) {
      const name = escape(G.player(s).name),
        fleet = G.ownedCars(s),
        company = G.player(s),
        site = G.Facilities.site(s),
        b = site.buildings;
      const dept = (x, y, w, h, title, sub, target, no) =>
        `<g class="building" tabindex="0" role="button" aria-label="${title}" data-go="${target}" transform="translate(${x} ${y})"><rect x="-7" y="-7" width="${w + 14}" height="${h + 64}" rx="6" fill="transparent"/><rect x="7" y="8" width="${w}" height="${h}" rx="3" fill="#1e2b322c"/><rect width="${w}" height="${h}" rx="3" fill="#cbd0cb" stroke="#a6b0aa"/><rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="2" fill="#e5e9e2"/>${Array.from({ length: Math.floor(w / 19) }, (_, i) => `<path d="M${12 + i * 19} 5V${h - 5}" stroke="#bdc6be" stroke-width="1"/>`).join("")}<rect x="10" y="${h - 8}" width="${w - 20}" height="8" fill="#26383f"/><rect x="10" y="${h - 8}" width="${w - 20}" height="2" fill="#ee6149"/><rect x="${w - 39}" y="12" width="25" height="14" rx="2" fill="#6e858a"/><path d="M${w - 36} 15H${w - 17}M${w - 36} 19H${w - 17}M${w - 36} 23H${w - 17}" stroke="#a5b6b6" stroke-width="1"/><circle cx="14" cy="${h + 25}" r="11" fill="#ed563e"/><text x="14" y="${h + 29}" text-anchor="middle" fill="white" font-family="monospace" font-size="10" font-weight="700">${no}</text><text x="33" y="${h + 25}" style="fill:#24343a;font-family:Arial,sans-serif;font-size:15px;font-weight:700">${title}</text><text x="33" y="${h + 42}" style="fill:#72837b;font-family:monospace;font-size:8px;letter-spacing:1px">${sub}</text></g>`;
      return `<svg class="hq-map" viewBox="0 0 960 545" role="group" aria-label="Sede de ${name}: selecciona un edificio"><defs><pattern id="yard-lines" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#b5beb2" stroke-opacity=".35" stroke-width=".8"/></pattern><linearGradient id="hq-ground" x2="1" y2="1"><stop stop-color="#c5cdbd"/><stop offset="1" stop-color="#a5b29f"/></linearGradient></defs><rect width="960" height="545" fill="url(#hq-ground)"/><path d="M-50 455L1010 95" stroke="#6c7971" stroke-width="48"/><path d="M-50 455L1010 95" stroke="#d4d8c8" stroke-width="1.5" stroke-dasharray="20 17"/><path d="M-50 455L1010 95" stroke="#e6e7d2" stroke-width="1" transform="translate(0 19)"/><path d="M-50 455L1010 95" stroke="#e6e7d2" stroke-width="1" transform="translate(0 -19)"/><path d="M85 63L786 46L891 387L157 489Z" fill="#a0aca1"/><path d="M101 75L776 59L873 379L169 474Z" fill="#d6dccf" stroke="#8d9d91" stroke-width="2"/><path d="M101 75L776 59L873 379L169 474Z" fill="url(#yard-lines)"/><path d="M298 342L317 435L647 390L660 322" fill="none" stroke="#909d92" stroke-width="37"/><path d="M305 343L324 433L647 390L660 322" fill="none" stroke="#e7e7d3" stroke-width="1.5" stroke-dasharray="12 10"/><g fill="#52735a" opacity=".88"><circle cx="92" cy="45" r="19"/><circle cx="79" cy="73" r="16"/><circle cx="812" cy="49" r="18"/><circle cx="839" cy="74" r="20"/><circle cx="884" cy="411" r="17"/><circle cx="856" cy="439" r="21"/><circle cx="168" cy="505" r="17"/><circle cx="139" cy="480" r="20"/></g>${dept(155, 132, 229 + (b.garage - 1) * 8, 140, "Garaje", "N" + b.garage + " · " + fleet.length + "/" + company.carCapacity + " VEHÍCULOS", "garage", "01")}${dept(447, 92, 181 + (b.office - 1) * 8, 96, "Administración", "N" + b.office + " · " + company.driverCapacity + " PLAZAS DE PILOTO", "finance", "02")}${dept(681, 160, 126, 87, "Pilotos", "PLANTILLA · FICHAJES", "team", "03")}${dept(606, 339, 181, 85, "Estrategia", "CALENDARIO · COMPETICIÓN", "competition", "04")}<g class="building" data-go="workshop" role="button" tabindex="0" aria-label="Taller de modificaciones"><rect x="183" y="148" width="80" height="92" fill="#36525b"/><path d="M191 158H255M191 169H255M191 180H255M191 191H255M191 202H255M191 213H255M191 224H255" stroke="#91a4a0" stroke-width="2"/><rect x="181" y="241" width="83" height="23" fill="#ed563e"/><text x="222" y="257" text-anchor="middle" fill="white" font-size="11" font-family="Arial,sans-serif" font-weight="700">TALLER ↗</text></g><g fill="#83928a"><rect x="399" y="139" width="17" height="44"/><rect x="399" y="194" width="17" height="44"/><rect x="817" y="214" width="16" height="40"/></g><g stroke="#f6f4e7" stroke-width="1.5" fill="none">${Array.from({ length: 8 }, (_, i) => `<path d="M${420 + i * 22} 233V274H${440 + i * 22}V233"/>`).join("")}</g><g fill="#909e90"><rect x="693" y="94" width="82" height="38"/><rect x="701" y="99" width="65" height="23" fill="#bac4b9"/><path d="M705 103H761M705 108H761M705 113H761M705 118H761" stroke="#637a70"/></g>${dept(190, 375, 106 + (b.warehouse - 1) * 8, 58, "Almacén", "N" + b.warehouse + " · " + company.sparesCapacity + " REPUESTOS", "facilities", "05")}<g aria-label="Taller nivel ${b.workshop}"><rect x="175" y="112" width="102" height="23" rx="3" fill="#263b42"/><text x="226" y="127" text-anchor="middle" fill="#f4f1e6" font-family="Arial" font-size="10">TALLER N${b.workshop} · ${G.Facilities.bays(s)} BAHÍAS</text></g>${site.project ? `<g class="building" data-go="facilities" role="button" tabindex="0" aria-label="Consultar obra en curso"><rect x="431" y="294" width="148" height="55" rx="4" fill="#efc973" stroke="#846b36" stroke-dasharray="5 3"/><path d="M439 302H571M439 340H571" stroke="#8d7235" stroke-dasharray="9 5"/><text x="505" y="317" text-anchor="middle" fill="#3e3828" font-family="Arial" font-size="10" font-weight="700">OBRAS · ${G.Facilities.definitions[site.project.key].name.toUpperCase()}</text><text x="505" y="333" text-anchor="middle" fill="#3e3828" font-family="monospace" font-size="10">${site.project.end - s.day} DÍAS</text></g>` : ""}${fleet
        .slice(0, 5)
        .map(
          (car, i) =>
            `<g class="hq-car" transform="translate(${284 + i * 45} ${301 + i * 7}) rotate(13)"><ellipse cx="15" cy="30" rx="17" ry="31" fill="#1b2b3240"/><rect x="1" y="0" width="25" height="54" rx="7" fill="${car.color}" stroke="#4d5b58"/><path d="M4 14H23L21 24H6Z" fill="#233e49"/><rect x="6" y="27" width="15" height="12" rx="2" fill="#f0eee1"/><path d="M4 41H23L22 48H5Z" fill="#233e49"/><path d="M4 5H10M17 5H23" stroke="#f7f6e6" stroke-width="3"/></g>`,
        )
        .join(
          "",
        )}<g transform="translate(73 141)"><path d="M0 0L9 41M-11 3L-1 43" stroke="#f2ede0" stroke-width="2"/><rect x="-18" y="0" width="30" height="16" fill="#f2f0df"/><text x="-3" y="12" text-anchor="middle" fill="#263c42" font-size="11" font-family="Arial,sans-serif" font-weight="700">R/C</text></g><path d="M121 78L760 65L861 375L179 465" fill="none" stroke="#758b7a" stroke-width="2" stroke-dasharray="2 9"/><g class="building" data-go="staff" role="button" tabindex="0" aria-label="Personal de la compañía"><rect x="447" y="63" width="190" height="23" rx="3" fill="#36525b"/><text x="542" y="79" text-anchor="middle" fill="#f4f1e6" font-family="Arial" font-size="10">PERSONAL · ${G.Staff.owned(s).length}/${G.Staff.capacity(s)} PROFESIONALES</text></g><text x="28" y="31" fill="#526958" font-family="monospace" font-size="10" letter-spacing="2">SEVILLA / PARQUE MOTOR</text><text x="929" y="518" text-anchor="end" fill="#536e5e" font-family="monospace" font-size="10">SEDE ÚNICA · NIVEL ${G.player(s).level}</text></svg>`;
    },
    fit(canvas) {
      const box = canvas.getBoundingClientRect(),
        dpr = Math.min(globalThis.devicePixelRatio || 1, 2),
        w = Math.max(1, Math.round(box.width * dpr)),
        h = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return {
        ctx: canvas.getContext("2d"),
        w,
        h,
        dpr,
        cssW: box.width,
        cssH: box.height,
      };
    },
    cameraInfo(canvas, r, index, options = {}) {
      const state = cameras.get(canvas);
      return state
        ? {
            mode: state.mode,
            focusId: state.focusId,
            scale: state.scale,
            roadWidth: r?.trackWidth || 12.4,
            length: G.Data.tracks[index].length,
          }
        : null;
    },
    track(canvas, r = null, index = 0, logo = null, follow = false) {
      const opt =
        typeof follow === "object" && follow
          ? { mode: "broadcast", zoom: 1, ...follow }
          : { mode: follow ? "follow" : "overview", zoom: 1 };
      const { ctx: c, w, h, dpr, cssW, cssH } = this.fit(canvas);
      if (!cssW || !cssH) return;
      const scene = makeScene(index),
        b = scene.bounds,
        focus = chooseFocus(r, opt),
        mode = opt.mode || "broadcast",
        zoom = G.clamp(Number(opt.zoom) || 1, 0.65, 2.5),
        now = performance.now() / 1000;
      let cam = cameras.get(canvas);
      if (!cam) {
        cam = {
          cx: scene.center.x,
          cy: scene.center.y,
          scale: 1,
          last: now,
          mode: null,
          focusId: null,
        };
        cameras.set(canvas, cam);
      }
      const elapsed = Math.min(0.1, Math.max(0.005, now - cam.last));
      cam.last = now;
      let targetX = scene.center.x,
        targetY = scene.center.y,
        scale = Math.min(cssW / (b.width + 5), cssH / (b.height + 5)) * dpr,
        rotation = 0;
      if (mode !== "overview" && focus) {
        const lateral = Number.isFinite(focus.lateral)
            ? focus.lateral
            : (focus.lane || 0) * scene.factor,
          lookahead = r?.dynamicsVersion
            ? 12
            : cssW < 600
              ? mode === "follow"
                ? 10
                : 14
              : mode === "follow"
                ? 20
                : 30,
          p = worldPoint(index, focus.progress + lookahead, lateral * 0.5);
        targetX = p.x;
        targetY = p.y;
        scale =
          Math.min(
            cssW /
              (cssW < 600
                ? mode === "follow"
                  ? 80
                  : 100
                : mode === "follow"
                  ? 140
                  : 190),
            cssH / (mode === "follow" ? 110 : 150),
          ) *
          dpr *
          zoom;
        rotation = mode === "broadcast" ? -0.1 : 0;
      }
      const jumped =
          opt.snap === true ||
          cam.mode !== mode ||
          cam.track !== index ||
          !Number.isFinite(cam.cx) ||
          (mode === "broadcast" &&
            cam.focusId !== focus?.companyId &&
            Math.hypot(targetX - cam.cx, targetY - cam.cy) > 150),
        ease = jumped
          ? 1
          : 1 - Math.exp(-elapsed * (r?.dynamicsVersion ? 9 : 3.6));
      cam.cx += (targetX - cam.cx) * ease;
      cam.cy += (targetY - cam.cy) * ease;
      cam.scale +=
        (scale - cam.scale) * (jumped ? 1 : 1 - Math.exp(-elapsed * 4));
      cam.mode = mode;
      cam.track = index;
      cam.focusId = focus?.companyId || null;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#6a775b";
      c.fillRect(0, 0, w, h);
      c.save();
      c.translate(w / 2, h / 2);
      c.rotate(rotation);
      c.scale(cam.scale, cam.scale);
      c.translate(-cam.cx, -cam.cy);
      c.drawImage(scene.canvas, b.x, b.y, b.width, b.height);
      wetSurface(c, r, index, scene);
      effects(c, r, index);
      const cautions =
        r?.cautions?.filter((zone) => zone.until > r.time) ||
        (r && r.yellowUntil > r.time
          ? [{ progress: r.yellowProgress || 0 }]
          : []);
      for (const zone of cautions) {
        const p = worldPoint(index, zone.progress, -10);
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        c.fillStyle = "#f2cc42";
        c.fillRect(-1, -1, 2.7, 1.7);
        c.fillStyle = "#2f3428";
        c.fillRect(-1.3, -1, 0.25, 3.6);
        c.restore();
      }
      if (r)
        for (const [i, a] of [...r.entrants]
          .sort((a, b) => a.progress - b.progress)
          .entries()) {
          const lateral = Number.isFinite(a.lateral)
              ? a.lateral
              : (a.lane || 0) * scene.factor,
            p = worldPoint(index, a.progress, lateral);
          if (r.dynamicsVersion)
            p.steering = G.clamp(
              G.Racecraft.sample(index, a.progress + 5).curvature *
                (a.length || 4) *
                0.65 -
                (a.headingSlip || 0) * 0.6,
              -0.45,
              0.45,
            );
          if (
            r.skillsVersion &&
            opt.showLine &&
            (a === focus || a.companyId === "player")
          ) {
            c.save();
            c.strokeStyle = "#dbeab499";
            c.lineWidth = 0.22;
            c.setLineDash([1.3, 1.3]);
            c.beginPath();
            for (let look = 2; look <= 55; look += 3) {
              const mix = Math.min(1, look / 28),
                lane = a.lateral + (a.skills.plannedLane - a.lateral) * mix,
                point = worldPoint(index, a.progress + look, lane);
              if (look === 2) c.moveTo(point.x, point.y);
              else c.lineTo(point.x, point.y);
            }
            c.stroke();
            c.restore();
          }
          carCanvas(c, a, p, cam.scale, logo, r.entrants.indexOf(a) + 1);
          pitCrew(c, r, a, index);
          if (mode === "overview") {
            c.fillStyle = a.companyId === "player" ? "#f45a3e" : a.color;
            c.strokeStyle = "#eef3e2";
            c.lineWidth = 0.7 / cam.scale;
            c.beginPath();
            c.arc(
              p.x,
              p.y,
              ((a.companyId === "player" ? 4.2 : 2.3) * dpr) / cam.scale,
              0,
              TAU,
            );
            c.fill();
            c.stroke();
          } else if (a === focus || a.companyId === "player") {
            c.save();
            c.translate(p.x, p.y);
            c.rotate(-rotation);
            c.fillStyle = a.companyId === "player" ? "#ed5b3c" : "#eff0db";
            c.strokeStyle = "#142027";
            c.lineWidth = 0.15;
            c.beginPath();
            c.moveTo(0, -3.1);
            c.lineTo(-0.85, -4.7);
            c.lineTo(0.85, -4.7);
            c.closePath();
            c.fill();
            c.stroke();
            c.restore();
          }
        }
      // Nombre del trazado pintado en una zona de paddock, no sobre la línea de carrera.
      if (mode === "overview") {
        c.save();
        c.translate(scene.center.x, scene.center.y);
        c.fillStyle = "#344b3f66";
        c.font = "700 11px Arial,sans-serif";
        c.textAlign = "center";
        c.fillText(G.Data.tracks[index].name.toUpperCase(), 0, 0);
        c.font = "4px monospace";
        c.fillText(
          `${(scene.length / 1000).toFixed(2)} KM · ${G.Data.tracks[index].width || 12.4} M DE ANCHO`,
          0,
          11,
        );
        c.restore();
      }
      c.restore();
      rainfall(c, r, w, h, dpr);
      // Un pequeño mapa de situación permite leer la escala sin alejar la acción.
      if (r && mode !== "overview") {
        const mw = 145 * dpr,
          mh = 100 * dpr,
          mx = w - mw - 18 * dpr,
          my = h - mh - 42 * dpr,
          scl = Math.min((mw - 20 * dpr) / b.width, (mh - 18 * dpr) / b.height);
        c.save();
        c.fillStyle = "#101c23df";
        c.beginPath();
        c.roundRect(mx, my, mw, mh, 4 * dpr);
        c.fill();
        c.strokeStyle = "#f0f3dc22";
        c.lineWidth = 1;
        c.stroke();
        c.restore();
        c.save();
        c.translate(mx + mw / 2, my + mh / 2);
        c.scale(scl, scl);
        c.translate(-(b.x + b.width / 2), -(b.y + b.height / 2));
        stroke(c, scene.points, "#c3cfc6", (1.3 * dpr) / scl);
        for (const a of r.entrants) {
          const p = worldPoint(index, a.progress);
          c.fillStyle = a === focus ? "#ed6245" : a.dnf ? "#697b72" : a.color;
          c.beginPath();
          c.arc(p.x, p.y, ((a === focus ? 2.6 : 1.7) * dpr) / scl, 0, TAU);
          c.fill();
        }
        c.restore();
      }
    },
  };
})();
