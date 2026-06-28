import { SignInButton } from "./SignInButton";

type PageProps = {
  searchParams: Promise<{ callbackURL?: string | string[] }>;
};

function normalizeCallbackURL(value: string | string[] | undefined) {
  const callbackURL = Array.isArray(value) ? value[0] : value;
  return callbackURL?.startsWith("/") ? callbackURL : "/admin";
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const callbackURL = normalizeCallbackURL(params.callbackURL);

  return (
    <main className="flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-6 shadow-2">
        <p className="text-caption-mono text-mute">ADMIN</p>
        <h1 className="mt-2 text-display-md">登录管理后台</h1>
        <p className="mt-3 text-body-md text-body">
          仅允许配置的 GitHub 管理员账号访问测试模块和可计费 AI API。
        </p>
        <div className="mt-6">
          <SignInButton callbackURL={callbackURL} />
        </div>
      </section>
    </main>
  );
}
