import { getCloudflareContext } from "@opennextjs/cloudflare";

function loadCloudflareContext() {
  return getCloudflareContext({ async: true });
}

let cloudflareContextPromise:
  | ReturnType<typeof loadCloudflareContext>
  | undefined;

async function getAppCloudflareContext() {
  if (process.env.NODE_ENV !== "development") {
    return loadCloudflareContext();
  }

  cloudflareContextPromise ??= loadCloudflareContext();

  try {
    return await cloudflareContextPromise;
  } catch (error) {
    cloudflareContextPromise = undefined;
    throw error;
  }
}

export async function getDatabase(): Promise<D1Database> {
  return (await getAppCloudflareContext()).env.DB;
}

export async function getWorkersAi(): Promise<Ai> {
  return (await getAppCloudflareContext()).env.AI;
}
