// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { FORMATOS_DE_CAMINOS, leerArchivoDeCaminos } from "@/lib/caminos/archivo";

/**
 * Las pruebas del lector de archivos de Caminos.
 *
 * **Si junta líneas que eran alternativas, la persona ve en el mapa un camino
 * que no existe.** Por eso se prueba sobre todo que nada se sume y que nada se
 * pierda sin decir por qué.
 *
 * Los archivos son inventados. El de siete líneas imita la forma del proyecto
 * de Google Earth de Ale (estilos en cascada, alturas en cero, ningún punto),
 * sin copiar sus datos.
 */

function archivo(nombre: string, contenido: string | Uint8Array): File {
  return new File([typeof contenido === "string" ? contenido : new Uint8Array(contenido)], nombre);
}

function linea(desdeLon: number, lat: number, pasos: number): string {
  return Array.from({ length: pasos }, (_, i) => `${(desdeLon + i * 0.001).toFixed(6)},${lat.toFixed(6)},0`).join(" ");
}

const ALTERNATIVAS = [
  ["Alternativa por el filo", "#fbc02d", 83],
  ["Conexión que quizás sea a pie", "#7b1fa2", 7],
  ["Camino al pueblo", "#7b1fa2", 35],
  ["Bajada a la cascada", "#fbc02d", 35],
  ["Huella del cuadrado", "#1976d2", 31],
  ["Salida más arriba", "#42a5f5", 52],
  ["Trazos de la quebrada", "#42a5f5", 19],
] as const;

/** Earth guarda el color como `aabbggrr`. */
function colorDeEarth(hex: string): string {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
  return `ff${b}${g}${r}`;
}

const PROYECTO_DE_SIETE_LINEAS = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2">
<Document>
  <name>Proyecto de prueba</name>
  ${ALTERNATIVAS.map(([, color], i) => `
  <gx:CascadingStyle kml:id="estilo_${i}_normal"><Style><LineStyle><color>${colorDeEarth(color)}</color><width>3.2</width></LineStyle></Style></gx:CascadingStyle>
  <StyleMap id="estilo_${i}"><Pair><key>normal</key><styleUrl>#estilo_${i}_normal</styleUrl></Pair></StyleMap>`).join("")}
  ${ALTERNATIVAS.map(([nombre, , pasos], i) => `
  <Placemark>
    <name>${nombre}</name>
    <styleUrl>#estilo_${i}</styleUrl>
    <LineString><coordinates>${linea(-64.3, -31.0 - i * 0.01, pasos)}</coordinates></LineString>
  </Placemark>`).join("")}
</Document>
</kml>`;

describe("un proyecto de Google Earth con siete líneas", () => {
  it("da siete líneas separadas, ningún punto y nada omitido", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("proyecto.kml", PROYECTO_DE_SIETE_LINEAS));
    expect(lectura.ok).toBe(true);
    if (!lectura.ok) return;

    expect(lectura.formato).toBe("kml");
    expect(lectura.lineas).toHaveLength(7);
    expect(lectura.puntos).toHaveLength(0);
    expect(lectura.omitidos).toHaveLength(0);
  });

  it("conserva el nombre, el orden, los puntos y el color de cada una", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("proyecto.kml", PROYECTO_DE_SIETE_LINEAS));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.lineas.map((cada) => cada.nombre)).toEqual(ALTERNATIVAS.map(([nombre]) => nombre));
    expect(lectura.lineas.map((cada) => cada.orden)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(lectura.lineas.map((cada) => cada.color)).toEqual(ALTERNATIVAS.map(([, color]) => color));
    expect(lectura.lineas.map((cada) => cada.coordenadas.length)).toEqual(ALTERNATIVAS.map(([, , pasos]) => pasos));
    expect(lectura.lineas[0].coordenadas[0]).toEqual([-64.3, -31, 0]);
  });

  it("no suma las alternativas: cada una mide lo suyo", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("proyecto.kml", PROYECTO_DE_SIETE_LINEAS));
    if (!lectura.ok) throw new Error(lectura.error);

    const total = lectura.lineas.reduce((suma, cada) => suma + cada.largoM, 0);
    for (const cada of lectura.lineas) expect(cada.largoM).toBeLessThan(total / 2);
    // La más larga tiene 82 tramos de ~95 m: unos 7,8 km, no la suma de todas.
    expect(lectura.lineas[0].largoM).toBeGreaterThan(7_500);
    expect(lectura.lineas[0].largoM).toBeLessThan(8_200);
  });

  it("avisa que las líneas dibujadas en Earth no traen altura", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("proyecto.kml", PROYECTO_DE_SIETE_LINEAS));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.lineas.every((cada) => cada.tieneAlturas === false)).toBe(true);
  });
});

const CON_MULTIGEOMETRIA = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <Placemark>
    <name>Cruce del arroyo</name>
    <description>Dos variantes y el vado</description>
    <Style><LineStyle><color>ff2dc0fb</color></LineStyle></Style>
    <MultiGeometry>
      <LineString><coordinates>-64.50,-31.50 -64.49,-31.50</coordinates></LineString>
      <Point><coordinates>-64.495,-31.505</coordinates></Point>
      <LineString><coordinates>-64.50,-31.51 -64.49,-31.51 -64.48,-31.51</coordinates></LineString>
    </MultiGeometry>
  </Placemark>
  <Placemark>
    <name>Refugio</name>
    <description><![CDATA[<b>Abierto</b> en verano]]></description>
    <Style><IconStyle><Icon><href>https://earth.google.com/earth/document/icon?color=1976d2&amp;id=2000&amp;scale=4</href></Icon></IconStyle></Style>
    <Point><coordinates>-64.47,-31.52,0</coordinates></Point>
  </Placemark>
  <Placemark>
    <name>Campo cercado</name>
    <Polygon><outerBoundaryIs><LinearRing><coordinates>-64.4,-31.4 -64.39,-31.4 -64.39,-31.39 -64.4,-31.4</coordinates></LinearRing></outerBoundaryIs></Polygon>
  </Placemark>
  <Placemark>
    <name>Línea a medias</name>
    <LineString><coordinates>-64.4,-31.4</coordinates></LineString>
  </Placemark>
</Document>
</kml>`;

