import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import { useGeographic } from "ol/proj.js";
import { WGS84_SIMPLE } from "@pmtiles-crs/tile-grid";

/**
 * OpenLayers in lon/lat degrees (EPSG:4326).
 * OSM underneath is still Web Mercator tiles — fine as a temporary basemap.
 * Your PMTiles layer should use the same tile grid as generate.
 *
 * TODO:
 * 1. Fetch / serve out/sample.pmtiles (Vite public/ or static middleware)
 * 2. Read metadata.tile_grid and assert it matches WGS84_SIMPLE
 * 3. Add a VectorTile layer (or custom tile source) driven by PMTiles + grid
 */

useGeographic();

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5,
    }),
  ],
  view: new View({
    // lon, lat
    center: [35, 39],
    zoom: 5,
  }),
});

console.log("Viewer stub — grid", WGS84_SIMPLE.id, WGS84_SIMPLE.crs);
console.log("TODO: add PMTiles vector layer for CRS", WGS84_SIMPLE.crs);

void map;
