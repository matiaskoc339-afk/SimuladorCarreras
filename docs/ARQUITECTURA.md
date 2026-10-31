# Arquitectura de Racing Company Simulator

## Gran Serie 0.17

`grand-content.js` añade 60 modelos y 192 definiciones sin alterar el catálogo de las construcciones históricas. `grand-tour.js` inicializa suministro, seis compañías y reglas por evento (`grandVersion`, `grandDivision`), captura la configuración de fábrica en `Performance` y preserva los límites de las carreras anteriores. La elección nacional se bloquea por temporada. La IA evalúa compatibilidad, reserva, categoría y mantenimiento específico. `grand-art.js` integra SVG superior/lateral y Canvas para Fórmula/Prototipos con sus anclajes de taller; `ui-grand-tour.js` añade filtros y selección informada. Las validaciones comprueban referencias y plataformas capturadas. Los trofeos y el archivo conservan la división de cada final.


## Habilidades y agenda · 0.16

`driver-abilities.js` contiene 108 definiciones, asignación determinista, condiciones, atributos efectivos y ejecución de habilidades especiales. El bucle de carrera aplica sus efectos desde atributos base guardados; los bonos temporales no se liquidan como entrenamiento. `driver-world.js` versiona la empresa, los programas rivales, preferencias de lectura y las carreras nuevas. Reutiliza gasto, contratos, personal, taller y simulación de pruebas.

`Calendar` mantiene el aviso al llegar a una prueba, pero permite avanzar y simularla sin el jugador. La exclusión de prácticas de `PitCrew.start` admite esa renuncia con rivales mientras sigue un programa por días. Los límites por pinchazo se aplican después de las decisiones y también en la integración de boxes. `Camps` guarda la nueva tasa de aprendizaje; los programas existentes conservan la anterior.

`ui-driver-world.js` muestra habilidades, enciclopedia, desarrollo rival y activaciones en carrera. El perfil de negociación y su orientación dependen del ojeador. `App.render` marca noticias leídas solo al mostrar realmente el diario, fuera del tutorial; las vistas son consultas sin efectos. El constructor `createV150Game` y una fixture auténtica mantienen la regresión anterior. [Reglas](PILOTOS_Y_AGENDA_0_16.md).

## Conducción y combate · 0.15

`race-skills.js` añade `s.raceSkills` y marca las nuevas carreras con `skillsVersion = 1`. Construye una envolvente de velocidad con Control continuo, techo físico independiente y anticipación de frenada; transforma distancia física en avance por la línea escogida. `race.js` integra esa envolvente, la ejecución y la distancia lateral en su paso fijo. Los errores antiguos sin contexto quedan fuera de estas carreras, conservándose para las anteriores.

Cada participante guarda preparación de maniobras, observaciones limitadas de rivales, RNG de ejecución, referencia de ritmo y telemetría atribuida. La referencia integra aceleración y frenada del mismo coche sano; la pérdida equivalente local se reparte entre cuatro motivos sin duplicados y excluye neutralizaciones/boxes. La validación comprueba valores, referencias y límites antes de reanudar. La liquidación conserva una copia del informe del jugador, con historial acotado.

`ui-race-skills.js` agrega una sección al mismo muro móvil, sin duplicar controles. `render.js` dibuja la trayectoria efectivamente prevista y las pequeñas rotaciones/bloqueos. `Practice` y `Camps` admiten seis focos solo en empresas actualizadas; las dos nuevas especialidades reutilizan jornadas, cuotas, riesgos y reportes. El constructor anterior y una fixture auténtica 0.14 prueban continuidad exacta de las carreras antiguas. [Reglas y alcance](CONDUCCION_Y_COMBATE_0_15.md).

## Puntos y licencia en 0.13.1

`Competition.licenseStatus` comparte los requisitos de la licencia y sus motivos de bloqueo entre motor e interfaz. `season.cups[cup].standings` sigue siendo la clasificación deportiva anual, mientras `competitions.streetPoints` y `proPoints` conservan sus trayectorias de acceso. La sede y los resultados usan los marcadores por copa; `Competition.driverBoard` deriva las tablas históricas a partir de eventos de una sola liga. El control previo al inicio de una prueba con inscripción rechaza una licencia ausente antes de consumir RNG; las renuncias siguen permitidas. [Reglas](LIGAS_Y_LICENCIA_0_13_1.md).

## Equipo y muro en 0.13

`team-life.js` incorpora encargos semanales guardables, comparte bahías/personal mediante los planificadores existentes y limita el ingreso a entregas reales. `race-life.js` marca solo carreras nuevas y añade decisiones/radio con RNG por piloto; las carreras históricas conservan su comportamiento. El techo de curva comparte el factor de Control entre el motor y la anticipación de frenado. `ui-race-command.js` agrupa controles existentes junto a la pista, conserva formularios/IDs de boxes y adapta la telemetría a una sección desplegable. `ui-team-life.js` añade encargos, explicación de atributos y previsión de aprendizaje sin mutar el estado al consultar. [Detalle](EQUIPO_Y_MURO_0_13.md).

## Avisos y previsiones en 0.12.1

`feedback.js` comparte textos de importes, fechas, disponibilidad y contratación entre motor y vistas. `Practice.blockers` y la cotización del programa alimentan tanto la validación real como la lista visible del campus; consultar una previsión no gasta ni modifica el guardado. `UI.blocked`/`decorateBlocked` enlazan controles inhabilitados a su explicación; `UI.reject` conserva los datos y añade el error al formulario, y los avisos de rechazo requieren cierre explícito. `Camps.daily` integra el desgaste térmico en pasos de un segundo como máximo y los informes separan finalización e interrupción, manteniendo el esquema de guardado anterior. [Detalle y compatibilidad](AVISOS_ENTRENAMIENTO_0_12_1.md).

## Un mundo, un estado

`RCS.createGame(nombre, logo, semilla)` crea el estado versionado. Las entidades tienen identificadores únicos dentro de la partida, generados con un contador persistente. Las relaciones usan esos identificadores, nunca índices de pantalla. Al cargar no se regenera ninguna entidad. La partida usa fechas UTC para que el calendario no dependa de la zona horaria del ordenador.

