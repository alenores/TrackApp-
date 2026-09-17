# Riesgos y deuda técnica

> Última revisión: 2026-09-17
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

## 🔴 R3 — La pantalla de detalle de ruta ignora lo descargado

**Qué pasa.** Hay dos mapas en la app. El de navegación sabe leer lo guardado en
el celular; el de detalle de ruta siempre va a internet.

**Consecuencia.** Se descarga una ruta completa, se llega al cerro, se abre el
detalle de esa ruta y el mapa está vacío. La descarga solo sirve en una de las
dos pantallas.

**Detectado:** 2026-09-17, leyendo el código.

---

## 🔴 R4 — La base de datos no cumple las convenciones fijas

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
**No verificado contra la base**: la base de TrackApp no fue accesible en esa
sesión. El diagnóstico sale del código y de los tipos declarados.

---

## 🟡 R5 — Sin GPS en segundo plano

**Qué pasa.** Siendo una app web, el GPS deja de seguirte cuando la pantalla se
apaga o la app pasa a segundo plano. La alerta de desvío solo funciona con la app
abierta y la pantalla encendida.

**Mitigación decidida.** Empaquetar la app para Android al final del desarrollo
(ver `decisiones/002-pwa-y-empaquetado-android.md`). Es opcional y descartable.

**Detectado:** 2026-09-17.
