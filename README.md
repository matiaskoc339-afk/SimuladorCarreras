# Racing Company Simulator · 0.13.1

Una temporada jugable de gestión automovilística con compañías rivales que administran sus recursos. HTML, CSS y JavaScript sin dependencias de ejecución, recursos remotos, cuentas ni conexión permanente. No conduces el coche: diriges la empresa y das órdenes a tu piloto.

## Iniciar

Desde este directorio, con Node.js 18 o superior:

```sh
npm start
```

El servidor usa el puerto **4173** (configurable con `PORT`). No hace falta ejecutar `npm install`. También puedes servir la carpeta con `python3 -m http.server 4173`.

Los scripts clásicos y recursos relativos permiten abrir `index.html` directamente en navegadores que admitan archivos locales y almacenamiento local. La política de Chromium del entorno de desarrollo bloquea `file://`, por lo que allí se ha validado el servidor HTTP. Usa siempre el mismo origen para conservar tus ranuras; exporta/importa para trasladarlas entre orígenes o equipos.

## Novedades de la 0.13.1 · puntos de cada liga y licencia

La sede, Competición, los resultados y el archivo de pilotos muestran puntos **separados para Callejera, Regional Profesional y Nacional**. La licencia exige **24 puntos callejeros acumulados y 900 US$** y es obligatoria en las dos copas profesionales. Cada final utiliza únicamente los clasificatorios de su propia liga. La licencia y las trayectorias se conservan al cambiar de temporada; los marcadores anuales se reinician.

[Reglas y compatibilidad](docs/LIGAS_Y_LICENCIA_0_13_1.md).

## Novedades de la 0.13.0 · un equipo y unas carreras más vivos

- **Ingresos de apoyo en Finanzas**: tres tipos de encargos semanales, pago tras varios días y límite de uno cada siete días. Algunos ocupan una bahía o un ingeniero; no dan puntos ni prestigio.
- **Muro integrado con la retransmisión**: cinco planes, respuesta del piloto, plan aplicado, estratega y boxes juntos. La radio tarda unos segundos y puede confirmar, no entender o explicar por qué aplaza una orden.
- **Control decisivo en curvas**: un novato necesita levantar más; uno hábil conserva mejor el impulso dentro de los límites del coche. La IA alterna intenciones, puede dudar o enlazar una buena salida y prepara mejor los coches para sus copas.
- **Formación un 45 % más eficaz** sin eliminar costes, días, riesgo ni potencial. El campus estima la mejora antes de reservar. Los CV explican los doce atributos y permiten consultar ayuda junto a sus estadísticas.

[Reglas, compatibilidad y validación](docs/EQUIPO_Y_MURO_0_13.md).

## Novedades de la 0.12.1 · avisos que explican cómo continuar

- Los rechazos permanecen visibles hasta cerrarlos y explican costes, saldo y diferencia, fechas de disponibilidad, requisitos y siguientes pasos. Las acciones bloqueadas de contratación, negociación e inscripción muestran su motivo junto al control.
- El campus mantiene visibles a pilotos lesionados y especialistas ocupados, enumera lo que impide reservar y enlaza a contratos, descansos, salud y taller. Distingue programas completados e interrumpidos y compara días previstos con días realizados.
- Corregida una integración térmica que aplicaba minutos de entrenamiento como un solo instante y provocaba averías falsas al tercer día. Se conserva el desgaste real y una lesión, avería o impago puede interrumpir el programa con un informe parcial claro.

[Detalles y compatibilidad](docs/AVISOS_ENTRENAMIENTO_0_12_1.md).

## Novedades de la 0.12.0 · el mundo cambia cada temporada

- **36 pistas nuevas: 68 trazados modernos en 13 países**, con sedes en Perú, Argentina, Brasil, México, Japón, Estados Unidos, Australia y Europa. Urbanos y circuitos profesionales de cuatro dificultades, con geometrías y entornos distintos.
- **Veinte sedes diferentes cada año**, incluidas las finales, sin repetir las del año anterior. La rotación respeta cada copa y permite conocer todo el atlas en cuatro temporadas.
- **Atlas organizado por países**, con filtros por copa, dificultad, temporada actual, novedades y búsqueda. Los planos incluyen salida y ramal de boxes; el calendario y la carrera muestran país y ciudad.
- **Tu temporada actual se conserva**. Al abrir el siguiente año se activa el calendario renovado sin perder inscripciones, resultados, archivo ni trofeos.

