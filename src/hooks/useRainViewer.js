// useRainViewer.js
// Fetches the latest precipitation radar tile path from the RainViewer public API.
// No API key required for basic tile access.
// Docs: https://www.rainviewer.com/api/weather-maps.html

import { useState, useEffect } from "react";

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";

export const useRainViewer = () => {
  const [radarPath, setRadarPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRadar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(RAINVIEWER_API);
        if (!res.ok) throw new Error("Gagal mengambil data radar.");
        const json = await res.json();

        // Get the most recent radar frame path
        const frames = json?.radar?.past;
        if (!frames || frames.length === 0) {
          throw new Error("Tidak ada frame radar tersedia.");
        }
        const latest = frames[frames.length - 1];
        setRadarPath(latest.path);
      } catch (err) {
        setError(err.message || "Error saat memuat radar.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRadar();
    // Refresh radar every 10 minutes
    const interval = setInterval(fetchRadar, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Returns the full tile URL template for use with react-leaflet TileLayer
  const tileUrl = radarPath
    ? `https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  return { tileUrl, radarPath, isLoading, error };
};
