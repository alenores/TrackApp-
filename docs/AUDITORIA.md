# Auditoría del trabajo hecho — 2026-09-19

> **Estado: arreglada.** Todo lo que sigue quedó corregido el mismo día, salvo
> los dos puntos marcados `PENDIENTE`, que esperan una comprobación contra la
> base que solo puede hacer Ale.
>
> Durante los arreglos aparecieron **tres hallazgos más** que la primera pasada
> no había visto: están al final, como G6, G7 y G8.

> Pedida por Ale después de descubrir que 34 pantallas escribían los colores a
> mano. La pregunta de fondo era: **¿qué más hay mal que no salió a la luz?**
>
> Esto no es una opinión. Cada punto se midió contra una regla escrita de
> `AGENTS.md` y tiene abajo cómo se comprobó.

---

## Qué se auditó

Las trece reglas de `AGENTS.md` que se pueden medir sobre el código, aplicadas a
todo el repositorio: el código que escribí yo en esta sesión y el que quedó del
proyecto viejo sin que lo tocara.

## El resumen

**Ocho hallazgos graves y cinco medios.** Cinco los encontró la auditoría; los
otros tres aparecieron arreglando los primeros, que es lo habitual: al abrir una
puerta se ven las de al lado.

De los ocho graves, **cinco son míos** y tres vienen del código viejo que dejé en
pie sin revisar — que, en los hechos, también es mío: se me pidió expresamente no
dejarme llevar por lo anterior.

---

# GRAVES

## G1 — Los carteles de confirmar y avisar son del sistema operativo

**La regla.** «Nada del sistema operativo en pantalla. Los carteles de confirmar
y avisar los dibuja la app. Prohibido `window.confirm`, `window.alert` y
`window.prompt`.»

**Qué pasa.** La pieza que dibuja esos carteles **existe pero nunca se conectó a
la app**. Como no está conectada, todo el que la pide cae a un respaldo que usa
justamente los carteles del sistema.

En criollo: **hoy, cada «¿Borrar esta ruta?» de la app es un cartel gris de
Android.** No el de la app.

**Lo peor.** El archivo que hace eso tiene escrito arriba, en su propio
comentario, que eso está prohibido. Se contradice a sí mismo, igual que el
glosario que decía que la palabra es «ruta» y en el renglón siguiente prohibía
«ruta».

**De quién es.** Mío. Escribí las dos piezas y no conecté una con la otra.

**Cómo se comprobó.** Se buscó dónde se pone el proveedor en toda la app: está
definido en un solo archivo y no se usa en ninguno.

---

## G2 — La pantalla de Perfiles puede estar rota y callada

**La regla.** «Ninguna falla termina en pantalla vacía sin cartel» y «un error
atrapado que no se muestra es una falla invisible».

**Qué pasa.** Esa pantalla pide primero una función de base de datos y, si falla,
cae a un respaldo que consulta **la tabla `profiles` y las columnas `user_id` y
`subido_por_nombre`**. Todo eso es de la base vieja. La base nueva tiene
`perfiles`, y no tiene esas columnas.

Si nada de eso existe, la consulta falla, el respaldo devuelve lista vacía y la
pantalla muestra «no hay usuarios» sin decir que hubo un error.

**Estado: PENDIENTE DE VERIFICACIÓN.** No tengo acceso en tiempo real a la base
de TrackApp por MCP (solo veo la de Vías de Escalada). **No lo doy por cierto
hasta que Ale corra la consulta de comprobación.**

**De quién es.** Del código viejo. Pero lo dejé en pie sin mirarlo, que es
exactamente lo que se me pidió no hacer.

---

## G3 — El cálculo que dispara «Fuera de ruta» no tiene ninguna prueba

**La regla.** «Ninguna función de la que dependa la seguridad del usuario se
entrega sin una prueba automática que la cubra.»

**Qué pasa.** La función que mide a qué distancia estás de la línea del
recorrido, y que decide cuándo avisarte que te desviaste, **no tiene una sola
prueba**. Es, de lejos, la función de la que más depende la seguridad de alguien
caminando en el cerro.

Está escrita en inglés, tal cual la dejó el código viejo. No la toqué.

