# Registro de sesiones

Formato definido en `MANTENIMIENTO.md`. Más reciente arriba.

---

## Sesión 2026-09-20 — La foto de la anotación, en el cerro

### Estado al inicio

Ya se podían marcar anotaciones con foto desde la computadora: elegir el punto
sobre la foto satelital, ponerle ícono, comentario y foto. Pero la foto se
mostraba desde internet, así que **en el cerro no se veía**, que es justo el
único lugar donde sirve.

### Lo que se hizo

**La foto baja con el mapa del sector.** Cuando el usuario baja el mapa de un
sector bajan también las fotos de las anotaciones de ese sector, y quedan en el
celular. En la navegación se tocan los puntos del mapa y se abre la ficha con la
foto y el comentario. La foto se lee del celular: nunca de internet.

**Una foto que falla no traba el mapa.** Sector en verde quiere decir que se
puede navegar con fondo, y eso no se toca. Si una foto no entra, el sector queda
bajado igual y se dice cuántas faltan y por qué.

**Una foto agregada después también se sabe en casa.** Cada mapa bajado se
acuerda de qué fotos trajo. Si a un sector ya bajado le agregan una foto, la
ruta y el sector lo dicen con un botón para bajarla. En el cerro no hay
sorpresas.

**Se encontró y se arregló un bug que afectaba a toda la app.** Cerrar cualquier
cartel con la X le pedía al navegador volver atrás, y eso rearma la pantalla
entera: el mapa se destruía y **el toque siguiente se perdía**. Se encontró
abriendo la app en un navegador de verdad y tocando dos anotaciones seguidas.
Ver R18.

**Se borró una pantalla de prueba que había quedado publicada.**

**Dos fallas más, encontradas por Ale en producción.** En el celular el fondo
del mapa no se dibujaba —faltaba la receta de los íconos para pantalla de alta
densidad, que ahora se arma sola en cada compilación— y desde Windows no se
podía subir un archivo de ruta, porque la app le creía al navegador cuando decía
que un `.gpx` era «un archivo cualquiera». Ver R19 y R20. Las dos tienen la
misma forma: **no se ven desde donde se desarrolla.**

**La pantalla negra del cerro.** Ale avisó que, sin señal, abrir el detalle de
una zona dejaba la app en negro con el ícono en el medio, sin poder hacer nada.
Reproducido en el navegador, eran dos fallas encadenadas y la más grave no era
la que se veía: **la app no guardaba nada**, porque uno de los tres archivos del
motor offline se iba a la pantalla de entrar y el motor se caía al arrancar, en
silencio. Con señal se veía perfecta. Ver R21 y R22.

### Decisiones tomadas

- `019` — La foto de la anotación viaja con el mapa del sector, no con el
  paquete: lo que pesa lo elige el usuario.

### Riesgos

- **R18 nuevo y resuelto:** cerrar un cartel rompía el mapa y se perdía el toque
  siguiente. Segundo caso, después de R17, de un problema que ninguna prueba
  automática veía y que se encontró **abriendo la app y mirando**.
- **R19 y R20 nuevos y resueltos:** el fondo del mapa no se dibujaba en el
  celular, y desde Windows no se podía subir un archivo de ruta.
- **R21 y R22 nuevos y resueltos:** la app no guardaba nada para usar sin señal,
  y la tapa del arranque no se destapaba nunca cuando una pantalla fallaba.

### Lo que queda

- El **mapa trucho**: el rompecabezas de fotos de Google Earth georreferenciadas
  para ver el terreno con detalle de verdad. Decidido que se hace.
- Probar en **modo avión** con el celular.
- Las **curvas de nivel** desde el modelo de elevación de 5 metros de IDECOR.
- El **satelital para bajar**: hoy solo baja el mapa simple.

---

## Sesión 2026-09-19 — Los mapas se bajan de verdad

### Estado al inicio

