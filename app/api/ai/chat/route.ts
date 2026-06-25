import { handleChat } from "@/app/api/ai/handlers";
import { getWorkersAi } from "@/lib/cloudflare";

export async function POST(request: Request) {
  return handleChat(await getWorkersAi(), request);
}
