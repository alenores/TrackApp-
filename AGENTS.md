# TrackApp — reglas para agentes de IA

> App de navegación de rutas al aire libre. Se usa caminando, con sol fuerte,
> con guantes, sin señal y con la batería como recurso escaso.
> Última revisión: 2026-09-21

---

## Antes de tocar nada

**El código que ya existe no es ejemplo de nada.** TrackApp se escribió como
ejercicio de aprendizaje y no cumple estas reglas. No lo copies como referencia
ni lo tomes como decisión tomada. Si una pantalla vieja hace algo que este
archivo prohíbe, está mal la pantalla, no la regla.

**Alejandro (el ususrio y dueño de este producto) no lee ni entiende código en profundidad.** Todo lo que se explique tiene que entenderse sin saber
programar. Nada de nombres de archivos ni de líneas en las explicaciones.

**Ante ambigüedad, se pregunta.** Una pregunta corta ahorra medio día. No
avanzar sobre suposiciones. mientras menos decisiones sin defi ir mejor, por lo cual preguntarle al usuario la cantidad de veces que sea necesario.

**Los datos que hay en la base no son datos.** Las filas que puedan quedar de
rutas, zonas, sectores o usuarios son restos de la app vieja. **La app arranca
de cero.** No se toman como ejemplo, no se migran, no se conservan y no se usan
para deducir nada. Si un agente necesita saber cómo es un dato, mira el esquema,
no las filas.

---

## Regla de producto (manda sobre todas las demás)

### El usuario nunca se queda sin saber qué pasa

Esta app se usa en el cerro. Una pantalla congelada sin aviso es peligrosa: la
persona cree que está bien ubicada y no lo está.

- **Ninguna falla termina en pantalla vacía ni en un mapa congelado sin cartel.**
  Si algo se rompe, en pantalla tiene que decir *qué pasó* y *qué hacer*.
- **Si el GPS se pierde o la posición envejece, se dice en pantalla.** No alcanza
  con dejar de mover el punto azul.
- **Un error atrapado que no se muestra es una falla invisible.** Si una acción
  puede fallar, el aviso va en pantalla con el motivo real adentro. «No se pudo»
  a secas no sirve.
- **El aviso de error no puede depender de lo mismo que falló.**

### Todo se sabe en casa. En el cerro no hay sorpresas.

La app tiene un solo momento para avisar las cosas: **cuando el usuario todavía
tiene señal y está en su casa.** Enterarse a mitad de camino de que falta algo
no es un aviso, es una sorpresa — y en la montaña una sorpresa es un problema.

- **Todo lo que el usuario necesita saber antes de salir, se muestra antes de
  salir**, completo y sin que tenga que ir a buscarlo.
- **Prohibido descubrir un faltante durante la salida.** Si la app puede saberlo
  con señal, lo dice con señal.
- Ante la duda entre avisar de más en casa o avisar en el cerro: **siempre en
  casa.**

---

## Diseño para exterior (ver `docs/DISENO_EXTERIOR.md`)

### Sol y oscuridad: dos modos, cambio manual

- **Modo sol = fondo claro, texto oscuro.** Con sol fuerte el modo oscuro se ve
  PEOR: la pantalla no le gana en brillo al sol. No invertir esto.
- **Modo noche = fondo oscuro, texto claro.**
- **El cambio es manual y está a un toque desde el mapa.** El automático del
  sistema va por horario, no por si está pegando el sol. No reemplazar el botón
  por detección automática.
- Los dos modos se definen con variables de color. **Nunca escribir un color
  fijo en una pantalla.** Si un lado del par fondo/texto queda fijo, en el otro
  modo queda letra clara sobre fondo claro.

### Contraste y tamaños (mínimos, no objetivos)

| Qué | Mínimo |
|---|---|
| Contraste de texto normal | 7:1 |
| Contraste de texto grande, íconos y bordes | 4.5:1 |
| Zona tocable de cualquier botón | 56 × 56 px |
| Zona tocable en la pantalla de navegación | 64 × 64 px |
| Texto de cuerpo | 16 px |
| Texto en la pantalla de navegación | 18 px |

Un botón puede verse chico, pero su zona tocable nunca baja de esos números.

### Guantes y una sola mano

- **Nada que dependa de pellizcar, deslizar o mantener apretado.** Todo gesto
  fino necesita además un botón grande que haga lo mismo.
