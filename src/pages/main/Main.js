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
  Purwodadi: [-7.80483304165883, 112.74396200866504],
  Dhompo: [-7.657989032817421, 112.86132803433979],
};

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
  const { getStasiunLimitAir, getSensorHistory } = useGetData();
  const [period, setPeriod] = useState(1);
  const [limits, setLimits] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [aktualAir, setAktualAir] = useState(null);
  const [prediksiAir, setPrediksiAir] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!["Dhompo", "Purwodadi"].includes(stasiun)) {
      navigate("/not-found");
      return;
    }
    const load = async () => {
      const [limitResponse, rainResponse] = await Promise.all([
        getStasiunLimitAir("def", stasiun === "Dhompo" ? 1 : 2),
        getSensorHistory("def", 0, 1, "Cendono"),
      ]);
      if (limitResponse?.data)
        setLimits([
          Number(limitResponse.data.batas_air_siaga),
          Number(limitResponse.data.batas_air_awas),
        ]);
      const rain = Number(
        rainResponse?.data?.history?.[0]?.curah_hujan_cendono,
      );
      let rounded = null;
      if (Number.isFinite(rain) && rain >= 3)
        rounded =
          rain < 50 ? Math.ceil(rain / 5) * 5 : Math.ceil(rain / 10) * 10;
      const file =
        rounded >= 5 && rounded <= 100
          ? `R${rounded}mm.jpg`
          : "Gambar_sungai.jpeg";
      setImageSrc(
        `${process.env.PUBLIC_URL || ""}/${file}`.replace(/\/{2,}/g, "/"),
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

  const periods = stasiun === "Dhompo" ? [1, 2, 3, 4, 5] : [1, 2, 3];
  const hasActual = Number.isFinite(Number(aktualAir));
  const hasPrediction = Number.isFinite(Number(prediksiAir));

  return (
    <div className="space-y-5 text-left">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <a
          href="https://api.whatsapp.com/send?phone=34621371153&text=I%20allow%20callmebot%20to%20send%20me%20messages"
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Aktifkan notifikasi WhatsApp
        </a>
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
            <label
              htmlFor="period"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Periode prediksi
            </label>
            <select
              id="period"
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm sm:w-48"
            >
              {periods.map((value) => (
                <option key={value} value={value}>
                  {value} jam
                </option>
              ))}
            </select>
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
                message="Pilih periode lain atau coba kembali setelah data prediksi diperbarui."
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
              params={{
                model: stasiun === "Dhompo" ? "LSTM" : "GRU",
                daerah: stasiun,
                periode: period,
              }}
              setters={{ setAktualAir, setPrediksiAir, setChartData }}
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
                    <th className="px-3 py-2 text-left">Waktu</th>
                    <th className="px-3 py-2 text-left">Aktual</th>
                    <th className="px-3 py-2 text-left">Prediksi</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={`${item.tanggal}-${index}`} className="border-t">
                      <td className="px-3 py-2">
                        {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">{item.aktual ?? "-"}</td>
                      <td className="px-3 py-2">{item.prediksi ?? "-"}</td>
                    </tr>
                  ))}
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
