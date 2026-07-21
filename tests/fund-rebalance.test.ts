import { describe, expect, it } from "vitest";

import {
  calculateRebalance,
  calculateTransferShares,
} from "@/app/admin/funds/calculation";

describe("calculateRebalance", () => {
  it("does not rebalance when the portfolio matches the target", () => {
    const result = calculateRebalance({
      growthValue: 50_000,
      bondValue: 50_000,
      valuationLevel: "neutral",
    });

    expect(result.shouldRebalance).toBe(false);
    expect(result.deviationPercentagePoints).toBe(0);
    expect(result.growthAdjustment).toBe(0);
    expect(result.bondAdjustment).toBe(0);
  });

  it("keeps still when the deviation is exactly ten percentage points", () => {
    const result = calculateRebalance({
      growthValue: 50_000,
      bondValue: 50_000,
      valuationLevel: "relatively-low",
    });

    expect(result.deviationPercentagePoints).toBeCloseTo(10);
    expect(result.shouldRebalance).toBe(false);
  });

  it("calculates both adjustments when the deviation exceeds the threshold", () => {
    const result = calculateRebalance({
      growthValue: 40_000,
      bondValue: 60_000,
      valuationLevel: "low",
    });

    expect(result.shouldRebalance).toBe(true);
    expect(result.growthAdjustment).toBeCloseTo(30_000);
    expect(result.bondAdjustment).toBeCloseTo(-30_000);
  });

  it("uses both fund values as the execution pool", () => {
    const result = calculateRebalance({
      growthValue: 40_000,
      bondValue: 60_000,
      valuationLevel: "neutral",
    });

    expect(result.totalValue).toBe(100_000);
    expect(result.currentGrowthWeight).toBe(0.4);
    expect(result.targetGrowthValue).toBe(50_000);
    expect(result.targetBondValue).toBe(50_000);
  });

  it("rejects an empty execution pool", () => {
    expect(() =>
      calculateRebalance({
        growthValue: 0,
        bondValue: 0,
        valuationLevel: "neutral",
      })
    ).toThrow("执行池总金额必须大于 0");
  });
});

describe("calculateTransferShares", () => {
  it("converts the target amount into source fund shares", () => {
    expect(
      calculateTransferShares({
        sourceValue: 60_000,
        sourceTotalShares: 50_000,
        transferAmount: 30_000,
      })
    ).toBe(25_000);
  });

  it("rejects missing source fund shares", () => {
    expect(() =>
      calculateTransferShares({
        sourceValue: 60_000,
        sourceTotalShares: 0,
        transferAmount: 30_000,
      })
    ).toThrow("转出基金的当前市值和总份额必须大于 0");
  });
});
