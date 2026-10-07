# Informe técnico — contrato de Circuitos

**Fecha:** 2026-10-07 · **Autor:** Claude · **Encargo:**
`docs/planes/encargo-claude-circuitos-2026-10-07.md`

**Estado:** propuesta técnica para revisión. No se modificó código, base,
documentos existentes, configuración ni pruebas. No se leyeron filas de la
base: solo el catálogo (tablas, columnas, claves y migraciones aplicadas).

**Corrección editorial de Codex, 2026-10-07:** Alejandro no aprobó «plan» como
nombre del concepto ni como texto de la app. En este informe se usa
**Circuito**; el aviso por separaciones se llama **«Partes sin unir»**. Esta
corrección no aprueba ni modifica las propuestas técnicas de Claude.

**Decisión posterior de Alejandro (044):** el Circuito se dibuja directamente
punto por punto. Si dos puntos seguidos caen sobre el mismo Camino, la línea
sigue ese Camino; si el siguiente cae fuera, continúa libremente. No hay un
paso obligatorio de elegir Camino ni modos separados de dibujo. Cualquier
propuesta de editor que suponga esos pasos queda superada por esta decisión.

**Decisión posterior de Alejandro (045):** si un Camino usado por un Circuito
se retira de Mapas, esa parte sigue visible dentro del Circuito con un aviso
antes de salir. Responde la pregunta 1 de la sección 8; el mecanismo técnico
de conservación y sincronización sigue pendiente.

Cada afirmación importante lleva una marca:

- **[verificada]**: comprobada hoy en el código, en la migración o en el
  catálogo de la base.
- **[propuesta]**: recomendación técnica de este informe. No es una decisión
  de Ale ni un esquema aprobado.
- **[pendiente de Ale]**: decisión de uso que no se puede deducir de las
  fuentes. Mientras no se responda, la consecuencia queda escrita al lado.

---

## Resumen para quien arranque la primera fase

1. **Circuitos no existe en ningún lado** [verificada]: no hay tabla, tipo,
   acción, pantalla ni dirección con ese nombre. La base tiene `rutas`,
   `caminos` y `salidas.ruta_id → rutas.id`.
2. **El vínculo con un Camino se ancla en metros sobre su línea, más la versión
   de la forma con la que se eligió** [propuesta]. Volver a clasificar partes
   no cambia la línea ni la versión, así que el vínculo no se rompe
   [verificada]. Corregir la línea sí cambia la versión, y ahí hace falta
   trasladar los extremos.
3. **El traslado tiene que usar la misma regla con que la corrección mueve los
   límites de las partes** [propuesta]. Hoy esa regla se calcula al corregir y
   se tira [verificada]: la base solo guarda la línea nueva y la versión. Se
   propone guardar, junto con cada corrección, la «correspondencia» entre la
   línea vieja y la nueva (cuatro pares de números). Mientras no exista, el
   respaldo es reubicar por posición geográfica y marcar lo dudoso.
4. **El Circuito se resuelve con señal, al ponerse al día, y la navegación lee
   la línea ya resuelta** [propuesta]. El aviso «cambió el Circuito» nace en ese
   mismo paso, comparando el paquete viejo con el nuevo, y queda guardado en
   el celular para mostrarse antes de salir.
5. **Partes sin unir ≠ sin paso** [propuesta]. Las partes sin unir son una propiedad del
   dibujo del Circuito (dos partes que no se tocan); sin paso es una clasificación
   de una parte de un Camino para una actividad. Se calculan, guardan y avisan
   por separado.
6. La sección 8 contiene las preguntas de uso del informe original. La
   primera quedó respondida después, en la decisión 045; las otras siguen
   pendientes.

---

## 1. Inventario comprobado

### 1.1 Base de datos (catálogo, sin filas)

| Qué | Estado | Marca |
|---|---|---|
| Migraciones aplicadas | `icono_punto_tranquera`, `salidas_desde_cero`, `salidas_linea_simplificada`, `correr_y_actividades_del_perfil`, `salidas_hasta_30_fotos`, `salidas_borrador_y_registro`, `crear_caminos_en_mapas`, `restringir_anotaciones_del_mapa_por_categoria` | verificada |
| Tablas en `public` | `perfiles`, `zonas`, `sectores`, `rutas`, `anotaciones`, `mapas_bajados`, `salidas`, `salidas_fotos`, `salidas_companeros`, `caminos`. **Ninguna de circuitos.** | verificada |
| `caminos` | `id`, `perfil_id`, `nombre`, `descripcion`, `actividades actividad_ruta[]`, `geometria jsonb`, `partes jsonb`, `largo_m numeric`, `version_forma integer default 1`, `creado_en`, `actualizado_en`, `eliminado_en`. RLS activa. | verificada |
| `salidas.ruta_id` | `bigint` opcional con clave foránea `salidas_ruta_id_fkey → rutas.id` | verificada |
| `rutas` | Línea en `geometria` (obligatoria) más datos globales: `actividades`, `dificultad_tecnica`, `nivel_esfuerzo`, `equipo`, `complicaciones`, `largo_km`, desniveles, rectángulo, `color`, `distancias_por_sector`, `archivo_url` | verificada |
| Enum `actividad_ruta` | `trekking`, `mountain_bike`, `kayak`, `canyoning`, `correr` | verificada |

**Reglas de `caminos`, leídas en `scripts/supabase-caminos.sql`, que es la
migración aplicada** [verificada]:

- `version_forma` la sube un disparador (`privado.cuidar_camino_al_cambiar`)
  **solo cuando cambia `geometria`**. Cambiar `partes`, `actividades`, nombre o
  descripción no la toca.
- Un Camino retirado (`eliminado_en` no vacío) **no se puede modificar ni
  recuperar**: el disparador lo rechaza. Sigue siendo legible por cualquier
  usuario con sesión (`caminos_ver` usa `true`), justamente para que la baja
  llegue a los demás celulares.
- Permisos: lee todo usuario con sesión; crean Administrador y Premium a su
  nombre; Premium edita lo propio vivo; Administrador edita cualquiera vivo;
  sin `DELETE` ni `TRUNCATE`; permisos por columna (`perfil_id`, `creado_en` y
  `version_forma` no se pueden escribir al actualizar).
- La categoría sale de `privado.categoria_de_quien_usa()`, función ya creada y
  reutilizable para Circuitos.
- La base vuelve a medir el largo de la línea y exige que las partes cubran
  `[0, largo_m]` sin huecos, con una clasificación por actividad.

### 1.2 Caminos en el código

