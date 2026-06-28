import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getSessionCookie } from "better-auth/cookies";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";

import { authSchema } from "@/lib/auth-schema";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

type AdminAuthEnv = {
  ADMIN_GITHUB_ID?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

type GitHubProfile = {
  avatar_url?: string | null;
  email?: string | null;
  id: number | string;
  login?: string | null;
  name?: string | null;
};

type AdminSession = {
  user: {
    role?: string | null;
  };
};

/**
 * 本地 `next dev` 下跳过后台登录。
 *
 * 这个旁路只依赖 Next 设置的 `NODE_ENV=development`，不会在 build/deploy/线上 Worker 生效。
 */
export function shouldBypassAdminAuthInDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** 本地开发旁路使用的最小 admin session，只包含权限判断需要的 role。 */
export function createDevelopmentAdminSession(): AdminSession {
  return {
    user: { role: "admin" },
  };
}

/**
 * 从 Cloudflare env 读取认证配置和 D1 binding。
 *
 * `.dev.vars`、Dashboard vars/secrets、Wrangler secrets 最终都会作为 binding env 暴露；
 * 这里不读 `process.env`，避免本地 dev 能看到 `.dev.vars` 但请求处理代码读不到的问题。
 */
async function readAuthEnv(): Promise<AdminAuthEnv & { DB: D1Database }> {
  const env = await getCloudflareEnv();

  return {
    ADMIN_GITHUB_ID: env.ADMIN_GITHUB_ID,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    DB: env.DB,
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: env.GITHUB_CLIENT_SECRET,
  };
}

/** 启动认证流程前校验必需配置，缺失时直接暴露具体变量名，便于部署排查。 */
function requireAuthEnv<T extends AdminAuthEnv>(
  env: T
): T & Required<AdminAuthEnv> {
  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`缺少认证环境变量: ${missing.join(", ")}`);
  }

  return env as T & Required<AdminAuthEnv>;
}

/**
 * 将 GitHub profile 映射为本系统 admin 用户。
 *
 * 权限锚点使用 GitHub numeric id，而不是 email；email 可能变化或被隐藏。
 */
export function mapGitHubProfileToAdminUser(
  profile: GitHubProfile,
  adminGithubId: string
) {
  if (String(profile.id) !== adminGithubId) {
    throw new APIError("FORBIDDEN", {
      message: "当前 GitHub 账号没有管理员权限",
    });
  }

  const name = profile.name || profile.login || "Admin";
  return {
    email: profile.email || `${profile.id}+github@users.noreply.github.com`,
    image: profile.avatar_url || undefined,
    name,
    role: "admin",
  };
}

/**
 * 按请求创建 Better Auth 实例。
 *
 * D1 binding 来自 request-scoped Cloudflare env，不能把 auth/db 实例缓存到模块级变量。
 */
export async function createAdminAuth() {
  const env = requireAuthEnv(await readAuthEnv());
  const db = drizzle(env.DB, { schema: authSchema });

  return betterAuth({
    appName: "my-site admin",
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        mapProfileToUser: (profile) =>
          mapGitHubProfileToAdminUser(profile, env.ADMIN_GITHUB_ID),
        scope: ["user:email"],
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "admin",
        },
      },
    },
  });
}

/** 统一生成后台鉴权失败响应，供页面 API 和 AI API 复用。 */
export function createAdminAccessDeniedResponse(
  reason: "forbidden" | "unauthenticated"
): Response {
  return reason === "unauthenticated"
    ? ResponseFail.json(RESPONSE_CODE.UNAUTHORIZED, "未登录")
    : ResponseFail.json(RESPONSE_CODE.FORBIDDEN, "无权限");
}

/**
 * 获取当前 admin session。
 *
 * 无 session cookie 时直接返回 null，避免匿名请求初始化 Better Auth/D1/OAuth 配置。
 */
export async function getAdminSession(
  headers: Headers
): Promise<AdminSession | null> {
  if (shouldBypassAdminAuthInDevelopment()) {
    return createDevelopmentAdminSession();
  }

  if (!getSessionCookie(headers)) {
    return null;
  }

  const auth = await createAdminAuth();
  return auth.api.getSession({ headers }) as Promise<AdminSession | null>;
}

/**
 * API route 的服务端强鉴权入口。
 *
 * 调用 D1 或 Workers AI 前必须先调用它；失败时返回 Response，成功时返回 null。
 */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const session = await getAdminSession(request.headers);

  if (!session) {
    return createAdminAccessDeniedResponse("unauthenticated");
  }

  if (session.user.role !== "admin") {
    return createAdminAccessDeniedResponse("forbidden");
  }

  return null;
}
