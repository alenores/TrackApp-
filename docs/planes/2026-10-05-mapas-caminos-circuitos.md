# Separar el mapa de caminos de la planificación de circuitos

**Estado al 2026-10-07:** Mapas/Caminos está publicado y Ale empezó la prueba
de importación con su KML: aparecen siete líneas y ningún punto. Falta probar
el guardado y la edición completos, los permisos con las tres categorías y el
uso real en modo avión. En paralelo comienza el diseño de Circuitos; todavía
no existe como módulo, tabla ni editor.

## Por qué se plantea

Alejandro examina Google Earth en su casa, marca varias alternativas y sale a
explorarlas en bicicleta. Algunas huellas siguen abiertas, otras exigen caminar
con la bicicleta y otras no permiten el paso. Necesita ver **todas** las
alternativas y los puntos de referencia para decidir sobre el terreno. Una
salida planificada puede coincidir con caminos marcados o con vías evidentes
del mapa de fondo; no debe crear nuevos caminos en el mapa.

La palabra «ruta» está cumpliendo dos funciones distintas en la app actual:
una línea que se agrega al mapa desde un archivo y una propuesta de salida con
actividad, esfuerzo y dificultad globales. Esa mezcla originó la revisión.

## Situación real de partida, verificada en el repositorio

- **Mapas** contiene zonas, sectores, mapas descargables y anotaciones de punto
  o trazo. La importación de anotaciones de Google Earth acepta puntos y líneas.
- **Rutas** ya existe: tiene lista, alta desde GPX/KML, ficha, edición,
  navegación y un registro en la tabla `rutas`. Una ruta guarda su línea y
  también actividad, largo, desniveles, dificultad técnica y esfuerzo global.
- **Salidas** ya existe y significa lo que efectivamente ocurrió un día. Su
  registro puede referirse a `ruta_id`; no es sinónimo de un Circuito futuro.
- **Circuitos no existe**: no hay módulo, tabla ni editor con ese nombre.
- Hay un **prototipo local sin publicar y sin confirmar** que divide una ruta
  actual en partes, les asigna condición de paso y complejidad, las dibuja en
  el mapa y ofrece las líneas de un KML por separado. Está en cambios locales
  sin confirmar. No se deben copiar sus decisiones de ubicación de datos o
  pantalla como si ya hubieran sido aprobadas para la nueva estructura.
- El KML `Ascochinga Bike 1.kml` compartido por Ale tiene siete líneas y
  ningún punto. Es ejemplo de importación con alternativas, no una sola
  salida de 73 km. No se ha cargado en la base por este trabajo.
- La sincronización actual descarga `rutas`, `zonas`, `sectores` y
  `anotaciones`; guarda aparte las geometrías de las rutas para navegar sin
  conexión. La nueva división deberá rediseñar ese flujo.
- Las filas antiguas de la base no se usan como ejemplos, no se conservan por
  defecto y no se migran por inercia, según `AGENTS.md`.

## Acuerdos de producto expresados por Ale

1. Los caminos o huellas que se descubren pertenecen conceptualmente a
   **Mapas**, no a la planificación de una salida.
2. Cada parte de un camino puede estar **por explorar**, ser **transitable**,
   requerir **ir a pie con el equipo** o estar **sin paso**. Una parte sin paso
   sigue visible y lleva X.
3. La **complejidad local** es fácil (verde), media (amarillo), difícil
   (rojo) o todavía sin clasificar. No representa el esfuerzo global ni la
   dificultad técnica de una salida. La condición de paso se distingue además
   por el tipo de línea: entrecortada para explorar, continua para
   transitable, puntos para ir a pie y X para sin paso.
4. **Circuitos** será la planificación: se podrán incorporar partes de Caminos
   ya marcados sin redibujarlas y sumar partes dibujadas solo para ese
   Circuito. También se podrá dibujar todo el Circuito sin usar Caminos, por
   ejemplo sobre una vía evidente del mapa de fondo. Los puntos y trazos son
   referencias, no piezas obligatorias del Circuito. Armar o editar un Circuito
   no agrega ni modifica contenido de Mapas. Su desarrollo se deja para una
   etapa posterior; no bloquea construir y probar Mapas/Caminos.
5. **Salidas** conserva su significado actual: lo que ocurrió realmente.
6. La administración se hace en computadora y con conexión. La navegación
   en el cerro usa únicamente datos descargados; nunca consulta internet.
7. Al importar un proyecto de Google Earth, **Ale elige para cada línea** si
   se guarda como camino explorable o como trazo de referencia. La app no lo
   deduce del color original. Confirmado por Ale después de la auditoría de
   Claude, el 2026-10-05.
8. Si el archivo trae marcadores, la misma importación los ofrece como
   **puntos del mapa**, con vista previa y sin exigir que se asignen a un
   sector. Confirmado por Ale el 2026-10-05. Los puntos no son partes de un
   camino.