- **No existe «tirar hacia abajo para recargar».** La app lo ignora: no sirve
  para nada y en el cerro recarga el mapa sin querer.
- **Todo lo importante va en la mitad de abajo de la pantalla**, al alcance del
  pulgar. Nada crítico en las esquinas de arriba.
- **Pantalla mojada = toques fantasma.** Toda acción que borre o cancele algo
  pide confirmación.
  **todo lo de guantes y una sola mano aplica para el modulo de navegación, no para sectores, zonas y demas modulos**

### Mapa

- **El mapa de navegación va a pantalla completa**, sin nada alrededor.
- **Todo mapa se puede abrir en grande**, con un botón abajo a la derecha. En el
  celular un mapa chico no alcanza para ver si la ruta queda adentro de un
  sector. Al agrandarse y al cerrarse se vuelve a encuadrar lo que hay que
  mirar, no lo que se estaba mirando.
- **Siempre tiene que haber una forma visible de salir**, y tiene que responder
  también al botón físico de atrás.
- **La pantalla no se apaga mientras se está navegando.**

---

## Offline

### La navegación es 100% sin conexión. Sin excepciones.

**El 99% de las salidas se hacen sin señal.** Por lo tanto:

- **Navegar una ruta con el punto de GPS NO consulta internet. Nunca. Por ningún
  motivo.** Ni para un dato suelto, ni para "enriquecer", ni para verificar algo,
  ni como respaldo, ni "solo si hay señal".
- **No existe la excepción.** Si un agente cree haber encontrado un caso donde
  convendría pedir un dato a internet durante la navegación, **está equivocado**.
  No se implementa, no se propone y no se pregunta.
- Todo lo que la navegación necesita **se descargó antes de salir**. Si algo no
  está descargado, se avisa antes de salir, no en el cerro.
- El GPS no es internet: funciona sin señal. Esta regla no lo afecta.

### Qué se usa sin señal: solo navegar. Tema cerrado.

**Lo único que se usa en el cerro es ver el recorrido sobre el mapa
descargado.** Nada más.

Administrar —crear y editar zonas, sectores y rutas, marcar rectángulos, subir
archivos— **se hace sentado en la computadora, con conexión.** Esas pantallas
piden el mapa a internet porque es lo correcto, no porque sea una excepción a
tolerar. Sin conexión no tienen sentido: las coordenadas se pegan desde Google
Maps, que también necesita internet.

- **Prohibido a los agentes volver a plantear este tema.** Nada de «¿y si el
  administrador no tiene señal al crear un sector?». Ya está respondido: no
  pasa, y si pasara no importa.
- **Prohibido agregar respaldos, modos degradados o avisos** pensando en usar
  una pantalla de administración sin conexión.
- Al tocar una pantalla, la única pregunta válida es: **¿esto es navegar?** Si
  no lo es, no hay nada que pensar sobre el offline.

### El usuario descarga en su casa. Tema cerrado.

**Descargar el mapa requiere internet. Todos los usuarios lo saben y lo dan por
entendido.** No hace falta explicarlo, advertirlo ni justificarlo.

- **La app trabaja para el usuario que descargó el mapa antes de salir.** Ese es
  el usuario objetivo, y el único.
- **El usuario que llegó al cerro sin haber descargado no es un caso a resolver.**
  No hizo su tarea. No se diseñan flujos, avisos especiales, modos degradados ni
  disculpas para él.
- **Prohibido a los agentes volver a plantear este tema.** Nada de «¿y si el
  usuario está en el cerro con mala señal?». Ya está respondido: no es problema
  de la app.
- **Lo único que sí corresponde** es que la pantalla diga con claridad que ese
  mapa no está descargado, porque el usuario nunca se queda sin saber qué pasa.
  Decirlo, sí. Diseñar alrededor de eso, no.

### Sin señal no se muestra lo que no funciona

**Un botón que al tocarlo falla es información basura.** Sin señal desaparece:
crear, editar y borrar zonas, sectores y rutas; bajar mapas; la pantalla de
perfiles, que muestra datos de los demás y esos no se guardan en el celular.

- **Lo que se esconde es la acción, nunca la información.** «Te falta bajar el
  mapa de este sector» se sigue diciendo sin señal; lo que no está es el botón
  de bajarlo.
