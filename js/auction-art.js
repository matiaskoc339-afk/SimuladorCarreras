"use strict";
(() => {
  const G = RCS,
    A = G.Art;
  const accent = (car) =>
    car.coachwork?.exclusive?.accent || car.collectible?.accent;
  const overlay = A.overlay;
  A.overlay = function (car) {
    const art = overlay.call(this, car),
      a = accent(car);
    return !a
      ? art
      : art +
          `<g data-auction-livery="true" stroke="${a}" fill="none"><path d="M105 90V128M119 90V128M66 310V352M174 310V352" stroke-width="6"/><path d="M70 364H170" stroke-width="3"/></g>`;
  };
  const canvas = A.canvas;
  A.canvas = function (c, car, len, width) {
    canvas.call(this, c, car, len, width);
    const a = accent(car);
    if (!a) return;
    c.strokeStyle = a;
    c.lineWidth = 0.06;
    for (const y of [-width * 0.08, width * 0.08]) {
      c.beginPath();
      c.moveTo(len * 0.24, y);
      c.lineTo(len * 0.4, y);
      c.stroke();
    }
    c.fillStyle = a;
    c.fillRect(-len * 0.35, -width * 0.42, len * 0.025, width * 0.84);
  };
  const side = G.CoachworkArt.side;
  G.CoachworkArt.side = function (car, opts) {
    const art = side.call(this, car, opts),
      a = accent(car);
    if (!a) return art;
    const m = this.metrics(car),
      x = m.left,
      L = m.length;
    return art.replace(
      "</svg>",
      `<path d="M${x + L * 0.33} 320L${x + L * 0.64} 313" stroke="${a}" stroke-width="5" opacity=".9"/><path d="M${x + L * 0.34} 329L${x + L * 0.63} 322" stroke="${a}" stroke-width="1.5" opacity=".8"/><rect x="${x + L * 0.6}" y="293" width="23" height="16" rx="2" fill="${a}" stroke="#2c4148" stroke-width="1"/></svg>`,
    );
  };
})();
