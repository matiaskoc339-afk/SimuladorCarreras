# Racing Company Simulator · 0.2

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
2. Selecciona **Sala de pilotos** en los edificios de la sede. Estudia los currículums y negocia salario, duración y prima. Las ofertas insuficientes reciben una contraoferta; insistir puede pausar la negociación.
3. Selecciona **Garaje** para consultar el Civic EP3, su estado y su historial. Las revisiones cuestan dinero y duran dos días; los neumáticos nuevos cuestan $160.
4. En **Estrategia**, inscribe a tu piloto y coche. Cada ronda cuesta $370 con transporte. Puedes hacerlo hasta la jornada de carrera.
5. Avanza día a día o hasta la próxima prueba. Cada día se procesan las mismas obligaciones. El calendario se detiene en las carreras: solo una renuncia confirmada permite no participar.
6. Observa el circuito en Canvas. Usa **Atacar / Equilibrado / Conservar**, cambia cámara y velocidad ×1 / ×2 / ×4, o pausa con el botón o la barra espaciadora. Los resultados no están predeterminados.
7. Completa las seis pruebas. Los premios, puntos de pilotos/equipos, kilometraje, fatiga, desgaste y reputación se registran al cruzar la meta. Al terminar recibirás una prima de clasificación y la temporada quedará archivada.
8. Puedes abrir la siguiente temporada. Se conserva el mundo y se contabiliza el descanso hasta el siguiente 5 de enero. Revisa los contratos que vencen.

**Oficina** contiene el libro de movimientos, previsión mensual, edición de identidad y encargos de taller. Cada encargo produce $360 netos en tres días, con un máximo de uno cada siete días. Comparte el taller con las revisiones.

## Alcance entregado

- Menú, creación de compañía, identidad y sede 2D interactiva.
- Calendario desde enero de 2026 y temporadas sucesivas.
- Salarios devengados por día y liquidados el día 1; primas, alquiler, gastos logísticos, servicios, reparaciones, premios y descubierto con 14 días de recuperación. La bancarrota termina la partida.
- Un coche inicial y siete equipos rivales con recursos finitos, flotas y plantillas persistentes. La IA de la 0.2 evalúa compras/ventas, fichajes/traspasos, revisiones, neumáticos, formación, encargos y reducción de gastos según personalidad, necesidad y reserva salarial.
- Pilotos con 12 atributos, rasgos, potencial oculto, contratos, descanso, formación básica y experiencia de carreras.
- Copa Club con seis circuitos/rondas, clasificación de equipos y pilotos, resultados e historial de temporadas.
- Simulación visual de paso fijo: aceleración según potencia/peso, frenada anticipada, velocidad de curvas, habilidades, tráfico y líneas de adelantamiento, ritmo, desgaste y pequeños incidentes dependientes del riesgo. Cámara de circuito y seguimiento.
- Periódico de hechos reales del estado de juego, con enlaces a sus entidades y un archivo limitado.
- Cinco partidas, guardado automático/manual, exportación/importación JSON, validación de formato/versión/entidades, checksum y copia anterior por ranura. Una carrera en curso se guarda con sus participantes y RNG, sin pagar recompensas de nuevo al cargar.

Los nombres de coches son referencias descriptivas. Todas las ilustraciones, circuitos, retratos e identidades son dibujos originales generados localmente con SVG/Canvas. Las cifras son **parámetros de juego**, no datos certificados de fabricantes. Los circuitos son ficticios. No se usan logotipos oficiales.

## Novedades de la 0.2

