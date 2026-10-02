import { Tarjeta } from "@/components/ui/tarjeta";
import { Esqueleto } from "@/components/ui/esqueleto";

export function PerfilesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Esqueleto className="h-7 w-28" />
        <Esqueleto className="h-4 w-56" />
      </div>

      <Tarjeta tono="alta" className="space-y-4">
        <div className="flex items-start gap-4">
          <Esqueleto className="h-20 w-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Esqueleto className="h-5 w-32" />
            <Esqueleto className="h-10 w-full" />
            <Esqueleto className="h-4 w-48" />
          </div>
        </div>
        <Esqueleto className="h-12 w-full" />
      </Tarjeta>

      <section className="space-y-3">
        <Esqueleto className="h-4 w-36" />
        <ul className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <Tarjeta className="flex flex-col gap-4">
                <Esqueleto className="h-6 w-40" />
                <div className="flex justify-center pt-1">
                  <Esqueleto className="h-24 w-24 rounded-full" />
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SalidasSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Esqueleto className="h-7 w-28" />
        <Esqueleto className="h-10 w-32" />
      </div>
      {Array.from({ length: 2 }, (_, index) => (
        <Tarjeta key={index} className="space-y-3 overflow-hidden">
          <Esqueleto className="-mx-4 -mt-4 h-48 rounded-none" />
          <Esqueleto className="h-6 w-48" />
          <Esqueleto className="h-4 w-32" />
          <Esqueleto className="h-4 w-full" />
        </Tarjeta>
      ))}
    </div>
  );
}

export function NuevaSalidaSkeleton() {
  return (
    <div className="space-y-3">
      <Esqueleto className="h-10 w-48" />
      <Tarjeta className="space-y-4">
        <Esqueleto className="h-14 w-full" />
        <Esqueleto className="h-14 w-full" />
        <Esqueleto className="h-24 w-full" />
      </Tarjeta>
      <Tarjeta className="space-y-4">
        <Esqueleto className="h-32 w-full" />
      </Tarjeta>
    </div>
  );
}

export function PerfilSkeleton() {
  return <PerfilesSkeleton />;
}

export function NuevaRutaSkeleton() {
  return (
    <div className="space-y-4">
      <Tarjeta className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-7 w-36" />
            <Esqueleto className="h-4 w-full" />
          </div>
          <Esqueleto className="h-4 w-16" />
        </div>
        <Esqueleto className="h-12 w-full" />
        <Esqueleto className="h-24 w-full" />
        <Esqueleto className="h-12 w-full" />
      </Tarjeta>
      <Esqueleto className="h-12 w-full" />
    </div>
  );
}

export function EditarRutaSkeleton() {
  return (
    <div className="space-y-4">
      <Tarjeta tono="alta" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Esqueleto className="h-7 w-32" />
            <Esqueleto className="h-4 w-full" />
          </div>
          <Esqueleto className="h-4 w-16" />
        </div>
        <Esqueleto className="h-12 w-full" />
        <Esqueleto className="h-24 w-full" />
      </Tarjeta>
      <Esqueleto className="h-12 w-full" />
    </div>
  );
}

export function NavegacionSkeleton() {
  return (
    <Tarjeta className="overflow-hidden p-0">
      <Esqueleto className="h-[calc(100dvh-8rem)] min-h-72 rounded-none sm:min-h-96" />
    </Tarjeta>
  );
}
