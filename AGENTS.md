# TrackApp — reglas para agentes de IA

> App de navegación de Circuitos al aire libre. Se usa caminando, con sol fuerte,
> sin señal y con la batería como recurso escaso.
> Última revisión: 2026-10-13

---

## Antes de tocar nada


**Alejandro (el usuario y dueño de este producto) no lee ni entiende código en profundidad.** Todo lo que se explique tiene que entenderse sin saber
programar. Nada de nombres de archivos ni de líneas en las explicaciones.

**Ante ambigüedad, se pregunta.** Una pregunta corta ahorra medio día. No
avanzar sobre suposiciones. mientras menos decisiones sin defi ir mejor, por lo cual preguntarle al usuario la cantidad de veces que sea necesario.



---

## Regla de producto (manda sobre todas las demás)

### El usuario nunca se queda sin saber qué pasa

Esta app se usa en el cerro. Una pantalla congelada sin aviso es peligrosa: la
persona cree que está bien ubicada y no lo está.

- **Ninguna falla termina en pantalla vacía ni en un mapa congelado sin cartel.**
  Si algo se rompe, en pantalla tiene que decir *qué pasó* y *qué hacer*.
- **Si el GPS se pierde o la posición envejece, la mira del botón se pone
  amarilla.** No hay cartel. No alcanza con dejar de mover el punto azul.
  Decisión de Ale, 2026-10-16.
- **Si el GPS falla, la mira se pone roja y sigue en el mapa.** Sin permiso o
  sin ubicación, el cartel aparece solo y se puede cerrar. Si tarda demasiado
  o deja de responder, no hay cartel hasta que se toca la mira. En los cuatro
  casos, tocarla muestra qué pasó y qué hacer. Decisión de Ale, 2026-10-17.
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

### Contraste y texto (mínimos, no objetivos)

| Qué | Mínimo |
|---|---|
| Contraste de texto normal | 7:1 |
| Contraste de texto grande, íconos y bordes | 4.5:1 |
| Texto de cuerpo | 16 px |
| Texto en la pantalla de navegación | 18 px |

### Botones: un solo tamaño, el normal. Tema cerrado.

**Decisión de Ale, 2026-09-25.** Los botones grandes tapan el mapa y entorpecen
el uso. No sirven.

- **Todo botón de la app tiene el tamaño normal**: el de las pantallas de
  administración. **También al navegar un Circuito y en la navegación libre.** No existe un
  tamaño «para navegar» ni «para el cerro».
- **Prohibido agrandar un botón por encima de ese tamaño.** Ni la zona que
  responde al toque, ni el dibujo, ni la letra.
- Los botones redondos con ícono miden lo mismo que el alto de un botón normal.
- **Prohibido a los agentes volver a plantear este tema.** Nada de «zona
  tocable mínima», «caminando el dedo no apunta fino» ni «botones grandes para
  el cerro». Ya está respondido: no.

### Una sola mano

**Los guantes no son un caso de diseño.** Se sacó la regla el 2026-09-24,
decisión de Ale: no se exige un botón grande que repita cada gesto fino.

- **No existe «tirar hacia abajo para recargar».** La app lo ignora: no sirve
  para nada y en el cerro recarga el mapa sin querer.
- **Todo lo importante va en la mitad de abajo de la pantalla**, al alcance del
  pulgar. Nada crítico en las esquinas de arriba.
- **Pantalla mojada = toques fantasma.** Toda acción que borre o cancele algo
  pide confirmación.
  **Todo lo de esta sección aplica al módulo de navegación, no a sectores, zonas
  y demás módulos.**

### Mapa

- **Google satelital para consulta con señal.** Muestra los datos propios ya guardados. También muestra, al traer un archivo, las líneas y puntos tal como vinieron, para decidir si se suman; ahí no se mueven ni se marcan puntos nuevos. **Única excepción para marcar: en Marcas, al agregar un punto, se toca su ubicación inicial sobre Google antes de abrir el formulario.** El editor recibe esa coordenada, el centro y el zoom exactos; continúa sobre el mapa propio. Fuera de esa elección inicial, Google no se usa para dibujar, corregir o exportar coordenadas. Los editores conservan el fondo propio en vivo. Las dos navegaciones conservan exclusivamente los mapas descargados. La imagen de Google nunca se precarga ni se guarda offline; se muestran sus créditos variables. Decisiones 050 y 074; Ale, 2026-10-22.