- **Compañías del paddock**, accesible desde la sede: consulta propietarios ficticios, personalidad, objetivo, caja, flotas, plantillas, movimientos y motivos de las últimas decisiones.
- **Mercado Club**, accesible desde el garaje o el paddock: seis unidades usadas iniciales y anuncios de las compañías. El stock es finito y se comparte con los rivales. Comprar retira el anuncio y transfiere la misma unidad con su ID e historial. Los pagos se abonan al vendedor; Club Usados conserva su saldo por separado.
- Selección entre los coches de tu garaje y publicación/retirada de anuncios, entre el 50 % y el 150 % de su valoración. Un anuncio ocupa su plaza hasta venderse. Las unidades anunciadas no se inscriben ni revisan. Es posible vender el último coche y recuperarse comprando otro: la sede continúa navegable.
- **Traspasos de pilotos**: las compañías pueden negociar sus reservas o buscar liquidez. Se compensan al vendedor, liquidan la nómina pendiente y conservan historial y puntos del piloto. El jugador puede negociar los pilotos disponibles desde su sala o expediente rival. La contratación libre de la 0.1 conserva sus contraofertas.
- Los rivales pueden presentar **ofertas por tus pilotos**. Aparecen en la sala y en el periódico, caducan a los siete días y requieren tu aceptación. El precio ofrecido se respeta al aceptar; las condiciones se revalidan si cambian los fondos o la disponibilidad. Los pilotos inscritos no se traspasan; ahora puedes retirar una inscripción sin reembolso.
- La IA preserva una reserva según personalidad, selecciona una acción por utilidad y registra su motivo. No conoce el potencial oculto. Los nuevos fichajes permanecen fuera del circuito automático de traspasos durante 60 días para evitar rotaciones diarias. El jugador mantiene la decisión sobre sus propios pilotos.
- Las compañías hacen encargos con el mismo plazo, coste de oportunidad y límites del jugador. Si quiebran, liberan sus pilotos y anuncian sus coches en liquidación; no vuelven a las carreras aunque después reciban ingresos por una venta.
- Las noticias comerciales abren el coche o piloto real y su propietario actual. Las operaciones empresariales y su historial persisten al guardar.

Este es el mercado **básico compartido de la 0.2**, no el mercado completo de la 0.7: siguen pendientes subastas, importaciones, fabricantes, piezas y negociación de precios. Los empleados, modificaciones, patrocinadores y relaciones avanzadas siguen su plan incremental.

## Guardados

Se usa `localStorage`: el volumen actual no requiere IndexedDB. El historial de noticias tiene 200 entradas; cada compañía conserva 600 movimientos recientes, además de acumulados; cada coche conserva 30 hechos. Las temporadas anteriores conservan resúmenes, no pasos de física. El checksum detecta corrupción accidental, no es una firma criptográfica ni un sistema antitrampas.

El navegador guarda por origen y perfil. Si bloquea el almacenamiento o se alcanza su cuota, se informa del fallo; exporta JSON. Borrar los datos del navegador elimina también las partidas y sus copias. No hay almacenamiento en servidor. El esquema actual es la versión 2: los guardados de la 0.1 (esquema 1) se validan y migran automáticamente sin cambiar sus coches, saldos, contratos, resultados ni la carrera en curso. Se añade una única vez el stock inicial del mercado y la gestión empresarial. Se conservan las claves locales de las cinco ranuras. Las versiones desconocidas se rechazan sin modificar el guardado.

## Verificar

```sh
npm test
```

Pruebas del motor con el runner incluido en Node: negociación, duplicados, capacidad, vencimientos, gastos y nóminas, revisiones, neumáticos, bloqueo de fechas, órdenes, determinismo a diferentes velocidades, reanudación en carrera, temporada completa, contabilidad rival, noticias, corrupción/recuperación y bancarrota.

Comprobación opcional de navegador con Playwright disponible y el servidor iniciado:

```sh
npm run test:browser
```

`CHROMIUM_PATH` permite seleccionar el ejecutable y `GAME_URL` el servidor. Estos recorridos necesitan el paquete de pruebas `playwright`; el juego y `npm test` no lo necesitan. El entorno de desarrollo ya lo proporciona. Capturas y una partida exportada se escriben en `test-results/` (ignorado por Git). El recorrido usa la UI para fundar, dibujar, negociar, inscribirse, dar órdenes y recargar; completa las seis rondas con la API del mismo motor para evitar esperar todas las vueltas en tiempo real. Además comprueba exportación/importación y siete pantallas a 1440, 1024 y 390 px. `tests/browser-business.cjs` añade mercado, traspasos con consentimiento, expediente de activos, garaje vacío y migración real de una partida 0.1, con nueve pantallas a esos tres tamaños. La apertura `file://` se marca como omitida si la política del navegador la bloquea.

Consulta [la arquitectura](docs/ARQUITECTURA.md), [el plan por versiones](docs/ROADMAP.md) y [la especificación original](docs/ESPECIFICACION.md).
