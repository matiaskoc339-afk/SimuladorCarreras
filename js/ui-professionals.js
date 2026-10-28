"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    P = G.Professionals,
    S = G.Staff,
    T = G.Practice,
    C = G.PitCrew;
  const percent = (n) =>
    n > 0 && n < 0.01
      ? "<0,01 %"
      : n.toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " %";
  function reviewPanel(s, car) {
    if (!car) return "";
    const report = s.professional.inspections
        .filter((r) => r.carId === car.id && r.companyId === s.playerId)
        .at(-1),
      setup = s.professional.setups[car.id];
    let reason = "";
    try {
      P.reviewQuote(s, car.id);
    } catch (e) {
      reason = e.message;
    }
    return `<section class="panel padded professional-review spaced"><div class="section-title"><div><span class="eyebrow">DIAGNÓSTICO Y MANEJO</span><h2>Una revisión depende de quién la hace.</h2><p>El mecánico es obligatorio; un ingeniero disponible mejora la precisión del diagnóstico y del ajuste.</p></div>${U.button("Revisión profesional", "pro-review", "primary", `data-id="${car.id}" ${reason ? "disabled" : ""}`)}</div>${reason ? `<p class="fine-print">${U.escape(reason)}</p>` : ""}${report ? `<div class="professional-report-line"><span>Última revisión: ${U.date(report.day, true)} · acierto estimado <b>${report.accuracy} %</b></span>${U.button("Consultar diagnóstico", "pro-report", "secondary", `data-id="${report.id}"`)}</div>` : ""}${setup && setup.until >= s.day && setup.kmLimit >= car.km ? `<p class="fine-print">Ajuste de manejo aplicado · válido hasta ${U.date(setup.until, true)} o ${Math.round(setup.kmLimit)} km. Depende de las recomendaciones del informe.</p>` : ""}</section>`;
  }
  for (const name of ["garage", "workshop"]) {
    const original = U[name];
    U[name] = function (s) {
      const html = original.call(this, s),
        car =
          G.ownedCars(s).find((c) => c.id === G.App.selectedCarId) ||
          G.ownedCars(s)[0];
      return html + reviewPanel(s, car);
    };
  }
  const staff = U.staff;
  U.staff = function (s) {
    let html = staff.call(this, s);
    const demands = s.professional.demands.filter(
        (d) => d.companyId === s.playerId && d.status === "pending",
      ),
      offers = s.professional.offers.filter(
        (o) => o.sellerId === s.playerId && o.status === "pending",
      );
    const panel =
      demands.length || offers.length
        ? `<section class="panel padded professional-requests"><span class="eyebrow">DECISIONES DE PERSONAL</span><h2>Tu plantilla espera una respuesta.</h2>${demands.map((d) => `<div class="professional-request"><div><b>${U.escape(s.employees.find((e) => e.id === d.employeeId).name)}</b><p>Solicita ${U.money(d.salary)}/mes · responde antes del ${U.date(d.deadline, true)}.</p></div>${U.button("Negociar aumento", "pro-raise", "secondary", `data-id="${d.id}"`)}</div>`).join("")}${offers.map((o) => `<div class="professional-request"><div><b>Oferta de ${U.escape(s.companies.find((c) => c.id === o.buyerId).name)}</b><p>${U.escape(s.employees.find((e) => e.id === o.employeeId).name)}: ${U.money(o.salary)}/mes. Decisión el ${U.date(o.deadline, true)}; puede marcharse.</p></div>${U.button("Intentar retener", "pro-counter", "secondary", `data-id="${o.id}"`)}</div>`).join("")}</section>`
        : "";
    if (G.App.staffTab === "reports") {
      const cvs = s.professional.cvs
        .filter((cv) => cv.companyId === s.playerId)
        .slice(-12)
        .reverse();
      html += `<section class="panel padded spaced"><div class="section-title"><h2>CV recibidos por tu ojeador</h2><span class="muted">Descubrimientos recientes</span></div>${
        cvs.length
          ? cvs
              .map((cv) => {
                const d = s.drivers.find((d) => d.id === cv.driverId);
                return `<article class="scout-report"><div><span class="eyebrow">${U.date(cv.day, true)} · ${d.companyId ? "CONTRATADO" : P.available(s, d) ? "EN EL MERCADO" : "CV CADUCADO"}</span><h3>${U.escape(d.name)}</h3><p>Potencial estimado ${cv.report.lower}–${cv.report.upper}/100 · acierto <b>${cv.accuracy} %</b>.</p><p>${U.escape(cv.detail)}</p></div>${U.button("Ver CV", "pro-cv", "secondary", `data-id="${d.id}"`)}</article>`;
              })
              .join("")
          : "<p class=muted>Tu ojeador presenta nuevos pilotos cada ciertos días; su nivel determina la frecuencia, el talento y la información disponible.</p>"
      }</section>`;
    }
    return html.replace(
      '<nav class="workshop-section-nav staff-tabs"',
      panel + '<nav class="workshop-section-nav staff-tabs"',
    );
  };
  const profile = G.StaffUI.profile;
  G.StaffUI.profile = function (A, id) {
    profile.call(this, A, id);
    const s = A.state,
      e = s.employees.find((e) => e.id === id),
      p = P.profile(s, id),
      own = e.companyId === s.playerId;
    const fields = `<section class="professional-profile"><div class="professional-level"><b>NV ${p.level}<small>/ 10</small></b><span>${Math.round(p.xp)} / ${p.level === 10 ? "MÁXIMO" : 150 + p.level * 75} XP</span><strong>${U.money(P.marketSalary(s, e))}/mes de referencia</strong></div>${U.bar("Estrés profesional", p.stress, p.stress > 70 ? "#bd5c44" : "#708b7a")}<p class="fine-print">La experiencia sube de nivel. El estrés y el descanso cambian precisión, velocidad y rendimiento.${P.resting(s, id) ? " Descanso hasta " + U.date(p.restUntil) + "; conserva su sueldo." : ""}</p>${["mechanic", "engineer"].includes(e.role) ? `<p>Especialidad: ${e.role === "mechanic" ? "servicio de boxes" : "diagnóstico y ajuste"}. El nivel, la habilidad y el estrés afectan al acierto. Velocidad individual: ${p.speed}/100.</p>` : ""}${own ? `<div class="professional-rest">${[1, 3, 7].map((days) => U.button(`Descansar ${days} día${days === 1 ? "" : "s"}`, "pro-rest", "secondary", `data-id="${id}" data-days="${days}" ${S.busy(s, id) ? "disabled" : ""}`)).join("")}</div>` : ""}</section>`;
    document
      .querySelector(".modal-content")
      .insertAdjacentHTML("afterbegin", fields);
  };
  const details = G.StaffUI.driverDetails;
  G.StaffUI.driverDetails = function (s, d) {
    const c = P.care(s, d.id),
      cvs = s.professional.cvs.filter(
        (cv) => cv.driverId === d.id && cv.companyId === s.playerId,
      ),
      cv = cvs.at(-1);
    return (
      details.call(this, s, d) +
      `<section class="onboarding-note"><strong>Estado del piloto</strong>Estrés ${Math.round(c.stress)} / 100 · fatiga ${Math.round(d.fatigue)} / 100.${c.retired ? " Retirado definitivamente de la competición." : c.injuryUntil > s.day ? " Recuperación hasta " + U.date(c.injuryUntil) + "." : " Disponible médicamente."}${cv ? `<p>CV presentado por tu ojeador · acierto estimado <b>${cv.accuracy} %</b>. Potencial ${cv.report.lower}–${cv.report.upper}/100.</p>${d.companyId !== s.playerId ? "<p>Antes de contratar conoces los atributos básicos y el informe del ojeador. La ficha completa estará disponible al incorporarlo a tu equipo.</p>" : ""}<p>${U.escape(cv.detail)}</p>` : ""}<button class="text-button" data-go="practice">Entrenamiento en pista →</button></section>`
    );
  };
  const report = G.StaffUI.report;
  G.StaffUI.report = function (A, id) {
    report.call(this, A, id);
    const j = A.state.staffing.assignments.find((j) => j.id === id);
    if (j.status === "complete" && j.report.accuracy !== undefined)
      document
        .querySelector(".modal-content")
        .insertAdjacentHTML(
          "afterbegin",
          `<div class="accuracy-stamp">ACIERTO ESTIMADO <b>${j.report.accuracy} %</b><small>80 % significa mayor fiabilidad, no certeza absoluta.</small></div>`,
        );
  };
  U.practice = function (s) {
    const j = T.active(s) || s.professional.practices.at(-1),
      drivers = G.ownedDrivers(s).filter((d) => P.fit(s, d.id)),
      coaches = S.owned(s).filter((e) => e.role === "trainer"),
      cars = G.ownedCars(s);
    return (
      this.heading(
        "CENTRO DE ENTRENAMIENTO",
        "Aprender tiene un ritmo. Descansar también.",
        "Un piloto, un entrenador y un coche. Vueltas simuladas, desgaste real y riesgo visible antes de empezar.",
      ) +
      `<div class="practice-layout"><section class="panel practice-track"><div class="panel-heading"><h2>Circuito del Olivar · entrenamiento</h2><span id="practice-status" class="eyebrow">${j?.status === "running" ? "SESIÓN EN CURSO" : "PISTA DISPONIBLE"}</span></div><canvas id="practice-canvas" aria-label="Pista de entrenamiento con el coche y piloto seleccionados"></canvas><div id="practice-metrics" class="practice-metrics"></div>${j?.status === "running" ? `<div class="practice-controls"><button class="secondary" data-action="practice-pause" id="practice-pause">${G.App.practicePaused ? "Reanudar" : "Pausar"}</button>${[1, 10, 20].map((v) => U.button("×" + v, "practice-speed", G.App.practiceSpeed === v ? "primary" : "secondary", `data-speed="${v}"`)).join("")}${["follow", "overview"].map((mode) => U.button(mode === "follow" ? "Seguir piloto" : "Ver circuito", "practice-camera", (G.App.practiceCamera || "follow") === mode ? "primary" : "secondary", `data-mode="${mode}"`)).join("")}${U.button("Terminar sesión", "practice-stop", "text-button negative")}</div>` : ""}</section><section class="panel padded practice-plan">${T.active(s) ? `<span class="eyebrow">PLAN EN EJECUCIÓN</span><h2>${this.escape(s.drivers.find((d) => d.id === j.driverId).name)}</h2><p>${j.laps} vueltas · ${j.intensity === "hard" ? "intensidad alta" : j.intensity === "easy" ? "suave" : "normal"} · ${G.Drivers.labels[j.focus]}</p><p>Entrenador: ${this.escape(s.employees.find((e) => e.id === j.coachId).name)} · nivel ${j.coachLevel}.</p><p class="fine-print">La sesión ocupa una jornada. Puedes interrumpirla: se conservan desgaste, fatiga y gastos ejecutados.</p>` : !drivers.length || !coaches.length || !cars.length ? `<h2>Prepara el equipo de entrenamiento.</h2><p>Necesitas un piloto apto contratado, un entrenador y un coche operativo. La fatiga y el estrés se recuperan con jornadas de descanso.</p><button class="secondary" data-go="staff">Gestionar personal →</button><button class="text-button" data-go="team">Consultar pilotos →</button>` : `<form id="practice-form"><label class="form-field"><span>Piloto</span><select name="driverId" required><option value="">Selecciona un piloto</option>${drivers.map((d) => `<option value="${d.id}">${this.escape(d.name)} · estrés ${Math.round(P.care(s, d.id).stress)} · fatiga ${Math.round(d.fatigue)}</option>`).join("")}</select></label><label class="form-field"><span>Entrenador</span><select name="coachId" required><option value="">Selecciona un entrenador</option>${coaches.map((e) => `<option value="${e.id}">${this.escape(e.name)} · NV ${P.profile(s, e.id).level} · estrés ${Math.round(P.profile(s, e.id).stress)}${P.resting(s, e.id) ? " · descansando" : ""}</option>`).join("")}</select></label><label class="form-field"><span>Vehículo</span><select name="carId">${cars.map((c) => `<option value="${c.id}">${c.brand} ${c.model} · ${Math.round(c.condition)} %</option>`).join("")}</select></label><div class="form-row"><label class="form-field"><span>Vueltas</span><select name="laps">${[3, 5, 10, 20].map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}</select></label><label class="form-field"><span>Intensidad</span><select name="intensity"><option value="easy">Suave</option><option value="normal" selected>Normal</option><option value="hard">Alta</option></select></label></div><label class="form-field"><span>Objetivo</span><select name="focus">${["control", "pace", "brakes", "consistency"].map((k) => `<option value="${k}">${G.Drivers.labels[k]}</option>`).join("")}</select></label><div id="practice-risk" class="onboarding-note">Selecciona piloto y entrenador para consultar estrés, fatiga y riesgo antes de confirmar.</div><button class="primary wide" type="submit">Revisar plan de entrenamiento</button></form>`}</section></div><section class="panel padded spaced"><div class="section-title"><h2>Historial de sesiones</h2><span class="muted">Últimas veinte sesiones</span></div>${
        s.professional.practices
          .filter((j) => j.status !== "running")
          .slice()
          .reverse()
          .map(
            (j) =>
              `<div class="timeline-line"><small>${U.date(j.completedDay, true)}</small><span><b>${U.escape(s.drivers.find((d) => d.id === j.driverId).name)}</b><br>${j.completed}/${j.laps} vueltas · ${G.Drivers.labels[j.focus]} +${j.gain.toFixed(3)}${j.incident === "injury" ? " · lesión" : j.incident === "career-end" ? " · fin de carrera deportiva" : j.incident ? " · avería" : ""}</span><b>${Math.round(j.driverStress)} <small>estrés</small></b></div>`,
          )
          .join("") ||
        '<p class="muted">Las sesiones terminadas quedarán registradas aquí.</p>'
      }</section>`
    );
  };
  const race = U.race;
  U.race = function (s) {
    return (
      '<section id="manual-pit-panel" class="panel manual-pit" hidden></section><section id="professional-strategy" class="professional-strategy" hidden></section>' +
      race.call(this, s)
    );
  };
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    UI.updateRace(s);
  };
  const UI = (G.ProfessionalUI = {
    practicePaused: false,
    lastPracticePaint: 0,
    practiceAccumulator: 0,
    options(form) {
      return Object.fromEntries(new FormData(form));
    },
    risk(q) {
      return `<strong>Riesgo estimado antes de comenzar</strong>Estrés: ${Math.round(P.care(G.App.state, q.driver.id).stress)} → ${Math.round(q.stressAfter)}/100.<br>Fatiga: ${Math.round(q.driver.fatigue)} → ${Math.round(q.fatigueAfter)}/100.<br>Incidente con lesión: ${percent(q.incidentRisk)}. Accidente que termine su carrera: ${percent(q.severeRisk)}.<br>Uso de pista: $80 · una jornada. Un entrenador con más nivel y descansado reduce el riesgo.`;
    },
    reviewReport(A, id) {
      const r = A.state.professional.inspections.find(
        (r) => r.id === id && r.companyId === A.state.playerId,
      );
      G.assert(r, "Diagnóstico no disponible.");
      U.modal(
        "Revisión profesional del vehículo",
        `<div class="accuracy-stamp">ACIERTO ESTIMADO <b>${r.accuracy} %</b><small>Las mediciones son una estimación. Un profesional novato puede equivocarse.</small></div><p>Informe del ${U.date(r.day)}. ${r.adjusted ? "Se ha aplicado un ajuste de manejo según estas recomendaciones." : "No se han aplicado ajustes de manejo."}</p><div class="professional-components">${Object.entries(
          G.Parts.components,
        )
          .map(([key, label]) =>
            U.bar(label + " · estimado", r.components[key]),
          )
          .join(
            "",
          )}</div><p class="fine-print">Mecánico: ${U.escape(A.state.employees.find((e) => e.id === r.mechanicId).name)}${r.engineerId ? " · Ingeniero: " + U.escape(A.state.employees.find((e) => e.id === r.engineerId).name) : ""}. Coste: ${U.money(r.cost)}.</p>`,
        true,
      );
    },
    action(A, name, data) {
      const s = A.state;
      if (name === "pro-cv") {
        A.driverDetail(data.id);
        return true;
      }
      if (name === "pro-rest") {
        const e = s.employees.find((e) => e.id === data.id);
        A.confirm(
          "Descanso de " + e.name,
          `${data.days} días de descanso remunerado. Durante ese tiempo no aportará sus bonificaciones.`,
          () => {
            A.mutate(() => P.rest(s, e.id, Number(data.days)), "staff");
            G.StaffUI.profile(A, e.id);
          },
        );
        return true;
      }
      if (name === "pro-raise") {
        const d = s.professional.demands.find(
          (d) => d.id === data.id && d.status === "pending",
        );
        G.assert(d, "Solicitud no disponible.");
        U.modal(
          "Negociar aumento",
          `<p>Solicita ${U.money(d.salary)}/mes. Puedes negociar; una propuesta demasiado baja recibirá una contraoferta.</p><form id="pro-raise-form" data-id="${d.id}"><label class="form-field"><span>Salario mensual ($)</span><input type="number" name="salary" min="150" max="5000" value="${d.salary}" required></label><div class="modal-actions">${U.button("Rechazar petición", "pro-refuse", "text-button negative", `data-id="${d.id}"`)}<button type="submit" class="primary">Presentar propuesta</button></div></form>`,
        );
        return true;
      }
      if (name === "pro-refuse") {
        A.mutate(() => P.answerRaise(s, data.id, null), "staff");
        A.close();
        return true;
      }
      if (name === "pro-counter") {
        const o = s.professional.offers.find(
          (o) => o.id === data.id && o.status === "pending",
        );
        G.assert(o, "Oferta no disponible.");
        U.modal(
          "Retener al profesional",
          `<p>La competencia ofrece ${U.money(o.salary)}/mes. Igualar o mejorar esa oferta garantiza que rechace esta propuesta concreta; las relaciones futuras seguirán evolucionando.</p><form id="pro-counter-form" data-id="${o.id}"><label class="form-field"><span>Nuevo salario mensual ($)</span><input name="salary" type="number" min="${o.salary}" max="5000" value="${o.salary}" required></label><button class="primary" type="submit">Presentar contraoferta</button></form>`,
        );
        return true;
      }
      if (name === "pro-review") {
        const q = P.reviewQuote(s, data.id),
          both = { cost: q.cost + 40 };
        U.modal(
          "Revisar y ajustar el coche",
          `<div class="accuracy-stamp">ACIERTO ESTIMADO <b>${q.accuracy} %</b></div><p>El mecánico revisará el vehículo${q.engineer ? " con apoyo del ingeniero" : ""}. El informe puede ser incorrecto. Aplicar un ajuste basado en una revisión equivocada puede empeorar el manejo.</p><div class="modal-actions">${U.button("Solo diagnóstico · " + U.money(q.cost), "pro-review-confirm", "secondary", `data-id="${data.id}" data-adjust="0"`)}${U.button("Diagnóstico y ajuste · " + U.money(both.cost), "pro-review-confirm", "primary", `data-id="${data.id}" data-adjust="1" ${G.player(s).balance < both.cost ? "disabled" : ""}`)}</div>`,
        );
        return true;
      }
      if (name === "pro-review-confirm") {
        let r;
        A.mutate(() => {
          r = P.review(s, data.id, data.adjust === "1");
        });
        this.reviewReport(A, r.id);
        return true;
      }
      if (name === "pro-report") {
        this.reviewReport(A, data.id);
        return true;
      }
      if (name === "pit-manual") {
        const valid = C.action(s, data.value);
        if (!valid)
          U.toast("Secuencia incorrecta: pierdes un segundo de trabajo.", true);
        this.updateRace(s);
        A.persist();
        return true;
      }
      if (name === "pit-wheel") {
        C.action(s, "select", Number(data.wheel));
        this.updateRace(s);
        return true;
      }
      if (name === "pro-auto") {
        const a = s.race?.entrants.find((a) => a.companyId === s.playerId);
        G.assert(
          a?.professional.strategist,
          "No hay un estratega disponible en esta carrera.",
        );
        a.professional.auto = !a.professional.auto;
        a.professional.manualUntil = 0;
        A.persist();
        this.updateRace(s);
        return true;
      }
      if (name === "practice-pause") {
        A.practicePaused = !A.practicePaused;
        const b = document.getElementById("practice-pause");
        if (b) b.textContent = A.practicePaused ? "Reanudar" : "Pausar";
        return true;
      }
      if (name === "practice-camera") {
        G.assert(
          ["follow", "overview"].includes(data.mode),
          "Cámara de entrenamiento inválida.",
        );
        A.practiceCamera = data.mode;
        A.render();
        return true;
      }
      if (name === "practice-speed") {
        G.assert(
          [1, 10, 20].includes(Number(data.speed)),
          "Velocidad inválida.",
        );
        A.practiceSpeed = Number(data.speed);
        A.render();
        return true;
      }
      if (name === "practice-stop") {
        A.practicePaused = true;
        A.confirm(
          "Interrumpir entrenamiento",
          "Se conservarán las vueltas completadas, el desgaste, la fatiga y los gastos. Se contabiliza una jornada de entrenamiento.",
          () => {
            A.mutate(() => T.finish(s, "cancelled"), "practice");
          },
        );
        return true;
      }
      return false;
    },
    submit(A, form, values) {
      if (form.id === "pro-raise-form") {
        const result = P.answerRaise(
          A.state,
          form.dataset.id,
          Number(values.get("salary")),
        );
        A.persist();
        if (result.accepted) {
          A.close();
          A.render();
          U.toast("Aumento acordado.");
        } else {
          form.querySelector('[name="salary"]').value = result.counter;
          U.toast("Contraoferta: " + U.money(result.counter) + "/mes.");
        }
        return true;
      }
      if (form.id === "pro-counter-form") {
        A.mutate(
          () =>
            P.counterPoach(
              A.state,
              form.dataset.id,
              Number(values.get("salary")),
            ),
          "staff",
        );
        A.close();
        return true;
      }
      if (form.id === "practice-form") {
        const options = this.options(form),
          q = T.quote(A.state, options);
        A.confirm(
          "Confirmar entrenamiento en pista",
          `Piloto: ${q.driver.name}; entrenador nivel ${q.level}. ${q.laps} vueltas. Riesgo de incidente con lesión: ${percent(q.incidentRisk)}; fin de carrera deportiva: ${percent(q.severeRisk)}. Coste $80 y una jornada. Fatiga prevista ${Math.round(q.fatigueAfter)}/100 y estrés ${Math.round(q.stressAfter)}/100. Descansa si el riesgo es excesivo.`,
          () => {
            A.practicePaused = false;
            A.practiceSpeed = 10;
            this.practiceAccumulator = 0;
            A.mutate(() => T.start(A.state, options), "practice");
          },
        );
        return true;
      }
      return false;
    },
    updateRace(s) {
      const r = s.race,
        a = r?.entrants.find((a) => a.companyId === s.playerId),
        panel = document.getElementById("manual-pit-panel"),
        strategy = document.getElementById("professional-strategy");
      if (!r?.professionalVersion || !a) return;
      if (strategy) {
        strategy.hidden = !a.professional.strategist;
        if (!strategy.hidden) {
          const p = a.professional;
          strategy.innerHTML = `<span>Estratega NV ${p.strategist.level} · estrés del piloto ${Math.round(p.driverStress)}/100 · ${!p.auto ? "control manual" : r.time < p.manualUntil ? "tu orden prevalece " + Math.ceil(p.manualUntil - r.time) + " s" : "decisiones automáticas"}</span>${U.button(p.auto ? "Tomar control manual" : "Activar estratega", "pro-auto", "secondary")}`;
        }
      }
      const m = a.pit.manual;
      if (!panel) return;
      panel.hidden = !m || m.phase === "done" || a.dnf;
      if (panel.hidden) return;
      const waiting = r.time < m.readyAt,
        key = JSON.stringify([
          m.phase,
          m.selected,
          m.wheels,
          m.errors,
          waiting,
        ]),
        names = [
          "Delantera izquierda",
          "Delantera derecha",
          "Trasera izquierda",
          "Trasera derecha",
        ];
      if (panel.dataset.state !== key) {
        panel.dataset.state = key;
        const w = m.wheels[m.selected],
          all = m.wheels.every((w) => w.tight === 4);
        panel.innerHTML = `<div class="manual-pit-heading"><div><span class="eyebrow">${m.reason === "no-mechanic" ? "NO HAY MECÁNICO EN EL EQUIPO" : "EL MECÁNICO HA FALLADO"}</span><h2>Tu coche necesita una intervención manual.</h2><p>La carrera continúa. Levanta el coche, afloja cuatro tuercas por rueda, retira, monta, aprieta y comprueba las cuatro ruedas.</p></div><b id="manual-pit-clock"></b></div><div class="manual-pit-body"><div class="pit-wheelboard">${[0, 2].map((i) => `<button class="pit-wheel ${m.selected === i ? "selected" : ""} ${m.wheels[i].tight === 4 ? "done" : ""}" data-action="pit-wheel" data-wheel="${i}">${names[i]}<b>${m.wheels[i].loose + Number(m.wheels[i].removed) + Number(m.wheels[i].fitted) + m.wheels[i].tight}/10</b></button>`).join("")}<div class="manual-pit-car">${G.Render.carSVG(s.cars.find((c) => c.id === a.carId))}</div>${[1, 3].map((i) => `<button class="pit-wheel ${m.selected === i ? "selected" : ""} ${m.wheels[i].tight === 4 ? "done" : ""}" data-action="pit-wheel" data-wheel="${i}">${names[i]}<b>${m.wheels[i].loose + Number(m.wheels[i].removed) + Number(m.wheels[i].fitted) + m.wheels[i].tight}/10</b></button>`).join("")}</div><div class="pit-toolbox"><h3>${m.phase === "lift" ? "Primero levanta el coche" : m.phase === "check" ? "Revisión de seguridad" : names[m.selected]}</h3><p>${m.phase === "wheel" ? `Tuercas aflojadas ${w.loose}/4 · ${w.removed ? "rueda retirada" : "rueda montada"} · ${w.fitted ? "recambio colocado" : "recambio pendiente"} · tuercas apretadas ${w.tight}/4` : m.phase === "check" ? "Las cuatro ruedas están sujetas. Comprueba la seguridad antes de salir." : "El coche está detenido en tu puesto de boxes."}</p><div class="pit-tools">${
          m.phase === "lift"
            ? U.button(
                "Levantar coche",
                "pit-manual",
                "primary",
                `data-value="lift" ${waiting ? "disabled" : ""}`,
              )
            : m.phase === "check"
              ? U.button(
                  "Comprobar y terminar",
                  "pit-manual",
                  "primary",
                  `data-value="check" ${waiting ? "disabled" : ""}`,
                )
              : [
                  ["loosen", "Aflojar tuerca"],
                  ["remove", "Retirar rueda"],
                  ["fit", "Montar rueda"],
                  ["tighten", "Apretar tuerca"],
                ]
                  .map(([id, label]) =>
                    U.button(
                      label,
                      "pit-manual",
                      "secondary",
                      `data-value="${id}" ${waiting ? "disabled" : ""}`,
                    ),
                  )
                  .join("") +
                U.button(
                  "Bajar coche",
                  "pit-manual",
                  "primary",
                  `data-value="lower" ${!all || waiting ? "disabled" : ""}`,
                )
        }</div><p class="fine-print">Errores: ${m.errors}. Una secuencia incorrecta retrasa el trabajo. La pausa y la velocidad siguen bajo tu control.</p><div id="manual-pit-rivals" class="manual-pit-rivals"></div></div></div>`;
      }
      const clock = document.getElementById("manual-pit-clock");
      if (clock)
        clock.textContent = (r.time - m.started).toFixed(1) + " s en boxes";
      const rivals = document.getElementById("manual-pit-rivals");
      if (rivals)
        rivals.innerHTML = RCS.Race.positions(r)
          .slice(0, 3)
          .map(
            (b, i) =>
              `<span>${i + 1} · ${U.escape(b.name)} · vuelta ${Math.min(G.Data.tracks[r.track].laps, Math.floor(Math.max(0, b.progress) / G.Data.tracks[r.track].length) + 1)}</span>`,
          )
          .join("");
      if (!panel.dataset.revealed) {
        panel.dataset.revealed = "true";
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    frame(A, time, elapsed) {
      const s = A.state;
      if (!s?.professional) return;
      let j = T.active(s);
      if (j && !A.practicePaused) {
        this.practiceAccumulator += elapsed * (A.practiceSpeed || 10);
        const n = Math.floor(this.practiceAccumulator / G.Race.dt);
        if (n) {
          T.tick(s, n);
          this.practiceAccumulator -= n * G.Race.dt;
        }
        if (!T.active(s)) {
          A.persist();
          if (A.view === "practice") A.render();
          else
            U.toast(
              "El entrenamiento ha terminado. Consulta el resultado en la pista.",
            );
        }
      }
      if (j && time - (this.lastPracticeSave || 0) > 5000) {
        A.persist();
        this.lastPracticeSave = time;
      }
      if (A.view !== "practice") return;
      j = T.active(s) || s.professional.practices.at(-1);
      const canvas = document.getElementById("practice-canvas");
      if (canvas) {
        const fake = j
          ? {
              track: 0,
              time: j.time,
              entrants: [j.a],
              trackWidth: 12.4,
              racingVersion: 1,
              events: [],
              eventCounts: {},
              flag: "green",
              cautions: [],
              weather: { rain: 0, wetness: 0, ambient: 22 },
              safety: { active: false },
            }
          : null;
        G.Render.track(canvas, fake, 0, A.logoImage, {
          mode: j ? A.practiceCamera || "follow" : "overview",
          snap: true,
          zoom: 1.2,
        });
      }
      if (time - this.lastPracticePaint < 150) return;
      this.lastPracticePaint = time;
      const metrics = document.getElementById("practice-metrics");
      if (metrics)
        metrics.innerHTML = j
          ? `<span>Vueltas <b>${j.completed}/${j.laps}</b></span><span>Estrés <b>${Math.round(j.driverStress)}/100</b></span><span>Fatiga <b>${Math.round(j.driverFatigue)}/100</b></span><span>Velocidad <b>${Math.round(j.a.speed * 3.6)} km/h</b></span><span>${j.status === "running" ? (A.practicePaused ? "Pausado" : "×" + (A.practiceSpeed || 10)) : j.incident === "career-end" ? "Retirada deportiva" : j.incident === "injury" ? "Lesión · recuperación " + j.recoveryDays + " días" : j.status === "cancelled" ? "Sesión interrumpida" : "Sesión terminada"}</span>`
          : "Selecciona tu equipo para comenzar.";
    },
  });
  document.addEventListener("change", (event) => {
    const form = event.target.closest("#practice-form");
    if (!form) return;
    const target = document.getElementById("practice-risk");
    try {
      target.innerHTML = UI.risk(T.quote(G.App.state, UI.options(form)));
    } catch (error) {
      target.textContent = error.message;
    }
  });
})();
