import { handleListPublishedArticles } from "@/app/api/articles/handlers";
import { getDatabase } from "@/lib/cloudflare";

export async function GET(request: Request) {
  return handleListPublishedArticles(await getDatabase(), request);
}
