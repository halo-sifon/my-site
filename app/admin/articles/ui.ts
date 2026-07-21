import type { ArticleStatus } from "@/app/api/articles/validation";

const statusLabels: Record<ArticleStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

export function getArticleStatusLabel(status: ArticleStatus): string {
  return statusLabels[status];
}

export function getArticleStatusTabAction(
  currentStatus: ArticleStatus,
  nextStatus: ArticleStatus
): "refresh" | "switch" {
  return currentStatus === nextStatus ? "refresh" : "switch";
}

export function formatAdminArticleDate(value: string | null): string {
  if (!value) {
    return "未发布";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
