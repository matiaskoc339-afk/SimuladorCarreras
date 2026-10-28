"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    O = G.Operations,
    P = G.Professionals,
    S = G.Staff;
  const field = (name, label, value, min, max, hint = "") =>
    `<label class="form-field"><span>${label}</span><input type="number" name="${name}" value="${value}" min="${min}" max="${max}" step="1" required>${hint ? `<small>${hint}</small>` : ""}</label>`;
  const select = (name, label, value, options) =>
    `<label class="form-field"><span>${label}</span><select name="${name}">${options.map(([v, l]) => `<option value="${v}" ${String(value) === String(v) ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  function person(s, role) {
    const e = S.owned(s).find((e) => e.role === role);
    return e
      ? `<div class="operations-person"><span class="operations-avatar">${e.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join(
            "",
          )}</span><div><span class="eyebrow">${S.roles[role].name} · NV ${P.profile(s, e.id).level}</span><h3>${U.escape(e.name)}</h3><p>Estrés ${Math.round(P.profile(s, e.id).stress)}/100 · ${P.resting(s, e.id) ? "descansando" : S.busy(s, e.id) ? "ocupado" : e.contract.arrears ? "pago pendiente" : "disponible"}</p></div>${U.button("Gestionar", "staff-profile", "secondary", `data-id="${e.id}"`)}</div>`
      : `<div class="operations-person"><div><span class="eyebrow">${S.roles[role].name}</span><h3>Elige a una persona responsable.</h3><p>Sus niveles, estrés, salario y relaciones forman parte de la gestión.</p></div>${U.button("Buscar profesional", "staff-find", "secondary", `data-role="${role}"`)}</div>`;
  }
  function policy(s, kind, title, description, fields) {
    const p = s.operations.settings.policies[kind];
    return `<section class="panel padded operations-policy"><div class="operations-policy-head"><div><span class="eyebrow">${O.kinds[kind]}</span><h2>${title}</h2></div><label class="operations-switch"><input type="checkbox" name="enable-${kind}" ${p.enabled ? "checked" : ""}><span>Delegar</span></label></div><p>${description}</p><div class="operations-form-grid">${field(`${kind}-budget`, "Tope mensual del área ($)", p.budget, 0, 1000000)}${field(`${kind}-priority`, "Prioridad · 1 primero", p.priority, 1, 10)}${fields}</div></section>`;
  }
  function policies(s) {
    const q = s.operations.settings,
      p = q.policies,
      plan = O.plan(s),
      month = plan.spending,
      manager = plan.manager;
    return `<section class="panel padded operations-intro">${person(s, "manager")}<p>Las políticas se evalúan al avanzar cada jornada o al pulsar «Evaluar hoy». Solo se ejecutan las que autorices; los trabajos contratados conservan sus plazos.</p>${plan.gate ? `<p class="operations-wait">${U.escape(plan.gate)}</p>` : `<p class="operations-ready">${U.escape(manager.name.split(" ")[0])} puede supervisar hasta <b>${plan.capacity} operaciones por jornada</b>.</p>`}</section><div class="overview-strip spaced operations-overview">${U.stat("GASTO DELEGADO DEL MES", U.money(month.total), "de " + U.money(q.monthlyLimit))}${U.stat("RESERVA PROTEGIDA", U.money(plan.reserve), "Mínimo de caja + previsión mensual configurada")}${U.stat("ESTADO", q.enabled ? "Activado" : "Pausado", s.operations.lastDaily === s.day ? "La jornada ya fue evaluada" : "Pendiente de evaluación")}</div><form id="operations-form"><section class="panel padded operations-budget"><div class="section-title"><div><span class="eyebrow">LÍMITES GENERALES</span><h2>Tu presupuesto marca el límite.</h2></div><label class="operations-switch"><input type="checkbox" name="enabled" ${q.enabled ? "checked" : ""}><span>Activar delegación</span></label></div><div class="operations-form-grid">${field("monthlyLimit", "Tope mensual total ($)", q.monthlyLimit, 0, 1000000)}${field("dailyLimit", "Tope por jornada ($)", q.dailyLimit, 0, 100000)}${field("minimumCash", "Mínimo de caja intocable ($)", q.minimumCash, 0, 1000000)}${select(
      "reserveMonths",
      "Meses de gasto previstos en reserva",
      q.reserveMonths,
      [0, 1, 2, 3, 4, 5, 6].map((n) => [n, n + " mes" + (n === 1 ? "" : "es")]),
    )}</div><p class="fine-print">Los topes se aplican juntos y no se reinician al guardar o cambiar una política. Sueldos, tratamientos médicos, gastos ordinarios y decisiones manuales se contabilizan aparte en Finanzas.</p></section><div class="operations-policy-grid spaced">${policy(s, "maintenance", "Cuida los coches a tiempo.", "Reparaciones por componente y neumáticos de calle. Conserva las bahías, los especialistas y una jornada libre antes de competir.", field("maintenance-below", "Reparar componentes por debajo de (%)", p.maintenance.below, 30, 95) + field("maintenance-tiresBelow", "Cambiar neumáticos por debajo de (%)", p.maintenance.tiresBelow, 20, 90) + field("maintenance-maxCost", "Máximo por intervención ($)", p.maintenance.maxCost, 1, 10000))}${policy(
      s,
      "training",
      "Entrena sin agotar al piloto.",
      "Formación diaria con entrenador disponible. Respeta estrés, fatiga, descanso previo a carrera y una sesión al día; las prácticas en pista se inician manualmente.",
      select("training-focus", "Objetivo", p.training.focus, [
        ["weakest", "Velocidad o control más débil"],
        ["pace", "Velocidad"],
        ["control", "Control"],
      ]) +
        field(
          "training-fatigue",
          "Descansar desde esta fatiga",
          p.training.fatigue,
          20,
          80,
        ) +
        field(
          "training-stress",
          "Descansar desde este estrés",
          p.training.stress,
          20,
          80,
        ) +
        field(
          "training-restDays",
          "Días de descanso antes de competir",
          p.training.restDays,
          1,
          14,
        ) +
        `<div class="operations-choice-list"><span class="eyebrow">PILOTOS BAJO ESTE PLAN</span>${
          G.ownedDrivers(s)
            .map(
              (d) =>
                `<label><input type="checkbox" name="training-drivers" value="${d.id}" ${p.training.drivers.includes(d.id) ? "checked" : ""}><span>${U.escape(d.name)} <small>Fatiga ${Math.round(d.fatigue)} · estrés ${Math.round(P.care(s, d.id).stress)}</small></span></label>`,
            )
            .join("") ||
          '<p class="muted">Contrata un piloto para añadirlo al programa.</p>'
        }</div>`,
    )}${policy(s, "purchases", "Compra solo lo que autorizas.", "Repone unidades físicas del proveedor hasta tu objetivo por referencia. Respeta precio, estado mínimo, modelos compatibles, existencias y espacio del almacén.", field("purchases-target", "Objetivo de unidades por referencia", p.purchases.target, 1, 3) + field("purchases-minCondition", "Condición mínima de compra (%)", p.purchases.minCondition, 25, 100) + field("purchases-maxUnit", "Máximo por unidad ($)", p.purchases.maxUnit, 1, 10000))}${policy(s, "inventory", "Convierte repuestos en preparación.", "Monta únicamente referencias autorizadas que ya estén en tu inventario. No sustituye una mejora en buen estado ni modifica coches inscritos.", field("inventory-replaceBelow", "Sustituir mejora desgastada por debajo de (%)", p.inventory.replaceBelow, 25, 80) + field("inventory-maxLabor", "Máximo de mano de obra por montaje ($)", p.inventory.maxLabor, 1, 5000))}${policy(s, "scouting", "Busca candidatos con criterio.", "Encarga informes reales al ojeador sobre pilotos libres que cumplan tus filtros. No firma contratos automáticamente ni vuelve a evaluar un expediente ya conocido.", field("scouting-minRating", "Valoración deportiva mínima", p.scouting.minRating, 20, 90) + field("scouting-maxAge", "Edad máxima", p.scouting.maxAge, 18, 45) + field("scouting-interval", "Días entre encargos", p.scouting.interval, 3, 60))}${policy(s, "jobs", "Mantén el taller productivo.", "Acepta encargos cuando hay bahía y tiempo disponibles. Entrega $360 netos al terminar, con la misma espera semanal y personal que un encargo manual.", '<p class="operations-policy-note">No requiere gasto inicial. Ocupa capacidad del gerente y del taller.</p>')}</div><section class="panel padded spaced"><span class="eyebrow">LISTA AUTORIZADA · COMPRAS Y MONTAJES</span><h2>Qué piezas puede gestionar.</h2><p class="muted">Marca las referencias permitidas. Dejar la lista vacía impide las compras y montajes automáticos.</p><div class="operations-parts-list">${G.Parts.catalogue.map((def) => `<label><input type="checkbox" name="parts" value="${def.id}" ${q.parts.includes(def.id) ? "checked" : ""}><span><b>${U.escape(def.name)}</b><small>${U.money(def.price)} nueva · montaje ${U.money(def.labor)}</small></span></label>`).join("")}</div></section><div class="operations-save"><p>El presupuesto y las prioridades guardados se aplican a las siguientes evaluaciones.</p><button class="primary" type="submit" ${G.Practice.active(s) ? "disabled" : ""}>Revisar y guardar políticas</button></div></form><section class="panel padded spaced operations-preview"><div class="section-title"><div><span class="eyebrow">SEGÚN LAS POLÍTICAS GUARDADAS</span><h2>Qué revisará el gerente.</h2></div>${U.button("Evaluar hoy", "operations-run", "secondary", plan.gate || s.operations.lastDaily === s.day ? "disabled" : "")}</div>${
      plan.items
        .slice(0, 12)
        .map(
          (c) =>
            `<div class="operations-preview-row"><div><b>${U.escape(c.label)}</b><small>${c.reason ? U.escape(c.reason) : c.days ? "Disponible · " + c.days + " días de trabajo" : "Disponible"}</small></div><strong>${U.money(c.cost)}</strong></div>`,
        )
        .join("") ||
      '<p class="muted">Activa una política y guarda para consultar las tareas pendientes.</p>'
    }<p class="fine-print">Los bloqueos, los pagos y la capacidad disponible se vuelven a comprobar antes de cada orden.</p></section>`;
  }
  function activity(s) {
    const x = s.operations,
      m = O.spending(s);
    return `<section class="panel padded"><div class="section-title"><div><span class="eyebrow">LIBRO DE OPERACIONES</span><h2>Decisiones que dejan rastro.</h2></div>${U.button("Pausar delegación", "operations-pause", "secondary", x.settings.enabled ? "" : "disabled")}</div><div class="operations-area-spending">${Object.keys(
      O.kinds,
    )
      .map(
        (k) =>
          `<div><span>${O.kinds[k]}</span><b>${U.money(m.spent[k])}</b><small>de ${U.money(x.settings.policies[k].budget)} / mes</small></div>`,
      )
      .join("")}</div>${
      x.log
        .slice()
        .reverse()
        .slice(0, 80)
        .map(
          (r) =>
            `<article class="operations-log-row"><time>${U.date(r.day, true)}</time><div><span class="eyebrow">${O.kinds[r.kind] || "Control general"} · ${r.status === "done" ? "REALIZADO" : r.status === "manual" ? "ORDEN MANUAL" : r.status === "idle" ? "SIN TAREAS" : "EN ESPERA"}</span><h3>${U.escape(r.label)}</h3><p>${U.escape(r.reason)}</p>${r.managerId ? `<small>${U.escape(s.employees.find((e) => e.id === r.managerId).name)}</small>` : ""}</div><b class="${r.cost ? "negative" : "muted"}">${r.cost ? "−" + U.money(r.cost) : "—"}</b></article>`,
        )
        .join("") ||
      '<div class="empty-state"><h3>Todavía no hay decisiones registradas.</h3><p>El gerente anotará tanto las tareas ejecutadas como los motivos que impiden realizarlas.</p></div>'
    }</section>`;
  }
  function medical(s) {
    const x = s.operations;
    return `<section class="panel padded operations-intro">${person(s, "doctor")}<p>El médico trabaja durante dos jornadas. Puede adelantar la recuperación de una lesión, con una probabilidad de acierto según nivel, habilidad y estrés. El tratamiento cuesta $120 y no revierte una retirada deportiva.</p></section><div class="operations-medical-grid spaced">${
      G.ownedDrivers(s)
        .map((d) => {
          const care = P.care(s, d.id),
            active = x.care.find(
              (c) => c.driverId === d.id && c.status === "active",
            );
          let q,
            reason = "";
          try {
            q = O.medicalQuote(s, d.id);
          } catch (error) {
            reason = error.message;
          }
          return `<section class="panel padded operations-patient"><div class="operations-patient-title">${U.portrait(d)}<div><span class="eyebrow">${care.retired ? "RETIRADO" : care.injuryUntil > s.day ? "LESIONADO" : "APTO PARA COMPETIR"}</span><h2>${U.escape(d.name)}</h2><p>${care.retired ? "Retirada deportiva definitiva" : care.injuryUntil > s.day ? "Recuperación prevista: " + U.date(care.injuryUntil) : "Sin lesión activa"}</p></div></div><div class="operations-health-bars">${U.bar("Estrés", care.stress)}${U.bar("Fatiga", d.fatigue)}</div>${active ? `<div class="onboarding-note"><strong>Tratamiento en curso</strong>Finaliza el ${U.date(active.end)} · ${U.escape(s.employees.find((e) => e.id === active.doctorId).name)}. La recuperación se revisará al terminar.</div>` : q ? `<div class="onboarding-note"><strong>${q.accuracy} % de acierto estimado</strong>Puede ahorrar hasta ${q.saving} días; quedan ${q.remaining}. Dos jornadas de trabajo y $120.</div>${U.button("Revisar tratamiento", "operations-treat", "primary", `data-id="${d.id}"`)}` : care.retired || care.injuryUntil > s.day ? `<p class="fine-print">${U.escape(reason)}</p>` : '<p class="fine-print">El descanso ayuda a recuperar estrés y fatiga. No necesita tratamiento de lesiones.</p>'}</section>`;
        })
        .join("") ||
      '<section class="panel empty-state"><h2>Tu plantilla de pilotos está vacía.</h2><button class="secondary" data-go="team">Consultar pilotos →</button></section>'
    }</div><section class="panel padded spaced"><h2>Tratamientos anteriores</h2>${
      x.care
        .filter((c) => c.status !== "active")
        .slice()
        .reverse()
        .map(
          (c) =>
            `<div class="timeline-line"><small>${U.date(c.end, true)}</small><span><b>${U.escape(s.drivers.find((d) => d.id === c.driverId).name)}</b><br>${c.status === "cancelled" ? "Tratamiento interrumpido" : c.saved ? "Recuperación adelantada " + c.saved + " días" : "La recuperación mantiene su fecha anterior"}</span><b>${U.money(c.cost)}</b></div>`,
        )
        .join("") ||
      '<p class="muted">Los resultados del médico se guardarán aquí.</p>'
    }</section>`;
  }
  U.operations = function (s) {
    const tab = G.App.operationsTab || "policies";
    return (
      this.heading(
        "GESTIÓN DE LA COMPAÑÍA",
        "Tu equipo trabaja. Tú decides los límites.",
        "Gerencia, presupuestos y salud de los pilotos, conectados con el día a día.",
      ) +
      `<nav class="workshop-section-nav operations-tabs" aria-label="Operaciones">${[
        ["policies", "Delegación"],
        ["activity", "Actividad y gastos"],
        ["medical", "Salud de pilotos"],
      ]
        .map(([id, label]) =>
          U.button(
            label,
            "operations-tab",
            tab === id ? "active" : "",
            `data-tab="${id}" aria-pressed="${id === tab}"`,
          ),
        )
        .join("")}</nav>` +
      (tab === "medical"
        ? medical(s)
        : tab === "activity"
          ? activity(s)
          : policies(s))
    );
  };
  const finance = U.finance;
  U.finance = function (s) {
    const m = O.spending(s);
    return (
      finance.call(this, s) +
      `<section class="panel padded spaced"><div class="section-title"><div><span class="eyebrow">POLÍTICAS Y PRESUPUESTOS</span><h2>El gasto delegado también está en tu caja.</h2><p class="muted">Este mes: ${U.money(m.total)} de ${U.money(s.operations.settings.monthlyLimit)} autorizados. No es una reserva bloqueada ni un segundo saldo.</p></div><button class="secondary" data-go="operations">Gestionar operaciones →</button></div></section>`
    );
  };
  const details = G.StaffUI.driverDetails;
  G.StaffUI.driverDetails = function (s, d) {
    return (
      details.call(this, s, d) +
      (d.companyId === s.playerId
        ? `<div class="onboarding-note"><strong>${O.controlsTraining(s, d) ? "Formación gestionada por el gerente" : "Seguimiento del piloto"}</strong>${O.controlsTraining(s, d) ? "Las órdenes manuales de formación o descanso retiran a este piloto del plan delegado." : "Consulta su descanso y disponibilidad médica en Operaciones."}<button class="text-button" data-action="operations-medical-go">Salud de pilotos →</button></div>`
        : "")
    );
  };
  const UI = (G.OperationsUI = {
    decode(s, values) {
      const q = G.clone(s.operations.settings);
      q.enabled = values.has("enabled");
      for (const key of [
        "monthlyLimit",
        "dailyLimit",
        "minimumCash",
        "reserveMonths",
      ])
        q[key] = Number(values.get(key));
      q.parts = values.getAll("parts").map(String);
      for (const kind of Object.keys(O.kinds)) {
        const p = q.policies[kind];
        p.enabled = values.has("enable-" + kind);
        for (const key of Object.keys(p)) {
          if (["enabled", "drivers", "focus"].includes(key)) continue;
          p[key] = Number(values.get(kind + "-" + key));
        }
      }
      q.policies.training.drivers = values
        .getAll("training-drivers")
        .map(String);
      q.policies.training.focus = String(values.get("training-focus"));
      return q;
    },
    action(A, name, data) {
      const s = A.state;
      if (name === "operations-tab") {
        G.assert(
          ["policies", "activity", "medical"].includes(data.tab),
          "Sección desconocida.",
        );
        A.operationsTab = data.tab;
        A.render();
        return true;
      }
      if (name === "operations-medical-go") {
        A.operationsTab = "medical";
        A.go("operations");
        return true;
      }
      if (name === "operations-pause") {
        A.mutate(() => O.pause(s));
        U.toast(
          "Delegación pausada. Los trabajos ya contratados conservan su plazo.",
        );
        return true;
      }
      if (name === "operations-run") {
        const plan = O.plan(s);
        G.assert(!plan.gate, plan.gate);
        A.confirm(
          "Evaluar las políticas de hoy",
          `El gerente puede supervisar hasta ${plan.capacity} operaciones. Respetará un máximo diario de ${U.money(s.operations.settings.dailyLimit)}, los topes mensuales y una reserva de ${U.money(plan.reserve)}. No volverá a evaluar hoy.`,
          () => {
            let result;
            A.mutate(() => {
              result = O.run(s);
            }, "operations");
            U.toast(
              `${result.count} operaciones · ${U.money(result.spent)} ejecutados.`,
            );
          },
        );
        return true;
      }
      if (name === "operations-treat") {
        const q = O.medicalQuote(s, data.id);
        A.confirm(
          "Confirmar tratamiento médico",
          `${q.d.name}: dos jornadas con ${q.doctor.name} (nivel ${P.profile(s, q.doctor.id).level}). Coste $120. Acierto estimado ${q.accuracy} %; si funciona puede ahorrar hasta ${q.saving} días de recuperación. Puede no mejorar la fecha; solo se realiza un tratamiento por lesión.`,
          () => {
            A.mutate(() => O.treat(s, data.id), "operations");
            U.toast(
              "Tratamiento iniciado. Consulta el resultado dentro de dos jornadas.",
            );
          },
        );
        return true;
      }
      return false;
    },
    submit(A, form, values) {
      if (form.id !== "operations-form") return false;
      const q = this.decode(A.state, values);
      O.validateSettings(A.state, q);
      A.confirm(
        "Guardar políticas de operaciones",
        `${q.enabled ? "Delegación activada" : "Delegación pausada"}. Tope mensual ${U.money(q.monthlyLimit)}, diario ${U.money(q.dailyLimit)} y mínimo de caja ${U.money(q.minimumCash)}, más ${q.reserveMonths} meses de previsión. Las tareas que habilites podrán ejecutarse cada jornada. Los gastos ya realizados se conservan.`,
        () => {
          A.mutate(() => O.configure(A.state, q), "operations");
          U.toast("Políticas guardadas.");
        },
      );
      return true;
    },
  });
})();