| Archivo              | Responsabilidad                                                                     |
| -------------------- | ----------------------------------------------------------------------------------- |
| `js/data.js`         | Catálogos extensibles, rasgos, reglamento, puntos y trazados                        |
| `js/core.js`         | Estado inicial, IDs, RNG reproducible, consultas y eventos/noticias                 |
| `js/parts.js`        | Definiciones, alojamientos, compatibilidad, requisitos y efectos de mejoras         |
| `js/workshop.js`     | Inventario físico, reservas, trabajos, configuración, desgaste y migración mecánica |
| `js/ui-workshop.js`  | Diagnóstico, comparador, proveedor, almacén y controles del taller                  |
| `js/economy.js`      | Única vía de movimiento monetario, libro de caja, servicios y mantenimiento         |
| `js/drivers.js`      | Currículums, atributos, negociación, contratos y evolución básica                   |
| `js/market.js`       | Anuncios finitos y transferencias atómicas de coches y dinero                       |
| `js/companies.js`    | Alineaciones, fichajes, compensaciones, ofertas, crisis y registro de decisiones    |
| `js/ai.js`           | Utilidad de acciones, reservas y personalidades empresariales                       |
| `js/world.js`        | Inicialización, invariantes del mundo y migración del esquema 1 al 2                |
| `js/ui-business.js`  | Pantallas y controladores del mercado, compañías y traspasos                        |
| `js/calendar.js`     | Orquestación diaria, bloqueo de carreras, apertura de temporadas                    |
| `js/race.js`         | Inscripciones, participantes, física y resultados, sin DOM                          |
| `js/storage.js`      | Serialización, validación, checksum, ranuras y recuperación                         |
| `js/render.js`       | Dibujos originales de vehículos, sede y circuito                                    |
| `js/ui.js`           | Presentación del estado y composición de pantallas                                  |
| `js/app.js`          | Entrada de usuario, formularios, editor Canvas, bucle y autoguardado                |
| `scripts/server.cjs` | Servidor estático local, sin paquetes externos                                      |

Se usan scripts clásicos con un único espacio de nombres `RCS`, en orden explícito. Esto permite ejecutar los mismos sistemas en Node (`vm`) y en navegadores, incluyendo contextos que permiten `file://`, sin empaquetador. Los archivos de simulación no acceden a la interfaz.

## Orden de una jornada

1. Impedir el avance si hay una carrera pendiente hoy o una carrera en curso.
2. Incrementar la fecha.
3. Cobrar $18 de gastos diarios a las compañías activas. Devengar los sueldos con salario/30 y liquidarlos el día 1.
4. Completar reparaciones y entregar encargos vencidos.
5. Recuperar fatiga, procesar entrenamiento pagado, liquidar contratos vencidos.
6. Procesar ofertas y ejecutar decisiones empresariales de los rivales. Cada una usa los mismos comandos económicos, deportivos y de mercado que la interfaz.
7. Evaluar la solvencia **después de todos los cobros y pagos**. Catorce jornadas consecutivas en negativo llevan a bancarrota.
8. Publicar recordatorios reales y detenerse si ha llegado una carrera.

El avance hasta la próxima prueba repite exactamente este proceso: no salta pagos, entrenamientos ni contratos. Los meses de contrato se modelan como 30 días, explicitado en el contrato de esta primera versión. Las cifras salariales son una cuota normalizada de 30 días.

## Simulación deportiva

Los circuitos son curvas Catmull–Rom muestreadas. Cada segmento tiene longitud y un límite de velocidad según su cambio de dirección. Cada coche guarda distancia recorrida, velocidad, carril, estado, neumáticos y ritmo. Se anticipan las curvas para frenar; el ratio potencia/peso limita la aceleración, y piloto/agarre/estado limitan la velocidad objetivo. El tráfico bloquea a un coche hasta que cambia de línea para adelantar. El modelo es longitudinal con desplazamiento lateral simplificado, no un simulador físico rígido ni un sistema completo de colisiones.

La lógica corre en pasos de 0.05 s. El bucle visual acumula tiempo y ejecuta tantos pasos como corresponden; ×4 aumenta los pasos, no cambia su tamaño. Un RNG propio de la carrera evita que guardar o cambiar la frecuencia de render altere sus resultados. Los órdenes cambian el ritmo, desgaste y riesgo. La simulación se puede pausar o serializar en cualquier paso. La física no depende del Canvas.

`Race.finish` requiere meta/abandono de todos los participantes y un evento aún no resuelto. Aplica una única vez puntos, premio, reputación, experiencia y desgaste. Después elimina la carrera activa. Las renuncias confirmadas usan el mismo motor para los rivales, sin coche del jugador. La clasificación de pilotos se deriva de resultados, por lo que un cambio de compañía no traslada puntos entre equipos.

## Persistencia y evolución

El sobre `RCS` almacena versión, fecha de guardado, checksum FNV y estado JSON. La validación comprueba IDs duplicados, propiedad, contratos, catálogo, calendario y carrera. Se valida antes de escribir o aplicar una importación. La copia anterior solo se reemplaza por un guardado validado. Los acumulados económicos sobreviven a la poda del libro de movimientos.

Los datos reservan espacios de estado para empleados, investigación y relaciones. No son sistemas implementados ni pantallas vacías: se desarrollarán con sus comandos y pruebas en sus versiones. El esquema debe migrarse antes de cambiar incompatiblemente una entidad. Las nuevas operaciones económicas deberán usar `Economy.transact/spend`, y publicar noticias después de una mutación real.

No se introducirá un sistema de sucursales. Las futuras instalaciones pertenecen a una única sede. La IA de la 0.2 opera sobre estos mismos coches, pilotos y saldos. El plan completo permanece en `ROADMAP.md` y la especificación original.

## Integridad empresarial y migración

El esquema 2 mantiene las mismas claves `localStorage` que la 0.1. Se comprueba el checksum del sobre original, se valida el estado de origen y solo entonces se amplía. No se regenera ningún activo anterior. `World.initialize` añade seis unidades de stock finito y sus anuncios usando un RNG auxiliar derivado de la semilla, y restaura el RNG de partida; no modifica el RNG de una carrera. Una fixture auténtica del commit 0.1 prueba que una carrera reanudada produce exactamente los mismos resultados. Las siguientes cargas del esquema 2 no ejecutan la inicialización otra vez.

`Market.buy` valida propietario, anuncio, fondos, taller, compromisos deportivos y capacidad antes del primer movimiento. Debita al comprador, acredita al vendedor (o al proveedor persistente), cambia la propiedad del mismo objeto y retira el anuncio. No hay reposición implícita. El precio de un anuncio ya publicado no se recalcula al pulsar comprar.

`Companies.sign` valida consentimiento, disponibilidad, salario, duración, plazas y fondos. Transfiere compensación, liquida al empleado su nómina devengada, actualiza su contrato y conserva estadísticas. Las propuestas al jugador se guardan con precio, comprador, piloto y vencimiento: no reservan fondos, por lo que se revalida la solvencia al aceptarlas. Las rechazas o aceptas explícitamente. La compensación se fija al presentar la oferta y no aumenta porque pasen unos días. Las inscripciones impiden transferencias; la retirada voluntaria no devuelve su pago.

La IA considera reserva salarial, necesidad de asiento/coche, calidad observable, edad, precio, estado mecánico y proximidad de la carrera. Evalúa acciones y ejecuta la de mayor utilidad con desempate estable. Cada rival tiene un intervalo normal de tres jornadas; los asientos vacíos y las crisis se revisan diariamente. Un fichaje nuevo no se vuelve a captar automáticamente durante sesenta días. La IA no accede al potencial oculto, no tiene subvenciones invisibles ni toma el control de los pilotos del jugador.

