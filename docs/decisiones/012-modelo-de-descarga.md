# 012 — Modelo de descarga

**Fecha:** 2026-09-18 · **Estado:** vigente
**Cierra la decisión 003**, que estaba abierta.

---

## Lo que el usuario elige y lo que viene solo

| | Cómo llega |
|---|---|
| Todas las rutas: línea, nombre, dificultad, desnivel, comentarios | **Siempre, completo, automático.** El usuario no elige |
| Anotaciones de un sector descargado | **Automático**, se suman al paquete |
| El mapa de un sector | **Lo elige el usuario**, uno por uno |

**Lo único que el usuario decide descargar es la parte pesada: el mapa.** Todo
lo demás es texto y coordenadas, pesa nada, y viene solo.

---

## Desde dónde se dispara una descarga

Hay dos caminos, y los dos existen:

1. **Desde una ruta.** La pantalla muestra qué sectores necesita y se bajan
   desde ahí mismo, sin ir a buscarlos a otro lado.
2. **Desde zona y sector.** Se elige y se baja cualquier sector a gusto, **aunque
   no haya ninguna ruta que pase por ahí.**

---

## Simple o satelital: son excluyentes

**Un sector tiene un solo mapa a la vez.** O el simple, o el satelital. Nunca los
dos.

- Se puede **reemplazar** uno por el otro cuando el usuario quiera.
- Se puede **eliminar** el mapa de un sector cuando el usuario quiera.
- **El espacio que ocupa cada uno se puede ver**, pero sin darle protagonismo: es
  un dato de consulta, no el centro de la pantalla. Nada de barras grandes,
  alarmas de espacio ni advertencias.

---

## Actualización: automática y muda

**Si hay novedades en algo que el usuario ya tiene descargado, se actualiza solo.
No se le pregunta nada.** Sin cartel de «hay novedades», sin botón de actualizar,
sin confirmación.

Eso incluye las **anotaciones y puntos nuevos**: si el administrador agrega un
punto o un trazo sobre un sector que el usuario ya bajó, le llega solo y se suma
a su paquete.

### Los dos límites de la actualización automática

1. **Solo ocurre con señal, y nunca durante la navegación.** No contradice la
   regla de que navegar es 100% sin conexión: la actualización vive en el momento
   de la casa, no en el cerro. **Ningún agente puede implementar una
   actualización que dispare durante una navegación.**
2. **Si falla a mitad de camino, queda lo que había.** Una actualización
   incompleta nunca puede romper ni dejar a medias un paquete que ya servía.

---

## Fuera de alcance a propósito

**Qué pasa cuando cambia el mapa base en sí** (no las anotaciones, sino la
cartografía). Decidido por Ale: **no se maneja, porque no va a pasar.**

No es un olvido. **Los agentes no deben proponer funcionalidad para esto.**
