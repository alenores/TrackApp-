# Protocolo de mantenimiento de la documentación

> Creado: 2026-09-17

## Cuándo actualizar cada documento

| Evento | Documento a actualizar |
|---|---|
| Se decide algo de diseño, UX o UI | `DISENO_EXTERIOR.md` + nueva decisión en `decisiones/` |
| Se decide algo de arquitectura | Nueva decisión en `decisiones/` + `ARQUITECTURA.md` |
| Cambia una regla que los agentes deben obedecer | `AGENTS.md` (raíz) |
| Una regla deja de ser cierta | **Se borra de `AGENTS.md`.** Si tiene valor histórico, pasa a `decisiones/` |
| Nueva tabla o columna en Supabase | `SCHEMA.md` |
| Columna eliminada | `SCHEMA.md` — marcar deprecada, no borrar |
| Cambia la lógica offline o de sincronización | `ARQUITECTURA.md` + decisión en `decisiones/` |
| Se detecta un riesgo o deuda técnica | `RIESGOS.md` |
| Se resuelve un riesgo | Marcar resuelto en `RIESGOS.md`, no borrarlo |
| Nuevo término propio del proyecto | `GLOSARIO.md` |
| Cierre de sesión con cambios | `SESIONES.md` |

## Jerarquía de fuentes de verdad

En caso de contradicción, este es el orden:

1. **La base de datos** — verdad sobre estructura de datos
2. **El código** — verdad sobre implementación
3. **`decisiones/`** — verdad sobre por qué se decidió algo
4. **`SESIONES.md`** — registro histórico
5. El resto de los documentos — deben reflejar 1 y 2

**Regla invariable:** si un documento contradice al código o a la base, prevalece
el código o la base. El documento está viejo.

## Cuando un documento contradice la realidad

Señalarlo antes de seguir, con esta forma exacta:

> ⚠️ [documento] dice X pero el código/la base dice Y. Manda el código/la base.
> Se actualiza el documento.

## Regla de oro sobre `AGENTS.md`

`AGENTS.md` se lee en **todas** las sesiones. Por eso:

- **Tiene que ser 100% cierto hoy.** Una regla vieja es peor que ninguna regla:
  se obedece con confianza y nadie se entera de que está mal.
- **Corto gana a completo.** Cada línea que no aporta le resta atención a las que
  sí importan.
- **Lo histórico no va acá.** Va en `decisiones/`.

## Protocolo de cierre de sesión

1. Identificar qué cambió: código, base, decisiones tomadas.
2. Actualizar los documentos según la tabla de arriba.
3. Agregar la entrada en `SESIONES.md` con este formato:

```markdown
## Sesión AAAA-MM-DD — Título

### Estado al inicio
### Lo que se hizo
### Decisiones tomadas
### Documentos actualizados
### Deuda o inconsistencias detectadas
### Pendientes para la próxima
```

4. Presentarle a Ale el resumen en criollo, sin nombres de archivos.

## Auditoría de fuentes en documentos nuevos

Todo documento que dependa de información del repositorio o de la base termina
con una sección `## Auditoría de fuentes` con tres listas: leído en tiempo real,
inferido, y pendiente de verificación.

Si hay algo pendiente de verificación, decirlo explícitamente.