| Pieza | Dónde | Qué hace | Marca |
|---|---|---|---|
| Geometría pura | `lib/caminos/geometria.ts` | Distancias acumuladas, `puntoEnDistancia`, `tramoDeLinea(coords, desde, hasta)`, `ubicarEnLinea(coords, lon, lat)` | verificada |
| Partes y corrección | `lib/caminos/partes.ts` | Partir, clasificar por actividad, datos compartidos, `corregirLinea` | verificada |
| Lectura de filas | `lib/caminos/datos.ts` | `COLUMNAS_DE_CAMINO` incluye `version_forma`; `CaminoGuardado` trae `versionForma` y `actualizadoEn` | verificada |
| Guardado | `lib/caminos/guardado.ts` | Leer → permiso → aplicar → `actualizarSiNadieCambio` (bloqueo optimista por `actualizado_en`) | verificada |
| Acciones | `app/actions/caminos.ts` | Conecta lo anterior con Supabase, tope de 15 s por pedido | verificada |
| Permisos en la app | `lib/caminos/permisos.ts` | Misma regla que la base, con mensajes en voseo | verificada |
| Dibujo | `lib/caminos/dibujo.ts` | Arma un `FeatureCollection` por parte con `camino_id`, `parte_indice`, `paso`, `complejidad` de la actividad principal | verificada |

**Cómo se corrige una línea hoy** (`corregirLinea`) [verificada]:

1. Si la línea nueva es la vieja al revés (el comienzo nuevo coincide con el
   final viejo y viceversa), invierte las partes.
2. Busca cuántos puntos iguales hay al comienzo y cuántos al final.
3. Los límites que caen en lo intacto del comienzo **no se mueven**; los del
   final intacto **se corren** en la diferencia de largo; los que caen en la
   zona cambiada se reparten **en proporción** al nuevo largo de esa zona.
4. Una parte cuyo tramo desaparece entero deja de existir.

Esa regla es exactamente la que necesita un Circuito para seguir la corrección
con el mismo criterio que las partes. **Pero la correspondencia calculada no se
guarda**: el servidor escribe la línea nueva, la base sube `version_forma`, y
la línea vieja se pierde [verificada]. Un celular que se pone al día después
ve la versión 3 sin saber cómo se pasó de la 2 a la 3.

### 1.3 Descarga y datos locales

| Pieza | Dónde | Qué hace | Marca |
|---|---|---|---|
| Paquete liviano | `lib/offline/paquete.ts` | En el guardado simple: `rutas`, `caminos` sin línea, `zonas`, `sectores`, `anotaciones`, `ultimaModificacion`, `formato` (hoy **3**). Un formato distinto obliga a bajar todo de nuevo. | verificada |
| Líneas de Caminos | `lib/offline/lineas-de-caminos.ts` | En el depósito grande, clave `id:actualizadoEn`. Una puesta al día cortada no pisa la línea que usa el paquete anterior; las sobrantes se borran **después** de guardar el paquete nuevo. | verificada |
| Líneas de Rutas | `lib/offline/recorridos.ts` | En el depósito grande, clave **solo `rutaId`**, escritas **antes** del paquete. | verificada |
| Depósito | `lib/offline/deposito.ts` | Una sola base de IndexedDB, `VERSION = 6`, estantes fijos en `ESTANTES` | verificada |
| Puesta al día | `lib/offline/sincronizacion.ts` | Pregunta la fecha más nueva de cada tabla de `TABLAS_DEL_PAQUETE`; si el paquete quedó viejo, baja **todo** en tandas, cuenta Caminos contra el total, guarda líneas, guarda el paquete, limpia sobrantes. Nunca con la navegación abierta. | verificada |
| Cuándo corre | `lib/offline/puesta-al-dia.ts` | Una vez por apertura y después de guardar algo; después calienta pantallas | verificada |
| Pantallas listas | `lib/offline/calentar.ts` | `/`, `/rutas`, `/zonas`, `/mapa-libre`, cada `/zonas/<id>`, cada `/rutas/<id>` y `/navegacion/<id>` | verificada |
| Lectura en el cerro | `hooks/use-caminos-guardados.ts` | Lee paquete + líneas locales; si falta una línea lo dice con su nombre | verificada |
| Lo que falta antes de salir | `hooks/use-lo-que-falta.ts`, `lib/mapas/lo-que-falta.ts` | Mapas perdidos y rutas sin mapa, en el inicio | verificada |
| Cobertura | `lib/cobertura.ts` | `calcularCobertura(FeatureCollection, sectores, bajados)` camina cada línea de a 50 m; **sirve tal cual para la línea resuelta de un Circuito** | verificada |

**El punto donde se detectan cambios** [verificada]: dentro de
`sincronizarPaquete`, después de bajar todas las tablas y antes de
`guardarPaquete`. Es el único momento en que están juntos, en memoria, el
paquete viejo (`guardado`) y lo recién bajado. Ahí se propone detectar los
cambios relevantes para Circuitos (sección 5).

### 1.4 Rutas, Salidas y la navegación actual

- **Rutas** [verificada]: inicio (`app/(app)/page.tsx` → `PantallaDeRutas`),
  lista, alta desde archivo, ficha (`components/rutas/ruta-detalle.tsx`, que
  calcula cobertura y ofrece bajar mapas), edición, navegación en
  `/navegacion/<id>` con `PantallaDeNavegacion rutaId`.
- **La navegación de una ruta no dibuja Caminos** [verificada]: no los importa.
  Sí los dibujan el mapa general de Mapas
  (`components/zonas/mapa-general-de-zonas.tsx`) y la navegación libre
  (`components/navegacion/pantalla-de-mapa-libre.tsx`), ambos con
  `useCaminosGuardados` y `dibujarCaminos`.
- **El mapa compartido** (`components/mapa/mapa.tsx`) [verificada] recibe por
  separado `recorrido` (la ruta), `caminos` (con su capa de X para «sin paso»),
  vértices del Camino en edición y los toques. Un Circuito necesitará una capa
  propia: es un archivo compartido.
- **Salidas** [verificada]: `salidas.ruta_id` lo escriben
  `lib/salidas/subir-registros.ts` (desde el registro hecho navegando) y lo lee
  `lib/salidas/fila.ts`. `lib/salidas/registro.ts` guarda `rutaId` en el
  registro local. `hooks/use-subir-registros.ts` saca las actividades de la
  ruta del paquete para el borrador. `hooks/use-rutas-en-area.ts` también arma
  filas con `ruta_id`.
- **Permisos de pantalla**: `hooks/use-puede-administrar.ts` y
  `lib/caminos/permisos.ts` [verificada].

### 1.5 Qué haría falta para meter Circuitos sin molestar la prueba de Caminos

[propuesta] Separar los cambios en dos grupos:

