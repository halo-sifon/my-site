import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));

describe("Cloudflare context helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getCloudflareContext.mockReset();
    vi.unstubAllEnvs();
  });

  it("shares one asynchronous context load in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const database = {} as D1Database;
    const ai = {} as Ai;
    mocks.getCloudflareContext.mockResolvedValue({
      env: { DB: database, AI: ai },
    });
    const { getDatabase, getWorkersAi } = await import("@/lib/cloudflare");

    await expect(
      Promise.all([getDatabase(), getWorkersAi()])
    ).resolves.toEqual([database, ai]);
    expect(mocks.getCloudflareContext).toHaveBeenCalledWith({
      async: true,
    });
    expect(mocks.getCloudflareContext).toHaveBeenCalledTimes(1);
  });

  it("loads a fresh context for every production request", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const firstDatabase = {} as D1Database;
    const secondDatabase = {} as D1Database;
    mocks.getCloudflareContext
      .mockResolvedValueOnce({ env: { DB: firstDatabase } })
      .mockResolvedValueOnce({ env: { DB: secondDatabase } });
    const { getDatabase } = await import("@/lib/cloudflare");

    await expect(getDatabase()).resolves.toBe(firstDatabase);
    await expect(getDatabase()).resolves.toBe(secondDatabase);
    expect(mocks.getCloudflareContext).toHaveBeenCalledTimes(2);
  });
});
