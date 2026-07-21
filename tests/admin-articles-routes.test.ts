import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  handleCreateArticle: vi.fn(),
  handleDeleteArticle: vi.fn(),
  handleGetAdminArticle: vi.fn(),
  handleListAdminArticles: vi.fn(),
  handleUpdateArticle: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/app/api/articles/handlers", () => ({
  handleCreateArticle: mocks.handleCreateArticle,
  handleDeleteArticle: mocks.handleDeleteArticle,
  handleGetAdminArticle: mocks.handleGetAdminArticle,
  handleListAdminArticles: mocks.handleListAdminArticles,
  handleUpdateArticle: mocks.handleUpdateArticle,
}));

describe("admin articles routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("does not access D1 when listing articles is unauthorized", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 401, data: null, message: "未登录" }, { status: 401 })
    );
    const { GET } = await import("@/app/api/admin/articles/route");

    const response = await GET(new Request("http://example.com/api/admin/articles"));

    expect(response.status).toBe(401);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
    expect(mocks.handleListAdminArticles).not.toHaveBeenCalled();
  });

  it("calls the admin articles list and create handlers for admin requests", async () => {
    const db = {};
    const listResponse = Response.json({ code: 0, data: { items: [] } });
    const createResponse = Response.json({ code: 0, data: { id: 1 } }, { status: 201 });
    const listRequest = new Request("http://example.com/api/admin/articles");
    const createRequest = new Request("http://example.com/api/admin/articles", {
      method: "POST",
    });
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleListAdminArticles.mockResolvedValue(listResponse);
    mocks.handleCreateArticle.mockResolvedValue(createResponse);
    const { GET, POST } = await import("@/app/api/admin/articles/route");

    expect(await GET(listRequest)).toBe(listResponse);
    expect(await POST(createRequest)).toBe(createResponse);
    expect(mocks.handleListAdminArticles).toHaveBeenCalledWith(db, listRequest);
    expect(mocks.handleCreateArticle).toHaveBeenCalledWith(db, createRequest);
  });

  it("protects article detail routes before touching D1", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 403, data: null, message: "无权限" }, { status: 403 })
    );
    const context = { params: Promise.resolve({ id: "1" }) };
    const { GET, PATCH, DELETE } = await import("@/app/api/admin/articles/[id]/route");

    await expect(GET(new Request("http://example.com/api/admin/articles/1"), context)).resolves.toHaveProperty("status", 403);
    await expect(PATCH(new Request("http://example.com/api/admin/articles/1"), context)).resolves.toHaveProperty("status", 403);
    await expect(DELETE(new Request("http://example.com/api/admin/articles/1"), context)).resolves.toHaveProperty("status", 403);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("calls article detail handlers for admin requests", async () => {
    const db = {};
    const detailResponse = Response.json({ code: 0, data: { id: 1 } });
    const updateResponse = Response.json({ code: 0, data: { id: 1 } });
    const deleteResponse = Response.json({ code: 0, data: { id: 1 } });
    const context = { params: Promise.resolve({ id: "1" }) };
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleGetAdminArticle.mockResolvedValue(detailResponse);
    mocks.handleUpdateArticle.mockResolvedValue(updateResponse);
    mocks.handleDeleteArticle.mockResolvedValue(deleteResponse);
    const { GET, PATCH, DELETE } = await import("@/app/api/admin/articles/[id]/route");

    const getRequest = new Request("http://example.com/api/admin/articles/1");
    const patchRequest = new Request("http://example.com/api/admin/articles/1", {
      method: "PATCH",
    });
    const deleteRequest = new Request("http://example.com/api/admin/articles/1", {
      method: "DELETE",
    });

    expect(await GET(getRequest, context)).toBe(detailResponse);
    expect(await PATCH(patchRequest, context)).toBe(updateResponse);
    expect(await DELETE(deleteRequest, context)).toBe(deleteResponse);
    expect(mocks.handleGetAdminArticle).toHaveBeenCalledWith(db, "1");
    expect(mocks.handleUpdateArticle).toHaveBeenCalledWith(db, "1", patchRequest);
    expect(mocks.handleDeleteArticle).toHaveBeenCalledWith(db, "1");
  });
});
