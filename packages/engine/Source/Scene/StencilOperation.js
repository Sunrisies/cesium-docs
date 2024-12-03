import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 根据模板测试的结果确定采取的操作。
 *
 * @enum {number}
 */
const StencilOperation = {
  /**
   * 将模板缓冲区值设置为零。
   *
   * @type {number}
   * @constant
   */
  ZERO: WebGLConstants.ZERO,

  /**
   * 不改变模板缓冲区。
   *
   * @type {number}
   * @constant
   */
  KEEP: WebGLConstants.KEEP,

  /**
   * 用参考值替换模板缓冲区值。
   *
   * @type {number}
   * @constant
   */
  REPLACE: WebGLConstants.REPLACE,

  /**
   * 增加模板缓冲区值，限制为无符号字节。
   *
   * @type {number}
   * @constant
   */
  INCREMENT: WebGLConstants.INCR,

  /**
   * 减少模板缓冲区值，限制为零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT: WebGLConstants.DECR,

  /**
   * 对现有模板缓冲区值进行按位取反。
   *
   * @type {number}
   * @constant
   */
  INVERT: WebGLConstants.INVERT,

  /**
   * 增加模板缓冲区值，超过无符号字节范围时回绕到零。
   *
   * @type {number}
   * @constant
   */
  INCREMENT_WRAP: WebGLConstants.INCR_WRAP,

  /**
   * 减少模板缓冲区值，超过零时回绕到最大无符号字节，而不是低于零。
   *
   * @type {number}
   * @constant
   */
  DECREMENT_WRAP: WebGLConstants.DECR_WRAP,
};
export default Object.freeze(StencilOperation);
