import { handlePaginatedList } from "@/app/api/_shared/handle-paginated-list";
import {
  internalErrorResponse,
  parsePositiveInteger,
  readJson,
} from "@/app/api/_shared/util";
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from "@/app/api/notes/queries";
import {
  validateCreateNoteInput,
  validateUpdateNoteInput,
} from "@/app/api/notes/validation";
import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

export function handleListNotes(
  db: D1Database,
  request: Request
): Promise<Response> {
  return handlePaginatedList(request, (pagination) =>
    listNotes(db, pagination)
  );
}

export async function handleCreateNote(
  db: D1Database,
  request: Request
): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return ResponseFail.json(
      RESPONSE_CODE.BAD_REQUEST,
      "请求体不是有效的 JSON"
    );
  }

  const validation = validateCreateNoteInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    return ResponseSuccess.json(await createNote(db, validation.value), {
      status: 201,
    });
  } catch {
    return internalErrorResponse();
  }
}

export async function handleGetNote(
  db: D1Database,
  idValue: string
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  try {
    const note = await getNoteById(db, id);
    return note
      ? ResponseSuccess.json(note)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "笔记不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleUpdateNote(
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
    return ResponseFail.json(
      RESPONSE_CODE.BAD_REQUEST,
      "请求体不是有效的 JSON"
    );
  }

  const validation = validateUpdateNoteInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const note = await updateNote(db, id, validation.value);
    return note
      ? ResponseSuccess.json(note)
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "不存在");
  } catch {
    return internalErrorResponse();
  }
}

export async function handleDeleteNote(
  db: D1Database,
  idValue: string
): Promise<Response> {
  const id = parsePositiveInteger(idValue);
  if (!id) {
    return ResponseFail.json(RESPONSE_CODE.BAD_REQUEST, "ID 无效");
  }

  try {
    return (await deleteNote(db, id))
      ? ResponseSuccess.json({ id })
      : ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "笔记不存在");
  } catch {
    return internalErrorResponse();
  }
}
