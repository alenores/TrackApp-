# 077 — Caminos desde una salida

Decisión de Ale, 2026-10-22.

En Marcas, el «+» suma una tercera forma de agregar, junto a «A mano» y «Traer
de afuera»: **«Desde una salida»**. Se elige una salida con archivo GPS, de
cualquier usuario, y su línea se abre como **borrador del GPS**. La ven solo
quienes pueden crear Caminos (Administrador y Premium), como el resto del «+».

**La app propone, el usuario decide.** La app nunca confirma nada:

- Muestra el borrador y, encima, los Caminos que ya existen en una línea fina:
  se ven los dos.
- Marca en verde las partes del borrador que van sobre un Camino existente.
  Una parte va sobre un Camino si el GPS se mantiene a menos de **20 m** de él
  (el pasillo) durante al menos 100 m; una escapada de menos de 40 m fuera del
  pasillo se toma como ruido del GPS. Medido con la salida
  Challenger-Reducción-San Fernando contra «Tramo Challenger»: 9 de cada 10
  puntos a menos de 12 m, y con pasillos de 15 a 40 m el resultado fue el mismo.
- El usuario corta la línea en partes, descarta partes (el desvío por error, el
  salto del GPS), mueve, agrega o quita puntos, y marca qué partes son Caminos
  nuevos. Nada se guarda hasta tocar Guardar.

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
  explorar y se clasifican después en su ficha, como al traer de afuera. Su
  largo y sus alturas salen del relieve al guardar (decisión 049).

Fuera por ahora: vincular la salida con los Caminos que pisó y procesar las
salidas ya cargadas de forma masiva.

## Auditoría de fuentes

- Leído en tiempo real: instrucciones y respuestas de Ale, archivo GPS de la
  salida 15 y Caminos de la base, pantalla de Marcas y corrector de línea.
- Probado: la lógica con el GPS real (453 puntos tras achicar, cinco partes:
  dos sobre «Tramo Challenger», tres nuevas) y la pantalla en el navegador sin
  guardar Caminos.
- Pendiente: guardar un Camino de verdad desde la pantalla, que lo prueba Ale.
