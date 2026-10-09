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

## Activación pendiente

El despliegue revisado no tiene proyecto ni clave de Google configurados.
Ale indicó que necesita los pasos para crearlos. Hasta entonces la consulta
usa el satelital propio sin mostrar un error de configuración a los usuarios.
Una falla de Google luego de activarlo sí lleva un aviso. No se pudo hacer la
prueba visual con imágenes reales de Google ni confirmar costos efectivos.

La interpretación contractual del uso de Google en una app que también tiene
otro mapa sigue sin confirmación de Google. La separación de consulta y edición
evita usar su imagen para crear datos, pero no resuelve por sí sola esa duda.

## Fuentes

- [API oficial de imágenes satelitales](https://developers.google.com/maps/documentation/tile/satellite)
- [Sesiones temporales](https://developers.google.com/maps/documentation/tile/session_tokens)
- [Créditos por área visible y política de guardado](https://developers.google.com/maps/documentation/tile/policies)
- [Condiciones de Google Maps Platform](https://cloud.google.com/maps-platform/terms)

## Auditoría de fuentes

### Leído en tiempo real

- Versión publicada, configuración de despliegue y estructura del mapa compartido.
- Documentación oficial de Google enlazada arriba.

### Inferido

- Los datos superpuestos de TrackApp siguen siendo propios porque la imagen de Google no se usa para editarlos.

### Pendiente de verificación

- Prueba con clave, facturación e imágenes reales en producción.
- Interpretación contractual de Google sobre los dos proveedores en la misma app.
