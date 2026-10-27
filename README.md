# Racing Company Simulator · 0.1

Una primera temporada jugable de gestión automovilística. HTML, CSS y JavaScript sin dependencias de ejecución, recursos remotos, cuentas ni conexión permanente. No conduces el coche: diriges la empresa y das órdenes a tu piloto.

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
- Un coche inicial y siete equipos rivales con vehículos y pilotos distintos, recursos finitos, gastos e inventarios persistentes. Reponen un asiento vacío si pueden pagarlo. **Esto no constituye la IA empresarial completa de la 0.2**.
- Pilotos con 12 atributos, rasgos, potencial oculto, contratos, descanso, formación básica y experiencia de carreras.
- Copa Club con seis circuitos/rondas, clasificación de equipos y pilotos, resultados e historial de temporadas.
- Simulación visual de paso fijo: aceleración según potencia/peso, frenada anticipada, velocidad de curvas, habilidades, tráfico y líneas de adelantamiento, ritmo, desgaste y pequeños incidentes dependientes del riesgo. Cámara de circuito y seguimiento.
- Periódico de hechos reales del estado de juego, con enlaces a sus entidades y un archivo limitado.
- Cinco partidas, guardado automático/manual, exportación/importación JSON, validación de formato/versión/entidades, checksum y copia anterior por ranura. Una carrera en curso se guarda con sus participantes y RNG, sin pagar recompensas de nuevo al cargar.

Los nombres de coches son referencias descriptivas. Todas las ilustraciones, circuitos, retratos e identidades son dibujos originales generados localmente con SVG/Canvas. Las cifras son **parámetros de juego**, no datos certificados de fabricantes. Los circuitos son ficticios. No se usan logotipos oficiales.

## Guardados

Se usa `localStorage`: el volumen de la 0.1 no requiere IndexedDB. El historial de noticias tiene 200 entradas; cada compañía conserva 600 movimientos recientes, además de acumulados; cada coche conserva 30 hechos. Las temporadas anteriores conservan resúmenes, no pasos de física. El checksum detecta corrupción accidental, no es una firma criptográfica ni un sistema antitrampas.

El navegador guarda por origen y perfil. Si bloquea el almacenamiento o se alcanza su cuota, se informa del fallo; exporta JSON. Borrar los datos del navegador elimina también las partidas y sus copias. No hay almacenamiento en servidor. Una versión desconocida se rechaza sin alterar el guardado; las migraciones se añadirán al cambiar el esquema, manteniendo importaciones existentes cuando sea posible.

## Verificar

```sh
npm test
```

Pruebas del motor con el runner incluido en Node: negociación, duplicados, capacidad, vencimientos, gastos y nóminas, revisiones, neumáticos, bloqueo de fechas, órdenes, determinismo a diferentes velocidades, reanudación en carrera, temporada completa, contabilidad rival, noticias, corrupción/recuperación y bancarrota.

Comprobación opcional de navegador con Playwright disponible y el servidor iniciado:

```sh
node tests/browser-smoke.cjs
```

`CHROMIUM_PATH` permite seleccionar el ejecutable y `GAME_URL` el servidor. Este script necesita el paquete de pruebas `playwright`; el juego y `npm test` no lo necesitan. El entorno de desarrollo ya lo proporciona. Capturas y una partida exportada se escriben en `test-results/` (ignorado por Git). El recorrido usa la UI para fundar, dibujar, negociar, inscribirse, dar órdenes y recargar; completa las seis rondas con la API del mismo motor para evitar esperar todas las vueltas en tiempo real. Además comprueba exportación/importación y siete pantallas a 1440, 1024 y 390 px. La apertura `file://` se marca como omitida si la política del navegador la bloquea.

Consulta [la arquitectura](docs/ARQUITECTURA.md), [el plan por versiones](docs/ROADMAP.md) y [la especificación original](docs/ESPECIFICACION.md).
