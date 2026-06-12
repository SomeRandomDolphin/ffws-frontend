import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import PrediksiTable from "./components/PrediksiTable";
import SensorTable from "./components/SensorTable";

const History = () => {
  const [view, setView] = useState("sensor");
  const { stasiun } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!["Cendono", "Lawang"].includes(stasiun)) navigate("/not-found");
  }, [navigate, stasiun]);

  return (
    <div className="space-y-5 text-left">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Stasiun ARR {stasiun}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Riwayat Data</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tinjau data sensor hujan dan hasil prediksi yang tersimpan.
        </p>
      </header>
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
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
          <SensorTable user={user} stasiun={stasiun} />
        ) : (
          <PrediksiTable user={user} />
        )}
      </section>
    </div>
  );
};

export default History;
