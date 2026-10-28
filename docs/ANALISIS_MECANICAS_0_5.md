# Comparación del prompt maestro con la versión 0.5

Estado revisado: versión `0.5.0`, commit `bf89cf3`. Especificación: [prompt original completo](PROMPT_MAESTRO.md), apartados 1–42. Este informe describe la copia local de la 0.5. Las incorporaciones posteriores de instalaciones, progresión, archivo deportivo y personal se registran en el [roadmap actualizado](ROADMAP.md) y el [README](../README.md). La 0.6.2 incorpora además [las reglas de especialistas, boxes manuales, entrenamiento y estratega](REGLAS_ESPECIALISTAS.md); este informe conserva su fecha de revisión original.

La base permite gestionar una compañía, competir durante una temporada y continuar con los mismos activos. El mayor trabajo pendiente es convertir ese equipo de Copa Club en una empresa que crezca, contrate personal y evolucione durante generaciones. También quedan requisitos parciales dentro de áreas que ya tienen una primera versión funcional.

La numeración de las entregas no permite calcular un porcentaje de finalización: una ampliación de catálogo y un sistema de empleados tienen tamaños y dependencias distintos. No se considera implementado un sistema por tener una etiqueta, un campo vacío o una pantalla relacionada.

## Criterio y evidencia

- **Funcional:** existe un ciclo jugable conectado al estado, con operaciones reales. Se indica su alcance.
- **Parcial:** existe una parte del sistema, pero faltan requisitos explícitos del prompt.
- **Pendiente:** todavía no existe el ciclo de gestión solicitado.
- **Transversal:** condición de diseño, calidad o validación que debe mantenerse en futuras entregas.

Se revisaron el prompt, los módulos de simulación y presentación, los escenarios de prueba, el roadmap y los registros de validación. La última entrega documenta 112 pruebas del motor y seis recorridos de navegador aprobados; esas pruebas verifican el alcance actual y no certifican sistemas futuros. Esta revisión no vuelve a ejecutar la batería ni modifica mecánicas.

Como comprobación puntual se simuló una carrera aislada durante 50 segundos con la semilla 810. Elevar por separado de 50 a 99 la frenada del piloto, resistencia, concentración o trabajo en equipo no cambió progreso, velocidad, neumáticos, componentes, combustible ni RNG en ese escenario. La búsqueda de usos en el código respalda la ausencia de un efecto directo de esos atributos en el motor actual; la frenada sí se usa para valorar al piloto. Esta comprobación no sustituye pruebas futuras de cada atributo en sus contextos deportivos.

## Lo que ya funciona

- Nueva partida, identidad y editor Canvas de logotipo; sede 2D con accesos a departamentos.
- Calendario diario, costes recurrentes, nóminas, seis rondas, bloqueo para evitar saltarse carreras y apertura de nuevas temporadas.
- Siete rivales persistentes: saldos, propietarios, flotas, pilotos, personalidades, decisiones por utilidad, compraventa, traspasos y bancarrota.
- Mercado usado compartido con unidades identificadas, anuncios, capacidad, pagos al vendedor e historial conservado.
- Pilotos con atributos y rasgos, potencial oculto, negociación, contratos, formación básica, fatiga, moral, promesas, renovación y ofertas rivales.
- Taller con 14 definiciones de mejoras, unidades físicas, compatibilidad, dependencias, instalación/desmontaje con plazo, siete sistemas mecánicos y desgaste que influye en pista.
- Cinco entidades comerciales ficticias, condiciones de patrocinio, exclusividad, piezas/modelos exigidos, piloto impuesto y financiación de una unidad real. Préstamos con cuotas, intereses, mora y amortización.
- Carrera visual 2D de paso fijo, tres cámaras, adelantamientos, rebufo, defensa, contactos, daños, trompos, averías y abandonos.
- Compuestos, juegos de neumáticos persistentes, combustible, clima, boxes, amarillas locales, VSC y sanción por exceso de velocidad en boxes. Repetición instantánea y de la última carrera.
- Noticias vinculadas a hechos y entidades reales; resúmenes de temporadas.
- Cinco ranuras, guardado automático/manual, exportación/importación, checksum, recuperación y migraciones de partidas antiguas, incluso durante carreras.