[Países, pistas, rotación y compatibilidad](docs/CIRCUITOS_MUNDO_0_12.md).

## Novedades de la 0.11.0 · catálogo vivo y grandes copas

- **64 referencias nuevas cada siete días**, cuatro por cada alojamiento, con fabricantes, estadísticas y contrapartidas diferentes. Se reponen los 29 recambios básicos y se conservan tus compras y montajes.
- **12 familias de carrocería**: Touring, Wide y Silueta para ligereza, refrigeración, resistencia, velocidad o apoyo; acabados visibles de lado, por arriba y en carrera.
- **Autos nuevos separados de los usados**: doce deportivos actuales de 2026, 170–320 CV, 0 km y estado completo, desde **28 000 US$**. Sus prestaciones, precio y depreciación se conectan con el mercado y el taller. El mundo suma 88 modelos, incluidos los doce exclusivos de subasta.
- **CV renovados semanalmente**: doce candidatos distintos, más los descubrimientos del ojeador disponible. Nivel empresarial y prestigio atraen mejores pilotos; sueldos, requisitos, precisión del informe y opciones modestas se mantienen.
- **Vitrina de trofeos**: oro, plata y bronce por el podio de las grandes finales regional y nacional. Cada trofeo conserva temporada, piloto y circuito, concede reputación una sola vez y permanece entre temporadas. Una carrera normal no entrega una copa.

Abre Taller, Mercado, Pilotos o Vitrina en una empresa con taller visual para activarlo sin reiniciar, fuera de carrera/subasta. El tutorial también explica estas mecánicas. [Reglas, renovación, requisitos y compatibilidad](docs/SUMINISTRO_PALMARES_0_11.md).

## Novedades de la 0.10.1 · guía para empezar

La primera compañía de un jugador nuevo abre un **tutorial de once pasos breves**: dinero/calendario, pilotos, coche/taller, especialistas, formación/investigación, ligas, carrera/boxes, instalaciones/automatización, mercado/subastas, contratos/rivales y guardado/historia. Señala las pantallas reales, tiene detalle opcional e índice de temas y permite volver atrás u omitirlo.

La visita no contrata, compra ni avanza días. Recuerda el progreso al recargar y deja de aparecer automáticamente al terminar u omitirla, incluso al crear otra compañía. Las partidas existentes continúan sin interrupciones. Puedes consultar la guía desde **Partidas y opciones → Cómo jugar**. [Funcionamiento y validación](docs/TUTORIAL_0_10_1.md).

## Novedades de la 0.10.0 · casa de subastas

- **Ver subastas / Subastar mis objetos**: sala con presentador, paletas, ofertas y cuenta atrás de diez segundos que reinicia cada puja. Puedes observar, aceptar el importe anunciado o retirarte. Las ofertas son vinculantes y se liquidan una sola vez al adjudicar.
- **40 familias exclusivas y 12 plataformas de colección** adicionales a los 64 modelos anteriores: piezas de autor, carrocerías de archivo, modelos modernos y clásicos y coches preparados. Ediciones individuales con fabricante, estado, parámetros y certificado propios; ocho lotes rotan cada siete días.
- **Postores con caja e intereses propios**, incluidos rivales reales. Buscan margen, restauran o coleccionan; pueden retirarse, pujar tarde y pagar más que la estimación. Sus compras transfieren dinero y propiedad reales.
- **Vende tus piezas o coches**: fija la salida, observa la disputa y recibe el **80 % neto**. Sin comisión si no se vende. Se bloquean los objetos consignados y se conservan piezas, kilometraje y desgaste.
- **Puja guardable**: el reloj y los participantes continúan al cargar; la empresa espera durante la sala. Las compras van al almacén o garaje y siguen conectadas con el taller y las carreras.

Abre **Subastas** en tu empresa 0.9 sin reiniciar. El comienzo conserva **4200 US$** y los exclusivos de la casa tienen salidas desde **6500 US$** en piezas y **50 000 US$** en coches. [Uso, reglas, variedad y contabilidad](docs/SUBASTAS_0_10.md).

