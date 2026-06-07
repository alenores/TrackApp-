import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

type RutaListSkeletonProps = {
  titleWidth?: string;
  showFabSpacer?: boolean;
  count?: number;
};

function RutaCardSkeleton() {
  return (
    <Card className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="col-span-2 h-12" />
      </div>
    </Card>
  );
}

export function RutaListSkeleton({
  titleWidth = "w-40",
  showFabSpacer = false,
  count = 3,
}: RutaListSkeletonProps) {
  return (
    <div className={`space-y-4 ${showFabSpacer ? "pb-16" : ""}`}>
      <div className="space-y-2">
        <Skeleton className={`h-7 ${titleWidth}`} />
        <Skeleton className="h-4 w-28" />
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
