import { Esqueleto } from "@/components/ui/esqueleto";
import { Tarjeta } from "@/components/ui/tarjeta";

export function EsqueletoDeFichaDeRuta() {
  return (
    <div className="space-y-4">
      <Tarjeta tono="alta" className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-7 w-4/5" />
            <Esqueleto className="h-4 w-full" />
            <Esqueleto className="h-4 w-2/3" />
          </div>
          <Esqueleto className="h-4 w-16" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Esqueleto className="h-12" />
          <Esqueleto className="h-12" />
          <Esqueleto className="col-span-2 h-12" />
        </div>
      </Tarjeta>

      <Tarjeta className="overflow-hidden p-0">
        <Esqueleto className="h-72 rounded-none sm:h-96" />
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <Esqueleto className="h-12 w-full" />
        <Esqueleto className="h-12 w-full" />
      </Tarjeta>
    </div>
  );
}
