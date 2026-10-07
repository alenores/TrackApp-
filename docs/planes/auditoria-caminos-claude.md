# Auditoría de «Caminos» del lado de Mapas

**Estado:** diagnóstico de solo lectura del 2026-10-05, hecho por Claude a partir de
`docs/planes/encargo-claude-diagnostico-caminos.md`. **No autoriza a cambiar
código, base, datos ni publicación.** Nada de esto es una decisión de Ale: son
hallazgos, propuestas y preguntas.

**«Camino» es un nombre provisional.** Donde dice `caminos`, `partes_de_camino`
o «camino», se reemplaza por la palabra que elija Ale (pregunta A1). Pasa lo
mismo con cualquier nombre de tabla, columna o pantalla de este informe.

---

## Resumen en criollo, para Ale

1. **Lo que hace el prototipo sirve, y casi todo se puede reaprovechar.** Ya sabe
   partir una línea donde marcás inicio y final, ponerle a cada parte su
   condición de paso y su complejidad, y dibujarla con colores, líneas
   cortadas, puntitos y X. Las pruebas automáticas de esa lógica pasan.
2. **Lo que no sirve es dónde guarda las partes.** Hoy viven adentro del dibujo
   de cada ruta y no tienen un «número de documento» propio. Si mañana un
   circuito apunta a una parte y después alguien vuelve a partirla, el circuito
   pierde la referencia. Propongo que los circuitos apunten a un tramo del
   camino («del kilómetro 2,1 al 4,8») y no a una parte: así volver a clasificar
   no rompe ningún circuito.
3. **Tu archivo de Ascochinga** tiene siete líneas, ningún punto, 73 km en total
   y **ninguna altura**: el desnivel no se puede sacar del archivo. Además las
   líneas **no se tocan exactamente**: se acercan entre 15 y 320 metros, y tres
   quedan a más de un kilómetro y medio de cualquier otra. Eso importa para
   armar circuitos con pedazos de varias.
4. **Encontré un problema que ya existe hoy, no por los caminos:** cuando se
   borra una ruta, una zona o un sector, los otros celulares pueden no
   enterarse, porque la base no les deja ver lo borrado y el celular cree que no
   hay novedades. Ya estaba anotado como sospecha; ahora está confirmado
   mirando la base. Los caminos nuevos tienen que nacer sin ese defecto.
5. **Si ese mismo archivo se trae como anotaciones, las siete líneas se vuelven
   trazos**, y por el color que tienen en Earth dos quedarían como «Agua» y dos
   como «Límite» (alambrado). Por eso hace falta una sola puerta de importación
   que separe caminos, trazos y puntos.

Las preguntas están en la sección 6, separadas entre las que hacen falta antes
de programar y las que pueden esperar.

---

## 1. Qué hay hoy

### 1.1 Lo confirmado en `main` (último commit `cc075b4`)

**Alta de una ruta desde un archivo**

| Paso | Dónde | Qué hace |
|---|---|---|
| Pantalla | `app/(app)/rutas/nueva` → `components/rutas/formulario-de-nueva-ruta.tsx` | Elegir archivo, ver mapa en vivo, completar datos globales. |
| Lectura | `lib/rutas/archivo.ts` → `leerArchivoDeRuta` | Solo `.gpx` y `.kml` (`FORMATOS_ACEPTADOS`). **No acepta `.kmz`**, aunque el depósito `archivos-ruta` sí lo admite y el lector de anotaciones sí lo abre. Usa `@tmcw/togeojson` 7.1.2. |
| Números | `lib/rutas/recorrido.ts` → `calcularNumerosDelRecorrido` | Largo, desnivel con umbral de 5 m, rectángulo y cantidad de puntos. `lineasDelRecorrido` junta `LineString`, `MultiLineString` y `GeometryCollection`; **los puntos se ignoran**. Sin alturas, el desnivel da **0**, no «sin dato». |
| Guardado | `app/actions/rutas.ts` → `crearRuta` | Recalcula los números en el servidor, trae por tandas los sectores que tocan el rectángulo, calcula `distancias_por_sector` (`lib/cobertura.ts`) e inserta todo en `rutas.geometria` (jsonb). Después sube el archivo original a `archivos-ruta/<perfil>/<id>.<ext>`; si esa subida falla, marca la ruta como borrada. |
| Límite de tamaño | `next.config.ts` | No define `serverActions.bodySizeLimit`; la guía de Next 16.3.5 (`node_modules/next/dist/docs/.../serverActions.md`) fija **1 MB por defecto**. La geometría y el archivo viajan juntos en el mismo pedido. |

**Del servidor al celular**

| Paso | Dónde | Qué hace |
|---|---|---|
| ¿Hay novedades? | `lib/offline/sincronizacion.ts` → `ultimaModificacionEnLaBase` | La fecha `actualizado_en` más nueva de `rutas`, `zonas`, `sectores` y `anotaciones`. **Si una de esas consultas falla, el error se ignora** y esa tabla simplemente no cuenta. |
| Comparación | `lib/offline/paquete.ts` → `elPaqueteQuedoViejo` | Compara contra la fecha guardada. `FORMATO_DEL_PAQUETE = 2`. |
| Descarga | `bajarRutas` y compañía | Todas las filas vivas por tandas ordenadas por `id` (`lib/supabase/listas.ts`). Si alguna tabla vino cortada, se conserva lo anterior. |
| Lo liviano | `guardarPaquete` | Los datos de las rutas, sin línea, en el guardado simple (`trackapp-paquete-v2`). |
| Lo pesado | `lib/offline/recorridos.ts` → `guardarRecorrido` | Cada línea en el depósito grande (`lib/offline/deposito.ts`, base local versión 5, estante `recorridos`, clave = id de la ruta). `borrarRecorridosQueSobran` saca las que ya no existen. |
| Pantallas listas | `lib/offline/calentar.ts` → `pantallasParaCalentar` | Deja listas `/rutas/<id>` y `/navegacion/<id>` de cada ruta, más `/mapa-libre`, `/`, `/rutas`, `/zonas` y cada `/zonas/<id>`. |

