import { badRequest } from "../_shared/util";
import { ValidationResult } from "../_shared/type";

export const NOTE_LIMITS = {
  TITLE: 120,
  CONTENT: 5000,
} as const;

export type CreateNoteInput = {
  title: string;
  content: string;
};

export type UpdateNoteInput = Partial<CreateNoteInput>;

export function validateCreateNoteInput(
  input: unknown
): ValidationResult<CreateNoteInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const { title, content = "" } = input as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return badRequest("标题不能为空");
  }

  if (typeof content !== "string") {
    return badRequest("内容必须是字符串");
  }

  const normalizedTitle = title.trim();
  const normalizedContent = content.trim();

  if (normalizedTitle.length > NOTE_LIMITS.TITLE) {
    return badRequest(`标题不能超过 ${NOTE_LIMITS.TITLE} 个字符`);
  }

  if (normalizedContent.length > NOTE_LIMITS.CONTENT) {
    return badRequest(`内容不能超过 ${NOTE_LIMITS.CONTENT} 个字符`);
  }

  return {
    ok: true,
    value: {
      title: normalizedTitle,
      content: normalizedContent,
    },
  };
}

export function validateUpdateNoteInput(
  input: unknown
): ValidationResult<UpdateNoteInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const record = input as Record<string, unknown>;
  const value: UpdateNoteInput = {};

  if ("title" in record) {
    if (typeof record.title !== "string" || !record.title.trim()) {
      return badRequest("标题不能为空");
    }

    const title = record.title.trim();
    if (title.length > NOTE_LIMITS.TITLE) {
      return badRequest(`标题不能超过 ${NOTE_LIMITS.TITLE} 个字符`);
    }
    value.title = title;
  }

  if ("content" in record) {
    if (typeof record.content !== "string") {
      return badRequest("内容必须是字符串");
    }

    const content = record.content.trim();
    if (content.length > NOTE_LIMITS.CONTENT) {
      return badRequest(`内容不能超过 ${NOTE_LIMITS.CONTENT} 个字符`);
    }
    value.content = content;
  }

  if (Object.keys(value).length === 0) {
    return badRequest("至少提供一个需要更新的字段");
  }

  return { ok: true, value };
}
