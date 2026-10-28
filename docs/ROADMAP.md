# Plan de desarrollo

La entrega actual es **0.5 — Carreras avanzadas**, conservando los contratos y el rediseño. El resto está pendiente; no se representa con controles decorativos ni se considera terminado por disponer de campos de estado.

| Versión | Resultado previsto                                                                                                                                                   | Estado                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | Creación/logotipo, sede, calendario, finanzas básicas, coche inicial, currículums y negociación, seis carreras visuales, resultados, noticias, temporada y guardados | Implementada y probada                                                                                                                                    |
| 0.2     | IA empresarial por utilidad y personalidad: compras/ventas reales, contratación y transferencias, finanzas y activos compartidos, crisis y noticias verificables     | Implementada y probada; mercado básico compartido, decisiones por utilidad, traspasos, crisis y expedientes                                               |
| 0.3     | Catálogo de piezas, compatibilidad, inventario, instalación, modificaciones y desgaste por componentes                                                               | Implementada y probada; 14 mejoras, compatibilidad, stock físico, trabajos, reparación y desgaste por componentes                                         |
| 0.3.1   | Rediseño completo, navegación, taller por secciones, circuitos a escala, retransmisión y tráfico con contactos                                                       | Implementada; tres cámaras, zoom, radio, colisiones, daños, pérdidas de control y amarillas locales                                                       |
| 0.4     | Negociaciones profundas, patrocinio con condiciones y pilotos impuestos, fabricantes, préstamos y cláusulas                                                          | Implementada en catálogo inicial: negociación, cinco marcas, condiciones, piloto impuesto con coche financiado, crédito, cláusulas, promesas y renovación |
| 0.5     | Física/tráfico mejorados, más cámaras, boxes, compuestos, clima, colisiones, banderas y repeticiones                                                                 | Implementada en simulación 2D: tráfico, colisiones, cámaras, compuestos físicos, combustible, clima, boxes, VSC, sanciones y repetición grabada           |
| 0.6     | Ampliación de la única sede, empleados especializados, políticas de automatización, I+D, academia y relaciones laborales                                             | Pendiente                                                                                                                                                 |
| 0.7     | Compra/venta/subastas, importación, precios dinámicos, repuestos, fabricantes, coleccionistas y editor de libreas                                                    | Pendiente                                                                                                                                                 |
| 0.8     | Envejecimiento/retiro, generaciones, lanzamientos ficticios, reglamentos cambiantes, fusiones, crisis y archivo histórico extenso                                    | Pendiente; se conservan los resúmenes de las temporadas actuales                                                                                          |
| 0.9     | Balance a largo plazo, IA y contratos más profundos, variedad, relaciones, nuevas categorías y optimización                                                          | Pendiente                                                                                                                                                 |
| 1.0     | Integración y validación completa, balance final, contenido y distribución                                                                                           | Pendiente                                                                                                                                                 |

## Criterios de continuidad

- Mantener la experiencia jugable de la versión anterior y sus escenarios de prueba.
- Cada transacción altera saldos e inventarios de las entidades reales.
- Las noticias se publican a partir de acciones confirmadas.
- El RNG de partida/carrera se conserva al guardar.
- Las nuevas versiones deben validar/migrar el esquema sin regenerar el mundo del jugador.
- Probar contratos, mercado, taller, carrera, rivales, noticias, guardado, patrocinio condicionado, evolución y bancarrota conforme se incorporan. La compraventa básica (B) se valida desde 0.2 y piezas/montaje (C) desde 0.3; patrocinio condicionado (H) se valida desde 0.4.
- Retener la especificación íntegra del usuario; el desarrollo incremental no elimina mecánicas.
