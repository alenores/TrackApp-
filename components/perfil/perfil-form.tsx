"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateProfileName } from "@/app/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
};

export function PerfilForm({
  initialNombre,
  displayNombre,
  email,
}: PerfilFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialNombre || displayNombre);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await updateProfileName(nombre);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setMessage("Nombre actualizado.");
    setLoading(false);
    router.refresh();
  };

  return (
    <Card accent>
      <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-4 space-y-4"
      >
        <Input
          label="Nombre"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Tu nombre"
          error={error ?? undefined}
        />

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-300">Email</p>
          <p className="text-sm text-muted">{email || "—"}</p>
        </div>

        {message ? (
          <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