El mapa era un fondo vacío: la app dibujaba la línea de la ruta y el punto del
GPS sobre nada. Estaba decidido de dónde saldría el mapa (decisión 007) pero no
existía ni el mecanismo ni la pantalla.

### Lo que se hizo

**Bajar el mapa de un sector, de punta a punta.** Se recortan del archivo
mundial solo los pedazos del rectángulo del sector y quedan en el celular.
Medido contra el archivo de verdad: un sector de sierra son 84 pedazos, 1 MB y
6 segundos. Una zona entera, 3292 pedazos — por eso existen los sectores.

**Dos cosas cambiaron la arquitectura y se supieron probando, no leyendo:** el
archivo del mundo no le entrega pedazos a un navegador, así que el servidor de
TrackApp hace de puente; y su nombre cambia todos los días, así que la dirección
se busca en vez de escribirse. Ver decisión 017.

**El motor offline no abría ni una pantalla en modo avión.** La configuración
decía, para toda pantalla, «traela siempre de internet». Se reescribió entera
tomando como molde la de Vías de Escalada. Es el hallazgo más grave de la
sesión y no tenía nada que ver con los mapas.

**Once alertas críticas de seguridad**, dos de ellas de ejecución de código sin
estar logueado, cerradas al actualizar el framework.

### Decisiones tomadas

- `017` — Cómo llega el mapa al celular: el servidor hace de puente, no se aloja
  nada, la dirección se busca, y las letras del mapa viajan adentro de la app.

### Riesgos

- **R1, R2 y R11 resueltos.** Borrar libera el espacio de verdad y no se lleva
  el mapa del vecino; acercarse de más agranda en vez de quedar en blanco; las
  pantallas se enteran solas de lo que se bajó.
- **R14 nuevo, y bajado de crítico a deuda:** la librería que hace andar la app
  sin señal está abandonada desde 2022. Vías de Escalada usa la misma versión
  sobre el mismo framework y funciona, así que no es un incendio.
- **R15 nuevo y resuelto:** la app no abría ni una pantalla sin señal.

### Lo que queda

- Probar en **modo avión**. Es la única prueba que vale y no se puede
  automatizar.
- Las **curvas de nivel** desde el modelo de elevación de 5 metros de IDECOR,
  que se verificó que cubre toda la sierra (decisión 013).
- El **satelital**: lo mejor libre para la sierra son 10 metros por píxel. Se
  ven bosques y lagos, no senderos. Se construye después del simple.

---

## Sesión 2026-09-18 — Cimientos: reglas base del proyecto

### Estado al inicio

Andamiaje de documentación creado el día anterior. Faltaban las reglas de
fondo que gobiernan todo el proyecto.

### Lo que se hizo

Se cerraron cinco reglas base que no dependen de decisiones funcionales:

- **Red de seguridad:** ninguna función crítica se entrega sin prueba
  automática. Es el único mecanismo que le avisa a Ale que algo se rompió sin
  que tenga que leer código.
- **La ubicación es dato sensible:** por defecto se usa y se descarta.
  Guardarla requiere decisión explícita y escrita.
- **Cómo habla la app:** voseo, directo, errores que dicen qué pasó y qué hacer.
- **Un concepto, una palabra:** todo en español, pantalla y código. Glosario
  como fuente.
- **Entender antes de tocar:** método obligatorio ante un error, con
  explicación a Ale en criollo antes de arreglar.

Se fijaron las tres categorías de usuario, **sin permisos**.

### Decisiones tomadas

- `004` — Tres niveles de usuario (permisos deliberadamente sin definir)
- `005` — Pruebas automáticas como red de seguridad
- `006` — Sin tratamiento de dato sensible. Ale lo descartó: la app funciona
  sobre confianza total. Se quitó la regla de ubicación de las reglas base.

### Reglas agregadas en la segunda pasada

Al revisar contra Vías de Escalada aparecieron cinco cosas que se habían
salteado y que sí son cimiento:

- **Navegar sin señal:** sin señal la navegación interna deja la pantalla en
  blanco si no se usa la pieza compartida de navegación. Lección aprendida a los
  golpes en el otro proyecto.
- **Red de rescate cuando una pantalla revienta**, que no se borra nunca.
- **Separación de capas:** lógica, datos y pantalla en lugares distintos. Un
  componente de pantalla no consulta la base por su cuenta.
- **Tope de 1000 filas de la base:** devuelve la lista cortada sin avisar. En el
  otro proyecto dejó 202 rutas invisibles durante meses.
- **Checklist obligatoria de once puntos para toda pantalla nueva**, que es el
  mecanismo que hace cumplir el resto de las reglas.
- **Botones con variantes definidas y un solo rojo para borrar.**

### Corrección de rumbo

Se intentó definir los permisos de cada categoría de usuario. **Fue un error:**
los permisos son consecuencia de funciones que todavía no existen. Se registró
la categorización sin permisos y se dejó el resto para cuando la app esté
definida funcionalmente.

De ahí sale una regla general: **no se toman decisiones funcionales antes de la
definición funcional**, ni se le piden a Ale disfrazadas de decisiones técnicas.

### Deuda e inconsistencias detectadas

- Sigue sin definirse «qué NO es la app». Se decidió que se deriva de lo que sí
  es, y por eso queda para después de la definición funcional.
- Falta elegir herramienta de pruebas.

### Pendientes para la próxima

**Ale describe funcionalmente cómo tiene que trabajar la aplicación.** Ese es el
siguiente paso acordado.

---

## Sesión 2026-09-17 — Análisis de mapas y arranque de la documentación

### Estado al inicio

App funcionando, sin documentación. Como reglas para agentes solo existían seis
líneas sobre Git y un archivo que ordenaba subir cambios sin pedir permiso. Cero
reglas de producto, diseño, UX u offline.

### Lo que se hizo

- Análisis completo de cómo funcionan los mapas y el sistema offline.
- Se confirmó que **nunca existió** mapa satelital ni de relieve, verificando
  todo el historial del proyecto.
- Se identificaron cuatro problemas y una limitación, registrados en `RIESGOS.md`.
- Se midió la app: 131 archivos, unas 9.100 líneas, 16 pantallas.
- Se revisó Vías de Escalada Córdoba como referencia de documentación y de
  modelo offline.
- Se borraron las reglas viejas y se escribió `AGENTS.md` desde cero.
- Se creó toda la estructura de documentación.

### Decisiones tomadas

- **Se refactoriza esta app, no se empieza un proyecto nuevo.** El stack ya es el
  correcto y lo que molesta es una porción acotada.
- **El código existente no es referencia de nada.** Fue un ejercicio de
  aprendizaje.
- Diseño para exterior → `decisiones/001`
- PWA ahora, empaquetado Android opcional al final → `decisiones/002`
- Modelo offline → `decisiones/003`, **abierta**

### Documentos creados

`AGENTS.md`, `CLAUDE.md`, y en `docs/`: `MANTENIMIENTO.md`,
`DISENO_EXTERIOR.md`, `ARQUITECTURA.md`, `RIESGOS.md`, `GLOSARIO.md`,
`SCHEMA.md`, `SESIONES.md`, más tres decisiones.

### Deuda e inconsistencias detectadas

- Sin acceso a la base de TrackApp. `SCHEMA.md` quedó sin verificar.
- Los valores de contraste y tamaño no fueron probados al sol.
- Las cuatro pantallas de módulos que no se analizaron siguen sin documentar.

### Pendientes para la próxima

1. Que Ale revise `AGENTS.md`, en especial la sección de Git.
2. Probar los valores de diseño al sol, con el celular en la mano.
3. Cerrar la decisión 003 sobre el modelo offline.
4. Conseguir acceso a la base para completar `SCHEMA.md`.

---