**Archivos nuevos, sin choque con nadie:** `lib/circuitos/*` (lógica pura y
pruebas), `app/actions/circuitos.ts`, `components/circuitos/*`,
`app/(app)/circuitos/*`, `hooks/use-circuito*.ts`,
`lib/offline/lineas-de-circuitos.ts`, `scripts/supabase-circuitos.sql` (solo
preparado, sin aplicar).

**Archivos compartidos, de a un dueño por vez y después de que Ale cierre la
prueba de Caminos:**

| Archivo | Para qué lo tocaría Circuitos |
|---|---|
| `lib/caminos/partes.ts` | Sacar de `corregirLinea` la correspondencia vieja→nueva como función propia, sin cambiar su resultado |
| `lib/caminos/guardado.ts`, `app/actions/caminos.ts`, migración de `caminos` | Guardar esa correspondencia junto con la corrección |
| `lib/offline/sincronizacion.ts`, `paquete.ts`, `deposito.ts`, `calentar.ts`, `salir.ts` | Bajar circuitos, resolverlos, detectar cambios, nuevo estante, calentar sus pantallas, borrarlos al cerrar sesión |
| `components/mapa/mapa.tsx` | Capa del Circuito y de sus huecos |
| `types/database.ts` | Tipos compartidos, si se decide ponerlos ahí |
| `lib/salidas/*`, `hooks/use-registro-de-salida.ts` | Solo si Ale decide vincular Salidas con Circuitos |

Nada de Rutas se renombra ni se borra en la primera fase [propuesta]: Rutas
sigue funcionando hasta que Ale decida qué pasa con esa pantalla (pregunta 9).

### 1.6 Lo que dicen los documentos y no coincide

> ⚠️ `app/actions/caminos.ts` (comentario de cabecera) dice «Todavía no las usa
> ninguna pantalla y la tabla todavía no existe en la base», pero el código y
> la base dicen que `components/caminos/editor-de-camino.tsx` y
> `traer-caminos-de-afuera.tsx` las importan, y la migración
> `crear_caminos_en_mapas` está aplicada. Manda el código/la base. Se actualiza
> el comentario.

> ⚠️ `docs/ARQUITECTURA.md` dice que la incorporación de Caminos «todavía no se
> aplicó a la base ni se integró al mapa» y que «todavía falta dibujarlas en
> los mapas», pero la base tiene `caminos` y el código los dibuja en el mapa
> general y en la navegación libre. Manda el código/la base. Se actualiza el
> documento.

> ⚠️ `docs/ARQUITECTURA.md` y `docs/SCHEMA.md` (columna `rutas.geometria`) dicen
> que cada parte de una ruta lleva su condición de paso dentro del GeoJSON
> (decisión 033), pero esa decisión y su editor están **sin confirmar** en el
> árbol de trabajo (`docs/decisiones/033-partes-de-una-ruta.md`,
> `components/rutas/editor-de-partes.tsx` y `app/actions/partes-de-ruta.ts`
> aparecen como archivos nuevos sin commit). Manda el código confirmado. Se
> actualizan los documentos cuando Ale decida qué hacer con el prototipo.

> ⚠️ `docs/SCHEMA.md` dice que `salidas_fotos.orden` va de 0 a 3 («hasta cuatro
> fotos»), pero la base dice `orden >= 0 AND orden <= 29` (migración
> `salidas_hasta_30_fotos`). Manda la base. Se actualiza el documento.

> ⚠️ `docs/SCHEMA.md` dice «si el código dice otra cosa, manda esto», pero
> `docs/MANTENIMIENTO.md` y `AGENTS.md` dicen que mandan la base y el código.
> Manda `MANTENIMIENTO.md`. Se actualiza el encabezado. (Ya señalado en la
> auditoría de Caminos; sigue sin corregir.)

> ⚠️ `docs/GLOSARIO.md` («Anotación») dice que la hace «cualquier usuario desde
> la navegación», pero `docs/USUARIOS.md` y la migración
> `restringir_anotaciones_del_mapa_por_categoria` dicen que Normal solo
> consulta. Manda la base. Se actualiza el documento.

Riesgos observados en el código, no documentos [verificada]:

- Las líneas de **Rutas** se guardan con clave solo por número y **antes** del
  paquete. Si la puesta al día se corta entre las dos escrituras, el paquete
  viejo convive con líneas nuevas. Circuitos **no debe copiar** ese patrón:
  debe copiar el de Caminos (clave con versión, limpieza después).
- `borrarLoGuardadoEnElCelular` (cerrar sesión) borra paquete, líneas de rutas,
  pendientes, registros y mapas, **pero no el estante de líneas de Caminos**.
  Al sumar Circuitos conviene corregir las dos cosas juntas.

---

## 2. Modelo de datos propuesto

### 2.1 Lo común a todas las alternativas [propuesta]

Un Circuito es una **lista ordenada de segmentos**. Cada segmento es de uno de
dos tipos:

- **Propio**: una línea dibujada solo para este Circuito
  (`coordenadas: [[lon, lat], ...]`, al menos dos puntos distintos). No crea
  nada en Mapas.
- **De Camino**: una porción continua de un Camino, descrita como

  ```text
  camino_id          número del Camino
  desde_m, hasta_m   metros sobre la línea del Camino, en la versión anclada
  sentido            "a_favor" (desde < hasta) o "en_contra" (se recorre al revés)
  version_forma      la versión de la línea con la que se eligieron los metros
  extremos           [[lon, lat], [lon, lat]] del comienzo y el final elegidos,
                     tal como estaban al anclar (testigo, ver sección 3)
  ```

  Se guarda siempre `desde_m < hasta_m` y el sentido aparte: así el intervalo
  se valida igual que una parte, y el sentido no depende de un signo.

**Orden y repetición.** El orden es la posición en la lista. Un mismo Camino,
e incluso el mismo intervalo, puede aparecer más de una vez (ida y vuelta,
dos pasadas por un tramo): cada aparición es un segmento independiente con su
propio sentido. No hay restricción de unicidad. Si Ale decide prohibir la
repetición (pregunta 6), la regla va en la validación, no en la forma del dato.

**Límites de clasificación ≠ extremos del Circuito.** Los extremos del segmento
son metros elegidos por quien arma el Circuito; los límites de las partes del
Camino son de la clasificación. **Nunca se guarda un índice de parte**
(`parte_indice` existe en el dibujo, pero cambia al partir). Al mostrar o
avisar, se cruza el intervalo del segmento con las partes **actuales** del
Camino (`parteEn`, `tramoDeLinea`) y se obtiene qué clasificaciones atraviesa.

