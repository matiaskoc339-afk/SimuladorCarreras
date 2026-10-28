# Racing Company Simulator · 0.6

Una temporada jugable de gestión automovilística con compañías rivales que administran sus recursos. HTML, CSS y JavaScript sin dependencias de ejecución, recursos remotos, cuentas ni conexión permanente. No conduces el coche: diriges la empresa y das órdenes a tu piloto.

## Iniciar

Desde este directorio, con Node.js 18 o superior:

```sh
npm start
```

El servidor usa el puerto **4173** (configurable con `PORT`). No hace falta ejecutar `npm install`. También puedes servir la carpeta con `python3 -m http.server 4173`.

Los scripts clásicos y recursos relativos permiten abrir `index.html` directamente en navegadores que admitan archivos locales y almacenamiento local. La política de Chromium del entorno de desarrollo bloquea `file://`, por lo que allí se ha validado el servidor HTTP. Usa siempre el mismo origen para conservar tus ranuras; exporta/importa para trasladarlas entre orígenes o equipos.

## Tu primera temporada

1. Funda una compañía y dibuja su logotipo. Hay pincel, borrador, colores, grosor, deshacer/rehacer, transparencia, vista previa y exportación PNG.
2. Abre **Pilotos** desde la navegación o desde su edificio en la sede. Estudia los currículums y negocia salario, duración y prima. Las ofertas insuficientes reciben una contraoferta; insistir puede pausar la negociación.
3. Selecciona **Garaje** para consultar el Civic EP3, su estado y su historial. Las revisiones cuestan dinero y duran dos días; los neumáticos estándar cuestan $160. Desde allí puedes abrir el nuevo taller de modificaciones.
4. En **Competiciones**, inscribe a tu piloto y coche. Cada ronda cuesta $370 con transporte. Puedes hacerlo hasta la jornada de carrera.
5. Avanza día a día o hasta la próxima prueba. Cada día se procesan las mismas obligaciones. El calendario se detiene en las carreras: solo una renuncia confirmada permite no participar.
6. Sigue la carrera en una retransmisión 2D con cronometraje, radio y telemetría. Usa **Atacar / Equilibrado / Conservar**, selecciona un piloto en la clasificación para seguirlo, cambia entre TV / seguimiento / circuito, ajusta el zoom y la velocidad ×1 / ×2 / ×4, o pausa con el botón o la barra espaciadora. Los resultados no están predeterminados.
7. Completa las seis pruebas. Los premios, puntos de pilotos/equipos, kilometraje, fatiga, desgaste y reputación se registran al cruzar la meta. Al terminar recibirás una prima de clasificación y la temporada quedará archivada.
8. Puedes abrir la siguiente temporada. Se conserva el mundo y se contabiliza el descanso hasta el siguiente 5 de enero. Revisa los contratos que vencen.

**Finanzas** contiene el libro de movimientos, previsión mensual, edición de identidad y encargos de taller. Cada encargo produce $360 netos en tres días, con un máximo de uno cada siete días. Comparte el taller con las revisiones.

## Alcance entregado

- Menú, creación de compañía, identidad y sede 2D interactiva.
- Calendario desde enero de 2026 y temporadas sucesivas.
- Salarios devengados por día y liquidados el día 1; primas, alquiler, gastos logísticos, servicios, reparaciones, premios y descubierto con 14 días de recuperación. La bancarrota termina la partida.
- Un coche inicial y siete equipos rivales con recursos finitos, flotas y plantillas persistentes. La IA de la 0.2 evalúa compras/ventas, fichajes/traspasos, revisiones, neumáticos, formación, encargos y reducción de gastos según personalidad, necesidad y reserva salarial.
- Pilotos con 12 atributos, rasgos, potencial oculto, contratos, descanso, formación básica y experiencia de carreras.
- Copa Club con seis circuitos/rondas, clasificación de equipos y pilotos, resultados e historial de temporadas.
- Simulación visual de paso fijo: aceleración según potencia/peso, frenada anticipada, habilidades, rebufo, búsqueda de huecos para adelantar, defensa, ritmo y desgaste. Los contactos dañan sistemas reales; los derrapes y trompos dependen del piloto y del agarre. Los accidentes pueden causar abandono y amarillas locales. Tres cámaras, minimapa y zoom.
- Periódico de hechos reales del estado de juego, con enlaces a sus entidades y un archivo limitado.
- Cinco partidas, guardado automático/manual, exportación/importación JSON, validación de formato/versión/entidades, checksum y copia anterior por ranura. Una carrera en curso se guarda con sus participantes y RNG, sin pagar recompensas de nuevo al cargar.

