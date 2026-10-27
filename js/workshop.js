"use strict";
(() => {
  const G = RCS,
    K = Object.keys(G.Parts.components),
    attributes = ["hp", "weight", "grip", "brakes", "top", "reliability"];
  G.Workshop = {
    attributes,
    initialize(s) {
      s.parts = [];
      s.partsSupplier = { name: "Paddock Components", balance: 8000 };
      for (const c of s.companies) c.sparesCapacity = 8;
      for (const car of s.cars) {
        car.base = Object.fromEntries(attributes.map((k) => [k, car[k]]));
        car.components = Object.fromEntries(
          K.map((k) => [k, k === "tires" ? car.tires : car.condition]),
        );
        car.installed = {};
        car.oemTires = car.tires;
        car.upgradeValue = 0;
        if (car.repair)
          car.repair = {
            ...car.repair,
            id: G.uid(s, "work"),
            type: "repair",
            component: "all",
            start: s.day,
          };
      }
      for (const def of G.Parts.catalogue)
        for (let i = 0; i < 4; i++)
          s.parts.push({
            id: G.uid(s, "part"),
            definitionId: def.id,
            companyId: null,
            carId: null,
            reservedFor: null,
            condition: 100,
          });
      s.version = 3;
      return s;
    },
    inventory(s, id = s.playerId) {
      return s.parts.filter((p) => p.companyId === id && p.carId === null);
    },
    occupied(s, id = s.playerId) {
      return (
        this.inventory(s, id).length +
        G.ownedCars(s, id).filter((c) => c.repair?.type === "remove").length
      );
    },
    stock(s, defId) {
      return s.parts
        .filter((p) => p.companyId === null && p.definitionId === defId)
        .sort((a, b) => b.condition - a.condition || a.id.localeCompare(b.id));
    },
    summary(components) {
      return (
        components.engine * 0.25 +
        components.transmission * 0.15 +
        components.brakes * 0.15 +
        components.suspension * 0.15 +
        components.cooling * 0.15 +
        components.body * 0.15
      );
    },
    configuration(s, car, installed = car.installed) {
      const v = {
        ...car.base,
        stress: 0,
        cooling: 1,
        acceleration: 1,
        tireWear: 1,
        bodyWear: 1,
      };
      for (const id of Object.values(installed)) {
        const unit = s.parts.find((p) => p.id === id),
          def = G.Parts.definition(unit.definitionId),
          quality = unit.condition / 100;
        for (const [key, n] of Object.entries(def.effects))
          v[key] +=
            n *
            (n > 0 &&
            !["weight", "stress", "bodyWear", "tireWear"].includes(key)
              ? quality
              : 1);
      }
      return v;
    },
    recalculate(s, car) {
      const v = this.configuration(s, car);
      for (const k of attributes) car[k] = Math.round(v[k] * 1000) / 1000;
      car.condition = this.summary(car.components);
      car.tires = car.components.tires;
      car.upgradeValue = Object.values(car.installed).reduce((n, id) => {
        const p = s.parts.find((p) => p.id === id);
        return (
          n +
          (G.Parts.definition(p.definitionId).price * 0.5 * p.condition) / 100
        );
      }, 0);
    },
    ready(car) {
      return (
        car.condition >= 45 &&
        car.tires >= 20 &&
        ["engine", "transmission", "brakes", "cooling"].every(
          (k) => car.components[k] >= 30,
        )
      );
    },
    rules(s, car, installed) {
      const ids = Object.values(installed),
        defs = ids.map((id) =>
          G.Parts.definition(s.parts.find((p) => p.id === id).definitionId),
        );
      for (const d of defs) {
        if (d.models && !d.models.includes(car.modelIndex))
          return "Modelo incompatible: " + d.name + ".";
        if (
          (d.requires || []).some(
            (id) => !defs.some((other) => other.id === id),
          )
        )
          return (
            "Requiere " +
            d.requires.map((id) => G.Parts.definition(id).name).join(" y ") +
            "."
          );
      }
      const v = this.configuration(s, car, installed);
      if (v.hp > 210.0001)
        return "El reglamento de la Copa Club limita la potencia a 210 CV.";
      if (v.weight < 850)
        return "La configuración supera el aligerado técnicamente admisible.";
      return "";
    },
    fit(s, car, unit) {
      if (!car || !unit) return "Selecciona un coche y una pieza.";
      const d = G.Parts.definition(unit.definitionId);
      if (!d) return "Pieza desconocida.";
      if (unit.condition < 25)
        return "La pieza está demasiado desgastada para instalarse.";
      return this.rules(s, car, { ...car.installed, [d.slot]: unit.id });
    },
    buy(s, partId, companyId = s.playerId) {
      const part = s.parts.find((p) => p.id === partId),
        c = s.companies.find((c) => c.id === companyId);
      G.assert(
        !s.race && part && part.companyId === null && c?.status === "active",
        "Esta pieza ya no está disponible.",
      );
      G.assert(
        this.occupied(s, companyId) < c.sparesCapacity,
        "El almacén de repuestos está lleno.",
      );
      const cost = Math.round(
        (G.Parts.definition(part.definitionId).price * part.condition) / 100,
      );
      G.Economy.spendCompany(
        s,
        companyId,
        cost,
        "Repuestos",
        `Compra · ${G.Parts.definition(part.definitionId).name} · ${part.id}`,
      );
      s.partsSupplier.balance += cost;
      part.companyId = companyId;
      return part;
    },
    sell(s, partId, companyId = s.playerId) {
      const part = s.parts.find((p) => p.id === partId),
        c = s.companies.find((c) => c.id === companyId);
      G.assert(
        !s.race &&
          c?.status === "active" &&
          part?.companyId === companyId &&
          !part.carId &&
          !part.reservedFor,
        "La pieza está instalada, reservada o no te pertenece.",
      );
      const value = Math.round(
        (G.Parts.definition(part.definitionId).price * 0.6 * part.condition) /
          100,
      );
      G.assert(
        s.partsSupplier.balance >= value,
        "El proveedor no tiene liquidez para recomprar esa pieza.",
      );
      s.partsSupplier.balance -= value;
      G.Economy.transact(
        s,
        companyId,
        value,
        "Repuestos",
        `Venta de repuesto · ${part.id}`,
      );
      part.companyId = null;
      return value;
    },
    available(s, car, companyId = s.playerId) {
      const c = s.companies.find((c) => c.id === companyId);
      G.assert(
        c?.status === "active" && car?.companyId === companyId,
        "El vehículo no pertenece a una compañía activa.",
      );
      G.assert(
        !s.race && !G.Market.listed(s, car.id),
        "Termina la carrera o retira el anuncio de venta.",
      );
      G.assert(
        !(companyId === s.playerId ? s.job : c.job) &&
          !G.ownedCars(s, companyId).some((c) => c.repair),
        "El taller está ocupado.",
      );
    },
    install(s, carId, partId, companyId = s.playerId) {
      const car = s.cars.find((c) => c.id === carId),
        part = s.parts.find((p) => p.id === partId);
      this.available(s, car, companyId);
      G.assert(
        part?.companyId === companyId && !part.carId && !part.reservedFor,
        "La pieza no está disponible en el almacén.",
      );
      G.assert(
        !G.Market.locked(s, car.id),
        "Retira la inscripción antes de modificar el coche.",
      );
      const reason = this.fit(s, car, part);
      G.assert(!reason, reason);
      const def = G.Parts.definition(part.definitionId);
      G.Economy.spendCompany(
        s,
        companyId,
        def.labor,
        "Taller",
        `Instalación · ${def.name}`,
      );
      const job = {
        id: G.uid(s, "work"),
        type: "install",
        partId,
        slot: def.slot,
        start: s.day,
        end: s.day + def.days,
        cost: def.labor,
      };
      part.reservedFor = job.id;
      car.repair = job;
      return job;
    },
    remove(s, carId, slot, companyId = s.playerId) {
      const car = s.cars.find((c) => c.id === carId);
      this.available(s, car, companyId);
      G.assert(
        !G.Market.locked(s, car.id),
        "Retira la inscripción antes de modificar el coche.",
      );
      const unit = s.parts.find((p) => p.id === car.installed[slot]);
      G.assert(unit, "No hay una modificación en ese alojamiento.");
      const rest = { ...car.installed };
      delete rest[slot];
      const reason = this.rules(s, car, rest);
      G.assert(!reason, reason);
      const c = s.companies.find((c) => c.id === companyId);
      G.assert(
        this.occupied(s, companyId) < c.sparesCapacity,
        "No hay espacio para recuperar la pieza desmontada.",
      );
      const cost = Math.round(
        G.Parts.definition(unit.definitionId).labor * 0.6,
      );
      G.Economy.spendCompany(
        s,
        companyId,
        cost,
        "Taller",
        `Desmontaje · ${G.Parts.definition(unit.definitionId).name}`,
      );
      car.repair = {
        id: G.uid(s, "work"),
        type: "remove",
        partId: unit.id,
        slot,
        start: s.day,
        end: s.day + 1,
        cost,
      };
      return car.repair;
    },
    repairQuote(car, component = "all", s = null) {
      if (component === "all")
        return Math.round((100 - car.condition) * 24 + 120);
      if (component === "tires") return s ? this.tireCost(s, car) : 160;
      G.assert(K.includes(component), "Componente desconocido.");
      const rate = {
        engine: 26,
        transmission: 19,
        brakes: 8,
        suspension: 12,
        cooling: 9,
        body: 10,
      };
      return Math.round(
        (100 - car.components[component]) * rate[component] + 40,
      );
    },
    repair(s, carId, component = "all", companyId = s.playerId) {
      const car = s.cars.find((c) => c.id === carId);
      this.available(s, car, companyId);
      G.assert(
        component === "all" || K.includes(component),
        "Componente desconocido.",
      );
      G.assert(
        (component === "all" ? car.condition : car.components[component]) < 99,
        "El componente ya está en buen estado.",
      );
      const cost = this.repairQuote(car, component, s),
        days =
          component === "all" ||
          component === "engine" ||
          component === "transmission"
            ? 2
            : 1;
      G.Economy.spendCompany(
        s,
        companyId,
        cost,
        "Taller",
        `Revisión · ${component === "all" ? car.model : G.Parts.components[component]}`,
      );
      car.repair = {
        id: G.uid(s, "work"),
        type: "repair",
        component,
        start: s.day,
        end: s.day + days,
        cost,
      };
      return car.repair;
    },
    complete(s, car) {
      const job = car.repair;
      if (!job || s.day < job.end) return;
      let text;
      if (job.type === "repair") {
        if (job.component === "all")
          for (const k of K.filter((k) => k !== "tires"))
            car.components[k] = 100;
        else {
          car.components[job.component] = 100;
          if (job.component === "tires") {
            const tire = s.parts.find((p) => p.id === car.installed.tires);
            if (tire) tire.condition = 100;
            else car.oemTires = 100;
          }
        }
        text =
          job.component === "all"
            ? "Revisión completa"
            : `Reparación de ${G.Parts.components[job.component]}`;
      } else {
        const part = s.parts.find((p) => p.id === job.partId),
          def = G.Parts.definition(part.definitionId);
        if (job.type === "install") {
          const old = s.parts.find((p) => p.id === car.installed[job.slot]);
          if (old) {
            old.carId = null;
            if (job.slot === "tires") old.condition = car.components.tires;
          }
          car.installed[job.slot] = part.id;
          part.carId = car.id;
          part.reservedFor = null;
          if (job.slot === "tires") {
            if (!old) car.oemTires = car.components.tires;
            car.components.tires = part.condition;
          }
          text = "Instalación: " + def.name;
        } else {
          delete car.installed[job.slot];
          part.carId = null;
          if (job.slot === "tires") {
            part.condition = car.components.tires;
            car.components.tires = car.oemTires;
          }
          text = "Desmontaje: " + def.name;
        }
      }
      car.repair = null;
      this.recalculate(s, car);
      car.history.unshift({ day: s.day, type: text });
      car.history.length = Math.min(30, car.history.length);
      G.news(
        s,
        "Taller",
        `${car.brand} ${car.model}: ${text.toLowerCase()}.`,
        "El trabajo ha terminado. La configuración, el inventario y las prestaciones ya están actualizados.",
        "car",
        car.id,
      );
    },
    transferParts(s, car, buyerId) {
      for (const id of Object.values(car.installed)) {
        const part = s.parts.find((p) => p.id === id);
        part.companyId = buyerId;
      }
    },
    raceSnapshot(s, car) {
      const v = this.configuration(s, car);
      return {
        components: G.clone(car.components),
        partWear: Object.fromEntries(
          Object.values(car.installed).map((id) => [
            id,
            s.parts.find((p) => p.id === id).condition,
          ]),
        ),
        thermal: 82,
        stress: v.stress,
        cooling: v.cooling,
        acceleration: v.acceleration,
        tireWear: v.tireWear,
        bodyWear: v.bodyWear,
      };
    },
    mechanical(a) {
      return (
        (0.88 + a.components.engine * 0.0012) *
        (0.9 + a.components.transmission * 0.001) *
        G.clamp(1 - Math.max(0, a.thermal - 105) * 0.004, 0.75, 1)
      );
    },
    wear(a, moved, dt, braking) {
      const load = a.mode === "attack" ? 1.5 : a.mode === "save" ? 0.7 : 1;
      const temp =
        82 +
        (a.mode === "attack" ? 18 : a.mode === "save" ? 3 : 8) +
        a.stress * 42 -
        (a.cooling - 1) * 12 +
        (100 - a.components.cooling) * 0.16;
      a.thermal += (temp - a.thermal) * dt * 0.025;
      const rates = {
        engine:
          0.00024 *
          (1 + a.stress + Math.max(0, a.thermal - 100) / 30) *
          (1 + (100 - a.reliability) / 140),
        transmission: 0.00019 * (1 + a.stress * 0.5),
        brakes: 0.00013 * (1 + braking * 1.8),
        suspension: 0.00016,
        cooling: 0.00012 * (1 + a.stress),
        body: 0.00006 * a.bodyWear,
      };
      for (const [k, rate] of Object.entries(rates))
        a.components[k] = Math.max(0, a.components[k] - moved * rate * load);
      a.components.tires = a.tires;
      a.condition = this.summary(a.components);
      for (const id of Object.keys(a.partWear))
        a.partWear[id] = Math.max(
          0,
          a.partWear[id] - moved * 0.00045 * load * (1 + a.stress * 0.5),
        );
    },
    validate(s) {
      G.assert(
        s.partsSupplier &&
          Number.isFinite(s.partsSupplier.balance) &&
          s.partsSupplier.balance >= 0,
        "Saldo del proveedor de repuestos inválido.",
      );
      const jobIds = new Set(),
        installedIds = new Set(),
        number = (x) => Number.isFinite(x) && x >= 0 && x <= 100;
      for (const c of s.companies)
        G.assert(
          Number.isInteger(c.sparesCapacity) &&
            c.sparesCapacity >= 1 &&
            c.sparesCapacity <= 100 &&
            this.occupied(s, c.id) <= c.sparesCapacity,
          "Capacidad de repuestos excedida o inválida.",
        );
      for (const car of s.cars) {
        G.assert(
          car.components &&
            K.every((k) => number(car.components[k])) &&
            car.base &&
            attributes.every(
              (k) => Number.isFinite(car.base[k]) && Number.isFinite(car[k]),
            ) &&
            car.base.hp > 0 &&
            car.base.weight > 0 &&
            car.installed &&
            typeof car.installed === "object" &&
            !Array.isArray(car.installed) &&
            number(car.oemTires),
          "Configuración mecánica inválida.",
        );
        for (const [slot, id] of Object.entries(car.installed)) {
          const unit = s.parts.find((p) => p.id === id),
            def = G.Parts.definition(unit?.definitionId);
          G.assert(
            unit &&
              def?.slot === slot &&
              unit.companyId === car.companyId &&
              unit.carId === car.id &&
              !unit.reservedFor &&
              !installedIds.has(id),
            "Pieza instalada duplicada, incompatible o con propietario incorrecto.",
          );
          installedIds.add(id);
        }
        G.assert(
          !this.rules(s, car, car.installed),
          "La configuración instalada incumple los requisitos.",
        );
        if (car.repair) {
          const j = car.repair;
          G.assert(
            ["install", "remove", "repair"].includes(j.type) &&
              Number.isInteger(j.start) &&
              Number.isInteger(j.end) &&
              j.end >= j.start &&
              Number.isFinite(j.cost) &&
              j.cost >= 0 &&
              !jobIds.has(j.id),
            "Trabajo de taller inválido.",
          );
          jobIds.add(j.id);
          if (j.type === "repair")
            G.assert(
              j.component === "all" || K.includes(j.component),
              "Reparación de componente inválida.",
            );
          else {
            const p = s.parts.find((p) => p.id === j.partId),
              d = G.Parts.definition(p?.definitionId);
            G.assert(
              p &&
                d?.slot === j.slot &&
                p.companyId === car.companyId &&
                (j.type === "install"
                  ? p.carId === null && p.reservedFor === j.id
                  : car.installed[j.slot] === p.id),
              "Pieza reservada o trabajo de instalación inválidos.",
            );
          }
        }
      }
      for (const p of s.parts) {
        G.assert(
          G.Parts.definition(p.definitionId) &&
            number(p.condition) &&
            (p.companyId === null ||
              s.companies.some((c) => c.id === p.companyId)) &&
            (p.carId === null || installedIds.has(p.id)),
          "Inventario de piezas inválido.",
        );
        G.assert(
          p.companyId !== null || (p.carId === null && p.reservedFor === null),
          "El proveedor contiene una pieza instalada o reservada.",
        );
        if (p.reservedFor)
          G.assert(
            s.cars.some(
              (c) =>
                c.repair?.id === p.reservedFor &&
                c.repair.type === "install" &&
                c.repair.partId === p.id,
            ),
            "Reserva de pieza huérfana.",
          );
      }
      for (const c of s.companies)
        G.assert(
          G.ownedCars(s, c.id).filter((car) => car.repair).length <= 1 &&
            (!(c.id === s.playerId ? s.job : c.job) ||
              !G.ownedCars(s, c.id).some((car) => car.repair)),
          "El taller tiene trabajos simultáneos incompatibles.",
        );
      if (s.race?.mechanicalVersion === 3)
        for (const a of s.race.entrants)
          G.assert(
            a.components &&
              K.every((k) => number(a.components[k])) &&
              Number.isFinite(a.thermal) &&
              Number.isFinite(a.stress) &&
              Number.isFinite(a.cooling) &&
              Number.isFinite(a.acceleration) &&
              Number.isFinite(a.tireWear) &&
              Number.isFinite(a.bodyWear) &&
              a.partWear &&
              Object.entries(a.partWear).every(
                ([id, v]) =>
                  s.parts.some((p) => p.id === id && p.carId === a.carId) &&
                  number(v),
              ),
            "Estado mecánico de carrera inválido.",
          );
    },
    finishRace(s, car, a, modern) {
      if (modern) {
        car.components = G.clone(a.components);
        for (const [id, value] of Object.entries(a.partWear)) {
          const unit = s.parts.find((p) => p.id === id);
          unit.condition = value;
        }
        car.components.tires = a.tires;
        if (!car.installed.tires) car.oemTires = a.tires;
        if (car.installed.tires)
          s.parts.find((p) => p.id === car.installed.tires).condition = a.tires;
        this.recalculate(s, car);
      } else {
        for (const k of K)
          car.components[k] = k === "tires" ? a.tires : a.condition;
        car.oemTires = a.tires;
      }
    },
  };
})();

