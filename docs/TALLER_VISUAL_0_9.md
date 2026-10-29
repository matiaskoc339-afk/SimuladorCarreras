# Taller visual · 0.9.0

La modificación del coche se realiza sobre una ilustración del modelo elegido. Las zonas numeradas permiten abrir motor/refrigeración, transmisión, tren rodante, chasis, carrocería y aerodinámica. Los dos puntos de ruedas acceden al mismo conjunto: las llantas, frenos y suspensión se compran como juegos completos, no como ruedas individuales.

## Recorrido de uso

1. Abre **Taller**, elige un coche y pulsa una zona de la ilustración o su botón con nombre. Puedes alternar **Lateral / Superior**, ampliar y usar **Vista técnica**. El cambio de perspectiva tiene una transición y respeta la preferencia de movimiento reducido.
2. Selecciona el componente. Aparece su pieza instalada, estado y opción de desmontar, o el equipo original del modelo. Las zonas con mejoras instaladas llevan un indicador verde.
3. Compara una referencia del proveedor o una unidad propia. La imagen muestra el resultado propuesto y la ficha muestra cifras anteriores, nuevas y diferencias, incluidas desventajas. Nada se compra, instala, desgasta ni avanza mientras comparas. La comparación puede mostrar una preparación incompatible: explica sus requisitos y bloquea el montaje.
4. **Revisar montaje** abre el importe concreto: pieza, mano de obra, pago total hoy, días y entrega. También puedes arrastrar una tarjeta a su zona; se abre esa misma revisión antes de gastar. En móvil se utilizan los botones.
5. Confirma para reservar la pieza y una bahía. El coche conserva aspecto, piezas y prestaciones hasta terminar el trabajo al avanzar jornadas. Puedes guardar/cargar a mitad sin repetir cargos. Las nóminas y otros gastos diarios continúan.
6. Al sustituir una mejora, su unidad anterior vuelve al almacén con su desgaste. **Desmontar y recuperar** tiene coste/plazo propios y devuelve el alojamiento al conjunto original. Las piezas originales de fábrica forman parte del coche; no se generan repuestos gratis al sustituirlas.

**Catálogo** y **Mi almacén** permiten buscar por nombre/característica y filtrar por alojamiento. **Mantenimiento** conserva reparación por componentes y diagnóstico/ajuste profesional con mecánico. Los proyectos comparten las bahías existentes con reparaciones y encargos de clientes.

## Catálogo y compatibilidad

Hay **29 referencias en 16 alojamientos**: las 14 anteriores y 15 nuevas. Una partida nueva añade tres unidades físicas por referencia nueva; conserva las cuatro de cada referencia anterior. No se genera dinero ni se consume RNG al activar el catálogo. El stock es compartido con los rivales.

| Familia nueva | Opciones | Requisitos destacados |
| --- | --- | --- |
| Carrocería | Touring, ensanchada, competición | Ensanchada necesita chasis 1; competición, chasis 2. Paneles adaptados al modelo, sin cambiar su identidad/plataforma. |
| Refuerzo de chasis | Calle, Sport, competición | Niveles 1–3; más masa y protección, mayor capacidad de preparación. |
| Motor preparado | Etapas 1, 2, 3 | Etapas altas necesitan refuerzos, refrigeración y embrague; etapa 3 también un kit de frenos. |
| Llantas | Sport 17″, forjadas 18″ | Espacio suficiente en aletas; algunos utilitarios necesitan carrocería Touring. No incluye gomas nuevas. |
| Frenos | Cuatro y seis pistones | Refuerzo 1/2 y llantas de al menos 17″/18″ respectivamente. |
| Refrigeración | Profesional | Añade capacidad nominal para preparaciones altas, masa y fiabilidad. |
| Aerodinámica | Ajustable | Refuerzo y carrocería modificada; apoyo a cambio de masa y velocidad punta. |

Una Touring cuesta **980 + 260 US$** de montaje y tres días sin apoyo. Una ensanchada cuesta **2100 + 550 US$**, además del refuerzo previo. El inicio sigue siendo **4200 US$**, sin regalo de piezas ni especialistas.

La capacidad nominal del chasis de serie conserva las preparaciones anteriores: al menos 180 CV o 1,35 veces la potencia base, con máximo 350 CV. Los refuerzos habilitan al menos 240/320/350 CV. Se comprueba el resultado completo, incluidas las mejoras anteriores y el estado de sus unidades. Las exigencias de refrigeración y frenos usan capacidad nominal: perder estado en carrera no transforma una configuración guardada en incompatible. El desgaste sí reduce su rendimiento. Quitar o rebajar un soporte se bloquea mientras existan piezas que lo necesitan.

Montar paneles o refuerzos exige carrocería base al menos al 65 %. El montaje no repara el motor ni renueva neumáticos. Los límites deportivos siguen siendo independientes: 350 CV calle, 280 regional y 320 nacional; una partida con Copa Club antigua conserva 210 CV. Las tasas, licencia, habilidad del piloto y estado mecánico se comprueban al inscribirse.

## Apariencia y pista

Las vistas utilizan proporciones y familias del modelo real del catálogo: utilitarios, clásicos, familiares, deportivos y cabinas abiertas. Paneles, pasos de rueda, faldones, alerón, jaula, pinzas y llantas muestran la preparación instalada o la comparación identificada como pendiente. Los kits también aparecen en garaje/mercado y en la retransmisión y repetición. Las carrocerías ensanchadas añaden **0,08 m** al ancho físico y las de competición **0,12 m**; tráfico y contactos utilizan ese ancho.

Los efectos de potencia, masa, agarre, frenada, refrigeración y desgaste usan las mismas unidades del inventario que la simulación existente. No se crea una segunda configuración puramente visual. Las ilustraciones son originales SVG/Canvas 2D; esta entrega no incluye editor de pintura/vinilos ni un modelo 3D con desmontaje animado.

## Guardados

Las partidas nuevas tienen el taller visual desde el comienzo. En una empresa **0.8** se activa al abrir Taller, sin empezar de nuevo: conserva coches, saldo, trabajos, entrenamiento, investigación, calendario y RNG. La activación añade solo el marcador/catálogo y la información derivada de piezas instaladas. Una carrera en curso se termina antes de abrir el taller. Una empresa anterior a investigación puede abrirlo mediante **Abrir taller visual**; mantiene sus reglas históricas.

Se guardan las piezas físicas y reservas. La apariencia se deriva de sus alojamientos y se valida al importar; no se acepta una carrocería visual que no corresponda a la unidad instalada. Las fixtures auténticas 0.8, capturadas antes del cambio, comprueban estado completo al terminar una carrera, un montaje y un programa anterior sin activar las reglas nuevas.

## Verificación reproducible

- `npm test`: incluye 15 escenarios específicos en `coachwork.test.cjs` además de las 300 regresiones anteriores.
- `npm run test:browser`: añade `browser-workbench.cjs`, con fundación desde formulario, compra y montaje con los 4200 US$ iniciales, confirmación/cancelación, plazos por días, recarga, devolución, búsqueda, compatibilidad, arrastre y vistas 1440/1024/390. La segunda parte usa caja controlada para revisar más preparaciones; no se usa como prueba de equilibrio.
- `npm run test:balance`: ruta actual de temporada con ingresos, pagos y operaciones reales. `test:balance:v80` conserva la ruta anterior. Una semilla reproducible no demuestra equilibrio de todas las combinaciones posibles.
- Capturas en `test-results/workshop-09-*.png`, incluida una galería de doce modelos laterales.
