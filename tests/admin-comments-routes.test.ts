import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  handleDeleteComment: vi.fn(),
  handleListAdminComments: vi.fn(),
  handleUpdateCommentStatus: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/app/api/comments/handlers", () => ({
  handleDeleteComment: mocks.handleDeleteComment,
  handleListAdminComments: mocks.handleListAdminComments,
  handleUpdateCommentStatus: mocks.handleUpdateCommentStatus,
}));

describe("admin comments routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("does not access D1 when listing comments is unauthorized", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 401, data: null, message: "未登录" }, { status: 401 })
    );
    const { GET } = await import("@/app/api/admin/comments/route");

    const response = await GET(new Request("http://example.com/api/admin/comments"));

    expect(response.status).toBe(401);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
    expect(mocks.handleListAdminComments).not.toHaveBeenCalled();
  });

  it("calls the admin comments list handler for admin requests", async () => {
    const db = {};
    const handlerResponse = Response.json({ code: 0, data: { items: [] } });
    const request = new Request("http://example.com/api/admin/comments");
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleListAdminComments.mockResolvedValue(handlerResponse);
    const { GET } = await import("@/app/api/admin/comments/route");

    const response = await GET(request);

    expect(response).toBe(handlerResponse);
    expect(mocks.handleListAdminComments).toHaveBeenCalledWith(db, request);
  });

  it("protects comment detail routes before touching D1", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 403, data: null, message: "无权限" }, { status: 403 })
    );
    const context = { params: Promise.resolve({ id: "1" }) };
    const { PATCH, DELETE } = await import("@/app/api/admin/comments/[id]/route");

    await expect(PATCH(new Request("http://example.com/api/admin/comments/1"), context)).resolves.toHaveProperty("status", 403);
    await expect(DELETE(new Request("http://example.com/api/admin/comments/1"), context)).resolves.toHaveProperty("status", 403);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