**Dónde se dibuja una línea**

| Pantalla | Pieza | Origen de los datos |
|---|---|---|
| Navegar una ruta | `components/navegacion/pantalla-de-navegacion.tsx` | `leerPaquete` + `leerRecorrido`; otras rutas con `useRecorridosDeRutas` (`hooks/use-rutas-en-area.ts`). Nunca internet. |
| Navegación libre | `components/navegacion/pantalla-de-mapa-libre.tsx` | Igual: solo lo guardado. |
| Ficha de ruta | `components/rutas/ruta-detalle.tsx` | `useRutasEnArea`, cobertura y mapas que faltan. |
| Detalle de zona | `components/zonas/zona-detalle.tsx` | `useRutasEnArea` sobre el rectángulo de la zona. |
| Mapa general de Mapas | `components/zonas/mapa-general-de-zonas.tsx` | **No dibuja líneas**: zonas y puntos, como manda `AGENTS.md`. |
| El mapa en sí | `components/mapa/mapa.tsx` | Una sola fuente `ruta` para todas las líneas que recibe. |

**Avisos antes de salir que ya existen:** `hooks/use-lo-que-falta.ts` (mapas
perdidos y rutas sin mapa), `components/rutas/bloque-de-cobertura.tsx` y
`components/rutas/aviso-de-mapas-que-faltan.tsx`. **No hay aviso en el inicio de
«esta línea no quedó guardada en el celular».** Navegando, si falta la línea de
la ruta principal la pantalla lo dice; si falta la de **otra** ruta prendida,
`useRecorridosDeRutas` la saltea sin decir nada.

**Trazos de anotaciones (otro camino, no confundir)**

- `lib/anotaciones/archivo-de-google-earth.ts` abre `.kml` y `.kmz`.
- `lib/anotaciones/importar.ts` → `anotacionesDeGoogleEarth` trabaja **por
  sector** (lo llama `components/anotaciones/pantalla-de-anotaciones.tsx`):
  punto → punto con ícono adivinado por el nombre; línea → **trazo** con el
  color más parecido de cuatro (`agua`, `huella`, `limite`, `peligro`);
  `GeometryCollection` → se saltea y se cuenta. No repite lo que ya está
  (firma de la geometría redondeada a ~1 m) y descarta lo que cae fuera del
  sector.
- Se guardan en `anotaciones` (`tipo` = `trazo`, `origen` = `google_earth`) y
  viajan todas en el paquete.

### 1.2 El prototipo local, sin confirmar

Todo esto está en cambios locales sin commit (ver `git status`). **No se tocó.**

| Archivo | Qué agrega |
|---|---|
| `lib/rutas/partes.ts` (nuevo) | Tipos `PasoDeParte` y `ComplejidadDeParte`; `prepararPartes`, `ubicarEnRuta`, `marcarParte`, `datosDeParte`, `puntosSinPaso`. Pura, sin pantalla. |
| `lib/rutas/partes.test.ts` (nuevo) | Cinco casos: importación queda por explorar, marcar un intervalo conserva el resto, reclasificar cruzando partes, no unir líneas distintas, X en partes cortas. |
| `app/actions/partes-de-ruta.ts` (nuevo) | `guardarParteDeRuta`: lee `rutas.geometria` del creador, compara `actualizado_en` con el esperado, aplica `marcarParte` y guarda con `.eq("actualizado_en", …)` para no pisar a otro. |
| `hooks/use-edicion-de-partes.ts` (nuevo) | Lee la línea **del depósito del celular**, guarda con la acción, reescribe el depósito y pone al día. |
| `components/rutas/editor-de-partes.tsx` (nuevo) | Dos toques sobre la línea (inicio y final), vista previa, condición, complejidad, observación y fecha. |
| `components/rutas/referencia-de-partes.tsx` (nuevo) | Leyenda, `nombreDelPaso` (dice «En bici», «A pie con kayak», etc. si la ruta tiene una sola actividad) y `FichaDeParte`. |
| `components/mapa/mapa.tsx` | Reemplaza la capa única `ruta-linea` (color por ruta) por cuatro capas por condición, color por complejidad, X con el glifo «×» de la letra local (rango 0-255, ya en `public/fuentes-del-mapa`), puntos de inicio y final, y `alTocarRuta`. |
| `app/globals.css`, `components/mapa/colores.ts` | Variables `--parte-*` para los dos modos. |
| Pantallas de navegación y libre | Ficha de la parte tocada y leyenda fija abajo. |
| `lib/rutas/archivo.ts` (+ prueba) | `opcionesDeRutasDelKml`: separa un KML de varias líneas y ofrece **elegir una** para subirla como ruta, con su propio KML de respaldo. |
| Formularios de ruta | Saca el selector de color (la columna `color` sigue en la base, obligatoria, con `'naranja'` por defecto); la edición suma el editor de partes; la ficha suma «Marcar partes de esta ruta». |
| `lib/offline/sincronizacion.ts` | Si una línea no se puede guardar en el celular, la puesta al día falla con motivo en vez de seguir callada. |
| Documentos | Decisión 033, glosario, `SCHEMA.md`, `ARQUITECTURA.md`, `DISENO_EXTERIOR.md`, `SESIONES.md`. |

Restos sueltos: las carpetas `app/login/ver-partes` y `app/login/preview`
existen vacías (Git no las ve). `lib/rutas/colores.ts` quedó sin nadie que lo
use.

**Estado verificado hoy, sin cambiar nada:** `npx tsc --noEmit` sin errores;
`npx vitest run lib/rutas lib/anotaciones/importar.test.ts lib/offline`: 12
archivos, 113 pruebas, todas bien; `eslint` sobre los archivos del prototipo:
0 errores y 4 avisos que ya estaban en `mapa.tsx`.

