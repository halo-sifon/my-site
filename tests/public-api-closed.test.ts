import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  getWorkersAi: vi.fn(),
}));

vi.mock("@/lib/cloudflare", () => ({
  getDatabase: mocks.getDatabase,
  getWorkersAi: mocks.getWorkersAi,
}));

describe("closed public APIs", () => {
  it("does not expose public Workers AI text generation", async () => {
    const { POST } = await import("@/app/api/ai/text/route");

    const response = await POST(new Request("http://example.com/api/ai/text"));

    expect(response.status).toBe(404);
    expect(mocks.getWorkersAi).not.toHaveBeenCalled();
  });

  it("does not expose public notes API", async () => {
    const { GET } = await import("@/app/api/notes/route");

    const response = await GET(new Request("http://example.com/api/notes"));

    expect(response.status).toBe(404);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
