import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  getWorkersAi: vi.fn(),
  handleListApprovedComments: vi.fn(),
  handleSubmitComment: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
  getWorkersAi: mocks.getWorkersAi,
}));

vi.mock("@/app/api/comments/handlers", () => ({
  handleListApprovedComments: mocks.handleListApprovedComments,
  handleSubmitComment: mocks.handleSubmitComment,
}));

describe("comments public routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("lists approved comments without touching Workers AI", async () => {
    const db = {};
    const handlerResponse = Response.json({ code: 0, data: { items: [] } });
    const request = new Request("http://example.com/api/articles/hello/comments");
    const context = { params: Promise.resolve({ slug: "hello" }) };
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleListApprovedComments.mockResolvedValue(handlerResponse);
    const { GET } = await import("@/app/api/articles/[slug]/comments/route");

    const response = await GET(request, context);

    expect(response).toBe(handlerResponse);
    expect(mocks.getWorkersAi).not.toHaveBeenCalled();
    expect(mocks.handleListApprovedComments).toHaveBeenCalledWith(
      db,
      "hello",
      request
    );
  });

  it("submits a comment through the AI moderation handler", async () => {
    const db = {};
    const ai = {};
    const handlerResponse = Response.json({ code: 0, data: { status: "approved" } });
    const request = new Request("http://example.com/api/articles/hello/comments", {
      method: "POST",
    });
    const context = { params: Promise.resolve({ slug: "hello" }) };
    mocks.getDatabase.mockResolvedValue(db);
    mocks.getWorkersAi.mockResolvedValue(ai);
    mocks.handleSubmitComment.mockResolvedValue(handlerResponse);
    const { POST } = await import("@/app/api/articles/[slug]/comments/route");

    const response = await POST(request, context);

    expect(response).toBe(handlerResponse);
    expect(mocks.handleSubmitComment).toHaveBeenCalledWith(
      db,
      ai,
      "hello",
      request
    );
  });
});