**Por qué esto resiste reclasificar** [verificada como hecho de partida]:
partir, clasificar, cambiar datos compartidos o cambiar actividades no tocan
`geometria`; la base no sube `version_forma`; los metros del segmento siguen
apuntando al mismo lugar.

**Lo que el Circuito no guarda** [propuesta]: ni copia de las partes, ni de su
clasificación, ni de la línea del Camino. La línea resuelta se arma en el
celular a partir del Camino de esa misma puesta al día (sección 5).

### 2.2 Alternativa A — segmentos dentro de la fila del Circuito (recomendada)

```text
circuitos
  id, perfil_id, nombre, descripcion,
  segmentos jsonb          lista ordenada (2.1)
  caminos_usados bigint[]  lo llena un disparador desde `segmentos`
  version_circuito integer sube sola cuando cambia `segmentos`
  creado_en, actualizado_en, eliminado_en
  (+ datos globales que Ale decida: actividades, esfuerzo, etc.)
```

- **A favor:** un solo guardado atómico, el mismo bloqueo optimista por
  `actualizado_en` que ya usa Caminos, el mismo estilo que `caminos.partes`
  (validación por función en `privado`), una fila por Circuito en la puesta al
  día (sin tandas anidadas), reordenar es reescribir la lista.
- **En contra:** la base no puede poner clave foránea dentro del JSON. Se
  compensa con `caminos_usados` (índice GIN para «qué Circuitos usan el
  Camino X») y con una comprobación en el disparador de que cada Camino
  nombrado exista.

### 2.3 Alternativa B — tabla de segmentos aparte

```text
circuitos            id, perfil_id, nombre, ..., fechas
segmentos_de_circuito
  id, circuito_id → circuitos, orden, tipo,
  camino_id → caminos (nulo si es propio),
  desde_m, hasta_m, sentido, version_forma, extremos jsonb, coordenadas jsonb,
  fechas
```

- **A favor:** clave foránea real a `caminos`; consultas simples por Camino.
- **En contra:** guardar un Circuito son muchas filas. Supabase desde la app no
  tiene transacciones: hace falta una función en la base para que no quede un
  Circuito a medias. Reordenar choca con un índice único de `orden`. La puesta al
  día suma otra tabla con su propio tope de 1000 filas y su recuento. El
  bloqueo optimista tiene que cubrir dos tablas.

### 2.4 Alternativa descartada — copia congelada de la línea

Guardar solo la línea resultante, sin vínculo. Es lo más simple, pero
**contradice la decisión 042**: el Circuito no seguiría las correcciones. Solo
se menciona porque el **testigo** de extremos de 2.1 es una copia mínima, y no
reemplaza al vínculo.

**Recomendación** [propuesta]: Alternativa A. Es la de menos piezas, repite un
patrón que ya pasó revisión en Caminos y no obliga a escribir una función de
guardado transaccional. Si más adelante hace falta consultar segmentos sueltos
a escala, se puede pasar a B sin cambiar el significado de los datos.

---

## 3. Corrección de un Camino

Regla de producto (decisión 042): **el Circuito sigue la línea corregida y avisa
antes de salir**. Lo que sigue es cómo calcular dónde quedan sus extremos.

### 3.1 Alternativas de anclaje

| | Cómo traslada los extremos | A favor | En contra |
|---|---|---|---|
| **1. Correspondencia guardada** | Al corregir, se guarda la función vieja→nueva que ya calcula `corregirLinea` (invertida o no, y los pares `[0→0]`, `[fin intacto viejo→nuevo]`, `[inicio intacto final viejo→nuevo]`, `[largo viejo→largo nuevo]`). Los metros del segmento se pasan por esa función, versión por versión. | Mueve los extremos **con la misma regla que las partes**: si el Circuito empezaba justo donde empezaba una parte, sigue empezando ahí. Determinista: todos los celulares calculan lo mismo. No adivina. | Hay que tocar el guardado de Caminos (área en prueba) y la base. Las correcciones hechas antes de existir esto no tienen correspondencia. |
| **2. Reubicación geográfica** | Con el testigo `extremos`, se busca el punto más cercano en la línea nueva (`ubicarEnLinea`). | No toca Caminos. Sirve aunque falten versiones intermedias. | Falla con líneas que pasan dos veces cerca del mismo lugar (ida y vuelta, rulos), con extremos que se movieron mucho, y no conserva el criterio de las partes. |
| **3. Por partes** | Anclar al índice o a los límites de una parte. | — | **Se rompe al partir o reclasificar.** Descartada. |

**Recomendación** [propuesta]: **1 como regla, 2 como control y respaldo**.

- Se traslada por correspondencia. Después se mira el testigo: si un extremo
  estaba en la parte **intacta** de la línea, tiene que caer a menos de 1 m de
  su lugar original; si no, algo no cuadra y se marca «a revisar».
- Si falta alguna correspondencia (corrección anterior a esta función, o una
  escritura que no llegó), se reubica geográficamente y el segmento queda
  marcado **siempre** «a revisar», aunque el resultado parezca bueno.
- Para guardar la correspondencia de forma atómica [propuesta]: una columna
  `ultima_correspondencia jsonb` en `caminos`, que la app escribe en el mismo
  `UPDATE` que la línea, y un disparador que la copia a una tabla de solo
  agregar `correcciones_de_caminos (camino_id, version_desde, version_hasta,
  correspondencia, fechas)` y valida su forma (pares crecientes, que empiezan
  en 0 y terminan en los dos largos). La regla sigue escrita una sola vez, en
  TypeScript, sacándola de `corregirLinea` como función propia. **No se duplica
  en SQL.**

### 3.2 Estados que puede tener un segmento de Camino [propuesta]

| Estado | Cuándo | Qué se muestra |
|---|---|---|
| `igual` | La versión del Camino es la anclada | Nada |
| `siguio` | Hubo corrección, el traslado es confiable | Aviso «cambió el Circuito» antes de salir, con el largo antes y después |
| `a_revisar` | Hubo corrección y el traslado no es seguro | Aviso más fuerte antes de salir, señalando la parte en el mapa. La línea que se dibuja es **siempre la corregida**, nunca la vieja |
| `sin_lugar` | El tramo elegido desapareció entero de la línea | Se dibuja como separación: el Circuito queda con partes sin unir (sección 4) |
| `camino_retirado` | El Camino fue retirado | La parte sigue visible con aviso antes de salir (decisión posterior 045) |

Así **nunca se cambia la regla en silencio**: el Circuito sigue la corrección
en todos los casos; lo único que varía es cuán fuerte avisa.

