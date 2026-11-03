# 077 — Caminos desde una salida

Decisión de Ale, 2026-10-22.

En Marcas, el «+» suma una tercera forma de agregar, junto a «A mano» y «Traer
de afuera»: **«Desde una salida»**. Se elige una salida con archivo GPS, de
cualquier usuario, y su línea se abre como **borrador**. La ven solo quienes
pueden crear Caminos (Administrador y Premium), como el resto del «+».

**El mismo borrador sirve para «Traer de afuera»** (Ale, 2026-11-02): las
líneas de un KML/KMZ/GPX se comparan igual con los Caminos existentes (verde =
coincide; color de salidas = nuevo), se parten, se descartan y se crean de a
un pedazo. En Traer, una parte nueva también puede sumarse como **trazo**; en
Desde una salida solo como Camino. Los puntos del archivo se eligen aparte.

**La app propone, el usuario decide.** La app nunca confirma nada:

- Muestra el borrador **por encima** y, debajo, los Caminos que ya existen en
  una línea fina: se ven los dos, y el GPS no queda tapado (Ale, 2026-11-02).
  También se ven los **puntos y trazos** ya marcados, solo de referencia, para
  orientarse (Ale, 2026-11-02). Al elegir una parte, esa se marca con un halo y
  las demás se atenúan. Al pasar el cursor por un tramo aparece qué parte es;
  al tocarlo, la tarjeta de esa parte sube sola en el panel (Ale, 2026-11-02).
- Marca en verde las partes del borrador que van sobre un Camino existente.
  Una parte va sobre un Camino si el GPS se mantiene a menos de **20 m** de él
  (el pasillo) durante al menos 100 m; una escapada de menos de 40 m fuera del
  pasillo se toma como ruido del GPS. Medido con la salida
  Challenger-Reducción-San Fernando contra «Tramo Challenger»: 9 de cada 10
  puntos a menos de 12 m, y con pasillos de 15 a 40 m el resultado fue el mismo.
- El usuario corta la línea en partes, **une una parte con la de abajo en la
  lista** («Unir al siguiente tramo»; Ale, 2026-11-03: solo pega, sin mirar
  coincidencias), descarta partes (el desvío por error, el salto del GPS),
  mueve, agrega o quita puntos, y marca qué partes son Caminos nuevos. Nada se
  guarda hasta tocar Guardar.
- **Sin descripción automática** al crear (Ale, 2026-11-03): no se anota el
  nombre del archivo ni «desde la salida…».
- **Edición de puntos en PC** (Ale, 2026-11-03): sin los botones mover /
  agregar / quitar. Arrastrar mueve; clic izquierdo agrega o **alarga** el
  Camino más allá del extremo; clic derecho quita. En celular siguen las tres
  herramientas. Vale también al editar un Camino ya guardado.

Reglas:

- **Nunca modifica un Camino existente.** Lo que coincide queda como está.
- **Una parte que va sobre un Camino no puede ser un Camino nuevo**: sería uno
  repetido encima de otro. Si más de la mitad de una parte va en el pasillo de
  un Camino, se muestra con su nombre y no ofrece «Crear Camino».
- Cada parte nueva solo puede ser Camino o descartarse (no trazo): ya se
  circuló por ahí.
- Antes de editar, la línea se achica a los puntos que hacen falta para su
  forma (ninguno de los quitados queda a más de 3 m). Un GPS trae un punto por
  segundo y corregir miles a mano no se puede.
- Cuando una punta de una parte nueva queda a menos de 40 m de un Camino, la app
  propone pegarla a él para que queden conectados. El usuario lo tilda o no.
- Los Caminos nuevos llevan nombre y al menos una actividad, empiezan por
  explorar. Al crear, se eligen condición y complejidad en la misma tarjeta
  (Ale, 2026-11-02): desde una salida ninguna condición viene marcada (hay que
  elegirla); desde un archivo, «por explorar» viene marcado; la complejidad
  empieza sin elegir en ambos. La clasificación vale para todas las
  actividades del Camino nuevo. Su largo y sus alturas salen del relieve al
  guardar (decisión 049). Descartar una parte pide confirmación.

**Un Camino a la vez** (Ale, 2026-10-22). Al tocar «Crear Camino», esa parte se
vuelve la tarjeta de un Camino nuevo: título «Camino nuevo», nombre,
actividades propias de ese Camino, pegar puntas, y abajo Cancelar (siempre
pide confirmación) y Guardar, que guarda solo ese Camino. Mientras tanto las
demás partes no ofrecen crear otro y las herramientas trabajan sobre esa parte;
cortarla deja el Camino con la parte nueva (después del corte) y el otro
pedazo como otra parte. Fuera de «Crear Camino», al cortar también queda
elegida la parte nueva (Ale, 2026-11-01).

Al salir: si ya guardaste los Caminos y no queda nada pendiente ni un Camino
a medio crear, se sale sin cartel. El aviso de «sin guardar» solo aparece
cuando todavía hay algo sin guardar de verdad (Ale, 2026-11-01).

Fuera por ahora: vincular la salida con los Caminos que pisó y procesar las
salidas ya cargadas de forma masiva.

## Auditoría de fuentes

- Leído en tiempo real: instrucciones y respuestas de Ale, archivo GPS de la
  salida 15 y Caminos de la base, pantalla de Marcas y corrector de línea.
- Probado: la lógica con el GPS real (453 puntos tras achicar, cinco partes:
  dos sobre «Tramo Challenger», tres nuevas) y la pantalla en el navegador sin
  guardar Caminos.
- Pendiente: guardar un Camino de verdad desde la pantalla, que lo prueba Ale.
