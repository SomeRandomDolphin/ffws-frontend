"use client";
import { useEffect, useState } from "react";
import { monitoringApiJson } from "@/lib/api-client";

export function useArchive<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [failure, setFailure] = useState<{ path: string; message: string } | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let disposed = false;
    let controller: AbortController;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const result = await monitoringApiJson<T>(`v1/${path}`, { signal: controller.signal, cache: "no-store" });
        if (!disposed) { setData(result); setLoadedPath(path); setFailure(null); }
      } catch {
        if (!disposed && path) setFailure({ path, message: "Data arsip belum dapat diperbarui. Jika sudah dimuat, data terakhir tetap ditampilkan. Mencoba lagi otomatis." });
      } finally {
        clearTimeout(timeout);
        if (!disposed) timer = setTimeout(refresh, 30000);
      }
    }
    void refresh();
    return () => { disposed = true; controller?.abort(); clearTimeout(timer); };
  }, [path]);
  return { data: loadedPath === path ? data : null, error: failure?.path === path ? failure.message : null };
}