### 1.3 Lo que dice la base hoy (leída con consultas al catálogo, sin leer filas)

- `rutas` tiene una columna que **no figura en `SCHEMA.md`**:
  `distancias_por_sector jsonb not null default '{}'`. También `color text not
  null default 'naranja'`.
- `id` de las tablas: `bigint` con identidad «por defecto»; disparadores
  `t_<tabla>` con la función `marcar_actualizado_en`. Existe la función
  `rls_auto_enable`.
- Políticas de lectura: `rutas_ver`, `zonas_ver` y `sectores_ver` piden
  `eliminado_en is null`. `anotaciones_ver` es `true` (ve también lo borrado).
- `rutas` tiene una política de **borrado físico** (`rutas_borrar`, DELETE para
  el creador). Al rol `authenticated` se le dio DELETE y TRUNCATE en casi todas
  las tablas.
- `salidas.ruta_id` es clave foránea a `rutas(id)`. Es terreno de Codex y no se
  toca acá.

### 1.4 El archivo de Ascochinga (leído en el equipo, no importado ni subido)

`C:\Users\Usuario\Downloads\Ascochinga Bike 1.kml`, 22 KB, exportado desde
Google Earth web (estilos `gx:CascadingStyle`, que la librería sí resuelve).

| # | Nombre en el archivo | Puntos | Largo | Color en Earth | Si entrara como trazo |
|---|---|---|---|---|---|
| 0 | ascichinga 1 | 83 | 27,62 km | `#fbc02d` | Huella |
| 1 | Conexion (capaz caminando) | 7 | 2,56 km | `#7b1fa2` | **Límite** |
| 2 | Conexion con camino ascochinga-la cumbre | 35 | 22,06 km | `#7b1fa2` | **Límite** |
| 3 | zona camino cuadrado - cascada alpatuca | 35 | 5,61 km | `#fbc02d` | Huella |
| 4 | Camino cuadrado - alpatuca | 31 | 6,58 km | `#1976d2` | **Agua** |
| 5 | alpatica-salida al cuadrado mas arriba | 52 | 4,92 km | `#42a5f5` | **Agua** |
| 6 | trazoz alpatuca | 19 | 3,64 km | `#42a5f5` | **Agua** |

- **Se confirma: siete líneas (`LineString`), ningún punto, ninguna carpeta.**
  Total 72,99 km. **Ninguna altura** (todas en 0).
- **Las líneas no comparten vértices.** Los extremos quedan a 15, 29, 51, 55,
  158 y 320 m de otra línea, a veces en la mitad de ella (la 2 arranca a 55 m
  del vértice 40 de la 0; la 4, a 15 m del vértice 18 de la 3). Las líneas 3, 5
  y 6 tienen un extremo a más de 1,8 km de cualquier otra.
- Son líneas dibujadas a mano: entre 7 y 83 puntos para kilómetros. Una parte
  tiene que poder empezar en la mitad de un segmento, no solo en un vértice. El
  prototipo ya lo hace.
- El nombre «Conexion (capaz caminando)» insinúa una condición, pero no se
  deduce nada del nombre: todo entra «por explorar».

Prueba aparte con un KML y un GPX inventados, en el mismo entorno:
`MultiGeometry` de Earth sale como `GeometryCollection`; un GPX con dos
segmentos sale como `MultiLineString`; una ruta GPX (`rte`) como `LineString`;
los marcadores como `Point`. **Un `gx:Track` de prueba salió como `Point`**:
queda pendiente verificar con una grabación real antes de prometer que se lee.

---

## 2. Qué se puede reutilizar

| Pieza | Veredicto | Por qué |
|---|---|---|
| `calcularNumerosDelRecorrido`, `lineasDelRecorrido`, `rectanguloDelRecorrido` | **Reutilizar** | Puras y probadas. Falta distinguir «sin altura» de «0 m» (pregunta E1). |
| `calcularCobertura`, `calcularDistanciasPorSector` (`lib/cobertura.ts`) | **Reutilizar** | Sirven por camino para avisar en casa qué mapa falta. |
| Lector de KMZ de `archivo-de-google-earth.ts` | **Mover a un lector único** | Hoy hay dos lectores de KML distintos (rutas y anotaciones) con reglas distintas. Uno solo para caminos, trazos y puntos evita que el mismo archivo se lea de dos maneras. |
| `opcionesDeRutasDelKml` | **Adaptar** | La idea es la correcta (cada línea es una alternativa), pero: (a) **saltea en silencio** las `GeometryCollection`, mientras `lineasDelRecorrido` sí las cuenta. Un KML cuyas líneas vengan en `MultiGeometry` da cero opciones y el formulario termina guardando **todo el archivo como una sola ruta**, justo lo que se quería evitar; (b) saltea sin avisar las líneas inválidas; (c) obliga a elegir una y volver a subir el archivo siete veces; (d) los tramos de un mismo `MultiLineString` salen con el mismo nombre. |
| `ubicarEnRuta`, `puntoEnDistancia`, `recortar`, `marcarParte` | **Reutilizar la geometría, rehacer la identidad** | El cálculo es bueno: interpola dentro de un segmento y conserva el resto. Pero una parte se identifica por `linea` + `desde_m` + `hasta_m`, que **cambian al volver a partir**, y `linea` sale del orden del archivo. Tampoco junta dos partes vecinas con los mismos datos: con el uso, la línea se fragmenta (pregunta E2). |
| `puntosSinPaso` y las capas de dibujo | **Reutilizar** | Una X cada 200 m y al menos una; la X no cambia el color. Coincide con lo pedido. |
| `datosDeParte` y validaciones de `guardarParteDeRuta` | **Reutilizar** | Lectura defensiva de valores y mensajes que dicen qué hacer. |
| Control de concurrencia de `guardarParteDeRuta` | **Reutilizar el patrón** | Comparar `actualizado_en` antes de escribir evita pisar a otro. Hay que reescribirlo contra la tabla nueva y con los permisos que decida Ale. |
| `useEdicionDePartes` | **Rehacer** | Es una pantalla de administración que lee la línea del depósito del celular. Si esa computadora no la tiene guardada, dice que la línea no existe aunque la base la tenga. La administración se hace con conexión: tiene que leer de la base. |
| `EditorDePartes` | **Adaptar** | El gesto de dos toques con vista previa sirve. Se muda a Mapas y necesita boceto aprobado. |
| `FichaDeParte` | **Adaptar** | Es una tarjeta suelta: **no usa la pieza única de emergentes ni se cierra con el botón físico de atrás**, a diferencia de la ficha de anotación, que sí usa `Emergente`. |
| Leyenda fija en navegación | **Revisar con boceto** | Ocupa espacio del mapa siempre; puede ir dentro de un botón. Ale decide. |
| Capas por condición en `mapa.tsx` | **Adaptar, punto de integración** | El prototipo cambió la única capa de líneas del mapa: **toda ruta sin partes se dibuja ahora gris y entrecortada** («por explorar»), incluida la que se navega. Con caminos y circuitos separados hacen falta dos fuentes distintas: la red de caminos y el plan. `mapa.tsx` lo comparten Claude y Codex. |
| Colores `--parte-*` | **Reutilizar y medir** | Contra el fondo liso del mapa: en modo noche dan entre 5,6:1 y 11,5:1. **En modo sol, el amarillo (`#a16207`) da 4,21:1, por debajo del mínimo de 4,5:1** para líneas e íconos, y el verde 4,69:1 queda justo. El fondo real es la imagen del mapa, así que es una medida orientativa: se revisa en pantalla. |
| Importación de anotaciones por sector | **No sirve para caminos** | Un camino de 27 km cruza varios sectores; la regla «solo lo que cae en el sector» lo cortaría. Sí sirve su firma para no repetir. |

