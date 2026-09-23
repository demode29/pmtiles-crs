import { describe, expect, it } from "vitest";
import { featureBbox, featuresBbox, geometryBbox } from "./pipeline.js";
import type { GeoJsonFeature } from "./types.js";

describe("geometryBbox", () => {
  it("handles a Point", () => {
    expect(
      geometryBbox({ type: "Point", coordinates: [32.8597, 39.9334] }),
    ).toEqual([32.8597, 39.9334, 32.8597, 39.9334]);
  });

  it("handles a Polygon", () => {
    expect(
      geometryBbox({
        type: "Polygon",
        coordinates: [
          [
            [28.5, 40.8],
            [29.2, 40.8],
            [29.2, 41.2],
            [28.5, 41.2],
            [28.5, 40.8],
          ],
        ],
      }),
    ).toEqual([28.5, 40.8, 29.2, 41.2]);
  });

  it("returns null for null geometry", () => {
    expect(geometryBbox(null)).toBeNull();
  });
});

describe("featureBbox", () => {
  it("prefers a valid Feature.bbox member", () => {
    const feature: GeoJsonFeature = {
      type: "Feature",
      bbox: [1, 2, 3, 4],
      properties: null,
      geometry: { type: "Point", coordinates: [10, 20] },
    };
    expect(featureBbox(feature)).toEqual([1, 2, 3, 4]);
  });

  it("falls back to geometry when bbox is missing", () => {
    const feature: GeoJsonFeature = {
      type: "Feature",
      properties: { name: "Ankara" },
      geometry: { type: "Point", coordinates: [32.8597, 39.9334] },
    };
    expect(featureBbox(feature)).toEqual([32.8597, 39.9334, 32.8597, 39.9334]);
  });
});

describe("featuresBbox", () => {
  it("unions sample-like features", () => {
    const features: GeoJsonFeature[] = [
      {
        type: "Feature",
        properties: null,
        geometry: { type: "Point", coordinates: [32.8597, 39.9334] },
      },
      {
        type: "Feature",
        properties: null,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [28.5, 40.8],
              [29.2, 40.8],
              [29.2, 41.2],
              [28.5, 41.2],
              [28.5, 40.8],
            ],
          ],
        },
      },
    ];
    expect(featuresBbox(features)).toEqual([28.5, 39.9334, 32.8597, 41.2]);
  });
});
