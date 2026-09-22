import { getRoster } from "@/lib/heat/service";
import { handle } from "@/lib/heat/api-response";

// GET /api/heat/roster
export async function GET() {
  return handle(() => getRoster());
}
