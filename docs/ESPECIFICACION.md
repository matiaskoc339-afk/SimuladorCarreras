# 🏁 RACING COMPANY SIMULATOR
## PROMPT MAESTRO DE DESARROLLO
### Simulador profundo de gestión de una compañía automovilística

Quiero que desarrolles un videojuego completo para PC utilizando **HTML, CSS y JavaScript**.

El proyecto se llamará provisionalmente **RACING COMPANY SIMULATOR**.

No quiero un prototipo superficial, un juego únicamente de menús ni una demostración con sistemas simulados de forma falsa. Quiero construir progresivamente un simulador empresarial de automovilismo con mecánicas conectadas, inteligencia artificial de competidores, vehículos modificables, carreras visuales, economía y un mundo persistente.

El desarrollo será por etapas, pero desde la primera versión deberá existir una experiencia jugable y funcional.

**IMPORTANTE:** No elimines ni simplifiques arbitrariamente las mecánicas solicitadas. Si una funcionalidad es demasiado compleja para implementarla inmediatamente, prepara su arquitectura y desarrolla una primera versión funcional que pueda mejorarse posteriormente.

No consideres que una mecánica está terminada si solo tiene una interfaz visual.

---

# 1. CONCEPTO GENERAL

El jugador será el propietario de una compañía dedicada al automovilismo.

Su objetivo será convertir una empresa desconocida en la compañía de carreras más importante del mundo.

Para conseguirlo deberá:

- Contratar corredores.
- Comprar vehículos.
- Construir y modificar coches.
- Contratar empleados.
- Participar en competiciones.
- Administrar contratos.
- Conseguir patrocinadores.
- Negociar con fabricantes.
- Gestionar su economía.
- Comprar, vender y subastar vehículos.
- Investigar tecnologías.
- Mejorar sus instalaciones.
- Desarrollar pilotos.
- Competir contra otras compañías.
- Administrar su reputación.
- Tomar decisiones durante carreras en tiempo real.
- Sobrevivir a crisis económicas y deportivas.

El jugador no conducirá directamente los vehículos.

**Su función será administrar la empresa y dirigir estratégicamente a sus pilotos.**

El juego debe tener progresión lenta.

Pasar de un pequeño garaje a una compañía mundialmente reconocida deberá requerir numerosas temporadas.

No quiero que en unas pocas horas el jugador tenga los mejores vehículos y corredores.

La dificultad será fija y realista, equilibrada para permitir recuperarse de malas decisiones sin eliminar las consecuencias de estas.

---

# 2. TECNOLOGÍA Y ARQUITECTURA

El videojuego se desarrollará con:

- HTML5.
- CSS3.
- JavaScript.
- Canvas 2D.
- Almacenamiento local persistente.
- Arquitectura modular.

El resultado deberá funcionar en navegadores modernos de PC.

Prioriza una estructura sencilla de ejecutar y mantener.

Evita dependencias innecesarias, servicios de pago y sistemas que requieran conexión permanente a internet.

Si utilizas módulos JavaScript, proporciona una forma sencilla de iniciar el juego localmente. Si es posible mantener una versión autónoma que funcione abriendo `index.html`, mejor.

Organiza el proyecto en sistemas independientes:

1. Motor general del juego.
2. Calendario.
3. Economía.
4. Compañías.
5. Pilotos.
6. Empleados.
7. Vehículos.
8. Taller.
9. Mercado.
10. Fabricantes.
11. Patrocinadores.
12. Competiciones.
13. Simulación de carreras.
14. Inteligencia artificial.
15. Noticias.
16. Instalaciones.
17. Investigación.
18. Reputación.
19. Archivo histórico.
20. Guardado y carga.
21. Interfaz gráfica.

Estos sistemas deberán comunicarse entre sí mediante un estado de juego coherente.

Por ejemplo, cuando una compañía rival compra un coche, ese vehículo debe desaparecer del mercado, pasar a su inventario y descontarse de sus fondos.

Cuando un piloto abandona una empresa, esa empresa debe perder al piloto y buscar un sustituto si lo necesita.

**No quiero que cada pantalla funcione como una simulación independiente. Todo debe formar parte del mismo mundo.**

---

# 3. INICIO DE PARTIDA

Al iniciar una partida nueva, el jugador podrá:

1. Escribir el nombre de su compañía.
2. Crear su propio logotipo.
3. Confirmar la identidad empresarial.
4. Comenzar su primera temporada.

No existirá un personaje personalizable para el dueño.

El jugador es simplemente el propietario de la compañía.

## Editor de logotipos

El jugador deberá dibujar personalmente su logotipo dentro del juego.

Implementa un editor mediante Canvas.

Funciones:

- Pincel.
- Borrador.
- Selección de colores.
- Diferentes grosores.
- Deshacer.
- Rehacer.
- Limpiar lienzo.
- Fondo transparente.
- Vista previa.
- Guardar diseño.
- Exportar imagen PNG.

El logotipo aparecerá en:

- La sede empresarial.
- Las tarjetas de la compañía.
- Los contratos.
- Los resultados deportivos.
- Los rankings.
- Los vehículos cuando corresponda.
- Las noticias.
- El archivo histórico.

También podrá modificarse posteriormente.

## Condiciones iniciales

El jugador comenzará con:

- Un garaje pequeño alquilado.
- Un vehículo usado de prestaciones modestas.
- Poco dinero.
- Herramientas básicas.
- Capacidad limitada.
- Reputación prácticamente inexistente.
- Acceso únicamente a competiciones pequeñas.
- Acceso a currículums de pilotos principiantes.

La situación inicial deberá permitir empezar a competir sin regalar recursos excesivos.

El jugador tendrá que gestionar cuidadosamente sus primeras inversiones.

---

# 4. SISTEMA DE TIEMPO Y CALENDARIO

El tiempo avanzará mediante un calendario diario.

Cada partida comenzará en una fecha moderna fija, inicialmente en 2026.

Existirán:

- Días.
- Semanas.
- Meses.
- Años.
- Temporadas deportivas.

El jugador podrá realizar acciones durante el día y utilizar un botón para avanzar a la siguiente jornada.

Algunas acciones consumirán tiempo.

Ejemplos:

Instalar neumáticos: unas horas.

Reparar un motor: varios días.

Construir una ampliación: varias semanas.

Desarrollar tecnología: varios meses.

Las duraciones dependerán del personal, instalaciones, complejidad del trabajo y disponibilidad de recursos.

## Procesamiento diario

Cada vez que avance el calendario deberán actualizarse:

- Finanzas.
- Contratos.
- Salarios y pagos cuando correspondan.
- Mantenimiento.
- Reparaciones.
- Entrenamientos.
- Desarrollo de pilotos.
- Lesiones y recuperaciones.
- Actividades de los rivales.
- Precios del mercado.
- Vehículos disponibles.
- Negociaciones.
- Patrocinadores.
- Noticias.
- Eventos.
- Investigación.
- Construcciones.
- Reputación.
- Competiciones.

El jugador recibirá notificaciones importantes antes de avanzar si existen decisiones urgentes pendientes.

