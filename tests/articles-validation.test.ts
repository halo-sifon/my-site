import { describe, expect, it } from "vitest";

import {
  validateCreateArticleInput,
  validateUpdateArticleInput,
} from "@/app/api/articles/validation";
import { RESPONSE_CODE, ResponseFail } from "@/lib/api-response";

function expectBadRequest(result: unknown, message: string) {
  expect(result).toBeInstanceOf(ResponseFail);
  expect(result).toEqual(
    new ResponseFail(RESPONSE_CODE.BAD_REQUEST, message)
  );
}

describe("validateCreateArticleInput", () => {
  it("normalizes a valid article", () => {
    expect(
      validateCreateArticleInput({
        slug: "  hello-world  ",
        title: "  标题  ",
        summary: "  摘要  ",
        content: "  正文  ",
        tags: [" Next.js ", "Cloudflare", ""],
        status: "published",
      })
    ).toEqual({
      ok: true,
      value: {
        slug: "hello-world",
        title: "标题",
        summary: "摘要",
        content: "正文",
        tags: ["Next.js", "Cloudflare"],
        status: "published",
        publishedAt: null,
      },
    });
  });

  it("rejects an empty title", () => {
    expectBadRequest(
      validateCreateArticleInput({
        slug: "hello-world",
        title: " ",
        content: "正文",
      }),
      "标题不能为空"
    );
  });

  it("rejects an invalid slug", () => {
    expectBadRequest(
      validateCreateArticleInput({
        slug: "Hello_World",
        title: "标题",
        content: "正文",
      }),
      "slug 只能包含小写字母、数字和短横线"
    );
  });

  it("rejects empty content", () => {
    expectBadRequest(
      validateCreateArticleInput({
        slug: "hello-world",
        title: "标题",
        content: " ",
      }),
      "正文不能为空"
    );
  });

  it("rejects an invalid status", () => {
    expectBadRequest(
      validateCreateArticleInput({
        slug: "hello-world",
        title: "标题",
        content: "正文",
        status: "online",
      }),
      "文章状态无效"
    );
  });

  it("rejects an invalid publishedAt value", () => {
    expectBadRequest(
      validateCreateArticleInput({
        slug: "hello-world",
        title: "标题",
        content: "正文",
        publishedAt: "not-a-date",
      }),
      "发布时间无效"
    );
  });
});

describe("validateUpdateArticleInput", () => {
  it("accepts a partial update", () => {
    expect(validateUpdateArticleInput({ title: "  新标题  " })).toEqual({
      ok: true,
      value: { title: "新标题" },
    });
  });

  it("rejects an update without editable fields", () => {
    expectBadRequest(
      validateUpdateArticleInput({}),
      "至少提供一个需要更新的字段"
    );
  });

  it("rejects an invalid status", () => {
    expectBadRequest(
      validateUpdateArticleInput({ status: "online" }),
      "文章状态无效"
    );
  });

  it("rejects an invalid publishedAt update", () => {
    expectBadRequest(
      validateUpdateArticleInput({ publishedAt: "not-a-date" }),
      "发布时间无效"
    );
  });
});
