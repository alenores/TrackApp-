import { Esqueleto } from "@/components/ui/esqueleto";
import { Tarjeta } from "@/components/ui/tarjeta";

type PropiedadesDelEsqueleto = {
  titleWidth?: string;
  showFabSpacer?: boolean;
  count?: number;
};

function EsqueletoDeTarjeta() {
  return (
    <Tarjeta className="space-y-3">
      <div className="space-y-2">
        <Esqueleto className="h-6 w-3/4" />
        <Esqueleto className="h-4 w-full" />
        <Esqueleto className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Esqueleto className="h-12" />
        <Esqueleto className="h-12" />
        <Esqueleto className="col-span-2 h-12" />
      </div>
    </Tarjeta>
  );
}

/** Lo que se ve mientras abre una lista: tarjetas grises con la forma de las de verdad. */
export function EsqueletoDeLista({
  titleWidth = "w-40",
  showFabSpacer = false,
  count = 3,
}: PropiedadesDelEsqueleto) {
  return (
    <div className={`space-y-4 ${showFabSpacer ? "pb-16" : ""}`}>
      <div className="space-y-2">
        <Esqueleto className={`h-7 ${titleWidth}`} />
        <Esqueleto className="h-4 w-28" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <EsqueletoDeTarjeta />
          </li>
        ))}
      </ul>
    </div>
  );
}
