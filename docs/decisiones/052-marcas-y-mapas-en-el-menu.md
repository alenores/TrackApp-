# 052 — Marcas, y Mapas con sus entradas en el menú

**Decidido por Ale:** 2026-10-13, en una charla de definición. Ale decidió
saltear el boceto para este cambio porque el diseño quedó definido punto por
punto en la charla: se revisa directamente en la app.

## Decisión

### Marcas: una sola familia

Todo lo que se dibuja encima del mapa se llama **marca**: Caminos, puntos,
trazos, tranqueras y alambrados. **«Anotación» se retira** como palabra de la
app. En el código y en la tabla vieja de la base sigue el nombre `anotaciones`,
igual que «ruta» quedó en carpetas y tablas viejas.

- **Camino** sigue siendo distinto de un trazo: tiene actividades,
  clasificación por partes, largo y alturas calculados, y es lo único que arma
  un Circuito. Un trazo es una línea para mirar, con color y comentario.
- **Tranqueras y alambrados** los trae OpenStreetMap solos al **crear una
  zona**: todo lo que toca la zona, entero, sin recortar en el borde; nada de
  afuera. Nadie los pide ni los elige. Quedan **fijos**: no se corrigen ni se
  borran, no se vuelven a buscar solos, y si la zona se borra se quedan. Volver
  a pedirlos nunca los repite. Si OpenStreetMap no contesta, se dice al guardar
  la zona, con el motivo y para reintentar.
- Un punto con ícono de tranquera marcado a mano es un **punto**, no una
  tranquera: tranquera es solo lo que vino de OpenStreetMap.
- Caminos, puntos y trazos llegan al celular siempre, sin límite de zona: los
  carga gente de Córdoba para Córdoba. El límite de zona es solo para
  OpenStreetMap, que tiene datos de todo el mundo.
- Zonas y sectores **ya no cargan marcas**: se sacó la pantalla de anotaciones
  del sector y su botón de OpenStreetMap. Borrar una zona o un sector **no
  borra las marcas** que caen adentro.
- Marcar desde la navegación no cambia, salvo el nombre: el botón dice
  «Marcas».

Peso estimado de tranqueras y alambrados: unos 100 KB por zona de sierra,
menos de 1 % de un mapa. Por eso viajan siempre, sin preguntar.

### Agregar marcas

El «+» lo ven Administrador y Premium. Primero se elige **a mano** o **traer
de afuera**:

- **Traer de afuera**: un archivo de Google Earth o de un GPS. Cada línea se
  decide como Camino, trazo u omitir; cada punto se suma o no.
- **A mano**: primero se elige qué es —Camino, punto o trazo— y después se
  dibuja **sobre el mapa propio**, nunca sobre Google (decisión 050). Un
  Camino dibujado pide nombre y actividades **al terminar la línea**; largo,
  alturas y desnivel los calcula la app al guardar (decisión 049).

Antes de esto un Camino solo se creaba trayendo un archivo. No había una
decisión que lo pidiera: era cómo se había construido.

### Mapas: cuatro entradas en el menú

Mapas deja de tener pestañas adentro. Sus entradas van en el menú, en este
orden: **Consultas, Marcas, Zonas y Descargas**. En la computadora se
despliegan en la barra lateral; en el celular, tocar «Mapas» sube un panel
para elegir. Cada pantalla queda limpia, con solo su nombre arriba.

- **Consultas**, para todo público: el mapa con todo lo marcado y las zonas.
  Filtros simples: la actividad (decide qué clasificación de los Caminos se
  destaca) y prender o apagar **Caminos**, **Zonas** y **Detalles**. Detalles
  junta puntos, trazos, tranqueras y alambrados. Reemplaza al mapa general.
- **Marcas**, para todos; Normal consulta sin «+» y sin editar. Lista agrupada
  por clase con tildes por marca y por grupo, las zonas como un grupo más,
  filtros por clase, actividad de los Caminos y autor. En el mapa queda lo
  tildado que pasa los filtros. Tocar un renglón lo muestra en el mapa; editar
  y eliminar van en los tres puntos.
- Lo elegido —tildes, filtros y capas— se recuerda en el celular.

### Lista y mapa: dos momentos

Elegir qué ver y mirarlo son dos momentos distintos, a un gesto de distancia:

- **En la computadora**, lista y mapa lado a lado.
- **En el celular**, el mapa ocupa la pantalla y la lista es un panel que sube
  desde abajo. Bajado queda una barrita con el resumen. Se baja con el dedo,
  con «Ver mapa» o con el botón físico de atrás. Los gestos son los de Vías de
  Escalada: desde la lista, bajar solo baja el panel si la lista ya está arriba
  del todo.
- No hay deslizar de costado: en el mapa, deslizar es mover el mapa.
- Los dos tienen «Ver el mapa en grande», **solo para mirar**, que encuadra lo
  elegido.

### Solo con conexión

**Mapas entero es solo con conexión**, como Salidas y Perfiles: sin señal
desaparece del menú, y si la señal se va con la pantalla abierta, se avisa y
se ofrecen Circuitos y Navegación libre. Sus pantallas —también las zonas— no
se guardan en el celular. Lo único que se usa sin señal es navegar y marcar
en el momento. Sacar un mapa del celular se hace en casa, con señal.

## Motivo

Caminos y Anotaciones eran dos secciones que hacían lo mismo para quien usa la
app: poner cosas encima del mapa. Las pestañas de arriba ocupaban media
pantalla del celular y seguían ahí después de elegir. Las tranqueras dependían
de que alguien se acordara de tocar un botón en cada sector.

## Auditoría de fuentes

- Leído en tiempo real: la charla con Ale; las pantallas de Mapas, Caminos y
  anotaciones; el panel de Vías de Escalada; las reglas de la tabla de
  anotaciones en la base; las reglas de Google para sus imágenes.
- Inferido: el peso de tranqueras y alambrados es una estimación, no una
  medición.
- Pendiente: probar en un celular real los gestos del panel; medir el peso
  real de tranqueras y alambrados con la primera zona nueva; la prohibición de
  cambiar tranqueras y alambrados está en la app y en el servidor, pero no
  todavía como regla de la base.
