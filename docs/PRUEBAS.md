# Corrección 0.17.1

24 escenarios específicos de Gran Serie y su recorrido de navegador comprobados. Se añadieron verificaciones del desgaste de refrigeración/aerodinámica, conservación de la física anterior sin marcador de desgaste, preparación de la categoría activa, exceso nominal de potencia tras reparar y gasto anual persistente de subastas con rechazo de datos corruptos. La suite completa de 471 escenarios y los 25 recorridos de la entrega 0.17 permanecen como referencia anterior.

La temporada financiera vuelve a completar veinte fechas y abre 2027 con licencia, entrenamiento, investigación y **6.608 US$**, sin dinero ni atributos inyectados. Las cinco parrillas nacionales conservan **seis equipos**; los equipos pagan sus mejoras, subastas y obligaciones con su propio presupuesto. [Registro 0.17.1](BALANCE_0_17_1_1470.json).

# Validación 0.17.0

**471/471 escenarios de motor y 25 recorridos de navegador aprobados**, incluidos 22 escenarios nuevos de Gran Serie. Sintaxis de 149 archivos JS/CJS y 96 recursos locales verificados. Las fixtures anteriores se mantienen.

`grand-tour.test.cjs` comprueba 60 modelos en diez familias, las 192 referencias y sus dieciséis alojamientos, coste real y dificultad inicial, variedad de monoplazas, compatibilidad y compra/montaje por días, efecto en la física sin acumulación, tasas/premios crecientes, selección anual bloqueada, verificación de piloto/plataforma, seis equipos con contratos y cuatro coches, preparación rival dentro de la categoría, reposición, persistencia y rechazo de plataformas falsificadas. Ejecuta carreras completas de GT, Prototipos y Fórmula, con seis participantes y liquidación real. Simula treinta renovaciones semanales de subastas para comprobar que sus preparaciones son compatibles. La migración de un coche modificado mantiene su configuración. Una carrera auténtica creada con el código original 0.16 reproduce el SHA-256 de todo el estado terminado; la procedencia del ZIP se documenta en `fixtures/v160-expected.json`.

`browser-grand-tour.cjs` completa compra de monoplaza, comparación y montaje con coste/plazo, vistas superior y lateral, los seis filtros, selección nacional y una transmisión física con seis monoplazas. Captura 1440/800/390 y comprueba ausencia de errores y desbordamientos. La caja se controla únicamente en las pruebas de compra de alto nivel; no se presenta como balance económico. Los recorridos actuales del taller y comercio se adaptan a las 285 referencias; el del taller avanza el calendario para no retroceder por debajo de contratos ya firmados.

La temporada financiera de la semilla 1470 completa las veinte fechas, conserva la licencia y abre 2027. Tras renovar al piloto, pagar entrenamiento de seis días e investigación de ocho, mantiene **6.608 US$** desde los 4.200 iniciales, sin financiación ni atributos inyectados. Las clasificatorias regionales conservan de tres a cinco participantes y las cinco fechas nacionales tienen **6/6/5/5/4**. El jugador evita las pruebas para las que no reúne condiciones. Esta ruta demuestra supervivencia y actividad rival de esa semilla, no el equilibrio de todas las decisiones. [Registro](BALANCE_0_17_1470.json) · [Reglas de Gran Serie](GRAN_SERIE_0_17.md).

# Validación 0.16.0

**449/449 escenarios de motor y 24 recorridos de navegador aprobados.** Sintaxis de 142 archivos JS/CJS, 91 recursos locales y `git diff --check` verificados. La suite nueva de veinte escenarios se repitió después de los últimos ajustes de telemetría/validación, con 20/20 aprobados. Las fixtures históricas permanecen intactas.

`driver-world.test.cjs` comprueba migración sin cambios de caja/contratos/RNG, 108 nombres y efectos nuevos, diversidad de asignaciones, ojeador requerido, una práctica real que atraviesa una jornada de carrera sin competir, noticias y lectura persistente, las noventa y seis condiciones, Motivador sin regeneración ni efecto sobre pinchazo, impulso único de Mal perdedor, contrapartida de Testarudo, Drifting a Control 45 con límite de lluvia, Tramposo y prioridad de órdenes/banderas, contacto físico con sanción profesional, pinchazo obligatorio al cero, desaceleración y límite en pista/boxes, eliminación al montar gomas sanas, previsión y aprendizaje real, programas rivales pagados e idempotentes, compra física de piezas, guardado exacto y rechazo de datos corruptos. Una fixture ejecutada con el código original 0.15 (`e5c30e58dc3ffdb2dd9b05fd4238279cdb615aa0`) conserva resultados y SHA-256 exactos de todo el estado terminado.

`browser-driver-world.cjs` verifica el perfil oculto y la orientación neutral sin ojeador, su revelación tras contratarlo, oferta y contrato reales, las 108 entradas y ficha de habilidad, programa por días, ausencia de ventana de carrera, permanencia en el campus, simulación rival al avanzar y cero salidas del piloto del jugador, informe antes/después, distintivo de noticias, lectura/recarga, exclusión de noticias antiguas, rivales y pinchazo real. Revisa equipo/campus/compañías/diario en 1440/1024/390 y captura el aviso de pinchazo móvil. Caja y asignación Autónoma se controlan para aislar interfaz; no se presentan como balance. Las rutas actuales de competición abren voluntariamente la ficha tras llegar a la fecha; la ruta informada de negociación contrata su ojeador.

La temporada financiera de la semilla 1470 completa veinte fechas, abre 2027, obtiene la licencia, paga mantenimiento, gomas, nóminas, renovaciones, entrenador, programa de seis días e investigación de ocho. Conserva **6.848 US$** desde los 4.200 iniciales, sin financiación ni atributos inyectados. El programa gana **+0,702634** Control frente a +0,140527 de la tasa anterior. Los rivales desarrollan pilotos y gastan en su propia preparación; la ruta conserva parrillas callejeras y regionales ordinarias. La estrategia evita pruebas para las que no reúne requisitos y no usa ingresos nuevos de apoyo. Demuestra esa ruta, no el equilibrio de todas las decisiones/semillas. [Registro](BALANCE_0_16_1470.json) · [reglas](PILOTOS_Y_AGENDA_0_16.md) · [108 habilidades](HABILIDADES_0_16.md).

# Validación 0.15.0

**429/429 escenarios de motor y 23 recorridos de navegador aprobados.** Se comprobaron 136 archivos JS/CJS, 87 recursos locales y `git diff --check`. Las diecinueve pruebas nuevas de conducción/compatibilidad se repitieron tras los últimos ajustes, con 19/19 aprobadas. Se conservan los escenarios y fixtures anteriores.

`skills.test.cjs` cubre migración sin alterar dinero/contratos/puntos/RNG, incremento continuo de Control, comparación de velocidades y techo físico independiente, tiempo de una vuelta real, radio/distancia interior y exterior, coste del desplazamiento lateral, carriles ocupados, preparación y referencias observadas, defensa estable, órdenes/banderas/boxes, errores contextuales y salida sin potencia extra. También comprueba atribución aislada de coche/gomas/conducción/tráfico, reparto sin duplicados, exclusión de neutralización, reanudación exacta con orden pendiente, los dos programas completos por jornadas, datos corruptos, informe real y carreras individuales en pistas fácil/difícil/experta.

`skills-compat.test.cjs` carga una carrera capturada con el código original 0.14 (`7ffe0d8cc8dca224bb72e590c6768dc09987e743`). Termina con sus resultados originales y SHA-256 exacto de todo el estado, y después actualiza la gestión sin modificar los demás datos. Las fixtures históricas permanecen intactas.