Las carreras se disputarán cuando llegue la fecha correspondiente.

No debe ser posible avanzar y saltarse accidentalmente una carrera obligatoria sin una confirmación.

---

# 5. SISTEMA DE COMPAÑÍAS

Las compañías rivales son una de las mecánicas más importantes del videojuego.

**No quiero rivales decorativos ni empresas con dinero infinito.**

Cada compañía deberá ser una entidad persistente que posea:

- Nombre.
- Logotipo.
- Propietario ficticio.
- Fecha de fundación.
- Nivel empresarial.
- Dinero.
- Valoración.
- Deudas.
- Ingresos.
- Gastos.
- Instalaciones.
- Pilotos.
- Empleados.
- Vehículos.
- Repuestos.
- Patrocinadores.
- Contratos.
- Reputación.
- Historial deportivo.
- Objetivos.
- Relaciones empresariales.

## Inteligencia artificial empresarial

Las empresas rivales deberán tomar decisiones según su situación.

Podrán:

- Comprar coches.
- Vender vehículos.
- Participar en subastas.
- Contratar pilotos.
- Despedir empleados.
- Mejorar instalaciones.
- Reparar coches.
- Modificar vehículos.
- Entrenar pilotos.
- Negociar contratos.
- Conseguir patrocinadores.
- Participar en campeonatos.
- Investigar tecnologías.
- Solicitar préstamos.
- Reducir gastos.
- Cambiar de propietarios.
- Fusionarse.
- Entrar en crisis.
- Declararse en bancarrota.

También podrán aparecer compañías nuevas.

## Personalidades empresariales

No todas las compañías actuarán igual.

Ejemplos:

**Empresa conservadora:** prioriza estabilidad financiera.

**Empresa agresiva:** realiza inversiones arriesgadas para ganar campeonatos.

**Empresa desarrolladora:** compra vehículos económicos y los mejora.

**Empresa formadora:** busca jóvenes pilotos.

**Empresa prestigiosa:** contrata corredores famosos y busca grandes patrocinadores.

**Empresa oportunista:** aprovecha crisis ajenas para comprar activos baratos.

Sus decisiones deberán surgir de sus recursos, necesidades, objetivos y personalidad.

No quiero resultados completamente aleatorios.

## Relaciones entre compañías

Las empresas podrán:

- Ser aliadas comerciales.
- Convertirse en rivales.
- Comprar activos entre ellas.
- Competir por patrocinadores.
- Fichar pilotos de otras empresas.
- Realizar ofertas por vehículos.
- Negociar acuerdos técnicos.
- Fusionarse.
- Desarrollar conflictos empresariales.

También podrán existir rumores, acusaciones y disputas comerciales ficticias, con consecuencias sobre la reputación.

---

# 6. NIVELES EMPRESARIALES

La compañía tendrá diez niveles de desarrollo.

La progresión será lenta.

| Nivel | Tipo de compañía |
|---|---|
| 1 | Garaje principiante |
| 2 | Taller independiente |
| 3 | Equipo local |
| 4 | Escudería regional |
| 5 | Compañía reconocida |
| 6 | Escudería nacional |
| 7 | Empresa internacional |
| 8 | Potencia automovilística |
| 9 | Élite mundial |
| 10 | Leyenda del automovilismo |

El nivel influirá en:

- Cantidad de pilotos contratables.
- Capacidad de empleados.
- Instalaciones disponibles.
- Capacidad base del garaje.
- Tipos de contratos accesibles.
- Prestigio de las ofertas recibidas.
- Currículums disponibles.
- Campeonatos.
- Oportunidades comerciales.

No deben existir límites arbitrarios que contradigan las instalaciones físicas.

Por ejemplo, la cantidad de coches dependerá principalmente del espacio de almacenamiento, los recursos y las ampliaciones desbloqueadas por el nivel.

Una compañía avanzada podrá superar la capacidad inicial construyendo nuevas áreas dentro de su sede.

El ascenso requerirá objetivos empresariales y deportivos.

También deberá ser posible descender de nivel tras una crisis prolongada.

---

# 7. SISTEMA DE PILOTOS

Quiero un sistema de contratación profundo, similar al de un simulador de gestión deportiva.

## Currículums

El jugador recibirá currículums de corredores interesados.

La calidad y cantidad dependerán de:

- Nivel empresarial.
- Reputación.
- Resultados recientes.
- Salarios ofrecidos.
- País o región.
- Prestigio deportivo.
- Relaciones comerciales.

Cada currículum incluirá:

**Información personal**
- Nombre.
- Apellido.
- Edad.
- Nacionalidad.
- Trayectoria.
- Experiencia.
- Especialidad.
- Personalidad.

**Información deportiva**
- Velocidad.
- Frenada.
- Control.
- Adelantamiento.
- Defensa.
- Consistencia.
- Adaptación al clima.
- Gestión de neumáticos.
- Resistencia.
- Concentración.
- Disciplina.
- Trabajo en equipo.

**Información contractual**
- Salario solicitado.
- Duración deseada.
- Bonificaciones.
- Expectativas.
- Preferencias.
- Agente o representante.

**Características individuales**
- Ventajas.
- Desventajas.
- Fortalezas.
- Debilidades.
- Motivaciones.
- Ambiciones.

Ejemplo:

NOMBRE: Lucas Ferreira

EDAD: 21

NACIONALIDAD: Brasil

EXPERIENCIA: 2 temporadas

FORTALEZA: Excelente adelantando.

DEBILIDAD: Comete errores bajo presión.

SALARIO SOLICITADO: $1,300 mensuales.

OBJETIVO: Conseguir oportunidades en categorías superiores.

Los perfiles deben generarse de forma variada y coherente.

## Potencial oculto

Cada piloto tendrá un potencial real que el jugador no conocerá directamente.

Los ojeadores ofrecerán estimaciones imperfectas.

Un piloto aparentemente mediocre podría convertirse en una estrella.

Otro considerado una gran promesa podría estancarse.

## Desarrollo

Los pilotos evolucionarán mediante:

- Carreras.
- Entrenamientos.
- Experiencia.
- Calidad de instructores.
- Edad.
- Motivación.
- Confianza.
- Condiciones de trabajo.
- Resultados.
- Lesiones.

Su progreso no será idéntico.

## Edad y retiro

Los pilotos:

- Envejecerán.
- Ganarán experiencia.
- Podrán mejorar.
- Alcanzarán un momento de máximo rendimiento.
- Perderán determinadas capacidades gradualmente.
- Podrán retirarse.

Algunos corredores retirados podrán convertirse en instructores, ojeadores, directivos o propietarios de compañías.

## Relaciones personales

Los pilotos podrán:

- Llevarse bien o mal con compañeros.
- Solicitar aumentos.
- Exigir mejores vehículos.
- Solicitar participar en más carreras.
- Sentirse infravalorados.
- Pedir ser pilotos principales.
- Negarse a renovar.
- Recibir ofertas rivales.
- Abandonar la empresa.
- Incumplir determinadas órdenes deportivas.

