import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定混合因子的计算方式。
 *
 * @enum {number}
 */

const BlendFunction = {
  /**
   * 混合因子的值为零。
   *
   * @type {number}
   * @constant
   */
  ZERO: WebGLConstants.ZERO,

  /**
   * 混合因子的值为一。
   *
   * @type {number}
   * @constant
   */
  ONE: WebGLConstants.ONE,


  /**
  * 混合因子是源颜色。
  *
  * @type {number}
  * @constant
  */
  SOURCE_COLOR: WebGLConstants.SRC_COLOR,

  /**
   * 混合因子是一减去源颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_COLOR: WebGLConstants.ONE_MINUS_SRC_COLOR,

  /**
   * 混合因子是目标颜色。
   *
   * @type {number}
   * @constant
   */
  DESTINATION_COLOR: WebGLConstants.DST_COLOR,

  /**
   * 混合因子是一减去目标颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_COLOR: WebGLConstants.ONE_MINUS_DST_COLOR,

  /**
   * 混合因子是源 alpha。
   *
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA: WebGLConstants.SRC_ALPHA,

  /**
   * 混合因子是一减去源 alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_SOURCE_ALPHA: WebGLConstants.ONE_MINUS_SRC_ALPHA,

  /**
   * 混合因子是目标 alpha。
   *
   * @type {number}
   * @constant
   */
  DESTINATION_ALPHA: WebGLConstants.DST_ALPHA,

  /**
   * 混合因子是一减去目标 alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_DESTINATION_ALPHA: WebGLConstants.ONE_MINUS_DST_ALPHA,

  /**
   * 混合因子是常数颜色。
   *
   * @type {number}
   * @constant
   */
  CONSTANT_COLOR: WebGLConstants.CONSTANT_COLOR,

  /**
   * 混合因子是一减去常数颜色。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_COLOR: WebGLConstants.ONE_MINUS_CONSTANT_COLOR,

  /**
   * 混合因子是常数 alpha。
   *
   * @type {number}
   * @constant
   */
  CONSTANT_ALPHA: WebGLConstants.CONSTANT_ALPHA,

  /**
   * 混合因子是一减去常数 alpha。
   *
   * @type {number}
   * @constant
   */
  ONE_MINUS_CONSTANT_ALPHA: WebGLConstants.ONE_MINUS_CONSTANT_ALPHA,

  /**
   * 混合因子是饱和的源 alpha。
   *
   * @type {number}
   * @constant
   */
  SOURCE_ALPHA_SATURATE: WebGLConstants.SRC_ALPHA_SATURATE,
};
export default Object.freeze(BlendFunction);