## Novedades de la 0.9.0 · taller visual

- **Modifica sobre el coche**: vista lateral/superior con transición, ampliación, vista técnica y zonas seleccionables. El dibujo conserva las proporciones del modelo y refleja su preparación.
- **Compara antes de montar**: vista previa del aspecto, estadísticas actuales y nuevas, diferencias favorables y desfavorables, requisitos y presupuesto con entrega. Puedes pulsar o arrastrar una pieza a su zona.
- **29 referencias y 16 alojamientos**: carrocerías Touring/ensanchada/competición, motores por etapas, refuerzos de chasis, llantas, frenos grandes y refrigeración. La preparación exige combinaciones compatibles y también se ve en carrera; las carrocerías anchas cambian el ancho físico.
- **Unidades reales**: catálogo, almacén, montaje/desmontaje pagado por días, devolución de piezas sustituidas con su desgaste y mantenimiento profesional conservado. El coche cambia al entregar el trabajo.

Abre **Taller** en tu empresa 0.8 para usarlo sin reiniciar la partida. Los trabajos y entrenamientos pendientes se conservan. [Uso, costes, compatibilidad y límites](docs/TALLER_VISUAL_0_9.md).

## Novedades de la 0.8.0 · investigación y campus

- **Investigadores contratables**, con niveles, sueldos diarios altos, estrés, descansos y relaciones laborales existentes. Su contrato abre **Investigación**: un árbol de nueve mejoras permanentes en recuperación, aprendizaje y operación técnica. Mejor nivel rebaja un poco materiales y días; los nodos finales siguen siendo caros y largos. La cotización separa materiales y nómina.
- **Entrenamiento por programas de varios días**: reserva piloto, entrenador y coche, consulta plazo/riesgos/coste y sigue gestionando la empresa. Una combinación menos preparada necesita más días. La vista del piloto sigue animada; solo avanzar jornadas concede progreso y desgaste. Al terminar o interrumpir aparece un informe de mejoras, aprendizaje, pérdidas de habilidad si las hubo, fatiga, estrés e incidentes.
- **32 pistas y 64 modelos**. Más curvas técnicas y trazados abiertos, cuatro dificultades y sedes exclusivas de calle, regional y nacional. El calendario de veinte pruebas rota entre temporadas. El atlas filtra por dificultad y categoría; las nuevas carrocerías también se ven en carrera.

Para actualizar una empresa 0.7, abre Investigación y activa la nueva gestión cuando no haya carrera/práctica anterior en marcha. Conservas el calendario y el patrimonio; la rotación nueva se aplicará en la siguiente temporada. Una partida nueva incorpora todo desde el comienzo. [Reglas, costes y límites](docs/INVESTIGACION_CAMPUS_0_8.md).

## Novedades de la 0.7.0 · del asfalto a los circuitos

- **16 trazados originales**, seis urbanos y diez profesionales, inspirados en el carácter de circuitos reales. Puerto, calles estrechas, avenidas nocturnas, costa, desierto, estadio y bosque. Todos aparecen en el calendario de 20 pruebas.
- **40 modelos** disponibles en el mercado: siluetas, proporciones métricas, habitáculos, faros, techos y detalles distintos. Se usan en garaje, mercado y retransmisión; las doce familias de piezas conservan sus ilustraciones específicas.
- **Liga Callejera, Copa Regional Profesional y Copa Nacional**, con puntos separados, clasificación para sus finales y requisitos de acceso progresivos. Tasas ordinarias: $220, $2.100 y $7.200; las finales cuestan más. No hay prima automática por completar el calendario.
- **Piezas activas durante la carrera:** potencia, masa, tracción, frenada, temperatura, refrigeración, apoyo aerodinámico y desgaste se conectan con las unidades compradas e instaladas. El daño y la pérdida de estado reducen su eficacia.
- **Boxes simultáneos**, con carril de paso y puesto propio por equipo; el servicio de un rival no bloquea el trabajo de los demás. Velocidad y errores del personal siguen influyendo, con minijuego manual cuando corresponde.
- **IA revisada:** anticipación de curvas, elección y compromiso de un lado al adelantar, lectura del tráfico, ahorro de gomas y paradas según combustible, desgaste y coste temporal. Los contactos evitables se sancionan en pruebas profesionales; en la calle se admiten, con muros próximos y daños que debes pagar.