La marca «a revisar» desaparece cuando el autor (o el Administrador) abre el
Circuito y lo vuelve a guardar: al guardar, todos los segmentos se reanclan en
la versión actual de cada Camino, con su testigo nuevo [propuesta]. Qué pasa
con el aviso «cambió el Circuito» en los celulares de los demás es la pregunta 4.

### 3.3 Ejemplos

Camino de 1.000 m, versión 1. Un Circuito usa `desde 200 → hasta 600`, a favor.

1. **Cambio simple.** Se corre un vértice que está a los 400 m; la línea pasa a
   1.020 m. Intacto al comienzo hasta 350 m, intacto al final desde 450 m (ahora
   470 m). El 200 queda en 200 (intacto, el testigo coincide). El 600 cae en el
   final intacto: pasa a 620. Estado `siguio`; el segmento midió 400 m y ahora
   420 m.
2. **Inserción de puntos.** Se agregan tres puntos entre los 300 y los 500 m sin
   cambiar la forma general; el largo apenas cambia. Los dos extremos están en
   zonas intactas, se trasladan exactos. Estado `siguio` (o `igual` en la
   práctica, si se decide no avisar cambios menores a un metro: ver nota al
   final).
3. **Desvío grande.** Entre los 300 y los 500 m se reemplaza la línea por un
   rodeo de 800 m; total 1.600 m. El 200 sigue en 200. El 600 cae en el final
   intacto: 1.200. El segmento pasa de 400 m a 1.000 m y sigue el rodeo.
   Estado `siguio` con el aviso del largo. Si en cambio el extremo hubiera sido
   **400** (adentro de lo cambiado), la proporción lo deja en la mitad del
   rodeo, a 700 m: ese punto no tiene relación geográfica con el original.
   Estado `a_revisar`.
4. **Extremos movidos.** Se recorta el comienzo del Camino: los primeros 100 m
   se borran. No hay comienzo intacto; el final está intacto. Si el Circuito
   empezaba en 200, la proporción lo lleva cerca de 100 de la línea nueva; el
   testigo dice que está a menos de 1 m de su lugar: estado `siguio`. Si el
   Circuito empezaba en **0** (el comienzo del Camino), sigue al comienzo nuevo,
   que está 100 m más adelante: `siguio`, con aviso. Si se **alarga** una punta
   que el Circuito usaba hasta el final, el Circuito se alarga con ella; si eso
   es lo que Ale quiere es la pregunta 5.
5. **Ambigüedad imposible de resolver con certeza.** (a) El Camino es un rulo
   que empieza y termina en el mismo lugar, y la corrección lo da vuelta:
   `corregirLinea` no detecta la inversión porque comienzo y final coinciden, y
   la proporción ubica los extremos en el sentido equivocado. (b) Se redibuja
   el Camino entero sin ningún punto en común: todo es «zona cambiada». (c) Una
   corrección sin correspondencia guardada sobre un ida y vuelta: el punto más
   cercano puede caer en la ida o en la vuelta. En los tres casos: se dibuja la
   mejor estimación sobre la línea **corregida**, estado `a_revisar`, y el aviso
   dice qué parte hay que mirar. Si la estimación es imposible (el intervalo
   quedó de largo cero), `sin_lugar`.

**Nota:** no se propone un umbral para «cambio insignificante». Cualquier
corrección de un Camino usado produce aviso, aunque sea de centímetros, hasta
que Ale diga otra cosa. Avisar de más en casa es la regla.

---

## 4. Integridad del Circuito

### 4.1 Partes separadas [propuesta]

- Al resolver el Circuito se obtiene, para cada segmento, su punto de comienzo
  y de final **en el sentido de marcha**. Hay hueco entre el segmento *i* y el
  *i+1* si el final del primero y el comienzo del segundo están a más de
  **0,5 m** (margen de redondeo, no regla de producto).
- El editor «une» dos partes copiando exactamente la coordenada: un segmento
  propio que arranca en el final de un tramo de Camino empieza en ese mismo
  punto. Lo que el editor no unió, no está unido. **Nunca se agrega una línea
  de enlace**, ni en el dato ni en el dibujo.
- Si Ale quiere que una separación chica cuente como unida, se cambia ese
  margen (pregunta 7). Mientras tanto, solo cuenta lo que se tocó a propósito.
- El estado incompleto **no se guarda en la base**: se calcula a partir de los
  segmentos resueltos, porque también puede aparecer por una corrección de un
  Camino (un extremo que se movió y ya no toca al vecino). Se guarda la lista
  de huecos en la línea resuelta del celular, con su ubicación, para que la
  ficha y la navegación la muestren sin calcular.
- **No bloquea el guardado** (decisión 043). El editor muestra el aviso «Partes
  sin unir: faltan N uniones» y marca cada separación en el mapa.
- En el mapa, el hueco se marca con dos extremos visibles y, si el boceto lo
  aprueba, un símbolo en cada punta. **No** con una línea entre ellos.

### 4.2 Incompleto no es «sin paso» [propuesta]

| | Partes sin unir | Parte sin paso |
|---|---|---|
| Qué describe | El Circuito: dos segmentos que no se tocan | El terreno: una parte de un Camino, para una actividad |
| De dónde sale | Geometría del Circuito resuelto | `partes[i].por_actividad[actividad].paso` del Camino |
| Quién lo cambia | Quien edita el Circuito, o una corrección de un Camino | Quien clasifica el Camino |
| Se guarda | No; se calcula al resolver | En el Camino |
| Aviso | «Partes sin unir» | «Tu Circuito pasa por una parte marcada sin paso» |

Para avisar «sin paso» hace falta saber **qué actividad** mira el Circuito. Eso
depende de los datos globales del Circuito, que siguen sin decidir (pregunta 3).

### 4.3 Preguntas que quedan abiertas

- **Camino retirado** usado por un Circuito (pregunta 1). La base lo sigue
  dejando leer, así que técnicamente se puede seguir mostrando su última
  línea; o se puede convertir en hueco.
- **Clasificación que cambia** en una parte usada (pregunta 2): cuáles cambios
  merecen aviso antes de salir.
- **Orden y repetición** (pregunta 6): si se puede pasar dos veces por el mismo
  tramo y si el Circuito tiene que volver al punto de partida.
- **Relación con Salidas** (pregunta 8): hoy `salidas.ruta_id` apunta a
  `rutas`. No se toca sin decisión.

---

## 5. Preparación sin señal

### 5.1 Qué se guarda [propuesta]

