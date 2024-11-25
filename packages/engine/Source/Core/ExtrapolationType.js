/**
 * 常量，用于确定在查询可用数据边界之外时如何外推插值值。
 *
 * @enum {number}
 *
 * @see SampledProperty
 */
const ExtrapolationType = {
  /**
   * 不发生外推。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 当超出样本数据范围时使用第一个或最后一个值。
   *
   * @type {number}
   * @constant
   */
  HOLD: 1,

  /**
   * 进行外推。
   *
   * @type {number}
   * @constant
   */
  EXTRAPOLATE: 2,
};
export default Object.freeze(ExtrapolationType);
