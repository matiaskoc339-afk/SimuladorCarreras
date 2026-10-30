"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    R = G.Research,
    T = G.Practice,
    P = G.Professionals,
    S = G.Staff;
  const signed = (v) => (v > 0 ? "+" : "") + v.toFixed(3),
    button = U.button.bind(U),
    names = {
      recovery: "Recuperación de lesiones",
      rest: "Recuperación de fatiga",
      training: "Aprendizaje",
      trainingStress: "Menos estrés en pista",
      campTime: "Menos días de programa",
      diagnostics: "Precisión del diagnóstico",
      pit: "Menos tiempo de boxes",
      tireWear: "Menos desgaste continuo",
    };
  const D = (G.DevelopmentUI = {
    outcome(j) {
      return j.incident === "mechanical"
        ? "Interrumpido por avería"
        : j.incident === "injury"
          ? "Interrumpido por lesión"
          : j.incident === "career-end"
            ? "Interrumpido por accidente grave"
            : j.status === "cancelled"
              ? "Programa interrumpido"
              : "Programa completado";
    },
    preview(s, form) {
      if (!form || !R.enabled(s)) return;
      const target = form.querySelector("#practice-risk"),
        submit = form.querySelector('[type="submit"]');
      if (!target || !submit) return;
      form.querySelector(".action-error")?.remove();
      try {
        const q = T.quote(s, G.ProfessionalUI.options(form));
        target.innerHTML = G.ProfessionalUI.risk(q);
        target.classList.remove("practice-blocked");
        submit.disabled = false;
      } catch (error) {
        target.innerHTML = `<strong>Antes de iniciar el entrenamiento:</strong><ul class="training-requirements">${error.message
          .split("\n")
          .map((reason) => `<li>${U.escape(reason)}</li>`)
          .join("")}</ul>`;
        target.classList.add("practice-blocked");
        submit.disabled = true;
      }
      submit.setAttribute("aria-describedby", "practice-risk");
    },
    action(A, name, data) {
      const s = A.state;
      if (name === "development-enable") {
        A.confirm(
          "Activar investigación y programas por días",
          "Se añaden investigadores y coches al mercado. Las prácticas nuevas serán programas de varios días. Conservas tus activos, contratos y calendario actual; la rotación de 32 pistas se aplicará al abrir otra temporada. Termina antes cualquier carrera o práctica antigua.",
          () => A.mutate(() => R.initialize(s), "research"),
        );
        return true;
      }
      if (name === "research-pause") {
        A.mutate(() => R.pause(s), "research");
        return true;
      }
      if (name === "research-cancel") {
        A.confirm(
          "Cancelar investigación",
          "Perderás el proyecto y el material pagado; las mejoras completadas se conservan.",
          () => A.mutate(() => R.cancel(s), "research"),
        );
        return true;
      }
      if (name === "research-node") {
        const e = R.owned(s)[0];
        try {
          const q = R.quote(s, data.id, e?.id);
          A.confirm(
            q.node.name,
            `Materiales: ${U.money(q.cost)}. ${q.days} días activos. Salario del investigador: ${U.money(q.e.contract.salary)}/día; ${U.money(q.wages)} durante ese plazo. Total previsto: ${U.money(q.total)}. ${q.node.description}`,
            () => A.mutate(() => R.start(s, data.id, e.id), "research"),
          );
        } catch (error) {
          U.toast(error.message, true);
        }
        return true;
      }
      if (name === "research-resume") {
        const e = R.owned(s)[0];
        try {
          const q = R.quote(s, s.research.project?.nodeId, e?.id, true);
          A.confirm(
            "Reanudar investigación",
            `${q.days} jornadas activas restantes. Sin volver a pagar materiales. Nómina prevista: ${U.money(q.wages)}.`,
            () => A.mutate(() => R.resume(s, e.id), "research"),
          );
        } catch (error) {
          U.toast(error.message, true);
        }
        return true;
      }
      if (name === "camp-day") {
        A.advance(1);
        return true;
      }
      if (name === "camp-stop") {
        A.confirm(
          "Interrumpir programa",
          "El informe conservará los días trabajados, aprendizaje, desgaste y gastos. La reserva no se devuelve.",
          () => A.mutate(() => T.finish(s, "cancelled"), "practice"),
        );
        return true;
      }
      if (name === "camp-report") {
        const j = s.professional.practices.find((j) => j.id === data.id);
        G.assert(j?.report, "Informe no disponible.");
        U.modal("Informe de entrenamiento", this.report(s, j), true);
        return true;
      }
      return false;
    },
    submit(A, form, values) {
      if (form.id !== "practice-form" || !R.enabled(A.state)) return false;
      const options = G.ProfessionalUI.options(form),
        q = T.quote(A.state, options);
      A.confirm(
        "Reservar programa de pista",
        `${q.driver.name} · ${q.coach.name} (nivel ${q.level}). ${q.laps} vueltas distribuidas en ${q.days} días, hasta ${U.date(q.end)}. Reserva: ${U.money(q.cost)}. Sueldos durante el programa: piloto ${U.money(q.pilotWages)}, entrenador ${U.money(q.coachWages)}, aparte del resto del equipo. Riesgo estimado de lesión ${q.incidentRisk.toFixed(2)} %. Fatiga final estimada ${Math.round(q.fatigueAfter)}/100, estrés ${Math.round(q.stressAfter)}/100. Intensidad alta con estrés excesivo puede empeorar la regularidad. El plazo supone que no hay incidentes: una avería, lesión o impago puede interrumpirlo antes. En ese caso recibirás un informe parcial y la reserva no se devuelve.`,
        () => A.mutate(() => T.start(A.state, options), "practice"),
      );
      return true;
    },
    report(s, j) {
      const r = j.report,
        good = Object.entries(r.changes).filter(([, v]) => v > 1e-6),
        bad = Object.entries(r.changes).filter(([, v]) => v < -0.000001);
      return `<section class="camp-report camp-outcome ${j.incident || j.status === "cancelled" ? "interrupted" : ""}"><span class="eyebrow">${U.escape(s.drivers.find((d) => d.id === j.driverId).name)} · ${U.date(r.day)}</span><h3>${D.outcome(j)}</h3><p>${U.escape(r.learned)}</p><p>Duración prevista: ${j.days} días, hasta el ${U.date(j.end)}. Duración real: ${j.daysWorked} días; ${j.workLaps.toFixed(1)}/${j.laps} vueltas. ${j.daysWorked < j.days ? `Quedaron ${j.days - j.daysWorked} días sin realizar; el programa no se completó.` : "Se realizaron todas las jornadas previstas."} Reserva ${U.money(j.cost)}; los días no realizados no generan aprendizaje y la reserva no se devuelve.</p><div class="camp-report-columns"><div><h4>Qué mejoró</h4>${good.length ? good.map(([key, v]) => `<p><b>${U.escape(G.Drivers.labels[key])}</b><strong class="positive">${signed(v)}</strong></p>`).join("") : "<p>Sin mejora consolidada de atributos.</p>"}</div><div><h4>Qué empeoró o exige descanso</h4>${bad.map(([key, v]) => `<p><b>${U.escape(G.Drivers.labels[key])}</b><strong class="negative">${signed(v)}</strong></p>`).join("")}${r.fatigueChange > 0 ? `<p>Fatiga <strong>+${r.fatigueChange.toFixed(1)}</strong></p>` : ""}${r.stressChange > 0 ? `<p>Estrés <strong>+${r.stressChange.toFixed(1)}</strong></p>` : ""}<p>Estado de neumáticos <strong>${r.tireChange.toFixed(1)} puntos</strong></p>${!bad.length ? "<p>Sin pérdidas permanentes de habilidad.</p>" : ""}</div></div><p>${U.escape(r.reason)}</p>${j.incident === "injury" ? `<p class="negative">Lesión: ${j.recoveryDays} días de recuperación. Consulta Operaciones y salud.</p>` : j.incident === "career-end" ? '<p class="negative">Accidente grave: fin de la carrera deportiva.</p>' : ""}</section>`;
    },
    frame(A, time, elapsed) {
      if (A.view !== "practice") return;
      const s = A.state,
        j = T.active(s) || s.professional.practices.at(-1),
        canvas = document.getElementById("practice-canvas");
      if (!canvas) return;
      const preview = j ? G.clone(j.a) : null;
      if (preview && j.status === "running") {
        const d = s.drivers.find((d) => d.id === j.driverId),
          speed = Math.max(16, 20 + d.stats.pace * 0.1);
        preview.progress =
          ((time / 1000) * speed) % G.Data.tracks[j.track].length;
        preview.speed = speed;
        preview.finishTime = null;
        preview.braking =
          G.Racecraft.sample(j.track, preview.progress + 35).limit < 25;
      }
      const fake = preview
        ? {
            track: j.track,
            time: time / 1000,
            entrants: [preview],
            trackWidth: G.Data.tracks[j.track].width,
            racingVersion: 1,
            events: [],
            eventCounts: {},
            flag: "green",
            cautions: [],
            weather: { rain: 0, wetness: 0, ambient: 22 },
            safety: { active: false },
          }
        : null;
      G.Render.track(canvas, fake, j?.track ?? 10, A.logoImage, {
        mode: preview ? A.practiceCamera || "follow" : "overview",
        zoom: 1.2,
      });
      const metrics = document.getElementById("practice-metrics");
      if (metrics)
        metrics.innerHTML = j
          ? `<span>Jornadas <b>${j.daysWorked}/${j.days}</b></span><span>Vueltas acumuladas <b>${j.workLaps.toFixed(1)}/${j.laps}</b></span><span>Estrés <b>${Math.round(j.driverStress)}/100</b></span><span>Fatiga <b>${Math.round(j.driverFatigue)}/100</b></span><span>${j.status === "running" ? "Vista del programa · el progreso avanza por días" : D.outcome(j)}</span>`
          : "La pista espera un programa. Elige piloto, entrenador y coche.";
    },
  });
  U.research = function (s) {
    const heading = this.heading(
      "DESARROLLO DEL EQUIPO",
      "Pequeñas ventajas. Trabajo de fondo.",
      "Protocolos permanentes para tu equipo. La investigación usa materiales, jornadas activas y el salario del científico.",
    );
    if (!R.enabled(s))
      return (
        heading +
        `<section class="panel padded"><h2>Investigación y entrenamiento por días</h2><p>Activa los nuevos sistemas cuando no haya una carrera o práctica anterior en curso. Se conservan tu empresa y el calendario actual.</p>${button("Activar nueva gestión", "development-enable", "primary", s.race || T.active(s) ? "disabled" : "")}</section>`
      );
    const scientists = R.owned(s),
      e = scientists[0],
      j = s.research.project,
      node = j && R.nodes.find((n) => n.id === j.nodeId);
    if (!e)
      return (
        heading +
        `<section class="panel padded research-locked"><span class="eyebrow">LABORATORIO CERRADO</span><h2>Contrata un investigador.</h2><p>Su contrato habilita el árbol. Nivel, habilidad y estrés cambian precio y plazo; sus salarios son altos y se pagan cada día. Las mejoras ya terminadas se conservan aunque se marche.</p><button class="primary" data-go="staff">Ir al mercado de personal →</button></section>`
      );
    const profile = P.profile(s, e.id),
      effects = Object.keys(names).filter((key) => R.effect(s, key) > 0);
    return (
      heading +
      `<div class="research-overview"><section class="panel padded"><span class="eyebrow">RESPONSABLE CIENTÍFICO</span><h2>${this.escape(e.name)} · NV ${profile.level}</h2><p>${this.money(e.contract.salary)}/día · habilidad ${Math.round(e.skill)} · estrés ${Math.round(profile.stress)}/100</p><p>Sueldos y gastos ordinarios continúan durante pausas. Puedes gestionarlo y darle descanso desde Personal.</p><button class="secondary" data-go="staff">Gestionar investigador</button></section><section class="panel padded"><span class="eyebrow">VENTAJAS COMPLETADAS</span>${effects.length ? effects.map((key) => `<p>${names[key]} <b>${key === "diagnostics" ? "+" + R.effect(s, key) + " puntos" : Math.round(R.effect(s, key) * 100) + " %"}</b></p>`).join("") : "<p>Investiga uno de los tres protocolos iniciales.</p>"}</section></div>${j ? `<section class="panel padded research-project"><span class="eyebrow">${j.status === "active" ? "PROYECTO ACTIVO" : "PROYECTO PAUSADO"}</span><h2>${node.name}</h2><progress max="${node.days}" value="${j.work}"></progress><p>${Math.round((j.work / node.days) * 100)} % completado · ${Math.ceil((1 - j.work / node.days) * j.duration)} jornadas activas restantes · materiales pagados ${this.money(j.cost)}</p><p>${this.escape(j.blockedReason)}</p><div class="research-actions">${button(j.status === "active" ? "Pausar proyecto" : "Reasignar y reanudar", j.status === "active" ? "research-pause" : "research-resume", "secondary")}${button("Cancelar sin reembolso", "research-cancel", "text-button negative")}</div></section>` : ""}<div class="research-tree">${Object.entries(
        R.branches,
      )
        .map(
          ([id, title]) =>
            `<section class="research-branch"><h2>${title}</h2>${R.nodes
              .filter((n) => n.branch === id)
              .map((n) => {
                let q = null,
                  reason = "";
                const done = s.research.completed[n.id];
                if (!done && !j) {
                  try {
                    q = R.quote(s, n.id, e.id);
                  } catch (error) {
                    reason = error.message;
                  }
                }
                return `<article class="panel padded research-node ${done ? "completed" : q ? "available" : "locked"}" data-node="${n.id}"><span class="eyebrow">${done ? "COMPLETADO" : `INVESTIGADOR NV ${n.level}+`}</span><h3>${n.name}</h3><p>${n.description}</p>${n.requires.length ? `<small>Requiere: ${R.nodes.find((v) => v.id === n.requires[0]).name}</small>` : "<small>Protocolo inicial</small>"}${q ? `<div class="research-price"><b>${this.money(q.cost)} de materiales</b><span>${q.days} días · ${this.money(q.wages)} de nómina estimada</span></div>${button("Revisar investigación", "research-node", "primary", `data-id="${n.id}"`)}` : done ? `<p>Disponible desde ${this.date(done.day)}</p>` : `<p class="fine-print">${this.escape(reason || "Termina o cancela el proyecto en curso.")} Base de referencia: ${this.money(n.cost)} y ${n.days} días; el investigador rebaja ambos.</p>`}</article>`;
              })
              .join("")}</section>`,
        )
        .join(
          "",
        )}</div><section class="panel padded spaced"><h2>Actividad científica</h2>${s.research.history.map((j) => `<p>${this.date(j.completedDay, true)} · ${R.nodes.find((n) => n.id === j.nodeId).name} · ${j.status === "completed" ? "Completado" : "Cancelado"} · ${this.money(j.cost)}</p>`).join("") || "<p>Los proyectos terminados y cancelados quedarán registrados aquí.</p>"}</section>`
    );
  };
  const practice = U.practice;
  U.practice = function (s) {
    if (!R.enabled(s) || (T.active(s) && !T.active(s).calendarVersion))
      return practice.call(this, s);
    const j =
        T.active(s) ||
        s.professional.practices.filter((j) => j.calendarVersion).at(-1),
      drivers = G.ownedDrivers(s),
      coaches = S.owned(s).filter((e) => e.role === "trainer"),
      cars = G.ownedCars(s);
    return (
      this.heading(
        "CAMPUS DE PILOTOS",
        "Entrena hoy. Consolida en los próximos días.",
        "Cada programa reserva piloto, entrenador y coche. Avanza el calendario para progresar; observar la pista no consume días ni concede mejoras.",
      ) +
      `<div class="practice-layout"><section class="panel practice-track"><div class="panel-heading"><h2>Autódromo de la Vega · campus</h2><span class="eyebrow">${T.active(s) ? "PROGRAMA EN CURSO" : "PISTA DISPONIBLE"}</span></div><canvas id="practice-canvas" aria-label="Vista del piloto entrenando durante el programa por días"></canvas><div id="practice-metrics" class="practice-metrics"></div><div class="practice-controls">${["follow", "overview"].map((mode) => button(mode === "follow" ? "Seguir piloto" : "Ver circuito", "practice-camera", "secondary", `data-mode="${mode}"`)).join("")}</div></section><section class="panel padded practice-plan">${T.active(s) ? `<span class="eyebrow">PROGRAMA RESERVADO</span><h2>${this.escape(s.drivers.find((d) => d.id === j.driverId).name)}</h2><p>${j.daysWorked} de ${j.days} días · fecha prevista ${this.date(j.end)}</p><p>${this.escape(s.employees.find((e) => e.id === j.coachId).name)} · entrenador NV ${j.coachLevel}</p><p>${G.Drivers.labels[j.focus]} · ${j.laps} vueltas · reserva pagada ${this.money(j.cost)}</p><progress max="${j.days}" value="${j.daysWorked}"></progress><p>Los sueldos se pagan cada día. Puedes gestionar la empresa y competir con otra alineación mientras termina el programa.</p>${button("Avanzar un día de calendario", "camp-day", "primary wide")}${button("Interrumpir y recibir informe", "camp-stop", "text-button negative")}` : `<form id="practice-form"><label class="form-field"><span>Piloto</span><select name="driverId"><option value="">Selecciona piloto</option>${drivers.map((d) => `<option value="${d.id}" ${j?.driverId === d.id ? "selected" : ""}>${this.escape(d.name)}${P.care(s, d.id)?.retired ? " · retirado" : !P.fit(s, d.id) ? " · lesionado hasta " + this.date(P.care(s, d.id).injuryUntil, true) : ""} · valoración ${G.Drivers.rating(d)} · estrés ${Math.round(P.care(s, d.id).stress)}</option>`).join("")}</select></label><label class="form-field"><span>Entrenador</span><select name="coachId"><option value="">Selecciona entrenador</option>${coaches.map((e) => `<option value="${e.id}" ${j?.coachId === e.id ? "selected" : ""}>${this.escape(e.name)}${P.resting(s, e.id) ? " · descansando" : S.busy(s, e.id) ? " · ocupado" : ""} · NV ${P.profile(s, e.id).level} · habilidad ${Math.round(e.skill)}</option>`).join("")}</select></label><label class="form-field"><span>Coche</span><select name="carId"><option value="">Selecciona coche</option>${cars.map((c) => `<option value="${c.id}" ${(j?.carId || cars[0]?.id) === c.id ? "selected" : ""}>${this.escape(c.brand + " " + c.model)}${c.repair ? " · en taller" : G.Market.listed(s, c.id) ? " · anunciado" : ""} · ${Math.round(c.condition)} %</option>`).join("")}</select></label><div class="form-row"><label class="form-field"><span>Vueltas del programa</span><select name="laps">${[3, 5, 10, 20].map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n}</option>`).join("")}</select></label><label class="form-field"><span>Intensidad</span><select name="intensity"><option value="easy">Suave</option><option value="normal" selected>Normal</option><option value="hard">Alta</option></select></label></div><label class="form-field"><span>Objetivo</span><select name="focus">${(G.RaceSkills?.focuses(s) || ["control", "pace", "brakes", "consistency"]).map((k) => `<option value="${k}">${G.Drivers.labels[k]}</option>`).join("")}</select></label><div id="practice-risk" class="onboarding-note" role="status" aria-live="polite">Selecciona piloto y entrenador para consultar días, coste y riesgos.</div><button class="primary wide" type="submit">Revisar programa por días</button></form>`}<div class="practice-help-links"><button class="text-button" data-go="team">Pilotos y contratos</button><button class="text-button" data-go="staff">Personal y descansos</button><button class="text-button" data-go="workshop">Taller y neumáticos</button><button class="text-button" data-go="operations">Operaciones y salud</button></div></section></div>${j?.report ? `<section class="panel padded spaced">${D.report(s, j)}</section>` : ""}<section class="panel padded spaced"><h2>Informes de programas</h2>${
        s.professional.practices
          .filter((j) => j.report)
          .slice()
          .reverse()
          .map(
            (j) =>
              `<div class="timeline-line"><small>${this.date(j.completedDay, true)}</small><span>${this.escape(s.drivers.find((d) => d.id === j.driverId).name)} · ${D.outcome(j)} · ${j.daysWorked}/${j.days} días · ${G.Drivers.labels[j.focus]} ${signed(j.gain)}</span>${button("Ver informe", "camp-report", "secondary", `data-id="${j.id}"`)}</div>`,
          )
          .join("") ||
        "<p>Al terminar o interrumpir un programa recibirás el informe de aprendizaje, mejoras y desgaste.</p>"
      }</section>`
    );
  };
  const frame = G.ProfessionalUI.frame;
  G.ProfessionalUI.frame = function (A, time, elapsed) {
    const j = T.active(A.state || {});
    if (R.enabled(A.state) && (!j || j.calendarVersion)) {
      D.frame(A, time, elapsed);
      return;
    }
    return frame.call(this, A, time, elapsed);
  };
  const risk = G.ProfessionalUI.risk;
  G.ProfessionalUI.risk = function (q) {
    return q.days
      ? `<strong>${q.days} días · hasta ${U.date(q.end)}</strong><p>Reserva ${U.money(q.cost)}. Sueldos durante ese plazo: piloto ${U.money(q.pilotWages)}, entrenador ${U.money(q.coachWages)}.</p><p>Estrés final estimado ${Math.round(q.stressAfter)}/100 · fatiga ${Math.round(q.fatigueAfter)}/100 · riesgo de lesión ${q.incidentRisk.toFixed(2)} %.</p><p>Mejor entrenador y piloto reducen días y mejoran el aprendizaje. Intensidad alta con estrés excesivo puede empeorar la regularidad.</p>`
      : risk.call(this, q);
  };
})();