Las alineaciones rivales se eligen entre unidades propias, legales, no anunciadas y disponibles. La simulación de paso fijo de la 0.1 permanece intacta. Los ingresos de taller solo se cobran al entregar un encargo real después de tres jornadas; el taller no repara y hace encargos a la vez.

Los expedientes conservan 16 decisiones recientes, el mundo 80 transferencias de activos y 30 propuestas recientes. Las compañías quebradas no se eliminan del archivo: sus pilotos quedan libres y sus activos se ponen en liquidación. Las ventas posteriores reducen su déficit sin reactivar la compañía. Las noticias enlazan el activo por ID y muestran su situación actual, aun cuando haya cambiado de propietario desde la publicación.

## Taller y esquema 3

Los vehículos añaden `base`, `components`, `installed`, `oemTires` y `upgradeValue`. Los atributos base anteriores se conservan. La configuración deriva potencia, masa, agarre, frenada, punta y fiabilidad a partir de las unidades instaladas. Los efectos de prestaciones se atenúan con el estado de la pieza; masa y penalizaciones estructurales no desaparecen mágicamente por desgaste. La condición mecánica global se resume a partir de seis sistemas; los neumáticos se mantienen por separado. Un sistema crítico por debajo del 30 % impide inscribir aunque el promedio sea aceptable.

Cada unidad de `parts` tiene ID, definición, compañía, coche, reserva y condición. Propietario nulo y coche nulo significa stock del proveedor. Compañía sin coche significa almacén; con coche significa instalada. Una reserva referencia exactamente un trabajo de montaje. La validación comprueba unicidad, propiedad, alojamiento, dependencia, capacidad y correspondencia de las reservas. No se generan unidades al comprar o cargar: el proveedor parte de cuatro por definición y puede recomprar repuestos usados con su saldo persistente.

`car.repair` conserva el bloqueo de taller ya usado en 0.1/0.2 y ahora representa revisión, reparación focal, instalación o desmontaje. Al iniciar se validan todas las condiciones y se abona mano de obra; la pieza se reserva y la configuración no cambia hasta finalizar. La entrega diaria es idempotente. Una sustitución devuelve la pieza anterior; un desmontaje reserva una plaza de almacén incluso antes de producir la devolución, evitando que nuevas compras ocupen su espacio. El coche no se vende ni compite mientras está en trabajo. Las modificaciones requieren retirar antes la inscripción; la revisión básica anterior sigue disponible.

Los neumáticos tienen dos historias de desgaste: el juego de serie apartado (`oemTires`) y la unidad modificada. Al desmontar vuelve el estado de las gomas originales. La renovación de caucho es un servicio pagado que restaura la condición del conjunto instalado y recalcula el agarre; no añade una segunda unidad al inventario. Las revisiones de otros sistemas restauran únicamente los componentes base, conservando la condición de las mejoras.

Las carreras nuevas guardan `mechanicalVersion: 3`, una copia de componentes, temperatura y desgaste por ID de pieza. El modelo de paso fijo calcula fuerza de frenado, apoyo, aceleración y comportamiento térmico usando esa configuración. La carga de motor aumenta el calor y el desgaste; el radiador y su condición influyen en su evolución. La fiabilidad afecta al desgaste de motor y la sobretemperatura reduce el rendimiento. Al finalizar, daños y condiciones vuelven a las entidades persistentes y se recalculan prestaciones y valoración de mejoras. Las compras de coches transfieren también la propiedad de sus piezas instaladas, sin mover repuestos almacenados.

La migración 1→2→3 valida cada estado anterior y añade los campos de mecánica sin regenerar los activos de 0.2. Una carrera antigua en curso conserva el algoritmo anterior hasta terminar; después se aplica su resultado a los nuevos sistemas y las carreras posteriores usan componentes. Las fixtures auténticas de ambas versiones verifican los resultados finales exactos. Las revisiones antiguas reciben un ID de trabajo conservando fin y coste ya pagado. El esquema 3 se serializa sin repetir la inicialización.

La IA compara piezas compatibles que realmente existen, considera su reserva salarial y plazo hasta la prueba, compra la unidad y la instala en una decisión posterior. No paga una mejora ficticia ni recibe prestaciones antes de que termine el taller. Los objetivos generales de la 0.2 y la negociación del jugador se conservan.

## Presentación y tráfico de la 0.3.1

Las nuevas salidas añaden `racingVersion: 1`, manteniendo el esquema de guardado 3 y las claves de las ranuras. Una carrera en curso sin esa marca conserva su algoritmo anterior. La fixture del commit 0.3 demuestra igualdad exacta de resultados al terminarla. No se regeneran coches, piezas, compañías, finanzas ni contratos.

El tráfico usa desplazamiento lateral, longitud, anchura y orientación en metros sobre el circuito. Los pilotos anticipan frenadas, huecos y defensa; la separación iterativa evita interpenetración en contactos múltiples. Los impactos reducen velocidad y desgastan componentes. Los errores dependen de control, consistencia, disciplina, rasgo, gomas, velocidad y curvatura. Las amarillas tienen sectores y duración, y los abandonados se apartan sin teletransportarse. Todo usa el RNG persistente y el paso fijo de 0,05 s. Eventos limitados a 80, mensajes a 30 y zonas de peligro a ocho; los resultados guardan contadores y hasta doce momentos destacados.

`render.js` transforma la geometría del motor a metros y conserva proporciones entre coches y ancho de pista. Dibuja el paisaje estático en caché (máximo dos circuitos y 3072 px en el lado mayor); las cámaras y efectos visuales no consumen el RNG del juego ni alteran su estado. Las tres cámaras comparten escala, foco y zoom; TV selecciona batallas o incidentes, mientras seguimiento respeta el piloto elegido.

`sound.js` crea audio mediante Web Audio solo tras activar el control. El ruido usa una semilla propia y los impactos proceden del registro real de carrera. La pausa, pestaña oculta y salida de carrera silencian la mezcla. El audio no forma parte de la partida.

La UI mantiene navegación con etiquetas y acciones por `data-action`/`data-go`. Las secciones, búsqueda y filtros de taller se actualizan sin reconstruir la página para conservar foco y desplazamiento. Cámara, sonido y filtros son preferencias de presentación; no modifican las transacciones ni los participantes.

## Contratos y crédito de la 0.4

`contracts.js` añade `s.commercial` con su propia versión 1: proveedores, convocatorias, acuerdos, negociaciones, relaciones, banco, préstamos y calendario de cuotas. Conserva el esquema 3 y las ranuras anteriores. `createGame` inicializa el bloque después del mundo y del taller; importar lo añade tras validar y migrar el estado anterior. No consume RNG ni reescribe activos. La fixture auténtica del commit `bb644b1` verifica el resultado exacto de una carrera 0.3.1 reanudada.

