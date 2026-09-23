import { readFile } from "node:fs/promises";
import {
  includePosition,
  unionBounds,
  type Bounds,
  type Tile,
  type TileCoord,
  type TileGrid,
} from "@pmtiles-crs/tile-grid";
import type {
  EncodedTile,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  PmtilesArchiveMetadata,
} from "./types.js";

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

function includePositions(bounds: Bounds | null, positions: number[][]): Bounds | null {
  return positions.reduce<Bounds | null>((next, position) => {
    const lon = position[0];
    const lat = position[1];
    if (typeof lon !== "number" || typeof lat !== "number") {
      return next;
    }
    return includePosition(next, lon, lat);
  }, bounds);
}

function unionOptional(current: Bounds | null, next: Bounds | null): Bounds | null {
  if (!next) return current;
  if (!current) return next;
  return unionBounds(current, next);
}

/**
 * Geographic bbox of a geometry: [west, south, east, north].
 * Returns null for empty / null geometry.
 *
 * TODO(antimeridian): plain min/max lon is wrong for geometries that cross ±180.
 */
export function geometryBbox(geometry: GeoJsonGeometry | null): Bounds | null {
  if (!geometry) {
    return null;
  }

  switch (geometry.type) {
    case "Point": {
      const lon = geometry.coordinates[0];
      const lat = geometry.coordinates[1];
      if (typeof lon !== "number" || typeof lat !== "number") {
        return null;
      }
      return includePosition(null, lon, lat);
    }
    case "MultiPoint":
    case "LineString":
      return includePositions(null, geometry.coordinates);
    case "MultiLineString":
      return geometry.coordinates.reduce<Bounds | null>(
        (bounds, line) => includePositions(bounds, line),
        null,
      );
    case "Polygon":
      // Rings are [outer, ...holes]. A valid hole lies inside the outer ring, so
      // it cannot grow the bbox. Still walk every ring: a hole vertex may sit
      // outside the outer ring, or the rings may be ordered wrong.
      return geometry.coordinates.reduce<Bounds | null>(
        (bounds, ring) => includePositions(bounds, ring),
        null,
      );
    case "MultiPolygon":
      // Each polygon is [outer, ...holes]; same reason as Polygon.
      return geometry.coordinates.reduce<Bounds | null>(
        (bounds, polygon) =>
          polygon.reduce(
            (next, ring) => includePositions(next, ring),
            bounds,
          ),
        null,
      );
    case "GeometryCollection":
      return geometry.geometries.reduce<Bounds | null>(
        (bounds, child) => unionOptional(bounds, geometryBbox(child)),
        null,
      );
  }
}

/**
 * Bbox for a Feature. Uses GeoJSON `bbox` when present and well-formed;
 * otherwise computes from geometry.
 */
export function featureBbox(feature: GeoJsonFeature): Bounds | null {
  const bbox = feature.bbox;
  if (
    bbox &&
    bbox.length >= 4 &&
    bbox.every((n) => Number.isFinite(n)) &&
    bbox[2] >= bbox[0] &&
    bbox[3] >= bbox[1]
  ) {
    return bbox;
  }

  return geometryBbox(feature.geometry);
}

/**
 * Union bbox of a feature array. Skips features with no geometry/bbox.
 */
export function featuresBbox(features: GeoJsonFeature[]): Bounds | null {
  return features.reduce<Bounds | null>(
    (bounds, feature) => unionOptional(bounds, featureBbox(feature)),
    null,
  );
}

/**
 * Features that intersect a tile (rough filter before clip).
 * TODO: implement bbox test against tileBounds.
 */
export function featuresForTile(
  _features: GeoJsonFeature[],
  _grid: TileGrid,
  _tile: Tile,
): unknown[] {
  throw new Error("TODO: featuresForTile");
}

/**
 * Clip geometries to tile bounds and encode as Mapbox Vector Tile bytes.
 * TODO: pick an MVT encoder (e.g. @mapbox/vector-tile + geojson-vt, or vt-pbf).
 */
export function encodeMvt(
  _features: unknown[],
  _grid: TileGrid,
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
  _tiles: EncodedTile[],
  _metadata: PmtilesArchiveMetadata,
): Promise<void> {
  throw new Error("TODO: writePmtiles");
}
