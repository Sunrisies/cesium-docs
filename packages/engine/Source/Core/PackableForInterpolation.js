import DeveloperError from "./DeveloperError.js";

/**
 * 静态接口，用于 {@link Packable} 类型，这些类型的插值表示方式与其打包值不同。
 * 这些方法和属性应在构造函数上定义。
 *
 * @namespace PackableForInterpolation
 *
 * @see Packable
 */
const PackableForInterpolation = {
  /**
   * 用于将对象存储到数组中的插值形式所需的元素数量。
   * @type {number}
   */
  packedInterpolationLength: undefined,

  /**
   * 将压缩数组转换为适合插值的形式。
   * @function
   *
   * @param {number[]} packedArray 压缩数组.
   * @param {number} [startingIndex=0] 要转换的第一个元素的索引.
   * @param {number} [lastIndex=packedArray.length] 要转换的最后一个元素的索引.
   * @param {number[]} [result] 存储结果的对象.
   */
  convertPackedArrayForInterpolation: DeveloperError.throwInstantiationError,

  /**
   * 从通过 {@link PackableForInterpolation.convertPackedArrayForInterpolation} 转换的压缩数组中检索实例。
   * @function
   *
   * @param {number[]} array 先前为插值而压缩的数组.
   * @param {number[]} sourceArray 原始压缩数组.
   * @param {number} [startingIndex=0] 用于转换数组的起始索引.
   * @param {number} [lastIndex=packedArray.length] 用于转换数组的最后索引.
   * @param {object} [result] 存储结果的对象.
   * @returns {object} 修改后的结果参数或如果未提供，则返回一个新的对象实例.
   */
  unpackInterpolationResult: DeveloperError.throwInstantiationError,
};
export default PackableForInterpolation;
