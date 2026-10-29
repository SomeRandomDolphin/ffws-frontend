"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type ArchiveSeries, type ArchiveStation, archiveStateLabel } from "@/lib/monitoring";
import { chartTheme } from "@/lib/presentation";
import type { Forecast } from "./shadow-forecast";
import { previewHistory } from "@/lib/preview-history";
import { stationInformation } from "@/lib/station-information";
import { formatSensorLabel } from "@/lib/surabaya";
import { calibratedSeries, isDistanceSensor } from "@/lib/station-calibration";
import { useArchive } from "./use-archive";
import { monitoringApiFetch } from "@/lib/api-client";
import { SiteFooter, WelangBrand } from "./brand";
import LocationMap from "./location-map";
import Icon from "./icon";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import "./station-monitor.css";

const time = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
const label = (metric: string) => ({ water_level: "Muka air", distance: "Jarak sensor ke permukaan", rainfall: "Curah hujan" } as Record<string, string>)[metric] ?? metric;
const sensorDescription = (sensor: ArchiveSeries, stationName: string) => {
  const id = sensor.sensor.toLowerCase();
  if (isDistanceSensor(sensor) || sensor.metric === "distance") {
    const channel = formatSensorLabel(sensor.sensor, stationName);
    const context = channel.startsWith("Pompa ") ? ` pada ${channel}` : "";
    return `Jarak dari sensor ke permukaan air${context} untuk menghitung tinggi muka air.`;
  }
  const descriptions: Record<string, string> = {
    flowrate: "Volume air yang melewati titik pengukuran per satuan waktu.",
    flowvelocity: "Kecepatan gerak air di titik pengukuran.",
    rpm: "Jumlah putaran perangkat pengukur dalam satu menit.",
    rain1h: "Pembacaan curah hujan berlabel 1 jam.",
    rain24h: "Pembacaan curah hujan berlabel 24 jam.",
    curah_hujan_1h: "Pembacaan curah hujan berlabel 1 jam.",
    curah_hujan: "Jumlah hujan yang tercatat sesuai periode pengukuran alat.",
    jumlah_tip: "Jumlah jungkit wadah penakar yang digunakan untuk menghitung curah hujan.",
    windavg: "Kecepatan angin rata-rata selama periode pencatatan alat.",
    windir: "Arah angin yang tercatat sesuai acuan arah pada sensor.",
    windmax: "Kecepatan angin tertinggi selama periode pencatatan alat.",
    lightlevel: "Tingkat cahaya di sekitar sensor sesuai skala pengukuran alat.",
  };
  if (descriptions[id]) return descriptions[id];
  if (sensor.metric === "water_level") return "Ketinggian permukaan air terhadap acuan pengukuran stasiun.";
  if (sensor.metric === "rainfall") return "Jumlah hujan yang tercatat sesuai periode pengukuran alat.";
  return "Parameter tambahan yang keterangannya belum tersedia.";
};

