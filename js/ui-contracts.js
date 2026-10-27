"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    C = G.Contracts;
  const status = {
    active: "En vigor",
    completed: "Cumplido",
    terminated: "Rescindido",
    breached: "Incumplido",
    repaid: "Pagado",
    defaulted: "Impago",
    open: "Disponible",
    awarded: "Adjudicado",
    expired: "Vencido",
  };
  const provider = (s, c) =>
    s.commercial.providers.find((p) => p.id === c.providerId);
  function requirements(s, o) {
    const p = provider(s, o),
      d = s.drivers.find((d) => d.id === o.driverId);
    return `<ul class="commercial-requirements"><li>Logotipo visible y exclusividad en ${U.escape(p.sector)}.</li>${d ? `<li><b>Piloto impuesto: ${U.escape(d.name)}</b> · ${G.Drivers.rating(d)}/100 de valoración. ${d.companyId ? "Se comprueba su propietario al firmar." : `Su contratación por 12 meses a ${U.money(d.ask)}/mes está incluida en la firma; necesitas una plaza.`}</li>` : ""}${p.modelIndex !== null ? `<li>Competir con ${G.Data.models[p.modelIndex].brand} ${G.Data.models[p.modelIndex].model}. Si no lo tienes, la marca financia una unidad disponible del mercado; necesitas plaza de garaje. El capital es recuperable si incumples.</li>` : ""}${p.partDefinition ? `<li>Usar ${U.escape(G.Parts.definition(p.partDefinition).name)}. Debes comprarla y montarla antes de las rondas que quieras facturar.</li>` : ""}<li>Los actos promocionales cuestan $80 y se completan al avanzar un día. La prima final de $600 depende de la posición pactada.</li></ul>`;
  }
  function agreement(s, c) {
    const p = provider(s, c),
      o = s.commercial.offers.find((o) => o.id === c.offerId),
      required = Math.ceil(c.eventIds.length * c.terms.share);
    return `<article class="panel commercial-card"><div class="commercial-brand" style="--brand:${p.color}"><span>${U.escape(p.name)}</span>${U.badge(status[c.status], c.status === "active" ? "green" : "outline")}</div><div class="padded"><h3>${c.terms.share * 100}% de presencia comprometida</h3><p>${c.fulfilledIds.length}/${required} rondas conformes · ${c.checkedIds.length}/${c.eventIds.length} evaluadas · ${c.promotions}/${c.terms.promotions} actos</p><div class="commercial-progress"><i style="width:${Math.min(100, (c.fulfilledIds.length / required) * 100)}%"></i></div><div class="commercial-figures"><span>Por ronda conforme<b>${U.money(c.terms.perRound)}</b></span><span>Reserva pendiente<b>${U.money(c.escrow)}</b></span></div>${c.status === "active" && c.companyId === s.playerId ? `<p class="fine-print">Rescindir hoy: ${U.money(C.exitCost(c))}. Incluye la parte no ganada del anticipo y del capital para coche, más ${U.money(c.exitFee)} de indemnización.</p><div class="commercial-actions">${U.button(c.logo ? "Retirar logotipo" : "Mostrar logotipo", "sponsor-logo", "secondary", `data-id="${c.id}"`)}${c.promotions < c.terms.promotions ? U.button(c.promotionUntil ? "Acto pendiente: " + U.date(c.promotionUntil, true) : "Organizar acto · $80", "sponsor-promotion", "secondary", `data-id="${c.id}" ${c.promotionUntil ? "disabled" : ""}`) : ""}${U.button("Rescindir", "sponsor-cancel", "text-button negative", `data-id="${c.id}"`)}</div>` : `<p>${c.status === "active" ? "Acuerdo en vigor de una compañía rival." : c.penalty ? "Devolución e indemnización: " + U.money(c.penalty) : "Acuerdo liquidado; fondos sobrantes devueltos a la marca."}</p>`}${U.button("Ver condiciones y seguimiento", "commercial-detail", "text-button", `data-id="${c.id}"`)}</div></article>`;
  }
  function banking(s) {
    const v = s.commercial,
      loans = v.loans.filter((l) => l.companyId === s.playerId),
      debt = C.debt(s),
      q =
        G.player(s).status === "active"
          ? C.loanQuote(s, 2000, 6)
          : { limit: 0 },
      blocked =
        G.player(s).status !== "active"
          ? "La compañía está en bancarrota. Puedes consultar sus obligaciones, pero no solicitar crédito."
          : debt
            ? "Liquida el préstamo existente antes de solicitar otro."
            : G.player(s).reputation < 1
              ? "El banco exige al menos 1 punto de reputación."
              : v.bank.balance < 1000
                ? "El banco no dispone de liquidez para otra solicitud."
                : "";
    return `<div class="commercial-columns"><section class="panel padded"><span class="eyebrow">BANCO CIRCUITO · SIMULACIÓN FICTICIA</span><h2>Financia una decisión concreta.</h2><p class="commercial-lead">El banco considera reputación, ingresos registrados, activos, deuda e impagos. Prestar dinero no crea beneficios: cada cuota devuelve capital y paga intereses.</p><div class="spec-grid">${U.stat("Deuda total", U.money(debt))}${U.stat("Límite orientativo", U.money(q.limit))}</div><form id="loan-form"><div class="form-row"><label class="form-field"><span>Capital solicitado ($)</span><input name="principal" type="number" min="1000" max="8000" step="500" value="2000" required></label><label class="form-field"><span>Plazo</span><select name="months"><option value="3">3 cuotas mensuales</option><option value="6" selected>6 cuotas mensuales</option></select></label></div><button class="primary" type="submit" ${blocked ? "disabled" : ""}>Solicitar propuesta</button>${blocked ? `<p class="availability-note negative">${blocked}</p>` : ""}</form><p class="fine-print">Primera cuota a 30 días. Sin comisión por amortización anticipada: solo principal pendiente e intereses ya vencidos. Con 14 días de retraso se registra un impago, un recargo único de $100 y pérdida de reputación; la obligación se conserva.</p></section><section><div class="section-title"><h2>Tus préstamos</h2></div>${
      loans.length
        ? loans
            .slice()
            .reverse()
            .map(
              (l) =>
                `<article class="panel padded loan-card"><div class="section-title"><h3>${U.money(l.principal)} · ${l.months} meses</h3>${U.badge(status[l.status], l.status === "repaid" ? "green" : "outline")}</div><p>${l.schedule.filter((p) => p.paid).length}/${l.months} cuotas liquidadas · ${U.escape(l.id)}</p><div class="loan-schedule">${l.schedule.map((p) => `<div class="${p.paid ? "paid" : p.due < s.day ? "late" : ""}"><span>${U.date(p.due, true)}</span><b>${U.money(p.principal + p.interest + p.fee)}</b><small>${p.paid ? "Pagada" + (p.waived ? " · interés futuro condonado" : "") : p.due < s.day ? "Vencida" : "Pendiente"}</small></div>`).join("")}</div>${l.status !== "repaid" ? U.button("Amortizar · " + U.money(C.payoff(s, l)), "repay-loan", "secondary", `data-id="${l.id}"`) : ""}</article>`,
            )
            .join("")
        : '<div class="panel empty-state"><h3>Sin préstamos.</h3><p>Revisa las cuotas antes de comprometer tus próximos ingresos.</p></div>'
    }</section></div>`;
  }
  U.contracts = function (s) {
    const tab = G.App.contractTab || "offers",
      v = s.commercial,
      own = v.contracts.filter((c) => c.companyId === s.playerId),
      offers = v.offers.filter((o) => o.year === s.season.year),
      live = C.live(s);
    const content =
      tab === "bank"
        ? banking(s)
        : tab === "active"
          ? `<div class="commercial-grid">${live.map((c) => agreement(s, c)).join("") || '<div class="panel empty-state"><h2>Todavía no tienes acuerdos en vigor.</h2><p>Consulta las ofertas y compara sus obligaciones antes de firmar.</p></div>'}</div>`
          : tab === "history"
            ? `<div class="commercial-grid">${
                v.contracts
                  .slice()
                  .reverse()
                  .map(
                    (c) =>
                      `<div><p class="commercial-owner">${U.escape(s.companies.find((x) => x.id === c.companyId).name)}</p>${agreement(s, c)}</div>`,
                  )
                  .join("") || "<p>No se ha firmado ningún acuerdo.</p>"
              }</div>`
            : `<div class="context-banner"><div><strong>El dinero llega con compromisos.</strong><p>Las ofertas son compartidas con los rivales. La adjudicación automática empieza en la fecha indicada; puedes negociar y firmar antes. Las marcas mantienen un presupuesto finito.</p></div></div><div class="commercial-grid">${offers
                .map((o) => {
                  const p = provider(s, o),
                    available =
                      G.player(s).status === "active" &&
                      o.status === "open" &&
                      o.deadline >= s.day &&
                      !o.declined.includes(s.playerId),
                    winner = s.companies.find((c) => c.id === o.winnerId);
                  return `<article class="panel commercial-card" data-offer="${o.id}"><div class="commercial-brand" style="--brand:${p.color}"><span>${U.escape(p.name)}</span>${U.badge(p.kind === "manufacturer" ? "FABRICANTE FICTICIO" : p.kind === "technical" ? "TÉCNICO" : "FINANCIERO", "outline")}</div><div class="padded"><h2>${p.kind === "manufacturer" ? "Un coche y una apuesta por su piloto." : p.kind === "technical" ? "Tu configuración también es un compromiso." : "Presupuesto para estar en la parrilla."}</h2><div class="commercial-figures"><span>Anticipo de referencia<b>${U.money(p.advance)}</b></span><span>Ronda conforme<b>${U.money(p.perRound)}</b></span></div>${requirements(s, o)}<p class="fine-print">Rivales a partir del ${U.date(o.decisionDay, true)} · Cierre ${U.date(o.deadline, true)} · Relación ${C.relation(s, s.playerId, p.id)} / 100.</p>${available ? `<div class="commercial-actions">${U.button("Negociar acuerdo", "sponsor-offer", "primary", `data-id="${o.id}"`)}${U.button("Rechazar", "sponsor-decline", "text-button", `data-id="${o.id}"`)}</div>` : `<p class="commercial-result">${G.player(s).status !== "active" ? "Actividad comercial cerrada por bancarrota." : winner ? "Adjudicado a " + U.escape(winner.name) : o.declined.includes(s.playerId) ? "Has rechazado esta convocatoria." : status[o.status] || "Convocatoria cerrada"}</p>`}</div></article>`;
                })
                .join("")}</div>`;
    return (
      this.heading(
        "DIRECCIÓN COMERCIAL",
        "Acuerdos que cambian tu temporada.",
        "Negocia presupuesto, conoce tus obligaciones y planifica los pagos.",
        `<button class="secondary" data-go="finance">Ver contabilidad →</button>`,
      ) +
      `<div class="overview-strip">${this.stat("Acuerdos activos", live.length + " / 3")}${this.stat("Caja", this.money(G.player(s).balance))}${this.stat("Deuda", this.money(C.debt(s)))}${this.stat("Rondas por disputar", C.future(s).length)}</div><nav class="commercial-tabs" aria-label="Secciones comerciales">${[
        ["offers", "Ofertas"],
        ["active", "Mis acuerdos"],
        ["bank", "Financiación"],
        ["history", "Archivo del paddock"],
      ]
        .map(
          ([id, label]) =>
            `<button data-action="commercial-tab" data-value="${id}" class="${tab === id ? "active" : ""}" aria-pressed="${tab === id}">${label}</button>`,
        )
        .join("")}</nav>${content}`
    );
  };
  const finance = U.finance;
  U.finance = function (s) {
    return (
      finance.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><div><span class="eyebrow">CAPITAL Y COMPROMISOS</span><h2>Presupuesto para el siguiente paso.</h2></div><button class="primary" data-go="contracts">Patrocinios y financiación →</button></div><div class="spec-grid">${this.stat("Deuda pendiente", this.money(C.debt(s)))}${this.stat("Acuerdos activos", C.live(s).length)}${this.stat("Patrimonio neto estimado", this.money(G.player(s).balance + G.ownedCars(s).reduce((n, c) => n + G.Market.value(c), 0) - s.commercial.loans.filter((l) => l.companyId === s.playerId).reduce((n, l) => n + l.schedule.filter((p) => !p.paid).reduce((sum, p) => sum + p.principal, 0), 0)))}</div><p>Los patrocinios por ronda son condicionales. Un anticipo o préstamo aumenta la caja, pero puede generar obligaciones futuras. Consulta el calendario de cuotas y las devoluciones pactadas.</p></section>`
    );
  };
  G.ContractsUI = {
    offer(app, id) {
      const s = app.state,
        o = s.commercial.offers.find((o) => o.id === id);
      G.assert(o, "Convocatoria no disponible.");
      const p = provider(s, o),
        n = s.commercial.negotiations[s.playerId + "|" + id],
        t = n?.terms || C.baseTerms(s, o),
        q = C.quote(s, id, t);
      U.modal(
        "Negociación · " + U.escape(p.name),
        `<p class="eyebrow">${p.kind === "manufacturer" ? "PROGRAMA FICTICIO DE FABRICANTE" : "CONTRATO DE PATROCINIO"} · COPA CLUB ${o.year}</p>${requirements(s, o)}${n ? `<div class="counter-offer"><b>${n.accepted ? "Propuesta aceptable" : "Contraoferta de la marca"}</b><p>${U.escape(n.reason || "Revisa el resumen antes de firmar.")} ${n.cooldown > s.day ? "Nueva negociación disponible el " + U.date(n.cooldown, true) + "." : ""}</p></div>` : ""}<form id="sponsor-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Anticipo solicitado ($)</span><input name="advance" type="number" min="0" max="10000" step="1" value="${t.advance}" required></label><label class="form-field"><span>Por ronda conforme ($)</span><input name="perRound" type="number" min="0" max="3000" step="1" value="${t.perRound}" required></label></div><div class="form-row"><label class="form-field"><span>Presencia mínima</span><select name="share">${[0.5, 0.7, 1].map((x) => `<option value="${x}" ${t.share === x ? "selected" : ""}>${x * 100}% de las rondas</option>`).join("")}</select></label><label class="form-field"><span>Actos promocionales</span><select name="promotions">${[0, 1, 2].map((x) => `<option ${t.promotions === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="form-field"><span>Objetivo para prima final</span><select name="targetPosition">${[3, 5, 8].map((x) => `<option value="${x}" ${t.targetPosition === x ? "selected" : ""}>Top ${x} de equipos</option>`).join("")}</select></label></div><p class="fine-print">Más presencia, promoción o un objetivo exigente permiten pedir más dinero. El logotipo, la exclusividad y los activos exigidos se conservan.</p><div class="modal-actions"><button class="secondary" data-action="close">Retirarse</button><button class="primary" type="submit" ${n?.cooldown > s.day ? "disabled" : ""}>Presentar propuesta</button></div></form>${n && q.accepted ? `<div class="commercial-review"><h3>Condiciones que puedes firmar</h3><p>${q.eventIds.length} rondas pendientes; al menos ${Math.ceil(q.eventIds.length * t.share)} conformes. Anticipo ${U.money(t.advance)} y ${U.money(t.perRound)} por ronda. Prima final ${U.money(q.finishBonus)}.</p><p>${q.vehicle ? "La marca financiará " + U.money(q.vehicle.price) + " para la unidad " + U.escape(q.vehicle.carId) + "." : "No se transfiere ningún vehículo."} La devolución máxima por incumplimiento hoy sería ${U.money(t.advance + (q.vehicle?.price || 0) + q.exitFee)}. Los salarios y el mantenimiento corren por tu cuenta.</p>${U.button("Revisar y firmar", "sponsor-sign", "primary", `data-id="${id}"`)}</div>` : q.reason ? `<p class="availability-note negative">${U.escape(q.reason)}</p>` : ""}`,
        true,
      );
    },
    detail(app, id) {
      const s = app.state,
        c = s.commercial.contracts.find((c) => c.id === id);
      if (!c) {
        app.contractTab = "bank";
        app.go("contracts");
        return;
      }
      const o = s.commercial.offers.find((o) => o.id === c.offerId),
        p = provider(s, c);
      U.modal(
        U.escape(p.name) + " · seguimiento",
        agreement(s, c) +
          requirements(s, o) +
          `<div class="section-title spaced"><h3>Evaluación de cada ronda</h3></div>${c.rounds.map((r) => `<div class="timeline-line"><small>${U.date(r.day, true)}</small><span>${r.issues.length ? U.escape(r.issues.join("; ")) : "Ronda conforme: cuota abonada"}</span></div>`).join("") || "<p>Todavía no se ha evaluado ninguna ronda.</p>"}`,
        true,
      );
    },
    driverFields(s, t = {}) {
      return `<fieldset class="contract-clauses"><legend>Negocia también las obligaciones</legend><div class="form-row"><label class="form-field"><span>Posición en el equipo</span><select name="contractRole"><option value="principal" ${t.role !== "reserva" ? "selected" : ""}>Principal</option><option value="reserva" ${t.role === "reserva" ? "selected" : ""}>Reserva</option></select></label><label class="form-field"><span>Prima por victoria ($)</span><input type="number" name="winBonus" min="0" max="1500" value="${t.winBonus || 0}"></label><label class="form-field"><span>Rescisión: meses de sueldo</span><select name="releaseMonths">${[1, 2, 3].map((x) => `<option ${t.releaseMonths === x ? "selected" : ""}>${x}</option>`).join("")}</select></label></div><div class="form-row"><label class="form-field"><span>Promesa de participación</span><select name="promiseShare">${[
        [0, "Sin promesa"],
        [0.5, "50% de rondas restantes"],
        [0.7, "70% de rondas restantes"],
        [1, "100% de rondas restantes"],
      ]
        .map(
          ([x, label]) =>
            `<option value="${x}" ${t.promiseShare === x ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="checkbox-field"><input type="checkbox" name="renewalOption" ${t.renewalOption ? "checked" : ""}>Opción de renovación al +3% una vez</label></div><p>Primas, promesas y una rescisión mayor pueden reducir el salario exigido. Incumplir una promesa crea un conflicto y resta 15 puntos de moral, que influye en el ritmo de las siguientes carreras. Sin opción, renovar exige al menos +8%; la negociación se abre 60 días antes de vencer.</p></fieldset>`;
    },
    driverDetails(s, d) {
      const k = d.contract?.clauses;
      return `${k ? `<section class="contract-clauses"><h3>Obligaciones pactadas</h3><p>${U.escape(k.role)} · Prima de victoria ${U.money(k.winBonus)} · Rescisión ${k.releaseMonths} meses de sueldo más nómina devengada. ${k.promiseShare ? "Promesa: " + k.usedIds.length + "/" + k.eventIds.length + " rondas, mínimo " + Math.round(k.promiseShare * 100) + "%." : "Sin promesa de participación."} ${k.renewalOption ? "Opción de renovación al +3%" + (k.renewalUsed ? " ya utilizada." : ".") : ""}</p></section>` : ""}<div class="modal-actions">${U.button("Negociar renovación", "renew-driver", "secondary", `data-id="${d.id}" ${d.contract.end - s.day > 60 ? "disabled" : ""}`)}</div><h3>Memoria de la relación</h3>${d.memory
        .slice(-5)
        .reverse()
        .map(
          (m) =>
            `<div class="timeline-line"><small>${U.date(m.day, true)}</small><span>${U.escape(m.event)}</span></div>`,
        )
        .join("")}`;
    },
    action(app, name, data) {
      const s = app.state;
      if (!s) return false;
      if (
        ![
          "commercial-tab",
          "sponsor-offer",
          "sponsor-sign",
          "sponsor-decline",
          "sponsor-promotion",
          "sponsor-logo",
          "sponsor-cancel",
          "commercial-detail",
          "repay-loan",
          "renew-driver",
        ].includes(name)
      )
        return false;
      switch (name) {
        case "commercial-tab":
          app.contractTab = data.value;
          app.render();
          break;
        case "sponsor-offer":
          this.offer(app, data.id);
          break;
        case "commercial-detail":
          this.detail(app, data.id);
          break;
        case "sponsor-sign": {
          const n = s.commercial.negotiations[s.playerId + "|" + data.id];
          G.assert(n, "Presenta primero una propuesta.");
          const q = C.quote(s, data.id, n.terms);
          G.assert(q.accepted, q.reason);
          app.confirm(
            "Firmar con obligaciones",
            `Recibirás ${U.money(q.terms.advance)}. Debes cumplir ${Math.ceil(q.eventIds.length * q.terms.share)}/${q.eventIds.length} rondas y ${q.terms.promotions} actos. ${q.driverId ? "Se exige el piloto " + s.drivers.find((d) => d.id === q.driverId).name + "; si está libre se contrata a su salario por 12 meses. " : ""}Incumplir o rescindir puede exigir hasta ${U.money(q.terms.advance + (q.vehicle?.price || 0) + q.exitFee)}.`,
            () => {
              C.sign(s, data.id, n.terms);
              app.contractTab = "active";
              app.close();
              app.mutate(() => {}, "contracts");
            },
          );
          break;
        }
        case "sponsor-decline":
          app.mutate(() => C.decline(s, data.id));
          break;
        case "sponsor-promotion":
          app.mutate(() => C.promotion(s, data.id));
          U.toast("Acto programado. Avanza un día para completarlo.");
          break;
        case "sponsor-logo":
          app.confirm(
            "Cambiar presencia de marca",
            "Retirar el logotipo impide facturar las rondas mientras siga oculto y puede causar incumplimiento de la presencia mínima.",
            () => {
              C.toggleLogo(s, data.id);
              app.close();
              app.mutate(() => {});
            },
          );
          break;
        case "sponsor-cancel": {
          const c = C.live(s).find((c) => c.id === data.id);
          G.assert(c, "Acuerdo no disponible.");
          app.confirm(
            "Rescindir patrocinio",
            `Coste hoy: ${U.money(C.exitCost(c))}. Se perderá reputación y relación con la marca.`,
            () => {
              C.cancel(s, c.id);
              app.close();
              app.mutate(() => {});
            },
          );
          break;
        }
        case "repay-loan": {
          const l = s.commercial.loans.find((l) => l.id === data.id);
          G.assert(l, "Préstamo no disponible.");
          app.confirm(
            "Amortizar préstamo",
            `Se abonarán ${U.money(C.payoff(s, l))} de principal e intereses vencidos. Los intereses futuros se condonan.`,
            () => {
              C.repay(s, l.id);
              app.close();
              app.mutate(() => {});
            },
          );
          break;
        }
        case "renew-driver": {
          const d = G.ownedDrivers(s).find((d) => d.id === data.id);
          G.assert(d, "Piloto no disponible.");
          const k = d.contract.clauses,
            min = Math.ceil(
              d.contract.salary *
                (k?.renewalOption && !k.renewalUsed ? 1.03 : 1.08),
            );
          U.modal(
            "Renovar · " + U.escape(d.name),
            `<form id="renew-driver-form" data-id="${d.id}"><p>Se conserva la nómina devengada y las obligaciones existentes. El nuevo sueldo se aplica desde la firma y el plazo se añade al vencimiento actual.</p><label class="form-field"><span>Salario mensual ($)</span><input type="number" name="salary" min="${min}" max="10000" value="${min}" required></label><label class="form-field"><span>Ampliación</span><select name="months"><option value="6">6 meses</option><option value="12" selected>12 meses</option><option value="24">24 meses</option></select></label><div class="modal-actions"><button class="secondary" data-action="close">Cancelar</button><button type="submit" class="primary">Aceptar renovación</button></div></form>`,
          );
          break;
        }
      }
      return true;
    },
    submit(app, form, values) {
      const s = app.state;
      if (form.id === "sponsor-form") {
        const n = C.negotiate(s, form.dataset.id, {
          advance: Number(values.get("advance")),
          perRound: Number(values.get("perRound")),
          share: Number(values.get("share")),
          promotions: Number(values.get("promotions")),
          targetPosition: Number(values.get("targetPosition")),
        });
        app.persist();
        this.offer(app, form.dataset.id);
        U.toast(
          n.accepted
            ? "La marca acepta estas condiciones. Revisa el contrato antes de firmar."
            : "La marca responde con una contraoferta.",
        );
        return true;
      }
      if (form.id === "loan-form") {
        const q = C.loanQuote(
          s,
          Number(values.get("principal")),
          Number(values.get("months")),
        );
        G.assert(q.accepted, q.reason);
        app.confirm(
          "Propuesta del banco",
          `Capital ${U.money(q.principal)}, interés total ${U.money(q.interest)} (${(q.rate * 100).toFixed(0)}% del capital por todo el plazo), ${q.months} cuotas de hasta ${U.money(q.payment)}. Primera cuota ${U.date(q.firstDue)}.`,
          () => {
            C.borrow(s, q.principal, q.months);
            app.close();
            app.mutate(() => {});
          },
        );
        return true;
      }
      if (form.id === "renew-driver-form") {
        C.renewDriver(
          s,
          form.dataset.id,
          Number(values.get("salary")),
          Number(values.get("months")),
        );
        app.close();
        app.mutate(() => {}, "team");
        app.driverDetail(form.dataset.id);
        return true;
      }
      return false;
    },
  };
})();
