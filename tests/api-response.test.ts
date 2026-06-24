import { describe, expect, it } from "vitest";

import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

describe("API response classes", () => {
  it("serializes successful responses with a configurable HTTP status", async () => {
    const response = ResponseSuccess.json({ id: 1 }, { status: 201 });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      code: RESPONSE_CODE.SUCCESS,
      data: { id: 1 },
      message: "success",
    });
  });

  it("serializes failed responses with matching code and HTTP status", async () => {
    const response = ResponseFail.json(
      RESPONSE_CODE.NOT_FOUND,
      "笔记不存在"
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      code: RESPONSE_CODE.NOT_FOUND,
      data: null,
      message: "笔记不存在",
    });
  });
});
