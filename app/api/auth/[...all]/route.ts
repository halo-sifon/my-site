import { createAdminAuth } from "@/lib/admin-auth";

async function handleAuthRequest(request: Request) {
  const auth = await createAdminAuth();
  return auth.handler(request);
}

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
