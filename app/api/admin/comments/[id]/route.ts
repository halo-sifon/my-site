import { RouteContext } from "@/app/api/_shared/type";
import {
  handleDeleteComment,
  handleUpdateCommentStatus,
} from "@/app/api/comments/handlers";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/cloudflare";

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleUpdateCommentStatus(await getDatabase(), id, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleDeleteComment(await getDatabase(), id);
}
