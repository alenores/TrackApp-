# 050 — Google satelital solo para consulta

**Decidido por Ale:** 2026-10-09. Boceto visual aprobado antes de cambiar la interfaz.

## Decisión

Las dos navegaciones siguen usando solamente mapas descargados. Las pantallas
para dibujar o corregir zonas, sectores, Caminos, Circuitos y anotaciones usan
el mapa propio en vivo. Al **mirar** una zona (detalle), Marcas, el detalle de
Circuitos y Salidas muestran Google debajo de los datos que TrackApp ya conoce.
**Consultas** ofrece tres fondos: Google (con señal), Simple y Satelital. Simple
y Satelital leen solo lo bajado en el celular —sin internet y sin la caché
volátil de Google— para chequear en casa qué se verá en el cerro. No se crean
ni modifican coordenadas sobre Google, salvo la elección inicial de un punto en
Marcas aprobada en la decisión 074. Si Google falla, se informa el motivo y no
se muestra otro fondo.

El 2026-10-20 Ale sumó una excepción acotada: al traer un archivo de afuera, la
vista previa usa Google. Ahí solo se mira si cada línea o punto, con las
coordenadas que ya trae el archivo, se suma como Camino, como trazo o se omite.
No se mueve la línea ni se marcan puntos. La corrección posterior sigue en el
editor, con el mapa propio.

El 2026-10-22 Ale aprobó otra excepción acotada: en Marcas, después de elegir
agregar un punto, se toca su ubicación sobre Google. El formulario abre sobre
el mapa propio con esa coordenada ya cargada y conserva el centro y el zoom
exactos del momento del toque. Los Caminos y trazos se siguen dibujando sobre
el mapa propio. Ver decisión 074.

La clave de Map Tiles API vive en el servidor. Cada consulta abre una sesión
temporal; imágenes y créditos del área visible pasan por un puente que exige
una cuenta iniciada. El motor offline tiene una regla `NetworkOnly` anterior a
la que guarda imágenes, y el servidor responde `no-store`. Google no alimenta
ninguna descarga ni navegación.

Marcas, el detalle de zona, Circuitos y Salidas ofrecen Google al consultar.
Consultas suma Simple y Satelital solo con lo bajado. Los fallos de Google se
muestran de la misma manera mediante el mapa compartido. La consulta de
créditos corre en paralelo: una demora o falla de esa consulta no tapa ni
reemplaza el mapa. Los créditos se muestran cuando llegan. También aparecen el
logotipo oficial de Google y una etiqueta que distingue su fondo de los datos
de TrackApp.

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

> **Excepción (decisión 080, 2026-10-31):** lo mirado de Google en Consultas se
> guarda solo el tiempo que Google indica y las navegaciones lo dibujan encima
> del mapa bajado mientras vale. Riesgo asumido por Ale.
