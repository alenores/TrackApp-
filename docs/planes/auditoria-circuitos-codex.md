# Auditoría de Circuitos y dependencias con la app actual

> **Actualización de producto del 2026-10-05:** Alejandro decidió que un
> Circuito puede tomar partes de Caminos existentes sin redibujarlas y
> combinarlas con partes dibujadas solo para el plan. No es obligatorio usar
> Caminos para armarlo. Ver decisión 034. El diagnóstico del código existente
> se conserva como registro histórico; sus propuestas técnicas no son reglas
> aprobadas.

**Estado:** análisis para revisión de Alejandro. No existe un módulo Circuitos
implementado ni un contrato de datos aprobado. Esta auditoría no autoriza
modificar código, base o publicación.

## Objetivo expresado por Ale

Un **Circuito** es una salida *planificada*. Se construye escogiendo y
dibujando sobre los caminos que ya están en el mapa. El acto de planificarlo
**no agrega** caminos, puntos ni trazos al mapa. Varias alternativas pueden
seguir visibles durante la navegación para improvisar si una no sirve. La
**Salida** que realmente se hizo se registra aparte y ya tiene su propio
módulo.

## Lo que hoy está mezclado en «Rutas»

| Función actual comprobada | Destino conceptual propuesto | Condición para moverla |
|---|---|---|
| Subir GPX/KML y guardar la línea en `rutas.geometria` | Mapas / futura capa de caminos | Decidir nombre, unidad de importación y permisos. |
| Clasificar partes de la línea (solo prototipo local) | Mapas / futura capa de caminos | Acordar modelo con Claude; no conservar por inercia el JSON de `rutas`. |
| Nombre, descripción, actividad, dificultad técnica, esfuerzo, equipo y complicaciones de una propuesta completa | Circuitos, según los campos que Ale confirme | No copiar formularios enteros: separar datos de camino y de plan. |
| Largo, desnivel y cobertura calculados desde una única línea importada | Circuitos, calculados sobre el plan compuesto | Primero definir selección, orden, orientación y huecos entre caminos. |
| Lista, filtros y ficha de rutas | Circuitos para los planes; una vista distinta en Mapas para caminos | Rediseñar qué muestra cada ficha; las pantallas actuales mezclan ambos conceptos. |
| Navegación de una ruta con GPS y otras rutas opcionales | Navegación de Circuito más caminos alternativos del mapa | Debe seguir 100 % offline y mostrar diferencias entre plan y alternativas. |
| Navegación libre con rutas seleccionables | Navegación libre con caminos seleccionables | Definir qué aparece por defecto y cómo se evita saturar el mapa. |
| Registro de Salida iniciado desde una ruta | Registro iniciado desde un Circuito o libre, si Ale lo confirma | `salidas.ruta_id` y el registro local actual necesitan una decisión explícita. |

Estas correspondencias son **propuestas de reparto**, no un cambio automático
de nombres. El módulo Salidas **ya existe** y no se renombra a Circuitos.

## Dependencias técnicas comprobadas

- El inicio de la app (`app/(app)/page.tsx`) muestra hoy la lista de Rutas; una
  navegación principal enlaza a Rutas. La ubicación de Circuitos en el inicio
  y el menú requiere diseño.
- `types/database.ts` define `RutaResumen`, `RutaSinRecorrido` y `Ruta` con
  geometría propia y valores globales en la misma entidad. `Paquete` guarda
  los resúmenes, mientras `lib/offline/recorridos.ts` guarda las geometrías
  pesadas por identificador.
- `lib/offline/sincronizacion.ts` consulta la tabla `rutas`, comprueba que las
  tandas estén completas y guarda cada geometría. La puesta al día compara
  fechas de las tablas. Incluir caminos y circuitos exige conservar esa
  verificación de integridad; no alcanza con agregar un campo al paquete.
- `lib/offline/calentar.ts` deja listas `/`, `/rutas`, cada ficha
  `/rutas/<id>` y cada `/navegacion/<id>` para uso sin señal. Un módulo nuevo
  necesita documento y pedido interno precargados; las pantallas de edición
  siguen siendo solo con conexión.
- `components/rutas/ruta-detalle.tsx` calcula cobertura, ofrece mapas
  faltantes, permite navegar o registrar una salida y muestra otras rutas que
  cruzan el área. Esas funciones deberán separarse entre ficha de Circuito y
  visualización de Caminos.
- `components/navegacion/pantalla-de-navegacion.tsx` recibe un `rutaId`, lee
  de `usePaqueteGuardado` y `leerRecorrido`, y dibuja la línea principal junto
  a otras seleccionadas. El plan deberá distinguir visualmente la **secuencia
  elegida** de la **red disponible** sin hacer solicitudes a internet.
- `components/navegacion/pantalla-de-mapa-libre.tsx` y
  `hooks/use-rutas-en-area.ts` muestran otras rutas en el mapa libre. La nueva
  capa de caminos es una dependencia compartida con el trabajo de Claude.
- `salidas.ruta_id`, `hooks/use-registro-de-salida.ts` y
  `hooks/use-subir-registros.ts` vinculan un registro real con la ruta actual.
  Ninguna conversión automática a `circuito_id` debe hacerse antes de definir
  con Ale el significado de esa relación.
- `AGENTS.md` exige que la navegación sea 100 % offline, que se avise antes
  de salir lo que falta, que las fallas se vean, y que un cambio crítico
  tenga pruebas automáticas. Un módulo nuevo también requiere revisión visual
  en modo sol y noche.

## Contrato compartido que deberán acordar Codex y Claude

