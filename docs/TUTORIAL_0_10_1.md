# Tutorial para nuevos jugadores · 0.10.1

Al fundar la primera compañía en un perfil nuevo se abre una guía corta. Tiene **once pasos**, tres ideas principales por paso y botones para ver las pantallas relacionadas. Un marco señala la zona de la interfaz que se está explicando.

| Paso | Qué enseña |
| --- | --- |
| Dinero y calendario | Dirigir sin conducir, presupuesto inicial, obligaciones, avance de jornadas y dónde consultar la guía. |
| Pilotos y contratos | Valoración y habilidades reales, negociación, duración/primas/cláusulas, fatiga, estrés, descanso y lesiones. |
| Garaje y taller | Estado por componentes, vistas lateral/superior, comparación, compatibilidad, inventario, costes/plazos y devolución con desgaste. |
| Especialistas | Nivel y salario, efectos de cada puesto, motivación, descansos, aumentos, conflictos y salidas a la competencia. |
| Entrenar e investigar | Programas por días, reservas y riesgos, informe final, entrenador e investigador, árbol de mejoras y costes. |
| Ligas y temporadas | Calle/profesionales, tasas, puntos, licencia, reglas y clasificación para las finales. |
| Carreras y boxes | Órdenes, combustible, gomas, clima y temperatura, servicio simultáneo, ayuda del personal, minijuego manual, cámaras y repetición. |
| Instalaciones y gestión | Una sede, obras, capacidades, diez niveles y descenso, políticas y presupuestos de automatización. |
| Mercado y subastas | Compraventa compartida, raros, pujas de diez segundos vinculantes, reservas, retirada y venta con 80 % neto. |
| Acuerdos y rivales | Patrocinadores/fabricantes, condiciones, crédito e intereses, nóminas, encargos y decisiones económicas rivales. |
| Guardar y seguir | Noticias, archivo de temporadas, cinco ranuras, guardado/exportación y primer objetivo de juego. |

**Siguiente / Anterior** recorren la guía. **Un poco más de detalle** amplía cada tema; **Ir a un tema** permite saltar a una parte concreta. Los botones de pantalla solo cambian la vista: no compran, contratan, inscriben ni pasan días. Al salir recuperas la pantalla de origen. El último paso también permite abrir Pilotos para empezar a jugar.

Puedes pulsar **Omitir tutorial** o Escape en cualquier momento. Si lo terminas u omites, no vuelve a abrirse automáticamente al recargar o fundar otra compañía. Si cierras el navegador a mitad, la misma partida reanuda en el paso guardado al cargarla.

La preferencia pertenece al perfil del navegador, fuera de las cinco ranuras y del JSON de la partida. Un jugador con partidas anteriores no recibe el recorrido automáticamente. Siempre puede abrirlo de forma voluntaria desde **Partidas y opciones → Cómo jugar**. La consulta manual no provoca nuevas apariciones automáticas.

No se abre durante una carrera, subasta o práctica en directo. La ayuda se puede consultar antes o después de esas actividades. El diálogo retiene el foco del teclado, bloquea acciones del fondo y admite pantallas pequeñas y movimiento reducido. Las preferencias se escriben en almacenamiento local y de sesión con una revisión para elegir la copia más reciente. Si el navegador bloquea ambos, se recuerda la decisión mientras esa sesión de la aplicación siga abierta; borrar los datos del navegador también elimina sus preferencias.

Verificación: `npm run test:tutorial` con Playwright y el servidor iniciado. El recorrido compara el estado de simulación completo al enseñar todas las pantallas, prueba finalización/omisión/reanudación y consulta de guardados anteriores, teclado, distintas dimensiones y fallo de escritura de preferencias. Las quince rutas de navegador previas también pasan. Las capturas quedan en `test-results/tutorial-*.png`.