`browser-skills.cjs` completa los dos nuevos programas mediante formulario, reserva, jornadas, guardado/recarga e informes. Comprueba que consultar previsión, telemetría o trazada no altera el estado. Revisa causas/gráfica, cámara con preferencia conservada, radio flotante sin duplicados y escritorio/tableta/móvil a 1440/1024/390. Su informe de conducción procede de una carrera completa, y se inspeccionaron capturas de campus, radio e informe móvil. Las condiciones controladas de interfaz/física no se usan como prueba financiera.

La ruta financiera actual completa veinte fechas con 4.200 US$ iniciales, nóminas, contratación/renovación, aumentos, mantenimiento, gomas, licencia y clasificaciones reales. Abre 2027, paga un programa de seis jornadas e investigación de ocho y conserva **6.769 US$**, sin inyectar dinero ni habilidades. Renuncia a pruebas que no puede disputar; no utiliza los nuevos encargos de apoyo y no demuestra el equilibrio de todas las semillas o decisiones. [Registro](BALANCE_0_15_1470.json) · [reglas y alcance](CONDUCCION_Y_COMBATE_0_15.md).

# Validación 0.14.0

**410 escenarios de motor y 22 recorridos de navegador aprobados.** Se comprobaron 130 archivos JS/CJS, 84 recursos locales y `git diff --check`. La batería general conserva las fixtures históricas; la suite nueva de dirección se volvió a ejecutar tras el último ajuste de valoración de promesas, sin fallos (17/17).

`director.test.cjs` comprueba migración sin reiniciar dinero/contratos/RNG, personalidad, valoración conjunta de cláusulas, concesiones sin repetir ofertas, pausas por ofertas muy bajas, primas limitadas, aumentos por progresión/resultados, consecuencias del rechazo, vencimiento, renovación con opción firmada, radio con guardado exacto, banderas, duración, consumo/desgaste/errores, criterio al adelantar, carriles ocupados, prioridad manual y continuidad del estratega. Una promesa ya cumplida no se vuelve a usar como descuento de renovación.

`browser-director.cjs` recorre una negociación y contraoferta reales, contratación, petición y negociación de aumento, renovación, transmisión a todo el ancho, modo ampliado, radio flotante sin duplicar formularios, edición sin aplicar, confirmación tras reanudar, recarga de orden pendiente y boxes. Revisa 1440/1024/390, conserva los botones de tiempos durante las actualizaciones y comprueba que la radio móvil cabe íntegra en la ventana. Se inspeccionaron capturas de carrera y contratación. Las otras 21 rutas cubren compatibilidad, taller, personal, entrenamiento, investigación, subastas, tutorial, comercio, atlas y puntos por liga. Las rutas que contrataban directamente aceptan ahora una contrapropuesta real si el piloto la presenta.

La temporada de balance actual utiliza 4.200 US$ iniciales, negocia contratación y renovación, paga mantenimiento, gomas y nóminas, gestiona aumentos y completa 20 eventos sin añadir dinero ni atributos. Obtiene licencia, conserva parrillas callejeras y regionales, abre 2027 y paga entrenador, programa de seis días e investigación de ocho días. Termina activa con **7.976 US$**; no utiliza los ingresos de apoyo nuevos. Es un recorrido conservador de la semilla 1470, no una garantía para cualquier decisión o semilla. [Informe completo](BALANCE_0_14_1470.json).

[Reglas y compatibilidad](DIRECCION_Y_CONTRATOS_0_14.md).

# Validación 0.13.1

**393/393 pruebas de motor aprobadas y siete recorridos de navegador relevantes completados.** Se verificaron 124 archivos JS/CJS, 80 recursos locales y `git diff --check`. No cambian precios, premios, física ni formato de guardado; la comprobación se centra en puntos, licencia, presentación y compatibilidad.

Los siete escenarios nuevos de `league-points.test.cjs` comprueban licencia obtenida exclusivamente con puntos callejeros, pago único sin gastar puntos, bloqueo de Regional/Nacional aun con otros marcadores elevados, inscripción/inicio rechazados antes de cobros o RNG, finales independientes, reinicio anual con licencia/trayectorias conservadas, liquidación de una carrera real guardada sin modificar otras ligas y tablas históricas por copa. La batería general conserva las fixtures y comprobaciones anteriores.

`browser-league-points.cjs` comprueba la sede sin marcador combinado, tres contadores en Competición, falta de puntos callejeros, compra real de licencia, cobro y clasificaciones sin alteración, requisitos nacionales, archivo de un mismo piloto por liga y resultados de una carrera guardada. Revisa 1440/1024/390 sin errores de página ni desbordamiento. Se inspeccionaron capturas de los marcadores y del acceso profesional. Los ejemplos de puntos/archivo usan valores controlados; la liquidación de resultados completa la simulación desde `v110-race.json`.

También pasaron las rutas de competición, atlas, comercio/trofeos, instalaciones/archivo, tutorial y avisos. [Reglas y compatibilidad](LIGAS_Y_LICENCIA_0_13_1.md).

# Validación 0.13.0

**386 escenarios de motor y 20 recorridos de navegador aprobados.** La batería general pasó 385/385; después se añadió el caso de formación diaria/delegada y se verificó la suite de equipo completa (12/12). Tras compartir el cálculo de previsión y aprendizaje se repitieron además desarrollo, compatibilidad de taller y equipo (48/48); el caso de impago de encargos también se comprobó con la liquidación salarial real. Sintaxis de 122 archivos JS/CJS y 80 recursos locales verificados.

Los escenarios nuevos cubren encargos sin dinero/RNG al consultar, pago diferido único, espera semanal/cancelación, reserva real de bahía, ingeniero ocupado/cobertura/impago, mejora de formación del 45 % sin duplicar cuotas ni nóminas, Control con el mismo coche en curva, radio pendiente/confirmación/malentendido/amarilla, decisiones variables por habilidades, guardado determinista y mantenimiento pagado de rivales antes de las copas. Se conservaron las fixtures históricas y sus comprobaciones.

El recorrido nuevo de navegador usa botones y formularios reales para ofertas/entrega/recarga, CV y explicación de atributos, previsión/cierre de formación y muro de órdenes/boxes. Verifica el plan anterior durante una transmisión, respuesta tras reanudar, ataque aplazado por amarilla, persistencia de radio y parada solicitada desde el mismo panel. Se comprobaron 1440/1024/390, bandera dentro del canvas, ausencia de errores de página y de desbordamiento. La telemetría detallada permanece accesible desde su desplegable. Las once primeras regresiones pasaron; tras adaptar la consulta de piezas al desplegable nuevo, se completaron la copa y las ocho rutas restantes.

La temporada de veinte eventos con la conducción nueva abre 2027, conserva la licencia y paga entrenador, programa e investigador con **7733 US$** restantes. Mantiene al menos tres participantes en las rondas regionales ordinarias y al menos cuatro en las callejeras. El programa termina sus seis días y gana 0,140527 puntos de Control. La ruta no utiliza los encargos de apoyo, no inyecta fondos ni atributos y no demuestra el equilibrio de todas las semillas o estilos. [Registro](BALANCE_0_13_1470.json) · [reglas y compatibilidad](EQUIPO_Y_MURO_0_13.md).

# Validación 0.12.1

**374/374 pruebas de motor y 19 recorridos de navegador aprobados.** Se verificaron sintaxis de 115 archivos JS/CJS, presencia de 75 recursos locales y `git diff --check`. La ruta financiera de veinte eventos abre 2027, paga programa e investigación y conserva **6562 US$**, igual que antes de la corrección, sin financiación ni estadísticas artificiales.

Ocho escenarios nuevos en `feedback.test.cjs` cubren tres programas que antes fallaban por temperatura al tercer día y ahora completan sus doce días previstos, bloqueos múltiples con valores/fechas sin cobros ni RNG, fondos y contratos, impago previo/posterior, avería real de neumáticos, lesión temprana y equivalencia de guardado/avance agrupado. La fixture auténtica del programa 0.8 permanece intacta: la comparación exceptúa solo integración térmica/desgaste y prestaciones derivadas, manteniendo fechas, caja, informe y el resto del estado exactos.

