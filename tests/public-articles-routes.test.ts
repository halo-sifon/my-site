import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  handleGetPublishedArticle: vi.fn(),
  handleListPublishedArticles: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
}));

vi.mock("@/app/api/articles/handlers", () => ({
  handleGetPublishedArticle: mocks.handleGetPublishedArticle,
  handleListPublishedArticles: mocks.handleListPublishedArticles,
}));

describe("public articles routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("calls the published articles list handler", async () => {
    const db = {};
    const handlerResponse = Response.json({ code: 0, data: { items: [] } });
    const request = new Request("http://example.com/api/articles");
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleListPublishedArticles.mockResolvedValue(handlerResponse);
    const { GET } = await import("@/app/api/articles/route");

    const response = await GET(request);

    expect(response).toBe(handlerResponse);
    expect(mocks.handleListPublishedArticles).toHaveBeenCalledWith(db, request);
  });

  it("calls the published article detail handler with the slug param", async () => {
    const db = {};
    const handlerResponse = Response.json({ code: 0, data: { slug: "hello" } });
    const request = new Request("http://example.com/api/articles/hello");
    const context = { params: Promise.resolve({ slug: "hello" }) };
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleGetPublishedArticle.mockResolvedValue(handlerResponse);
    const { GET } = await import("@/app/api/articles/[slug]/route");

    const response = await GET(request, context);

    expect(response).toBe(handlerResponse);
    expect(mocks.handleGetPublishedArticle).toHaveBeenCalledWith(db, "hello");
  });
});
