"use client";

import { useState, type ReactNode } from "react";
import { Campo } from "@/components/ui/campo";

/**
 * El buscador por título que va arriba de una lista (Salidas, Circuitos):
 * la lista se achica mientras se escribe. A su derecha va lo que se le pase,
 * el botón de filtrar.
 *
 * Busca sobre lo que ya llegó al celular: escribir no sale a internet.
 */

type Props = {
  titulo: string;
  placeholder: string;
  alCambiar: (titulo: string) => void;
  children?: ReactNode;
};

export function BuscadorDeTitulo({ titulo, placeholder, alCambiar, children }: Props) {
  const [texto, setTexto] = useState(titulo);
  const [anterior, setAnterior] = useState(titulo);

  // Si el título cambió desde afuera («atrás», limpiar), se acomoda. Lo que
  // escribe la persona llega igual, sin espacios de las puntas: no se pisa.
  if (titulo !== anterior) {
    setAnterior(titulo);
    if (texto.trim() !== titulo.trim()) setTexto(titulo);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Campo
          label={placeholder}
          etiquetaOculta
          type="search"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            alCambiar(evento.target.value.trim());
          }}
          placeholder={placeholder}
          maxLength={120}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {children}
    </div>
  );
}
