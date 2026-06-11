import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PerfilesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Card tone="light" className="space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </Card>

      <section className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <ul className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <Card className="flex flex-col gap-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex justify-center pt-1">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function PerfilSkeleton() {
  return <PerfilesSkeleton />;
}

export function NuevaRutaSkeleton() {
  return (
    <div className="space-y-4">
      <Card accent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function EditarRutaSkeleton() {
  return (
    <div className="space-y-4">
      <Card tone="light" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function NavegacionSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="h-[calc(100dvh-8rem)] min-h-72 rounded-none sm:min-h-96" />
    </Card>
  );
}
