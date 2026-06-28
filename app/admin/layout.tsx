import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const session = await getAdminSession(await headers());

  if (!session) {
    redirect("/sign-in?callbackURL=/admin");
  }

  if (session.user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="max-w-md rounded-lg border border-hairline bg-canvas p-6 shadow-2">
          <p className="text-caption-mono text-error">FORBIDDEN</p>
          <h1 className="mt-2 text-display-md">无权限</h1>
          <p className="mt-3 text-body-md text-body">
            当前账号不是管理员，不能访问管理后台。
          </p>
        </section>
      </main>
    );
  }

  return children;
}
