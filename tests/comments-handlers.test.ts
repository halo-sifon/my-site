import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleDeleteComment,
  handleListAdminComments,
  handleListApprovedComments,
  handleSubmitComment,
  handleUpdateCommentStatus,
} from "@/app/api/comments/handlers";

async function createArticleAndCommentsTables() {
  await env.DB.exec("DROP TABLE IF EXISTS article_comments");
  await env.DB.exec("DROP TABLE IF EXISTS articles");
  await env.DB
    .prepare(
      `CREATE TABLE articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
  await env.DB
    .prepare(
      `CREATE TABLE article_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'rejected')),
        moderation_reason TEXT,
        ip_hash TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )`
    )
    .run();
  await env.DB
    .prepare(
      `INSERT INTO articles (slug, title, content, status, published_at)
       VALUES ('hello-world', '标题', '正文', 'published', '2026-06-28T00:00:00.000Z')`
    )
    .run();
}

function commentRequest(body: unknown) {
  return new Request("http://example.com/api/articles/hello-world/comments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "vitest",
      "cf-connecting-ip": "192.0.2.1",
    },
    body: JSON.stringify(body),
  });
}

describe("comments handlers", () => {
  beforeEach(createArticleAndCommentsTables);

  it("stores an approved AI-reviewed comment", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"approved":true,"reason":"内容正常"}',
            },
          },
        ],
      }),
    };

    const response = await handleSubmitComment(
      env.DB,
      ai,
      "hello-world",
      commentRequest({
        authorName: "  sifon  ",
        authorEmail: "sifon@example.com",
        content: "  文章很有帮助  ",
      })
    );
    const body = await response.json<{
      code: number;
      data: { status: string; comment: { content: string } };
    }>();

    expect(response.status).toBe(201);
    expect(body.code).toBe(0);
    expect(body.data.status).toBe("approved");
    expect(body.data.comment.content).toBe("文章很有帮助");

    const count = await env.DB
      .prepare("SELECT COUNT(*) AS total FROM article_comments")
      .first<{ total: number }>();
    expect(count?.total).toBe(1);
  });

  it("does not store a rejected AI-reviewed comment", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"approved":false,"reason":"广告内容"}',
            },
          },
        ],
      }),
    };

    const response = await handleSubmitComment(
      env.DB,
      ai,
      "hello-world",
      commentRequest({
        authorName: "spam",
        content: "买粉链接",
      })
    );
    const body = await response.json<{
      code: number;
      data: { status: string; reason: string };
    }>();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      status: "rejected",
      reason: "广告内容",
    });

    const count = await env.DB
      .prepare("SELECT COUNT(*) AS total FROM article_comments")
      .first<{ total: number }>();
    expect(count?.total).toBe(0);
  });

  it("does not call AI when the article slug is missing", async () => {
    const ai = { run: vi.fn() };

    const response = await handleSubmitComment(
      env.DB,
      ai,
      "missing-post",
      commentRequest({
        authorName: "sifon",
        content: "留言内容",
      })
    );

    expect(response.status).toBe(404);
    expect(ai.run).not.toHaveBeenCalled();
  });

  it("lists only approved comments publicly", async () => {
    await env.DB
      .prepare(
        `INSERT INTO article_comments (article_id, author_name, content, status)
         VALUES (1, 'sifon', '公开留言', 'approved'),
                (1, 'spam', '隐藏留言', 'rejected')`
      )
      .run();

    const response = await handleListApprovedComments(
      env.DB,
      "hello-world",
      new Request("http://example.com/api/articles/hello-world/comments")
    );
    const body = await response.json<{
      data: { items: { content: string }[]; total: number };
    }>();

    expect(body.data.total).toBe(1);
    expect(body.data.items).toEqual([
      expect.objectContaining({ content: "公开留言" }),
    ]);
  });

  it("updates and deletes comments from admin handlers", async () => {
    await env.DB
      .prepare(
        `INSERT INTO article_comments (article_id, author_name, content, status)
         VALUES (1, 'sifon', '留言', 'approved')`
      )
      .run();

    const listResponse = await handleListAdminComments(
      env.DB,
      new Request("http://example.com/api/admin/comments?status=approved")
    );
    expect(listResponse.status).toBe(200);

    const updateResponse = await handleUpdateCommentStatus(
      env.DB,
      "1",
      new Request("http://example.com/api/admin/comments/1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })
    );
    const updateBody = await updateResponse.json<{
      data: { status: string };
    }>();
    expect(updateBody.data.status).toBe("rejected");

    const deleteResponse = await handleDeleteComment(env.DB, "1");
    expect(deleteResponse.status).toBe(200);
  });
});