El inicio conserva $4.200, pilotos de valoración 10–25 y sueldos diarios. Para conseguir la licencia profesional necesitas **24 puntos callejeros acumulados y $900**; después se comprueba coche y piloto. La nacional exige también 12 puntos regionales acumulados. Cada final requiere sus propios puntos de la temporada. El desgaste continuo de gomas se reduce al 45 % del coeficiente 0.6.4: marca, compuesto, ritmo y errores siguen cambiando su duración.

Las partidas antiguas conservan el calendario y las reglas con que se guardaron. Una empresa 0.6.4 puede activar las nuevas ligas desde Competiciones al completar su temporada; también puedes empezar una partida nueva. Consulta [reglas, pruebas y límites de esta versión](docs/COMPETICIONES_0_7.md).

## Novedades de la 0.6.4 · dificultad, variedad y conducción

Las **partidas nuevas** comienzan con **$4.200**, un utilitario entre cinco modelos y doce candidatos locales de valoración **10–25**. Pilotos y especialistas cobran **cada día**; habilidad, experiencia, nivel y motivación determinan su referencia salarial. Los perfiles de calidad alta exigen mayor nivel empresarial. La firma muestra pago inicial, coste por día/30 días y autonomía estimada, y conserva todas las cláusulas. Los contratos de 1/3 meses permiten empezar con compromisos más cortos.

Hay **24 modelos**, siete tipos de carrocería, proporciones y acabados propios, e ilustraciones específicas para las doce familias de piezas. Los pilotos combinan nombres, nacionalidades, edad, experiencia, dieciséis temperamentos y retratos procedurales; sus identidades se conservan en contratos, traspasos y guardados. Los nuevos candidatos y el ojeo mejoran con el desarrollo de la empresa.

Las carreras nuevas incorporan trazada de entrada/ápice/salida, frenada anticipada, decisiones de adelantamiento y defensa, reacción según atención/experiencia y fatiga según resistencia. Los errores pueden ser correcciones, derrapes o trompos; no se impone un accidente por carrera. Las gomas se degradan mucho más y hay **17 opciones**: calle, cuatro compuestos y doce variantes de Fortis Endurance, Vértice Racing y Nómada Sport. Agarre, duración, clima y precio obligan a elegir. La inscripción estima vueltas de uso y el muro muestra intención, fatiga y desgaste. Tribunas y edificios se colocan fuera del recorrido y del carril de boxes.

Los cambios visuales se aplican también a partidas anteriores. **Los contratos y carreras de guardados antiguos conservan sus reglas** para no cambiar obligaciones ni resultados a mitad. Para jugar con todo el equilibrio nuevo, empieza otra carrera empresarial. Consulta [las reglas y límites del equilibrio](docs/EQUILIBRIO_0_6_4.md).

## Tu primera temporada

1. Funda una compañía y dibuja su logotipo. Hay pincel, borrador, colores, grosor, deshacer/rehacer, transparencia, vista previa y exportación PNG.
2. Abre **Pilotos** desde la navegación o desde su edificio en la sede. Estudia los currículums y negocia salario, duración y prima. Las ofertas insuficientes reciben una contraoferta; insistir puede pausar la negociación.
3. Selecciona **Garaje** para consultar tu utilitario usado, su estado y su historial. Las reparaciones cuestan dinero y duran inicialmente dos días; equipamiento y personal pueden reducir el plazo. El diagnóstico profesional se solicita aparte y requiere un mecánico. El precio de renovar los neumáticos de calle depende del coche y del apoyo disponible. Desde allí puedes abrir el taller de modificaciones.
4. En **Competiciones**, inscribe a tu piloto y coche. Empieza en la Liga Callejera: tasas desde $220 y gomas aparte. La inscripción abre 14 días antes de cada prueba. Consulta los requisitos de las copas profesionales y sus finales antes de comprometer presupuesto.
5. Avanza día a día o hasta la próxima prueba. Cada día se procesan las mismas obligaciones. El calendario se detiene en las carreras: solo una renuncia confirmada permite no participar.
6. Sigue la carrera en una retransmisión 2D con cronometraje, radio y telemetría. Usa **Atacar / Equilibrado / Conservar**, selecciona un piloto en la clasificación para seguirlo, cambia entre TV / seguimiento / circuito, ajusta el zoom y la velocidad ×1 / ×2 / ×4, o pausa con el botón o la barra espaciadora. Los resultados no están predeterminados.
7. Gestiona las 20 pruebas de las tres ligas: participa o renuncia a cada fecha. Premios, puntos, kilometraje, fatiga, desgaste y reputación se registran al finalizar. Cada final tiene acceso por puntos; el año termina archivando las competiciones.
8. Puedes abrir la siguiente temporada. Se conserva el mundo y se contabiliza el descanso hasta el siguiente 5 de enero. Revisa los contratos que vencen.

