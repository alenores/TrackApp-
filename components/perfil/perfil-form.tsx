"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { updateProfile } from "@/app/actions/update-profile";
import { Button } from "@/components/ui/button";
import { CIRCLE_ICON_SURFACE_CLASS } from "@/components/ui/chevron-circle";
import { CloseCircle } from "@/components/ui/close-circle";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card } from "@/components/ui/card";
import { triggerTapHaptic } from "@/lib/haptics";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
};

const PROFILE_FIELD_CLASS =
  "border-slate-500/35 bg-slate-800/40 text-slate-200 placeholder:text-slate-500/80";

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

function CircleIconButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const handlePointerDown = () => {
    triggerTapHaptic();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      className={[TAP_FEEDBACK_CLASS, "mt-0.5 shrink-0"].join(" ")}
    >
      {children}
    </button>
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

  const cancelEditing = () => {
    resetForm();
    setEditing(false);
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
    <Card accent className="relative flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Tu cuenta</h2>

        {editing ? (
          <CircleIconButton ariaLabel="Cerrar edición" onClick={cancelEditing}>
            <CloseCircle />
          </CircleIconButton>
        ) : (
          <CircleIconButton ariaLabel="Editar perfil" onClick={startEditing}>
            <span className={CIRCLE_ICON_SURFACE_CLASS}>
              <PencilIcon />
            </span>
          </CircleIconButton>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <div className="flex justify-center pt-1">
            <UserAvatar src={avatarUrl} name={viewNombre} size="lg" />
          </div>

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
            className={PROFILE_FIELD_CLASS}
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
            className={PROFILE_FIELD_CLASS}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">{viewNombre}</p>
            <p className="text-sm text-muted">{email || "—"}</p>
          </div>

          <div className="flex justify-center pt-1">
            <UserAvatar src={avatarUrl} name={viewNombre} size="lg" />
          </div>
        </>
      )}

      {message ? (
        <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
