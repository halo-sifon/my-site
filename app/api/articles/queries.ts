import type { Pagination } from "@/app/api/_shared/handle-paginated-list";
import type {
  ArticleStatus,
  CreateArticleInput,
  UpdateArticleInput,
} from "@/app/api/articles/validation";

type RawArticle = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags_json: string;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleListItem = Omit<Article, "content">;

export type PaginatedArticles<T = ArticleListItem> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const ARTICLE_SELECT = `id, slug, title, summary, content, tags_json,
  status, published_at, created_at, updated_at`;

const ARTICLE_LIST_SELECT = `id, slug, title, summary, tags_json,
  status, published_at, created_at, updated_at`;

type RawArticleListItem = Omit<RawArticle, "content">;

function parseTags(tagsJson: string): string[] {
  try {
    const tags = JSON.parse(tagsJson);
    return Array.isArray(tags)
      ? tags.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function toArticle(row: RawArticle): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    tags: parseTags(row.tags_json),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toArticleListItem(row: RawArticleListItem): ArticleListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    tags: parseTags(row.tags_json),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nowIsoString(): string {
  return new Date().toISOString();
}

export async function listPublishedArticles(
  db: D1Database,
  pagination: Pagination
): Promise<PaginatedArticles> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const [itemsResult, countResult] = await db.batch<
    RawArticleListItem | { total: number }
  >([
    db
      .prepare(
        `SELECT ${ARTICLE_LIST_SELECT}
         FROM articles
         WHERE status = 'published'
         ORDER BY published_at DESC, id DESC
         LIMIT ?1 OFFSET ?2`
      )
      .bind(pageSize, offset),
    db.prepare("SELECT COUNT(*) AS total FROM articles WHERE status = 'published'"),
  ]);
  const count = countResult.results[0] as { total: number } | undefined;
  const total = Number(count?.total ?? 0);

  return {
    items: (itemsResult.results as RawArticleListItem[]).map(toArticleListItem),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listAdminArticles(
  db: D1Database,
  pagination: Pagination,
  status?: ArticleStatus
): Promise<PaginatedArticles> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const itemsStatement = status
    ? db
        .prepare(
          `SELECT ${ARTICLE_LIST_SELECT}
           FROM articles
           WHERE status = ?1
           ORDER BY id DESC
           LIMIT ?2 OFFSET ?3`
        )
        .bind(status, pageSize, offset)
    : db
        .prepare(
          `SELECT ${ARTICLE_LIST_SELECT}
           FROM articles
           ORDER BY id DESC
           LIMIT ?1 OFFSET ?2`
        )
        .bind(pageSize, offset);
  const countStatement = status
    ? db
        .prepare("SELECT COUNT(*) AS total FROM articles WHERE status = ?1")
        .bind(status)
    : db.prepare("SELECT COUNT(*) AS total FROM articles");

  const [itemsResult, countResult] = await db.batch<
    RawArticleListItem | { total: number }
  >([itemsStatement, countStatement]);
  const count = countResult.results[0] as { total: number } | undefined;
  const total = Number(count?.total ?? 0);

  return {
    items: (itemsResult.results as RawArticleListItem[]).map(toArticleListItem),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPublishedArticleBySlug(
  db: D1Database,
  slug: string
): Promise<Article | null> {
  const article = await db
    .prepare(
      `SELECT ${ARTICLE_SELECT}
       FROM articles
       WHERE slug = ?1 AND status = 'published'
       LIMIT 1`
    )
    .bind(slug)
    .first<RawArticle>();

  return article ? toArticle(article) : null;
}

export async function getArticleById(
  db: D1Database,
  id: number
): Promise<Article | null> {
  const article = await db
    .prepare(
      `SELECT ${ARTICLE_SELECT}
       FROM articles
       WHERE id = ?1
       LIMIT 1`
    )
    .bind(id)
    .first<RawArticle>();

  return article ? toArticle(article) : null;
}

export async function createArticle(
  db: D1Database,
  input: CreateArticleInput
): Promise<Article> {
  const publishedAt =
    input.publishedAt ?? (input.status === "published" ? nowIsoString() : null);
  const article = await db
    .prepare(
      `INSERT INTO articles (
         slug, title, summary, content, tags_json, status, published_at
       )
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       RETURNING ${ARTICLE_SELECT}`
    )
    .bind(
      input.slug,
      input.title,
      input.summary,
      input.content,
      JSON.stringify(input.tags),
      input.status,
      publishedAt
    )
    .first<RawArticle>();

  if (!article) {
    throw new Error("D1 did not return the created article");
  }

  return toArticle(article);
}

export async function updateArticle(
  db: D1Database,
  id: number,
  input: UpdateArticleInput
): Promise<Article | null> {
  const current = await getArticleById(db, id);
  if (!current) {
    return null;
  }

  const status = input.status ?? current.status;
  const publishedAt =
    "publishedAt" in input
      ? (input.publishedAt ?? null)
      : status === "published" && !current.publishedAt
        ? nowIsoString()
        : current.publishedAt;
  const updated = await db
    .prepare(
      `UPDATE articles
       SET slug = ?1,
           title = ?2,
           summary = ?3,
           content = ?4,
           tags_json = ?5,
           status = ?6,
           published_at = ?7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?8
       RETURNING ${ARTICLE_SELECT}`
    )
    .bind(
      input.slug ?? current.slug,
      input.title ?? current.title,
      input.summary ?? current.summary,
      input.content ?? current.content,
      JSON.stringify(input.tags ?? current.tags),
      status,
      publishedAt,
      id
    )
    .first<RawArticle>();

  return updated ? toArticle(updated) : null;
}

export async function deleteArticle(
  db: D1Database,
  id: number
): Promise<boolean> {
  const deleted = await db
    .prepare("DELETE FROM articles WHERE id = ?1 RETURNING id")
    .bind(id)
    .first<{ id: number }>();

  return deleted !== null;
}
