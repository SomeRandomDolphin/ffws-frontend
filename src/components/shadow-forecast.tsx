"use client";

import { liveTime } from "@/lib/surabaya";

export type Forecast = {
  status: string;
  reason?: string;
  issuedAt?: string;
  origin?: string;
  observedAt?: string;
  historical?: boolean;
  originValueCm?: number;
  points: { hours: number; target: string; persistenceCm: number; trendCm: number }[];
};

export default function ShadowForecast({ stationId, data, error, unavailable = false }: { stationId: string; data: Forecast | null; error: string | null; unavailable?: boolean }) {
  const format = (value: number) => (value / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (stationId === "lokasi_2_kalibokor") return <p className="live-note">Prediksi Kalibokor belum diaktifkan karena data evaluasi terbatas.</p>;
  if (unavailable) return <p className="live-note">Prakiraan tidak ditampilkan karena koneksi terputus atau pembacaan sensor tidak valid.</p>;
  if (error) return <p className="live-note" role="status">Prakiraan belum dapat diperbarui. Mencoba lagi otomatis.</p>;
  if (!data) return <p className="live-note" role="status">Memuat prakiraan…</p>;
  if (data.status !== "issued") return <><p className="live-note" role="status">{data.reason}</p>{data.observedAt && <p className="live-note">Data terakhir · {liveTime(data.observedAt)}</p>}</>;
  return <div className="shadow-forecast">
    <div className="forecast-context"><span title={data.observedAt ? `Pembacaan terakhir: ${liveTime(data.observedAt)}` : undefined}>Acuan: {liveTime(data.origin ?? data.issuedAt ?? null)}</span></div>
    <div className="live-table-wrap"><table>
      <caption className="sr-only">Prakiraan tinggi muka air satu hingga lima jam</caption>
      <thead><tr><th>Waktu target</th><th>Prediksi muka air</th></tr></thead>
      <tbody>{data.points.map(point => <tr key={point.hours}><td><div className="forecast-target"><span className="forecast-horizon">+{point.hours}j</span><time dateTime={point.target}>{liveTime(point.target)}</time></div></td><td><span className="forecast-value">{format(point.trendCm)}</span><span className="forecast-unit">m</span></td></tr>)}</tbody>
    </table></div>
  </div>;
}