Las propuestas no transfieren dinero. La firma revalida propietario, disponibilidad, capacidad, exclusividad, convocatoria y fondos; reserva anticipo, cuotas y prima final en el presupuesto finito de la marca. Un vehículo financiado recibe capital y se compra mediante la misma operación de mercado que cualquier otra unidad. La reserva del contrato financia las cuotas; el sobrante se devuelve al liquidar. Las rondas evaluadas se registran por ID, evitando duplicados al terminar o cargar. La bancarrota también liquida reservas y conserva obligaciones.

`Race.finish` evalúa acuerdos y cláusulas después de registrar participantes, premios y puntos. Los requisitos de piezas usan la configuración que disputó la prueba; modelo y piloto se contrastan con el resultado. Se registran rondas conformes, causas de no pago, actos, coste de salida y liquidación final. Una participación con DNF satisface presencia; una ausencia no. Los acuerdos solo abarcan las rondas pendientes al firmar. Al abrir otra temporada se crean nuevas convocatorias una vez, con los fondos remanentes.

Los préstamos transfieren capital desde el banco a la compañía. El calendario desglosa principal e intereses en tres o seis vencimientos; las cuotas liquidadas se marcan para no cobrarlas dos veces. El procesamiento diario reintenta las vencidas, registra un único impago/recargo a los catorce días y mantiene el crédito bloqueado hasta saldar. Amortizar condona el interés futuro y conserva el historial. Finanzas diferencia entradas/salidas de caja y deuda: recibir un préstamo no representa beneficio operativo. Las cuotas próximas se incluyen en la previsión y en la reserva presupuestaria de IA.

Las cláusulas de pilotos se guardan dentro de su contrato. Su propuesta salarial pondera rol, prima de victoria, meses de rescisión, promesa y opción. Las rondas se registran una sola vez; la prima de victoria se paga del saldo real y la promesa se evalúa al completar sus rondas o liquidar el contrato. La moral se conserva en las nuevas parrillas y modula suavemente el ritmo; las carreras previas que no la incluyen usan el valor neutral. Renovar mantiene lo devengado y las obligaciones.

`ui-contracts.js` añade la dirección comercial, negociación con revisión final, seguimiento, banco, cuotas y archivo. Usa la misma navegación y componentes del rediseño. Los compromisos se confirman mediante los diálogos del juego y las noticias enlazan al acuerdo o préstamo real. Ninguna operación contacta bancos, fabricantes ni anunciantes reales.

## Fin de semana y grabación de la 0.5

`race-weekend.js` inicializa `raceSupplies.version = 1` sin consumir RNG ni regenerar entidades. Contiene stock, combustible de boxes, unidades identificadas, fecha de reposición y última grabación. Los juegos se reservan para un evento, se usan y vuelven con condición o se descartan; su estado excluye doble montaje. Las compras transfieren dinero al proveedor real de piezas. Sus reposiciones periódicas tienen coste y control de fecha. El esquema global sigue siendo 3; las claves de guardado se conservan.

Cada salida nueva guarda `weekendVersion: 1`. Los hooks del paso fijo añaden clima, compuesto, combustible, boxes y VSC; si falta la marca se ejecuta el modelo anterior. La fixture del commit `2bc6a4f` prueba igualdad exacta del estado final 0.4, incluidos resultados, saldos, contratos y activos, exceptuando el nuevo bloque vacío de suministros.

La geometría de boxes se calcula en metros con la misma transformación que el render: entrada al 10,5 % del trazado y salida al 27 %, con desvío lateral sinusoidal de 19 m. La parada guarda entrada, puesto, salida, fase, juego reservado, combustible, reparación, tiempo restante, limitador y factura. El carril se procesa fuera del tráfico de pista; mantiene separación longitudinal, cola y espera de reincorporación. El coche se detiene para el servicio y no gana progreso mientras lo recibe. Los retirados se apartan hacia el borde del carril.

Los neumáticos de calle y los de competición mantienen historias distintas. Las gomas apartadas conservan condición y pinchazo, y sus piezas no se desgastan por estar almacenadas. Al liquidar se devuelve al coche su conjunto de calle real; las condiciones de los juegos de carrera quedan en sus unidades. La reparación rápida solo altera tres componentes base y conserva la condición de las mejoras. Las sanciones se registran, se sirven o se suman al tiempo de meta una sola vez.

La lluvia evoluciona hacia objetivos temporales reproducibles y la superficie se moja/seca por integración de paso fijo. El plan usa una semilla independiente derivada de la partida/evento, por lo que cambiar la compra inicial no vuelve a sortear el tiempo. El grip combina compuesto, agua, temperatura y adaptación; también afecta frenada y riesgo. El consumo depende de distancia, carga y orden, con avisos y abandono al agotar el depósito.

La grabación conserva metadatos y tuplas compactas de estado de todos los coches, meteorología, banderas y acontecimientos. Se muestrea inicialmente cada 0,5 s y se reduce adaptativamente al superar 480 fotogramas. Se mantienen hasta 120 eventos y una grabación terminada; no se guarda un segundo mundo ni se vuelve a simular. El visor interpola estados entre muestras y conserva los tiempos de meta. Cámara, velocidad del visor y búsqueda viven fuera de la partida, pausando y restaurando el directo. El vídeo no ejecuta física, pagos ni contratos.

`ui-race-weekend.js` amplía inscripción, telemetría, órdenes, almacén, resultados y Competiciones. El formulario de boxes conserva foco y valores durante actualizaciones. La repetición usa un Canvas propio con controles de tiempo y selección de momentos. Las partidas antiguas en carrera mantienen su interfaz compatible y reciben estas opciones en la siguiente salida.

## Instalaciones, progresión y archivo de la 0.6

`facilities.js` añade `s.expansion.version = 1` sin consumir RNG ni IDs durante la inicialización. Contiene una constructora con saldo, una sede por compañía y un archivo deportivo. Cada sede registra niveles construidos, capacidades base migradas, una obra, última revisión, máximo nivel empresarial, contador de crisis y 40 movimientos recientes. Se conserva el esquema global 3 y las claves de las ranuras.

La cotización comprueba fondos, actividad, nivel, instalación y obra existente antes de mover dinero. Contratar paga el coste completo a la constructora y asigna un ID único a la obra. La capacidad cambia únicamente cuando `Facilities.complete` entrega el proyecto, al inicio de una jornada. Los bloques ya construidos siguen operando durante las obras. Cancelar devuelve `floor(coste × 0.5 × fracción pendiente)` desde la constructora; elimina el proyecto y conserva el nivel anterior. La bancarrota usa esa misma liquidación sin reactivar la empresa.

Garaje, oficina y almacén derivan sus capacidades de los valores base conservados y los niveles construidos. Taller deriva bahías y multiplicador de plazo. `Workshop.available` y `Economy.job` comparten `Facilities.workload`: cada reparación/montaje y el encargo ocupan una bahía. El coche con trabajo propio permanece bloqueado incluso si hay otra plaza. Las fechas se fijan al contratar, usando el equipamiento actual; ampliar después no reescribe trabajos. La IA consulta el mismo aforo y puede realizar una ampliación como una de sus decisiones por utilidad, con su presupuesto real y reserva de mantenimiento.

