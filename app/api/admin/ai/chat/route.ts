import { handleChat } from "@/app/api/ai/handlers";
import { getWorkersAi } from "@/lib/cloudflare";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleChat(await getWorkersAi(), request);
}