- **El satelital sin conexión no compite con Google Earth.** No hay foto más
  nítida que sea gratis, legal y guardable para la sierra (decisión 079; no
  volver a investigarlo). **Una mejora chica ya es éxito**: no se frena una
  mejora por no llegar a Google. Cada sector baja además el **sombreado del
  terreno** (altura de 5 m de IDECOR en Córdoba, 30 m afuera). Si IDECOR no
  contesta, el sector baja igual con 30 m, avisa con el motivo y se puede
  reintentar: no frena. Ale, 2026-10-31.
- **Zonas y sectores solo organizan la cobertura y descarga de mapas.** No
  clasifican ni delimitan marcas ni Circuitos. Un Camino no
  se parte ni se asigna por cruzar uno o muchos de ellos. Antes de salir, se
  usa la ubicación del Circuito o del área que se desea explorar para saber
  qué mapas descargar. Decisión de Ale del 2026-10-05; adaptación pendiente.
- **Cada Camino indica una o más actividades, con al menos una obligatoria.**
  Usa las cinco existentes: Trekking, Correr, Mountain bike, Kayak y Canyoning.
  La condición de paso y la complejidad de cada parte se clasifican por
  actividad y pueden ser distintas entre actividades. En Consultas, la
  actividad elegida determina qué clasificación se destaca. Ahí todos los
  Caminos siguen visibles; los de otras actividades se muestran con menor
  protagonismo. En la navegación libre se elige cuáles actividades se ven:
  vienen todas prendidas, y se puede dejar una, algunas o todas. Un Camino
  se ve si sirve para alguna de las prendidas, con la clasificación de la
  primera de esas. Se recuerda la elección. Observación y fecha de
  comprobación son únicas por parte, compartidas entre actividades. Partir
  una parte vale para todas las actividades. **Una parte «sin paso» no lleva
  complejidad** (Ale, 2026-10-14). Decisiones 036, 038 y 062.
- **Un Camino mal dibujado se puede corregir como el mismo Camino**, por su
  autor o por el Administrador; no se exige volver a importarlo como otro.
  Corregir la línea conserva condición y complejidad de todas las partes que
  continúan, también la redibujada; no reinicia «por explorar» ni pide
  revisión automática. La clasificación puede editarse por separado sin
  modificar la línea. Decisión 037.
- **Largo, alturas y desnivel nunca se cargan a mano.** Las alturas de un
  Camino y de las partes propias de un Circuito salen del relieve del terreno
  al guardar, con conexión; si el relieve no contesta, no se guarda. El
  desnivel de un Circuito se calcula sobre su propia línea y en su sentido, con
  lo vigente de sus Caminos: nunca sumando los números de cada Camino. Técnica,
  esfuerzo, qué llevar, complicaciones y comentario del Circuito sí se cargan a
  mano. Decisión 049.

- **Todo lo que se dibuja encima del mapa es una marca**: Caminos, puntos
  y trazos (decisión 052; las tranqueras son puntos y los alambrados, trazos). Mapas tiene cuatro entradas
  en el menú, sin pestañas adentro: **Consultas, Marcas, Zonas y Descargas**.
  Consultas, para todos, muestra las marcas, con filtros simples (actividad;
  Caminos, Zonas y Detalles) y un buscador arriba del panel: ignora mayúsculas
  y tildes, pone primero las zonas, después los Caminos y al final los
  Detalles, y al elegir uno el mapa viaja hasta ahí, de a poco. Los resultados
  van justo debajo del cuadro de buscar, juntos en un recuadro. Destildar
  Zonas oculta sus líneas; con Zonas prendida, adentro se elige si se ven
  solo las zonas o también los sectores. En Caminos no va la
  ayuda de colores y líneas. En punto nuevo, Camino nuevo y trazo nuevo las
  tres opciones de líneas (nada, zonas, o zonas y sectores) empiezan sin
  líneas, arriba de los datos. En esos
  mapas, junto a ubicarme y ver en grande, una lupa abre un buscador: mientras
  se escribe filtra zonas, sectores, Caminos, puntos y trazos; los pueblos y
  ciudades se buscan en internet recién al apretar el botón, y al elegir
  cualquiera el mapa viaja hasta ahí. Marcas es la lista con tildes y filtros,
  y muestra solo lo que entra en el mapa que se está mirando (decisión 057).
  Arriba del panel hay tres opciones de líneas: al abrir se ven las de las
  zonas tildadas; se pueden sumar las de sus sectores, o no ver ninguna. El
  «+» y los tres puntos solo para Administrador y Premium. La navegación
  libre también muestra todas las marcas. La navegación libre no
  dibuja sectores. Al tocar
  una zona aparece su ficha breve, que se abre tocándola completa. Nombres e
  íconos aparecen gradualmente al acercarse. Ver `docs/decisiones/029` y `052`.
