import { TEXT_MODEL } from "@/app/api/ai/models";

type CommentModerationMessage = {
  role: "user";
  content: string;
};

export type CommentModerationAiRunner = {
  run(
    model: typeof TEXT_MODEL,
    input: {
      messages: CommentModerationMessage[];
    }
  ): Promise<{
    choices: Array<{ message: { content: string | null } }>;
  }>;
};

export type CommentModerationInput = {
  authorName: string;
  content: string;
};

export type CommentModerationDecision = {
  approved: boolean;
  reason: string;
};

function buildModerationPrompt(input: CommentModerationInput): string {
  return [
    "你是网站留言审核器。请判断下面留言是否适合公开展示。",
    "拒绝：广告、引流、辱骂、人身攻击、色情、违法、隐私泄露、明显垃圾内容。",
    "允许：正常讨论、技术问题、不同意见、礼貌批评。",
    '只返回 JSON，不要 Markdown，不要解释。格式：{"approved":true,"reason":"简短原因"}',
    `昵称：${input.authorName}`,
    `留言：${input.content}`,
  ].join("\n");
}

function extractJsonObject(content: string): unknown | null {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeDecision(value: unknown): CommentModerationDecision {
  if (!value || typeof value !== "object") {
    return { approved: false, reason: "AI 审核返回格式异常" };
  }

  const record = value as Record<string, unknown>;
  if (typeof record.approved !== "boolean") {
    return { approved: false, reason: "AI 审核返回格式异常" };
  }

  return {
    approved: record.approved,
    reason:
      typeof record.reason === "string" && record.reason.trim()
        ? record.reason.trim().slice(0, 120)
        : record.approved
          ? "内容正常"
          : "内容不适合公开展示",
  };
}

export async function moderateCommentWithAi(
  ai: CommentModerationAiRunner,
  input: CommentModerationInput
): Promise<CommentModerationDecision> {
  const result = await ai.run(TEXT_MODEL, {
    messages: [{ role: "user", content: buildModerationPrompt(input) }],
  });
  const content = result.choices[0]?.message.content;

  if (!content) {
    return { approved: false, reason: "AI 审核返回格式异常" };
  }

  return normalizeDecision(extractJsonObject(content));
}
