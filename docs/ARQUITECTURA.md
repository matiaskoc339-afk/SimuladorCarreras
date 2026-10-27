# Arquitectura de la 0.3

## Un mundo, un estado

`RCS.createGame(nombre, logo, semilla)` crea el estado versionado. Las entidades tienen identificadores únicos dentro de la partida, generados con un contador persistente. Las relaciones usan esos identificadores, nunca índices de pantalla. Al cargar no se regenera ninguna entidad. La partida usa fechas UTC para que el calendario no dependa de la zona horaria del ordenador.

| Archivo | Responsabilidad |
| --- | --- |
| `js/data.js` | Catálogos extensibles, rasgos, reglamento, puntos y trazados |
| `js/core.js` | Estado inicial, IDs, RNG reproducible, consultas y eventos/noticias |
| `js/parts.js` | Definiciones, alojamientos, compatibilidad, requisitos y efectos de mejoras |
| `js/workshop.js` | Inventario físico, reservas, trabajos, configuración, desgaste y migración mecánica |
| `js/ui-workshop.js` | Diagnóstico, comparador, proveedor, almacén y controles del taller |
| `js/economy.js` | Única vía de movimiento monetario, libro de caja, servicios y mantenimiento |
| `js/drivers.js` | Currículums, atributos, negociación, contratos y evolución básica |
| `js/market.js` | Anuncios finitos y transferencias atómicas de coches y dinero |
| `js/companies.js` | Alineaciones, fichajes, compensaciones, ofertas, crisis y registro de decisiones |
| `js/ai.js` | Utilidad de acciones, reservas y personalidades empresariales |
| `js/world.js` | Inicialización, invariantes del mundo y migración del esquema 1 al 2 |
| `js/ui-business.js` | Pantallas y controladores del mercado, compañías y traspasos |
| `js/calendar.js` | Orquestación diaria, bloqueo de carreras, apertura de temporadas |
| `js/race.js` | Inscripciones, participantes, física y resultados, sin DOM |
| `js/storage.js` | Serialización, validación, checksum, ranuras y recuperación |
| `js/render.js` | Dibujos originales de vehículos, sede y circuito |
| `js/ui.js` | Presentación del estado y composición de pantallas |
| `js/app.js` | Entrada de usuario, formularios, editor Canvas, bucle y autoguardado |
| `scripts/server.cjs` | Servidor estático local, sin paquetes externos |

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
