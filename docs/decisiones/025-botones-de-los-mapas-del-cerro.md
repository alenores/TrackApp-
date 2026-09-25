# 025 — Los botones de los mapas del cerro y cómo se eligen las rutas

**Fecha:** 2026-09-25 · **Estado:** vigente
**Aplica a:** navegar una ruta y el mapa libre.

---

## El pedido

Ale quiere los dos mapas del cerro despejados: pocos botones, chicos, abajo,
y nada que no sirva.

## Decisión

- **El GPS se prende solo al entrar y se apaga al salir.** Quien entra a estas
  pantallas es porque está navegando. No hay botón para prenderlo. Si el GPS
  no arranca, la pantalla lo dice con el motivo.
- **Abajo a la izquierda, tres círculos:** salir, anotaciones y rutas. A la
  derecha, centrar en tu posición. Sol y noche queda arriba a la derecha.
- **No hay carteles de desvío** («Vas por la ruta», «Fuera de ruta») ni la
  vibración que los acompañaba. Se sacaron también las cuentas que los
  alimentaban. Decisión de Ale: no sirven.
- **Anotaciones, en un solo círculo.** Abre «Agregar una anotación» y las
  casillas de cuáles se ven (las tuyas, las del administrador, las de otros).
- **Rutas, por sector.** El círculo de rutas abre la lista de un sector, con
  su nombre y el de su zona arriba. El ícono de mapa abre el mapa de la zona,
  con sus sectores y tu punto azul; tocando un sector, la lista pasa a ser la
  de ese sector. Zona y sector son un filtro: lo que ya prendiste en otro
  sector sigue prendido. «Todas» y «Ninguna» actúan sobre el sector a la vista.
- **Qué sector aparece elegido:**
  - Navegando una ruta, el sector por donde pasa la mayor parte de ella. La
    ruta que navegás no se puede apagar.
  - En el mapa libre, el sector donde estás, según el GPS. Mientras el GPS no
    responde, no hay sector elegido y el mapa muestra todas las zonas desde
    arriba; cuando responde, el mapa va a donde estás.
- **Todo sale de lo guardado en el celular**, también el mapa de la zona.
- **Mapa sin bajar: un cartel chico, nada más.** Arriba a la izquierda, donde
  va Simple/Satelital, un cartel ámbar que dice «Sin mapa descargado». Sin
  más texto. Reemplaza a los carteles grandes de abajo.
- **Simple/Satelital, chato**, y al lado, con la foto satelital, un círculo
  con líneas para las curvas de nivel: un toque las prende o las apaga, como
  sol y noche. Apagado se ve deshabilitado.
- **El mapa de la zona va sin botones propios** (ubicarme, ver en grande) y
  con el nombre de cada sector en su esquina, así no tapa tu punto azul. Es la
  única excepción a «todo mapa se puede abrir en grande».

## Lo que se corrigió en el camino

- El mapa libre no iba a tu posición si el GPS respondía antes de que el mapa
  terminara de armarse: el encuadre del armado pisaba el centrado.
- El aviso de que falta mapa se calculaba en la navegación pero nunca se
  mostraba. Ahora se muestra, como el cartel chico.