Estas decisiones deberán depender de sus personalidades y circunstancias.

---

# 8. NEGOCIACIONES Y CONTRATOS

No quiero que contratar a alguien sea simplemente pulsar un botón y pagar.

Debe existir un sistema de negociación.

Los contratos podrán incluir:

- Salario.
- Duración.
- Prima de contratación.
- Bonificaciones.
- Objetivos deportivos.
- Cláusulas de rescisión.
- Condiciones de renovación.
- Posición dentro del equipo.
- Promesas.
- Obligaciones.
- Exclusividad.

Los representantes de los pilotos podrán presentar contraofertas.

El jugador podrá negociar, aceptar, rechazar o retirarse.

Una promesa incumplida podrá generar conflictos.

Los pilotos y empleados deberán conservar recuerdos relevantes sobre negociaciones y decisiones anteriores.

---

# 9. SISTEMA DE EMPLEADOS

La compañía podrá contratar:

- Mecánicos.
- Jefes de taller.
- Ingenieros.
- Ingenieros de motores.
- Especialistas en suspensión.
- Estrategas.
- Ojeadores.
- Entrenadores.
- Gerentes.
- Administrativos.
- Especialistas en marketing.
- Investigadores.
- Directores deportivos.
- Personal médico.

Cada empleado tendrá:

- Nombre.
- Edad.
- Experiencia.
- Habilidades.
- Especialización.
- Salario.
- Personalidad.
- Motivación.
- Lealtad.
- Rendimiento.
- Relaciones laborales.

Los empleados podrán mejorar profesionalmente.

También podrán renunciar, retirarse o ser contratados por otras compañías.

## Relaciones internas

Existirán:

- Conflictos.
- Amistades profesionales.
- Diferencias de liderazgo.
- Desacuerdos estratégicos.
- Problemas de motivación.
- Grupos de trabajo compatibles o incompatibles.

Un empleado talentoso no siempre será el mejor para determinada plantilla.

## Automatización y delegación

El jugador podrá delegar actividades en gerentes.

Ejemplos:

- Reparaciones rutinarias.
- Entrenamientos.
- Compra de suministros.
- Mantenimiento.
- Gestión de inventario.
- Búsqueda de pilotos.
- Administración de gastos menores.

El jugador podrá configurar políticas y presupuestos.

Por ejemplo:

«Reparar automáticamente cualquier vehículo si el coste es inferior a $2,000».

Las tareas delegadas deberán ejecutarse realmente.

---

# 10. SISTEMA DE VEHÍCULOS

Los coches serán otro sistema central.

Quiero utilizar marcas y modelos reales.

Ejemplos:

- Toyota Supra.
- Nissan Skyline GT-R.
- Mazda RX-7.
- Honda Civic Type R.
- BMW M3.
- Porsche 911.
- Ford Mustang.
- Chevrolet Corvette.
- Mitsubishi Lancer Evolution.
- Subaru Impreza WRX STI.

El catálogo deberá ser ampliable y contener generaciones, años y versiones cuando corresponda.

Utiliza datos técnicos contrastados cuando estén disponibles. Si alguna característica debe simplificarse por diseño, utiliza valores equilibrados e identifica esos valores como parámetros del videojuego.

No utilices logotipos oficiales ni recursos gráficos protegidos sin autorización. Los nombres de los modelos pueden utilizarse como referencias descriptivas, mientras que las ilustraciones deberán ser originales.

## Atributos del vehículo

Cada coche tendrá:

- Marca.
- Modelo.
- Generación.
- Año.
- Kilometraje.
- Estado.
- Potencia.
- Peso.
- Aceleración.
- Velocidad máxima.
- Frenada.
- Agarre.
- Aerodinámica.
- Resistencia.
- Fiabilidad.
- Consumo.
- Valor comercial.

También conservará un identificador único.

Dos coches del mismo modelo no deberán ser necesariamente idénticos.

Podrán variar por kilometraje, estado, modificaciones e historial.

---

# 11. TALLER DE MODIFICACIONES

Quiero un sistema inspirado en la profundidad de los talleres de juegos como Gran Turismo.

El jugador podrá modificar prácticamente todos los sistemas importantes del automóvil.

## Componentes modificables

**Motor**
- Componentes internos.
- Admisión.
- Escape.
- Refrigeración.
- Sobrealimentación cuando sea compatible.

**Transmisión**
- Caja de cambios.
- Embrague.
- Diferencial.
- Relaciones de transmisión.

**Suspensión**
- Amortiguadores.
- Muelles.
- Altura.
- Rigidez.
- Geometría simplificada.

**Frenos**
- Discos.
- Pastillas.
- Pinzas.
- Refrigeración.

**Neumáticos**
- Compuestos.
- Dimensiones compatibles.
- Desgaste.
- Configuración.

**Aerodinámica**
- Alerones.
- Splitters.
- Difusores.
- Elementos de carrocería.

**Otros**
- Reducción de peso.
- Llantas.
- Carrocería.
- Refrigeración adicional.
- Refuerzos para competición.
- Personalización estética.

## Compatibilidad

No todas las piezas servirán para cualquier coche.

La instalación deberá comprobar:

- Modelo compatible.
- Espacio disponible.
- Componentes requeridos.
- Restricciones técnicas.
- Reglamento de competiciones.
- Presupuesto.
- Disponibilidad del taller.

Evita que el jugador pueda montar cualquier componente sin restricciones.

## Consecuencias reales

Las modificaciones deberán influir en la simulación de carreras.

Ejemplos:

Un motor más potente puede incrementar el consumo y afectar la fiabilidad.

Una configuración muy agresiva puede mejorar el rendimiento a una vuelta, pero desgastar más los neumáticos.

Un coche con mala refrigeración puede sufrir problemas durante pruebas prolongadas.

No quiero mejoras que únicamente sumen puntos a un número genérico.

---

# 12. PERSONALIZACIÓN VISUAL

Los vehículos serán representados mediante gráficos 2D detallados.

**La vista principal del vehículo será superior.**

Durante las carreras se utilizarán cámaras superiores y cámaras que sigan a los pilotos.

Los vehículos deberán distinguirse claramente entre sí.

Un Nissan Skyline no debería parecer simplemente un rectángulo idéntico al de un Toyota Supra.

Quiero siluetas y proporciones diferentes.

## Editor visual

El jugador podrá cambiar:

- Pintura.
- Colores secundarios.
- Diseños.
- Franjas.
- Vinilos.
- Números.
- Logotipo empresarial.
- Patrocinadores.
- Llantas.
- Elementos aerodinámicos visibles.

Las modificaciones visuales deberán reflejarse en el coche tanto en el garaje como durante las carreras.

Utiliza ilustraciones originales con Canvas, SVG o recursos propios del proyecto.

Evita depender de imágenes externas que puedan dejar de cargar.

---

# 13. DAÑOS Y MANTENIMIENTO

Cada vehículo tendrá un estado mecánico detallado.

Componentes con desgaste individual:

- Motor.
- Transmisión.
- Frenos.
- Suspensión.
- Neumáticos.
- Refrigeración.
- Carrocería.

