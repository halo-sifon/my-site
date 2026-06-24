import { getDatabase } from "@/lib/cloudflare";
import {
  handleCreateNote,
  handleListNotes,
} from "@/app/api/notes/handlers";

export function GET(request: Request) {
  return handleListNotes(getDatabase(), request);
}

export function POST(request: Request) {
  return handleCreateNote(getDatabase(), request);
}
