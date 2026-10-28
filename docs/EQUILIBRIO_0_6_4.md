# Equilibrio y variedad · 0.6.4

Esta entrega responde a la petición de mayor variedad, contratación clara y carreras difíciles pero justas. Las cifras son parámetros del juego, no precios ni homologaciones reales.

## Inicio y sueldos

- Caja inicial: **$4.200**, frente a los $12.000 anteriores. Un utilitario usado entre Corsa B, 106 Rallye, Ka, Yaris y Saxo VTR.
- Doce currículums iniciales: **valoración 10–25**, con diferencias entre los doce atributos. Edad 18–41, experiencia compatible con la edad y dieciséis temperamentos. Un candidato de baja valoración puede tener una especialidad útil y carencias claras.
- Sueldo de piloto por día: `(16 + valoración² × 0,072) × (1 + experiencia limitada a 20 × 0,013)`, con una pequeña prima juvenil. Por ejemplo, valoración 50 supone más de $5.000 en 30 días. La negociación y las cláusulas modifican el mínimo. La referencia de mercado se actualiza con el progreso de los atributos; un contrato firmado conserva el sueldo acordado.
- Sueldo de especialista: crece con `nivel^2,4`, habilidad, motivación y especialidad. Un ojeador NV 6 motivado supera $800 **por día**. Un principiante cuesta mucho menos y conserva su mayor riesgo de error.
- Se paga al avanzar cada jornada, incluido el descanso. La previsión de 30 días, las reservas y las indemnizaciones convierten correctamente el sueldo diario. No se cobra la nómina mensual además de la diaria.
- Contratos de 1, 3, 6, 12 y 24 meses. Prima al firmar; el nuevo formulario muestra coste inmediato, sueldo diario/30 días, gasto previsto y autonomía orientativa. Las cláusulas completas siguen en un desplegable.
- Perfiles de calidad alta requieren mayor nivel empresarial. Cada semana pueden llegar dos candidatos; la progresión/reputación eleva su calidad y los CV caducan sin borrar personas ni contratos. El ojeo profesional conserva sus informes imperfectos.

El encargo básico de taller ingresa **$420 netos** y ocupa una bahía durante su plazo real, como máximo uno cada siete días. No sustituye la necesidad de administrar gastos, premios, activos y patrocinios. Contratar a todos los especialistas disponibles al comenzar es insostenible.

Los rivales pagan con su caja: reservan nóminas y costes de las rondas restantes, priorizan encargos, renuevan con aumento y evitan liquidar su único coche antes de la insolvencia. Si necesitan reducir salarios, indemnizan al piloto caro y contratan un candidato libre real; no reciben dinero extra ni mejores atributos por ir perdiendo.

## Variedad visible

24 modelos y siete carrocerías: utilitarios, compactos, cupés, descapotables, targa, berlinas y familiares. Cambian medidas, contorno, ventanillas, techo, faros y acabados, tanto en fichas como en pista. Las doce familias de piezas tienen ilustraciones propias. Las mejoras físicas siguen vinculadas al inventario, compatibilidad, condición y montaje.

Los retratos combinan formas de cara, piel, peinado/color, ojos, nariz, boca, vello, gafas, edad, ropa y fondo. Usan una identidad persistente independiente del azar de la simulación. Nombres e identidades no se repiten dentro del mundo generado. La prueba genera 500 pilotos distintos; el generador procedural es finito y no promete unicidad infinita entre todas las partidas posibles.

## Carreras y desgaste

- Trazada anticipada de entrada/ápice/salida y orientación interpolada sobre la misma geometría métrica que usa la pista. Las ruedas delanteras muestran giro y contravolante.
- Ritmo, control, consistencia, frenada, adelantamiento, defensa, atención, resistencia, disciplina, cuidado de gomas, lluvia y trabajo en equipo tienen consecuencias. Edad y experiencia afectan ritmo, reacción, frenada y errores. El temperamento cambia los atributos y el riesgo; la fatiga aumenta durante la prueba.
- Los pilotos revisan huecos y tráfico previsto antes de cambiar de trazada. El rebufo, las órdenes, los neumáticos y el coche influyen en la posibilidad real de disputar una posición. No se aumenta potencia para fabricar un adelantamiento.
- Mayor desgaste de gomas y componentes. El agarre cae al agotarse los neumáticos; conservar reduce ritmo y consumo, atacar aumenta ritmo, desgaste y riesgo. Puede convenir una parada, cambiar por lluvia o intentar un stint largo con gomas resistentes.
- **17 opciones de neumático**: calle, cuatro compuestos de entrada y doce variantes de Fortis Endurance, Vértice Racing y Nómada Sport. Las marcas tienen compromisos de agarre, duración y precio. Las existencias, la reserva, el pago y el desgaste de cada juego son reales.
- La previsión de vueltas es una referencia en seco y ritmo normal hasta el 22 % de condición; fatiga, conducción, clima e incidentes la cambian. No es una garantía de terminar sin parar.
- Errores graduados: pequeñas correcciones, derrapes y, con menor frecuencia, trompos. Los contactos mantienen daño y consecuencias. No existe una cuota de accidentes por carrera.
- Público, edificios y paddock se colocan comprobando toda su huella contra todos los tramos del circuito y el carril de boxes. Una salida de pista es distinta de dibujar mal la trazada.

## Guardados y alcance

Las partidas nuevas llevan `challenge.version = 1` y las nuevas carreras correspondientes, `dynamicsVersion = 1`. Los guardados previos conservan sus contratos, economía y física de carrera anteriores; las imágenes mejoran en todos. No se convierte silenciosamente un salario mensual ya acordado a salario diario. El sobre sigue en esquema 3. Una fixture auténtica de carrera 0.6.3 reproduce exactamente sus resultados y estado final.

Se verifica el motor actual, además de las regresiones históricas, con pruebas de salarios reales, generación, decisiones físicas comparadas, marcas/desgaste, geometría, reanudación determinista y navegador a 1440/1024/390 px. `npm run test:balance` recorre seis carreras y un año de caja con el piloto más barato, encargos y servicio manual, sin añadir capital ni alterar resultados. Es una estrategia de supervivencia reproducible, no una demostración de equilibrio a décadas.

La simulación sigue siendo 2D. Las categorías superiores, academia, I+D, subastas, editor completo de libreas y las demás mecánicas pendientes del prompt original siguen en el análisis; esta entrega mejora el juego disponible.