Los nombres de coches son referencias descriptivas. Todas las ilustraciones, circuitos, retratos e identidades son dibujos originales generados localmente con SVG/Canvas. Las cifras son **parámetros de juego**, no datos certificados de fabricantes. Los circuitos son ficticios. No se usan logotipos oficiales.

## Novedades de la 0.6 · sede y progresión, primera entrega

Abre **Instalaciones y progreso** desde la navegación o desde la sede. Esta entrega inicia la expansión empresarial; empleados, automatización, academia e investigación siguen pendientes.

- **Cuatro instalaciones reales:** garaje, taller, almacén y oficina de equipo, con cinco niveles cada una. Una obra simultánea por compañía, pagada a una constructora persistente, con fecha de entrega. Hasta entonces se conserva la capacidad actual. Los rivales también pueden invertir, respetando una reserva para tres meses de operación.
- **Capacidad física:** el garaje pasa de dos a un máximo de diez coches; el almacén, de ocho a cuarenta repuestos; la oficina, de dos a seis pilotos. No aumenta la cantidad de coches admitidos por compañía en Copa Club: sigue siendo uno.
- **Taller operativo:** los niveles 3 y 5 abren la segunda y tercera bahía. Encargos y trabajos comparten esas plazas; un mismo coche no puede recibir dos trabajos simultáneos. El equipamiento reduce los plazos de trabajos nuevos, con un mínimo de un día; conserva el vencimiento de los ya contratados. La pantalla muestra todas las tareas y los plazos efectivos.
- **Coste de crecer:** las ampliaciones añaden conservación diaria desde la entrega, visible también en Finanzas. Una cancelación devuelve la mitad de la parte pendiente de ejecutar; movilización y trabajo realizado no se recuperan. La devolución se descuenta de la constructora y se registra una sola vez. La bancarrota liquida la obra pendiente.
- **Diez niveles empresariales:** objetivos acumulados de trayectoria, carreras, podios/victorias, reputación, patrimonio, reserva de un mes de operación y ampliaciones. El primer ascenso exige al menos 120 días y tres carreras; el nivel 10 exige al menos veinte años. Se revisan al avanzar una jornada, con 90 días entre cambios. Los niveles 3, 5 y 7 permiten instalaciones de nivel 3, 4 y 5. No se entregan fondos ni activos por ascender. Los desbloqueos de nuevas categorías y el resto del mundo continuarán con sus sistemas correspondientes.
- **Descenso con consecuencias:** 90 días consecutivos con reputación inferior a la mitad de la exigida por el nivel y menos de un mes de caja provocan un descenso. Recuperarse reinicia el contador. Los edificios, plazas, contratos y vehículos ya adquiridos se conservan.
- **Sede visible:** las ampliaciones cambian edificios, etiquetas y capacidad; una obra muestra su estado en el mapa. Se mantiene una sola sede.
- **Archivo deportivo:** cada temporada completada conserva nombres históricos, clasificación de pilotos y equipos y resultados de las seis rondas. En **Archivo histórico → Consultar pilotos y carreras** puedes abrirlos después de empezar otra temporada, sin volver a simular ni cobrar premios. Las partidas antiguas conservan sus resúmenes y recuperan el detalle de la temporada todavía presente; no se inventan resultados que nunca se guardaron.

