// WeatherCard.js
// Displays current weather conditions fetched from Open-Meteo for a given station.
// Props: { lat, lon, stationName }

import { useWeather, getWeatherInfo } from "../../../hooks/useWeather";
import Loading from "../../../components/Loading";

const WeatherCard = ({ lat, lon, stationName }) => {
  const { weather, isLoading, error } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 shadow bg-white flex items-center justify-center min-h-[90px]">
        <Loading size="24px" color="#6366f1" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-md border p-4 shadow bg-white text-xs text-zinc-400 italic text-left min-h-[90px] flex items-center">
        Data cuaca tidak tersedia.
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow bg-white px-4 py-3 text-left min-w-[230px]">
      {/* Header */}
      <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
        Cuaca Saat Ini · {stationName}
      </p>

      {/* Main row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{weather.emoji}</span>
          <div>
            <p className="text-2xl font-bold leading-none">
              {weather.temp}
              <span className="text-sm font-normal">°C</span>
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{weather.label}</p>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="text-right text-xs text-zinc-500 space-y-0.5">
          <p>💧 Kelembapan: <span className="font-semibold text-zinc-700">{weather.humidity}%</span></p>
          <p>💨 Angin: <span className="font-semibold text-zinc-700">{weather.windspeed} km/j</span></p>
          <p>🌧️ Presipitasi: <span className="font-semibold text-zinc-700">{weather.precipitation} mm</span></p>
        </div>
      </div>

      {/* Hourly mini-forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="mt-3 pt-2 border-t flex gap-3 overflow-x-auto pb-0.5">
          {weather.forecast.map((item, i) => {
            const info = getWeatherInfo(item.code);
            const hour = item.time.slice(11, 16); // "HH:MM"
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center min-w-[40px] text-xs text-zinc-500"
              >
                <p className="font-medium text-zinc-600">{hour}</p>
                <span className="text-base my-0.5">{info.emoji}</span>
                <p className="font-semibold text-zinc-700">{item.temp}°</p>
                {item.rain_prob > 0 && (
                  <p className="text-blue-500">{item.rain_prob}%</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
