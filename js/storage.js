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
        s && [1, 2, 3].includes(s.version),
        "Versión de guardado incompatible. Este juego admite las versiones 1, 2 y 3.",
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
      if (s.version >= 2)
        G.assert(
          Array.isArray(s.market) &&
            Array.isArray(s.transferOffers) &&
            Array.isArray(s.trades),
          "Faltan los mercados del mundo.",
        );
      if (s.version === 3)
        G.assert(Array.isArray(s.parts), "Falta el inventario de repuestos.");
      const entities = [
        ...s.companies,
        ...s.drivers,
        ...(s.employees || []),
        ...(s.staffing ? [...s.staffing.assignments, ...s.staffing.debts] : []),
        ...s.cars,
        ...s.season.events,
        ...(s.expansion?.sites
          ? Object.values(s.expansion.sites)
              .filter((site) => site?.project)
              .map((site) => site.project)
          : []),
        ...(s.raceSupplies ? s.raceSupplies.sets : []),
        ...(s.commercial
          ? [
              ...s.commercial.providers,
              ...s.commercial.offers,
              ...s.commercial.contracts,
              ...s.commercial.loans,
            ]
          : []),
        ...(s.version === 3
          ? [...s.parts, ...s.cars.filter((c) => c.repair).map((c) => c.repair)]
          : []),
        ...(s.version >= 2
          ? [...s.market, ...s.transferOffers, ...s.trades]
          : []),
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
        "Mercado",
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
              "market",
              "car",
              "driver",
              "contracts",
              "facilities",
              "staff",
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
          (s.companies.some((x) => x.id === c.companyId) ||
            (s.version >= 2 && c.companyId === null)) &&
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
      if (s.race?.racingVersion !== undefined) {
        const r = s.race,
          finite = Number.isFinite,
          carIds = new Set(r.entrants.map((a) => a.carId));
        G.assert(
          r.racingVersion === 1 &&
            finite(r.trackWidth) &&
            r.trackWidth >= 8 &&
            r.trackWidth <= 20 &&
            ["green", "yellow"].includes(r.flag) &&
            finite(r.yellowUntil) &&
            finite(r.yellowProgress) &&
            Number.isInteger(r.eventSequence) &&
            r.eventSequence >= 0,
          "Estado de dirección de carrera inválido.",
        );
        G.assert(
          Array.isArray(r.events) &&
            r.events.length <= 80 &&
            Array.isArray(r.cautions) &&
            r.cautions.length <= 8,
          "El registro de carrera está dañado.",
        );
        const seen = new Set();
        for (const e of r.events) {
          G.assert(
            typeof e.id === "string" &&
              /^race-event-[0-9]+$/.test(e.id) &&
              !seen.has(e.id) &&
              finite(e.time) &&
              e.time >= 0 &&
              e.time <= r.time + 0.1 &&
              typeof e.type === "string" &&
              e.type.length < 32 &&
              typeof e.text === "string" &&
              e.text.length < 1000 &&
              Array.isArray(e.carIds) &&
              e.carIds.every((id) => carIds.has(id)) &&
              finite(e.progress),
            "Evento de pista inválido.",
          );
          seen.add(e.id);
        }
        for (const c of r.cautions)
          G.assert(
            finite(c.progress) && finite(c.until),
            "Bandera local inválida.",
          );
        G.assert(
          r.encounterCooldowns &&
            typeof r.encounterCooldowns === "object" &&
            !Array.isArray(r.encounterCooldowns) &&
            Object.values(r.encounterCooldowns).every(
              (e) => e && carIds.has(e.leader) && finite(e.lastEvent),
            ),
          "Registro de duelos inválido.",
        );
        G.assert(
          r.eventCounts &&
            typeof r.eventCounts === "object" &&
            !Array.isArray(r.eventCounts) &&
            Object.values(r.eventCounts).every(
              (n) => Number.isInteger(n) && n >= 0,
            ),
          "Contadores de carrera inválidos.",
        );
        for (const a of r.entrants)
          G.assert(
            (a.morale === undefined ||
              (finite(a.morale) && a.morale >= 0 && a.morale <= 100)) &&
              finite(a.lateral) &&
              Math.abs(a.lateral) <=
                (r.weekendVersion &&
                a.pit &&
                !["none", "queued"].includes(a.pit.phase)
                  ? 25
                  : 15) &&
              finite(a.headingSlip) &&
              Math.abs(a.headingSlip) < 10 &&
              finite(a.incidentStarted) &&
              finite(a.contactCooldown) &&
              finite(a.errorCooldown) &&
              finite(a.incidentUntil) &&
              ["slide", "spin", "contact", null].includes(a.incident) &&
              (a.slideSide === undefined || [-1, 1].includes(a.slideSide)) &&
              (!["slide", "spin"].includes(a.incident) ||
                [-1, 1].includes(a.slideSide)) &&
              (a.lateralVelocity === undefined || finite(a.lateralVelocity)) &&
              Number.isInteger(a.collisionCount) &&
              a.collisionCount >= 0 &&
              Number.isInteger(a.overtakeCount) &&
              a.overtakeCount >= 0 &&
              finite(a.damage) &&
              a.damage >= 0 &&
              finite(a.length) &&
              a.length > 0 &&
              finite(a.width) &&
              a.width > 0 &&
              finite(a.paceFactor) &&
              typeof a.offTrack === "boolean" &&
              (a.dnfReason === null || typeof a.dnfReason === "string"),
            "Dinámica del vehículo inválida.",
          );
      }
      G.RaceWeekend.validate(s);
      G.Facilities.validate(s);
      G.Staff.validate(s);
      G.Contracts.validate(s);
      G.assert(safeLogo(s.logo), "Logotipo inválido.");
      if (s.version >= 2) G.World.validate(s);
      if (s.version === 3) G.Workshop.validate(s);
      return s;
    },
    pack(s) {
      G.assert(
        s?.version === 3,
        "Versión incompatible: migra la partida antes de guardarla.",
      );
      this.validate(s);
      const data = JSON.stringify(s);
      return JSON.stringify({
        format: "RCS",
        version: 3,
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
          [1, 2, 3].includes(e.version) &&
          typeof e.data === "string",
        "Formato o versión de guardado incompatible.",
      );
      G.assert(
        e.checksum === this.checksum(e.data),
        "El guardado está dañado: la suma de comprobación no coincide.",
      );
      const state = this.validate(JSON.parse(e.data));
      G.assert(
        state.version === e.version,
        "Las versiones del sobre y de la partida no coinciden.",
      );
      return {
        state: this.validate(
          G.Staff.initialize(
            G.Facilities.initialize(
              G.RaceWeekend.initialize(
                G.Contracts.initialize(G.World.migrate(state)),
              ),
            ),
          ),
        ),
        savedAt: e.savedAt,
      };
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
