"use strict";
(() => {
  const G = RCS;
  // Shared wording for engine checks and their previews. These helpers never mutate a save.
  G.Feedback = {
    date: (day) =>
      G.dateAt(day).toLocaleDateString("es-ES", {
        timeZone: "UTC",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    money: (value) =>
      new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value),
    funds(s, cost, label = "esta acción", companyId = s.playerId) {
      const balance = s.companies.find((c) => c.id === companyId)?.balance || 0;
      return `No tienes fondos suficientes para ${label}: necesitas ${this.money(cost)}, tienes ${this.money(balance)} y te faltan ${this.money(Math.max(0, cost - balance))}. Reúne esa cantidad antes de intentarlo de nuevo.`;
    },
    car(s, car) {
      if (!car) return ["Selecciona un coche propio desde el garaje."];
      const reasons = [];
      if (car.repair)
        reasons.push(
          `${car.brand} ${car.model} está en el taller hasta el ${this.date(car.repair.end)}. Espera a que termine el trabajo o elige otro coche.`,
        );
      if (G.Market.listed(s, car.id))
        reasons.push(
          `${car.brand} ${car.model} está anunciado en el mercado. Retira su anuncio antes de usarlo.`,
        );
      if (G.Auctions?.locked(s, "car", car.id))
        reasons.push(
          "El coche está reservado en una subasta. Retira el lote si todavía es posible o espera a su resolución.",
        );
      if (car.condition < 45)
        reasons.push(
          `Estado general del coche: ${car.condition.toFixed(1)} %; se exige al menos 45 %. Repáralo en el taller.`,
        );
      if (car.tires < 20)
        reasons.push(
          `Neumáticos: ${car.tires.toFixed(1)} %; se exige al menos 20 %. Cambia las gomas en el taller.`,
        );
      for (const key of ["engine", "transmission", "brakes", "cooling"])
        if (car.components[key] < 30)
          reasons.push(
            `${G.Parts.components[key]}: ${car.components[key].toFixed(1)} %; se exige al menos 30 %. Repara ese componente en el taller.`,
          );
      return reasons;
    },
    employee(s, e) {
      if (!e?.contract || e.companyId !== s.playerId)
        return [
          "Contrata al especialista desde Personal o selecciona uno de tu plantilla.",
        ];
      const reasons = [],
        p = G.Professionals.profile(s, e.id),
        j = G.Practice.active(s);
      if (G.Professionals.resting(s, e.id))
        reasons.push(
          `${e.name} está descansando hasta el ${this.date(p.restUntil)}. Avanza hasta esa fecha o elige otro profesional.`,
        );
      if (e.contract.arrears)
        reasons.push(
          `${e.name} tiene ${this.money(e.contract.arrears)} de sueldo vencido. Recupera saldo para que la nómina se liquide al avanzar el calendario.`,
        );
      if (G.Staff.busy(s, e.id)) {
        const end =
          j?.coachId === e.id
            ? j.end
            : s.cars.find((c) => c.repair?.staffSupport?.employeeId === e.id)
                ?.repair.end ||
              s.staffing.assignments.find(
                (a) => a.employeeId === e.id && a.status === "active",
              )?.end;
        reasons.push(
          `${e.name} está ocupado en un trabajo o entrenamiento${end ? ` hasta el ${this.date(end)}` : ""}. Termina esa actividad antes de asignarle otra.`,
        );
      }
      return reasons;
    },
    staffHiring(s, e) {
      if (s.status !== "active")
        return "La compañía está en bancarrota. Solo puedes consultar su archivo o comenzar otra partida.";
      if (
        G.Challenge.enabled(s) &&
        G.player(s).level < G.Challenge.staffLevel(s, e)
      )
        return `Tu empresa es nivel ${G.player(s).level}; este especialista exige nivel ${G.Challenge.staffLevel(s, e)}. Cumple los objetivos de Instalaciones y progreso para ascender.`;
      if (G.Staff.owned(s).some((other) => other.role === e.role))
        return `Ya tienes un responsable de ${G.Staff.roles[e.role].name}. Solo se permite uno por especialidad; rescinde su contrato si quieres sustituirlo.`;
      if (G.Staff.owned(s).length >= G.Staff.capacity(s))
        return `Personal completo: ${G.Staff.owned(s).length}/${G.Staff.capacity(s)} plazas. Amplía la oficina o libera una plaza antes de contratar.`;
      return "";
    },
  };
})();