**De quién es.** Del código viejo, y mío por no haberla revisado. Escribí pruebas
para la cobertura, las coordenadas y los colores, y dejé sin prueba justamente la
más crítica.

---

## G4 — El traer listas por tandas no tiene prueba

**La regla.** «La base devuelve como máximo 1000 filas por respuesta y no avisa.
Verificar antes de dar por buena una descarga.»

**Qué pasa.** La pieza que trae las listas por tandas y avisa si vinieron
cortadas no tiene prueba. Es la regla que existe **por los 202 tramos que
quedaron invisibles durante meses en Vías de Escalada**, sin un solo cartel.

**De quién es.** Mío. Escribí ese archivo en esta sesión.

---

## G5 — La lectura de archivos GPX y KML no tiene prueba

**La regla.** La misma de G3.

**Qué pasa.** La pieza que abre el archivo que subís y saca de ahí la línea del
recorrido no tiene prueba. Si lee mal un archivo, el largo y el desnivel salen
mal, se guardan mal y nadie se entera nunca: no hay con qué compararlos.

Sí tienen prueba los cálculos que se hacen **después** de leer el archivo. La
lectura en sí, no.

**De quién es.** Mío.

---

# MEDIOS

## M6 — Media app está en inglés

**La regla.** «Todo en español: lo que se ve en pantalla y lo que se escribe en el
código. Sin excepciones.» Y: «Cada concepto tiene una sola palabra en toda la
app.»

**Qué pasa.** Hay carpetas y archivos en inglés por todos lados. Y hay **dos
carpetas para el mismo concepto, una en cada idioma**: `navigation` y
`navegacion`.

**De quién es.** La segunda carpeta la creé yo, esta sesión, al lado de la que ya
existía en inglés. Es el ejemplo más claro de haberme dejado llevar por lo viejo.

---

## M7 — El mismo cálculo escrito cuatro veces

**Qué pasa.** La fórmula que mide distancias sobre la Tierra está escrita **cuatro
veces, en cuatro archivos distintos**. Si algún día hay que corregirla, hay que
acordarse de los cuatro.

**De quién es.** Tres de los cuatro los escribí yo.

---

## M8 — Dos zonas tocables por debajo del mínimo

**La regla.** «Zona tocable de cualquier botón: 56 × 56 px. Nunca baja de esos
números.»

**Qué pasaba.** El botón de buscar en la lista de rutas medía 44 y el de cambiar
la foto de perfil, 32.

**Corrección a la primera pasada.** También había anotado el ícono del cartel de
instalar, pero no es un botón: es un dibujo decorativo. Ése no era violación.

**Arreglado.** Los dos botones ahora tienen 56 de zona tocable. El de la foto se
sigue viendo chico, que es lo correcto: lo que no puede achicarse es la zona que
responde al toque.

**De quién es.** Los dos venían del código viejo. Los dejé.

---

## M9 — Código muerto exportado

**Qué pasa.** Hay funciones exportadas que no usa nadie. Código muerto es
trampa para el que venga después: parece que se usa.

---

## M10 — El formulario de sector nuevo no dice nada mientras carga

**La regla.** Punto 7 de la checklist: «Tiene resuelto qué se ve cuando no hay
nada, mientras carga y cuando falla. Ninguno de los tres queda mudo.»

**Qué pasa.** Mientras se abre, no muestra el nombre de la zona ni los sectores
que ya existen, y no dice que está cargando. Se ve como si la zona estuviera
vacía.

**De quién es.** Mío.

---

## G6 — No existía la red de rescate

**La regla.** «La app tiene que tener una red de rescate propia para cuando una
pantalla falla al dibujarse. Sin ella la pantalla queda completamente vacía y el
usuario no tiene ni un cartel que leer.»

**Qué pasaba.** No había ninguna. Si cualquier pantalla fallaba al dibujarse, el
usuario se quedaba con la pantalla en blanco y nada que leer. En el cerro eso es
peligroso: la persona cree que la app está pensando.

Es la regla sobre la que se apoya todo el producto —«el usuario nunca se queda
sin saber qué pasa»— y era la única que no estaba implementada en ningún lado.

**Arreglado.** Hay dos redes, una para una pantalla y otra para cuando falla el
armazón entero. **Ninguna de las dos usa piezas de la app**: si lo que se rompió
es el botón, un aviso hecho con ese botón tampoco se dibuja.

