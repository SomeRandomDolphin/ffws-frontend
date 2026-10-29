"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme } from "@/lib/presentation";
import { useState } from "react";
import { previewHistory } from "@/lib/preview-history";

export type StationHistoryPoint = { time: number; value: number | null };
export type StationHistoryChartProps = {
  points: StationHistoryPoint[];
  unit: "cm" | "m";
  loading: boolean;
  error?: string | null;
};

const clockFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function StationHistoryChart({ points, unit, loading, error }: StationHistoryChartProps) {
  const [minutes,setMinutes]=useState(360);
  const window=previewHistory(points,minutes);
  const history=window.points;

  return <>
    <div className="preview-history-ranges" role="group" aria-label="Rentang riwayat">{[{value:30,label:"30 menit"},{value:360,label:"6 jam"},{value:1440,label:"24 jam"}].map(item=><button key={item.value} type="button" aria-pressed={minutes===item.value} onClick={()=>setMinutes(item.value)}>{item.label}</button>)}</div>
    {!!history.length && <p className="live-note">{timeFormat.format(window.start)} – {timeFormat.format(window.end)} WIB · {window.interval ? `Ringkasan ${window.interval/60000} menit · rentang minimum–maksimum` : "Data asli"}</p>}
    {error && <p className="live-note" role="status">{error}</p>}
    {history.length ? <div className="live-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={history} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={chartTheme.grid} vertical={false} />
          <XAxis dataKey="time" type="number" domain={[window.start, window.end]} tickFormatter={value => clockFormat.format(value)} minTickGap={45} tick={chartTheme.tick} />
          <YAxis domain={["auto", "auto"]} tick={chartTheme.tick} width={50} tickFormatter={value => Number(value).toFixed(2)} />
          <Tooltip contentStyle={chartTheme.tooltip} labelFormatter={value => `${timeFormat.format(Number(value))} WIB`} formatter={(value,key) => [Array.isArray(value) ? `${Number(value[0]).toFixed(2)}–${Number(value[1]).toFixed(2)} ${unit}` : value == null ? "—" : `${Number(value).toFixed(2)} ${unit}`, key === "Minimum–maksimum" ? "Minimum–maksimum" : window.interval ? "Rata-rata" : "Muka air"]} />
          {window.interval > 0 && <Area dataKey="range" name="Minimum–maksimum" fill={chartTheme.rainFill} fillOpacity={0.6} stroke="none" connectNulls={false} isAnimationActive={false} />}
          <Line dataKey="value" name="Muka air" stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div> : <p role="status">{loading ? "Memuat riwayat…" : "Riwayat belum tersedia."}</p>}
  </>;
}