`browser-feedback.cjs` verifica con controles reales reserva y confirmación, dos jornadas/recarga/doce jornadas completas, repetición bloqueada con la causa concreta, piloto lesionado visible, entrenador descansando, aviso persistente/cierre, explicación accesible de contratación e inscripción que se habilita al corregir el coche y vuelve a bloquearse por dinero. No aparecen errores de página ni desbordamiento en 1440/390; las regresiones históricas mantienen sus tamaños adicionales. Se inspeccionaron las capturas del campus y los avisos en escritorio/móvil.

La batería completa incluye las 18 rutas anteriores. Tras el ajuste final del texto de gastos también se repitieron los ocho escenarios de avisos. [Reglas y compatibilidad](AVISOS_ENTRENAMIENTO_0_12_1.md).

# Validación 0.12.0

**366/366 pruebas de motor y 18 recorridos de navegador aprobados.** Sintaxis de 112 archivos JS/CJS y presencia de 73 recursos locales verificadas. Se completó la batería anterior y once escenarios de atlas/rotación; se repitieron estos últimos tras reforzar la exclusión de las sedes de una empresa antigua en su primera temporada nueva.

`world-circuits.test.cjs` verifica 68 pistas/13 países, 36 nuevas sedes, categorías/dificultades, cuarenta semillas a lo largo de veinte temporadas sin duplicar ni repetir sedes consecutivas, cobertura completa en cuatro años, tasas/fechas, apertura callejera accesible, transición 0.11 sin modificar el campeonato archivado, persistencia y rechazo de calendarios incoherentes. Las 36 geometrías nuevas completan carreras físicas individuales con piloto experimentado/coche mantenido, desgaste y guardado válido. La fixture `v110-race.json`, capturada con el código original 3012e86, termina con resultados y estado final exactos.

`browser-world-circuits.cjs` añade atlas, filtros combinados, búsqueda/foco, selección de esta temporada/novedades, planos de boxes, tres tamaños, cambio de año mediante el botón real, atlas sin migración de una partida anterior y una carrera en Oporto. El recorrido de desarrollo también construye las 68 escenas y comprueba el atlas ampliado. Se inspeccionaron capturas del atlas, Perú, calendario y carrera en escritorio/móvil.

La ruta financiera actual completa las veinte fechas y abre 2027. Después paga formación e investigación y conserva **6562 US$** sin financiar artificialmente a la empresa. La estrategia renuncia a las pruebas profesionales cuyos requisitos no alcanza; no demuestra el equilibrio de todas las semillas o estilos. [Registro](BALANCE_0_12_1470.json).

# Validación 0.11.0

**Cierre verificado: 355/355 pruebas del motor, 17 recorridos de navegador y temporada financiera de veinte fechas aprobados.** Sintaxis de 106 archivos JS/CJS y presencia de 69 recursos locales comprobadas. Se inspeccionaron las nuevas vistas de catálogo, concesionario y vitrina, también en móvil.

Veinte escenarios nuevos del motor en `commerce.test.cjs`: inicio difícil/reproducible; renovación del día siete sin cambios al leer; cincuenta semanas con 3200 referencias distintas y CV/retratos sin reciclar; stock acotado; conservación de compras, reservas, montajes y consignaciones; reposición y depreciación; compra de concesionario atómica y reventa usada; capacidad de garaje; influencia de nivel/prestigio y salarios; CV caducados/contratados; descubrimientos y descanso del ojeador; doce carrocerías con requisitos; podios regional/nacional, límites de reputación, exclusión de rondas/calle/DNF, persistencia entre temporadas y rechazo de trofeos falsos. Incluye prevalidación del piloto impuesto por patrocinio, carrera con piezas semanales y reanudación exacta, y la entrega de trofeo desde `Race.finish`.

El recorrido `browser-commerce.cjs` utiliza controles reales para comparar piezas sin gastar, renovar el tablón al día siete, alternar nuevo/usado, confirmar una compra, consultar copa y resultado, recargar y comprobar las nuevas pantallas en 1440/1024/390. Compras y podio usan caja/resultado controlados para aislar esos flujos; el tutorial, la primera fundación y las carreras completas continúan en sus rutas específicas.

La ruta financiera actual completa las veinte fechas, paga mantenimiento, gana la licencia, renueva al piloto antes de vencer, abre 2027 y paga entrenador, programa de pista, investigador y protocolo de aprendizaje con **9080 US$** restantes. La empresa no recibe fondos ni estadísticas artificiales. La estrategia prudente renuncia a las pruebas profesionales para las que no reúne piloto/puntos y no compra objetos de lujo durante el primer año. Demuestra supervivencia de esa estrategia y semilla, no equilibrio exhaustivo de todos los caminos. [Registro](BALANCE_0_11_1470.json).

Los constructores anteriores están fijados por versión para mantener comparaciones auténticas. Las regresiones visuales actuales adaptan el nuevo número de elementos de navegación/referencias y seleccionan solo CV vigentes. El tutorial continúa sin ejecutar migraciones ni consumir dinero, días o RNG al visitar las pantallas.

# Validación 0.10.1

**Dieciséis recorridos de navegador aprobados**: las quince regresiones anteriores y el nuevo recorrido del tutorial. Las seis rutas que fundan una empresa omiten la guía con su botón real antes de continuar. El motor y sus reglas no cambian; el registro 0.10 conserva las 335 pruebas anteriores. No se repite la temporada financiera para un cambio de interfaz.

`browser-tutorial.cjs` verifica once escenarios: primera fundación real, fondo sin acciones y foco de teclado, once capítulos/diecisiete pantallas sin modificar ningún campo de la partida, finalización y consulta manual, segunda empresa sin repetición, omisión por botón/Escape, reanudación tras recarga, jugador con guardado previo, ausencia de intervención en una carrera y preferencia de sesión cuando falla la escritura local. Revisa las vistas en 1440×1000, 1024×900, 390×844 y una pantalla de 390×560. Se inspeccionaron capturas de la bienvenida y del taller en móvil; diálogo y controles caben sin desbordamiento horizontal.

El tutorial se recuerda fuera de las ranuras y no altera ni regenera entidades, contratos, inventario, caja, día o RNG. En la prueba manual de una partida anterior tampoco activa el taller visual ni las subastas pendientes. [Detalles de uso y persistencia](TUTORIAL_0_10_1.md).

# Validación 0.10.0

Cierre verificado: **335/335 pruebas del motor**, los catorce recorridos históricos de navegador y el recorrido de subastas, sin errores de página ni desbordamiento en 1440/1024/390. Sintaxis de 96 archivos JS/CJS y 61 recursos locales comprobada. Se conserva la ejecución HTTP; `file://` sigue omitido por la política de Chromium del entorno.

Las veinte pruebas nuevas verifican precio de acceso superior a la caja inicial, lotes exclusivos fuera del catálogo, activación idempotente, reloj y reinicio, ofertas vinculantes, precio obsoleto y puja contra uno mismo, reserva de fondos/plazas, cobro y entrega únicos, piezas/coches preparados reales, comisión del 20 %, retirada y falta de comprador, propiedad externa fuera del stock, presupuesto rival y montaje con sus bahías, reanudación exacta, quince rotaciones con diversidad, gangas y sobreprecios en doce semillas, corrupción y continuidad de Copa Club. Una fixture auténtica 0.9 con carrocería ancha termina con sus resultados y estado completo exactos.

