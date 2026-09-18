# 011 — Qué datos llevan las rutas, las zonas y los sectores

**Fecha:** 2026-09-18 · **Estado:** vigente

Toda tabla cumple además las convenciones fijas de Ale: nombres en snake_case
español, `creado_en`, `actualizado_en`, `eliminado_en` (borrado lógico) y RLS
activo desde que se crea.

---

## Ruta

### Lo que carga el usuario

| Dato | Forma |
|---|---|
| Nombre | texto |
| Tipo | **una o varias** de: mountain bike, trekking, kayak, canyoning |
| Dificultad técnica | número del 1 al 10 |
| Nivel de esfuerzo | bajo · medio · alto · muy alto |
| Equipo | texto libre |
| Complicaciones | texto libre |
| Comentario | texto libre |

### Lo que calcula la app y el usuario NO toca

| Dato | De dónde sale |
|---|---|
| Largo | del archivo subido |
| Desnivel positivo | del archivo subido |
| Desnivel negativo | del archivo subido |

**Se guardan los dos desniveles, no uno solo.** Subir 800 y bajar 800 no es lo
mismo que subir 800 y bajar 200: en montaña la bajada castiga distinto.

**Largo y desnivel nunca se cargan ni se corrigen a mano.** Son datos duros que
vienen dentro del archivo. Tenerlos en dos lugares sería tener dos verdades para
el mismo número, y el día que no coincidan nadie sabría cuál vale.

### Lo que el sistema necesita

| Dato | Para qué |
|---|---|
| Quién la subió | Sin esto no se puede aplicar que solo el creador edita y borra |
| La línea del recorrido | Es lo que hace que una ruta sea una ruta |
| El archivo original | Permite rehacer la conversión si algo cambia. Sin él, un error de importación es irreversible |
| El rectángulo que la abarca | Permite cruzarla contra los sectores sin recorrer la línea punto por punto |
| Fecha de subida | — |

---

## Zona

| Dato | Forma |
|---|---|
| Nombre | texto |
| Descripción | texto |
| Rectángulo | **dos puntos**: esquina noroeste y esquina sudeste |

### El rectángulo de la zona NO es para descargar

Es la única cosa que hace falta entender de la zona, y es fácil de romper:

- **La zona no tiene mapa propio y nunca se descarga.** La unidad de descarga es
  el sector, siempre. **Prohibido usar el rectángulo de la zona como área de
  descarga**, por más que técnicamente se pueda.
- **El rectángulo de la zona existe para una sola cosa: medir cobertura.** Sirve
  para saber qué parte del territorio de esa zona todavía no tiene ningún sector
  encima.

### La cobertura de una zona

Como la zona es un rectángulo y los sectores son rectángulos, calcular qué falta
es restar rectángulos: se pinta la zona, se pintan los sectores encima, y lo que
quedó sin pintar es el agujero.

**Eso tiene que verse en una pantalla**, no ser un número. El administrador mira
la zona y ve de un vistazo qué está cubierto y qué no. Es herramienta de
administración, así que vive en la experiencia de computadora.

---

## Sector

| Dato | Forma |
|---|---|
| Nombre | texto |
| Descripción | texto |
| Rectángulo | **dos puntos**: esquina noroeste y esquina sudeste |
| Zona a la que pertenece | — |

### El sector es un rectángulo alineado al norte, definido por dos puntos

**No son cuatro esquinas libres.** Motivos:

1. **Los mapas se extraen en rectángulos alineados.** Es la forma real de la
   tecnología por debajo. Un cuadrilátero torcido obligaría igual a bajar el
   rectángulo que lo contiene: se bajaría lo mismo con un modelo más complicado.
2. **El cálculo de cobertura se vuelve comparar cuatro números.** Con figuras
   libres es geometría pesada, y hay que hacerla en el celular, sin señal y con
   la batería contada.
3. **Es más cómodo de dibujar en la computadora.** Se arrastra una esquina.
4. **Dos puntos no pueden quedar inconsistentes.** Cuatro esquinas sí: pueden
   describir una figura que no es un rectángulo.

**Costo asumido:** un rectángulo no sigue un valle en diagonal, así que incluye
territorio de más. Ese territorio se bajaría igual. Si un sector queda muy
desaprovechado, **se parte en dos rectángulos chicos. Nunca se lo tuerce.**

---

## Cargar coordenadas: se pegan desde Google Maps

El formulario tiene que aceptar lo que Google Maps entrega, **sin que Ale tenga
que convertir nada a mano.** Formatos a reconocer:

| Formato | Ejemplo |
|---|---|
| Decimal | `-31.27636, -64.31475` |
| Sexagesimal | `31°16'34.9"S 64°18'53.1"W` |
| Dirección de Google Maps | la URL completa pegada |

### Trampa detectada — importante

En una dirección de Google Maps, **el número que va después de `@` es dónde está
centrado el mapa, no el punto marcado.** El punto marcado está en la parte
`/place/`.

Leer el `@` en vez del `/place/` mete un error de cientos de metros **sin que
nada avise**. Verificado sobre un caso real: la latitud coincidía y la longitud
estaba corrida unos 230 metros.

**Al leer una dirección se usa siempre la parte `/place/`.**

### Validación obligatoria

**Toda Argentina está en latitud sur y longitud oeste: los dos números son
negativos, siempre.** Si un pegado produce un número positivo, está mal
interpretado y hay que avisarlo, no guardarlo.

### Confirmación visual

Después de pegar, **el punto se muestra en el mapa antes de guardar.** Una
coordenada mal pegada es un error silencioso: el sector queda en otro lado y no
se descubre hasta el cerro. Verlo dibujado lo hace imposible de no notar.

### Lo que no se puede resolver sin internet

Los enlaces cortos que genera Google al compartir (`maps.app.goo.gl/...`) no
contienen las coordenadas: hay que resolverlos contra Google. **No se puede
hacer sin conexión.** Si Ale pega uno, se le dice que pegue la dirección
completa o las coordenadas.
