# Casa de subastas · 0.10.0

El apartado **Subastas** tiene dos entradas principales: **Ver subastas** y **Subastar mis objetos**. Una empresa nueva mantiene sus 4200 US$ iniciales; los lotes exclusivos de la casa parten de al menos 6500 US$ para piezas y 50 000 US$ para coches. Puedes observar gratis antes de tener una economía que permita comprar.

## Sala en vivo

El presentador anuncia la salida. Hay doce participantes externos persistentes —coleccionistas, preparadores, restauradores y comerciantes— y pueden acudir hasta tres compañías reales de la competencia cuando su caja y capacidad lo permiten. Cada sala reúne una selección de cinco a siete participantes externos, además de los rivales interesados.

Sin primera oferta, la sala espera doce segundos y después cierra sin adjudicar. Al aceptar una oferta, comienza la cuenta de **10 a 0**. Cada paleta nueva reinicia los diez segundos. El presentador identifica al mejor postor y anuncia el siguiente importe; **Pujar** acepta exactamente ese importe. Si cambia antes de procesar el clic, debes revisar el nuevo precio. No puedes subir tu propia oferta ni pujar por un objeto que estás vendiendo.

Al llegar a cero, gana la última oferta. Se cobra una sola vez al adjudicar y se entrega la unidad. Mientras tu puja es la más alta, el dinero y la plaza necesarios quedan comprometidos. **Retirarte no anula una oferta vigente**: si nadie la supera, compras igualmente. La salida de la sala resuelve las ofertas restantes de la IA y muestra el resultado, sin obligarte a esperar como espectador.

El calendario de la empresa se detiene durante la sala y vuelve a estar disponible al cerrar. Guardar/cargar conserva postores, ofertas, cuenta atrás y RNG de la subasta. El tiempo no avanza con la aplicación cerrada ni con la pestaña oculta; al volver, continúa. La puja no depende de la velocidad de la carrera.

## Objetos y variedad

- **40 familias de piezas exclusivas**, con ediciones individuales: admisiones, escapes de titanio, centralitas, refrigeración, embragues, diferenciales, suspensión, frenos, gomas, aerodinámica, aligerados, carrocerías, motores por etapas, refuerzos y llantas. El catálogo ordinario conserva sus 29 referencias.
- Las variantes combinan fabricante ficticio, serie, acabado, plataforma cuando corresponde, estado, parámetros técnicos y certificado individual. Los mismos modelos o familias pueden volver en otras ediciones; no se recicla el lote ni su certificado.
- **12 plataformas adicionales reservadas a subastas**: siete modelos modernos de 2025/2026 y cinco plataformas históricas de distintas épocas/configuraciones, con clásicos y homologaciones. El conjunto completo incluye 76 modelos; los 64 anteriores siguen en el mercado ordinario. Las marcas nuevas son ficticias.
- Coches originales de colección y **coches ya preparados**, con carrocería, refuerzos, llantas, frenos, refrigeración y, cuando corresponde, motor instalado. La ficha permite inspeccionar la preparación antes de entrar.
- Las carrocerías muestran su modelo y acabado, y los coches/paneles exclusivos conservan detalles visuales en taller, garaje y carrera. Las piezas usan los mismos efectos físicos, requisitos y desgaste del taller. Ser exclusivo no garantiza cumplir el reglamento ni ganar una carrera.

La casa publica **ocho lotes nuevos cada siete días**, seis de piezas/carrocerías y dos de coches. Las piezas se entregan al almacén y requieren montaje pagado por días; los coches preparados se entregan con sus unidades reales instaladas. No aparece una copia del objeto al recargar o inspeccionar. Los lotes no visitados se resuelven con IA al vencer; los no adjudicados se archivan.

## Vender desde el inventario

Elige una pieza libre o un coche propio y establece la salida entre el 50 % y el 150 % de la valoración, con mínimo de 100 US$. Se muestra cuánto recibirías si se adjudica por ese precio. Puedes tener hasta cuatro lotes propios pendientes.