El recorrido `browser-auctions.cjs` funda una empresa y observa con sus **4200 US$**. Después usa caja controlada para comprar y verificar reloj real, guardar/cargar con una oferta pendiente, adjudicación, entrega, montaje, consignación desde formulario, venta por IA con 80 % neto, retirada sin abrir, filtros y tres anchuras. Se inspeccionaron visualmente portada, sala activa, controles móviles, lotes e historial. El recorrido de taller también comprueba integración con el calendario de subastas antes de su salto de fecha controlado.

La ruta `npm run test:balance` usa el constructor 0.10 y simula las veinte fechas, subastas de fondo, nóminas, reparaciones, licencia, formación e investigación. Abre 2027 con **9375 US$**, sin financiar artificialmente la empresa. La ruta prudente no compra objetos de lujo durante ese primer año. [Registro financiero](BALANCE_0_10_1470.json). Las compras y ventas caras se verifican por separado: esta semilla no demuestra equilibrio exhaustivo de todas las estrategias.

`test:balance:v90` conserva la ruta anterior. Las suites históricas fijan sus constructores y catálogo; la suite nueva usa `engine({auctions:true})`. [Reglas y alcance](SUBASTAS_0_10.md).

# Validación 0.9.0

Cierre verificado: **315/315 pruebas del motor**, los trece recorridos históricos de navegador y el nuevo recorrido de taller visual, sin errores de página ni desbordamiento en 1440/1024/390. La temporada actual de veinte fechas abre 2027 con licencia profesional y **9375 US$** tras pagar entrenador, programa, investigador y proyecto desde la caja real. [Registro financiero](BALANCE_0_9_1470.json). Es una ruta reproducible, no una prueba exhaustiva de equilibrio.

Los quince escenarios nuevos cubren catálogo físico e idempotencia sin dinero/RNG, comparación sin mutaciones, compra/montaje pagados por días, reanudación sin cobro duplicado, devolución con desgaste, desmontaje y restauración, estructura/refrigeración/embrague/llantas/frenos, bloqueo de soportes incompatibles, daño estructural, fallos atómicos de compra, reserva de entrenamiento, rendimiento real y ancho físico en carrera, repetición y corrupción de metadatos. Tres fixtures auténticas 0.8 capturadas antes de esta entrega terminan con exactamente su estado completo de carrera, montaje y programa.

`browser-workbench.cjs` funda la empresa desde formulario y realiza la primera compra con **4200 US$**, confirma/cancela, completa jornadas, recarga el montaje, recupera la unidad, busca/filtra sin perder el foco, compara incompatibilidades, arrastra a zonas correctas/incorrectas, sustituye conservando desgaste e importa un trabajo 0.8. Solo después del primer montaje se utiliza caja controlada para explorar más combinaciones. El arrastre nativo se prueba con tarjeta y destino visibles en un escritorio alto. Las vistas del taller se comprueban en tres anchuras; también se dibuja el coche modificado en el Canvas de carrera. Capturas de ambas perspectivas, móvil y galería de doce modelos inspeccionadas visualmente.

`npm run test:balance` usa `engine({workbench:true})`; `test:balance:v80` conserva la ruta anterior. Las suites históricas fijan sus constructores/datos y la suite nueva usa el constructor público actual. Se comprueban sintaxis, recursos locales y el archivo ZIP. La apertura `file://` sigue omitida por la política de Chromium del entorno; HTTP verificado. [Uso, reglas y límites](TALLER_VISUAL_0_9.md).

# Validación 0.8.0

Cierre verificado: **300/300 pruebas del motor**, doce recorridos históricos de navegador más el recorrido 0.8.0 en tres tamaños, y ruta de temporada con programa/ciencia pagados. La actualización añade 22 pruebas de investigación/campus/contenido, recorrido de navegador actual en tres tamaños y una temporada con formación/ciencia pagadas desde la misma caja. Consulta [evidencia, reglas y límites](INVESTIGACION_CAMPUS_0_8.md) y [el registro financiero](BALANCE_0_8_1470.json). Los registros siguientes documentan versiones anteriores.

# Validación 0.7.0

Resultado de cierre: **278/278 pruebas del motor**, once recorridos históricos de navegador y el nuevo recorrido 0.7.0, más temporada completa de veinte pruebas y apertura de 2027. La revisión actual añade 28 pruebas de ligas/pistas/piezas/diseños, recorrido de navegador actual en tres tamaños y una temporada de veinte pruebas sin ayudas. Consulta [reglas, evidencia y límites](COMPETICIONES_0_7.md). [Registro de la temporada reproducible](BALANCE_0_7_1470.json). Los apartados siguientes conservan el registro histórico de comprobaciones.

# Validación de la versión 0.6.4 · variedad, dificultad y conducción

`npm test`: **250 escenarios aprobados**, sin fallos ni omisiones: 230 regresiones anteriores y 20 casos de las reglas actuales. `npm run test:browser`: **once recorridos**; los diez anteriores y `browser-challenge.cjs`. `npm run test:balance`: temporada completa reproducible, sin inyectar financiación ni resultados. Juego y pruebas de motor sin dependencias de ejecución. La apertura `file://` sigue omitida por la política de Chromium del entorno; HTTP verificado.

Los casos nuevos prueban inicio de $4.200 y doce candidatos de valoración 10–25 en 30 semillas; determinismo; 500 nombres/identidades/retratos únicos, edad, nacionalidad y temperamento; ausencia de consumo de RNG al dibujar; progresión y curva salarial; 24 modelos con variantes y doce familias de ilustraciones; débito diario real de piloto, mecánico y operación; especialista NV 6 motivado por encima de $800/día y acceso por nivel; indemnización con conversión de meses; caducidad y reposición de CVs; 17 opciones de gomas, precios y duración; guardado/reanudación exactos con marcas y cerebro; desgaste y pérdida de agarre; efecto de edad/experiencia/frenada/atención/resistencia y riesgo; orientación continua en seis trazados; huella de tribunas fuera de todos los segmentos y boxes; carrera completa con disputas, desgaste, paradas y repetición; rechazos de estado corrupto; y reservas, renovación con aumento y sustitución fiscal de pilotos rivales pagando costes reales. La prueba física comparada mantiene coche/órdenes/semilla y comprueba más distancia con mejor frenada/control/atención.

Las suites anteriores fijan explícitamente `createLegacyGame`; la suite nueva usa `engine({current:true})`. No se usa la compatibilidad anterior como prueba del nuevo equilibrio. Una fixture auténtica 0.6.3, tomada antes de cambiar el motor, reproduce resultados y estado final **completos**, sin excluir bloques nuevos: al no tener marcador, mantiene sus reglas. Siguen pasando las fixtures históricas anteriores.

El recorrido nuevo funda una partida con el constructor actual desde el formulario y dibuja el logotipo. Negocia mediante sueldo de referencia, ajuste inferior y cláusulas completas; firma y comprueba el cobro al avanzar el día; contrata un mecánico con sueldo diario; reserva un compuesto de marca con cotización y previsión de vueltas; corre con el bucle real de animación; pausa, guarda/carga cerebro y marca; llega a boxes por la pista y completa el servicio con el mismo motor. Para ejercitar el fallo manual se retira el apoyo del mecánico del snapshot de prueba. Inspecciona carrera/boxes, pilotos, mercado, taller, finanzas y negociación en 1440/1024/390 px, sin errores ni desbordamientos. Verifica expresamente que identidad y velocímetro no se solapan. Capturas `test-results/challenge064-*.png`.

La simulación anual con semilla **1364** usa el piloto inicial más barato ($24/día), el coche inicial, encargos cuando están disponibles, Fortis duros, modo conservar y cambios manuales cuando procede. Avanza todos los días con sus gastos y simula las seis carreras completas. No contrata especialistas ni recibe financiación adicional. Resultado registrado:

