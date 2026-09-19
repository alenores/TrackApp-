# 016 — Un solo módulo de fotos para toda la app

> Decidido: 2026-09-19 · Pedido por Ale

## El pedido

«Quiero que ya mismo dejes armado el módulo para la carga de fotos, que se
tiene que repetir en todos lados. En la versión 2, cuando registremos que
alguien recorrió la ruta, va a poder subir fotos de su paseo, y va a ser muy
importante usar el mismo módulo.»

Y una regla dura: **solo WebP, nunca más de 2 MB.** «Permitir JPG ni PNG sería
un error gravísimo: generarle peso a la base al pedo.»

## De dónde salió

De Vías de Escalada, que ya tenía esto resuelto y bien. Se leyó su módulo y se
adaptó a las reglas de TrackApp. **Tres cosas de ahí no son obvias** y ninguna
se habría deducido escribiendo el módulo de cero:

### 1. La foto se lee una sola vez

La galería del celular **presta** el archivo, no lo entrega. En Android el
permiso para leerlo es temporal; en iPhone la copia se libera si la app pasa a
segundo plano.

Lo natural sería leerla al elegirla (para la vista previa) y otra vez al
guardar (para convertirla). Y ahí está la trampa: **la segunda lectura puede
fallar aunque la primera haya salido bien**, y la persona ve «no se pudo leer»
con la foto a la vista.

Por eso se lee una vez, al elegirla, y de ahí en más todo trabaja sobre la copia.

### 2. Las fotos de iPhone hay que traducirlas

Una foto de iPhone mandada «como archivo» llega en un formato que Chrome no
sabe abrir. El iPhone la convierte solo cuando se elige de su propia galería,
pero el Android del que la recibe, no.

Para eso se baja un traductor de unos 3 MB, **solo en el celular que lo
necesita y solo en el momento en que hace falta**. Nunca va en lo que se guarda
para usar sin señal: subir fotos es siempre con internet.

Y el formato se reconoce **mirando los primeros bytes del archivo**, no el
nombre ni el tipo declarado, que pueden mentir.

### 3. El tope de peso está garantizado, no intentado

Comprimir una vez y esperar que entre no alcanza. El módulo baja la calidad por
escalones y, si con eso no entra, baja las medidas, hasta lograrlo.

Una foto que se sube «casi» dentro del límite la rechaza la base, y para
entonces el usuario ya esperó toda la subida.

## Qué se decidió acá

**Solo WebP y nunca más de 2 MB**, como pidió Ale. Pero eso es lo que se
**guarda**, no lo que el usuario tiene que conseguir: elige la foto como la
tenga y la app la convierte antes de que salga del teléfono. Pedirle que
convierta a WebP sería trasladarle un problema de la app.

El formulario apunta a 1 MB y la base corta en 2: **el margen es a propósito**,
para que una foto que pasó por poco no quede rechazada del otro lado.

**Recortar es parte de elegir**, no un paso aparte. Y la forma la decide el
destino: donde la pantalla muestra un círculo, se recorta en círculo.

**El zoom lleva botones grandes además del gesto de dos dedos.** Un gesto fino
no se acierta con guantes, y esa es la regla de la app.

## Cómo se suma un destino nuevo

Dos renglones, en dos archivos, y nada más:

1. El tamaño y el tope, en los ajustes por destino.
2. La forma de recorte, en las formas por destino.

El resto del camino —leer, traducir, recortar, convertir, comprimir, mostrar,
avisar— ya está hecho y es el mismo para todos.

## Lo que esto arregló de paso

Buscando dónde enchufarlo aparecieron **tres cosas rotas** en la foto de perfil,
que hoy no funcionaba de ninguna manera:

- escribía en un depósito llamado `avatars`, y el que existe es `avatares`;
- aceptaba 3 MB cuando la base corta en 2, y tres formatos cuando admite uno;
- guardaba la dirección de la foto en la tabla `profiles`, que no existe.

## Auditoría de fuentes

**Leído en tiempo real (2026-09-19):**
- De Vías de Escalada: su módulo de compresión de imágenes, su hook de foto de
  formulario, su selector y su pantalla de recorte.
- De TrackApp: `lib/fotos/preparar.ts`, `hooks/use-foto.ts`,
  `components/fotos/*`, `lib/cuenta/fotos.ts`, `app/actions/perfil.ts`.
- De la base de TrackApp: la lista de depósitos con su peso y formatos
  admitidos, y las tablas existentes (consulta corrida por Ale).

**Inferido (no verificado):** nada.

**Pendiente de verificación:** nada.
