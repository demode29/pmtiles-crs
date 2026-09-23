import { describe, expect, it } from "vitest";
import {
  WGS84_SIMPLE,
  lonLatToTile,
  tileBounds,
  tileCount,
  tileSizeAtZoom,
  tilesForBounds,
} from "./grid.js";

describe("tile-grid", () => {
  describe("tileSizeAtZoom / tileCount", () => {
    it("z0 is 2x1 tiles of 180x180", () => {
      expect(tileCount(0)).toEqual({ columns: 2, rows: 1 });
      expect(tileSizeAtZoom(WGS84_SIMPLE, 0)).toEqual({ width: 180, height: 180 });
    });

    it("each zoom doubles columns and rows", () => {
      expect(tileCount(1)).toEqual({ columns: 4, rows: 2 });
      expect(tileSizeAtZoom(WGS84_SIMPLE, 1)).toEqual({ width: 90, height: 90 });
      expect(tileCount(2)).toEqual({ columns: 8, rows: 4 });
      expect(tileSizeAtZoom(WGS84_SIMPLE, 2)).toEqual({ width: 45, height: 45 });
    });
  });

  describe("lonLatToTile", () => {
    it("maps (0,0) at z0 to eastern tile", () => {
      expect(lonLatToTile(WGS84_SIMPLE, [0, 0], 0)).toEqual({ z: 0, x: 1, y: 0 });
    });

    it("maps world corners and poles", () => {
      expect(lonLatToTile(WGS84_SIMPLE, [-180, 90], 0)).toEqual({ z: 0, x: 0, y: 0 });
      expect(lonLatToTile(WGS84_SIMPLE, [0, 90], 0)).toEqual({ z: 0, x: 1, y: 0 });
      expect(lonLatToTile(WGS84_SIMPLE, [0, -90], 0)).toEqual({ z: 0, x: 1, y: 0 });
      expect(lonLatToTile(WGS84_SIMPLE, [179.9, 0], 0)).toEqual({ z: 0, x: 1, y: 0 });
      // 180 and -180 are the same meridian under [west, east)
      expect(lonLatToTile(WGS84_SIMPLE, [180, 0], 0)).toEqual({ z: 0, x: 0, y: 0 });
      expect(lonLatToTile(WGS84_SIMPLE, [0, -90], 1)).toEqual({ z: 1, x: 2, y: 1 });
    });

    it("wraps longitude into the world", () => {
      expect(lonLatToTile(WGS84_SIMPLE, [370, 0], 0)).toEqual(
        lonLatToTile(WGS84_SIMPLE, [10, 0], 0),
      );
      expect(lonLatToTile(WGS84_SIMPLE, [-190, 0], 0)).toEqual(
        lonLatToTile(WGS84_SIMPLE, [170, 0], 0),
      );
    });
  });

  describe("tileBounds", () => {
    it("tile 0,0,0 is western hemisphere", () => {
      expect(tileBounds(WGS84_SIMPLE, { z: 0, x: 0, y: 0 })).toEqual([-180, -90, 0, 90]);
    });

    it("tile 0,1,0 is eastern hemisphere", () => {
      expect(tileBounds(WGS84_SIMPLE, { z: 0, x: 1, y: 0 })).toEqual([0, -90, 180, 90]);
    });
  });

  describe("round-trip", () => {
    it("tileBounds contains the original point", () => {
      const lonLat = [32.85, 39.93] as const;
      const tile = lonLatToTile(WGS84_SIMPLE, lonLat, 3);
      const [w, s, e, n] = tileBounds(WGS84_SIMPLE, tile);
      expect(lonLat[0]).toBeGreaterThanOrEqual(w);
      expect(lonLat[0]).toBeLessThan(e);
      expect(lonLat[1]).toBeGreaterThan(s);
      expect(lonLat[1]).toBeLessThanOrEqual(n);
    });
  });

  describe("tilesForBounds", () => {
    it("covers the world at z0 with both tiles", () => {
      const tiles = tilesForBounds(WGS84_SIMPLE, [-180, -90, 180, 90], 0);
      expect(tiles.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 0, y: 0 },
        { z: 0, x: 1, y: 0 },
      ]);
      expect(tiles[0].bounds).toEqual([-180, -90, 0, 90]);
      expect(tiles[1].bounds).toEqual([0, -90, 180, 90]);
    });

    it("returns every z1 tile for the world", () => {
      const tiles = tilesForBounds(WGS84_SIMPLE, [-180, -90, 180, 90], 1);
      expect(tiles).toHaveLength(8);
      expect(tiles[0]).toMatchObject({ z: 1, x: 0, y: 0 });
      expect(tiles[7]).toMatchObject({ z: 1, x: 3, y: 1 });
      expect(tiles[0].bounds).toEqual(tileBounds(WGS84_SIMPLE, tiles[0]));
    });

    it("keeps an exact western hemisphere box on one z0 tile", () => {
      const tiles = tilesForBounds(WGS84_SIMPLE, [-180, -90, 0, 90], 0);
      expect(tiles.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 0, y: 0 },
      ]);
    });

    it("returns a single tile for an interior box", () => {
      const tiles = tilesForBounds(WGS84_SIMPLE, [-90, -45, -10, 45], 0);
      expect(tiles.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 0, y: 0 },
      ]);
    });

    it("returns both z0 tiles when the box crosses lon 0", () => {
      const tiles = tilesForBounds(WGS84_SIMPLE, [-10, -10, 10, 10], 0);
      expect(tiles.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 0, y: 0 },
        { z: 0, x: 1, y: 0 },
      ]);
    });

    it("returns no tiles for inverted bounds", () => {
      expect(tilesForBounds(WGS84_SIMPLE, [10, 10, -10, -10], 0)).toEqual([]);
    });

    it("keeps a point bbox, including one on a tile edge", () => {
      const interior = tilesForBounds(WGS84_SIMPLE, [32.85, 39.93, 32.85, 39.93], 0);
      expect(interior.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 1, y: 0 },
      ]);

      const onMeridian = tilesForBounds(WGS84_SIMPLE, [0, 0, 0, 0], 0);
      expect(onMeridian.map(({ z, x, y }) => ({ z, x, y }))).toEqual([
        { z: 0, x: 1, y: 0 },
      ]);
    });
  });
});
