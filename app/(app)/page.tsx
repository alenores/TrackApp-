import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";
import { CartelDeInstalar } from "@/components/armazon/cartel-de-instalar";
import { InicioDeSalidas } from "@/components/salidas/inicio-de-salidas";

/** La entrada queda guardada para abrir también sin señal. */
export default function HomePage() {
  return <>
    <MarcaDeAppLista />
    <CartelDeInstalar />
    <InicioDeSalidas />
  </>;
}
