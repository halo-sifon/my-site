"use client";

import { useEffect, useState } from "react";

import type { Note, PaginatedNotes } from "@/app/api/notes/queries";
import type { ApiResponseBody } from "@/lib/api-response";

type NoteDraft = {
  title: string;
  content: string;
};

const emptyDraft: NoteDraft = { title: "", content: "" };

async function readApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponseBody<T>;
  if (!response.ok || body.code !== 0 || body.data === null) {
    throw new Error(body.message || "请求失败");
  }
  return body.data;
}

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notes?page=1&pageSize=100");
      const data = await readApiResponse<PaginatedNotes>(response);
      setNotes(data.items);
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

    void fetch("/api/notes?page=1&pageSize=100")
      .then((response) => readApiResponse<PaginatedNotes>(response))
      .then((data) => {
        if (!cancelled) {
          setNotes(data.items);
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
  }, []);

  function beginEdit(note: Note) {
    setEditingId(note.id);
    setDraft({ title: note.title, content: note.content });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function submitNote(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        editingId === null ? "/api/notes" : `/api/notes/${editingId}`,
        {
          method: editingId === null ? "POST" : "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      await readApiResponse<Note>(response);
      resetForm();
      await loadNotes();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "保存失败"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function removeNote(note: Note) {
    if (!window.confirm(`确认永久删除「${note.title}」？`)) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });
      await readApiResponse<{ id: number }>(response);
      if (editingId === note.id) {
        resetForm();
      }
      await loadNotes();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "删除失败"
      );
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-display-sm">笔记列表</h2>
          <button
            className="text-button-md text-link disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadNotes()}
            type="button"
          >
            刷新
          </button>
        </div>

        {loading ? (
          <p className="text-body-sm text-mute">加载中...</p>
        ) : notes.length === 0 ? (
          <p className="rounded-md bg-canvas-soft p-6 text-center text-body-sm text-mute">
            暂无笔记，请先创建一条数据。
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <article
                className="rounded-md border border-hairline p-4"
                key={note.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-body-md-strong">{note.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-body-sm text-body">
                      {note.content || "无正文"}
                    </p>
                    <p className="mt-3 text-caption text-mute">
                      ID {note.id} · 更新于{" "}
                      {new Date(note.updated_at * 1000).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button
                      className="text-button-md text-link"
                      onClick={() => beginEdit(note)}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      className="text-button-md text-error"
                      onClick={() => void removeNote(note)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="h-fit rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">
          {editingId === null ? "新增笔记" : `编辑笔记 #${editingId}`}
        </h2>
        <form className="mt-5 space-y-4" onSubmit={submitNote}>
          <label className="block">
            <span className="text-body-sm-strong">标题</span>
            <input
              className="mt-2 w-full rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
              maxLength={120}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="输入标题"
              required
              value={draft.title}
            />
          </label>
          <label className="block">
            <span className="text-body-sm-strong">内容</span>
            <textarea
              className="mt-2 min-h-36 w-full resize-y rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
              maxLength={5000}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              placeholder="输入内容"
              value={draft.content}
            />
          </label>

          {error && (
            <p className="rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              className="btn-primary flex-1 py-2 disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "保存中..." : editingId === null ? "创建" : "保存"}
            </button>
            {editingId !== null && (
              <button
                className="btn-secondary border border-hairline py-2"
                onClick={resetForm}
                type="button"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
