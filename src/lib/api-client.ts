const configuredBase = process.env.NEXT_PUBLIC_MONITORING_API_URL ?? "/monitoring-api";
const apiBase = configuredBase.replace(/\/+$/, "");

export function monitoringApiUrl(path: string): string {
  return `${apiBase}/${path.replace(/^\/+/, "")}`;
}

export async function monitoringApiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(monitoringApiUrl(path), {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
}

export async function monitoringApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await monitoringApiFetch(path, init);
  if (!response.ok) throw new Error(`Monitoring API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
