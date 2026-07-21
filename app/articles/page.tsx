import Link from "next/link";
import { connection } from "next/server";

import { listPublishedArticles } from "@/app/api/articles/queries";
import { getDatabase } from "@/lib/cloudflare";

function formatDate(value: string | null) {
  if (!value) {
    return "未发布";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function ArticlesPage() {
  await connection();

  const articles = await listPublishedArticles(await getDatabase(), {
    page: 1,
    pageSize: 20,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="mb-3 text-display-lg">文章</h1>
        <p className="text-body-md text-body">记录技术、产品和 AI 编程实践。</p>
      </div>

      {articles.items.length === 0 ? (
        <div className="card-marketing text-body text-body-md">
          暂无已发布文章。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.items.map((article) => (
            <Link
              className="card-marketing block transition-colors hover:border-primary"
              href={`/articles/${article.slug}`}
              key={article.id}
            >
              <div className="mb-2 text-caption text-mute">
                {formatDate(article.publishedAt)}
              </div>
              <h2 className="mb-2 text-display-sm">{article.title}</h2>
              {article.summary ? (
                <p className="text-body-sm text-body">{article.summary}</p>
              ) : null}
              {article.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span className="badge-secondary" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