| Qué | Dónde | Clave |
|---|---|---|
| Circuito sin línea: nombre, datos, segmentos anclados, `version_circuito`, `actualizado_en` | Paquete (guardado simple), `formato` 4 | — |
| **Línea resuelta**: un `FeatureCollection`, una línea por segmento en orden de marcha, con `orden`, `tipo`, `camino_id`, `version_forma` usada, estado del segmento; más la lista de huecos | Depósito grande, estante nuevo `lineas-de-circuitos` (sube `VERSION` del depósito a 7) | `id:actualizadoEn:huella` |
| Avisos del Circuito pendientes de mostrar | Guardado simple, aparte del paquete | por Circuito |

La **huella** es una cadena corta armada con `version_forma` y `actualizado_en`
de cada Camino que usa el Circuito. Si cambia un Camino usado, cambia la clave:
el paquete viejo sigue encontrando su línea vieja hasta que el nuevo queda
guardado, igual que hoy con las líneas de Caminos.

### 5.2 Cómo se actualiza [propuesta]

Dentro de `sincronizarPaquete`, en este orden:

1. Sumar `circuitos` a `TABLAS_DEL_PAQUETE` (la política de lectura deja ver
   también los retirados, así una baja mueve la fecha de novedades).
2. Bajar Circuitos vivos por tandas ordenadas por `id`, contando contra el
   total como ya se hace con Caminos.
3. Si un Circuito usa un Camino que no vino en la lista de vivos (retirado),
   pedir esos Caminos por número, en un pedido con tope. La respuesta a la
   pregunta 1 dice qué se hace con ellos.
4. **Resolver cada Circuito con los Caminos bajados en esta misma puesta al
   día**, nunca con líneas guardadas de antes. Trasladar extremos (sección 3),
   recortar con `tramoDeLinea`, dar vuelta si el sentido es en contra, juntar
   segmentos propios, detectar huecos.
5. **Detectar cambios**: comparar, por Circuito, la resolución nueva con la del
   paquete viejo (`guardado`). Hay cambio si cambió la huella, si apareció un
   estado `siguio`, `a_revisar`, `sin_lugar` o `camino_retirado`, si cambió la
   cantidad de huecos, o si cambió lo que pide la pregunta 2. Con eso se arma
   la lista de avisos y se guarda **antes** que el paquete.
6. Guardar líneas de Caminos y de Circuitos (en una transacción del depósito),
   después el paquete, después borrar las líneas que sobran.
7. Si cualquier paso falla, queda lo que había y el motivo se muestra: «No se
   pudo preparar el Circuito X: … Abrí la app con conexión antes de salir.»

Como la puesta al día solo corre con señal que sirve y nunca con la
navegación abierta, **el aviso siempre nace en casa** [verificada como regla
existente].

### 5.3 Cómo se sabe antes de salir [propuesta]

- **Ficha del Circuito** (lee solo lo guardado): muestra, en este orden, los
  avisos de cambio, partes sin unir, partes sin paso para la actividad del
  Circuito, y mapas que faltan, cada uno con qué pasó y qué hacer.
- **Inicio**: una tarjeta por Circuito con avisos, con la misma separación que
  ya usa `useLoQueFalta` (pérdida en franja ámbar arriba; tarea en tarjeta
  común).
- **Mapas que faltan**: `calcularCobertura` sobre la línea resuelta, con los
  sectores bajados. En los huecos no hay línea, así que la cobertura no los
  cuenta; si se avisa algo sobre el terreno del hueco es la pregunta 7b.
- **La navegación** repite los avisos que ya conoce (es lectura local, no
  sale a internet), pero nunca es el primer lugar donde aparecen.

### 5.4 Cómo se evita mezclar versiones [propuesta]

- La navegación de un Circuito lee **solo** su línea resuelta por la clave del
  paquete actual. No vuelve a resolver con líneas de Caminos.
- La capa de Caminos que se dibuja alrededor sale del mismo paquete, así que
  Circuito y Caminos vienen de la misma puesta al día.
- Si la línea resuelta no está en el depósito (borrado del navegador, espacio),
  la ficha lo dice en casa y la navegación lo dice con cartel; **no** se arma
  una línea con lo que haya.

### 5.5 Pantallas que se dejan listas [propuesta]

Calentar `/circuitos`, cada ficha y cada navegación de Circuito. Las de crear y
editar no se calientan. El nombre exacto de las direcciones sale del boceto.

---

## 6. Permisos y seguridad

### 6.1 Tabla propuesta (Alternativa A), sin ejecutar [propuesta]

Todo en una sola tanda, con el mismo formato que `scripts/supabase-caminos.sql`:

- `public.circuitos` con `id bigint identity`, `perfil_id uuid not null →
  perfiles`, `nombre` (1 a 120 caracteres, mismo tope que Caminos salvo que Ale
  diga otro), `descripcion` (hasta 2.000), `segmentos jsonb not null`,
  `caminos_usados bigint[] not null default '{}'`, `version_circuito integer not
  null default 1`, `creado_en`, `actualizado_en`, `eliminado_en`, y los datos
  globales que Ale decida.
- Restricciones: `privado.segmentos_de_circuito_validos(segmentos)` exige al
  menos un segmento; tipo `propio` o `de_camino`; líneas propias con
  coordenadas reales y al menos dos puntos distintos; en los de Camino,
  `0 <= desde_m < hasta_m`, `sentido` válido, `version_forma >= 1`, testigo con
  dos coordenadas reales. **No exige que los segmentos se toquen** (decisión
  043).
- Disparadores:
  - `t_circuitos` con `public.marcar_actualizado_en()` (el de todas las tablas).
  - `privado.cuidar_circuito_al_cambiar`: autor y fecha de creación fijos;
    retirado no se modifica ni se recupera (mismo criterio que la decisión 040,
    **a confirmar para Circuitos**, ver nota); recalcula `caminos_usados`; sube
    `version_circuito` si cambian los segmentos.
  - Al insertar o cambiar segmentos: cada `camino_id` **nuevo o reanclado**
    tiene que existir, estar vivo y estar en la `version_forma` actual. Los
    segmentos que no cambiaron no se revalidan, para que un Camino retirado
    después no impida cambiar el nombre del Circuito.
- RLS activa y, en la misma tanda, permisos:
  - `circuitos_ver`: select para `authenticated`, con `using (true)` (también
    retirados, para que la baja llegue a los celulares; la app pide los vivos).
  - `circuitos_crear`: insert si `perfil_id = auth.uid()`, vivo, y categoría
    Administrador o Premium.
  - `circuitos_editar_propios`: update de Premium sobre lo propio vivo.
  - `circuitos_editar_todos_el_administrador`: update del Administrador sobre
    cualquiera vivo.
  - `revoke all` a `public`, `anon`, `authenticated`; `revoke delete, truncate`
    también a `service_role`; `grant select` a `authenticated`; `grant insert`
    y `grant update` **por columna**, sin `id`, `perfil_id` (al cambiar),
    `creado_en`, `version_circuito` ni `caminos_usados`.