## Mecánicas pendientes completas

### 1. Progresión empresarial de diez niveles — apartados 1 y 6

Los diez nombres existen en `data.js`, pero las compañías empiezan en nivel 1 y no hay una operación de ascenso o descenso. Las capacidades iniciales no se amplían mediante un sistema jugable.

Faltan objetivos económicos y deportivos, requisitos de ascenso, consecuencias de una crisis prolongada y desbloqueos de instalaciones, contratos, currículums y categorías. La capacidad debe derivarse principalmente de las instalaciones físicas. El crecimiento de los rivales debe seguir reglas equivalentes.

### 2. Empleados especializados y relaciones laborales — apartado 9

`s.employees` se inicializa vacío; no hay contratación ni simulación de empleados. Los operarios dibujados en boxes no son personal contratado con identidad, salario y habilidades.

Faltan mecánicos, jefes de taller, ingenieros de motor/suspensión, estrategas, ojeadores, entrenadores, gerentes, administrativos, marketing, investigadores, directores deportivos y médicos. Cada empleado necesita atributos, contrato, motivación, lealtad, rendimiento y evolución. También faltan renuncias, retiros, ofertas rivales, conflictos, amistades y compatibilidad de grupos.

Su trabajo debe cambiar costes, plazos, información y rendimiento. La calidad del personal todavía no interviene en las reparaciones ni en los servicios de boxes.

### 3. Automatización mediante políticas — apartado 9

Faltan gerentes y reglas configurables para mantenimiento, reparaciones, entrenamiento, compras, inventario, búsqueda de pilotos y gastos menores. Cada política necesita presupuesto, límites, prioridades y registro de las operaciones ejecutadas; debe respetar fondos, stock, capacidad y compromisos deportivos.

La IA rival existente no equivale a delegación de tareas de la compañía del jugador.

### 4. Ampliación de la única sede — apartado 24

Hay una sede navegable y capacidad limitada, pero no construcción ni mejoras de instalaciones. Faltan niveles, costes, plazos, trabajos en curso y evolución visual de los edificios.

Deben incorporarse garaje, taller, almacén, ingeniería, investigación, administración, finanzas, marketing, recursos humanos, academia, centro médico, estrategia, simulación y áreas especializadas. Las pantallas actuales de garaje/finanzas no constituyen por sí solas instalaciones ampliables. Debe mantenerse una única sede.

### 5. Investigación y desarrollo — apartado 25

`s.research` se inicializa vacío. Faltan departamento, investigadores, proyectos, requisitos, presupuesto, duración, probabilidad de éxito, resultados y conocimiento acumulado.

Las ramas pedidas son motores, refrigeración, materiales, suspensión, aerodinámica, fiabilidad, eficiencia y análisis deportivo. También faltan prototipos, componentes propios, patentes ficticias, derechos tecnológicos e investigación de los rivales.

### 6. Academia y ojeo — apartados 7, 24, 29 y etapa 0.6

La formación actual permite trabajar velocidad o control por una cuota diaria. Faltan academia, entrenadores, programas juveniles, captación y desarrollo condicionado por instalaciones y personal. El potencial está oculto, pero no existen informes de ojeadores con estimaciones imperfectas.

### 7. Ranking mundial — apartado 27

La clasificación actual ordena los puntos de la Copa Club de la temporada. Falta un ranking empresarial persistente que combine trayectoria, campeonatos, reputación, prestigio, tecnología, reconocimiento de fabricantes, calidad de gestión y estabilidad financiera. Debe permitir subir y bajar, y continuar después de alcanzar el primer puesto.

