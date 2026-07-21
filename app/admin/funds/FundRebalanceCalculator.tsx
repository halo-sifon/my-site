"use client";

import { useState } from "react";

import {
  calculateRebalance,
  calculateTransferShares,
  valuationLevels,
  type RebalanceResult,
  type ValuationLevel,
} from "./calculation";

type FormValues = {
  growthValue: string;
  bondValue: string;
  valuationLevel: ValuationLevel;
};

const initialValues: FormValues = {
  growthValue: "",
  bondValue: "",
  valuationLevel: "neutral",
};

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const shareFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return moneyFormatter.format(Math.abs(value));
}

export function FundRebalanceCalculator() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [result, setResult] = useState<RebalanceResult | null>(null);
  const [error, setError] = useState("");
  const [sourceTotalShares, setSourceTotalShares] = useState("");
  const [transferShares, setTransferShares] = useState<number | null>(null);
  const [shareError, setShareError] = useState("");

  function updateValue<Key extends keyof FormValues>(
    key: Key,
    value: FormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError("");
    setSourceTotalShares("");
    setTransferShares(null);
    setShareError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSourceTotalShares("");
    setTransferShares(null);
    setShareError("");

    try {
      setResult(
        calculateRebalance({
          growthValue: Number(values.growthValue),
          bondValue: Number(values.bondValue),
          valuationLevel: values.valuationLevel,
        })
      );
    } catch (calculationError) {
      setResult(null);
      setError(
        calculationError instanceof Error
          ? calculationError.message
          : "计算失败"
      );
    }
  }

  const transferDetails =
    result?.shouldRebalance && result.growthAdjustment > 0
      ? {
          sourceName: "债券基金",
          sourceCode: "001299",
          targetName: "创业板基金",
          sourceValue: Number(values.bondValue),
          transferAmount: result.growthAdjustment,
        }
      : result?.shouldRebalance && result.growthAdjustment < 0
        ? {
            sourceName: "创业板基金",
            sourceCode: "012555",
            targetName: "债券基金",
            sourceValue: Number(values.growthValue),
            transferAmount: Math.abs(result.growthAdjustment),
          }
        : null;

  function submitSourceShares(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transferDetails) {
      return;
    }

    setShareError("");

    try {
      setTransferShares(
        calculateTransferShares({
          sourceValue: transferDetails.sourceValue,
          sourceTotalShares: Number(sourceTotalShares),
          transferAmount: transferDetails.transferAmount,
        })
      );
    } catch (calculationError) {
      setTransferShares(null);
      setShareError(
        calculationError instanceof Error
          ? calculationError.message
          : "份额计算失败"
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="h-fit rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">本月数据</h2>
        <p className="mt-2 text-body-sm text-body">
          直接填写交易平台显示的当前市值，无需换算基金份额和净值。
        </p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-body-sm-strong">
              创业板基金市值（012555）
            </span>
            <input
              className="mt-2 w-full rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
              inputMode="decimal"
              min="0"
              onChange={(event) =>
                updateValue("growthValue", event.target.value)
              }
              placeholder="例如 50000"
              required
              step="0.01"
              type="number"
              value={values.growthValue}
            />
          </label>

          <label className="block">
            <span className="text-body-sm-strong">
              债券基金市值（001299）
            </span>
            <input
              className="mt-2 w-full rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
              inputMode="decimal"
              min="0"
              onChange={(event) => updateValue("bondValue", event.target.value)}
              placeholder="例如 50000"
              required
              step="0.01"
              type="number"
              value={values.bondValue}
            />
          </label>

          <label className="block">
            <span className="text-body-sm-strong">当前估值区间</span>
            <select
              className="mt-2 w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-body-sm outline-none focus:border-primary"
              onChange={(event) =>
                updateValue(
                  "valuationLevel",
                  event.target.value as ValuationLevel
                )
              }
              value={values.valuationLevel}
            >
              {valuationLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}（创业板 {Math.round(level.growthTarget * 100)}%
                  {" / "}债券 {Math.round((1 - level.growthTarget) * 100)}%）
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p
              aria-live="polite"
              className="rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep"
            >
              {error}
            </p>
          )}

          <button className="btn-primary min-h-10 w-full" type="submit">
            计算本月操作
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-hairline bg-canvas p-5 shadow-2">
        <h2 className="text-display-sm">计算结果</h2>

        {!result ? (
          <p className="mt-5 rounded-md bg-canvas-soft p-6 text-center text-body-sm text-mute">
            输入本月数据后生成操作建议。
          </p>
        ) : (
          <div className="mt-5 space-y-5" aria-live="polite">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md bg-canvas-soft p-4">
                <p className="text-caption text-mute">执行池总市值</p>
                <p className="mt-1 text-body-md-strong">
                  {moneyFormatter.format(result.totalValue)}
                </p>
              </div>
              <div className="rounded-md bg-canvas-soft p-4">
                <p className="text-caption text-mute">创业板实际 / 目标</p>
                <p className="mt-1 text-body-md-strong">
                  {percentFormatter.format(result.currentGrowthWeight)} /{" "}
                  {percentFormatter.format(result.targetGrowthWeight)}
                </p>
              </div>
              <div className="rounded-md bg-canvas-soft p-4">
                <p className="text-caption text-mute">债券实际 / 目标</p>
                <p className="mt-1 text-body-md-strong">
                  {percentFormatter.format(result.currentBondWeight)} /{" "}
                  {percentFormatter.format(result.targetBondWeight)}
                </p>
              </div>
              <div className="rounded-md bg-canvas-soft p-4">
                <p className="text-caption text-mute">创业板仓位偏差</p>
                <p className="mt-1 text-body-md-strong">
                  {result.deviationPercentagePoints.toFixed(1)} 个百分点
                </p>
              </div>
            </div>

            <div
              className={`rounded-md border p-5 ${
                result.shouldRebalance
                  ? "border-warning bg-warning-soft"
                  : "border-hairline bg-canvas-soft"
              }`}
            >
              <p className="text-caption-mono text-mute">
                {result.shouldRebalance ? "REBALANCE" : "HOLD"}
              </p>
              <h3 className="mt-2 text-display-sm">
                {result.shouldRebalance ? "本月需要调仓" : "本月不操作"}
              </h3>
              {result.shouldRebalance ? (
                transferDetails && (
                  <p className="mt-3 text-body-md text-body">
                    从{transferDetails.sourceName}转出约{" "}
                    {formatMoney(transferDetails.transferAmount)}，转换至
                    {transferDetails.targetName}。
                  </p>
                )
              ) : (
                <p className="mt-3 text-body-md text-body">
                  创业板实际仓位与目标仓位的差值未超过 10 个百分点。
                </p>
              )}
            </div>

            {transferDetails && (
              <form
                className="rounded-md border border-hairline p-5"
                onSubmit={submitSourceShares}
              >
                <label className="block">
                  <span className="text-body-sm-strong">
                    {transferDetails.sourceName}（{transferDetails.sourceCode}
                    ）当前总份额
                  </span>
                  <input
                    className="mt-2 w-full rounded-sm border border-hairline px-3 py-2 text-body-sm outline-none focus:border-primary"
                    inputMode="decimal"
                    min="0.01"
                    onChange={(event) => {
                      setSourceTotalShares(event.target.value);
                      setTransferShares(null);
                      setShareError("");
                    }}
                    placeholder="输入交易平台显示的持有份额"
                    required
                    step="0.01"
                    type="number"
                    value={sourceTotalShares}
                  />
                </label>

                {shareError && (
                  <p className="mt-3 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
                    {shareError}
                  </p>
                )}

                <button className="btn-primary mt-4 min-h-10 px-5" type="submit">
                  计算转换份额
                </button>

                {transferShares !== null && (
                  <div className="mt-4 rounded-md bg-canvas-soft p-4">
                    <p className="text-caption text-mute">预计转换份额</p>
                    <p className="mt-1 text-display-sm">
                      {shareFormatter.format(transferShares)} 份
                    </p>
                    <p className="mt-2 text-body-sm text-body">
                      从{transferDetails.sourceName}转换至
                      {transferDetails.targetName}。
                    </p>
                  </div>
                )}
              </form>
            )}

            <p className="text-caption text-mute">
              结果按当前市值计算，不包含申购费、赎回费及确认净值变化；仅作为执行前复核。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
