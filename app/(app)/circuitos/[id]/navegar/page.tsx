import { NavegacionDeCircuito } from "@/components/circuitos/navegacion-de-circuito";

export default async function NavegarCircuitoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NavegacionDeCircuito circuitoId={Number(id)} />;
}
