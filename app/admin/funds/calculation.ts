export const valuationLevels = [
  { value: "low", label: "低估", growthTarget: 0.7 },
  { value: "relatively-low", label: "较低", growthTarget: 0.6 },
  { value: "neutral", label: "中性", growthTarget: 0.5 },
  { value: "relatively-high", label: "较高", growthTarget: 0.4 },
  { value: "high", label: "高估", growthTarget: 0.3 },
] as const;

export type ValuationLevel = (typeof valuationLevels)[number]["value"];

export type RebalanceInput = {
  growthValue: number;
  bondValue: number;
  valuationLevel: ValuationLevel;
};

export type RebalanceResult = {
  totalValue: number;
  currentGrowthWeight: number;
  currentBondWeight: number;
  targetGrowthWeight: number;
  targetBondWeight: number;
  targetGrowthValue: number;
  targetBondValue: number;
  growthAdjustment: number;
  bondAdjustment: number;
  deviationPercentagePoints: number;
  shouldRebalance: boolean;
};

const rebalanceThreshold = 10;
const floatingPointTolerance = 1e-9;

export function calculateTransferShares({
  sourceValue,
  sourceTotalShares,
  transferAmount,
}: {
  sourceValue: number;
  sourceTotalShares: number;
  transferAmount: number;
}) {
  const values = [sourceValue, sourceTotalShares, transferAmount];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("金额和份额必须是大于或等于 0 的数字");
  }

  if (sourceValue <= 0 || sourceTotalShares <= 0) {
    throw new RangeError("转出基金的当前市值和总份额必须大于 0");
  }

  if (transferAmount > sourceValue + floatingPointTolerance) {
    throw new RangeError("转换金额不能超过转出基金的当前市值");
  }

  return (transferAmount / sourceValue) * sourceTotalShares;
}

export function calculateRebalance({
  growthValue,
  bondValue,
  valuationLevel,
}: RebalanceInput): RebalanceResult {
  const level = valuationLevels.find((item) => item.value === valuationLevel);

  if (!level) {
    throw new RangeError("估值区间无效");
  }

  const values = [growthValue, bondValue];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("持仓金额必须是大于或等于 0 的数字");
  }

  const totalValue = growthValue + bondValue;
  if (totalValue <= 0) {
    throw new RangeError("执行池总金额必须大于 0");
  }

  const currentGrowthWeight = growthValue / totalValue;
  const currentBondWeight = bondValue / totalValue;
  const targetGrowthWeight = level.growthTarget;
  const targetBondWeight = 1 - targetGrowthWeight;
  const targetGrowthValue = totalValue * targetGrowthWeight;
  const targetBondValue = totalValue * targetBondWeight;
  const deviationPercentagePoints =
    Math.abs(currentGrowthWeight - targetGrowthWeight) * 100;

  return {
    totalValue,
    currentGrowthWeight,
    currentBondWeight,
    targetGrowthWeight,
    targetBondWeight,
    targetGrowthValue,
    targetBondValue,
    growthAdjustment: targetGrowthValue - growthValue,
    bondAdjustment: targetBondValue - bondValue,
    deviationPercentagePoints,
    shouldRebalance:
      deviationPercentagePoints >
      rebalanceThreshold + floatingPointTolerance,
  };
}