(() => {
  const G = RCS,
    W = G.Workshop;
  W.tireCost = (s, car) => {
    const p = s.parts.find((p) => p.id === car.installed.tires);
    return p ? G.Parts.definition(p.definitionId).price : 160;
  };
  W.aiCandidates = function (s, c, budget, days, profile) {
    if (c.job || G.ownedCars(s, c.id).some((car) => car.repair)) return [];
    const rows = [],
      add = (action, utility, reason, targetId, cost, run) =>
        rows.push({ action, utility, reason, targetId, cost, run });
    for (const car of G.ownedCars(s, c.id).filter(
      (car) => !G.Market.listed(s, car.id),
    )) {
      for (const [key, health] of Object.entries(car.components))
        if (key !== "tires" && health < 40) {
          const cost = this.repairQuote(car, key);
          if (c.balance >= cost + 370)
            add(
              "reparación focal",
              112,
              "Restaurar un componente crítico que impide competir con fiabilidad.",
              car.id,
              cost,
              () => this.repair(s, car.id, key, c.id),
            );
        }
      if (days <= 4 || profile.car < 1 || G.Market.locked(s, car.id)) continue;
      const proposals = [];
      for (const d of G.Parts.catalogue) {
        if (car.installed[d.slot]) continue;
        const stored = this.inventory(s, c.id).find(
          (p) => p.definitionId === d.id && !p.reservedFor && p.condition >= 70,
        );
        const unit =
          stored || this.stock(s, d.id).find((p) => p.condition >= 70);
        if (!unit || this.fit(s, car, unit)) continue;
        const cost = stored
          ? d.labor
          : Math.round((d.price * unit.condition) / 100) + d.labor;
        if (
          cost > budget ||
          (!stored && this.occupied(s, c.id) >= c.sparesCapacity)
        )
          continue;
        const future = this.configuration(s, car, {
          ...car.installed,
          [d.slot]: unit.id,
        });
        const gain =
          (future.hp / future.weight - car.hp / car.weight) * 120 +
          (future.grip - car.grip) * 0.45 +
          (future.brakes - car.brakes) * 0.2 +
          (future.reliability - car.reliability) * 0.2;
        if (gain < 1) continue;
        proposals.push({ d, unit, stored, gain, cost });
      }
      proposals.sort(
        (a, b) =>
          b.gain / b.cost - a.gain / a.cost || a.d.id.localeCompare(b.d.id),
      );
      const best = proposals[0];
      if (best) {
        const { d, unit, stored, gain } = best;
        add(
          stored ? "instalación" : "repuesto",
          42 + gain * profile.car,
          "Mejorar el rendimiento con una pieza compatible sin gastar la reserva salarial.",
          car.id,
          stored ? d.labor : Math.round((d.price * unit.condition) / 100),
          () =>
            stored
              ? this.install(s, car.id, unit.id, c.id)
              : this.buy(s, unit.id, c.id),
        );
      }
    }
    return rows;
  };
})();