9. **Permisos del contenido del mapa, confirmados por Ale:** Administrador y
   Premium pueden sumar Caminos, puntos, trazos y anotaciones, y editar los
   propios. El Administrador puede editar los de todos. El usuario Normal
   **solo consulta ese contenido**: no lo suma ni lo edita, tampoco mientras
   navega. Sí puede cargar fotos en su propia Salida y registrar una Salida
   durante el paseo para subirla cuando vuelva la señal. Esta decisión
   sustituye el permiso anterior que dejaba anotar en el mapa al usuario
   Normal. La regla ya se aplicó a la interfaz, el servidor y la base; falta
   probarla de punta a punta con cuentas reales de las tres categorías.
10. **Permisos de Circuitos, confirmados por Ale:** Administrador y Premium
    pueden crear y editar Circuitos; Normal solo puede consultarlos. El patrón
    de autor que edita lo propio y Administrador que puede editar todo se
    conserva para esta función.
11. **Mapa general de Mapas, confirmado por Ale:** debe mostrar todo el
    contenido marcado: Caminos, puntos y trazos. Esta decisión reemplaza la
    regla anterior que allí solo mostraba zonas y puntos.
12. **Navegación libre, confirmado por Ale:** también debe mostrar todos los
    Caminos, puntos y trazos del mapa.
13. **Composición opcional de Circuitos, confirmado por Ale:** un Circuito
    puede tomar partes de Caminos existentes sin volver a dibujarlas y
    combinarlas con partes nuevas dibujadas solo para el Circuito. Ninguna de
    las dos formas es obligatoria. Mapas/Caminos se puede implementar y probar
    por separado antes de desarrollar Circuitos. Más adelante se definirá el
    editor y la navegación de Circuitos; también se podrá encargar esa etapa
    a Claude con instrucciones completas y aisladas.
14. **Propósito único de Zonas y Sectores, confirmado por Ale:** fragmentan la
    descarga de mapas. No clasifican ni delimitan Caminos, Circuitos, puntos
    o trazos. No importa cuántas zonas o sectores atraviese un Camino: no se
    parte ni se asigna por ello. Antes de salir, la ubicación de un Circuito
    planificado o del área que se quiere explorar a ojo sirve para determinar
    qué mapas descargar. Ver decisión 035.
15. **Actividades de Caminos, confirmado por Ale:** cada Camino indica para
    qué actividades sirve. Debe tener al menos una y puede tener varias. No
    se deja esta información únicamente al Circuito. En cada parte, condición
    de paso y complejidad local se registran por actividad: pueden diferir
    entre las cinco actividades ya existentes: Trekking, Correr, Mountain
    bike, Kayak y Canyoning. Ver decisión 036.
16. **Actividad principal del mapa, confirmada por Ale:** la persona elige una
    actividad que determina qué clasificación de cada Camino se destaca.
    Todos los Caminos permanecen visibles y consultables; los que solo sirven
    para otras actividades se ven menos destacados, sin desaparecer. Un Camino
    de varias actividades muestra la condición y complejidad de la elegida;
    al tocarlo se pueden consultar también las otras. Cada persona elige su
    actividad principal en el mapa y la app recuerda su última elección.
    Ver decisión 036.
17. **Corrección de Caminos, confirmada por Ale:** un usuario autorizado puede
    corregir en la app la línea de un Camino mal dibujado, manteniendo el
    mismo Camino sin importar uno nuevo. **Cambiar el dibujo no altera la
    condición ni la complejidad de las partes que continúan**, incluso en la
    parte redibujada. Estos datos solo cambian por una edición expresa. No se
    exige revisión automática por mover la línea. Ver decisión 037.
18. **Datos compartidos de una parte, confirmados por Ale:** cada parte tiene
    una sola observación y una sola fecha de comprobación para todas sus
    actividades. La fecha no puede ser futura. Condición de paso y complejidad
    siguen siendo por actividad.
    Ver decisión 038.
19. **Límites de texto de Caminos, confirmados por Ale:** nombre hasta 120
    caracteres, descripción hasta 2.000 y observación de cada parte hasta
    1.000. Ver decisión 039.
20. **Camino retirado, confirmado por Ale:** la app no ofrece recuperar uno
    retirado, ni siquiera al administrador. La baja permanece en la base para
    avisar a los demás dispositivos. Ver decisión 040.
21. **Archivo importado, confirmado por Ale:** después de elegir qué líneas y
    puntos incorporar desde Google Earth, la app guarda Caminos, puntos y
    trazos; no conserva el KML original. Ver decisión 041.

**«Caminos» es el nombre definitivo** de esa capa de Mapas, incluso cuando
incluye pasos de kayak. Confirmado por Ale el 2026-10-05. «Circuitos» nombra
la planificación, y «Salidas» conserva su significado actual.

