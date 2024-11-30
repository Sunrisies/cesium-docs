import MersenneTwister from "mersenne-twister";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 数学函数
 *
 * @exports CesiumMath
 * @alias Math
 */
const CesiumMath = {};

/**
 * 0.1
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON1 = 0.1;

/**
 * 0.01
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON2 = 0.01;

/**
 * 0.001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON3 = 0.001;

/**
 * 0.0001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON4 = 0.0001;

/**
 * 0.00001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON5 = 0.00001;

/**
 * 0.000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON6 = 0.000001;

/**
 * 0.0000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON7 = 0.0000001;

/**
 * 0.00000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON8 = 0.00000001;

/**
 * 0.000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON9 = 0.000000001;

/**
 * 0.0000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON10 = 0.0000000001;

/**
 * 0.00000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON11 = 0.00000000001;

/**
 * 0.000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON12 = 0.000000000001;

/**
 * 0.0000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON13 = 0.0000000000001;

/**
 * 0.00000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON14 = 0.00000000000001;

/**
 * 0.000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON15 = 0.000000000000001;

/**
 * 0.0000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON16 = 0.0000000000000001;

/**
 * 0.00000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON17 = 0.00000000000000001;

/**
 * 0.000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON18 = 0.000000000000000001;

/**
 * 0.0000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON19 = 0.0000000000000000001;

/**
 * 0.00000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON20 = 0.00000000000000000001;

/**
 * 0.000000000000000000001
 * @type {number}
 * @constant
 */
CesiumMath.EPSILON21 = 0.000000000000000000001;

/**
 * 地球的引力参数，单位为米立方每秒平方，按照 WGS84 模型定义：3.986004418e14
 * @type {number}
 * @constant
 */
CesiumMath.GRAVITATIONALPARAMETER = 3.986004418e14;

/**
 * 太阳的半径，单位为米：6.955e8
 * @type {number}
 * @constant
 */
CesiumMath.SOLAR_RADIUS = 6.955e8;

/**
 * 月球的平均半径，根据 "IAU/IAG 工作组关于行星及卫星的地图坐标和自转元素的报告：2000" 中的定义，
 * 天体力学 82: 83-110, 2002。
 * @type {number}
 * @constant
 */
CesiumMath.LUNAR_RADIUS = 1737400.0;

/**
 * 64 * 1024
 * @type {number}
 * @constant
 */
CesiumMath.SIXTY_FOUR_KILOBYTES = 64 * 1024;

/**
 * 4 * 1024 * 1024 * 1024
 * @type {number}
 * @constant
 */
CesiumMath.FOUR_GIGABYTES = 4 * 1024 * 1024 * 1024;

/**
 * 返回值的符号；如果值为正，则返回 1；如果值为负，则返回 -1；如果值为 0，则返回 0。
 *
 * @function
 * @param {number} value 要返回符号的值。
 * @returns {number} 值的符号。
 */
CesiumMath.sign = defaultValue(Math.sign, function sign(value) {
  value = +value; // coerce to number
  if (value === 0 || value !== value) {
    // zero or NaN
    return value;
  }
  return value > 0 ? 1 : -1;
});

/**
 * 如果给定值为正或零，则返回 1.0；如果为负，则返回 -1.0。
 * 这与 {@link CesiumMath#sign} 相似，但在输入值为 0.0 时返回 1.0 而不是 0.0。
 * @param {number} value 要返回符号的值。
 * @returns {number} 值的符号。
 */
CesiumMath.signNotZero = function (value) {
  return value < 0.0 ? -1.0 : 1.0;
};

/**
 * 将范围 [-1.0, 1.0] 内的标量值转换为范围 [0, rangeMaximum] 内的 SNORM。
 * @param {number} value 范围 [-1.0, 1.0] 内的标量值。
 * @param {number} [rangeMaximum=255] 映射范围中的最大值，默认为 255。
 * @returns {number} SNORM 值，其中 0 映射到 -1.0，rangeMaximum 映射到 1.0。
 *
 * @see CesiumMath.fromSNorm
 */

CesiumMath.toSNorm = function (value, rangeMaximum) {
  rangeMaximum = defaultValue(rangeMaximum, 255);
  return Math.round(
    (CesiumMath.clamp(value, -1.0, 1.0) * 0.5 + 0.5) * rangeMaximum,
  );
};