**Finanzas** contiene el libro de movimientos, previsión mensual, edición de identidad y encargos de taller. Cada encargo produce $420 netos en partidas nuevas ($360 en las anteriores) en un plazo inicial de tres días, con un máximo de uno cada siete días. Comparte las bahías y profesionales disponibles con las revisiones.

## Alcance entregado

- Menú, creación de compañía, identidad y sede 2D interactiva.
- Calendario desde enero de 2026 y temporadas sucesivas.
- Salarios pagados cada día en partidas nuevas (los contratos antiguos mantienen devengo diario y liquidación el día 1); primas, alquiler, gastos logísticos, servicios, reparaciones, premios y descubierto con 14 días de recuperación. La bancarrota termina la partida.
- Un coche inicial, siete compañías rivales y siete equipos callejeros independientes, con recursos finitos, flotas y plantillas persistentes. La IA de la 0.2 evalúa compras/ventas, fichajes/traspasos, revisiones, neumáticos, formación, encargos y reducción de gastos según personalidad, necesidad y reserva salarial.
- Pilotos con 12 atributos, rasgos, potencial oculto, contratos, descanso, formación básica y experiencia de carreras.
- Tres ligas con veinte pruebas, dieciséis trazados, requisitos técnicos y económicos, clasificación propia y finales. Los seis circuitos de Copa Club se conservan para partidas antiguas.
- Simulación visual de paso fijo: aceleración según potencia/peso, frenada anticipada, habilidades, rebufo, búsqueda de huecos para adelantar, defensa, ritmo y desgaste. Los contactos dañan sistemas reales; los derrapes y trompos dependen del piloto y del agarre. Los accidentes pueden causar abandono y amarillas locales. Tres cámaras, minimapa y zoom.
- Periódico de hechos reales del estado de juego, con enlaces a sus entidades y un archivo limitado.
- Cinco partidas, guardado automático/manual, exportación/importación JSON, validación de formato/versión/entidades, checksum y copia anterior por ranura. Una carrera en curso se guarda con sus participantes y RNG, sin pagar recompensas de nuevo al cargar.

Los nombres de coches son referencias descriptivas. Todas las ilustraciones, circuitos, retratos e identidades son dibujos originales generados localmente con SVG/Canvas. Las cifras son **parámetros de juego**, no datos certificados de fabricantes. Los circuitos son ficticios. No se usan logotipos oficiales.

## Novedades de la 0.6.3 · gerencia, políticas y salud

Abre **Operaciones y salud**. Sus tres secciones son **Delegación**, **Actividad y gastos** y **Salud de pilotos**. Se incorporan cinco gerentes y cinco médicos al mercado laboral: **35 candidatos iniciales y siete especialidades**. Ambos roles usan contratos, niveles 1–10, estrés, descanso, salarios, aumentos y ofertas rivales existentes. Continúan contando para las plazas reales de la oficina.

**Gerencia:** contrata un gerente y guarda las políticas que quieras activar. Puede ejecutar mantenimiento por componentes/neumáticos, comprar repuestos autorizados, montar inventario compatible, formar a pilotos con entrenador, encargar ojeo y aceptar encargos del taller. Su nivel, habilidad, estrés y motivación limitan las tareas que puede supervisar cada jornada. La formación delegada no inicia prácticas en pista ni firma contratos de pilotos.