Las carreras afectarán al desgaste según:

- Distancia.
- Estilo de conducción.
- Configuración.
- Calidad de piezas.
- Clima.
- Incidentes.
- Fiabilidad inicial.

Los accidentes podrán producir daños en componentes específicos.

Las reparaciones tendrán:

- Coste.
- Duración.
- Piezas necesarias.
- Personal asignado.

Los daños importantes afectarán al valor del vehículo.

Cada coche conservará su historial de accidentes, reparaciones y modificaciones.

---

# 14. MERCADO AUTOMOVILÍSTICO

El juego tendrá un mercado dinámico.

Secciones:

1. Concesionarios.
2. Vehículos usados.
3. Importaciones.
4. Vehículos de competición.
5. Vehículos exclusivos.
6. Subastas.
7. Ventas entre compañías.
8. Ofertas de fabricantes.
9. Mercado de coleccionistas.

El jugador podrá:

- Comprar.
- Vender.
- Publicar ofertas.
- Negociar precios.
- Participar en subastas.
- Retirar vehículos del mercado.
- Consultar historial.
- Comparar características.

Los rivales también participarán en estas operaciones.

El valor de un coche dependerá de:

- Marca y modelo.
- Antigüedad.
- Estado.
- Kilometraje.
- Historial.
- Escasez.
- Demanda.
- Resultados deportivos.
- Modificaciones.
- Interés de coleccionistas.

Los vehículos históricos podrán aumentar de valor.

---

# 15. MERCADO DE REPUESTOS

La tienda tendrá piezas con:

- Marca.
- Nombre.
- Categoría.
- Compatibilidad.
- Precio.
- Estado.
- Rendimiento.
- Peso.
- Fiabilidad.
- Disponibilidad.

Existirán piezas:

- Nuevas.
- Usadas.
- Reacondicionadas.
- Exclusivas.
- Escasas.
- Desarrolladas internamente.

Los precios fluctuarán.

Los proveedores podrán ofrecer descuentos según las relaciones comerciales.

El inventario del jugador deberá almacenar realmente las piezas adquiridas.

Una pieza instalada dejará de estar disponible en el almacén, salvo que sea desmontada y recuperable.

---

# 16. SISTEMA DE CARRERAS

Las carreras serán uno de los principales atractivos.

**NO QUIERO QUE LAS CARRERAS SEAN SOLAMENTE UNA TABLA DE RESULTADOS O UNA BARRA DE PROGRESO.**

Deben existir vehículos visualmente representados que recorran circuitos.

La simulación estará basada en física simplificada, pero coherente.

## Vista de carrera

Quiero una presentación semejante a una transmisión televisiva.

Elementos:

- Circuito visible.
- Vehículos desplazándose.
- Cámaras de seguimiento.
- Cambios de cámara.
- Clasificación en directo.
- Diferencias de tiempo.
- Vueltas.
- Posiciones.
- Información de neumáticos.
- Estado del coche.
- Incidentes.
- Banderas.
- Radio del equipo.
- Repeticiones de acontecimientos importantes.

Los coches podrán visualizarse desde arriba, con cámaras de seguimiento que mantengan el vehículo seleccionado en pantalla.

La cámara podrá cambiar automáticamente cuando sucedan acontecimientos importantes.

## Cantidad de participantes

Las carreras podrán incluir:

- Duelos.
- Carreras pequeñas.
- Competiciones regionales.
- Parrillas grandes de 30 o más vehículos.

La cantidad dependerá del evento.

## Velocidad

Controles:

- Pausa.
- x1.
- x2.
- x4.

El aumento de velocidad deberá acelerar la simulación sin alterar injustificadamente sus resultados.

## Simulación

Cada piloto deberá recorrer físicamente el circuito virtual.

La velocidad se calculará según:

- Potencia.
- Peso.
- Agarre.
- Frenos.
- Aerodinámica.
- Estado mecánico.
- Neumáticos.
- Temperatura.
- Clima.
- Características del circuito.
- Habilidades del piloto.
- Estrategia.
- Tráfico.
- Combustible cuando corresponda.

Las curvas deberán influir en la velocidad.

Los pilotos necesitarán reducir la velocidad antes de determinadas curvas.

Los adelantamientos deberán ser acontecimientos visibles, no simples intercambios de posiciones en una lista.

La simulación deberá mantener un equilibrio entre realismo y rendimiento.

---

# 17. ÓRDENES DURANTE LA CARRERA

El jugador podrá comunicarse con los pilotos.

Órdenes:

- Conducir agresivamente.
- Mantener ritmo.
- Ahorrar neumáticos.
- Ahorrar combustible.
- Atacar al piloto de delante.
- Defender posición.
- Evitar riesgos.
- Entrar a boxes.
- Cambiar estrategia.
- Respetar órdenes de equipo.

Los pilotos tendrán comportamientos individuales.

Un corredor disciplinado obedecerá normalmente.

Uno impulsivo podría ignorar una instrucción si considera que tiene posibilidades de ganar.

## Radio

Implementa mensajes contextuales.

Ejemplo:

INGENIERO:
«Los neumáticos están perdiendo rendimiento».

PILOTO:
«Lo noto. El coche está empezando a deslizar».

JUGADOR:
«Entra a boxes en la próxima vuelta».

PILOTO:
«Entendido».

Las conversaciones deberán depender del estado real de la carrera.

Evita generar mensajes aleatorios sin relación con lo que sucede.

---

# 18. CLIMA Y ACCIDENTES

Existirá clima dinámico.

Condiciones:

- Soleado.
- Nublado.
- Lluvia ligera.
- Lluvia intensa.
- Pista húmeda.
- Pista secándose.

El pronóstico podrá ser imperfecto.

Elegir neumáticos adecuados será importante.

## Incidentes

Podrán ocurrir:

- Salidas de pista.
- Trompos.
- Contactos.
- Averías.
- Pinchazos.
- Accidentes.
- Abandonos.
- Sanciones.

La probabilidad dependerá de factores reales de la simulación, no únicamente del azar.

Existirán banderas y procedimientos deportivos según el reglamento de cada competición.

Los incidentes podrán afectar la confianza y disponibilidad de los pilotos, sin necesidad de representaciones gráficas fuertes.

---

# 19. COMPETICIONES

El juego tendrá distintas categorías.

## Carreras profesionales

- Campeonatos locales.
- Categorías regionales.
- Competiciones nacionales.
- Campeonatos internacionales.
- Categorías GT.
- Turismos.
- Resistencia.
- Eventos especiales.

## Carreras callejeras ficticias

Existirá una escena competitiva alternativa con:

- Organizaciones.
- Reputación.
- Rivalidades.
- Eventos.
- Invitaciones.
- Categorías propias.
- Consecuencias legales abstractas dentro del juego.

Estas carreras se desarrollarán como competiciones ficticias, sin incluir instrucciones prácticas para organizar actividades ilegales en el mundo real.

## Otros eventos

- Carreras por invitación.
- Duelo de fabricantes.
- Eventos retro.
- Competiciones de coches clásicos.
- Carreras promocionales.
- Torneos especiales.

