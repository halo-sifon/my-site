import { ContentList } from "./ContentList";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ServerComponentsLabPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const category = params.category as string | undefined;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-caption-mono text-mute">SERVER COMPONENTS</p>
            <h1 className="mt-2 text-display-lg">服务器组件测试</h1>
            <p className="mt-2 text-body-md text-body">
              验证服务端渲染、分类过滤和异步数据获取。
            </p>
          </div>
          <a className="btn-secondary py-2" href="/admin">
            返回管理后台
          </a>
        </div>

        <ContentList category={category} />
      </div>
    </main>
  );
}
