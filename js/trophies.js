"use strict";
(() => {
  const G = RCS;
  const T = (G.Trophies = {
    rewards: { pro: [6, 4, 2], national: [12, 8, 5] },
    initialize(s) {
      if (!s.trophyRoom) s.trophyRoom = { version: 1, awards: [] };
      return s;
    },
    award(s, e) {
      if (
        !s.trophyRoom ||
        !e.final ||
        !this.rewards[e.cup] ||
        !["completed", "skipped"].includes(e.status)
      )
        return;
      for (const row of e.results.filter(
        (r) => !r.dnf && r.position >= 1 && r.position <= 3,
      )) {
        if (
          s.trophyRoom.awards.some(
            (t) =>
              t.year === s.season.year &&
              t.cup === e.cup &&
              t.position === row.position,
          )
        )
          continue;
        const c = s.companies.find((c) => c.id === row.companyId);
        // Solo una plaza ganada en la clasificación de esa copa puede recibir trofeo.
        if (
          !c ||
          G.Competition.score(s, c.id, e.cup, true) <
            G.Competition.rules[e.cup].qualify
        )
          continue;
        const bonus = this.rewards[e.cup][row.position - 1],
          before = c.reputation;
        c.reputation = G.clamp(before + bonus, 0, 100);
        s.trophyRoom.awards.push({
          year: s.season.year,
          cup: e.cup,
          ...(e.grandVersion === 1 ? { grandDivision: e.grandDivision } : {}),
          eventId: e.id,
          day: s.day,
          track: e.track,
          companyId: c.id,
          driverId: row.driverId,
          driverName: row.name,
          position: row.position,
          bonus,
          reputationGain: c.reputation - before,
        });
        G.news(
          s,
          "Palmarés",
          `${c.name}: trofeo de ${["oro", "plata", "bronce"][row.position - 1]} en ${G.Competition.rules[e.cup].name}.`,
          `${row.name} termina ${row.position}º en la gran final de ${s.season.year}. Prestigio de la empresa +${(c.reputation - before).toFixed(1)} (bonificación máxima ${bonus}). El trofeo permanece en su vitrina entre temporadas.`,
          "trophies",
        );
      }
    },
    validate(s) {
      const room = s.trophyRoom;
      if (room === undefined) return;
      G.assert(
        room.version === 1 && Array.isArray(room.awards),
        "Vitrina de trofeos inválida.",
      );
      const keys = new Set();
      for (const t of room.awards) {
        const key = `${t.year}-${t.cup}-${t.position}`,
          companyKey = `${t.year}-${t.cup}-${t.companyId}`;
        G.assert(
          this.rewards[t.cup] &&
            [1, 2, 3].includes(t.position) &&
            Number.isInteger(t.year) &&
            t.year >= 2026 &&
            t.year <= s.season.year &&
            Number.isInteger(t.day) &&
            t.day <= s.day &&
            t.day >= 0 &&
            Number.isInteger(t.track) &&
            G.Data.tracks[t.track]?.kind === "pro" &&
            typeof t.eventId === "string" &&
            s.companies.some((c) => c.id === t.companyId) &&
            s.drivers.some((d) => d.id === t.driverId) &&
            typeof t.driverName === "string" &&
            t.bonus === this.rewards[t.cup][t.position - 1] &&
            Number.isFinite(t.reputationGain) &&
            t.reputationGain >= 0 &&
            t.reputationGain <= t.bonus + 1e-8 &&
            !keys.has(key) &&
            !keys.has(companyKey),
          "Trofeo duplicado o premio inválido.",
        );
        const event =
          t.year === s.season.year
            ? s.season.events.find((e) => e.id === t.eventId)
            : s.expansion.archive
                .find((a) => a.year === t.year)
                ?.events.find((e) => e.id === t.eventId);
        G.assert(
          event?.final &&
            event.cup === t.cup &&
            t.grandDivision === event.grandDivision &&
            event.track === t.track &&
            event.status !== "scheduled" &&
            event.results.some(
              (r) =>
                r.companyId === t.companyId &&
                r.driverId === t.driverId &&
                r.position === t.position &&
                !r.dnf,
            ),
          "Trofeo sin podio de gran final.",
        );
        keys.add(key);
        keys.add(companyKey);
      }
    },
  });
  const finish = G.Competition.raceFinished;
  G.Competition.raceFinished = function (s, e, r) {
    finish.call(this, s, e, r);
    T.award(s, e);
  };
})();
