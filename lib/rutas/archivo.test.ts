// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { leerArchivoDeRuta } from "@/lib/rutas/archivo";

/**
 * Las pruebas de la lectura de archivos.
 *
 * **Si lee mal un archivo, el largo y el desnivel salen mal, se guardan mal y
 * nadie se entera nunca:** no hay con qué compararlos. Por eso se prueba con
 * archivos de verdad, de los dos formatos, y sobre todo con archivos rotos.
 */

function archivo(nombre: string, contenido: string): File {
  return new File([contenido], nombre, { type: "application/xml" });
}

/** Un GPX como el que baja un reloj: tres puntos subiendo 100 metros. */
const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="prueba" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Subida de prueba</name>
    <trkseg>
      <trkpt lat="-31.5000" lon="-64.5000"><ele>900</ele></trkpt>
      <trkpt lat="-31.4950" lon="-64.4950"><ele>1000</ele></trkpt>
      <trkpt lat="-31.4900" lon="-64.4900"><ele>1000</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

/** Un KML como el que exporta Google Earth. */
const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Subida de prueba</name>
      <LineString>
        <coordinates>
          -64.5000,-31.5000,900 -64.4950,-31.4950,1000 -64.4900,-31.4900,1000
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

/** Un KML con solo un marcador, sin línea: el error clásico de Google Earth. */
const KML_SIN_LINEA = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Un punto suelto</name>
      <Point><coordinates>-64.5,-31.5,900</coordinates></Point>
    </Placemark>
  </Document>
</kml>`;

describe("leer un archivo de recorrido", () => {
  it("lee un GPX y saca la línea con sus puntos", async () => {
    const lectura = await leerArchivoDeRuta(archivo("ruta.gpx", GPX));

    expect(lectura.ok).toBe(true);
    if (!lectura.ok) return;

    expect(lectura.recorrido.puntos).toBe(3);
    expect(lectura.recorrido.geometria.features.length).toBeGreaterThan(0);
  });

  it("del GPX saca el largo y los desniveles, que nadie escribe a mano", async () => {
    const lectura = await leerArchivoDeRuta(archivo("ruta.gpx", GPX));

    expect(lectura.ok).toBe(true);
    if (!lectura.ok) return;

    expect(lectura.recorrido.largoKm).toBeGreaterThan(1);
    expect(lectura.recorrido.largoKm).toBeLessThan(3);
    expect(lectura.recorrido.desnivelPositivoM).toBe(100);
    expect(lectura.recorrido.desnivelNegativoM).toBe(0);
  });

  it("del GPX saca el rectángulo que abarca todo el recorrido", async () => {
    const lectura = await leerArchivoDeRuta(archivo("ruta.gpx", GPX));

    expect(lectura.ok).toBe(true);
    if (!lectura.ok) return;

    const { rectangulo } = lectura.recorrido;
    expect(rectangulo.latNorte).toBeCloseTo(-31.49, 4);
    expect(rectangulo.latSur).toBeCloseTo(-31.5, 4);
    expect(rectangulo.lonEste).toBeCloseTo(-64.49, 4);
    expect(rectangulo.lonOeste).toBeCloseTo(-64.5, 4);
    expect(rectangulo.latNorte).toBeGreaterThan(rectangulo.latSur);
    expect(rectangulo.lonEste).toBeGreaterThan(rectangulo.lonOeste);
  });

  it("lee un KML de Google Earth y da los mismos números que el GPX", async () => {
    const delGpx = await leerArchivoDeRuta(archivo("ruta.gpx", GPX));
    const delKml = await leerArchivoDeRuta(archivo("ruta.kml", KML));

    expect(delKml.ok).toBe(true);
    if (!delKml.ok || !delGpx.ok) return;

    expect(delKml.recorrido.largoKm).toBeCloseTo(delGpx.recorrido.largoKm, 3);
    expect(delKml.recorrido.desnivelPositivoM).toBe(
      delGpx.recorrido.desnivelPositivoM,
    );
  });
});

describe("cuando el archivo no sirve, dice qué pasó y qué hacer", () => {
  it("rechaza un archivo que no es un recorrido", async () => {
    const lectura = await leerArchivoDeRuta(archivo("foto.jpg", "cualquier cosa"));

    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toContain(".gpx");
    expect(lectura.error).toContain("Google Earth");
  });

  it("avisa cuando el archivo está vacío", async () => {
    const lectura = await leerArchivoDeRuta(archivo("ruta.gpx", "   "));

    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toContain("vacío");
  });

  it("avisa cuando el archivo está dañado, en vez de guardar basura", async () => {
    const lectura = await leerArchivoDeRuta(
      archivo("ruta.gpx", "<gpx><trk>esto no cierra"),
    );

    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toContain("dañado");
  });

  it("avisa cuando el KML trae solo un marcador y ninguna línea", async () => {
    const lectura = await leerArchivoDeRuta(archivo("punto.kml", KML_SIN_LINEA));

    expect(lectura.ok).toBe(false);
    if (lectura.ok) return;
    expect(lectura.error).toContain("marcadores");
  });

  it("nunca lanza: siempre devuelve un resultado que la pantalla puede mostrar", async () => {
    const raros = ["", "<", "<?xml?>", "<gpx/>", "no soy xml", "<kml></kml>"];

    for (const contenido of raros) {
      const lectura = await leerArchivoDeRuta(archivo("ruta.gpx", contenido));
      expect(typeof lectura.ok).toBe("boolean");
      if (!lectura.ok) expect(lectura.error.length).toBeGreaterThan(10);
    }
  });

  it("reconoce la extensión sin importar mayúsculas", async () => {
    const lectura = await leerArchivoDeRuta(archivo("RUTA.GPX", GPX));
    expect(lectura.ok).toBe(true);
  });
});