/**
 * 将范围 [0, rangeMaximum] 内的 SNORM 值转换为范围 [-1.0, 1.0] 内的标量值。
 * @param {number} value 范围 [0, rangeMaximum] 内的 SNORM 值。
 * @param {number} [rangeMaximum=255] SNORM 范围内的最大值，默认为 255。
 * @returns {number} 范围 [-1.0, 1.0] 内的标量值。
 *
 * @see CesiumMath.toSNorm
 */

CesiumMath.fromSNorm = function (value, rangeMaximum) {
  rangeMaximum = defaultValue(rangeMaximum, 255);
  return (
    (CesiumMath.clamp(value, 0.0, rangeMaximum) / rangeMaximum) * 2.0 - 1.0
  );
};

/**
 * 将范围 [rangeMinimum, rangeMaximum] 内的标量值转换为范围 [0.0, 1.0] 内的标量值。
 * @param {number} value 范围 [rangeMinimum, rangeMaximum] 内的标量值。
 * @param {number} rangeMinimum 映射范围内的最小值。
 * @param {number} rangeMaximum 映射范围内的最大值。
 * @returns {number} 一个标量值，其中 rangeMinimum 映射到 0.0，rangeMaximum 映射到 1.0。
 */

CesiumMath.normalize = function (value, rangeMinimum, rangeMaximum) {
  rangeMaximum = Math.max(rangeMaximum - rangeMinimum, 0.0);
  return rangeMaximum === 0.0
    ? 0.0
    : CesiumMath.clamp((value - rangeMinimum) / rangeMaximum, 0.0, 1.0);
};

/**
 * 返回一个数的双曲正弦。
 * <em>value</em> 的双曲正弦定义为
 * (<em>e<sup>x</sup>&nbsp;-&nbsp;e<sup>-x</sup></em>)/2.0，
 * 其中 <i>e</i> 是欧拉数，约为 2.71828183。
 *
 * <p>特殊情况：
 *   <ul>
 *     <li>如果参数为 NaN，结果将是 NaN。</li>
 *
 *     <li>如果参数为无限大，结果将是一个具有与参数相同符号的无穷大。</li>
 *
 *     <li>如果参数为零，结果将是一个具有与参数相同符号的零。</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {number} value 要返回其双曲正弦的数。
 * @returns {number} <code>value</code> 的双曲正弦。
 */

CesiumMath.sinh = defaultValue(Math.sinh, function sinh(value) {
  return (Math.exp(value) - Math.exp(-value)) / 2.0;
});

/**
 * 返回一个数的双曲余弦。
 * <strong>value</strong> 的双曲余弦定义为
 * (<em>e<sup>x</sup>&nbsp;+&nbsp;e<sup>-x</sup></em>)/2.0，
 * 其中 <i>e</i> 是欧拉数，约为 2.71828183。
 *
 * <p>特殊情况：
 *   <ul>
 *     <li>如果参数为 NaN，结果将是 NaN。</li>
 *
 *     <li>如果参数为无限大，结果将是正无穷。</li>
 *
 *     <li>如果参数为零，结果将是 1.0。</li>
 *   </ul>
 *</p>
 *
 * @function
 * @param {number} value 要返回其双曲余弦的数。
 * @returns {number} <code>value</code> 的双曲余弦。
 */

CesiumMath.cosh = defaultValue(Math.cosh, function cosh(value) {
  return (Math.exp(value) + Math.exp(-value)) / 2.0;
});

/**
 * 计算两个值的线性插值。
 *
 * @param {number} p 要插值的起始值。
 * @param {number} q 要插值的结束值。
 * @param {number} time 插值的时间，一般在 <code>[0.0, 1.0]</code> 范围内。
 * @returns {number} 线性插值后的值。
 *
 * @example
 * const n = Cesium.Math.lerp(0.0, 2.0, 0.5); // 返回 1.0
 */

CesiumMath.lerp = function (p, q, time) {
  return (1.0 - time) * p + time * q;
};

/**
 * pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI = Math.PI;

/**
 * 1/pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.ONE_OVER_PI = 1.0 / Math.PI;

/**
 * pi/2
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_TWO = Math.PI / 2.0;

/**
 * pi/3
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_THREE = Math.PI / 3.0;

/**
 * pi/4
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_FOUR = Math.PI / 4.0;

/**
 * pi/6
 *
 * @type {number}
 * @constant
 */
