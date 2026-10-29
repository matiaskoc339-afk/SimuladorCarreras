# Versión 0.7.0 · competiciones, conducción y diseños

## Acceso y temporada

La partida empieza con $4.200, un utilitario usado y pilotos locales de valoración 10–25. Los sueldos son diarios. Se conserva el coste de encargos, compras, mantenimiento y talleres; ningún resultado ni ingreso se entrega por el mero hecho de clasificarse.

| Liga | Pruebas, incluida final | Tasas normales / final | Acceso | Puntos para final |
| --- | --- | --- | --- | --- |
| Callejera | 9 | $220 / $320 | Coche operativo y piloto contratado, máximo 350 CV | 12 de clasificatorias callejeras |
| Regional profesional | 6 | $2.100 / $3.000 | Licencia, piloto 22+, coche 70 %, frenos 75 %, suspensión 70 %, gomas 35 %; máximo 280 CV | 18 regionales |
| Nacional | 5 | $7.200 / $9.000 | Licencia y 12 puntos regionales de trayectoria; piloto 24+, coche 75 %, frenos 80 %, suspensión 75 %, gomas 45 %; máximo 320 CV | 18 nacionales |

La licencia cuesta $900 y exige 24 puntos callejeros acumulados; no se consumen esos puntos al tramitarla. Las matrículas incluyen inscripción y transporte; las gomas de carrera se pagan aparte. La inscripción abre 14 días antes, fija coche/piloto y no devuelve tasas al retirarla. El contrato y la disponibilidad médica deben cubrir la prueba. Cada final concede el título a su primer clasificado que termine; la tabla de puntos conserva la trayectoria de la temporada.

Los puntos de acceso a finales se reinician cada temporada; licencia y puntos de trayectoria callejera/regional se conservan. Abandonar da cero puntos y cero premio. No hay prima automática de cierre. La nacional empieza después de dos rondas regionales para que sus participantes puedan conseguir resultados de acceso.

La calle enfrenta principalmente a siete equipos independientes persistentes. Una compañía profesional puede aparecer como invitada en la tercera prueba. Los daños y contactos se admiten deportivamente en la calle; siguen afectando a ambos vehículos, pueden provocar abandono/lesión y se pagan en el taller. En copas profesionales, un contacto fuerte evitable añade una sanción de diez segundos al responsable estimado. Es un procedimiento simplificado, no arbitraje federativo completo.

## Trazados y coches

Dieciséis trazados originales: seis callejeros y diez profesionales. Los diseños evocan Long Beach, Mónaco, Bakú, Macau, Singapur, Adelaide, Monza, Suzuka, Silverstone, Red Bull Ring, Spa, Interlagos, Bahréin, Hockenheim, Portimão y Nürburgring GP. No se utilizan sus planos oficiales. Son circuitos planos en 2D, sin elevación física.

Cada trazado tiene geometría cerrada en metros, esquinas redondeadas, anchura urbana de 10,6 m o profesional de 13,4 m, referencias de frenada y boxes en recta. La misma geometría alimenta física, mapa, práctica y retransmisión. Edificios y tribunas se colocan con su huella fuera de la pista y del ramal de boxes. Los entornos incluyen zona industrial, noche/neón, costa, desierto, estadio, parque y bosque. Los 16 tienen fecha en las 20 pruebas.

El catálogo llega a 40 modelos, manteniendo los primeros 24 índices. Los 16 nuevos incluyen CR-X, RX-7, Skyline, Supra, 944, Delta, Escort RS, 190E, Saab 900, V70, Elise, Renault 5, Fiat Coupé, 205 GTI, Audi TT y Alfa 147. Potencia, masa, agarre, frenada, fiabilidad, precio y dimensiones son parámetros del juego. Las siluetas, habitáculos, ópticas, techos, alerones y proporciones métricas se comparten entre vistas de catálogo y carrera. Las decoraciones se calculan sin consumir el RNG de la partida. No se incluye todavía un editor de libreas.

## Piezas, decisiones y boxes

