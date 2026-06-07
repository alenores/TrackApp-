import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function RutaDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card accent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="col-span-2 h-12" />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <Skeleton className="h-72 rounded-none sm:h-96" />
      </Card>

      <Card className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}
