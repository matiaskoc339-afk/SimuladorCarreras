"use strict";
(() => {
  const G = RCS,
    U = G.UI,
    B = G.Challenge,
    P = G.Pay;
  const cash = (n) => U.money(n),
    durations = (s) =>
      P.durations(s)
        .map(
          (n) =>
            `<option value="${n}" ${n === 1 ? "selected" : ""}>${n} mes${n === 1 ? "" : "es"} · ${n * 30} días</option>`,
        )
        .join("");
  const UI = (G.ChallengeUI = {
    negotiate(A, id) {
      const s = A.state,
        d = s.drivers.find((d) => d.id === id && !d.companyId);
      G.assert(d, "Este piloto no está disponible.");
      B.requireDriver(s, d);
      const n = s.negotiations[id],
        salary = n?.salary || d.ask;
      U.modal(
        `Contrato de ${U.escape(d.name)}`,
        `<div class="deal-driver"><div class="deal-identity">${U.portrait(d)}<div><span class="eyebrow">${G.Drivers.rating(d)} /100 · ${U.escape(G.Data.traits[d.trait].name)}</span><h3>${U.escape(d.name)}</h3><p>${d.age} años · ${U.escape(d.nation)} · ${d.experience.toFixed(0)} años de experiencia</p><strong>Referencia: ${cash(d.ask)}/día</strong><small>${cash(d.ask * 30)} por 30 días, antes de primas.</small></div></div>${n ? `<div class="counter-offer"><b>El representante propone ${cash(n.salary)}/día.</b><p>${n.cooldown > s.day ? "La conversación vuelve a abrirse el " + U.date(n.cooldown) : "Puedes usar la contraoferta o ajustar las condiciones."}</p></div>` : ""}<form id="negotiate-form" data-id="${id}"><div class="deal-layout"><div><section class="deal-step"><span class="eyebrow">1 · TU OFERTA</span><div class="form-row"><label class="form-field"><span>Sueldo por día ($)</span><input name="salary" type="number" min="10" max="10000" value="${salary}" required></label><label class="form-field"><span>Duración del contrato</span><select name="months">${durations(s)}</select></label></div><div class="deal-shortcuts">${[
          [Math.max(10, Math.floor(salary * 0.95)), "Probar un 5 % menos"],
          [salary, n ? "Usar contraoferta" : "Sueldo de referencia"],
          [Math.ceil(salary * 1.1), "Mejorar un 10 %"],
        ]
          .map(([value, label]) =>
            U.button(label, "deal-rate", "secondary", `data-value="${value}"`),
          )
          .join(
            "",
          )}</div></section><section class="deal-step"><span class="eyebrow">2 · PAGO AL FIRMAR</span><label class="form-field"><span>Prima de contratación ($)</span><input name="bonus" type="number" min="0" max="5000" value="${n?.bonus || 0}" required></label><p class="fine-print">La prima se paga ahora. El sueldo se descuenta al avanzar cada jornada. Un contrato corto limita el compromiso futuro, pero no elimina una indemnización pactada.</p></section><details class="deal-clauses"><summary>3 · Cláusulas, rol y promesas <span>Opcional</span></summary>${G.ContractsUI.driverFields(s, n?.terms)}</details></div><aside class="deal-summary" aria-live="polite"><h3>Antes de comprometerte</h3><div id="deal-preview"></div><p class="fine-print">La autonomía es orientativa: no incluye compras, inscripciones, reparaciones ni premios futuros.</p></aside></div><div class="modal-actions"><button class="secondary" data-action="close">Volver al mercado</button><button type="submit" class="primary" ${U.blocked(n?.cooldown > s.day ? `La negociación está en pausa tras los rechazos. Vuelve el ${U.date(n.cooldown)}; faltan ${n.cooldown - s.day} días.` : "")}>Enviar oferta</button></div></form></div>`,
        true,
      );
      const form = document.getElementById("negotiate-form");
      form.elements.months.value = String(n?.months || 1);
      this.bind(A, form, d, false);
    },
    staffNegotiate(A, id) {
      const s = A.state,
        e = s.employees.find((e) => e.id === id && e.status === "available");
      G.assert(e, "Profesional no disponible.");
      G.assert(
        G.player(s).level >= B.staffLevel(s, e),
        `Necesitas nivel empresarial ${B.staffLevel(s, e)}.`,
      );
      const n = s.staffing.negotiations[`${s.playerId}:${id}`],
        salary =
          n?.salary ||
          G.Staff.minimum(s, e, { months: 1, bonus: 0 }, s.playerId);
      U.modal(
        `Contratar a ${U.escape(e.name)}`,
        `<div class="deal-driver"><div class="deal-identity"><div class="deal-staff-level">NV ${G.Professionals.profile(s, id).level}</div><div><span class="eyebrow">${G.Staff.roles[e.role].name}</span><h3>${U.escape(e.name)}</h3><p>Habilidad ${Math.floor(e.skill)} · motivación ${Math.floor(e.motivation)} · estrés ${Math.floor(G.Professionals.profile(s, id).stress)}</p><strong>Referencia: ${cash(salary)}/día</strong></div></div>${n ? `<div class="counter-offer"><b>Contraoferta: ${cash(n.salary)}/día</b><p>${n.cooldown > s.day ? "Vuelve el " + U.date(n.cooldown) : "Puedes aceptarla o presentar otras condiciones."}</p></div>` : ""}<form id="staff-offer-form" data-id="${id}"><div class="deal-layout"><section class="deal-step"><div class="form-row"><label class="form-field"><span>Sueldo diario ($)</span><input name="salary" type="number" min="10" max="5000" value="${salary}" required></label><label class="form-field"><span>Duración</span><select name="months">${durations(s)}</select></label></div><label class="form-field"><span>Prima al firmar ($)</span><input name="bonus" type="number" min="0" max="2000" value="${n?.bonus || 0}" required></label><p class="fine-print">Se exige caja para la prima y siete jornadas de salario. El sueldo se cobra cada día. Rescindir cuesta un mes de sueldo más obligaciones pendientes.</p></section><aside class="deal-summary"><h3>Coste y margen de caja</h3><div id="deal-preview" aria-live="polite"></div></aside></div><div class="modal-actions"><button class="secondary" data-action="close">Retirarse</button><button class="primary" type="submit" ${U.blocked(n?.cooldown > s.day ? `La negociación está en pausa tras los rechazos. Vuelve el ${U.date(n.cooldown)}; faltan ${n.cooldown - s.day} días.` : "")}>Presentar oferta</button></div></form></div>`,
        true,
      );
      const form = document.getElementById("staff-offer-form");
      form.elements.months.value = String(n?.months || 1);
      this.bind(A, form, e, true);
    },
    bind(A, form, person, staff) {
      const update = () => {
        const salary = Number(form.elements.salary.value),
          bonus = Number(form.elements.bonus.value),
          months = Number(form.elements.months.value),
          current = G.Companies.monthly(A.state, A.state.playerId) / 30,
          newDaily = current + salary,
          cashAfter = G.player(A.state).balance - bonus;
        let floor;
        if (staff)
          floor = G.Staff.minimum(
            A.state,
            person,
            { months, bonus },
            A.state.playerId,
          );
        else {
          const terms = G.Contracts.driverTerms(A.state, months, {
            role: form.elements.contractRole.value,
            winBonus: Number(form.elements.winBonus.value),
            releaseMonths: Number(form.elements.releaseMonths.value),
            promiseShare: Number(form.elements.promiseShare.value),
            renewalOption: form.elements.renewalOption.checked,
          });
          floor = G.Contracts.salaryMinimum(person, months, bonus, terms);
        }
        document.getElementById("deal-preview").innerHTML =
          `<div><span>Pagas hoy</span><b>${cash(bonus)}</b></div><div><span>Este sueldo cada día</span><b>${cash(salary)}</b></div><div><span>Este sueldo en 30 días</span><b>${cash(salary * 30)}</b></div><div><span>Saldo tras la prima</span><b>${cash(cashAfter)}</b></div><div><span>Gasto diario previsto del equipo</span><b>${cash(newDaily)}</b></div><div><span>Autonomía aproximada</span><b>${Math.max(0, Math.floor(cashAfter / Math.max(1, newDaily)))} días</b></div><p class="deal-verdict ${salary < floor ? "negative" : "positive"}">${salary < floor ? `Propuesta inferior al mínimo actual (${cash(floor)}/día). El representante puede rechazarla.` : `La cifra cubre la expectativa actual de ${cash(floor)}/día.`}</p>`;
      };
      form.addEventListener("input", update);
      form.addEventListener("change", update);
      update();
    },
    action(A, name, data) {
      if (name !== "deal-rate") return false;
      const input = document.querySelector('#negotiate-form [name="salary"]');
      if (input) {
        input.value = data.value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return true;
    },
  });
  const card = U.driverCard;
  U.driverCard = function (d, ...args) {
    let html = card.call(this, d, ...args);
    const s = G.App.state;
    if (B.enabled(s)) {
      const need = B.driverLevel(d);
      html = html.replace(
        "</article>",
        `<p class="driver-stage-note">${d.companyId ? "Sueldo cobrado cada jornada" : `Nivel empresarial ${need} · ${d.age < 23 ? "joven en formación" : d.experience > 8 ? "trayectoria experimentada" : "progresión local"}`}</p></article>`,
      );
    }
    return html;
  };
  const finance = U.finance;
  U.finance = function (s) {
    let html = finance.call(this, s);
    if (!B.enabled(s)) return html;
    html = html.replaceAll("$12,000", "$4,200").replaceAll("$360", "$420");
    const salary =
      G.ownedDrivers(s).reduce((n, d) => n + d.contract.salary, 0) +
      G.Staff.owned(s).reduce((n, e) => n + e.contract.salary, 0);
    return (
      `<div class="context-banner"><div><strong>Sueldos actuales: ${cash(salary)}/día</strong><p>Se cobran al avanzar. La proyección de 30 días ayuda a prever caja; no retrasa el pago.</p></div></div>` +
      html
    );
  };
  const update = U.updateRace;
  U.updateRace = function (s) {
    update.call(this, s);
    const r = s.race;
    if (!r?.dynamicsVersion) return;
    const a = r.entrants.find((a) => a.companyId === s.playerId);
    if (!a) return;
    let box = document.getElementById("racecraft-status");
    if (!box) {
      box = document.createElement("div");
      box.id = "racecraft-status";
      box.className = "racecraft-status";
      document.getElementById("live-telemetry")?.append(box);
    }
    const intent = a.dnf
      ? "Retirado de la prueba"
      : a.finishTime !== null
        ? "Bandera a cuadros"
        : a.pit.phase === "box"
          ? "Detenido para el servicio de boxes"
          : ["entry", "exit"].includes(a.pit.phase)
            ? "Respeta el carril y el límite de boxes"
            : a.brain.intent;
    box.innerHTML = `<b>${U.escape(intent)}</b><span>Fatiga ${Math.round(a.fatigue)} · ${Math.round(a.tires)} % de gomas · estimación ${G.Rubber.estimate(a, a.compound, r.track, r.weather.wetness)} vueltas hasta el umbral de cambio</span>`;
  };
})();