- Índices: `perfil_id`, `actualizado_en desc`, GIN sobre `caminos_usados`.

Normal **solo lee**, igual que en Caminos (decisión del 2026-10-05 en
`docs/USUARIOS.md`). Que todos los usuarios con sesión vean todos los
Circuitos se deduce de «Normal solo podrá consultarlos»; si Ale quisiera
Circuitos privados, cambia la política de lectura [propuesta deducida].

**Nota:** la decisión 040 (no recuperar retirados) es de Caminos. Para
Circuitos se propone lo mismo por coherencia, pero no está decidido.

### 6.2 Concurrencia [propuesta]

- **Dos personas editando el mismo Circuito**: bloqueo optimista por
  `actualizado_en`, igual que `actualizarSiNadieCambio` de Caminos. El segundo
  recibe «Este Circuito cambió desde que lo abriste…» y no se pisa nada.
- **Un Camino se corrige mientras alguien edita un Circuito que lo usa**: al
  guardar, el servidor compara la `version_forma` con la que se anclaron los
  segmentos tocados. Si cambió, no guarda y dice «El Camino X se corrigió
  mientras armabas el Circuito. Volvé a abrirlo para ver la línea nueva». La
  base lo vuelve a exigir con el disparador.
- **Corregir un Camino nunca escribe en Circuitos ajenos.** El traslado se
  calcula al leer. Así un Premium que corrige lo suyo no necesita permiso
  sobre los Circuitos del Administrador, y no se producen choques de
  `actualizado_en` en editores abiertos.

### 6.3 Referencias a Caminos retirados [propuesta]

- La base no borra el Camino, así que la referencia nunca queda colgando: el
  número sigue existiendo y su última línea se puede leer.
- Lo que no se permite es **anclar de nuevo** a un Camino retirado.
- La decisión posterior 045 exige mantener esa parte visible con un aviso
  antes de salir. La forma de conservar la línea sigue siendo una propuesta
  técnica por resolver. El aviso debe identificar el Camino retirado.

---

## 7. Secuencia de implementación

Cada paso termina con `npx tsc --noEmit`, `npm run lint` y las pruebas en
verde, y con commit propio. Ninguno se publica sin que Ale lo diga.

| Paso | Qué | Archivos | Pruebas | Espera |
|---|---|---|---|---|
| 0 | Preservar el prototipo local de partes de ruta y abrir una copia de trabajo aislada por agente | (git) | — | Que Ale diga qué hacer con el prototipo |
| 1 | **Lógica pura de segmentos**: tipos, resolver un segmento de Camino con sentido, juntar segmentos, detectar huecos, estado por segmento, cruce con partes actuales | `lib/circuitos/segmentos.ts`, `lib/circuitos/huecos.ts` + pruebas | Sentido en contra, ida y vuelta por el mismo tramo, dos Caminos que se tocan, hueco de 1 m, segmentos propios, reclasificar sin romper | Preguntas 3 y 6 para validar repetición y actividad |
| 2 | **Traslado de extremos**: por correspondencia y respaldo geográfico, con testigo | `lib/circuitos/traslado.ts` + pruebas | Los cinco ejemplos de 3.3, rulo invertido, redibujo total, intervalo que desaparece | Pregunta 5 |
| 3 | **Correspondencia de corrección en Caminos**: sacarla de `corregirLinea` sin cambiar su resultado; guardarla al corregir | `lib/caminos/partes.ts`, `lib/caminos/guardado.ts`, `app/actions/caminos.ts`, migración nueva de `caminos` | Las pruebas actuales de `partes` y `guardado` siguen igual; nuevas: la correspondencia mueve los límites igual que las partes | Fin de la prueba de Caminos; Ale aprueba el SQL antes de aplicarlo |
| 4 | **SQL de Circuitos preparado**, sin aplicar | `scripts/supabase-circuitos.sql` | Consultas de verificación de solo lectura en el mismo archivo | Preguntas 1 y 3; Ale aprueba antes de aplicar |
| 5 | **Datos y guardado**: leer fila, validar, crear, editar con bloqueo optimista, retirar, permisos | `lib/circuitos/datos.ts`, `guardado.ts`, `permisos.ts`, `app/actions/circuitos.ts` + pruebas con base falsa | Las tres categorías, choque de ediciones, Camino corregido durante la edición, Camino retirado | Paso 4 aplicado |
| 6 | **Boceto** del editor, ficha, avisos y navegación del Circuito | `docs/bocetos/*` | — | **Aprobación de Ale** antes de cualquier pantalla |
| 7 | **Puesta al día**: bajar, resolver, detectar cambios, guardar con clave versionada, limpiar, cerrar sesión | `lib/offline/sincronizacion.ts`, `paquete.ts`, `deposito.ts`, `lineas-de-circuitos.ts`, `salir.ts`, `calentar.ts` + pruebas | Puesta al día cortada a mitad (queda lo anterior), cambio detectado una vez, aviso que no se pierde, nunca con navegación abierta | Integración; un solo dueño de esos archivos |
| 8 | **Pantallas** de lista, ficha y editor (computadora, con conexión) | `components/circuitos/*`, `app/(app)/circuitos/*`, `components/mapa/mapa.tsx` (capa nueva) | Revisión sol y noche, estados vacío/cargando/falla | Boceto aprobado |
| 9 | **Navegación de Circuito** solo con lo guardado | pantalla nueva en `components/navegacion/` | Prueba real **en modo avión**: línea, huecos, avisos, GPS viejo | Boceto aprobado |
| 10 | **Salidas** | `lib/salidas/*`, `hooks/use-registro-de-salida.ts`, base | — | Pregunta 8 |
| 11 | Documentos: `SCHEMA.md`, `ARQUITECTURA.md`, `GLOSARIO.md` (segmento, partes sin unir, cambió el Circuito, a revisar), decisiones nuevas, `SESIONES.md` | `docs/*` | — | — |

**Pruebas automáticas que cuentan como críticas** [propuesta]: resolución de
segmentos con sentido, detección de huecos, traslado de extremos, detección
de cambios en la puesta al día, y que la navegación de Circuito no haga ningún
pedido de red. Son las que, si fallan, no rompen nada visible: dibujan una
línea corrida o se callan un aviso.

### 7.1 Aislar el trabajo de Claude y el de Codex [propuesta]

- Una copia de trabajo (rama propia) por agente, creada **después** de
  preservar el prototipo local, como ya pide el plan de separación.
- **Claude**: pasos 1, 2, 4 y 5 — todo en archivos nuevos
  (`lib/circuitos/*`, `app/actions/circuitos.ts`, `scripts/supabase-circuitos.sql`).
  No toca nada existente.
