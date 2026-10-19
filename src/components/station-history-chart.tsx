"use client";

import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme } from "@/lib/presentation";

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
  // Preserve missing readings and break the chart across gaps longer than an hour.
  const history = points.flatMap((point, index) => index && point.time - points[index - 1].time > 3600000
    ? [{ time: point.time - 1, value: null }, point] : [point]);

  return <>
    {error && <p className="live-note" role="status">{error}</p>}
    {history.length ? <div className="live-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={history} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={chartTheme.grid} vertical={false} />
          <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} tickFormatter={value => clockFormat.format(value)} minTickGap={45} tick={chartTheme.tick} />
          <YAxis domain={["auto", "auto"]} tick={chartTheme.tick} width={50} tickFormatter={value => Number(value).toFixed(2)} />
          <Tooltip contentStyle={chartTheme.tooltip} labelFormatter={value => `${timeFormat.format(Number(value))} WIB`} formatter={value => [value == null ? "—" : `${Number(value).toFixed(2)} ${unit}`, "Muka air"]} />
          <Area dataKey="value" fill={chartTheme.rainFill} stroke="none" connectNulls={false} isAnimationActive={false} />
          <Line dataKey="value" name="Muka air" stroke={chartTheme.water} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div> : <p role="status">{loading ? "Memuat riwayat…" : "Riwayat belum tersedia."}</p>}
  </>;
}
