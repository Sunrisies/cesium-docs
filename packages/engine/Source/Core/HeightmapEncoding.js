/**
 * 用于高度图的编码
 *
 * @enum {number}
 */
const HeightmapEncoding = {
  /**
   * 无编码
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * LERC 编码
   *
   * @type {number}
   * @constant
   *
   * @see {@link https://github.com/Esri/lerc|LERC 规范}
   */
  LERC: 1,
};
export default Object.freeze(HeightmapEncoding);