- **Codex**: boceto del editor (paso 6) y cierre de la prueba de Caminos.
- **Turnos para archivos compartidos** (pasos 3, 7, 8, 9): uno solo por vez,
  anunciado por escrito antes de empezar y cerrado con commit. Orden sugerido:
  primero el paso 3 (Caminos, quien tenga ese módulo), después el 7, después
  el 8 y el 9.
- El contrato entre las dos mitades es la interfaz del paso 1: lo que entra
  (Camino guardado + segmentos) y lo que sale (línea resuelta, huecos, estado
  por segmento). Si alguno necesita cambiarla, se acuerda antes.

---

## 8. Preguntas mínimas para Alejandro

Solo decisiones de uso. Cada una tiene la consecuencia si no se responde.

**Frenan la lógica de la primera fase:**

1. **Respondida en la decisión 045.** Si se retira un Camino que usa tu
   Circuito, esa parte sigue visible con un aviso antes de salir.
2. **Si cambia la clasificación de una parte que usa tu Circuito, ¿se avisa
   antes de salir?** (a) solo si pasa a «a pie» o «sin paso», (b) cualquier
   cambio, o (c) no se avisa. *Sin respuesta:* solo se avisan correcciones de
   la línea.
3. **¿Un Circuito dice para qué actividad es?** (a) una sola, (b) una o más,
   o (c) no dice. *Sin respuesta:* no se puede avisar «pasa por una parte sin
   paso», porque eso depende de la actividad.
4. **El aviso «cambió el Circuito»:** (a) se va cuando lo mirás en tu celular, o
   (b) queda hasta que el autor del Circuito lo revise y lo vuelva a guardar.
   *Sin respuesta:* queda hasta que el autor lo revise (avisar de más en casa).
5. **Si un Camino se alarga o se acorta justo en la punta donde terminaba tu
   Circuito:** (a) el Circuito sigue la punta nueva, o (b) se queda en el lugar
   donde terminaba. *Sin respuesta:* sigue la punta nueva y avisa.

**Pueden esperar al boceto:**

6. **¿Se puede pasar dos veces por el mismo tramo y terminar en otro lugar que
   el de partida?** (a) las dos cosas sí, (b) repetir sí, pero vuelve al inicio,
   o (c) ninguna. *Sin respuesta:* se permite todo; el dato lo soporta.
7. **Partes casi unidas:** (a) solo cuentan como unidas si las uniste en el
   editor, o (b) también si quedan a menos de unos metros. Y además: ¿la app te
   sugiere mapas para la zona del hueco? (sí / no). *Sin respuesta:* solo lo
   unido a propósito, y sin sugerir mapas del hueco.
8. **Al registrar una salida navegando un Circuito, ¿la salida queda vinculada
   a ese Circuito?** (a) sí, o (b) no. *Sin respuesta:* no se toca Salidas.
9. **¿Qué pasa con la pantalla «Rutas» cuando exista Circuitos?** (a) convive
   un tiempo, o (b) se retira cuando Circuitos esté probado. Las rutas viejas no
   se migran en ningún caso. *Sin respuesta:* convive y no se toca.

No se pregunta nada técnico: el anclaje en metros, la correspondencia, el
modelo de tabla y la forma de detectar cambios son propuestas de este informe.

---

## Auditoría de fuentes

**Leído en tiempo real (2026-10-07):**

- Documentos: `AGENTS.md`; el encargo; `docs/planes/2026-10-05-mapas-caminos-circuitos.md`;
  decisiones 034 a 043; `docs/USUARIOS.md`; `docs/ARQUITECTURA.md`;
  `docs/SCHEMA.md`; `docs/GLOSARIO.md`; `docs/MANTENIMIENTO.md`;
  `docs/planes/auditoria-circuitos-codex.md`; secciones 3.4, 3.5 y 8 de
  `docs/planes/auditoria-caminos-claude.md`.
- Base, solo catálogo con las herramientas de Supabase (sin filas, sin SQL):
  lista de migraciones aplicadas y columnas, claves primarias y foráneas de
  todas las tablas de `public`.
- Migración: `scripts/supabase-caminos.sql` completo.
- Código: `lib/caminos/geometria.ts`, `partes.ts`, `permisos.ts`, `dibujo.ts`,
  parte de `datos.ts` y `guardado.ts`; `app/actions/caminos.ts`;
  `lib/offline/paquete.ts`, `sincronizacion.ts`, `lineas-de-caminos.ts`,
  `recorridos.ts`, `salir.ts`, parte de `puesta-al-dia.ts`, `calentar.ts` y
  `deposito.ts`; `hooks/use-caminos-guardados.ts`, parte de
  `hooks/use-lo-que-falta.ts`; `lib/cobertura.ts` (cálculo de cobertura);
  `app/(app)/page.tsx`; búsquedas de `caminos`, `ruta_id` y `rutaId` en
  `app`, `components`, `hooks`, `lib` y `types`; las referencias a Caminos en
  `components/mapa/mapa.tsx`, `components/zonas/mapa-general-de-zonas.tsx` y
  `components/navegacion/pantalla-de-mapa-libre.tsx`; los usos de datos en
  `components/navegacion/pantalla-de-navegacion.tsx`; estado de Git.

**Inferido:**

- Que la correspondencia de `corregirLinea` es la regla correcta para trasladar
  extremos de Circuitos: se deduce de que la decisión 042 pide «seguir la
  corrección» y la 037 define cómo se mueven los límites de las partes.
- Que todos los usuarios con sesión ven todos los Circuitos: se deduce de
  «Normal solo podrá consultarlos».
- Que todos los Circuitos viajan en el paquete, como hoy las rutas: se deduce
  del modelo de descarga vigente; nadie lo decidió para Circuitos.
- Los márgenes de 0,5 m (huecos) y 1 m (testigo) son de redondeo, no reglas de
  producto.

**Pendiente de verificación:**

- Las nueve preguntas de la sección 8.
- Que el traslado por correspondencia funcione con correcciones reales del KML
  de Ascochinga: se prueba en el paso 2 con casos armados, y en el paso 3 con
  una corrección real.
- Las políticas de `rutas`, `zonas` y `sectores` (borrado físico permitido en
  `rutas`, lectura de borrados): no se volvieron a leer; se toman de la
  auditoría de Caminos y no afectan la propuesta.
- El estado de la prueba de Caminos con las tres categorías y en modo avión:
  sigue pendiente según el plan; Circuitos depende de ella.
- El editor, la navegación y los avisos de Circuitos: no existen; ninguna parte
  de este informe se presenta como implementada.
