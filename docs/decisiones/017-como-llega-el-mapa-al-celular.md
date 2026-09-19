# 017 — Cómo llega el mapa al celular

**Fecha:** 2026-09-19 · **Estado:** vigente
**Cierra los dos pendientes de la decisión 007.**

---

## El problema que lo origina

La 007 dejó decidido **de dónde sale el mapa** (Protomaps, el mapa del mundo
empaquetado en un archivo único) pero no **cómo llega al teléfono**. Al ir a
construirlo aparecieron dos cosas que cambian la arquitectura y que no se
podían saber sin probar contra el servidor de verdad.

### Uno: el archivo no se le entrega a un navegador

El archivo del mundo vive en `build.protomaps.com`. Responde pedidos por rango
—se le pide un pedacito y lo manda— pero **no manda la cabecera que autoriza a
leerlo desde una página web**. Verificado por comparación: el mismo pedido a
otro servidor de mapas, por el mismo camino, sí la manda.

Consecuencia: la descarga **no puede correr en el celular**. Tal como estaba
pensado, fallaba en el teléfono del usuario y no había forma de saberlo sin
probarlo ahí.

### Dos: el archivo cambia de nombre todos los días

Se publica uno por día, con la fecha en el nombre, y los de más de una semana
se borran. Una dirección escrita en el código deja de funcionar a los pocos
días de publicada la app.

---

## Decisión

**El servidor de TrackApp hace de puente.** El celular le pide los pedazos a
TrackApp, TrackApp los busca en el archivo del mundo y se los pasa.

- **No aloja nada.** No hay archivo de mapa guardado en ningún servidor propio:
  cada pedazo se busca cuando se pide y se manda. El costo de almacenamiento es
  cero.
- **Interviene solo mientras dura la descarga**, en casa y con señal. Una vez
  que los pedazos están en el teléfono, el mapa se lee de ahí y por el puente no
  vuelve a pasar nadie. **No contradice la regla de que navegar es 100% sin
  conexión.**
- **La dirección del archivo la busca el servidor**, probando desde hoy hacia
  atrás, y se la guarda unas horas. No está escrita en ningún lado.
- **El puente pide sesión iniciada.** Sin eso, cualquiera de afuera podría usar
  el servidor de TrackApp de intermediario gratis.

## Cómo se guarda en el celular

- Los pedazos se guardan **por su nombre de grilla**, no por sector. Dos
  sectores vecinos comparten pedazos, y **todos** comparten los de los
  acercamientos lejanos: el segundo sector que se baja ya los encuentra hechos.
- Por lo mismo, **borrar el mapa de un sector no borra sus pedazos a ciegas**:
  se dice qué pedazos siguen haciendo falta y se va todo lo demás.
- Qué sector tiene mapa se anota aparte, en el guardado liviano, porque las
  pantallas lo necesitan en el momento en que se dibujan.

## Las letras del mapa viajan adentro de la app

Un mapa pide sus letras y sus íconos a un servidor. Sin señal eso deja el mapa
**sin un solo nombre escrito**, que es justo cuando se usa. Por eso las letras y
los íconos son archivos de la app y entran en el paquete que el celular guarda
solo.

## Medido, no estimado

Contra el archivo de verdad, sobre un sector de sierra de unos 6 × 4 km cerca
del Champaquí:

| | |
|---|---|
| Pedazos | 84 |
| Peso | 1,0 MB |
| Tiempo | 6 segundos |
| Detalle | hasta el último acercamiento que el archivo declara |
| Pedazos vacíos | ninguno |

Una zona entera son 3292 pedazos. **Por eso existen los sectores.**

## Lo que queda afuera a propósito

- **El satelital todavía no existe.** Cuando exista, entra por el mismo puente y
  aparece el selector entre los dos. No se dibuja hoy una opción que falla al
  tocarla.
- **Las curvas de nivel** siguen pendientes (decisión 013). El mapa simple hoy
  trae caminos, agua, relieve de superficie y nombres, pero no curvas.
