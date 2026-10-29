import type { ReactNode } from "react";

export type WaterLevelGaugeProps = {
  value: string;
  unit?: string;
  subtitle: string;
  percentage: number | null;
  capacityLabel: string;
  title: string;
  details: { label: string; value: ReactNode }[];
};

export default function WaterLevelGauge({ value, unit = "cm", subtitle, percentage, capacityLabel, title, details }: WaterLevelGaugeProps) {
  return <div className="live-level-visual" role="group" aria-label="Ringkasan muka air">
    <div className="live-reading-block">
      <span className="live-reading-label">Tinggi muka air</span>
      <div className="live-water-headline"><span className="live-water-value">{value}</span><span className="live-water-unit">{unit}</span></div>
      <span className="live-meter-sub">{subtitle}</span>
      <div className="preview-capacity"><span>{capacityLabel}</span>{percentage != null && Number.isFinite(percentage) && <div className="preview-capacity-track" role="meter" aria-label="Kapasitas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,percentage))} title={title}><div style={{width:`${Math.max(0,Math.min(100,percentage))}%`}} /></div>}</div>
      <details className="preview-sensor-details"><summary>Detail sensor</summary><dl className="live-calc-breakdown">
        {details.map(detail => <div className="live-calc-item" key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      </dl></details>
    </div>
  </div>;
}
