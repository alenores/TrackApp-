# Riesgos y deuda técnica

> Última revisión: 2026-09-20 (la pantalla negra del cerro)
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

## ✅ R2 — Sin señal, el mapa desaparece al acercarse

**Qué pasaba.** Se descargaban imágenes hasta cierto nivel de acercamiento, pero
el mapa dejaba acercarse mucho más allá. Pasado ese punto pedía imágenes que no
tenía y la pantalla quedaba en blanco.

**Estado hoy (2026-09-19).** Ese código ya no existe. Hoy el mapa va sin fondo y
la línea de la ruta se dibuja a cualquier acercamiento.

**Lo que ya está resuelto.** La descarga baja desde el mundo entero hasta el
último nivel con detalle, y no lo adivina: se lo pregunta al archivo de mapa.
Un pedazo que no está guardado devuelve vacío, nunca un pedido a internet.

**Cómo quedó (2026-09-19).** Las dos mitades, resueltas. La descarga baja hasta
el último acercamiento que **el archivo de mapa declara tener** —no se adivina,
se le pregunta—, y el estilo del mapa está armado para que pasado ese punto
**agrande el último pedazo que hay** en vez de pedir uno que no está. Un pedazo
que no está guardado devuelve vacío, nunca un pedido a internet.

**Detectado:** 2026-09-17 · **Resuelto:** 2026-09-19

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

## ✅ R11 — Nadie lleva la cuenta de qué mapa está descargado

**Qué pasaba.** La app calculaba bien qué sectores cruza una ruta, pero **la
lista de sectores descargados estaba vacía siempre**, porque no había nada que
descargar.

**Estado hoy (2026-09-19).** La cuenta existe y es de verdad: se anota qué
sector tiene mapa, de qué tipo, cuánto pesó y hasta qué acercamiento se bajó.
Se anota **recién cuando el celular confirma que entraron todos los pedazos**;
una descarga cortada no deja el sector marcado. Hay prueba automática de eso.

**Cómo quedó (2026-09-19).** Cerrado. Ya hay de dónde bajar —probado contra el
archivo de verdad— y las pantallas leen la cuenta por una pieza que **avisa
cuando cambia**: bajar o sacar un mapa las vuelve a dibujar solas. Antes lo
leían por afuera y la ruta podía seguir diciendo «te falta un mapa» con el mapa
ya bajado.

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

## ✅ R15 — La app no abría ni una pantalla sin señal

**Qué pasaba.** La configuración del motor offline decía, para **toda** pantalla
que el usuario abriera, «traelo siempre de internet». Se guardaban el código,
los estilos y las fotos, pero **ninguna pantalla**. En modo avión no había nada
para dibujar: todo caía en el cartel de «sin señal».

Había dos fallas más que llevaban al mismo lugar: faltaban las dos líneas que
apagan la regla del inicio que arma la librería sola —que no encuentra lo
guardado al reabrir— y el cupo de código guardado era 128, el número que en Vías
de Escalada ya se comprobó que no alcanza para varias publicaciones seguidas.

**Cómo quedó (2026-09-19).** La configuración se reescribió entera tomando como
molde la de Vías de Escalada, que lleva años corregida a los golpes. Cada
pantalla tiene ahora su regla, y las dos respuestas que el navegador pide por
pantalla —el documento y el pedido interno del link— se guardan por separado.
Las del cerro van primero a lo guardado; las de entrada preguntan a la red con
poca paciencia, para que llegue una versión nueva.

**Lo que falta.** Probarlo en modo avión. Es la única prueba que vale y no se
puede automatizar.

**Detectado:** 2026-09-19, comparando contra Vías de Escalada.

---

## ✅ R17 — El mapa nunca dibujó nada, y nadie se enteró

**Qué pasaba.** Desde que se cambió el motor del mapa, **ningún mapa de la app
dibujó nunca nada**: ni el fondo, ni la línea de la ruta, ni el punto del GPS,
ni los recuadros de los sectores. Se veía un rectángulo del color del fondo y
listo.

**Por qué.** El motor del mapa reparte su trabajo en dos: una parte dibuja y
otra, aparte, procesa los datos. La segunda vive en un archivo suelto y el motor
la busca solo, calculando dónde quedó. **Ese cálculo no funciona con la forma en
que se empaqueta esta app:** devolvía vacío, el motor terminaba cargando la
página web en lugar de su propio código, esa parte moría al instante y el mapa
quedaba esperando para siempre datos que nunca llegaban.