| Ronda | Día | Coches | Puesto del jugador | Paradas | Motor restante | Adelantamientos registrados |
| ----- | --- | ------ | ------------------ | ------- | -------------- | --------------------------- |
| 1     | 13  | 8      | 6.º                | 1       | 80 %           | 6                           |
| 2     | 69  | 8      | 7.º                | 2       | 76 %           | 1                           |
| 3     | 132 | 8      | 7.º                | 1       | 73 %           | 2                           |
| 4     | 195 | 8      | 7.º                | 2       | 69 %           | 3                           |
| 5     | 258 | 8      | 7.º                | 2       | 64 %           | 7                           |
| 6     | 314 | 8      | Abandono           | 0       | 60 %           | 2                           |

El saldo final es **$8.832**: $23.100 de ingresos y $18.468 de gastos, sobre los $4.200 iniciales. Los siete rivales terminan activos y con caja positiva; conservan ocho participantes en las seis rondas. Esta ruta muestra supervivencia con ahorro y trabajo, sin convertirla en una estrategia ganadora. Los incidentes surgen del motor; no se fuerza un accidente por ronda. Los contadores de radio/acontecimientos son acotados. Una semilla y una estrategia no prueban equilibrio universal, categorías superiores ni décadas de juego.

---

## Registro histórico de la 0.6.3

# Validación de la versión 0.6.3 · gerencia, delegación y medicina

`npm test`: **230 escenarios aprobados, sin fallos ni omisiones**, incluidos los 200 anteriores y 30 nuevos. `npm run test:browser`: **diez recorridos aprobados**, los nueve anteriores y `browser-operations.cjs`. Se mantiene el juego sin dependencias de ejecución. La apertura `file://` continúa omitida por la política de Chromium del entorno; inicio HTTP verificado.

Las pruebas nuevas comprueban candidatos de gerente/médico con RNG e IDs independientes; inicialización idempotente y guardado; previsión sin mutaciones; reparación pagada una vez con plazo real; límite por intervención y topes diario/área/mes; reserva de caja y previsión; gasto que no se reinicia al guardar o cambiar políticas; renovación del presupuesto por mes; inscripciones y calendario protegidos; bahías; transferencia física de repuestos y dinero al proveedor; stock, compatibilidad, condición, precio, capacidad y objetivo de inventario; montaje y reserva, entrega y conservación de mejoras sanas; prioridades, nivel y habilidad del gerente; pausa, descanso, rescisión e impagos; formación sin duplicar la cuota básica, entrenador, carga y descanso; órdenes manuales; ojeo con filtros/plazo/contrato; encargos con entrega neta única; reanudación determinista; cotización y tratamiento con médico, contratos, ocupación y paciente bloqueado; acierto/fallo al segundo día, menor plazo con experto, estrés, gasto único, un intento por episodio y ausencia de curación instantánea; retiro definitivo, recuperación natural, recarga y bancarrota; validación de políticas, cuentas, referencias, contador y casos corruptos.

Se conservaron **fixtures auténticas 0.6.2 antes de modificar el motor**: carrera durante un cambio manual con dos tuercas aflojadas, y práctica en marcha. La migración mantiene exactamente la simulación y los resultados tras completar las mismas acciones, excluyendo solo el bloque de operaciones y sus candidatos/perfiles adicionales. Las fixtures de versiones anteriores siguen verificándose. Las expectativas de personal inicial pasan de 25 a 35 porque se incorporan diez entidades reales; no se sustituyen las anteriores ni se consume su RNG al importar.

El navegador contrata gerente y médico desde sus perfiles; configura políticas con formularios y confirma los topes; ejecuta mantenimiento y compra reales; conserva gasto al recargar; autoriza montaje y completa su plazo mediante el botón de calendario; inicia un tratamiento, guarda/carga a mitad y verifica la recuperación al terminar; pausa la delegación; recorre las tres áreas a 1440, 1024 y 390 px e importa una práctica 0.6.2 pausada. Nueve capturas `test-results/ops063-*.png` comprueban ausencia de errores de consola y desbordamiento. El resultado médico acertado se fuerza en este caso controlado para verificar consecuencias; el fallo y el sorteo persistente se comprueban en las pruebas del motor.

La inspección visual confirmó formularios legibles, controles de selección de tamaño correcto, registro de costes y disponibilidad médica. Los topes protegen las órdenes delegadas; los gastos manuales, nóminas y operación ordinaria siguen en Finanzas. Los casos controlados no demuestran equilibrio a décadas. Academia, departamentos especializados, I+D y las restantes áreas del análisis continúan pendientes.

---

## Registro histórico de la 0.6.2

# Validación de la versión 0.6.2 · especialistas, boxes y pista

`npm test`: **200 escenarios aprobados, sin fallos ni omisiones**, incluidos los 173 anteriores y 27 nuevos. `npm run test:browser`: **nueve recorridos aprobados**; los ocho anteriores y `browser-professionals.cjs`. La apertura `file://` continúa omitida por la política de Chromium del entorno; el juego se valida por HTTP. No se añaden dependencias al juego ni al runner de pruebas del motor.

Los nuevos escenarios cubren niveles/sueldo/eficacia y XP; descanso remunerado, estrés y bloqueo de apoyo; aumentos aceptados, negociados, rechazados e ignorados; oferta de competencia con fondos y plaza reales, compensación, liquidación, contraoferta, cancelación y conservación de identidad; diagnóstico obligatorio con mecánico, apoyo del ingeniero, cobro único y efecto físico del ajuste; calibración estadística de un informe al 80 %; nuevos CVs, calidad por nivel, caducidad de candidatos sin contratar, conservación de agentes libres con contrato anterior y guardado; boxes manuales con rivales en marcha, secuencia de cuatro ruedas y fijaciones, errores, seguridad, reincorporación, stock y pago único; éxito/fallo del mecánico, velocidad individual y sanción completa; estratega contextual, menor estrés y prioridad manual; previsión de entrenamiento, efecto del nivel/descanso, vueltas reales, desgaste, kilómetros, mejora y operación diaria; reanudación determinista, interrupción, lesión/recuperación y accidente que termina la carrera deportiva; bloqueos médicos, retirada de inscripción y liberación de gomas; atributos ya superiores al potencial sin regresión; validación de perfiles, referencias y física corruptos.

La nueva fixture **auténtica 0.6.1 en boxes**, creada antes de cambiar el motor, conserva exactamente su carrera al migrar y reproduce resultados y estado final completo, excluyendo únicamente `s.professional`. Siguen verificándose las fixtures anteriores. Las pruebas específicas del modelo de boxes 0.5 y apoyo 0.6.1 utilizan explícitamente la ruta antigua sin marcador profesional; los escenarios nuevos prueban la ruta nueva, incluido el minijuego y su persistencia.

El nuevo recorrido usa la interfaz para contratar mecánico/entrenador, consultar nivel, revisar/ajustar el coche, negociar un aumento y retener ante una oferta rival. Selecciona piloto/entrenador/coche y consulta riesgo antes de confirmar una práctica; la pausa, guarda/carga y la termina con el bucle real de animación a ×20. Da descanso remunerado y verifica su estado. En otra carrera, llega al puesto usando la física, confirma que los rivales avanzan y completa las cuatro ruedas pulsando las herramientas; guarda/carga con dos tuercas aflojadas y sale por el carril real. Comprueba el control del estratega, abre un nuevo CV con datos básicos/porcentaje de acierto e importa la fixture 0.6.1. Escenarios controlados preparan ofertas, inscripción y entrada a boxes; no fabrican una finalización del minijuego. Ocho capturas a 1440, 1024 y 390 px verifican personal, práctica y boxes sin errores de consola ni desbordamiento. Archivos `test-results/pro062-*.png`.

