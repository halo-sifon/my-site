import { describe, expect, it } from "vitest";

import {
  AI_LIMITS,
  validateChatInput,
  validatePromptInput,
} from "@/app/api/ai/validation";
import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

function expectBadRequest(result: unknown, message: string) {
  expect(result).toBeInstanceOf(ResponseFail);
  expect(result).toEqual(
    new ResponseFail(RESPONSE_CODE.BAD_REQUEST, message)
  );
}

describe("validatePromptInput", () => {
  it("normalizes a valid prompt", () => {
    expect(validatePromptInput({ prompt: "  解释边缘计算  " })).toEqual({
      ok: true,
      value: { prompt: "解释边缘计算" },
    });
  });

  it("rejects an empty prompt", () => {
    expectBadRequest(
      validatePromptInput({ prompt: " " }),
      "Prompt 不能为空"
    );
  });

  it("rejects a prompt over the length limit", () => {
    expectBadRequest(
      validatePromptInput({
        prompt: "a".repeat(AI_LIMITS.PROMPT + 1),
      }),
      `Prompt 不能超过 ${AI_LIMITS.PROMPT} 个字符`
    );
  });
});

describe("validateChatInput", () => {
  it("normalizes valid messages", () => {
    expect(
      validateChatInput({
        messages: [
          { role: "user", content: "  你好  " },
          { role: "assistant", content: "  你好，有什么可以帮你？  " },
        ],
      })
    ).toEqual({
      ok: true,
      value: {
        messages: [
          { role: "user", content: "你好" },
          { role: "assistant", content: "你好，有什么可以帮你？" },
        ],
      },
    });
  });

  it("rejects an unsupported role", () => {
    expectBadRequest(
      validateChatInput({
        messages: [{ role: "system", content: "测试" }],
      }),
      "消息角色无效"
    );
  });

  it("rejects an empty message", () => {
    expectBadRequest(
      validateChatInput({
        messages: [{ role: "user", content: " " }],
      }),
      "消息内容不能为空"
    );
  });
});
