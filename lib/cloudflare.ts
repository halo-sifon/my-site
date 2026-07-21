import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 统一以 async 方式读取 OpenNext 注入的 Cloudflare request context。
 *
 * D1、Workers AI、vars/secrets 都应该从这个 context 的 env 读取，
 * 不直接依赖 `process.env`，避免本地 dev 与 Worker runtime 行为不一致。
 */
function loadCloudflareContext() {
  return getCloudflareContext({ async: true });
}

/**
 * 仅在本地 development 复用同一次异步 context 加载。
 *
 * 生产环境不能缓存 request context；Cloudflare Worker warm isolate 会跨请求复用模块状态，
 * 如果把 request-scoped context 缓存在模块级变量里，会导致跨请求 I/O/context 错乱。
 */
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

/**
 * 读取当前请求可用的 Cloudflare env。
 *
 * 包含 D1、Workers AI、vars 和 secrets，是服务端读取 Cloudflare 配置的唯一入口。
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  return (await getAppCloudflareContext()).env;
}

/** 获取 D1 数据库 binding。 */
export async function getDatabase(): Promise<D1Database> {
  return (await getCloudflareEnv()).DB;
}

/** 获取 Workers AI binding。调用方必须先完成鉴权或滥用保护，避免匿名消耗计费资源。 */
export async function getWorkersAi(): Promise<Ai> {
  return (await getCloudflareEnv()).AI;
}