Encima, el control de sesión de la app se comía los archivos del mapa —sus
íconos, sus letras y el motor mismo— y los mandaba al login.

**Cómo se arregló (2026-09-19).** Los dos archivos del motor se copian adentro
de la app en cada compilación y se le dice exactamente dónde están. Los archivos
del mapa ya no pasan por el control de sesión. Y el código que le entrega los
pedazos guardados le da una copia propia cada vez: le entregaba el mismo bloque
de memoria dos veces, y el mapa se queda con lo que recibe.

**Por qué tardó tanto en encontrarse, que es lo que más importa.** Se buscó a
ciegas: leyendo código y pidiéndole a Ale que probara, una suposición por vuelta,
cinco veces. **Se resolvió en veinte minutos cuando se levantó la app y se la
miró con un navegador de verdad**, que estaba disponible desde el principio.

**Cómo se evita que vuelva.** Hay prueba automática de que los dos archivos del
motor estén copiados. Y queda la regla: ante un problema visual que no se
entiende a la primera, **se abre la app y se mira**, no se adivina leyendo.

**Detectado:** 2026-09-19, probando en producción. **Resuelto:** el mismo día.

---

## ✅ R18 — Cerrar un cartel rompía el mapa, y el toque siguiente se perdía

**Qué pasaba.** Toda pantalla emergente de la app —confirmar, avisar, la ficha
de una anotación— agregaba una entrada al historial del navegador para que el
botón físico de atrás la cerrara. Hasta ahí, bien. El problema era al cerrarla
con la X: la app le pedía al navegador **volver atrás** para sacar esa entrada.

Volver atrás, aunque la dirección no cambie, hace que la app **rearme la
pantalla entera desde cero**. En la pantalla de navegación eso significa que el
mapa se destruye y vuelve a nacer: desaparece, dice «Abriendo el mapa…» y
durante ese rato **el toque siguiente cae en el vacío**. En el cerro es tocar
una anotación, que no pase nada, y no entender por qué.

**Cómo se encontró.** Abriendo la app en un navegador de verdad y tocando dos
anotaciones seguidas. Ninguna prueba automática lo habría visto: no había error,
no había cartel rojo, simplemente el segundo toque no hacía nada. Se midió
contando cuántas veces se armaba el mapa, y ahí quedó claro.

**Cómo quedó (2026-09-20).** Cerrar con un botón ya no vuelve atrás: solo le
saca la marca a la entrada, sin moverse. Queda una entrada de sobra, y de eso se
ocupan dos cosas: la próxima emergente la reusa en vez de agregar otra, y si el
usuario aprieta atrás estando esa entrada de sobra, la app sigue de largo para
que no tenga que apretar dos veces. Ocho pruebas automáticas lo sostienen, entre
ellas que abrir y cerrar diez veces deje **una** entrada y no diez.

**Lo que no cambió.** Cerrar con el botón físico de atrás **sí** rearma la
pantalla: eso es cómo funciona el framework y no se puede evitar desde la app.
Es el camino menos usado —el botón de cerrar es grande y está al alcance del
pulgar— pero conviene saberlo: en la navegación, apretar atrás hace parpadear el
mapa.

**Detectado:** 2026-09-20, probando las anotaciones con foto en el navegador.
**Resuelto:** el mismo día.

---

## ✅ R19 — El fondo del mapa no se dibujaba en el celular, y en la compu sí

**Qué pasaba.** El motor del mapa pide los íconos en dos tamaños: el común para
una computadora, y **uno al doble para la pantalla de un celular moderno**. La
hoja de íconos al doble estaba, pero su receta —el archivo que dice dónde está
cada ícono adentro de la hoja— no. El celular la pedía, no existía, y el fondo
del mapa entero no se dibujaba: aparecía el cartel ámbar sobre el mapa.

**Por qué costaba verlo.** En la computadora andaba perfecto. Solo fallaba en
pantallas de alta densidad, que son todas las de celular.

**Cómo quedó (2026-09-20).** La receta del doble se arma sola en cada
compilación, a partir de la común: se comprobó midiendo que la hoja al doble es
la misma grilla al doble de tamaño —recortando cada ícono de las dos hojas y
comparándolos— así que las medidas se multiplican por dos. Al generarse, no
puede quedar desactualizada el día que los íconos se cambien. Dos pruebas
automáticas lo sostienen: que estén los cuatro archivos de cada modo, y que la
receta del doble mida el doble.

**Detectado:** 2026-09-20, por Ale, abriendo una zona en el celular.
**Resuelto:** el mismo día.

