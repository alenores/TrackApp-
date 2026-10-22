"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type FormEvent,
} from "react";
import { editarPerfil } from "@/app/actions/perfil";
import { Boton } from "@/components/ui/boton";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { BotonCerrar } from "@/components/ui/boton-redondo";
import { Campo } from "@/components/ui/campo";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { PortadaDePerfil } from "@/components/perfil/portada-de-perfil";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { principalDelPerfil, revisarActividadesDelPerfil } from "@/lib/perfiles/actividades";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { ACTIVIDADES_RUTA, type ActividadRuta } from "@/types/database";

type PerfilFormProps = {
  initialNombre: string;
  displayNombre: string;
  email: string;
  avatarUrl?: string | null;
  portadaUrl?: string | null;
  /** Lo que practica. */
  actividades: ActividadRuta[];
  actividadPrincipal: ActividadRuta | null;
};

const OPCIONES_DE_ACTIVIDAD: Opcion<ActividadRuta>[] = ACTIVIDADES_RUTA.map((tipo) => {
  const actividad = mostrarActividad(tipo);
  return { valor: tipo, etiqueta: actividad.etiqueta, trazo: actividad.trazo };
});

const PROFILE_FIELD_CLASS =
  "border-borde bg-superficie text-texto placeholder:text-texto-suave/50";


export function FormularioDePerfil({
  initialNombre,
  displayNombre,
  email,
  avatarUrl,
  portadaUrl,
  actividades,
  actividadPrincipal,
}: PerfilFormProps) {
  const [actividadesElegidas, setActividadesElegidas] = useState<ActividadRuta[]>(actividades);
  const [principalElegida, setPrincipalElegida] = useState<ActividadRuta | null>(() => principalDelPerfil(actividades, actividadPrincipal));
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
    setPrincipalElegida(principalDelPerfil(actividades, actividadPrincipal));
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
    const problema = revisarActividadesDelPerfil(actividadesElegidas, principalElegida);
    if (problema) { setError(problema); return; }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await editarPerfil({
        nombre,
        email: emailValue,
        avatarFile: foto.archivo,
        portadaFile: fotoPortada.archivo,
        actividades: actividadesElegidas,
        actividadPrincipal: principalElegida,
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
    } catch (causa) {
      setError(`No se pudo guardar tu perfil: ${causa instanceof Error ? causa.message : String(causa)}. Volvé a intentar.`);
    } finally { setLoading(false); }
  };

  const viewNombre = initialNombre || displayNombre;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-verde-borde bg-superficie text-left shadow-sm">
      <PortadaDePerfil
        portadaUrl={portadaUrl}
        avatarUrl={avatarUrl}
        nombre={viewNombre}
        actividades={actividades}
      />
      <div className="absolute right-3 top-3 z-20">
        {editing ? <BotonCerrar etiqueta="Cerrar edición" onClick={cancelEditing} /> : <MenuDeAcciones etiqueta="Opciones del perfil"
          acciones={[{ etiqueta: "Editar", alElegir: startEditing }]} />}
      </div>

      {!editing && principalDelPerfil(actividades, actividadPrincipal) ? <p className="px-4 pb-4 text-sm text-texto-suave">Actividad principal: {mostrarActividad(principalDelPerfil(actividades, actividadPrincipal)!).etiqueta}</p> : null}

      {/* Formulario de edición */}
      <div className="px-4 sm:px-5">
        {editing ? (
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="space-y-4 border-t border-borde/60 pb-5 pt-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <SelectorDeFoto
                  foto={fotoPortada}
                  deshabilitado={loading}
                  fotoActual={portadaUrl}
                />
              </div>
              
              <div className="space-y-2">
                <SelectorDeFoto
                  foto={foto}
                  deshabilitado={loading}
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
              ayuda="Elegí una o varias. Tu actividad principal viene seleccionada al abrir los mapas."
              opciones={OPCIONES_DE_ACTIVIDAD}
              elegidas={actividadesElegidas}
              alElegir={(valor) => {
                const nuevas = actividadesElegidas.includes(valor) ? actividadesElegidas.filter((cada) => cada !== valor) : [...actividadesElegidas, valor];
                setActividadesElegidas(nuevas);
                setPrincipalElegida(nuevas.length === 1 ? nuevas[0] : actividadesElegidas.length > 1 && principalElegida && nuevas.includes(principalElegida) ? principalElegida : null);
              }}
              columnas={2}
              multiple
            />

            {actividadesElegidas.length > 1 ? <Opciones etiqueta="Actividad principal" ayuda="Elegí cuál querés ver al entrar a Consultas y Marcas."
              opciones={OPCIONES_DE_ACTIVIDAD.filter((cada) => actividadesElegidas.includes(cada.valor))}
              elegidas={principalElegida ? [principalElegida] : []} alElegir={setPrincipalElegida} columnas={2} /> : null}
            {error ? <p role="alert" className="text-sm text-rojo-texto">{error}</p> : null}
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
