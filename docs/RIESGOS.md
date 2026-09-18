# Riesgos y deuda técnica

> Última revisión: 2026-09-18 (base rehecha desde cero)
> Estado: `🔴 abierto` · `🟡 mitigado` · `✅ resuelto`

---

## 🔴 R1 — Los mapas descargados nunca se borran

**Qué pasa.** Todo lo que se descarga para usar sin conexión se guarda en un
depósito único y compartido. Nadie lleva la cuenta de qué descarga usa qué. Al
quitar algo de offline se borra el registro, pero las imágenes quedan guardadas
para siempre.

**Consecuencia.** La app ocupa cada vez más espacio en el celular y nunca baja.
No hay forma de liberarlo desde adentro de la app.

**Detectado:** 2026-09-17, leyendo el código.

---

## 🔴 R2 — Sin señal, el mapa desaparece al acercarse

**Qué pasa.** Se descargan imágenes hasta cierto nivel de acercamiento, pero el
mapa deja acercarse mucho más allá. Pasado ese punto pide imágenes que no tiene.

**Consecuencia.** Sin señal, la pantalla queda en blanco justo cuando más
precisión se necesita: al mirar de cerca un desvío del sendero.

**Cómo se arregla.** Decirle al mapa que agrande la última imagen disponible en
vez de pedir una que no existe. Se ve más borroso pero nunca queda vacío.

**Detectado:** 2026-09-17, leyendo el código.

---

## 🔴 R3 — La pantalla de detalle de la ruta ignora lo descargado

**Qué pasa.** Hay dos mapas en la app. El de navegación sabe leer lo guardado en
el celular; el del detalle de la ruta siempre va a internet.

**Consecuencia.** Se descarga una ruta completa, se llega al cerro, se abre el
detalle de esa ruta y el mapa está vacío. La descarga solo sirve en una de las
dos pantallas.

**Detectado:** 2026-09-17, leyendo el código.

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

## Nota de cierre — 2026-09-18

**R4, R6, R7, R8, R9 y R10 quedaron resueltos de una sola vez**: la base de datos
se rehízo desde cero a partir de las decisiones del proyecto. Los riesgos que
describían pertenecían a la base anterior, que ya no existe.

La base nueva cumple las convenciones desde el primer día: nombres en español,
borrado lógico, fechas de auditoría automáticas, seguridad por fila, dueño
obligatorio en cada fila, y depósitos de archivos con tope de tamaño y de tipo.

**R1, R2, R3 y R5 siguen abiertos**: son de la capa de mapas, no de la base.
