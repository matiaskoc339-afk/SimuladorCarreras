# Arquitectura de Racing Company Simulator

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