La conservación se cobra como operación diaria desde la entrega; la previsión mensual incluye treinta días adicionales. La UI monetaria admite centavos para reflejar importes como $0.50/día. El patrimonio de desarrollo y Finanzas incluye coches, repuestos almacenados y una valoración conservadora de las ampliaciones, restando capital bancario pendiente y nóminas devengadas. Un préstamo no aumenta por sí solo ese patrimonio.

La revisión diaria de nivel es idempotente por fecha, considera objetivos económicos/deportivos y permite como máximo un cambio, con 90 días entre ascensos. La crisis cuenta 90 jornadas consecutivas de poca caja y baja reputación, reiniciándose cuando deja de cumplirse. El descenso no reduce instalaciones ni capacidades. Los desbloqueos construidos permanecen; futuras ampliaciones siguen sujetos al nivel actual.

Al cerrar una temporada, `Facilities.archiveSeason` copia clasificaciones de equipos/pilotos y seis resultados por ronda con nombres y modelo de coche, antes de reemplazar `s.season`. No copia simulación ni fotogramas. Se identifica por año y no vuelve a pagar ni modificar la temporada al consultarlo. La apertura de otra temporada y la migración de una temporada ya completa pueden llamar a esa misma operación sin duplicar registros. Los resúmenes de `s.history` anteriores se mantienen; sus rondas ausentes no se reconstruyen. El visor utiliza instantáneas, conservando los nombres aunque cambien las entidades actuales.

La validación incluye IDs únicos de obras, plazos/costes, nivel físico, capacidad derivada, titular de sede, crisis y estructura histórica; comprueba también que los puntos de pilotos correspondan a las rondas guardadas. Las fixtures auténticas de 0.5 verifican el estado final completo de una carrera anterior, exceptuando el nuevo bloque `expansion`. La excepción de migración 0.4 se amplía únicamente para ignorar ese mismo bloque; se mantiene la comparación íntegra de la economía y la simulación anterior.

`ui-facilities.js` incorpora gestión de obras, revisión de inversión, metas de nivel, diario de desarrollo, panel de sede y consulta de temporadas. Las acciones de lectura no mutan la partida. `render.js` conserva el mapa con edificios ampliados, almacén, niveles y señalización de obras. Personal, academia, automatización e investigación todavía no son sistemas implementados.

## Personal y obligaciones de la 0.6.1

`staff.js` incorpora `s.staffing.version = 1` y entidades reales en `s.employees`. Inicializa una vez un mercado laboral de cinco especialidades, con 25 candidatos, mediante un RNG derivado de la semilla y un contador propio persistente. Los prefijos `employee`, `scoutjob` y `staffdebt` pertenecen a ese contador; el registro global de validación comprueba su unicidad junto al resto del mundo. Crear/importar este bloque no consume el RNG ni el contador global anterior. No se regeneran profesionales al cargar.

La oficina determina `Staff.capacity`, inicialmente dos empleados y dos plazas adicionales por ampliación. Hay un responsable por especialidad. La oferta valida actividad, disponibilidad, aforo, especialidad, términos y prima/reserva antes de mutar. Una propuesta insuficiente deja contraoferta y memoria; las aceptadas pagan solo la prima y conservan el contrato. Renovar amplía su vencimiento sin borrar devengo/atrasos. Rescindir paga obligaciones y un mes de indemnización, bloqueándose si la persona apoya un trabajo de taller.

`Staff.daily` tiene un control de fecha. Devenga salarios y el día 1 los convierte en vencidos; los paga solo con caja suficiente. Los vencidos permanecen en el contrato hasta abonarse. Una salida automática liquida el salario o crea una deuda `staffdebt` si falta caja; no se pierde esa obligación al liberar al empleado. `Economy.assess` considera descubierto o nóminas de personal sin pagar para el plazo de insolvencia. `Staff.liability` se integra en el patrimonio y reserva de IA, y `Staff.monthly` en la previsión. La liquidación manual valida la caja para el total antes de abonar. La bancarrota cancela informes y libera las referencias de trabajadores a encargos antiguos.

La convivencia utiliza vínculos canónicos por pareja, actualizados una vez por jornada según personalidad y trabajo en equipo. Su cohesión, motivación, lealtad y atrasos modulan el rendimiento, sin usar RNG global. Los conflictos se anuncian una vez por vínculo y conservan recuerdos. Hay crecimiento profesional lento, cumpleaños, retiro a los 65 y dimisión por desmotivación prolongada. Se conservan 24 recuerdos por persona, 160 vínculos recientes y 80 evaluaciones terminadas más las activas; las deudas impagadas no se descartan al limitar el archivo de pagos.

`Staff.plan` consulta disponibilidad real y devuelve plazo y `staffSupport`. El taller y los encargos reservan implícitamente al empleado referenciado en el trabajo, evitando dos asignaciones simultáneas. Solo se seleccionan contratos que cubren el plazo; sin especialista libre se conserva el servicio anterior. Ampliar o contratar después no altera vencimientos. Al completar se registra una contribución. Se corrige la validación heredada que aún imponía una sola bahía, usando el aforo realmente construido.

Las carreras nuevas guardan `staffVersion = 1` y apoyo numérico por participante, capturado después de crear la salida. La preparación del ingeniero reduce temperatura objetivo y desgaste del motor. Mecánico y estratega reducen como máximo un 25 % el servicio de boxes, sumándose después la sanción completa. No cambian piezas, cobros ni prestaciones persistentes por abrir una ficha. Las carreras antiguas no reciben el marcador ni las bonificaciones; las fixtures 0.6, 0.5 y 0.4 mantienen el estado final anterior, excluyendo únicamente los nuevos bloques y la nueva lista de empleados.

Las evaluaciones son encargos identificados con gastos, plazo, ojeador, piloto y estimación obtenida con el RNG propio. El resultado no se recalcula al recargar y la UI solo lo muestra al completarse. Finalizar el contrato interrumpe los encargos pendientes. Los entrenamientos de pilotos conservan su pago, fatiga y límite de potencial; el entrenador solo multiplica el progreso de las sesiones ejecutadas.

`ui-staff.js` añade cuatro secciones, perfiles, negociación, renovación, ojeo, vínculos, deudas, enlaces desde noticias/pilotos y apoyo en telemetría. La IA de compañías evalúa contratación, renovación y ajuste de nómina como acciones con coste real, y la de instalaciones reconoce el aforo de personal al ampliar oficinas. La academia, delegación, I+D y las restantes especialidades siguen pendientes.

## Especialistas y sesiones de la 0.6.2

`professionals.js` añade `s.professional.version = 1`: perfiles por ID con nivel 1–10, XP, estrés, descanso, rapidez individual y contribuciones observadas; estado médico del piloto; peticiones salariales, ofertas rivales, diagnósticos, ajustes y CVs. No reescribe entidades anteriores. Inicializa sin consumir RNG ni IDs globales. Los sucesos nuevos tienen RNG e IDs propios; las noticias y los pilotos nuevos utilizan sus contadores canónicos. Los valores de rendimiento y salario consultan perfiles; tareas activas, descanso y plazos impiden asignaciones incompatibles. El proceso diario es idempotente y recorta archivos terminados conservando pendientes.

