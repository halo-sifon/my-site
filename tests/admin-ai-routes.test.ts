import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkersAi: vi.fn(),
  handleChat: vi.fn(),
  handleImageGeneration: vi.fn(),
  handleTextGeneration: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getWorkersAi: mocks.getWorkersAi,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/app/api/ai/handlers", () => ({
  handleChat: mocks.handleChat,
  handleImageGeneration: mocks.handleImageGeneration,
  handleTextGeneration: mocks.handleTextGeneration,
}));

describe("admin AI routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("does not access Workers AI when text generation is unauthorized", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 401, data: null, message: "未登录" }, { status: 401 })
    );
    const { POST } = await import("@/app/api/admin/ai/text/route");

    const response = await POST(new Request("http://example.com/api/admin/ai/text"));

    expect(response.status).toBe(401);
    expect(mocks.getWorkersAi).not.toHaveBeenCalled();
    expect(mocks.handleTextGeneration).not.toHaveBeenCalled();
  });

  it("calls the text handler for admin requests", async () => {
    const ai = { run: vi.fn() };
    const handlerResponse = Response.json({ code: 0, data: { answer: "ok" } });
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getWorkersAi.mockResolvedValue(ai);
    mocks.handleTextGeneration.mockResolvedValue(handlerResponse);
    const request = new Request("http://example.com/api/admin/ai/text");
    const { POST } = await import("@/app/api/admin/ai/text/route");

    const response = await POST(request);

    expect(response).toBe(handlerResponse);
    expect(mocks.getWorkersAi).toHaveBeenCalledTimes(1);
    expect(mocks.handleTextGeneration).toHaveBeenCalledWith(ai, request);
  });

  it("does not access Workers AI when image generation is forbidden", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 403, data: null, message: "无权限" }, { status: 403 })
    );
    const { POST } = await import("@/app/api/admin/ai/image/route");

    const response = await POST(new Request("http://example.com/api/admin/ai/image"));

    expect(response.status).toBe(403);
    expect(mocks.getWorkersAi).not.toHaveBeenCalled();
    expect(mocks.handleImageGeneration).not.toHaveBeenCalled();
  });

  it("protects streaming chat before calling Workers AI", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 401, data: null, message: "未登录" }, { status: 401 })
    );
    const { POST } = await import("@/app/api/admin/ai/chat/route");

    const response = await POST(new Request("http://example.com/api/admin/ai/chat"));

    expect(response.status).toBe(401);
    expect(mocks.getWorkersAi).not.toHaveBeenCalled();
    expect(mocks.handleChat).not.toHaveBeenCalled();
  });
});
