import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const autenticacion = vi.hoisted(() => ({ claims: false }));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteEnElServidor: async () => ({
    auth: { getClaims: async () => ({ data: { claims: autenticacion.claims ? { sub: "prueba" } : null }, error: null }) },
  }),
}));

import { sesionValida } from "@/lib/mapas/google-servidor";
import { POST as abrirSesion } from "@/app/api/mapa-google/sesion/route";
import { GET as traerTesela } from "@/app/api/mapa-google/tesela/[z]/[x]/[y]/route";

const PARAMETROS = { params: Promise.resolve({ z: "12", x: "1300", y: "2420" }) };
const SESION = "sesion_de_google_para_la_prueba";

describe("el puente del mapa Google", () => {
  beforeEach(() => {
    autenticacion.claims = false;
    vi.stubEnv("GOOGLE_MAP_TILES_API_KEY", "clave_de_prueba");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rechaza pedidos sin cuenta iniciada antes de llamar a Google", async () => {
    const pedir = vi.fn();
    vi.stubGlobal("fetch", pedir);
    expect((await abrirSesion()).status).toBe(401);
    expect((await traerTesela(new Request(`https://track.app/api/mapa-google/tesela/12/1300/2420?sesion=${SESION}`), PARAMETROS)).status).toBe(401);
    expect(pedir).not.toHaveBeenCalled();
  });

  it("no pide imágenes sin clave ni con coordenadas fuera de la grilla", async () => {
    autenticacion.claims = true;
    const pedir = vi.fn();
    vi.stubGlobal("fetch", pedir);
    vi.stubEnv("GOOGLE_MAP_TILES_API_KEY", "");
    const sinClave = await abrirSesion();
    expect(sinClave.status).toBe(200);
    expect(await sinClave.json()).toEqual({ disponible: false });
    vi.stubEnv("GOOGLE_MAP_TILES_API_KEY", "clave_de_prueba");
    const respuesta = await traerTesela(
      new Request(`https://track.app/api/mapa-google/tesela/12/1300/2420?sesion=${SESION}`),
      { params: Promise.resolve({ z: "12", x: "9999", y: "2420" }) },
    );
    expect(respuesta.status).toBe(400);
    expect(pedir).not.toHaveBeenCalled();
  });

  it("entrega la imagen solo al usuario registrado y prohíbe guardarla", async () => {
    autenticacion.claims = true;
    const pedir = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-type": "image/png" },
    }));
    vi.stubGlobal("fetch", pedir);
    const respuesta = await traerTesela(
      new Request(`https://track.app/api/mapa-google/tesela/12/1300/2420?sesion=${SESION}`), PARAMETROS,
    );
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("cache-control")).toContain("no-store");
    expect(pedir).toHaveBeenCalledOnce();
    expect(pedir.mock.calls[0][1].cache).toBe("no-store");
  });

  it("acepta solo el formato esperado de una sesión", () => {
    expect(sesionValida(SESION)).toBe(true);
    expect(sesionValida("../../otra-ruta")).toBe(false);
    expect(sesionValida(null)).toBe(false);
  });
});
