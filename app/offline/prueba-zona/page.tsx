"use client";
import { ZonaDetalle } from "@/components/zonas/zona-detalle";

export default function PruebaZona() {
  return (
    <div className="mx-auto w-full max-w-[1700px] p-4">
      <ZonaDetalle zonaId={1} miPerfilId="ale" />
    </div>
  );
}
