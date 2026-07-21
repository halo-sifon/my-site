import { ArticlesManager } from "@/app/admin/articles/ArticlesManager";

export default function AdminArticlesPage() {
  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-3 text-display-md">文章管理</h1>
          <p className="text-body-lg text-body">
            管理文章草稿，发布后才会出现在公开文章列表。
          </p>
        </div>

        <ArticlesManager />
      </div>
    </div>
  );
}
