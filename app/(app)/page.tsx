import { getUserDisplayName } from "@/lib/auth/profile";
import { getAuthUser } from "@/lib/auth/session";
import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { InstallAppBanner } from "@/components/layout/install-app-banner";
import { RutasClient } from "@/components/rutas/rutas-client";

export default async function HomePage() {
  const user = await getAuthUser();

  return (
    <>
      <AppReadyMarker />
      <InstallAppBanner />
      <RutasClient
        currentUserId={user?.id ?? null}
        currentUserName={getUserDisplayName(user)}
      />
    </>
  );
}
