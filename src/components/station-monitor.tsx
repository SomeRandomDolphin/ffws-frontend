"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
type ExportJob = { id: string; status: string; error?: string };

export default function StationMonitor({ stationId, name, compact = false }: { stationId: string; name: string; compact?: boolean }) {
  const information = stationInformation(name);
  const back = `/?station=${encodeURIComponent(name)}`;
  const stationCode = `${stationId.startsWith("welang-") ? "WL" : "SBY"}-${name.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
  const [hours, setHours] = useState(24);
  const [selected, setSelected] = useState("");
  const [job, setJob] = useState<ExportJob | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const { data: station, error } = useArchive<ArchiveStation>(`stations/${stationId}/snapshot`);
  const { data: history, error: historyError } = useArchive<{ series: ArchiveSeries[] }>(`stations/${stationId}/history?hours=${hours}`);
  const rawSeries = history?.series.find(s => `${s.sensor}:${s.metric}` === selected) ?? history?.series.find(s => s.metric === "water_level" || s.metric === "distance") ?? history?.series[0];
  const series = rawSeries ? calibratedSeries(rawSeries) : undefined;
  const points = series?.points.map(point => ({ ...point, time: Date.parse(point.time) })) ?? [];
  const chartPoints = points.flatMap((point, index) => {
    const prior = points[index - 1];
    return prior && point.time - prior.time > 3600000 ? [{ time: point.time - 1, value: null, source: point.source }, point] : [point];
  });
  const waterSensors = station?.series.filter(item => item.metric === "water_level" || item.metric === "distance") ?? [];
  const activeSensor = waterSensors.find(item => item.sensor === rawSeries?.sensor && item.metric === rawSeries?.metric) ?? waterSensors[0];
  const sensorPoint = activeSensor?.points.at(-1);
  const displaySensor = activeSensor ? calibratedSeries(activeSensor) : undefined;
  const displayValue = displaySensor?.points.at(-1)?.value;
  const waterLevel = displaySensor?.metric === "water_level" && displayValue != null
    ? displaySensor.unit === "m" ? displayValue : displaySensor.unit === "cm" ? displayValue / 100 : null : null;
  const reference = activeSensor?.referenceCm ?? station?.referenceCm ?? null;
  const hasDistance = activeSensor ? isDistanceSensor(activeSensor) || activeSensor.metric === "distance" : false;
  const latitude = station?.latitude ?? information.latitude;
  const longitude = station?.longitude ?? information.longitude;
  const reading = (value: number | null | undefined, unit?: string) => value == null ? "—" : `${value.toFixed(3)}${unit && unit !== "unverified" ? ` ${unit}` : ""}`;
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
      <div className="monitor-identity"><strong>{stationCode}</strong><span>{stationId.startsWith("welang-") ? "DAS Welang · Pasuruan, Jawa Timur" : "Wilayah Surabaya · Jawa Timur"}</span></div>
      <p className="monitor-description">{information.description}</p>
    </header>
    {(error || historyError) && <p role="alert">{error || historyError}</p>}
    {station?.sources.filter(s => s.error).map(s => <p role="status" key={s.id}>{s.error}</p>)}
    {waterSensors.length > 1 && <section className="monitor-section sensor-select-section" aria-label="Pilih sumber data">
      <div className="monitor-section-heading"><h2>Pilih sumber data</h2></div>
      <div className="sensor-picker" role="group" aria-label="Pilih sensor">{waterSensors.map(item => <button type="button" key={`${item.sensor}:${item.metric}`} className={`sensor-option${activeSensor === item ? " is-active" : ""}`} aria-pressed={activeSensor === item} onClick={() => setSelected(`${item.sensor}:${item.metric}`)}>{formatSensorLabel(item.sensor, name)}</button>)}</div>
    </section>}
    <section className="monitor-section" aria-label="Ringkasan pembacaan">
      <div className="monitor-section-heading"><h2>Muka air</h2><span className="monitor-updated">{station?.observedAt ? `${archiveStateLabel[station.state]} · ${time.format(Date.parse(station.observedAt))} WIB` : "Data belum tersedia"}</span></div>
      <dl className="observation-grid">
        <div className="observation-primary"><dt>Tinggi muka air</dt><dd>{waterLevel == null ? "—" : <>{waterLevel.toFixed(2)} <small>m</small></>}</dd><span>{reference != null ? "Di atas dasar" : activeSensor ? "Pembacaan sumber" : "Data belum tersedia"}</span></div>
        <div><dt>Jarak sensor (Distance)</dt><dd>{hasDistance && sensorPoint?.value != null ? <>{sensorPoint.value.toFixed(1)} <small>{activeSensor?.unit === "unverified" ? "" : activeSensor?.unit}</small></> : "—"}</dd><span>Jarak ke permukaan air</span></div>
        <div><dt>Acuan tinggi dasar</dt><dd>{reference == null ? "—" : <>{reference.toFixed(1)} <small>cm</small></>}</dd><span>{reference == null ? "Belum dikonfigurasi" : "Tinggi sensor ke dasar"}</span></div>
        <div><dt>Sensor aktif</dt><dd>{activeSensor ? formatSensorLabel(activeSensor.sensor, name) : "—"}</dd><span>Total {waterSensors.length} channel sensor</span></div>
      </dl>
    </section>
    <section className="monitor-section" aria-label="Riwayat pengamatan">
      <div className="monitor-section-heading"><h2>Riwayat pengamatan</h2></div>
      <div className="history-controls"><div className="monitor-toggle" role="group" aria-label="Rentang riwayat">
        {[6, 24, 168].map(value => <button key={value} aria-pressed={value === hours} onClick={() => setHours(value)}>{value === 168 ? "7 hari" : `${value} jam`}</button>)}
      </div><button className="archive-download" type="button" disabled={busy || !station?.observedAt} onClick={() => void download()}>{busy ? "Menyiapkan Excel…" : "Unduh Excel 12 bulan"}</button></div>
      {downloadError && <p role="alert">{downloadError}</p>}
      {job?.status === "ready" && <a href={monitoringApiUrl(`v1/exports/${encodeURIComponent(job.id)}/file`)}>Unduh kembali file Excel</a>}
      {points.length ? <figure className="monitor-chart" aria-label="Grafik riwayat pengamatan"><ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartPoints}><CartesianGrid stroke={chartTheme.grid} /><XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={value => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", ...(hours > 24 ? { day: "numeric", month: "short" } : {}) }).format(value)} minTickGap={50} />
          <YAxis domain={["auto", "auto"]} width={60} /><Tooltip labelFormatter={value => `${time.format(Number(value))} WIB`} formatter={value => [value == null ? "—" : `${Number(value).toFixed(3)} ${series?.unit}`, series ? label(series.metric) : "Nilai"]} />
          <Line dataKey="value" stroke={chartTheme.water} dot={false} connectNulls={false} isAnimationActive={false} /></LineChart>
      </ResponsiveContainer></figure> : <p role="status">{history ? "Data belum tersedia pada rentang ini." : "Memuat riwayat…"}</p>}
      <details className="history-data"><summary>Lihat data tabular</summary>
        <div className="monitor-table-wrap"><table className="monitor-table"><caption>10 pengamatan terbaru pada rentang dipilih</caption><thead><tr><th>Waktu (WIB)</th><th>Nilai ({series?.unit ?? "—"})</th><th>Sumber</th></tr></thead><tbody>{points.slice(-10).reverse().map((point, i) => <tr key={`${point.time}:${i}`}><td>{time.format(point.time)}</td><td>{point.value ?? "—"}</td><td>{point.source.startsWith("excel:") ? "Excel historis" : "Arsip sumber stasiun"}</td></tr>)}</tbody></table></div>
      </details>
    </section>
    <section className="monitor-section" aria-label="Informasi sensor"><h2>Sensor dan parameter</h2>
      {station?.series.length ? <div className="monitor-table-wrap"><table className="monitor-table"><caption>Pembacaan terakhir setiap parameter sumber</caption><thead><tr><th>Sensor</th><th>Parameter</th><th>Pembacaan</th><th>Waktu (WIB)</th></tr></thead><tbody>{station.series.map(item => {
        const point = item.points.at(-1);
        return <tr key={`${item.sensor}:${item.metric}`}><td>{formatSensorLabel(item.sensor, name)}</td><td>{label(item.metric)}{item.verification === "unverified" && <small>Interpretasi/satuan belum diverifikasi</small>}</td><td>{reading(point?.value, item.unit)}</td><td>{point ? time.format(Date.parse(point.time)) : "—"}</td></tr>;
      })}</tbody></table></div> : <p>Data sensor belum tersedia.</p>}
    </section>
    <section className="monitor-section"><div className="monitor-section-heading"><div><span className="monitor-eyebrow">Konteks lokasi</span><h2>Informasi fasilitas &amp; lokasi</h2></div><Link href={back}>Buka di dashboard peta</Link></div>
      <div className={compact ? undefined : "location-layout"}><div><dl className="station-metadata">
        <div><dt>Kode stasiun</dt><dd>{stationCode}</dd></div>
        <div><dt>Koordinat WGS84</dt><dd>{latitude != null && longitude != null ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "Belum tercatat"}</dd></div>
        <div><dt>Sumber koordinat</dt><dd>{information.coordinateSourceUrl ? <a href={information.coordinateSourceUrl} target="_blank" rel="noreferrer">{information.coordinateSource}</a> : information.coordinateSource}</dd></div>
        <div><dt>Wilayah hidrologi</dt><dd>{information.region}</dd></div>
        <div><dt>Status data</dt><dd>{station ? archiveStateLabel[station.state] : "Data belum tersedia"}</dd></div>
      </dl><details className="inline-data"><summary>Rincian sumber dan verifikasi</summary><dl className="station-metadata">
        <div><dt>ID sumber stasiun</dt><dd>{stationId}</dd></div>
        <div><dt>Keyakinan koordinat</dt><dd>{information.coordinateConfidence}</dd></div>
        <div><dt>Sumber pengamatan</dt><dd>{station?.sources.length ? station.sources.map(source => <div className="station-source" key={source.id}>{source.id.startsWith("excel:") ? "Excel historis Welang" : source.id.startsWith("mysql:") ? "Database sensor stasiun" : "API stasiun"}{source.lastSuccess && <small>Sinkronisasi: {time.format(Date.parse(source.lastSuccess))} WIB</small>}</div>) : "Belum ada sumber dengan data"}</dd></div>
        <div><dt>Prediksi dan ambang</dt><dd>Belum diaktifkan</dd></div>
      </dl></details></div>
      {!compact && latitude != null && longitude != null && <figure className="location-figure"><LocationMap station={{ name, latitude, longitude }} /></figure>}
      </div>
    </section>
  </>;
  return compact ? <div className="monitor archive-preview">{content}</div> : <main className="wm-app wm-detail monitor"><header className="wm-header"><WelangBrand href={back} /><span className="detail-header-context">Data lokasi pemantauan</span></header><div className="monitor-body"><Link className="monitor-back" href={back}><Icon name="back" />Kembali ke dashboard peta</Link>{content}</div><SiteFooter /></main>;
}
