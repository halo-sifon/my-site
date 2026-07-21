import type { ValidationResult } from "@/app/api/_shared/type";
import { badRequest } from "@/app/api/_shared/util";
import { ResponseFail } from "@/lib/api-response";

export const COMMENT_LIMITS = {
  AUTHOR_NAME: 40,
  AUTHOR_EMAIL: 200,
  CONTENT: 2000,
} as const;

export const COMMENT_STATUSES = ["approved", "rejected"] as const;

export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export type CreateCommentInput = {
  authorName: string;
  authorEmail: string | null;
  content: string;
};

export type UpdateCommentStatusInput = {
  status: CommentStatus;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function isCommentStatus(value: unknown): value is CommentStatus {
  return COMMENT_STATUSES.includes(value as CommentStatus);
}

export function validateCommentStatusValue(
  value: unknown
): ValidationResult<CommentStatus> {
  if (!isCommentStatus(value)) {
    return badRequest("留言状态无效");
  }

  return { ok: true, value };
}

export function validateCreateCommentInput(
  input: unknown
): ValidationResult<CreateCommentInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const record = input as Record<string, unknown>;
  const authorName = normalizeString(record.authorName);
  if (!authorName) {
    return badRequest("昵称不能为空");
  }

  if (authorName.length > COMMENT_LIMITS.AUTHOR_NAME) {
    return badRequest(`昵称不能超过 ${COMMENT_LIMITS.AUTHOR_NAME} 个字符`);
  }

  const authorEmail =
    record.authorEmail === undefined || record.authorEmail === null
      ? null
      : normalizeString(record.authorEmail);

  if (authorEmail === "") {
    return badRequest("邮箱格式无效");
  }

  if (authorEmail && !EMAIL_PATTERN.test(authorEmail)) {
    return badRequest("邮箱格式无效");
  }

  if (authorEmail && authorEmail.length > COMMENT_LIMITS.AUTHOR_EMAIL) {
    return badRequest(`邮箱不能超过 ${COMMENT_LIMITS.AUTHOR_EMAIL} 个字符`);
  }

  const content = normalizeString(record.content);
  if (!content) {
    return badRequest("留言内容不能为空");
  }

  if (content.length > COMMENT_LIMITS.CONTENT) {
    return badRequest(`留言内容不能超过 ${COMMENT_LIMITS.CONTENT} 个字符`);
  }

  return {
    ok: true,
    value: {
      authorName,
      authorEmail,
      content,
    },
  };
}

export function validateUpdateCommentStatusInput(
  input: unknown
): ValidationResult<UpdateCommentStatusInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const { status } = input as Record<string, unknown>;
  const validation = validateCommentStatusValue(status);
  if (validation instanceof ResponseFail) {
    return validation;
  }

  return { ok: true, value: { status: validation.value } };
}
