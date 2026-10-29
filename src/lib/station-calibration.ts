import type { ArchiveSeries } from "./monitoring";

export function isDistanceSensor(series: ArchiveSeries): boolean {
  return series.measurement === "distance_to_surface";
}

// The API owns calibration; this adapter only selects the display field and unit.
export function calibratedSeries(series: ArchiveSeries, unit: "m" | "cm" = "m"): ArchiveSeries {
  if (!isDistanceSensor(series) || series.referenceCm == null) return series;
  return { ...series, metric: "water_level", unit, points: series.points.map(point => ({ ...point,
    value: point.waterLevelCm == null ? null : point.waterLevelCm / (unit === "m" ? 100 : 1),
    range: point.waterLevelRangeCm ? [point.waterLevelRangeCm[0] / (unit === "m" ? 100 : 1), point.waterLevelRangeCm[1] / (unit === "m" ? 100 : 1)] : null,
  })) };
}
