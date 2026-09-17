# pmtiles-crs

PMTiles for a geographic or projected CRS, **not** Web Mercator.

Standard PMTiles assumes EPSG:3857 (Web Mercator). This project builds a pipeline and viewer for tiles in other coordinate reference systems.

## v1 — EPSG:4326

- Define a 4326 tile matrix
- Cut vector data to MVT in that grid
- Pack into `.pmtiles`
- Store CRS, bounds, and tile matrix in metadata
- View in OpenLayers in 4326

## v2 — projected CRS

- Same pipeline for one projected CRS (e.g. TUREF or UTM)
- View in that CRS

## Later

- More CRS
- Raster tiles
- CLI
