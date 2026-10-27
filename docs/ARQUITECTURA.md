# Arquitectura de la 0.1

## Un mundo, un estado

`RCS.createGame(nombre, logo, semilla)` crea el estado versionado. Las entidades tienen identificadores únicos dentro de la partida, generados con un contador persistente. Las relaciones usan esos identificadores, nunca índices de pantalla. Al cargar no se regenera ninguna entidad. La partida usa fechas UTC para que el calendario no dependa de la zona horaria del ordenador.

| Archivo | Responsabilidad |
| --- | --- |
| `js/data.js` | Catálogos extensibles, rasgos, reglamento, puntos y trazados |
| `js/core.js` | Estado inicial, IDs, RNG reproducible, consultas y eventos/noticias |
| `js/economy.js` | Única vía de movimiento monetario, libro de caja, servicios y mantenimiento |
| `js/drivers.js` | Currículums, atributos, negociación, contratos y evolución básica |
| `js/calendar.js` | Orquestación diaria, bloqueo de carreras, apertura de temporadas |
| `js/race.js` | Inscripciones, participantes, física y resultados, sin DOM |
| `js/storage.js` | Serialización, validación, checksum, ranuras y recuperación |
| `js/render.js` | Dibujos originales de vehículos, sede y circuito |
| `js/ui.js` | Presentación del estado y composición de pantallas |
| `js/app.js` | Entrada de usuario, formularios, editor Canvas, bucle y autoguardado |
| `scripts/server.cjs` | Servidor estático local, sin paquetes externos |

Se usan scripts clásicos con un único espacio de nombres `RCS`, en orden explícito. Esto permite ejecutar los mismos sistemas en Node (`vm`) y en navegadores, incluyendo contextos que permiten `file://`, sin empaquetador. Los archivos de simulación no acceden a la interfaz.

## Orden de una jornada

1. Impedir el avance si hay una carrera pendiente hoy o una carrera en curso.
2. Incrementar la fecha.
3. Cobrar $18 de gastos diarios a las compañías activas. Devengar los sueldos con salario/30 y liquidarlos el día 1.
4. Completar reparaciones y entregar encargos vencidos.
5. Recuperar fatiga, procesar entrenamiento pagado, liquidar contratos vencidos y reponer asientos rivales cuando hay recursos.
6. Evaluar la solvencia **después de todos los cobros y pagos**. Catorce jornadas consecutivas en negativo llevan a bancarrota.
7. Publicar recordatorios reales y detenerse si ha llegado una carrera.

El avance hasta la próxima prueba repite exactamente este proceso: no salta pagos, entrenamientos ni contratos. Los meses de contrato se modelan como 30 días, explicitado en el contrato de esta primera versión. Las cifras salariales son una cuota normalizada de 30 días.

## Simulación deportiva

Los circuitos son curvas Catmull–Rom muestreadas. Cada segmento tiene longitud y un límite de velocidad según su cambio de dirección. Cada coche guarda distancia recorrida, velocidad, carril, estado, neumáticos y ritmo. Se anticipan las curvas para frenar; el ratio potencia/peso limita la aceleración, y piloto/agarre/estado limitan la velocidad objetivo. El tráfico bloquea a un coche hasta que cambia de línea para adelantar. El modelo es longitudinal con desplazamiento lateral simplificado, no un simulador físico rígido ni un sistema completo de colisiones.

La lógica corre en pasos de 0.05 s. El bucle visual acumula tiempo y ejecuta tantos pasos como corresponden; ×4 aumenta los pasos, no cambia su tamaño. Un RNG propio de la carrera evita que guardar o cambiar la frecuencia de render altere sus resultados. Los órdenes cambian el ritmo, desgaste y riesgo. La simulación se puede pausar o serializar en cualquier paso. La física no depende del Canvas.

`Race.finish` requiere meta/abandono de todos los participantes y un evento aún no resuelto. Aplica una única vez puntos, premio, reputación, experiencia y desgaste. Después elimina la carrera activa. Las renuncias confirmadas usan el mismo motor para los rivales, sin coche del jugador. La clasificación de pilotos se deriva de resultados, por lo que un cambio de compañía no traslada puntos entre equipos.

## Persistencia y evolución

El sobre `RCS` almacena versión, fecha de guardado, checksum FNV y estado JSON. La validación comprueba IDs duplicados, propiedad, contratos, catálogo, calendario y carrera. Se valida antes de escribir o aplicar una importación. La copia anterior solo se reemplaza por un guardado validado. Los acumulados económicos sobreviven a la poda del libro de movimientos.

Los datos reservan espacios de estado para empleados, mercado, investigación y relaciones. No son sistemas implementados ni pantallas vacías: se desarrollarán con sus comandos y pruebas en sus versiones. El esquema debe migrarse antes de cambiar incompatiblemente una entidad. Las nuevas operaciones económicas deberán usar `Economy.transact/spend`, y publicar noticias después de una mutación real.

No se introducirá un sistema de sucursales. Las futuras instalaciones pertenecen a una única sede. La IA de la 0.2 deberá operar sobre estos mismos coches, pilotos y saldos, no inventar inventarios ni recursos paralelos. El plan completo permanece en `ROADMAP.md` y la especificación original.
