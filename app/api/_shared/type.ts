import { ResponseFail } from "@/lib/api-response";

export type ValidationResult<T> = { ok: true; value: T } | ResponseFail;

export type RouteContext = {
  params: Promise<{ id: string }>;
};
