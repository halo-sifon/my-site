import { handlePaginatedList } from "@/app/api/_shared/handle-paginated-list";
import {
  internalErrorResponse,
  parsePositiveInteger,
  readJson,
} from "@/app/api/_shared/util";
import { getPublishedArticleBySlug } from "@/app/api/articles/queries";
import { validateArticleSlugValue } from "@/app/api/articles/validation";
import {
  createApprovedComment,
  deleteComment,
  listAdminComments,
  listApprovedCommentsByArticleId,
  updateCommentStatus,
} from "@/app/api/comments/queries";
import { moderateCommentWithAi } from "@/app/api/comments/moderation";
import type { CommentModerationAiRunner } from "@/app/api/comments/moderation";
import {
  validateCommentStatusValue,
  validateCreateCommentInput,
  validateUpdateCommentStatusInput,
} from "@/app/api/comments/validation";
import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

function invalidJsonResponse(): Response {
  return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "请求体不是有效的 JSON");
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getIpHash(request: Request): Promise<string | null> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return ip ? sha256Hex(ip) : null;
}

export async function handleListApprovedComments(
  db: D1Database,
  slugValue: string,
  request: Request
): Promise<Response> {
  const slug = validateArticleSlugValue(slugValue);
  if (slug instanceof ResponseFail) {
    return ResponseFail.json(slug.code, slug.message);
  }

  try {
    const article = await getPublishedArticleBySlug(db, slug.value);
    if (!article) {
      return ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
    }

    return handlePaginatedList(request, (pagination) =>
      listApprovedCommentsByArticleId(db, article.id, pagination)
    );
  } catch {
    return internalErrorResponse();
  }
}

export async function handleSubmitComment(
  db: D1Database,
  ai: CommentModerationAiRunner,
  slugValue: string,
  request: Request
): Promise<Response> {
  const slug = validateArticleSlugValue(slugValue);
  if (slug instanceof ResponseFail) {
    return ResponseFail.json(slug.code, slug.message);
  }

  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validateCreateCommentInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const article = await getPublishedArticleBySlug(db, slug.value);
    if (!article) {
      return ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
    }

    const moderation = await moderateCommentWithAi(ai, validation.value);
    if (!moderation.approved) {
      return ResponseSuccess.json({
        status: "rejected" as const,
        reason: moderation.reason,
      });
    }

    const comment = await createApprovedComment(db, {
      ...validation.value,
      articleId: article.id,
      moderationReason: moderation.reason,
      ipHash: await getIpHash(request),
      userAgent: request.headers.get("user-agent"),
    });

    return ResponseSuccess.json(
      {
        status: "approved" as const,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "留言审核或写入失败:",
      JSON.stringify({
        error: error instanceof Error ? error.message : "unknown",
      })
    );
    return internalErrorResponse();
  }
}

export function handleListAdminComments(
  db: D1Database,
  request: Request
): Promise<Response> {
  const statusValue = new URL(request.url).searchParams.get("status");
  if (statusValue) {
    const status = validateCommentStatusValue(statusValue);
    if (status instanceof ResponseFail) {
      return Promise.resolve(ResponseFail.json(status.code, status.message));
    }

    return handlePaginatedList(request, (pagination) =>
      listAdminComments(db, pagination, status.value)
    );
  }

  return handlePaginatedList(request, (pagination) =>
    listAdminComments(db, pagination)
  );
}

export async function handleUpdateCommentStatus(
  db: D1Database,
  idValue: string,
  request: Request
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validateUpdateCommentStatusInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const comment = await updateCommentStatus(db, id, validation.value.status);
    return comment
      ? ResponseSuccess.json(comment)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "留言不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleDeleteComment(
  db: D1Database,
  idValue: string
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  try {
    return (await deleteComment(db, id))
      ? ResponseSuccess.json({ id })
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "留言不存在");
  } catch {
    return internalErrorResponse();
  }
}
