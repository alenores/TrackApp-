# 059 — En Marcas, las líneas de zonas y sectores

**Fecha:** 2026-10-15 · **Decidió:** Ale

## La decisión

En Marcas, arriba del panel, van los tres circulitos de líneas: nada, zonas,
o zonas y sectores. Los sectores no se ven solos.

- Al abrir se ven las líneas de las zonas que están tildadas.
- «Nada» apaga bordes y nombres de zonas y de sectores. Las tildes de la
  lista no cambian.
- «Zonas y sectores» suma los sectores de esas zonas tildadas.
- La navegación libre sigue sin dibujar sectores.

## Auditoría de fuentes

### Leído en tiempo real

- Pedido de Ale: en Mapas → Marcas, poder elegir nada, la línea de las zonas
  o la de los sectores, con los mismos tres circulitos.
- Decisiones 056, 057 y 058, y el panel de Marcas.

### Inferido

- Las líneas siguen a las zonas tildadas: una zona destildada no dibuja su
  borde ni sus sectores.

### Pendiente de verificación

- Probarlo en el celular, con la cuenta iniciada.
