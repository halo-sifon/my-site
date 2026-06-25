import { describe, expect, it, vi } from "vitest";

import {
  handleChat,
  handleImageGeneration,
  handleTextGeneration,
} from "@/app/api/ai/handlers";
import {
  IMAGE_MODEL,
  TEXT_MODEL,
} from "@/app/api/ai/models";

function createJsonRequest(path: string, body: unknown) {
  return new Request(`http://example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Workers AI handlers", () => {
  it("returns a complete text answer", async () => {
    const run = vi.fn(async () => ({
      choices: [{ message: { content: "边缘计算是在靠近用户的位置处理数据。" } }],
    }));

    const response = await handleTextGeneration(
      { run },
      createJsonRequest("/api/ai/text", { prompt: "什么是边缘计算？" })
    );

    expect(run).toHaveBeenCalledWith(TEXT_MODEL, {
      messages: [{ role: "user", content: "什么是边缘计算？" }],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      code: 0,
      data: { answer: "边缘计算是在靠近用户的位置处理数据。" },
      message: "success",
    });
  });

  it("returns generated image bytes", async () => {
    const run = vi.fn(async () => ({
      image: btoa("png"),
    }));

    const response = await handleImageGeneration(
      { run },
      createJsonRequest("/api/ai/image", { prompt: "云海上的未来城市" })
    );

    expect(run).toHaveBeenCalledWith(IMAGE_MODEL, {
      prompt: "云海上的未来城市",
    });
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(
      new TextDecoder().decode(await response.arrayBuffer())
    ).toBe("png");
  });

  it("passes the Workers AI SSE stream through", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"你好"}}]}\n\n'
          )
        );
        controller.close();
      },
    });
    const run = vi.fn(async () => stream);

    const response = await handleChat(
      { run },
      createJsonRequest("/api/ai/chat", {
        messages: [{ role: "user", content: "你好" }],
      })
    );

    expect(run).toHaveBeenCalledWith(TEXT_MODEL, {
      messages: [{ role: "user", content: "你好" }],
      stream: true,
    });
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream"
    );
    expect(await response.text()).toContain('"content":"你好"');
  });
});
