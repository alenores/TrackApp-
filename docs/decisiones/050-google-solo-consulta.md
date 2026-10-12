# 050 — Google satelital solo para consulta

**Decidido por Ale:** 2026-10-09. Boceto visual aprobado antes de cambiar la interfaz.

## Decisión

Las dos navegaciones siguen usando solamente mapas descargados. Las pantallas
para dibujar o corregir zonas, sectores, Caminos, Circuitos y anotaciones usan
el mapa propio en vivo. Las vistas de consulta con conexión muestran la imagen
satelital de Google debajo de los datos que TrackApp ya conoce. No se crean ni
modifican coordenadas sobre esa imagen. Una falla de Google devuelve el fondo
satelital propio con aviso; no esconde Caminos, Circuitos ni anotaciones.

La clave de Map Tiles API vive en el servidor. Cada consulta abre una sesión
temporal; imágenes y créditos del área visible pasan por un puente que exige
una cuenta iniciada. El motor offline tiene una regla `NetworkOnly` anterior a
la que guarda imágenes, y el servidor responde `no-store`. Google no alimenta
ninguna descarga ni navegación.

La interfaz ofrece un solo fondo en la consulta: Google cuando está disponible,
el satelital propio cuando no. En el mapa de Google aparecen su logotipo
oficial sin modificar, el crédito que devuelve Google para el área visible y
una etiqueta que distingue la imagen de Google de los datos de TrackApp.

El 2026-10-12 Ale eligió detener el acercamiento en el último nivel con imagen
real disponible para el lugar, sin agrandar una imagen borrosa. La consulta de
créditos de Google también informa los límites de detalle por área. El mapa usa
ese dato para frenar el acercamiento. Si ya llegó demasiado lejos y Google deja
de informar créditos, retrocede hasta un nivel con imagen y créditos válidos;
eso no obliga a cambiar al satelital propio. Una falla real de Google conserva
el aviso y el fondo alternativo.

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