### 8. Pronósticos deportivos — apartado 23

Falta el apartado opcional de predicciones con puntos sin valor monetario, comparación de expectativas/resultados e historial de aciertos. Debe ser independiente de la caja de la compañía.

### 9. Editor de personalización de coches — apartado 12

Existen dibujos originales, variantes de silueta, color de compañía, número, logotipo y marcas comerciales en pista. Falta el editor para cambiar pintura, colores secundarios, diseños, franjas, vinilos, números, colocación de logotipos, llantas y elementos visibles, conservando el mismo diseño en garaje y carrera.

### 10. Mercado completo — apartados 14 y 15

Faltan subastas con pujas reales, importaciones, concesionarios de nuevos, ofertas de fabricantes, vehículos exclusivos/de competición, coleccionistas y negociación del precio de coches. El mercado existente es de usados y ventas entre compañías a precio publicado.

Faltan precios condicionados por oferta, demanda, escasez, época e interés histórico. En repuestos faltan una oferta diferenciada de reacondicionados/exclusivos/de desarrollo propio y descuentos por relación con proveedores. La compra, recuperación y reventa de piezas usadas sí existe.

### 11. Relaciones entre empresas — apartado 5

Hay compraventa, traspasos y competencia por las mismas ofertas comerciales. Faltan alianzas, rivalidades persistentes, acuerdos técnicos, conflictos empresariales, disputas y consecuencias reputacionales específicas. Las relaciones actuales con patrocinadores no cubren esta red empresarial.

### 12. Evolución generacional del mundo — apartado 29

El calendario continúa, pero faltan lanzamientos ficticios identificados como tales, nuevas generaciones/modelos, descatalogación, cambios tecnológicos, nuevas empresas, cambios de dueño y fusiones. La bancarrota y liquidación de rivales sí existen.

También faltan clásicos con apreciación por originalidad/escasez/historial, restauraciones y competiciones históricas. Los pilotos libres que aparecen periódicamente todavía no forman un ciclo de generaciones con envejecimiento y retiro.

## Sistemas existentes que necesitan más profundidad

### Pilotos y contratos — apartados 7 y 8

- La edad y las temporadas de experiencia se generan inicialmente; no hay cumpleaños, actualización de experiencia por temporada, curva de maduración, declive, retiro ni conversión a instructor/ojeador/directivo/propietario.
- Faltan lesiones, recuperación y consecuencias persistentes de incidentes sobre disponibilidad y confianza.
- Hay cuatro rasgos básicos. Faltan trayectorias, especialidades, motivaciones, ambiciones y preferencias más variadas; representantes con identidad y comportamiento propio.
- La llegada de candidatos no está vinculada al conjunto de nivel, región, salarios, prestigio y relaciones pedido: actualmente se añade un libre cada 30 días si hay menos de cinco disponibles.
- El entrenamiento mejora velocidad/control y las carreras aumentan consistencia. Falta el desarrollo desigual condicionado por instructores, confianza, motivación, entorno y resultados.
- Hay 12 atributos definidos, pero resistencia, concentración y trabajo en equipo no tienen un uso directo identificado en la simulación actual. La frenada del piloto influye en su valoración, pero el cálculo de frenada en pista usa el coche y sus componentes. Falta conectar esos atributos con efectos verificables.
- Los contratos ya cubren salario, plazo, primas, rescisión, rol, participación y opción de renovación. Faltan demandas espontáneas de sueldo/coche/rol, relaciones entre compañeros, negativa contextual a renovar y conflictos más amplios.
- Se guardan recuerdos y existen consecuencias de moral por promesas. Falta una memoria que influya de forma más extensa en decisiones y relaciones futuras, también para empleados.

### Vehículos, taller y mantenimiento — apartados 10, 11 y 13

