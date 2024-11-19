import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定两个像素值是如何组合的。
 *
 * @enum {number}
 */
const BlendEquation = {
  /**
   * 像素值按组件相加。这用于透明度的加性混合。
   *
   * @type {number}
   * @constant
   */
  ADD: WebGLConstants.FUNC_ADD,

  /**
   * 像素值按组件相减（源 - 目标）。这用于透明度的Alpha混合。
   *
   * @type {number}
   * @constant
   */
  SUBTRACT: WebGLConstants.FUNC_SUBTRACT,

  /**
   * 像素值按组件相减（目标 - 源）。
   *
   * @type {number}
   * @constant
   */
  REVERSE_SUBTRACT: WebGLConstants.FUNC_REVERSE_SUBTRACT,

  /**
   * 像素值传递给最小函数（min(source, destination)）。
   *
   * 此公式在每个像素颜色组件上操作。
   *
   * @type {number}
   * @constant
   */
  MIN: WebGLConstants.MIN,

  /**
   * 像素值传递给最大函数（max(source, destination)）。
   *
   * 此公式在每个像素颜色组件上操作。
   *
   * @type {number}
   * @constant
   */
  MAX: WebGLConstants.MAX,
};
export default Object.freeze(BlendEquation);
