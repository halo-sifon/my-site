import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import {
  handleCreateNote,
  handleDeleteNote,
  handleGetNote,
  handleListNotes,
  handleUpdateNote,
} from "@/app/api/notes/handlers";

describe("notes handlers", () => {
  beforeEach(async () => {
    await env.DB.exec("DROP TABLE IF EXISTS notes");
    await env.DB
      .prepare(
        `CREATE TABLE notes (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        )`
      )
      .run();
  });

  it("creates, reads, updates, lists, and hard deletes a note", async () => {
    const createResponse = await handleCreateNote(
      env.DB,
      new Request("http://example.com/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "标题", content: "正文" }),
      })
    );
    const createBody = await createResponse.json<{
      code: number;
      data: { id: number; title: string };
    }>();

    expect(createResponse.status).toBe(201);
    expect(createBody.code).toBe(0);
    expect(createBody.data.title).toBe("标题");

    const id = createBody.data.id;
    const detailResponse = await handleGetNote(env.DB, String(id));
    expect(detailResponse.status).toBe(200);

    const updateResponse = await handleUpdateNote(
      env.DB,
      String(id),
      new Request(`http://example.com/api/notes/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "新正文" }),
      })
    );
    const updateBody = await updateResponse.json<{
      data: { content: string };
    }>();
    expect(updateBody.data.content).toBe("新正文");

    const listResponse = await handleListNotes(
      env.DB,
      new Request("http://example.com/api/notes?page=1&pageSize=20")
    );
    const listBody = await listResponse.json<{
      data: { items: unknown[]; total: number };
    }>();
    expect(listBody.data.total).toBe(1);
    expect(listBody.data.items).toHaveLength(1);

    const deleteResponse = await handleDeleteNote(env.DB, String(id));
    expect(deleteResponse.status).toBe(200);
    expect(await handleGetNote(env.DB, String(id))).toHaveProperty(
      "status",
      404
    );
  });

  it("returns standardized validation failures", async () => {
    const invalidJsonResponse = await handleCreateNote(
      env.DB,
      new Request("http://example.com/api/notes", {
        method: "POST",
        body: "{",
      })
    );

    expect(invalidJsonResponse.status).toBe(400);
    expect(await invalidJsonResponse.json()).toEqual({
      code: 400,
      data: null,
      message: "请求体不是有效的 JSON",
    });

    const invalidIdResponse = await handleGetNote(env.DB, "invalid");
    expect(invalidIdResponse.status).toBe(400);
  });

  it("returns 404 for a missing note", async () => {
    const response = await handleDeleteNote(env.DB, "999");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      code: 404,
      data: null,
      message: "笔记不存在",
    });
  });
});