---

## 3. Modelo de datos propuesto, sin aplicarlo

### 3.1 Lo que tienen en común las dos alternativas

**Un camino = una línea alternativa del archivo** (un `Placemark` o un tramo de un
`MultiLineString`). Siete líneas, siete caminos. Nunca se suman.

**Los circuitos no apuntan a partes: apuntan a un tramo del camino.** Un tramo
es: camino, desde qué metro, hasta qué metro, en qué sentido, y con qué versión
de la forma del camino. Esto responde la pregunta central del encargo:

- **Identidad de una parte.** La parte tiene su propio identificador (alternativa
  2) o su propio código (alternativa 1), y eso sirve para el historial y para
  tocarla en el mapa. Pero **ningún circuito depende de ese identificador.**
- **Si se vuelve a dividir.** La clasificación cambia, la forma del camino no.
  El tramo del circuito sigue valiendo, porque los metros sobre la línea son los
  mismos. Al abrir el circuito, la app cruza su tramo con las partes de hoy y
  puede decir en casa «una parte de tu circuito ahora está sin paso».
- **Si se corrige la forma del camino** (mover vértices, alargarlo), los metros
  dejan de coincidir. Para eso existe la versión de la forma: el circuito
  guardado con una versión vieja avisa en casa que el camino cambió y hay que
  revisarlo. La otra opción es no permitir corregir la forma y obligar a subir
  un camino nuevo (pregunta B3).

**Tabla `caminos`** (columnas propuestas; nombres provisionales)

| Columna | Tipo | Nota |
|---|---|---|
| `id` | bigint identidad | Como las demás tablas. |
| `perfil_id` | uuid | Quién lo subió. |
| `nombre` | text | Sale del archivo; editable. |
| `descripcion` | text | Opcional. |
| `actividades` | actividad_ruta[] | **Solo si Ale decide que el camino tiene actividad** (pregunta B4). |
| `geometria` | jsonb | Un único `LineString` en `[lon, lat]` o `[lon, lat, alt]`. |
| `version_forma` | integer | Sube cada vez que cambia la geometría. |
| `largo_m` | numeric | Calculado, nunca a mano. |
| `desnivel_positivo_m`, `desnivel_negativo_m` | integer, vacíos si no hay alturas | Calculado; vacío no es cero. |
| `lat_norte` `lat_sur` `lon_este` `lon_oeste` | double | Rectángulo, con la misma regla de validez que `rutas`. |
| `origen` | text con lista cerrada | `google_earth`, `gpx`, … |
| `archivo_url` | text | Respaldo del archivo original (pregunta E5). |
| `creado_en`, `actualizado_en`, `eliminado_en` | timestamptz | Como en toda tabla. |

**Valores de una parte** (tipos de la base, nombres provisionales):
`paso_de_camino` = `por_explorar` · `transitable` · `a_pie` · `sin_paso`;
`complejidad_de_parte` = `facil` · `media` · `dificil`, vacía = sin clasificar.

### 3.2 Alternativa 1 — las partes adentro del camino

`caminos.partes` es una lista jsonb: `[{codigo, desde_m, hasta_m, paso,
complejidad, observacion, comprobado_el}]`, siempre ordenada, sin huecos ni
superposiciones, cubriendo de 0 al largo total.

- **A favor:** una sola fila por camino; cambiar una parte es una escritura
  atómica; la línea y sus partes viajan juntas al celular; la puesta al día suma
  una sola tabla. Es lo más parecido al prototipo, que ya resuelve el recorte.
- **En contra:** sin historial por parte; la base no puede verificar sola que las
  partes cubran la línea sin huecos (lo cuida la app y una restricción jsonb
  limitada); cada cambio de una parte vuelve a bajar la línea entera al celular
  (con 7 líneas de 22 KB no pesa, con cientos de caminos grabados sí).
- **Riesgo:** el `codigo` de cada parte se genera en la app; si dos personas
  editan a la vez, gana la primera y la segunda recibe «el camino cambió,
  volvé a abrirlo» (el patrón del prototipo).

### 3.3 Alternativa 2 — las partes en su propia tabla

