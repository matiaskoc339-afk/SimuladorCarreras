# 0.13.1 · puntos independientes y licencia profesional

La Liga Callejera, la Copa Regional Profesional y la Copa Nacional mantienen sus propias clasificaciones. La sede mostraba un total combinado de la temporada que podía confundirse con puntos de una copa; ahora muestra tres marcadores separados. Competición presenta los tres contadores, la clasificación para la final de cada liga y la trayectoria que sirve para conseguir la licencia. Los resultados identifican a qué liga suman sus puntos y el archivo calcula clasificaciones de pilotos independientes a partir de sus carreras guardadas.

## Requisitos

- **Licencia profesional:** 24 puntos callejeros acumulados y pago único de 900 US$. No sirven los puntos regionales o nacionales ni el total combinado. Los puntos callejeros no se gastan al obtenerla.
- **Regional profesional:** licencia obligatoria, además del piloto y coche aptos, reglamento técnico, fecha de inscripción y tasas correspondientes.
- **Nacional:** licencia obligatoria y 12 puntos regionales acumulados, además de sus requisitos propios de piloto, coche e inscripción.
- **Finales:** 12 clasificatorios callejeros para su final, 18 regionales para la regional y 18 nacionales para la nacional. Los puntos de otra liga no sustituyen estos requisitos.

La licencia y las trayectorias callejera/regional se conservan entre temporadas. Los puntos del campeonato anual y sus clasificatorios se reinician al abrir otro año. La interfaz distingue ambas cosas para no confundir, por ejemplo, una trayectoria callejera de 30 puntos con un marcador nuevo de temporada que vuelve a cero.

## Guardados y validación

El formato del guardado, los premios y los puntos existentes se conservan. Se siguen usando los marcadores por copa existentes. Las estadísticas acumuladas de trayectoria y los datos históricos anteriores permanecen disponibles para sus mecanismos empresariales; las clasificaciones deportivas visibles se presentan por liga.

`Competition.licenseStatus` comparte los requisitos y motivos del bloqueo entre la compra real y la interfaz. Se comprueba la licencia antes de iniciar una carrera profesional con inscripción, antes de consumir RNG, reservar recursos o cobrar participantes. Renunciar a una prueba conserva el comportamiento anterior. Las carreras ya empezadas continúan con su simulación guardada.

`league-points.test.cjs` comprueba licencia con solo puntos callejeros, pago único sin gastar puntos, bloqueo de ambas copas profesionales, rechazo atómico de inscripción/inicio, finales por liga, reinicio anual con trayectoria/licencia conservadas, liquidación de una carrera guardada sin modificar otras ligas y archivo del mismo piloto sin sumar entre copas.

`browser-league-points.cjs` revisa los tres marcadores de sede y Competición, bloqueo por puntos callejeros faltantes, tramitación real de la licencia, importes y clasificación sin cambios, requisitos de Nacional, archivo por liga y resultado de una carrera guardada. Verifica 1440, 1024 y 390 px y que consultar clasificaciones no modifica la partida. Los valores de los ejemplos visuales de clasificación y archivo se controlan para diferenciar claramente las ligas; la prueba de resultados completa una carrera real desde una fixture.
