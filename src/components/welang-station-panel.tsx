"use client";

import type { StationSnapshot } from "@/lib/types";
import { type ArchiveSeries, welangId } from "@/lib/monitoring";
import { useArchive } from "./use-archive";
import StationPreview from "./station-preview";

export default function WelangStationPanel({ station, showHeading = true }: { station: StationSnapshot; showHeading?: boolean }) {
  const capacityPercentage = Number.isFinite(station.valueM) && Number.isFinite(station.dangerM) && station.dangerM > 0 ? Math.min(100, Math.max(0, (station.valueM / station.dangerM) * 100)) : null;
  const { data, error } = useArchive<{ series: ArchiveSeries[] }>(`stations/${welangId(station.name)}/history?hours=24`);
  const waterSeries = data?.series.find(series => series.metric === "water_level");
  const history = waterSeries?.points.map(point => ({ time: Date.parse(point.time), value: point.value == null ? null : waterSeries.unit === "cm" ? point.value / 100 : point.value })) ?? [];
  const number = (value: number, digits: number) => Number.isFinite(value) ? value.toFixed(digits) : "—";

  return <StationPreview
    ariaLabel={`Preview detail ${station.name}`}
    className="welang-preview"
    heading={showHeading && <header className="live-heading"><div><span className="live-eyebrow">DAS Welang · Pasuruan</span><h2>{station.name}</h2></div></header>}
    gauge={{
      value: Number.isFinite(station.valueM) ? station.valueM.toLocaleString("id-ID", {minimumFractionDigits:2, maximumFractionDigits:2}) : "—",
      unit: "m",
      subtitle: Number.isFinite(station.valueM) ? "Tinggi muka air" : "Data belum tersedia",
      percentage: capacityPercentage,
      capacityLabel: capacityPercentage == null ? "Ambang belum tersedia" : `${capacityPercentage.toFixed(0)}% menuju ambang bahaya`,
      title: capacityPercentage == null ? "Ambang belum dikonfigurasi" : `Muka air ${number(station.valueM, 2)} m dari ambang bahaya ${number(station.dangerM, 2)} m`,
      details: [
        { label: "Perubahan 3 jam", value: `${station.delta3hM >= 0 ? "+" : ""}${number(station.delta3hM * 100, 1)} cm` },
        { label: "Status muka air", value: station.status },
      ],
    }}
    historyTitle="Riwayat muka air"
    history={{ points: history, unit: "m", loading: !data && !error, error }}
    forecast={<p className="live-note">Prediksi belum diaktifkan.</p>}
    extra={<details className="live-extra">
        <summary>Parameter lingkungan & lokasi</summary>
        <dl>
          <div><dt>Curah hujan 30 mnt</dt><dd>{number(station.rainfall30mMm, 1)} mm</dd></div>
          <div><dt>Kualitas air</dt><dd>{station.quality.status}</dd></div>
          <div><dt>pH</dt><dd>{number(station.quality.ph, 2)}</dd></div>
          <div><dt>Suhu air</dt><dd>{number(station.quality.temperatureC, 1)} °C</dd></div>
          <div><dt>Koordinat</dt><dd>{station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}</dd></div>
          <div><dt>Keyakinan koordinat</dt><dd>{station.confidence}</dd></div>
        </dl>
      </details>}
  />;
}
