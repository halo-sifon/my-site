export const RESPONSE_CODE = {
  /** 成功 */
  SUCCESS: 0,
  /** 错误的请求 */
  BAD_REQUEST: 400,
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
