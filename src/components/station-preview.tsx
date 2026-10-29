import type { ReactNode } from "react";
import WaterLevelGauge, { type WaterLevelGaugeProps } from "./water-level-gauge";
import StationHistoryChart, { type StationHistoryChartProps } from "./station-history-chart";
import "./surabaya.css";

type StationPreviewProps = {
  ariaLabel: string;
  className?: string;
  heading?: ReactNode;
  notices?: ReactNode;
  controls?: ReactNode;
  gauge: WaterLevelGaugeProps;
  zeroDistance?: boolean;
  historyTitle: string;
  history: StationHistoryChartProps;
  forecast: ReactNode;
  extra: ReactNode;
};

export default function StationPreview({ ariaLabel, className, heading, notices, controls, gauge, zeroDistance = false, historyTitle, history, forecast, extra }: StationPreviewProps) {
  return <section className={`live-station-panel${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
    {heading}
    {notices}
    <div className={`live-gauge-container${zeroDistance ? " has-zero-distance" : ""}`}>
      {controls}
      <div className="preview-gauge-reading" aria-hidden={zeroDistance || undefined}><WaterLevelGauge {...gauge} /></div>
      {zeroDistance && <div className="preview-gauge-unavailable" role="status"><strong>Sensor Mati</strong><span>Jarak sensor ke muka air 0</span></div>}
    </div>
    <StationHistoryChart {...history} title={historyTitle} />
    <h3>Prakiraan +1 sampai +5 jam</h3>
    {forecast}
    {extra}
  </section>;
}