Cada competición tendrá:

- Nombre.
- Organizador.
- Calendario.
- Reglamento.
- Requisitos.
- Premios.
- Inscripción.
- Clasificación.
- Historial de campeones.

Algunas categorías tendrán restricciones estrictas.

Otras permitirán competir a vehículos modificados de diferentes características mediante sistemas de clasificación o equilibrio.

Los resultados deportivos deberán afectar al mundo empresarial.

---

# 20. CAMPEONATOS Y TEMPORADAS

Los campeonatos tendrán calendarios persistentes.

Cada carrera sumará puntos según su reglamento.

Existirán:

- Clasificación de pilotos.
- Clasificación de equipos.
- Resultados históricos.
- Estadísticas.
- Campeones.
- Récords.

Los reglamentos podrán cambiar cada varias temporadas.

Por ejemplo:

- Modificaciones de potencia máxima.
- Cambios de peso.
- Nuevas restricciones aerodinámicas.
- Cambios de neumáticos.
- Nuevas categorías.
- Competiciones que desaparecen.

Los cambios deberán anunciarse con anticipación para que las compañías puedan adaptarse.

---

# 21. PATROCINADORES Y FABRICANTES

Quiero un sistema de contratos comerciales profundo.

Los patrocinadores no deberán limitarse a entregar dinero por ganar carreras.

Existirán contratos con cláusulas específicas.

## Tipos de patrocinio

- Financiero.
- Técnico.
- Deportivo.
- Exclusivo.
- Publicitario.
- Programa de jóvenes talentos.
- Acuerdo con fabricante.

## Exigencias posibles

Un patrocinador podrá exigir:

- Utilizar su logotipo.
- Competir en cierto campeonato.
- Terminar en determinada posición.
- Utilizar piezas específicas.
- Utilizar determinado vehículo.
- Participar en eventos promocionales.
- Mantener una imagen pública.
- No contratar patrocinadores rivales.
- Dar protagonismo a un piloto determinado.

### MUY IMPORTANTE: PILOTOS IMPUESTOS

Esta mecánica es obligatoria.

Algunos fabricantes o patrocinadores podrán exigir que el jugador contrate o utilice a un piloto específico.

Incluso si ese piloto tiene malas estadísticas.

Por ejemplo:

Un fabricante ofrece $80,000 y un vehículo de competición, pero exige utilizar a su piloto patrocinado durante el 70 % del campeonato.

El piloto podría ser malo.

El jugador deberá decidir cómo manejar la situación.

Tal vez tenga que invertir en entrenamiento, contratar mejores ingenieros o diseñar estrategias que compensen su bajo rendimiento.

El piloto también podría resultar ser una futura estrella.

No todas las decisiones deben tener un resultado evidente.

## Negociaciones

El jugador podrá:

- Aceptar.
- Rechazar.
- Negociar.
- Solicitar mejores condiciones.
- Ofrecer contraprestaciones.
- Renovar contratos.

Los acuerdos tendrán fechas y consecuencias.

Romper un contrato afectará dinero, reputación y relaciones.

Las compañías rivales también competirán por estos patrocinios.

---

# 22. ECONOMÍA Y CONTABILIDAD

Quiero una economía completa y coherente.

## Ingresos

- Premios deportivos.
- Patrocinios.
- Venta de vehículos.
- Venta de repuestos.
- Acuerdos comerciales.
- Bonificaciones.
- Cesión de servicios.
- Actividades empresariales autorizadas por el sistema del juego.

## Gastos

- Salarios.
- Alquiler.
- Reparaciones.
- Repuestos.
- Inscripciones.
- Transporte.
- Mantenimiento.
- Impuestos simulados.
- Préstamos.
- Intereses.
- Investigación.
- Construcción.
- Formación.
- Publicidad.

Existirá una pantalla financiera con:

- Efectivo.
- Ingresos.
- Gastos.
- Beneficio o pérdida.
- Deuda.
- Patrimonio.
- Valoración empresarial.
- Flujo de caja.
- Proyecciones.

Los salarios y pagos recurrentes deberán cobrarse en las fechas correspondientes.

## Préstamos

Las entidades financieras evaluarán:

- Reputación.
- Ingresos.
- Deudas.
- Historial.
- Capacidad de pago.

Los préstamos tendrán intereses y vencimientos.

## Bancarrota

Si una compañía no puede afrontar sus obligaciones y agota las opciones financieras disponibles, podrá declararse en bancarrota.

**La bancarrota definitiva de la compañía del jugador provocará el final de la partida.**

Los rivales podrán desaparecer por el mismo motivo.

La partida finalizada podrá conservarse como archivo histórico, pero no continuar normalmente.

---

# 23. PRONÓSTICOS DEPORTIVOS

Incorpora un apartado opcional para realizar pronósticos sobre los resultados de carreras.

El sistema utilizará puntos de predicción sin valor monetario.

No habrá depósitos, compras de puntos, dinero real, retiros, premios canjeables ni conexión con plataformas de apuestas.

Los pronósticos permitirán comparar las expectativas del jugador con los resultados deportivos y consultar un historial de aciertos.

Este apartado será independiente de las finanzas empresariales.

---

# 24. INSTALACIONES Y SEDE

El jugador tendrá una única sede.

**NO DEBE EXISTIR UN SISTEMA DE MÚLTIPLES SUCURSALES.**

La sede podrá ampliarse progresivamente.

## Instalaciones

- Garaje.
- Taller.
- Almacén.
- Ingeniería.
- Investigación.
- Oficina administrativa.
- Finanzas.
- Marketing.
- Recursos humanos.
- Academia de pilotos.
- Centro médico.
- Sala de estrategia.
- Centro de simulación.
- Áreas especializadas.

Cada instalación tendrá niveles de desarrollo.

Mejorarlas requerirá recursos y tiempo.

## Vista principal

La sede deberá visualizarse gráficamente en 2D.

El jugador podrá seleccionar edificios o departamentos con el mouse.

Al hacer clic en uno, se abrirá su pantalla de gestión.

Por ejemplo:

Clic en taller → abre taller.

Clic en garaje → abre vehículos.

Clic en oficina → abre administración.

Clic en academia → abre entrenamiento.

Clic en centro de estrategia → abre planificación deportiva.

El edificio deberá cambiar visualmente conforme crezca la compañía.

Quiero que el progreso sea visible.

---

# 25. INVESTIGACIÓN Y DESARROLLO

El jugador podrá crear un departamento de I+D.

Este departamento investigará:

- Motores.
- Refrigeración.
- Materiales.
- Suspensiones.
- Aerodinámica.
- Fiabilidad.
- Eficiencia.
- Sistemas de análisis deportivo.

Cada proyecto tendrá:

- Coste.
- Duración.
- Personal necesario.
- Requisitos.
- Probabilidad de éxito.
- Resultados.

Podrán existir prototipos y tecnologías propias.

Las empresas rivales también investigarán.

Un equipo con conocimientos acumulados podrá tener ventajas en áreas concretas.

Implementa patentes ficticias y derechos tecnológicos propios del universo del juego.

