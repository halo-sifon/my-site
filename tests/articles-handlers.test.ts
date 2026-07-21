import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import {
  handleCreateArticle,
  handleDeleteArticle,
  handleGetAdminArticle,
  handleGetPublishedArticle,
  handleListAdminArticles,
  handleListPublishedArticles,
  handleUpdateArticle,
} from "@/app/api/articles/handlers";

async function createArticlesTable() {
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
}

function articleRequest(body: unknown) {
  return new Request("http://example.com/api/admin/articles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("articles handlers", () => {
  beforeEach(createArticlesTable);

  it("creates, reads, updates, lists, and hard deletes an article", async () => {
    const createResponse = await handleCreateArticle(
      env.DB,
      articleRequest({
        slug: "draft-post",
        title: "草稿",
        summary: "摘要",
        content: "正文",
        tags: ["Next.js"],
      })
    );
    const createBody = await createResponse.json<{
      code: number;
      data: { id: number; slug: string; status: string; tags: string[] };
    }>();

    expect(createResponse.status).toBe(201);
    expect(createBody.code).toBe(0);
    expect(createBody.data.slug).toBe("draft-post");
    expect(createBody.data.status).toBe("draft");
    expect(createBody.data.tags).toEqual(["Next.js"]);

    const draftId = createBody.data.id;
    const hiddenResponse = await handleGetPublishedArticle(env.DB, "draft-post");
    expect(hiddenResponse.status).toBe(404);

    const updateResponse = await handleUpdateArticle(
      env.DB,
      String(draftId),
      new Request(`http://example.com/api/admin/articles/${draftId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      })
    );
    const updateBody = await updateResponse.json<{
      data: { status: string; publishedAt: string | null };
    }>();
    expect(updateBody.data.status).toBe("published");
    expect(updateBody.data.publishedAt).toBeTruthy();

    const publicListResponse = await handleListPublishedArticles(
      env.DB,
      new Request("http://example.com/api/articles?page=1&pageSize=20")
    );
    const publicListBody = await publicListResponse.json<{
      data: { items: { slug: string; content?: string }[]; total: number };
    }>();
    expect(publicListBody.data.total).toBe(1);
    expect(publicListBody.data.items[0]).toMatchObject({ slug: "draft-post" });
    expect(publicListBody.data.items[0]).not.toHaveProperty("content");

    const publicDetailResponse = await handleGetPublishedArticle(
      env.DB,
      "draft-post"
    );
    const publicDetailBody = await publicDetailResponse.json<{
      data: { content: string };
    }>();
    expect(publicDetailResponse.status).toBe(200);
    expect(publicDetailBody.data.content).toBe("正文");

    const adminDetailResponse = await handleGetAdminArticle(
      env.DB,
      String(draftId)
    );
    expect(adminDetailResponse.status).toBe(200);

    const deleteResponse = await handleDeleteArticle(env.DB, String(draftId));
    expect(deleteResponse.status).toBe(200);
    await expect(handleGetAdminArticle(env.DB, String(draftId))).resolves.toHaveProperty(
      "status",
      404
    );
  });

  it("filters the admin list by status", async () => {
    await handleCreateArticle(
      env.DB,
      articleRequest({ slug: "draft-post", title: "草稿", content: "正文" })
    );
    await handleCreateArticle(
      env.DB,
      articleRequest({
        slug: "published-post",
        title: "已发布",
        content: "正文",
        status: "published",
      })
    );

    const response = await handleListAdminArticles(
      env.DB,
      new Request("http://example.com/api/admin/articles?status=draft")
    );
    const body = await response.json<{
      data: { items: { status: string }[]; total: number };
    }>();

    expect(body.data.total).toBe(1);
    expect(body.data.items[0].status).toBe("draft");
  });

  it("returns standardized validation failures", async () => {
    const invalidJsonResponse = await handleCreateArticle(
      env.DB,
      new Request("http://example.com/api/admin/articles", {
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

    const invalidIdResponse = await handleGetAdminArticle(env.DB, "invalid");
    expect(invalidIdResponse.status).toBe(400);

    const invalidSlugResponse = await handleGetPublishedArticle(
      env.DB,
      "Hello_World"
    );
    expect(invalidSlugResponse.status).toBe(400);
  });
});