## Modelo conceptual propuesto, todavía sin esquema aprobado

```text
Mapas
  ├─ fondo simple/satelital; zonas y sectores solo para cobertura de descargas
  ├─ anotaciones: puntos y trazos de referencia (río, alambrado, etc.)
  └─ caminos: alternativas transitables o por explorar, con partes clasificadas

Circuitos
  └─ Circuito que combina partes de Caminos reutilizadas y partes propias dibujadas

Salidas
  └─ relato y, si existe, registro GPS de lo que se hizo realmente
```

Un Circuito puede utilizar partes de varios Caminos sin obligar a redibujarlas.
También puede seguir vías del fondo del mapa que no sean Caminos marcados. Las
partes tomadas de un Camino conservan el vínculo y siguen las correcciones de
su línea. Antes de salir se avisa del cambio (decisión 042). Si partes del
Circuito quedan sin unir, se permite guardarlo con aviso de partes sin unir y
sin inventar el enlace (decisión 043).
Ale definió después que el editor dibuja el Circuito punto por punto desde
cualquier lugar: dos toques consecutivos sobre el mismo Camino hacen que la
línea siga su curso, y un toque fuera la hace salir. No hay selección previa
obligatoria de Caminos ni modos separados (decisión 044).

## Decisiones pendientes antes de implementar

Estas preguntas no se responderán por suposición ni por lo que hace la app
vieja. Se plantearán a Ale en conversaciones breves y se esperará su respuesta:

1. **Armado de un circuito:** se dibuja punto por punto. Si dos puntos seguidos
   están en el mismo Camino, se sigue su línea; fuera de él, el dibujo sigue
   libre. Las partes vinculadas siguen las correcciones del Camino y las
   separaciones se guardan con aviso. Falta resolver la selección en cruces.
2. **Permisos:** las categorías para el contenido del mapa y los Circuitos
   ya están definidas arriba. Para clasificar una parte de un Camino se aplica
   la regla de edición del Camino. Falta traducir la decisión a controles de
   interfaz, servidor y base, sin conservar permisos viejos por accidente.
3. **Dónde se ven:** el mapa general de Mapas y la navegación libre mostrarán
   todos los Caminos, puntos y trazos. Queda por resolver el comportamiento de
   otras vistas si su implementación lo exige.
   Los Caminos no se asignan a Zonas ni Sectores; estos solo determinan qué
   mapas descargar para el área prevista.
4. **Datos globales de Circuitos, diferidos:** qué campos actuales de Rutas
   pasan a Circuitos, cuáles pertenecen al Camino y cómo se calcula el largo y
   desnivel de la línea propia.
5. **Relación con Salidas:** si una salida registrada conserva referencia a
   un circuito, y qué se muestra cuando el camino cambia luego de la salida.
6. **Importación:** cómo tratar una línea que tiene bifurcaciones o varias
   alternativas. La elección camino/trazo para cada línea y los puntos del
   mismo archivo ya están decididos arriba.
7. **Caminos con varias actividades:** condición de paso y complejidad de cada
   parte se clasifican por actividad. En el mapa se destaca la elegida sin
   ocultar los demás Caminos. La última elección se recuerda. Falta definir
   cómo se representa una actividad todavía sin evaluar.
8. **Corrección de la línea:** se edita el Camino existente y las partes que
   siguen en la línea conservan sus clasificaciones. Falta diseñar la
   interacción exacta del editor.

Mapas/Caminos se prueba de manera independiente. La etapa de Circuitos empieza
con el diseño de su vínculo con Caminos y sus pantallas. Nadie crea tablas de
Circuitos, renombra `rutas`, mueve `ruta_id`, convierte registros ni cambia la
navegación antigua sin un contrato revisado y las decisiones pendientes.

## Plan de ejecución y responsables

| Etapa | Resultado verificable | Responsable |
|---|---|---|
| 0. Diagnóstico | Inventario del código y de las reglas afectadas; propuesta de modelo con alternativas y preguntas para Ale. Sin editar la app. | Claude estudia Mapas y el futuro camino; Codex estudia Circuitos y las dependencias comunes. |
| 1. Contrato de Mapas/Caminos | Cerrar sus decisiones de producto, permisos, estructura de datos y bocetos que correspondan. Circuitos no bloquea esta etapa. | Codex redacta y coordina; Ale decide. |
| 2. Mapas/Caminos | Implementar y probar la importación y edición de Caminos, puntos y trazos, su visibilidad y permisos, sin modificar Circuitos ni convertir Rutas por inercia. | Asignación concreta a acordar antes de programar. |
| 3. Circuitos, etapa posterior | Diseñar y desarrollar Circuitos que combinan partes de Caminos existentes y partes dibujadas. Puede encargarse por separado a Claude con un encargo completo. | Asignación futura. |
| 4. Integración y entrega | Integrar navegación, sincronización y Salidas cuando corresponda; verificar en modo avión, en sol/noche y con el KML real antes de publicar. | Codex coordina; Ale prueba el uso real. |

