import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  handleCreateNote: vi.fn(),
  handleDeleteNote: vi.fn(),
  handleGetNote: vi.fn(),
  handleListNotes: vi.fn(),
  handleUpdateNote: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/app/api/notes/handlers", () => ({
  handleCreateNote: mocks.handleCreateNote,
  handleDeleteNote: mocks.handleDeleteNote,
  handleGetNote: mocks.handleGetNote,
  handleListNotes: mocks.handleListNotes,
  handleUpdateNote: mocks.handleUpdateNote,
}));

describe("admin notes routes", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("does not access D1 when listing notes is unauthorized", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 401, data: null, message: "未登录" }, { status: 401 })
    );
    const { GET } = await import("@/app/api/admin/notes/route");

    const response = await GET(new Request("http://example.com/api/admin/notes"));

    expect(response.status).toBe(401);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
    expect(mocks.handleListNotes).not.toHaveBeenCalled();
  });

  it("calls the notes list handler for admin requests", async () => {
    const db = {};
    const handlerResponse = Response.json({ code: 0, data: { items: [] } });
    const request = new Request("http://example.com/api/admin/notes");
    mocks.requireAdmin.mockResolvedValue(null);
    mocks.getDatabase.mockResolvedValue(db);
    mocks.handleListNotes.mockResolvedValue(handlerResponse);
    const { GET } = await import("@/app/api/admin/notes/route");

    const response = await GET(request);

    expect(response).toBe(handlerResponse);
    expect(mocks.handleListNotes).toHaveBeenCalledWith(db, request);
  });

  it("protects note detail routes before touching D1", async () => {
    mocks.requireAdmin.mockResolvedValue(
      Response.json({ code: 403, data: null, message: "无权限" }, { status: 403 })
    );
    const context = { params: Promise.resolve({ id: "1" }) };
    const { GET, PATCH, DELETE } = await import("@/app/api/admin/notes/[id]/route");

    await expect(GET(new Request("http://example.com/api/admin/notes/1"), context)).resolves.toHaveProperty("status", 403);
    await expect(PATCH(new Request("http://example.com/api/admin/notes/1"), context)).resolves.toHaveProperty("status", 403);
    await expect(DELETE(new Request("http://example.com/api/admin/notes/1"), context)).resolves.toHaveProperty("status", 403);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
