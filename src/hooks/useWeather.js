// useWeather.js
// Fetches current weather and a 2-day hourly forecast from Open-Meteo.
// API Docs: https://open-meteo.com/en/docs
// Usage: const { weather, isLoading, error } = useWeather(lat, lon);

import { useState, useEffect } from "react";

// WMO Weather Code → human label + emoji mapping
// https://open-meteo.com/en/docs#weathervariables
const WMO_CODES = {
  0: { label: "Cerah", emoji: "☀️" },
  1: { label: "Cerah Berawan", emoji: "🌤️" },
  2: { label: "Berawan Sebagian", emoji: "⛅" },
  3: { label: "Berawan", emoji: "☁️" },
  45: { label: "Berkabut", emoji: "🌫️" },
  48: { label: "Berkabut (Beku)", emoji: "🌫️" },
  51: { label: "Gerimis Ringan", emoji: "🌦️" },
  53: { label: "Gerimis Sedang", emoji: "🌦️" },
  55: { label: "Gerimis Lebat", emoji: "🌧️" },
  61: { label: "Hujan Ringan", emoji: "🌧️" },
  63: { label: "Hujan Sedang", emoji: "🌧️" },
  65: { label: "Hujan Lebat", emoji: "🌧️" },
  71: { label: "Salju Ringan", emoji: "🌨️" },
  73: { label: "Salju Sedang", emoji: "🌨️" },
  75: { label: "Salju Lebat", emoji: "❄️" },
  77: { label: "Butiran Salju", emoji: "❄️" },
  80: { label: "Hujan Deras Ringan", emoji: "⛈️" },
  81: { label: "Hujan Deras Sedang", emoji: "⛈️" },
  82: { label: "Hujan Deras Kuat", emoji: "⛈️" },
  85: { label: "Hujan Salju", emoji: "🌨️" },
  86: { label: "Hujan Salju Lebat", emoji: "🌨️" },
  95: { label: "Badai Petir", emoji: "⛈️" },
  96: { label: "Badai Petir + Hujan Es", emoji: "⛈️" },
  99: { label: "Badai Petir + Hujan Es Lebat", emoji: "⛈️" },
};

export const getWeatherInfo = (code) =>
  WMO_CODES[code] ?? { label: "Tidak Diketahui", emoji: "❓" };

export const useWeather = (lat, lon) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m,precipitation` +
          `&hourly=temperature_2m,weathercode,precipitation_probability` +
          `&forecast_days=2` +
          `&timezone=Asia%2FJakarta`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Gagal mengambil data cuaca.");
        const json = await res.json();

        const current = json.current;
        // Build a 12-hour preview beginning at the current forecast hour.
        const nowIndex = json.hourly.time.findIndex(
          (t) => t >= json.current.time.slice(0, 13),
        );
        const forecastStart = nowIndex >= 0 ? nowIndex : 0;
        const forecast = json.hourly.time
          .slice(forecastStart, forecastStart + 12)
          .map((time, i) => ({
            time,
            temp: json.hourly.temperature_2m[forecastStart + i],
            code: json.hourly.weathercode[forecastStart + i],
            rain_prob: json.hourly.precipitation_probability[forecastStart + i],
          }));

        setWeather({
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          windspeed: current.windspeed_10m,
          precipitation: current.precipitation,
          code: current.weathercode,
          ...getWeatherInfo(current.weathercode),
          forecast,
        });
      } catch (err) {
        setError(err.message || "Error saat memuat cuaca.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  return { weather, isLoading, error };
};
