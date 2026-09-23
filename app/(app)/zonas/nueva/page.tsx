import { Suspense } from "react";
import { FormularioDeNuevaZona } from "@/components/zonas/formulario-de-nueva-zona";

export default function NuevaZonaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
      <FormularioDeNuevaZona />
    </Suspense>
  );
}
