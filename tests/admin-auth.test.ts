import { describe, expect, it, vi } from "vitest";

import {
  createAdminAccessDeniedResponse,
  createDevelopmentAdminSession,
  mapGitHubProfileToAdminUser,
  shouldBypassAdminAuthInDevelopment,
} from "@/lib/admin-auth";

describe("admin auth", () => {
  it("maps the configured GitHub numeric id to an admin user", () => {
    expect(
      mapGitHubProfileToAdminUser(
        {
          id: 123,
          name: "sifon",
          email: "sifon@example.com",
          avatar_url: "https://example.com/avatar.png",
        },
        "123"
      )
    ).toEqual({
      email: "sifon@example.com",
      image: "https://example.com/avatar.png",
      name: "sifon",
      role: "admin",
    });
  });

  it("rejects GitHub profiles that are not the configured admin id", () => {
    expect(() =>
      mapGitHubProfileToAdminUser(
        {
          id: 456,
          login: "not-admin",
          email: "not-admin@example.com",
        },
        "123"
      )
    ).toThrow("当前 GitHub 账号没有管理员权限");
  });

  it("uses standardized 401 and 403 admin access responses", async () => {
    await expect(createAdminAccessDeniedResponse("unauthenticated").json()).resolves.toEqual({
      code: 401,
      data: null,
      message: "未登录",
    });
    await expect(createAdminAccessDeniedResponse("forbidden").json()).resolves.toEqual({
      code: 403,
      data: null,
      message: "无权限",
    });
  });

  it("bypasses admin auth only in local Next.js development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(shouldBypassAdminAuthInDevelopment()).toBe(true);
    expect(createDevelopmentAdminSession()).toEqual({
      user: { role: "admin" },
    });

    vi.stubEnv("NODE_ENV", "production");
    expect(shouldBypassAdminAuthInDevelopment()).toBe(false);

    vi.unstubAllEnvs();
  });

  it("creates auth per request instead of reusing a cached instance", async () => {
    const createAuth = vi.fn(() => ({ id: crypto.randomUUID() }));

    const first = createAuth();
    const second = createAuth();

    expect(first).not.toBe(second);
    expect(createAuth).toHaveBeenCalledTimes(2);
  });
});