describe("un marcador con varias figuras juntas", () => {
  it("entrega cada línea por separado, con los datos de su marcador", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("mezcla.kml", CON_MULTIGEOMETRIA));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.lineas).toHaveLength(2);
    const [primera, segunda] = lectura.lineas;
    expect(primera.coordenadas).toEqual([[-64.5, -31.5], [-64.49, -31.5]]);
    expect(segunda.coordenadas).toHaveLength(3);
    for (const cada of lectura.lineas) {
      expect(cada.nombre).toBe("Cruce del arroyo");
      expect(cada.descripcion).toBe("Dos variantes y el vado");
      expect(cada.color).toBe("#fbc02d");
      expect(cada.elemento).toBe(0);
    }
    expect(primera.nombreSugerido).toBe("Cruce del arroyo (1 de 2)");
    expect(segunda.nombreSugerido).toBe("Cruce del arroyo (2 de 2)");
  });

  it("separa los puntos, también el que venía adentro del grupo", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("mezcla.kml", CON_MULTIGEOMETRIA));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.puntos.map((cada) => cada.nombre)).toEqual(["Cruce del arroyo", "Refugio"]);
    expect(lectura.puntos[0].coordenada).toEqual([-64.495, -31.505]);
    expect(lectura.puntos[0].elemento).toBe(0);
    expect(lectura.puntos[1].coordenada).toEqual([-64.47, -31.52, 0]);
  });

  it("toma el color del marcador de Earth y reconoce la descripción en HTML", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("mezcla.kml", CON_MULTIGEOMETRIA));
    if (!lectura.ok) throw new Error(lectura.error);

    const refugio = lectura.puntos[1];
    expect(refugio.color).toBe("#1976d2");
    expect(refugio.descripcion).toBe("<b>Abierto</b> en verano");
    expect(refugio.descripcionEsHtml).toBe(true);
  });

  it("dice por qué se saltea un área y una línea de un solo punto", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("mezcla.kml", CON_MULTIGEOMETRIA));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.omitidos.map((cada) => cada.nombre)).toEqual(["Campo cercado", "Línea a medias"]);
    expect(lectura.omitidos[0].motivo).toMatch(/área/);
    expect(lectura.omitidos[1].motivo).toMatch(/ubicación/);
  });

  it("mantiene el orden del archivo entre líneas, puntos y omitidos", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("mezcla.kml", CON_MULTIGEOMETRIA));
    if (!lectura.ok) throw new Error(lectura.error);

    const todo = [
      ...lectura.lineas.map((cada) => [cada.orden, `línea ${cada.nombreSugerido}`]),
      ...lectura.puntos.map((cada) => [cada.orden, `punto ${cada.nombreSugerido}`]),
      ...lectura.omitidos.map((cada) => [cada.orden, `omitido ${cada.nombre}`]),
    ].sort((a, b) => Number(a[0]) - Number(b[0]));
    expect(todo.map(([, cual]) => cual)).toEqual([
      "línea Cruce del arroyo (1 de 2)",
      "punto Cruce del arroyo",
      "línea Cruce del arroyo (2 de 2)",
      "punto Refugio",
      "omitido Campo cercado",
      "omitido Línea a medias",
    ]);
  });
});

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="prueba" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="-31.5000" lon="-64.5000"><ele>900</ele><name>Fuente</name><desc>Agua todo el año</desc></wpt>
  <trk>
    <name>Vuelta grabada</name>
    <desc>Se cortó la señal a la mitad</desc>
    <trkseg>
      <trkpt lat="-31.5000" lon="-64.5000"><ele>900</ele></trkpt>
      <trkpt lat="-31.4950" lon="-64.4950"><ele>950</ele></trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="-31.4900" lon="-64.4900"><ele>1000</ele></trkpt>
      <trkpt lat="-31.4850" lon="-64.4850"><ele>1010</ele></trkpt>
    </trkseg>
  </trk>
  <rte>
    <name>Atajo planeado</name>
    <rtept lat="-31.5000" lon="-64.5000"/>
    <rtept lat="-31.5100" lon="-64.5100"/>
  </rte>
