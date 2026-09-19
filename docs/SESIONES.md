# Registro de sesiones

Formato definido en `MANTENIMIENTO.md`. Más reciente arriba.

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
