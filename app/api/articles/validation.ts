import { badRequest } from "@/app/api/_shared/util";
import { ValidationResult } from "@/app/api/_shared/type";
import { ResponseFail } from "@/lib/api-response";

export const ARTICLE_LIMITS = {
  SLUG: 120,
  TITLE: 160,
  SUMMARY: 500,
  CONTENT: 50000,
  TAG: 40,
  TAGS: 10,
} as const;

export const ARTICLE_STATUSES = ["draft", "published", "archived"] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type CreateArticleInput = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt: string | null;
};

export type UpdateArticleInput = Partial<CreateArticleInput>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isArticleStatus(value: unknown): value is ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus);
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

export function validateArticleSlugValue(
  value: unknown
): ValidationResult<string> {
  const slug = normalizeString(value);
  if (!slug) {
    return badRequest("slug 不能为空");
  }

  if (slug.length > ARTICLE_LIMITS.SLUG) {
    return badRequest(`slug 不能超过 ${ARTICLE_LIMITS.SLUG} 个字符`);
  }

  if (!SLUG_PATTERN.test(slug)) {
    return badRequest("slug 只能包含小写字母、数字和短横线");
  }

  return { ok: true, value: slug };
}

function validateTitle(value: unknown) {
  const title = normalizeString(value);
  if (!title) {
    return badRequest("标题不能为空");
  }

  if (title.length > ARTICLE_LIMITS.TITLE) {
    return badRequest(`标题不能超过 ${ARTICLE_LIMITS.TITLE} 个字符`);
  }

  return { ok: true as const, value: title };
}

function validateSummary(value: unknown) {
  const summary = value === undefined ? "" : normalizeString(value);
  if (summary === null) {
    return badRequest("摘要必须是字符串");
  }

  if (summary.length > ARTICLE_LIMITS.SUMMARY) {
    return badRequest(`摘要不能超过 ${ARTICLE_LIMITS.SUMMARY} 个字符`);
  }

  return { ok: true as const, value: summary };
}

function validateContent(value: unknown) {
  const content = normalizeString(value);
  if (!content) {
    return badRequest("正文不能为空");
  }

  if (content.length > ARTICLE_LIMITS.CONTENT) {
    return badRequest(`正文不能超过 ${ARTICLE_LIMITS.CONTENT} 个字符`);
  }

  return { ok: true as const, value: content };
}

function validateTags(value: unknown) {
  if (value === undefined) {
    return { ok: true as const, value: [] };
  }

  if (!Array.isArray(value)) {
    return badRequest("标签必须是数组");
  }

  const tags = value
    .map((item) => normalizeString(item))
    .filter((item): item is string => Boolean(item));

  if (tags.length > ARTICLE_LIMITS.TAGS) {
    return badRequest(`标签不能超过 ${ARTICLE_LIMITS.TAGS} 个`);
  }

  const tooLong = tags.find((tag) => tag.length > ARTICLE_LIMITS.TAG);
  if (tooLong) {
    return badRequest(`单个标签不能超过 ${ARTICLE_LIMITS.TAG} 个字符`);
  }

  return { ok: true as const, value: Array.from(new Set(tags)) };
}

function validateStatus(value: unknown) {
  if (value === undefined) {
    return { ok: true as const, value: "draft" as ArticleStatus };
  }

  if (!isArticleStatus(value)) {
    return badRequest("文章状态无效");
  }

  return { ok: true as const, value };
}

function validatePublishedAt(value: unknown) {
  if (value === undefined || value === null) {
    return { ok: true as const, value: null };
  }

  const publishedAt = normalizeString(value);
  if (!publishedAt) {
    return { ok: true as const, value: null };
  }

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return badRequest("发布时间无效");
  }

  return { ok: true as const, value: date.toISOString() };
}

export function validateArticleStatusValue(
  value: unknown
): ValidationResult<ArticleStatus> {
  if (!isArticleStatus(value)) {
    return badRequest("文章状态无效");
  }

  return { ok: true, value };
}

export function validateCreateArticleInput(
  input: unknown
): ValidationResult<CreateArticleInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const record = input as Record<string, unknown>;
  const slug = validateArticleSlugValue(record.slug);
  if (slug instanceof ResponseFail) {
    return slug;
  }

  const title = validateTitle(record.title);
  if (title instanceof ResponseFail) {
    return title;
  }

  const summary = validateSummary(record.summary);
  if (summary instanceof ResponseFail) {
    return summary;
  }

  const content = validateContent(record.content);
  if (content instanceof ResponseFail) {
    return content;
  }

  const tags = validateTags(record.tags);
  if (tags instanceof ResponseFail) {
    return tags;
  }

  const status = validateStatus(record.status);
  if (status instanceof ResponseFail) {
    return status;
  }

  const publishedAt = validatePublishedAt(record.publishedAt);
  if (publishedAt instanceof ResponseFail) {
    return publishedAt;
  }

  return {
    ok: true,
    value: {
      slug: slug.value,
      title: title.value,
      summary: summary.value,
      content: content.value,
      tags: tags.value,
      status: status.value,
      publishedAt: publishedAt.value,
    },
  };
}

export function validateUpdateArticleInput(
  input: unknown
): ValidationResult<UpdateArticleInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const record = input as Record<string, unknown>;
  const value: UpdateArticleInput = {};

  if ("slug" in record) {
    const slug = validateArticleSlugValue(record.slug);
    if (slug instanceof ResponseFail) {
      return slug;
    }
    value.slug = slug.value;
  }

  if ("title" in record) {
    const title = validateTitle(record.title);
    if (title instanceof ResponseFail) {
      return title;
    }
    value.title = title.value;
  }

  if ("summary" in record) {
    const summary = validateSummary(record.summary);
    if (summary instanceof ResponseFail) {
      return summary;
    }
    value.summary = summary.value;
  }

  if ("content" in record) {
    const content = validateContent(record.content);
    if (content instanceof ResponseFail) {
      return content;
    }
    value.content = content.value;
  }

  if ("tags" in record) {
    const tags = validateTags(record.tags);
    if (tags instanceof ResponseFail) {
      return tags;
    }
    value.tags = tags.value;
  }

  if ("status" in record) {
    const status = validateStatus(record.status);
    if (status instanceof ResponseFail) {
      return status;
    }
    value.status = status.value;
  }

  if ("publishedAt" in record) {
    const publishedAt = validatePublishedAt(record.publishedAt);
    if (publishedAt instanceof ResponseFail) {
      return publishedAt;
    }
    value.publishedAt = publishedAt.value;
  }

  if (Object.keys(value).length === 0) {
    return badRequest("至少提供一个需要更新的字段");
  }

  return { ok: true, value };
}
