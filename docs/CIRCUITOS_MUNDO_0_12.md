# 0.12.0 · Atlas por países y calendarios renovados

## Pistas y países

El atlas pasa de **32 a 68 trazados modernos**: 36 diseños nuevos, repartidos en doce países adicionales. España conserva sus 32 sedes; Portugal, Francia, Italia, Alemania, Reino Unido, Japón, Brasil, Argentina, México, Estados Unidos, Australia y Perú añaden tres cada uno: un urbano, un regional y un nacional. Se mantienen además las seis geometrías históricas para los guardados antiguos; no forman parte de la nueva rotación.

Las sedes son ficticias y se sitúan en países/ciudades reales. Son diseños originales con distintas siluetas, longitud, número de curvas, radio de giro, dificultad y entorno. No se copian planos oficiales ni se anuncian como circuitos licenciados. Hay avenidas y puertos, calles estrechas, horquillas, eses, curvas rápidas, costa, bosque, desierto y noches de neón. Los trazados nuevos miden aproximadamente 2,6–5,9 km y tienen 7–15 curvas de diseño.

## Renovación de temporada

Cada temporada conserva **20 fechas: nueve callejeras, seis regionales y cinco nacionales**, con una final por liga. Las veinte sedes son distintas dentro del año y no se repiten en el año consecutivo, incluidas las finales. Pueden volver en años posteriores; no se generan circuitos nuevos infinitamente.

La selección mezcla países y respeta la categoría de cada sede. Las 68 pistas aparecen a lo largo de cuatro temporadas. Se calcula a partir de la semilla, la temporada y, cuando corresponde, las sedes que ya tenía una empresa al actualizar. No consume el RNG de carreras, CV o economía y no cambia al abrir la pantalla, guardar/cargar, cambiar filtros o actualizar el navegador.

La primera prueba de una empresa nueva sigue siendo Muelles del Sur. En años posteriores la apertura callejera usa la dificultad más accesible entre las sedes seleccionadas. Se conservan fechas, tasas, premios, licencias, puntos de clasificación y verificaciones técnicas. Una sede de una copa no se intercambia con una pista de otra categoría.

## Partidas existentes

Cargar una empresa anterior conserva su calendario, inscripciones, resultados y carrera en marcha. El atlas ampliado ya se puede consultar. La nueva selección se activa al **abrir la siguiente temporada**, sin reiniciar la empresa.

En esa transición también se excluyen las pistas del calendario antiguo. Se conserva una pequeña lista de esas sedes para mantener una rotación reproducible y evitar repeticiones entre los años siguientes. Los índices y geometrías anteriores no cambian; el archivo, los trofeos y las repeticiones siguen apuntando a la misma pista.

## Interfaz

**Competiciones → Los 68 trazados** agrupa las tarjetas por país y permite combinar país, copa, dificultad y búsqueda por nombre/ciudad. Se puede ver todo el atlas, solo las veinte sedes del año o solo las 36 novedades. Cada tarjeta indica sus vueltas, longitud, curvas, categoría y fechas de la temporada si está seleccionada.

Los planos muestran circuito, salida y ramal de boxes con sus puestos. La ficha, el calendario y el muro durante la carrera indican país y ciudad. Los filtros no modifican la partida y funcionan también en móvil. El tutorial explica el atlas y cuándo cambia la temporada.

## Validación

Once escenarios nuevos verifican distribución, categorías, cuarenta semillas durante veinte años sin repeticiones consecutivas, cobertura del atlas, apertura accesible, tasas/fechas, transición desde una empresa 0.11, conservación al guardar, rechazo de calendarios alterados y geometrías/boxes válidos. Se completó una carrera física en cada una de las 36 pistas nuevas con un piloto de prueba experimentado y coche mantenido, comprobando límites de pista, desgaste, finalización y guardado. Es una comprobación de geometría y simulación, no una garantía de que un piloto novato termine todas esas carreras.

Una fixture capturada con el código original **3012e86 (0.11.0)** termina con exactamente sus resultados y estado final anteriores. Las regresiones anteriores mantienen sus constructores por versión. El recorrido de navegador añade filtros combinados, búsqueda/foco, planos, calendario nuevo/antiguo, cambio de año por su botón real y carrera internacional en 1440/1024/390.

La temporada financiera actual paga nóminas, mantenimiento, licencia, renovación, entrenador, campus e investigación, abre 2027 y conserva **6562 US$**. No añade fondos ni habilidades artificiales a la empresa y renuncia a pruebas cuyos requisitos no alcanza. [Registro de la semilla 1470](BALANCE_0_12_1470.json).

Cierre: **366 pruebas de motor, 18 recorridos de navegador, 112 archivos con sintaxis válida y 73 recursos locales presentes**.
