type ContentItem = {
  id: string;
  title: string;
  description: string;
  category: "tech" | "life";
  createdAt: string;
};

const mockData: ContentItem[] = [
  {
    id: "1",
    title: "Next.js 16 新特性",
    description: "了解 Next.js 16 的最新功能和改进",
    category: "tech",
    createdAt: "2026-06-01",
  },
  {
    id: "2",
    title: "React 19 性能优化",
    description: "深入理解 React 19 的性能优化策略",
    category: "tech",
    createdAt: "2026-06-02",
  },
  {
    id: "3",
    title: "周末徒步记",
    description: "记录一次愉快的周末徒步经历",
    category: "life",
    createdAt: "2026-06-03",
  },
  {
    id: "4",
    title: "咖啡品鉴指南",
    description: "从入门到精通的咖啡品鉴技巧",
    category: "life",
    createdAt: "2026-06-04",
  },
];

type ContentListProps = {
  category: string | undefined;
};

export async function ContentList({ category }: ContentListProps) {
  const filteredContent = category
    ? mockData.filter((item) => item.category === category)
    : mockData;

  const renderTime = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
  });

  return (
    <>
      <div className="mb-4 rounded bg-canvas-soft p-4 dark:bg-primary">
        <p className="text-caption">
          <strong>当前分类:</strong> {category || "全部"}
        </p>
        <p className="mt-3 text-caption">
          <strong>服务器渲染时间:</strong> {renderTime}
        </p>
      </div>

      <div className="mb-4 flex gap-3">
        <a href="/admin/labs/server-components" className="btn-primary">
          全部
        </a>
        <a
          href="/admin/labs/server-components?category=tech"
          className="btn-primary"
        >
          技术
        </a>
        <a
          href="/admin/labs/server-components?category=life"
          className="btn-primary"
        >
          生活
        </a>
      </div>

      <div className="space-y-4">
        {filteredContent.length === 0 ? (
          <p className="text-mute dark:text-body">暂无内容</p>
        ) : (
          filteredContent.map((item) => (
            <div
              key={item.id}
              className="rounded-sm border border-hairline p-4"
            >
              <h2 className="mb-3 text-display-sm">{item.title}</h2>
              <p className="mb-3 text-mute dark:text-body">
                {item.description}
              </p>
              <div className="text-caption text-mute dark:text-body">
                <span className="mr-4">分类: {item.category}</span>
                <span>创建时间: {item.createdAt}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
