"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";
import { editarPerfil } from "@/app/actions/perfil";
import { Boton } from "@/components/ui/boton";
import { CLASE_DEL_CIRCULO } from "@/components/ui/flecha-redonda";
import { CruzRedonda } from "@/components/ui/cruz-redonda";
import { Campo } from "@/components/ui/campo";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { PortadaDePerfil } from "@/components/perfil/portada-de-perfil";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
  portadaUrl?: string | null;
  /** Lo que practica. */
  actividades: ActividadRuta[];
};

const OPCIONES_DE_ACTIVIDAD: Opcion<ActividadRuta>[] = ACTIVIDADES_RUTA.map((tipo) => {
  const actividad = mostrarActividad(tipo);
  return { valor: tipo, etiqueta: actividad.etiqueta, trazo: actividad.trazo };
});

const PROFILE_FIELD_CLASS =
  "border-borde bg-superficie text-texto placeholder:text-texto-suave/50";


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

export function FormularioDePerfil({
  initialNombre,
  displayNombre,
  email,
  avatarUrl,
  portadaUrl,
  actividades,
}: PerfilFormProps) {
  const [actividadesElegidas, setActividadesElegidas] = useState<ActividadRuta[]>(actividades);
  const router = useRouter();
  const foto = useFoto("avatar", FORMAS_DE_RECORTE.avatar);
  const fotoPortada = useFoto("portada", FORMAS_DE_RECORTE.portada);
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(initialNombre || displayNombre);
  const [emailValue, setEmailValue] = useState(email);
  const [loQueLlego, setLoQueLlego] = useState({ initialNombre, displayNombre, email });
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

  const clearAvatarSelection = () => {
    foto.quitar();
    fotoPortada.quitar();
  };

  const resetForm = () => {
    setNombre(initialNombre || displayNombre);
    setEmailValue(email);
    setActividadesElegidas(actividades);
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

    const result = await editarPerfil({
      nombre,
      email: emailValue,
      avatarFile: foto.archivo,
      portadaFile: fotoPortada.archivo,
      actividades: actividadesElegidas,
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

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-verde-borde bg-superficie text-left shadow-sm">
      <PortadaDePerfil
        portadaUrl={portadaUrl}
        avatarUrl={avatarUrl}
        nombre={viewNombre}
        actividades={actividades}
        accion={
          <CircleIconButton
            ariaLabel={editing ? "Cerrar edición" : "Editar perfil"}
            onClick={editing ? cancelEditing : startEditing}
          >
            <span className={CLASE_DEL_CIRCULO}>
              {editing ? <CruzRedonda /> : <PencilIcon />}
            </span>
          </CircleIconButton>
        }
      />

      {/* Formulario de edición */}
      <div className="px-4 sm:px-5">
        {editing ? (
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="space-y-4 border-t border-borde/60 pb-5 pt-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-texto-suave">Foto de portada</p>
                <SelectorDeFoto
                  foto={fotoPortada}
                  deshabilitado={loading}
                  etiqueta="Elegir portada"
                  fotoActual={portadaUrl}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-texto-suave">Foto de perfil</p>
                <SelectorDeFoto
                  foto={foto}
                  deshabilitado={loading}
                  etiqueta="Elegir tu foto"
                  fotoActual={avatarUrl}
                  vistaPreviaRedonda
                />
              </div>
            </div>

            <Campo
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

            <Campo
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

            <Opciones
              etiqueta="Qué practicás"
              ayuda="Podés elegir varias, una o ninguna. Se ven en tu perfil."
              opciones={OPCIONES_DE_ACTIVIDAD}
              elegidas={actividadesElegidas}
              alElegir={(valor) =>
                setActividadesElegidas((actuales) =>
                  actuales.includes(valor)
                    ? actuales.filter((cada) => cada !== valor)
                    : [...actuales, valor],
                )
              }
              columnas={2}
              multiple
            />

            <Boton type="submit" anchoCompleto disabled={loading}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </Boton>
          </form>
        ) : null}

        {message ? (
          <p className="mb-5 rounded-lg border border-verde-borde bg-verde-fondo px-3 py-2 text-sm text-verde-texto">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
