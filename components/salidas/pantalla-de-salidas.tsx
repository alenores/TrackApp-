"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQuienSoy } from "@/components/armazon/quien-soy";
import { Boton } from "@/components/ui/boton";
import { BuscadorDeTitulo } from "@/components/ui/buscador-de-titulo";
import { Esqueleto } from "@/components/ui/esqueleto";
import { PastillasDeFiltros } from "@/components/ui/pastillas-de-filtros";
import { Tarjeta } from "@/components/ui/tarjeta";
import { FiltrosDeSalidas } from "@/components/salidas/filtros-de-salidas";
import { CalendarioDeSalidas } from "@/components/salidas/calendario-de-salidas";
import { AvisoDeRegistros } from "@/components/salidas/aviso-de-registros";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { ICONO_DE_FILTRAR } from "@/components/ui/iconos";
import { TarjetaDeSalida } from "@/components/salidas/tarjeta-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useSalidasDeLaApertura } from "@/hooks/use-salidas-de-la-apertura";
import {
  direccionDeSalidas,
  filtrarSalidas,
  filtrosPuestos,
  leerFiltros,
  leerPagina,
  paginaDeSalidas,
  SIN_FILTROS,
  type FiltrosDeSalidas as Filtros,
} from "@/lib/salidas/filtros";

/**
 * La lista de salidas.
 *
 * **Salidas es 100 % con internet.** La lista entera se trae una sola vez por
 * apertura; buscar, filtrar y pasar de página se resuelven en el celular, sin
 * volver a preguntarle a la base (decisión 054). Los filtros viven en la
 * dirección para sobrevivir a «atrás», pero cambiarlos no sale a internet.
 * Si la señal se va con la pantalla abierta, lo que ya se ve queda a la vista
 * y desaparecen las acciones que necesitan internet.
 *
 * Cargar una salida es el botón «+» flotante, que pone el armazón.
 */

/** Cambia la dirección sin pedirle nada al servidor. */
function irA(filtros: Filtros, pagina = 1, reemplazar = false) {
  const direccion = direccionDeSalidas(filtros, pagina);
  if (reemplazar) window.history.replaceState(null, "", direccion);
  else window.history.pushState(null, "", direccion);
}

