import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

export function apiNotFound(): Response {
  return ResponseFail.json(RESPONSE_CODE.NOT_FOUND, "接口不存在");
}
