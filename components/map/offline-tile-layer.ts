import L from "leaflet";
import { getOsmTileUrl, getTile, saveTile } from "@/lib/tiles";

export function createOfflineTileLayer(
  options?: L.TileLayerOptions,
): L.TileLayer {
  const OfflineTileLayer = L.TileLayer.extend({
    createTile(
      this: L.TileLayer,
      coords: L.Coords,
      done: L.DoneCallback,
    ) {
      const tile = document.createElement("img");
      tile.alt = "";
      tile.setAttribute("role", "presentation");

      void (async () => {
        try {
          let blob = await getTile(coords.z, coords.x, coords.y);

          if (!blob) {
            const response = await fetch(
              getOsmTileUrl(coords.z, coords.x, coords.y),
            );
            if (!response.ok) {
              throw new Error(`Tile ${coords.z}/${coords.x}/${coords.y} no disponible`);
            }
            blob = await response.blob();
            await saveTile(coords.z, coords.x, coords.y, blob);
          }

          const objectUrl = URL.createObjectURL(blob);
          tile.onload = () => {
            URL.revokeObjectURL(objectUrl);
          };
          tile.onerror = () => {
            URL.revokeObjectURL(objectUrl);
          };
          tile.src = objectUrl;
          done(undefined, tile);
        } catch (error) {
          done(error as Error, tile);
        }
      })();

      return tile;
    },
  });

  const LayerClass = OfflineTileLayer as unknown as {
    new (url: string, options?: L.TileLayerOptions): L.TileLayer;
  };

  return new LayerClass("", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    ...options,
  });
}
