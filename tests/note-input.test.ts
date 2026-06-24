import { describe, expect, it } from "vitest";

import {
  validateCreateNoteInput,
  validateUpdateNoteInput,
} from "@/app/api/notes/validation";
import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

function expectBadRequest(result: unknown, message: string) {
  expect(result).toBeInstanceOf(ResponseFail);
  expect(result).toEqual(
    new ResponseFail(RESPONSE_CODE.BAD_REQUEST, message)
  );
}

describe("validateCreateNoteInput", () => {
  it("normalizes a valid note", () => {
    expect(
      validateCreateNoteInput({ title: "  标题  ", content: "  内容  " })
    ).toEqual({
      ok: true,
      value: { title: "标题", content: "内容" },
    });
  });

  it("rejects an empty title", () => {
    expectBadRequest(
      validateCreateNoteInput({ title: " ", content: "" }),
      "标题不能为空"
    );
  });

  it("rejects fields over their limits", () => {
    expectBadRequest(
      validateCreateNoteInput({ title: "a".repeat(121), content: "" }),
      "标题不能超过 120 个字符"
    );

    expectBadRequest(
      validateCreateNoteInput({
        title: "标题",
        content: "a".repeat(5001),
      }),
      "内容不能超过 5000 个字符"
    );
  });
});

describe("validateUpdateNoteInput", () => {
  it("accepts a partial update", () => {
    expect(validateUpdateNoteInput({ content: "  新内容  " })).toEqual({
      ok: true,
      value: { content: "新内容" },
    });
  });

  it("rejects an update without editable fields", () => {
    expectBadRequest(
      validateUpdateNoteInput({}),
      "至少提供一个需要更新的字段"
    );
  });

  it("rejects an empty title", () => {
    expectBadRequest(
      validateUpdateNoteInput({ title: " " }),
      "标题不能为空"
    );
  });
});
