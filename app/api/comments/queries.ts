import type { Pagination } from "@/app/api/_shared/handle-paginated-list";
import type {
  CommentStatus,
  CreateCommentInput,
} from "@/app/api/comments/validation";

type RawPublicComment = {
  id: number;
  article_id: number;
  author_name: string;
  content: string;
  status: CommentStatus;
  created_at: string;
};

type RawAdminComment = RawPublicComment & {
  article_slug: string;
  article_title: string;
  author_email: string | null;
  moderation_reason: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  updated_at: string;
};

export type PublicComment = {
  id: number;
  articleId: number;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
};

export type AdminComment = PublicComment & {
  articleSlug: string;
  articleTitle: string;
  authorEmail: string | null;
  moderationReason: string | null;
  ipHash: string | null;
  userAgent: string | null;
  updatedAt: string;
};

export type PaginatedComments<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CreateApprovedCommentInput = CreateCommentInput & {
  articleId: number;
  moderationReason: string;
  ipHash: string | null;
  userAgent: string | null;
};

const PUBLIC_COMMENT_SELECT = `id, article_id, author_name, content, status, created_at`;

function toPublicComment(row: RawPublicComment): PublicComment {
  return {
    id: row.id,
    articleId: row.article_id,
    authorName: row.author_name,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toAdminComment(row: RawAdminComment): AdminComment {
  return {
    ...toPublicComment(row),
    articleSlug: row.article_slug,
    articleTitle: row.article_title,
    authorEmail: row.author_email,
    moderationReason: row.moderation_reason,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    updatedAt: row.updated_at,
  };
}

export async function createApprovedComment(
  db: D1Database,
  input: CreateApprovedCommentInput
): Promise<PublicComment> {
  const comment = await db
    .prepare(
      `INSERT INTO article_comments (
         article_id, author_name, author_email, content, status,
         moderation_reason, ip_hash, user_agent
       )
       VALUES (?1, ?2, ?3, ?4, 'approved', ?5, ?6, ?7)
       RETURNING ${PUBLIC_COMMENT_SELECT}`
    )
    .bind(
      input.articleId,
      input.authorName,
      input.authorEmail,
      input.content,
      input.moderationReason,
      input.ipHash,
      input.userAgent
    )
    .first<RawPublicComment>();

  if (!comment) {
    throw new Error("D1 did not return the created comment");
  }

  return toPublicComment(comment);
}

export async function listApprovedCommentsByArticleId(
  db: D1Database,
  articleId: number,
  pagination: Pagination
): Promise<PaginatedComments<PublicComment>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const [itemsResult, countResult] = await db.batch<
    RawPublicComment | { total: number }
  >([
    db
      .prepare(
        `SELECT ${PUBLIC_COMMENT_SELECT}
         FROM article_comments
         WHERE article_id = ?1 AND status = 'approved'
         ORDER BY id DESC
         LIMIT ?2 OFFSET ?3`
      )
      .bind(articleId, pageSize, offset),
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM article_comments WHERE article_id = ?1 AND status = 'approved'"
      )
      .bind(articleId),
  ]);
  const count = countResult.results[0] as { total: number } | undefined;
  const total = Number(count?.total ?? 0);

  return {
    items: (itemsResult.results as RawPublicComment[]).map(toPublicComment),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function listAdminComments(
  db: D1Database,
  pagination: Pagination,
  status?: CommentStatus
): Promise<PaginatedComments<AdminComment>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const select = `SELECT c.id, c.article_id, c.author_name, c.author_email,
           c.content, c.status, c.moderation_reason, c.ip_hash, c.user_agent,
           c.created_at, c.updated_at, a.slug AS article_slug, a.title AS article_title
         FROM article_comments c
         JOIN articles a ON a.id = c.article_id`;
  const itemsStatement = status
    ? db
        .prepare(
          `${select}
           WHERE c.status = ?1
           ORDER BY c.id DESC
           LIMIT ?2 OFFSET ?3`
        )
        .bind(status, pageSize, offset)
    : db
        .prepare(
          `${select}
           ORDER BY c.id DESC
           LIMIT ?1 OFFSET ?2`
        )
        .bind(pageSize, offset);
  const countStatement = status
    ? db
        .prepare("SELECT COUNT(*) AS total FROM article_comments WHERE status = ?1")
        .bind(status)
    : db.prepare("SELECT COUNT(*) AS total FROM article_comments");

  const [itemsResult, countResult] = await db.batch<
    RawAdminComment | { total: number }
  >([itemsStatement, countStatement]);
  const count = countResult.results[0] as { total: number } | undefined;
  const total = Number(count?.total ?? 0);

  return {
    items: (itemsResult.results as RawAdminComment[]).map(toAdminComment),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateCommentStatus(
  db: D1Database,
  id: number,
  status: CommentStatus
): Promise<AdminComment | null> {
  const comment = await db
    .prepare(
      `UPDATE article_comments
       SET status = ?1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?2
       RETURNING id, article_id, author_name, author_email, content, status,
         moderation_reason, ip_hash, user_agent, created_at, updated_at,
         (SELECT slug FROM articles WHERE id = article_comments.article_id) AS article_slug,
         (SELECT title FROM articles WHERE id = article_comments.article_id) AS article_title`
    )
    .bind(status, id)
    .first<RawAdminComment>();

  return comment ? toAdminComment(comment) : null;
}

export async function deleteComment(
  db: D1Database,
  id: number
): Promise<boolean> {
  const deleted = await db
    .prepare("DELETE FROM article_comments WHERE id = ?1 RETURNING id")
    .bind(id)
    .first<{ id: number }>();

  return deleted !== null;
}