Los precios y metas son parámetros iniciales de juego, pendientes del balance a largo plazo. Se mantienen los guardados y las carreras anteriores: la migración no cambia activos, facturas, resultados ni RNG. No se requieren cuentas ni paquetes adicionales.

## Novedades de la 0.5 · estrategia en pista

Al inscribirte, consulta el **pronóstico**, elige el compuesto y una carga inicial de **1 o 3 litros**, incluida en los gastos de carrera. Con un litro hay menos carga, pero puedes necesitar repostar. Durante la prueba, abre **Boxes y estrategia** bajo la telemetría; puedes conservar combustible, defender posición, solicitar un juego, reparación rápida y repostaje. El resumen muestra paradas y sanciones.

- **Cinco opciones de neumático:** las gomas de calle que ya lleva el coche, slick blando, slick duro, intermedio y lluvia. El blando gana agarre y consume más; el duro dura más. Agua, temperatura, desgaste y habilidad del piloto cambian su rendimiento. Un neumático agotado puede pinchar y obliga a reducir el ritmo o cambiarlo.
- **Juegos reales:** los de competición cuestan $200–$260, se descuentan del stock compartido y conservan ID y condición. La inscripción o la orden de boxes reutiliza primero tu mejor juego libre con al menos 35 %; el presupuesto indica si reutiliza o compra. Hasta ocho juegos libres/reservados por compañía. Consulta y descarta juegos libres en **Garaje → Tus juegos de carrera** si quieres liberar espacio o comprar otros nuevos. Los juegos de calle apartados conservan desgaste y pinchazo: cambiar a un compuesto de carrera no los rejuvenece ni crea repuestos para vender.
- **Boxes operativos:** el coche alcanza la entrada, recorre el carril a 60 km/h, hace cola si corresponde, se detiene y se reincorpora esperando un hueco. Servicio base $55, más consumibles. La reparación rápida cuesta $140 y añade doce segundos: mejora parcialmente carrocería, suspensión y refrigeración, sin restaurar piezas, motor ni transmisión. Repostar cuesta $5/litro; el depósito admite ocho litros. El coste y la vuelta de entrada se muestran antes de pedirlo.
- **Tiempo y consecuencias:** la parada pierde tiempo real y se cobra al detenerse; un juego nuevo se paga al reservarlo. Cancelar antes de entrar conserva ese juego en el almacén. Un servicio interrumpido devuelve el combustible no entregado. Desactivar el limitador puede producir una sanción de cinco segundos por exceso medido, servida en boxes o sumada al tiempo final.
- **Clima dinámico:** pista seca, lluvia ligera/intensa y secado gradual. El agua modifica frenada, apoyo y riesgo; la adaptación del piloto y el compuesto importan. El pronóstico es probabilístico. Hay agua sobre el asfalto y lluvia visible. Los rivales eligen y solicitan gomas según las condiciones, el desgaste, el combustible y su presupuesto.
- **Dirección de carrera:** se conservan las amarillas locales. Dos coches retirados que obstruyen activan un coche de seguridad virtual (VSC), con límite global de 72 km/h y sin maniobras de adelantamiento. Los retirados en boxes se apartan gradualmente para liberar el carril. Son procedimientos simplificados de la Copa Club, no un reglamento federativo completo.
- **Repeticiones:** una instantánea pausa la carrera y reproduce lo ya grabado. Puedes buscar un momento, elegir piloto/cámara y ver a ×0.5/×1/×2. Al volver se recupera la pausa anterior. Tras la meta se conserva la última grabación, accesible en resultados y Competiciones; cambiar cámaras o repetir no recalcula premios, RNG, daños ni contratos.

El proveedor empieza con stock finito, compartido con los rivales. Cada treinta días puede financiar pequeñas reposiciones con su saldo, sin reponer por recargar la partida. Se guarda un máximo de 480 fotogramas por grabación, con muestreo adaptativo y hasta 120 acontecimientos; se conserva solo la última carrera más la grabación en curso. Los resultados históricos anteriores permanecen. El modelo sigue siendo 2D con física y asistencia de boxes simplificadas.

