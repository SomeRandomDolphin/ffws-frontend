import { stationGeography } from "./stations";
import type { StationSnapshot } from "./types";

export type ArchiveSeries = {
  sensor: string; metric: string; unit: string; verification: string;
  measurement?: "water_level" | "distance_to_surface" | null;
  referenceCm?: number | null;
  points: { time: string; value: number | null; source: string; waterLevelCm?: number | null; capacityPercent?: number | null }[];
};
export type ArchiveStation = {
  sensors?: ArchiveSeries[];
  id: string; name: string; region: "welang" | "surabaya"; kind: string;
  latitude: number | null; longitude: number | null; observedAt: string | null;
  state: "live" | "historical" | "stale" | "cached" | "unavailable";
  referenceCm?: number | null;
  sources: { id: string; lastSuccess: string | null; error: string | null }[];
  series: ArchiveSeries[];
};
export const archiveStateLabel: Record<ArchiveStation["state"], string> = {
  live: "Terkini", historical: "Data historis Excel", stale: "Data terlambat",
  cached: "Data tersimpan", unavailable: "Data belum tersedia",
};
export function welangId(name: string) {
  return "welang-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function mapWelangStations(archive: ArchiveStation[]): StationSnapshot[] {
  return stationGeography.map(geo => {
    const item = archive.find(s => s.id === welangId(geo.name));
    const series = item?.series.find(s => s.metric === "water_level");
    const point = series?.points.at(-1);
    const value = point?.value;
    const valueM = value == null ? NaN : series?.unit === "cm" ? value / 100 : value;
    return { ...geo, dataMode: item?.state === "historical" ? "historical" : Number.isFinite(valueM) ? "live" : "unavailable", available: Number.isFinite(valueM),
      observedAt: item?.observedAt ?? null, sourceLabel: item ? archiveStateLabel[item.state] : "Data belum tersedia",
      valueM, delta3hM: NaN, alertM: NaN, dangerM: NaN, status: "Belum diverifikasi", color: Number.isFinite(valueM) ? "#547891" : "#8b939b",
      rainfall30mMm: NaN, rainfall24hMm: NaN,
      quality: { ph: NaN, temperatureC: NaN, dissolvedOxygenMgL: NaN, turbidityNtu: NaN, tdsMgL: NaN, status: "Belum tersedia" },
    };
  });
}
