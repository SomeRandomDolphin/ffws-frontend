import { surabayaDatabases } from "@/lib/surabaya-databases";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    databases: Object.entries(surabayaDatabases).map(([database, station]) => ({
      database,
      stationName: station.stationName,
      endpoint: `/api/databases/${database}`,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
