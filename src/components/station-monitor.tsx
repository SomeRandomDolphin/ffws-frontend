"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type ArchiveSeries, type ArchiveStation, archiveStateLabel } from "@/lib/monitoring";
import { chartTheme } from "@/lib/presentation";
import { stationInformation } from "@/lib/station-information";
import { formatSensorLabel } from "@/lib/surabaya";
import { calibratedSeries, isDistanceSensor } from "@/lib/station-calibration";
import { useArchive } from "./use-archive";
import { monitoringApiFetch, monitoringApiUrl } from "@/lib/api-client";
import { SiteFooter, WelangBrand } from "./brand";
import LocationMap from "./location-map";
import Icon from "./icon";
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
type ExportJob = { id: string; status: string; error?: string };

export default function StationMonitor({ stationId, name, compact = false }: { stationId: string; name: string; compact?: boolean }) {
  const information = stationInformation(name);
  const back = `/?station=${encodeURIComponent(name)}`;
  const stationCode = `${stationId.startsWith("welang-") ? "WL" : "SBY"}-${name.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
  const [hours, setHours] = useState(24);
  const [selected, setSelected] = useState("");
  const [category, setCategory] = useState("Muka air");
  const [remembered, setRemembered] = useState<Record<string, string>>({});
  const [job, setJob] = useState<ExportJob | null>(null);
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
  const chartPoints = points.flatMap((point, index) => {
    const prior = points[index - 1];
    return prior && point.time - prior.time > 3600000 ? [{ time: point.time - 1, value: null, source: point.source }, point] : [point];
  });
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
  const busy = starting || job?.status === "queued" || job?.status === "processing";
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); controller.current?.abort(); }, [stationId]);

  async function download() {
    if (timer.current) clearTimeout(timer.current);
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setStarting(true); setDownloadError(null); setJob(null);
    try {
      const response = await monitoringApiFetch(`v1/stations/${encodeURIComponent(stationId)}/exports`, { method: "POST", signal: abort.signal });
      if (!response.ok) throw new Error("Permintaan unduhan gagal. Pastikan data tersedia lalu coba lagi.");
      const created = await response.json() as ExportJob;
      setJob(created);
      async function poll() {
        try {
          const status = await monitoringApiFetch(`v1/exports/${encodeURIComponent(created.id)}`, { cache: "no-store", signal: abort.signal });
          if (!status.ok) throw new Error("Status unduhan tidak dapat diperiksa. Silakan coba lagi.");
          const next = await status.json() as ExportJob;
          setJob(next);
          if (next.status === "ready") {
            window.location.assign(monitoringApiUrl(`v1/exports/${encodeURIComponent(next.id)}/file`));
          } else if (next.status === "failed") {
            setDownloadError(next.error ?? "Pembuatan Excel gagal. Silakan coba lagi.");
          } else {
            timer.current = setTimeout(poll, 2000);
          }
        } catch (e) {
          if (!abort.signal.aborted) { setJob(null); setDownloadError(e instanceof Error ? e.message : "Unduhan gagal"); }
        }
      }
      void poll();
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
    <section className="monitor-section reading-panel" aria-label="Ringkasan pembacaan">
      <div className="monitor-section-heading"><h2>{currentCategory ?? "Pengamatan"}</h2>{sharedTime && <span className="monitor-updated">Pengamatan · {time.format(Date.parse(sharedTime))} WIB</span>}</div>
      <dl className="observation-grid parameter-summary">
        {channels.map(item => {
          const latest = station?.series.find(s => s.sensor === item.sensor && s.metric === item.metric);
          const display = latest ? calibratedSeries(latest) : undefined;
          const point = display?.points.at(-1);
          const unit = display?.unit === "unverified" ? "" : display?.unit;
          const sensorName = formatSensorLabel(item.sensor, name);
          const referenceCm = item.referenceCm ?? station?.referenceCm;
          const percentage = point?.value != null && referenceCm != null && referenceCm > 0 && point.capacityPercent != null && Number.isFinite(point.capacityPercent) ? Math.max(0, Math.min(100, point.capacityPercent)) : null;
          return <div className={item.sensor === "jumlah_tip" ? "observation-supporting" : "observation-primary"} key={`${item.sensor}:${item.metric}`}><dt>{currentCategory === "Muka air" ? `Tinggi muka air · ${sensorName}` : sensorName}{!sharedTime && <small className="reading-channel-time">{point?.time ? `${time.format(Date.parse(point.time))} WIB` : "Belum ada pembacaan"}</small>}</dt><dd>{point?.value == null ? "—" : new Intl.NumberFormat("id-ID", { minimumFractionDigits: item.sensor === "jumlah_tip" ? 0 : 2, maximumFractionDigits: item.sensor === "jumlah_tip" ? 0 : 2 }).format(point.value)} <small>{unit}</small></dd>{currentCategory === "Muka air" && percentage != null && referenceCm != null && <dd className="reading-level-scale"><div className="reading-level-caption"><span>{percentage.toFixed(0)}% kapasitas</span></div><div className="reading-level-track" role="meter" aria-label={`${sensorName}: kapasitas`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={`${percentage.toFixed(0)} persen kapasitas, maksimum ${(referenceCm / 100).toLocaleString("id-ID")} meter`}><div style={{ width: `${percentage}%` }} /></div><div className="reading-level-ticks"><span>0 m</span><span>{(referenceCm / 100).toLocaleString("id-ID")} m</span></div></dd>}</div>;
        })}
      </dl>
      {currentCategory === "Muka air" && <dl className="reading-reference">{[...new Set(channels.map(item => item.referenceCm ?? station?.referenceCm).filter((value): value is number => value != null))].map(value => <div key={value}><dt>Acuan tinggi dasar{channels.some(item => item.referenceCm != null && item.referenceCm !== value) ? ` · ${channels.filter(item => item.referenceCm === value).map(item => formatSensorLabel(item.sensor, name)).join(", ")}` : ""}</dt><dd>{new Intl.NumberFormat("id-ID", { maximumFractionDigits:1 }).format(value)} cm</dd></div>)}</dl>}
    </section>
    <section className="monitor-section" aria-label="Riwayat pengamatan">
      <div className="monitor-section-heading"><h2>Riwayat pengamatan</h2></div>
      <div className="history-controls">{channels.length > 1 && <div className="chart-sensor-select"><select aria-label="Pilih sensor grafik" value={channel ? `${channel.sensor}:${channel.metric}` : ""} onChange={event => setSelected(event.target.value)}>{channels.map(item => <option key={`${item.sensor}:${item.metric}`} value={`${item.sensor}:${item.metric}`}>{formatSensorLabel(item.sensor, name)}</option>)}</select><svg className="chart-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></div>}<div className="monitor-toggle" role="group" aria-label="Rentang riwayat">
        {[6, 24, 168].map(value => <button key={value} aria-pressed={value === hours} onClick={() => setHours(value)}>{value === 168 ? "7 hari" : `${value} jam`}</button>)}
      </div><button className="archive-download" type="button" aria-busy={busy} disabled={busy || !station?.observedAt} onClick={() => void download()}>{busy && <span className="archive-download-spinner" aria-hidden="true" />}<span>{busy ? "Menyiapkan data…" : "Unduh data"}</span></button></div>
      {downloadError && <p role="alert">{downloadError}</p>}
      {points.length ? <figure className="monitor-chart" aria-label="Grafik riwayat pengamatan"><ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartPoints} margin={{ top: 20, right: 8, left: 0, bottom: 8 }}><CartesianGrid stroke={chartTheme.grid} vertical={false} /><XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickCount={6} minTickGap={38} tickFormatter={value => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", ...(hours > 24 ? { day: "numeric", month: "short" } : {}) }).format(value)} tick={chartTheme.tick} axisLine={{ stroke: chartTheme.grid }} tickLine={false} />
          <YAxis domain={["auto", "auto"]} width={68} tickFormatter={value => Number(value).toFixed(2)} tick={chartTheme.tick} axisLine={false} tickLine={false} label={{ value: chartMeasure, angle: -90, position: "insideLeft", fill: "var(--muted)", fontSize: 11 }} /><Tooltip content={({ active, payload }) => {
            const point = payload?.[0]?.payload as (typeof chartPoints)[number] | undefined;
            return active && point ? <div className="monitor-tooltip"><strong>{time.format(point.time)} WIB</strong><span>{chartMeasure}: {point.value == null ? "—" : `${point.value.toFixed(3)}${chartUnit ? ` ${chartUnit}` : ""}`}</span></div> : null;
          }} />
          <Area dataKey="value" fill={chartTheme.rainFill} fillOpacity={0.28} stroke="none" isAnimationActive={false} /><Line dataKey="value" stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} /></ComposedChart>
      </ResponsiveContainer></figure> : <p role="status">{historyError ? "Riwayat belum dapat dimuat. Mencoba lagi otomatis." : !sensorPoint ? "Belum ada pembacaan." : history ? "Tidak ada data pada rentang ini." : "Memuat riwayat…"}</p>}
      <details className="history-data"><summary>Lihat data tabular</summary>
        <div className="monitor-table-wrap"><table className="monitor-table" style={{ minWidth: `${Math.max(620, 190 + tabularSeries.reduce((total, item) => total + (item.key.endsWith(":derived-water-level") ? 190 : 130), 0))}px` }}><caption>10 pengamatan terbaru tiap sensor pada rentang dipilih</caption><thead><tr><th>Waktu (WIB)</th>{tabularSeries.map(sensor => <th key={sensor.key} className={sensor.key.endsWith(":derived-water-level") ? "water-level-column" : undefined}>{sensor.sensor}</th>)}</tr></thead><tbody>{tabularRows.map(row => <tr key={row.time}><td>{time.format(row.time)}</td>{tabularSeries.map(sensor => { const value = row.values[sensor.key]; return <td key={sensor.key} className={sensor.key.endsWith(":derived-water-level") ? "water-level-column" : undefined}>{value == null ? "—" : `${value.toFixed(3)}${sensor.unit !== "unverified" ? ` ${sensor.unit}` : ""}`}</td>; })}</tr>)}</tbody></table></div>
      </details>
    </section>
    <section className="monitor-section" aria-label="Informasi sensor"><h2>Keterangan Sensor</h2>
      {catalog.length ? <div className="monitor-table-wrap"><table className="monitor-table sensor-description-table"><caption>Daftar sensor dan fungsi pengukurannya</caption><thead><tr><th>Sensor</th><th>Keterangan</th></tr></thead><tbody>{catalog.map(item => <tr key={`${item.sensor}:${item.metric}`}><td>{formatSensorLabel(item.sensor, name)}</td><td>{sensorDescription(item, name)}</td></tr>)}</tbody></table></div> : <p>Data sensor belum tersedia.</p>}
    </section>
    <section className="monitor-section"><div className="monitor-section-heading"><div><h2>Informasi fasilitas &amp; lokasi</h2></div><Link href={back}>Buka di dashboard peta</Link></div>
      <div className={compact ? undefined : "location-layout"}><div><dl className="station-metadata">
        <div><dt>Kode stasiun</dt><dd>{stationCode}</dd></div>
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
