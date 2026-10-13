# 050 — Google satelital solo para consulta

**Decidido por Ale:** 2026-10-09. Boceto visual aprobado antes de cambiar la interfaz.

## Decisión

Las dos navegaciones siguen usando solamente mapas descargados. Las pantallas
para dibujar o corregir zonas, sectores, Caminos, Circuitos y anotaciones usan
el mapa propio en vivo. También lo usan las vistas de zonas y sectores. El mapa
general de Mapas, el detalle de Circuitos y el mapa de Salidas muestran Google
debajo de los datos que TrackApp ya conoce. No se crean ni modifican coordenadas
sobre Google. Si Google falla, se informa el motivo y no se muestra otro fondo.

La clave de Map Tiles API vive en el servidor. Cada consulta abre una sesión
temporal; imágenes y créditos del área visible pasan por un puente que exige
una cuenta iniciada. El motor offline tiene una regla `NetworkOnly` anterior a
la que guarda imágenes, y el servidor responde `no-store`. Google no alimenta
ninguna descarga ni navegación.

Las tres vistas de consulta ofrecen solo Google. Sus fallos se muestran de la
misma manera mediante el mapa compartido. La consulta de créditos corre en
paralelo: una demora o falla de esa consulta no tapa ni reemplaza el mapa. Los
créditos se muestran cuando llegan. También aparecen el logotipo oficial de
Google y una etiqueta que distingue su fondo de los datos de TrackApp.

El 2026-10-12 Ale eligió detener el acercamiento en el último nivel con imagen
real disponible para el lugar. La consulta de créditos también informa límites
de detalle por área. Una respuesta tardía no debe alejar el mapa que la persona
ya está mirando. El 2026-10-13 Ale quitó la sustitución automática del fondo:
en las tres consultas se mantiene Google o se informa por qué no se ve.

## Activación

El 2026-10-11 se creó un proyecto Google Cloud exclusivo para TrackApp y se
activaron la prueba gratuita y Map Tiles API. Google creó una clave, que quedó
limitada a esa API y guardada como secreto de producción en Vercel. Se
reconstruyó y publicó la misma versión de la app con la nueva configuración.
La primera prueba real descubrió un nombre de parámetro equivocado en el pedido
de créditos. Se corrigió y quedó cubierto por una prueba automática. Después
se comprobó la imagen real con el logo y los créditos en Mapas y en el detalle
de un Circuito, en modo sol y noche; el editor conservó solo los mapas propios.
Google muestra una cuota diaria de 100.000 imágenes 2D y no permite ajustarla
desde la consola. La prueba gratuita no cobra automáticamente, pero el consumo
efectivo todavía no se midió.

La interpretación contractual del uso de Google en una app que también tiene
otro mapa sigue sin confirmación de Google. La separación de consulta y edición
evita usar su imagen para crear datos, pero no resuelve por sí sola esa duda.

## Fuentes

- [API oficial de imágenes satelitales](https://developers.google.com/maps/documentation/tile/satellite)
- [Sesiones temporales](https://developers.google.com/maps/documentation/tile/session_tokens)
- [Créditos por área visible y política de guardado](https://developers.google.com/maps/documentation/tile/policies)
- [Detalle máximo por área visible](https://developers.google.com/maps/documentation/tile/2d-tiles-overview)
- [Condiciones de Google Maps Platform](https://cloud.google.com/maps-platform/terms)

## Auditoría de fuentes

### Leído en tiempo real

- Versión publicada, configuración de despliegue y estructura del mapa compartido.
- Documentación oficial de Google enlazada arriba.

### Inferido

- Los datos superpuestos de TrackApp siguen siendo propios porque la imagen de Google no se usa para editarlos.

### Pendiente de verificación

- Consumo efectivo y navegación en modo avión en un celular.
- Prueba del límite de acercamiento en un celular físico; en producción se
  comprobó en navegador de escritorio y con ancho de celular.
- Interpretación contractual de Google sobre los dos proveedores en la misma app.
