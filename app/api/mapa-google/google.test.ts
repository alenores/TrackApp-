import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const autenticacion = vi.hoisted(() => ({ claims: false }));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteEnElServidor: async () => ({
    auth: { getClaims: async () => ({ data: { claims: autenticacion.claims ? { sub: "prueba" } : null }, error: null }) },
  }),
}));

import { sesionValida } from "@/lib/mapas/google-servidor";
import {
  CABECERA_DE_EDAD_DE_GOOGLE,
  CABECERA_DE_FECHA_DE_GOOGLE,
  CABECERA_DE_GUARDADO_DE_GOOGLE,
  CABECERA_DE_VENCIMIENTO_DE_GOOGLE,
} from "@/lib/mapas/google-vigencia";
import { POST as abrirSesion } from "@/app/api/mapa-google/sesion/route";
import { GET as traerTesela } from "@/app/api/mapa-google/tesela/[z]/[x]/[y]/route";
import { GET as traerAtribucion } from "@/app/api/mapa-google/atribucion/route";

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

  it("entrega la imagen solo al usuario registrado y prohíbe guardarla en caché HTTP", async () => {
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

  it("pasa la vigencia de Google solo en cabeceras privadas", async () => {
    autenticacion.claims = true;
    const vigencia = "private, max-age=600, must-revalidate";
    const fecha = "Wed, 18 Nov 2026 12:00:00 GMT";
    const vencimiento = "Wed, 18 Nov 2026 12:10:00 GMT";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: {
        "content-type": "image/png",
        "cache-control": vigencia,
        age: "90",
        date: fecha,
        expires: vencimiento,
        etag: "solo_de_google",
        location: "https://tile.googleapis.com/?key=clave_de_prueba",
        "set-cookie": "sesion_google=solo_de_google",
      },
    })));

    const respuesta = await traerTesela(
      new Request(`https://track.app/api/mapa-google/tesela/12/1300/2420?sesion=${SESION}`), PARAMETROS,
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(respuesta.headers.get(CABECERA_DE_GUARDADO_DE_GOOGLE)).toBe(vigencia);
    expect(respuesta.headers.get(CABECERA_DE_EDAD_DE_GOOGLE)).toBe("90");
    expect(respuesta.headers.get(CABECERA_DE_FECHA_DE_GOOGLE)).toBe(fecha);
    expect(respuesta.headers.get(CABECERA_DE_VENCIMIENTO_DE_GOOGLE)).toBe(vencimiento);
    for (const ajena of ["age", "expires", "etag", "location", "set-cookie"]) {
      expect(respuesta.headers.has(ajena)).toBe(false);
    }
    expect(new Uint8Array(await respuesta.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("no inventa metadatos cuando Google no los informa", async () => {
    autenticacion.claims = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([1]), {
      headers: { "content-type": "image/png" },
    })));

    const respuesta = await traerTesela(
      new Request(`https://track.app/api/mapa-google/tesela/12/1300/2420?sesion=${SESION}`), PARAMETROS,
    );

    expect(respuesta.headers.get(CABECERA_DE_GUARDADO_DE_GOOGLE)).toBe("");
    expect(respuesta.headers.has(CABECERA_DE_EDAD_DE_GOOGLE)).toBe(false);
    expect(respuesta.headers.has(CABECERA_DE_FECHA_DE_GOOGLE)).toBe(false);
    expect(respuesta.headers.has(CABECERA_DE_VENCIMIENTO_DE_GOOGLE)).toBe(false);
    expect(respuesta.headers.get("cache-control")).toContain("no-store");
  });

  it("pide los créditos con el nombre de sesión que exige Google", async () => {
    autenticacion.claims = true;
    const pedir = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      copyright: "© Google",
      maxZoomRects: [{ maxZoom: 18, north: -29, south: -35, east: -60, west: -67 }],
    }), {
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", pedir);
    const respuesta = await traerAtribucion(new Request(
      `https://track.app/api/mapa-google/atribucion?sesion=${SESION}&north=-29&south=-35&east=-60&west=-67&zoom=6`,
    ));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      derechos: "© Google",
      areasConDetalle: [{ maxZoom: 18, north: -29, south: -35, east: -60, west: -67 }],
    });
    const direccionDeGoogle = new URL(pedir.mock.calls[0][0]);
    expect(direccionDeGoogle.searchParams.get("session")).toBe(SESION);
    expect(direccionDeGoogle.searchParams.has("sesion")).toBe(false);
  });

  it("informa la ausencia de créditos para que el mapa busque un nivel anterior", async () => {
    autenticacion.claims = true;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      maxZoomRects: [{ maxZoom: 17, north: -29, south: -35, east: -60, west: -67 }],
    }))));
    const respuesta = await traerAtribucion(new Request(
      `https://track.app/api/mapa-google/atribucion?sesion=${SESION}&north=-29&south=-35&east=-60&west=-67&zoom=18`,
    ));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      derechos: null,
      areasConDetalle: [{ maxZoom: 17, north: -29, south: -35, east: -60, west: -67 }],
    });
  });

  it("acepta solo el formato esperado de una sesión", () => {
    expect(sesionValida(SESION)).toBe(true);
    expect(sesionValida("../../otra-ruta")).toBe(false);
    expect(sesionValida(null)).toBe(false);
  });
});
