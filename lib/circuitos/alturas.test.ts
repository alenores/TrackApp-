import { describe, expect, it } from "vitest";
import type { Position } from "geojson";
import { exito, falla } from "@/lib/datos/resultado";
import { crearCamino, clasificarTramo } from "@/lib/caminos/partes";
import { largoDeLinea } from "@/lib/caminos/geometria";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import { cantidadDeAlturas, type FuenteDeAlturas } from "@/lib/alturas/perfil";
import { dibujarCircuito, type ParteDibujada, type ToqueDelCircuito } from "@/lib/circuitos/dibujo";
import {
  alturasDelCircuito,
  alturasPropiasParaLaBase,
  leerAlturasPropias,
  loQueFaltaDesde,
  lugarEnElCircuito,
  medirAlturasPropias,
} from "@/lib/circuitos/alturas";

// Un Camino recto hacia el norte de ~1000 m que sube parejo de 1000 a 1100 m.
const LINEA: Position[] = [[-64.5, -31.5], [-64.5, -31.491]];
const LARGO = largoDeLinea(LINEA);

function camino(): CaminoGuardado {
  const creado = crearCamino(LINEA, ["mountain_bike"]);
  if (!creado.ok) throw new Error(creado.error);
  const cantidad = cantidadDeAlturas(LARGO, 25);
  const valores = Array.from({ length: cantidad }, (_, i) => 1000 + (100 * Math.min(i * 25, LARGO)) / LARGO);
  // La segunda mitad es difícil y sin paso en mountain bike.
  const clasificado = clasificarTramo(creado.datos, LARGO / 2, LARGO, "mountain_bike", { paso: "sin_paso", complejidad: "dificil" });
  if (!clasificado.ok) throw new Error(clasificado.error);
  return {
    ...clasificado.datos, id: 3, perfilId: "autor", nombre: "Cuesta", descripcion: null,
    alturas: { cadaM: 25, valores, desnivelPositivoM: 100, desnivelNegativoM: 0 },
    versionForma: 1, creadoEn: "2026-10-08", actualizadoEn: "2026-10-08", eliminadoEn: null,
  };
}

function sobreCamino(distanciaM: number): ToqueDelCircuito {
  return { coordenada: [-64.5, -31.5 + (0.009 * distanciaM) / LARGO], enCamino: { caminoId: 3, distanciaM, versionForma: 1, actividadDelCamino: "mountain_bike" } };
}

function partes(toques: ToqueDelCircuito[]): ParteDibujada[] {
  const dibujo = dibujarCircuito(toques, [{ id: 3, coordenadas: LINEA, versionForma: 1 }]);
  if (!dibujo.ok) throw new Error(dibujo.error);
  return dibujo.datos;
}

