# Usuarios

> Definido: 2026-09-18 · Decisión: `decisiones/004-tres-niveles-de-usuario.md`

## Las tres categorías

| Categoría | Quién es |
|---|---|
| **Administrador** | Ale. Único dueño del producto. Hay uno solo. |
| **Premium** | Los amigos de Ale. |
| **Normal** | El resto: amigos de amigos y cualquiera que llegue. |

Los permisos se definen para cada función. Los del contenido del mapa ya están
decididos y figuran más abajo.

## Primera definición de Rutas (2026-09-18)

**Sobre las rutas de la app anterior:** cualquier usuario ve y consulta todas
las rutas, de cualquier otro usuario. La regla de edición de este módulo se
revisará cuando se construyan Circuitos; no define permisos de Caminos.

Ver `decisiones/008-tres-modos-de-uso-y-permisos.md`.

**Sobre zonas y sectores:** **solo el administrador** los crea. Ni siquiera el
usuario Premium puede. Son unidades de descarga de mapas, no de clasificación
del contenido del mapa.

Ver `decisiones/009-cobertura-de-mapas-de-un-ruta.md`.

**Sobre las anotaciones:** la regla de 2026-09-24 que dejaba anotar a todos fue
reemplazada el 2026-10-05. Administrador y Premium pueden sumar puntos y trazos
y cambiar los propios; Administrador puede cambiar todos. Normal solo consulta.
Las anotaciones marcadas navegando por Administrador o Premium quedan en el
celular y suben con señal y la navegación cerrada. Una anotación pendiente de
una cuenta Normal queda visible en el celular con un aviso de que no se subirá.

**Sobre puntos sin sector:** Administrador y Premium pueden sumarlos desde
**Mapas → Anotaciones**; Premium cambia los propios y Administrador todos.
La antigua dirección **Zonas → Puntos** lleva a esa pestaña.
Ver `decisiones/027-puntos-sin-sector.md`.

## Permisos decididos para el contenido del mapa

**Decisión de Ale, 2026-10-05:**
Administrador y Premium pueden sumar Caminos, puntos, trazos y anotaciones al
mapa, y editar los propios. El Administrador puede editar los de todos. Normal
solo puede consultar ese contenido: **no puede crear ni editar anotaciones
durante la navegación**. Puede cargar fotos en su propia Salida y registrar
una Salida durante el paseo para subirla al recuperar la señal.

**Circuitos (decisión de Ale, 2026-10-05):** Administrador y Premium pueden
crearlos y editar los propios; el Administrador puede editar todos. Normal
solo puede consultarlos. Estos permisos se aplican en la interfaz, las acciones
y la base; faltan pruebas con las tres categorías reales.

## Funciones futuras

Los permisos de una función nueva se deciden cuando se define esa función.
No se deducen de permisos de otros módulos.

**Regla:** cada vez que se defina una función nueva, en esa misma definición se
establece qué categoría la puede usar. No antes.

## Por qué tres y no dos

Porque la app está pensada para poder crecer. Tener las categorías catalogadas
desde el arranque evita la migración dolorosa del día en que aparezca el primer
usuario que no es amigo de Ale.

Es el mismo patrón que ya funciona en Vías de Escalada Córdoba.
