"use client";

import { useEffect, useState } from "react";

import type {
  Article,
  ArticleListItem,
  PaginatedArticles,
} from "@/app/api/articles/queries";
import type { ArticleStatus } from "@/app/api/articles/validation";
import {
  formatAdminArticleDate,
  getArticleStatusTabAction,
  getArticleStatusLabel,
} from "@/app/admin/articles/ui";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { ApiResponseBody } from "@/lib/api-response";

const articlesApiPath = "/api/admin/articles";
const statusTabs: ArticleStatus[] = ["draft", "published", "archived"];

async function readApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponseBody<T>;
  if (!response.ok || body.code !== 0 || body.data === null) {
    throw new Error(body.message || "请求失败");
  }

  return body.data;
}

export function ArticlesManager() {
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadArticles(nextStatus = status) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${articlesApiPath}?status=${nextStatus}&page=1&pageSize=100`
      );
      const data = await readApiResponse<PaginatedArticles>(response);
      setArticles(data.items);

      if (
        selectedArticle &&
        !data.items.some((article) => article.id === selectedArticle.id)
      ) {
        setSelectedArticle(null);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "加载失败"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void fetch(`${articlesApiPath}?status=${status}&page=1&pageSize=100`)
      .then((response) => readApiResponse<PaginatedArticles>(response))
      .then((data) => {
        if (!cancelled) {
          setArticles(data.items);
          setSelectedArticle(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "加载失败"
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  async function selectArticle(article: ArticleListItem) {
    setDetailLoading(true);
    setError("");

    try {
      const response = await fetch(`${articlesApiPath}/${article.id}`);
      setSelectedArticle(await readApiResponse<Article>(response));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "加载详情失败"
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(article: ArticleListItem, nextStatus: ArticleStatus) {
    setActingId(article.id);
    setError("");

    try {
      const response = await fetch(`${articlesApiPath}/${article.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const updatedArticle = await readApiResponse<Article>(response);

      if (nextStatus === status) {
        setSelectedArticle(updatedArticle);
      } else {
        setSelectedArticle((current) =>
          current?.id === article.id ? null : current
        );
      }
      await loadArticles(status);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "更新失败"
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-display-sm">文章列表</h2>
            <p className="mt-1 text-body-sm text-body">
              草稿确认后可发布到公开文章列表。
            </p>
          </div>
          <button
            className="text-button-md text-link disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadArticles(status)}
            type="button"
          >
            刷新
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {statusTabs.map((item) => (
            <button
              className={
                item === status
                  ? "rounded-full bg-primary px-4 py-2 text-button-md text-on-primary"
                  : "rounded-full border border-hairline px-4 py-2 text-button-md text-body hover:border-primary"
              }
              key={item}
              onClick={() => {
                if (getArticleStatusTabAction(status, item) === "refresh") {
                  void loadArticles(item);
                  return;
                }

                setLoading(true);
                setError("");
                setStatus(item);
              }}
              type="button"
            >
              {getArticleStatusLabel(item)}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-body-sm text-mute">加载中...</p>
        ) : articles.length === 0 ? (
          <p className="rounded-md bg-canvas-soft p-6 text-center text-body-sm text-mute">
            当前状态下暂无文章。
          </p>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <article
                className="rounded-md border border-hairline p-4"
                key={article.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="badge-secondary">
                        {getArticleStatusLabel(article.status)}
                      </span>
                    </div>
                    <h3 className="text-body-md-strong">{article.title}</h3>
                    <p className="mt-2 text-body-sm text-body">
                      {article.summary || "暂无摘要"}
                    </p>
                    <p className="mt-3 text-caption text-mute">
                      ID {article.id} · slug: {article.slug} · 发布于{" "}
                      {formatAdminArticleDate(article.publishedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <button
                      className="text-button-md text-link disabled:opacity-50"
                      disabled={detailLoading}
                      onClick={() => void selectArticle(article)}
                      type="button"
                    >
                      预览
                    </button>
                    {article.status !== "published" && (
                      <button
                        className="text-button-md text-link disabled:opacity-50"
                        disabled={actingId === article.id}
                        onClick={() => void updateStatus(article, "published")}
                        type="button"
                      >
                        发布
                      </button>
                    )}
                    {article.status !== "archived" && (
                      <button
                        className="text-button-md text-error disabled:opacity-50"
                        disabled={actingId === article.id}
                        onClick={() => void updateStatus(article, "archived")}
                        type="button"
                      >
                        归档
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">文章预览</h2>
        {detailLoading ? (
          <p className="mt-5 text-body-sm text-mute">加载详情中...</p>
        ) : selectedArticle ? (
          <article className="mt-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="badge-secondary">
                {getArticleStatusLabel(selectedArticle.status)}
              </span>
            </div>
            <h3 className="text-display-sm">{selectedArticle.title}</h3>
            <p className="mt-2 text-body-sm text-body">
              {selectedArticle.summary || "暂无摘要"}
            </p>
            <p className="mt-3 text-caption text-mute">
              slug: {selectedArticle.slug}
            </p>
            <MarkdownContent
              className="mt-5 max-h-[520px] overflow-auto rounded-md bg-canvas-soft p-4"
              compact
              content={selectedArticle.content}
            />
            {selectedArticle.status === "published" && (
              <a
                className="mt-5 inline-flex text-button-md text-link"
                href={`/articles/${selectedArticle.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                打开公开文章
              </a>
            )}
          </article>
        ) : (
          <p className="mt-5 rounded-md bg-canvas-soft p-6 text-center text-body-sm text-mute">
            选择一篇文章后在这里预览正文。
          </p>
        )}
      </aside>
    </div>
  );
}
