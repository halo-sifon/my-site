import { describe, expect, it } from "vitest";

import {
  parsePositiveInteger,
  readJson,
} from "@/app/api/_shared/util";

describe("parsePositiveInteger", () => {
  it.each([
    ["1", 1],
    ["100", 100],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
  ])("parses %s", (value, expected) => {
    expect(parsePositiveInteger(value)).toBe(expected);
  });

  it.each([
    null,
    "",
    "0",
    "-1",
    "1.5",
    "invalid",
    String(Number.MAX_SAFE_INTEGER + 1),
  ])("rejects %s", (value) => {
    expect(parsePositiveInteger(value)).toBeNull();
  });
});

describe("readJson", () => {
  it("returns parsed JSON", async () => {
    const result = await readJson(
      new Request("http://example.com/api/items", {
        method: "POST",
        body: JSON.stringify({ title: "标题" }),
      })
    );

    expect(result).toEqual({
      ok: true,
      value: { title: "标题" },
    });
  });

  it("returns a failure result for invalid JSON", async () => {
    const result = await readJson(
      new Request("http://example.com/api/items", {
        method: "POST",
        body: "{",
      })
    );

    expect(result).toEqual({ ok: false });
  });
});
