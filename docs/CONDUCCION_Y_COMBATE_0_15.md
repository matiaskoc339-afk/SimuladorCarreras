# Conducción y combate · 0.15.0

La carrera conecta Control, trazada, preparación de maniobras y ejecución con movimiento, desgaste y tiempo. El muro explica qué limita al piloto y el resultado conserva un informe. Continúa siendo una simulación 2D de gestión, con un modelo longitudinal y desplazamiento lateral, contactos y daños; no pretende resolver una dinámica completa de neumáticos de un simulador de conducción.

## Control y curvas

Cada punto de Control cambia de forma continua el margen de velocidad y la dosificación del acelerador al salir. Para `x = Control / 100`, el factor de aprovechamiento es `0.64 + 1.8x - 0.56x²`, reducido por fatiga. El techo físico emplea el factor 1.88, sin aumentar por la habilidad del piloto. Agarre de piezas, estado, neumáticos, compuesto, temperatura y lluvia siguen interviniendo.

La anticipación examina los siguientes 360 metros y usa la frenada disponible y la reacción para construir una velocidad alcanzable antes de la curva. Con el mismo Ka inicial, pista seca, neumáticos completos y la misma posición de Muelles del Sur, una comparación controlada da aproximadamente:

| Control | Margen de velocidad en esa curva |
| --- | --- |
| 10 | 37 km/h |
| 50 | 64 km/h |
| 90 | 82 km/h |

Son ejemplos de ese coche y tramo, no velocidades fijas para todas las curvas. La prueba de vuelta física también comprueba que el cambio produce un tiempo menor con el mismo coche sin tráfico. La lluvia, el desgaste, el miedo del novato, la frenada y las órdenes pueden reducir el ritmo real.

Al salir, la fracción de aceleración disponible que aprovecha el piloto es `0.58 + Control × 0.0042`, como máximo 1. Un experto puede orientar ligeramente el coche para preparar la salida si está acelerando, tiene gomas y agarre suficientes y acepta un riesgo moderado. Se representa con un pequeño ángulo y huellas, y consume algo de neumático. No añade potencia ni acelera por encima de lo que entrega el motor; un derrape grande sigue siendo un error.

## Interior y exterior

El avance por la curva considera la distancia física de la línea desplazada respecto al centro. El interior requiere menos recorrido pero tiene un radio menor y permite menos velocidad. El exterior recorre más metros y abre el radio, lo que puede permitir conservar velocidad y preparar una salida cruzada. Cambiar lateralmente también consume recorrido: el coche no avanza la misma distancia longitudinal mientras atraviesa la pista.

La pista, la anchura del coche, el tráfico y los límites de agarre condicionan la ventaja. El muro describe la contrapartida actual y permite dibujar la trayectoria prevista. Mostrarla, consultar telemetría o cambiar la cámara no modifica el RNG ni el estado deportivo.

## Planificación y defensa

Los estados son observar, preparar rebufo, amagar, preparar salida cruzada, comprometerse, defender y recuperar la línea. La preparación y el momento de atacar dependen de Adelantamiento, Control, Frenada, Concentración, Experiencia, diferencia de velocidad y riesgo solicitado. Un novato necesita un hueco más favorable; una valoración alta no garantiza ganar el puesto.

El piloto guarda observaciones locales de hasta seis rivales: inicio de frenada y tendencia a proteger el interior. Los expertos pueden usar esas referencias para decidir el lado, amagar o preparar una salida diferente. Es memoria de lo observado en la carrera, no acceso al estado oculto ni aprendizaje general. La decisión se conserva durante su ventana de ejecución en lugar de elegir otro lado cada paso.

Defensa permite anticipar antes una amenaza y elegir una línea que mantiene durante varios segundos. Un coche emparejado tiene espacio; se comprueba también un tercer coche y su posición prevista. Amarillas, boxes, incidentes y órdenes de rodar limpio o seguir bloquean el ataque. Se mantienen los contactos, el daño callejero y las reglas profesionales existentes.