---

# 26. SISTEMA DE REPUTACIÓN

La reputación no será un único número.

Existirán reputaciones independientes:

- Público.
- Pilotos.
- Empleados.
- Fabricantes.
- Patrocinadores.
- Organizaciones deportivas.
- Compañías rivales.

Por ejemplo:

Una empresa puede ser muy respetada por sus resultados, pero tener mala reputación entre sus pilotos porque ofrece contratos poco favorables.

Las decisiones deberán afectar las relaciones correspondientes.

---

# 27. RANKING MUNDIAL

Existirá un ranking dinámico de compañías.

Se evaluarán:

- Resultados deportivos.
- Campeonatos.
- Trayectoria.
- Reputación.
- Prestigio.
- Desarrollo tecnológico.
- Calidad empresarial.
- Reconocimiento de fabricantes.
- Estabilidad económica.

Las compañías podrán subir y bajar posiciones.

Llegar al primer lugar será uno de los principales objetivos.

Pero el juego no finalizará automáticamente.

Se podrá continuar durante nuevas generaciones.

---

# 28. PERIÓDICO DIARIO — MOTOR WORLD DAILY

ESTA ES UNA DE LAS MECÁNICAS MÁS IMPORTANTES.

Cada jornada habrá una edición del periódico del mundo automovilístico.

El periódico se llamará provisionalmente:

**MOTOR WORLD DAILY**

Debe sentirse como un periódico deportivo real dentro del universo del juego.

## Noticias posibles

### Mercado
- Vehículos en venta.
- Subastas importantes.
- Cambios de precios.
- Piezas escasas.
- Nuevos proveedores.

### Fabricantes
- Lanzamientos.
- Nuevos modelos.
- Modelos descontinuados.
- Acuerdos comerciales.
- Programas de patrocinio.
- Ofertas de vehículos.

### Compañías
- Nuevas inversiones.
- Crisis financieras.
- Fusiones.
- Bancarrotas.
- Cambios de propietario.
- Crecimiento empresarial.
- Rivalidades.
- Despidos.
- Compras de vehículos.

### Pilotos
- Nuevas promesas.
- Fichajes.
- Renovaciones.
- Retiros.
- Conflictos contractuales.
- Resultados sorprendentes.

### Competiciones
- Próximas carreras.
- Cambios de reglamento.
- Campeonatos nuevos.
- Resultados.
- Sanciones.
- Récords.

### Mundo automovilístico
- Evolución tecnológica.
- Tendencias del mercado.
- Cambios empresariales.
- Acontecimientos históricos.

## Funcionamiento

Las noticias deberán surgir principalmente de acontecimientos que realmente hayan ocurrido en la simulación.

Ejemplo:

Una compañía rival compra un BMW M3.

El sistema registra la transacción.

El periódico puede publicar:

«Vortex Motorsport incorpora un BMW M3 a su flota».

Si el jugador consulta esa compañía, el vehículo deberá aparecer realmente en su inventario.

Otro ejemplo:

Un fabricante busca una compañía para patrocinar.

La noticia anuncia la oportunidad.

El jugador puede presentar una propuesta.

Las empresas rivales también participan.

Finalmente, el fabricante selecciona una oferta de forma coherente.

**Las noticias deben informar acontecimientos y oportunidades reales, no ser textos decorativos.**

Los artículos podrán incorporar acciones:

- Ver empresa.
- Consultar vehículo.
- Negociar.
- Inscribirse.
- Ver piloto.
- Consultar fabricante.

Las noticias antiguas deberán conservarse en un archivo.

También podrán existir rumores claramente diferenciados de los hechos confirmados.

---

# 29. MUNDO DINÁMICO Y EVOLUCIÓN HISTÓRICA

El juego comenzará en una época moderna fija.

El calendario podrá avanzar durante décadas.

El mundo deberá evolucionar.

## Fabricantes

Podrán aparecer:

- Nuevas generaciones de coches.
- Modelos descontinuados.
- Cambios tecnológicos.
- Cambios de precios.
- Nuevos acuerdos.

No inventes anuncios futuros atribuyéndolos como hechos reales a fabricantes existentes. Los acontecimientos futuros deberán identificarse como simulaciones ficticias dentro del juego.

## Pilotos

Aparecerán nuevas generaciones procedentes de:

- Academias.
- Karting.
- Competiciones juveniles.
- Categorías regionales.
- Programas de fabricantes.

Los veteranos se retirarán.

## Empresas

Las compañías podrán:

- Crecer.
- Fusionarse.
- Cambiar de dueño.
- Perder importancia.
- Desaparecer.

También aparecerán nuevas empresas.

## Competiciones

Los campeonatos podrán cambiar sus reglamentos.

Podrán crearse o desaparecer categorías.

## Vehículos clásicos

Los vehículos antiguos podrán convertirse en objetos de colección.

Su valor dependerá de:

- Escasez.
- Estado.
- Originalidad.
- Historial deportivo.
- Antigüedad.
- Demanda.

Habrá restauraciones y competiciones históricas.

---

# 30. ARCHIVO HISTÓRICO

La partida deberá registrar su historia.

Secciones:

- Campeones de cada temporada.
- Clasificaciones antiguas.
- Récords.
- Pilotos legendarios.
- Equipos históricos.
- Empresas desaparecidas.
- Fusiones empresariales.
- Vehículos destacados.
- Carreras memorables.
- Premios.
- Retiros.
- Logros del jugador.

El archivo deberá conservar acontecimientos importantes sin generar un tamaño de guardado descontrolado.

Los registros históricos resumidos deberán mantenerse aunque se descarten detalles de simulación innecesarios.

---

# 31. INTERFAZ Y EXPERIENCIA VISUAL

Quiero una interfaz que combine:

- Profundidad de Football Manager.
- Elegancia automovilística de Gran Turismo.
- Presentación visual de un juego de gestión moderno.

No quiero una página web genérica con botones comunes.

Debe sentirse como un videojuego.

## Estética

- Diseño moderno.
- Colores coherentes.
- Paneles bien organizados.
- Animaciones discretas.
- Transiciones suaves.
- Tipografía legible.
- Tarjetas de pilotos.
- Estadísticas comprensibles.
- Gráficos de rendimiento.
- Vehículos detallados.
- Identidad visual profesional.

## Pantalla principal

La pantalla principal será la sede de la compañía en vista 2D.

Los departamentos se seleccionarán haciendo clic en ellos.

La navegación principal deberá estar integrada en los edificios.

También podrá existir un pequeño panel persistente con:

- Fecha.
- Dinero.
- Nivel.
- Reputación.
- Próxima carrera.
- Notificaciones.
- Acceso al periódico.
- Avanzar día.

No conviertas la navegación principal en una lista gigante de botones.

## Empleados y pilotos

Se representarán mediante tarjetas visuales con:

- Retrato ilustrado.
- Nombre.
- Edad.
- Especialización.
- Estadísticas.
- Contrato.
- Estado.
- Moral.

Los retratos pueden ser ilustraciones originales generadas mediante gráficos 2D o recursos locales autorizados.

