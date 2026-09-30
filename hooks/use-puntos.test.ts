// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePuntos } from "@/hooks/use-puntos";
import type { Anotacion } from "@/types/database";

const dobles = vi.hoisted(() => ({
  crear: vi.fn(), editar: vi.fn(), borrar: vi.fn(), actualizar: vi.fn(),
  senal: true, anotaciones: [] as Anotacion[],
  foto: { estado: "vacio", archivo: null as File | null, archivoChico: null as File | null, quitar: vi.fn() },
}));
vi.mock("@/app/actions/territorio", () => ({ crearAnotacion: dobles.crear, editarAnotacion: dobles.editar, borrarAnotacion: dobles.borrar }));
vi.mock("@/hooks/use-datos-de-la-app", () => ({ useDatosDeLaApp: () => ({ paquete: { anotaciones: dobles.anotaciones }, estado: "listo", aviso: null }) }));
vi.mock("@/hooks/use-hay-senal", () => ({ useHaySenal: () => dobles.senal }));
vi.mock("@/hooks/use-foto", () => ({ useFoto: () => dobles.foto }));
vi.mock("@/lib/offline/puesta-al-dia", () => ({ ponerAlDiaDespuesDeGuardar: dobles.actualizar }));
vi.mock("@/components/fotos/recorte-de-foto", () => ({ FORMAS_DE_RECORTE: { anotacion: "libre" } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let raiz: Root;
let contenedor: HTMLDivElement;
let puntos: ReturnType<typeof usePuntos>;
function Prueba() { const actuales = usePuntos(); useEffect(() => { puntos = actuales; }); return null; }
const COORDENADA = `31°16'31.0"S 64°19'13.3"W`;

beforeEach(async () => {
  vi.clearAllMocks();
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
  await act(async () => raiz.render(createElement(Prueba)));
});
afterEach(() => { act(() => raiz.unmount()); contenedor.remove(); });

async function completar() {
  await act(async () => { puntos.setCoordenada(COORDENADA); puntos.setComentario("Cruce del arroyo"); puntos.setIcono("arroyo"); });
}

describe("cargar puntos pegando coordenadas", () => {
  it("muestra el lugar correcto y guarda sin sector; vacía todo para el siguiente", async () => {
    await completar();
    const previa = puntos.enElMapa[0];
    expect(previa.geometria.coordinates[0]).toBeCloseTo(-64.32036, 5);
    expect(previa.geometria.coordinates[1]).toBeCloseTo(-31.27528, 5);
    await act(async () => puntos.guardar());
    expect(dobles.crear).toHaveBeenCalledWith(expect.objectContaining({ sectorId: null, tipo: "punto", icono: "arroyo", comentario: "Cruce del arroyo" }));
    expect(puntos.coordenada).toBe("");
    expect(puntos.comentario).toBe("");
    expect(puntos.seleccionado).toBeNull();
    expect(dobles.foto.quitar).toHaveBeenCalled();
    expect(puntos.mensaje).toContain("Punto guardado");
  });
  it("no guarda una coordenada inválida ni mientras la foto se prepara", async () => {
    await act(async () => puntos.setCoordenada("esto no es una coordenada"));
    await act(async () => puntos.guardar());
    expect(dobles.crear).not.toHaveBeenCalled();
    await completar();
    dobles.foto.estado = "preparando";
    await act(async () => puntos.guardar());
    expect(dobles.crear).not.toHaveBeenCalled();
  });
  it("dos toques seguidos guardan una sola vez", async () => {
    await completar();
    await act(async () => { await Promise.all([puntos.guardar(), puntos.guardar()]); });
    expect(dobles.crear).toHaveBeenCalledTimes(1);
  });
  it("conserva el formulario y muestra el motivo si guardar falla", async () => {
    await completar();
    dobles.crear.mockRejectedValueOnce(new Error("La conexión venció"));
    await act(async () => puntos.guardar());
    expect(puntos.error).toContain("La conexión venció");
    expect(puntos.coordenada).toBe(COORDENADA);
    expect(puntos.guardando).toBe(false);
    expect(puntos.mensaje).toBeNull();
  });
  it("si falla la foto, reintenta sobre el punto ya creado sin duplicarlo", async () => {
    await completar();
    dobles.foto.estado = "lista";
    dobles.foto.archivo = new File(["grande"], "lugar.webp", { type: "image/webp" });
    dobles.foto.archivoChico = new File(["chica"], "chica.webp", { type: "image/webp" });
    dobles.editar.mockResolvedValueOnce({ ok: false, error: "Se cortó la subida" });
    await act(async () => puntos.guardar());
    expect(puntos.error).toContain("El punto quedó guardado, pero la foto no");
    expect(puntos.seleccionado?.id).toBe(27);
    expect(puntos.coordenada).toBe(COORDENADA);
    await act(async () => puntos.guardar());
    expect(dobles.crear).toHaveBeenCalledTimes(1);
    expect(dobles.editar).toHaveBeenCalledTimes(2);
    expect(dobles.editar).toHaveBeenLastCalledWith(27, expect.objectContaining({ foto: dobles.foto.archivo, fotoChica: dobles.foto.archivoChico }));
    expect(puntos.coordenada).toBe("");
  });
  it("si falla la actualización, aclara que el punto sí quedó guardado", async () => {
    await completar();
    dobles.actualizar.mockResolvedValueOnce({ clase: "fallo", motivo: "La lista llegó cortada" });
    await act(async () => puntos.guardar());
    expect(puntos.error).toContain("El cambio quedó guardado");
    expect(puntos.error).toContain("La lista llegó cortada");
    expect(puntos.coordenada).toBe("");
  });
  it("sin señal no intenta guardar", async () => {
    dobles.senal = false;
    await completar();
    await act(async () => puntos.guardar());
    expect(dobles.crear).not.toHaveBeenCalled();
  });
  it("abre un punto del mapa, permite moverlo y conserva su sector al editar", async () => {
    await completar();
    dobles.anotaciones = [{ ...puntos.enElMapa[0], id: 12, sectorId: 5, fotoUrl: "https://ejemplo.test/lugar.webp" }];
    await act(async () => raiz.render(createElement(Prueba)));
    await act(async () => puntos.abrir(12));
    expect(puntos.seleccionado?.fotoUrl).toContain("lugar.webp");
    await act(async () => puntos.setCoordenada("-32, -65"));
    await act(async () => puntos.guardar());
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).toHaveBeenCalledWith(12, expect.objectContaining({ sectorId: 5, geometria: { type: "Point", coordinates: [-65, -32] } }));
  });
  it("un borrado fallido conserva el punto y muestra el motivo", async () => {
    await completar();
    dobles.anotaciones = [{ ...puntos.enElMapa[0], id: 12 }];
    await act(async () => raiz.render(createElement(Prueba)));
    await act(async () => puntos.abrir(12));
    dobles.borrar.mockResolvedValueOnce({ ok: false, error: "No tenés permiso" });
    await act(async () => puntos.borrar());
    expect(puntos.seleccionado?.id).toBe(12);
    expect(puntos.error).toBe("No tenés permiso");
    await act(async () => puntos.borrar());
    expect(puntos.seleccionado).toBeNull();
    expect(puntos.mensaje).toBe("Punto borrado.");
  });
});

