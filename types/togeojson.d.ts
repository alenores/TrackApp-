declare module "togeojson" {
  import type { FeatureCollection } from "geojson";

  type ToGeoJSON = {
    gpx(doc: Document): FeatureCollection;
    kml(doc: Document): FeatureCollection;
  };

  const toGeoJSON: ToGeoJSON;
  export default toGeoJSON;
}
