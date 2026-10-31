# Pilotos y agenda · 0.16.0

## Negociación e información

El jugador conoce la propuesta, el salario de referencia del CV y las respuestas reales del piloto. Su estilo de negociación permanece oculto en el mercado, fichas, aumentos y renovaciones mientras la empresa no tenga un ojeador contratado. Tampoco se anticipa si la propuesta supera su umbral interno. Con ojeador se muestra el perfil y la orientación del conjunto de condiciones. El motor de personalidad y las contrapropuestas se conservan; ocultar el informe no cambia el contrato que acepta.

## Carreras opcionales

Al llegar al día de una prueba, el calendario se queda en esa fecha y muestra un aviso sin abrir ventanas ni cambiar la pantalla. Puedes inscribirte o salir desde Competiciones, gestionar otras áreas o continuar entrenando. Al avanzar al día siguiente, la prueba pendiente se simula con los rivales y se registra sin el jugador. Se conservan premios, daños, puntos y obligaciones de los participantes reales. Los gastos de una inscripción previa no se reembolsan, tal como advierte el aviso.

Una práctica por jornadas no bloquea una prueba disputada solamente por rivales. El programa del jugador continúa sin carrera, consumo deportivo ni puntos para su piloto. Una carrera propia que ya esté en directo sí debe terminarse antes de mover el calendario. Las cláusulas deportivas de un patrocinio siguen teniendo consecuencias si eliges no competir.

## Habilidades

El catálogo incorpora **108 habilidades nuevas**: doce especiales y noventa y seis combinaciones de condición y atributo. Cada piloto tiene de una a tres, seleccionadas de manera determinista por identidad y semilla con un RNG auxiliar. Las consultas no cambian el RNG de partida. Los candidatos nuevos pueden traer otras combinaciones; una muestra de quinientas identidades de prueba produce más de cuatrocientas combinaciones distintas.

Los atributos de carrera se calculan desde una copia de los permanentes y se actualizan al cambiar el contexto. No se acumula un bono cada paso ni se transfieren esos puntos al contrato o a la valoración permanente. Se respetan el máximo de 100, el coche, el agarre, las banderas y la ejecución. La ficha muestra las condiciones y el muro las habilidades activas. El catálogo completo está también dentro de Pilotos.

- **Motivador:** compensa parte del ritmo perdido con gomas gastadas mediante hasta +6 Velocidad y +2 Control. No regenera caucho ni evita el pinchazo.
- **Autónomo:** multiplicador de aprendizaje de 1,35 antes de los límites de programa y potencial.
- **Tramposo:** puede escoger una trayectoria de contacto al atacar con riesgo alto. El golpe necesita contacto físico, puede dañarlo también y conserva las sanciones profesionales. Las órdenes de rodar limpio o seguir, las amarillas y los boxes bloquean la maniobra.
- **Mal perdedor:** con al menos tres participantes sin abandonar, al ir último tras 35 segundos activa +14 Velocidad y +6 Adelantamiento durante 24 segundos, con un 12 % más de desgaste continuo. Una sola vez por carrera; el uso y el temporizador se guardan.
- **Testarudo:** +8 Defensa bajo amenaza trasera y −2 Adelantamiento. La defensa normal sigue dejando espacio al rival emparejado.
- **Drifting:** habilita una pequeña rotación de salida desde Control 45, siempre que haya aceleración, agarre y gomas suficientes. Con más Control puede ejecutarla mejor; la lluvia o un pinchazo impiden esa rotación. No añade potencia.

Las otras especiales cubren aprendizaje analítico, ayuda del entrenador, trato de neumáticos, resiliencia, adaptación y serenidad. Las noventa y seis situacionales trabajan Control, Frenada, Adelantamiento, Defensa, Consistencia, Concentración, Neumáticos o Velocidad en lluvia, desgaste, salida, última vuelta, tráfico, pista libre, calor, fatiga, horquillas, curvas rápidas, remontada y liderato. [Catálogo completo](HABILIDADES_0_16.md).

## Formación visible y limitada

La tasa básica pasa de 1,45 a 7,25: cinco veces el aprendizaje anterior en los programas nuevos. El campus sigue aplicando entrenador, intensidad, investigación, vueltas realmente trabajadas y potencial. Un programa básico de cinco vueltas, entrenador de nivel 1 e intensidad normal estima aproximadamente **+0,90** en su objetivo; con Autónomo, **+1,22**, antes de alcanzar el potencial. Los ejemplos dependen del piloto y el equipo.

La ganancia del programa tiene un techo de cinco puntos y otro según vueltas y habilidad del entrenador. Una interrupción utiliza solo el trabajo realizado. Entrenar no concede veinte puntos de golpe. El informe muestra la mejora con dos decimales y el atributo antes/después; también conserva costes, desgaste, fatiga, estrés y posibles incidentes. La formación diaria y delegada comparten la mejora y las habilidades de aprendizaje. Los programas antiguos ya pagados conservan su tasa original.

## Desarrollo rival

Las compañías activas pueden reservar un programa de cinco jornadas cuando disponen de caja, contrato, salud y margen antes de la siguiente carrera. Priorizan jóvenes y carencias observables, pagan 90 US$ más el suplemento del entrenador si lo tienen y mantienen nóminas. La formación aumenta fatiga y estrés; los programas se separan por descansos. Un contrato perdido, lesión, impago o indisponibilidad interrumpe el trabajo y conserva el progreso realizado. El informe público enlaza con la compañía.

La IA prioriza más las compras e instalaciones útiles del taller. Usa piezas reales, compatibilidad, bahías, plazos y reserva salarial. No recibe atributos ni financiación gratis. Puede quedarse sin fondos o equivocarse; la dificultad procede del desarrollo de sus recursos, no de aumentar automáticamente su velocidad cada carrera.

## Noticias y pinchazos

El diario y los resúmenes de la sede muestran únicamente noticias de la jornada actual. El estado conserva el archivo interno para enlaces e historial del mundo, pero la lista no mezcla fechas. El distintivo de Noticias cuenta publicaciones de hoy sin leer; abrir el diario las marca como vistas y guarda esa lectura. Una publicación posterior vuelve a encender el contador. Abrir el tutorial no marca noticias como leídas.

Un neumático al 0 % confirma un pinchazo sin sorteo. El coche desacelera por la resistencia del neumático y queda limitado a **5 m/s, 18 km/h**, tanto en pista como en entrada/salida de boxes. Las habilidades de ritmo no saltan el límite. Montar un juego sano elimina el pinchazo y permite acelerar normalmente. Los pinchazos que aparecen antes del 0 % también usan este límite. La estimación de pérdidas compara con neumáticos sanos y el muro explica la situación.

## Persistencia

`driverWorld` versiona preferencias de lectura, habilidades y programas rivales. `abilityVersion` marca solo las carreras nuevas y guarda atributos base, habilidades activas, RNG, impulso usado y temporizadores. La actualización se activa fuera de carrera o subasta sin regenerar entidades ni modificar saldos, contratos, calendario o RNG.

Una carrera 0.15 guardada mantiene su física y termina antes de activar las novedades. La fixture auténtica procede del commit `e5c30e58dc3ffdb2dd9b05fd4238279cdb615aa0`; se exige el mismo resultado y SHA-256 de todo el estado final. Las fixtures anteriores permanecen intactas. [Registro de comprobaciones](PRUEBAS.md).
