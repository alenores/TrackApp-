# Riesgos y deuda técnica

> Última revisión: 2026-09-19 (descarga de mapas y actualización de librerías)
> Estado: `🔴 abierto` · `🟡 mitigado` · `✅ resuelto`

---

## ✅ R1 — Los mapas descargados nunca se borran

**Qué pasaba.** Todo lo que se descargaba para usar sin conexión iba a un
depósito único y compartido. Nadie llevaba la cuenta de qué descarga usaba qué,
así que al quitar algo de offline se borraba el registro pero las imágenes
quedaban para siempre.

**Estado hoy (2026-09-19).** Ese código ya no existe: se borró entero junto con
los mapas de OpenStreetMap. Hoy no se descarga ningún mapa, así que el problema
no puede pasar.

**Cómo quedó (2026-09-19).** La descarga por sector ya existe y el borrado está
resuelto de raíz: los pedazos de mapa se guardan por su nombre de grilla, los
sectores vecinos los comparten, y al borrar un sector se va **todo lo que ya no
haga falta**, no «lo que era de ese sector». Dos pruebas automáticas lo sostienen:
una comprueba que borrar libera el espacio de verdad, y la otra que borrar un
sector **no se lleva puesto el mapa del sector de al lado**.

**Detectado:** 2026-09-17 · **Resuelto:** 2026-09-19

---

## 🟡 R2 — Sin señal, el mapa desaparece al acercarse

**Qué pasaba.** Se descargaban imágenes hasta cierto nivel de acercamiento, pero
el mapa dejaba acercarse mucho más allá. Pasado ese punto pedía imágenes que no
tenía y la pantalla quedaba en blanco.

**Estado hoy (2026-09-19).** Ese código ya no existe. Hoy el mapa va sin fondo y
la línea de la ruta se dibuja a cualquier acercamiento.

**Lo que ya está resuelto.** La descarga baja desde el mundo entero hasta el
último nivel con detalle, y no lo adivina: se lo pregunta al archivo de mapa.
Un pedazo que no está guardado devuelve vacío, nunca un pedido a internet.

**Por qué sigue anotado.** Falta la otra mitad: que al pasarse del último nivel
bajado el mapa **agrande la última imagen disponible** en vez de quedar en
blanco. Eso se configura al armar el estilo del mapa, que todavía no existe.

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

## 🟡 R11 — Nadie lleva la cuenta de qué mapa está descargado

**Qué pasaba.** La app calculaba bien qué sectores cruza una ruta, pero **la
lista de sectores descargados estaba vacía siempre**, porque no había nada que
descargar.

**Estado hoy (2026-09-19).** La cuenta existe y es de verdad: se anota qué
sector tiene mapa, de qué tipo, cuánto pesó y hasta qué acercamiento se bajó.
Se anota **recién cuando el celular confirma que entraron todos los pedazos**;
una descarga cortada no deja el sector marcado. Hay prueba automática de eso.

**Por qué sigue anotado.** Todavía no hay de dónde bajar: falta confirmar la
dirección del archivo de mapa mundial. Hasta entonces la lista sigue vacía, que
es la respuesta correcta.

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

## 🔴 R14 — El motor que hace andar la app sin señal está abandonado

**Qué pasa.** La pieza que le enseña al celular a funcionar sin conexión
—guardar las pantallas, responder cuando no hay red, mostrar la pantalla de
«sin señal»— la provee una librería llamada `next-pwa`. **Su última versión se
publicó en agosto de 2022**, hace más de cuatro años, y está pensada para una
versión de Next.js muy anterior a la que usa la app hoy.

**Consecuencia.** Dos, y la segunda es la grave:

1. Arrastra cinco alertas de seguridad que ninguna actualización puede cerrar.
   Son de herramientas que corren **al compilar**, no en el celular del usuario,
   así que el riesgo real es bajo: para aprovecharlas habría que poder meter
   código en el proyecto, y quien puede eso ya no necesita la vulnerabilidad.
2. **Lo que hace andar la app sin señal —lo más importante del producto— depende
   de algo que nadie mantiene.** El día que una actualización de Next.js lo
   rompa, no hay a quién recurrir y la app deja de servir en el cerro.

**Cómo se arregla.** Cambiarla por `@serwist/next`, que sí está mantenida
—última versión de julio de 2026— y hace el mismo trabajo. No es un cambio
menor: hay que reescribir la configuración de qué se guarda y qué no, que es
justo la que hace que la navegación sin señal funcione. **Se prueba con el modo
avión activado**, no con pruebas automáticas.

**Detectado:** 2026-09-19, revisando las alertas de seguridad de las librerías.

---

## Nota de cierre — 2026-09-18

**R4, R6, R7, R8, R9 y R10 quedaron resueltos de una sola vez**: la base de datos
se rehízo desde cero a partir de las decisiones del proyecto. Los riesgos que
describían pertenecían a la base anterior, que ya no existe.

La base nueva cumple las convenciones desde el primer día: nombres en español,
borrado lógico, fechas de auditoría automáticas, seguridad por fila, dueño
obligatorio en cada fila, y depósitos de archivos con tope de tamaño y de tipo.

**R1, R2, R3 y R5 siguen abiertos**: son de la capa de mapas, no de la base.

---

## Nota de cierre — 2026-09-19

**R1 quedó resuelto** con la descarga de mapas por sector: borrar libera el
espacio de verdad y no se lleva el mapa del sector de al lado, y hay pruebas
automáticas que lo sostienen. **R11 quedó a medias a propósito**: la cuenta de
lo descargado ya es real, falta de dónde bajar.

**Se actualizó Next.js de 16.2.6 a 16.3.5**, que cierra once alertas críticas,
entre ellas dos de ejecución de código a distancia sin necesidad de estar
logueado y una de salteo del control de acceso. También se actualizó la
librería de imágenes. De trece alertas quedaron cinco, todas en la cadena de
`next-pwa`, que es **R14**.
