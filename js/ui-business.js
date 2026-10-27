"use strict";
(() => {
  const G = RCS,
    U = G.UI;
  U.market = function (s) {
    const rows = s.market.map((l) => ({
      l,
      car: s.cars.find((c) => c.id === l.carId),
      seller: s.companies.find((c) => c.id === l.sellerId),
    }));
    return (
      this.heading(
        "MERCADO CLUB",
        "Un coche. Un propietario.",
        "El mismo inventario para todas las compañías. Los anuncios desaparecen al venderse.",
        `<button class="secondary" data-go="garage">Volver al garaje →</button>`,
      ) +
      `<div class="overview-strip">${this.stat("OFERTA DISPONIBLE", rows.length + " <span>unidades</span>", "Sin regeneración al comprar")}${this.stat("TU GARAJE", G.ownedCars(s).length + " / " + G.player(s).carCapacity, "La capacidad incluye coches en venta")}${this.stat("TU EFECTIVO", this.money(G.player(s).balance), "Los rivales también pueden comprar")}${this.stat("OPERACIONES DEL MUNDO", s.trades.length, "Registro reciente de coches y pilotos")}</div><div class="market-grid">${rows.length ? rows.map(({ l, car, seller }) => `<article class="panel market-card"><div class="panel-heading"><span class="eyebrow">${this.escape(seller?.name || "CLUB USADOS")}</span>${this.badge(seller?.status === "bankrupt" ? "LIQUIDACIÓN" : l.sellerId === s.playerId ? "TU ANUNCIO" : "UNIDAD ÚNICA", "outline")}</div><button class="market-art" data-action="car-detail" data-id="${car.id}" aria-label="Ver historial de ${car.brand} ${car.model}">${G.Render.carSVG(car)}</button><div class="padded"><span class="eyebrow">${car.brand.toUpperCase()} · ${car.generation} · ${car.year}</span><h2>${car.model}</h2><p class="market-spec">${car.hp} CV · ${Math.round(car.km).toLocaleString("es-ES")} km · ${car.id}</p>${this.bar("Estado mecánico", car.condition)}${this.bar("Neumáticos", car.tires)}<div class="market-price"><b>${this.money(l.price)}</b>${this.button(l.sellerId === s.playerId ? "Retirar anuncio" : "Comprar unidad", l.sellerId === s.playerId ? "withdraw-listing" : "buy-car", l.sellerId === s.playerId ? "secondary" : "primary", `data-id="${l.id}"`)}</div></div></article>`).join("") : `<section class="panel empty-state"><h2>Todo el stock ha encontrado dueño.</h2><p>El mercado es finito. Las compañías podrán anunciar vehículos al renovar su flota o necesitar liquidez.</p></section>`}</div><section class="panel padded spaced"><div class="section-title"><h2>Operaciones confirmadas</h2><span class="eyebrow">ÚLTIMAS ${Math.min(10, s.trades.length)}</span></div>${
        s.trades
          .slice(0, 10)
          .map(
            (t) =>
              `<div class="timeline-line"><small>${this.date(t.day, true)}</small><span>${this.escape(s.companies.find((c) => c.id === t.to).name)} · ${t.kind === "car" ? "Compra de vehículo" : "Fichaje"} · ${t.entityId}</span><b>${this.money(t.price)}</b></div>`,
          )
          .join("") ||
        '<p class="muted">No se ha confirmado ninguna operación todavía.</p>'
      }</section>`
    );
  };
  U.companies = function (s) {
    return (
      this.heading(
        "PADDOCK EMPRESARIAL",
        "Tus rivales también deciden.",
        "Cada escudería paga sus nóminas, administra su flota y persigue un objetivo propio.",
        `<button class="secondary" data-go="market">Mercado compartido ↗</button>`,
      ) +
      `<div class="companies-grid">${s.companies
        .map((c) => {
          const drivers = G.ownedDrivers(s, c.id),
            cars = G.ownedCars(s, c.id),
            last = c.decisions[0],
            policy = G.AI.policy(c);
          return `<article class="panel padded rival-card"><div class="company-profile"><span class="company-swatch" style="background:${c.color}">${this.escape(c.name.slice(0, 2).toUpperCase())}</span><div><h2>${this.escape(c.name)}</h2><p>${this.escape(c.personality)} · ${this.escape(c.owner)}</p></div></div><div class="rival-health">${this.badge(c.status === "bankrupt" ? "BANCARROTA" : c.balance < 0 ? "EN CRISIS" : "EN ACTIVO", c.status === "active" && c.balance >= 0 ? "green" : "outline")}<strong class="${c.balance < 0 ? "negative" : ""}">${this.money(c.balance)}</strong></div><p class="rival-objective">${c.id === s.playerId ? "Tu compañía. Tú defines su próximo movimiento." : this.escape(policy.objective)}</p><div class="passport-stats"><span>${cars.length}/${c.carCapacity} coches</span><span>${drivers.length}/${c.driverCapacity} pilotos</span><span>${c.stats.wins} victorias</span></div><div class="last-decision"><span class="eyebrow">ÚLTIMA DECISIÓN</span><p>${last ? this.date(last.day, true) + " · " + this.escape(last.action) + " · " + this.escape(last.reason) : "Sin movimientos empresariales registrados todavía."}</p></div>${this.button("Abrir expediente", "company", "secondary wide", `data-id="${c.id}"`)}</article>`;
        })
        .join("")}</div>`
    );
  };
  U.companyBody = function (s, c) {
    const cars = G.ownedCars(s, c.id),
      drivers = G.ownedDrivers(s, c.id);
    return `<div class="company-profile">${c.id === s.playerId ? this.logo(s) : `<span class="company-swatch" style="background:${c.color}">${this.escape(c.name.slice(0, 2).toUpperCase())}</span>`}<div><h3>${this.escape(c.name)}</h3><p>${this.escape(c.personality)} · ${this.escape(c.owner)} · ${c.status === "active" ? "En activo" : "Bancarrota"}</p></div></div><div class="spec-grid">${this.stat("EFECTIVO", this.money(c.balance))}${this.stat("GASTO MENSUAL", this.money(G.Companies.monthly(s, c.id)))}${this.stat("REPUTACIÓN", c.reputation.toFixed(1))}${this.stat("VICTORIAS / SALIDAS", c.stats.wins + " / " + c.stats.starts)}</div><p class="fine-print">${c.id === s.playerId ? "Tu dirección decide." : this.escape(G.AI.policy(c).objective)}</p><h3 class="spaced">Plantilla real · ${drivers.length}/${c.driverCapacity}</h3>${drivers.map((d) => `<div class="timeline-line"><button class="text-button" data-action="driver-detail" data-id="${d.id}">${this.escape(d.name)} ↗</button><span class="muted">${d.transferListed ? "Transferible · " : ""}${this.money(d.contract.salary)}/mes</span></div>`).join("") || '<p class="fine-print">Sin pilotos contratados.</p>'}<h3 class="spaced">Flota real · ${cars.length}/${c.carCapacity}</h3>${cars.map((car) => `<div class="timeline-line"><button class="text-button" data-action="car-detail" data-id="${car.id}">${car.brand} ${car.model} ↗</button><span class="muted">${car.id} · ${Math.round(car.condition)} %${G.Market.listed(s, car.id) ? " · EN VENTA" : ""}${car.repair ? " · EN REVISIÓN" : ""}</span></div>`).join("") || '<p class="fine-print">Sin vehículos.</p>'}<h3 class="spaced">Decisiones y motivos</h3>${c.decisions.map((d) => `<div class="decision-record"><span class="eyebrow gold">${this.date(d.day, true)} / ${this.escape(d.action)}</span><p>${this.escape(d.reason)}</p><small>${d.targetId || "Operación del taller"}${d.cost ? " · Coste " + this.money(d.cost) : ""}</small></div>`).join("") || '<p class="fine-print">Todavía no hay decisiones automáticas.</p>'}<h3 class="spaced">Últimos movimientos económicos</h3>${
      c.ledger
        .slice(0, 10)
        .map(
          (t) =>
            `<div class="timeline-line"><small>${this.date(t.day, true)}</small><span>${this.escape(t.label)}</span><b class="${t.amount >= 0 ? "positive" : "negative"}">${this.money(t.amount)}</b></div>`,
        )
        .join("") || '<p class="fine-print">Sin movimientos.</p>'
    }`;
  };
  const garage = U.garage;
  U.garage = function (s) {
    const cars = G.ownedCars(s),
      car = cars.find((c) => c.id === G.App.selectedCarId) || cars[0];
    const header = `<div class="fleet-nav"><div>${cars.map((c) => `<button class="${c === car ? "primary" : "secondary"}" data-action="select-car" data-id="${c.id}">${c.brand} ${c.model} · ${c.id}</button>`).join("")}</div><button class="secondary" data-go="market">Mercado Club ↗</button></div>`;
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
      `<section class="panel padded spaced"><div class="section-title"><h2>${l ? "Este coche está anunciado" : "Gestión de activos"}</h2>${l ? this.badge(this.money(l.price), "outline") : this.badge("UNIDAD " + car.id, "outline")}</div><p class="muted">Los coches en venta no se pueden inscribir. El vehículo conserva su historial al cambiar de propietario. Los rivales evalúan el precio y sus recursos; publicar un anuncio no garantiza vender.</p><div class="modal-actions">${this.button(l ? "Retirar anuncio" : "Poner a la venta", l ? "withdraw-listing" : "list-car", "secondary", `data-id="${l?.id || car.id}"`)}</div></section>`
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
      `${offers.length ? `<section class="panel padded offers-inbox"><div class="section-title"><h2>Ofertas por tus pilotos</h2>${this.badge(offers.length + " PENDIENTES")}</div>${offers.map((o) => `<div class="offer-row"><div><h3>${this.escape(s.companies.find((c) => c.id === o.buyerId).name)} quiere a ${this.escape(s.drivers.find((d) => d.id === o.driverId).name)}</h3><p>Compensación: ${this.money(o.fee)} · Vence ${this.date(o.expires, true)} · Se liquida la nómina pendiente.</p></div><div>${this.button("Aceptar traspaso", "accept-transfer", "primary", `data-id="${o.id}"`)}${this.button("Rechazar", "reject-transfer", "secondary", `data-id="${o.id}"`)}</div></div>`).join("")}</section>` : ""}` +
      team.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><h2>Traspasos entre compañías</h2><button class="text-button" data-go="companies">Consultar el paddock ↗</button></div>${available.length ? available.map((d) => `<div class="transfer-row"><div><h3>${this.escape(d.name)}</h3><p>${this.escape(s.companies.find((c) => c.id === d.companyId).name)} · Valoración ${G.Drivers.rating(d)} · Compensación ${this.money(G.Companies.fee(s, d))}</p></div>${this.button("Negociar traspaso", "transfer-driver", "secondary", `data-id="${d.id}"`)}</div>`).join("") : '<p class="muted">Ninguna escudería acepta negociar ahora. Las compañías liberarán pilotos de reserva o buscarán liquidez según su situación.</p>'}</section>`
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
