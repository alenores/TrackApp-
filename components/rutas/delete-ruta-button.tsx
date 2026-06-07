"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGpxStoragePath } from "@/lib/gpx";
import { Button } from "@/components/ui/button";

const GPX_BUCKET = "gpx-files";

type DeleteRutaButtonProps = {
  rutaId: string;
  userId: string;
};

export function DeleteRutaButton({ rutaId, userId }: DeleteRutaButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Eliminar esta ruta? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const storagePath = getGpxStoragePath(userId, rutaId);

    await supabase.storage.from(GPX_BUCKET).remove([storagePath]);

    const { error: deleteError } = await supabase
      .from("rutas")
      .delete()
      .eq("id", rutaId)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="danger"
        fullWidth
        disabled={deleting}
        onClick={() => void handleDelete()}
      >
        {deleting ? "Eliminando…" : "Eliminar ruta"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