describe("perfil de un Circuito", () => {
  it("tomando el Camino en su sentido, sube lo que sube el Camino", () => {
    const resultado = alturasDelCircuito(partes([sobreCamino(0), sobreCamino(LARGO)]), [camino()], [null]);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.largoM).toBeCloseTo(LARGO, 3);
    expect(resultado.datos.desnivelPositivoM).toBeGreaterThanOrEqual(97);
    expect(resultado.datos.desnivelNegativoM).toBe(0);
  });

  it("recorriendo el Camino al revés, lo que subía ahora se baja", () => {
    const resultado = alturasDelCircuito(partes([sobreCamino(LARGO), sobreCamino(0)]), [camino()], [null]);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.desnivelPositivoM).toBe(0);
    expect(resultado.datos.desnivelNegativoM).toBeGreaterThanOrEqual(97);
    expect(resultado.datos.perfil[0].alturaM).toBeCloseTo(1100, 1);
  });

  it("tomando solo un pedazo del Camino, cuenta solo ese pedazo", () => {
    const resultado = alturasDelCircuito(partes([sobreCamino(0), sobreCamino(LARGO / 2)]), [camino()], [null]);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.desnivelPositivoM).toBeGreaterThanOrEqual(47);
    expect(resultado.datos.desnivelPositivoM).toBeLessThanOrEqual(50);
  });

  it("los colores del gráfico siguen la clasificación vigente del Camino, también al revés", () => {
    const resultado = alturasDelCircuito(partes([sobreCamino(LARGO), sobreCamino(0)]), [camino()], [null]);
    if (!resultado.ok) throw new Error(resultado.error);
    // Al revés, lo primero que se recorre es la mitad difícil y sin paso.
    expect(resultado.datos.tramos[0]).toMatchObject({ desdeM: 0, estilo: "dificil", paso: "sin_paso" });
    expect(resultado.datos.tramos[0].hastaM).toBeCloseTo(LARGO / 2, 3);
    expect(resultado.datos.tramos[1]).toMatchObject({ estilo: "sin_clasificar", paso: "por_explorar" });
  });

  it("las partes propias usan sus alturas y se pintan como propias", async () => {
    const toques: ToqueDelCircuito[] = [sobreCamino(0), sobreCamino(LARGO), { coordenada: [-64.49, -31.491], enCamino: null }];
    const dibujadas = partes(toques);
    const llano: FuenteDeAlturas = async (puntos) => exito(puntos.map(() => 1100));
    const propias = await medirAlturasPropias(dibujadas, llano);
    if (!propias.ok) throw new Error(propias.error);
    expect(propias.datos[0]).toBeNull();
    expect(propias.datos[1]?.valores.every((valor) => valor === 1100)).toBe(true);

    const resultado = alturasDelCircuito(dibujadas, [camino()], propias.datos);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.datos.tramos.at(-1)).toMatchObject({ estilo: "propio" });
    expect(resultado.datos.largoM).toBeCloseTo(LARGO + largoDeLinea(dibujadas[1].coordenadas), 3);
  });

  it("si faltan las alturas de un Camino, lo dice con su nombre", () => {
    const sinAlturas = { ...camino(), alturas: null };
    const resultado = alturasDelCircuito(partes([sobreCamino(0), sobreCamino(LARGO)]), [sinAlturas], [null]);
    expect(resultado).toEqual(falla("Faltan las alturas del Camino «Cuesta». Poné la app al día con señal para traerlas."));
  });

  it("si faltan las de una parte propia, pide guardar el Circuito de nuevo", () => {
    const dibujadas = partes([{ coordenada: [-64.49, -31.5], enCamino: null }, { coordenada: [-64.49, -31.49], enCamino: null }]);
    const resultado = alturasDelCircuito(dibujadas, [], null);
    expect(resultado.ok).toBe(false);
  });

  it("si el relieve falla al guardar, no se inventan alturas", async () => {
    const dibujadas = partes([{ coordenada: [-64.49, -31.5], enCamino: null }, { coordenada: [-64.49, -31.49], enCamino: null }]);
    const caido: FuenteDeAlturas = async () => falla("No se pudieron calcular las alturas: tiempo agotado.");
    expect((await medirAlturasPropias(dibujadas, caido)).ok).toBe(false);
  });
});

describe("dónde estás y cuánto falta", () => {
  it("ubica la posición sobre el Circuito y calcula lo que falta en su sentido", () => {
    const dibujadas = partes([sobreCamino(0), sobreCamino(LARGO)]);
    const alturas = alturasDelCircuito(dibujadas, [camino()], [null]);
    if (!alturas.ok) throw new Error(alturas.error);
    const lugar = lugarEnElCircuito(dibujadas, [-64.5001, -31.4955]);
    expect(lugar).not.toBeNull();
    expect(lugar!.distanciaM).toBeCloseTo(LARGO / 2, -1);
    expect(lugar!.alejamientoM).toBeLessThan(15);
    const falta = loQueFaltaDesde(alturas.datos, lugar!.distanciaM);
    expect(falta.metros).toBeCloseTo(LARGO / 2, -1);
    expect(falta.desnivelPositivoM).toBeGreaterThanOrEqual(45);
    expect(falta.desnivelPositivoM).toBeLessThanOrEqual(51);
  });
});

describe("alturas propias en la base", () => {
  it("ida y vuelta", () => {
    const medidas = [null, { cadaM: 25, largoM: 60, valores: [1, 2, 3, 4] }];
    expect(leerAlturasPropias(alturasPropiasParaLaBase(medidas), 2)).toEqual(medidas);
    expect(leerAlturasPropias(null, 2)).toBeNull();
    expect(leerAlturasPropias([null], 2)).toBeUndefined();
  });
});
