# 027 — Cargar puntos sin sector, pegando la coordenada

**Fecha:** 2026-09-30 · **Estado:** vigente
**Amplía la 010 y la 023.**

---

## El pedido

Ale busca lugares en Google Earth, copia la coordenada y quiere cargarla en la
app al toque: pegar, escribir el texto, elegir el ícono, guardar, y seguir con
el siguiente. Exportar un archivo, subirlo y corregirlo después es lento.

Y los puntos no son de un sector: el usuario que no bajó el mapa de un sector
igual se orienta con los puntos.

## Decisiones (Ale, 2026-09-30)

- **Se llama «punto».** Nada de «punto de referencia».
- **Solo puntos.** Los trazos se siguen dibujando dentro del sector.
- **Lo de adentro del sector queda como está** (marcar tocando el mapa, traer
  de Google Earth y de OpenStreetMap). La pantalla nueva se suma aparte.
- **Solo el administrador.** Premium y normal no ven el botón ni la pantalla.
- **El botón va en la pantalla de Zonas**, visible solo para el administrador y
  solo con señal (es una pantalla de administración).
- **Al guardar, el formulario queda vacío y listo para el siguiente punto.**
- **Se pega tal cual sale de Google Earth**: `31°16'31.0"S 64°19'13.3"W`.
  `leerCoordenada` (`lib/coordenadas.ts`) ya lo entiende; se probó el
  2026-09-30 y da -31.27528, -64.32036.

## Lo que ya existía y se reusa

- En la base, `anotaciones.sector_id` es opcional desde 2026-09-24.
- Todas las anotaciones bajan a todos los celulares con cada puesta al día
  (`lib/offline/sincronizacion.ts`), no por sector.
- Dónde se muestra una anotación sale de dónde está (`anotacionesDelLugar`),
  no del sector.
- El formulario de punto (ícono + comentario + foto) vive en
  `components/anotaciones/pantalla-de-anotaciones.tsx`.

## Pasos (cada uno, un commit)

1. [x] Borrador de la pantalla aprobado por Ale.
2. [x] Prueba automática: `leerCoordenada` con el formato de Google Earth.
3. [x] Guardar un punto sin sector desde la computadora: acción del servidor
   que inserta con `sector_id` nulo y `origen = 'manual'`. Verificar contra la
   base que la regla de seguridad lo acepta para el administrador.
   Hecho en `crearAnotacion` (`sectorId: null`, solo punto, solo administrador).
   Confirmado con guardado real desde la pantalla, con la cuenta del
   administrador. El punto sin sector se reabrió en otra sesión, se editó
   y se borró con confirmación.
4. [x] Pantalla nueva `/zonas/puntos`: mapa general con todos los puntos,
   campo para pegar la coordenada, el mapa salta al punto, ícono, texto,
   guardar, formulario vacío para el siguiente.
   **Implementado y probado en pantalla el 2026-09-30:** mapa, coordenada de
   Google Earth, ícono, texto, foto compartida, edición desde el mapa, borrado
   con confirmación y formulario que vuelve a la coordenada al guardar.
   Pruebas automáticas de guardado, fallos, reintento de foto sin duplicados,
   edición, borrado y acceso por dirección. Revisión visual en sol y noche;
   mapa grande y cierre con Atrás comprobados.
   **Prueba real completada el 2026-10-01, autorizada por Ale:** guardar,
   reabrir desde el mapa, cambiar texto e ícono, guardar la edición, confirmar
   su persistencia y borrar. El formulario se vacía y el foco vuelve a la
   coordenada. El punto temporal quedó borrado.
5. [x] Botón en Zonas, solo administrador y solo con señal.
6. [x] Glosario y `docs/SESIONES.md` actualizados; decisión vigente.

- **Arreglar y borrar se hace en la misma pantalla**, tocando el punto en el
  mapa. Borrar pide confirmación.
- **Lleva foto, igual que en los sectores** (módulo compartido de fotos).

## Borrador

Aprobado por Ale el 2026-09-30: tres pasos (botón «Puntos» en Zonas → mapa con
todos los puntos + formulario de pegar coordenada, ícono, texto → al guardar,
aviso y formulario vacío). Con foto, y con arreglar y borrar desde el mapa.

## Alcance de la verificación

- Guardado, edición y borrado reales comprobados con la cuenta administradora.
- Fotos: módulo compartido implementado y reintento sin duplicados cubierto por
  pruebas automáticas. La prueba de adjuntar una imagen sintética desde Chrome
  no pudo ejecutarse: la herramienta rechazó `fileChooser.setFiles` con
  `Not allowed`. No se subió una imagen ni se cambió la configuración del
  navegador. La carga real de foto queda como comprobación manual adicional.
