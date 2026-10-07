# Boceto del dibujo de Circuitos: notas

**Estado:** aprobada por Alejandro el 2026-10-07 («ahora sí está correcto, bien
simple. Confirmado»). Sigue siendo un ejemplo local, no la app implementada.
Reemplaza los dos bocetos anteriores de la misma página después de la
corrección expresa de Ale. Es un ejemplo local: no lee datos ni guarda nada.

## Regla de uso que Ale confirmó

El usuario marca con el mouse, punto a punto, por dónde irá el Circuito. Puede
empezar en cualquier lugar del mapa. **No se elige un Camino para iniciar un
Circuito.** Si dos puntos consecutivos caen sobre el mismo Camino, la línea
del Circuito sigue la forma de ese Camino entre ambos. Si el siguiente punto
cae fuera, la línea sale del Camino y llega a ese punto; se puede seguir
dibujando libremente. Más adelante puede volver a seguir otro Camino. No hacen
falta modos separados «usar Camino» y «dibujar parte propia», ni porcentajes.

Mapas/Caminos y Circuitos siguen siendo conceptos independientes: dibujar el
Circuito no crea ni edita Caminos, puntos o trazos. Un Camino existente solo
sirve como guía geométrica cuando los puntos marcados lo aprovechan. Ver
decisión 044.

## Separación de textos en el boceto

- **Dentro del marco blanco de TrackApp** están únicamente los títulos,
  instrucciones, botones y mensajes propuestos para la app.
- **Fuera del marco, sobre fondo violeta y borde punteado**, están las notas
  para que Ale comprenda y pruebe el ejemplo. Todas dicen explícitamente
  «no aparece en la app». Los botones de reiniciar el ejemplo viven ahí.

## Qué se puede probar

1. Tocar dos lugares del Camino verde: la línea azul sigue los quiebres de ese
   Camino, no une esos toques en línea recta.
2. Tocar un lugar fuera del Camino: la línea azul sale hacia el nuevo punto.
3. Tocar otros lugares libres y luego dos sobre un Camino: se retoma su forma.
4. «Deshacer último punto» quita solo el último toque. El modo sol/noche cambia
   los colores del ejemplo.

## Límites de la demostración

El mapa y sus Caminos son inventados; no representan Ascochinga. Una cercanía
de 18 unidades del dibujo se toma como toque sobre Camino, solo para la
demostración. En la implementación real habrá que ajustar la selección según
el acercamiento y resolver los casos donde se cruzan o superponen Caminos. El
ejemplo no calcula distancia, esfuerzo, desnivel ni mapas faltantes, y no
demuestra todavía el guardado ni la navegación. La línea corregida de un
Camino y los avisos previos acordados siguen pendientes de implementación.

La herramienta de navegador del agente rechazó abrir este archivo `file:` por
su política de seguridad. Se revisó la sintaxis del JavaScript, pero no se
puede afirmar que el aspecto o los clics hayan sido comprobados visualmente.
Ale revisó y aprobó el concepto de interacción del boceto. Su aprobación no
convierte las limitaciones del ejemplo en reglas de la app definitiva.

## Auditoría de fuentes

- **Leído en tiempo real:** corrección expresa de Ale en la conversación, decisiones 034, 042 y 043, glosario, reglas de diseño exterior y versiones anteriores del boceto.
- **Inferido:** un toque libre después de uno sobre Camino se conecta por una línea hacia el punto libre; no inventa una continuación por otro Camino.
- **Pendiente de verificación:** selección en cruces; avisos y vínculo de geometría en la app real.