CesiumMath.PI_OVER_SIX = Math.PI / 6.0;

/**
 * 3pi/2
 *
 * @type {number}
 * @constant
 */
CesiumMath.THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;

/**
 * 2pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.TWO_PI = 2.0 * Math.PI;

/**
 * 1/2pi
 *
 * @type {number}
 * @constant
 */
CesiumMath.ONE_OVER_TWO_PI = 1.0 / (2.0 * Math.PI);

/**
 * 每度的弧度数。
 *
 * @type {number}
 * @constant
 */

CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;

/**
 * 每弧度的度数。
 *
 * @type {number}
 * @constant
 */
CesiumMath.DEGREES_PER_RADIAN = 180.0 / Math.PI;

/**
 * 每弧秒的弧度数。
 *
 * @type {number}
 * @constant
 */
CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600.0;

/**
 * 将度转换为弧度。
 * @param {number} degrees 要转换的角度（以度为单位）。
 * @returns {number} 对应的弧度角度。
 */

CesiumMath.toRadians = function (degrees) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(degrees)) {
    throw new DeveloperError("degrees is required.");
  }
  //>>includeEnd('debug');
  return degrees * CesiumMath.RADIANS_PER_DEGREE;
};

/**
 * 将弧度转换为度。
 * @param {number} radians 要转换的角度（以弧度为单位）。
 * @returns {number} 对应的角度（以度为单位）。
 */

CesiumMath.toDegrees = function (radians) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(radians)) {
    throw new DeveloperError("radians is required.");
  }
  //>>includeEnd('debug');
  return radians * CesiumMath.DEGREES_PER_RADIAN;
};

/**
 * 将弧度的经度值转换到范围 [<code>-Math.PI</code>, <code>Math.PI</code>)。
 *
 * @param {number} angle 要转换到范围 [<code>-Math.PI</code>, <code>Math.PI</code>) 的经度值（以弧度为单位）。
 * @returns {number} 范围 [<code>-Math.PI</code>, <code>Math.PI</code>) 内的等效经度值。
 *
 * @example
 * // Convert 270 degrees to -90 degrees longitude
 * const longitude = Cesium.Math.convertLongitudeRange(Cesium.Math.toRadians(270.0));
 */
CesiumMath.convertLongitudeRange = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  const twoPi = CesiumMath.TWO_PI;

  const simplified = angle - Math.floor(angle / twoPi) * twoPi;

  if (simplified < -Math.PI) {
    return simplified + twoPi;
  }
  if (simplified >= Math.PI) {
    return simplified - twoPi;
  }

  return simplified;
};

/**
 * 便利函数，将弧度的纬度值限制在范围 [<code>-Math.PI/2</code>, <code>Math.PI/2</code>) 内。
 * 在需要正确范围的对象中使用前，用于清理数据非常有用。
 *
 * @param {number} angle 要限制在范围 [<code>-Math.PI/2</code>, <code>Math.PI/2</code>) 的纬度值（以弧度为单位）。
 * @returns {number} 限制在范围 [<code>-Math.PI/2</code>, <code>Math.PI/2</code>) 内的纬度值。
 *
 * @example
 * // Clamp 108 degrees latitude to 90 degrees latitude
 * const latitude = Cesium.Math.clampToLatitudeRange(Cesium.Math.toRadians(108.0));
 */
CesiumMath.clampToLatitudeRange = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');

  return CesiumMath.clamp(
    angle,
    -1 * CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO,
  );
};

/**
 * 生成一个范围在 -Pi <= angle <= Pi 内的角度，该角度等效于提供的角度。
 *
 * @param {number} angle 以弧度表示的角度。
 * @returns {number} 范围为 [<code>-CesiumMath.PI</code>, <code>CesiumMath.PI</code>] 的角度。
 */

CesiumMath.negativePiToPi = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  if (angle >= -CesiumMath.PI && angle <= CesiumMath.PI) {
    // Early exit if the input is already inside the range. This avoids
    // unnecessary math which could introduce floating point error.
    return angle;
  }
  return CesiumMath.zeroToTwoPi(angle + CesiumMath.PI) - CesiumMath.PI;
};

