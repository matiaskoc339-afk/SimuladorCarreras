"use strict";
(() => {
  const G = RCS,
    prefix = "rcs.v1.slot.";
  G.Storage = {
    slots: 5,
    checksum(text) {
      let h = 2166136261;
      for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(16);
    },
    validate(s) {
      G.assert(
        s && s.version === 1,
        "Versión de guardado incompatible. Este juego admite la versión 1.",
      );
      G.assert(
        Number.isInteger(s.day) &&
          s.day >= 0 &&
          Number.isInteger(s.seed) &&
          Number.isInteger(s.rng) &&
          Number.isInteger(s.sequence) &&
          s.sequence >= 0,
        "Calendario o semilla corruptos.",
      );
      G.assert(
        Array.isArray(s.companies) &&
          Array.isArray(s.drivers) &&
          Array.isArray(s.cars) &&
          Array.isArray(s.news) &&
          Array.isArray(s.history),
        "Faltan entidades de la partida.",
      );
      G.assert(
        s.season && Array.isArray(s.season.events),
        "Falta el calendario deportivo.",
      );
      const entities = [
        ...s.companies,
        ...s.drivers,
        ...s.cars,
        ...s.season.events,
      ];
      const ids = new Set();
      for (const x of entities) {
        G.assert(
          x &&
            typeof x.id === "string" &&
            /^(player|[a-z]+-[0-9]+)$/.test(x.id) &&
            !ids.has(x.id),
          "Identificadores duplicados o inválidos.",
        );
        ids.add(x.id);
      }
      G.assert(
        G.player(s) &&
          typeof G.player(s).name === "string" &&
          G.player(s).name.length <= 32,
        "Compañía del jugador inválida.",
      );
      G.assert(
        ["active", "bankrupt"].includes(s.status),
        "Estado de partida inválido.",
      );
      for (const c of s.companies)
        G.assert(
          Number.isFinite(c.balance) &&
            Array.isArray(c.ledger) &&
            typeof c.name === "string" &&
            c.name.length <= 100,
          "Finanzas inválidas.",
        );
      const color = (c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
      for (const c of s.companies)
        G.assert(
          color(c.color) &&
            ["active", "bankrupt"].includes(c.status) &&
            Number.isInteger(c.level) &&
            c.level >= 1 &&
            c.level <= 10 &&
            Number.isFinite(c.reputation) &&
            c.reputation >= 0 &&
            c.reputation <= 100,
          "Perfil de compañía inválido.",
        );
      G.assert(
        s.totals &&
          Number.isFinite(s.totals.income) &&
          Number.isFinite(s.totals.expense),
        "Resumen financiero inválido.",
      );
      for (const c of s.companies) {
        G.assert(
          c.stats &&
            ["starts", "wins", "podiums"].every(
              (k) => Number.isFinite(c.stats[k]) && c.stats[k] >= 0,
            ),
          "Estadísticas empresariales inválidas.",
        );
        for (const t of c.ledger)
          G.assert(
            Number.isInteger(t.day) &&
              Number.isFinite(t.amount) &&
              typeof t.label === "string" &&
              typeof t.category === "string",
            "Movimiento financiero inválido.",
          );
      }
      const safeLogo = (x) =>
        typeof x === "string" &&
        x.length < 350000 &&
        (!x || /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(x));
      for (const h of s.history)
        G.assert(
          Number.isInteger(h.year) &&
            Number.isInteger(h.playerPosition) &&
            Number.isFinite(h.playerPoints) &&
            Number.isFinite(h.bonus) &&
            safeLogo(h.logo) &&
            Array.isArray(h.standings) &&
            h.standings.every(
              (r) => typeof r.name === "string" && Number.isFinite(r.points),
            ),
          "Resumen histórico inválido.",
        );
      const categories = [
        "Compañía",
        "Competición",
        "Finanzas",
        "Taller",
        "Fichajes",
        "Talentos",
        "Agenda",
        "Resultados",
        "Temporada",
      ];
      for (const n of s.news)
        G.assert(
          typeof n.title === "string" &&
            typeof n.body === "string" &&
            categories.includes(n.category) &&
            [
              "news",
              "hq",
              "finance",
              "garage",
              "competition",
              "team",
              "companies",
              "history",
            ].includes(n.target),
          "Noticia inválida.",
        );
      for (const d of s.drivers) {
        G.assert(
          (d.companyId === null ||
            s.companies.some((c) => c.id === d.companyId)) &&
            typeof d.name === "string" &&
            d.name.length <= 100,
          "Propiedad de piloto inválida.",
        );
        G.assert(
          Number.isInteger(d.trait) &&
            G.Data.traits[d.trait] &&
            G.Data.nations.includes(d.nation) &&
            Number.isFinite(d.fatigue) &&
            d.fatigue >= 0 &&
            d.fatigue <= 100,
          "Perfil de piloto inválido.",
        );
        G.assert(
          G.Drivers.stats.every(
            (k) =>
              Number.isFinite(d.stats[k]) &&
              d.stats[k] >= 0 &&
              d.stats[k] <= 100,
          ),
          "Estadísticas de piloto inválidas.",
        );
        G.assert(
          d.companyId === null ||
            (d.contract &&
              Number.isFinite(d.contract.salary) &&
              d.contract.salary >= 0 &&
              Number.isFinite(d.contract.accrued) &&
              d.contract.accrued >= 0 &&
              Number.isInteger(d.contract.end)),
          "Contrato inválido.",
        );
      }
      for (const c of s.cars)
        G.assert(
          s.companies.some((x) => x.id === c.companyId) &&
            Number.isInteger(c.modelIndex) &&
            G.Data.models[c.modelIndex] &&
            Number.isFinite(c.condition) &&
            c.condition >= 0 &&
            c.condition <= 100 &&
            Number.isFinite(c.tires) &&
            c.tires >= 0 &&
            c.tires <= 100,
          "Vehículo inválido.",
        );
      for (const c of s.cars)
        G.assert(
          color(c.color) &&
            c.brand === G.Data.models[c.modelIndex].brand &&
            c.model === G.Data.models[c.modelIndex].model &&
            ["hatch", "coupe", "roadster"].includes(c.shape),
          "Identidad de vehículo inválida.",
        );
      G.assert(
        s.season &&
          Number.isInteger(s.season.year) &&
          Array.isArray(s.season.events) &&
          s.season.events.length === 6 &&
          ["active", "complete"].includes(s.season.phase),
        "Campeonato inválido.",
      );
      for (const e of s.season.events) {
        G.assert(
          ["scheduled", "completed", "skipped"].includes(e.status) &&
            Number.isInteger(e.track) &&
            G.Data.tracks[e.track] &&
            Number.isInteger(e.day) &&
            Array.isArray(e.results),
          "Evento inválido.",
        );
        if (e.entry)
          G.assert(
            s.drivers.some((d) => d.id === e.entry.driverId) &&
              s.cars.some((c) => c.id === e.entry.carId),
            "Inscripción sin vehículo o piloto.",
          );
      }
      if (s.race) {
        const r = s.race,
          e = s.season.events.find((e) => e.id === r.eventId);
        G.assert(
          e &&
            e.status === "scheduled" &&
            r.track === e.track &&
            Number.isFinite(r.time) &&
            Array.isArray(r.entrants) &&
            r.entrants.length <= 40,
          "Carrera inválida.",
        );
        for (const a of r.entrants)
          G.assert(
            s.cars.some((c) => c.id === a.carId) &&
              s.drivers.some((d) => d.id === a.driverId) &&
              Number.isFinite(a.progress) &&
              Number.isFinite(a.speed) &&
              Number.isFinite(a.condition),
            "Participante corrupto.",
          );
      }
      G.assert(safeLogo(s.logo), "Logotipo inválido.");
      return s;
    },
    pack(s) {
      this.validate(s);
      const data = JSON.stringify(s);
      return JSON.stringify({
        format: "RCS",
        version: 1,
        savedAt: new Date().toISOString(),
        checksum: this.checksum(data),
        data,
      });
    },
    unpack(raw) {
      G.assert(
        typeof raw === "string" && raw.length < 5000000,
        "El archivo está vacío o es demasiado grande.",
      );
      let e;
      try {
        e = JSON.parse(raw);
      } catch {
        throw new Error("El archivo de guardado no es JSON válido.");
      }
      G.assert(
        e &&
          e.format === "RCS" &&
          e.version === 1 &&
          typeof e.data === "string",
        "Formato o versión de guardado incompatible.",
      );
      G.assert(
        e.checksum === this.checksum(e.data),
        "El guardado está dañado: la suma de comprobación no coincide.",
      );
      return { state: this.validate(JSON.parse(e.data)), savedAt: e.savedAt };
    },
    save(slot, s) {
      G.assert(
        Number.isInteger(slot) && slot >= 1 && slot <= this.slots,
        "Ranura inválida.",
      );
      const key = prefix + slot,
        raw = this.pack(s),
        old = localStorage.getItem(key);
      // Solo respaldar estados válidos: nunca sustituir una copia buena por datos corruptos.
      if (old) {
        try {
          this.unpack(old);
          localStorage.setItem(key + ".backup", old);
        } catch (e) {
          if (e.name === "QuotaExceededError") throw e;
        }
      }
      localStorage.setItem(key, raw);
      return raw;
    },
    load(slot) {
      const raw = localStorage.getItem(prefix + slot);
      try {
        return { ...this.unpack(raw), recovered: false };
      } catch (error) {
        const backup = localStorage.getItem(prefix + slot + ".backup");
        if (backup) {
          try {
            return { ...this.unpack(backup), recovered: true };
          } catch {}
        }
        throw error;
      }
    },
    list() {
      return Array.from({ length: this.slots }, (_, i) => {
        const slot = i + 1;
        try {
          if (
            !localStorage.getItem(prefix + slot) &&
            !localStorage.getItem(prefix + slot + ".backup")
          )
            return { slot, empty: true };
          const { state, savedAt, recovered } = this.load(slot);
          return {
            slot,
            name: G.player(state).name,
            day: state.day,
            year: state.season.year,
            savedAt,
            status: state.status,
            recovered,
          };
        } catch (error) {
          return { slot, error: error.message };
        }
      });
    },
    remove(slot) {
      localStorage.removeItem(prefix + slot);
      localStorage.removeItem(prefix + slot + ".backup");
    },
  };
})();
