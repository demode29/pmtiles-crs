import type { Bounds, LonLat, Tile, TileCoord, TileGrid } from "./types.js";
import { clamp, wrap } from "./utils.js";

/**
 * Width/height of one tile in CRS units at zoom z.
 * implement from grid.bounds and 2^z (decide square vs 2:1 world).
 */
export function tileSizeAtZoom(grid: TileGrid, z: number): {
  width: number;
  height: number;
} {
  const bounds = grid.bounds;
  const worldWidth  = bounds[2] - bounds[0];
  const worldHeight = bounds[3] - bounds[1];

  const tileCountCalculated = tileCount(z);

  return {
    width: worldWidth / tileCountCalculated.columns, 
    height: worldHeight / tileCountCalculated.rows,
  };
}

/**
 * Number of tiles spanning the grid at zoom z (columns × rows).
 */
export function tileCount(z: number): {
  columns: number;
  rows: number;
} {
  return {
    columns: 2**(z + 1), // different that web mercator version which comes with drawback of more tiles at given zoom level
    rows: 2**z,
  }
}

/**
 * Lon/lat → tile xyz for the given grid.
 */
export function lonLatToTile(
  grid: TileGrid,
  lonLat: LonLat,
  z: number,
): TileCoord {
  const bounds = grid.bounds;

  const tileInfo = tileSizeAtZoom(grid, z);
  const west = bounds[0];
  const east = bounds[2];
  const south = bounds[1];
  const north = bounds[3];

  // so if bounds is not circular then we can directly clamp like for example turkey bounds
  const lon = east - west === 360 ? wrap(lonLat[0], west, east) : clamp(lonLat[0], west, east);
  const lat = clamp(lonLat[1], south, north); //clamp lat

  const tileCountInfo = tileCount(z);

  // what if lon is 190? but is it possible? or wrap it? 
  return {
    z,
    // we assuume that tile origin is at north west increasing downward
    x: Math.min(Math.floor((lon - west) / tileInfo.width), tileCountInfo.columns - 1),
    y: Math.min(Math.floor((north - lat) / tileInfo.height), tileCountInfo.rows - 1),
  }
}

/**
 * Geographic bounds of one tile (west, south, east, north).
 */
export function tileBounds(grid: TileGrid, tile: TileCoord): Bounds {
  const bounds = grid.bounds;

  const boundWest = bounds[0];
  const boundEast = bounds[2];
  const boundSouth = bounds[1];
  const boundNorth = bounds[3];
  // inverse of lon lat to tile
  const tileInfo = tileSizeAtZoom(grid, tile.z);
  const tileCountInfo = tileCount(tile.z);

  //  what is tile size in geographic?
  const tileSizeInGeoWidth = (boundEast - boundWest) / tileCountInfo.columns;
  const tileSizeInGeoHeight = (boundNorth - boundSouth) / tileCountInfo.rows;

  const west = boundWest + tile.x * tileInfo.width;
  const east = west + tileSizeInGeoWidth;
  const north = boundNorth - tile.y * tileInfo.height;
  const south = north - tileSizeInGeoHeight;

  return [west, south, east, north];
}

/** Attach geographic bounds to a tile index. */
export function toTile(grid: TileGrid, tile: TileCoord): Tile {
  return {
    z: tile.z,
    x: tile.x,
    y: tile.y,
    bounds: tileBounds(grid, tile),
  };
}

/**
 * All tiles that intersect the given geographic bounds at zoom z
 * (each entry includes `bounds`).
 */
export function tilesForBounds(
  grid: TileGrid,
  bounds: Bounds,
  z: number,
): Tile[] {
  const [boundWest, boundSouth, boundEast, boundNorth] = grid.bounds;
  const [west, south, east, north] = bounds;

  if (east < west || north < south) {
    return [];
  }

  const qWest = clamp(west, boundWest, boundEast);
  const qEast = clamp(east, boundWest, boundEast);
  const qSouth = clamp(south, boundSouth, boundNorth);
  const qNorth = clamp(north, boundSouth, boundNorth);

  if (qEast < qWest || qNorth < qSouth) {
    return [];
  }

  const { width, height } = tileSizeAtZoom(grid, z);
  const { columns, rows } = tileCount(z);

  // A point (or a line) has zero width/height. The area formula treats the
  // far edge as exclusive, so west === east collapses to no tiles — including
  // a point that sits exactly on a tile boundary. Use the same index as lonLatToTile.
  const x0 =
    qEast === qWest
      ? Math.min(Math.floor((qWest - boundWest) / width), columns - 1)
      : Math.max(0, Math.floor((qWest - boundWest) / width));
  const x1 =
    qEast === qWest
      ? x0
      : Math.min(columns - 1, Math.ceil((qEast - boundWest) / width) - 1);
  const y0 =
    qNorth === qSouth
      ? Math.min(Math.floor((boundNorth - qNorth) / height), rows - 1)
      : Math.max(0, Math.floor((boundNorth - qNorth) / height));
  const y1 =
    qNorth === qSouth
      ? y0
      : Math.min(rows - 1, Math.ceil((boundNorth - qSouth) / height) - 1);

  if (x1 < x0 || y1 < y0) {
    return [];
  }

  const tiles: Tile[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      tiles.push(toTile(grid, { z, x, y }));
    }
  }
  return tiles;
}


/**
 * Simple global geographic grid for v1.
 * You decide the exact zoom/width rules — implement helpers against this constant.
 */
export const WGS84_SIMPLE: TileGrid = {
  id: "WGS84_simple",
  crs: "EPSG:4326",
  tileSize: 256,
  minZoom: 0,
  maxZoom: 8,
  bounds: [-180, -90, 180, 90],
  origin: "top-left",
};