- El catálogo contiene cuatro modelos: Civic EP3, MX-5 NB, Celica T23 y 318ti E36. Falta la amplitud de marcas, generaciones y prestaciones requerida para progresar hacia categorías superiores. Los modelos enumerados en el prompt eran ejemplos; no todos deben considerarse obligatorios individualmente.
- Hay mejoras con efectos reales y compromisos de masa, temperatura, desgaste y fiabilidad. Faltan componentes internos de motor, cajas/relaciones, regulación de muelles/amortiguadores/altura/rigidez/geometría, dimensiones de neumáticos y mayor desglose de frenos, llantas, refuerzos y aerodinámica.
- La suspensión llamada «regulable» cambia prestaciones al montarla, pero todavía no ofrece un sistema de reglajes.
- La compatibilidad comprueba modelos, dependencias y límite de potencia. Falta ampliar restricciones físicas/técnicas y reglamentos para nuevas categorías.
- Las reparaciones tienen coste y plazo, pero no plantilla asignada ni consumo de repuestos específicos por avería. Los plazos actuales dependen de reglas fijas, no de instalaciones y calidad del personal.
- Se conserva historial reciente y desgaste, pero falta un expediente histórico estructurado de accidentes, restauraciones y preparaciones durante décadas.

### Carreras, órdenes y reglamentos — apartados 16–18

- La carrera avanzada ya tiene un ciclo completo. Falta que duelos, eventos regionales y parrillas grandes sean formatos seleccionables con requisitos y calendarios propios.
- La parrilla habitual corresponde a ocho compañías y un coche por compañía. La prueba técnica con 30 coches no crea automáticamente un campeonato jugable de 30 participantes. El requisito de más de 30 también necesita validación específica.
- Las órdenes de atacar, equilibrado, conservar, ahorrar combustible, defender y boxes funcionan. La instrucción se aplica directamente: faltan obediencia o desacato contextual, órdenes entre compañeros y estrategias de equipo con varios coches.
- La radio informa de hechos reales, pero es un conjunto de mensajes y respuestas breves. Falta mayor variedad de conversación condicionada por personalidad, relaciones y decisiones.
- Hay lluvia, humedad, secado y temperatura. El estado seco no diferencia una simulación de cielo soleado/nublado; queda por ampliar ese aspecto meteorológico.
- Hay amarillas locales, VSC y sanción de boxes. Falta un sistema general de reglamentos/procedimientos y sanciones por tipo de competición. El VSC existente es un procedimiento simplificado.
- La repetición funciona y conserva la última grabación con muestras acotadas. Un archivo de varias repeticiones sería una ampliación; el prompt no fija una cantidad y no se cuenta aquí como requisito incumplido.

### Competiciones y temporadas — apartados 19 y 20

Solo está implementada la Copa Club, con seis rondas de calendario y reglamento estáticos. Faltan categorías regionales, nacionales, internacionales, GT, turismos avanzados, resistencia y eventos especiales, así como invitaciones, duelos de fabricantes, retro, clásicos y promocionales. Falta también la escena callejera ficticia con organizaciones, reputación, invitaciones, rivalidades y consecuencias abstractas.

La estructura debe admitir organizadores y reglamentos propios, requisitos de acceso, inscripciones, premios, clasificaciones y campeones. Faltan cambios anunciados de potencia, peso, aerodinámica o neumáticos entre temporadas, y creación/desaparición de categorías. Las nuevas categorías darán utilidad al ascenso de la compañía y a los coches más avanzados.

### Patrocinadores y fabricantes — apartado 21

El piloto impuesto, las obligaciones, los fondos finitos y las consecuencias del incumplimiento ya están implementados. El catálogo sigue limitado a cuatro patrocinadores y un programa de fabricante ficticio.

Faltan variedad contextual de ofertas, programas de jóvenes talentos completos, acuerdos a distintos niveles de prestigio, exigencias ligadas a una reputación pública diferenciada y relaciones continuadas con fabricantes más allá de una convocatoria. Las temporadas abren nuevas ofertas con los presupuestos restantes; la renovación comercial necesita más profundidad que volver a contratar bajo el catálogo actual.

