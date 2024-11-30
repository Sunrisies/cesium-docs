/**
 * 描述如何绘制标签。
 *
 * @enum {number}
 *
 * @see Label#style
 */
const LabelStyle = {
  /**
   * 填充标签文本，但不勾勒轮廓。
   *
   * @type {number}
   * @constant
   */
  FILL: 0,

  /**
   * 勾勒标签文本的轮廓，但不填充。
   *
   * @type {number}
   * @constant
   */
  OUTLINE: 1,

  /**
   * 填充并勾勒标签文本。
   *
   * @type {number}
   * @constant
   */
  FILL_AND_OUTLINE: 2,
};
export default Object.freeze(LabelStyle);
