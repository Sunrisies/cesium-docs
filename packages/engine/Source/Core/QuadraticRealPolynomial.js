import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 定义仅具有实系数的一元二次多项式函数的功能。
 *
 * @namespace QuadraticRealPolynomial
 */

const QuadraticRealPolynomial = {};

/**
 * 根据提供的系数提供二次方程的判别式。
 *
 * @param {number} a 二次项的系数。
 * @param {number} b 一次项的系数。
 * @param {number} c 常数项的系数。
 * @returns {number} 判别式的值。
 */

QuadraticRealPolynomial.computeDiscriminant = function (a, b, c) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof a !== "number") {
    throw new DeveloperError("a is a required number.");
  }
  if (typeof b !== "number") {
    throw new DeveloperError("b is a required number.");
  }
  if (typeof c !== "number") {
    throw new DeveloperError("c is a required number.");
  }
  //>>includeEnd('debug');

  const discriminant = b * b - 4.0 * a * c;
  return discriminant;
};

function addWithCancellationCheck(left, right, tolerance) {
  const difference = left + right;
  if (
    CesiumMath.sign(left) !== CesiumMath.sign(right) &&
    Math.abs(difference / Math.max(Math.abs(left), Math.abs(right))) < tolerance
  ) {
    return 0.0;
  }

  return difference;
}

/**
 * 提供具有所提供系数的二次多项式的实根。
 *
 * @param {number} a 二次项的系数。
 * @param {number} b 一次项的系数。
 * @param {number} c 常数项的系数。
 * @returns {number[]} 实根数组。
 */

QuadraticRealPolynomial.computeRealRoots = function (a, b, c) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof a !== "number") {
    throw new DeveloperError("a is a required number.");
  }
  if (typeof b !== "number") {
    throw new DeveloperError("b is a required number.");
  }
  if (typeof c !== "number") {
    throw new DeveloperError("c is a required number.");
  }
  //>>includeEnd('debug');

  let ratio;
  if (a === 0.0) {
    if (b === 0.0) {
      // Constant function: c = 0.
      return [];
    }

    // Linear function: b * x + c = 0.
    return [-c / b];
  } else if (b === 0.0) {
    if (c === 0.0) {
      // 2nd order monomial: a * x^2 = 0.
      return [0.0, 0.0];
    }

    const cMagnitude = Math.abs(c);
    const aMagnitude = Math.abs(a);

    if (
      cMagnitude < aMagnitude &&
      cMagnitude / aMagnitude < CesiumMath.EPSILON14
    ) {
      // c ~= 0.0.
      // 2nd order monomial: a * x^2 = 0.
      return [0.0, 0.0];
    } else if (
      cMagnitude > aMagnitude &&
      aMagnitude / cMagnitude < CesiumMath.EPSILON14
    ) {
      // a ~= 0.0.
      // Constant function: c = 0.
      return [];
    }

    // a * x^2 + c = 0
    ratio = -c / a;

    if (ratio < 0.0) {
      // Both roots are complex.
      return [];
    }

    // Both roots are real.
    const root = Math.sqrt(ratio);
    return [-root, root];
  } else if (c === 0.0) {
    // a * x^2 + b * x = 0
    ratio = -b / a;
    if (ratio < 0.0) {
      return [ratio, 0.0];
    }

    return [0.0, ratio];
  }

  // a * x^2 + b * x + c = 0
  const b2 = b * b;
  const four_ac = 4.0 * a * c;
  const radicand = addWithCancellationCheck(b2, -four_ac, CesiumMath.EPSILON14);

  if (radicand < 0.0) {
    // Both roots are complex.
    return [];
  }

  const q =
    -0.5 *
    addWithCancellationCheck(
      b,
      CesiumMath.sign(b) * Math.sqrt(radicand),
      CesiumMath.EPSILON14,
    );
  if (b > 0.0) {
    return [q / a, c / q];
  }

  return [c / q, q / a];
};
export default QuadraticRealPolynomial;