Las peticiones salariales conservan devengos al cambiar el sueldo. Las ofertas rivales capturan una decisión aleatoria persistente: comprueban especialidad, capacidad, salario y reserva de cuatro meses antes de pagar compensación y liquidar el contrato anterior. La misma persona firma con el nuevo dueño. Una contraoferta actualiza el salario sin borrar obligaciones. Salidas invalidan peticiones/ofertas pendientes. Los CVs introducen pilotos reales con la misma API de generación y limitan el mercado a veinte candidatos libres; tras 90 días un descubrimiento no contratado caduca, conservándose la identidad. Los informes contienen intervalos cuyo porcentaje representa cobertura probabilística, no distancia porcentual al potencial.

`practice.js` guarda las sesiones dentro del bloque profesional. `quote` es una consulta sin mutaciones con previsión acumulada de riesgos por vuelta. `tick` simula paso fijo con aceleración/frenada, límites del circuito, desgaste, neumáticos, tiempo y RNG propio. El nivel y estrés del entrenador definen capacidad efectiva capturada. El riesgo utiliza estrés/fatiga y control del piloto. Las lesiones y el retiro deportivo solo surgen de incidentes confirmados. `finish` aplica kilometraje, desgaste, mejora y contribuciones una vez, avanza una jornada y conserva consecuencias médicas. No crea resultados deportivos ni premios. Una sesión activa bloquea calendario, carrera y venta/rescisión de sus participantes; el mismo entrenador no apoya otro trabajo.

`pit-crew.js` marca solo carreras nuevas con `professionalVersion = 1` y captura mecánico, ingeniero, estratega y estrés del piloto. Añade decisiones de ritmo/boxes con errores según nivel/estrés, prioridad temporal de órdenes manuales y control automático opcional. Las decisiones utilizan la misma compra/reserva y caja finitas de `RaceWeekend.requestPit`. El estrés modifica errores de conducción. La preparación anterior del ingeniero y el coordinador sigue vigente.

Al detenerse en el puesto, nivel, rapidez individual y estrés determinan éxito/duración del mecánico. Sin mecánico o con fallo, el jugador recibe una máquina de estados manual: elevación, cuatro ruedas con cuatro fijaciones cada una, bajada y comprobación. Los movimientos tienen tiempo mínimo y las secuencias erróneas añaden demora. El coche no progresa hasta terminar; el resto de la carrera sigue tickando. Los rivales añaden una demora automática si falta o falla el equipo. La sanción se suma después de modificar el servicio; en modo manual el tiempo real detenido ya cuenta para cumplirla. Guardar conserva herramientas, ruedas, tiempos y RNG.

`ui-professionals.js` amplía fichas, diagnóstico, solicitudes, pista y controles de carrera. `App.frame` ejecuta entrenamiento aunque se navegue a otra pantalla; la pestaña oculta lo pausa, y cargar una sesión la abre pausada. Los formularios muestran riesgos y coste antes de confirmar. Un `Render.track` sin carrera permite la pista vacía. El seguimiento de práctica fija la cámara al coche en cada fotograma para conservarlo visible también a ×20; la retransmisión de carreras mantiene su interpolación anterior. El guardado cada cinco segundos se aplica también a prácticas. Los validadores rechazan referencias huérfanas, valores no finitos, niveles y estados manuales incompatibles.

Se conserva esquema de sobre 3 y clave de almacenamiento. Una carrera guardada sin `professionalVersion` continúa con el algoritmo anterior, sin introducir minijuego ni decisiones nuevas a mitad. La fixture auténtica 0.6.1 en boxes reproduce resultados y estado final completo, excluyendo solo el bloque profesional aditivo. Las fixtures de versiones anteriores siguen verificándose. Las otras profesiones, academia, I+D, automatización empresarial general y balance de décadas continúan pendientes.

## Gerencia, delegación y medicina de la 0.6.3

`operations.js` incorpora `s.operations.version = 1`: políticas, presupuestos mensuales, registro de decisiones, fecha de evaluación, formación realizada, episodios de lesión y tratamientos. Añade gerente/médico a los roles de `Staff`; los diez candidatos iniciales nuevos usan `specialist-*` con el RNG y contador de operaciones. El generador admite una fuente explícita conservando la ruta anterior sin cambios. No consume RNG ni contador de personal/globales al migrar, y `Professionals` crea sus perfiles canónicos. Las contrataciones, nóminas, vínculos, descanso y ofertas rivales siguen las mismas reglas. La reposición de nuevas especialidades se consulta cada sesenta días con el RNG adicional.

`Operations.plan` y sus cotizaciones son lecturas puras. `run` evalúa una vez por fecha, replanifica antes de cada acción y comprueba caja, límites global/área/día, reserva, stock, propiedad, aforo, condición, disponibilidad y calendario. Utiliza `Workshop.repair/buy/install`, `Economy.tires/job` y `Staff.scout`, sin inventarios ni cobros paralelos. Registra el débito real y lo compara con la cotización. Las prioridades son configurables; capacidad depende de nivel, habilidad efectiva, estrés y motivación del gerente. No modifica inscripciones. Trabajos de montaje/reparación deben dejar una jornada antes del próximo evento.

Los gastos consumidos se guardan por mes de calendario y área, separados de los ajustes de política. Guardar, desactivar o modificar topes no los reinicia. Son contadores de gasto realizado, no dinero reservado. La reserva usa mínimo de caja más la previsión mensual multiplicada por los meses elegidos. Nóminas vencidas suspenden toda delegación. Se conservan 24 meses y 160 entradas recientes de actividad. Las consultas no consumen RNG ni alteran estos registros.

`Calendar.advance` procesa medicina tras la jornada de personal, después formación básica y luego operaciones, antes de IA/solvencia/progresión. Los pilotos seleccionados para formación delegada se excluyen de la cuota/formación básica, incluso si la delegación está pausada o falta gerente; se preserva el descanso y se impide un cargo oculto. La política requiere entrenador apto, contrato, presupuesto y descanso por estrés/fatiga/carrera. Aplica una sola sesión de $18, progreso limitado por potencial y carga física real. Una orden manual retira al piloto de la lista delegada. Tampoco se entrena al piloto que acaba de completar una práctica en esa jornada.

Los tratamientos capturan médico, paciente, episodio, fecha, coste, precisión, reducción máxima y sorteo persistente. Se pagan al contratar, ocupan al médico dos jornadas y se resuelven una vez. El acierto reduce 1–4 días como máximo, respetando el plazo natural y al menos una jornada pendiente; el fallo no altera recuperación. Un mismo episodio no admite varios intentos. `Practice.finish` crea una clave nueva para cada lesión y las importadas reciben una clave estable. Médico y paciente no pueden ser despedidos/traspasados durante el curso; la bancarrota o salida obligada cancela su actividad sin borrar gastos ejecutados. El retiro deportivo definitivo no se revierte.

