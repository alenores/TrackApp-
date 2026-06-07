export type RouteBbox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type Ruta = {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string | null;
  distancia_km: number | null;
  gpx_url: string | null;
  geojson: GeoJSON.FeatureCollection | null;
  bbox: RouteBbox | null;
  subido_por_nombre: string | null;
  created_at: string;
};

export type Descarga = {
  id: string;
  user_id: string;
  ruta_id: string;
  created_at: string;
};