Consignar no cobra una tarifa. La unidad sigue siendo tuya y ocupa su plaza mientras está pendiente. Una pieza instalada debe desmontarse primero; tampoco se admiten piezas reservadas para montaje ni coches en reparación, anunciados, inscritos o entrenando. Los objetos consignados quedan bloqueados frente a otros usos o ventas.

Puedes retirar el lote sin coste **antes de abrir la sala**. Una vez iniciada, se adjudica o queda sin ofertas. Puedes observar la disputa por tu objeto; si no entras, se resuelve al vencer dentro de siete días.

Al vender, el comprador paga el precio completo. Tu empresa recibe **el 80 %**, redondeado a dólares enteros, y la casa retiene el resto como comisión. Si nadie ofrece la salida, conservas el objeto y no se cobra comisión. La pieza o coche mantiene su identificador, piezas montadas, kilometraje y desgaste al cambiar de dueño. Los movimientos se registran en las finanzas y en las adjudicaciones.

## Decisiones de la IA y contabilidad

Los participantes no conocen el saldo del jugador ni un supuesto límite de puja suyo. Valoran el objeto según especialidad, afinidad, antigüedad, utilidad para su equipo y una estimación propia. Hay comerciantes que buscan margen, restauradores interesados en clásicos y coleccionistas dispuestos a pagar una prima. La impaciencia, espera y rivalidad de la disputa varían por participante. Algunos pujan tarde; otros abandonan antes. La competencia puede elevar el precio por encima de la estimación o dejar una oportunidad a buen precio.

Cada postor tiene un límite y dinero real. Las compañías rivales reservan caja para operación y catorce días de nóminas, respetan capacidad y pagan desde su mismo libro financiero. Pueden instalar las piezas adjudicadas usando sus propias bahías y presupuestos. Los participantes externos tienen cartera, compras y gasto persistentes; reciben ingresos semanales de su actividad de colección/comercio y no disponen de financiación ilimitada por sala.

La casa contabiliza ingresos brutos, pagos a vendedores y saldo. Cuando gana un coleccionista, la propiedad queda identificada fuera del mercado ordinario: sus objetos no aparecen como repuestos baratos del proveedor. El jugador ve postores y comportamiento, sin sus valoraciones ni límites privados.

## Actualización y comprobaciones

Las partidas nuevas incluyen el apartado. En una empresa 0.9, abre **Subastas**: se añade la casa sin alterar caja, contratos, RNG del mundo, reparaciones o investigación. Las empresas anteriores disponen del botón de activación; conservan su reglamento y reciben coches compatibles con él. Una carrera en curso se termina primero.

El RNG de subastas está separado del mundo y queda guardado. Las definiciones de piezas exclusivas `auc1` se reconstruyen de forma determinista; no se añaden al proveedor normal. Las fixtures de una carrera 0.9 con carrocería ancha, capturadas antes del cambio, comprueban resultado y estado final exactos sin activar subastas.

- `npm run test:auctions`: veinte escenarios de motor, incluidas transacciones reales, reloj, reservas, devoluciones, IA rival y de coleccionista, montaje, varias rotaciones, gangas/sobreprecios, reanudación y guardados corruptos.
- `npm run test:browser`: añade `browser-auctions.cjs`, con observación sin fondos, reloj real, puja, recarga, compra, montaje, consignación desde formulario, 80 % neto, retirada y tres anchuras de pantalla. La primera observación usa la caja inicial; después se controla el presupuesto para revisar compras caras, sin presentarlo como prueba de equilibrio.
- `npm run test:balance`: temporada actual con subastas de fondo, matrículas, salarios, formación e investigación desde caja real. La ruta prudente no compra objetos de lujo en su primera temporada. `test:balance:v90` conserva la ruta anterior.

Esta entrega completa las subastas de objetos. Importaciones, coleccionistas como mercado negociado aparte, fusiones, patentes y editor de libreas mantienen su alcance pendiente.