La inspección visual también verificó contraste del panel durante la retransmisión y seguimiento del coche de entrenamiento. Se corrigió la representación de una pista vacía y se permite elegir seguimiento o circuito completo. Los accidentes médicos se fuerzan en pruebas controladas para comprobar sus consecuencias, sin afirmar que su frecuencia a largo plazo esté equilibrada.

La simulación sigue siendo 2D. Esta validación cubre los cinco roles disponibles y estas reglas; no demuestra equilibrio durante décadas ni incorpora las otras profesiones, academia o I+D del prompt maestro.

---

## Registro histórico de la 0.6.1

# Validación de la versión 0.6.1 · personal

`npm test`: **173 escenarios aprobados, sin fallos ni omisiones**: los 137 anteriores y 36 de personal. `npm run test:browser`: **ocho recorridos aprobados**, incluido el nuevo `browser-staff.cjs`. Se mantienen los siete recorridos anteriores. La apertura `file://` continúa omitida por la política de Chromium; inicio HTTP verificado.

Los nuevos escenarios comprueban mercado persistente e idempotencia; contraoferta, prima y contratación única; pausa por insistencia; capacidad, roles y fondos; asignación real, crédito al terminar y guardado de dos reparaciones simultáneas; instalación con ingeniero; encargos con mecánico; contratos demasiado cortos para un trabajo; formación pagada con entrenador y límite de potencial; desgaste/temperatura de motor; servicio de boxes reducido sin acortar sanciones; informe pagado, espera, recarga y cancelación; devengo, vencimiento, atrasos, liquidación manual, bancarrota con caja no negativa y recuperación; rescisión; cambios de empleador; renovación; cumpleaños/retiro; conflictos, compatibilidad y dimisión; candidaturas por escasez; contratación/renovación/recorte rival y ampliación de oficina; patrimonio; consultas sin mutación; migración auténtica 0.6 con estado final exacto; validación de entidades y contratos corruptos.

El navegador negocia una contraoferta y una prima, contrata mecánico/ojeador, programa una reparación que tarda un día y bloquea la rescisión del trabajador ocupado. Encarga y guarda un informe a mitad, recarga mediante la interfaz y lo termina. Amplía la oficina con el calendario real y una carrera simulada por el motor; incorpora entrenador/ingeniero, verifica la mejora de formación y el montaje con responsable. Usa una ventana de contrato controlada para renovar, rescinde y paga atrasos. Consulta cuatro secciones a 1440, 1024 y 390 px y realiza una importación 0.6 desde el formulario. Capturas `test-results/staff061-*.png`.

Los casos controlados aíslan cada obligación y su integración. No demuestran el balance a largo plazo ni la existencia de las restantes especialidades, academia, automatización o investigación. La migración añade empleados con RNG e IDs independientes sin cambiar activos, instalaciones ni una carrera anterior en curso.

---

## Registro histórico de la 0.6

# Validación de la versión 0.6 · instalaciones y progresión

`npm test`: **137 escenarios aprobados, sin fallos ni omisiones**: los 112 anteriores y 25 de instalaciones/archivo. `npm run test:browser`: **siete recorridos aprobados**, incluido el nuevo `browser-facilities.cjs` y los seis anteriores. La apertura `file://` sigue omitida por la política de Chromium; inicio HTTP verificado.

Los escenarios nuevos comprueban: pago a constructora y capacidad diferida; entrega/cancelación únicas; fondos/nivel/carrera/actividad; mantenimiento desde entrega; compra de tercera unidad; tercera plaza de pilotos; almacén ampliado; bahías compartidas; reducción de plazo sin alterar trabajos ya contratados; ascenso, requisitos y descenso sin desalojos; recuperación de crisis; patrimonio neto tras crédito y reserva de liquidez para ascender; construcción rival con reserva; liquidación en bancarrota; guardado durante obra y avance agrupado/individual; migración auténtica 0.5 con estado final exacto; temporada real de seis carreras, archivo independiente, cambio de temporada y rechazo de datos corruptos.

El nuevo recorrido usa botones para contratar, cancelar, guardar, cargar y entregar una obra; verifica centavos y costes, bloqueo de calendario durante la carrera, ampliación del mapa y capacidad. Simula las seis rondas con el motor existente, consulta el archivo después de abrir 2027 y verifica ausencia de mutación al leer resultados. Usa un escenario controlado para comprobar el ascenso al avanzar un día. Recorre instalaciones y archivo a 1440, 1024 y 390 px e importa una carrera 0.5 desde el formulario real. Capturas: `test-results/expansion06-*.png`.

Los escenarios financiados/controlados aíslan condiciones y persistencia; no acreditan el balance de veinte temporadas. Personal, academia, automatización, I+D, nuevas categorías y equilibrio a décadas continúan pendientes.

---

## Registro histórico de la 0.5

# Validación de la versión 0.5

`npm test`: 112 escenarios aprobados, sin fallos ni omisiones. Conserva los 89 anteriores y añade 23 del fin de semana. El recorrido nuevo de navegador se añade como sexto, conservando los cinco previos.

- Compra/reserva/uso y reutilización del mismo juego físico; stock y capacidad; fondos insuficientes sin cobros parciales.
- Reposición con fondos reales una vez por fecha, sin reponer al cargar.
- Grip y desgaste según compuesto, agua y temperatura; lluvia y secado progresivos.
- Orden/cancelación, reserva de combustible, carril, detención sin progreso, servicio, coste y salida.
- Reparación limitada sin empeorar sistemas sanos, piezas sin rejuvenecer, velocidad de boxes y sanción única.
- Peso de combustible, consumo y ahorro, abandono al agotar combustible, pinchazo y sustitución.
- VSC por obstrucción múltiple y fin del procedimiento.
- Guardado durante el servicio con factura, reloj y resultado idénticos.
- Grabación adaptativa acotada, búsqueda sin alterar estado/RNG y tiempos finales oficiales.
- Carrera 0.4 auténtica con resultados y estado final exactos, incluida economía y contratos.
- Rechazo de clima, juego, parada o fotograma corrupto; gomas de calle pinchadas sin reparación gratis; descarte sin ingresos ficticios.
- Última entrada/capacidad de depósito, devolución de reservas al rescindir piloto y reintegro del repostaje no entregado.

El nuevo recorrido Chromium usa inscripción con gomas y coste, pide cambio/reparación/repostaje, guarda estando detenido y reanuda sin repetir la factura. Controla una secuencia de lluvia para aislar el efecto visible, verifica el visor instantáneo sin mutar la partida, termina con el mismo motor, conserva el neumático de calle, reproduce y recarga la grabación final, descarta un juego e importa una carrera 0.4. Comprueba carrera y visor a 1440, 1024 y 390 px sin desbordamiento ni errores JavaScript. Capturas `test-results/race05-*.png`.

Una parrilla válida de 30 coches completó 269,2 segundos simulados en unos 7,6 segundos de CPU: seis paradas de IA, dos transiciones de clima, 75 adelantamientos, 59 contactos y un choque. Terminaron los 30. La grabación quedó en 271 fotogramas adaptados y el guardado completo ocupó alrededor de 0,6 MB; validación antes/durante/después correcta. Son observaciones de este escenario, no el balance final ni una promesa de rendimiento universal.

Las repeticiones son interpolaciones de muestras de la carrera real; solo se conserva la última grabación. El modelo sigue siendo 2D con procedimientos simplificados de Copa Club. Personal e instalaciones continúan en 0.6; no se presentan como completados por esta actualización.

---

## Registro histórico de la 0.4

# Validación de la versión 0.4

`npm test`: 89 escenarios aprobados, sin fallos ni omisiones. El motor conserva los 65 anteriores y añade 24 pruebas de contratos/economía. `npm run test:browser` incorpora un quinto recorrido, `browser-contracts.cjs`, y mantiene los cuatro anteriores.

