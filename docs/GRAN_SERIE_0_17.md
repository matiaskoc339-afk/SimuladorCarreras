# Gran Serie · 0.17.0

El inicio conserva los 4.200 US$, el coche usado y la necesidad de progresar. Las nuevas máquinas son objetivos de largo plazo; comprarlas no sustituye a contratar y formar un piloto competente.

## Vehículos y plataformas

Se añaden **60 modelos**, seis por familia: urbanos deportivos, rally, coupés, muscle/V8, gran turismo de lujo, superdeportivos, GT de competición, hiperdeportivos, prototipos de resistencia y monoplazas. El mundo suma 148 modelos y el concesionario dispone de 72 referencias nuevas (las doce anteriores más estas sesenta). Los filtros separan las familias; los coches comprados se reponen al renovar el catálogo semanal, conservando tu unidad e historial.

Los seis monoplazas ficticios de Fórmula van de **650 a 1050 CV**, de 810 a 795 kg y de **650.000 a 6.500.000 US$**. Tienen ruedas descubiertas, alerones y cockpit propios, también en carrera y en las dos vistas del taller. Los prototipos tienen carrocería cerrada y otra silueta. Los turismos y deportivos usan los perfiles de su familia. No se usan nombres ni logotipos oficiales de equipos de F1.

La configuración de fábrica aporta refrigeración, aceleración, capacidad estructural, frenada y apoyo aerodinámico según la plataforma. Se captura en la física de carrera y no se acumula al recalcular o cargar. Los 305–365 km/h de ficha del monoplaza son puntas nominales: el piloto, la recta disponible, el tráfico, las curvas, el clima, la carga y el desgaste determinan la velocidad real.

## Preparar el coche

**192 piezas nuevas**: cuatro gamas (Club avanzado, GT Motorsport, Endurance P y Fórmula GP), dieciséis alojamientos y tres enfoques por alojamiento (Resistencia, Equilibrio y Ataque).

Cubren motor, admisión, escape, electrónica, sobrealimentación, transmisión, embrague, diferencial, frenos, suspensión, neumáticos, refrigeración, aerodinámica, chasis, carrocería y llantas. Cada referencia tiene precio, mano de obra, plazo y efectos propios. Resistencia favorece fiabilidad y cuidado de gomas; Ataque ofrece más rendimiento con mayor estrés y desgaste. La vista previa muestra la comparación antes de comprar y montar.

No son intercambiables entre todas las plataformas. Un monoplaza requiere Fórmula GP y un prototipo requiere Endurance P; un kit convencional de calle no sirve. La potencia sigue limitada por estructura, refrigeración, transmisión y homologación deportiva. Las preparaciones más fuertes requieren equipos de apoyo adecuados. Los precios de piezas y mano de obra crecen con la gama. Cambiar llantas no rejuvenece los neumáticos.

El catálogo añade estas referencias al suministro semanal, sin borrar piezas propias. Las subastas conservan sus modelos y preparaciones exclusivas anteriores: no generan kits convencionales sobre monoplazas nuevos. Puedes consignar tus propios vehículos y piezas siguiendo las reglas habituales de la subasta.

## Ascenso deportivo

La calle sigue siendo la entrada accesible. La licencia exige 24 puntos callejeros de trayectoria y 900 US$. La Nacional exige además 12 puntos regionales de trayectoria. Las clasificaciones por liga siguen separadas.

| Categoría | Tasas y transporte por ronda | Premio al ganador | Potencia | Valoración mínima |
| --- | ---: | ---: | --- | ---: |
| Regional profesional | 3.250 US$ | 10.000 US$ | Hasta 350 CV | 26 |
| Nacional GT | 16.000 US$ | 100.000 US$ | 300–650 CV | 45 |
| Prototipos | 40.000 US$ | 260.000 US$ | 500–1150 CV | 62 |
| Fórmula | 90.000 US$ | 650.000 US$ | 600–1350 CV | 75 |

Las finales cuestan un 50 % más y duplican los premios de posición. También pagan los demás puestos según su tabla. No es beneficio neto: descuenta inscripción, personal, neumáticos, combustible, preparación y daños. Un abandono puede dejarte con los gastos y sin premio.

La Nacional conserva sus cinco fechas y su marcador. **Eliges una división para toda la temporada**, GT, Prototipos o Fórmula, antes de que se inscriba o se resuelva la primera prueba nacional. No puedes cambiar para buscar premios o eludir una parrilla ya fijada; el año siguiente puedes escoger otra. La final mantiene la clasificación de 18 puntos y el podio da trofeo con la división grabada.

La verificación superior exige estado general, frenos, suspensión y gomas más sanos. GT: 80/85/80/55 %. Prototipos: 85/90/85/65 %. Fórmula: 90/95/90/75 %. La ficha indica el motivo del bloqueo. En Fórmula solo entran monoplazas; en Prototipos se admiten prototipos, hiper y superdeportivos compatibles. GT admite plataformas de carretera y GT dentro de sus límites.

## Rivales y persistencia

Seis equipos de fábrica tienen presupuestos iniciales propios, cuatro coches por equipo, dos pilotos (GT y élite), personal contratado y una trayectoria previa explícita. Deben pagar entradas, contratos, reparaciones y mejoras. No reciben dinero periódico gratuito. Tres equipos de fábrica rotan como invitados regionales; en Nacional utilizan el coche de la división elegida.

La IA prepara coches dentro del límite de su categoría, protege su flota de competición y programa mantenimiento del vehículo que va a usar. Siguen existiendo lesiones, descanso, errores y problemas de caja: no hay una parrilla garantizada artificialmente ni resultados prefijados.

Se conservan partidas anteriores. La ampliación se activa fuera de una carrera o subasta en directo. No cambia dinero, coche, contrato ni RNG del jugador, y respeta la temporada nacional ya empezada o inscrita hasta el siguiente año. Una carrera antigua en curso mantiene su física y sus reglas exactas. Las nuevas carreras habilitan el margen físico para velocidades de élite; las antiguas conservan su límite anterior.

## Corrección 0.17.1

En carreras nuevas, los daños reducen también la refrigeración y el apoyo aerodinámico de fábrica. La instantánea `factoryWearVersion` conserva el comportamiento de las carreras ya guardadas.

Los equipos de fábrica preparan la categoría elegida y su coche regional. La potencia se comprueba como si todas las piezas estuvieran reparadas al 100 %; una pieza gastada no permite instalar mejoras que luego excedan el reglamento. Si una preparación anterior ya excede ese límite, la IA programa el desmontaje de potencia antes de volver a competir.

Las pujas de estos seis equipos requieren utilidad deportiva y reservan tres meses de nóminas y tres inscripciones. El gasto de subastas se limita por temporada al 6 % del capital inicial del equipo, se registra al pagar y se conserva al cargar. Se respetan las pujas vinculantes anteriores. Los coleccionistas y los demás rivales mantienen sus reglas.
