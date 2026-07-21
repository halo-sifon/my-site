import Link from "next/link";

import { FundRebalanceCalculator } from "./FundRebalanceCalculator";

export default function FundsPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-caption-mono text-mute">MONTHLY REBALANCE</p>
            <h1 className="mt-2 text-display-lg">创业板股债再平衡</h1>
            <p className="mt-2 text-body-md text-body">
              每月固定操作日手动录入持仓，偏离目标超过 10 个百分点时才调仓。
            </p>
          </div>
          <Link className="btn-secondary py-2" href="/admin">
            返回管理后台
          </Link>
        </div>

        <FundRebalanceCalculator />
      </div>
    </main>
  );
}
