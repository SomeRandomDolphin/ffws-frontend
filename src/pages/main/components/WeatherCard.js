// WeatherCard.js
// Displays current weather conditions fetched from Open-Meteo for a given station.
// Props: { lat, lon, stationName }

import { useWeather, getWeatherInfo } from "../../../hooks/useWeather";
import Loading from "../../../components/Loading";

const WeatherCard = ({ lat, lon, stationName }) => {
  const { weather, isLoading, error } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <div className="flex min-h-[110px] items-center justify-center rounded-2xl border bg-white p-4 shadow-sm">
        <Loading size="24px" color="#6366f1" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex min-h-[110px] items-center rounded-2xl border bg-white p-4 text-left text-sm text-zinc-500 shadow-sm">
        Data cuaca tidak tersedia.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white px-4 py-4 text-left shadow-sm">
      {/* Header */}
      <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">
        Cuaca Saat Ini · {stationName}
      </p>

      {/* Main row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="space-y-0.5 text-left text-xs text-zinc-500 sm:text-right">
          <p>
            💧 Kelembapan:{" "}
            <span className="font-semibold text-zinc-700">
              {weather.humidity}%
            </span>
          </p>
          <p>
            💨 Angin:{" "}
            <span className="font-semibold text-zinc-700">
              {weather.windspeed} km/j
            </span>
          </p>
          <p>
            🌧️ Presipitasi:{" "}
            <span className="font-semibold text-zinc-700">
              {weather.precipitation} mm
            </span>
          </p>
        </div>
      </div>

      {/* Hourly mini-forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="mt-3 flex gap-3 overflow-x-auto border-t pt-2 pb-0.5">
          {weather.forecast.map((item, itemIndex) => {
            const info = getWeatherInfo(item.code);
            const hour = item.time.slice(11, 16); // "HH:MM"
            const forecastDate = item.time.slice(0, 10);
            const firstDate = weather.forecast[0].time.slice(0, 10);
            const previousDate =
              itemIndex > 0
                ? weather.forecast[itemIndex - 1].time.slice(0, 10)
                : firstDate;
            const startsNewDay =
              forecastDate !== firstDate && forecastDate !== previousDate;
            return (
              <div
                key={item.time}
                className="flex min-w-[48px] flex-col items-center text-center text-xs text-zinc-500"
              >
                <p className="h-4 text-[10px] font-medium text-blue-600">
                  {startsNewDay ? "Besok" : ""}
                </p>
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
