"use strict";
(() => {
  const G = RCS;
  G.Calendar = {
    advance(s, count = 1) {
      G.ensurePlayable(s);
      G.assert(!s.race, "Termina la carrera antes de avanzar el calendario.");
      G.assert(
        Number.isInteger(count) && count >= 1 && count <= 400,
        "Avance no válido.",
      );
      for (let i = 0; i < count; i++) {
        const due = G.nextEvent(s);
        if (due && due.day <= s.day) return { blocked: true, event: due };
        s.day++;
        G.Facilities.complete(s);
        G.Economy.daily(s);
        G.RaceWeekend.daily(s);
        G.Contracts.daily(s);
        G.Drivers.daily(s);
        G.AI.daily(s);
        G.Contracts.aiDaily(s);
        G.Economy.assess(s);
        G.Facilities.daily(s);
        const event = G.nextEvent(s);
        if (event && event.day - s.day === 7)
          G.news(
            s,
            "Agenda",
            `Falta una semana para ${G.Data.tracks[event.track].name}.`,
            "Revisa el contrato del piloto, el estado del coche y los gastos antes de confirmar tu inscripción.",
            "competition",
            event.id,
          );
        if (s.status !== "active") return { bankrupt: true };
        if (event && event.day <= s.day) return { blocked: true, event };
      }
      return { blocked: false };
    },
    nextSeason(s) {
      G.assert(
        s.season.phase === "complete" && !s.race,
        "Completa todas las rondas antes de abrir otra temporada.",
      );
      G.ensurePlayable(s);
      G.Facilities.archiveSeason(s);
      const current = G.dateAt(s.day);
      const year = Math.max(
          s.season.year + 1,
          current.getUTCFullYear() +
            (current.getUTCMonth() > 0 || current.getUTCDate() > 5 ? 1 : 0),
        ),
        day = G.dayOf(year, 0, 5);
      if (s.day < day) this.advance(s, day - s.day);
      if (s.status !== "active") return;
      s.season = G.makeSeason(
        s,
        Math.max(year, G.dateAt(s.day).getUTCFullYear()),
      );
      G.Contracts.openSeason(s);
      G.news(
        s,
        "Temporada",
        `Comienza la Copa Club ${s.season.year}.`,
        "Se conservan los vehículos, contratos, finanzas y rivales. Los puntos se reinician para la nueva temporada.",
        "competition",
      );
    },
  };
})();