## Novedades de la 0.4 · contratos y economía

Abre **Patrocinios y crédito** desde la navegación, o desde Finanzas. Hay cinco marcas ficticias con presupuestos finitos y convocatorias compartidas con los rivales. La pantalla separa ofertas, acuerdos propios, financiación y archivo del paddock.

- **Negociación comercial:** pide un anticipo y una cuota por ronda, ofrece presencia mínima del 50/70/100 %, actos promocionales y una posición objetivo. Las marcas valoran reputación, relación y contraprestaciones; pueden contraofertar o pedir una pausa tras insistir. Revisa y confirma el contrato antes de firmar. Se reservan todos sus pagos futuros, no aparece dinero al actualizar la pantalla.
- **Obligaciones reales:** logotipo visible, exclusividad de sector, un modelo o pieza determinada, participación y promoción. Los actos cuestan $80 y se completan al avanzar un día. Cada ronda conserva su evaluación. Una salida con abandono cuenta como participación; una renuncia no. Una cuota solo se paga cuando se cumplen las condiciones de esa ronda.
- **Piloto impuesto y fabricante:** Proyecto NB exige a un piloto concreto, seleccionado por sus atributos visibles, y un MX-5. Si hace falta, contrata al piloto por 12 meses a su salario y financia la compra de una unidad existente del mercado. Necesitas plazas y debes afrontar salarios y mantenimiento. No se crea un coche ni se duplica su historial o equipamiento.
- **Consecuencias:** al cerrar el acuerdo se comprueban la cuota de rondas y los actos. El 70 % de seis rondas exige cinco. Si incumples se devuelve la parte no ganada del anticipo y del capital para coche, más la indemnización mostrada, y caen reputación y relación. Ese cobro puede dejarte en descubierto. La rescisión voluntaria muestra y exige su coste antes de ejecutarse. La reserva no usada vuelve a la marca. La prima final depende de la clasificación pactada.
- **Préstamos:** el Banco Circuito tiene liquidez finita y valora reputación, activos, ingresos, deuda e impagos. Solicita $1,000–$8,000, según el límite aprobado, a tres o seis cuotas cada 30 días. Se desglosan capital, coste total e intereses. Sin fondos, la cuota sigue vencida; a los 14 días se registra un impago con recargo único de $100 y pérdida de reputación. Amortizar antes condona el interés que aún no ha vencido. No se permite acumular varios préstamos activos.
- **Contratos de pilotos:** además de sueldo, prima y plazo, negocia puesto principal/reserva, prima por victoria, meses de rescisión, promesa de participación y opción de renovación. Las primas se cobran de verdad. Incumplir una promesa deja memoria, resta moral y afecta ligeramente al ritmo de las próximas carreras. La renovación se abre en los últimos 60 días, conserva lo devengado y amplía el vencimiento; la opción pactada permite un +3 % una vez, frente al +8 % ordinario.
- **Rivales:** compiten por las mismas marcas y fondos, adaptan la alineación a los acuerdos cuando tienen los activos disponibles y pueden usar crédito limitado para un desfase de caja. Las decisiones y noticias abren la entidad real. El archivo permite consultar también sus contratos.

Es el primer catálogo comercial: cuatro patrocinadores y un programa ficticio de fabricante, sin afiliación con marcas reales. En cada temporada se abren nuevas convocatorias con el presupuesto restante; recargar o renovar no restablece sus saldos. La ampliación de personal, fabricantes/programas adicionales y negociación narrativa continuará en las etapas previstas. La etapa de carreras prevista aquí se incorpora en la 0.5.

## Rediseño de la 0.3.1

Toda la presentación cambia: menú, creación de compañía, sede, garaje, pilotos, finanzas, calendario, mercado, compañías, noticias, archivo y taller. La navegación muestra nombres y grupos; la sede destaca la próxima decisión y los pasos para llegar a la parrilla. La interfaz se adapta a escritorio y móvil con textos legibles y controles de guardado accesibles.