**De quién es.** Mío. Escribí la regla en `AGENTS.md` y no la implementé.

---

## G7 — Subir la foto de perfil escribe en un depósito que no existe

**Qué pasa.** El código guarda las fotos en un depósito llamado `avatars`. El que
se creó con la base nueva se llama `avatares`.

Si son distintos, subir una foto de perfil falla siempre.

**Estado: PENDIENTE DE VERIFICACIÓN**, junto con G2.

**De quién es.** Del código viejo, y mío por no haberlo revisado al rehacer la
base.

---

## G8 — Al cerrar sesión no se borraba nada del celular

**Qué pasaba.** Cerrar sesión cerraba la sesión y nada más. Las rutas, las zonas,
los sectores y las líneas de los recorridos quedaban guardados en el celular.

**Consecuencia.** El que entrara después con otra cuenta abría la app y veía las
rutas del anterior, dibujadas desde el celular sin pasar por la base. Es un
problema de privacidad, no de prolijidad.

**Cómo apareció.** Buscando código muerto. La función que borra lo guardado
existía y no la llamaba nadie: el código muerto era el síntoma, no el problema.

**Arreglado.** Al cerrar sesión se borra todo lo guardado antes de salir, y si
algo no se puede borrar igual se sale: quedarse sin poder salir sería peor.

**De quién es.** Mío.

---

# Lo que SÍ está bien

No para compensar, sino porque una auditoría que solo lista lo malo no sirve
para decidir:

- Ninguna pantalla consulta la base: todas dibujan de lo guardado en el celular.
- Los dos modos de color están completos y con prueba de contraste.
- Los mensajes de error dicen qué pasó y qué hacer. No hay ningún «algo salió
  mal».
- No hay ningún secreto commiteado.
- No hay ningún `any` ni escape de tipos en todo el código.
- Los cálculos están separados de las pantallas y por eso se pueden probar.
- El chequeo de tipos, el de estilo y las 119 pruebas pasan.

---

# Qué quedó hecho

| | Hallazgo | Estado |
|---|---|---|
| G1 | Carteles del sistema operativo | ✅ arreglado |
| G2 | Pantalla de Perfiles contra la base vieja | ⏳ pendiente de comprobación |
| G3 | Desvío sin prueba | ✅ 23 pruebas |
| G4 | Listas por tandas sin prueba | ✅ 11 pruebas |
| G5 | Lectura de archivos sin prueba | ✅ 10 pruebas |
| G6 | No existía la red de rescate | ✅ arreglado |
| G7 | Depósito de fotos equivocado | ⏳ pendiente de comprobación |
| G8 | Cerrar sesión no borraba nada | ✅ arreglado |
| M6 | Media app en inglés | ✅ todo en español |
| M7 | La fórmula de distancia repetida | ✅ una sola, y ahora no se puede confundir el orden |
| M8 | Zonas tocables chicas | ✅ arreglado |
| M9 | Código muerto | ✅ sacado, y uno era el síntoma de G8 |
| M10 | Formulario mudo al cargar | ✅ arreglado |

Además, sin estar en la lista: la librería que lee los GPX era la vieja y
arrastraba cuatro vulnerabilidades críticas. Se cambió por la mantenida.

De 119 pruebas se pasó a **164**.

---

## Auditoría de fuentes

**Leído en tiempo real (2026-09-19):** todo el árbol de `components/`, `lib/`,
`hooks/` y `app/`; el historial de git de esta sesión; `AGENTS.md`; la salida del
chequeo de tipos, del chequeo de estilo y de las pruebas.

**Inferido (no verificado):** nada.

**Pendiente de verificación:**
- **G2.** Si en la base de TrackApp existen la función `list_app_users`, la tabla
  `profiles` y las columnas `rutas.user_id` y `rutas.subido_por_nombre`.
- **G7.** Cómo se llama el depósito de fotos de perfil: `avatars` o `avatares`.

No tengo acceso en tiempo real a esa base por MCP —solo veo la de Vías de
Escalada— así que los dos quedan como sospecha fundada y no como hecho hasta que
Ale corra las consultas.

**Este documento no está listo para compartirse externamente hasta resolver G2 y
G7.**