</gpx>`;

describe("un GPX", () => {
  it("devuelve las líneas y los puntos por separado, cada segmento aparte", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("salida.gpx", GPX));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.formato).toBe("gpx");
    expect(lectura.lineas.map((cada) => cada.nombreSugerido)).toEqual([
      "Vuelta grabada (1 de 2)",
      "Vuelta grabada (2 de 2)",
      "Atajo planeado",
    ]);
    expect(lectura.lineas[0].descripcion).toBe("Se cortó la señal a la mitad");
    expect(lectura.lineas[0].tieneAlturas).toBe(true);
    expect(lectura.lineas[2].tieneAlturas).toBe(false);
    expect(lectura.puntos).toHaveLength(1);
    expect(lectura.puntos[0]).toMatchObject({ nombre: "Fuente", descripcion: "Agua todo el año", coordenada: [-64.5, -31.5, 900] });
    expect(lectura.omitidos).toHaveLength(0);
  });

  it("acepta un GPX que trae solo puntos", async () => {
    const soloPuntos = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="-31.5" lon="-64.5"><name>Mirador</name></wpt></gpx>`;
    const lectura = await leerArchivoDeCaminos(archivo("puntos.gpx", soloPuntos));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.lineas).toHaveLength(0);
    expect(lectura.puntos.map((cada) => cada.nombre)).toEqual(["Mirador"]);
  });
});

describe("un KMZ", () => {
  it("se abre comprimido y separa líneas y puntos", async () => {
    const kml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
      <Placemark><name>Huella</name><LineString><coordinates>-64.5,-31.5 -64.49,-31.5</coordinates></LineString></Placemark>
      <Placemark><name>Tranquera</name><Point><coordinates>-64.495,-31.5</coordinates></Point></Placemark>
    </Document></kml>`;
    const comprimido = zipSync({ "doc.kml": strToU8(kml) });
    const lectura = await leerArchivoDeCaminos(archivo("proyecto.kmz", comprimido));
    if (!lectura.ok) throw new Error(lectura.error);

    expect(lectura.formato).toBe("kmz");
    expect(lectura.lineas.map((cada) => cada.nombre)).toEqual(["Huella"]);
    expect(lectura.puntos.map((cada) => cada.nombre)).toEqual(["Tranquera"]);
  });
});

describe("archivos que no sirven", () => {
  it("rechaza otra extensión diciendo cuáles sirven", async () => {
    const lectura = await leerArchivoDeCaminos(archivo("foto.jpg", "nada"));
    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toMatch(/\.kml, \.kmz o \.gpx/);
    expect(FORMATOS_DE_CAMINOS).toBe(".kml,.kmz,.gpx");
  });

  it("dice que el archivo está dañado si no es XML", async () => {
    for (const nombre of ["roto.kml", "roto.gpx"]) {
      const lectura = await leerArchivoDeCaminos(archivo(nombre, "<kml><Document>"));
      expect(lectura.ok).toBe(false);
      if (lectura.ok) continue;
      expect(lectura.error).toMatch(/dañado/);
    }
  });

  it("si no queda nada usable, dice por qué", async () => {
    const soloAreas = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Lote</name>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>-64.4,-31.4 -64.39,-31.4 -64.39,-31.39 -64.4,-31.4</coordinates></LinearRing></outerBoundaryIs></Polygon>
    </Placemark></Document></kml>`;
    const lectura = await leerArchivoDeCaminos(archivo("areas.kml", soloAreas));
    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toMatch(/ninguna línea ni ningún punto/);
    expect(lectura.error).toMatch(/área/);
  });
});
