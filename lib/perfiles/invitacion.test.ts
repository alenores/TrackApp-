import { describe, expect, it } from "vitest";
import { linkDeWhatsApp, textoDeInvitacion } from "./invitacion";

describe("invitación a TrackApp", () => {
  it("el texto lleva el link de la app", () => {
    expect(textoDeInvitacion("https://trackapp.test")).toContain(
      "https://trackapp.test",
    );
  });

  it("el link de WhatsApp lleva el texto completo y se puede decodificar", () => {
    const link = linkDeWhatsApp("https://trackapp.test/?a=1&b=2");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    const texto = decodeURIComponent(link.slice("https://wa.me/?text=".length));
    expect(texto).toBe(textoDeInvitacion("https://trackapp.test/?a=1&b=2"));
  });
});
