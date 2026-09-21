# 021 — La base recuerda qué mapas bajaste

**Fecha:** 2026-09-21 · **Estado:** vigente
**Completa la decisión 012 (modelo de descarga) y cierra el R23 de `RIESGOS.md`.**

---

## El problema que lo origina

Una app web no es dueña del espacio que usa: el navegador se lo presta. Cuando
el teléfono se queda sin lugar, hace lugar **borrando lo guardado de los sitios
web**, sin preguntar y sin avisar. Y borra todo lo de la app de una vez: los
datos, los mapas, las fotos y las pantallas guardadas.

La app ya pide que lo marque como permanente, pero eso no lo garantiza: lo
decide el navegador solo.

**El problema no es perder los mapas. Es no enterarse.** TrackApp baja los datos
sola y sin preguntar, así que después de un borrado el usuario abre la app con
señal, las zonas, los sectores y las rutas vuelven en un segundo, la pantalla se
ve perfecta… y los mapas no están. Se enteraría en el cerro.

Y la app no tenía forma de saberlo, porque la única anotación de qué mapas había
bajado vivía en el mismo celular: se iba con el resto.

Vías de Escalada no tiene este problema porque su paquete es **todo**: vacío ya
significa «me falta todo», y con eso alcanza. El paquete de TrackApp es **lo que
vos elegiste bajar**, y esa elección es justamente lo que se pierde.

---

## Decisión

**Qué mapas bajó cada usuario se anota también en la base**, en la tabla
`mapas_bajados`. Es la única memoria que el navegador no puede borrar.

Con eso, al abrir con señal la app compara dos listas y sabe tres cosas
distintas:

| Lo que dice la base | Lo que hay en el celular | Qué pasó |
|---|---|---|
| lo tenías | está | todo bien, no se dice nada |
| lo tenías | no está | **lo perdiste**: se avisa y se ofrece bajarlo de nuevo |
| no figura | no está | nunca lo bajaste: es una tarea, no una pérdida |

Los dos avisos se ven distinto a propósito. La pérdida lleva franja ámbar y va
arriba de todo, porque el usuario creía que lo tenía. Lo nunca bajado es una
tarjeta común: no pasó nada malo.

**Los dos avisos van en el inicio.** Es el único momento en que el usuario tiene
señal y está en su casa; hacerlo entrar ruta por ruta para enterarse sería
repartir en diez pantallas lo que tiene que estar en una.

---

## Lo que casi la rompe: sacar un mapa a propósito

Sacar un mapa del celular **funciona sin señal**, porque es todo local.
Avisarle a la base, no.

Sin resolverlo, el usuario que saca un mapa en el cerro se encuentra al bajar
con que la app le grita que lo «perdió» y le ofrece bajar de nuevo justo lo que
él decidió tirar. Sería un cartel que miente, que es peor que no tener cartel.

**Por eso el sacado queda anotado como pendiente en el celular** hasta que la
base lo acepte, y mientras tanto ese sector **no se cuenta como perdido**. El
pendiente se reintenta en cada apertura con señal.

---

## Cómo se mantiene al día

Tres momentos, y ninguno puede fallar de forma silenciosa:

1. **Al bajar un mapa** se anota en la base. Si el aviso no llega, no pasa nada
   grave: el mapa está bajado igual y la próxima apertura con señal lo arregla.
2. **Al sacar un mapa** se anota el pendiente en el celular y se intenta avisar.
3. **Al abrir con señal**, apenas el paquete queda al día, se emparejan las dos
   listas.

**El emparejado va en un solo sentido y solo agrega.** Nunca se borra de la base
un mapa porque no esté en el celular: eso es exactamente la pérdida que hay que
detectar. Si se borrara, la app se olvidaría del problema en vez de avisarlo.

---

## Lo que se decidió NO hacer

- **No se avisa cuando el navegador dice que no** al pedido de espacio
  permanente. No es una falla: es una probabilidad, y no hay nada que el usuario
  pueda hacer al respecto. Ensuciar la pantalla a cambio de nada.
- **No se guarda el peso ni la lista de fotos en la base.** Son datos de este
  celular: en la base quedarían viejos. Lo que hace falta para rehacer la
  descarga igual es el tipo de mapa y el acercamiento, y eso sí está.
- **No se revisa durante la navegación.** Nada de esto se consulta en el cerro.
  Es trabajo de antes de salir.

---

## Auditoría de fuentes

**Leído en tiempo real el 2026-09-21:** el esquema completo de las cinco tablas
de TrackApp, las políticas de seguridad de todas ellas, los permisos, los
disparadores y los índices, con MCP contra el proyecto de Supabase. La tabla
nueva se verificó después de crearla.

**Verificado en el navegador:** el aviso dibujado en modo sol y en modo noche,
en singular y en plural, y con la conexión cortada —ahí desaparecen los botones
y queda toda la información.