Antes de programar, ambos necesitan la misma respuesta a estas cuestiones:

1. **Identidad del camino y de la parte elegida.** Un Circuito debe poder
   referenciar una porción del mapa aunque después se reclasifique una parte.
   Usar el ID de una pieza que se vuelve a dividir puede romper circuitos;
   usar posiciones sobre una línea de origen y una versión puede resistir
   reclasificaciones, pero también requiere reglas si se corrige la geometría.
   Es una alternativa técnica para evaluar, no un esquema aprobado.
2. **Forma del plan.** Se necesita una secuencia ordenada de porciones y su
   sentido de circulación. Debe definirse si se permiten repeticiones,
   regresos por el mismo camino, ramas y finales diferentes del inicio.
3. **Huecos.** Si dos porciones no se tocan, el editor no puede inventar un
   camino para unirlas. Hay que decidir si se bloquea el guardado, se permite
   un Circuito discontinuo con aviso, o se exige cargar primero el camino que
   falta en Mapas.
4. **Cambios posteriores.** Si un camino usado por un Circuito queda sin paso,
   se corrige o se borra, el usuario debe saberlo *en casa* antes de salir.
   Acordar si el plan conserva una instantánea o solo referencias, y cómo se
   avisa la diferencia.
5. **Datos y permisos.** Ale debe decidir qué campos globales son propios de
   Circuito, quién los puede crear/editar y qué pueden ver los demás. No se
   heredan permisos ni columnas de `rutas` por conveniencia.

## Flujo de editor para mostrar a Ale, todavía no aprobado

1. En la computadora, abrir «Circuitos» y elegir crear uno. El mapa muestra
   los caminos existentes y sus condiciones de paso; los puntos y trazos de
   referencia siguen siendo información del mapa.
2. Elegir la actividad y seleccionar, en orden, las porciones de caminos que
   componen el plan. La selección muestra claramente el sentido elegido y
   permite deshacer la última porción sin borrar el camino original.
3. Antes de guardar, ver la línea completa del plan, sus valores globales y
   cualquier unión faltante o parte marcada sin paso. La app no dibuja una
   unión ficticia sobre un hueco.
4. Guardar el Circuito sin escribir en la capa de caminos. Su ficha explica
   qué se planea hacer y permite abrir el mapa con todas las alternativas
   relevantes a la vista.

Este flujo es solo un borrador funcional. El detalle de los gestos, el orden
de campos, el tratamiento de huecos y la presentación visual se revisarán con
Ale antes de tocar pantallas, tal como exige `AGENTS.md` para un módulo nuevo.

## Secuencia de mi trabajo después de la aprobación del contrato

1. Presentar a Ale la experiencia de seleccionar porciones, ordenarlas y
   revisar un Circuito antes de guardarlo, con un boceto de la pantalla nueva.
2. Definir con Claude una interfaz estable de lectura de caminos y selección
   de porciones, sin que ambos modifiquemos el mapa compartido a la vez.
3. Implementar el cálculo puro del plan: unión de porciones, orden, sentido,
   largo, desnivel y detección de huecos. Probar con bifurcación, vuelta por
   un mismo camino, porción reclasificada y parte sin paso.
4. Crear persistencia y permisos de Circuitos según el esquema aprobado;
   después lista, ficha y editor. La edición ocurre en PC y con conexión.
5. Integrar navegación, alternativas de Caminos, avisos previos y registro de
   Salidas solo cuando el contrato de ambos módulos esté estable.
6. Revisar visualmente sol/noche y navegar en modo avión con datos descargados;
   verificar que ninguna pantalla quede muda y que no se anuncie como lista
   una descarga incompleta. Actualizar decisiones, glosario y documentación.

## Preguntas de producto para Ale, todavía sin respuesta

Se harán en microinteracciones, una vez que Claude entregue la auditoría de
Mapas, para no preguntarle dos veces lo mismo ni avanzarlo por suposición:

- ¿Un Circuito puede usar dos veces el mismo camino y puede empezar y terminar
  en lugares distintos?
- ¿Qué querés que pase si las partes elegidas no se conectan? La app no debe
  dibujar un camino nuevo para disimular el hueco.
- Si una parte elegida queda marcada «sin paso» después, ¿querés que el
  Circuito siga visible con un aviso para revisarlo o que deje de poder
  navegarse hasta corregirlo?
- ¿Quién puede crear y editar Circuitos? ¿Y todos pueden consultarlos?

## Auditoría de fuentes

- **Leído en tiempo real:** conversación con Ale; `AGENTS.md` aportado en la
  sesión; `types/database.ts`, `app/(app)/page.tsx`, rutas de páginas en
  `app/(app)`, `components/rutas/pantalla-de-rutas.tsx`,
  `components/rutas/ruta-detalle.tsx`,
  `components/navegacion/pantalla-de-navegacion.tsx`,
  `lib/offline/sincronizacion.ts`, `lib/offline/paquete.ts`,
  `lib/offline/calentar.ts`, búsquedas de `ruta_id` y referencias de Salidas;
  `docs/SCHEMA.md`, `docs/ARQUITECTURA.md` y el plan de separación.
- **Inferido:** usar secuencia de porciones con sentido de circulación;
  considerar posiciones y versiones para conservar referencias; avisar si el
  mapa cambia después de planificar. Son propuestas técnicas, no acuerdos.
- **Pendiente de verificación:** respuestas de Ale a las preguntas anteriores;
  esquema real de las futuras tablas; diseño visual; auditoría de Claude;
  navegación completa en modo avión y conexión entre circuito y salida real.
