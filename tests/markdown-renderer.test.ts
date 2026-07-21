import { describe, expect, it } from "vitest";

import { parseMarkdownBlocks } from "@/lib/markdown";

describe("parseMarkdownBlocks", () => {
  it("parses headings, paragraphs, lists, links, and inline code", () => {
    const blocks = parseMarkdownBlocks(`# 每周开发记录

本周完成了文章系统。
技术栈：\`Next.js 16\`。

## 1. [项目主页](https://example.com/project)

主要改动

- 新增：文章列表
- 新增：文章详情`);

    expect(blocks).toEqual([
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "每周开发记录" }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "本周完成了文章系统。 技术栈：",
          },
          { type: "code", text: "Next.js 16" },
          { type: "text", text: "。" },
        ],
      },
      {
        type: "heading",
        level: 2,
        children: [
          { type: "text", text: "1. " },
          {
            type: "link",
            text: "项目主页",
            href: "https://example.com/project",
          },
        ],
      },
      {
        type: "paragraph",
        children: [{ type: "text", text: "主要改动" }],
      },
      {
        type: "list",
        items: [
          [{ type: "text", text: "新增：文章列表" }],
          [{ type: "text", text: "新增：文章详情" }],
        ],
      },
    ]);
  });

  it("keeps unsafe links as plain text", () => {
    expect(
      parseMarkdownBlocks("跳转：[bad](javascript:alert(1))")[0]
    ).toEqual({
      type: "paragraph",
      children: [
        { type: "text", text: "跳转：[bad](javascript:alert(1))" },
      ],
    });
  });
});
