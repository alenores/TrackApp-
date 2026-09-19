# Riesgos y deuda técnica

> Última revisión: 2026-09-19 (app reescrita sobre la base nueva)
> Estado: `🔴 abierto` · `🟡 mitigado` · `✅ resuelto`

---

## 🟡 R1 — Los mapas descargados nunca se borran

**Qué pasaba.** Todo lo que se descargaba para usar sin conexión iba a un
depósito único y compartido. Nadie llevaba la cuenta de qué descarga usaba qué,
así que al quitar algo de offline se borraba el registro pero las imágenes
quedaban para siempre.

**Estado hoy (2026-09-19).** Ese código ya no existe: se borró entero junto con
los mapas de OpenStreetMap. Hoy no se descarga ningún mapa, así que el problema
no puede pasar.

**Por qué sigue anotado.** Vuelve solo el día que existan los archivos de mapa.
Queda como requisito de ese trabajo: **lo que se descarga tiene que poder
borrarse, y el espacio se tiene que liberar de verdad.**

**Detectado:** 2026-09-17 · **Neutralizado:** 2026-09-19

---

## 🟡 R2 — Sin señal, el mapa desaparece al acercarse

**Qué pasaba.** Se descargaban imágenes hasta cierto nivel de acercamiento, pero
el mapa dejaba acercarse mucho más allá. Pasado ese punto pedía imágenes que no
tenía y la pantalla quedaba en blanco.

**Estado hoy (2026-09-19).** Ese código ya no existe. Hoy el mapa va sin fondo y
la línea de la ruta se dibuja a cualquier acercamiento.

**Por qué sigue anotado.** Vuelve solo cuando existan los archivos de mapa.
Queda como requisito: **pasado el último nivel descargado se agranda la última
imagen disponible, nunca se pide una que no está.**

**Detectado:** 2026-09-17 · **Neutralizado:** 2026-09-19

---

## ✅ R3 — La pantalla de detalle de la ruta ignora lo descargado

**Qué pasaba.** Había dos mapas en la app. El de navegación sabía leer lo
guardado en el celular; el del detalle de la ruta siempre iba a internet. Se
descargaba una ruta, se llegaba al cerro, se abría su ficha y el mapa estaba
vacío.

**Resuelto el 2026-09-19.** Hay **un solo mapa** en toda la app y ninguna ficha
consulta internet: la ruta, sus textos, sus números y su línea salen todos de lo
guardado en el celular. Ahora además se guardan el «qué llevar» y las
«complicaciones», que son justo lo que hace falta leer sin señal.

**Detectado:** 2026-09-17 · **Resuelto:** 2026-09-19

---

## ✅ R4 — La base de datos no cumple las convenciones fijas

**Qué pasa.** Las convenciones fijas de Ale para toda su base (ver el skill
`stack-tecnico-fijo`) piden nombres en snake_case español, borrado lógico,
`creado_en` / `actualizado_en`, y RLS activo. TrackApp no cumple las primeras
tres.

En concreto:
- Columnas en inglés (`created_at`, `user_id`).
- **Borrado físico real.** Al borrar una ruta, zona o sector, desaparece para
  siempre. No hay papelera, no hay deshacer, no queda registro de que existió.
- No se guarda cuándo se modificó cada registro.

**Consecuencia.** Pérdida de datos irreversible ante un toque accidental. Y duele
más cuantos más datos se acumulen.

**Cómo se arregla.** Con migraciones sobre la base actual, no rehaciendo la app.

**Detectado:** 2026-09-17, leyendo el código.
**✅ Verificado contra la base el 2026-09-18.** Confirmado: ninguna de las
cuatro convenciones se cumple. Los ids además son uuid y no seriales. Ver
`SCHEMA.md`.

---

## 🟡 R5 — Sin GPS en segundo plano

**Qué pasa.** Siendo una app web, el GPS deja de seguirte cuando la pantalla se
apaga o la app pasa a segundo plano. La alerta de desvío solo funciona con la app
abierta y la pantalla encendida.

**Mitigación decidida.** Empaquetar la app para Android al final del desarrollo
(ver `decisiones/002-pwa-y-empaquetado-android.md`). Es opcional y descartable.

**Detectado:** 2026-09-17.

---

## ✅ R6 — Una ruta sin dueño queda trabada para siempre

**Qué pasa.** En la tabla de rutas, el dueño puede quedar vacío. Pero los
permisos dicen «solo el creador edita y borra», comparando contra ese dueño.

**Consecuencia.** Si una ruta queda sin dueño, **nadie puede editarla ni
borrarla jamás.** Ni su autor, ni Ale. Queda trabada en la app para siempre.

