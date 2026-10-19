"use client";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatSensorLabel, liveStateLabel, liveTime, type LiveStation } from "@/lib/surabaya";
import { chartTheme } from "@/lib/presentation";
import { stationInformation } from "@/lib/station-information";
import type { ArchiveSeries } from "@/lib/monitoring";
import { useArchive } from "./use-archive";
import "./surabaya.css";

export default function LiveStationPanel({ station, disconnected = false }: { station: LiveStation; disconnected?: boolean }) {
  const coordinateSource = stationInformation(station.name).coordinateSourceUrl;
  const [selected, setSelected] = useState("");
  const sensor = station.sensors.find(item => item.id === selected) ?? station.sensors[0];
  const stale = !station.observedAt || Date.now() - Date.parse(station.observedAt) > 600000;
  const hideForecast = disconnected || stale || station.state !== "live" || sensor?.forecast.method === "unavailable";
  const groundReferenceCm = sensor?.referenceCm ?? null;
  const { data: archiveHistory, error: historyError } = useArchive<{ series: ArchiveSeries[] }>(sensor ? `stations/${station.id}/history?hours=24&sensor=${encodeURIComponent(sensor.id)}` : null);
  const historyPoints = archiveHistory?.series.find(item => item.sensor === sensor?.id)?.points ?? [];
  const history = historyPoints.map((point, index, all) => ({
    time: Date.parse(point.time), valueCm: point.waterLevelCm ?? null,
    // Break lines where the next observation skips a 30-minute interval.
    gap: index > 0 && Date.parse(point.time) - Date.parse(all[index - 1].time) > 3600000,
  })).flatMap(point => point.gap ? [{ time: point.time - 1, valueCm: null, gap: true }, point] : [point]);
  const sensorDistanceCm = sensor?.valueCm ?? null;
  // Raw reading, reference and calibrated water level are supplied by the API.
  const waterLevelCm = sensor?.waterLevelCm ?? null;
  const waterLevelM = waterLevelCm !== null ? waterLevelCm / 100 : null;
  // Persentase kapasitas muka air kolam / saluran
  const percentage = sensor?.capacityPercent ?? null;

  return <section className="live-station-panel" aria-label={`Data live ${station.name}`}>
    {station.error && <p role="status" className="live-warning">{station.error}</p>}
    {historyError && <p role="status" className="live-note">{historyError}</p>}

    <div className="live-gauge-container">
      {station.sensors.length > 1 && (
        <div className="live-sensor-tabs" role="group" aria-label="Pilih kanal sensor">
          {station.sensors.map(item => (
            <button
              key={item.id}
              type="button"
              className="live-sensor-tab"
              aria-pressed={sensor?.id === item.id}
              onClick={() => setSelected(item.id)}
            >
              {formatSensorLabel(item.id, station.name)}
            </button>
          ))}
        </div>
      )}

      <div className="live-level-visual">
        <div className="live-tank-card">
          <div className="live-tank-tube" title={`Tinggi air ${waterLevelCm !== null ? waterLevelCm.toFixed(1) : "—"} cm dari acuan ${groundReferenceCm?.toFixed(0) ?? "—"} cm`}>
            <div className="live-tank-water" style={{ height: `${percentage ?? 0}%` }}>
              <div className="live-tank-wave" />
            </div>
          </div>
          <span className="live-tank-label">{percentage == null ? "Data belum tersedia" : `${percentage.toFixed(0)}% Kapasitas`}</span>
        </div>

        <div className="live-reading-block">
          <span className="live-tank-label" style={{ color: "var(--blue)" }}>Tinggi Muka Air Sungai</span>
          <div className="live-water-headline">
            <span className="live-water-value">
              {waterLevelCm !== null ? waterLevelCm.toFixed(1) : "—"}
            </span>
            <span className="live-water-unit">cm</span>
          </div>
          <span className="live-meter-sub">
            {waterLevelM !== null ? `${waterLevelM.toFixed(2)} meter di atas dasar` : "Data belum tersedia"}
          </span>

          <dl className="live-calc-breakdown">
            <div className="live-calc-item">
              <dt>Jarak ke Muka Air (Distance)</dt>
              <dd>{sensorDistanceCm !== null ? `${sensorDistanceCm.toFixed(1)} cm` : "—"}</dd>
            </div>
            <div className="live-calc-item">
              <dt>Acuan Tinggi Sensor ke Dasar</dt>
              <dd>{groundReferenceCm?.toFixed(1) ?? "—"} cm</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <h3 id="riwayat-sensor">Riwayat sensor {sensor ? formatSensorLabel(sensor.id, station.name) : ""}</h3>
    <p className="live-note">24 jam sebelum pembacaan terakhir · sensor ditampilkan terpisah.</p>
    {history.length ? <div className="live-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}><CartesianGrid stroke={chartTheme.grid} vertical={false} /><XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={value => liveTime(new Date(value).toISOString())} minTickGap={45} tick={chartTheme.tick} /><YAxis domain={["auto", "auto"]} tick={chartTheme.tick} width={55} /><Tooltip contentStyle={chartTheme.tooltip} labelFormatter={value => liveTime(new Date(Number(value)).toISOString())} formatter={value => Number(value).toFixed(3)} /><Line dataKey="valueCm" name="Tinggi air" unit=" cm" stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div> : <p>{archiveHistory ? "Riwayat belum tersedia." : "Memuat riwayat…"}</p>}
    <h3>Prakiraan +1 sampai +5 jam</h3>
    {hideForecast ? <p className="live-note">{sensor?.forecast.reason ?? "Prediksi terkini tidak tersedia."}</p> : <>
      {!!sensor?.forecast.points.length && <div className="live-table-wrap"><table><caption>Acuan prediksi: {liveTime(sensor.forecast.issuedAt)} · bukan peringatan resmi</caption><thead><tr><th>Waktu berlaku</th><th>Horizon</th><th>Tinggi air</th></tr></thead><tbody>{sensor.forecast.points.map(point => <tr key={point.leadHours}><td>{liveTime(point.time)}</td><td>+{point.leadHours} jam</td><td>{point.waterLevelCm?.toFixed(1) ?? "—"} cm</td></tr>)}</tbody></table></div>}
    </>}
    <details className="live-extra"><summary>Data hujan dan lokasi</summary>{station.rainfall ? <>{station.rainfall.error && <p>{station.rainfall.error}</p>}<dl>{Object.entries(station.rainfall.values).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? "—"}</dd></div>)}</dl></> : <p>Data hujan belum tersedia.</p>}{coordinateSource && <a href={coordinateSource} target="_blank" rel="noreferrer">Sumber lokasi</a>}</details>
  </section>;
}
