import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getPublishedArticleBySlug } from "@/app/api/articles/queries";
import { validateArticleSlugValue } from "@/app/api/articles/validation";
import { listApprovedCommentsByArticleId } from "@/app/api/comments/queries";
import CommentForm from "@/app/articles/[slug]/CommentForm";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ResponseFail } from "@/lib/api-response";
import { getDatabase } from "@/lib/cloudflare";

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  await connection();

  const { slug: slugValue } = await params;
  const slug = validateArticleSlugValue(slugValue);
  if (slug instanceof ResponseFail) {
    notFound();
  }

  const db = await getDatabase();
  const article = await getPublishedArticleBySlug(db, slug.value);
  if (!article) {
    notFound();
  }

  const comments = await listApprovedCommentsByArticleId(db, article.id, {
    page: 1,
    pageSize: 50,
  });
  const publishedAt = formatDate(article.publishedAt);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col px-6 py-12">
      <header className="mb-8">
        {publishedAt ? (
          <div className="mb-3 text-caption text-mute">{publishedAt}</div>
        ) : null}
        <h1 className="mb-4 text-display-lg">{article.title}</h1>
        {article.summary ? (
          <p className="text-body-lg text-body">{article.summary}</p>
        ) : null}
        {article.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span className="badge-secondary" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <MarkdownContent
        className="card-marketing-large mb-10"
        content={article.content}
      />

      <CommentForm initialComments={comments.items} slug={article.slug} />
    </article>
  );
}