export function PantallaDeSalidas() {
  const { miPerfilId } = useQuienSoy();
  const haySenal = useHaySenal();
  const datos = useSalidasDeLaApertura();
  const parametros = useSearchParams();
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const deLaDireccion = Object.fromEntries(parametros.entries());
  const filtros = leerFiltros(deLaDireccion);
  const pagina = leerPagina(deLaDireccion.pagina);
  const diaElegido = filtros.desde && filtros.desde === filtros.hasta ? filtros.desde : null;

  const participantes = datos.estado === "listo" ? datos.participantes : [];
  const nombreDe = (perfilId: string) =>
    participantes.find((perfil) => perfil.id === perfilId)?.nombre ?? "alguien que ya no está";
  // El título se ve en su buscador: no lleva pastilla ni cuenta en «Filtrar».
  const puestos = filtrosPuestos(filtros, nombreDe).filter((puesto) => puesto.clave !== "titulo");
  const hayFiltros = puestos.length > 0;
  const hayBusqueda = hayFiltros || Boolean(filtros.titulo.trim());

  const encontradas = datos.estado === "listo" ? filtrarSalidas(datos.salidas, filtros) : [];
  const resultado = paginaDeSalidas(encontradas, pagina);
  const pasarDePagina = (nueva: number) => {
    irA(filtros, nueva);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
        {haySenal ? (
          <BotonRedondo etiqueta="Ver los días con salidas" onClick={() => setCalendarioAbierto(true)}>
            <path d="M7 3v3M17 3v3M4 9h16M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
          </BotonRedondo>
        ) : null}
      </div>

      {haySenal ? (
        <BuscadorDeTitulo
          titulo={filtros.titulo}
          placeholder="Buscar salida"
          alCambiar={(titulo) => irA({ ...filtros, titulo }, 1, true)}
        >
          {/* Puesto algún filtro, se pinta con el color principal. */}
          <BotonRedondo
            etiqueta={hayFiltros ? `Filtrar, ${puestos.length} puestos` : "Filtrar"}
            variante={hayFiltros ? "principal" : "secundario"}
            onClick={() => setFiltrosAbiertos(true)}
          >
            {ICONO_DE_FILTRAR}
          </BotonRedondo>
        </BuscadorDeTitulo>
      ) : null}

      {hayFiltros ? (
        <PastillasDeFiltros
          puestos={puestos}
          alSacar={(sinEste) => irA(sinEste)}
          alLimpiar={() => irA({ ...SIN_FILTROS, titulo: filtros.titulo })}
        />
      ) : null}

      <AvisoDeRegistros />

      {!haySenal ? (
        <Tarjeta franja="ambar">
          <p className="text-base leading-6 text-texto">
            {datos.estado === "listo"
              ? "Sin señal. Salidas funciona solo con internet: lo que ves se cargó antes de perderla. Para cargar, editar o filtrar, esperá a tener señal."
              : "Sin señal. Salidas funciona solo con internet: las salidas aparecen apenas vuelva la señal."}
          </p>
        </Tarjeta>
      ) : null}

      {datos.estado === "cargando" ? (
        haySenal ? <TarjetasCargando /> : null
      ) : datos.estado === "fallo" ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base leading-6 text-texto">
            No se pudo traer la lista de salidas: {datos.motivo}
          </p>
          <Boton variante="secundario" onClick={datos.reintentar}>
            Volver a intentar
          </Boton>
        </Tarjeta>
      ) : resultado.salidas.length === 0 ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            {hayBusqueda
              ? "Ninguna salida cumple con lo que buscaste. Cambiá el título o sacá algún filtro para ver más."
              : resultado.pagina > 1
                ? "No hay salidas más antiguas."
                : "Todavía nadie cargó una salida. Cargá la primera con el botón «+» de abajo a la derecha."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {resultado.salidas.map((salida) => (
            <li key={salida.id}>
              <TarjetaDeSalida
                salida={salida}
                puedeEditar={haySenal && salida.perfil.id === miPerfilId}
              />
            </li>
          ))}
        </ul>
      )}

      {datos.estado === "listo" && (resultado.pagina > 1 || resultado.hayMas) ? (
        <div className="flex justify-between gap-3">
          {resultado.pagina > 1 ? (
            <Boton variante="secundario" onClick={() => pasarDePagina(resultado.pagina - 1)}>
              Más recientes
            </Boton>
          ) : (
            <span />
          )}
          {resultado.hayMas ? (
            <Boton variante="secundario" onClick={() => pasarDePagina(resultado.pagina + 1)}>
              Más antiguas
            </Boton>
          ) : null}
        </div>
      ) : null}

      <CalendarioDeSalidas
        abierto={calendarioAbierto}
        alCerrar={() => setCalendarioAbierto(false)}
        salidas={datos.estado === "listo" ? datos.salidas : null}
        motivoDeFalla={datos.estado === "fallo" ? datos.motivo : null}
        diaInicial={filtros.desde}
        diaElegido={diaElegido}
        alElegirDia={(dia) => {
          setCalendarioAbierto(false);
          irA({ ...filtros, desde: dia, hasta: dia });
        }}
      />

      <FiltrosDeSalidas
        abierto={filtrosAbiertos}
        alCerrar={() => setFiltrosAbiertos(false)}
        filtros={filtros}
        perfiles={participantes}
        alAplicar={(elegidos) => {
          setFiltrosAbiertos(false);
          irA({ ...elegidos, titulo: filtros.titulo });
        }}
      />
    </div>
  );
}

/** Mientras llega la lista: tarjetas grises con la forma de las de verdad. */
function TarjetasCargando() {
  return (
    <ul className="space-y-4" aria-busy="true">
      <li role="status" className="text-base text-texto-suave">
        Trayendo las salidas…
      </li>
      {[0, 1, 2].map((cada) => (
        <li key={cada}>
          <Esqueleto className="h-56 w-full rounded-2xl" />
        </li>
      ))}
    </ul>
  );
}