- **Lista y mapa son dos momentos**: en la computadora van lado a lado; en el
  celular la lista es un panel que sube desde abajo, con los gestos de Vías de
  Escalada (bajar desde la lista solo si ya está arriba del todo), «Ver mapa» y
  el botón físico de atrás. Sin deslizar de costado.
- **En PC, al agregar, traer o editar marcas, los datos van a la izquierda y el mapa a la derecha.** Al abrir Punto, Trazo o Camino nuevo desde Marcas se conservan el centro y el zoom que se estaban mirando. Decisión 074; Ale, 2026-10-22.
- **Tranqueras y alambrados los trae OpenStreetMap solos al crear una zona** y
  quedan fijos: no se corrigen, no se borran, no se vuelven a buscar. Zonas y
  sectores no cargan marcas, y borrarlos no borra marcas.
- **En cualquier mapa, tocar un punto abre su ficha con el nombre del ícono, el
  comentario y la foto disponible.** En PC el cursor muestra una mano sobre los
  puntos. Navegación libre y navegación de Circuitos conservan su ficha completa.
- **Un punto puede llevar Atención: contorno rojo del ícono**, «mirá esto», no
  «prohibido» ni «peligro»; el motivo va en la descripción. Se pone y se saca
  con señal desde Mapas, nunca navegando; Administrador en todos, Premium en
  los suyos; nunca en lo de OpenStreetMap. No afecta Caminos, Circuitos ni
  trazos. Decisión 078; Ale, 2026-10-24.
- **El mapa de navegación va a pantalla completa**, sin nada alrededor.
- **Todo mapa se puede abrir en grande**, con un botón abajo a la derecha. En el
  celular un mapa chico no alcanza para ver si el Circuito queda adentro de un
  sector. Al agrandarse y al cerrarse se vuelve a encuadrar lo que hay que
  mirar, no lo que se estaba mirando. La cruz para cerrarlo queda en el margen
  de arriba a la derecha. La navegación libre y la de un Circuito no la llevan
  ahí: se salen con el botón de abajo a la izquierda (Ale, 2026-10-14).
  **Única excepción al botón de agrandar:** el mapa de la zona adentro de
  «Circuitos en el mapa», que va sin botones propios (decisión 025).
- **Siempre tiene que haber una forma visible de salir**, y tiene que responder
  también al botón físico de atrás.
- **En los mapas del cerro el GPS se prende solo al entrar y se apaga al
  salir.** No hay botón para prenderlo. Abajo a la izquierda van salir
  y Marcas. En la navegación libre sigue el círculo de actividades. Al
  navegar un Circuito siguen «Circuitos en el mapa» e Información. No hay
  carteles de desvío. Ver `docs/decisiones/025`, `049`, `062` y `067`.
- **La pantalla no se apaga mientras se está navegando.**

---

## Offline

### La navegación es 100% sin conexión. Sin excepciones.

**El 99% de las salidas se hacen sin señal.** Por lo tanto:

- **Navegar un Circuito con el punto de GPS NO consulta internet. Nunca. Por ningún
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

