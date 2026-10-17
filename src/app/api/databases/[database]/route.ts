import {
  fetchSurabayaSnapshot,
  isSurabayaDatabase,
  surabayaDatabases,
} from "@/lib/surabaya-databases";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ database: string }> },
) {
  const { database } = await params;

  if (!isSurabayaDatabase(database)) {
    return Response.json(
      {
        error: "Database tidak dikenal.",
        availableDatabases: Object.keys(surabayaDatabases),
      },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const snapshot = await fetchSurabayaSnapshot();
    const source = surabayaDatabases[database];
    const stations = snapshot.stations.filter((station) => station.id === source.stationId);

    return Response.json({
      database,
      generatedAt: snapshot.generatedAt,
      unit: snapshot.unit,
      verification: snapshot.verification,
      pollSeconds: snapshot.pollSeconds,
      stations,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Backend Surabaya belum terhubung.", database },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