- **La app se entera al instante de que la señal se fue**, sin recargar nada:
  alguien abre la app en el pueblo y sube al cerro, y la pantalla se acomoda
  sola. Preguntar una sola vez al abrir no alcanza.
- **Mientras no se sabe si hay señal, se responde que no hay.** Un botón que
  aparece tarde no molesta; uno que aparece y falla, sí.

### Las pantallas se dejan listas solas

**El usuario no visita las pantallas una por una para que queden guardadas.**
Apenas el paquete queda al día, con señal, la app recorre y deja listas todas
las que van a hacer falta sin señal: el inicio, las listas, cada zona, y de cada
ruta su ficha y su navegación. Sin eso, una zona que nunca se abrió con señal no
existe en el cerro.

- De cada pantalla se guardan **dos cosas**: el documento y el pedido interno
  que hace la app al pasar de una pantalla a otra. Una sola de las dos deja la
  app abriendo bien y quedándose en blanco al tocar cualquier cosa.
- **Las de crear y editar no se calientan.** Escriben en la base: guardarlas
  sería guardar un formulario que al tocarlo falla.

### El navegador presta el espacio, no lo regala

Cuando el teléfono se queda sin lugar, el navegador hace lugar **borrando lo
guardado de los sitios web**, sin preguntar y sin avisar. Y borra **todo lo de
la app de una vez**: los datos, los mapas, las fotos y las pantallas guardadas.
Después de eso la app ni siquiera abre sin señal.

- **La app le pide al navegador que lo marque como permanente**, apenas
  arranca. Pedirlo no garantiza que lo concedan —decide el navegador solo— pero
  con la app instalada en la pantalla de inicio normalmente dice que sí.
- **Nada de lo que se guarda vive en un solo lugar.** Los datos livianos van al
  guardado simple, lo pesado al depósito grande y las pantallas a lo del motor
  offline. El borrado del navegador se los lleva a los tres juntos: no existe
  «perdí las fotos pero me quedaron los mapas».

### Lo que bajó cada uno lo recuerda la base

**Perder los mapas no es el problema: el problema es no enterarse.** Los datos
vuelven solos al abrir con señal, así que la pantalla se ve perfecta y los mapas
no están. Por eso qué mapas bajó cada usuario **se anota también en la base**,
que es la única memoria que el navegador no puede borrar.

- **El inicio avisa dos cosas distintas y no las mezcla:** los mapas que tenías
  y ya no están —eso es una pérdida, va con franja ámbar y arriba de todo— y las
  rutas que nunca tuvieron mapa, que son una tarea y van en tarjeta común.
- **Sacar un mapa a propósito funciona sin señal; avisarle a la base, no.** El
  sacado queda anotado como pendiente en el celular y no se cuenta como perdido
  hasta que la base lo acepte. Sin eso, la app le ofrece al usuario bajar de
  nuevo justo lo que él decidió tirar.
- **El emparejado va del celular a la base y solo agrega.** Nunca se borra de la
  base un mapa porque no esté en el celular: eso es la pérdida que hay que
  detectar, y borrarla sería olvidar el problema en vez de avisarlo.

Ver `docs/decisiones/021-la-base-recuerda-que-mapas-bajaste.md`.

### El resto

- **La pantalla de navegar lee de lo guardado en el celular, nunca de internet.**
  Internet sirve para actualizar lo guardado, no para dibujar esa pantalla.
- **Lo que se descarga tiene que poder borrarse.** Si el usuario quita algo de
  offline, el espacio se libera de verdad.
- **Nunca decir «listo» sobre una descarga incompleta.** Si faltó algo, se avisa.
- **Sin señal no se oculta contenido ya guardado.**
- **El usuario elige qué mapa descarga:** simple (con curvas de nivel) o
  satelital. Ver `docs/decisiones/007-de-donde-salen-los-mapas.md`.

### Navegar sin señal

**Lección aprendida en Vías de Escalada, a los golpes.** Sin señal, la navegación
interna entre pantallas vuelve a pedir la receta de la pantalla y la rearma de
cero — aunque ya la hayas visitado. Sin señal eso termina en **pantalla en
blanco**.