### Economía y reputación — apartados 22 y 26

La caja, movimientos, deuda, patrimonio estimado, previsión mensual, salarios, créditos, servicios, premios y patrocinios funcionan. Faltan impuestos simulados, valoración empresarial completa e informes de beneficio/pérdida y proyecciones por periodos que separen con claridad operación, inversión y financiación. También faltan los gastos e ingresos de las futuras instalaciones, personal, I+D y acuerdos técnicos.

La reputación empresarial sigue siendo un número general; hay relaciones adicionales con marcas y moral individual. Faltan reputaciones separadas ante público, pilotos, empleados, fabricantes, patrocinadores, organizaciones y rivales, con efectos en sus decisiones.

### Noticias y archivo — apartados 28 y 30

El periódico publica hechos reales y permite abrir entidades. Conserva las 200 noticias más recientes; no hay archivo permanente de ediciones por fecha ni sistema de rumores identificado como tal. Los nuevos tipos de noticia dependen de implementar lanzamientos, subastas, retiros, fusiones, tecnología y reglamentos.

El archivo de temporadas conserva campeón de equipos, posición/puntos del jugador y clasificación resumida de compañías. **Al abrir una nueva temporada se sustituye `s.season`; sus resultados de cada ronda y la clasificación de pilotos no se copian al archivo histórico.** La retención de estadísticas acumuladas y noticias recientes no conserva el detalle completo de esas competiciones.

Faltan campeones históricos de pilotos, récords, leyendas, empresas desaparecidas con trayectoria consultable, fusiones, vehículos destacados, carreras memorables, retiros, premios y logros. Deben mantenerse resúmenes duraderos por ID aunque se descarte la simulación detallada.

### Interfaz, persistencia, IA y balance — apartados 31–36

El rediseño ya cubre las pantallas actuales y se ha validado a varios anchos. Faltan vistas reales para los futuros sistemas, evolución visual de la sede y gráficos de trayectoria/rendimiento más extensos. La calidad estética y claridad del uso requieren evaluación con jugadores; las pruebas de desbordamiento y errores no las certifican por sí solas.

El guardado actual usa `localStorage`, con validación y recuperación. IndexedDB es una prioridad condicional del prompt, no una obligación ya incumplida. Hay que evaluar su adopción al crecer el historial y los inventarios, midiendo tamaño, cuota, tiempos de lectura/escritura y recuperación. Los campos vacíos de empleados/investigación/relaciones no constituyen persistencia de sistemas funcionales.

La IA tiene utilidad, presupuestos y personalidad. Falta extenderla a empleados, ampliaciones, investigación, academia, nuevas categorías, subastas y relaciones. El balance a décadas necesita demostrar circulación sostenible de dinero, suministro de coches/piezas, variedad de oportunidades y renovación de participantes. Los presupuestos comerciales son finitos y el mercado general no tiene todavía una economía de producción/evolución histórica; los suministros de carrera sí tienen reposición financiada.

La simulación usa paso fijo separado del renderizado y hay medición con 30 coches. Falta medir escenarios mayores de 30, equipos modestos, partidas largas, grandes inventarios e historiales. Un escenario rápido no acredita todo el rendimiento futuro.

## Cobertura de los 42 apartados

