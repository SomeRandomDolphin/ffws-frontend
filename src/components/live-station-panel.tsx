"use client";
import { useState } from "react";
import { formatSensorLabel, liveTime, type LiveStation } from "@/lib/surabaya";
import { stationInformation } from "@/lib/station-information";
import type { ArchiveSeries } from "@/lib/monitoring";
import { useArchive } from "./use-archive";
import StationPreview from "./station-preview";
import ShadowForecast, { type Forecast } from "./shadow-forecast";

export default function LiveStationPanel({ station, disconnected = false }: { station: LiveStation; disconnected?: boolean }) {
  const coordinateSource = stationInformation(station.name).coordinateSourceUrl;
  const [selected, setSelected] = useState("");
  const sensor = station.sensors.find(item => item.id === selected) ?? station.sensors[0];
  const groundReferenceCm = sensor?.referenceCm ?? null;
  const { data: archiveHistory, error: historyError } = useArchive<{ series: ArchiveSeries[] }>(sensor ? `stations/${station.id}/history?hours=24&sensor=${encodeURIComponent(sensor.id)}` : null);
  const historySeries = archiveHistory?.series.find(item => item.sensor === sensor?.id);
  const historyPoints = historySeries?.points ?? [];
  const history = historyPoints.map(point => ({ time: Date.parse(point.time), value: point.waterLevelCm ?? null, range: point.waterLevelRangeCm }));
  // Raw reading, reference and calibrated water level are supplied by the API.
  const sensorDistanceCm = sensor?.valueCm ?? null;
  const waterLevelCm = sensor?.waterLevelCm ?? null;
  const waterLevelM = waterLevelCm !== null ? waterLevelCm / 100 : null;
  const percentage = sensor?.capacityPercent ?? null;
  const { data: forecast, error: forecastError } = useArchive<Forecast>(sensor ? `stations/${station.id}/shadow?sensor=${encodeURIComponent(sensor.id)}` : null);
  const forecastUnavailable = disconnected || sensorDistanceCm === 0 || sensorDistanceCm == null;

  return <StationPreview
    ariaLabel={`Data live ${station.name}`}
    zeroDistance={sensorDistanceCm === 0}
    notices={station.error && <p role="status" className="live-warning">{station.error}</p>}
    controls={station.sensors.length > 1 && <div className="live-sensor-tabs" role="group" aria-label="Pilih kanal sensor">
      {station.sensors.map(item => <button key={item.id} type="button" className="live-sensor-tab" aria-pressed={sensor?.id === item.id} onClick={() => setSelected(item.id)}>{formatSensorLabel(item.id, station.name)}</button>)}
    </div>}
    gauge={{
      value: waterLevelCm !== null ? waterLevelCm.toFixed(1) : "—",
      subtitle: waterLevelM !== null ? `${waterLevelM.toFixed(2)} meter di atas dasar` : "Data belum tersedia",
      percentage,
      capacityLabel: percentage == null ? "Data belum tersedia" : `${percentage.toFixed(0)}% Kapasitas`,
      title: `Tinggi air ${waterLevelCm !== null ? waterLevelCm.toFixed(1) : "—"} cm dari acuan ${groundReferenceCm?.toFixed(0) ?? "—"} cm`,
      details: [
        { label: "Jarak sensor ke air", value: sensorDistanceCm !== null ? `${sensorDistanceCm.toFixed(1)} cm` : "—" },
        { label: "Kapasitas", value: `${groundReferenceCm?.toFixed(1) ?? "—"} cm` },
      ],
    }}
    historyTitle="Riwayat sensor"
    history={{ preaggregated: historySeries?.aggregationMethod === "median_valid_5min", points: history, unit: "cm", loading: !!sensor && !archiveHistory && !historyError, error: historyError, forecast: !forecastUnavailable && !forecastError ? forecast : null }}
    forecastTitle="Prakiraan eksperimental"
    forecast={<ShadowForecast stationId={station.id} data={forecast} error={forecastError} unavailable={forecastUnavailable} />}
    extra={<details className="live-extra"><summary>Data hujan dan lokasi</summary>{station.rainfall ? <>{station.rainfall.error && <p>{station.rainfall.error}</p>}<dl>{Object.entries(station.rainfall.values).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? "—"}</dd></div>)}</dl></> : <p>Data hujan belum tersedia.</p>}{coordinateSource && <a href={coordinateSource} target="_blank" rel="noreferrer">Sumber lokasi</a>}</details>}
  />;
}