Tabla `partes_de_camino`: `id`, `camino_id`, `version_forma`, `desde_m`,
`hasta_m`, `paso`, `complejidad`, `observacion`, `comprobado_el`,
`parte_anterior_id` (de qué parte salió al volver a partir), `perfil_id` (quién
la clasificó), `creado_en`, `actualizado_en`, `eliminado_en`.

- **A favor:** cada parte tiene identidad propia en la base; al volver a partir,
  la vieja se marca borrada y las nuevas recuerdan de dónde salieron, así queda
  la historia; la base puede exigir `desde_m < hasta_m`; un cambio de parte no
  obliga a volver a bajar la línea.
- **En contra:** dos tablas para la puesta al día, el paquete y los permisos;
  partir una parte son varias escrituras que tienen que ir juntas (una función
  de la base o una transacción), o el camino queda con un hueco a medias.
- **Riesgo:** la regla «sin huecos ni superposiciones» entre filas vivas es más
  difícil de garantizar en la base que dentro de una sola fila.

**Mi recomendación técnica, para que Ale decida:** alternativa 1 para empezar,
con los circuitos apuntando a tramos. Es la que menos piezas agrega y la que
reusa el prototipo casi entero. Si después hace falta historial por parte, el
paso a la alternativa 2 no rompe circuitos, porque los circuitos nunca
apuntaron a partes.

### 3.4 Relación prevista con Circuitos (contrato a acordar con Codex)

Lo que el lado de Mapas entregaría, sin pantalla, para que Circuitos lo use:

- leer un camino guardado (base o celular, según la pantalla);
- `tramoDeCamino(camino, desde_m, hasta_m, sentido)` → la línea de ese tramo,
  sus metros y las partes de hoy que lo cruzan con su condición y complejidad;
- `ubicarEnCamino(camino, lon, lat)` → el metro más cercano (lo que hoy hace
  `ubicarEnRuta`);
- la versión de la forma de cada camino, para que el circuito sepa si cambió.

La tabla de circuitos, cómo se ordenan los tramos, qué pasa con los huecos y la
relación con Salidas son de Codex. **Ningún camino guarda referencias a
circuitos**: la flecha va solo de circuito a camino.

### 3.5 Permisos: lo que falta decidir (no se inventa nada)

- Quién sube caminos (¿solo el administrador, como zonas y sectores?).
- Quién clasifica una parte (¿también un amigo premium que la exploró?).
- Quién ve los caminos (¿todos los que tienen sesión, como las anotaciones?).
- Quién retira un camino y qué pasa con los circuitos que lo usan.
- Si un usuario normal puede dejar una observación sin cambiar la condición.

Lo único que **no** depende de Ale, porque lo exige `AGENTS.md`: la lectura de
filas borradas para que los borrados lleguen a todos (ver 5.2), sin borrado
físico y sin tabla abierta en escritura.

---

## 4. KML y puntos

### 4.1 Cada línea, una alternativa

1. **Un solo lector** para `.kml`, `.kmz` y `.gpx` que devuelva, por separado:
   líneas (nombre, descripción, coordenadas, color original), puntos y lo que se
   saltea **con el motivo** («1 polígono no es ni punto ni línea»).
2. `LineString` → una alternativa. `MultiLineString` y `GeometryCollection`
   con varias líneas → **una alternativa por tramo**, nombradas «Nombre (1 de
   2)». Nunca se suman.
3. **Pantalla de importar caminos** (computadora, con conexión): la lista de
   todas las líneas con su largo y una casilla cada una, el mapa con cada línea
   distinguible, y el nombre editable. Un solo «Agregar» crea los N caminos.
4. Cada camino nuevo nace con **una parte que lo cubre entero**: por explorar
   y sin clasificar.
5. **No repetir:** antes de guardar, comparar la firma de cada línea con los
   caminos que ya existen y decir «2 ya estaban y no se repiten».
6. **Verificar antes de decir listo:** contar cuántos caminos se pidió crear y
   cuántos confirmó la base. Si no coinciden, decirlo con el motivo.
7. **Tamaño:** mandar la geometría simplificada en coordenadas y subir el archivo
   original directo al depósito, o subir el tope de las acciones del servidor.
   Con el tope de 1 MB, un GPX grabado de un día entero puede no entrar.

Con el archivo de Ascochinga, la pantalla mostraría siete casillas, de 2,56 km a
27,62 km, y crearía siete caminos de 72,99 km en total, ninguno con desnivel
conocido.

### 4.2 Puntos del mismo archivo y trazos

- **Los puntos nunca van adentro de un camino.** Hoy, los marcadores de un GPX
  o KML subido como ruta quedan guardados dentro de `rutas.geometria` y **no se
  dibujan en ningún mapa** (las capas de la fuente `ruta` son solo de línea):
  el usuario cree que los subió y no aparecen.
- En la misma pantalla, los puntos se ofrecen aparte como **puntos del mapa**
  (anotaciones), con el ícono adivinado por el nombre y la misma firma que ya
  usa `importar.ts` para no duplicar. A qué lugar van (un sector o «sin sector»)
  lo decide Ale (pregunta A3).
- **Una línea del archivo es camino o trazo, nunca las dos cosas.** Dos maneras
  posibles, para que Ale elija (pregunta A2): (a) en la importación cada línea
  se marca «camino» o «trazo», o (b) todo lo que entra por caminos es camino y
  los trazos se siguen trayendo por anotaciones. En cualquiera de las dos, la
  importación de anotaciones tendría que saltear las líneas que ya existen como
  caminos y decirlo.

---

## 5. Offline y seguridad

### 5.1 Lo que cambia para que la navegación siga sin internet

- **Paquete:** los datos livianos de cada camino (sin línea) entran al paquete y
  `FORMATO_DEL_PAQUETE` pasa a 3, para que todos los celulares lo bajen entero
  apenas haya señal.
