import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stationGeography } from "@/lib/stations";
import { surabayaStationFallback } from "@/lib/surabaya";
import { welangId } from "@/lib/monitoring";
import StationMonitor from "@/components/station-monitor";

function stationNameFromParam(name: string) {
  try { return decodeURIComponent(name); }
  catch { notFound(); }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  return { title: `${stationNameFromParam(name)} · ITS Water Dashboard` };
}
export function generateStaticParams() {
  return [...new Set([...stationGeography, ...surabayaStationFallback].map(station => station.name))]
    .map(name => ({ name }));
}
export const dynamicParams = false;
export default async function StationPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params;
  const name = stationNameFromParam(encodedName);
  const surabaya = surabayaStationFallback.find(s => s.name === name);
  const welang = stationGeography.find(s => s.name === name);
  if (!surabaya && !welang) notFound();
  return <StationMonitor key={name} name={name} stationId={surabaya?.id ?? welangId(name)} />;
}