---

## ✅ R20 — No se podía subir un archivo de ruta desde Windows

**Qué pasaba.** Al subir una ruta, la app le decía a la base qué clase de
archivo era **copiando lo que le decía el navegador**. Windows no conoce el
`.gpx`, así que el navegador lo entregaba como «un archivo cualquiera», y la
base —que solo acepta las clases que declaró— lo rechazaba. El usuario veía «no
se pudo subir» sobre un archivo perfectamente bueno, y la ruta se deshacía.

**Cómo quedó (2026-09-20).** La clase sale del nombre del archivo, no de lo que
diga el navegador: un `.gpx` es un GPX y un `.kml` es un KML, en Windows, en
Android y en donde sea. Si aun así la base rechazara la clase, se reintenta una
sola vez declarándolo como el XML que en el fondo es. Cuatro pruebas automáticas
lo cubren.

**Confirmado contra la base el mismo día.** El depósito acepta
`application/gpx+xml`, `application/vnd.google-earth.kml+xml`,
`application/vnd.google-earth.kmz`, `application/xml` y `text/xml`. Es decir que
el primer intento ya acierta y el reintento no hace falta. **Se deja igual**: si
alguna vez se toca la configuración del depósito, la diferencia es entre no
poder subir nada y que siga andando. Los tipos quedaron escritos en `SCHEMA.md`.

**Detectado:** 2026-09-20, por Ale, subiendo una ruta desde la computadora.
**Resuelto:** el mismo día.

---

## ✅ R21 — La app no guardaba nada, y se veía perfecta con señal

**Qué pasaba.** El motor offline se arma con tres archivos. Uno de ellos —el
que sabe qué mostrar cuando una pantalla no está guardada— **no estaba en la
lista de archivos que no pasan por el control de sesión**. Así que cuando el
navegador lo pedía sin una sesión válida, el control se lo mandaba a la pantalla
de entrar, el motor recibía una página web donde esperaba código, y **se caía
entero al arrancar, en silencio.**

Consecuencia: la app **no guardaba una sola pantalla**. Con señal andaba
perfecto y nada delataba el problema. Sin señal no había nada.

**Cómo se encontró.** Compilando la app de verdad, abriéndola en un navegador y
escuchando los errores del motor offline. Ahí apareció el mensaje: no podía
cargar ese archivo. Un pedido directo confirmó que respondía con una redirección
a la pantalla de entrar. Antes del arreglo, la app tenía **cero** depósitos
guardados; después, cuatro.

**Cómo quedó (2026-09-20).** Las reglas de qué pasa por el control de sesión se
sacaron a su propio lugar, con siete pruebas automáticas. Una de ellas no se
acuerda de los nombres: **mira los archivos que el compilador dejó escritos** y
comprueba uno por uno, porque el del rescate lleva un código distinto en cada
compilación y a mano se olvida.

**Detectado:** 2026-09-20. **Resuelto:** el mismo día.

---

## ✅ R22 — La tapa del arranque no se destapaba nunca

**Qué pasaba.** La app instalada tapa el arranque con una pantalla negra con el
ícono. Esa tapa se iba solo cuando una pantalla avisaba que estaba lista, o
cuando la dirección era la de entrar o la de «sin señal». **Si la pantalla no
llegaba a dibujarse, la tapa se quedaba para siempre.**

En el cerro, sin señal, al abrir el detalle de una zona que no estaba guardada:
pantalla negra con el ícono en el medio, sin poder hacer nada. Y abajo, tapado,
estaba el aviso que el usuario necesitaba leer.

**Cómo quedó (2026-09-20).** Tres cosas. La tapa tiene **tope de tiempo**: pase
lo que pase se destapa a los cinco segundos. La pantalla de rescate **avisa que
está lista** apenas se dibuja, así se destapa al instante. Y esa pantalla ahora
dice qué pasó, qué se puede hacer y tiene un botón para volver al inicio, que sí
anda sin señal.

La regla quedó escrita en `AGENTS.md`: **todo lo que tape la pantalla se tiene
que destapar solo, sí o sí.**

**Detectado:** 2026-09-20, por Ale, en el celular sin señal.
**Resuelto:** el mismo día, reproduciendo la pantalla negra en el navegador.

---

## ✅ R23 — El navegador podía borrar todo lo guardado, sin avisar

