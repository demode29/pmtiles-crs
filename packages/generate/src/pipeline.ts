import { readFile } from "node:fs/promises";
import type { Bounds, TileCoord, TileMatrix } from "@pmtiles-crs/tile-matrix";
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
} from "./geojson.js";

export type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from "./geojson.js";

const GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertFeature(value: unknown, index: number): asserts value is GeoJsonFeature {
  if (!isRecord(value) || value.type !== "Feature") {
    throw new Error(`features[${index}] must be a GeoJSON Feature`);
  }
}

function featureFromGeometry(geometry: GeoJsonGeometry): GeoJsonFeature {
  return {
    type: "Feature",
    geometry,
    properties: null,
  };
}

/**
 * Normalize any GeoJSON root object into a FeatureCollection.
 * - FeatureCollection → as-is (features validated)
 * - Feature → single-feature collection
 * - Geometry → Feature with null properties, then wrapped
 */
export function normalizeToFeatureCollection(
  parsed: unknown,
  sourceLabel = "GeoJSON",
): GeoJsonFeatureCollection {
  if (!isRecord(parsed)) {
    throw new Error(`GeoJSON root in ${sourceLabel} must be an object`);
  }

  if ("crs" in parsed) {
    console.warn(
      `Ignoring deprecated GeoJSON "crs" member in ${sourceLabel} (coordinates are treated as CRS84 lon/lat)`,
    );
  }

  if (parsed.type === "FeatureCollection") {
    if (!Array.isArray(parsed.features)) {
      throw new Error(`FeatureCollection in ${sourceLabel} is missing a features array`);
    }
    parsed.features.forEach(assertFeature);
    return {
      type: "FeatureCollection",
      features: parsed.features as GeoJsonFeature[],
    };
  }

  if (parsed.type === "Feature") {
    assertFeature(parsed, 0);
    return {
      type: "FeatureCollection",
      features: [parsed],
    };
  }

  if (typeof parsed.type === "string" && GEOMETRY_TYPES.has(parsed.type)) {
    return {
      type: "FeatureCollection",
      features: [featureFromGeometry(parsed as GeoJsonGeometry)],
    };
  }

  throw new Error(
    `Unsupported GeoJSON type in ${sourceLabel}: ${JSON.stringify(parsed.type)} ` +
      `(expected FeatureCollection, Feature, or a geometry type)`,
  );
}

/**
 * Load GeoJSON from disk and always return a FeatureCollection
 * (full parse — fine for modest files).
 *
 * TODO(feature-stream): add `loadFeatureStream(path): AsyncIterable<GeoJsonFeature>`
 *   for huge GeoJSON (e.g. stream-json / JSONStream) so the pipeline never holds
 *   the full feature array in memory. Prefer this shape for generate/cli later.
 *
 * TODO(flatgeobuf): add `loadFlatGeobuf(path)` (or unify behind `loadFeatures(path)`
 *   by file extension). FlatGeobuf (.fgb) is a columnar, seekable, cloud-friendly
 *   vector format that streams features without parsing a giant JSON tree — better
 *   than GeoJSON for large datasets. Research:
 *   - https://flatgeobuf.org/
 *   - https://github.com/flatgeobuf/flatgeobuf (JS: `flatgeobuf` npm package)
 *   - https://github.com/flatgeobuf/flatgeobuf/blob/master/src/ts/README.md
 *   Convert example: `ogr2ogr -f FlatGeobuf out.fgb in.geojson`
 */
export async function loadGeoJson(path: string): Promise<GeoJsonFeatureCollection> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read GeoJSON at ${path}: ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${path}: ${message}`);
  }

  return normalizeToFeatureCollection(parsed, path);
}

/**
 * TODO(flatgeobuf): read `.fgb` and return the same FeatureCollection shape
 * (or better: AsyncIterable<GeoJsonFeature>). Use the `flatgeobuf` npm package.
 * QGIS/ogr2ogr can export FlatGeobuf for large layers; prefer that over huge GeoJSON later.
 * @see https://flatgeobuf.org/
 */
export async function loadFlatGeobuf(_path: string): Promise<GeoJsonFeatureCollection> {
  throw new Error("TODO: loadFlatGeobuf — use GeoJSON for now (loadGeoJson)");
}

/**
 * Features that intersect a tile (rough filter before clip).
 * TODO: implement bbox test against tileBounds.
 */
export function featuresForTile(
  _features: unknown,
  _matrix: TileMatrix,
  _tile: TileCoord,
): unknown[] {
  throw new Error("TODO: featuresForTile");
}

/**
 * Clip geometries to tile bounds and encode as Mapbox Vector Tile bytes.
 * TODO: pick an MVT encoder (e.g. @mapbox/vector-tile + geojson-vt, or vt-pbf).
 */
export function encodeMvt(
  _features: unknown[],
  _matrix: TileMatrix,
  _tile: TileCoord,
  _layerName?: string,
): Uint8Array {
  throw new Error("TODO: encodeMvt");
}

/**
 * Write tiles + metadata into a .pmtiles archive.
 * TODO: use the `pmtiles` package writer (or equivalent).
 */
export async function writePmtiles(
  _outPath: string,
  _tiles: Array<{ tile: TileCoord; data: Uint8Array }>,
  _metadata: {
    crs: string;
    tile_matrix: TileMatrix;
    bounds: Bounds;
    vector_layers: Array<{ id: string; fields: Record<string, string> }>;
  },
): Promise<void> {
  throw new Error("TODO: writePmtiles");
}
