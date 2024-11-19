/**
 * ArcType 定义连接顶点的路径.
 *
 * @enum {number}
 */
const ArcType = {
  /**
   * 不符合椭圆体表面的直线.
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 遵循测地线路径.
   *
   * @type {number}
   * @constant
   */
  GEODESIC: 1,

  /**
   * 遵循等角航线或斜航线.
   *
   * @type {number}
   * @constant
   */
  RHUMB: 2,
};
export default Object.freeze(ArcType);
