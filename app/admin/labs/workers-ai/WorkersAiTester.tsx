"use client";

import { useEffect, useState } from "react";

import type { ChatMessage } from "@/app/api/ai/validation";
import type { ApiResponseBody } from "@/lib/api-response";
import { consumeSseEvents } from "./sse";

type Props = {
  textModel: string;
  imageModel: string;
};

type DisplayMessage = ChatMessage & {
  id: string;
};

const aiApiPath = "/api/admin/ai";

async function readApiData<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponseBody<T>;
  if (!response.ok || body.code !== 0 || body.data === null) {
    throw new Error(body.message || "请求失败");
  }
  return body.data;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiResponseBody<never>;
    return body.message || "请求失败";
  } catch {
    return "请求失败";
  }
}

function ModelLabel({ model }: { model: string }) {
  return <p className="mt-1 break-all text-caption-mono text-mute">{model}</p>;
}

export function WorkersAiTester({ textModel, imageModel }: Props) {
  const [textPrompt, setTextPrompt] = useState(
    "用三句话解释 Cloudflare Workers AI"
  );
  const [textAnswer, setTextAnswer] = useState("");
  const [textError, setTextError] = useState("");
  const [textElapsed, setTextElapsed] = useState<number | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState(
    "一座漂浮在云海上的未来城市，极简科幻插画"
  );
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageElapsed, setImageElapsed] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<DisplayMessage[]>([]);
  const [chatError, setChatError] = useState("");
  const [chatElapsed, setChatElapsed] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  async function submitText(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const startedAt = performance.now();
    setTextLoading(true);
    setTextAnswer("");
    setTextError("");
    setTextElapsed(null);

    try {
      const response = await fetch(`${aiApiPath}/text`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: textPrompt }),
      });
      const data = await readApiData<{ answer: string }>(response);
      setTextAnswer(data.answer);
    } catch (error) {
      setTextError(error instanceof Error ? error.message : "生成失败");
    } finally {
      setTextElapsed(Math.round(performance.now() - startedAt));
      setTextLoading(false);
    }
  }

  async function submitImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startedAt = performance.now();
    setImageLoading(true);
    setImageError("");
    setImageElapsed(null);

    try {
      const response = await fetch(`${aiApiPath}/image`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const nextUrl = URL.createObjectURL(await response.blob());
      setImageUrl(nextUrl);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "生成失败");
    } finally {
      setImageElapsed(Math.round(performance.now() - startedAt));
      setImageLoading(false);
    }
  }

  async function submitChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) {
      return;
    }

    const startedAt = performance.now();
    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage: DisplayMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const requestMessages = [...chatMessages, userMessage].map(
      ({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      })
    );

    setChatMessages((current) => [...current, userMessage, assistantMessage]);
    setChatInput("");
    setChatError("");
    setChatElapsed(null);
    setChatLoading(true);

    try {
      const response = await fetch(`${aiApiPath}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: requestMessages }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      if (!response.body) {
        throw new Error("浏览器未收到流式响应");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const parsed = consumeSseEvents(chunk.done ? `${buffer}\n\n` : buffer);
        buffer = parsed.rest;
        done = chunk.done || parsed.done;

        if (parsed.content) {
          setChatMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: message.content + parsed.content,
                  }
                : message
            )
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败";
      setChatError(message);
      setChatMessages((current) =>
        current.map((item) =>
          item.id === assistantId && !item.content
            ? { ...item, content: "回复生成失败。" }
            : item
        )
      );
    } finally {
      setChatElapsed(Math.round(performance.now() - startedAt));
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">文本回答</h2>
        <ModelLabel model={textModel} />
        <form className="mt-5 space-y-4" onSubmit={submitText}>
          <textarea
            aria-label="文本 Prompt"
            className="min-h-28 w-full resize-y rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
            maxLength={2000}
            onChange={(event) => setTextPrompt(event.target.value)}
            required
            value={textPrompt}
          />
          <button
            className="btn-primary min-h-10 px-5 disabled:opacity-50"
            disabled={textLoading}
            type="submit"
          >
            {textLoading ? "生成中..." : "生成回答"}
          </button>
        </form>
        {textError && (
          <p className="mt-4 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
            {textError}
          </p>
        )}
        {textAnswer && (
          <div className="mt-4 whitespace-pre-wrap rounded-md bg-canvas-soft p-4 text-body-md text-body">
            {textAnswer}
          </div>
        )}
        {textElapsed !== null && (
          <p className="mt-3 text-caption text-mute">耗时 {textElapsed} ms</p>
        )}
      </section>

      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">图片生成</h2>
        <ModelLabel model={imageModel} />
        <form className="mt-5 space-y-4" onSubmit={submitImage}>
          <textarea
            aria-label="图片 Prompt"
            className="min-h-28 w-full resize-y rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
            maxLength={2000}
            onChange={(event) => setImagePrompt(event.target.value)}
            required
            value={imagePrompt}
          />
          <button
            className="btn-primary min-h-10 px-5 disabled:opacity-50"
            disabled={imageLoading}
            type="submit"
          >
            {imageLoading ? "生成中..." : "生成图片"}
          </button>
        </form>
        {imageError && (
          <p className="mt-4 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
            {imageError}
          </p>
        )}
        {imageUrl && (
          // The image is generated dynamically and has no stable dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={imagePrompt}
            className="mt-4 max-h-160 w-full rounded-md border border-hairline object-contain"
            src={imageUrl}
          />
        )}
        {imageElapsed !== null && (
          <p className="mt-3 text-caption text-mute">耗时 {imageElapsed} ms</p>
        )}
      </section>

      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">流式对话</h2>
        <ModelLabel model={textModel} />
        <div className="mt-5 min-h-48 space-y-3 rounded-md bg-canvas-soft p-4">
          {chatMessages.length === 0 ? (
            <p className="text-body-sm text-mute">
              发送一条消息，测试 SSE 流式返回。
            </p>
          ) : (
            chatMessages.map((message) => (
              <div
                className={`max-w-[88%] rounded-md px-3 py-2 text-body-sm ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-on-primary"
                    : "bg-canvas text-body"
                }`}
                key={message.id}
              >
                <p className="mb-1 text-caption-mono opacity-70">
                  {message.role}
                </p>
                <p className="whitespace-pre-wrap">
                  {message.content || (chatLoading ? "正在生成..." : "无内容")}
                </p>
              </div>
            ))
          )}
        </div>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={submitChat}
        >
          <input
            aria-label="对话消息"
            className="min-h-10 flex-1 rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
            maxLength={2000}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="输入消息"
            value={chatInput}
          />
          <button
            className="btn-primary min-h-10 px-5 disabled:opacity-50"
            disabled={chatLoading || !chatInput.trim()}
            type="submit"
          >
            {chatLoading ? "回复中..." : "发送"}
          </button>
        </form>
        {chatError && (
          <p className="mt-4 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
            {chatError}
          </p>
        )}
        {chatElapsed !== null && (
          <p className="mt-3 text-caption text-mute">耗时 {chatElapsed} ms</p>
        )}
      </section>
    </div>
  );
}
