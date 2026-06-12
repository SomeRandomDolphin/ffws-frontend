import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useGetData } from "../../hooks/useGetData";
import { useInundation } from "../../hooks/useInundation";
import { useRainViewer } from "../../hooks/useRainViewer";
import { useStatistic } from "../../hooks/useStatistic";
import Loading from "../../components/Loading";
import StateMessage from "../../components/StateMessage";

const STATIONS = {
  "AWLR Purwodadi": [-7.80483304165883, 112.74396200866504],
  "AWLR Dhompo": [-7.657989032817421, 112.86132803433979],
  "ARR Cendono": [-7.75797992, 112.69253151],
  "ARR Lawang": [-7.832884, 112.697698],
};

const STATION_LABELS = {
  "AWLR Purwodadi": "right",
  "AWLR Dhompo": "left",
  "ARR Cendono": "left",
  "ARR Lawang": "right",
};

const WATER_COLORS = {
  Aman: "#22c55e",
  Siaga: "#eab308",
  Bahaya: "#dc2626",
  unavailable: "#71717a",
};
const RAIN_COLORS = {
  "Tidak Hujan": "#86efac",
  "Sangat Ringan": "#67e8f9",
  Ringan: "#60a5fa",
  Sedang: "#facc15",
  Lebat: "#fb923c",
  "Sangat Lebat": "#ef4444",
  unavailable: "#71717a",
};

const getWaterStatus = (value, limits) => {
  if (!Number.isFinite(value) || !limits?.every(Number.isFinite))
    return "unavailable";
  if (value <= limits[0]) return "Aman";
  if (value < limits[1]) return "Siaga";
  return "Bahaya";
};