Administrar —crear y editar zonas, sectores, Caminos y Circuitos, marcar rectángulos, subir
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
- **Salidas es 100 % con internet**, con una sola excepción: **el registro en
  curso** de una salida mientras se navega se guarda en el celular y sube solo,
  como borrador, con señal y la navegación cerrada (decisión 032). Las
  pantallas de salidas no se guardan en el celular ni se calientan.
- **Mapas es 100 % con internet** (decisión 052): sin señal desaparece del
  menú y sus pantallas —también las zonas— no se guardan ni se calientan. Sin
  señal solo se navega y se marca en el momento. Prohibido a los agentes
  plantear usar Mapas o Descargas sin señal.

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

### Internet una vez por apertura

**La app sale a internet al abrirse; después, cambiar de pantalla no sale.**
Quién sos y tu tipo de usuario se averiguan al abrir y quedan guardados.
Las pantallas de todos los días quedan listas al abrir; Salidas y Perfiles se
piden la primera vez que se entra y después se reusan. Lo que una pantalla le
pide a la base, una vez por apertura; al guardar algo, llega fresco. Ninguna
página le pregunta al servidor quién sos. Ver `docs/decisiones/054`.

### Señal que sirve, no red enganchada

**Pasó el 2026-09-27.** Con una rayita de cobertura el teléfono dice que hay red
aunque no pase nada: la app mostraba botones que fallaban y la puesta al día
quedaba esperando minutos. Ver `docs/decisiones/026-senal-que-sirve.md`.

- **Para decidir «intento internet o uso lo guardado» se pregunta
  `hayConexion()`** (`lib/conexion.ts`) o, en pantalla, `useHaySenal()`.
  **Nunca `navigator.onLine`.**
- **Señal débil = sin señal**, exactamente el modo de siempre. No se inventa un
  tercer modo.
- **El detector no prueba con la navegación abierta.** Probar es salir a
  internet. Al cerrar el mapa, vuelve a preguntar, para no dejar Salidas como
  si siguieras en el cerro.
- Todo pedido a la base tiene tope de 15 s (`lib/supabase/navegador.ts`), salvo
  las subidas de fotos.
- `/api/senal` va **siempre a internet** en el motor offline, con regla propia y
  primera. Si cae en la regla de `/api/` de la librería, contesta una copia
  guardada y la app cree que hay señal sin haberla.

### Sin señal no se muestra lo que no funciona

**Un botón que al tocarlo falla es información basura.** Sin señal desaparece:
crear, editar y borrar zonas, sectores, Caminos y Circuitos; bajar mapas; la pantalla de
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
las que van a hacer falta sin señal: el inicio, la lista de Circuitos, el mapa
libre y la navegación de cada Circuito. Sin eso, un Circuito que nunca se abrió
con señal no se puede navegar en el cerro.

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

- **La lista de Circuitos avisa dos cosas distintas y no las mezcla:** los
  mapas que tenías y ya no están —una pérdida— y los Circuitos que nunca
  tuvieron mapa —una tarea—. Van en una **franja ámbar chica arriba de todo**
  que dice cuántos hay y se toca para verlos enteros; nunca abiertos ocupando
  la pantalla. Además **cada tarjeta de Circuito dice cuánto mapa tiene
  bajado** (en sectores). Decisión 053. El inicio abre Salidas con conexión.
  Sin señal abre Circuitos, la pantalla de siempre. Mientras todavía no se
  sabe si hay señal, solo se ve que la app está pensando: no hay una pantalla
  aparte con accesos (decisión 065).
- **Sacar un mapa a propósito se hace en Descargas, con señal.** Si la base no
  contesta, el sacado queda anotado como pendiente en el celular y no se cuenta
  como perdido hasta que la base lo acepte. Sin eso, la app le ofrece al usuario bajar de
  nuevo justo lo que él decidió tirar.
- **El emparejado va del celular a la base y solo agrega.** Nunca se borra de la
  base un mapa porque no esté en el celular: eso es la pérdida que hay que
  detectar, y borrarla sería olvidar el problema en vez de avisarlo.

Ver `docs/decisiones/021-la-base-recuerda-que-mapas-bajaste.md`.

### Lo que se marca en el cerro

