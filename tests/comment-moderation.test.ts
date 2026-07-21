import { describe, expect, it, vi } from "vitest";

import { moderateCommentWithAi } from "@/app/api/comments/moderation";
import { TEXT_MODEL } from "@/app/api/ai/models";

describe("moderateCommentWithAi", () => {
  it("approves a safe comment from the AI JSON response", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"approved":true,"reason":"内容正常"}',
            },
          },
        ],
      }),
    };

    await expect(
      moderateCommentWithAi(ai, {
        authorName: "sifon",
        content: "这篇文章很有帮助",
      })
    ).resolves.toEqual({
      approved: true,
      reason: "内容正常",
    });
    expect(ai.run).toHaveBeenCalledWith(TEXT_MODEL, {
      messages: [
        {
          role: "user",
          content: expect.stringContaining("这篇文章很有帮助"),
        },
      ],
    });
  });

  it("rejects an unsafe comment from the AI JSON response", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"approved":false,"reason":"广告内容"}',
            },
          },
        ],
      }),
    };

    await expect(
      moderateCommentWithAi(ai, {
        authorName: "spam",
        content: "点击链接购买假证",
      })
    ).resolves.toEqual({
      approved: false,
      reason: "广告内容",
    });
  });

  it("rejects when the AI response is not parseable JSON", async () => {
    const ai = {
      run: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "可以发布" } }],
      }),
    };

    await expect(
      moderateCommentWithAi(ai, {
        authorName: "sifon",
        content: "普通留言",
      })
    ).resolves.toEqual({
      approved: false,
      reason: "AI 审核返回格式异常",
    });
  });
});