---

# 32. SISTEMA DE GUARDADO

El juego deberá permitir:

- Guardar manualmente.
- Guardar automáticamente.
- Crear varias partidas.
- Cargar partidas.
- Eliminar partidas.
- Consultar fecha de guardado.

Prioriza IndexedDB para los datos persistentes si el tamaño y complejidad lo justifican.

Implementa validación de versiones y mecanismos de recuperación.

Los guardados deberán conservar:

- Compañías.
- Vehículos.
- Pilotos.
- Empleados.
- Finanzas.
- Contratos.
- Calendario.
- Noticias.
- Campeonatos.
- Instalaciones.
- Investigaciones.
- Relaciones.
- Historial.

Al cargar una partida no deben reiniciarse las compañías rivales ni regenerarse arbitrariamente los vehículos.

---

# 33. COHERENCIA DEL UNIVERSO

Esta es una regla central.

Todas las mecánicas deben estar conectadas.

Ejemplo de una cadena de acontecimientos:

1. Un fabricante lanza un vehículo.
2. El periódico publica la noticia.
3. El modelo aparece en el mercado.
4. Varias compañías rivales lo evalúan.
5. Una compañía realiza una compra.
6. Sus finanzas disminuyen.
7. El vehículo aparece en su garaje.
8. Sus mecánicos pueden modificarlo.
9. La compañía lo inscribe en una carrera.
10. El coche participa visualmente.
11. El resultado afecta su reputación.
12. El vehículo acumula kilometraje y desgaste.
13. El equipo paga su mantenimiento.
14. Años después, el coche puede venderse.
15. Su historial deportivo influye en el precio.

Quiero que este tipo de conexiones sean la base del videojuego.

---

# 34. INTELIGENCIA ARTIFICIAL Y BALANCE

No quiero compañías rivales artificialmente débiles para favorecer al jugador.

Los rivales deben gestionar realmente sus recursos.

Tampoco quiero que sus resultados estén totalmente predeterminados.

Usa un sistema de simulación con variables coherentes, decisiones basadas en utilidad, restricciones económicas y elementos aleatorios controlados.

La aleatoriedad deberá producir variedad, pero no resultados absurdos.

Ejemplos:

Un piloto excelente puede cometer un error.

Un coche modesto puede ganar una carrera bajo circunstancias favorables.

Una empresa grande puede fracasar económicamente.

Una compañía pequeña puede descubrir una promesa.

Pero estos sucesos deberán tener explicaciones dentro de la simulación.

Implementa generación aleatoria reproducible cuando sea posible, utilizando semillas por partida para facilitar pruebas.

---

# 35. EVITAR REPETICIONES Y CONTENIDO VACÍO

El juego debe poder mantenerse interesante durante muchas temporadas.

Evita:

- Currículums prácticamente idénticos.
- Noticias repetidas cada día.
- Patrocinadores que siempre ofrecen lo mismo.
- Rivales que nunca cambian.
- Vehículos con estadísticas iguales.
- Carreras con resultados arbitrarios.
- Pilotos que siempre mejoran.
- Contratos sin consecuencias.
- Botones que no realizan acciones.
- Pantallas sin funcionalidades.

Los acontecimientos deberán depender del contexto del mundo.

No quiero que una compañía declarada en bancarrota siga participando en carreras como si nada hubiera pasado.

---

# 36. RENDIMIENTO

El juego deberá ejecutarse de manera fluida en un PC convencional.

Optimiza especialmente:

- Renderizado de vehículos.
- Simulación de carreras.
- Inteligencia artificial.
- Generación de noticias.
- Avance del calendario.
- Persistencia.
- Gestión de grandes inventarios.

Una carrera con más de treinta coches no debe hacer que el navegador se congele.

Separa la lógica de simulación de la frecuencia de renderizado.

Utiliza pasos de simulación estables para que el rendimiento del PC no altere injustificadamente los resultados deportivos.

---

# 37. PLAN DE DESARROLLO OBLIGATORIO

No intentes construir simultáneamente todos los sistemas definitivos si eso provoca una aplicación inestable.

Quiero desarrollo incremental.

Sin embargo, cada etapa entregada debe ser ejecutable y verificable.

## VERSIÓN 0.1 — BASE JUGABLE

Implementar:

- Menú principal.
- Nueva partida.
- Nombre de compañía.
- Editor de logotipo.
- Sede inicial.
- Calendario.
- Finanzas básicas.
- Vehículo inicial.
- Primeros currículums.
- Contratación de pilotos.
- Primer campeonato.
- Simulación visual básica de carreras.
- Resultados.
- Periódico.
- Guardado y carga.

**Esta versión deberá permitir completar al menos una temporada sencilla.**

No acepto una versión 0.1 compuesta únicamente de interfaces.

## VERSIÓN 0.2 — EMPRESAS RIVALES

Implementar:

- Compañías persistentes.
- Finanzas rivales.
- Flotas.
- Contrataciones.
- Transferencias.
- Decisiones empresariales.
- Noticias derivadas de acontecimientos.

## VERSIÓN 0.3 — TALLER

Implementar:

- Componentes.
- Compatibilidad.
- Modificaciones.
- Repuestos.
- Reparaciones.
- Desgaste.
- Consecuencias sobre el rendimiento.

## VERSIÓN 0.4 — ECONOMÍA Y CONTRATOS

Implementar:

- Negociaciones profundas.
- Patrocinadores.
- Fabricantes.
- Préstamos.
- Contabilidad.
- Cláusulas.
- Pilotos impuestos.

## VERSIÓN 0.5 — CARRERAS AVANZADAS

Implementar:

- Simulación mejorada.
- Cámaras.
- Estrategias.
- Neumáticos.
- Clima.
- Accidentes.
- Radio.
- Banderas.
- Boxes.
- Repeticiones.

## VERSIÓN 0.6 — EXPANSIÓN EMPRESARIAL

Implementar:

- Instalaciones.
- Empleados especializados.
- Automatización.
- Investigación.
- Academia.
- Relaciones laborales.

## VERSIÓN 0.7 — MERCADO COMPLETO

Implementar:

- Subastas.
- Importaciones.
- Fabricantes.
- Vehículos exclusivos.
- Coleccionistas.
- Precios dinámicos.
- Personalización visual.

## VERSIÓN 0.8 — MUNDO HISTÓRICO

Implementar:

- Evolución generacional.
- Pilotos retirados.
- Nuevos fabricantes y modelos simulados.
- Cambios de reglamento.
- Fusiones.
- Crisis.
- Archivo histórico.

## VERSIÓN 0.9 — PROFUNDIDAD

Implementar:

- Balance económico.
- Mejora de IA.
- Mayor variedad de acontecimientos.
- Relaciones empresariales.
- Mayor profundidad de contratos.
- Nuevas categorías deportivas.
- Optimización.

## VERSIÓN 1.0 — JUEGO COMPLETO

Integración final de todos los sistemas.

- Corregir errores.
- Equilibrar economía.
- Mejorar presentación.
- Optimizar carreras.
- Comprobar persistencia.
- Mejorar experiencia del jugador.
- Finalizar contenido.
- Preparar distribución.

