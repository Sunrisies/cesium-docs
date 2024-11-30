import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 表示标量值在视点空间中近距离和远距离的下限和上限。
 * @alias NearFarScalar
 * @constructor
 *
 * @param {number} [near=0.0] 相机范围的下限。
 * @param {number} [nearValue=0.0] 相机范围下限处的值。
 * @param {number} [far=1.0] 相机范围的上限。
 * @param {number} [farValue=0.0] 相机范围上限处的值。
 *
 * @see Packable
 */

function NearFarScalar(near, nearValue, far, farValue) {
  /**
   * 相机范围的下限。
   * @type {number}
   * @default 0.0
   */
  this.near = defaultValue(near, 0.0);
  
  /**
   * 相机范围下限处的值。
   * @type {number}
   * @default 0.0
   */
  this.nearValue = defaultValue(nearValue, 0.0);
  
  /**
   * 相机范围的上限。
   * @type {number}
   * @default 1.0
   */
  this.far = defaultValue(far, 1.0);
  
  /**
   * 相机范围上限处的值。
   * @type {number}
   * @default 0.0
   */
  this.farValue = defaultValue(farValue, 0.0);
}


/**
 * 复制一个 NearFarScalar 实例。
 *
 * @param {NearFarScalar} nearFarScalar 要复制的 NearFarScalar。
 * @param {NearFarScalar} [result] 存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数，或者如果未提供，则返回一个新的 NearFarScalar 实例。（如果 nearFarScalar 为未定义，则返回 undefined）
 */

NearFarScalar.clone = function (nearFarScalar, result) {
  if (!defined(nearFarScalar)) {
    return undefined;
  }

  if (!defined(result)) {
    return new NearFarScalar(
      nearFarScalar.near,
      nearFarScalar.nearValue,
      nearFarScalar.far,
      nearFarScalar.farValue,
    );
  }

  result.near = nearFarScalar.near;
  result.nearValue = nearFarScalar.nearValue;
  result.far = nearFarScalar.far;
  result.farValue = nearFarScalar.farValue;
  return result;
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
NearFarScalar.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {NearFarScalar} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
NearFarScalar.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.near;
  array[startingIndex++] = value.nearValue;
  array[startingIndex++] = value.far;
  array[startingIndex] = value.farValue;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {NearFarScalar} [result] 存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数，或者如果未提供，则返回一个新的 NearFarScalar 实例。
 */

NearFarScalar.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new NearFarScalar();
  }
  result.near = array[startingIndex++];
  result.nearValue = array[startingIndex++];
  result.far = array[startingIndex++];
  result.farValue = array[startingIndex];
  return result;
};

/**
 * 比较提供的 NearFarScalar，如果它们相等则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @param {NearFarScalar} [left] 第一个 NearFarScalar。
 * @param {NearFarScalar} [right] 第二个 NearFarScalar。
 * @returns {boolean} 如果 left 和 right 相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

NearFarScalar.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.near === right.near &&
      left.nearValue === right.nearValue &&
      left.far === right.far &&
      left.farValue === right.farValue)
  );
};

/**
 * 复制此实例。
 *
 * @param {NearFarScalar} [result] 存储结果的对象。
 * @returns {NearFarScalar} 修改后的结果参数，或者如果未提供，则返回一个新的 NearFarScalar 实例。
 */
NearFarScalar.prototype.clone = function (result) {
  return NearFarScalar.clone(this, result);
};

/**
 * 将此实例与提供的 NearFarScalar 进行比较，如果它们相等则返回 <code>true</code>，
 * 否则返回 <code>false</code>。
 *
 * @param {NearFarScalar} [right] 右侧的 NearFarScalar。
 * @returns {boolean} 如果 left 和 right 相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

NearFarScalar.prototype.equals = function (right) {
  return NearFarScalar.equals(this, right);
};
export default NearFarScalar;
