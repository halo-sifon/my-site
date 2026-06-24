import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from "@/app/api/notes/queries";

describe("notes repository", () => {
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

  it("creates and retrieves a note", async () => {
    const created = await createNote(env.DB, {
      title: "第一篇",
      content: "正文",
    });

    expect(created.id).toBeGreaterThan(0);
    expect(await getNoteById(env.DB, created.id)).toEqual(created);
  });

  it("returns a paginated newest-first list", async () => {
    await createNote(env.DB, { title: "第一篇", content: "" });
    await createNote(env.DB, { title: "第二篇", content: "" });

    const result = await listNotes(env.DB, { page: 1, pageSize: 1 });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("第二篇");
  });

  it("updates only the provided fields", async () => {
    const created = await createNote(env.DB, {
      title: "旧标题",
      content: "原内容",
    });

    const updated = await updateNote(env.DB, created.id, {
      title: "新标题",
    });

    expect(updated).toMatchObject({
      id: created.id,
      title: "新标题",
      content: "原内容",
    });
  });

  it("hard deletes a note", async () => {
    const created = await createNote(env.DB, {
      title: "待删除",
      content: "",
    });

    expect(await deleteNote(env.DB, created.id)).toBe(true);
    expect(await getNoteById(env.DB, created.id)).toBeNull();
    expect(await deleteNote(env.DB, created.id)).toBe(false);
  });
});
