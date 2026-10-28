"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    S = G.Staff;
  function portrait(e) {
    const initials = e.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
    return `<span class="staff-portrait ${e.role}" aria-hidden="true"><svg viewBox="0 0 80 80"><path d="M8 80Q10 49 40 49Q70 49 72 80" fill="currentColor" opacity=".45"/><ellipse cx="40" cy="30" rx="17" ry="20" fill="currentColor" opacity=".8"/><path d="M23 25Q23 6 41 9Q60 9 58 27L50 20L27 24" fill="#20343b"/></svg><b>${U.escape(initials)}</b></span>`;
  }
  function card(s, e, own = false) {
    const c = G.player(s),
      duplicate = S.owned(s).some((other) => other.role === e.role),
      full = S.owned(s).length >= S.capacity(s);
    return `<article class="panel staff-card" data-employee="${e.id}"><div class="staff-card-head">${portrait(e)}<div><span class="eyebrow">${S.roles[e.role].name}</span><h3>${U.escape(e.name)}</h3><p>${e.age} años · ${Math.floor(e.experience)} años de experiencia</p></div><span class="staff-rating">${Math.floor(e.skill)}<small>HABILIDAD</small></span></div><p class="staff-personality">${S.personalities[e.personality]} · Trabajo en equipo ${Math.floor(e.teamwork)}</p>${U.bar("Motivación", e.motivation)}<p class="staff-role-description">${S.roles[e.role].description}</p><div class="staff-card-footer"><div><b>${U.money(own ? e.contract.salary : e.ask)}<small> / mes</small></b><span>${own ? "Vence " + U.date(e.contract.end, true) : duplicate ? "Ya tienes esta especialidad cubierta" : full ? "Oficina sin plazas libres" : "Disponible para negociar"}</span></div>${U.button(own ? "Gestionar" : "Ver perfil", "staff-profile", "secondary", `data-id="${e.id}"`)}</div>${own && e.contract.arrears ? `<p class="negative staff-arrears">Nómina pendiente: ${U.money(e.contract.arrears)}</p>` : ""}</article>`;
  }
  function reports(s) {
    const scout = S.owned(s).find((e) => e.role === "scout"),
      active = s.staffing.assignments.find(
        (j) => j.employeeId === scout?.id && j.status === "active",
      ),
      jobs = s.staffing.assignments
        .filter((j) => j.companyId === s.playerId)
        .slice()
        .reverse();
    return `<section class="panel padded scouting-desk"><span class="eyebrow">DEPARTAMENTO DE OJEO</span><h2>Busca talento con información imperfecta.</h2><p>El potencial real permanece oculto. Un informe describe un intervalo estimado, puede equivocarse y conserva la fecha de evaluación.</p>${!scout ? `<div class="onboarding-note"><strong>Necesitas contratar a un ojeador.</strong>Su habilidad y motivación influyen en la duración y precisión del informe.</div>${U.button("Buscar ojeador", "staff-find", "primary", 'data-role="scout"')}` : active ? `<div class="onboarding-note"><strong>Evaluación en curso: ${U.escape(active.driverName)}</strong>Entrega el ${U.date(active.end)} · gastos ya pagados: ${U.money(active.cost)}.</div>` : `<form id="staff-scout-form" data-employee="${scout.id}"><div class="form-row"><label class="form-field"><span>Piloto a evaluar</span><select name="driver">${s.drivers.map((d) => `<option value="${d.id}">${U.escape(d.name)} · ${d.age} años</option>`).join("")}</select></label><div class="scout-order-summary"><strong>${U.escape(scout.name)}</strong><span>Informe: $75 · ${Math.max(3, 7 - Math.floor(S.strength(s, s.playerId, "scout") / 20))} días</span></div></div><button type="submit" class="primary" ${G.player(s).balance < 75 ? "disabled" : ""}>Encargar informe · $75</button></form>`}</section><section class="panel padded spaced"><div class="section-title"><h2>Expedientes de pilotos</h2><span class="muted">${jobs.length} evaluaciones</span></div>${jobs.length ? jobs.map((j) => `<article class="scout-report"><div><span class="eyebrow">${U.date(j.start, true)} · ${j.status === "active" ? "EN PREPARACIÓN" : j.status === "cancelled" ? "INTERRUMPIDO" : "INFORME DISPONIBLE"}</span><h3>${U.escape(j.driverName)}</h3><p>${j.status === "complete" ? `Potencial estimado: <b>${j.report.lower}–${j.report.upper}</b> / 100. Confianza ${j.quality >= 65 ? "alta" : j.quality >= 45 ? "media" : "baja"}; sin garantía de alcanzar ese nivel.` : j.status === "active" ? "Fecha prevista: " + U.date(j.end) : "El profesional dejó la compañía; los gastos ejecutados no se reembolsan."}</p></div>${j.status === "complete" ? U.button("Abrir informe", "staff-report", "secondary", `data-id="${j.id}"`) : ""}</article>`).join("") : '<p class="muted">Tus evaluaciones completadas aparecerán aquí.</p>'}</section>`;
  }
  U.staff = function (s) {
    const team = S.owned(s),
      c = G.player(s),
      tab = G.App.staffTab || "team",
      role = G.App.staffRole || "mechanic",
      arrears = S.overdue(s);
    const summary = `<div class="overview-strip staff-overview">${this.stat("PLANTILLA", team.length + " / " + S.capacity(s), "Plazas según la oficina de equipo")}${this.stat("NÓMINA MENSUAL", this.money(S.monthly(s)), "Incluida en la previsión de Finanzas")}${this.stat("CONVIVENCIA", team.length ? Math.round(S.cohesion(s)) + " / 100" : "—", "Influye en el rendimiento profesional")}${this.stat("PAGOS PENDIENTES", this.money(arrears), "También cuentan al evaluar insolvencia")}</div>`;
    let content;
    if (tab === "market")
      content = `<div class="staff-role-filter" aria-label="Especialidades de personal">${Object.entries(
        S.roles,
      )
        .map(
          ([key, r]) =>
            `<button class="${role === key ? "selected" : ""}" data-action="staff-role" data-role="${key}">${r.name}</button>`,
        )
        .join(
          "",
        )}</div><div class="section-title"><div><h2>${S.roles[role].name}</h2><p class="muted">Mercado compartido con los rivales. Un responsable por especialidad.</p></div></div><div class="staff-grid">${
        s.employees
          .filter((e) => e.role === role && e.status === "available")
          .map((e) => card(s, e))
          .join("") ||
        '<section class="panel empty-state"><h3>No hay candidatos libres de esta especialidad.</h3><p>El mercado revisa sus necesidades cada sesenta días. Los contratos terminados también liberan profesionales.</p></section>'
      }</div>`;
    else if (tab === "reports") content = reports(s);
    else if (tab === "relations") {
      const ids = new Set(team.map((e) => e.id)),
        bonds = s.staffing.bonds.filter((b) => ids.has(b.a) && ids.has(b.b));
      content = `<section class="panel padded"><span class="eyebrow">PERSONAS QUE TRABAJAN JUNTAS</span><h2>La convivencia cambia los resultados.</h2><p class="muted">Personalidad y trabajo en equipo influyen en las relaciones al avanzar los días. La tensión reduce la motivación; una plantilla compatible mejora su rendimiento.</p>${
        bonds
          .map((b) => {
            const a = team.find((e) => e.id === b.a),
              other = team.find((e) => e.id === b.b);
            return `<div class="staff-bond"><div><b>${this.escape(a.name)} <span>·</span> ${this.escape(other.name)}</b><small>${S.personalities[a.personality]} / ${S.personalities[other.personality]}</small></div>${this.badge(b.value < -25 ? "TENSIÓN" : b.value > 25 ? "BUENA RELACIÓN" : "RELACIÓN NEUTRAL", b.value > 25 ? "green" : "outline")}<span>${Math.round(b.value)}</span></div>`;
          })
          .join("") ||
        '<p class="onboarding-note">La convivencia se registra al avanzar una jornada con dos o más profesionales contratados.</p>'
      }</section><section class="panel padded spaced"><h2>Memoria profesional</h2>${team.flatMap((e) => e.memory.slice(-4).map((m) => `<div class="timeline-line"><small>${this.date(m.day, true)}</small><span><b>${this.escape(e.name)}</b><br>${this.escape(m.text)}</span></div>`)).join("") || '<p class="muted">Las contrataciones, renovaciones y conflictos dejarán recuerdos aquí.</p>'}</section>`;
    } else
      content = `<div class="section-title"><div><h2>Tu equipo de trabajo</h2><p class="muted">Cada puesto aporta una función real. Amplía la oficina para contratar más especialistas.</p></div><button class="secondary" data-go="facilities">Ampliar oficina →</button></div>${team.length ? `<div class="staff-grid">${team.map((e) => card(s, e, true)).join("")}</div>` : `<section class="panel empty-state"><span class="empty-number">02</span><h2>Elige tus primeros apoyos.</h2><p>Dispones de dos plazas iniciales. Compara especialidad, habilidad, convivencia y salario antes de comprometer tu presupuesto.</p>${this.button("Explorar profesionales", "staff-tab", "primary", 'data-tab="market"')}</section>`}<section class="panel padded spaced"><div class="section-title"><h2>Apoyo de tu plantilla</h2><span class="eyebrow">RENDIMIENTO ACTUAL</span></div><div class="staff-effects">${Object.entries(
        S.roles,
      )
        .map(
          ([key, r]) =>
            `<div><span>${r.name}</span><b>${team.some((e) => e.role === key) ? Math.round(S.strength(s, s.playerId, key)) + " / 100" : "Sin responsable"}</b><small>${r.description}</small></div>`,
        )
        .join(
          "",
        )}</div><p class="fine-print">El taller asigna un profesional libre al contratar un trabajo; no lo asigna a dos tareas a la vez. En carrera se guarda el apoyo disponible al salir. Una contratación posterior no modifica trabajos o carreras ya iniciados.</p></section>`;
    const debtArchive = s.staffing.debts.filter(
      (d) => d.companyId === s.playerId && !d.paid,
    );
    return (
      this.heading(
        "PERSONAL DE LA COMPAÑÍA",
        "Un equipo también se construye fuera de pista.",
        "Contrata especialistas, cumple sus contratos y cuida la convivencia.",
        this.badge(
          "OFICINA N" + G.Facilities.tier(s, s.playerId, "office"),
          "outline",
        ),
      ) +
      summary +
      (arrears
        ? `<div class="alert danger staff-pay-alert"><div><b>Hay ${this.money(arrears)} de obligaciones salariales pendientes.</b><p>Dispón de liquidez antes de agotar los 14 días de recuperación. Se reintenta el pago al avanzar cada jornada.</p></div>${this.button("Liquidar pendientes", "staff-pay", "secondary", c.balance >= arrears && c.status === "active" ? "" : "disabled")}</div>`
        : "") +
      `<nav class="workshop-section-nav staff-tabs" aria-label="Gestión de personal">${[
        ["team", "Mi plantilla"],
        ["market", "Mercado laboral"],
        ["reports", "Ojeo"],
        ["relations", "Relaciones"],
      ]
        .map(
          ([id, title]) =>
            `<button class="${tab === id ? "active" : ""}" data-action="staff-tab" data-tab="${id}" aria-pressed="${tab === id}">${title}</button>`,
        )
        .join(
          "",
        )}</nav>${content}${debtArchive.length ? `<section class="panel padded spaced"><h3>Obligaciones con profesionales que dejaron la compañía</h3>${debtArchive.map((d) => `<div class="timeline-line"><span>${this.escape(s.employees.find((e) => e.id === d.employeeId).name)}</span><b>${this.money(d.amount)}</b></div>`).join("")}</section>` : ""}`
    );
  };
  const companyBody = U.companyBody;
  U.companyBody = function (s, c) {
    return (
      companyBody.call(this, s, c) +
      `<section class="onboarding-note"><strong>Personal especializado · ${S.owned(s, c.id).length}/${S.capacity(s, c.id)} plazas</strong>Nómina: ${this.money(S.monthly(s, c.id))}/mes.${S.owned(
        s,
        c.id,
      )
        .map(
          (e) =>
            `<p><button class="text-button" data-action="staff-profile" data-id="${e.id}">${this.escape(e.name)} ↗</button> · ${S.roles[e.role].name}</p>`,
        )
        .join("")}</section>`
    );
  };
  const finance = U.finance;
  U.finance = function (s) {
    return (
      finance.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><div><span class="eyebrow">PERSONAS Y OBLIGACIONES</span><h2>La plantilla forma parte del presupuesto.</h2></div><button class="secondary" data-go="staff">Gestionar personal →</button></div><div class="spec-grid">${this.stat("Nómina de personal", this.money(S.monthly(s)) + " / mes")}${this.stat("Devengado y pendiente", this.money(S.liability(s)))}${this.stat("Vencido sin pagar", this.money(S.overdue(s)))}</div></section>`
    );
  };
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    const a = s.race?.entrants.find((a) => a.companyId === s.playerId);
    if (a?.staffSupport)
      document
        .getElementById("live-telemetry")
        ?.insertAdjacentHTML(
          "beforeend",
          `<div class="staff-race-support"><b>Apoyo técnico en esta carrera</b><span>Motor: −${(a.staffSupport.engineer * 0.12).toFixed(1)} % desgaste</span><span>Coordinación de boxes: −${((1 - S.pitFactor(a)) * 100).toFixed(1)} % tiempo de servicio</span></div>`,
        );
  };
  const UI = (G.StaffUI = {
    profile(A, id) {
      const s = A.state,
        e = s.employees.find((e) => e.id === id);
      G.assert(e, "Profesional no disponible.");
      const own = e.companyId === s.playerId,
        employer = s.companies.find((c) => c.id === e.companyId),
        busy = S.busy(s, id);
      U.modal(
        U.escape(e.name),
        `<div class="staff-profile-head">${portrait(e)}<div><span class="eyebrow">${S.roles[e.role].name}</span><h3>${e.age} años · ${Math.floor(e.experience)} años de experiencia</h3><p>${S.personalities[e.personality]} · ${e.status === "retired" ? "Retirado" : employer ? U.escape(employer.name) : "Disponible"}</p></div></div><p>${S.roles[e.role].description}</p><div class="staff-profile-bars">${U.bar("Habilidad", e.skill)}${U.bar("Trabajo en equipo", e.teamwork)}${U.bar("Aprendizaje", e.learning)}${U.bar("Motivación", e.motivation)}${U.bar("Lealtad", e.loyalty)}</div>${e.contract ? `<div class="spec-grid">${U.stat("Salario", U.money(e.contract.salary) + " / mes")}${U.stat("Vencimiento", U.date(e.contract.end))}${U.stat("Devengado", U.money(e.contract.accrued))}${U.stat("Vencido", U.money(e.contract.arrears))}</div><p class="fine-print">Aportaciones: ${e.contributions.jobs} trabajos, ${e.contributions.sessions} sesiones de formación y ${e.contributions.reports} informes.</p>` : `<p>Salario solicitado: <b>${U.money(e.ask)}/mes</b>.</p>`}${busy ? '<div class="onboarding-note"><strong>Profesional asignado a un trabajo de taller.</strong>Termina el trabajo antes de rescindir su contrato.</div>' : ""}<div class="modal-actions">${own ? `${e.contract.end - s.day <= 60 ? U.button("Renovar contrato", "staff-renew", "secondary", `data-id="${id}"`) : ""}${U.button("Rescindir contrato", "staff-release", "text-button negative", `data-id="${id}" ${busy ? "disabled" : ""}`)}` : e.status === "available" ? U.button("Negociar contrato", "staff-negotiate", "primary", `data-id="${id}" ${S.owned(s).length >= S.capacity(s) || S.owned(s).some((other) => other.role === e.role) || s.status !== "active" ? "disabled" : ""}`) : ""}</div><details class="staff-memory"><summary>Trayectoria y recuerdos</summary>${
          e.memory
            .slice()
            .reverse()
            .map(
              (m) =>
                `<p><small>${U.date(m.day, true)}</small> · ${U.escape(m.text)}</p>`,
            )
            .join("") ||
          '<p class="muted">Sin acuerdos previos registrados.</p>'
        }</details>`,
        true,
      );
    },
    negotiate(A, id) {
      const s = A.state,
        e = s.employees.find((e) => e.id === id),
        n = s.staffing.negotiations[`${s.playerId}:${id}`];
      G.assert(e?.status === "available", "Profesional no disponible.");
      U.modal(
        "Negociar con " + U.escape(e.name),
        `<p>${S.roles[e.role].name} · solicita ${U.money(e.ask)}/mes.</p>${n ? `<div class="onboarding-note"><strong>Contraoferta: ${U.money(n.salary)}/mes</strong>${n.cooldown > s.day ? "Pide retomar la conversación el " + U.date(n.cooldown) : "Puedes aceptarla o presentar otras condiciones."}</div>` : ""}<form id="staff-offer-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Salario mensual ($)</span><input name="salary" type="number" min="150" max="5000" step="1" required value="${n?.salary || e.ask}"></label><label class="form-field"><span>Duración</span><select name="months">${[6, 12, 24].map((m) => `<option value="${m}" ${(n?.months || 12) === m ? "selected" : ""}>${m} meses</option>`).join("")}</select></label></div><label class="form-field"><span>Prima de contratación ($)</span><input name="bonus" type="number" min="0" max="2000" required value="${n?.bonus || 0}"></label><div class="onboarding-note"><strong>Revisa tu compromiso.</strong>La prima se paga al firmar. El salario se devenga diariamente y vence el día 1. Necesitas además una reserva inicial de media nómina. Rescindir cuesta un mes de salario más las obligaciones pendientes.</div><div class="modal-actions"><button class="secondary" data-action="close">Retirarse</button><button class="primary" type="submit" ${n?.cooldown > s.day ? "disabled" : ""}>Presentar oferta</button></div></form>`,
      );
    },
    driverDetails(s, d) {
      const latest = s.staffing.assignments
          .filter(
            (j) =>
              j.companyId === s.playerId &&
              j.driverId === d.id &&
              j.status === "complete",
          )
          .at(-1),
        scout = S.owned(s).find((e) => e.role === "scout");
      return `<section class="onboarding-note"><strong>Ojeo profesional</strong>${latest ? `Potencial estimado ${latest.report.lower}–${latest.report.upper}/100 · informe del ${U.date(latest.end, true)}. No es una garantía del potencial real.` : "Todavía no tienes una evaluación profesional de este piloto."}<div>${latest ? U.button("Consultar informe", "staff-report", "text-button", `data-id="${latest.id}"`) : scout ? U.button("Evaluar a este piloto", "staff-scout-preview", "text-button", `data-id="${d.id}"`) : U.button("Buscar ojeador", "staff-find", "text-button", 'data-role="scout"')}</div></section>`;
    },
    report(A, id) {
      const j = A.state.staffing.assignments.find(
        (j) => j.id === id && j.companyId === A.state.playerId,
      );
      G.assert(j, "Informe no disponible.");
      U.modal(
        "Evaluación de " + U.escape(j.driverName),
        j.status === "complete"
          ? `<span class="eyebrow">INFORME DEL ${U.date(j.end).toUpperCase()}</span><div class="scout-estimate"><strong>${j.report.lower}–${j.report.upper}</strong><span>Potencial estimado / 100</span></div><p>Confianza ${j.quality >= 65 ? "alta" : j.quality >= 45 ? "media" : "baja"}. La evaluación puede sobrevalorar o infravalorar al piloto. Su desarrollo dependerá también de entrenamiento, edad y oportunidades.</p><p class="fine-print">Informe elaborado por ${U.escape(A.state.employees.find((e) => e.id === j.employeeId).name)}. Gastos abonados: ${U.money(j.cost)}.</p>`
          : `<p>${j.status === "active" ? "El ojeador sigue trabajando. Entrega prevista: " + U.date(j.end) : "La evaluación fue interrumpida."}</p>`,
      );
    },
    news(A, id) {
      if (A.state.staffing.assignments.some((j) => j.id === id))
        this.report(A, id);
      else this.profile(A, id);
    },
    action(A, name, data) {
      const s = A.state;
      if (name === "staff-tab") {
        A.staffTab = data.tab;
        A.render();
        return true;
      }
      if (name === "staff-role") {
        A.staffRole = data.role;
        A.render();
        return true;
      }
      if (name === "staff-find") {
        A.staffRole = data.role;
        A.staffTab = "market";
        A.go("staff");
        return true;
      }
      if (name === "staff-profile") {
        this.profile(A, data.id);
        return true;
      }
      if (name === "staff-negotiate") {
        this.negotiate(A, data.id);
        return true;
      }
      if (name === "staff-release") {
        const e = s.employees.find((e) => e.id === data.id);
        G.assert(e?.companyId === s.playerId, "Profesional no disponible.");
        A.confirm(
          "Rescindir contrato de " + e.name,
          `${U.money(S.releaseQuote(e))}: un mes de indemnización, nóminas devengadas y atrasos. Los informes en curso de este ojeador se interrumpirán sin devolución de gastos.`,
          () => {
            A.mutate(() => S.release(s, e.id), "staff");
            U.toast(
              "Contrato liquidado y profesional disponible para nuevas propuestas.",
            );
          },
        );
        return true;
      }
      if (name === "staff-renew") {
        const e = s.employees.find(
          (e) => e.id === data.id && e.companyId === s.playerId,
        );
        G.assert(e, "Profesional no disponible.");
        U.modal(
          "Renovar contrato de " + U.escape(e.name),
          `<form id="staff-renew-form" data-id="${e.id}"><label class="form-field"><span>Salario mensual ($)</span><input name="salary" type="number" min="${S.renewalMinimum(e)}" max="5000" value="${S.renewalMinimum(e)}" required></label><label class="form-field"><span>Meses adicionales</span><select name="months"><option value="6">6 meses</option><option value="12" selected>12 meses</option><option value="24">24 meses</option></select></label><p>Se mantienen la nómina devengada y los atrasos. La nueva duración se suma al vencimiento actual.</p><button class="primary" type="submit">Confirmar renovación</button></form>`,
        );
        return true;
      }
      if (name === "staff-pay") {
        const total = S.overdue(s);
        A.confirm(
          "Liquidar obligaciones de personal",
          `Pagarás ${U.money(total)} en nóminas y liquidaciones vencidas. Los importes ya abonados no se repiten.`,
          () => A.mutate(() => S.pay(s), "staff"),
        );
        return true;
      }
      if (name === "staff-report") {
        this.report(A, data.id);
        return true;
      }
      if (name === "staff-scout-preview") {
        const e = S.owned(s).find((e) => e.role === "scout");
        const q = S.scoutQuote(s, e?.id, data.id);
        A.confirm(
          "Evaluar a " + q.driver.name,
          `Gastos de ojeo: $75. Duración: ${q.days} días. El informe ofrece una estimación imperfecta.`,
          () => {
            A.staffTab = "reports";
            A.mutate(() => S.scout(s, e.id, data.id), "staff");
          },
        );
        return true;
      }
      return false;
    },
    submit(A, form, values) {
      const s = A.state;
      if (form.id === "staff-offer-form") {
        const result = S.offer(s, form.dataset.id, {
          salary: Number(values.get("salary")),
          months: Number(values.get("months")),
          bonus: Number(values.get("bonus")),
        });
        A.persist();
        if (result.accepted) {
          A.close();
          A.staffTab = "team";
          A.go("staff");
          U.toast(
            "Profesional contratado. Su salario ya está en la previsión.",
          );
        } else {
          this.negotiate(A, form.dataset.id);
          U.toast("El representante ha presentado una contraoferta.");
        }
        return true;
      }
      if (form.id === "staff-renew-form") {
        S.renew(
          s,
          form.dataset.id,
          Number(values.get("salary")),
          Number(values.get("months")),
        );
        A.close();
        A.persist();
        A.go("staff");
        U.toast("Contrato renovado; obligaciones anteriores conservadas.");
        return true;
      }
      if (form.id === "staff-scout-form") {
        S.scout(s, form.dataset.employee, String(values.get("driver")));
        A.persist();
        A.render();
        U.toast("Informe encargado. El ojeador ya está trabajando.");
        return true;
      }
      return false;
    },
  });
})();
