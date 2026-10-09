# Boceto: Google solo para consulta

**Fecha:** 2026-10-09 · **Estado:** aprobado por Alejandro; implementación integrada, activación pendiente de clave Google

## Alcance propuesto

- Las dos navegaciones siguen leyendo únicamente los mapas descargados.
- Los mapas de consulta con conexión muestran la imagen de Google y superponen los datos que TrackApp ya tiene: zonas, sectores, Caminos, Circuitos, anotaciones y trazos, según la pantalla.
- Los mapas que crean o modifican coordenadas conservan el fondo propio en vivo, con conexión. No se ofrece Google como fondo del editor.
- Una caída de la imagen de Google debe mostrarse con motivo y acción posible. La línea y las fichas propias no dependen de ese fondo.
- La imagen de Google no se descarga para navegar ni se guarda en el depósito offline. El motor offline debe excluir expresamente sus pedidos de la regla general que guarda imágenes.
- La atribución de Google y de quien aportó cada imagen debe permanecer visible.

## Estado verificado

- El último despliegue de producción está listo y corresponde al mismo cambio que el proyecto local.
- La vista publicada pide iniciar sesión. No se revisaron las pantallas privadas en producción; sí se revisó el código exacto de esa versión.
- En la configuración publicada solo aparecen variables del servicio de datos. Todavía no hay una clave de Google configurada.
- El mapa compartido actual usa MapLibre. Varios mapas de administración y consulta piden fondos en vivo; las dos navegaciones usan los guardados.
- El motor offline guarda las imágenes por una regla general. La nueva regla de Google se publicó antes de esa regla general y usa solo la red.
- La API de imágenes de Google requiere una sesión y una clave. El puente ya pide una cuenta iniciada, no guarda imágenes y trae la atribución variable según el área visible. Falta configurar la clave real y probarlo con Google.

## Pendientes para activar y verificar en producción

1. Definir y configurar la cuenta facturable de Google Maps Platform y la clave restringida para esta app.
2. Probar con la API oficial de imágenes 2D de Google el puente, la atribución completa y el uso con el mapa compartido, sin guardado offline.
3. Revisar las condiciones de Google sobre el uso del mapa de consulta en una aplicación que también contiene mapas de otro proveedor. El boceto no resuelve esa interpretación contractual.

## Auditoría de fuentes

### Leído en tiempo real

- Estado local de Git y componentes de mapas de la versión publicada.
- Identificador del último despliegue de producción y nombres de variables configuradas en Vercel.
- Condiciones de Google Maps Platform y política de atribución de Map Tiles API.

### Inferido

- Un mapa de consulta puede superponer datos propios de TrackApp sin usar la imagen de Google como origen de esos datos.
- Separar consulta y edición reduce el riesgo de crear datos copiando la imagen, pero no evita que una persona la use mentalmente como referencia.

### Pendiente de verificación

- Cuenta de Google para hacer una prueba real; el boceto ya fue aprobado.
- Funcionamiento visual de las pantallas privadas en producción con una sesión iniciada.
- Interpretación contractual de Google sobre los dos proveedores de mapas en la misma aplicación.
