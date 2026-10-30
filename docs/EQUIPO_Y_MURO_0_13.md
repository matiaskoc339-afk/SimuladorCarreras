# 0.13 · ingresos de apoyo, conducción y muro de carrera

## Ingresos secundarios

Finanzas incluye tres ofertas semanales: preparación de material (dos días, 110–150 US$), taller abierto (tres días, 170–210 US$, una bahía) e informe de telemetría (tres días, 230–270 US$, un ingeniero). Los clientes y cantidades se generan de forma determinista a partir de semilla/semana. Se admite **un encargo de apoyo cada siete días**, con independencia de que termine o se cancele; las ofertas no dan puntos ni reputación.

Se cobra al completar el calendario y una sola vez. Los importes ya descuentan consumibles, pero no los salarios habituales de la plantilla. Cancelar libera recursos y no genera cobro. El ingeniero debe estar contratado, disponible, al día de sueldo y con contrato suficiente. Durante el informe no puede aceptar otro trabajo, descansar ni ser despedido; si deja de estar disponible, el encargo se interrumpe. La bahía del taller abierto comparte la capacidad real con reparaciones y encargos ordinarios. El historial, el progreso y la espera se conservan al guardar; consultar la oferta no modifica caja, RNG ni recursos.

El mantenimiento de clientes del garaje y las opciones comerciales existentes siguen disponibles. Los nuevos encargos son una ayuda limitada, no una renta diaria ni premios deportivos sustitutivos.

## Curvas y comportamiento

Las carreras nuevas usan `lifeVersion: 1`. Control influye más en el techo de velocidad en curvas: el factor de trazada recorre aproximadamente 0,72–1,34 según el atributo, con penalización por fatiga. Se aplica tanto al cálculo principal como a la anticipación de frenado. La velocidad sigue dependiendo de coche, frenos, agarre, gomas, lluvia, daños y tráfico; no se trasladan posiciones ni se garantizan adelantamientos por atributo.

Cada piloto tiene un pequeño estado de decisiones y RNG propio guardable. Revisa su intención con intervalos distintos, alterna ataque/defensa/equilibrio según rivales próximos y sus habilidades y conserva cuando el coche o la lluvia lo exigen. Bajo presión, poca consistencia/control favorecen dudas breves en la frenada; un piloto preciso puede enlazar mejor una salida. Estas variaciones respetan el techo físico. Se muestran acontecimientos cuando ocurren y tienen espera entre avisos. Los accidentes siguen resultando de la simulación existente, sin imponer uno por carrera.

Se corrigió además la planificación de rivales profesionales: preparan con hasta 21 días de antelación una copa para la que tienen piloto apto. Si fallan varios componentes, pueden encargar una revisión completa y renovar gomas, usando precios, bahías, personal y plazos reales. Conservan reserva para la inscripción y una semana de operación. No reciben vehículos, reparación ni dinero gratuitos.

## Órdenes y estrategia

El muro comparte la tarjeta de retransmisión. Incluye cinco planes, respuesta por radio, plan realmente aplicado, estratega, boxes, telemetría resumida e historial de órdenes. La información técnica extensa se abre bajo demanda. La bandera y el reloj permanecen sobre la pista, también en móvil.

Enviar una orden inicia una transmisión de unos 1,2–3,8 segundos de carrera. Mientras está pendiente no cambia el plan anterior ni se envían otras órdenes. La concentración y el trabajo en equipo afectan a la demora; equipo, concentración, disciplina, moral, estrés y apoyo del estratega afectan a los malentendidos. El piloto puede confirmar, no entender, aplazar un ataque por amarilla/VSC o rechazarlo si el coche está críticamente desgastado. Una respuesta fallida mantiene el plan anterior y permite repetir después de una breve espera. El panel explica cuándo reanudar una simulación pausada para recibir respuesta o liberar la radio.

Una orden manual reserva prioridad frente al estratega durante 35 segundos tras la aceptación. Los cambios automáticos posteriores se reflejan en el plan aplicado. Los mensajes y las últimas doce respuestas, incluida una transmisión pendiente, se guardan y se reanudan de forma determinista.

## Formación y CV

La ganancia de atributos del campus, entrenamiento diario y formación delegada aumenta un **45 %** en la gestión actual. Se conservan coste, duración, potencial, estrés, desgaste y riesgo. La previsión del campus muestra la mejora orientativa del atributo elegido si se realizan todas las jornadas; un programa interrumpido mantiene solo lo trabajado. La previsión y el informe utilizan el mismo cálculo de aprendizaje.

Pilotos incluye una guía desplegable de los doce atributos y botones de ayuda junto a las estadísticas del CV. Explica su efecto en conducción y radio sin revelar potencial oculto ni atributos adicionales de candidatos. Las fichas de gestión también incluyen la guía.

## Partidas existentes

Una empresa nueva incluye `teamLife.version: 1`. Una empresa con investigación habilitada incorpora los encargos al volver a una pantalla de gestión, sin reiniciar activos ni calendario. Una carrera ya empezada conserva su física y sus órdenes inmediatas; el muro visual también mejora para las carreras modernas guardadas. Los programas ya reservados conservan su factor de aprendizaje; el aumento se aplica al reservar otros nuevos. No se transforma una partida por visitar la guía del tutorial.

## Validación

`team-life.test.cjs` cubre cobro por entrega, espera semanal, reserva de bahía, cancelación, ingeniero ocupado, salario/cobertura, estado inválido, incremento de aprendizaje con coste/plazo/riesgo iguales, control en curva con el mismo coche, respuesta diferida, amarilla, malentendido, dependencia de habilidades, variación de decisiones, guardado/agrupación de ticks y preparación pagada de un rival para una copa.

`browser-team-life.cjs` utiliza las pantallas reales de ofertas, confirmación, calendario, guardado, CV/ayuda, formación, transmisión/confirmación/aplazamiento, recarga y petición de boxes. Comprueba 1440, 1024 y 390 px, bandera dentro de la pista, ausencia de errores de página y de desbordamiento. La prueba de la copa abre la nueva sección de telemetría antes de consultar piezas y prestaciones.

La ruta financiera actual se ejecuta con la gestión y conducción nuevas; no inyecta financiación ni estadísticas al jugador. La ruta es una estrategia y semilla reproducibles, no una garantía de equilibrio para todos los estilos de juego.