- **Depósito:** un estante nuevo para las líneas de los caminos (con sus partes,
  en la alternativa 1). Eso sube la versión de la base local de 5 a 6, que
  según `lib/offline/deposito.ts` agrega estantes sin borrar nada. Hace falta su
  propio «sacar lo que ya no existe».
- **Puesta al día:** sumar la tabla (o las dos) a `TABLAS_DEL_PAQUETE`, y
  **dejar de ignorar el error** de `ultimaModificacionEnLaBase`: con una tabla
  nueva sin permiso de lectura, hoy la app concluiría «está al día» en silencio.
- **Navegar:** los caminos se leen solo del celular. Si un camino prendido no
  tiene su línea guardada, se dice en pantalla («No tenés guardada la línea de
  X. Abrí la app con señal en tu casa»), no se saltea como hoy con las rutas.
- **Ficha de una parte:** con la pieza única de emergentes y cerrándose con el
  botón físico de atrás.
- **Pantallas listas sin señal:** si los caminos no tienen pantallas propias en
  el cerro (se ven dentro de la navegación y la navegación libre), no hay nada
  nuevo que calentar. Si se agrega una ficha de camino para el cerro, entra en
  `pantallasParaCalentar`.
- **Pendiente heredado (R30):** la navegación arma el aviso de «sin mapa» pero
  solo muestra la pastilla «Sin mapa descargado», no el texto. Sigue abierto.

### 5.2 Lo que se sabe en casa

- **Línea no guardada en el celular:** aviso en el inicio, igual que los mapas
  que faltan. Hoy no existe ni para las rutas.
- **Camino sin mapa bajado:** la cobertura por camino, con la misma separación
  que ya rige: perdido (franja ámbar, arriba) distinto de nunca bajado (tarjeta
  común).
- **Partes sin paso o por explorar dentro de un circuito:** es de Circuitos; el
  lado de Mapas entrega `tramoDeCamino` para que Codex lo calcule.
- **Borrados que no llegan (problema que ya existe):** las políticas de lectura
  de `rutas`, `zonas` y `sectores` esconden lo borrado. Cuando lo más nuevo de
  la base es un borrado, nadie ve esa fecha, el celular cree que no hay
  novedades y **lo borrado sigue apareciendo** hasta que cambie otra cosa. Es el
  mismo caso de R29, que se arregló solo para anotaciones y dejó anotado «no se
  miró» para las demás. Lo inferí del código y de las políticas; no lo probé con
  dos cuentas. Los caminos tienen que nacer leyendo también lo borrado, y
  conviene arreglar las otras tres tablas en un cambio aparte, con Ale.

### 5.3 Reglas para cualquier tabla nueva, en la misma tanda

1. Nombre en snake_case español y en plural; `id` bigint con identidad, como
   las demás.
2. `creado_en` y `actualizado_en` con `now()` y el disparador
   `marcar_actualizado_en`; `eliminado_en` vacío.
3. Seguridad por fila activa desde la creación (verificar si `rls_auto_enable`
   ya lo hace solo).
4. **Permisos para `authenticated` en la misma tanda:** leer, crear y cambiar.
   **Sin DELETE ni TRUNCATE**, porque borrar es marcar `eliminado_en`. Hoy las
   tablas existentes tienen los dos y `rutas` además una política de borrado
   físico: no copiarlo.
5. Política de lectura **sin** filtro de `eliminado_en` (la app pide solo las
   vivas), para que los borrados se noten.
6. Políticas de escritura según lo que decida Ale (3.5).
7. Restricciones: rectángulo válido, `desde_m < hasta_m`, valores de condición
   y complejidad cerrados, `geometria` de tipo `LineString`.
8. Índice por `camino_id` entre las filas vivas (alternativa 2).
9. Después de correrlo, leer la base y confirmar políticas, permisos y
   disparador, como se hizo hoy. Y actualizar `SCHEMA.md`.

El SQL completo, listo para el editor de Supabase, va en el encargo de
implementación, cuando estén decididos los permisos. Antes no tiene sentido:
saldría con permisos inventados.

### 5.4 Pruebas automáticas (lo crítico, no todo)

- Lector único: el KML de siete líneas da siete alternativas; una `MultiGeometry`
  da una por tramo; los puntos salen aparte; lo salteado se cuenta con motivo.
  Con un archivo inventado equivalente, no con el de Ale, salvo que él lo
  autorice.
- Partes: partir, volver a partir, cubrir siempre de 0 al largo sin huecos.
- `tramoDeCamino`: un tramo que cruza tres partes devuelve las tres con su
  condición; reclasificar no cambia el tramo.
- Puesta al día: la tabla nueva entra; un error de permiso da «falló» con
  motivo y no «al día»; un borrado mueve la fecha de novedades.
- **Navegación sin internet:** una prueba que falle si las pantallas de navegar
  piden algo a la red. Hoy no existe ninguna.
- Manual, antes de decir listo: modo avión con la app abierta en navegación
  libre y en navegación de un circuito, en modo sol y en modo noche.

---

## 6. Preguntas para Alejandro

### Antes de programar

**A. La palabra y qué entra**

- **A1.** Para lo que hoy llamamos «caminos», que incluye huellas en bici y
  pasos en kayak: ¿«camino» te sirve? Tené en cuenta que «huella» ya es el
  nombre de un color de trazo, y que «ruta» hoy dice ser la palabra única para
  «la línea subida desde un archivo».
- **A2.** Cuando subís un archivo de Earth, ¿cada línea es siempre un camino?
  ¿O a veces es un río o un alambrado, y querés elegir línea por línea si es
  camino o trazo?
- **A3.** Si el archivo trae puntos, ¿los agrego en el mismo paso como puntos
  del mapa, mostrándotelos antes? ¿Van a un sector o quedan sueltos, como los
  puntos que cargás pegando coordenadas?

**B. Quién y dónde**

- **B1.** ¿Quién puede subir caminos? ¿Quién puede marcar si una parte se pasa,
  a pie o sin paso: solo vos, o también un amigo premium que fue? ¿Todos los
  ven?