Configura un tope **mensual total**, otro **diario**, límites por área, prioridades y una **reserva de caja más meses de previsión**. Mantenimiento tiene un coste máximo por intervención; compras/montajes, una lista explícita de referencias y límites de calidad/precio/mano de obra. Todas las condiciones se comprueban antes de pagar. Las órdenes usan los mismos saldos, existencias, piezas, bahías, especialistas y plazos que las acciones manuales. No se retiran inscripciones ni se inicia un trabajo que invada la jornada previa a carrera.

El gerente evalúa una vez al día, al avanzar o al pulsar **Evaluar hoy**. El registro muestra qué hizo, cuánto costó y qué quedó bloqueado por presupuesto, reserva, calendario, ocupación o ausencia de personal. Cambiar políticas o recargar conserva los importes gastados. Pausar detiene nuevas órdenes y formación delegada; los trabajos ya contratados siguen su plazo. Una orden manual de entrenamiento/descanso retira al piloto del programa delegado. Los sueldos, tratamientos, operación ordinaria y decisiones manuales siguen en Finanzas y quedan fuera de este presupuesto de órdenes automáticas.

**Médico deportivo:** selecciona un piloto lesionado y consulta precio, probabilidad y reducción máxima antes de confirmar. El tratamiento cuesta **$120 y dos jornadas**, requiere al menos cuatro días de recuperación pendientes y contratos que cubran el curso. Nivel/habilidad/estrés cambian el acierto y el ahorro posible de **1–4 días**, limitado también por la lesión. El médico queda ocupado. Si falla, se conserva la fecha anterior; si acierta, el piloto mantiene el descanso restante. Solo un tratamiento por episodio; no cura instantáneamente ni revierte una retirada definitiva. Guardar mantiene el mismo resultado sorteado.

La delegación empieza **desactivada**, también al importar una partida. Las fixtures auténticas de la 0.6.2 conservan exactamente carreras en boxes manuales y entrenamientos en marcha. Las otras profesiones, la academia física, I+D, mercado avanzado, libreas y evolución generacional siguen pendientes en el [análisis actualizado](docs/ANALISIS_MECANICAS.md).

## Base de la 0.6.2 · niveles, boxes y entrenamiento

Las cinco especialidades tienen **nivel 1–10**, experiencia por tareas, estrés y descansos remunerados de 1, 3 o 7 días. El nivel eleva sus expectativas salariales y su eficacia; el estrés las reduce. Pueden solicitar aumentos, recibir ofertas de la competencia y marcharse por mejores condiciones. **Personal** muestra las peticiones y permite negociar o igualar una oferta rival. Las transferencias liquidan sueldos, pagan compensación y conservan a la misma persona con su historial.

- **Revisión profesional:** desde Garaje o Taller, con mecánico disponible obligatorio. Un ingeniero mejora el diagnóstico y el ajuste. Consulta precio y acierto estimado **0–100 %** antes de pedirlo. El informe estima siete componentes; puedes aplicar un ajuste temporal de manejo. Una recomendación errónea puede empeorar el agarre. La reparación pagada que ya existía sigue siendo un servicio separado.
- **Boxes manuales:** si sales sin mecánico o este falla, aparece una alerta. Levanta el coche, afloja cuatro tuercas por rueda, retira, coloca y aprieta las cuatro ruedas, baja y comprueba. **Los rivales siguen corriendo**. El orden, los errores y tu velocidad importan. Con mecánico, el acierto y la rapidez dependen del nivel, estrés y velocidad individual, con apoyo del ingeniero. Las sanciones se cumplen completas.
- **Entrenamiento en pista:** abre la nueva sección, selecciona piloto, entrenador y coche, vueltas, intensidad y atributo objetivo. Antes de confirmar se muestran estrés, fatiga y riesgos. Simula vueltas en vivo, con pausa y velocidades ×1/×10/×20, desgaste y mejora real. Cuesta $80 y una jornada, con sus gastos diarios ordinarios. Puedes interrumpirlo conservando lo ejecutado. Sobreentrenar aumenta las lesiones y el riesgo excepcional de un accidente que termine la carrera deportiva. Un entrenador mejor y descansado reduce riesgos y acelera el progreso.
- **Ojeador:** entrega periódicamente CV de pilotos nuevos que entran al mercado real, con calidad, frecuencia y posibilidad de sorpresa ligadas al nivel. Añade datos e intervalos de potencial con **porcentaje de acierto**, también en los informes por encargo. Desde nivel 4 ofrece información adicional. Los nuevos CV muestran atributos básicos y el informe disponible; contratar permite consultar la ficha completa. Un 80 % significa mayor fiabilidad, con posibilidad de error. Los candidatos descubiertos no contratados dejan de estar disponibles tras 90 días.
- **Estratega:** automatiza ritmo, ataque, defensa y boxes según combustible, desgaste, clima y tráfico; reduce estrés y puede equivocarse. Puedes darle órdenes con prioridad temporal o tomar todo el control manual.