| Apartado | Estado respecto al alcance íntegro | Pendiente principal |
| --- | --- | --- |
| 1. Concepto | Parcial | Progresar de garaje a compañía mundial durante generaciones. |
| 2. Tecnología | Base funcional | Incorporar los sistemas ausentes manteniendo un estado coherente. |
| 3. Inicio | Funcional en el alcance inicial | Ampliar la presencia coherente de identidad al añadir departamentos, rankings y contratos. |
| 4. Tiempo | Parcial | Construcciones, I+D, lesiones, mercado evolutivo y plazos dependientes del personal. |
| 5. Compañías | Parcial | Empleados, expansión, relaciones, fusiones y nuevas empresas. |
| 6. Niveles | Pendiente como mecánica | Ascenso/descenso y desbloqueos; existen nombres y nivel inicial. |
| 7. Pilotos | Parcial | Ojeo, desarrollo profundo, envejecimiento, lesiones, retiro y relaciones. |
| 8. Contratos | Parcial | Demandas y memoria contextual; contratación de empleados. |
| 9. Empleados | Pendiente | Plantilla especializada, relaciones, delegación y efectos reales. |
| 10. Vehículos | Parcial | Catálogo/generaciones y desarrollo hacia categorías superiores. |
| 11. Taller | Parcial | Más componentes y reglajes; personal e instalaciones. |
| 12. Personalización | Parcial | Editor de libreas y configuración visual persistente. |
| 13. Daños | Parcial | Repuestos/personas por reparación e historial duradero más detallado. |
| 14. Mercado de coches | Parcial | Subastas, nuevos/importados/exclusivos, negociación y demanda. |
| 15. Repuestos | Parcial | Reacondicionados, exclusivos, propios, precios y relaciones. |
| 16. Carreras | Funcional en Copa Club | Formatos variados y grandes parrillas accesibles desde el juego. |
| 17. Órdenes/radio | Parcial | Obediencia contextual, compañeros y conversaciones más profundas. |
| 18. Clima/incidentes | Parcial | Procedimientos por categoría y consecuencias sobre pilotos. |
| 19. Competiciones | Parcial | Categorías y eventos profesionales/alternativos. |
| 20. Temporadas | Parcial | Reglamentos cambiantes, récords e historia deportiva completa. |
| 21. Patrocinio | Parcial | Amplitud, prestigio y programas de fabricantes/talentos. |
| 22. Economía | Parcial | Impuestos, valoración e informes amplios; nuevas actividades. |
| 23. Pronósticos | Pendiente | Predicciones e historial con puntos independientes. |
| 24. Sede | Parcial | Construcción, niveles, departamentos y crecimiento visual. |
| 25. I+D | Pendiente | Proyectos, investigadores, tecnología, prototipos y patentes. |
| 26. Reputación | Parcial | Reputaciones por colectivo y efectos específicos. |
| 27. Ranking mundial | Pendiente | Clasificación empresarial multitemporada. |
| 28. Periódico | Parcial | Archivo de ediciones y nuevos acontecimientos de los sistemas futuros. |
| 29. Mundo histórico | Parcial | Generaciones, fabricantes, empresas, reglamentos y clásicos. |
| 30. Archivo | Parcial | Pilotos, resultados por ronda, récords y acontecimientos duraderos. |
| 31. Interfaz | Base funcional rediseñada | Nuevas gestiones, evolución de edificios y evaluación de claridad. |
| 32. Guardado | Funcional en el alcance actual | Persistencia de futuras entidades y escalado medido del almacenamiento. |
| 33. Coherencia | Transversal, aplicada a sistemas existentes | Conectar producción, academia, tecnología y resto del mundo futuro. |
| 34. IA/balance | Parcial | Nuevas decisiones y validación económica a largo plazo. |
| 35. Variedad | Parcial | Más trayectorias, ofertas, rivales, modelos y evolución contextual. |
| 36. Rendimiento | Parcialmente validado | Más de 30 coches y carga de muchas temporadas/inventarios. |
| 37. Etapas | En curso | Etapas 0.6–1.0 y completar profundidad pendiente. |
| 38. Reglas de programación | Transversal | Revisión y regresión continuas; no se certifica ausencia absoluta de errores. |
| 39. Pruebas | Cobertura funcional actual | A–J ampliadas a nuevos sistemas y escenarios multigeneracionales. |
| 40. Restricciones | Transversal | Especialmente evitar campeonatos estáticos y repetición a largo plazo. |
| 41. Prioridades | Guía vigente | Profundizar sin perder economía, persistencia, IA ni jugabilidad. |
| 42. Entrega/integración | En curso | Completar y verificar progresivamente el alcance restante. |

