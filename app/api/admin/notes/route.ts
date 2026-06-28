import { handleCreateNote, handleListNotes } from "@/app/api/notes/handlers";
import { getDatabase } from "@/lib/cloudflare";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleListNotes(await getDatabase(), request);
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleCreateNote(await getDatabase(), request);
}
