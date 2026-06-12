import { MapContainer, TileLayer, Marker, LayersControl, GeoJSON } from "react-leaflet";
import { useState, useMemo, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useStatistic } from "../../hooks/useStatistic";
import { useGetData } from "../../hooks/useGetData";
import { useRainViewer } from "../../hooks/useRainViewer";
import { useInundation } from "../../hooks/useInundation";

const MarkerCustom = ({ text, color }) => {
  const navigate = useNavigate();
  const handleNavigate = (e) => {
    if (e) {
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      if (typeof e.preventDefault === "function") e.preventDefault();
    }
    if (text.startsWith("AWLR") || text.startsWith("awlr")) {
      navigate(`/dashboard/${text.split(" ")[1]}`);
    } else {
      navigate(`/history/${text.split(" ")[1]}`);
    }
  };
  return (
    <div
      onClick={handleNavigate}
      className="flex items-center font-semibold w-fit px-3 h-[50px] cursor-pointer group"
    >
      <div className="w-[30px] h-[30px] rounded-full overflo-hidden shadow border border-blue-700 mr-2">
        <img
          src="https://cdn-icons-png.flaticon.com/512/119/119573.png"
          alt="ICN"
          className="w-full h-full object-cover"
        />
      </div>
      <p
        className={`${text.startsWith("AWLR") ? "rounded-full" : ""} ${color} px-3 text-lg whitespace-nowrap`}
      >
        {text}
      </p>
    </div>
  );
};

const curahHujanLevels = {
  "Tidak Hujan": "bg-green-200 group-hover:bg-green-400",
  "Sangat Ringan": "bg-aqua-400 group-hover:bg-aqua-600",
  Ringan: "bg-blue-400 group-hover:bg-blue-600",
  Sedang: "bg-yellow-400 group-hover:bg-yellow-600",
  Lebat: "bg-orange-400 group-hover:bg-orange-600",
  "Sangat Lebat": "bg-red-400 group-hover:bg-red-600",
};

const EnhancedMarker = ({
  eventHandlers,
  icon: providedIcon,
  ...otherProps
}) => {
  const [markerRendered, setMarkerRendered] = useState(false);
  const id = "marker-" + useId();

  const icon = useMemo(
    () =>
      L.divIcon({
        html: `<div id="${id}"></div>`,
        className: "dummy",
      }),
    [id],
  );

  return (
    <>
      <Marker
        {...otherProps}
        eventHandlers={{
          ...eventHandlers,
          add: (...args) => {
            setMarkerRendered(true);
            if (eventHandlers?.add) eventHandlers.add(...args);
          },
          remove: (...args) => {
            setMarkerRendered(false);
            if (eventHandlers?.remove) eventHandlers.remove(...args);
          },
        }}
        icon={icon}
      />
      {markerRendered &&
        createPortal(providedIcon, document.getElementById(id))}
    </>
  );
};