- **Todo link entre pantallas usa la pieza compartida de navegación**, nunca un
  link pelado. Sin eso, la app queda en blanco en modo avión.
  - **Una sola excepción, a propósito:** el botón «Ir al inicio» de la pantalla
    de rescate. Ahí lo que está dibujado no corresponde a la dirección que se
    pidió, así que la navegación interna no tiene de dónde agarrarse; un pedido
    nuevo, en cambio, lo contesta lo guardado en el celular.
- **Con señal no cambia nada.** El único costo, sin señal, es perder la animación.
- **Nunca borrar en masa lo que el navegador tiene guardado.** Si una pantalla
  tiene que salir siempre fresca, se configura así de entrada; no se limpia todo
  a lo bruto, porque eso se lleva puesto el uso sin señal.

### Cuando una pantalla revienta

La app tiene que tener **una red de rescate propia** para cuando una pantalla
falla al dibujarse. Sin ella la pantalla queda completamente vacía y el usuario
no tiene ni un cartel que leer. Esa red **no se borra ni se vacía nunca**.

**Ningún componente que envuelva la app puede quedarse en blanco mientras
espera.** Si algo tiene que esperar, muestra el contenido y tapa después, nunca
al revés.

**Todo lo que tape la pantalla tiene que destaparse solo, sí o sí.** La tapa del
arranque se quedaba puesta cuando una pantalla no llegaba a dibujarse: quedaba
un rectángulo negro con el ícono y, abajo, el aviso que el usuario necesitaba
leer. Cualquier cosa que tape lleva tope de tiempo, y vencido el tope se
destapa aunque no haya llegado lo que esperaba.

**Los archivos del motor offline no pasan por el control de sesión.** Si alguno
se manda al login, el motor se cae al arrancar, en silencio, y la app deja de
guardar **todo**: anda con señal como si nada y sin señal no hay nada. Pasó el
2026-09-20 con la pieza que decide qué mostrar cuando falta una pantalla.

**Un archivo de la app que ya no existe no es una pantalla rota: es una versión
nueva.** La versión nueva toma el mando al instante y la pantalla vieja que
quedó abierta pide archivos que ya no están. La red de rescate lo reconoce y
recarga la página sola, una vez. No reintentar por dentro: reintenta lo mismo
y falla igual. Pasó el 2026-09-21.

---

## Fotos

**Toda foto que se sube pasa por el módulo compartido de fotos. Sin excepción.**
Hoy la usa la foto de perfil; mañana las fotos de una salida. El día que haya un
lugar nuevo, se suma un destino al módulo — no se escribe otra subida.

- **Solo WebP, y nunca más de 2 MB.** No es gusto: cada foto que alguien mira
  paga su peso en datos del celular, y en el cerro los datos y la batería son el
  recurso escaso. La base lo exige por su cuenta, que es la defensa de verdad.
- **Prohibido guardar JPG o PNG.** Sería cargarle peso a la base al pedo.
- **El usuario elige la foto como la tiene** —de la galería, del iPhone, como
  venga— y la app la convierte antes de que salga del teléfono. Que el formato
  sea uno solo es problema de la app, no del usuario.
- **La foto se lee del celular una sola vez**, al elegirla. La galería la presta,
  no la entrega: leerla de nuevo al guardar falla aunque la primera vez saliera
  bien.
- **La vista previa es exactamente lo que se va a subir**, no una aproximación.
- **El tope de peso está garantizado, no intentado**: si con bajar la calidad no
  entra, se bajan las medidas hasta que entre.
- **Recortar es parte de elegir.** La forma la decide el destino, no la persona:
  donde la pantalla muestra un círculo, se recorta en círculo.
- Se puede hacer zoom con dos dedos, **pero siempre hay además botones grandes**.

## Pantallas emergentes

- **Nada del sistema operativo en pantalla.** Los carteles de confirmar y avisar
  los dibuja la app. Prohibido `window.confirm`, `window.alert`, `window.prompt`
  y `<select>` nativo.
  - Excepciones a propósito: elegir un archivo y elegir una fecha van nativos.
- **Una sola pieza dibuja todas las emergentes.** No escribir capas ni niveles de
  apilado a mano en cada pantalla.
- **Toda emergente se cierra con el botón físico de atrás**, y ese atrás cierra la
  emergente, no sale de la app.