## Orden recomendado de implementación

1. **Instalaciones y progresión:** construcción de la única sede, capacidad física, plazos y primeras metas empresariales. Activar desbloqueos cuando exista contenido que los justifique.
2. **Personal y pilotos:** mecánicos, ingenieros, entrenadores y ojeadores; nóminas, efectos verificables, atributos de pilotos pendientes, motivación y memoria. Incorporar las especialidades restantes progresivamente.
3. **Automatización, academia e I+D:** usar el personal y las instalaciones reales; presupuestos, resultados, desarrollo y decisiones equivalentes para rivales. Cierra el núcleo de la etapa 0.6.
4. **Mercado y personalización:** subastas, importación, fabricantes, más modelos, demanda, repuestos y editor visual. Corresponde principalmente a 0.7.
5. **Evolución e historia:** cumpleaños, retiro y nuevas generaciones, renovación empresarial, lanzamientos ficticios, reglamentos y archivo compacto. Corresponde principalmente a 0.8. Conviene conservar antes los resúmenes deportivos que hoy se pierden al cambiar de temporada.
6. **Profundidad y recorrido deportivo:** más categorías, relaciones, reputaciones separadas, ranking mundial, contratos, impuestos y balance/IA. Introducir categorías a medida que el crecimiento necesite nuevos objetivos, aunque el balance final corresponda a 0.9.
7. **Ampliaciones e integración:** pronósticos sin dinero, variedad, pruebas de rendimiento, persistencia prolongada, presentación y distribución hasta 1.0.

Cada bloque debe comprobar al menos una cadena completa: adquirir/contratar → pagar → esperar el plazo → obtener un efecto real → permitir uso rival → generar noticia → guardar/cargar sin duplicar. En instalaciones, personal e I+D se deben conservar también proyectos y obligaciones en curso.

## Puntos del código que sustentan el análisis

| Evidencia | Ubicación |
| --- | --- |
| Nivel inicial, capacidad, campos vacíos y mundo inicial | [`core.js`](../js/core.js), `createGame`. |
| Diez nombres de nivel, cuatro modelos, siete rivales y seis rondas | [`data.js`](../js/data.js). |
| Generación, atributos, contratos, dos entrenamientos y alta mensual de candidatos | [`drivers.js`](../js/drivers.js). |
| Mercado finito, valoración y transferencias | [`market.js`](../js/market.js), [`world.js`](../js/world.js). |
| Decisiones rivales y personalidades | [`ai.js`](../js/ai.js), [`companies.js`](../js/companies.js). |
| Catorce definiciones, reparaciones y configuración | [`parts.js`](../js/parts.js), [`workshop.js`](../js/workshop.js). |
| Cinco proveedores, relación comercial, cláusulas y crédito | [`contracts.js`](../js/contracts.js). |
| Órdenes, efectos de atributos y resumen histórico de fin de temporada | [`race.js`](../js/race.js), `order`, `tickRacing`, `finish`. |
| Sustitución de temporada conservando el mundo | [`calendar.js`](../js/calendar.js), `nextSeason`. |
| Clima, servicios, sanción, VSC y grabación | [`race-weekend.js`](../js/race-weekend.js). |
| Caja, nóminas y bancarrota | [`economy.js`](../js/economy.js). |
| Archivo visible, periódico y finanzas | [`ui.js`](../js/ui.js), [`ui-contracts.js`](../js/ui-contracts.js). |
| Guardado, recuperación y validación de resúmenes históricos | [`storage.js`](../js/storage.js). |
| Escenarios comprobados y límites de las mediciones | [`PRUEBAS.md`](PRUEBAS.md), carpeta [`tests`](../tests). |

