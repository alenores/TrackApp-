# Registro de sesiones

Formato definido en `MANTENIMIENTO.md`. Más reciente arriba.

---

## Sesión 2026-09-18 — Cimientos: reglas base del proyecto

### Estado al inicio

Andamiaje de documentación creado el día anterior. Faltaban las reglas de
fondo que gobiernan todo el proyecto.

### Lo que se hizo

Se cerraron cinco reglas base que no dependen de decisiones funcionales:

- **Red de seguridad:** ninguna función crítica se entrega sin prueba
  automática. Es el único mecanismo que le avisa a Ale que algo se rompió sin
  que tenga que leer código.
- **La ubicación es dato sensible:** por defecto se usa y se descarta.
  Guardarla requiere decisión explícita y escrita.
- **Cómo habla la app:** voseo, directo, errores que dicen qué pasó y qué hacer.
- **Un concepto, una palabra:** todo en español, pantalla y código. Glosario
  como fuente.
- **Entender antes de tocar:** método obligatorio ante un error, con
  explicación a Ale en criollo antes de arreglar.

Se fijaron las tres categorías de usuario, **sin permisos**.

### Decisiones tomadas

- `004` — Tres niveles de usuario (permisos deliberadamente sin definir)
- `005` — Pruebas automáticas como red de seguridad
- `006` — Sin tratamiento de dato sensible. Ale lo descartó: la app funciona
  sobre confianza total. Se quitó la regla de ubicación de las reglas base.

### Reglas agregadas en la segunda pasada

Al revisar contra Vías de Escalada aparecieron cinco cosas que se habían
salteado y que sí son cimiento:

- **Navegar sin señal:** sin señal la navegación interna deja la pantalla en
  blanco si no se usa la pieza compartida de navegación. Lección aprendida a los
  golpes en el otro proyecto.
- **Red de rescate cuando una pantalla revienta**, que no se borra nunca.
- **Separación de capas:** lógica, datos y pantalla en lugares distintos. Un
  componente de pantalla no consulta la base por su cuenta.
- **Tope de 1000 filas de la base:** devuelve la lista cortada sin avisar. En el
  otro proyecto dejó 202 rutas invisibles durante meses.
- **Checklist obligatoria de once puntos para toda pantalla nueva**, que es el
  mecanismo que hace cumplir el resto de las reglas.
- **Botones con variantes definidas y un solo rojo para borrar.**

### Corrección de rumbo

Se intentó definir los permisos de cada categoría de usuario. **Fue un error:**
los permisos son consecuencia de funciones que todavía no existen. Se registró
la categorización sin permisos y se dejó el resto para cuando la app esté
definida funcionalmente.

De ahí sale una regla general: **no se toman decisiones funcionales antes de la
definición funcional**, ni se le piden a Ale disfrazadas de decisiones técnicas.

### Deuda e inconsistencias detectadas

- Sigue sin definirse «qué NO es la app». Se decidió que se deriva de lo que sí
  es, y por eso queda para después de la definición funcional.
- Falta elegir herramienta de pruebas.

### Pendientes para la próxima

**Ale describe funcionalmente cómo tiene que trabajar la aplicación.** Ese es el
siguiente paso acordado.

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
