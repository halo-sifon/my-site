type SseResult = {
  content: string;
  done: boolean;
  rest: string;
};

function readEventContent(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  if (typeof record.response === "string") {
    return record.response;
  }

  if (!Array.isArray(record.choices)) {
    return "";
  }

  const choice = record.choices[0];
  if (!choice || typeof choice !== "object") {
    return "";
  }

  const delta = (choice as Record<string, unknown>).delta;
  if (!delta || typeof delta !== "object") {
    return "";
  }

  const content = (delta as Record<string, unknown>).content;
  return typeof content === "string" ? content : "";
}

export function consumeSseEvents(buffer: string): SseResult {
  const events = buffer.split(/\r?\n\r?\n/);
  const rest = events.pop() ?? "";
  let content = "";
  let done = false;

  for (const event of events) {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!data) {
      continue;
    }

    if (data === "[DONE]") {
      done = true;
      continue;
    }

    try {
      content += readEventContent(JSON.parse(data));
    } catch {
      // Ignore malformed/incomplete events and continue reading the stream.
    }
  }

  return { content, done, rest };
}
