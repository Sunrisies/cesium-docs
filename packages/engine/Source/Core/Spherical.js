import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 一组曲线的三维坐标。
 *
 * @alias Spherical
 * @constructor
 *
 * @param {number} [clock=0.0] 位于 xy 平面上的角坐标，从正 x 轴测量，朝向正 y 轴。
 * @param {number} [cone=0.0] 从正 z 轴测量的角坐标，朝向负 z 轴。
 * @param {number} [magnitude=1.0] 从原点测量的线性坐标。
 */

function Spherical(clock, cone, magnitude) {
  /**
   * 时钟分量。
   * @type {number}
   * @default 0.0
   */
  this.clock = defaultValue(clock, 0.0);
  /**
   * 锥形分量。
   * @type {number}
   * @default 0.0
   */
  this.cone = defaultValue(cone, 0.0);
  /**
   * 大小分量。
   * @type {number}
   * @default 1.0
   */
  this.magnitude = defaultValue(magnitude, 1.0);
}


/**
 * 将提供的 Cartesian3 转换为球面坐标。
 *
 * @param {Cartesian3} cartesian3 要转换为球面坐标的 Cartesian3。
 * @param {Spherical} [result] 存储结果的对象，如果未定义，则会创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，或者如果未提供则返回一个新的实例。
 */

Spherical.fromCartesian3 = function (cartesian3, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian3", cartesian3);
  //>>includeEnd('debug');

  const x = cartesian3.x;
  const y = cartesian3.y;
  const z = cartesian3.z;
  const radialSquared = x * x + y * y;

  if (!defined(result)) {
    result = new Spherical();
  }

  result.clock = Math.atan2(y, x);
  result.cone = Math.atan2(Math.sqrt(radialSquared), z);
  result.magnitude = Math.sqrt(radialSquared + z * z);
  return result;
};

/**
 * 创建一个 Spherical 的副本。
 *
 * @param {Spherical} spherical 要克隆的球面对象。
 * @param {Spherical} [result] 用于存储结果的对象，如果未定义则会创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，或者如果未提供则返回一个新的实例。（如果 spherical 为未定义，则返回未定义）
 */

Spherical.clone = function (spherical, result) {
  if (!defined(spherical)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Spherical(spherical.clock, spherical.cone, spherical.magnitude);
  }

  result.clock = spherical.clock;
  result.cone = spherical.cone;
  result.magnitude = spherical.magnitude;
  return result;
};

/**
 * 计算提供的球面对象的归一化版本。
 *
 * @param {Spherical} spherical 要归一化的球面对象。
 * @param {Spherical} [result] 用于存储结果的对象，如果未定义则会创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，或者如果未提供则返回一个新的实例。
 */

Spherical.normalize = function (spherical, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("spherical", spherical);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Spherical(spherical.clock, spherical.cone, 1.0);
  }

  result.clock = spherical.clock;
  result.cone = spherical.cone;
  result.magnitude = 1.0;
  return result;
};

/**
 * 如果第一个球面对象等于第二个球面对象，则返回 true，否则返回 false。
 *
 * @param {Spherical} left 要比较的第一个球面对象。
 * @param {Spherical} right 要比较的第二个球面对象。
 * @returns {boolean} 如果第一个球面对象等于第二个球面对象，则返回 true，否则返回 false。
 */

Spherical.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.clock === right.clock &&
      left.cone === right.cone &&
      left.magnitude === right.magnitude)
  );
};

/**
 * 如果第一个球面对象在提供的 epsilon 范围内与第二个球面对象相等，则返回 true，否则返回 false。
 *
 * @param {Spherical} left 要比较的第一个球面对象。
 * @param {Spherical} right 要比较的第二个球面对象。
 * @param {number} [epsilon=0.0] 用于比较的 epsilon 值。
 * @returns {boolean} 如果第一个球面对象在提供的 epsilon 范围内与第二个球面对象相等，则返回 true，否则返回 false。
 */

Spherical.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0.0);
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.clock - right.clock) <= epsilon &&
      Math.abs(left.cone - right.cone) <= epsilon &&
      Math.abs(left.magnitude - right.magnitude) <= epsilon)
  );
};

/**
 * 如果此球面对象等于提供的球面对象，则返回 true，否则返回 false。
 *
 * @param {Spherical} other 要比较的球面对象。
 * @returns {boolean} 如果此球面对象等于提供的球面对象，则返回 true，否则返回 false。
 */
Spherical.prototype.equals = function (other) {
  return Spherical.equals(this, other);
};

/**
 * 创建此球面的副本。
 *
 * @param {Spherical} [result] 用于存储结果的对象，如果未定义则会创建一个新实例。
 * @returns {Spherical} 修改后的结果参数，或者如果未提供则返回一个新的实例。
 */

Spherical.prototype.clone = function (result) {
  return Spherical.clone(this, result);
};

/**
 * 如果此球面对象在提供的 epsilon 范围内与提供的球面对象相等，则返回 true，否则返回 false。
 *
 * @param {Spherical} other 要比较的球面对象。
 * @param {number} epsilon 用于比较的 epsilon 值。
 * @returns {boolean} 如果此球面对象在提供的 epsilon 范围内与提供的球面对象相等，则返回 true，否则返回 false。
 */
Spherical.prototype.equalsEpsilon = function (other, epsilon) {
  return Spherical.equalsEpsilon(this, other, epsilon);
};

/**
 * 返回一个字符串，表示此实例，格式为 (clock, cone, magnitude)。
 *
 * @returns {string} 表示此实例的字符串。
 */

Spherical.prototype.toString = function () {
  return `(${this.clock}, ${this.cone}, ${this.magnitude})`;
};
export default Spherical;
