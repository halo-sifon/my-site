import { getDatabase } from "@/lib/cloudflare";
import { handleCreateNote, handleListNotes } from "@/app/api/notes/handlers";

export async function GET(request: Request) {
  return handleListNotes(await getDatabase(), request);
}

export async function POST(request: Request) {
  return handleCreateNote(await getDatabase(), request);
}
