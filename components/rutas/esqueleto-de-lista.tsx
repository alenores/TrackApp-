import { Esqueleto } from "@/components/ui/esqueleto";
import { Tarjeta } from "@/components/ui/tarjeta";

type RutaListSkeletonProps = {
  titleWidth?: string;
  showFabSpacer?: boolean;
  count?: number;
};

function RutaCardSkeleton() {
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

export function EsqueletoDeListaDeRutas({
  titleWidth = "w-40",
  showFabSpacer = false,
  count = 3,
}: RutaListSkeletonProps) {
  return (
    <div className={`space-y-4 ${showFabSpacer ? "pb-16" : ""}`}>
      <div className="space-y-2">
        <Esqueleto className={`h-7 ${titleWidth}`} />
        <Esqueleto className="h-4 w-28" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <RutaCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
