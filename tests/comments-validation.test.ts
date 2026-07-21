import { describe, expect, it } from "vitest";

import {
  validateCreateCommentInput,
  validateUpdateCommentStatusInput,
} from "@/app/api/comments/validation";
import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

function expectBadRequest(result: unknown, message: string) {
  expect(result).toBeInstanceOf(ResponseFail);
  expect(result).toEqual(
    new ResponseFail(RESPONSE_CODE.BAD_REQUEST, message)
  );
}

describe("validateCreateCommentInput", () => {
  it("normalizes a valid comment", () => {
    expect(
      validateCreateCommentInput({
        authorName: "  sifon  ",
        authorEmail: "  sifon@example.com  ",
        content: "  留言内容  ",
      })
    ).toEqual({
      ok: true,
      value: {
        authorName: "sifon",
        authorEmail: "sifon@example.com",
        content: "留言内容",
      },
    });
  });

  it("accepts an omitted email", () => {
    expect(
      validateCreateCommentInput({
        authorName: "sifon",
        content: "留言内容",
      })
    ).toEqual({
      ok: true,
      value: {
        authorName: "sifon",
        authorEmail: null,
        content: "留言内容",
      },
    });
  });

  it("rejects empty fields", () => {
    expectBadRequest(
      validateCreateCommentInput({ authorName: " ", content: "留言内容" }),
      "昵称不能为空"
    );

    expectBadRequest(
      validateCreateCommentInput({ authorName: "sifon", content: " " }),
      "留言内容不能为空"
    );
  });

  it("rejects an invalid email", () => {
    expectBadRequest(
      validateCreateCommentInput({
        authorName: "sifon",
        authorEmail: "not-email",
        content: "留言内容",
      }),
      "邮箱格式无效"
    );
  });
});

describe("validateUpdateCommentStatusInput", () => {
  it("accepts approved or rejected status", () => {
    expect(validateUpdateCommentStatusInput({ status: "approved" })).toEqual({
      ok: true,
      value: { status: "approved" },
    });

    expect(validateUpdateCommentStatusInput({ status: "rejected" })).toEqual({
      ok: true,
      value: { status: "rejected" },
    });
  });

  it("rejects an invalid status", () => {
    expectBadRequest(
      validateUpdateCommentStatusInput({ status: "pending" }),
      "留言状态无效"
    );
  });
});
