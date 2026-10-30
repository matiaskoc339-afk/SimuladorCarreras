# 0.11.0 · Suministro semanal, concesionario y palmarés

## Catálogo del taller

Cada siete jornadas de juego llegan **64 referencias nuevas**, cuatro por cada uno de los **16 alojamientos**. Hay ocho fabricantes y especializaciones con ventajas y contrapartidas reales: potencia/carga térmica, agarre/desgaste, apoyo/resistencia al avance, aligerado/tolerancia al daño, refrigeración/peso y frenada/llantas necesarias. Los 29 recambios básicos permanecen y se reponen hasta un mínimo de dos unidades. Las novedades tienen una unidad compartida con los rivales.

La renovación ocurre al avanzar el calendario, nunca al abrir una pantalla, recargar o cambiar filtros. El taller muestra la semana y fecha de renovación. Todas las novedades usan el comparador, los requisitos, el inventario físico, los trabajos por días y la simulación de carrera existentes. Se conserva la preparación hasta que termina el montaje.

Las referencias semanales codifican semilla, semana y posición. Su definición es determinista y recuperable al importar, aunque la oferta haya caducado. Una caché acotada evita añadir miles de definiciones al catálogo global. La rotación retira solo stock libre del proveedor: no elimina unidades compradas, instaladas, reservadas, de rivales ni consignadas. Las piezas exclusivas de subasta continúan fuera del proveedor.

**Doce familias de carrocería**, cuatro por semana y todas presentes en un ciclo de tres semanas: Touring limpio, ligero, refrigerado y Gran Turismo; Wide atornillado, montaña, resistente y velocidad; Silueta Sprint, Endurance, Aero y Carbono. Conservan la plataforma original, cambian estadísticas, espacio para llantas, ancho físico y requisitos de chasis. Tienen detalles de paneles y acabados distintos en las dos vistas y la carrera. Las familias de uso se repiten, pero las referencias y sus calibraciones semanales se renuevan; no se promete una geometría completamente nueva para siempre.

## Autos nuevos y usados

**Mercado → Autos usados / Autos nuevos · concesionario** separa ambos canales. El concesionario añade doce plataformas ficticias deportivas de 2026, desde **28 000 US$**, **170–320 CV**, mecánica y gomas al 100 %, cero kilómetros y una configuración de fábrica propia para cada modelo. Hay utilitarios deportivos, compactos, GT, familiares rápidos, roadster, targa y deportivos de motor central. El total es **88 modelos**: 64 del mercado anterior, 12 de subasta y 12 del concesionario.

La unidad existe antes de comprar y tiene su propio ID. Se paga una vez, ocupa garaje, conserva su historial y admite preparación en los 16 alojamientos. No incluye mejoras de posventa regaladas: sus prestaciones son su equipamiento base de fábrica. La compra respeta fondos, capacidad y plazas comprometidas en subasta. Al matricularse pasa al mercado de usados; su valoración aplica una depreciación inicial del 16 %, además de kilometraje y desgaste. Se repone semanalmente una unidad de cada modelo vendido; las unidades nuevas no vendidas no se duplican.

## CV semanales y prestigio

El inicio conserva **4200 US$**, los candidatos de valoración **10–25** y las nóminas diarias. Cada siete jornadas se retiran del tablón los candidatos semanales no contratados y llegan **12 pilotos distintos**. Se mantienen cuatro búsquedas de iniciación para no obligar a pagar sueldos de élite. El resto mejora con el nivel empresarial y la reputación, con dispersión, personalidad, edad, experiencia, potencial y rostro propios. Los salarios se calculan sobre sus habilidades reales; recibir un CV no evita sus requisitos de contratación.

Un ojeador contratado y disponible entrega también **2 + parte entera de nivel/3** descubrimientos por semana. Nivel de ojeador, nivel de compañía y prestigio influyen conjuntamente en el talento, y su precisión afecta al informe de potencial. Conserva la posibilidad de una sorpresa y la incertidumbre; los descubrimientos generan experiencia y estrés. No entrega informes si está descansando o ocupado en una evaluación. Los informes antiguos se pueden consultar, indicando si el CV ha caducado.

La caducidad afecta a ofertas libres, no al contrato de un piloto contratado. Un nombre, retrato o entidad anterior no se recicla para rellenar la nueva convocatoria. Se conservan los pilotos históricos para no romper contratos, resultados, informes y relaciones. Los patrocinios validan disponibilidad y nivel del piloto impuesto antes de reservar fondos.

## Vitrina de trofeos

La navegación incorpora **Vitrina de trofeos**, enlazada también desde Competiciones, Archivo y el resultado de una gran final ganada. El podio de las **finales regional y nacional** entrega oro, plata y bronce. No hay trofeo por una ronda normal, una final callejera, un abandono o por completar el calendario.

| Gran final | Oro | Plata | Bronce |
| --- | ---: | ---: | ---: |
| Regional profesional | +6 | +4 | +2 |
| Nacional | +12 | +8 | +5 |

Los valores son reputación adicional, con máximo empresarial de 100. Se aplican una sola vez al liquidar la carrera, también a los rivales. La vitrina guarda copa, temporada, posición, piloto, circuito y prestigio efectivamente recibido. Las finales siguen exigiendo licencia, puntos de clasificación de la liga, piloto/coche aptos y tasas. Los campeones se deciden en la final según el reglamento existente; no se sustituye por la suma de las rondas.

Los premios sobreviven a nuevas temporadas y a exportar/importar. La validación rechaza duplicados, premios incoherentes y trofeos sin un podio final del calendario o archivo. Los resultados anteriores a activar esta versión siguen en el archivo; no se inventan copas ni bonificaciones retroactivas.

## Actualizar y comprobar

Una empresa nueva incorpora todo. En una empresa con taller visual 0.9/0.10, abre Taller, Mercado, Pilotos o Vitrina fuera de carrera/subasta para activar sin reiniciar. Cargar un guardado o visitar pantallas desde el tutorial no ejecuta la actualización. Se conservan caja, trabajos, contratos, ligas, subastas y sus relojes. Las empresas anteriores pueden activar primero las mejoras de investigación/taller de su versión.

`npm test` incluye veinte escenarios nuevos en `commerce.test.cjs`. `test:commerce` ejecuta estos escenarios. `test:commerce:browser` comprueba el flujo visual, compra real, recarga y 1440/1024/390. `test:balance` usa el constructor actual y una temporada prudente sin financiar artificialmente la empresa; los constructores anteriores permanecen disponibles para regresión.

Cierre de validación: **355 pruebas de motor, 17 recorridos de navegador, 106 archivos con sintaxis válida y 69 recursos locales presentes**. La temporada prudente de la semilla 1470 abre 2027 y termina el programa de formación/investigación con **9080 US$**, sin financiación artificial. [Registro de pruebas](PRUEBAS.md).
