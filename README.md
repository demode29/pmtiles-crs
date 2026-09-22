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

---

## Repo layout

```text
packages/
  tile-matrix/   # lon/lat ↔ tile xyz, bounds, tile lists (implement first)
  generate/      # GeoJSON → MVT → .pmtiles (stubs)
  viewer/        # OpenLayers + Vite (stubs)
data/            # sample.geojson
out/             # generated .pmtiles (gitignored)
```

## Setup

```bash
npm install
```

## Scripts

| Command | What |
|---------|------|
| `npm test` | Run `tile-matrix` tests (Vitest) |
| `npm run test:watch -w @pmtiles-crs/tile-matrix` | Vitest watch mode |
| `npm run generate -- data/sample.geojson out/sample.pmtiles` | Generator CLI (stub until you implement) |
| `npm run dev` | OpenLayers viewer at http://localhost:5173 |
| `npm run build:matrix` | Compile `tile-matrix` (also runs on `postinstall`) |

> On Windows, prefer positional args with `npm run generate` — npm can swallow `--input` / `--out`. Named flags work with `npx tsx packages/generate/src/cli.ts --input ...`.

## Suggested build order

1. Implement `packages/tile-matrix/src/matrix.ts` and turn `it.todo` tests into real assertions
2. Implement `packages/generate/src/pipeline.ts` and wire it from `cli.ts`
3. Implement `packages/viewer/src/pmtiles-source.ts` and add the layer in `main.ts`

Copy `out/sample.pmtiles` into `packages/viewer/public/` when you have an archive to view.
