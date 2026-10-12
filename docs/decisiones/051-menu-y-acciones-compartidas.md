# 051 — Salidas como inicio y acciones compartidas

**Decidido por Ale:** 2026-10-12. Boceto visual aprobado antes de editar la interfaz.

## Decisión

El menú tiene el mismo orden en celular y computadora: Salidas, Circuitos,
Navegación libre, Mapas y Perfiles. Salidas es el inicio con conexión. Como
Salidas necesita internet, la entrada guardada en el celular muestra un aviso
y accesos a Circuitos y Navegación libre cuando no hay señal. Los avisos de
mapas perdidos y Circuitos sin mapa siguen en la lista de Circuitos.

Un comportamiento usa una pieza compartida: volver es un círculo con flecha;
agregar es un círculo con «+»; las acciones de editar y eliminar se abren con
los tres puntos; navegar un Circuito usa el mismo ícono que Navegación libre.
Las tarjetas que abren un detalle responden en toda su superficie y llevan una
indicación discreta «Abrir» abajo a la derecha. Eliminar sigue pidiendo
confirmación.

## Motivo

Ale quiere encontrar primero sus Salidas y reconocer cada acción por el mismo
símbolo en toda la app. La entrada offline conserva un camino directo hacia
las dos navegaciones sin pedir internet.

## Auditoría de fuentes

- Leído en tiempo real: pedido de Ale, boceto aprobado, componentes de menú,
  Salidas, Circuitos, Mapas y navegación, reglas offline.
- Inferido: ninguno.
- Pendiente de verificación: prueba de la interfaz con sesión iniciada en modo
  sol y noche y prueba de navegación en modo avión en un celular real.
