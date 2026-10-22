# 072 — Abrir en Google Maps la zona que se mira en Marcas

**Fecha:** 2026-10-22 · **Decidió:** Ale

## La decisión

En Mapas / Marcas hay un ícono de Google Maps fuera del mapa, en el área
de datos. Al tocarlo abre Google Maps en otra pestaña, centrado en el
punto que estaba en el centro del mapa de TrackApp.

No se muestran latitud ni longitud y no se agrega información sobre el
mapa. El acceso queda junto al título de Marcas en computadora y celular;
en el celular se puede tocar con el panel de la lista bajado.

El enlace toma el centro real del mapa al terminar cada movimiento y pasa
también el acercamiento, redondeado al nivel entero que admite Google.
Hasta que el mapa informa su vista, el acceso espera deshabilitado.

El cambio queda local: Ale pidió no subir a producción porque hay varios
cambios por hacer.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale y aprobación para implementarlo en esta conversación.
- El mapa compartido informa centro y acercamiento al terminar de moverse.
- La distribución compartida tiene cabeceras fuera del mapa en PC y celular.
- [Documentación de enlaces de Google Maps](https://developers.google.com/maps/documentation/urls/get-started): vista de mapa con `center` y `zoom`.

### Inferido

- El acercamiento se aproxima al nivel entero de Google; el tamaño de las
  ventanas puede hacer que el territorio visible sea distinto.

### Pendiente de verificación

- Revisión visual de Ale y apertura desde su celular. Según la configuración
  del teléfono, el enlace HTTPS puede abrir la aplicación de Google Maps.
