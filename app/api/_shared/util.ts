import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

export function parsePositiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function readJson(request: Request) {
  try {
    return { ok: true as const, value: await request.json() };
  } catch {
    return { ok: false as const };
  }
}

export function internalErrorResponse(): Response {
  return ResponseFail.json(RESPONSE_CODE.INTERNAL_ERROR, "服务器内部错误");
}

export function badRequest(message: string): ResponseFail {
  return new ResponseFail(RESPONSE_CODE.BAD_REQUEST, message);
}