El plan es una guía, no una excusa para entregar únicamente una lista de próximas funcionalidades.

---

# 38. REGLAS ESTRICTAS PARA PROGRAMAR

Estas reglas son obligatorias.

### REGLA 1
Nunca reemplaces sistemas funcionales por versiones más simples sin justificación técnica.

### REGLA 2
No elimines funcionalidades implementadas al añadir otras.

### REGLA 3
No generes botones decorativos que aparenten tener funciones.

### REGLA 4
No uses resultados predeterminados para aparentar que existe una simulación.

### REGLA 5
Cada transacción deberá actualizar correctamente el dinero y los inventarios involucrados.

### REGLA 6
Cada personaje y vehículo deberá tener un identificador único persistente.

### REGLA 7
La interfaz deberá reflejar el estado real del juego.

### REGLA 8
No deben duplicarse vehículos, pilotos, pagos ni recompensas por errores al guardar, cargar o actualizar la interfaz.

### REGLA 9
No agregues sistemas que dependan de recursos externos inexistentes.

### REGLA 10
No entregues código incompleto, pseudocódigo ni funciones vacías presentadas como terminadas.

### REGLA 11
Evita pantallas negras, errores de JavaScript y botones sin respuesta.

### REGLA 12
Comprueba que la partida pueda guardarse, cerrarse y retomarse correctamente.

### REGLA 13
Mantén separadas la simulación, los datos y la presentación gráfica.

### REGLA 14
Antes de modificar sistemas existentes, revisa sus dependencias.

### REGLA 15
No consideres una fase terminada hasta comprobar sus funciones principales mediante pruebas.

---

# 39. PRUEBAS NECESARIAS

Antes de entregar cada versión, verifica escenarios completos.

**Prueba A — Contratación**

El jugador recibe un currículum, negocia, contrata un piloto y comprueba que aparece en su plantilla y que su contrato afecta las finanzas.

**Prueba B — Mercado**

El jugador compra un vehículo y comprueba que desaparece de la oferta, pasa a su garaje y disminuye su saldo.

**Prueba C — Taller**

El jugador compra una pieza compatible, la instala y comprueba que modifica el comportamiento del coche.

**Prueba D — Carrera**

El jugador inscribe un vehículo, observa la carrera, utiliza órdenes, termina la competición y recibe un resultado coherente.

**Prueba E — Rivales**

Una empresa rival contrata un piloto, paga su salario y lo utiliza en una carrera posterior.

**Prueba F — Noticias**

Un acontecimiento empresarial genera una noticia que permite consultar la entidad afectada.

**Prueba G — Guardado**

El jugador guarda su partida, cierra el juego, vuelve a cargarla y conserva el estado empresarial completo.

**Prueba H — Contrato de patrocinio**

El jugador firma un acuerdo que exige utilizar a cierto piloto. Si incumple las condiciones, se aplican las consecuencias establecidas.

**Prueba I — Evolución temporal**

El jugador avanza una temporada y se procesan correctamente competiciones, contratos, salarios y cambios empresariales.

**Prueba J — Bancarrota**

Cuando una compañía no puede afrontar sus obligaciones, el sistema aplica las consecuencias correspondientes.

También debes probar operaciones repetidas, inventarios llenos, contratos vencidos, guardados antiguos y otros casos límite.

---

# 40. LO QUE NO QUIERO

No quiero:

- Un juego de únicamente presionar botones.
- Carreras representadas solo con números.
- Coches que sean todos iguales.
- Un mercado de compra infinita.
- Rivales con dinero infinito.
- Pilotos sin personalidad.
- Patrocinadores que solo entregan dinero.
- Noticias sin consecuencias.
- Una economía irrelevante.
- Progresión demasiado rápida.
- Vehículos que nunca se desgastan.
- Un taller exclusivamente estético.
- Campeonatos que no evolucionan.
- Partidas que pierden el progreso.
- Interfaces confusas.
- Sistemas incompletos presentados como funcionales.

Quiero que cada mecánica tenga una razón para existir.

---

# 41. PRIORIDADES DEL PROYECTO

Si debes elegir entre implementar muchas funcionalidades superficiales o menos funcionalidades profundas, prioriza la segunda opción.

Orden de prioridades:

**PRIORIDAD MÁXIMA**

1. Juego estable y jugable.
2. Economía coherente.
3. Mundo persistente.
4. Inteligencia artificial empresarial.
5. Carreras visuales funcionales.
6. Pilotos con características individuales.
7. Vehículos y modificaciones.
8. Progresión lenta y equilibrada.

**PRIORIDAD ALTA**

9. Contratos profundos.
10. Patrocinadores con condiciones.
11. Periódico dinámico.
12. Relaciones empresariales.
13. Instalaciones.
14. Empleados.
15. Mercado.

**PRIORIDAD DE AMPLIACIÓN**

16. Investigación avanzada.
17. Evolución histórica.
18. Coleccionismo.
19. Archivo histórico extenso.
20. Mayor variedad de acontecimientos.

Las prioridades no significan eliminar las funcionalidades restantes, sino incorporarlas progresivamente.

---

# 42. INSTRUCCIÓN FINAL

Quiero que actúes como un desarrollador principal de videojuegos especializado en simuladores de gestión.

Debes tomar decisiones técnicas inteligentes para construir un juego profundo, estable, entretenido y ampliable.

No quiero que respondas solamente explicando cómo podría desarrollarse.

**QUIERO QUE DESARROLLES EL PROYECTO REAL.**

Comienza implementando la versión 0.1, pero prepara una arquitectura que permita incorporar todas las mecánicas descritas.

La versión 0.1 debe ser una experiencia jugable real, con una primera temporada que pueda completarse.

No intentes fingir que has terminado las versiones posteriores.

Si trabajas dentro de un repositorio existente, inspecciónalo antes de modificarlo y conserva todo aquello que ya funcione.

Si comienzas desde cero, crea una estructura ordenada.

Cada vez que completes una versión:

1. Entrega los archivos funcionales.
2. Explica brevemente qué mecánicas están implementadas.
3. Identifica cuáles siguen pendientes.
4. Ejecuta o describe las pruebas realizadas.
5. Corrige los errores detectados.
6. Mantén compatibilidad con el progreso guardado cuando sea posible.

No sustituyas trabajo pendiente por interfaces vacías.

**EL OBJETIVO FINAL ES QUE EL JUGADOR SIENTA QUE ADMINISTRA UNA COMPAÑÍA AUTOMOVILÍSTICA REAL DENTRO DE UN MUNDO QUE SIGUE EVOLUCIONANDO CON O SIN ÉL.**

Cada coche tendrá una historia.

Cada piloto tendrá aspiraciones.

Cada empresa rival tendrá sus propios problemas.

Cada temporada traerá nuevas oportunidades.

Y cada decisión podrá acercar al jugador a la cima o llevar a su compañía a la bancarrota.

**COMIENZA EL DESARROLLO DE RACING COMPANY SIMULATOR.**