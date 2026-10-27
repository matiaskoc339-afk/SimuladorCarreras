"use strict";
(() => {
  const G = RCS;
  G.Render = {
    carSVG(car, number = "01") {
      const hatch = car.shape === "hatch",
        roadster = car.shape === "roadster";
      return `<svg viewBox="0 0 240 440" aria-label="Ilustración original del ${car.brand} ${car.model}" role="img"><defs><linearGradient id="paint-${car.id}" x2="1" y2=".2"><stop stop-color="${car.color}"/><stop offset=".5" stop-color="${car.color}"/><stop offset="1" stop-color="#191f24"/></linearGradient></defs><ellipse cx="122" cy="230" rx="88" ry="178" fill="#000" opacity=".3"/><g><rect x="39" y="85" width="20" height="68" rx="6" fill="#080e11"/><rect x="181" y="85" width="20" height="68" rx="6" fill="#080e11"/><rect x="39" y="288" width="20" height="68" rx="6" fill="#080e11"/><rect x="181" y="288" width="20" height="68" rx="6" fill="#080e11"/><path d="M60 62 Q120 35 180 62 L190 130 L189 330 Q184 370 166 ${hatch ? 385 : 399} L74 ${hatch ? 385 : 399} Q52 370 51 330 L50 130Z" fill="url(#paint-${car.id})" stroke="#e4e4dc" stroke-opacity=".25" stroke-width="2"/><path d="M69 162 Q120 144 171 162 L162 207 L78 207Z" fill="#192831" stroke="#c0deeb" stroke-opacity=".4"/><path d="M78 214 L162 214 L165 ${roadster ? 283 : 293} L75 ${roadster ? 283 : 293}Z" fill="${roadster ? "#151c23" : car.color}" stroke="#111b22" stroke-width="3"/><path d="M75 302 L165 302 L173 340 Q120 356 67 340Z" fill="#17252e"/><path d="M57 84 L88 74 L85 94 L59 102Z M183 84 L152 74 L155 94 L181 102Z" fill="#e8eedb"/><path d="M61 360 L85 360 L85 369 L64 369Z M179 360 L155 360 L155 369 L176 369Z" fill="#cf5d51"/><path d="M106 58 L116 58 L116 157 L106 159Z M123 58 L130 58 L130 157 L123 159Z" fill="#182327" opacity=".7"/><rect x="44" y="181" width="15" height="10" rx="3" fill="${car.color}"/><rect x="181" y="181" width="15" height="10" rx="3" fill="${car.color}"/><rect x="88" y="103" width="64" height="7" rx="3" fill="#151d21"/><text x="120" y="265" text-anchor="middle" fill="#192126" font-size="42" font-family="monospace" font-weight="bold">${number}</text><path d="${car.installed?.aero ? "M40 355 L200 355" : "M62 355 L178 355"}" stroke="#162027" stroke-width="9"/></g></svg>`;
    },
    headquarters(s) {
      const name = G.UI.escape(G.player(s).name);
      const building = (x, y, w, h, title, sub, target, n) =>
        `<g class="building" tabindex="0" role="button" aria-label="${title}" data-go="${target}" transform="translate(${x} ${y})"><path class="shadow" d="M0 34 L${w} 34 L${w + 36} ${h + 26} L30 ${h + 26}Z"/><rect class="wall" x="0" y="20" width="${w}" height="${h}" rx="3"/><path class="roof" d="M-8 20 L${w / 2} -10 L${w + 8} 20 L${w / 2} 45Z"/><path d="M${w / 2} 45 L${w + 8} 20 L${w + 8} ${h + 10} L${w / 2} ${h + 35}Z" fill="#28383a"/><rect x="12" y="49" width="${w / 2 - 22}" height="${h - 34}" rx="1" fill="#101e23"/><path d="M15 57 H${w / 2 - 15} M15 67 H${w / 2 - 15} M15 77 H${w / 2 - 15}" stroke="#53635b" stroke-width="2"/><rect x="${w / 2 + 12}" y="57" width="${w / 2 - 24}" height="11" fill="#cfb777" opacity=".65"/><rect x="${w / 2 + 12}" y="77" width="${w / 2 - 24}" height="11" fill="#cfb777" opacity=".45"/><circle cx="${w / 2}" cy="-34" r="16" fill="#dfa848"/><text x="${w / 2}" y="-29" text-anchor="middle" fill="#151d1e" font-size="13" font-weight="700">${n}</text><text class="building-label" x="${w / 2}" y="${h + 63}" text-anchor="middle">${title}</text><text class="building-sub" x="${w / 2}" y="${h + 82}" text-anchor="middle">${sub}</text></g>`;
      return `<svg class="hq-map" viewBox="0 0 960 545" role="group" aria-label="Sede de ${name}: selecciona un edificio"><defs><pattern id="pavement" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M0 35L35 0" stroke="#a1ad9c" stroke-opacity=".03"/></pattern><radialGradient id="hqGlow"><stop stop-color="#3c534b" stop-opacity=".45"/><stop offset="1" stop-color="#111d21" stop-opacity="0"/></radialGradient></defs><rect width="960" height="545" fill="#152227"/><ellipse cx="470" cy="290" rx="440" ry="270" fill="url(#hqGlow)"/><path d="M50 325 L460 112 L918 332 L512 536Z" fill="#293334" stroke="#3d4845"/><path d="M50 325 L460 112 L918 332 L512 536Z" fill="url(#pavement)"/><path d="M133 346 L482 163 M292 405 L653 218 M461 480 L809 302" stroke="#67705e" stroke-opacity=".22" stroke-width="2"/><path d="M367 443 L501 372 L603 420 M505 257 L635 325" fill="none" stroke="#9a9e78" stroke-width="2" stroke-dasharray="12 9"/><path d="M50 325 L50 338 L512 550 L512 536 M512 536 L918 332 L918 345 L512 550" fill="#101a1e"/><g opacity=".55" fill="#354b40"><circle cx="83" cy="280" r="25"/><circle cx="107" cy="263" r="19"/><circle cx="859" cy="278" r="22"/><circle cx="827" cy="260" r="18"/><circle cx="715" cy="462" r="24"/><circle cx="750" cy="444" r="19"/></g>${building(374, 127, 165, 110, "Oficina", "FINANZAS · IDENTIDAD", "finance", "01")}${building(167, 244, 185, 105, "Garaje", `${G.ownedCars(s).length} VEHÍCULOS · TALLER`, "garage", "02")}${building(620, 242, 145, 90, "Sala de pilotos", "PLANTILLA · CURRÍCULUMS", "team", "03")}<g data-go="competition" class="building" role="button" tabindex="0" aria-label="Centro de estrategia"><path d="M422 358 L513 313 L608 358 L513 406Z" fill="#53615b"/><path d="M422 358 L422 386 L513 435 L513 406Z" fill="#344542"/><path d="M513 406 L608 358 L608 386 L513 435Z" fill="#243735"/><path d="M449 359 L510 329 L571 359 L510 389Z" fill="#16252a"/><path d="M468 358 L507 340 L549 358 L508 377Z" fill="none" stroke="#daa94f" stroke-width="3"/><text class="building-label" x="515" y="476" text-anchor="middle">Estrategia</text><text class="building-sub" x="515" y="495" text-anchor="middle">CALENDARIO · COMPETICIÓN</text></g>${G.ownedCars(
        s,
      )
        .map(
          (car, i) =>
            `<g class="hq-car" transform="translate(${362 + i * 30} ${343 + i * 15}) rotate(-27)"><rect x="0" y="0" width="19" height="39" rx="6" fill="${car.color}"/><rect x="2" y="11" width="15" height="10" rx="2" fill="#1d3036"/><path d="M4 2H15" stroke="#e8e6cd" stroke-width="3"/></g>`,
        )
        .join(
          "",
        )}<g transform="translate(740 118)"><path d="M0 0V90" stroke="#758077" stroke-width="3"/><path d="M0 0 L44 0 L44 29 L0 29Z" fill="#dfaa50"/><path d="M7 6L17 6L17 16L7 16ZM27 6L37 6L37 16L27 16ZM17 16L27 16L27 26L17 26Z" fill="#1a262a"/></g><text x="32" y="42" fill="#80928c" font-family="monospace" font-size="12" letter-spacing="3">SEDE CENTRAL / SECTOR 01</text><text x="32" y="518" fill="#61746e" font-family="monospace" font-size="11">37° 23′ N · 5° 59′ O</text><text x="928" y="518" text-anchor="end" fill="#a8b4a1" font-family="monospace" font-size="11">GARAGE LEVEL 01</text></svg>`;
    },
    fit(canvas) {
      const box = canvas.getBoundingClientRect(),
        dpr = Math.min(devicePixelRatio || 1, 2),
        w = Math.round(box.width * dpr),
        h = Math.round(box.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return { ctx: canvas.getContext("2d"), w, h };
    },
    track(canvas, r = null, index = 0, logo = null, follow = false) {
      const { ctx: c, w, h } = this.fit(canvas);
      if (!w || !h) return;
      c.clearRect(0, 0, w, h);
      c.fillStyle = "#172522";
      c.fillRect(0, 0, w, h);
      c.save();
      if (follow && r) {
        const a =
          r.entrants.find((a) => a.companyId === "player") || r.entrants[0];
        if (a) {
          const p = G.Race.point(index, a.progress);
          c.translate(w / 2, h / 2);
          c.scale(1.65, 1.65);
          c.translate(-p.x * w, -p.y * h);
        }
      }
      // Terreno original y marcas: no se descargan texturas ni imágenes.
      c.strokeStyle = "#64756015";
      c.lineWidth = 1;
      for (let x = -w; x < w * 2; x += 45) {
        c.beginPath();
        c.moveTo(x, -h);
        c.lineTo(x + h * 3, h * 2);
        c.stroke();
      }
      const pts = G.Race.track(index),
        road = Math.min(w, h) * 0.095;
      const path = () => {
        c.beginPath();
        pts.forEach((p, i) =>
          i ? c.lineTo(p.x * w, p.y * h) : c.moveTo(p.x * w, p.y * h),
        );
        c.closePath();
      };
      path();
      c.strokeStyle = "#0c1816";
      c.lineWidth = road + 22;
      c.stroke();
      path();
      c.strokeStyle = "#8c967d";
      c.lineWidth = road + 7;
      c.stroke();
      path();
      c.strokeStyle = "#913e35";
      c.lineWidth = road + 7;
      c.setLineDash([10, 10]);
      c.stroke();
      c.setLineDash([]);
      path();
      c.strokeStyle = "#3a4140";
      c.lineWidth = road;
      c.stroke();
      path();
      c.strokeStyle = "#dce0cc38";
      c.lineWidth = 1;
      c.setLineDash([9, 14]);
      c.stroke();
      c.setLineDash([]);
      const first = pts[0];
      c.save();
      c.translate(first.x * w, first.y * h);
      c.rotate(
        Math.atan2(
          (Math.sin(first.angle) * h) / 0.66,
          Math.cos(first.angle) * w,
        ),
      );
      for (let x = 0; x < 3; x++)
        for (let y = 0; y < 8; y++) {
          c.fillStyle = (x + y) % 2 ? "#252b28" : "#e3e3ce";
          c.fillRect(x * 4 - 6, (y * road) / 8 - road / 2, 4, road / 8);
        }
      c.restore();
      c.fillStyle = "#b4bba82b";
      c.font = `700 ${Math.max(12, w * 0.035)}px sans-serif`;
      c.textAlign = "center";
      c.fillText(G.Data.tracks[index].name.toUpperCase(), w * 0.49, h * 0.47);
      c.fillStyle = "#b4bba860";
      c.font = `${Math.max(9, w * 0.013)}px monospace`;
      c.fillText("COPA CLUB DE TURISMOS", w * 0.49, h * 0.51);
      if (r)
        for (const a of G.Race.positions(r).reverse()) {
          const p = G.Race.point(index, a.progress),
            x = p.x * w - Math.sin(p.angle) * a.lane * w,
            y = p.y * h + Math.cos(p.angle) * a.lane * w;
          const scale = Math.max(0.8, Math.min(w / 700, 1.7));
          c.save();
          c.translate(x, y);
          c.rotate(
            Math.atan2((Math.sin(p.angle) * h) / 0.66, Math.cos(p.angle) * w),
          );
          c.scale(scale, scale);
          if (a.companyId === "player") {
            c.strokeStyle = "#ffda91";
            c.lineWidth = 1.3;
            c.beginPath();
            c.arc(0, 0, 15, 0, Math.PI * 2);
            c.stroke();
          }
          c.fillStyle = "#0008";
          c.fillRect(-11, -5, 25, 14);
          c.fillStyle = "#0b1011";
          c.fillRect(-8, -8, 5, 3);
          c.fillRect(6, -8, 5, 3);
          c.fillRect(-8, 5, 5, 3);
          c.fillRect(6, 5, 5, 3);
          c.fillStyle = a.dnf ? "#68726b" : a.color;
          c.beginPath();
          c.roundRect(-12, -6, a.shape === "roadster" ? 24 : 27, 12, 4);
          c.fill();
          c.fillStyle = "#152a30";
          c.fillRect(-3, -5, 7, 10);
          c.fillStyle = "#f0f2d5";
          c.fillRect(11, -5, 2, 3);
          c.fillRect(11, 2, 2, 3);
          if (logo?.complete && a.companyId === "player")
            c.drawImage(logo, -9, -4, 7, 7);
          c.restore();
        }
      c.restore();
    },
  };
})();
