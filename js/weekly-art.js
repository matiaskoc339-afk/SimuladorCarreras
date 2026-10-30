"use strict";
(() => {
  const G = RCS,
    A = G.Art;
  const profile = A.carProfile;
  A.carProfile = function (car) {
    const p = profile.call(this, car),
      shell = car.coachwork?.supply;
    if (!shell) return p;
    const v = shell.variant,
      points = p.points.map((point) => ({
        ...point,
        x:
          point.x *
          (1 +
            ((v % 4) - 1.5) *
              0.008 *
              (point.y < 0.3 || point.y > 0.7 ? 1 : -0.5)),
      }));
    return {
      ...p,
      points,
      body:
        points
          .map(
            (point, i) =>
              `${i ? "L" : "M"}${(120 + point.x * 154).toFixed(2)} ${(25 + point.y * 390).toFixed(2)}`,
          )
          .join("") + "Z",
    };
  };
  const overlay = A.overlay;
  A.overlay = function (car) {
    const art = overlay.call(this, car),
      s = car.coachwork?.supply;
    if (!s) return art;
    const y = 93 + (s.variant % 4) * 5;
    return (
      art +
      `<g data-weekly-shell="${s.variant}" stroke="${s.accent}" fill="none"><path d="M63 ${y}L91 ${y + 12}M177 ${y}L149 ${y + 12}M62 354H178" stroke-width="4"/>${s.variant % 3 === 1 ? '<path d="M80 115H99M80 122H99M141 115H160M141 122H160" stroke-width="3"/>' : s.variant % 3 === 2 ? '<path d="M102 96V131M138 96V131" stroke-width="7"/>' : '<path d="M68 325L90 336M172 325L150 336" stroke-width="4"/>'}</g>`
    );
  };
  const side = G.CoachworkArt.side;
  G.CoachworkArt.side = function (car, options) {
    const art = side.call(this, car, options),
      s = car.coachwork?.supply;
    if (!s) return art;
    const m = this.metrics(car),
      x = m.left,
      L = m.length,
      v = s.variant;
    return art.replace(
      "</svg>",
      `<g data-weekly-shell="${v}" fill="none" stroke="${s.accent}"><path d="M${x + L * 0.32} ${336 - (v % 4) * 4}L${x + L * 0.71} ${328 - (v % 4) * 3}" stroke-width="${3 + (v % 3)}"/><path d="M${x + 10} 344L${x + 37} ${329 - (v % 4) * 3}M${m.right - 35} 332L${m.right - 9} 350" stroke-width="4"/>${v % 3 === 1 ? `<path d="M${x + L * 0.21} 296L${x + L * 0.29} 292M${x + L * 0.22} 302L${x + L * 0.3} 298" stroke-width="3"/>` : v % 3 === 2 ? `<path d="M${x + L * 0.68} 290L${x + L * 0.73} 314L${x + L * 0.69} 321" stroke-width="6"/>` : ""}</g></svg>`,
    );
  };
  const canvas = A.canvas;
  A.canvas = function (c, car, length, width) {
    canvas.call(this, c, car, length, width);
    const s = car.coachwork?.supply;
    if (!s) return;
    c.fillStyle = s.accent;
    c.fillRect(length * 0.3, -width * 0.37, length * 0.045, width * 0.74);
    for (const sign of [-1, 1])
      c.fillRect(
        -length * 0.35,
        sign * width * 0.34,
        length * (0.08 + (s.variant % 3) * 0.02),
        width * 0.04,
      );
  };
})();
