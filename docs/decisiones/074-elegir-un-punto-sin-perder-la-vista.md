# 074 — Elegir un punto sin perder el lugar que se mira

**Fecha:** 2026-10-22 · **Decidió:** Ale

## La decisión

En Marcas, «+», «A mano», «Punto» deja el mapa de Google abierto en el mismo
lugar. Se elige la ubicación tocando el mapa o pegando la coordenada (link de
Maps o los dos números, como salen de Google Earth) y confirmando. Después se
abre el formulario sobre el mapa propio, con esa coordenada ya cargada y el
mapa centrado en el punto. El zoom se conserva, sin pasar del tope del
satelital propio (Google puede acercar más). Elegir el lugar no guarda nada: se
guarda con «Guardar». La elección se puede cancelar; Escape y el botón físico
de atrás también permiten salir de ella.

Es una excepción explícita a la decisión 050: solo se elige la ubicación
inicial de un punto. Caminos y trazos se dibujan sobre el mapa propio.

Punto, Trazo y Camino nuevo reciben la vista de Marcas al abrirse. Al volver,
se conserva el lugar. Abren en satelital y dejan visibles las marcas que ya
existen (Caminos, puntos y trazos), de referencia. **Editar un Camino**
también conserva el centro y el zoom, y abre en satelital (lo más parecido a
Google; el editor no usa Google). Agregar, traer y editar marcas en PC
mantienen los datos a la izquierda y el mapa a la derecha. En el celular se
conserva el orden de mapa y formulario.

Ale aprobó el boceto y pidió implementar directamente sin hacer más bocetos.
El cambio queda local, sin publicación.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale, elección de tocar la ubicación exacta sobre Google y aprobación
  completa del boceto antes de implementar.
- Las pantallas anteriores no recibían la vista de Marcas y abrían sin coordenada.
- El mapa compartido permite obtener el centro y zoom exactos al tocar un punto.
- La elección no llama a guardar; el formulario reutiliza la lógica común.

### Inferido

- Ninguno.

### Pendiente de verificación

- Revisión visual con la cuenta de Ale en PC y celular; el navegador disponible
  venía mostrando falta de conexión en Mapas.