- **B2.** Hoy el mapa general de Mapas muestra solo zonas y puntos. ¿Querés ver
  ahí los caminos, o solo dentro de cada zona y en la navegación? En la
  navegación libre, ¿aparecen todos prendidos o los elegís?
- **B3.** Si un camino estaba mal dibujado, ¿lo corregís sobre el mismo, o subís
  uno nuevo y retirás el viejo? (Corregir obliga a avisar a los circuitos que lo
  usan.)
- **B4.** ¿Un camino es de una actividad (bici, kayak) o la actividad es solo
  del circuito? De eso depende que la parte diga «En bici» o «Transitable».
- **B5.** ¿Un camino pertenece a una zona, o puede andar suelto por Córdoba?

**C. Lo que ya está en tu computadora**

- **C1.** El prototipo de partes dentro de Rutas sigue sin guardar. ¿Lo dejamos
  como está hasta que exista lo nuevo, o se descarta cuando se arme la capa de
  caminos? Mientras siga, todas las rutas se dibujan grises y entrecortadas.

### Pueden esperar

- **E1.** Las líneas que dibujás en Earth no traen altura. ¿Te alcanza con que
  diga «sin dato», o querés que la app calcule la subida con el relieve al
  importar?
- **E2.** Si dos partes vecinas quedan con los mismos datos, ¿se juntan solas?
- **E3.** ¿Te sirve guardar quién cambió una parte y cuándo, o alcanza con
  «comprobado el»?
- **E4.** La leyenda de colores y líneas en la navegación: ¿siempre a la vista o
  detrás de un botón?
- **E5.** ¿Guardamos el archivo original de Earth una vez, o una copia por
  camino?

---

## 7. Plan de implementación del lado de Mapas

**Condición para empezar:** Ale contestó el bloque «antes de programar», hay
contrato escrito con Codex (vocabulario, permisos, tramos, `mapa.tsx` y paquete),
el estado local del prototipo quedó preservado antes de crear copias de trabajo
separadas, y Ale aprobó los bocetos de la pantalla de importar y del editor de
partes.

| # | Paso | Áreas que tocaría | Se acepta cuando |
|---|---|---|---|
| 1 | Lector único de archivos | `lib/caminos/archivo.ts` (nuevo), reusando lo de `lib/rutas/archivo.ts` y `lib/anotaciones/archivo-de-google-earth.ts` sin borrarlos | Pruebas: 7 líneas → 7; `MultiGeometry` → una por tramo; puntos aparte; KMZ; lo salteado con motivo. |
| 2 | Lógica de partes y tramos | `lib/caminos/partes.ts` y `lib/caminos/tramos.ts` (nuevos), partiendo de `lib/rutas/partes.ts` | Pruebas de partir, volver a partir, cobertura sin huecos y `tramoDeCamino`. |
| 3 | Base | SQL completo para el editor de Supabase; lo corre Ale | Lectura del catálogo confirma RLS, permisos sin DELETE ni TRUNCATE, lectura de borrados, disparador. `SCHEMA.md` al día. |
| 4 | Acciones del servidor | `app/actions/caminos.ts` (nuevo) | Importar en tanda con conteo verificado; marcar parte sin pisar a otro; retirar con `eliminado_en`. Errores con qué pasó y qué hacer. |
| 5 | Pantalla de importar | `components/caminos/` (nuevo), dentro de Mapas en `app/(app)/zonas/...` | Boceto aprobado; sol y noche; vacío, cargando y falla resueltos; botones de tamaño normal. |
| 6 | Editor de partes en Mapas | `components/caminos/`, `hooks/use-caminos-*.ts` (nuevos) | Lee de la base, no del celular; emergente única; vista previa igual a lo que se guarda. |
| 7 | Celular | **Integración:** `lib/offline/sincronizacion.ts`, `paquete.ts`, `deposito.ts`, `calentar.ts`, `hooks/use-lo-que-falta.ts` | Pruebas de puesta al día; aviso en casa de línea no guardada y mapa faltante; borrados que llegan. |
| 8 | Dibujo | **Integración:** `components/mapa/mapa.tsx`, `colores.ts`, `app/globals.css` | Fuente de caminos separada del plan; la X no cambia el color; contraste ≥ 4,5:1 en los dos modos mirado en pantalla. |
| 9 | Navegación | **Integración:** navegación libre y la del circuito | Ninguna petición a la red con el modo avión; línea faltante avisada en pantalla. |
| 10 | Documentos | Glosario, decisión nueva, `SCHEMA.md`, `ARQUITECTURA.md`, `DISENO_EXTERIOR.md`, `RIESGOS.md`, `SESIONES.md`, y `AGENTS.md` si cambia la regla del mapa general o la palabra | Ninguna regla dice algo que el código ya no hace. |
| 11 | Cierre | — | `tsc`, `lint` y pruebas en verde; sol y noche; modo avión. |

**Reservado a Codex o a la integración conjunta:** la tabla y las pantallas de
Circuitos; `types/database.ts` en lo compartido; las fuentes de `mapa.tsx`; el
paquete y la puesta al día; la pantalla de navegación de un circuito; el inicio y
el menú; qué pasa con `salidas.ruta_id` y con el módulo Rutas actual.

**Lo que no tocaría:** Circuitos, Salidas, publicación (commit a `main`, push,
despliegue), la tabla `rutas` y sus pantallas, los archivos del prototipo local
(no los borraría ni los movería sin que Ale lo diga) y los archivos compartidos
hasta tener el contrato.

---

## 8. Contradicciones entre documentos, código y base

No se corrigió ninguna: este encargo no permite tocar documentos existentes.

> ⚠️ `docs/SCHEMA.md` dice que la tabla `rutas` no tiene `distancias_por_sector`
> pero la base la tiene (`jsonb not null default '{}'`) y el código la usa.
> Manda la base. Se actualiza el documento.