Las nuevas pruebas verifican reserva y conservación de fondos; firma y pago únicos; contraofertas, contraprestaciones, pausa y presupuesto; exclusividad; convocatorias vencidas/rechazadas; fabricante con piloto y coche físicos; capacidad; ausencia de mutación parcial; la Prueba H con piloto incorrecto y liquidación; cumplimiento/promoción/prima final; logotipo y requisito técnico; crédito, cuotas, mora, regularización y amortización; cláusulas, victorias, memoria y moral con efecto real; renovación; patrocinio rival; guardado/RNG; importación auténtica 0.3.1 con resultado exacto; corrupción; la cuota del 70 %; bancarrota con obligaciones y nuevas convocatorias sin reponer presupuestos.

El recorrido Chromium negocia y recibe una contraoferta, firma un fabricante, contrata al piloto impuesto y transfiere un coche existente; guarda una promoción pendiente y la completa tras cargar. Retira/restaura marca, negocia cláusulas de otro piloto, solicita crédito y paga una cuota y la amortización mediante controles. Disputa una carrera con un piloto distinto, verifica la cuota retenida y completa las demás rondas con renuncias reales del motor. Los encargos de taller financian el paso del año; se comprueban devolución/penalización únicas y la noticia abre el contrato concreto. Finalmente renueva un piloto, comprueba que la bancarrota permite consultar las obligaciones y bloquea nuevo crédito, importa una carrera 0.3.1 y recorre las cuatro pestañas comerciales a 1440, 1024 y 390 px. Las pruebas unitarias usan también escenarios controlados de rondas para aislar condiciones y contabilidad; el navegador comprueba la integración con la temporada real.

Los proveedores y banco son simulaciones ficticias. No se realizan llamadas ni pagos externos. Las capturas se escriben en `test-results/contracts-*.png`. El catálogo inicial no implica que estén terminados clima, boxes operativos, personal ni las etapas posteriores del plan.

---

## Registro histórico de la 0.3.1

# Validación de la versión 0.3.1

`npm test`: **65 escenarios aprobados, sin fallos ni omisiones**. Conserva los 49 anteriores, añade una fixture auténtica de carrera 0.3, rechazo de datos corruptos de tráfico y catorce escenarios de la nueva dinámica.

- Volúmenes en metros y parrilla sin interpenetración; coches paralelos con espacio no colisionan.
- Contacto con daño en ambos coches, separación y cooldown; colisiones con doblados y separación de tres vehículos en cadena.
- Un coche girado ocupa su longitud transversal real; un abandonado continúa como obstáculo mientras se aparta.
- Choque grave controlado: abandono, daños que llegan al taller, amarilla y resultado correcto incluso sin clasificados.
- Riesgo según piloto, estilo, neumáticos y curva; preparación gradual del adelantamiento según su atributo.
- Adelantamiento que exige abrir un hueco y cruzar físicamente; amarilla local y recuperación del sector.
- Determinismo con pasos agrupados y al guardar/reanudar, registros limitados y resumen persistente.
- Reanudación de fixtures auténticas 0.1, 0.2 y 0.3 con resultados exactamente iguales a sus versiones.

`npm run test:browser` conserva los tres recorridos completos y añade `browser-presentation.cjs`. El principal verifica temporada y 21 vistas; negocio verifica mercado/traspasos/migración y 27 vistas; taller comprueba operaciones reales, cuatro pestañas móviles y 33 vistas/pestañas. El cuarto comprueba navegación con nombres, búsqueda sin perder foco, compatibilidad y estado vacío, tres cámaras, piloto seleccionado, zoom, escala de los seis trazados, render sin mutación del RNG, audio tras un gesto, silencio al pausar y controles móviles. Un impacto controlado comprueba abandono, amarilla, órdenes deshabilitadas, ausencia de chirrido al detenerse y contadores del resumen sin duplicar choques. Se detectó y corrigió que guardar/opciones desaparecían a 390 px; se mantienen accesibles también durante la carrera. Sin errores JavaScript ni desbordamiento a 1440, 1024 y 390 px.

Exploración de diez semillas normales con ocho coches: **8–32 adelantamientos, 3–9 contactos, 0–3 derrapes y 0–2 trompos**; todos terminaron y la carrocería mínima quedó entre 63 % y 78 %. Los accidentes graves no se fuerzan por tiempo. Una parrilla de 30 compañías con activos válidos completó la prueba con 83 adelantamientos, 60 roces, 4 choques, 4 derrapes y 1 trompo; estado válido antes/durante/después, guardado de 186,6 KB y carrera de 220,65 s simulados procesada en unos 7,3 s de CPU en este entorno. Estas cifras son una comprobación funcional, no el balance definitivo ni una garantía de rendimiento en cualquier equipo.

Las capturas se generan en `test-results/redesign-*.png`. La apertura `file://` sigue omitida por política de Chromium; HTTP verificado. Es una simulación 2D seca con volúmenes simplificados; clima, boxes operativos y repeticiones continúan pendientes.

---

## Registro histórico de la 0.3

# Validación de la versión 0.3

`npm test`: **49 escenarios aprobados**, incluidos los 27 anteriores y 22 del taller. `npm run test:browser` ejecuta los tres recorridos de navegador, conservando la temporada y el mercado anteriores.

## Taller: pruebas nuevas

- Compra de unidad física, pago al proveedor y rechazo de doble compra.
- Reserva e instalación con plazo: cambios solo al completar y sin doble pago ni duplicación.
- Modelo incompatible, requisitos del compresor y potencia máxima de la Copa.
- Prohibición de desmontar requisitos todavía usados por otras mejoras.
- Taller compartido, anuncios y compromisos deportivos.
- Almacén lleno y reserva de la plaza futura al desmontar.
- Sustitución con recuperación exacta de la unidad y su desgaste.
- Retorno de los neumáticos originales con su condición anterior, sin gomas gratuitas.
- Reparación focal sin restaurar otros sistemas o rejuvenecer mejoras.
- Componente crítico que impide competir pese a un promedio aceptable.
- Frenos y suspensión que aumentan la distancia recorrida en un banco de pista comparable.
- Compuesto deportivo que aumenta agarre y desgaste.
- Radiador que reduce temperatura y desgaste del motor bajo conducción agresiva.
- Desgaste devuelto al coche y a las piezas, con resultado idéntico a distintas agrupaciones de pasos y al guardar a mitad de carrera.
- Venta de coche con mejoras instaladas, conservando los repuestos del vendedor.
- Recompra de repuestos con precio por estado y saldos contrapuestos.
- Reanudación de montaje pendiente, sin nuevo cobro o nueva pieza.
- Fixture auténtica 0.2 en carrera: mismas entidades anteriores y resultado exacto; la fixture 0.1 también sigue pasando.
- Un rival compra, instala y usa las mismas mejoras en la parrilla.
- Rechazo de piezas huérfanas, doble montaje y reservas corruptas.
- Servicio de neumáticos modificados: precio correcto, agarre recalculado y ninguna unidad nueva, tanto en servicio directo como en trabajo de taller.
- Revisión antigua en curso que conserva fecha de entrega y coste ya pagado al migrar.

## Chromium

El recorrido de la 0.3 compra por interfaz, compara compatibilidad, guarda una instalación pendiente, recarga la página, completa el plazo y verifica el cambio real de atributos. Después instala/desmonta, corre con mejoras, guarda y retoma la carrera, repara solo el motor y vende un repuesto. Verifica también una importación 0.2 durante la carrera y diez pantallas a 1440, 1024 y 390 px, sin desbordamiento ni errores JavaScript. Los recorridos 0.1 y 0.2 permanecen activos. Las pruebas agrupan pasos del mismo motor para terminar carreras sin esperar todas las vueltas reales; no insertan resultados.

