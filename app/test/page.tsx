import Link from "next/link";

const testPages = [
  {
    title: "服务器组件",
    description: "测试 Next.js 服务端组件渲染、搜索参数过滤等功能",
    href: "/test/server-components",
    icon: "🖥️",
  },
  {
    title: "D1 数据库",
    description: "测试 notes 模型的完整 CRUD 和统一 API 响应",
    href: "/test/d1",
    icon: "🗄️",
  },
  {
    title: "Workers AI",
    description: "测试文本回答、图片生成和 SSE 流式对话",
    href: "/test/workers-ai",
    icon: "✨",
  },
];

export default function TestHubPage() {
  return (
    <div className="flex flex-col min-h-screen p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-display-md mb-6">测试中心</h1>
        <p className="text-body-lg text-body mb-8">
          各功能模块的测试页面，验证服务端渲染和数据库读写等核心能力。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="card-marketing block hover:border-primary transition-colors"
            >
              <div className="text-3xl mb-3">{page.icon}</div>
              <h2 className="text-display-sm mb-2">{page.title}</h2>
              <p className="text-body-sm text-body">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