## Errores de ejecución

- **Frenada tardía:** pierde la referencia, demora la frenada y corrige la entrada, con pérdida de velocidad y apertura de la línea. Superar claramente el agarre en curva puede provocar una pérdida de control real.
- **Bloqueo:** requiere frenada fuerte mientras gira. Reduce la eficacia del frenado y desgasta neumático.
- **Aceleración excesiva:** requiere una salida de curva con demanda real de aceleración. Hace patinar, reduce la tracción y añade desgaste.

La probabilidad utiliza las habilidades relevantes, riesgo, fatiga y estrés, con intervalos y enfriamiento entre errores. No se genera un error solo por pintar la pantalla o por una tirada sin relación con lo que está ejecutando. El RNG propio de cada piloto y los temporizadores se guardan.

## Explicar el tiempo cedido

En **Entiende su conducción**, junto a las órdenes y los boxes, se muestran fase, causa actual, Control, margen elegido, capacidad de paso, rival y maniobra. El desplegable **Tiempo cedido y ejecución** añade cuatro motivos, gráfica de velocidad real/referencia y contadores de errores. El resultado conserva el informe y una orientación para mejorar.

| Motivo | Qué estima |
| --- | --- |
| Conducción | Margen del piloto, frenada, ejecución y órdenes de ritmo/ahorro |
| Coche | Diferencia por estado mecánico y entrega respecto a ese mismo coche sano |
| Neumáticos | Pérdida de agarre por desgaste, compuesto o adecuación a la pista |
| Tráfico | Limitación adicional por seguimiento y preparación de maniobras |

La referencia es el mismo coche sano, con neumáticos adecuados, piloto experto y pista libre, sobre el tramo recorrido. Integra su propia aceleración y frenada. No es el tiempo respecto al líder ni una vuelta contrafactual exacta: se estima tiempo equivalente local a partir del déficit de velocidad. Los cuatro motivos reparten una sola pérdida, sin contarla dos veces. Banderas y fases de boxes no acumulan pérdidas de estos cuatro motivos. Se conservan hasta sesenta muestras y doce informes del jugador para acotar el guardado.

## Campus

Se añaden **Adelantamiento** y **Defensa** a Velocidad, Control, Frenada y Consistencia. Adelantamiento ejercita además Frenada al 25 % de la ganancia; Defensa ejercita Concentración en esa proporción. Reutilizan reservas, jornadas de calendario, entrenador, sueldos diarios, estado del coche, estrés, potencial y riesgo. El informe muestra los cambios reales, lo aprendido y cualquier interrupción. Mirar la animación no concede XP ni completa días.

## Guardado y comprobación

Las empresas modernas se actualizan fuera de carrera o subasta activa, sin regenerar entidades, tocar caja, contratos, puntos ni RNG. Las carreras nuevas reciben `skillsVersion = 1`. Una carrera guardada anteriormente termina con sus reglas originales; al volver a gestión se activa la mejora para las siguientes. El constructor `createV140Game` y las fixtures históricas siguen disponibles.

La fixture `v140-race.json` se produjo ejecutando el código original del commit `7ffe0d8cc8dca224bb72e590c6768dc09987e743`, exportado con `git archive`. `v140-expected.json` conserva resultados y SHA-256 de todo el estado terminado; la prueba exige coincidencia exacta antes de actualizar la empresa.

Pruebas nuevas: progresión punto a punto, velocidades y techo físico, vuelta real, líneas y distancia, carriles ocupados, preparación/memoria, defensa estable, restricciones de ataque, errores contextuales, salida sin potencia extra, atribución aislada de las cuatro causas, guardado exacto con orden pendiente, programas completos, validación de corrupción, informe de carrera y tres circuitos de dificultades distintas. El navegador usa reservas y jornadas reales para las dos especialidades y una carrera completa para su informe, con escritorio, tableta, móvil y radio flotante. Los casos de interfaz y física usan condiciones controladas; la ruta financiera aparte no inyecta fondos ni habilidades.
