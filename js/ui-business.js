"use strict";
(() => {
  const G = RCS,
    U = G.UI;
  U.market = function (s) {
    const player = G.player(s),
      owned = G.ownedCars(s),
      spaces = player.carCapacity - owned.length;
    const rows = s.market.map((l) => ({
      l,
      car: s.cars.find((c) => c.id === l.carId),
      seller: s.companies.find((c) => c.id === l.sellerId),
    }));
    const tradable = rows.filter(({ l }) => l.sellerId !== s.playerId).length;
    return (
      this.heading(
        "MERCADO DE VEHÍCULOS",
        "Encuentra tu próxima máquina.",
        "Unidades reales del mismo mundo en el que compites. Cada coche conserva su historial.",
        `<button class="secondary" data-go="garage">Volver al garaje →</button>`,
      ) +
      `<div class="overview-strip">${this.stat("Vehículos en venta", tradable, "Los rivales también compran aquí")}${this.stat("Plazas libres", spaces + " <span>/ " + player.carCapacity + "</span>", spaces ? "Espacio disponible en tu garaje" : "Vende un coche para liberar espacio")}${this.stat("Tu presupuesto", this.money(player.balance), "Compra y transporte no incluidos en carreras")}${this.stat("En tu flota", owned.length + " <span>coches</span>", "Las mejoras instaladas viajan con el vehículo")}</div>
    <div class="context-banner"><span class="context-number">${spaces ? "↗" : "!"}</span><div><strong>${spaces ? "Revisa el estado antes de decidir." : "Tu garaje está completo."}</strong><p>${spaces ? "El precio de compra se paga una sola vez. Después tendrás que financiar piloto, mantenimiento e inscripciones." : "Vende una de tus unidades para recuperar espacio. Publicar o retirar un anuncio no libera una plaza: el vehículo debe cambiar de propietario."}</p></div><button class="text-button" data-go="finance">Revisar finanzas →</button></div>
    <div class="section-title"><h2>Vehículos disponibles</h2><span class="muted">${rows.length} anuncios · Consulta cada historial</span></div>
    <div class="market-grid">${
      rows.length
        ? rows
            .map(({ l, car, seller }) => {
              const mine = l.sellerId === s.playerId,
                canBuy = spaces > 0 && player.balance >= l.price,
                warning = !spaces
                  ? "Garaje sin plazas libres"
                  : player.balance < l.price
                    ? "No alcanza tu presupuesto"
                    : car.condition < 60
                      ? "Necesitará atención de taller"
                      : "Disponible para tu compañía";
              return `<article class="panel market-card"><div class="panel-heading"><span class="eyebrow">${this.escape(seller?.name || "Club Usados")}</span>${this.badge(seller?.status === "bankrupt" ? "Liquidación" : mine ? "Tu anuncio" : "Usado", mine ? "outline" : "")}</div><button class="market-art" data-action="car-detail" data-id="${car.id}" aria-label="Ver historial de ${car.brand} ${car.model}">${G.Render.carSVG(car)}</button><div class="padded"><div class="market-card-heading"><div><span class="eyebrow">${car.brand.toUpperCase()} · ${car.generation} · ${car.year}</span><h2>${car.model}</h2></div><span class="vehicle-number">${String(car.id.split("-").at(-1)).padStart(2, "0")}</span></div><div class="card-kpis"><span><b>${Math.round(car.hp)}</b><small>CV</small></span><span><b>${Math.round(car.weight).toLocaleString("es-ES")}</b><small>kg</small></span><span><b>${Math.round(car.km).toLocaleString("es-ES")}</b><small>km recorridos</small></span></div>${this.bar("Estado mecánico", car.condition, car.condition < 50 ? "#d9684a" : "")}${this.bar("Vida de neumáticos", car.tires)}<p class="availability-note ${mine ? "" : canBuy ? "positive" : "negative"}">${mine ? "Puedes retirar el anuncio hasta que se venda." : warning}</p><div class="market-price"><div><small class="eyebrow">Precio de compra</small><b>${this.money(l.price)}</b></div>${this.button(mine ? "Retirar anuncio" : "Comprar unidad", mine ? "withdraw-listing" : "buy-car", mine ? "secondary" : "primary", `data-id="${l.id}" ${!mine && !canBuy ? "disabled" : ""}`)}</div><p class="purchase-balance">${mine ? "Conservas el coche y su plaza hasta la venta." : canBuy ? "Saldo después de comprar: <strong>" + this.money(player.balance - l.price) + "</strong>" : "Abre el historial para estudiar la unidad antes de invertir."}</p></div></article>`;
            })
            .join("")
        : `<section class="panel empty-state"><h2>No quedan unidades anunciadas.</h2><p>Las compañías podrán publicar vehículos al renovar su flota o buscar liquidez. No aparecen coches nuevos al actualizar esta pantalla.</p><button class="secondary" data-go="companies">Consultar las compañías →</button></section>`
    }</div>
    <section class="panel padded spaced"><div class="section-title"><div><span class="eyebrow">Actividad del mercado</span><h2>Operaciones confirmadas</h2></div><span class="muted">Últimas ${Math.min(8, s.trades.length)}</span></div>${
      s.trades
        .slice(0, 8)
        .map(
          (t) =>
            `<div class="timeline-line"><small>${this.date(t.day, true)}</small><span><strong>${this.escape(s.companies.find((c) => c.id === t.to).name)}</strong><br><small class="muted">${t.kind === "car" ? "Adquisición de un vehículo" : "Traspaso de piloto"} · ${this.escape(t.entityId)}</small></span><b>${this.money(t.price)}</b></div>`,
        )
        .join("") ||
      '<p class="muted">Todavía no se ha cerrado ninguna operación.</p>'
    }</section>`
    );
  };
  U.companies = function (s) {
    const active = s.companies.filter((c) => c.status === "active").length;
    return (
      this.heading(
        "COMPAÑÍAS DEL PADDOCK",
        "Conoce a quienes compiten contigo.",
        "Sus decisiones cambian el mercado y la parrilla. Consulta sus recursos y su trayectoria.",
        `<button class="secondary" data-go="market">Mercado compartido ↗</button>`,
      ) +
      `<div class="context-banner"><span class="context-number">${active}</span><div><strong>Compañías en activo</strong><p>Presupuestos, pilotos y coches persistentes. Una compañía en bancarrota queda fuera de la competición.</p></div><button class="text-button" data-go="competition">Ver la clasificación →</button></div><div class="companies-grid">${s.companies
        .map((c) => {
          const drivers = G.ownedDrivers(s, c.id),
            cars = G.ownedCars(s, c.id),
            last = c.decisions[0],
            policy = G.AI.policy(c),
            mine = c.id === s.playerId;
          return `<article class="panel rival-card"><div class="rival-card-accent" style="background:${c.color}"></div><div class="padded"><div class="company-profile"><span class="company-swatch" style="background:${c.color}">${this.escape(c.name.slice(0, 2).toUpperCase())}</span><div><span class="eyebrow">${mine ? "Tu compañía" : this.escape(c.personality)}</span><h2>${this.escape(c.name)}</h2><p>${this.escape(c.owner)}</p></div></div><div class="rival-health">${this.badge(c.status === "bankrupt" ? "Bancarrota" : c.balance < 0 ? "En crisis" : "En activo", c.status === "active" && c.balance >= 0 ? "green" : "outline")}<div><small>Capital disponible</small><strong class="${c.balance < 0 ? "negative" : ""}">${this.money(c.balance)}</strong></div></div><div class="card-kpis"><span><b>${cars.length}<em>/${c.carCapacity}</em></b><small>Coches</small></span><span><b>${drivers.length}<em>/${c.driverCapacity}</em></b><small>Pilotos</small></span><span><b>${c.stats.wins}</b><small>Victorias</small></span></div><div class="rival-objective"><span class="eyebrow">Objetivo de dirección</span><p>${mine ? "Tus decisiones marcan el rumbo de esta compañía." : this.escape(policy.objective)}</p></div><div class="last-decision"><span class="eyebrow">Último movimiento</span><p>${last ? "<strong>" + this.date(last.day, true) + " · " + this.escape(last.action) + "</strong><br>" + this.escape(last.reason) : "No hay movimientos empresariales registrados todavía."}</p></div>${this.button("Abrir expediente", "company", "secondary wide", `data-id="${c.id}"`)}</div></article>`;
        })
        .join("")}</div>`
    );
  };
  U.companyBody = function (s, c) {
    const cars = G.ownedCars(s, c.id),
      drivers = G.ownedDrivers(s, c.id),
      mine = c.id === s.playerId,
      lineup = G.Companies.lineup(s, c.id);
    return `<div class="company-profile company-profile-large">${mine ? this.logo(s) : `<span class="company-swatch" style="background:${c.color}">${this.escape(c.name.slice(0, 2).toUpperCase())}</span>`}<div><span class="eyebrow">${this.escape(c.personality)} · ${c.status === "active" ? "En activo" : "Bancarrota"}</span><h3>${this.escape(c.name)}</h3><p>Dirección: ${this.escape(c.owner)}</p></div></div><div class="spec-grid">${this.stat("Capital disponible", this.money(c.balance))}${this.stat("Gasto mensual previsto", this.money(G.Companies.monthly(s, c.id)))}${this.stat("Reputación", c.reputation.toFixed(1) + " <span>/ 100</span>")}${this.stat("Palmarés", c.stats.wins + " <span>victorias</span>", c.stats.starts + " participaciones")}</div><div class="context-banner"><div><strong>Objetivo empresarial</strong><p>${mine ? "Tu dirección decide las prioridades." : this.escape(G.AI.policy(c).objective)}</p></div></div><div class="business-detail-grid"><section><div class="section-title"><h3>Plantilla</h3><span class="muted">${drivers.length}/${c.driverCapacity} asientos</span></div>${drivers.map((d) => `<div class="timeline-line"><span><button class="text-button" data-action="driver-detail" data-id="${d.id}">${this.escape(d.name)} ↗</button><br><small class="muted">${G.Drivers.rating(d)} de valoración${lineup.driver?.id === d.id ? " · Mejor piloto disponible" : ""}${d.transferListed ? " · Transferible" : ""}</small></span><b>${this.money(d.contract.salary)}<small class="muted"> / mes</small></b></div>`).join("") || '<p class="muted">No tiene pilotos contratados.</p>'}</section><section><div class="section-title"><h3>Vehículos</h3><span class="muted">${cars.length}/${c.carCapacity} plazas</span></div>${cars.map((car) => `<div class="timeline-line"><span><button class="text-button" data-action="car-detail" data-id="${car.id}">${car.brand} ${car.model} ↗</button><br><small class="muted">${this.escape(car.id)} · ${car.hp} CV${G.Market.listed(s, car.id) ? " · En venta" : car.repair ? " · En taller" : lineup.car?.id === car.id ? " · Mejor unidad disponible" : ""}</small></span><b>${Math.round(car.condition)} %</b></div>`).join("") || '<p class="muted">No dispone de vehículos.</p>'}</section></div><div class="section-title spaced"><h3>Decisiones de dirección</h3><span class="muted">Movimientos y motivos reales</span></div>${
      c.decisions
        .slice(0, 8)
        .map(
          (d) =>
            `<div class="decision-record"><span class="eyebrow">${this.date(d.day, true)} · ${this.escape(d.action)}</span><p>${this.escape(d.reason)}</p>${d.cost ? `<small>Coste abonado: ${this.money(d.cost)}</small>` : ""}</div>`,
        )
        .join("") ||
      '<p class="muted">Todavía no se han registrado decisiones automáticas.</p>'
    }<div class="section-title spaced"><h3>Movimientos de caja</h3><span class="muted">Últimos 8 registros</span></div>${
      c.ledger
        .slice(0, 8)
        .map(
          (t) =>
            `<div class="timeline-line"><small>${this.date(t.day, true)}</small><span>${this.escape(t.label)}</span><b class="${t.amount >= 0 ? "positive" : "negative"}">${t.amount > 0 ? "+" : ""}${this.money(t.amount)}</b></div>`,
        )
        .join("") ||
      '<p class="muted">No hay movimientos económicos registrados.</p>'
    }`;
  };
  const garage = U.garage;
  U.garage = function (s) {
    const cars = G.ownedCars(s),
      car = cars.find((c) => c.id === G.App.selectedCarId) || cars[0];
    const header = `<div class="fleet-nav"><div>${cars.map((c, i) => `<button class="fleet-choice ${c === car ? "primary" : "secondary"}" data-action="select-car" data-id="${c.id}" aria-pressed="${c === car}"><span class="fleet-choice-index">${String(i + 1).padStart(2, "0")}</span><span><b>${c.brand} ${c.model}</b><small>${c.repair ? "En taller" : G.Market.listed(s, c.id) ? "Anunciado en el mercado" : "Vehículo propio"} · ${Math.round(c.condition)} % de estado</small></span></button>`).join("")}</div><button class="secondary" data-go="market">Mercado Club ↗</button></div>`;
    if (!car)
      return (
        header +
        this.heading(
          "GARAJE",
          "El garaje está vacío.",
          "Puedes recuperar tu actividad comprando una unidad usada del mercado compartido.",
        ) +
        '<section class="panel empty-state"><h2>Un nuevo comienzo sobre cuatro ruedas.</h2><p>Las ventas son definitivas: conserva suficiente presupuesto para tu próximo coche y piloto.</p><button class="primary" data-go="market">Consultar unidades disponibles →</button></section>'
      );
    const l = G.Market.listed(s, car.id);
    return (
      header +
      garage
        .call(this, {
          ...s,
          cars: [car, ...s.cars.filter((c) => c.id !== car.id)],
        })
        .replace(
          "GARAJE 01 / 02",
          `GARAJE ${String(cars.indexOf(car) + 1).padStart(2, "0")} / ${String(G.player(s).carCapacity).padStart(2, "0")}`,
        ) +
      `<section class="panel padded spaced"><div class="section-title"><h2>${l ? "Tu anuncio sigue publicado" : "Vender este vehículo"}</h2>${l ? this.badge(this.money(l.price), "outline") : this.badge("UNIDAD " + car.id, "outline")}</div><p class="muted">${l ? "Tu compañía sigue siendo propietaria hasta que se cierre la venta. Puedes retirar el anuncio en cualquier momento." : "Publica una oferta para que otras compañías puedan comprarlo. La unidad se vende con sus mejoras instaladas y su historial."} Mientras esté anunciado no podrás inscribirlo en una carrera.</p>${cars.length === 1 ? '<p class="asset-advice">Es tu único coche. Si lo vendes, necesitarás otra unidad antes de volver a competir.</p>' : ""}<div class="modal-actions">${this.button(l ? "Retirar anuncio" : "Poner a la venta", l ? "withdraw-listing" : "list-car", "secondary", `data-id="${l?.id || car.id}"`)}</div></section>`
    );
  };
  const team = U.team;
  U.team = function (s) {
    const offers = s.transferOffers.filter((o) => o.status === "pending"),
      available = s.drivers.filter(
        (d) =>
          d.companyId &&
          d.companyId !== s.playerId &&
          G.Companies.willing(s, d),
      );
    return (
      `${offers.length ? `<section class="panel padded offers-inbox"><div class="section-title"><h2>Ofertas por tus pilotos</h2>${this.badge(offers.length + " PENDIENTES")}</div>${offers.map((o) => `<div class="offer-row"><div><h3>${this.escape(s.companies.find((c) => c.id === o.buyerId).name)} quiere a ${this.escape(s.drivers.find((d) => d.id === o.driverId).name)}</h3><p>Recibirías ${this.money(o.fee)}. La oferta vence ${this.date(o.expires, true)}; al aceptar se liquida el salario pendiente y el piloto cambia de compañía.</p></div><div>${this.button("Aceptar traspaso", "accept-transfer", "primary", `data-id="${o.id}"`)}${this.button("Rechazar", "reject-transfer", "secondary", `data-id="${o.id}"`)}</div></div>`).join("")}</section>` : ""}` +
      team.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><h2>Pilotos disponibles para traspaso</h2><button class="text-button" data-go="companies">Consultar el paddock ↗</button></div>${available.length ? available.map((d) => `<div class="transfer-row"><div><h3>${this.escape(d.name)}</h3><p>${this.escape(s.companies.find((c) => c.id === d.companyId).name)} · Valoración ${G.Drivers.rating(d)} · Compensación ${this.money(G.Companies.fee(s, d))}</p></div>${this.button("Negociar traspaso", "transfer-driver", "secondary", `data-id="${d.id}"`)}</div>`).join("") : '<p class="muted">Ninguna escudería acepta negociar ahora. Las compañías liberarán pilotos de reserva o buscarán liquidez según su situación.</p>'}</section>`
    );
  };
})();

(() => {
  const G = RCS,
    U = G.UI;
  G.BusinessUI = {
    action(A, name, data) {
      const s = A.state;
      switch (name) {
        case "select-car":
          A.selectedCarId = data.id;
          A.go("garage");
          return true;
        case "car-detail":
          this.car(A, data.id);
          return true;
        case "buy-car": {
          const l = s.market.find((l) => l.id === data.id);
          G.assert(l, "La unidad ya no está en venta.");
          const car = s.cars.find((c) => c.id === l.carId);
          A.confirm(
            "Confirmar compra",
            `${car.brand} ${car.model} (${car.id}) por ${U.money(l.price)}. Ocupará una plaza de tu garaje y conservará el desgaste e historial.`,
            () => {
              A.mutate(() => {
                G.Market.buy(s, l.id);
                A.selectedCarId = car.id;
              }, "garage");
              U.toast(
                "Compra registrada. La unidad ya no aparece en el mercado.",
              );
            },
          );
          return true;
        }
        case "list-car": {
          const car = s.cars.find(
            (c) => c.id === data.id && c.companyId === s.playerId,
          );
          G.assert(car, "El coche ya no te pertenece.");
          const value = G.Market.value(car);
          U.modal(
            "Poner un vehículo a la venta",
            `<p>${car.brand} ${car.model} · ${car.id}. La valoración es ${U.money(value)}. El anuncio ocupa su plaza hasta que otro equipo compre.</p><form id="listing-form" data-id="${car.id}"><label class="form-field"><span>Precio solicitado ($)</span><input type="number" name="price" min="${Math.round(value * 0.5)}" max="${Math.round(value * 1.5)}" step="1" value="${value}" required></label><p class="fine-print">Mientras esté anunciado no podrás inscribirlo ni repararlo. No se pueden vender coches inscritos ni en revisión. Podrás retirar el anuncio hasta la venta.</p><div class="modal-actions"><button class="secondary" data-action="close">Cancelar</button><button class="primary" type="submit">Publicar anuncio</button></div></form>`,
          );
          return true;
        }
        case "withdraw-listing":
          A.mutate(() => G.Market.withdraw(s, data.id));
          U.toast("Anuncio retirado.");
          return true;
        case "transfer-driver":
          this.transfer(A, data.id);
          return true;
        case "accept-transfer": {
          const o = s.transferOffers.find((o) => o.id === data.id);
          G.assert(o, "Oferta desconocida.");
          const d = s.drivers.find((d) => d.id === o.driverId);
          A.confirm(
            "Autorizar traspaso",
            `${d.name} dejará tu equipo. Recibirás ${U.money(o.fee)} y se descontará su salario pendiente (${U.money(d.contract?.accrued || 0)}). Deberás encontrar otro piloto si no dispones de un sustituto.`,
            () => {
              A.mutate(() => G.Companies.resolve(s, o.id, true), "team");
              U.toast("Traspaso confirmado. Se han actualizado ambos equipos.");
            },
          );
          return true;
        }
        case "reject-transfer":
          A.mutate(() => G.Companies.resolve(s, data.id, false), "team");
          U.toast("Oferta rechazada. El piloto se queda.");
          return true;
        case "withdraw-entry":
          A.confirm(
            "Retirar inscripción",
            "Se liberan piloto y coche para operaciones empresariales. Los $370 de inscripción y transporte no se reembolsan.",
            () => {
              A.mutate(() => G.Race.withdraw(s, data.id), "competition");
              A.event(data.id);
            },
          );
          return true;
        default:
          return false;
      }
    },
    submit(A, form, values) {
      const s = A.state;
      if (form.id === "listing-form") {
        G.Market.list(s, form.dataset.id, Number(values.get("price")));
        A.close();
        A.persist();
        A.go("market");
        U.toast("Anuncio publicado en el mercado compartido.");
        return true;
      }
      if (form.id === "transfer-form") {
        G.Companies.sign(
          s,
          form.dataset.id,
          s.playerId,
          Number(values.get("salary")),
          Number(values.get("months")),
          Number(values.get("bonus")),
        );
        A.close();
        A.persist();
        A.go("team");
        U.toast(
          "Fichaje confirmado: el piloto y su historial ya están en tu plantilla.",
        );
        return true;
      }
      return false;
    },
    transfer(A, id) {
      const s = A.state,
        d = s.drivers.find((d) => d.id === id);
      G.assert(
        d && G.Companies.willing(s, d),
        "La compañía no acepta negociar este piloto.",
      );
      const seller = s.companies.find((c) => c.id === d.companyId),
        salary = G.Companies.salary(d),
        fee = G.Companies.fee(s, d);
      U.modal(
        "Acuerdo de traspaso",
        `<div class="company-profile">${U.portrait(d)}<div><h3>${U.escape(d.name)}</h3><p>${U.escape(seller.name)} · ${d.age} años · Valoración ${G.Drivers.rating(d)}</p></div></div><div class="counter-offer"><b>Compensación a su compañía: ${U.money(fee)}</b><p>El representante solicita al menos ${U.money(salary)}/mes. La compensación y la prima se abonan al firmar. La empresa anterior liquida sus salarios devengados.</p></div><form id="transfer-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Salario mensual ($)</span><input name="salary" type="number" min="${salary}" max="10000" step="1" value="${salary}" required></label><label class="form-field"><span>Duración</span><select name="months"><option value="6">6 meses</option><option value="12" selected>12 meses</option><option value="24">24 meses</option></select></label></div><label class="form-field"><span>Prima de fichaje ($)</span><input name="bonus" type="number" min="0" max="5000" step="1" value="300" required></label><div class="modal-actions"><button class="secondary" data-action="close">Retirarse</button><button class="primary" type="submit">Firmar traspaso</button></div></form>`,
        true,
      );
    },
    car(A, id) {
      const s = A.state,
        car = s.cars.find((c) => c.id === id);
      G.assert(car, "Vehículo desconocido.");
      const owner = s.companies.find((c) => c.id === car.companyId),
        l = G.Market.listed(s, id);
      U.modal(
        `${car.brand} ${car.model}`,
        `<div class="asset-profile"><div>${G.Render.carSVG(car)}</div><section><span class="eyebrow">${car.id} · ${car.year} · ${car.generation}</span><h3>Propietario: ${U.escape(owner?.name || "Club Usados")}</h3><p>${car.hp} CV · ${car.weight} kg · ${Math.round(car.km).toLocaleString("es-ES")} km</p>${U.bar("Mecánica", car.condition)}${U.bar("Neumáticos", car.tires)}${l ? `<p class="gold">Anunciado por ${U.money(l.price)}</p>` : ""}</section></div><h3 class="spaced">Historial persistente</h3>${car.history.map((h) => `<div class="timeline-line"><small>${U.date(h.day, true)}</small><span>${U.escape(h.type)}</span></div>`).join("") || '<p class="fine-print">Sin nuevos hechos registrados.</p>'}<div class="modal-actions">${owner ? U.button("Ver compañía propietaria", "company", "secondary", `data-id="${owner.id}"`) : ""}${l ? '<button class="primary" data-go="market">Consultar anuncio →</button>' : ""}</div>`,
        true,
      );
    },
  };
})();
