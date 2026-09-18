# Usuarios

> Definido: 2026-09-18 · Decisión: `decisiones/004-tres-niveles-de-usuario.md`

## Las tres categorías

| Categoría | Quién es |
|---|---|
| **Administrador** | Ale. Único dueño del producto. Hay uno solo. |
| **Premium** | Los amigos de Ale. |
| **Normal** | El resto: amigos de amigos y cualquiera que llegue. |

Esto es lo único que está decidido, y alcanza para que la base de datos y el
sistema de permisos nazcan preparados.

## Lo primero que sí se definió (2026-09-18)

**Sobre los tracks:** cualquier usuario ve y consulta todos los tracks, de
cualquier otro usuario. Solo el creador puede editar o eliminar el suyo.

Ver `decisiones/008-tres-modos-de-uso-y-permisos.md`.

## Lo que NO está definido

**Qué puede hacer cada categoría.** Y no se inventa.

Los permisos no son una decisión que se pueda tomar en el aire: son una
consecuencia de las funciones que tenga la app, y la app todavía se está
definiendo funcionalmente. Decidir hoy si un usuario normal puede o no hacer
algo que todavía no existe es construir sobre nada.

**Regla:** cada vez que se defina una función nueva, en esa misma definición se
establece qué categoría la puede usar. No antes.

## Por qué tres y no dos

Porque la app está pensada para poder crecer. Tener las categorías catalogadas
desde el arranque evita la migración dolorosa del día en que aparezca el primer
usuario que no es amigo de Ale.

Es el mismo patrón que ya funciona en Vías de Escalada Córdoba.
