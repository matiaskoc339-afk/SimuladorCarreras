"use strict";
(() => {
  const G = RCS,
    cache = new Map(),
    hash = (text) => G.AuctionContent.hash(text);
  const T = (G.SeasonTour = {
    enabled: (s) => s?.seasonTour?.version === 1,
    initialize(s, year = s.season.year) {
      if (!this.enabled(s)) {
        s.seasonTour = { version: 1, sinceYear: year };
        if (year > s.season.year)
          s.seasonTour.legacyTracks = [
            ...new Set(s.season.events.map((e) => e.track)),
          ];
      }
      return s;
    },
    pool(seed, cup) {
      const key = `${seed}-${cup}`;
      if (cache.has(key)) return cache.get(key);
      // Un circuito compartido pertenece a su primera categoría en el calendario:
      // así no se corre dos veces en él durante el mismo año.
      const groups = new Map();
      for (const index of G.Circuits.indices().filter(
        (i) => G.Data.tracks[i].cups?.[0] === cup,
      )) {
        const country = G.Data.tracks[index].country;
        if (!groups.has(country)) groups.set(country, []);
        groups.get(country).push(index);
      }
      for (const list of groups.values())
        list.sort(
          (a, b) =>
            hash(`${seed}:${G.Data.tracks[a].id}`) -
              hash(`${seed}:${G.Data.tracks[b].id}`) || a - b,
        );
      const result = [];
      let last = null;
      while ([...groups.values()].some((list) => list.length)) {
        let candidates = [...groups].filter(([, list]) => list.length);
        const alternate = candidates.filter(([country]) => country !== last);
        if (alternate.length) candidates = alternate;
        candidates.sort(
          (a, b) =>
            b[1].length - a[1].length ||
            hash(`${seed}:${cup}:${a[0]}`) - hash(`${seed}:${cup}:${b[0]}`),
        );
        const [country, list] = candidates[0];
        result.push(list.shift());
        last = country;
      }
      if (cache.size >= 96) cache.delete(cache.keys().next().value);
      cache.set(key, result);
      return result;
    },
    selection(seed, year, cup, tour = null) {
      G.assert(
        Number.isInteger(year) && year >= 2026 && year <= 9999,
        "Año de la gira inválido.",
      );
      const count = { street: 9, pro: 6, national: 5 }[cup],
        base = this.pool(seed, cup),
        previous = new Set(tour?.legacyTracks || []),
        pool = previous.size
          ? [
              ...base.filter((i) => !previous.has(i)),
              ...base.filter((i) => previous.has(i)),
            ]
          : base,
        starter = previous.size
          ? 0
          : cup === "street"
            ? pool.indexOf(6)
            : hash(`${seed}:${cup}:offset`) % pool.length,
        offset =
          (starter + (year - (previous.size ? tour.sinceYear : 2026)) * count) %
          pool.length,
        selected = Array.from(
          { length: count },
          (_, i) => pool[(offset + i) % pool.length],
        );
      if (cup === "street" && year !== 2026) {
        const difficulty = { Fácil: 0, Intermedia: 1, Difícil: 2, Experta: 3 };
        let opening = 0;
        for (let i = 1; i < selected.length; i++)
          if (
            difficulty[G.Data.tracks[selected[i]].difficulty] <
            difficulty[G.Data.tracks[selected[opening]].difficulty]
          )
            opening = i;
        [selected[0], selected[opening]] = [selected[opening], selected[0]];
      }
      return selected;
    },
    rotate(s, season) {
      for (const cup of ["street", "pro", "national"]) {
        const events = season.events.filter((e) => e.cup === cup),
          tracks = this.selection(s.seed, season.year, cup, s.seasonTour);
        events.forEach((e, i) => {
          e.track = tracks[i];
        });
      }
      season.tourVersion = 1;
      return season;
    },
    validate(s) {
      if (s.seasonTour === undefined && s.season.tourVersion === undefined)
        return;
      G.assert(
        this.enabled(s) &&
          G.Research.enabled(s) &&
          Number.isInteger(s.seasonTour.sinceYear) &&
          s.seasonTour.sinceYear >= 2026 &&
          s.seasonTour.sinceYear <= s.season.year &&
          s.season.tourVersion === 1,
        "Formato de gira por temporadas inválido.",
      );
      const used = new Set();
      if (s.seasonTour.legacyTracks !== undefined) {
        const tracks = s.seasonTour.legacyTracks;
        G.assert(
          Array.isArray(tracks) &&
            tracks.length > 0 &&
            tracks.length <= 20 &&
            new Set(tracks).size === tracks.length &&
            tracks.every(
              (i) => Number.isInteger(i) && G.Data.tracks[i]?.modern,
            ),
          "Sedes anteriores de la gira inválidas.",
        );
      }
      for (const cup of ["street", "pro", "national"]) {
        const expected = this.selection(
            s.seed,
            s.season.year,
            cup,
            s.seasonTour,
          ),
          events = s.season.events.filter((e) => e.cup === cup);
        G.assert(
          events.length === expected.length,
          "Número de pruebas de la gira inválido.",
        );
        events.forEach((e, i) => {
          const track = G.Data.tracks[e.track];
          G.assert(
            e.track === expected[i] &&
              !used.has(e.track) &&
              track.cups.includes(cup) &&
              G.WorldCircuits.countries[track.country] === track.countryName,
            "Sede duplicada, alterada o fuera de su copa.",
          );
          used.add(e.track);
        });
      }
    },
  });
  T.legacyMakeSeason = G.Competition.makeSeason;
  G.Competition.makeSeason = function (s, year) {
    const season = T.legacyMakeSeason.call(this, s, year);
    if (!G.Research.enabled(s)) return season;
    T.initialize(s, year);
    return T.rotate(s, season);
  };
  const create = G.createGame;
  G.createV110Game = create;
  G.createGame = (...args) => {
    const s = create(...args);
    T.initialize(s);
    T.rotate(s, s.season);
    return s;
  };
})();