La configuración procede de las unidades realmente compradas e instaladas. Escape, admisión, ECU y sobrealimentación afectan a potencia/carga térmica; embrague/transmisión a aceleración; diferencial a tracción; refrigeración a temperatura; suspensión y gomas a agarre; frenos a frenada; aerodinámica a apoyo creciente con velocidad; aligerado a masa. Se conservan sus compromisos de fiabilidad, estrés y desgaste. Cada pérdida de estado o daño reduce la contribución de la pieza. El calor de frenada produce pérdida gradual de eficacia y los frenos mejorados evacúan calor más rápido. La telemetría muestra potencia, agarre, temperatura de frenos y estado de piezas.

El coeficiente de desgaste continuo de neumáticos se multiplica por 0,45 frente a 0.6.4. Conservar, marca, compuesto, clima, estado, fatiga y habilidades siguen importando. Derrapes/roces no reciben esa rebaja artificial. La previsión de inscripción usa este coeficiente y la preparación real, y se identifica como referencia en seco/ritmo normal.

La IA anticipa curvas según agarre/frenos/reacción, revisa huecos con velocidad relativa, mantiene un lado durante la maniobra y espera si no cabe. Control, atención, adelantamiento, defensa, disciplina, resistencia, edad, experiencia y personalidad continúan modulando ejecución y riesgo. No se fuerza un choque por carrera. En calle, algunos pilotos agresivos pueden buscar presión con contacto; los muros limitan lateralmente el coche y producen daño físico.

La IA de boxes compara desgaste proyectado, combustible hasta la siguiente oportunidad y ganancia meteorológica con tiempo de servicio y tránsito. Un estratega automático conserva su acierto/errores por nivel. Cada equipo tiene puesto y temporizador propios: ocho servicios pueden avanzar simultáneamente. Los coches que circulan por el carril rápido sí mantienen distancia y esperan un hueco seguro para reincorporarse. El minijuego manual y los fallos de mecánico siguen activos.

## Guardados y comprobaciones

Las carreras auténticas 0.6.4 conservan resultado y estado completos. Una partida anterior mantiene su calendario y reglas; una empresa 0.6.4 puede activar las nuevas ligas al finalizar el año, desde Competiciones. La acción conserva activos del jugador y abre un nuevo calendario, con nuevos independientes. No convierte una carrera en marcha.

`npm test` cubre motor y compatibilidad. Las 28 pruebas de `tests/competition.test.cjs` incluyen geometría y carrera física completa de los 16 trazados, las 40 siluetas, piezas compradas y usadas, frenada, boxes paralelos, reglas, puntos, guardado determinista, metadatos corruptos y archivo multiliga. `tests/browser-competition.cjs` recorre la UI actual a 1440, 1024 y 390 px: creación/contratación, ligas/mapas, inscripción, movimiento, boxes manuales, telemetría, recarga y activación desde una empresa antigua. Las vistas profesionales se preparan con estado controlado y no se presentan como prueba de solvencia.

`npm run test:balance` recorre veinte pruebas con semilla 1470, contrato real del candidato más barato, encargos semanales, reparaciones, gomas y licencia pagadas. Simula también las carreras omitidas. El equipo termina con 68 puntos callejeros, licencia y $13.099 antes del cambio de año ($12.589 después); todavía necesita mejorar su piloto para la regional. Quedan once equipos activos y parrillas regionales de 3–7/nacionales de 2: los rivales pagan gastos y pueden quebrar. Se comprueba el archivo y el reinicio de clasificaciones. Es una ruta reproducible, no una garantía de equilibrio de todas las estrategias/semillas. Contratar al candidato más caro sin ajustar gastos agotó la caja durante otra prueba de temporada; se conserva la dificultad y se documenta el coste.

Siguen pendientes academia, investigación, subastas/importaciones, editor de pintura/libreas, relaciones empresariales avanzadas, ranking mundial y evolución generacional. La simulación usa paso fijo 2D y procedimientos simplificados de tráfico, contacto y arbitraje.