/**
 * 生成一个范围在 0 <= angle <= 2Pi 内的角度，该角度等效于提供的角度。
 *
 * @param {number} angle 以弧度表示的角度。
 * @returns {number} 范围为 [0, <code>CesiumMath.TWO_PI</code>] 的角度。
 */

CesiumMath.zeroToTwoPi = function (angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  //>>includeEnd('debug');
  if (angle >= 0 && angle <= CesiumMath.TWO_PI) {
    // Early exit if the input is already inside the range. This avoids
    // unnecessary math which could introduce floating point error.
    return angle;
  }
  const mod = CesiumMath.mod(angle, CesiumMath.TWO_PI);
  if (
    Math.abs(mod) < CesiumMath.EPSILON14 &&
    Math.abs(angle) > CesiumMath.EPSILON14
  ) {
    return CesiumMath.TWO_PI;
  }
  return mod;
};

/**
 * 也适用于负被除数的模运算。
 *
 * @param {number} m 被除数。
 * @param {number} n 除数。
 * @returns {number} 余数。
 */

CesiumMath.mod = function (m, n) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(m)) {
    throw new DeveloperError("m is required.");
  }
  if (!defined(n)) {
    throw new DeveloperError("n is required.");
  }
  if (n === 0.0) {
    throw new DeveloperError("divisor cannot be 0.");
  }
  //>>includeEnd('debug');
  if (CesiumMath.sign(m) === CesiumMath.sign(n) && Math.abs(m) < Math.abs(n)) {
    // Early exit if the input does not need to be modded. This avoids
    // unnecessary math which could introduce floating point error.
    return m;
  }

  return ((m % n) + n) % n;
};

/**
 * 使用绝对或相对公差测试确定两个值是否相等。这对于避免由于四舍五入误差直接比较浮点值时出现的问题非常有用。
 * 首先使用绝对公差测试进行比较。如果该测试失败，则进行相对公差测试。
 * 如果不确定左右值的大小，请使用此测试。
 *
 * @param {number} left 第一个要比较的值。
 * @param {number} right 另一个要比较的值。
 * @param {number} [relativeEpsilon=0] 对于相对公差测试，<code>left</code> 和 <code>right</code> 之间的最大包含差值。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 对于绝对公差测试，<code>left</code> 和 <code>right</code> 之间的最大包含差值。
 * @returns {boolean} 如果在公差范围内值相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @example
 * const a = Cesium.Math.equalsEpsilon(0.0, 0.01, Cesium.Math.EPSILON2); // true
 * const b = Cesium.Math.equalsEpsilon(0.0, 0.1, Cesium.Math.EPSILON2);  // false
 * const c = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON7); // true
 * const d = Cesium.Math.equalsEpsilon(3699175.1634344, 3699175.2, Cesium.Math.EPSILON9); // false
 */
CesiumMath.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("left is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("right is required.");
  }
  //>>includeEnd('debug');

  relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
  absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
};

/**
 * 确定左值是否小于右值。如果两个值之间的差距在 
 * <code>absoluteEpsilon</code> 之内，则认为它们相等，函数返回 false。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 在比较中使用的绝对公差。
 * @returns {boolean} 如果 <code>left</code> 小于 <code>right</code> 且差值超过 
 *          <code>absoluteEpsilon</code>，则返回 <code>true</code>；如果 <code>left</code> 大于
 *          或两个值几乎相等，则返回 <code>false</code>。
 */

CesiumMath.lessThan = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right < -absoluteEpsilon;
};

/**
 * 确定左值是否小于或等于右值。如果两个值之间的差距在 
 * <code>absoluteEpsilon</code> 之内，则认为它们相等，函数返回 true。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 在比较中使用的绝对公差。
 * @returns {boolean} 如果 <code>left</code> 小于 <code>right</code> 或如果
 *          两个值几乎相等，则返回 <code>true</code>。
 */

CesiumMath.lessThanOrEquals = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right < absoluteEpsilon;
};

/**
 * 确定左值是否大于右值。如果两个值之间的差距在 
 * <code>absoluteEpsilon</code> 之内，则认为它们相等，函数返回 false。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 在比较中使用的绝对公差。
 * @returns {boolean} 如果 <code>left</code> 大于 <code>right</code> 且差值超过 
 *          <code>absoluteEpsilon</code>，则返回 <code>true</code>；如果 <code>left</code> 小于
 *          或两个值几乎相等，则返回 <code>false</code>。
 */

