import { describe, expect, it } from "vitest";

import {
  formatAdminArticleDate,
  getArticleStatusTabAction,
  getArticleStatusLabel,
} from "@/app/admin/articles/ui";

describe("admin articles UI helpers", () => {
  it("formats article status labels for the manager page", () => {
    expect(getArticleStatusLabel("draft")).toBe("草稿");
    expect(getArticleStatusLabel("published")).toBe("已发布");
    expect(getArticleStatusLabel("archived")).toBe("已归档");
  });

  it("formats missing and existing article dates", () => {
    expect(formatAdminArticleDate(null)).toBe("未发布");
    expect(formatAdminArticleDate("2026-06-29T02:30:56.000Z")).toContain(
      "2026"
    );
  });

  it("refreshes instead of switching when clicking the active status tab", () => {
    expect(getArticleStatusTabAction("draft", "draft")).toBe("refresh");
    expect(getArticleStatusTabAction("draft", "published")).toBe("switch");
  });
});