## Sesión 2026-09-19 — La app se reescribe entera sobre la base nueva

### Estado al inicio

La base de datos ya estaba rehecha desde cero y la mitad del código nuevo
escrito, pero la app **no compilaba**: quedaban doce pantallas —los formularios
de carga y edición, y las fichas de ruta y de zona— todavía apuntando al código
viejo que se había borrado.

Además había un solo juego de colores y ningún botón para cambiarlo, aunque las
reglas del proyecto piden dos modos desde el primer día.

### Lo que se hizo

**Mockup aprobado.** Se armaron cuatro pantallas de muestra en el lenguaje
visual actual —mismas tarjetas, mismo verde, mismo fondo— y Ale las aprobó sin
cambios. El campo donde se pega una coordenada se hizo funcionando de verdad
sobre el mockup, para poder probar la trampa del link de Google Maps.

**Los dos modos de color, de verdad.** Lo que lo impedía no era el botón: eran
34 pantallas que escribían los colores a mano. Ahora ninguna lo hace. Las dos
listas de variables tienen exactamente los mismos nombres, y **una prueba
automática verifica en cada cambio** que estén completas y que cada combinación
de texto y fondo llegue al mínimo de contraste, en los dos modos. Esa prueba
encontró tres colores que no llegaban, el verde del botón principal entre ellos.

**Las doce pantallas que faltaban.** Ninguna consulta la base: todas dibujan
desde lo guardado en el celular, así que la ficha de una ruta se abre en el
cerro. Para eso el paquete offline ahora guarda también el «qué llevar» y las
«complicaciones», que antes solo vivían en la base.

**El bloque de cobertura**, que aparece en la ficha de la ruta y también al
subirla, con sus tres estados. Como los archivos de mapa todavía no existen, lo
dice con esas palabras en vez de mostrar un botón que no funciona.

**Lint limpio por primera vez.** Había siete errores de antes. Se arreglaron de
fondo, no tapándolos.

### Decisiones tomadas

- **Navegar sin mapa: se avisa, no se bloquea** → `decisiones/014` (decidió Ale)
- **Los dos modos de color y la prueba que los sostiene** → `decisiones/015`
- El mockup de las pantallas nuevas queda aprobado tal cual.
- Dos mejoras de detalle que Ale había habilitado: el gris de las etiquetas
  quedó un punto más claro y el verde del botón principal un punto más oscuro.
  Los dos estaban por debajo del contraste que pide el propio proyecto.

### Documentos actualizados

`ARQUITECTURA.md` (reescrito entero: el anterior describía el código viejo y ya
era falso), `RIESGOS.md`, `GLOSARIO.md`, `DISENO_EXTERIOR.md`, más las
decisiones `014` y `015`.

### Deuda o inconsistencias detectadas

- **`GLOSARIO.md` se contradecía a sí mismo**: decía que la palabra definitiva
  es «ruta» y en el renglón siguiente prohibía usar «ruta». Era el resto de un
  renombre automático. Corregido.
- **`ARQUITECTURA.md` describía el código viejo entero.** Reescrito contra el
  código real.
- Riesgos nuevos anotados: nadie lleva todavía la cuenta de qué mapa está
  bajado (R11), sin señal no se sabe quién subió una ruta (R12), y el modo sol
  nunca se probó con sol de verdad (R13).
- Los riesgos R1 y R2 quedaron neutralizados, no resueltos: el código que los
  causaba se borró, pero vuelven solos el día que existan los archivos de mapa.
  Quedan anotados como requisitos de ese trabajo.

### Pendientes para la próxima

1. **Los archivos de mapa.** Es lo único grande que falta y lo que desbloquea
   descargar, borrar lo descargado y ver fondo en el cerro.
2. Probar el modo sol al sol, con el celular en la mano.
3. Las anotaciones sobre el mapa: la base y la lógica están, falta la pantalla
   para dibujarlas.
4. Empaquetado para Android, al final y si conviene.