El taller separa **Diagnóstico / Instaladas / Almacén / Catálogo**, con búsqueda y filtros por compatibilidad y sistema. Cada compra continúa hacia el almacén para programar el montaje.

La carrera ocupa el centro de la pantalla. La pista conserva su longitud en metros, tiene 12,4 m de ancho y los coches miden unos 4,3 × 1,8 m. El entorno incorpora asfalto, escapatorias, pianos, barreras, señalización de frenada, gradas y paddock. Las carrocerías, cristales, ruedas, luces de freno y daños se dibujan con más detalle.

- **TV** sigue batallas e incidentes; **seguimiento** permite elegir cualquier piloto en el cronometraje; **circuito** ofrece la vista completa. Hay zoom y un minimapa.
- Los pilotos buscan espacio, aprovechan rebufo y disputan adelantamientos según sus atributos. Control, regularidad, disciplina, neumáticos y órdenes influyen en las pérdidas de control. No hay accidentes obligatorios por tiempo.
- Los coches tienen volumen: un roce o choque los separa, reduce velocidad y causa daños según el impacto. Un trompo ocupa más ancho; un retirado se aparta gradualmente y puede obstaculizar mientras sigue en pista. Las amarillas reducen el ritmo cerca del peligro. Los daños se conservan en el taller y el resumen final muestra hechos de la carrera.
- **Activar sonido** habilita un motor sintetizado, neumáticos e impactos; está apagado inicialmente y se silencia al pausar. Funciona localmente, sin descargas de audio.

Es una simulación 2D simplificada de carreras secas. Boxes operativos, clima, repeticiones y compuestos de competición se incorporan en la 0.5. Esta actualización de presentación y tráfico se entrega antes de continuar con las negociaciones y patrocinios de la 0.4.

## Novedades de la 0.2

- **Compañías del paddock**, accesible desde la sede: consulta propietarios ficticios, personalidad, objetivo, caja, flotas, plantillas, movimientos y motivos de las últimas decisiones.
- **Mercado Club**, accesible desde el garaje o el paddock: seis unidades usadas iniciales y anuncios de las compañías. El stock es finito y se comparte con los rivales. Comprar retira el anuncio y transfiere la misma unidad con su ID e historial. Los pagos se abonan al vendedor; Club Usados conserva su saldo por separado.
- Selección entre los coches de tu garaje y publicación/retirada de anuncios, entre el 50 % y el 150 % de su valoración. Un anuncio ocupa su plaza hasta venderse. Las unidades anunciadas no se inscriben ni revisan. Es posible vender el último coche y recuperarse comprando otro: la sede continúa navegable.
- **Traspasos de pilotos**: las compañías pueden negociar sus reservas o buscar liquidez. Se compensan al vendedor, liquidan la nómina pendiente y conservan historial y puntos del piloto. El jugador puede negociar los pilotos disponibles desde su sala o expediente rival. La contratación libre de la 0.1 conserva sus contraofertas.
- Los rivales pueden presentar **ofertas por tus pilotos**. Aparecen en la sala y en el periódico, caducan a los siete días y requieren tu aceptación. El precio ofrecido se respeta al aceptar; las condiciones se revalidan si cambian los fondos o la disponibilidad. Los pilotos inscritos no se traspasan; ahora puedes retirar una inscripción sin reembolso.
- La IA preserva una reserva según personalidad, selecciona una acción por utilidad y registra su motivo. No conoce el potencial oculto. Los nuevos fichajes permanecen fuera del circuito automático de traspasos durante 60 días para evitar rotaciones diarias. El jugador mantiene la decisión sobre sus propios pilotos.
- Las compañías hacen encargos con el mismo plazo, coste de oportunidad y límites del jugador. Si quiebran, liberan sus pilotos y anuncian sus coches en liquidación; no vuelven a las carreras aunque después reciban ingresos por una venta.
- Las noticias comerciales abren el coche o piloto real y su propietario actual. Las operaciones empresariales y su historial persisten al guardar.

