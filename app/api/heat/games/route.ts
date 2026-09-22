import { getGameLog } from "@/lib/heat/service";
import { handle, seasonFromRequest } from "@/lib/heat/api-response";

// GET /api/heat/games?season=2025
export async function GET(req: Request) {
  return handle(() => getGameLog(seasonFromRequest(req)));
}
