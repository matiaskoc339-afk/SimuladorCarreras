"use strict";
(() => {
  const G = RCS,
    W = G.RaceWeekend;
  const families = {
    soft: { label: "Blando", wear: 1.4, grip: 1.04, price: 330 },
    hard: { label: "Duro", wear: 1.08, grip: 1.015, price: 310 },
    inter: { label: "Intermedio", wear: 1.35, grip: 1, price: 350 },
    wet: { label: "Lluvia", wear: 1.5, grip: 1, price: 380 },
  };
  const brands = [
    {
      id: "fortis",
      name: "Fortis Endurance",
      wear: 0.74,
      grip: 0.965,
      cost: 1.38,
    },
    {
      id: "vertice",
      name: "Vértice Racing",
      wear: 1.23,
      grip: 1.045,
      cost: 1.48,
    },
    { id: "nomada", name: "Nómada Sport", wear: 1.14, grip: 0.99, cost: 0.86 },
  ];
  for (const b of brands)
    for (const [family, c] of Object.entries(families))
      W.compounds[`${b.id}-${family}`] = {
        name: `${b.name} · ${c.label}`,
        family,
        brand: b.name,
        price: Math.round((c.price * b.cost) / 10) * 10,
        wear: c.wear * b.wear,
        grip: b.grip,
        color: W.compounds[family].color,
      };
  const T = (G.Rubber = {
    family: (id) => W.compounds[id]?.family || id,
    wet: (id) => ["inter", "wet"].includes(T.family(id)),
    options: (s) =>
      Object.entries(W.compounds).filter(
        ([id]) => id === "road" || Object.hasOwn(s.raceSupplies.stock, id),
      ),
    price: (s, id) =>
      G.Challenge.enabled(s) && families[id]
        ? families[id].price
        : W.compounds[id]?.price || 0,
    initialize(s) {
      for (const b of brands)
        for (const family of Object.keys(families))
          s.raceSupplies.stock[`${b.id}-${family}`] = 12;
    },
    threshold: (a) => 30 + a.stats.focus * 0.08,
    estimate(a, compound, track = 0, wetness = 0) {
      const rate = G.Rubber.wearRate(a, compound, wetness);
      return Math.max(
        0.1,
        Math.round(
          (Math.max(0, a.tires - 22) / rate / G.Data.tracks[track].length) * 10,
        ) / 10,
      );
    },
    wearRate(a, id = a.compound, wetness = 0) {
      const def = W.compounds[id],
        base = families[T.family(id)];
      return (
        0.001 *
        (1.3 - a.stats.tires / 170) *
        (a.tireWear || 1) *
        (a.mode === "attack" ? 2 : a.mode === "save" ? 0.55 : 1) *
        (1 + (a.fatigue || 0) * 0.002) *
        (T.wet(id) ? 1 + (1 - wetness) * 1.8 : 1) *
        12 *
        (id === "road" ? 1.15 : def?.family ? def.wear : base?.wear || 1)
      );
    },
    validate(s) {
      if (!G.Challenge.enabled(s)) return;
      for (const [id] of T.options(s))
        if (id !== "road")
          G.assert(
            Number.isInteger(s.raceSupplies.stock[id]) &&
              s.raceSupplies.stock[id] >= 0 &&
              s.raceSupplies.stock[id] <= 32,
            "Stock de marca de neumáticos inválido.",
          );
    },
  });
  const quote = W.tyreQuote;
  W.tyreQuote = function (s, cid, id) {
    const q = quote.call(this, s, cid, id);
    if (q.cost) q.cost = T.price(s, id);
    return q;
  };
  const grip = W.grip;
  W.grip = function (r, a) {
    if (!r.dynamicsVersion) return grip.call(this, r, a);
    const family = T.family(a.compound),
      base = grip.call(this, r, { ...a, compound: family }),
      brand = W.compounds[a.compound]?.grip || 1;
    const condition = a.tires < 40 ? 0.65 + a.tires * 0.00875 : 1;
    return G.clamp(base * brand * condition, 0.22, 1.18);
  };
  const wear = W.wearFactor;
  W.wearFactor = function (r, a) {
    if (!r.dynamicsVersion) return wear.call(this, r, a);
    const family = T.family(a.compound),
      def = W.compounds[a.compound],
      base =
        family === "road"
          ? 1.15
          : def.family
            ? def.wear
            : families[family]?.wear || 1;
    return (
      base *
      12 *
      (T.wet(a.compound) ? 1 + (1 - r.weather.wetness) * 1.8 : 1) *
      (1 + a.fatigue * 0.002)
    );
  };
  const compound = W.bestCompound;
  W.bestCompound = function (r) {
    const family = compound.call(this, r);
    if (!r.dynamicsVersion) return family;
    return family === "hard"
      ? "fortis-hard"
      : family === "inter"
        ? "nomada-inter"
        : "fortis-wet";
  };
})();
