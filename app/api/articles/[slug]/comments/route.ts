import {
  handleListApprovedComments,
  handleSubmitComment,
} from "@/app/api/comments/handlers";
import { getDatabase, getWorkersAi } from "@/lib/cloudflare";

type ArticleSlugRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: Request,
  context: ArticleSlugRouteContext
) {
  const { slug } = await context.params;
  return handleListApprovedComments(await getDatabase(), slug, request);
}

export async function POST(
  request: Request,
  context: ArticleSlugRouteContext
) {
  const { slug } = await context.params;
  return handleSubmitComment(
    await getDatabase(),
    await getWorkersAi(),
    slug,
    request
  );
}