const Map = () => {
  const stasiun = {
    "AWLR Purwodadi": [-7.80483304165883, 112.74396200866504],
    "AWLR Dhompo": [-7.657989032817421, 112.86132803433979],
    "ARR Cendono": [-7.75797992, 112.69253151],
    "ARR Lawang": [-7.832884, 112.697698],
  };
  const defaultProps = {
    center: {
      lat: -7.764863,
      lng: 112.760337,
    },
    zoom: 11,
  };

  const colorMapStatus = {
    Aman: "bg-green-400 group-hover:bg-green-500",
    Siaga: "bg-yellow-400 group-hover:bg-yellow-500",
    Bahaya: "bg-red-400 group-hover:bg-red-500",
    Undefined: "bg-white",
  };

  const colorMapCurahHujan = {
    "Tidak Hujan": "bg-green-200 group-hover:bg-green-400",
    "Sangat Ringan": "bg-aqua-400 group-hover:bg-aqua-600",
    Ringan: "bg-blue-400 group-hover:bg-blue-600",
    Sedang: "bg-yellow-400 group-hover:bg-yellow-600",
    Lebat: "bg-orange-400 group-hover:bg-orange-600",
    "Sangat Lebat": "bg-red-400 group-hover:bg-red-600",
  };

  const getStatus = (value, stasiunLimitAir) => {
    if (!stasiunLimitAir) {
      return "Undefined";
    }
    return value <= stasiunLimitAir[0]
      ? "Aman"
      : value > stasiunLimitAir[0] && value < stasiunLimitAir[1]
        ? "Siaga"
        : value >= stasiunLimitAir[1]
          ? "Bahaya"
          : "Undefined";
  };

  const getStatusCurahHujan = (value) => {
    if (value >= 20) return "Sangat Lebat";
    else if (value >= 10) return "Lebat";
    else if (value >= 5) return "Sedang";
    else if (value >= 1) return "Ringan";
    else if (value >= 0.1) return "Sangat Ringan";
    else return "Tidak Hujan";
  };

  const [loading, setIsLoading] = useState(true);
  const [aktualData, setAktualData] = useState({});
  const [limitAir, setLimitAir] = useState({});
  const [showRadar, setShowRadar] = useState(false);
  const [showInundation, setShowInundation] = useState(false);
  const { getChartData } = useStatistic();
  const { getStasiunLimitAir, getSensorHistory } = useGetData();
  const { tileUrl: radarTileUrl, isLoading: radarLoading } = useRainViewer();
  const { geoJsonData, isLoading: inundationLoading } = useInundation();


  useEffect(() => {
    const loadData = async () => {
      const stationNames = Object.keys(stasiun);
      const data = await Promise.all(
        stationNames.map(async (item) => {
          const [typ, stasiunName] = item.split(" ");

          // check if awlr or arr
          if (typ === "AWLR") {
            const res = await getChartData(
              "def",
              stasiunName === "Dhompo" ? "lstm" : "gru",
              stasiunName,
              5,
            );
            const resLimitAir = await getStasiunLimitAir(
              "def",
              stasiunName === "Dhompo" ? 1 : 2,
            );
            const { batas_air_siaga, batas_air_awas } = resLimitAir?.data || {
              batas_air_siaga: -1,
              batas_air_awas: -1,
            };
            let newLimitAir = limitAir;
            newLimitAir[item] = [batas_air_siaga, batas_air_awas];
            setLimitAir(newLimitAir);

            let aktual = -1;
            if (res && Array.isArray(res.data)) {
              res.data.forEach((item) => {
                if (item.aktual) {
                  aktual = item.aktual;
                }
              });
            }
            // set the actual data
            let newData = aktualData;
            newData[item] = aktual;
            setAktualData(newData);
          } else {
            let res = await getSensorHistory("def", 0, 1, stasiunName);
            let curah_hujan = 0;
            if (res && res.data && Array.isArray(res.data.history) && res.data.history.length > 0) {
              const historyItem = res.data.history[0];
              curah_hujan =
                stasiunName === "Cendono"
                  ? historyItem.curah_hujan_cendono
                  : historyItem.curah_hujan_lawang;
            }

            let newData = aktualData;
            newData[item] = curah_hujan;
            setAktualData(newData);
          }
        }),
      );

      setIsLoading(false);
    };

    // call the functions
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="text-left">
        <p className="text-3xl font-semibold text-left my-3">
          FLOOD FORECASTING AND WARNING SYSTEM
        </p>
        <p className="text-sm italic mb-5">
          Sistem Peramalan dan Peringatan Banjir
        </p>
      </div>
      <p className="text-sm text-black italic mt-5 font-semibold">
        Petunjuk : untuk melihat peramalan dan peringatan dini di stasiun
        monitoring, silakan klik titik stasiun monitoring yang diinginkan
      </p>
      {/* Map Layer Toggle Buttons */}
      <div className="flex gap-2 my-2 flex-wrap">
        <button
          onClick={() => setShowRadar((v) => !v)}
          disabled={radarLoading}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            showRadar
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-blue-600 border-blue-400 hover:bg-blue-50"
          } ${radarLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          🌧️ {showRadar ? "Sembunyikan Radar" : "Tampilkan Radar BMKG"}
        </button>
        <button
          onClick={() => setShowInundation((v) => !v)}
          disabled={inundationLoading}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
            showInundation
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-indigo-600 border-indigo-400 hover:bg-indigo-50"
          } ${inundationLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          🌊 {showInundation ? "Sembunyikan Genangan" : "Tampilkan Peta Genangan"}
        </button>
      </div>
      <div className="w-full">
        <MapContainer
          center={[defaultProps.center.lat, defaultProps.center.lng]}
          zoom={defaultProps.zoom}
          scrollWheelZoom={false}
          style={{ height: "50vh" }}
        >
          {/* DEM Layer Control — switches between Street Map and Topography */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Peta Jalan (OpenStreetMap)">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topografi / DEM (OpenTopoMap)">
              <TileLayer
                attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Radar Overlay — RainViewer live precipitation tiles */}
          {showRadar && radarTileUrl && (
            <TileLayer
              url={radarTileUrl}
              opacity={0.6}
              attribution='Radar &copy; <a href="https://www.rainviewer.com">RainViewer</a>'
              zIndex={500}
            />
          )}

          {/* Inundation GeoJSON — demo flood zone polygons */}
          {showInundation && geoJsonData && (
            <GeoJSON
              key={JSON.stringify(geoJsonData)}
              data={geoJsonData}
              style={(feature) => ({
                color: feature?.properties?.color ?? "#3b82f6",
                fillColor: feature?.properties?.fillColor ?? "#93c5fd",
                fillOpacity: 0.4,
                weight: 2,
              })}
              onEachFeature={(feature, layer) => {
                if (feature.properties?.name) {
                  layer.bindPopup(
                    `<b>${feature.properties.name}</b><br/>${feature.properties.description ?? ""}`
                  );
                }
              }}
            />
          )}

          {!loading &&
            Object.keys(stasiun).map((item, i) => (
              <EnhancedMarker
                position={stasiun[item]}
                key={i}
                icon={
                  item.startsWith("ARR") ? (
                    <MarkerCustom
                      text={item}
                      color={
                        colorMapCurahHujan[
                          getStatusCurahHujan(aktualData[item])
                        ]
                      }
                    />
                  ) : (
                    <MarkerCustom
                      text={item}
                      color={
                        colorMapStatus[
                          getStatus(aktualData[item], limitAir[item])
                        ]
                      }
                    />
                  )
                }
              />
            ))}
        </MapContainer>
      </div>
      <div className="flex flex-row">
        <div className="w-[80%]">
          <p className="text-lg font-semibold">
            {" "}
            Simulasi penelusuran banjir DAS Welang
          </p>
          <div className="flex flex-row">
            <div className="w-[50%]">
              <img
                src="https://sih3.dpuair.jatimprov.go.id/ffwsview/Hilir.gif"
                alt=""
                className="w-full object-contain"
              />
            </div>
            <div className="w-[50%]">
              <img
                src="https://sih3.dpuair.jatimprov.go.id/ffwsview/Hulu.gif"
                alt=""
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="font-semibold py-3">Keterangan pada Peta</p>
          <div className="flex items-center">
            <p>Hilir = Dhompo</p>
          </div>
          <div className="flex items-center">
            <p>Hulu = Purwodadi</p>
          </div>
          <div className="flex items-center">
            <div className="w-[50px] h-[20px] border-2 border-black mx-1"></div>
            <p> = Curah Hujan</p>
          </div>
          <div className="flex items-center my-3">
            <div className="w-[50px] h-[20px] border-2 rounded-full border-black mx-1"></div>
            <p> = Air Sungai</p>
          </div>
          {Object.entries(curahHujanLevels).map(([level, className]) => (
            <div key={level} className="flex items-center my-3">
              <div
                className={`w-[50px] h-[20px] border-2 ${level} border-black mx-1 ${className}`}
              ></div>
              <p className="text-sm">{`= ${level}`}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Map;
