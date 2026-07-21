import { handleListAdminComments } from "@/app/api/comments/handlers";
import { requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/cloudflare";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) {
    return denied;
  }

  return handleListAdminComments(await getDatabase(), request);
}
