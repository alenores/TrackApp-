// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnotaciones, type LugarDeAnotaciones } from "@/hooks/use-anotaciones";
import type { Anotacion, Sector } from "@/types/database";

const dobles = vi.hoisted(() => ({
  crear: vi.fn(), editar: vi.fn(), borrar: vi.fn(), actualizar: vi.fn(),
  senal: true, anotaciones: [] as Anotacion[],
  foto: { estado: "vacio", archivo: null as File | null, archivoChico: null as File | null, quitar: vi.fn() },
}));
vi.mock("@/app/actions/territorio", () => ({ crearAnotacion: dobles.crear, editarAnotacion: dobles.editar, borrarAnotacion: dobles.borrar }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({ useDatosDeLaApp: () => ({ paquete: { anotaciones: dobles.anotaciones, zonas: [], sectores: [] }, estado: "listo", aviso: null }) }));
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => dobles.senal }));
vi.mock("@/hooks/use-foto", () => ({ useFoto: () => dobles.foto }));
vi.mock("@/lib/offline/puesta-al-dia", () => ({ ponerAlDiaDespuesDeGuardar: dobles.actualizar }));
vi.mock("@/components/fotos/recorte-de-foto", () => ({ FORMAS_DE_RECORTE: { anotacion: "libre" } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let raiz: Root;
let contenedor: HTMLDivElement;
let anotar: ReturnType<typeof useAnotaciones>;
let lugar: LugarDeAnotaciones = { clase: "cordoba" };
function Prueba() { const actuales = useAnotaciones(lugar); useEffect(() => { anotar = actuales; }); return null; }
const COORDENADA = `31°16'31.0"S 64°19'13.3"W`;
const SECTOR = { id: 9, zonaId: 5, nombre: "A1", rectangulo: { latNorte: -31, latSur: -32, lonEste: -64, lonOeste: -65 } } as Sector;

async function montar() {
  await act(async () => raiz.render(createElement(Prueba)));
}

beforeEach(async () => {
  vi.clearAllMocks();
  lugar = { clase: "cordoba" };
  dobles.senal = true;
  dobles.anotaciones = [];
  dobles.foto.estado = "vacio";
  dobles.foto.archivo = null;
  dobles.foto.archivoChico = null;
  dobles.crear.mockResolvedValue({ ok: true, datos: { anotacionId: 27 } });
  dobles.editar.mockResolvedValue({ ok: true });
  dobles.borrar.mockResolvedValue({ ok: true });
  dobles.actualizar.mockResolvedValue({ clase: "al_dia" });
  contenedor = document.createElement("div");
  document.body.append(contenedor);
  raiz = createRoot(contenedor);
  await montar();
});
afterEach(() => { act(() => raiz.unmount()); contenedor.remove(); });

async function completarUnPunto() {
  await act(async () => anotar.empezarUnPunto());
  await act(async () => { anotar.setCoordenada(COORDENADA); anotar.setComentario("Cruce del arroyo"); anotar.setIcono("arroyo"); });
}

describe("marcar puntos", () => {
  it("pegando la coordenada: muestra el lugar correcto, guarda sin sector y deja todo listo para el siguiente", async () => {
    await completarUnPunto();
    const previa = anotar.enElMapa[0];
    expect(previa.geometria.coordinates[0]).toBeCloseTo(-64.32036, 5);
    expect(previa.geometria.coordinates[1]).toBeCloseTo(-31.27528, 5);
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).toHaveBeenCalledWith(expect.objectContaining({ sectorId: null, tipo: "punto", icono: "arroyo", comentario: "Cruce del arroyo" }));
    expect(anotar.coordenada).toBe("");
    expect(anotar.comentario).toBe("");
    expect(anotar.seleccionado).toBeNull();
    expect(anotar.borrador).toBeNull();
    expect(dobles.foto.quitar).toHaveBeenCalled();
    expect(anotar.mensaje).toContain("Punto guardado");
  });

  it("tocando el mapa: escribe la coordenada del toque y deja de marcar", async () => {
    await act(async () => anotar.empezarUnPunto());
    expect(anotar.marcando).toBe(true);
    await act(async () => anotar.alTocarElMapa(-64.5, -31.5));
    expect(anotar.coordenada).toBe("-31.500000, -64.500000");
    expect(anotar.marcando).toBe(false);
    expect(anotar.puedeGuardar).toBe(true);
  });

  it("en un sector, lo nuevo queda anotado a ese sector", async () => {
    lugar = { clase: "sector", sector: SECTOR };
    await montar();
    await completarUnPunto();
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).toHaveBeenCalledWith(expect.objectContaining({ sectorId: SECTOR.id }));
  });

  it("no guarda una coordenada inválida ni mientras la foto se prepara", async () => {
    await act(async () => anotar.empezarUnPunto());
    await act(async () => anotar.setCoordenada("esto no es una coordenada"));
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).not.toHaveBeenCalled();
    await completarUnPunto();
    dobles.foto.estado = "preparando";
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).not.toHaveBeenCalled();
  });

  it("dos toques seguidos guardan una sola vez", async () => {
    await completarUnPunto();
    await act(async () => { await Promise.all([anotar.guardar(), anotar.guardar()]); });
    expect(dobles.crear).toHaveBeenCalledTimes(1);
  });

  it("conserva el formulario y muestra el motivo si guardar falla", async () => {
    await completarUnPunto();
    dobles.crear.mockRejectedValueOnce(new Error("La conexión venció"));
    await act(async () => { await anotar.guardar(); });
    expect(anotar.error).toContain("La conexión venció");
    expect(anotar.coordenada).toBe(COORDENADA);
    expect(anotar.guardando).toBe(false);
    expect(anotar.mensaje).toBeNull();
  });

  it("si falla la foto, reintenta sobre el punto ya creado sin duplicarlo", async () => {
    await completarUnPunto();
    dobles.foto.estado = "lista";
    dobles.foto.archivo = new File(["grande"], "lugar.webp", { type: "image/webp" });
    dobles.foto.archivoChico = new File(["chica"], "chica.webp", { type: "image/webp" });
    dobles.editar.mockResolvedValueOnce({ ok: false, error: "Se cortó la subida" });
    await act(async () => { await anotar.guardar(); });
    expect(anotar.error).toContain("El punto quedó guardado, pero la foto no");
    expect(anotar.seleccionado?.id).toBe(27);
    expect(anotar.coordenada).toBe(COORDENADA);
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).toHaveBeenCalledTimes(1);
    expect(dobles.editar).toHaveBeenCalledTimes(2);
    expect(dobles.editar).toHaveBeenLastCalledWith(27, expect.objectContaining({ foto: dobles.foto.archivo, fotoChica: dobles.foto.archivoChico }));
    expect(anotar.coordenada).toBe("");
  });

  it("si falla la actualización, aclara que el punto sí quedó guardado", async () => {
    await completarUnPunto();
    dobles.actualizar.mockResolvedValueOnce({ clase: "fallo", motivo: "La lista llegó cortada" });
    await act(async () => { await anotar.guardar(); });
    expect(anotar.error).toContain("El cambio quedó guardado");
    expect(anotar.error).toContain("La lista llegó cortada");
    expect(anotar.coordenada).toBe("");
  });

  it("sin señal no intenta guardar", async () => {
    dobles.senal = false;
    await montar();
    await completarUnPunto();
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).not.toHaveBeenCalled();
  });

  it("abre un punto del mapa, permite moverlo y conserva su sector al editar", async () => {
    await completarUnPunto();
    dobles.anotaciones = [{ ...anotar.enElMapa[0], id: 12, sectorId: 5, fotoUrl: "https://ejemplo.test/lugar.webp" }];
    await montar();
    await act(async () => anotar.abrir(12));
    expect(anotar.seleccionado?.fotoUrl).toContain("lugar.webp");
    await act(async () => anotar.setCoordenada("-32, -65"));
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).toHaveBeenCalledWith(12, expect.objectContaining({ sectorId: 5, geometria: { type: "Point", coordinates: [-65, -32] } }));
  });

  it("un borrado fallido conserva el punto y muestra el motivo", async () => {
    await completarUnPunto();
    dobles.anotaciones = [{ ...anotar.enElMapa[0], id: 12 }];
    await montar();
    await act(async () => anotar.abrir(12));
    dobles.borrar.mockResolvedValueOnce({ ok: false, error: "No tenés permiso" });
    await act(async () => { await anotar.borrar(); });
    expect(anotar.seleccionado?.id).toBe(12);
    expect(anotar.error).toBe("No tenés permiso");
    await act(async () => { await anotar.borrar(); });
    expect(anotar.seleccionado).toBeNull();
    expect(anotar.mensaje).toBe("Punto borrado.");
  });
});

