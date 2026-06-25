import { handleImageGeneration } from "@/app/api/ai/handlers";
import { getWorkersAi } from "@/lib/cloudflare";

export async function POST(request: Request) {
  return handleImageGeneration(await getWorkersAi(), request);
}
