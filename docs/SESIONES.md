# Registro de sesiones

Formato definido en `MANTENIMIENTO.md`. Más reciente arriba.

---

## Sesión 2026-09-17 — Análisis de mapas y arranque de la documentación

### Estado al inicio

App funcionando, sin documentación. Como reglas para agentes solo existían seis
líneas sobre Git y un archivo que ordenaba subir cambios sin pedir permiso. Cero
reglas de producto, diseño, UX u offline.

### Lo que se hizo

- Análisis completo de cómo funcionan los mapas y el sistema offline.
- Se confirmó que **nunca existió** mapa satelital ni de relieve, verificando
  todo el historial del proyecto.
- Se identificaron cuatro problemas y una limitación, registrados en `RIESGOS.md`.
- Se midió la app: 131 archivos, unas 9.100 líneas, 16 pantallas.
- Se revisó Vías de Escalada Córdoba como referencia de documentación y de
  modelo offline.
- Se borraron las reglas viejas y se escribió `AGENTS.md` desde cero.
- Se creó toda la estructura de documentación.

### Decisiones tomadas

- **Se refactoriza esta app, no se empieza un proyecto nuevo.** El stack ya es el
  correcto y lo que molesta es una porción acotada.
- **El código existente no es referencia de nada.** Fue un ejercicio de
  aprendizaje.
- Diseño para exterior → `decisiones/001`
- PWA ahora, empaquetado Android opcional al final → `decisiones/002`
- Modelo offline → `decisiones/003`, **abierta**

### Documentos creados

`AGENTS.md`, `CLAUDE.md`, y en `docs/`: `MANTENIMIENTO.md`,
`DISENO_EXTERIOR.md`, `ARQUITECTURA.md`, `RIESGOS.md`, `GLOSARIO.md`,
`SCHEMA.md`, `SESIONES.md`, más tres decisiones.

### Deuda e inconsistencias detectadas

- Sin acceso a la base de TrackApp. `SCHEMA.md` quedó sin verificar.
- Los valores de contraste y tamaño no fueron probados al sol.
- Las cuatro pantallas de módulos que no se analizaron siguen sin documentar.

### Pendientes para la próxima

1. Que Ale revise `AGENTS.md`, en especial la sección de Git.
2. Probar los valores de diseño al sol, con el celular en la mano.
3. Cerrar la decisión 003 sobre el modelo offline.
4. Conseguir acceso a la base para completar `SCHEMA.md`.
