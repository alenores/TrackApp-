import { redirect } from "next/navigation";
import { Armazon } from "@/components/armazon/armazon";
import { nombreParaMostrar } from "@/lib/cuenta/nombre";
import { traerMiPerfil } from "@/lib/perfiles/datos";
import { traerUsuario } from "@/lib/cuenta/sesion";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await traerUsuario();

  if (!user) {
    redirect("/login");
  }

  const userAvatarUrl = (await traerMiPerfil())?.avatarUrl ?? null;

  return (
    <Armazon
      userName={nombreParaMostrar(user)}
      userEmail={user.email ?? ""}
      userAvatarUrl={userAvatarUrl}
    >
      {children}
    </Armazon>
  );
}
