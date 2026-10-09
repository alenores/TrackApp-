-- =============================================================================
-- Datos de cada Circuito y alturas de sus partes propias (decisión 049)
-- =============================================================================
--
-- Circuitos reemplaza a Rutas y suma los datos que se cargan a mano:
--
--   tecnica          del 1 al 10, cuánto hay que saber. Independiente de los
--                    colores de los Caminos.
--   nivel_esfuerzo   bajo, medio, alto o muy alto: cuánto cansa.
--   que_llevar       texto libre.
--   complicaciones   texto libre.
--   comentario       texto libre.
--
-- Los cinco pueden quedar sin cargar, igual que en Rutas.
--
-- El largo y el desnivel NO se guardan: se calculan cada vez con la línea del
-- Circuito y las alturas vigentes de sus Caminos, que pueden cambiar sin que
-- nadie toque el Circuito (decisiones 042 y 047). Lo único que el Circuito no
-- puede sacar de un Camino son las alturas de lo que se dibujó solo para él:
--
--   alturas_propias  una entrada por parte, en el mismo orden que `partes`:
--                    {"cada_m": 25, "largo_m": 812.4, "valores": [...]} para
--                    una parte propia, y null para una tomada de un Camino.
--
-- Se agregan sin obligar, para que la versión publicada de la app siga
-- guardando Circuitos mientras no se publique la nueva.

begin;

alter table public.circuitos
  add column tecnica smallint,
  add column nivel_esfuerzo public.nivel_esfuerzo,
  add column que_llevar text,
  add column complicaciones text,
  add column comentario text,
  add column alturas_propias jsonb;

alter table public.circuitos
  add constraint circuitos_tecnica_valida
    check (tecnica is null or tecnica between 1 and 10),
  add constraint circuitos_que_llevar_valido
    check (que_llevar is null or char_length(que_llevar) <= 2000),
  add constraint circuitos_complicaciones_validas
    check (complicaciones is null or char_length(complicaciones) <= 2000),
  add constraint circuitos_comentario_valido
    check (comentario is null or char_length(comentario) <= 2000),
  add constraint circuitos_alturas_propias_validas
    check (
      alturas_propias is null
      or (jsonb_typeof(alturas_propias) = 'array'
          and jsonb_array_length(alturas_propias) = jsonb_array_length(partes))
    );

comment on column public.circuitos.tecnica is
  'Del 1 al 10, cuánto hay que saber. Se carga a mano; no sale de los colores de los Caminos (decisión 049).';
comment on column public.circuitos.alturas_propias is
  'Alturas de las partes dibujadas solo para el Circuito, una entrada por parte (null en las tomadas de un Camino). Las calcula la app con el relieve al guardar.';

grant insert (tecnica, nivel_esfuerzo, que_llevar, complicaciones, comentario, alturas_propias)
  on table public.circuitos to authenticated;
grant update (tecnica, nivel_esfuerzo, que_llevar, complicaciones, comentario, alturas_propias)
  on table public.circuitos to authenticated;

commit;
