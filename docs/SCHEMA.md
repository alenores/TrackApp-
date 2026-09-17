# Esquema de la base de datos

> Estado: 🔴 SIN VERIFICAR — no se pudo acceder a la base de TrackApp

## Bloqueo

La base de datos de TrackApp **no fue accesible** en la sesión del 2026-09-17. El
único proyecto Supabase alcanzable fue el de Vías de Escalada Córdoba, que es
otra base.

Lo que sigue sale **del código, no de la base**. Sirve como referencia provisoria
y **no debe usarse para escribir consultas sin verificar antes**.

## Tablas que el código consulta

`rutas` · `zonas` · `sectores` · `profiles` · `novedades`

Más dos depósitos de archivos: uno para avatares y uno para archivos GPX.

## Deuda conocida

Ver `RIESGOS.md` R4: el esquema no cumple las convenciones fijas de Ale
(nombres en español, borrado lógico, fechas de auditoría, RLS).

## Para completar este documento

Hace falta acceso a la base de TrackApp. Una vez disponible, reemplazar todo lo
de arriba por el esquema real leído en tiempo real, tabla por tabla.

## Auditoría de fuentes

**Leído en tiempo real:** tipos declarados en el código y consultas del código.
**Pendiente de verificación:** absolutamente todo. Este documento NO está listo
para usarse como referencia.
