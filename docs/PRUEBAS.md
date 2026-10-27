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