**Qué pasaba.** Una app web no es dueña del espacio que usa: el navegador se lo
presta. Cuando el teléfono se queda sin lugar, hace lugar borrando lo guardado
de los sitios web, sin preguntar. Y lo borra **entero**: los datos de rutas y
zonas, los mapas bajados, las fotos y hasta las pantallas guardadas. Después de
eso la app ni siquiera abre sin señal.

Hay una forma de pedirle que no lo haga, y **ninguna de las dos apps la usaba**.
Verificado buscando en los dos repositorios: cero apariciones.

**Cómo quedó (2026-09-21).** Las dos apps lo piden al arrancar. Cinco pruebas
automáticas cubren los cuatro finales posibles, incluido el navegador que no
sabe de esto y el que tira al preguntar.

**El pedido puede salir que no, y está bien.** Lo decide el navegador solo, por
señales del aparato; con la app instalada y usada seguido, dice que sí. Que
diga que no no se le avisa al usuario: no es una falla, es una probabilidad, y
no hay nada que él pueda hacer al respecto. Tema cerrado.

**Lo que queda por decidir.** Si el navegador dice que no, hoy el usuario no se
entera. Es información que le corresponde tener: falta definir dónde decirlo sin
convertirlo en ruido.

**Detectado:** 2026-09-21, hablando de cuánto pesa un mapa.
**Resuelto:** el mismo día.

---

## 🟡 R14 — El motor que hace andar la app sin señal está abandonado

**Qué pasa.** La pieza que le enseña al celular a funcionar sin conexión
—guardar las pantallas, responder cuando no hay red, mostrar la pantalla de
«sin señal»— la provee una librería llamada `next-pwa`. **Su última versión se
publicó en agosto de 2022**, hace más de cuatro años, y está pensada para una
versión de Next.js muy anterior a la que usa la app hoy.

**Qué tan urgente es.** Menos de lo que parece: **Vías de Escalada usa la misma
librería y la misma versión sobre el mismo framework, y funciona impecable.** La
calidad del uso sin señal no sale de la librería, sale de cómo está configurada
—ver R15—. Las cinco alertas de seguridad que arrastra son de herramientas que
corren **al compilar**, no en el celular: para aprovecharlas habría que poder
meter código en el proyecto, y quien puede eso ya no necesita la vulnerabilidad.

**Lo que sí es cierto.** El día que una actualización del framework la rompa, no
hay a quién recurrir. Es deuda a pagar, no un incendio.

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

**R2 y R11 quedaron resueltos** al cerrar la descarga de mapas: hay de dónde
bajar, se baja hasta donde el archivo declara tener detalle, acercarse de más
agranda en vez de quedar en blanco, y las pantallas se enteran solas de lo que
se bajó o se sacó.

**Se actualizó Next.js de 16.2.6 a 16.3.5**, que cierra once alertas críticas,
entre ellas dos de ejecución de código a distancia sin necesidad de estar
logueado y una de salteo del control de acceso. También se actualizó la
librería de imágenes. De trece alertas quedaron cinco, todas en la cadena de
`next-pwa`, que es **R14**.

---

## Nota de cierre — 2026-09-20

**Se agregó y se cerró R18**, encontrado probando las anotaciones con foto en un
navegador de verdad. Es el segundo caso —después de R17— en que un problema que
ninguna prueba automática podía ver se encontró **abriendo la app y mirando**.
La regla ya está en `AGENTS.md` y sigue valiendo su peso.

**Se borró una pantalla de prueba que había quedado publicada** (`/offline/
prueba-zona`). Servía para mirar el diseño de una zona en pantalla grande y se
coló en un commit. No filtraba nada —dibuja desde lo guardado en el celular—
pero era código muerto al alcance de cualquiera.

**Se agregaron y se cerraron R19 y R20**, los dos encontrados por Ale probando
en producción. Tienen la misma forma: **una falla que no se ve desde donde se
desarrolla**. R19 solo pasaba en pantalla de celular; R20 solo con Windows. Las
dos quedaron con prueba automática que las habría atajado.

---

## Nota de cierre — 2026-09-20 (tarde)

**R21 y R22 salieron de un mismo aviso de Ale**: sin señal, el detalle de una
zona quedaba en pantalla negra con el ícono. Reproducirlo en el navegador
—compilando la app de verdad y simulando el celular instalado sin señal— mostró
que eran dos fallas distintas encadenadas, y que la más grave no era la que se
veía: **la app no estaba guardando nada desde hacía tiempo.**

Las tres fallas del día (R19, R20, R21) tienen la misma raíz de método: **no se
ven desde la computadora del que programa.** Las tres quedaron con prueba
automática.
