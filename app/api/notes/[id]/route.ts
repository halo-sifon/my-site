import { getDatabase } from "@/lib/cloudflare";
import {
  handleDeleteNote,
  handleGetNote,
  handleUpdateNote,
} from "@/app/api/notes/handlers";
import { RouteContext } from "@/app/api/_shared/type";

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleGetNote(getDatabase(), id);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleUpdateNote(getDatabase(), id, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleDeleteNote(getDatabase(), id);
}
