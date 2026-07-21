"use client";

import { FormEvent, useState } from "react";

import type { PublicComment } from "@/app/api/comments/queries";
import type { ApiResponseBody } from "@/lib/api-response";

type LocalComment = PublicComment & {
  clientStatus?: "reviewing" | "rejected" | "failed";
  reviewMessage?: string;
};

type CommentResponse =
  | {
      status: "approved";
      comment: PublicComment;
    }
  | {
      status: "rejected";
      reason: string;
    };

type CommentFormProps = {
  slug: string;
  initialComments: PublicComment[];
};

function createOptimisticComment(input: {
  authorName: string;
  content: string;
}): LocalComment {
  return {
    id: -Date.now(),
    articleId: 0,
    authorName: input.authorName,
    content: input.content,
    status: "approved",
    createdAt: new Date().toISOString(),
    clientStatus: "reviewing",
    reviewMessage: "AI 审核中，审核通过后会正式保存。",
  };
}

export default function CommentForm({
  slug,
  initialComments,
}: CommentFormProps) {
  const [comments, setComments] = useState<LocalComment[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedAuthorName = authorName.trim();
    const normalizedAuthorEmail = authorEmail.trim();
    const normalizedContent = content.trim();
    if (!normalizedAuthorName || !normalizedContent) {
      setErrorMessage("昵称和留言内容不能为空");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    const optimisticComment = createOptimisticComment({
      authorName: normalizedAuthorName,
      content: normalizedContent,
    });
    setComments((current) => [optimisticComment, ...current]);
    setAuthorName("");
    setAuthorEmail("");
    setContent("");

    try {
      const response = await fetch(
        `/api/articles/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            authorName: normalizedAuthorName,
            authorEmail: normalizedAuthorEmail || null,
            content: normalizedContent,
          }),
        }
      );
      const body = (await response.json()) as ApiResponseBody<CommentResponse>;

      if (!response.ok || body.code !== 0 || !body.data) {
        throw new Error(body.message || "留言提交失败");
      }

      const responseData = body.data;
      setComments((current) =>
        current.map((comment) => {
          if (comment.id !== optimisticComment.id) {
            return comment;
          }

          return responseData.status === "approved"
            ? responseData.comment
            : {
                ...comment,
                clientStatus: "rejected",
                reviewMessage: responseData.reason,
              };
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "留言提交失败，请稍后重试";
      setComments((current) =>
        current.map((comment) =>
          comment.id === optimisticComment.id
            ? {
                ...comment,
                clientStatus: "failed",
                reviewMessage: message,
              }
            : comment
        )
      );
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-display-sm">留言</h2>
        <p className="text-body-sm text-body">
          留言会先进行 AI 审核。提交后会先在本地显示，审核通过后正式保存。
        </p>
      </div>

      <form
        className="card-marketing flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-body-sm-strong">
            昵称
            <input
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-md outline-none focus:border-primary"
              maxLength={40}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="你的昵称"
              value={authorName}
            />
          </label>
          <label className="flex flex-col gap-2 text-body-sm-strong">
            邮箱，可选
            <input
              className="rounded-md border border-hairline bg-canvas px-3 py-2 text-body-md outline-none focus:border-primary"
              maxLength={200}
              onChange={(event) => setAuthorEmail(event.target.value)}
              placeholder="仅用于站长查看，不公开"
              type="email"
              value={authorEmail}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-body-sm-strong">
          内容
          <textarea
            className="min-h-28 rounded-md border border-hairline bg-canvas px-3 py-2 text-body-md outline-none focus:border-primary"
            maxLength={2000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="写下你的想法"
            value={content}
          />
        </label>

        {errorMessage ? (
          <p className="text-body-sm text-error">{errorMessage}</p>
        ) : null}

        <button
          className="btn-primary min-h-10 px-5 disabled:opacity-50"
          disabled={submitting || !authorName.trim() || !content.trim()}
          type="submit"
        >
          {submitting ? "提交中" : "提交留言"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-body-sm text-body">暂无留言。</p>
        ) : (
          comments.map((comment) => (
            <div className="card-soft" key={comment.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-body-sm-strong">
                  {comment.authorName}
                </span>
                {comment.clientStatus ? (
                  <span className="badge-secondary">
                    {comment.clientStatus === "reviewing"
                      ? "审核中"
                      : comment.clientStatus === "rejected"
                        ? "未通过"
                        : "失败"}
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-body-sm text-ink">
                {comment.content}
              </p>
              {comment.reviewMessage ? (
                <p className="mt-2 text-caption text-body">
                  {comment.reviewMessage}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
