import { handlePaginatedList } from "@/app/api/_shared/handle-paginated-list";
import {
  internalErrorResponse,
  parsePositiveInteger,
  readJson,
} from "@/app/api/_shared/util";
import {
  createArticle,
  deleteArticle,
  getArticleById,
  getPublishedArticleBySlug,
  listAdminArticles,
  listPublishedArticles,
  updateArticle,
} from "@/app/api/articles/queries";
import {
  validateArticleSlugValue,
  validateArticleStatusValue,
  validateCreateArticleInput,
  validateUpdateArticleInput,
} from "@/app/api/articles/validation";
import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

function invalidJsonResponse(): Response {
  return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "请求体不是有效的 JSON");
}

export function handleListPublishedArticles(
  db: D1Database,
  request: Request
): Promise<Response> {
  return handlePaginatedList(request, (pagination) =>
    listPublishedArticles(db, pagination)
  );
}

export function handleListAdminArticles(
  db: D1Database,
  request: Request
): Promise<Response> {
  const statusValue = new URL(request.url).searchParams.get("status");
  if (statusValue) {
    const status = validateArticleStatusValue(statusValue);
    if (status instanceof ResponseFail) {
      return Promise.resolve(
        ResponseFail.json(status.code, status.message)
      );
    }

    return handlePaginatedList(request, (pagination) =>
      listAdminArticles(db, pagination, status.value)
    );
  }

  return handlePaginatedList(request, (pagination) =>
    listAdminArticles(db, pagination)
  );
}

export async function handleGetPublishedArticle(
  db: D1Database,
  slugValue: string
): Promise<Response> {
  const slug = validateArticleSlugValue(slugValue);
  if (slug instanceof ResponseFail) {
    return ResponseFail.json(slug.code, slug.message);
  }

  try {
    const article = await getPublishedArticleBySlug(db, slug.value);
    return article
      ? ResponseSuccess.json(article)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleGetAdminArticle(
  db: D1Database,
  idValue: string
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  try {
    const article = await getArticleById(db, id);
    return article
      ? ResponseSuccess.json(article)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleCreateArticle(
  db: D1Database,
  request: Request
): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validateCreateArticleInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    return ResponseSuccess.json(await createArticle(db, validation.value), {
      status: 201,
    });
  } catch {
    return internalErrorResponse();
  }
}

export async function handleUpdateArticle(
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

  const validation = validateUpdateArticleInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const article = await updateArticle(db, id, validation.value);
    return article
      ? ResponseSuccess.json(article)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleDeleteArticle(
  db: D1Database,
  idValue: string
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  try {
    return (await deleteArticle(db, id))
      ? ResponseSuccess.json({ id })
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "文章不存在");
  } catch {
    return internalErrorResponse();
  }
}
