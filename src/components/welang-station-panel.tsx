"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StationSnapshot } from "@/lib/types";
import { chartTheme } from "@/lib/presentation";
import { type ArchiveSeries, welangId } from "@/lib/monitoring";
import { useArchive } from "./use-archive";
import "./surabaya.css";

const clockFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function WelangStationPanel({ station, showHeading = true }: { station: StationSnapshot; showHeading?: boolean }) {
  const capacityPercentage = Number.isFinite(station.valueM) && Number.isFinite(station.dangerM) && station.dangerM > 0 ? Math.min(100, Math.max(0, (station.valueM / station.dangerM) * 100)) : null;
  const { data, error } = useArchive<{ series: ArchiveSeries[] }>(`stations/${welangId(station.name)}/history?hours=24`);
  const waterSeries = data?.series.find(series => series.metric === "water_level");
  const history = waterSeries?.points.map(point => ({ time: Date.parse(point.time), valueM: point.value == null ? null : waterSeries.unit === "cm" ? point.value / 100 : point.value })).flatMap((point, index, all) => index && point.time - all[index - 1].time > 3600000 ? [{ time: point.time - 1, valueM: null }, point] : [point]) ?? [];
  const number = (value: number, digits: number) => Number.isFinite(value) ? value.toFixed(digits) : "—";

  return (
    <section className="live-station-panel welang-preview" aria-label={`Preview detail ${station.name}`}>
      {showHeading && <header className="live-heading">
        <div>
          <span className="live-eyebrow">DAS Welang · Pasuruan</span>
          <h2>{station.name}</h2>
        </div>
      </header>}

      <div className="live-gauge-container" role="group" aria-label="Ringkasan muka air">
        <div className="live-level-visual">
          <div className="live-tank-card">
            <div className={`live-tank-tube${capacityPercentage == null ? " is-unscaled" : ""}`} title={capacityPercentage == null ? "Ambang belum dikonfigurasi" : `Muka air ${number(station.valueM, 2)} m dari ambang bahaya ${number(station.dangerM, 2)} m`}>
              <div className="live-tank-water" style={{ height: `${capacityPercentage ?? 0}%` }}>
                <div className="live-tank-wave" />
              </div>
            </div>
            <span className="live-tank-label">{capacityPercentage == null ? "Ambang belum tersedia" : `${capacityPercentage.toFixed(0)}% menuju ambang bahaya`}</span>
          </div>
          <div className="live-reading-block">
            <span className="live-tank-label" style={{ color: "var(--blue)" }}>Tinggi Muka Air Sungai</span>
            <div className="live-water-headline">
              <span className="live-water-value">{number(station.valueM * 100, 1)}</span>
              <span className="live-water-unit">cm</span>
            </div>
            <span className="live-meter-sub">{number(station.valueM, 2)} meter</span>
            <dl className="live-calc-breakdown">
              <div className="live-calc-item">
                <dt>Perubahan 3 jam</dt>
                <dd>{station.delta3hM >= 0 ? "+" : ""}{number(station.delta3hM * 100, 1)} cm</dd>
              </div>
              <div className="live-calc-item">
                <dt>Status muka air</dt>
                <dd>{station.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <h3 id="riwayat-sensor">Riwayat muka air</h3>
      <p className="live-note">
        {error ?? `24 jam sebelum pembacaan terakhir${station.observedAt ? ` · Pengamatan terakhir: ${timeFormat.format(Date.parse(station.observedAt))} WIB` : ""}`}
      </p>

      <div className="live-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={chartTheme.grid} vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => clockFormat.format(value)}
              minTickGap={45}
              tick={chartTheme.tick}
            />
            <YAxis domain={["auto", "auto"]} tick={chartTheme.tick} width={50} tickFormatter={(v) => Number(v).toFixed(2)} />
            <Tooltip
              contentStyle={chartTheme.tooltip}
              labelFormatter={(value) => `${timeFormat.format(Number(value))} WIB`}
              formatter={(value) => [`${Number(value).toFixed(2)} m`, "Muka air"]}
            />
            <Area yAxisId={0} dataKey="valueM" fill={chartTheme.rainFill} stroke="none" isAnimationActive={false} />
            <Line dataKey="valueM" name="Muka air" stroke={chartTheme.water} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h3>Prakiraan +1 sampai +5 jam</h3>
      <p className="live-note">Prediksi belum diaktifkan.</p>

      <details className="live-extra">
        <summary>Parameter lingkungan & lokasi</summary>
        <dl>
          <div><dt>Curah hujan 30 mnt</dt><dd>{number(station.rainfall30mMm, 1)} mm</dd></div>
          <div><dt>Kualitas air</dt><dd>{station.quality.status}</dd></div>
          <div><dt>pH</dt><dd>{number(station.quality.ph, 2)}</dd></div>
          <div><dt>Suhu air</dt><dd>{number(station.quality.temperatureC, 1)} °C</dd></div>
          <div><dt>Koordinat</dt><dd>{station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}</dd></div>
          <div><dt>Keyakinan koordinat</dt><dd>{station.confidence}</dd></div>
        </dl>
      </details>
    </section>
  );
}
