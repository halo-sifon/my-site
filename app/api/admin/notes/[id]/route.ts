import { RouteContext } from "@/app/api/_shared/type";
import {
  handleDeleteNote,
  handleGetNote,
  handleUpdateNote,
} from "@/app/api/notes/handlers";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/cloudflare";

export async function GET(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleGetNote(await getDatabase(), id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleUpdateNote(await getDatabase(), id, request);
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  return handleDeleteNote(await getDatabase(), id);
}