Se conservan guardados durante entrenamiento o cambio manual. Las carreras que ya estaban en marcha en versiones anteriores mantienen su comportamiento; las nuevas usan estas reglas. El [detalle de requisitos y decisiones](docs/REGLAS_ESPECIALISTAS.md) conserva la solicitud del usuario. El balance de largo plazo sigue pendiente.

## Base de personal especializado de la 0.6.1

Abre **Personal** desde la navegación o desde la oficina de la sede. La 0.6.1 introdujo **25 profesionales iniciales**, con identidad, edad, experiencia, habilidad, aprendizaje, personalidad, motivación y lealtad. El mercado es compartido: un rival puede contratar al candidato que estabas estudiando. Cada sesenta días se incorpora una candidatura por especialidad solo si quedan menos de dos disponibles. Cargar la partida no repone candidatos.

La oficina inicial admite **dos empleados**, independientemente de las plazas de pilotos. Cada ampliación añade dos plazas. Puedes contratar un responsable de cada una de las cinco especialidades originales:

- **Mecánico:** apoya una reparación o encargo; con rendimiento efectivo de al menos 40 reduce una jornada, respetando el mínimo de un día. Solo puede apoyar un trabajo simultáneo. Si está libre al salir a carrera, contribuye al servicio de boxes.
- **Ingeniero de motores:** apoya instalaciones/desmontajes bajo las mismas reglas de disponibilidad y plazo. En carrera, su preparación reduce el objetivo térmico y el desgaste del motor; no restaura componentes.
- **Entrenador:** aumenta el progreso diario de velocidad/control de los pilotos que tienen formación asignada y pagada. Respeta el potencial individual; no entrena gratuitamente a pilotos sin un plan activo.
- **Ojeador:** evalúa cualquier piloto por $75 de gastos, con entrega entre tres y siete días. Prepara un informe a la vez y conserva el intervalo estimado de potencial, con incertidumbre según su rendimiento. La evaluación puede equivocarse; no revela el potencial exacto. Despedirlo o finalizar su contrato interrumpe sus informes pendientes sin devolución de los gastos.
- **Estratega:** coordina el trabajo de boxes junto al mecánico. En carreras antiguas, la reducción combinada del servicio no supera el 25 %. Las carreras nuevas añaden la velocidad y el acierto profesional de la 0.6.2; ninguna acorta sanciones. El apoyo se fija al iniciar la carrera y excluye al personal ocupado en el taller.

**Contratos y nóminas:** negocia salario, prima y seis/doce/veinticuatro meses. Puede haber contraofertas y una pausa tras insistir con propuestas insuficientes. La prima se paga al firmar y se exige una reserva de media nómina. El sueldo se devenga diariamente y vence el día 1. Si no alcanza la caja, permanece pendiente, empeora la motivación y activa el mismo plazo de insolvencia de 14 días, incluso con caja no negativa. Se reintenta el pago al avanzar y también puedes liquidar los atrasos desde Personal. La previsión, patrimonio y decisiones rivales incluyen estas obligaciones.

Rescindir exige un mes de indemnización más lo devengado y vencido. Un trabajador asignado al taller debe terminar antes; contratar a otro después no reescribe el plazo del trabajo. Las renovaciones se abren en los últimos 60 días, conservan lo adeudado y amplían el vencimiento actual. El fin de contrato, dimisión, retiro o bancarrota libera a la persona; las liquidaciones impagadas permanecen como obligaciones reales. Los retirados conservan su identidad e historial.

