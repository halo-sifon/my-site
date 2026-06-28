import { describe, expect, it } from "vitest";

import { consumeSseEvents } from "@/app/admin/labs/workers-ai/sse";

describe("consumeSseEvents", () => {
  it("extracts text from complete SSE events and keeps partial data", () => {
    expect(
      consumeSseEvents(
        [
          'data: {"choices":[{"delta":{"content":"你"}}]}',
          "",
          'data: {"choices":[{"delta":{"content":"好"}}]}',
          "",
          'data: {"choices":',
        ].join("\n")
      )
    ).toEqual({
      content: "你好",
      done: false,
      rest: 'data: {"choices":',
    });
  });

  it("recognizes the done event", () => {
    expect(consumeSseEvents("data: [DONE]\n\n")).toEqual({
      content: "",
      done: true,
      rest: "",
    });
  });
});
