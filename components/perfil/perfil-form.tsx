"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { updateProfile } from "@/app/actions/update-profile";
import { Button } from "@/components/ui/button";
import { CIRCLE_ICON_SURFACE_CLASS } from "@/components/ui/chevron-circle";
import { CloseCircle } from "@/components/ui/close-circle";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card } from "@/components/ui/card";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
};

const PROFILE_FIELD_CLASS =
  "border-borde bg-superficie text-texto placeholder:text-texto-suave";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

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
    vibrarAlTocar();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      className={[CLASE_DE_RESPUESTA_AL_TOQUE, "mt-0.5 shrink-0"].join(" ")}
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(initialNombre || displayNombre);
  const [emailValue, setEmailValue] = useState(email);
  const [loQueLlego, setLoQueLlego] = useState({ initialNombre, displayNombre, email });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Cuando el servidor manda datos nuevos, los campos se ponen al día. Va
  // durante el dibujado: en un efecto se vería un instante el dato viejo.
  if (
    loQueLlego.initialNombre !== initialNombre ||
    loQueLlego.displayNombre !== displayNombre ||
    loQueLlego.email !== email
  ) {
    setLoQueLlego({ initialNombre, displayNombre, email });
    setNombre(initialNombre || displayNombre);
    setEmailValue(email);
  }

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const clearAvatarSelection = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setNombre(initialNombre || displayNombre);
    setEmailValue(email);
    clearAvatarSelection();
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
      avatarFile,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    clearAvatarSelection();
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
  const editingAvatarSrc = avatarPreviewUrl ?? avatarUrl;

  const handleAvatarPick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  return (
    <Card className="relative flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-texto">Tu cuenta</h2>

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
          <div className="flex flex-col items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleAvatarPick}
              onPointerDown={() => vibrarAlTocar()}
              className={[
                CLASE_DE_RESPUESTA_AL_TOQUE,
                "group relative rounded-full",
              ].join(" ")}
              aria-label="Cambiar foto de perfil"
            >
              <UserAvatar
                src={editingAvatarSrc}
                name={viewNombre}
                size="lg"
                className="ring-2 ring-acento-borde ring-offset-2 ring-offset-superficie transition-[box-shadow] group-active:ring-acento-borde"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-acento-borde bg-acento text-acento-texto shadow-md">
                <CameraIcon />
              </span>
            </button>
            <p className="text-center text-sm font-semibold text-verde-texto">
              Cambiar foto
            </p>
            <p className="max-w-[16rem] text-center text-xs leading-5 text-texto-suave">
              Galería o cámara del celular
            </p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="sr-only"
              onChange={handleAvatarChange}
            />
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

          <Button type="submit" anchoCompleto disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </Button>
        </form>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-texto">{viewNombre}</p>
            <p className="text-sm text-texto-suave">{email || "—"}</p>
          </div>

          <div className="flex justify-center pt-1">
            <UserAvatar src={avatarUrl} name={viewNombre} size="lg" />
          </div>
        </>
      )}

      {message ? (
        <p className="rounded-lg border border-verde-borde bg-verde-fondo px-3 py-2 text-sm text-verde-texto">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
