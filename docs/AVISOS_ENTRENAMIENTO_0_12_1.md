# 0.12.1 · motivos claros y duración real del entrenamiento

Los rechazos indican la causa y la forma de continuar. En los gastos se muestran importe requerido, saldo y diferencia; los contratos incluyen vencimiento y fecha que deben cubrir. Taller, personal, licencias e inscripciones explican capacidad, ocupación, nivel, estado o puntos que faltan.

Los avisos de error permanecen visibles hasta cerrarlos o sustituirlos por otro aviso, se anuncian a lectores de pantalla y tienen un botón de cierre. Los formularios rechazados conservan sus datos y muestran también el error dentro del formulario. Las restricciones de contratación y negociación se vinculan al botón bloqueado mediante una explicación visible y `aria-describedby`.

## Campus

- Se conservan en el selector los pilotos lesionados o retirados y los entrenadores descansando u ocupados: no desaparecen sin explicación.
- La previsión enumera los bloqueos de la alineación elegida: lesión con fecha y días restantes, descanso, ocupación, impago, coche en reparación/venta/subasta y componentes o gomas por debajo del mínimo. No se puede reservar hasta resolverlos.
- Los mensajes comparan estado actual y mínimo exigido y enlazan desde el campus a pilotos, personal, taller y salud. No se introducen prohibiciones nuevas por fatiga o estrés; siguen siendo factores de rendimiento y riesgo.
- Un impago del entrenador se detecta antes de reservar. Si sucede durante el programa, el informe explica el motivo y conserva únicamente la formación realizada.
- Los informes distinguen programa completado, cancelación, avería, lesión y accidente grave. Muestran duración prevista y real, vueltas realizadas, trabajo pendiente, aprendizaje y desgaste. Una reserva interrumpida mantiene la regla anterior de no reembolso.
- Si el calendario se detiene por una carrera, la ventana indica que debes disputarla o renunciar. Un programa que termine ese día conserva su informe accesible en esa misma ventana.

## Corrección del plazo

Se reprodujo con las semillas 1470, 1580 y 20 un programa de veinte vueltas a intensidad alta anunciado de **12 días**. Antes se interrumpía por avería alrededor del tercer día. `Camps.daily` pasaba minutos de simulación a `Workshop.wear` como un único paso: el integrador térmico pensado para ticks breves sobrepasaba el equilibrio, oscilaba y causaba desgaste de motor artificial.

Ahora se divide cada jornada en pasos de un segundo como máximo, conservando distancia y tiempo totales. En esas tres regresiones el programa llega a los doce días sin incidente, mantiene temperaturas finitas y conserva el desgaste real, incluidos neumáticos y piezas. Un coche desgastado todavía puede sufrir una avería y una lesión sigue pudiendo interrumpir un programa antes de su fecha prevista.

No se modifica el formato del guardado ni se reinician calendarios, contratos o programas existentes. La integración corregida se aplica al avanzar sus siguientes jornadas. Las carreras y montajes históricos conservan sus fixtures exactas. En el programa auténtico 0.8 se siguen comparando fechas, caja, informes y el resto del estado completo; se exceptúan explícitamente la temperatura/desgaste corregidos y las prestaciones derivadas, sin reescribir la fixture original.

## Inscripción

Se corrigió otro bloqueo de interfaz: después de seleccionar una alineación inválida, el botón podía permanecer deshabilitado aunque se corrigieran los requisitos. Ahora se recalculan juntos requisitos técnicos y presupuesto en cada cambio. Las tasas y los neumáticos muestran la cantidad que falta cuando el saldo no alcanza.

## Verificación

`npm run test:feedback` comprueba programas completos de doce días, bloqueos múltiples sin cobros ni RNG, importes y contratos, impagos antes/después de reservar, avería real, lesión temprana y reanudación por guardado/avance agrupado.

`npm run test:feedback:browser` usa los controles del campus para reservar, avanzar dos días, recargar y completar el plazo; intenta volver a entrenar y comprueba los motivos. Revisa lesión y descanso visibles, avisos que no desaparecen a los cinco segundos, contratación bloqueada con descripción accesible e inscripción que se desbloquea al corregir el coche y vuelve a bloquearse por falta de dinero. Comprueba escritorio y móvil sin errores de página ni desbordamiento. La caja y fechas se controlan para aislar estos flujos; no se presentan como una prueba de equilibrio económico.