> ⚠️ `docs/SCHEMA.md` dice que todos ven también las zonas borradas y que
> cualquiera crea las suyas, pero la base dice que `zonas_ver` filtra
> `eliminado_en is null` y que solo el administrador escribe (`zonas_admin`).
> Manda la base. Se actualiza el documento.

> ⚠️ `docs/RIESGOS.md` (R29) dice que no se miró si rutas, zonas y sectores
> tienen el problema de los borrados, pero la base dice que sí: las tres
> políticas de lectura esconden lo borrado. Manda la base. Se actualiza el
> documento y el riesgo queda abierto para esas tres tablas.

> ⚠️ `docs/SCHEMA.md` dice «si el código dice otra cosa, manda esto», pero
> `docs/MANTENIMIENTO.md` y `AGENTS.md` dicen que mandan la base y el código.
> Manda `MANTENIMIENTO.md`. Se actualiza el encabezado.

Contradicciones de reglas, para que decida Ale (no se resuelven solas):

- `AGENTS.md` pide borrado lógico siempre; la base permite borrado físico en
  `rutas` (`rutas_borrar`) y da DELETE y TRUNCATE a los usuarios con sesión.
- `AGENTS.md` y el glosario dicen que «ruta» es la palabra única para la línea
  subida desde un archivo; el plan de separación pone esas líneas en Mapas como
  caminos. Además el glosario define el **trazo** como algo que sirve para
  marcar «una huella» y tiene un color llamado «Huella», que se pisa con el
  concepto nuevo.
- `AGENTS.md` dice que el mapa general dibuja solo zonas y puntos; si los
  caminos van ahí, la regla cambia (pregunta B2).
- La decisión 033 dice que edita las partes quien subió la ruta; para caminos
  los permisos no están decididos.
- Los cambios locales de `ARQUITECTURA.md`, `DISENO_EXTERIOR.md` y `SCHEMA.md`
  describen las partes dentro de `rutas.geometria` como si fueran la app; el
  glosario sí lleva el aviso de «en revisión», esos tres no.
- Palabras prohibidas que ya están en uso: «recorrido» en el glosario («Paquete»)
  y en nombres de código (`recorrido.ts`, `recorridos.ts`,
  `calcularNumerosDelRecorrido`), y «track» en un mensaje que ve el usuario en
  `app/actions/rutas.ts` («el archivo del track»). Lo nuevo no tendría que
  repetirlo.

---

## Auditoría de fuentes

**Leído en tiempo real**

- `AGENTS.md`, `docs/planes/2026-10-05-mapas-caminos-circuitos.md`,
  `docs/planes/encargo-claude-diagnostico-caminos.md`,
  `docs/planes/auditoria-circuitos-codex.md` (para no contradecir a Codex),
  `docs/decisiones/033-partes-de-una-ruta.md`, `docs/GLOSARIO.md`,
  `docs/SCHEMA.md`, `docs/MANTENIMIENTO.md`, `docs/USUARIOS.md`,
  `docs/RIESGOS.md` (R29, R30, R14) y las diferencias locales de los documentos.
- `git status` y `git diff` de todos los archivos modificados del prototipo.
- Código: `lib/rutas/archivo.ts`, `recorrido.ts`, `partes.ts`, `partes.test.ts`;
  `app/actions/rutas.ts`, `partes-de-ruta.ts`; `hooks/use-edicion-de-partes.ts`,
  `use-rutas-en-area.ts`, `use-lo-que-falta.ts`;
  `components/rutas/editor-de-partes.tsx`, `referencia-de-partes.tsx`;
  `components/mapa/mapa.tsx`, `colores.ts`, `capas-base.ts`;
  `components/navegacion/pantalla-de-navegacion.tsx`,
  `pantalla-de-mapa-libre.tsx`; `components/anotaciones/pantalla-de-anotaciones.tsx`;
  `lib/anotaciones/archivo-de-google-earth.ts`, `importar.ts`,
  `colores-de-trazo.ts`; `lib/offline/sincronizacion.ts`, `recorridos.ts`,
  `paquete.ts`, `calentar.ts`, `deposito.ts`; `types/database.ts`;
  `next.config.ts`; la guía de Server Actions de Next 16.3.5 en `node_modules`.
- La base del proyecto `cuhcurlxrbrfzgykdepp`, **solo catálogo**: columnas de
  `rutas`, `anotaciones` y `salidas`; políticas de `rutas`, `anotaciones`,
  `zonas`, `sectores` y `mapas_bajados`; permisos de `authenticated` y `anon`;
  disparadores; identidad de `id`; restricciones; funciones. **No se leyó
  ninguna fila.**
- El KML de Ascochinga, leído y medido en el equipo con la misma librería que usa
  la app. No se importó ni se subió.
- Pruebas locales sin cambios: `tsc` sin errores, 113 pruebas en verde, `eslint`
  sin errores.

**Inferido**

- Que los borrados de rutas, zonas y sectores no llegan a otros celulares
  (código de la puesta al día + políticas leídas; no probado con dos cuentas).
- Que un archivo de más de ~1 MB falla al subir una ruta (tope por defecto de
  Next sin configuración propia; no probado).
- Que un KML con todas sus líneas en `MultiGeometry` termina guardado como una
  sola ruta (leyendo el formulario del prototipo; probado solo el lector).
- Los contrastes de color: medidos contra el color liso del fondo, no contra la
  imagen real del mapa.
- Las dos alternativas de modelo, la recomendación y la API de tramos: son
  propuestas técnicas, no decisiones de Ale.

**Pendiente de verificación**

- Todas las respuestas de la sección 6.
- Si `rls_auto_enable` activa la seguridad por fila sola en tablas nuevas.
- Cómo lee la librería una grabación `gx:Track` real (en la prueba de laboratorio
  salió como punto).
- Los contrastes en pantalla, en modo sol y en modo noche.
- La navegación con caminos en modo avión, que todavía no existe.
- El contrato con Codex sobre tramos, `mapa.tsx`, el paquete y el destino del
  módulo Rutas actual.