CesiumMath.greaterThan = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right > absoluteEpsilon;
};

/**
 * 确定左值是否大于或等于右值。如果两个值之间的差距在 
 * <code>absoluteEpsilon</code> 之内，则认为它们相等，函数返回 true。
 *
 * @param {number} left 要比较的第一个数字。
 * @param {number} right 要比较的第二个数字。
 * @param {number} absoluteEpsilon 在比较中使用的绝对公差。
 * @returns {boolean} 如果 <code>left</code> 大于 <code>right</code> 或如果
 *          两个值几乎相等，则返回 <code>true</code>。
 */

CesiumMath.greaterThanOrEquals = function (left, right, absoluteEpsilon) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("first is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("second is required.");
  }
  if (!defined(absoluteEpsilon)) {
    throw new DeveloperError("absoluteEpsilon is required.");
  }
  //>>includeEnd('debug');
  return left - right > -absoluteEpsilon;
};

const factorials = [1];

/**
 * 计算提供数字的阶乘。
 *
 * @param {number} n 要计算阶乘的数字。
 * @returns {number} 提供数字的阶乘，如果数字小于 0 则返回 undefined。
 *
 * @exception {DeveloperError} 需要一个大于或等于 0 的数字。
 *

 *
 * @example
 * //Compute 7!, which is equal to 5040
 * const computedFactorial = Cesium.Math.factorial(7);
 *
 * @see {@link http://en.wikipedia.org/wiki/Factorial|Factorial on Wikipedia}
 */
CesiumMath.factorial = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0) {
    throw new DeveloperError(
      "A number greater than or equal to 0 is required.",
    );
  }
  //>>includeEnd('debug');

  const length = factorials.length;
  if (n >= length) {
    let sum = factorials[length - 1];
    for (let i = length; i <= n; i++) {
      const next = sum * i;
      factorials.push(next);
      sum = next;
    }
  }
  return factorials[n];
};

/**
 * 增加一个数字，如果超出最大值则循环回重置到最小值。
 *
 * @param {number} [n] 要增加的数字。
 * @param {number} [maximumValue] 增加到的最大值，超过该值后将重置到最小值。
 * @param {number} [minimumValue=0.0] 超过最大值后重置到的数字。
 * @returns {number} 增加后的数字。
 *
 * @exception {DeveloperError} 最大值必须大于最小值。
 *
 * @example
 * const n = Cesium.Math.incrementWrap(5, 10, 0); // returns 6
 * const m = Cesium.Math.incrementWrap(10, 10, 0); // returns 0
 */
CesiumMath.incrementWrap = function (n, maximumValue, minimumValue) {
  minimumValue = defaultValue(minimumValue, 0.0);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(n)) {
    throw new DeveloperError("n is required.");
  }
  if (maximumValue <= minimumValue) {
    throw new DeveloperError("maximumValue must be greater than minimumValue.");
  }
  //>>includeEnd('debug');

  ++n;
  if (n > maximumValue) {
    n = minimumValue;
  }
  return n;
};

/**
 * 确定一个非负整数是否是二的幂。
 * 由于 JavaScript 中 32 位位运算符的限制，最大允许输入为 (2^32)-1。
 *
 * @param {number} n 要测试的整数，范围在 [0, (2^32)-1] 内。
 * @returns {boolean} 如果数字是二的幂，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 需要一个介于 0 和 (2^32)-1 之间的数字。
 *
 * @example
 * const t = Cesium.Math.isPowerOfTwo(16); // true
 * const f = Cesium.Math.isPowerOfTwo(20); // false
 */
CesiumMath.isPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError("A number between 0 and (2^32)-1 is required.");
  }
  //>>includeEnd('debug');

  return n !== 0 && (n & (n - 1)) === 0;
};

/**
 * 计算大于或等于提供的非负整数的下一个二的幂整数。
 * 由于 JavaScript 中 32 位位运算符的限制，最大允许输入为 2^31。
 *
 * @param {number} n 要测试的整数，范围在 [0, 2^31] 内。
 * @returns {number} 下一个二的幂整数。
 *
 * @exception {DeveloperError} 需要一个介于 0 和 2^31 之间的数字。
 *
 * @example
 * const n = Cesium.Math.nextPowerOfTwo(29); // 32
 * const m = Cesium.Math.nextPowerOfTwo(32); // 32
 */
