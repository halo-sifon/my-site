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
    <div className="flex flex-col min-h-screen p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">服务器组件测试</h1>

        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-sm">
            <strong>当前分类:</strong> {category || '全部'}
          </p>
          <p className="text-sm mt-2">
            <strong>服务器渲染时间:</strong> {renderTime}
          </p>
        </div>

        <div className="mb-4 flex gap-2">
          <a
            href="/test"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            全部
          </a>
          <a
            href="/test?category=tech"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            技术
          </a>
          <a
            href="/test?category=life"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            生活
          </a>
        </div>

        <div className="space-y-4">
          {filteredContent.length === 0 ? (
            <p className="text-gray-500">暂无内容</p>
          ) : (
            filteredContent.map(item => (
              <div
                key={item.id}
                className="p-4 border rounded hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {item.description}
                </p>
                <div className="text-sm text-gray-500">
                  <span className="mr-4">分类: {item.category}</span>
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