Este es el mercado **básico compartido de la 0.2**, no el mercado completo de la 0.7: siguen pendientes subastas, importaciones, fabricantes y negociación de precios. El catálogo inicial de piezas se incorpora en la 0.3; empleados, patrocinadores y relaciones avanzadas siguen su plan incremental.

## Novedades de la 0.3

Abre **Garaje → Taller de modificaciones**. Mantiene la única sede y una sola bahía. Hay un catálogo inicial de **14 mejoras y 56 unidades físicas** compartidas con los rivales: admisión, escape, ECU por modelo, radiador, embrague, compresor E36, diferencial, suspensión, frenos, neumáticos de calle, aerodinámica y aligerado.

1. Selecciona un vehículo. El diagnóstico muestra **motor, transmisión, frenos, suspensión, neumáticos, refrigeración y carrocería**, con desgaste independiente.
2. Abre la ficha de una pieza para comparar prestaciones actuales y proyectadas, requisitos, compatibilidad, precio, mano de obra y plazo. La compra mueve una unidad identificada del proveedor al almacén; no la instala automáticamente.
3. Programa el montaje desde el inventario. La pieza se reserva y el coche queda fuera de servicio. Los atributos cambian al terminar el trabajo, entre uno y cuatro días después. Los encargos, revisiones, montajes y desmontajes comparten el taller.
4. Una sustitución devuelve la mejora anterior al almacén con su desgaste. Desmontar cuesta el 60 % de la mano de obra y un día; reserva espacio para el repuesto recuperado. No se crean piezas al volver al equipo original.
5. Revisa la configuración antes de inscribirte: el montaje comprueba modelo, requisitos y potencia máxima de **210 CV** de la Copa. Un compresor E36 exige radiador y embrague reforzados. No puedes retirar una pieza que otra modificación necesita, ni modificar un coche inscrito o anunciado.
6. Compite y consulta desgaste y temperatura. Los frenos modifican la deceleración; suspensión, neumáticos y aerodinámica cambian las curvas; masa, potencia y embrague afectan la aceleración. Más potencia genera calor y desgaste; el radiador ayuda a disiparlo. El paquete aerodinámico sacrifica velocidad punta y el neumático deportivo se consume antes.
7. Repara solo el sistema base dañado, o usa la revisión completa anterior. Las revisiones no rejuvenecen las piezas de mejora: puedes reemplazarlas, desmontarlas o vender los repuestos libres al proveedor, según su liquidez. El servicio de neumáticos restaura el conjunto instalado: $160 si es estándar, o el precio de su compuesto ($290/$330). Conserva el ID del conjunto, no genera un repuesto para vender.

El almacén inicial admite ocho repuestos, incluidas reservas. Las mejoras instaladas pertenecen al coche y se transfieren junto con él al venderlo; los repuestos almacenados se quedan con su compañía. Los neumáticos originales también conservan su desgaste cuando quedan apartados por un compuesto de mejora: desmontar no entrega gomas nuevas gratis.

Los rivales compran e instalan las mismas unidades, respetan plazos y presupuestos, reparan componentes críticos y usan la configuración resultante en sus carreras. El catálogo, capacidades, condiciones, trabajos y reservas se guardan íntegramente. Es una primera versión funcional del taller: geometrías detalladas, relaciones de cambio, catálogo ampliado y personal especializado seguirán incorporándose en las siguientes etapas. El kit E36 y los efectos técnicos son parámetros ficticios de juego, no instrucciones de modificación de un coche real.

## Guardados

Se usa `localStorage`: el volumen actual no requiere IndexedDB. El historial de noticias tiene 200 entradas; cada compañía conserva 600 movimientos recientes, además de acumulados; cada coche conserva 30 hechos. Las temporadas anteriores conservan resúmenes, no pasos de física. El checksum detecta corrupción accidental, no es una firma criptográfica ni un sistema antitrampas.

