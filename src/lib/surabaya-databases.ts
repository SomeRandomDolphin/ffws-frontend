import type { LiveSnapshot } from "@/lib/surabaya";

export const surabayaDatabases = {
  dbpvwemon: {
    stationId: "lokasi_1_hang_tuah",
    stationName: "Hang Tuah",
  },
  dbpvwemonbaru: {
    stationId: "lokasi_2_kalibokor",
    stationName: "Kalibokor",
  },
  dbpvwemonbaru2: {
    stationId: "lokasi_3_rumah_pompa_pucang",
    stationName: "Rumah Pompa Pucang",
  },
  dbpvwemonbaru3: {
    stationId: "lokasi_4_pln_menur",
    stationName: "Sebrang Perpustakaan Jawa Timur",
  },
} as const;

export type SurabayaDatabase = keyof typeof surabayaDatabases;

export function isSurabayaDatabase(value: string): value is SurabayaDatabase {
  return Object.hasOwn(surabayaDatabases, value);
}

export async function fetchSurabayaSnapshot(): Promise<LiveSnapshot> {
  const base = process.env.SURABAYA_API_URL ?? "http://127.0.0.1:8000";
  const response = await fetch(base + "/surabaya/snapshot", {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error("Surabaya backend unavailable");
  }

  const snapshot = (await response.json()) as LiveSnapshot;
  if (!Array.isArray(snapshot.stations)) {
    throw new Error("Invalid Surabaya snapshot");
  }
  return snapshot;
}
