import { handleGetPublishedArticle } from "@/app/api/articles/handlers";
import { getDatabase } from "@/lib/cloudflare";

type ArticleSlugRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  context: ArticleSlugRouteContext
) {
  const { slug } = await context.params;
  return handleGetPublishedArticle(await getDatabase(), slug);
}
