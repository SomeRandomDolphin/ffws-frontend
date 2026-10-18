"use client";
import { useEffect, useState } from "react";
import { monitoringApiJson } from "@/lib/api-client";

export function useArchive<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedPath, setLoadedPath] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const result = await monitoringApiJson<T>(`v1/${path}`, { signal: controller.signal, cache: "no-store" });
        if (!controller.signal.aborted) { setData(result); setLoadedPath(path); setError(null); }
      } catch {
        if (!controller.signal.aborted) setError("Koneksi arsip terputus. Data yang sudah dimuat tetap ditampilkan.");
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 30000);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [path]);
  return { data: loadedPath === path ? data : null, error };
}
