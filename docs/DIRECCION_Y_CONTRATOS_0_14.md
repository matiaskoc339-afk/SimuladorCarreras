# Dirección y contratos · 0.14.0

La retransmisión utiliza todo el ancho disponible. En escritorio la pista ocupa aproximadamente dos tercios de la altura de la ventana, con un mínimo de 460 px; en móvil conserva al menos 340 px. «Ampliar transmisión» abre la vista ampliada y «Radio y estrategia» coloca el mismo muro encima de la transmisión, manteniendo su borrador. Escape cierra primero la radio y después la vista ampliada. Boxes, cámara, pausas, velocidades y telemetría siguen disponibles.

## Dar instrucciones

Los cinco planes rápidos siguen presentes. Además puedes combinar cuatro valores entre 0 y 100: ritmo, riesgo, cuidado de neumáticos y ahorro de combustible. Elige leer la carrera, buscar interior/exterior, seguir y preparar una salida, defender o evitar disputas. La instrucción puede durar 30, 60 o 120 segundos de carrera, o mantenerse hasta otra orden. El tiempo de la orden avanza con la simulación, no mientras está pausada.

Editar los controles prepara un borrador. Solo transmitirlo envía una petición y solo confirmarla aplica el plan. La concentración, trabajo en equipo, disciplina y estrés siguen afectando a la respuesta. El piloto explica si no entiende, si una bandera impide atacar o si el coche no soporta el ritmo. La duración empieza con la confirmación; al terminar vuelve al equilibrio y el estratega puede recuperar el control. Una petición manual de boxes no acorta la prioridad de una orden más larga.

Los controles tienen consecuencias: exigir ritmo aumenta consumo, desgaste y esfuerzo; conservar gomas/combustible cede velocidad; el riesgo modifica errores y distancia de seguimiento. Las estimaciones de desgaste y combustible para boxes utilizan la directiva aplicada. Un interior ocupado no se atraviesa por una orden y la velocidad no supera el límite seguro del coche, agarre y curva. Los pilotos valoran el cierre respecto al rival y sus atributos antes de comprometer una maniobra. La consistencia afecta a la regularidad; experiencia, edad, fatiga y adaptación conservan sus efectos. Los errores y accidentes siguen siendo contextuales, sin una cuota obligatoria.

## Hablar con un piloto

El CV y el contrato muestran su perfil de negociación: ambicioso, leal, pragmático o humilde. Se calcula de forma estable a partir de la identidad y semilla, sin gastar aleatoriedad por consultar una ficha. Cada uno valora de forma distinta dinero, seguridad y oportunidades. El sueldo de referencia del CV no garantiza aceptar cualquier duración o rol.

La valoración considera sueldo, prima al firmar distribuida en el plazo, bonificación de victoria con valor incierto y limitado, rol, participación real, rescisión, opción de renovación y continuidad. Las promesas de participación de estos contratos incluyen también las carreras callejeras del plazo; los acuerdos comerciales mantienen sus requisitos profesionales. Una prima de victoria enorme no sustituye un sueldo justo.

El piloto presenta una contrapropuesta y explica sus prioridades. Mejorar de forma real el paquete permite acercar posturas; repetir exactamente una oferta no extrae concesiones. La paciencia varía entre perfiles. Ofertas reiteradamente insuficientes pueden detener la conversación durante tres días y los insultos salariales durante siete. El historial, las condiciones y la pausa sobreviven a guardar/cargar. La prima solo se paga al firmar.

## Resultados y revisión salarial

La referencia de mercado contempla valoración, edad, experiencia y resultados recientes. Un piloto que gana o progresa y queda por debajo de su valor puede pedir revisar el sueldo. Hay un mínimo de 21 días entre revisiones; las victorias desde la última revisión, la mejora de valoración y la personalidad influyen. Un desajuste prolongado también puede generar una petición. Las victorias previas a la contratación o actualización no se convierten de golpe en una reclamación retroactiva.

La petición explica el sueldo actual, la referencia y los resultados/progresión. Da 14 días para responder desde Equipo o la ficha. Puedes proponer otra cantidad; el piloto también puede acercar su petición. Aceptar requiere una reserva de siete jornadas del nuevo sueldo y conserva duración, deuda devengada y cláusulas. No hay prima de firma adicional ni aumento automático del jugador. Rechazar o ignorar reduce moral y confianza, que afectan a la relación y a futuras negociaciones; el piloto cumple el contrato vigente.

Renovar vuelve a valorar el acuerdo y permite contrapropuestas. Las renovaciones normales parten como mínimo del incremento contractual del 8 % y también consideran el mercado. Si tienes una opción firmada al 3 % que aún no usaste, se respeta. La renovación se abre en los últimos 60 días y añade su plazo al vencimiento actual. Los rivales gestionan sus peticiones con su caja real, sin financiación gratuita.

## Guardado y comprobaciones

El formato principal del guardado se conserva. La nueva gestión incorpora `driverAgency.version = 1`; las nuevas carreras incorporan `directorVersion = 1`. Una carrera antigua que ya está en directo termina con sus reglas guardadas y recibe la presentación ampliada; los planes combinados llegan a la siguiente carrera después de actualizar la gestión. No se reinician contratos, dinero, entrenamientos, puntos o licencias.

- `npm test`: compatibilidad histórica y reglas de motor, incluidos personalidad, concesiones, pausas, aumentos, renovación, planes, radio, duración, costes físicos, espacio y estratega.
- `npm run test:director:browser`: contratación con contrapropuesta real, aumento, renovación, vista ampliada, radio flotante, borradores, confirmación, recarga y boxes en 1440/1024/390.
- `npm run test:balance`: temporada actual de 20 eventos, pagos y negociaciones reales, licencia, mantenimiento, parrillas, cambio de año, entrenador y ciencia. Sin inyectar dinero ni atributos. El escenario usa encargos normales de garaje y conducción conservadora; no garantiza el resultado de cualquier estrategia o semilla.

Las pruebas de interfaz que necesitan aislar un aumento o una radio usan datos controlados y no sustituyen la comprobación económica de una temporada completa.
