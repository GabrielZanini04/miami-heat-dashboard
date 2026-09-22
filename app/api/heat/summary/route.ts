import { getSeasonSummary } from "@/lib/heat/service";
import { handle, seasonFromRequest } from "@/lib/heat/api-response";

// GET /api/heat/summary?season=2025
export async function GET(req: Request) {
  return handle(() => getSeasonSummary(seasonFromRequest(req)));
}