`ui-operations.js` aporta Delegación, Actividad/gastos y Salud, con vista previa, confirmación de topes, lista autorizada de piezas, pacientes y resultados. Finanzas enlaza presupuesto y caja reales; fichas de pilotos explican el control delegado y permiten abrir salud. `storage.js` añade IDs y validación de políticas, presupuestos, registros, contador, personal y casos médicos al esquema de sobre 3 existente.

Las fixtures auténticas 0.6.2 se capturaron antes de editar el motor: una carrera con dos tuercas aflojadas y una práctica en marcha. Tras completar las mismas acciones reproducen exactamente estado/resultados anteriores, excluyendo solo el bloque de operaciones y sus diez candidatos/perfiles añadidos. También se conservan las fixtures previas. Academia, centros especializados ampliables, investigación y otras profesiones no se consideran implementados por esta ampliación.

## Dificultad y conducción de la 0.6.4

`content.js` añade modelos, nombres, nacionalidades y temperamentos conservando los índices históricos. `challenge.js` envuelve la creación de partidas nuevas con `challenge.version = 1`, un RNG independiente, salarios diarios, progresión de candidatos y reservas fiscales de la IA. `Pay` convierte explícitamente cuotas diarias a equivalentes mensuales para presupuesto, traspasos e indemnizaciones. Los débitos diarios se realizan por las rutas contables existentes; las carreras antiguas no reciben el marcador. `createLegacyGame` queda disponible para regresiones de versiones previas.

`rubber.js` amplía compuestos con variantes de marca, cotizaciones, desgaste/agarre y previsiones. No crea un almacén paralelo: usa reservas, juegos, proveedor y stock de `RaceWeekend`. `racecraft.js` aporta una geometría métrica común, anticipación de curvas, reacción persistente, elección de huecos, fatiga y errores graduados. Solo las carreras marcadas usan los nuevos coeficientes. El cerebro se guarda y valida; la repetición lleva el marcador que habilita los índices de compuestos nuevos.

`art.js` dibuja retratos y variantes de coches/piezas de forma pura, sin consumir RNG de estado. El render consulta geometría de la misma pista para orientar carrocería y ruedas; la ubicación de tribunas/edificios valida huellas completas contra pista y boxes. `ui-challenge.js` presenta negociación con presupuesto vivo y conserva el formulario/las cláusulas usados por los motores de contrato. La telemetría dispone filas propias para apoyo profesional e intención, evitando colisiones entre velocímetro, identidad y diagnóstico.

`challenge.test.cjs` utiliza explícitamente `engine({current:true})`; las suites anteriores usan el constructor histórico para conservar su contrato de regresión. `browser-challenge.cjs` funda una partida con el constructor actual y prueba salarios diarios, contratación, inscripción con marca, carrera/boxes, guardado y adaptación. `scripts/check-balance.cjs` ofrece la simulación anual reproducible adicional. No se infiere equilibrio a largo plazo a partir de la compatibilidad anterior.


## Competiciones y diseños 0.7.0

`circuits.js` compila dieciséis trazados métricos originales y adapta pista/boxes para los índices nuevos; los seis anteriores permanecen disponibles para guardados. `competition.js` construye el calendario de veinte eventos, valida ligas, acceso, puntos, tasas, técnicos, finales y trayectoria; separa el constructor 0.6.4 para pruebas históricas. Los eventos archivados guardan copa/final y validan la ronda dentro de cada copa.

`performance.js` captura base/componentes/unidades instaladas, actualiza aportaciones con desgaste/daño, añade apoyo dependiente de velocidad y temperatura de frenada. `driving.js` almacena muestreo de geometría, anticipa frenada y compromisos de adelantamiento, estima necesidad/coste de boxes y aplica muros/sanciones. Su estado de decisiones y rendimiento se serializa y valida; la carrera antigua evita esas ramas.

`vehicle-designs.js` añade dieciséis modelos al final y comparte perfiles geométricos entre SVG y Canvas, con caché visual independiente del RNG. `vehicle-renderer.js` dibuja el catálogo con sus dimensiones relativas. `venue-renderer.js` prepara escenas de calle/parque/costa/desierto/bosque y puestos individuales. `ui-competition.js` muestra ligas, atlas, requisitos, costes, progreso y efectos de piezas en vivo. Los juegos nuevos usan todo el catálogo; el constructor histórico conserva su stock original de 24 modelos.


## Investigación y campus 0.8.0

`research.js` añade el rol científico con contratación/nóminas compartidas, árbol de nueve nodos y bloque de versión 1. Conserva la compatibilidad con el marcador antiguo `research: []`. Materiales se pagan al iniciar; `Calendar.advance` procesa una jornada de proyecto por fecha y conserva progreso al pausar/reasignar. Beneficios completados se consultan por clave y se conectan con recuperación, formación, diagnóstico, equipo de boxes y snapshot de desgaste. El constructor 0.7 queda como `createV70Game` para escenarios históricos. La actualización de empresas existentes es explícita, sin carrera/práctica antigua en curso.

`camps.js` conserva la práctica antigua y crea programas con `calendarVersion: 1`, reservas de entidades, días/carga, RNG y un informe de deltas reales. El calendario permite gestionar jornadas con un programa activo; las acciones que usan sus entidades siguen bloqueadas. Una jornada procesa el tramo de vueltas, desgaste, fatiga/estrés e incidente. Ver la animación no llama al tick real ni modifica el estado: `ui-development.js` dibuja un snapshot efímero, muestra el plan/árbol y presenta el informe al finalizar. No hay avance recursivo ni jornada extra al entregar resultados.

`content-expansion.js` añade 24 modelos y 16 trazados mediante el compilador métrico existente, conserva prefijos, dificultad/categorías y rota el calendario por año. Las partidas antiguas conservan su calendario hasta la siguiente temporada. Los escenarios históricos de pruebas fijan explícitamente constructor y prefijos 24/40 modelos y 16 trazados; el escenario de desarrollo usa 64/32.


## Taller visual 0.9

`coachwork.js` amplía el catálogo físico y añade compatibilidad de preparación y metadatos derivados de `car.installed`. La cotización valida compra y mano de obra antes de gastar; `Workshop` conserva las transacciones, reservas, devolución y entrega por calendario. La vista previa consulta una configuración alternativa sin modificar el estado. `createV80Game` permite fijar la regresión histórica; el constructor público activa el bloque `workbench.version=1` de manera idempotente.

`coachwork-art.js` genera la vista lateral y usa el mismo render superior del garaje; extiende SVG/Canvas para carrocerías y conjuntos instalados. El ancho adicional entra en participantes y metadatos de repetición al arrancar una carrera nueva. `ui-workbench.js` sustituye el taller cuando está activado, y conserva el anterior para guardados históricos. Usa botones y arrastre con confirmación, filtros de DOM sin perder el foco y estadísticas comparadas. `css/workbench.css` limita el estilo a esa pantalla; en móvil coloca las estadísticas después del coche y antes de las tarjetas.

