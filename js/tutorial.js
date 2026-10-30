"use strict";
(() => {
  const G = RCS,
    KEY = "rcs.tutorial.v1",
    labels = {
      hq: "Sede",
      finance: "Finanzas",
      team: "Pilotos",
      garage: "Garaje",
      workshop: "Taller",
      staff: "Personal",
      operations: "Operaciones y salud",
      practice: "Entrenamiento",
      research: "Investigación",
      competition: "Competiciones",
      facilities: "Instalaciones",
      market: "Mercado",
      auctions: "Subastas",
      contracts: "Patrocinios y crédito",
      companies: "Rivales",
      news: "Noticias",
      history: "Archivo",
    };
  const steps = [
    {
      id: "start",
      title: "Empieza con un plan",
      short: "Dinero y calendario",
      icon: "home",
      views: ["hq", "finance"],
      intro:
        "Tú diriges la compañía; el piloto conduce. Esta visita solo muestra pantallas: no gasta dinero ni pasa días.",
      tips: [
        "Mira tu caja antes de decidir. Los sueldos y gastos se cobran al avanzar jornadas.",
        "Avanzar día hace progresar trabajos, formación, contratos y calendario. Las carreras pendientes detienen el avance.",
        "Puedes omitir la guía y volver a consultarla en Partidas y opciones → Cómo jugar.",
      ],
      more: "Una partida nueva comienza con 4200 US$ y un utilitario usado. Reserva dinero para inscripción, gomas, reparaciones y nóminas; gastar todo en fichajes puede dejarte sin poder competir. Puedes editar el nombre y el logotipo desde Finanzas.",
    },
    {
      id: "drivers",
      title: "Elige a tu piloto",
      short: "Pilotos y contratos",
      icon: "team",
      views: ["team"],
      intro:
        "La valoración orienta; sus habilidades, edad, experiencia, carácter y estado influyen de verdad al conducir.",
      tips: [
        "Revisa el CV y negocia sueldo, duración, primas y cláusulas. Empiezas con candidatos modestos.",
        "El contrato debe cubrir el día de carrera. Firmar, renovar o despedir tiene costes.",
        "Descansa cuando haya fatiga o estrés. Un médico ayuda con las lesiones.",
      ],
      more: "Ritmo, control, frenada, atención y resistencia cambian velocidad, decisiones y errores. Los CV libres se renuevan cada siete días: más nivel empresarial y prestigio atraen mejores candidatos. El ojeador añade descubrimientos e informes de potencial con una precisión indicada; puede equivocarse. Un piloto contratado conserva su contrato.",
    },
    {
      id: "car",
      title: "Mantén y prepara el coche",
      short: "Garaje y taller",
      icon: "tool",
      views: ["workshop", "garage"],
      intro:
        "El estado de cada componente importa. Una pieza potente no arregla por sí sola un coche desgastado.",
      tips: [
        "Pulsa una zona del coche y compara piezas. Puedes alternar vista lateral y superior sin comprar nada.",
        "Motor, frenos y llantas deben ser compatibles con chasis, carrocería y refrigeración.",
        "Montar y reparar cuesta dinero y días. La pieza sustituida vuelve al almacén con su desgaste.",
      ],
      more: "En Garaje consultas el estado y el historial. En Taller → Mantenimiento reparas sistemas concretos; el diagnóstico profesional requiere mecánico y puede ser imperfecto. Las marcas y compuestos de neumáticos cambian agarre, duración y precio. El almacén y las bahías tienen capacidad limitada. El catálogo recibe 64 novedades cada siete días; conserva recambios básicos y nunca retira las piezas que ya compraste.",
    },
    {
      id: "staff",
      title: "Tu equipo también necesita cuidados",
      short: "Especialistas",
      icon: "team",
      views: ["staff", "operations"],
      intro:
        "Cada especialista tiene nivel, sueldo, motivación y estrés. Más nivel mejora su trabajo y suele costar más.",
      tips: [
        "Contrata según una necesidad real; no necesitas cubrir todos los puestos al empezar.",
        "Da descansos y atiende aumentos y conflictos. Pueden perder motivación o marcharse a la competencia.",
        "Las habilidades del personal afectan al taller, los boxes, la formación y las decisiones del piloto.",
      ],
      more: "Mecánico e ingeniero: diagnóstico, ajuste, mantenimiento y servicio de boxes, con distinta especialización. Estratega: decisiones y paradas automáticas, con ayuda al estrés. Entrenador: formación. Ojeador: CVs e informes imperfectos. Médico: lesiones y recuperación. Gerente: delegación. Investigador: proyectos tecnológicos del árbol.",
    },
    {
      id: "development",
      title: "Mejora sin quemar a tu piloto",
      short: "Entrenar e investigar",
      icon: "research",
      views: ["practice", "research"],
      intro:
        "Entrenar e investigar son inversiones por jornadas. La animación no concede progreso por dejarla abierta.",
      tips: [
        "Elige piloto, entrenador, coche y programa. Consulta días, coste y riesgo antes de reservarlos.",
        "El esfuerzo excesivo eleva estrés y riesgo de lesión o accidente. Al terminar recibes un informe.",
        "Un investigador contratado abre el árbol: mejoras pequeñas y permanentes. Más nivel reduce algo el coste y los días.",
      ],
      more: "Un piloto y entrenador menos preparados suelen necesitar más días. Puedes trabajar Velocidad, Control, Frenada, Consistencia, Adelantamiento o Defensa. Adelantamiento también ejercita Frenada; Defensa también ejercita Concentración. La previsión estima la mejora del atributo elegido; el informe muestra ganancias, aprendizaje y posibles pérdidas o incidentes. Los investigadores cobran sueldos altos y los últimos proyectos siguen siendo caros y largos. Si la pestaña aparece bloqueada, indica qué profesional falta.",
    },
    {
      id: "events",
      title: "Empieza en la competición adecuada",
      short: "Ligas y temporadas",
      icon: "flag",
      views: ["competition"],
      intro:
        "Consulta la ficha de cada prueba: fecha, tasa, circuito, requisitos y premios. Inscribirse compromete coche y piloto.",
      tips: [
        "En partidas nuevas, comienza en la calle: entrada desde 220 US$ y daños que tendrás que pagar.",
        "La licencia profesional requiere 24 puntos callejeros y 900 US$. Es obligatoria para Regional y Nacional; la Nacional exige además 12 puntos regionales.",
        "Callejera, Regional y Nacional tienen puntos separados. Cada final pide los de su propia liga; al cerrar el año se archiva la temporada.",
      ],
      more: "Hay circuitos con distinta dificultad y acceso por copa. El atlas agrupa las pistas por país y permite ver solo las de tu temporada. Al abrir el siguiente año se renuevan las veinte sedes, incluidas las finales; el calendario antiguo se conserva hasta cerrar su temporada. Se comprueban potencia, estado, licencia, contrato y habilidad del piloto. En la calle se permiten contactos; las pruebas profesionales sancionan maniobras evitables. Solo el podio de la gran final regional o nacional concede trofeos y reputación extra; se guardan en Vitrina de trofeos. Una carrera normal no entrega copa. Si cargas una empresa antigua, conserva el reglamento que indica su ficha.",
    },
    {
      id: "race",
      title: "Dirige desde el muro",
      short: "Carreras y boxes",
      icon: "flag",
      views: ["competition"],
      intro:
        "Durante la carrera, tu piloto decide según sus habilidades y la situación. Tú das órdenes y gestionas las paradas.",
      tips: [
        "Atacar gana ritmo con más riesgo y desgaste; Conservar protege el coche y los neumáticos.",
        "Vigila gomas, combustible, clima, temperatura y daños. Pide boxes con tiempo; cada equipo tiene su puesto.",
        "El mecánico puede hacer el servicio. Sin él, o si falla, tendrás que resolver el cambio manual mientras los demás siguen.",
      ],
      more: "El cambio manual exige elevar el coche, seleccionar cada rueda, aflojar sus tornillos, quitarla, colocar la nueva, apretar y bajar el coche. Completa las cuatro ruedas. El nivel y la rapidez del personal cambian el servicio; el estratega puede ayudar a decidir. Las órdenes y los boxes comparten el muro junto a la pista. Comprueba el plan aplicado: enviar una orden no equivale a que el piloto la haya entendido; concentración, equipo, disciplina y estrés afectan a su respuesta. La bandera amarilla puede impedir atacar. En carreras nuevas, Entiende su conducción explica el tiempo cedido por piloto, coche, gomas o tráfico, las maniobras y los errores. El interior acorta el recorrido; el exterior permite conservar más velocidad con más distancia. Control permite aprovechar las curvas dentro del agarre disponible. Puedes pausar, cambiar velocidad y cámara y consultar la repetición al terminar.",
    },
    {
      id: "growth",
      title: "Crece y delega con límites",
      short: "Instalaciones y gestión",
      icon: "home",
      views: ["facilities", "operations"],
      intro:
        "Tu única sede crece contigo. Las obras y los objetivos permiten aumentar capacidades y avanzar de nivel empresarial.",
      tips: [
        "Amplía garaje, taller y otras instalaciones: cada obra tiene coste, plazo y efecto concreto.",
        "Los diez niveles empresariales se ganan con objetivos. Una mala situación también puede provocar descenso.",
        "Delega mantenimiento, compras o formación mediante políticas y presupuestos. Revisa qué se ejecutó.",
      ],
      more: "Las reparaciones, modificaciones y encargos de clientes comparten bahías y profesionales. Las oficinas y capacidades limitan contratación e inventario. En Operaciones puedes configurar políticas, pausarlas y revisar gastos; los tratamientos médicos necesitan un médico y reservan los recursos indicados.",
    },
    {
      id: "market",
      title: "Compra con cabeza; puja con límite",
      short: "Mercado y subastas",
      icon: "market",
      views: ["market", "auctions"],
      intro:
        "El mercado es compartido con los rivales. Las subastas ofrecen piezas exclusivas, carrocerías y coches preparados para economías más avanzadas.",
      tips: [
        "Inspecciona estado, compatibilidad, precio y plazas libres antes de comprar. Puedes vender tus propias unidades.",
        "En subasta, cada puja reinicia diez segundos; la última gana. Retirarte no cancela una oferta que siga siendo la más alta.",
        "Puedes consignar coches y piezas libres: recibes el 80 % si se venden. Los lotes de la casa cambian cada siete días.",
      ],
      more: "El concesionario ofrece modelos actuales a 0 km y estado completo, más caros que un usado. Observar una subasta es gratis. Sus postores tienen intereses y dinero propios: a veces hay una ganga y otras se paga demasiado. El dinero y la plaza de una oferta ganadora quedan comprometidos. Una pieza adjudicada va al almacén y se monta aparte; un coche preparado conserva sus piezas. Los objetos consignados quedan bloqueados hasta su venta o retirada.",
    },
    {
      id: "business",
      title: "Protege la economía de tu empresa",
      short: "Acuerdos y rivales",
      icon: "finance",
      views: ["contracts", "finance", "companies"],
      intro:
        "Los ingresos deportivos no están garantizados. Revisa obligaciones antes de aceptar dinero o comprometer gastos diarios.",
      tips: [
        "Los patrocinadores y fabricantes pueden exigir resultados, piezas o un piloto. Cumplir las condiciones permite cobrar.",
        "Los préstamos se devuelven con intereses. Revisa cuotas, nóminas y previsión de caja; el descubierto tiene un margen de recuperación limitado.",
        "Los rivales compran, contratan, entrenan y gastan sus propios recursos. Sus decisiones cambian el mercado y la parrilla.",
      ],
      more: "Finanzas registra movimientos reales y permite aceptar encargos de taller, que necesitan días y comparten bahías. También ofrece tres tipos de encargos de apoyo semanales: pagan entre 110 y 270 US$ solo al entregarlos, con un límite de uno cada siete días. Algunos ocupan una bahía o un ingeniero. Son una ayuda y los salarios siguen corriendo. Las promesas y cláusulas de pilotos y patrocinio tienen consecuencias al incumplirse. En partidas actuales, catorce días seguidos de problemas de liquidez pueden terminar la actividad de la compañía.",
    },
    {
      id: "history",
      title: "Tu primera decisión ya es tuya",
      short: "Guardar y seguir",
      icon: "news",
      views: ["news", "history", "hq"],
      intro:
        "Ya conoces el recorrido. Empieza por un piloto asequible, revisa el coche y prepara una primera carrera que puedas pagar.",
      tips: [
        "Noticias enlaza con operaciones y acontecimientos reales. El archivo conserva temporadas, resultados y trayectoria.",
        "Hay cinco ranuras y guardado automático. Exportar JSON permite conservar y trasladar la partida.",
        "Esta guía no volverá a salir automáticamente al terminar u omitirla. Puedes abrirla desde Partidas y opciones → Cómo jugar.",
      ],
      more: "Aprende primero a cubrir nóminas, competir y mantener el coche. Después amplía instalaciones, especialistas y proyectos. Exportar es especialmente útil para cambiar de navegador o equipo; cada navegador mantiene sus propias partidas locales.",
    },
  ];
  const T = (G.Tutorial = {
    steps,
    KEY,
    active: false,
    eligible: false,
    memory: null,
    step: 0,
    view: null,
    mode: "auto",
    frame: null,
    read() {
      if (this.memory) return this.memory;
      const records = [];
      let invalid = false;
      for (const name of ["localStorage", "sessionStorage"]) {
        try {
          const raw = window[name].getItem(KEY);
          if (!raw) continue;
          const r = JSON.parse(raw);
          if (
            r?.version === 1 &&
            ["pending", "done", "skipped", "returning"].includes(r.status) &&
            (r.revision === undefined ||
              (Number.isInteger(r.revision) && r.revision >= 0)) &&
            (r.status !== "pending" ||
              (Number.isInteger(r.step) &&
                r.step >= 0 &&
                r.step < steps.length &&
                Number.isInteger(r.seed) &&
                Number.isInteger(r.slot) &&
                r.slot >= 1 &&
                r.slot <= 5))
          )
            records.push(r);
          else invalid = true;
        } catch {
          /* Una preferencia inaccesible no bloquea la partida. */
        }
      }
      records.sort((a, b) => (b.revision || 0) - (a.revision || 0));
      return (this.memory =
        records[0] || (invalid ? { version: 1, status: "returning" } : null));
    },
    write(r) {
      const record = { ...r, revision: (this.memory?.revision || 0) + 1 };
      this.memory = record;
      for (const name of ["localStorage", "sessionStorage"]) {
        try {
          window[name].setItem(KEY, JSON.stringify(record));
        } catch {
          /* Si falla un almacén, conserva el otro y la sesión actual. */
        }
      }
    },
    prepare() {
      this.eligible = !this.read();
      if (this.eligible && G.Storage.list().some((s) => !s.empty && !s.error)) {
        this.write({ version: 1, status: "returning" });
        this.eligible = false;
      }
    },
    busy(s) {
      return (
        !!s &&
        (!!s.race ||
          G.Auctions.active(s) ||
          (!!G.Practice.active(s) && !G.Practice.active(s).calendarVersion))
      );
    },
    onState(app, created = false) {
      if (this.active) this.detach();
      const r = this.read();
      if (r?.status === "pending") {
        if (
          r.slot === app.slot &&
          r.seed === app.state.seed &&
          !this.busy(app.state)
        ) {
          this.begin(app, r.step, "auto");
        } else this.write({ version: 1, status: "skipped" });
        return;
      }
      if (!created && !r) {
        this.eligible = false;
        this.write({ version: 1, status: "returning" });
      }
    },
    offer(app) {
      if (!this.eligible || this.read() || !app.state || this.busy(app.state))
        return;
      this.eligible = false;
      this.write({
        version: 1,
        status: "pending",
        slot: app.slot,
        seed: app.state.seed,
        step: 0,
      });
      this.begin(app, 0, "auto");
    },
    begin(app, step = 0, mode = "manual") {
      if (!app.state || this.busy(app.state)) {
        G.UI.toast(
          "Termina la carrera, subasta o práctica en directo antes de abrir la guía.",
        );
        return;
      }
      app.close();
      this.returnView = app.view;
      this.returnScroll = window.scrollY;
      this.mode = mode;
      this.step = step;
      this.view = steps[step].views[0];
      this.active = true;
      const root = document.getElementById("app");
      this.previousInert = root.inert;
      this.previousHidden = root.getAttribute("aria-hidden");
      root.inert = true;
      root.setAttribute("aria-hidden", "true");
      document.body.classList.add("tutorial-open");
      this.navigate(app);
    },
    navigate(app) {
      app.view = this.view;
      app.render();
      document.getElementById("tutorial-next")?.focus({ preventScroll: true });
    },
    saveStep(app) {
      if (this.mode === "auto")
        this.write({
          version: 1,
          status: "pending",
          slot: app.slot,
          seed: app.state.seed,
          step: this.step,
        });
    },
    action(app, name, data) {
      if (typeof name !== "string" || !name.startsWith("tutorial-"))
        return false;
      if (name === "tutorial-open") {
        if (!this.active) this.begin(app, 0, "manual");
        return true;
      }
      if (!this.active) return true;
      if (name === "tutorial-skip") {
        this.finish(app, "skipped");
        return true;
      }
      if (name === "tutorial-next" && this.step === steps.length - 1) {
        this.finish(app, "done");
        return true;
      }
      if (name === "tutorial-pilot") {
        this.finish(app, "done", "team");
        return true;
      }
      if (
        name === "tutorial-view" &&
        steps[this.step].views.includes(data.view)
      ) {
        this.view = data.view;
        this.navigate(app);
        return true;
      }
      let next = this.step;
      if (name === "tutorial-next") next++;
      if (name === "tutorial-back") next--;
      if (name === "tutorial-topic") next = Number(data.step);
      if (Number.isInteger(next) && next >= 0 && next < steps.length) {
        this.step = next;
        this.view = steps[next].views[0];
        this.saveStep(app);
        this.navigate(app);
      }
      return true;
    },
    detach() {
      this.active = false;
      cancelAnimationFrame(this.frame);
      document.getElementById("tutorial-root")?.replaceChildren();
      document.body.classList.remove("tutorial-open");
      const root = document.getElementById("app");
      root.inert = this.previousInert || false;
      if (this.previousHidden === null || this.previousHidden === undefined)
        root.removeAttribute("aria-hidden");
      else root.setAttribute("aria-hidden", this.previousHidden);
    },
    finish(app, status, target = null) {
      if (this.mode === "auto") this.write({ version: 1, status });
      const view = this.returnView || "hq",
        y = this.returnScroll || 0;
      this.detach();
      app.view = view;
      app.render();
      if (target) {
        app.go(target);
        document.querySelector(".page h1")?.setAttribute("tabindex", "-1");
        document.querySelector(".page h1")?.focus({ preventScroll: true });
      } else {
        window.scrollTo(0, y);
        document
          .querySelector('.rail [aria-current="page"]')
          ?.focus({ preventScroll: true });
      }
    },
    paint() {
      if (!this.active) return;
      const U = G.UI,
        s = steps[this.step],
        last = this.step === steps.length - 1;
      document.getElementById("tutorial-root").innerHTML =
        `<div class="tutorial-layer"><div class="tutorial-blocker"></div><div class="tutorial-spotlight" aria-hidden="true"></div><section class="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" aria-describedby="tutorial-intro"><header><span class="tutorial-brand">R<span>//</span>C <small>GUÍA DE INICIO</small></span><button class="text-button" data-action="tutorial-skip">${this.mode === "auto" ? "Omitir tutorial" : "Cerrar guía"}</button></header><div class="tutorial-progress"><span>Paso ${this.step + 1} de ${steps.length}</span><b>${s.short}</b></div><div class="tutorial-progress-track" role="progressbar" aria-label="Progreso de la guía" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${this.step + 1}"><i style="width:${((this.step + 1) / steps.length) * 100}%"></i></div><div class="tutorial-body"><div class="tutorial-title-row"><span>${U.icon(s.icon)}</span><h2 id="tutorial-title">${s.title}</h2></div><p id="tutorial-intro">${s.intro}</p><ul>${s.tips.map((t) => `<li>${t}</li>`).join("")}</ul><div class="tutorial-view-links" aria-label="Pantallas de este paso">${s.views.map((v) => `<button data-action="tutorial-view" data-view="${v}" aria-pressed="${this.view === v}" class="${this.view === v ? "selected" : ""}">${labels[v]} ${U.icon("arrow")}</button>`).join("")}</div><details class="tutorial-more"><summary>Un poco más de detalle</summary><p>${s.more}</p></details><details class="tutorial-topics"><summary>Ir a un tema</summary><div>${steps.map((t, i) => `<button data-action="tutorial-topic" data-step="${i}" aria-current="${i === this.step ? "step" : "false"}"><span>${String(i + 1).padStart(2, "0")}</span>${t.short}</button>`).join("")}</div></details>${last ? '<div class="tutorial-finish-note">Listo para empezar: contrata un piloto, revisa el coche y consulta tu primera prueba.</div>' : ""}</div><footer>${last ? '<button class="secondary" data-action="tutorial-pilot">Buscar un piloto</button>' : `<button class="secondary" data-action="tutorial-back" ${this.step === 0 ? "disabled" : ""}>Anterior</button>`}<button class="primary" id="tutorial-next" data-action="tutorial-next">${last ? "Empezar a jugar" : "Siguiente"} ${U.icon("arrow")}</button></footer></section></div>`;
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.position());
    },
    position() {
      if (!this.active) return;
      const card = document.querySelector(".tutorial-dialog"),
        spot = document.querySelector(".tutorial-spotlight");
      if (!card || !spot) return;
      const mobile = window.innerWidth < 720;
      let target =
        this.view === "workshop"
          ? document.querySelector(".wb-stage-panel")
          : this.view === "hq"
            ? document.querySelector(".topbar .advance")
            : !mobile
              ? document.querySelector(`.rail [data-go="${this.view}"]`)
              : null;
      target ||= document.querySelector(".page-heading");
      if (!target) {
        spot.hidden = true;
        return;
      }
      let r = target.getBoundingClientRect();
      if (mobile && r.top > 100) {
        window.scrollBy(0, r.top - 18);
        r = target.getBoundingClientRect();
      }
      const bounds = card.getBoundingClientRect(),
        left = Math.max(8, r.left - 5),
        top = Math.max(8, r.top - 5),
        right = Math.min(innerWidth - 8, r.right + 5),
        bottom = Math.min(
          innerHeight - 8,
          r.bottom + 5,
          mobile ? bounds.top - 12 : innerHeight - 8,
        );
      if (right - left < 20 || bottom - top < 20) {
        spot.hidden = true;
        return;
      }
      spot.hidden = false;
      Object.assign(spot.style, {
        left: left + "px",
        top: top + "px",
        width: right - left + "px",
        height: bottom - top + "px",
      });
    },
  });
  window.addEventListener("resize", () => {
    if (T.active) {
      cancelAnimationFrame(T.frame);
      T.frame = requestAnimationFrame(() => T.position());
    }
  });
  document.addEventListener(
    "toggle",
    (e) => {
      if (T.active && e.target.closest("#tutorial-root")) {
        cancelAnimationFrame(T.frame);
        T.frame = requestAnimationFrame(() => T.position());
      }
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (!T.active) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        T.finish(G.App, "skipped");
        return;
      }
      if (e.key === "Tab") {
        const nodes = [
            ...document.querySelectorAll(
              ".tutorial-dialog button:not(:disabled),.tutorial-dialog summary",
            ),
          ].filter((el) => el.getClientRects().length),
          first = nodes[0],
          last = nodes.at(-1);
        if (
          !document
            .querySelector(".tutorial-dialog")
            ?.contains(document.activeElement)
        ) {
          e.preventDefault();
          first?.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    true,
  );
})();
