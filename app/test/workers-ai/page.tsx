import Link from "next/link";

import { IMAGE_MODEL, TEXT_MODEL } from "@/app/api/ai/models";
import { WorkersAiTester } from "./WorkersAiTester";

export default function WorkersAiTestPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-caption-mono text-mute">CLOUDFLARE WORKERS AI</p>
            <h1 className="mt-2 text-display-lg">Workers AI 能力测试</h1>
            <p className="mt-2 text-body-md text-body">
              验证完整文本回答、图片生成和 SSE 流式对话。
            </p>
          </div>
          <Link
            className="btn-secondary border border-hairline py-2"
            href="/test"
          >
            返回测试中心
          </Link>
        </div>

        <WorkersAiTester imageModel={IMAGE_MODEL} textModel={TEXT_MODEL} />
      </div>
    </main>
  );
}
