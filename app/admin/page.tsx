import Link from "next/link";

const adminLabs = [
  {
    title: "文章管理",
    description: "管理文章草稿、发布状态和公开文章列表",
    href: "/admin/articles",
    icon: "📝",
  },
  {
    title: "基金再平衡",
    description: "手动输入当前持仓，计算创业板与债券的调仓金额",
    href: "/admin/funds",
    icon: "⚖️",
  },
  {
    title: "服务器组件",
    description: "测试 Next.js 服务端组件渲染、搜索参数过滤等功能",
    href: "/admin/labs/server-components",
    icon: "🖥️",
  },
  {
    title: "D1 数据库",
    description: "测试 notes 模型的完整 CRUD 和统一 API 响应",
    href: "/admin/labs/d1",
    icon: "🗄️",
  },
  {
    title: "Workers AI",
    description: "测试文本回答、图片生成和 SSE 流式对话",
    href: "/admin/labs/workers-ai",
    icon: "✨",
  },
];

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-display-md">管理后台</h1>
        <p className="mb-8 text-body-lg text-body">
          受保护的实验模块集中放在这里，涉及 D1 写入和 Workers AI 计费调用。
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {adminLabs.map((page) => (
            <Link
              className="card-marketing block transition-colors hover:border-primary"
              href={page.href}
              key={page.href}
            >
              <div className="mb-3 text-3xl">{page.icon}</div>
              <h2 className="mb-2 text-display-sm">{page.title}</h2>
              <p className="text-body-sm text-body">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
