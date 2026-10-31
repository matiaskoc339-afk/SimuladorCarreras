"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    A = G.DriverAgency,
    esc = U.escape.bind(U);
  const UI = (G.DriverAgencyUI = {
    identity(s, d) {
      if (!G.DriverWorld.scout(s))
        return '<section class="agency-personality agency-hidden"><span class="eyebrow">SU FORMA DE NEGOCIAR</span><h3>Perfil desconocido</h3><p>Contrata un ojeador para conocer su estilo de negociación. Sin informe, tendrás que interpretar sus respuestas y contraofertas.</p></section>';
      const p = A.persona(s, d),
        r = A.profile(s, d);
      return `<section class="agency-personality"><span class="eyebrow">SU FORMA DE NEGOCIAR</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${r ? `<small>Confianza en el equipo: ${Math.round(r.loyalty)}/100 · ${d.wins - r.wins} victorias desde la última revisión.</small>` : ""}</section>`;
    },
    conversation(n) {
      return n?.agency === 1
        ? `<div class="agency-conversation" role="log" aria-label="Conversación del contrato">${n.conversation.map((c) => `<p class="agency-you"><small>TU PROPUESTA</small><b>${U.money(c.offered)}/día</b></p><p class="agency-driver"><small>EL PILOTO · ${U.money(c.counter)}/día</small><span>${esc(c.text)}</span></p>`).join("")}</div>`
        : "";
    },
    requests(s) {
      const drivers = G.ownedDrivers(s).filter(
        (d) => A.profile(s, d)?.demand?.status === "pending",
      );
      return drivers.length
        ? `<section class="panel padded driver-requests"><span class="eyebrow">TUS PILOTOS QUIEREN HABLAR</span><h2>Los resultados también cuentan en el contrato.</h2>${drivers
            .map((d) => {
              const q = A.profile(s, d).demand;
              return `<article><div><b>${esc(d.name)} pide ${U.money(q.salary)}/día</b><p>${esc(q.reason)}</p><small>Responde hasta ${U.date(q.deadline)}. El sueldo actual se mantiene hasta acordarlo.</small></div>${U.button("Hablar del aumento", "driver-raise", "primary", `data-id="${d.id}"`)}</article>`;
            })
            .join("")}</section>`
        : "";
    },
    raise(app, id) {
      const s = app.state,
        d = G.ownedDrivers(s).find((d) => d.id === id),
        q = d && A.profile(s, d)?.demand;
      G.assert(q?.status === "pending", "La petición ya no está pendiente.");
      U.modal(
        `Revisión salarial · ${esc(d.name)}`,
        `${UI.identity(s, d)}<p>${esc(q.reason)}</p><p>Su petición actual es <b>${U.money(q.salary)}/día</b>. Puedes negociar. Conserva su fecha de fin y sus cláusulas; rechazar afecta a su moral y confianza.</p><form id="driver-raise-form" data-id="${id}"><label class="form-field"><span>Tu propuesta de sueldo por día</span><input name="salary" type="number" min="${d.contract.salary + 1}" max="10000" value="${q.salary}" required></label><p class="fine-print">Necesitas siete días del nuevo sueldo como reserva de caja. No se descuenta una prima al aceptar.</p><p class="agency-response" role="status"></p><div class="modal-actions">${U.button("Rechazar petición", "driver-raise-refuse", "text-button negative", `data-id="${id}"`)}<button type="submit" class="primary">Enviar propuesta</button></div></form>`,
      );
    },
    renewal(app, id) {
      const s = app.state,
        d = G.ownedDrivers(s).find((d) => d.id === id);
      G.assert(d?.contract, "Piloto sin contrato activo.");
      const n = s.driverAgency.renewals[id],
        fixed =
          d.contract.clauses?.renewalOption && !d.contract.clauses.renewalUsed;
      U.modal(
        `Renovar · ${esc(d.name)}`,
        `${UI.identity(s, d)}${UI.conversation(n)}<p>${fixed ? "Tienes una opción firmada: se respeta el aumento pactado del 3 %." : "El piloto comparará su sueldo, resultados, estabilidad y duración. Puede presentar una contrapropuesta."} Se conservan los importes devengados y las obligaciones existentes. El plazo se añade al vencimiento actual.</p><form id="agency-renew-form" data-id="${id}"><div class="form-row"><label class="form-field"><span>Sueldo por día ($)</span><input type="number" name="salary" min="10" max="10000" value="${n?.salary || Math.ceil(d.contract.salary * (fixed ? 1.03 : 1.08))}" required></label><label class="form-field"><span>Ampliación</span><select name="months">${G.Pay.durations(
          s,
        )
          .map(
            (m) =>
              `<option value="${m}" ${m === (n?.months || 6) ? "selected" : ""}>${m} meses</option>`,
          )
          .join(
            "",
          )}</select></label></div><button type="submit" class="primary" ${U.blocked(n?.cooldown > s.day ? `La conversación se retoma el ${U.date(n.cooldown)}.` : d.contract.end - s.day > 60 ? "La renovación se abre en los últimos 60 días del contrato." : "")}>Proponer renovación</button></form>`,
        true,
      );
    },
    action(app, name, data) {
      if (!A.enabled(app.state)) return false;
      if (name === "driver-raise") {
        UI.raise(app, data.id);
        return true;
      }
      if (name === "driver-raise-refuse") {
        const d = G.ownedDrivers(app.state).find((d) => d.id === data.id);
        app.confirm(
          "Rechazar el aumento",
          `${d.name} conservará su contrato actual, pero perderá moral y confianza. Sus próximos acuerdos tendrán en cuenta la relación.`,
          () => {
            A.answer(app.state, data.id, null);
            app.close();
            app.mutate(() => {});
          },
        );
        return true;
      }
      if (name === "renew-driver") {
        UI.renewal(app, data.id);
        return true;
      }
      return false;
    },
    submit(app, form, values) {
      if (!A.enabled(app.state)) return false;
      if (form.id === "driver-raise-form") {
        const result = A.answer(
          app.state,
          form.dataset.id,
          Number(values.get("salary")),
        );
        app.persist();
        if (result.accepted) {
          app.close();
          app.render();
          U.toast(
            "Aumento acordado. El nuevo sueldo se cobra desde la próxima jornada.",
          );
        } else {
          form.querySelector(".agency-response").textContent =
            `${result.reason} Contraoferta: ${U.money(result.salary)}/día.`;
          form.elements.salary.value = result.salary;
        }
        return true;
      }
      if (form.id === "agency-renew-form") {
        const id = form.dataset.id,
          result = A.renew(
            app.state,
            id,
            Number(values.get("salary")),
            Number(values.get("months")),
          );
        app.persist();
        if (result.accepted) {
          app.close();
          app.render();
          U.toast(
            "Renovación acordada. Se conservan las obligaciones del contrato.",
          );
        } else UI.renewal(app, id);
        return true;
      }
      return false;
    },
  });
  const negotiate = G.ChallengeUI.negotiate;
  G.ChallengeUI.negotiate = function (app, id) {
    negotiate.call(this, app, id);
    if (!A.enabled(app.state)) return;
    const s = app.state,
      d = s.drivers.find((d) => d.id === id),
      n = s.negotiations[id],
      form = document.getElementById("negotiate-form");
    if (!form) return;
    form.insertAdjacentHTML(
      "beforebegin",
      UI.identity(s, d) + UI.conversation(n),
    );
    const previous = document.querySelector(".deal-driver>.counter-offer");
    if (previous && n?.agency === 1)
      previous.querySelector("p").textContent =
        n.cooldown > s.day
          ? `Pide una pausa hasta el ${U.date(n.cooldown)}. Cuando vuelva a estar disponible podrás retomar la conversación.`
          : "Esta propuesta corresponde a estas condiciones. Cambiar duración, rol o primas puede cambiar su respuesta.";
    const update = () => {
      if (!G.DriverWorld.scout(s)) {
        form.querySelector(".deal-verdict").className = "deal-verdict";
        form.querySelector(".deal-verdict").textContent =
          "Propuesta preparada. Envía la oferta para conocer su respuesta. Un ojeador puede orientarte sobre sus preferencias; sin él no conoces su forma de negociar.";
        return;
      }
      const salary = Number(form.elements.salary.value),
        months = Number(form.elements.months.value),
        bonus = Number(form.elements.bonus.value),
        k = G.Contracts.driverTerms(s, months, {
          role: form.elements.contractRole.value,
          winBonus: Number(form.elements.winBonus.value),
          releaseMonths: Number(form.elements.releaseMonths.value),
          promiseShare: Number(form.elements.promiseShare.value),
          renewalOption: form.elements.renewalOption.checked,
        });
      const q = A.value(s, d, salary, months, bonus, k),
        note = form.querySelector(".deal-verdict");
      note.className = "deal-verdict";
      note.textContent = `${salary < q.floor ? "El conjunto parece bajo para sus expectativas." : salary >= q.opening ? "El conjunto es atractivo para el piloto." : "Hay margen de negociación: todavía podría pedir que mejores alguna condición."} La respuesta llega al enviar; no existe una aceptación garantizada por la referencia del CV.`;
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
  };
  const team = U.team;
  U.team = function (s, ...args) {
    return (A.enabled(s) ? UI.requests(s) : "") + team.call(this, s, ...args);
  };
  const card = U.driverCard;
  U.driverCard = function (d, ...args) {
    const html = card.call(this, d, ...args),
      s = G.App.state;
    return A.enabled(s)
      ? html.replace(
          "</article>",
          `<p class="driver-personality-note">Contrato: ${G.DriverWorld.scout(s) ? esc(A.persona(s, d).name.toLowerCase()) : "estilo desconocido · requiere ojeador"}${A.profile(s, d)?.demand?.status === "pending" ? " · Quiere hablar de su sueldo" : ""}</p></article>`,
        )
      : html;
  };
  const fields = G.ContractsUI.driverFields;
  G.ContractsUI.driverFields = function (s, ...args) {
    const html = fields.call(this, s, ...args);
    return A.enabled(s)
      ? html.replace(
          "Primas, promesas y una rescisión mayor pueden reducir el salario exigido.",
          "Cada piloto valora de forma distinta el sueldo, las primas, el rol y la estabilidad. Un reserva ambicioso puede exigir más compensación; prometer participación cuenta también en carreras callejeras.",
        )
      : html;
  };
  const details = G.ContractsUI.driverDetails;
  G.ContractsUI.driverDetails = function (s, d) {
    return (
      (A.enabled(s)
        ? UI.identity(s, d) +
          (A.profile(s, d)?.demand?.status === "pending"
            ? U.button(
                "Negociar aumento pendiente",
                "driver-raise",
                "primary",
                `data-id="${d.id}"`,
              )
            : "")
        : "") + details.call(this, s, d)
    );
  };
})();
