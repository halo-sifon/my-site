import { describe, expect, it } from "vitest";

import { handlePaginatedList } from "@/app/api/_shared/handle-paginated-list";

describe("handlePaginatedList", () => {
  it("uses the default pagination", async () => {
    let receivedPagination: { page: number; pageSize: number } | undefined;

    const response = await handlePaginatedList(
      new Request("http://example.com/api/items"),
      async (pagination) => {
        receivedPagination = pagination;
        return { items: [] };
      }
    );

    expect(receivedPagination).toEqual({ page: 1, pageSize: 10 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      code: 0,
      data: { items: [] },
      message: "success",
    });
  });

  it("passes explicit pagination to the query", async () => {
    let receivedPagination: { page: number; pageSize: number } | undefined;

    await handlePaginatedList(
      new Request("http://example.com/api/items?page=2&pageSize=20"),
      async (pagination) => {
        receivedPagination = pagination;
        return [];
      }
    );

    expect(receivedPagination).toEqual({ page: 2, pageSize: 20 });
  });

  it("limits pageSize to 100", async () => {
    let receivedPagination: { page: number; pageSize: number } | undefined;

    await handlePaginatedList(
      new Request("http://example.com/api/items?pageSize=101"),
      async (pagination) => {
        receivedPagination = pagination;
        return [];
      }
    );

    expect(receivedPagination).toEqual({ page: 1, pageSize: 100 });
  });

  it.each([
    "page=0",
    "page=-1",
    "page=1.5",
    "page=invalid",
    "pageSize=0",
    "pageSize=-1",
    "pageSize=1.5",
    "pageSize=invalid",
  ])("rejects invalid pagination: %s", async (queryString) => {
    const response = await handlePaginatedList(
      new Request(`http://example.com/api/items?${queryString}`),
      async () => []
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 400,
      data: null,
      message: "分页参数必须是正整数",
    });
  });

  it("returns an internal error response when the query fails", async () => {
    const response = await handlePaginatedList(
      new Request("http://example.com/api/items"),
      async () => {
        throw new Error("query failed");
      }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      code: 500,
      data: null,
      message: "服务器内部错误",
    });
  });
});
