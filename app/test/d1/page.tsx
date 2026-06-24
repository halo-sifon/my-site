import { NotesManager } from "./NotesManager";

export default function D1TestPage() {
  return (
    <main className="min-h-screen bg-canvas-soft px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-caption-mono text-mute">CLOUDFLARE D1</p>
            <h1 className="mt-2 text-display-lg">笔记数据管理</h1>
            <p className="mt-2 text-body-md text-body">
              验证 notes 模型的新增、查询、更新和硬删除接口。
            </p>
          </div>
          <a className="btn-secondary py-2" href="/test">
            返回测试中心
          </a>
        </div>

        <NotesManager />
      </div>
    </main>
  );
}