- **Los botones de volver vuelven, no van.** Volver rearma una pantalla que ya
  estaba dibujada; ir a una dirección obliga a armarla de nuevo y sin señal eso
  termina en blanco.

---

## Reutilización

- **No se inventan componentes nuevos si ya hay uno que sirve.** Si hace falta uno
  nuevo, se agrega al conjunto compartido, no suelto en una pantalla.
- **No se escriben colores, tamaños ni espaciados a mano.** Salen de las variables
  del sistema de diseño.
- **Los botones tienen variantes definidas**: principal, secundario y destructivo.
  No se arma un botón nuevo escribiendo clases a mano.
- **Un solo rojo para borrar en toda la app.** En Vías de Escalada llegaron a
  convivir dos rojos distintos para el mismo botón de borrar, repartidos en
  decenas de pantallas. Cambiar una regla de diseño obligaba a tocar dieciséis
  archivos.

---

## Separación de capas

Cada cosa vive en un solo lugar. Si la lógica se mezcla con la pantalla, cambiar
una regla obliga a tocar veinte archivos y nadie sabe cuál manda.

| Qué | Dónde vive |
|---|---|
| Reglas de negocio y cálculos | capa de lógica, sin nada de pantalla |
| Datos guardados y sincronización | capa de datos |
| Pantallas y componentes | solo presentación, **sin pedir datos por su cuenta** |

**Un componente de pantalla no consulta la base ni descarga nada.** Recibe lo que
tiene que mostrar.

---

## Pedir listas a la base: el tope de 1000

**La base devuelve como máximo 1000 filas por respuesta y no avisa.** No da error:
responde bien, con la lista cortada. En Vías de Escalada eso dejó 202 vías
invisibles sin un solo cartel, durante meses.

- **Ninguna consulta sin filtro y sin tope.** O se traen todas por tandas, o se
  pide un límite explícito. No hay tercera opción.
- **Una consulta por tandas ordena por una columna única**, si no las tandas se
  pisan entre sí.
- **Contar y ordenar es trabajo de la base, no del celular.** Si solo hace falta
  un número, no se traen las filas para contarlas.
- **Verificar antes de dar por buena una descarga:** comparar lo que llegó contra
  el total que informa la base. Si no coincide, se avisa. Nunca decir «listo»
  sobre algo incompleto.

---

## Checklist obligatoria de pantalla o módulo nuevo

Esto es lo que hace que las reglas de arriba se cumplan de verdad en vez de
quedar escritas. **Una pantalla nueva no está terminada hasta que cumple los
once puntos.**

1. Usa las piezas compartidas. No inventó ninguna.
2. Colores, tamaños y espaciados salen de las variables. Ninguno escrito a mano.
3. Se ve bien en modo sol **y** en modo noche. Se probaron los dos.
4. Todas las zonas tocables cumplen el mínimo.
5. Las emergentes usan la pieza única y cierran con el botón físico de atrás.
6. Los botones de volver vuelven, no van.
7. Tiene resuelto **qué se ve cuando no hay nada**, **mientras carga** y **cuando
   falla**. Ninguno de los tres queda mudo.
8. Funciona sin señal, o dice claramente por qué no puede.
9. Los textos están en voseo y los errores dicen qué pasó y qué hacer.
10. Las palabras nuevas se agregaron al glosario.
11. Si toca algo crítico, trae su prueba automática.

---

## La red de seguridad

**Ale no lee código. Sin pruebas automáticas, nadie se entera cuando un cambio
rompe algo** — hasta que falla en el cerro.

- **Ninguna función de la que dependa la seguridad del usuario se entrega sin una
  prueba automática que la cubra.** La prueba se define **junto con** la función,
  no después.
- Qué funciones son ésas se define a medida que se define la app. No se decide
  de antemano ni se adivina.
- Las pruebas cubren **lo crítico**, no todo. Una batería enorme que nadie mira
  vale lo mismo que ninguna.
- **Una prueba que falla no se ajusta para que pase.** Se arregla lo que rompió.
  Prohibido saltear, desactivar o tapar una prueba para llegar a verde.

---

## Cómo habla la app

- **Voseo argentino**, directo, sin tecnicismos. El usuario no sabe programar.
- **Los errores dicen qué pasó y qué hacer.** Prohibido «error inesperado»,
  «algo salió mal» y cualquier variante que no informe nada.
