"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    L = G.TeamLife,
    esc = U.escape.bind(U),
    button = U.button.bind(U);
  const descriptions = {
    pace: "Velocidad: ritmo y velocidad punta que el piloto consigue aprovechar del coche. La potencia y el estado mecánico siguen limitándolo.",
    control:
      "Control: conserva velocidad y precisión en las curvas, corrige la trazada y reduce pérdidas de control. Un novato necesita levantar más; un experto aprovecha mejor la salida, dentro del agarre disponible.",
    brakes:
      "Frenada: aprovecha la capacidad de frenar del coche para llegar a la curva con menos anticipación. Depende también del estado de los frenos y del asfalto.",
    overtake:
      "Adelantamiento: prepara huecos y elige cuándo intentar superar a un rival. Hace falta espacio y una oportunidad real; no garantiza ganar la posición.",
    defense:
      "Defensa: protege la trazada ante un rival cercano y dificulta que lo superen sin salirse de los límites de la pista.",
    consistency:
      "Consistencia: reduce los errores y las dudas entre vueltas, especialmente bajo presión. Ayuda a repetir un buen ritmo.",
    weather:
      "Adaptación: reduce la pérdida de rendimiento y los errores en lluvia. El compuesto y la cantidad de agua siguen siendo decisivos.",
    tires:
      "Neumáticos: reduce su desgaste durante la conducción. El compuesto, el ritmo, la fatiga y los derrapes también influyen.",
    stamina:
      "Resistencia: acumula menos fatiga a lo largo de la carrera y el entrenamiento. Con cansancio pierde ritmo y precisión.",
    focus:
      "Concentración: acorta la reacción ante tráfico y órdenes; reduce errores de lectura. Un piloto distraído tarda más en responder.",
    discipline:
      "Disciplina: deja espacio y evita comprometer maniobras inseguras; también ayuda a interpretar las órdenes del muro.",
    teamwork:
      "Equipo: ayuda a entender las instrucciones por radio y a gestionar el estrés con el equipo. Un valor bajo puede producir malentendidos.",
  };
  const UI = (G.TeamLifeUI = {
    descriptions,
    guide() {
      return `<details class="driver-stat-guide panel padded"><summary>¿Qué hace cada estadística en carrera?</summary><p>La valoración resume varios atributos. Dos pilotos con la misma valoración pueden conducir de forma muy distinta; edad, experiencia, personalidad, fatiga, estrés y coche completan el comportamiento.</p><dl>${Object.entries(
        descriptions,
      )
        .map(
          ([key, text]) =>
            `<div><dt>${esc(G.Drivers.labels[key])}</dt><dd>${esc(text.slice(text.indexOf(":") + 2))}</dd></div>`,
        )
        .join("")}</dl></details>`;
    },
    board(s) {
      const x = s.teamLife,
        j = x?.job;
      return `<section id="support-income" class="support-income"><div class="section-title"><div><span class="eyebrow">INGRESOS DE APOYO</span><h2>Un pequeño impulso entre carreras.</h2><p>Un encargo cada siete días, entre $110 y $270 al completar. No da puntos ni reputación. Los salarios y gastos ordinarios siguen corriendo.</p></div></div>${j ? `<article class="panel padded support-active"><span class="eyebrow">ENCARGO EN CURSO</span><h3>${esc(L.offers(s, j.week).find((o) => o.id === j.id).name)}</h3><progress max="${j.end - j.start}" value="${s.day - j.start}"></progress><p>${s.day - j.start}/${j.end - j.start} días · entrega ${U.date(j.end)} · ${U.money(j.pay)} al terminar.${j.bay ? " Una bahía reservada." : ""}${j.employeeId ? " Ingeniero ocupado durante el encargo." : ""}</p>${button("Cancelar sin cobro", "support-cancel", "text-button negative")}</article>` : ""}<div class="support-grid">${L.offers(
        s,
      )
        .map((o) => {
          const q = L.quote(s, o.id);
          return `<article class="panel padded support-card"><span class="eyebrow">${esc(o.client)}</span><h3>${esc(o.name)}</h3><p>${esc(o.text)}</p><div class="support-price"><b>${U.money(o.pay)}</b><span>${o.days} días · pago al entregar</span></div><p class="fine-print">Consumibles descontados. ${o.role ? "El sueldo del ingeniero se paga aparte cada día." : "No se contrata personal adicional para este encargo."}</p>${button("Revisar encargo", "support-review", "secondary", `data-id="${o.id}" ${U.blocked(q.reason)}`)}</article>`;
        })
        .join(
          "",
        )}</div><p class="fine-print">Las ofertas cambian cada semana. Cancelar libera los recursos y mantiene la espera entre encargos; no permite cobrar ni renovar el plazo. El encargo de mantenimiento habitual del garaje sigue disponible con sus propias condiciones.</p>${x?.history.length ? `<details class="support-history panel padded"><summary>Historial de encargos de apoyo</summary>${x.history.map((j) => `<p>${U.date(j.finished, true)} · ${esc(L.offers(s, j.week).find((o) => o.id === j.id).name)} · ${j.status === "completed" ? "Entregado · " + U.money(j.pay) : "Cancelado · sin cobro"}${j.reason ? `<small>${esc(j.reason)}</small>` : ""}</p>`).join("")}</details>` : ""}</section>`;
    },
    action(A, name, data) {
      if (name === "stat-explain") {
        U.modal(
          G.Drivers.labels[data.stat],
          `<p>${esc(descriptions[data.stat] || "Consulta la guía de atributos desde Pilotos.")}</p>`,
        );
        return true;
      }
      if (name === "support-review") {
        const q = L.quote(A.state, data.id);
        G.assert(!q.reason, q.reason);
        A.confirm(
          "Aceptar encargo de apoyo",
          `${q.name} para ${q.client}. ${q.days} días, hasta el ${U.date(q.end)}. Cobras ${U.money(q.pay)} solo al completar; consumibles descontados, salarios habituales aparte. ${q.bay ? "Reserva una bahía." : q.employeeId ? "El ingeniero queda ocupado." : "No reserva coche ni piloto."} Solo puedes aceptar uno cada siete días.`,
          () => A.mutate(() => L.start(A.state, q.id), "finance"),
        );
        return true;
      }
      if (name === "support-cancel") {
        A.confirm(
          "Cancelar encargo de apoyo",
          "Liberas los recursos y no cobras. Se mantiene la espera de siete días desde su aceptación.",
          () =>
            A.mutate(
              () =>
                L.close(
                  A.state,
                  "Cancelado por el jugador. No se cobra un trabajo sin terminar.",
                ),
              "finance",
            ),
        );
        return true;
      }
      return false;
    },
  });
  const finance = U.finance;
  U.finance = function (s) {
    const html = finance.call(this, s);
    return G.Research.enabled(s)
      ? html.replace(
          '<section class="panel ledger-panel">',
          UI.board(s) + '<section class="panel ledger-panel">',
        )
      : html;
  };
  const team = U.team;
  U.team = function (s) {
    return team
      .call(this, s)
      .replace(
        '<div class="section-title"><h2>Tu alineación',
        UI.guide() + '<div class="section-title"><h2>Tu alineación',
      );
  };
  const card = U.driverCard;
  U.driverCard = function (d, ...args) {
    let html = card.call(this, d, ...args);
    for (const key of ["pace", "control", "consistency", "overtake"])
      html = html.replace(
        `<span>${G.Drivers.labels[key]}</span>`,
        `<span>${G.Drivers.labels[key]} <button type="button" class="stat-help" data-action="stat-explain" data-stat="${key}" aria-label="Qué hace ${G.Drivers.labels[key]}" title="${esc(descriptions[key])}">?</button></span>`,
      );
    return html;
  };
  const details = G.StaffUI.driverDetails;
  G.StaffUI.driverDetails = function (s, d) {
    return details.call(this, s, d) + UI.guide();
  };
  const workshop = U.workshop;
  U.workshop = function (s) {
    return (
      workshop.call(this, s) +
      (s.teamLife?.job?.bay
        ? `<section class="panel padded"><h3>Una bahía está reservada para un encargo de apoyo.</h3><p>Se libera el ${U.date(s.teamLife.job.end)}. Consulta su entrega o cancelación desde Finanzas.</p><button class="secondary" data-go="finance">Ver encargo de apoyo</button></section>`
        : "")
    );
  };
  const risk = G.ProfessionalUI.risk;
  G.ProfessionalUI.risk = function (q) {
    return (
      risk.call(this, q) +
      (q.estimatedGain !== undefined
        ? `<p class="learning-boost"><b>Mejora prevista de ${esc(G.Drivers.labels[q.focus])}: +${q.estimatedGain.toFixed(q.learningRate > 1.45 ? 2 : 3)}</b> si completas el programa. Compara entrenador, intensidad y vueltas para elegir tu plan; una interrupción concede solo la parte realizada.</p>`
        : "")
    );
  };
})();
