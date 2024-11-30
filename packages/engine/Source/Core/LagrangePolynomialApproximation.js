import defined from "./defined.js";

/**
 * 一个 {@link InterpolationAlgorithm} 用于执行拉格朗日插值。
 *
 * @namespace LagrangePolynomialApproximation
 */
const LagrangePolynomialApproximation = {
  type: "Lagrange",
};

/**
 * 根据所需的次数，返回进行插值所需的数据点数量。
 *
 * @param {number} degree 所需的插值次数。
 * @returns {number} 所需插值次数所需的数据点数量。
 */

LagrangePolynomialApproximation.getRequiredDataPoints = function (degree) {
  return Math.max(degree + 1.0, 2);
};

/**
 * 使用拉格朗日多项式逼近法插值值。
 *
 * @param {number} x 自变量，需插值的因变量将基于此值进行计算。
 * @param {number[]} xTable 用于插值的自变量数组。此数组中的值必须按升序排列，且同一值不能在数组中出现两次。
 * @param {number[]} yTable 用于插值的因变量数组。对于在时间 1 和时间 2 的三组因变量值 (p,q,w)，应如下所示：{p1, q1, w1, p2, q2, w2}。
 * @param {number} yStride 在 yTable 中与 xTable 中每个自变量值对应的因变量值的数量。
 * @param {number[]} [result] 一个现有数组，用于存储结果。
 * @returns {number[]} 插值后的值数组，或者如果提供了 result 参数，则返回该参数。
 */

LagrangePolynomialApproximation.interpolateOrderZero = function (
  x,
  xTable,
  yTable,
  yStride,
  result,
) {
  if (!defined(result)) {
    result = new Array(yStride);
  }

  let i;
  let j;
  const length = xTable.length;

  for (i = 0; i < yStride; i++) {
    result[i] = 0;
  }

  for (i = 0; i < length; i++) {
    let coefficient = 1;

    for (j = 0; j < length; j++) {
      if (j !== i) {
        const diffX = xTable[i] - xTable[j];
        coefficient *= (x - xTable[j]) / diffX;
      }
    }

    for (j = 0; j < yStride; j++) {
      result[j] += coefficient * yTable[i * yStride + j];
    }
  }

  return result;
};
export default LagrangePolynomialApproximation;
