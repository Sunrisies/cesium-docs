import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 以航向、俯仰和滚转表示的旋转。航向是关于负 z 轴的旋转。俯仰是关于负 y 轴的旋转。滚转是关于正 x 轴的旋转。
 * @alias HeadingPitchRoll
 * @constructor
 *
 * @param {number} [heading=0.0] 航向分量（以弧度为单位）。
 * @param {number} [pitch=0.0] 俯仰分量（以弧度为单位）。
 * @param {number} [roll=0.0] 滚转分量（以弧度为单位）。
 */

function HeadingPitchRoll(heading, pitch, roll) {
  /**
   * 获取或设置航向。
   * @type {number}
   * @default 0.0
   */
  this.heading = defaultValue(heading, 0.0);
  
  /**
   * 获取或设置俯仰。
   * @type {number}
   * @default 0.0
   */
  this.pitch = defaultValue(pitch, 0.0);
  
  /**
   * 获取或设置滚转。
   * @type {number}
   * @default 0.0
   */
  this.roll = defaultValue(roll, 0.0);
}


/**
 * 从四元数计算航向、俯仰和滚转（详见 http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles）
 *
 * @param {Quaternion} quaternion 要从中获取航向、俯仰和滚转的四元数，结果均以弧度表示。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如果未提供，则创建并返回一个新的实例。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如果未提供则返回一个新的 HeadingPitchRoll 实例。
 */

HeadingPitchRoll.fromQuaternion = function (quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(quaternion)) {
    throw new DeveloperError("quaternion is required");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new HeadingPitchRoll();
  }
  const test = 2 * (quaternion.w * quaternion.y - quaternion.z * quaternion.x);
  const denominatorRoll =
    1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y);
  const numeratorRoll =
    2 * (quaternion.w * quaternion.x + quaternion.y * quaternion.z);
  const denominatorHeading =
    1 - 2 * (quaternion.y * quaternion.y + quaternion.z * quaternion.z);
  const numeratorHeading =
    2 * (quaternion.w * quaternion.z + quaternion.x * quaternion.y);
  result.heading = -Math.atan2(numeratorHeading, denominatorHeading);
  result.roll = Math.atan2(numeratorRoll, denominatorRoll);
  result.pitch = -CesiumMath.asinClamped(test);
  return result;
};

/**
 * 根据给定的角度（以度为单位）返回一个新的 HeadingPitchRoll 实例。
 *
 * @param {number} heading 航向（以度为单位）
 * @param {number} pitch 俯仰（以度为单位）
 * @param {number} roll 滚转（以度为单位）
 * @param {HeadingPitchRoll} [result] 存储结果的对象。如果未提供，则创建并返回一个新的实例。
 * @returns {HeadingPitchRoll} 一个新的 HeadingPitchRoll 实例
 */

HeadingPitchRoll.fromDegrees = function (heading, pitch, roll, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(heading)) {
    throw new DeveloperError("heading is required");
  }
  if (!defined(pitch)) {
    throw new DeveloperError("pitch is required");
  }
  if (!defined(roll)) {
    throw new DeveloperError("roll is required");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new HeadingPitchRoll();
  }
  result.heading = heading * CesiumMath.RADIANS_PER_DEGREE;
  result.pitch = pitch * CesiumMath.RADIANS_PER_DEGREE;
  result.roll = roll * CesiumMath.RADIANS_PER_DEGREE;
  return result;
};

/**
 * 复制一个 HeadingPitchRoll 实例。
 *
 * @param {HeadingPitchRoll} headingPitchRoll 要复制的 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如果未提供则返回一个新的 HeadingPitchRoll 实例。（如果 headingPitchRoll 为 undefined，则返回 undefined）
 */

HeadingPitchRoll.clone = function (headingPitchRoll, result) {
  if (!defined(headingPitchRoll)) {
    return undefined;
  }
  if (!defined(result)) {
    return new HeadingPitchRoll(
      headingPitchRoll.heading,
      headingPitchRoll.pitch,
      headingPitchRoll.roll,
    );
  }
  result.heading = headingPitchRoll.heading;
  result.pitch = headingPitchRoll.pitch;
  result.roll = headingPitchRoll.roll;
  return result;
};

/**
 * 按组件比较提供的 HeadingPitchRoll，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {HeadingPitchRoll} [left] 第一个 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

HeadingPitchRoll.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.heading === right.heading &&
      left.pitch === right.pitch &&
      left.roll === right.roll)
  );
};

/**
 * 按组件比较提供的 HeadingPitchRoll，并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [left] 第一个 HeadingPitchRoll。
 * @param {HeadingPitchRoll} [right] 第二个 HeadingPitchRoll。
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差。
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */

HeadingPitchRoll.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.heading,
        right.heading,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.pitch,
        right.pitch,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.roll,
        right.roll,
        relativeEpsilon,
        absoluteEpsilon,
      ))
  );
};

/**
 * 复制此 HeadingPitchRoll 实例。
 *
 * @param {HeadingPitchRoll} [result] 存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如果未提供则返回一个新的 HeadingPitchRoll 实例。
 */

HeadingPitchRoll.prototype.clone = function (result) {
  return HeadingPitchRoll.clone(this, result);
};

/**
 * 按组件比较此 HeadingPitchRoll 和提供的 HeadingPitchRoll，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {HeadingPitchRoll} [right] 右侧的 HeadingPitchRoll。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>
 */

HeadingPitchRoll.prototype.equals = function (right) {
  return HeadingPitchRoll.equals(this, right);
};

/**
 * 按组件比较此 HeadingPitchRoll 和提供的 HeadingPitchRoll，并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {HeadingPitchRoll} [right] 右侧的 HeadingPitchRoll。
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差。
 * @returns {boolean} 如果它们在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>
 */

HeadingPitchRoll.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return HeadingPitchRoll.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon,
  );
};

/**
 * 创建一个字符串，以格式 '(heading, pitch, roll)' 表示此 HeadingPitchRoll，单位为弧度。
 *
 * @returns {string} 表示提供的 HeadingPitchRoll 的字符串，格式为 '(heading, pitch, roll)'。
 */

HeadingPitchRoll.prototype.toString = function () {
  return `(${this.heading}, ${this.pitch}, ${this.roll})`;
};
export default HeadingPitchRoll;
