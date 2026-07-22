import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import PrediksiTable from "./components/PrediksiTable";
import SensorTable from "./components/SensorTable";
import { WATER_LEVEL_STATIONS, stationLabel } from "../../config/stations";

const History = () => {
  const [view, setView] = useState("sensor");
  const { stasiun } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const validStation = WATER_LEVEL_STATIONS.some(
    ([, slug]) => slug === stasiun,
  );

  useEffect(() => {
    if (!validStation) navigate("/not-found");
  }, [navigate, validStation]);

  if (!validStation) return null;

  return (
    <div className="space-y-5 text-left">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Stasiun AWLR {stationLabel(stasiun)}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Riwayat Data</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tinjau data muka air dan hasil prediksi yang tersimpan.
        </p>
      </header>
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <label
          htmlFor="history-station"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
        >
          Pilih stasiun
        </label>
        <select
          id="history-station"
          value={stasiun}
          onChange={(event) => navigate(`/history/${event.target.value}`)}
          className="mb-4 w-full rounded-lg border bg-white px-3 py-2 text-sm sm:w-64"
        >
          {WATER_LEVEL_STATIONS.map(([label, slug]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>
        <div
          className="inline-flex rounded-xl bg-zinc-100 p-1"
          role="tablist"
          aria-label="Jenis riwayat"
        >
          {[
            ["sensor", "Sensor"],
            ["prediksi", "Prediksi"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "sensor" ? (
          <SensorTable key={stasiun} user={user} stasiun={stasiun} />
        ) : (
          <PrediksiTable key={stasiun} user={user} stasiun={stasiun} />
        )}
      </section>
    </div>
  );
};

export default History;
