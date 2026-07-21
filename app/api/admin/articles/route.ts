import {
  handleCreateArticle,
  handleListAdminArticles,
} from "@/app/api/articles/handlers";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/cloudflare";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleListAdminArticles(await getDatabase(), request);
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleCreateArticle(await getDatabase(), request);
}