### Próxima secuencia concreta, 2026-10-06

1. **Cerrar el guardado:** Codex termina de revisar el SQL y las acciones ya
   preparadas, agrega la verificación de permisos y de geometría, y repite las
   pruebas automáticas cuando el entorno lo permita. No hay rama de prueba de
   Supabase en este proyecto. Antes de aplicar la tabla a la base real, mostrar
   el cambio exacto a Ale para su aprobación final. No tocar las filas viejas.
2. **Diseñar el editor de PC:** presentar un boceto del flujo para importar
   KML/GPX, elegir cada línea como Camino o trazo, incorporar puntos, corregir
   la línea y clasificar partes por actividad. Ale aprueba el boceto antes de
   escribir la pantalla. No se guarda el archivo original.
3. **Construir Mapas/Caminos:** conectar el editor con el guardado y mostrar
   Caminos, puntos y trazos en el mapa general. Aplicar permisos de
   Administrador, Premium y Normal y comprobar las cuatro condiciones y los
   tres colores sin confundirlos con datos globales de Circuitos.
4. **Preparar el cerro:** agregar los Caminos a la descarga, sincronización y
   navegación libre; probar sin señal y avisar en casa cualquier faltante. Una
   importación grande no debe recortar en silencio una línea para eludir el
   límite de tamaño de un pedido: se enviarán los elementos individualmente y
   se resolverá cualquier línea que exceda el límite antes de guardar.
5. **Circuitos queda para después:** no cambiar `rutas` ni `salidas` por
   anticipado.

La auditoría inicial de Codex sobre la mitad **Circuitos** está en
`docs/planes/auditoria-circuitos-codex.md`. La auditoría de Claude sobre
**Mapas/caminos** ya fue entregada por Claude en
`docs/planes/auditoria-caminos-claude.md`. Ambas auditorías anteceden la
decisión posterior de que Circuitos pueda reutilizar partes de Caminos y
combinarlas con partes propias: sus propuestas técnicas de referencias y
uniones no son requisitos aprobados.

### Límite concreto del trabajo paralelo

La propiedad del mapa compartido, del paquete offline y del esquema común no
se reparte a ciegas: son puntos de integración de la etapa 4. Ningún agente
modifica el mismo archivo en simultáneo. Antes de programar en paralelo habrá
una copia de trabajo aislada para cada agente y un contrato escrito. El estado
local sin confirmar de este prototipo debe preservarse antes de crear esas
copias. No se mezcla, descarta ni publica por accidente.

## Criterios de aceptación del cambio completo

- Importar el KML de ejemplo ofrece siete alternativas individuales; no
  aparece una única ruta ficticia de 73 km.
- Una parte por explorar, transitable, a pie o sin paso se reconoce de un
  vistazo y al tocarla muestra su detalle. La X no impone el color rojo.
- La complejidad de la parte no modifica ni se deduce de los datos globales
  del circuito.
- Un circuito permite incorporar partes de Caminos sin redibujarlas y sumar
  partes propias; no crea ni altera Caminos o anotaciones.
- Los puntos de referencia y los trazos de anotación siguen siendo conceptos
  distintos de los caminos.
- Una parte de Camino cerrada sigue visible. La posible relación informativa
  entre Caminos y Circuitos se decidirá cuando se desarrolle Circuitos.
- Antes de salir se ve cualquier mapa o dato faltante que la app pueda saber
  con señal. Durante la navegación, GPS y líneas funcionan sin solicitudes a
  internet, y las fallas son visibles.
- Compilación, tipos, lint, pruebas críticas y revisión sol/noche aprobados;
  navegación probada en modo avión antes de decir que está lista.

## Auditoría de fuentes

- **Leído en tiempo real:** conversación con Ale; `AGENTS.md` aportado en la
  sesión; `docs/SCHEMA.md`, `docs/ARQUITECTURA.md`, `docs/GLOSARIO.md`,
  `docs/USUARIOS.md`, `docs/decisiones/033-partes-de-una-ruta.md`,
  `docs/MANTENIMIENTO.md`; rutas de pantallas en `app/(app)`; importación de
  rutas y anotaciones; sincronización offline; estado de Git.
- **Decidido por Ale:** Circuitos se dibuja de forma independiente y su
  desarrollo se difiere; las referencias a partes de Caminos propuestas en las
  auditorías quedan descartadas como requisito.
- **Pendiente de verificación:** esquema y permisos nuevos; editor de Circuitos
  cuando llegue su etapa; prueba real sin conexión; estado real de la base si
  más adelante se plantea una conversión. Ninguno se presenta como implementado.
