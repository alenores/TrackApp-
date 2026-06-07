import { RutaListSkeleton } from "@/components/rutas/ruta-list-skeleton";

export default function RutasLoading() {
  return (
    <RutaListSkeleton titleWidth="w-44" showFabSpacer count={4} />
  );
}