Se repitieron tres temporadas para las semillas 51, 184 y 489, validando después de cada ronda: **14 coches y 56 piezas** en todo momento. Los rivales compraron y montaron unidades del stock compartido; conservaron los saldos y obligaciones normales. Solo se amplió el saldo de la compañía observadora para que su inactividad no interrumpiera el análisis. Los siete rivales permanecieron activos en estas semillas; los escenarios controlados de bancarrota siguen verificando su exclusión. Esto no es el balance final de 0.9.

La apertura `file://` permanece omitida por la política de Chromium (`ERR_BLOCKED_BY_ADMINISTRATOR`); la ejecución HTTP sí está comprobada. Patrocinios condicionados y pilotos impuestos siguen pendientes para la 0.4 y no se presentan como implementados.

---

## Registro histórico de la 0.2

# Validación de la versión 0.2

## Pruebas automáticas

`npm test`: **27 escenarios aprobados**, sin fallos ni omisiones. Mantiene los once escenarios de la 0.1 y añade dieciséis pruebas del mundo empresarial:

- Compraventa con un único vehículo, retirada de oferta, saldos contrapuestos e historial.
- Stock, capacidad, fondos y operaciones repetidas o ajenas sin mutaciones parciales.
- Exclusión entre anuncio, revisión e inscripción, y retirada deportiva sin reembolso.
- Compensación de traspaso, liquidación de nómina, propiedad y continuidad deportiva del piloto.
- Consentimiento del jugador, rechazo, aceptación días después por el importe acordado y protección frente a doble cobro.
- Vencimiento, retirada por insolvencia y pilotos comprometidos en una inscripción.
- Personalidades con reservas distintas y decisiones sin crédito ilimitado.
- Un rival contrata realmente a un piloto, lo remunera y lo usa en la siguiente carrera.
- Encargos empresariales con plazo real y taller compartido con mantenimiento.
- Entrenamiento asignado por IA, cobrado y con mejora observable.
- Bancarrota rival, liberación de pilotos, liquidación y exclusión permanente de la parrilla.
- Noticias que enlazan al coche realmente comprado por el rival y a su movimiento económico.
- Migración de una partida **auténtica del commit 0.1** guardada durante la carrera: mismos participantes, RNG, saldos y resultado final exacto.
- Persistencia del RNG empresarial, anuncios, stock y decisiones al cargar reiteradamente.
- Rechazo de anuncios duplicados, propietarios falsos y vehículos huérfanos.
- Estabilidad de plantilla: la IA no vuelve a traspasar un fichaje en menos de sesenta días.

## Navegador

`npm run test:browser` conserva el recorrido completo de la temporada 0.1 y añade el recorrido de la 0.2. Este último comprueba compras/ventas, retirada de anuncios, selección de flota, fichajes entre compañías, rechazo/aceptación de ofertas, noticias que abren el activo correcto, decisiones diarias, garaje sin coches y migración/importación de una carrera 0.1 seguida de guardar y recargar. Se comprueban nueve pantallas a 1440, 1024 y 390 px, sin desbordamiento horizontal ni errores JavaScript.

La prueba anterior mantiene el dibujo/undo/redo/exportación PNG, negociación libre, inscripción, movimiento en Canvas, órdenes, pausa, velocidad, cámaras, guardado/reanudación, seis rondas y exportación/importación. Usa el mismo motor para agrupar pasos y no esperar todas las vueltas en tiempo real; no inserta resultados prefijados.

## Exploración temporal

Se ejecutaron tres temporadas completas para tres semillas (51, 184 y 489) con un saldo amplio **solo en la compañía observadora de la prueba**, para evitar que su inactividad detuviera la observación. Los rivales conservaron sus presupuestos normales y pagaron sus obligaciones. Se validó el estado después de cada ronda: 14 coches en todo momento, anuncios únicos, contratos y propiedades coherentes y los siete rivales se mantuvieron activos en esas semillas tras corregir los traspasos demasiado frecuentes. La quiebra y la exclusión permanente se cubren en su escenario controlado. Es una comprobación funcional prolongada, no el balance definitivo de la 0.9.

La apertura `file://` sigue omitida si Chromium devuelve `ERR_BLOCKED_BY_ADMINISTRATOR`; se usa el servidor HTTP incluido sin cambiar políticas. Las capturas y exportaciones de prueba se guardan en `test-results/`, ignorado por Git.

Piezas y patrocinio con piloto impuesto (C/H de la especificación) siguen pendientes para 0.3 y 0.4; no se consideran implementados ni probados aquí.

---

## Registro histórico de la validación 0.1

# Validación de la versión 0.1

Ejecutada en el entorno de desarrollo con Node.js 24 y Chromium mediante Playwright.

## Motor: 11 escenarios aprobados

`npm test` ejecuta once pruebas, sin fallos ni pruebas omitidas:

1. Contraoferta y contratación, salario real, límite de plantilla, firma duplicada y vencimiento.
2. Coste y plazo de reparaciones, taller ocupado, neumáticos y cobro de encargos.
3. Bloqueo del calendario en fecha de carrera y cobro único de inscripción.
4. Mismos resultados con pasos agrupados a distinta velocidad y al guardar durante una carrera.
5. Influencia de las órdenes sobre progreso y desgaste.
6. Seis carreras hasta completar una temporada: puntos, salarios rivales, premios, archivo y apertura del siguiente año.
7. Guardados íntegros, recuperación desde copia anterior, rechazo de versión desconocida, duplicados y propiedad inválida.
8. Bancarrota definitiva y exclusión de compañías quebradas de la parrilla.
9. Noticias que enlazan pilotos/eventos reales y premios presentes en el libro económico.
10. Un cobro a tiempo evita declarar bancarrota en el último día del margen.
11. Baja de inscripciones al vencer el contrato y calendarios futuros al abrir una nueva temporada después del descanso.

También se recorrieron cinco semillas de temporada para comprobar que el presupuesto inicial permite terminar sin ingresos fabricados. Los resultados deportivos variaron entre semillas; no se fija un resultado favorable al jugador. Esto no sustituye el balance de muchas temporadas previsto para la 0.9.

## Navegador: recorrido aprobado

`node tests/browser-smoke.cjs` completó:

- Crear compañía dibujando un logotipo con el ratón, deshacer/rehacer y exportar PNG.
- Navegar desde los edificios, recibir una contraoferta y contratar al piloto.
- Inscribir el coche, avanzar hasta la jornada y empezar la animación real en Canvas.
- Comprobar movimiento, dar una orden, usar ×4, alternar cámaras y pausar.
- Guardar, recargar completamente la página y recuperar coches, compañías y carrera en curso.
- Terminar las seis rondas con el mismo motor y registrar el cierre de temporada.
- Exportar la partida y volver a importarla en otra ranura.
- Abrir siete pantallas en 1440, 1024 y 390 píxeles sin desbordamiento horizontal del documento.
- Cero errores JavaScript de página durante ese recorrido.

Para no esperar todas las vueltas en tiempo real, la prueba agrupa pasos del motor desde la página después de comprobar la animación y los controles. No sustituye los resultados por valores precalculados. El servidor, las solicitudes HTTP y todos los recursos locales se utilizaron durante el recorrido.

**Omitido:** apertura mediante `file://`. Chromium devuelve `ERR_BLOCKED_BY_ADMINISTRATOR` por la política del entorno. No se cambió esa política. Se comprobó la ejecución HTTP con el servidor incluido; la apertura autónoma no se declara verificada aquí.

Las capturas y el JSON resultante se generan en `test-results/`, que no forma parte del código versionado.

## Escenarios de versiones posteriores

Mercado, piezas compatibles y patrocinio con piloto impuesto (B/C/H del documento maestro) no se implementaron ni se consideran probados en la 0.1. La IA empresarial completa, los componentes de taller y las condiciones comerciales se validarán en sus entregas, según `ROADMAP.md`.
