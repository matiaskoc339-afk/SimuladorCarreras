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
  const hash = (str) => {
    let n = 2166136261;
    for (const c of String(str)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
    return n >>> 0;
  };
  const femaleNames = new Set(
    "Elena Inés Valentina Lucía Camila Alba Sofía Julia Valeria Paula Isabel Aitana Sara Emma Noelia Daniela Olivia Carla Renata Maya Abril Amelia Celeste Natalia Elisa Alicia Aurora Brenda María Ana Laura Andrea Marta Victoria Rocío".split(
      " ",
    ),
  );
  const maleNames = new Set(
    "Lucas Mateo Diego Bruno Adrián Nicolás Rafael Marco Andrés Tomás Samuel Gabriel Martín Héctor Álex Omar Leo Iván Joaquín Enzo Joel Gael Tiago Santiago Dante Simón Julián Cristian".split(
      " ",
    ),
  );
  const appearance = (G.DriverAppearance = {
    femaleNames,
    maleNames,
    firstName(state) {
      const roll = G.random(state),
        male = roll < 0.7;
      const pool = G.Data.firstNames.filter((name) =>
        (male ? maleNames : femaleNames).has(name),
      );
      const fraction = male ? roll / 0.7 : (roll - 0.7) / 0.3;
      return pool[
        Math.min(pool.length - 1, Math.floor(fraction * pool.length))
      ];
    },
    gender(d) {
      const first = String(d.name || "")
        .trim()
        .split(/\s+/)[0];
      if (femaleNames.has(first)) return "female";
      if (maleNames.has(first)) return "male";
      return ["female", "mujer", "f"].includes(d.gender) ? "female" : "male";
    },
  });
  const A = (G.Art = {
    hash,
    portrait(d) {
      const female = appearance.gender(d) === "female";
      const seed = d.identity ?? hash(d.id + ":" + d.name);
      let n = seed;
      const pick = (max) => {
        n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
        return Math.floor((n / 4294967296) * max);
      };
      const skin = [
          "#e9bda1",
          "#d9a882",
          "#c18b67",
          "#a96f50",
          "#885b43",
          "#704735",
          "#e7c9b2",
          "#be987b",
        ][pick(8)],
        hair = [
          "#1c2427",
          "#34251f",
          "#604434",
          "#896440",
          "#b79164",
          "#c8b39b",
          "#514d48",
          "#6b322b",
        ][pick(8)],
        bg = [
          "#8fa79b",
          "#bba18c",
          "#899eb3",
          "#b1a47d",
          "#9e99b2",
          "#8ba9a8",
          "#bd9490",
          "#8d9f80",
        ][pick(8)],
        suit = [
          "#213740",
          "#344c37",
          "#5c3032",
          "#334466",
          "#4f4233",
          "#383349",
          "#2f5053",
          "#2b2e33",
        ][pick(8)],
        accent = [
          "#e4aa55",
          "#dbe5cc",
          "#d87957",
          "#80b1b1",
          "#d1b5c9",
          "#a7be81",
        ][pick(6)];
      const rx = female ? 18 + pick(5) : 20 + pick(7),
        ry = female ? 26 + pick(5) : 25 + pick(7),
        eyeY = 46 + pick(6),
        eyeW = 2 + pick(3),
        nose = pick(6),
        mouth = pick(5),
        style = pick(female ? 8 : 7),
        old = d.age > 34,
        glasses = pick(9) === 0,
        beard = !female && style < 6 && pick(4) === 0,
        detail = pick(3);
      const hairPaths = [
        "M25 39V25Q29 7 52 10Q75 10 76 34L68 37L62 23L35 29L30 42Z",
        "M24 42Q16 19 37 11Q66 1 78 28L72 45L65 29L33 24L29 46Z",
        "M25 34Q26 9 49 9Q74 8 76 35L68 26Q47 18 30 32Z",
        "M22 43Q18 12 45 9Q75 4 79 38L70 48L64 26L32 27L28 52Z",
        "M25 29Q35 9 60 14L76 28L73 39L65 23L33 23L27 39Z",
        "M23 36Q22 14 43 10Q71 3 79 32L71 42L61 22Q38 37 23 36Z",
        "M24 37Q17 23 33 15Q46 2 56 12Q79 8 78 33L72 47L64 26L34 27L29 48Z",
        "M22 66L21 31Q23 6 50 8Q78 10 79 36L80 73L68 69L65 27L33 27L31 71Z",
        "M20 70L22 29Q25 6 52 8Q77 9 79 32L82 76L69 72L66 25L33 28L31 73Z",
        "M25 40Q22 16 40 13Q51 5 68 16L78 31L71 50L64 27Q44 35 29 44Z",
      ];
      const feminineHair = [
        "M27 45Q20 18 40 12Q66 4 75 29L72 49L65 29Q48 28 35 22L29 49Z",
        "M24 59V31Q26 8 51 9Q78 11 77 36V63L68 65L66 28Q48 37 32 27L32 66Z",
        "M24 45Q19 19 39 12Q65 2 77 27L71 49L65 25Q48 20 29 39Z",
        "M22 55Q17 36 24 25Q19 16 32 15Q38 4 48 11Q62 4 69 14Q82 13 79 27Q85 40 76 55L69 48L65 27Q48 32 34 26L30 54Z",
        "M26 46Q18 16 43 11Q69 5 76 30L70 43L64 24Q51 31 33 28L29 49Z",
        "M23 43Q21 14 47 9Q72 6 78 30L72 54L66 26Q57 21 46 23L32 41L29 59Z",
        "M24 44Q19 21 35 14Q53 4 70 16L77 33L72 51L66 27L55 33L42 26L30 44Z",
        "M26 45Q21 18 40 12Q64 4 77 29L73 49L66 29Q49 18 32 35L29 51Z",
      ];
      const backHair = !female
        ? ""
        : [
            "M69 25Q91 21 89 49L83 81L73 84L77 47Z",
            "M25 30Q16 48 23 77L36 82L35 39ZM68 32L65 79L80 75Q84 50 74 29Z",
            "M71 24Q94 27 86 57L80 89L71 83L78 45Z",
            "M24 35Q12 50 22 72L34 77L33 42ZM72 33Q86 44 81 72L67 79L68 43Z",
            "M69 27Q87 30 83 53L75 70L71 61L77 42Z",
            "M24 30Q17 49 23 82L34 86L33 40ZM70 28L67 84L80 81Q86 46 74 26Z",
            "M26 33Q16 45 24 65L32 69L32 41ZM70 29Q84 38 78 65L68 70L68 42Z",
            "M73 30Q87 32 82 44L86 51L79 58L82 66L75 76L70 73L75 60L73 49L77 40Z",
          ][style];
      return `<svg class="portrait" data-portrait="${seed.toString(16)}" data-gender="${female ? "female" : "male"}" data-hair-style="${style}" data-beard="${beard}" viewBox="0 0 100 115" role="img" aria-label="Retrato ilustrado de ${esc(d.name)}"><rect width="100" height="115" rx="4" fill="${bg}"/><path d="M0 75L100 23V115H0Z" fill="#f2eee5" opacity=".09"/><path d="M3 115Q5 82 37 79H64Q93 83 98 115" fill="${suit}"/><path d="M39 70V85L50 95L62 84V69" fill="${skin}"/><path d="M36 80L50 94L40 101L27 86M63 80L50 94L60 101L75 87" fill="${accent}"/>${backHair ? `<path d="${backHair}" fill="${hair}"/>` : ""}<ellipse cx="26" cy="51" rx="4" ry="7" fill="${skin}"/><ellipse cx="74" cy="51" rx="4" ry="7" fill="${skin}"/><ellipse cx="50" cy="48" rx="${rx}" ry="${ry}" fill="${skin}"/><path d="M29 43Q48 32 72 43" fill="none" stroke="#ffe4c9" opacity=".15" stroke-width="5"/><path d="${female ? feminineHair[style] : hairPaths[style]}" fill="${hair}"/>${old ? '<path d="M35 35H43M56 35H65M30 54L34 55M66 55L71 54" stroke="#865c4d" opacity=".4" fill="none"/>' : ""}<path d="M34 ${eyeY - 6}L44 ${eyeY - 7 + (d.trait % 3)}M56 ${eyeY - 7 + (d.trait % 3)}L67 ${eyeY - 6}" stroke="${hair}" stroke-width="2" stroke-linecap="round"/><ellipse cx="39" cy="${eyeY}" rx="${eyeW}" ry="1.9" fill="#26302f"/><ellipse cx="61" cy="${eyeY}" rx="${eyeW}" ry="1.9" fill="#26302f"/><circle cx="40" cy="${eyeY - 0.6}" r=".6" fill="#f4f3e4"/><circle cx="62" cy="${eyeY - 0.6}" r=".6" fill="#f4f3e4"/><path d="M50 ${eyeY + 1}L${47 + nose} 60L54 61" fill="none" stroke="#855b48" opacity=".55" stroke-width="1.2"/>${beard ? `<path d="M29 57Q32 77 49 80Q69 78 72 56L67 69L52 74L37 69Z" fill="${hair}" opacity=".65"/>` : ""}<path d="M42 67Q50 ${65 + mouth * 2} 59 67" fill="none" stroke="${female ? "#9d5a58" : "#825448"}" stroke-width="${female ? 2 : 1.5}" stroke-linecap="round"/>${glasses ? '<g fill="none" stroke="#273b3f" stroke-width="1.6"><rect x="30" y="43" width="17" height="12" rx="4"/><rect x="53" y="43" width="17" height="12" rx="4"/><path d="M47 47H53"/></g>' : ""}<path d="M13 112V96M87 112V96M50 99V115" stroke="${accent}" stroke-width="2"/>${detail === 0 ? `<path d="M17 104H33M67 104H83" stroke="${accent}" stroke-width="4"/>` : detail === 1 ? '<path d="M18 105H23V110H18ZM24 100H29V105H24ZM71 100H76V105H71ZM77 105H82V110H77Z" fill="#ebe8d8"/>' : `<path d="M16 93L30 108M84 93L70 108" stroke="${accent}" stroke-width="3"/>`}<text x="79" y="111" fill="#e7e8dc" font-size="8" font-family="monospace">${d.age}</text></svg>`;
    },
    carProfile(car) {
      const index =
          car.modelIndex ??
          Math.max(
            0,
            G.Data.models.findIndex(
              (m) =>
                m.model === car.model && (!car.brand || m.brand === car.brand),
            ),
          ),
        m = G.Data.models[index] || car,
        shape = car.shape || m.shape,
        key = hash(m.brand + ":" + m.generation + ":" + m.model),
        compact = shape === "compact",
        sedan = shape === "sedan",
        wagon = shape === "wagon",
        open = shape === "roadster" || shape === "targa";
      const width = (compact ? 67 : sedan ? 70 : wagon ? 73 : 77) + (key % 5),
        front =
          (compact ? 42 : sedan ? 32 : open ? 36 : 30) + ((key >>> 4) % 7) - 3,
        rear = (compact ? 397 : wagon ? 407 : 401) + ((key >>> 8) % 9) - 4,
        shoulder = (compact ? 75 : sedan ? 87 : 69) + ((key >>> 12) % 7) - 3;
      const body = `M${120 - width + 12} ${front}Q120 ${front - 15} ${120 + width - 12} ${front}L${120 + width} ${shoulder}L${124 + width} 133L${115 + width} 348L${105 + width} ${rear}Q120 ${rear + 13} ${135 - width} ${rear}L${125 - width} 348L${116 - width} 133L${120 - width} ${shoulder}Z`;
      const wy = open ? 181 : compact ? 128 : sedan ? 161 : wagon ? 134 : 152,
        wind = `M${120 - width + 19} ${wy}Q120 ${wy - 20} ${120 + width - 19} ${wy}L${120 + width - 30} ${wy + 43}L${120 - width + 30} ${wy + 43}Z`,
        rearY = wagon ? 329 : compact ? 291 : sedan ? 281 : open ? 302 : 292;
      const back = `M${120 - width + 27} ${rearY}H${120 + width - 27}L${120 + width - 17} ${rearY + 36}Q120 ${rearY + 53} ${120 - width + 17} ${rearY + 36}Z`;
      return {
        key,
        index,
        body,
        wind,
        rear: back,
        shape,
        frontRoof: open ? 0.025 : sedan ? 0.18 : compact ? 0.21 : 0.14,
        rearRoof: wagon ? -0.4 : compact ? -0.36 : sedan ? -0.22 : -0.29,
        roof: m.brand === "Mini" ? "#ede6d0" : car.color || "#a6ac9b",
      };
    },
    overlay(car) {
      const p = this.carProfile(car),
        head = p.key % 4,
        chrome = p.key % 2 ? "#c4d3cf" : "#404d4d",
        stripe = ["#eee9cf", "#263d46", "#b09d71", "#deded8"][p.key % 4];
      return `<g data-design="${p.index}">${head === 0 ? '<ellipse cx="72" cy="70" rx="12" ry="9" fill="#e8e9ce"/><ellipse cx="168" cy="70" rx="12" ry="9" fill="#e8e9ce"/>' : head === 1 ? '<path d="M62 61L91 69L88 81L62 76ZM178 61L149 69L152 81L178 76Z" fill="#edf2dd"/>' : head === 2 ? '<path d="M60 68H88V79H61ZM152 68H180V79H152Z" fill="#e1e9d4"/>' : '<path d="M61 65L91 71M149 71L179 65" stroke="#eff3d9" stroke-width="7"/>'}<path d="M98 71H142M100 78H140" stroke="${chrome}" stroke-width="4"/><path d="M${96 + (p.key % 16)} 89V123" stroke="${stripe}" stroke-width="${p.key % 3 === 0 ? 15 : 4}" opacity=".8"/>${p.shape === "wagon" ? '<path d="M72 205V289M168 205V289" stroke="#d5d5c7" stroke-width="4"/>' : ""}${p.key % 3 === 0 ? '<path d="M55 382H185" stroke="#223234" stroke-width="9"/>' : ""}<path d="M67 374H88M152 374H173" stroke="#bb4d42" stroke-width="5"/><g fill="none" stroke="#b1b9b3" stroke-width="1.4">${[46, 194].flatMap((x) => [115, 325].map((y) => `<circle cx="${x}" cy="${y}" r="8"/><path d="M${x - 7} ${y}H${x + 7}M${x} ${y - 7}V${y + 7}"/>`)).join("")}</g></g>`;
    },
    canvas(c, a, length, width) {
      const p = this.carProfile(a);
      c.fillStyle = p.roof;
      c.fillRect(-length * 0.11, -width * 0.31, length * 0.19, width * 0.62);
      if (p.key % 3 === 0) {
        c.fillStyle = "#ddd8be";
        c.fillRect(length * 0.2, -width * 0.08, length * 0.22, width * 0.16);
      }
      if (p.shape === "wagon") {
        c.strokeStyle = "#c4ccc2";
        c.lineWidth = 0.045;
        c.strokeRect(
          -length * 0.34,
          -width * 0.34,
          length * 0.35,
          width * 0.68,
        );
      }
      if (p.key % 3 === 0) {
        c.fillStyle = "#263133";
        c.fillRect(-length * 0.45, -width * 0.55, 0.13, width * 1.1);
      }
    },
    part(d) {
      const paths = {
        intake:
          "M15 59V42Q15 18 40 18H64V30H40Q27 30 27 44V59ZM62 13H99V36H62ZM70 15V34M78 15V34M86 15V34M94 15V34",
        exhaust:
          "M12 52H40L48 44H66M65 33H99V56H65ZM99 38H112V50H99ZM74 34V54M80 34V54",
        ecu: "M35 17H85V65H35ZM45 27H75V55H45ZM27 25H35M27 35H35M27 45H35M27 55H35M85 25H94M85 35H94M85 45H94M85 55H94M45 9V17M57 9V17M69 9V17M45 65V73M57 65V73M69 65V73",
        boost:
          "M41 15C12 15 12 57 41 57C69 57 70 25 47 25C26 25 26 47 43 47M62 24H104V38H71M34 57V70H55V55",
        clutch:
          "M65 10A31 31 0 1 0 65 72A31 31 0 1 0 65 10ZM65 27A14 14 0 1 0 65 55A14 14 0 1 0 65 27ZM65 11V26M39 26L52 32M37 53L51 48M65 56V70M79 47L93 54M79 32L92 24",
        differential:
          "M10 42H34L45 23H78L91 42H116M10 50H34L45 67H78L91 50H116M61 25V66M48 35H75V55H48Z",
        suspension:
          "M48 8H77M63 8V72M47 20L78 26L47 33L78 40L47 47L78 54L47 61M48 72H77",
        brakes:
          "M62 9A31 31 0 1 0 62 71A31 31 0 1 0 62 9ZM62 30A10 10 0 1 0 62 50A10 10 0 1 0 62 30ZM83 16L99 29L94 56L81 64L77 48L83 32ZM47 20L51 26M37 36L44 38M38 54L45 51M61 60V66",
        tires:
          "M43 11C19 11 19 70 43 70H81C105 70 105 11 81 11ZM43 11C68 11 68 70 43 70M43 25C32 25 32 57 43 57C54 57 54 25 43 25ZM66 17L72 26L67 36L74 46L68 58M82 17L88 26L83 36L90 46L84 58",
        aero: "M12 24Q61 8 110 24L105 38Q60 25 17 38ZM37 35V67H28M88 35V67H98M25 67H101",
        body: "M19 52L29 22Q60 10 91 22L103 52L93 65H29ZM32 28L40 52M87 28L81 52M48 25H73V44H48Z",
        cooling:
          "M24 17H99V64H24ZM32 23H91V58H32ZM40 24V57M48 24V57M56 24V57M64 24V57M72 24V57M80 24V57M88 24V57M15 23H24M15 57H24M99 30H110V45",
      };
      return `<svg viewBox="0 0 128 80" aria-label="Ilustración de ${esc(d.name)}" role="img"><path d="${paths[d.slot] || paths.body}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    },
  });
})();