CesiumMath.nextPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 2147483648) {
    throw new DeveloperError("A number between 0 and 2^31 is required.");
  }
  //>>includeEnd('debug');

  // From http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
  --n;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  ++n;

  return n;
};

/**
 * 计算小于或等于提供的非负整数的前一个二的幂整数。
 * 由于 JavaScript 中 32 位位运算符的限制，最大允许输入为 (2^32)-1。
 *
 * @param {number} n 要测试的整数，范围在 [0, (2^32)-1] 内。
 * @returns {number} 前一个二的幂整数。
 *
 * @exception {DeveloperError} 需要一个介于 0 和 (2^32)-1 之间的数字。
 *
 * @example
 * const n = Cesium.Math.previousPowerOfTwo(29); // 16
 * const m = Cesium.Math.previousPowerOfTwo(32); // 32
 */
CesiumMath.previousPowerOfTwo = function (n) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof n !== "number" || n < 0 || n > 4294967295) {
    throw new DeveloperError("A number between 0 and (2^32)-1 is required.");
  }
  //>>includeEnd('debug');

  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  n |= n >> 32;

  // The previous bitwise operations implicitly convert to signed 32-bit. Use `>>>` to convert to unsigned
  n = (n >>> 0) - (n >>> 1);

  return n;
};

/**
 * 将值限制在两个值之间。
 *
 * @param {number} value 要限制的值。
 * @param {number} min 最小值。
 * @param {number} max 最大值。
 * @returns {number} 限制后的值，使得 min <= result <= max。
 */

CesiumMath.clamp = function (value, min, max) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  Check.typeOf.number("min", min);
  Check.typeOf.number("max", max);
  //>>includeEnd('debug');

  return value < min ? min : value > max ? max : value;
};

let randomNumberGenerator = new MersenneTwister();

/**
 * 设置随机数生成器使用的种子
 * 在 {@link CesiumMath#nextRandomNumber} 中。
 *
 * @param {number} seed 用作种子的整数。
 */

CesiumMath.setRandomNumberSeed = function (seed) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(seed)) {
    throw new DeveloperError("seed is required.");
  }
  //>>includeEnd('debug');

  randomNumberGenerator = new MersenneTwister(seed);
};

/**
 * 生成一个范围在 [0.0, 1.0) 内的随机浮点数
 * 使用梅森旋转算法生成。
 *
 * @returns {number} 范围在 [0.0, 1.0) 内的随机数。
 *
 * @see CesiumMath.setRandomNumberSeed
 * @see {@link http://en.wikipedia.org/wiki/Mersenne_twister|Mersenne twister on Wikipedia}
 */
CesiumMath.nextRandomNumber = function () {
  return randomNumberGenerator.random();
};

/**
 * 生成一个介于两个数字之间的随机数。
 *
 * @param {number} min 最小值。
 * @param {number} max 最大值。
 * @returns {number} 介于 min 和 max 之间的随机数。
 */

CesiumMath.randomBetween = function (min, max) {
  return CesiumMath.nextRandomNumber() * (max - min) + min;
};

/**
 * 计算 <code>Math.acos(value)</code>，但首先将 <code>value</code> 限制在范围 [-1.0, 1.0] 内，
 * 以确保函数永远不会返回 NaN。
 *
 * @param {number} value 要计算 acos 的值。
 * @returns {number} 如果值在范围 [-1.0, 1.0] 内，则返回该值的 acos；如果值超出范围，则返回 -1.0 或 1.0 的 acos，
 *          取更接近的那个。
 */

CesiumMath.acosClamped = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');
  return Math.acos(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * 计算 <code>Math.asin(value)</code>，但首先将 <code>value</code> 限制在范围 [-1.0, 1.0] 内，
 * 以确保函数永远不会返回 NaN。
 *
 * @param {number} value 要计算 asin 的值。
 * @returns {number} 如果值在范围 [-1.0, 1.0] 内，则返回该值的 asin；如果值超出范围，则返回 -1.0 或 1.0 的 asin，
 *          取更接近的那个。
 */

CesiumMath.asinClamped = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');
  return Math.asin(CesiumMath.clamp(value, -1.0, 1.0));
};