describe("dibujar trazos", () => {
  it("se dibuja de a toques, se deshace el último y recién con dos puntos se puede guardar", async () => {
    await act(async () => anotar.empezarUnTrazo());
    await act(async () => anotar.alTocarElMapa(-64.6, -31.6));
    expect(anotar.puedeGuardar).toBe(false);
    await act(async () => anotar.alTocarElMapa(-64.5, -31.5));
    await act(async () => anotar.alTocarElMapa(-64.4, -31.4));
    await act(async () => anotar.deshacerElUltimoPunto());
    expect(anotar.puedeGuardar).toBe(true);
    await act(async () => { await anotar.guardar(); });
    expect(dobles.crear).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "trazo",
      icono: null,
      sectorId: null,
      geometria: { type: "LineString", coordinates: [[-64.6, -31.6], [-64.5, -31.5]] },
    }));
    expect(anotar.mensaje).toBe("Trazo guardado.");
  });

  it("abre un trazo guardado con su línea y permite volver a dibujarlo", async () => {
    dobles.anotaciones = [{
      id: 40, sectorId: 9, perfilId: "p", deAdministrador: true, tipo: "trazo", origen: "manual",
      icono: null, color: "#f59e0b", comentario: "Huella", fotoUrl: null, fotoChicaUrl: null,
      geometria: { type: "LineString", coordinates: [[-64.6, -31.6], [-64.5, -31.5]] },
      marcadaEn: "", precisionGpsMetros: null, creadoEn: "", actualizadoEn: "",
    }];
    await montar();
    await act(async () => anotar.abrir(40));
    expect(anotar.borrador).toMatchObject({ tipo: "trazo", puntos: [[-64.6, -31.6], [-64.5, -31.5]] });
    await act(async () => anotar.volverADibujar());
    expect(anotar.borrador).toMatchObject({ tipo: "trazo", puntos: [] });
    expect(anotar.marcando).toBe(true);
  });
});