- **Marcar desde la navegación no sale a internet.** Lo marcado, cambiado o
  borrado queda en el celular y sube solo **con señal y la navegación
  cerrada**. Primero los datos, después la foto: si la foto falla, lo demás ya
  subió y la ficha dice que la foto no. Ver
  `docs/decisiones/023-anotar-desde-la-navegacion.md`.
- **En el cerro solo se ve la foto chica.** Baja sola con las marcas; la
  grande nunca baja y se mira con internet en Mapas.
- **Manda el punto del GPS**, caiga o no en un sector. Dónde se muestra una
  marca sale de dónde está, no de a qué sector se la anotó.

### El resto

- **La navegación libre sigue las mismas reglas de navegación:** lee solo lo guardado,
  nunca se pone al día, nunca se recarga, y queda lista sola al abrir la app.
- **La navegación no se pone al día.** Lee con `usePaqueteGuardado`, nunca con
  `useDatosDeLaApp`, y la puesta al día se niega a correr con la navegación
  abierta. Pasó el 2026-09-24: estaba escrito y no se cumplía.
- **Lo de `public/` va en la precarga**: se guarda al instalar y nunca pregunta
  a internet, aunque las reglas de `next.config.ts` digan otra cosa. Para
  saber qué hace el motor offline se mira el `sw.js` publicado, no solo las
  reglas.
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

**Antes de recargar, la red de rescate le pregunta a internet por la pieza.**
Si contesta que no existe, hay señal y salió una versión nueva: se tiran las
pantallas guardadas —las del cerro se abren siempre desde el celular y
volverían a pedir la pieza vieja— y se recarga. **Si no contesta, no se tira
nada**: puede ser el cerro sin señal, donde lo guardado es lo único que deja
navegar. Pasó el 2026-09-24 en la navegación libre.

**El cartel de la red de rescate muestra todos los datos de la falla**, con un
botón para copiarlos. Pedido de Ale: se arregla con una captura, no a las
adivinanzas. No se sacan ni se esconden.

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
- Se puede hacer zoom con dos dedos, y además hay botones de tamaño normal.

## Pantallas emergentes

- **Nada del sistema operativo en pantalla.** Los carteles de confirmar y avisar
  los dibuja la app. Prohibido `window.confirm`, `window.alert`, `window.prompt`
  y `<select>` nativo.
  - Excepciones a propósito: elegir un archivo y elegir una fecha van nativos.
- **Una sola pieza dibuja todas las emergentes.** No escribir capas ni niveles de
  apilado a mano en cada pantalla.
- **El panel que sube desde abajo es solo para el mapa.** Se usa únicamente
  para elegir qué se ve sobre un mapa mientras se lo mira (la lista de Marcas
  y Consultas, los Circuitos sobre el mapa de una zona). Elegir una opción para
  hacer algo —descargar, agregar, confirmar, avisar— va en la ventana al medio.
  Prohibido usarlo «porque hay opciones para elegir». Decisión de Ale,
  2026-10-13.
- **Toda emergente se cierra con el botón físico de atrás**, y ese atrás cierra la
  emergente, no sale de la app. Si hay varias, cierra solo la de adelante.
  **En la computadora, Escape hace lo mismo que la cruz**: cierra solo lo que
  está adelante. Si hay varias, la de atrás se queda.
- **Los botones de volver vuelven, no van.** Volver rearma una pantalla que ya
  estaba dibujada; ir a una dirección obliga a armarla de nuevo y sin señal eso
  termina en blanco.

---

## Reutilización

- **El menú va en el mismo orden en celular y PC:** Salidas, Circuitos,
  Navegación libre, Mapas y Perfiles. Salidas es el inicio con conexión.
- **Un módulo con varias pantallas las lleva como entradas del menú, no como
  pestañas adentro**: en PC se despliegan en la barra lateral; en el celular,
  tocar el módulo lleva a una pantalla con una tarjeta por entrada, y cada
  entrada vuelve a esa pantalla (decisión 052).