El navegador guarda por origen y perfil. Si bloquea el almacenamiento o se alcanza su cuota, se informa del fallo; exporta JSON. Borrar los datos del navegador elimina también las partidas y sus copias. No hay almacenamiento en servidor. El esquema actual es la versión 3, con un bloque comercial y un bloque de suministros de carrera, ambos de versión 1. Las partidas anteriores reciben esos bloques una sola vez sin modificar entidades, RNG ni la carrera en curso. Los guardados de las versiones 0.1 y 0.2 (esquemas 1 y 2) se validan y migran sin cambiar sus coches, saldos, contratos ni resultados. Se añaden los sistemas base según el estado anterior y el catálogo de repuestos una única vez. Si hay una carrera antigua en curso, termina con su modelo anterior para conservar el resultado exacto; las siguientes usan el desgaste por componentes y el nuevo tráfico. También se verifica una carrera de la 0.3: conserva exactamente el resultado anterior y las nuevas dinámicas se aplican a la siguiente salida. Una fixture auténtica de la 0.4 comprueba además la carrera completa, la economía, los contratos y las entidades exactas; una carrera en curso anterior termina con su propio modelo y la siguiente incorpora las novedades de la 0.5. Los trabajos antiguos conservan su plazo y no vuelven a cobrarse. Se mantienen las claves de las cinco ranuras. Las versiones desconocidas se rechazan sin modificar el guardado.

## Verificar

```sh
npm test
```

Pruebas del motor con el runner incluido en Node: negociación, duplicados, capacidad, vencimientos, gastos y nóminas, revisiones, neumáticos, bloqueo de fechas, órdenes, determinismo a diferentes velocidades, reanudación en carrera, temporada completa, contabilidad rival, noticias, corrupción/recuperación y bancarrota. Las nuevas pruebas del taller comprueban montaje con plazo, compatibilidad/requisitos, inventario, recuperación, reparación focal, refrigeración y rendimiento real en pista.

Comprobación opcional de navegador con Playwright disponible y el servidor iniciado:

```sh
npm run test:browser
```

`CHROMIUM_PATH` permite seleccionar el ejecutable y `GAME_URL` el servidor. Estos recorridos necesitan el paquete de pruebas `playwright`; el juego y `npm test` no lo necesitan. El entorno de desarrollo ya lo proporciona. Capturas y una partida exportada se escriben en `test-results/` (ignorado por Git). El recorrido usa la UI para fundar, dibujar, negociar, inscribirse, dar órdenes y recargar; completa las seis rondas con la API del mismo motor para evitar esperar todas las vueltas en tiempo real. Además comprueba exportación/importación y siete pantallas a 1440, 1024 y 390 px. `tests/browser-business.cjs` añade mercado, traspasos con consentimiento, expediente de activos, garaje vacío y migración real de una partida 0.1, con nueve pantallas a esos tres tamaños. `tests/browser-workshop.cjs` verifica el recorrido real de compra/montaje, guardar un trabajo pendiente, completar el plazo, desmontar, correr con modificaciones, reparar un componente, vender repuestos e importar una carrera 0.2; comprueba diez pantallas a los tres tamaños. `tests/browser-presentation.cjs` comprueba navegación con etiquetas, búsqueda/compatibilidad, cámaras, selección de piloto, zoom, escala de los seis circuitos, audio y pausa, controles móviles y ausencia de cambios en el RNG al dibujar. `tests/browser-contracts.cjs` recorre negociación, fabricante con piloto impuesto, promoción, marca, crédito, cuotas, incumplimiento durante una temporada real, noticia/entidad, renovación, importación 0.3.1 y doce vistas comerciales en los tres tamaños. `tests/browser-race-weekend.cjs` verifica inscripción con juego/coste, servicio físico y guardado en boxes, clima, repetición sin mutación, grabación final persistente, almacén y seis vistas de carrera/repetición a los tres tamaños, además de importar una carrera 0.4. La apertura `file://` se marca como omitida si la política del navegador la bloquea.

Consulta [la arquitectura](docs/ARQUITECTURA.md), [el plan por versiones](docs/ROADMAP.md) y [la especificación original](docs/ESPECIFICACION.md).
