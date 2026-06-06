// app/test/page.tsx
type ContentItem = {
  id: string;
  title: string;
  description: string;
  category: 'tech' | 'life';
  createdAt: string;
};

// 模拟数据
const mockData: ContentItem[] = [
  {
    id: '1',
    title: 'Next.js 16 新特性',
    description: '了解 Next.js 16 的最新功能和改进',
    category: 'tech',
    createdAt: '2026-06-01',
  },
  {
    id: '2',
    title: 'React 19 性能优化',
    description: '深入理解 React 19 的性能优化策略',
    category: 'tech',
    createdAt: '2026-06-02',
  },
  {
    id: '3',
    title: '周末徒步记',
    description: '记录一次愉快的周末徒步经历',
    category: 'life',
    createdAt: '2026-06-03',
  },
  {
    id: '4',
    title: '咖啡品鉴指南',
    description: '从入门到精通的咖啡品鉴技巧',
    category: 'life',
    createdAt: '2026-06-04',
  },
];

// 页面 props 类型
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TestPage({ searchParams }: PageProps) {
  // 获取分类参数
  const params = await searchParams;
  const category = params.category as string | undefined;

  // 过滤内容
  const filteredContent = category
    ? mockData.filter(item => item.category === category)
    : mockData;

  // 服务器渲染时间
  const renderTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
  });

  return (
    <div className="flex flex-col min-h-screen p-xl">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-display-md font-semibold mb-lg">服务器组件测试</h1>

        <div className="mb-md p-md rounded bg-canvas-parchment dark:bg-surface-tile-2">
          <p className="text-caption">
            <strong>当前分类:</strong> {category || '全部'}
          </p>
          <p className="text-caption mt-sm">
            <strong>服务器渲染时间:</strong> {renderTime}
          </p>
        </div>

        <div className="mb-md flex gap-sm">
          <a href="/test" className="btn-primary">
            全部
          </a>
          <a href="/test?category=tech" className="btn-primary">
            技术
          </a>
          <a href="/test?category=life" className="btn-primary">
            生活
          </a>
        </div>

        <div className="space-y-md">
          {filteredContent.length === 0 ? (
            <p className="text-ink-muted-48 dark:text-body-muted">暂无内容</p>
          ) : (
            filteredContent.map(item => (
              <div
                key={item.id}
                className="p-md rounded border border-hairline"
              >
                <h2 className="text-tagline font-semibold mb-sm">{item.title}</h2>
                <p className="mb-sm text-ink-muted-48 dark:text-body-muted">
                  {item.description}
                </p>
                <div className="text-caption text-ink-muted-48 dark:text-body-muted">
                  <span className="mr-md">分类: {item.category}</span>
                  <span>创建时间: {item.createdAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
