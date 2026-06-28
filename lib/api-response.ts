export const RESPONSE_CODE = {
  /** 成功 */
  SUCCESS: 0,
  /** 错误的请求 */
  BAD_REQUEST: 400,
  /** 未认证 */
  UNAUTHORIZED: 401,
  /** 无权限 */
  FORBIDDEN: 403,
  /** 未找到 */
  NOT_FOUND: 404,
  /** 服务端错误 */
  INTERNAL_ERROR: 500,
} as const;

export type ApiResponseBody<T> = {
  code: number;
  data: T | null;
  message: string;
};

type FailureCode = (typeof RESPONSE_CODE)[Exclude<
  keyof typeof RESPONSE_CODE,
  "SUCCESS"
>];

/**
 * API 响应基类。
 *
 * 所有业务接口统一输出 `{ code, data, message }`，避免各路由各自拼响应结构。
 */
export abstract class ApiResponse<T> {
  abstract readonly code: number;
  abstract readonly data: T | null;
  abstract readonly message: string;

  toJSON(): ApiResponseBody<T> {
    return {
      code: this.code,
      data: this.data,
      message: this.message,
    };
  }
}

/**
 * 成功响应。
 *
 * `init` 透传给 `Response.json`，用于调用方指定 201 等 HTTP 状态。
 */
export class ResponseSuccess<T> extends ApiResponse<T> {
  readonly code = RESPONSE_CODE.SUCCESS;
  readonly message: string;

  constructor(
    readonly data: T,
    message: string = "success"
  ) {
    super();
    this.message = message;
  }

  static json<T>(data: T, init: ResponseInit = {}, message?: string): Response {
    return Response.json(new ResponseSuccess(data, message).toJSON(), init);
  }
}

/**
 * 失败响应。
 *
 * 业务失败和校验失败都通过这里返回，HTTP status 与业务 code 保持一致。
 */
export class ResponseFail extends ApiResponse<null> {
  readonly data = null;

  constructor(
    readonly code: FailureCode,
    readonly message: string
  ) {
    super();
  }

  static json(code: FailureCode, message: string): Response {
    return Response.json(new ResponseFail(code, message).toJSON(), {
      status: code,
    });
  }
}
