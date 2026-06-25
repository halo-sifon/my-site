import { readJson } from "@/app/api/_shared/util";
import { IMAGE_MODEL, TEXT_MODEL } from "@/app/api/ai/models";
import {
  validateChatInput,
  validatePromptInput,
  type ChatMessage,
} from "@/app/api/ai/validation";
import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

type TextAiRunner = {
  run(
    model: typeof TEXT_MODEL,
    input: {
      messages: ChatMessage[];
    }
  ): Promise<{
    choices: Array<{ message: { content: string | null } }>;
  }>;
};

type ImageAiRunner = {
  run(
    model: typeof IMAGE_MODEL,
    input: { prompt: string }
  ): Promise<{ image?: string }>;
};

type ChatAiRunner = {
  run(
    model: typeof TEXT_MODEL,
    input: {
      messages: ChatMessage[];
      stream: true;
    }
  ): Promise<ReadableStream>;
};

function invalidJsonResponse(): Response {
  return ResponseFail.json(
    RESPONSE_CODE.BAD_REQUEST,
    "请求体不是有效的 JSON"
  );
}

function aiErrorResponse(scope: "text" | "image" | "chat", error: unknown) {
  console.error(
    "Workers AI 调用失败:",
    JSON.stringify({
      scope,
      error: error instanceof Error ? error.message : "unknown",
    })
  );
  return ResponseFail.json(
    RESPONSE_CODE.INTERNAL_ERROR,
    "Workers AI 调用失败"
  );
}

export async function handleTextGeneration(
  ai: TextAiRunner,
  request: Request
): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validatePromptInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const result = await ai.run(TEXT_MODEL, {
      messages: [{ role: "user", content: validation.value.prompt }],
    });
    const answer = result.choices[0]?.message.content?.trim();
    return answer
      ? ResponseSuccess.json({ answer })
      : aiErrorResponse("text", new Error("模型返回空内容"));
  } catch (error) {
    return aiErrorResponse("text", error);
  }
}

export async function handleImageGeneration(
  ai: ImageAiRunner,
  request: Request
): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validatePromptInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const result = await ai.run(IMAGE_MODEL, {
      prompt: validation.value.prompt,
    });
    if (!result.image) {
      return aiErrorResponse("image", new Error("模型返回空图片"));
    }

    const binary = atob(result.image);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );
    return new Response(bytes, {
      headers: {
        "cache-control": "no-store",
        "content-type": "image/png",
      },
    });
  } catch (error) {
    return aiErrorResponse("image", error);
  }
}

export async function handleChat(
  ai: ChatAiRunner,
  request: Request
): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return invalidJsonResponse();
  }

  const validation = validateChatInput(body.value);
  if (validation instanceof ResponseFail) {
    return ResponseFail.json(validation.code, validation.message);
  }

  try {
    const stream = await ai.run(TEXT_MODEL, {
      messages: validation.value.messages,
      stream: true,
    });
    return new Response(stream, {
      headers: {
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "content-type": "text/event-stream; charset=utf-8",
      },
    });
  } catch (error) {
    return aiErrorResponse("chat", error);
  }
}
