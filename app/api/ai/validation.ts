import { badRequest } from "@/app/api/_shared/util";
import type { ValidationResult } from "@/app/api/_shared/type";

export const AI_LIMITS = {
  PROMPT: 2000,
  CHAT_MESSAGES: 20,
  CHAT_MESSAGE: 2000,
} as const;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PromptInput = {
  prompt: string;
};

export type ChatInput = {
  messages: ChatMessage[];
};

export function validatePromptInput(
  input: unknown
): ValidationResult<PromptInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const { prompt } = input as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return badRequest("Prompt 不能为空");
  }

  const normalizedPrompt = prompt.trim();
  if (normalizedPrompt.length > AI_LIMITS.PROMPT) {
    return badRequest(
      `Prompt 不能超过 ${AI_LIMITS.PROMPT} 个字符`
    );
  }

  return { ok: true, value: { prompt: normalizedPrompt } };
}

export function validateChatInput(
  input: unknown
): ValidationResult<ChatInput> {
  if (!input || typeof input !== "object") {
    return badRequest("请求体格式错误");
  }

  const { messages } = input as Record<string, unknown>;
  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("消息不能为空");
  }

  if (messages.length > AI_LIMITS.CHAT_MESSAGES) {
    return badRequest(
      `消息不能超过 ${AI_LIMITS.CHAT_MESSAGES} 条`
    );
  }

  const normalizedMessages: ChatMessage[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      return badRequest("消息格式错误");
    }

    const { role, content } = message as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") {
      return badRequest("消息角色无效");
    }

    if (typeof content !== "string" || !content.trim()) {
      return badRequest("消息内容不能为空");
    }

    const normalizedContent = content.trim();
    if (normalizedContent.length > AI_LIMITS.CHAT_MESSAGE) {
      return badRequest(
        `单条消息不能超过 ${AI_LIMITS.CHAT_MESSAGE} 个字符`
      );
    }

    normalizedMessages.push({ role, content: normalizedContent });
  }

  return { ok: true, value: { messages: normalizedMessages } };
}
