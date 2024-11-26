import DeveloperError from "./DeveloperError.js";

/**
 * Static interface for types which can store their values as packed
 * elements in an array.  These methods and properties are expected to be
 * defined on a constructor function.
 *
 * @interface Packable
 *
 * @see PackableForInterpolation
 */
const Packable = {
  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  packedLength: undefined,

  /**
   * 将提供的实例存储到提供的数组中.
   * @function
   *
   * @param {*} value 要打包的值.
   * @param {number[]} array 要打包到的数组.
   * @param {number} [startingIndex=0] 开始打包元素的数组索引.
   */
  pack: DeveloperError.throwInstantiationError,

  /**
   * 从打包数组中检索实例.
   * @function
   *
   * @param {number[]} array 压缩数组.
   * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
   * @param {object} [result] 存储结果的对象.
   * @returns {object} The modified result parameter or a new Object instance if one was not provided.
   */
  unpack: DeveloperError.throwInstantiationError,
};
export default Packable;