export default function StationMonitor({ stationId, name, compact = false }: { stationId: string; name: string; compact?: boolean }) {
  const information = stationInformation(name);
  const back = `/?station=${encodeURIComponent(name)}`;
  const [hours, setHours] = useState(24);
  const [selected, setSelected] = useState("");
  const [category, setCategory] = useState("Muka air");
  const [remembered, setRemembered] = useState<Record<string, string>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const { data: station, error } = useArchive<ArchiveStation>(`stations/${stationId}/snapshot`);
  const group = (s: ArchiveSeries) => s.metric === "water_level" || s.metric === "distance" ? "Muka air" : s.metric === "rainfall" ? "Curah hujan" : /wind/.test(s.sensor) ? "Angin" : /light/.test(s.sensor) ? "Cahaya" : /flow|rpm/.test(s.sensor) ? "Aliran" : "Lainnya";
  const catalog = station?.sensors ?? station?.series ?? [];
  const categories: string[] = ["Muka air", "Curah hujan", "Aliran", "Angin", "Cahaya", "Lainnya"].filter(key => catalog.some(item => group(item) === key));
  const currentCategory = categories.includes(category) ? category : categories[0];
  const channels = catalog.filter(s => group(s) === currentCategory);
  const channel = channels.find(s => `${s.sensor}:${s.metric}` === selected) ?? channels[0];
  const observationTimes = channels.map(item => station?.series.find(s => s.sensor === item.sensor && s.metric === item.metric)?.points.at(-1)?.time);
  const sharedTime = observationTimes[0] && observationTimes.every(value => value === observationTimes[0]) ? observationTimes[0] : null;
  const { data: history, error: historyError } = useArchive<{ series: ArchiveSeries[] }>(channel ? `stations/${stationId}/history?hours=${hours}&sensor=${encodeURIComponent(channel.sensor)}` : null);
  const rawSeries = history?.series.find(s => s.sensor === channel?.sensor && s.metric === channel?.metric);
  const series = rawSeries ? calibratedSeries(rawSeries) : undefined;
  const chartUnit = series?.unit === "unverified" ? "" : series?.unit;
  const chartMeasure = series ? `${label(series.metric)}${chartUnit ? ` (${chartUnit})` : ""}` : "Nilai";
  const points = series?.points.map(point => ({ ...point, time: Date.parse(point.time) })) ?? [];
  const chartWindow = previewHistory(points, hours === 6 ? 360 : hours === 24 ? 1440 : 10080, series?.aggregationMethod === "median_valid_5min");
  const { data: forecast, error: forecastError } = useArchive<Forecast>(
    currentCategory === "Muka air" && stationId.startsWith("lokasi_") && channel
      ? `stations/${stationId}/shadow?sensor=${encodeURIComponent(channel.sensor)}` : null);
  const predictionOrigin = forecast?.status === "issued" && forecast.origin ? Date.parse(forecast.origin) : null;
  const hasPrediction = predictionOrigin != null && !forecastError && forecast!.points.length > 0 && forecast!.originValueCm != null && series?.metric === "water_level" && (chartUnit === "m" || chartUnit === "cm");
  const chartPoints = chartWindow.points.map(point => ({ ...point, prediction: null as number | null }));
  if (hasPrediction) {
    const divisor = chartUnit === "m" ? 100 : 1;
    const predicted = [{ time: predictionOrigin!, value: forecast!.originValueCm! / divisor },
      ...forecast!.points.map(point => ({ time: Date.parse(point.target), value: point.trendCm / divisor }))];
    for (const point of predicted) {
      const existing = chartPoints.find(item => item.time === point.time);
      if (existing) existing.prediction = point.value;
      else chartPoints.push({ time: point.time, value: null, range: null, prediction: point.value });
    }
    chartPoints.sort((a, b) => a.time - b.time);
  }
  const predictionEnd = hasPrediction ? Math.max(...forecast!.points.map(point => Date.parse(point.target))) : chartWindow.end;
  const rawHistorySeries = rawSeries ? [rawSeries] : [];
  const tabularSeries = rawHistorySeries.map(raw => {
    const distanceReading = isDistanceSensor(raw) && raw.points.some(point => point.waterLevelCm != null);
    const referenceCm = raw.referenceCm ?? station?.referenceCm ?? null;
    return {
      key: `${raw.sensor}:${raw.metric}`,
      sensor: formatSensorLabel(raw.sensor, name),
      parameter: label(raw.metric),
      unit: distanceReading && referenceCm != null ? "cm" : raw.unit,
      points: raw.points.slice(-10).map(point => ({
        ...point,
        value: point.value,
      })),
    };
  }).concat(rawHistorySeries
    .filter(raw => raw.points.some(point => point.waterLevelCm != null))
    .map(raw => ({
      key: `${raw.sensor}:derived-water-level`,
      sensor: `Muka air (${formatSensorLabel(raw.sensor, name).replace("Pembacaan Sensor Jarak 1", "Sensor Jarak 1")})`,
      parameter: "Muka air",
      unit: "m",
      points: raw.points.slice(-10).map(point => ({ ...point, value: point.waterLevelCm == null ? null : point.waterLevelCm / 100 })),
    })))
    .sort((a, b) => Number(b.key.endsWith(":derived-water-level")) - Number(a.key.endsWith(":derived-water-level")));
  const tabularRows = (() => {
    const rows = new Map<number, Record<string, number | null>>();
    for (const sensor of tabularSeries) {
      for (const point of sensor.points) {
        const timestamp = Date.parse(point.time);
        const row = rows.get(timestamp) ?? {};
        row[sensor.key] = point.value;
        rows.set(timestamp, row);
      }
    }
    return [...rows].map(([time, values]) => ({ time, values })).sort((a, b) => b.time - a.time);
  })();
  const waterSensors = station?.series.filter(item => item.metric === "water_level" || item.metric === "distance") ?? [];
  const activeSensor = station?.series.find(item => item.sensor === channel?.sensor && item.metric === channel?.metric);
  const sensorPoint = activeSensor?.points.at(-1);
  const displaySensor = activeSensor ? calibratedSeries(activeSensor) : undefined;
  const displayValue = displaySensor?.points.at(-1)?.value;
  const waterLevel = displaySensor?.metric === "water_level" && displayValue != null
    ? displaySensor.unit === "m" ? displayValue : displaySensor.unit === "cm" ? displayValue / 100 : null : null;
  const reference = activeSensor?.referenceCm ?? station?.referenceCm ?? null;
  const hasDistance = activeSensor ? isDistanceSensor(activeSensor) || activeSensor.metric === "distance" : false;
  const latitude = station?.latitude ?? information.latitude;
  const longitude = station?.longitude ?? information.longitude;
  const busy = starting;
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const dateInput = (value: number) => new Date(value + 7 * 3600000).toISOString().slice(0, 10);
  const defaultEnd = points.at(-1)?.time ?? Date.now();
  const fromDate = exportStart || dateInput(defaultEnd - hours * 3600000);
  const toDate = exportEnd || dateInput(defaultEnd);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); controller.current?.abort(); }, [stationId]);

  async function download() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setStarting(true); setDownloadError(null);
    try {
      const query = new URLSearchParams({ start: fromDate + "T00:00:00+07:00", end: toDate + "T23:59:59.999999+07:00" });
      if (channel) query.set("sensor", channel.sensor);
      const response = await monitoringApiFetch(`v1/stations/${encodeURIComponent(stationId)}/export-range?${query}`, { signal: abort.signal });
      if (!response.ok) throw new Error("Unduhan gagal. Coba pilih rentang lebih pendek atau ulangi.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}_${fromDate}_${toDate}.xlsx`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (!abort.signal.aborted) setDownloadError(e instanceof Error ? e.message : "Unduhan gagal");
    } finally {
      if (!abort.signal.aborted) setStarting(false);
    }
  }

  const content = <>
    <header className="monitor-heading"><h1>{name}</h1>
      <p className="monitor-description">{information.description}</p>
    </header>
    {(error || historyError) && <p role="alert">{error || historyError}</p>}
    {station?.sources.filter(s => s.error).map(s => <p role="status" key={s.id}>{s.error}</p>)}
    <section className="monitor-section sensor-select-section" aria-label="Parameter" onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !(event.target instanceof HTMLButtonElement)) return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(".parameter-segments button")];
      const index = buttons.indexOf(event.target);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); buttons[next].click();
    }}>
      <div className="sensor-picker parameter-segments" role="group" aria-label="Parameter">{categories.length === 1 ? <span>{currentCategory}</span> : categories.map(key => <button key={key} className={`sensor-option${key === currentCategory ? " is-active" : ""}`} aria-pressed={key === currentCategory} onClick={() => { setRemembered(current => ({...current, [currentCategory]: channel ? `${channel.sensor}:${channel.metric}` : ""})); setCategory(key); setSelected(remembered[key] ?? ""); }}>{key}</button>)}</div>
    </section>
    <section className={`monitor-section reading-panel${channels.length === 1 && currentCategory === "Muka air" ? " reading-panel-single" : ""}`} aria-label="Ringkasan pembacaan">
      <div className="monitor-section-heading"><h2>{currentCategory ?? "Pengamatan"}</h2>{sharedTime && <span className="monitor-updated">Pengamatan Terakhir · {time.format(Date.parse(sharedTime))} WIB</span>}</div>
      <dl className="observation-grid parameter-summary">
        {channels.map(item => {
          const latest = station?.series.find(s => s.sensor === item.sensor && s.metric === item.metric);
          const display = latest ? calibratedSeries(latest) : undefined;
          const point = display?.points.at(-1);
          const unit = display?.unit === "unverified" ? "" : display?.unit;
          const sensorName = formatSensorLabel(item.sensor, name);
          const referenceCm = item.referenceCm ?? station?.referenceCm;
          const percentage = point?.value != null && referenceCm != null && referenceCm > 0 && point.capacityPercent != null && Number.isFinite(point.capacityPercent) ? Math.max(0, Math.min(100, point.capacityPercent)) : null;
          const zeroDistance = currentCategory === "Muka air" && latest != null && isDistanceSensor(latest) && latest.points.at(-1)?.value === 0;
          return <div data-zero-distance={zeroDistance || undefined} className={item.sensor === "jumlah_tip" ? "observation-supporting" : "observation-primary"} key={`${item.sensor}:${item.metric}`}><dt>{currentCategory === "Muka air" ? `Tinggi muka air · ${sensorName}` : sensorName}{!sharedTime && <small className="reading-channel-time">{point?.time ? `${time.format(Date.parse(point.time))} WIB` : "Belum ada pembacaan"}</small>}</dt><dd>{point?.value == null ? "—" : new Intl.NumberFormat("id-ID", { minimumFractionDigits: item.sensor === "jumlah_tip" ? 0 : 2, maximumFractionDigits: item.sensor === "jumlah_tip" ? 0 : 2 }).format(point.value)} <small>{unit}</small></dd>{currentCategory === "Muka air" && percentage != null && referenceCm != null && <dd className="reading-level-scale"><div className="reading-level-caption"><span>{percentage.toFixed(0)}% kapasitas</span></div><div className="reading-level-track" role="meter" aria-label={`${sensorName}: kapasitas`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={`${percentage.toFixed(0)} persen kapasitas, maksimum ${(referenceCm / 100).toLocaleString("id-ID")} meter`}><div style={{ width: `${percentage}%` }} /></div><div className="reading-level-ticks"><span>0 m</span><span>{(referenceCm / 100).toLocaleString("id-ID")} m</span></div></dd>}{zeroDistance && <dd className="reading-unavailable" role="status"><strong>Sensor Mati</strong><span>Jarak sensor ke muka air 0</span></dd>}</div>;
        })}
      </dl>
    </section>
    <section className="monitor-section" aria-label="Riwayat pengamatan">
      <div className="monitor-section-heading"><h2>Riwayat pengamatan</h2></div>
      <div className="history-controls">{channels.length > 1 && <Select value={channel ? `${channel.sensor}:${channel.metric}` : ""} onValueChange={setSelected}><SelectTrigger aria-label="Pilih sensor grafik"><SelectValue /></SelectTrigger><SelectContent>{channels.map(item => <SelectItem key={`${item.sensor}:${item.metric}`} value={`${item.sensor}:${item.metric}`}>{formatSensorLabel(item.sensor, name)}</SelectItem>)}</SelectContent></Select>}<div className="monitor-toggle" role="group" aria-label="Rentang riwayat">
        {[6, 24, 168].map(value => <button key={value} aria-pressed={value === hours} onClick={() => setHours(value)}>{value === 168 ? "7 hari" : `${value} jam`}</button>)}
      </div><div className="export-date-picker"><Button className="archive-download" type="button" aria-expanded={exportOpen} onClick={() => setExportOpen(!exportOpen)}>Unduh data</Button>{exportOpen && <div className="export-date-menu"><label>Dari tanggal<input type="date" value={fromDate} max={toDate} onChange={event => setExportStart(event.target.value)} /></label><label>Sampai tanggal<input type="date" value={toDate} min={fromDate} onChange={event => setExportEnd(event.target.value)} /></label><Button type="button" aria-busy={busy} disabled={busy || !station?.observedAt || fromDate > toDate} onClick={() => void download()}>{busy ? "Menyiapkan data…" : "Unduh Excel"}</Button></div>}</div></div>
      {downloadError && <p role="alert">{downloadError}</p>}
      {points.length ? <><figure className="monitor-chart" aria-label="Grafik riwayat pengamatan"><ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartPoints} margin={{ top: 24, right: 24, left: 0, bottom: 8 }}>{hasPrediction && <ReferenceArea x1={predictionOrigin!} x2={predictionEnd} fill={chartTheme.water} fillOpacity={0.05} strokeOpacity={0} />}<CartesianGrid stroke={chartTheme.grid} vertical={false} /><XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickCount={6} minTickGap={38} tickFormatter={value => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", ...(hours > 24 ? { day: "numeric", month: "short" } : {}) }).format(value)} tick={chartTheme.tick} axisLine={{ stroke: chartTheme.grid }} tickLine={false} />
          <YAxis domain={["auto", "auto"]} width={68} tickFormatter={value => Number(value).toFixed(2)} tick={chartTheme.tick} axisLine={false} tickLine={false} label={{ value: chartMeasure, angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 11 }} /><Tooltip content={({ active, payload }) => {
            const point = payload?.[0]?.payload as (typeof chartPoints)[number] | undefined;
            return active && point ? <div className="monitor-tooltip"><strong>{time.format(point.time)} WIB</strong>{point.range && <span>Min–maks: {point.range[0].toFixed(3)}–{point.range[1].toFixed(3)}{chartUnit ? ` ${chartUnit}` : ""}</span>}{point.value != null && <span>{chartWindow.interval ? (series?.aggregationMethod === "median_valid_5min" ? "Pengamatan (median)" : "Pengamatan (rata-rata)") : chartMeasure}: {point.value.toFixed(3)}{chartUnit ? ` ${chartUnit}` : ""}</span>}{point.prediction != null && <span>Prediksi: {point.prediction.toFixed(3)}{chartUnit ? ` ${chartUnit}` : ""}</span>}</div> : null;
          }} />
          {chartWindow.interval > 0 && <Area dataKey="range" name="Min–maks" fill={chartTheme.rainFill} fillOpacity={0.6} stroke="none" connectNulls={false} isAnimationActive={false} />}<Line dataKey="value" name={chartWindow.interval ? (series?.aggregationMethod === "median_valid_5min" ? "Median" : "Rata-rata") : chartMeasure} stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />{hasPrediction && <ReferenceLine x={predictionOrigin!} stroke={chartTheme.water} strokeDasharray="3 4" strokeOpacity={0.6} label={{ value: "Awal Prediksi", position: "insideTopLeft", fontSize: 11, fill: "var(--muted)" }} />}{hasPrediction && <Line dataKey="prediction" name="Prediksi" stroke={chartTheme.water} strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 5, fill: "white", stroke: chartTheme.water, strokeWidth: 2.5, strokeDasharray: "0" }} activeDot={{ r: 7, fill: chartTheme.water, stroke: "white", strokeWidth: 2, strokeDasharray: "0" }} connectNulls isAnimationActive={false} />}</ComposedChart>
      </ResponsiveContainer>
    </figure>
    {(hasPrediction || chartWindow.interval > 0) && (
      <div className="monitor-chart-caption">
        <div className="forecast-chart-key">
          <span><i />{chartWindow.interval > 0 ? (series?.aggregationMethod === "median_valid_5min" ? "Pengamatan (median)" : "Pengamatan (rata-rata)") : "Pengamatan"}</span>
          {chartWindow.interval > 0 && <span><i className="is-range" />Min–maks</span>}
          {hasPrediction && <span><i className="is-prediction" />Prediksi{forecast?.historical ? " historis" : ""}</span>}
        </div>
        {hasPrediction && <p>Awal prediksi: {time.format(predictionOrigin!)} WIB</p>}
      </div>
    )}
    {chartWindow.interval > 0 && (
      <p className="monitor-chart-caption">
        Interval {series?.aggregationMethod === "median_valid_5min" ? "median" : "rata-rata"}: {chartWindow.interval / 60000} menit
      </p>
    )}
  </> : <p role="status">{historyError ? "Riwayat belum dapat dimuat. Mencoba lagi otomatis." : !sensorPoint ? "Belum ada pembacaan." : history ? "Tidak ada data pada rentang ini." : "Memuat riwayat…"}</p>}
      <details className="history-data"><summary>Lihat data tabular</summary>
        <div className="monitor-table-wrap"><table className="monitor-table" style={{ minWidth: `${Math.max(620, 190 + tabularSeries.reduce((total, item) => total + (item.key.endsWith(":derived-water-level") ? 190 : 130), 0))}px` }}><caption>10 pengamatan terbaru tiap sensor pada rentang dipilih</caption><thead><tr><th>Waktu (WIB)</th>{tabularSeries.map(sensor => <th key={sensor.key} className={sensor.key.endsWith(":derived-water-level") ? "water-level-column" : undefined}>{sensor.sensor}</th>)}</tr></thead><tbody>{tabularRows.map(row => <tr key={row.time}><td>{time.format(row.time)}</td>{tabularSeries.map(sensor => { const value = row.values[sensor.key]; return <td key={sensor.key} className={sensor.key.endsWith(":derived-water-level") ? "water-level-column" : undefined}>{value == null ? "—" : `${value.toFixed(3)}${sensor.unit !== "unverified" ? ` ${sensor.unit}` : ""}`}</td>; })}</tr>)}</tbody></table></div>
      </details>
    </section>
    <section className="monitor-section" aria-label="Informasi sensor"><h2>Keterangan Sensor</h2>
      {catalog.length ? <div className="monitor-table-wrap"><table className="monitor-table sensor-description-table"><caption>Daftar sensor dan fungsi pengukurannya</caption><thead><tr><th>Sensor</th><th>Keterangan</th></tr></thead><tbody>{catalog.map(item => <tr key={`${item.sensor}:${item.metric}`}><td>{formatSensorLabel(item.sensor, name)}</td><td>{sensorDescription(item, name)}</td></tr>)}</tbody></table></div> : <p>Data sensor belum tersedia.</p>}
    </section>
    <section className="monitor-section"><div className="monitor-section-heading"><div><h2>Informasi fasilitas &amp; lokasi</h2></div><Link href={back}>Buka di dashboard peta</Link></div>
      <div className={compact ? undefined : "location-layout"}><div><dl className="station-metadata">
        <div><dt>Nama stasiun</dt><dd>{name}</dd></div>
        <div><dt>Koordinat WGS84</dt><dd>{latitude != null && longitude != null ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Belum tercatat"}</dd></div>
        <div><dt>Sumber koordinat</dt><dd>{information.coordinateSourceUrl ? <a href={information.coordinateSourceUrl} target="_blank" rel="noreferrer">{information.coordinateSource}</a> : information.coordinateSource}</dd></div>
        <div><dt>Wilayah hidrologi</dt><dd>{information.region}</dd></div>
        <div><dt>Status data</dt><dd>{station ? archiveStateLabel[station.state] : "Data belum tersedia"}</dd></div>
      </dl></div>
      {!compact && latitude != null && longitude != null && <figure className="location-figure"><LocationMap station={{ name, latitude, longitude }} /></figure>}
      </div>
    </section>
  </>;
  return compact ? <div className="monitor archive-preview">{content}</div> : <main className="wm-app wm-detail monitor"><header className="wm-header"><WelangBrand href={back} /></header><div className="monitor-body"><Link className="monitor-back" href={back}><Icon name="back" />Kembali ke dashboard peta</Link>{content}</div><SiteFooter /></main>;
}
