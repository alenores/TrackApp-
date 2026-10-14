/**
 * El asterisco rojo de un dato obligatorio, al lado de su rótulo. Lo que no
 * lo lleva es opcional: el usuario sabe de entrada qué tiene que completar,
 * sin adivinar ni esperar un cartel abajo.
 */
export function MarcaDeObligatorio() {
  return (
    <>
      <span aria-hidden="true" className="ml-0.5 text-rojo-texto">*</span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  );
}
