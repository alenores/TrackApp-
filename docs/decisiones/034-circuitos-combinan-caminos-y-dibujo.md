# 034 — Circuitos que combinan Caminos y dibujo propio

**Decidido por Alejandro:** 2026-10-05 · **Estado:** definición de producto; desarrollo diferido

## Motivo

Los Caminos, puntos y trazos enriquecen el mapa cuando la información del
fondo es incompleta o cuando hay que explorar alternativas. Un Circuito tiene
otro propósito: planificar una salida. Puede pasar por una calle o ruta
evidente en el mapa, aunque esa vía nunca se haya marcado como Camino.

## Decisión

- Al armar un Circuito, se pueden tomar partes de Caminos ya marcados. El
  editor incorpora esa línea sin exigir que el usuario la vuelva a dibujar.
- También se pueden dibujar partes nuevas solo para ese Circuito, incluso
  sobre vías evidentes del mapa que no estén marcadas como Caminos.
- Un Circuito puede combinar ambas formas o usar solo una de ellas. Los puntos
  y trazos sirven como referencia visual; no son componentes obligatorios.
- Crear o editar un Circuito no crea ni modifica Caminos, puntos o trazos.
- Mapas/Caminos se puede implementar y probar como funcionalidad independiente.
  El diseño de Circuitos comienza en paralelo con las pruebas de Caminos;
  su desarrollo seguirá las decisiones y el boceto aprobados. Claude puede
  preparar una auditoría técnica por separado con límites claros.
- Una parte incorporada desde un Camino mantiene el vínculo: el Circuito sigue
  las correcciones de la línea y avisa antes de salir. Ver decisión 042.
- Se puede guardar un Circuito con partes sin unir, con un aviso claro de esa
  separación y sin inventar el enlace. Ver decisión 043.
- Quedan pendientes cálculos, sincronización y relación con Salidas para la
  etapa de Circuitos.

La propuesta anterior de exigir que todo Circuito se construya únicamente con
partes de Caminos queda descartada. También queda descartada la interpretación
posterior de que un Circuito solo se dibuja a mano y nunca aprovecha líneas ya
marcadas. Las auditorías previas conservan valor diagnóstico del código
existente, pero ninguna de esas dos restricciones expresa la decisión actual.

## Estado de implementación

La app actual todavía usa «Rutas» y mezcla la línea importada con datos
globales de una salida. No existe aún un módulo «Circuitos» con este modelo.
Esta decisión no implica cambios de código ni de base de datos por sí sola.

## Auditoría de fuentes

- **Leído en tiempo real:** plan de separación, glosario, arquitectura y
  auditoría de Circuitos del repositorio.
- **Decidido por Alejandro:** un Circuito puede aprovechar partes de Caminos
  sin redibujarlas y combinarlas con partes propias; su desarrollo puede
  diferirse para probar primero Mapas/Caminos por separado.
- **Pendiente de verificación:** comportamiento y datos del futuro editor de
  Circuitos; implementación y pruebas de ambas funciones.
