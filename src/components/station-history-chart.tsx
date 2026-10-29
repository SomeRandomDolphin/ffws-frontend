"use client";

import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Forecast } from "./shadow-forecast";
import { chartTheme } from "@/lib/presentation";
import { useState } from "react";
import { previewHistory } from "@/lib/preview-history";

export type StationHistoryPoint = { time: number; value: number | null; range?: [number,number] | null };
export type StationHistoryChartProps = {
  points: StationHistoryPoint[];
  unit: "cm" | "m";
  loading: boolean;
  error?: string | null;
  title?: string;
  forecast?: Forecast | null;
  preaggregated?: boolean;
};

const clockFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function StationHistoryChart({ points, unit, loading, error, title = "Riwayat sensor", forecast, preaggregated = false }: StationHistoryChartProps) {
  const [minutes,setMinutes]=useState(360);
  const window=previewHistory(points,minutes,preaggregated);
  const history=window.points;
  const origin = forecast?.status === "issued" && forecast.origin ? Date.parse(forecast.origin) : null;
  const predictions = origin != null ? forecast!.points.filter(point => Number.isFinite(Date.parse(point.target)) && Number.isFinite(point.trendCm)) : [];
  const chartData = history.map(point => ({ ...point, prediction: null as number | null }));
  const anchor = forecast?.originValueCm != null ? forecast.originValueCm / (unit === "m" ? 100 : 1) : [...history].reverse().find(point => origin != null && point.time <= origin && point.value != null)?.value;
  const hasPrediction = origin != null && predictions.length > 0 && anchor != null;
  if (hasPrediction) {
    const existing = chartData.find(point => point.time === origin);
    if (existing) existing.prediction = anchor;
    else chartData.push({ time: origin, value: null, range: null, prediction: anchor });
    for (const point of predictions) {
      const time = Date.parse(point.target);
      const value = point.trendCm / (unit === "m" ? 100 : 1);
      const existing = chartData.find(point => point.time === time);
      if (existing) existing.prediction = value;
      else chartData.push({ time, value: null, range: null, prediction: value });
    }
    chartData.sort((a, b) => a.time - b.time);
  }
  const chartEnd = hasPrediction ? Math.max(window.end, ...predictions.map(point => Date.parse(point.target))) : window.end;

  const chartStart = hasPrediction ? origin! - minutes * 60000 : window.start;
  const predictionColor = chartTheme.water;

  return <>
    <div className="preview-history-heading"><h3>{title}</h3><div className="preview-history-ranges" role="group" aria-label="Rentang riwayat">{[{value:30,label:"30 menit"},{value:360,label:"6 jam"},{value:1440,label:"24 jam"}].map(item=><button key={item.value} type="button" aria-pressed={minutes===item.value} onClick={()=>setMinutes(item.value)}>{item.label}</button>)}</div></div>
    {error && <p className="live-note" role="status">{error}</p>}
    {history.some(point => point.value != null) || hasPrediction ? <div className="live-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData.filter(point => point.time >= chartStart)} margin={{ top: 28, right: 28, bottom: 8, left: 0 }}>
          {hasPrediction && <ReferenceArea x1={origin!} x2={chartEnd} fill={predictionColor} fillOpacity={0.05} strokeOpacity={0} />}
          <CartesianGrid stroke={chartTheme.grid} vertical={false} />
          <XAxis dataKey="time" type="number" domain={[chartStart, chartEnd]} tickCount={5} interval="preserveStartEnd" tickFormatter={value => clockFormat.format(value)} minTickGap={45} tick={chartTheme.tick} />
          <YAxis domain={["auto", "auto"]} tick={chartTheme.tick} width={48} tickCount={5} tickFormatter={value => Number(value).toFixed(unit === "cm" ? 0 : 2)} label={{ value: `(${unit})`, position: "top", offset: 12, fill: "var(--muted)", fontSize: 11 }} />
          <Tooltip contentStyle={chartTheme.tooltip} labelFormatter={value => `${timeFormat.format(Number(value))} WIB`} formatter={(value,key) => [Array.isArray(value) ? `${Number(value[0]).toFixed(2)}–${Number(value[1]).toFixed(2)} ${unit}` : value == null ? "—" : `${Number(value).toFixed(2)} ${unit}`, key === "Prediksi" ? "Prediksi" : key === "Min–maks" ? "Min–maks" : window.interval ? (preaggregated ? "Pengamatan (median)" : "Pengamatan (rata-rata)") : "Pengamatan"]} />
          {window.interval > 0 && <Area dataKey="range" name="Min–maks" fill={chartTheme.rainFill} fillOpacity={0.6} stroke="none" connectNulls={false} isAnimationActive={false} />}
          <Line dataKey="value" name="Muka air" stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
          {hasPrediction && <ReferenceLine x={origin!} stroke={predictionColor} strokeOpacity={0.6} strokeDasharray="3 4" label={{ value: "Awal Prediksi", position: "insideTopLeft", fontSize: 11, fill: predictionColor }} />}
          {hasPrediction && <Line dataKey="prediction" name="Prediksi" stroke={predictionColor} strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 5, fill: "white", stroke: predictionColor, strokeWidth: 2.5, strokeDasharray: "0" }} activeDot={{ r: 7, fill: predictionColor, stroke: "white", strokeWidth: 2, strokeDasharray: "0" }} connectNulls isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div> : <p role="status">{loading ? "Memuat riwayat…" : history.length ? "Tidak ada pembacaan valid pada rentang ini." : "Riwayat belum tersedia."}</p>}
    {!!history.length && <div className="preview-history-caption">{(hasPrediction || window.interval > 0) && <div className="forecast-chart-key"><span><i />{window.interval > 0 ? (preaggregated ? "Pengamatan (median)" : "Pengamatan (rata-rata)") : "Pengamatan"}</span>{window.interval > 0 && <span><i className="is-range" />Min–maks</span>}{hasPrediction && <span><i className="is-prediction" />Prediksi{forecast?.historical ? " historis" : ""}</span>}</div>}{hasPrediction && <p>Awal prediksi: {timeFormat.format(origin!)} WIB</p>}<p>{timeFormat.format(chartStart)} – {timeFormat.format(chartEnd)} WIB</p>{window.interval > 0 && <p>Interval {preaggregated ? "median" : "rata-rata"}: {window.interval / 60000} menit</p>}</div>}
  </>;
}
