import { RouteContext } from "@/app/api/_shared/type";
import {
  handleDeleteArticle,
  handleGetAdminArticle,
  handleUpdateArticle,
} from "@/app/api/articles/handlers";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/cloudflare";

export async function GET(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleGetAdminArticle(await getDatabase(), id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleUpdateArticle(await getDatabase(), id, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleDeleteArticle(await getDatabase(), id);
}