- Sin signos de exclamación de relleno ni entusiasmo impostado. La app informa,
  no anima.
- Un mensaje corto que se entiende gana a uno preciso que no.

---

## Un concepto, una palabra

- **Todo en español**: lo que se ve en pantalla y lo que se escribe en el código.
  Sin excepciones.
- **El recorrido subido a la app se llama `ruta`.** En pantalla, en el código y
  en la base. **Prohibido «track», «trayecto» y «recorrido» para lo mismo.**
  La única excepción es `TrackApp`, que es el nombre del producto, no del
  concepto.
- **Cada concepto tiene una sola palabra en toda la app.** Sin sinónimos, sin
  variantes, sin «acá le decimos de otra forma porque queda mejor».
- Las palabras del proyecto viven en `docs/GLOSARIO.md`. **Palabra nueva, entrada
  nueva.** Si no está ahí, no se usa.

---

## Ante un problema: entender antes de tocar

**Prohibido ir directo a modificar código ante un error.** El orden es:

1. Agregar registros para ver qué datos están llegando de verdad.
2. Plantear cuál sería el resultado correcto, a mano.
3. Comparar lo real contra lo esperado.
4. Recién ahí decidir si el problema es de datos, de lógica o de código.

**Si el problema se ve en pantalla, se abre la app y se mira.** Hay navegador
disponible: se levanta la app y se la mira con los propios ojos. Leer código y
mandar a Ale a probar es una suposición por vuelta y le cuesta la tarde. Pasó
el 2026-09-19: cinco vueltas adivinando, veinte minutos mirando.

**Y antes de arreglar, explicarle a Ale en criollo qué está pasando**, para que
pueda aportar su mirada. Él conoce el uso real; el agente conoce el código.

Al cerrar un problema van dos cosas, no una: **arreglarlo**, y **ver si se puede
evitar que vuelva a pasar**.

---

## Usuarios

Hay tres categorías, y están fijadas: **administrador** (Ale, único dueño del
producto), **premium** (sus amigos) y **normal** (el resto).

**Qué puede hacer cada una todavía NO está definido, y no se inventa.** Se
define función por función, a medida que cada función se define. Ver
`docs/USUARIOS.md`.

---

## Base de datos

Convenciones fijas de Ale (ver el skill `stack-tecnico-fijo`):

- Nombres en **snake_case español**, tablas en plural.
- **Borrado lógico siempre** (`eliminado_en`), nunca borrado físico.
- `creado_en` y `actualizado_en` en toda tabla.
- **RLS activo desde que se crea la tabla**, sin excepción.
- **Y el permiso de leer y escribir para el usuario logueado, en la misma
  tanda.** Seguridad por fila **no** es permiso: sin el permiso la base contesta
  «permiso denegado», la app no trae nada y la pantalla queda en el cartel de
  error. Pasó en producción el 2026-09-19: las tablas tenían la seguridad puesta
  y ningún permiso de leer, y la app no mostraba ni una ruta.

**La base nueva cumple las cinco.** Toda tabla que se agregue también.

**Nunca asumir nombres de columnas.** Verificar contra la base antes de escribir
una consulta.

---

## Antes de decir que algo está listo

1. `npx tsc --noEmit` sin errores.
2. `npm run lint` sin errores. **La compilación lo corre sola y frena si hay
   alguno**, así que un error acá no llega a publicarse. Los avisos no frenan.
3. Las pruebas automáticas pasan. Si el cambio toca algo crítico, trae su prueba.
4. Si el cambio es visual: mockup aprobado por Ale **antes** de tocar código.
5. Si el cambio toca offline: probado con el modo avión activado.

---

## Git

- Se trabaja en `main`, salvo que la sesión indique otra rama explícitamente.
  En ese caso manda la instrucción de la sesión.
- Commit al terminar cada cambio completo y verificado, con mensaje que explique
  **por qué**, no qué.
- Push con `git push -u origin <rama>`.
- **Nunca commitear secretos** (`.env.local`, credenciales, claves).

---

## Documentación

Al cerrar una sesión con cambios, actualizar lo que corresponda según la tabla de
`docs/MANTENIMIENTO.md` y agregar la entrada en `docs/SESIONES.md`.

**Si un documento contradice al código o a la base, mandan el código y la base.**
El documento está viejo: se corrige, no se respeta.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
