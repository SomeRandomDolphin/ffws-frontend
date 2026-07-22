import { useEffect, useState } from "react";
import { AiOutlineControl, AiOutlineLineChart } from "react-icons/ai";
import { CiImageOn } from "react-icons/ci";
import { FaTableCells } from "react-icons/fa6";
import { IoStatsChart } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import StateMessage from "../../components/StateMessage";
import { useGetData } from "../../hooks/useGetData";
import CrossDesign from "./components/CrossDesign";
import ElevasiMukaAir from "./components/ElevasiMukaAir";
import Graph from "./components/Graph";
import LevelMukaAir from "./components/LevelMukaAir";
import Status from "./components/Status";
import WeatherCard from "./components/WeatherCard";

const STATION_COORDS = {
  Dhompo: [-7.657989032817421, 112.86132803433979],
};

const DASHBOARD_STATIONS = ["Dhompo"];

const PanelTitle = ({ icon: Icon, title, description }) => (
  <div className="text-left">
    <div className="flex items-center gap-3">
      <span className="rounded-full border p-2">
        <Icon />
      </span>
      <h2 className="font-bold">{title}</h2>
    </div>
    {description && <p className="mt-2 text-xs text-zinc-500">{description}</p>}
  </div>
);

const Main = () => {
  const { stasiun } = useParams();
  const navigate = useNavigate();
  const { getStasiunLimitAir } = useGetData();
  const [period, setPeriod] = useState(1);
  const [limits, setLimits] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [aktualAir, setAktualAir] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!DASHBOARD_STATIONS.includes(stasiun)) {
      navigate("/not-found");
      return;
    }

    setPeriod(1);
    setAktualAir(null);
    setChartData([]);
    setLimits(null);

    const load = async () => {
      const limitResponse = await getStasiunLimitAir("def", 1);
      if (limitResponse?.data)
        setLimits([
          Number(limitResponse.data.batas_air_siaga),
          Number(limitResponse.data.batas_air_awas),
        ]);
      setImageSrc(
        `${process.env.PUBLIC_URL || ""}/Gambar_sungai.jpeg`.replace(
          /\/{2,}/g,
          "/",
        ),
      );
    };
    load();
    // Existing data-hook functions are recreated on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, stasiun]);

  const getStatus = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || !limits?.every(Number.isFinite))
      return "Tidak tersedia";
    if (numeric <= limits[0]) return "Aman";
    if (numeric < limits[1]) return "Siaga";
    return "Bahaya";
  };

  const periods = [1, 2, 3, 4, 5];
  const forecastRows = chartData
    .filter(
      (item) => item.aktual == null && Number.isFinite(Number(item.prediksi)),
    )
    .slice(0, 5);
  const selectedForecast = forecastRows[period - 1];
  const prediksiAir = selectedForecast?.prediksi ?? null;
  const hasActual = aktualAir != null && Number.isFinite(Number(aktualAir));
  const hasPrediction =
    prediksiAir != null && Number.isFinite(Number(prediksiAir));

  return (
    <div className="space-y-5 text-left">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            AWLR {stasiun}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Dashboard Monitoring Sungai
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Kondisi aktual dan prediksi muka air pada stasiun {stasiun}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Pilih stasiun
            </p>
            <div
              className="inline-flex w-full rounded-xl border bg-white p-1 shadow-sm sm:w-auto"
              role="group"
              aria-label="Pilih stasiun AWLR"
            >
              {DASHBOARD_STATIONS.map((station) => {
                const active = station === stasiun;
                return (
                  <button
                    key={station}
                    type="button"
                    onClick={() => navigate(`/dashboard/${station}`)}
                    aria-pressed={active}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
                  >
                    {station}
                  </button>
                );
              })}
            </div>
          </div>
          {/* <a
            href="https://api.whatsapp.com/send?phone=34621371153&text=I%20allow%20callmebot%20to%20send%20me%20messages"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Aktifkan notifikasi WhatsApp
          </a> */}
        </div>
      </header>

      <WeatherCard
        lat={STATION_COORDS[stasiun]?.[0]}
        lon={STATION_COORDS[stasiun]?.[1]}
        stationName={stasiun}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <PanelTitle
            icon={IoStatsChart}
            title={`Kondisi Aktual ${stasiun}`}
            description="Informasi muka air terbaru yang diterima sistem."
          />
          {hasActual ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Status value={getStatus(aktualAir)} />
                <ElevasiMukaAir />
                <LevelMukaAir value={aktualAir} />
              </div>
              <CrossDesign levelAir={Number(aktualAir)} />
            </>
          ) : (
            <div className="mt-4">
              <StateMessage
                title="Data aktual belum tersedia"
                message="Grafik akan diperbarui setelah data telemetry berhasil diterima."
              />
            </div>
          )}
        </article>

        <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <PanelTitle
              icon={AiOutlineControl}
              title="Konfigurasi Prediksi"
              description="Pilih horizon prediksi dan lihat visualisasi penampang atau gambar sungai."
            />
            <button
              type="button"
              onClick={() => setShowImage((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              <CiImageOn />
              {showImage ? "Lihat penampang" : "Lihat gambar sungai"}
            </button>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Timestep prediksi
            </p>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-5"
              role="group"
              aria-label="Pilih timestep prediksi"
            >
              {periods.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-lg border px-2 py-2 text-center text-sm transition-colors ${period === value ? "border-blue-700 bg-blue-700 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50"}`}
                >
                  <span className="block font-semibold">+{value} jam</span>
                  <span
                    className={`block text-xs ${period === value ? "text-blue-100" : "text-zinc-500"}`}
                  >
                    {forecastRows[value - 1]?.prediksi ?? "-"} m
                  </span>
                </button>
              ))}
            </div>
          </div>
          {showImage ? (
            <div className="mt-4 overflow-hidden rounded-xl border bg-zinc-50">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={`Kondisi referensi sungai stasiun ${stasiun}`}
                  className="h-[240px] w-full object-contain"
                />
              ) : (
                <StateMessage title="Gambar tidak tersedia" />
              )}
            </div>
          ) : hasPrediction ? (
            <CrossDesign levelAir={Number(prediksiAir)} />
          ) : (
            <div className="mt-4">
              <StateMessage
                title="Prediksi belum tersedia"
                message={`Prediksi timestep +${period} jam belum tersedia.`}
              />
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <article className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <PanelTitle
            icon={AiOutlineLineChart}
            title={`Perkembangan Air Sungai ${stasiun}`}
            description="Perbandingan muka air aktual dengan hasil prediksi."
          />
          <div className="mt-4">
            <Graph
              params={{ daerah: stasiun }}
              setters={{ setAktualAir, setChartData }}
            />
          </div>
        </article>
        <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <PanelTitle
            icon={FaTableCells}
            title="Tabel Prediksi"
            description="Nilai aktual dan prediksi per waktu."
          />
          {chartData.length ? (
            <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Timestep</th>
                    <th className="px-3 py-2 text-left">Waktu</th>
                    <th className="px-3 py-2 text-left">Aktual</th>
                    <th className="px-3 py-2 text-left">Prediksi</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const forecastIndex = forecastRows.indexOf(item);
                    const isSelected = forecastIndex === period - 1;
                    return (
                      <tr
                        key={`${item.tanggal}-${index}`}
                        className={`border-t ${isSelected ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-3 py-2 font-medium">
                          {forecastIndex >= 0
                            ? `+${forecastIndex + 1} jam`
                            : "Aktual"}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2">{item.aktual ?? "-"}</td>
                        <td className="px-3 py-2">{item.prediksi ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4">
              <StateMessage
                title="Tabel belum memiliki data"
                message="Data akan muncul bersama hasil grafik prediksi."
              />
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default Main;
