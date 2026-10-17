import { fetchSurabayaSnapshot } from "@/lib/surabaya-databases";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await fetchSurabayaSnapshot();
    const availableStations = snapshot.stations.filter(
      (station) => station.state !== "unavailable",
    ).length;

    return Response.json({
      status: "ok",
      backendReachable: true,
      databaseDataAvailable: availableStations > 0,
      availableStations,
      totalStations: snapshot.stations.length,
      generatedAt: snapshot.generatedAt,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "error", backendReachable: false, databaseDataAvailable: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
