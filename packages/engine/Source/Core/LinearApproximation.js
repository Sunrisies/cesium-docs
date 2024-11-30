import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个 {@link InterpolationAlgorithm} 用于执行线性插值。
 *
 * @namespace LinearApproximation
 */

const LinearApproximation = {
  type: "Linear",
};

/**
 * 给定所需的次数，返回进行插值所需的数据点数量。
 * 由于线性插值只能生成一次多项式，因此此函数
 * 始终返回 2。
 * @param {number} degree 所需的插值次数。
 * @returns {number} 此函数始终返回 2。
 *
 */

LinearApproximation.getRequiredDataPoints = function (degree) {
  return 2;
};

/**
 * 使用线性逼近法进行插值。
 *
 * @param {number} x 自变量，需插值的因变量将基于此值进行计算。
 * @param {number[]} xTable 用于插值的自变量数组。此数组中的值必须按升序排列，且同一值不能在数组中出现两次。
 * @param {number[]} yTable 用于插值的因变量数组。对于在时间 1 和时间 2 的三组因变量值 (p,q,w)，应如下所示：{p1, q1, w1, p2, q2, w2}。
 * @param {number} yStride 在 yTable 中与 xTable 中每个自变量值对应的因变量值的数量。
 * @param {number[]} [result] 一个现有数组，用于存储结果。
 * @returns {number[]} 插值后的值数组，或者如果提供了 result 参数，则返回该参数。
 */

LinearApproximation.interpolateOrderZero = function (
  x,
  xTable,
  yTable,
  yStride,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (xTable.length !== 2) {
    throw new DeveloperError(
      "The xTable provided to the linear interpolator must have exactly two elements.",
    );
  } else if (yStride <= 0) {
    throw new DeveloperError(
      "There must be at least 1 dependent variable for each independent variable.",
    );
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Array(yStride);
  }

  let i;
  let y0;
  let y1;
  const x0 = xTable[0];
  const x1 = xTable[1];

  //>>includeStart('debug', pragmas.debug);
  if (x0 === x1) {
    throw new DeveloperError(
      "Divide by zero error: xTable[0] and xTable[1] are equal",
    );
  }
  //>>includeEnd('debug');

  for (i = 0; i < yStride; i++) {
    y0 = yTable[i];
    y1 = yTable[i + yStride];
    result[i] = ((y1 - y0) * x + x1 * y0 - x0 * y1) / (x1 - x0);
  }

  return result;
};
export default LinearApproximation;