- **Un comportamiento, un botón compartido:** volver es un círculo con flecha;
  agregar es un círculo con «+»; navegar usa el ícono de Navegación libre.
  En las listas, editar y eliminar van en los tres puntos. En el detalle de una
  Salida y de un Circuito van abajo, uno al lado del otro: un círculo con
  lápiz para editar y un círculo rojo con tacho para eliminar. El tacho pide
  confirmación (Ale, 2026-10-18). Al editar un punto o un trazo, Eliminar
  sigue abajo de todo.
- **Nada se guarda solo.** Tocar una opción cambia lo que se ve; se guarda
  recién con el botón «Guardar», uno solo al pie de lo que se edita. Prohibido
  el autoguardado (Ale, 2026-10-14).
- **Lo que cambia la sección que se ve es una pestaña, no un botón**
  (pieza compartida de pestañas). Los botones hacen cosas; las pestañas
  muestran. Los avisos de guardar van junto a su botón, no arriba del mapa.
- **Un ícono, una sola identidad.** Cada módulo o función tiene su ícono, el
  mismo en celular y PC y en todas las pantallas donde se nombra; ninguna otra
  cosa puede usar ese dibujo. Si aparece uno repetido, no se deja pasar. Viven
  en un solo lugar compartido. Decisión de Ale, 2026-10-13.
- **La tarjeta que abre un detalle se toca entera.** «Abrir» va discreto abajo
  a la derecha; no lleva un segundo botón «Ver».
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
4. Todos los botones tienen el tamaño normal. Ninguno agrandado.
5. Las emergentes usan la pieza única y cierran con el botón físico de atrás.
   En la computadora, Escape hace lo mismo que la cruz de lo que está adelante.
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
- **Rutas se retiró el 2026-10-08** (decisión 049). La estructura vigente
  separa **Camino** (posibilidad de paso marcada en Mapas) de **Circuito**
  (puede combinar partes de Caminos existentes con partes dibujadas solo para
  él, sin redibujar los Caminos). Ver decisión 034. «Ruta» solo queda en
  carpetas de piezas compartidas y en la tabla vieja de la base. **Prohibido «track», «trayecto» y
  «recorrido» como nombres alternativos de esos conceptos.** La única
  excepción es `TrackApp`, que es el nombre del producto.
- **«Anotación» se retiró el 2026-10-13** (decisión 052): todo lo dibujado
  sobre el mapa es una **marca**. Solo queda en el código y en la tabla vieja
  `anotaciones` de la base.
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

**Para contenido de Mapas y Circuitos ya hay permisos decididos**. En Mapas se
aplicaron a interfaz, acciones y base; faltan pruebas con las tres categorías
reales. Circuitos ya tiene editor, detalle, guardado y navegación; faltan pruebas
de uso sin señal en un celular real. Administrador y Premium crean y editan lo propio;
Administrador edita todo; Normal solo consulta. Normal puede registrar su
Salida y cargarle fotos. No se inventan permisos para otras funciones. Ver
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
4. Si el cambio toca offline: probado con el modo avión activado.

---

## Git

- Se trabaja en `main`, salvo que la sesión indique otra rama explícitamente.
  En ese caso manda la instrucción de la sesión.
- Commit al terminar cada cambio completo y verificado, con mensaje que explique
  **por qué**, no qué.
- Push con `git push -u origin <rama>`.
- **Nunca commitear secretos** (`.env.local`, credenciales, claves).

### Borradores (PR): sin vigilancia (NO NEGOCIABLE)

Ale trabaja sola con el agente: lo que se hace queda unos minutos como borrador y después va a
producción. A nadie le interesan los avisos de un borrador y cada uno gasta uso sin dar nada.

- **Nunca** quedarse suscripto a la actividad de un borrador. El entorno suscribe solo apenas se
  crea: **inmediatamente después de crear el borrador, desuscribirlo**
  (`unsubscribe_pr_activity`), sin esperar a que Ale lo pida.
- **Nunca** programar recordatorios, check-ins, loops ni tareas diferidas para revisar un borrador
  (`send_later`, triggers, rutinas).
- Si llega un aviso automático de un borrador (CI, comentarios de Vercel, etc.): no hacer nada y
  no responder. Solo se trabaja cuando Ale escribe.
- Crear el borrador y listo: no se vigila. Publicar (fusionar a `main`) solo cuando Ale lo pide.

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
