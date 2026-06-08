"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { updateProfile } from "@/app/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card } from "@/components/ui/card";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5.5a1.4 1.4 0 0 0-2 0L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PerfilForm({
  initialNombre,
  displayNombre,
  email,
  avatarUrl,
}: PerfilFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(initialNombre || displayNombre);
  const [emailValue, setEmailValue] = useState(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setNombre(initialNombre || displayNombre);
    setEmailValue(email);
  }, [initialNombre, displayNombre, email]);

  const resetForm = () => {
    setNombre(initialNombre || displayNombre);
    setEmailValue(email);
    setError(null);
    setMessage(null);
  };

  const startEditing = () => {
    resetForm();
    setEditing(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await updateProfile({
      nombre,
      email: emailValue,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setEditing(false);
    setLoading(false);

    if (result.emailConfirmationRequired) {
      setMessage(
        "Perfil actualizado. Revisá tu email para confirmar el cambio de dirección.",
      );
    } else {
      setMessage("Perfil actualizado.");
    }

    router.refresh();
  };

  const viewNombre = initialNombre || displayNombre;

  return (
    <Card accent className="relative">
      <div className="mb-4 flex justify-center">
        <UserAvatar
          src={avatarUrl}
          name={viewNombre}
          size="lg"
        />
      </div>

      <div className="flex items-start justify-between gap-3 pr-1">
        <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>

        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            aria-label="Editar perfil"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500/70 transition-colors hover:bg-surface-elevated hover:text-slate-400"
          >
            <PencilIcon />
          </button>
        ) : null}
      </div>

      {editing ? (
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

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
            placeholder="tu@email.com"
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-1">
          <p className="text-lg font-semibold text-foreground">{viewNombre}</p>
          <p className="text-sm text-muted">{email || "—"}</p>
        </div>
      )}

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