const getRainStatus = (value) => {
  if (!Number.isFinite(value)) return "unavailable";
  if (value >= 20) return "Sangat Lebat";
  if (value >= 10) return "Lebat";
  if (value >= 5) return "Sedang";
  if (value >= 1) return "Ringan";
  if (value >= 0.1) return "Sangat Ringan";
  return "Tidak Hujan";
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const makeMarkerIcon = ({ name, data, color, imageUrl }) => {
  const isWaterStation = name.startsWith("AWLR");
  const detail =
    data.status === "unavailable"
      ? "Data tidak tersedia"
      : `${data.status} · ${data.value} ${isWaterStation ? "m" : "mm"}`;
  const labelSide = STATION_LABELS[name];

  return L.divIcon({
    className: "station-marker",
    html: `
        <div class="station-marker__content station-marker__content--${labelSide}">
          <div class="station-marker__pin" style="border-color:${color}">
            <img src="${imageUrl}" alt="" />
          </div>
          <div class="station-marker__label">
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(detail)}</span>
          </div>
        </div>
      `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
};

const SimulationCard = ({ title, station, src }) => {
  const [failed, setFailed] = useState(false);
  return (
    <article className="overflow-hidden rounded-xl border bg-white">
      <div className="border-b px-4 py-3 text-left">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-zinc-500">
          Stasiun {station} · visualisasi referensi, bukan data langsung
        </p>
      </div>
      {failed ? (
        <div className="p-4">
          <StateMessage
            title="Animasi tidak dapat ditampilkan"
            message="Berkas referensi tersedia secara lokal, tetapi gagal dimuat oleh browser."
          />
        </div>
      ) : (
        <img
          src={src}
          onError={() => setFailed(true)}
          alt={`Animasi referensi penelusuran banjir ${title}`}
          className="aspect-video w-full bg-zinc-100 object-contain"
        />
      )}
    </article>
  );
};

const MapPage = () => {
  const navigate = useNavigate();
  const [stationData, setStationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [showInundation, setShowInundation] = useState(false);
  const [baseLayer, setBaseLayer] = useState("street");
  const [mapInstance, setMapInstance] = useState(null);
  const { getChartData } = useStatistic();
  const { getStasiunLimitAir, getSensorHistory } = useGetData();
  const {
    tileUrl: radarTileUrl,
    radarTimestamp,
    isLoading: radarLoading,
    error: radarError,
    retry: retryRadar,
  } = useRainViewer();
  const { geoJsonData, isLoading: inundationLoading } = useInundation();

  const loadStations = async () => {
    setLoading(true);
    const results = await Promise.all(
      Object.keys(STATIONS).map(async (name) => {
        const [type, station] = name.split(" ");
        if (type === "AWLR") {
          const [chart, limit] = await Promise.all([
            getChartData(
              "def",
              station === "Dhompo" ? "lstm" : "gru",
              station,
              5,
            ),
            getStasiunLimitAir("def", station === "Dhompo" ? 1 : 2),
          ]);
          const actual = chart?.data
            ?.filter((row) => Number.isFinite(Number(row.aktual)))
            .at(-1)?.aktual;
          const limits = limit?.data
            ? [
                Number(limit.data.batas_air_siaga),
                Number(limit.data.batas_air_awas),
              ]
            : null;
          const value = actual == null ? null : Number(actual);
          return [name, { value, status: getWaterStatus(value, limits) }];
        }
        const response = await getSensorHistory("def", 0, 1, station);
        const row = response?.data?.history?.[0];
        const raw =
          station === "Cendono"
            ? row?.curah_hujan_cendono
            : row?.curah_hujan_lawang;
        const value = raw == null ? null : Number(raw);
        return [name, { value, status: getRainStatus(value) }];
      }),
    );
    setStationData(Object.fromEntries(results));
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
    // Existing data-hook functions are recreated on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publicAsset = (file) =>
    `${process.env.PUBLIC_URL || ""}/${file}`.replace(/\/{2,}/g, "/");

  const stationImageUrl = publicAsset("station-river.svg");

  const markerIcons = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(STATIONS).map((name) => {
          const status = stationData[name]?.status || "unavailable";
          const color = name.startsWith("AWLR")
            ? WATER_COLORS[status]
            : RAIN_COLORS[status];
          return [
            name,
            makeMarkerIcon({
              name,
              data: stationData[name] || { status: "unavailable", value: null },
              color,
              imageUrl: stationImageUrl,
            }),
          ];
        }),
      ),
    [stationData, stationImageUrl],
  );

  const fitBasin = () =>
    mapInstance?.fitBounds(L.latLngBounds(Object.values(STATIONS)), {
      padding: [35, 35],
      maxZoom: 12,
    });

  const radarTime = radarTimestamp
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(radarTimestamp * 1000))
    : null;

  const controlClass = (active, color = "zinc") => {
    const activeClasses = {
      zinc: "border-zinc-900 bg-zinc-900 text-white",
      blue: "border-blue-600 bg-blue-600 text-white",
      indigo: "border-indigo-600 bg-indigo-600 text-white",
    };
    const inactiveClasses = {
      zinc: "border-zinc-300 text-zinc-700 hover:bg-zinc-50",
      blue: "border-blue-300 text-blue-700 hover:bg-blue-50",
      indigo: "border-indigo-300 text-indigo-700 hover:bg-indigo-50",
    };
    return `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? activeClasses[color] : inactiveClasses[color]}`;
  };

  return (
    <div className="space-y-5 text-left">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          DAS Welang
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Flood Forecasting and Warning System
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Klik titik stasiun untuk membuka data monitoring, riwayat hujan, dan
          hasil prediksi.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <button
            type="button"
            onClick={() => setBaseLayer("street")}
            className={controlClass(baseLayer === "street")}
            aria-pressed={baseLayer === "street"}
          >
            Peta Jalan
          </button>
          <button
            type="button"
            onClick={() => setBaseLayer("topography")}
            className={controlClass(baseLayer === "topography")}
            aria-pressed={baseLayer === "topography"}
          >
            Topografi / DEM
          </button>
          <button
            type="button"
            onClick={() => setShowRadar((value) => !value)}
            disabled={radarLoading || Boolean(radarError)}
            className={`${controlClass(showRadar, "blue")} disabled:cursor-not-allowed disabled:opacity-50`}
            aria-pressed={showRadar}
          >
            {radarLoading
              ? "Memuat radar..."
              : showRadar
                ? "Sembunyikan Radar BMKG"
                : "Tampilkan Radar BMKG"}
          </button>
          <button
            type="button"
            onClick={() => setShowInundation((value) => !value)}
            disabled={inundationLoading}
            className={`${controlClass(showInundation, "indigo")} disabled:opacity-50`}
            aria-pressed={showInundation}
          >
            {showInundation
              ? "Sembunyikan Genangan Demo"
              : "Tampilkan Genangan Demo"}
          </button>
          <div className="radar-info relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold text-zinc-600 hover:bg-zinc-50"
              aria-label="Informasi sumber dan cakupan radar"
            >
              i
            </button>
            <div className="radar-info__content" role="tooltip">
              Data radar Indonesia berasal dari BMKG dan ditampilkan melalui
              tile RainViewer. Area kosong dapat berarti tidak ada hujan atau
              cakupan radar tidak tersedia.
            </div>
          </div>
          {showRadar && radarTime && (
            <p className="text-xs text-zinc-500">
              Frame radar: {radarTime} WIB
            </p>
          )}
          {loading && (
            <div className="ml-auto">
              <Loading size="22px" color="#18181b" />
            </div>
          )}
        </div>
        {radarError && (
          <div className="p-4">
            <StateMessage
              tone="error"
              title="Radar tidak tersedia"
              message={radarError}
              onAction={retryRadar}
            />
          </div>
        )}
        {showInundation && (
          <p className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">
            <strong>Demo:</strong> batas genangan bersifat perkiraan dan bukan
            hasil hidraulik tervalidasi.
          </p>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={fitBasin}
            className="absolute bottom-5 left-3 z-[1000] rounded-lg border bg-white px-3 py-2 text-xs font-semibold shadow hover:bg-zinc-50"
          >
            Lihat seluruh DAS
          </button>
          <MapContainer
            ref={setMapInstance}
            center={[-7.764863, 112.760337]}
            zoom={11}
            maxZoom={18}
            scrollWheelZoom
            className="h-[62vh] min-h-[430px] w-full sm:h-[68vh]"
          >
            {baseLayer === "street" ? (
              <TileLayer
                key="street"
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                key="topography"
                attribution="&copy; OpenTopoMap contributors"
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            )}
            {showRadar && radarTileUrl && (
              <TileLayer
                url={radarTileUrl}
                opacity={0.6}
                maxNativeZoom={7}
                maxZoom={18}
                attribution='Radar Indonesia: <a href="https://www.bmkg.go.id/">BMKG</a> · Tiles: <a href="https://www.rainviewer.com/">RainViewer</a>'
                zIndex={500}
              />
            )}
            {showInundation && geoJsonData && (
              <GeoJSON
                data={geoJsonData}
                style={(feature) => ({
                  color: feature?.properties?.color || "#3b82f6",
                  fillColor: feature?.properties?.fillColor || "#93c5fd",
                  fillOpacity: 0.4,
                  weight: 2,
                })}
                onEachFeature={(feature, layer) =>
                  feature.properties?.name &&
                  layer.bindPopup(
                    `<b>${feature.properties.name}</b><br/>${feature.properties.description || ""}`,
                  )
                }
              />
            )}
            {!loading &&
              Object.entries(STATIONS).map(([name, position]) => {
                const destination = name.startsWith("AWLR")
                  ? `/dashboard/${name.split(" ")[1]}`
                  : `/history/${name.split(" ")[1]}`;
                return (
                  <Marker
                    key={name}
                    position={position}
                    icon={markerIcons[name]}
                    eventHandlers={{
                      click: (event) => {
                        if (event.originalEvent) {
                          L.DomEvent.stopPropagation(event.originalEvent);
                          L.DomEvent.preventDefault(event.originalEvent);
                        }
                        navigate(destination);
                      },
                    }}
                  />
                );
              })}
          </MapContainer>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Simulasi Penelusuran Banjir DAS Welang
            </h2>
            <p className="text-sm text-zinc-500">
              Arsip visual lokal. Bukan simulasi interaktif atau kondisi waktu
              nyata.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SimulationCard
              title="Hulu"
              station="Purwodadi"
              src={publicAsset("Hulu.gif")}
            />
            <SimulationCard
              title="Hilir"
              station="Dhompo"
              src={publicAsset("Hilir.gif")}
            />
          </div>
        </div>
        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Keterangan Peta</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="mb-2 font-semibold">Status muka air</p>
              {Object.entries(WATER_COLORS).map(([label, color]) => (
                <div key={label} className="mb-1 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: color }}
                  />
                  <span>
                    {label === "unavailable" ? "Data tidak tersedia" : label}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 font-semibold">Intensitas hujan</p>
              {Object.entries(RAIN_COLORS).map(([label, color]) => (
                <div key={label} className="mb-1 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ background: color }}
                  />
                  <span>
                    {label === "unavailable" ? "Data tidak tersedia" : label}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 text-xs text-zinc-500">
              <p>AWLR: muka air sungai</p>
              <p>ARR: curah hujan</p>
              <p>Hulu: Purwodadi · Hilir: Dhompo</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default MapPage;
