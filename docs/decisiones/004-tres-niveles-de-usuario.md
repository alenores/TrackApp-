# 004 — Tres niveles de usuario

**Fecha:** 2026-09-18 · **Estado:** vigente (parcial)

## Contexto

La app va a tener más de un tipo de usuario, y el modelo de datos tiene que
nacer preparado. Pero la app todavía no está definida funcionalmente.

## Decisión

**Se fijan tres categorías: administrador, premium y normal.** Nada más.

**Los permisos de cada categoría quedan explícitamente sin definir.** Se
resuelven función por función, cuando cada función se defina.

## Motivo

Es lo único que se puede decidir con certeza hoy sin inventar. Los permisos
dependen de funciones que todavía no existen: fijarlos ahora sería adivinar, y
una decisión adivinada se convierte en cimiento falso.

Catalogar las categorías desde el arranque evita la migración dolorosa del día
en que llegue el primer usuario ajeno al círculo de Ale.

## Consecuencias

- Toda tabla nueva nace sabiendo que existen tres categorías.
- Toda función nueva, al definirse, dice qué categoría la puede usar.
- Ningún agente asigna permisos por su cuenta.