/**
 * 根据圆的半径和两点之间的角度，计算两点之间的弦长。
 *
 * @param {number} angle 两点之间的角度。
 * @param {number} radius 圆的半径。
 * @returns {number} 弦长。
 */

CesiumMath.chordLength = function (angle, radius) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(angle)) {
    throw new DeveloperError("angle is required.");
  }
  if (!defined(radius)) {
    throw new DeveloperError("radius is required.");
  }
  //>>includeEnd('debug');
  return 2.0 * radius * Math.sin(angle * 0.5);
};

/**
 * 计算一个数的以指定底数的对数。
 *
 * @param {number} number 要计算对数的数。
 * @param {number} base 底数。
 * @returns {number} 结果。
 */

CesiumMath.logBase = function (number, base) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(number)) {
    throw new DeveloperError("number is required.");
  }
  if (!defined(base)) {
    throw new DeveloperError("base is required.");
  }
  //>>includeEnd('debug');
  return Math.log(number) / Math.log(base);
};

/**
 * 计算一个数的立方根。
 * 如果未提供 <code>number</code>，则返回 NaN。
 *
 * @function
 * @param {number} [number] 要计算的数。
 * @returns {number} 结果。
 */

CesiumMath.cbrt = defaultValue(Math.cbrt, function cbrt(number) {
  const result = Math.pow(Math.abs(number), 1.0 / 3.0);
  return number < 0.0 ? -result : result;
});

/**
 * 计算一个数的以 2 为底的对数。
 *
 * @function
 * @param {number} number 要计算对数的数。
 * @returns {number} 结果。
 */

CesiumMath.log2 = defaultValue(Math.log2, function log2(number) {
  return Math.log(number) * Math.LOG2E;
});

/**
 * 计算给定距离的雾霾影响。对消隐非常有用。
 * 与 `fog.glsl` 中的方程匹配。
 * @private
 */

CesiumMath.fog = function (distanceToCamera, density) {
  const scalar = distanceToCamera * density;
  return 1.0 - Math.exp(-(scalar * scalar));
};

/**
 * 计算输入范围在 [-1, 1] 内的 Atan 的快速近似值。
 *
 * 基于 Michal Drobot 在 ShaderFastLibs 中的近似，
 * 该近似又基于 "Efficiency approximations for the arctangent function,"
 * Rajan, S. Sichun Wang Inkol, R. Joyal, A.，2006年5月。
 * 从 ShaderFastLibs 根据 MIT 许可进行调整。
 *
 * @param {number} x 输入数字，范围在 [-1, 1] 内。
 * @returns {number} atan(x) 的近似值。
 */

CesiumMath.fastApproximateAtan = function (x) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("x", x);
  //>>includeEnd('debug');

  return x * (-0.1784 * Math.abs(x) - 0.0663 * x * x + 1.0301);
};

/**
 * 计算对任意输入标量的 Atan2(x, y) 的快速近似值。
 *
 * 范围缩减数学基于 NVIDIA 的 cg 参考实现：http://developer.download.nvidia.com/cg/atan2.html
 *
 * @param {number} x 如果 y 为零，则输入数字不能为零。
 * @param {number} y 如果 x 为零，则输入数字不能为零。
 * @returns {number} atan2(x, y) 的近似值。
 */

CesiumMath.fastApproximateAtan2 = function (x, y) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("x", x);
  Check.typeOf.number("y", y);
  //>>includeEnd('debug');

  // atan approximations are usually only reliable over [-1, 1]
  // So reduce the range by flipping whether x or y is on top based on which is bigger.
  let opposite;
  let t = Math.abs(x); // t used as swap and atan result.
  opposite = Math.abs(y);
  const adjacent = Math.max(t, opposite);
  opposite = Math.min(t, opposite);

  const oppositeOverAdjacent = opposite / adjacent;
  //>>includeStart('debug', pragmas.debug);
  if (isNaN(oppositeOverAdjacent)) {
    throw new DeveloperError("either x or y must be nonzero");
  }
  //>>includeEnd('debug');
  t = CesiumMath.fastApproximateAtan(oppositeOverAdjacent);

  // Undo range reduction
  t = Math.abs(y) > Math.abs(x) ? CesiumMath.PI_OVER_TWO - t : t;
  t = x < 0.0 ? CesiumMath.PI - t : t;
  t = y < 0.0 ? -t : t;
  return t;
};
export default CesiumMath;
