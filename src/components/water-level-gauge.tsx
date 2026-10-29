import type { ReactNode } from "react";

export type WaterLevelGaugeProps = {
  value: string;
  subtitle: string;
  percentage: number | null;
  capacityLabel: string;
  title: string;
  details: { label: string; value: ReactNode }[];
};

export default function WaterLevelGauge({ value, subtitle, percentage, capacityLabel, title, details }: WaterLevelGaugeProps) {
  return <div className="live-level-visual" role="group" aria-label="Ringkasan muka air">
    <div className="live-tank-card">
      <div className={`live-tank-tube${percentage == null ? " is-unscaled" : ""}`} title={title}>
        <div className="live-tank-water" style={{ height: `${percentage ?? 0}%` }}>
          <div className="live-tank-wave" />
        </div>
      </div>
      <span className="live-tank-label">{capacityLabel}</span>
    </div>
    <div className="live-reading-block">
      <span className="live-tank-label" style={{ color: "var(--blue)" }}>Tinggi Muka Air Sungai</span>
      <div className="live-water-headline"><span className="live-water-value">{value}</span><span className="live-water-unit">cm</span></div>
      <span className="live-meter-sub">{subtitle}</span>
      <dl className="live-calc-breakdown">
        {details.map(detail => <div className="live-calc-item" key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}
      </dl>
    </div>
  </div>;
}