**Cómo se arregla.** Exigir que toda ruta tenga dueño, y revisar si hay alguna
sin dueño ya cargada.

**Detectado:** 2026-09-18, leyendo la base.

---

## ✅ R7 — Los depósitos de archivos no tienen ningún límite

**Qué pasa.** Los dos depósitos —fotos de perfil y archivos de ruta— son
públicos, **sin límite de tamaño y sin restricción de tipo de archivo**.

**Consecuencia.** Cualquiera con sesión puede subir un archivo de cualquier
tamaño y de cualquier tipo. Un solo archivo grande puede consumir el espacio
gratuito.

**Referencia:** en Vías de Escalada esto ya está resuelto — ahí los depósitos
tienen tope de 2 MB y solo aceptan imágenes en un formato. La lección existe,
no está aplicada acá.

**Detectado:** 2026-09-18, leyendo la base.

---

## ✅ R8 — Cualquiera puede escribir en la tabla de novedades

**Qué pasa.** El permiso de inserción en novedades no verifica nada: cualquier
usuario con sesión puede insertar cualquier cosa.

**Consecuencia.** Baja hoy, porque son Ale y sus amigos. Pero es una puerta
abierta que no debería estar.

**Detectado:** 2026-09-18, leyendo la base.

---

## ✅ R9 — Permisos duplicados

**Qué pasa.** La tabla de rutas tiene ocho permisos donde alcanzan cuatro: hay
dos juegos que hacen exactamente lo mismo con nombres distintos. Lo mismo en la
tabla de descargas.

**Consecuencia.** Funciona, pero cada duplicado es un lugar donde equivocarse.
El día que haya que cambiar una regla, hay que acordarse de los dos.

**Detectado:** 2026-09-18, leyendo la base.

---

## ✅ R10 — La tabla de descargas no se usa

**Qué pasa.** Existe una tabla para registrar qué ruta descargó cada usuario. El
código de la app nunca la consulta ni la escribe.

**Consecuencia.** Ninguna hoy. Pero es una tabla que no hace nada y confunde a
quien lea la base.

**Detectado:** 2026-09-18, leyendo la base.

---

## 🔴 R11 — Nadie lleva la cuenta de qué mapa está descargado

**Qué pasa.** La app calcula bien qué sectores cruza una ruta y sabe decir si
falta bajar alguno, pero **la lista de sectores descargados está vacía siempre**,
porque todavía no hay nada que descargar.

**Consecuencia.** Hoy ninguna: sin archivos de mapa, la respuesta correcta es
«no hay nada bajado». El riesgo es olvidarse de conectarlo el día que existan y
que la app diga «está todo listo» sobre algo que no bajó.

**Dónde vive.** En un solo archivo, a propósito, para que el día que haga falta
se toque un lugar y todas las pantallas se enteren solas.

**Detectado:** 2026-09-19, escribiendo la cobertura.

---

## 🟡 R12 — Sin señal no se sabe quién subió una ruta

**Qué pasa.** Los nombres y las fotos de los usuarios no viajan en el paquete
offline. Sin señal, la ficha de una ruta muestra «alguien de la app» en vez del
nombre.

**Consecuencia.** Menor: en el cerro hace falta saber por dónde va la ruta y qué
llevar, no quién la subió. Ninguna pantalla se rompe ni queda muda.

**Cómo se arregla.** Meter los nombres en el paquete. Pesan nada. No se hizo
todavía para no agrandar el paquete sin necesidad.

**Detectado:** 2026-09-19, escribiendo la ficha de la ruta.

---

## 🟡 R13 — El modo sol nunca se probó con sol

**Qué pasa.** Los dos modos de color están completos y una prueba automática
verifica, en cada cambio, que tengan exactamente los mismos colores y que cada
combinación de texto y fondo llegue al mínimo de contraste.

**Lo que la prueba no puede hacer.** Decir si con sol de frente, a las dos de la
tarde en el cerro, se lee. Eso lo confirma un ojo afuera.

**Consecuencia.** Podría pasar que cumpla los números y aun así cueste leerlo.

**Detectado:** 2026-09-19.

---

## Nota de cierre — 2026-09-18

**R4, R6, R7, R8, R9 y R10 quedaron resueltos de una sola vez**: la base de datos
se rehízo desde cero a partir de las decisiones del proyecto. Los riesgos que
describían pertenecían a la base anterior, que ya no existe.

La base nueva cumple las convenciones desde el primer día: nombres en español,
borrado lógico, fechas de auditoría automáticas, seguridad por fila, dueño
obligatorio en cada fila, y depósitos de archivos con tope de tamaño y de tipo.

**R1, R2, R3 y R5 siguen abiertos**: son de la capa de mapas, no de la base.
