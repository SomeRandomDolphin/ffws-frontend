// useInundation.js
// Provides GeoJSON flood inundation polygon data for the Welang River Basin.
//
// ⚠️  DEMO MODE: Currently returns static/hardcoded GeoJSON polygons approximating
// the estimated flood-prone zones along the Welang River between Purwodadi and Dhompo.
//
// TODO: Replace static data with a live backend API call once the BE exposes
// a GeoJSON endpoint such as: GET /api/inundation/zones?level=<water_level>
//
// Usage: const { geoJsonData, isLoading, error } = useInundation();

import { useState, useEffect } from "react";

// Static GeoJSON demo — approximate flood inundation zones for the Welang River Basin.
// Polygons were manually drawn based on topographic knowledge of the DAS Welang watershed.
// Colors: blue = moderate risk zone, red = high risk zone.
const STATIC_INUNDATION_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Zona Genangan Hilir (Dhompo)",
        description: "Area rawan banjir di sekitar AWLR Dhompo (estimasi)",
        color: "#ef4444",
        fillColor: "#fca5a5",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [112.845, -7.640],
            [112.870, -7.640],
            [112.878, -7.658],
            [112.875, -7.672],
            [112.858, -7.680],
            [112.840, -7.672],
            [112.835, -7.658],
            [112.845, -7.640],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Zona Genangan Hulu (Purwodadi)",
        description: "Area rawan banjir di sekitar AWLR Purwodadi (estimasi)",
        color: "#3b82f6",
        fillColor: "#93c5fd",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [112.728, -7.788],
            [112.755, -7.788],
            [112.762, -7.800],
            [112.760, -7.818],
            [112.745, -7.825],
            [112.728, -7.818],
            [112.722, -7.800],
            [112.728, -7.788],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        name: "Koridor Sungai Welang",
        description: "Jalur utama aliran Sungai Welang — buffer banjir 500m",
        color: "#6366f1",
        fillColor: "#a5b4fc",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [112.692, -7.760],
            [112.700, -7.756],
            [112.730, -7.760],
            [112.760, -7.770],
            [112.790, -7.775],
            [112.820, -7.770],
            [112.850, -7.760],
            [112.870, -7.655],
            [112.865, -7.650],
            [112.848, -7.758],
            [112.820, -7.763],
            [112.790, -7.768],
            [112.760, -7.763],
            [112.730, -7.753],
            [112.700, -7.749],
            [112.692, -7.760],
          ],
        ],
      },
    },
  ],
};

export const useInundation = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate async load — swap this for a real API fetch when backend is ready:
    // const res = await fetch(`${process.env.REACT_APP_ENDPOINT}inundation/zones`);
    // const json = await res.json();
    // setGeoJsonData(json);
    try {
      setGeoJsonData(STATIC_INUNDATION_GEOJSON);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { geoJsonData, isLoading, error };
};
