#!/usr/bin/env node
/**
 * Usage (once implemented):
 *   npm run generate -- data/sample.geojson out/sample.pmtiles
 *
 * Pipeline sketch:
 * 1. Load vector features
 * 2. For each zoom, use tilesForBounds from tile-matrix
 * 3. Clip features to each tile → encode MVT
 * 4. Pack tiles into .pmtiles with PmtilesCrsMetadata
 */

import { WGS84_SIMPLE } from "@pmtiles-crs/tile-matrix";

function printHelp(): void {
  console.log(`pmtiles-crs generate (stub)

Usage:
  npm run generate -- <input.geojson> <out.pmtiles>

  Or via npx:
  npx tsx packages/generate/src/cli.ts --input <geojson> --out <file.pmtiles>

Options:
  --input / --out           Named flags (prefer when calling tsx directly)
  --min-zoom / --max-zoom   Optional overrides (default: matrix)
`);
}

type Args = {
  help?: boolean;
  input?: string;
  out?: string;
  "min-zoom"?: string;
  "max-zoom"?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (a.startsWith("--")) {
      const key = a.slice(2) as keyof Args;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        (out as Record<string, string | boolean>)[key] = next;
        i++;
      }
      continue;
    }
    positional.push(a);
  }

  if (!out.input && positional[0]) out.input = positional[0];
  if (!out.out && positional[1]) out.out = positional[1];
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input || !args.out) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  console.log("Matrix:", WGS84_SIMPLE.id, WGS84_SIMPLE.crs);
  console.log("Input:", args.input);
  console.log("Out:", args.out);
  console.log("TODO: load features → cut MVT → write PMTiles");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
