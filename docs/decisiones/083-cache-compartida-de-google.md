# 083 — Caché compartida de imágenes de Google

**Fecha:** 2026-11-18 · **Estado:** implementada y verificada; publicación autorizada por Ale

## Contexto y decisión de Ale

Al investigar el consumo de TrackApp se reprodujeron dos recorridos en producción:
Marcas descargaba las mismas 12 imágenes al volver de crear un Camino sin guardar;
el mapa de una Salida descargaba las mismas 40 al cerrarlo y abrirlo otra vez.
Mientras un mapa seguía abierto, su memoria local sí reutilizaba las imágenes.
Cada instancia nueva volvía a pedirlas, aunque existiera una copia guardada.

Ale aprobó revisar todos los usos de Google y corregir el servicio común de imágenes
para reducir descargas y mejorar la rapidez. Abarca Consultas, Marcas, importación
de archivos, detalles de zonas, detalles de Circuitos y mapas de Salidas.

## Cómo funciona

- Cada consulta busca primero en la memoria compartida del documento y después
  en el depósito de Google del celular. Solo pide la imagen si falta o venció.
- La identidad incluye la variante de mapa. Hoy todas las sesiones usan satélite,
  español de Argentina, región Argentina y teselas de 256 píxeles.
- El vencimiento es absoluto. Se consideran Cache-Control, Age, Date y Expires;
  no se renueva el plazo por leer una copia. No-store y no-cache impiden reutilizarla.
  Las copias históricas sin metadatos verificables se conservan para navegación,
  pero no se adoptan como caché online.
- Pedidos simultáneos de la misma imagen comparten una descarga. Cada consumidor
  recibe sus propios bytes; cancelar uno no cancela a los demás. Al cancelar todos,
  se cancela la descarga pendiente.
- La memoria compartida tiene un máximo de 16 MiB y 256 imágenes y retira primero
  las menos utilizadas. Este límite no borra cobertura vigente del depósito
  que usan las navegaciones.
- El guardado es un extra: si el depósito falla o demora, la consulta con señal
  sigue funcionando. La red de navegación continúa exclusivamente local.
- Cerrar sesión bloquea inmediatamente nuevos pedidos y descarta memoria y pedidos
  anteriores. Las escrituras y el borrado persistente se ordenan para impedir que
  una respuesta tardía vuelva a llenar lo borrado. El ingreso existente recarga
  el documento y crea un contexto nuevo.
- El servidor conserva autenticación y HTTP privado/no-store; solo transmite los
  metadatos de vigencia mediante cabeceras privadas. No se introduce caché pública
  en Vercel ni se cambia el sistema de sesiones o créditos variables de Google.
- El protocolo de MapLibre recibe expires absoluto. No recibe un max-age renovado
  en cada acierto, porque eso prolongaría incorrectamente la vigencia.

## Navegación sin conexión

La decisión 080 sigue vigente. Navegar solo lee copias locales todavía válidas
y nunca descarga una imagen ausente. Simple/Satelital de comprobación en Consultas
siguen mostrando únicamente los mapas propios descargados.

## Verificación y límites de la conclusión

Las pruebas cubren reutilización entre sesiones de mapa, vigencia, concurrencia,
cancelación, buffers independientes, límites de memoria, limpieza al salir y
navegación sin red. En el navegador compilado, Marcas pasó de 12 descargas repetidas a cero; Salidas, de 40 a cero. La recarga completa del documento también reutilizó las 40 imágenes guardadas. La medición detallada se registra en SESIONES.md. Ale confirmó la prueba manual: tras cortar internet y recargar Navegación libre, los caminos siguieron visibles. Esta prueba no mide cobertura fotográfica de Google ni mapas propios no descargados.

El arreglo elimina repetición comprobable. No permite atribuir retrospectivamente
una fracción exacta del pico del 2 de noviembre a cada gesto del usuario. La
reducción de facturación mensual se verificará con uso real después de publicar.

## Auditoría de fuentes

**Leído en tiempo real:** lib/mapas/google-guardado.ts, google-vigencia.ts,
protocolo.ts y sus pruebas; app/api/mapa-google/tesela/[z]/[x]/[y]/route.ts;
lib/offline/salir.ts; componentes de Marcas, Consultas, Circuitos, Salidas y zonas;
MapLibre 6.10.0 instalado; política oficial
https://developers.google.com/maps/documentation/tile/policies.

**Inferido:** la reducción acumulada de consumo depende de la cantidad de vistas
repetidas y de la vigencia y disponibilidad de cada imagen.

**Pendiente de verificación:** publicación y medición de consumo posterior.