El bloque nuevo se valida contra las piezas instaladas y la propiedad física. Guardados sin marcador no cambian de reglas al importar; abrir Taller en una empresa 0.8 lo activa sin tocar trabajos ni entrenamiento. Tres fixtures auténticas comprueban continuidad exacta de carrera, montaje y campus de la 0.8. [Reglas y alcance](TALLER_VISUAL_0_9.md).


## Subastas 0.10

`auction-content.js` registra doce plataformas reservadas a subastas y cuarenta familias de piezas procedurales. Las definiciones `auc1` se reconstruyen por plantilla, modelo, serie y semilla; conservan su fórmula al guardar y no entran en `Parts.catalogue`. Los generadores de mercado omiten las plataformas exclusivas. `auction-art.js` extiende las ilustraciones SVG/Canvas con acabados y certificados.

`auctions.js` gestiona lotes, doce cuentas externas, participantes rivales, ofertas vinculantes, reserva de fondos/capacidad, reloj de décimas, adjudicación y comisión. Los lotes de la casa conservan una ficha hasta adjudicar: el objeto físico se crea una vez; al revender una unidad existente se transfiere su mismo identificador. El RNG es privado y persistente. La propiedad de colecciones externas se valida y se excluye del stock ordinario; las empresas rivales usan sus presupuestos e inventario normales y pueden instalar lo adquirido. La casa conserva contabilidad de entradas y pagos, y las carteras externas concilian capital, ingresos y compras.

`Calendar` procesa vencimientos y rotación semanal por jornada. Una sala activa bloquea el calendario y las reservas impiden gastar caja/plazas comprometidas. `ui-auctions.js` actualiza la cuenta sin reconstruir la pantalla en cada décima, conserva foco y guardado y ofrece inspección/consignación/sala/adjudicaciones. El controlador reabre una sala guardada y conserva la pantalla de resultado al cerrar. Se pausa al ocultar la pestaña y no se adelanta tiempo fuera de la aplicación. `css/auctions.css` adapta tarjetas, postores y controles a escritorio/móvil. El constructor 0.9 queda disponible como `createV90Game` para regresión.


## Guía de inicio 0.10.1

`tutorial.js` gestiona once capítulos y diecisiete pantallas reales, con foco acotado al diálogo, fondo inerte, índice y resaltado adaptable. El recorrido cambia solo la vista de la interfaz; evita `App.go` para no ejecutar activaciones al mostrar funciones pendientes de una partida antigua. No añade campos al estado de simulación ni al formato de exportación.

La preferencia `rcs.tutorial.v1` se guarda fuera de las ranuras. Solo una fundación nueva en un perfil sin historial inicia automáticamente el recorrido. Un guardado existente marca el perfil como jugador que vuelve. El estado pendiente identifica semilla/ranura y paso; una carga coincidente reanuda y una actividad en vivo impide tomar el control. Terminar u omitir persiste la decisión para futuras compañías. La consulta manual no vuelve a habilitar el arranque automático. Se escriben preferencias con revisión en almacenamiento local y de sesión y se lee la más reciente; si ambos fallan, se conserva la decisión en memoria durante la sesión.

`App` añade puntos de entrada al fundar/cargar/renderizar y en Partidas y opciones. `css/tutorial.css` adapta el diálogo y el resaltado a escritorio/móvil y movimiento reducido. La prueba de navegador compara el estado completo antes/después de todas las vistas, incluidos sistemas pendientes de guardados anteriores.

## Suministro y palmarés 0.11

`weekly-content.js` registra doce plataformas de concesionario al final y resuelve definiciones semanales deterministas sin insertarlas en el catálogo global. `commerce.js` mantiene semana/fecha, existencias físicas, concesionario y CV con prestigio; integra la renovación con `Challenge.daily`, el calendario y el ojeador. La activación es explícita al abrir áreas de gestión compatibles; cargar y el tutorial son lecturas sin migración automática. `trophies.js` enlaza la liquidación de grandes finales, incrementa reputación y valida los premios contra resultados actuales/archivados. `weekly-art.js` conecta la carrocería semanal con SVG y Canvas. `ui-commerce.js` añade anuncios de renovación, vitrina y controles del concesionario; las compras siguen usando Market/Economy/Workshop. `createV100Game` conserva el constructor 0.10 para compatibilidad exacta. [Reglas](SUMINISTRO_PALMARES_0_11.md).

## Atlas y calendario 0.12

`world-circuits.js` conserva los índices anteriores, añade metadatos geográficos y registra 36 geometrías mediante el compilador de `Circuits`. `season-tour.js` usa grupos por país y bloques rotativos independientes por copa, sin consumir RNG. Registra la transición de calendarios antiguos y valida que la selección corresponda a la semilla/año guardados. La activación ocurre en una empresa nueva o al crear el siguiente calendario; nunca al cargar ni al mostrar el atlas. `createV110Game` conserva el constructor anterior. `ui-world-circuits.js` implementa agrupación geográfica, filtros, búsqueda y ubicación durante la carrera; `ui-competition.js` conserva las inscripciones y dibuja también los boxes de cada pista. Los mapas, escenas y repeticiones usan los mismos índices y puntos físicos que la carrera.

## Dirección de carrera y representantes · 0.14

`driver-agency.js` añade `s.driverAgency` (versión 1), perfiles de relación, revisiones salariales y conversaciones de renovación. La personalidad se deriva de la identidad y semilla sin consumir RNG. La valoración de contratos incorpora mercado, duración, rol, prima, participación, resultados y confianza; las firmas reutilizan el pago y propiedad del motor existente. El calendario procesa peticiones una vez por día y la liquidación de carreras registra resultados recientes.

`race-director.js` añade `race.directorVersion = 1` únicamente a las nuevas carreras de empresas actualizadas. Cada participante conserva una directiva y cada orden su plan completo. La radio existente mantiene su RNG, latencia y estados de respuesta. Los parámetros se conectan con maniobras, distancia de seguimiento, velocidad, desgaste, esfuerzo mecánico, fatiga y consumo; nunca eliminan los límites físicos ni las banderas. El puente con `PitCrew.decide` conserva la decisión del estratega entre ciclos y respeta la prioridad manual.

`ui-race-command.js` distribuye la transmisión a todo el ancho y permite mover el mismo muro a una radio flotante. `ui-driver-agency.js` amplía contratación, fichas, aumentos y renovación. No se duplican formularios ni IDs al abrir/cerrar la radio. La clasificación reutiliza sus botones para que actualizar los tiempos no pierda clics o foco. `css/race-director.css` contiene estas adaptaciones y el modo ampliado.

Las empresas con gestión moderna se actualizan fuera de una actividad en vivo. Las carreras ya guardadas conservan sus reglas; las fixtures y constructores históricos se mantienen y las pruebas nuevas usan `engine({ director: true })`.
