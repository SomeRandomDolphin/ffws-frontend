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
  historyTitle: string;
  history: StationHistoryChartProps;
  forecast: ReactNode;
  extra: ReactNode;
};

export default function StationPreview({ ariaLabel, className, heading, notices, controls, gauge, historyTitle, history, forecast, extra }: StationPreviewProps) {
  return <section className={`live-station-panel${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
    {heading}
    {notices}
    <div className="live-gauge-container">
      {controls}
      <WaterLevelGauge {...gauge} />
    </div>
    <h3 id="riwayat-sensor">{historyTitle}</h3>
    <StationHistoryChart {...history} />
    <h3>Prakiraan +1 sampai +5 jam</h3>
    {forecast}
    {extra}
  </section>;
}
