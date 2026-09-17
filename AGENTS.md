# TrackApp — reglas para agentes de IA

> App de navegación de rutas al aire libre. Se usa caminando, con sol fuerte,
> con guantes, sin señal y con la batería como recurso escaso.
> Última revisión: 2026-09-17

---

## Antes de tocar nada

**El código que ya existe no es ejemplo de nada.** TrackApp se escribió como
ejercicio de aprendizaje y no cumple estas reglas. No lo copies como referencia
ni lo tomes como decisión tomada. Si una pantalla vieja hace algo que este
archivo prohíbe, está mal la pantalla, no la regla.

**Ale no lee código.** Todo lo que se explique tiene que entenderse sin saber
programar. Nada de nombres de archivos ni de líneas en las explicaciones.

**Ante ambigüedad, se pregunta.** Una pregunta corta ahorra medio día. No
avanzar sobre suposiciones.

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
- **Todo lo importante va en la mitad de abajo de la pantalla**, al alcance del
  pulgar. Nada crítico en las esquinas de arriba.
- **Pantalla mojada = toques fantasma.** Toda acción que borre o cancele algo
  pide confirmación.

### Mapa

- **El mapa de navegación va a pantalla completa**, sin nada alrededor.
- **Siempre tiene que haber una forma visible de salir**, y tiene que responder
  también al botón físico de atrás.
- **La pantalla no se apaga mientras se está navegando.**

---

## Offline

- **Las pantallas leen de lo guardado en el celular, nunca de internet.** Internet
  sirve para actualizar lo guardado, no para dibujar una pantalla.
- **Lo que se descarga tiene que poder borrarse.** Si el usuario quita algo de
  offline, el espacio se libera de verdad.
- **Nunca decir «listo» sobre una descarga incompleta.** Si faltó algo, se avisa.
- **Sin señal no se oculta contenido ya guardado.**

---

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

---

## Base de datos

Convenciones fijas de Ale (ver el skill `stack-tecnico-fijo`):

- Nombres en **snake_case español**, tablas en plural.
- **Borrado lógico siempre** (`eliminado_en`), nunca borrado físico.
- `creado_en` y `actualizado_en` en toda tabla.
- **RLS activo desde que se crea la tabla**, sin excepción.

**TrackApp hoy NO cumple ninguna de estas cuatro.** Está registrado en
`docs/RIESGOS.md`. Toda tabla nueva sí las cumple.

**Nunca asumir nombres de columnas.** Verificar contra la base antes de escribir
una consulta.

---

## Antes de decir que algo está listo

1. `npx tsc --noEmit` sin errores.
2. `npm run lint` sin errores.
3. Si el cambio es visual: mockup aprobado por Ale **antes** de tocar código.
4. Si el cambio toca offline: probado con el modo avión activado.

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
