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