**Convivencia:** las relaciones dependen de personalidad y trabajo en equipo, evolucionan diariamente y modifican el rendimiento. Los conflictos dejan memoria y una noticia contextual; una motivación inferior a 25 durante 30 días permite dimitir cuando no hay un trabajo de taller asignado. La experiencia y la habilidad mejoran lentamente al trabajar con motivación suficiente. Los cumpleaños y el retiro a los 65 años se procesan una sola vez por fecha.

**Rivales:** contratan sobre el mismo mercado, con reserva para cuatro meses del nuevo gasto. Pueden renovar empleados, liquidar contratos para reducir nómina y ampliar su oficina cuando falta espacio. No reciben profesionales ni fondos gratuitos.

La interfaz separa **Mi plantilla / Mercado laboral / Ojeo / Relaciones**. Las fichas de pilotos enlazan sus informes y el taller muestra el profesional asignado. Se corrige también la validación de guardado de las bahías ampliadas: admite los trabajos simultáneos autorizados y rechaza asignar el mismo empleado a dos de ellos.

La 0.6.3 añade gerente y médico a las cinco especialidades originales. Jefes de taller, ingeniería general, suspensión, administración, marketing, investigadores y dirección deportiva, así como academia e I+D, continúan pendientes. La delegación de operaciones, el estratega automático y el entrenamiento en pista ya están incorporados. El equilibrio durante décadas todavía debe validarse con el resto de sistemas.

## Novedades de la 0.6 · sede y progresión, primera entrega

Abre **Instalaciones y progreso** desde la navegación o desde la sede. Esta primera entrega inició la expansión empresarial; el personal se incorpora en 0.6.1. La delegación de operaciones se añade en 0.6.3; academia e investigación siguen pendientes.

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
7. Repara solo el sistema base dañado, o usa la reparación completa. Las reparaciones no rejuvenecen las piezas de mejora: puedes reemplazarlas, desmontarlas o vender los repuestos libres al proveedor, según su liquidez. El servicio de neumáticos restaura el conjunto instalado: $160 si es estándar, o el precio de su compuesto ($290/$330). Conserva el ID del conjunto, no genera un repuesto para vender.

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

La 0.6.2 suma `tests/professionals.test.cjs` y `tests/browser-professionals.cjs`: niveles/estrés, aumentos y ofertas rivales, diagnóstico, CVs, minijuego completo con carrera activa, automatización, entrenamiento, lesiones/retiro, reanudación y compatibilidad 0.6.1. Consulta [la validación](docs/PRUEBAS.md).

La 0.6.3 añade `tests/operations.test.cjs` y `tests/browser-operations.cjs`: políticas, presupuestos, acciones reales, pausa, formación sin cobros dobles, atención médica y migración auténtica 0.6.2. El [registro de pruebas](docs/PRUEBAS.md) documenta la cobertura y sus límites.

La 0.6.4 añade `tests/challenge.test.cjs` para las reglas actuales y `tests/browser-challenge.cjs` para la nueva contratación/carrera en tres tamaños. Las pruebas previas fijan explícitamente las reglas históricas. `npm run test:balance` comprueba una temporada de supervivencia con ingresos y costes reales.

La 0.7.0 suma `tests/competition.test.cjs` y `tests/browser-competition.cjs`. `npm run test:balance` usa las ligas actuales; `npm run test:balance:v64` conserva la ruta histórica. Los modelos visuales son una interpretación 2D y las carreras no reproducen un simulador físico profesional.

La 0.8.0 añade `tests/development.test.cjs`, `tests/browser-development.cjs` y la ruta financiera actual. `npm run test:balance:v70` y `npm run test:balance:v64` conservan las rutas históricas.

La 0.9.0 añade el taller visual y su recorrido de pruebas. `npm run test:balance:v80` conserva la temporada histórica 0.8; la ruta principal usa el constructor actual.

La 0.11.0 añade suministro/CV semanales, concesionario y palmarés. La ruta financiera principal usa el constructor actual; `test:balance:v100` y `test:balance:v90` conservan las temporadas anteriores.
